# Prospect Infrastructure Setup Guide

**Created:** December 3, 2025
**Updated:** December 4, 2025
**Purpose:** Capture, enrich, and manage leads from yellowCircle tools

---

## Architecture Overview

```
Lead Sources                    Automation               Database/Notifications
─────────────                   ──────────               ──────────────────────

[Contact Form]──┐                                       ┌──→ [Airtable]
[Assessment]────┼──→ Web3Forms ──→ n8n (self-hosted) ──┼──→ [Slack #prospects]
[Lead Gates]────┘        │               │              └──→ [AI Outreach Draft]
                         │               │
                         │               └──→ Apollo.io ──→ Enriched Data
                         │
                         └──→ Email backup (existing)
```

---

## Why n8n Over Zapier/Make

| Factor | Zapier | Make | n8n (Self-Hosted) |
|--------|--------|------|-------------------|
| **Free Tier** | 100 tasks/mo | 1,000 ops/mo | ∞ Unlimited |
| **Cost at Scale** | $20-50+/mo | $10-30+/mo | ~$5/mo hosting |
| **Multi-step Workflows** | $$ Premium | $$ Premium | ✅ Free |
| **Branching/Conditionals** | $$ Premium | $$ Premium | ✅ Free |
| **AI Integration** | $$ Premium | $$ Premium | ✅ Free (bring your API) |
| **Webhook Response** | $$ Premium | $$ Premium | ✅ Free |
| **Data Privacy** | Cloud | Cloud | ✅ Self-hosted |
| **Custom Code** | Limited | Limited | ✅ Full JavaScript |

**Recommendation:** n8n self-hosted on Railway/Render ($5/mo) or local Docker (free)

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
2. Create new token: "yellowCircle n8n"
3. Scopes: `data.records:read`, `data.records:write`
4. Access: Select "yellowCircle Prospects" base
5. **Save the token** (starts with `pat...`)

---

## 2. N8N SELF-HOSTED SETUP

### Option A: Railway (Recommended - $5/mo)

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. New Project → Deploy Template → Search "n8n"
4. Click Deploy
5. Wait for deployment (~2 minutes)
6. Click generated URL → Your n8n instance is live!

**Railway gives you:**
- Persistent storage (workflows saved)
- Custom domain support
- Auto-restarts
- 500 hours/month free tier, then ~$5/mo

### Option B: Render (Free tier available)

