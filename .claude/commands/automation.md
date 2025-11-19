# /automation - Run Automation Scripts

Execute automation workflows: WIP sync, deadline alerts, blocked task alerts, weekly summary.

---

## When This Command is Invoked

Provide options to run any of the deployed automation scripts manually, or show automation status.

---

## Instructions

### Step 1: Check Automation Context

Verify automation is set up:
- Check `.claude/automation/` directory exists
- Verify `package.json` has automation scripts
- Confirm `.env` file exists with Notion credentials

### Step 2: Present Automation Menu

Show user current automation status and options:

```
## 🤖 Automation Control Panel

**Notion Database:** https://notion.so/2b015c1b110d808d9c55d3b1c4908730
**Last Sync:** [Check .claude/shared-context/WEEKLY_SUMMARY.md timestamp]

### Available Automations

1. **Sync Roadmap → Notion**
   - Parses markdown roadmap files
   - Creates/updates all Notion tasks
   - Includes subtasks and metadata
   - Command: `npm run sync`

2. **Daily WIP Sync**
   - Reads WIP_CURRENT_CRITICAL.md
   - Updates task statuses in Notion
   - Generates daily summary
   - Command: `npm run wip:sync`

3. **Deadline Alerts**
   - Checks for tasks due within 24 hours
   - Identifies overdue tasks
   - Creates alert file
   - Command: `npm run alerts:deadline`

4. **Blocked Tasks Alert**
   - Finds tasks blocked >48 hours
   - Identifies recently blocked tasks
   - Creates alert file
   - Command: `npm run alerts:blocked`

5. **Weekly Summary**
   - Completed tasks this week
   - Hours logged vs estimated
   - Next week's priorities
   - Command: `npm run summary:weekly`

6. **Run All Automations**
   - Executes all scripts in sequence
   - Command: `npm run test:all`

7. **View Generated Reports**
   - Show deadline alerts
   - Show blocked task alerts
   - Show weekly summary

8. **GitHub Actions Status**
   - Check if workflows are enabled
   - View recent workflow runs
   - Trigger manual workflow run

---

## What would you like to do?

Choose an option (1-8) or describe what you need.
```

### Step 3: Execute Based on User Choice

**Option 1: Sync Roadmap → Notion**
```bash
cd .claude/automation
npm run sync
```
- Parses both roadmap files
- Shows tasks found and synced
- Displays Notion database URL

**Option 2: Daily WIP Sync**
```bash
cd .claude/automation
npm run wip:sync
```
- Reads WIP file
- Updates Notion task statuses
- Shows summary of updates

**Option 3: Deadline Alerts**
```bash
cd .claude/automation
npm run alerts:deadline
```
- Checks Notion for upcoming deadlines
- Creates `DEADLINE_ALERTS.md`
- Shows summary of urgent tasks

**Option 4: Blocked Tasks Alert**
```bash
cd .claude/automation
npm run alerts:blocked
```
- Checks Notion for blocked tasks
- Creates `BLOCKED_TASKS_ALERTS.md`
- Shows tasks needing attention

**Option 5: Weekly Summary**
```bash
cd .claude/automation
npm run summary:weekly
```
- Analyzes all tasks in Notion
- Creates comprehensive `WEEKLY_SUMMARY.md`
- Shows top achievements and priorities

**Option 6: Run All Automations**
```bash
cd .claude/automation
npm run test:all
```
- Runs WIP sync, deadline alerts, blocked tasks, weekly summary
- Shows combined results
- Updates all report files

**Option 7: View Generated Reports**

Read and display contents of:
- `.claude/shared-context/DEADLINE_ALERTS.md`
- `.claude/shared-context/BLOCKED_TASKS_ALERTS.md`
- `.claude/shared-context/WEEKLY_SUMMARY.md`

Present summaries to user.

**Option 8: GitHub Actions Status**

Show user how to:
1. Check GitHub Actions tab: https://github.com/yellowcircle-io/yc-react/actions
2. View recent workflow runs
3. Manually trigger workflow:
   - Click workflow name
   - Click "Run workflow" dropdown
   - Click "Run workflow" button

Remind user to add GitHub secrets if not done:
- `NOTION_API_KEY`
- `NOTION_ROADMAP_DB_ID`

### Step 4: Show Results

After running automation:
1. Display script output
2. Show summary of changes/updates
3. If report files were generated, ask if user wants to view them
4. Suggest next actions based on results

### Step 5: Optional Follow-Up Actions

**If deadline alerts found:**
- Offer to update due dates in Notion
- Offer to reprioritize tasks in roadmap

**If blocked tasks found:**
- Offer to review and unblock
- Offer to defer or cancel blocked tasks

**After weekly summary:**
- Offer to plan next week's priorities
- Offer to update roadmap based on progress

---

## Automation Files

**Scripts Location:** `.claude/automation/`
- `sync-roadmap-to-notion.js` (433 lines)
- `daily-wip-sync.js` (232 lines)
- `deadline-alerts.js` (157 lines)
- `blocked-tasks-alert.js` (168 lines)
- `weekly-summary.js` (273 lines)

**GitHub Actions:** `.github/workflows/`
- `daily-wip-sync.yml` (runs 8 AM PST daily)
- `deadline-alerts.yml` (runs 8 AM PST daily)
- `blocked-tasks-alert.yml` (runs 10 AM PST daily)
- `weekly-summary.yml` (runs Friday 5 PM PST)

**Generated Reports:** `.claude/shared-context/`
- `DEADLINE_ALERTS.md`
- `BLOCKED_TASKS_ALERTS.md`
- `WEEKLY_SUMMARY.md`

---

## Troubleshooting

**"NOTION_API_KEY environment variable not set"**
- Check `.claude/automation/.env` file exists
- Verify API key is correct

**"npm: command not found"**
- Install Node.js on this machine
- Or run automation via GitHub Actions instead

**"object not found" error from Notion**
- Verify database is shared with integration
- Check database ID is correct in .env

**Scripts running slow**
- Normal for 94 tasks - can take 30-60 seconds
- Notion API has rate limits

---

## Example Usage

```bash
/automation                    # Show automation menu
/automation sync               # Sync roadmap to Notion
/automation wip                # Run daily WIP sync
/automation summary            # Generate weekly summary
/automation all                # Run all automations
/automation reports            # View generated reports
```

---

**Created:** November 18, 2025
**Purpose:** Centralized automation control for all environments
**Aliases:** `/auto`, `/sync`
