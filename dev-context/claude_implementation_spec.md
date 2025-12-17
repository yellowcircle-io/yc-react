# CLAUDE CODE: Dual-Pipeline Prospecting Engine - Implementation Specification

**Project**: Dual-Pipeline Enrichment Cascade for Founder-Controlled Business Prospecting
**Owner**: Marketing Operations / Solo Founder
**Budget**: <$25/month
**Timeline**: 120 days
**Infrastructure**: Firebase (backend), React (frontend), Firestore (leads database), Resend + SendGrid (outreach)

---

## EXECUTIVE IMPLEMENTATION BRIEF

Build a dual-pipeline prospecting system that discovers, scores, and enriches founder-controlled businesses across two segments:

- **Pipeline A**: Professional/B2B Services & Retail Proprietors (NYC, Boston, London, Chicago metros) - $200K+ ARR minimum
- **Pipeline B**: Non-SaaS Tech & Service Companies (Marketing Ops, UX/Brand/Design focused) - Bootstrapped + Limited Angel/Seed (strict scrutiny) - Founded within 36 months

**Critical Gate**: 97%+ of all leads must be founder-controlled, autonomous decision-makers with zero external equity funding or active PE involvement.

**Output**: 1,500-3,500 leads/month → Custom Firestore-based CRM → Outreach via Resend (email) + SendGrid (deliverability) → 5% conversion goal (75-175 sales qualified leads/month)

**Architecture**: Fully owned, no HubSpot dependency, Firebase-native workflow

---

## IMPLEMENTATION PHASES

### PHASE 1: FOUNDATION (Weeks 1-4, 54-72 hours)

#### 1.1 Multi-Source Data Discovery Layer
**Objective**: Ingest raw companies from 6 data sources with full signal attribution

**Data Sources by Pipeline**:

**PIPELINE A** (Traditional Proprietor):
- Google Places API (10,000 free calls/month)
  - Query: "professional services" + "B2B services" + "retail" in NYC, Boston, London, Chicago metros
  - Daily target: 100-150 businesses
  - Firestore collection: `companies_raw_pipeline_a`
  
- OpenCorporates API (500 free calls/month)
  - Query: Companies incorporated in last 36 months, CA/NY/IL/MA/UK jurisdictions
  - Firestore collection: `companies_raw_opencorp`
  
- Secretary of State APIs (Free via state portals)
  - Query: New business filings in priority states (NY, IL, MA, CA)
  - Firestore collection: `companies_raw_sos`

**PIPELINE B** (Digital-First, Non-SaaS):
- Crunchbase API (Free tier)
  - Filters: `founded_on_gte` (last 36 months), `funding_total_usd_lte` ($2M), `num_funding_rounds_lte` (2), categories: ["marketing", "design", "ux", "branding", "services"]
  - Firestore collection: `companies_raw_crunchbase`
  
- Y Combinator GitHub (Free, open source)
  - All companies, filter post-processing for non-SaaS (design, marketing services focus)
  - Firestore collection: `companies_raw_yc`
  
- Product Hunt API (Scraping required)
  - Daily product launches, parse for non-SaaS focus
  - Firestore collection: `companies_raw_producthunt`

**Deliverable**:
- [ ] 6 Firebase Cloud Functions ingesting raw data daily
- [ ] Deduplication logic (same company across sources)
- [ ] Source priority rules (Crunchbase > OpenCorporates > Google Places for conflicts)
- [ ] Firestore schema: `companies_raw_{source}/{id}` with `source_id`, `source`, `raw_data`, `ingested_at`
- [ ] Cost tracking: Log all API calls to `/api_usage/{date}`
- [ ] Error handling: Retry logic for failed requests, dead-letter queue for problematic records

**Acceptance Criteria**:
- [ ] 100-150 Pipeline A companies/day from Google Places
- [ ] 50-100 Pipeline B companies/day from Crunchbase/YC/PH
- [ ] Zero duplicates across collections (dedup working)
- [ ] All API calls logged with costs
- [ ] <1% error rate on ingestion
- [ ] Cold function start time <3s, warm <500ms

**Estimated Effort**: 16-20 hours

---

#### 1.2 Signal Collection Engine (27-Point Enrichment)
**Objective**: Extract all 27 signals that determine founder control + PE exclusion

**Signals Collected** (organized by category):

**Funding History** (5 signals):
- [ ] `no_funding_recorded` (boolean) - Source: Crunchbase, OpenCorporates
- [ ] `seed_angel_only_under_500k` (boolean) - Source: Crunchbase
- [ ] `series_a_b_with_founder_control` (boolean) - Source: Crunchbase + LinkedIn (check board composition)
- [ ] `series_c_plus_or_late_stage` (boolean) - RED FLAG - Source: Crunchbase
- [ ] `pe_vc_investor_tags_present` (boolean) - HARD BLOCK - Source: Crunchbase investor field

**Corporate Structure** (3 signals):
- [ ] `single_founder_or_partner_flat_org` (boolean) - Source: LinkedIn, company website
- [ ] `parent_company_field_exists` (boolean) - RED FLAG - Source: OpenCorporates, company website
- [ ] `foreign_branch_status` (boolean) - RED FLAG - Source: OpenCorporates subsidiary field

**Digital Footprint** (4 signals):
- [ ] `product_hunt_launch_recent` (boolean) - Source: Product Hunt API scrape
- [ ] `y_combinator_badge_present` (boolean) - Source: YC GitHub data
- [ ] `founded_within_36_months` (boolean) - Source: Crunchbase, OpenCorporates incorporation date
- [ ] `non_dilutive_funding_mentioned` (boolean) - Keywords: "grant", "revenue-based", "SBIR", "RBF" - Source: Company website, Crunchbase

**Executive Profile** (3 signals):
- [ ] `founder_ceo_cto_still_active` (boolean) - Source: LinkedIn executive profiles, company website
- [ ] `cfo_hired_post_funding` (boolean) - RED FLAG - Source: LinkedIn hiring timeline
- [ ] `sales_vp_hired_year_one` (boolean) - RED FLAG - Source: LinkedIn, company blog

