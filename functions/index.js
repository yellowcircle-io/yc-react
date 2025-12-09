/**
 * Firebase Cloud Functions for yellowCircle
 * Simple v1 style without params module
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Persistent rate limiting using Firestore (survives cold starts)
const checkRateLimit = async (ip, limit = 3) => {
  const today = new Date().toISOString().split("T")[0];
  const rateLimitRef = db.collection("rate_limits").doc(`${ip}-${today}`);

  try {
    // Use transaction for atomic read-modify-write
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);

      if (doc.exists) {
        const data = doc.data();
        const current = data.count || 0;

        if (current >= limit) {
          return { allowed: false, remaining: 0, used: current };
        }

        // Increment count
        transaction.update(rateLimitRef, {
          count: current + 1,
          lastRequest: admin.firestore.FieldValue.serverTimestamp()
        });

        return { allowed: true, remaining: limit - current - 1, used: current + 1 };
      } else {
        // First request from this IP today
        transaction.set(rateLimitRef, {
          ip: ip,
          date: today,
          count: 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastRequest: admin.firestore.FieldValue.serverTimestamp(),
          // Auto-expire after 25 hours for cleanup
          expiresAt: new Date(Date.now() + 25 * 60 * 60 * 1000)
        });

        return { allowed: true, remaining: limit - 1, used: 1 };
      }
    });

    return result;
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fail open (allow request) if Firestore has issues
    return { allowed: true, remaining: 0, used: 0, error: true };
  }
};

// CORS middleware
const setCors = (response) => {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");
};

/**
 * Generate Email Content - Proxy for Groq API
 */
exports.generate = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const clientIp = request.headers["x-forwarded-for"]?.split(",")[0] ||
                   request.connection?.remoteAddress || "unknown";

  const rateLimit = await checkRateLimit(clientIp, 3);
  response.set("X-RateLimit-Limit", "3");
  response.set("X-RateLimit-Remaining", String(rateLimit.remaining));

  if (!rateLimit.allowed) {
    response.status(429).json({
      error: "Rate limit exceeded. Enter your own API key to continue.",
      limit: 3,
      remaining: 0
    });
    return;
  }

  try {
    const { prompt, stage } = request.body;

    if (!prompt) {
      response.status(400).json({ error: "Missing prompt" });
      return;
    }

    // Get API key from Firebase config (set via: firebase functions:config:set groq.api_key="xxx")
    const groqApiKey = functions.config().groq?.api_key;

    if (!groqApiKey) {
      response.status(500).json({ error: "Groq API key not configured" });
      return;
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: "You are an expert email copywriter. Write concise, engaging emails." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!groqResponse.ok) {
      console.error("Groq API error:", await groqResponse.text());
      response.status(502).json({ error: "LLM service error" });
      return;
    }

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      response.status(500).json({ error: "No content generated" });
      return;
    }

    response.json({ content, stage: stage || "unknown", creditsRemaining: rateLimit.remaining });
  } catch (error) {
    console.error("Generate function error:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Health check endpoint
 */
exports.health = functions.https.onRequest((request, response) => {
  setCors(response);
  response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

/**
 * Send Email via Resend API - Proxy to avoid CORS
 */
exports.sendEmail = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { to, from, subject, html, text, replyTo, tags, apiKey } = request.body;

    if (!to || !subject || (!html && !text)) {
      response.status(400).json({
        error: "Missing required fields: to, subject, and html or text"
      });
      return;
    }

    // Use user-provided API key first, fall back to Firebase config
    const resendApiKey = apiKey || functions.config().resend?.api_key;

    if (!resendApiKey) {
      response.status(500).json({ error: "Resend API key not provided or configured" });
      return;
    }

    const fromAddress = from || "yellowCircle <hello@yellowcircle.io>";

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        reply_to: replyTo,
        tags: tags || []
      })
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.json();
      console.error("Resend API error:", error);
      response.status(resendResponse.status).json({
        error: error.message || "Failed to send email",
        details: error
      });
      return;
    }

    const data = await resendResponse.json();
    console.log(`Email sent: ${data.id} to ${to}`);

    response.json({ id: data.id, status: "sent", provider: "resend" });
  } catch (error) {
    console.error("SendEmail function error:", error);
    response.status(500).json({ error: "Internal server error" });
  }
});

