/**
 * Claude (Anthropic) LLM Adapter
 * Requires paid API key
 *
 * Models:
 * - claude-sonnet-4-5-20250929 (recommended)
 * - claude-3-5-sonnet-20241022
 * - claude-3-haiku-20240307 (faster/cheaper)
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

const AVAILABLE_MODELS = [
  'claude-sonnet-4-5-20250929',
  'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307',
  'claude-3-opus-20240229',
];

/**
 * Generate text using Claude
 */
const generate = async (prompt, options = {}) => {
  const apiKey = options.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic API key not configured. Set VITE_ANTHROPIC_API_KEY in .env');
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
    systemPrompt = null,
  } = options;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt || undefined,
        messages: [{ role: 'user', content: prompt }],
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  } catch (error) {
    console.error('Claude generation error:', error);
    throw error;
  }
};

/**
 * Generate JSON using Claude
 */
const generateJSON = async (prompt, options = {}) => {
  const jsonPrompt = `${prompt}\n\nRespond with valid JSON only, no markdown or explanation.`;

  const response = await generate(jsonPrompt, {
    ...options,
    temperature: options.temperature || 0.3,
  });

  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);

  try {
    return JSON.parse(cleaned.trim());
  } catch (error) {
    console.error('Failed to parse Claude JSON response:', cleaned);
    throw new Error('Invalid JSON response from Claude');
  }
};

const getAvailableModels = () => AVAILABLE_MODELS;

const isConfigured = () => !!import.meta.env.VITE_ANTHROPIC_API_KEY;

export default {
  name: 'claude',
  generate,
  generateJSON,
  getAvailableModels,
  isConfigured,
  DEFAULT_MODEL,
};
