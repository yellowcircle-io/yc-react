# EOY Roadmap Scoping Document
## yellowCircle Platform - December 2025 to Q1 2026

*Created: December 9, 2025*
*Updated: December 9, 2025 - v1.1 (User Feedback Integrated)*
*Status: Scoping & Planning (Pre-Execution)*

---

## Executive Summary

This document scopes the comprehensive roadmap from today (December 9, 2025) through Q1 2026, covering:
- Immediate technical improvements and optimizations
- Revenue-generating prospecting infrastructure
- Unity Platform enhancements (UnitySTUDIO, UnityMAP)
- Lead management and automation systems

---

## Critical Architecture Question Analysis

### Question:
> "Is it currently feasible for a record to submit an email through one (or any) of the email captures (Health Check, Footer, SSO) to automatically enter a UnityMAP journey and emailed according to that journey? If yes, does this affect how other users/clients use the existing tools - are they partitioned from each other based on API key usage?"

### Answer: NO - Not Currently Feasible (Gap Identified)

#### Current State Analysis:

**Email Capture Entry Points (3 identified):**

1. **LeadGate** (`src/components/shared/LeadGate.jsx`)
   - Triggered by: Tool access (Outreach Generator, UnityNOTES, etc.)
   - Actions:
     - Saves to localStorage (`yc_lead_captured`)
     - Sends to Web3Forms (backup)
     - Sends to n8n webhook (Airtable + Slack automation)
     - GA4 conversion tracking
   - **NO connection to UnityMAP journeys**

2. **Footer Contact Form** (`src/components/global/Footer.jsx`)
   - Triggered by: Footer email input + "Get In Touch" button
   - Actions:
     - Opens ContactModal with prefilled email
     - ContactModal sends to Web3Forms
   - **NO connection to UnityMAP journeys**

3. **SSO/Google Auth** (via `AuthContext`)
   - Triggered by: Google OAuth sign-in
   - Actions:
     - Firebase Auth creates user record
     - User email stored in Firebase Auth
   - **NO connection to UnityMAP journeys**

4. **Health Check Assessment** (`/assessment`)
   - Triggered by: Assessment completion
   - Actions:
     - Collects email + scores
     - Sends to Web3Forms
   - **NO connection to UnityMAP journeys**

#### Current Data Flow:
```
Email Capture → Web3Forms (email to admin)
             → n8n Webhook (Airtable + Slack)
             → localStorage (client-side tracking)

UnityMAP Journey (SEPARATE SYSTEM):
             → Manual prospect creation in OutreachBusinessPage
             → Firestore journey documents
             → Cloud Function scheduler (every 15 min)
             → Resend email delivery
```

#### Gap Analysis:
There is **no automated bridge** between:
- Email captures (LeadGate, Footer, Assessment, SSO)
- UnityMAP journey system

**Required to enable automatic journey entry:**
1. A **trigger system** that listens for new email captures
2. A **journey selection mechanism** (which journey does this lead enter?)
3. A **prospect creation API** that adds leads to journeys
4. A **deduplication system** (prevent same email entering multiple times)

### User Partitioning & API Key Architecture:

#### Current State:
- **Single-tenant system**: All UnityMAP journeys exist in shared Firestore collection (`journeys/`)
- **No API key partitioning**: Journeys are not segregated by user/client
- **User identification**: Via `journeyId` only, not user ownership

#### Architecture Implications:
| Concern | Current State | Required for Multi-tenant |
|---------|---------------|--------------------------|
| Journey ownership | Not tracked | Add `ownerId` field |
| API key isolation | Shared Resend key | Per-user ESP key storage |
| Data segregation | None | Firestore security rules |
| Rate limiting | Global (3/day free) | Per-user limits |

#### Recommendation:
To support the vision of email → journey automation with client partitioning:

**Phase 1: Internal Use Only (Current yellowCircle)**
- Add journey trigger webhook that creates prospects from email captures
- Simple: All leads enter a single "yellowCircle Welcome" journey
- No partitioning needed (single-user system)

