/**
 * Quick script to check user IDs in links collection
 */

const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "yellowcircle-app"
});

const db = admin.firestore();

async function checkUserIds() {
  console.log("Checking links collection for user IDs...\n");

  // Get all unique user IDs
  const snapshot = await db.collection("links").limit(100).get();

  const userIdCounts = {};
  snapshot.forEach(doc => {
    const userId = doc.data().userId;
    userIdCounts[userId] = (userIdCounts[userId] || 0) + 1;
  });

  console.log("User ID counts (first 100 links):");
  for (const [userId, count] of Object.entries(userIdCounts)) {
    console.log(`  ${userId}: ${count} links`);
  }

  // Check total count for hardcoded user ID
  const importedSnapshot = await db.collection("links")
    .where("userId", "==", "IuNWCJcUWKdNJhzBbJsFY0nSE7H3")
    .count()
    .get();

  console.log(`\nTotal links for import user ID: ${importedSnapshot.data().count}`);

  // Get total links
  const totalSnapshot = await db.collection("links").count().get();
  console.log(`Total links in collection: ${totalSnapshot.data().count}`);
}

checkUserIds()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error:", err);
    process.exit(1);
  });
