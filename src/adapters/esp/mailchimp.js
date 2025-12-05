/**
 * Mailchimp ESP Adapter (Transactional via Mandrill)
 *
 * TODO: Implement when needed
 */

const sendEmail = async (options) => {
  throw new Error('Mailchimp adapter not yet implemented. Set ESP_PROVIDER=resend');
};

const sendBatch = async (emails) => {
  throw new Error('Mailchimp adapter not yet implemented');
};

const isConfigured = () => !!import.meta.env.VITE_MAILCHIMP_API_KEY;

export default {
  name: 'mailchimp',
  sendEmail,
  sendBatch,
  isConfigured,
  getInfo: () => ({ name: 'Mailchimp', status: 'not_implemented' }),
};
