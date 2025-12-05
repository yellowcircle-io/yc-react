# Project Roadmap - December 2025

**Date:** December 5, 2025
**Status:** 🔐 FIREBASE AUTH COMPLETE - SSO + Credits System
**Days Since Rho Exit:** 10 (Nov 25, 2025)

---

## 🔴 PHASED LAUNCH PLAN (5 Phases, 30 Days)

### PHASE 0: IMMEDIATE BLOCKERS (Day 1-2) ✅ COMPLETE
| Task | Status | Owner |
|------|--------|-------|
| Google Tag Manager (GTM-T4D8CCDC) | ✅ Done | Claude Code |
| Cal.com setup (integrated, not Calendly) | ✅ Done | Self |
| Domain migration (yellowcircle.io) | ✅ Done | Self |
| Favicon update from legacy assets | ✅ Done | Claude Code |

### PHASE 1: INFRASTRUCTURE (Day 3-7)
| Task | Status | Owner |
|------|--------|-------|
| Prospect database (Airtable → Supabase path) | 🔲 Scoped | Self |
| Form → DB → Notification pipeline | 🔲 Scoped | Claude Code + Self |
| Prospect enrichment (Apollo.io free tier) | 🔲 Scoped | Self |
| Outreach approval workflow (Slack/Notion) | 🔲 Scoped | Self |

### PHASE 2: PRODUCT OPTIMIZATION (Day 8-14)
| Task | Status | Owner |
|------|--------|-------|
| P0-1: Unity Notes v1 | ✅ Done | Claude Code |
| Unity Notes UI refinements (gear, pagination, deletion) | ✅ Done | Claude Code |
| Unity Notes cost optimization (free tier gating) | 🔲 Scoped | Claude Code |
| P0-2: Assessment → Services funnel | 🔲 Scoped | Claude Code |
| Component Library global components | 🔲 Planned | Claude Code |
| Mobile responsiveness audit | 🔲 In Progress | Self + Claude Code |

### PHASE 3: DISTRIBUTION & ADS (Day 15-21)
| Task | Status | Owner |
|------|--------|-------|
| Ads Generator (Component Library integration) | 🔲 Planned | Claude Code |
| Paid ads strategy (Reddit, LinkedIn, IG) | 🔲 Planned | Self |
| Ad creative pipeline | 🔲 Planned | Claude Code |

### PHASE 4: MOBILE & APP STORE (Day 22-30)
| Task | Status | Owner |
|------|--------|-------|
| Mobile optimization testing | 🔲 Planned | Self |
| PWA setup for Unity Notes | 🔲 Planned | Claude Code |
| App Store submission prep | 🔲 Planned | Self |

### PHASE 5: ANALYTICS & OPTIMIZATION (Ongoing)
| Task | Status | Owner |
|------|--------|-------|
| GA4 goals/conversions | 🔲 Planned | Self |
| GTM event tracking | 🔲 Planned | Claude Code |
| Remarketing audiences | 🔲 Planned | Self |

---

## ✅ DECEMBER 5, 2025 - FIREBASE AUTH / SSO IMPLEMENTATION - COMPLETE

### Mac Mini Session: Firebase Auth with SSO and Firestore-backed Credits

**Deployed:** ✅ https://yellowcircle-app.web.app

#### 1. Firebase Auth Context ✅ COMPLETE
- `src/contexts/AuthContext.jsx` - Core authentication with Google/GitHub OAuth
- Email/password login and signup
- Password reset flow
- User profile sync to Firestore on login

#### 2. Credits System ✅ COMPLETE
- `src/hooks/useCredits.js` - Tiered credit management
- Firestore-backed for authenticated users
- localStorage fallback for anonymous users
- Premium tier support (unlimited credits)

#### 3. Auth UI Components ✅ COMPLETE
- `src/components/auth/AuthModal.jsx` - Login/signup modal with SSO buttons
- `src/components/auth/UserMenu.jsx` - User avatar, credits display, dropdown menu

#### 4. App Integration ✅ COMPLETE
- `src/RouterApp.jsx` - Wrapped app in AuthProvider
- `src/pages/experiments/OutreachBusinessPage.jsx` - Added UserMenu to Hub header

**Files Created:**
- `src/contexts/AuthContext.jsx` - Firebase Auth context (243 lines)
- `src/hooks/useCredits.js` - Credits management hook (175 lines)
- `src/components/auth/AuthModal.jsx` - Login modal (320 lines)
- `src/components/auth/UserMenu.jsx` - User menu component (200 lines)

**Files Modified:**
- `src/RouterApp.jsx` - AuthProvider wrapper
- `src/pages/experiments/OutreachBusinessPage.jsx` - UserMenu import + header

**Features:**
- Google OAuth (select_account prompt)
- GitHub OAuth
- Email/password authentication
- Password reset via Firebase
- User profiles stored in Firestore (`users` collection)
- Credit system: 3 free for all, synced to Firestore for authenticated
- Premium tier: unlimited credits

