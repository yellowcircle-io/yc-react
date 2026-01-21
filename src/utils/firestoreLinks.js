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
  addDoc,
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
const NOTIFICATIONS_COLLECTION = 'notifications';
const FOLDERS_COLLECTION = 'link_folders';
const TAGS_COLLECTION = 'link_tags';
const COMMENTS_COLLECTION = 'comments';

// ============================================================
// Notification Helper
// ============================================================

/**
 * Create an in-app notification
 * @param {Object} params - Notification parameters
 * @returns {Promise<boolean>} Success status
 */
const createNotification = async ({
  userId,
  userEmail,
  type,
  title,
  message,
  actionUrl = null,
  metadata = {}
}) => {
  try {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    await addDoc(notificationsRef, {
      userId,
      userEmail: userEmail?.toLowerCase() || null,
      type,
      title,
      message,
      actionUrl,
      metadata,
      read: false,
      dismissed: false,
      createdAt: serverTimestamp()
    });
    console.log(`[Notification] Created: ${type} for ${userEmail || userId}`);
    return true;
  } catch (error) {
    console.error('[Notification] Error creating notification:', error);
    return false;
  }
};

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
 * Default system folders configuration
 * Note: Archive is handled via the "archived" flag on links, not a folder
 */
const DEFAULT_FOLDERS = [
  {
    name: 'Inbox',
    color: '#3B82F6', // blue
    icon: 'inbox',
    order: -1,
    isSystem: true
  }
];

/**
 * Ensure default system folders exist for a user
 * Creates Inbox and Archive folders if they don't exist
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object[]>} All folders including newly created ones
 */
export const ensureDefaultFolders = async (userId) => {
  // Get existing folders
  const existingFolders = await getFolders(userId);
  const existingNames = existingFolders.map(f => f.name.toLowerCase());

  const createdFolders = [];

  for (const defaultFolder of DEFAULT_FOLDERS) {
    // Check if system folder already exists (by name)
    if (!existingNames.includes(defaultFolder.name.toLowerCase())) {
      const folderRef = doc(collection(db, FOLDERS_COLLECTION));

      const folder = {
        id: folderRef.id,
        userId,
        name: defaultFolder.name,
        color: defaultFolder.color,
        icon: defaultFolder.icon,
        parentId: null,
        order: defaultFolder.order,
        isSystem: true,
        createdAt: serverTimestamp()
      };

      await setDoc(folderRef, folder);
      createdFolders.push(folder);
      console.log(`[ensureDefaultFolders] Created system folder: ${defaultFolder.name}`);
    }
  }

  return createdFolders;
};

/**
 * Cleanup duplicate or unwanted system folders
 * Removes Archive system folders (Archive is a view, not a folder)
 * @param {string} userId - Firebase user ID
 * @returns {Promise<string[]>} IDs of deleted folders
 */
export const cleanupDuplicateSystemFolders = async (userId) => {
  const existingFolders = await getFolders(userId);
  const deletedIds = [];

  // Find and delete Archive system folders (Archive is a view, not a folder)
  const archiveFolders = existingFolders.filter(
    f => f.name.toLowerCase() === 'archive' && f.isSystem === true
  );

  for (const folder of archiveFolders) {
    try {
      await deleteDoc(doc(db, FOLDERS_COLLECTION, folder.id));
      deletedIds.push(folder.id);
      console.log(`[cleanupDuplicateSystemFolders] Deleted Archive system folder: ${folder.id}`);
    } catch (err) {
      console.error(`[cleanupDuplicateSystemFolders] Failed to delete folder ${folder.id}:`, err);
    }
  }

  return deletedIds;
};

/**
 * Backfill sharedWithEmails for existing shares
 * Populates the sharedWithEmails array from sharedWith entries
 * This enables email-based querying for shares
 * @param {string} userId - Firebase user ID (owner of links to backfill)
 * @returns {Promise<{updated: number, skipped: number, errors: number}>} Backfill stats
 */
