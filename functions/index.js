/**
 * Firebase Cloud Functions for yellowCircle
 * Simple v1 style without params module
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// In-memory rate limiting (resets on function cold start)
const rateLimitStore = new Map();

const getRateLimitKey = (ip) => {
  const today = new Date().toISOString().split("T")[0];
  return `${ip}-${today}`;
};

const checkRateLimit = (ip, limit = 3) => {
  const key = getRateLimitKey(ip);
  const current = rateLimitStore.get(key) || 0;

  if (current >= limit) {
    return { allowed: false, remaining: 0, used: current };
  }

  rateLimitStore.set(key, current + 1);
  return { allowed: true, remaining: limit - current - 1, used: current + 1 };
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

  const rateLimit = checkRateLimit(clientIp, 3);
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
    const { to, from, subject, html, text, replyTo, tags } = request.body;

    if (!to || !subject || (!html && !text)) {
      response.status(400).json({
        error: "Missing required fields: to, subject, and html or text"
      });
      return;
    }

    // Get API key from Firebase config (set via: firebase functions:config:set resend.api_key="xxx")
    const resendApiKey = functions.config().resend?.api_key;

    if (!resendApiKey) {
      response.status(500).json({ error: "Resend API key not configured" });
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
