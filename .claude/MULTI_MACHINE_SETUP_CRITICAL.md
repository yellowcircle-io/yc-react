# 🔴 CRITICAL: Multi-Machine Claude Code Setup Guide

**⚠️ USER ACTION REQUIRED:** This document contains essential setup instructions for enabling multi-machine Claude Code access.

**Purpose:** Enable shared context and seamless work across multiple machines
**Created:** November 2, 2025
**For:** MacBook Air, CI/CD Server, and future machines
**Status:** CRITICAL - Required for MacBook Air setup and multi-device access

---

## 🚨 IMMEDIATE ACTIONS NEEDED

1. **Set up MacBook Air** - Follow "Quick Start: MacBook Air Setup" section below
2. **Commit `.claude/` to GitHub** - Enables Codespaces access (see instructions below)
3. **Test machine switching** - Verify Dropbox sync working between machines

---

## Overview

This repository uses a **dual-sync system** for multi-machine access:
1. **Dropbox** - Fast file sync for seamless machine switching (10-30 seconds)
2. **GitHub** - Version control and Codespaces access for mobile devices

**Directory Structure:**
```
yellow-circle/
├── .claude/
│   ├── INSTANCE_LOG_[MACHINE].md     (per-machine logs)
│   ├── MULTI_MACHINE_SETUP_CRITICAL.md        (this file)
│   └── shared-context/
│       ├── README.md                 (usage guide)
│       ├── WIP_CURRENT_CRITICAL.md           (current work status)
│       ├── WIP_[DATE].md            (archived WIP notes)
│       ├── DECISIONS.md             (decision log)
│       └── SESSION_*.md             (session summaries)
├── dev-context/                      (analysis & documentation)
├── src/                              (source code)
└── .git/                             (syncs via Dropbox)
```

---

## Quick Start: MacBook Air Setup

### Prerequisites Check
1. **Verify Dropbox is syncing:**
   ```bash
   cat ~/.dropbox/info.json
   ```
   Should show: `{"personal": {"path": "/Users/christophercooper_1/Library/CloudStorage/Dropbox", ...}}`

2. **Verify this file exists:**
   ```bash
   ls -lh ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/MULTI_MACHINE_SETUP_CRITICAL.md
   ```
   If you can read this file, Dropbox sync is working! ✅

### Step 1: Navigate to Project
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
```

**Important:** Always use the `Library/CloudStorage/Dropbox/` path, NOT `~/Dropbox/`

### Step 2: Verify Git Repository
```bash
git status
git remote -v
```

Expected: Git repository exists with Dropbox sync warnings (safe to ignore for multi-machine setup)

### Step 3: Create Machine Instance Log
```bash
# Create MacBook Air instance log
touch .claude/INSTANCE_LOG_MacBookAir.md
```

Open `.claude/INSTANCE_LOG_MacBookAir.md` in your editor and add:

```markdown
# Claude Code Instance Log - MacBook Air

