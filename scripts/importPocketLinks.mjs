/**
 * Import Pocket Links Script
 *
 * Usage:
 * 1. Run `firebase login --reauth` in terminal to refresh credentials
 * 2. Run `node scripts/importPocketLinks.mjs`
 *
 * This imports all links from dev-context/pocket-all-links.json
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

// Configuration - UPDATE THIS with the user ID from Firestore
const USER_ID = 'IuNWCJcUWKdNJhzBbJsFY0nSE7H3'; // Get this from existing links in Firestore
const JSON_PATH = join(PROJECT_ROOT, 'dev-context/pocket-all-links.json');
const BATCH_SIZE = 500;

// Initialize Firebase Admin
initializeApp({
  projectId: 'yellowcircle-app'
});

const db = getFirestore();

// Helper: Extract domain from URL
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

async function importLinks() {
  console.log('📦 Reading JSON file...');
  const allLinks = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
  console.log(`Found ${allLinks.length} links`);

  // Check for existing links
  console.log('🔍 Checking for duplicates...');
  const existingSnap = await db.collection('links')
    .where('userId', '==', USER_ID)
    .get();

  const existingUrls = new Set();
  existingSnap.forEach(doc => existingUrls.add(doc.data().url));
  console.log(`Found ${existingUrls.size} existing links`);

  // Filter out duplicates
  const linksToImport = allLinks.filter(link => !existingUrls.has(link.given_url));
  console.log(`➕ ${linksToImport.length} new links to import`);

  if (linksToImport.length === 0) {
    console.log('✅ Nothing to import!');
    return;
  }

  // Import in batches
  let imported = 0;
  let batchNum = 0;

  for (let i = 0; i < linksToImport.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = linksToImport.slice(i, i + BATCH_SIZE);
    batchNum++;

    for (const item of chunk) {
      const docRef = db.collection('links').doc();
      const tags = item.tags ? Object.keys(item.tags) : [];

      batch.set(docRef, {
        id: docRef.id,
        userId: USER_ID,
        url: item.given_url,
        title: item.given_title || item.given_url,
        excerpt: '',
        content: '',
        domain: extractDomain(item.given_url),
        favicon: `https://www.google.com/s2/favicons?domain=${extractDomain(item.given_url)}&sz=64`,
        image: null,
        author: null,
        publishedAt: null,
        tags,
        folderId: null,
        starred: item.favorite === '1',
        archived: item.status === '1',
        readProgress: 0,
        readTime: 0,
        estimatedReadTime: 0,
        aiSummary: null,
        aiTags: [],
        archiveUrl: null,
        archiveTimestamp: null,
        unityNodeId: null,
        unityCapsuleId: null,
        savedAt: new Date(parseInt(item.time_added) * 1000),
        updatedAt: FieldValue.serverTimestamp(),
        readAt: null
      });
    }

    await batch.commit();
    imported += chunk.length;
    const progress = Math.round((i + chunk.length) / linksToImport.length * 100);
    console.log(`📊 Batch ${batchNum}: ${progress}% (${imported}/${linksToImport.length})`);
  }

  console.log(`\n✅ Import complete! Imported ${imported} links.`);
}

importLinks()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
