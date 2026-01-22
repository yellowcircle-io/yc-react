/**
 * HTTP Cloud Function to Import Pocket Links
 *
 * Deploy: firebase deploy --only functions:importPocketLinks
 * Trigger: curl -X POST https://us-central1-yellowcircle-app.cloudfunctions.net/importPocketLinks
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Configuration
const USER_ID = "IuNWCJcUWKdNJhzBbJsFY0nSE7H3";
const BATCH_SIZE = 500;

// Pocket links data - embedded for simplicity
const POCKET_LINKS_URL = "https://raw.githubusercontent.com/yellowcircle/pocket-import/main/pocket-all-links.json";

// Helper: Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

exports.importPocketLinks = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes (max is 9 for HTTP functions)
    memory: "1GB",
    invoker: "public" // Allow unauthenticated access
  })
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    // Only allow POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      // Get links from request body or fetch from URL
      let allLinks = [];

      if (req.body && req.body.links && Array.isArray(req.body.links)) {
        allLinks = req.body.links;
      } else {
        return res.status(400).json({
          error: "Please provide links in request body as { links: [...] }"
        });
      }

      console.log(`Received ${allLinks.length} links to import`);

      // Check for existing links
      console.log("Checking for duplicates...");
      const existingSnapshot = await db.collection("links")
        .where("userId", "==", USER_ID)
        .get();

      const existingUrls = new Set();
      existingSnapshot.forEach(doc => {
        existingUrls.add(doc.data().url);
      });
      console.log(`Found ${existingUrls.size} existing links`);

      // Filter and prepare links
      const linksToImport = [];

      for (const item of allLinks) {
        const url = item.given_url || item.url;
        if (!url) continue;
        if (existingUrls.has(url)) continue;

        // Parse tags
        let tags = ["pocket"]; // Always add pocket tag
        if (item.tags && typeof item.tags === "object") {
          tags = [...new Set(["pocket", ...Object.keys(item.tags)])];
        }

        linksToImport.push({
          url,
          title: item.given_title || item.title || url,
          timeAdded: parseInt(item.time_added) || Math.floor(Date.now() / 1000),
          tags,
          starred: item.favorite === "1",
          archived: true // Mark all as archived
        });
      }

      console.log(`Prepared ${linksToImport.length} new links (skipping ${allLinks.length - linksToImport.length} duplicates)`);

      if (linksToImport.length === 0) {
        return res.json({
          success: true,
          message: "No new links to import",
          imported: 0,
          skipped: allLinks.length
        });
      }

      // Batch write
      let imported = 0;
      let batchNum = 0;

      for (let i = 0; i < linksToImport.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = linksToImport.slice(i, i + BATCH_SIZE);

        for (const link of chunk) {
          const docRef = db.collection("links").doc();

          batch.set(docRef, {
            id: docRef.id,
            userId: USER_ID,
            url: link.url,
            title: link.title,
            excerpt: "",
            content: "",
            domain: extractDomain(link.url),
            favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(link.url)}&sz=64`,
            image: null,
            author: null,
            publishedAt: null,
            tags: link.tags,
            folderId: null,
            starred: link.starred,
            archived: link.archived,
            readProgress: 0,
            readTime: 0,
            estimatedReadTime: 0,
            aiSummary: null,
            aiTags: [],
            archiveUrl: null,
            archiveTimestamp: null,
            unityNodeId: null,
            unityCapsuleId: null,
            savedAt: admin.firestore.Timestamp.fromDate(new Date(link.timeAdded * 1000)),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            readAt: null
          });
        }

        await batch.commit();
        imported += chunk.length;
        batchNum++;
        console.log(`Batch ${batchNum}: Imported ${imported}/${linksToImport.length} links`);
      }

      return res.json({
        success: true,
        message: `Import complete!`,
        imported,
        skipped: allLinks.length - linksToImport.length
      });

    } catch (error) {
      console.error("Import error:", error);
      return res.status(500).json({
        error: error.message
      });
    }
  });
