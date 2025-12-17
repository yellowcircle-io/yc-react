# UnitySTUDIO Rearchitecture Plan

**Created:** December 16, 2025
**Purpose:** Production-ready creative generation for social/display advertising
**Status:** Planning Phase

---

## Executive Summary

### Current Problem
The existing UnitySTUDIO implementation (AdCreativeBuilder.jsx, SocialPostBuilder.jsx) produces generic placeholder-based templates that are NOT deployment-ready for actual advertising platforms. Key issues:
- Fixed placeholder text (not AI-generated)
- Non-compliant dimensions for platform specs
- No export functionality for actual deployment
- Missing safe zones and platform-specific formatting

### Solution
Rearchitect UnitySTUDIO to generate production-ready creative assets that comply with platform specifications, incorporate AI-generated copy, and export directly deployable files.

---

## Platform Creative Specifications (2025)

### Instagram

| Placement | Dimensions | Aspect Ratio | Text Limits |
|-----------|------------|--------------|-------------|
| **Feed Image** | 1080x1350 (preferred) | 4:5 | Caption: 2,200 chars |
| **Feed Image** | 1080x1080 | 1:1 | First 125 chars visible |
| **Stories/Reels** | 1080x1920 | 9:16 | Keep text brief |
| **Carousel** | 1080x1080 | 1:1 | Up to 10 cards |

**Safe Zones:** Top 14% (250px) and bottom 20% (340px) free of text/logos
**File Specs:** JPG/PNG, <30MB

