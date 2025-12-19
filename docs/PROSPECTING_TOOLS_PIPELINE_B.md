# Prospecting & Enrichment Tools for Pipeline B (December 2025)

## Executive Summary

Pipeline B (Digital-First prospects) requires startup/growth company discovery sources. This document covers **free/open-source APIs** and **inexpensive tools** for automated prospecting.

---

## Tier 1: Free/Open Source APIs

### 1. YC-OSS API (Y Combinator Companies)
**Best for**: Digital-first, VC-backed startup discovery

| Attribute | Value |
|-----------|-------|
| **Cost** | Free |
| **Companies** | 5,584+ |
| **Update Frequency** | Daily |
| **Data Source** | YC Algolia index |

**Endpoints**:
```
https://yc-oss.github.io/api/companies/all.json    # All companies
https://yc-oss.github.io/api/batches/winter-2025.json  # By batch
https://yc-oss.github.io/api/industries/fintech.json   # By industry
https://yc-oss.github.io/api/tags/ai.json              # By tag
```

**Data Fields**:
- Company name, slug, website, logo
- One-liner and long description
- Team size, launch date, status
- Industry, batch, tags, regions

**GitHub**: [yc-oss/api](https://github.com/yc-oss/api)

### 2. Product Hunt API
**Best for**: New product launches, maker community

| Attribute | Value |
|-----------|-------|
| **Cost** | Free (with API key) |
| **Access** | OAuth 2.0 |
| **Format** | GraphQL |

**Features**:
- Posts of the day
- Category filtering
- User/maker data
- Comments and engagement

**Docs**: [api.producthunt.com/v2/docs](https://api.producthunt.com/v2/docs)

### 3. Growjo API
**Best for**: Fast-growing companies (30-1000 employees)

| Attribute | Value |
|-----------|-------|
| **Cost** | Currently free |
| **Companies** | 10,000+ |
| **Criteria** | 20%+ growth, 30-1000 employees |

**Endpoint**:
```
GET https://growjo.com/api?url=company_url&api_key=YOUR_KEY
```

**Data Fields**:
- Estimated revenue
- Accelerator/investors
- Job openings count
- Growth indicators

**Note**: May monetize later - use while free

### 4. OpenCorporates API
**Best for**: Company registration data

| Attribute | Value |
|-----------|-------|
| **Cost** | Free tier available |
| **Coverage** | 200M+ companies, 140 jurisdictions |

**Free Tier Limits**: 500 requests/month

---

## Tier 2: Freemium APIs

### 5. Apollo.io
**Best for**: B2B contact database

| Plan | Cost | Credits |
|------|------|---------|
| Free | $0 | 1,200/month |
| Basic | $49/mo | 5,000/month |

**Features**:
- 220M+ contacts
- 30M+ companies
- LinkedIn Chrome extension
- Email verification

**API**: Available on paid plans

### 6. Hunter.io (Currently Used)
**Best for**: Email discovery by domain

| Plan | Cost | Searches |
|------|------|----------|
| Free | $0 | 50/month |
| Starter | $34/mo | 500/month |

**API Endpoints**:
- Domain Search
- Email Finder
- Email Verifier

### 7. People Data Labs
**Best for**: Bulk enrichment

| Pricing | Cost |
|---------|------|
| Per record | $0.01-0.05 |
| Minimum | Pay as you go |

**Data Fields**: 1,500+ attributes per person/company

### 8. Clearbit (now HubSpot)
**Best for**: Real-time enrichment

| Plan | Cost |
|------|------|
| Free tier | Limited |
| Growth | Contact sales |

---

## Tier 3: GitHub Open Source Tools

### 9. Email Discovery Tools

**theHarvester** - Email/subdomain gathering
```bash
pip install theharvester
theHarvester -d company.com -b google
```

**EmailHunter alternatives on GitHub**:
- `mxrch/GHunt` - Google account lookup
- `laramies/theHarvester` - Multi-source OSINT

### 10. Company Data Scrapers

**Google Maps Scraper** (for local businesses)
```bash
# Various Python implementations on GitHub
# Use Google Places API for legitimate access
```

**LinkedIn Scrapers** (use with caution - ToS risk)
- Browser automation tools
- Proxy rotation required

---

## Recommended Pipeline B Stack

### Discovery Layer

| Source | Type | Best For |
|--------|------|----------|
| **YC-OSS API** | Free | Tech startups, VC-backed |
| **Product Hunt** | Free | New launches, B2C/B2B |
| **Growjo** | Free | High-growth SMBs |
| **Google Places** | Freemium | Local service businesses |

### Enrichment Layer

| Tool | Type | Use Case |
|------|------|----------|
| **Hunter.io** | Freemium | Email discovery |
| **PDL** | Pay-per-use | Bulk enrichment |
| **Apollo.io** | Freemium | Contact + company |
| **Clearbit** | Enterprise | Real-time enrichment |

### Verification Layer

| Tool | Purpose |
|------|---------|
| **NeverBounce** | Email verification |
| **ZeroBounce** | Email validation |
| **Hunter Verify** | Included with Hunter |

---

## Implementation: Update discoverPipelineB

### Replace Mock Data with Real APIs

```javascript
// Updated discoverPipelineB sources

// 1. YC-OSS API (free, daily updated)
const YC_API = 'https://yc-oss.github.io/api';

async function fetchYCCompanies(filters = {}) {
  const { batch, industry, tag, limit = 50 } = filters;

  let url = `${YC_API}/companies/all.json`;
  if (batch) url = `${YC_API}/batches/${batch}.json`;
  if (industry) url = `${YC_API}/industries/${industry}.json`;
  if (tag) url = `${YC_API}/tags/${tag}.json`;

  const response = await fetch(url);
  const companies = await response.json();

  return companies.slice(0, limit).map(c => ({
    source: 'yc_oss',
    sourceId: `yc_${c.slug}`,
    companyName: c.name,
    website: c.website,
    pipeline: 'B',
    rawData: {
      description: c.long_description || c.one_liner,
      batch: c.batch,
      industry: c.industry,
      tags: c.tags,
      teamSize: c.team_size,
      status: c.status
    }
  }));
}

// 2. Growjo API (free for now)
async function fetchGrowjoCompanies(limit = 50) {
  // Growjo provides exported list - can be imported
  // API requires key registration
  const response = await fetch(
    `https://growjo.com/api/companies?limit=${limit}&api_key=${GROWJO_KEY}`
  );
  return response.json();
}

