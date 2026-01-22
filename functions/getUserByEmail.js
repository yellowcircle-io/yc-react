/**
 * Quick script to get Firebase Auth UID from email
 */

const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "yellowcircle-app"
});

async function getUserByEmail() {
  const email = "christopher@yellowcircle.io";

  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log("User found:");
    console.log("  UID:", user.uid);
    console.log("  Email:", user.email);
    console.log("  Display Name:", user.displayName);
    console.log("  Created:", user.metadata.creationTime);
    return user.uid;
  } catch (error) {
    console.error("Error getting user:", error);
    process.exit(1);
  }
}

getUserByEmail()
  .then((uid) => {
    console.log("\nUse this command to update the links:");
    console.log(`curl "https://us-central1-yellowcircle-app.cloudfunctions.net/updateLinkUserIds?newUserId=${uid}"`);
    process.exit(0);
  })
  .catch(err => {
    console.error("Error:", err);
    process.exit(1);
  });
