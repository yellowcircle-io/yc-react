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
    type: 'lead',  // Legacy field - use recordType instead
    stage: 'new',
    tags: [],
    lists: [],

    // Record Type (4-tier CRM taxonomy - Dec 2025)
    // client: Active revenue relationship
    // contact: Marketing opt-in, two-way communication, using tools
    // lead: Provided info (form/call/calendar) without full marketing opt-in
    // prospect: Cold outreach targets, no prior relationship
    recordType: 'prospect',

    // Permission Tracking (GDPR/CAN-SPAM compliance)
    permissions: {
      marketingEmail: false,    // Can receive promotional emails
      transactional: true,      // Can receive transactional emails
      phone: false,             // Can receive phone calls
      sms: false,               // Can receive SMS
      consentSource: null,      // 'form' | 'platform' | 'import' | 'verbal' | null
      consentDate: null,        // When consent was given
      gdprStatus: 'pending',    // 'consented' | 'pending' | 'withdrawn'
      ccpaOptOut: false,        // California opt-out flag
      lastUpdated: null
    },

    // Lifecycle Tracking
    lifecycle: {
      acquiredAt: null,
      convertedToLeadAt: null,
      convertedToContactAt: null,
      convertedToClientAt: null,
      churnedAt: null,
      reactivatedAt: null
    },

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
      lastTouchedAt: null,    // Last time any interaction occurred
      lastTouchType: null,    // 'email' | 'call' | 'meeting' | 'form' | 'import' | null
      toolsUsed: [],
      assessmentScore: null,
      assessmentCompletedAt: null,
      pageViews: 0,
      lastVisitAt: null
    },

    // Targeting / ICP (Ideal Customer Profile)
    targeting: {
      icp: null,              // Primary ICP segment: 'headshot_studio' | 'b2b_services' | 'startup' | 'agency' | null
      campaigns: [],          // Campaign tags: ['client_a_launch', 'q1_outbound', etc.]
      useCase: null,          // Business use case: 'headshot_prospecting' | 'lead_gen' | 'nurture' | null
      verticals: [],          // Industry verticals: ['legal', 'real_estate', 'tech', etc.]
      companySize: null,      // 'solo' | 'small' | 'medium' | 'enterprise' | null
      priority: 'normal',     // 'high' | 'normal' | 'low'
      excludeFromCampaigns: false,
      notes: ''
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

    // ============================================================
    // DUAL-PIPELINE PROSPECTING (Added Dec 2025)
    // ============================================================

    // Pipeline Assignment
    pipelineAssignment: {
      primaryPipeline: null,  // 'A' | 'B' | 'AB' | null
      pipelineAScore: 0,      // -1 to 1 weighted score
      pipelineAStatus: 'PENDING',  // 'QUALIFIED' | 'EXCLUDED_PE' | 'LOW_SCORE' | 'PENDING' | 'FLAGGED'
      pipelineBScore: 0,
      pipelineBStatus: 'PENDING',
      peExclusionReason: null,
      confidenceScore: 0,     // 0-1
      lastScoredAt: null
    },

    // 27 PE (Private Equity) Signals for Exclusion
    peSignals: {
      fundingHistory: {
        noFundingRecorded: null,           // +0.15 Pipeline A
        seedAngelOnlyUnder500k: null,      // +0.10 Pipeline A
        seriesABWithFounderControl: null,  // +0.05 Pipeline A
        seriesCPlusOrLateStage: null,      // RED FLAG
        peVcInvestorTagsPresent: null      // HARD BLOCK
      },
      corporateStructure: {
        singleFounderFlatOrg: null,        // +0.10 Pipeline A
        parentCompanyExists: null,         // RED FLAG
        foreignBranchStatus: null          // RED FLAG
      },
      digitalFootprint: {
        productHuntLaunchRecent: null,     // +0.12 Pipeline B
        ycBadgePresent: null,              // +0.10 Pipeline B
        foundedWithin36Months: null,       // +0.08 Pipeline B
        nonDilutiveFundingMentioned: null  // +0.05 Pipeline A
      },
      executiveProfile: {
        founderCeoStillActive: null,       // +0.12 both pipelines
        cfoHiredPostFunding: null,         // RED FLAG
        salesVpHiredYearOne: null          // RED FLAG
      },
      hiring: {
        employeeCountUnder50: null,        // +0.08 Pipeline A
        rapidExpansion6mo: null,           // RED FLAG
        founderLedSalesDominance: null     // +0.10 Pipeline A
      },
      revenue: {
        revenueBasedFinancingActive: null, // +0.06 Pipeline A
        recurringRevenueModel: null,       // +0.15 Pipeline B
        organicGrowth50Percent: null       // +0.08 both pipelines
      },
      websiteLanguage: {
        bootstrappedInDescription: null,   // +0.10 Pipeline A
        founderLedPositioning: null,       // +0.08 Pipeline A
        portfolioCompanyMention: null      // HARD BLOCK
      },
      investorConnections: {
        noInvestorsListedOrFounderOnly: null,  // +0.10 Pipeline A
        listIncludesPeVcFirms: null,           // RED FLAG
        exclusivelyAngelsSeedLimited: null     // +0.05 Pipeline A
      }
    },

    // Discovery Source Tracking
    discoverySource: {
      primary: null,  // 'google_places' | 'crunchbase' | 'yc' | 'producthunt' | 'opencorporates' | 'sos' | 'manual'
      sources: [],
      discoveredAt: null,
      rawDataRef: null  // Reference to companies_raw collection
    },

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
// Record Type Management (4-Tier CRM Taxonomy)
// ============================================================

/**
 * Valid record types with their properties
 */
export const RECORD_TYPES = {
  client: {
    label: 'Client',
    description: 'Active revenue relationship',
    color: { bg: '#dcfce7', text: '#15803d' },
    icon: 'Briefcase',
    emailRules: 'transactional + marketing',
    defaultPermissions: { marketingEmail: true, transactional: true, phone: true }
  },
  contact: {
    label: 'Contact',
    description: 'Marketing opt-in, two-way communication',
    color: { bg: '#dbeafe', text: '#1d4ed8' },
    icon: 'UserCheck',
    emailRules: 'full marketing',
    defaultPermissions: { marketingEmail: true, transactional: true, phone: false }
  },
  lead: {
    label: 'Lead',
    description: 'Provided info without full opt-in',
    color: { bg: '#fef3c7', text: '#d97706' },
    icon: 'UserPlus',
    emailRules: 'nurture only',
    defaultPermissions: { marketingEmail: false, transactional: true, phone: false }
  },
  prospect: {
    label: 'Prospect',
    description: 'Cold outreach target',
    color: { bg: '#f3e8ff', text: '#7c3aed' },
    icon: 'Target',
    emailRules: 'CAN-SPAM compliant only',
    defaultPermissions: { marketingEmail: false, transactional: false, phone: false }
  }
};

/**
 * Change contact record type with lifecycle tracking
 */
export const changeRecordType = async (contactId, newType, updatedBy = 'system', notes = '') => {
  if (!RECORD_TYPES[newType]) {
    throw new Error(`Invalid record type: ${newType}. Valid types: ${Object.keys(RECORD_TYPES).join(', ')}`);
  }

  const contactRef = doc(db, 'contacts', contactId);
  const contactSnap = await getDoc(contactRef);

  if (!contactSnap.exists()) {
    throw new Error(`Contact ${contactId} not found`);
  }

  const contact = contactSnap.data();
  const oldType = contact.recordType || 'prospect';
  const now = serverTimestamp();

  // Build lifecycle update
  const lifecycleUpdate = {};
  if (newType === 'lead' && oldType === 'prospect') {
    lifecycleUpdate['lifecycle.convertedToLeadAt'] = now;
  } else if (newType === 'contact' && ['prospect', 'lead'].includes(oldType)) {
    lifecycleUpdate['lifecycle.convertedToContactAt'] = now;
  } else if (newType === 'client' && oldType !== 'client') {
    lifecycleUpdate['lifecycle.convertedToClientAt'] = now;
  }

  // Get default permissions for new type
  const defaultPerms = RECORD_TYPES[newType].defaultPermissions;

  const updateData = {
    recordType: newType,
    type: newType, // Keep legacy field in sync
    'permissions.marketingEmail': defaultPerms.marketingEmail,
    'permissions.transactional': defaultPerms.transactional,
    'permissions.phone': defaultPerms.phone,
    'permissions.lastUpdated': now,
    ...lifecycleUpdate,
    updatedAt: now,
    updatedBy
  };

  // Add conversion note if provided
  if (notes) {
    const existingNotes = contact.notes || '';
    updateData.notes = `${existingNotes}\n[${new Date().toISOString()}] Type changed: ${oldType} → ${newType}. ${notes}`.trim();
  }

  await updateDoc(contactRef, updateData);

  return {
    success: true,
    contactId,
    previousType: oldType,
    newType,
    lifecycleUpdated: Object.keys(lifecycleUpdate).length > 0
  };
};

/**
 * Update contact permissions
 */
export const updatePermissions = async (contactId, permissions, updatedBy = 'system') => {
  const contactRef = doc(db, 'contacts', contactId);

  const updateData = {
    updatedAt: serverTimestamp(),
    updatedBy
  };

  // Map permission fields
  Object.entries(permissions).forEach(([key, value]) => {
    updateData[`permissions.${key}`] = value;
  });

  updateData['permissions.lastUpdated'] = serverTimestamp();

  await updateDoc(contactRef, updateData);

  return { success: true, contactId, updatedPermissions: Object.keys(permissions) };
};

/**
 * Bulk update record types
 */
export const bulkChangeRecordType = async (contactIds, newType, updatedBy = 'system') => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const contactId of contactIds) {
    try {
      await changeRecordType(contactId, newType, updatedBy);
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ contactId, error: err.message });
    }
  }

  return results;
};

