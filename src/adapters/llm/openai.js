/**
 * OpenAI LLM Adapter
 * Requires paid API key
 *
 * Models:
 * - gpt-4o (recommended, supports vision)
 * - gpt-4o-mini (faster/cheaper, supports vision)
 * - gpt-4-turbo (supports vision)
 *
 * Vision-capable: gpt-4o, gpt-4o-mini, gpt-4-turbo
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const DEFAULT_MODEL = 'gpt-4o-mini';

const AVAILABLE_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
];

// Models that support vision/image analysis
const VISION_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];

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
  } catch (_error) {
    console.error('Failed to parse OpenAI JSON response:', cleaned);
    throw new Error('Invalid JSON response from OpenAI');
  }
};

/**
 * Analyze an image using OpenAI Vision
 * @param {string} imageUrl - URL or base64 data URL of the image
 * @param {string} prompt - What to analyze about the image
 * @param {object} options - { apiKey?, model?, maxTokens? }
 * @returns {string} Analysis result
 */
const analyzeImage = async (imageUrl, prompt, options = {}) => {
  const apiKey = options.apiKey || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env');
  }

  const {
    model = 'gpt-4o-mini', // Vision-capable model
    maxTokens = 1024,
    detail = 'auto', // 'low', 'high', or 'auto'
  } = options;

  // Validate model supports vision
  if (!VISION_MODELS.includes(model)) {
    console.warn(`Model ${model} may not support vision. Using gpt-4o-mini instead.`);
  }

  // Build the content array with image
  const content = [
    {
      type: 'text',
      text: prompt,
    },
    {
      type: 'image_url',
      image_url: {
        url: imageUrl,
        detail: detail,
      },
    },
  ];

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VISION_MODELS.includes(model) ? model : 'gpt-4o-mini',
        messages: [
          { role: 'user', content },
        ],
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI Vision API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI Vision error:', error);
    throw error;
  }
};

/**
 * Analyze image and return structured JSON
 * @param {string} imageUrl - URL or base64 data URL
 * @param {string} prompt - What to analyze (should request JSON format)
 * @param {object} options - Same as analyzeImage
 * @returns {object} Parsed JSON analysis
 */
const analyzeImageJSON = async (imageUrl, prompt, options = {}) => {
  const jsonPrompt = `${prompt}\n\nRespond with valid JSON only, no markdown formatting.`;
  const response = await analyzeImage(imageUrl, jsonPrompt, options);

  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);

  try {
    return JSON.parse(cleaned.trim());
  } catch (_error) {
    console.error('Failed to parse OpenAI Vision JSON response:', cleaned);
    throw new Error('Invalid JSON response from OpenAI Vision');
  }
};

const getAvailableModels = () => AVAILABLE_MODELS;
const getVisionModels = () => VISION_MODELS;

const isConfigured = () => !!import.meta.env.VITE_OPENAI_API_KEY;

export default {
  name: 'openai',
  generate,
  generateJSON,
  analyzeImage,
  analyzeImageJSON,
  getAvailableModels,
  getVisionModels,
  isConfigured,
  DEFAULT_MODEL,
  VISION_MODELS,
};
