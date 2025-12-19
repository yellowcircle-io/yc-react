# yellowCircle Google Ads API Tool Design Document

**Company:** yellowCircle (yellowcircle.io)
**Contact:** christopher@yellowcircle.io
**Date:** December 19, 2025
**Version:** 1.0

---

## 1. Tool Overview

yellowCircle is a boutique marketing operations platform serving founder-led B2B service companies and early-stage tech startups. Our Google Ads integration enables automated campaign creation and management for qualified leads generated through our marketing automation system.

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    yellowCircle Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Contact    │    │   Campaign   │    │   Budget     │   │
│  │   Database   │───▶│   Builder    │───▶│   Manager    │   │
│  │  (Firestore) │    │  (Internal)  │    │  ($35/mo cap)│   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                              │                               │
│                              ▼                               │
│                    ┌──────────────────┐                      │
│                    │  Google Ads API  │                      │
│                    │   Integration    │                      │
│                    └────────┬─────────┘                      │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  Google Ads API  │
                    │   (Display/PM)   │
                    └──────────────────┘
```

## 3. Technical Implementation

### 3.1 Backend (Firebase Cloud Functions)

- **Runtime:** Node.js 18 on Google Cloud Functions
- **Authentication:** OAuth 2.0 with refresh token
- **API Version:** Google Ads API v18

### 3.2 Core Functions

| Function | Purpose |
|----------|---------|
| `createGoogleCampaign` | Creates Display/Performance Max campaigns |
| `getAdBudgetStats` | Tracks spend against monthly caps |
| `pauseCampaign` | Pauses campaigns when budget reached |

### 3.3 Campaign Types Supported

1. **Display Network Campaigns**
   - Retargeting website visitors
   - Lookalike audiences based on converters

2. **Performance Max Campaigns**
   - Automated cross-channel optimization
   - Lead generation objectives

## 4. Budget Controls

| Control | Value |
|---------|-------|
| Monthly platform cap | $100 |
| Per-platform cap (Google) | $35 |
| Minimum campaign budget | $5/day |
| Auto-pause on cap | Yes |

## 5. User Flow

1. Admin creates campaign in yellowCircle dashboard
2. System validates budget availability
3. Campaign created via Google Ads API
4. Daily spend tracked and reported
5. Auto-pause when monthly cap reached

## 6. Data Handling

- **PII:** No customer PII sent to Google Ads
- **Targeting:** Uses first-party website visitor data only
- **Storage:** Campaign IDs stored in Firestore
- **Retention:** Campaign data retained for reporting

## 7. Access Control

- Internal use only (yellowCircle admin users)
- Firebase Authentication required
- Admin whitelist verification
- No external/public access

## 8. Compliance

- GDPR compliant (EU user consent)
- CCPA compliant (CA user rights)
- Google Ads policies followed
- No prohibited content categories

---

**Contact for Questions:**
Christopher Cooper
christopher@yellowcircle.io
yellowcircle.io
