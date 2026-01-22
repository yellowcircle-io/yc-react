/**
 * Offline Storage Utility for PWA
 * Uses IndexedDB to store link content for offline reading
 *
 * @created 2026-01-22
 */

const DB_NAME = 'yellowcircle-offline';
const DB_VERSION = 1;
const STORE_LINKS = 'links';
const STORE_META = 'meta';

let dbInstance = null;

/**
 * Open/initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[OfflineStorage] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('[OfflineStorage] Database opened');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store for link content
      if (!db.objectStoreNames.contains(STORE_LINKS)) {
        const linksStore = db.createObjectStore(STORE_LINKS, { keyPath: 'id' });
        linksStore.createIndex('savedAt', 'savedAt', { unique: false });
        linksStore.createIndex('url', 'url', { unique: false });
        console.log('[OfflineStorage] Created links store');
      }

      // Store for metadata (settings, sync status)
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
        console.log('[OfflineStorage] Created meta store');
      }
    };
  });
}

/**
 * Save a link for offline reading
 * @param {Object} link - Link object from Firestore
 * @returns {Promise<void>}
 */
export async function saveOffline(link) {
  if (!link || !link.id) {
    throw new Error('Invalid link: missing id');
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_LINKS], 'readwrite');
    const store = transaction.objectStore(STORE_LINKS);

    const offlineLink = {
      id: link.id,
      url: link.url,
      title: link.title || 'Untitled',
      content: link.content || '',
      aiSummary: link.aiSummary || '',
      excerpt: link.excerpt || '',
      domain: link.domain || '',
      imageUrl: link.imageUrl || '',
      tags: link.tags || [],
      savedAt: Date.now(),
      readingProgress: link.readingProgress || 0,
      lastReadAt: link.lastReadAt || null,
    };

    const request = store.put(offlineLink);

    request.onsuccess = () => {
      console.log('[OfflineStorage] Link saved:', link.id);
      resolve();
    };

    request.onerror = () => {
      console.error('[OfflineStorage] Failed to save link:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Remove a link from offline storage
 * @param {string} linkId - Link ID to remove
 * @returns {Promise<void>}
 */
export async function removeOffline(linkId) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_LINKS], 'readwrite');
    const store = transaction.objectStore(STORE_LINKS);
    const request = store.delete(linkId);

    request.onsuccess = () => {
      console.log('[OfflineStorage] Link removed:', linkId);
      resolve();
    };

    request.onerror = () => {
      console.error('[OfflineStorage] Failed to remove link:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get a single link from offline storage
 * @param {string} linkId - Link ID to retrieve
 * @returns {Promise<Object|null>}
 */
export async function getOfflineLink(linkId) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_LINKS], 'readonly');
    const store = transaction.objectStore(STORE_LINKS);
    const request = store.get(linkId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      console.error('[OfflineStorage] Failed to get link:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all offline links
 * @returns {Promise<Object[]>}
 */
export async function getOfflineLinks() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_LINKS], 'readonly');
    const store = transaction.objectStore(STORE_LINKS);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by savedAt descending (most recent first)
      const links = request.result.sort((a, b) => b.savedAt - a.savedAt);
      resolve(links);
    };

    request.onerror = () => {
      console.error('[OfflineStorage] Failed to get links:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Check if a link is saved offline
 * @param {string} linkId - Link ID to check
 * @returns {Promise<boolean>}
 */
export async function isOffline(linkId) {
  const link = await getOfflineLink(linkId);
  return link !== null;
}

/**
 * Get all offline link IDs (faster than getOfflineLinks for checking)
 * @returns {Promise<Set<string>>}
 */
export async function getOfflineLinkIds() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_LINKS], 'readonly');
    const store = transaction.objectStore(STORE_LINKS);
    const request = store.getAllKeys();

    request.onsuccess = () => {
      resolve(new Set(request.result));
    };

    request.onerror = () => {
      console.error('[OfflineStorage] Failed to get link IDs:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Update reading progress for an offline link
 * @param {string} linkId - Link ID
 * @param {number} progress - Reading progress (0-100)
 * @returns {Promise<void>}
 */
export async function updateReadingProgress(linkId, progress) {
  const link = await getOfflineLink(linkId);
  if (!link) return;

  link.readingProgress = progress;
  link.lastReadAt = Date.now();

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_LINKS], 'readwrite');
    const store = transaction.objectStore(STORE_LINKS);
    const request = store.put(link);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get storage statistics
 * @returns {Promise<{count: number, estimatedSize: string}>}
 */
export async function getStorageStats() {
  const links = await getOfflineLinks();

  // Estimate size based on content length
  let totalBytes = 0;
  links.forEach((link) => {
    totalBytes += (link.content?.length || 0) * 2; // UTF-16 estimation
    totalBytes += (link.aiSummary?.length || 0) * 2;
    totalBytes += 1000; // Overhead for other fields
  });

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    count: links.length,
    estimatedSize: formatSize(totalBytes),
  };
}

/**
 * Clear all offline storage
 * @returns {Promise<void>}
 */
export async function clearOfflineStorage() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_LINKS], 'readwrite');
    const store = transaction.objectStore(STORE_LINKS);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('[OfflineStorage] All links cleared');
      resolve();
    };

    request.onerror = () => {
      console.error('[OfflineStorage] Failed to clear links:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Check if IndexedDB is available
 * @returns {boolean}
 */
export function isIndexedDBAvailable() {
  return 'indexedDB' in window;
}
