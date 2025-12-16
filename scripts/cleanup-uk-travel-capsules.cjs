/**
 * Cleanup UK Travel Memories Capsules
 *
 * Run: node scripts/cleanup-uk-travel-capsules.cjs
 *
 * This script deletes all capsules with title containing "Travel Memories"
 * or "UK Travel" that appear to be auto-saved test data.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'yellowcircle-app'
  });
}

const db = admin.firestore();

async function cleanupUKTravelCapsules() {
  console.log('🔍 Scanning capsules collection...\n');

  const capsulesRef = db.collection('capsules');
  const snapshot = await capsulesRef.get();

  const toDelete = [];
  const toKeep = [];

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const viewCount = data.viewCount || 0;
    const createdAt = data.createdAt?.toDate?.() || new Date(0);

    // Target UK Travel Memories and similar auto-saved capsules
    const isTargeted =
      title.includes('travel memories') ||
      title.includes('uk travel') ||
      title.includes('travel memory') ||
      (title === 'untitled' && viewCount === 0);

    if (isTargeted) {
      toDelete.push({
        id: doc.id,
        title: data.title,
        viewCount,
        createdAt: createdAt.toISOString(),
        nodeCount: data.stats?.nodeCount || data.nodes?.length || 0
      });
    } else {
      toKeep.push({
        id: doc.id,
        title: data.title,
        viewCount,
        createdAt: createdAt.toISOString()
      });
    }
  });

  console.log(`📊 Found ${snapshot.size} total capsules`);
  console.log(`🗑️  To delete: ${toDelete.length}`);
  console.log(`✅ To keep: ${toKeep.length}\n`);

  if (toDelete.length === 0) {
    console.log('No UK Travel Memories capsules found. Nothing to delete.');
    return { deleted: 0, kept: toKeep.length };
  }

  console.log('Capsules to DELETE:');
  console.log('-------------------');
  toDelete.forEach((c, i) => {
    console.log(`${i + 1}. "${c.title}" - ${c.viewCount} views, ${c.nodeCount} nodes (${c.id})`);
  });

  console.log('\nCapsules to KEEP:');
  console.log('-----------------');
  toKeep.slice(0, 10).forEach((c, i) => {
    console.log(`${i + 1}. "${c.title}" - ${c.viewCount} views (${c.id})`);
  });
  if (toKeep.length > 10) {
    console.log(`... and ${toKeep.length - 10} more`);
  }

  // Perform deletion
  console.log('\n🗑️  Deleting capsules...\n');

  let deleted = 0;
  for (const capsule of toDelete) {
    try {
      await capsulesRef.doc(capsule.id).delete();
      console.log(`✅ Deleted: ${capsule.id} ("${capsule.title}")`);
      deleted++;
    } catch (err) {
      console.error(`❌ Failed to delete ${capsule.id}: ${err.message}`);
    }
  }

  console.log(`\n🏁 Cleanup complete: ${deleted} deleted, ${toKeep.length} kept`);

  return { deleted, kept: toKeep.length };
}

// Run the cleanup
cleanupUKTravelCapsules()
  .then(result => {
    console.log('\n📊 Final result:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  });
