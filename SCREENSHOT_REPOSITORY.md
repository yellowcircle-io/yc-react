# Screenshot Repository

**Purpose:** Visual documentation of all pages in the yellowCIRCLE application
**Last Updated:** November 10, 2025
**Status:** Initial creation - screenshots to be added progressively

---

## How to Use This Repository

### Adding Screenshots
1. Navigate to the page in browser
2. Take screenshot (full page if possible)
3. Save to `/screenshots/` directory with naming convention: `[page-name]-[date]-[feature].png`
4. Update this document with screenshot reference and notes

### Screenshot Locations
- **Local:** `/screenshots/` directory in project root
- **Cloudinary:** Hosted screenshots for production documentation
- **GitHub:** Screenshots synced via git for version control

---

## Main Pages

### 1. HomePage (`/`)
**Route:** `/`
**File:** `src/pages/HomePage.jsx`
**Status:** ✅ Advanced implementation with horizontal scrolling

**Features:**
- Multi-page horizontal scrolling (3 background images)
- Dynamic navigation circle (rotates -90° to 0°)
- Collapsible footer
- True accordion sidebar
- Advanced parallax with mouse + device motion
- Hamburger menu overlay

**Screenshots:**
- [ ] Desktop view (1920px)
- [ ] Tablet view (768px)
- [ ] Mobile view (375px)
- [ ] Sidebar open
- [ ] Footer expanded
- [ ] Hamburger menu

**Current Issues:**
- Sidebar jitter on hover (documented in `KNOWN_ISSUES.md`)
- Click instability (occasional double-click needed)

---

### 2. AboutPage (`/about`)
**Route:** `/about`
**File:** `src/pages/AboutPage.jsx`
**Status:** ⏳ Using inline sidebar (needs global component migration)

**Features:**
- Philosophy and approach content
- Parallax yellow circle (using shared `useParallax` hook ✅)
- Inline sidebar implementation (to be replaced)
- Tailwind CSS styling

**Screenshots:**
- [x] Desktop view - Provided in session (shows inline sidebar)
- [ ] Tablet view
- [ ] Mobile view
- [ ] Sidebar open

**Action Required:**
- Replace inline sidebar with global `Sidebar` component from `src/components/global/Sidebar.jsx`
- Replace inline footer with global `Footer` component
- Replace inline hamburger menu with global `HamburgerMenu` component

**Reference Screenshot:** User provided screenshot showing AboutPage with inline sidebar (black navigation on left)

---

### 3. WorksPage (`/works`)
**Route:** `/works`
**File:** `src/pages/WorksPage.jsx`
**Status:** ⏳ Using inline sidebar (needs global component migration)

**Features:**
- Portfolio: websites, graphics, music projects
- Parallax yellow circle (using shared `useParallax` hook ✅)
- Inline sidebar (to be replaced)
- Tailwind CSS styling

**Screenshots:**
- [ ] Desktop view
- [ ] Tablet view
- [ ] Mobile view
- [ ] Sidebar with Works sub-sections expanded

**Action Required:**
- Same as AboutPage - replace inline components with global components

---

### 4. HandsPage (`/hands`)
**Route:** `/hands`
**File:** `src/pages/HandsPage.jsx`
**Status:** ⏳ Using inline sidebar (needs global component migration)

**Features:**
- Creative projects showcase
- Parallax yellow circle (using shared `useParallax` hook ✅)
- Inline sidebar (to be replaced)
- Tailwind CSS styling

**Screenshots:**
- [ ] Desktop view
- [ ] Tablet view
- [ ] Mobile view

**Action Required:**
- Replace inline components with global components

---

## Experiment Pages

### 5. ExperimentsPage (`/experiments`)
**Route:** `/experiments`
**File:** `src/pages/ExperimentsPage.jsx`
**Status:** ⏳ Using inline components (needs global component migration)

**Features:**
- Hub for all experimental projects
- Parallax effects (using shared `useParallax` hook ✅)
- Links to sub-experiments
- Inline sidebar (to be replaced)