export const backfillSharedWithEmails = async (userId) => {
  console.log('[backfillSharedWithEmails] Starting backfill for user:', userId);

  // Get all links owned by this user that have shares
  const q = query(
    collection(db, LINKS_COLLECTION),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const stats = { updated: 0, skipped: 0, errors: 0 };

  for (const docSnapshot of snapshot.docs) {
    const link = docSnapshot.data();
    const sharedWith = link.sharedWith || [];

    // Skip if no shares
    if (sharedWith.length === 0) {
      continue;
    }

    // Extract emails from user shares
    const userEmails = sharedWith
      .filter(share => share.type === 'user' && share.targetEmail)
      .map(share => share.targetEmail.toLowerCase());

    // Check if sharedWithEmails already exists and is up-to-date
    const existingEmails = link.sharedWithEmails || [];
    const emailsSet = new Set([...existingEmails, ...userEmails]);
    const newEmails = Array.from(emailsSet);

    // Skip if no changes needed
    if (existingEmails.length === newEmails.length &&
        existingEmails.every(email => newEmails.includes(email))) {
      stats.skipped++;
      continue;
    }

    // Update the link with the populated sharedWithEmails
    try {
      await updateDoc(doc(db, LINKS_COLLECTION, docSnapshot.id), {
        sharedWithEmails: newEmails,
        updatedAt: serverTimestamp()
      });
      stats.updated++;
      console.log(`[backfillSharedWithEmails] Updated link ${docSnapshot.id} with emails:`, newEmails);
    } catch (err) {
      console.error(`[backfillSharedWithEmails] Error updating link ${docSnapshot.id}:`, err);
      stats.errors++;
    }
  }

  console.log('[backfillSharedWithEmails] Backfill complete:', stats);
  return stats;
};

/**
 * Backfill targetName for canvas shares
 * Populates the targetName field from the capsules collection
 * @param {string} userId - Firebase user ID (owner of links to backfill)
 * @returns {Promise<{updated: number, skipped: number, errors: number}>} Backfill stats
 */
export const backfillCanvasShareNames = async (userId) => {
  console.log('[backfillCanvasShareNames] Starting backfill for user:', userId);

  // Get all links owned by this user that have shares
  const q = query(
    collection(db, LINKS_COLLECTION),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const stats = { updated: 0, skipped: 0, errors: 0 };

  // Cache canvas names to avoid repeated lookups
  const canvasNameCache = new Map();

  const getCanvasName = async (canvasId) => {
    if (canvasNameCache.has(canvasId)) {
      return canvasNameCache.get(canvasId);
    }
    try {
      const capsuleDoc = await getDoc(doc(db, 'capsules', canvasId));
      const name = capsuleDoc.exists() ? capsuleDoc.data().title : null;
      canvasNameCache.set(canvasId, name);
      return name;
    } catch (err) {
      console.error(`[backfillCanvasShareNames] Error fetching canvas ${canvasId}:`, err);
      return null;
    }
  };

  for (const docSnapshot of snapshot.docs) {
    const link = docSnapshot.data();
    const sharedWith = link.sharedWith || [];

    // Find canvas shares without targetName
    const canvasShares = sharedWith.filter(share => share.type === 'canvas');
    if (canvasShares.length === 0) {
      continue;
    }

    // Check if any canvas shares need the name populated
    const needsUpdate = canvasShares.some(share => !share.targetName || share.targetName === 'Canvas');
    if (!needsUpdate) {
      stats.skipped++;
      continue;
    }

    // Update canvas shares with names
    let updated = false;
    const updatedSharedWith = await Promise.all(sharedWith.map(async (share) => {
      if (share.type === 'canvas' && (!share.targetName || share.targetName === 'Canvas')) {
        const canvasName = await getCanvasName(share.targetId);
        if (canvasName) {
          updated = true;
          return { ...share, targetName: canvasName };
        }
      }
      return share;
    }));

    if (!updated) {
      stats.skipped++;
      continue;
    }

    // Update the link
    try {
      await updateDoc(doc(db, LINKS_COLLECTION, docSnapshot.id), {
        sharedWith: updatedSharedWith,
        updatedAt: serverTimestamp()
      });
      stats.updated++;
      console.log(`[backfillCanvasShareNames] Updated link ${docSnapshot.id}`);
    } catch (err) {
      console.error(`[backfillCanvasShareNames] Error updating link ${docSnapshot.id}:`, err);
      stats.errors++;
    }
  }

  console.log('[backfillCanvasShareNames] Backfill complete:', stats);
  return stats;
};

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
    isSystem: false,
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
 * System folders cannot be deleted
 * @param {string} folderId - Folder ID
 * @returns {Promise<void>}
 */
export const deleteFolder = async (folderId) => {
  // Check if it's a system folder
  const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
  const folderSnap = await getDoc(folderRef);

  if (folderSnap.exists() && folderSnap.data().isSystem) {
    throw new Error('Cannot delete system folders');
  }

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

  // Also update any child folders to have no parent
  const childFoldersQuery = query(
    collection(db, FOLDERS_COLLECTION),
    where('parentId', '==', folderId)
  );
  const childSnapshot = await getDocs(childFoldersQuery);
  const childUpdatePromises = childSnapshot.docs.map(doc =>
    updateDoc(doc.ref, { parentId: null })
  );
  await Promise.all(childUpdatePromises);

  // Then delete the folder
  await deleteDoc(folderRef);
};

/**
 * Reorder folders (for drag-drop)
 * @param {string} userId - Firebase user ID
 * @param {string[]} orderedIds - Array of folder IDs in new order
 * @returns {Promise<void>}
 */
export const reorderFolders = async (userId, orderedIds) => {
  const batch = [];

  orderedIds.forEach((id, index) => {
    const folderRef = doc(db, FOLDERS_COLLECTION, id);
    batch.push(updateDoc(folderRef, { order: index }));
  });

  await Promise.all(batch);
};

/**
 * Move a folder to a new parent (for nesting)
 * @param {string} folderId - Folder ID to move
 * @param {string|null} newParentId - New parent folder ID (null for root)
 * @returns {Promise<void>}
 */
export const moveFolder = async (folderId, newParentId) => {
  // Prevent moving a folder into itself or its descendants
  if (newParentId) {
    let currentParent = newParentId;
    const visited = new Set();

    while (currentParent) {
      if (currentParent === folderId || visited.has(currentParent)) {
        throw new Error('Cannot move folder into itself or its descendants');
      }
      visited.add(currentParent);

      const parentRef = doc(db, FOLDERS_COLLECTION, currentParent);
      const parentSnap = await getDoc(parentRef);
      currentParent = parentSnap.exists() ? parentSnap.data().parentId : null;
    }
  }

  const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
  await updateDoc(folderRef, { parentId: newParentId || null });
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
// Folder Sharing Operations
// ============================================================

/**
 * Share a folder with a user
 * @param {string} folderId - Folder ID
 * @param {string} ownerId - Owner's user ID (for validation)
 * @param {string} targetEmail - Email of user to share with
 * @param {string} targetUserId - User ID of target user (optional, resolved from email)
 * @returns {Promise<Object>} Share result
 */
export const shareFolder = async (folderId, ownerId, targetEmail, targetUserId = null) => {
  const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
  const folderSnap = await getDoc(folderRef);

  if (!folderSnap.exists()) {
    throw new Error('Folder not found');
  }

  const folder = folderSnap.data();

  // Verify ownership
  if (folder.userId !== ownerId) {
    throw new Error('Only the owner can share this folder');
  }

  // Check if already shared with this email/user
  const sharedWith = folder.sharedWith || [];
  const alreadyShared = sharedWith.some(
    share => share.targetEmail === targetEmail || (targetUserId && share.targetId === targetUserId)
  );

  if (alreadyShared) {
    throw new Error('Folder is already shared with this user');
  }

  // Create share entry
  const shareEntry = {
    targetId: targetUserId || null,
    targetEmail: targetEmail.toLowerCase(),
    role: 'viewer',
    sharedAt: new Date().toISOString(),
    sharedBy: ownerId
  };

  // Update arrays
  const sharedWithUserIds = folder.sharedWithUserIds || [];
  const sharedWithEmails = folder.sharedWithEmails || [];
  const updatedSharedWith = [...sharedWith, shareEntry];
  const updatedSharedWithUserIds = targetUserId
    ? [...new Set([...sharedWithUserIds, targetUserId])]
    : sharedWithUserIds;
  const updatedSharedWithEmails = [...new Set([...sharedWithEmails, targetEmail.toLowerCase()])];

  console.log('[shareFolder] Sharing folder:', folderId, 'with:', targetEmail);

  await updateDoc(folderRef, {
    sharedWith: updatedSharedWith,
    sharedWithUserIds: updatedSharedWithUserIds,
    sharedWithEmails: updatedSharedWithEmails,
    updatedAt: serverTimestamp()
  });

  // Create notification for the recipient
  // Get owner's email for the notification message
  const ownerRef = doc(db, 'users', ownerId);
  const ownerSnap = await getDoc(ownerRef);
  const ownerEmail = ownerSnap.exists() ? ownerSnap.data().email : 'Someone';
  const ownerName = ownerEmail.split('@')[0];

  await createNotification({
    userId: targetUserId || '',
    userEmail: targetEmail,
    type: 'folder_shared',
    title: 'Folder shared with you',
    message: `${ownerName} shared the folder "${folder.name}" with you`,
    actionUrl: '/links',
    metadata: {
      folderId,
      folderName: folder.name,
      sharedBy: ownerId,
      sharedByEmail: ownerEmail
    }
  });

  return { success: true, shareEntry };
};

/**
 * Unshare a folder from a user
 * @param {string} folderId - Folder ID
 * @param {string} ownerId - Owner's user ID
 * @param {string} targetId - User ID or email to unshare from
 * @returns {Promise<void>}
 */
export const unshareFolder = async (folderId, ownerId, targetId) => {
  const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
  const folderSnap = await getDoc(folderRef);

  if (!folderSnap.exists()) {
    throw new Error('Folder not found');
  }

  const folder = folderSnap.data();

  // Verify ownership
  if (folder.userId !== ownerId) {
    throw new Error('Only the owner can unshare this folder');
  }

  const sharedWith = folder.sharedWith || [];
  const sharedWithUserIds = folder.sharedWithUserIds || [];
  const sharedWithEmails = folder.sharedWithEmails || [];

  // Find and remove the share
  const removedShare = sharedWith.find(
    share => share.targetId === targetId || share.targetEmail === targetId
  );
  const updatedSharedWith = sharedWith.filter(
    share => share.targetId !== targetId && share.targetEmail !== targetId
  );

  // Update user IDs array
  const updatedSharedWithUserIds = removedShare?.targetId
    ? sharedWithUserIds.filter(id => id !== removedShare.targetId)
    : sharedWithUserIds;

  // Update emails array
  const updatedSharedWithEmails = removedShare?.targetEmail
    ? sharedWithEmails.filter(email => email !== removedShare.targetEmail.toLowerCase())
    : sharedWithEmails;

  await updateDoc(folderRef, {
    sharedWith: updatedSharedWith,
    sharedWithUserIds: updatedSharedWithUserIds,
    sharedWithEmails: updatedSharedWithEmails,
    updatedAt: serverTimestamp()
  });
};

/**
 * Get folders shared with a user
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<Object[]>} Shared folders
 */
export const getSharedFolders = async (userId) => {
  console.log('[getSharedFolders] Querying for userId:', userId);

  const q = query(
    collection(db, FOLDERS_COLLECTION),
    where('sharedWithUserIds', 'array-contains', userId)
  );

  const snapshot = await getDocs(q);
  const folders = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    _isSharedWithMe: true
  }));

  console.log('[getSharedFolders] Found', folders.length, 'folders');
  return folders;
};

