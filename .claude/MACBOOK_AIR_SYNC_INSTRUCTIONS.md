# MacBook Air - Sync Instructions After Mac Mini Updates

**Created on Mac Mini:** November 2, 2025 at 8:00 PM PST
**Status:** Mac Mini has completed multi-machine system setup and pushed to GitHub
**Action Required:** MacBook Air needs to sync both Dropbox and GitHub

---

## Current State

### On Mac Mini (Completed):
- ✅ Multi-machine system created (`.claude/` directory)
- ✅ All CRITICAL files created
- ✅ CLAUDE.md updated with multi-machine instructions
- ✅ Two commits pushed to GitHub:
  - `d22207d` - Initial multi-machine system (11 files, 3,008 insertions)
  - `2919183` - Context updates with GitHub sync status (3 files, 89 insertions)
- ✅ Files syncing via Dropbox
- ✅ Ready for MacBook Air integration

### What MacBook Air Needs:
1. ⏳ Dropbox files to sync (automatic, 10-30 seconds)
2. ⏳ Git pull to get latest GitHub commits
3. ⏳ Run first-time verification checklist
4. ⏳ Create MacBook Air instance log

---

## Sync Strategy: Dropbox THEN GitHub

**Why this order:**
1. **Dropbox first:** Gets all files including uncommitted changes and the verification checklist
2. **GitHub second:** Ensures git repository is up to date with latest commits
3. **Best of both:** Combines speed of Dropbox with version control of GitHub

---

## Instructions for MacBook Air

### Step 1: Wait for Dropbox Sync (30 seconds)

**Before starting:**
- Ensure Dropbox is running on MacBook Air
- Wait 30-60 seconds after Mac Mini finishes work
- Check Dropbox menu bar icon shows sync complete

### Step 2: Navigate to Project (1 minute)

Open Terminal on MacBook Air:

```bash
# Navigate to project directory
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/

# Verify you're in the correct syncing path
pwd
# Expected: /Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle
```

**✅ Checkpoint:** If pwd shows correct path, you're in syncing Dropbox location.

### Step 3: Verify Dropbox Files Synced (2 minutes)

```bash
# Check .claude directory exists
ls -lh .claude/
# Expected: Multiple files including MACBOOK_AIR_FIRST_RUN_CRITICAL.md

# Check CRITICAL files exist
ls -lh .claude/*CRITICAL*.md
# Expected:
# - MACBOOK_AIR_FIRST_RUN_CRITICAL.md
# - MULTI_MACHINE_SETUP_CRITICAL.md
# - CODESPACES_MOBILE_ACCESS_CRITICAL.md

# Check shared context
ls -lh .claude/shared-context/*CRITICAL*.md
# Expected: WIP_CURRENT_CRITICAL.md

# Quick check of WIP file
head -10 .claude/shared-context/WIP_CURRENT_CRITICAL.md
# Should show recent timestamp from Mac Mini
```

**✅ Checkpoint:** All files should be present via Dropbox sync.

### Step 4: Pull Latest GitHub Commits (1 minute)

```bash
# Check current git status
git status
# Note: May show "Your branch is behind 'origin/main'"

# Check what commits are available
git log origin/main --oneline -5
# Expected to see:
# 2919183 Update .claude/ context with GitHub sync completion status
# d22207d Add multi-machine Claude Code context sharing system

# Pull latest commits from GitHub
git pull

# Verify pull successful
git log --oneline -5
# Should now show both commits locally
```

**✅ Checkpoint:** Git pull should complete successfully with latest commits.

### Step 5: Verify Both Syncs Complete (1 minute)

```bash
# Check git status
git status
# Expected: "Your branch is up to date with 'origin/main'"

# Read latest WIP status
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md | head -20
# Should show:
# - Updated: November 2, 2025 at 7:45 PM PST
# - Machine: Mac Mini (Primary)
# - Status: Complete - Multi-machine system fully operational + GitHub sync enabled

# Check latest commit
git log -1 --oneline
# Expected: 2919183 Update .claude/ context with GitHub sync completion status
```

**✅ Checkpoint:** Both Dropbox and GitHub syncs complete.

### Step 6: Run First-Time Verification (15 minutes)

Now that files are synced, run the complete verification checklist:

```bash
# Read the verification file
cat .claude/MACBOOK_AIR_FIRST_RUN_CRITICAL.md
# Or open in your preferred editor

# Follow all 8 steps in the verification checklist
# This will:
# - Verify Dropbox sync fully working
# - Verify all files present
# - Create MacBook Air instance log
# - Test Claude Code integration
# - Test bidirectional sync
```

**✅ Checkpoint:** Complete all steps in MACBOOK_AIR_FIRST_RUN_CRITICAL.md.

### Step 7: Launch Claude Code (2 minutes)

```bash
# Start Claude Code in project directory
claude-code
```