// ============================================
// UnityMAP Journey Execution Engine
// ============================================

/**
 * Helper: Calculate delay in milliseconds
 */
const calculateDelayMs = (delay, unit) => {
  const multipliers = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000
  };
  return delay * (multipliers[unit] || multipliers.days);
};

/**
 * Helper: Find the next node in the journey
 */
const findNextNode = (currentNodeId, edges, sourceHandle = null) => {
  const edge = edges.find(e =>
    e.source === currentNodeId &&
    (sourceHandle === null || e.sourceHandle === sourceHandle)
  );
  return edge ? edge.target : null;
};

/**
 * Helper: Send email via Resend
 */
const sendEmailInternal = async (to, subject, html, resendApiKey) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "yellowCircle <hello@yellowcircle.io>",
      to: [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Resend API error");
  }

  const data = await response.json();
  return data.id;
};

/**
 * Process a single prospect through their current node
 */
const processProspect = async (prospect, journey, resendApiKey) => {
  const { nodes, edges } = journey;
  const currentNode = nodes.find(n => n.id === prospect.currentNodeId);

  if (!currentNode) {
    console.error(`Node not found: ${prospect.currentNodeId}`);
    return { ...prospect, status: "error" };
  }

  const now = new Date();
  let updatedProspect = { ...prospect };

  switch (currentNode.type) {
    case "emailNode": {
      // Send the email
      try {
        const subject = currentNode.data.subject || "Message from yellowCircle";
        const html = currentNode.data.fullBody || currentNode.data.preview || "";

        const messageId = await sendEmailInternal(
          prospect.email,
          subject,
          html,
          resendApiKey
        );

        console.log(`✅ Email sent to ${prospect.email}: ${messageId}`);

        // Record in history
        updatedProspect.history = [
          ...(prospect.history || []),
          {
            nodeId: currentNode.id,
            action: "sent",
            at: admin.firestore.Timestamp.now(),
            messageId
          }
        ];

        // Move to next node
        const nextNodeId = findNextNode(currentNode.id, edges);
        if (nextNodeId) {
          updatedProspect.currentNodeId = nextNodeId;
          updatedProspect.nextExecuteAt = admin.firestore.Timestamp.now();
        } else {
          updatedProspect.status = "completed";
        }
      } catch (error) {
        console.error(`❌ Email failed for ${prospect.email}:`, error.message);
        updatedProspect.history = [
          ...(prospect.history || []),
          {
            nodeId: currentNode.id,
            action: "failed",
            at: admin.firestore.Timestamp.now(),
            error: error.message
          }
        ];
        // Don't advance, will retry next cycle
      }
      break;
    }

    case "waitNode": {
      // Calculate when wait ends
      const delay = currentNode.data.delay || 1;
      const unit = currentNode.data.unit || "days";
      const delayMs = calculateDelayMs(delay, unit);

      // Check if this is first time hitting wait node
      const lastHistory = prospect.history?.[prospect.history.length - 1];
      const isFirstHit = lastHistory?.nodeId !== currentNode.id || lastHistory?.action !== "waiting";

      if (isFirstHit) {
        // Record entering wait
        const waitUntil = new Date(now.getTime() + delayMs);
        updatedProspect.history = [
          ...(prospect.history || []),
          {
            nodeId: currentNode.id,
            action: "waiting",
            at: admin.firestore.Timestamp.now(),
            waitUntil: admin.firestore.Timestamp.fromDate(waitUntil)
          }
        ];
        updatedProspect.nextExecuteAt = admin.firestore.Timestamp.fromDate(waitUntil);
        console.log(`⏳ ${prospect.email} waiting until ${waitUntil.toISOString()}`);
      } else {
        // Wait complete, move to next node
        const nextNodeId = findNextNode(currentNode.id, edges);
        if (nextNodeId) {
          updatedProspect.currentNodeId = nextNodeId;
          updatedProspect.nextExecuteAt = admin.firestore.Timestamp.now();
          console.log(`✅ ${prospect.email} wait complete, advancing to ${nextNodeId}`);
        } else {
          updatedProspect.status = "completed";
        }
      }
      break;
    }

    case "conditionNode": {
      // For now, default to "no" path (no tracking yet)
      // Phase 2 will check open/click webhooks
      const sourceHandle = "no"; // Default path
      const nextNodeId = findNextNode(currentNode.id, edges, sourceHandle);

      updatedProspect.history = [
        ...(prospect.history || []),
        {
          nodeId: currentNode.id,
          action: "evaluated",
          at: admin.firestore.Timestamp.now(),
          result: sourceHandle
        }
      ];

      if (nextNodeId) {
        updatedProspect.currentNodeId = nextNodeId;
        updatedProspect.nextExecuteAt = admin.firestore.Timestamp.now();
      } else {
        updatedProspect.status = "completed";
      }
      console.log(`🔀 ${prospect.email} condition: ${sourceHandle} → ${nextNodeId || "end"}`);
      break;
    }

    case "exitNode": {
      updatedProspect.status = "completed";
      updatedProspect.history = [
        ...(prospect.history || []),
        {
          nodeId: currentNode.id,
          action: "completed",
          at: admin.firestore.Timestamp.now()
        }
      ];
      console.log(`🏁 ${prospect.email} journey completed`);
      break;
    }

    default:
      // Skip unknown node types, move to next
      const nextNodeId = findNextNode(currentNode.id, edges);
      if (nextNodeId) {
        updatedProspect.currentNodeId = nextNodeId;
      }
      break;
  }

  return updatedProspect;
};

