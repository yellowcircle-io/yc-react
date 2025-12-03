# yellowCircle Overview

**A Strategic Consulting Practice + Digital Product Studio**

*Last Updated: December 2, 2025*

---

## For Humans: Quick Scan

### What is yellowCircle?

**yellowCircle** is a GTM (Go-To-Market) strategy and marketing operations consulting practice founded by Christopher Cooper. It combines:

1. **Consulting Services** - Strategic audits for B2B companies ($1.5K - $5K engagements)
2. **Digital Products** - Tools like Unity Notes (canvas-based workspace) and Outreach Generator
3. **Thought Leadership** - "Own Your Story" article series on marketing operations dysfunction

### The Problem We Solve

> "Stop buying tools to fix organizational problems."

Most B2B companies invest $50K-$200K/year in marketing technology while their teams struggle with:
- Role misalignment (marketing ops doing data analyst work)
- Technical debt ($2.5M+/year in hidden costs)
- Data architecture chaos (45-minute sync lags, 15% error rates)
- Attribution confusion (3+ implementations giving different answers)

### The Opportunity

- **$8.5B** marketing operations software market
- **53%** of marketing ops professionals report role misalignment
- **Only 11%** of companies successfully align marketing operations roles
- Post-COVID remote work has amplified GTM coordination challenges

---

## Brand Identity

| Element | Value |
|---------|-------|
| **Primary Color** | `#fbbf24` (Amber Yellow) |
| **Secondary** | Black (`#000000`) |
| **Voice** | Direct, confrontational, peer-to-peer |
| **Tagline** | "Growth Infrastructure Solutions" |
| **Domain** | yellowcircle.io |

### Core Values
- **Honesty over politeness** - We tell clients what they need to hear
- **Organizational solutions over tool purchases** - Fix the org chart first
- **Quantified impact** - Every recommendation has a dollar figure attached

---

## Service Offerings

| Service | Price Range | Duration |
|---------|-------------|----------|
| Growth Infrastructure Audit | $4,000 - $5,000 | 2-3 weeks |
| Marketing Systems Audit | $2,500 - $4,000 | 1-2 weeks |
| Hire-or-Build Assessment | $1,500 - $2,500 | 2-3 weeks |
| Technical Debt Quantification | $2,500 - $3,500 | 1-2 weeks |
| Attribution System Audit | $2,000 - $3,000 | 1-2 weeks |
| Data Architecture Assessment | $3,000 - $4,000 | 2-3 weeks |

---

## Digital Products

### Unity Notes
A canvas-based workspace for visual note-taking and idea organization.
- **Status:** Beta (web), App Store submission planned
- **Tech:** React, ReactFlow, Firebase, Cloudinary
- **Revenue Model:** Freemium (local-first free, cloud features paid)

### Outreach Generator
AI-powered cold email generation for B2B prospecting.
- **Status:** Live at yellowcircle.io/outreach
- **Tech:** React, Groq API (free tier), Resend
- **Revenue Model:** Free tool, drives consulting leads

### Growth Health Check
8-question assessment that scores marketing operations health.
- **Status:** Live at yellowcircle.io/assessment
- **Purpose:** Lead qualification and service matching

---

## Development Status

| Component | Status | Notes |
|-----------|--------|-------|
| Website (yellowcircle.io) | 90% Complete | Domain verification pending |
| Services Page | Complete | 7 offerings with pricing |
| Works/Portfolio | Complete | 11 company case studies |
| Article 1 | Complete | "Why Your GTM Sucks" (15,500 words) |
| Contact Forms | Complete | Web3Forms integration |
| Analytics | In Progress | GTM ready, GA4 crawling |
| Calendar Booking | Pending | Cal.com setup needed |
| Mobile Optimization | Planned | Testing on physical devices |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19.1, Vite 5.4, Tailwind CSS |
| **Hosting** | Firebase Hosting |
| **Forms** | Web3Forms (free tier) |
| **Email** | Resend (100 free/day) |
| **AI** | Groq API (14,400 free requests/day) |
| **Analytics** | Google Analytics 4, Google Tag Manager |
| **Design System** | Custom (COLORS, TYPOGRAPHY, EFFECTS constants) |

---

## Founder Background

**Christopher Cooper**
- 10+ years in marketing operations and technology
- Experience: LiveIntent, TuneCore, Rho, DoorDash, Reddit, Estee Lauder, YieldStreet
- Expertise: HubSpot, Salesforce, marketing automation, data architecture
- Based in New York

---

## For AI Agents: Structured Abstract

