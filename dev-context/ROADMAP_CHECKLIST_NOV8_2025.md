# Project Roadmap Checklist - November 8, 2025

**Status:** Ready to proceed with yellowCircle homepage redesign
**Next Review:** November 15, 2025

---

## 🎯 IMMEDIATE PRIORITIES (This Week)

### 1. yellowCircle Homepage Redesign 🔴 **START HERE**

**Goal:** Improve UX, simplify language, update typography

#### Phase 1: Design & Planning (1-2 hours)
- [ ] Review current homepage (`src/App.jsx`) and identify sections to update
- [ ] Audit current sidebar navigation structure
- [ ] List all language/copy that needs simplification
- [ ] Document current iconography for replacement

#### Phase 2: Typography Implementation (2-3 hours)
- [ ] Implement new H1 "Your Circle" header with specs:
  ```css
  font-family: "Helvetica Neue"
  font-weight: 900
  font-size: clamp(1.17rem, 22.52vw, 20.98rem)
  color: rgba(244, 244, 204, 0.3) !important
  backdrop-filter: blur(3px)
  line-height: 0.82
  margin: 7rem 0px
  padding: 2px 6px
  ```
- [ ] Test responsive behavior across viewport sizes
- [ ] Verify blur effect renders properly on all browsers

#### Phase 3: Sidebar UX Improvements (3-4 hours)
- [ ] Redesign sidebar accordion interaction patterns
- [ ] Improve vertical positioning and transitions
- [ ] Add better visual feedback for hover states
- [ ] Ensure smooth expansion/collapse animations

#### Phase 4: Language Simplification (1-2 hours)
- [ ] Simplify "Your Circle For" sections
- [ ] Update call-to-action copy
- [ ] Review and simplify footer contact text
- [ ] Ensure consistent voice throughout

#### Phase 5: Iconography Update (2-3 hours)
- [ ] Replace current navigation icons with updated designs
- [ ] Ensure icons are responsive and accessible
- [ ] Test icon hover states and animations
- [ ] Verify SVG optimization

#### Phase 6: Testing & Refinement (2-3 hours)
- [ ] Run `npm run lint` and fix any issues
- [ ] Test across devices (desktop, tablet, mobile)
- [ ] Verify all animations are smooth (60fps)
- [ ] Check accessibility (keyboard navigation, screen readers)
- [ ] Get user feedback on changes

**Total Estimated Time:** 12-17 hours (1.5-2 working days)

---

## 🔄 ONGOING TASKS (This Month)

### 2. Perplexity Export - Ongoing Solution

**Decision:** Use browser extension for ad-hoc exports, defer Zapier automation

#### Option A: Browser Extension (Immediate - 30 minutes)
- [ ] Install "Save my Chatbot" Chrome extension
- [ ] Test export functionality with 1-2 sample conversations
- [ ] Document export workflow for future use
- [ ] Use as needed for critical new conversations (5-10/month)

**Status:** ✅ Manual export system working (12 threads exported Nov 8)

#### Option B: Zapier Automation (Future - If Needed)
- [ ] **DEFER** - Only implement if manual export becomes too time-consuming
- [ ] Research Perplexity API availability and pricing
- [ ] Create Zapier account (Free tier first)
- [ ] Set up workflow: New Perplexity thread → Auto-export to markdown
- [ ] Test automation with 3-5 conversations
- [ ] Monitor monthly costs (~$30/month estimate)

**Decision Point:** Revisit in 4 weeks (Dec 6, 2025) if manual export volume exceeds 15 threads/month

---

## 📋 PROJECT PHASE 1: yellowCircle / Rho (EOY 2025)

### 3. Rho - Events Upload Process

**Status:** Pending (start after homepage redesign)

#### Planning (1-2 hours)
- [ ] Review current Rho infrastructure
- [ ] Define event data structure (date, title, description, media, etc.)
- [ ] Determine upload method (manual form vs. CSV import vs. API)
- [ ] Plan storage solution (Firebase, Cloudinary, etc.)

#### Implementation (5-8 hours)
- [ ] Create event upload form UI
- [ ] Implement file upload for event images/media
- [ ] Add validation for required fields
- [ ] Connect to backend/database
- [ ] Build preview functionality before publish

#### Testing (2-3 hours)
- [ ] Test with sample events
- [ ] Verify media uploads work correctly
- [ ] Check mobile responsiveness
- [ ] Ensure data persists correctly

**Total Estimated Time:** 8-13 hours (1-1.5 days)

---

### 4. Global Components Standardization

**Goal:** Use updated homepage as template for all pages

**Status:** Starts after homepage redesign complete

