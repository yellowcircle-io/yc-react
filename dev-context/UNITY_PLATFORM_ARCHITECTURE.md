# Unity Platform Architecture

**Created:** December 4, 2025
**Status:** SCOPING - Foundation Framework
**Purpose:** Unified workspace for internal operations, client delivery, and SaaS potential

---

## Platform Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UNITY PLATFORM                                │
│                                                                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐            │
│  │  UnityNotes  │   │   UnityMAP   │   │ UnityStudio  │            │
│  │              │   │              │   │              │            │
│  │  Canvas +    │   │  Outreach    │   │  Asset       │            │
│  │  Multimedia  │   │  Journeys    │   │  Creation    │            │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘            │
│         │                  │                  │                     │
│         └──────────────────┼──────────────────┘                     │
│                            │                                        │
│                   ┌────────▼────────┐                               │
│                   │  Shared Canvas  │                               │
│                   │  (ReactFlow)    │                               │
│                   └────────┬────────┘                               │
│                            │                                        │
│         ┌──────────────────┼──────────────────┐                     │
│         │                  │                  │                     │
│  ┌──────▼──────┐   ┌───────▼──────┐   ┌──────▼──────┐              │
│  │  Firebase   │   │  n8n         │   │  AI APIs    │              │
│  │  (Storage)  │   │  (Workflows) │   │  (Content)  │              │
│  └─────────────┘   └──────────────┘   └─────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. UNITYNOTES (Existing - Enhanced)

**Current State:** Canvas-based multimedia workspace
**Route:** `/unity-notes`

### Features (Existing)
- [x] Photo nodes with Cloudinary upload
- [x] Text/Note nodes with inline editing
- [x] Link nodes
- [x] Video embed nodes
- [x] AI Chat nodes (placeholder)
- [x] Canvas pan/zoom (ReactFlow)
- [x] Local storage persistence
- [x] Export/Import JSON
- [x] Share URLs (Firebase)

### Enhancements Needed
- [ ] **AI Integration (Tiered)**
  - Free: 3 AI generations (existing credit system)
  - Pro: Unlimited AI with user's API key
  - Enterprise: Multi-modal (text, image, code)

- [ ] **Node Types to Add**
  - Campaign node (links to UnityMAP)
  - Asset node (links to UnityStudio)
  - Prospect node (from Outreach Generator)

### Access Tiers

| Feature | Free | Pro ($X/mo) | Enterprise |
|---------|------|-------------|------------|
| Canvas nodes | 50 | Unlimited | Unlimited |
| Photo uploads | 10 (local) | Unlimited (Cloudinary) | Unlimited |
| AI generations | 3 | Unlimited | Multi-modal |
| Share URLs | Export only | Firebase URLs | Custom domains |
| Templates | Basic | All | Custom |

---

## 2. UNITYMAP (New - Outreach Integration)

**Purpose:** Visual journey builder for outreach campaigns
**Route:** `/unity-notes?mode=map` OR `/unity-map`

### Core Functionality

