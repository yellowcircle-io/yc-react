/**
 * LocalStorage Adapter
 * For offline/development use when Firestore/Airtable not needed
 *
 * Data persists in browser localStorage
 */

const PREFIX = 'unity_';

/**
 * Generate a unique ID
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Create a collection interface using localStorage
 */
const createCollectionInterface = (collectionName) => {
  const getKey = () => `${PREFIX}${collectionName}`;

  const getData = () => {
    const stored = localStorage.getItem(getKey());
    return stored ? JSON.parse(stored) : [];
  };

  const setData = (data) => {
    localStorage.setItem(getKey(), JSON.stringify(data));
  };

  return {
    create: async (data) => {
      const items = getData();
      const newItem = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      items.push(newItem);
      setData(items);
      return newItem;
    },

    update: async (id, data) => {
      const items = getData();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) throw new Error(`Item ${id} not found`);

      items[index] = {
        ...items[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      setData(items);
      return items[index];
    },

    get: async (id) => {
      const items = getData();
      return items.find((item) => item.id === id) || null;
    },

    list: async (filters = {}) => {
      let items = getData();

      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (!field.startsWith('_') && value !== undefined) {
          items = items.filter((item) => item[field] === value);
        }
      });

      // Apply limit
      if (filters._limit) {
        items = items.slice(0, filters._limit);
      }

      // Apply ordering
      if (filters._orderBy) {
        const { field, direction = 'asc' } = filters._orderBy;
        items.sort((a, b) => {
          if (direction === 'desc') return b[field] > a[field] ? 1 : -1;
          return a[field] > b[field] ? 1 : -1;
        });
      }

      return items;
    },

    delete: async (id) => {
      const items = getData();
      const filtered = items.filter((item) => item.id !== id);
      setData(filtered);
    },

    clear: async () => {
      setData([]);
    },
  };
};

const localStorageAdapter = {
  name: 'localstorage',

  contacts: createCollectionInterface('contacts'),
  journeys: createCollectionInterface('journeys'),
  canvases: createCollectionInterface('canvases'),
  assets: createCollectionInterface('assets'),

  collection: (name) => createCollectionInterface(name),

  isConfigured: () => true, // Always available

  getInfo: () => ({
    name: 'LocalStorage',
    freeTier: 'Unlimited (browser storage)',
    namespacing: 'not supported',
    persistence: 'browser only',
  }),

  /**
   * Clear all Unity Platform data from localStorage
   */
  clearAll: () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  },
};

export default localStorageAdapter;
