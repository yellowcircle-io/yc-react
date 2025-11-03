# Shared Context Directory

**Purpose:** Enable seamless context sharing across multiple Claude Code instances on different machines

**Location:** `.claude/shared-context/` (syncs via Dropbox)

---

## Directory Structure

```
.claude/shared-context/
├── README.md                    (this file)
├── WIP_CURRENT_CRITICAL.md              (current work-in-progress)
├── WIP_[YYYY-MM-DD].md         (archived WIP notes)
├── DECISIONS.md                (cross-machine decision log)
└── SESSION_[DATE]_[MACHINE].md (session summaries)
```

---

## File Descriptions

### WIP_CURRENT_CRITICAL.md
**Purpose:** Always contains the most recent work-in-progress context

**When to Update:**
- Before switching machines
- After completing a significant task
- When pausing work for extended period

**Format:**
```markdown
# Current Work in Progress
**Updated:** [Date and Time]
**Machine:** [Mac Mini / MacBook Air / etc]
**Status:** [In Progress / Paused / Blocked]

## Current Task
[Description of what you're working on]

## Context Needed
[Any important context for resuming work]

## Next Steps
[What should happen next]
```

### WIP_[YYYY-MM-DD].md
**Purpose:** Archived WIP notes for historical reference

**When to Create:**
- Archive WIP_CURRENT_CRITICAL.md when starting fresh task
- Preserve context from completed sessions

### DECISIONS.md
**Purpose:** Log of important decisions made across all machines

**Format:**
```markdown
## [Date] - [Decision Title]
**Machine:** [Which machine made the decision]
**Context:** [Why this decision was needed]
**Decision:** [What was decided]
**Rationale:** [Why this approach]
```

### SESSION_[DATE]_[MACHINE].md
**Purpose:** Detailed session summaries for specific work periods

**When to Create:**
- After completing significant work session
- When context is too detailed for WIP notes
- For complex multi-step tasks

---

## Usage Patterns

### Pattern 1: Machine Switching

**On Current Machine (before switching):**
1. Complete current task or reach clean stopping point
2. Update `WIP_CURRENT_CRITICAL.md` with status and next steps
3. Update instance log (`INSTANCE_LOG_[MACHINE].md`)
4. Commit git changes (if any)
5. Wait 10-30 seconds for Dropbox sync

**On New Machine (after switching):**
1. Read `WIP_CURRENT_CRITICAL.md` to understand current state
2. Read relevant instance log if needed
3. Continue work from next steps
4. Update `WIP_CURRENT_CRITICAL.md` when done

### Pattern 2: Complex Task Context

**For Multi-Day Tasks:**
1. Create `SESSION_[DATE]_[MACHINE].md` with detailed notes
2. Update `WIP_CURRENT_CRITICAL.md` with reference to session file
3. Add key decisions to `DECISIONS.md`

### Pattern 3: Decision Making

**When Making Important Decisions:**
1. Add entry to `DECISIONS.md` with full context
2. Update `WIP_CURRENT_CRITICAL.md` if decision affects current work
3. Reference decision in instance log

---

## Machine-Specific Guidelines

### Mac Mini (Primary Development)
- **Role:** Primary analysis, documentation, and deep work
- **WIP Updates:** After each significant analysis or document creation
- **Session Notes:** For sessions >2 hours or complex tasks

### MacBook Air (Secondary Development)
- **Role:** Mobile work, lighter tasks, reviews
- **WIP Updates:** Before/after mobile work sessions
- **Session Notes:** When doing work requiring Mac Mini handoff

### Old Mac Mini (CI/CD Server)
- **Role:** Automated builds, tests, deployments
- **WIP Updates:** Not typically needed (automated tasks)
- **Session Notes:** For manual interventions only

### Non-Primary Devices (iPad/iPhone via Codespaces)
- **Role:** Quick edits, reviews, urgent fixes
- **Access:** Read-only for WIP files, limited editing
- **Pattern:** Read context, make small changes, document in DECISIONS.md

---

## Sync Considerations

**Dropbox Sync Time:**
- Small files (<1MB): 10-30 seconds
- Typical WIP file: 15-20 seconds
- Always wait for sync before switching machines

**Conflict Prevention:**
- Only one machine actively editing at a time
- Use WIP_CURRENT_CRITICAL.md as "lock" indicator
- If WIP shows recent update (<5 min), other machine is likely active

**Git Integration:**
- Shared context files can be committed to git
- Useful for backup and historical reference
- Optional: Add `.claude/shared-context/` to `.gitignore` if too noisy

---

## Best Practices

1. **Always Update WIP Before Switching**
   - Prevents context loss
   - Enables smooth handoffs
   - Documents progress

2. **Be Specific in Context Notes**
   - Include file paths with line numbers
   - Link to relevant documentation
   - Note any blockers or dependencies

3. **Archive Old WIP Notes**
   - Keep WIP_CURRENT_CRITICAL.md clean and focused
   - Move completed work to dated archives
   - Maintain 30-day rolling archive

4. **Document Decisions**
   - Prevents revisiting same questions
   - Provides rationale for future reference
   - Helps all machines stay aligned

5. **Use Session Summaries for Complex Work**
   - Better than cramming everything in WIP
   - Provides detailed context when needed
   - Useful for resuming after breaks

---

## Troubleshooting

### WIP File Shows Old Date
- **Issue:** Dropbox sync delay or machine time difference
- **Solution:** Check Dropbox sync status, wait 30 seconds, refresh

### Conflicting WIP Updates
- **Issue:** Both machines updated WIP simultaneously
- **Solution:** Dropbox creates conflict file, manually merge or choose latest

### Lost Context After Machine Switch
- **Issue:** WIP wasn't updated before switching
- **Solution:** Check instance logs, session files, or git history

### Can't Find Relevant Context
- **Issue:** Context spread across multiple files
- **Solution:** Use grep to search: `grep -r "keyword" .claude/shared-context/`

---

## Quick Reference Commands

**Create new WIP archive:**
```bash
cd /Users/christophercooper_1/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/shared-context/
cp WIP_CURRENT_CRITICAL.md "WIP_$(date +%Y-%m-%d).md"
```

**Search all context files:**
```bash
cd .claude/shared-context/
grep -r "search term" .
```

**List recent context files:**
```bash
ls -lt .claude/shared-context/ | head -10
```

**Check Dropbox sync status:**
```bash
cat ~/.dropbox/info.json | grep path
```

---

**Created:** November 2, 2025
**Last Updated:** November 2, 2025
**Maintained By:** All Claude Code instances across machines
