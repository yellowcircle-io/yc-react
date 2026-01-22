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

          /**
           * Extract text content while preserving paragraph structure
           * @param {Element} element - DOM element to extract from
           * @returns {string} - Text with paragraph breaks preserved
           */
          const extractWithParagraphs = (element) => {
            if (!element) return "";

            // Clone to avoid modifying original
            const clone = element.cloneNode(true);

            // Remove noise elements
            clone.querySelectorAll("script, style, nav, footer, .comments, .sidebar, .share-buttons, .related-posts, .ad, .advertisement, .social-share").forEach(el => el.remove());

            // Block elements that should create paragraph breaks
            const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'article', 'section', 'br'];

            // Add paragraph markers before block elements
            blockTags.forEach(tag => {
              clone.querySelectorAll(tag).forEach(el => {
                // Add newlines to preserve paragraph structure
                const textNode = doc.createTextNode('\n\n');
                if (el.parentNode) {
                  el.parentNode.insertBefore(textNode, el);
                }
              });
            });

            // Get text content with markers
            let text = clone.textContent || "";

            // Clean up: normalize multiple newlines to double newline (paragraph break)
            text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');  // Multiple blank lines → double newline
            text = text.replace(/[ \t]+/g, ' ');             // Multiple spaces/tabs → single space
            text = text.replace(/\n /g, '\n');               // Newline + space → just newline
            text = text.replace(/ \n/g, '\n');               // Space + newline → just newline

            return text.trim();
          };

          /**
           * Extract HTML content with sanitization (preserves markup, images, styling)
           * @param {Element} element - DOM element to extract from
           * @returns {string} - Sanitized HTML string
           */
          const extractHtmlContent = (element) => {
            if (!element) return "";

            // Clone to avoid modifying original
            const clone = element.cloneNode(true);

            // Remove dangerous/unwanted elements
            clone.querySelectorAll("script, style, iframe, object, embed, form, input, button, nav, footer, .comments, .sidebar, .share-buttons, .related-posts, .ad, .advertisement, .social-share, [onclick], [onerror], [onload]").forEach(el => el.remove());

            // Remove event handlers and dangerous attributes from all elements
            clone.querySelectorAll('*').forEach(el => {
              // Remove event handlers
              Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on') || attr.name === 'href' && attr.value.startsWith('javascript:')) {
                  el.removeAttribute(attr.name);
                }
              });
              // Remove style attributes that could be malicious (keep class for potential styling)
              // But allow inline styles for basic formatting
            });

            // Convert relative image URLs to absolute
            clone.querySelectorAll('img').forEach(img => {
              const src = img.getAttribute('src');
              if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                try {
                  const absoluteUrl = new URL(src, url).href;
                  img.setAttribute('src', absoluteUrl);
                } catch (e) {
                  // Invalid URL, remove image
                  img.remove();
                }
              }
              // Add loading="lazy" for performance
              img.setAttribute('loading', 'lazy');
              // Remove srcset to avoid complexity (use main src)
              img.removeAttribute('srcset');
            });

            // Convert relative links to absolute
            clone.querySelectorAll('a').forEach(a => {
              const href = a.getAttribute('href');
              if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
                try {
                  const absoluteUrl = new URL(href, url).href;
                  a.setAttribute('href', absoluteUrl);
                } catch (e) {
                  a.removeAttribute('href');
                }
              }
              // Open links in new tab
              a.setAttribute('target', '_blank');
              a.setAttribute('rel', 'noopener noreferrer');
            });

            // Get the HTML
            let html = clone.innerHTML || "";

            // Basic cleanup
            html = html.replace(/\s+/g, ' ').trim();

            return html;
          };

          let contentHtml = "";

          if (article) {
            content = extractWithParagraphs(article);
            contentHtml = extractHtmlContent(article);
          } else {
            // Fallback: get body text
            const body = doc.querySelector("body");
            if (body) {
              body.querySelectorAll("script, style, nav, header, footer").forEach(el => el.remove());
              content = extractWithParagraphs(body).substring(0, 5000);
              contentHtml = extractHtmlContent(body).substring(0, 100000);
            }
          }

          resolve({
            title: title.trim(),
            excerpt: description.trim() || content.substring(0, 200) + "...",
            content: content.substring(0, 50000), // Plain text for search/read time
            contentHtml: contentHtml.substring(0, 200000), // Rich HTML for reader
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
 * Estimate reading time in seconds
 * @param {string} content - Text content to estimate
 * @returns {number} Estimated read time in seconds (capped at 60 min)
 */
const estimateReadTime = (content) => {
  if (!content || typeof content !== 'string') return 0;

  // Clean content: remove extra whitespace, URLs, and non-word characters
  const cleanContent = content
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/[^\w\s]/g, ' ')          // Replace non-word chars with space
    .replace(/\s+/g, ' ')              // Normalize whitespace
    .trim();

  // Count actual words (minimum 2 characters to be a word)
  const words = cleanContent.split(' ').filter(w => w.length >= 2);
  const wordCount = words.length;

  // Calculate read time: 200-250 WPM is average, use 225
  const wordsPerMinute = 225;
  const minutes = wordCount / wordsPerMinute;
  const seconds = Math.ceil(minutes * 60);

  // Cap at 60 minutes (3600 seconds) - anything longer is likely bad extraction
  const MAX_READ_TIME = 60 * 60; // 60 minutes in seconds
  return Math.min(seconds, MAX_READ_TIME);
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
      contentHtml: extracted.contentHtml || "", // Rich HTML with images/formatting

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

    // Auto-tag: Queue AI processing asynchronously (fire-and-forget)
    // Only trigger if we have content to analyze
    const contentToAnalyze = extracted.content || extracted.excerpt || title;
    if (contentToAnalyze && contentToAnalyze.length >= 50) {
      // Fire-and-forget AI processing (don't await, don't block response)
      processAITagsAsync(linkRef.id, contentToAnalyze, extracted.title || title)
        .then(() => {
          console.log(`🤖 Auto-tagging completed for: ${url}`);
        })
        .catch((err) => {
          console.warn(`⚠️ Auto-tagging failed for ${url}:`, err.message);
        });
    }

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
 * Process AI tags asynchronously (fire-and-forget)
 * This runs after the link is saved without blocking the response
 */
async function processAITagsAsync(linkId, content, title) {
  try {
    // Generate AI tags
    const aiTags = await generateAITags(content.slice(0, 2000), title);

    // Generate AI summary (returns { summary, provider })
    const aiResult = await generateAISummary(content.slice(0, 5000), title);
    const aiSummary = aiResult?.summary || null;

    // Update the link with AI-generated data
    if (aiTags.length > 0 || aiSummary) {
      const linkRef = getDb().collection(LINKS_COLLECTION).doc(linkId);
      const updates = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (aiTags.length > 0) {
        updates.aiTags = aiTags;
      }

      if (aiSummary) {
        updates.aiSummary = aiSummary;
        updates.aiSummaryProvider = aiResult.provider || 'free';
      }

      await linkRef.update(updates);
      console.log(`✅ AI processing complete for link ${linkId}: ${aiTags.length} tags, summary: ${!!aiSummary} (${aiResult?.provider})`);
    }
  } catch (error) {
    console.error(`AI processing error for link ${linkId}:`, error);
    // Don't throw - this is fire-and-forget
  }
}

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

      // Generate summary using tiered AI system
      const aiResult = await generateAISummary(
        contentToSummarize.slice(0, 5000),
        linkData.title,
        auth.uid // Pass user ID for settings lookup
      );
      const summary = aiResult?.summary || null;

      // Generate auto-tags
      const aiTags = await generateAITags(
        contentToSummarize.slice(0, 2000),
        linkData.title
      );

      // Update the link
      await linkRef.update({
        aiSummary: summary,
        aiSummaryProvider: aiResult?.provider || 'free',
        aiTags: aiTags,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`🤖 AI summary generated for: ${linkData.title} (provider: ${aiResult?.provider})`);

      response.json({
        success: true,
        summary,
        provider: aiResult?.provider || 'free',
        tags: aiTags,
        cached: false
      });

    } catch (error) {
      console.error("summarizeLink error:", error);
      response.status(500).json({ error: "Failed to generate summary" });
    }
  });

