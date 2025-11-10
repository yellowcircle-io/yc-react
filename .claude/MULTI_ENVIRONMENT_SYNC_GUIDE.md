# Multi-Environment Real-Time Sync Guide

**Last Updated:** November 9, 2025
**Status:** ✅ ACTIVE - All environments syncing to GitHub

---

## 🎯 Overview

This project supports **real-time context sharing** across ALL access points:

| Environment | Sync Method | Sync Time | Auto-Sync |
|------------|-------------|-----------|-----------|
| **Mac Mini** | Dropbox + GitHub | 10-30s (Dropbox) | ✅ Yes |
| **MacBook Air** | Dropbox + GitHub | 10-30s (Dropbox) | ✅ Yes |
| **Google Drive** | Manual copy from Dropbox | Manual | ❌ No |
| **GitHub** | Git push/pull | Instant | ✅ Yes (after commit) |
| **GitHub Codespaces** | Git clone from GitHub | Instant | ✅ Yes (git pull) |
| **iPad/iPhone (SSH/Termius)** | SSH to Mac Mini/Air | Real-time | ✅ Yes |
| **Claude Code Web** | GitHub clone | Instant | ✅ Yes (git pull) |

---

## 📂 What Gets Synced

### ✅ NOW SYNCED TO GITHUB (as of Nov 9, 2025):
- `.claude/` - All multi-machine context files
- `dev-context/` - All roadmaps, research, and project docs
  - **Excluded:** Large perplexity export files (`.md`/`.html` in exports folder)
- `DECISIONS.md` - Decision history
- `CLAUDE.md` - Project instructions for Claude Code
- `ROADMAP_CHECKLIST_NOV8_2025.md` - Current roadmap
- `WIP_CURRENT_CRITICAL.md` - Current work status

### ❌ NOT SYNCED TO GITHUB:
- `node_modules/` - Dependencies
- `dist/` - Build artifacts
- Large media files (`.mp4`, `.mov`, `.gif`, etc.)
- `dev-context/01-research/perplexity-exports/*.md` - Individual exports (too large)

---

## 🔄 Sync Workflows by Environment

### **Mac Mini / MacBook Air (Desktop)**

**Automatic Sync:**
1. **Dropbox** syncs files between machines (10-30 seconds)
2. **Manual Git** push to GitHub for web/mobile access

**Workflow:**
```bash
# After making changes
git status
git add .claude/ dev-context/
git commit -m "Update roadmap: [description]"
git push

# Wait 30 seconds for Dropbox sync before switching machines
```

---

### **GitHub Codespaces**

**Workflow:**
```bash
# At start of session
git pull

# After making changes
git add .claude/ dev-context/
git commit -m "Update from Codespaces: [description]"
git push

# Mac Mini/Air will auto-sync via Dropbox + can git pull
```

**Access:**
- Go to: https://github.com/codespaces
- Open `yellowcircle/yellow-circle` repository
- Changes sync instantly via GitHub

---

### **iPad/iPhone via SSH/Termius**

**Setup:**
1. Install Termius app
2. Connect to Mac Mini or MacBook Air via SSH
3. Navigate to: `cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/`

**Workflow:**
```bash
# Check current status
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md

# View roadmap
cat dev-context/ROADMAP_CHECKLIST_NOV8_2025.md

# Make changes (via vim/nano)
vim .claude/shared-context/WIP_CURRENT_CRITICAL.md

# Commit and push
git add .claude/
git commit -m "Update from iPad/iPhone"
git push
```

**Real-time sync:** Changes are made directly on the Mac, so Dropbox sync is automatic.

---

### **Claude Code Web (Browser)**

**Workflow:**
```bash
# At start of session
git clone https://github.com/[username]/yellow-circle.git
cd yellow-circle
git pull

# After making changes
git add .claude/ dev-context/
git commit -m "Update from Claude Code Web: [description]"
git push
```

**Note:** Web sessions don't persist, so ALL changes must be committed to GitHub.

---

### **Google Drive (Manual Backup)**

**Purpose:** Archival backup only (not for active sync)

**Workflow:**
```bash
# Copy from Dropbox to Google Drive (manual)
cp -r ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/dev-context/ \
      ~/Google\ Drive/yellowcircle-backup/dev-context/
```

**Recommendation:** Use GitHub as primary sync, Google Drive for weekly backups.

---

## 🚀 Real-Time Sync Protocol

### **Before Switching Environments:**

1. ✅ Complete current task in todo list
2. ✅ Update `WIP_CURRENT_CRITICAL.md` with:
   - Current status
   - Next steps
   - Any blockers
3. ✅ Update machine-specific instance log
4. ✅ Commit changes to git:
   ```bash
   git add .claude/ dev-context/
   git commit -m "Session update: [description]"
   git push
   ```
5. ✅ Wait 30 seconds for Dropbox sync (Mac to Mac only)

### **After Switching to New Environment:**

1. ✅ Pull latest changes:
   ```bash
   git pull
   ```
2. ✅ Read `WIP_CURRENT_CRITICAL.md`:
   ```bash
   cat .claude/shared-context/WIP_CURRENT_CRITICAL.md
   ```