**Screenshots:**
- [ ] Desktop view
- [ ] Tablet view
- [ ] Mobile view
- [ ] Experiments list expanded

**Sub-Experiments:**

#### 5a. Golden Unknown (`/experiments/golden-unknown`)
**File:** `src/pages/experiments/GoldenUnknownPage.jsx`
- [ ] Screenshots needed

#### 5b. Being Rhyme (`/experiments/being-rhyme`)
**File:** `src/pages/experiments/BeingRhymePage.jsx`
- [ ] Screenshots needed

#### 5c. Cath3dral (`/experiments/cath3dral`)
**File:** `src/pages/experiments/Cath3dralPage.jsx`
- [ ] Screenshots needed

#### 5d. Component Library (`/experiments/component-library`)
**File:** `src/pages/experiments/ComponentLibraryPage.jsx`
- [ ] Screenshots needed

---

### 6. ThoughtsPage (`/thoughts`)
**Route:** `/thoughts`
**File:** `src/pages/ThoughtsPage.jsx`
**Status:** ⏳ Using inline components (needs global component migration)

**Features:**
- Essays and reflections hub
- Parallax effects (using shared `useParallax` hook ✅)
- Links to blog and written content
- Inline sidebar (to be replaced)

**Screenshots:**
- [ ] Desktop view
- [ ] Tablet view
- [ ] Mobile view

**Sub-Pages:**

#### 6a. Blog (`/thoughts/blog`)
**File:** `src/pages/thoughts/BlogPage.jsx`
- [ ] Screenshots needed

---

## Special Pages

### 7. UK Memories / Time Capsule (`/uk-memories`)
**Route:** `/uk-memories`
**File:** `src/pages/TimeCapsulePage.jsx`
**Status:** ✅ Complete implementation

**Features:**
- Travel photo gallery
- Time capsule creation interface
- Memory storage and retrieval
- Firebase integration

**Screenshots:**
- [ ] Main capsule list
- [ ] Create capsule form
- [ ] Individual capsule view (`/uk-memories/view/:id`)
- [ ] Mobile gallery view

---

### 8. Feedback Page (`/feedback`)
**Route:** `/feedback`
**File:** `src/pages/FeedbackPage.jsx`
**Status:** ✅ Complete - alpha testing ready

**Features:**
- Categorized feedback form (bug/feature/ux/performance)
- Auto-detection of browser and device
- Firebase Analytics integration
- Thank you confirmation page

**Screenshots:**
- [ ] Feedback form (empty)
- [ ] Category selection
- [ ] Thank you page
- [ ] Mobile view

---

### 9. Sitemap (`/sitemap`)
**Route:** `/sitemap`
**File:** `src/pages/SitemapPage.jsx`
**Status:** ✅ Just created

**Features:**
- Complete directory of all pages
- Categorized page listings
- Site statistics
- Navigation links to all pages

**Screenshots:**
- [ ] Desktop view
- [ ] Tablet view
- [ ] Mobile view
- [ ] All categories visible

---

### 10. 404 Not Found (`/*`)
**Route:** Any unmatched route
**File:** `src/pages/NotFoundPage.jsx`
**Status:** ✅ Complete

**Screenshots:**
- [ ] 404 page
- [ ] Mobile view

---

## Shared Components (for reference)

### Global Sidebar
**File:** `src/components/global/Sidebar.jsx`
**Status:** ✅ Created in Phase 2, ready to use

**Features:**
- Three-section flexbox layout
- 3-level accordion navigation
- GPU-accelerated animations
- Configurable via props
- Responsive width (280px-472px)

**Usage Example:**
```javascript
import { Sidebar } from '../components/global';

<Sidebar
  scrollOffset={scrollOffset}
  navigationItems={items}
  logoSrc="/logo.svg"
/>
```

**Screenshots:**
- [ ] Sidebar collapsed
- [ ] Sidebar expanded
- [ ] Accordion sections expanded
- [ ] Mobile view

---

### Global Footer
**File:** `src/components/global/Footer.jsx`
**Status:** ✅ Created in Phase 2, ready to use

