# Remaining User Actions

**Document Created:** December 17, 2025
**Purpose:** Required user actions to complete dual-project implementation

---

## CURRENT STATUS

### API Test Results (Pre-Deployment)
```
Passed:  2
Failed:  5 (expected - functions not deployed)
Skipped: 6
```

**Note:** Status 0 errors indicate the Firebase functions have not been deployed yet. This is expected. Once deployed, tests should pass.

### Front-End Status
- All 6 new component files created and verified ✅
- Build passes without errors ✅
- Components not yet integrated into UnityStudioCanvas (integration is next step)

---

## CRITICAL: API Keys Required

The following API keys must be configured in Firebase Functions before the discovery functions will work:

### 1. Google Places API Key ✅ (Ready to Configure)

**Required for:** `discoverPipelineA` (traditional business discovery)

**API Key:** ⚠️ ROTATED - Get new key from Google Cloud Console (mineral-oxide-466301-i7)

**Steps:**
1. Re-authenticate Firebase (auth expired):
   ```bash
   firebase login --reauth
   ```
2. Get new API key from: https://console.cloud.google.com/apis/credentials
3. Configure Firebase:
   ```bash
   firebase functions:config:set googleplaces.api_key="YOUR_NEW_API_KEY"
   ```

**Cost:** Free tier includes 10,000 requests/month

---

### 2. Y Combinator Data (No API Key Needed)

**Required for:** `discoverPipelineB` (digital-first discovery)

**Source:** Y Combinator public data via GitHub
- No API key required
- Uses public YC companies data
- Already configured in functions

---

### 3. Growjo Data (No API Key Needed)

**Required for:** `discoverPipelineB` (growth company discovery)

**Source:** Growjo public data
- No API key required
- Scrapes public growth data
- Already configured in functions

---

## Deployment Steps

After configuring API keys, deploy the Firebase functions:

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:discoverPipelineA,functions:discoverPipelineB,functions:collectSignals,functions:filterPEBacked,functions:scorePipelines
```

---

## Testing Checklist

### Front-End Tests (Playwright)

```bash
# Install Playwright browsers (if not already installed)
npx playwright install

# Run all front-end tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/unity-studio.spec.js
npx playwright test tests/e2e/contact-dashboard.spec.js

# Run with UI
npx playwright test --ui

# Run in headed mode
npx playwright test --headed
```

### Back-End Tests (API)

```bash
# Run API tests
node tests/api/pipeline-functions.test.js

# With custom admin token
ADMIN_TOKEN=your-token node tests/api/pipeline-functions.test.js
```

---

## Verification Endpoints

Test the deployed functions manually:

### Test discoverPipelineA
```bash
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/discoverPipelineA" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{
    "location": "San Francisco, CA",
    "industry": "technology",
    "limit": 5,
    "dryRun": true
  }'
```

### Test discoverPipelineB
```bash
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/discoverPipelineB" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{
    "sources": ["crunchbase", "producthunt"],
    "limit": 5,
    "dryRun": true
  }'
```

### Test collectSignals
```bash
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/collectSignals" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{
    "companyDomain": "stripe.com",
    "dryRun": true
  }'
```

### Test filterPEBacked
```bash
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/filterPEBacked" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{
    "signals": {
      "fundingHistory": {
        "noFundingRecorded": true,
        "peVcInvestorTagsPresent": false
      },
      "websiteLanguage": {
        "bootstrappedInDescription": true,
        "portfolioCompanyMention": false
      }
    }
  }'
```

### Test scorePipelines
```bash
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/scorePipelines" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{
    "signals": {
      "fundingHistory": {
        "noFundingRecorded": true
      },
      "hiring": {
        "employeeCountUnder50": true
      }
    }
  }'
