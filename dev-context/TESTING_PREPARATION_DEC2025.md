# Testing Preparation - December 2025 Sprint
**Created:** December 19, 2025
**Purpose:** Test all new endpoints from Platform Enhancements sprint

---

## New Functions Deployed (Dec 18-19, 2025)

### AI Image Generation

| Function | Endpoint | Method | Auth |
|----------|----------|--------|------|
| `generateImage` | `/generateImage` | POST | Admin |
| `getImageGenUsage` | `/getImageGenUsage` | GET | Admin |

### Programmatic Ads

| Function | Endpoint | Method | Auth |
|----------|----------|--------|------|
| `getAdBudgetStats` | `/getAdBudgetStats` | GET | Admin |
| `createMetaCampaign` | `/createMetaCampaign` | POST | Admin |
| `createGoogleCampaign` | `/createGoogleCampaign` | POST | Admin |
| `createLinkedInCampaign` | `/createLinkedInCampaign` | POST | Admin |

### Headshot Sourcing

| Function | Endpoint | Method | Auth |
|----------|----------|--------|------|
| `discoverHeadshotProspects` | `/discoverHeadshotProspects` | POST | Admin |
| `importHeadshotProspectsCSV` | `/importHeadshotProspectsCSV` | POST | Admin |
| `getHeadshotProspects` | `/getHeadshotProspects` | GET | Admin |

---

## Test Commands

### Base URL
```
https://us-central1-yellowcircle-app.cloudfunctions.net
```

### Admin Token (from Firebase config)
```bash
# Get current admin token
firebase functions:config:get admin.token
```

---

## AI Image Generation Tests

### Test 1: Free Tier (SVG Placeholder)
```bash
curl -s -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/generateImage" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"professional business headshot","tier":"free","dimensions":{"width":512,"height":512}}'
```

**Expected:** SVG data URL with placeholder image

### Test 2: Standard Tier (No API Key - Falls Back to Free)
```bash
curl -s -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/generateImage" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"modern tech startup office","tier":"standard","dimensions":{"width":1024,"height":1024}}'
```

**Expected:** Fallback to free tier with message about API key not configured

### Test 3: Get Usage Stats
```bash
curl -s -X GET "https://us-central1-yellowcircle-app.cloudfunctions.net/getImageGenUsage" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

**Expected:** Monthly budget stats, tier pricing info

---

## Programmatic Ads Tests

### Test 4: Get Ad Budget Stats
```bash
curl -s -X GET "https://us-central1-yellowcircle-app.cloudfunctions.net/getAdBudgetStats" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

**Expected:** Budget caps ($100 total, $35/platform), platform configuration status

### Test 5: Create Meta Campaign (Not Configured)
```bash
curl -s -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/createMetaCampaign" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"name":"Test Campaign","dailyBudget":10}'
```

**Expected:** "Meta API not configured" message with setup instructions

### Test 6: Create Google Campaign (Not Configured)
```bash
curl -s -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/createGoogleCampaign" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"name":"Test Google Campaign","dailyBudget":10}'
```

**Expected:** "Google Ads API not configured" message

### Test 7: Create LinkedIn Campaign (Not Configured)
```bash
curl -s -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/createLinkedInCampaign" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"name":"Test LinkedIn Campaign","dailyBudget":10}'
```

**Expected:** "LinkedIn Marketing API not configured" message

---

## Headshot Sourcing Tests

### Test 8: Discover Headshot Prospects (Dry Run)
```bash
curl -s -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/discoverHeadshotProspects" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"lat":37.7749,"lng":-122.4194,"industries":"high","maxResults":10,"dryRun":true}'
```

**Expected:** List of discovered prospects (law firms, real estate, financial advisors)

### Test 9: Import Headshot Prospects CSV (Dry Run)
```bash
curl -s -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/importHeadshotProspectsCSV" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{
    "prospects":[
      {"company":"Smith Law Firm","industry":"law_firm","email":"contact@smithlaw.com"},
      {"company":"Jones Real Estate","industry":"real_estate_agency"}
    ],
    "dryRun":true
  }'
```

**Expected:** 2 prospects imported (dry run)

### Test 10: Get Headshot Prospects
```bash
curl -s -X GET "https://us-central1-yellowcircle-app.cloudfunctions.net/getHeadshotProspects?status=all&limit=10" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

**Expected:** List of stored prospects with stats

---

## Integration Tests

### Test 11: Full Headshot Discovery Flow
```bash
# Step 1: Discover prospects (store them)
curl -s -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/discoverHeadshotProspects" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"lat":37.7749,"lng":-122.4194,"industries":"high","maxResults":5,"dryRun":false}'

