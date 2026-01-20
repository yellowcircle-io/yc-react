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
    starred: linkData.starred ?? false,
    archived: linkData.archived ?? false,

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

/**
 * Bulk move links to a folder
 * @param {string} userId - Firebase user ID
 * @param {string[]} linkIds - Array of link IDs to move
 * @param {string|null} targetFolderId - Folder ID to move to (null for unfiled)
 * @returns {Promise<{ moved: number, errors: number }>}
 */
export const bulkMoveLinks = async (userId, linkIds, targetFolderId) => {
  let moved = 0;
  let errors = 0;

  for (const linkId of linkIds) {
    try {
      const linkRef = doc(db, LINKS_COLLECTION, linkId);
      await updateDoc(linkRef, { folderId: targetFolderId });
      moved++;
    } catch (err) {
      console.error(`Error moving link ${linkId}:`, err);
      errors++;
    }
  }

  return { moved, errors };
};

/**
 * Move all links with a specific tag to a folder
 * @param {string} userId - Firebase user ID
 * @param {string} tag - Tag to filter by
 * @param {string|null} targetFolderId - Folder ID to move to
 * @returns {Promise<{ moved: number, errors: number }>}
 */
export const moveTaggedLinksToFolder = async (userId, tag, targetFolderId) => {
  const q = query(
    collection(db, LINKS_COLLECTION),
    where('userId', '==', userId),
    where('tags', 'array-contains', tag.toLowerCase())
  );

  const snapshot = await getDocs(q);
  let moved = 0;
  let errors = 0;

  for (const docSnap of snapshot.docs) {
    try {
      await updateDoc(docSnap.ref, { folderId: targetFolderId });
      moved++;
    } catch (err) {
      console.error(`Error moving link ${docSnap.id}:`, err);
      errors++;
    }
  }

  return { moved, errors };
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

/**
 * Get link count by folder
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} Folder counts
 */
export const getFolderCounts = async (userId) => {
  const q = query(
    collection(db, LINKS_COLLECTION),
    where('userId', '==', userId),
    where('archived', '==', false)
  );

  const snapshot = await getDocs(q);
  const counts = { unfiled: 0 };

  snapshot.docs.forEach(doc => {
    const folderId = doc.data().folderId;
    if (folderId) {
      counts[folderId] = (counts[folderId] || 0) + 1;
    } else {
      counts.unfiled++;
    }
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
// Sharing Operations
// ============================================================

/**
 * Share a link with a user by email
 * @param {string} linkId - Link ID to share
 * @param {string} ownerId - Owner's user ID (for validation)
 * @param {string} targetEmail - Email of user to share with
 * @param {string} targetUserId - User ID of target user (optional, resolved from email)
 * @returns {Promise<Object>} Share result
 */
export const shareLink = async (linkId, ownerId, targetEmail, targetUserId = null) => {
  const linkRef = doc(db, LINKS_COLLECTION, linkId);
  const linkSnap = await getDoc(linkRef);

  if (!linkSnap.exists()) {
    throw new Error('Link not found');
  }

  const link = linkSnap.data();

  // Verify ownership
  if (link.userId !== ownerId) {
    throw new Error('Only the owner can share this link');
  }

  // Check if already shared with this email/user
  const sharedWith = link.sharedWith || [];
  const alreadyShared = sharedWith.some(
    share => share.targetEmail === targetEmail || (targetUserId && share.targetId === targetUserId)
  );

  if (alreadyShared) {
    throw new Error('Link is already shared with this user');
  }

  // Create share entry
  const shareEntry = {
    type: 'user',
    targetId: targetUserId || null,
    targetEmail: targetEmail.toLowerCase(),
    sharedAt: new Date().toISOString(),
    sharedBy: ownerId
  };

  // Update arrays
  const sharedWithUserIds = link.sharedWithUserIds || [];
  const updatedSharedWith = [...sharedWith, shareEntry];
  const updatedSharedWithUserIds = targetUserId
    ? [...new Set([...sharedWithUserIds, targetUserId])]
    : sharedWithUserIds;

  console.log('[shareLink] Updating link:', linkId);
  console.log('[shareLink] targetUserId:', targetUserId);
  console.log('[shareLink] updatedSharedWithUserIds:', updatedSharedWithUserIds);
  console.log('[shareLink] shareEntry:', shareEntry);

  await updateDoc(linkRef, {
    sharedWith: updatedSharedWith,
    sharedWithUserIds: updatedSharedWithUserIds,
    updatedAt: serverTimestamp()
  });

  console.log('[shareLink] Successfully updated link');

  return { success: true, shareEntry };
};

/**
 * Unshare a link from a user
 * @param {string} linkId - Link ID
 * @param {string} ownerId - Owner's user ID
 * @param {string} targetId - User ID or email to unshare from
 * @returns {Promise<void>}
 */
export const unshareLink = async (linkId, ownerId, targetId) => {
  const linkRef = doc(db, LINKS_COLLECTION, linkId);
  const linkSnap = await getDoc(linkRef);

  if (!linkSnap.exists()) {
    throw new Error('Link not found');
  }

  const link = linkSnap.data();

  // Verify ownership
  if (link.userId !== ownerId) {
    throw new Error('Only the owner can unshare this link');
  }

  const sharedWith = link.sharedWith || [];
  const sharedWithUserIds = link.sharedWithUserIds || [];

  // Find and remove the share
  const updatedSharedWith = sharedWith.filter(
    share => share.targetId !== targetId && share.targetEmail !== targetId
  );

  // Update user IDs array
  const removedShare = sharedWith.find(
    share => share.targetId === targetId || share.targetEmail === targetId
  );
  const updatedSharedWithUserIds = removedShare?.targetId
    ? sharedWithUserIds.filter(id => id !== removedShare.targetId)
    : sharedWithUserIds;

  await updateDoc(linkRef, {
    sharedWith: updatedSharedWith,
    sharedWithUserIds: updatedSharedWithUserIds,
    updatedAt: serverTimestamp()
  });
};

/**
 * Share a link to a canvas (capsule)
 * @param {string} linkId - Link ID
 * @param {string} ownerId - Owner's user ID
 * @param {string} capsuleId - Canvas/Capsule ID
 * @returns {Promise<Object>} Share result
 */
export const shareLinkToCanvas = async (linkId, ownerId, capsuleId) => {
  const linkRef = doc(db, LINKS_COLLECTION, linkId);
  const linkSnap = await getDoc(linkRef);

  if (!linkSnap.exists()) {
    throw new Error('Link not found');
  }

  const link = linkSnap.data();

  // Verify ownership
  if (link.userId !== ownerId) {
    throw new Error('Only the owner can share this link');
  }

  // Check if already shared with this canvas
  const sharedWith = link.sharedWith || [];
  const alreadyShared = sharedWith.some(
    share => share.type === 'canvas' && share.targetId === capsuleId
  );

  if (alreadyShared) {
    throw new Error('Link is already shared with this canvas');
  }

  // Create share entry
  const shareEntry = {
    type: 'canvas',
    targetId: capsuleId,
    sharedAt: new Date().toISOString(),
    sharedBy: ownerId
  };

  // Update arrays
  const sharedWithCanvasIds = link.sharedWithCanvasIds || [];
  const updatedSharedWith = [...sharedWith, shareEntry];
  const updatedSharedWithCanvasIds = [...new Set([...sharedWithCanvasIds, capsuleId])];

  await updateDoc(linkRef, {
    sharedWith: updatedSharedWith,
    sharedWithCanvasIds: updatedSharedWithCanvasIds,
    updatedAt: serverTimestamp()
  });

  return { success: true, shareEntry };
};

/**
 * Unshare a link from a canvas
 * @param {string} linkId - Link ID
 * @param {string} ownerId - Owner's user ID
 * @param {string} capsuleId - Canvas ID to unshare from
 * @returns {Promise<void>}
 */
export const unshareLinkFromCanvas = async (linkId, ownerId, capsuleId) => {
  const linkRef = doc(db, LINKS_COLLECTION, linkId);
  const linkSnap = await getDoc(linkRef);

  if (!linkSnap.exists()) {
    throw new Error('Link not found');
  }

  const link = linkSnap.data();

  // Verify ownership
  if (link.userId !== ownerId) {
    throw new Error('Only the owner can unshare this link');
  }

  const sharedWith = link.sharedWith || [];
  const sharedWithCanvasIds = link.sharedWithCanvasIds || [];

  // Remove canvas share
  const updatedSharedWith = sharedWith.filter(
    share => !(share.type === 'canvas' && share.targetId === capsuleId)
  );
  const updatedSharedWithCanvasIds = sharedWithCanvasIds.filter(id => id !== capsuleId);

  await updateDoc(linkRef, {
    sharedWith: updatedSharedWith,
    sharedWithCanvasIds: updatedSharedWithCanvasIds,
    updatedAt: serverTimestamp()
  });
};

/**
 * Get links shared with a user
 * @param {string} userId - User ID to get shared links for
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Links and pagination info
 */
export const getSharedWithMeLinks = async (userId, options = {}) => {
  const {
    archived = false,
    sortBy = 'savedAt',
    sortOrder = 'desc',
    pageSize = 20,
    lastDoc = null
  } = options;

  console.log('[getSharedWithMeLinks] Querying for userId:', userId, 'archived:', archived);

  let q = query(
    collection(db, LINKS_COLLECTION),
    where('sharedWithUserIds', 'array-contains', userId),
    where('archived', '==', archived),
    orderBy(sortBy, sortOrder),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  console.log('[getSharedWithMeLinks] Found', links.length, 'links');

  return {
    links,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize
  };
};

/**
 * Get links shared to a canvas
 * @param {string} capsuleId - Canvas/Capsule ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Links and pagination info
 */
export const getCanvasSharedLinks = async (capsuleId, options = {}) => {
  const {
    archived = false,
    sortBy = 'savedAt',
    sortOrder = 'desc',
    pageSize = 20,
    lastDoc = null
  } = options;

  let q = query(
    collection(db, LINKS_COLLECTION),
    where('sharedWithCanvasIds', 'array-contains', capsuleId),
    where('archived', '==', archived),
    orderBy(sortBy, sortOrder),
    limit(pageSize)
  );

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
 * Get sharing info for a link
 * @param {string} linkId - Link ID
 * @returns {Promise<Object>} Sharing information
 */
export const getLinkSharingInfo = async (linkId) => {
  const link = await getLink(linkId);
  if (!link) {
    throw new Error('Link not found');
  }

  return {
    sharedWith: link.sharedWith || [],
    sharedWithUserIds: link.sharedWithUserIds || [],
    sharedWithCanvasIds: link.sharedWithCanvasIds || [],
    isShared: (link.sharedWith || []).length > 0
  };
};

/**
 * Fix existing shares that are missing userId
 * This handles shares that were made before the userId resolution fix
 * @param {string} linkId - Link ID to fix
 * @param {Function} lookupUserByEmail - Async function that takes email and returns userId or null
 * @returns {Promise<Object>} Result with fixed count
 */
export const fixMissingUserIds = async (linkId, lookupUserByEmail) => {
  const linkRef = doc(db, LINKS_COLLECTION, linkId);
  const linkSnap = await getDoc(linkRef);

  if (!linkSnap.exists()) {
    throw new Error('Link not found');
  }

  const link = linkSnap.data();
  const sharedWith = link.sharedWith || [];
  let sharedWithUserIds = link.sharedWithUserIds || [];
  let fixedCount = 0;

  // Find shares with email but no targetId
  const updatedSharedWith = await Promise.all(
    sharedWith.map(async (share) => {
      if (share.type === 'user' && share.targetEmail && !share.targetId) {
        try {
          const userId = await lookupUserByEmail(share.targetEmail);
          if (userId) {
            fixedCount++;
            sharedWithUserIds = [...new Set([...sharedWithUserIds, userId])];
            return { ...share, targetId: userId };
          }
        } catch (err) {
          console.warn(`[fixMissingUserIds] Could not resolve ${share.targetEmail}:`, err.message);
        }
      }
      return share;
    })
  );

  if (fixedCount > 0) {
    await updateDoc(linkRef, {
      sharedWith: updatedSharedWith,
      sharedWithUserIds: sharedWithUserIds,
      updatedAt: serverTimestamp()
    });
    console.log(`[fixMissingUserIds] Fixed ${fixedCount} shares for link ${linkId}`);
  }

  return { fixedCount, sharedWithUserIds };
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
  exportLinks,

  // Sharing
  shareLink,
  unshareLink,
  shareLinkToCanvas,
  unshareLinkFromCanvas,
  getSharedWithMeLinks,
  getCanvasSharedLinks,
  getLinkSharingInfo,
  fixMissingUserIds
};
