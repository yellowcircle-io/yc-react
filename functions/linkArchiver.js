/**
 * Link Archiver Firebase Functions - Pocket Alternative
 *
 * HTTP endpoints for saving, managing, and archiving web links.
 * Integrates with yellowCircle Unity ecosystem.
 *
 * @created 2026-01-17
 * @author Sleepless Agent
 *
 * To integrate: Add to index.js exports or merge functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const https = require("https");
const http = require("http");
const { JSDOM } = require("jsdom");

// Note: admin.initializeApp() should be called in main index.js
// Lazy initialization - getDb() called inside functions, not at module load
const getDb = () => admin.firestore();

// ============================================
// Configuration
// ============================================

const LINKS_COLLECTION = "links";
const FOLDERS_COLLECTION = "link_folders";

// CORS middleware
const setCors = (response) => {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

// ============================================
// Authentication Helper
// ============================================

/**
 * Verify user authentication via Firebase Auth
 * @param {Object} request - HTTP request
 * @returns {Object} { success, uid, email, error }
 */
const verifyUserAuth = async (request) => {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return { success: false, error: "Missing authorization header" };
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email
    };
  } catch (error) {
    console.error("Auth error:", error);
    return { success: false, error: "Invalid token" };
  }
};

// ============================================
// Content Extraction
// ============================================

/**
 * Fetch and parse URL content
 * Uses Mozilla Readability-like extraction
 */
const fetchUrlContent = async (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;

    const request = protocol.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; yellowCircle LinkArchiver/1.0)",
        "Accept": "text/html,application/xhtml+xml"
      },
      timeout: 10000
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return fetchUrlContent(response.headers.location).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      let html = "";
      response.on("data", chunk => html += chunk);
      response.on("end", () => {
        try {
          const dom = new JSDOM(html, { url });
          const doc = dom.window.document;

          // Extract metadata
          const title = doc.querySelector("title")?.textContent ||
                       doc.querySelector('meta[property="og:title"]')?.content ||
                       "Untitled";

          const description = doc.querySelector('meta[name="description"]')?.content ||
                             doc.querySelector('meta[property="og:description"]')?.content ||
                             "";

          const image = doc.querySelector('meta[property="og:image"]')?.content ||
                       doc.querySelector('meta[name="twitter:image"]')?.content ||
                       null;

          const author = doc.querySelector('meta[name="author"]')?.content ||
                        doc.querySelector('[rel="author"]')?.textContent ||
                        null;

          const publishedTime = doc.querySelector('meta[property="article:published_time"]')?.content ||
                               doc.querySelector('time[datetime]')?.getAttribute("datetime") ||
                               null;

          // Extract main content (simplified Readability)
          let content = "";
          const article = doc.querySelector("article") ||
                         doc.querySelector('[role="main"]') ||
                         doc.querySelector("main") ||
                         doc.querySelector(".post-content") ||
                         doc.querySelector(".entry-content") ||
                         doc.querySelector(".content");

          if (article) {
            // Remove scripts, styles, nav, footer
            article.querySelectorAll("script, style, nav, footer, .comments, .sidebar").forEach(el => el.remove());
            content = article.textContent?.trim() || "";
          } else {
            // Fallback: get body text
            const body = doc.querySelector("body");
            if (body) {
              body.querySelectorAll("script, style, nav, header, footer").forEach(el => el.remove());
              content = body.textContent?.trim().substring(0, 5000) || "";
            }
          }

          // Clean up whitespace
          content = content.replace(/\s+/g, " ").trim();

          resolve({
            title: title.trim(),
            excerpt: description.trim() || content.substring(0, 200) + "...",
            content: content.substring(0, 50000), // Limit content size
            image,
            author,
            publishedAt: publishedTime ? new Date(publishedTime) : null
          });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });

    request.on("error", reject);
    request.on("timeout", () => {
      request.destroy();
      reject(new Error("Request timeout"));
    });
  });
};

/**
 * Extract domain from URL
 */
const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
};

/**
 * Estimate reading time
 */
const estimateReadTime = (content) => {
  const wordsPerMinute = 200;
  const words = (content || "").split(/\s+/).length;
  return Math.ceil((words / wordsPerMinute) * 60);
};

// ============================================
// API Endpoints
// ============================================

/**
 * Save a new link
 * POST /api/links
 * Body: { url, title?, tags?, folderId? }
 */
