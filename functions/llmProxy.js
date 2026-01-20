/**
 * LLM Proxy Cloud Functions
 *
 * Server-side proxy for LLM API calls to keep API keys secure.
 * Keys are stored in Firebase Functions config, not in frontend code.
 *
 * Setup keys with:
 *   firebase functions:config:set llm.groq_key="gsk_xxx" llm.openai_key="sk-xxx"
 *
 * View current config:
 *   firebase functions:config:get
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// CORS headers
const setCors = (response) => {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

// Rate limiting for LLM calls (more restrictive than general)
const checkLLMRateLimit = async (identifier, limit = 50) => {
  const today = new Date().toISOString().split("T")[0];
  const rateLimitRef = db.collection("rate_limits").doc(`llm-${identifier}-${today}`);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);

      if (doc.exists) {
        const data = doc.data();
        const current = data.count || 0;

        if (current >= limit) {
          return { allowed: false, remaining: 0, used: current };
        }

        transaction.update(rateLimitRef, {
          count: current + 1,
          lastRequest: admin.firestore.FieldValue.serverTimestamp()
        });

        return { allowed: true, remaining: limit - current - 1, used: current + 1 };
      } else {
        transaction.set(rateLimitRef, {
          identifier,
          date: today,
          count: 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastRequest: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 25 * 60 * 60 * 1000)
        });

        return { allowed: true, remaining: limit - 1, used: 1 };
      }
    });

    return result;
  } catch (error) {
    console.error("LLM Rate limit check error:", error);
    return { allowed: true, remaining: 0, used: 0, error: true };
  }
};

// Verify user is authenticated (optional - can be disabled for public features)
const verifyAuth = async (request) => {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, user: null };
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { authenticated: true, user: decodedToken };
  } catch (error) {
    console.warn('Auth verification failed:', error.message);
    return { authenticated: false, user: null };
  }
};

// ============================================
// Groq LLM Proxy
// ============================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const GROQ_AVAILABLE_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];

/**
 * Groq text generation proxy
 * POST /api/llm/groq
 *
 * Body: {
 *   prompt: string,
 *   model?: string,
 *   temperature?: number,
 *   maxTokens?: number,
 *   systemPrompt?: string
 * }
 */
exports.groqGenerate = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onRequest(async (request, response) => {
    setCors(response);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Get API key from Firebase config
      // Uses existing config path: groq.api_key (set via: firebase functions:config:set groq.api_key="...")
      const groqKey = functions.config().groq?.api_key;
      if (!groqKey) {
        console.error('Groq API key not configured in Firebase Functions config');
        response.status(500).json({
          error: 'LLM service not configured',
          hint: 'Run: firebase functions:config:set groq.api_key="YOUR_KEY"'
        });
        return;
      }

      // Optional: Verify authentication
      const auth = await verifyAuth(request);

      // Rate limiting - use user ID if authenticated, IP otherwise
      const rateLimitId = auth.authenticated ? auth.user.uid :
        (request.headers['x-forwarded-for'] || request.ip || 'unknown');

      // Authenticated users get 100 requests/day, anonymous get 20
      const rateLimit = auth.authenticated ? 100 : 20;
      const rateLimitResult = await checkLLMRateLimit(rateLimitId, rateLimit);

      if (!rateLimitResult.allowed) {
        response.status(429).json({
          error: 'Rate limit exceeded',
          limit: rateLimit,
          resetTime: 'midnight UTC'
        });
        return;
      }

      // Parse request body
      const {
        prompt,
        model = GROQ_DEFAULT_MODEL,
        temperature = 0.7,
        maxTokens = 2048,
        systemPrompt = null
      } = request.body;

      if (!prompt) {
        response.status(400).json({ error: 'Missing required field: prompt' });
        return;
      }

      // Validate model
      if (!GROQ_AVAILABLE_MODELS.includes(model)) {
        response.status(400).json({
          error: `Invalid model. Available: ${GROQ_AVAILABLE_MODELS.join(', ')}`
        });
        return;
      }

      // Build messages array
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      // Call Groq API
      const groqResponse = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!groqResponse.ok) {
        const errorData = await groqResponse.json().catch(() => ({}));
        console.error('Groq API error:', groqResponse.status, errorData);
        response.status(groqResponse.status).json({
          error: errorData.error?.message || 'Groq API error',
          provider: 'groq'
        });
        return;
      }

      const data = await groqResponse.json();
      const content = data.choices?.[0]?.message?.content || '';

      response.json({
        content,
        model: data.model,
        usage: data.usage,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          used: rateLimitResult.used
        }
      });

    } catch (error) {
      console.error('Groq proxy error:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });

/**
 * Get LLM service status and available models
 * GET /api/llm/status
 */
exports.llmStatus = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  const groqConfigured = !!functions.config().groq?.api_key;
  const openaiConfigured = !!functions.config().openai?.api_key;

  response.json({
    providers: {
      groq: {
        configured: groqConfigured,
        models: groqConfigured ? GROQ_AVAILABLE_MODELS : [],
        defaultModel: GROQ_DEFAULT_MODEL
      },
      openai: {
        configured: openaiConfigured,
        models: openaiConfigured ? ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] : [],
        defaultModel: 'gpt-4o-mini'
      }
    },
    rateLimits: {
      authenticated: 100,
      anonymous: 20,
      period: 'per day'
    }
  });
});

// Export all functions
module.exports = {
  groqGenerate: exports.groqGenerate,
  llmStatus: exports.llmStatus
};