**Features:**
- Collapsible design (60px → 300px)
- Contact and Projects sections
- Grid layout with hover effects
- Smooth animations

**Screenshots:**
- [ ] Footer collapsed
- [ ] Footer expanded
- [ ] Hover states
- [ ] Mobile view

---

### Global Hamburger Menu
**File:** `src/components/global/HamburgerMenu.jsx`
**Status:** ✅ Created in Phase 2, ready to use

**Features:**
- Fullscreen overlay menu
- Staggered item animations
- Escape key support
- Body scroll lock
- Custom menu items

**Screenshots:**
- [ ] Menu closed (just icon)
- [ ] Menu open (fullscreen)
- [ ] Animation sequence
- [ ] Mobile view

---

## Screenshot Naming Convention

```
[page-name]-[viewport]-[state]-[date].png
```

### Examples:
- `homepage-desktop-default-20251110.png`
- `aboutpage-mobile-sidebar-open-20251110.png`
- `experiments-tablet-hover-20251110.png`
- `feedback-desktop-form-filled-20251110.png`

### Viewport Options:
- `desktop` - 1920x1080 or larger
- `tablet` - 768x1024
- `mobile` - 375x667

### State Options:
- `default` - Initial page load
- `sidebar-open` - Sidebar expanded
- `sidebar-closed` - Sidebar collapsed
- `footer-open` - Footer expanded
- `menu-open` - Hamburger menu visible
- `hover` - Element hovered
- `active` - Element active/clicked
- `error` - Error state
- `loading` - Loading state

---

## Screenshot Collection Plan

### Priority 1 (Immediate)
1. AboutPage - desktop default (document before migration)
2. WorksPage - desktop default (document before migration)
3. HandsPage - desktop default (document before migration)
4. ExperimentsPage - desktop default (document before migration)
5. ThoughtsPage - desktop default (document before migration)

### Priority 2 (After Global Component Migration)
1. AboutPage - desktop with global sidebar
2. WorksPage - desktop with global sidebar
3. HandsPage - desktop with global sidebar
4. ExperimentsPage - desktop with global components
5. ThoughtsPage - desktop with global components

### Priority 3 (Complete Documentation)
1. All pages - mobile views
2. All pages - tablet views
3. All pages - interactive states
4. Special features - detailed documentation

---

## Automated Screenshot Tools (Future)

Consider implementing:
- **Playwright** - Automated screenshot capture
- **Percy** - Visual regression testing
- **Chromatic** - Storybook visual testing
- **GitHub Actions** - Automated screenshot on PR

---

## Screenshot Storage Locations

### Local Development
```
/screenshots/
  /pages/
    /homepage/
    /about/
    /works/
    /hands/
    /experiments/
    /thoughts/
  /components/
    /sidebar/
    /footer/
    /hamburger-menu/
  /states/
    /hover/
    /active/
    /error/
```

### Cloud Storage
- **Cloudinary:** For production documentation
- **GitHub:** Version-controlled screenshots
- **Dropbox:** Backup and sharing

---

## Current Screenshot Status

**Total Pages:** 18 (including sub-pages)
**Screenshots Captured:** 1 (AboutPage provided by user)
**Screenshots Needed:** 17+ pages × 3 viewports × 2-3 states = ~100+ screenshots

**Completion:** 1%

---

## Next Steps

1. ✅ Create screenshot directory structure
2. ⏳ Capture "before" screenshots of pages with inline components
3. ⏳ Migrate pages to global components
4. ⏳ Capture "after" screenshots
5. ⏳ Document visual differences
6. ⏳ Create comparison view
7. ⏳ Set up automated screenshot system

---

## Related Documentation

- `KNOWN_ISSUES.md` - Known visual bugs to document in screenshots
- `PHASE3_COMPLETE.md` - Pages using shared `useParallax` hook
- `REFACTOR_COMPLETE.md` - Global components ready for use
- `CODEBASE_ANALYSIS_REPORT.md` - Technical details of all pages

---

**Maintained by:** Claude Code
**Repository:** yellowCIRCLE
**Purpose:** Visual regression tracking and documentation