---

## ✅ DECEMBER 3, 2025 - TALK BUBBLE + MOBILE LAYOUT REFINEMENT - COMPLETE

### Mac Mini Session: HomePage Talk Bubble Design + Button Layout Fix

**Deployed:** ✅ https://yellowcircle-app.web.app

#### 1. Talk Bubble Description ✅ ACCEPTED
- ✅ Description in upper-right as speech bubble
- ✅ Right-justified text with blur effect
- ✅ Full copy with two sentences
- ✅ Sharp corner design (`borderRadius: '12px 12px 12px 0'`)

#### 2. Buttons - Single Row ✅ COMPLETE
- ✅ `flexWrap: 'nowrap'` prevents wrapping
- ✅ Separated into own fixed container

#### 3. H1/Subtitle Position ✅ COMPLETE
- ✅ Consistent across all scroll states

#### 4. Sidebar Breadcrumb ✅ ACCEPTED
- ✅ Flexbox wrapper centered

#### 5. HamburgerMenu ✅ COMPLETE
- ✅ Mobile positioning correct

**Files Modified:**
- `src/pages/HomePage.jsx` - Talk bubble + buttons
- `src/components/global/Sidebar.jsx` - Breadcrumb
- `src/components/global/HamburgerMenu.jsx` - Mobile positioning

---

## 🟢 DECEMBER 2, 2025 - LEGAL PAGES, BLOG TOGGLE, BREADCRUMB FIXES

### Mac Mini Session: UI Polish & Legal Compliance

**Commit:** `2c6f018` - "Feature: Dec 2 session - Legal pages, blog toggle, breadcrumb fixes"

#### 1. Legal Pages Created
- ✅ Privacy Policy page (`/privacy`) - GDPR/CCPA compliant
- ✅ Terms of Service page (`/terms`) - Standard consulting terms
- ✅ Footer links added (PRIVACY, TERMS)
- ✅ Lazy loading for both pages

#### 2. Blog Scroll Toggle (ThoughtsPage)
- ✅ LIST/CAROUSEL toggle buttons
- ✅ Vertical scroll mode (default)
- ✅ Horizontal scroll with snap behavior
- ✅ Theme-aware styling (black/yellow buttons)

#### 3. Reading Progress Bar
- ✅ Shared component: `src/components/shared/ReadingProgressBar.jsx`
- ✅ `useReadingProgress` custom hook
- ✅ Supports both `progress` prop and `contentRef` prop
- ✅ Fixed gradient (yellow → transparent)

#### 4. Breadcrumbs Spacing Fix (Sidebar)
- ✅ Positioned pageLabel at `top: 280px`
- ✅ Added `maxWidth: 180px` with ellipsis truncation
- ✅ Reduced font size to 11px
- ✅ Rotated -90deg for vertical alignment

#### 5. Domain Migration Status
- ⚠️ DNS configured correctly (Cloudflare → Firebase)
- ⚠️ TXT record shows `hosting-site=yellowcircle-app`
- ❌ Firebase verification failing (backend cache issue)
- 📋 **ACTION NEEDED:** Submit Firebase Support ticket

**Files Created:**
- `src/pages/PrivacyPolicyPage.jsx` - Privacy policy
- `src/pages/TermsPage.jsx` - Terms of service
- `src/components/shared/ReadingProgressBar.jsx` - Shared progress bar

**Files Modified:**
- `src/RouterApp.jsx` - Legal page routes
- `src/config/globalContent.js` - Footer links
- `src/pages/ThoughtsPage.jsx` - Scroll toggle
- `src/components/global/Sidebar.jsx` - Breadcrumb positioning
- `src/pages/OwnYourStoryArticle1Page.jsx` - Use shared progress bar

---

## 🟢 NOVEMBER 30, 2025 - SERVICES PAGE + SEO (Evening Session)

### Mac Mini Session: Services Page, Navigation, SEO

**Commit:** `087049c` - "Feature: Services page, navigation updates, SEO improvements"

#### 1. Services Page Created (`/services`)
- ✅ 7 service offerings with pricing and CTAs
- ✅ GTM Strategic Audit ($4K-5K) - Featured card
- ✅ Marketing Systems Audit ($2.5K-4K)
- ✅ Role Alignment Assessment ($1.5K-2.5K)
- ✅ Technical Debt Quantification ($2.5K-3.5K)
- ✅ Attribution System Audit ($2K-3K)
- ✅ Data Architecture Assessment ($3K-4K)
- ✅ Email Template Development ($500+)
- ✅ Grid layout with expandable cards
- ✅ "Schedule a Call" CTA at bottom

#### 2. Navigation Updates
- ✅ Services in HamburgerMenu with subitems
- ✅ Services in Sidebar navigation
- ✅ Footer: "PROJECTS" → "SERVICES"
- ✅ Footer: Added phone (914.241.5524)
- ✅ LinkedIn: Updated to company page URL
- ✅ Instagram: Updated link

