# Claude Code Multi-Machine Context System

**Created:** November 2, 2025
**Purpose:** Enable seamless Claude Code work across multiple machines and devices

---

## System Overview

This directory contains a **dual-sync multi-machine context sharing system** that enables you to work seamlessly across:
- Mac Mini (primary development machine)
- MacBook Air (secondary machine)
- Old Mac Mini (future CI/CD server)
- Newer machine (planned future primary)
- iPad/iPhone/non-primary devices (via GitHub Codespaces)

**Sync Methods:**
1. **Dropbox** - Fast file sync for seamless machine switching (10-30 seconds)
2. **GitHub** - Version control and Codespaces access for mobile devices
3. **Google Drive** - Additional data source for Rho assessments (one-time import, not active sync)

---

## 🔴 CRITICAL Files Requiring User Attention

These files are marked CRITICAL and require user action or regular attention:

1. **`.claude/MACBOOK_AIR_FIRST_RUN_NOV2_2025_CRITICAL.md`** 🔴 ⭐ **START HERE FOR MACBOOK AIR**
   - **Action Required:** ONE-TIME verification and setup for MacBook Air
   - **Contains:** Step-by-step Dropbox sync verification checklist
   - **Read this:** First time using MacBook Air with this system
   - **Delete after:** Successful verification (~15 minutes)

2. **`.claude/MULTI_MACHINE_SETUP_CRITICAL.md`** 🔴
   - **Action Required:** Set up CI/CD server and other future machines
   - **Contains:** Complete setup instructions for all machines
   - **Read this:** Before setting up any new machine

3. **`.claude/CODESPACES_MOBILE_ACCESS_CRITICAL.md`** 🔴
   - **Action Required:** Enable mobile/Codespace access
   - **Contains:** GitHub Codespaces and iPad/iPhone access instructions
   - **Read this:** Before accessing from mobile devices

4. **`.claude/shared-context/WIP_CURRENT_CRITICAL.md`** 🔴
   - **Action Required:** Check before EVERY work session, update before EVERY machine switch
   - **Contains:** Current work status, next steps, blockers
   - **Read this:** Before starting work on ANY machine

**⚠️ All CRITICAL files sync via Dropbox and should be committed to GitHub for Codespace access**

---

## Directory Structure

```
.claude/
├── README.md                                    (this file - system overview)
├── MACBOOK_AIR_FIRST_RUN_NOV2_2025_CRITICAL.md 🔴⭐ (MacBook Air verification - one-time use)
├── MULTI_MACHINE_SETUP_CRITICAL.md             🔴 (setup guide for new machines)
├── CODESPACES_MOBILE_ACCESS_CRITICAL.md        🔴 (mobile & Codespace access guide)
├── INSTANCE_LOG_MacMini.md                     (Mac Mini activity log)
├── INSTANCE_LOG_MacBookAir.md                  (MacBook Air activity log - to be created)
├── INSTANCE_LOG_CI_CD.md                       (CI/CD server log - future)
└── shared-context/
    ├── README.md                                (shared context usage guide)
    ├── WIP_CURRENT_CRITICAL.md                 🔴 (current work-in-progress)
    ├── WIP_[DATE].md                           (archived WIP notes)
    ├── DECISIONS.md                            (cross-machine decision log)
    └── SESSION_[DATE]_[MACHINE].md             (detailed session summaries)
```

**🔴 = CRITICAL files requiring user attention/action**
**⭐ = START HERE for MacBook Air first run**

---

## Quick Start

### For Mac Mini (Current Machine)
✅ **Already set up!** This machine created the system.

**What you can do:**
- Work normally using Claude Code
- Before switching machines: Update `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
- After completing work: Update `.claude/INSTANCE_LOG_MacMini.md`
- Commit and push to GitHub for mobile access

### For MacBook Air (Secondary Machine)
🔴 **FIRST RUN:** `.claude/MACBOOK_AIR_FIRST_RUN_NOV2_2025_CRITICAL.md` ⭐ **START HERE**

**One-time verification (15 minutes):**
1. Navigate to: `~/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/`
2. Read and follow: `.claude/MACBOOK_AIR_FIRST_RUN_NOV2_2025_CRITICAL.md`
3. Complete verification checklist
4. Create `INSTANCE_LOG_MacBookAir.md` (guided in file)
5. Delete verification file after successful setup

**After setup:**
- Read `shared-context/WIP_CURRENT_CRITICAL.md` before each work session
- Update `WIP_CURRENT_CRITICAL.md` before/after work sessions

### For iPad/iPhone (Mobile Access)
🔴 **Read:** `.claude/CODESPACES_MOBILE_ACCESS_CRITICAL.md`

**Quick access:**
1. Open GitHub app
2. Navigate to `yellowcircle-io/yc-react`
3. View `.claude/shared-context/WIP_CURRENT_CRITICAL.md` for current status
4. For editing: Open Codespace in Safari

### For CI/CD Server (Future)
🔧 **Read:** `.claude/MULTI_MACHINE_SETUP_CRITICAL.md` (CI/CD section)

**When ready to set up:**
1. Follow CI/CD server setup instructions
2. Create `.claude/INSTANCE_LOG_CI_CD.md`
3. Configure automated tasks

---

## Key Files and Their Purpose

### Instance Logs
**Purpose:** Track all actions and sessions per machine
**Location:** `.claude/INSTANCE_LOG_[MACHINE].md`
**Update When:** After significant work sessions
**Contains:** Session history, files created, git operations, machine-specific notes

### WIP_CURRENT_CRITICAL.md 🔴
**Purpose:** Always contains the most recent work-in-progress status
**Location:** `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
**Update When:** Before switching machines or pausing work
**Contains:** Current task, context needed, next steps, blockers
**Status:** CRITICAL - Must be checked before every work session