/**
 * Get contacts by record type
 */
export const listContactsByRecordType = async (recordType, options = {}) => {
  const { limitCount = 50, lastDoc = null } = options;

  // Use status == 'active' instead of != 'archived' for better index compatibility
  let q = query(
    collection(db, 'contacts'),
    where('recordType', '==', recordType),
    where('status', '==', 'active'),
    limit(limitCount)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);

  return {
    contacts: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === limitCount
  };
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
  orderByField: _orderByField = 'updatedAt',
  orderDirection: _orderDirection = 'desc'
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
export const recordEmailEvent = async (contactId, eventType, _eventData = {}) => {
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
    // Also update lastTouchedAt
    updates['engagement.lastTouchedAt'] = serverTimestamp();
    updates['engagement.lastTouchType'] = 'email';
    return updateContact(contactId, updates, 'system');
  }

  return contact;
};

/**
 * Update contact targeting/ICP
 * @param {string} contactId
 * @param {object} targeting - Targeting fields to update
 * @param {string} updatedBy
 */
export const updateContactTargeting = async (contactId, targeting, updatedBy = 'admin') => {
  const updates = {};

  if (targeting.icp !== undefined) updates['targeting.icp'] = targeting.icp;
  if (targeting.campaigns !== undefined) updates['targeting.campaigns'] = targeting.campaigns;
  if (targeting.useCase !== undefined) updates['targeting.useCase'] = targeting.useCase;
  if (targeting.verticals !== undefined) updates['targeting.verticals'] = targeting.verticals;
  if (targeting.companySize !== undefined) updates['targeting.companySize'] = targeting.companySize;
  if (targeting.priority !== undefined) updates['targeting.priority'] = targeting.priority;
  if (targeting.excludeFromCampaigns !== undefined) updates['targeting.excludeFromCampaigns'] = targeting.excludeFromCampaigns;
  if (targeting.notes !== undefined) updates['targeting.notes'] = targeting.notes;

  if (Object.keys(updates).length > 0) {
    return updateContact(contactId, updates, updatedBy);
  }
  return null;
};

