# SMB Prospecting Engine: Claude Code Project Scope

**Project Owner**: Marketing Operations / Solo Founder
**Budget**: $25/month maximum
**Timeline**: 90-day phased rollout
**Infrastructure Stack**: Firebase (backend), React (frontend), HubSpot (CRM destination)

---

## Executive Scope Summary

Build a **programmatic SMB prospecting engine** leveraging Google Places API + n8n automation that integrates with your existing Firebase/React/HubSpot infrastructure. The system will generate 1,000-2,000+ qualified SMB leads monthly at $5-12 cost, with full API control and zero vendor lock-in.

**Core Value**: Replace $50-150/month SaaS tools with a $5-12 self-hosted infrastructure owned by your team.

---

## Phase 1: Foundation (Weeks 1-3) - $0 Setup Cost

### 1.1 Google Places API Integration Layer
**Deliverable**: Firebase Cloud Function that wraps Google Places API with caching/deduplication

```
INPUT: Location + Business Type (e.g., "restaurants in NYC")
OUTPUT: 500 businesses/day with:
  - Business name, address, phone, website
  - Google rating, review count, hours
  - Place ID (for enrichment queries)
  - Normalized data schema for Firebase Firestore

STACK:
  - Firebase Cloud Functions (Node.js)
  - Firestore collection: `google_places_raw`
  - Rate limiting logic to stay under 10K free tier
  - Error handling + retry logic
```

**Acceptance Criteria**:
- [ ] Cloud Function queries Google Places Nearby Search API
- [ ] Results cached in Firestore for 30 days (deduplication)
- [ ] Honors API quota: max 333 calls/day to stay comfortably under 10K/month
- [ ] Returns clean JSON with normalized fields
- [ ] Cost tracking logged to Firestore for budget monitoring

**Estimated Effort**: 16-20 hours

---

### 1.2 Email Enrichment Pipeline (Free Tier)
**Deliverable**: Firebase Cloud Function that chains Hunter.io + web scraping for email discovery

```
INPUT: Business name, website, phone
OUTPUT: Email address + confidence score (if found)

LOGIC:
  1. Query Hunter.io free API (50 credits/month) for domain emails
  2. Fallback: Parse website footer/contact page for email patterns (Cheerio/Puppeteer)
  3. Store result in Firestore: `businesses_enriched`
  4. Track API usage for budget management

STACK:
  - Firebase Cloud Functions
  - Hunter.io API (free tier integration)
  - Cheerio or Puppeteer for light web scraping
  - Firestore collection: `businesses_enriched`
```

**Acceptance Criteria**:
- [ ] Integrates Hunter.io free tier (50 emails/month)
- [ ] Implements fallback web scraping for 30-40% of businesses
- [ ] Stores email + source + confidence score in Firestore
- [ ] Logs API call count for budget tracking
- [ ] Handles errors gracefully (missing websites, timeouts)

**Estimated Effort**: 12-16 hours

---

### 1.3 Email Verification (Free Tier)
**Deliverable**: Integrate free email verification service

```
INPUT: Extracted email addresses
OUTPUT: Valid/Invalid/Risky classification

OPTIONS (pick one based on API limits):
  - ZeroBounce: 100 free verifications/month
  - Verifalia: Free tier available
  - AbstractAPI: Generous free tier

STACK:
  - Firebase Cloud Function
  - Choice of verification service
  - Firestore field: `email_status` (valid/invalid/risky)
```

**Acceptance Criteria**:
- [ ] Integrates chosen email verification service
- [ ] Marks emails as valid/invalid/risky
- [ ] Tracks API usage for monthly budgeting
- [ ] Only enriches high-confidence leads (score > 0.7)

**Estimated Effort**: 6-8 hours

---

### 1.4 Data Schema & Firestore Structure
**Deliverable**: Normalized Firestore schema for leads pipeline

```firestore
/businesses/{businessId}
  ├── source: "google_places"
  ├── google_places_data
  │   ├── placeId: string
  │   ├── name: string
  │   ├── address: string
  │   ├── city: string
  │   ├── state: string
  │   ├── phone: string
  │   ├── website: string
  │   ├── rating: number
  │   ├── reviewCount: number
  │   └── types: array (restaurant, plumber, etc.)
  ├── enrichment
  │   ├── email: string
  │   ├── emailSource: string (hunter_io / web_scrape)
  │   ├── emailConfidence: number (0-1)
  │   ├── emailStatus: string (valid / invalid / risky)
  │   └── enrichedAt: timestamp
  ├── status: string (found / enriching / ready / exported)
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  └── tags: array (for segmentation)

/api_usage/{date}
  ├── googlePlacesCallsUsed: number
  ├── hunterApiCalls: number
  ├── emailVerificationCalls: number
  ├── totalCost: number
  └── date: timestamp
```