### DECISIONS.md
**Purpose:** Log important decisions made across all machines
**Location:** `.claude/shared-context/DECISIONS.md`
**Update When:** After making architectural or strategic decisions
**Contains:** Decision title, context, rationale, alternatives considered

### Session Summaries
**Purpose:** Detailed notes for complex multi-step work
**Location:** `.claude/shared-context/SESSION_[DATE]_[MACHINE].md`
**Create When:** Complex tasks requiring detailed context
**Contains:** Comprehensive session notes, technical details, references

---

## Typical Workflows

### Workflow 1: Machine Switching (Mac Mini → MacBook Air)

**On Mac Mini (before switch):**
1. Complete current task or reach stopping point
2. Update `shared-context/WIP_CURRENT_CRITICAL.md`:
   - Timestamp and machine
   - Status and next steps
   - Any blockers or notes
3. Update `INSTANCE_LOG_MacMini.md` with session summary
4. Commit and push git changes
5. Wait 30 seconds for Dropbox sync

**On MacBook Air (after switch):**
1. Wait for Dropbox sync
2. Read `shared-context/WIP_CURRENT_CRITICAL.md`
3. Read `INSTANCE_LOG_MacMini.md` if needed
4. Pull git changes
5. Continue work from next steps
6. Update `WIP_CURRENT_CRITICAL.md` when done

### Workflow 2: Mobile Quick Check (iPhone)

1. Open GitHub app
2. Navigate to `yellowcircle-io/yc-react`
3. Open `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
4. Read current status
5. Check "Next Steps" section
6. Close app

### Workflow 3: Emergency Fix (iPad via Codespace)

1. Open Safari
2. Navigate to GitHub repository
3. Create Codespace
4. Read `shared-context/WIP_CURRENT_CRITICAL.md`
5. Make fix
6. Update `WIP_CURRENT_CRITICAL.md` with changes
7. Add entry to `DECISIONS.md`
8. Commit and push
9. Stop Codespace

### Workflow 4: Deep Analysis Session (Mac Mini)

1. Read `shared-context/WIP_CURRENT_CRITICAL.md`
2. Conduct analysis
3. Create documents in `dev-context/`
4. Create `shared-context/SESSION_[DATE]_MacMini.md` with detailed notes
5. Update `shared-context/WIP_CURRENT_CRITICAL.md` with references
6. Add key decisions to `shared-context/DECISIONS.md`
7. Update `INSTANCE_LOG_MacMini.md`
8. Commit and push

---

## Synchronization Details

### Dropbox Sync
- **Speed:** 10-30 seconds for small files
- **What syncs:** All files in project directory including `.git/`
- **Path:** `/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/`
- **Machines:** Mac Mini ↔ MacBook Air (instant sync)

### GitHub Sync
- **Speed:** Instant (push/pull as needed)
- **What syncs:** Git-tracked files only
- **Repository:** https://github.com/yellowcircle-io/yc-react.git
- **Access:** All machines + Codespaces + mobile

### Google Drive Integration
- **Purpose:** Additional data source for Rho assessments and professional materials
- **Path:** `/Users/christophercooper_1/Library/CloudStorage/GoogleDrive-christopher@yellowcircle.io/My Drive/Rho Assessments 2026`
- **Integration:** One-time reconciliation and copy to dev-context (not active sync)
- **Script:** `GOOGLE_DRIVE_RECONCILIATION.sh` (automated file comparison and copying)
- **Report:** `dev-context/GOOGLE_DRIVE_RECONCILIATION_REPORT.md` (documents what was copied)

### Multi-Source Pattern
1. **Dropbox** handles file-level sync between Mac Mini and MacBook Air
2. **GitHub** handles version control and provides Codespace access
3. **Google Drive** serves as additional data source (Rho Assessments 2026 folder)
4. **Data Flow:** Google Drive → dev-context (one-time copy) → Dropbox sync → GitHub commit
5. **All work together** for comprehensive multi-device coverage and data integration

---

## Best Practices

1. ✅ **Always read `WIP_CURRENT_CRITICAL.md`** before starting work
2. ✅ **Always update `WIP_CURRENT_CRITICAL.md`** before switching machines
3. ✅ **Wait 30 seconds** for Dropbox sync after updates
4. ✅ **Commit and push** significant changes to GitHub
5. ✅ **Update instance logs** after completing sessions
6. ✅ **Document decisions** in `DECISIONS.md`
7. ✅ **Create session summaries** for complex work
8. ✅ **Use correct Dropbox path** (Library/CloudStorage/)
9. ✅ **Stop Codespaces** when done (saves quota)
10. ✅ **Keep context concise** (archive old WIP notes)

---

## Current System Status

### Machines Configured
- ✅ **Mac Mini** - Primary development machine (configured)
- ⏳ **MacBook Air** - Secondary machine (awaiting user setup)
- ⏳ **CI/CD Server** - Old Mac Mini (future)
- ⏳ **Newer Machine** - Planned primary (future)

### Sync Status
- ✅ **Dropbox** - Verified working (test file confirmed)
- ✅ **GitHub** - Repository configured and active
- ✅ **`.claude/` directory** - Created and populated
- ✅ **Shared context** - Initialized with templates

### Files Created (This Session)
1. `.claude/README.md` (this file)
2. `.claude/INSTANCE_LOG_MacMini.md`
3. `.claude/MULTI_MACHINE_SETUP_CRITICAL.md`
4. `.claude/CODESPACES_MOBILE_ACCESS_CRITICAL.md`
5. `.claude/shared-context/README.md`
6. `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
7. `.claude/shared-context/DECISIONS.md`

