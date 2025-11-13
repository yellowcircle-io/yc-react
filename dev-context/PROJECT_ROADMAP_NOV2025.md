# Project Roadmap - November 2025

**Date:** November 13, 2025
**Status:** Global Components Migration Complete - yellowCircle

---

## ✅ Completed November 13, 2025

### 🎉 **Phase 6: Complete Global Components Migration**

**Migration Status:**
- ✅ 15 of 16 pages now using global Layout system
- ✅ Unity Notes created as 2nd Brain variant page
- ✅ Labs sub-menu integration complete
- ✅ Bundle: 1,178.96 kB (gzipped: 302.71 kB)

**Work Completed:**

1. **Migrated Final Pages to Global Layout:**
   - BeingRhymePage: 643 → 143 lines (77% reduction)
   - Cath3dralPage: 654 → 143 lines (78% reduction)
   - BlogPage: 747 → 150 lines (80% reduction)
   - ExperimentsPage: Migrated with scrollable content area
   - FeedbackPage: Migrated with form functionality preserved
   - SitemapPage: Migrated with interactive grid layout
   - **Total: ~1,700 lines eliminated**

2. **Unity Notes Implementation (2nd Brain App):**
   - File: `src/pages/UnityNotesPage.jsx` (2,229 lines)
   - Full duplication of TimeCapsulePage.jsx (UK-Memories)
   - **Variant Sidebar:** Width 0px when closed (vs 80px standard)
   - Sidebar toggle position adjusted from 40px → 20px
   - All ReactFlow functionality preserved
   - Branding updated: "Unity Notes" / "2nd Brain App"

3. **Labs Sub-Menu Integration:**
   - Added to HamburgerMenu.jsx (lines 204-316)
   - 3 sub-items: UK-Memories, Unity Notes, Component Library
   - Parent div hover pattern for persistence
   - Smaller font size for visual hierarchy

4. **Router & Directory Updates:**
   - Added Unity Notes route to RouterApp.jsx
   - Updated DirectoryPage.jsx with all migration statuses
   - 15 pages marked "migrated", 1 "needs-migration" (Home-17), 2 "excluded"

**Files Modified:**
- `src/pages/UnityNotesPage.jsx` - Created (2,229 lines)
- `src/pages/experiments/BeingRhymePage.jsx` - Migrated
- `src/pages/experiments/Cath3dralPage.jsx` - Migrated
- `src/pages/thoughts/BlogPage.jsx` - Migrated
- `src/pages/ExperimentsPage.jsx` - Migrated
- `src/pages/FeedbackPage.jsx` - Migrated
- `src/pages/SitemapPage.jsx` - Migrated
- `src/components/global/HamburgerMenu.jsx` - Labs sub-menu added
- `src/RouterApp.jsx` - Unity Notes route added
- `src/pages/DirectoryPage.jsx` - Status updates

**Migration Pattern:**
All pages now follow unified structure:
- Import: useNavigate, useLayout, Layout, COLORS/TYPOGRAPHY/EFFECTS
- Context: sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle
- Wrapper: `<Layout>` with handlers and navigationItems
- Animations: fadeInUp keyframes with stagger delays (0.2s, 0.4s, 0.6s)
- Responsive: calc() and min() for adaptive positioning

**Variant Sidebar Pattern Established:**
```javascript
// Standard (UK-Memories): width: sidebarOpen ? 'min(35vw, 472px)' : '80px'
// Variant (Unity Notes): width: sidebarOpen ? 'min(35vw, 472px)' : '0px'
```

**Remaining Work:**
- Home-17 (not migrated - needs separate evaluation)
- UK-Memories (excluded - uses custom TimeCapsulePage)
- Component Library (excluded - specialized page)

**Impact:**
- Unified navigation across all pages
- ~1,700 lines of code eliminated
- Consistent user experience
- Variant pattern established for future use

**Time Investment:** ~2 hours (including corrections from user feedback)

---

## ✅ Completed November 12, 2025

### 🎉 **Phase 5: TailwindSidebar Migration - DEPLOYED TO PRODUCTION**

**Deployment:**
- ✅ Live URL: https://yellowcircle-app.web.app
- ✅ Version: v1.2.0
- ✅ Commit: 6331e03
- ✅ Bundle: 1,323.61 kB (down from 1,337.75 kB)

**Work Completed:**
1. **Created Shared TailwindSidebar Component**
   - File: `src/components/shared/TailwindSidebar.jsx` (209 lines)
   - Replaces inline sidebar code across 3 pages

2. **Migrated 3 Pages:**
   - AboutPage: 648 → 413 lines (235 lines removed, 36% reduction)
   - WorksPage: 705 → 468 lines (237 lines removed, 33% reduction)
   - HandsPage: 477 → 404 lines (73 lines removed, 15% reduction)
   - **Total: 545 lines eliminated**

