/**
 * Firestore Trigger Rules Utilities
 *
 * Automation rule management following FIRESTORE_SCHEMA_V1.md
 *
 * Trigger rules define when and how leads get processed,
 * including journey enrollment, notifications, and tagging.
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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================================
// Default Rule Templates
// ============================================================

/**
 * Create a default trigger rule object
 */
export const createTriggerRuleObject = ({
  id,
  name,
  description = '',
  triggerType = 'lead_created',
  conditions = [],
  actions = [],
  createdBy = 'system'
}) => {
  return {
    // Identity
    id,
    name,
    description,

    // Status
    enabled: false, // Start disabled for safety
    priority: 100, // Default middle priority

    // Trigger
    trigger: {
      type: triggerType,
      conditions,
      matchMode: 'all'
    },

    // Actions
    actions,

    // Deduplication
    dedup: {
      enabled: true,
      strategy: 'email_journey',
      windowSeconds: 86400, // 24 hours
      customKey: null
    },

    // Rate limiting
    rateLimit: {
      enabled: true,
      maxPerHour: 50,
      maxPerDay: 200,
      maxPerWeek: 1000
    },

    // Failsafes
    failsafe: {
      pauseOnErrorCount: 5,
      alertOnPause: true,
      requireApproval: false
    },

    // Scheduling (if schedule type)
    schedule: {
      cron: null,
      timezone: 'America/New_York',
      nextRunAt: null,
      lastRunAt: null
    },

    // Statistics
    stats: {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      skippedDedupe: 0,
      skippedRateLimit: 0,
      lastExecutedAt: null,
      lastErrorAt: null,
      lastError: null,
      consecutiveErrors: 0
    },

    // Metadata
    metadata: {},

    // Audit
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
    updatedBy: createdBy
  };
};

// ============================================================
// Pre-built Rule Templates
// ============================================================

/**
 * Welcome sequence rule - enroll new leads from tools
 */
export const createWelcomeSequenceRule = (journeyId) => {
  return createTriggerRuleObject({
    id: 'rule-welcome-sequence',
    name: 'Welcome Sequence - Tool Signups',
    description: 'Enroll new tool users into welcome email sequence',
    triggerType: 'lead_created',
    conditions: [
      {
        field: 'source',
        operator: 'equals',
        value: 'lead_gate',
        caseSensitive: false
      }
    ],
    actions: [
      {
        id: 'action-1',
        type: 'enroll_journey',
        config: {
          journeyId
        },
        continueOnError: true,
        retryCount: 2,
        retryDelayMs: 5000
      },
      {
        id: 'action-2',
        type: 'add_tag',
        config: {
          tags: ['tools-user', 'welcome-sequence']
        },
        continueOnError: true,
        retryCount: 0,
        retryDelayMs: 0
      },
      {
        id: 'action-3',
        type: 'notify_slack',
        config: {
          channel: '#leads',
          message: 'New tool signup: {{email}} ({{sourceTool}})'
        },
        continueOnError: true,
        retryCount: 1,
        retryDelayMs: 3000
      }
    ]
  });
};

/**
 * Assessment followup rule - high-score leads
 */
export const createAssessmentFollowupRule = (journeyId) => {
  return createTriggerRuleObject({
    id: 'rule-assessment-followup',
    name: 'Assessment Followup - High Scores',
    description: 'Fast-track leads with high assessment scores',
    triggerType: 'lead_created',
    conditions: [
      {
        field: 'source',
        operator: 'equals',
        value: 'assessment',
        caseSensitive: false
      },
      {
        field: 'submittedData.score',
        operator: 'greater_than',
        value: 70,
        caseSensitive: false
      }
    ],
    actions: [
      {
        id: 'action-1',
        type: 'add_tag',
        config: {
          tags: ['high-intent', 'assessment-complete']
        },
        continueOnError: true,
        retryCount: 0,
        retryDelayMs: 0
      },
      {
        id: 'action-2',
        type: 'update_score',
        config: {
          scoreAdjustment: 25
        },
        continueOnError: true,
        retryCount: 0,
        retryDelayMs: 0
      },
      {
        id: 'action-3',
        type: 'notify_slack',
        config: {
          channel: '#high-intent',
          message: '!!! High-intent lead: {{email}} - Assessment score: {{submittedData.score}}'
        },
        continueOnError: true,
        retryCount: 1,
        retryDelayMs: 3000
      },
      {
        id: 'action-4',
        type: 'enroll_journey',
        config: {
          journeyId
        },
        continueOnError: false,
        retryCount: 2,
        retryDelayMs: 5000
      }
    ]
  });
};

/**
 * Footer signup rule - general interest
 */
export const createFooterSignupRule = () => {
  return createTriggerRuleObject({
    id: 'rule-footer-signup',
    name: 'Footer Signup - Newsletter',
    description: 'Tag footer signups for newsletter',
    triggerType: 'lead_created',
    conditions: [
      {
        field: 'source',
        operator: 'equals',
        value: 'footer',
        caseSensitive: false
      }
    ],
    actions: [
      {
        id: 'action-1',
        type: 'add_tag',
        config: {
          tags: ['newsletter', 'website-visitor']
        },
        continueOnError: true,
        retryCount: 0,
        retryDelayMs: 0
      }
    ]
  });
};

// ============================================================
// CRUD Operations
// ============================================================

/**
 * Get trigger rule by ID
 */
export const getTriggerRule = async (ruleId) => {
  const docRef = doc(db, 'triggerRules', ruleId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() };
};

/**
 * List all trigger rules
 * Note: Sorting is done client-side to avoid requiring composite index
 */