/**
 * Add campaign tag to contact
 */
export const addCampaignToContact = async (contactId, campaignTag, updatedBy = 'admin') => {
  const contact = await getContact(contactId);
  if (!contact) return null;

  const campaigns = contact.targeting?.campaigns || [];
  if (!campaigns.includes(campaignTag)) {
    campaigns.push(campaignTag);
    return updateContact(contactId, { 'targeting.campaigns': campaigns }, updatedBy);
  }
  return contact;
};

/**
 * Record a touch event (call, meeting, manual contact)
 */
export const recordTouch = async (contactId, touchType, notes = '', updatedBy = 'admin') => {
  const updates = {
    'engagement.lastTouchedAt': serverTimestamp(),
    'engagement.lastTouchType': touchType
  };

  if (notes) {
    // Append to notes or create
    const contact = await getContact(contactId);
    const existingNotes = contact?.notes || '';
    const timestamp = new Date().toISOString().split('T')[0];
    updates.notes = existingNotes + (existingNotes ? '\n\n' : '') + `[${timestamp}] ${touchType}: ${notes}`;
  }

  return updateContact(contactId, updates, updatedBy);
};

// ============================================================
// Dual-Pipeline Prospecting Operations
// ============================================================

/**
 * PE Signal Weights for scoring
 */
