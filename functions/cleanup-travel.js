const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'yellowcircle-app' });
}

const db = admin.firestore();

async function cleanup() {
  console.log('🔍 Scanning capsules...\n');
  const snapshot = await db.collection('capsules').get();

  const toDelete = [];
  const toKeep = [];

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const viewCount = data.viewCount || 0;

    const isTarget = title.includes('travel memories') ||
                     title.includes('uk travel') ||
                     title.includes('travel memory');

    if (isTarget) {
      toDelete.push({ id: doc.id, title: data.title, viewCount });
    } else {
      toKeep.push({ id: doc.id, title: data.title, viewCount });
    }
  });

  console.log('📊 Total capsules:', snapshot.size);
  console.log('🗑️  To delete:', toDelete.length);
  console.log('✅ To keep:', toKeep.length);
  console.log('');

  if (toDelete.length > 0) {
    console.log('DELETE LIST:');
    console.log('------------');
    toDelete.forEach((c, i) => {
      console.log(`${i + 1}. "${c.title}" - ${c.viewCount} views (${c.id})`);
    });

    console.log('\n🗑️  Deleting...\n');
    let deleted = 0;
    for (const c of toDelete) {
      await db.collection('capsules').doc(c.id).delete();
      console.log(`✅ Deleted: ${c.id}`);
      deleted++;
    }
    console.log(`\n🏁 Complete: ${deleted} capsules deleted`);
  } else {
    console.log('No UK Travel Memories capsules found.');
  }

  console.log('\n📋 Remaining capsules:');
  toKeep.slice(0, 10).forEach((c, i) => {
    console.log(`${i + 1}. "${c.title}" - ${c.viewCount} views`);
  });
  if (toKeep.length > 10) {
    console.log(`... and ${toKeep.length - 10} more`);
  }
}

cleanup()
  .then(() => process.exit(0))
  .catch(e => { console.error('Error:', e); process.exit(1); });