1. Go to [render.com](https://render.com)
2. New → Web Service → Docker
3. Image: `n8nio/n8n`
4. Instance Type: Free (spins down after inactivity) or $7/mo (always on)

### Option C: Local Docker (Free, dev/testing)

```bash
# Quick start
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Access at http://localhost:5678
```

**Docker Compose (persistent, recommended):**

```yaml
# docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your-secure-password
      - WEBHOOK_URL=http://localhost:5678/
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

volumes:
  n8n_data:
```

```bash
docker-compose up -d
```

### Option D: VPS (Full Control)

For AWS/DigitalOcean/Vultr (~$4-6/mo):

```bash
# On Ubuntu 22.04 VPS
curl -fsSL https://get.docker.com | sh
docker run -d --restart unless-stopped \
  -p 5678:5678 \
  -v /root/n8n:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=your-password \
  n8nio/n8n
```

---

## 3. N8N WORKFLOW: WEB3FORMS → AIRTABLE → SLACK

### Step 1: Create Webhook Trigger

1. In n8n, create new workflow
2. Add node: **Webhook**
3. Settings:
   - HTTP Method: POST
   - Path: `lead-capture` (or auto-generated)
   - Response Mode: Immediately
4. **Copy the webhook URL** (looks like: `https://your-n8n.railway.app/webhook/lead-capture`)

### Step 2: Add Airtable Node

1. Add node: **Airtable** → Create Record
2. Connect credentials (API token from Step 1.4)
3. Base: "yellowCircle Prospects"
4. Table: "Leads"
5. Map fields:
   ```
   Email       → {{ $json.email }}
   Name        → {{ $json.from_name }}
   Source      → {{ $json.source }}
   Message     → {{ $json.message }}
   Page URL    → {{ $json.page }}
   UTM Source  → {{ $json.utm_source }}
   UTM Medium  → {{ $json.utm_medium }}
   UTM Campaign→ {{ $json.utm_campaign }}
   Service Interest → {{ $json.service }}
   Lead Type   → {{ $json.lead_type }}
   Status      → "New"
   ```

### Step 3: Add Slack Notification

1. Add node: **Slack** → Send Message
2. Connect credentials (Slack OAuth or Webhook)
3. Channel: #prospects
4. Message:
   ```
   🟡 *New Lead from yellowCircle*

   *Email:* {{ $json.email }}
   *Name:* {{ $json.from_name }}
   *Source:* {{ $json.source }}
   {{ $json.service ? '*Service Interest:* ' + $json.service : '' }}
   {{ $json.message ? '*Message:* ' + $json.message : '' }}
   ```

### Step 4: (Optional) AI Outreach Draft

1. Add node: **OpenAI** → Chat
2. Prompt:
   ```
   Draft a brief, personalized outreach email for this lead:
   Name: {{ $json.from_name }}
   Company: {{ $json.company }}
   Interest: {{ $json.service }}
   Message: {{ $json.message }}

   Keep it under 100 words, professional but warm.
   ```
3. Add node: **Slack** → Send to #outreach-drafts

### Complete Workflow JSON

Import this into n8n (Settings → Import from JSON):

```json
{
  "name": "Lead Capture - yellowCircle",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "lead-capture",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Airtable",
      "type": "n8n-nodes-base.airtable",
      "position": [450, 300],
      "parameters": {
        "operation": "create",
        "application": "YOUR_BASE_ID",
        "table": "Leads",
        "fields": {
          "Email": "={{ $json.email }}",
          "Name": "={{ $json.from_name }}",
          "Source": "={{ $json.source }}",
          "Message": "={{ $json.message }}",
          "Status": "New"
        }
      }
    },
    {
      "name": "Slack",
      "type": "n8n-nodes-base.slack",
      "position": [650, 300],
      "parameters": {
        "channel": "#prospects",
        "text": "🟡 New Lead: {{ $json.email }} from {{ $json.source }}"
      }
    }
  ],
  "connections": {
    "Webhook": { "main": [[{ "node": "Airtable", "type": "main", "index": 0 }]] },
    "Airtable": { "main": [[{ "node": "Slack", "type": "main", "index": 0 }]] }
  }
}
```

---

## 4. SLACK WEBHOOK SETUP

### Step 1: Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create new app → "From scratch"
3. Name: "yellowCircle Leads"
4. Workspace: Select your workspace

### Step 2: Configure OAuth (Recommended for n8n)

1. Go to "OAuth & Permissions"
2. Add scopes: `chat:write`, `chat:write.public`
3. Install to workspace
4. Copy "Bot User OAuth Token" (starts with `xoxb-`)
5. Add to n8n credentials

### Alternative: Incoming Webhook (Simpler)

1. Go to "Incoming Webhooks" → Enable
2. "Add New Webhook to Workspace"
3. Select channel: #prospects
4. Copy webhook URL
5. Use HTTP Request node in n8n instead of Slack node

---

## 5. UPDATE WEB3FORMS TO SEND TO N8N

### Option A: Web3Forms Native Webhook

1. Go to [web3forms.com](https://web3forms.com) dashboard
2. Find your form (access key: `960839cb-2448-4f82-b12a-82ca2eb7197f`)
3. Settings → Webhooks
4. Add n8n webhook URL

### Option B: Dual-Send from Code

```javascript
// In ContactModal.jsx and LeadGate.jsx, after Web3Forms success:

// Also send to n8n webhook
fetch('YOUR_N8N_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: email,
    from_name: name,
    source: 'contact_form', // or 'lead_gate', 'assessment'
    tool: toolName,
    service: selectedService,
    message: message,
    page: window.location.href,
    utm_source: new URLSearchParams(window.location.search).get('utm_source'),
    utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
    utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
  })
});
```

---

## 6. APOLLO.IO ENRICHMENT

### Step 1: Create Apollo Account

1. Go to [apollo.io](https://apollo.io) (free tier: 50 credits/month)
2. Sign up with work email
3. Go to Settings → Integrations → API

### Step 2: n8n Enrichment Workflow

**Manual Trigger Workflow:**

1. Trigger: Manual or Schedule (weekly)
2. Node: Airtable → List Records (filter: Enriched = false)
3. Node: Apollo → Enrich Person (requires Apollo API key)
4. Node: Airtable → Update Record (add enriched fields)
5. Node: Airtable → Update Record (set Enriched = true)

**Or Real-Time (requires Apollo paid):**

Add after Airtable create in main workflow:
1. Node: Apollo → Enrich Person
2. Node: IF → Check if enrichment succeeded
3. Node: Airtable → Update Record

### Apollo Free Tier Limits
- 50 email credits/month
- 100 mobile credits/month
- Basic search filters

---

## 7. IMPLEMENTATION CHECKLIST

### Phase 1: Core Setup (Today)
- [ ] Create Airtable base with schema above
- [ ] Deploy n8n (Railway recommended for simplicity)
- [ ] Set up Webhook trigger in n8n
- [ ] Connect Airtable node
- [ ] Test with manual webhook call

### Phase 2: Notifications (This Week)
- [ ] Create Slack app and OAuth credentials
- [ ] Add Slack notification to workflow
- [ ] Test end-to-end flow

### Phase 3: Code Integration
- [ ] Add n8n webhook URL to ContactModal.jsx
- [ ] Add n8n webhook URL to LeadGate.jsx
- [ ] Add n8n webhook URL to AssessmentPage.jsx

### Phase 4: Enrichment (Optional)
- [ ] Create Apollo.io account
- [ ] Set up enrichment workflow in n8n
- [ ] Test with sample leads

### Phase 5: AI Enhancement (Optional)
- [ ] Add OpenAI credentials to n8n
- [ ] Create outreach draft workflow
- [ ] Route drafts to #outreach-drafts channel

---

## 8. ENVIRONMENT VARIABLES

Store webhook URLs securely:

```javascript
// src/config/integrations.js
export const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK || '';
export const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK || '';
```

```bash
# .env.local (not committed)
VITE_N8N_WEBHOOK=https://your-n8n.railway.app/webhook/lead-capture
VITE_SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

---

## 9. ADVANCED N8N WORKFLOWS

### Lead Scoring Workflow

```
Webhook → Extract Data → Calculate Score → Branch by Score
                                              ↓
                              High (>25): Slack #hot-leads
                              Medium (15-25): Standard flow
                              Low (<15): Tag for nurture
```

### Duplicate Detection

```
Webhook → Airtable Search (by email) → IF exists:
                                         → Update existing record
                                       → ELSE:
                                         → Create new record
```

### Auto-Response Email

```
Webhook → Airtable Create → Send Email (via SendGrid/Mailgun node)
                               ↓
                            Personalized confirmation email
```

---

## Quick Start Commands

After n8n is deployed, provide the webhook URL:

```
n8n Instance URL: ________________________
n8n Webhook URL:  ________________________
Slack OAuth Token: ________________________ (optional)
```

---

## Cost Comparison Summary

| Setup | Monthly Cost | Limits |
|-------|--------------|--------|
| n8n on Railway | ~$5 | Unlimited |
| n8n on Render (free) | $0 | Spins down |
| n8n on VPS | ~$5 | Unlimited |
| n8n Local Docker | $0 | Local only |
| Zapier | $0-50+ | 100-750 tasks |
| Make | $0-30+ | 1,000-10,000 ops |

**Recommended:** Railway at $5/mo for always-on, unlimited automations with AI integration capability.

---

*Document Version: 2.0 - Updated for n8n self-hosted*
