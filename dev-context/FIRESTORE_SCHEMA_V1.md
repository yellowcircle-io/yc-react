# Firestore Schema Specification v1.0
## yellowCircle Data Foundation

*Created: December 9, 2025*
*Status: CANONICAL - All implementations must follow this schema*

---

## Design Principles

1. **Extensibility:** All documents include `metadata: {}` for future fields without schema changes
2. **Audit Trail:** All mutable documents track `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
3. **Soft Delete:** Use `status: 'archived'` instead of hard deletes for data recovery
4. **Denormalization:** Duplicate key fields for query efficiency (Firestore best practice)
5. **Consistent IDs:** Use deterministic IDs where possible (email-based) for deduplication

---

## Collection: `contacts/{contactId}`

**Purpose:** Canonical record for every person in the system. Single source of truth.

**Document ID Strategy:**
- Use email hash for deterministic IDs: `contact-${sha256(email.toLowerCase()).substring(0, 12)}`
- Enables deduplication by design
- Alternative lookups via `email` field index

```typescript
interface Contact {
  // === IDENTITY (immutable after creation) ===
  id: string;                    // Document ID
  email: string;                 // Primary identifier, lowercase, indexed
  emailHash: string;             // SHA256 hash for ID generation

  // === PROFILE (mutable) ===
  name: string;                  // Full name
  firstName: string;             // Parsed first name (for personalization)
  lastName: string;              // Parsed last name
  company: string;               // Company name
  jobTitle: string;              // Job title/role
  phone: string;                 // Phone number (E.164 format preferred)
  linkedinUrl: string;           // LinkedIn profile URL
  website: string;               // Personal/company website
  avatar: string;                // Profile image URL (Cloudinary)
  timezone: string;              // IANA timezone (e.g., "America/New_York")

  // === CLASSIFICATION ===
  type: 'lead' | 'prospect' | 'client' | 'partner' | 'other';
  stage: 'new' | 'nurturing' | 'engaged' | 'qualified' | 'opportunity' | 'customer' | 'churned';
  tags: string[];                // Flexible tagging: ["newsletter", "tools-user", "assessment-complete"]
  lists: string[];               // Marketing list memberships

  // === SCORING ===
  score: number;                 // 0-100 lead score
  scoreBreakdown: {
    engagement: number;          // Email opens, clicks
    behavior: number;            // Tool usage, site visits
    profile: number;             // Company size, title match
    recency: number;             // Time since last activity
  };
  scoreUpdatedAt: Timestamp;

  // === SOURCE TRACKING ===
  source: {
    original: string;            // First touch: 'lead_gate' | 'assessment' | 'footer' | 'sso' | 'import' | 'api'
    medium: string;              // UTM medium
    campaign: string;            // UTM campaign
    referrer: string;            // HTTP referrer
    landingPage: string;         // First page visited
  };

  // === ENGAGEMENT METRICS ===
  engagement: {
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    lastEmailAt: Timestamp | null;
    lastOpenAt: Timestamp | null;
    lastClickAt: Timestamp | null;
    toolsUsed: string[];         // ["outreach-generator", "unity-notes"]
    assessmentScore: number | null;
    assessmentCompletedAt: Timestamp | null;
    pageViews: number;
    lastVisitAt: Timestamp | null;
  };

  // === JOURNEY TRACKING ===
  journeys: {
    active: string[];            // Currently enrolled journey IDs
    completed: string[];         // Finished journey IDs
    history: JourneyHistoryEntry[];
  };

  // === EXTERNAL SYNC ===
  externalIds: {
    airtableId: string | null;   // Airtable record ID (recXXX)
    hubspotId: string | null;    // Future: HubSpot contact ID
    stripeId: string | null;     // Future: Stripe customer ID
  };
  syncStatus: {
    airtable: 'synced' | 'pending' | 'error' | 'not_synced';
    airtableLastSync: Timestamp | null;
    airtableError: string | null;
  };

  // === PREFERENCES ===
  preferences: {
    emailOptIn: boolean;         // Marketing email consent
    emailFrequency: 'daily' | 'weekly' | 'monthly' | 'none';
    communicationLanguage: string; // ISO 639-1 code
    doNotContact: boolean;       // Hard stop on all outreach
  };

  // === NOTES & CUSTOM FIELDS ===
  notes: string;                 // Free-form notes
  customFields: Record<string, any>; // Extensible key-value pairs

  // === METADATA (extensibility) ===
  metadata: Record<string, any>; // Future fields without schema changes

  // === AUDIT ===
  status: 'active' | 'archived' | 'merged'; // Soft delete support
  mergedInto: string | null;     // If merged, points to canonical contact
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;             // User ID or 'system'
  updatedBy: string;
}

