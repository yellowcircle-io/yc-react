# n8n Railway Deployment Guide
## yellowCircle Automation Hub

*Created: December 9, 2025*
*Status: Setup Guide*

---

## Overview

n8n serves as the automation hub connecting:
- Website form submissions → Airtable + Slack + Firestore
- Airtable updates → Firestore sync
- External webhooks → Lead processing

---

## Step 1: Railway Deployment

### Option A: One-Click Deploy (Recommended)

1. Go to: https://railway.app/template/n8n
2. Click "Deploy Now"
3. Connect your GitHub account if prompted
4. Railway will auto-configure:
   - PostgreSQL database
   - n8n service
   - Persistent storage

**Estimated cost:** ~$5-10/month (usage-based)

### Option B: Manual Deploy

```bash
# Clone n8n Railway template
git clone https://github.com/railwayapp/n8n-railway.git
cd n8n-railway

# Deploy to Railway
railway login
railway init
railway up
```

---

## Step 2: Initial n8n Configuration

### Access n8n Dashboard

After deployment, Railway provides a URL like:
`https://n8n-production-xxxx.up.railway.app`

### First-Time Setup

1. Create admin account (first user becomes owner)
2. Set timezone: `America/New_York` (or your preference)
3. Enable "Save execution data" in Settings → Workflow

### Environment Variables (Railway Dashboard)

Add these in Railway → Service → Variables:

```env
# Required
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=[generate-strong-password]

# Timezone
GENERIC_TIMEZONE=America/New_York

# Webhook URL (auto-configured by Railway)
WEBHOOK_URL=https://your-n8n.up.railway.app

# Execution settings
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
```

---

## Step 3: Create Workflows

### Workflow 1: Lead Capture → Airtable + Slack + Firestore

**Trigger:** Webhook (POST)
**URL:** `https://your-n8n.up.railway.app/webhook/lead-capture`

```json
{
  "name": "Lead Capture Pipeline",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "lead-capture",
        "httpMethod": "POST",
        "responseMode": "onReceived",
        "responseData": "allEntries"
      }
    },
    {
      "name": "Process Lead Data",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            { "name": "email", "value": "={{ $json.email }}" },
            { "name": "name", "value": "={{ $json.from_name || $json.name || '' }}" },
            { "name": "source", "value": "={{ $json.source || 'website' }}" },
            { "name": "tool", "value": "={{ $json.tool || '' }}" },
            { "name": "company", "value": "={{ $json.company || '' }}" },
            { "name": "message", "value": "={{ $json.message || '' }}" },
            { "name": "utm_source", "value": "={{ $json.utm_source || '' }}" },
            { "name": "utm_campaign", "value": "={{ $json.utm_campaign || '' }}" },
            { "name": "page", "value": "={{ $json.page || '' }}" },
            { "name": "timestamp", "value": "={{ $json.timestamp || new Date().toISOString() }}" }
          ]
        }
      }
    },
    {
      "name": "Add to Airtable",
      "type": "n8n-nodes-base.airtable",
      "parameters": {
        "operation": "create",
        "application": "apptKYdOCMlxkmkJB",
        "table": "tbl5mMiu2xrFnGr40",
        "options": {},
        "fields": {
          "Email": "={{ $json.email }}",
          "Name": "={{ $json.name }}",
          "Source": "={{ $json.source }}",
          "Tool": "={{ $json.tool }}",
          "Company": "={{ $json.company }}",
          "Message": "={{ $json.message }}",
          "UTM Source": "={{ $json.utm_source }}",
          "UTM Campaign": "={{ $json.utm_campaign }}",
          "Page URL": "={{ $json.page }}",
          "Captured At": "={{ $json.timestamp }}",
          "Status": "New"
        }
      },
      "credentials": {
        "airtableApi": "airtable-credentials"
      }
    },
    {
      "name": "Notify Slack",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "channel": "#leads",
        "text": "🟡 *New Lead from yellowCircle*\n\n*Email:* {{ $json.email }}\n*Name:* {{ $json.name || 'Unknown' }}\n*Source:* {{ $json.source }}\n{{ $json.tool ? '*Tool:* ' + $json.tool + '\\n' : '' }}{{ $json.company ? '*Company:* ' + $json.company + '\\n' : '' }}{{ $json.message ? '*Message:* ' + $json.message : '' }}"
      },
      "credentials": {
        "slackApi": "slack-credentials"
      }
    },
    {
      "name": "Sync to Firestore",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://us-central1-yellowcircle-app.cloudfunctions.net/syncLeadFromN8N",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "x-n8n-token", "value": "={{ $env.N8N_FIRESTORE_TOKEN }}" }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "email", "value": "={{ $json.email }}" },
            { "name": "name", "value": "={{ $json.name }}" },
            { "name": "source", "value": "={{ $json.source }}" },
            { "name": "airtableId", "value": "={{ $node['Add to Airtable'].json.id }}" }
          ]
        }
      }
    }
  ],
  "connections": {
    "Webhook": { "main": [[{ "node": "Process Lead Data", "type": "main", "index": 0 }]] },
    "Process Lead Data": { "main": [[{ "node": "Add to Airtable", "type": "main", "index": 0 }]] },
    "Add to Airtable": { "main": [[{ "node": "Notify Slack", "type": "main", "index": 0 }, { "node": "Sync to Firestore", "type": "main", "index": 0 }]] }
  }
}
```