// ============================================
// AI Provider Configuration (Tiered System)
// ============================================

/**
 * AI Provider Tiers:
 * - free: Uses fallback (no cost) - DEFAULT
 * - groq: Uses Groq free tier (Llama 3.1 - free, has rate limits)
 * - gemini: Uses Google Gemini API (requires API key)
 * - openai: Uses OpenAI API (requires API key)
 * - anthropic: Uses Claude API (requires API key)
 *
 * Users can configure their preferred provider in settings.
 * Falls back to next available provider if current fails.
 */

const AI_PROVIDERS = {
  free: { name: 'Free (Basic)', cost: 'free', requiresKey: false },
  groq: { name: 'Groq (Llama 3.1)', cost: 'free', requiresKey: false, rateLimit: true },
  gemini: { name: 'Google Gemini', cost: 'paid', requiresKey: true },
  openai: { name: 'OpenAI GPT', cost: 'paid', requiresKey: true },
  anthropic: { name: 'Anthropic Claude', cost: 'paid', requiresKey: true }
};

/**
 * Get user's AI settings from Firestore
 * @param {string} userId - User ID
 * @returns {Object} AI settings with provider preference and keys
 */
async function getUserAISettings(userId) {
  if (!userId) return { provider: 'free' };

  try {
    // Get provider preference from userSettings (non-sensitive)
    const userSettingsRef = getDb().collection('userSettings').doc(userId);
    const settingsDoc = await userSettingsRef.get();

    const provider = settingsDoc.exists ? (settingsDoc.data().aiProvider || 'free') : 'free';
    const enableAutoSummary = settingsDoc.exists ? (settingsDoc.data().enableAutoSummary ?? false) : false;

    // Get API keys from secure storage (userSecrets - never sent to client)
    const secretsRef = getDb().collection('userSecrets').doc(userId);
    const secretsDoc = await secretsRef.get();

    const apiKeys = {};
    if (secretsDoc.exists) {
      const aiKeys = secretsDoc.data().aiKeys || {};
      // Only extract the key strings for use by AI functions
      if (aiKeys.gemini?.key) apiKeys.gemini = aiKeys.gemini.key;
      if (aiKeys.openai?.key) apiKeys.openai = aiKeys.openai.key;
      if (aiKeys.anthropic?.key) apiKeys.anthropic = aiKeys.anthropic.key;
    }

    return {
      provider,
      apiKeys,
      enableAutoSummary
    };
  } catch (error) {
    console.error('Error fetching user AI settings:', error);
    return { provider: 'free' };
  }
}

