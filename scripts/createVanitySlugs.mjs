/**
 * Create Vanity Slugs in Firestore
 *
 * This script creates custom vanity slugs that map to user API tokens.
 * Run with: node scripts/createVanitySlugs.mjs
 *
 * @created 2026-01-22
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = join(__dirname, '..', 'yellowcircle-app-firebase-adminsdk.json');
let serviceAccount;

try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('Service account file not found. Please ensure yellowcircle-app-firebase-adminsdk.json exists.');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

/**
 * Vanity slugs to create
 * Each entry maps a slug to an email address
 * The script will look up the user's API token
 */
const VANITY_SLUGS = [
  { slug: 'dash', email: 'dash@dashkolos.com' },
  { slug: 'christopher', email: 'christopher@yellowcircle.io' }
];

async function findUserToken(email) {
  // Look up user's API token by email
  const tokenQuery = await db.collection('apiTokens')
    .where('email', '==', email)
    .where('active', '==', true)
    .limit(1)
    .get();

  if (tokenQuery.empty) {
    return null;
  }

  return tokenQuery.docs[0].data();
}

async function createVanitySlug(slug, email) {
  console.log(`\nProcessing: ${slug} -> ${email}`);

  // Check if slug already exists
  const existingSlug = await db.collection('vanitySlugs').doc(slug.toLowerCase()).get();
  if (existingSlug.exists) {
    console.log(`  ⚠️  Slug "${slug}" already exists`);
    const data = existingSlug.data();
    console.log(`      Maps to: ${data.email}`);
    return;
  }

  // Find user's API token
  const tokenData = await findUserToken(email);
  if (!tokenData) {
    console.log(`  ❌ No active API token found for ${email}`);
    console.log(`     User needs to generate a token first in Account Settings > API Access`);
    return;
  }

  // Create the vanity slug document
  const vanitySlugData = {
    slug: slug.toLowerCase(),
    email: email,
    userId: tokenData.userId,
    token: tokenData.token,
    active: true,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: 'admin-script'
  };

  await db.collection('vanitySlugs').doc(slug.toLowerCase()).set(vanitySlugData);

  console.log(`  ✅ Created vanity slug: yellowcircle.io/s/${slug}/`);
  console.log(`     Linked to token: ${tokenData.token.substring(0, 10)}...`);
}

async function main() {
  console.log('=================================');
  console.log('Creating Vanity Slugs');
  console.log('=================================');

  for (const { slug, email } of VANITY_SLUGS) {
    await createVanitySlug(slug, email);
  }

  console.log('\n=================================');
  console.log('Done!');
  console.log('=================================');
  console.log('\nUsage examples:');
  for (const { slug } of VANITY_SLUGS) {
    console.log(`  yellowcircle.io/s/${slug}/https://example.com`);
  }
}

main().catch(console.error);