interface JourneyHistoryEntry {
  journeyId: string;
  journeyName: string;
  action: 'enrolled' | 'completed' | 'exited' | 'paused';
  at: Timestamp;
  reason: string;                // "completed_sequence" | "unsubscribed" | "manual" | "condition_exit"
}
```

**Indexes Required:**
```
- email (ASC) - Primary lookup
- type (ASC), score (DESC) - Dashboard filtering
- stage (ASC), updatedAt (DESC) - Pipeline views
- tags (ARRAY_CONTAINS) - Tag-based queries
- source.original (ASC), createdAt (DESC) - Source analysis
- engagement.lastVisitAt (DESC) - Recent activity
- journeys.active (ARRAY_CONTAINS) - Active journey lookup
- externalIds.airtableId (ASC) - Airtable sync lookup
```

---

## Collection: `leads/{leadId}`

**Purpose:** Raw capture events before contact resolution. Preserves original submission data.

**Document ID Strategy:** Auto-generated (Firestore default) - each submission is unique

```typescript
interface Lead {
  // === IDENTITY ===
  id: string;                    // Auto-generated
  email: string;                 // Submitted email, indexed

  // === SUBMISSION DATA (immutable) ===
  submittedData: {
    name: string;
    company: string;
    phone: string;
    message: string;
    [key: string]: any;          // Form-specific fields
  };

  // === CAPTURE CONTEXT ===
  source: 'lead_gate' | 'footer' | 'assessment' | 'sso' | 'api' | 'webhook';
  sourceTool: string | null;     // If lead_gate: "outreach-generator", "unity-notes"
  sourceForm: string | null;     // Form identifier

  // === UTM & ATTRIBUTION ===
  attribution: {
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent: string;
    utmTerm: string;
    referrer: string;
    landingPage: string;
    sessionId: string;           // For multi-touch attribution
  };

  // === DEVICE & LOCATION ===
  context: {
    userAgent: string;
    ip: string;                  // For geo-lookup (hashed/anonymized in prod)
    country: string;
    city: string;
    device: 'desktop' | 'mobile' | 'tablet';
    browser: string;
  };

  // === PROCESSING STATUS ===
  status: 'new' | 'processing' | 'resolved' | 'duplicate' | 'invalid' | 'error';

  // === RESOLUTION ===
  resolution: {
    contactId: string | null;    // Linked contact after resolution
    resolvedAt: Timestamp | null;
    resolvedBy: string | null;   // 'auto' | 'manual' | user ID
    duplicateOf: string | null;  // If duplicate, original lead ID
    errorMessage: string | null;
  };

  // === TRIGGER TRACKING ===
  triggers: {
    rulesEvaluated: string[];    // Rule IDs that were checked
    rulesMatched: string[];      // Rule IDs that matched
    actionsExecuted: TriggerAction[];
  };

  // === METADATA ===
  metadata: Record<string, any>;

  // === AUDIT ===
  capturedAt: Timestamp;         // Original capture time
  createdAt: Timestamp;          // Firestore create time
  updatedAt: Timestamp;
  processedAt: Timestamp | null; // When processing completed
}

interface TriggerAction {
  ruleId: string;
  ruleName: string;
  actionType: string;
  executedAt: Timestamp;
  result: 'success' | 'failed' | 'skipped';
  resultData: Record<string, any>;
}
```

**Indexes Required:**
```
- email (ASC), capturedAt (DESC) - Dedup checking
- status (ASC), capturedAt (DESC) - Processing queue
- source (ASC), capturedAt (DESC) - Source analysis
- resolution.contactId (ASC) - Contact history lookup
```

---

## Collection: `triggerRules/{ruleId}`

**Purpose:** Automation rule definitions. Controls how leads become prospects in journeys.

**Document ID Strategy:** Human-readable slugs: `rule-welcome-sequence`, `rule-assessment-followup`

```typescript
interface TriggerRule {
  // === IDENTITY ===
  id: string;                    // Document ID (slug)
  name: string;                  // Display name
  description: string;           // Human description of what this rule does

  // === STATUS ===
  enabled: boolean;
  priority: number;              // Lower = higher priority (for rule ordering)

  // === TRIGGER CONDITIONS ===
  trigger: {
    type: 'lead_created' | 'contact_updated' | 'webhook' | 'schedule' | 'manual';

    // Conditions to match (all must be true unless matchMode is 'any')
    conditions: TriggerCondition[];
    matchMode: 'all' | 'any';    // AND vs OR logic
  };

  // === ACTIONS ===
  actions: TriggerAction[];      // Executed in order when triggered

  // === DEDUPLICATION ===
  dedup: {
    enabled: boolean;
    strategy: 'email' | 'email_journey' | 'email_action' | 'custom';
    windowSeconds: number;       // Time window (default: 86400 = 24h)
    customKey: string | null;    // For custom dedup strategy
  };

