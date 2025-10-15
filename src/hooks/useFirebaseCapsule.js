import { useState } from 'react';
import {
  collection,
  doc,
  writeBatch,
  getDoc,
  getDocs,
  serverTimestamp
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

      // Save nodes
      nodes.forEach(node => {
        const nodeRef = doc(db, `capsules/${capsuleId}/nodes`, node.id);
        batch.set(nodeRef, node);
      });

      // Save edges
      edges.forEach(edge => {
        const edgeRef = doc(db, `capsules/${capsuleId}/edges`, edge.id);
        batch.set(edgeRef, edge);
      });

      await batch.commit();

      console.log('✅ Capsule saved successfully:', capsuleId);
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

      // Get nodes
      const nodesRef = collection(db, `capsules/${capsuleId}/nodes`);
      const nodesSnap = await getDocs(nodesRef);
      const nodes = nodesSnap.docs.map(doc => doc.data());

      // Get edges
      const edgesRef = collection(db, `capsules/${capsuleId}/edges`);
      const edgesSnap = await getDocs(edgesRef);
      const edges = edgesSnap.docs.map(doc => doc.data());

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

      // Update nodes (simplified: delete all, re-add)
      // Note: In production, implement smart diffing
      nodes.forEach(node => {
        const nodeRef = doc(db, `capsules/${capsuleId}/nodes`, node.id);
        batch.set(nodeRef, node);
      });

      edges.forEach(edge => {
        const edgeRef = doc(db, `capsules/${capsuleId}/edges`, edge.id);
        batch.set(edgeRef, edge);
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

  return {
    saveCapsule,
    loadCapsule,
    updateCapsule,
    isSaving,
    isLoading,
    error
  };
};
