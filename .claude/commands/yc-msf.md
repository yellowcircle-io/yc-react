# /yc-msf - yellowCircle MultiSystem Framework Hub

**Purpose:** Central command for managing the yellowCircle MultiSystem Framework (yC-MSF) - the unified system for Dropbox sync, GitHub version control, Notion integration, Firebase deployment, WIP tracking, roadmaps, and automation.

**Alternative Names:** Previously called MMF (Multi-Machine Framework)

---

## What is yC-MSF?

The **yellowCircle MultiSystem Framework** is the complete infrastructure system that enables:

1. **Multi-Machine Sync** - Seamless work across Mac Mini, MacBook Air, Codespaces, iPad
2. **Version Control** - Git/GitHub for code, history, and remote access
3. **Cloud Sync** - Dropbox (primary), Google Drive (backup) for real-time file sharing
4. **Deployment** - Firebase Hosting for yellowCircle.io and related apps
5. **Project Management** - Notion integration for task tracking
6. **Automation** - Scheduled scripts, alerts, and summaries
7. **Documentation** - WIP, roadmaps, instance logs, restore points

---

## When This Command is Invoked

Present an overview of all yC-MSF subsystems and provide quick access to each.

---

## Instructions

### Step 0: Verify Sync Status (ALWAYS FIRST)

```bash
./.claude/verify-sync.sh
```

Check output for:
- ✅ All green = proceed
- ⚠️ Behind remote = run `git pull` first
- ❌ Errors = fix before continuing

### Step 1: Present yC-MSF Dashboard

```markdown
# 🔵 yellowCircle MultiSystem Framework (yC-MSF)

**Status:** [From verify-sync.sh output]
**Machine:** [Current machine]
**Last WIP Update:** [From WIP file timestamp]
**Framework Version:** 2.2

---

## 📊 Subsystem Status

### 1. 🔄 Sync Layer
- **Dropbox:** [Active/Inactive] - Mac-to-Mac real-time sync
- **GitHub:** [Synced/Behind/Ahead] - Version control + remote access
- **Google Drive:** [Active] - Backup + Rho projects

### 2. 🚀 Deployment
- **Firebase:** yellowcircle.io [Status]
- **Last Deploy:** [Date/commit]
- **Preview Channels:** [If any active]

### 3. 📋 Project Management
- **Notion:** [Connected/Disconnected]
- **Tasks Synced:** [Count from last sync]
- **Database:** https://notion.so/2b015c1b110d808d9c55d3b1c4908730

### 4. 🤖 Automation
- **Daily WIP Sync:** [Enabled/Disabled]
- **Deadline Alerts:** [Last run]
- **Weekly Summary:** [Last generated]

### 5. 📝 Documentation
- **WIP File:** [Updated/Stale]
- **Roadmap:** [Current phase]
- **Instance Logs:** [Last updated]

---

## What would you like to do?

### Quick Actions
1. **Sync Status** - Run verify-sync.sh and show detailed status
2. **Update WIP** - Edit WIP_CURRENT_CRITICAL.md
3. **Check Roadmap** - View PROJECT_ROADMAP and checklist

### Subsystem Commands
4. **Automation** - Run `/automation` for workflow scripts
5. **Deploy** - Firebase deployment options
6. **Notion Sync** - Sync roadmap to Notion database

### Documentation
7. **Framework Docs** - View TABLE_OF_CONTENTS.md
8. **Instance Log** - Update current machine's log
9. **Create Restore Point** - Snapshot current state

### Maintenance
10. **Disk Cleanup** - Run maintenance scripts (Mac Mini)
11. **Git Operations** - Commit, push, pull, status

Choose an option (1-11) or describe what you need.
```

### Step 2: Execute Based on User Choice

#### Option 1: Sync Status
```bash
./.claude/verify-sync.sh
```
Show complete output with explanations.

#### Option 2: Update WIP
1. Read `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
2. Ask user what to update
3. Edit file with changes
4. Show diff and confirm

#### Option 3: Check Roadmap
1. Read `dev-context/PROJECT_ROADMAP_NOV2025.md`
2. Read `dev-context/ROADMAP_CHECKLIST_NOV8_2025.md`
3. Present summary and current priorities

#### Option 4: Automation
Execute `/automation` command (see automation.md)

#### Option 5: Deploy
Show deployment options:
```bash
# Build and deploy
npm run build && firebase deploy --only hosting

# Deploy to preview channel
firebase hosting:channel:deploy preview-[name]