const PE_SIGNAL_WEIGHTS = {
  pipelineA: {
    // Funding History
    noFundingRecorded: 0.15,
    seedAngelOnlyUnder500k: 0.10,
    seriesABWithFounderControl: 0.05,
    nonDilutiveFundingMentioned: 0.05,
    // Corporate Structure
    singleFounderFlatOrg: 0.10,
    // Executive Profile
    founderCeoStillActive: 0.12,
    // Hiring
    employeeCountUnder50: 0.08,
    founderLedSalesDominance: 0.10,
    // Revenue
    revenueBasedFinancingActive: 0.06,
    organicGrowth50Percent: 0.08,
    // Website Language
    bootstrappedInDescription: 0.10,
    founderLedPositioning: 0.08,
    // Investor Connections
    noInvestorsListedOrFounderOnly: 0.10,
    exclusivelyAngelsSeedLimited: 0.05
  },
  pipelineB: {
    // Digital Footprint
    productHuntLaunchRecent: 0.12,
    ycBadgePresent: 0.10,
    foundedWithin36Months: 0.08,
    // Executive Profile
    founderCeoStillActive: 0.12,
    // Revenue
    recurringRevenueModel: 0.15,
    organicGrowth50Percent: 0.08
  },
  hardBlocks: [
    'peVcInvestorTagsPresent',
    'portfolioCompanyMention'
  ],
  redFlags: [
    'seriesCPlusOrLateStage',
    'parentCompanyExists',
    'foreignBranchStatus',
    'cfoHiredPostFunding',
    'salesVpHiredYearOne',
    'rapidExpansion6mo',
    'listIncludesPeVcFirms'
  ]
};

/**
 * Evaluate PE signals and return exclusion status
 * Returns: { status: 'QUALIFIED' | 'EXCLUDED_PE' | 'FLAGGED', reason, confidence, redFlagCount }
 */
