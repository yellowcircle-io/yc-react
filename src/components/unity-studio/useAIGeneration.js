/**
 * useAIGeneration Hook
 *
 * AI-powered content generation for ad copy, social posts, and email content.
 * Uses the existing yellowCircle Groq API integration.
 *
 * Features:
 * - Platform-aware character limits
 * - Multiple variant generation
 * - Campaign type templates
 * - Brand voice customization
 *
 * Created: December 2025
 */

import { useState, useCallback, useEffect } from 'react';
import { TEXT_LIMITS } from './platform-specs';

// API endpoints by provider
const AI_PROVIDERS = {
  free: {
    name: 'Free (Template-Based)',
    endpoint: null, // Uses local template generation
    description: 'No API calls - uses smart templates',
    rateLimit: null,
    icon: '🆓'
  },
  standard: {
    name: 'Standard (Groq)',
    endpoint: 'https://us-central1-yellowcircle-app.cloudfunctions.net/generate',
    description: '10 generations/day',
    rateLimit: 10,
    icon: '⚡'
  },
  premium: {
    name: 'Premium (Coming Soon)',
    endpoint: null,
    description: 'Unlimited generations - $9/mo',
    rateLimit: null,
    icon: '💎',
    disabled: true
  }
};

// Local storage key for rate limit tracking
const RATE_LIMIT_KEY = 'unity-studio-ai-usage';

// Groq endpoint for legacy functions
const GROQ_ENDPOINT = 'https://us-central1-yellowcircle-app.cloudfunctions.net/generate';

// Campaign types with prompts
const CAMPAIGN_TYPES = {
  awareness: {
    name: 'Brand Awareness',
    goal: 'introduce your brand and build recognition',
    tone: 'friendly, professional, memorable'
  },
  leadgen: {
    name: 'Lead Generation',
    goal: 'capture interest and generate leads',
    tone: 'compelling, value-focused, action-oriented'
  },
  conversion: {
    name: 'Conversion',
    goal: 'drive immediate action and purchases',
    tone: 'urgent, benefit-driven, persuasive'
  },
  engagement: {
    name: 'Engagement',
    goal: 'encourage interaction and community building',
    tone: 'conversational, relatable, engaging'
  },
  retargeting: {
    name: 'Retargeting',
    goal: 'bring back interested visitors',
    tone: 'familiar, reminder-focused, personalized'
  }
};

// Platform-specific guidance
const PLATFORM_GUIDANCE = {
  instagram: {
    style: 'visual-first, lifestyle-oriented, hashtag-friendly',
    tips: 'Use emojis sparingly but effectively. Focus on visual storytelling.'
  },
  facebook: {
    style: 'conversational, community-focused, shareable',
    tips: 'Ask questions to drive engagement. Use storytelling.'
  },
  linkedin: {
    style: 'professional, thought-leadership, value-driven',
    tips: 'Focus on business value. Use industry terminology appropriately.'
  },
  reddit: {
    style: 'authentic, non-promotional, community-aware',
    tips: 'Avoid hard sells. Be transparent and helpful. Match subreddit tone.'
  },
  google: {
    style: 'direct, benefit-focused, action-oriented',
    tips: 'Front-load value. Include keywords naturally. Clear CTAs.'
  }
};

/**
 * Get today's usage count from localStorage
 */
function getUsageToday() {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) return { count: 0, date: new Date().toDateString() };

    const data = JSON.parse(stored);
    // Reset if it's a new day
    if (data.date !== new Date().toDateString()) {
      return { count: 0, date: new Date().toDateString() };
    }
    return data;
  } catch {
    return { count: 0, date: new Date().toDateString() };
  }
}

/**
 * Increment usage count
 */
function incrementUsage() {
  const usage = getUsageToday();
  usage.count += 1;
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(usage));
  return usage.count;
}

/**
 * Generate template-based content (free tier)
 */
