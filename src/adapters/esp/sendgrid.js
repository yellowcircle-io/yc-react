/**
 * SendGrid ESP Adapter
 * FREE tier: 100 emails/day
 *
 * TODO: Implement when needed
 */

const sendEmail = async (options) => {
  throw new Error('SendGrid adapter not yet implemented. Set ESP_PROVIDER=resend');
};

const sendBatch = async (emails) => {
  throw new Error('SendGrid adapter not yet implemented');
};

const isConfigured = () => !!import.meta.env.VITE_SENDGRID_API_KEY;

export default {
  name: 'sendgrid',
  sendEmail,
  sendBatch,
  isConfigured,
  getInfo: () => ({ name: 'SendGrid', status: 'not_implemented' }),
};
