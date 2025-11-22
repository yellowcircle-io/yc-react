# yellowCircle Repository - Complete Table of Contents

**Last Updated:** November 21, 2025
**Repository:** yellowcircle-io/yc-react
**Purpose:** Comprehensive navigation for entire repository including application code and documentation

---

## 📚 Quick Navigation

**📊 Notion Import:** [REPOSITORY_TOC_NOTION.csv](REPOSITORY_TOC_NOTION.csv) - Import this CSV into Notion for database view

### 🔴 Start Here
1. [CLAUDE.md](CLAUDE.md) - **READ FIRST** - Claude Code project instructions
2. [README.md](README.md) - Project overview and setup
3. [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md) - Deployment quickstart guide
4. [.claude/README.md](.claude/README.md) - Multi-Machine Framework overview

### 🎯 For Different Audiences
- **Developers:** [Application Structure](#-application-code), [Components](#react-components), [Build & Deploy](#-build--deployment)
- **Contributors:** [Development Workflow](#development-workflow), [Known Issues](KNOWN_ISSUES.md)
- **Multi-Machine Users:** [.claude/TABLE_OF_CONTENTS.md](.claude/TABLE_OF_CONTENTS.md) - Framework documentation

---

## 📂 Repository Structure

```
yellowCircle/
├── src/                           # Application source code
│   ├── pages/                     # React page components
│   ├── components/                # Reusable React components
│   ├── hooks/                     # Custom React hooks
│   ├── contexts/                  # React context providers
│   ├── config/                    # Configuration files
│   ├── styles/                    # Global styles and constants
│   └── utils/                     # Utility functions
│
├── .claude/                       # Multi-Machine Framework
│   ├── maintenance/               # Disk cleanup scripts
│   ├── automation/                # Automation scripts
│   ├── commands/                  # Slash commands
│   ├── shortcuts/                 # Apple Shortcuts system
│   └── shared-context/            # Cross-machine coordination
│
├── dev-context/                   # Strategic planning & analysis
│   ├── 01-research/               # Research & technical analysis
│   ├── 05-tasks/                  # Task-specific documentation
│   └── *.md                       # Strategy and evaluation docs
│
├── docs/                          # Historical documentation
│   ├── guides/                    # Development guides
│   └── history/                   # Change logs and implementation history
│
├── public/                        # Static assets
├── dist/                          # Production build output
├── functions/                     # Firebase Cloud Functions
├── screenshots/                   # Application screenshots
├── backups/                       # Code backups
├── design-assets/                 # Design resources
├── rho-hubspot-deployment/        # HubSpot components
└── component-library/             # Component library

```

---

## 📖 Documentation by Category

### 🚀 Getting Started

#### Essential Reading (Priority Order)
| Document | Purpose | Audience | Priority |
|----------|---------|----------|----------|
| [CLAUDE.md](CLAUDE.md) | Claude Code instructions & workflow | Claude Code sessions | 🔴 Critical |
| [README.md](README.md) | Project overview & setup | All developers | 🔴 Critical |
| [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md) | Fast deployment guide | Deployers | 🟡 Important |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Command reference | Developers | 🟡 Important |

#### Setup & Configuration
| Document | Purpose | When to Use |
|----------|---------|-------------|
| [MULTI_ENVIRONMENT_SETUP_COMPLETE.md](MULTI_ENVIRONMENT_SETUP_COMPLETE.md) | Multi-environment setup guide | Setting up sync systems |
| [DROPBOX_PATH_GUIDE.md](DROPBOX_PATH_GUIDE.md) | Dropbox sync configuration | Mac setup |
| [FIREBASE-UPGRADE-GUIDE.md](FIREBASE-UPGRADE-GUIDE.md) | Firebase plan upgrades | When quota exceeded |
| [CLOUDINARY-SETUP.md](CLOUDINARY-SETUP.md) | Image hosting setup | Media management |

---

### 💻 Application Code

#### React Components

**Pages** (`src/pages/`)
| File | Route | Purpose |
|------|-------|---------|
| [HomePage.jsx](src/pages/HomePage.jsx) | `/` | Main landing page with parallax |
| [Home17Page.jsx](src/pages/Home17Page.jsx) | `/home17` | Alternative home (17-frame version) |
| [AboutPage.jsx](src/pages/AboutPage.jsx) | `/about` | About yellowCircle |
| [WorksPage.jsx](src/pages/WorksPage.jsx) | `/works` | Portfolio/work showcase |
| [HandsPage.jsx](src/pages/HandsPage.jsx) | `/hands` | Interactive hand visualizations |
| [ThoughtsPage.jsx](src/pages/ThoughtsPage.jsx) | `/thoughts` | Blog/thought leadership |
| [ExperimentsPage.jsx](src/pages/ExperimentsPage.jsx) | `/experiments` | Interactive experiments |
| [TimeCapsulePage.jsx](src/pages/TimeCapsulePage.jsx) | `/timecapsule` | Time capsule creation |
| [CapsuleViewPage.jsx](src/pages/CapsuleViewPage.jsx) | `/capsule/:id` | View saved capsules |
| [FeedbackPage.jsx](src/pages/FeedbackPage.jsx) | `/feedback` | User feedback form |
| [UnityNotesPage.jsx](src/pages/UnityNotesPage.jsx) | `/unity-notes` | Unity project notes |
| [DirectoryPage.jsx](src/pages/DirectoryPage.jsx) | `/directory` | Site directory |
| [SitemapPage.jsx](src/pages/SitemapPage.jsx) | `/sitemap` | XML sitemap |
| [NotFoundPage.jsx](src/pages/NotFoundPage.jsx) | `*` | 404 error page |

**Components** (`src/components/`)
| File | Purpose |
|------|---------|
| [ErrorBoundary.jsx](src/components/ErrorBoundary.jsx) | Error handling wrapper |

**Hooks** (`src/hooks/`)
| File | Purpose |
|------|---------|
| [useParallax.js](src/hooks/useParallax.js) | Parallax effect logic |
| [useScrollOffset.js](src/hooks/useScrollOffset.js) | Scroll position tracking |
| [useSidebar.js](src/hooks/useSidebar.js) | Sidebar state management |
| [useFirebaseCapsule.js](src/hooks/useFirebaseCapsule.js) | Firebase capsule operations |
| [index.js](src/hooks/index.js) | Hooks barrel export |

**Contexts** (`src/contexts/`)
| File | Purpose |
|------|---------|
| [LayoutContext.jsx](src/contexts/LayoutContext.jsx) | Global layout state |

**Configuration** (`src/config/`)
| File | Purpose |
|------|---------|
| [firebase.js](src/config/firebase.js) | Firebase initialization |

**Utilities** (`src/utils/`)
| File | Purpose |
|------|---------|
| [cloudinaryUpload.js](src/utils/cloudinaryUpload.js) | Image upload to Cloudinary |

**Styles** (`src/styles/`)
| File | Purpose |
|------|---------|
| [constants.js](src/styles/constants.js) | Style constants and theme |

**Application Entry**
| File | Purpose |
|------|---------|
| [main.jsx](src/main.jsx) | React app entry point |
| [RouterApp.jsx](src/RouterApp.jsx) | Router configuration |

---

### 🔧 Build & Deployment

#### Build Configuration
| File | Purpose | Technology |
|------|---------|------------|
| [vite.config.js](vite.config.js) | Vite build configuration | Vite 5.4 |
| [package.json](package.json) | Dependencies & scripts | npm |
| [eslint.config.js](eslint.config.js) | ESLint configuration | ESLint |
| [firebase.json](firebase.json) | Firebase hosting config | Firebase |

#### Firebase Functions
| File | Purpose |
|------|---------|
| [functions/index.js](functions/index.js) | Cloud Functions entry point |
| [functions/package.json](functions/package.json) | Functions dependencies |
| [functions/.eslintrc.js](functions/.eslintrc.js) | Functions linting config |

#### Deployment Documentation
| Document | Purpose | When to Use |
|----------|---------|-------------|
| [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md) | Fast deployment | Quick deploy |
| [STAGING_DEPLOYMENT_GUIDE.md](STAGING_DEPLOYMENT_GUIDE.md) | Staging environment | Pre-production testing |
| [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) | Production checklist | Before going live |
| [FIREBASE-QUOTA-EXCEEDED.md](FIREBASE-QUOTA-EXCEEDED.md) | Quota troubleshooting | Firebase limits hit |
| [FIREBASE-COST-ANALYSIS.md](FIREBASE-COST-ANALYSIS.md) | Cost planning | Budget planning |

#### Deployment History
| Document | Date | Phase |
|----------|------|-------|
| [PHASE5_DEPLOYMENT_COMPLETE.md](PHASE5_DEPLOYMENT_COMPLETE.md) | Nov 2025 | Phase 5 complete |
| [FINAL_DEPLOYMENT_SUMMARY_NOV10.md](FINAL_DEPLOYMENT_SUMMARY_NOV10.md) | Nov 10, 2025 | Final summary |
| [DEPLOYMENT_NOV10_2025.md](DEPLOYMENT_NOV10_2025.md) | Nov 10, 2025 | Nov 10 deploy |
| [ALPHA_DEPLOYMENT_SUMMARY.md](ALPHA_DEPLOYMENT_SUMMARY.md) | - | Alpha phase |

---

### 📝 Strategic Planning & Context

#### Critical Strategy Documents (`dev-context/`)
| Document | Purpose | Category |
|----------|---------|----------|
| [01_Visual_Notes_Technical_Roadmap_CRITICAL.md](dev-context/01_Visual_Notes_Technical_Roadmap_CRITICAL.md) | Technical roadmap | 🔴 Critical |
| [01_Visual_Notes_Critical_Analysis.md](dev-context/01_Visual_Notes_Critical_Analysis.md) | Visual design analysis | 🔴 Critical |
| [02_yellowCircle_Strategy_CRITICAL.md](dev-context/02_yellowCircle_Strategy_CRITICAL.md) | Business strategy | 🔴 Critical |
| [03_Rho_Position_CRITICAL.md](dev-context/03_Rho_Position_CRITICAL.md) | Rho positioning | 🔴 Critical |

#### Content Strategy
| Document | Purpose | Status |
|----------|---------|--------|
| [OWN_YOUR_STORY_SERIES_BLUEPRINT.md](dev-context/OWN_YOUR_STORY_SERIES_BLUEPRINT.md) | Thought leadership series | Planning |
| [CASE_STUDY_EXAMPLES_LIBRARY.md](dev-context/CASE_STUDY_EXAMPLES_LIBRARY.md) | Case study repository | Reference |

#### Project Management
| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| [PROJECT_ROADMAP_NOV2025.md](dev-context/PROJECT_ROADMAP_NOV2025.md) | Current roadmap | Monthly |
| [ROADMAP_CHECKLIST_NOV8_2025.md](dev-context/ROADMAP_CHECKLIST_NOV8_2025.md) | Checklist tracking | Weekly |
| [NEXT_STEPS_NOV13_2025.md](dev-context/NEXT_STEPS_NOV13_2025.md) | Immediate next steps | Daily |

#### Research & Analysis (`dev-context/01-research/`)
| Document | Topic | Status |
|----------|-------|--------|
| [fintech-marketing-tech-stack-analysis.md](dev-context/01-research/fintech-marketing-tech-stack-analysis.md) | Fintech MarTech | Complete |
| [hubspot-salesforce-sync-error-complete-guide.md](dev-context/01-research/hubspot-salesforce-sync-error-complete-guide.md) | HubSpot/SF sync | Reference |
| [PERPLEXITY_EXPORT_RESEARCH_NOV2025.md](dev-context/01-research/PERPLEXITY_EXPORT_RESEARCH_NOV2025.md) | Perplexity export | Complete |
| [CLOUDFLARE_BLOCKING_TIMELINE_NOV2025.md](dev-context/01-research/CLOUDFLARE_BLOCKING_TIMELINE_NOV2025.md) | Cloudflare issues | Archive |

---

### 🛠️ Multi-Machine Framework

**See [.claude/TABLE_OF_CONTENTS.md](.claude/TABLE_OF_CONTENTS.md) for complete framework documentation**

#### Framework Quick Access
| Category | Key Files | Purpose |
|----------|-----------|---------|
| **Critical** | [.claude/shared-context/WIP_CURRENT_CRITICAL.md](.claude/shared-context/WIP_CURRENT_CRITICAL.md) | Current work status |
| **Sync** | [.claude/verify-sync.sh](.claude/verify-sync.sh) | Sync verification |
| **Maintenance** | [.claude/MAC_MINI_DISK_MAINTENANCE.md](.claude/MAC_MINI_DISK_MAINTENANCE.md) | Disk cleanup system |
| **Setup** | [.claude/MULTI_MACHINE_SETUP_CRITICAL.md](.claude/MULTI_MACHINE_SETUP_CRITICAL.md) | New machine setup |
| **Commands** | [.claude/commands/roadmap.md](.claude/commands/roadmap.md) | `/roadmap` command |

#### Automation System ([.claude/automation/](.claude/automation/))
| Script | Purpose | Usage |
|--------|---------|-------|
| [shortcut-router.js](.claude/automation/shortcut-router.js) | Command dispatcher | Mobile shortcuts |
| [content-update.js](.claude/automation/content-update.js) | Content updates | Content management |
| [deadline-alerts.js](.claude/automation/deadline-alerts.js) | Deadline notifications | Automation |
| [weekly-summary.js](.claude/automation/weekly-summary.js) | Weekly reports | Automation |

#### Maintenance Scripts ([.claude/maintenance/](.claude/maintenance/))
| Script | Purpose | Frequency |
|--------|---------|-----------|
| [cleanup_disk_space.sh](.claude/maintenance/cleanup_disk_space.sh) | Interactive cleanup | Monthly |
| [cleanup_preview.sh](.claude/maintenance/cleanup_preview.sh) | Dry-run preview | Before cleanup |
| [CLEANUP_README.md](.claude/maintenance/CLEANUP_README.md) | Cleanup documentation | Reference |

---

### 🎨 Design & UI Documentation

#### Design References
| Document | Purpose | Category |
|----------|---------|----------|
| [.claude/DESIGN_INSPIRATION.md](.claude/DESIGN_INSPIRATION.md) | Design inspiration sources | Reference |
| [.claude/SIDEBAR_BEST_PRACTICES.md](.claude/SIDEBAR_BEST_PRACTICES.md) | Sidebar patterns | Best practices |
| [.claude/SIDEBAR_NAV_ANALYSIS.md](.claude/SIDEBAR_NAV_ANALYSIS.md) | Navigation analysis | Analysis |

#### Component Documentation
| Document | Purpose | Status |
|----------|---------|--------|
| [GLOBAL_COMPONENTS_SPEC.md](GLOBAL_COMPONENTS_SPEC.md) | Component specifications | Reference |
| [GLOBAL_COMPONENTS_ARCHITECTURE_ANALYSIS.md](GLOBAL_COMPONENTS_ARCHITECTURE_ANALYSIS.md) | Architecture overview | Complete |
| [component-library-implementation-summary.md](component-library-implementation-summary.md) | Implementation status | Archive |

#### Visual Assets
| Directory | Contents | Purpose |
|-----------|----------|---------|
| [screenshots/](screenshots/) | Application screenshots | Visual testing |
| [design-assets/](design-assets/) | Design files | Design reference |
| [public/](public/) | Static assets | Production assets |

---

### 📚 Historical Documentation

#### Implementation History ([docs/history/])(docs/history/))
| Document | Topic | Date |
|----------|-------|------|
| [ROUTER-IMPLEMENTATION-LOG.md](docs/history/ROUTER-IMPLEMENTATION-LOG.md) | Router implementation | Archive |
| [CHANGES-MADE.md](docs/history/CHANGES-MADE.md) | Change log | Archive |
| [FINAL-TEST-REPORT.md](docs/history/FINAL-TEST-REPORT.md) | Test results | Archive |

#### Development Guides ([docs/guides/](docs/guides/))
| Document | Purpose | Status |
|----------|---------|--------|
| [YELLOW_CIRCLE_DOCUMENTATION.md](docs/guides/YELLOW_CIRCLE_DOCUMENTATION.md) | Complete documentation | Reference |
| [claude-visual-enhancement-guide.md](docs/guides/claude-visual-enhancement-guide.md) | Visual enhancements | Archive |
| [claude-home17-fixes.md](docs/guides/claude-home17-fixes.md) | Home17 fixes | Archive |

#### Migration & Refactoring
| Document | Topic | Status |
|----------|-------|--------|
| [GLOBAL_COMPONENTS_MIGRATION_NOV13_2025.md](GLOBAL_COMPONENTS_MIGRATION_NOV13_2025.md) | Global components | Complete |
| [REFACTORING_ROADMAP.md](REFACTORING_ROADMAP.md) | Refactor plan | Reference |
| [REFACTOR_COMPLETE.md](REFACTOR_COMPLETE.md) | Refactor summary | Complete |

---

### 🔍 Troubleshooting & Issues

#### Active Issues & Solutions
| Document | Issue Type | Priority |
|----------|------------|----------|
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Known bugs | 🔴 Critical |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | General troubleshooting | 🟡 Important |
| [FIREBASE-QUOTA-EXCEEDED.md](FIREBASE-QUOTA-EXCEEDED.md) | Firebase limits | 🟡 Important |

#### Testing & Quality Assurance
| Document | Purpose | When to Use |
|----------|---------|-------------|
| [PRODUCTION_TEST_PLAN.md](PRODUCTION_TEST_PLAN.md) | Production testing | Pre-deployment |
| [QUICK_TEST_CHECKLIST.md](QUICK_TEST_CHECKLIST.md) | Fast testing | Quick verification |
| [PHASE5_TESTING_CHECKLIST.md](PHASE5_TESTING_CHECKLIST.md) | Phase 5 testing | Phase 5 |
| [PHASE5_VISUAL_TESTING_GUIDE.md](PHASE5_VISUAL_TESTING_GUIDE.md) | Visual testing | UI verification |

#### Component-Specific Issues
| Document | Component | Status |
|----------|-----------|--------|
| [SAVE-FUNCTIONALITY-AUDIT.md](SAVE-FUNCTIONALITY-AUDIT.md) | Save features | Analysis |
| [SPA_ARCHITECTURE_STATUS.md](SPA_ARCHITECTURE_STATUS.md) | SPA routing | Complete |
| [HOMEPAGE_BASE_STRUCTURE_MIGRATION_STATUS.md](HOMEPAGE_BASE_STRUCTURE_MIGRATION_STATUS.md) | Homepage migration | Complete |

---

### 🚀 Special Projects

#### Rho HubSpot Deployment ([rho-hubspot-deployment/](rho-hubspot-deployment/))
| Component | Purpose |
|-----------|---------|
| [Header.jsx](rho-hubspot-deployment/components/Header.jsx) | HubSpot header |
| [Footer.jsx](rho-hubspot-deployment/components/Footer.jsx) | HubSpot footer |
| [BodyWithCTA.jsx](rho-hubspot-deployment/components/BodyWithCTA.jsx) | Body + CTA |
| [TwoColumnCards.jsx](rho-hubspot-deployment/components/TwoColumnCards.jsx) | Card layout |

#### Component Library ([component-library/](component-library/))
| File | Purpose |
|------|---------|
| [component-library-instructions.md](component-library/component-library-instructions.md) | Usage instructions |

#### Time Capsule Feature
| Document | Purpose | Status |
|----------|---------|--------|
| [timecapsule-implementation-status.md](timecapsule-implementation-status.md) | Implementation status | Complete |
| [docs/TIME_CAPSULE_DEVELOPMENT.md](docs/TIME_CAPSULE_DEVELOPMENT.md) | Development docs | Reference |

#### Perplexity Integration ([dev-context/05-tasks/](dev-context/05-tasks/))
| File | Purpose | Type |
|------|---------|------|
| [PERPLEXITY_EXPORT_INSTRUCTIONS.md](dev-context/05-tasks/PERPLEXITY_EXPORT_INSTRUCTIONS.md) | Export guide | Documentation |
| [perplexity_bulk_export_console.js](dev-context/05-tasks/perplexity_bulk_export_console.js) | Export script | Script |
| [export-perplexity.sh](dev-context/05-tasks/export-perplexity.sh) | Shell wrapper | Script |

---

## 🗂️ File Categories by Type

### 🔴 Critical Files (Must Read)
1. **CLAUDE.md** - Claude Code instructions
2. **README.md** - Project overview
3. **.claude/shared-context/WIP_CURRENT_CRITICAL.md** - Current work
4. **.claude/verify-sync.sh** - Sync verification
5. **KNOWN_ISSUES.md** - Active bugs

### 📱 Application Code
- **src/** - All application source code
- **public/** - Static assets
- **dist/** - Production builds

### 📖 Documentation
- **docs/** - Historical documentation
- **dev-context/** - Strategic planning
- **.claude/** - Multi-machine framework
- **Root *.md** - Project-level docs

### 🔧 Configuration
- **vite.config.js** - Build config
- **firebase.json** - Firebase config
- **package.json** - Dependencies
- **eslint.config.js** - Linting config

### 🧪 Testing & QA
- All files with "TEST" or "CHECKLIST" in name
- **PRODUCTION_TEST_PLAN.md**
- **TROUBLESHOOTING.md**

---

## 📋 Common Workflows

### "I'm starting development"
1. Read: [CLAUDE.md](CLAUDE.md)
2. Run: `npm install`
3. Run: `npm run dev`
4. Read: [.claude/shared-context/WIP_CURRENT_CRITICAL.md](.claude/shared-context/WIP_CURRENT_CRITICAL.md)

### "I'm deploying to production"
1. Read: [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)
2. Test: Follow [PRODUCTION_TEST_PLAN.md](PRODUCTION_TEST_PLAN.md)
3. Build: `npm run build`
4. Deploy: `firebase deploy`

### "I'm switching machines"
1. Run: `./.claude/verify-sync.sh`
2. Read: [.claude/shared-context/WIP_CURRENT_CRITICAL.md](.claude/shared-context/WIP_CURRENT_CRITICAL.md)
3. Pull: `git pull`
4. Continue work

### "I need to understand the codebase"
1. Read: [README.md](README.md)
2. Explore: [src/](src/) directory
3. Review: [GLOBAL_COMPONENTS_SPEC.md](GLOBAL_COMPONENTS_SPEC.md)
4. Check: [KNOWN_ISSUES.md](KNOWN_ISSUES.md)

### "Something is broken"
1. Check: [KNOWN_ISSUES.md](KNOWN_ISSUES.md)
2. Review: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Test: [QUICK_TEST_CHECKLIST.md](QUICK_TEST_CHECKLIST.md)
4. Debug with appropriate guide

---

## 📊 Repository Statistics

### Current State (as of Nov 21, 2025)
- **Total Files:** 250+ files (excluding node_modules)
- **Documentation:** 80+ markdown files
- **React Components:** 14 pages + shared components
- **Custom Hooks:** 5 hooks
- **Deployment Phases:** 5 phases complete
- **Framework Version:** 2.1 (Multi-Machine Framework)

### Technology Stack
- **Frontend:** React 19.1, Vite 5.4
- **Styling:** Tailwind CSS 4.1
- **Hosting:** Firebase Hosting
- **Functions:** Firebase Cloud Functions
- **Images:** Cloudinary
- **Version Control:** Git + GitHub
- **Sync:** Dropbox (primary), Google Drive (backup)

### Key Metrics
- **Pages:** 14 unique routes
- **Build Output:** dist/ directory
- **Deployment Target:** Firebase (yellowcircle-app.web.app)
- **Disk Space Freed:** 24 GB (Nov 21, 2025)
- **Active Machines:** 2 (Mac Mini, MacBook Air)

---

## 🔗 Related Documentation

### External Resources
- **Repository:** https://github.com/yellowcircle-io/yc-react
- **Production Site:** https://yellowcircle-app.web.app
- **Firebase Console:** https://console.firebase.google.com
- **Cloudinary Dashboard:** https://cloudinary.com/console

### Framework-Specific
- **Multi-Machine Framework TOC:** [.claude/TABLE_OF_CONTENTS.md](.claude/TABLE_OF_CONTENTS.md)
- **Notion CSV Export:** [.claude/FRAMEWORK_TOC_NOTION.csv](.claude/FRAMEWORK_TOC_NOTION.csv)
- **Sync Guide:** [.claude/MULTI_ENVIRONMENT_SYNC_GUIDE.md](.claude/MULTI_ENVIRONMENT_SYNC_GUIDE.md)

---

## 📞 Help & Support

### Common Questions

**Q: Where do I start?**
A: Read [CLAUDE.md](CLAUDE.md) then [README.md](README.md)

**Q: How do I deploy?**
A: Follow [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)

**Q: Where is the current work status?**
A: Check [.claude/shared-context/WIP_CURRENT_CRITICAL.md](.claude/shared-context/WIP_CURRENT_CRITICAL.md)

**Q: How do I work across multiple machines?**
A: See [.claude/TABLE_OF_CONTENTS.md](.claude/TABLE_OF_CONTENTS.md)

**Q: Something is broken, what do I check?**
A: [KNOWN_ISSUES.md](KNOWN_ISSUES.md) → [TROUBLESHOOTING.md](TROUBLESHOOTING.md) → specific guide

### Getting Help
1. Search this TOC for relevant documentation
2. Check category-specific TOCs (Framework, Guides, etc.)
3. Review recent session summaries in `.claude/INSTANCE_LOG_*.md`
4. Consult strategic docs in `dev-context/`

---

## 📝 Document Conventions

### File Naming Patterns
- **CRITICAL** - Must-read files requiring action
- **COMPLETE** - Finished implementations/deployments
- **GUIDE** - Step-by-step instructions
- **SUMMARY** - Overview/recap documents
- **STATUS** - Current state reports
- **ANALYSIS** - Deep-dive examinations

### Priority Indicators
- 🔴 **Critical** - Essential for development/operation
- 🟡 **Important** - Helpful for workflow
- 🟢 **Reference** - Background information
- 🔵 **Archive** - Historical/completed work

### Update Requirements
- **CLAUDE.md** - Update when workflow changes
- **WIP_CURRENT_CRITICAL.md** - Update before machine switches
- **REPOSITORY_TOC.md** - Update when adding major files/directories
- **.claude/TABLE_OF_CONTENTS.md** - Update when adding framework files
- **Instance Logs** - Update after significant sessions

---

**Repository Status:** ✅ Active Development
**Last Major Update:** November 21, 2025 (Disk Maintenance + Repository TOC)
**Next Scheduled Review:** December 1, 2025
**Maintained By:** yellowCircle development team + Claude Code instances

---

*This is the repository-wide Table of Contents. For Multi-Machine Framework documentation, see [.claude/TABLE_OF_CONTENTS.md](.claude/TABLE_OF_CONTENTS.md)*