#### 3. SEO Improvements
- ✅ Meta tags in index.html (title, description, keywords, author)
- ✅ Open Graph meta tags for social sharing
- ✅ Twitter Card meta tags
- ✅ robots.txt with sitemap reference
- ✅ sitemap.xml with all public pages
- ✅ SVG favicon (yellow circle design)
- ✅ GA4 placeholder ready for configuration

**Files Created:**
- `src/pages/ServicesPage.jsx` (340+ lines)
- `public/favicon.svg`
- `public/robots.txt`
- `public/sitemap.xml`

---

## 🎯 DISTRIBUTION READINESS CHECKLIST (Updated Nov 30 - Evening)

### 🟢 READY FOR LAUNCH - ALL CRITICAL BLOCKERS RESOLVED

| # | Item | Status | Details |
|---|------|--------|---------|
| 1 | ~~Contact Form Backend~~ | ✅ DONE | Web3Forms API integrated (key: 960839cb) |
| 2 | ~~Company Detail Pages~~ | ✅ DONE | 11 pages with studio work framing + dormant case study CTA |
| 3 | ~~Services Page~~ | ✅ DONE | 7 services with standalone detail pages |
| 4 | ~~Meta Tags / SEO~~ | ✅ DONE | OG tags, robots.txt, sitemap.xml (32 URLs) |
| 5 | ~~Favicon~~ | ✅ DONE | SVG favicon + OG image + Apple Touch Icon |
| 6 | ~~Navigation Sync~~ | ✅ DONE | Sidebar ↔ Menu Overlay synced (Services, Stories, Labs) |
| 7 | ~~Calendar Integration~~ | ✅ DONE | Calendly config ready (just add URL to enable) |
| 8 | ~~Code Splitting~~ | ✅ DONE | Bundle reduced from 2.28MB to 845KB |
| 9 | ~~Console.log Cleanup~~ | ✅ DONE | Debug statements removed |
| 10 | ~~GTM Assessment Tool~~ | ✅ DONE | 8-question quiz with scoring + email capture |

### 🟡 NICE TO HAVE (Post-Launch)

| # | Item | Status | Details |
|---|------|--------|---------|
| 1 | Google Analytics GA4 | ❌ MISSING | Placeholder ready, need measurement ID |
| 2 | Homepage H1 Typography | ⚠️ OPTIONAL | Blur effect styling enhancement |
| 3 | Full Case Studies | ⏳ TBD | Dormant CTA placeholders on company pages |
| 4 | PNG versions of OG assets | ⏳ OPTIONAL | Currently SVG (works but PNG preferred) |

### 🟢 COMPLETE FEATURE LIST

**Core Pages:**
- ✅ Homepage with horizontal scrolling
- ✅ Services page (7 offerings) + 7 detail pages
- ✅ Works page (11 companies) + 11 detail pages
- ✅ About page with studio positioning
- ✅ Article 1 "Why Your GTM Sucks"
- ✅ GTM Health Assessment tool

**Navigation:**
- ✅ Sidebar with Lottie icons + accordion expansion
- ✅ HamburgerMenu with Services/Stories/Labs sections
- ✅ NavigationCircle with context menu
- ✅ Footer with contact info + social links

**Technical:**
- ✅ Contact form (Web3Forms backend)
- ✅ Email capture (Assessment tool)
- ✅ Code splitting (React.lazy)
- ✅ SEO (meta tags, sitemap, robots.txt)
- ✅ Firebase hosting configured

### 🚀 LAUNCH READY STATUS: YES

**Site is ready for:**
- ✅ Marketing/advertising campaigns
- ✅ Social media distribution
- ✅ Client outreach
- ✅ LinkedIn sharing

**To fully enable:**
1. Add GA4 measurement ID to `index.html`
2. Add Calendly URL to `src/config/calendarConfig.js`
3. Deploy to Firebase: `firebase deploy --only hosting`

---

## 🟢 NOVEMBER 30, 2025 - MOBILE OPTIMIZATIONS & WORKS PAGE

### Mobile Optimizations Session (4:00 PM - Deployed to Production)

**Commit:** `2c6f018` - "Feature: Mobile optimizations, Lottie icons, Works page with company pages"

#### 1. Lottie Icon System Complete
- ✅ Added 3 Lottie animations: `arrow.json`, `placeholder.json`, `add.json`
- ✅ Color theming: white + yellow (replaced blue/cyan/black)
- ✅ Hover-only animation behavior (no continuous loops)
- ✅ NavigationCircle: arrow↔placeholder crossfade based on scroll

#### 2. NavigationCircle Menu Updates
- ✅ "NEXT →" renamed to "FORWARD >"
- ✅ HOME and WORKS buttons in top row
- ✅ Hover-only Lottie animation for both icons

