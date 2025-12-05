/**
 * useFirebaseJourney Hook - v2 (Embedded Model)
 *
 * Cost-optimized Firestore persistence for UnityMAP journeys.
 * Uses single document with embedded arrays instead of subcollections.
 *
 * Collection: journeys/{journeyId}
 * - nodes[] embedded
 * - edges[] embedded
 * - prospects[] with execution state
 */

import { useState, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// MAP-specific node types
const MAP_NODE_TYPES = ['prospectNode', 'emailNode', 'waitNode', 'conditionNode', 'exitNode'];

/**
 * Serialize a node for Firestore storage
 */
const serializeNode = (node) => {
  const baseNode = {
    id: node.id,
    type: node.type,
    position: {
      x: Math.round(node.position.x),
      y: Math.round(node.position.y)
    }
  };

  switch (node.type) {
    case 'prospectNode':
      return {
        ...baseNode,
        data: {
          label: node.data?.label || 'Prospects',
          count: node.data?.count || 0,
          segment: node.data?.segment || '',
          source: node.data?.source || 'manual',
          tags: Array.isArray(node.data?.tags) ? node.data.tags : []
        }
      };

    case 'emailNode':
      return {
        ...baseNode,
        data: {
          label: node.data?.label || 'Email',
          subject: node.data?.subject || '',
          preview: node.data?.preview || '',
          fullBody: node.data?.fullBody || '',
          status: node.data?.status || 'draft'
        }
      };

    case 'waitNode':
      return {
        ...baseNode,
        data: {
          label: node.data?.label || 'Wait',
          delay: node.data?.delay || node.data?.duration || 1,
          unit: node.data?.unit || 'days'
        }
      };

    case 'conditionNode':
      return {
        ...baseNode,
        data: {
          label: node.data?.label || 'Condition',
          conditionType: node.data?.conditionType || 'opened',
          description: node.data?.description || ''
        }
      };

    case 'exitNode':
      return {
        ...baseNode,
        data: {
          label: node.data?.label || 'Exit',
          exitType: node.data?.exitType || 'completed'
        }
      };

    default:
      return {
        ...baseNode,
        data: {
          imageUrl: node.data?.imageUrl || '',
          location: node.data?.location || '',
          date: node.data?.date || '',
          description: node.data?.description || '',
          content: node.data?.content || '',
          size: node.data?.size || 350
        }
      };
  }
};

/**
 * Serialize an edge for Firestore storage
 */
const serializeEdge = (edge) => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  sourceHandle: edge.sourceHandle || null,
  targetHandle: edge.targetHandle || null,
  type: edge.type || 'default'
});

/**
 * Calculate delay in milliseconds
 */
const calculateDelayMs = (delay, unit) => {
  const multipliers = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000
  };
  return delay * (multipliers[unit] || multipliers.days);
};

/**
 * Find the next node in the journey
 */
const findNextNode = (currentNodeId, edges, sourceHandle = null) => {
  const edge = edges.find(e =>
    e.source === currentNodeId &&
    (sourceHandle === null || e.sourceHandle === sourceHandle)
  );
  return edge ? edge.target : null;
};

/**
 * Find the first node after prospect node
 */
const findFirstExecutableNode = (nodes, edges) => {
  const prospectNode = nodes.find(n => n.type === 'prospectNode');
  if (!prospectNode) {
    // No prospect node, find first email node
    const firstEmail = nodes.find(n => n.type === 'emailNode');
    return firstEmail?.id || null;
  }
  return findNextNode(prospectNode.id, edges);
};

