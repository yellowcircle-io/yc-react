#!/usr/bin/env node
/**
 * Sign and Upload iOS Shortcut
 *
 * This script generates a pre-configured iOS Shortcut for a user's vanity slug,
 * signs it using macOS Shortcuts app, and uploads it to Firebase Cloud Storage.
 *
 * Usage:
 *   node scripts/signShortcut.mjs <slug>
 *   node scripts/signShortcut.mjs christopher
 *   node scripts/signShortcut.mjs --all  # Sign all existing vanity slugs
 *
 * Requirements:
 *   - macOS (for shortcuts sign command)
 *   - Firebase CLI authenticated
 *   - Node.js 18+
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

if (!existsSync(serviceAccountPath)) {
  console.error('Error: firebase-service-account.json not found in project root.');
  console.error('Download it from Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccountPath),
  storageBucket: 'yellowcircle-app.appspot.com'
});

const db = getFirestore();
const bucket = getStorage().bucket();

// Generate shortcut plist XML
function generateShortcutPlist(slug) {
  const uuid = 'FFFFFFFF-FFFF-4FFF-BFFF-' + Date.now().toString(16).toUpperCase().padStart(12, '0');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>WFWorkflowClientVersion</key>
\t<string>2605.0.5</string>
\t<key>WFWorkflowMinimumClientVersion</key>
\t<integer>900</integer>
\t<key>WFWorkflowMinimumClientVersionString</key>
\t<string>900</string>
\t<key>WFWorkflowName</key>
\t<string>Save to yellowCircle</string>
\t<key>WFWorkflowTypes</key>
\t<array>
\t\t<string>ActionExtension</string>
\t</array>
\t<key>WFWorkflowInputContentItemClasses</key>
\t<array>
\t\t<string>WFURLContentItem</string>
\t\t<string>WFArticleContentItem</string>
\t</array>
\t<key>WFWorkflowIcon</key>
\t<dict>
\t\t<key>WFWorkflowIconGlyphNumber</key>
\t\t<integer>59819</integer>
\t\t<key>WFWorkflowIconStartColor</key>
\t\t<integer>4294956800</integer>
\t</dict>
\t<key>WFWorkflowActions</key>
\t<array>
\t\t<dict>
\t\t\t<key>WFWorkflowActionIdentifier</key>
\t\t\t<string>is.workflow.actions.gettext</string>
\t\t\t<key>WFWorkflowActionParameters</key>
\t\t\t<dict>
\t\t\t\t<key>WFTextActionText</key>
\t\t\t\t<dict>
\t\t\t\t\t<key>Value</key>
\t\t\t\t\t<dict>
\t\t\t\t\t\t<key>string</key>
\t\t\t\t\t\t<string>https://yellowcircle.io/s/${slug}/</string>
\t\t\t\t\t\t<key>attachmentsByRange</key>
\t\t\t\t\t\t<dict>
\t\t\t\t\t\t</dict>
\t\t\t\t\t</dict>
\t\t\t\t\t<key>WFSerializationType</key>
\t\t\t\t\t<string>WFTextTokenString</string>
\t\t\t\t</dict>
\t\t\t\t<key>UUID</key>
\t\t\t\t<string>${uuid}</string>
\t\t\t</dict>
\t\t</dict>
\t\t<dict>
\t\t\t<key>WFWorkflowActionIdentifier</key>
\t\t\t<string>is.workflow.actions.openurl</string>
\t\t\t<key>WFWorkflowActionParameters</key>
\t\t\t<dict>
\t\t\t\t<key>WFInput</key>
\t\t\t\t<dict>
\t\t\t\t\t<key>Value</key>
\t\t\t\t\t<dict>
\t\t\t\t\t\t<key>string</key>
\t\t\t\t\t\t<string>\uFFFC\uFFFC</string>
\t\t\t\t\t\t<key>attachmentsByRange</key>
\t\t\t\t\t\t<dict>
\t\t\t\t\t\t\t<key>{0, 1}</key>
\t\t\t\t\t\t\t<dict>
\t\t\t\t\t\t\t\t<key>Type</key>
\t\t\t\t\t\t\t\t<string>ActionOutput</string>
\t\t\t\t\t\t\t\t<key>OutputName</key>
\t\t\t\t\t\t\t\t<string>Text</string>
\t\t\t\t\t\t\t\t<key>OutputUUID</key>
\t\t\t\t\t\t\t\t<string>${uuid}</string>
\t\t\t\t\t\t\t</dict>
\t\t\t\t\t\t\t<key>{1, 1}</key>
\t\t\t\t\t\t\t<dict>
\t\t\t\t\t\t\t\t<key>Type</key>
\t\t\t\t\t\t\t\t<string>ExtensionInput</string>
\t\t\t\t\t\t\t</dict>
\t\t\t\t\t\t</dict>
\t\t\t\t\t</dict>
\t\t\t\t\t<key>WFSerializationType</key>
\t\t\t\t\t<string>WFTextTokenString</string>
\t\t\t\t</dict>
\t\t\t</dict>
\t\t</dict>
\t</array>
</dict>
</plist>`;
}

// Sign a shortcut file
async function signShortcut(slug) {
  const tempDir = '/tmp/shortcut-signing';
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  const unsignedPath = path.join(tempDir, `${slug}-unsigned.shortcut`);
  const signedPath = path.join(tempDir, `${slug}.shortcut`);

  console.log(`  Generating plist for: ${slug}`);

  // Generate and write the plist
  const plist = generateShortcutPlist(slug);
  writeFileSync(unsignedPath, plist);

  // Convert to binary plist
  console.log(`  Converting to binary plist...`);
  try {
    execSync(`plutil -convert binary1 "${unsignedPath}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error(`  Error converting to binary: ${err.message}`);
    throw err;
  }

  // Sign the shortcut
  console.log(`  Signing shortcut...`);
  try {
    execSync(`shortcuts sign -i "${unsignedPath}" -o "${signedPath}" 2>&1`, { stdio: 'pipe' });
  } catch (err) {
    // shortcuts sign often returns warnings but still succeeds
    if (!existsSync(signedPath)) {
      console.error(`  Error signing: ${err.message}`);
      throw err;
    }
  }

  // Verify signed file exists and has content
  const stats = existsSync(signedPath) ? require('fs').statSync(signedPath) : null;
  if (!stats || stats.size < 1000) {
    throw new Error('Signed shortcut file is too small or missing');
  }

  console.log(`  Signed successfully (${stats.size} bytes)`);

  return { unsignedPath, signedPath };
}

// Upload to Cloud Storage
async function uploadToStorage(signedPath, slug) {
  const destination = `shortcuts/signed/${slug}.shortcut`;

  console.log(`  Uploading to gs://yellowcircle-app.appspot.com/${destination}...`);

  await bucket.upload(signedPath, {
    destination,
    metadata: {
      contentType: 'application/octet-stream',
      metadata: {
        signedAt: new Date().toISOString(),
        slug: slug
      }
    }
  });

  console.log(`  Upload complete!`);
}

// Clean up temp files
function cleanup(paths) {
  for (const p of Object.values(paths)) {
    if (existsSync(p)) {
      unlinkSync(p);
    }
  }
}

// Process a single slug
async function processSlug(slug) {
  console.log(`\nProcessing: ${slug}`);

  let paths = null;
  try {
    paths = await signShortcut(slug);
    await uploadToStorage(paths.signedPath, slug);
    console.log(`  ✅ Done: ${slug}`);
    return true;
  } catch (err) {
    console.error(`  ❌ Failed: ${slug} - ${err.message}`);
    return false;
  } finally {
    if (paths) cleanup(paths);
  }
}

// Get all vanity slugs from Firestore
async function getAllVanitySlugs() {
  const snapshot = await db.collection('vanitySlugs').get();
  return snapshot.docs.map(doc => doc.id);
}

// Get all save IDs from Firestore
async function getAllSaveIds() {
  const snapshot = await db.collection('linkSaverTokens').get();
  const saveIds = [];
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.saveId) {
      saveIds.push(data.saveId);
    }
  });
  return saveIds;
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/signShortcut.mjs <slug>       # Sign a specific slug');
    console.log('  node scripts/signShortcut.mjs --all        # Sign all vanity slugs');
    console.log('  node scripts/signShortcut.mjs --save-ids   # Sign all save IDs');
    process.exit(1);
  }

  let slugs = [];

  if (args[0] === '--all') {
    console.log('Fetching all vanity slugs...');
    slugs = await getAllVanitySlugs();
    console.log(`Found ${slugs.length} vanity slugs`);
  } else if (args[0] === '--save-ids') {
    console.log('Fetching all save IDs...');
    slugs = await getAllSaveIds();
    console.log(`Found ${slugs.length} save IDs`);
  } else {
    slugs = args;
  }

  let success = 0;
  let failed = 0;

  for (const slug of slugs) {
    const result = await processSlug(slug);
    if (result) success++;
    else failed++;
  }

  console.log(`\n========================================`);
  console.log(`Completed: ${success} succeeded, ${failed} failed`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