export const evaluatePESignals = (peSignals) => {
  if (!peSignals) {
    return { status: 'PENDING', reason: 'No signals collected', confidence: 0, redFlagCount: 0 };
  }

  // Check for hard blocks first
  const hardBlocks = [];
  if (peSignals.fundingHistory?.peVcInvestorTagsPresent === true) {
    hardBlocks.push('PE/VC investor tags present');
  }
  if (peSignals.websiteLanguage?.portfolioCompanyMention === true) {
    hardBlocks.push('Portfolio company mention detected');
  }

  if (hardBlocks.length > 0) {
    return {
      status: 'EXCLUDED_PE',
      reason: `Hard block: ${hardBlocks.join(', ')}`,
      confidence: 1.0,
      redFlagCount: hardBlocks.length
    };
  }

  // Count red flags
  const redFlags = [];
  if (peSignals.fundingHistory?.seriesCPlusOrLateStage === true) redFlags.push('Series C+ funding');
  if (peSignals.corporateStructure?.parentCompanyExists === true) redFlags.push('Parent company exists');
  if (peSignals.corporateStructure?.foreignBranchStatus === true) redFlags.push('Foreign branch');
  if (peSignals.executiveProfile?.cfoHiredPostFunding === true) redFlags.push('CFO hired post-funding');
  if (peSignals.executiveProfile?.salesVpHiredYearOne === true) redFlags.push('Sales VP hired Y1');
  if (peSignals.hiring?.rapidExpansion6mo === true) redFlags.push('Rapid expansion');
  if (peSignals.investorConnections?.listIncludesPeVcFirms === true) redFlags.push('PE/VC in investor list');

  // 3+ red flags = excluded, 2 = flagged for review
  if (redFlags.length >= 3) {
    return {
      status: 'EXCLUDED_PE',
      reason: `Red flags (${redFlags.length}): ${redFlags.join(', ')}`,
      confidence: 0.85,
      redFlagCount: redFlags.length
    };
  }

  if (redFlags.length === 2) {
    return {
      status: 'FLAGGED',
      reason: `Review needed - Red flags (${redFlags.length}): ${redFlags.join(', ')}`,
      confidence: 0.65,
      redFlagCount: redFlags.length
    };
  }

  return {
    status: 'QUALIFIED',
    reason: redFlags.length === 1 ? `Minor concern: ${redFlags[0]}` : 'No PE indicators',
    confidence: redFlags.length === 1 ? 0.80 : 0.95,
    redFlagCount: redFlags.length
  };
};

/**
 * Calculate pipeline scores from PE signals
 * Returns: { pipelineAScore, pipelineBScore, primaryPipeline }
 */
export const calculatePipelineScores = (peSignals) => {
  if (!peSignals) {
    return { pipelineAScore: 0, pipelineBScore: 0, primaryPipeline: null };
  }

  let pipelineAScore = 0;
  let pipelineBScore = 0;

  // Flatten signals for easier access
  const flatSignals = {
    ...peSignals.fundingHistory,
    ...peSignals.corporateStructure,
    ...peSignals.digitalFootprint,
    ...peSignals.executiveProfile,
    ...peSignals.hiring,
    ...peSignals.revenue,
    ...peSignals.websiteLanguage,
    ...peSignals.investorConnections
  };

  // Calculate Pipeline A score
  for (const [signal, weight] of Object.entries(PE_SIGNAL_WEIGHTS.pipelineA)) {
    if (flatSignals[signal] === true) {
      pipelineAScore += weight;
    } else if (flatSignals[signal] === false) {
      pipelineAScore -= weight * 0.5; // Negative signals reduce score by half weight
    }
  }

  // Calculate Pipeline B score
  for (const [signal, weight] of Object.entries(PE_SIGNAL_WEIGHTS.pipelineB)) {
    if (flatSignals[signal] === true) {
      pipelineBScore += weight;
    } else if (flatSignals[signal] === false) {
      pipelineBScore -= weight * 0.5;
    }
  }

  // Clamp scores to [-1, 1]
  pipelineAScore = Math.max(-1, Math.min(1, pipelineAScore));
  pipelineBScore = Math.max(-1, Math.min(1, pipelineBScore));

  // Determine primary pipeline
  let primaryPipeline = null;
  const threshold = 0.3; // Minimum score to qualify

  if (pipelineAScore >= threshold && pipelineBScore >= threshold) {
    primaryPipeline = 'AB'; // Qualifies for both
  } else if (pipelineAScore >= threshold) {
    primaryPipeline = 'A';
  } else if (pipelineBScore >= threshold) {
    primaryPipeline = 'B';
  }

  return {
    pipelineAScore: Math.round(pipelineAScore * 100) / 100,
    pipelineBScore: Math.round(pipelineBScore * 100) / 100,
    primaryPipeline
  };
};