/**
 * Get folders shared with user by email (fallback)
 * @param {string} userEmail - User's email address
 * @returns {Promise<Object[]>} Shared folders
 */
export const getSharedFoldersByEmail = async (userEmail) => {
  const normalizedEmail = userEmail.toLowerCase();
  console.log('[getSharedFoldersByEmail] Querying for email:', normalizedEmail);

  const q = query(
    collection(db, FOLDERS_COLLECTION),
    where('sharedWithEmails', 'array-contains', normalizedEmail)
  );

  const snapshot = await getDocs(q);
  const folders = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    _isSharedWithMe: true
  }));

  console.log('[getSharedFoldersByEmail] Found', folders.length, 'folders');
  return folders;
};

/**
 * Get all folders shared with a user (combines userId and email queries)
 * @param {string} userId - User's Firebase UID
 * @param {string} userEmail - User's email address
 * @returns {Promise<Object[]>} Combined shared folders (deduplicated)
 */
export const getAllSharedFolders = async (userId, userEmail) => {
  const [byId, byEmail] = await Promise.all([
    getSharedFolders(userId),
    getSharedFoldersByEmail(userEmail)
  ]);

  // Deduplicate by folder ID
  const folderMap = new Map();
  [...byId, ...byEmail].forEach(folder => {
    if (!folderMap.has(folder.id)) {
      folderMap.set(folder.id, folder);
    }
  });

  return Array.from(folderMap.values());
};

