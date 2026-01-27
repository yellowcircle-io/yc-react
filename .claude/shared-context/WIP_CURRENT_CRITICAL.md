# WIP: Current Work in Progress

**Updated:** January 27, 2026 at 3:30 PM EST
**Machine:** Mac Mini
**Status:** Daemon infrastructure hardened | UI work pending commit

---

## CURRENT SESSION (Jan 27, 2026) - Mac Mini

### Daemon Infrastructure Hardened

**Problem:** Sleepless daemon had DNS failures at boot (49 errors), WebSocket degradation from sleep/wake cycles (BrokenPipe, SSL errors), and no self-healing.

**Changes made:**

| File | Change |
|------|--------|
| `~/bin/sleepless-launcher.sh` | 4-phase launcher: DNS wait (120s), API check (30s), env setup, supervisor loop |
| `scripts/sleepless-launcher.sh` | Repo copy synced with same 5-phase structure (adds Dropbox mount wait) |
| `scripts/sleepless-daemon.py` | Added `health_watchdog()` thread: checks `auth_test()` every 60s, exits after 5 consecutive failures |
| Local daemon copy synced | `~/Library/Application Support/yellowcircle/sleepless/sleepless-daemon.py` |

**Defense-in-depth architecture:**
1. **Pre-flight:** DNS + Slack API reachability before daemon start
2. **Health watchdog:** `auth_test()` every 60s, `os._exit(2)` after 5 failures
3. **Supervisor loop:** Restarts daemon on non-zero exit, DNS check between restarts, 3 max consecutive failures
4. **launchd KeepAlive:** OS-level restart on launcher crash

**Stale processes killed:** Thursday Vite (PID 6046/6047), keeping Sunday instance.

**Tests passed:** All 9 (DNS, API, daemon startup, watchdog init, clean shutdown, supervisor restart/maxfail/SIGTERM, full integration).

**Daemon status:** Running via launchd (PID 92174), health check posted to Slack.

### Playwright MCP

Reconnected Chromium and Firefox. Safari (webkit) was already running. Note: Playwright MCP servers can only be started via Claude Code `/mcp` command -- no standalone shell command.

---

## PENDING WORK (Uncommitted)

### UI/UX Changes (LOCAL ONLY - not committed)
- Global Theming: Header.jsx + Footer.jsx migrated to COLORS constants
- UnityNOTES: Template system (canvasTemplates.js, TemplateSelector.jsx)
- UnityNOTES: Branded modals + Canvas management in Settings
- Settings added to global navigation
- UnityNOTES node improvements (6 node components updated)
- CSS constants + index.css global theme variables (449 lines added)

### Pending Optimizations
- [ ] Link Saver: Top row buttons not sticky on scroll
- [ ] Link Saver: Improve top row button spacing
- [ ] Unity Generator: "Email Type" button alignment
- [ ] UnityNOTES: PhotoModal ~10% smaller (mobile nav overlap)
- [ ] Firebase Deploy: Needs `firebase login --reauth`

### Mobile Spacing Still Needed
- [ ] Unity Hub, Journeys, Golden Unknown, Cath3dral, Thoughts, Why Your GTM Sucks

---

## RECENT COMMITS (Jan 24-27)

| Hash | Description |
|------|-------------|
| `82346f5` | UI: Add Settings to global navigation |
| `d3146fd` | Feature: UnityNOTES branded modals + Canvas management in Settings |
| `cb687e7` | Fix: Mobile spacing pattern - local isMobile state for 11 pages |
| `36ef7a5` | UI: Mobile spacing fixes for 12 pages + pagesConfig update |
| `ecf45b1` | Update: MSF with zoom fix session & pending optimizations |

---

## PREVIOUS SESSION (Jan 24, 2026) - Mac Mini

### Phase 1 & 2 Complete
- Global Theming Phase 1: Header/Footer/6 node components migrated to constants
- UnityNOTES Templates: 6 templates (Project Planning, Journey Map, Mind Map, Mood Board, Kanban, Brainstorm)
- Settings navigation: Added to global nav, canvas management in Settings
- Additional mobile spacing: 6 more pages fixed + pagesConfig.js updated

### Key Files Created
- `src/components/unity-plus/templates/canvasTemplates.js` (765 lines)
- `src/components/unity-plus/templates/TemplateSelector.jsx` (489 lines)
- `src/hooks/useThemedStyles.js`
- `src/styles/constants.js` (updated)

---

## SESSION ARCHIVE

Older session summaries (Jan 10-23, 2026) have been archived to keep this file under token limits. Key completed work from that period:

- Link Archiver Sprints 1-4 (core MVP, organization, reader, Unity integration)
- UnityNOTES Smooth Scrolling (all 4 phases)
- Offline Reading PWA (all 4 phases)
- Mobile Padding Audit (17 pages)
- Save ID System & Vanity URLs
- Architecture & Lint Cleanup (1135 -> 13 errors)
- Sleepless Agent Phase 1-2 Optimizations
- Link Sharing with Slack Notifications
- Personal API Token System

For full history, see git log: `git log --oneline --since="2026-01-10" --until="2026-01-24"`