exports.saveLink = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Verify authentication
  const auth = await verifyUserAuth(request);
  if (!auth.success) {
    response.status(401).json({ error: auth.error });
    return;
  }

  try {
    const { url, title, tags, folderId } = request.body;

    if (!url) {
      response.status(400).json({ error: "URL is required" });
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      response.status(400).json({ error: "Invalid URL" });
      return;
    }

    // Check for duplicate
    const existingQuery = await getDb().collection(LINKS_COLLECTION)
      .where("userId", "==", auth.uid)
      .where("url", "==", url)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      const existingLink = { id: existingQuery.docs[0].id, ...existingQuery.docs[0].data() };
      response.json({
        success: true,
        link: existingLink,
        duplicate: true,
        message: "Link already saved"
      });
      return;
    }

    // Fetch content
    let extracted = {};
    try {
      extracted = await fetchUrlContent(url);
    } catch (fetchError) {
      console.warn("Content extraction failed:", fetchError.message);
      // Continue with basic info
    }

    const domain = extractDomain(url);

    // Create link document
    const linkRef = getDb().collection(LINKS_COLLECTION).doc();
    const link = {
      id: linkRef.id,
      userId: auth.uid,

      // Core fields
      url,
      title: title || extracted.title || "Untitled",
      excerpt: extracted.excerpt || "",
      content: extracted.content || "",

      // Metadata
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      image: extracted.image || null,
      author: extracted.author || null,
      publishedAt: extracted.publishedAt || null,

      // Organization
      tags: tags || [],
      folderId: folderId || null,
      starred: false,
      archived: false,

      // Reading progress
      readProgress: 0,
      readTime: 0,
      estimatedReadTime: estimateReadTime(extracted.content || ""),

      // AI (to be populated)
      aiSummary: null,
      aiTags: [],

      // Archive (to be populated)
      archiveUrl: null,
      archiveTimestamp: null,

      // Unity integration
      unityNodeId: null,
      unityCapsuleId: null,

      // Timestamps
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      readAt: null
    };

    await linkRef.set(link);

    console.log(`✅ Link saved: ${url} by ${auth.email}`);

    response.json({
      success: true,
      link,
      message: "Link saved successfully"
    });

  } catch (error) {
    console.error("saveLink error:", error);
    response.status(500).json({ error: "Failed to save link" });
  }
});

/**
 * Get user's links
 * GET /api/links
 * Query: folderId, tag, starred, archived, limit, startAfter
 */
exports.getLinks = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const auth = await verifyUserAuth(request);
  if (!auth.success) {
    response.status(401).json({ error: auth.error });
    return;
  }

  try {
    const {
      folderId,
      tag,
      starred,
      archived = "false",
      limit: pageLimit = "20",
      startAfter
    } = request.query;

    let query = getDb().collection(LINKS_COLLECTION)
      .where("userId", "==", auth.uid)
      .where("archived", "==", archived === "true");

    if (folderId) {
      query = query.where("folderId", "==", folderId);
    }

    if (tag) {
      query = query.where("tags", "array-contains", tag);
    }

    if (starred === "true") {
      query = query.where("starred", "==", true);
    }

    query = query.orderBy("savedAt", "desc").limit(parseInt(pageLimit));

    if (startAfter) {
      const startDoc = await getDb().collection(LINKS_COLLECTION).doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.get();
    const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    response.json({
      success: true,
      links,
      hasMore: links.length === parseInt(pageLimit),
      lastId: links.length > 0 ? links[links.length - 1].id : null
    });

  } catch (error) {
    console.error("getLinks error:", error);
    response.status(500).json({ error: "Failed to get links" });
  }
});

/**
 * Update a link
 * PUT /api/links/:id
 * Body: { title?, tags?, folderId?, starred?, archived? }
 */
exports.updateLink = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "PUT" && request.method !== "PATCH") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const auth = await verifyUserAuth(request);
  if (!auth.success) {
    response.status(401).json({ error: auth.error });
    return;
  }

  try {
    const { id } = request.query;
    if (!id) {
      response.status(400).json({ error: "Link ID required" });
      return;
    }

    const linkRef = getDb().collection(LINKS_COLLECTION).doc(id);
    const linkDoc = await linkRef.get();

    if (!linkDoc.exists) {
      response.status(404).json({ error: "Link not found" });
      return;
    }

    if (linkDoc.data().userId !== auth.uid) {
      response.status(403).json({ error: "Access denied" });
      return;
    }

    const allowedFields = ["title", "tags", "folderId", "starred", "archived", "readProgress"];
    const updates = {};

    for (const field of allowedFields) {
      if (request.body[field] !== undefined) {
        updates[field] = request.body[field];
      }
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await linkRef.update(updates);

    response.json({
      success: true,
      message: "Link updated"
    });

  } catch (error) {
    console.error("updateLink error:", error);
    response.status(500).json({ error: "Failed to update link" });
  }
});