```
┌─────────────────────────────────────────────────────────────┐
│                      UNITYMAP CANVAS                         │
│                                                              │
│   [Prospect List]                                            │
│        │                                                     │
│        ▼                                                     │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐              │
│   │ Day 0   │────▶│ Day 3   │────▶│ Day 10  │              │
│   │ Initial │     │ Follow  │     │ Break   │              │
│   │ Email   │     │ Up #1   │     │ Up #2   │              │
│   └─────────┘     └────┬────┘     └─────────┘              │
│                        │                                     │
│                   [Condition]                                │
│                   Reply? Open?                               │
│                        │                                     │
│              ┌─────────┴─────────┐                          │
│              ▼                   ▼                          │
│         [Yes Path]          [No Path]                       │
│         Schedule Call       Continue Seq                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Features

1. **Journey Builder**
   - Drag-and-drop email sequence nodes
   - Conditional branching (opened, clicked, replied)
   - Time delays (Day 0, Day 3, Day 10, etc.)
   - A/B testing branches

2. **Prospect Integration**
   - Import from Airtable/Firebase
   - Segment by tags/scores
   - Individual prospect tracking

3. **Outreach Generator Connection**
   - Generate email content per node
   - AI personalization per prospect
   - Template selection

4. **Execution**
   - Preview mode (see full sequence)
   - Send via n8n → Resend
   - Pause/resume campaigns
   - Analytics dashboard

### Node Types

| Node | Purpose | Properties |
|------|---------|------------|
| **Prospect** | Entry point | List, segment, tags |
| **Email** | Send email | Template, AI prompt, delay |
| **Condition** | Branch logic | If opened/clicked/replied |
| **Wait** | Time delay | Days, hours |
| **Task** | Manual action | Call, LinkedIn, etc. |
| **Exit** | End sequence | Won, Lost, Unsubscribe |

### Integration with Outreach Generator

**Current:** OutreachGeneratorPage generates 3-email sequence as text
**Enhanced:**
1. Generate → Creates UnityMAP journey with 3 email nodes
2. "Deploy to UnityMAP" button (replaces "Deploy to Unity Notes")
3. Journey visualized on canvas
4. One-click send via n8n workflow

---

## 3. UNITYSTUDIO (New - Asset Creation)

**Purpose:** Campaign asset creation workspace
**Route:** `/unity-notes?mode=studio` OR `/unity-studio`

### Asset Types

```
┌─────────────────────────────────────────────────────────────┐
│                     UNITYSTUDIO                              │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    ADS      │  │   EMAIL     │  │   SLIDES    │         │
│  │             │  │  TEMPLATES  │  │             │         │
│  │ • Reddit    │  │             │  │ • Pitch     │         │
│  │ • LinkedIn  │  │ • Nurture   │  │ • Report    │         │
│  │ • Instagram │  │ • Promo     │  │ • Proposal  │         │
│  │ • Meta      │  │ • Welcome   │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │  LANDING    │  │   SOCIAL    │                          │
│  │   PAGES     │  │   POSTS     │                          │
│  │             │  │             │                          │
│  │ • Lead Gen  │  │ • LinkedIn  │                          │
│  │ • Event     │  │ • Twitter   │                          │
│  │ • Product   │  │ • Threads   │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Ad Creator

**Platforms:** Reddit, LinkedIn, Instagram, Meta

**Features:**
- Platform-specific dimensions (auto-resize)
- yellowCircle brand assets (colors, fonts, effects)
- AI copy generation (headline, body, CTA)
- Export formats (PNG, JPG, video-ready)

**Workflow:**
1. Select platform → Auto-set dimensions
2. Choose template OR start blank
3. Add text, images, brand elements
4. AI generates copy variants
5. Export all sizes for platform

### 3.2 Email Template Builder

**Based on:** Existing `yellowcircle-outreach/components/`

**Features:**
- Drag-and-drop email builder
- Pre-built templates (Welcome, Nurture, Promo)
- Brand-compliant HTML output
- Preview across email clients
- Export to Resend/n8n

### 3.3 Slide/Deck Builder

**Use Cases:** Pitch decks, client reports, proposals

**Features:**
- yellowCircle branded templates
- Data visualization components
- AI content suggestions
- Export to PDF, PPTX, Google Slides

### 3.4 Landing Page Builder

**Features:**
- Component library (Hero, CTA, Form, Testimonial)
- Mobile-responsive preview
- Form integration (Web3Forms, n8n webhook)
- Deploy to Firebase Hosting subdomain

---

## Access Control Architecture

### User Types