**Machine:** MacBook Air
**Instance ID:** macbook-air-secondary
**Created:** [Today's Date]
**Last Updated:** [Today's Date]

---

## Instance Information

**Working Directory:**
/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/

**Dropbox Sync Path (Active):**
/Users/christophercooper_1/Library/CloudStorage/Dropbox/

**Git Repository:** Yes (syncing via Dropbox)

**Platform:** macOS

**Machine Role:** Secondary development machine for mobile work and lighter tasks

---

## Session History

### Session 1: Initial Setup
**Date:** [Today's Date]
**Context:** Setting up multi-machine Claude Code access

**Tasks Completed:**
1. Verified Dropbox sync working
2. Navigated to project directory
3. Created instance log file
4. Read shared context documentation

**Next Steps:**
- Start using shared context system
- Read WIP_CURRENT_CRITICAL.md before starting work
- Update WIP_CURRENT_CRITICAL.md before switching machines

---

## Active Configuration

**Auto-approved Operations:**
(Same as Mac Mini - see Mac Mini instance log for full list)

**Claude Code Local Settings:** `~/.claude/settings.local.json`

---

**End of Log**
```

### Step 4: Read Shared Context
```bash
# Read the shared context README
cat .claude/shared-context/README.md

# Read current work status
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md
```

### Step 5: Start Claude Code
```bash
# Launch Claude Code in the project directory
claude-code
```

### Step 6: Verify Setup
In Claude Code, ask it to:
1. Read `.claude/INSTANCE_LOG_MacBookAir.md`
2. Read `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
3. Confirm it can access shared context

---

## Machine Switching Workflow

### Before Switching FROM Any Machine

1. **Complete or pause current task**
   - Reach clean stopping point
   - Don't leave work half-done if possible

2. **Update WIP_CURRENT_CRITICAL.md**
   ```bash
   # Edit .claude/shared-context/WIP_CURRENT_CRITICAL.md
   # Update: timestamp, machine, status, next steps
   ```

3. **Update instance log**
   ```bash
   # Edit .claude/INSTANCE_LOG_[MACHINE].md
   # Add session summary
   ```

4. **Commit git changes (if any)**
   ```bash
   git status
   git add .
   git commit -m "Your commit message"
   git push  # Optional, but recommended
   ```

5. **Wait for Dropbox sync**
   ```bash
   # Wait 10-30 seconds
   # Or check Dropbox menu bar icon for sync completion
   ```

### When Switching TO Any Machine

1. **Wait for Dropbox sync**
   - Ensure Dropbox has synced recent changes
   - Check Dropbox menu bar icon

2. **Read WIP_CURRENT_CRITICAL.md**
   ```bash
   cat .claude/shared-context/WIP_CURRENT_CRITICAL.md
   ```

3. **Check instance log if needed**
   ```bash
   # Read other machine's log for detailed context
   cat .claude/INSTANCE_LOG_MacMini.md
   ```

4. **Pull git changes (if needed)**
   ```bash
   git pull
   ```

5. **Continue work**
   - Follow "Next Steps" from WIP_CURRENT_CRITICAL.md
   - Update WIP when done

---

## Common Scenarios

### Scenario 1: Quick Edit on MacBook Air

**Use Case:** User is away from Mac Mini, needs to make quick change

**Steps:**
1. On MacBook Air: Read `WIP_CURRENT_CRITICAL.md`
2. Make the change using Claude Code
3. Update `WIP_CURRENT_CRITICAL.md` with what was changed
4. Commit and push if significant
5. Wait for sync before using Mac Mini

### Scenario 2: Long Analysis Session on Mac Mini

**Use Case:** Deep work requiring Mac Mini's full setup

**Steps:**
1. On Mac Mini: Read `WIP_CURRENT_CRITICAL.md`
2. Conduct analysis, create documents
3. Create detailed session summary in `SESSION_[DATE]_MacMini.md`
4. Update `WIP_CURRENT_CRITICAL.md` with references to session file
5. Update `DECISIONS.md` with key decisions
6. Update instance log with session summary

### Scenario 3: Mobile Access via Codespaces

**Use Case:** User on iPad/iPhone needs to review or make small edit

**Steps:**
1. Open GitHub Codespaces
2. Navigate to `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
3. Read current context
4. Make changes if needed (small edits only)
5. Document change in `DECISIONS.md`
6. Commit and push
7. Continue on primary machine later

---

## CI/CD Server Setup (Old Mac Mini)

### Purpose
- Automated builds and tests
- Deployment tasks
- Scheduled jobs

### Setup Steps

1. **Install Claude Code**
   ```bash
   # Install Claude Code CLI
   npm install -g @anthropic-ai/claude-code
   ```

2. **Verify Dropbox Sync**
   ```bash
   cat ~/.dropbox/info.json
   cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
   ```

3. **Create Instance Log**
   ```bash
   # Create .claude/INSTANCE_LOG_CI_CD.md
   # Document role as CI/CD server
   ```

4. **Configure Automated Tasks**
   - Set up cron jobs or scheduled tasks
   - Document in instance log
   - Don't use WIP_CURRENT_CRITICAL.md for automated tasks

5. **Manual Intervention Protocol**
   - When manual work needed, follow standard machine switching workflow
   - Create session summaries for manual interventions
   - Update DECISIONS.md for configuration changes

---

## GitHub Integration

### Current Status
- Git repository exists in Dropbox sync path
- `.git/` directory syncs across machines
- GitHub remote configured (to be verified)

### GitHub + Dropbox Sync Pattern

**How It Works:**
1. **Dropbox syncs files** (including `.git/` directory)
2. **Git tracks changes** within those files
3. **GitHub provides** remote backup and Codespaces access

**Best Practices:**
- Don't run git operations simultaneously on multiple machines
- Use `git pull` before starting work on new machine
- Use `git push` after completing work
- Let Dropbox handle file sync, use git for version control

**Conflict Resolution:**
- If git conflict: Use standard git merge tools
- If Dropbox conflict: Dropbox creates conflict file, choose latest or merge manually

---

## Mobile Access (iPad/iPhone)

### Method 1: GitHub Codespaces (Recommended)

**Access:**
1. Open GitHub repository in browser
2. Click "Code" → "Codespaces" → "Create codespace"
3. VS Code opens in browser with full repository access

**Capabilities:**
- Read all files including shared context
- Make small edits
- Run commands in terminal
- Commit and push changes

**Limitations:**
- No Claude Code CLI (browser-based only)
- Best for review and small edits
- Not for long coding sessions

**Shared Context Access:**
```bash
# In Codespaces terminal
cd .claude/shared-context
cat WIP_CURRENT_CRITICAL.md
cat DECISIONS.md
```

### Method 2: GitHub Mobile App (Read-Only)

**Access:**
1. Open GitHub app
2. Navigate to repository
3. Browse files

**Capabilities:**
- Read files
- View diffs
- Comment on commits

**Limitations:**
- Read-only (no editing)
- Good for quick reference

### Method 3: Working Copy App (Advanced)

**Access:**
1. Install Working Copy app (iOS)
2. Clone repository from GitHub
3. Full git client on iOS

**Capabilities:**
- Clone/pull/push repository
- Edit files
- Commit changes
- Merge branches

**Limitations:**
- No Claude Code CLI
- Manual editing only
- Best for git operations

---

## Troubleshooting

### Issue: Files Not Syncing

**Check Dropbox Status:**
```bash
# Verify Dropbox path
cat ~/.dropbox/info.json

# Check if Dropbox is running
ps aux | grep -i dropbox

# Check file location
pwd
# Should be: /Users/christophercooper_1/Library/CloudStorage/Dropbox/...
```

**Solution:**
- Ensure you're in `Library/CloudStorage/Dropbox/` path (NOT `~/Dropbox/`)
- Restart Dropbox if needed
- Wait 30-60 seconds for sync

### Issue: Git Conflicts

**Symptoms:** Git shows conflicts after switching machines

**Solution:**
```bash
# Pull latest changes
git pull

# If conflicts:
git status                    # See conflicted files
# Resolve conflicts manually
git add .
git commit -m "Resolve merge conflicts"
git push
```

### Issue: Outdated WIP_CURRENT_CRITICAL.md

**Symptoms:** WIP file shows old date/machine

**Solution:**
- Wait 30 seconds for Dropbox sync
- Check Dropbox sync status in menu bar
- Verify other machine updated the file
- Check instance log for that machine

### Issue: Can't Access from Codespaces

**Symptoms:** Codespaces can't find repository

**Solution:**
```bash
# On Mac Mini, verify GitHub remote
git remote -v

# If no remote, add it:
git remote add origin https://github.com/[username]/[repo].git
git push -u origin main

# Then create Codespace from GitHub
```

### Issue: Lost Context After Switch

**Symptoms:** Don't know what was being worked on

**Solution:**
```bash
# Read WIP_CURRENT_CRITICAL.md
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md

# Read last machine's instance log
cat .claude/INSTANCE_LOG_MacMini.md

# Read recent session files
ls -lt .claude/shared-context/SESSION_*.md

# Search decision log
cat .claude/shared-context/DECISIONS.md
```

---

## Best Practices Summary

1. ✅ **Always read WIP_CURRENT_CRITICAL.md** before starting work
2. ✅ **Always update WIP_CURRENT_CRITICAL.md** before switching machines
3. ✅ **Wait 30 seconds** for Dropbox sync after updates
4. ✅ **Use instance logs** to track machine-specific history
5. ✅ **Document decisions** in DECISIONS.md
6. ✅ **Commit and push** significant changes to GitHub
7. ✅ **Create session summaries** for complex work
8. ✅ **Check git status** before and after machine switches
9. ✅ **Use correct Dropbox path** (Library/CloudStorage/)
10. ✅ **Keep WIP_CURRENT_CRITICAL.md** focused and concise

---

## Quick Reference

**Project Path:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
```

**Read Current WIP:**
```bash
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md
```

**Update WIP:**
```bash
# Edit .claude/shared-context/WIP_CURRENT_CRITICAL.md
# Update timestamp, machine, status, next steps
```

**Check Sync:**
```bash
cat ~/.dropbox/info.json | grep path
```

**Git Status:**
```bash
git status
git pull
git push
```

---

## Support

**Documentation:**
- `.claude/shared-context/README.md` - Detailed usage guide
- `.claude/INSTANCE_LOG_[MACHINE].md` - Machine-specific logs
- `DROPBOX_PATH_GUIDE.md` - Dropbox configuration
- `CLAUDE.md` - Project-specific Claude Code guidance

**Key Files:**
- `WIP_CURRENT_CRITICAL.md` - Current work status
- `DECISIONS.md` - Decision log
- `INSTANCE_LOG_*.md` - Session history

---

**Setup Guide Created:** November 2, 2025
**Last Updated:** November 2, 2025
**Maintained By:** Mac Mini primary instance
