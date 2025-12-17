import { useState } from 'react';
import {
  collection,
  doc,
  writeBatch,
  getDoc,
  getDocs,
  serverTimestamp,
  increment,
  updateDoc,
  query,
  limit,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  minIntervalMs: 30000,      // Minimum 30 seconds between saves
  maxSavesPerHour: 60,       // Maximum 60 saves per hour
  cooldownAfterBurstMs: 300000  // 5 minute cooldown after hitting limit
};

/**
 * Check if save is allowed based on rate limits
 * Uses localStorage for persistence across page reloads
 */
const checkRateLimit = (capsuleId) => {
  const now = Date.now();
  const storageKey = 'capsule_save_history';

  try {
    const history = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const capsuleHistory = history[capsuleId] || { saves: [], cooldownUntil: 0 };

    // Check if in cooldown
    if (capsuleHistory.cooldownUntil > now) {
      const remainingMs = capsuleHistory.cooldownUntil - now;
      const remainingMins = Math.ceil(remainingMs / 60000);
      return {
        allowed: false,
        reason: `Rate limit cooldown. Try again in ${remainingMins} minute(s).`,
        remainingMs
      };
    }

    // Check minimum interval since last save
    const lastSave = capsuleHistory.saves[capsuleHistory.saves.length - 1] || 0;
    if (now - lastSave < RATE_LIMIT_CONFIG.minIntervalMs) {
      const remainingMs = RATE_LIMIT_CONFIG.minIntervalMs - (now - lastSave);
      const remainingSecs = Math.ceil(remainingMs / 1000);
      return {
        allowed: false,
        reason: `Please wait ${remainingSecs} seconds before saving again.`,
        remainingMs
      };
    }

    // Check hourly limit
    const oneHourAgo = now - 3600000;
    const recentSaves = capsuleHistory.saves.filter(t => t > oneHourAgo);
    if (recentSaves.length >= RATE_LIMIT_CONFIG.maxSavesPerHour) {
      // Enter cooldown
      capsuleHistory.cooldownUntil = now + RATE_LIMIT_CONFIG.cooldownAfterBurstMs;
      history[capsuleId] = capsuleHistory;
      localStorage.setItem(storageKey, JSON.stringify(history));

      return {
        allowed: false,
        reason: `Hourly save limit reached (${RATE_LIMIT_CONFIG.maxSavesPerHour}/hour). Cooldown for 5 minutes.`,
        remainingMs: RATE_LIMIT_CONFIG.cooldownAfterBurstMs
      };
    }

    return { allowed: true };

  } catch (err) {
    // If localStorage fails, allow the save
    console.warn('Rate limit check failed:', err);
    return { allowed: true };
  }
};

/**
 * Record a save in rate limit history
 */
const recordSave = (capsuleId) => {
  const storageKey = 'capsule_save_history';

  try {
    const now = Date.now();
    const history = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const capsuleHistory = history[capsuleId] || { saves: [], cooldownUntil: 0 };

    // Add new save timestamp
    capsuleHistory.saves.push(now);

    // Keep only last hour of saves (cleanup)
    const oneHourAgo = now - 3600000;
    capsuleHistory.saves = capsuleHistory.saves.filter(t => t > oneHourAgo);

    history[capsuleId] = capsuleHistory;
    localStorage.setItem(storageKey, JSON.stringify(history));

  } catch (err) {
    console.warn('Failed to record save:', err);
  }
};

// Export rate limit config for UI display
export { RATE_LIMIT_CONFIG };

// Utility to check rate limit status (for UI feedback)
export const getRateLimitStatus = (capsuleId = 'new_capsule') => {
  const check = checkRateLimit(capsuleId);
  return {
    canSave: check.allowed,
    message: check.reason || null,
    waitTimeMs: check.remainingMs || 0,
    waitTimeSecs: check.remainingMs ? Math.ceil(check.remainingMs / 1000) : 0
  };
};

