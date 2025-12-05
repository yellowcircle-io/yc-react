/**
 * Resend ESP Adapter
 * FREE tier: 100 emails/day, 3,000/month
 *
 * Uses Firebase Function proxy to avoid CORS issues.
 * Docs: https://resend.com/docs
 */

// Firebase Function URL (deployed gen1 function)
const FIREBASE_SEND_EMAIL_URL = 'https://us-central1-yellowcircle-app.cloudfunctions.net/sendEmail';

const DEFAULT_FROM = 'yellowCircle <hello@yellowcircle.io>';

/**
 * Send a single email via Firebase Function (proxies to Resend)
 * @param {object} options - Email options
 * @returns {Promise<{ id, status }>}
 */
const sendEmail = async (options) => {
  const {
    to,
    from = DEFAULT_FROM,
    subject,
    html,
    text,
    replyTo,
    tags = [],
  } = options;

  try {
    const response = await fetch(FIREBASE_SEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        replyTo,
        tags: tags.map(tag => ({ name: tag.name || tag, value: tag.value || tag })),
      }),
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Send failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Response wasn't JSON (e.g., 404 page)
        if (response.status === 404) {
          errorMessage = 'Email service not deployed. Run: firebase deploy --only functions:sendEmail';
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status || 'sent',
      provider: 'resend',
    };
  } catch (error) {
    console.error('Resend send error:', error);

    // Check for network errors (function not deployed)
    const isNetworkError = error.message?.includes('NetworkError') ||
                           error.message?.includes('Failed to fetch');

    return {
      id: null,
      status: 'failed',
      error: isNetworkError
        ? 'Email service unavailable. Firebase Function needs to be deployed.'
        : error.message,
      provider: 'resend',
    };
  }
};

/**
 * Send batch emails via Firebase Function (proxies to Resend)
 * @param {Array} emails - Array of email options
 * @returns {Promise<{ sent, failed }>}
 */
const sendBatch = async (emails) => {
  const results = {
    sent: [],
    failed: [],
  };

  // Send sequentially through Firebase Function
  for (const email of emails) {
    const result = await sendEmail(email);
    if (result.status === 'sent') {
      results.sent.push(result);
    } else {
      results.failed.push({ ...result, email: email.to });
    }
  }

  return results;
};

/**
 * Check if sending is configured (always true - uses server-side key)
 */
const isConfigured = () => true;

/**
 * Get provider info
 */
const getInfo = () => ({
  name: 'Resend',
  freeTier: '100 emails/day',
  templateSupport: false,
  batchSupport: true,
});

export default {
  name: 'resend',
  sendEmail,
  sendBatch,
  isConfigured,
  getInfo,
  DEFAULT_FROM,
};
