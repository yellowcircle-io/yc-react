/**
 * ESP (Email Service Provider) Adapter Factory
 * Hot-swappable email providers via .env configuration
 *
 * Usage:
 *   import { getESPAdapter } from '../adapters/esp';
 *   const esp = await getESPAdapter();
 *   await esp.sendEmail({ to, subject, html });
 */

const adapterLoaders = {
  resend: () => import('./resend'),
  sendgrid: () => import('./sendgrid'),
  hubspot: () => import('./hubspot'),
  mailchimp: () => import('./mailchimp'),
};

const loadedAdapters = {};

/**
 * Get the configured ESP adapter
 * @returns {Object} ESP adapter with sendEmail() method
 */
export const getESPAdapter = async () => {
  const provider = import.meta.env.VITE_ESP_PROVIDER || 'resend';

  if (!adapterLoaders[provider]) {
    console.warn(`Unknown ESP provider: ${provider}, falling back to resend`);
    return getESPAdapterByName('resend');
  }

  return getESPAdapterByName(provider);
};

/**
 * Get a specific ESP adapter by name
 * @param {string} name - Adapter name
 * @returns {Object} ESP adapter
 */
export const getESPAdapterByName = async (name) => {
  if (!loadedAdapters[name]) {
    const module = await adapterLoaders[name]();
    loadedAdapters[name] = module.default;
  }
  return loadedAdapters[name];
};

/**
 * ESP Adapter Interface
 * All adapters must implement these methods:
 *
 * sendEmail(options): Promise<{ id, status }>
 *   - options: { to, from, subject, html, text?, replyTo?, tags? }
 *   - returns: { id: string, status: 'sent' | 'queued' | 'failed' }
 *
 * sendBatch(emails[]): Promise<{ sent, failed }>
 *   - Batch send multiple emails
 *
 * isConfigured(): boolean
 *   - Check if API key is configured
 */

export default { getESPAdapter, getESPAdapterByName };
