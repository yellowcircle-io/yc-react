# /projects - Multi-Project Management Command

Manage non-yellowCircle projects: Unity Notes, 2nd Brain App, Personal tasks, Golden Unknown, Cath3dral.

---

## When This Command is Invoked

Load all project contexts and provide options for working on:
- Unity Notes ecosystem
- 2nd Brain / Visual Note App
- Personal development tasks
- Golden Unknown brand
- Cath3dral long-term vision

---

## Instructions

### Step 1: Load Project Contexts

Read the following files to understand current work across all projects:

**Primary Context:**
- `dev-context/ROADMAP_CHECKLIST_NOV8_2025.md` (all project tasks)
- `dev-context/PROJECT_ROADMAP_NOV2025.md` (long-term roadmap)
- `.claude/shared-context/WIP_CURRENT_CRITICAL.md` (current work status)

**Strategic Documents:**
- `dev-context/COMPREHENSIVE_PROJECT_PORTFOLIO_ANALYSIS.md` (40 KB - all projects)
- `dev-context/01_Visual_Notes_Technical_Roadmap_CRITICAL.md` (Unity Notes architecture)

### Step 2: Present Projects Overview

Show user a comprehensive view of all non-yellowCircle projects:

```
## 🎯 Multi-Project Status

### Unity Notes Ecosystem
**Status:** [Current status from WIP]
**Priority:** [From roadmap]
**Key Tasks:**
- [List 2-3 top Unity Notes tasks]

### 2nd Brain / Visual Note App
**Status:** [Current status]
**Priority:** [From roadmap]
**Key Tasks:**
- [List 2-3 top 2nd Brain tasks]

### Personal Development
**Status:** [Current status]
**Priority:** [From roadmap]
**Key Tasks:**
- [List personal tasks like job interviews, skill development]

### Golden Unknown Brand
**Status:** [Current status]
**Priority:** [From roadmap - Q1 2026]
**Key Tasks:**
- [List Golden Unknown tasks if any]

### Cath3dral Long-Term Vision
**Status:** [Current status]
**Priority:** [From roadmap - Q3 2026]
**Key Tasks:**
- [List Cath3dral tasks if any]

---

## What would you like to work on?

1. **Unity Notes** - Ecosystem architecture, MAP, foundation layer
2. **2nd Brain App** - Visual note-taking, scoping, development
3. **Personal Tasks** - Job interviews, skill development, learning
4. **Golden Unknown** - Brand development, creative work
5. **Cath3dral** - Long-term vision planning
6. **Cross-Cutting** - Multi-machine context, automation, infrastructure
7. **View Full Roadmap** - See all tasks across all projects

Choose a project (1-7) or describe what you need.
```

### Step 3: Execute Based on User Choice

**Option 1: Unity Notes**
- Load Unity Notes technical roadmap
- Show architecture decisions
- Present options:
  - Foundation layer development
  - Unity MAP architecture
  - Ecosystem integration
  - Documentation updates

**Option 2: 2nd Brain App**
- Load 2nd Brain scoping documents
- Show current design/architecture
- Present options:
  - Continue scoping
  - Start development
  - Review existing notes/ideas
  - Integration planning

**Option 3: Personal Tasks**
- Load personal development tasks from roadmap
- Show job interview analyses if available
- Present options:
  - Review interview analysis
  - Skill development planning
  - Career strategy discussion
  - Learning resource curation

**Option 4: Golden Unknown**
- Load Golden Unknown brand documents
- Show brand development status
- Present options:
  - Brand strategy
  - Creative direction
  - Timeline planning
  - Resource allocation

**Option 5: Cath3dral**
- Load Cath3dral vision documents
- Show long-term planning status
- Present options:
  - Vision refinement
  - Architecture planning
  - Timeline discussion
  - Research gathering

**Option 6: Cross-Cutting**
- Focus on infrastructure that benefits all projects
- Present options:
  - Multi-machine context system
  - Automation workflows
  - Documentation frameworks
  - Development tooling

**Option 7: View Full Roadmap**
- Load complete PROJECT_ROADMAP_NOV2025.md
- Show all projects with timelines
- Help user prioritize
- Identify dependencies

### Step 4: Work on Selected Project

1. Load relevant files for chosen project
2. Present current status and next steps
3. Execute work (analysis, planning, development, documentation)
4. Update task status in roadmap files
5. Update WIP file with progress

### Step 5: Always Finish By

1. **Update WIP file** with current project status
2. **Update roadmap** if tasks completed or priorities changed
3. **Commit to GitHub**:
   ```bash
   git add dev-context/ .claude/shared-context/
   git commit -m "Update: [Project Name] [brief description]"
   git push
   ```
4. **Wait 30 seconds** for Dropbox sync (desktop only)

---

## Key Project Information

### Unity Notes Ecosystem
**Purpose:** MAP (Marketing Automation Platform) for underserved SMB market
**Status:** Architecture designed, 220-260 hour implementation estimate
**Key Files:**
- `dev-context/01_Visual_Notes_Technical_Roadmap_CRITICAL.md`
- `dev-context/UNITY_NOTES_ECOSYSTEM_ARCHITECTURE.md`

**Components:**
- Foundation Layer (Core database, shared hooks)
- Time Capsule (Visual retrospective tool)
- Unity MAP (Marketing automation for SMBs)
- Unity Notes App (Master interface)

### 2nd Brain App
**Purpose:** Cross-cutting visual note-taking app
**Status:** Scoping phase
**Estimate:** 11-18 hours for initial scoping + MVP

### Personal Development
**Current:** Job interview analyses, career strategy
**Files:** Located in Rho Assessments repository
**Tasks:** Interview preparation, skill development, market research

### Golden Unknown
**Purpose:** Brand development (Q1 2026)
**Status:** Early planning
**Note:** Opportunistic timing, not timeline-driven

### Cath3dral
**Purpose:** Long-term creative vision (Q3 2026)
**Status:** Conceptual
**Note:** Opportunistic timing, not timeline-driven

---

## Strategic Context

**Stealth Mode Strategy:** Building Unity Notes while employed at Rho
**Options Stacking:** 15-20 hrs/week sustainable development across multiple options
**Revenue Potential:** $334K-742K/year after 12 months across all paths
**Decision Point:** Unity Notes foundation layer OR Rho integration first

---

## Example Usage

```bash
/projects                      # Show all projects overview
/projects unity                # Work on Unity Notes
/projects 2nd-brain            # Work on 2nd Brain App
/projects personal             # Personal development tasks
/projects roadmap              # View full multi-project roadmap
```

---

**Created:** November 18, 2025
**Purpose:** Unified project management for all non-yellowCircle work
**Aliases:** `/unity`, `/personal`, `/cross-cutting`
