# Own Your Story: Building yellowCircle
## A Self-Reflected Case Study in Product Development

**For: yellowCircle Roadmap (Notion) - Living Document**
**Created:** January 15, 2026
**Last Updated:** January 15, 2026
**Status:** Draft v1.0

---

> *"The best time to plant a tree was 20 years ago. The second best time is now."*
> — Chinese Proverb

---

# Executive Summary

yellowCircle is a comprehensive portfolio platform and marketing automation suite built over approximately 280 development hours between August 2025 and January 2026. What began as a personal portfolio website evolved into a full-stack marketing platform with AI integration, email automation, and visual content creation tools.

This case study documents the journey—not to celebrate success, but to capture learnings, decisions, pivots, and the reality of building software as a solo developer while navigating career transitions.

---

# Part 1: The Origin Story

## 1.1 The Problem Statement

**August 2025**

After years of working in marketing operations and go-to-market strategy at various companies, I faced a common challenge: how do I showcase my work in a way that doesn't just list job titles but demonstrates actual impact?

The traditional portfolio approach—a WordPress site with screenshots and bullet points—felt insufficient. I wanted something that:
1. Showcased technical ability, not just strategic thinking
2. Demonstrated the intersection of marketing and technology
3. Served as a living playground for experimentation
4. Could eventually become a product itself

**The Core Insight:** The best way to demonstrate capability is to build capability.

## 1.2 Initial Technology Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React + Vite | Modern, fast, extensive ecosystem |
| Styling | Tailwind CSS | Rapid prototyping, consistent design system |
| Hosting | Firebase | Generous free tier, integrated services |
| State | React Hooks + Context | Simplicity over Redux complexity |
| Animation | Lottie + CSS | Lightweight, performant |

**Early Mistakes:**
- Started with Create React App, migrated to Vite (wasted 4 hours)
- Initially used inline styles everywhere (technical debt that took 3 sessions to refactor)
- No authentication system planned (became critical in December)

---

# Part 2: The Evolution Timeline

## Phase 0: Foundation (August - October 2025)

### What Was Built
- Basic portfolio structure
- Horizontal scrolling navigation
- Company showcase pages
- Multi-page architecture

### Key Metrics
| Metric | Value |
|--------|-------|
| Development Hours | ~40 |
| Pages Created | 8 |
| Lines of Code | ~5,000 |

### Learnings
1. **Horizontal scrolling is harder than it looks** - Cross-browser compatibility, touch gestures, and keyboard navigation all required custom solutions.
2. **Design systems matter early** - Without consistent spacing/color tokens, the codebase became a patchwork of magic numbers.

---

## Phase 1: The Multi-Machine Problem (November 2025)

### The Challenge

Working between a Mac Mini (home office) and MacBook Air (mobile), I faced constant context loss. Each session required 10-15 minutes to remember "where was I?"

### The Solution: Multi-Machine Shared Framework (MSF)

Created a documentation system that syncs via Dropbox with Git as backup:

```
.claude/
├── shared-context/
│   ├── WIP_CURRENT_CRITICAL.md  ← Current session state
│   ├── ACTIVE_SPRINT.md          ← Sprint-level tracking
│   ├── DECISIONS.md              ← Decision log
│   └── BLOCKED_TASKS_ALERTS.md   ← Blocker tracking
├── INSTANCE_LOG_MacMini.md       ← Machine-specific history
├── INSTANCE_LOG_MacBookAir.md
└── verify-sync.sh                ← Sync verification script
```

### Impact
- Context recovery time: 10-15 min → 2-3 min
- Lost work incidents: ~5/month → 0
- Cross-machine continuity: Seamless

### Key Learning
**Documentation is not overhead—it's infrastructure.**

---

## Phase 2: The Rho Employment Era (September - November 2025)

### Context

During this period, I was employed at Rho Technologies (fintech). This created an interesting dynamic:
- **Day job:** Marketing operations consulting
- **Side project:** Building yellowCircle
- **Ethical boundary:** No overlap in intellectual property

### What Happened

The employment ended on November 25, 2025. This wasn't a surprise—it was a strategic exit.

**Key decisions made:**
1. Document transferable frameworks (anonymized)
2. Avoid any stealth mode overlap
3. Use learnings to inform yellowCircle, not copy from Rho

