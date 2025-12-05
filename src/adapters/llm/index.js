/**
 * LLM Adapter Factory
 * Hot-swappable LLM providers via .env configuration
 *
 * Usage:
 *   import { getLLMAdapter } from '../adapters/llm';
 *   const llm = getLLMAdapter();
 *   const response = await llm.generate(prompt, options);
 */

// Lazy-load adapters to avoid importing unused dependencies
const adapterLoaders = {
  groq: () => import('./groq'),
  openai: () => import('./openai'),
  claude: () => import('./claude'),
};

// Cache loaded adapters
const loadedAdapters = {};

/**
 * Get the configured LLM adapter
 * @returns {Object} LLM adapter with generate() method
 */
export const getLLMAdapter = async () => {
  const provider = import.meta.env.VITE_LLM_PROVIDER || 'groq';

  if (!adapterLoaders[provider]) {
    console.warn(`Unknown LLM provider: ${provider}, falling back to groq`);
    return getLLMAdapterByName('groq');
  }

  return getLLMAdapterByName(provider);
};

/**
 * Get a specific LLM adapter by name
 * @param {string} name - Adapter name (groq, openai, claude)
 * @returns {Object} LLM adapter
 */
export const getLLMAdapterByName = async (name) => {
  if (!loadedAdapters[name]) {
    const module = await adapterLoaders[name]();
    loadedAdapters[name] = module.default;
  }
  return loadedAdapters[name];
};

/**
 * LLM Adapter Interface
 * All adapters must implement these methods:
 *
 * generate(prompt: string, options?: object): Promise<string>
 *   - prompt: The text prompt to send
 *   - options: { model?, temperature?, maxTokens? }
 *   - returns: Generated text response
 *
 * generateJSON(prompt: string, options?: object): Promise<object>
 *   - Same as generate but parses response as JSON
 *
 * getAvailableModels(): string[]
 *   - Returns list of available models for this provider
 */

export default { getLLMAdapter, getLLMAdapterByName };
