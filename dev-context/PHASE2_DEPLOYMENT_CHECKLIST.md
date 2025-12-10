# Phase 2: n8n + Railway Deployment Checklist

**Status**: Ready for Manual Execution
**Last Updated**: December 9, 2025
**Prerequisite**: Firebase CLI authentication required

---

## Overview

This checklist walks through the complete Phase 2 deployment:
1. Firebase CLI re-authentication
2. Firebase Functions config setup
3. Cloud Functions deployment
4. n8n Railway deployment
5. Webhook configuration
6. End-to-end testing

---

## Step 1: Firebase CLI Re-Authentication

Firebase credentials have expired. Run this in your terminal:

```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle
firebase login --reauth
```

This will open a browser for Google authentication.

**Verification:**
```bash
firebase projects:list
```
Should show `yellowcircle-app` in the list.

---

## Step 2: Set Firebase Functions Config

Set the n8n authentication token used for webhook security:

```bash
# Generate a secure token (or use your own)
# Example: openssl rand -hex 32

# Set the config
firebase functions:config:set n8n.token="YOUR_SECURE_TOKEN_HERE"
```

**Recommended token format**: 64-character hex string
**Example**: `firebase functions:config:set n8n.token="a1b2c3d4e5f6..."`

**Verification:**
```bash
firebase functions:config:get
```
Should show:
```json
{
  "n8n": {
    "token": "your-token-here"
  }
}
```

---

## Step 3: Deploy Cloud Functions

Deploy the new functions to Firebase:

```bash
firebase deploy --only functions
```

**New functions being deployed:**
- `syncLeadFromN8N` - Receives lead data from n8n
- `syncContactFromAirtable` - Syncs Airtable updates to Firestore
- `createProspect` - API to enroll contacts in journeys

**Expected deployment URLs:**
```
✔ functions[syncLeadFromN8N(us-central1)]: https://us-central1-yellowcircle-app.cloudfunctions.net/syncLeadFromN8N
✔ functions[syncContactFromAirtable(us-central1)]: https://us-central1-yellowcircle-app.cloudfunctions.net/syncContactFromAirtable
✔ functions[createProspect(us-central1)]: https://us-central1-yellowcircle-app.cloudfunctions.net/createProspect
```

**Verification:**
```bash
# Test health endpoint
curl https://us-central1-yellowcircle-app.cloudfunctions.net/health

# Test syncLeadFromN8N (should return 401 without token)
curl -X POST https://us-central1-yellowcircle-app.cloudfunctions.net/syncLeadFromN8N
```

---

## Step 4: Deploy n8n to Railway

### 4a. One-Click Deploy

Click this link to deploy n8n to Railway:
**https://railway.app/template/n8n**

### 4b. Configure Environment Variables in Railway

After deployment, go to Railway → Your n8n service → Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `N8N_ENCRYPTION_KEY` | (auto-generated) | Keep the generated value |
| `N8N_BASIC_AUTH_ACTIVE` | `true` | Enable basic auth |
| `N8N_BASIC_AUTH_USER` | `admin` | Your login username |
| `N8N_BASIC_AUTH_PASSWORD` | (secure password) | Your login password |
| `WEBHOOK_URL` | (your railway URL) | Auto-detected usually |
| `GENERIC_TIMEZONE` | `America/New_York` | Your timezone |

### 4c. Get Your n8n URL

After deployment completes:
1. Go to Railway → Your n8n service → Settings → Domains
2. Copy the URL (e.g., `https://n8n-production-xxxx.up.railway.app`)

---

## Step 5: Configure n8n Workflows

### 5a. Login to n8n

Visit your Railway n8n URL and login with credentials from Step 4b.

### 5b. Import Lead Capture Workflow

Create a new workflow with these nodes:

**Node 1: Webhook Trigger**
- Type: Webhook
- HTTP Method: POST
- Path: `/lead-capture`
- Authentication: None (we handle it in our code)

**Node 2: Airtable - Create Record**
- Type: Airtable
- Operation: Create
- Base ID: (from Airtable)
- Table: `Contacts` (or your lead table)
- Fields:
  - Email: `{{ $json.email }}`
  - Name: `{{ $json.name }}`
  - Source: `{{ $json.source }}`
  - Tool: `{{ $json.sourceTool }}`
  - Created: `{{ $now }}`