### Workflow 2: Airtable → Firestore Sync

**Trigger:** Airtable Trigger (on record update)

```json
{
  "name": "Airtable to Firestore Sync",
  "nodes": [
    {
      "name": "Airtable Trigger",
      "type": "n8n-nodes-base.airtableTrigger",
      "parameters": {
        "application": "apptKYdOCMlxkmkJB",
        "table": "tbl5mMiu2xrFnGr40",
        "triggerField": "Modified"
      }
    },
    {
      "name": "Filter Changes",
      "type": "n8n-nodes-base.filter",
      "parameters": {
        "conditions": {
          "string": [
            { "value1": "={{ $json.fields.Email }}", "operation": "isNotEmpty" }
          ]
        }
      }
    },
    {
      "name": "Update Firestore Contact",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://us-central1-yellowcircle-app.cloudfunctions.net/syncContactFromAirtable",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "x-n8n-token", "value": "={{ $env.N8N_FIRESTORE_TOKEN }}" }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "airtableId", "value": "={{ $json.id }}" },
            { "name": "email", "value": "={{ $json.fields.Email }}" },
            { "name": "name", "value": "={{ $json.fields.Name }}" },
            { "name": "company", "value": "={{ $json.fields.Company }}" },
            { "name": "status", "value": "={{ $json.fields.Status }}" },
            { "name": "tags", "value": "={{ $json.fields.Tags }}" },
            { "name": "notes", "value": "={{ $json.fields.Notes }}" }
          ]
        }
      }
    }
  ]
}
```

### Workflow 3: Daily Lead Digest

**Trigger:** Cron (daily at 9am)

```json
{
  "name": "Daily Lead Digest",
  "nodes": [
    {
      "name": "Cron",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "item": [{ "hour": 9, "minute": 0 }]
        }
      }
    },
    {
      "name": "Get Yesterday Leads",
      "type": "n8n-nodes-base.airtable",
      "parameters": {
        "operation": "list",
        "application": "apptKYdOCMlxkmkJB",
        "table": "tbl5mMiu2xrFnGr40",
        "additionalOptions": {
          "filterByFormula": "IS_AFTER({Captured At}, DATEADD(TODAY(), -1, 'days'))"
        }
      }
    },
    {
      "name": "Format Summary",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const leads = $input.all();\nconst count = leads.length;\nconst sources = {};\nleads.forEach(l => {\n  const src = l.json.fields.Source || 'Unknown';\n  sources[src] = (sources[src] || 0) + 1;\n});\nconst sourceList = Object.entries(sources).map(([k,v]) => `${k}: ${v}`).join('\\n');\nreturn [{ json: { count, sourceList, leads: leads.slice(0,5).map(l => l.json.fields.Email) } }];"
      }
    },
    {
      "name": "Send Digest",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "channel": "#leads",
        "text": "📊 *Daily Lead Digest*\n\n*Total new leads:* {{ $json.count }}\n\n*By Source:*\n{{ $json.sourceList }}\n\n*Recent:*\n{{ $json.leads.join('\\n') }}"
      }
    }
  ]
}
```

---

## Step 4: Configure Credentials

### Airtable Credentials

1. In n8n: Settings → Credentials → Add Credential
2. Select "Airtable API"
3. Add API Key: `patWezpGxs8KcrPpF` (from your Airtable account)

### Slack Credentials

1. Create Slack App: https://api.slack.com/apps
2. Add OAuth scopes: `chat:write`, `channels:read`
3. Install to workspace
4. Copy Bot Token
5. In n8n: Add Slack API credential with token

### Firestore Token

1. Generate secure token for n8n → Firestore auth
2. Add to Railway environment: `N8N_FIRESTORE_TOKEN=your-token`
3. Add same token to Firebase Functions config

---

## Step 5: Update yellowCircle .env

After n8n is deployed, add to `.env`:

```env
# n8n Webhook URL (from Railway)
VITE_N8N_WEBHOOK=https://your-n8n.up.railway.app/webhook/lead-capture

# Optional: Direct Slack webhook (fallback)
VITE_SLACK_WEBHOOK=https://hooks.slack.com/services/xxx/xxx/xxx
```

