/**
 * Firestore Leads Utilities
 *
 * Raw capture event management following FIRESTORE_SCHEMA_V1.md
 *
 * Leads are immutable capture records that get resolved into contacts.
 * This preserves the original submission data for auditing and analytics.
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { generateContactId, upsertContact, getContactByEmail } from './firestoreContacts';

// ============================================================
// Lead Creation
// ============================================================

/**
 * Create a new lead capture record
 *
 * @param {Object} options
 * @param {string} options.email - Required email address
 * @param {Object} options.submittedData - Original form submission data
 * @param {string} options.source - Capture source: 'lead_gate' | 'footer' | 'assessment' | 'sso' | 'api' | 'webhook'
 * @param {string} options.sourceTool - If lead_gate, which tool (e.g., 'outreach-generator')
 * @param {Object} options.attribution - UTM and referrer data
 * @param {Object} options.context - Device/browser context
 */
export const createLead = async ({
  email,
  submittedData = {},
  source = 'api',
  sourceTool = null,
  sourceForm = null,
  attribution = {},
  context = {},
  metadata = {}
}) => {
  if (!email) {
    throw new Error('Email is required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  const lead = {
    // Identity
    email: normalizedEmail,

    // Submission data (immutable)
    submittedData: {
      name: submittedData.name || '',
      company: submittedData.company || '',
      phone: submittedData.phone || '',
      message: submittedData.message || '',
      ...submittedData
    },

    // Capture context
    source,
    sourceTool,
    sourceForm,

    // Attribution
    attribution: {
      utmSource: attribution.utmSource || getUrlParam('utm_source') || '',
      utmMedium: attribution.utmMedium || getUrlParam('utm_medium') || '',
      utmCampaign: attribution.utmCampaign || getUrlParam('utm_campaign') || '',
      utmContent: attribution.utmContent || getUrlParam('utm_content') || '',
      utmTerm: attribution.utmTerm || getUrlParam('utm_term') || '',
      referrer: attribution.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
      landingPage: attribution.landingPage || (typeof window !== 'undefined' ? window.location.href : ''),
      sessionId: attribution.sessionId || getSessionId()
    },

    // Device context
    context: {
      userAgent: context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
      ip: context.ip || '', // Set server-side if needed
      country: context.country || '',
      city: context.city || '',
      device: context.device || detectDevice(),
      browser: context.browser || detectBrowser()
    },

    // Processing status
    status: 'new',

    // Resolution (to be filled during processing)
    resolution: {
      contactId: null,
      resolvedAt: null,
      resolvedBy: null,
      duplicateOf: null,
      errorMessage: null
    },

    // Trigger tracking
    triggers: {
      rulesEvaluated: [],
      rulesMatched: [],
      actionsExecuted: []
    },

    // Metadata
    metadata,

    // Timestamps
    capturedAt: Timestamp.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    processedAt: null
  };

  const docRef = await addDoc(collection(db, 'leads'), lead);
  return { id: docRef.id, ...lead };
};

// ============================================================
// Lead Processing
// ============================================================

/**
 * Process a lead - resolve to contact and run triggers
 *
 * This is the main lead processing pipeline:
 * 1. Check for duplicate leads (within time window)
 * 2. Create or update contact record
 * 3. Evaluate trigger rules
 * 4. Execute matched actions
 */
export const processLead = async (leadId, options = {}) => {
  const { skipDedupe = false, skipTriggers = false } = options;

  const leadRef = doc(db, 'leads', leadId);
  const leadSnap = await getDoc(leadRef);

  if (!leadSnap.exists()) {
    throw new Error(`Lead ${leadId} not found`);
  }

  const lead = { id: leadSnap.id, ...leadSnap.data() };

  // Already processed?
  if (lead.status !== 'new') {
    return { lead, skipped: true, reason: `Lead already ${lead.status}` };
  }

  // Mark as processing
  await updateDoc(leadRef, {
    status: 'processing',
    updatedAt: serverTimestamp()
  });

  try {
    // Step 1: Check for duplicates
    if (!skipDedupe) {
      const duplicate = await checkDuplicateLead(lead.email, leadId);
      if (duplicate) {
        await updateDoc(leadRef, {
          status: 'duplicate',
          'resolution.duplicateOf': duplicate.id,
          'resolution.resolvedAt': serverTimestamp(),
          'resolution.resolvedBy': 'auto',
          processedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { lead: { ...lead, status: 'duplicate' }, skipped: true, reason: 'duplicate' };
      }
    }

    // Step 2: Create or update contact
    const contactData = {
      email: lead.email,
      name: lead.submittedData.name,
      company: lead.submittedData.company,
      phone: lead.submittedData.phone,
      source: {
        original: lead.source,
        medium: lead.attribution.utmMedium,
        campaign: lead.attribution.utmCampaign,
        referrer: lead.attribution.referrer,
        landingPage: lead.attribution.landingPage
      }
    };

    const { contact, created } = await upsertContact(contactData, 'lead_processor');

    // Update lead with contact reference
    await updateDoc(leadRef, {
      status: 'resolved',
      'resolution.contactId': contact.id,
      'resolution.resolvedAt': serverTimestamp(),
      'resolution.resolvedBy': 'auto',
      processedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Step 3: Evaluate and execute triggers (if not skipped)
    let triggersResult = { rulesEvaluated: [], rulesMatched: [], actionsExecuted: [] };

    if (!skipTriggers) {
      triggersResult = await evaluateAndExecuteTriggers(lead, contact);

      // Update lead with trigger results
      await updateDoc(leadRef, {
        'triggers.rulesEvaluated': triggersResult.rulesEvaluated,
        'triggers.rulesMatched': triggersResult.rulesMatched,
        'triggers.actionsExecuted': triggersResult.actionsExecuted,
        updatedAt: serverTimestamp()
      });
    }

    return {
      lead: { ...lead, status: 'resolved', resolution: { contactId: contact.id } },
      contact,
      contactCreated: created,
      triggers: triggersResult
    };

  } catch (error) {
    // Mark as error
    await updateDoc(leadRef, {
      status: 'error',
      'resolution.errorMessage': error.message,
      updatedAt: serverTimestamp()
    });

    throw error;
  }
};

/**
 * Check for duplicate lead submissions within time window
 */
export const checkDuplicateLead = async (email, currentLeadId, windowSeconds = 300) => {
  const windowStart = new Date(Date.now() - windowSeconds * 1000);

  const q = query(
    collection(db, 'leads'),
    where('email', '==', email.toLowerCase().trim()),
    where('capturedAt', '>=', Timestamp.fromDate(windowStart)),
    orderBy('capturedAt', 'desc'),
    limit(5)
  );

  const snapshot = await getDocs(q);

  for (const doc of snapshot.docs) {
    if (doc.id !== currentLeadId) {
      return { id: doc.id, ...doc.data() };
    }
  }

  return null;
};

// ============================================================
// Trigger System
// ============================================================

/**
 * Evaluate trigger rules and execute matched actions
 * This is a simplified implementation - full version will be in Cloud Functions
 */
export const evaluateAndExecuteTriggers = async (lead, contact) => {
  const result = {
    rulesEvaluated: [],
    rulesMatched: [],
    actionsExecuted: []
  };

  try {
    // Load active trigger rules
    const rulesQuery = query(
      collection(db, 'triggerRules'),
      where('enabled', '==', true),
      where('trigger.type', '==', 'lead_created'),
      orderBy('priority', 'asc')
    );

    const rulesSnap = await getDocs(rulesQuery);

    for (const ruleDoc of rulesSnap.docs) {
      const rule = { id: ruleDoc.id, ...ruleDoc.data() };
      result.rulesEvaluated.push(rule.id);

      // Evaluate conditions
      const matches = evaluateConditions(lead, rule.trigger.conditions, rule.trigger.matchMode);

      if (matches) {
        result.rulesMatched.push(rule.id);

        // Execute actions
        for (const action of rule.actions || []) {
          const actionResult = await executeAction(action, lead, contact, rule);
          result.actionsExecuted.push({
            ruleId: rule.id,
            ruleName: rule.name,
            actionType: action.type,
            executedAt: Timestamp.now(),
            result: actionResult.success ? 'success' : 'failed',
            resultData: actionResult
          });

          // Stop if action failed and continueOnError is false
          if (!actionResult.success && !action.continueOnError) {
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error('[Triggers] Error evaluating triggers:', error);
  }

  return result;
};

/**
 * Evaluate conditions against lead data
 */
const evaluateConditions = (lead, conditions = [], matchMode = 'all') => {
  if (conditions.length === 0) return true;

  const results = conditions.map(condition => evaluateSingleCondition(lead, condition));

  return matchMode === 'all'
    ? results.every(r => r)
    : results.some(r => r);
};

/**
 * Evaluate a single condition
 */
const evaluateSingleCondition = (lead, condition) => {
  const { field, operator, value, caseSensitive = false } = condition;

  // Get field value using dot notation
  const fieldValue = getNestedValue(lead, field);

  // Normalize for case-insensitive comparison
  const normalizedField = !caseSensitive && typeof fieldValue === 'string'
    ? fieldValue.toLowerCase()
    : fieldValue;
  const normalizedValue = !caseSensitive && typeof value === 'string'
    ? value.toLowerCase()
    : value;

  switch (operator) {
    case 'equals':
      return normalizedField === normalizedValue;
    case 'not_equals':
      return normalizedField !== normalizedValue;
    case 'contains':
      return String(normalizedField).includes(String(normalizedValue));
    case 'not_contains':
      return !String(normalizedField).includes(String(normalizedValue));
    case 'starts_with':
      return String(normalizedField).startsWith(String(normalizedValue));
    case 'ends_with':
      return String(normalizedField).endsWith(String(normalizedValue));
    case 'in':
      return Array.isArray(value) && value.map(v =>
        !caseSensitive && typeof v === 'string' ? v.toLowerCase() : v
      ).includes(normalizedField);
    case 'not_in':
      return Array.isArray(value) && !value.map(v =>
        !caseSensitive && typeof v === 'string' ? v.toLowerCase() : v
      ).includes(normalizedField);
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    case 'matches_regex':
      try {
        return new RegExp(value, caseSensitive ? '' : 'i').test(String(fieldValue));
      } catch {
        return false;
      }
    default:
      return false;
  }
};

/**
 * Get nested value from object using dot notation
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Execute a single action
 * Full implementation will be in Cloud Functions
 */
const executeAction = async (action, lead, contact, rule) => {
  try {
    switch (action.type) {
      case 'add_tag':
        // Would update contact.tags
        return { success: true, action: 'add_tag', tags: action.config?.tags };

      case 'notify_slack':
        // Would call Slack webhook
        return { success: true, action: 'notify_slack', message: 'Notification queued' };

      case 'enroll_journey':
        // Would call createProspect API
        return { success: true, action: 'enroll_journey', journeyId: action.config?.journeyId };

      case 'update_score':
        // Would update contact score
        return { success: true, action: 'update_score', adjustment: action.config?.scoreAdjustment };

      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================
// Query Operations
// ============================================================

/**
 * List leads with filtering
 */
export const listLeads = async ({
  status = null,
  source = null,
  email = null,
  pageSize = 50,
  orderByField = 'capturedAt',
  orderDirection = 'desc'
} = {}) => {
  const constraints = [];

  if (status) {
    constraints.push(where('status', '==', status));
  }
  if (source) {
    constraints.push(where('source', '==', source));
  }
  if (email) {
    constraints.push(where('email', '==', email.toLowerCase().trim()));
  }

  constraints.push(orderBy(orderByField, orderDirection));
  constraints.push(limit(pageSize));

  const q = query(collection(db, 'leads'), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get unprocessed leads
 */
export const getUnprocessedLeads = async (maxCount = 100) => {
  return listLeads({ status: 'new', pageSize: maxCount });
};

/**
 * Get lead by ID
 */
export const getLead = async (leadId) => {
  const docRef = doc(db, 'leads', leadId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() };
};

// ============================================================
// Helpers
// ============================================================

/**
 * Get URL parameter (browser-safe)
 */
const getUrlParam = (param) => {
  if (typeof window === 'undefined') return '';
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) || '';
};

/**
 * Get or create session ID
 */
const getSessionId = () => {
  if (typeof sessionStorage === 'undefined') return '';
  let sessionId = sessionStorage.getItem('yc_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('yc_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Detect device type
 */
const detectDevice = () => {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) {
    return /ipad|tablet/.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
};

/**
 * Detect browser
 */
const detectBrowser = () => {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
};

// ============================================================
// Export
// ============================================================

export default {
  createLead,
  processLead,
  checkDuplicateLead,
  evaluateAndExecuteTriggers,
  listLeads,
  getUnprocessedLeads,
  getLead
};
