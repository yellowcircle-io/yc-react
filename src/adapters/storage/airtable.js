/**
 * Airtable Storage Adapter
 * Integration bridge for visual management + external tool connections
 *
 * FREE tier: 1,200 records per base
 *
 * Key Value: Native integrations with HubSpot, Slack, Miro, Figma, etc.
 */

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

/**
 * Create a table interface for Airtable
 * @param {string} baseId - Airtable base ID
 * @param {string} tableId - Table ID or name
 */
const createTableInterface = (baseId, tableId) => {
  const getApiKey = () => import.meta.env.VITE_AIRTABLE_API_KEY;

  const makeRequest = async (endpoint, options = {}) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Airtable API key not configured. Set VITE_AIRTABLE_API_KEY in .env');
    }

    const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Airtable API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  };

  return {
    /**
     * Create a new record
     */
    create: async (data) => {
      const result = await makeRequest('', {
        method: 'POST',
        body: JSON.stringify({ fields: data }),
      });
      return { id: result.id, ...result.fields };
    },

    /**
     * Update an existing record
     */
    update: async (id, data) => {
      const result = await makeRequest(`/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields: data }),
      });
      return { id: result.id, ...result.fields };
    },

    /**
     * Get a single record by ID
     */
    get: async (id) => {
      try {
        const result = await makeRequest(`/${id}`);
        return { id: result.id, ...result.fields };
      } catch (error) {
        if (error.message.includes('NOT_FOUND')) return null;
        throw error;
      }
    },

    /**
     * List records with optional filters
     * @param {object} filters - { field: value } for filterByFormula
     */
    list: async (filters = {}) => {
      const params = new URLSearchParams();

      // Build filterByFormula from filters
      const filterConditions = Object.entries(filters)
        .filter(([key]) => !key.startsWith('_'))
        .map(([field, value]) => `{${field}} = "${value}"`)
        .join(', ');

      if (filterConditions) {
        params.append('filterByFormula', `AND(${filterConditions})`);
      }

      if (filters._limit) {
        params.append('maxRecords', filters._limit);
      }

      if (filters._orderBy) {
        params.append('sort[0][field]', filters._orderBy.field);
        params.append('sort[0][direction]', filters._orderBy.direction || 'asc');
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const result = await makeRequest(queryString);

      return result.records.map((record) => ({
        id: record.id,
        ...record.fields,
      }));
    },

    /**
     * Delete a record
     */
    delete: async (id) => {
      await makeRequest(`/${id}`, { method: 'DELETE' });
    },
  };
};

/**
 * Airtable Storage Adapter
 *
 * Configuration:
 * VITE_AIRTABLE_API_KEY - Personal access token
 * VITE_AIRTABLE_BASE_ID - Base ID (starts with 'app')
 */
const airtableAdapter = {
  name: 'airtable',

  /**
   * Get table interface
   * @param {string} tableIdOrName - Table ID or name
   * @param {string} baseId - Optional base ID override
   */
  table: (tableIdOrName, baseId = null) => {
    const base = baseId || import.meta.env.VITE_AIRTABLE_BASE_ID;
    if (!base) {
      throw new Error('Airtable base ID not configured. Set VITE_AIRTABLE_BASE_ID in .env');
    }
    return createTableInterface(base, tableIdOrName);
  },

  // Convenience accessors using default base
  get contacts() {
    return this.table('Contacts');
  },
  get journeys() {
    return this.table('Journeys');
  },
  get canvases() {
    return this.table('Canvases');
  },
  get assets() {
    return this.table('Assets');
  },

  /**
   * Generic collection access (maps to table)
   */
  collection: (name) => airtableAdapter.table(name),

  /**
   * Check if configured
   */
  isConfigured: () =>
    !!import.meta.env.VITE_AIRTABLE_API_KEY && !!import.meta.env.VITE_AIRTABLE_BASE_ID,

  /**
   * Get provider info
   */
  getInfo: () => ({
    name: 'Airtable',
    freeTier: '1,200 records per base',
    namespacing: 'via separate bases',
    integrations: ['Slack', 'HubSpot', 'Salesforce', 'Miro', 'Figma', 'Zapier', 'Make'],
  }),
};

export default airtableAdapter;
