# YellowCircle Codebase - Quick Reference Guide

## Project Structure Overview

```
yellowcircle/
├── src/
│   ├── pages/
│   │   ├── HomePage.jsx (1,587 lines - MAIN)
│   │   ├── ExperimentsPage.jsx (1,068 lines)
│   │   ├── AboutPage.jsx (720 lines)
│   │   ├── WorksPage.jsx (777 lines)
│   │   ├── ThoughtsPage.jsx (800+ lines)
│   │   ├── HandsPage.jsx (700+ lines)
│   │   ├── TimeCapsulePage.jsx
│   │   ├── CapsuleViewPage.jsx
│   │   ├── NotFoundPage.jsx
│   │   ├── Home17Page.jsx (ARCHIVE)
│   │   ├── experiments/
│   │   │   ├── GoldenUnknownPage.jsx
│   │   │   ├── BeingRhymePage.jsx
│   │   │   ├── Cath3dralPage.jsx
│   │   │   └── ComponentLibraryPage.jsx
│   │   └── thoughts/
│   │       └── BlogPage.jsx
│   ├── components/
│   │   ├── ui/
│   │   │   └── ErrorBoundary.jsx
│   │   └── travel/
│   │       ├── ShareModal.jsx
│   │       ├── LightboxModal.jsx
│   │       ├── DraggablePhotoNode.jsx
│   │       ├── EditMemoryModal.jsx
│   │       └── PhotoUploadModal.jsx
│   ├── hooks/
│   │   └── useFirebaseCapsule.js
│   ├── config/
│   │   └── firebase.js
│   ├── utils/
│   │   └── cloudinaryUpload.js
│   ├── RouterApp.jsx (Main router)
│   ├── App-17frame.jsx (ARCHIVE)
│   └── main.jsx (Entry point)
├── CLAUDE.md (Project instructions)
└── [NEW] Documents created:
    ├── CODEBASE_ANALYSIS_REPORT.md
    ├── REFACTORING_ROADMAP.md
    └── QUICK_REFERENCE.md
```

---

## Critical Issues at a Glance

### Code Duplication Summary

| Item | Count | Lines | Status |
|------|-------|-------|--------|
| **Parallax Systems** | 3 | 150+ | HIGH priority |
| **Sidebars** | 5 | 800+ | HIGH priority |
| **Footers** | 3 | 400+ | HIGH priority |
| **Device Motion** | 4 | 200+ | HIGH priority |
| **Hamburger Menus** | 8 | 400+ | MEDIUM priority |
| **Navigation Circles** | 2 | 50+ | LOW priority |
| **Total Duplication** | - | 2,000+ | 37% of codebase |

---

## Key Architectural Patterns

### Pattern 1: HomePage.jsx (Advanced)
- Custom inline styles everywhere
- Sophisticated state management
- Three-level accordion sidebar
- Scroll-based page transitions
- Complex parallax system
- **Used by:** HomePage only
- **Size:** 1,587 lines

### Pattern 2: Experiments/Thoughts (Intermediate)
- Custom inline styles + state management
- Simpler sidebar with absolute positioning
- Fixed page layout
- Parallax with device motion
- **Used by:** ExperimentsPage, ThoughtsPage
- **Size:** 800-1,000 lines each

### Pattern 3: About/Works/Hands (Tailwind CSS)
- Tailwind classes + inline styles mixed
- Right-aligned sidebar
- Complex sidebar with nested items
- Standard page layout
- **Used by:** AboutPage, WorksPage, HandsPage
- **Size:** 700-777 lines each

---

## Page-by-Page Analysis

### HomePage (Production-ready BUT over-engineered)
- File: `src/pages/HomePage.jsx`
- Size: 1,587 lines
- Key Features:
  - Horizontal scroll with 3 backgrounds
  - Navigation circle rotates with scroll
  - Parallax yellow circle
  - Complex accordion sidebar
  - "YOUR STORY" footer text
  - Hamburger menu overlay
- **Critical Code:**
  - Lines 26-268: Parallax + device motion
  - Lines 310-652: Sidebar component (should be shared)
  - Lines 1197-1439: Footer (should be shared)
- **Refactoring:** Extract parallax (120 lines → 5 lines), sidebar (340 lines → 10 lines), footer (240 lines → 5 lines)

### ExperimentsPage (Similar to HomePage)
- File: `src/pages/ExperimentsPage.jsx`
- Size: 1,068 lines
- Similar pattern to HomePage but simpler
- Could be reduced by 400+ lines with refactoring