/**
 * Generate AI summary using Groq free tier (Llama 3.1)
 * Free tier with rate limits
 */
async function generateGroqSummary(content, title) {
  const GROQ_API_KEY = functions.config().groq?.api_key || process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    console.warn("No Groq API key configured, using fallback");
    return null;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'user',
          content: `Summarize the following article in 2-3 concise sentences. Focus on the main points and key takeaways.\n\nTitle: "${title}"\n\nContent:\n${content}`
        }],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Groq API error:', error);
    return null;
  }
}

/**
 * Generate AI summary using Gemini API
 */
async function generateGeminiSummary(content, title, userApiKey = null) {
  const GEMINI_API_KEY = userApiKey || functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return null;
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
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
}

/**
 * Generate AI summary using OpenAI API
 */
async function generateOpenAISummary(content, title, userApiKey = null) {
  const OPENAI_API_KEY = userApiKey || functions.config().openai?.api_key || process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Summarize the following article in 2-3 concise sentences. Focus on the main points and key takeaways.\n\nTitle: "${title}"\n\nContent:\n${content}`
        }],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}

/**
 * Generate AI summary using tiered provider system
 * Falls back through providers: user preference -> groq -> gemini -> fallback
 *
 * @param {string} content - Article content
 * @param {string} title - Article title
 * @param {string} userId - User ID for settings lookup (optional)
 * @returns {Promise<{summary: string, provider: string}>}
 */
async function generateAISummary(content, title, userId = null) {
  // Get user's AI settings if userId provided
  const userSettings = userId ? await getUserAISettings(userId) : { provider: 'free' };
  const userApiKeys = userSettings.apiKeys || {};

  // Provider priority based on user preference
  const providerOrder = [];

  // If user has a preference, try it first
  if (userSettings.provider && userSettings.provider !== 'free') {
    providerOrder.push(userSettings.provider);
  }

  // Add fallback providers (free options first)
  if (!providerOrder.includes('groq')) providerOrder.push('groq');
  if (!providerOrder.includes('gemini')) providerOrder.push('gemini');
  providerOrder.push('free'); // Always have free fallback

  // Try each provider in order
  for (const provider of providerOrder) {
    let summary = null;

    switch (provider) {
      case 'groq':
        summary = await generateGroqSummary(content, title);
        break;
      case 'gemini':
        summary = await generateGeminiSummary(content, title, userApiKeys.gemini);
        break;
      case 'openai':
        summary = await generateOpenAISummary(content, title, userApiKeys.openai);
        break;
      case 'free':
        summary = generateFallbackSummary(content);
        break;
    }

    if (summary) {
      console.log(`✅ AI summary generated using provider: ${provider}`);
      return { summary, provider };
    }
  }

  // Ultimate fallback
  return { summary: generateFallbackSummary(content), provider: 'free' };
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

// ============================================
// Personal API Token System
// ============================================

const API_TOKENS_COLLECTION = 'apiTokens';

/**
 * Generate a secure random API token
 */
const generateSecureToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'yc_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Verify user by API token
 * @param {string} token - API token
 * @returns {Object} { success, uid, email, error }
 */
const verifyApiToken = async (token) => {
  if (!token || !token.startsWith('yc_')) {
    return { success: false, error: 'Invalid token format' };
  }

  try {
    const tokenDoc = await getDb().collection(API_TOKENS_COLLECTION)
      .where('token', '==', token)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (tokenDoc.empty) {
      return { success: false, error: 'Invalid or expired token' };
    }

    const tokenData = tokenDoc.docs[0].data();
    return {
      success: true,
      uid: tokenData.userId,
      email: tokenData.email
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: 'Token verification failed' };
  }
};

/**
 * Quick Save - Save link using personal API token
 * POST /quickSave
 * Header: X-API-Token: yc_xxxxx
 * Body: { url, title?, tags? } OR Query: ?url=xxx&title=xxx&tags=xxx
 *
 * This endpoint allows saving links without Firebase Auth,
 * useful for external integrations (Slack, iOS Shortcuts, etc.)
 */
exports.quickSave = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Accept both GET and POST
  if (request.method !== "POST" && request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Get token from header or query
  const token = request.headers['x-api-token'] || request.query.token;

  if (!token) {
    response.status(401).json({
      error: "API token required",
      hint: "Set X-API-Token header or add ?token=xxx query param"
    });
    return;
  }

  // Verify token
  const auth = await verifyApiToken(token);
  if (!auth.success) {
    response.status(401).json({ error: auth.error });
    return;
  }

  try {
    // Get URL from body (POST) or query (GET)
    const url = request.body?.url || request.query.url;
    const title = request.body?.title || request.query.title;
    const tagsParam = request.body?.tags || request.query.tags;
    const tags = Array.isArray(tagsParam)
      ? tagsParam
      : typeof tagsParam === 'string'
        ? tagsParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

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
        link: { id: existingLink.id, title: existingLink.title, url: existingLink.url },
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
    }

    const domain = extractDomain(url);

    // Create link document
    const linkRef = getDb().collection(LINKS_COLLECTION).doc();
    const link = {
      id: linkRef.id,
      userId: auth.uid,
      url,
      title: title || extracted.title || "Untitled",
      excerpt: extracted.excerpt || "",
      content: extracted.content || "",
      contentHtml: extracted.contentHtml || "", // Rich HTML with images/formatting
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      image: extracted.image || null,
      author: extracted.author || null,
      publishedAt: extracted.publishedAt || null,
      tags: tags.length > 0 ? tags : ['quick-save'],
      folderId: null,
      starred: false,
      archived: false,
      readProgress: 0,
      readTime: 0,
      estimatedReadTime: estimateReadTime(extracted.content || ""),
      aiSummary: null,
      aiTags: [],
      archiveUrl: null,
      archiveTimestamp: null,
      unityNodeId: null,
      unityCapsuleId: null,
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      readAt: null,
      savedVia: 'api-token'
    };

    await linkRef.set(link);

    console.log(`📎 Quick save: ${url} for user ${auth.uid}`);

    response.json({
      success: true,
      link: {
        id: link.id,
        title: link.title,
        url: link.url,
        domain: link.domain
      },
      message: "Link saved successfully"
    });

  } catch (error) {
    console.error("quickSave error:", error);
    response.status(500).json({ error: "Failed to save link" });
  }
});

/**
 * Generate or regenerate personal API token
 * POST /generateApiToken
 * Requires Firebase Auth
 */
exports.generateApiToken = functions.https.onRequest(async (request, response) => {
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
    // Deactivate any existing tokens for this user
    const existingTokens = await getDb().collection(API_TOKENS_COLLECTION)
      .where('userId', '==', auth.uid)
      .where('active', '==', true)
      .get();

    const batch = getDb().batch();
    existingTokens.docs.forEach(doc => {
      batch.update(doc.ref, { active: false, deactivatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });

    // Create new token
    const newToken = generateSecureToken();
    const tokenRef = getDb().collection(API_TOKENS_COLLECTION).doc();
    batch.set(tokenRef, {
      id: tokenRef.id,
      userId: auth.uid,
      email: auth.email,
      token: newToken,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();

    console.log(`🔑 Generated API token for user ${auth.uid}`);

    // Generate the quick save URL for convenience
    const quickSaveUrl = `https://us-central1-yellowcircle-app.cloudfunctions.net/linkArchiverQuickSave?token=${newToken}&url=`;

    response.json({
      success: true,
      token: newToken,
      quickSaveUrl,
      usage: {
        curl: `curl -X POST "${quickSaveUrl}https://example.com"`,
        bookmarklet: `javascript:(function(){window.open('${quickSaveUrl}'+encodeURIComponent(location.href))})();`,
        slack: `Use: !save [url] with configured token`,
        shortcut: `Open URL: ${quickSaveUrl}[URL]`
      }
    });

  } catch (error) {
    console.error("generateApiToken error:", error);
    response.status(500).json({ error: "Failed to generate token" });
  }
});

