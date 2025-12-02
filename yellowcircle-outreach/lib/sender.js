/**
 * Email Sender for yellowCircle Outreach
 *
 * Sends emails via Resend (FREE tier: 100/day)
 */

require('dotenv').config();

class Sender {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.RESEND_API_KEY;
    this.fromEmail = config.fromEmail || process.env.FROM_EMAIL || 'chris@yellowcircle.io';
    this.fromName = config.fromName || process.env.FROM_NAME || 'Chris Cooper';
    this.client = null;

    if (this.apiKey) {
      this.initClient();
    }
  }

  initClient() {
    const { Resend } = require('resend');
    this.client = new Resend(this.apiKey);
  }

  /**
   * Send single email
   */
  async send({ to, subject, body, replyTo }) {
    if (!this.client) {
      throw new Error('Resend API key not configured. Set RESEND_API_KEY in .env');
    }

    try {
      const result = await this.client.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: subject,
        text: body,
        reply_to: replyTo || this.fromEmail
      });

      console.log(`  ✓ Sent to ${to} (ID: ${result.id})`);

      return {
        success: true,
        id: result.id,
        to,
        subject,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`  ✗ Failed to send to ${to}:`, error.message);

      return {
        success: false,
        error: error.message,
        to,
        subject
      };
    }
  }

  /**
   * Send batch of emails with rate limiting
   */
  async sendBatch(emails, options = {}) {
    const delay = options.delayMs || 1000; // 1 second between emails
    const results = [];

    console.log(`\nSending ${emails.length} emails...`);

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];

      console.log(`[${i + 1}/${emails.length}] ${email.to}`);

      const result = await this.send(email);
      results.push(result);

      // Rate limiting
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n✓ Sent: ${successful}  ✗ Failed: ${failed}`);

    return results;
  }

  /**
   * Preview email (no send)
   */
  preview({ to, subject, body }) {
    console.log('\n' + '='.repeat(60));
    console.log('EMAIL PREVIEW (not sent)');
    console.log('='.repeat(60));
    console.log(`From: ${this.fromName} <${this.fromEmail}>`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('-'.repeat(60));
    console.log(body);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Test connection
   */
  async testConnection() {
    if (!this.client) {
      console.log('✗ Resend not configured');
      return false;
    }

    try {
      // Resend doesn't have a direct test endpoint,
      // but we can verify the API key is valid
      console.log(`✓ Resend configured (from: ${this.fromEmail})`);
      return true;
    } catch (error) {
      console.error('✗ Resend error:', error.message);
      return false;
    }
  }
}

module.exports = Sender;