/**
 * Delete a link
 * DELETE /api/links/:id
 */
exports.deleteLink = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "DELETE") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const auth = await verifyUserAuth(request);
  if (!auth.success) {
    response.status(401).json({ error: auth.error });
    return;
  }

  try {
    const { id } = request.query;
    if (!id) {
      response.status(400).json({ error: "Link ID required" });
      return;
    }

    const linkRef = getDb().collection(LINKS_COLLECTION).doc(id);
    const linkDoc = await linkRef.get();

    if (!linkDoc.exists) {
      response.status(404).json({ error: "Link not found" });
      return;
    }

    if (linkDoc.data().userId !== auth.uid) {
      response.status(403).json({ error: "Access denied" });
      return;
    }

    await linkRef.delete();

    console.log(`🗑️ Link deleted: ${id} by ${auth.email}`);

    response.json({
      success: true,
      message: "Link deleted"
    });

  } catch (error) {
    console.error("deleteLink error:", error);
    response.status(500).json({ error: "Failed to delete link" });
  }
});

/**
 * Import links from Pocket export
 * POST /api/links/import
 * Body: { source: "pocket", data: [...] }
 */
exports.importLinks = functions
  .runWith({ timeoutSeconds: 300, memory: "512MB" })
  .https.onRequest(async (request, response) => {
    setCors(response);

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const auth = await verifyUserAuth(request);
    if (!auth.success) {
      response.status(401).json({ error: auth.error });
      return;
    }

    try {
      const { source, data } = request.body;

      if (source !== "pocket" || !Array.isArray(data)) {
        response.status(400).json({ error: "Invalid import data" });
        return;
      }

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      const batch = getDb().batch();
      const existingUrls = new Set();

      // Get existing URLs
      const existingQuery = await getDb().collection(LINKS_COLLECTION)
        .where("userId", "==", auth.uid)
        .select("url")
        .get();

      existingQuery.docs.forEach(doc => existingUrls.add(doc.data().url));

      for (const item of data.slice(0, 500)) { // Limit to 500 per import
        const url = item.given_url || item.resolved_url;

        if (!url || existingUrls.has(url)) {
          skipped++;
          continue;
        }

        try {
          const domain = extractDomain(url);
          const linkRef = getDb().collection(LINKS_COLLECTION).doc();

          batch.set(linkRef, {
            id: linkRef.id,
            userId: auth.uid,
            url,
            title: item.given_title || item.resolved_title || "Untitled",
            excerpt: item.excerpt || "",
            content: "",
            domain,
            favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            image: item.top_image_url || null,
            author: null,
            publishedAt: null,
            tags: item.tags ? Object.keys(item.tags) : [],
            folderId: null,
            starred: item.favorite === "1",
            archived: item.status === "1",
            readProgress: 0,
            readTime: item.time_read ? parseInt(item.time_read) : 0,
            estimatedReadTime: item.word_count ? Math.ceil(item.word_count / 200 * 60) : 0,
            aiSummary: null,
            aiTags: [],
            archiveUrl: null,
            archiveTimestamp: null,
            unityNodeId: null,
            unityCapsuleId: null,
            savedAt: item.time_added
              ? admin.firestore.Timestamp.fromMillis(parseInt(item.time_added) * 1000)
              : admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            readAt: item.time_read
              ? admin.firestore.Timestamp.fromMillis(parseInt(item.time_read) * 1000)
              : null,
            importedFrom: "pocket"
          });

          existingUrls.add(url);
          imported++;
        } catch (itemError) {
          console.error("Import item error:", itemError);
          errors++;
        }
      }

      await batch.commit();

      console.log(`📥 Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);

      response.json({
        success: true,
        imported,
        skipped,
        errors,
        total: data.length,
        message: `Imported ${imported} links from Pocket`
      });

    } catch (error) {
      console.error("importLinks error:", error);
      response.status(500).json({ error: "Import failed" });
    }
  });

/**
 * Get reading statistics
 * GET /api/links/stats
 */
exports.getLinkStats = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  const auth = await verifyUserAuth(request);
  if (!auth.success) {
    response.status(401).json({ error: auth.error });
    return;
  }

  try {
    const snapshot = await getDb().collection(LINKS_COLLECTION)
      .where("userId", "==", auth.uid)
      .get();

    let totalLinks = 0;
    let readLinks = 0;
    let totalReadTime = 0;
    let starred = 0;
    let archived = 0;
    const tagCounts = {};
    const domainCounts = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalLinks++;

      if (data.readAt) readLinks++;
      totalReadTime += data.readTime || 0;
      if (data.starred) starred++;
      if (data.archived) archived++;

      (data.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      if (data.domain) {
        domainCounts[data.domain] = (domainCounts[data.domain] || 0) + 1;
      }
    });

    // Top 10 tags and domains
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    const topDomains = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    response.json({
      success: true,
      stats: {
        totalLinks,
        readLinks,
        unreadLinks: totalLinks - readLinks - archived,
        totalReadTime,
        averageReadTime: readLinks > 0 ? Math.round(totalReadTime / readLinks) : 0,
        starred,
        archived,
        topTags,
        topDomains
      }
    });

  } catch (error) {
    console.error("getLinkStats error:", error);
    response.status(500).json({ error: "Failed to get stats" });
  }
});

/**
 * Generate AI summary for a link
 * POST /api/links/:id/summarize
 *
 * Uses Gemini API (with Ollama fallback for local development)
 * to generate a concise summary and auto-tags for the link.
 */
exports.summarizeLink = functions
  .runWith({ timeoutSeconds: 60, memory: "256MB" })
  .https.onRequest(async (request, response) => {
    setCors(response);

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const auth = await verifyUserAuth(request);
    if (!auth.success) {
      response.status(401).json({ error: auth.error });
      return;
    }

    try {
      const { id } = request.body;

      if (!id) {
        response.status(400).json({ error: "Link ID required" });
        return;
      }

      // Get the link
      const linkRef = getDb().collection(LINKS_COLLECTION).doc(id);
      const linkDoc = await linkRef.get();

      if (!linkDoc.exists) {
        response.status(404).json({ error: "Link not found" });
        return;
      }

      const linkData = linkDoc.data();

      if (linkData.userId !== auth.uid) {
        response.status(403).json({ error: "Access denied" });
        return;
      }

      // Skip if already has AI summary
      if (linkData.aiSummary) {
        response.json({
          success: true,
          summary: linkData.aiSummary,
          tags: linkData.aiTags || [],
          cached: true
        });
        return;
      }

      // Prepare content for summarization
      const contentToSummarize = linkData.content || linkData.excerpt || linkData.title;

      if (!contentToSummarize || contentToSummarize.length < 50) {
        response.status(400).json({ error: "Insufficient content to summarize" });
        return;
      }

      // Generate summary using Gemini API
      const summary = await generateAISummary(
        contentToSummarize.slice(0, 5000),
        linkData.title
      );

      // Generate auto-tags
      const aiTags = await generateAITags(
        contentToSummarize.slice(0, 2000),
        linkData.title
      );

      // Update the link
      await linkRef.update({
        aiSummary: summary,
        aiTags: aiTags,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`🤖 AI summary generated for: ${linkData.title}`);

      response.json({
        success: true,
        summary,
        tags: aiTags,
        cached: false
      });

    } catch (error) {
      console.error("summarizeLink error:", error);
      response.status(500).json({ error: "Failed to generate summary" });
    }
  });

/**
 * Generate AI summary using Gemini API
 * Falls back to a simple extraction if API fails
 */
async function generateAISummary(content, title) {
  const GEMINI_API_KEY = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.warn("No Gemini API key configured, using fallback summary");
    return generateFallbackSummary(content);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Summarize the following article in 2-3 concise sentences. Focus on the main points and key takeaways. Title: "${title}"\n\nContent:\n${content}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 150
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      throw new Error("No summary generated");
    }

    return summary.trim();
  } catch (error) {
    console.error("Gemini API error:", error);
    return generateFallbackSummary(content);
  }
}

/**
 * Generate AI tags using Gemini API
 */
async function generateAITags(content, title) {
  const GEMINI_API_KEY = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return extractFallbackTags(content, title);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract 3-5 relevant topic tags from this article. Return only the tags as a comma-separated list, lowercase, no hashtags. Title: "${title}"\n\nContent:\n${content}`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 50
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const tagsText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!tagsText) {
      throw new Error("No tags generated");
    }

    return tagsText
      .split(",")
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length < 30)
      .slice(0, 5);
  } catch (error) {
    console.error("Gemini tags error:", error);
    return extractFallbackTags(content, title);
  }
}

