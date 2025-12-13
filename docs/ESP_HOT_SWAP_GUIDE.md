# ESP (Email Service Provider) Hot-Swap Guide

## Overview

yellowCircle supports hot-swappable email providers for outreach emails. Currently supported:

| Provider | Free Tier | Status |
|----------|-----------|--------|
| **Resend** | 100 emails/day | ✅ Default |
| **SendGrid** | 100 emails/day | ✅ Implemented |

## Quick Start

### Check Current ESP Status

```bash
curl https://us-central1-yellowcircle-app.cloudfunctions.net/getESPStatus
```

Response:
```json
{
  "currentProvider": "resend",
  "providers": {
    "resend": { "configured": true, "freeTier": "100 emails/day" },
    "sendgrid": { "configured": false, "freeTier": "100 emails/day" }
  },
  "configuredProviders": ["resend"]
}
```

### Switch ESP Provider

**Step 1: Configure the new provider's API key**

```bash
# SendGrid
firebase functions:config:set sendgrid.api_key="SG.YOUR_SENDGRID_API_KEY"

# Resend (already configured)
firebase functions:config:set resend.api_key="re_YOUR_RESEND_API_KEY"
```

**Step 2: Set the active provider**

```bash
# Switch to SendGrid
firebase functions:config:set esp.provider="sendgrid"

# Switch back to Resend
firebase functions:config:set esp.provider="resend"
```

**Step 3: Redeploy functions**

```bash
firebase deploy --only functions
```

---

## API Usage

### Send Email (with provider override)

```bash
curl -X POST https://us-central1-yellowcircle-app.cloudfunctions.net/sendEmail \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello</h1><p>Test email content</p>",
    "provider": "sendgrid"
  }'
```

**Provider Selection Priority:**
1. Request body `provider` parameter (per-email override)
2. Firebase config `esp.provider` setting
3. Default: `resend`

### Response

```json
{
  "id": "msg_123456",
  "status": "sent",
  "provider": "sendgrid"
}
```

---

## Configuration Reference

### Firebase Config Keys

| Key | Description | Example |
|-----|-------------|---------|
| `resend.api_key` | Resend API key | `re_xxxxx` |
| `sendgrid.api_key` | SendGrid API key | `SG.xxxxx` |
| `esp.provider` | Active provider | `resend` or `sendgrid` |

### View Current Config

```bash
firebase functions:config:get
```

### Set Multiple Keys

```bash
firebase functions:config:set \
  resend.api_key="re_xxxxx" \
  sendgrid.api_key="SG.xxxxx" \
  esp.provider="resend"
```

---

## Provider Setup

### Resend Setup

1. Go to https://resend.com
2. Create account (free tier: 100 emails/day)
3. Create API key
4. Configure in Firebase:
   ```bash
   firebase functions:config:set resend.api_key="re_YOUR_KEY"
   ```

### SendGrid Setup

1. Go to https://sendgrid.com
2. Create account (free tier: 100 emails/day)
3. Create API key with "Mail Send" permission
4. Configure in Firebase:
   ```bash
   firebase functions:config:set sendgrid.api_key="SG.YOUR_KEY"
   ```

---

## Architecture

### Functions

| Function | Purpose |
|----------|---------|
| `sendEmail` | Send single email via configured ESP |
| `getESPStatus` | Check ESP configuration status |
| `sendEmailInternal` | Internal helper for journey engine |

### Code Location

```
functions/index.js
├── getESPProvider()      # Get active ESP
├── sendViaResend()       # Resend adapter
├── sendViaSendGrid()     # SendGrid adapter
├── sendEmailViaESP()     # Unified sender
└── exports.sendEmail     # HTTP endpoint
```

### Frontend Adapters

```
src/adapters/esp/
├── index.js      # Adapter factory
├── resend.js     # Resend adapter (frontend)
├── sendgrid.js   # SendGrid adapter (frontend)
├── hubspot.js    # HubSpot adapter (future)
└── mailchimp.js  # Mailchimp adapter (future)
```

---

## Troubleshooting

### "API key not configured"

```bash
# Check if key is set
firebase functions:config:get

# Set the key
firebase functions:config:set sendgrid.api_key="SG.YOUR_KEY"

# Redeploy
firebase deploy --only functions
```

### "SendGrid API error"

Common issues:
- Invalid API key format (must start with `SG.`)
- API key lacks "Mail Send" permission
- Sender domain not verified

### Provider Not Switching

1. Verify config: `firebase functions:config:get`
2. Redeploy: `firebase deploy --only functions`
3. Check status: `curl .../getESPStatus`

---

## Rate Limits

| Provider | Free Tier | Paid Plans |
|----------|-----------|------------|
| Resend | 100/day, 3000/month | Starting $20/mo |
| SendGrid | 100/day forever | Starting $15/mo |

**Recommendation:** Use both providers with daily rotation to get 200 emails/day free.

---

## Future Enhancements

- [ ] Admin UI for ESP switching
- [ ] Automatic failover between providers
- [ ] Usage tracking and alerts
- [ ] HubSpot and Mailchimp integration

---

*Last updated: December 10, 2025*
