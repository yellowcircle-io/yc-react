/**
 * Firestore Contacts Utilities
 *
 * Canonical contact management following FIRESTORE_SCHEMA_V1.md
 *
 * Design principles:
 * - Email-based deterministic IDs for deduplication
 * - Extensible metadata field for future additions
 * - Full audit trail (createdAt, updatedAt, createdBy, updatedBy)
 * - Soft delete via status: 'archived'
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================================
// ID Generation
// ============================================================

/**
 * Generate deterministic contact ID from email
 * Uses simple hash for cross-platform compatibility
 */
export const generateContactId = (email) => {
  const normalized = email.toLowerCase().trim();
  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
  }
  // Convert to positive hex string
  const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
  return `contact-${hashHex}`;
};

/**
 * Generate SHA256-like hash for email (browser-compatible)
 * For display purposes only - ID uses simpler hash above
 */
export const hashEmail = async (email) => {
  const normalized = email.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// ============================================================
// Default Contact Object
// ============================================================

/**
 * Create a new contact object with all required fields
 */
export const createContactObject = ({
  email,
  name = '',
  company = '',
  source = 'manual',
  createdBy = 'system'
}) => {
  const id = generateContactId(email);
  const normalized = email.toLowerCase().trim();

  // Parse name into first/last
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    // Identity
    id,
    email: normalized,
    emailHash: '', // Will be populated async if needed

    // Profile
    name: name.trim(),
    firstName,
    lastName,
    company: company.trim(),
    jobTitle: '',
    phone: '',
    linkedinUrl: '',
    website: '',
    avatar: '',
    timezone: '',

    // Classification
    type: 'lead',
    stage: 'new',
    tags: [],
    lists: [],

    // Scoring
    score: 0,
    scoreBreakdown: {
      engagement: 0,
      behavior: 0,
      profile: 0,
      recency: 0
    },
    scoreUpdatedAt: null,

    // Source tracking
    source: {
      original: source,
      medium: '',
      campaign: '',
      referrer: '',
      landingPage: ''
    },

    // Engagement metrics
    engagement: {
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      lastEmailAt: null,
      lastOpenAt: null,
      lastClickAt: null,
      toolsUsed: [],
      assessmentScore: null,
      assessmentCompletedAt: null,
      pageViews: 0,
      lastVisitAt: null
    },

    // Journey tracking
    journeys: {
      active: [],
      completed: [],
      history: []
    },

    // External IDs
    externalIds: {
      airtableId: null,
      hubspotId: null,
      stripeId: null
    },
    syncStatus: {
      airtable: 'not_synced',
      airtableLastSync: null,
      airtableError: null
    },

    // Preferences
    preferences: {
      emailOptIn: true,
      emailFrequency: 'weekly',
      communicationLanguage: 'en',
      doNotContact: false
    },

    // Notes & custom
    notes: '',
    customFields: {},

    // Metadata (extensibility)
    metadata: {},

    // Audit
    status: 'active',
    mergedInto: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
    updatedBy: createdBy
  };
};

// ============================================================
// CRUD Operations
// ============================================================

/**
 * Get contact by ID
 */
export const getContact = async (contactId) => {
  const docRef = doc(db, 'contacts', contactId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() };
};

/**
 * Get contact by email
 */
export const getContactByEmail = async (email) => {
  const contactId = generateContactId(email);
  return getContact(contactId);
};

/**
 * Create or update contact (upsert)
 * Returns { contact, created: boolean }
 */
export const upsertContact = async (contactData, updatedBy = 'system') => {
  const { email } = contactData;
  if (!email) {
    throw new Error('Email is required');
  }

  const contactId = generateContactId(email);
  const docRef = doc(db, 'contacts', contactId);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    // Update existing contact
    const updates = {
      ...contactData,
      updatedAt: serverTimestamp(),
      updatedBy
    };
    // Remove fields that shouldn't be overwritten
    delete updates.id;
    delete updates.email;
    delete updates.emailHash;
    delete updates.createdAt;
    delete updates.createdBy;

    await updateDoc(docRef, updates);
    const updated = await getDoc(docRef);
    return { contact: { id: updated.id, ...updated.data() }, created: false };
  }

  // Create new contact
  const newContact = createContactObject({
    email,
    name: contactData.name,
    company: contactData.company,
    source: contactData.source?.original || contactData.source || 'manual',
    createdBy: updatedBy
  });

  // Merge any additional fields
  const finalContact = {
    ...newContact,
    ...contactData,
    id: contactId,
    email: email.toLowerCase().trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: updatedBy,
    updatedBy
  };

  await setDoc(docRef, finalContact);
  return { contact: finalContact, created: true };
};