Sources: [Sprout Social](https://sproutsocial.com/insights/instagram-ad-sizes/), [Buffer](https://buffer.com/resources/instagram-image-size/)

---

### Facebook (Meta)

| Placement | Dimensions | Aspect Ratio | Text Limits |
|-----------|------------|--------------|-------------|
| **Feed Image** | 1080x1350 | 4:5 | Primary: 125 chars, Headline: 27 chars |
| **Feed Image** | 1080x1080 | 1:1 | Link description: 30 chars |
| **Stories** | 1080x1920 | 9:16 | Primary: 125 chars, Headline: 40 chars |
| **Carousel** | 1080x1080 | 1:1 | Per card specs apply |

**Safe Zones:** Same as Instagram (14% top, 20% bottom)
**File Specs:** JPG/PNG, <30MB

Sources: [Hootsuite](https://blog.hootsuite.com/facebook-ad-sizes/), [Buffer](https://buffer.com/resources/facebook-ad-specs-image-sizes/)

---

### LinkedIn

| Placement | Dimensions | Aspect Ratio | Text Limits |
|-----------|------------|--------------|-------------|
| **Single Image** | 1200x627 | 1.91:1 | Intro: 150 chars (600 max), Title: 255 chars |
| **Single Image** | 1200x1200 | 1:1 | Description: 70 chars |
| **Vertical** | 628x1200 | 1:1.91 | Mobile-optimized |
| **Carousel** | 1080x1080 | 1:1 | 2-10 cards, 45 char CTA |
| **Video** | 1080x1920 | 9:16 | 3s-30min |

**File Specs:** JPG/PNG/GIF, <5MB

Sources: [LinkedIn Help](https://www.linkedin.com/help/lms/answer/a426534), [Strike Social](https://strikesocial.com/blog/linkedin-ad-dimensions/)

---

### Reddit

| Placement | Dimensions | Aspect Ratio | Text Limits |
|-----------|------------|--------------|-------------|
| **Feed Image** | 1200x628 | 4:3 (desktop) | Title: 60-80 chars optimal, 150 max |
| **Feed Image** | 1080x1080 | 1:1 (compact) | Body: 40,000 chars (3-6 lines shown) |
| **Thumbnail** | 400x300 | 4:3 | Required |

**File Specs:** JPG/PNG, <500KB thumbnail
**Video:** MP4/MOV, <1GB, 5-30s recommended

Sources: [Reddit Ads Help](https://business.reddithelp.com/s/article/image-ad-specifications), [Veuno](https://www.veuno.com/reddit-ad-specs-your-guide-for-2025/)

---

### Google Display Network

| Size | Dimensions | Usage |
|------|------------|-------|
| **Medium Rectangle** | 300x250 | Desktop + Mobile (best performer) |
| **Leaderboard** | 728x90 | Desktop header/footer |
| **Half Page** | 300x600 | Desktop sidebar |
| **Mobile Leaderboard** | 320x50 | Mobile banner |
| **Large Mobile** | 320x100 | Mobile banner |
| **Skyscraper** | 160x600 | Desktop sidebar |

**Responsive Display Ads:**
- Landscape: 1200x628 (1.91:1)
- Square: 1200x1200 (1:1)
- Portrait: 1200x1500 (4:5) - optional

**File Specs:** JPG/PNG/GIF, <150KB each, text <20% of image
**Headlines:** 5-10 short headlines, 5 descriptions recommended

Sources: [Google Ads Help](https://support.google.com/google-ads/answer/1722096), [Figma Guide](https://www.figma.com/resource-library/google-display-ad-sizes/)

---

## New Architecture

### Phase 1: Platform-Compliant Templates

```
src/components/unity-studio/
├── CreativeBuilder/
│   ├── index.jsx                # Main orchestrator
│   ├── PlatformSelector.jsx     # Platform + placement picker
│   ├── CanvasEditor.jsx         # Visual editor with safe zones
│   ├── TextEditor.jsx           # AI-assisted copy editor
│   └── ExportManager.jsx        # Export to platform specs
├── templates/
│   ├── meta/                    # IG + FB templates
│   │   ├── feed-4x5.json
│   │   ├── story-9x16.json
│   │   └── carousel-1x1.json
│   ├── linkedin/
│   │   ├── sponsored-1.91x1.json
│   │   └── carousel-1x1.json
│   ├── reddit/
│   │   ├── feed-4x3.json
│   │   └── compact-1x1.json
│   └── google/
│       ├── responsive.json
│       ├── 300x250.json
│       └── 728x90.json
└── presets/
    ├── yellowcircle-brand.json  # Brand colors, fonts, logos
    └── campaign-presets/
        └── gtm-audit.json       # Pre-built campaign assets
```

### Phase 2: AI-Powered Content Generation

**Integration Points:**
1. **OpenAI API** for copy generation (headlines, body, CTAs)
2. **DALL-E/Stable Diffusion** for image generation (optional)
3. **Brand voice training** from existing content

**AI Copy Generation Prompt Template:**
```javascript
const generateAdCopy = async (platform, campaignType, brand) => {
  const prompt = `
    Generate advertising copy for ${platform}.
    Campaign type: ${campaignType}
    Brand: ${brand.name}
    Value prop: ${brand.valueProposition}
    Target audience: ${brand.targetAudience}

    Requirements:
    - Headline: ${PLATFORM_SPECS[platform].headlineLimit} characters max
    - Body: ${PLATFORM_SPECS[platform].bodyLimit} characters max
    - CTA: Action-oriented, 4-6 words

    Output format: JSON with headline, body, cta fields
  `;

  return await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });
};
```

### Phase 3: Export & Deployment

**Export Options:**
1. **Direct Download** - Platform-ready PNG/JPG files
2. **Batch Export** - All sizes for a campaign
3. **API Integration** - Direct upload to ad platforms (Meta/LinkedIn APIs)
4. **Figma/Canva Export** - Edit-friendly formats

**Export Flow:**
```
Canvas → Render to Canvas API → Export PNG at exact dimensions
                             → Add metadata (platform, size, campaign)
                             → Zip bundle for download
```

---

## Implementation Plan

### Sprint 1: Foundation (Week 1-2)

1. **Create PlatformSelector component**
   - Platform dropdown (Meta, LinkedIn, Reddit, Google)
   - Placement selector (Feed, Stories, Carousel, etc.)
   - Auto-sets canvas dimensions

2. **Upgrade CanvasEditor**
   - Dynamic canvas sizing based on platform
   - Safe zone overlays (toggleable)
   - Grid/snap-to guides

3. **Brand preset system**
   - Load yellowCircle brand colors/fonts
   - Logo positioning options
   - Save custom presets

### Sprint 2: AI Integration (Week 3-4)

1. **AI Copy Generator**
   - Platform-aware character limits
   - Multiple variations per field
   - Tone/voice selector

2. **Template Library**
   - 5+ templates per platform
   - Quick-apply functionality
   - Edit mode for customization

3. **Real-time Preview**
   - Device mockups (phone/desktop)
   - Safe zone preview
   - Character count warnings

### Sprint 3: Export & Polish (Week 5-6)

1. **Export Manager**
   - Single asset download
   - Batch export (all platforms)
   - Naming conventions

2. **Campaign Manager Integration**
   - Save to campaigns
   - Asset versioning
   - Performance tracking placeholder

---

## Example: yellowCircle Campaign Asset Generation

**User Request:** "Give me campaign launch assets for yellowCircle using existing creative and styling to deploy across social and search platforms"

**System Response:**

### Generated Asset Pack:

| Platform | Placement | Dimensions | Asset |
|----------|-----------|------------|-------|
| Meta (IG/FB) | Feed | 1080x1350 | feed-gtm-audit-4x5.png |
| Meta (IG/FB) | Stories | 1080x1920 | story-gtm-audit-9x16.png |
| LinkedIn | Sponsored | 1200x627 | linkedin-gtm-audit-1.91x1.png |
| Reddit | Feed | 1200x628 | reddit-gtm-audit-4x3.png |
| Google | Medium Rectangle | 300x250 | gdn-gtm-audit-300x250.png |
| Google | Leaderboard | 728x90 | gdn-gtm-audit-728x90.png |

**AI-Generated Copy (per platform):**

**LinkedIn:**
- Headline: "Is Your GTM Strategy Holding You Back?"
- Body: "Most companies fail not because of their product, but because of their go-to-market approach. Get a free assessment of your growth infrastructure."
- CTA: "Get Free Assessment"

**Instagram:**
- Caption: "Your GTM strategy might be the reason you're not growing. We help companies fix the foundation before building on top. Free assessment in bio."

---

## Technical Requirements

### Dependencies to Add:
```json
{
  "html2canvas": "^1.4.1",
  "react-konva": "^18.2.10",
  "konva": "^9.3.0",
  "jszip": "^3.10.1",
  "file-saver": "^2.0.5"
}
```

### API Integrations:
- OpenAI API (existing key in Firebase config)
- Meta Marketing API (future: direct publishing)
- LinkedIn Marketing API (future: direct publishing)

---

## Migration Path

1. **Keep existing components** as-is during development
2. **New `/studio-v2` route** for beta testing
3. **Feature flag** to toggle between old/new
4. **Gradual rollout** after validation

---

## Success Metrics

- Generate platform-compliant creative in <2 minutes
- AI copy generation with 80%+ usability
- Export all campaign assets in single click
- Zero platform rejection for spec compliance

---

*Document Version: 1.0 - Initial Architecture*