#### 3. UnityCircleNav Lottie Integration
- ✅ Replaced SVG PlusIconCircle with Lottie AddIconCircle
- ✅ Uses `add.json` animation
- ✅ Hover-only animation behavior

#### 4. Works Page Redesign
- ✅ HomePage-style horizontal scrolling (wheel, keyboard, touch)
- ✅ 11 companies defined with scroll mapping
- ✅ Vertical touch scrolling for mobile devices
- ✅ Company cards with category and year

#### 5. CompanyDetailPage Created
- ✅ Dynamic routing: `/works/:companyId`
- ✅ 11 company pages (LiveIntent, TuneCore, Thimble, YieldStreet, ZeroGrocery, DoorDash, Virtana, Reddit, Estee-Lauder, AuditBoard, Rho)
- ✅ Role, description, highlights for each company

#### 6. HamburgerMenu Updates
- ✅ Added "Projects" under STORIES submenu → `/works`
- ✅ WORKS button click handler → `/works`

#### 7. Unity Notes Plus Archived
- ✅ Moved `UnityNotePlusPage.jsx` to `src/archive/pages/`
- ✅ Removed route from RouterApp.jsx

**Files Created/Modified:**
- `src/assets/lottie/arrow.json` - Arrow animation (white/yellow)
- `src/assets/lottie/placeholder.json` - Placeholder animation (white only)
- `src/assets/lottie/add.json` - Plus/add animation (white/yellow)
- `src/pages/works/CompanyDetailPage.jsx` - New (11 company pages)
- `src/pages/WorksPage.jsx` - Complete rewrite
- `src/components/global/NavigationCircle.jsx` - Lottie + menu updates
- `src/components/unity/UnityCircleNav.jsx` - Lottie integration
- `src/components/global/HamburgerMenu.jsx` - Projects link + WORKS handler
- `src/RouterApp.jsx` - New route, archived route removed
- `src/archive/pages/UnityNotePlusPage.jsx` - Archived