// 3. Product Hunt API (GraphQL)
async function fetchProductHuntLaunches(daysBack = 7) {
  const query = `
    query {
      posts(first: 50, order: VOTES) {
        edges {
          node {
            id
            name
            tagline
            website
            votesCount
            makers { name email }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  return response.json();
}
```

---

## Cost Comparison

| Stack | Monthly Cost | Companies/Month |
|-------|--------------|-----------------|
| **Free Only** | $0 | 500-1000 |
| **Freemium Mix** | $50-100 | 2000-5000 |
| **Growth Stack** | $200-500 | 10000+ |

### Free Stack (Recommended Start)
- YC-OSS API: 5,500+ companies
- Growjo: 10,000 companies
- Product Hunt: Daily launches
- Hunter Free: 50 enrichments

### Growth Stack (Scale)
- Apollo Basic: $49/mo
- Hunter Starter: $34/mo
- PDL Pay-per-use: ~$50/mo
- **Total**: ~$133/mo

---

## API Keys Needed

```bash
# Pipeline B Discovery
firebase functions:config:set growjo.api_key="PLACEHOLDER"
firebase functions:config:set producthunt.token="PLACEHOLDER"

# Already configured
# hunter.api_key - configured
# pdl.api_key - configured
# apollo.api_key - configured (but free tier blocked people search)
```

---

## Next Steps

1. **Integrate YC-OSS API** into discoverPipelineB (free, no key needed)
2. **Register for Growjo API** while still free
3. **Apply for Product Hunt API access**
4. **Test enrichment cascade** with new sources
5. **Monitor API limits** and costs

---

## Resources

- [YC-OSS API GitHub](https://github.com/yc-oss/api)
- [Product Hunt API Docs](https://api.producthunt.com/v2/docs)
- [Growjo Company API](https://growjo.com/company_data_api)
- [Hunter.io API](https://hunter.io/api-documentation)
- [Apollo.io API](https://apolloio.github.io/apollo-api-docs/)
- [People Data Labs](https://docs.peopledatalabs.com/)

---

*Document created: December 19, 2025*
*For yellowCircle Pipeline B infrastructure*
