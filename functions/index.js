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
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-token, x-n8n-token");
};

// ============================================
// Admin Authentication (SSO + Legacy Token Fallback)
// ============================================

/**
 * Verify admin authentication using either:
 * 1. Firebase Auth Bearer token (preferred - checks admin whitelist)
 * 2. Legacy x-admin-token header (backwards compatibility for n8n/scripts)
 *
 * @param {Object} request - HTTP request object
 * @param {Object} options - Options { allowCleanupToken: boolean, allowN8nToken: boolean }
 * @returns {Object} { success: boolean, error?: string, user?: { email, uid, method } }
 */
const verifyAdminAuth = async (request, options = {}) => {
  const { allowCleanupToken = false, allowN8nToken = false } = options;

  // 1. Try Firebase Auth Bearer token first (preferred)
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userEmail = decodedToken.email?.toLowerCase();

      if (!userEmail) {
        return { success: false, error: 'No email in token' };
      }

      // Check admin whitelist from Firestore
      const adminWhitelistDoc = await db.collection('config').doc('admin_whitelist').get();
      const adminEmails = adminWhitelistDoc.exists
        ? (adminWhitelistDoc.data()?.emails || []).map(e => e.toLowerCase())
        : [];

      if (!adminEmails.includes(userEmail)) {
        console.warn(`Admin auth rejected for ${userEmail} - not in whitelist`);
        return { success: false, error: 'Not an admin' };
      }

      console.log(`Admin auth via Firebase SSO: ${userEmail}`);
      return {
        success: true,
        user: {
          email: userEmail,
          uid: decodedToken.uid,
          method: 'firebase_sso'
        }
      };
    } catch (error) {
      console.warn('Firebase token verification failed:', error.message);
      // Fall through to legacy token check
    }
  }

  // 2. Legacy x-admin-token fallback (for n8n, scripts, backwards compatibility)
  const adminToken = request.headers["x-admin-token"];
  const expectedAdminToken = functions.config().admin?.token;

  if (adminToken && expectedAdminToken && adminToken === expectedAdminToken) {
    console.log('Admin auth via legacy token');
    return { success: true, user: { method: 'legacy_token' } };
  }

  // 3. Cleanup token (for storage cleanup functions)
  if (allowCleanupToken) {
    const expectedCleanupToken = functions.config().admin?.cleanup_token;
    if (adminToken && expectedCleanupToken && adminToken === expectedCleanupToken) {
      console.log('Admin auth via cleanup token');
      return { success: true, user: { method: 'cleanup_token' } };
    }
  }

  // 4. n8n token (for workflow automation)
  if (allowN8nToken) {
    const n8nToken = request.headers["x-n8n-token"];
    const expectedN8nToken = functions.config().n8n?.token;
    if (n8nToken && expectedN8nToken && n8nToken === expectedN8nToken) {
      console.log('Admin auth via n8n token');
      return { success: true, user: { method: 'n8n_token' } };
    }
  }

  return { success: false, error: 'Unauthorized' };
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
 * Convert plain text email to HTML with clickable links
 * This enables Resend to track opens (via pixel) and clicks (via link wrapping)
 */
const textToHtmlEmail = (text) => {
  // Convert URLs to clickable links (Resend will auto-track these)
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
  const withLinks = text.replace(urlRegex, '<a href="$1" style="color: #fbbf24;">$1</a>');

  // Convert markdown-style bold **text** to <strong>
  const withBold = withLinks.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Convert → arrows to styled arrows
  const withArrows = withBold.replace(/→/g, '<span style="color: #fbbf24;">→</span>');

  // Convert paragraphs (double newlines) and line breaks
  const paragraphs = withArrows.split('\n\n').map(p =>
    `<p style="margin: 0 0 16px 0; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`
  ).join('');

  // Wrap in proper HTML email template
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
${paragraphs}
</body>
</html>`;
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
 * Generate Content - Flexible Proxy for Groq API
 * Supports: email, ad copy, social posts, and custom content generation
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

  // Higher rate limit for creative generation (10/day)
  const rateLimit = await checkRateLimit(clientIp, 10);
  response.set("X-RateLimit-Limit", "10");
  response.set("X-RateLimit-Remaining", String(rateLimit.remaining));

  if (!rateLimit.allowed) {
    response.status(429).json({
      error: "Rate limit exceeded (10/day). Try again tomorrow.",
      limit: 10,
      remaining: 0
    });
    return;
  }

  try {
    const {
      prompt,
      stage,
      contentType = 'general',  // email, adCopy, social, general
      systemPrompt,             // Custom system prompt override
      maxTokens = 1000,         // Configurable (capped at 2000)
      temperature = 0.7         // Configurable (0.0 - 1.0)
    } = request.body;

    if (!prompt) {
      response.status(400).json({ error: "Missing prompt" });
      return;
    }

    // Get API key from Firebase config
    const groqApiKey = functions.config().groq?.api_key;

    if (!groqApiKey) {
      response.status(500).json({ error: "Groq API key not configured" });
      return;
    }

    // Default system prompts by content type
    const systemPrompts = {
      email: "You are an expert email copywriter. Write concise, engaging emails that drive action.",
      adCopy: "You are an expert advertising copywriter. Create compelling ad copy that captures attention, communicates value, and drives conversions. Follow platform-specific best practices.",
      social: "You are a social media content expert. Create engaging posts that resonate with audiences and encourage interaction.",
      general: "You are a helpful assistant that creates professional marketing content."
    };

    const finalSystemPrompt = systemPrompt || systemPrompts[contentType] || systemPrompts.general;
    const finalMaxTokens = Math.min(Math.max(100, maxTokens), 2000);  // Clamp 100-2000
    const finalTemperature = Math.min(Math.max(0, temperature), 1);    // Clamp 0-1

    // Try multiple models in case one is unavailable
    const models = [
      "llama-3.3-70b-versatile",   // Latest Llama 3.3 (most capable)
      "llama-3.1-70b-versatile",   // Fallback to 3.1
      "llama3-70b-8192"            // Legacy fallback
    ];

    let groqResponse = null;
    let lastError = null;

    for (const model of models) {
      console.log(`Trying Groq model: ${model}`);
      groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: finalSystemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: finalTemperature,
          max_tokens: finalMaxTokens
        })
      });

      if (groqResponse.ok) {
        console.log(`Successfully used model: ${model}`);
        break;
      } else {
        lastError = await groqResponse.text();
        console.error(`Groq API error with ${model}:`, lastError);
        // Only continue trying other models if it's a model-specific error
        if (groqResponse.status === 400 && lastError.includes("model")) {
          continue;
        }
        // For other errors (auth, rate limit, etc), don't retry
        break;
      }
    }

    if (!groqResponse.ok) {
      console.error("All Groq models failed:", lastError);
      response.status(502).json({ error: "LLM service error", details: lastError });
      return;
    }

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      response.status(500).json({ error: "No content generated" });
      return;
    }

    response.json({
      content,
      stage: stage || "unknown",
      contentType,
      creditsRemaining: rateLimit.remaining,
      tokensUsed: data.usage?.total_tokens || 0
    });
  } catch (error) {
    console.error("Generate function error:", error);
    response.status(500).json({ error: "Internal server error", message: error.message });
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

// ============================================================
// AI Image Generation (Tiered with Budget Cap)
// ============================================================

/**
 * Image Generation - Tiered AI Image Creation
 *
 * Tiers:
 * - free: Returns placeholder/gradient images (no API calls)
 * - standard: Imagen 3 @ $0.03/image
 * - premium: Gemini 3 Pro @ $0.13/image
 *
 * Monthly Budget: $20 cap (tracked in api_usage collection)
 *
 * Usage: POST /generateImage
 * {
 *   prompt: "Marketing banner for tech startup",
 *   tier: "standard",
 *   dimensions: { width: 1024, height: 1024 },
 *   style: "photorealistic"
 * }
 */
exports.generateImage = functions
  .runWith({ memory: '1GB', timeoutSeconds: 120 })
  .https.onRequest(async (request, response) => {
    setCors(response);

    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    if (request.method !== "POST") {
      return response.status(405).json({ error: "Method not allowed" });
    }

    try {
      const {
        prompt,
        tier = 'free',
        dimensions = { width: 1024, height: 1024 },
        style = 'photorealistic',
        aspectRatio = '1:1',
        negativePrompt = '',
        seed = null
      } = request.body;

      if (!prompt && tier !== 'free') {
        return response.status(400).json({ error: "Missing prompt" });
      }

      // Tier pricing configuration
      const TIER_CONFIG = {
        free: { cost: 0, model: null, description: 'Placeholder/gradient images' },
        standard: { cost: 0.03, model: 'imagen-3.0-generate', description: 'Imagen 3 - Good quality' },
        premium: { cost: 0.13, model: 'gemini-2.0-flash-preview-image-generation', description: 'Gemini - Best quality' }
      };

      const tierConfig = TIER_CONFIG[tier];
      if (!tierConfig) {
        return response.status(400).json({
          error: "Invalid tier",
          validTiers: Object.keys(TIER_CONFIG)
        });
      }

      // Check monthly budget ($20 cap)
      const MONTHLY_BUDGET = 20.00;
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const usageRef = db.collection('api_usage').doc(`image-gen-${monthKey}`);
      const usageDoc = await usageRef.get();
      const currentSpend = usageDoc.exists ? (usageDoc.data().totalSpend || 0) : 0;

      if (tier !== 'free' && currentSpend + tierConfig.cost > MONTHLY_BUDGET) {
        return response.json({
          success: false,
          error: "Monthly budget exceeded",
          budgetLimit: MONTHLY_BUDGET,
          currentSpend: currentSpend,
          fallbackToFree: true,
          hint: "Using free tier placeholder instead",
          image: generatePlaceholderImage(prompt, dimensions, style)
        });
      }

      // FREE TIER: Generate placeholder/gradient
      if (tier === 'free') {
        const placeholder = generatePlaceholderImage(prompt, dimensions, style);
        return response.json({
          success: true,
          tier: 'free',
          cost: 0,
          image: placeholder,
          message: "Free tier: placeholder image generated"
        });
      }

      // PAID TIERS: Use Gemini API
      const geminiApiKey = functions.config().gemini?.api_key;
      if (!geminiApiKey) {
        // Fallback to free tier if no API key
        console.log('⚠️ Gemini API key not configured, falling back to free tier');
        return response.json({
          success: true,
          tier: 'free',
          cost: 0,
          fallback: true,
          fallbackReason: 'API key not configured',
          image: generatePlaceholderImage(prompt, dimensions, style),
          hint: 'Set gemini.api_key via: firebase functions:config:set gemini.api_key=YOUR_KEY'
        });
      }

      // Build Gemini API request
      const enhancedPrompt = buildEnhancedPrompt(prompt, style, dimensions);

      console.log(`🎨 Generating image with ${tierConfig.model}: ${enhancedPrompt.substring(0, 100)}...`);

      // Gemini 2.0 Flash for image generation
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${tierConfig.model}:generateContent?key=${geminiApiKey}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: enhancedPrompt
            }]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            responseMimeType: 'text/plain'
          }
        })
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('❌ Gemini API error:', errorText);

        // Fallback to free tier
        return response.json({
          success: true,
          tier: 'free',
          cost: 0,
          fallback: true,
          fallbackReason: `API error: ${geminiResponse.status}`,
          image: generatePlaceholderImage(prompt, dimensions, style),
          error: errorText
        });
      }

      const geminiData = await geminiResponse.json();
      let imageData = null;

      // Extract image from response
      if (geminiData.candidates?.[0]?.content?.parts) {
        for (const part of geminiData.candidates[0].content.parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            imageData = {
              base64: part.inlineData.data,
              mimeType: part.inlineData.mimeType
            };
            break;
          }
        }
      }

      if (!imageData) {
        console.log('⚠️ No image in response, falling back to free tier');
        return response.json({
          success: true,
          tier: 'free',
          cost: 0,
          fallback: true,
          fallbackReason: 'No image in API response',
          image: generatePlaceholderImage(prompt, dimensions, style),
          rawResponse: geminiData
        });
      }

      // Track usage and cost
      await usageRef.set({
        totalSpend: admin.firestore.FieldValue.increment(tierConfig.cost),
        imageCount: admin.firestore.FieldValue.increment(1),
        lastGenerated: admin.firestore.FieldValue.serverTimestamp(),
        [`tier_${tier}_count`]: admin.firestore.FieldValue.increment(1)
      }, { merge: true });

      console.log(`✅ Image generated: ${tier} tier, cost $${tierConfig.cost}`);

      response.json({
        success: true,
        tier,
        cost: tierConfig.cost,
        budgetRemaining: MONTHLY_BUDGET - currentSpend - tierConfig.cost,
        image: {
          dataUrl: `data:${imageData.mimeType};base64,${imageData.base64}`,
          mimeType: imageData.mimeType,
          dimensions
        }
      });

    } catch (error) {
      console.error("❌ generateImage error:", error);

      // Always provide a fallback
      return response.json({
        success: true,
        tier: 'free',
        cost: 0,
        fallback: true,
        fallbackReason: error.message,
        image: generatePlaceholderImage(request.body?.prompt || '', { width: 1024, height: 1024 }, 'abstract'),
        error: error.message
      });
    }
  });

/**
 * Generate a placeholder/gradient image (free tier fallback)
 */
function generatePlaceholderImage(prompt, dimensions, style) {
  const { width, height } = dimensions;

  // Generate deterministic colors based on prompt
  const hash = (prompt || 'default').split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 45) % 360;

  // Color palettes by style
  const palettes = {
    photorealistic: ['#1a1a2e', '#16213e', '#0f3460'],
    illustration: ['#ff6b6b', '#feca57', '#48dbfb'],
    abstract: ['#6c5ce7', '#a29bfe', '#fd79a8'],
    minimalist: ['#dfe6e9', '#b2bec3', '#636e72'],
    vibrant: ['#00b894', '#00cec9', '#0984e3']
  };

  const colors = palettes[style] || palettes.abstract;
  const primaryColor = colors[Math.abs(hash) % colors.length];

  // SVG placeholder with gradient
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:hsl(${hue1}, 70%, 50%);stop-opacity:1" />
        <stop offset="100%" style="stop-color:hsl(${hue2}, 70%, 40%);stop-opacity:1" />
      </linearGradient>
      <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
    <rect width="100%" height="100%" fill="url(#dots)"/>
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="24" fill="rgba(255,255,255,0.9)">
      ${(prompt || 'Placeholder Image').substring(0, 30)}${(prompt || '').length > 30 ? '...' : ''}
    </text>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="rgba(255,255,255,0.6)">
      ${width} × ${height} • Free Tier
    </text>
  </svg>`;

  const base64 = Buffer.from(svg).toString('base64');

  return {
    dataUrl: `data:image/svg+xml;base64,${base64}`,
    mimeType: 'image/svg+xml',
    dimensions: { width, height },
    placeholder: true
  };
}

/**
 * Build enhanced prompt for better image generation
 */
function buildEnhancedPrompt(prompt, style, dimensions) {
  const stylePrompts = {
    photorealistic: 'photorealistic, high-quality photography, professional lighting, 8K resolution',
    illustration: 'digital illustration, clean lines, modern design, vector-style',
    abstract: 'abstract art, creative composition, artistic, modern aesthetic',
    minimalist: 'minimalist design, clean, simple, modern, professional',
    vibrant: 'vibrant colors, bold design, eye-catching, dynamic composition'
  };

  const styleModifier = stylePrompts[style] || stylePrompts.photorealistic;
  const aspectHint = dimensions.width > dimensions.height ? 'landscape composition' :
                     dimensions.width < dimensions.height ? 'portrait composition' : 'square composition';

  return `Create an image: ${prompt}. Style: ${styleModifier}. ${aspectHint}. High quality, professional marketing asset.`;
}

/**
 * Get image generation usage stats
 */
exports.getImageGenUsage = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    return response.status(204).send("");
  }

  // Auth check
  const authResult = await verifyAdminAuth(request);
  if (!authResult.success) {
    return response.status(401).json({ error: authResult.error || "Unauthorized" });
  }

  try {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usageRef = db.collection('api_usage').doc(`image-gen-${monthKey}`);
    const usageDoc = await usageRef.get();

    const MONTHLY_BUDGET = 20.00;
    const usage = usageDoc.exists ? usageDoc.data() : {
      totalSpend: 0,
      imageCount: 0,
      tier_standard_count: 0,
      tier_premium_count: 0
    };

    response.json({
      success: true,
      month: monthKey,
      budget: MONTHLY_BUDGET,
      spent: usage.totalSpend || 0,
      remaining: MONTHLY_BUDGET - (usage.totalSpend || 0),
      imageCount: usage.imageCount || 0,
      byTier: {
        free: 'unlimited',
        standard: usage.tier_standard_count || 0,
        premium: usage.tier_premium_count || 0
      },
      pricing: {
        free: '$0.00',
        standard: '$0.03/image (~666 images with $20 budget)',
        premium: '$0.13/image (~153 images with $20 budget)'
      }
    });

  } catch (error) {
    console.error("❌ getImageGenUsage error:", error);
    response.status(500).json({ error: error.message });
  }
});

// ============================================
// Programmatic Ad Distribution ($100/month total cap)
// ============================================

/**
 * Budget configuration for programmatic ads
 * Total monthly cap: $100
 * Per-platform cap: $35 (no single platform should dominate)
 */
const AD_BUDGET_CONFIG = {
  monthly_total_cap: 100.00,
  platform_caps: {
    meta: 35.00,     // Facebook/Instagram
    google: 35.00,   // Google Ads
    linkedin: 35.00  // LinkedIn Ads
  },
  min_campaign_budget: 5.00,
  default_daily_budget: 10.00
};

/**
 * Get Ad Platform Usage Stats
 * Returns current spend across all platforms
 */