**Acceptance Criteria**:
- [ ] Schema supports all data points from Google Places
- [ ] Handles enrichment layers independently (can work without email if API exhausted)
- [ ] Includes API usage tracking for cost monitoring
- [ ] Firestore security rules prevent accidental data deletion

**Estimated Effort**: 4-6 hours

---

## Phase 2: Workflow Automation (Weeks 4-6) - $0-5 Setup Cost

### 2.1 n8n Self-Hosted Deployment
**Deliverable**: n8n instance running on Hetzner VPS with persistent storage

```
DEPLOYMENT:
  - Hetzner CX22 VPS ($4.43/month)
  - Docker + Docker Compose for n8n
  - PostgreSQL for n8n database
  - Nginx reverse proxy
  - SSL certificate (Let's Encrypt free)

NETWORKING:
  - Secure API key storage in n8n environment variables
  - Firewall rules: only n8n <-> Firebase/Google APIs
  - Webhook endpoint for triggering workflows
```

**Acceptance Criteria**:
- [ ] n8n instance accessible via secure domain
- [ ] PostgreSQL persists workflows and execution history
- [ ] Firewall configured for security (only necessary ports open)
- [ ] SSL certificate auto-renews
- [ ] Daily automated backups to Firebase Storage

**Estimated Effort**: 8-12 hours (includes learning Docker/n8n if new)

---

### 2.2 n8n Workflow: Daily Prospect Discovery
**Deliverable**: n8n workflow that discovers 300-500 new SMB prospects daily

```
WORKFLOW STEPS:
  1. Trigger: Daily at 2 AM (cron)
  2. Search Google Places API via Firebase Cloud Function
     - Input: Predefined business categories/locations
     - Batches 10 searches to stay under daily quota
  3. Store raw results in Firestore (`google_places_raw`)
  4. Webhook call to Firebase function for deduplication
  5. Move unique results to `businesses_enriching`
  6. Log execution + results to monitoring
  7. Send Slack notification with count

SCHEDULE:
  - Daily: 300-500 businesses discovered
  - Monthly: ~9,000 businesses (staying under 10K API limit)
```

**Acceptance Criteria**:
- [ ] Workflow runs daily without manual intervention
- [ ] Processes 10-15 searches per run (adjustable)
- [ ] Stores raw results in Firestore
- [ ] Logs execution metrics (success/failure rate)
- [ ] Slack notification shows daily count + API usage

**Estimated Effort**: 6-10 hours

---

### 2.3 n8n Workflow: Email Enrichment Automation
**Deliverable**: n8n workflow that enriches businesses with emails daily

```
WORKFLOW STEPS:
  1. Trigger: Daily at 3 AM (after discovery completes)
  2. Query Firestore: businesses with status="enriching"
  3. For each business:
     a. Call Firebase function: enrich with email (Hunter.io + fallback)
     b. Store email + confidence in Firestore
     c. Mark status="email_enriched"
  4. Batch up to 50 businesses/run (respect Hunter.io 50 credit limit)
  5. Log: emails found/not found/errors
  6. Slack notification with enrichment results

DAILY OUTPUT:
  - 15-25 emails found (Hunter.io) + 15-30 from web scraping
  - ~40-55 enriched leads per day
```

**Acceptance Criteria**:
- [ ] Processes 50 businesses per daily run
- [ ] Integrates Hunter.io API with credit tracking
- [ ] Falls back to web scraping if no Hunter.io match
- [ ] Updates Firestore with email + source
- [ ] Tracks API usage and costs

**Estimated Effort**: 8-12 hours

---

### 2.4 n8n Workflow: Email Verification Automation
**Deliverable**: n8n workflow that validates emails via free service

```
WORKFLOW STEPS:
  1. Trigger: Daily at 4 AM (after enrichment completes)
  2. Query Firestore: businesses with email but status != verified
  3. For each email:
     a. Call verification API (ZeroBounce/Verifalia/AbstractAPI)
     b. Mark as valid/invalid/risky
     c. Update Firestore: `emailStatus`
  4. Batch to stay under free tier limits (~100/day)
  5. Log results: x valid, y invalid, z risky
  6. Slack notification

DAILY OUTPUT:
  - 100 emails verified
  - Remove invalid emails from prospect pool
  - Flag risky emails for manual review
```

**Acceptance Criteria**:
- [ ] Verifies up to 100 emails per day (within free tier)
- [ ] Updates Firestore with valid/invalid/risky status
- [ ] Removes invalid emails from prospect pool
- [ ] Tracks API usage and remaining quota
- [ ] Logs verification results for monitoring

**Estimated Effort**: 6-8 hours

---

## Phase 3: React Dashboard + HubSpot Integration (Weeks 7-9) - Integration Cost