export const listTriggerRules = async ({ enabled = null } = {}) => {
  let q;

  if (enabled !== null) {
    q = query(collection(db, 'triggerRules'), where('enabled', '==', enabled));
  } else {
    q = query(collection(db, 'triggerRules'));
  }

  const snapshot = await getDocs(q);
  const rules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort by priority client-side (avoids composite index requirement)
  return rules.sort((a, b) => (a.priority || 100) - (b.priority || 100));
};

/**
 * Create or update trigger rule
 */
export const saveTriggerRule = async (rule, updatedBy = 'system') => {
  const { id, ...ruleData } = rule;

  if (!id) {
    throw new Error('Rule ID is required');
  }

  const docRef = doc(db, 'triggerRules', id);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    // Update
    await updateDoc(docRef, {
      ...ruleData,
      updatedAt: serverTimestamp(),
      updatedBy
    });
  } else {
    // Create
    await setDoc(docRef, {
      id,
      ...ruleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: updatedBy,
      updatedBy
    });
  }

  const saved = await getDoc(docRef);
  return { id: saved.id, ...saved.data() };
};

/**
 * Enable trigger rule
 */
export const enableTriggerRule = async (ruleId, updatedBy = 'system') => {
  const docRef = doc(db, 'triggerRules', ruleId);
  await updateDoc(docRef, {
    enabled: true,
    updatedAt: serverTimestamp(),
    updatedBy
  });
  return getTriggerRule(ruleId);
};

/**
 * Disable trigger rule
 */
export const disableTriggerRule = async (ruleId, updatedBy = 'system') => {
  const docRef = doc(db, 'triggerRules', ruleId);
  await updateDoc(docRef, {
    enabled: false,
    'stats.consecutiveErrors': 0, // Reset error count
    updatedAt: serverTimestamp(),
    updatedBy
  });
  return getTriggerRule(ruleId);
};

/**
 * Delete trigger rule
 */
export const deleteTriggerRule = async (ruleId) => {
  const docRef = doc(db, 'triggerRules', ruleId);
  await deleteDoc(docRef);
  return { deleted: true, id: ruleId };
};

// ============================================================
// Statistics
// ============================================================

/**
 * Record execution result
 */
export const recordExecution = async (ruleId, success, errorMessage = null) => {
  const rule = await getTriggerRule(ruleId);
  if (!rule) return null;

  const stats = rule.stats || {};
  const updates = {
    'stats.totalExecutions': (stats.totalExecutions || 0) + 1,
    'stats.lastExecutedAt': serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (success) {
    updates['stats.successfulExecutions'] = (stats.successfulExecutions || 0) + 1;
    updates['stats.consecutiveErrors'] = 0;
  } else {
    updates['stats.failedExecutions'] = (stats.failedExecutions || 0) + 1;
    updates['stats.consecutiveErrors'] = (stats.consecutiveErrors || 0) + 1;
    updates['stats.lastErrorAt'] = serverTimestamp();
    updates['stats.lastError'] = errorMessage;

    // Check if should auto-pause
    if (updates['stats.consecutiveErrors'] >= (rule.failsafe?.pauseOnErrorCount || 5)) {
      updates['enabled'] = false;
      // TODO: Send Slack alert if failsafe.alertOnPause
    }
  }

  const docRef = doc(db, 'triggerRules', ruleId);
  await updateDoc(docRef, updates);

  return getTriggerRule(ruleId);
};

/**
 * Record dedup skip
 */
export const recordDedupSkip = async (ruleId) => {
  const docRef = doc(db, 'triggerRules', ruleId);
  const rule = await getTriggerRule(ruleId);
  if (!rule) return null;

  await updateDoc(docRef, {
    'stats.skippedDedupe': (rule.stats?.skippedDedupe || 0) + 1,
    updatedAt: serverTimestamp()
  });
};

/**
 * Record rate limit skip
 */
export const recordRateLimitSkip = async (ruleId) => {
  const docRef = doc(db, 'triggerRules', ruleId);
  const rule = await getTriggerRule(ruleId);
  if (!rule) return null;

  await updateDoc(docRef, {
    'stats.skippedRateLimit': (rule.stats?.skippedRateLimit || 0) + 1,
    updatedAt: serverTimestamp()
  });
};

// ============================================================
// Initialization
// ============================================================

/**
 * Initialize default trigger rules if they don't exist
 * Call this once during app setup
 */
export const initializeDefaultRules = async (welcomeJourneyId, assessmentJourneyId) => {
  const existingRules = await listTriggerRules();
  const existingIds = existingRules.map(r => r.id);

  const defaultRules = [];

  if (!existingIds.includes('rule-welcome-sequence') && welcomeJourneyId) {
    defaultRules.push(createWelcomeSequenceRule(welcomeJourneyId));
  }

  if (!existingIds.includes('rule-assessment-followup') && assessmentJourneyId) {
    defaultRules.push(createAssessmentFollowupRule(assessmentJourneyId));
  }

  if (!existingIds.includes('rule-footer-signup')) {
    defaultRules.push(createFooterSignupRule());
  }

  for (const rule of defaultRules) {
    await saveTriggerRule(rule, 'system_init');
  }

  return {
    initialized: defaultRules.length,
    rules: defaultRules.map(r => r.id)
  };
};

// ============================================================
// Export
// ============================================================

export default {
  createTriggerRuleObject,
  createWelcomeSequenceRule,
  createAssessmentFollowupRule,
  createFooterSignupRule,
  getTriggerRule,
  listTriggerRules,
  saveTriggerRule,
  enableTriggerRule,
  disableTriggerRule,
  deleteTriggerRule,
  recordExecution,
  recordDedupSkip,
  recordRateLimitSkip,
  initializeDefaultRules
};
