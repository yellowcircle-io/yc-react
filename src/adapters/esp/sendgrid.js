/**
 * SendGrid ESP Adapter
 * FREE tier: 100 emails/day
 *
 * Docs: https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

const DEFAULT_FROM = {
  email: 'hello@yellowcircle.io',
  name: 'yellowCircle',
};

/**
 * Send a single email via SendGrid
 * @param {object} options - Email options
 * @returns {Promise<{ id, status }>}
 */
const sendEmail = async (options) => {
  const apiKey = options.apiKey || import.meta.env.VITE_SENDGRID_API_KEY;

  if (!apiKey) {
    throw new Error('SendGrid API key not configured. Set VITE_SENDGRID_API_KEY in .env');
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

  // SendGrid uses a different payload structure
  const payload = {
    personalizations: [
      {
        to: Array.isArray(to)
          ? to.map((email) => ({ email }))
          : [{ email: to }],
      },
    ],
    from: typeof from === 'string'
      ? { email: from.match(/<(.+)>/)?.[1] || from, name: from.match(/(.+) </)?.[1]?.trim() }
      : from,
    subject,
    content: [],
  };

  // Add content types
  if (text) {
    payload.content.push({ type: 'text/plain', value: text });
  }
  if (html) {
    payload.content.push({ type: 'text/html', value: html });
  }

  // Add reply-to if provided
  if (replyTo) {
    payload.reply_to = { email: replyTo };
  }

  // Add categories (SendGrid's version of tags)
  if (tags.length > 0) {
    payload.categories = tags.map((tag) => tag.name || tag.value || tag);
  }

  try {
    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `SendGrid API error: ${error.errors?.[0]?.message || response.statusText}`
      );
    }

    // SendGrid returns 202 Accepted with message ID in header
    const messageId = response.headers.get('X-Message-Id');

    return {
      id: messageId,
      status: 'sent',
      provider: 'sendgrid',
    };
  } catch (error) {
    console.error('SendGrid send error:', error);
    return {
      id: null,
      status: 'failed',
      error: error.message,
      provider: 'sendgrid',
    };
  }
};

/**
 * Send batch emails via SendGrid
 * @param {Array} emails - Array of email options
 * @returns {Promise<{ sent, failed }>}
 */
const sendBatch = async (emails, options = {}) => {
  const apiKey = options.apiKey || import.meta.env.VITE_SENDGRID_API_KEY;

  if (!apiKey) {
    throw new Error('SendGrid API key not configured');
  }

  const results = {
    sent: [],
    failed: [],
  };

  // Send sequentially (could be optimized with batch API)
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
const isConfigured = () => !!import.meta.env.VITE_SENDGRID_API_KEY;

/**
 * Get provider info
 */
const getInfo = () => ({
  name: 'SendGrid',
  freeTier: '100 emails/day',
  templateSupport: true,
  batchSupport: true,
});

export default {
  name: 'sendgrid',
  sendEmail,
  sendBatch,
  isConfigured,
  getInfo,
  DEFAULT_FROM,
};