/**
 * Get current API token (if any)
 * GET /getApiToken
 * Requires Firebase Auth
 */
exports.getApiToken = functions.https.onRequest(async (request, response) => {
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
    const tokenDoc = await getDb().collection(API_TOKENS_COLLECTION)
      .where('userId', '==', auth.uid)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (tokenDoc.empty) {
      response.json({
        success: true,
        hasToken: false,
        message: "No active API token. Use generateApiToken to create one."
      });
      return;
    }

    const tokenData = tokenDoc.docs[0].data();
    const quickSaveUrl = `https://us-central1-yellowcircle-app.cloudfunctions.net/linkArchiverQuickSave?token=${tokenData.token}&url=`;

    response.json({
      success: true,
      hasToken: true,
      token: tokenData.token,
      createdAt: tokenData.createdAt,
      quickSaveUrl,
      usage: {
        curl: `curl -X POST "${quickSaveUrl}https://example.com"`,
        bookmarklet: `javascript:(function(){window.open('${quickSaveUrl}'+encodeURIComponent(location.href))})();`,
        shortcut: `Open URL: ${quickSaveUrl}[URL]`
      }
    });

  } catch (error) {
    console.error("getApiToken error:", error);
    response.status(500).json({ error: "Failed to get token" });
  }
});

/**
 * Revoke API token
 * POST /revokeApiToken
 * Requires Firebase Auth
 */