# Step 2: Retrieve stored prospects
curl -s -X GET "https://us-central1-yellowcircle-app.cloudfunctions.net/getHeadshotProspects?status=new" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

### Test 12: Full CSV Import Flow
```bash
# Step 1: Import prospects
curl -s -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/importHeadshotProspectsCSV" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{
    "prospects":[
      {"company":"Test Law Partners","industry":"law_firm","email":"test@lawpartners.com","name":"John Smith"}
    ],
    "dryRun":false
  }'

# Step 2: Verify in Firestore
curl -s -X GET "https://us-central1-yellowcircle-app.cloudfunctions.net/getHeadshotProspects?status=new&industry=law_firm" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

---

## Validation Checklist

### AI Image Generation
- [ ] Free tier returns SVG placeholder
- [ ] Standard tier falls back to free when no API key
- [ ] Premium tier falls back to free when no API key
- [ ] Usage stats endpoint returns correct budget info
- [ ] Error handling works correctly

### Programmatic Ads
- [ ] Budget stats show $100 total cap
- [ ] Budget stats show $35/platform caps
- [ ] Meta campaign returns "not configured" message
- [ ] Google campaign returns "not configured" message
- [ ] LinkedIn campaign returns "not configured" message
- [ ] Budget tracking increments correctly when campaigns created

### Headshot Sourcing
- [ ] Discovery finds businesses in target industries
- [ ] Quality scoring ranks prospects correctly
- [ ] CSV import validates required fields
- [ ] Duplicate detection works
- [ ] Get prospects filters work (status, industry, priority)
- [ ] Stats aggregation is correct

---

## API Keys to Configure (Future)

### AI Image Generation
```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

### Programmatic Ads
```bash
# Meta
firebase functions:config:set meta.app_id="YOUR_APP_ID"
firebase functions:config:set meta.app_secret="YOUR_APP_SECRET"
firebase functions:config:set meta.access_token="YOUR_ACCESS_TOKEN"

# Google Ads
firebase functions:config:set googleads.developer_token="YOUR_DEV_TOKEN"
firebase functions:config:set googleads.client_id="YOUR_CLIENT_ID"
firebase functions:config:set googleads.client_secret="YOUR_CLIENT_SECRET"
firebase functions:config:set googleads.refresh_token="YOUR_REFRESH_TOKEN"

# LinkedIn
firebase functions:config:set linkedin.client_id="YOUR_CLIENT_ID"
firebase functions:config:set linkedin.client_secret="YOUR_CLIENT_SECRET"
firebase functions:config:set linkedin.access_token="YOUR_ACCESS_TOKEN"
```

---

## Known Issues

1. **Geocoding API**: May need to enable Geocoding API on Google Cloud Console for location string searches. Use lat/lng coordinates as workaround.

2. **Google Places Types**: Some industry types may not match Google Places types exactly. Use the supported types in HEADSHOT_INDUSTRIES config.

3. **Budget Tracking**: Currently tracks allocated budget, not actual spend. Actual spend tracking requires API webhooks.

---

## Quick Test Script

Save as `test-new-functions.sh`:

```bash
#!/bin/bash

BASE_URL="https://us-central1-yellowcircle-app.cloudfunctions.net"
ADMIN_TOKEN="YOUR_ADMIN_TOKEN"

echo "=== Testing AI Image Generation ==="
echo "1. Free tier test..."
curl -s -X POST "$BASE_URL/generateImage" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","tier":"free"}' | jq '.success,.tier'

echo "2. Usage stats..."
curl -s -X GET "$BASE_URL/getImageGenUsage" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq '.month,.remaining'

echo ""
echo "=== Testing Programmatic Ads ==="
echo "3. Budget stats..."
curl -s -X GET "$BASE_URL/getAdBudgetStats" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq '.budget.monthly_total_cap,.platformStatus'

echo ""
echo "=== Testing Headshot Sourcing ==="
echo "4. Discovery (dry run)..."
curl -s -X POST "$BASE_URL/discoverHeadshotProspects" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"lat":37.7749,"lng":-122.4194,"industries":"high","maxResults":5,"dryRun":true}' | jq '.discovered,.byPriority'

echo ""
echo "=== All tests complete ==="
```

---

## Next Steps After Testing

1. **Configure API Keys** - Set up Gemini, Meta, Google Ads, LinkedIn as needed
2. **Enable Geocoding API** - For location string searches
3. **Run Production Tests** - With real data, not dry runs
4. **Monitor Usage** - Check api_usage collection in Firestore
5. **Document Results** - Update this file with any findings