3. ✅ Check roadmap status:
   ```bash
   cat dev-context/ROADMAP_CHECKLIST_NOV8_2025.md
   ```
4. ✅ Continue where you left off

---

## 🔍 Sync Verification

### **Check Sync Status:**

```bash
# Check git status
git status

# Check last sync time (Dropbox)
ls -la .claude/shared-context/WIP_CURRENT_CRITICAL.md

# Check GitHub sync
git log --oneline -5

# Verify remote is up to date
git fetch
git status
```

### **Verify All Environments Have Latest:**

```bash
# On each environment, run:
git log -1 --format="%H %s %ai"

# Should show same commit hash across all environments
```

---

## 🛠️ Troubleshooting

### **Dropbox Not Syncing (Mac to Mac)**

```bash
# Check Dropbox status
ls -la ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.dropbox.cache

# Verify path
pwd
# Should show: /Users/[username]/Dropbox/CC Projects/yellowcircle/yellow-circle

# Force sync (quit and restart Dropbox)
```

### **Git Push Rejected**

```bash
# Pull latest first
git pull --rebase

# Resolve conflicts if any
git add .
git rebase --continue

# Push again
git push
```

### **SSH Connection Failed (iPad/iPhone)**

```bash
# Check Mac is on and awake
# Verify SSH is enabled: System Preferences > Sharing > Remote Login
# Check IP address: ifconfig | grep inet

# Test connection
ssh [username]@[mac-ip-address]
```

### **Codespaces Out of Date**

```bash
# Always start with git pull
git pull

# If behind, stash local changes
git stash
git pull
git stash pop
```

---

## 📊 Sync Status Dashboard

**Key Files to Monitor:**
- `.claude/shared-context/WIP_CURRENT_CRITICAL.md` - Current work status
- `dev-context/ROADMAP_CHECKLIST_NOV8_2025.md` - Roadmap progress
- `.claude/INSTANCE_LOG_[MACHINE].md` - Machine-specific logs

**Check These Daily:**
```bash
# Quick status check
git status && \
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md | head -20 && \
git log -1 --oneline
```

---

## ✅ Best Practices

### **Daily Routine:**
1. **Morning:** `git pull` to get latest
2. **During work:** Update `WIP_CURRENT_CRITICAL.md` as you go
3. **Before breaks:** Commit and push changes
4. **End of day:** Final commit with summary

### **Commit Message Format:**
```bash
# Good examples:
git commit -m "Update roadmap: Homepage typography complete"
git commit -m "Add: New 2nd Brain app scoping doc"
git commit -m "Fix: Sync status in WIP_CURRENT"

# Bad examples:
git commit -m "updates"
git commit -m "stuff"
```

### **Multi-Machine Work:**
- ✅ Use `git pull` before starting work on any machine
- ✅ Commit frequently (every 30-60 minutes)
- ✅ Update `WIP_CURRENT_CRITICAL.md` before switching
- ✅ Wait 30 seconds for Dropbox sync between Macs
- ❌ Don't work on same file simultaneously on different machines

---

## 🔐 Access Points Summary

| Access Method | URL/Path | Sync Method |
|--------------|----------|-------------|
| Mac Mini (Local) | `/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/` | Dropbox + Git |
| MacBook Air (Local) | `/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/` | Dropbox + Git |
| GitHub Repository | `https://github.com/[username]/yellow-circle` | Git |
| GitHub Codespaces | `https://github.com/codespaces` | Git Clone |
| iPad/iPhone SSH | `ssh [user]@[mac-ip]` → Dropbox path | Real-time |
| Claude Code Web | Browser → GitHub clone | Git |
| Google Drive Backup | Manual copy from Dropbox | Manual |

---

## 📝 Quick Reference Commands

```bash
# === SYNC STATUS ===
git status                          # Check uncommitted changes
git log --oneline -5                # Recent commits
git fetch && git status             # Check if behind remote

# === UPDATE FROM REMOTE ===
git pull                            # Get latest changes

# === PUSH TO REMOTE ===
git add .claude/ dev-context/       # Stage context files
git commit -m "Update: [description]"  # Commit with message
git push                            # Push to GitHub

# === VIEW CURRENT STATUS ===
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md
cat dev-context/ROADMAP_CHECKLIST_NOV8_2025.md

# === VERIFY SYNC ===
ls -la .claude/shared-context/      # Check file timestamps
git remote -v                       # Verify remote URL
git log -1 --format="%H %s %ai"     # Last commit details
```

---

## 🎯 Success Criteria

After following this guide, you should be able to:

- ✅ Start work on Mac Mini, switch to MacBook Air seamlessly
- ✅ Update roadmap from iPad/iPhone via SSH
- ✅ Use GitHub Codespaces for quick edits
- ✅ Access latest context from Claude Code Web
- ✅ Have all environments show same commit hash
- ✅ Never lose work when switching machines

---

**Questions or Issues?**
- Check troubleshooting section above
- Verify git status: `git status`
- Check sync times: `ls -la .claude/shared-context/`
- Review instance logs: `.claude/INSTANCE_LOG_[MACHINE].md`

---

**Last Verified:** November 9, 2025
**Next Review:** December 1, 2025
**Version:** 2.0 (GitHub sync enabled)