### GitHub Status
- **Remote:** https://github.com/yellowcircle-io/yc-react.git
- **Branch:** main (1 commit ahead - needs push)
- **Untracked:** `.claude/` directory (recommend committing for Codespace access)

---

## Next Steps (Optional)

### Immediate Actions
1. **Commit `.claude/` to GitHub** (enables Codespace access):
   ```bash
   git add .claude/
   git commit -m "Add multi-machine Claude Code context system"
   git push
   ```

2. **Test machine switching:**
   - Update `WIP_CURRENT_CRITICAL.md` on Mac Mini
   - Wait 30 seconds
   - Check MacBook Air for synced file

3. **Set up MacBook Air:**
   - Follow instructions in `MULTI_MACHINE_SETUP_CRITICAL.md`
   - Create `INSTANCE_LOG_MacBookAir.md`
   - Test shared context access

### Future Actions
1. **Test Codespace access** from iPad/iPhone
2. **Add CI/CD server** when old Mac Mini is ready
3. **Archive old WIP notes** as they accumulate (keep last 30 days)
4. **Review DECISIONS.md** periodically for insights

### Optional Enhancements
1. **Create `.gitignore` entry** if you want to keep `.claude/` private (not recommended)
2. **Set up automated WIP archiving** script
3. **Create custom VS Code workspace** for multi-machine development
4. **Add machine-specific `.claude/` settings** if needed

---

## Troubleshooting

**Common Issues:**

1. **Files not syncing** → Verify Dropbox path, wait 30-60 seconds
2. **Git conflicts** → Pull before making changes, use `git status`
3. **Outdated WIP** → Check timestamp, verify Dropbox sync status
4. **Can't find context** → Use grep to search: `grep -r "keyword" .claude/`
5. **Codespace issues** → Check GitHub status, stop and restart

**Documentation:**
- See `MULTI_MACHINE_SETUP_CRITICAL.md` for detailed troubleshooting
- See `CODESPACES_MOBILE_ACCESS_CRITICAL.md` for mobile-specific issues
- See `shared-context/README.md` for context file issues

---

## Support and Documentation

### Primary Guides
- **`.claude/MULTI_MACHINE_SETUP_CRITICAL.md`** - Complete setup instructions
- **`.claude/CODESPACES_MOBILE_ACCESS_CRITICAL.md`** - Mobile and Codespace access
- **`.claude/shared-context/README.md`** - Shared context usage

### Project Documentation
- **`DROPBOX_PATH_GUIDE.md`** - Dropbox configuration (root directory)
- **`DROPBOX_SYNC_TEST.md`** - Sync verification test file (root directory)
- **`CLAUDE.md`** - Project-specific Claude Code guidance (root directory)

### External Resources
- GitHub Codespaces: https://docs.github.com/en/codespaces
- Dropbox sync: https://help.dropbox.com
- Repository: https://github.com/yellowcircle-io/yc-react

---

## Version History

### v1.0 - November 2, 2025
- Initial multi-machine context system created
- Mac Mini instance configured
- Dual-sync (Dropbox + GitHub) architecture implemented
- Comprehensive documentation written
- Ready for MacBook Air setup and mobile access

---

**System Created:** November 2, 2025
**Last Updated:** November 2, 2025
**Status:** ✅ Operational (Mac Mini configured, ready for multi-machine use)
**Maintained By:** All Claude Code instances across machines
