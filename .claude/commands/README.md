# Claude Code Custom Commands

This directory contains custom slash commands for Claude Code to streamline project management across all access methods (desktop, web, SSH, Codespaces).

Part of the **yellowCircle MultiSystem Framework (yC-MSF)**.

---

## Available Commands

### `/yc-msf` ⭐ NEW
**Central hub** for the yellowCircle MultiSystem Framework.

**Use cases:**
- Check sync status across all systems
- Update WIP and roadmap
- Deploy to Firebase
- Run automation scripts
- View framework documentation
- Create restore points

**Example usage:**
```bash
/yc-msf                     # Show yC-MSF dashboard
/yc-msf sync                # Check sync status
/yc-msf wip                 # Update WIP file
/yc-msf deploy              # Deploy to Firebase
/yc-msf docs                # View framework documentation
```

---

### `/roadmap`
**Primary command** for managing the Trimurti project roadmap.

**Use cases:**
- Check current priorities and status
- Add new action items
- Continue working on existing tasks
- Update task completion status
- Adjust priorities and timelines

**Example usage:**
```bash
/roadmap                    # Show status and options
/roadmap continue           # Continue current work
/roadmap add                # Add new task
/roadmap status             # Quick status check
```

**Aliases:** `/trimurti`, `/trimurti-roadmap`, `/yc-roadmap`

---

### `/automation`
**Run automation workflows** - WIP sync, deadline alerts, blocked tasks, weekly summary.

**Use cases:**
- Sync roadmap to Notion database
- Run daily WIP sync
- Check deadline alerts
- Generate weekly summary
- View automation status

**Example usage:**
```bash
/automation                 # Show automation menu
/automation sync            # Sync roadmap to Notion
/automation wip             # Run daily WIP sync
/automation summary         # Generate weekly summary
/automation all             # Run all automations
```

**Aliases:** `/auto`, `/sync`

---

### `/projects`
**Multi-project management** for Unity Notes, 2nd Brain App, Personal tasks, Golden Unknown, Cath3dral.

**Use cases:**
- View status across all projects
- Switch between project contexts
- Update project-specific tasks
- Cross-cutting infrastructure work

**Example usage:**
```bash
/projects                   # Show all projects overview
/projects unity             # Work on Unity Notes
/projects 2nd-brain         # Work on 2nd Brain App
/projects personal          # Personal development tasks
```

**Aliases:** `/unity`, `/personal`

---

### `/rho`
**Rho project management** for assessments, candidate evaluations, and strategic analysis.

**Use cases:**
- Review/continue Rho assessment work
- Analyze candidates or tools
- Update Rho-specific documentation
- Manage Rho tasks from roadmap

**Example usage:**
```bash
/rho                        # Show Rho status and menu
/rho continue               # Continue current Rho work
/rho review Chris Chen      # Review specific candidate
/rho update tasks           # Update Rho task completion
```

---

## Complete Command Reference

| Command | Purpose | Aliases |
|---------|---------|---------|
| `/yc-msf` | yC-MSF framework hub (sync, deploy, automation) | - |
| `/roadmap` | Main roadmap management | `/trimurti`, `/trimurti-roadmap`, `/yc-roadmap` |
| `/automation` | Run automation scripts | `/auto`, `/sync` |
| `/projects` | Multi-project management | `/unity`, `/personal` |
| `/rho` | Rho project management | - |

**Total: 5 primary commands + 5 aliases = 10 commands**

---

## How Slash Commands Work

### In Claude Code Desktop:
1. Type `/` to see available commands
2. Select command from dropdown or type full name
3. Press Enter to execute

### In Claude Code Web / SSH:
1. Commands work the same way
2. **IMPORTANT:** Run `git pull` first to get latest roadmap data
3. **IMPORTANT:** Commit changes after updates so other environments sync

### In GitHub Codespaces:
1. Clone repository includes `.claude/commands/`
2. Commands available immediately
3. Remember to push changes to sync with other environments

---

## File Structure

