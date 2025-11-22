# Concurrent Multi-Machine Usage Guide

**Created:** November 22, 2025
**Status:** ✅ ACTIVE - Supports concurrent work across Mac Mini, MacBook Air, and Claude Code
**Purpose:** Enable safe concurrent work with minimal merge conflicts

---

## 🎯 Overview

The yellowCircle multi-machine framework now supports **concurrent usage** across multiple machines with slight time delays:

- **Mac Mini** (Primary development)
- **MacBook Air** (Mobile work)
- **Claude Code Web/Codespaces** (Remote sessions)
- **iPhone/iPad SSH** (Quick updates via mobile)

### How Concurrent Usage Works

**Three-Tier Sync System:**
1. **Dropbox** - Real-time sync (10-30s) between Mac Mini ↔ MacBook Air
2. **GitHub** - Version control + merge conflict resolution
3. **Firebase** - Auto-deployment for website changes

**Timeline:** Changes propagate within 30 seconds to 2 minutes across all systems.

---

## ✅ Supported Concurrent Patterns

### Pattern 1: Sequential Work with Delays
**Scenario:** Work on Mac Mini, then switch to MacBook Air within minutes

**Workflow:**
1. **Mac Mini:** Make changes, save → Dropbox syncs (30s)
2. **Wait 30 seconds** for Dropbox sync
3. **MacBook Air:** Files already synced, continue work
4. **Git push:** Either machine can push when done

**Result:** ✅ No conflicts (Dropbox handles sync automatically)

---

### Pattern 2: Parallel Work on Different Files
**Scenario:** Mac Mini editing page-manager.js while MacBook Air updates WIP docs

**Workflow:**
1. **Mac Mini:** Edit `.claude/automation/page-manager.js`
2. **MacBook Air:** Edit `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
3. **Both:** Dropbox syncs both changes independently
4. **Git:** Commits merge cleanly (different files)

**Result:** ✅ No conflicts (different files modified)

---

### Pattern 3: Parallel Work on Same File ⚠️
**Scenario:** Both machines editing WIP_CURRENT_CRITICAL.md simultaneously

**Workflow:**
1. **Mac Mini:** Edit WIP file (12:00 AM)
2. **MacBook Air:** Also edit WIP file (12:01 AM - 1 min delay)
3. **Dropbox Conflict:** Creates duplicate file `WIP_CURRENT_CRITICAL (conflicted copy).md`
4. **Git Merge:** When both push, Git detects conflict

**Result:** ⚠️ Merge conflict (requires manual resolution)

**How to Resolve:**
```bash
# On whichever machine you're on
git fetch origin
git status  # See conflict
git merge origin/main  # Or git pull

# Manually resolve in WIP_CURRENT_CRITICAL.md
# Remove <<<<<<< HEAD, =======, >>>>>>> markers
# Keep both changes in chronological order

git add .claude/shared-context/WIP_CURRENT_CRITICAL.md
git commit -m "Merge: Resolve concurrent WIP updates"
git push
```

**Prevention:** Check WIP file before editing:
```bash
# Quick check before editing WIP
git pull  # Get latest from GitHub
# OR
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md  # Read current state
```

---

### Pattern 4: Async Branch Work (Recommended for Long Sessions)
**Scenario:** Long Claude Code session on MacBook Air while Mac Mini work continues

**Workflow:**
1. **MacBook Air:** Create branch for session
   ```bash
   git checkout -b claude/session-nov22
   ```

2. **MacBook Air:** Work on branch, commit regularly
   ```bash
   git add -A
   git commit -m "Update: Add feature X"
   git push origin claude/session-nov22
   ```

3. **Mac Mini:** Continue work on main branch
   ```bash
   # Work normally on main
   git add -A
   git commit -m "Update: Add feature Y"
   git push
   ```

4. **Merge Later:** When MacBook session done, merge branch
   ```bash
   git checkout main
   git pull
   git merge claude/session-nov22
   # Resolve any conflicts
   git push
   ```

**Result:** ✅ Clean separation, controlled merge timing

**What We Did Today:** Merged `claude/continue-critical-wip` branch from async MacBook Air session into Mac Mini main branch.

---

## 🔄 Best Practices for Concurrent Work

### 1. Communication via WIP File

**Always check before starting:**
```bash
# Read WIP to see what's happening on other machines
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md
```

**Update WIP when starting work:**
```markdown
**Updated:** November 22, 2025 at 12:30 AM PST
**Machine:** Mac Mini (Primary)
**Status:** ✅ Working on Phase 2 page management
```

**Other machines see this and know:**
- What's being worked on
- Which machine is active
- When to avoid conflicts

### 2. File-Level Work Division

**Safe Concurrent Work:**
- ✅ Mac Mini: `.claude/automation/` scripts
- ✅ MacBook Air: `dev-context/` docs
- ✅ Claude Web: New feature files

**Conflict-Prone Work:**
- ⚠️ Both editing WIP_CURRENT_CRITICAL.md
- ⚠️ Both editing same source file
- ⚠️ Both modifying same React component

**Strategy:** Coordinate via WIP file who edits what.

### 3. Frequent Git Pulls

**Before starting work on any machine:**
```bash
# Get latest changes
git pull