exports.revokeApiToken = functions.https.onRequest(async (request, response) => {
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
    const existingTokens = await getDb().collection(API_TOKENS_COLLECTION)
      .where('userId', '==', auth.uid)
      .where('active', '==', true)
      .get();

    const batch = getDb().batch();
    existingTokens.docs.forEach(doc => {
      batch.update(doc.ref, {
        active: false,
        deactivatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    console.log(`🔒 Revoked API tokens for user ${auth.uid}`);

    response.json({
      success: true,
      message: "API token revoked",
      revokedCount: existingTokens.docs.length
    });

  } catch (error) {
    console.error("revokeApiToken error:", error);
    response.status(500).json({ error: "Failed to revoke token" });
  }
});

/**
 * Create Vanity Slug - Admin only
 * POST /createVanitySlug
 * Body: { slug, email }
 * Requires Firebase Auth (admin only)
 */
exports.createVanitySlug = functions.https.onRequest(async (request, response) => {
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

  // Check if user is admin (hardcoded for now)
  const ADMIN_EMAILS = ['christopher@yellowcircle.io', 'dash@dashkolos.com'];
  if (!ADMIN_EMAILS.includes(auth.email)) {
    response.status(403).json({ error: "Admin access required" });
    return;
  }

  try {
    const { slug, email } = request.body;

    if (!slug || !email) {
      response.status(400).json({ error: "Missing slug or email" });
      return;
    }

    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Check if slug already exists
    const existingSlug = await getDb().collection('vanitySlugs').doc(normalizedSlug).get();
    if (existingSlug.exists) {
      response.status(409).json({
        error: "Slug already exists",
        existingEmail: existingSlug.data().email
      });
      return;
    }

    // Find user's API token by email
    const tokenQuery = await getDb().collection(API_TOKENS_COLLECTION)
      .where('email', '==', email)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (tokenQuery.empty) {
      response.status(404).json({
        error: "No active API token found for this email",
        hint: "User needs to generate a token first in Account Settings > API Access"
      });
      return;
    }

    const tokenData = tokenQuery.docs[0].data();

    // Create the vanity slug
    const vanitySlugData = {
      slug: normalizedSlug,
      email: email,
      userId: tokenData.userId,
      token: tokenData.token,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.uid
    };

    await getDb().collection('vanitySlugs').doc(normalizedSlug).set(vanitySlugData);

    console.log(`🔗 Created vanity slug: ${normalizedSlug} -> ${email}`);

    response.json({
      success: true,
      slug: normalizedSlug,
      email: email,
      usage: `yellowcircle.io/s/${normalizedSlug}/https://example.com`
    });

  } catch (error) {
    console.error("createVanitySlug error:", error);
    response.status(500).json({ error: "Failed to create vanity slug" });
  }
});

// ============================================
// Email-to-Save System
// ============================================

/**
 * Extract URLs from text (email body, etc.)
 * @param {string} text - Text to extract URLs from
 * @returns {string[]} Array of unique URLs
 */
const extractUrlsFromText = (text) => {
  if (!text) return [];

  // Match http/https URLs
  const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi;
  const matches = text.match(urlRegex) || [];

  // Clean up URLs (remove trailing punctuation)
  const cleanedUrls = matches.map(url => {
    return url.replace(/[.,;:!?)}\]]+$/, '');
  });

  // Return unique URLs
  return [...new Set(cleanedUrls)];
};