#### Audit Phase (2-3 hours)
- [ ] List all pages currently in yellowCircle site
- [ ] Document which components are used on each page
- [ ] Identify inconsistencies in component usage
- [ ] Map homepage components to other pages

#### Implementation Phase (8-12 hours)
- [ ] Extract reusable components from homepage redesign
- [ ] Create component library/documentation
- [ ] Update existing pages to use standardized components
- [ ] Ensure consistent styling across all pages
- [ ] Test navigation flow between pages

#### CMS Integration Research (3-5 hours)
- [ ] Research Storyblok integration options
- [ ] Evaluate alternative CMS solutions
- [ ] Assess ClaudeCode integration possibilities
- [ ] Document pros/cons of each approach
- [ ] Make CMS recommendation

**Total Estimated Time:** 13-20 hours (1.5-2.5 days)

---

### 5. UK Memories Integration

**Goal:** Align with 2nd Brain / Visual Note App development

**Status:** Pending 2nd Brain app scoping (see below)

#### Dependencies:
- Wait for 2nd Brain app feature definition
- Ensure design system from homepage is finalized

#### Planning (2-3 hours)
- [ ] Review UK Memories content/assets
- [ ] Determine integration points with yellowCircle
- [ ] Plan data structure for memories
- [ ] Sketch UI for memories display

#### Implementation (TBD)
- Estimate after 2nd Brain scoping complete

---

## 🧠 CROSS-CUTTING PROJECT: 2nd Brain App

### 6. 2nd Brain / Visual Note App Scoping

**Goal:** Define features, compare to HubSpot/Squarespace, create MVP roadmap

**Status:** Research phase (start mid-November)

#### Context Gathering (3-4 hours)
- [ ] Review all existing 2nd Brain context documents
- [ ] Read Visual Note app requirements/notes
- [ ] Gather screenshots and design inspiration
- [ ] Research Grid.io case study (what went wrong/right?)

#### Competitive Analysis (4-6 hours)
- [ ] Document HubSpot CRM features
- [ ] Document Squarespace website builder features
- [ ] Identify gaps/weaknesses in existing solutions
- [ ] Determine unique value propositions for 2nd Brain

#### Feature Definition (5-8 hours)
- [ ] Create feature comparison matrix: 2nd Brain vs. HubSpot vs. Squarespace
- [ ] List MVP features (Phase 1)
- [ ] List nice-to-have features (Phase 2+)
- [ ] Define success metrics

#### Technical Planning (3-5 hours)
- [ ] Choose tech stack (React? Next.js? Firebase?)
- [ ] Plan database schema
- [ ] Sketch app architecture
- [ ] Identify technical risks/blockers

#### Documentation (2-3 hours)
- [ ] Create comprehensive 2nd Brain app spec document
- [ ] Include user flows and wireframes
- [ ] Document MVP scope and timeline estimate
- [ ] Create project roadmap

**Total Estimated Time:** 17-26 hours (2-3 days)
**Timeline:** Mid-November to Early December 2025

---

## 🎨 PROJECT PHASE 2: Golden Unknown Brand (Q1 2026)

### 7. Golden Unknown - Brand Development

**Status:** Deferred until Q1 2026

#### Preparation Checklist (When Ready):
- [ ] Logo refinement iterations
- [ ] Social media asset creation (Instagram, Twitter, etc.)
- [ ] Clothing/merchandise design concepts
- [ ] Advertisement campaign planning
- [ ] Brand guidelines document

**Start Date:** January 2026 (revisit in December 2025)

---

## 🏛️ PROJECT PHASE 3: Cath3dral Creation (Q3 2026)

### 8. Cath3dral - Long-term Vision

**Status:** Deferred until Q3 2026

#### Future Planning:
- [ ] "Being and Rhyme" concept development
- [ ] B-Corp incorporation research
- [ ] Closed-loop system architecture
- [ ] Partnership/collaboration exploration

**Start Date:** July 2026 (revisit in Q2 2026)

---

## 🔧 INFRASTRUCTURE IMPROVEMENTS

### 9. Multi-Machine Context System

**Status:** ✅ Currently working (Dropbox + GitHub)

**Optional Enhancements (Low Priority):**

#### Notion Integration Layer (3-5 hours)
- [ ] Research Notion API capabilities
- [ ] Design documentation structure in Notion
- [ ] Set up Notion workspace for project tracking
- [ ] Create templates for project updates
- [ ] Link to GitHub commits/PRs

#### Documentation Framework (2-3 hours)
- [ ] Document current Projects/Firebase/Claude Code/GitHub workflow
- [ ] Create process documentation for new features
- [ ] Add troubleshooting guides
- [ ] Update multi-machine sync instructions

