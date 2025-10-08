# CLAUDE.md - Updated Project Guide

**Guidance for Claude Code AI when working with the Yellow Circle repository.**

---

## 🎯 Quick Reference

**Entry Point:** `src/main.jsx` → `src/RouterApp.jsx`
**Current System:** React Router v6 with multi-page architecture
**Primary Dev Command:** `npm run dev` (localhost:5173)
**Build Command:** `npm run build` → `dist/`
**Deploy:** `firebase deploy` (serves from `dist/`)

---

## ⚠️ Critical File Usage Information

### ACTIVE App Files - DO NOT ARCHIVE OR MODIFY

1. **`src/App-17frame.jsx`** ✅ IN USE
   - **Used by:** `src/pages/Home17Page.jsx`
   - **Route:** `/home-17`
   - **Purpose:** 17-frame transformation animatic system
   - **Documentation:** See `claude-home17-fixes.md` for implementation details
   - **Status:** Functional alternate homepage with advanced SVG morphing

### ALTERNATIVE/REFERENCE App Files - Historical Alternatives

These are **intentionally kept as design alternatives**, not deprecated code:

2. **`src/App.jsx`**
   - **Original Purpose:** Pre-router standalone version with advanced scroll interactions
   - **Relationship:** Template for `src/pages/HomePage.jsx` (router-enabled version)
   - **Keep as:** Reference implementation for homepage features
   - **Documentation:** See `YELLOW_CIRCLE_DOCUMENTATION.md` section "App.jsx - Advanced Interactive Version"

3. **`src/App2.jsx`**
   - **Purpose:** Simpler visual alternative with ornate/jewelry-inspired design
   - **Status:** Design alternative, not integrated into router
   - **Keep as:** Alternative design reference

4. **`src/App-exp.jsx`**
   - **Purpose:** Experimental template-based version
   - **Status:** Exploration/prototype

5. **`src/App-v09.jsx`**
   - **Purpose:** Version 0.9 snapshot
   - **Status:** Historical reference

6. **`src/App-17frame-broken.jsx`**
   - **Purpose:** Known-broken version (explicitly named)
   - **Action:** Can be safely deleted if disk space needed

### Recommended File Organization (Optional)

If you need to clean up the `src/` directory without losing alternatives:

```bash
# Create archive for reference implementations
mkdir -p src/archive/app-alternatives

# Move non-active App files (KEEP App-17frame.jsx!)
mv src/App.jsx src/archive/app-alternatives/
mv src/App2.jsx src/archive/app-alternatives/
mv src/App-exp.jsx src/archive/app-alternatives/
mv src/App-v09.jsx src/archive/app-alternatives/

# Optional: Delete explicitly broken version
rm src/App-17frame-broken.jsx

# Move backup files
mkdir -p backups/
mv src/*.original-backup backups/
mv src/pages.backup-before-extension backups/
```

**⚠️ WARNING:** Do NOT move `App-17frame.jsx` - it's actively imported by `Home17Page.jsx`!

---

## 📁 Project Structure

### Current Architecture (React Router)

```
src/
├── main.jsx                    # Entry point (renders RouterApp)
├── RouterApp.jsx               # React Router setup with all routes
├── index.css                   # Global Tailwind styles
│
├── App-17frame.jsx             # ✅ ACTIVE: 17-frame animatic (used by Home17Page)
├── App.jsx                     # Reference: Original advanced homepage
├── App2.jsx                    # Reference: Simpler alternative design
├── App-*.jsx                   # Reference: Various alternatives/experiments
│
├── pages/
│   ├── HomePage.jsx            # Main landing page (router version of App.jsx)
│   ├── Home17Page.jsx          # 17-frame transformation page (imports App-17frame)
│   ├── ExperimentsPage.jsx     # Creative projects showcase
│   ├── ThoughtsPage.jsx        # Blog/writing hub
│   ├── AboutPage.jsx           # Company/personal info
│   ├── WorksPage.jsx           # Portfolio showcase
│   │
│   ├── experiments/
│   │   ├── GoldenUnknownPage.jsx
│   │   ├── BeingRhymePage.jsx
│   │   ├── Cath3dralPage.jsx
│   │   ├── ComponentLibraryPage.jsx
│   │   └── component-library/          # Interactive component browser system
│   │       ├── components/             # UI components for library
│   │       ├── libraries/              # Component collections
│   │       │   ├── rho/                # Rho business components
│   │       │   ├── yellowcircle/
│   │       │   ├── cath3dral/
│   │       │   └── golden-unknown/
│   │       └── utils/
│   │
│   └── thoughts/
│       └── BlogPage.jsx
│
└── assets/                     # Local development assets
```

### Other Directories