**Phase 2: Multi-tenant SaaS**
- Add `workspaceId` to all journey documents
- Implement per-workspace ESP key storage (encrypted)
- Firestore security rules for workspace isolation
- Per-workspace journey entry points

---

## User Feedback Integration (Dec 9, 2025)

### Questions Addressed:

#### Q: "Wasn't Firestore supposed to be setup?"
**Answer: YES - Firestore IS set up and operational.**

Firestore is fully configured and actively used for:
- Journey documents (`journeys/` collection)
- Rate limiting (`rate_limits/` collection)
- Client whitelist (`config/client_whitelist`)
- Access requests (`access_requests/` collection)
- Capsules/TimeCapsule data (`capsules/` collection)

**What's NOT set up:**
- `contacts/` collection (new - needed for Contact Dashboard)
- `leads/` collection (new - needed for journey auto-enrollment trigger)

**Firebase Cost Considerations:**
| Tier | Reads/Day | Writes/Day | Storage | Cost |
|------|-----------|------------|---------|------|
| Spark (Free) | 50K | 20K | 1 GiB | $0 |
| Blaze (Pay-as-you-go) | $0.06/100K | $0.18/100K | $0.18/GiB/mo | Variable |

**Current Usage Estimate:** Well within free tier (Spark plan)
- ~1K reads/day (journey loads, auth checks)
- ~200 writes/day (rate limits, journey updates)
- ~50MB storage

**Cost Projection (if scaling to 1000 leads/month):**
- ~$5-10/month additional on Blaze plan

#### Q: "No submissions hitting Airtable/Slack/n8n"
**Diagnosis: n8n webhook NOT configured in production**

The `.env` file is **missing** the `VITE_N8N_WEBHOOK` environment variable:
```bash
# Current .env contents - NO n8n webhook!
VITE_FIREBASE_API_KEY=...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_SENTRY_DSN=...
# MISSING: VITE_N8N_WEBHOOK
# MISSING: VITE_SLACK_WEBHOOK
```

**Why it's not working:**
1. n8n has NOT been deployed to Railway yet
2. No webhook URL exists to configure
3. `sendToN8N()` in `integrations.js` silently fails when URL is empty

**Resolution Steps:**
1. Deploy n8n to Railway (confirmed as hosting choice)
2. Create webhook workflow in n8n
3. Add `VITE_N8N_WEBHOOK=https://your-n8n.railway.app/webhook/xxx` to `.env`
4. Optionally add `VITE_SLACK_WEBHOOK` for direct Slack notifications

---

## Confirmed Decisions (User Input)

| Decision | Choice | Notes |
|----------|--------|-------|
| n8n Hosting | **Railway** | $5/mo, confirmed |
| Primary ESP | **Resend** | Extend for hot-swap, add SendGrid |
| Contact Database | **Firestore primary** | Airtable secondary for lookups/client extension |
| CMS Platform | **TBD: Tina.io vs Storyblok** | Research needed for SSH/Shortcuts compatibility |
| Initial Contacts | **Airtable upload** | Reconcile with Firestore as primary |

---

## Trigger-Based Automation System

### Context (Per Unity Hub Screenshots)

The Unity Hub interface shows three send types:
1. **Manual / Single Send** - Create and send individual emails
2. **Batch Upload** - Upload CSV for bulk generation
3. **Automated / Trigger-Based** ⚡ - Set up rules to automatically send based on events

The "Automated / Trigger-Based" section shows:
- Trigger Type selector
- Action selector (Generate Email Only, Generate + Send, etc.)
- Email Template selector
- "+ Add Trigger Rule" button

### Trigger Types to Support

| Trigger | Source | Description |
|---------|--------|-------------|
| `new_lead_crm` | Firestore `leads/` | New lead added to CRM |
| `website_form_submission` | LeadGate, Footer, Assessment | Form submission captured |
| `webhook_external` | n8n, Zapier, etc. | External service webhook |
| `scheduled_campaign` | Cron/scheduled | Time-based campaign launch |

