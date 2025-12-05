/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// For cost control, limit concurrent containers
setGlobalOptions({ maxInstances: 10 });

// Secret for Groq API key (set via: firebase functions:secrets:set GROQ_API_KEY)
const groqApiKey = defineSecret("GROQ_API_KEY");

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

/**
 * Generate Email Content - Proxy for Groq API
 *
 * Rate limits:
 * - Anonymous: 3 requests/day per IP
 * - With custom header: 10 requests/day (future: Firebase Auth)
 *
 * Usage:
 * POST /generate
 * Body: { prompt, context, stage }
 */
exports.generate = onRequest(
  {
    cors: true,
    secrets: [groqApiKey]
  },
  async (request, response) => {
    // Only allow POST
    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Get client IP for rate limiting
    const clientIp = request.headers["x-forwarded-for"]?.split(",")[0] ||
                     request.connection?.remoteAddress ||
                     "unknown";

    // Check rate limit (3/day for anonymous)
    const rateLimit = checkRateLimit(clientIp, 3);

    response.set("X-RateLimit-Limit", "3");
    response.set("X-RateLimit-Remaining", String(rateLimit.remaining));

    if (!rateLimit.allowed) {
      logger.info(`Rate limit exceeded for IP: ${clientIp}`);
      response.status(429).json({
        error: "Rate limit exceeded. Enter your own API key to continue.",
        limit: 3,
        remaining: 0
      });
      return;
    }

    try {
      const { prompt, context, stage } = request.body;

      if (!prompt) {
        response.status(400).json({ error: "Missing prompt" });
        return;
      }

      // Call Groq API
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey.value()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are an expert email copywriter. Write concise, engaging emails."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!groqResponse.ok) {
        const error = await groqResponse.text();
        logger.error("Groq API error:", error);
        response.status(502).json({ error: "LLM service error" });
        return;
      }

      const data = await groqResponse.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        response.status(500).json({ error: "No content generated" });
        return;
      }

      logger.info(`Generated content for stage: ${stage || "unknown"}`);

      response.json({
        content,
        stage: stage || "unknown",
        creditsRemaining: rateLimit.remaining
      });

    } catch (error) {
      logger.error("Generate function error:", error);
      response.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Health check endpoint
 */
exports.health = onRequest({ cors: true }, (request, response) => {
  response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});