/**
 * Process Journeys - Scheduled function
 * Runs every 15 minutes to process active journeys
 */
exports.processJourneys = functions.pubsub
  .schedule("every 15 minutes")
  .timeZone("America/New_York")
  .onRun(async (context) => {
    console.log("🚀 Starting journey processing...");

    const resendApiKey = functions.config().resend?.api_key;
    if (!resendApiKey) {
      console.error("❌ Resend API key not configured");
      return null;
    }

    try {
      // Query active journeys
      const journeysSnapshot = await db
        .collection("journeys")
        .where("status", "==", "active")
        .get();

      console.log(`📋 Found ${journeysSnapshot.size} active journeys`);

      let totalProcessed = 0;
      let totalEmails = 0;

      for (const journeyDoc of journeysSnapshot.docs) {
        const journey = journeyDoc.data();
        const journeyId = journeyDoc.id;

        console.log(`\n📦 Processing journey: ${journey.title} (${journeyId})`);

        const now = admin.firestore.Timestamp.now();
        let prospectsUpdated = false;
        let emailsSent = 0;

        const updatedProspects = [];

        for (const prospect of journey.prospects || []) {
          // Skip non-active prospects
          if (prospect.status !== "active") {
            updatedProspects.push(prospect);
            continue;
          }

          // Check if ready to process
          if (prospect.nextExecuteAt && prospect.nextExecuteAt.toMillis() > now.toMillis()) {
            updatedProspects.push(prospect);
            continue;
          }

          // Process this prospect
          const updated = await processProspect(prospect, journey, resendApiKey);
          updatedProspects.push(updated);
          prospectsUpdated = true;
          totalProcessed++;

          // Count emails
          const lastAction = updated.history?.[updated.history.length - 1];
          if (lastAction?.action === "sent") {
            emailsSent++;
            totalEmails++;
          }
        }

        // Update journey if prospects changed
        if (prospectsUpdated) {
          // Calculate updated stats
          const stats = {
            ...journey.stats,
            sent: updatedProspects.reduce((sum, p) =>
              sum + (p.history?.filter(h => h.action === "sent").length || 0), 0
            ),
            completed: updatedProspects.filter(p => p.status === "completed").length
          };

          // Check if all prospects completed
          const allCompleted = updatedProspects.every(p => p.status !== "active");

          await journeyDoc.ref.update({
            prospects: updatedProspects,
            stats,
            status: allCompleted ? "completed" : "active",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`  ✅ Updated ${journeyId}: ${emailsSent} emails sent`);
        }
      }

      console.log(`\n🏁 Processing complete: ${totalProcessed} prospects, ${totalEmails} emails`);
      return null;

    } catch (error) {
      console.error("❌ Journey processing error:", error);
      return null;
    }
  });

/**
 * Manual trigger for journey processing (for testing)
 */
exports.triggerJourneyProcessing = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Simple auth check - require a secret header
  const authHeader = request.headers["x-journey-auth"];
  const expectedAuth = functions.config().journey?.auth_key;

  if (!expectedAuth || authHeader !== expectedAuth) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  console.log("🚀 Manual journey processing triggered...");

  const resendApiKey = functions.config().resend?.api_key;
  if (!resendApiKey) {
    response.status(500).json({ error: "Resend API key not configured" });
    return;
  }

  try {
    const journeysSnapshot = await db
      .collection("journeys")
      .where("status", "==", "active")
      .get();

    let processed = 0;
    let emails = 0;

    for (const journeyDoc of journeysSnapshot.docs) {
      const journey = journeyDoc.data();
      const now = admin.firestore.Timestamp.now();

      const updatedProspects = [];

      for (const prospect of journey.prospects || []) {
        if (prospect.status !== "active") {
          updatedProspects.push(prospect);
          continue;
        }

        if (prospect.nextExecuteAt && prospect.nextExecuteAt.toMillis() > now.toMillis()) {
          updatedProspects.push(prospect);
          continue;
        }

        const updated = await processProspect(prospect, journey, resendApiKey);
        updatedProspects.push(updated);
        processed++;

        const lastAction = updated.history?.[updated.history.length - 1];
        if (lastAction?.action === "sent") {
          emails++;
        }
      }

      const stats = {
        ...journey.stats,
        sent: updatedProspects.reduce((sum, p) =>
          sum + (p.history?.filter(h => h.action === "sent").length || 0), 0
        ),
        completed: updatedProspects.filter(p => p.status === "completed").length
      };

      const allCompleted = updatedProspects.every(p => p.status !== "active");

      await journeyDoc.ref.update({
        prospects: updatedProspects,
        stats,
        status: allCompleted ? "completed" : "active",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    response.json({
      success: true,
      journeys: journeysSnapshot.size,
      prospectsProcessed: processed,
      emailsSent: emails
    });

  } catch (error) {
    console.error("❌ Manual trigger error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Scheduled Cleanup Function - Runs weekly
 * Cleans up:
 * - Old capsules (>90 days with low views)
 * - Old journeys (>90 days completed/inactive)
 * - Expired documents
 *
 * Schedule: Every Sunday at 3am UTC
 */
exports.scheduledCleanup = functions.pubsub
  .schedule("0 3 * * 0")
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log("🧹 Starting scheduled cleanup...");

    const now = new Date();
    const stats = {
      capsulesDeleted: 0,
      capsulesKept: 0,
      journeysDeleted: 0,
      journeysKept: 0,
      rateLimitsDeleted: 0,
      errors: []
    };

    // === CLEANUP RATE LIMITS ===
    // Delete rate limit records older than 2 days
    const rateLimitCutoff = new Date();
    rateLimitCutoff.setDate(rateLimitCutoff.getDate() - 2);

    const rateLimitsSnapshot = await db.collection("rate_limits").get();
    for (const doc of rateLimitsSnapshot.docs) {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(0);
      const expiresAt = data.expiresAt?.toDate?.() || null;

      if ((expiresAt && expiresAt < now) || createdAt < rateLimitCutoff) {
        try {
          await doc.ref.delete();
          stats.rateLimitsDeleted++;
        } catch (err) {
          stats.errors.push(`Rate limit ${doc.id}: ${err.message}`);
        }
      }
    }
    console.log(`🗑️ Deleted ${stats.rateLimitsDeleted} expired rate limit records`);

    try {
      // === CLEANUP CAPSULES ===
      const capsuleCutoff = new Date();
      capsuleCutoff.setDate(capsuleCutoff.getDate() - 90); // 90 days
      const minViews = 3;

      const capsulesSnapshot = await db.collection("capsules").get();

      for (const capsuleDoc of capsulesSnapshot.docs) {
        const data = capsuleDoc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date(0);
        const expiresAt = data.expiresAt?.toDate?.() || null;
        const viewCount = data.viewCount || 0;
        const isV2 = data.version === 2;

        // Delete if: expired OR (old AND low views)
        const isExpired = expiresAt && expiresAt < now;
        const isOldAndLowViews = createdAt < capsuleCutoff && viewCount < minViews;

        if (isExpired || isOldAndLowViews) {
          try {
            // For v1 capsules, delete subcollections first
            if (!isV2) {
              const nodesSnap = await db.collection(`capsules/${capsuleDoc.id}/nodes`).get();
              const edgesSnap = await db.collection(`capsules/${capsuleDoc.id}/edges`).get();

              const batch = db.batch();
              nodesSnap.docs.forEach(doc => batch.delete(doc.ref));
              edgesSnap.docs.forEach(doc => batch.delete(doc.ref));
              await batch.commit();
            }

            await capsuleDoc.ref.delete();
            stats.capsulesDeleted++;
            console.log(`🗑️ Deleted capsule: ${capsuleDoc.id} (views: ${viewCount}, age: ${Math.round((now - createdAt) / (1000 * 60 * 60 * 24))} days)`);
          } catch (err) {
            stats.errors.push(`Capsule ${capsuleDoc.id}: ${err.message}`);
          }
        } else {
          stats.capsulesKept++;
        }
      }

      // === CLEANUP JOURNEYS ===
      const journeyCutoff = new Date();
      journeyCutoff.setDate(journeyCutoff.getDate() - 90); // 90 days

      const journeysSnapshot = await db.collection("journeys").get();

      for (const journeyDoc of journeysSnapshot.docs) {
        const data = journeyDoc.data();
        const updatedAt = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(0);
        const expiresAt = data.expiresAt?.toDate?.() || null;
        const status = data.status || "draft";

        // Delete if: expired OR (old AND completed/inactive)
        const isExpired = expiresAt && expiresAt < now;
        const isOldAndDone = updatedAt < journeyCutoff && (status === "completed" || status === "draft");

        if (isExpired || isOldAndDone) {
          try {
            await journeyDoc.ref.delete();
            stats.journeysDeleted++;
            console.log(`🗑️ Deleted journey: ${journeyDoc.id} (status: ${status}, age: ${Math.round((now - updatedAt) / (1000 * 60 * 60 * 24))} days)`);
          } catch (err) {
            stats.errors.push(`Journey ${journeyDoc.id}: ${err.message}`);
          }
        } else {
          stats.journeysKept++;
        }
      }

      console.log(`\n📊 Cleanup complete:`);
      console.log(`   Capsules: ${stats.capsulesDeleted} deleted, ${stats.capsulesKept} kept`);
      console.log(`   Journeys: ${stats.journeysDeleted} deleted, ${stats.journeysKept} kept`);
      if (stats.errors.length > 0) {
        console.log(`   Errors: ${stats.errors.length}`);
        stats.errors.forEach(e => console.error(`   - ${e}`));
      }

      return stats;

    } catch (error) {
      console.error("❌ Scheduled cleanup error:", error);
      throw error;
    }
  });

// ============================================
// Client Access Request System
// ============================================

/**
 * Request Client Access - User submits access request
 * Creates pending request in Firestore and sends admin notification
 */
exports.requestAccess = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { email, name, company, reason } = request.body;

    if (!email) {
      response.status(400).json({ error: "Email is required" });
      return;
    }

    // Check if already a client
    const clientWhitelist = await db.doc("config/client_whitelist").get();
    const existingEmails = clientWhitelist.exists ? (clientWhitelist.data().emails || []) : [];

    if (existingEmails.includes(email.toLowerCase().trim())) {
      response.json({
        success: true,
        message: "You already have client access. Please sign in.",
        alreadyClient: true
      });
      return;
    }

    // Check for existing pending request
    const existingRequest = await db.collection("access_requests")
      .where("email", "==", email.toLowerCase().trim())
      .where("status", "==", "pending")
      .get();

    if (!existingRequest.empty) {
      response.json({
        success: true,
        message: "Your request is already pending review.",
        alreadyPending: true
      });
      return;
    }

    // Generate unique request ID for approval link
    const requestId = db.collection("access_requests").doc().id;
    const approvalToken = Buffer.from(`${requestId}:${Date.now()}`).toString("base64url");

    // Create access request
    await db.collection("access_requests").doc(requestId).set({
      email: email.toLowerCase().trim(),
      name: name || "",
      company: company || "",
      reason: reason || "",
      status: "pending",
      approvalToken,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ip: request.headers["x-forwarded-for"]?.split(",")[0] || "unknown"
    });

    // Send admin notification email
    const resendApiKey = functions.config().resend?.api_key;
    if (resendApiKey) {
      const approvalUrl = `https://yellowcircle.io/approve-access?token=${approvalToken}`;
      const denyUrl = `https://yellowcircle.io/deny-access?token=${approvalToken}`;

      const adminEmails = ["christopher@yellowcircle.io", "info@yellowcircle.io"];

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: #fbbf24; border-radius: 50%; margin: 0 auto 15px;"></div>
            <h1 style="color: #1f2937; font-size: 24px; margin: 0;">New Access Request</h1>
          </div>

          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <p style="margin: 0 0 10px;"><strong>Email:</strong> ${email}</p>
            ${name ? `<p style="margin: 0 0 10px;"><strong>Name:</strong> ${name}</p>` : ""}
            ${company ? `<p style="margin: 0 0 10px;"><strong>Company:</strong> ${company}</p>` : ""}
            ${reason ? `<p style="margin: 0;"><strong>Reason:</strong> ${reason}</p>` : ""}
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${approvalUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 10px;">✓ Approve Access</a>
            <a href="${denyUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">✗ Deny</a>
          </div>

          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            Request ID: ${requestId}<br>
            Received: ${new Date().toLocaleString()}
          </p>
        </div>
      `;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "yellowCircle <hello@yellowcircle.io>",
            to: adminEmails,
            subject: `🟡 Access Request: ${email}`,
            html: emailHtml
          })
        });
        const emailResult = await emailResponse.json();
        if (emailResponse.ok) {
          console.log(`✅ Admin notification sent for ${email}`, emailResult);
        } else {
          console.error("Resend API error:", emailResult);
        }
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }
    }

    response.json({
      success: true,
      message: "Access request submitted. You'll receive an email when approved.",
      requestId
    });

  } catch (error) {
    console.error("Access request error:", error);
    response.status(500).json({ error: "Failed to submit request" });
  }
});

/**
 * Approve Client Access - Admin clicks approval link
 * Updates whitelist and sends user notification
 */
exports.approveAccess = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const token = request.query.token || request.body?.token;

    if (!token) {
      response.status(400).json({ error: "Missing approval token" });
      return;
    }

    // Find request by token
    const requestsSnapshot = await db.collection("access_requests")
      .where("approvalToken", "==", token)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (requestsSnapshot.empty) {
      response.status(404).json({ error: "Request not found or already processed" });
      return;
    }

    const requestDoc = requestsSnapshot.docs[0];
    const requestData = requestDoc.data();
    const userEmail = requestData.email;

    // Add to client whitelist
    const clientRef = db.doc("config/client_whitelist");
    const clientDoc = await clientRef.get();
    const currentEmails = clientDoc.exists ? (clientDoc.data().emails || []) : [];

    if (!currentEmails.includes(userEmail)) {
      await clientRef.set({
        emails: [...currentEmails, userEmail],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: "approval_system"
      }, { merge: true });
    }

    // Update request status
    await requestDoc.ref.update({
      status: "approved",
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send user notification
    const resendApiKey = functions.config().resend?.api_key;
    if (resendApiKey) {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: #fbbf24; border-radius: 50%; margin: 0 auto 15px;"></div>
            <h1 style="color: #1f2937; font-size: 24px; margin: 0;">Access Approved! 🎉</h1>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Great news! Your access request has been approved.
          </p>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            You now have full access to yellowCircle Unity tools. Simply sign in with your Google account (${userEmail}) to get started.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://yellowcircle.io/unity-notes" style="display: inline-block; background: #fbbf24; color: #000; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: 700;">Access Unity Hub →</a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Questions? Reply to this email or contact us at hello@yellowcircle.io
          </p>
        </div>
      `;

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "yellowCircle <hello@yellowcircle.io>",
            to: [userEmail],
            subject: "Your yellowCircle Access is Approved! 🎉",
            html: emailHtml
          })
        });
        console.log(`✅ Approval notification sent to ${userEmail}`);
      } catch (emailError) {
        console.error("Failed to send user notification:", emailError);
      }
    }

    console.log(`✅ Approved access for ${userEmail}`);

    // Return HTML page for browser
    response.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Access Approved</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
            .card { background: white; padding: 40px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; }
            .circle { width: 80px; height: 80px; background: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
            .circle svg { width: 40px; height: 40px; stroke: white; }
            h1 { color: #1f2937; margin: 0 0 10px; }
            p { color: #6b7280; margin: 0 0 20px; }
            .email { background: #f3f4f6; padding: 10px 20px; border-radius: 8px; font-weight: 500; color: #374151; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1>Access Approved</h1>
            <p>Client access has been granted to:</p>
            <div class="email">${userEmail}</div>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("Approve access error:", error);
    response.status(500).json({ error: "Failed to approve access" });
  }
});

/**
 * Deny Client Access - Admin clicks deny link
 */
exports.denyAccess = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const token = request.query.token || request.body?.token;

    if (!token) {
      response.status(400).json({ error: "Missing token" });
      return;
    }

    // Find request by token
    const requestsSnapshot = await db.collection("access_requests")
      .where("approvalToken", "==", token)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (requestsSnapshot.empty) {
      response.status(404).json({ error: "Request not found or already processed" });
      return;
    }

    const requestDoc = requestsSnapshot.docs[0];
    const requestData = requestDoc.data();

    // Update request status
    await requestDoc.ref.update({
      status: "denied",
      deniedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`❌ Denied access for ${requestData.email}`);

    // Return HTML page
    response.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Access Denied</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
            .card { background: white; padding: 40px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; }
            .circle { width: 80px; height: 80px; background: #ef4444; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
            .circle svg { width: 40px; height: 40px; stroke: white; }
            h1 { color: #1f2937; margin: 0 0 10px; }
            p { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1>Access Denied</h1>
            <p>Request for ${requestData.email} has been denied.</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("Deny access error:", error);
    response.status(500).json({ error: "Failed to deny access" });
  }
});

/**
 * Manual Cleanup Trigger (for testing/admin)
 * Call via: POST /manualCleanup with admin auth
 */
exports.manualCleanup = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Simple auth check - require bypass token
  const authToken = request.headers["x-admin-token"];
  const expectedToken = functions.config().admin?.cleanup_token || "yc-cleanup-2025";

  if (authToken !== expectedToken) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // Trigger the same logic as scheduled cleanup
    const context = { timestamp: new Date().toISOString() };

    // Import and run cleanup logic inline
    const stats = {
      capsulesDeleted: 0,
      capsulesKept: 0,
      journeysDeleted: 0,
      journeysKept: 0
    };

    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    // Cleanup capsules
    const capsulesSnapshot = await db.collection("capsules").get();
    for (const doc of capsulesSnapshot.docs) {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(0);
      const viewCount = data.viewCount || 0;
      const expiresAt = data.expiresAt?.toDate?.() || null;

      if ((expiresAt && expiresAt < now) || (createdAt < cutoff && viewCount < 3)) {
        if (data.version !== 2) {
          const nodesSnap = await db.collection(`capsules/${doc.id}/nodes`).get();
          const edgesSnap = await db.collection(`capsules/${doc.id}/edges`).get();
          const batch = db.batch();
          nodesSnap.docs.forEach(d => batch.delete(d.ref));
          edgesSnap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
        await doc.ref.delete();
        stats.capsulesDeleted++;
      } else {
        stats.capsulesKept++;
      }
    }

    // Cleanup journeys
    const journeysSnapshot = await db.collection("journeys").get();
    for (const doc of journeysSnapshot.docs) {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toDate?.() || new Date(0);
      const expiresAt = data.expiresAt?.toDate?.() || null;
      const status = data.status || "draft";

      if ((expiresAt && expiresAt < now) || (updatedAt < cutoff && status !== "active")) {
        await doc.ref.delete();
        stats.journeysDeleted++;
      } else {
        stats.journeysKept++;
      }
    }

    response.json({
      success: true,
      stats,
      message: `Cleaned up ${stats.capsulesDeleted} capsules and ${stats.journeysDeleted} journeys`
    });

  } catch (error) {
    console.error("❌ Manual cleanup error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Stop All Journeys - Emergency function to halt all active email campaigns
 * Call via: POST /stopAllJourneys with admin auth
 * Query params:
 *   - action: "stop" (sets all to paused) or "delete" (removes all journeys)
 */
exports.stopAllJourneys = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Auth check
  const authToken = request.headers["x-admin-token"];
  const expectedToken = functions.config().admin?.cleanup_token || "yc-cleanup-2025";

  if (authToken !== expectedToken) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  const action = request.query.action || request.body?.action || "stop";

  try {
    const journeysSnapshot = await db.collection("journeys").get();
    const stats = {
      total: journeysSnapshot.size,
      stopped: 0,
      deleted: 0,
      details: []
    };

    for (const doc of journeysSnapshot.docs) {
      const data = doc.data();
      const journeyInfo = {
        id: doc.id,
        title: data.title || "Untitled",
        status: data.status || "unknown",
        prospectsCount: (data.prospects || []).length
      };

      if (action === "delete") {
        await doc.ref.delete();
        stats.deleted++;
        journeyInfo.action = "deleted";
      } else {
        // Stop by setting status to "paused" and clearing next send times
        const updatedProspects = (data.prospects || []).map(p => ({
          ...p,
          nextSendAt: null, // Clear scheduled sends
          status: p.status === "active" ? "paused" : p.status
        }));

        await doc.ref.update({
          status: "paused",
          prospects: updatedProspects,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          stoppedAt: admin.firestore.FieldValue.serverTimestamp(),
          stoppedReason: "Manual stop via admin function"
        });
        stats.stopped++;
        journeyInfo.action = "stopped";
      }

      stats.details.push(journeyInfo);
    }

    console.log(`🛑 Journey ${action}: ${action === "delete" ? stats.deleted : stats.stopped}/${stats.total}`);

    response.json({
      success: true,
      action,
      stats,
      message: action === "delete"
        ? `Deleted ${stats.deleted} journeys`
        : `Stopped ${stats.stopped} active journeys`
    });

  } catch (error) {
    console.error("❌ Stop journeys error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Delete Access Request - Admin function to clear pending requests
 * Call via: POST /deleteAccessRequest with admin auth
 * Body: { email: "email@example.com" } or { all: true } to delete all
 */
exports.deleteAccessRequest = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Auth check
  const authToken = request.headers["x-admin-token"];
  const expectedToken = functions.config().admin?.cleanup_token || "yc-cleanup-2025";

  if (authToken !== expectedToken) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { email, all } = request.body;

  try {
    let snapshot;
    if (all) {
      snapshot = await db.collection("access_requests").get();
    } else if (email) {
      snapshot = await db.collection("access_requests")
        .where("email", "==", email.toLowerCase().trim())
        .get();
    } else {
      response.status(400).json({ error: "Provide email or all:true" });
      return;
    }

    const deleted = [];
    for (const doc of snapshot.docs) {
      deleted.push({ id: doc.id, email: doc.data().email, status: doc.data().status });
      await doc.ref.delete();
    }

    response.json({
      success: true,
      deleted: deleted.length,
      details: deleted
    });

  } catch (error) {
    console.error("❌ Delete access request error:", error);
    response.status(500).json({ error: error.message });
  }
});