**Hiring Patterns** (3 signals):
- [ ] `employee_count_under_50_at_maturity` (boolean) - Source: LinkedIn headcount data
- [ ] `rapid_cfo_expansion_6mo` (boolean) - RED FLAG - Source: LinkedIn timeline changes
- [ ] `founder_led_sales_dominance` (boolean) - Source: Company website copy, LinkedIn CEO profile

**Revenue Signals** (3 signals):
- [ ] `revenue_based_financing_active` (boolean) - Source: Company website, Pipe/Clearco mentions
- [ ] `recurring_revenue_model` (boolean) - Source: Company website, business model description
- [ ] `organic_growth_over_50_percent` (boolean) - Source: Website analytics proxy (Similarweb public data if available)

**Website Language** (3 signals):
- [ ] `bootstrapped_in_description` (boolean) - Source: Company website "about" section, keywords: "bootstrapped", "self-funded"
- [ ] `founder_led_positioning` (boolean) - Source: Website copy, LinkedIn, keywords: "founder-led", "founder-owned"
- [ ] `portfolio_company_mention` (boolean) - HARD BLOCK - Source: Website copy, "portfolio company of [PE]"

**Investor Connections** (3 signals):
- [ ] `no_investors_listed_or_founder_only` (boolean) - Source: LinkedIn investors field, Crunchbase
- [ ] `list_includes_pe_vc_firms` (boolean) - RED FLAG - Source: Crunchbase investor field, LinkedIn
- [ ] `exclusively_angels_or_seed_limited` (boolean) - Source: Crunchbase investor field

**Deliverable**:
- [ ] Firebase Cloud Function: `enrichSignals(companyId)` → extracts all 27 signals
- [ ] Sub-functions for each data source:
  - `fetchLinkedInSignals(company)` - Scrape company page for exec profiles + investor field
  - `fetchCrunchbaseSignals(company)` - Query API for funding + investor type
  - `fetchWebsiteSignals(company)` - Parse website copy for language patterns
  - `fetchOpenCorporatesSignals(company)` - Query incorporation data
- [ ] Firestore collection: `signals/{companyId}` with timestamp + source attribution
- [ ] Confidence scoring per signal (0-1)
- [ ] Error handling: Partial signal collection OK (not all sources have data)

**Acceptance Criteria**:
- [ ] All 27 signals collected for 90%+ of companies
- [ ] Signal source properly attributed
- [ ] Confidence scores assigned
- [ ] Timestamps recorded
- [ ] LinkedIn scraping compliant (use official APIs where possible, public data only)
- [ ] <15 seconds per company to collect all signals

**Estimated Effort**: 12-16 hours

---

#### 1.3 PE Exclusion Filter Engine
**Objective**: Automatically exclude PE-backed companies + flag edge cases for manual review

**Hard Blocks** (Automatic Exclusion - Status = EXCLUDED_PE):
```javascript
const hardBlocks = [
  'pe_vc_investor_tags_present' === true,
  'series_c_plus_or_late_stage' === true,
  'parent_company_field_exists' === true,
  'foreign_branch_status' === true,
  'portfolio_company_mention' === true
];

if (hardBlocks.includes(true)) return { status: 'EXCLUDED_PE', reason: 'Hard Block' };
```

**Red Flags** (Accumulation Logic):
```javascript
const redFlags = [
  'cfo_hired_post_funding',
  'rapid_cfo_expansion_6mo',
  'sales_vp_hired_year_one',
  'list_includes_pe_vc_firms'
];

let redFlagCount = 0;
redFlags.forEach(flag => {
  if (signals[flag] === true) redFlagCount++;
});

// For Pipeline B: 3+ red flags → EXCLUDED_PE
// For Pipeline A: 2+ red flags → FLAGGED for manual review
```

**NEW: Structural Change Detection** (Added per feedback):
```javascript
const structuralRedFlags = [
  'incorporation_jurisdiction_change', // e.g., moved from personal corp to holding company
  'officer_ownership_change_post_funding', // e.g., founder went from 100% to <50%
  'esop_creation', // Employee Stock Ownership Plan = PE signal
  'holding_company_pattern' // Multiple levels of corporate nesting
];
```

**Manual Review Queue**:
- Edge cases: Series A/B with founder still CEO but 2+ red flags
- Structural changes with unclear origin
- Companies with conflicting signals (bootstrapped claim + PE investor listed)

**Deliverable**:
- [ ] Firebase Cloud Function: `filterPEBacked(companyId)` → returns { status: QUALIFIED | FLAGGED | EXCLUDED_PE, reason: string, confidence: 0-1 }
- [ ] Hard block detection (5 signals)
- [ ] Red flag accumulation logic (4 signals)
- [ ] Structural change detection (4 signals)
- [ ] Manual review queue: `/manual_review_queue/{id}` in Firestore
- [ ] Audit trail: `/pe_exclusion_log/{exclusionId}` with reason, signals, timestamp
- [ ] Edge case handling: Series A with founder CEO + 2 red flags → FLAGGED (not auto-excluded)

**Acceptance Criteria**:
- [ ] Hard block detection: 100% accuracy (test with 10 known PE companies)
- [ ] Red flag logic: 95%+ accuracy
- [ ] Structural changes: Detected correctly
- [ ] Manual review queue: Populated with edge cases
- [ ] False positive rate: <5% (willing to exclude some good leads to avoid PE)
- [ ] Audit log: Every exclusion reason documented

**Estimated Effort**: 10-14 hours

---

#### 1.4 Firestore Schema Design
**Objective**: Normalized schema supporting dual pipelines + signal tracking + custom outreach

**Master Collections**:

```firestore
/companies/{companyId}
  ├── metadata
  │   ├── createdAt: timestamp
  │   ├── updatedAt: timestamp
  │   ├── sources: array["google_places", "crunchbase", "yc", "producthunt", "opencorporates", "sos"]
  │   ├── source_priority: string (highest-fidelity source for master data)
  │   ├── dedup_merged_ids: array (IDs merged into this record)
  │   └── data_quality_score: number (0-1)
  │
  ├── pipeline_assignment
  │   ├── primary_pipeline: "A" | "B" | "AB"
  │   ├── pipeline_a_score: number (-1 to 1)
  │   ├── pipeline_a_status: "QUALIFIED" | "EXCLUDED_PE" | "LOW_SCORE" | "PENDING" | "FLAGGED"
  │   ├── pipeline_b_score: number (-1 to 1)
  │   ├── pipeline_b_status: "QUALIFIED" | "EXCLUDED_PE" | "LOW_SCORE" | "PENDING" | "FLAGGED"
  │   ├── pe_exclusion_reason: string (if excluded)
  │   ├── confidence_score: number (0-1, average of all signals)
  │   └── last_scored_at: timestamp
  │
  ├── company_data
  │   ├── name: string
  │   ├── website: string
  │   ├── phone: string
  │   ├── address: string (Pipeline A)
  │   ├── city: string
  │   ├── state_or_country: string
  │   ├── industry: string
  │   ├── description: string
  │   ├── employee_count: number
  │   └── estimated_annual_revenue: number
  │
  ├── signals (embedded object)
  │   ├── funding_history: { no_funding, seed_angel_only, series_ab, series_c_plus, pe_vc_tags }
  │   ├── corporate_structure: { founder_flat_org, parent_company, foreign_branch }
  │   ├── digital_footprint: { product_hunt, yc_badge, months_founded, non_dilutive }
  │   ├── executive_profile: { founder_active, cfo_hired, sales_vp_hired }
  │   ├── hiring: { employee_under_50, rapid_expansion, founder_sales }
  │   ├── revenue: { rbf_active, recurring_model, organic_growth }
  │   ├── website_language: { bootstrapped_mention, founder_led, portfolio_mention }
  │   └── investor_signals: { no_investors, pe_vc_present, angels_only }
  │
  ├── enrichment
  │   ├── decision_maker_name: string
  │   ├── decision_maker_email: string
  │   ├── decision_maker_linkedin: string
  │   ├── decision_maker_title: string
  │   ├── email_source: string (hunter_io | web_scrape | direct)
  │   ├── email_confidence: number (0-1)
  │   ├── email_verified: boolean
  │   ├── email_verified_at: timestamp
  │   ├── contact_priority: number (1-5, for outreach sequencing)
  │   ├── tech_stack: array (Pipeline B only)
  │   ├── business_type: string (Pipeline A only)
  │   └── enriched_at: timestamp
  │
  ├── outreach_tracking
  │   ├── status: "ready" | "outreach_pending" | "sent" | "opened" | "clicked" | "replied" | "qualified" | "archived"
  │   ├── last_outreach_date: timestamp
  │   ├── outreach_count: number
  │   ├── next_outreach_scheduled: timestamp
  │   ├── resend_message_id: string (from Resend API)
  │   ├── sendgrid_event_log: array (bounce, open, click events)
  │   ├── reply_content: string (if customer replied)
  │   ├── notes: string (manual notes)
  │   └── custom_fields: object (dynamic per campaign)
  │
  └── pe_exclusion_details (if excluded)
      ├── is_excluded: boolean
      ├── exclusion_type: string (HARD_BLOCK | FLAGGED | RED_FLAGS)
      ├── signals_triggering_exclusion: array
      ├── excluded_at: timestamp
      ├── manual_review_status: string (pending | reviewed | appealed)
      └── manual_review_notes: string

/api_usage/{date}
  ├── googlePlacesCallsUsed: number
  ├── opencorporatesCallsUsed: number
  ├── crunchbaseCallsUsed: number
  ├── hunterApiCalls: number (if used)
  ├── totalCost: number
  ├── date: timestamp
  └── daily_budget_remaining: number

/outreach_campaigns/{campaignId}
  ├── name: string
  ├── pipeline_target: "A" | "B" | "AB"
  ├── companies_included: array (companyIds)
  ├── template_email: string
  ├── created_at: timestamp
  ├── scheduled_start: timestamp
  ├── metrics
  │   ├── sent_count: number
  │   ├── open_count: number
  │   ├── click_count: number
  │   ├── reply_count: number
  │   ├── conversion_count: number
  │   └── open_rate: number
  └── status: "draft" | "scheduled" | "running" | "completed"

/manual_review_queue/{reviewId}
  ├── company_id: string
  ├── reason: string (edge case description)
  ├── signals: object (conflicting or unclear signals)
  ├── created_at: timestamp
  ├── reviewed_at: timestamp
  ├── reviewer_decision: string (QUALIFIED | EXCLUDED | NEEDS_MORE_DATA)
  ├── reviewer_notes: string
  └── decision_applied: boolean

/pe_exclusion_log/{exclusionId}
  ├── company_id: string
  ├── exclusion_type: string
  ├── signals_triggered: array
  ├── confidence: number
  ├── excluded_at: timestamp
  ├── reason_summary: string
  └── appeal_status: "none" | "pending" | "approved"
```

**Deliverable**:
- [ ] Firestore schema designed for both pipelines
- [ ] Indexes created for common queries (status, pipeline, created_at, email_verified)
- [ ] Security rules configured (read/write access)
- [ ] Archival strategy: Companies moved to archive after 90 days inactivity
- [ ] Backup automation: Daily snapshots to Firebase Cloud Storage

**Acceptance Criteria**:
- [ ] Schema supports all 27 signals
- [ ] Queries <100ms average (index properly)
- [ ] Dual pipeline routing clear
- [ ] Outreach tracking captured
- [ ] PE exclusion auditable
- [ ] Manual review queue functional

**Estimated Effort**: 8-12 hours

---

### PHASE 2: ENRICHMENT & AUTOMATION (Weeks 5-8, 54-72 hours)

#### 2.1 Dual-Pipeline Scoring Engine
**Objective**: Score companies independently for Pipeline A and B with different thresholds