/**
 * Update contact fields
 */
export const updateContact = async (contactId, updates, updatedBy = 'system') => {
  const docRef = doc(db, 'contacts', contactId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy
  });

  const updated = await getDoc(docRef);
  return { id: updated.id, ...updated.data() };
};

/**
 * Archive contact (soft delete)
 */
export const archiveContact = async (contactId, updatedBy = 'system') => {
  return updateContact(contactId, { status: 'archived' }, updatedBy);
};

// ============================================================
// Query Operations
// ============================================================

/**
 * List contacts with pagination and filtering
 */
export const listContacts = async ({
  status = 'active',
  type = null,
  stage = null,
  tags = [],
  source = null,
  minScore = null,
  maxScore = null,
  pageSize = 25,
  lastDoc = null,
  orderByField = 'updatedAt',
  orderDirection = 'desc'
} = {}) => {
  const contactsRef = collection(db, 'contacts');
  const constraints = [];

  // Always filter by status
  constraints.push(where('status', '==', status));

  // Optional filters
  if (type) {
    constraints.push(where('type', '==', type));
  }
  if (stage) {
    constraints.push(where('stage', '==', stage));
  }
  if (source) {
    constraints.push(where('source.original', '==', source));
  }
  if (minScore !== null) {
    constraints.push(where('score', '>=', minScore));
  }
  if (maxScore !== null) {
    constraints.push(where('score', '<=', maxScore));
  }

  // Note: Firestore doesn't support array-contains with multiple values
  // Tags filtering will be done client-side for flexibility
  // constraints.push(orderBy(orderByField, orderDirection));
  constraints.push(limit(pageSize + 1)); // +1 to check if more pages exist

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(contactsRef, ...constraints);
  const snapshot = await getDocs(q);

  const contacts = [];
  let lastVisible = null;
  let hasMore = false;

  snapshot.docs.forEach((doc, index) => {
    if (index < pageSize) {
      contacts.push({ id: doc.id, ...doc.data() });
      lastVisible = doc;
    } else {
      hasMore = true;
    }
  });

  // Client-side tag filtering
  const filteredContacts = tags.length > 0
    ? contacts.filter(c => tags.some(tag => c.tags?.includes(tag)))
    : contacts;

  return {
    contacts: filteredContacts,
    lastDoc: lastVisible,
    hasMore
  };
};

/**
 * Search contacts by email or name
 */
