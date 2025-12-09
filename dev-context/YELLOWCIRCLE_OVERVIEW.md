# yellowCircle Overview

**A Strategic Consulting Practice + Digital Product Studio**

*Last Updated: December 8, 2025*

---

## For Humans: Quick Scan

### What is yellowCircle?

**yellowCircle** is a GTM (Go-To-Market) strategy and marketing operations consulting practice founded by Christopher Cooper. It combines:

1. **Consulting Services** - Strategic audits for B2B companies ($1.5K - $5K engagements)
2. **Digital Products** - The **Unity Platform** ecosystem (UnityNOTES, UnityMAP, UnitySTUDIO)
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
| Creative + Operations | Custom | Project-based |
| Email Template Development | $500+ | Per template |

---

## Digital Products: The Unity Platform

### Unity Platform Overview

A 3-mode integrated campaign system for GTM operations:

| Mode | Purpose | Status |
|------|---------|--------|
| **UnityNOTES** | Visual noteboard + second brain | ✅ MVP Complete |
| **UnityMAP** | Email journey builder + campaign management | ✅ MVP Complete |
| **UnitySTUDIO** | Asset creation for GTM campaigns | ✅ MVP Complete |

### UnityNOTES (`/unity-notes`)

A canvas-based workspace for visual note-taking and idea organization.

**Features:**
- 5+ node types: Photo, Text, Link, AI Chat, Video (placeholder)
- AI-powered image analysis (describe, tags, OCR, location, creative)
- Drag-and-drop canvas with React Flow
- AI chat integration (Groq/OpenAI adapters)
- Export/Import JSON, Share URLs
- Firebase Firestore cloud backup (premium)

**Tech:** React, ReactFlow, Firebase, Cloudinary
**Revenue Model:** Freemium (local-first free, cloud features paid)

### UnityMAP Generator (`/experiments/outreach-generator`)

AI-powered cold email generation for B2B prospecting.

**Features:**
- 3-email sequence generation (Initial, Day 3, Day 10)
- Two modes: Prospect (cold) and MarCom (warm)
- Credit system: Free (3), API Key (10), Client (unlimited)
- Brand customization and variable placeholders
- Firebase Cloud Function proxy for free tier

**Tech:** React, Groq API (free tier), Firebase Functions
**Revenue Model:** Free tool, drives consulting leads + premium tiers

### UnityMAP Hub (`/outreach`)

Business email outreach platform with journey builder.

**Features:**
- Node-based workflow editor (5 node types)
  - Prospect, Email, Wait/Delay, Condition, Exit
- Email deployment via Resend ESP
- Journey persistence to Firestore
- Contact passthrough from Generator
- Prospect status tracking (draft → deployed → active → paused)
- API key cloud sync with encryption

**Tech:** React, ReactFlow, Firebase, Resend
**Revenue Model:** Premium feature for clients

### UnitySTUDIO (Integrated into UnityNOTES)

Asset creation suite for GTM campaigns.

**Features:**
- Email Template Builder (5 pre-built templates)
- Section-based editing (Subject, Greeting, Body, CTA, Signature)
- Real-time preview with sample data
- Export options: Save, Send to MAP, Copy HTML, Download
- AI context integration from chat nodes

**Tech:** React, Modal-based UI
**Status:** MVP Complete; SocialPostBuilder & AdCreativeBuilder stubbed

### Growth Health Check (`/assessment`)

8-question assessment that scores marketing operations health.

**Features:**
- 8 category-based questions with 5-point scale
- Categories: Data Architecture, Attribution, Marketing Automation, Integration Health, Team Alignment, Technical Debt, Reporting, Sales-Marketing Alignment
- Service recommendations based on lowest scores
- Email capture via Web3Forms

**Purpose:** Lead qualification and service matching

---

## Authentication & Access Control

### Framework
- Firebase Authentication with Google OAuth
- Email/password authentication
- Password reset flow

### Access Tiers

| Tier | Access Level | Credits |
|------|--------------|---------|
| **Free** | Public tools, Assessment | 3 generations |
| **API Key** | Personal LLM/ESP keys | 10 generations |
| **Premium Client** | Full platform access | Unlimited |

