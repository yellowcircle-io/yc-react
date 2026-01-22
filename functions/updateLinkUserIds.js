/**
 * Update Link User IDs
 *
 * HTTP Cloud Function to update the userId field on imported links.
 * The original import used a hardcoded userId, this updates them to the correct one.
 *
 * Usage: Pass the new userId as a query parameter
 * GET https://[region]-yellowcircle-app.cloudfunctions.net/updateLinkUserIds?newUserId=CORRECT_UID
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// The userId used during the Pocket import (hardcoded mistake)
const OLD_USER_ID = "IuNWCJcUWKdNJhzBbJsFY0nSE7H3";
const BATCH_SIZE = 500;

exports.updateLinkUserIds = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "1GB",
    invoker: "public"
  })
  .https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    const newUserId = req.query.newUserId;

    if (!newUserId) {
      res.status(400).json({
        success: false,
        error: "Missing newUserId query parameter"
      });
      return;
    }

    console.log(`Updating links from ${OLD_USER_ID} to ${newUserId}`);

    try {
      let totalUpdated = 0;
      let batchCount = 0;

      // Process in batches
      while (true) {
        // Get a batch of links with the old userId
        const snapshot = await db.collection("links")
          .where("userId", "==", OLD_USER_ID)
          .limit(BATCH_SIZE)
          .get();

        if (snapshot.empty) {
          console.log("No more links to update");
          break;
        }

        const batch = db.batch();
        let updateCount = 0;

        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { userId: newUserId });
          updateCount++;
        });

        await batch.commit();
        totalUpdated += updateCount;
        batchCount++;

        console.log(`Batch ${batchCount}: Updated ${updateCount} links (Total: ${totalUpdated})`);
      }

      res.status(200).json({
        success: true,
        message: `Updated ${totalUpdated} links from ${OLD_USER_ID} to ${newUserId}`,
        totalUpdated,
        batchCount
      });

    } catch (error) {
      console.error("Error updating links:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