```
/
├── component-library/          # ⚠️ NOT React code - HubSpot deployment scripts (Python)
├── rho-hubspot-deployment/     # HubSpot-specific deployment tools
├── my-project/                 # ⚠️ Separate Vite starter template (not integrated)
├── dev-context/                # Development notes and context
├── dist/                       # Build output (Firebase deploy source)
├── functions/                  # Firebase functions
├── public/                     # Static assets
└── [documentation files]       # Various .md files (see Documentation section below)
```

---

## 🛠️ Tech Stack

**Core:**
- React 19.1 (functional components + hooks only)
- Vite 5.4 (build tool, HMR)
- React Router DOM 6.30 (routing)

**Styling:**
- Tailwind CSS 4.1
- Inline styles for complex animations

**Icons & UI:**
- Lucide React

**Deployment:**
- Firebase Hosting
- SPA rewrites enabled

**Dev Tools:**
- ESLint (React plugins)
- Builder.io dev tools

---

## 📍 React Router Routes

### Main Routes
- `/` → HomePage (horizontal scroll portfolio)
- `/home-17` → Home17Page (17-frame transformation animatic) ✨
- `/experiments` → ExperimentsPage
- `/thoughts` → ThoughtsPage
- `/about` → AboutPage
- `/works` → WorksPage

### Experiment Sub-routes
- `/experiments/golden-unknown` → GoldenUnknownPage
- `/experiments/being-rhyme` → BeingRhymePage
- `/experiments/cath3dral` → Cath3dralPage
- `/experiments/component-library` → ComponentLibraryPage

### Thought Sub-routes
- `/thoughts/blog` → BlogPage

### Placeholder Routes (future)
- `/about/timeline`, `/about/services`, `/about/contact`
- `/works/websites`, `/works/graphics`, `/works/music`

---

## 🎨 Key Features by Page

### HomePage (`/`)
**Most complex page - Advanced scroll interactions:**

- **Multi-page horizontal scroll** (3 background images)
- **Navigation Circle Animation:**
  - Starts at 0°, animates to -90° on page load (500ms delay)
  - Rotates -90° → 0° based on scroll progress (0-200 units)
  - At scroll completion: acts as footer toggle
- **Sidebar Accordion:** True accordion with vertical positioning
- **Parallax System:** Combined mouse tracking + device motion
- **Multi-input Scrolling:**
  - Mouse wheel (horizontal + vertical)
  - Keyboard arrows
  - Touch gestures (mobile-optimized)
  - Device orientation/accelerometer (iOS permission handling)

**Technical Details:**
- Mouse tracking throttled to ~60fps (16ms)
- Scroll range: 0-200 units
- Navigation circle rotation formula: `-90 + (scrollOffset / 200) * 90`
- Device motion with iOS 13+ permission requests

### Home17Page (`/home-17`)
**17-Frame Transformation Animatic:**

- **Scroll-based frame system:** 17 discrete transformation frames
- **SVG Morphing:** Smooth transitions between symbolic forms
- **Frame sequence:**
  1. Fetus/Egg (cosmic beginning)
  2. Baby (birth of form)
  3. Sun (solar radiance)
  4. Moon (celestial shift)
  5. Stars (particle dissolution)
  6. Single Star (unity)
  7. Eye/Iris (cosmic vision)
  8. Wheel (mechanical form)
  9. Eye+Hand (dual genesis)
  10. Shiva Hands (divine multiplication)
  11. Red Tears (crimson flow)
  12. Pool (liquid formation)
  13. Sword (liquid to solid)
  14. Cross (sacred geometry)
  15. Clock at 10:34 (temporal gateway)
  16. Full Circle (completion)
  17. Cycle Overview (eternal return)

**Known Issues (see `claude-home17-fixes.md`):**
- Morph calculation originally broken (modulo error)
- SVG definitions required population
- Frame transitions needed opacity/transform system

### ExperimentsPage (`/experiments`)
- Project cards with sub-page navigation
- Same parallax/sidebar systems as HomePage
- Simpler (no scroll-based nav circle rotation)

### ComponentLibraryPage (`/experiments/component-library`)
**Interactive Component Browser:**

- **Library switching:** rho, yellowcircle, cath3dral, golden-unknown
- **Component categories:** Email components, Atoms, etc.
- **Features:**
  - Live previews (EmailPreviewFrame for email components)
  - Code examples with copy-to-clipboard
  - Search and filter by category/tags
  - Component metadata (props, descriptions)

**Rho Components:**
- Email: Header, BodyWithCTA, Highlight, TwoColumnCards, PreFooter, Footer
- Atoms: Button variants, HorizontalRule variants, ColorPalette

---

## 🔧 Development Commands