/**
 * Email-to-Save Webhook Handler
 *
 * Accepts email webhook payloads from various sources:
 * - Direct POST with API token
 * - Zapier/Make.com webhooks
 * - n8n workflows
 * - Resend/SendGrid inbound
 *
 * POST /emailToSave
 * Body: {
 *   token: "yc_xxxxx",           // Required: API token
 *   body: "email body text",     // Required: Email content
 *   subject?: "subject line",    // Optional: Used as note
 *   sender?: "sender@email.com", // Optional: For logging
 *   tags?: ["tag1", "tag2"]      // Optional: Tags to apply
 * }
 *
 * OR Resend/SendGrid format:
 * Body: {
 *   from: "sender@email.com",
 *   to: "save+yc_xxxxx@yellowcircle.io",  // Token in recipient
 *   subject: "...",
 *   text: "...",
 *   html: "..."
 * }
 */
exports.emailToSave = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const data = request.body;

    // Extract token from various sources
    let token = data.token;

    // Check for token in "to" address (save+yc_xxxxx@...)
    if (!token && data.to) {
      const toAddress = Array.isArray(data.to) ? data.to[0] : data.to;
      const tokenMatch = toAddress.match(/save\+?(yc_[a-zA-Z0-9]+)@/i);
      if (tokenMatch) {
        token = tokenMatch[1];
      }
    }

    // Check X-API-Token header
    if (!token) {
      token = request.headers['x-api-token'];
    }

    if (!token) {
      response.status(401).json({
        error: "Missing API token",
        hint: "Provide token in body.token, to address (save+yc_xxx@...), or X-API-Token header"
      });
      return;
    }

    // Verify token
    const auth = await verifyApiToken(token);
    if (!auth.success) {
      response.status(401).json({ error: auth.error });
      return;
    }

    // Extract text content from various formats
    const textContent = data.body || data.text || data.plain || '';
    const htmlContent = data.html || '';
    const subject = data.subject || '';
    const sender = data.from || data.sender || '';

    // Extract URLs from both text and HTML
    const textUrls = extractUrlsFromText(textContent);
    const htmlUrls = extractUrlsFromText(htmlContent);
    const subjectUrls = extractUrlsFromText(subject);

    const allUrls = [...new Set([...textUrls, ...htmlUrls, ...subjectUrls])];

    if (allUrls.length === 0) {
      response.status(400).json({
        error: "No URLs found in email",
        hint: "Include at least one http:// or https:// URL in the email body"
      });
      return;
    }

    // Parse tags if provided
    let tags = [];
    if (data.tags) {
      tags = Array.isArray(data.tags)
        ? data.tags
        : data.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    // Save each URL
    const results = {
      saved: [],
      duplicates: [],
      failed: []
    };

    for (const url of allUrls) {
      try {
        // Check for duplicates
        const existing = await getDb().collection(LINKS_COLLECTION)
          .where('userId', '==', auth.uid)
          .where('url', '==', url)
          .limit(1)
          .get();

        if (!existing.empty) {
          results.duplicates.push(url);
          continue;
        }

        // Fetch metadata for the URL
        let metadata = { title: '', description: '', siteName: '' };
        try {
          metadata = await fetchUrlMetadata(url);
        } catch (e) {
          console.warn(`Metadata fetch failed for ${url}:`, e.message);
        }

        // Create the link document
        const linkData = {
          url,
          userId: auth.uid,
          savedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active',
          title: metadata.title || url,
          description: metadata.description || '',
          siteName: metadata.siteName || new URL(url).hostname,
          tags: tags,
          folderId: null,
          isStarred: false,
          isArchived: false,
          source: 'email',
          sourceMetadata: {
            sender: sender,
            subject: subject,
            savedVia: 'emailToSave'
          }
        };

        const docRef = await getDb().collection(LINKS_COLLECTION).add(linkData);
        results.saved.push({ url, id: docRef.id });

      } catch (urlError) {
        console.error(`Failed to save URL ${url}:`, urlError);
        results.failed.push({ url, error: urlError.message });
      }
    }

    console.log(`📧 Email-to-Save: ${results.saved.length} saved, ${results.duplicates.length} duplicates, ${results.failed.length} failed for user ${auth.email}`);

    response.json({
      success: true,
      urlsFound: allUrls.length,
      saved: results.saved.length,
      duplicates: results.duplicates.length,
      failed: results.failed.length,
      details: results
    });

  } catch (error) {
    console.error("emailToSave error:", error);
    response.status(500).json({ error: "Failed to process email" });
  }
});