```

---

## UI Verification

### Contact Dashboard
1. Navigate to `/admin/contacts`
2. Verify pipeline filter dropdown appears
3. Test filtering by Pipeline A, Pipeline B, PE Excluded
4. Click a contact to verify PE Signals panel appears
5. Check that modal expands when showing PE signals

### UnitySTUDIO (within Unity Notes)
1. Navigate to `/unity-notes`
2. Verify UnitySTUDIO components are accessible
3. Verify platform dimension selectors appear
4. Test CreativeCanvas drag-and-drop
5. Test background color selection
6. Test export functionality
7. Verify safe zone overlay toggle (for Stories)

---

## Files Created/Modified Summary

### New Files (6)
| File | Purpose |
|------|---------|
| `src/components/unity-studio/platform-specs.js` | Platform dimensions and text limits |
| `src/components/unity-studio/CreativeCanvas.jsx` | Visual canvas editor |
| `src/components/unity-studio/ExportManager.jsx` | Batch export manager |
| `src/components/unity-studio/useAIGeneration.js` | AI content generation hook |
| `src/components/admin/PipelineStatsCard.jsx` | Pipeline statistics card |
| `src/components/admin/PESignalsPanel.jsx` | PE signals display panel |

### Modified Files (3)
| File | Changes |
|------|---------|
| `functions/index.js` | Added 5 pipeline functions |
| `src/utils/firestoreContacts.js` | Extended schema |
| `src/pages/admin/ContactDashboardPage.jsx` | Pipeline filters + PE signals |

### Test Files (3)
| File | Purpose |
|------|---------|
| `playwright.config.js` | Playwright configuration |
| `tests/e2e/unity-studio.spec.js` | UnitySTUDIO E2E tests |
| `tests/e2e/contact-dashboard.spec.js` | Contact Dashboard E2E tests |
| `tests/api/pipeline-functions.test.js` | API function tests |

### Documentation Files (3)
| File | Purpose |
|------|---------|
| `dev-context/DUAL_PROJECT_IMPLEMENTATION_CHANGELOG.md` | Implementation changelog |
| `dev-context/REMAINING_USER_ACTIONS.md` | This file |
| `.claude/shared-context/ACTIVE_SPRINT.md` | Updated sprint status |

---

## Quick Reference Commands

```bash
# Check Firebase login
firebase login:list

# Re-authenticate if needed
firebase login --reauth

# Deploy functions
firebase deploy --only functions

# Deploy hosting
firebase deploy --only hosting

# Check function logs
firebase functions:log --only discoverPipelineA

# Run Playwright tests
npx playwright test

# Run API tests
node tests/api/pipeline-functions.test.js

# Build project
npm run build

# Start dev server
npm run dev
```

---

## Support Contacts

- Firebase Console: https://console.firebase.google.com/project/yellowcircle-app
- Google Cloud Console: https://console.cloud.google.com
- Crunchbase API: https://data.crunchbase.com/docs
- OpenCorporates API: https://api.opencorporates.com/documentation

---

## Component Integration (Next Step)

The new UnitySTUDIO components need to be integrated into the main canvas:

### Integration Steps:
1. Import components in `UnityStudioCanvas.jsx`:
   ```javascript
   import CreativeCanvas from './CreativeCanvas';
   import ExportManager from './ExportManager';
   import { useAIGeneration } from './useAIGeneration';
   ```

2. Add to AdCreativeBuilder as an enhanced mode option

3. Wire up export functionality to ExportManager

4. Connect AI generation to copy editing flows

---

## Success Criteria

The implementation is complete when:

1. [ ] Google Places API key configured in Firebase
2. [ ] Functions are deployed successfully
3. [ ] API tests pass (node tests/api/pipeline-functions.test.js)
4. [ ] Front-end tests pass (npx playwright test)
5. [ ] Contact Dashboard shows pipeline filters
6. [ ] PE Signals panel displays correctly
7. [ ] UnitySTUDIO renders platform dimensions (at /unity-notes)
8. [ ] Export Manager generates correct sizes
9. [ ] CreativeCanvas integrated into Unity Notes page
10. [ ] AI generation connected to copy editing