```bash
# Development
npm run dev           # Vite dev server (localhost:5173)
npm run start         # Dev server with host binding (0.0.0.0:5173) - for mobile testing
npm run lint          # ESLint check ⚠️ ALWAYS RUN AFTER CHANGES

# Production
npm run build         # Build to dist/
npm run preview       # Preview production build

# Deployment
firebase deploy       # Deploy dist/ to Firebase Hosting
```

### Development Workflow

1. **Make changes** to React components
2. **Test locally** with `npm run dev`
3. **Run linter** with `npm run lint` ⚠️ Required
4. **Build** with `npm run build`
5. **Deploy** with `firebase deploy`

---

## 🧩 Common Page Component Patterns

Most page components share this structure:

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function PageComponent() {
  const navigate = useNavigate();

  // Common state across all pages
  const [menuOpen, setMenuOpen] = useState(false);                    // Hamburger menu
  const [sidebarOpen, setSidebarOpen] = useState(false);              // Left sidebar
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // Parallax
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });   // Device orientation
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0 });
  const [expandedSection, setExpandedSection] = useState(null);       // Sidebar accordion
  const [footerOpen, setFooterOpen] = useState(false);                // Footer toggle

  // HomePage-specific
  const [scrollOffset, setScrollOffset] = useState(0);                // Horizontal scroll
  const [navCircleRotation, setNavCircleRotation] = useState(0);     // Nav circle rotation

  // Throttled mouse tracking (~60fps)
  // Device motion handlers (iOS permission)
  // Scroll handlers
  // Keyboard handlers
  // Touch handlers

  return (
    <div className="page-container">
      {/* Hamburger Menu Overlay */}
      {/* Sidebar (Accordion Navigation) */}
      {/* Main Content with Parallax Yellow Circle */}
      {/* Footer (Contact/Projects) */}
    </div>
  );
}
```

---

## 📝 Documentation Files

The project contains multiple documentation files tracking development history:

**Essential Documentation:**
- `CLAUDE.md` (original - AI guidance)
- `CLAUDE-NEW.md` (this file - updated AI guidance)
- `README.md` (standard project readme)
- `YELLOW_CIRCLE_DOCUMENTATION.md` (comprehensive app overview)

**Implementation Logs:**
- `ROUTER-IMPLEMENTATION-LOG.md` (React Router migration)
- `component-library-implementation-summary.md`
- `claude-home17-fixes.md` (17-frame system bug fixes)

**Development Context:**
- `CHANGES-MADE.md` (historical changes)
- `FINAL-TEST-REPORT.md`
- `claude-alt-HOMEPAGE-instructions.md`
- `claude-visual-enhancement-guide.md`

**Recommendation:** Consider consolidating into `/docs/` directory:
```
docs/
├── README.md (main)
├── guides/
│   ├── architecture.md (from YELLOW_CIRCLE_DOCUMENTATION)
│   ├── home17-system.md (from claude-home17-fixes)
│   └── component-library.md
└── history/
    ├── changes.md
    ├── router-migration.md
    └── test-reports.md