  // === RATE LIMITING ===
  rateLimit: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
    maxPerWeek: number;
  };

  // === FAILSAFES ===
  failsafe: {
    pauseOnErrorCount: number;   // Auto-pause after N consecutive errors
    alertOnPause: boolean;       // Send Slack alert when paused
    requireApproval: boolean;    // Manual approval before execution (future)
  };

  // === SCHEDULING (for schedule trigger type) ===
  schedule: {
    cron: string | null;         // Cron expression
    timezone: string;            // IANA timezone
    nextRunAt: Timestamp | null;
    lastRunAt: Timestamp | null;
  };

  // === STATISTICS ===
  stats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    skippedDedupe: number;
    skippedRateLimit: number;
    lastExecutedAt: Timestamp | null;
    lastErrorAt: Timestamp | null;
    lastError: string | null;
    consecutiveErrors: number;
  };

  // === METADATA ===
  metadata: Record<string, any>;

  // === AUDIT ===
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

interface TriggerCondition {
  field: string;                 // Dot notation: "source", "submittedData.company", "attribution.utmCampaign"
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' |
            'starts_with' | 'ends_with' | 'in' | 'not_in' |
            'greater_than' | 'less_than' | 'exists' | 'not_exists' |
            'matches_regex';
  value: any;                    // Comparison value (array for 'in'/'not_in')
  caseSensitive: boolean;        // For string comparisons
}

interface TriggerActionDef {
  id: string;                    // Unique within rule
  type: 'enroll_journey' | 'send_email' | 'update_contact' | 'notify_slack' |
        'call_webhook' | 'add_tag' | 'remove_tag' | 'update_score';

  // Action-specific config
  config: {
    // enroll_journey
    journeyId?: string;
    startNodeId?: string;        // Optional: specific start node

    // send_email
    templateId?: string;
    fromEmail?: string;
    replyTo?: string;

    // update_contact
    updates?: Record<string, any>;

    // notify_slack
    channel?: string;
    message?: string;

    // call_webhook
    url?: string;
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: Record<string, any>;

    // add_tag / remove_tag
    tags?: string[];

    // update_score
    scoreAdjustment?: number;
    scoreField?: string;
  };

  // Execution control
  continueOnError: boolean;      // If false, stops action chain on error
  retryCount: number;            // Retry attempts on failure
  retryDelayMs: number;          // Delay between retries
}
```

**Indexes Required:**
```
- enabled (ASC), priority (ASC) - Active rule loading
- trigger.type (ASC), enabled (ASC) - Type-specific queries
- schedule.nextRunAt (ASC), enabled (ASC) - Scheduler queries
```

---

## Collection: `dedupeLog/{key}`

**Purpose:** Track deduplication state. Prevents duplicate actions within time windows.

**Document ID Strategy:** Composite key based on dedup strategy
- `email`: `{email_hash}`
- `email_journey`: `{email_hash}-{journeyId}`
- `email_action`: `{email_hash}-{ruleId}-{actionId}`

```typescript
interface DedupeEntry {
  // === IDENTITY ===
  id: string;                    // Composite key
  email: string;                 // For reference

  // === CONTEXT ===
  journeyId: string | null;
  ruleId: string | null;
  actionId: string | null;

  // === STATE ===
  lastExecutedAt: Timestamp;
  executionCount: number;        // Total times executed (all time)
  windowCount: number;           // Times in current window

  // === HISTORY (rolling window) ===
  recentExecutions: {
    at: Timestamp;
    ruleId: string;
    result: string;
  }[];                           // Last N executions for debugging

  // === EXPIRY ===
  expiresAt: Timestamp;          // TTL for automatic cleanup

