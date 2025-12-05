/**
 * Firebase Cloud Functions for yellowCircle
 * Simple v1 style without params module
 */

const functions = require("firebase-functions");

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
