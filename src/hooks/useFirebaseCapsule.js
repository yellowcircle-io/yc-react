import { useState } from 'react';
import {
  collection,
  doc,
  writeBatch,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  increment,
  updateDoc,
  query,
  limit,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useFirebaseCapsule = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Save capsule to Firebase
   * @param {Array} nodes - React Flow nodes array
   * @param {Array} edges - React Flow edges array
   * @param {Object} metadata - Optional metadata (title, description)
   * @returns {Promise<string>} capsuleId - Unique ID for shareable URL
   */
  const saveCapsule = async (nodes, edges, metadata = {}) => {
    setIsSaving(true);
    setError(null);

    try {
      // Generate unique capsule ID
      const capsuleRef = doc(collection(db, 'capsules'));
      const capsuleId = capsuleRef.id;

      // Use batch writes for atomic operations
      const batch = writeBatch(db);

      // Save capsule metadata
      batch.set(capsuleRef, {
        id: capsuleId,
        title: metadata.title || 'UK Travel Memories',
        description: metadata.description || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublic: true,
        viewCount: 0
      });

      // Save nodes (strip ALL React Flow internal properties for Safari compatibility)
      nodes.forEach(node => {
        const nodeRef = doc(db, `capsules/${capsuleId}/nodes`, node.id);
        // Explicitly construct serializable node with only essential data
        const cleanNode = {
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            imageUrl: node.data?.imageUrl || '',
            location: node.data?.location || '',
            date: node.data?.date || '',
            description: node.data?.description || '',
            size: node.data?.size || 350
          }
        };
        batch.set(nodeRef, cleanNode);
      });

      // Save edges (clean for Safari compatibility)
      edges.forEach(edge => {
        const edgeRef = doc(db, `capsules/${capsuleId}/edges`, edge.id);
        const cleanEdge = {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type || 'default'
        };
        batch.set(edgeRef, cleanEdge);
      });

      await batch.commit();

      console.log('✅ Capsule saved successfully:', capsuleId);
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
   * Load capsule from Firebase
   * @param {string} capsuleId - Unique capsule ID
   * @returns {Promise<Object>} { metadata, nodes, edges }
   */
  const loadCapsule = async (capsuleId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get capsule metadata
      const capsuleRef = doc(db, 'capsules', capsuleId);
      const capsuleSnap = await getDoc(capsuleRef);

      if (!capsuleSnap.exists()) {
        throw new Error('Capsule not found');
      }

      // Get nodes (with safety limit to prevent excessive reads)
      const nodesRef = collection(db, `capsules/${capsuleId}/nodes`);
      const nodesQuery = query(nodesRef, limit(500)); // Max 500 photos per capsule
      const nodesSnap = await getDocs(nodesQuery);
      const nodes = nodesSnap.docs.map(doc => doc.data());

      // Get edges (with safety limit)
      const edgesRef = collection(db, `capsules/${capsuleId}/edges`);
      const edgesQuery = query(edgesRef, limit(1000)); // Max 1000 connections
      const edgesSnap = await getDocs(edgesQuery);
      const edges = edgesSnap.docs.map(doc => doc.data());

      // Increment view count (only in production to avoid excessive writes during development)
      const isProduction = import.meta.env.PROD;

      // Check if already viewed this session (prevent duplicate counts on refresh)
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
          // Don't fail the entire load if view count update fails
        }
      } else if (!isProduction) {
        console.log('⚠️ DEV MODE: Skipping view count increment (prevents excessive Firebase writes)');
      } else {
        console.log('ℹ️ Already viewed this capsule in this session');
      }

      console.log('✅ Capsule loaded successfully:', capsuleId);

      return {
        metadata: capsuleSnap.data(),
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
   * Update existing capsule
   * @param {string} capsuleId - Existing capsule ID
   * @param {Array} nodes - Updated nodes array
   * @param {Array} edges - Updated edges array
   */
  const updateCapsule = async (capsuleId, nodes, edges) => {
    setIsSaving(true);
    setError(null);

    try {
      const batch = writeBatch(db);

      // Update timestamp
      const capsuleRef = doc(db, 'capsules', capsuleId);
      batch.update(capsuleRef, {
        updatedAt: serverTimestamp()
      });

      // Update nodes (explicitly serialize for Safari compatibility)
      nodes.forEach(node => {
        const nodeRef = doc(db, `capsules/${capsuleId}/nodes`, node.id);
        // Explicitly construct serializable node with only essential data
        const cleanNode = {
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            imageUrl: node.data?.imageUrl || '',
            location: node.data?.location || '',
            date: node.data?.date || '',
            description: node.data?.description || '',
            size: node.data?.size || 350
          }
        };
        batch.set(nodeRef, cleanNode);
      });

      edges.forEach(edge => {
        const edgeRef = doc(db, `capsules/${capsuleId}/edges`, edge.id);
        const cleanEdge = {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type || 'default'
        };
        batch.set(edgeRef, cleanEdge);
      });

      await batch.commit();
      console.log('✅ Capsule updated successfully');

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

  return {
    saveCapsule,
    loadCapsule,
    updateCapsule,
    deleteCapsule,
    cleanupOldCapsules,
    getCapsuleStats,
    isSaving,
    isLoading,
    error
  };
};
