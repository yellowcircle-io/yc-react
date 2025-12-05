/**
 * Generate Proxy - Call backend proxy for hosted generation
 *
 * Uses Firebase Cloud Function to generate content without exposing API keys.
 * Rate limited to 3 requests/day per IP.
 *
 * Usage:
 * const result = await generateViaProxy(prompt, stage);
 * if (result.success) { console.log(result.content); }
 */

const PROXY_URL = '/api/generate';

/**
 * Generate content via backend proxy
 *
 * @param {string} prompt - The prompt to send to the LLM
 * @param {string} stage - Email stage (initial, followup1, followup2, single)
 * @param {object} context - Additional context (optional)
 * @returns {Promise<{success: boolean, content?: string, creditsRemaining?: number, error?: string}>}
 */
export const generateViaProxy = async (prompt, stage = 'unknown', context = {}) => {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        stage,
        context,
      }),
    });

    // Get rate limit info from headers
    const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10);

    if (!response.ok) {
      const error = await response.json();

      // Rate limit exceeded
      if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Enter your own API key to continue.',
          creditsRemaining: 0,
          rateLimited: true,
        };
      }

      return {
        success: false,
        error: error.error || 'Proxy request failed',
        creditsRemaining: remaining,
      };
    }

    const data = await response.json();

    return {
      success: true,
      content: data.content,
      stage: data.stage,
      creditsRemaining: data.creditsRemaining ?? remaining,
    };
  } catch (error) {
    console.error('[Proxy] Generate failed:', error);

    // Network error - proxy might not be deployed yet
    return {
      success: false,
      error: 'Proxy unavailable. Please enter your own API key.',
      proxyUnavailable: true,
    };
  }
};

/**
 * Check if proxy is available (health check)
 */
export const checkProxyHealth = async () => {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return false;

    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
};

/**
 * Check if proxy should be used (no user API key + free credits remaining)
 *
 * @param {string} userApiKey - User's own API key
 * @param {number} freeCreditsRemaining - Free credits remaining in localStorage
 * @returns {boolean}
 */
export const shouldUseProxy = (userApiKey, freeCreditsRemaining) => {
  // If user has their own key, don't use proxy
  if (userApiKey && userApiKey.trim()) {
    return false;
  }

  // If free credits remain, use proxy
  return freeCreditsRemaining > 0;
};
