/**
 * OpenAI LLM Adapter
 * Requires paid API key
 *
 * Models:
 * - gpt-4o (recommended)
 * - gpt-4o-mini (faster/cheaper)
 * - gpt-4-turbo
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const DEFAULT_MODEL = 'gpt-4o-mini';

const AVAILABLE_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
];

/**
 * Generate text using OpenAI
 */
const generate = async (prompt, options = {}) => {
  const apiKey = options.apiKey || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env');
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
    const response = await fetch(OPENAI_API_URL, {
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
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI generation error:', error);
    throw error;
  }
};

/**
 * Generate JSON using OpenAI
 */
const generateJSON = async (prompt, options = {}) => {
  const response = await generate(prompt, {
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
    console.error('Failed to parse OpenAI JSON response:', cleaned);
    throw new Error('Invalid JSON response from OpenAI');
  }
};

const getAvailableModels = () => AVAILABLE_MODELS;

const isConfigured = () => !!import.meta.env.VITE_OPENAI_API_KEY;

export default {
  name: 'openai',
  generate,
  generateJSON,
  getAvailableModels,
  isConfigured,
  DEFAULT_MODEL,
};
