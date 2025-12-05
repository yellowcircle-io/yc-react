/**
 * Resend ESP Adapter
 * FREE tier: 100 emails/day, 3,000/month
 *
 * Docs: https://resend.com/docs
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

const DEFAULT_FROM = 'yellowCircle <hello@yellowcircle.io>';

/**
 * Send a single email via Resend
 * @param {object} options - Email options
 * @returns {Promise<{ id, status }>}
 */
const sendEmail = async (options) => {
  const apiKey = options.apiKey || import.meta.env.VITE_RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('Resend API key not configured. Set VITE_RESEND_API_KEY in .env');
  }

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
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        reply_to: replyTo,
        tags: tags.map(tag => ({ name: tag.name || tag, value: tag.value || tag })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: 'sent',
      provider: 'resend',
    };
  } catch (error) {
    console.error('Resend send error:', error);
    return {
      id: null,
      status: 'failed',
      error: error.message,
      provider: 'resend',
    };
  }
};

/**
 * Send batch emails via Resend
 * @param {Array} emails - Array of email options
 * @returns {Promise<{ sent, failed }>}
 */
const sendBatch = async (emails, options = {}) => {
  const apiKey = options.apiKey || import.meta.env.VITE_RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('Resend API key not configured');
  }

  const results = {
    sent: [],
    failed: [],
  };

  // Resend supports batch API, but for simplicity, send sequentially
  for (const email of emails) {
    const result = await sendEmail({ ...email, apiKey });
    if (result.status === 'sent') {
      results.sent.push(result);
    } else {
      results.failed.push({ ...result, email: email.to });
    }
  }

  return results;
};

/**
 * Check if API key is configured
 */
const isConfigured = () => !!import.meta.env.VITE_RESEND_API_KEY;

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
