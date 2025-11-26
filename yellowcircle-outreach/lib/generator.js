/**
 * AI Content Generator for yellowCircle Outreach
 *
 * Generates personalized cold emails using Groq (FREE) or OpenAI.
 * Based on NextPlay.so framework.
 */

require('dotenv').config();
const BRAND = require('../config/brand');

class Generator {
  constructor(config = {}) {
    this.provider = config.provider || process.env.LLM_PROVIDER || 'groq';
    this.apiKey = config.apiKey || this.getApiKey();
    this.model = config.model || this.getDefaultModel();
    this.client = null;

    this.initClient();
  }

  getApiKey() {
    switch (this.provider) {
      case 'groq':
        return process.env.GROQ_API_KEY;
      case 'openai':
        return process.env.OPENAI_API_KEY;
      default:
        return process.env.GROQ_API_KEY;
    }
  }

  getDefaultModel() {
    switch (this.provider) {
      case 'groq':
        return process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
      case 'openai':
        return process.env.OPENAI_MODEL || 'gpt-4o';
      default:
        return 'llama-3.1-70b-versatile';
    }
  }

  initClient() {
    if (!this.apiKey) {
      throw new Error(`API key required for ${this.provider}. Set ${this.provider.toUpperCase()}_API_KEY in .env`);
    }

    switch (this.provider) {
      case 'groq':
        const Groq = require('groq-sdk');
        this.client = new Groq({ apiKey: this.apiKey });
        break;
      case 'openai':
        const OpenAI = require('openai');
        this.client = new OpenAI({ apiKey: this.apiKey });
        break;
      default:
        throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  /**
   * Generate personalized cold email
   */
  async generateEmail(prospect, stage = 'initial') {
    const prompt = this.buildPrompt(prospect, stage);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: BRAND.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);

      console.log(`  ✓ Generated ${stage} email for ${prospect.company}`);

      return {
        stage,
        subject: result.subject,
        body: result.body,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`  ✗ Error generating ${stage} email:`, error.message);
      throw error;
    }
  }

  buildPrompt(prospect, stage) {
    const links = {
      calendarLink: process.env.CALENDAR_LINK || 'https://calendly.com/your-link',
      articleLink: process.env.ARTICLE_LINK || 'https://yellowcircle-app.web.app/thoughts/why-your-gtm-sucks'
    };

    const prompts = {
      initial: `Generate a cold outreach email for:

**Prospect:**
- Company: ${prospect.company}
- Contact: ${prospect.firstName} ${prospect.lastName || ''}
- Title: ${prospect.title || 'Unknown'}
- Industry: ${prospect.industry || 'B2B'}

**Trigger:** ${prospect.trigger || 'No specific trigger'}
**Trigger Details:** ${prospect.triggerDetails || 'N/A'}

**Requirements:**
- Use NextPlay.so 3-part structure
- Under 150 words
- Include ONE specific credential
- End with a clear, easy question
- Subject line under 50 characters, lowercase

Return JSON:
{
  "subject": "...",
  "body": "..."
}`,

      followup1: `Generate follow-up #1 (Day 3) for:

**Prospect:** ${prospect.firstName} at ${prospect.company}
**Previous email:** Initial outreach about GTM alignment

**Requirements:**
- Reference previous email briefly (1 sentence)
- Add value with diagnostic questions
- Under 100 words
- End with clear next step

Return JSON:
{
  "subject": "Re: [keep subject relevant to company]",
  "body": "..."
}`,

      followup2: `Generate follow-up #2 (Day 10 - FINAL) for:

**Prospect:** ${prospect.firstName} at ${prospect.company}
**Calendar Link:** ${links.calendarLink}
**Article Link:** ${links.articleLink}

**Requirements:**
- Acknowledge this is final outreach
- Offer resources (calendar, article)
- Provide easy out
- Under 80 words
- Leave door open

Return JSON:
{
  "subject": "last note on GTM audit",
  "body": "..."
}`
    };

    return prompts[stage] || prompts.initial;
  }

  /**
   * Generate full 3-email sequence
   */
  async generateSequence(prospect) {
    console.log(`\nGenerating sequence for ${prospect.company}...`);

    const sequence = [];

    // Initial
    const initial = await this.generateEmail(prospect, 'initial');
    sequence.push({ ...initial, day: 0 });

    // Follow-up 1
    const followup1 = await this.generateEmail(prospect, 'followup1');
    sequence.push({ ...followup1, day: 3 });

    // Follow-up 2
    const followup2 = await this.generateEmail(prospect, 'followup2');
    sequence.push({ ...followup2, day: 10 });

    return sequence;
  }

  /**
   * Generate subject line variations
   */
  async generateSubjects(emailBody, count = 5) {
    const prompt = `Generate ${count} subject line variations for this email.

Email:
${emailBody}

Rules:
- Under 50 characters each
- Lowercase (feels personal)
- Different approaches (question, observation, direct)
- No clickbait or ALL CAPS

Return JSON:
{
  "subjects": ["...", "...", "..."]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: BRAND.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content).subjects;
    } catch (error) {
      console.error('Error generating subjects:', error.message);
      throw error;
    }
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Reply with OK' }],
        max_tokens: 10
      });

      const result = response.choices[0].message.content;
      console.log(`✓ ${this.provider} connection: ${result}`);
      return true;
    } catch (error) {
      console.error(`✗ ${this.provider} connection failed:`, error.message);
      return false;
    }
  }
}

module.exports = Generator;
