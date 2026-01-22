/**
 * HubSpot ESP Adapter
 * Requires HubSpot Marketing Hub for transactional emails
 *
 * Docs: https://developers.hubspot.com/docs/api/marketing/transactional-emails
 *
 * Note: HubSpot transactional emails require a template ID.
 * For simple sends without templates, consider using Resend or SendGrid.
 */

const HUBSPOT_API_URL =
  'https://api.hubapi.com/marketing/v3/transactional/single-email/send';

const DEFAULT_FROM = {
  email: 'hello@yellowcircle.io',
  name: 'yellowCircle',
};

/**
 * Send a single email via HubSpot Transactional Email API
 * @param {object} options - Email options
 * @returns {Promise<{ id, status }>}
 */
const sendEmail = async (options) => {
  const apiKey = options.apiKey || import.meta.env.VITE_HUBSPOT_API_KEY;

  if (!apiKey) {
    throw new Error(
      'HubSpot API key not configured. Set VITE_HUBSPOT_API_KEY in .env'
    );
  }

  const {
    to,
    from = DEFAULT_FROM,
    subject: _subject,      // Reserved for SMTP API
    html: _html,            // Reserved for SMTP API
    text: _text,            // Reserved for SMTP API
    replyTo: _replyTo,      // Reserved for SMTP API
    templateId,
    customProperties = {},
  } = options;

  // HubSpot requires either a templateId or SMTP API token
  // For transactional emails, we use the SMTP API approach
  const payload = {
    emailId: templateId, // Required for transactional emails
    message: {
      to: Array.isArray(to) ? to[0] : to, // HubSpot transactional supports single recipient
      from: typeof from === 'string'
        ? from.match(/<(.+)>/)?.[1] || from
        : from.email,
      senderId: typeof from === 'string' ? null : from.senderId || null,
    },
    customProperties,
  };

  // If no template, use simple email endpoint (requires SMTP API)
  if (!templateId) {
    // Fall back to Marketing Email API for simple sends
    // This requires a published marketing email template
    console.warn(
      'HubSpot transactional emails require a templateId. Consider using Resend for template-free sends.'
    );

    // Attempt direct send via Single Send API
    const simpleSendUrl =
      'https://api.hubapi.com/marketing/v3/emails/single-send';
    const simpleSendPayload = {
      emailId: null, // Would need to create email first
      to: {
        email: Array.isArray(to) ? to[0] : to,
      },
    };

    try {
      const response = await fetch(simpleSendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(simpleSendPayload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `HubSpot API error: ${error.message || response.statusText}`
        );
      }

      const data = await response.json();
      return {
        id: data.sendResult?.id || data.id,
        status: 'sent',
        provider: 'hubspot',
      };
    } catch (error) {
      console.error('HubSpot send error:', error);
      return {
        id: null,
        status: 'failed',
        error: error.message,
        provider: 'hubspot',
      };
    }
  }

  try {
    const response = await fetch(HUBSPOT_API_URL, {
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
        `HubSpot API error: ${error.message || response.statusText}`
      );
    }

    const data = await response.json();

    return {
      id: data.sendResult?.id || data.id,
      status: data.sendResult?.status || 'sent',
      provider: 'hubspot',
    };
  } catch (error) {
    console.error('HubSpot send error:', error);
    return {
      id: null,
      status: 'failed',
      error: error.message,
      provider: 'hubspot',
    };
  }
};

/**
 * Send batch emails via HubSpot
 * @param {Array} emails - Array of email options
 * @returns {Promise<{ sent, failed }>}
 */
const sendBatch = async (emails, options = {}) => {
  const apiKey = options.apiKey || import.meta.env.VITE_HUBSPOT_API_KEY;

  if (!apiKey) {
    throw new Error('HubSpot API key not configured');
  }

  const results = {
    sent: [],
    failed: [],
  };

  // Send sequentially
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
const isConfigured = () => !!import.meta.env.VITE_HUBSPOT_API_KEY;

/**
 * Get provider info
 */
const getInfo = () => ({
  name: 'HubSpot',
  freeTier: 'Requires Marketing Hub subscription',
  templateSupport: true,
  templateLanguage: 'HubL',
  batchSupport: true,
  note: 'Transactional emails require templateId',
});

export default {
  name: 'hubspot',
  sendEmail,
  sendBatch,
  isConfigured,
  getInfo,
  DEFAULT_FROM,
};