### Architecture for Trigger System

```
┌─────────────────────────────────────────────────────────────┐
│                    TRIGGER SOURCES                          │
├─────────────────────────────────────────────────────────────┤
│  LeadGate    Footer    Assessment    SSO    External API    │
└──────┬─────────┬──────────┬──────────┬──────────┬──────────┘
       │         │          │          │          │
       ▼         ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│              FIRESTORE: leads/{leadId}                      │
│  { email, name, source, capturedAt, metadata }              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼ (Firestore Trigger)
┌─────────────────────────────────────────────────────────────┐
│         CLOUD FUNCTION: onLeadCreated                       │
│  1. Check trigger rules in triggerRules/{ruleId}            │
│  2. Match lead source/metadata to rule conditions           │
│  3. Execute action (create prospect, send email, etc.)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    ACTIONS                                  │
├─────────────────────────────────────────────────────────────┤
│  • Generate Email Only (draft in journey)                   │
│  • Generate + Send (immediate email)                        │
│  • Enroll in Journey (add to UnityMAP campaign)             │
│  • Notify Slack (alert for sales follow-up)                 │
└─────────────────────────────────────────────────────────────┘
```

### Firestore Schema for Trigger Rules

```javascript
// triggerRules/{ruleId}
{
  id: "rule-xxx",
  name: "Welcome Sequence - Tool Signups",
  enabled: true,

  // Trigger conditions
  trigger: {
    type: "website_form_submission", // or "new_lead_crm", "webhook_external", "scheduled_campaign"
    conditions: {
      source: ["lead_gate", "assessment"], // optional filter
      matchAny: true
    }
  },

  // Action to take
  action: {
    type: "enroll_in_journey", // or "generate_email", "send_immediate", "notify_slack"
    journeyId: "journey-xxx", // if enrolling in journey
    emailTemplate: "template-xxx", // if generating email
    notifyChannels: ["slack"] // additional notifications
  },

  // Deduplication
  dedup: {
    enabled: true,
    window: 86400, // seconds (24 hours)
    key: "email" // deduplicate by email
  },

  // Failsafes
  failsafe: {
    maxPerDay: 100, // rate limit
    pauseOnError: true, // pause rule if errors exceed threshold
    errorThreshold: 5
  },

  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: "user-xxx"
}
```

### Deduplication System

**Purpose:** Prevent same contact from:
1. Entering the same journey multiple times
2. Receiving duplicate emails within a window
3. Triggering multiple times from same action

**Implementation:**

```javascript
// functions/index.js - deduplication helper
const checkDedupe = async (email, journeyId, windowSeconds = 86400) => {
  const dedupeRef = db.collection('dedupe_log').doc(`${email}-${journeyId}`);
  const doc = await dedupeRef.get();

  if (doc.exists) {
    const lastEntry = doc.data().lastEntryAt.toDate();
    const windowMs = windowSeconds * 1000;
    if (Date.now() - lastEntry.getTime() < windowMs) {
      return { isDuplicate: true, lastEntry };
    }
  }

  // Not a duplicate, log this entry
  await dedupeRef.set({
    email,
    journeyId,
    lastEntryAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { isDuplicate: false };
};
```

### Prospect Creation API

**New Cloud Function:** `createProspect`

