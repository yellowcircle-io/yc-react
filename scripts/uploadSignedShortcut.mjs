#!/usr/bin/env node
/**
 * Upload Signed Shortcut to Firebase Storage
 *
 * Uploads a locally signed shortcut to Cloud Storage via the admin API.
 *
 * Usage:
 *   node scripts/uploadSignedShortcut.mjs <slug> <auth-token>
 *
 * Get auth token from browser console while logged in as admin:
 *   await firebase.auth().currentUser.getIdToken()
 *
 * Example:
 *   node scripts/uploadSignedShortcut.mjs christopher "eyJhbGciOiJS..."
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';

const FUNCTIONS_BASE_URL = 'https://us-central1-yellowcircle-app.cloudfunctions.net';

async function uploadShortcut(slug, authToken) {
  const filePath = path.join('/tmp/signed-shortcuts', `${slug}.shortcut`);

  if (!existsSync(filePath)) {
    console.error(`Error: Signed shortcut not found at ${filePath}`);
    console.error('Run signShortcutLocal.mjs first to sign the shortcut.');
    process.exit(1);
  }

  console.log(`Reading signed shortcut from: ${filePath}`);
  const fileBuffer = readFileSync(filePath);
  const base64Content = fileBuffer.toString('base64');
  console.log(`File size: ${fileBuffer.length} bytes (${base64Content.length} bytes base64)`);

  console.log(`Uploading to Cloud Storage...`);

  const response = await fetch(`${FUNCTIONS_BASE_URL}/uploadSignedShortcut`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      slug: slug,
      content: base64Content
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`Error: ${data.error || 'Upload failed'}`);
    console.error(`Status: ${response.status}`);
    process.exit(1);
  }

  console.log(`\n✅ Upload successful!`);
  console.log(`Slug: ${data.slug}`);
  console.log(`Path: ${data.path}`);
  console.log(`Size: ${data.size} bytes`);
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage:');
    console.log('  node scripts/uploadSignedShortcut.mjs <slug> <auth-token>');
    console.log('');
    console.log('Get auth token from browser console while logged in as admin:');
    console.log('  await firebase.auth().currentUser.getIdToken()');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/uploadSignedShortcut.mjs christopher "eyJhbGciOiJS..."');
    process.exit(1);
  }

  const [slug, authToken] = args;

  console.log(`\nUploading signed shortcut for: ${slug}`);
  await uploadShortcut(slug, authToken);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