/**
 * Full pipeline assessment for a contact
 * Combines PE evaluation and scoring
 */
export const assessPipeline = async (contactId) => {
  const contact = await getContact(contactId);
  if (!contact) return null;

  const peEvaluation = evaluatePESignals(contact.peSignals);
  const pipelineScores = calculatePipelineScores(contact.peSignals);

  // Determine final statuses
  let pipelineAStatus = 'PENDING';
  let pipelineBStatus = 'PENDING';

  if (peEvaluation.status === 'EXCLUDED_PE') {
    pipelineAStatus = 'EXCLUDED_PE';
    pipelineBStatus = 'EXCLUDED_PE';
  } else if (peEvaluation.status === 'FLAGGED') {
    pipelineAStatus = 'FLAGGED';
    pipelineBStatus = 'FLAGGED';
  } else {
    // Check score thresholds
    pipelineAStatus = pipelineScores.pipelineAScore >= 0.3 ? 'QUALIFIED' : 'LOW_SCORE';
    pipelineBStatus = pipelineScores.pipelineBScore >= 0.3 ? 'QUALIFIED' : 'LOW_SCORE';
  }

  const updates = {
    'pipelineAssignment.primaryPipeline': pipelineScores.primaryPipeline,
    'pipelineAssignment.pipelineAScore': pipelineScores.pipelineAScore,
    'pipelineAssignment.pipelineAStatus': pipelineAStatus,
    'pipelineAssignment.pipelineBScore': pipelineScores.pipelineBScore,
    'pipelineAssignment.pipelineBStatus': pipelineBStatus,
    'pipelineAssignment.peExclusionReason': peEvaluation.status !== 'QUALIFIED' ? peEvaluation.reason : null,
    'pipelineAssignment.confidenceScore': peEvaluation.confidence,
    'pipelineAssignment.lastScoredAt': serverTimestamp()
  };

  await updateContact(contactId, updates, 'system');

  return {
    contactId,
    ...pipelineScores,
    pipelineAStatus,
    pipelineBStatus,
    peEvaluation
  };
};

/**
 * List contacts by pipeline
 */
export const listContactsByPipeline = async ({
  pipeline = 'A',  // 'A' | 'B' | 'AB' | 'FLAGGED' | 'EXCLUDED'
  status = null,   // Optional status filter
  pageSize = 25,
  lastDoc = null
} = {}) => {
  const contactsRef = collection(db, 'contacts');
  const constraints = [where('status', '==', 'active')];

  if (pipeline === 'FLAGGED') {
    constraints.push(where('pipelineAssignment.pipelineAStatus', '==', 'FLAGGED'));
  } else if (pipeline === 'EXCLUDED') {
    constraints.push(where('pipelineAssignment.pipelineAStatus', '==', 'EXCLUDED_PE'));
  } else {
    constraints.push(where('pipelineAssignment.primaryPipeline', '==', pipeline));
    if (status) {
      constraints.push(where(`pipelineAssignment.pipeline${pipeline}Status`, '==', status));
    }
  }

  constraints.push(limit(pageSize + 1));

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

  return { contacts, lastDoc: lastVisible, hasMore };
};

/**
 * Get pipeline statistics
 */