export const useFirebaseJourney = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Save journey as draft (embedded model)
   */
  const saveJourney = useCallback(async (nodes, edges, metadata = {}) => {
    setIsSaving(true);
    setError(null);

    try {
      const journeyRef = doc(collection(db, 'journeys'));
      const journeyId = journeyRef.id;

      const mapNodes = nodes.filter(n => MAP_NODE_TYPES.includes(n.type));
      const emailCount = nodes.filter(n => n.type === 'emailNode').length;

      // Calculate expiry (90 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      const journeyDoc = {
        id: journeyId,
        title: metadata.title || 'Untitled Journey',
        description: metadata.description || '',
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),

        // Embedded arrays
        nodes: nodes.map(serializeNode),
        edges: edges.map(serializeEdge),

        // Empty prospects array (populated on publish)
        prospects: [],

        // Stats
        stats: {
          nodeCount: nodes.length,
          mapNodeCount: mapNodes.length,
          emailCount: emailCount,
          totalProspects: 0,
          sent: 0,
          opened: 0,
          clicked: 0,
          completed: 0
        }
      };

      await setDoc(journeyRef, journeyDoc);

      console.log('✅ Journey saved:', journeyId);
      return journeyId;

    } catch (err) {
      console.error('❌ Save journey failed:', err);
      const errorMessage = err.code === 'resource-exhausted'
        ? 'Firebase quota exceeded'
        : err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Load journey from Firestore
   */
  const loadJourney = useCallback(async (journeyId) => {
    setIsLoading(true);
    setError(null);

    try {
      const journeyRef = doc(db, 'journeys', journeyId);
      const journeySnap = await getDoc(journeyRef);

      if (!journeySnap.exists()) {
        throw new Error('Journey not found');
      }

      const data = journeySnap.data();

      console.log('✅ Journey loaded:', journeyId);

      return {
        metadata: {
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          stats: data.stats
        },
        nodes: data.nodes || [],
        edges: data.edges || [],
        prospects: data.prospects || []
      };

    } catch (err) {
      console.error('❌ Load journey failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update journey (nodes/edges only, preserves prospects)
   */
  const updateJourney = useCallback(async (journeyId, nodes, edges, metadata = {}) => {
    setIsSaving(true);
    setError(null);

    try {
      const journeyRef = doc(db, 'journeys', journeyId);

      const mapNodes = nodes.filter(n => MAP_NODE_TYPES.includes(n.type));
      const emailCount = nodes.filter(n => n.type === 'emailNode').length;

      await updateDoc(journeyRef, {
        updatedAt: serverTimestamp(),
        nodes: nodes.map(serializeNode),
        edges: edges.map(serializeEdge),
        'stats.nodeCount': nodes.length,
        'stats.mapNodeCount': mapNodes.length,
        'stats.emailCount': emailCount,
        ...(metadata.title && { title: metadata.title }),
        ...(metadata.description && { description: metadata.description })
      });

      console.log('✅ Journey updated:', journeyId);

    } catch (err) {
      console.error('❌ Update journey failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Publish journey - add prospects and set to active
   */
  const publishJourney = useCallback(async (journeyId, prospectList) => {
    setIsSaving(true);
    setError(null);

    try {
      const journeyRef = doc(db, 'journeys', journeyId);
      const journeySnap = await getDoc(journeyRef);

      if (!journeySnap.exists()) {
        throw new Error('Journey not found');
      }

      const journeyData = journeySnap.data();
      const { nodes, edges } = journeyData;

      // Find first executable node
      const firstNodeId = findFirstExecutableNode(nodes, edges);
      if (!firstNodeId) {
        throw new Error('No executable nodes in journey');
      }

      // Create prospect entries with execution state
      const now = new Date();
      const prospects = prospectList.map((prospect, index) => ({
        id: `p-${Date.now()}-${index}`,
        email: prospect.email,
        name: prospect.name || '',
        company: prospect.company || '',
        currentNodeId: firstNodeId,
        nextExecuteAt: Timestamp.fromDate(now),
        status: 'active',
        history: []
      }));

      await updateDoc(journeyRef, {
        status: 'active',
        updatedAt: serverTimestamp(),
        prospects: prospects,
        'stats.totalProspects': prospects.length
      });

      console.log('✅ Journey published with', prospects.length, 'prospects');
      return { journeyId, prospectCount: prospects.length };

    } catch (err) {
      console.error('❌ Publish journey failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Pause/Resume journey
   */
  const setJourneyStatus = useCallback(async (journeyId, status) => {
    try {
      const journeyRef = doc(db, 'journeys', journeyId);
      await updateDoc(journeyRef, {
        status: status,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Journey ${status}:`, journeyId);
    } catch (err) {
      console.error('❌ Set status failed:', err);
      throw err;
    }
  }, []);

  /**
   * Add prospects to existing journey
   */
  const addProspects = useCallback(async (journeyId, newProspects) => {
    setIsSaving(true);
    setError(null);

    try {
      const journeyRef = doc(db, 'journeys', journeyId);
      const journeySnap = await getDoc(journeyRef);

      if (!journeySnap.exists()) {
        throw new Error('Journey not found');
      }

      const journeyData = journeySnap.data();
      const { nodes, edges, prospects: existingProspects } = journeyData;

      const firstNodeId = findFirstExecutableNode(nodes, edges);
      const now = new Date();

      const newProspectEntries = newProspects.map((prospect, index) => ({
        id: `p-${Date.now()}-${index}`,
        email: prospect.email,
        name: prospect.name || '',
        company: prospect.company || '',
        currentNodeId: firstNodeId,
        nextExecuteAt: Timestamp.fromDate(now),
        status: 'active',
        history: []
      }));

      const allProspects = [...existingProspects, ...newProspectEntries];

      await updateDoc(journeyRef, {
        updatedAt: serverTimestamp(),
        prospects: allProspects,
        'stats.totalProspects': allProspects.length
      });

      console.log('✅ Added', newProspects.length, 'prospects');
      return allProspects.length;

    } catch (err) {
      console.error('❌ Add prospects failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Delete journey
   */
  const deleteJourney = useCallback(async (journeyId) => {
    try {
      const journeyRef = doc(db, 'journeys', journeyId);
      await deleteDoc(journeyRef);
      console.log('✅ Journey deleted:', journeyId);
      return true;
    } catch (err) {
      console.error('❌ Delete journey failed:', err);
      throw err;
    }
  }, []);

  /**
   * List journeys
   */
  const listJourneys = useCallback(async (statusFilter = null, maxResults = 50) => {
    setIsLoading(true);
    setError(null);

    try {
      const journeysRef = collection(db, 'journeys');
      let journeysQuery;

      if (statusFilter) {
        journeysQuery = query(
          journeysRef,
          where('status', '==', statusFilter),
          orderBy('updatedAt', 'desc'),
          limit(maxResults)
        );
      } else {
        journeysQuery = query(
          journeysRef,
          orderBy('updatedAt', 'desc'),
          limit(maxResults)
        );
      }

      const journeysSnap = await getDocs(journeysQuery);

      const journeys = journeysSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          status: data.status,
          stats: data.stats,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      });

      console.log(`✅ Listed ${journeys.length} journeys`);
      return journeys;

    } catch (err) {
      console.error('❌ List journeys failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get journey execution status
   */
  const getJourneyStatus = useCallback(async (journeyId) => {
    try {
      const journeyRef = doc(db, 'journeys', journeyId);
      const journeySnap = await getDoc(journeyRef);

      if (!journeySnap.exists()) {
        throw new Error('Journey not found');
      }

      const data = journeySnap.data();

      // Aggregate prospect statuses
      const prospects = data.prospects || [];
      const statusCounts = {
        active: 0,
        completed: 0,
        bounced: 0,
        unsubscribed: 0
      };

      prospects.forEach(p => {
        if (statusCounts[p.status] !== undefined) {
          statusCounts[p.status]++;
        }
      });

      return {
        journeyStatus: data.status,
        stats: data.stats,
        prospectCounts: statusCounts,
        prospects: prospects.map(p => ({
          id: p.id,
          email: p.email,
          currentNodeId: p.currentNodeId,
          status: p.status,
          historyCount: p.history?.length || 0
        }))
      };

    } catch (err) {
      console.error('❌ Get status failed:', err);
      throw err;
    }
  }, []);

  return {
    // CRUD
    saveJourney,
    loadJourney,
    updateJourney,
    deleteJourney,
    listJourneys,

    // Execution
    publishJourney,
    addProspects,
    setJourneyStatus,
    getJourneyStatus,

    // State
    isSaving,
    isLoading,
    error
  };
};

// Export helper functions for Cloud Function
export { calculateDelayMs, findNextNode, findFirstExecutableNode, MAP_NODE_TYPES };

export default useFirebaseJourney;
