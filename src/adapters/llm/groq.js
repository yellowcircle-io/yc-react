/**
 * Groq LLM Adapter
 * FREE tier: 14,400 requests/day
 *
 * Models:
 * - llama-3.3-70b-versatile (recommended)
 * - llama-3.1-8b-instant (faster)
 * - mixtral-8x7b-32768
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const AVAILABLE_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];

/**
 * Generate text using Groq
 * @param {string} prompt - The prompt to send
 * @param {object} options - Generation options
 * @returns {Promise<string>} Generated text
 */
const generate = async (prompt, options = {}) => {
  const apiKey = options.apiKey || import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Groq API key not configured. Set VITE_GROQ_API_KEY in .env');
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
    systemPrompt = null,
  } = options;

  const messages = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq generation error:', error);
    throw error;
  }
};

/**
 * Generate JSON using Groq
 * @param {string} prompt - The prompt (should request JSON output)
 * @param {object} options - Generation options
 * @returns {Promise<object>} Parsed JSON response
 */
const generateJSON = async (prompt, options = {}) => {
  const jsonPrompt = `${prompt}\n\nRespond with valid JSON only, no markdown or explanation.`;

  const response = await generate(jsonPrompt, {
    ...options,
    temperature: options.temperature || 0.3, // Lower temp for structured output
  });

  // Clean potential markdown code blocks
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  try {
    return JSON.parse(cleaned.trim());
  } catch (_error) {
    console.error('Failed to parse Groq JSON response:', cleaned);
    throw new Error('Invalid JSON response from Groq');
  }
};

/**
 * Get available models
 * @returns {string[]} List of model IDs
 */
const getAvailableModels = () => AVAILABLE_MODELS;

/**
 * Check if API key is configured
 * @returns {boolean}
 */
const isConfigured = () => {
  return !!import.meta.env.VITE_GROQ_API_KEY;
};

export default {
  name: 'groq',
  generate,
  generateJSON,
  getAvailableModels,
  isConfigured,
  DEFAULT_MODEL,
};
