# Prospect Sourcing Capacity Analysis

**Created:** December 16, 2025
**Goal:** 10-50 cold prospects/day AND/OR 0.1% conversion → 3-10 clients/month
**Status:** Analysis Complete

---

## Executive Summary

### Current Capacity Assessment

| Channel | Daily Volume | Monthly Volume | Cost |
|---------|--------------|----------------|------|
| **Inbound (Organic)** | 0-2 | 0-30 | $0 |
| **Enrichment (PDL)** | ~3/day | 100/month | Free |
| **Enrichment (Hunter)** | ~0.8/day | 25/month | Free |
| **Bulk Import** | 100/request | Unlimited* | Manual |
| **TOTAL FREE TIER** | ~5-6/day | ~155/month | $0 |

**Verdict:** Current free tier infrastructure supports ~5-6 enriched prospects/day. To reach 10-50/day goal requires either:
1. Paid enrichment tiers, OR
2. Manual prospect list building + bulk import

---

## Current Infrastructure Components

### 1. Lead Capture Points (Inbound)

| Capture Point | Status | Triggers |
|---------------|--------|----------|
| **Contact Form** | Active | Journey enrollment, Slack notification |
| **Assessment** | Active | Results email, Journey enrollment |
| **LeadGate** | Active | Tool access, Journey enrollment |
| **Footer Subscribe** | Active | Journey enrollment |
| **SSO Login** | Active | Journey enrollment |

**Firestore Collections:**
- `contacts` - All leads with enrichment data
- `leads` - Raw lead captures
- `journeys` - Email automation sequences

### 2. Enrichment Cascade (Configured)

```
Email Input → PDL (Priority 1) → Hunter (Priority 2) → Apollo (Priority 3*)
                   ↓                    ↓                    ↓
            Name, Company,        Email Verify,        Requires Paid
            Title, LinkedIn,      Confidence Score
            Phone, Industry
```

*Apollo requires paid plan - currently inactive

**Free Tier Limits:**

| Provider | Monthly Limit | Daily Equivalent | Fields |
|----------|---------------|------------------|--------|
| **PDL (People Data Labs)** | 100 lookups | ~3.3/day | Name, Company, Title, LinkedIn, Phone, Location, Industry |
| **Hunter.io** | 25 searches + 50 verifications | ~0.8+1.6/day | Email verification, Domain search |
| **Apollo.io** | 50 credits (PAID ONLY) | Inactive | Full contact data |

### 3. Automation Infrastructure

| Component | Status | Capability |
|-----------|--------|------------|
| **Welcome Journey** | Active | 2-email sequence (immediate + 3-day) |
| **Assessment Results Email** | Active | Personalized score + recommendations |
| **Trigger Rules** | Active | Auto-enrollment, tagging, scoring |
| **Slack Notifications** | Active | #leads channel alerts |
| **Internal Alerts** | Active | Email to christopher@yellowcircle.io |

---

## Gap Analysis: Current vs. Goal

### Goal: 10-50 Prospects/Day

| Source | Current | Gap | Solution |
|--------|---------|-----|----------|
| **Organic Inbound** | 0-2/day | -8 to -48 | Content marketing, SEO |
| **Enrichment** | ~5/day | -5 to -45 | Paid tiers or manual |
| **Cold Outbound** | 0/day | -10 to -50 | Build outbound motion |

### Goal: 0.1% Conversion → 3-10 Clients/Month

**Math:**
- 3-10 clients = 0.1% of X
- X = 3,000-10,000 cold touches/month
- Daily = 100-333 touches/day

**Reality Check:** 0.1% is aggressive for pure cold outreach. Typical B2B rates:
- Cold email: 1-3% reply rate, 0.5-1% meeting rate
- Cold LinkedIn: 2-5% connection accept, 1-2% reply
- Warm referrals: 10-30% meeting rate

**Adjusted Goal:**
- 50 prospects/day × 2% conversion = 1 meeting/day = 20-30 meetings/month
- 20-30 meetings × 15-30% close rate = 3-10 clients/month ✓

---

## Outbound Motion Design

### Option A: Manual List Building + Bulk Import

**Process:**
1. Build prospect list in Google Sheets/Airtable
2. Source from: LinkedIn Sales Navigator, ZoomInfo trial, Apollo.io search
3. Clean and format data
4. Use `bulkImportContacts` function to import (max 100/request)
5. Cascade enrichment fills gaps
6. Journey enrollment for email sequences

**Code Already Exists:**
```bash
# Bulk import endpoint
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/bulkImportContacts" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_TOKEN" \
  -d '{
    "contacts": [
      {"email": "prospect@company.com", "name": "Jane Doe", "company": "Acme Inc"},
      ...
    ],
    "source": "outbound-campaign",
    "tags": ["cold-outreach", "gtm-focus"],
    "enrollJourney": "welcome-new-leads"
  }'
```

**Daily Workflow (30 min/day):**
1. Search LinkedIn/Apollo for 20-50 prospects
2. Export to spreadsheet
3. Run bulk import script
4. Review enrichment results
5. Send personalized outreach (manual or journey)

### Option B: Upgrade to Paid Enrichment

**Cost Analysis:**

