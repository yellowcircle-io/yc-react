# yellowCircle Automation Scripts

Automated workflows for project management, roadmap sync, and productivity tracking.

---

## Quick Start

### 1. Install Dependencies

```bash
cd .claude/automation
npm install
```

### 2. Set Up Notion

#### Step 1: Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click "+ New integration"
3. Name: "yellowCircle Automation"
4. Workspace: Select your workspace
5. Click "Submit"
6. Copy the "Internal Integration Token" (starts with `secret_`)

#### Step 2: Create Roadmap Database

1. Go to Notion, create new page: "yellowCircle Roadmap"
2. Create a database (full page database, not inline)
3. Add the following properties:

| Property Name | Type | Options |
|--------------|------|---------|
| Feature | Title | (default) |
| Status | Select | Not Started, In Progress, Complete, Blocked |
| Priority | Select | P0, P1, P2, P3 |
| Category | Select | yellowCircle, Rho, Unity Notes, Personal |
| Description | Text | (long text) |
| Estimated Hours | Number | (default) |
| Due Date | Date | (default) |
| Related Files | URL | (default) |

4. Create views:
   - **Kanban** (Board view by Status) - Set as default
   - **This Week** (Table view, filter: Due Date is this week)
   - **By Priority** (Table view, sort by Priority P0 first)
   - **By Category** (Table view, group by Category)

#### Step 3: Share Database with Integration

1. Click "Share" button (top right of database page)
2. Click "Invite"
3. Search for "yellowCircle Automation" integration
4. Click "Invite"

#### Step 4: Get Database ID

1. Open your roadmap database in Notion
2. Look at the URL: `https://notion.so/workspace/abc123def456?v=xyz`
3. The database ID is the part before `?v=`: `abc123def456`
4. Copy this ID

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

Paste your:
- `NOTION_API_KEY` from Step 1
- `NOTION_ROADMAP_DB_ID` from Step 4

### 4. Test Connection (Dry Run)

```bash
npm run sync:dry-run
```

Expected output:
```
🚀 Roadmap → Notion Sync Script

⚠️  DRY RUN MODE - No changes will be made

📋 Parsing roadmap files...

  ✓ ROADMAP_CHECKLIST_NOV8_2025.md
  ✓ PROJECT_ROADMAP_NOV2025.md

📊 Found 15 tasks total

Tasks by category:
  yellowCircle: 8 tasks
  Rho: 3 tasks
  Unity Notes: 2 tasks
  Personal: 2 tasks

⚙️  Syncing to Notion...

[DRY RUN] Would create/update: yellowCircle Homepage Redesign
  Priority: P0
  Status: Not Started
  Category: yellowCircle
  Hours: 14
  Subtasks: 6

...

✅ Sync complete!
```

### 5. Run Actual Sync

```bash
npm run sync
```

Expected output:
```
🚀 Roadmap → Notion Sync Script

📋 Parsing roadmap files...

📊 Found 15 tasks total

⚙️  Syncing to Notion...

✨ Created: yellowCircle Homepage Redesign
   └─ Added 6 subtasks
✨ Created: Own Your Story Series
   └─ Added 5 subtasks
...

✅ Sync complete!

🔗 View your roadmap: https://notion.so/abc123def456
```

---

## Usage

### Sync Roadmap to Notion

```bash
# Full sync (creates/updates all tasks)
npm run sync

# Dry run (preview without changes)
npm run sync:dry-run
```

### What Gets Synced

**From these files:**
- `dev-context/ROADMAP_CHECKLIST_NOV8_2025.md`
- `dev-context/PROJECT_ROADMAP_NOV2025.md`

**Extracted data:**
- Task name (from headers)
- Priority (P0, P1, P2 from markers)
- Status (from "Status:" lines or completion markers)
- Category (yellowCircle, Rho, Unity Notes, Personal)
- Estimated hours (from time estimates)
- Description (from text after headers)
- Subtasks (from checkbox lists)

**Sync behavior:**
- If task already exists in Notion (matched by name): **Updates** status, priority, etc.
- If task is new: **Creates** new Notion page with all properties
- Subtasks are added as to-do blocks inside the page

---

## Automation Workflows (Future)

### Daily Feedback Loop (Phase 2)

Coming soon: N8N workflow that:
- Reads `.claude/shared-context/WIP_CURRENT_CRITICAL.md` daily
- Updates Notion task statuses
- Sends daily summary notification

### Smart Notifications (Phase 3)

Coming soon:
- Deadline alerts (24 hours before due date)
- Blocked task alerts (blocked >48 hours)
- Weekly summary (Friday 5 PM)

---

## Troubleshooting

### Error: "NOTION_API_KEY environment variable not set"

**Solution:** Create `.env` file in `.claude/automation/` directory with your API key

### Error: "object not found" when syncing

**Solution:** Make sure you shared the database with your integration (Step 3 above)

### Error: "validation error" on properties

**Solution:** Check that your database has all required properties with correct names:
- Feature (Title)
- Status (Select with options: Not Started, In Progress, Complete, Blocked)
- Priority (Select with options: P0, P1, P2, P3)
- Category (Select with options: yellowCircle, Rho, Unity Notes, Personal)

### Tasks not showing up

**Solution:**
1. Run `npm run sync:dry-run` to see what would be synced
2. Check that roadmap files exist in `dev-context/` directory
3. Verify task headers match expected format (### or ## with task name)

### Duplicate tasks created

**Solution:** Script matches tasks by exact title. If title changed in markdown, it will create new Notion page. Manually delete duplicates or update markdown to match existing Notion titles.

---

## File Structure

```
.claude/automation/
├── package.json              # Node.js dependencies
├── .env.example              # Environment template
├── .env                      # Your config (gitignored)
├── README.md                 # This file
├── sync-roadmap-to-notion.js # Main sync script
└── (future workflows)
    ├── daily-feedback.js
    ├── smart-notifications.js
    └── time-tracking.js
```

---

## Next Steps

After successful sync:

1. **Organize in Notion**
   - Drag tasks in Kanban view
   - Set due dates
   - Add additional notes in Description

2. **Update markdown files**
   - Markdown files remain source of truth
   - Sync script will update Notion on next run
   - Future: Bidirectional sync (Notion → Markdown)

3. **Deploy Phase 2** (Daily Feedback Loop)
   - Set up N8N workflow
   - Connect to WIP file updates
   - Configure notifications (Slack/Discord/Email)

4. **Deploy Phase 3** (Smart Notifications)
   - Deadline reminders
   - Blocked task alerts
   - Weekly summaries

---

## Support

Issues? Questions?
- Check troubleshooting section above
- Review `.claude/shared-context/AUTOMATION_DEPLOYMENT_PLAN.md`
- Check Notion API docs: https://developers.notion.com
