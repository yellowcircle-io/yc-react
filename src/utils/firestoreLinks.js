/**
 * Firestore Links Utility - Link Archiver (Pocket Alternative)
 *
 * CRUD operations for saved links with tagging, folders, and reading progress.
 * Part of yellowCircle Unity ecosystem.
 *
 * @created 2026-01-17
 * @author Sleepless Agent
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

const LINKS_COLLECTION = 'links';
const FOLDERS_COLLECTION = 'link_folders';
const TAGS_COLLECTION = 'link_tags';

// ============================================================
// Link CRUD Operations
// ============================================================

/**
 * Save a new link
 * @param {string} userId - Firebase user ID
 * @param {Object} linkData - Link data
 * @returns {Promise<Object>} Created link
 */
export const saveLink = async (userId, linkData) => {
  const linkRef = doc(collection(db, LINKS_COLLECTION));

  const link = {
    id: linkRef.id,
    userId,

    // Core fields
    url: linkData.url,
    title: linkData.title || 'Untitled',
    excerpt: linkData.excerpt || '',
    content: linkData.content || '',

    // Metadata
    domain: extractDomain(linkData.url),
    favicon: linkData.favicon || `https://www.google.com/s2/favicons?domain=${extractDomain(linkData.url)}&sz=64`,
    image: linkData.image || null,
    author: linkData.author || null,
    publishedAt: linkData.publishedAt || null,

    // Organization
    tags: linkData.tags || [],
    folderId: linkData.folderId || null,
    starred: false,
    archived: false,

    // Reading progress
    readProgress: 0,
    readTime: 0,
    estimatedReadTime: estimateReadTime(linkData.content || ''),

    // AI enhancements (populated later)
    aiSummary: null,
    aiTags: [],

    // Archive (populated later)
    archiveUrl: null,
    archiveTimestamp: null,

    // Unity integration
    unityNodeId: null,
    unityCapsuleId: null,

    // Timestamps
    savedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    readAt: null
  };

  await setDoc(linkRef, link);
  return { ...link, id: linkRef.id };
};

/**
 * Get user's links with pagination and filtering
 * @param {string} userId - Firebase user ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Links and pagination info
 */
export const getLinks = async (userId, options = {}) => {
  const {
    folderId = null,
    tag = null,
    starred = null,
    archived = false,
    _search = null, // TODO: Implement with Algolia for full-text search
    sortBy = 'savedAt',
    sortOrder = 'desc',
    pageSize = 20,
    lastDoc = null
  } = options;

  let q = query(
    collection(db, LINKS_COLLECTION),
    where('userId', '==', userId),
    where('archived', '==', archived)
  );

  // Apply filters
  if (folderId) {
    q = query(q, where('folderId', '==', folderId));
  }

  if (tag) {
    q = query(q, where('tags', 'array-contains', tag));
  }

  if (starred !== null) {
    q = query(q, where('starred', '==', starred));
  }

  // Apply sorting
  q = query(q, orderBy(sortBy, sortOrder));

  // Apply pagination
  q = query(q, limit(pageSize));

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    links,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize
  };
};

/**
 * Get a single link by ID
 * @param {string} linkId - Link ID
 * @returns {Promise<Object|null>} Link or null
 */
export const getLink = async (linkId) => {
  const linkRef = doc(db, LINKS_COLLECTION, linkId);
  const snapshot = await getDoc(linkRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...snapshot.data() };
};

/**
 * Update a link
 * @param {string} linkId - Link ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateLink = async (linkId, updates) => {
  const linkRef = doc(db, LINKS_COLLECTION, linkId);

  await updateDoc(linkRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

/**
 * Delete a link
 * @param {string} linkId - Link ID
 * @returns {Promise<void>}
 */
export const deleteLink = async (linkId) => {
  const linkRef = doc(db, LINKS_COLLECTION, linkId);
  await deleteDoc(linkRef);
};

/**
 * Toggle star status
 * @param {string} linkId - Link ID
 * @param {boolean} starred - Star status
 * @returns {Promise<void>}
 */
export const toggleStar = async (linkId, starred) => {
  await updateLink(linkId, { starred });
};

/**
 * Archive/unarchive a link
 * @param {string} linkId - Link ID
 * @param {boolean} archived - Archive status
 * @returns {Promise<void>}
 */
export const archiveLink = async (linkId, archived) => {
  await updateLink(linkId, { archived });
};

/**
 * Update reading progress
 * @param {string} linkId - Link ID
 * @param {number} progress - Progress 0-1
 * @param {number} timeSpent - Seconds spent reading
 * @returns {Promise<void>}
 */
export const updateReadProgress = async (linkId, progress, timeSpent = 0) => {
  const updates = {
    readProgress: Math.min(1, Math.max(0, progress)),
    readTime: increment(timeSpent)
  };

  if (progress >= 0.9) {
    updates.readAt = serverTimestamp();
  }

  await updateLink(linkId, updates);
};

/**
 * Add tags to a link
 * @param {string} linkId - Link ID
 * @param {string[]} tags - Tags to add
 * @returns {Promise<void>}
 */
export const addTags = async (linkId, tags) => {
  const link = await getLink(linkId);
  if (!link) return;

  const existingTags = link.tags || [];
  const newTags = [...new Set([...existingTags, ...tags])];

  await updateLink(linkId, { tags: newTags });
};

/**
 * Remove a tag from a link
 * @param {string} linkId - Link ID
 * @param {string} tag - Tag to remove
 * @returns {Promise<void>}
 */
export const removeTag = async (linkId, tag) => {
  const link = await getLink(linkId);
  if (!link) return;

  const tags = (link.tags || []).filter(t => t !== tag);
  await updateLink(linkId, { tags });
};

