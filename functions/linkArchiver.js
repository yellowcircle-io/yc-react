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
const db = admin.firestore();

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
    const existingQuery = await db.collection(LINKS_COLLECTION)
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
    const linkRef = db.collection(LINKS_COLLECTION).doc();
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

    let query = db.collection(LINKS_COLLECTION)
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
      const startDoc = await db.collection(LINKS_COLLECTION).doc(startAfter).get();
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

    const linkRef = db.collection(LINKS_COLLECTION).doc(id);
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

    const linkRef = db.collection(LINKS_COLLECTION).doc(id);
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

      const batch = db.batch();
      const existingUrls = new Set();

      // Get existing URLs
      const existingQuery = await db.collection(LINKS_COLLECTION)
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
          const linkRef = db.collection(LINKS_COLLECTION).doc();

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
    const snapshot = await db.collection(LINKS_COLLECTION)
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

// Export all functions
module.exports = {
  saveLink: exports.saveLink,
  getLinks: exports.getLinks,
  updateLink: exports.updateLink,
  deleteLink: exports.deleteLink,
  importLinks: exports.importLinks,
  getLinkStats: exports.getLinkStats
};
