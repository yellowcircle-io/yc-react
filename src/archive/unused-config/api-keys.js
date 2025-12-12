/**
 * API Keys Template - Empty defaults
 *
 * For local development with real keys:
 * 1. Copy this file to api-keys.local.js
 * 2. Add your actual API keys
 * 3. The .local file is gitignored and won't be committed
 *
 * For production deployment:
 * - Keys should be entered via the Settings UI in the Outreach tool
 * - Or set up environment variables in your hosting provider
 */

export const API_KEYS = {
  perplexity: '',
  groq: '',
  resend: ''
};

export const PROVIDERS = {
  ai: [
    { id: 'groq', name: 'Groq', key: '', models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Best quality, fast' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Faster, lighter' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Good alternative' }
    ]}
  ],
  research: [
    { id: 'perplexity', name: 'Perplexity', key: '', models: [
      { id: 'sonar', name: 'Sonar', description: 'Web search + synthesis' },
      { id: 'sonar-pro', name: 'Sonar Pro', description: 'Enhanced accuracy' }
    ]}
  ],
  email: [
    { id: 'resend', name: 'Resend', key: '', domains: [
      { id: 'test', from: 'onboarding@resend.dev', name: 'Test Domain' },
      { id: 'yellowcircle', from: 'chris@yellowcircle.io', name: 'yellowCircle' }
    ]}
  ]
};

export default API_KEYS;
