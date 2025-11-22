# 🔴 CRITICAL: Current Work in Progress

**⚠️ ALWAYS CHECK THIS FILE** before starting work on any machine and **ALWAYS UPDATE** before switching machines.

**Updated:** November 22, 2025 at 12:25 AM PST
**Machine:** Mac Mini (Primary)
**Status:** ✅ PHASE 1 PAGE MANAGEMENT SYSTEM COMPLETE

**🔴 RESTORE POINT**: `.claude/RESTORE_POINT_NOV18_2025.md` - Complete session state captured, return to this for full context

---

## 🎯 NOVEMBER 22, 2025 - PHASE 1 PAGE MANAGEMENT SYSTEM COMPLETE - 12:25 AM PST

### ✅ PHASE 1: PAGE CREATION/DUPLICATION SYSTEM - OPERATIONAL

**iPhone Shortcut System Extended - Page Management Now Available**
- Create new pages from templates via command line or iPhone SSH
- Duplicate existing pages with content modifications
- Delete pages (with protection for core pages)
- Automatic validation, rollback, and git automation
- Full documentation and testing complete

**Files Created:**
1. **`.claude/automation/page-manager.js`** (16.5 KB)
   - Create, duplicate, delete page actions
   - Validation system (name format, route availability, template exists)
   - Preview mode (--preview flag shows changes before applying)
   - Dry-run mode (--dry-run tests without modifying files)
   - Automatic rollback on build failure (git checkpoints)
   - Auto-updates RouterApp.jsx (imports and routes)
   - Auto-updates content-update.js (PAGE_FILES mapping)
   - Build validation before committing
   - Git commit and push automation

2. **`.claude/shortcuts/PAGE_MANAGEMENT_GUIDE.md`** (comprehensive documentation)
   - Complete targeting rules documentation
   - Usage examples for all actions (create, duplicate, delete)
   - iPhone SSH workflow recommendations
   - Troubleshooting guide
   - Validation rules and safety features
   - Template reference (about, works, hands, home, experiments, thoughts)

3. **Updated `.claude/automation/shortcut-router.js`**
   - Added `create-page` command
   - Added `duplicate-page` command
   - Added `delete-page` command
   - New "pages" category in command menu

**How It Works:**

**From Command Line:**
```bash
cd .claude/automation

# Create new page
node page-manager.js --action=create --template=about --name=projects \
  --headline="PROJECTS." --subtitle="Portfolio of work" \
  --body="Explore my projects"

# Duplicate page
node page-manager.js --action=duplicate --source=about --name=about-alt

# Delete page
node page-manager.js --action=delete --name=projects

# Preview before applying (any action)
node page-manager.js --action=create --template=about --name=test --preview
```

**From iPhone SSH (Recommended Workflow):**
```
Step 1: Create page (basic)
cd .claude/automation && node page-manager.js --action=create --template=about --name=projects

Step 2: Edit content (use existing content command)
Command: content
Page: projects
Section: headline
Text: PROJECTS.
```

**Validation & Safety Features:**
- ✅ Pre-flight checks (name format, duplicate detection, template exists)
- ✅ Git checkpoint before changes
- ✅ Build validation after changes
- ✅ Automatic rollback on failure
- ✅ Post-change verification (routes resolve, imports work)
- ✅ Core page protection (home, about, works, hands cannot be deleted)

**Targeting Rules:**

**Format:** `--action=[ACTION] --template=[TEMPLATE] --name=[NAME] --section=[CONTENT]`

**Actions:**
- `create` - Create new page from template (requires: --template, --name)
- `duplicate` - Duplicate existing page (requires: --source, --name)
- `delete` - Delete a page (requires: --name)

**Content Sections (Optional During Creation):**
- `--headline` - Main page heading (h1)
- `--subtitle` - Subheading paragraph (h2)
- `--body` - Main body paragraph
- `--background` - Background image URL