exports.getAdBudgetStats = functions.https.onRequest(async (request, response) => {
  setCors(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      response.status(401).json({ error: authResult.error || "Unauthorized" });
      return;
    }

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usageRef = db.collection('api_usage').doc(`ads-${monthKey}`);
    const usageDoc = await usageRef.get();

    const usage = usageDoc.exists ? usageDoc.data() : {
      totalSpend: 0,
      byPlatform: { meta: 0, google: 0, linkedin: 0 },
      campaigns: []
    };

    response.json({
      success: true,
      month: monthKey,
      budget: AD_BUDGET_CONFIG,
      usage: {
        totalSpend: usage.totalSpend || 0,
        remaining: AD_BUDGET_CONFIG.monthly_total_cap - (usage.totalSpend || 0),
        byPlatform: {
          meta: {
            spent: usage.byPlatform?.meta || 0,
            remaining: AD_BUDGET_CONFIG.platform_caps.meta - (usage.byPlatform?.meta || 0),
            cap: AD_BUDGET_CONFIG.platform_caps.meta
          },
          google: {
            spent: usage.byPlatform?.google || 0,
            remaining: AD_BUDGET_CONFIG.platform_caps.google - (usage.byPlatform?.google || 0),
            cap: AD_BUDGET_CONFIG.platform_caps.google
          },
          linkedin: {
            spent: usage.byPlatform?.linkedin || 0,
            remaining: AD_BUDGET_CONFIG.platform_caps.linkedin - (usage.byPlatform?.linkedin || 0),
            cap: AD_BUDGET_CONFIG.platform_caps.linkedin
          }
        },
        campaignCount: usage.campaigns?.length || 0
      },
      platformStatus: {
        meta: {
          configured: !!(functions.config().meta?.app_id),
          apiVersion: "v21.0"
        },
        google: {
          configured: !!(functions.config().googleads?.developer_token),
          apiVersion: "v18"
        },
        linkedin: {
          configured: !!(functions.config().linkedin?.client_id),
          apiVersion: "202411"
        }
      }
    });
  } catch (error) {
    console.error("❌ getAdBudgetStats error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Create Meta (Facebook/Instagram) Ad Campaign
 * Requires: meta.app_id, meta.app_secret, meta.access_token
 */
exports.createMetaCampaign = functions
  .runWith({ memory: '512MB', timeoutSeconds: 60 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    try {
      const authResult = await verifyAdminAuth(request);
      if (!authResult.success) {
        response.status(401).json({ error: authResult.error || "Unauthorized" });
        return;
      }

      const {
        name,
        objective = "OUTCOME_AWARENESS",
        dailyBudget = AD_BUDGET_CONFIG.default_daily_budget,
        adAccountId,
        targeting,
        creative
      } = request.body;

      // Validate budget
      if (dailyBudget < AD_BUDGET_CONFIG.min_campaign_budget) {
        response.status(400).json({
          error: `Minimum campaign budget is $${AD_BUDGET_CONFIG.min_campaign_budget}`
        });
        return;
      }

      // Check platform budget cap
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const usageRef = db.collection('api_usage').doc(`ads-${monthKey}`);
      const usageDoc = await usageRef.get();
      const currentMetaSpend = usageDoc.exists ? (usageDoc.data().byPlatform?.meta || 0) : 0;

      if (currentMetaSpend + dailyBudget > AD_BUDGET_CONFIG.platform_caps.meta) {
        response.status(400).json({
          error: "Meta platform budget cap reached",
          spent: currentMetaSpend,
          cap: AD_BUDGET_CONFIG.platform_caps.meta,
          remaining: AD_BUDGET_CONFIG.platform_caps.meta - currentMetaSpend
        });
        return;
      }

      // Check API credentials
      const metaConfig = functions.config().meta || {};
      if (!metaConfig.access_token) {
        response.json({
          success: false,
          configured: false,
          message: "Meta API not configured. Set via: firebase functions:config:set meta.app_id=X meta.app_secret=X meta.access_token=X",
          docs: "https://developers.facebook.com/docs/marketing-apis/get-started"
        });
        return;
      }

      // Create campaign via Meta Marketing API
      const campaignPayload = {
        name: name || `yellowCircle Campaign ${monthKey}`,
        objective,
        special_ad_categories: [],
        status: "PAUSED"  // Always start paused for safety
      };

      const fetch = (await import('node-fetch')).default;
      const createUrl = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns`;

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaignPayload,
          access_token: metaConfig.access_token
        })
      });

      const result = await createResponse.json();

      if (result.error) {
        response.status(400).json({
          success: false,
          error: result.error.message,
          code: result.error.code
        });
        return;
      }

      // Log usage
      await usageRef.set({
        totalSpend: admin.firestore.FieldValue.increment(dailyBudget),
        byPlatform: {
          meta: admin.firestore.FieldValue.increment(dailyBudget)
        },
        campaigns: admin.firestore.FieldValue.arrayUnion({
          platform: 'meta',
          id: result.id,
          name: campaignPayload.name,
          budget: dailyBudget,
          createdAt: now.toISOString()
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      response.json({
        success: true,
        platform: 'meta',
        campaign: {
          id: result.id,
          name: campaignPayload.name,
          status: 'PAUSED',
          objective,
          dailyBudget
        },
        budgetRemaining: {
          platform: AD_BUDGET_CONFIG.platform_caps.meta - currentMetaSpend - dailyBudget,
          total: AD_BUDGET_CONFIG.monthly_total_cap - (usageDoc.exists ? usageDoc.data().totalSpend || 0 : 0) - dailyBudget
        }
      });
    } catch (error) {
      console.error("❌ createMetaCampaign error:", error);
      response.status(500).json({ error: error.message });
    }
  });

/**
 * Create Google Ads Campaign
 * Requires: googleads.developer_token, googleads.client_id, googleads.client_secret, googleads.refresh_token
 */
exports.createGoogleCampaign = functions
  .runWith({ memory: '512MB', timeoutSeconds: 60 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    try {
      const authResult = await verifyAdminAuth(request);
      if (!authResult.success) {
        response.status(401).json({ error: authResult.error || "Unauthorized" });
        return;
      }

      const {
        name,
        campaignType = "DISPLAY",
        dailyBudget = AD_BUDGET_CONFIG.default_daily_budget,
        customerId,
        targeting
      } = request.body;

      // Validate budget
      if (dailyBudget < AD_BUDGET_CONFIG.min_campaign_budget) {
        response.status(400).json({
          error: `Minimum campaign budget is $${AD_BUDGET_CONFIG.min_campaign_budget}`
        });
        return;
      }

      // Check platform budget cap
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const usageRef = db.collection('api_usage').doc(`ads-${monthKey}`);
      const usageDoc = await usageRef.get();
      const currentGoogleSpend = usageDoc.exists ? (usageDoc.data().byPlatform?.google || 0) : 0;

      if (currentGoogleSpend + dailyBudget > AD_BUDGET_CONFIG.platform_caps.google) {
        response.status(400).json({
          error: "Google Ads platform budget cap reached",
          spent: currentGoogleSpend,
          cap: AD_BUDGET_CONFIG.platform_caps.google,
          remaining: AD_BUDGET_CONFIG.platform_caps.google - currentGoogleSpend
        });
        return;
      }

      // Check API credentials
      const googleConfig = functions.config().googleads || {};
      if (!googleConfig.developer_token) {
        response.json({
          success: false,
          configured: false,
          message: "Google Ads API not configured. Set via: firebase functions:config:set googleads.developer_token=X googleads.client_id=X googleads.client_secret=X googleads.refresh_token=X",
          docs: "https://developers.google.com/google-ads/api/docs/first-call/overview"
        });
        return;
      }

      // TODO: Implement Google Ads API call
      // This requires OAuth flow and the google-ads-api npm package
      // For now, return a placeholder response

      const campaignId = `google-${Date.now()}`;

      // Log usage (when implemented)
      await usageRef.set({
        totalSpend: admin.firestore.FieldValue.increment(dailyBudget),
        byPlatform: {
          google: admin.firestore.FieldValue.increment(dailyBudget)
        },
        campaigns: admin.firestore.FieldValue.arrayUnion({
          platform: 'google',
          id: campaignId,
          name: name || `yellowCircle Google Campaign ${monthKey}`,
          budget: dailyBudget,
          createdAt: now.toISOString(),
          status: 'draft'
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      response.json({
        success: true,
        platform: 'google',
        message: "Google Ads API integration pending. Campaign logged for manual creation.",
        campaign: {
          id: campaignId,
          name: name || `yellowCircle Google Campaign ${monthKey}`,
          status: 'draft',
          type: campaignType,
          dailyBudget
        },
        nextSteps: [
          "1. Set up OAuth credentials in Firebase config",
          "2. Install google-ads-api npm package",
          "3. Complete API integration"
        ],
        budgetRemaining: {
          platform: AD_BUDGET_CONFIG.platform_caps.google - currentGoogleSpend - dailyBudget,
          total: AD_BUDGET_CONFIG.monthly_total_cap - (usageDoc.exists ? usageDoc.data().totalSpend || 0 : 0) - dailyBudget
        }
      });
    } catch (error) {
      console.error("❌ createGoogleCampaign error:", error);
      response.status(500).json({ error: error.message });
    }
  });

/**
 * Create LinkedIn Ad Campaign
 * Requires: linkedin.client_id, linkedin.client_secret, linkedin.access_token
 */
exports.createLinkedInCampaign = functions
  .runWith({ memory: '512MB', timeoutSeconds: 60 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    try {
      const authResult = await verifyAdminAuth(request);
      if (!authResult.success) {
        response.status(401).json({ error: authResult.error || "Unauthorized" });
        return;
      }

      const {
        name,
        campaignType = "SPONSORED_UPDATES",
        dailyBudget = AD_BUDGET_CONFIG.default_daily_budget,
        accountId,
        targeting
      } = request.body;

      // Validate budget
      if (dailyBudget < AD_BUDGET_CONFIG.min_campaign_budget) {
        response.status(400).json({
          error: `Minimum campaign budget is $${AD_BUDGET_CONFIG.min_campaign_budget}`
        });
        return;
      }

      // Check platform budget cap
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const usageRef = db.collection('api_usage').doc(`ads-${monthKey}`);
      const usageDoc = await usageRef.get();
      const currentLinkedInSpend = usageDoc.exists ? (usageDoc.data().byPlatform?.linkedin || 0) : 0;

      if (currentLinkedInSpend + dailyBudget > AD_BUDGET_CONFIG.platform_caps.linkedin) {
        response.status(400).json({
          error: "LinkedIn platform budget cap reached",
          spent: currentLinkedInSpend,
          cap: AD_BUDGET_CONFIG.platform_caps.linkedin,
          remaining: AD_BUDGET_CONFIG.platform_caps.linkedin - currentLinkedInSpend
        });
        return;
      }

      // Check API credentials
      const linkedinConfig = functions.config().linkedin || {};
      if (!linkedinConfig.access_token) {
        response.json({
          success: false,
          configured: false,
          message: "LinkedIn Marketing API not configured. Set via: firebase functions:config:set linkedin.client_id=X linkedin.client_secret=X linkedin.access_token=X",
          docs: "https://learn.microsoft.com/en-us/linkedin/marketing/getting-started"
        });
        return;
      }

      // Create campaign via LinkedIn Marketing API
      const fetch = (await import('node-fetch')).default;
      const campaignPayload = {
        account: `urn:li:sponsoredAccount:${accountId}`,
        name: name || `yellowCircle LinkedIn Campaign ${monthKey}`,
        type: campaignType,
        status: "DRAFT",  // Always start as draft for safety
        costType: "CPM",
        dailyBudget: {
          amount: String(dailyBudget * 100),  // LinkedIn uses cents
          currencyCode: "USD"
        }
      };

      const createResponse = await fetch('https://api.linkedin.com/rest/adCampaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${linkedinConfig.access_token}`,
          'LinkedIn-Version': '202411',
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignPayload)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        response.status(createResponse.status).json({
          success: false,
          error: errorText,
          statusCode: createResponse.status
        });
        return;
      }

      const result = await createResponse.json();

      // Log usage
      await usageRef.set({
        totalSpend: admin.firestore.FieldValue.increment(dailyBudget),
        byPlatform: {
          linkedin: admin.firestore.FieldValue.increment(dailyBudget)
        },
        campaigns: admin.firestore.FieldValue.arrayUnion({
          platform: 'linkedin',
          id: result.id,
          name: campaignPayload.name,
          budget: dailyBudget,
          createdAt: now.toISOString()
        }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      response.json({
        success: true,
        platform: 'linkedin',
        campaign: {
          id: result.id,
          name: campaignPayload.name,
          status: 'DRAFT',
          type: campaignType,
          dailyBudget
        },
        budgetRemaining: {
          platform: AD_BUDGET_CONFIG.platform_caps.linkedin - currentLinkedInSpend - dailyBudget,
          total: AD_BUDGET_CONFIG.monthly_total_cap - (usageDoc.exists ? usageDoc.data().totalSpend || 0 : 0) - dailyBudget
        }
      });
    } catch (error) {
      console.error("❌ createLinkedInCampaign error:", error);
      response.status(500).json({ error: error.message });
    }
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

    // Auto-convert text to HTML for tracking if html not provided
    const htmlContent = html || (text ? textToHtmlEmail(text) : null);

    const result = await sendEmailViaESP({
      to,
      from,
      subject,
      html: htmlContent,
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

        // Convert to HTML with proper links for click tracking
        const html = textToHtmlEmail(processedBody);

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
  // Auth check (SSO + legacy cleanup token fallback)
  const authResult = await verifyAdminAuth(request, { allowCleanupToken: true });
  if (!authResult.success) {
    response.status(401).json({ error: authResult.error || "Unauthorized" });
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
  // Auth check (SSO + legacy cleanup token fallback)
  const authResult = await verifyAdminAuth(request, { allowCleanupToken: true });
  if (!authResult.success) {
    response.status(401).json({ error: authResult.error || "Unauthorized" });
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
  // Auth check (SSO + legacy cleanup token fallback)
  const authResult = await verifyAdminAuth(request, { allowCleanupToken: true });
  if (!authResult.success) {
    response.status(401).json({ error: authResult.error || "Unauthorized" });
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

            // Convert to HTML with proper links for click tracking
            const html = textToHtmlEmail(processedBody);

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

  // Auth check (SSO + legacy token + n8n token fallback)
  const authResult = await verifyAdminAuth(request, { allowN8nToken: true });
  if (!authResult.success) {
    response.status(401).json({ error: authResult.error || "Unauthorized" });
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

  // Auth check (SSO + legacy token fallback)
  const authResult = await verifyAdminAuth(request);
  if (!authResult.success) {
    response.status(401).json({ error: authResult.error || "Unauthorized" });
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
// SEED OUTBOUND JOURNEYS
// Creates Pipeline A & B outbound sequences with conversion to inbound
// ============================================================

// ============================================================
// OUTBOUND EMAIL SIGNATURE (Consistent across all outbound)
// ============================================================
const OUTBOUND_SIGNATURE = `
Christopher
christopher@yellowcircle.io
yellowcircle.io
914.241.5524
Schedule a call: https://cal.com/christopher-at-yellowcircle/15min?overlayCalendar=true
UnityNOTES: https://yellowcircle.io/unity | Growth Health Check: https://yellowcircle.io/assessment`;

// ============================================================
// OUTBOUND JOURNEYS V2 - A/B/C Testing with Verification
// ============================================================
/**
 * seedOutboundJourneys - Creates outbound email journeys with:
 * - Random 1-of-3 email selection (A/B/C test)
 * - Merge tag failbacks (works even if tokens fail)
 * - Email verification before send
 * - 10/day throttle with deliverability monitoring
 * - Follow-up only on engagement
 *
 * @route POST /seedOutboundJourneys
 */
exports.seedOutboundJourneys = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Auth check (SSO + legacy token fallback)
  const authResult = await verifyAdminAuth(request);
  if (!authResult.success) {
    response.status(401).json({ error: authResult.error || "Unauthorized" });
    return;
  }

  const PIPELINE_A_JOURNEY_ID = "outbound-pipeline-a";
  const PIPELINE_B_JOURNEY_ID = "outbound-pipeline-b";
  const WELCOME_JOURNEY_ID = "welcome-new-leads";

  // ========================================
  // PIPELINE A: Traditional Businesses
  // Target: Accounting, Marketing Agencies, Consulting Firms
  // Emails written with failbacks (work even if merge tags fail)
  // ========================================

  // Email A1: Personal intro - works without any tokens
  const pipelineAEmail1 = `Hi{{#if name}} {{name}}{{else}} there{{/if}},

I came across {{#if company}}{{company}}{{else}}your firm{{/if}} while researching {{#if industry}}{{industry}}{{else}}professional services{{/if}} firms, and thought I'd reach out directly.

Quick background: I spent 10+ years leading marketing operations at DoorDash, Reddit, and LiveIntent. Now I help professional services firms build client acquisition systems that actually work.

Here's what I keep seeing: most firms are still relying on referrals. That works — until it doesn't. When growth stalls, there's no system to fall back on.

Would a 15-minute call be worth your time to see if any of this applies to your situation?

Either way, here's something that might be useful: "Why Your GTM Sucks" — https://yellowcircle.io/thoughts/why-your-gtm-sucks
${OUTBOUND_SIGNATURE}

P.S. — Not selling anything. Just exploring if there's a fit.`;

  // Email A2: Pain point - feast-or-famine
  const pipelineAEmail2 = `Hi{{#if name}} {{name}}{{else}} there{{/if}},

I wanted to share a pattern I see constantly with {{#if industry}}{{industry}}{{else}}professional services{{/if}} firms:

**The Feast-or-Famine Cycle**
1. Slammed with client work → no time for business development
2. Projects wrap up → suddenly scrambling for new clients
3. Take whatever comes through the door → back to being slammed
4. Repeat

The firms that break this cycle don't work harder on BD — they build systems that run in the background.

One thing that's worked well: a simple "warm reactivation" sequence for past clients and prospects. Takes 2 hours to set up, runs automatically, generates 3-5 conversations per month.

Happy to share the template if useful. Just reply "interested" and I'll send it over.
${OUTBOUND_SIGNATURE}`;

  // Email A3: Direct value offer
  const pipelineAEmail3 = `Hi{{#if name}} {{name}}{{else}} there{{/if}},

I'll be direct: if your client acquisition is working great, ignore this completely.

But if you're dealing with any of these:
→ Revenue that's unpredictable month-to-month
→ Too dependent on referrals (what happens when they dry up?)
→ No system for staying top-of-mind with past clients

Then 15 minutes with me will either give you a clear next step — or confirm you're already on the right track.

Book here if interested: https://cal.com/christopher-at-yellowcircle/15min?overlayCalendar=true

If not, no worries. I'll get out of your inbox.
${OUTBOUND_SIGNATURE}

P.S. — We can also do async. Reply with your biggest growth challenge and I'll send you a quick take. Free consulting, no strings.`;

  // ========================================
  // PIPELINE B: Digital-First Businesses
  // Target: Tech companies, Digital Agencies, Non-SaaS startups
  // Emails written with failbacks (work even if merge tags fail)
  // ========================================

  // Email B1: GTM infrastructure hook
  const pipelineBEmail1 = `Hey{{#if name}} {{name}}{{else}} there{{/if}},

{{#if company}}Found {{company}} while digging through some growth data — looks like you're building something interesting.{{else}}Found your company while researching growth-stage businesses — looks like you're building something interesting.{{/if}}

Quick background: I spent a decade in marketing ops at DoorDash, Reddit, and LiveIntent. Now I help growth-stage companies fix their go-to-market infrastructure.

Here's why I'm reaching out: I keep seeing the same pattern with companies at your stage.

You've got product-market fit. You've got customers. But scaling acquisition feels harder than it should be because:
• The marketing stack is duct-taped together
• Attribution is a mess (nobody trusts the numbers)
• The ops person is drowning in manual work instead of building systems

Sound familiar? If so, I built a free diagnostic that takes 15 minutes: https://yellowcircle.io/assessment

It'll tell you exactly where your GTM infrastructure is breaking down — and what to fix first.

No pitch. Just data.
${OUTBOUND_SIGNATURE}`;

  // Email B2: Data/time hook - 12 hours/week
  const pipelineBEmail2 = `Hey{{#if name}} {{name}}{{else}} there{{/if}},

Wanted to share something specific: I just analyzed 40+ growth-stage companies and found that teams spend an average of 12 hours/week on manual data work that should be automated.

That's 600+ hours a year. Gone.

The companies that fix this don't hire more ops people. They fix three things:
1. Data flow architecture (stop the leaks)
2. Attribution model (single source of truth)
3. Automation layer (remove the human bottlenecks)

I put together a teardown of how one company went from "chaos" to "system" in 6 weeks. Want me to send it?

Just reply "send it" and it's yours.
${OUTBOUND_SIGNATURE}`;

  // Email B3: Direct/breakup
  const pipelineBEmail3 = `Hey{{#if name}} {{name}}{{else}} there{{/if}},

I'll be direct: if your GTM ops are working great, ignore this completely.

But if you're dealing with any of these:
→ Marketing and sales pointing fingers at each other's data
→ Spending money on tools you barely use
→ Scaling feels like pushing a boulder uphill

Then 15 minutes with me will either give you a clear next step — or confirm you're already on the right track.

Book here if interested: https://cal.com/christopher-at-yellowcircle/15min?overlayCalendar=true

If not, no worries. I'll get out of your inbox.
${OUTBOUND_SIGNATURE}

P.S. — We can also do async. Reply with your biggest GTM challenge and I'll send you a quick take. Free consulting, no strings.`;

  try {
    const results = {
      pipelineA: null,
      pipelineB: null,
      timestamp: new Date().toISOString()
    };

    // ========================================
    // CREATE PIPELINE A JOURNEY
    // A/B/C Test: Random initial email, follow-up only on engagement
    // ========================================
    const journeyARef = db.collection("journeys").doc(PIPELINE_A_JOURNEY_ID);
    const existingJourneyA = await journeyARef.get();
    const existingDataA = existingJourneyA.exists ? existingJourneyA.data() : {};

    const journeyAData = {
      id: PIPELINE_A_JOURNEY_ID,
      title: "Outbound - Pipeline A (Traditional)",
      description: "Cold outreach for professional services: accounting, marketing agencies, consulting firms. A/B/C test with random initial email, follow-up only on engagement.",
      status: "active",
      pipeline: "A",

      // V2 Config: A/B/C Testing with throttle
      config: {
        version: "2.0",
        testMode: "abc_split",  // Random 1-of-3 initial email
        throttle: {
          maxPerDay: 10,
          requireVerification: true  // Ping email before send
        },
        followUpMode: "engagement_only",  // Only follow up if clicked/replied/booked
        conversionAction: "enroll_inbound"
      },

      _sync: {
        source: "script",
        scriptVersion: "2.0.0",
        lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        syncEndpoint: "seedOutboundJourneys"
      },

      // Email variants for A/B/C testing
      emailVariants: {
        A: {
          id: "variant-a",
          subject: "Quick question",  // Failback: no merge tags in subject
          subjectWithMerge: "Quick question about {{company}}",
          body: pipelineAEmail1,
          label: "Personal Intro"
        },
        B: {
          id: "variant-b",
          subject: "The feast-or-famine cycle",
          subjectWithMerge: "The feast-or-famine cycle",
          body: pipelineAEmail2,
          label: "Pain Point"
        },
        C: {
          id: "variant-c",
          subject: "Quick thought",  // Failback
          subjectWithMerge: "Quick thought for {{company}}",
          body: pipelineAEmail3,
          label: "Direct Value"
        }
      },

      nodes: [
        {
          id: "prospect-entry-a",
          type: "prospectNode",
          position: { x: 400, y: 50 },
          data: {
            label: "Pipeline A Prospects",
            count: existingDataA.nodes?.[0]?.data?.count || 0,
            segment: "pipeline_a",
            source: "discovery",
            tags: ["outbound", "pipeline-a", "traditional"],
            prospects: existingDataA.nodes?.[0]?.data?.prospects || []
          }
        },
        {
          id: "verify-email-a",
          type: "actionNode",
          position: { x: 400, y: 150 },
          data: {
            label: "Verify Email",
            actionType: "verify_email",
            config: { skipInvalid: true, logBounces: true }
          }
        },
        {
          id: "throttle-check-a",
          type: "conditionNode",
          position: { x: 400, y: 250 },
          data: {
            label: "Under Daily Limit?",
            conditionType: "throttle",
            conditions: [{ field: "dailySendCount", operator: "lt", value: 10 }]
          }
        },
        {
          id: "queue-for-tomorrow-a",
          type: "waitNode",
          position: { x: 600, y: 250 },
          data: { label: "Queue for Tomorrow", delay: 1, unit: "days" }
        },
        {
          id: "random-split-a",
          type: "splitNode",
          position: { x: 400, y: 350 },
          data: {
            label: "A/B/C Split",
            splitType: "random",
            branches: ["A", "B", "C"],
            weights: [33, 33, 34]
          }
        },
        {
          id: "email-variant-a",
          type: "emailNode",
          position: { x: 200, y: 450 },
          data: {
            label: "Variant A: Personal Intro",
            variantId: "A",
            subject: "Quick question",
            preview: pipelineAEmail1.substring(0, 100) + "...",
            fullBody: pipelineAEmail1,
            status: "active"
          }
        },
        {
          id: "email-variant-b",
          type: "emailNode",
          position: { x: 400, y: 450 },
          data: {
            label: "Variant B: Pain Point",
            variantId: "B",
            subject: "The feast-or-famine cycle",
            preview: pipelineAEmail2.substring(0, 100) + "...",
            fullBody: pipelineAEmail2,
            status: "active"
          }
        },
        {
          id: "email-variant-c",
          type: "emailNode",
          position: { x: 600, y: 450 },
          data: {
            label: "Variant C: Direct Value",
            variantId: "C",
            subject: "Quick thought",
            preview: pipelineAEmail3.substring(0, 100) + "...",
            fullBody: pipelineAEmail3,
            status: "active"
          }
        },
        {
          id: "wait-5-days-a",
          type: "waitNode",
          position: { x: 400, y: 550 },
          data: { label: "Wait 5 Days", delay: 5, unit: "days" }
        },
        {
          id: "engagement-check-a",
          type: "conditionNode",
          position: { x: 400, y: 650 },
          data: {
            label: "Engaged?",
            conditionType: "engagement",
            conditions: [
              { field: "replied", operator: "eq", value: true },
              { field: "clicked", operator: "eq", value: true },
              { field: "booked_call", operator: "eq", value: true }
            ],
            matchMode: "any"
          }
        },
        {
          id: "move-to-inbound-a",
          type: "actionNode",
          position: { x: 200, y: 750 },
          data: {
            label: "→ Inbound Journey",
            actionType: "enroll_journey",
            config: { journeyId: WELCOME_JOURNEY_ID, addTags: ["converted-outbound", "pipeline-a"] }
          }
        },
        {
          id: "exit-cold-a",
          type: "exitNode",
          position: { x: 600, y: 750 },
          data: { label: "Exit (No Engagement)", exitReason: "no_engagement", storeForReactivation: true }
        }
      ],

      edges: [
        { id: "e1a", source: "prospect-entry-a", target: "verify-email-a" },
        { id: "e2a", source: "verify-email-a", target: "throttle-check-a" },
        { id: "e3a", source: "throttle-check-a", target: "random-split-a", sourceHandle: "yes" },
        { id: "e3a-queue", source: "throttle-check-a", target: "queue-for-tomorrow-a", sourceHandle: "no" },
        { id: "e3a-requeue", source: "queue-for-tomorrow-a", target: "throttle-check-a" },
        { id: "e4a-A", source: "random-split-a", target: "email-variant-a", sourceHandle: "A" },
        { id: "e4a-B", source: "random-split-a", target: "email-variant-b", sourceHandle: "B" },
        { id: "e4a-C", source: "random-split-a", target: "email-variant-c", sourceHandle: "C" },
        { id: "e5a-A", source: "email-variant-a", target: "wait-5-days-a" },
        { id: "e5a-B", source: "email-variant-b", target: "wait-5-days-a" },
        { id: "e5a-C", source: "email-variant-c", target: "wait-5-days-a" },
        { id: "e6a", source: "wait-5-days-a", target: "engagement-check-a" },
        { id: "e7a", source: "engagement-check-a", target: "move-to-inbound-a", sourceHandle: "yes" },
        { id: "e8a", source: "engagement-check-a", target: "exit-cold-a", sourceHandle: "no" }
      ],

      prospects: existingDataA.prospects || [],

      stats: {
        totalProspects: existingDataA.stats?.totalProspects || 0,
        activeProspects: existingDataA.stats?.activeProspects || 0,
        completedProspects: existingDataA.stats?.completedProspects || 0,
        emailsSent: existingDataA.stats?.emailsSent || 0,
        conversions: existingDataA.stats?.conversions || 0,
        variantStats: {
          A: { sent: 0, opened: 0, clicked: 0, replied: 0 },
          B: { sent: 0, opened: 0, clicked: 0, replied: 0 },
          C: { sent: 0, opened: 0, clicked: 0, replied: 0 }
        },
        deliverability: {
          verified: 0,
          bounced: 0,
          invalid: 0
        },
        nodeCount: 13,
        emailCount: 3
      },

      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!existingJourneyA.exists) {
      journeyAData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await journeyARef.set(journeyAData, { merge: true });
    results.pipelineA = { id: PIPELINE_A_JOURNEY_ID, created: !existingJourneyA.exists, updated: existingJourneyA.exists };
    console.log(`✅ Pipeline A journey created/updated: ${PIPELINE_A_JOURNEY_ID}`);

    // ========================================
    // CREATE PIPELINE B JOURNEY
    // A/B/C Test: Random initial email, follow-up only on engagement
    // ========================================
    const journeyBRef = db.collection("journeys").doc(PIPELINE_B_JOURNEY_ID);
    const existingJourneyB = await journeyBRef.get();
    const existingDataB = existingJourneyB.exists ? existingJourneyB.data() : {};

    const journeyBData = {
      id: PIPELINE_B_JOURNEY_ID,
      title: "Outbound - Pipeline B (Digital-First)",
      description: "Cold outreach for tech companies, digital agencies, non-SaaS startups. A/B/C test with random initial email, follow-up only on engagement.",
      status: "active",
      pipeline: "B",

      // V2 Config: A/B/C Testing with throttle
      config: {
        version: "2.0",
        testMode: "abc_split",
        throttle: {
          maxPerDay: 10,
          requireVerification: true
        },
        followUpMode: "engagement_only",
        conversionAction: "enroll_inbound"
      },

      _sync: {
        source: "script",
        scriptVersion: "2.0.0",
        lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        syncEndpoint: "seedOutboundJourneys"
      },

      // Email variants for A/B/C testing
      emailVariants: {
        A: {
          id: "variant-a",
          subject: "Quick question about your GTM",  // Failback
          subjectWithMerge: "{{company}}'s GTM infrastructure",
          body: pipelineBEmail1,
          label: "GTM Infrastructure"
        },
        B: {
          id: "variant-b",
          subject: "12 hours/week (the hidden cost)",
          subjectWithMerge: "12 hours/week (the hidden cost)",
          body: pipelineBEmail2,
          label: "Time/Data Hook"
        },
        C: {
          id: "variant-c",
          subject: "Quick question",  // Failback
          subjectWithMerge: "Quick question for {{company}}",
          body: pipelineBEmail3,
          label: "Direct/Breakup"
        }
      },

      nodes: [
        {
          id: "prospect-entry-b",
          type: "prospectNode",
          position: { x: 400, y: 50 },
          data: {
            label: "Pipeline B Prospects",
            count: existingDataB.nodes?.[0]?.data?.count || 0,
            segment: "pipeline_b",
            source: "discovery",
            tags: ["outbound", "pipeline-b", "digital-first"],
            prospects: existingDataB.nodes?.[0]?.data?.prospects || []
          }
        },
        {
          id: "verify-email-b",
          type: "actionNode",
          position: { x: 400, y: 150 },
          data: {
            label: "Verify Email",
            actionType: "verify_email",
            config: { skipInvalid: true, logBounces: true }
          }
        },
        {
          id: "throttle-check-b",
          type: "conditionNode",
          position: { x: 400, y: 250 },
          data: {
            label: "Under Daily Limit?",
            conditionType: "throttle",
            conditions: [{ field: "dailySendCount", operator: "lt", value: 10 }]
          }
        },
        {
          id: "queue-for-tomorrow-b",
          type: "waitNode",
          position: { x: 600, y: 250 },
          data: { label: "Queue for Tomorrow", delay: 1, unit: "days" }
        },
        {
          id: "random-split-b",
          type: "splitNode",
          position: { x: 400, y: 350 },
          data: {
            label: "A/B/C Split",
            splitType: "random",
            branches: ["A", "B", "C"],
            weights: [33, 33, 34]
          }
        },
        {
          id: "email-variant-a-b",
          type: "emailNode",
          position: { x: 200, y: 450 },
          data: {
            label: "Variant A: GTM Infrastructure",
            variantId: "A",
            subject: "Quick question about your GTM",
            preview: pipelineBEmail1.substring(0, 100) + "...",
            fullBody: pipelineBEmail1,
            status: "active"
          }
        },
        {
          id: "email-variant-b-b",
          type: "emailNode",
          position: { x: 400, y: 450 },
          data: {
            label: "Variant B: Time/Data Hook",
            variantId: "B",
            subject: "12 hours/week (the hidden cost)",
            preview: pipelineBEmail2.substring(0, 100) + "...",
            fullBody: pipelineBEmail2,
            status: "active"
          }
        },
        {
          id: "email-variant-c-b",
          type: "emailNode",
          position: { x: 600, y: 450 },
          data: {
            label: "Variant C: Direct/Breakup",
            variantId: "C",
            subject: "Quick question",
            preview: pipelineBEmail3.substring(0, 100) + "...",
            fullBody: pipelineBEmail3,
            status: "active"
          }
        },
        {
          id: "wait-4-days-b",
          type: "waitNode",
          position: { x: 400, y: 550 },
          data: { label: "Wait 4 Days", delay: 4, unit: "days" }
        },
        {
          id: "engagement-check-b",
          type: "conditionNode",
          position: { x: 400, y: 650 },
          data: {
            label: "Engaged?",
            conditionType: "engagement",
            conditions: [
              { field: "replied", operator: "eq", value: true },
              { field: "clicked", operator: "eq", value: true },
              { field: "booked_call", operator: "eq", value: true }
            ],
            matchMode: "any"
          }
        },
        {
          id: "move-to-inbound-b",
          type: "actionNode",
          position: { x: 200, y: 750 },
          data: {
            label: "→ Inbound Journey",
            actionType: "enroll_journey",
            config: { journeyId: WELCOME_JOURNEY_ID, addTags: ["converted-outbound", "pipeline-b"] }
          }
        },
        {
          id: "exit-cold-b",
          type: "exitNode",
          position: { x: 600, y: 750 },
          data: { label: "Exit (No Engagement)", exitReason: "no_engagement", storeForReactivation: true }
        }
      ],

      edges: [
        { id: "e1b", source: "prospect-entry-b", target: "verify-email-b" },
        { id: "e2b", source: "verify-email-b", target: "throttle-check-b" },
        { id: "e3b", source: "throttle-check-b", target: "random-split-b", sourceHandle: "yes" },
        { id: "e3b-queue", source: "throttle-check-b", target: "queue-for-tomorrow-b", sourceHandle: "no" },
        { id: "e3b-requeue", source: "queue-for-tomorrow-b", target: "throttle-check-b" },
        { id: "e4b-A", source: "random-split-b", target: "email-variant-a-b", sourceHandle: "A" },
        { id: "e4b-B", source: "random-split-b", target: "email-variant-b-b", sourceHandle: "B" },
        { id: "e4b-C", source: "random-split-b", target: "email-variant-c-b", sourceHandle: "C" },
        { id: "e5b-A", source: "email-variant-a-b", target: "wait-4-days-b" },
        { id: "e5b-B", source: "email-variant-b-b", target: "wait-4-days-b" },
        { id: "e5b-C", source: "email-variant-c-b", target: "wait-4-days-b" },
        { id: "e6b", source: "wait-4-days-b", target: "engagement-check-b" },
        { id: "e7b", source: "engagement-check-b", target: "move-to-inbound-b", sourceHandle: "yes" },
        { id: "e8b", source: "engagement-check-b", target: "exit-cold-b", sourceHandle: "no" }
      ],

      prospects: existingDataB.prospects || [],

      stats: {
        totalProspects: existingDataB.stats?.totalProspects || 0,
        activeProspects: existingDataB.stats?.activeProspects || 0,
        completedProspects: existingDataB.stats?.completedProspects || 0,
        emailsSent: existingDataB.stats?.emailsSent || 0,
        conversions: existingDataB.stats?.conversions || 0,
        variantStats: {
          A: { sent: 0, opened: 0, clicked: 0, replied: 0 },
          B: { sent: 0, opened: 0, clicked: 0, replied: 0 },
          C: { sent: 0, opened: 0, clicked: 0, replied: 0 }
        },
        deliverability: {
          verified: 0,
          bounced: 0,
          invalid: 0
        },
        nodeCount: 13,
        emailCount: 3
      },

      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!existingJourneyB.exists) {
      journeyBData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await journeyBRef.set(journeyBData, { merge: true });
    results.pipelineB = { id: PIPELINE_B_JOURNEY_ID, created: !existingJourneyB.exists, updated: existingJourneyB.exists };
    console.log(`✅ Pipeline B journey created/updated: ${PIPELINE_B_JOURNEY_ID}`);

    response.json({
      success: true,
      message: "Outbound journeys V2 created/updated successfully",
      version: "2.0",
      features: [
        "A/B/C random initial email selection",
        "Merge tag failbacks (works even if tokens fail)",
        "Email verification before send",
        "10/day throttle with deliverability monitoring",
        "Follow-up only on engagement (click/reply/book)"
      ],
      results,
      journeys: {
        pipelineA: {
          id: PIPELINE_A_JOURNEY_ID,
          title: journeyAData.title,
          emailVariants: 3,
          testMode: "abc_split",
          throttle: "10/day",
          conversionAction: `Enroll in ${WELCOME_JOURNEY_ID}`
        },
        pipelineB: {
          id: PIPELINE_B_JOURNEY_ID,
          title: journeyBData.title,
          emailVariants: 3,
          testMode: "abc_split",
          throttle: "10/day",
          conversionAction: `Enroll in ${WELCOME_JOURNEY_ID}`
        }
      },
      emailSubjects: {
        pipelineA: {
          A: "Quick question (failback) / Quick question about {{company}}",
          B: "The feast-or-famine cycle",
          C: "Quick thought (failback) / Quick thought for {{company}}"
        },
        pipelineB: {
          A: "Quick question about your GTM (failback) / {{company}}'s GTM infrastructure",
          B: "12 hours/week (the hidden cost)",
          C: "Quick question (failback) / Quick question for {{company}}"
        }
      }
    });

  } catch (error) {
    console.error("❌ seedOutboundJourneys error:", error);
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

  // Auth check (SSO + legacy token fallback)
  const authResult = await verifyAdminAuth(request);
  if (!authResult.success) {
    response.status(401).json({ error: authResult.error || "Unauthorized" });
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

/**
 * Get Collection Stats - Admin function to view Firestore collection sizes
 * Call via: GET /getCollectionStats with admin auth header
 * Returns document counts and cleanup candidates for each collection
 */
exports.getCollectionStats = functions
  .runWith({ memory: "256MB", timeoutSeconds: 30 })
  .https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Auth check
  // Auth check (SSO + legacy cleanup token fallback)
  const authResult = await verifyAdminAuth(request, { allowCleanupToken: true });
  if (!authResult.success) {
    response.status(401).json({ error: authResult.error || "Unauthorized" });
    return;
  }

  try {
    const stats = {
      timestamp: new Date().toISOString(),
      collections: {}
    };

    // Get counts sequentially with limits to avoid timeout
    // Small collections first
    const articlesSnap = await db.collection("articles").select().limit(1000).get();
    const shortlinksSnap = await db.collection("shortlinks").select().limit(1000).get();
    const triggerRulesSnap = await db.collection("triggerRules").select().limit(1000).get();
    const capsulesSnap = await db.collection("capsules").select().limit(1000).get();
    const journeysSnap = await db.collection("journeys").select().limit(1000).get();
    const leadsSnap = await db.collection("leads").select().limit(1000).get();
    // Contacts last - likely largest
    const contactsSnap = await db.collection("contacts").select().limit(1000).get();

    stats.collections = {
      capsules: { total: capsulesSnap.size >= 1000 ? "1000+" : capsulesSnap.size, cleanupCandidates: "preview", criteria: ">90d, <3 views" },
      journeys: { total: journeysSnap.size >= 1000 ? "1000+" : journeysSnap.size, cleanupCandidates: "preview", criteria: ">90d, inactive" },
      contacts: { total: contactsSnap.size >= 1000 ? "1000+" : contactsSnap.size, cleanupCandidates: "preview", criteria: ">180d, test" },
      leads: { total: leadsSnap.size >= 1000 ? "1000+" : leadsSnap.size, cleanupCandidates: 0, criteria: "N/A" },
      articles: { total: articlesSnap.size >= 1000 ? "1000+" : articlesSnap.size, cleanupCandidates: 0, criteria: "N/A" },
      shortlinks: { total: shortlinksSnap.size >= 1000 ? "1000+" : shortlinksSnap.size, cleanupCandidates: 0, criteria: "N/A" },
      triggerRules: { total: triggerRulesSnap.size >= 1000 ? "1000+" : triggerRulesSnap.size, cleanupCandidates: 0, criteria: "N/A" }
    };

    response.json({ success: true, stats });

  } catch (error) {
    console.error("❌ getCollectionStats error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Enhanced Cleanup with Dry Run - Preview what would be cleaned before executing
 * Call via: POST /cleanupWithPreview with admin auth header
 * Query params:
 *   - dryRun: "true" to preview without deleting (default)
 *   - includeContacts: "true" to also clean test contacts
 */
exports.cleanupWithPreview = functions
  .runWith({ memory: "256MB", timeoutSeconds: 60 })
  .https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Auth check
  // Auth check (SSO + legacy cleanup token fallback)
  const authResult = await verifyAdminAuth(request, { allowCleanupToken: true });
  if (!authResult.success) {
    response.status(401).json({ error: authResult.error || "Unauthorized" });
    return;
  }

  const dryRun = request.query.dryRun !== "false";
  const includeContacts = request.query.includeContacts === "true";

  try {
    const now = new Date();
    const cutoff90 = new Date();
    cutoff90.setDate(cutoff90.getDate() - 90);
    const cutoff180 = new Date();
    cutoff180.setDate(cutoff180.getDate() - 180);

    const results = {
      dryRun,
      timestamp: now.toISOString(),
      cutoff90: cutoff90.toISOString(),
      cutoff180: cutoff180.toISOString(),
      capsules: { deleted: [], kept: 0, samples: [] },
      journeys: { deleted: [], kept: 0 },
      contacts: { deleted: [], kept: 0 }
    };

    // Process capsules - order by createdAt to find oldest first
    const capsulesSnapshot = await db.collection("capsules")
      .select("title", "createdAt", "viewCount", "expiresAt", "version")
      .orderBy("createdAt", "asc")
      .limit(100)
      .get();
    for (const doc of capsulesSnapshot.docs) {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(0);
      const viewCount = data.viewCount || 0;
      const expiresAt = data.expiresAt?.toDate?.() || null;

      // Collect first 5 samples for debugging
      if (results.capsules.samples.length < 5) {
        results.capsules.samples.push({
          id: doc.id,
          title: data.title || "Untitled",
          createdAt: createdAt.toISOString(),
          viewCount,
          expiresAt: expiresAt?.toISOString() || null,
          olderThan90: createdAt < cutoff90
        });
      }

      // Cleanup criteria:
      // 1. Expired capsules
      // 2. Old (>90 days) with low views (<3)
      // 3. Auto-saved capsules with 0 views (duplicates from runaway auto-save)
      const isExpired = expiresAt && expiresAt < now;
      const isOldLowViews = createdAt < cutoff90 && viewCount < 3;
      const isAutoSavedNoViews = (data.title || "").includes("(Auto-saved)") && viewCount === 0;

      if (isExpired || isOldLowViews || isAutoSavedNoViews) {
        results.capsules.deleted.push({
          id: doc.id,
          title: data.title || "Untitled",
          createdAt: createdAt.toISOString(),
          viewCount,
          reason: isExpired ? "expired" : isOldLowViews ? "old+lowViews" : "autoSaved+noViews"
        });

        if (!dryRun) {
          // Delete subcollections first
          if (data.version !== 2) {
            const nodesSnap = await db.collection(`capsules/${doc.id}/nodes`).get();
            const edgesSnap = await db.collection(`capsules/${doc.id}/edges`).get();
            const batch = db.batch();
            nodesSnap.docs.forEach(d => batch.delete(d.ref));
            edgesSnap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
          }
          await doc.ref.delete();
        }
      } else {
        results.capsules.kept++;
      }
    }

    // Process journeys - order by updatedAt to find oldest first
    const journeysSnapshot = await db.collection("journeys")
      .select("name", "status", "updatedAt")
      .orderBy("updatedAt", "asc")
      .limit(100)
      .get();
    for (const doc of journeysSnapshot.docs) {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toDate?.() || new Date(0);
      const status = data.status || "draft";

      if (updatedAt < cutoff90 && status !== "active") {
        results.journeys.deleted.push({
          id: doc.id,
          name: data.name || "Unnamed",
          status,
          updatedAt: updatedAt.toISOString(),
          reason: "old+inactive"
        });

        if (!dryRun) {
          await doc.ref.delete();
        }
      } else {
        results.journeys.kept++;
      }
    }

    // Process contacts (only if explicitly requested) - order by createdAt to find oldest first
    if (includeContacts) {
      const contactsSnapshot = await db.collection("contacts")
        .select("email", "source", "createdAt", "journeys")
        .orderBy("createdAt", "asc")
        .limit(100)
        .get();
      for (const doc of contactsSnapshot.docs) {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date(0);
        const hasJourneys = (data.journeys?.active?.length || 0) > 0 || (data.journeys?.completed?.length || 0) > 0;
        const source = data.source || "unknown";

        if (createdAt < cutoff180 && !hasJourneys && source === "test") {
          results.contacts.deleted.push({
            id: doc.id,
            email: data.email,
            source,
            createdAt: createdAt.toISOString(),
            reason: "old+test+noJourneys"
          });

          if (!dryRun) {
            await doc.ref.delete();
          }
        } else {
          results.contacts.kept++;
        }
      }
    }

    response.json({
      success: true,
      dryRun,
      summary: {
        capsules: { deleted: results.capsules.deleted.length, kept: results.capsules.kept },
        journeys: { deleted: results.journeys.deleted.length, kept: results.journeys.kept },
        contacts: includeContacts ? { deleted: results.contacts.deleted.length, kept: results.contacts.kept } : "skipped"
      },
      details: results
    });

  } catch (error) {
    console.error("❌ cleanupWithPreview error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Cleanup capsules by title pattern - for removing auto-saved test capsules
 * Call via: POST /cleanupByTitlePattern with admin auth header
 * Query params:
 *   - dryRun: "true" to preview without deleting (default: true)
 *   - pattern: comma-separated keywords to match in title (default: "travel memories,uk travel,travel memory")
 *   - maxViewCount: only delete if viewCount <= this value (default: 0)
 */
exports.cleanupByTitlePattern = functions
  .runWith({ memory: "512MB", timeoutSeconds: 120 })
  .https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Auth check
  // Auth check (SSO + legacy cleanup token fallback)
  const authResult = await verifyAdminAuth(request, { allowCleanupToken: true });
  if (!authResult.success) {
    response.status(401).json({ error: authResult.error || "Unauthorized" });
    return;
  }

  const dryRun = request.query.dryRun !== "false";
  const patternParam = request.query.pattern || "travel memories,uk travel,travel memory";
  const patterns = patternParam.toLowerCase().split(",").map(p => p.trim());
  const maxViewCount = parseInt(request.query.maxViewCount || "0", 10);

  try {
    const results = {
      dryRun,
      patterns,
      maxViewCount,
      timestamp: new Date().toISOString(),
      toDelete: [],
      toKeep: [],
      deleted: 0,
      errors: []
    };

    // Get all capsules and filter by title pattern
    const capsulesSnapshot = await db.collection("capsules")
      .select("title", "createdAt", "viewCount", "version")
      .limit(500)
      .get();

    for (const doc of capsulesSnapshot.docs) {
      const data = doc.data();
      const title = (data.title || "").toLowerCase();
      const viewCount = data.viewCount || 0;
      const createdAt = data.createdAt?.toDate?.() || new Date(0);

      // Check if title matches any pattern
      const matchedPattern = patterns.find(p => title.includes(p));

      if (matchedPattern && viewCount <= maxViewCount) {
        results.toDelete.push({
          id: doc.id,
          title: data.title,
          viewCount,
          createdAt: createdAt.toISOString(),
          matchedPattern
        });

        if (!dryRun) {
          try {
            // Delete subcollections first if not v2
            if (data.version !== 2) {
              const nodesSnap = await db.collection(`capsules/${doc.id}/nodes`).limit(100).get();
              const edgesSnap = await db.collection(`capsules/${doc.id}/edges`).limit(100).get();
              const batch = db.batch();
              nodesSnap.docs.forEach(d => batch.delete(d.ref));
              edgesSnap.docs.forEach(d => batch.delete(d.ref));
              await batch.commit();
            }
            await doc.ref.delete();
            results.deleted++;
          } catch (deleteErr) {
            results.errors.push({ id: doc.id, error: deleteErr.message });
          }
        }
      } else {
        results.toKeep.push({
          id: doc.id,
          title: data.title,
          viewCount,
          createdAt: createdAt.toISOString()
        });
      }
    }

    response.json({
      success: true,
      dryRun,
      summary: {
        total: capsulesSnapshot.size,
        toDelete: results.toDelete.length,
        toKeep: results.toKeep.length,
        deleted: dryRun ? 0 : results.deleted,
        errors: results.errors.length
      },
      details: {
        toDelete: results.toDelete,
        toKeep: results.toKeep.slice(0, 10), // Only show first 10 kept
        errors: results.errors
      }
    });

  } catch (error) {
    console.error("❌ cleanupByTitlePattern error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Admin: Add client email to whitelist
 * Usage: curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/addClientEmail" \
 *        -H "Content-Type: application/json" \
 *        -H "x-admin-token: YOUR_ADMIN_TOKEN" \
 *        -d '{"email": "user@example.com"}'
 */
exports.addClientEmail = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    // Auth check (SSO + legacy token fallback)
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      response.status(401).json({ error: authResult.error || "Unauthorized" });
      return;
    }

    const { email } = request.body;
    if (!email) {
      response.status(400).json({ error: "Email is required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const clientRef = db.doc("config/client_whitelist");
    const clientDoc = await clientRef.get();
    const currentEmails = clientDoc.exists ? (clientDoc.data().emails || []) : [];

    if (currentEmails.includes(normalizedEmail)) {
      response.json({
        success: true,
        message: `${normalizedEmail} is already in the whitelist`,
        totalClients: currentEmails.length
      });
      return;
    }

    await clientRef.set({
      emails: [...currentEmails, normalizedEmail],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: "addClientEmail_function"
    }, { merge: true });

    console.log(`✅ Added ${normalizedEmail} to client whitelist`);

    response.json({
      success: true,
      message: `Added ${normalizedEmail} to client whitelist`,
      totalClients: currentEmails.length + 1
    });

  } catch (error) {
    console.error("❌ addClientEmail error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Admin: Add admin email to whitelist (for Firebase Auth SSO)
 * Usage: curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/addAdminEmail" \
 *        -H "Content-Type: application/json" \
 *        -H "x-admin-token: YOUR_ADMIN_TOKEN" \
 *        -d '{"email": "admin@example.com"}'
 */
exports.addAdminEmail = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    // Auth check (legacy token only - can't use SSO to add yourself)
    const adminToken = request.headers["x-admin-token"];
    const expectedAdminToken = functions.config().admin?.token;

    if (!adminToken || !expectedAdminToken || adminToken !== expectedAdminToken) {
      response.status(401).json({ error: "Unauthorized - admin token required" });
      return;
    }

    const { email } = request.body;
    if (!email) {
      response.status(400).json({ error: "Email is required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminRef = db.doc("config/admin_whitelist");
    const adminDoc = await adminRef.get();
    const currentEmails = adminDoc.exists ? (adminDoc.data().emails || []) : [];

    if (currentEmails.map(e => e.toLowerCase()).includes(normalizedEmail)) {
      response.json({
        success: true,
        message: `${normalizedEmail} is already in the admin whitelist`,
        totalAdmins: currentEmails.length
      });
      return;
    }

    await adminRef.set({
      emails: [...currentEmails, normalizedEmail],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: "addAdminEmail_function"
    }, { merge: true });

    console.log(`✅ Added ${normalizedEmail} to admin whitelist`);

    response.json({
      success: true,
      message: `Added ${normalizedEmail} to admin whitelist`,
      totalAdmins: currentEmails.length + 1
    });

  } catch (error) {
    console.error("❌ addAdminEmail error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Admin: Bulk import contacts for outbound campaigns
 * Usage: curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/bulkImportContacts" \
 *        -H "Content-Type: application/json" \
 *        -H "x-admin-token: YOUR_ADMIN_TOKEN" \
 *        -d '{"contacts": [{"email": "a@b.com", "name": "Test", "company": "Acme"}], "source": "outbound", "tags": ["outbound-campaign"]}'
 */
exports.bulkImportContacts = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    // Auth check (SSO + legacy token fallback)
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      response.status(401).json({ error: authResult.error || "Unauthorized" });
      return;
    }

    const { contacts, source = "outbound", tags = [], enrollJourney = null, dryRun = false } = request.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      response.status(400).json({ error: "contacts array is required and must not be empty" });
      return;
    }

    if (contacts.length > 100) {
      response.status(400).json({ error: "Maximum 100 contacts per request" });
      return;
    }

    const results = {
      total: contacts.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      contacts: []
    };

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();

    for (const contact of contacts) {
      const { email, name, company, jobTitle, linkedinUrl, phone, customFields } = contact;

      if (!email) {
        results.skipped++;
        results.errors.push({ email: null, error: "Missing email" });
        continue;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const contactId = generateContactId(normalizedEmail);
      const contactRef = db.collection("contacts").doc(contactId);

      try {
        const existing = await contactRef.get();
        const nameParts = (name || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const contactData = {
          id: contactId,
          email: normalizedEmail,
          name: (name || "").trim(),
          firstName,
          lastName,
          company: (company || "").trim(),
          jobTitle: (jobTitle || "").trim(),
          linkedinUrl: (linkedinUrl || "").trim(),
          phone: (phone || "").trim(),
          type: "lead",
          stage: "new",
          tags: [...new Set([...(existing.exists ? existing.data().tags || [] : []), ...tags])],
          score: existing.exists ? existing.data().score || 0 : 0,
          scoreBreakdown: existing.exists ? existing.data().scoreBreakdown : { engagement: 0, behavior: 0, profile: 0, recency: 0 },
          source: {
            original: source,
            medium: "outbound",
            campaign: tags[0] || "bulk-import",
            referrer: "",
            landingPage: ""
          },
          engagement: existing.exists ? existing.data().engagement : {
            emailsSent: 0,
            emailsOpened: 0,
            emailsClicked: 0,
            toolsUsed: [],
            assessmentScore: null,
            pageViews: 0
          },
          journeys: existing.exists ? existing.data().journeys : { active: [], completed: [], history: [] },
          externalIds: existing.exists ? existing.data().externalIds : { airtableId: null, hubspotId: null, stripeId: null },
          syncStatus: existing.exists ? existing.data().syncStatus : { airtable: "not_synced", airtableLastSync: null },
          preferences: existing.exists ? existing.data().preferences : {
            emailOptIn: true,
            emailFrequency: "weekly",
            doNotContact: false
          },
          notes: existing.exists ? existing.data().notes : "",
          customFields: { ...(existing.exists ? existing.data().customFields : {}), ...(customFields || {}) },
          metadata: { ...(existing.exists ? existing.data().metadata : {}), importedVia: "bulkImportContacts" },
          status: "active",
          updatedAt: now,
          updatedBy: "bulkImportContacts"
        };

        if (!existing.exists) {
          contactData.createdAt = now;
          contactData.createdBy = "bulkImportContacts";
        }

        if (!dryRun) {
          batch.set(contactRef, contactData, { merge: true });
        }

        if (existing.exists) {
          results.updated++;
        } else {
          results.created++;
        }

        results.contacts.push({
          email: normalizedEmail,
          contactId,
          status: existing.exists ? "updated" : "created"
        });

      } catch (contactError) {
        results.skipped++;
        results.errors.push({ email, error: contactError.message });
      }
    }

    if (!dryRun && (results.created + results.updated) > 0) {
      await batch.commit();
    }

    console.log(`✅ Bulk import: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped (dryRun: ${dryRun})`);

    response.json({
      success: true,
      dryRun,
      results
    });

  } catch (error) {
    console.error("❌ bulkImportContacts error:", error);
    response.status(500).json({ error: error.message });
  }
});

// ============================================================
// Apollo.io Integration for Prospect Enrichment
// ============================================================

/**
 * Search Apollo.io for prospects matching criteria
 * Uses Apollo's People Search API (uses credits)
 *
 * Usage: curl -X POST ".../apolloSearch" -d '{"titles": ["CEO", "Founder"], "industries": ["marketing"], "limit": 50}'
 */
exports.apolloSearch = functions
  .runWith({ memory: '512MB', timeoutSeconds: 300 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    // Auth check
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return response.status(401).json({ error: authResult.error || "Unauthorized" });
    }

    try {
      const {
        titles = ["CEO", "Founder", "Owner", "President"],
        industries = ["marketing and advertising", "professional training & coaching", "design"],
        employeeRanges = ["1-10", "11-50", "51-100"],
        locations = ["United States"],
        excludePatterns = ["private equity", "venture capital", "VC", "PE"],
        limit = 25,
        dryRun = false
      } = request.body;

      const apolloApiKey = functions.config().apollo?.api_key;
      if (!apolloApiKey) {
        return response.status(400).json({
          error: "Apollo API key not configured",
          hint: "Set via: firebase functions:config:set apollo.api_key=YOUR_KEY"
        });
      }

      // Apollo People Search API
      const searchBody = {
        person_titles: titles,
        person_locations: locations,
        organization_industry_tag_ids: industries,
        organization_num_employees_ranges: employeeRanges,
        per_page: Math.min(limit, 100),
        page: 1
      };

      console.log(`🔍 Apollo search: ${JSON.stringify(searchBody)}`);

      const apolloRes = await fetch("https://api.apollo.io/v1/mixed_people/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "x-api-key": apolloApiKey
        },
        body: JSON.stringify(searchBody)
      });

      const apolloData = await apolloRes.json();

      if (!apolloRes.ok) {
        console.error("❌ Apollo search error:", apolloData);
        return response.status(apolloRes.status).json({
          error: "Apollo API error",
          details: apolloData
        });
      }

      const people = apolloData.people || [];
      console.log(`📋 Apollo returned ${people.length} prospects`);

      // Filter out PE/VC backed companies
      const filteredPeople = people.filter(person => {
        const org = person.organization || {};
        const keywords = [
          org.name,
          org.industry,
          org.keywords?.join(' '),
          person.headline
        ].join(' ').toLowerCase();

        return !excludePatterns.some(pattern =>
          keywords.includes(pattern.toLowerCase())
        );
      });

      console.log(`✅ ${filteredPeople.length} prospects after PE/VC filtering`);

      const results = {
        found: people.length,
        filtered: filteredPeople.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };

      // Store as contacts if not dry run
      if (!dryRun) {
        for (const person of filteredPeople) {
          try {
            if (!person.email) {
              results.skipped++;
              continue;
            }

            // Check for existing contact
            const existing = await db.collection('contacts')
              .where('email', '==', person.email)
              .limit(1)
              .get();

            const org = person.organization || {};
            const contactData = {
              email: person.email,
              firstName: person.first_name || '',
              lastName: person.last_name || '',
              name: person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim(),
              company: org.name || '',
              website: org.website_url || org.primary_domain ? `https://${org.primary_domain}` : null,
              position: person.title || '',
              phone: person.phone_number || null,
              linkedinUrl: person.linkedin_url || null,
              source: 'apollo_search',
              tags: ['apollo-search', 'pipeline-B', 'digital-first'],
              pipelineAssignment: {
                primaryPipeline: 'B',
                pipelineBStatus: 'PENDING'
              },
              enrichment: {
                apollo: {
                  id: person.id,
                  enrichedAt: new Date().toISOString(),
                  headline: person.headline,
                  organization: {
                    id: org.id,
                    name: org.name,
                    industry: org.industry,
                    employeeCount: org.estimated_num_employees,
                    domain: org.primary_domain,
                    linkedinUrl: org.linkedin_url
                  }
                }
              },
              metadata: {
                apolloSearchCriteria: { titles, industries, locations }
              },
              status: 'active',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedBy: 'apolloSearch'
            };

            if (existing.empty) {
              contactData.createdAt = admin.firestore.FieldValue.serverTimestamp();
              contactData.createdBy = 'apolloSearch';
              await db.collection('contacts').add(contactData);
              results.created++;
            } else {
              await existing.docs[0].ref.update(contactData);
              results.updated++;
            }
          } catch (err) {
            results.errors.push({
              email: person.email,
              error: err.message
            });
          }
        }
      } else {
        results.created = filteredPeople.filter(p => p.email).length;
      }

      // Track API usage
      const today = new Date().toISOString().split('T')[0];
      await db.collection('api_usage').doc(today).set({
        apolloSearchCredits: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      response.json({
        success: true,
        dryRun,
        pagination: apolloData.pagination,
        ...results
      });

    } catch (error) {
      console.error("❌ apolloSearch error:", error);
      response.status(500).json({ error: error.message });
    }
  });

/**
 * Enrich a single contact using Apollo.io People Enrichment API
 * Usage: curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/enrichContact" \
 *        -H "Content-Type: application/json" \
 *        -H "x-admin-token: YOUR_ADMIN_TOKEN" \
 *        -d '{"email": "user@company.com"}'
 */
exports.enrichContact = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    // Auth check (SSO + legacy token fallback)
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      response.status(401).json({ error: authResult.error || "Unauthorized" });
      return;
    }

    const apolloApiKey = functions.config().apollo?.api_key;
    if (!apolloApiKey) {
      response.status(500).json({ error: "Apollo API key not configured" });
      return;
    }

    const { email, firstName, lastName, domain, linkedinUrl, contactId, updateContact = true } = request.body;

    if (!email && !linkedinUrl) {
      response.status(400).json({ error: "Either email or linkedinUrl is required" });
      return;
    }

    // Build Apollo API request
    const apolloParams = new URLSearchParams();
    if (email) apolloParams.append("email", email);
    if (firstName) apolloParams.append("first_name", firstName);
    if (lastName) apolloParams.append("last_name", lastName);
    if (domain) apolloParams.append("domain", domain);
    if (linkedinUrl) apolloParams.append("linkedin_url", linkedinUrl);
    apolloParams.append("reveal_personal_emails", "false");
    apolloParams.append("reveal_phone_number", "true");

    console.log(`🔍 Apollo enrichment request for: ${email || linkedinUrl}`);

    const apolloResponse = await fetch(
      `https://api.apollo.io/api/v1/people/match?${apolloParams.toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apolloApiKey
        }
      }
    );

    const apolloData = await apolloResponse.json();

    if (!apolloResponse.ok) {
      console.error("❌ Apollo API error:", apolloData);
      response.status(apolloResponse.status).json({
        error: "Apollo API error",
        details: apolloData
      });
      return;
    }

    const person = apolloData.person;
    if (!person) {
      response.json({
        success: false,
        message: "No match found in Apollo database",
        input: { email, firstName, lastName, domain, linkedinUrl }
      });
      return;
    }

    // Extract enriched data
    const enrichedData = {
      // Personal info
      firstName: person.first_name,
      lastName: person.last_name,
      name: person.name,
      email: person.email,
      phone: person.phone_numbers?.[0]?.sanitized_number || person.phone_numbers?.[0]?.raw_number || null,
      linkedinUrl: person.linkedin_url,
      title: person.title,
      headline: person.headline,
      photoUrl: person.photo_url,

      // Company info
      company: person.organization?.name,
      companyDomain: person.organization?.primary_domain,
      companyWebsite: person.organization?.website_url,
      companyLinkedin: person.organization?.linkedin_url,
      companySize: person.organization?.estimated_num_employees,
      companyIndustry: person.organization?.industry,
      companyDescription: person.organization?.short_description,
      companyFounded: person.organization?.founded_year,
      companyLocation: person.organization?.city ?
        `${person.organization.city}, ${person.organization.state}, ${person.organization.country}` : null,

      // Professional details
      seniority: person.seniority,
      departments: person.departments,
      functions: person.functions,

      // Location
      city: person.city,
      state: person.state,
      country: person.country,

      // Apollo metadata
      apolloId: person.id,
      apolloEnrichedAt: new Date().toISOString()
    };

    // Update contact in Firestore if requested
    let contactUpdated = false;
    let firestoreContactId = contactId;

    if (updateContact && email) {
      firestoreContactId = firestoreContactId || generateContactId(email);
      const contactRef = db.collection("contacts").doc(firestoreContactId);
      const existingContact = await contactRef.get();

      if (existingContact.exists) {
        await contactRef.update({
          // Only update fields that are empty or explicitly from Apollo
          ...(enrichedData.firstName && !existingContact.data().firstName ? { firstName: enrichedData.firstName } : {}),
          ...(enrichedData.lastName && !existingContact.data().lastName ? { lastName: enrichedData.lastName } : {}),
          ...(enrichedData.name && !existingContact.data().name ? { name: enrichedData.name } : {}),
          ...(enrichedData.phone && !existingContact.data().phone ? { phone: enrichedData.phone } : {}),
          ...(enrichedData.linkedinUrl && !existingContact.data().linkedinUrl ? { linkedinUrl: enrichedData.linkedinUrl } : {}),
          ...(enrichedData.title && !existingContact.data().jobTitle ? { jobTitle: enrichedData.title } : {}),
          ...(enrichedData.company && !existingContact.data().company ? { company: enrichedData.company } : {}),
          ...(enrichedData.photoUrl && !existingContact.data().avatar ? { avatar: enrichedData.photoUrl } : {}),

          // Always update Apollo enrichment metadata
          "enrichment.apollo": {
            ...enrichedData,
            enrichedAt: admin.firestore.FieldValue.serverTimestamp()
          },
          "externalIds.apolloId": enrichedData.apolloId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: "apollo_enrichment"
        });
        contactUpdated = true;
        console.log(`✅ Contact ${firestoreContactId} enriched with Apollo data`);
      }
    }

    response.json({
      success: true,
      enriched: enrichedData,
      contactUpdated,
      contactId: firestoreContactId
    });

  } catch (error) {
    console.error("❌ enrichContact error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Bulk enrich contacts using Apollo.io (up to 10 per request)
 * Usage: curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/bulkEnrichContacts" \
 *        -H "Content-Type: application/json" \
 *        -H "x-admin-token: YOUR_ADMIN_TOKEN" \
 *        -d '{"emails": ["a@b.com", "c@d.com"], "updateContacts": true}'
 */
exports.bulkEnrichContacts = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    // Auth check (SSO + legacy token fallback)
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      response.status(401).json({ error: authResult.error || "Unauthorized" });
      return;
    }

    const apolloApiKey = functions.config().apollo?.api_key;
    if (!apolloApiKey) {
      response.status(500).json({ error: "Apollo API key not configured" });
      return;
    }

    const { emails, updateContacts = true } = request.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      response.status(400).json({ error: "emails array is required and must not be empty" });
      return;
    }

    if (emails.length > 10) {
      response.status(400).json({ error: "Maximum 10 emails per request (Apollo API limit)" });
      return;
    }

    console.log(`🔍 Apollo bulk enrichment for ${emails.length} emails`);

    // Apollo Bulk People Enrichment API
    const apolloResponse = await fetch(
      "https://api.apollo.io/api/v1/people/bulk_match",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apolloApiKey
        },
        body: JSON.stringify({
          details: emails.map(email => ({ email })),
          reveal_personal_emails: false,
          reveal_phone_number: true
        })
      }
    );

    const apolloData = await apolloResponse.json();

    if (!apolloResponse.ok) {
      console.error("❌ Apollo API error:", apolloData);
      response.status(apolloResponse.status).json({
        error: "Apollo API error",
        details: apolloData
      });
      return;
    }

    const results = {
      total: emails.length,
      enriched: 0,
      notFound: 0,
      contactsUpdated: 0,
      details: []
    };

    const matches = apolloData.matches || [];

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const match = matches[i];
      const person = match?.person;

      if (!person) {
        results.notFound++;
        results.details.push({ email, status: "not_found" });
        continue;
      }

      results.enriched++;

      const enrichedData = {
        firstName: person.first_name,
        lastName: person.last_name,
        name: person.name,
        email: person.email,
        phone: person.phone_numbers?.[0]?.sanitized_number || null,
        linkedinUrl: person.linkedin_url,
        title: person.title,
        company: person.organization?.name,
        companyDomain: person.organization?.primary_domain,
        companySize: person.organization?.estimated_num_employees,
        companyIndustry: person.organization?.industry,
        seniority: person.seniority,
        apolloId: person.id
      };

      // Update contact in Firestore
      if (updateContacts) {
        const contactId = generateContactId(email);
        const contactRef = db.collection("contacts").doc(contactId);
        const existingContact = await contactRef.get();

        if (existingContact.exists) {
          await contactRef.update({
            ...(enrichedData.firstName && !existingContact.data().firstName ? { firstName: enrichedData.firstName } : {}),
            ...(enrichedData.lastName && !existingContact.data().lastName ? { lastName: enrichedData.lastName } : {}),
            ...(enrichedData.name && !existingContact.data().name ? { name: enrichedData.name } : {}),
            ...(enrichedData.phone && !existingContact.data().phone ? { phone: enrichedData.phone } : {}),
            ...(enrichedData.linkedinUrl && !existingContact.data().linkedinUrl ? { linkedinUrl: enrichedData.linkedinUrl } : {}),
            ...(enrichedData.title && !existingContact.data().jobTitle ? { jobTitle: enrichedData.title } : {}),
            ...(enrichedData.company && !existingContact.data().company ? { company: enrichedData.company } : {}),
            "enrichment.apollo": enrichedData,
            "externalIds.apolloId": enrichedData.apolloId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: "apollo_bulk_enrichment"
          });
          results.contactsUpdated++;
        }
      }

      results.details.push({ email, status: "enriched", data: enrichedData });
    }

    console.log(`✅ Apollo bulk enrichment: ${results.enriched} enriched, ${results.notFound} not found, ${results.contactsUpdated} contacts updated`);

    response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error("❌ bulkEnrichContacts error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Search Apollo.io for prospects matching criteria
 * Usage: curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/searchProspects" \
 *        -H "Content-Type: application/json" \
 *        -H "x-admin-token: YOUR_ADMIN_TOKEN" \
 *        -d '{"titles": ["VP Marketing", "CMO"], "industries": ["Software"], "employeeCount": "11,50", "limit": 25}'
 */
exports.searchProspects = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    // Auth check (SSO + legacy token fallback)
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      response.status(401).json({ error: authResult.error || "Unauthorized" });
      return;
    }

    const apolloApiKey = functions.config().apollo?.api_key;
    if (!apolloApiKey) {
      response.status(500).json({ error: "Apollo API key not configured" });
      return;
    }

    const {
      titles = [],
      industries = [],
      keywords = [],
      employeeCount = null, // e.g., "11,50" for 11-50 employees
      locations = [],
      seniorities = [], // e.g., ["vp", "c_suite", "director"]
      limit = 25,
      page = 1,
      importToFirestore = false,
      tags = []
    } = request.body;

    console.log(`🔍 Apollo prospect search: titles=${titles.join(",")}, industries=${industries.join(",")}`);

    // Build Apollo search request
    const searchParams = {
      page,
      per_page: Math.min(limit, 100),
      person_titles: titles,
      organization_industry_tag_ids: industries,
      q_keywords: keywords.join(" "),
      person_seniorities: seniorities
    };

    // Add employee count range if specified
    if (employeeCount) {
      const [min, max] = employeeCount.split(",").map(n => parseInt(n.trim()));
      searchParams.organization_num_employees_ranges = [`${min},${max}`];
    }

    // Add locations
    if (locations.length > 0) {
      searchParams.person_locations = locations;
    }

    const apolloResponse = await fetch(
      "https://api.apollo.io/api/v1/mixed_people/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apolloApiKey
        },
        body: JSON.stringify(searchParams)
      }
    );

    const apolloData = await apolloResponse.json();

    if (!apolloResponse.ok) {
      console.error("❌ Apollo API error:", apolloData);
      response.status(apolloResponse.status).json({
        error: "Apollo API error",
        details: apolloData
      });
      return;
    }

    const people = apolloData.people || [];
    const pagination = apolloData.pagination || {};

    const results = {
      total: pagination.total_entries || people.length,
      page: pagination.page || page,
      perPage: pagination.per_page || limit,
      totalPages: pagination.total_pages || 1,
      returned: people.length,
      imported: 0,
      prospects: []
    };

    for (const person of people) {
      const prospect = {
        email: person.email,
        firstName: person.first_name,
        lastName: person.last_name,
        name: person.name,
        title: person.title,
        linkedinUrl: person.linkedin_url,
        phone: person.phone_numbers?.[0]?.sanitized_number || null,
        company: person.organization?.name,
        companyDomain: person.organization?.primary_domain,
        companySize: person.organization?.estimated_num_employees,
        companyIndustry: person.organization?.industry,
        seniority: person.seniority,
        city: person.city,
        state: person.state,
        country: person.country,
        apolloId: person.id
      };

      results.prospects.push(prospect);

      // Import to Firestore if requested
      if (importToFirestore && prospect.email) {
        const contactId = generateContactId(prospect.email);
        const contactRef = db.collection("contacts").doc(contactId);
        const existing = await contactRef.get();

        if (!existing.exists) {
          await contactRef.set({
            id: contactId,
            email: prospect.email.toLowerCase().trim(),
            firstName: prospect.firstName || "",
            lastName: prospect.lastName || "",
            name: prospect.name || "",
            company: prospect.company || "",
            jobTitle: prospect.title || "",
            linkedinUrl: prospect.linkedinUrl || "",
            phone: prospect.phone || "",
            type: "lead",
            stage: "new",
            tags: ["apollo-search", ...tags],
            score: 0,
            scoreBreakdown: { engagement: 0, behavior: 0, profile: 0, recency: 0 },
            source: {
              original: "apollo_search",
              medium: "outbound",
              campaign: tags[0] || "prospect-search",
              referrer: "",
              landingPage: ""
            },
            engagement: { emailsSent: 0, emailsOpened: 0, emailsClicked: 0, toolsUsed: [], assessmentScore: null, pageViews: 0 },
            journeys: { active: [], completed: [], history: [] },
            externalIds: { apolloId: prospect.apolloId, airtableId: null, hubspotId: null, stripeId: null },
            syncStatus: { airtable: "not_synced", airtableLastSync: null },
            preferences: { emailOptIn: true, emailFrequency: "weekly", doNotContact: false },
            notes: "",
            customFields: {},
            metadata: { importedVia: "apollo_search" },
            "enrichment.apollo": prospect,
            status: "active",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: "apollo_search",
            updatedBy: "apollo_search"
          });
          results.imported++;
        }
      }
    }

    console.log(`✅ Apollo search: ${results.returned} prospects found, ${results.imported} imported`);

    response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error("❌ searchProspects error:", error);
    response.status(500).json({ error: error.message });
  }
});

// ============================================================
// ENRICHMENT CASCADE SYSTEM
// Tries multiple providers in priority order until success
// Similar to ESP cascade for email sending
// ============================================================

/**
 * Get configured enrichment providers in priority order
 * Priority: PDL (most free) → Hunter (email focus) → Apollo (paid only)
 *
 * Note: Clay does NOT have a public enrichment API - it only supports
 * webhook-based async processing or enterprise-only limited API.
 */
const getEnrichmentProviders = () => {
  const providers = [];

  // People Data Labs - 100 free lookups/month, good basic data
  // Priority 1: Best free tier for general enrichment
  const pdlKey = functions.config().pdl?.api_key;
  if (pdlKey) {
    providers.push({
      name: "pdl",
      apiKey: pdlKey,
      priority: 1,
      fields: ["name", "company", "title", "linkedin", "phone", "location", "industry"]
    });
  }

  // Hunter.io - 25 free searches/month, excellent for email verification
  // Priority 2: Good for email-focused enrichment
  const hunterKey = functions.config().hunter?.api_key;
  if (hunterKey) {
    providers.push({
      name: "hunter",
      apiKey: hunterKey,
      priority: 2,
      fields: ["name", "company", "title", "linkedin", "email_status"]
    });
  }

  // Apollo.io - Requires paid plan for enrichment API
  // Priority 3: Only used if paid plan is active
  const apolloKey = functions.config().apollo?.api_key;
  if (apolloKey) {
    providers.push({
      name: "apollo",
      apiKey: apolloKey,
      priority: 3,
      fields: ["name", "company", "title", "linkedin", "phone", "email_status"]
    });
  }

  return providers.sort((a, b) => a.priority - b.priority);
};

/**
 * Enrich via Hunter.io
 * Free tier: 25 searches + 50 verifications/month
 * Docs: https://hunter.io/api-documentation
 */
const enrichViaHunter = async (email, apiKey) => {
  const response = await fetch(
    `https://api.hunter.io/v2/email-finder?email=${encodeURIComponent(email)}&api_key=${apiKey}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.details || "Hunter API error");
  }

  const result = await response.json();
  const data = result.data;

  if (!data) {
    throw new Error("No data returned from Hunter");
  }

  return {
    provider: "hunter",
    name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || null,
    firstName: data.first_name || null,
    lastName: data.last_name || null,
    email: data.email || email,
    emailStatus: data.verification?.status || "unknown",
    company: data.company || null,
    jobTitle: data.position || null,
    linkedinUrl: data.linkedin || null,
    phone: null, // Hunter doesn't provide phone
    location: null,
    raw: data
  };
};

/**
 * Enrich via People Data Labs
 * Free tier: 100 lookups/month (basic fields only)
 * Docs: https://docs.peopledatalabs.com/
 */
const enrichViaPDL = async (email, apiKey) => {
  const response = await fetch(
    `https://api.peopledatalabs.com/v5/person/enrich?email=${encodeURIComponent(email)}`,
    {
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "PDL API error");
  }

  const result = await response.json();
  const data = result.data;

  if (!data) {
    throw new Error("No data returned from PDL");
  }

  return {
    provider: "pdl",
    name: data.full_name || null,
    firstName: data.first_name || null,
    lastName: data.last_name || null,
    email: email,
    emailStatus: "unknown", // PDL doesn't verify emails
    company: data.job_company_name || null,
    jobTitle: data.job_title || null,
    linkedinUrl: data.linkedin_url || null,
    phone: data.mobile_phone || data.phone_numbers?.[0] || null,
    location: data.location_name || null,
    industry: data.job_company_industry || null,
    raw: data
  };
};

/**
 * Enrich via Apollo.io (existing implementation, wrapped)
 * Requires paid plan for enrichment API
 */
const enrichViaApollo = async (email, apiKey) => {
  const response = await fetch("https://api.apollo.io/v1/people/match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    },
    body: JSON.stringify({
      api_key: apiKey,
      email: email
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Apollo API error");
  }

  const result = await response.json();
  const person = result.person;

  if (!person) {
    throw new Error("No person data returned from Apollo");
  }

  return {
    provider: "apollo",
    name: person.name || null,
    firstName: person.first_name || null,
    lastName: person.last_name || null,
    email: person.email || email,
    emailStatus: person.email_status || "unknown",
    company: person.organization?.name || null,
    jobTitle: person.title || null,
    linkedinUrl: person.linkedin_url || null,
    phone: person.phone_numbers?.[0]?.sanitized_number || null,
    location: person.city ? `${person.city}, ${person.state}, ${person.country}` : null,
    industry: person.organization?.industry || null,
    companySize: person.organization?.estimated_num_employees || null,
    companyLinkedin: person.organization?.linkedin_url || null,
    raw: person
  };
};

/**
 * CASCADE ENRICHMENT FUNCTION
 *
 * Tries enrichment providers in priority order until one succeeds.
 * Stores results in contact record with provider attribution.
 *
 * Usage:
 *   curl -X POST ".../cascadeEnrich" \
 *     -H "x-admin-token: YOUR_ADMIN_TOKEN" \
 *     -d '{"email": "user@company.com", "updateContact": true}'
 *
 * Options:
 *   - email: Required. Email to enrich.
 *   - providers: Optional. Array of provider names to try (default: all configured)
 *   - updateContact: Optional. Whether to update Firestore contact (default: false)
 *   - skipProviders: Optional. Array of provider names to skip
 */
exports.cascadeEnrich = functions.https.onRequest(async (request, response) => {
  // CORS
  response.set("Access-Control-Allow-Origin", "*");
  if (request.method === "OPTIONS") {
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-token");
    return response.status(204).send("");
  }

  // Auth check (SSO + legacy token fallback)
  const authResult = await verifyAdminAuth(request);
  if (!authResult.success) {
    return response.status(401).json({ error: authResult.error || "Unauthorized" });
  }

  try {
    const {
      email,
      providers: requestedProviders,
      updateContact = false,
      skipProviders = []
    } = request.body;

    if (!email) {
      return response.status(400).json({ error: "Email is required" });
    }

    // Get configured providers
    let providers = getEnrichmentProviders();

    if (providers.length === 0) {
      return response.status(400).json({
        error: "No enrichment providers configured",
        hint: "Set API keys via: firebase functions:config:set hunter.api_key=xxx pdl.api_key=xxx"
      });
    }

    // Filter by requested providers if specified
    if (requestedProviders && requestedProviders.length > 0) {
      providers = providers.filter(p => requestedProviders.includes(p.name));
    }

    // Remove skipped providers
    if (skipProviders.length > 0) {
      providers = providers.filter(p => !skipProviders.includes(p.name));
    }

    console.log(`🔍 Cascade enrichment for ${email} - trying ${providers.length} providers`);

    const attempts = [];
    let enrichedData = null;
    let successProvider = null;

    // Try each provider in order until success
    for (const provider of providers) {
      try {
        console.log(`  → Trying ${provider.name}...`);

        let result;
        switch (provider.name) {
          case "apollo":
            result = await enrichViaApollo(email, provider.apiKey);
            break;
          case "hunter":
            result = await enrichViaHunter(email, provider.apiKey);
            break;
          case "pdl":
            result = await enrichViaPDL(email, provider.apiKey);
            break;
          default:
            throw new Error(`Unknown provider: ${provider.name}`);
        }

        // Success!
        enrichedData = result;
        successProvider = provider.name;
        attempts.push({ provider: provider.name, success: true });
        console.log(`  ✅ ${provider.name} succeeded`);
        break;

      } catch (error) {
        console.log(`  ❌ ${provider.name} failed: ${error.message}`);
        attempts.push({
          provider: provider.name,
          success: false,
          error: error.message
        });
        // Continue to next provider
      }
    }

    // Update Firestore contact if requested and we have data
    if (updateContact && enrichedData) {
      const contactId = require("crypto")
        .createHash("sha256")
        .update(email.toLowerCase().trim())
        .digest("hex")
        .substring(0, 16);

      const contactRef = admin.firestore().collection("contacts").doc(contactId);
      const existingContact = await contactRef.get();

      if (existingContact.exists) {
        // Update existing contact with enriched data
        const updateData = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: `cascade_enrich_${successProvider}`
        };

        // Only update fields that have data
        if (enrichedData.name) updateData.name = enrichedData.name;
        if (enrichedData.firstName) updateData.firstName = enrichedData.firstName;
        if (enrichedData.lastName) updateData.lastName = enrichedData.lastName;
        if (enrichedData.company) updateData.company = enrichedData.company;
        if (enrichedData.jobTitle) updateData.jobTitle = enrichedData.jobTitle;
        if (enrichedData.linkedinUrl) updateData.linkedinUrl = enrichedData.linkedinUrl;
        if (enrichedData.phone) updateData.phone = enrichedData.phone;
        if (enrichedData.location) updateData["metadata.location"] = enrichedData.location;
        if (enrichedData.industry) updateData["metadata.industry"] = enrichedData.industry;

        // Store enrichment data with provider attribution
        updateData[`enrichment.${successProvider}`] = enrichedData.raw;
        updateData["enrichment.lastProvider"] = successProvider;
        updateData["enrichment.lastEnrichedAt"] = admin.firestore.FieldValue.serverTimestamp();

        await contactRef.update(updateData);
        console.log(`📝 Updated contact ${contactId} with enriched data`);
      } else {
        console.log(`⚠️ Contact ${contactId} not found, skipping update`);
      }
    }

    // Return results
    response.json({
      success: !!enrichedData,
      email,
      provider: successProvider,
      data: enrichedData,
      attempts,
      providersAvailable: getEnrichmentProviders().map(p => p.name)
    });

  } catch (error) {
    console.error("❌ cascadeEnrich error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * LIST ENRICHMENT PROVIDERS
 *
 * Returns configured enrichment providers and their status.
 * Useful for debugging and checking which providers are available.
 */
exports.listEnrichmentProviders = functions.https.onRequest(async (request, response) => {
  response.set("Access-Control-Allow-Origin", "*");
  if (request.method === "OPTIONS") {
    response.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-token");
    return response.status(204).send("");
  }

  // Auth check (SSO + legacy token fallback)
  const authResult = await verifyAdminAuth(request);
  if (!authResult.success) {
    return response.status(401).json({ error: authResult.error || "Unauthorized" });
  }

  const providers = getEnrichmentProviders();

  response.json({
    configured: providers.length,
    providers: providers.map(p => ({
      name: p.name,
      priority: p.priority,
      fields: p.fields,
      hasApiKey: !!p.apiKey
    })),
    freeOptions: [
      { name: "pdl", freeQuota: "100 lookups/month", signup: "https://peopledatalabs.com", priority: 1 },
      { name: "hunter", freeQuota: "25 searches + 50 verifications/month", signup: "https://hunter.io", priority: 2 }
    ],
    paidOnly: [
      { name: "apollo", note: "Enrichment API requires paid plan", signup: "https://apollo.io" }
    ],
    notSupported: [
      { name: "clay", reason: "No public enrichment API - only webhook-based async or enterprise API", info: "https://www.clay.com/university/guide/using-clay-as-an-api" }
    ],
    configCommands: {
      pdl: "firebase functions:config:set pdl.api_key=YOUR_KEY",
      hunter: "firebase functions:config:set hunter.api_key=YOUR_KEY",
      apollo: "firebase functions:config:set apollo.api_key=YOUR_KEY (requires paid plan)"
    }
  });
});

// ============================================
// DUAL-PIPELINE PROSPECTING ENGINE (Dec 2025)
// ============================================

/**
 * PE SIGNAL WEIGHTS
 * Used for scoring companies against Pipeline A (Traditional Proprietor)
 * and Pipeline B (Digital-First Non-SaaS)
 */
const PE_SIGNAL_WEIGHTS = {
  pipelineA: {
    noFundingRecorded: 0.15,
    seedAngelOnlyUnder500k: 0.10,
    seriesABWithFounderControl: 0.05,
    nonDilutiveFundingMentioned: 0.05,
    singleFounderFlatOrg: 0.10,
    founderCeoStillActive: 0.12,
    employeeCountUnder50: 0.08,
    founderLedSalesDominance: 0.10,
    revenueBasedFinancingActive: 0.06,
    organicGrowth50Percent: 0.08,
    bootstrappedInDescription: 0.10,
    founderLedPositioning: 0.08,
    noInvestorsListedOrFounderOnly: 0.10,
    exclusivelyAngelsSeedLimited: 0.05
  },
  pipelineB: {
    productHuntLaunchRecent: 0.12,
    ycBadgePresent: 0.10,
    foundedWithin36Months: 0.08,
    founderCeoStillActive: 0.12,
    recurringRevenueModel: 0.15,
    organicGrowth50Percent: 0.08
  }
};

/**
 * HARD BLOCK signals - immediate exclusion
 */
const HARD_BLOCK_SIGNALS = ['peVcInvestorTagsPresent', 'portfolioCompanyMention'];

/**
 * RED FLAG signals - 3+ = exclusion, 2 = flagged
 */
const RED_FLAG_SIGNALS = [
  'seriesCPlusOrLateStage',
  'parentCompanyExists',
  'foreignBranchStatus',
  'cfoHiredPostFunding',
  'salesVpHiredYearOne',
  'rapidExpansion6mo',
  'listIncludesPeVcFirms'
];

/**
 * DISCOVER PIPELINE A
 *
 * Sources: Google Places API, Secretary of State APIs
 * Target: Traditional proprietor businesses (local, professional services)
 *
 * Scheduled: Daily at 2:00 AM UTC
 * Output: ~100-150 prospects/day
 */
exports.discoverPipelineA = functions
  .runWith({ memory: '512MB', timeoutSeconds: 300 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    // Auth check (SSO + legacy token fallback)
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return response.status(401).json({ error: authResult.error || "Unauthorized" });
    }

    try {
      const {
        location = "San Francisco, CA",  // Default search location (city name or lat,lng)
        lat,                              // Optional: latitude (overrides location string)
        lng,                              // Optional: longitude (overrides location string)
        radius = 50000,                   // 50km radius
        types = ["accounting", "consulting", "marketing_agency", "legal"],
        maxResults = 50,
        dryRun = false
      } = request.body;

      const googlePlacesKey = functions.config().googleplaces?.api_key;

      if (!googlePlacesKey || googlePlacesKey === "PLACEHOLDER_GOOGLE_PLACES") {
        return response.json({
          warning: "Google Places API not configured",
          placeholder: true,
          hint: "Set API key via: firebase functions:config:set googleplaces.api_key=YOUR_KEY",
          mockResults: generateMockPipelineAResults(maxResults)
        });
      }

      // Get coordinates - either provided directly or via geocoding
      let searchLat = lat;
      let searchLng = lng;

      if (!searchLat || !searchLng) {
        // Use Geocoding API to convert location string to coordinates
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${googlePlacesKey}`;
        const geocodeRes = await fetch(geocodeUrl);
        const geocodeData = await geocodeRes.json();

        if (geocodeData.status === "OK" && geocodeData.results?.length > 0) {
          searchLat = geocodeData.results[0].geometry.location.lat;
          searchLng = geocodeData.results[0].geometry.location.lng;
          console.log(`📍 Geocoded "${location}" to ${searchLat},${searchLng}`);
        } else {
          return response.status(400).json({
            error: `Failed to geocode location: ${location}`,
            geocodeStatus: geocodeData.status,
            hint: "Provide lat/lng coordinates directly or use a valid city name"
          });
        }
      }

      const results = [];
      const errors = [];

      // Search Google Places for each business type
      for (const businessType of types) {
        try {
          const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
            `location=${searchLat},${searchLng}&` +
            `radius=${radius}&` +
            `type=${businessType}&` +
            `key=${googlePlacesKey}`;

          const placesResponse = await fetch(searchUrl);
          const placesData = await placesResponse.json();

          if (placesData.status === "OK" && placesData.results) {
            for (const place of placesData.results.slice(0, Math.ceil(maxResults / types.length))) {
              results.push({
                source: 'google_places',
                sourceId: place.place_id,
                companyName: place.name,
                rawData: {
                  name: place.name,
                  address: place.vicinity,
                  types: place.types,
                  rating: place.rating,
                  userRatingsTotal: place.user_ratings_total,
                  businessStatus: place.business_status,
                  location: place.geometry?.location
                },
                pipeline: 'A'
              });
            }
          }
        } catch (error) {
          errors.push({ type: businessType, error: error.message });
        }
      }

      // Store raw companies if not dry run
      let stored = 0;
      if (!dryRun) {
        for (const company of results) {
          try {
            const docId = `${company.source}_${company.sourceId}`;
            await db.collection('companies_raw').doc(docId).set({
              ...company,
              ingestedAt: admin.firestore.FieldValue.serverTimestamp(),
              processedAt: null,
              contactId: null,
              status: 'pending'
            });
            stored++;
          } catch (err) {
            console.error(`Failed to store ${company.companyName}:`, err.message);
          }
        }
      }

      // Track API usage (types.length for nearby search + 1 for geocode if used)
      const geocodeUsed = (!lat || !lng) ? 1 : 0;
      const today = new Date().toISOString().split('T')[0];
      await db.collection('api_usage').doc(today).set({
        googlePlacesCallsUsed: admin.firestore.FieldValue.increment(types.length + geocodeUsed),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      response.json({
        success: true,
        pipeline: 'A',
        discovered: results.length,
        stored: stored,
        dryRun,
        location,
        types,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error("❌ discoverPipelineA error:", error);
      response.status(500).json({ error: error.message });
    }
  });

/**
 * DISCOVER PIPELINE B
 *
 * Sources: Y Combinator (GitHub data), Growjo (growth data)
 * Target: Digital-first non-SaaS businesses
 *
 * Scheduled: Daily at 3:00 AM UTC
 * Output: ~50-100 prospects/day
 */
exports.discoverPipelineB = functions
  .runWith({ memory: '512MB', timeoutSeconds: 300 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    // Auth check (SSO + legacy token fallback)
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return response.status(401).json({ error: authResult.error || "Unauthorized" });
    }

    try {
      const {
        sources = ["yc_github", "growjo"],  // Available: yc_github, growjo
        maxResults = 50,
        dryRun = false
      } = request.body;

      const results = [];
      const errors = [];

      // YC GitHub - public data from Y Combinator companies
      if (sources.includes("yc_github")) {
        try {
          // Fetch YC companies from public GitHub repo
          const ycUrl = "https://raw.githubusercontent.com/toshi7711/YC_Company/main/YC_Company_v2.json";
          const ycResponse = await fetch(ycUrl);

          if (ycResponse.ok) {
            const ycData = await ycResponse.json();
            const recentYC = ycData
              .filter(c => {
                const batchYear = parseInt(c.Batch?.match(/\d{4}/)?.[0] || '0');
                return batchYear >= 2022;  // Last 3 years
              })
              .slice(0, Math.ceil(maxResults / sources.length));

            for (const company of recentYC) {
              results.push({
                source: 'yc_github',
                sourceId: `yc_${company.Name?.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
                companyName: company.Name,
                rawData: {
                  name: company.Name,
                  description: company.Description,
                  batch: company.Batch,
                  website: company.Website,
                  location: company.Location,
                  industry: company.Industry
                },
                pipeline: 'B'
              });
            }
          }
        } catch (error) {
          errors.push({ source: 'yc_github', error: error.message });
        }
      }

      // Growjo - company growth data (free scraping)
      if (sources.includes("growjo")) {
        try {
          // Growjo provides growth rankings and company data
          // Using public data from growjo.com/all/all
          // Note: Consider rate limiting and respecting robots.txt

          // For now, generate mock results - real implementation would scrape or use API
          const growjoResults = [];
          const industries = ['Marketing', 'Sales', 'HR Tech', 'FinTech', 'E-commerce'];

          for (let i = 0; i < Math.ceil(maxResults / sources.length); i++) {
            growjoResults.push({
              source: 'growjo',
              sourceId: `growjo_company_${Date.now()}_${i}`,
              companyName: `Growth Company ${i + 1}`,
              rawData: {
                name: `Growth Company ${i + 1}`,
                growthRate: Math.floor(Math.random() * 200) + 50, // 50-250%
                employees: Math.floor(Math.random() * 100) + 10,
                industry: industries[Math.floor(Math.random() * industries.length)],
                founded: 2020 + Math.floor(Math.random() * 4)
              },
              pipeline: 'B'
            });
          }
          results.push(...growjoResults);
        } catch (error) {
          errors.push({ source: 'growjo', error: error.message });
        }
      }

      // Store raw companies if not dry run
      let stored = 0;
      if (!dryRun) {
        for (const company of results) {
          try {
            const docId = `${company.source}_${company.sourceId}`;
            await db.collection('companies_raw').doc(docId).set({
              ...company,
              ingestedAt: admin.firestore.FieldValue.serverTimestamp(),
              processedAt: null,
              contactId: null,
              status: 'pending'
            });
            stored++;
          } catch (err) {
            console.error(`Failed to store ${company.companyName}:`, err.message);
          }
        }
      }

      response.json({
        success: true,
        pipeline: 'B',
        discovered: results.length,
        stored: stored,
        dryRun,
        sources,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error("❌ discoverPipelineB error:", error);
      response.status(500).json({ error: error.message });
    }
  });

/**
 * PROCESS RAW COMPANIES
 *
 * Converts companies_raw entries into contacts by:
 * 1. Finding company domains via Google search heuristics
 * 2. Using Hunter.io to find emails for decision makers
 * 3. Creating contacts with discovered info
 */
exports.processRawCompanies = functions
  .runWith({ memory: '512MB', timeoutSeconds: 300 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    // Auth check
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return response.status(401).json({ error: authResult.error || "Unauthorized" });
    }

    try {
      const {
        limit = 10,
        dryRun = false,
        pipeline = null  // 'A', 'B', or null for both
      } = request.body;

      const hunterKey = functions.config().hunter?.api_key;
      if (!hunterKey) {
        return response.status(400).json({
          error: "Hunter.io API key not configured",
          hint: "Set via: firebase functions:config:set hunter.api_key=YOUR_KEY"
        });
      }

      // Fetch pending companies
      let query = db.collection('companies_raw')
        .where('status', '==', 'pending')
        .limit(limit);

      if (pipeline) {
        query = query.where('pipeline', '==', pipeline);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        return response.json({
          success: true,
          message: "No pending companies to process",
          processed: 0
        });
      }

      const results = {
        processed: 0,
        contactsCreated: 0,
        contactsUpdated: 0,
        noEmailFound: 0,
        errors: []
      };

      for (const doc of snapshot.docs) {
        const company = doc.data();
        const companyName = company.companyName || company.rawData?.name;

        try {
          // Try to find domain from company name
          // For Google Places, we might have a website from detailed lookup
          let domain = null;
          let emails = [];

          // If we have address info, try Hunter domain search
          if (companyName) {
            // Attempt Hunter company search
            const hunterUrl = `https://api.hunter.io/v2/domain-search?company=${encodeURIComponent(companyName)}&api_key=${hunterKey}`;
            const hunterRes = await fetch(hunterUrl);
            const hunterData = await hunterRes.json();

            if (hunterData.data?.domain) {
              domain = hunterData.data.domain;
              // Get decision maker emails
              const decisionMakers = (hunterData.data.emails || [])
                .filter(e => ['ceo', 'founder', 'owner', 'president', 'director', 'manager', 'marketing', 'sales'].some(role =>
                  (e.position || '').toLowerCase().includes(role) ||
                  (e.department || '').toLowerCase().includes(role)
                ))
                .slice(0, 3);

              emails = decisionMakers.map(e => ({
                email: e.value,
                firstName: e.first_name,
                lastName: e.last_name,
                position: e.position,
                confidence: e.confidence
              }));
            }
          }

          // If no emails found via Hunter
          if (emails.length === 0) {
            results.noEmailFound++;

            // Mark as processed with no-email status
            if (!dryRun) {
              await doc.ref.update({
                status: 'no_email',
                processedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
            results.processed++;
            continue;
          }

          // Create contact for the primary decision maker
          const primaryEmail = emails[0];
          const contactData = {
            email: primaryEmail.email,
            firstName: primaryEmail.firstName || '',
            lastName: primaryEmail.lastName || '',
            name: `${primaryEmail.firstName || ''} ${primaryEmail.lastName || ''}`.trim() || companyName,
            company: companyName,
            website: domain ? `https://${domain}` : null,
            position: primaryEmail.position || null,
            source: company.source || 'discovery',
            tags: [`pipeline-${company.pipeline}`, 'discovery'],
            pipelineAssignment: {
              primaryPipeline: company.pipeline,
              pipelineAStatus: company.pipeline === 'A' ? 'PENDING' : null,
              pipelineBStatus: company.pipeline === 'B' ? 'PENDING' : null
            },
            discoverySource: {
              primary: company.source,
              sources: [company.source],
              discoveredAt: company.ingestedAt,
              rawDataRef: doc.ref.path
            },
            metadata: {
              hunterConfidence: primaryEmail.confidence,
              alternativeEmails: emails.slice(1).map(e => e.email)
            },
            status: 'active',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'processRawCompanies'
          };

          if (!dryRun) {
            // Check if contact exists
            const existingContact = await db.collection('contacts')
              .where('email', '==', primaryEmail.email)
              .limit(1)
              .get();

            if (existingContact.empty) {
              contactData.createdAt = admin.firestore.FieldValue.serverTimestamp();
              contactData.createdBy = 'processRawCompanies';
              await db.collection('contacts').add(contactData);
              results.contactsCreated++;
            } else {
              // Update existing contact
              await existingContact.docs[0].ref.update({
                ...contactData,
                tags: admin.firestore.FieldValue.arrayUnion(...contactData.tags)
              });
              results.contactsUpdated++;
            }

            // Mark raw company as processed
            await doc.ref.update({
              status: 'processed',
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
              contactEmail: primaryEmail.email
            });
          } else {
            results.contactsCreated++;  // Count as would-be-created for dry run
          }

          results.processed++;

        } catch (err) {
          results.errors.push({
            company: companyName,
            error: err.message
          });
        }
      }

      // Track API usage
      const today = new Date().toISOString().split('T')[0];
      await db.collection('api_usage').doc(today).set({
        hunterDomainSearches: admin.firestore.FieldValue.increment(results.processed),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      response.json({
        success: true,
        dryRun,
        ...results
      });

    } catch (error) {
      console.error("❌ processRawCompanies error:", error);
      response.status(500).json({ error: error.message });
    }
  });

/**
 * COLLECT SIGNALS
 *
 * Collects the 27 PE signals for a contact.
 * Uses cascade enrichment + heuristics to populate signals.
 */
exports.collectSignals = functions
  .runWith({ memory: '256MB', timeoutSeconds: 120 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    // Auth check (SSO + legacy token fallback)
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return response.status(401).json({ error: authResult.error || "Unauthorized" });
    }

    try {
      const { contactId, email, enrichFirst = true } = request.body;

      if (!contactId && !email) {
        return response.status(400).json({ error: "contactId or email required" });
      }

      const targetContactId = contactId || generateContactId(email);
      const contactRef = db.collection('contacts').doc(targetContactId);
      const contactSnap = await contactRef.get();

      if (!contactSnap.exists) {
        return response.status(404).json({ error: "Contact not found" });
      }

      const contact = contactSnap.data();

      // Initialize signals from existing enrichment data
      const peSignals = {
        fundingHistory: {
          noFundingRecorded: null,
          seedAngelOnlyUnder500k: null,
          seriesABWithFounderControl: null,
          seriesCPlusOrLateStage: null,
          peVcInvestorTagsPresent: null
        },
        corporateStructure: {
          singleFounderFlatOrg: null,
          parentCompanyExists: null,
          foreignBranchStatus: null
        },
        digitalFootprint: {
          productHuntLaunchRecent: null,
          ycBadgePresent: null,
          foundedWithin36Months: null,
          nonDilutiveFundingMentioned: null
        },
        executiveProfile: {
          founderCeoStillActive: null,
          cfoHiredPostFunding: null,
          salesVpHiredYearOne: null
        },
        hiring: {
          employeeCountUnder50: null,
          rapidExpansion6mo: null,
          founderLedSalesDominance: null
        },
        revenue: {
          revenueBasedFinancingActive: null,
          recurringRevenueModel: null,
          organicGrowth50Percent: null
        },
        websiteLanguage: {
          bootstrappedInDescription: null,
          founderLedPositioning: null,
          portfolioCompanyMention: null
        },
        investorConnections: {
          noInvestorsListedOrFounderOnly: null,
          listIncludesPeVcFirms: null,
          exclusivelyAngelsSeedLimited: null
        }
      };

      // Extract signals from existing enrichment data
      const enrichment = contact.enrichment || {};
      const metadata = contact.metadata || {};

      // PDL data signals
      if (enrichment.pdl) {
        const pdl = enrichment.pdl;

        // Company size signal
        if (pdl.company?.size) {
          const size = parseInt(pdl.company.size) || 0;
          peSignals.hiring.employeeCountUnder50 = size < 50;
        }

        // Founder/CEO check (from job title)
        if (pdl.job_title || contact.jobTitle) {
          const title = (pdl.job_title || contact.jobTitle || '').toLowerCase();
          peSignals.executiveProfile.founderCeoStillActive =
            title.includes('founder') ||
            title.includes('ceo') ||
            title.includes('owner') ||
            title.includes('principal');
        }

        // Industry signals
        if (pdl.company?.industry) {
          const industry = pdl.company.industry.toLowerCase();
          // Non-SaaS digital businesses
          peSignals.revenue.recurringRevenueModel =
            industry.includes('subscription') ||
            industry.includes('media') ||
            industry.includes('publishing');
        }
      }

      // Website/description analysis for language signals
      const description = metadata.description || contact.notes || '';
      const descLower = description.toLowerCase();

      peSignals.websiteLanguage.bootstrappedInDescription =
        descLower.includes('bootstrap') ||
        descLower.includes('self-funded') ||
        descLower.includes('founder-funded');

      peSignals.websiteLanguage.founderLedPositioning =
        descLower.includes('founder-led') ||
        descLower.includes('owner-operated') ||
        descLower.includes('family-owned');

      peSignals.websiteLanguage.portfolioCompanyMention =
        descLower.includes('portfolio company') ||
        descLower.includes('backed by') ||
        descLower.includes('a ') && descLower.includes(' company');

      // Discovery source signals
      const discoverySource = contact.discoverySource?.primary;
      if (discoverySource === 'yc') peSignals.digitalFootprint.ycBadgePresent = true;
      if (discoverySource === 'producthunt') peSignals.digitalFootprint.productHuntLaunchRecent = true;

      // Update contact with signals
      await contactRef.update({
        peSignals,
        'pipelineAssignment.lastScoredAt': admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'collectSignals'
      });

      response.json({
        success: true,
        contactId: targetContactId,
        signalsCollected: Object.keys(peSignals).reduce((sum, cat) => {
          return sum + Object.values(peSignals[cat]).filter(v => v !== null).length;
        }, 0),
        peSignals
      });

    } catch (error) {
      console.error("❌ collectSignals error:", error);
      response.status(500).json({ error: error.message });
    }
  });

/**
 * FILTER PE BACKED
 *
 * Evaluates PE signals and determines exclusion status.
 * Hard blocks: Immediate exclusion
 * Red flags: 3+ = exclusion, 2 = flagged for manual review
 */
exports.filterPEBacked = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    // Auth check (SSO + legacy token fallback)
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return response.status(401).json({ error: authResult.error || "Unauthorized" });
    }

    try {
      const { contactId, email, updateContact = true } = request.body;

      if (!contactId && !email) {
        return response.status(400).json({ error: "contactId or email required" });
      }

      const targetContactId = contactId || generateContactId(email);
      const contactRef = db.collection('contacts').doc(targetContactId);
      const contactSnap = await contactRef.get();

      if (!contactSnap.exists) {
        return response.status(404).json({ error: "Contact not found" });
      }

      const contact = contactSnap.data();
      const peSignals = contact.peSignals;

      if (!peSignals) {
        return response.status(400).json({
          error: "No PE signals collected",
          hint: "Run collectSignals first"
        });
      }

      // Flatten signals for evaluation
      const flatSignals = {
        ...peSignals.fundingHistory,
        ...peSignals.corporateStructure,
        ...peSignals.digitalFootprint,
        ...peSignals.executiveProfile,
        ...peSignals.hiring,
        ...peSignals.revenue,
        ...peSignals.websiteLanguage,
        ...peSignals.investorConnections
      };

      // Check hard blocks
      const hardBlocks = [];
      for (const signal of HARD_BLOCK_SIGNALS) {
        if (flatSignals[signal] === true) {
          hardBlocks.push(signal);
        }
      }

      if (hardBlocks.length > 0) {
        const result = {
          status: 'EXCLUDED_PE',
          reason: `Hard block: ${hardBlocks.join(', ')}`,
          confidence: 1.0,
          hardBlocks,
          redFlags: []
        };

        if (updateContact) {
          await contactRef.update({
            'pipelineAssignment.pipelineAStatus': 'EXCLUDED_PE',
            'pipelineAssignment.pipelineBStatus': 'EXCLUDED_PE',
            'pipelineAssignment.peExclusionReason': result.reason,
            'pipelineAssignment.confidenceScore': result.confidence,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Log exclusion
          await db.collection('pe_exclusion_log').add({
            contactId: targetContactId,
            exclusionType: 'HARD_BLOCK',
            signalsTriggered: hardBlocks,
            confidence: 1.0,
            excludedAt: admin.firestore.FieldValue.serverTimestamp(),
            reasonSummary: result.reason,
            appealStatus: 'none'
          });
        }

        return response.json({ success: true, ...result });
      }

      // Count red flags
      const redFlags = [];
      for (const signal of RED_FLAG_SIGNALS) {
        if (flatSignals[signal] === true) {
          redFlags.push(signal);
        }
      }

      let result;
      if (redFlags.length >= 3) {
        result = {
          status: 'EXCLUDED_PE',
          reason: `Red flags (${redFlags.length}): ${redFlags.join(', ')}`,
          confidence: 0.85,
          hardBlocks: [],
          redFlags
        };
      } else if (redFlags.length === 2) {
        result = {
          status: 'FLAGGED',
          reason: `Review needed - Red flags: ${redFlags.join(', ')}`,
          confidence: 0.65,
          hardBlocks: [],
          redFlags
        };
      } else {
        result = {
          status: 'QUALIFIED',
          reason: redFlags.length === 1 ? `Minor concern: ${redFlags[0]}` : 'No PE indicators',
          confidence: redFlags.length === 1 ? 0.80 : 0.95,
          hardBlocks: [],
          redFlags
        };
      }

      if (updateContact) {
        const updateData = {
          'pipelineAssignment.peExclusionReason': result.status !== 'QUALIFIED' ? result.reason : null,
          'pipelineAssignment.confidenceScore': result.confidence,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (result.status === 'EXCLUDED_PE') {
          updateData['pipelineAssignment.pipelineAStatus'] = 'EXCLUDED_PE';
          updateData['pipelineAssignment.pipelineBStatus'] = 'EXCLUDED_PE';

          await db.collection('pe_exclusion_log').add({
            contactId: targetContactId,
            exclusionType: 'RED_FLAGS',
            signalsTriggered: redFlags,
            confidence: result.confidence,
            excludedAt: admin.firestore.FieldValue.serverTimestamp(),
            reasonSummary: result.reason,
            appealStatus: 'none'
          });
        } else if (result.status === 'FLAGGED') {
          updateData['pipelineAssignment.pipelineAStatus'] = 'FLAGGED';
          updateData['pipelineAssignment.pipelineBStatus'] = 'FLAGGED';

          // Add to manual review queue
          await db.collection('manual_review_queue').doc(targetContactId).set({
            contactId: targetContactId,
            reason: result.reason,
            conflictingSignals: { redFlags },
            priority: 'normal',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            reviewedAt: null,
            reviewerDecision: null,
            reviewerNotes: ''
          });
        }

        await contactRef.update(updateData);
      }

      response.json({ success: true, contactId: targetContactId, ...result });

    } catch (error) {
      console.error("❌ filterPEBacked error:", error);
      response.status(500).json({ error: error.message });
    }
  });

/**
 * SCORE PIPELINES
 *
 * Calculates Pipeline A and Pipeline B scores from PE signals.
 * Assigns primary pipeline based on threshold (0.3).
 */
exports.scorePipelines = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    // Auth check (SSO + legacy token fallback)
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return response.status(401).json({ error: authResult.error || "Unauthorized" });
    }

    try {
      const { contactId, email, updateContact = true, threshold = 0.3 } = request.body;

      if (!contactId && !email) {
        return response.status(400).json({ error: "contactId or email required" });
      }

      const targetContactId = contactId || generateContactId(email);
      const contactRef = db.collection('contacts').doc(targetContactId);
      const contactSnap = await contactRef.get();

      if (!contactSnap.exists) {
        return response.status(404).json({ error: "Contact not found" });
      }

      const contact = contactSnap.data();
      const peSignals = contact.peSignals;
      const currentStatus = contact.pipelineAssignment?.pipelineAStatus;

      // Skip if already excluded
      if (currentStatus === 'EXCLUDED_PE') {
        return response.json({
          success: true,
          contactId: targetContactId,
          skipped: true,
          reason: 'Already excluded from pipelines'
        });
      }

      if (!peSignals) {
        return response.status(400).json({
          error: "No PE signals collected",
          hint: "Run collectSignals first"
        });
      }

      // Flatten signals
      const flatSignals = {
        ...peSignals.fundingHistory,
        ...peSignals.corporateStructure,
        ...peSignals.digitalFootprint,
        ...peSignals.executiveProfile,
        ...peSignals.hiring,
        ...peSignals.revenue,
        ...peSignals.websiteLanguage,
        ...peSignals.investorConnections
      };

      // Calculate Pipeline A score
      let pipelineAScore = 0;
      for (const [signal, weight] of Object.entries(PE_SIGNAL_WEIGHTS.pipelineA)) {
        if (flatSignals[signal] === true) {
          pipelineAScore += weight;
        } else if (flatSignals[signal] === false) {
          pipelineAScore -= weight * 0.5;
        }
      }

      // Calculate Pipeline B score
      let pipelineBScore = 0;
      for (const [signal, weight] of Object.entries(PE_SIGNAL_WEIGHTS.pipelineB)) {
        if (flatSignals[signal] === true) {
          pipelineBScore += weight;
        } else if (flatSignals[signal] === false) {
          pipelineBScore -= weight * 0.5;
        }
      }

      // Clamp scores
      pipelineAScore = Math.max(-1, Math.min(1, pipelineAScore));
      pipelineBScore = Math.max(-1, Math.min(1, pipelineBScore));

      // Round to 2 decimals
      pipelineAScore = Math.round(pipelineAScore * 100) / 100;
      pipelineBScore = Math.round(pipelineBScore * 100) / 100;

      // Determine primary pipeline
      let primaryPipeline = null;
      let pipelineAStatus = 'LOW_SCORE';
      let pipelineBStatus = 'LOW_SCORE';

      if (pipelineAScore >= threshold && pipelineBScore >= threshold) {
        primaryPipeline = 'AB';
        pipelineAStatus = 'QUALIFIED';
        pipelineBStatus = 'QUALIFIED';
      } else if (pipelineAScore >= threshold) {
        primaryPipeline = 'A';
        pipelineAStatus = 'QUALIFIED';
      } else if (pipelineBScore >= threshold) {
        primaryPipeline = 'B';
        pipelineBStatus = 'QUALIFIED';
      }

      // Preserve FLAGGED status if set
      if (currentStatus === 'FLAGGED') {
        pipelineAStatus = 'FLAGGED';
        pipelineBStatus = 'FLAGGED';
      }

      const result = {
        pipelineAScore,
        pipelineBScore,
        primaryPipeline,
        pipelineAStatus,
        pipelineBStatus,
        threshold
      };

      if (updateContact) {
        await contactRef.update({
          'pipelineAssignment.primaryPipeline': primaryPipeline,
          'pipelineAssignment.pipelineAScore': pipelineAScore,
          'pipelineAssignment.pipelineAStatus': pipelineAStatus,
          'pipelineAssignment.pipelineBScore': pipelineBScore,
          'pipelineAssignment.pipelineBStatus': pipelineBStatus,
          'pipelineAssignment.lastScoredAt': admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: 'scorePipelines'
        });
      }

      response.json({ success: true, contactId: targetContactId, ...result });

    } catch (error) {
      console.error("❌ scorePipelines error:", error);
      response.status(500).json({ error: error.message });
    }
  });

/**
 * GET PIPELINE STATS
 *
 * Returns statistics for dual-pipeline prospecting.
 */
exports.getPipelineStats = functions.https.onRequest(async (request, response) => {
  setCors(response);
  if (request.method === "OPTIONS") {
    return response.status(204).send("");
  }

  // Auth check (SSO + legacy token fallback)
  const authResult = await verifyAdminAuth(request);
  if (!authResult.success) {
    return response.status(401).json({ error: authResult.error || "Unauthorized" });
  }

  try {
    const contactsRef = db.collection('contacts');
    const activeQuery = contactsRef.where('status', '==', 'active').limit(1000);
    const snapshot = await activeQuery.get();

    const stats = {
      total: 0,
      pipelineA: { qualified: 0, excluded: 0, flagged: 0, lowScore: 0, pending: 0 },
      pipelineB: { qualified: 0, excluded: 0, flagged: 0, lowScore: 0, pending: 0 },
      dualPipeline: 0,
      unassigned: 0
    };

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      stats.total++;

      const pipeline = data.pipelineAssignment?.primaryPipeline;

      if (!pipeline) {
        stats.unassigned++;
      } else if (pipeline === 'AB') {
        stats.dualPipeline++;
      }

      const statusA = data.pipelineAssignment?.pipelineAStatus || 'PENDING';
      const statusB = data.pipelineAssignment?.pipelineBStatus || 'PENDING';

      const statusMap = {
        'QUALIFIED': 'qualified',
        'EXCLUDED_PE': 'excluded',
        'FLAGGED': 'flagged',
        'LOW_SCORE': 'lowScore',
        'PENDING': 'pending'
      };

      if (statusMap[statusA]) stats.pipelineA[statusMap[statusA]]++;
      if (statusMap[statusB]) stats.pipelineB[statusMap[statusB]]++;
    });

    // Get manual review queue count
    const reviewQueue = await db.collection('manual_review_queue')
      .where('reviewedAt', '==', null)
      .limit(100)
      .get();
    stats.manualReviewPending = reviewQueue.docs.length;

    // Get today's API usage
    const today = new Date().toISOString().split('T')[0];
    const usageDoc = await db.collection('api_usage').doc(today).get();
    stats.todayApiUsage = usageDoc.exists ? usageDoc.data() : null;

    response.json({ success: true, stats });

  } catch (error) {
    console.error("❌ getPipelineStats error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * GET EMAIL TRACKING STATS
 *
 * Returns email delivery, open, and click statistics from Resend.
 */
exports.getEmailStats = functions.https.onRequest(async (request, response) => {
  setCors(response);
  if (request.method === "OPTIONS") {
    return response.status(204).send("");
  }

  // Auth check (SSO + legacy token fallback + cleanup token)
  const authResult = await verifyAdminAuth(request, { allowCleanupToken: true });
  if (!authResult.success) {
    return response.status(401).json({ error: authResult.error || "Unauthorized" });
  }

  try {
    const resendApiKey = functions.config().resend?.api_key;
    if (!resendApiKey) {
      return response.status(500).json({ error: "Resend API key not configured" });
    }

    // Fetch recent emails from Resend (last 100)
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!resendResponse.ok) {
      throw new Error(`Resend API error: ${resendResponse.status}`);
    }

    const { data: emails } = await resendResponse.json();

    // Get event counts from Firestore (webhook data) - simple query, no composite index needed
    const eventsSnapshot = await db.collection("email_events")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();

    // Count events by type from Firestore
    const eventCounts = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0
    };

    const uniqueOpens = new Set();
    const uniqueClicks = new Set();

    eventsSnapshot.forEach(doc => {
      const event = doc.data();
      const type = event.type;

      if (type === 'opened') {
        uniqueOpens.add(event.emailId);
      } else if (type === 'clicked') {
        uniqueClicks.add(event.emailId);
      } else if (eventCounts[type] !== undefined) {
        eventCounts[type]++;
      }
    });

    // Calculate stats (prefer Firestore events, fall back to Resend list)
    const stats = {
      total: emails.length,
      delivered: 0,
      opened: uniqueOpens.size, // Unique emails opened
      clicked: uniqueClicks.size, // Unique emails clicked
      bounced: 0,
      complained: 0,
      pending: 0,
      recentEmails: [],
      recentEvents: [],
      byDay: {}
    };

    // Process emails from Resend for delivery/bounce status
    emails.forEach(email => {
      const event = email.last_event;
      const date = email.created_at?.split('T')[0] || 'unknown';

      // Count by status
      if (event === 'delivered') stats.delivered++;
      else if (event === 'bounced') stats.bounced++;
      else if (event === 'complained') stats.complained++;
      else if (event === 'sent') stats.pending++;

      // Group by day
      if (!stats.byDay[date]) {
        stats.byDay[date] = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
      }
      stats.byDay[date].sent++;
      if (['delivered', 'opened', 'clicked'].includes(event)) stats.byDay[date].delivered++;
      if (event === 'bounced') stats.byDay[date].bounced++;
    });

    // Get 10 most recent emails for display
    stats.recentEmails = emails.slice(0, 10).map(email => ({
      id: email.id,
      to: email.to?.[0] || 'unknown',
      subject: email.subject || 'No subject',
      status: email.last_event,
      opened: uniqueOpens.has(email.id),
      clicked: uniqueClicks.has(email.id),
      createdAt: email.created_at
    }));

    // Get recent open/click events for activity feed (simple query, filter in memory)
    const recentEventsSnapshot = await db.collection("email_events")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    stats.recentEvents = recentEventsSnapshot.docs
      .map(doc => {
        const event = doc.data();
        return {
          id: doc.id,
          type: event.type,
          to: event.to,
          subject: event.subject,
          link: event.link,
          timestamp: event.timestamp?.toDate?.()?.toISOString() || event.createdAt?.toDate?.()?.toISOString() || null
        };
      })
      .filter(e => e.type === 'opened' || e.type === 'clicked')
      .slice(0, 10);

    // Calculate rates
    stats.deliveryRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;
    stats.openRate = stats.delivered > 0 ? Math.round((stats.opened / stats.delivered) * 100) : 0;
    stats.clickRate = stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0;
    stats.bounceRate = stats.total > 0 ? Math.round((stats.bounced / stats.total) * 100) : 0;

    response.json({ success: true, stats });

  } catch (error) {
    console.error("❌ getEmailStats error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * RESEND WEBHOOK HANDLER
 *
 * Receives email events from Resend (opens, clicks, bounces, etc.)
 * Stores them in Firestore for tracking and analytics.
 *
 * Webhook events: https://resend.com/docs/dashboard/webhooks/event-types
 * - email.sent
 * - email.delivered
 * - email.opened
 * - email.clicked
 * - email.bounced
 * - email.complained
 */
exports.handleResendWebhook = functions.https.onRequest(async (request, response) => {
  setCors(response);
  if (request.method === "OPTIONS") {
    return response.status(204).send("");
  }

  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = request.body;

    // Validate event structure
    if (!event || !event.type || !event.data) {
      console.warn("Invalid webhook payload:", JSON.stringify(event));
      return response.status(400).json({ error: "Invalid payload" });
    }

    const { type, data } = event;
    const emailId = data.email_id;
    const createdAt = data.created_at || new Date().toISOString();

    console.log(`📧 Resend webhook: ${type} for email ${emailId}`);

    // Store event in Firestore
    const eventDoc = {
      emailId,
      type: type.replace('email.', ''), // 'opened', 'clicked', etc.
      fullType: type,
      to: data.to?.[0] || null,
      subject: data.subject || null,
      link: data.click?.link || null, // For click events
      ipAddress: data.click?.ipAddress || null,
      userAgent: data.click?.userAgent || null,
      timestamp: admin.firestore.Timestamp.fromDate(new Date(createdAt)),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      rawData: data
    };

    await db.collection("email_events").add(eventDoc);

    // Update email tracking summary in emails collection
    const emailRef = db.collection("emails").doc(emailId);
    const emailDoc = await emailRef.get();

    const updateData = {
      lastEvent: type.replace('email.', ''),
      lastEventAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Track specific events
    if (type === 'email.opened') {
      updateData.openedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.openCount = admin.firestore.FieldValue.increment(1);
    } else if (type === 'email.clicked') {
      updateData.clickedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.clickCount = admin.firestore.FieldValue.increment(1);
      if (!emailDoc.exists || !emailDoc.data().clickedLinks) {
        updateData.clickedLinks = [data.click?.link];
      } else {
        updateData.clickedLinks = admin.firestore.FieldValue.arrayUnion(data.click?.link);
      }
    } else if (type === 'email.bounced') {
      updateData.bouncedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.bounceReason = data.bounce?.message || 'Unknown';
    } else if (type === 'email.delivered') {
      updateData.deliveredAt = admin.firestore.FieldValue.serverTimestamp();
    }

    if (emailDoc.exists) {
      await emailRef.update(updateData);
    } else {
      // Create email record if it doesn't exist
      await emailRef.set({
        ...updateData,
        to: data.to?.[0] || null,
        subject: data.subject || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Log high-value events (opens/clicks)
    if (type === 'email.opened' || type === 'email.clicked') {
      const action = type === 'email.opened' ? '👀 Opened' : '🖱️ Clicked';
      const linkInfo = type === 'email.clicked' ? ` → ${data.click?.link}` : '';
      console.log(`📊 ${action}: ${data.to?.[0] || 'Unknown'}${linkInfo}`);
    }

    response.json({ success: true, event: type });

  } catch (error) {
    console.error("❌ Resend webhook error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * MOCK DATA GENERATORS (for testing when APIs not configured)
 */
function generateMockPipelineAResults(count) {
  const types = ['consulting', 'accounting', 'marketing', 'legal'];
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push({
      source: 'google_places_mock',
      sourceId: `mock_${Date.now()}_${i}`,
      companyName: `${types[i % types.length].charAt(0).toUpperCase() + types[i % types.length].slice(1)} Firm ${i + 1}`,
      rawData: {
        name: `Mock Business ${i + 1}`,
        address: '123 Main St, San Francisco, CA',
        types: [types[i % types.length]],
        rating: 4.5,
        userRatingsTotal: 100
      },
      pipeline: 'A',
      mock: true
    });
  }
  return results;
}

function generateMockProductHuntResults(count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push({
      source: 'producthunt_mock',
      sourceId: `ph_mock_${Date.now()}_${i}`,
      companyName: `ProductHunt Launch ${i + 1}`,
      rawData: {
        name: `Digital Product ${i + 1}`,
        tagline: 'An innovative digital solution',
        votesCount: Math.floor(Math.random() * 500),
        launchDate: new Date().toISOString()
      },
      pipeline: 'B',
      mock: true
    });
  }
  return results;
}

// ============================================
// Headshot Sourcing (Client A Use Case)
// ============================================

/**
 * Headshot Prospect Industries
 * Businesses most likely to need professional headshots
 */
const HEADSHOT_INDUSTRIES = {
  high_priority: [
    'law_firm',
    'lawyer',
    'real_estate_agency',
    'insurance_agency',
    'financial_advisor',
    'accounting',
    'finance'
  ],
  medium_priority: [
    'executive_coaching',
    'business_consultant',
    'consulting',
    'marketing_agency',
    'recruitment_agency',
    'employment_agency'
  ],
  lower_priority: [
    'corporate_office',
    'insurance_company',
    'bank'
  ]
};

/**
 * Discover Headshot Prospects
 *
 * Uses Google Places to find businesses likely to need professional headshots.
 * Targets: Law firms, real estate, financial advisors, consultants, etc.
 */
exports.discoverHeadshotProspects = functions
  .runWith({ memory: '512MB', timeoutSeconds: 120 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return response.status(401).json({ error: authResult.error || "Unauthorized" });
    }

    try {
      const {
        location = "San Francisco, CA",
        lat,
        lng,
        radius = 25000,  // 25km default (closer targeting for local photography)
        industries = 'all',  // 'high', 'medium', 'lower', 'all', or array of types
        maxResults = 30,
        dryRun = false
      } = request.body;

      const googlePlacesKey = functions.config().googleplaces?.api_key;

      if (!googlePlacesKey || googlePlacesKey === "PLACEHOLDER_GOOGLE_PLACES") {
        return response.json({
          warning: "Google Places API not configured",
          configured: false,
          hint: "Set API key via: firebase functions:config:set googleplaces.api_key=YOUR_KEY",
          mockResults: generateMockHeadshotProspects(maxResults)
        });
      }

      // Get coordinates
      let searchLat = lat;
      let searchLng = lng;

      if (!searchLat || !searchLng) {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${googlePlacesKey}`;
        const geocodeRes = await fetch(geocodeUrl);
        const geocodeData = await geocodeRes.json();

        if (geocodeData.status === "OK" && geocodeData.results?.length > 0) {
          searchLat = geocodeData.results[0].geometry.location.lat;
          searchLng = geocodeData.results[0].geometry.location.lng;
        } else {
          return response.status(400).json({
            error: `Failed to geocode location: ${location}`,
            hint: "Provide lat/lng coordinates directly or use a valid city name"
          });
        }
      }

      // Determine which industry types to search
      let typesToSearch = [];
      if (industries === 'all') {
        typesToSearch = [
          ...HEADSHOT_INDUSTRIES.high_priority,
          ...HEADSHOT_INDUSTRIES.medium_priority
        ];
      } else if (industries === 'high') {
        typesToSearch = HEADSHOT_INDUSTRIES.high_priority;
      } else if (industries === 'medium') {
        typesToSearch = HEADSHOT_INDUSTRIES.medium_priority;
      } else if (industries === 'lower') {
        typesToSearch = HEADSHOT_INDUSTRIES.lower_priority;
      } else if (Array.isArray(industries)) {
        typesToSearch = industries;
      }

      const results = [];
      const errors = [];

      // Search each business type
      for (const businessType of typesToSearch) {
        try {
          const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
            `location=${searchLat},${searchLng}&` +
            `radius=${radius}&` +
            `type=${businessType}&` +
            `key=${googlePlacesKey}`;

          const placesResponse = await fetch(searchUrl);
          const placesData = await placesResponse.json();

          if (placesData.status === "OK" && placesData.results) {
            for (const place of placesData.results.slice(0, Math.ceil(maxResults / typesToSearch.length))) {
              // Score the prospect based on rating and reviews
              const qualityScore = calculateHeadshotQualityScore(place);

              results.push({
                source: 'google_places',
                sourceId: place.place_id,
                companyName: place.name,
                industry: businessType,
                qualityScore,
                rawData: {
                  name: place.name,
                  address: place.vicinity,
                  types: place.types,
                  rating: place.rating,
                  userRatingsTotal: place.user_ratings_total,
                  businessStatus: place.business_status,
                  location: place.geometry?.location
                },
                prospectType: 'headshot',
                priority: HEADSHOT_INDUSTRIES.high_priority.includes(businessType) ? 'high' :
                  HEADSHOT_INDUSTRIES.medium_priority.includes(businessType) ? 'medium' : 'lower'
              });
            }
          }
        } catch (error) {
          errors.push({ type: businessType, error: error.message });
        }
      }

      // Sort by quality score
      results.sort((a, b) => b.qualityScore - a.qualityScore);

      // Store prospects if not dry run
      let stored = 0;
      if (!dryRun) {
        for (const prospect of results) {
          try {
            const docId = `headshot_${prospect.source}_${prospect.sourceId}`;
            await db.collection('headshot_prospects').doc(docId).set({
              ...prospect,
              discoveredAt: admin.firestore.FieldValue.serverTimestamp(),
              status: 'new',
              enriched: false,
              contacted: false
            });
            stored++;
          } catch (err) {
            console.error(`Failed to store ${prospect.companyName}:`, err.message);
          }
        }
      }

      // Track API usage
      const geocodeUsed = (!lat || !lng) ? 1 : 0;
      const today = new Date().toISOString().split('T')[0];
      await db.collection('api_usage').doc(today).set({
        googlePlacesCallsUsed: admin.firestore.FieldValue.increment(typesToSearch.length + geocodeUsed),
        headshotDiscoveries: admin.firestore.FieldValue.increment(stored),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      response.json({
        success: true,
        useCase: 'headshot_sourcing',
        discovered: results.length,
        stored,
        dryRun,
        location,
        industries: typesToSearch,
        byPriority: {
          high: results.filter(r => r.priority === 'high').length,
          medium: results.filter(r => r.priority === 'medium').length,
          lower: results.filter(r => r.priority === 'lower').length
        },
        topProspects: results.slice(0, 5).map(p => ({
          name: p.companyName,
          industry: p.industry,
          score: p.qualityScore,
          address: p.rawData.address
        })),
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error("❌ discoverHeadshotProspects error:", error);
      response.status(500).json({ error: error.message });
    }
  });

/**
 * Import Headshot Prospects from CSV
 *
 * Accepts array of prospects with: name, company, email, phone, industry, notes
 */
exports.importHeadshotProspectsCSV = functions
  .runWith({ memory: '512MB', timeoutSeconds: 120 })
  .https.onRequest(async (request, response) => {
    setCors(response);
    if (request.method === "OPTIONS") {
      return response.status(204).send("");
    }

    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return response.status(401).json({ error: authResult.error || "Unauthorized" });
    }

    try {
      const { prospects, dryRun = false, source = 'csv_import' } = request.body;

      if (!prospects || !Array.isArray(prospects)) {
        return response.status(400).json({
          error: "Missing 'prospects' array in request body",
          expectedFormat: {
            prospects: [
              {
                name: "John Smith (optional, contact name)",
                company: "Acme Law Firm (required)",
                email: "john@acmelaw.com (optional)",
                phone: "415-555-1234 (optional)",
                industry: "law_firm (optional)",
                notes: "Met at networking event (optional)",
                address: "123 Main St, SF (optional)"
              }
            ]
          }
        });
      }

      if (prospects.length > 100) {
        return response.status(400).json({
          error: "Maximum 100 prospects per import",
          received: prospects.length
        });
      }

      const results = {
        success: [],
        errors: [],
        duplicates: []
      };

      for (const prospect of prospects) {
        if (!prospect.company) {
          results.errors.push({
            prospect,
            error: "Missing required 'company' field"
          });
          continue;
        }

        // Generate unique ID from company name
        const docId = `headshot_csv_${prospect.company.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        // Check for duplicates
        const existing = await db.collection('headshot_prospects').doc(docId).get();
        if (existing.exists) {
          results.duplicates.push({
            company: prospect.company,
            existingId: docId
          });
          continue;
        }

        if (!dryRun) {
          try {
            await db.collection('headshot_prospects').doc(docId).set({
              source,
              sourceId: docId,
              companyName: prospect.company,
              contactName: prospect.name || null,
              email: prospect.email || null,
              phone: prospect.phone || null,
              industry: prospect.industry || 'unknown',
              notes: prospect.notes || null,
              address: prospect.address || null,
              qualityScore: prospect.email ? 70 : 50,  // Higher score if email provided
              prospectType: 'headshot',
              priority: HEADSHOT_INDUSTRIES.high_priority.includes(prospect.industry) ? 'high' :
                HEADSHOT_INDUSTRIES.medium_priority.includes(prospect.industry) ? 'medium' : 'standard',
              discoveredAt: admin.firestore.FieldValue.serverTimestamp(),
              status: 'new',
              enriched: false,
              contacted: false
            });
            results.success.push(prospect.company);
          } catch (err) {
            results.errors.push({
              company: prospect.company,
              error: err.message
            });
          }
        } else {
          results.success.push(prospect.company);
        }
      }

      response.json({
        success: true,
        useCase: 'headshot_sourcing',
        dryRun,
        imported: results.success.length,
        duplicates: results.duplicates.length,
        errors: results.errors.length,
        details: {
          imported: results.success,
          duplicates: results.duplicates,
          errors: results.errors
        }
      });

    } catch (error) {
      console.error("❌ importHeadshotProspectsCSV error:", error);
      response.status(500).json({ error: error.message });
    }
  });

/**
 * Get Headshot Prospects
 *
 * Retrieve and filter headshot prospects for outreach
 */
exports.getHeadshotProspects = functions.https.onRequest(async (request, response) => {
  setCors(response);
  if (request.method === "OPTIONS") {
    return response.status(204).send("");
  }

  const authResult = await verifyAdminAuth(request);
  if (!authResult.success) {
    return response.status(401).json({ error: authResult.error || "Unauthorized" });
  }

  try {
    const {
      status = 'new',
      priority,
      industry,
      limit = 50,
      orderBy = 'qualityScore'
    } = request.query;

    let query = db.collection('headshot_prospects');

    // Filter by status
    if (status !== 'all') {
      query = query.where('status', '==', status);
    }

    // Filter by priority
    if (priority) {
      query = query.where('priority', '==', priority);
    }

    // Filter by industry
    if (industry) {
      query = query.where('industry', '==', industry);
    }

    // Order and limit
    query = query.orderBy(orderBy, 'desc').limit(parseInt(limit, 10));

    const snapshot = await query.get();
    const prospects = [];

    snapshot.forEach(doc => {
      prospects.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Get stats
    const statsSnapshot = await db.collection('headshot_prospects').get();
    const stats = {
      total: statsSnapshot.size,
      byStatus: {},
      byPriority: {},
      byIndustry: {}
    };

    statsSnapshot.forEach(doc => {
      const data = doc.data();
      stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;
      stats.byPriority[data.priority] = (stats.byPriority[data.priority] || 0) + 1;
      stats.byIndustry[data.industry] = (stats.byIndustry[data.industry] || 0) + 1;
    });

    response.json({
      success: true,
      prospects,
      count: prospects.length,
      stats
    });

  } catch (error) {
    console.error("❌ getHeadshotProspects error:", error);
    response.status(500).json({ error: error.message });
  }
});

/**
 * Calculate quality score for headshot prospect
 */
function calculateHeadshotQualityScore(place) {
  let score = 50;  // Base score

  // Rating bonus (0-20 points)
  if (place.rating) {
    score += Math.min(20, place.rating * 4);
  }

  // Reviews bonus (0-15 points based on review count)
  if (place.user_ratings_total) {
    score += Math.min(15, Math.floor(place.user_ratings_total / 10));
  }

  // Business status bonus
  if (place.business_status === 'OPERATIONAL') {
    score += 10;
  }

  // Cap at 100
  return Math.min(100, score);
}

/**
 * Generate mock headshot prospects for testing
 */
function generateMockHeadshotProspects(count) {
  const industries = ['law_firm', 'real_estate_agency', 'financial_advisor', 'consulting'];
  const results = [];

  for (let i = 0; i < count; i++) {
    const industry = industries[i % industries.length];
    results.push({
      source: 'mock',
      sourceId: `mock_headshot_${Date.now()}_${i}`,
      companyName: `${industry.replace('_', ' ')} Company ${i + 1}`,
      industry,
      qualityScore: Math.floor(Math.random() * 50) + 50,
      rawData: {
        address: `${100 + i} Main Street`,
        rating: 4.0 + Math.random(),
        userRatingsTotal: Math.floor(Math.random() * 100)
      },
      prospectType: 'headshot',
      priority: i < 10 ? 'high' : i < 20 ? 'medium' : 'lower',
      mock: true
    });
  }
  return results;
}
