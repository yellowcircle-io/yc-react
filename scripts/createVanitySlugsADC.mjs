/**
 * Create Vanity Slugs using Application Default Credentials
 *
 * Prerequisites: Run `gcloud auth application-default login` first
 * Then run: node scripts/createVanitySlugsADC.mjs
 *
 * @created 2026-01-22
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize with Application Default Credentials
initializeApp({
  credential: applicationDefault(),
  projectId: 'yellowcircle-app'
});

const db = getFirestore();

/**
 * Vanity slugs to create
 */
const VANITY_SLUGS = [
  { slug: 'dash', email: 'dash@dashkolos.com' },
  { slug: 'christopher', email: 'christopher@yellowcircle.io' }
];

async function findUserToken(email) {
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
    console.log(`  Already exists: ${slug}`);
    const data = existingSlug.data();
    console.log(`  Maps to: ${data.email}`);
    return;
  }

  // Find user's API token
  const tokenData = await findUserToken(email);
  if (!tokenData) {
    console.log(`  No active API token found for ${email}`);
    console.log(`  User needs to generate a token first in Account Settings > API Access`);
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

  console.log(`  Created: yellowcircle.io/s/${slug}/`);
  console.log(`  Token: ${tokenData.token.substring(0, 15)}...`);
}

async function main() {
  console.log('Creating Vanity Slugs');
  console.log('=====================\n');

  for (const { slug, email } of VANITY_SLUGS) {
    await createVanitySlug(slug, email);
  }

  console.log('\nDone!');
}

main().catch(console.error);
