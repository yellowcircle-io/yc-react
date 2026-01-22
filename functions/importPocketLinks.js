/**
 * Bulk Import Pocket Links from CSV
 *
 * Usage: node importPocketLinks.js
 *
 * Reads pocket-saves.csv and imports all links to Firestore with:
 * - "pocket" tag added to all entries
 * - All entries marked as archived
 *
 * @created 2026-01-18
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize without explicit credentials - uses ADC
admin.initializeApp({
  projectId: "yellowcircle-app"
});

const db = admin.firestore();

// Configuration
const CSV_PATH = path.join(__dirname, "../dev-context/pocket-saves.csv");
const USER_ID = "IuNWCJcUWKdNJhzBbJsFY0nSE7H3"; // Replace with actual user ID
const BATCH_SIZE = 500; // Firestore batch limit

// Helper: Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

// Helper: Parse CSV line (handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Main import function
async function importLinks() {
  console.log("Reading CSV file...");

  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const lines = csvContent.split("\n").filter(line => line.trim());

  // Skip header
  const dataLines = lines.slice(1);
  console.log(`Found ${dataLines.length} links to import`);

  // Check for existing links to avoid duplicates
  console.log("Checking for existing links...");
  const existingSnapshot = await db.collection("links")
    .where("userId", "==", USER_ID)
    .get();

  const existingUrls = new Set();
  existingSnapshot.forEach(doc => {
    existingUrls.add(doc.data().url);
  });
  console.log(`Found ${existingUrls.size} existing links`);

  // Parse and prepare links
  const linksToImport = [];
  let skipped = 0;

  for (const line of dataLines) {
    const fields = parseCSVLine(line);
    if (fields.length < 3) continue;

    const [title, url, timeAdded, tags, status] = fields;

    if (!url) continue;
    if (existingUrls.has(url)) {
      skipped++;
      continue;
    }

    // Parse tags (pipe-separated) and add "pocket" tag
    const existingTags = tags ? tags.split("|").map(t => t.trim()).filter(Boolean) : [];
    const allTags = [...new Set(["pocket", ...existingTags])]; // pocket first, dedupe

    linksToImport.push({
      url,
      title: title || url, // Use URL as title if no title
      timeAdded: parseInt(timeAdded) || Date.now() / 1000,
      tags: allTags,
      archived: true // Archive all imported links
    });
  }

  console.log(`Prepared ${linksToImport.length} new links to import (skipping ${skipped} duplicates)`);

  if (linksToImport.length === 0) {
    console.log("No new links to import!");
    return;
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

        // Core fields
        url: link.url,
        title: link.title,
        excerpt: "",
        content: "",

        // Metadata
        domain: extractDomain(link.url),
        favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(link.url)}&sz=64`,
        image: null,
        author: null,
        publishedAt: null,

        // Organization
        tags: link.tags,
        folderId: null,
        starred: false,
        archived: link.archived,

        // Reading progress
        readProgress: 0,
        readTime: 0,
        estimatedReadTime: 0,

        // AI enhancements
        aiSummary: null,
        aiTags: [],

        // Archive
        archiveUrl: null,
        archiveTimestamp: null,

        // Unity integration
        unityNodeId: null,
        unityCapsuleId: null,

        // Timestamps
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

  console.log(`\nImport complete! Imported ${imported} links.`);
}

// Run
importLinks()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
