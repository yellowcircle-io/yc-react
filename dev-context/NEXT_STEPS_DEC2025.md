# Next Steps - December 2025

**Date:** December 19, 2025
**Status:** Platform Enhancements Sprint Complete - Ready for Outbound Launch
**Days Since Rho Exit:** 24 (Nov 25, 2025)

---

## Current State Summary

### Completed This Sprint (Dec 16-19)

| Feature | Status | Details |
|---------|--------|---------|
| Firebase Auth SSO | ✅ Done | 25+ admin functions updated, hybrid auth |
| AI Image Generation | ✅ Done | Free tier + $20/mo cap |
| Programmatic Ads | ✅ Done | Meta/LinkedIn/Google ($100/mo cap) |
| Headshot Sourcing | ✅ Done | CSV import + Google Places discovery |
| Claude Code Autonomous | ✅ Done | Setup guide + automation script |
| Test Documentation | ✅ Done | TESTING_PREPARATION_DEC2025.md |

### System Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Firebase Hosting | ✅ Live | yellowcircle.io |
| n8n (Railway) | ✅ Live | n8n-production-9ef7.up.railway.app |
| Cloud Functions | ✅ 36+ deployed | All new functions tested |
| Resend ESP | ✅ Configured | Email delivery operational |
| Admin Auth | ✅ Hybrid | Firebase SSO + legacy tokens |

---

## Immediate Next Steps (This Week)

### P1: Infrastructure & Preparation

#### 1. Automate Contact Import
**Status:** Ready to execute
**Reference:** `OUTBOUND_50_CONTACTS_PLAN.md`

**Discovery Options:**
- **Pipeline A:** 25 traditional (Google Places) - accounting, marketing, consulting
- **Pipeline B:** 25 digital-first (YC GitHub + Growjo) - non-SaaS tech, agencies
- **Manual:** LinkedIn Sales Navigator + company research

**Enrichment Cascade (automatic after import):**
```
PDL (100 free/mo) → Hunter (25 free/mo) → Apollo (paid, LAST resort)
```

**Execute:**
```bash
# Bulk import contacts
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/bulkImportContacts" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"contacts": [...], "source": "outbound"}'

# Enrich a contact (uses cascade: PDL > Hunter > Apollo)
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/cascadeEnrich" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -d '{"email": "user@company.com", "updateContact": true}'
```

#### 2. Configure API Keys
**Status:** Needed for paid tiers

**AI Image Generation (Gemini - NOT CONFIGURED):**
```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
# Currently: Free tier only (SVG placeholders)
# After config: Imagen 3 ($0.03) + Gemini Pro ($0.13)
```

**Programmatic Ads:**
```bash
firebase functions:config:set meta.app_id="YOUR_APP_ID"
firebase functions:config:set meta.app_secret="YOUR_APP_SECRET"
firebase functions:config:set meta.access_token="YOUR_ACCESS_TOKEN"
firebase functions:config:set googleads.developer_token="YOUR_TOKEN"
firebase functions:config:set linkedin.client_id="YOUR_CLIENT_ID"
```

#### 3. Test New Functions
**Status:** Ready
**Reference:** `dev-context/TESTING_PREPARATION_DEC2025.md`

Run validation tests for:
- AI Image Generation (free tier works, paid needs Gemini key)
- Programmatic Ads budget stats
- Headshot Sourcing discovery

#### 4. Prepare Ads
**Status:** Infrastructure ready, needs API keys
**Budget:** $100/mo total, $35/platform cap

Platforms ready (pending API config):
- Meta (Facebook/Instagram)
- Google Ads
- LinkedIn Marketing

#### 5. Claude Code Autonomous Setup
**Status:** Documentation complete
**Next:** Install Sleepless Agent on Mac Mini

Steps remaining:
- [ ] Install Sleepless Agent
- [ ] Configure Slack app
- [ ] Create initial automation scripts
- [ ] Set up cron jobs for scheduled tasks
- [ ] Test end-to-end workflow

---

### P2: Launch Motions

#### 1. Launch Paid & Outbound Campaigns
**Status:** Waiting on P1 completion
**Throttle:** 10/day for outbound to protect domain reputation

**Outbound Strategy:**
- Random 1-of-3 email (A/B/C test), NOT sequential drip
- Email verification before send
- Follow-up ONLY if engaged (clicked, replied, booked)

**Paid Ads Strategy:**
- Start with Meta (best B2B reach)
- Test creative via UnitySTUDIO
- Monitor spend against $35/platform cap

---

### P3: Next Week / Afterwards

#### 1. Firestore Security Rules
**Status:** Documented as needed

Rules to harden:
- Rate limiting per user
- Admin-only collection access
- Field-level validation

#### 2. Dynamic Newsletter
**Status:** Scoped, not started
**Scope:** LiveIntent/Movable Ink style live content

Features to implement:
- Standard sections with dynamic population
- Recent articles block
- Featured project block
- AI-generated summary block
- Contact-specific personalization

---

## Quick Reference

### Admin Functions Testing

```bash
BASE_URL="https://us-central1-yellowcircle-app.cloudfunctions.net"
ADMIN_TOKEN="YOUR_ADMIN_TOKEN"

# Test AI Image Generation (Free Tier)
curl -s -X POST "$BASE_URL/generateImage" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","tier":"free"}' | jq '.success,.tier'

# Test Budget Stats
curl -s -X GET "$BASE_URL/getAdBudgetStats" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq '.budget'

# Test Headshot Discovery
curl -s -X POST "$BASE_URL/discoverHeadshotProspects" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"lat":37.7749,"lng":-122.4194,"industries":"high","maxResults":5,"dryRun":true}'
```

### Key URLs

- **Production:** https://yellowcircle.io
- **Firebase Console:** https://console.firebase.google.com/project/yellowcircle-app
- **n8n:** https://n8n-production-9ef7.up.railway.app

### Key Files

- **Test Commands:** `dev-context/TESTING_PREPARATION_DEC2025.md`
- **Sprint Status:** `.claude/shared-context/ACTIVE_SPRINT.md`
- **Claude Autonomous:** `.claude/CLAUDE_CODE_AUTONOMOUS_SETUP.md`
- **Roadmap:** `dev-context/PROJECT_ROADMAP_NOV2025.md`

---

## Revenue Targets (60-Day Plan)

**Current Position:** Day 24 of 60
**Target:** $15K-20K by Day 60 (Jan 23, 2026)

| Week | Focus | Target |
|------|-------|--------|
| Week 4 (now) | Import contacts, launch outbound | 50 contacts imported |
| Week 5 | Monitor deliverability, first responses | 5-10 replies |
| Week 6 | Discovery calls, close first engagement | $4K-8K |
| Week 7-8 | Scale successful approach | $8K-12K additional |

---

## Machine Sync Checklist

Before switching machines:
- [ ] Update `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
- [ ] Update machine-specific instance log
- [ ] Commit and push changes to GitHub
- [ ] Wait 30 seconds for Dropbox sync

Before starting work:
- [ ] Run `./.claude/verify-sync.sh`
- [ ] Pull latest from GitHub if needed
- [ ] Check `WIP_CURRENT_CRITICAL.md` for context

---

**Last Updated:** December 19, 2025
**Next Review:** December 23, 2025
**Owner:** Christopher Cooper
**Version:** 1.0