/**
 * Get sharing info for a folder
 * @param {string} folderId - Folder ID
 * @returns {Promise<Object>} Sharing info
 */
export const getFolderSharingInfo = async (folderId) => {
  const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
  const folderSnap = await getDoc(folderRef);

  if (!folderSnap.exists()) {
    throw new Error('Folder not found');
  }

  const folder = folderSnap.data();

  return {
    sharedWith: folder.sharedWith || [],
    sharedWithUserIds: folder.sharedWithUserIds || [],
    sharedWithEmails: folder.sharedWithEmails || [],
    isShared: (folder.sharedWith || []).length > 0
  };
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
  const sharedWithEmails = link.sharedWithEmails || [];
  const updatedSharedWith = [...sharedWith, shareEntry];
  const updatedSharedWithUserIds = targetUserId
    ? [...new Set([...sharedWithUserIds, targetUserId])]
    : sharedWithUserIds;
  const updatedSharedWithEmails = [...new Set([...sharedWithEmails, targetEmail.toLowerCase()])];

  console.log('[shareLink] Updating link:', linkId);
  console.log('[shareLink] targetUserId:', targetUserId);
  console.log('[shareLink] updatedSharedWithUserIds:', updatedSharedWithUserIds);
  console.log('[shareLink] updatedSharedWithEmails:', updatedSharedWithEmails);
  console.log('[shareLink] shareEntry:', shareEntry);

  await updateDoc(linkRef, {
    sharedWith: updatedSharedWith,
    sharedWithUserIds: updatedSharedWithUserIds,
    sharedWithEmails: updatedSharedWithEmails,
    updatedAt: serverTimestamp()
  });

  console.log('[shareLink] Successfully updated link');

  // Create notification for the recipient
  const ownerRef = doc(db, 'users', ownerId);
  const ownerSnap = await getDoc(ownerRef);
  const ownerEmail = ownerSnap.exists() ? ownerSnap.data().email : 'Someone';
  const ownerName = ownerEmail.split('@')[0];

  await createNotification({
    userId: targetUserId || '',
    userEmail: targetEmail,
    type: 'link_shared',
    title: 'Link shared with you',
    message: `${ownerName} shared a link: "${link.title || link.url}"`,
    actionUrl: '/links',
    metadata: {
      linkId,
      linkTitle: link.title,
      linkUrl: link.url,
      sharedBy: ownerId,
      sharedByEmail: ownerEmail
    }
  });

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
  const sharedWithEmails = link.sharedWithEmails || [];

  // Find and remove the share
  const removedShare = sharedWith.find(
    share => share.targetId === targetId || share.targetEmail === targetId
  );
  const updatedSharedWith = sharedWith.filter(
    share => share.targetId !== targetId && share.targetEmail !== targetId
  );

  // Update user IDs array
  const updatedSharedWithUserIds = removedShare?.targetId
    ? sharedWithUserIds.filter(id => id !== removedShare.targetId)
    : sharedWithUserIds;

  // Update emails array
  const updatedSharedWithEmails = removedShare?.targetEmail
    ? sharedWithEmails.filter(email => email !== removedShare.targetEmail.toLowerCase())
    : sharedWithEmails;

  await updateDoc(linkRef, {
    sharedWith: updatedSharedWith,
    sharedWithUserIds: updatedSharedWithUserIds,
    sharedWithEmails: updatedSharedWithEmails,
    updatedAt: serverTimestamp()
  });
};

