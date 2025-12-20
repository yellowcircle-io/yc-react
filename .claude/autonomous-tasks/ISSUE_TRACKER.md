# Issue Tracker - Autonomous Tasks

**Updated:** December 20, 2025

---

## Open Issues

| ID | Priority | Status | Description | Created |
|----|----------|--------|-------------|---------|
| - | - | - | No open issues | - |

---

## In Progress

| ID | Task | Started | Assignee | Notes |
|----|------|---------|----------|-------|
| AI-001 | AI Photo Editing Implementation | Dec 20 | Claude Agent | Researching APIs |

---

## Completed

| ID | Task | Completed | Result |
|----|------|-----------|--------|
| - | - | - | - |

---

## Rollback Log

| Timestamp | Task | Checkpoint | Reason | Rolled Back? |
|-----------|------|------------|--------|--------------|
| - | - | - | - | - |

---

## How to Use

### Report an Issue
Add to "Open Issues" table with:
- ID: `YYYYMMDD-N` (e.g., `20251220-1`)
- Priority: HIGH / MEDIUM / LOW
- Status: NEW / INVESTIGATING / BLOCKED / RESOLVED

### Rollback a Change
```bash
# View last checkpoint
cat .claude/autonomous-tasks/.last_checkpoint

# Rollback
git reset --hard <checkpoint-hash>

# Or use the script
./scripts/autonomous-task.sh "rollback" --manual
```

### Track via GitHub
```bash
# Create issue
gh issue create --title "Bug: [description]" --body "Details..."

# List issues
gh issue list

# Close issue
gh issue close <number>
```
