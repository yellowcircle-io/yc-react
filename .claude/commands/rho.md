# /rho - Rho Project Management Command

Manage Rho assessments, candidate evaluations, strategic analysis, and work-related tasks.

---

## When This Command is Invoked

Load Rho project context and provide options for:
- Reviewing/continuing Rho assessment work
- Analyzing candidates or tools
- Updating Rho-specific documentation
- Managing Rho tasks from roadmap

---

## Instructions

### Step 1: Load Rho Context

Read the following files to understand current Rho work:

**Primary Context:**
- `dev-context/ROADMAP_CHECKLIST_NOV8_2025.md` (search for "Rho" tasks)
- `.claude/shared-context/WIP_CURRENT_CRITICAL.md` (check for Rho work in progress)

**Rho-Specific Files (in separate repository):**
- Location: `/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/Rho Assessments 2026/`
- Strategic analysis files in `01-strategic-analysis/`
- MOps infrastructure in `02-mops-infrastructure/`
- Research exports in `04-research-exports/`

**Recent Rho Documents:**
- `COMPREHENSIVE_PROJECT_PORTFOLIO_ANALYSIS.md`
- `RHO_TOTAL_ASSESSMENT_AND_MVP_SOLUTION.md`
- `STEALTH_MODE_STRATEGY_CRITICAL.md` ⚠️ SENSITIVE
- `TOOL_COMPARISON_UNITY_MAP_STRATEGY_NOV2025.md`
- `CHRIS_CHEN_CANDIDATE_EVALUATION_NOV2025.md`
- `ANALYSIS_CORRECTIONS_NOV18_2025.md`

### Step 2: Present Rho Menu

Show user current Rho status and options:

```
## 🎯 Rho Project Status

**Current Work:**
[Summary from WIP file]

**Recent Completions:**
[List recently completed Rho tasks]

**Pending Tasks:**
[List pending Rho tasks from roadmap]

---

## What would you like to do?

1. **Continue Current Rho Work** - Resume where you left off
2. **Review Candidate Assessment** - Chris Chen or other candidates
3. **Tool Comparison Analysis** - Unity MAP vs Default vs Conversion.AI
4. **Strategic Planning** - Review stealth mode strategy or total assessment
5. **Update Rho Tasks** - Mark tasks complete or update status
6. **New Rho Analysis** - Start new candidate/tool evaluation
7. **Rho Documentation** - Update or review existing docs

Choose an option (1-7) or describe what you need.
```

### Step 3: Execute Based on User Choice

**Option 1: Continue Current Work**
- Read most recent Rho work from WIP file
- Load relevant documents
- Resume analysis or task

**Option 2: Review Candidate Assessment**
- List available candidate evaluations
- Load selected evaluation
- Provide summary and next steps

**Option 3: Tool Comparison Analysis**
- Load tool comparison documents
- Summarize findings
- Identify action items

**Option 4: Strategic Planning**
- Load strategic documents
- Summarize key decisions
- Present recommendations

**Option 5: Update Rho Tasks**
- Show Rho tasks from roadmap
- Mark selected tasks as complete
- Update WIP file with current status
- **IMPORTANT:** Commit changes to GitHub

**Option 6: New Rho Analysis**
- Ask user for context (candidate name, tool name, documents to analyze)
- Create analysis outline
- Execute analysis
- Save to Rho Assessments folder

**Option 7: Rho Documentation**
- List available Rho documents
- Load selected document
- Provide summary or facilitate updates

### Step 4: Always Finish By

1. **Update WIP file** if any work was done
2. **Update roadmap** if tasks were completed
3. **Commit to GitHub** if files were changed:
   ```bash
   git add dev-context/ .claude/shared-context/
   git commit -m "Update: Rho [brief description]"
   git push
   ```
4. **Wait 30 seconds** for Dropbox sync (desktop only)

---

## Key Rho Information

**Rho Context:**
- Marketing Operations position at Rho (in stealth mode evaluation)
- Focus: Lifecycle marketing, demand generation, marketing automation
- Key challenges: Data architecture, tool ecosystem, org structure
- Strategic decision: Testing Rho while building Unity MAP in stealth mode

**Rho Repository Location:**
- `/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/Rho Assessments 2026/`
- **Note:** This is a SEPARATE repository from yellowCircle
- Access via absolute path when reading Rho-specific files

**Sensitive Files:**
- `STEALTH_MODE_STRATEGY_CRITICAL.md` - Contains sensitive strategic planning
- Handle with discretion, do not share externally

---

## Example Usage

```bash
/rho                           # Show Rho status and menu
/rho continue                  # Continue current Rho work
/rho review Chris Chen         # Review specific candidate
/rho update tasks              # Update Rho task completion
```

---

**Created:** November 18, 2025
**Purpose:** Streamline Rho project management across all environments
**Aliases:** None