/**
 * Fallback summary extraction (no AI)
 */
function generateFallbackSummary(content) {
  // Extract first meaningful paragraph
  const sentences = content
    .replace(/\s+/g, " ")
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 30)
    .slice(0, 3);

  if (sentences.length === 0) {
    return content.slice(0, 200).trim() + "...";
  }

  return sentences.join(". ").trim() + ".";
}

/**
 * Fallback tag extraction (no AI)
 */
function extractFallbackTags(content, title) {
  const combined = `${title} ${content}`.toLowerCase();

  // Common topic keywords
  const topicPatterns = [
    "technology", "programming", "javascript", "python", "ai", "machine learning",
    "design", "ux", "startup", "business", "marketing", "productivity",
    "health", "science", "research", "tutorial", "guide", "news",
    "finance", "crypto", "web3", "mobile", "security", "data"
  ];

  const foundTags = topicPatterns.filter(topic =>
    combined.includes(topic)
  );

  // Also extract potential tags from title words
  const titleWords = title
    .toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 4 && !["about", "which", "where", "there", "their", "would", "could", "should"].includes(word))
    .slice(0, 3);

  return [...new Set([...foundTags, ...titleWords])].slice(0, 5);
}

/**
 * Archive a link (create permanent snapshot)
 * POST /api/links/:id/archive
 */