### AboutPage (Tailwind Pattern)
- File: `src/pages/AboutPage.jsx`
- Size: 720 lines
- Different approach using Tailwind CSS
- Right-aligned sidebar
- Has color theme (purple #8b5cf6)
- Could use shared component structure

### WorksPage (Tailwind Pattern)
- File: `src/pages/WorksPage.jsx`
- Size: 777 lines
- Similar to AboutPage
- Has color theme (green #22c55e)
- Grid-based content layout

### ThoughtsPage
- File: `src/pages/ThoughtsPage.jsx`
- Size: 800+ lines
- Almost identical to ExperimentsPage
- **Could be merged or significantly refactored**

### HandsPage
- File: `src/pages/HandsPage.jsx`
- Size: 700+ lines
- Mix of Tailwind + inline styles
- Different design from others

---

## Navigation Structure Map

### HomePage Navigation
```
STORIES
├── Projects
│   ├── Brand Development
│   ├── Marketing Architecture
│   └── Email Development
├── Golden Unknown
├── Cath3dral
│   └── Being + Rhyme
└── Thoughts

LABS
├── Home-17
├── Visual Noteboard
├── UK-Memories
└── Component Library

ABOUT (no sub-items)
```

### ExperimentsPage Navigation
```
EXPERIMENTS
├── golden unknown
├── being + rhyme
└── cath3dral

THOUGHTS
└── blog

ABOUT
├── about me
├── about yellowcircle
└── contact

WORKS
├── consulting
├── rho
├── reddit
└── cv
```

**NOTE:** Different pages have different navigation structures!

---

## Z-Index Layer Comparison

### HomePage Approach
```
-1000  Background (white)
   1   Scrollable areas
  10   -
  20   Yellow circle (parallax)
  30   -
  40   Nav bar
  50   Sidebar + Nav circle
  60   Footer
  90   Menu overlay
 100   Hamburger button
```

### About/Works Approach
```
-1000  Background (white)
    0  Circle gradient
   10  Main content
   20  Footer
   30  Nav circle
   40  Sidebar
   50  Menu overlay
 100   Hamburger (implied)
```

**Risk:** Inconsistent z-index values can cause overlap issues during transitions

---

## Color Palette

### Brand Colors
- **Primary Yellow:** `#EECF00` (consistent across all pages)
- **Black:** `#000000`
- **White:** `#FFFFFF`
- **Dark Gray:** `rgba(0,0,0,0.9)` (footers)
- **Light Gray:** `rgba(242, 242, 242, 0.44)` (sidebars)

### Page-Specific Accents
- **About:** Purple `#8b5cf6`
- **Works:** Green `#22c55e`
- **Other:** Default to yellow

---

## Animation Timings

| Animation | Timing | Used In |
|-----------|--------|---------|
| Sidebar open/close | 0.5s ease-out | HomePage, ExperimentsPage, Tailwind pages |
| Parallax update | 0.1s ease-out | HomePage, ExperimentsPage |
| Menu fade | 0.3s ease-out | HomePage, ExperimentsPage |
| Parallax calc | ~60fps throttle | AboutPage, WorksPage |
| Footer toggle | 0.5s ease-out | All pages |
| Button transitions | 0.2-0.3s | All pages |

**Issue:** Different timing on different pages causes jarring transitions

---

## State Management

### Per-Page State (NOT Shared)
```javascript
// Every page manages independently:
const [menuOpen, setMenuOpen] = useState(false);
const [sidebarOpen, setSidebarOpen] = useState(false);
const [footerOpen, setFooterOpen] = useState(false);
const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0 });
const [expandedSection, setExpandedSection] = useState(null);
// ... 10-15 more per page
```

### Missing Global State
- User preferences (theme, accessibility)
- Navigation history
- Scroll position
- Device capabilities
- Permission statuses

---

## Event Listener Issues

### Memory Leak Risk
Each page attaches listeners:
```javascript
window.addEventListener('mousemove', ...);
window.addEventListener('wheel', ...);
window.addEventListener('keydown', ...);
window.addEventListener('touchstart', ...);
window.addEventListener('touchmove', ...);
window.addEventListener('touchend', ...);
window.addEventListener('deviceorientation', ...);
window.addEventListener('devicemotion', ...);
```

**Risk:** If cleanup not perfect, listeners accumulate on navigation

### Cleanup Pattern
```javascript
useEffect(() => {
  window.addEventListener('event', handler);
  return () => {
    window.removeEventListener('event', handler);
  };
}, []);
```

**Status:** Mostly correct but should be verified for all listeners

---

## Image Asset Management

### Cloudinary URLs (All Pages)
```
https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/[name].png
```

**Risks:**
- All hardcoded as static strings
- Version numbers embedded (v1756684384)
- No fallback images
- No local copies
- CDN dependency

**Recommendation:** Move to constants file with fallback logic

---

## Performance Observations

### Current State
- Large single files (700-1,600 lines each)
- No code splitting
- No lazy loading for images
- No React.memo on components
- No component composition optimization
- Parallax calculation on every mouse move

### Opportunities
- Extract custom hooks (reduce component size)
- Implement code splitting per page
- Lazy load Cloudinary images
- Memoize expensive components
- Throttle parallax calculations
- Tree-shake unused imports

---

## Testing Notes

### Not Covered
- No unit tests
- No component tests
- No integration tests
- No E2E tests

### Critical Test Scenarios
1. Page transitions (cleanup verification)
2. Device motion on iOS
3. Parallax on low-end devices
4. Navigation sidebar on mobile
5. Footer overlap with content
6. Menu animations on slow devices
7. Image loading failures

---

## Browser Support

### Assumed
- Modern browsers (Chrome, Safari, Firefox, Edge)
- ES2020 features
- CSS Grid & Flexbox
- CSS custom properties

### Device Motion
- iOS 13+ (requires HTTPS + permission)
- Android (varies by browser)

### Touches
- iOS Safari
- Android Chrome
- Mobile Firefox

---

## Build & Deploy

### Tech Stack
- React 19.1
- Vite 5.4
- React Router (routing)
- Tailwind CSS 4.1 (partial)
- Lucide React (icons)
- Firebase (storage/hosting)

### Build Command
```bash
npm run build
```

### Deploy
```bash
firebase deploy
```

### Preview
```bash
npm run preview
```

---

## Important Notes for Developers

1. **Always run `npm run lint` after changes**
2. **Test on mobile before pushing**
3. **Check parallax performance on low-end devices**
4. **Verify sidebar cleanup on page transitions**
5. **Test device motion permission flows on iOS**
6. **Check Cloudinary image loads with CDN delays**
7. **Use theme constants for all colors**
8. **Don't hardcode z-index values**

---

## Quick Wins (Easy Refactoring)

1. Move all image URLs to `constants/images.js` (10 minutes)
2. Move color values to `constants/theme.js` (15 minutes)
3. Move navigation structures to `constants/navigation.js` (20 minutes)
4. Create `useParallax()` hook (30 minutes)
5. Create `useDeviceMotion()` hook (20 minutes)
6. Add ErrorBoundary wrapper to RouterApp (10 minutes)

**Total Time:** ~1.5 hours for 30% improvement in maintainability

---

## Files Needing Attention

### High Priority
- `src/pages/HomePage.jsx` - Too large, too much duplication
- `src/pages/ExperimentsPage.jsx` - Similar structure to HomePage
- `src/pages/ThoughtsPage.jsx` - Almost identical to ExperimentsPage

### Medium Priority
- `src/pages/AboutPage.jsx` - Inconsistent styling approach
- `src/pages/WorksPage.jsx` - Inconsistent styling approach
- `src/pages/HandsPage.jsx` - Inconsistent styling approach

### Low Priority
- `src/pages/TimeCapsulePage.jsx` - Isolated feature
- `src/pages/experiments/*` - Experimental pages
- `src/components/travel/*` - Travel feature components

### Archive (Can be deleted)
- `src/archive/app-alternatives/` - Old versions
- `src/App-17frame-broken.jsx` - Broken version
- `src/pages/Home17Page.jsx` - Experimental

---

## Document Reference

| Document | Purpose | Audience |
|----------|---------|----------|
| CODEBASE_ANALYSIS_REPORT.md | Detailed analysis | Developers, Project Managers |
| REFACTORING_ROADMAP.md | Implementation guide | Developers |
| QUICK_REFERENCE.md | Quick lookup | All team members |

---

## Contact & Support

For questions about:
- Architecture: See CODEBASE_ANALYSIS_REPORT.md
- Implementation: See REFACTORING_ROADMAP.md
- Specific issues: Search in this file

Generated: November 10, 2025  
Analysis Type: Complete codebase scan  
Recommendations: Critical before production

