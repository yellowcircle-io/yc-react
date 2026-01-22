/**
 * HTTP Cloud Function to get user info by email
 * Used to find the correct userId for link updates
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.getUserInfo = functions
  .runWith({
    invoker: "public"
  })
  .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");

    const email = req.query.email || "christopher@yellowcircle.io";

    try {
      const user = await admin.auth().getUserByEmail(email);

      // Also get unique userIds from links collection
      const db = admin.firestore();
      const linksSnapshot = await db.collection("links").limit(200).get();

      const userIdCounts = {};
      linksSnapshot.forEach(doc => {
        const userId = doc.data().userId;
        userIdCounts[userId] = (userIdCounts[userId] || 0) + 1;
      });

      res.status(200).json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        },
        linksUserIds: userIdCounts,
        updateCommand: `curl "https://us-central1-yellowcircle-app.cloudfunctions.net/updateLinkUserIds?newUserId=${user.uid}"`
      });

    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
