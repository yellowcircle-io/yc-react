/**
 * Mailchimp ESP Adapter (Transactional via Mandrill)
 *
 * Mailchimp uses Mandrill for transactional emails.
 * Docs: https://mailchimp.com/developer/transactional/api/messages/
 */

const MANDRILL_API_URL = 'https://mandrillapp.com/api/1.0/messages/send.json';

const DEFAULT_FROM = {
  email: 'hello@yellowcircle.io',
  name: 'yellowCircle',
};

/**
 * Send a single email via Mandrill (Mailchimp Transactional)
 * @param {object} options - Email options
 * @returns {Promise<{ id, status }>}
 */
const sendEmail = async (options) => {
  const apiKey = options.apiKey || import.meta.env.VITE_MAILCHIMP_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Mailchimp API key not configured. Set VITE_MAILCHIMP_API_KEY in .env'
    );
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

  // Parse from address
  const fromEmail =
    typeof from === 'string'
      ? from.match(/<(.+)>/)?.[1] || from
      : from.email;
  const fromName =
    typeof from === 'string'
      ? from.match(/(.+) </)?.[1]?.trim() || ''
      : from.name;

  // Build recipients array
  const recipients = Array.isArray(to)
    ? to.map((email) => ({ email, type: 'to' }))
    : [{ email: to, type: 'to' }];

  const payload = {
    key: apiKey,
    message: {
      html,
      text,
      subject,
      from_email: fromEmail,
      from_name: fromName,
      to: recipients,
      headers: replyTo ? { 'Reply-To': replyTo } : {},
      tags: tags.map((tag) => tag.name || tag.value || tag),
      track_opens: true,
      track_clicks: true,
    },
    async: false, // Synchronous for immediate response
  };

  try {
    const response = await fetch(MANDRILL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Mandrill API error: ${error.message || response.statusText}`
      );
    }

    const data = await response.json();

    // Mandrill returns an array of results
    const result = Array.isArray(data) ? data[0] : data;

    if (result.status === 'rejected' || result.reject_reason) {
      return {
        id: result._id,
        status: 'failed',
        error: result.reject_reason || 'Message rejected',
        provider: 'mailchimp',
      };
    }

    return {
      id: result._id,
      status: result.status === 'sent' ? 'sent' : 'queued',
      provider: 'mailchimp',
    };
  } catch (error) {
    console.error('Mandrill send error:', error);
    return {
      id: null,
      status: 'failed',
      error: error.message,
      provider: 'mailchimp',
    };
  }
};

/**
 * Send batch emails via Mandrill
 * Uses Mandrill's native batch support
 * @param {Array} emails - Array of email options
 * @returns {Promise<{ sent, failed }>}
 */
const sendBatch = async (emails, options = {}) => {
  const apiKey = options.apiKey || import.meta.env.VITE_MAILCHIMP_API_KEY;

  if (!apiKey) {
    throw new Error('Mailchimp API key not configured');
  }

  const results = {
    sent: [],
    failed: [],
  };

  // Mandrill supports batch sending natively via array of recipients
  // But for different messages, we need to send sequentially
  for (const email of emails) {
    const result = await sendEmail({ ...email, apiKey });
    if (result.status === 'sent' || result.status === 'queued') {
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
const isConfigured = () => !!import.meta.env.VITE_MAILCHIMP_API_KEY;

/**
 * Get provider info
 */
const getInfo = () => ({
  name: 'Mailchimp (Mandrill)',
  freeTier: 'Pay-as-you-go after trial',
  templateSupport: true,
  batchSupport: true,
  note: 'Uses Mandrill for transactional emails',
});

export default {
  name: 'mailchimp',
  sendEmail,
  sendBatch,
  isConfigured,
  getInfo,
  DEFAULT_FROM,
};