/**
 * Generate Save Email Address
 *
 * Returns the user's unique save email address based on their API token.
 * Format: save+{token}@yellowcircle.io
 *
 * GET /getSaveEmail?token=yc_xxxxx
 * OR with Firebase Auth: GET /getSaveEmail (uses auth header)
 */
exports.getSaveEmail = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    let token = request.query.token;
    let auth = null;

    // If no token provided, try Firebase Auth
    if (!token) {
      auth = await verifyUserAuth(request);
      if (!auth.success) {
        response.status(401).json({ error: "Provide token parameter or Authorization header" });
        return;
      }

      // Look up user's token
      const tokenDoc = await getDb().collection(API_TOKENS_COLLECTION)
        .where('userId', '==', auth.uid)
        .where('active', '==', true)
        .limit(1)
        .get();

      if (tokenDoc.empty) {
        response.status(404).json({
          error: "No API token found",
          hint: "Generate a token first in Account Settings > Integrations"
        });
        return;
      }

      token = tokenDoc.docs[0].data().token;
    } else {
      // Verify the provided token
      auth = await verifyApiToken(token);
      if (!auth.success) {
        response.status(401).json({ error: auth.error });
        return;
      }
    }

    // Generate save email address
    const saveEmail = `save+${token}@yellowcircle.io`;

    response.json({
      success: true,
      saveEmail: saveEmail,
      instructions: {
        zapier: "Forward emails to this address to automatically save links",
        ios: "Use this address with iOS Mail or Shortcuts",
        slack: "Forward messages via email to save links",
        direct: "POST to /emailToSave with your token and email body"
      }
    });

  } catch (error) {
    console.error("getSaveEmail error:", error);
    response.status(500).json({ error: "Failed to get save email" });
  }
});

