/**
 * Firestore Utilities - Unified Export
 *
 * Central export point for all Firestore data operations.
 * Schema documentation: dev-context/FIRESTORE_SCHEMA_V1.md
 *
 * Usage:
 *   import { contacts, leads, triggers } from '@/utils/firestore';
 *   // or
 *   import { getContact, createLead, listTriggerRules } from '@/utils/firestore';
 */

// Re-export all contact utilities
export * from '../firestoreContacts';
export { default as contacts } from '../firestoreContacts';

// Re-export all lead utilities
export * from '../firestoreLeads';
export { default as leads } from '../firestoreLeads';

// Re-export all trigger utilities
export * from '../firestoreTriggers';
export { default as triggers } from '../firestoreTriggers';

/**
 * Schema version for compatibility checking
 */
export const FIRESTORE_SCHEMA_VERSION = '1.0';

/**
 * Collection names (for reference)
 */
export const COLLECTIONS = {
  CONTACTS: 'contacts',
  LEADS: 'leads',
  TRIGGER_RULES: 'triggerRules',
  DEDUPE_LOG: 'dedupeLog',
  TRIGGER_LOGS: 'triggerLogs',
  EMAIL_EVENTS: 'emailEvents',
  JOURNEYS: 'journeys',
  RATE_LIMITS: 'rate_limits'
};
