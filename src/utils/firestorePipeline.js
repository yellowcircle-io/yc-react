/**
 * Firestore Pipeline Utilities
 *
 * Manages collections for dual-pipeline prospecting:
 * - companies_raw: Raw company data from discovery sources
 * - pe_exclusion_log: PE exclusion audit trail
 * - manual_review_queue: Manual review queue for flagged contacts
 * - api_usage: API usage tracking
 *
 * Created: December 2025
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
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================================
// companies_raw - Raw Discovery Data
// ============================================================

/**
 * Valid discovery sources
 */
export const DISCOVERY_SOURCES = [
  'google_places',
  'crunchbase',
  'yc',
  'producthunt',
  'opencorporates',
  'sos',
  'manual'
];

/**
 * Store raw company data from discovery source
 */
export const storeRawCompany = async ({
  source,
  sourceId,
  rawData,
  companyName = null
}) => {
  if (!DISCOVERY_SOURCES.includes(source)) {
    throw new Error(`Invalid source: ${source}. Must be one of: ${DISCOVERY_SOURCES.join(', ')}`);
  }

  const docId = `${source}_${sourceId}`;
  const docRef = doc(db, 'companies_raw', docId);

  const data = {
    id: docId,
    source,
    sourceId,
    companyName,
    rawData,
    ingestedAt: serverTimestamp(),
    processedAt: null,
    contactId: null,  // Will be populated when linked to contact
    status: 'pending' // pending | processed | skipped | error
  };

  await setDoc(docRef, data);
  return { id: docId, ...data };
};

/**
 * Get raw company by ID
 */