function generateFromTemplate({
  brand,
  product,
  targetAudience,
  campaignType,
  platform: _platform
}) {
  const templates = {
    awareness: [
      {
        headline: `Discover ${brand || 'Our Solution'}`,
        body: `${targetAudience || 'Professionals'}, meet ${product || 'your new favorite tool'}. Built for people who value quality and results.`,
        cta: 'Learn More'
      },
      {
        headline: `Why ${targetAudience || 'Everyone'} Love ${brand || 'Us'}`,
        body: `${product || 'Our solution'} helps you achieve more with less effort. See the difference for yourself.`,
        cta: 'Get Started'
      },
      {
        headline: `${brand || 'We'} + ${targetAudience || 'You'} = Success`,
        body: `${product || 'Our product'} was designed with ${targetAudience || 'you'} in mind. Experience the difference.`,
        cta: 'Try Free'
      }
    ],
    leadgen: [
      {
        headline: `Free Guide: Master ${product || 'Your Goals'}`,
        body: `${targetAudience || 'Smart professionals'} are downloading this guide to level up. Get instant access today.`,
        cta: 'Download Free'
      },
      {
        headline: `${targetAudience || 'You'}: Don't Miss This`,
        body: `${brand || 'We'} created something special for ${targetAudience || 'you'}. See how ${product || 'our solution'} can transform your results.`,
        cta: 'Get Access'
      },
      {
        headline: `Unlock ${product || 'Better Results'} Today`,
        body: `Join thousands of ${targetAudience || 'professionals'} who've discovered the ${brand || ''} advantage.`,
        cta: 'Start Free Trial'
      }
    ],
    conversion: [
      {
        headline: `${product || 'This'} Changes Everything`,
        body: `Limited time offer for ${targetAudience || 'action-takers'}. Get ${product || 'started'} with ${brand || 'us'} today.`,
        cta: 'Buy Now'
      },
      {
        headline: `Last Chance: ${product || 'Special Offer'}`,
        body: `${targetAudience || 'You'}: This deal won't last. Get ${product || 'results'} at the best price.`,
        cta: 'Claim Offer'
      },
      {
        headline: `Transform Your Results with ${brand || 'Us'}`,
        body: `${product || 'Our solution'} delivers real results for ${targetAudience || 'people like you'}. Start seeing changes today.`,
        cta: 'Get Started'
      }
    ],
    engagement: [
      {
        headline: `${targetAudience || 'Community'}, We Want to Hear From You!`,
        body: `What's your biggest challenge with ${product || 'this topic'}? Share below and let's solve it together.`,
        cta: 'Join Discussion'
      },
      {
        headline: `A Question for ${targetAudience || 'You'}...`,
        body: `If you could change one thing about ${product || 'your workflow'}, what would it be? ${brand || 'We'} are listening.`,
        cta: 'Share Thoughts'
      },
      {
        headline: `Behind the Scenes at ${brand || 'Our Company'}`,
        body: `Ever wonder how ${product || 'we do what we do'}? Here's an inside look for ${targetAudience || 'our community'}.`,
        cta: 'Learn More'
      }
    ],
    retargeting: [
      {
        headline: `Still Thinking About ${product || 'Us'}?`,
        body: `${targetAudience || 'You'} were so close! Come back to ${brand || 'us'} and finish what you started.`,
        cta: 'Complete Purchase'
      },
      {
        headline: `We Saved Your Spot`,
        body: `${product || 'What you wanted'} is still waiting for you. ${targetAudience || 'Smart buyers'} know a good deal when they see one.`,
        cta: 'Return Now'
      },
      {
        headline: `${brand || 'We'} Miss You!`,
        body: `It's been a while, ${targetAudience || 'friend'}. Come see what's new with ${product || 'us'}.`,
        cta: 'See What\'s New'
      }
    ]
  };

  const campaignTemplates = templates[campaignType] || templates.awareness;
  return {
    variants: campaignTemplates,
    rawResponse: 'Generated from templates (Free tier)'
  };
}