# List active channels
firebase hosting:channel:list
```

#### Option 6: Notion Sync
```bash
cd .claude/automation && npm run sync
```

#### Option 7: Framework Docs
Read and display `.claude/TABLE_OF_CONTENTS.md`

#### Option 8: Instance Log
1. Identify current machine (Mac Mini or MacBook Air)
2. Read `.claude/INSTANCE_LOG_[Machine].md`
3. Add new session entry
4. Save updates

#### Option 9: Create Restore Point
1. Create new file: `.claude/RESTORE_POINT_[DATE].md`
2. Copy current WIP state
3. Document strategic decisions
4. Add context for future sessions

#### Option 10: Disk Cleanup (Mac Mini only)
```bash
# Preview what will be cleaned
./.claude/maintenance/cleanup_preview.sh

# Interactive cleanup
./.claude/maintenance/cleanup_disk_space.sh
```

#### Option 11: Git Operations
Present git workflow options:
```bash
# Check status
git status

# Stage and commit
git add .claude/ dev-context/
git commit -m "Update: [description]"

# Push to sync
git push

# Pull latest
git pull
```

### Step 3: Always Finish By

After any yC-MSF operations:
1. **Update WIP** if work status changed
2. **Update Instance Log** if significant session
3. **Commit to GitHub**:
   ```bash
   git add .claude/ dev-context/
   git commit -m "yC-MSF: [brief description]"
   git push
   ```
4. **Run verify-sync.sh** to confirm sync

---

## yC-MSF Component Reference

### Core Files
| File | Purpose | Update Frequency |
|------|---------|------------------|
| `.claude/verify-sync.sh` | Sync verification | Run every session |
| `.claude/shared-context/WIP_CURRENT_CRITICAL.md` | Current work status | Before/after machine switch |
| `dev-context/PROJECT_ROADMAP_NOV2025.md` | Long-term roadmap | Weekly |
| `dev-context/ROADMAP_CHECKLIST_NOV8_2025.md` | Task checklist | As tasks complete |

### Configuration Files
| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project instructions for Claude Code |
| `.claude/TABLE_OF_CONTENTS.md` | Framework documentation index |
| `.claude/automation/.env` | Notion API credentials |
| `firebase.json` | Firebase hosting config |

### Instance-Specific
| File | Machine |
|------|---------|
| `.claude/INSTANCE_LOG_MacMini.md` | Mac Mini sessions |
| `.claude/INSTANCE_LOG_MacBookAir.md` | MacBook Air sessions |

### Automation Scripts
| Script | Purpose | Schedule |
|--------|---------|----------|
| `sync-roadmap-to-notion.js` | Sync tasks to Notion | Manual/Daily |
| `daily-wip-sync.js` | Update task statuses | 8 AM PST |
| `deadline-alerts.js` | Upcoming deadline alerts | 8 AM PST |
| `blocked-tasks-alert.js` | Blocked task alerts | 10 AM PST |
| `weekly-summary.js` | Weekly progress summary | Friday 5 PM PST |

---

## Sync Hierarchy (Priority Order)

### 1️⃣ PRIMARY: Dropbox
- **Speed:** 10-30 seconds automatic
- **Best for:** Mac-to-Mac work
- **Path:** `~/Library/CloudStorage/Dropbox/`

### 2️⃣ SECONDARY: Google Drive
- **Speed:** Automatic background
- **Best for:** Backup + Rho projects

### 3️⃣ TERTIARY: GitHub
- **Speed:** Manual push/pull
- **Best for:** Remote access, version control
- **Required for:** Codespaces, Web, iPad

---

## Related Commands

| Command | Purpose | Aliases |
|---------|---------|---------|
| `/yc-msf` | This command - Framework hub | (primary) |
| `/roadmap` | Roadmap management | `/trimurti`, `/yc-roadmap` |
| `/automation` | Run automation scripts | `/auto`, `/sync` |
| `/projects` | Multi-project management | `/unity`, `/personal` |
| `/rho` | Rho project management | - |

---

## Troubleshooting

### Sync Issues
1. Run `./verify-sync.sh` first
2. Check Dropbox is at correct path (`~/Library/CloudStorage/Dropbox/`)
3. Check GitHub status with `git status`
4. Resolve conflicts before continuing

### Automation Issues
1. Check `.claude/automation/.env` has valid Notion API key
2. Verify database is shared with Notion integration
3. Run `npm install` in `.claude/automation/` if node_modules missing

### Deployment Issues
1. Run `firebase login --reauth` if auth expired
2. Check `firebase projects:list` shows correct project
3. Verify build succeeds with `npm run build`

---

## Example Usage

```bash
/yc-msf                    # Show yC-MSF dashboard
/yc-msf sync               # Check sync status
/yc-msf wip                # Update WIP file
/yc-msf deploy             # Deploy to Firebase
/yc-msf notion             # Sync to Notion
/yc-msf docs               # View framework documentation
/yc-msf restore            # Create restore point
/yc-msf cleanup            # Run disk maintenance
```

---

**Created:** December 7, 2025
**Version:** 1.0
**Purpose:** Central hub for yellowCircle MultiSystem Framework management
**Replaces/Extends:** Previous "MMF" terminology
