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

// ============================================
// ESP (Email Service Provider) Hot-Swap System
// ============================================

/**
 * Get configured ESP provider
 * Priority: request param > Firebase config > default (resend)
 */
const getESPProvider = (requestProvider = null) => {
  if (requestProvider && ['resend', 'sendgrid'].includes(requestProvider)) {
    return requestProvider;
  }
  return functions.config().esp?.provider || 'resend';
};

/**
 * Send email via Resend
 */
const sendViaResend = async (options, apiKey) => {
  const { to, from, subject, html, text, replyTo, tags } = options;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: from || "yellowCircle <hello@yellowcircle.io>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo,
      tags: tags || []
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Resend API error");
  }

  const data = await response.json();
  return { id: data.id, status: "sent", provider: "resend" };
};

/**
 * Send email via SendGrid
 */
const sendViaSendGrid = async (options, apiKey) => {
  const { to, from, subject, html, text, replyTo, tags } = options;

  const fromAddress = from || "yellowCircle <hello@yellowcircle.io>";
  const fromParsed = typeof fromAddress === 'string'
    ? { email: fromAddress.match(/<(.+)>/)?.[1] || fromAddress, name: fromAddress.match(/(.+) </)?.[1]?.trim() || 'yellowCircle' }
    : fromAddress;

  const payload = {
    personalizations: [{
      to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }]
    }],
    from: fromParsed,
    subject,
    content: []
  };

  if (text) payload.content.push({ type: 'text/plain', value: text });
  if (html) payload.content.push({ type: 'text/html', value: html });
  if (replyTo) payload.reply_to = { email: replyTo };
  if (tags && tags.length > 0) {
    payload.categories = tags.map(tag => tag.name || tag.value || tag);
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.errors?.[0]?.message || "SendGrid API error");
  }

  const messageId = response.headers.get('X-Message-Id');
  return { id: messageId, status: "sent", provider: "sendgrid" };
};

/**
 * Unified email sender - routes to configured ESP
 */
const sendEmailViaESP = async (options, provider = null) => {
  const esp = getESPProvider(provider || options.provider);

  let apiKey;
  if (options.apiKey) {
    apiKey = options.apiKey;
  } else if (esp === 'sendgrid') {
    apiKey = functions.config().sendgrid?.api_key;
  } else {
    apiKey = functions.config().resend?.api_key;
  }

  if (!apiKey) {
    throw new Error(`${esp} API key not configured. Set firebase functions:config:set ${esp}.api_key="YOUR_KEY"`);
  }

  if (esp === 'sendgrid') {
    return sendViaSendGrid(options, apiKey);
  }
  return sendViaResend(options, apiKey);
};

/**
 * Get current ESP configuration status
 */
exports.getESPStatus = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  const currentProvider = getESPProvider();
  const resendConfigured = !!functions.config().resend?.api_key;
  const sendgridConfigured = !!functions.config().sendgrid?.api_key;

  response.json({
    currentProvider,
    providers: {
      resend: {
        configured: resendConfigured,
        freeTier: "100 emails/day"
      },
      sendgrid: {
        configured: sendgridConfigured,
        freeTier: "100 emails/day"
      }
    },
    switchCommand: `firebase functions:config:set esp.provider="sendgrid"`,
    configuredProviders: [
      resendConfigured && 'resend',
      sendgridConfigured && 'sendgrid'
    ].filter(Boolean)
  });
});

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
 * Send Email via ESP - Hot-swappable provider (Resend or SendGrid)
 *
 * Supports provider selection via:
 * 1. Request body: { provider: "sendgrid" }
 * 2. Firebase config: esp.provider = "sendgrid"
 * 3. Default: "resend"
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
    const { to, from, subject, html, text, replyTo, tags, apiKey, provider } = request.body;

    if (!to || !subject || (!html && !text)) {
      response.status(400).json({
        error: "Missing required fields: to, subject, and html or text"
      });
      return;
    }

    const result = await sendEmailViaESP({
      to,
      from,
      subject,
      html,
      text,
      replyTo,
      tags,
      apiKey
    }, provider);

    console.log(`Email sent via ${result.provider}: ${result.id} to ${to}`);
    response.json(result);

  } catch (error) {
    console.error("SendEmail function error:", error);
    response.status(500).json({
      error: error.message || "Internal server error",
      provider: getESPProvider()
    });
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
 * Helper: Send email via configured ESP (used by journey engine)
 * @deprecated Use sendEmailViaESP instead for new code
 */
const sendEmailInternal = async (to, subject, html, apiKeyOrProvider = null) => {
  const result = await sendEmailViaESP({
    to,
    subject,
    html,
    apiKey: typeof apiKeyOrProvider === 'string' && apiKeyOrProvider.startsWith('re_') ? apiKeyOrProvider : null
  });
  return result.id;
};

/**
 * Send lifecycle event notification to n8n for Slack threading
 * Events: email_sent, email_opened, email_clicked, journey_step, journey_completed, score_changed
 */
const sendLifecycleNotification = async (eventType, lead, details = {}) => {
  const n8nWebhook = functions.config().n8n?.leads_webhook;
  if (!n8nWebhook) return { skipped: true, reason: 'no_webhook' };

  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    leadId: lead.id || null,
    email: lead.email || null,
    lead: {
      name: lead.name || lead.submittedData?.name || null,
      email: lead.email || null,
      company: lead.company || lead.submittedData?.company || null,
      source: lead.source || null,
      sourceForm: lead.sourceForm || null
    },
    details,
    slack: {
      channel: '#leads',
      message: formatLifecycleMessage(eventType, lead, details)
    }
  };

  try {
    await fetch(n8nWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`📣 Lifecycle notification sent: ${eventType} for ${lead.email}`);
    return { sent: true, event: eventType };
  } catch (error) {
    console.error(`❌ Lifecycle notification failed: ${error.message}`);
    return { sent: false, error: error.message };
  }
};

/**
 * Format lifecycle event message for Slack
 */
