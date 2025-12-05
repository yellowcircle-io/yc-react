/**
 * HubSpot ESP Adapter
 * Requires HubSpot Marketing Hub
 *
 * TODO: Implement when needed
 * Note: HubSpot uses HubL templating language
 */

const sendEmail = async (options) => {
  throw new Error('HubSpot adapter not yet implemented. Set ESP_PROVIDER=resend');
};

const sendBatch = async (emails) => {
  throw new Error('HubSpot adapter not yet implemented');
};

const isConfigured = () => !!import.meta.env.VITE_HUBSPOT_API_KEY;

export default {
  name: 'hubspot',
  sendEmail,
  sendBatch,
  isConfigured,
  getInfo: () => ({
    name: 'HubSpot',
    status: 'not_implemented',
    templateLanguage: 'HubL',
  }),
};
