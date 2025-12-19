# LinkedIn Marketing API Walkthrough (December 2025)

## Executive Summary

The **LinkedIn Marketing API** enables programmatic ad campaign management, targeting, and analytics. Unlike Sales Navigator (which requires SNAP partnership and is paused for new applicants), the **Marketing/Advertising API is accessible** through standard application process.

---

## LinkedIn Marketing API Overview

### Purpose
Programmatically create, manage, and optimize LinkedIn advertising campaigns at scale for B2B marketing and audience targeting.

### Key Capabilities

| API | Purpose |
|-----|---------|
| **Advertising API** | Create campaigns, manage creatives, set budgets |
| **Campaign Management** | Configure targeting, objectives, schedules |
| **Ad Analytics** | Pull performance metrics and reporting |
| **Lead Sync** | Automate lead form delivery |
| **Conversions API** | Track offline/online attribution |
| **Matched Audiences** | Create custom audience segments |

---

## Getting Access

### Application Process

1. **Create LinkedIn App**: [developer.linkedin.com](https://developer.linkedin.com)
2. **Add Advertising API product** to your app
3. **Complete access form** under My Apps > Products
4. **Approval timeline**: Days to weeks (not months like SNAP)

### Permission Scopes Required

| Scope | Purpose |
|-------|---------|
| `r_ads` | Read ad account data |
| `rw_ads` | Read/write ad campaigns |
| `r_organization_social` | Read org page data |
| `w_organization_social` | Post sponsored content |

### Roles Required

- **Ad Account**: VIEWER, ANALYST, CAMPAIGN_MANAGER, or ADMIN
- **Organization**: DIRECT_SPONSORED_CONTENT_POSTER or ADMINISTRATOR

---

## Ad Types Supported

| Type | Description |
|------|-------------|
| **Sponsored Content** | Native ads in feed (images, videos, carousels) |
| **Sponsored InMail** | Direct messages to target audience |
| **Text Ads** | Sidebar/top banner ads |
| **Dynamic Ads** | Personalized ads (Spotlight, Follower, Jobs) |
| **Video Ads** | In-feed video content |
| **Carousel Ads** | Multi-image swipeable ads |

---

## API Endpoints

### Campaign Management

```
POST https://api.linkedin.com/rest/adAccounts/{adAccountID}/adCampaigns
```

**Campaign Types**:
- `SPONSORED_UPDATES` - Feed ads
- `SPONSORED_INMAILS` - Message ads
- `TEXT_AD` - Sidebar ads

### Creative Management

```
POST https://api.linkedin.com/rest/adCreatives
```

**Limits**:
- Max 15,000 creatives per Ad Account
- Max 100 creatives per campaign

### Targeting

```
GET https://api.linkedin.com/rest/adTargetingFacets
```

**Minimum audience**: 300 members

---

## Pricing

**API Access**: Free (no API fees)
**Ad Spend**: Pay for impressions/clicks (standard LinkedIn Ads pricing)

| Metric | Typical Cost |
|--------|--------------|
| CPM | $6-12 |
| CPC | $5-10 |
| Cost per Lead | $30-80 |

---

## Integration with yellowCircle

### Use Case: Programmatic Ad Distribution

1. **UnitySTUDIO generates creative** → Export dimensions for LinkedIn
2. **API creates campaign** → Targeting based on contact segments
3. **Lead forms sync** → Leads flow into contacts collection
4. **Analytics tracked** → ROI measured per campaign

### Implementation Steps

**Phase 1: Setup**
```javascript
// functions/ads/linkedinAdsManager.js
const LINKEDIN_API_BASE = 'https://api.linkedin.com/rest';

async function createCampaign(adAccountId, campaignData) {
  const response = await fetch(
    `${LINKEDIN_API_BASE}/adAccounts/${adAccountId}/adCampaigns`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202411'
      },
      body: JSON.stringify(campaignData)
    }
  );
  return response.json();
}
```

**Phase 2: Lead Sync**
- Connect Lead Gen Forms to webhook
- Auto-create contacts from form submissions
- Assign to Pipeline A or B based on form source

**Phase 3: Analytics**
- Pull campaign performance daily
- Store in Firestore for dashboard
- Calculate ROI by contact source

---

## Required API Keys

```bash
# LinkedIn Marketing API
firebase functions:config:set linkedin.client_id="PLACEHOLDER"
firebase functions:config:set linkedin.client_secret="PLACEHOLDER"
firebase functions:config:set linkedin.access_token="PLACEHOLDER"
firebase functions:config:set linkedin.ad_account_id="PLACEHOLDER"
```

---

## Comparison: Marketing API vs Sales Navigator API

| Aspect | Marketing API | Sales Navigator (SNAP) |
|--------|---------------|------------------------|
| Access | Open application | Partnership required |
| Status | **Available** | **Paused for new partners** |
| Purpose | Paid ads | Lead data/prospecting |
| Timeline | Days-weeks | Months (if reopens) |
| Cost | Ad spend only | Enterprise pricing |

---

## Resources

- [LinkedIn Marketing API Docs](https://learn.microsoft.com/en-us/linkedin/marketing/)
- [Campaign Management Guide](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/getting-started)
- [Developer Portal](https://developer.linkedin.com/product-catalog/marketing)
- [API Status Dashboard](https://developer.linkedin.com/)
- [Marketing Partner Program](https://business.linkedin.com/marketing-solutions/marketing-partners)

---

## Key Takeaways

1. **Marketing API is accessible** - Standard application process (not like SNAP)
2. **No API fees** - Only pay for ad spend
3. **Full campaign control** - Create, manage, optimize programmatically
4. **Lead Sync available** - Automate lead form delivery to CRM
5. **Integrates with UnitySTUDIO** - Export creatives at correct dimensions

---

*Document updated: December 19, 2025*
*For yellowCircle programmatic ad distribution*
