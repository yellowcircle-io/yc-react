/**
 * Unity Platform Adapters
 * Hot-swappable integrations for LLM, ESP, and Storage
 *
 * Usage:
 *   import { getLLMAdapter, getESPAdapter, getStorageAdapter } from './adapters';
 *
 *   // Use configured providers (from .env)
 *   const llm = await getLLMAdapter();
 *   const response = await llm.generate('Hello');
 *
 *   const esp = await getESPAdapter();
 *   await esp.sendEmail({ to, subject, html });
 *
 *   const storage = await getStorageAdapter();
 *   await storage.contacts.create({ email, name });
 *
 *   // Or get specific adapters
 *   const groq = await getLLMAdapterByName('groq');
 *   const airtable = await getStorageAdapterByName('airtable');
 */

export { getLLMAdapter, getLLMAdapterByName } from './llm';
export { getESPAdapter, getESPAdapterByName } from './esp';
export { getStorageAdapter, getStorageAdapterByName } from './storage';

/**
 * Get all adapters in one call
 * @returns {Promise<{ llm, esp, storage }>}
 */
export const getAdapters = async () => {
  const [
    { getLLMAdapter },
    { getESPAdapter },
    { getStorageAdapter },
  ] = await Promise.all([
    import('./llm'),
    import('./esp'),
    import('./storage'),
  ]);

  const [llm, esp, storage] = await Promise.all([
    getLLMAdapter(),
    getESPAdapter(),
    getStorageAdapter(),
  ]);

  return { llm, esp, storage };
};

/**
 * Check which adapters are configured
 * @returns {Promise<object>}
 */
export const getAdapterStatus = async () => {
  const [llmModule, espModule, storageModule] = await Promise.all([
    import('./llm/groq'),
    import('./esp/resend'),
    import('./storage/firestore'),
  ]);

  return {
    llm: {
      provider: import.meta.env.VITE_LLM_PROVIDER || 'groq',
      configured: llmModule.default.isConfigured(),
    },
    esp: {
      provider: import.meta.env.VITE_ESP_PROVIDER || 'resend',
      configured: espModule.default.isConfigured(),
    },
    storage: {
      provider: import.meta.env.VITE_STORAGE_PROVIDER || 'firestore',
      configured: storageModule.default.isConfigured(),
    },
  };
};