  // === AUDIT ===
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**TTL Policy:** Documents auto-expire after `expiresAt` (Firestore TTL)

---

## Collection: `triggerLogs/{logId}`

**Purpose:** Audit log for all trigger executions. Debugging and compliance.

**Document ID Strategy:** Auto-generated with timestamp prefix for ordering: `{timestamp}-{random}`

```typescript
interface TriggerLog {
  // === IDENTITY ===
  id: string;

  // === CONTEXT ===
  ruleId: string;
  ruleName: string;
  leadId: string | null;
  contactId: string | null;
  email: string;

  // === EXECUTION ===
  triggeredAt: Timestamp;
  completedAt: Timestamp | null;
  durationMs: number | null;

  // === RESULT ===
  status: 'started' | 'success' | 'partial' | 'failed' | 'skipped';
  skipReason: 'dedup' | 'rate_limit' | 'condition_not_met' | 'rule_disabled' | null;

  // === ACTIONS ===
  actions: {
    actionId: string;
    actionType: string;
    status: 'success' | 'failed' | 'skipped';
    startedAt: Timestamp;
    completedAt: Timestamp | null;
    error: string | null;
    resultData: Record<string, any>;
  }[];

  // === ERROR DETAILS ===
  error: {
    message: string;
    stack: string;
    code: string;
  } | null;

  // === INPUT/OUTPUT (for debugging) ===
  input: {
    lead: Record<string, any>;
    conditions: Record<string, any>;
  };
  output: Record<string, any>;

  // === AUDIT ===
  createdAt: Timestamp;
}
```

**Retention Policy:** 90 days (configurable), then archive to Cloud Storage

---

## Collection: `emailEvents/{eventId}`

**Purpose:** Track email engagement events from ESP webhooks.

**Document ID Strategy:** `{messageId}-{eventType}-{timestamp}`

```typescript
interface EmailEvent {
  // === IDENTITY ===
  id: string;
  messageId: string;             // ESP message ID

  // === CONTEXT ===
  contactId: string;
  email: string;
  journeyId: string | null;
  prospectId: string | null;

  // === EVENT ===
  eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' |
             'complained' | 'unsubscribed';

  // === EVENT DATA ===
  data: {
    // clicked
    url: string | null;

    // bounced
    bounceType: 'hard' | 'soft' | null;
    bounceReason: string | null;

    // complained
    complaintType: string | null;

    // General
    userAgent: string | null;
    ip: string | null;
    country: string | null;
  };

  // === ESP METADATA ===
  espProvider: 'resend' | 'sendgrid' | 'hubspot' | 'mailchimp';
  espEventId: string;            // Original ESP event ID
  espPayload: Record<string, any>; // Raw webhook payload

  // === PROCESSING ===
  processed: boolean;            // Has this been processed for scoring/contact update?
  processedAt: Timestamp | null;

  // === AUDIT ===
  occurredAt: Timestamp;         // When event actually happened
  receivedAt: Timestamp;         // When webhook was received
  createdAt: Timestamp;
}
```

**Indexes Required:**
```
- contactId (ASC), occurredAt (DESC) - Contact timeline
- journeyId (ASC), eventType (ASC), occurredAt (DESC) - Journey analytics
- processed (ASC), occurredAt (ASC) - Processing queue
- messageId (ASC), eventType (ASC) - Dedup
```

---

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/config/admin_users).data.emails.hasAny([request.auth.token.email]);
    }

    function isInternal() {
      return request.auth != null && request.auth.token.internal == true;
    }

    // Contacts - Admin only
    match /contacts/{contactId} {
      allow read: if isAdmin();
      allow write: if isAdmin() || isInternal();
    }

    // Leads - Admin and internal (Cloud Functions)
    match /leads/{leadId} {
      allow read: if isAdmin();
      allow create: if true;  // Anyone can submit a lead
      allow update, delete: if isAdmin() || isInternal();
    }

    // Trigger Rules - Admin only
    match /triggerRules/{ruleId} {
      allow read, write: if isAdmin();
    }

    // Dedupe Log - Internal only
    match /dedupeLog/{key} {
      allow read, write: if isInternal();
    }

    // Trigger Logs - Admin read, internal write
    match /triggerLogs/{logId} {
      allow read: if isAdmin();
      allow write: if isInternal();
    }

    // Email Events - Admin read, internal write
    match /emailEvents/{eventId} {
      allow read: if isAdmin();
      allow write: if isInternal();
    }
  }
}
```

---

## Field Mapping: Airtable ↔ Firestore

| Airtable Field | Firestore Field | Notes |
|----------------|-----------------|-------|
| Email | `email` | Primary key for matching |
| Name | `name` | Full name |
| First Name | `firstName` | Parsed |
| Last Name | `lastName` | Parsed |
| Company | `company` | |
| Job Title | `jobTitle` | |
| Phone | `phone` | E.164 format |
| LinkedIn | `linkedinUrl` | |
| Status | `stage` | Map: Airtable statuses → Firestore stages |
| Tags | `tags` | Array |
| Score | `score` | Numeric |
| Source | `source.original` | |
| Notes | `notes` | |
| Created | `createdAt` | Timestamp |
| Modified | `updatedAt` | Timestamp |
| Airtable ID | `externalIds.airtableId` | For bidirectional sync |

---

## Migration Notes

### From Existing `journeys/` Collection
The existing journey structure remains unchanged. The new `contacts/` collection links via:
- `contacts/{contactId}.journeys.active[]` → journey IDs
- `journeys/{journeyId}.prospects[].contactId` → contact reference (new field to add)

### Backward Compatibility
- Existing journey prospects without `contactId` continue to work
- New prospects created via trigger system will have `contactId` populated
- Migration script can backfill `contactId` for existing prospects

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 9, 2025 | Initial schema specification |

---

*This schema is CANONICAL. All implementations must conform to these specifications.*