**What should happen:**
1. Claude Code reads `CLAUDE.md` automatically
2. Claude Code sees multi-machine system instructions
3. Claude Code reads `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
4. Claude Code checks for `.claude/INSTANCE_LOG_MacBookAir.md`
5. Claude Code finds instance log (created in Step 6)
6. Claude Code is ready with full context

**Test in Claude Code:**
```
Ask: "Please read .claude/shared-context/WIP_CURRENT_CRITICAL.md and
confirm you can see the current work status from Mac Mini"
```

**✅ Checkpoint:** Claude Code can read shared context from Mac Mini.

---

## What You're Syncing

### Via Dropbox (Automatic):
- All `.claude/` directory files
- `CLAUDE.md` with multi-machine instructions
- `DROPBOX_PATH_GUIDE.md`
- `DROPBOX_SYNC_TEST.md`
- All project source files
- `.git/` directory (syncs git database)

### Via GitHub (Pull Required):
- Latest git commits:
  - `d22207d` - Initial multi-machine system setup
  - `2919183` - Updated context with sync completion
- Version controlled state
- Backup of all tracked files

### Why Both:
- **Dropbox:** Fast (10-30 sec), automatic, includes uncommitted files
- **GitHub:** Version control, history, remote backup, Codespaces access
- **Together:** Best of both worlds

---

## Troubleshooting

### Dropbox Files Not Syncing

**Issue:** `.claude/` directory missing or outdated

**Solution:**
1. Check Dropbox is running: `ps aux | grep -i dropbox`
2. Check Dropbox path: `cat ~/.dropbox/info.json | grep path`
3. Verify correct path: Must be in `Library/CloudStorage/Dropbox` (NOT `~/Dropbox`)
4. Wait 60 seconds and check again
5. Restart Dropbox if needed

### Git Pull Conflicts

**Issue:** Git shows conflicts or errors

**Solution:**
```bash
# Check what's different
git status

# If conflicts exist
git pull --rebase
# Or
git pull --no-rebase

# If you have local uncommitted changes
git stash
git pull
git stash pop
```

### Files Present But Outdated

**Issue:** Files exist but show old timestamps

**Solution:**
- Dropbox may still be syncing
- Wait 30 more seconds
- Check Dropbox menu bar icon for sync status
- Force Dropbox sync by touching a file:
  ```bash
  touch .claude/shared-context/WIP_CURRENT_CRITICAL.md
  ```

### Claude Code Doesn't See System

**Issue:** Claude Code doesn't mention multi-machine system

**Solution:**
1. Verify `CLAUDE.md` exists: `cat CLAUDE.md | head -20`
2. Restart Claude Code
3. Ask Claude directly: "Please read CLAUDE.md"

---

## Expected Timeline

**Total Time:** ~20 minutes for complete sync and verification

| Step | Task | Time |
|------|------|------|
| 1 | Wait for Dropbox sync | 30-60 sec |
| 2 | Navigate to project | 1 min |
| 3 | Verify Dropbox files | 2 min |
| 4 | Git pull latest commits | 1 min |
| 5 | Verify syncs complete | 1 min |
| 6 | Run verification checklist | 15 min |
| 7 | Launch Claude Code | 2 min |
| **Total** | | **~22 min** |

---

## After Sync Complete

### Regular Workflow

**Before starting work on MacBook Air:**
```bash
# 1. Pull latest from GitHub
git pull

# 2. Read current WIP
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md

# 3. Launch Claude Code
claude-code
```

**Before switching back to Mac Mini:**
```bash
# 1. Update WIP with your changes
# Edit .claude/shared-context/WIP_CURRENT_CRITICAL.md

# 2. Update MacBook Air instance log
# Edit .claude/INSTANCE_LOG_MacBookAir.md

# 3. Commit and push if significant changes
git add .claude/
git commit -m "MacBook Air: [description]"
git push

# 4. Wait 30 seconds for Dropbox to sync
```

---

## Summary

**Sync Order:**
1. ✅ Dropbox syncs automatically (files appear)
2. ✅ Git pull gets latest commits
3. ✅ Run verification checklist
4. ✅ Launch Claude Code
5. ✅ Ready to work

**What Gets Synced:**
- Dropbox: All files including `.claude/` system
- GitHub: Version controlled commits (d22207d, 2919183)
- Both: Complete project state with dual redundancy

**Result:**
- MacBook Air has identical state to Mac Mini
- Full context awareness
- Ready for seamless multi-machine work

---

## Quick Commands Reference

```bash
# Navigate to project
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/

# Verify Dropbox sync
ls -lh .claude/

# Pull GitHub updates
git pull

# Read current WIP
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md

# Run verification
cat .claude/MACBOOK_AIR_FIRST_RUN_CRITICAL.md

# Launch Claude Code
claude-code
```

---

**Created:** November 2, 2025 at 8:00 PM PST on Mac Mini
**For:** MacBook Air sync coordination
**Delete After:** Successful first sync and verification (optional - can keep for future machine setups)