/**
 * useAIGeneration Hook
 *
 * @returns {Object} AI generation methods and state
 */
export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [lastGeneration, setLastGeneration] = useState(null);
  const [provider, setProvider] = useState('free'); // 'free' | 'standard' | 'premium'
  const [usageCount, setUsageCount] = useState(0);

  // Load usage count on mount
  useEffect(() => {
    setUsageCount(getUsageToday().count);
  }, []);

  // Check if rate limited
  const isRateLimited = provider === 'standard' && usageCount >= (AI_PROVIDERS.standard.rateLimit || 10);
  const remainingGenerations = provider === 'standard'
    ? Math.max(0, (AI_PROVIDERS.standard.rateLimit || 10) - usageCount)
    : null;

  /**
   * Generate ad copy for a specific platform
   *
   * @param {Object} params - Generation parameters
   * @param {string} params.platform - Target platform (instagram, facebook, linkedin, reddit, google)
   * @param {string} params.campaignType - Campaign type (awareness, leadgen, conversion, engagement, retargeting)
   * @param {string} params.brand - Brand/company name
   * @param {string} params.product - Product or service being advertised
   * @param {string} params.targetAudience - Description of target audience
   * @param {string} params.uniqueValue - Unique value proposition
   * @param {string} params.tone - Optional custom tone override
   * @param {number} params.variants - Number of variants to generate (default: 3)
   *
   * @returns {Promise<Object>} Generated content with variants
   */
  const generateAdCopy = useCallback(async ({
    platform,
    campaignType = 'awareness',
    brand,
    product,
    targetAudience,
    uniqueValue,
    tone,
    variants = 3
  }) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Free tier: Use template-based generation
      if (provider === 'free') {
        // Small delay to simulate generation
        await new Promise(resolve => setTimeout(resolve, 500));

        const templateResult = generateFromTemplate({
          brand,
          product,
          targetAudience,
          campaignType,
          platform
        });

        setLastGeneration({
          platform,
          campaignType,
          result: templateResult,
          generatedAt: new Date().toISOString(),
          provider: 'free'
        });

        return templateResult;
      }

      // Standard tier: Check rate limits
      if (provider === 'standard') {
        const currentUsage = getUsageToday().count;
        const limit = AI_PROVIDERS.standard.rateLimit || 10;

        if (currentUsage >= limit) {
          throw new Error(`Rate limit exceeded (${limit}/day). Switch to Free tier or try again tomorrow.`);
        }
      }

      const limits = TEXT_LIMITS[platform] || TEXT_LIMITS.facebook_feed;
      const campaign = CAMPAIGN_TYPES[campaignType] || CAMPAIGN_TYPES.awareness;
      const guidance = PLATFORM_GUIDANCE[platform] || PLATFORM_GUIDANCE.facebook;

      const prompt = buildAdCopyPrompt({
        platform,
        limits,
        campaign,
        guidance,
        brand,
        product,
        targetAudience,
        uniqueValue,
        tone: tone || campaign.tone,
        variants
      });

      const endpoint = AI_PROVIDERS.standard.endpoint;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          contentType: 'adCopy',
          maxTokens: 1500,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || `Server error (${response.status})`;
        // Include details if available (contains actual Groq API error)
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.content) {
        throw new Error('No content returned from API');
      }

      // Increment usage count on successful API call
      const newCount = incrementUsage();
      setUsageCount(newCount);

      const parsedResult = parseAdCopyResponse(data.content, variants);

      setLastGeneration({
        platform,
        campaignType,
        result: parsedResult,
        generatedAt: new Date().toISOString(),
        provider: 'standard'
      });

      return parsedResult;
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err.message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [provider]);

  /**
   * Generate email subject lines
   *
   * @param {Object} params - Generation parameters
   * @param {string} params.topic - Email topic/purpose
   * @param {string} params.audience - Target audience
   * @param {string} params.tone - Desired tone
   * @param {number} params.variants - Number of variants (default: 5)
   *
   * @returns {Promise<string[]>} Array of subject line options
   */
  const generateEmailSubjects = useCallback(async ({
    topic,
    audience,
    tone = 'professional',
    variants = 5
  }) => {
    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `Generate ${variants} compelling email subject lines for the following:

Topic: ${topic}
Target Audience: ${audience}
Tone: ${tone}

Requirements:
- Each subject line should be under 50 characters for best deliverability
- Create variety: some with urgency, some curiosity-driven, some benefit-focused
- Avoid spam trigger words
- Make them feel personal but professional

Format your response as a numbered list (1-${variants}).`;

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          maxTokens: 500,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate subjects');
      }

      const data = await response.json();
      const subjects = parseListResponse(data.content || data.text, variants);

      setLastGeneration({
        type: 'email_subjects',
        topic,
        result: subjects,
        generatedAt: new Date().toISOString()
      });

      return subjects;
    } catch (err) {
      console.error('Email subject generation error:', err);
      setError(err.message);
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Generate social media hashtags
   *
   * @param {Object} params - Generation parameters
   * @param {string} params.topic - Content topic
   * @param {string} params.industry - Industry/niche
   * @param {string} params.platform - Target platform (instagram, linkedin, etc.)
   * @param {number} params.count - Number of hashtags (default: 10)
   *
   * @returns {Promise<string[]>} Array of hashtags
   */
  const generateHashtags = useCallback(async ({
    topic,
    industry,
    platform = 'instagram',
    count = 10
  }) => {
    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `Generate ${count} relevant hashtags for a ${platform} post about:

Topic: ${topic}
Industry: ${industry}

Requirements:
- Mix of popular (high reach) and niche (high engagement) hashtags
- No banned or overused hashtags
- Relevant to the topic and industry
- Format: #lowercase without spaces

Return only the hashtags, one per line, starting with #.`;

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          maxTokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate hashtags');
      }

      const data = await response.json();
      const text = data.content || data.text;
      const hashtags = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('#'))
        .slice(0, count);

      return hashtags;
    } catch (err) {
      console.error('Hashtag generation error:', err);
      setError(err.message);
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Generate call-to-action options
   *
   * @param {Object} params - Generation parameters
   * @param {string} params.action - Desired user action
   * @param {string} params.context - Context/offer description
   * @param {string} params.tone - Tone (urgent, friendly, professional)
   * @param {number} params.variants - Number of options (default: 5)
   *
   * @returns {Promise<string[]>} Array of CTA options
   */
  const generateCTAs = useCallback(async ({
    action,
    context,
    tone = 'compelling',
    variants = 5
  }) => {
    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `Generate ${variants} compelling call-to-action button texts for:

Desired Action: ${action}
Context: ${context}
Tone: ${tone}

Requirements:
- Each CTA should be 2-4 words maximum
- Action-oriented, starting with a verb
- Create urgency without being pushy
- Variety in approach (benefit-focused, action-focused, curiosity-focused)

Format as a numbered list (1-${variants}).`;

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          maxTokens: 300,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate CTAs');
      }

      const data = await response.json();
      const ctas = parseListResponse(data.content || data.text, variants);

      return ctas;
    } catch (err) {
      console.error('CTA generation error:', err);
      setError(err.message);
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Improve existing copy
   *
   * @param {Object} params - Parameters
   * @param {string} params.originalCopy - Copy to improve
   * @param {string} params.platform - Target platform
   * @param {string} params.improvement - What to improve (clarity, engagement, conversion, length)
   *
   * @returns {Promise<string>} Improved copy
   */
  const improveCopy = useCallback(async ({
    originalCopy,
    platform,
    improvement = 'engagement'
  }) => {
    setIsGenerating(true);
    setError(null);

    try {
      const limits = TEXT_LIMITS[platform] || {};
      const maxLength = limits.primary || limits.headline || 500;

      const prompt = `Improve the following ${platform} ad copy for better ${improvement}:

Original:
"${originalCopy}"

Requirements:
- Maximum ${maxLength} characters
- Maintain the core message
- ${improvement === 'clarity' ? 'Make it clearer and easier to understand' : ''}
- ${improvement === 'engagement' ? 'Make it more engaging and scroll-stopping' : ''}
- ${improvement === 'conversion' ? 'Make it more persuasive with stronger CTA' : ''}
- ${improvement === 'length' ? 'Make it more concise while keeping the impact' : ''}

Return only the improved copy, nothing else.`;

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          maxTokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to improve copy');
      }

      const data = await response.json();
      return (data.content || data.text).trim().replace(/^["']|["']$/g, '');
    } catch (err) {
      console.error('Copy improvement error:', err);
      setError(err.message);
      return originalCopy;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    // Methods
    generateAdCopy,
    generateEmailSubjects,
    generateHashtags,
    generateCTAs,
    improveCopy,

    // State
    isGenerating,
    error,
    lastGeneration,

    // Provider management
    provider,
    setProvider,
    usageCount,
    isRateLimited,
    remainingGenerations,

    // Constants
    CAMPAIGN_TYPES,
    PLATFORM_GUIDANCE,
    AI_PROVIDERS
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Build the prompt for ad copy generation
 */
function buildAdCopyPrompt({
  platform,
  limits,
  campaign,
  guidance,
  brand,
  product,
  targetAudience,
  uniqueValue,
  tone,
  variants
}) {
  const headlineLimit = limits.headline || limits.title || 70;
  const bodyLimit = limits.primary || limits.description || limits.intro || 300;

  return `You are an expert copywriter creating ${platform} ad copy for ${brand}.

Campaign Goal: ${campaign.goal}
Target Audience: ${targetAudience}
Product/Service: ${product}
Unique Value: ${uniqueValue}

Platform Style: ${guidance.style}
Platform Tips: ${guidance.tips}
Tone: ${tone}

Character Limits:
- Headline: ${headlineLimit} characters max
- Body: ${bodyLimit} characters max

Generate ${variants} distinct ad copy variants. Each variant should have a different angle or hook.

Format each variant exactly like this:
---
VARIANT 1
Headline: [headline text]
Body: [body copy text]
CTA: [call-to-action button text]
---

Rules:
- Stay within character limits
- Make each variant genuinely different (different hooks, angles, or approaches)
- Include a clear call-to-action
- Match the platform's native content style
- Focus on benefits, not just features`;
}

/**
 * Parse the AI response into structured ad copy variants
 */
function parseAdCopyResponse(text, expectedVariants) {
  const variants = [];
  const variantBlocks = text.split(/---+/).filter(block => block.trim());

  for (const block of variantBlocks) {
    if (variants.length >= expectedVariants) break;

    const lines = block.trim().split('\n');
    const variant = {
      headline: '',
      body: '',
      cta: ''
    };

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('headline:')) {
        variant.headline = line.substring(9).trim();
      } else if (lowerLine.startsWith('body:')) {
        variant.body = line.substring(5).trim();
      } else if (lowerLine.startsWith('cta:')) {
        variant.cta = line.substring(4).trim();
      }
    }

    // Only add if we have at least headline and body
    if (variant.headline && variant.body) {
      variants.push(variant);
    }
  }

  // If parsing failed, try to extract something useful
  if (variants.length === 0) {
    variants.push({
      headline: 'Check out what we have for you',
      body: text.substring(0, 300).trim(),
      cta: 'Learn More'
    });
  }

  return {
    variants,
    rawResponse: text
  };
}

/**
 * Parse a numbered list response
 */
function parseListResponse(text, expectedCount) {
  const items = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines starting with number, bullet, or dash
    const match = trimmed.match(/^(?:\d+[.):?]?\s*|[-•*]\s*)(.+)$/);
    if (match) {
      items.push(match[1].trim().replace(/^["']|["']$/g, ''));
    }
  }

  return items.slice(0, expectedCount);
}

export default useAIGeneration;