**Node 3: Slack - Send Message**
- Type: Slack
- Channel: `#leads`
- Message: `New lead: {{ $json.email }} from {{ $json.source }}`

**Node 4: HTTP Request (Sync to Firestore)**
- Type: HTTP Request
- Method: POST
- URL: `https://us-central1-yellowcircle-app.cloudfunctions.net/syncLeadFromN8N`
- Headers:
  - `x-n8n-token`: (your token from Step 2)
  - `Content-Type`: `application/json`
- Body (JSON):
  ```json
  {
    "email": "{{ $json.email }}",
    "name": "{{ $json.name }}",
    "source": "{{ $json.source }}",
    "sourceTool": "{{ $json.sourceTool }}",
    "airtableId": "{{ $node['Airtable'].json.id }}"
  }
  ```

### 5c. Activate Workflow

Toggle the workflow to "Active" in n8n.

---

## Step 6: Update Local Environment

Add your n8n webhook URL to `.env`:

```bash
# In your project .env file:
VITE_N8N_WEBHOOK=https://your-n8n-url.up.railway.app/webhook/lead-capture
VITE_N8N_AUTH_TOKEN=your-secure-token-from-step-2
```

---

## Step 7: End-to-End Testing

### 7a. Test Lead Capture Flow

1. **Go to yellowcircle.io**
2. **Use any tool behind LeadGate** (e.g., Outreach Generator)
3. **Enter test email** (use a + alias like `yourname+test1@gmail.com`)
4. **Submit the form**

### 7b. Verify Each Step

| Check | How to Verify |
|-------|---------------|
| Firestore lead created | Firebase Console → Firestore → leads collection |
| n8n webhook received | n8n → Executions tab |
| Airtable record created | Airtable → Contacts table |
| Slack notification sent | Check #leads channel |
| Firestore contact created | Firebase Console → Firestore → contacts collection |

### 7c. Test Direct Function Call

```bash
# Test syncLeadFromN8N with valid token
curl -X POST https://us-central1-yellowcircle-app.cloudfunctions.net/syncLeadFromN8N \
  -H "x-n8n-token: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "source": "lead_gate",
    "sourceTool": "outreach-generator",
    "airtableId": "rec123456"
  }'
```

Expected response:
```json
{
  "success": true,
  "contactId": "contact-xxxxxxxx",
  "message": "Lead synced to Firestore"
}
```

---

## Troubleshooting

### Firebase Deploy Fails

```bash
# Check for syntax errors
cd functions && node --check index.js

# Check dependencies
cd functions && npm install

# Deploy with debug
firebase deploy --only functions --debug
```

### n8n Webhook Not Receiving

1. Check workflow is "Active" (green toggle)
2. Verify webhook URL path matches exactly
3. Check n8n execution logs for errors
4. Test webhook directly: `curl -X POST your-webhook-url -d '{"test": true}'`

### Firestore Permission Denied

1. Check `firestore.rules` is deployed: `firebase deploy --only firestore:rules`
2. Verify the leads collection allows unauthenticated creates
3. Check Firebase Console → Firestore → Rules tab

### Airtable API Errors

1. Verify API key has write permissions
2. Check base ID is correct
3. Verify table name matches exactly (case-sensitive)

---

## Completion Checklist

- [ ] Firebase CLI re-authenticated
- [ ] Firebase Functions config set with n8n token
- [ ] Cloud Functions deployed successfully
- [ ] n8n deployed to Railway
- [ ] n8n workflow created and activated
- [ ] .env updated with n8n webhook URL
- [ ] Test lead submitted through LeadGate
- [ ] Verified: Firestore lead created
- [ ] Verified: n8n execution logged
- [ ] Verified: Airtable record created
- [ ] Verified: Slack notification sent
- [ ] Verified: Firestore contact created

---

## Next Steps After Completion

Once Phase 2 is complete, proceed to:

**Phase 3: Build Trigger System**
- Create Firestore triggers for leads
- Implement journey enrollment automation
- Add deduplication and rate limiting

See `dev-context/EOY_ROADMAP_SCOPING_DEC2025.md` for full roadmap.