export const getRawCompany = async (docId) => {
  const docRef = doc(db, 'companies_raw', docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
};

/**
 * List unprocessed raw companies
 */
export const listUnprocessedCompanies = async ({
  source = null,
  maxResults = 100
} = {}) => {
  const companiesRef = collection(db, 'companies_raw');
  const constraints = [where('status', '==', 'pending')];

  if (source) {
    constraints.push(where('source', '==', source));
  }

  constraints.push(orderBy('ingestedAt', 'asc'));
  constraints.push(limit(maxResults));

  const q = query(companiesRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Mark raw company as processed and link to contact
 */
export const markRawCompanyProcessed = async (docId, contactId) => {
  const docRef = doc(db, 'companies_raw', docId);

  await updateDoc(docRef, {
    status: 'processed',
    processedAt: serverTimestamp(),
    contactId
  });
};

/**
 * Mark raw company as skipped (duplicate, invalid, etc.)
 */
export const markRawCompanySkipped = async (docId, reason) => {
  const docRef = doc(db, 'companies_raw', docId);

  await updateDoc(docRef, {
    status: 'skipped',
    processedAt: serverTimestamp(),
    skipReason: reason
  });
};

// ============================================================
// pe_exclusion_log - PE Exclusion Audit Trail
// ============================================================

/**
 * Log a PE exclusion event
 */
export const logPEExclusion = async ({
  contactId,
  exclusionType,    // 'HARD_BLOCK' | 'RED_FLAGS' | 'FLAGGED'
  signalsTriggered, // Array of signal names
  confidence,       // 0-1
  reasonSummary
}) => {
  const docId = `${contactId}_${Date.now()}`;
  const docRef = doc(db, 'pe_exclusion_log', docId);

  const data = {
    id: docId,
    contactId,
    exclusionType,
    signalsTriggered,
    confidence,
    excludedAt: serverTimestamp(),
    reasonSummary,
    appealStatus: 'none'  // none | pending | approved | rejected
  };

  await setDoc(docRef, data);
  return { id: docId, ...data };
};

/**
 * Get exclusion history for a contact
 */
export const getExclusionHistory = async (contactId) => {
  const logsRef = collection(db, 'pe_exclusion_log');
  const q = query(
    logsRef,
    where('contactId', '==', contactId),
    orderBy('excludedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Request appeal for exclusion
 */
export const requestExclusionAppeal = async (logId, appealReason) => {
  const docRef = doc(db, 'pe_exclusion_log', logId);

  await updateDoc(docRef, {
    appealStatus: 'pending',
    appealReason,
    appealRequestedAt: serverTimestamp()
  });
};

/**
 * Resolve exclusion appeal
 */
export const resolveExclusionAppeal = async (logId, decision, notes = '') => {
  const docRef = doc(db, 'pe_exclusion_log', logId);

  await updateDoc(docRef, {
    appealStatus: decision,  // 'approved' | 'rejected'
    appealNotes: notes,
    appealResolvedAt: serverTimestamp()
  });
};

/**
 * Get exclusion statistics
 */
export const getExclusionStats = async (daysBack = 30) => {
  const logsRef = collection(db, 'pe_exclusion_log');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const q = query(
    logsRef,
    where('excludedAt', '>=', Timestamp.fromDate(cutoffDate)),
    limit(1000)
  );

  const snapshot = await getDocs(q);

  const stats = {
    total: 0,
    hardBlocks: 0,
    redFlags: 0,
    flagged: 0,
    appealed: 0,
    appealsApproved: 0
  };

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    stats.total++;

    if (data.exclusionType === 'HARD_BLOCK') stats.hardBlocks++;
    if (data.exclusionType === 'RED_FLAGS') stats.redFlags++;
    if (data.exclusionType === 'FLAGGED') stats.flagged++;
    if (data.appealStatus !== 'none') stats.appealed++;
    if (data.appealStatus === 'approved') stats.appealsApproved++;
  });

  return stats;
};

// ============================================================
// manual_review_queue - Manual Review Queue
// ============================================================

/**
 * Add contact to manual review queue
 */
export const addToReviewQueue = async ({
  contactId,
  reason,
  conflictingSignals = {},
  priority = 'normal'  // 'high' | 'normal' | 'low'
}) => {
  const docRef = doc(db, 'manual_review_queue', contactId);

  const data = {
    contactId,
    reason,
    conflictingSignals,
    priority,
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewerDecision: null,  // 'QUALIFIED' | 'EXCLUDED' | 'NEEDS_MORE_DATA'
    reviewerNotes: '',
    reviewedBy: null
  };

  await setDoc(docRef, data);
  return { id: contactId, ...data };
};

/**
 * Get review queue item
 */
export const getReviewQueueItem = async (contactId) => {
  const docRef = doc(db, 'manual_review_queue', contactId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
};

/**
 * List pending reviews
 */
export const listPendingReviews = async ({
  priority = null,
  maxResults = 50
} = {}) => {
  const queueRef = collection(db, 'manual_review_queue');
  const constraints = [where('reviewedAt', '==', null)];

  if (priority) {
    constraints.push(where('priority', '==', priority));
  }

  constraints.push(orderBy('createdAt', 'asc'));
  constraints.push(limit(maxResults));

  const q = query(queueRef, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Submit review decision
 */
export const submitReviewDecision = async (contactId, {
  decision,  // 'QUALIFIED' | 'EXCLUDED' | 'NEEDS_MORE_DATA'
  notes = '',
  reviewedBy = 'admin'
}) => {
  const docRef = doc(db, 'manual_review_queue', contactId);

  await updateDoc(docRef, {
    reviewedAt: serverTimestamp(),
    reviewerDecision: decision,
    reviewerNotes: notes,
    reviewedBy
  });

  return { contactId, decision };
};

/**
 * Remove from review queue (after processing)
 */
export const removeFromReviewQueue = async (contactId) => {
  const docRef = doc(db, 'manual_review_queue', contactId);
  await deleteDoc(docRef);
};

/**
 * Get review queue statistics
 */
export const getReviewQueueStats = async () => {
  const queueRef = collection(db, 'manual_review_queue');

  // Get pending count
  const pendingQuery = query(queueRef, where('reviewedAt', '==', null), limit(1000));
  const pendingSnapshot = await getDocs(pendingQuery);

  // Get reviewed in last 7 days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);
  const reviewedQuery = query(
    queueRef,
    where('reviewedAt', '>=', Timestamp.fromDate(cutoffDate)),
    limit(1000)
  );
  const reviewedSnapshot = await getDocs(reviewedQuery);

  const stats = {
    pending: pendingSnapshot.docs.length,
    highPriority: 0,
    reviewedLast7Days: reviewedSnapshot.docs.length,
    qualifiedLast7Days: 0,
    excludedLast7Days: 0
  };

  pendingSnapshot.docs.forEach(doc => {
    if (doc.data().priority === 'high') stats.highPriority++;
  });

  reviewedSnapshot.docs.forEach(doc => {
    const decision = doc.data().reviewerDecision;
    if (decision === 'QUALIFIED') stats.qualifiedLast7Days++;
    if (decision === 'EXCLUDED') stats.excludedLast7Days++;
  });

  return stats;
};

// ============================================================
// api_usage - API Usage Tracking
// ============================================================

/**
 * Get today's date string for document ID
 */
const getTodayId = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Initialize or get today's API usage document
 */
const getOrCreateUsageDoc = async () => {
  const docId = getTodayId();
  const docRef = doc(db, 'api_usage', docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ref: docRef, data: docSnap.data() };
  }

  // Create new document for today
  const initialData = {
    date: docId,
    googlePlacesCallsUsed: 0,
    crunchbaseCallsUsed: 0,
    opencorporatesCallsUsed: 0,
    hunterApiCalls: 0,
    pdlApiCalls: 0,
    apolloApiCalls: 0,
    totalCost: 0,
    dailyBudgetRemaining: 10.00,  // $10 default daily budget
    createdAt: serverTimestamp()
  };

  await setDoc(docRef, initialData);
  return { id: docId, ref: docRef, data: initialData };
};

/**
 * Record API call
 */
export const recordApiCall = async (provider, count = 1, cost = 0) => {
  const { ref } = await getOrCreateUsageDoc();

  const fieldMap = {
    google_places: 'googlePlacesCallsUsed',
    crunchbase: 'crunchbaseCallsUsed',
    opencorporates: 'opencorporatesCallsUsed',
    hunter: 'hunterApiCalls',
    pdl: 'pdlApiCalls',
    apollo: 'apolloApiCalls'
  };

  const field = fieldMap[provider];
  if (!field) {
    throw new Error(`Unknown API provider: ${provider}`);
  }

  await updateDoc(ref, {
    [field]: increment(count),
    totalCost: increment(cost),
    dailyBudgetRemaining: increment(-cost)
  });
};

/**
 * Get today's API usage
 */
export const getTodayUsage = async () => {
  const { data } = await getOrCreateUsageDoc();
  return data;
};

/**
 * Get API usage for date range
 */
export const getUsageHistory = async (daysBack = 30) => {
  const usageRef = collection(db, 'api_usage');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffId = cutoffDate.toISOString().split('T')[0];

  const q = query(
    usageRef,
    where('date', '>=', cutoffId),
    orderBy('date', 'desc'),
    limit(daysBack)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Check if daily budget exceeded
 */
export const checkBudgetRemaining = async () => {
  const { data } = await getOrCreateUsageDoc();
  return {
    remaining: data.dailyBudgetRemaining,
    exceeded: data.dailyBudgetRemaining <= 0,
    totalSpent: data.totalCost
  };
};

/**
 * Get monthly API cost summary
 */
export const getMonthlyCostSummary = async () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthId = firstOfMonth.toISOString().split('T')[0];

  const usageRef = collection(db, 'api_usage');
  const q = query(
    usageRef,
    where('date', '>=', monthId),
    limit(31)
  );

  const snapshot = await getDocs(q);

  const summary = {
    totalCost: 0,
    totalCalls: 0,
    byProvider: {
      google_places: { calls: 0, cost: 0 },
      crunchbase: { calls: 0, cost: 0 },
      opencorporates: { calls: 0, cost: 0 },
      hunter: { calls: 0, cost: 0 },
      pdl: { calls: 0, cost: 0 },
      apollo: { calls: 0, cost: 0 }
    },
    daysWithData: snapshot.docs.length
  };

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    summary.totalCost += data.totalCost || 0;
    summary.totalCalls += (
      (data.googlePlacesCallsUsed || 0) +
      (data.crunchbaseCallsUsed || 0) +
      (data.opencorporatesCallsUsed || 0) +
      (data.hunterApiCalls || 0) +
      (data.pdlApiCalls || 0) +
      (data.apolloApiCalls || 0)
    );
    summary.byProvider.google_places.calls += data.googlePlacesCallsUsed || 0;
    summary.byProvider.crunchbase.calls += data.crunchbaseCallsUsed || 0;
    summary.byProvider.opencorporates.calls += data.opencorporatesCallsUsed || 0;
    summary.byProvider.hunter.calls += data.hunterApiCalls || 0;
    summary.byProvider.pdl.calls += data.pdlApiCalls || 0;
    summary.byProvider.apollo.calls += data.apolloApiCalls || 0;
  });

  return summary;
};

// ============================================================
// Export
// ============================================================

export default {
  // Discovery Sources
  DISCOVERY_SOURCES,
  // companies_raw
  storeRawCompany,
  getRawCompany,
  listUnprocessedCompanies,
  markRawCompanyProcessed,
  markRawCompanySkipped,
  // pe_exclusion_log
  logPEExclusion,
  getExclusionHistory,
  requestExclusionAppeal,
  resolveExclusionAppeal,
  getExclusionStats,
  // manual_review_queue
  addToReviewQueue,
  getReviewQueueItem,
  listPendingReviews,
  submitReviewDecision,
  removeFromReviewQueue,
  getReviewQueueStats,
  // api_usage
  recordApiCall,
  getTodayUsage,
  getUsageHistory,
  checkBudgetRemaining,
  getMonthlyCostSummary
};