**Page Name Rules:**
- ✅ Lowercase only (e.g., `projects`, `about-alt`)
- ✅ Hyphens allowed (e.g., `contact-form`)
- ❌ No spaces or special characters
- ❌ Must be unique (no duplicate routes)

**Testing Complete:**
- Created test page "projects" successfully
- Verified all file updates (ProjectsPage.jsx, RouterApp.jsx, content-update.js)
- Build validation passed
- Git automation working
- Preview mode functional
- Rollback system tested

**What This Enables:**

1. **Mobile Page Creation** - Create new pages from iPhone via SSH
2. **Rapid Prototyping** - Quickly duplicate and modify pages
3. **Safe Experimentation** - Preview and rollback features
4. **Content Management** - Combined with existing content command, full CMS workflow
5. **No Claude Code Required** - All operations via command line/SSH

**Next Steps (Phase 2 - Planned):**
- Global components editing (footer, header, colors)
- Multiple body paragraphs support
- Navigation structure editing
- List items and custom sections
- Simple GUI for inline editing (optional)

**To Resume on MacBook Air:**
Read these files in order:
1. `.claude/shared-context/WIP_CURRENT_CRITICAL.md` (this file)
2. `.claude/shortcuts/PAGE_MANAGEMENT_GUIDE.md` (complete guide)
3. `.claude/shortcuts/EXTENDED_FUNCTIONALITY_SPEC.md` (Phase 2-4 specs)

Then test: `cd .claude/automation && node page-manager.js --action=create --template=about --name=test-page --preview`

---

## 🎯 NOVEMBER 21, 2025 - DISK MAINTENANCE SYSTEM COMPLETE - 10:55 PM PST

### ✅ DISK CLEANUP + FRAMEWORK INTEGRATION - COMPLETE

**Mac Mini Disk Maintenance System - OPERATIONAL**
- Created comprehensive disk cleanup tools
- Executed initial cleanup: 24 GB reclaimed (11 GB → 35 GB available)
- Integrated into Multi-Machine Framework
- Established monthly maintenance schedule

**Files Created:**
1. **`.claude/maintenance/cleanup_disk_space.sh`** (11 KB)
   - Interactive cleanup script with confirmations
   - Tracks space reclaimed
   - Safe and reversible operations

2. **`.claude/maintenance/cleanup_preview.sh`** (4.9 KB)
   - Dry-run preview mode (no deletions)
   - Shows what would be deleted
   - Run this first before cleanup

3. **`.claude/maintenance/CLEANUP_README.md`** (6.2 KB)
   - Complete documentation
   - Manual commands
   - Troubleshooting guide

4. **`.claude/maintenance/QUICKSTART_CLEANUP.txt`** (6.6 KB)
   - Quick reference guide
   - Fast cleanup commands

5. **`.claude/MAC_MINI_DISK_MAINTENANCE.md`**
   - Framework integration guide
   - Maintenance schedule
   - Usage instructions
   - Session note templates

**Initial Cleanup Results (Nov 21, 2025):**
- Before: 11 GB available (68% capacity)
- After: 35 GB available (41% capacity)
- **Space Reclaimed: 24 GB** (218% increase)

**What Was Cleaned:**
- Browser caches (Chrome, Firefox, Edge): 7.6 GB
- Adobe caches: 3.4 GB
- npm/Yarn caches: 2.4 GB
- Developer caches (.cache): 1.5 GB
- Application updater caches: 1.2 GB
- Desktop installers: 650 MB

**Maintenance Schedule Established:**
- **Monthly** (1st of month): Browser, npm/Yarn, updater caches (10-15 GB)
- **Quarterly**: Full cleanup including Adobe, old projects (15-25 GB)
- **As Needed**: Desktop installers after app installs

**Next Scheduled Cleanup:** December 1, 2025