// ============================================
// Secure API Key Management
// ============================================

const USER_SECRETS_COLLECTION = "userSecrets";

/**
 * Save Secret Key - Store AI API key securely (never returned to client)
 * POST /saveSecretKey
 * Body: { provider: 'gemini'|'openai', apiKey: 'xxx' }
 * Auth: Firebase Auth token required
 */
exports.saveSecretKey = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "POST required" });
    return;
  }

  try {
    const auth = await verifyUserAuth(request);
    if (!auth.success) {
      response.status(401).json({ error: auth.error });
      return;
    }

    const { provider, apiKey } = request.body;

    if (!provider || !['gemini', 'openai', 'anthropic'].includes(provider)) {
      response.status(400).json({ error: "Invalid provider. Use: gemini, openai, or anthropic" });
      return;
    }

    const secretsRef = getDb().collection(USER_SECRETS_COLLECTION).doc(auth.uid);

    if (!apiKey || apiKey.trim() === '') {
      // Remove the key if empty
      await secretsRef.set({
        [`aiKeys.${provider}`]: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      response.json({ success: true, message: `${provider} API key removed` });
    } else {
      // Save the key securely
      await secretsRef.set({
        aiKeys: {
          [provider]: {
            key: apiKey.trim(),
            addedAt: admin.firestore.FieldValue.serverTimestamp()
          }
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      response.json({ success: true, message: `${provider} API key saved securely` });
    }

  } catch (error) {
    console.error("saveSecretKey error:", error);
    response.status(500).json({ error: "Failed to save API key" });
  }
});

/**
 * Get Secret Key Status - Check which API keys are configured (doesn't reveal keys)
 * GET /getSecretKeyStatus
 * Auth: Firebase Auth token required
 * Returns: { gemini: true/false, openai: true/false, anthropic: true/false }
 */
exports.getSecretKeyStatus = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const auth = await verifyUserAuth(request);
    if (!auth.success) {
      response.status(401).json({ error: auth.error });
      return;
    }

    const secretsRef = getDb().collection(USER_SECRETS_COLLECTION).doc(auth.uid);
    const doc = await secretsRef.get();

    const status = {
      gemini: false,
      openai: false,
      anthropic: false
    };

    if (doc.exists) {
      const data = doc.data();
      const aiKeys = data.aiKeys || {};

      status.gemini = !!aiKeys.gemini?.key;
      status.openai = !!aiKeys.openai?.key;
      status.anthropic = !!aiKeys.anthropic?.key;
    }

    response.json({ success: true, configured: status });

  } catch (error) {
    console.error("getSecretKeyStatus error:", error);
    response.status(500).json({ error: "Failed to get key status" });
  }
});

/**
 * Get user's securely stored API key (internal use only)
 * NOT exposed as HTTP endpoint - called by other functions
 */
async function getSecureApiKey(userId, provider) {
  if (!userId || !provider) return null;

  try {
    const secretsRef = getDb().collection(USER_SECRETS_COLLECTION).doc(userId);
    const doc = await secretsRef.get();

    if (!doc.exists) return null;

    const data = doc.data();
    return data.aiKeys?.[provider]?.key || null;
  } catch (error) {
    console.error('Error fetching secure API key:', error);
    return null;
  }
}

// ============================================
// Validate Token - For Chrome Extension
// ============================================

/**
 * Validate Token - Check if API token is valid
 * GET /validateToken?token=yc_xxxxx
 *
 * Used by Chrome extension to verify user's token before saving.
 * Returns { valid: true } or { valid: false, error: "..." }
 */
exports.validateToken = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const token = request.query.token || request.body?.token;

    if (!token) {
      response.status(400).json({ valid: false, error: "Token required" });
      return;
    }

    const auth = await verifyApiToken(token);

    if (auth.success) {
      response.json({
        valid: true,
        email: auth.email
      });
    } else {
      response.status(401).json({
        valid: false,
        error: auth.error || "Invalid token"
      });
    }

  } catch (error) {
    console.error("validateToken error:", error);
    response.status(500).json({ valid: false, error: "Validation failed" });
  }
});

// Functions are already exported via exports.xxx = functions.https.onRequest(...)
// No module.exports needed - require('./linkArchiver') will use the exports object
