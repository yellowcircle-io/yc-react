/**
 * Storage Adapter Factory
 * Hot-swappable storage providers via .env configuration
 *
 * Usage:
 *   import { getStorageAdapter } from '../adapters/storage';
 *   const storage = await getStorageAdapter();
 *
 *   // Contacts
 *   await storage.contacts.create({ email, name, stage: 'prospect' });
 *   await storage.contacts.update(id, { stage: 'lead' });
 *   const prospects = await storage.contacts.list({ stage: 'prospect' });
 *
 *   // Journeys
 *   await storage.journeys.create({ name, type: 'outreach' });
 *
 *   // Generic collections
 *   await storage.collection('custom').create(data);
 */

const adapterLoaders = {
  firestore: () => import('./firestore'),
  airtable: () => import('./airtable'),
  localstorage: () => import('./localstorage'),
};

const loadedAdapters = {};

/**
 * Get the configured storage adapter
 * @returns {Object} Storage adapter
 */
export const getStorageAdapter = async () => {
  const provider = import.meta.env.VITE_STORAGE_PROVIDER || 'firestore';

  if (!adapterLoaders[provider]) {
    console.warn(`Unknown storage provider: ${provider}, falling back to firestore`);
    return getStorageAdapterByName('firestore');
  }

  return getStorageAdapterByName(provider);
};

/**
 * Get a specific storage adapter by name
 * @param {string} name - Adapter name
 * @returns {Object} Storage adapter
 */
export const getStorageAdapterByName = async (name) => {
  if (!loadedAdapters[name]) {
    const module = await adapterLoaders[name]();
    loadedAdapters[name] = module.default;
  }
  return loadedAdapters[name];
};

/**
 * Storage Adapter Interface
 * All adapters must implement these collections:
 *
 * contacts - Prospect/Lead/Client lifecycle
 *   .create(data): Promise<{ id, ...data }>
 *   .update(id, data): Promise<{ id, ...data }>
 *   .get(id): Promise<data | null>
 *   .list(filters?): Promise<data[]>
 *   .delete(id): Promise<void>
 *
 * journeys - Campaign sequences (UnityMAP)
 *   (same CRUD interface)
 *
 * canvases - Workspaces (UnityNotes)
 *   (same CRUD interface)
 *
 * assets - Created content (UnityStudio)
 *   (same CRUD interface)
 *
 * collection(name) - Generic collection access
 *   Returns CRUD interface for any collection
 */

export default { getStorageAdapter, getStorageAdapterByName };