// ============================================================
// Folder Operations
// ============================================================

/**
 * Create a folder
 * @param {string} userId - Firebase user ID
 * @param {Object} folderData - Folder data
 * @returns {Promise<Object>} Created folder
 */
export const createFolder = async (userId, folderData) => {
  const folderRef = doc(collection(db, FOLDERS_COLLECTION));

  const folder = {
    id: folderRef.id,
    userId,
    name: folderData.name,
    color: folderData.color || '#3B82F6',
    icon: folderData.icon || 'folder',
    parentId: folderData.parentId || null,
    order: folderData.order || 0,
    createdAt: serverTimestamp()
  };

  await setDoc(folderRef, folder);
  return folder;
};

/**
 * Get user's folders
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object[]>} Folders
 */
export const getFolders = async (userId) => {
  const q = query(
    collection(db, FOLDERS_COLLECTION),
    where('userId', '==', userId),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Update a folder
 * @param {string} folderId - Folder ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateFolder = async (folderId, updates) => {
  const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
  await updateDoc(folderRef, updates);
};

/**
 * Delete a folder (moves links to unfiled)
 * @param {string} folderId - Folder ID
 * @returns {Promise<void>}
 */
export const deleteFolder = async (folderId) => {
  // First, move all links in this folder to unfiled
  const linksQuery = query(
    collection(db, LINKS_COLLECTION),
    where('folderId', '==', folderId)
  );

  const snapshot = await getDocs(linksQuery);
  const updatePromises = snapshot.docs.map(doc =>
    updateDoc(doc.ref, { folderId: null })
  );

  await Promise.all(updatePromises);

  // Then delete the folder
  const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
  await deleteDoc(folderRef);
};

// ============================================================
// Tag Operations
// ============================================================

/**
 * Get all unique tags for a user
 * @param {string} userId - Firebase user ID
 * @returns {Promise<string[]>} Unique tags
 */
export const getUserTags = async (userId) => {
  const q = query(
    collection(db, LINKS_COLLECTION),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const allTags = new Set();

  snapshot.docs.forEach(doc => {
    const tags = doc.data().tags || [];
    tags.forEach(tag => allTags.add(tag));
  });

  return Array.from(allTags).sort();
};

/**
 * Get link count by tag
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} Tag counts
 */
export const getTagCounts = async (userId) => {
  const q = query(
    collection(db, LINKS_COLLECTION),
    where('userId', '==', userId),
    where('archived', '==', false)
  );

  const snapshot = await getDocs(q);
  const counts = {};

  snapshot.docs.forEach(doc => {
    const tags = doc.data().tags || [];
    tags.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });

  return counts;
};

// ============================================================
// Statistics
// ============================================================

/**
 * Get reading statistics
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} Stats
 */
export const getReadingStats = async (userId) => {
  const q = query(
    collection(db, LINKS_COLLECTION),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);

  let totalLinks = 0;
  let readLinks = 0;
  let totalReadTime = 0;
  let starred = 0;
  let archived = 0;

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    totalLinks++;
    if (data.readAt) readLinks++;
    totalReadTime += data.readTime || 0;
    if (data.starred) starred++;
    if (data.archived) archived++;
  });

  return {
    totalLinks,
    readLinks,
    unreadLinks: totalLinks - readLinks - archived,
    totalReadTime,
    averageReadTime: readLinks > 0 ? Math.round(totalReadTime / readLinks) : 0,
    starred,
    archived
  };
};

// ============================================================
// Import/Export
// ============================================================

/**
 * Import links from Pocket export
 * @param {string} userId - Firebase user ID
 * @param {Object[]} pocketLinks - Pocket export data
 * @returns {Promise<Object>} Import results
 */
export const importFromPocket = async (userId, pocketLinks) => {
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of pocketLinks) {
    try {
      // Check for duplicate URL
      const existingQuery = query(
        collection(db, LINKS_COLLECTION),
        where('userId', '==', userId),
        where('url', '==', item.given_url || item.resolved_url)
      );

      const existing = await getDocs(existingQuery);
      if (!existing.empty) {
        skipped++;
        continue;
      }

      await saveLink(userId, {
        url: item.given_url || item.resolved_url,
        title: item.given_title || item.resolved_title || 'Untitled',
        excerpt: item.excerpt || '',
        tags: item.tags ? Object.keys(item.tags) : [],
        starred: item.favorite === '1',
        archived: item.status === '1'
      });

      imported++;
    } catch (err) {
      console.error('Import error:', err);
      errors++;
    }
  }

  return { imported, skipped, errors, total: pocketLinks.length };
};

/**
 * Export links for backup
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object[]>} Exported links
 */
export const exportLinks = async (userId) => {
  const { links } = await getLinks(userId, { pageSize: 10000 });

  return links.map(link => ({
    url: link.url,
    title: link.title,
    excerpt: link.excerpt,
    tags: link.tags,
    starred: link.starred,
    archived: link.archived,
    savedAt: link.savedAt?.toDate?.()?.toISOString() || null,
    readAt: link.readAt?.toDate?.()?.toISOString() || null
  }));
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string} Domain
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

/**
 * Estimate reading time based on content length
 * @param {string} content - Text content
 * @returns {number} Estimated seconds
 */
function estimateReadTime(content) {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil((words / wordsPerMinute) * 60);
}

export default {
  // Links
  saveLink,
  getLinks,
  getLink,
  updateLink,
  deleteLink,
  toggleStar,
  archiveLink,
  updateReadProgress,
  addTags,
  removeTag,

  // Folders
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,

  // Tags
  getUserTags,
  getTagCounts,

  // Stats
  getReadingStats,

  // Import/Export
  importFromPocket,
  exportLinks
};