export const useFirebaseCapsule = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Serialize node for storage (minimal footprint)
   */
  const serializeNode = (node) => ({
    id: node.id,
    type: node.type,
    position: {
      x: Math.round(node.position.x),
      y: Math.round(node.position.y)
    },
    data: {
      imageUrl: node.data?.imageUrl || '',
      location: node.data?.location || '',
      date: node.data?.date || '',
      description: node.data?.description || '',
      content: node.data?.content || '',
      size: node.data?.size || 350,
      // Include additional data for MAP nodes
      label: node.data?.label || '',
      subject: node.data?.subject || '',
      preview: node.data?.preview || '',
      fullBody: node.data?.fullBody || '',
      status: node.data?.status || 'draft'
    }
  });

  /**
   * Serialize edge for storage
   */
  const serializeEdge = (edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'default'
  });

  /**
   * Save capsule to Firebase (v2 - embedded model for cost efficiency)
   * Uses single document with embedded arrays instead of subcollections.
   * Reduces document count from 1 + N + E to just 1 document.
   *
   * @param {Array} nodes - React Flow nodes array
   * @param {Array} edges - React Flow edges array
   * @param {Object} metadata - Optional metadata (title, description)
   * @param {Object} options - { skipRateLimit: false, ownerId: null }
   * @returns {Promise<string>} capsuleId - Unique ID for shareable URL
   */
  const saveCapsule = async (nodes, edges, metadata = {}, ownerId = null, options = {}) => {
    const { skipRateLimit = false } = options;

    // Generate capsule ID early for rate limit check
    const capsuleRef = doc(collection(db, 'capsules'));
    const capsuleId = capsuleRef.id;

    // Rate limit check (skip for first save of a capsule)
    if (!skipRateLimit) {
      const rateLimitCheck = checkRateLimit('new_capsule');
      if (!rateLimitCheck.allowed) {
        console.warn('⚠️ Rate limited:', rateLimitCheck.reason);
        setError(rateLimitCheck.reason);
        throw new Error(rateLimitCheck.reason);
      }
    }

    setIsSaving(true);
    setError(null);

    try {

      // Calculate expiry (90 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      // Single document with embedded arrays (v3 model with collaboration)
      const capsuleDoc = {
        id: capsuleId,
        title: metadata.title || 'Travel Memories',
        description: metadata.description || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: expiresAt,
        isPublic: true,
        viewCount: 0,
        version: 3, // v3 with collaboration support
        // Collaboration fields (v3)
        ownerId: ownerId || null,
        collaborators: [],
        // Embedded arrays (cost-efficient)
        nodes: nodes.map(serializeNode),
        edges: edges.map(serializeEdge),
        // Stats for quick access
        stats: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          photoCount: nodes.filter(n => n.type === 'photoNode').length
        }
      };

      // Single write instead of batch writes to subcollections
      const { setDoc } = await import('firebase/firestore');
      await setDoc(capsuleRef, capsuleDoc);

      // Record save for rate limiting
      recordSave(capsuleId);

      console.log('✅ Capsule saved (v3 embedded):', capsuleId, '- Nodes:', nodes.length);
      return capsuleId;

    } catch (err) {
      console.error('❌ Save failed:', err);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error details:', err);

      // Enhanced error message for quota exceeded
      let errorMessage = err.message;
      if (err.code === 'resource-exhausted' || err.message.includes('quota')) {
        errorMessage = 'QUOTA_EXCEEDED: Firebase free tier limit (20,000 writes/month) has been reached. Please upgrade to Blaze plan or wait until next month.';
      } else if (err.code === 'permission-denied') {
        errorMessage = 'PERMISSION_DENIED: Check Firebase security rules.';
      }

      setError(errorMessage);

      // Create enhanced error object
      const enhancedError = new Error(errorMessage);
      enhancedError.code = err.code;
      enhancedError.originalError = err;
      throw enhancedError;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Load capsule from Firebase (supports both v1 subcollection and v2 embedded models)
   * @param {string} capsuleId - Unique capsule ID
   * @returns {Promise<Object>} { metadata, nodes, edges }
   */
  const loadCapsule = async (capsuleId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get capsule document
      const capsuleRef = doc(db, 'capsules', capsuleId);
      const capsuleSnap = await getDoc(capsuleRef);

      if (!capsuleSnap.exists()) {
        throw new Error('Capsule not found');
      }

      const capsuleData = capsuleSnap.data();
      let nodes, edges;

      // Check if v2/v3 (embedded) or v1 (subcollections)
      if (capsuleData.version >= 2 && capsuleData.nodes) {
        // v2/v3 embedded model - read directly from document
        nodes = capsuleData.nodes || [];
        edges = capsuleData.edges || [];
        console.log(`📦 Loaded v${capsuleData.version} embedded capsule`);
      } else {
        // v1 subcollection model (legacy) - read from subcollections
        const nodesRef = collection(db, `capsules/${capsuleId}/nodes`);
        const nodesQuery = query(nodesRef, limit(500));
        const nodesSnap = await getDocs(nodesQuery);
        nodes = nodesSnap.docs.map(doc => doc.data());

        const edgesRef = collection(db, `capsules/${capsuleId}/edges`);
        const edgesQuery = query(edgesRef, limit(1000));
        const edgesSnap = await getDocs(edgesQuery);
        edges = edgesSnap.docs.map(doc => doc.data());
        console.log('📂 Loaded v1 subcollection capsule (legacy)');
      }

      // Increment view count (only in production to avoid excessive writes during development)
      const isProduction = import.meta.env.PROD;
      const viewedKey = `capsule_viewed_${capsuleId}`;
      const alreadyViewed = sessionStorage.getItem(viewedKey);

      if (isProduction && !alreadyViewed) {
        try {
          await updateDoc(capsuleRef, {
            viewCount: increment(1)
          });
          sessionStorage.setItem(viewedKey, 'true');
          console.log('✅ View count incremented');
        } catch (viewCountError) {
          console.warn('Failed to increment view count:', viewCountError);
        }
      } else if (!isProduction) {
        console.log('⚠️ DEV MODE: Skipping view count increment');
      }

      console.log('✅ Capsule loaded:', capsuleId, '- Nodes:', nodes.length);

      return {
        metadata: {
          ...capsuleData,
          // Exclude embedded arrays from metadata
          nodes: undefined,
          edges: undefined
        },
        nodes,
        edges
      };

    } catch (err) {
      console.error('❌ Load failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update existing capsule (v2 - single document update)
   * @param {string} capsuleId - Existing capsule ID
   * @param {Array} nodes - Updated nodes array
   * @param {Array} edges - Updated edges array
   * @param {Object} options - { skipRateLimit: false }
   */
  const updateCapsule = async (capsuleId, nodes, edges, options = {}) => {
    const { skipRateLimit = false } = options;

    // Rate limit check
    if (!skipRateLimit) {
      const rateLimitCheck = checkRateLimit(capsuleId);
      if (!rateLimitCheck.allowed) {
        console.warn('⚠️ Rate limited:', rateLimitCheck.reason);
        setError(rateLimitCheck.reason);
        throw new Error(rateLimitCheck.reason);
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      const capsuleRef = doc(db, 'capsules', capsuleId);

      // Check if this is a v2 capsule
      const capsuleSnap = await getDoc(capsuleRef);
      const capsuleData = capsuleSnap.data();

      if (capsuleData?.version === 2) {
        // v2 embedded model - single document update
        await updateDoc(capsuleRef, {
          updatedAt: serverTimestamp(),
          nodes: nodes.map(serializeNode),
          edges: edges.map(serializeEdge),
          'stats.nodeCount': nodes.length,
          'stats.edgeCount': edges.length,
          'stats.photoCount': nodes.filter(n => n.type === 'photoNode').length
        });
        // Record save for rate limiting
        recordSave(capsuleId);
        console.log('✅ Capsule updated (v2 embedded)');
      } else {
        // v1 subcollection model (legacy) - batch updates
        const batch = writeBatch(db);

        batch.update(capsuleRef, {
          updatedAt: serverTimestamp()
        });

        nodes.forEach(node => {
          const nodeRef = doc(db, `capsules/${capsuleId}/nodes`, node.id);
          batch.set(nodeRef, serializeNode(node));
        });

        edges.forEach(edge => {
          const edgeRef = doc(db, `capsules/${capsuleId}/edges`, edge.id);
          batch.set(edgeRef, serializeEdge(edge));
        });

        await batch.commit();
        // Record save for rate limiting
        recordSave(capsuleId);
        console.log('✅ Capsule updated (v1 subcollection)');
      }

    } catch (err) {
      console.error('❌ Update failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Delete a capsule and all its subcollections
   * @param {string} capsuleId - Capsule ID to delete
   */
  const deleteCapsule = async (capsuleId) => {
    try {
      const batch = writeBatch(db);

      // Delete all nodes
      const nodesRef = collection(db, `capsules/${capsuleId}/nodes`);
      const nodesSnap = await getDocs(nodesRef);
      nodesSnap.docs.forEach(doc => batch.delete(doc.ref));

      // Delete all edges
      const edgesRef = collection(db, `capsules/${capsuleId}/edges`);
      const edgesSnap = await getDocs(edgesRef);
      edgesSnap.docs.forEach(doc => batch.delete(doc.ref));

      // Delete capsule document
      const capsuleRef = doc(db, 'capsules', capsuleId);
      batch.delete(capsuleRef);

      await batch.commit();
      console.log('✅ Capsule deleted:', capsuleId);
      return true;
    } catch (err) {
      console.error('❌ Delete failed:', err);
      throw err;
    }
  };

  /**
   * Cleanup old capsules with low/no views
   * @param {number} maxAgeDays - Delete capsules older than this (default: 30)
   * @param {number} minViews - Keep capsules with at least this many views (default: 5)
   * @returns {Promise<Object>} { deleted: number, kept: number }
   */
  const cleanupOldCapsules = async (maxAgeDays = 30, minViews = 5) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      // Query all capsules
      const capsulesRef = collection(db, 'capsules');
      const capsulesSnap = await getDocs(capsulesRef);

      let deleted = 0;
      let kept = 0;

      for (const capsuleDoc of capsulesSnap.docs) {
        const data = capsuleDoc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date(0);
        const viewCount = data.viewCount || 0;

        // Delete if old AND low views
        if (createdAt < cutoffDate && viewCount < minViews) {
          await deleteCapsule(capsuleDoc.id);
          deleted++;
          console.log(`🗑️ Deleted: ${capsuleDoc.id} (${viewCount} views, created ${createdAt.toLocaleDateString()})`);
        } else {
          kept++;
        }
      }

      console.log(`\n📊 Cleanup complete: ${deleted} deleted, ${kept} kept`);
      return { deleted, kept };
    } catch (err) {
      console.error('❌ Cleanup failed:', err);
      throw err;
    }
  };

  /**
   * Get statistics about all capsules
   * @returns {Promise<Object>} { total, totalViews, oldCapsules, lowViewCapsules }
   */
  const getCapsuleStats = async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const capsulesRef = collection(db, 'capsules');
      const capsulesSnap = await getDocs(capsulesRef);

      let total = 0;
      let totalViews = 0;
      let oldCapsules = 0;
      let lowViewCapsules = 0;

      capsulesSnap.docs.forEach(doc => {
        const data = doc.data();
        total++;
        totalViews += data.viewCount || 0;

        const createdAt = data.createdAt?.toDate?.() || new Date(0);
        if (createdAt < cutoffDate) oldCapsules++;
        if ((data.viewCount || 0) < 5) lowViewCapsules++;
      });

      return { total, totalViews, oldCapsules, lowViewCapsules };
    } catch (err) {
      console.error('❌ Stats failed:', err);
      throw err;
    }
  };

  /**
   * Migrate v1 subcollection capsules to v2 embedded model
   * This reduces Firestore document count and costs significantly.
   * Safe to run multiple times - only migrates capsules without version flag.
   *
   * @returns {Promise<Object>} { migrated: number, alreadyV2: number, failed: number }
   */
  const migrateToV2 = async () => {
    console.log('🔄 Starting v1 → v2 capsule migration...');

    try {
      const capsulesRef = collection(db, 'capsules');
      const capsulesSnap = await getDocs(capsulesRef);

      let migrated = 0;
      let alreadyV2 = 0;
      let failed = 0;

      for (const capsuleDoc of capsulesSnap.docs) {
        const data = capsuleDoc.data();
        const capsuleId = capsuleDoc.id;

        // Skip if already v2
        if (data.version === 2) {
          alreadyV2++;
          continue;
        }

        try {
          // Load nodes from subcollection
          const nodesRef = collection(db, `capsules/${capsuleId}/nodes`);
          const nodesSnap = await getDocs(nodesRef);
          const nodes = nodesSnap.docs.map(doc => doc.data());

          // Load edges from subcollection
          const edgesRef = collection(db, `capsules/${capsuleId}/edges`);
          const edgesSnap = await getDocs(edgesRef);
          const edges = edgesSnap.docs.map(doc => doc.data());

          // Calculate expiry (90 days from now for existing capsules)
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 90);

          // Update to v2 embedded format
          const capsuleRef = doc(db, 'capsules', capsuleId);
          await updateDoc(capsuleRef, {
            version: 2,
            nodes: nodes.map(serializeNode),
            edges: edges.map(serializeEdge),
            expiresAt: expiresAt,
            stats: {
              nodeCount: nodes.length,
              edgeCount: edges.length,
              photoCount: nodes.filter(n => n.type === 'photoNode').length
            }
          });

          // Delete old subcollection documents (optional - saves storage)
          const batch = writeBatch(db);
          nodesSnap.docs.forEach(nodeDoc => batch.delete(nodeDoc.ref));
          edgesSnap.docs.forEach(edgeDoc => batch.delete(edgeDoc.ref));
          await batch.commit();

          migrated++;
          console.log(`✅ Migrated: ${capsuleId} (${nodes.length} nodes, ${edges.length} edges)`);

        } catch (err) {
          failed++;
          console.error(`❌ Failed to migrate ${capsuleId}:`, err.message);
        }
      }

      console.log(`\n📊 Migration complete: ${migrated} migrated, ${alreadyV2} already v2, ${failed} failed`);
      return { migrated, alreadyV2, failed };

    } catch (err) {
      console.error('❌ Migration failed:', err);
      throw err;
    }
  };

  // ============================================
  // COLLABORATION FEATURES (v3)
  // ============================================

  /**
   * Save capsule with owner and collaboration support (v3)
   * @param {Array} nodes - React Flow nodes
   * @param {Array} edges - React Flow edges
   * @param {Object} metadata - title, description
   * @param {string} ownerId - User ID of owner
   * @param {Object} options - { skipRateLimit: false }
   * @returns {Promise<string>} capsuleId
   */
  const saveCapsuleWithOwner = async (nodes, edges, metadata = {}, ownerId, options = {}) => {
    const { skipRateLimit = false } = options;

    // Generate capsule ID early for rate limit check
    const capsuleRef = doc(collection(db, 'capsules'));
    const capsuleId = capsuleRef.id;

    // Rate limit check
    if (!skipRateLimit) {
      const rateLimitCheck = checkRateLimit('new_capsule');
      if (!rateLimitCheck.allowed) {
        console.warn('⚠️ Rate limited:', rateLimitCheck.reason);
        setError(rateLimitCheck.reason);
        throw new Error(rateLimitCheck.reason);
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      // Generate share link slug
      const shareSlug = `${capsuleId.slice(0, 8)}`;

      const capsuleDoc = {
        id: capsuleId,
        title: metadata.title || 'Untitled Canvas',
        description: metadata.description || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: expiresAt,
        isPublic: false, // Private by default for owned capsules
        viewCount: 0,
        version: 3, // v3 with collaboration
        // Owner and collaboration
        ownerId: ownerId || null,
        collaborators: [], // Array of { id, email, role, addedAt }
        shareSlug: shareSlug,
        // Embedded arrays
        nodes: nodes.map(serializeNode),
        edges: edges.map(serializeEdge),
        stats: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          photoCount: nodes.filter(n => n.type === 'photoNode').length
        }
      };

      const { setDoc } = await import('firebase/firestore');
      await setDoc(capsuleRef, capsuleDoc);

      // Record save for rate limiting
      recordSave(capsuleId);

      console.log('✅ Capsule saved (v3 with owner):', capsuleId);
      return capsuleId;

    } catch (err) {
      console.error('❌ Save failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Add a collaborator to a capsule
   * @param {string} capsuleId
   * @param {string} email - Collaborator email
   * @param {string} role - 'viewer' or 'editor'
   * @returns {Promise<Object>} Updated collaborators array
   */
  const addCollaborator = async (capsuleId, email, role = 'viewer') => {
    try {
      const capsuleRef = doc(db, 'capsules', capsuleId);
      const capsuleSnap = await getDoc(capsuleRef);

      if (!capsuleSnap.exists()) {
        throw new Error('Capsule not found');
      }

      const data = capsuleSnap.data();
      const collaborators = data.collaborators || [];

      // Check if already a collaborator
      if (collaborators.find(c => c.email === email)) {
        throw new Error('User is already a collaborator');
      }

      const newCollaborator = {
        id: `collab-${Date.now()}`,
        email: email.toLowerCase().trim(),
        role: role,
        addedAt: new Date().toISOString()
      };

      const { arrayUnion } = await import('firebase/firestore');
      await updateDoc(capsuleRef, {
        collaborators: arrayUnion(newCollaborator),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Collaborator added:', email);
      return [...collaborators, newCollaborator];

    } catch (err) {
      console.error('❌ Add collaborator failed:', err);
      throw err;
    }
  };

  /**
   * Remove a collaborator from a capsule
   * @param {string} capsuleId
   * @param {string} collaboratorId - ID or email to remove
   */
  const removeCollaborator = async (capsuleId, collaboratorId) => {
    try {
      const capsuleRef = doc(db, 'capsules', capsuleId);
      const capsuleSnap = await getDoc(capsuleRef);

      if (!capsuleSnap.exists()) {
        throw new Error('Capsule not found');
      }

      const data = capsuleSnap.data();
      const collaborators = data.collaborators || [];

      // Find and remove collaborator
      const updated = collaborators.filter(c =>
        c.id !== collaboratorId && c.email !== collaboratorId
      );

      await updateDoc(capsuleRef, {
        collaborators: updated,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Collaborator removed:', collaboratorId);
      return updated;

    } catch (err) {
      console.error('❌ Remove collaborator failed:', err);
      throw err;
    }
  };

  /**
   * Update capsule visibility (public/private)
   * @param {string} capsuleId
   * @param {boolean} isPublic
   */
  const updateVisibility = async (capsuleId, isPublic) => {
    try {
      const capsuleRef = doc(db, 'capsules', capsuleId);
      await updateDoc(capsuleRef, {
        isPublic: isPublic,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Visibility updated:', isPublic ? 'public' : 'private');

    } catch (err) {
      console.error('❌ Update visibility failed:', err);
      throw err;
    }
  };

  /**
   * Get capsules owned by or shared with a user
   * @param {string} userId - User ID
   * @param {string} userEmail - User email (for collaborator lookup)
   * @returns {Promise<Array>} Array of capsules
   */
  const getUserCapsules = async (userId, userEmail) => {
    try {
      const capsulesRef = collection(db, 'capsules');

      // Query owned capsules
      const ownedQuery = query(
        capsulesRef,
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );
      const ownedSnap = await getDocs(ownedQuery);
      const owned = ownedSnap.docs.map(doc => ({
        ...doc.data(),
        _source: 'owned'
      }));

      // For shared capsules, we need to query all and filter client-side
      // (Firestore doesn't support array-contains with object matching)
      // In production, consider denormalizing to a separate collection
      const allQuery = query(capsulesRef, limit(200));
      const allSnap = await getDocs(allQuery);
      const shared = allSnap.docs
        .map(doc => doc.data())
        .filter(cap =>
          cap.ownerId !== userId &&
          cap.collaborators?.some(c => c.email === userEmail?.toLowerCase())
        )
        .map(cap => ({ ...cap, _source: 'shared' }));

      console.log(`✅ Found ${owned.length} owned, ${shared.length} shared capsules`);
      return [...owned, ...shared];

    } catch (err) {
      console.error('❌ Get user capsules failed:', err);
      throw err;
    }
  };

  /**
   * Check if user has access to a capsule
   * @param {string} capsuleId
   * @param {string} userId
   * @param {string} userEmail
   * @returns {Promise<Object>} { hasAccess, role, isOwner }
   */
  const checkAccess = async (capsuleId, userId, userEmail) => {
    try {
      const capsuleRef = doc(db, 'capsules', capsuleId);
      const capsuleSnap = await getDoc(capsuleRef);

      if (!capsuleSnap.exists()) {
        return { hasAccess: false, role: null, isOwner: false };
      }

      const data = capsuleSnap.data();

      // Public capsule
      if (data.isPublic) {
        return { hasAccess: true, role: 'viewer', isOwner: data.ownerId === userId };
      }

      // Owner
      if (data.ownerId === userId) {
        return { hasAccess: true, role: 'owner', isOwner: true };
      }

      // Collaborator
      const collab = data.collaborators?.find(c => c.email === userEmail?.toLowerCase());
      if (collab) {
        return { hasAccess: true, role: collab.role, isOwner: false };
      }

      return { hasAccess: false, role: null, isOwner: false };

    } catch (err) {
      console.error('❌ Check access failed:', err);
      return { hasAccess: false, role: null, isOwner: false };
    }
  };

  /**
   * Toggle bookmark status for a capsule
   * @param {string} capsuleId - Capsule ID to bookmark/unbookmark
   * @returns {Promise<boolean>} New bookmark status
   */
  const toggleBookmark = async (capsuleId) => {
    try {
      const capsuleRef = doc(db, 'capsules', capsuleId);
      const capsuleSnap = await getDoc(capsuleRef);

      if (!capsuleSnap.exists()) {
        throw new Error('Capsule not found');
      }

      const data = capsuleSnap.data();
      const newBookmarkStatus = !data.isBookmarked;

      await updateDoc(capsuleRef, {
        isBookmarked: newBookmarkStatus,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Bookmark toggled:', newBookmarkStatus ? 'bookmarked' : 'unbookmarked');
      return newBookmarkStatus;

    } catch (err) {
      console.error('❌ Toggle bookmark failed:', err);
      throw err;
    }
  };

  /**
   * Get bookmarked capsules for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of bookmarked capsules
   */
  const getBookmarkedCapsules = async (userId) => {
    try {
      const capsulesRef = collection(db, 'capsules');

      // Query bookmarked capsules owned by user
      const bookmarkedQuery = query(
        capsulesRef,
        where('ownerId', '==', userId),
        where('isBookmarked', '==', true),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );
      const bookmarkedSnap = await getDocs(bookmarkedQuery);
      const bookmarked = bookmarkedSnap.docs.map(doc => doc.data());

      console.log(`✅ Found ${bookmarked.length} bookmarked capsules`);
      return bookmarked;

    } catch (err) {
      console.error('❌ Get bookmarked capsules failed:', err);
      throw err;
    }
  };

  return {
    // Original functions
    saveCapsule,
    loadCapsule,
    updateCapsule,
    deleteCapsule,
    cleanupOldCapsules,
    getCapsuleStats,
    migrateToV2,
    // Collaboration functions (v3)
    saveCapsuleWithOwner,
    addCollaborator,
    removeCollaborator,
    updateVisibility,
    getUserCapsules,
    checkAccess,
    // Bookmark functions
    toggleBookmark,
    getBookmarkedCapsules,
    // State
    isSaving,
    isLoading,
    error
  };
};