```yaml
entity:
  name: yellowCircle
  type: consulting_practice_and_digital_studio
  domain: yellowcircle.io
  founder: Christopher Cooper
  location: New York, USA
  founded: 2025

services:
  primary: GTM strategy and marketing operations consulting
  price_range: $1,500 - $5,000 per engagement
  target_market: B2B companies, Series A-C startups, enterprise marketing teams

products:
  - name: Unity Notes
    type: canvas_workspace_app
    status: beta
    monetization: freemium
  - name: Outreach Generator
    type: ai_email_tool
    status: live
    monetization: free_lead_generation
  - name: Growth Health Check
    type: assessment_quiz
    status: live
    monetization: lead_qualification

content:
  thought_leadership_series: "Own Your Story"
  flagship_article: "Why Your GTM Sucks: The Human Cost of Operations Theater"
  word_count: 15500
  publication_date: 2025-11

technology:
  frontend: [React, Vite, Tailwind]
  backend: [Firebase, Web3Forms, Resend]
  ai_integration: [Groq API]
  analytics: [GA4, GTM]

market_positioning:
  differentiator: "Organizational solutions over tool purchases"
  voice: "Confrontational honesty over polite consulting"
  key_metric_claims:
    - "$2.5M+ annual technical debt identified at client sites"
    - "90% workflow reduction achieved (300 to 30)"
    - "45-minute data lag identified and resolved"

contact:
  email: info@yellowcircle.io
  phone: "+1-914-241-5524"
  linkedin: linkedin.com/company/yellow-circle
  instagram: instagram.com/yellowcircle.io
```

---

## Human vs AI Contribution Notes

*This section documents the division of labor between the founder (Christopher Cooper) and AI assistance (Claude Code) to accurately represent capabilities and ensure transparency.*

### What Christopher (Self) Executed

**Strategic & Creative:**
- Brand positioning and voice definition
- Service offering design and pricing strategy
- Target market identification
- Case study content from real professional experience
- Client relationship strategies
- Revenue model decisions
- Thought leadership article conceptualization and core arguments

**Technical Architecture Decisions:**
- Technology stack selection
- Database architecture choices (Airtable vs Supabase vs MongoDB)
- Third-party service selection (Web3Forms, Resend, Groq, Cal.com)
- Hosting and deployment strategy (Firebase)
- Domain and DNS configuration (Cloudflare)

**Business Operations:**
- Calendly/Cal.com account setup
- Firebase project management
- Google Analytics property creation
- Prospect enrichment tool evaluation (Clay, Apollo.io)
- Paid ads budget allocation decisions

**Quality Control:**
- All visual design review and iteration
- Mobile UX testing on physical devices
- Content review and approval
- Brand consistency enforcement
- Final deployment approval

### What Claude Code Executed

**Frontend Development:**
- React component creation (40+ components)
- CSS styling and responsive design implementation
- Animation and interaction code (Lottie, scroll behaviors)
- Form validation and submission handling
- Routing configuration (RouterApp.jsx)

**System Integration:**
- Web3Forms API integration
- Cloudinary upload implementation
- Firebase Firestore queries
- UTM parameter tracking
- GTM/GA4 code implementation

**Documentation:**
- Technical documentation (WIP, Roadmap, this overview)
- Code comments and JSDoc
- Commit message generation
- Multi-machine sync framework

**Code Refactoring:**
- Component extraction and reuse
- Performance optimization suggestions
- Accessibility improvements
- Console.log cleanup

### Skills Demonstrated by Christopher

| Skill Category | Evidence |
|----------------|----------|
| **Product Management** | Defined MVP scope, prioritized features, created phased roadmap |
| **Marketing Strategy** | Identified target market, created positioning, planned content calendar |
| **Technical Literacy** | Evaluated tech stack options, made informed architecture decisions |
| **Project Management** | Managed multi-machine workflow, coordinated async development |
| **UX Sensibility** | Iterated on designs based on visual review, caught usability issues |
| **Business Acumen** | Priced services, evaluated cost/benefit of tools, planned revenue model |
| **Domain Expertise** | Leveraged 10+ years of marketing ops experience into product offerings |

### AI Limitations Observed

- Cannot test on physical mobile devices
- Cannot create Calendly/Cal.com accounts
- Cannot submit Firebase support tickets
- Cannot make subjective design decisions without human input
- Cannot access private APIs without credentials provided
- Cannot make business strategy decisions without human direction
- Cannot verify visual rendering matches intent

---

## Next Steps (December 2025)

1. **Immediate:** Cal.com setup, GTM implementation, favicon update
2. **Week 1:** Prospect database, notification pipeline
3. **Week 2:** Unity Notes optimization, Assessment → Services funnel
4. **Week 3:** Ads Generator, paid ads launch
5. **Week 4:** Mobile testing, PWA setup

---

*Document Version: 1.0*
*For questions: info@yellowcircle.io*