export const getPipelineStats = async () => {
  const contactsRef = collection(db, 'contacts');

  // Note: For production, use Firestore aggregation queries or maintain counters
  // This is a simplified version that works for smaller datasets
  const activeQuery = query(contactsRef, where('status', '==', 'active'), limit(1000));
  const snapshot = await getDocs(activeQuery);

  const stats = {
    total: 0,
    pipelineA: { qualified: 0, excluded: 0, flagged: 0, lowScore: 0, pending: 0 },
    pipelineB: { qualified: 0, excluded: 0, flagged: 0, lowScore: 0, pending: 0 },
    dualPipeline: 0,
    unassigned: 0
  };

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    stats.total++;

    const pipeline = data.pipelineAssignment?.primaryPipeline;

    if (!pipeline) {
      stats.unassigned++;
    } else if (pipeline === 'AB') {
      stats.dualPipeline++;
    }

    // Count by status
    const statusA = data.pipelineAssignment?.pipelineAStatus || 'PENDING';
    const statusB = data.pipelineAssignment?.pipelineBStatus || 'PENDING';

    const statusMap = {
      'QUALIFIED': 'qualified',
      'EXCLUDED_PE': 'excluded',
      'FLAGGED': 'flagged',
      'LOW_SCORE': 'lowScore',
      'PENDING': 'pending'
    };

    if (statusMap[statusA]) stats.pipelineA[statusMap[statusA]]++;
    if (statusMap[statusB]) stats.pipelineB[statusMap[statusB]]++;
  });

  return stats;
};

// ============================================================
// Migration: Set recordType on existing contacts (Dec 2025)
// ============================================================

/**
 * Migrate existing contacts to set recordType field
 * Call this once to update contacts without recordType
 * @returns {Promise<{updated: number, skipped: number, errors: number}>}
 */
export const migrateContactsToRecordType = async () => {
  const contactsRef = collection(db, 'contacts');
  const snapshot = await getDocs(contactsRef);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();

    // Check if this contact needs any updates
    const needsRecordType = !data.recordType;
    const needsStatus = !data.status;

    // Skip if nothing needs updating
    if (!needsRecordType && !needsStatus) {
      skipped++;
      continue;
    }

    try {
      const updates = {
        updatedAt: serverTimestamp()
      };

      // Set status if missing
      if (needsStatus) {
        updates.status = 'active';
      }

      // Set recordType if missing
      if (needsRecordType) {
        // Determine recordType based on existing data
        let recordType = 'prospect'; // Default

        // If they have active journey or engagement, they're a contact
        if (data.journey?.status === 'active' ||
            (data.engagement?.emailsOpened && data.engagement.emailsOpened > 0)) {
          recordType = 'contact';
        }

        // If they're marked as customer stage, they're a client
        if (data.stage === 'customer') {
          recordType = 'client';
        }

        // If they came from a form submission, they're a lead
        if (data.source?.original &&
            ['lead_gate', 'contact_form', 'assessment', 'footer'].includes(data.source.original)) {
          recordType = 'lead';
        }

        updates.recordType = recordType;
        updates['lifecycle.acquiredAt'] = data.createdAt || serverTimestamp();
      }

      // Update the contact
      await updateDoc(doc(db, 'contacts', docSnapshot.id), updates);
      updated++;
    } catch (err) {
      console.error(`Failed to migrate contact ${docSnapshot.id}:`, err);
      errors++;
    }
  }

  return { updated, skipped, errors };
};

// ============================================================
// Export
// ============================================================

export default {
  // ID Generation
  generateContactId,
  hashEmail,
  // CRUD
  createContactObject,
  getContact,
  getContactByEmail,
  upsertContact,
  updateContact,
  archiveContact,
  // Query
  listContacts,
  searchContacts,
  // Scoring (legacy)
  updateContactScore,
  // Journey
  addContactToJourney,
  removeContactFromJourney,
  // Engagement
  recordToolUsage,
  recordEmailEvent,
  recordTouch,
  // Targeting / ICP (Dec 2025)
  updateContactTargeting,
  addCampaignToContact,
  // Dual-Pipeline Prospecting (Dec 2025)
  evaluatePESignals,
  calculatePipelineScores,
  assessPipeline,
  listContactsByPipeline,
  getPipelineStats,
  // Record Type Management (Dec 2025)
  changeRecordType,
  bulkChangeRecordType,
  listContactsByRecordType,
  migrateContactsToRecordType
};