**Pipeline A Scoring** (Traditional Proprietor):
```javascript
async function scorePipelineA(signals) {
  let score = 0;
  let signalCategoryCount = 0;
  
  // Weighted signal summation
  const weights = {
    no_funding_recorded: 0.80,
    seed_angel_only: 0.90,
    series_ab_founder_control: 0.70,
    series_c_plus: -0.80, // HARD BLOCK
    pe_vc_investor_tags: -0.95, // HARD BLOCK
    founder_flat_org: 0.85,
    parent_company_exists: -0.90, // HARD BLOCK
    foreign_branch_status: -0.85, // HARD BLOCK
    product_hunt_launch: 0.60,
    yc_badge: 0.70,
    founded_36mo: 0.80,
    non_dilutive_funding: 0.90,
    founder_still_active: 0.75,
    cfo_hired_post_funding: -0.70,
    sales_vp_hired_year_one: -0.80,
    slow_hiring_under_50: 0.60,
    rapid_expansion: -0.75,
    founder_led_sales: 0.80,
    revenue_based_financing: 0.70,
    recurring_revenue: 0.75,
    organic_growth_50_plus: 0.80,
    bootstrapped_mention: 0.90,
    founder_led_positioning: 0.85,
    portfolio_company_mention: -0.95, // HARD BLOCK
    no_investors_listed: 0.80,
    pe_vc_firms_present: -0.80,
    angels_only_exclusive: -0.70
  };
  
  // Check hard blocks first
  if (
    signals.pe_vc_investor_tags ||
    signals.series_c_plus ||
    signals.parent_company_exists ||
    signals.foreign_branch_status ||
    signals.portfolio_company_mention
  ) {
    return { score: -1, status: 'EXCLUDED_PE', reason: 'Hard block detected' };
  }
  
  // Sum weighted signals
  Object.keys(signals).forEach(key => {
    if (weights[key] !== undefined && signals[key] === true) {
      score += weights[key];
      if (weights[key] > 0) signalCategoryCount++;
    }
  });
  
  // Dual criteria: Score > 0.65 AND 3+ positive signals from different categories
  const passesScore = score > 0.65;
  const passesSignalCount = signalCategoryCount >= 3;
  
  if (passesScore && passesSignalCount) {
    return { 
      score: score, 
      status: 'QUALIFIED_PIPELINE_A',
      confidence: (signalCategoryCount / 7) // 7 categories
    };
  }
  
  if (signalCategoryCount >= 2 && score > 0.45) {
    return { 
      score: score, 
      status: 'FLAGGED',
      reason: 'Low signal count or marginal score, recommend manual review'
    };
  }
  
  return { score: score, status: 'REJECTED_LOW_SCORE' };
}
```

**Pipeline B Scoring** (Digital-First, Non-SaaS):
```javascript
async function scorePipelineB(signals) {
  let score = 0;
  let signalCategoryCount = 0;
  
  // Different weights for B pipeline (stricter PE filtering, rewards digital-native signals)
  const weights = {
    no_funding_recorded: 0.70,
    seed_angel_only_under_500k: 0.75, // Strict scrutiny for seed in B
    series_ab_founder_control: 0.50, // Lower weight (more scrutiny needed)
    series_c_plus: -0.90, // Stricter for B
    pe_vc_investor_tags: -0.95, // HARD BLOCK
    founder_flat_org: 0.75,
    parent_company_exists: -0.95, // Stricter for B
    foreign_branch_status: -0.90, // Stricter for B
    product_hunt_launch: 0.95, // High weight for digital-first
    yc_badge: 0.90, // High weight for digital-first
    founded_36mo: 0.90, // Reward recent founding
    non_dilutive_funding: 0.85,
    founder_still_active: 0.85, // Critical for B
    cfo_hired_post_funding: -0.80, // Stricter for B
    sales_vp_hired_year_one: -0.85, // Stricter for B
    slow_hiring_under_50: 0.50,
    rapid_expansion: -0.90, // Stricter for B (PE signal)
    founder_led_sales: 0.80,
    revenue_based_financing: 0.80,
    recurring_revenue: 0.85,
    organic_growth_50_plus: 0.75,
    bootstrapped_mention: 0.90,
    founder_led_positioning: 0.95, // High weight for B
    portfolio_company_mention: -0.99, // HARD BLOCK
    no_investors_listed: 0.80,
    pe_vc_firms_present: -0.90, // Stricter for B
    angels_only_exclusive: -0.80
  };
  
  // Check hard blocks (stricter for B)
  if (
    signals.pe_vc_investor_tags ||
    signals.parent_company_exists ||
    signals.foreign_branch_status ||
    signals.portfolio_company_mention ||
    signals.series_c_plus ||
    (signals.series_ab_founder_control && !signals.founder_still_active)
  ) {
    return { score: -1, status: 'EXCLUDED_PE', reason: 'Hard block for B pipeline' };
  }
  
  // Sum weighted signals
  Object.keys(signals).forEach(key => {
    if (weights[key] !== undefined && signals[key] === true) {
      score += weights[key];
      if (weights[key] > 0) signalCategoryCount++;
    }
  });
  
  // Dual criteria: Score > 0.60 AND 4+ positive signals from different categories (stricter than A)
  const passesScore = score > 0.60;
  const passesSignalCount = signalCategoryCount >= 4; // 4, not 3
  
  if (passesScore && passesSignalCount) {
    return { 
      score: score, 
      status: 'QUALIFIED_PIPELINE_B',
      confidence: (signalCategoryCount / 7)
    };
  }
  
  if (signalCategoryCount >= 3 && score > 0.50) {
    return { 
      score: score, 
      status: 'FLAGGED',
      reason: 'Marginal score for B pipeline, recommend manual review'
    };
  }
  
  return { score: score, status: 'REJECTED_LOW_SCORE' };
}
```