### Client Provisioning
- Firestore-based whitelist (`config/client_whitelist`)
- Admin whitelist (`config/admin_whitelist`)
- Token-based approval flow (`/approve-access`)
- Email notifications for access requests
- Fallback admins: christopher@yellowcircle.io, info@yellowcircle.io, arscooper@live.com

---

## Content & Thought Leadership

### Article 1: "Why Your GTM Sucks" (`/thoughts/why-your-gtm-sucks`)
- **Status:** Complete
- **Length:** ~15,500 words across 35 sections
- **Format:** Horizontal scroll (desktop), vertical scroll (mobile)

**Content Structure:**
1. Hero + Data Grid + TOC
2. Why This Matters (misalignment stats)
3. Big Picture (operations theater, industry trends)
4. 5 Persona Narratives (Alex, Jordan, Casey, Morgan, Riley)
5. What Now (Stop Buying Tools, Start With Roles, Own Your Story)
6. Enhanced CTA (consultation, audit template, PDF download)

**Interactive Features:**
- Reading time indicator
- Share buttons (Twitter, LinkedIn, copy link)
- Back-to-top floating button
- PDF export
- Email capture modals

---

## Development Status

| Component | Status | Notes |
|-----------|--------|-------|
| Website (yellowcircle.io) | ✅ Complete | Live with all pages |
| Services Page | ✅ Complete | 8 offerings with pricing |
| Works/Portfolio | ✅ Complete | 11 company case studies |
| Article 1 | ✅ Complete | 35 sections, ~15,500 words |
| Contact Forms | ✅ Complete | Web3Forms integration |
| Analytics | ✅ Complete | GTM + GA4 tracking live |
| Calendar Booking | ✅ Complete | Cal.com integration |
| UnityNOTES | ✅ Complete | AI chat, image analysis, 5+ card types |
| UnityMAP | ✅ Complete | Journey builder + email deployment |
| UnitySTUDIO | ✅ Complete | Email template builder |
| Authentication | ✅ Complete | Google OAuth + email/password |
| Client Access System | ✅ Complete | Whitelist-based premium access |
| Mobile Optimization | ⏳ In Progress | Responsive design complete, testing ongoing |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19.2, Vite 5.4, Tailwind CSS 4.1, React Flow 12.8 |
| **Hosting** | Firebase Hosting |
| **Auth** | Firebase Authentication (Google OAuth, Email/Password) |
| **Database** | Firebase Cloud Firestore |
| **Functions** | Firebase Cloud Functions (Node.js) |
| **Forms** | Web3Forms (free tier) |
| **Email** | Resend (100 free/day) |
| **AI - LLM** | Groq API (14,400 free requests/day), OpenAI (pay-as-you-go) |
| **AI - Vision** | OpenAI Vision API |
| **Calendar** | Cal.com |
| **Analytics** | Google Analytics 4, Google Tag Manager |
| **Animations** | Lottie, Framer Motion |

### Adapter Architecture

The platform uses a hot-swappable adapter pattern for flexibility:

**LLM Adapters:**
- Groq (✅ Complete)
- OpenAI (✅ Complete)
- Claude (stub)

**ESP Adapters:**
- Resend (✅ Complete)
- SendGrid (stub)
- HubSpot (stub)
- Mailchimp (stub)

**Storage Adapters:**
- Firestore (✅ Complete)
- Airtable (stub)
- LocalStorage (✅ Complete)

---

## Firebase Cloud Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `generate` | LLM proxy for free tier (rate limited) | ✅ Live |
| `sendEmail` | Resend ESP proxy | ✅ Live |
| `health` | Health check endpoint | ✅ Live |
| `requestAccess` | Client access workflow | ✅ Live |
| `approveAccess` | Token-based approval | ✅ Live |
| `deleteAccessRequest` | Admin request cleanup | ✅ Live |
| `stopAllJourneys` | Journey cleanup utility | ✅ Live |

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
  unity_platform:
    - name: UnityNOTES
      type: canvas_workspace_app
      status: mvp_complete
      features: [ai_chat, image_analysis, cloud_backup, export_share]
      monetization: freemium
    - name: UnityMAP
      type: email_journey_builder
      status: mvp_complete
      features: [node_editor, email_deployment, prospect_tracking, journey_persistence]
      monetization: premium_feature
    - name: UnitySTUDIO
      type: asset_creation_suite
      status: mvp_complete
      features: [email_templates, section_editor, ai_context]
      monetization: premium_feature
  standalone:
    - name: Outreach Generator
      type: ai_email_tool
      status: live
      monetization: free_lead_generation
    - name: Growth Health Check
      type: assessment_quiz
      status: live
      monetization: lead_qualification

