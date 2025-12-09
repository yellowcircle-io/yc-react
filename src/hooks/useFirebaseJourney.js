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
import { getESPAdapter } from '../adapters/esp';

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
          tags: Array.isArray(node.data?.tags) ? node.data.tags : [],
          // Include full prospect contact info from Hub/Generator
          prospects: Array.isArray(node.data?.prospects) ? node.data.prospects : []
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

      // Extract prospects from prospect nodes (auto-populate from Hub/Generator)
      const prospectNode = nodes.find(n => n.type === 'prospectNode');
      const nodeProspects = prospectNode?.data?.prospects || [];

      // Find first executable node for prospect placement
      const firstNodeId = findFirstExecutableNode(nodes, edges);
      const now = new Date();

      // Convert node prospects to journey prospect format
      const journeyProspects = nodeProspects
        .filter(p => p.email) // Only include prospects with email
        .map((prospect, index) => ({
          id: prospect.id || `p-${Date.now()}-${index}`,
          email: prospect.email,
          name: `${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || '',
          firstName: prospect.firstName || '',
          lastName: prospect.lastName || '',
          company: prospect.company || '',
          title: prospect.title || '',
          industry: prospect.industry || '',
          trigger: prospect.trigger || '',
          triggerDetails: prospect.triggerDetails || '',
          currentNodeId: firstNodeId,
          nextExecuteAt: Timestamp.fromDate(now),
          status: 'active',
          history: []
        }));

      const journeyDoc = {
        id: journeyId,
        title: metadata.title || 'Untitled Journey',
        description: metadata.description || '',
        status: journeyProspects.length > 0 ? 'active' : 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),

        // Embedded arrays
        nodes: nodes.map(serializeNode),
        edges: edges.map(serializeEdge),

        // Auto-populated prospects from Hub/Generator (or empty if none)
        prospects: journeyProspects,

        // Stats
        stats: {
          nodeCount: nodes.length,
          mapNodeCount: mapNodes.length,
          emailCount: emailCount,
          totalProspects: journeyProspects.length,
          sent: 0,
          opened: 0,
          clicked: 0,
          completed: 0
        }
      };

      await setDoc(journeyRef, journeyDoc);

      console.log('✅ Journey saved:', journeyId, '- Prospects auto-populated:', journeyProspects.length);
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
   * Get cached journey from localStorage
   */
  const getCachedJourney = (journeyId) => {
    try {
      const cached = localStorage.getItem(`journey_cache_${journeyId}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const cacheAge = Date.now() - timestamp;
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (cacheAge > maxAge) {
        localStorage.removeItem(`journey_cache_${journeyId}`);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  };

  /**
   * Cache journey to localStorage
   */
  const cacheJourney = (journeyId, data) => {
    try {
      // Strip history from prospects to reduce cache size
      const lightData = {
        ...data,
        prospects: data.prospects?.map(p => ({
          ...p,
          history: undefined // Lazy load history separately
        })) || []
      };

      localStorage.setItem(`journey_cache_${journeyId}`, JSON.stringify({
        data: lightData,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Ignore cache errors (quota exceeded, etc.)
      console.warn('Cache write failed:', e.message);
    }
  };

  /**
   * Load journey from Firestore (with localStorage caching)
   */
  const loadJourney = useCallback(async (journeyId, options = {}) => {
    const { skipCache = false, includeHistory = false } = options;

    // Check cache first (unless skipped)
    if (!skipCache) {
      const cached = getCachedJourney(journeyId);
      if (cached) {
        console.log('📦 Journey loaded from cache:', journeyId);
        return cached;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const journeyRef = doc(db, 'journeys', journeyId);
      const journeySnap = await getDoc(journeyRef);

      if (!journeySnap.exists()) {
        throw new Error('Journey not found');
      }

      const data = journeySnap.data();

      // Lazy load: strip history unless specifically requested
      const prospects = (data.prospects || []).map(p => ({
        ...p,
        history: includeHistory ? (p.history || []) : undefined,
        historyCount: p.history?.length || 0
      }));

      const result = {
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
        prospects
      };

      // Cache the result
      cacheJourney(journeyId, result);

      console.log('✅ Journey loaded:', journeyId);
      return result;

    } catch (err) {
      console.error('❌ Load journey failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load prospect history on demand (lazy loading)
   */
  const loadProspectHistory = useCallback(async (journeyId, prospectId) => {
    try {
      const journeyRef = doc(db, 'journeys', journeyId);
      const journeySnap = await getDoc(journeyRef);

      if (!journeySnap.exists()) {
        throw new Error('Journey not found');
      }

      const data = journeySnap.data();
      const prospect = data.prospects?.find(p => p.id === prospectId);

      if (!prospect) {
        throw new Error('Prospect not found');
      }

      return prospect.history || [];
    } catch (err) {
      console.error('❌ Load history failed:', err);
      throw err;
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
   * Send email immediately via ESP adapter (Resend)
   * @param {object} emailData - { to, subject, body, from? }
   * @returns {Promise<{ id, status, error? }>}
   */
  const sendEmailNow = useCallback(async (emailData) => {
    console.log('📤 sendEmailNow called with:', {
      to: emailData.to,
      subject: emailData.subject,
      bodyLength: emailData.body?.length || 0,
      bodyPreview: emailData.body?.substring(0, 100)
    });

    try {
      const esp = await getESPAdapter();
      console.log('📧 ESP adapter loaded:', esp?.name || 'unknown');

      // Validate we have content to send
      if (!emailData.body || emailData.body.trim().length === 0) {
        console.error('❌ Email body is empty!');
        return {
          id: null,
          status: 'failed',
          error: 'Email body is empty'
        };
      }

      // Convert plain text to HTML
      const htmlBody = emailData.body
        .split('\n\n')
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');

      console.log('📝 HTML body generated, length:', htmlBody.length);

      const espPayload = {
        to: emailData.to,
        subject: emailData.subject,
        html: htmlBody,
        text: emailData.body,
        replyTo: emailData.replyTo || undefined,
        tags: [
          { name: 'source', value: 'unity-map' },
          { name: 'type', value: 'outreach' }
        ]
      };
      console.log('📨 Calling ESP sendEmail with:', {
        to: espPayload.to,
        subject: espPayload.subject,
        htmlLength: espPayload.html?.length,
        textLength: espPayload.text?.length
      });

      const result = await esp.sendEmail(espPayload);

      console.log('📧 ESP result:', result);
      return result;
    } catch (err) {
      console.error('❌ Send email failed:', err);
      return {
        id: null,
        status: 'failed',
        error: err.message
      };
    }
  }, []);

  /**
   * Send all emails in journey immediately (bypasses scheduler)
   * @param {string} journeyId
   * @param {object} options - { dryRun?: boolean }
   * @returns {Promise<{ sent: number, failed: number, results: array }>}
   */
  const sendJourneyNow = useCallback(async (journeyId, options = {}) => {
    console.log('📧 sendJourneyNow called with journeyId:', journeyId);
    setIsSaving(true);
    setError(null);

    try {
      const journeyRef = doc(db, 'journeys', journeyId);
      const journeySnap = await getDoc(journeyRef);

      if (!journeySnap.exists()) {
        console.error('❌ Journey not found in Firestore:', journeyId);
        throw new Error('Journey not found');
      }

      const journeyData = journeySnap.data();
      const { nodes, prospects } = journeyData;

      console.log('📋 Journey data retrieved:', {
        title: journeyData.title,
        status: journeyData.status,
        nodeCount: nodes?.length || 0,
        prospectCount: prospects?.length || 0
      });

      if (!prospects || prospects.length === 0) {
        console.error('❌ No prospects in journey');
        throw new Error('No prospects in journey. Add prospects first.');
      }

      // Log prospect details
      console.log('👥 Prospects:', prospects.map(p => ({
        email: p.email,
        status: p.status,
        currentNodeId: p.currentNodeId
      })));

      // Get email nodes
      const emailNodes = nodes.filter(n => n.type === 'emailNode');
      console.log('📧 Email nodes found:', emailNodes.length);
      emailNodes.forEach((en, i) => {
        console.log(`  Email ${i + 1}:`, {
          id: en.id,
          subject: en.data?.subject,
          hasFullBody: !!en.data?.fullBody,
          fullBodyLength: en.data?.fullBody?.length || 0,
          preview: en.data?.preview?.substring(0, 50)
        });
      });

      if (emailNodes.length === 0) {
        console.error('❌ No email nodes in journey');
        throw new Error('No email nodes in journey');
      }

      // Get edges for node traversal
      const { edges } = journeyData;
      console.log('🔗 Edges:', edges?.length || 0);

      const results = {
        sent: 0,
        failed: 0,
        details: []
      };

      // Helper: Find email node from current position (might not be at email node directly)
      const findEmailForProspect = (currentNodeId, visitedNodes = new Set()) => {
        if (visitedNodes.has(currentNodeId)) return null; // Prevent loops
        visitedNodes.add(currentNodeId);

        // Check if current node is an email node
        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (currentNode?.type === 'emailNode') return currentNode;

        // If not, traverse to next node
        const nextNodeId = findNextNode(currentNodeId, edges);
        if (nextNodeId) {
          return findEmailForProspect(nextNodeId, visitedNodes);
        }
        return null;
      };

      // For each active prospect, send their current email
      for (const prospect of prospects) {
        console.log(`\n👤 Processing prospect: ${prospect.email}`);
        console.log(`   Status: ${prospect.status}, CurrentNodeId: ${prospect.currentNodeId}`);

        if (prospect.status !== 'active') {
          console.log(`   ⏭️ Skipping - status is not active`);
          continue;
        }

        // Try direct match first, then traverse
        let emailNode = emailNodes.find(n => n.id === prospect.currentNodeId);
        console.log(`   Direct match for ${prospect.currentNodeId}:`, emailNode ? 'found' : 'not found');

        if (!emailNode) {
          // Current node isn't an email - find next email in chain
          console.log(`   🔍 Traversing from ${prospect.currentNodeId} to find email...`);
          emailNode = findEmailForProspect(prospect.currentNodeId);
          console.log(`   Traversal result:`, emailNode ? `found ${emailNode.id}` : 'not found');
        }
        if (!emailNode) {
          // Still no email found, use first email node
          emailNode = emailNodes[0];
          console.warn(`   ⚠️ No email found for prospect ${prospect.email}, using first email: ${emailNode?.id}`);
        }
        if (!emailNode) {
          console.error(`   ❌ No email node available, skipping`);
          continue;
        }

        console.log(`   📧 Using email node: ${emailNode.id}`);
        console.log(`      Subject: "${emailNode.data.subject}"`);
        console.log(`      Body length: ${(emailNode.data.fullBody || emailNode.data.preview || '').length}`);

        if (options.dryRun) {
          results.details.push({
            to: prospect.email,
            subject: emailNode.data.subject,
            status: 'dry_run'
          });
          results.sent++;
          continue;
        }

        const emailPayload = {
          to: prospect.email,
          subject: emailNode.data.subject,
          body: emailNode.data.fullBody || emailNode.data.preview || ''
        };
        console.log(`   📤 Sending email:`, {
          to: emailPayload.to,
          subject: emailPayload.subject,
          bodyLength: emailPayload.body.length
        });

        const result = await sendEmailNow(emailPayload);
        console.log(`   📬 Send result:`, result);

        results.details.push({
          to: prospect.email,
          subject: emailNode.data.subject,
          prospectId: prospect.id,
          ...result
        });

        if (result.status === 'sent') {
          results.sent++;
          console.log(`   ✅ Email sent successfully!`);

          // Advance prospect to next node
          const nextNodeId = findNextNode(emailNode.id, edges);
          if (nextNodeId) {
            prospect.currentNodeId = nextNodeId;
            prospect.history = [
              ...(prospect.history || []),
              {
                nodeId: emailNode.id,
                action: 'sent',
                at: new Date().toISOString(),
                messageId: result.id
              }
            ];
            console.log(`   ➡️ Prospect advanced to next node: ${nextNodeId}`);
          } else {
            // No next node - mark as completed
            prospect.status = 'completed';
            prospect.history = [
              ...(prospect.history || []),
              {
                nodeId: emailNode.id,
                action: 'completed',
                at: new Date().toISOString(),
                messageId: result.id
              }
            ];
            console.log(`   🏁 Prospect journey completed`);
          }
        } else {
          results.failed++;
          console.log(`   ❌ Email failed:`, result.error);
          // Record failure in history but don't advance
          prospect.history = [
            ...(prospect.history || []),
            {
              nodeId: emailNode.id,
              action: 'failed',
              at: new Date().toISOString(),
              error: result.error
            }
          ];
        }
      }

      // Update email node statuses based on what was sent
      const updatedNodes = nodes.map(node => {
        if (node.type === 'emailNode') {
          // Check if any email was sent from this node
          const sentFromNode = results.details.some(
            d => d.status === 'sent' && emailNodes.find(en => en.id === node.id && en.data.subject === d.subject)
          );
          // Also mark as sent if we have prospects past this node
          const prospectsPastNode = prospects.some(p => {
            const history = p.history || [];
            return history.some(h => h.nodeId === node.id && h.action === 'sent');
          });

          if (sentFromNode || prospectsPastNode) {
            return {
              ...node,
              data: {
                ...node.data,
                status: 'sent'
              }
            };
          }
          // Check if prospects are waiting at this node
          const prospectsAtNode = prospects.filter(p =>
            p.status === 'active' && p.currentNodeId === node.id
          ).length;
          if (prospectsAtNode > 0) {
            return {
              ...node,
              data: {
                ...node.data,
                status: 'scheduled',
                prospectsAtNode
              }
            };
          }
        }
        return node;
      });

      // Update journey with modified prospects, nodes, and stats
      await updateDoc(journeyRef, {
        updatedAt: serverTimestamp(),
        prospects: prospects,
        nodes: updatedNodes.map(serializeNode),
        'stats.sent': journeyData.stats.sent + results.sent,
        'stats.completed': prospects.filter(p => p.status === 'completed').length
      });

      console.log(`\n📊 Final results: ${results.sent} sent, ${results.failed} failed`);
      console.log('📋 Details:', results.details);
      return results;

    } catch (err) {
      console.error('❌ Send journey failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [sendEmailNow]);

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

  /**
   * Invalidate journey cache
   */
  const invalidateCache = useCallback((journeyId) => {
    if (journeyId) {
      localStorage.removeItem(`journey_cache_${journeyId}`);
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

    // Direct Email Sending (via ESP/Resend)
    sendEmailNow,
    sendJourneyNow,

    // Lazy Loading & Caching
    loadProspectHistory,
    invalidateCache,

    // State
    isSaving,
    isLoading,
    error
  };
};

// Export helper functions for Cloud Function
export { calculateDelayMs, findNextNode, findFirstExecutableNode, MAP_NODE_TYPES };

export default useFirebaseJourney;