```

---

## 🚨 Common Issues & Solutions

### Navigation Circle Not Animating
**Problem:** Circle doesn't rotate with scroll
**Solution:**
- Check scroll offset range (0-200)
- Verify rotation formula: `-90 + (scrollOffset / 200) * 90`
- Ensure `updateScrollOffset` callback updates `navCircleRotation` state

### Device Motion Not Working (iOS)
**Problem:** Parallax doesn't respond to device tilt
**Solution:**
- Check for `DeviceOrientationEvent.requestPermission` function
- Request permission before adding event listeners
- Gracefully fall back to mouse-only parallax on denial

### Routes Not Working After Firebase Deploy
**Problem:** Direct navigation to `/experiments` returns 404
**Solution:**
- Verify `firebase.json` has SPA rewrite: `{"source": "**", "destination": "/index.html"}`
- Rebuild with `npm run build` before `firebase deploy`
- Check that `dist/index.html` exists

### Component Library Not Showing Components
**Problem:** Components don't render in preview
**Solution:**
- Check that component data in `ComponentLibraryPage.jsx` includes `component:` JSX
- Verify library imports at top of file
- Ensure `activeLibrary` state matches library key in `componentData` object

### Home17Page Frames Not Morphing
**Problem:** 17-frame system shows same image
**Solution:**
- See detailed fixes in `claude-home17-fixes.md`
- Check scroll-to-frame calculation: `framePosition = scrollProgress * 16`
- Verify SVG definitions are populated (not empty strings)
- Ensure `morphProgress = framePosition - Math.floor(framePosition)`

---

## 🎯 Instructions for Claude Code Execution

### When Reviewing Code
1. **Check current routing system** - Use `RouterApp.jsx`, not standalone App files
2. **Identify active vs. reference files** - Don't modify App alternatives without confirming usage
3. **Understand page component patterns** - Most pages share structure (see Common Patterns above)

### When Adding Features
1. **New pages:**
   - Create in `src/pages/` (or subdirectory)
   - Add route to `src/RouterApp.jsx`
   - Import component at top of RouterApp
   - Use `useNavigate()` hook for navigation
2. **New components:**
   - Follow React 19 patterns (functional components, hooks)
   - Use Tailwind classes primarily
   - Inline styles only for complex animations
3. **Always run `npm run lint`** after changes

### When Debugging
1. **Check route definition** in `RouterApp.jsx` first
2. **Verify imports** are correct and files exist
3. **Test device motion** requires HTTPS or localhost
4. **Check console** for permission errors (iOS orientation)

### When Refactoring
1. **Extract shared logic** to custom hooks:
   - `useMouseTracking()`
   - `useDeviceMotion()`
   - `useSidebarState()`
2. **Create layout component** for shared page structure
3. **Move component data** to JSON files (ComponentLibraryPage)

### File Safety Rules
✅ **Safe to modify:**
- Any file in `src/pages/`
- `src/RouterApp.jsx`
- `src/main.jsx`
- `src/index.css`

⚠️ **Caution required:**
- `src/App-17frame.jsx` (actively used by Home17Page)
- Any file imported by another file

❌ **Do not delete without verification:**
- Any `App-*.jsx` file (check for imports first)
- Backup directories (may contain important history)

---

## 📦 Asset Management

**Production Images:**
- Hosted on Cloudinary CDN
- Optimized delivery (WebP, responsive sizing)

**Local Assets:**
- `src/` currently contains design reference images ⚠️
- Recommendation: Move to `design-assets/` outside of `src/`

**Navigation Icons:**
- Inline SVG for customization
- Defined directly in page components

---

## 🚀 Deployment

### Firebase Hosting Configuration

**File:** `firebase.json`
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Build Process:**
1. `npm run build` → Creates optimized `dist/` directory
2. `firebase deploy` → Uploads `dist/` to Firebase Hosting
3. SPA rewrites handle client-side routing

---

## 🧪 Testing Notes

**Mobile Testing:**
- Use `npm run start` (binds to 0.0.0.0)
- Access via local network IP on mobile device
- Required for device motion testing

**Device Motion:**
- Requires HTTPS or localhost
- iOS requires user permission
- Android typically works without permission

**Browser Compatibility:**
- Targets modern browsers (ES2020+)
- Device motion support varies by browser/device

---

## 📊 Code Style & Conventions

**React Patterns:**
- Functional components only (no classes)
- Hooks for state and side effects
- `useCallback` for optimized event handlers

**State Management:**
- Local component state (useState)
- No external state library (Redux, etc.)

**Styling:**
- Tailwind utility classes (primary)
- Inline styles for dynamic/animated properties
- CSS modules not used

**Naming Conventions:**
- PascalCase for components (`HomePage.jsx`)
- camelCase for variables/functions
- SCREAMING_SNAKE_CASE for constants

**File Organization:**
- One component per file
- Colocate related components in directories
- Index files for library exports

---

## 🔮 Future Improvements

**Code Quality:**
1. Extract shared hooks (mouse tracking, device motion, sidebar state)
2. Create shared page layout component
3. Move component library data to JSON files
4. Add TypeScript for better type safety

**File Organization:**
1. Archive unused App files to `src/archive/app-alternatives/`
2. Move design images to `design-assets/`
3. Consolidate documentation to `docs/` directory
4. Remove or archive `my-project/` directory

**Features:**
1. Implement placeholder routes (about/timeline, works/websites, etc.)
2. Add loading states and transitions
3. Improve accessibility (ARIA labels, keyboard navigation)
4. Add unit tests for complex logic

**Performance:**
1. Lazy load page components (React.lazy)
2. Optimize image loading (lazy loading, intersection observer)
3. Consider reducing bundle size (code splitting)

---

## 🤝 Contributing Guidelines

**For AI Assistants:**
1. Always verify file usage before suggesting deletions
2. Respect existing architectural decisions (React Router, functional components)
3. Run `npm run lint` after code modifications
4. Test changes with `npm run dev` before suggesting deployment
5. Update this documentation if making structural changes

**For Developers:**
1. Follow existing code patterns and conventions
2. Add new routes through RouterApp.jsx
3. Keep page components consistent in structure
4. Document complex logic and non-obvious decisions
5. Test device motion features on actual mobile devices

---

**Last Updated:** 2025-10-08
**Project Version:** 0.0.0 (pre-release)
**Maintained By:** Yellow Circle / Christopher Cooper