```javascript
// functions/index.js
exports.createProspect = functions.https.onRequest(async (request, response) => {
  setCors(response);

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Auth check (internal use or admin token)
  const authToken = request.headers["x-admin-token"];
  if (authToken !== expectedToken && !request.body.internal) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { email, name, journeyId, metadata } = request.body;

  // Validate required fields
  if (!email || !journeyId) {
    response.status(400).json({ error: "Missing email or journeyId" });
    return;
  }

  // Check deduplication
  const dedupeResult = await checkDedupe(email, journeyId);
  if (dedupeResult.isDuplicate) {
    response.json({
      success: false,
      reason: "duplicate",
      lastEntry: dedupeResult.lastEntry
    });
    return;
  }

  // Load journey
  const journeyRef = db.collection('journeys').doc(journeyId);
  const journeySnap = await journeyRef.get();

  if (!journeySnap.exists) {
    response.status(404).json({ error: "Journey not found" });
    return;
  }

  const journey = journeySnap.data();
  const { nodes, edges, prospects } = journey;

  // Find first executable node
  const firstNodeId = findFirstExecutableNode(nodes, edges);

  // Create prospect entry
  const newProspect = {
    id: `p-${Date.now()}`,
    email,
    name: name || '',
    company: metadata?.company || '',
    source: metadata?.source || 'api',
    currentNodeId: firstNodeId,
    nextExecuteAt: admin.firestore.Timestamp.now(),
    status: 'active',
    history: [{
      action: 'enrolled',
      at: admin.firestore.Timestamp.now(),
      source: 'trigger_api'
    }]
  };

  // Add to journey
  await journeyRef.update({
    prospects: [...prospects, newProspect],
    'stats.totalProspects': prospects.length + 1,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  response.json({
    success: true,
    prospectId: newProspect.id,
    journeyId,
    nextExecuteAt: newProspect.nextExecuteAt
  });
});
```

### Failsafes

| Failsafe | Purpose | Implementation |
|----------|---------|----------------|
| Rate Limit | Prevent spam/runaway triggers | Max 100 triggers per rule per day |
| Error Threshold | Auto-pause broken rules | Pause after 5 consecutive errors |
| Dedup Window | Prevent duplicate entries | 24-hour default window |
| Manual Override | Emergency stop | `stopAllJourneys` function exists |
| Audit Log | Track all trigger executions | Log to `trigger_logs/` collection |

---

## CMS Options Analysis (SSH/Apple Shortcuts Compatible)

### Context: SSH Question Clarified
The "SSH question" refers to compatibility with the existing Apple Shortcuts automation system documented in:
- `.claude/shortcuts/SSH_SCRIPTS_REFERENCE.md`
- `.claude/shortcuts/QUICKSTART.md`
- `.claude/automation/APPLE_SHORTCUTS_SETUP.md`

**Requirement:** CMS should support programmatic content updates via SSH scripts (Node.js) for iPhone/Apple Shortcuts automation.

### Option 1: TinaCMS