**Deliverable**:
- [ ] Firebase Cloud Function: `scoreCompany(companyId)` 
- [ ] Calls both `scorePipelineA()` and `scorePipelineB()`
- [ ] Returns: { pipeline_a_score, pipeline_a_status, pipeline_b_score, pipeline_b_status, primary_pipeline, confidence }
- [ ] Updates Firestore: `/companies/{id}/pipeline_assignment`
- [ ] Handles edge cases: Company qualifies for both A and B → assign based on higher score
- [ ] Supports manual override: Flag for review if conflicting signals

**Acceptance Criteria**:
- [ ] Pipeline A scoring: >0.65, 3+ signals → QUALIFIED
- [ ] Pipeline B scoring: >0.60, 4+ signals → QUALIFIED
- [ ] Hard blocks: 100% accuracy
- [ ] Test cases: 10 known bootstrapped companies → all QUALIFIED
- [ ] Test cases: 10 known PE companies → all EXCLUDED
- [ ] Flagging logic: Captures edge cases for manual review
- [ ] Scoring time: <5 seconds per company

**Estimated Effort**: 12-16 hours

---

#### 2.2 n8n Self-Hosted Deployment
**Deliverable**:
- [ ] n8n Docker deployment on Hetzner CX22 ($4.43/month)
- [ ] PostgreSQL for workflow persistence
- [ ] Nginx reverse proxy + SSL (Let's Encrypt)
- [ ] Daily automated backups to Firebase Cloud Storage
- [ ] Webhook endpoint for Cloud Function triggers

**Acceptance Criteria**:
- [ ] n8n accessible via secure domain
- [ ] Workflows persist across restarts
- [ ] SSL certificate auto-renews
- [ ] Backup tested and restorable

**Estimated Effort**: 8-12 hours

---

#### 2.3 n8n Workflow: Pipeline A Daily Discovery
**Trigger**: 2:00 AM daily

**Steps**:
1. Batch Google Places searches (3 US metros + London): 50-100 queries
2. Store raw results → `companies_raw_pipeline_a`
3. Check OpenCorporates for incorporation data
4. Check SOS APIs (NY, IL, MA filings)
5. Deduplication check
6. Log to `/api_usage/{date}`
7. Slack notification: "X companies discovered for Pipeline A"

**Output**: 100-150 new Pipeline A companies/day

**Acceptance Criteria**:
- [ ] Daily execution without manual intervention
- [ ] Google Places queries stay under 333/day (10K/month limit)
- [ ] Deduplication working
- [ ] API usage logged
- [ ] Error rate <1%

**Estimated Effort**: 8-10 hours

---

#### 2.4 n8n Workflow: Pipeline B Daily Discovery
**Trigger**: 3:00 AM daily (after Pipeline A completes)

**Steps**:
1. Query Crunchbase API: companies founded in last 36mo, funding <$2M, non-SaaS categories
2. Refresh Y Combinator data (non-SaaS companies)
3. Scrape Product Hunt daily launches (parse for non-SaaS focus)
4. Store raw results → `companies_raw_pipeline_b`
5. Deduplication check
6. Log to `/api_usage/{date}`
7. Slack notification: "X companies discovered for Pipeline B"

**Output**: 50-100 new Pipeline B companies/day

**Acceptance Criteria**:
- [ ] Crunchbase query filtering correctly
- [ ] YC data refreshed daily
- [ ] Product Hunt scraping working
- [ ] Deduplication cross-pipeline-aware
- [ ] API usage logged

**Estimated Effort**: 8-10 hours

---

#### 2.5 n8n Workflow: Signal Collection + PE Filtering
**Trigger**: 4:00 AM daily (after discovery)

**Steps**:
1. Fetch all companies from `companies_raw_pipeline_a` and `companies_raw_pipeline_b` (past 24 hours)
2. For each company:
   - Call Cloud Function: `enrichSignals(companyId)`
   - Collect all 27 signals
   - Call Cloud Function: `filterPEBacked(companyId)`
   - Update Firestore: `/companies/{id}/signals`
   - Update Firestore: `/companies/{id}/pe_exclusion_details`
3. Create `/pe_exclusion_log/{id}` entries for excluded companies
4. Populate `/manual_review_queue/{id}` for FLAGGED companies
5. Slack notification: "X companies processed, Y excluded for PE backing, Z flagged for review"

**Output**: All companies have signals collected + PE filter applied

**Acceptance Criteria**:
- [ ] 90%+ of companies get all signals
- [ ] Hard block detection: 100% accuracy
- [ ] Exclusion reasons logged
- [ ] Manual review queue populated
- [ ] Processing time <30 seconds per 50 companies

**Estimated Effort**: 10-14 hours

---

#### 2.6 n8n Workflow: Dual Scoring + Pipeline Assignment
**Trigger**: 5:00 AM daily (after signal collection)

**Steps**:
1. Fetch all companies with status = "signals_collected" 
2. For each company:
   - Call Cloud Function: `scoreCompany(companyId)`
   - Get: pipeline_a_score, pipeline_b_score, primary_pipeline
   - Update Firestore: `/companies/{id}/pipeline_assignment`
3. Filter results by status:
   - QUALIFIED_PIPELINE_A → tag for enrichment flow A
   - QUALIFIED_PIPELINE_B → tag for enrichment flow B
   - QUALIFIED_BOTH → assign to primary, tag secondary
   - FLAGGED → send to manual review queue
   - REJECTED_LOW_SCORE → archive
4. Slack notification: "X qualified for A, Y qualified for B, Z flagged, W rejected"

**Output**: Companies have assigned pipelines, ready for enrichment

**Acceptance Criteria**:
- [ ] Scoring logic correctly applied
- [ ] Dual-qualified companies assigned to primary
- [ ] Flagged companies queued for manual review
- [ ] Rejected companies archived

**Estimated Effort**: 6-8 hours

---

#### 2.7 Email Enrichment (Free Tiers)
**Trigger**: 6:00 AM daily (after pipeline assignment)

**Steps**:
1. Query Firestore: qualified companies without email (status = "needs_enrichment")
2. Batch up to 25 Pipeline A + 25 Pipeline B companies/day (stay under API limits)
3. For each company:
   - Try Hunter.io API (free: 50 credits/month total)
   - Fallback: Web scrape company website for contact email patterns (Cheerio)
   - Fallback: LinkedIn company page scrape for generic contact email
4. Store result: `/companies/{id}/enrichment`
   - email: string
   - decision_maker_name: string (if found)
   - decision_maker_title: string
   - email_source: "hunter_io" | "web_scrape" | "linkedin"
   - email_confidence: 0-1
5. Mark for verification: status = "email_found_needs_verification"
6. Log API usage: `/api_usage/{date}`

**Output**: 40-50 companies/day with email addresses

**Acceptance Criteria**:
- [ ] Email find rate: 40%+ of qualified companies
- [ ] Hunter.io credits tracked (max 50/month)
- [ ] Web scraping fallback working
- [ ] Email source attributed
- [ ] Confidence scores assigned

**Estimated Effort**: 8-10 hours

---

### PHASE 3: OUTREACH INFRASTRUCTURE & AUTOMATION (Weeks 9-12, 48-60 hours)

#### 3.1 React Dashboard: Dual-Pipeline Metrics & Lead Management
**Objective**: Real-time visibility into both pipelines + manual lead review

**Dashboard Sections**:

**1. Overview Dashboard**:
- [ ] Pipeline A: X discovered | Y qualified | Z enriched | W with emails
- [ ] Pipeline B: X discovered | Y qualified | Z enriched | W with emails
- [ ] PE Exclusions: X excluded (X% of total)
- [ ] Manual Review Queue: X companies awaiting decision
- [ ] Cost tracking: $X of $25 budget used
- [ ] Trend chart: 7-day rolling average of qualified companies

**2. Pipeline A Metrics**:
- [ ] Discovery rate: X/day
- [ ] Qualification rate: X%
- [ ] Email find rate: X%
- [ ] Top business types (bar chart)
- [ ] Geographic distribution (pie chart: NYC, Boston, Chicago, London)
- [ ] Recent discoveries list (sortable)

**3. Pipeline B Metrics**:
- [ ] Discovery rate: X/day
- [ ] Qualification rate: X%
- [ ] Email find rate: X%
- [ ] Funding stage breakdown (pie chart)
- [ ] Industry distribution
- [ ] Company age distribution
- [ ] Recent discoveries list

**4. PE Exclusion Dashboard**:
- [ ] Exclusion rate: X%
- [ ] Breakdown by reason:
  - PE/VC investor tags: X
  - Series C+: X
  - Parent company: X
  - Other: X
- [ ] Manual review queue: X companies awaiting decision

**5. Lead Review Interface** (for manual QA):
- [ ] List view: 50 companies per page, sortable/filterable
- [ ] Columns: Name, Score (A & B), Status, Email, Actions
- [ ] Detail view: Full 27 signals, scoring breakdown, enrichment data
- [ ] Actions: Approve (move to outreach), Flag (needs review), Reject (archive)
- [ ] Bulk actions: Approve 50+ at once
- [ ] Search: By company name, email, city, industry

**6. Outreach Campaign Manager**:
- [ ] Create campaigns (target Pipeline A or B)
- [ ] Email template editor
- [ ] Schedule delivery
- [ ] Track: Sent, Open, Click, Reply metrics
- [ ] Resend API integration for sending
- [ ] SendGrid integration for deliverability tracking

**Deliverable**:
- [ ] React components for all 6 sections
- [ ] Real-time Firestore listeners
- [ ] Responsive design (mobile + desktop)
- [ ] Charts (Recharts)
- [ ] Performance: Page load <2 seconds

**Acceptance Criteria**:
- [ ] All metrics real-time updated
- [ ] Manual review UI smooth and intuitive
- [ ] Bulk operations working
- [ ] Campaign manager functional
- [ ] Mobile responsive

**Estimated Effort**: 24-30 hours

---

#### 3.2 Resend + SendGrid Integration
**Objective**: Send outreach emails, track deliverability & engagement

**Firebase Cloud Functions**:

```javascript
// Function 1: Send email via Resend
async function sendOutreachEmail(companyId, campaignId, emailTemplate) {
  const company = await getCompanyData(companyId);
  
  const emailContent = populateTemplate(emailTemplate, {
    company_name: company.name,
    decision_maker: company.enrichment.decision_maker_name,
    personalization: generatePersonalization(company)
  });
  
  const resendResponse = await resendClient.emails.send({
    from: "outreach@yourdomain.com",
    to: company.enrichment.decision_maker_email,
    subject: emailTemplate.subject,
    html: emailContent,
    headers: {
      'X-Campaign-ID': campaignId,
      'X-Company-ID': companyId,
      'X-Pipeline': company.pipeline_assignment.primary_pipeline
    }
  });
  
  // Store in Firestore
  await updateCompanyOutreach(companyId, {
    status: 'sent',
    resend_message_id: resendResponse.id,
    sent_at: new Date(),
    sent_via_campaign: campaignId
  });
  
  // SendGrid will track opens/clicks via webhook
  return resendResponse;
}

// Function 2: Webhook handler for SendGrid events
async function handleSendgridWebhook(events) {
  for (const event of events) {
    const companyId = event.headers['X-Company-ID'];
    const company = await db.collection('companies').doc(companyId).get();
    
    switch (event.event) {
      case 'open':
        await updateCompanyOutreach(companyId, { status: 'opened', opened_at: new Date() });
        break;
      case 'click':
        await updateCompanyOutreach(companyId, { status: 'clicked', clicked_at: new Date() });
        break;
      case 'bounce':
        await updateCompanyOutreach(companyId, { status: 'bounced', bounce_reason: event.reason });
        break;
      case 'unsubscribe':
        await updateCompanyOutreach(companyId, { status: 'unsubscribed' });
        break;
      case 'spamreport':
        await updateCompanyOutreach(companyId, { status: 'spam_reported' });
        break;
    }
    
    // Log to SendGrid event log
    await logSendgridEvent(companyId, event);
  }
}

// Function 3: Generate personalized email
function generatePersonalization(company) {
  const intro = company.pipeline_assignment.primary_pipeline === 'A' 
    ? `As a fellow ${company.industry} business owner in ${company.city}...`
    : `I noticed ${company.name} is building in the ${company.industry} space...`;
  
  return { intro };
}
```

**Deliverable**:
- [ ] Firebase Cloud Function: `sendOutreachEmail(companyId, campaignId, template)`
- [ ] Resend API integration (send emails)
- [ ] SendGrid webhook handler (track opens, clicks, bounces)
- [ ] Firestore outreach tracking: `/companies/{id}/outreach_tracking`
- [ ] Campaign metrics aggregation: `/outreach_campaigns/{campaignId}/metrics`

**Acceptance Criteria**:
- [ ] Emails send successfully via Resend
- [ ] SendGrid events tracked (open, click, bounce)
- [ ] Email status updated in Firestore
- [ ] Campaign metrics aggregated
- [ ] Webhook authentication verified

**Estimated Effort**: 12-16 hours

---

#### 3.3 Outreach Workflow: Manual Review + Campaign Setup
**Objective**: Queue companies for outreach, manage campaign sending

**Manual Review Process**:
1. User reviews qualified companies via React dashboard
2. Approves companies → Move to outreach_ready status
3. System creates email from template with personalization
4. User can preview before sending
5. Schedule delivery time or send immediately

**Campaign Setup**:
1. Create campaign: "Pipeline A - Professional Services - Dec 2025"
2. Select target: 200 companies from Pipeline A
3. Choose email template
4. Schedule start time + send frequency (staggered or batch)
5. Track metrics in real-time

**Deliverable**:
- [ ] React UI for campaign creation
- [ ] Email template preview + personalization test
- [ ] Schedule/batch send options
- [ ] Campaign metrics dashboard
- [ ] Pause/resume campaigns

**Acceptance Criteria**:
- [ ] Campaigns create successfully
- [ ] Send scheduling working
- [ ] Metrics tracked in real-time
- [ ] User can pause mid-campaign

**Estimated Effort**: 12-16 hours

---

### PHASE 4: MONITORING, COST TRACKING & OPTIMIZATION (Weeks 13-16, 26-36 hours)

#### 4.1 Cost Tracking & Budget Dashboard
**Objective**: Real-time monitoring of API costs, stay under $25/month

**Tracked Metrics**:
- Google Places API: X calls × $0.005 after 10K free = $X
- Crunchbase: Free tier (no cost)
- OpenCorporates: 500 free calls (no cost)
- Hunter.io: 50 free emails (no cost)
- Hetzner VPS: $4.43/month
- Resend: $0 (50 emails free/day, scale-as-you-grow)
- SendGrid: $0 (up to 100 emails/day free)
- **Total**: $4-10/month

**Dashboard**:
- [ ] Daily API call tracking
- [ ] Estimated daily cost
- [ ] Remaining budget for month
- [ ] Cost per lead by pipeline
- [ ] Alerts: If daily spend >$1, alert user
- [ ] Historical trend: Costs over past 3 months

**Deliverable**:
- [ ] Firestore: `/api_usage/{date}` collection with daily aggregates
- [ ] React component: Cost tracking dashboard
- [ ] Firebase Cloud Function: Daily cost calculation + alert logic
- [ ] Slack integration: Daily cost alert at 7am

**Acceptance Criteria**:
- [ ] Cost tracking accurate within 5%
- [ ] Alerts trigger correctly
- [ ] Dashboard updates real-time
- [ ] Historical data retained

**Estimated Effort**: 6-8 hours

---

#### 4.2 PE Exclusion Audit & Reporting
**Objective**: Monitor filter effectiveness, ensure 97%+ founder control

**Metrics**:
- [ ] Total companies discovered: X/month
- [ ] Excluded for PE backing: Y (Y% of total)
- [ ] Breakdown by exclusion reason
- [ ] Manual review queue: X companies
- [ ] Manual review resolution rate: X%
- [ ] False positive rate: X% (excluded but should have qualified)
- [ ] False negative rate: X% (qualified but is PE-backed)

**Monthly Report**:
- [ ] Executive summary: "X companies qualified, Y excluded for PE"
- [ ] Exclusion breakdown chart
- [ ] Confidence in filter: 97%+
- [ ] Edge cases encountered
- [ ] Filter refinements recommended

**Deliverable**:
- [ ] Firestore: `/pe_exclusion_log/{id}` with audit details
- [ ] React component: PE exclusion audit dashboard
- [ ] Firebase Cloud Function: Monthly report generation
- [ ] CSV export: Full audit trail

**Acceptance Criteria**:
- [ ] Audit trail complete and auditable
- [ ] Monthly report generated automatically
- [ ] False positive rate tracked
- [ ] Dashboard shows effectiveness

**Estimated Effort**: 6-8 hours

---

#### 4.3 Performance Optimization
**Objective**: Ensure all workflows run efficiently within cost/latency budgets

**Benchmarks**:
- [ ] Google Places discovery: <15 seconds per 50 queries
- [ ] Signal collection: <30 seconds per 50 companies
- [ ] Scoring: <10 seconds per 100 companies
- [ ] Firestore queries: <100ms average
- [ ] React dashboard load: <2 seconds
- [ ] n8n VPS CPU: <30% baseline, <70% under peak load

**Optimization Tasks**:
- [ ] Index Firestore queries (created_at, status, pipeline, email_verified)
- [ ] Batch operations where possible (reduce Cloud Function calls)
- [ ] Cache signals for 24 hours (don't re-collect daily)
- [ ] Archive old companies (>90 days inactive) to separate collection
- [ ] Compress Firestore documents (remove null fields)

**Deliverable**:
- [ ] Performance monitoring dashboard
- [ ] Firestore index optimization
- [ ] Cloud Function performance profiling
- [ ] Caching strategy implementation
- [ ] Archival automation

**Acceptance Criteria**:
- [ ] All benchmarks met
- [ ] n8n VPS cost stable ($4.43/month)
- [ ] No performance degradation over time

**Estimated Effort**: 8-12 hours

---

#### 4.4 Documentation & Runbooks
**Deliverable**:
- [ ] Architecture overview diagram (data flows, pipelines)
- [ ] Firestore schema documentation
- [ ] Scoring model documentation (27 signals, weights, thresholds)
- [ ] PE filtering logic documented (hard blocks, red flags, edge cases)
- [ ] n8n workflow diagrams
- [ ] Troubleshooting guide
- [ ] API management guide (rate limits, keys, costs)
- [ ] Manual review procedures
- [ ] Campaign setup guide

**Estimated Effort**: 8-10 hours

---

## IMPLEMENTATION TOTALS

| Phase | Hours | Timeline |
|-------|-------|----------|
| Phase 1: Foundation | 54-72 | Weeks 1-4 |
| Phase 2: Enrichment & Automation | 54-72 | Weeks 5-8 |
| Phase 3: Outreach Infrastructure | 48-60 | Weeks 9-12 |
| Phase 4: Monitoring & Optimization | 26-36 | Weeks 13-16 |
| **TOTAL** | **182-240** | **16 weeks** |

**Equivalent full-time**: 4.5-6 weeks of continuous development

---

## FINAL COST BREAKDOWN

| Component | Cost | Notes |
|-----------|------|-------|
| Hetzner CX22 VPS | $4.43/mo | n8n hosting |
| Google Places API | $0-2/mo | 10K free/mo, $0.005 per 1K after |
| Crunchbase | $0 | Free tier unlimited |
| OpenCorporates | $0 | 500 free calls/month |
| Hunter.io | $0 | 50 free emails/month |
| Resend | $0-10/mo | 50 free/day, $0.10 each after (scale as needed) |
| SendGrid | $0 | 100 emails/day free, scale as you grow |
| Firebase | $0 | Free tier covers expected usage |
| **TOTAL** | **$4-10/month** | ✅ **15x under budget** |

---

## DUAL-PIPELINE ICP SUMMARY

### Pipeline A: Professional Services Proprietor
- **Location**: NYC, Boston, Chicago, London metros
- **Business Type**: Professional Services (accountants, lawyers, consultants) | B2B Services (agencies, design firms) | Retail/Brands (owner-operated)
- **Revenue**: $200K-$2M ARR minimum
- **Employees**: 1-20
- **Funding**: Self-funded, bank loans, or <$500K angel
- **Decision Maker**: Owner/Manager (founder-equivalent, no board oversight)
- **Tech Adoption**: Basic website, Google My Business, possibly email marketing
- **Sales Cycle**: 30-90 days
- **Conversion Target**: 5% (100-175 leads × 5% = 5-8 opportunities/month)

### Pipeline B: Digital-First, Non-SaaS Founder
- **Location**: Any (internet-first business)
- **Business Type**: Marketing Ops | UX/Brand/Design Services | Digital-native services (NOT SaaS)
- **Revenue**: $0-$5M ARR
- **Employees**: 1-15
- **Funding**: Bootstrapped ONLY or non-dilutive (grants, RBF, SBIR)
  - Strict scrutiny if Seed/Angel (<$500K)
  - Hard block if PE/VC tags or Series B+
- **Founder Tenure**: Founded in last 36 months
- **Decision Maker**: Founder/CTO (technical, 100% authority)
- **Tech Stack**: Modern (API-first, SaaS-native)
- **Sales Cycle**: 7-30 days
- **Conversion Target**: 5% (500-1000 leads × 5% = 25-50 opportunities/month)

---

## KEY SUCCESS CRITERIA

- [ ] 1,500-3,500 leads/month across both pipelines (daily steady flow)
- [ ] PE exclusion rate: 97%+ founder-controlled, zero external equity
- [ ] Email enrichment: 40%+ of qualified companies
- [ ] Cost: <$10/month (18x under $25 budget)
- [ ] Manual review rate: <5% (high confidence)
- [ ] PE exclusion accuracy: >95%
- [ ] 99% uptime (n8n + Cloud Functions)
- [ ] 5% conversion goal: 75-175 monthly opportunities

---

## NEXT STEPS

1. **Week 1**: Confirm this spec with user
2. **Week 2**: User provides HubSpot workflows → I refactor for Resend/SendGrid outreach
3. **Week 3**: Begin implementation in Claude Code
4. **Week 16**: System live and generating 1,500-3,500 leads/month

**Go/No-Go Decision Points**:
- After Phase 1: Confirm data quality and scoring accuracy
- After Phase 2: Confirm PE filtering is working correctly
- After Phase 3: Pilot campaign with first 50 companies
- After Phase 4: Full production launch

---

## CRITICAL IMPLEMENTATION NOTES

1. **LinkedIn Scraping**: Use official APIs where possible (LinkedIn API for company pages). Public data only—no Terms of Service violations.

2. **API Rate Limiting**: Build in exponential backoff for all external APIs. Cache results aggressively.

3. **Firestore Cost**: At expected volume (5,000 companies/month), Firestore free tier will be exceeded. Budget ~$5-10/month for Firestore if scaling beyond Phase 1.

4. **Email Deliverability**: Use SendGrid webhooks to track bounces. Implement feedback loops to clean list automatically.

5. **GDPR Compliance**: If targeting UK/EU businesses, ensure GDPR-compliant data collection and outreach practices.

6. **Manual Fallbacks**: If any API goes down, build manual fallback processes (e.g., if Crunchbase API unavailable, use cached data from previous day).

---

**Status**: Ready for Claude Code implementation
**Owner**: Marketing Operations / Solo Founder
**Cost Target**: <$25/month (Actual: $4-10/month)
**Volume Target**: 1,500-3,500 leads/month with 5% conversion = 75-175 monthly opportunities