3. **Screenshots Automated:**
   - Playwright installation and configuration
   - 9 screenshots captured (3 pages × 3 viewports)
   - Large Desktop (1920px), Common Desktop (1366px), Mobile (375px)
   - Location: `screenshots/phase5/`

4. **Git & Deployment:**
   - 5 files changed: 241 insertions, 576 deletions
   - Net reduction: 335 lines
   - Pushed to GitHub: yellowcircle-io/yc-react
   - Firebase deployment successful

**Files Created:**
- `src/components/shared/TailwindSidebar.jsx` - Shared sidebar component
- `PHASE5_DEPLOYMENT_COMPLETE.md` - Deployment documentation
- `screenshots/phase5/*.png` - 9 viewport screenshots

**Impact:**
- Code duplication reduced
- Bundle size: -14 KB
- Consistent navigation across 3 pages
- Production-ready deployment

**Time Investment:** ~30 minutes (highly efficient session)

---

## ✅ Completed November 8, 2025

### 1. **Perplexity Export Update**
- ✅ 12 new conversations manually exported
- ✅ CSV updated (376 total threads, 357 completed)
- ✅ Researched Cloudflare blocking (October 2024 bot detection enhancement)
- ✅ Documented automation alternatives (Zapier for future)

**Files Created:**
- `/dev-context/01-research/PERPLEXITY_EXPORT_RESEARCH_NOV2024.md` - Full export solutions research
- `/dev-context/01-research/CLOUDFLARE_BLOCKING_TIMELINE_NOV2024.md` - Why automation failed
- `/dev-context/05-tasks/thread_inventory-personal.csv` - Updated with new exports

---

## 🎯 Project Priority Order

### **1st Order: yellowCircle / Rho** [ETA: Present to EOY 2025]

#### **RHO**
- [ ] Events Upload Process

#### **YELLOWCIRCLE**
1. [ ] **Homepage Design Update**
   - Better sidebar UX
   - Simplified language
   - Improved iconography
   - Refined typography
   - Update "Your Circle For" → "Your Circle" with new H1 styling

2. [ ] **Global Components Standardization**
   - Use updated homepage as template
   - Ensure proper usage across all pages
   - Explore Storyblok or similar integration
   - ClaudeCode integration for streamlined development

3. [ ] **UK Memories Integration**
   - Align with 2nd Brain / Visual Note App development
   - Incorporate new design system

---

### **2nd Order: Golden Unknown Brand** [ETA: Mid-Nov 2024 to Q1 2026]

- [ ] Logo Refinement
- [ ] Social Media Assets
- [ ] Asset / Clothing Creation
- [ ] Advertisements

---

### **3rd Order: Cath3dral Creation** [ETA: Q1-Q3 2026]

- [ ] Being and Rhyme
- [ ] B-Corp Incorporation(s)
- [ ] Closed loop system

---

## 🔑 Key Cross-Cutting Projects

### **A. 2nd Brain App Development**

#### Context Added:
You mentioned additional context for "2nd Brain" app as **Visual Note App**.

**Next Steps:**
1. [ ] Review full scope with new context
2. [ ] Scope Visual Note app features
3. [ ] Explore iteration as Unified CRM/MA alternative
4. [ ] Position as HubSpot/Squarespace alternative
5. [ ] Research Grid.io comparison/lessons

**Strategic Goal:**
> Build 2nd Brain as alternative to HubSpot/Squarespace leveraging Marketing and Brand material creation capabilities

---

### **B. Multi-Machine Context System**

**Current Status:**
- `.claude/shared-context/WIP_CURRENT_CRITICAL.md` - Active
- `.claude/INSTANCE_LOG_[MACHINE].md` - Machine-specific logs
- Mac Mini + MacBook Air sync via Dropbox
- GitHub for version control

**Improvements Needed:**
- [ ] Add Notion integration layer
- [ ] Document Projects/Firebase/Claude Code/GitHub framework
- [ ] Explore additional documentation layers
- [ ] Update process documentation

---

### **C. Claude Web → Claude Code Integration**

**Goal:** Connect Claude web to Claude Code for additions to dev repositories

**Requirements Research Needed:**
- Integration points
- Workflow automation
- Version control sync
- Multi-machine considerations

---

## 📋 Immediate Next Steps (This Week)

### Priority 1: yellowCircle Homepage
```
1. Create new sidebar UX design
2. Simplify language throughout
3. Update iconography
4. Implement new H1 typography system:
   - "Your Circle" header
   - Font: Helvetica Neue, 900 weight
   - Size: clamp(1.17rem, 22.52vw, 20.98rem)
   - Styling: backdrop-filter: blur(3px)
   - Color: rgba(244, 244, 204, 0.3)
   - Line-height: 0.82
   - Margin: 7rem 0px
   - Padding: 2px 6px
```

