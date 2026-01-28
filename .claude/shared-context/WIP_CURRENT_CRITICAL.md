# WIP: Current Work in Progress

**Updated:** January 28, 2026 at 1:00 AM EST
**Machine:** Mac Mini
**Status:** Model selection + capacity controls added | Runner hardened | IMP-002 in review

---

## CURRENT SESSION (Jan 28, 2026) - Mac Mini

### Audit Fixes Applied to Improvement Pipeline

Comprehensive security and reliability audit completed, 6 categories of fixes applied:

| # | Severity | Fix | File |
|---|----------|-----|------|
| 1 | CRITICAL | TOCTOU race in concurrency lock — atomic mkdir-first acquisition with retry | `improvement-runner.sh` |
| 2 | HIGH | EXIT trap enhanced — full cleanup (spec reset, checkout main, pop stash, temp files) | `improvement-runner.sh` |
| 3 | HIGH | Process group kill on timeout — kills CLI children (prevents orphans) | `improvement-runner.sh` |
| 4 | HIGH | Daemon deduplication guard — prevents concurrent improve execution commands | `sleepless-daemon.py` |
| 5 | MEDIUM | Atomic JSON writes — write-to-temp-then-rename prevents corruption on crash | `improvement-runner.sh` |
| 6 | MEDIUM | Spec dependency chains fixed — IMP-003/004/005/006/008 blocked by IMP-001 | All spec JSONs + BACKLOG_INDEX |

### Spec Schema Consistency

- Added `prUrl: ""` field to IMP-003 through IMP-008 (was missing from 6 of 8 specs)
- Fixed BACKLOG_INDEX round1 progress: `review: 1, ready: 7` (was `review: 0, ready: 8`)
- Added `blockedBy` arrays to index entries for IMP-003, IMP-004, IMP-005, IMP-006, IMP-007, IMP-008

### Model Selection + Capacity Controls

Added to prevent runner from consuming the weekly Claude Code Opus allocation:

| # | Feature | Detail |
|---|---------|--------|
| 1 | **Model per spec** | `"model": "sonnet"` field in all spec JSONs. Runner reads and passes `--model` to Claude CLI |
| 2 | **Opus approval gate** | Specs with `"model": "opus"` require explicit approval via `--opus` flag or `/sleepless improve opus IMP-XXX` |
| 3 | **Daily execution cap** | 5 executions/day (configurable via `DAILY_CAP`). Counter resets at midnight. Shown in `--status` |
| 4 | **Daemon opus command** | `/sleepless improve opus IMP-XXX` triggers runner with `--opus` flag. Return code 2 = needs approval (hourglass emoji in Slack) |

### Execution Order (Validated)

Only IMP-001 eligible for `--next`. After IMP-001 merges → IMP-003, IMP-004, IMP-005, IMP-006, IMP-008 unblock. After IMP-002 merges → IMP-007 unblocks. No file collision possible.

### IMP-002 Pilot (Complete)

IMP-002 (16-Color Sticky Palette) passed all 4 validation gates. PR #2 pending human review: https://github.com/yellowcircle-io/yc-react/pull/2

---

## Agent Improvements Status

- **System:** Autonomous UI/UX Improvement Pipeline
- **Last run:** Jan 28, 2026 — IMP-002 pilot (success)
- **Branches pending review:** 1 (`sleepless/IMP-002-sticky-color-palette` — PR #2)
- **Circuit breaker:** Closed (0/3 failures)
- **Current round:** 1 (Visual Polish)
- **Round progress:** 0/8 merged, 1/8 in review
- **Next eligible:** IMP-001 (Enhanced Node Hover States)
- **Default model:** Sonnet (all Round 1 specs)
- **Opus:** Requires approval (`/sleepless improve opus IMP-XXX`)
- **Daily cap:** 5 executions/day
- **Runner:** `scripts/improvement-runner.sh`
- **Daemon command:** `/sleepless improve IMP-XXX`
- **Backlog:** `.claude/improvement-backlog/BACKLOG_INDEX.json`

---

## PENDING WORK

### Pending Optimizations
- [ ] Link Saver: Top row buttons not sticky on scroll
- [ ] Link Saver: Improve top row button spacing
- [ ] Unity Generator: "Email Type" button alignment
- [ ] UnityNOTES: PhotoModal ~10% smaller (mobile nav overlap)
- [ ] Firebase Deploy: Needs `firebase login --reauth`

### Mobile Spacing Still Needed
- [ ] Unity Hub, Journeys, Golden Unknown, Cath3dral, Thoughts, Why Your GTM Sucks

### Planned (Not Started)
- Competitive Analysis Phase 1 (Playwright visits: Milanote, ThreadDeck, Miro)
- UnitySTUDIO Ad Collateral SCOPE doc
- Global Theme System full implementation

---

## RECENT COMMITS (Jan 24-28)

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

---

## SESSION ARCHIVE

Older session summaries (Jan 10-27) have been archived. Key completed work:

- Link Archiver Sprints 1-4, UnityNOTES Smooth Scrolling (all phases)
- Offline Reading PWA, Mobile Padding Audit (17 pages)
- Save ID System, Vanity URLs, Architecture/Lint Cleanup
- Sleepless Agent Phases 1-2, Link Sharing with Slack
- Global Theming Phase 1, UnityNOTES Templates, Settings Nav
- Daemon hardening (DNS, watchdog, supervisor, launchd)
- Improvement Runner Pipeline (9 bugs fixed, 4-gate validation)
- Workstream Tiers documented in ACTIVE_SPRINT.md (Part E)
