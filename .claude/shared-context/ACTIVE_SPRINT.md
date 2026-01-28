# ACTIVE SPRINT - yellowCircle Platform

**Updated:** January 28, 2026
**Source of Truth:** [Notion Project Tracking](https://www.notion.so/18aa447307f846c6a646f58e87372a47)

> **Structure:** This file is organized in parts to control token usage.
> - **Part A:** Current priorities and active tasks (read first)
> - **Part B:** Infrastructure and daemon status
> - **Part C:** Scope status references (links only, read scope docs as needed)
> - **Part D:** Recent commits and git status
> - **Part E:** Workstream tiers — Sleepless vs. Claude Code vs. Human ownership

---

## PART A: CURRENT PRIORITIES

### P0 - Immediate
| Task | Status | Notes |
|------|--------|-------|
| Daemon DNS + Health Hardening | ✅ Complete | Launcher, watchdog, supervisor loop (Jan 27) |
| Improvement Runner Pipeline | ✅ Complete | 9 bugs fixed, 4-gate validation, IMP-002 pilot passed (Jan 28) |
| CI Workflow Fixes | ✅ Complete | Firebase PR deploys + sign-shortcut YAML syntax (Jan 28) |
| Firebase Deploy | ⏳ Blocked | Needs `firebase login --reauth` |

### P1 - Active
| Task | Status | Notes |
|------|--------|-------|
| Global Theming Phase 1 | ✅ Complete | Header/Footer/6 nodes migrated to COLORS constants |
| UnityNOTES Template System | ✅ Complete | 6 templates + TemplateSelector modal |
| UnityNOTES Branded Modals | ✅ Complete | Canvas management in Settings |
| Settings Navigation | ✅ Complete | Added to global nav |
| Mobile Spacing (Round 1) | ✅ Complete | 17 pages fixed (Jan 23) |
| Mobile Spacing (Round 2) | ✅ Complete | 6 more pages (Jan 24) |
| Link Saver Sticky Buttons | 📋 Pending | Top row not sticky on scroll |
| Remaining Mobile Spacing | 📋 Pending | 6 pages: Hub, Journeys, Golden Unknown, Cath3dral, Thoughts, GTM |
| Configure Ad Platform Tokens | ⚠️ User Action | Awaiting credentials |

### P2 - Planned (Claude Code + Human)
| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Competitive Analysis Phase 1 | 📋 Next | Claude Code | Playwright visits: Milanote, ThreadDeck, Miro → scoring matrix |
| Global Theme System (Full) | 📋 Planned | Claude Code | See SCOPE_GLOBAL_THEMING.md |
| UnityNOTES UI/UX (Rounds 3-4) | 📋 Planned | Claude Code | New components, architecture, Firebase schema |
| UnitySTUDIO Ad Collateral | 📋 Needs Scoping | Claude Code + Human | Template quality, brand rendering, export pipeline |
| Apple Shortcuts + Slack | 📋 Planned | Claude Code | See SCOPE_APPLE_SHORTCUTS_SLACK.md |
| Link Sharing Phase 4 (Slack App) | ⚠️ Partial | Claude Code | Webhook working, slash commands pending |
| Sign-Shortcut iCloud Auth | 📋 Planned | Human | CI runner needs iCloud or self-hosted macOS runner |

### P2 - Agent Improvements (Sleepless Autonomous)
| ID | Title | Round | Status | Branch |
|----|-------|-------|--------|--------|
| IMP-001 | Enhanced Node Hover States | 1 | ready | -- |
| IMP-002 | 16-Color Sticky Palette | 1 | **review** | [PR #2](https://github.com/yellowcircle-io/yc-react/pull/2) |
| IMP-003 | Shadow/Elevation System | 1 | ready | -- |
| IMP-004 | Selection State Refinement | 1 | ready | -- |
| IMP-005 | Node Type Header Icons | 1 | ready | -- |
| IMP-006 | Content Preview Truncation | 1 | ready | -- |
| IMP-007 | Color Picker Grid Improvements | 1 | ready | -- |
| IMP-008 | Transition Timing Standardization | 1 | ready | -- |

**Round 1 Progress:** 0/8 merged, 1/8 in review (Visual Polish)
**Circuit Breaker:** Closed (0/3 failures)
**Pilot Status:** IMP-002 passed all 4 gates, PR pending human review
**Trigger:** `/sleepless improve IMP-XXX` or `/sleepless improve next`
**Backlog:** `.claude/improvement-backlog/BACKLOG_INDEX.json`

### P3 - Backlog
| Task | Status | Owner |
|------|--------|-------|
| VideoNode Component | 📋 Planned | Claude Code |
| AIChatNode Enhancement | 📋 Planned | Claude Code |
| UnityNOTES TravelLog Node | 📋 Planned | Claude Code |
| Auto-Organize Groups | 📋 Planned | Sleepless (Round 3) |
| Link Archiver Phase 5 (AI) | ⚠️ Partial | Claude Code |
| Live Collaborator Cursors | 📋 Planned | Claude Code (Round 4) |
| Undo/Redo System | 📋 Planned | Claude Code (Round 4) |

---

## PART B: INFRASTRUCTURE

### Daemon (Sleepless Agent)
| Property | Value |
|----------|-------|
| Status | Running (launchd managed) |
| App | Leads (`A0A2J35Q7D3`) / Bot User `U0A2J4EK753` |
| Socket Mode | Active (Slack Bolt) |
| Launcher | `~/bin/sleepless-launcher.sh` (4-phase: DNS, API, env, supervisor) |
| Daemon | `~/Library/Application Support/yellowcircle/sleepless/sleepless-daemon.py` |
| Repo copy | `scripts/sleepless-daemon.py` (source of truth) |
| Health watchdog | `auth_test()` every 60s, exits after 5 consecutive failures |
| Supervisor | Restarts on crash, 3 max rapid failures before deferring to launchd |
| launchd plist | `~/Library/LaunchAgents/com.yellowcircle.sleepless-daemon.plist` |
| Heartbeat | `~/Library/Application Support/yellowcircle/sleepless/.heartbeat.json` |
| Logs | `/tmp/sleepless-daemon.log` (stdout), `/tmp/sleepless-daemon.error.log` (stderr) |

**Commands:**
```bash
# Restart
launchctl kickstart gui/$(id -u)/com.yellowcircle.sleepless-daemon
# Stop
launchctl kill SIGTERM gui/$(id -u)/com.yellowcircle.sleepless-daemon
# Check status
cat ~/Library/Application\ Support/yellowcircle/sleepless/.heartbeat.json
# View logs
tail -f /tmp/sleepless-daemon.log
```

### Platform Services
| Component | Status | URL/Details |
|-----------|--------|-------------|
| Firebase Hosting | ✅ Live | yellowcircle.io |
| Firestore | ✅ Live | capsules, journeys, config |
| Cloud Functions | ✅ 36+ deployed | All operational |
| n8n (Railway) | ✅ Live | n8n-production-9ef7.up.railway.app |
| Staging | ✅ Live | yellowcircle-app--staging-djr44qvi.web.app |
| Ollama (local) | ✅ Running | localhost:11434 (LLM tier 1) |

---

## PART C: SCOPE REFERENCES

> Read these docs only when working on the relevant feature.

| Scope | Doc | Status |
|-------|-----|--------|
| Link Archiver | `.claude/plans/link-archiver-pocket-alternative.md` | Phases 1-4 complete, Phase 5 partial |
| Link Sharing | `dev-context/SCOPE_LINK_SHARING_USECASES.md` | Phase 3 complete, Phase 4 partial |
| Smooth Scrolling | `dev-context/SCOPE_UNITYNOTES_SMOOTH_SCROLLING.md` | All 4 phases complete |
| Offline Reading | `dev-context/SCOPE_OFFLINE_READING.md` | All 4 phases complete |
| Global Theming | `dev-context/SCOPE_GLOBAL_THEMING.md` | Research complete, implementation planned |
| UnityNOTES UI/UX | `dev-context/SCOPE_UNITYNOTES_UIUX_IMPROVEMENTS.md` | Research complete |
| Apple Shortcuts | `dev-context/SCOPE_APPLE_SHORTCUTS_SLACK.md` | Research complete, ready for MVP |
| User Settings | `dev-context/SCOPE_USER_SETTINGS_PAGE.md` | Complete |
| Code Quality | `dev-context/SCOPE_CODE_QUALITY_RULES.md` | Active reference |

---

## PART D: RECENT ACTIVITY

### Commits (Jan 23-28)
| Hash | Description |
|------|-------------|
| `a4c4a79` | Fix: Post-success spec update on main, not on branch |
| `7f2deb8` | Fix: Commit runner status changes before Claude CLI execution |
| `ad8647b` | Fix: Generate branch name from spec filename when empty |
| `3a9a179` | Chore: Reset stale branch/prUrl fields on all improvement specs |
| `c696c98` | Fix: sign-shortcut.yml YAML syntax error - extract plist to script |
| `ae6498a` | Fix: sign-shortcut ghost trigger - match push + skip at job level |
| `af677dd` | Fix: CI workflow fixes for Firebase preview deploys + shortcut signing |
| `2bae461` | Fix: 5 bugs found during improvement-runner testing |
| `7d8cde2` | Fix: 11 blockers in improvement-runner + Slack review workflow |
| `2a355d6` | Infra: Daemon hardening + global theming + docs overhaul |
| `82346f5` | UI: Add Settings to global navigation |
| `d3146fd` | Feature: UnityNOTES branded modals + Canvas management in Settings |

### Git Status
- Branch: `main`
- Last commit: `a4c4a79` (Jan 28)
- Working tree: clean
- Agent branch pending review: `sleepless/IMP-002-sticky-color-palette` ([PR #2](https://github.com/yellowcircle-io/yc-react/pull/2))

---

---

## PART E: WORKSTREAM TIERS

> **Purpose:** Clear ownership boundaries prevent runaway work, duplication, and agent confusion.
> Three execution modes, each with explicit scope constraints.

### Tier 1: Sleepless Agent (Autonomous)

**Execution:** `/sleepless improve next` — automated pipeline, human reviews PR

**Scope — what Sleepless handles:**
- CSS/style changes (hover states, shadows, transitions, colors)
- Component enhancement within existing patterns (add properties, update layouts)
- Simple additions where the reference pattern is clear (add a button style, expand a config)
- Standardization across sibling components (apply Pattern A from File X to Files Y, Z)

**Scope — what Sleepless does NOT handle:**
- New component architecture (building from scratch)
- Firebase/Firestore schema changes
- Complex state management (undo/redo, real-time sync)
- Multi-system integration (connecting subsystems)
- Creative or subjective decisions without explicit values in the spec

**Workstreams:**

| Track | Spec Range | Focus | Round Gate |
|-------|-----------|-------|------------|
| UnityNOTES Visual Polish | IMP-001 to IMP-008 | Hover, shadow, color, transitions | Round 1: 6/8 merge |
| UnityNOTES Component Enhancement | IMP-009 to IMP-014 | Content preview, toolbar, context menus | Round 2: gate on Round 1 |
| Unity Platform UI Polish | IMP-201+ | Page-level UI improvements | After Round 1 validated |

**Safeguards:**
- File scope enforcement (Gate 1) — only allowedFiles modified
- Line count cap (Gate 2) — prevents rewrites
- Lint + Build (Gates 3-4) — no regressions
- Circuit breaker — 3 consecutive failures pauses all agent work
- Concurrency lock — one improvement at a time
- Human merge gate — every PR reviewed before merge

### Tier 2: Claude Code (Interactive, Human-Directed)

**Execution:** Standard Claude Code sessions — human initiates, directs, reviews in real-time

**Scope — what Claude Code handles:**
- Competitive analysis (Playwright visits, scoring matrices, gap reports)
- New component architecture (VideoNode, TravelLogNode, etc.)
- Multi-file integration work (wiring new features across pages/services/hooks)
- Firebase schema design and migration
- UnitySTUDIO template architecture and rendering pipeline
- Round 3-4 improvement items that exceed Sleepless constraints
- P0/P1 bug fixes and urgent features

**Relationship to Sleepless:**
- Claude Code sessions produce SCOPE docs and competitive analysis
- Analysis feeds improvement backlog specs (JSON) for Sleepless
- Claude Code handles items Sleepless can't (complexity, creativity, architecture)
- Claude Code reviews and merges Sleepless PRs during daily upkeep

**Workstreams:**

| Workstream | Priority | Status | Next Step |
|-----------|----------|--------|-----------|
| Competitive Analysis (Milanote, ThreadDeck, Miro) | P2 | Not started | Playwright visits → COMPETITIVE_MATRIX.json |
| UnityNOTES Rounds 3-4 (new components) | P2-P3 | Blocked by analysis | Specs after gap scoring |
| UnitySTUDIO Ad Collateral Quality | P2 | Needs scoping | SCOPE doc required |
| Unity Platform Page Improvements | P2 | Not started | Specs after UnityNOTES Round 1 |

### Tier 3: Human-Only

**Execution:** Manual actions, business decisions, creative direction

**Scope:**
- Merge approvals for Sleepless PRs (GitHub or `/sleepless improve approve`)
- Competitive analysis review and gap prioritization
- Creative direction for templates, ad collateral, visual identity
- API credentials and platform authentication (Ad Platform tokens, iCloud, Firebase reauth)
- Business decisions: which competitors to study, which features to prioritize
- Notion dashboard updates for strategic tracking
- Self-hosted runner setup (if needed for sign-shortcut iCloud auth)

### Workstream Detail: UnitySTUDIO Ad Collateral

> **Status:** Needs SCOPE document. This workstream spans all three tiers.

| Layer | Owner | What |
|-------|-------|------|
| Creative direction | Human | What "professional-quality" means for yC ads, reference examples, brand standards |
| Template architecture | Claude Code | Template system, brand-aware rendering, platform-specific export profiles |
| Editor UI polish | Sleepless | Button placement, panel layout, responsive behavior (after architecture exists) |
| Platform API integration | Claude Code + Human | LinkedIn Marketing API, Meta Ads API (blocked by credentials) |
| Template iteration | Claude Code | Individual template improvements once system is built |

**Current state:** Editor functional (templates, layers, AI generate, export). Output is placeholder-quality.
**Target state:** Near-final assets matching platform ad standards (LinkedIn Sponsored, Instagram Story/Feed).
**Gap:** Template design quality, brand-aware defaults, typography hierarchy, platform formatting rules.

---

*Last synced with Notion: January 23, 2026*
*Next Notion sync recommended — include workstream tiers and improvement pipeline status*