exports.archiveSnapshot = functions
  .runWith({ timeoutSeconds: 120, memory: "512MB" })
  .https.onRequest(async (request, response) => {
    setCors(response);

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const auth = await verifyUserAuth(request);
    if (!auth.success) {
      response.status(401).json({ error: auth.error });
      return;
    }

    try {
      const { id } = request.body;

      if (!id) {
        response.status(400).json({ error: "Link ID required" });
        return;
      }

      const linkRef = getDb().collection(LINKS_COLLECTION).doc(id);
      const linkDoc = await linkRef.get();

      if (!linkDoc.exists) {
        response.status(404).json({ error: "Link not found" });
        return;
      }

      const linkData = linkDoc.data();

      if (linkData.userId !== auth.uid) {
        response.status(403).json({ error: "Access denied" });
        return;
      }

      // Skip if already archived
      if (linkData.archiveUrl) {
        response.json({
          success: true,
          archiveUrl: linkData.archiveUrl,
          archiveTimestamp: linkData.archiveTimestamp,
          cached: true
        });
        return;
      }

      // Fetch the page content
      const pageContent = await fetchFullPageContent(linkData.url);

      if (!pageContent) {
        response.status(400).json({ error: "Could not archive page content" });
        return;
      }

      // Store in Firebase Storage
      const bucket = admin.storage().bucket();
      const filename = `archives/${auth.uid}/${id}.html`;
      const file = bucket.file(filename);

      await file.save(pageContent, {
        contentType: "text/html",
        metadata: {
          originalUrl: linkData.url,
          archivedAt: new Date().toISOString(),
          linkId: id
        }
      });

      // Make file publicly accessible (or use signed URLs)
      await file.makePublic();
      const archiveUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      // Update link with archive info
      await linkRef.update({
        archiveUrl,
        archiveTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`📦 Archive created for: ${linkData.title}`);

      response.json({
        success: true,
        archiveUrl,
        archiveTimestamp: new Date().toISOString(),
        cached: false
      });

    } catch (error) {
      console.error("archiveSnapshot error:", error);
      response.status(500).json({ error: "Failed to create archive" });
    }
  });

/**
 * Fetch full page content for archiving
 */
async function fetchFullPageContent(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith("https") ? https : http;

    const request = protocol.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; yellowCircle LinkArchiver/1.0)",
        "Accept": "text/html,application/xhtml+xml"
      },
      timeout: 30000
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return fetchFullPageContent(response.headers.location).then(resolve);
      }

      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }

      let html = "";
      response.on("data", chunk => html += chunk);
      response.on("end", () => {
        // Add archive notice to the HTML
        const archiveNotice = `
          <div style="position:fixed;top:0;left:0;right:0;background:#fbbf24;color:#171717;padding:10px;text-align:center;z-index:99999;font-family:sans-serif;">
            📦 This is an archived snapshot from <a href="${url}" target="_blank">${url}</a>
            - Saved by yellowCircle Link Archiver
          </div>
          <div style="height:50px;"></div>
        `;

        const modifiedHtml = html.replace(/<body[^>]*>/i, (match) => {
          return match + archiveNotice;
        });

        resolve(modifiedHtml);
      });
    });

    request.on("error", () => resolve(null));
    request.on("timeout", () => {
      request.destroy();
      resolve(null);
    });
  });
}

// Functions are already exported via exports.xxx = functions.https.onRequest(...)
// No module.exports needed - require('./linkArchiver') will use the exports object
