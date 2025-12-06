# UnitySTUDIO Scope Document
## Asset Creation Suite for GTM Campaigns

**Created:** December 6, 2025
**Status:** MVP Implementation
**Version:** 1.0

---

## Overview

UnitySTUDIO is the third mode in the Unity platform ecosystem:
- **UnityNOTES** - Visual note-taking canvas
- **UnityMAP** - Campaign/journey builder with email automation
- **UnitySTUDIO** - Asset creation suite for GTM campaigns

### Purpose

Quick creation of marketing assets for small/new businesses:
- Email Templates
- Ad Creatives (Reddit, LinkedIn, Instagram)
- Landing Page mockups
- Deck slides
- Resume/CV builder

### Design Philosophy

1. **Template-first** - Start with yellowCircle-styled templates
2. **AI-assisted** - Use Groq/OpenAI for content generation
3. **Export-ready** - Generate actual usable assets (HTML, images, PDFs)
4. **Integration-ready** - Feed assets into UnityMAP campaigns

---

## MVP Scope (Phase 1)

### 1.1 Asset Types for MVP

| Asset Type | Priority | Output Format | Integration |
|------------|----------|---------------|-------------|
| **Email Template** | P0 | HTML/React Email | → UnityMAP EmailNode |
| **Ad Creative** | P1 | PNG/SVG | Export only |
| **Social Post** | P1 | PNG/Text | Export only |

### 1.2 Email Template Builder (P0)

**Features:**
- Pre-built templates using yellowCircle design system
- Drag-drop sections (Header, Body, CTA, Footer)
- Rich text editing for body content
- Variable placeholders: `{{firstName}}`, `{{company}}`, etc.
- Preview with sample data
- Export as React Email component OR raw HTML

**Templates Available:**
1. **Outreach Initial** - Cold outreach first touch
2. **Follow-up Nudge** - Short follow-up reminder
3. **Value Proposition** - Feature/benefit focused
4. **Case Study Share** - Social proof template
5. **Meeting Request** - Calendar booking focused

**Component Structure:**
```jsx
// src/components/unity-studio/EmailTemplateBuilder.jsx
const EmailTemplateBuilder = ({ onSave, onExport }) => {
  // Template selection
  // Section editor (Header, Body blocks, CTA, Footer)
  // Variable insertion
  // Preview pane
  // Export options
};
```

### 1.3 Ad Creative Generator (P1)

**Platforms:**
- Reddit (1200x628, 800x800)
- LinkedIn (1200x627, 1080x1080)
- Instagram (1080x1080, 1080x1920)

**Features:**
- yellowCircle design system colors/fonts
- AI-generated headlines/copy
- Image background selection
- Logo placement
- Export as PNG

### 1.4 Social Post Generator (P1)

**Platforms:**
- LinkedIn text posts
- Twitter/X threads
- Instagram captions

**Features:**
- AI-assisted copy generation
- Character count tracking
- Hashtag suggestions
- Copy to clipboard

---

## Technical Architecture

### 2.1 Mode Integration

```javascript
// src/components/unity/UnityModeSelector.jsx
// Update MODES array:
{
  key: 'studio',
  label: 'STUDIO',
  icon: '🎨',
  description: 'Asset creation suite',
  available: true, // <-- Enable this
  route: '/unity-notes?mode=studio',
  color: '#d97706',
  badge: null
}
```

### 2.2 UnityNotesPage Integration

```javascript
// src/pages/UnityNotesPage.jsx
// Add STUDIO mode handling:

const [currentMode, setCurrentMode] = useState('notes');

// When mode === 'studio', render StudioCanvas instead of ReactFlow
{currentMode === 'studio' && (
  <UnityStudioCanvas
    onAssetCreate={handleAssetCreate}
    onExportToMAP={handleExportToMAP}
  />
)}
```

### 2.3 Component Structure

```
src/components/unity-studio/
├── UnityStudioCanvas.jsx      # Main studio interface
├── AssetTypeSelector.jsx       # Choose Email, Ad, Social
├── EmailTemplateBuilder.jsx    # Email template editor
├── AdCreativeBuilder.jsx       # Ad generator (P1)
├── SocialPostBuilder.jsx       # Social post editor (P1)
├── templates/
│   ├── email/
│   │   ├── outreach-initial.jsx
│   │   ├── followup-nudge.jsx
│   │   └── value-proposition.jsx
│   └── ad/
│       ├── reddit-promo.jsx
│       └── linkedin-awareness.jsx
└── PreviewPane.jsx             # Asset preview
```