```
.claude/commands/
├── README.md                  # This file
├── yc-msf.md                  # yC-MSF framework hub command
├── roadmap.md                 # Main roadmap management command
├── automation.md              # Automation scripts command
├── projects.md                # Multi-project management command
├── rho.md                     # Rho project management command
├── trimurti.md                # Alias → roadmap
├── trimurti-roadmap.md        # Alias → roadmap
├── yc-roadmap.md              # Alias → roadmap
├── auto.md                    # Alias → automation
├── sync.md                    # Alias → automation
├── unity.md                   # Alias → projects
└── personal.md                # Alias → projects
```

---

## Creating New Commands

To add a custom command:

1. Create a new `.md` file in this directory
2. Filename = command name (e.g., `deploy.md` → `/deploy`)
3. File contents = instructions for Claude Code to execute
4. Commit to GitHub for multi-environment access

**Example command file:**
```markdown
# Command Name

Brief description of what this command does.

## Instructions

When this command is invoked, follow these steps:

1. [Step 1 instructions]
2. [Step 2 instructions]
3. [etc.]

## Files to Reference
- path/to/file1.md
- path/to/file2.md

## Example Usage
[Examples of how to use this command]
```

---

## Syncing Across Environments

**CRITICAL for Web/SSH/Codespaces access:**

### After Creating/Updating Commands:
```bash
git add .claude/commands/
git commit -m "Add/update custom commands"
git push
```

### Before Using Commands (Web/SSH):
```bash
git pull  # Get latest commands from GitHub
```

### Multi-Machine Workflow:
1. **Desktop (Dropbox):** Commands sync via Dropbox + GitHub
2. **Web/SSH:** Commands sync via GitHub only
3. **Codespaces:** Commands sync via GitHub clone

**Best Practice:** Always commit command changes to GitHub immediately.

---

## Command Design Principles

When creating commands for this multi-environment setup:

1. **Use relative paths** - Don't hardcode `/Users/username/Dropbox/...`
   - ✅ `dev-context/ROADMAP_CHECKLIST_NOV8_2025.md`
   - ❌ `/Users/christophercooper/Dropbox/CC Projects/...`

2. **Document file locations** - Make paths discoverable
   - Include path reference section in command

3. **Assume no persistence** - Web/SSH sessions are stateless
   - Command should load all context from files
   - Don't rely on Claude remembering previous sessions

4. **Commit reminder** - Remind Claude to commit changes
   - Essential for multi-environment sync

5. **Self-contained instructions** - Command should be complete
   - Don't assume Claude knows project structure
   - Include all necessary context in command file

---

## Roadmap Command Details

### Files Referenced by `/roadmap`:

**Primary (always loaded):**
- `dev-context/ROADMAP_CHECKLIST_NOV8_2025.md` - Weekly checklist
- `.claude/shared-context/WIP_CURRENT_CRITICAL.md` - Current work status
- `dev-context/PROJECT_ROADMAP_NOV2025.md` - Long-term roadmap

**Secondary (loaded as needed):**
- `DECISIONS.md` - Decision history
- `.claude/INSTANCE_LOG_[MACHINE].md` - Session logs

**Updated by `/roadmap`:**
- Marks tasks complete (✅) in ROADMAP_CHECKLIST
- Updates current status in WIP_CURRENT_CRITICAL
- Logs actions in INSTANCE_LOG

---

## Troubleshooting

### "Command not found"
- Check `.claude/commands/` directory exists
- Verify command file exists and has `.md` extension
- Try `git pull` if using web/SSH

### "File not found" errors in command execution
- Command may use absolute paths - update to relative
- File may not be in GitHub - commit and push from desktop
- Try `git pull` to get latest files

### Changes not syncing between environments
- Ensure changes are committed to GitHub
- Run `git pull` on other environments
- Wait 30 seconds for Dropbox sync (desktop only)

---

## Future Command Ideas

Potential commands to add:

- `/deploy` - Dedicated Firebase deployment command
- `/test` - Run linter and tests
- `/context` - Load full project context quickly
- `/decision` - Document a new decision in DECISIONS.md
- `/perplexity` - Manage Perplexity exports

---

**Created:** November 8, 2025
**Last Updated:** December 7, 2025
**Version:** 2.0

**Changelog:**
- v2.0 (Dec 7, 2025): Added yC-MSF hub, complete command list, updated structure
- v1.0 (Nov 8, 2025): Initial roadmap command with aliases