**Deployment:** ✅ Firebase production (https://yellowcircle-app.web.app)

---

## 🟢 NOVEMBER 29, 2025 - UNITY NOTES QUICK EDITS

### Unity Notes UI Refinements (4:50 PM Session)
- ✅ Fixed gear button to perfect circle (32px) with Lottie animation
- ✅ Added pagination in Add Note dialog for card types
- ✅ "MORE OPTIONS →" button navigates to card types page
- ✅ Swipe gesture + pagination dots for mobile
- ✅ Edit/Delete buttons on TextNoteNode when selected
- ✅ Direct node deletion with confirmation dialog

**Commit:** `52fffef` - "Feature: Unity Notes quick edits - Gear button, pagination, deletion"

### Unity Notes CircleNav Redesign (Earlier Session)
- ✅ Created new `UnityCircleNav.jsx` component with "+" icon and gear
- ✅ Click opens Add Note dialog, right-click/long-press opens options menu
- ✅ Mobile-friendly long-press (500ms) support
- ✅ Options menu: ADD NOTE, EXPORT, IMPORT, SHARE, CLEAR, FOOTER

### Layout Updates
- ✅ Added `hideCircleNav` prop for pages with custom navigation
- ✅ Renamed all "Memory" references to "Note" in modals

### Homepage Background Images
- ✅ Updated all 3 background images with new Gemini-generated art
- Image 1: `Gemini_Generated_Image_jpswjujpswjujpsw_hi7ltv`
- Image 2: `Gemini_Generated_Image_7mrn897mrn897mrn_hzgvsb`
- Image 3: `Gemini_Generated_Image_i20pegi20pegi20p_pa7t5w`

### Global Navigation Centralization
- ✅ Created `src/config/navigationItems.js` with canonical nav config
- ✅ All 15+ pages now use centralized navigation with Lottie animations

---

## 🟢 NOVEMBER 28, 2025 - UNITY NOTES UI REFINEMENT

### Unity Notes + Unity Notes Plus - UI Consistency Update

**Routes:**
- `/unity-notes` - Original 2nd Brain canvas
- `/unity-notes-plus` - Multi-card enhanced version

**Session Work Completed (5:45 PM):**

**1. HamburgerMenu Slide-Over Styling:**
- ✅ Updated slide-over to match yellow theme (from dark background)
- ✅ Typography aligned: `clamp(2rem, 5vh, 3.5rem)`, fontWeight 900, letterSpacing 0.3em
- ✅ X close button replaced with proper hamburger-style bars
- ✅ Z-index layering fixed (270 for slide-over panel)

**2. Circle Nav Positioning:**
- ✅ Reverted to center bottom viewport (consistent across both pages)
- ✅ Right-click context menu centered to match

**3. PhotoUploadModal Card Types:**
- ✅ Extended with optional `cardTypes` and `onAddCard` props
- ✅ Photo upload methods remain PRIMARY
- ✅ Card types (Photo, Note, Link, AI, Video) appear as SECONDARY
- ✅ Only displayed in Unity Notes Plus version

**4. Menu Navigation:**
- ✅ Added Unity Notes+ to LABS submenu
- ✅ Fixed route from `/unity-note-plus` to `/unity-notes-plus`
- ✅ Consistent naming: "unity-notes" throughout

**5. Delete Functionality:**
- ✅ Verified working via Select → EDIT → DELETE flow

**Files Modified:**
- `src/components/global/HamburgerMenu.jsx` - Yellow slide-over styling
- `src/pages/UnityNotesPage.jsx` - Circle Nav centered
- `src/pages/UnityNotePlusPage.jsx` - Circle Nav centered, card types in dialog
- `src/components/travel/PhotoUploadModal.jsx` - cardTypes/onAddCard props
- `src/RouterApp.jsx` - Route `/unity-notes-plus`
- `package.json` - Added lottie-react dependency (CI fix)

**CI Fix (7:00 PM):**
- GitHub Actions build was failing: `lottie-react` not in committed package.json
- Commit `3a6136f`: Added lottie-react dependency
- CI now passing

---

### Unity Notes Plus - Multi-Card Canvas Workspace (Previous Session)

**Status:** ✅ Foundation Complete + UI Refined

**ThreadDeck-Inspired Features Implemented:**
- ✅ Multiple card types architecture (Photo, Text Note, Link, AI, Video placeholders)
- ✅ Dark/Light theme toggle
- ✅ Quick add floating panel with card type selector
- ✅ TextNoteNode component with inline editing
- ✅ Theme-aware UI throughout

**Files Created:**
- `src/pages/UnityNotePlusPage.jsx` (680 lines)
- `src/components/unity-plus/TextNoteNode.jsx` (180 lines)
- `dev-context/UNITY_NOTE_PLUS_ANALYSIS.md` (comprehensive analysis)

**Next Phase (Unity Notes Plus v2.1):**
- [ ] LinkNode component with URL metadata fetching
- [ ] VideoNode component with YouTube embed
- [ ] AIChatNode component with Groq/OpenAI integration
- [ ] Enhanced canvas collaboration features

---

## 🔴 NOVEMBER 26, 2025 - POST-RHO STRATEGIC PIVOT

### Situation Change: Rho Employment Ended

**Date:** November 25, 2025 (last day)
**Severance:** $10,000 offered
**New Focus:** Parallel path - immediate revenue + yellowCircle vision

### 60-Day Revenue Plan (NEW PRIORITY)

**Week 1-2: Foundation**
- [ ] Package "GTM Strategic Audit" service ($4K-5K per engagement)
- [ ] LinkedIn transition announcement + availability
- [ ] Network activation (10 warmest contacts)
- [ ] Share Article 1 across channels

**Week 3-4: First Revenue ($4K-8K target)**
- [ ] Schedule 3-5 discovery calls
- [ ] Close 1-2 GTM Assessment engagements
- [ ] Document process for repeatability

**Week 5-8: Scale ($8K-12K additional)**
- [ ] 2-3 additional clients
- [ ] Explore retainer opportunities
- [ ] Article 2 draft continuation

**Realistic 60-Day Target:** $15K-20K + $10K severance = $25K-30K total

### Revenue-Ready Assets (Immediate)

| Asset | Status | Potential | Action |
|-------|--------|-----------|--------|
| Article 1 "Why Your GTM Sucks" | LIVE | Lead gen | Promote now |
| GTM Assessment Framework | Ready | $4K-5K/client | Package this week |
| Rho Case Studies (anonymized) | Documented | Credibility | Use in sales |
| N8N Templates | Needs work | $500-1K/mo | Month 3+ |

### Mac Mini Audit Task: ✅ COMPLETE (Nov 26, 2025)

**All deliverables created:**
1. ✅ **Rho Career Trajectory Audit** - Complete
2. ✅ **Career Trajectory Analysis** - Complete
3. ✅ **60-Day Plan Execution Support** - Complete

**Full Documentation:** `dev-context/STRATEGIC_PIVOT_POST_RHO.md`

---

## 🔴 P0 AUDIT DELIVERABLES [Due: Dec 1, 2025]

**Created:** November 26, 2025
**Status:** ✅ Complete
**Priority:** P0

### 1. Consulting Portfolio Audit [P0] ✅
**Created:** Nov 26, 2025 | **Due:** Dec 1, 2025 | **Status:** Complete

Complete expertise extraction from Rho experience:
- [x] 5 anonymized case studies ready
- [x] $2.5M technical debt quantification
- [x] Signature frameworks documented
- [x] Benchmark data compiled
- [x] Quotable insights for LinkedIn

**File:** `dev-context/CONSULTING_PORTFOLIO_AUDIT.md`

### 2. GTM Assessment Service Page [P0] ✅
**Created:** Nov 26, 2025 | **Due:** Dec 1, 2025 | **Status:** Complete

Ready-to-use service copy for GTM Strategic Audit ($4K-5K):
- [x] Headlines and descriptions (long/short form)
- [x] Value propositions by audience
- [x] Objection handling scripts
- [x] Proof points and credibility
- [x] FAQs

**File:** `dev-context/GTM_ASSESSMENT_SERVICE_PAGE.md`

### 3. LinkedIn Content Calendar [P0] ✅
**Created:** Nov 26, 2025 | **Due:** Dec 1, 2025 | **Status:** Complete

8-week LinkedIn posting plan (2-3 posts/week):
- [x] Week 1: Transition announcement + Article share
- [x] Week 2: Credibility building posts
- [x] Week 3: Problem awareness posts
- [x] Week 4: Solution positioning + service launch
- [x] Week 5-8: Ongoing content themes
- [x] Hashtag strategy and engagement metrics

**File:** `dev-context/LINKEDIN_CONTENT_CALENDAR.md`

### 4. Outreach Templates [P0] ✅
**Created:** Nov 26, 2025 | **Due:** Dec 1, 2025 | **Status:** Complete

Complete outreach template library:
- [x] Warm outreach (2 templates)
- [x] Cold outreach (3 templates)
- [x] LinkedIn connection requests (3 templates)
- [x] Follow-up sequences
- [x] Proposal follow-ups
- [x] Response handling scripts

**File:** `dev-context/OUTREACH_TEMPLATES.md`

---

## 🟡 P2 CONTENT ITEMS

### Article 2 Draft - "Why Your MAP Is a Mess" [P2]
**Created:** Nov 18, 2025 | **Due:** Jan 15, 2026 | **Status:** Not Started

Continuation of "Own Your Story" series:
- [ ] Research common MAP failures
- [ ] Draft content with case study examples
- [ ] Create supporting visuals
- [ ] Review and refine

**Dependent on:** Article 1 performance metrics and feedback

---

## ⚠️ NOVEMBER 18, 2025 - STEALTH MODE STRATEGY (SUPERSEDED BY RHO EXIT)

> **Note:** This section was written while still employed at Rho. Employment ended Nov 25, 2025. Strategic pivot now focuses on immediate revenue generation rather than stealth mode building. See "POST-RHO STRATEGIC PIVOT" section above for current strategy.

### Major Strategic Documents Completed (Historical Reference)

**Three comprehensive strategic documents created** totaling ~135 KB of analysis:

1. **COMPREHENSIVE_PROJECT_PORTFOLIO_ANALYSIS.md** (40 KB)
   - Complete analysis of ALL projects across Trimurti framework
   - Multi-Machine Framework documentation audit
   - Consolidated timeline with 866-1,139 hour estimates
   - Critical decision: Unity Notes foundation OR Rho integration first

2. **RHO_TOTAL_ASSESSMENT_AND_MVP_SOLUTION.md** (60 KB)
   - Complete assessment of Rho's $2.5M+/year technical/organizational challenges
   - Unity MAP MVP architecture (AI + N8N + Airtable + Rho Components)
   - Productization path via Trimurti framework
   - 4-month implementation roadmap with $760-6,400 budget

3. **STEALTH_MODE_STRATEGY_CRITICAL.md** (35-40 KB) ⚠️ SENSITIVE
   - **FUNDAMENTAL PIVOT:** Build Unity MAP THROUGH Rho in stealth mode (not FOR Rho)
   - Legal/ethical analysis: IP ownership, clean room implementation, resource use
   - 3-phase approach with time allocation and revenue projections
   - Options stacking strategy: $334K-742K/year potential across multiple streams
   - 5 Skydog outcome scenarios with probabilities and strategies
   - **Core recommendation:** Build OPTIONS, not all-in bets

**Location:** `/CC Projects/Rho Assessments 2026/`

### Strategic Shift Impact on Roadmap

**Previous Approach:** Build Unity MAP for Rho, pitch to leadership
**New Approach:** Build Unity MAP components in stealth mode with clean hands
**Time Allocation:** 15-20 hrs/week personal work (sustainable) vs 4-month full-time (unrealistic)
**Revenue Model:** Modular building → $8,480/mo MRR after 12 months WITHOUT leaving Rho

**This changes ALL downstream priorities and timelines.**

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

## 🎯 Project Priority Order (UPDATED Nov 30 - Post-Rho)

### **CURRENT FOCUS: Immediate Revenue Generation**

**Situation:** Rho employment ended Nov 25, 2025. Severance: $10K.
**Primary Goal:** Generate $15K-20K in 60 days through consulting + freelance work.
**Secondary Goal:** Continue building yellowCircle platform and Unity Notes.

**Time Allocation (Full-time available):**
- 60% Revenue generation (consulting, outreach, client work)
- 30% yellowCircle development (Unity Notes, platform features)
- 10% Content/brand building (Article series, LinkedIn)

---

### **Priority 1: Revenue Generation (Week 1-2 of 60-Day Plan)**

**Status:** Day 5 of 60-day plan
**Target:** $4K-8K first revenue by Day 30

#### **Immediate Actions (This Week)**
- [ ] **LinkedIn transition announcement** - Post availability
- [ ] **Network activation** - Contact 10 warmest leads
- [ ] **Share Article 1** - "Why Your GTM Sucks" across channels
- [ ] **Schedule discovery calls** - Target 3-5 this week

#### **GTM Assessment Service ($4K-5K/engagement)**
- [x] Service page copy ready (`dev-context/GTM_ASSESSMENT_SERVICE_PAGE.md`)
- [x] Case studies ready (`dev-context/CONSULTING_PORTFOLIO_AUDIT.md`)
- [x] Outreach templates ready (`dev-context/OUTREACH_TEMPLATES.md`)
- [ ] First client signed

#### **yellowCircle Development (Ongoing)**
- [x] Unity Notes v1 complete with UI refinements
- [x] Unity Notes Plus with card types (archived)
- [x] Global navigation centralized
- [x] Lottie icon system (arrow, placeholder, add)
- [x] Works page with company detail pages (11 companies)
- [ ] Homepage background images (Gemini art integrated)

---

### **Priority 2: yellowCircle Platform Development**

**Status:** Active development alongside revenue work
**Recent Wins:** Unity Notes complete, global navigation, Lottie animations

#### **Unity Notes Ecosystem**
- [x] Unity Notes v1 - Photo canvas with ReactFlow
- [x] Unity Notes Plus - Multi-card types (Photo, Text, Link, AI, Video)
- [x] UnityCircleNav component with gear/options menu
- [x] Add Note dialog with pagination
- [ ] Export/Import functionality
- [ ] Cloud sync (Firebase backend)

#### **Global Components**
- [x] Centralized navigation config (`src/config/navigationItems.js`)
- [x] Lottie animations in sidebar
- [x] HamburgerMenu with yellow slide-over
- [ ] Footer social links completion

#### **Content & Pages**
- [x] Article 1 "Why Your GTM Sucks" - LIVE
- [ ] Article 2 "Why Your MAP Is a Mess" - Not Started
- [ ] Works page company detail pages
- [ ] Homepage design refresh

---

### **Priority 3: Future Revenue Streams (Month 2+)**

**Contingent on initial consulting revenue established**

#### **Unity MAP Templates (Gumroad)**
- [ ] N8N workflow templates (5-10 templates)
- [ ] Email component library
- [ ] Schema mapping guides
- [ ] Target: $500-1K/month

#### **Unity MAP SaaS (Q2 2026)**
- [ ] Landing page with waitlist
- [ ] MVP development
- [ ] Beta program
- [ ] Target: $1,500-5,000/mo per customer

---

### **Cross-Cutting: Golden Unknown & Cath3dral** [Deferred - Revenue First]

**Golden Unknown Brand:** (Revisit Month 3+)
- [ ] Logo refinement
- [ ] Social media assets
- [ ] Asset/clothing creation

**Cath3dral:** (Revisit Q2 2026)
- [ ] Being and Rhyme
- [ ] B-Corp incorporation(s)
- [ ] Closed loop system

---

## 🔑 Key Cross-Cutting Projects

### **A. 2nd Brain App Development** [P3]
**Created:** Nov 8, 2025 | **Due:** TBD | **Status:** Not Started

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

### **B. Multi-Machine Context System** [P2]
**Created:** Nov 8, 2025 | **Due:** Dec 31, 2025 | **Status:** In Progress

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

### **C. Claude Web → Claude Code Integration** [P2]
**Created:** Nov 8, 2025 | **Due:** Dec 31, 2025 | **Status:** Not Started

**Goal:** Connect Claude web to Claude Code for additions to dev repositories

**Requirements Research Needed:**
- Integration points
- Workflow automation
- Version control sync
- Multi-machine considerations

---

## 📋 Immediate Next Steps (UPDATED Nov 30, 2025 - Post-Rho)

### 🔴 P0 PRIORITY - THIS WEEK (Revenue Focus)

#### 1. LinkedIn Outreach Campaign
**Status:** Ready to execute
**Timeline:** This week (Nov 30 - Dec 6)

- [ ] Post transition announcement (Day 1)
- [ ] Share Article 1 "Why Your GTM Sucks"
- [ ] Contact 10 warmest network connections
- [ ] Request introductions to potential clients
- [ ] Schedule 3-5 discovery calls

#### 2. GTM Assessment Service Launch
**Status:** All materials ready
**Timeline:** Ongoing

- [x] Service page copy ready
- [x] Case studies documented
- [x] Outreach templates created
- [ ] Create simple landing page on yellowCircle
- [ ] First paid engagement closed

### 🟡 P1 PRIORITY - THIS WEEK (Platform Development)

#### 3. yellowCircle Platform Polish
**Status:** Active development
**Timeline:** Ongoing alongside revenue work

- [x] Unity Notes UI refinements complete
- [x] Global navigation centralized
- [ ] Works page company detail pages
- [ ] Mobile optimizations
- [ ] Lottie animations deployment verification

#### 4. Article Series Continuation
**Status:** Article 1 complete, Article 2 not started
**Due:** Jan 15, 2026

- [x] Article 1 "Why Your GTM Sucks" - LIVE
- [ ] Article 2 "Why Your MAP Is a Mess" - Planning phase
- [ ] Content calendar for LinkedIn posts

### 🟢 P2 PRIORITY - NEXT 2 WEEKS

#### 5. Automation & Tools Setup
- [ ] N8N workflow templates (personal use first)
- [ ] Email automation for outreach
- [ ] CRM setup for tracking leads

#### 6. yellowCircle Homepage Refresh
**Due:** Jan 1, 2026
- [ ] New Gemini-generated backgrounds (in progress)
- [ ] Design refresh with new H1 styling
- [ ] Mobile experience improvements

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

## 🚀 Success Criteria (Updated for Stealth Mode Strategy)

### **Phase 1: Foundation (Months 1-3) - CURRENT PHASE**

**Personal Brand:**
- ✅ 12+ LinkedIn posts published (2-3 per week)
- ✅ Personal website refreshed with consulting services
- ✅ Case study drafted (anonymized Rho assessment)
- ✅ 5-10 potential consulting leads identified

**Skill Development:**
- ✅ N8N installed locally and 2-3 workflow templates built
- ✅ React email component experimentation complete
- ✅ Claude MCP server exploration documented

**Rho (Day Job):**
- ✅ Events upload process complete and functional
- ✅ Exceptional value delivered (maintain reputation)
- ✅ Skydog audit trajectory assessed
- ✅ Generic learnings documented for personal use

**Time Allocation:**
- ✅ Sustainable 50-55 hrs/week total (40 Rho + 10-15 personal)
- ✅ No burnout, maintaining work-life balance

---

### **Phase 2: Validation (Months 4-6)**

**Consulting:**
- ✅ 2-3 free audits completed
- ✅ Service offering refined based on feedback
- ✅ First $1K-3K in consulting fees earned

**Unity MAP Templates:**
- ✅ 5-10 N8N workflow templates packaged for sale
- ✅ Email component library created
- ✅ $500-1K/month in template sales

**Unity MAP SaaS:**
- ✅ Landing page live with waitlist
- ✅ 50+ email signups collected
- ✅ 10-15 customer discovery interviews completed

**DECISION CRITERIA:**
- Strong validation: >100 waitlist + 5+ beta commitments → Path A (Unity MAP SaaS)
- Moderate validation: <50 waitlist but 3+ consulting clients → Path B (Consulting)
- Rho promotion: $180K-220K + equity → Path C (Stay at Rho)

---

### **Phase 3: Commit or Pivot (Months 7-12)**

**Path A Success Criteria (Unity MAP SaaS):**
- ✅ First paying customer acquired
- ✅ 3-5 beta customers live ($1,500-2,500/mo each)
- ✅ Product refined based on feedback
- ✅ Public launch preparation complete
- ✅ $4,500-12,500/mo MRR

**Path B Success Criteria (Consulting):**
- ✅ 3-5 active consulting clients
- ✅ Service offerings productized
- ✅ Referral network established
- ✅ $12K-40K/mo MRR

**Path C Success Criteria (Stay at Rho):**
- ✅ Role expansion negotiated
- ✅ Consulting/templates maintained as side income
- ✅ Options stacking continues at lower intensity
- ✅ Annual re-evaluation scheduled

---

### **12-Month Revenue Targets (All Paths Combined)**

**Conservative:** $334K/year
- Rho: $130K (base salary maintained)
- Consulting: $12K-40K (1-3 clients)
- Unity MAP templates: $6K-12K ($500-1K/mo)
- Unity MAP SaaS: $0-180K (0-12 customers)

**Aggressive:** $742K/year
- Rho: $180K (promoted)
- Consulting: $240K-480K (10-20 clients or 5-10 retainers)
- Unity MAP templates: $12K-24K ($1K-2K/mo)
- Unity MAP SaaS: $180K-360K (12-24 customers)

**Key Metric:** Options stacking creates FLOOR of $148K-202K (Rho + templates + 1-2 consulting clients) while maintaining CEILING potential of $742K+

---

### **Infrastructure (Ongoing):**
- ✅ Multi-machine context system optimized and operational
- ✅ WIP_CURRENT_CRITICAL.md updated after every major session
- ✅ Strategic documents synced via Dropbox (30s) and GitHub (version control)
- ✅ Clean hands framework maintained (zero Rho IP in personal projects)

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

**Last Updated:** December 5, 2025
**Next Review:** December 10, 2025 (Week 2 of 60-Day Plan)
**Owner:** Christopher Cooper
**Version:** 2.3 (Dec 5 Firebase Auth / SSO Session)