| Type | Description | Access |
|------|-------------|--------|
| **Internal** | yellowCircle team | Full access, all features |
| **Client** | Consulting clients | Project-specific workspaces |
| **SaaS** | Paid subscribers | Tiered feature access |
| **Free** | Public users | Limited features + credits |

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ACCESS CONTROL                            │
│                                                              │
│  ┌──────────┐                                               │
│  │ Visitor  │──▶ Free tier (3 credits, limited features)    │
│  └──────────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                               │
│  │ API Key  │──▶ SaaS tier (user's own keys, unlimited)     │
│  │ Entry    │                                               │
│  └──────────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                               │
│  │ Password │──▶ Internal/Client (full access)              │
│  │ Gate     │    Password: environment variable             │
│  └──────────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                               │
│  │ Firebase │──▶ Future: Full auth system                   │
│  │ Auth     │    Google, Email, SSO                         │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
```

### Current Implementation (OutreachGenerator)

**Issue:** Password gate only works for internal access
**Current Flow:**
1. Check `yc_client_access` localStorage → bypass credits
2. Check `outreach_free_credits` → 3 free uses
3. After credits: require API key

**Needed:**
- Clear separation of internal vs SaaS vs free
- Environment variable for internal password
- Client-specific access tokens
- Usage tracking for SaaS billing

---

## Implementation Phases

### Phase 1: Foundation (Current Sprint)
- [ ] Rename UnityNotes → Unity Platform branding
- [ ] Add mode switching (Notes/MAP/Studio tabs)
- [ ] Update Outreach Generator password flow
- [ ] Create shared canvas abstraction

### Phase 2: UnityMAP MVP
- [ ] Journey node types (Email, Condition, Wait)
- [ ] Outreach Generator → UnityMAP deployment
- [ ] n8n workflow for email sending
- [ ] Basic analytics (sent, opened, clicked)

### Phase 3: UnityStudio MVP
- [ ] Ad Creator (Reddit, LinkedIn formats)
- [ ] Email Template Builder
- [ ] Export functionality
- [ ] Brand asset library

### Phase 4: SaaS Infrastructure
- [ ] Firebase Auth integration
- [ ] Usage metering
- [ ] Stripe billing
- [ ] Client workspace isolation

---

## Technical Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Canvas | ReactFlow | Node-based editor |
| State | localStorage + Firebase | Persistence |
| Auth | Firebase Auth | User management |
| Workflows | n8n (self-hosted) | Automation |
| Email | Resend | Transactional email |
| AI | Groq (free) / OpenAI | Content generation |
| Storage | Cloudinary + Firebase | Media + data |
| Hosting | Firebase Hosting | Web app |

---

## File Structure (Proposed)

```
src/
├── pages/
│   ├── UnityPlatformPage.jsx      # Main entry point
│   └── experiments/
│       └── OutreachGeneratorPage.jsx  # Updated with MAP integration
│
├── components/
│   └── unity/
│       ├── UnityCircleNav.jsx     # Existing
│       ├── UnityCanvas.jsx        # Shared canvas
│       ├── UnityModeSelector.jsx  # Notes/MAP/Studio tabs
│       │
│       ├── notes/                 # UnityNotes components
│       │   ├── PhotoNode.jsx
│       │   ├── TextNoteNode.jsx
│       │   └── AINode.jsx
│       │
│       ├── map/                   # UnityMAP components
│       │   ├── ProspectNode.jsx
│       │   ├── EmailNode.jsx
│       │   ├── ConditionNode.jsx
│       │   ├── WaitNode.jsx
│       │   └── JourneyControls.jsx
│       │
│       └── studio/                # UnityStudio components
│           ├── AdCanvas.jsx
│           ├── EmailBuilder.jsx
│           ├── SlideEditor.jsx
│           └── AssetLibrary.jsx
│
├── config/
│   └── unityPlatform.js           # Feature flags, tiers
│
└── hooks/
    ├── useUnityAuth.js            # Access control
    ├── useUnityStorage.js         # Persistence
    └── useUnityAI.js              # AI integration
```

---

## Naming Convention Update

**Old → New:**
- Unity Notes → UnityNotes
- Unity Note Plus → (deprecated, merged into UnityNotes)
- Travel Time Capsule → (archived)

**New:**
- UnityNotes - Canvas + multimedia workspace
- UnityMAP - Outreach journey builder
- UnityStudio - Asset creation suite
- Unity Platform - Umbrella brand

---

## Next Steps

1. **Immediate:** Update all "Unity Notes" references to "UnityNotes"
2. **This Week:** Create mode selector UI (tabs for Notes/MAP/Studio)
3. **Next Week:** Build UnityMAP email node type
4. **Month 1:** MVP of all three tools functional
5. **Month 2:** SaaS infrastructure (auth, billing)

---

## Decisions (Dec 4, 2025)

| Question | Decision |
|----------|----------|
| **Pricing Model** | Hybrid (per-seat + usage tiers) |
| **Client Isolation** | Unified Firebase with namespaced collections |
| **White Label** | Yes - fully customizable branding |
| **API Access** | Yes - expose for ESP/MAP/CRM integrations |

### Primary Use Cases (Priority Order)
1. **Internal** - yellowCircle operations (primary)
2. **Client Delivery** - Consulting client workspaces (secondary)
3. **SaaS/Credits** - Self-service buyers (tertiary)

### Integration Philosophy
- Standalone for limited build/reporting
- Designed to complement existing ESPs/MAPs/CRMs
- API-first for platform integrations
- Reporting scoped after working prototype

---

## 2-Month Aggressive MVP Roadmap

**Goal:** Working prototype of all three tools before EOY 2025

### Week 1-2 (Dec 4-17): Foundation
- [x] **Adapter layer implemented** (Dec 4)
  - LLM adapters: Groq, OpenAI, Claude
  - ESP adapters: Resend (+ stubs for SendGrid, HubSpot, Mailchimp)
  - Storage adapters: Firestore, Airtable, LocalStorage
- [x] **Outreach Generator updated** to use adapters
- [x] **.env.example** with hot-swap configuration
- [ ] Rename "Unity Notes" → "UnityNotes" across codebase
- [ ] Create mode selector UI (Notes/MAP/Studio tabs)
- [ ] Set up Firebase namespaced collections structure
- [ ] Implement tiered access control (Internal/Client/SaaS/Free)
- [ ] Local n8n Docker setup + basic webhook workflow

### Week 3-4 (Dec 18-31): UnityMAP MVP
- [ ] Journey node types (Prospect, Email, Condition, Wait, Exit)
- [ ] Outreach Generator → UnityMAP deployment flow
- [ ] n8n workflow: Webhook → Firestore → Email (Resend)
- [ ] Basic journey visualization on canvas
- [ ] Manual send trigger (no auto-scheduling yet)

### Week 5-6 (Jan 1-14): UnityStudio MVP
- [ ] Ad Creator - Reddit + LinkedIn formats only
- [ ] Email Template Builder - 3 templates (Welcome, Nurture, Promo)
- [ ] Brand asset library (colors, fonts, logos)
- [ ] Export to PNG/HTML

### Week 7-8 (Jan 15-31): Integration & Polish
- [ ] API endpoints for external integrations
- [ ] White-label configuration system
- [ ] Client workspace namespacing
- [ ] Usage metering (no billing yet)
- [ ] End-to-end testing

### Post-MVP (Feb+)
- [ ] Stripe billing integration
- [ ] Advanced analytics/reporting
- [ ] Auto-scheduled campaigns
- [ ] Additional ad platforms (Meta, Instagram)
- [ ] Slide/deck builder

---

## Firebase Namespace Structure

```
firestore/
├── _system/
│   ├── config          # Platform configuration
│   └── usage           # Usage metrics
│
├── workspaces/
│   ├── {workspaceId}/
│   │   ├── meta        # Workspace metadata, branding
│   │   ├── members     # Access control
│   │   ├── notes/      # UnityNotes canvases
│   │   ├── journeys/   # UnityMAP campaigns
│   │   ├── assets/     # UnityStudio creations
│   │   └── prospects/  # Lead data
│   │
│   ├── yc-internal/    # yellowCircle workspace
│   ├── client-acme/    # Client workspace example
│   └── saas-user-123/  # SaaS user workspace
│
└── shared/
    ├── templates/      # Shared templates
    └── assets/         # Shared brand assets
```

### Namespace Benefits
- Single Firebase project (cost-efficient)
- Data isolation via security rules
- Easy workspace switching
- Shared resources where needed

---

## White-Label Configuration

```javascript
// Per-workspace branding config
const workspaceBranding = {
  name: "Acme Corp",
  logo: "https://...",
  colors: {
    primary: "#FF5500",
    secondary: "#333333",
    background: "#FFFFFF"
  },
  fonts: {
    heading: "Inter",
    body: "System"
  },
  customDomain: "tools.acme.com" // Future
};
```

---

## API Structure (Planned)

```
/api/v1/
├── /workspaces
│   ├── GET /           # List workspaces
│   ├── POST /          # Create workspace
│   └── /{id}           # Workspace operations
│
├── /notes
│   ├── GET /           # List canvases
│   ├── POST /          # Create canvas
│   └── /{id}/nodes     # Node operations
│
├── /journeys
│   ├── GET /           # List journeys
│   ├── POST /          # Create journey
│   ├── /{id}/start     # Start campaign
│   └── /{id}/pause     # Pause campaign
│
├── /assets
│   ├── GET /           # List assets
│   ├── POST /          # Create asset
│   └── /{id}/export    # Export asset
│
└── /prospects
    ├── GET /           # List prospects
    ├── POST /          # Add prospect
    └── /import         # Bulk import
```

---

*Document Version: 2.0 - Decisions Confirmed + MVP Roadmap*