authentication:
  provider: firebase_auth
  methods: [google_oauth, email_password]
  tiers: [free, api_key, premium_client]
  access_control: firestore_whitelist

content:
  thought_leadership_series: "Own Your Story"
  flagship_article: "Why Your GTM Sucks: The Human Cost of Operations Theater"
  word_count: 15500
  sections: 35
  publication_date: 2025-11

technology:
  frontend: [React 19.2, Vite, Tailwind, React Flow, Framer Motion]
  backend: [Firebase Auth, Firestore, Cloud Functions]
  ai_integration: [Groq API, OpenAI Vision, OpenAI LLM]
  email: [Resend ESP]
  analytics: [GA4, GTM]
  architecture: adapter_pattern

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
- Database architecture choices
- Third-party service selection (Web3Forms, Resend, Groq, Cal.com)
- Hosting and deployment strategy (Firebase)
- Domain and DNS configuration (Cloudflare)
- Unity Platform product design and feature scope

**Business Operations:**
- Cal.com account setup
- Firebase project management
- Google Analytics property creation
- Client provisioning workflow design
- Paid ads budget allocation decisions

**Quality Control:**
- All visual design review and iteration
- Mobile UX testing on physical devices
- Content review and approval
- Brand consistency enforcement
- Final deployment approval

### What Claude Code Executed

**Frontend Development:**
- React component creation (50+ components)
- CSS styling and responsive design implementation
- Animation and interaction code (Lottie, scroll behaviors)
- Form validation and submission handling
- Routing configuration (RouterApp.jsx)
- Unity Platform UI implementation

**System Integration:**
- Web3Forms API integration
- Cloudinary upload implementation
- Firebase Firestore queries and rules
- Firebase Cloud Functions
- Firebase Authentication flows
- UTM parameter tracking
- GTM/GA4 code implementation
- Resend email integration
- Groq/OpenAI adapter implementations

**Documentation:**
- Technical documentation (WIP, Roadmap, this overview)
- Code comments and JSDoc
- Commit message generation
- Multi-machine sync framework

**Code Refactoring:**
- Component extraction and reuse
- Performance optimization
- Accessibility improvements
- Console.log cleanup

### AI Limitations Observed

- Cannot test on physical mobile devices
- Cannot create accounts on external services
- Cannot submit support tickets
- Cannot make subjective design decisions without human input
- Cannot access private APIs without credentials provided
- Cannot make business strategy decisions without human direction
- Cannot verify visual rendering matches intent

---

## Pages & Routes Summary

### Main Pages (7)
- Home (`/`)
- About (`/about`)
- Works (`/works`) + 11 company detail pages
- Services (`/services`) + 8 service detail pages
- Hands (`/hands`)
- Thoughts (`/thoughts`) + article pages
- Experiments (`/experiments`) + 5 experiment pages

### Tools/Labs (5)
- UnityNOTES (`/unity-notes`)
- UnityMAP Hub (`/outreach`)
- Outreach Generator (`/experiments/outreach-generator`)
- Growth Assessment (`/assessment`)
- Journeys (`/journeys`)

### Utility Pages
- Portfolio (`/portfolio`)
- Shortlinks (`/shortlinks`, `/go/:shortCode`)
- Directory (`/directory`)
- Sitemap (`/sitemap`)
- Feedback (`/feedback`)

### Legal & Access
- Privacy Policy (`/privacy`)
- Terms of Service (`/terms`)
- Approve Access (`/approve-access`)
- Deny Access (`/deny-access`)

---

## Deployment

**Live:** https://yellowcircle.io
**Backup:** https://yellowcircle-app.web.app

**Commands:**
```bash
npm run build              # Build with Vite
firebase deploy            # Deploy hosting + functions
firebase deploy --only hosting    # Deploy hosting only
firebase deploy --only functions  # Deploy functions only
```

---

*Document Version: 2.0*
*For questions: info@yellowcircle.io*
