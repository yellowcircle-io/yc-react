# Prospect Infrastructure Setup Guide

**Created:** December 3, 2025
**Purpose:** Capture, enrich, and manage leads from yellowCircle tools

---

## Architecture Overview

```
Lead Sources                    Database              Notifications
─────────────                   ────────              ─────────────

[Contact Form]──┐                                    ┌──→ [Slack #prospects]
[Assessment]────┼──→ Web3Forms ──→ Airtable ──→ Zapier
[Lead Gates]────┘        │                           └──→ [Email Summary]
                         │
                         └──→ Apollo.io ──→ Enriched Data
```

---

## 1. AIRTABLE BASE SETUP

### Step 1: Create Base
1. Go to [airtable.com](https://airtable.com) and sign in/up (free tier: 1,200 records)
2. Create new base: **"yellowCircle Prospects"**

### Step 2: Create "Leads" Table

| Field Name | Field Type | Options |
|------------|------------|---------|
| **Email** | Email | Primary field |
| **Name** | Single line text | |
| **Company** | Single line text | |
| **Title** | Single line text | |
| **Phone** | Phone number | |
| **Source** | Single select | `Contact Form`, `Assessment`, `Outreach Tool`, `Unity Notes`, `Article` |
| **Lead Type** | Single select | `Tool Access`, `Contact Request`, `Assessment Complete`, `Service Inquiry` |
| **Service Interest** | Multiple select | `GTM Audit`, `Marketing Systems`, `Technical Debt`, `Attribution`, `Data Architecture`, `Discovery Call` |
| **Score** | Number | For assessment scores (0-40) |
| **Message** | Long text | |
| **Page URL** | URL | |
| **UTM Source** | Single line text | |
| **UTM Medium** | Single line text | |
| **UTM Campaign** | Single line text | |
| **Status** | Single select | `New`, `Contacted`, `Qualified`, `Meeting Scheduled`, `Proposal Sent`, `Won`, `Lost` |
| **Enriched** | Checkbox | |
| **LinkedIn** | URL | From enrichment |
| **Company Size** | Single select | `1-10`, `11-50`, `51-200`, `201-500`, `500+` |
| **Industry** | Single line text | From enrichment |
| **Notes** | Long text | |
| **Created** | Created time | Auto |
| **Last Modified** | Last modified time | Auto |

### Step 3: Create Views

1. **All Leads** - Default grid view
2. **New Leads** - Filter: Status = "New", Sort: Created (newest first)
3. **Hot Leads** - Filter: Score > 25 OR Service Interest is not empty
4. **By Source** - Group by Source
5. **Kanban** - Kanban by Status

### Step 4: Get API Credentials

1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Create new token: "yellowCircle Zapier"
3. Scopes: `data.records:read`, `data.records:write`
4. Access: Select "yellowCircle Prospects" base
5. **Save the token** (starts with `pat...`)

---

## 2. WEB3FORMS → AIRTABLE (ZAPIER)

### Option A: Zapier (Recommended for simplicity)

#### Step 1: Create Zapier Account
1. Go to [zapier.com](https://zapier.com) (free tier: 100 tasks/month)
2. Sign up/in

#### Step 2: Create Zap

**Trigger: Webhook by Zapier**
1. Choose "Webhooks by Zapier" as trigger
2. Select "Catch Hook"
3. Copy the webhook URL (looks like: `https://hooks.zapier.com/hooks/catch/123456/abcdef/`)

**Action: Airtable - Create Record**
1. Connect your Airtable account
2. Select base: "yellowCircle Prospects"
3. Select table: "Leads"
4. Map fields:
   - Email → `{{email}}`
   - Name → `{{from_name}}`
   - Source → Based on `{{tool}}` or `{{source}}`
   - Message → `{{message}}`
   - Page URL → `{{page}}`
   - UTM Source → `{{utm_source}}`
   - UTM Medium → `{{utm_medium}}`
   - UTM Campaign → `{{utm_campaign}}`
   - Service Interest → `{{service}}`
   - Lead Type → `{{lead_type}}`
   - Status → "New"

### Option B: Make.com (More powerful, also free tier)

Similar setup with Make.com if you prefer more complex logic.

---

## 3. UPDATE WEB3FORMS TO SEND WEBHOOK

Currently Web3Forms sends email only. To also send to Zapier:

### Add Webhook to Web3Forms

1. Go to [web3forms.com](https://web3forms.com) dashboard
2. Find your form (access key: `960839cb-2448-4f82-b12a-82ca2eb7197f`)
3. Settings → Webhooks
4. Add Zapier webhook URL

**OR** Update the code to dual-send:

```javascript
// In ContactModal.jsx and LeadGate.jsx, after Web3Forms success:

// Also send to Zapier webhook
fetch('YOUR_ZAPIER_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: email,
    name: name,
    source: 'contact_form', // or 'lead_gate'
    tool: toolName,
    // ... other fields
  })
});
```

---

## 4. SLACK NOTIFICATIONS

### Step 1: Create Slack Webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create new app → "From scratch"
3. Name: "yellowCircle Leads"
4. Workspace: Select your workspace
5. Go to "Incoming Webhooks" → Enable
6. "Add New Webhook to Workspace"
7. Select channel: #prospects (create if needed)
8. Copy webhook URL

### Step 2: Add Slack Action in Zapier

After the Airtable action, add:

**Action: Slack - Send Channel Message**
1. Connect Slack
2. Channel: #prospects
3. Message:
```
🟡 *New Lead from yellowCircle*

*Email:* {{email}}
*Name:* {{name}}
*Source:* {{source}}
*Tool:* {{tool}}
{{#if service}}*Service Interest:* {{service}}{{/if}}
{{#if message}}*Message:* {{message}}{{/if}}

<https://airtable.com/YOUR_BASE_LINK|View in Airtable>
```

---

## 5. APOLLO.IO ENRICHMENT

### Step 1: Create Apollo Account

1. Go to [apollo.io](https://apollo.io) (free tier: 50 credits/month)
2. Sign up with work email
3. Go to Settings → Integrations → API

### Step 2: Enrichment Workflow

**Option A: Manual (Free)**
1. Export new leads from Airtable weekly
2. Upload to Apollo for enrichment
3. Download enriched data
4. Update Airtable records

**Option B: Automated with Zapier (Requires Apollo paid)**

Add step in Zapier after Airtable:
1. Action: Apollo - Enrich Person
2. Input: Email from form
3. Action: Airtable - Update Record
4. Map enriched fields (company, title, LinkedIn, etc.)

### Apollo Free Tier Limits
- 50 email credits/month
- 100 mobile credits/month
- Basic search filters

---

## 6. IMPLEMENTATION CHECKLIST

### Immediate (Today)
- [ ] Create Airtable base with schema above
- [ ] Create Zapier account
- [ ] Set up Webhook trigger in Zapier
- [ ] Connect Airtable action
- [ ] Test with manual form submission

### This Week
- [ ] Create Slack app and webhook
- [ ] Add Slack notification to Zap
- [ ] Create Apollo.io account
- [ ] Set up manual enrichment workflow

### Code Updates Needed
- [ ] Add Zapier webhook URL to ContactModal.jsx
- [ ] Add Zapier webhook URL to LeadGate.jsx
- [ ] Add Zapier webhook URL to AssessmentPage.jsx

---

## 7. ENVIRONMENT VARIABLES (Future)

When ready to add webhooks to code, store URLs securely:

```javascript
// src/config/integrations.js
export const ZAPIER_WEBHOOK_URL = import.meta.env.VITE_ZAPIER_WEBHOOK || '';
export const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK || '';
```

```bash
# .env.local (not committed)
VITE_ZAPIER_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
VITE_SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

---

## Quick Start Commands

After Airtable + Zapier are set up, provide the webhook URL and I'll update the code to send leads there.

```
Zapier Webhook URL: ________________________
Slack Webhook URL: ________________________ (optional)
```

---

*Document Version: 1.0*
