/**
 * Slack Notification Utility
 *
 * Reusable utility for sending notifications to Slack via webhooks.
 * Supports simple text messages and Block Kit rich formatting.
 *
 * Phase 1 of Apple Shortcuts + Slack integration.
 * See: dev-context/SCOPE_APPLE_SHORTCUTS_SLACK.md
 *
 * @created 2026-01-24
 */

// Environment variable for Slack webhook URL
const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL;

// Default configuration
const DEFAULT_CONFIG = {
  username: 'yellowCircle',
  icon_emoji: ':yellow_circle:',
  timeout: 10000, // 10 second timeout
  retries: 2,
  retryDelay: 1000, // 1 second between retries
};

/**
 * Delay utility for retry logic
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send a simple text message to Slack
 *
 * @param {string} text - Message text (supports Slack mrkdwn formatting)
 * @param {Object} options - Optional configuration
 * @param {string} options.webhookUrl - Override default webhook URL
 * @param {string} options.username - Bot username (default: 'yellowCircle')
 * @param {string} options.icon_emoji - Bot icon emoji (default: ':yellow_circle:')
 * @param {string} options.channel - Override default channel (if webhook supports it)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendSlackMessage(text, options = {}) {
  const webhookUrl = options.webhookUrl || SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[slackNotify] No webhook URL configured. Set VITE_SLACK_WEBHOOK_URL in .env');
    return { success: false, error: 'No webhook URL configured' };
  }

  const payload = {
    text,
    username: options.username || DEFAULT_CONFIG.username,
    icon_emoji: options.icon_emoji || DEFAULT_CONFIG.icon_emoji,
    ...(options.channel && { channel: options.channel }),
  };

  return sendSlackPayload(payload, { webhookUrl });
}

/**
 * Send a rich Block Kit message to Slack
 *
 * Block Kit reference: https://api.slack.com/messaging/composing/layouts
 * Block Kit Builder: https://app.slack.com/block-kit-builder
 *
 * @param {Array} blocks - Array of Block Kit block objects
 * @param {Object} options - Optional configuration
 * @param {string} options.text - Fallback text for notifications (required for accessibility)
 * @param {string} options.webhookUrl - Override default webhook URL
 * @param {string} options.username - Bot username
 * @param {string} options.icon_emoji - Bot icon emoji
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendSlackBlocks(blocks, options = {}) {
  const webhookUrl = options.webhookUrl || SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[slackNotify] No webhook URL configured. Set VITE_SLACK_WEBHOOK_URL in .env');
    return { success: false, error: 'No webhook URL configured' };
  }

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { success: false, error: 'Blocks array is required and must not be empty' };
  }

  const payload = {
    blocks,
    text: options.text || 'New notification from yellowCircle', // Fallback text
    username: options.username || DEFAULT_CONFIG.username,
    icon_emoji: options.icon_emoji || DEFAULT_CONFIG.icon_emoji,
  };

  return sendSlackPayload(payload, { webhookUrl });
}

/**
 * Send raw payload to Slack webhook with retry logic
 *
 * @param {Object} payload - Slack message payload
 * @param {Object} options - Request options
 * @param {string} options.webhookUrl - Webhook URL
 * @param {number} options.retries - Number of retry attempts (default: 2)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendSlackPayload(payload, options = {}) {
  const {
    webhookUrl,
    retries = DEFAULT_CONFIG.retries,
    retryDelay = DEFAULT_CONFIG.retryDelay,
  } = options;

  let lastError = null;
  let attempts = 0;

  while (attempts <= retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_CONFIG.timeout);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Slack webhooks return 'ok' on success
      if (response.ok) {
        const text = await response.text();
        if (text === 'ok') {
          return { success: true };
        }
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 5;
        console.warn(`[slackNotify] Rate limited. Retry after ${retryAfter}s`);
        lastError = `Rate limited. Retry after ${retryAfter} seconds`;
        await delay(parseInt(retryAfter, 10) * 1000);
        attempts++;
        continue;
      }

      // Other errors
      const errorText = await response.text();
      lastError = `Slack API error: ${response.status} - ${errorText}`;
      console.error('[slackNotify]', lastError);

    } catch (err) {
      if (err.name === 'AbortError') {
        lastError = 'Request timed out';
      } else {
        lastError = err.message || 'Unknown error';
      }
      console.error('[slackNotify] Request failed:', lastError);
    }

    attempts++;
    if (attempts <= retries) {
      await delay(retryDelay);
    }
  }

  return { success: false, error: lastError };
}

// ============================================
// Pre-built Message Templates
// ============================================

/**
 * Send a link archived notification
 *
 * @param {Object} link - Link data
 * @param {string} link.title - Link title
 * @param {string} link.url - Link URL
 * @param {string} link.folder - Folder name (optional)
 * @param {Object} options - Slack options
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function notifyLinkArchived(link, options = {}) {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Link Archived',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Title:*\n${link.title || 'Untitled'}`,
        },
        {
          type: 'mrkdwn',
          text: `*Folder:*\n${link.folder || 'Inbox'}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${link.url}|View Link>`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Saved at ${new Date().toLocaleString()}`,
        },
      ],
    },
  ];

  return sendSlackBlocks(blocks, {
    text: `Link archived: ${link.title || link.url}`,
    ...options,
  });
}

/**
 * Send a system status notification
 *
 * @param {string} status - Status type: 'success' | 'warning' | 'error' | 'info'
 * @param {string} message - Status message
 * @param {Object} options - Slack options
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function notifySystemStatus(status, message, options = {}) {
  const statusEmoji = {
    success: ':white_check_mark:',
    warning: ':warning:',
    error: ':x:',
    info: ':information_source:',
  };

  const emoji = statusEmoji[status] || statusEmoji.info;

  return sendSlackMessage(`${emoji} *${status.toUpperCase()}*: ${message}`, options);
}

/**
 * Send a notification for shared content
 *
 * @param {Object} share - Share data
 * @param {string} share.type - 'link' | 'folder' | 'canvas'
 * @param {string} share.title - Item title
 * @param {string} share.sharedBy - Email of person sharing
 * @param {string} share.sharedWith - Email of recipient
 * @param {Object} options - Slack options
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function notifyContentShared(share, options = {}) {
  const typeEmoji = {
    link: ':link:',
    folder: ':file_folder:',
    canvas: ':art:',
  };

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${typeEmoji[share.type] || ':bell:'} *${share.type} Shared*\n\n*"${share.title}"* was shared by ${share.sharedBy} with ${share.sharedWith}`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Shared at ${new Date().toLocaleString()}`,
        },
      ],
    },
  ];

  return sendSlackBlocks(blocks, {
    text: `${share.type} shared: ${share.title}`,
    ...options,
  });
}

// ============================================
// Utility Exports
// ============================================

/**
 * Check if Slack notifications are configured
 * @returns {boolean}
 */
export function isSlackConfigured() {
  return !!SLACK_WEBHOOK_URL;
}

/**
 * Get the configured webhook URL (masked for security)
 * @returns {string}
 */
export function getWebhookStatus() {
  if (!SLACK_WEBHOOK_URL) {
    return 'Not configured';
  }
  // Mask all but last 8 characters
  const masked = '***' + SLACK_WEBHOOK_URL.slice(-8);
  return `Configured (${masked})`;
}

export default {
  sendSlackMessage,
  sendSlackBlocks,
  notifyLinkArchived,
  notifySystemStatus,
  notifyContentShared,
  isSlackConfigured,
  getWebhookStatus,
};