**Pricing:** [tina.io/pricing](https://tina.io/pricing)
| Plan | Cost | Users | Features |
|------|------|-------|----------|
| Starter | Free | 2 | Basic editing, GitHub sync |
| Team | $29/mo | 3 (max 10) | Multi-role, editorial workflow |
| Enterprise | Custom | Unlimited | SSO, audit logs |

**SSH/Shortcuts Compatibility: EXCELLENT**
- Git-backed content (Markdown/MDX files in repo)
- Can update via SSH: `git pull && edit file && git commit && git push`
- Existing shortcut-router.js pattern works perfectly
- Content changes sync automatically via Tina Cloud

**Pros:**
- Open-source core
- Git-based = version controlled
- Perfect for existing automation setup
- Visual editor for non-SSH edits
- Free tier sufficient for yellowCircle

**Cons:**
- Less visual editing than Storyblok
- Requires repo-based content structure

### Option 2: Storyblok

**Pricing:** [storyblok.com/pricing](https://www.storyblok.com/pricing)
| Plan | Cost | Features |
|------|------|----------|
| Starter | Free | 1 user, basic features |
| Growth | ~$90/mo | 5 users, more API calls |
| Enterprise | $3,299+/mo | Advanced features |

**SSH/Shortcuts Compatibility: MODERATE**
- API-based content management (REST/GraphQL)
- Requires API calls, not Git commits
- Need to build custom script: `node update-storyblok.js --content="..."`
- More complex than Git-based approach

**Pros:**
- Superior visual editing
- Block-based content structure
- AI features (new in 2025)
- Better for complex layouts

**Cons:**
- Higher cost for multi-user
- More complex SSH integration
- API rate limits on free tier

### Recommendation: TinaCMS

**Rationale:**
1. **SSH Compatibility:** Tina's Git-based model integrates seamlessly with existing `shortcut-router.js` automation
2. **Cost:** Free tier covers yellowCircle needs
3. **Workflow:** Content lives in repo, syncs via Dropbox, editable via iPhone Shortcuts
4. **Fallback:** Visual editor available when SSH isn't convenient

**Implementation Path:**
```bash
# Existing shortcut pattern
node shortcut-router.js content --page=blog --slug=new-post --title="Post Title" --body="Content..."

# This creates/updates: content/blog/new-post.mdx
# Tina Cloud syncs automatically
# Website rebuilds on next deploy
```

---

## Immediate Steps (Today to EOY)

### 1. Bundle Optimization
**Priority:** P2 (Performance)
**Status:** Not Started
**Complexity:** Medium

**Scope:**
- Analyze current bundle with `vite-bundle-visualizer`
- Identify and lazy-load heavy dependencies:
  - ReactFlow (~200KB)
  - Lottie animations
  - Firebase SDK (tree-shake unused modules)
- Implement route-based code splitting
- Target: Reduce initial bundle by 40%+

**Technical Approach:**
```javascript
// Route-based splitting example
const UnityNotesPage = lazy(() => import('./pages/UnityNotesPage'));
const OutreachBusinessPage = lazy(() => import('./pages/experiments/OutreachBusinessPage'));
```

**Dependencies:** None
**Estimated Effort:** 4-6 hours

---

### 2. Prospecting Motion
**Priority:** P1 (Revenue)
**Status:** Partially Complete
**Reference:** `dev-context/PROSPECT_INFRASTRUCTURE_SETUP.md`

**Current State:**
- n8n self-hosted workflow designed
- Web3Forms → Airtable integration stubbed
- Apollo.io enrichment planned

**Remaining Work:**
- [ ] Deploy n8n to Railway ($5/mo)
- [ ] Configure Airtable base with required fields
- [ ] Set up Slack webhook for real-time notifications
- [ ] Connect Apollo.io for lead enrichment
- [ ] Create prospect scoring algorithm

**Technical Requirements:**
- `VITE_N8N_WEBHOOK` env variable
- `VITE_SLACK_WEBHOOK` env variable
- Airtable API key + base configuration

**Dependencies:** Railway account, Airtable account, Slack workspace
**Estimated Effort:** 8-12 hours

---

### 3. Email Nurture & Signup Testing
**Priority:** P1 (Revenue)
**Status:** Architecture Designed
**Complexity:** High

**Scope:**
- Implement ESP hot-swapping (currently Resend-only)
- Add SendGrid, HubSpot, Mailchimp adapter stubs
- Persistence layer for email preferences
- Journey trigger from email captures

**Current ESP Architecture:**
```
src/adapters/esp/
├── index.js          (adapter factory)
├── resendAdapter.js  (✅ Complete)
├── sendgridAdapter.js (stub)
├── hubspotAdapter.js (stub)
└── mailchimpAdapter.js (stub)
```

**Required Changes:**
1. **ESP Selection UI** - Let users pick their ESP
2. **API Key Storage** - Encrypted Firestore storage per workspace
3. **Adapter Completion** - Implement remaining ESP adapters
4. **Failover Logic** - Automatic fallback if primary ESP fails

**Bridge to UnityMAP (New Feature):**
```javascript
// New function needed in functions/index.js
exports.autoEnrollInJourney = functions.firestore
  .document('leads/{leadId}')
  .onCreate(async (snap, context) => {
    const lead = snap.data();
    // Find active nurture journey
    // Create prospect in journey
    // Set initial node position
  });
```

**Dependencies:** ESP accounts, Firestore triggers
**Estimated Effort:** 16-24 hours

---

### 4. UnitySTUDIO Optimizations
**Priority:** P2 (Product)
**Status:** MVP Complete, Expansion Needed
**Reference:** `dev-context/UNITY_PLATFORM_ARCHITECTURE.md`

**Current State:**
- Email Template Builder: ✅ Complete
- Ad Creative Builder: Stub only
- Social Post Builder: Stub only

**Expansion Scope (Per Screenshots):**

#### Ad Creative Builder Requirements:
**Platforms to Support:**
| Platform | Image Dimensions | Title Limits | Body Limits |
|----------|-----------------|--------------|-------------|
| Reddit | 1200x628 (1.91:1) or 1200x1500 (3:4) | 300 chars | 40,000 chars |
| LinkedIn | 1200x628 (1.91:1) | 150 chars | 600 chars |
| Meta (FB/IG) | 1080x1080 (1:1) or 1080x1920 (9:16) | 40 chars | 125 chars |
| Instagram Feed | 1080x1080 (1:1) | N/A | 2,200 chars |
| Instagram Story | 1080x1920 (9:16) | N/A | N/A |

**Template Types (5 existing in stub):**
1. Problem-Solution
2. Social Proof
3. Offer/Promotion
4. How It Works
5. Comparison

**Required Features:**
- [ ] Platform-specific preview (dimensions, character limits)
- [ ] Image upload to Cloudinary
- [ ] AI generation integration (use existing Groq adapter)
- [ ] Export formats (PNG, JPEG, copy text)
- [ ] Brand color/font customization

#### Social Post Builder Requirements:
**Platforms to Support:**
| Platform | Image Options | Character Limit | Hashtag Best Practice |
|----------|--------------|-----------------|----------------------|
| LinkedIn | 1200x628 or 1080x1080 | 3,000 chars | 3-5 hashtags |
| Twitter/X | 1200x675 (1.91:1) | 280 chars | 2-3 hashtags |
| Instagram | 1080x1080 (1:1) to 1080x1350 (4:5) | 2,200 chars | 20-30 hashtags |

**Template Types (5 existing in stub):**
1. Announcement
2. Quick Tip
3. Question/Poll
4. Story/Thread
5. Call-to-Action

**Required Features:**
- [ ] Character counter per platform
- [ ] Hashtag suggestion engine
- [ ] Thread builder for Twitter
- [ ] Preview mode per platform
- [ ] Schedule integration (future)

**Integration Points:**
- Pull context from UnityNOTES AI Chat nodes
- Pull content from UnityMAP email drafts
- Export to UnityMAP for nurture sequences

**Dependencies:** Cloudinary for images, existing adapters
**Estimated Effort:** 24-32 hours (both builders)

---

### 5. Contact Dashboard & Lead Scoring
**Priority:** P1 (Revenue)
**Status:** Not Started
**Complexity:** Medium-High

**Scope:**
- Firestore-based contact database UI
- Lead scoring algorithm
- Airtable sync status display
- Contact timeline/history view

**Database Schema:**
```javascript
// contacts/{contactId}
{
  email: "string",
  name: "string",
  company: "string",
  source: "lead_gate | assessment | footer | sso",
  score: 0-100,
  tags: ["prospect", "client", "newsletter"],
  history: [
    { type: "captured", at: timestamp, source: "lead_gate" },
    { type: "assessment", at: timestamp, score: 72 },
    { type: "email_sent", at: timestamp, journeyId: "xxx" }
  ],
  airtableId: "recXXX" | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Lead Scoring Algorithm:**
| Signal | Points |
|--------|--------|
| Assessment completed | +20 |
| Tool used (per tool) | +10 |
| Email opened | +5 |
| Link clicked | +10 |
| Company identified | +15 |
| Recently active (<7d) | +15 |
| Email bounced | -50 |

**UI Components Needed:**
- ContactsPage (`/contacts` - admin only)
- ContactCard component
- ScoreBadge component
- FilterBar (by source, score, tags)
- ContactTimeline component

**Dependencies:** Firestore indexes, admin access check
**Estimated Effort:** 16-20 hours

---

### 6. Blog Content & CMS
**Priority:** P2 (Marketing)
**Status:** Not Started
**Complexity:** Medium

**Options:**
1. **Static MDX** - In-repo markdown files
2. **Headless CMS** - Contentful/Sanity (cost: $0-99/mo)
3. **Firebase-based** - Custom CMS in Firestore

**Recommendation:** Static MDX for MVP
- No additional costs
- Version controlled content
- Easy to automate via Claude Code

**Required:**
- `/blog` route with listing
- `/blog/:slug` individual post pages
- MDX support in Vite
- SEO meta tags per post

**SSH Question Clarification Needed:**
> What is the SSH question mentioned in the roadmap?

**Dependencies:** MDX loader, content creation
**Estimated Effort:** 8-12 hours (structure), ongoing (content)

---

### 7. Mobile Testing → Mobile Optimization
**Priority:** P1 (UX)
**Status:** Testing Complete, Optimization In Progress
**Reference:** Latest session notes (Nov 30, Dec 7)

**Completed:**
- Basic responsive design
- Navigation circle mobile behavior
- Touch gesture support
- Lottie animation replacements

**Remaining Issues:**
- [ ] UnityNOTES canvas mobile UX
- [ ] UnityMAP node editor touch controls
- [ ] Long form content (article) scroll performance
- [ ] Footer collapse behavior on mobile

**Testing Checklist:**
- [ ] iPhone SE (small screen)
- [ ] iPhone 14/15 (standard)
- [ ] iPad (tablet)
- [ ] Android devices

**Estimated Effort:** 8-12 hours

---

### 8. Site Optimizations
**Priority:** P2 (Platform)
**Status:** Partially Complete

#### Email Tracking (New)
**Scope:** Track email opens/clicks for UnityMAP journeys
**Approach:**
- Use Resend's tracking features (automatic with paid plan)
- Or implement pixel tracking + redirect links

**Required:**
- Webhook endpoint for Resend events
- Update prospect history on open/click
- Condition node evaluation based on engagement

#### API Key Management
**Current State:** Basic localStorage + Firestore sync
**Improvements Needed:**
- Encrypted storage in Firestore
- Key rotation support
- Usage tracking per key
- Multi-key support (LLM + ESP separately)

#### PDF Report Downloads
**Scope:** Generate downloadable reports
**Use Cases:**
- Assessment results PDF
- Journey performance report
- Contact export

**Technical Approach:**
- Client-side PDF generation (jsPDF or html2pdf.js)
- Or Firebase Function with Puppeteer

**Estimated Effort:** 12-16 hours (all three)

---

### 9. Outbound Campaign Seed
**Priority:** P1 (Revenue)
**Status:** Not Started
**Complexity:** Medium

**Scope:**
- Identify 50-100 cold contacts
- Create yellowCircle outreach journey
- Deploy initial campaign via UnityMAP

**Contact Sources:**
- LinkedIn connections
- Past colleagues
- Company research (target verticals)

**Journey Template:**
```
[Prospect Node] → [Email 1: Intro] → [Wait 3 days] →
[Condition: Opened?] → Yes → [Email 2: Value Prop] → [Exit]
                    → No  → [Email 2B: Bump] → [Exit]
```

**Dependencies:** Contact list, journey creation, ESP setup
**Estimated Effort:** 4-6 hours (setup), ongoing (execution)

---

### 10. Prospect Discovery & Enrichment MVP
**Priority:** P2 (Future Revenue)
**Status:** Planning
**Alternative to:** Jeeva AI ($500+/mo)

**MVP Approach:**
- Manual prospect identification (LinkedIn, company websites)
- Apollo.io for enrichment (free tier: 50 credits/mo)
- Airtable as prospect database
- n8n for automation workflows

**Future Enhancement:**
- AI-powered prospect scoring
- Automated LinkedIn outreach
- Intent signal detection

**Dependencies:** Apollo.io account, Airtable setup
**Estimated Effort:** 8-12 hours (MVP)

---

## Next Phase (Q1 2026)

### 1. Cypress E2E Testing
**Scope:** End-to-end test coverage
**Priority Tests:**
- User authentication flow
- Lead capture → journey entry
- Email generation and sending
- Journey execution

**Estimated Effort:** 16-24 hours

### 2. Organic Outreach
**Scope:** LinkedIn content strategy
**Deliverables:**
- 2-3 posts per week
- Thought leadership content from article
- Case study snippets
- Tool demonstrations

**Platform Focus:** LinkedIn (primary), Twitter (secondary)

### 3. Paid & Social Media Amplification
**Scope:** Paid advertising campaigns
**Platforms:**
- Reddit Ads (reference screenshots)
- LinkedIn Sponsored Content
- Meta Ads (retargeting)

**Budget Recommendation:** $500-1000/month test budget

---

## UnitySTUDIO SWOT Assessment

Based on current architecture and market positioning:

### Strengths
- Integrated with existing UnityNOTES/MAP ecosystem
- AI-powered content generation already in place
- Clean adapter architecture for extensibility
- No recurring SaaS costs (uses user's API keys)

### Weaknesses
- Limited template variety
- No image generation capability
- No scheduling/publishing integration
- Mobile UX needs improvement

### Opportunities
- Canva/Buffer alternative for GTM teams
- Cross-platform content syndication
- AI-assisted brand consistency
- Integration with n8n for automation

### Threats
- Established competitors (Canva, Buffer, Hootsuite)
- Platform API rate limits
- Rapidly changing social media specs
- User expectations for polish/features

---

## Priority Matrix

| Item | Impact | Effort | Priority |
|------|--------|--------|----------|
| Prospecting Motion | High | Medium | P1 |
| Outbound Campaign | High | Low | P1 |
| Contact Dashboard | High | Medium | P1 |
| Email Nurture | High | High | P1 |
| Mobile Optimization | Medium | Medium | P1 |
| UnitySTUDIO Expansion | Medium | High | P2 |
| Bundle Optimization | Medium | Medium | P2 |
| Blog/CMS | Medium | Medium | P2 |
| Prospect Enrichment | Medium | Medium | P2 |
| Site Optimizations | Low-Med | Medium | P2 |

---

## Confirmation Checklist

Before execution, confirm:
- [ ] n8n hosting decision (Railway vs other)
- [ ] ESP selection for campaigns (Resend vs SendGrid)
- [ ] Contact database location (Firestore vs Airtable primary)
- [ ] Blog CMS approach (MDX vs headless)
- [ ] SSH question clarification
- [ ] Initial outbound contact list source

---

## Airtable Integration Notes

**Airtable Base:** `apptKYdOCMlxkmkJB`
**Table:** `tbl5mMiu2xrFnGr40`
**View:** `viwPf0FuIFDzihOoo`
**API Token:** `patWezpGxs8KcrPpF` (referenced, not stored here)

**Data Flow:**
```
Initial Contacts → Airtable Upload (manual/bulk)
                         ↓
                   n8n Sync Workflow
                         ↓
              Firestore contacts/{contactId}
                         ↓
              Contact Dashboard UI
```

**Reconciliation Logic:**
- Airtable `Email` field = primary key for matching
- Firestore `contacts/{email}` uses email as document ID
- n8n workflow handles bidirectional sync:
  - New Airtable record → Create Firestore contact
  - Firestore update → Update Airtable record

---

## Updated Confirmation Checklist

| Item | Status | Decision |
|------|--------|----------|
| n8n hosting | ✅ Confirmed | Railway ($5/mo) |
| ESP selection | ✅ Confirmed | Resend primary, SendGrid secondary |
| Contact database | ✅ Confirmed | Firestore primary, Airtable secondary |
| CMS approach | 🟡 Recommended | TinaCMS (pending final approval) |
| SSH/Shortcuts | ✅ Clarified | TinaCMS compatible with existing automation |
| Initial contacts | ✅ Confirmed | Airtable upload → Firestore reconciliation |

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| Dec 9, 2025 | 1.0 | Initial scoping document |
| Dec 9, 2025 | 1.1 | User feedback integration, Firestore status, n8n diagnosis, trigger system scoping, CMS analysis |

---

*This document serves as the foundation for execution. No code changes should be made until scoping is approved.*