| Provider | Plan | Volume | Monthly Cost |
|----------|------|--------|--------------|
| **PDL** | Starter | 1,000 lookups | $99/mo |
| **Hunter.io** | Starter | 500 searches | $49/mo |
| **Apollo.io** | Basic | 10,000 credits | $49/mo |
| **ZoomInfo Lite** | - | 100 contacts | $99/mo |
| **Clearbit** | Growth | 1,000 enrichments | $99/mo |

**Recommended Stack ($100-150/mo):**
- PDL Starter ($99) = 1,000/mo = 33/day
- Hunter Starter ($49) = 500/mo = 16/day verification

**OR:**
- Apollo Basic ($49) = All-in-one search + enrich + email

### Option C: LinkedIn Outbound (Free, Manual)

**Process:**
1. Identify ICP accounts on LinkedIn
2. Send 20-50 connection requests/day (LinkedIn limit)
3. Personalized connection messages
4. Follow-up with value-add content
5. Convert to email conversation

**Tools:**
- LinkedIn Sales Navigator (free trial, then $80/mo)
- Expandi or Dripify for automation ($99/mo)
- Or manual (free, 30-60 min/day)

---

## Recommended Outbound Motion

### Phase 1: Bootstrap (Week 1-2) - $0

**Daily Actions:**
1. **LinkedIn Manual Outreach** (20-30 min)
   - 25 connection requests to ICP prospects
   - 10 follow-up messages to connected
   - Track in spreadsheet

2. **Manual List Building** (20 min)
   - Find 10-20 prospects via LinkedIn/Google
   - Add to prospect spreadsheet
   - Weekly bulk import to yellowCircle

3. **Journey Optimization**
   - Monitor welcome sequence performance
   - A/B test subject lines
   - Track reply rates

**Expected Results:**
- Week 1: 50-100 prospects in database
- Week 2: 100-200 prospects, 5-15 replies
- Week 3: First meetings booked

### Phase 2: Scale (Week 3-4) - $50-100/mo

**Add:**
1. **Apollo Basic ($49/mo)** - All-in-one search + enrich
2. **Email warm-up** - Use existing infrastructure
3. **Automated sequences** - 5-touch journey

**Expected Results:**
- 200-500 prospects/month
- 10-25 meetings/month
- 2-5 clients/month

### Phase 3: Optimize (Month 2+) - $100-200/mo

**Add:**
1. **LinkedIn Sales Navigator** ($80/mo)
2. **Clay.com or Instantly** for advanced automation
3. **Intent data** (Bombora, G2) when budget allows

**Expected Results:**
- 500-1000 prospects/month
- 25-50 meetings/month
- 5-10 clients/month

---

## Implementation Checklist

### This Week

- [ ] Create prospect ICP document (title, company size, industry)
- [ ] Set up LinkedIn outreach tracking spreadsheet
- [ ] Configure `bulkImportContacts` admin token
- [ ] Test bulk import with 10 test contacts
- [ ] Review and optimize welcome journey copy

### Next Week

- [ ] Begin daily LinkedIn outreach (25 connections/day)
- [ ] Manual list building (50 prospects)
- [ ] First bulk import to Firestore
- [ ] Monitor enrichment results
- [ ] Track reply/meeting conversion

### Month 1 Review

- [ ] Assess volume achieved vs. goal
- [ ] Calculate cost per lead acquired
- [ ] Decide on paid tool investment
- [ ] Adjust outbound messaging based on feedback

---

## Email Capture: Return Path

**Question:** "Is there an outbound motion to attempt to get valid emails back?"

**Answer:** Yes, multiple paths:

### Path 1: LinkedIn → Email

1. Connect on LinkedIn
2. Ask for email in conversation
3. Add to Firestore via bulk import
4. Enrich with PDL/Hunter for verification

### Path 2: Domain Search (Hunter.io)

```javascript
// Already configured in cascade enrichment
// Hunter can find emails by domain + name
const enriched = await cascadeEnrich({
  email: null,
  name: "Jane Doe",
  company: "acme.com" // domain
});
// Returns: jane.doe@acme.com (if found)
```

### Path 3: Apollo.io Prospecting (Paid)

- Search by: Title, Company Size, Industry, Location
- Get verified emails directly
- Export to CSV → Bulk import

### Path 4: Lead Magnets (Inbound Capture)

- Assessment tool (already active)
- LeadGate on premium tools
- Newsletter signup
- Webinar registration

---

## Summary: Path to 10 Clients/Month

| Phase | Volume | Conversion | Clients | Cost |
|-------|--------|------------|---------|------|
| **Bootstrap (Wk 1-2)** | 100-200 | 2% reply, 15% close | 0-1 | $0 |
| **Scale (Wk 3-4)** | 300-500 | 3% reply, 20% close | 2-3 | $50/mo |
| **Optimize (Mo 2)** | 500-800 | 4% reply, 25% close | 5-8 | $150/mo |
| **Mature (Mo 3+)** | 800-1200 | 5% reply, 30% close | 8-15 | $200/mo |

**Key Success Factors:**
1. Consistent daily outreach (25-50 touches)
2. Personalized messaging (not templates)
3. Fast follow-up (within 24h of reply)
4. Value-first approach (insights, not pitch)
5. Multi-channel (LinkedIn + Email + Content)

---

*Document Version: 1.0 - Initial Analysis*