### 2.4 Data Flow

```
UnitySTUDIO (create asset)
    ↓
localStorage: unity-studio-assets
    ↓
Export options:
├── Download HTML/PNG
├── Copy to clipboard
└── Send to UnityMAP
    ↓
UnityMAP EmailNode receives template
```

---

## MVP Implementation Plan

### Phase 1: Core Infrastructure (2-3 hours)

1. **Enable STUDIO mode in UnityModeSelector**
   - Set `available: true`
   - Update route handling

2. **Create UnityStudioCanvas component**
   - Basic layout with asset type selector
   - Mode switching logic in UnityNotesPage

3. **Create AssetTypeSelector**
   - Email, Ad, Social buttons
   - Icon + description for each

### Phase 2: Email Template Builder (3-4 hours)

1. **Create EmailTemplateBuilder component**
   - Template picker (5 templates)
   - Section-based editing
   - Variable placeholder system

2. **Build email templates**
   - Use yellowCircle design tokens
   - MJML or React Email compatible

3. **Preview and export**
   - Real-time preview with sample data
   - Export as HTML or React component

### Phase 3: Integration (1-2 hours)

1. **Connect to UnityMAP**
   - "Use in Campaign" button
   - Auto-creates EmailNode with template

2. **LocalStorage persistence**
   - Save created assets
   - Asset library view

---

## UI/UX Specifications

### 3.1 Studio Layout

```
┌────────────────────────────────────────────────────────────┐
│  [NOTES] [MAP] [STUDIO]                         [Export ▼] │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │             │  │                                     │  │
│  │   ASSET     │  │         EDITOR CANVAS               │  │
│  │   TYPES     │  │                                     │  │
│  │             │  │   ┌─────────────────────────────┐   │  │
│  │  📧 Email   │  │   │                             │   │  │
│  │  📢 Ad      │  │   │      [Template Editor]      │   │  │
│  │  📱 Social  │  │   │                             │   │  │
│  │             │  │   └─────────────────────────────┘   │  │
│  │             │  │                                     │  │
│  └─────────────┘  │   [Preview]  [Save]  [Export]       │  │
│                   └─────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Color Palette

Use existing yellowCircle design tokens:
- Primary: `rgb(251, 191, 36)` (#FBBF24)
- Dark: `#1f2937`
- Light: `#f9fafb`
- Accent (Studio): `#d97706` (amber-600)

### 3.3 Email Template Structure

```jsx
const emailTemplate = {
  id: 'template-outreach-initial',
  name: 'Outreach Initial',
  sections: [
    {
      type: 'header',
      content: {
        logo: true,
        tagline: 'yellowCircle'
      }
    },
    {
      type: 'greeting',
      content: 'Hi {{firstName}},'
    },
    {
      type: 'body',
      content: [
        { type: 'paragraph', text: '...' },
        { type: 'bullet-list', items: ['...'] }
      ]
    },
    {
      type: 'cta',
      content: {
        text: 'Schedule a Call',
        url: '{{calendarLink}}'
      }
    },
    {
      type: 'footer',
      content: {
        signature: '{{senderName}}',
        company: 'yellowCircle',
        unsubscribe: true
      }
    }
  ],
  variables: ['firstName', 'company', 'calendarLink', 'senderName']
};
```

---

## Success Metrics

1. **MVP Launch:** User can create and export an email template
2. **Integration:** Template flows into UnityMAP EmailNode
3. **Usability:** < 5 minutes to create first template

---

## Future Phases (Post-MVP)

### Phase 2: Enhanced Templates
- Landing page mockups
- Deck/presentation slides
- Resume/CV builder

### Phase 3: AI Enhancement
- AI-generated copy from prompts
- Image generation for ads
- A/B variant generation

### Phase 4: Platform Integrations
- Direct publish to ad platforms
- Email platform exports (Mailchimp, SendGrid)
- Figma/Canva integrations

---

*Document Version: 1.0*
*Last Updated: December 6, 2025*