**To Use the Maintenance System:**
```bash
# From project root
cd .claude/maintenance

# Preview what will be cleaned (DRY RUN)
./cleanup_preview.sh

# Run interactive cleanup
./cleanup_disk_space.sh
```

**Quick Manual Cleanup (Safe):**
```bash
# Browser caches (7-8 GB)
rm -rf ~/Library/Caches/Google/Chrome/*
rm -rf ~/Library/Caches/Firefox/*

# Developer caches (2-3 GB)
npm cache clean --force
rm -rf ~/.cache

# Adobe (if inactive)
rm -rf ~/Library/Caches/Adobe/*
```

**Integration Notes:**
- Scripts synced via Dropbox to `.claude/maintenance/`
- Instance log updated with Nov 21 cleanup session
- Mac Mini specific (different storage patterns on MacBook Air)
- All cleanup operations are user-accessible (no root required)

**Documentation:**
- Read: `.claude/MAC_MINI_DISK_MAINTENANCE.md`
- Session logged in: `.claude/INSTANCE_LOG_MacMini.md`

**Framework Impact:**
- Added maintenance system to multi-machine framework
- Monthly schedule prevents disk space issues
- Automated tracking of cleanup sessions
- Integration with session logging

---

## 🎯 NOVEMBER 21, 2025 - "OWN YOUR STORY" SERIES - BLUEPRINT & CASE STUDIES COMPLETE - 11:30 PM PST

### ✅ CONTENT SERIES PLANNING - COMPLETE

**"Own Your Story" Thought Leadership Series - Ready for Drafting**
- Series blueprint and brand identity defined
- Case study library extracted from Rho assessments
- 7-article roadmap planned (Q1-Q3 2026)
- First article "Why Your GTM Sucks" ready to outline

**Files Created:**
1. **`dev-context/OWN_YOUR_STORY_SERIES_BLUEPRINT.md`** (500+ lines)
   - Series mission: "Confrontational honesty over polite consulting"
   - Voice & tone guidelines (direct, data-driven)
   - Format structure (2,500-4,000 words per article)
   - 7-article roadmap with timelines
   - Visual identity and navigation placement

2. **`dev-context/CASE_STUDY_EXAMPLES_LIBRARY.md`** (800+ lines)
   - 5 comprehensive case studies extracted from Rho assessments
   - Reusable metrics: $2.5M cost, 45-min lag, 300 workflows, 15% error rate
   - Narrative arcs mapped to articles
   - Visual elements identified (timelines, tables, diagrams)
   - Anonymization strategies for each case study

**Case Studies Ready:**
- CS1: Rho GTM Organizational Failure (hiring misalignment)
- CS2: Data Architecture Disaster (45-minute lag, schema chaos)
- CS3: Attribution Breakdown (3 implementations, 8-85% fill rate)
- CS4: Build vs Buy Decision ($32K audit vs $6K MVP)
- CS5: Technical Debt Accumulation ($2.5M/year recurring cost)

**Series Roadmap:**
- Article 1: "Why Your GTM Sucks" - Draft by Dec 15, 2025
- Article 2: "Why Your MAP Is a Mess" - Draft by Jan 15, 2026
- Article 3: "Why Your Sales and Marketing Are Divorced" - Draft by Feb 1, 2026
- Articles 4-7: Q2-Q3 2026

**Next Steps:**
1. Draft "Why Your GTM Sucks" outline (2-3 hours)
2. Write complete first draft (5-8 hours)
3. Create yellowCircle navigation integration plan
4. Design article template (React component)

**To Resume on MacBook Air:**
Read these files in order:
1. `.claude/shared-context/WIP_CURRENT_CRITICAL.md` (this file)
2. `dev-context/OWN_YOUR_STORY_SERIES_BLUEPRINT.md`
3. `dev-context/CASE_STUDY_EXAMPLES_LIBRARY.md`

Then say: "Continue drafting 'Why Your GTM Sucks' article outline"

---

[Rest of file content remains the same...]