**Timeline:** December 2025 - January 2026 (when time permits)

---

### 10. Claude Web → Claude Code Integration

**Status:** Research phase

**Goal:** Connect Claude web conversations to Claude Code for dev repository additions

#### Research (2-3 hours)
- [ ] Investigate Claude API integration points
- [ ] Research workflow automation options
- [ ] Explore version control sync possibilities
- [ ] Consider multi-machine sync requirements

#### Implementation (TBD)
- Depends on research findings

**Timeline:** Q1 2026

---

## 📊 SUCCESS METRICS

### yellowCircle Homepage (This Month)
- [ ] ✅ New typography implemented and tested
- [ ] ✅ Sidebar UX improved (smoother interactions)
- [ ] ✅ Language simplified (easier to understand)
- [ ] ✅ Iconography updated (modern, consistent)
- [ ] ✅ All tests pass (`npm run lint`)
- [ ] ✅ Mobile-responsive on all devices
- [ ] ✅ User feedback collected and positive

### Rho (December 2025)
- [ ] ✅ Events upload process functional
- [ ] ✅ At least 5 test events uploaded successfully
- [ ] ✅ UI/UX approved

### 2nd Brain App (End of December 2025)
- [ ] ✅ Full scope documented
- [ ] ✅ Visual Note features defined
- [ ] ✅ CRM/MA positioning clear
- [ ] ✅ MVP features mapped with timeline
- [ ] ✅ Grid.io lessons incorporated

---

## 🗓️ WEEKLY ROUTINE

### Every Monday:
1. Check `.claude/shared-context/WIP_CURRENT_CRITICAL.md` for context
2. Review this roadmap checklist
3. Identify top 3 priorities for the week
4. Update machine-specific instance log

### Every Friday:
1. Update this roadmap with completed items
2. Mark completed tasks with ✅
3. Adjust estimates based on actual time spent
4. Plan next week's priorities
5. Commit changes to GitHub

### Weekly Time Allocation:
- **yellowCircle Homepage:** 8-12 hours/week (until complete)
- **Rho Events:** 0-5 hours/week (after homepage done)
- **2nd Brain Scoping:** 5-8 hours/week (mid-November onward)
- **Infrastructure:** 1-2 hours/week (maintenance)

---

## 🚨 BLOCKERS & RISKS

### Current Blockers:
- **None** - All tasks are unblocked and ready to start

### Potential Risks:
1. **Homepage redesign scope creep** - Stick to defined specs, defer additional features
2. **2nd Brain scoping too broad** - Focus on MVP, document Phase 2+ separately
3. **Perplexity export volume increases** - Monitor; switch to Zapier if >15/month

### Mitigation:
- Review this checklist weekly
- Update `.claude/shared-context/WIP_CURRENT_CRITICAL.md` with any blockers
- Ask for help/clarification when stuck for >1 hour

---

## 📎 QUICK REFERENCE

### Key Files to Update:
- `.claude/shared-context/WIP_CURRENT_CRITICAL.md` - Current work status
- `.claude/INSTANCE_LOG_[MACHINE].md` - Session history
- `DECISIONS.md` - Decision history
- This file (`ROADMAP_CHECKLIST_NOV8_2025.md`) - Weekly progress

### Common Commands:
```bash
# Development
npm run dev              # Start dev server
npm run lint             # Run linter
npm run build            # Build for production

# Git
git status               # Check status
git add .                # Stage changes
git commit -m "message"  # Commit
git push                 # Push to GitHub

# Firebase
firebase deploy          # Deploy to production
```

### Multi-Machine Sync:
1. Update WIP_CURRENT_CRITICAL.md
2. Commit to GitHub
3. Wait 30 seconds for Dropbox sync
4. Switch machines

---

## 🎯 THIS WEEK'S FOCUS (Nov 8-15, 2025)

### Top 3 Priorities:

1. **yellowCircle Homepage - Typography** ⭐⭐⭐
   - Implement new "Your Circle" H1 styling
   - Test across viewports
   - **Target:** Complete by Nov 10

2. **yellowCircle Homepage - Sidebar UX** ⭐⭐
   - Redesign accordion interactions
   - Improve transitions
   - **Target:** Complete by Nov 12

3. **yellowCircle Homepage - Language & Icons** ⭐
   - Simplify copy
   - Update iconography
   - **Target:** Complete by Nov 15

**Goal for Week:** Complete homepage redesign Phase 1-5 (typography through iconography)

---

**Next Update:** November 15, 2025
**Created:** November 8, 2025
**Version:** 1.0