export const searchContacts = async (searchTerm, maxResults = 10) => {
  const term = searchTerm.toLowerCase().trim();

  // Try email match first (exact prefix)
  const emailQuery = query(
    collection(db, 'contacts'),
    where('email', '>=', term),
    where('email', '<=', term + '\uf8ff'),
    where('status', '==', 'active'),
    limit(maxResults)
  );

  const emailResults = await getDocs(emailQuery);

  if (emailResults.docs.length > 0) {
    return emailResults.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Fall back to name search (requires composite index or client-side)
  // For now, return empty - implement full-text search if needed
  return [];
};

// ============================================================
// Scoring Operations
// ============================================================

/**
 * Calculate and update contact score
 */
export const updateContactScore = async (contactId) => {
  const contact = await getContact(contactId);
  if (!contact) return null;

  const { engagement } = contact;

  // Calculate score components
  const engagementScore = Math.min(30,
    (engagement.emailsOpened * 3) +
    (engagement.emailsClicked * 5)
  );

  const behaviorScore = Math.min(30,
    (engagement.toolsUsed?.length || 0) * 10 +
    (engagement.assessmentScore ? 15 : 0)
  );

  const profileScore = Math.min(20,
    (contact.company ? 10 : 0) +
    (contact.jobTitle ? 5 : 0) +
    (contact.linkedinUrl ? 5 : 0)
  );

  // Recency: max 20 points if active in last 7 days
  const lastActivity = engagement.lastVisitAt || engagement.lastOpenAt || contact.createdAt;
  const daysSinceActivity = lastActivity
    ? (Date.now() - lastActivity.toDate().getTime()) / (1000 * 60 * 60 * 24)
    : 999;
  const recencyScore = Math.max(0, Math.min(20, 20 - (daysSinceActivity * 2)));

  const totalScore = Math.round(engagementScore + behaviorScore + profileScore + recencyScore);

  await updateContact(contactId, {
    score: totalScore,
    scoreBreakdown: {
      engagement: engagementScore,
      behavior: behaviorScore,
      profile: profileScore,
      recency: recencyScore
    },
    scoreUpdatedAt: serverTimestamp()
  }, 'system');

  return totalScore;
};

// ============================================================
// Journey Integration
// ============================================================

/**
 * Add contact to journey
 */
export const addContactToJourney = async (contactId, journeyId, journeyName) => {
  const contact = await getContact(contactId);
  if (!contact) return null;

  const activeJourneys = contact.journeys?.active || [];

  if (activeJourneys.includes(journeyId)) {
    return contact; // Already in journey
  }

  const history = contact.journeys?.history || [];
  history.push({
    journeyId,
    journeyName,
    action: 'enrolled',
    at: Timestamp.now(),
    reason: 'api_enrollment'
  });

  return updateContact(contactId, {
    'journeys.active': [...activeJourneys, journeyId],
    'journeys.history': history
  }, 'system');
};

/**
 * Remove contact from journey
 */
export const removeContactFromJourney = async (contactId, journeyId, reason = 'manual') => {
  const contact = await getContact(contactId);
  if (!contact) return null;

  const activeJourneys = contact.journeys?.active || [];
  const completedJourneys = contact.journeys?.completed || [];
  const history = contact.journeys?.history || [];

  // Get journey name from history
  const journeyEntry = history.find(h => h.journeyId === journeyId);
  const journeyName = journeyEntry?.journeyName || journeyId;

  history.push({
    journeyId,
    journeyName,
    action: reason === 'completed' ? 'completed' : 'exited',
    at: Timestamp.now(),
    reason
  });

  const updates = {
    'journeys.active': activeJourneys.filter(id => id !== journeyId),
    'journeys.history': history
  };

  if (reason === 'completed') {
    updates['journeys.completed'] = [...completedJourneys, journeyId];
  }

  return updateContact(contactId, updates, 'system');
};

// ============================================================
// Engagement Tracking
// ============================================================

/**
 * Record tool usage
 */
export const recordToolUsage = async (contactId, toolName) => {
  const contact = await getContact(contactId);
  if (!contact) return null;

  const toolsUsed = contact.engagement?.toolsUsed || [];

  if (!toolsUsed.includes(toolName)) {
    toolsUsed.push(toolName);
  }

  return updateContact(contactId, {
    'engagement.toolsUsed': toolsUsed,
    'engagement.lastVisitAt': serverTimestamp()
  }, 'system');
};

/**
 * Record email event
 */
export const recordEmailEvent = async (contactId, eventType, eventData = {}) => {
  const contact = await getContact(contactId);
  if (!contact) return null;

  const engagement = contact.engagement || {};
  const updates = {};

  switch (eventType) {
    case 'sent':
      updates['engagement.emailsSent'] = (engagement.emailsSent || 0) + 1;
      updates['engagement.lastEmailAt'] = serverTimestamp();
      break;
    case 'opened':
      updates['engagement.emailsOpened'] = (engagement.emailsOpened || 0) + 1;
      updates['engagement.lastOpenAt'] = serverTimestamp();
      break;
    case 'clicked':
      updates['engagement.emailsClicked'] = (engagement.emailsClicked || 0) + 1;
      updates['engagement.lastClickAt'] = serverTimestamp();
      break;
  }

  if (Object.keys(updates).length > 0) {
    return updateContact(contactId, updates, 'system');
  }

  return contact;
};

// ============================================================
// Export
// ============================================================

export default {
  generateContactId,
  hashEmail,
  createContactObject,
  getContact,
  getContactByEmail,
  upsertContact,
  updateContact,
  archiveContact,
  listContacts,
  searchContacts,
  updateContactScore,
  addContactToJourney,
  removeContactFromJourney,
  recordToolUsage,
  recordEmailEvent
};
