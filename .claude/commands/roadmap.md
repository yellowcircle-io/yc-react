# Roadmap Management Command

**Purpose:** Check, add, and continue action items from the Trimurti/yellowCircle project roadmap

**Context:** This command is designed for use across all Claude Code access methods:
- Claude Code Desktop (Mac Mini, MacBook Air)
- Claude Code Web (browser-based)
- SSH/Termius access (remote terminals)
- GitHub Codespaces

---

## Instructions

When this command is invoked, follow these steps:

### 1. **Load Current Context**

Read the following files to understand current state:

```
PRIMARY FILES (ALWAYS READ):
- /Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/ROADMAP_CHECKLIST_NOV8_2025.md
- /Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/.claude/shared-context/WIP_CURRENT_CRITICAL.md
- /Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/PROJECT_ROADMAP_NOV2025.md

REFERENCE FILES (READ AS NEEDED):
- /Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/DECISIONS.md
- /Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/.claude/INSTANCE_LOG_MacMini.md (if on Mac Mini)
- /Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/.claude/INSTANCE_LOG_MacBookAir.md (if on MacBook Air)
```

### 2. **Present Current Status**

Display a concise summary including:

```markdown
# 🎯 Roadmap Status - [Current Date]

## This Week's Top 3 Priorities:
1. [Priority 1] - Status: [Pending/In Progress/Complete]
2. [Priority 2] - Status: [Pending/In Progress/Complete]
3. [Priority 3] - Status: [Pending/In Progress/Complete]

## Recent Completions (Last 7 Days):
- ✅ [Completed item 1]
- ✅ [Completed item 2]

## Next Up (Coming This Week):
- [ ] [Upcoming task 1]
- [ ] [Upcoming task 2]

## Active Projects:
- yellowCircle: [Current phase]
- Rho: [Current phase]
- 2nd Brain App: [Current phase]

## Blockers/Issues:
- [List any blockers, or "None"]
```

### 3. **Determine User Intent**

Ask the user what they want to do:

```
What would you like to do with the roadmap?

1. **Check** - Review current priorities and status (what you just saw above)
2. **Add** - Add new action items or tasks
3. **Continue** - Continue working on existing tasks
4. **Update** - Mark tasks complete or update status
5. **Adjust** - Re-prioritize or reschedule tasks

Please specify which action, or provide details about what you'd like to work on.
```

### 4. **Execute Based on User Choice**

#### If User Wants to **Add** Items:

1. Ask for details: task name, project, priority, estimated time
2. Determine which file to update (ROADMAP_CHECKLIST or WIP_CURRENT)
3. Add the item to the appropriate section
4. Update the file
5. Confirm addition and show updated priorities

#### If User Wants to **Continue** Work:

1. Identify the current in-progress task from WIP_CURRENT_CRITICAL.md
2. Load any relevant context files
3. Ask if they want to continue that task or switch to another
4. Provide necessary context and next steps for the chosen task
5. Use TodoWrite tool if task has multiple steps

#### If User Wants to **Update** Status:

1. Show list of pending/in-progress items
2. Let user select which to mark complete or update
3. Update ROADMAP_CHECKLIST (mark with ✅) and WIP_CURRENT
4. Update completion date if applicable
5. Show updated status

#### If User Wants to **Adjust** Priorities:

1. Show current priority order
2. Ask what changes to make
3. Update ROADMAP_CHECKLIST and WIP_CURRENT accordingly
4. Show new priority order

### 5. **Update Tracking Files**

After any changes, update:

1. **ROADMAP_CHECKLIST_NOV8_2025.md** - For completed tasks (✅)
2. **WIP_CURRENT_CRITICAL.md** - For current status and next steps
3. **INSTANCE_LOG_[MACHINE].md** - Log this session's actions
4. Commit changes to GitHub if substantial updates were made

### 6. **Sync Considerations**

**IMPORTANT:** Since this command may be used via:
- **Web/SSH:** Files must be in GitHub (run `git pull` first)
- **Desktop:** Files are in Dropbox + GitHub
- **Codespaces:** Files are in GitHub clone

**Recommended workflow:**
```bash
# At start of session
git pull

# After making changes
git add .claude/ dev-context/
git commit -m "Update roadmap: [brief description]"
git push
```

This ensures all access methods have latest roadmap data.

---

## Quick Actions (Common Use Cases)

### "What should I work on now?"
→ Show top 3 priorities from ROADMAP_CHECKLIST
→ Load context for #1 priority
→ Provide next actionable step

### "I finished [task]"
→ Mark task complete (✅) in ROADMAP_CHECKLIST
→ Update WIP_CURRENT with completion
→ Show next priority

### "Add task: [description]"
→ Add to appropriate section in ROADMAP_CHECKLIST
→ Determine priority level
→ Show updated priority list

### "Roadmap status"
→ Show summary (as in step 2)

### "Continue [project name]"
→ Load project context
→ Show current phase and next steps
→ Ask which specific task to work on

---

## File Path Reference (For All Environments)

**Primary Roadmap Files:**
```
ROADMAP_CHECKLIST:  dev-context/ROADMAP_CHECKLIST_NOV8_2025.md
PROJECT_ROADMAP:    dev-context/PROJECT_ROADMAP_NOV2025.md
WIP_CURRENT:        .claude/shared-context/WIP_CURRENT_CRITICAL.md
DECISIONS:          DECISIONS.md
```

**Supporting Files:**
```
INSTANCE_LOG:       .claude/INSTANCE_LOG_[MACHINE].md
CLAUDE_MD:          CLAUDE.md
MULTI_MACHINE:      .claude/MULTI_MACHINE_SETUP_CRITICAL.md
```

---

## Example Interactions

**Example 1: Continuing Work**
```
User: /roadmap continue
Claude:
  [Shows current status]
  You're currently working on: yellowCircle Homepage Typography
  Status: In Progress
  Next step: Implement H1 "Your Circle" header with new specs

  Would you like to continue with this task?
```

**Example 2: Adding New Task**
```
User: /roadmap add - Create API endpoint for Rho events
Claude:
  Adding new task: "Create API endpoint for Rho events"

  Questions:
  1. Which project? [Rho]
  2. Priority level? (1=High, 2=Medium, 3=Low)
  3. Estimated time?
  4. Dependencies?

  [After answers, adds to ROADMAP_CHECKLIST and shows updated priorities]
```

**Example 3: Quick Status Check**
```
User: /roadmap
Claude:
  [Shows summary from step 2 above]

  What would you like to do? [Check/Add/Continue/Update/Adjust]
```

---

## Notes for Claude Code Web / SSH Access

**CRITICAL:** When using this command from web or SSH:

1. **Always `git pull` first** - Ensure you have latest roadmap data
2. **Commit changes** - Push updates so other environments can sync
3. **Path awareness** - Dropbox path may not be available, use relative paths:
   - `dev-context/ROADMAP_CHECKLIST_NOV8_2025.md` (relative)
   - vs `/Users/.../Dropbox/...` (absolute, won't work in web/SSH)

4. **Limited persistence** - Web/SSH sessions don't persist, so:
   - All changes MUST be committed to GitHub
   - Document decisions in WIP_CURRENT for next session
   - Use this command to quickly reload context

---

## Success Criteria

After running this command, the user should:
- ✅ Know exactly what to work on next
- ✅ Have clear context for current tasks
- ✅ Be able to add/update roadmap items easily
- ✅ Have all changes synced to GitHub for multi-environment access

---

**Last Updated:** November 8, 2025
**Version:** 1.0
