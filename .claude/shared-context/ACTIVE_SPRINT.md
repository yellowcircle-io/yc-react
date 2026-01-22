# ACTIVE SPRINT - yellowCircle Platform
**Updated:** January 21, 2026
**Source of Truth:** [Notion Project Tracking](https://www.notion.so/18aa447307f846c6a646f58e87372a47)

---

## 🔴 CURRENT PRIORITIES (Synced with Notion)

### P1 Tasks - Active
| Task | Status | Due | Notion Link |
|------|--------|-----|-------------|
| Link Archiver Integration | 📋 Planned | Jan 31 | [View](https://www.notion.so/2ea15c1b110d81728e54e06fc37e8c8d) |
| Configure Ad Platform Tokens | ⚠️ User Action | - | [View](https://www.notion.so/2ea15c1b110d8195b4d8d08fd9d89d4e) |
| Launch Outbound Campaign | ⏳ Blocked | - | [View](https://www.notion.so/2ea15c1b110d819e9815d359cb54f528) |

### P2 Tasks - Planned
| Task | Status | Due | Est. Hours |
|------|--------|-----|------------|
| Review workspace optimizations (sleepless) | ⏳ Pending | Jan 22 | 4 hrs |
| Global Theme System Enhancement | 📋 Planned | Feb 15 | 8 hrs |
| User Settings/Config Page | 📋 Planned | - | - |
| Claude Bot Relay | 📋 Scoped | - | - |

### P3 Tasks - Backlog
| Task | Status | Est. Hours |
|------|--------|------------|
| LinkNode Component | 📋 Planned | 4 hrs |
| VideoNode Component | 📋 Planned | 4 hrs |
| @Mentions + Notifications | 📋 Planned | 8 hrs |
| AIChatNode Enhancement | 📋 Planned | 6 hrs |
| UnityNOTES TravelLog Node | 📋 Planned | 20 hrs |
| Auto-Organize Groups | 📋 Planned | 6 hrs |

---

## 📦 LINK ARCHIVER INTEGRATION (P1)

**Due:** January 31, 2026 | **Estimated:** 10 hours | **Category:** Unity Notes

### Scope Documents
- `dev-context/SCOPE_LINK_ARCHIVER_DRAWER.md` - LinksTab integration spec
- `dev-context/SCOPE_LINK_SHARING_USECASES.md` - Use case analysis

### Implementation Phases
| Phase | Description | Hours | Status |
|-------|-------------|-------|--------|
| Phase 1 | Infrastructure (ArchiveBox/Wallabag eval, deploy) | 3 | ⏳ Not Started |
| Phase 2 | UnityNOTES Integration (ArchivedLinkNode, API) | 4 | ⏳ Not Started |
| Phase 3 | Capture Tools (iPhone Shortcut, Browser ext) | 3 | ⏳ Not Started |

### LinksTab Integration (OverviewTray)
```
OverviewTray (Current)          OverviewTray (Proposed)
├── BookmarksTab                ├── BookmarksTab
├── NodesTab                    ├── NodesTab
└── NotificationsTab            ├── LinksTab (NEW)
                                └── NotificationsTab
```

---

## 🔍 SLEEPLESS AGENT REVIEW (P2 - Due Jan 22)

**Commit:** `abb7e7a` | **Impact:** +12,452 / -4,821 lines to UnityNotesPage.jsx

### Review Findings (Jan 21, 2026)

#### ✅ Architecture Compliance
- No direct Firebase imports in UnityNotesPage.jsx (correct)
- Uses `src/utils/firestore*.js` service layer (correct)

#### ❌ Architecture Violations Found
| File | Issue | Fix Required |
|------|-------|--------------|
| `src/components/admin/PipelineStatsCard.jsx:21` | Direct `firebase/auth` import | Use `useAuth()` |
| `src/components/admin/AnalyticsSummary.jsx:24` | Direct `firebase/auth` import | Use `useAuth()` |
| `src/components/admin/EmailStatsCard.jsx:23` | Direct `firebase/auth` import | Use `useAuth()` |

#### ⚠️ Lint Status
**32 errors + 31 warnings** in codebase (from `npm run lint`)

Key issues:
- 4 unused variables in HubSpot adapter
- 4 catch blocks with unused `error` → rename to `_error`
- 1 `process` undefined in ErrorBoundary
- Multiple `react-refresh/only-export-components` warnings
- Missing `useCallback` wraps in AuthContext

### Action Items
1. [ ] Fix 3 architecture violations (Firebase direct imports)
2. [ ] Fix 32 lint errors
3. [ ] Review 31 lint warnings (prioritize react-hooks/exhaustive-deps)
4. [ ] Validate performance improvements from sleepless commit
5. [ ] Document retained patterns for future automation

---

## 📊 RECENT COMMITS (Jan 21, 2026)

| Hash | Description |
|------|-------------|
| `6b0a495` | Update: ACTIVE_SPRINT with Jan 21 commits |
| `98c7f87` | Update: MSF context files for multi-machine sync |
| `79a8704` | Config: Add vite security plugin and update firebase config |
| `ff9aba0` | Feature: Pocket import Cloud Functions |
| `5bce742` | Docs: Add planning and scope documentation |
| `16e1264` | Feature: Link management UI improvements |
| `b163570` | Cleanup: Remove archived unused code (-12,081 lines) |
| `58a2afa` | Perf: Sprint 4 performance optimizations |

### Git Status
- Branch: `main`
- Last commit: `6b0a495`
- Status: ✅ Synced with origin/main

---

## ✅ COMPLETED (Sprint 4 - Jan 2026)

### Sprint 4 Features
| Feature | Commit |
|---------|--------|
| Comments & Notifications System | `76fe4db` |
| Smart Views filtering | `76fe4db` |
| Performance optimizations (Lottie lazy load) | `58a2afa` |
| Archive cleanup (-12,081 lines) | `b163570` |
| Pocket import Cloud Functions | `ff9aba0` |

### CLAUDE.md Architecture Update
| Action | Commit |
|--------|--------|
| Architecture Patterns section | `07dc671` |
| Forbidden Patterns section | `07dc671` |
| Quality Gates & Tools section | `07dc671` |
| Development Workflows | `07dc671` |

### Infrastructure Milestones (Dec-Jan)
- ✅ Firebase Auth SSO Migration
- ✅ Firestore Security Rules Hardening
- ✅ Brevo ESP Integration
- ✅ Valentine's Campaign Testing
- ✅ Demo Mode & Staging

---

## 🔧 INFRASTRUCTURE STATUS

| Component | Status | URL/Details |
|-----------|--------|-------------|
| Firebase Hosting | ✅ Live | yellowcircle.io |
| Firestore | ✅ Live | capsules, journeys, config |
| Cloud Functions | ✅ 36+ deployed | All operational |
| n8n (Railway) | ✅ Live | n8n-production-9ef7.up.railway.app |
| Staging | ✅ Live | yellowcircle-app--staging-djr44qvi.web.app |

---

## 📋 QUICK REFERENCE

### Development
```bash
npm run dev          # Start dev server
npm run lint         # Run ESLint (32 errors, 31 warnings)
npm run build        # Build for production
npm run check:deps   # Run knip dead code detection
```

### Key Scope Documents
- `dev-context/SCOPE_LINK_ARCHIVER_DRAWER.md`
- `dev-context/SCOPE_LINK_SHARING_USECASES.md`
- `dev-context/SCOPE_USER_SETTINGS_PAGE.md`
- `dev-context/SCOPE_OFFLINE_READING.md`

### Notion Integration
- [Project Tracking Database](https://www.notion.so/18aa447307f846c6a646f58e87372a47)
- Categories: yellowCircle, Unity Notes, Unity MAP, Unity STUDIO, Infrastructure

---

*Last synced with Notion: January 21, 2026*
