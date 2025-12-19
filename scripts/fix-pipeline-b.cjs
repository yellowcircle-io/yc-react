const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'yellowcircle-app' });
}
const db = admin.firestore();

async function fixPipelineBContacts() {
  // Check all contacts to see which dont have pipeline
  const allContacts = await db.collection('contacts').get();
  let updates = [];

  allContacts.forEach(doc => {
    const data = doc.data();
    if (!data.pipeline || data.pipeline === 'none') {
      updates.push({
        id: doc.id,
        email: data.email,
        company: data.company
      });
    }
  });

  console.log('Contacts without pipeline:', updates.length);
  console.log('Sample:', updates.slice(0, 5));

  // Update them to Pipeline B
  const batch = db.batch();
  for (const u of updates) {
    batch.update(db.collection('contacts').doc(u.id), {
      pipeline: 'B',
      pipelineAssignment: {
        primaryPipeline: 'B',
        pipelineBStatus: 'QUALIFIED',
        lastScoredAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });
  }

  await batch.commit();
  console.log('Updated', updates.length, 'contacts to Pipeline B');
}

fixPipelineBContacts().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