### 3.1 React Dashboard: Prospecting Metrics
**Deliverable**: Real-time dashboard showing pipeline metrics

```
FEATURES:
  - Today's discovered: 500 businesses
  - This week's discovered: 3,500 businesses
  - This month's discovered: 12,000 businesses (progress vs 10K API limit)
  - Email enrichment rate: 45%
  - Email verification rate: 92% valid
  - API cost tracker: $X.XX of $25 monthly budget
  - Recent leads table: sortable/filterable
  
TECH:
  - React + Tailwind CSS
  - Firebase Firestore real-time listeners
  - Recharts for metrics visualization
  - Responsive design (mobile-friendly)
```

**Acceptance Criteria**:
- [ ] Displays real-time metrics from Firestore
- [ ] Shows API usage vs budget
- [ ] Searchable leads table with sorting
- [ ] Filters by: status, email_status, date_range, location, business_type
- [ ] Mobile-responsive design
- [ ] Page load < 2 seconds

**Estimated Effort**: 16-20 hours

---

### 3.2 HubSpot Integration: Automatic Lead Export
**Deliverable**: Firebase Cloud Function that syncs prospects to HubSpot

```
LOGIC:
  1. Firestore trigger: When business.status = "ready" (verified email + data complete)
  2. Transform data to HubSpot API format:
     - Company name, address, phone, website
     - Contact email
     - Source: "google_places_automation"
     - Custom fields: business_type, rating, review_count
  3. Create Company + Contact in HubSpot
  4. Add to workflow: "Inbound - SMB Prospecting"
  5. Mark in Firestore: status = "exported_to_hubspot"
  6. Log sync to Firebase for audit trail

SYNC TIMING:
  - Every 12 hours or on-demand
  - Avoid duplicate syncs (track HubSpot IDs in Firestore)
```

**Acceptance Criteria**:
- [ ] Authenticates with HubSpot API
- [ ] Transforms Firestore data to HubSpot schema
- [ ] Creates Companies + Contacts automatically
- [ ] Prevents duplicate syncs (tracks HubSpot IDs)
- [ ] Logs all syncs with timestamps
- [ ] Handles API errors gracefully (retry logic)
- [ ] Tracks sync status in Firestore

**Estimated Effort**: 10-14 hours

---

### 3.3 React Component: Manual Lead Review & Export
**Deliverable**: UI for reviewing prospects before HubSpot export

```
FEATURES:
  - List view: unreviewed prospects with complete data
  - Detail view: expand for full business info + enrichment sources
  - Actions:
    - Approve: send to HubSpot
    - Reject: mark as low-quality, don't export
    - Tag: add custom tags for segmentation
  - Bulk actions: approve 50 leads at once
  - Search/filter: by location, business type, rating
  - Export: download as CSV if needed
```

**Acceptance Criteria**:
- [ ] Loads 50 leads per page efficiently
- [ ] Detail view shows all enrichment data + sources
- [ ] Bulk approve/reject works smoothly
- [ ] Tags persist to Firestore
- [ ] CSV export includes all fields
- [ ] UX is fast and intuitive

**Estimated Effort**: 12-16 hours

---

## Phase 4: Monitoring & Optimization (Weeks 10-12) - Ongoing

### 4.1 Cost Tracking Dashboard
**Deliverable**: Real-time cost monitoring to ensure you stay under $25/month

```
TRACKED METRICS:
  - Google Places API: X calls used × $0.005 per call (after free tier)
  - Hunter.io: 50 free credits used
  - Email verification: X calls used (ZeroBounce 100/month free)
  - n8n hosting: $4.43 (Hetzner)
  - Total: $X.XX of $25 budget remaining

ALERTS:
  - Slack notification if Google API cost > $5
  - Warning if approaching quota limits
  - Daily cost report
```

**Acceptance Criteria**:
- [ ] Tracks all API costs in real-time
- [ ] Alerts when approaching budgets
- [ ] Historical cost tracking (monthly/quarterly)
- [ ] Cost per lead calculation

**Estimated Effort**: 4-6 hours

---

### 4.2 Monitoring & Alerting
**Deliverable**: Error tracking + uptime monitoring

```
SETUP:
  - Sentry (free tier) for error tracking
  - Uptime monitoring (Firebase Cloud Functions status)
  - n8n workflow execution logs
  - Slack alerts for failures
```

**Acceptance Criteria**:
- [ ] Tracks Cloud Function errors
- [ ] n8n workflow failures logged + alerted
- [ ] Daily health report via Slack
- [ ] Error rate < 1%

**Estimated Effort**: 3-5 hours

---

### 4.3 Performance Optimization
**Deliverable**: Optimize workflows for speed + cost