### Priority 2: Perplexity Ongoing Solution
```
Option A: Browser Extension (Immediate)
  - Install "Save my Chatbot"
  - Use for ad-hoc exports as needed

Option B: Zapier Automation (This Month)
  - Set up Perplexity API account
  - Create Zapier workflow
  - Auto-export new conversations
  - Cost: ~$30/month
```

### Priority 3: 2nd Brain App Scoping
```
1. Gather all context documents
2. Review Visual Note app requirements
3. Create feature comparison: 2nd Brain vs HubSpot/Squarespace
4. Map out MVP features
5. Explore Grid.io case study
```

---

## 🗂️ Project Organization

### **Current Structure:**
```
yellowcircle/
├── .claude/
│   ├── shared-context/
│   │   └── WIP_CURRENT_CRITICAL.md  ← Check this daily
│   ├── INSTANCE_LOG_[MACHINE].md
│   └── MULTI_MACHINE_SETUP_CRITICAL.md
├── dev-context/
│   ├── 01-research/
│   │   ├── perplexity-exports/  (357 exported threads)
│   │   ├── PERPLEXITY_EXPORT_RESEARCH_NOV2024.md
│   │   └── CLOUDFLARE_BLOCKING_TIMELINE_NOV2024.md
│   └── 05-tasks/
│       ├── thread_inventory-personal.csv (376 threads)
│       └── perplexity_exporter.py (blocked by Cloudflare)
├── src/  (React app source)
└── DECISIONS.md  ← Decision history
```

---

## 📊 Metrics & Tracking

### **Perplexity Export Status:**
- **Total Threads:** 376
- **Completed:** 357 (95%)
- **Pending:** 19
- **Last Update:** Nov 8, 2024

### **yellowCircle Development:**
- **Current Focus:** Homepage redesign
- **Next Release:** EOY 2025
- **Tech Stack:** React 19, Vite 5, Tailwind CSS 4

### **2nd Brain App:**
- **Status:** Scoping phase
- **Target:** Q1 2026
- **Goal:** CRM/MA alternative

---

## 🔄 Workflow Process

### **Daily:**
1. Check `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
2. Update instance log for current machine
3. Commit changes to GitHub (includes `.claude/` for mobile access)
4. Sync via Dropbox (30-second wait before switching machines)

### **Weekly:**
1. Review DECISIONS.md for decision history
2. Update PROJECT_ROADMAP_NOV2024.md (this file)
3. Perplexity: Manual export of 5-10 new critical conversations
4. Multi-machine sync check

### **Monthly:**
1. Comprehensive project status review
2. Update all documentation
3. Notion integration updates (when implemented)
4. Perplexity: Batch export or Zapier check

---

## 🎨 Homepage Design Specs (Reference)

### **New H1 Style:**
```css
h1.your-circle {
  margin: 7rem 0px;
  backdrop-filter: blur(3px);
  display: inline-block;
  font-size: clamp(1.17rem, 22.52vw, 20.98rem);
  font-weight: 900;
  padding: 2px 6px;
  line-height: 0.82;
  font-family: "Helvetica Neue";
  color: rgba(244, 244, 204, 0.3) !important;
}
```

### **Design Philosophy:**
- Simplified language
- Better sidebar UX
- Improved iconography
- Consistent global components
- Refined typography hierarchy

---

## 📱 Integrations to Explore

### **Content Management:**
- [ ] Storyblok
- [ ] Alternative CMS options
- [ ] ClaudeCode integration

### **Documentation:**
- [ ] Notion integration for project tracking
- [ ] Firebase documentation layer
- [ ] GitHub workflow automation

### **Development:**
- [ ] Claude Web → Claude Code connection
- [ ] Multi-machine dev sync improvements
- [ ] Automated deployment pipelines

---

## 🚀 Success Criteria

### **yellowCircle (EOY 2025):**
- ✅ Homepage redesigned with new typography
- ✅ Global components standardized
- ✅ UK Memories integrated
- ✅ Rho events upload functional

### **2nd Brain App (Q1 2026):**
- ✅ Full scope documented
- ✅ Visual Note features defined
- ✅ CRM/MA positioning clear
- ✅ MVP features mapped
- ✅ Grid.io lessons incorporated

### **Infrastructure:**
- ✅ Multi-machine context system optimized
- ✅ Notion integration layer active
- ✅ Claude Web → Code integration working
- ✅ Documentation comprehensive

---

## 📎 Key Links & References

**Current Work:**
- `.claude/shared-context/WIP_CURRENT_CRITICAL.md`

**Decision History:**
- `DECISIONS.md`

**Instance Logs:**
- `.claude/INSTANCE_LOG_[MACHINE].md`

**Research:**
- `/dev-context/01-research/`

**Perplexity Exports:**
- `/dev-context/01-research/perplexity-exports/` (357 files)

---

**Next Update:** November 15, 2025
**Owner:** Christopher Cooper
**Version:** 1.0
