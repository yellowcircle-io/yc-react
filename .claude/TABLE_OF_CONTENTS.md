# Multi-Machine Framework - Table of Contents

**Last Updated:** November 21, 2025
**Framework Version:** 2.1
**Purpose:** Central directory of all framework documentation and tools

---

## 📚 Quick Navigation

### 🔴 Critical Files (Read First)
1. [CLAUDE.md](../CLAUDE.md) - Project instructions for Claude Code
2. [WIP_CURRENT_CRITICAL.md](shared-context/WIP_CURRENT_CRITICAL.md) - Current work status
3. [verify-sync.sh](verify-sync.sh) - Sync verification tool (run first every session)

### 🎯 Getting Started
- **New Machine Setup:** [MULTI_MACHINE_SETUP_CRITICAL.md](#setup-guides)
- **MacBook Air First Run:** [MACBOOK_AIR_FIRST_RUN_NOV2_2025_CRITICAL.md](#setup-guides)
- **Sync Guide:** [MULTI_ENVIRONMENT_SYNC_GUIDE.md](#sync-coordination)

---

## 📂 Framework Structure

```
.claude/
├── TABLE_OF_CONTENTS.md          # This file
├── README.md                      # Framework overview
├── verify-sync.sh                 # Sync verification tool
├── CLAUDE.md → ../CLAUDE.md       # Symbolic link to project instructions
│
├── shared-context/                # Cross-machine coordination
│   ├── WIP_CURRENT_CRITICAL.md    # Current work status
│   ├── DECISIONS.md               # Decision log
│   └── README.md                  # Context usage guide
│
├── maintenance/                   # Disk cleanup & maintenance
│   ├── cleanup_disk_space.sh      # Interactive cleanup
│   ├── cleanup_preview.sh         # Dry-run preview
│   ├── CLEANUP_README.md          # Full documentation
│   └── QUICKSTART_CLEANUP.txt     # Quick reference
│
├── automation/                    # Automation scripts
│   ├── shortcut-router.js         # Command dispatcher
│   ├── content-update.js          # Content update system
│   ├── sync-roadmap-to-notion.js  # Notion sync (future)
│   └── README.md                  # Automation guide
│
├── shortcuts/                     # Apple Shortcuts & mobile
│   ├── SSH_SCRIPTS_REFERENCE.md   # SSH command formats
│   └── CONTENT_EXPANSION_GUIDE.md # How to add pages
│
└── commands/                      # Slash commands
    ├── roadmap.md                 # /roadmap command
    └── README.md                  # Command documentation
```

---

## 📖 Documentation Index

### 🚀 Setup Guides

#### Initial Setup
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [MULTI_MACHINE_SETUP_CRITICAL.md](MULTI_MACHINE_SETUP_CRITICAL.md) | New machine setup instructions | Setting up any new machine | 🔴 Critical |
| [MACBOOK_AIR_FIRST_RUN_NOV2_2025_CRITICAL.md](MACBOOK_AIR_FIRST_RUN_NOV2_2025_CRITICAL.md) | MacBook Air verification | First time on MacBook Air | 🔴 Critical |
| [MACBOOK_AIR_SYNC_INSTRUCTIONS.md](MACBOOK_AIR_SYNC_INSTRUCTIONS.md) | MacBook Air sync setup | MacBook Air sync coordination | 🔴 Critical |

#### Platform-Specific Setup
| Document | Purpose | Platform | Priority |
|----------|---------|----------|----------|
| [CODESPACES_MOBILE_ACCESS_CRITICAL.md](CODESPACES_MOBILE_ACCESS_CRITICAL.md) | Mobile/Codespaces access | iPad, iPhone, Web | 🟡 Optional |
| [SSH_KEYCHAIN_AUTO_UNLOCK.md](SSH_KEYCHAIN_AUTO_UNLOCK.md) | SSH key automation | Mac (SSH access) | 🟡 Optional |
| [TERMIUS_KEYCHAIN_FIX.md](TERMIUS_KEYCHAIN_FIX.md) | Termius SSH client setup | iPad/iPhone | 🟡 Optional |

---

### 🔄 Sync & Coordination

#### Core Sync Documentation
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [MULTI_ENVIRONMENT_SYNC_GUIDE.md](MULTI_ENVIRONMENT_SYNC_GUIDE.md) | Complete sync guide (all platforms) | Reference for any sync questions | 🔴 Critical |
| [verify-sync.sh](verify-sync.sh) | Automated sync verification | **Every session startup** | 🔴 Critical |
| [SYNC_EXPLAINED.md](SYNC_EXPLAINED.md) | How sync hierarchy works | Understanding sync priority | 🟢 Reference |

#### Sync Troubleshooting
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [DROPBOX_PATH_CLEANUP_AUDIT.md](DROPBOX_PATH_CLEANUP_AUDIT.md) | Dropbox path issues | Mac Mini Dropbox problems | 🟡 Troubleshooting |
| [MAC_MINI_SLASH_COMMANDS_FIX.md](MAC_MINI_SLASH_COMMANDS_FIX.md) | Slash command sync fix | Commands not updating | 🟡 Troubleshooting |
| [GOOGLE_DRIVE_SYNC_GUIDE.md](GOOGLE_DRIVE_SYNC_GUIDE.md) | Google Drive backup setup | Setting up backup sync | 🟢 Reference |

---

### 🖥️ Instance Logs

#### Machine-Specific Logs
| Document | Machine | Purpose | Update Frequency |
|----------|---------|---------|------------------|
| [INSTANCE_LOG_MacMini.md](INSTANCE_LOG_MacMini.md) | Mac Mini | Primary development machine log | After each session |
| [INSTANCE_LOG_MacBookAir.md](INSTANCE_LOG_MacBookAir.md) | MacBook Air | Secondary machine log | After each session |

**Log Template:** Each log contains:
- Machine information & paths
- Session history with timestamps
- Files created by instance
- Active projects status
- Machine-specific notes
- Troubleshooting section

---

### 🔧 Maintenance & Operations

#### Disk Maintenance (Mac Mini Only)
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [MAC_MINI_DISK_MAINTENANCE.md](MAC_MINI_DISK_MAINTENANCE.md) | Maintenance system guide | Monthly cleanup schedule | 🔴 Critical |
| [maintenance/CLEANUP_README.md](maintenance/CLEANUP_README.md) | Full cleanup documentation | Reference for cleanup tasks | 🟢 Reference |
| [maintenance/QUICKSTART_CLEANUP.txt](maintenance/QUICKSTART_CLEANUP.txt) | Quick cleanup commands | Fast cleanup reference | 🟢 Reference |

**Maintenance Scripts:**
- `maintenance/cleanup_disk_space.sh` - Interactive cleanup (run monthly)
- `maintenance/cleanup_preview.sh` - Dry-run preview (run first)

**Maintenance Schedule:**
- **Monthly** (1st of month): Browser, npm, updater caches (~10-15 GB)
- **Quarterly**: Full cleanup including Adobe (~15-25 GB)
- **As needed**: Desktop installers after app installs

---

### ⚙️ Automation & Commands

#### Automation System
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [automation/README.md](automation/README.md) | Automation architecture | Setting up automation | 🟡 Optional |
| [AUTOMATION_DEPLOYMENT_COMPLETE.md](AUTOMATION_DEPLOYMENT_COMPLETE.md) | Deployment summary | Understanding automation | 🟢 Reference |

**Automation Scripts:**
- `automation/shortcut-router.js` - Command dispatcher
- `automation/content-update.js` - Content update system
- `automation/sync-roadmap-to-notion.js` - Notion sync (planned)

#### Mobile & Shortcuts
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [MOBILE_COMMAND_SYSTEM.md](MOBILE_COMMAND_SYSTEM.md) | Mobile editing via shortcuts | iPhone/Mac shortcuts | 🟡 Optional |
| [shortcuts/SSH_SCRIPTS_REFERENCE.md](shortcuts/SSH_SCRIPTS_REFERENCE.md) | SSH command formats | Creating new shortcuts | 🟢 Reference |
| [shortcuts/CONTENT_EXPANSION_GUIDE.md](shortcuts/CONTENT_EXPANSION_GUIDE.md) | Adding pages/sections | Expanding content system | 🟢 Reference |

#### Slash Commands
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [commands/README.md](commands/README.md) | Command documentation | Creating custom commands | 🟢 Reference |
| [commands/roadmap.md](commands/roadmap.md) | `/roadmap` command | Managing roadmap | 🔴 Critical |

**Available Commands:**
- `/roadmap` - Main roadmap management
- `/trimurti`, `/trimurti-roadmap`, `/yc-roadmap` - Aliases to `/roadmap`

---

### 📱 Remote Access

#### SSH & Remote Connections
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [SSH_REMOTE_ACCESS_FINAL.md](SSH_REMOTE_ACCESS_FINAL.md) | SSH access setup | Setting up remote access | 🟡 Optional |
| [SSH_SHORTCUTS_AND_ACCESS.md](SSH_SHORTCUTS_AND_ACCESS.md) | SSH shortcuts guide | Quick SSH connections | 🟡 Optional |
| [SSH_TERMIUS_ACCESS_GUIDE.md](SSH_TERMIUS_ACCESS_GUIDE.md) | Termius client setup | iPad/iPhone SSH | 🟡 Optional |

#### Network & Connectivity
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [TEAMVIEWER_SETUP.md](TEAMVIEWER_SETUP.md) | TeamViewer configuration | Remote desktop access | 🟡 Optional |
| [TERMIUS_TROUBLESHOOTING.md](TERMIUS_TROUBLESHOOTING.md) | Termius issues | SSH connection problems | 🟡 Troubleshooting |

---

### 📝 Project Context

#### Shared Context Files
| Document | Purpose | Update Frequency | Priority |
|----------|---------|------------------|----------|
| [shared-context/WIP_CURRENT_CRITICAL.md](shared-context/WIP_CURRENT_CRITICAL.md) | Current work status | Before/after machine switch | 🔴 Critical |
| [shared-context/DECISIONS.md](shared-context/DECISIONS.md) | Decision log | After major decisions | 🟢 Reference |
| [shared-context/README.md](shared-context/README.md) | Context usage guide | Reference | 🟢 Reference |

#### Historical Records
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [RESTORE_POINT_NOV18_2025.md](RESTORE_POINT_NOV18_2025.md) | Nov 18 restore point | Returning to Nov 18 state | 🟢 Archive |
| [EMAIL_COMMAND_EXAMPLES.md](EMAIL_COMMAND_EXAMPLES.md) | Email command examples | Reference for automation | 🟢 Archive |

---

### 🎨 Design & Development

#### Design Documentation
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [DESIGN_INSPIRATION.md](DESIGN_INSPIRATION.md) | Design references | Visual design work | 🟢 Reference |
| [SIDEBAR_BEST_PRACTICES.md](SIDEBAR_BEST_PRACTICES.md) | Sidebar design patterns | Building sidebars | 🟢 Reference |
| [SIDEBAR_NAV_ANALYSIS.md](SIDEBAR_NAV_ANALYSIS.md) | Navigation analysis | Navigation design | 🟢 Reference |

---

## 🗂️ File Categories by Purpose

### 🔴 Critical Files (Must Read)
1. **CLAUDE.md** - Project instructions
2. **WIP_CURRENT_CRITICAL.md** - Current work status
3. **verify-sync.sh** - Sync verification (run first every session)
4. **MULTI_MACHINE_SETUP_CRITICAL.md** - New machine setup
5. **MULTI_ENVIRONMENT_SYNC_GUIDE.md** - Sync coordination
6. **MAC_MINI_DISK_MAINTENANCE.md** - Maintenance system
7. **INSTANCE_LOG_MacMini.md** / **INSTANCE_LOG_MacBookAir.md** - Machine logs

### 🟡 Optional Setup Files
- Codespaces/mobile access guides
- SSH setup and automation
- Remote access (TeamViewer, Termius)
- Automation system setup

### 🟢 Reference Documentation
- Design inspiration and best practices
- Historical restore points
- Automation examples
- Sync explanations

### 🔧 Executable Scripts
- **verify-sync.sh** - Sync verification
- **maintenance/cleanup_disk_space.sh** - Interactive cleanup
- **maintenance/cleanup_preview.sh** - Dry-run preview
- **automation/shortcut-router.js** - Command dispatcher
- **automation/content-update.js** - Content updates

---

## 📋 Quick Reference by Use Case

### "I'm starting a new session"
1. Run: `./claude/verify-sync.sh`
2. Read: `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
3. Check: Machine-specific instance log
4. Continue work from last session

### "I'm setting up a new machine"
1. Read: `.claude/MULTI_MACHINE_SETUP_CRITICAL.md`
2. Run: `./claude/verify-sync.sh`
3. Create: Machine-specific instance log
4. Test: Sync verification

### "I'm switching machines"
1. Update: `WIP_CURRENT_CRITICAL.md` with current status
2. Update: Machine instance log
3. Commit: Git changes
4. Wait: 30 seconds for Dropbox sync
5. Switch: To new machine
6. Verify: `./claude/verify-sync.sh`

### "I need to clean up disk space" (Mac Mini only)
1. Read: `.claude/MAC_MINI_DISK_MAINTENANCE.md`
2. Preview: `./claude/maintenance/cleanup_preview.sh`
3. Run: `./claude/maintenance/cleanup_disk_space.sh`
4. Update: Instance log with cleanup results

### "I want to use mobile/iPad"
1. Read: `.claude/CODESPACES_MOBILE_ACCESS_CRITICAL.md`
2. Setup: SSH access or GitHub Codespaces
3. Test: Remote connection
4. Use: Mobile command system (optional)

### "Something isn't syncing"
1. Run: `./claude/verify-sync.sh`
2. Check: Error messages
3. Refer: Sync troubleshooting docs
4. Fix: Based on platform (Dropbox/GitHub)

---

## 🔄 Sync Hierarchy (Order of Priority)

### 1️⃣ PRIMARY: Dropbox (Mac Mini ↔ MacBook Air)
- **Speed:** 10-30 seconds automatic
- **Usage:** Save files, wait 30s, switch machines
- **Path:** `~/Library/CloudStorage/Dropbox/`
- **Best for:** Mac-to-Mac work

### 2️⃣ SECONDARY: Google Drive (Backup)
- **Speed:** Automatic background sync
- **Usage:** Backup repository + Rho projects
- **Best for:** Additional redundancy

### 3️⃣ TERTIARY: GitHub (Version Control)
- **Speed:** Manual push/pull
- **Usage:** `git push` after significant work
- **Best for:** Remote access (Codespaces/Web/iPad)

**For Mac-to-Mac:** Use Dropbox (just wait 30s)
**For remote access:** Use GitHub (`git pull` first)
**For version control:** Use GitHub (update often)

---

## 📊 Framework Metrics

### Current State (as of Nov 21, 2025)
- **Total Documents:** 34+ documentation files
- **Scripts:** 6+ executable scripts
- **Machines Supported:** 2 active (Mac Mini, MacBook Air)
- **Remote Access Points:** 7 (Desktop, Mobile, Web, Codespaces)
- **Automation Commands:** 5 (sync, wip, content, deadline, summary)
- **Slash Commands:** 4 (/roadmap + 3 aliases)
- **Disk Space Reclaimed:** 24 GB (Nov 21 initial cleanup)

### Framework Version History
- **v1.0** (Nov 2, 2025): Initial multi-machine setup
- **v1.5** (Nov 9, 2025): Multi-environment sync + verification
- **v2.0** (Nov 19, 2025): Mobile command system + automation
- **v2.1** (Nov 21, 2025): Disk maintenance system + TOC

---

## 🎯 Next Steps for Framework Enhancement

### Planned Features
1. **Notion Integration** - Automated roadmap sync
2. **N8N Workflows** - Daily feedback loops
3. **Smart Notifications** - Deadline alerts
4. **Additional Machines** - Old Mac Mini (CI/CD server)
5. **Enhanced Mobile** - Additional shortcuts (sync, wip, deadline, summary)

### Maintenance Tasks
- **Monthly:** Run disk cleanup (Mac Mini)
- **Quarterly:** Review and archive old documentation
- **As needed:** Update sync verification script
- **Ongoing:** Update WIP file before machine switches

---

## 📞 Help & Support

### Common Issues
1. **Sync not working:** Run `./claude/verify-sync.sh` and check output
2. **Commands not found:** Restart Claude Code (files synced via Dropbox)
3. **Disk space low:** Run maintenance scripts (Mac Mini)
4. **SSH issues:** Check SSH setup docs and key configuration
5. **Git conflicts:** Use GitHub as source of truth

### Getting Help
- Check: Relevant documentation in this TOC
- Run: `./claude/verify-sync.sh` for sync status
- Read: Machine instance logs for session history
- Review: WIP_CURRENT_CRITICAL.md for current context

---

## 📚 Document Conventions

### File Naming
- **CRITICAL** - Must-read files (CRITICAL in filename)
- **COMPLETE** - Finished deployments (COMPLETE in filename)
- **README.md** - Directory overviews
- **Dates** - YYYY or Month_DD_YYYY format

### Priority Indicators
- 🔴 **Critical** - Essential for framework operation
- 🟡 **Optional** - Helpful but not required
- 🟢 **Reference** - Background information

### Update Requirements
- **Instance Logs:** After each significant session
- **WIP File:** Before/after machine switches
- **Verify Script:** Run at every session start
- **Maintenance Logs:** After each cleanup

---

**Framework Status:** ✅ Active and Operational
**Last Major Update:** November 21, 2025 (Disk Maintenance System)
**Next Scheduled Maintenance:** December 1, 2025 (Monthly cleanup)
**Maintained By:** Multi-machine Claude Code instances

---

*This Table of Contents is automatically synced via Dropbox and GitHub. For the latest version, always check the repository.*
