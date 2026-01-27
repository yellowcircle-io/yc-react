# ACTIVE SPRINT - yellowCircle Platform

**Updated:** January 27, 2026
**Source of Truth:** [Notion Project Tracking](https://www.notion.so/18aa447307f846c6a646f58e87372a47)

> **Structure:** This file is organized in parts to control token usage.
> - **Part A:** Current priorities and active tasks (read first)
> - **Part B:** Infrastructure and daemon status
> - **Part C:** Scope status references (links only, read scope docs as needed)
> - **Part D:** Recent commits and git status

---

## PART A: CURRENT PRIORITIES

### P0 - Immediate
| Task | Status | Notes |
|------|--------|-------|
| Daemon DNS + Health Hardening | ✅ Complete | Launcher, watchdog, supervisor loop (Jan 27) |
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

### P2 - Planned
| Task | Status | Notes |
|------|--------|-------|
| Global Theme System (Full) | 📋 Planned | Research complete, see SCOPE_GLOBAL_THEMING.md |
| UnityNOTES UI/UX Improvements | 📋 Planned | Research complete, see SCOPE_UNITYNOTES_UIUX_IMPROVEMENTS.md |
| Apple Shortcuts + Slack | 📋 Planned | Research complete, see SCOPE_APPLE_SHORTCUTS_SLACK.md |
| Link Sharing Phase 4 (Slack App) | ⚠️ Partial | Webhook working, full slash commands not yet |

### P3 - Backlog
| Task | Status |
|------|--------|
| VideoNode Component | 📋 Planned |
| AIChatNode Enhancement | 📋 Planned |
| UnityNOTES TravelLog Node | 📋 Planned |
| Auto-Organize Groups | 📋 Planned |
| Link Archiver Phase 5 (AI) | ⚠️ Partial |

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

### Commits (Jan 24-27)
| Hash | Description |
|------|-------------|
| `82346f5` | UI: Add Settings to global navigation |
| `d3146fd` | Feature: UnityNOTES branded modals + Canvas management in Settings |
| `cb687e7` | Fix: Mobile spacing pattern - local isMobile state for 11 pages |
| `36ef7a5` | UI: Mobile spacing fixes for 12 pages + pagesConfig update |
| `ecf45b1` | Update: MSF with zoom fix session & pending optimizations |

### Uncommitted Changes (19 files, +1117/-464)
- Global theming: Header.jsx, Footer.jsx, constants.js, index.css
- UnityNOTES: 6 node components, UnityCircleNav.jsx, UnityNotesPage.jsx
- Templates: canvasTemplates.js, TemplateSelector.jsx (new)
- Hooks: useThemedStyles.js, useSlackNotification.js (new)
- Daemon: sleepless-daemon.py, sleepless-launcher.sh (hardening)
- Scripts: slack-notify.sh, slack-status.sh, yc-command.sh (new)

### Git Status
- Branch: `main`
- Last commit: `82346f5`
- Uncommitted: 19 files modified, 6 untracked

---

*Last synced with Notion: January 23, 2026*
*Next Notion sync recommended*
