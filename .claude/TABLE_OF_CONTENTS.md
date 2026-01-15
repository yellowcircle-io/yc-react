# yellowCircle MultiSystem Framework (yC-MSF) - Table of Contents

**Last Updated:** January 15, 2026
**Framework Version:** 2.5
**Purpose:** Central directory of all yC-MSF documentation and tools

> **Note:** yC-MSF is the unified name for the complete yellowCircle infrastructure system, previously called "Multi-Machine Framework (MMF)". It encompasses Dropbox sync, GitHub version control, Notion integration, Firebase deployment, WIP tracking, roadmaps, and automation.

---

## 📚 Quick Navigation

**🗂️ For Complete Repository Documentation:** See [../REPOSITORY_TOC.md](../REPOSITORY_TOC.md) - Full repository navigation including application code

### 🔴 Critical Files (Read First)
1. [CLAUDE.md](../CLAUDE.md) - Project instructions for Claude Code
2. [WIP_CURRENT_CRITICAL.md](shared-context/WIP_CURRENT_CRITICAL.md) - Current work status
3. [verify-sync.sh](verify-sync.sh) - Sync verification tool (run first every session)

### 🎯 Getting Started
- **New Machine Setup:** [MULTI_MACHINE_SETUP_CRITICAL.md](#setup-guides)
- **MacBook Air First Run:** [MACBOOK_AIR_FIRST_RUN_NOV2_2025_CRITICAL.md](#setup-guides)
- **Sync Guide:** [MULTI_ENVIRONMENT_SYNC_GUIDE.md](#sync-coordination)
- **Application Code:** [../REPOSITORY_TOC.md#-application-code](../REPOSITORY_TOC.md#-application-code)

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

#### Disk Maintenance (All Machines)
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [CROSS_MACHINE_DISK_MAINTENANCE.md](CROSS_MACHINE_DISK_MAINTENANCE.md) | **Cross-machine cleanup & archival guide** | Any machine cleanup | 🔴 Critical |
| [MAC_MINI_DISK_MAINTENANCE.md](MAC_MINI_DISK_MAINTENANCE.md) | Mac Mini specific scripts | Mac Mini monthly cleanup | 🟡 Reference |
| [maintenance/CLEANUP_README.md](maintenance/CLEANUP_README.md) | Full cleanup documentation | Reference for cleanup tasks | 🟢 Reference |
| [maintenance/QUICKSTART_CLEANUP.txt](maintenance/QUICKSTART_CLEANUP.txt) | Quick cleanup commands | Fast cleanup reference | 🟢 Reference |

**Maintenance Scripts:**
- `maintenance/cleanup_disk_space.sh` - Interactive cache cleanup (run monthly)
- `maintenance/cleanup_preview.sh` - Dry-run preview (run first)

**Full Cleanup Process (CROSS_MACHINE_DISK_MAINTENANCE.md):**
- **Phase 1:** Cache cleanup (~10-20 GB)
- **Phase 2:** Chrome profile management (~5-15 GB)
- **Phase 3:** Application data archival to external drive (~10-30 GB)
- **Phase 4:** Document archival (~5-10 GB)
- **Phase 5:** Backup critical data (copies, keep originals)

**External Drive Configuration:**
- **MacBook Air:** ORICO drive (`/Volumes/ORICO`)
- **Mac Mini:** `[To be configured]`

**Maintenance Schedule:**
- **Monthly** (1st of month): Phase 1 cache cleanup (~10-15 GB)
- **Quarterly**: Full cleanup including archival (~25-50 GB)
- **As needed**: When available space < 20 GB

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
| [commands/yc-msf.md](commands/yc-msf.md) | `/yc-msf` command | yC-MSF framework hub | 🔴 Critical |
| [commands/roadmap.md](commands/roadmap.md) | `/roadmap` command | Managing roadmap | 🔴 Critical |
| [commands/automation.md](commands/automation.md) | `/automation` command | Run automation scripts | 🟡 Optional |
| [commands/projects.md](commands/projects.md) | `/projects` command | Multi-project management | 🟡 Optional |
| [commands/rho.md](commands/rho.md) | `/rho` command | Rho project management | 🟡 Optional |

**Available Commands:**
| Command | Purpose | Aliases |
|---------|---------|---------|
| `/yc-msf` | yC-MSF framework hub (sync, deploy, automation) | - |
| `/roadmap` | Main roadmap management | `/trimurti`, `/trimurti-roadmap`, `/yc-roadmap` |
| `/automation` | Run automation scripts | `/auto`, `/sync` |
| `/projects` | Multi-project management (Unity, 2nd Brain, etc.) | `/unity`, `/personal` |
| `/rho` | Rho project management | - |

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

### 📝 Content Management System

#### Block CMS Documentation
| Document | Purpose | When to Use | Priority |
|----------|---------|-------------|----------|
| [docs/BLOCK_CMS_GUIDE.md](../docs/BLOCK_CMS_GUIDE.md) | Block-based CMS reference | Creating/editing articles | 🔴 Critical |
| [scripts/article-generator/README.md](../scripts/article-generator/README.md) | Programmatic article creation | CLI/automation article generation | 🟡 Optional |
| [scripts/article-generator/ssh-shortcuts.md](../scripts/article-generator/ssh-shortcuts.md) | iPhone SSH commands | Mobile article creation | 🟡 Optional |

**Block CMS Components:**
- `src/components/articles/ArticleBlocks.jsx` - 13 reusable block components
- `src/components/articles/ArticleRenderer.jsx` - Block-to-component mapper
- `src/pages/admin/BlockEditorPage.jsx` - Visual block editor

**Article Generator Scripts:**
- `scripts/article-generator/generate.cjs` - CLI markdown → blocks converter
- `scripts/article-generator/n8n-webhook-handler.cjs` - n8n/Firebase webhook
- `scripts/article-generator/templates/` - Article templates

**Key URLs:**
| Page | URL | Purpose |
|------|-----|---------|
| Admin Articles | `/admin/articles` | Article list with block/legacy badges |
| Block Editor | `/admin/blocks/new` | Create new block article |
| Block Editor (Edit) | `/admin/blocks/:id` | Edit existing block article |
| Article View | `/thoughts/:slug` | Public article display |

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

### "I want to create a new article"
**Via Admin UI:**
1. Navigate to `/admin/articles`
2. Click "New Block Article"
3. Add blocks and configure content
4. Save as draft or publish

**Via CLI:**
```bash
# Preview first
node scripts/article-generator/generate.cjs --input article.md --dry-run

# Save to Firestore
node scripts/article-generator/generate.cjs --input article.md --output firestore
```

**Via SSH (iPhone):**
```bash
pbpaste | ssh mac "cd ~/project && node scripts/article-generator/generate.cjs --input - --output firestore"
```

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

### Current State (as of Dec 17, 2025)
- **Total Documents:** 50+ documentation files
- **Scripts:** 15+ executable scripts
- **Machines Supported:** 2 active (Mac Mini, MacBook Air)
- **Remote Access Points:** 7 (Desktop, Mobile, Web, Codespaces)
- **Automation Commands:** 5 (sync, wip, content, deadline, summary)
- **Slash Commands:** 10 (5 primary + 5 aliases)
- **Disk Space Reclaimed:** 24 GB (Nov 21 initial cleanup)
- **Block Types:** 13 (CMS block components)
- **Article Generator:** CLI + n8n + SSH shortcuts
- **Pipeline Functions:** 5 (discoverPipelineA/B, collectSignals, filterPEBacked, scorePipelines)
- **UnitySTUDIO Components:** 4 (platform-specs, CreativeCanvas, ExportManager, useAIGeneration)
- **Test Scripts:** 3 (Playwright E2E, API tests)

### Framework Version History
- **v1.0** (Nov 2, 2025): Initial multi-machine setup
- **v1.5** (Nov 9, 2025): Multi-environment sync + verification
- **v2.0** (Nov 19, 2025): Mobile command system + automation
- **v2.1** (Nov 21, 2025): Disk maintenance system + TOC
- **v2.2** (Dec 7, 2025): yC-MSF rebrand + /yc-msf command hub
- **v2.3** (Dec 10, 2025): Block CMS + Article Generator framework
- **v2.4** (Dec 17, 2025): Dual-Pipeline Prospecting + UnitySTUDIO Rearchitecture

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
**Last Major Update:** December 17, 2025 (Dual-Pipeline Prospecting + UnitySTUDIO)
**Next Scheduled Maintenance:** January 1, 2026 (Monthly cleanup)
**Maintained By:** Multi-machine Claude Code instances

---

*This Table of Contents is automatically synced via Dropbox and GitHub. For the latest version, always check the repository.*