### Assets Legitimately Developed
- GTM Assessment Framework ($4-5K service model)
- 5 anonymized case studies from prior work
- Understanding of technical debt quantification
- LinkedIn content calendar methodology

### Ethical Boundary
All Rho-specific work was deprecated on November 25, 2025. No proprietary code, strategies, or customer data was used in yellowCircle.

---

## Phase 3: The Global Components Refactor (November 2025)

### The Problem

After building 15+ pages independently, the codebase had:
- 1,700+ lines of duplicated sidebar code
- Inconsistent navigation patterns
- 5 different hover animation implementations
- No shared configuration

### The Solution

A systematic refactor over 2 weeks:

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| Sidebar | 15 copies | 1 global | -1,700 lines |
| Footer | 8 copies | 1 global | -400 lines |
| HamburgerMenu | 6 copies | 1 global | -300 lines |
| NavigationCircle | 5 copies | 1 global | -250 lines |

**Total Code Eliminated:** ~2,650 lines

### Technical Implementation

```javascript
// Before: Each page had its own sidebar
const AboutPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // ... 200 lines of sidebar logic
};

// After: Global component via Layout
const AboutPage = () => {
  // Just content, sidebar handled by Layout
};
```

### Learning
**DRY (Don't Repeat Yourself) is not just a principle—it's a survival strategy for solo developers.**

---

## Phase 4: The Unity Platform (December 2025)

### The Pivot

What started as a portfolio needed to demonstrate real product capability. The answer: build an actual product within the portfolio.

**Unity** became a suite of interconnected tools:

1. **Unity NOTES** - Visual canvas for note-taking (2nd Brain concept)
2. **Unity MAP** - Marketing automation platform
3. **Unity STUDIO** - Ad creative generation suite

### Unity NOTES: The 2nd Brain

**Problem:** Existing note tools (Notion, Roam, Obsidian) didn't match my visual thinking style.

**Solution:** A canvas-based infinite whiteboard with:
- Drag-drop nodes
- Multiple node types (Text, Photo, Todo, Map, AI)
- Local-first architecture
- Cloud sync when needed

**Technical Highlights:**
- ReactFlow for canvas rendering
- Firestore for cloud persistence
- Optimistic updates for UX
- 12+ node types

**Lines of Code:** 8,104 (UnityNotesPage.jsx alone)

### Unity MAP: Marketing Automation

**Problem:** Tools like HubSpot cost $800+/month. Small businesses need automation too.

**Solution:** A node-based journey builder:
- Visual flow editor
- Email sequences
- Wait nodes, condition nodes
- Contact scoring
- Multi-ESP support (Brevo, MailerSend, Resend, SendGrid)

### Unity STUDIO: Ad Creation

**Problem:** Creating ads for 6+ platforms requires different dimensions, safe zones, and formats.

**Solution:** Campaign Quickstart wizard:
1. Brief → 2. Platforms → 3. Generate → 4. Review

**Supported Platforms:**
- Instagram (Feed, Story, Reel)
- Facebook (Feed, Story)
- LinkedIn (Sponsored Content)
- Reddit (Feed)
- Google Display (coming)

---

## Phase 5: The Authentication Pivot (December 2025)

### The Problem

Unity tools needed user accounts. Building a full auth system from scratch is:
- Time-consuming (~40 hours)
- Security-risky
- Maintenance overhead

### The Solution

Firebase Authentication with hybrid legacy support:

```javascript
// Hybrid auth check
const verifyAuth = async (req) => {
  // Try Firebase Auth first
  const firebaseAuth = await verifyFirebaseToken(req);
  if (firebaseAuth) return firebaseAuth;

  // Fallback to legacy tokens (for n8n, scripts)
  const legacyAuth = verifyLegacyToken(req);
  if (legacyAuth) return legacyAuth;

  throw new Error('Unauthorized');
};
```

**Migration Stats:**
- Functions updated: 25+
- Breaking changes: 0 (hybrid approach)
- Time saved: ~30 hours vs custom auth

---

## Phase 6: The Sleepless Agent Experiment (December 26 - January 3, 2026)

### The Hypothesis

Can an AI agent work autonomously while I'm away for the holidays?

### The Setup

- **Tool:** Sleepless Agent (custom cron + Claude Code)
- **Scope:** UnityNotesPage optimization
- **Duration:** 8 days
- **Result:** 1,171 tasks executed

### What It Accomplished
- 250+ useMemo/useCallback optimizations
- iOS Safari touch improvements
- Performance profiling
- Documentation generation

### What Went Wrong
- Attempted merge on Jan 3 broke production
- MSF documentation was not updated (agent used its own system)
- Manual salvage required

### Key Learning
**Autonomous agents are powerful but need guardrails. The merge process was the failure point, not the work itself.**

---

## Phase 7: Q1 2026 Recovery (January 2026)

### The Crisis

Returning from holidays, production was broken:
- TDZ (Temporal Dead Zone) error in UnityNotesPage
- Cron jobs failing for 17 days
- Documentation out of sync

### The Fix

| Issue | Root Cause | Fix | Commit |
|-------|------------|-----|--------|
| Runtime error | `withCommentBadge` parameter mismatch | Renamed `_NodeComponent` → `NodeComponent` | `0e7846c` |
| Cron failures | Missing `--verbose` flag | Added flag to `claude-auto.sh` | `0e7846c` |
| React Hooks | Hooks called after early return | Moved hooks before returns | `1fc89ed` |

### Time to Recovery
- Detection: 5 minutes (user report)
- Diagnosis: 30 minutes
- Fix: 15 minutes
- Validation: 10 minutes
- **Total:** ~1 hour

---

# Part 3: By The Numbers

## Development Statistics

| Metric | Value |
|--------|-------|
| Total Development Hours | ~280 |
| Calendar Duration | 5 months |
| Lines of Code (peak) | 150,000+ |
| Lines Eliminated (refactor) | ~2,650 |
| Firebase Functions | 36+ |
| Pages | 20+ |
| Components | 100+ |

## Infrastructure

| Component | Status | Monthly Cost |
|-----------|--------|--------------|
| Firebase Hosting | Production | $0 (free tier) |
| Firebase Firestore | Production | $0 (free tier) |
| Cloud Functions | 36+ deployed | ~$5 |
| n8n (Railway) | Production | $0 (free tier) |
| Brevo (ESP) | Production | $0 (300/day) |
| Total | | **~$5/month** |

## Bundle Size Journey

| Date | Size | Change |
|------|------|--------|
| October 2025 | 2.28 MB | Baseline |
| November 2025 | 1.45 MB | Code splitting |
| December 2025 | 845 KB | Lazy loading |
| **Reduction** | | **63%** |

---

# Part 4: Decisions & Trade-offs

## Decision Log (Key Entries)

### D1: Firebase vs Supabase
**Date:** August 2025
**Decision:** Firebase
**Rationale:** Better React integration, more familiar, generous free tier
**Trade-off:** Vendor lock-in, Firestore query limitations

### D2: No TypeScript
**Date:** August 2025
**Decision:** JavaScript only
**Rationale:** Faster iteration, reduced complexity
**Trade-off:** Runtime errors, no IDE autocomplete
**Retrospective:** Would choose TypeScript if starting over

### D3: Local-first for Unity NOTES
**Date:** November 2025
**Decision:** localStorage as primary, Firestore as optional sync
**Rationale:** Offline-first UX, reduced costs
**Trade-off:** Collaboration complexity
**Result:** Correct decision for solo use case

### D4: Hybrid Authentication
**Date:** December 2025
**Decision:** Support both Firebase Auth and legacy tokens
**Rationale:** Don't break existing automations (n8n, scripts)
**Trade-off:** Complexity in auth checks
**Result:** Zero breaking changes in migration

### D5: Multi-ESP Strategy
**Date:** December 2025
**Decision:** Support 4 ESPs (Brevo, MailerSend, Resend, SendGrid)
**Rationale:** Redundancy, client flexibility, rate limit workarounds
**Trade-off:** Integration maintenance
**Result:** 100% delivery rate, flexible pricing

---

# Part 5: What Went Wrong

## The Honest Retrospective

### 1. Scope Creep
**What happened:** Started as portfolio, became full SaaS platform
**Impact:** 5-month timeline instead of 2-month
**Learning:** Set hard scope boundaries or accept the expansion

### 2. Documentation Debt
**What happened:** MSF system created late (November)
**Impact:** Lost context, duplicated work
**Learning:** Documentation infrastructure from day 1

### 3. The Sleepless Agent Merge
**What happened:** 1,171 autonomous tasks, failed production merge
**Impact:** 2 hours of recovery, lost trust in automation
**Learning:** Smaller batches, automated testing gates

### 4. No Automated Tests
**What happened:** Relied on manual testing throughout
**Impact:** Regression bugs, deployment anxiety
**Learning:** At minimum, critical path tests

### 5. Ad Platform Tokens Blocked
**What happened:** Campaign infrastructure ready, can't launch
**Impact:** 27 days blocked (and counting)
**Learning:** External dependencies on critical path = risk

---

# Part 6: What's Next

## Q1 2026 Priorities

### Immediate (Blocked - User Action)
1. Configure LinkedIn OAuth tokens
2. Complete Meta Business Verification
3. Get ANTHROPIC_API_KEY for bot relay

### Near-Term (Claude Action)
1. Theme System implementation (ThemeContext)
2. Workspace optimizations review
3. Article 2: "Why Your MAP Is a Mess"

### Future (Q2-Q3 2026)
1. Unity Collaboration features
2. 2nd Brain App standalone
3. Golden Unknown Brand launch
4. Cath3dral concept development

---

# Part 7: Reflections

## The Meta-Learning

Building yellowCircle taught me more about product development than any job could have. Key insights:

1. **Solo development is possible but lonely.** The MSF system was as much about preserving sanity as preserving context.

2. **AI assistance changes everything.** With Claude Code, I estimate 2-3x productivity gain. The sleepless agent experiment, despite its failure, proved the concept.

3. **Documentation is product.** The `.claude/` directory structure, roadmap files, and decision logs are as important as the code.

4. **Ship early, iterate fast.** Every deployment taught something. The 63% bundle size reduction came from real user feedback.

5. **Revenue-readiness requires external dependencies.** Technical completion means nothing if platform tokens are blocked.

## The Honest Assessment

**Is yellowCircle successful?**

By traditional startup metrics: No. Zero revenue, zero customers.

By learning metrics: Absolutely. I can now:
- Build full-stack React applications
- Implement marketing automation from scratch
- Deploy AI-integrated features
- Manage multi-machine development
- Write comprehensive documentation
- Navigate career transitions while building

**Was it worth 280 hours?**

The alternative was watching Netflix. Yes.

---

# Appendix A: Technical Architecture

```
yellowCircle/
├── src/
│   ├── components/
│   │   ├── global/           # Sidebar, Footer, Navigation
│   │   ├── unity/            # NOTES, MAP, STUDIO components
│   │   └── ui/               # Reusable UI elements
│   ├── contexts/             # Auth, Theme, Layout
│   ├── hooks/                # Custom hooks
│   ├── pages/                # Route components
│   ├── services/             # Firebase, API clients
│   └── utils/                # Helpers, formatters
├── functions/                # Cloud Functions (36+)
├── .claude/                  # MSF documentation
├── dev-context/              # Development documentation
└── workspace/                # Sleepless agent sandbox
```

---

# Appendix B: Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| UnityNotesPage.jsx | Main canvas | 8,104 |
| AdminHubPage.jsx | Admin dashboard | 13,000 |
| ArticleEditorPage.jsx | CMS editor | 37,000 |
| WIP_CURRENT_CRITICAL.md | Session state | Variable |
| ACTIVE_SPRINT.md | Sprint tracking | ~300 |

---

# Appendix C: Commit History Highlights

| Date | Commit | Impact |
|------|--------|--------|
| Nov 12 | Global components | -545 lines |
| Nov 30 | Mobile optimizations | Lottie system |
| Dec 17 | UnitySTUDIO | +12,030 lines |
| Dec 18 | Firebase Auth SSO | 25+ functions |
| Dec 19 | Security hardening | 4 fixes |
| Jan 7 | Q1 Recovery | Production restored |
| Jan 15 | Hooks compliance | Rules of Hooks |

---

*This is a living document. Updates will be made as the project evolves.*

**Document History:**
- v1.0 (Jan 15, 2026): Initial draft

---

**For questions or collaboration:**
- Site: https://yellowcircle.io
- Email: christopher@yellowcircle.io