# Check what changed
git log -5 --oneline
```

**Frequency:**
- Mac Mini → MacBook Air switch: Pull before starting
- Long gap (>1 hour): Pull before editing
- After seeing git push notification: Pull immediately

### 4. Dropbox Sync Awareness

**Dropbox syncs automatically, but:**
- Wait 30 seconds after saving before switching machines
- Check Dropbox status icon (✓ = synced)
- If "syncing" icon, wait before switching

**Verify Dropbox sync:**
```bash
# On Mac, check if folder is synced
ls -la ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/

# File timestamps should match across machines
```

### 5. Merge Conflict Prevention

**Before editing critical files (WIP, ROADMAP, etc.):**
1. Run `git pull` to get latest
2. Check WIP to see if another session is active
3. If conflict likely, use branch workflow

**When conflicts happen:**
1. Don't panic - Git preserves both versions
2. Read conflict markers carefully
3. Keep both changes in chronological order
4. Test after merge (especially for code)

---

## 📋 Concurrent Usage Checklist

**Starting Work on Machine A:**
- [ ] `git pull` to get latest changes
- [ ] Read `WIP_CURRENT_CRITICAL.md` to see other machine status
- [ ] Update WIP with current machine and task
- [ ] Save and wait 30s for Dropbox sync
- [ ] Begin work

**Switching to Machine B:**
- [ ] Wait 30 seconds after last save on Machine A
- [ ] On Machine B: `git pull` to verify sync
- [ ] Read WIP to understand current state
- [ ] Continue work or start new task

**Ending Session:**
- [ ] Save all files
- [ ] Update WIP with completion status
- [ ] `git add -A && git commit -m "Update: [description]"`
- [ ] `git push` to sync to GitHub
- [ ] Wait 30s for Dropbox to sync commit

---

## 🛠️ Troubleshooting Concurrent Issues

### Issue: "Your branch is behind origin/main"

**Cause:** Another machine pushed changes

**Fix:**
```bash
git pull  # Get remote changes
# If no conflicts:
# Continue work

# If conflicts:
# Resolve manually, then:
git add .
git commit -m "Merge: Resolve conflicts"
git push
```

---

### Issue: Dropbox Conflict File Created

**Cause:** Same file edited on both machines simultaneously

**Example:**
```
WIP_CURRENT_CRITICAL.md
WIP_CURRENT_CRITICAL (Mac Mini's conflicted copy).md
WIP_CURRENT_CRITICAL (MacBook Air's conflicted copy).md
```

**Fix:**
1. Open all three files
2. Manually merge content (keep both changes chronologically)
3. Delete conflict files
4. Save merged version
5. Commit: `git add . && git commit -m "Resolve: Dropbox conflict"`

---

### Issue: Git Push Rejected (Non-Fast-Forward)

**Cause:** Remote has commits you don't have locally

**Fix:**
```bash
git pull --rebase  # Rebase your changes on top of remote

# If conflicts:
git status  # See which files
# Edit files, remove conflict markers
git add .
git rebase --continue

# When done:
git push
```

---

## 📊 Sync Timing Reference

| Action | Sync Time | Safe to Switch |
|--------|-----------|----------------|
| Save file | 10-30s (Dropbox) | Wait 30s |
| Git push | Immediate (GitHub) | Immediately |
| Firebase deploy | 60s (GitHub → Firebase) | After build complete |
| Claude Code branch | N/A | Use git merge |

**Rule of Thumb:** Wait 30 seconds after save, then switch machines safely.

---

## ✅ What Works Well Concurrently

- **Mac Mini:** Development work (page-manager.js, React components)
- **MacBook Air:** Documentation (guides, specs, README files)
- **Claude Web:** Research and planning (new features, architecture docs)
- **iPhone SSH:** Quick content updates (WIP status, quick commits)

**Division of Labor:** Each machine type handles different file types = minimal conflicts.

---

## 🎯 Example: Today's Merge (Nov 22, 2025)

**What Happened:**
1. MacBook Air/Codespaces created `claude/continue-critical-wip` branch
2. Added iPhone testing docs (test-all-commands.sh, IPHONE_SHORTCUT_SETUP_GUIDE.md)
3. Updated WIP_CURRENT_CRITICAL.md (Nov 20 entry)
4. Meanwhile, Mac Mini worked on Phase 1 Page Management
5. Also updated WIP_CURRENT_CRITICAL.md (Nov 22 entry)

**Merge Process:**
1. Fetched remote branch: `git fetch origin`
2. Attempted merge: `git merge origin/claude/continue-critical-wip`
3. Conflict detected: WIP_CURRENT_CRITICAL.md
4. Manually resolved: Kept BOTH sessions' updates chronologically
5. Committed merge: `git commit -m "Merge: Integrate async sessions"`
6. Pushed: `git push`

**Result:** ✅ Both sessions' work preserved, no data loss

---

**Status:** Framework supports concurrent usage with proper workflows
**Recommendation:** Use branch workflow for long async sessions, pull frequently for quick switches
**Last Updated:** November 22, 2025