/**
 * Share a link to a canvas (capsule)
 * @param {string} linkId - Link ID
 * @param {string} ownerId - Owner's user ID
 * @param {string} capsuleId - Canvas/Capsule ID
 * @param {string} canvasName - Canvas name (for display in tooltips)
 * @returns {Promise<Object>} Share result
 */
export const shareLinkToCanvas = async (linkId, ownerId, capsuleId, canvasName = null) => {
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
    targetName: canvasName || 'Canvas',
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
 * Get links shared with user by email address
 * This is a fallback for when sharedWithUserIds wasn't populated
 * @param {string} userEmail - User's email address
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Links and pagination info
 */
export const getSharedWithMeByEmail = async (userEmail, options = {}) => {
  const {
    archived = false,
    sortBy = 'savedAt',
    sortOrder = 'desc',
    pageSize = 20,
    lastDoc = null
  } = options;

  const normalizedEmail = userEmail.toLowerCase();
  console.log('[getSharedWithMeByEmail] Querying for email:', normalizedEmail);

  let q = query(
    collection(db, LINKS_COLLECTION),
    where('sharedWithEmails', 'array-contains', normalizedEmail),
    where('archived', '==', archived),
    orderBy(sortBy, sortOrder),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  console.log('[getSharedWithMeByEmail] Found', links.length, 'links');

  return {
    links,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize
  };
};

/**
 * Get all links shared with a user (combines userId and email queries)
 * @param {string} userId - User's Firebase UID
 * @param {string} userEmail - User's email address
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Merged, deduplicated links
 */
export const getAllSharedWithMeLinks = async (userId, userEmail, options = {}) => {
  const { pageSize = 50 } = options;

  // Query by both userId and email, merge and dedupe
  const [byIdResult, byEmailResult] = await Promise.all([
    getSharedWithMeLinks(userId, { ...options, pageSize }),
    userEmail ? getSharedWithMeByEmail(userEmail, { ...options, pageSize }) : Promise.resolve({ links: [] })
  ]);

  // Merge and dedupe by link ID
  const linkMap = new Map();
  [...byIdResult.links, ...byEmailResult.links].forEach(link => {
    if (!linkMap.has(link.id)) {
      linkMap.set(link.id, link);
    }
  });

  // Convert to array and sort
  let links = Array.from(linkMap.values());
  const sortBy = options.sortBy || 'savedAt';
  const sortOrder = options.sortOrder || 'desc';
  links.sort((a, b) => {
    const aVal = a[sortBy]?.toDate?.() || a[sortBy] || 0;
    const bVal = b[sortBy]?.toDate?.() || b[sortBy] || 0;
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Apply pageSize limit
  const hasMore = links.length > pageSize;
  links = links.slice(0, pageSize);

  console.log('[getAllSharedWithMeLinks] Total merged links:', links.length);

  return {
    links,
    lastDoc: null,
    hasMore
  };
};

/**
 * Get links shared to a canvas or multiple canvases
 * @param {string|string[]} capsuleIds - Canvas/Capsule ID(s) - can be single ID or array
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Links and pagination info
 */
export const getCanvasSharedLinks = async (capsuleIds, options = {}) => {
  const {
    archived = false,
    sortBy = 'savedAt',
    sortOrder = 'desc',
    pageSize = 20,
    lastDoc = null
  } = options;

  // Handle array of canvas IDs - query each and merge results
  const idsArray = Array.isArray(capsuleIds) ? capsuleIds : [capsuleIds];

  if (idsArray.length === 0) {
    return { links: [], lastDoc: null, hasMore: false };
  }

  // For multiple canvases, we need to query each separately and merge
  // (Firestore doesn't support array-contains with multiple values)
  const allLinks = new Map(); // Use Map to dedupe by link ID

  for (const capsuleId of idsArray) {
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
    snapshot.docs.forEach(doc => {
      if (!allLinks.has(doc.id)) {
        allLinks.set(doc.id, { id: doc.id, ...doc.data() });
      }
    });
  }

  // Convert to array and sort
  let links = Array.from(allLinks.values());
  links.sort((a, b) => {
    const aVal = a[sortBy]?.toDate?.() || a[sortBy] || 0;
    const bVal = b[sortBy]?.toDate?.() || b[sortBy] || 0;
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Apply pageSize limit
  const hasMore = links.length > pageSize;
  links = links.slice(0, pageSize);

  return {
    links,
    lastDoc: null, // Pagination is complex with merged results
    hasMore
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
// Comments Operations (Unified across Links, Folders, Canvases)
// ============================================================

/**
 * Add a comment to any target (link, folder, capsule/canvas)
 * @param {Object} params - Comment parameters
 * @param {string} params.targetType - 'link' | 'folder' | 'capsule'
 * @param {string} params.targetId - ID of the target
 * @param {string} params.authorId - Firebase UID of commenter
 * @param {string} params.authorName - Display name of commenter
 * @param {string} params.authorEmail - Email of commenter
 * @param {string} params.content - Comment text (max 2000 chars)
 * @param {string|null} params.parentCommentId - Parent comment ID for threading
 * @returns {Promise<Object>} Created comment
 */
export const addComment = async ({
  targetType,
  targetId,
  authorId,
  authorName,
  authorEmail,
  content,
  parentCommentId = null
}) => {
  // Validate content length
  if (!content || content.length > 2000) {
    throw new Error('Comment must be between 1 and 2000 characters');
  }

  // Validate target type
  if (!['link', 'folder', 'capsule'].includes(targetType)) {
    throw new Error('Invalid target type. Must be link, folder, or capsule');
  }

  // Parse mentions from content
  const mentionRegex = /@([^\s@]+@[^\s@]+\.[^\s@]+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }

  const commentRef = doc(collection(db, COMMENTS_COLLECTION));
  const now = new Date();

  const commentForFirestore = {
    targetType,
    targetId,
    authorId,
    authorName: authorName || 'User',
    authorEmail: authorEmail?.toLowerCase() || null,
    content,
    mentions,
    parentCommentId,
    createdAt: serverTimestamp(),
    editedAt: null
  };

  await setDoc(commentRef, commentForFirestore);

  // Create notifications for mentions
  if (mentions.length > 0) {
    const targetLabel = targetType === 'capsule' ? 'a canvas' : `a ${targetType}`;
    for (const mentionedEmail of mentions) {
      await createNotification({
        userId: '',
        userEmail: mentionedEmail,
        type: 'comment_mention',
        title: 'You were mentioned in a comment',
        message: `${authorName} mentioned you in a comment on ${targetLabel}`,
        actionUrl: targetType === 'link' ? '/links' : targetType === 'folder' ? '/links' : `/capsule/${targetId}`,
        metadata: {
          targetType,
          targetId,
          commentId: commentRef.id,
          mentionedBy: authorId,
          mentionedByName: authorName
        }
      });
    }
  }

  // Return with local timestamp for immediate UI display
  return {
    id: commentRef.id,
    targetType,
    targetId,
    authorId,
    authorName: authorName || 'User',
    authorEmail: authorEmail?.toLowerCase() || null,
    content,
    mentions,
    parentCommentId,
    createdAt: now,
    editedAt: null
  };
};

/**
 * Get comments for a target
 * @param {string} targetType - 'link' | 'folder' | 'capsule'
 * @param {string} targetId - ID of the target
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Comments sorted by createdAt
 */
export const getComments = async (targetType, targetId, options = {}) => {
  const { pageSize = 50, includeReplies = true } = options;

  let q = query(
    collection(db, COMMENTS_COLLECTION),
    where('targetType', '==', targetType),
    where('targetId', '==', targetId),
    orderBy('createdAt', 'asc'),
    limit(pageSize)
  );

  // If not including replies, only get top-level comments
  if (!includeReplies) {
    q = query(q, where('parentCommentId', '==', null));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get comment count for a target
 * @param {string} targetType - 'link' | 'folder' | 'capsule'
 * @param {string} targetId - ID of the target
 * @returns {Promise<number>} Comment count
 */
export const getCommentCount = async (targetType, targetId) => {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where('targetType', '==', targetType),
    where('targetId', '==', targetId)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};

/**
 * Update a comment (only content, author can edit)
 * @param {string} commentId - Comment ID
 * @param {string} authorId - Author ID for verification
 * @param {string} newContent - New content
 * @returns {Promise<void>}
 */
export const updateComment = async (commentId, authorId, newContent) => {
  if (!newContent || newContent.length > 2000) {
    throw new Error('Comment must be between 1 and 2000 characters');
  }

  const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
  const commentSnap = await getDoc(commentRef);

  if (!commentSnap.exists()) {
    throw new Error('Comment not found');
  }

  const comment = commentSnap.data();
  if (comment.authorId !== authorId) {
    throw new Error('Only the author can edit this comment');
  }

  // Re-parse mentions
  const mentionRegex = /@([^\s@]+@[^\s@]+\.[^\s@]+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(newContent)) !== null) {
    mentions.push(match[1].toLowerCase());
  }

  await updateDoc(commentRef, {
    content: newContent,
    mentions,
    editedAt: serverTimestamp()
  });
};

/**
 * Delete a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID for verification (author or target owner)
 * @returns {Promise<void>}
 */
export const deleteComment = async (commentId, userId) => {
  const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
  const commentSnap = await getDoc(commentRef);

  if (!commentSnap.exists()) {
    throw new Error('Comment not found');
  }

  const comment = commentSnap.data();

  // Allow deletion by author
  if (comment.authorId !== userId) {
    // Could also check if user owns the target, but for now just author
    throw new Error('Only the author can delete this comment');
  }

  // Also delete any replies to this comment
  const repliesQuery = query(
    collection(db, COMMENTS_COLLECTION),
    where('parentCommentId', '==', commentId)
  );
  const repliesSnapshot = await getDocs(repliesQuery);
  const deletePromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  // Delete the comment itself
  await deleteDoc(commentRef);
};

/**
 * Get replies to a comment
 * @param {string} parentCommentId - Parent comment ID
 * @returns {Promise<Object[]>} Replies sorted by createdAt
 */
export const getCommentReplies = async (parentCommentId) => {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where('parentCommentId', '==', parentCommentId),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  ensureDefaultFolders,
  cleanupDuplicateSystemFolders,
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  reorderFolders,
  moveFolder,

  // Folder Sharing
  shareFolder,
  unshareFolder,
  getSharedFolders,
  getSharedFoldersByEmail,
  getAllSharedFolders,
  getFolderSharingInfo,

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
  getSharedWithMeByEmail,
  getAllSharedWithMeLinks,
  getCanvasSharedLinks,
  getLinkSharingInfo,
  fixMissingUserIds,
  backfillSharedWithEmails,
  backfillCanvasShareNames,

  // Comments
  addComment,
  getComments,
  getCommentCount,
  updateComment,
  deleteComment,
  getCommentReplies
};