const formatLifecycleMessage = (eventType, lead, details) => {
  const email = lead.email || 'Unknown';
  const name = lead.name || lead.submittedData?.name || '';

  switch (eventType) {
    case 'email_sent':
      return `📧 *Email Sent* to ${email}\n• Subject: ${details.subject || 'N/A'}\n• Journey: ${details.journeyName || 'N/A'}`;
    case 'email_opened':
      return `👁️ *Email Opened* by ${email}\n• Subject: ${details.subject || 'N/A'}`;
    case 'email_clicked':
      return `🖱️ *Link Clicked* by ${email}\n• URL: ${details.url || 'N/A'}`;
    case 'journey_step':
      return `📍 *Journey Step* for ${email}\n• Step: ${details.stepName || details.nodeType || 'N/A'}\n• Journey: ${details.journeyName || 'N/A'}`;
    case 'journey_completed':
      return `🏁 *Journey Completed* for ${email}\n• Journey: ${details.journeyName || 'N/A'}\n• Duration: ${details.duration || 'N/A'}`;
    case 'score_changed':
      return `📊 *Score Updated* for ${email}\n• New Score: ${details.newScore || 'N/A'}\n• Change: ${details.change > 0 ? '+' : ''}${details.change || 0}`;
    default:
      return `📌 *${eventType}* for ${email}`;
  }
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
        const rawBody = currentNode.data.fullBody || currentNode.data.preview || "";

        // Replace template variables
        const prospectName = prospect.name || prospect.submittedData?.name || "there";
        const processedBody = rawBody
          .replace(/\{\{name\}\}/gi, prospectName)
          .replace(/\{\{email\}\}/gi, prospect.email || "")
          .replace(/\{\{company\}\}/gi, prospect.company || prospect.submittedData?.company || "");

        // Convert to HTML paragraphs
        const html = processedBody.split("\n\n").map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

        const messageId = await sendEmailInternal(
          prospect.email,
          subject,
          html,
          resendApiKey
        );

        console.log(`✅ Email sent to ${prospect.email}: ${messageId}`);

        // Send lifecycle notification for email sent
        sendLifecycleNotification('email_sent', prospect, {
          subject,
          journeyName: journey.title || 'Unknown Journey',
          nodeId: currentNode.id,
          messageId
        }).catch(err => console.error('Lifecycle notification error:', err));

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

      // Calculate journey duration
      const startTime = prospect.history?.[0]?.at?.toDate?.() || new Date();
      const duration = Math.round((new Date() - startTime) / (1000 * 60 * 60 * 24)); // days

      // Send lifecycle notification for journey completed
      sendLifecycleNotification('journey_completed', prospect, {
        journeyName: journey.title || 'Unknown Journey',
        duration: `${duration} days`,
        stepsCompleted: prospect.history?.length || 0
      }).catch(err => console.error('Lifecycle notification error:', err));

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
 * Runs every 4 hours to process active journeys (for follow-up emails)
 * NOTE: Welcome emails are sent immediately on lead creation, not via this scheduler
 * Use triggerJourneyProcessing for manual/immediate processing
 */
exports.processJourneys = functions.pubsub
  .schedule("every 4 hours")
  .timeZone("America/New_York")
  .onRun(async (context) => {
    console.log("🚀 Starting journey processing...");

    const resendApiKey = functions.config().resend?.api_key;
    if (!resendApiKey) {
      console.error("❌ Resend API key not configured");
      return null;
    }

    try {
      // COST OPTIMIZATION: Query only active journeys
      const journeysSnapshot = await db
        .collection("journeys")
        .where("status", "==", "active")
        .get();

      // Early exit if no active journeys (saves processing time)
      if (journeysSnapshot.empty) {
        console.log("📋 No active journeys - exiting early");
        return null;
      }

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

// ============================================================
// TRIGGER SYSTEM - Phase 3
// ============================================================

// In-memory cache for trigger rules (reduces Firestore reads)
// Cache expires after 5 minutes or on cold start
let triggerRulesCache = null;
let triggerRulesCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get trigger rules with caching
 */
const getCachedTriggerRules = async () => {
  const now = Date.now();

  // Return cached rules if still valid
  if (triggerRulesCache && (now - triggerRulesCacheTime) < CACHE_TTL_MS) {
    console.log('📦 Using cached trigger rules');
    return triggerRulesCache;
  }

  // Fetch fresh rules (fetch all, filter in code to avoid composite index)
  console.log('🔄 Fetching trigger rules from Firestore');
  const rulesSnapshot = await db.collection('triggerRules').get();

  // Filter enabled rules and sort by priority in code
  triggerRulesCache = rulesSnapshot.docs
    .map(doc => ({
      id: doc.id,
      ref: doc.ref,
      ...doc.data()
    }))
    .filter(rule => rule.enabled !== false) // Default to enabled if not explicitly set
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
  triggerRulesCacheTime = now;

  return triggerRulesCache;
};

/**
 * Invalidate trigger rules cache (call when rules are updated)
 */
const invalidateTriggerRulesCache = () => {
  triggerRulesCache = null;
  triggerRulesCacheTime = 0;
};

/**
 * Evaluate if a lead matches rule conditions
 */
const evaluateConditions = (lead, conditions, matchMode = 'all') => {
  if (!conditions || conditions.length === 0) return true;

  const results = conditions.map(cond => {
    const value = getNestedValue(lead, cond.field);
    const compareValue = cond.caseSensitive ? cond.value : String(cond.value).toLowerCase();
    const fieldValue = cond.caseSensitive ? value : String(value || '').toLowerCase();

    switch (cond.operator) {
      case 'equals':
        return fieldValue === compareValue;
      case 'not_equals':
        return fieldValue !== compareValue;
      case 'contains':
        return fieldValue.includes(compareValue);
      case 'not_contains':
        return !fieldValue.includes(compareValue);
      case 'starts_with':
        return fieldValue.startsWith(compareValue);
      case 'ends_with':
        return fieldValue.endsWith(compareValue);
      case 'greater_than':
        return Number(value) > Number(cond.value);
      case 'less_than':
        return Number(value) < Number(cond.value);
      case 'exists':
        return value !== undefined && value !== null && value !== '';
      case 'not_exists':
        return value === undefined || value === null || value === '';
      case 'in':
        return Array.isArray(cond.value) ? cond.value.includes(value) : false;
      default:
        return false;
    }
  });

  return matchMode === 'all'
    ? results.every(r => r)
    : results.some(r => r);
};

/**
 * Get nested value from object (e.g., "submittedData.score")
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
};

/**
 * Replace template variables in string (e.g., "{{email}}")
 */
const replaceTemplateVars = (template, data) => {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const value = getNestedValue(data, path);
    return value !== undefined ? String(value) : match;
  });
};

/**
 * Execute a single action
 */
const executeAction = async (action, lead, contactId) => {
  const resendApiKey = functions.config().resend?.api_key;
  const slackWebhook = functions.config().slack?.webhook;

  switch (action.type) {
    case 'enroll_journey': {
      const { journeyId } = action.config;
      if (!journeyId) throw new Error('journeyId required for enroll_journey');

      // Use createProspect logic inline
      const journeyRef = db.collection('journeys').doc(journeyId);
      const journeySnap = await journeyRef.get();

      if (!journeySnap.exists) {
        throw new Error(`Journey ${journeyId} not found`);
      }

      const journey = journeySnap.data();
      const { nodes, edges, prospects } = journey;

      // Find first node after prospect node
      let firstNodeId = null;
      const prospectNode = nodes.find(n => n.type === 'prospectNode');
      if (prospectNode) {
        const outEdge = edges.find(e => e.source === prospectNode.id);
        firstNodeId = outEdge?.target || null;
      }
      if (!firstNodeId && nodes.length > 0) {
        firstNodeId = nodes[0].id;
      }

      const now = admin.firestore.Timestamp.now();
      const prospectId = `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      // Determine starting node and whether to send immediate email
      let actualStartNodeId = firstNodeId;
      let immediateEmailSent = false;
      let emailSentTo = null;
      let emailResult = null;

      // Check if first node is a short wait (< 10 min) - if so, skip it and send email immediately
      const firstNode = nodes.find(n => n.id === firstNodeId);
      if (firstNode?.type === 'waitNode') {
        const delay = firstNode.data?.delay || 0;
        const unit = firstNode.data?.unit || 'minutes';
        const delayMinutes = unit === 'days' ? delay * 24 * 60 :
                           unit === 'hours' ? delay * 60 : delay;

        if (delayMinutes < 10) {
          // Skip this wait node and find the next node (should be email)
          const nextEdge = edges.find(e => e.source === firstNodeId);
          const nextNodeId = nextEdge?.target;
          const nextNode = nextNodeId ? nodes.find(n => n.id === nextNodeId) : null;

          if (nextNode?.type === 'emailNode' && resendApiKey) {
            // Send the email immediately with dynamic content based on source/intent
            const prospectName = lead.submittedData?.name || 'there';
            const prospectEmail = lead.email.toLowerCase().trim();
            const prospectCompany = lead.submittedData?.company || '';
            const leadSource = lead.source || 'unknown';
            const sourceForm = lead.sourceForm || '';
            const assessmentScore = lead.metadata?.score;
            const assessmentLevel = lead.metadata?.level;
            const serviceRequested = lead.submittedData?.service || lead.submittedData?.serviceRequested || '';
            const userMessage = lead.submittedData?.message || '';

            // Determine intent level and personalization
            const isHighIntent = leadSource === 'assessment' || leadSource === 'unity' || sourceForm === 'unity_gating';
            const isAssessment = leadSource === 'assessment' || sourceForm === 'growth_health_check';
            const isUnity = leadSource === 'unity' || sourceForm === 'unity_gating';
            const isFooter = leadSource === 'footer' || sourceForm === 'contact_modal';
            const isLeadGate = leadSource === 'lead_gate';

            // Build dynamic email content
            let dynamicSubject = nextNode.data.subject || 'Thanks for checking out yellowCircle';
            let dynamicBody = '';

            if (isAssessment && assessmentScore !== undefined) {
              // High-intent: Assessment completion
              dynamicSubject = `Your GTM Assessment Results + Next Steps`;
              dynamicBody = `Hi ${prospectName},

Thanks for taking the GTM Health Assessment — that tells me you're serious about improving your operations.

**Your Score: ${assessmentScore}/100 (${assessmentLevel})**

${assessmentScore >= 70 ? `You're doing better than most. But even at ${assessmentScore}/100, there's likely 20-30% of your marketing tech that's sitting unused. The question is: what's that costing you in missed opportunities?` : assessmentScore >= 40 ? `A score of ${assessmentScore} is common — most companies I work with are in this range. The good news? This usually means there are some quick wins available that can move the needle fast.` : `A score of ${assessmentScore} tells me there's significant room for improvement. But here's the thing — that's actually good news. It means small changes can have a big impact.`}

Based on your results, here's what I'd focus on first:

${lead.metadata?.recommendations ? lead.metadata.recommendations.slice(0, 3).map((r, i) => `${i + 1}. ${r}`).join('\n') : '1. Audit your current tech stack utilization\n2. Review your lead scoring methodology\n3. Map your data flows end-to-end'}

**Want to talk through your specific situation?**

I do a limited number of free discovery calls each month. No pitch — just an honest conversation about what's working, what's not, and what might help.

👉 [Book a 30-minute call](https://cal.com/yellowcircle)

Talk soon,
Christopher

P.S. — Reply to this email anytime. I read every response.`;
            } else if (isUnity) {
              // High-intent: Unity Platform access
              dynamicSubject = `Your Unity Platform Access + Quick Start Guide`;
              dynamicBody = `Hi ${prospectName},

Welcome to the Unity Platform! You now have access to tools that most companies pay enterprise rates for.

**What you can do right now:**
• **AI Chat** — Get instant answers about GTM strategy, marketing ops, and growth challenges
• **Knowledge Base** — Access frameworks, templates, and guides I've built over 10+ years
• **Studio** — Create content, analyze data, and build automations

**Quick tip:** Start with the AI Chat. Ask it something specific about a challenge you're facing — it's trained on real GTM problems and solutions.

Since you're exploring the Unity Platform, I'm guessing you're looking for more than just basic advice. You want actionable frameworks you can implement.

**Here are 3 things worth checking out:**
1. The GTM Health Assessment (if you haven't taken it yet)
2. The "Why Your GTM Sucks" deep dive
3. The MarOps maturity framework

Questions? Just reply to this email.

Best,
Christopher

---
yellowCircle | Growth Infrastructure Solutions
https://yellowcircle.io`;
            } else if (isFooter && serviceRequested) {
              // Contact form with service interest
              dynamicSubject = `Re: Your ${serviceRequested} Inquiry`;
              dynamicBody = `Hi ${prospectName},

Thanks for reaching out about ${serviceRequested}. I'll get back to you personally within 24 hours.

${userMessage ? `I saw your note: "${userMessage.substring(0, 200)}${userMessage.length > 200 ? '...' : ''}"` : ''}

In the meantime, here's some context on how I approach ${serviceRequested.toLowerCase().includes('audit') ? 'audits' : serviceRequested.toLowerCase().includes('consult') ? 'consulting' : 'this type of work'}:

**My approach is different from most consultants:**
• I don't just make recommendations — I help implement them
• I've been in-house at companies like DoorDash, Reddit, and LiveIntent, so I know what actually works
• I focus on quick wins first, then build sustainable systems

${prospectCompany ? `I'll do some research on ${prospectCompany} before we connect so we can make the most of our time.` : ''}

Talk soon,
Christopher

P.S. — If you want to get started right away, book a discovery call: https://cal.com/yellowcircle`;
            } else if (isFooter) {
              // Generic footer contact
              dynamicSubject = `Thanks for reaching out, ${prospectName}`;
              dynamicBody = `Hi ${prospectName},

Thanks for getting in touch! I'll review your message and get back to you within 24 hours.

${userMessage ? `I saw your note: "${userMessage.substring(0, 200)}${userMessage.length > 200 ? '...' : ''}"` : ''}

While you wait, here are some resources you might find useful:

1. **GTM Health Assessment** — A free 5-minute assessment that shows where your operations might be leaking value: https://yellowcircle.io/assessment

2. **"Why Your GTM Sucks"** — My breakdown of the most common go-to-market failures: https://yellowcircle.io/thoughts/why-your-gtm-sucks

3. **Book a discovery call** — If you want to skip ahead and talk directly: https://cal.com/yellowcircle

Talk soon,
Christopher Cooper
Founder, yellowCircle`;
            } else {
              // Default: LeadGate or other sources
              const rawBody = nextNode.data.fullBody || nextNode.data.preview || '';
              dynamicBody = rawBody
                .replace(/\{\{name\}\}/gi, prospectName)
                .replace(/\{\{email\}\}/gi, prospectEmail)
                .replace(/\{\{company\}\}/gi, prospectCompany);
            }

            // Process any remaining template variables
            const processedBody = dynamicBody
              .replace(/\{\{name\}\}/gi, prospectName)
              .replace(/\{\{email\}\}/gi, prospectEmail)
              .replace(/\{\{company\}\}/gi, prospectCompany)
              .replace(/\{\{source\}\}/gi, leadSource)
              .replace(/\{\{score\}\}/gi, assessmentScore || 'N/A');

            const html = processedBody
              .split('\n\n')
              .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
              .join('');

            try {
              emailResult = await sendViaResend({
                to: prospectEmail,
                subject: dynamicSubject,
                html,
                replyTo: 'christopher@yellowcircle.io'
              }, resendApiKey);

              console.log(`✅ Immediate welcome email sent to ${prospectEmail}: ${emailResult.id}`);
              immediateEmailSent = true;
              emailSentTo = prospectEmail;

              // Move prospect past the email node to the wait node after
              const emailOutEdge = edges.find(e => e.source === nextNodeId);
              actualStartNodeId = emailOutEdge?.target || nextNodeId;
            } catch (emailErr) {
              console.error(`❌ Failed to send immediate email: ${emailErr.message}`);
              // Fall back to normal enrollment at wait node
              actualStartNodeId = firstNodeId;
            }
          }
        }
      }

      const newProspect = {
        id: prospectId,
        email: lead.email.toLowerCase().trim(),
        name: lead.submittedData?.name || '',
        company: lead.submittedData?.company || '',
        currentNodeId: actualStartNodeId,
        nextExecuteAt: now,
        status: 'active',
        history: [{
          action: 'enrolled',
          at: now,
          source: 'trigger_rule',
          nodeId: null
        }]
      };

      // If email was sent, add that to history and update node position
      if (immediateEmailSent) {
        newProspect.history.push({
          action: 'sent',
          at: now,
          nodeId: nodes.find(n => n.type === 'emailNode')?.id,
          emailId: emailResult?.id,
          to: emailSentTo
        });
      }

      await journeyRef.update({
        prospects: [...(prospects || []), newProspect],
        'stats.totalProspects': (prospects || []).length + 1,
        'stats.sent': (journey.stats?.sent || 0) + (immediateEmailSent ? 1 : 0),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update contact journeys
      if (contactId) {
        const contactRef = db.collection('contacts').doc(contactId);
        const contactDoc = await contactRef.get();
        if (contactDoc.exists) {
          const contact = contactDoc.data();
          const activeJourneys = contact.journeys?.active || [];
          if (!activeJourneys.includes(journeyId)) {
            await contactRef.update({
              'journeys.active': [...activeJourneys, journeyId],
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }

      return {
        enrolled: true,
        journeyId,
        prospectId: newProspect.id,
        immediateEmailSent,
        emailSentTo
      };
    }

    case 'add_tag': {
      const { tags } = action.config;
      if (!tags || !contactId) return { skipped: true };

      const contactRef = db.collection('contacts').doc(contactId);
      // Use set with merge to create contact if doesn't exist
      await contactRef.set({
        email: lead.email.toLowerCase().trim(),
        name: lead.submittedData?.name || '',
        tags: admin.firestore.FieldValue.arrayUnion(...tags),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return { tagged: true, tags };
    }

    case 'update_score': {
      const { scoreAdjustment } = action.config;
      if (!scoreAdjustment || !contactId) return { skipped: true };

      const contactRef = db.collection('contacts').doc(contactId);

      // Get current score for notification
      const contactSnap = await contactRef.get();
      const currentScore = contactSnap.exists ? (contactSnap.data().score || 0) : 0;
      const newScore = currentScore + scoreAdjustment;

      // Use set with merge to create contact if doesn't exist
      await contactRef.set({
        email: lead.email.toLowerCase().trim(),
        name: lead.submittedData?.name || '',
        score: admin.firestore.FieldValue.increment(scoreAdjustment),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Send lifecycle notification for score change (only for significant changes)
      if (Math.abs(scoreAdjustment) >= 10) {
        sendLifecycleNotification('score_changed', lead, {
          previousScore: currentScore,
          newScore: newScore,
          change: scoreAdjustment,
          reason: lead.source || 'trigger_rule'
        }).catch(err => console.error('Lifecycle notification error:', err));
      }

      return { scoreUpdated: true, adjustment: scoreAdjustment };
    }

    case 'notify_slack': {
      // Use n8n webhook for threaded Slack notifications
      // n8n manages thread_ts per lead for conversation threading
      const n8nWebhook = functions.config().n8n?.leads_webhook;

      if (!n8nWebhook && !slackWebhook) {
        return { skipped: true, reason: 'no_webhook_configured' };
      }

      const { channel, message, eventType } = action.config;
      const finalMessage = replaceTemplateVars(message, lead);

      // Build structured payload for n8n
      const payload = {
        // Event metadata
        event: eventType || 'new_lead',
        timestamp: new Date().toISOString(),

        // Lead identification (for thread lookup)
        leadId: lead.id || null,
        email: lead.email || null,

        // Lead details
        lead: {
          name: lead.submittedData?.name || null,
          email: lead.email || null,
          company: lead.submittedData?.company || null,
          phone: lead.submittedData?.phone || null,
          source: lead.source || null,
          sourceForm: lead.sourceForm || null,
          createdAt: lead.createdAt?.toDate?.()?.toISOString() || null
        },

        // Assessment data if available
        assessment: lead.assessmentScore !== undefined ? {
          score: lead.assessmentScore,
          level: lead.assessmentLevel,
          categories: lead.submittedData?.categoryScores || null,
          recommendations: lead.submittedData?.recommendations || null
        } : null,

        // Service interest
        serviceInterest: lead.submittedData?.service || lead.submittedData?.interest || null,

        // Slack preferences
        slack: {
          channel: channel || '#leads',
          message: finalMessage
        }
      };

      // Prefer n8n webhook (supports threading), fall back to direct Slack
      if (n8nWebhook) {
        await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return { notified: true, via: 'n8n', channel };
      } else {
        // Fallback to direct Slack (no threading)
        await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: channel || '#leads',
            text: finalMessage
          })
        });
        return { notified: true, via: 'slack_direct', channel };
      }
    }

    case 'notify_email': {
      // Send internal notification email to team
      // COST OPTIMIZATION: Can configure highIntentOnly to skip low-intent leads
      const { to, subject, template, highIntentOnly } = action.config;

      // Build notification email body (declare these early so highIntentOnly check can use them)
      const leadName = lead.submittedData?.name || 'Unknown';
      const leadEmail = lead.email || 'No email';
      const leadSource = lead.source || 'Unknown';
      const leadSourceForm = lead.sourceForm || 'Unknown';

      // Check if we should skip this notification based on intent
      const isHighIntent = leadSource === 'assessment' || leadSource === 'unity' ||
                          leadSourceForm === 'unity_gating' || leadSourceForm === 'growth_health_check';

      if (highIntentOnly && !isHighIntent) {
        console.log(`📧 Skipping internal notification for low-intent lead: ${leadEmail} (source: ${leadSource})`);
        return { skipped: true, reason: 'low_intent_lead' };
      }

      const notifyTo = to || 'christopher@yellowcircle.io';
      const notifySubject = replaceTemplateVars(subject || 'New Lead: {{email}}', lead);
      const leadMessage = lead.submittedData?.message || 'No message';
      const leadService = lead.submittedData?.service || lead.submittedData?.serviceRequested || 'Not specified';
      const leadCompany = lead.submittedData?.company || 'Not specified';
      const leadScore = lead.metadata?.score !== undefined ? lead.metadata.score : 'N/A';
      const leadLevel = lead.metadata?.level || 'N/A';

      // Assessment-specific data
      const isAssessment = leadSource === 'assessment' || leadSourceForm === 'growth_health_check';
      const categoryScores = lead.metadata?.categoryScores || {};
      const recommendations = lead.metadata?.recommendations || lead.submittedData?.recommendations || [];

      let htmlBody = `
        <h2>New Lead Captured</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${leadName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${leadEmail}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Source</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${leadSource} / ${leadSourceForm}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Service Interest</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${leadService}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Company</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${leadCompany}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Message</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${leadMessage}</td></tr>
        </table>
      `;

      // Add assessment details if applicable
      if (isAssessment) {
        htmlBody += `
          <h3 style="margin-top: 20px;">Assessment Results</h3>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Score</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${leadScore}/100</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Level</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${leadLevel}</td></tr>
          </table>
        `;

        if (Object.keys(categoryScores).length > 0) {
          htmlBody += `<h4 style="margin-top: 15px;">Category Scores</h4><ul>`;
          for (const [cat, score] of Object.entries(categoryScores)) {
            htmlBody += `<li><strong>${cat}:</strong> ${score}</li>`;
          }
          htmlBody += `</ul>`;
        }

        if (recommendations.length > 0) {
          const recsArray = Array.isArray(recommendations) ? recommendations : recommendations.split(', ');
          htmlBody += `<h4 style="margin-top: 15px;">Recommendations</h4><ul>`;
          for (const rec of recsArray) {
            htmlBody += `<li>${rec}</li>`;
          }
          htmlBody += `</ul>`;
        }
      }

      htmlBody += `
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Captured at: ${new Date().toISOString()}<br>
          Lead ID: ${lead.id || 'N/A'}
        </p>
      `;

      try {
        await sendEmailViaESP({
          to: notifyTo,
          subject: notifySubject,
          html: htmlBody,
          tags: [{ name: 'internal-notification' }]
        });
        console.log(`📧 Internal notification sent to ${notifyTo}`);
        return { emailNotified: true, to: notifyTo };
      } catch (emailErr) {
        console.error(`❌ Failed to send internal notification: ${emailErr.message}`);
        return { emailNotified: false, error: emailErr.message };
      }
    }

    case 'send_assessment_results': {
      // Send assessment results to the user who completed it
      const leadEmail = lead.email;
      const leadName = lead.submittedData?.name || 'there';
      const score = lead.metadata?.score || lead.submittedData?.assessmentScore || 0;
      const level = lead.metadata?.level || lead.submittedData?.assessmentLevel || 'Unknown';
      const categoryScores = lead.metadata?.categoryScores || {};
      const recommendations = lead.metadata?.recommendations || lead.submittedData?.recommendations || [];
      const recsArray = Array.isArray(recommendations) ? recommendations : (recommendations ? recommendations.split(', ') : []);

      // Determine health indicator color/emoji
      let healthEmoji = '🔴';
      let healthColor = '#e74c3c';
      let healthLabel = 'Critical';
      if (score >= 80) {
        healthEmoji = '🟢';
        healthColor = '#2ecc71';
        healthLabel = 'Healthy';
      } else if (score >= 60) {
        healthEmoji = '🟡';
        healthColor = '#f39c12';
        healthLabel = 'Moderate';
      } else if (score >= 40) {
        healthEmoji = '🟠';
        healthColor = '#e67e22';
        healthLabel = 'At Risk';
      }

      // Build category scores HTML
      let categoryHTML = '';
      if (Object.keys(categoryScores).length > 0) {
        categoryHTML = '<h3 style="margin-top: 25px; color: #333;">Category Breakdown</h3><table style="border-collapse: collapse; width: 100%; max-width: 500px;">';
        for (const [cat, catScore] of Object.entries(categoryScores)) {
          const catColor = catScore >= 80 ? '#2ecc71' : catScore >= 60 ? '#f39c12' : catScore >= 40 ? '#e67e22' : '#e74c3c';
          categoryHTML += `<tr><td style="padding: 10px; border-bottom: 1px solid #eee;">${cat}</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: ${catColor}; font-weight: bold;">${catScore}/100</td></tr>`;
        }
        categoryHTML += '</table>';
      }

      // Build recommendations HTML
      let recsHTML = '';
      if (recsArray.length > 0) {
        recsHTML = '<h3 style="margin-top: 25px; color: #333;">Recommended Next Steps</h3><ul style="padding-left: 20px;">';
        for (const rec of recsArray) {
          recsHTML += `<li style="margin-bottom: 8px;">${rec}</li>`;
        }
        recsHTML += '</ul>';
      }

      const assessmentResultsHTML = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 5px;">Your GTM Health Assessment Results</h1>
          <p style="color: #666; margin-top: 0;">Hi ${leadName}, thanks for completing the Growth Health Check!</p>

          <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 12px; padding: 30px; text-align: center; margin: 25px 0;">
            <div style="font-size: 48px; margin-bottom: 10px;">${healthEmoji}</div>
            <div style="font-size: 64px; font-weight: bold; color: ${healthColor};">${score}</div>
            <div style="font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">out of 100</div>
            <div style="margin-top: 15px; font-size: 18px; color: ${healthColor}; font-weight: 600;">${level} - ${healthLabel}</div>
          </div>

          ${categoryHTML}

          ${recsHTML}

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <strong>What's next?</strong><br>
            Most companies I work with are leaving 30-50% of their marketing tech capabilities unused. Want to see exactly where the gaps are in your stack?
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cal.com/yellowcircle" style="display: inline-block; background: #fbbf24; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Book a Free Discovery Call</a>
          </div>

          <p style="color: #666; font-size: 14px;">Questions? Just reply to this email — I read every response.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px;">
            Christopher Cooper<br>
            Founder, yellowCircle<br>
            <a href="https://yellowcircle.io" style="color: #fbbf24;">yellowcircle.io</a>
          </p>
        </div>
      `;

      try {
        await sendEmailViaESP({
          to: leadEmail,
          subject: `Your GTM Health Score: ${score}/100 - ${level}`,
          html: assessmentResultsHTML,
          replyTo: 'christopher@yellowcircle.io',
          tags: [{ name: 'assessment-results' }]
        });
        console.log(`📊 Assessment results sent to ${leadEmail}`);
        return { assessmentResultsSent: true, to: leadEmail, score };
      } catch (emailErr) {
        console.error(`❌ Failed to send assessment results: ${emailErr.message}`);
        return { assessmentResultsSent: false, error: emailErr.message };
      }
    }

    case 'send_webhook': {
      const { url, method = 'POST', headers = {} } = action.config;
      if (!url) throw new Error('url required for send_webhook');

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(lead)
      });

      return { webhookSent: true, url };
    }

    default:
      return { skipped: true, reason: `unknown_action_type: ${action.type}` };
  }
};

/**
 * Firestore Trigger: On Lead Created
 * Evaluates all enabled trigger rules and executes matching actions
 * Uses in-memory caching to reduce Firestore reads
 */
exports.onLeadCreated = functions.firestore
  .document('leads/{leadId}')
  .onCreate(async (snap, context) => {
    const lead = snap.data();
    const leadId = context.params.leadId;

    console.log(`🎯 Processing new lead: ${lead.email} (${leadId})`);

    try {
      // Get cached trigger rules (reduces Firestore reads)
      const rules = await getCachedTriggerRules();

      if (rules.length === 0) {
        console.log('No enabled trigger rules found');
        return null;
      }

      console.log(`📋 Evaluating ${rules.length} trigger rules`);

      // Generate contact ID for this lead
      const contactId = generateContactId(lead.email);

      for (const rule of rules) {
        const ruleId = rule.id;

        // Only process lead_created triggers
        if (rule.trigger?.type !== 'lead_created') continue;

        // Evaluate conditions
        const matches = evaluateConditions(
          lead,
          rule.trigger?.conditions || [],
          rule.trigger?.matchMode || 'all'
        );

        if (!matches) {
          console.log(`  ❌ Rule ${rule.name}: conditions not met`);
          continue;
        }

        console.log(`  ✅ Rule ${rule.name}: conditions match!`);

        // Check deduplication
        if (rule.dedup?.enabled) {
          const dedupeKey = rule.dedup.strategy === 'email_journey'
            ? `${lead.email.toLowerCase()}-${rule.actions.find(a => a.type === 'enroll_journey')?.config?.journeyId || ruleId}`
            : `${lead.email.toLowerCase()}-${ruleId}`;

          const dedupeRef = db.collection('dedupeLog').doc(dedupeKey);
          const dedupeDoc = await dedupeRef.get();

          if (dedupeDoc.exists) {
            const lastEntry = dedupeDoc.data().lastExecutedAt?.toDate();
            const windowMs = (rule.dedup.windowSeconds || 86400) * 1000;

            if (lastEntry && (Date.now() - lastEntry.getTime()) < windowMs) {
              console.log(`  ⏭️ Rule ${rule.name}: skipped (dedupe)`);
              await rule.ref.update({
                'stats.skippedDedupe': admin.firestore.FieldValue.increment(1)
              });
              continue;
            }
          }

          // Record for dedup
          await dedupeRef.set({
            email: lead.email.toLowerCase(),
            ruleId,
            lastExecutedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }

        // Execute actions
        let allSuccess = true;
        const actionResults = [];

        for (const action of rule.actions || []) {
          try {
            const result = await executeAction(action, lead, contactId);
            actionResults.push({ actionId: action.id, success: true, result });
            console.log(`    ✅ Action ${action.type}: success`);
          } catch (actionError) {
            console.error(`    ❌ Action ${action.type}: ${actionError.message}`);
            actionResults.push({ actionId: action.id, success: false, error: actionError.message });

            if (!action.continueOnError) {
              allSuccess = false;
              break;
            }
          }
        }

        // Record execution
        const now = admin.firestore.FieldValue.serverTimestamp();
        const statsUpdate = {
          'stats.totalExecutions': admin.firestore.FieldValue.increment(1),
          'stats.lastExecutedAt': now,
          updatedAt: now
        };

        if (allSuccess) {
          statsUpdate['stats.successfulExecutions'] = admin.firestore.FieldValue.increment(1);
          statsUpdate['stats.consecutiveErrors'] = 0;
        } else {
          statsUpdate['stats.failedExecutions'] = admin.firestore.FieldValue.increment(1);
          statsUpdate['stats.consecutiveErrors'] = admin.firestore.FieldValue.increment(1);
        }

        await rule.ref.update(statsUpdate);

        // Log to triggerLogs collection
        await db.collection('triggerLogs').add({
          ruleId,
          ruleName: rule.name,
          leadId,
          email: lead.email,
          success: allSuccess,
          actionResults,
          executedAt: now
        });
      }

      console.log(`🏁 Finished processing lead: ${lead.email}`);
      return null;

    } catch (error) {
      console.error(`❌ onLeadCreated error: ${error.message}`);
      return null;
    }
  });

// ============================================================
// N8N INTEGRATION FUNCTIONS - Phase 2
// ============================================================

/**
 * Generate contact ID from email (same algorithm as client-side)
 */
const generateContactId = (email) => {
  const normalized = email.toLowerCase().trim();
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
  }
  return `contact-${Math.abs(hash).toString(16).padStart(8, '0')}`;
};

/**
 * Sync Lead from n8n to Firestore
 * Called by n8n webhook workflow after Airtable creation
 */
exports.syncLeadFromN8N = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Verify n8n token
  const token = request.headers["x-n8n-token"];
  const expectedToken = functions.config().n8n?.token;

  if (!expectedToken || token !== expectedToken) {
    console.error("❌ Invalid n8n token");
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { email, name, source, tool, company, message, airtableId, utmSource, utmCampaign, page } = request.body;

    if (!email) {
      response.status(400).json({ error: "Email is required" });
      return;
    }

    const contactId = generateContactId(email);
    const contactRef = db.collection("contacts").doc(contactId);
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Check if contact exists
    const existingContact = await contactRef.get();

    if (existingContact.exists) {
      // Update existing contact
      await contactRef.update({
        // Don't overwrite name if already set
        ...(name && !existingContact.data().name ? { name } : {}),
        ...(company && !existingContact.data().company ? { company } : {}),
        "externalIds.airtableId": airtableId || existingContact.data().externalIds?.airtableId,
        "syncStatus.airtable": "synced",
        "syncStatus.airtableLastSync": now,
        updatedAt: now,
        updatedBy: "n8n"
      });

      console.log(`✅ Updated contact from n8n: ${email} (${contactId})`);
    } else {
      // Create new contact
      await contactRef.set({
        id: contactId,
        email: email.toLowerCase().trim(),
        name: name || "",
        firstName: name ? name.split(" ")[0] : "",
        lastName: name ? name.split(" ").slice(1).join(" ") : "",
        company: company || "",
        type: "lead",
        stage: "new",
        tags: tool ? ["tools-user"] : [],
        score: 0,
        scoreBreakdown: { engagement: 0, behavior: 0, profile: 0, recency: 0 },
        source: {
          original: source || "n8n",
          medium: utmSource || "",
          campaign: utmCampaign || "",
          referrer: "",
          landingPage: page || ""
        },
        engagement: {
          emailsSent: 0,
          emailsOpened: 0,
          emailsClicked: 0,
          toolsUsed: tool ? [tool] : [],
          assessmentScore: null,
          pageViews: 0
        },
        journeys: { active: [], completed: [], history: [] },
        externalIds: {
          airtableId: airtableId || null,
          hubspotId: null,
          stripeId: null
        },
        syncStatus: {
          airtable: airtableId ? "synced" : "not_synced",
          airtableLastSync: airtableId ? now : null
        },
        preferences: {
          emailOptIn: true,
          emailFrequency: "weekly",
          doNotContact: false
        },
        notes: message || "",
        customFields: {},
        metadata: { createdVia: "n8n" },
        status: "active",
        createdAt: now,
        updatedAt: now,
        createdBy: "n8n",
        updatedBy: "n8n"
      });

      console.log(`✅ Created contact from n8n: ${email} (${contactId})`);
    }

    response.json({
      success: true,
      contactId,
      created: !existingContact.exists
    });

  } catch (error) {
    console.error("❌ syncLeadFromN8N error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Sync Contact Update from Airtable via n8n
 * Called when Airtable record is modified
 */
exports.syncContactFromAirtable = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Verify n8n token
  const token = request.headers["x-n8n-token"];
  const expectedToken = functions.config().n8n?.token;

  if (!expectedToken || token !== expectedToken) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { airtableId, email, name, company, status, tags, notes, jobTitle, phone, linkedinUrl } = request.body;

    if (!email && !airtableId) {
      response.status(400).json({ error: "Email or airtableId is required" });
      return;
    }

    // Find contact by airtableId or email
    let contactRef;
    let contactData;

    if (airtableId) {
      const byAirtable = await db.collection("contacts")
        .where("externalIds.airtableId", "==", airtableId)
        .limit(1)
        .get();

      if (!byAirtable.empty) {
        contactRef = byAirtable.docs[0].ref;
        contactData = byAirtable.docs[0].data();
      }
    }

    if (!contactRef && email) {
      const contactId = generateContactId(email);
      contactRef = db.collection("contacts").doc(contactId);
      const doc = await contactRef.get();
      if (doc.exists) {
        contactData = doc.data();
      }
    }

    if (!contactRef) {
      response.status(404).json({ error: "Contact not found" });
      return;
    }

    // Map Airtable status to Firestore stage
    const stageMap = {
      "New": "new",
      "Contacted": "nurturing",
      "Engaged": "engaged",
      "Qualified": "qualified",
      "Opportunity": "opportunity",
      "Customer": "customer",
      "Churned": "churned"
    };

    const now = admin.firestore.FieldValue.serverTimestamp();

    // Build update object (only update non-empty fields)
    const updates = {
      updatedAt: now,
      updatedBy: "airtable_sync",
      "syncStatus.airtable": "synced",
      "syncStatus.airtableLastSync": now
    };

    if (name) updates.name = name;
    if (company) updates.company = company;
    if (jobTitle) updates.jobTitle = jobTitle;
    if (phone) updates.phone = phone;
    if (linkedinUrl) updates.linkedinUrl = linkedinUrl;
    if (notes) updates.notes = notes;
    if (status && stageMap[status]) updates.stage = stageMap[status];
    if (tags) {
      updates.tags = typeof tags === "string"
        ? tags.split(",").map(t => t.trim()).filter(t => t)
        : tags;
    }
    if (airtableId) updates["externalIds.airtableId"] = airtableId;

    await contactRef.update(updates);

    console.log(`✅ Synced contact from Airtable: ${email || airtableId}`);

    response.json({
      success: true,
      contactId: contactRef.id,
      fieldsUpdated: Object.keys(updates).length
    });

  } catch (error) {
    console.error("❌ syncContactFromAirtable error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Create Prospect in Journey - API for trigger system
 * Adds a contact to a UnityMAP journey
 */
exports.createProspect = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Auth check (admin token or n8n token)
  const adminToken = request.headers["x-admin-token"];
  const n8nToken = request.headers["x-n8n-token"];
  const expectedAdminToken = functions.config().admin?.token || "yc-admin-2025";
  const expectedN8nToken = functions.config().n8n?.token;

  const isAuthorized = (adminToken === expectedAdminToken) ||
                       (expectedN8nToken && n8nToken === expectedN8nToken);

  if (!isAuthorized) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { email, name, company, journeyId, source, skipDedupe } = request.body;

    if (!email || !journeyId) {
      response.status(400).json({ error: "Email and journeyId are required" });
      return;
    }

    // Check deduplication (unless skipped)
    if (!skipDedupe) {
      const dedupeKey = `${email.toLowerCase()}-${journeyId}`;
      const dedupeRef = db.collection("dedupeLog").doc(dedupeKey);
      const dedupeDoc = await dedupeRef.get();

      if (dedupeDoc.exists) {
        const lastEntry = dedupeDoc.data().lastExecutedAt?.toDate();
        const windowMs = 24 * 60 * 60 * 1000; // 24 hours

        if (lastEntry && (Date.now() - lastEntry.getTime()) < windowMs) {
          response.json({
            success: false,
            reason: "duplicate",
            lastEntry: lastEntry.toISOString(),
            windowHours: 24
          });
          return;
        }
      }

      // Log this entry for dedup
      await dedupeRef.set({
        email: email.toLowerCase(),
        journeyId,
        lastExecutedAt: admin.firestore.FieldValue.serverTimestamp(),
        executionCount: admin.firestore.FieldValue.increment(1)
      }, { merge: true });
    }

    // Load journey
    const journeyRef = db.collection("journeys").doc(journeyId);
    const journeySnap = await journeyRef.get();

    if (!journeySnap.exists) {
      response.status(404).json({ error: "Journey not found" });
      return;
    }

    const journey = journeySnap.data();
    const { nodes, edges, prospects } = journey;

    // Find first executable node (after prospect node)
    let firstNodeId = null;
    const prospectNode = nodes.find(n => n.type === "prospectNode");
    if (prospectNode) {
      const outEdge = edges.find(e => e.source === prospectNode.id);
      firstNodeId = outEdge?.target || null;
    }
    if (!firstNodeId && nodes.length > 0) {
      firstNodeId = nodes[0].id;
    }

    // Create prospect entry
    const now = admin.firestore.Timestamp.now();
    const newProspect = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      email: email.toLowerCase().trim(),
      name: name || "",
      company: company || "",
      currentNodeId: firstNodeId,
      nextExecuteAt: now,
      status: "active",
      history: [{
        action: "enrolled",
        at: now,
        source: source || "api",
        nodeId: null
      }]
    };

    // Add to journey
    const updatedProspects = [...(prospects || []), newProspect];

    await journeyRef.update({
      prospects: updatedProspects,
      "stats.totalProspects": updatedProspects.length,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Also update contact if exists
    const contactId = generateContactId(email);
    const contactRef = db.collection("contacts").doc(contactId);
    const contactDoc = await contactRef.get();

    if (contactDoc.exists) {
      const contact = contactDoc.data();
      const activeJourneys = contact.journeys?.active || [];

      if (!activeJourneys.includes(journeyId)) {
        await contactRef.update({
          "journeys.active": [...activeJourneys, journeyId],
          "journeys.history": admin.firestore.FieldValue.arrayUnion({
            journeyId,
            journeyName: journey.title,
            action: "enrolled",
            at: now,
            reason: source || "api"
          }),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    console.log(`✅ Created prospect: ${email} in journey ${journeyId}`);

    response.json({
      success: true,
      prospectId: newProspect.id,
      journeyId,
      journeyTitle: journey.title,
      firstNodeId,
      contactUpdated: contactDoc.exists
    });

  } catch (error) {
    console.error("❌ createProspect error:", error);
    response.status(500).json({ error: error.message });
  }
});

// ============================================================
// SEED WELCOME JOURNEY
// One-time setup endpoint to create welcome journey + trigger rule
// ============================================================

exports.seedWelcomeJourney = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Auth check
  const adminToken = request.headers["x-admin-token"];
  const expectedToken = functions.config().admin?.token || "yc-admin-2025";

  if (adminToken !== expectedToken) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  const WELCOME_JOURNEY_ID = "welcome-new-leads";
  const TRIGGER_RULE_ID = "welcome-new-leads-rule";
  const ASSESSMENT_RULE_ID = "assessment-results-rule";
  const SCRIPT_VERSION = "1.2.0"; // Sync with scripts/seed-welcome-journey.cjs

  // Welcome email content
  const welcomeEmailContent = `Hi {{name}},

Thanks for checking out yellowCircle! I'm Christopher, and I help B2B companies fix their go-to-market operations.

You just accessed one of our tools, which means you're probably dealing with one of these challenges:
• Marketing and sales aren't aligned on what "qualified" means
• Your tech stack is expensive but underutilized
• Attribution feels like a guessing game
• Your team is drowning in operational work instead of strategic work

Sound familiar? You're not alone. I've spent 10+ years in marketing operations at companies like DoorDash, Reddit, and LiveIntent, and I've seen these patterns everywhere.

**Here's what I'd suggest:**

1. **Take our GTM Health Assessment** (if you haven't already) — it's free and takes 15 minutes: https://yellowcircle.io/assessment

2. **Read "Why Your GTM Sucks"** — my deep dive into why most go-to-market strategies fail: https://yellowcircle.io/thoughts/why-your-gtm-sucks

3. **Book a free discovery call** — if you want to talk through your specific situation: https://cal.com/yellowcircle

No pitch, no pressure. Just honest conversation about what's actually broken and what might help.

Talk soon,
Christopher Cooper
Founder, yellowCircle

P.S. — Reply to this email anytime. I read every response.`;

  const followUpEmailContent = `Hi {{name}},

Quick follow-up from my earlier email.

I wanted to share something that might be useful: most companies I talk to are spending $50K-$200K/year on marketing technology, but only using about 30% of what they've bought.

The problem isn't the tools. It's the organizational structure around them.

**Three questions to ask yourself:**

1. Does your marketing ops person spend more time pulling reports than building systems?
2. Can your sales team trust the lead scoring without manually checking each lead?
3. When attribution numbers don't match, do you know which source to believe?

If you answered "no" to any of these, it's not a tool problem — it's an operations architecture problem.

I put together a free guide on how to diagnose these issues. Want me to send it over?

Just reply "yes" and I'll send it your way.

Best,
Christopher

---
yellowCircle | Growth Infrastructure Solutions
https://yellowcircle.io`;

  try {
    // 1. Create Welcome Journey
    const journeyRef = db.collection("journeys").doc(WELCOME_JOURNEY_ID);
    const existingJourney = await journeyRef.get();

    // Preserve existing stats and prospects if updating
    const existingData = existingJourney.exists ? existingJourney.data() : {};

    const journeyData = {
      id: WELCOME_JOURNEY_ID,
      title: "Welcome - New Leads",
      description: "Automated welcome sequence for new leads from website captures",
      status: "active",

      // Sync metadata - marks this journey as script-managed
      _sync: {
        source: "script",
        scriptPath: "scripts/seed-welcome-journey.cjs",
        scriptVersion: SCRIPT_VERSION,
        lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        allowUIEdits: false,
        syncEndpoint: "seedWelcomeJourney"
      },

      nodes: [
        {
          id: "prospect-entry",
          type: "prospectNode",
          position: { x: 250, y: 50 },
          data: {
            label: "New Leads",
            count: 0,
            segment: "website_captures",
            source: "trigger_rule",
            tags: ["welcome-sequence"],
            prospects: []
          }
        },
        // Enrichment wait - allows time for data enrichment before sending
        {
          id: "enrichment-wait",
          type: "waitNode",
          position: { x: 250, y: 150 },
          data: {
            label: "Enrichment Wait",
            delay: 5,
            unit: "minutes",
            description: "Short delay for data enrichment (company, role, etc.)"
          }
        },
        {
          id: "welcome-email",
          type: "emailNode",
          position: { x: 250, y: 280 },
          data: {
            label: "Welcome Email",
            subject: "Thanks for checking out yellowCircle",
            preview: welcomeEmailContent.substring(0, 200) + "...",
            fullBody: welcomeEmailContent,
            status: "active"
          }
        },
        {
          id: "wait-3-days",
          type: "waitNode",
          position: { x: 250, y: 410 },
          data: {
            label: "Wait 3 Days",
            delay: 3,
            unit: "days"
          }
        },
        {
          id: "followup-email",
          type: "emailNode",
          position: { x: 250, y: 540 },
          data: {
            label: "Follow-up Email",
            subject: "Quick question about your GTM operations",
            preview: followUpEmailContent.substring(0, 200) + "...",
            fullBody: followUpEmailContent,
            status: "active"
          }
        },
        {
          id: "exit-completed",
          type: "exitNode",
          position: { x: 250, y: 670 },
          data: {
            label: "Sequence Complete",
            exitType: "completed"
          }
        }
      ],

      edges: [
        { id: "e0", source: "prospect-entry", target: "enrichment-wait", type: "default" },
        { id: "e1", source: "enrichment-wait", target: "welcome-email", type: "default" },
        { id: "e2", source: "welcome-email", target: "wait-3-days", type: "default" },
        { id: "e3", source: "wait-3-days", target: "followup-email", type: "default" },
        { id: "e4", source: "followup-email", target: "exit-completed", type: "default" }
      ],

      // Preserve existing prospects
      prospects: existingData.prospects || [],

      stats: {
        nodeCount: 6,
        mapNodeCount: 6,
        emailCount: 2,
        // Preserve existing stats
        totalProspects: existingData.stats?.totalProspects || 0,
        sent: existingData.stats?.sent || 0,
        opened: existingData.stats?.opened || 0,
        clicked: existingData.stats?.clicked || 0,
        completed: existingData.stats?.completed || 0
      },

      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!existingJourney.exists) {
      journeyData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await journeyRef.set(journeyData, { merge: true });
    console.log(`✅ Journey created/updated: ${WELCOME_JOURNEY_ID}`);

    // 2. Create Trigger Rule
    const ruleRef = db.collection("triggerRules").doc(TRIGGER_RULE_ID);
    const existingRule = await ruleRef.get();

    const ruleData = {
      name: "Welcome Sequence - New Leads",
      description: "Auto-enroll new leads from website captures into welcome journey",
      enabled: true,
      priority: 10,

      trigger: {
        type: "lead_created",
        conditions: [
          {
            field: "source",
            operator: "in",
            value: ["lead_gate", "footer", "assessment", "sso"],
            caseSensitive: false
          }
        ],
        matchMode: "any"
      },

      actions: [
        {
          type: "add_tag",
          config: { tags: ["welcome-sent", "website-lead"] }
        },
        {
          type: "update_score",
          config: { scoreAdjustment: 10 }
        },
        {
          type: "notify_email",
          config: {
            to: "christopher@yellowcircle.io",
            subject: "New Lead: {{email}} from {{source}}"
          }
        },
        {
          type: "notify_slack",
          config: {
            channel: "#leads",
            message: "🎯 *New Lead Captured*\n• Email: {{email}}\n• Source: {{source}}\n• Name: {{name}}\n• Company: {{company}}"
          }
        },
        {
          type: "enroll_journey",
          config: { journeyId: WELCOME_JOURNEY_ID }
        }
      ],

      dedup: {
        enabled: true,
        strategy: "email_journey",
        windowSeconds: 86400 * 7
      },

      stats: {
        triggered: 0,
        actionsExecuted: 0,
        skippedDedupe: 0,
        errors: 0
      },

      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!existingRule.exists) {
      ruleData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await ruleRef.set(ruleData, { merge: true });
    console.log(`✅ Trigger rule created/updated: ${TRIGGER_RULE_ID}`);

    // 3. Create Assessment Results Trigger Rule
    const assessmentRuleRef = db.collection("triggerRules").doc(ASSESSMENT_RULE_ID);
    const existingAssessmentRule = await assessmentRuleRef.get();

    const assessmentRuleData = {
      name: "Assessment Results - Send to User",
      description: "Send assessment results email to users who complete the Growth Health Check",
      enabled: true,
      priority: 5, // Higher priority than welcome (runs first)

      trigger: {
        type: "lead_created",
        conditions: [
          {
            field: "source",
            operator: "eq",
            value: "assessment",
            caseSensitive: false
          }
        ],
        matchMode: "all"
      },

      actions: [
        {
          type: "add_tag",
          config: { tags: ["assessment-completed"] }
        },
        {
          type: "send_assessment_results",
          config: {}
        }
      ],

      dedup: {
        enabled: true,
        strategy: "email_journey",
        windowSeconds: 86400 // 1 day - allow re-assessment after a day
      },

      stats: {
        triggered: 0,
        actionsExecuted: 0,
        skippedDedupe: 0,
        errors: 0
      },

      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!existingAssessmentRule.exists) {
      assessmentRuleData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await assessmentRuleRef.set(assessmentRuleData, { merge: true });
    console.log(`✅ Assessment trigger rule created/updated: ${ASSESSMENT_RULE_ID}`);

    // Clear trigger rules cache
    invalidateTriggerRulesCache();

    response.json({
      success: true,
      sync: {
        source: "script",
        scriptVersion: SCRIPT_VERSION,
        scriptPath: "scripts/seed-welcome-journey.cjs",
        syncedAt: new Date().toISOString(),
        note: "This journey is script-managed. Edit script and re-sync for changes."
      },
      journey: {
        id: WELCOME_JOURNEY_ID,
        title: journeyData.title,
        nodeCount: journeyData.stats.nodeCount,
        emailCount: journeyData.stats.emailCount,
        status: journeyData.status,
        created: !existingJourney.exists,
        updated: existingJourney.exists
      },
      triggerRules: {
        welcome: {
          id: TRIGGER_RULE_ID,
          name: ruleData.name,
          enabled: ruleData.enabled,
          triggers: ruleData.trigger.conditions[0].value,
          actions: ruleData.actions.map(a => a.type),
          created: !existingRule.exists
        },
        assessment: {
          id: ASSESSMENT_RULE_ID,
          name: assessmentRuleData.name,
          enabled: assessmentRuleData.enabled,
          triggers: "source = assessment",
          actions: assessmentRuleData.actions.map(a => a.type),
          created: !existingAssessmentRule.exists
        }
      },
      flows: {
        allLeads: [
          "1. Lead created → Welcome trigger rule matches",
          "2. Internal notification email sent to christopher@yellowcircle.io",
          "3. Enrolls in welcome journey → Immediate welcome email",
          "4. 3-day wait → Follow-up email sent"
        ],
        assessmentLeads: [
          "1. Lead created → Assessment trigger rule matches (priority 5)",
          "2. Assessment results email sent to user with score/recommendations",
          "3. Then welcome trigger rule also fires (priority 10)"
        ]
      }
    });

  } catch (error) {
    console.error("❌ seedWelcomeJourney error:", error);
    response.status(500).json({ error: error.message });
  }
});

// ============================================================
// TEST LEAD CAPTURE - Full Flow Testing
// Creates a test lead and returns complete flow results
// ============================================================

exports.testLeadCapture = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Auth check
  const adminToken = request.headers["x-admin-token"];
  const expectedToken = functions.config().admin?.token || "yc-admin-2025";

  if (adminToken !== expectedToken) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  const {
    email = `test-${Date.now()}@yellowcircle.io`,
    name = "Test User",
    source = "lead_gate",
    sourceTool = "test-endpoint",
    dryRun = false,
    skipEmail = false
  } = request.body || {};

  const flowResults = {
    timestamp: new Date().toISOString(),
    input: { email, name, source, sourceTool, dryRun, skipEmail },
    steps: [],
    lead: null,
    contact: null,
    triggersEvaluated: [],
    triggersMatched: [],
    actionsExecuted: [],
    journeyEnrollment: null,
    emailSent: null,
    errors: []
  };

  try {
    // Step 1: Create Lead
    flowResults.steps.push({ step: 1, action: "create_lead", status: "starting" });

    const leadId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const leadData = {
      email: email.toLowerCase().trim(),
      submittedData: {
        name,
        company: "Test Company",
        tool: sourceTool
      },
      source,
      sourceTool,
      sourceForm: null,
      attribution: {
        utmSource: "test",
        utmMedium: "api",
        utmCampaign: "test_lead_capture"
      },
      context: {
        userAgent: "TestLeadCapture/1.0",
        device: "api"
      },
      status: "new",
      resolution: {
        contactId: null,
        resolvedAt: null,
        resolvedBy: null
      },
      triggers: {
        rulesEvaluated: [],
        rulesMatched: [],
        actionsExecuted: []
      },
      capturedAt: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!dryRun) {
      await db.collection("leads").doc(leadId).set(leadData);
    }

    flowResults.lead = { id: leadId, ...leadData };
    flowResults.steps[0].status = "completed";
    flowResults.steps[0].leadId = leadId;

    // Step 2: Create/Update Contact
    flowResults.steps.push({ step: 2, action: "upsert_contact", status: "starting" });

    const contactId = generateContactId(email);
    const contactRef = db.collection("contacts").doc(contactId);
    const existingContact = await contactRef.get();

    const contactData = {
      email: email.toLowerCase().trim(),
      name,
      company: "Test Company",
      source: {
        original: source,
        medium: "api",
        campaign: "test_lead_capture"
      },
      score: existingContact.exists ? (existingContact.data().score || 0) : 0,
      tags: existingContact.exists ? (existingContact.data().tags || []) : [],
      journeys: existingContact.exists ? (existingContact.data().journeys || { active: [], history: [] }) : { active: [], history: [] },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!existingContact.exists) {
      contactData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    if (!dryRun) {
      await contactRef.set(contactData, { merge: true });
    }

    flowResults.contact = { id: contactId, created: !existingContact.exists, ...contactData };
    flowResults.steps[1].status = "completed";
    flowResults.steps[1].contactId = contactId;
    flowResults.steps[1].contactCreated = !existingContact.exists;

    // Step 3: Evaluate Trigger Rules
    flowResults.steps.push({ step: 3, action: "evaluate_triggers", status: "starting" });

    const rules = await getCachedTriggerRules();
    flowResults.triggersEvaluated = rules.map(r => ({ id: r.id, name: r.name }));

    for (const rule of rules) {
      if (rule.trigger?.type !== "lead_created") continue;

      // Evaluate conditions
      const conditions = rule.trigger?.conditions || [];
      let matches = true;

      if (conditions.length > 0) {
        const matchMode = rule.trigger?.matchMode || "all";
        const results = conditions.map(cond => {
          const value = leadData[cond.field] || leadData.submittedData?.[cond.field];

          switch (cond.operator) {
            case "equals":
              return String(value).toLowerCase() === String(cond.value).toLowerCase();
            case "in":
              return Array.isArray(cond.value) && cond.value.map(v => v.toLowerCase()).includes(String(value).toLowerCase());
            case "contains":
              return String(value).toLowerCase().includes(String(cond.value).toLowerCase());
            default:
              return false;
          }
        });

        matches = matchMode === "all" ? results.every(r => r) : results.some(r => r);
      }

      if (matches) {
        flowResults.triggersMatched.push({ id: rule.id, name: rule.name });

        // Execute actions
        for (const action of rule.actions || []) {
          const actionResult = {
            ruleId: rule.id,
            ruleName: rule.name,
            type: action.type,
            config: action.config,
            result: null,
            error: null
          };

          try {
            switch (action.type) {
              case "add_tag": {
                const tags = action.config?.tags || [];
                if (!dryRun && tags.length > 0) {
                  await contactRef.update({
                    tags: admin.firestore.FieldValue.arrayUnion(...tags),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                }
                actionResult.result = { tagged: true, tags };
                break;
              }

              case "update_score": {
                const adjustment = action.config?.scoreAdjustment || 0;
                if (!dryRun && adjustment !== 0) {
                  await contactRef.update({
                    score: admin.firestore.FieldValue.increment(adjustment),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                }
                actionResult.result = { scoreUpdated: true, adjustment };
                break;
              }

              case "enroll_journey": {
                const journeyId = action.config?.journeyId;
                if (!journeyId) {
                  actionResult.error = "No journeyId specified";
                  break;
                }

                const journeyRef = db.collection("journeys").doc(journeyId);
                const journeySnap = await journeyRef.get();

                if (!journeySnap.exists) {
                  actionResult.error = `Journey ${journeyId} not found`;
                  break;
                }

                const journey = journeySnap.data();
                const { nodes, edges, prospects } = journey;

                // Find first node after prospect node
                let firstNodeId = null;
                const prospectNode = nodes.find(n => n.type === "prospectNode");
                if (prospectNode) {
                  const outEdge = edges.find(e => e.source === prospectNode.id);
                  firstNodeId = outEdge?.target || null;
                }
                if (!firstNodeId && nodes.length > 0) {
                  firstNodeId = nodes[0].id;
                }

                const now = admin.firestore.Timestamp.now();
                const newProspect = {
                  id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                  email: email.toLowerCase().trim(),
                  name: name || "",
                  company: "Test Company",
                  currentNodeId: firstNodeId,
                  nextExecuteAt: now,
                  status: "active",
                  history: [{
                    action: "enrolled",
                    at: now,
                    source: "test_lead_capture",
                    nodeId: null
                  }]
                };

                if (!dryRun) {
                  await journeyRef.update({
                    prospects: [...(prospects || []), newProspect],
                    "stats.totalProspects": (prospects || []).length + 1,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });

                  // Update contact journeys
                  await contactRef.update({
                    "journeys.active": admin.firestore.FieldValue.arrayUnion(journeyId),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                  });
                }

                flowResults.journeyEnrollment = {
                  journeyId,
                  journeyTitle: journey.title,
                  prospectId: newProspect.id,
                  firstNodeId,
                  enrolled: !dryRun
                };

                actionResult.result = {
                  enrolled: true,
                  journeyId,
                  journeyTitle: journey.title,
                  prospectId: newProspect.id
                };

                // Step 4: Send email if not skipped
                if (!skipEmail && !dryRun && firstNodeId) {
                  flowResults.steps.push({ step: 4, action: "send_email", status: "starting" });

                  const emailNode = nodes.find(n => n.id === firstNodeId && n.type === "emailNode");

                  if (emailNode) {
                    const emailBody = (emailNode.data.fullBody || emailNode.data.preview || "")
                      .replace(/\{\{name\}\}/g, name || "there")
                      .replace(/\{\{email\}\}/g, email);

                    const esp = getESPProvider();
                    let emailResult;

                    if (esp === "sendgrid") {
                      emailResult = await sendViaSendGrid({
                        to: email,
                        subject: emailNode.data.subject,
                        html: emailBody.split("\n\n").map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join(""),
                        text: emailBody
                      }, functions.config().sendgrid?.api_key);
                    } else {
                      emailResult = await sendViaResend({
                        to: email,
                        subject: emailNode.data.subject,
                        html: emailBody.split("\n\n").map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join(""),
                        text: emailBody
                      }, functions.config().resend?.api_key);
                    }

                    flowResults.emailSent = {
                      to: email,
                      subject: emailNode.data.subject,
                      provider: esp,
                      result: emailResult
                    };

                    flowResults.steps[3].status = emailResult.status === "sent" ? "completed" : "failed";
                    flowResults.steps[3].emailId = emailResult.id;
                  } else {
                    flowResults.steps[3].status = "skipped";
                    flowResults.steps[3].reason = "First node is not an email node";
                  }
                }
                break;
              }

              default:
                actionResult.result = { skipped: true, reason: `Unknown action type: ${action.type}` };
            }
          } catch (actionError) {
            actionResult.error = actionError.message;
            flowResults.errors.push({ action: action.type, error: actionError.message });
          }

          flowResults.actionsExecuted.push(actionResult);
        }
      }
    }

    flowResults.steps[2].status = "completed";
    flowResults.steps[2].rulesEvaluated = rules.length;
    flowResults.steps[2].rulesMatched = flowResults.triggersMatched.length;

    // Update lead with trigger results
    if (!dryRun) {
      await db.collection("leads").doc(leadId).update({
        status: "resolved",
        "resolution.contactId": contactId,
        "resolution.resolvedAt": admin.firestore.FieldValue.serverTimestamp(),
        "resolution.resolvedBy": "test_lead_capture",
        "triggers.rulesEvaluated": flowResults.triggersEvaluated.map(r => r.id),
        "triggers.rulesMatched": flowResults.triggersMatched.map(r => r.id),
        "triggers.actionsExecuted": flowResults.actionsExecuted,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    response.json({
      success: true,
      dryRun,
      summary: {
        leadCreated: !dryRun,
        contactCreated: flowResults.contact?.created,
        triggersMatched: flowResults.triggersMatched.length,
        actionsExecuted: flowResults.actionsExecuted.length,
        journeyEnrolled: !!flowResults.journeyEnrollment,
        emailSent: flowResults.emailSent?.result?.status === "sent"
      },
      flow: flowResults
    });

  } catch (error) {
    console.error("❌ testLeadCapture error:", error);
    flowResults.errors.push({ step: "global", error: error.message });
    response.status(500).json({
      success: false,
      error: error.message,
      flow: flowResults
    });
  }
});
