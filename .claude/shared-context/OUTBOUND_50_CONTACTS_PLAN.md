# Outbound Motion: 50 Contacts Plan
**Created:** December 18, 2025
**Goal:** Seed 50 contacts across dual pipelines for initial outbound campaign

---

## Pipeline Strategy

### Pipeline A: Traditional Businesses (25 contacts)
**Source:** Google Places API (configured ✅)
**Target:** Professional services firms in target metros

| Type | Count | Search Terms |
|------|-------|--------------|
| Accounting Firms | 8 | "CPA firm", "accounting" |
| Marketing Agencies | 8 | "marketing agency", "digital marketing" |
| Consulting Firms | 5 | "business consulting", "management consulting" |
| Legal Services | 4 | "law firm", "legal services" |

**Locations:** San Francisco, Austin, Denver, Chicago

### Pipeline B: Digital-First Businesses (25 contacts)
**Source:** YC GitHub + Growjo (no API key needed)
**Target:** Non-SaaS tech companies, agencies with digital presence

| Type | Count | Criteria |
|------|-------|----------|
| YC Companies (non-SaaS) | 10 | Services, marketplaces, agencies |
| High-Growth SMBs | 10 | Growjo data, 20-100 employees |
| Digital Agencies | 5 | Design, dev, content agencies |

---

## Execution Steps

### Step 1: Run Pipeline A Discovery
```bash
# Via Contact Dashboard UI (logged in as admin)
# OR via curl with Firebase ID token:

curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/discoverPipelineA" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "location": "San Francisco, CA",
    "types": ["accounting", "marketing_agency", "consulting"],
    "maxResults": 25,
    "dryRun": false
  }'
```

### Step 2: Run Pipeline B Discovery
```bash
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/discoverPipelineB" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "sources": ["yc_github", "growjo"],
    "maxResults": 25,
    "dryRun": false
  }'
```

### Step 3: Enrich with Cascade
```bash
# Enriches each contact via PDL → Hunter → Apollo
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/cascadeEnrich" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{"email": "contact@company.com", "updateContact": true}'
```

### Step 4: Score & Filter PE-Backed
- `collectSignals` - Gather 27 PE signals
- `filterPEBacked` - Exclude PE-backed companies
- `scorePipelines` - Assign pipeline scores

### Step 5: Enroll in Welcome Journey
- Use existing `seedWelcomeJourney` or create contacts manually
- Enroll qualified contacts in UnityMAP journey

---

## Alternative: Apollo.io Search (Faster)

If discovery pipelines are slow, use Apollo.io directly:

```bash
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/searchProspects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "titles": ["CEO", "Founder", "Owner", "Managing Partner"],
    "industries": ["Accounting", "Marketing and Advertising", "Management Consulting"],
    "employeeCount": "11,50",
    "seniorities": ["owner", "founder", "c_suite"],
    "limit": 50,
    "importToFirestore": true
  }'
```

**Cost:** ~50 of 130 Apollo credits/month

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Total Contacts | 50 |
| Pipeline A | 25 (traditional) |
| Pipeline B | 25 (digital-first) |
| Enriched | 80%+ with email + company |
| PE Excluded | 0 (filtered out) |
| Journey Enrolled | 50 |

---

## Timeline

| Day | Action |
|-----|--------|
| Day 1 | Run discovery pipelines |
| Day 1 | Enrich contacts (cascade) |
| Day 2 | Review PE filtering results |
| Day 2 | Enroll in welcome journey |
| Day 3 | Launch first email sequence |

---

## Functions Available

| Function | Purpose | Status |
|----------|---------|--------|
| `discoverPipelineA` | Google Places discovery | ✅ Ready |
| `discoverPipelineB` | YC + Growjo discovery | ✅ Ready |
| `searchProspects` | Apollo.io search | ✅ Ready |
| `cascadeEnrich` | PDL → Hunter → Apollo | ✅ Ready |
| `collectSignals` | 27 PE signals | ✅ Ready |
| `filterPEBacked` | PE exclusion | ✅ Ready |
| `scorePipelines` | Pipeline scoring | ✅ Ready |
| `bulkImportContacts` | Manual import | ✅ Ready |
| `seedWelcomeJourney` | Create journey | ✅ Ready |

---

## Notes

- All functions support Firebase Auth SSO (login via admin dashboard)
- Legacy x-admin-token also works for scripts
- PE filtering removes companies with:
  - Hard blocks: PE/VC investor tags, portfolio company mentions
  - Red flags: Series C+, parent company, rapid expansion