---

## Step 6: Create Cloud Functions for n8n

Add these endpoints to `functions/index.js`:

```javascript
// Sync lead from n8n to Firestore
exports.syncLeadFromN8N = functions.https.onRequest(async (request, response) => {
  setCors(response);

  // Verify n8n token
  const token = request.headers['x-n8n-token'];
  if (token !== functions.config().n8n?.token) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { email, name, source, airtableId } = request.body;

  // Create/update contact in Firestore
  const contactId = generateContactId(email);
  const contactRef = db.collection('contacts').doc(contactId);

  await contactRef.set({
    email: email.toLowerCase(),
    name: name || '',
    source: { original: source },
    'externalIds.airtableId': airtableId,
    'syncStatus.airtable': 'synced',
    'syncStatus.airtableLastSync': admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  response.json({ success: true, contactId });
});

// Sync contact update from Airtable
exports.syncContactFromAirtable = functions.https.onRequest(async (request, response) => {
  setCors(response);

  const token = request.headers['x-n8n-token'];
  if (token !== functions.config().n8n?.token) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { airtableId, email, name, company, status, tags, notes } = request.body;

  // Find contact by airtableId or email
  let contactRef;
  const byAirtable = await db.collection('contacts')
    .where('externalIds.airtableId', '==', airtableId)
    .limit(1)
    .get();

  if (!byAirtable.empty) {
    contactRef = byAirtable.docs[0].ref;
  } else {
    const contactId = generateContactId(email);
    contactRef = db.collection('contacts').doc(contactId);
  }

  // Map Airtable status to Firestore stage
  const stageMap = {
    'New': 'new',
    'Contacted': 'nurturing',
    'Engaged': 'engaged',
    'Qualified': 'qualified',
    'Customer': 'customer'
  };

  await contactRef.set({
    email: email.toLowerCase(),
    name: name || '',
    company: company || '',
    stage: stageMap[status] || 'new',
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    notes: notes || '',
    'externalIds.airtableId': airtableId,
    'syncStatus.airtable': 'synced',
    'syncStatus.airtableLastSync': admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  response.json({ success: true });
});

// Helper
const generateContactId = (email) => {
  const normalized = email.toLowerCase().trim();
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
  }
  return `contact-${Math.abs(hash).toString(16).padStart(8, '0')}`;
};
```

---

## Step 7: Set Firebase Functions Config

```bash
firebase functions:config:set n8n.token="your-secure-token-here"
firebase deploy --only functions
```

---

## Testing Checklist

After setup, test each workflow:

### Test 1: Lead Capture Webhook
```bash
curl -X POST https://your-n8n.up.railway.app/webhook/lead-capture \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "source": "lead_gate",
    "tool": "Outreach Generator"
  }'
```

**Expected:**
- [ ] Record appears in Airtable
- [ ] Slack notification received
- [ ] Contact created/updated in Firestore

### Test 2: Airtable Update Sync
1. Manually update a record in Airtable
2. Check Firestore for updated contact

### Test 3: Daily Digest
1. Manually trigger workflow in n8n
2. Check Slack for digest message

---

## Monitoring

### n8n Dashboard
- View execution history
- Check for failed workflows
- Review error logs

### Railway Metrics
- CPU/Memory usage
- Request counts
- Error rates

### Alerts to Configure
1. Workflow failure → Slack alert
2. High error rate → Email notification
3. Database connection lost → PagerDuty (optional)

---

## Cost Estimate

| Service | Estimated Monthly Cost |
|---------|----------------------|
| Railway (n8n) | $5-10 |
| Railway (PostgreSQL) | Included |
| Airtable | Free tier |
| Slack | Free tier |
| **Total** | **~$5-10/month** |

---

## Troubleshooting

### "Webhook not receiving data"
- Verify VITE_N8N_WEBHOOK in .env
- Check n8n workflow is active
- Test webhook URL directly with curl

### "Airtable connection failed"
- Verify API key is correct
- Check base/table IDs
- Ensure proper permissions on Airtable token

### "Firestore sync not working"
- Verify n8n token matches Firebase config
- Check Cloud Functions logs
- Ensure CORS is configured

---

## Next Steps After Setup

1. [ ] Deploy n8n to Railway
2. [ ] Configure credentials (Airtable, Slack)
3. [ ] Import workflow JSONs
4. [ ] Test webhook endpoint
5. [ ] Update .env with webhook URL
6. [ ] Deploy Cloud Functions
7. [ ] Test end-to-end flow
8. [ ] Activate workflows

---

*Document Version: 1.0*
*Last Updated: December 9, 2025*