```
TASKS:
  - Profile Cloud Functions for cold starts
  - Cache Google Places results aggressively
  - Batch operations to reduce API calls
  - Optimize Firestore queries (add indexes)
  - Monitor n8n memory/CPU usage
```

**Acceptance Criteria**:
- [ ] Cloud Functions cold start < 2s
- [ ] Average workflow execution < 30s
- [ ] n8n VPS CPU usage < 40% baseline
- [ ] Firestore queries < 100ms

**Estimated Effort**: 8-12 hours (ongoing)

---

## Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROSPECTING PIPELINE                         │
└─────────────────────────────────────────────────────────────────┘

1. DISCOVERY LAYER
   ├── n8n (Hetzner VPS) - Daily trigger
   └── Google Places API → Firebase Cloud Function
       └── Firestore: `businesses_raw`

2. ENRICHMENT LAYER
   ├── Email Finder: Hunter.io + Web Scraping
   ├── Email Verifier: ZeroBounce / Verifalia
   └── Firestore: `businesses_enriched`

3. STORAGE LAYER
   └── Firestore Collections:
       ├── businesses/{id} - master record
       ├── api_usage/{date} - cost tracking
       └── sync_history/{id} - HubSpot audit trail

4. PRESENTATION LAYER
   ├── React Dashboard (metrics + filtering)
   └── Review Component (manual approval before export)

5. INTEGRATION LAYER
   └── HubSpot API ← Firebase Cloud Function
       ├── Auto-create Companies
       ├── Auto-create Contacts
       └── Add to workflow

6. MONITORING
   ├── Firestore logging
   ├── Slack alerts
   ├── Sentry error tracking
   └── Cost dashboard
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Google Places API Cloud Function
- [ ] Email enrichment Cloud Function
- [ ] Email verification integration
- [ ] Firestore schema design
- [ ] Cost tracking setup

### Phase 2: Automation
- [ ] n8n deployment on Hetzner
- [ ] Daily discovery workflow
- [ ] Email enrichment workflow
- [ ] Email verification workflow
- [ ] Workflow monitoring + alerts

### Phase 3: Integration
- [ ] React dashboard component
- [ ] HubSpot Cloud Function integration
- [ ] Manual review UI component
- [ ] CSV export functionality
- [ ] Firestore → HubSpot sync testing

### Phase 4: Optimization
- [ ] Cost tracking dashboard
- [ ] Error monitoring (Sentry)
- [ ] Performance profiling
- [ ] Optimization iterations
- [ ] Documentation

---

## Estimated Total Effort

| Phase | Hours | Timeline |
|-------|-------|----------|
| Phase 1: Foundation | 38-50 | Weeks 1-3 |
| Phase 2: Automation | 28-42 | Weeks 4-6 |
| Phase 3: Integration | 38-50 | Weeks 7-9 |
| Phase 4: Optimization | 15-23 | Weeks 10-12 |
| **TOTAL** | **119-165** | **90 days** |

**Full-time developer equivalent**: 3-4 weeks

---

## Monthly Cost Breakdown

| Component | Cost |
|-----------|------|
| Hetzner CX22 VPS | $4.43 |
| Google Places API (excess) | $0-2 (if needed) |
| n8n self-hosted | $0 |
| Hunter.io | $0 (free tier) |
| Email verification | $0 (free tier) |
| **TOTAL** | **$4-6/month** |

✅ **Well under $25 budget with room to scale**

---

## Key Success Criteria

- [ ] System generates 1,000+ SMB leads per month
- [ ] Total cost stays under $15/month
- [ ] Zero manual lead discovery (fully automated)
- [ ] Email find rate ≥ 40%
- [ ] Email validity rate ≥ 85%
- [ ] All leads sync to HubSpot automatically
- [ ] Dashboard provides real-time visibility
- [ ] 99% uptime (n8n + Cloud Functions)
- [ ] No external vendor lock-in

---

## Next Steps

1. **Week 1**: Start with Phase 1 foundation work
2. **Week 4**: Deploy n8n to Hetzner + activate workflows
3. **Week 7**: Build React dashboard + HubSpot integration
4. **Week 10**: Monitor, optimize, scale
5. **Ongoing**: Iterate on business type/location targeting

---

## Questions for Clarification Before Building

1. **Business Categories**: Which SMB types are you targeting? (Restaurants, plumbers, dentists, contractors, retail, etc.)
2. **Geographic Scope**: Start with specific cities or nationwide?
3. **HubSpot Workflows**: Do you have existing workflows ready for inbound leads?
4. **Manual Review**: How many leads do you want to review manually vs. auto-export?
5. **Data Refresh**: How often should you re-prospect the same geographic areas?

---

**Status**: Ready for Claude Code project setup
**Priority**: HIGH - Direct ROI on marketing spend
**Risk Level**: LOW - Firebase + n8n are battle-tested, minimal dependencies