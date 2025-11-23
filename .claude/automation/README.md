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
3. **Properties are created automatically!** The sync script will add:
   - Feature (Title)
   - Status (Select: Not Started, In Progress, Complete, Blocked)
   - Priority (Select: P0, P1, P2, P3)
   - Category (Select: yellowCircle, Rho, Unity Notes, Personal)
   - Description (Text)
   - Estimated Hours (Number)

4. Optionally add these properties manually if you want them:
   - Due Date (Date) - Used by deadline alerts
   - Related Files (URL) - For linking to markdown files

5. Create views (optional, but recommended):
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

### 📱 iPhone Menu Interface (Recommended for Mobile)

For the easiest iPhone experience, use the interactive menu system:

```bash
cd .claude/automation && node iphone-menu.js
```

**Features:**
- ✅ Navigate with numbered menus
- ✅ Guided prompts for all inputs
- ✅ Built-in preview confirmations
- ✅ No need to remember command syntax
- ✅ Organized by category (Global, Pages, Content, Sync)

**Example Flow:**
```
1. Run: node iphone-menu.js
2. Select: [1] Global Components
3. Select: [1] Edit Header
4. Select: [1] Change Logo Text (part1)
5. Enter: "golden"
6. Preview? (y/n): y
7. Apply? (y/n): y
✅ Done!
```

**Complete Documentation:** See `NOTION_IPHONE_WORKFLOW_GUIDE.md` for full iPhone setup guide with Apple Shortcuts examples.

---

### Global Component Management

Edit global components (Header, Footer, Theme) directly from iPhone via SSH or command line.

**Quick Commands via Shortcut Router:**
```bash
# List all global configuration
node shortcut-router.js global --action=list

# List specific component
node shortcut-router.js global --action=list --component=header
node shortcut-router.js global --action=list --component=footer
node shortcut-router.js global --action=list --component=theme

# Edit header
node shortcut-router.js edit-header --field=part1 --value="golden"
node shortcut-router.js edit-header --field=part1Color --value="#FF0000"

# Edit footer contact section
node shortcut-router.js edit-footer --section=contact --action=add --text="GITHUB" --url="https://github.com"
node shortcut-router.js edit-footer --section=contact --action=remove --text="TWITTER"
node shortcut-router.js edit-footer --section=contact --field=title --value="GET IN TOUCH"

# Edit footer projects section
node shortcut-router.js edit-footer --section=projects --action=add --text="NEW PROJECT" --url="/new-project"
node shortcut-router.js edit-footer --section=projects --action=edit --text="TRAVEL MEMORIES" --field=url --value="/memories"

# Edit theme
node shortcut-router.js edit-theme --field=primary --value="#FF0000"
node shortcut-router.js edit-theme --field=fontFamily --value="Georgia, serif"

# Preview changes without applying
node shortcut-router.js edit-header --field=part1 --value="test" --preview
```

**Direct Usage (Advanced):**
```bash
# Header fields: part1, part2, part1Color, part2Color, backgroundColor, fontSize, fontWeight, letterSpacing
node global-manager.js --component=header --field=part1 --value="golden"

# Footer actions: add, remove, edit
node global-manager.js --component=footer --section=contact --action=add --text="GITHUB" --url="https://github.com"

# Theme fields (colors): primary, primaryDark, secondary, accent, background, text, textMuted
# Theme fields (typography): fontFamily, headingWeight, bodyWeight, letterSpacing
node global-manager.js --component=theme --field=primary --value="#EECF00"

# Flags
--preview        # Show changes without applying
--dry-run        # Test execution without modifying files
--no-commit      # Skip automatic git commit
--no-build       # Skip build validation
```

**Configuration File:**
- Location: `src/config/globalContent.js`
- Contains all editable content for Header, Footer, and Theme
- Automatically validated with `npm run build` on changes
- Auto-commits to git with descriptive messages

**Safety Features:**
- ✅ **Automatic Backup:** Creates backup before every change
- ✅ **Build Validation:** Runs `npm run build` before committing
- ✅ **Auto-Restore:** If build fails, restores from backup automatically
- ✅ **Preview Mode:** Test changes without applying (`--preview` flag)
- ✅ **Rollback Support:** Undo last change with `rollback` command

**Rollback Commands:**
```bash
# Rollback last committed change (creates revert commit)
node shortcut-router.js rollback

# Restore uncommitted changes to last commit
node shortcut-router.js restore

# View last change
node shortcut-router.js last-change

# View recent history
node shortcut-router.js history
```

### Page Management

Manage pages (create, duplicate, delete) directly from iPhone via SSH or command line.

**Quick Commands via Shortcut Router:**
```bash
# Create new page from template
node shortcut-router.js create-page --slug=contact --title="Contact Us" --template=standard

# Duplicate existing page
node shortcut-router.js duplicate-page --source=about --slug=about-us --title="About Us"

# Delete page
node shortcut-router.js delete-page --slug=old-page

# Preview mode (see what would happen)
node shortcut-router.js create-page --slug=test --title="Test Page" --preview
```

**Direct Usage (Advanced):**
```bash
# Create with custom options
node page-manager.js --action=create --slug=services --title="Our Services" --template=minimal --route=/services

# Duplicate with modifications
node page-manager.js --action=duplicate --source=works --slug=portfolio --title="Portfolio"

# Delete with confirmation skip
node page-manager.js --action=delete --slug=old-page --force

# Templates available: standard, minimal, fullscreen
# Flags: --preview, --dry-run, --no-commit, --no-build, --force
```

**Page Templates:**
- `standard` - Full layout with header, footer, sidebar
- `minimal` - Clean layout, header only
- `fullscreen` - Immersive experience, no chrome

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

## Automation Workflows (GitHub Actions)

All workflows run automatically via GitHub Actions. You can also run them manually locally.

### Daily WIP Sync

**Runs:** Daily at 8:00 AM PST
**Manual Trigger:** `npm run wip:sync`

Reads `WIP_CURRENT_CRITICAL.md` and updates Notion:
- Marks tasks as "In Progress" if mentioned in current work
- Marks tasks as "Complete" if mentioned in completed section
- Generates daily summary of progress

```bash
npm run wip:sync
```

### Deadline Alerts

**Runs:** Daily at 8:00 AM PST
**Manual Trigger:** `npm run alerts:deadline`

Checks for:
- Tasks due within 24 hours
- Overdue tasks
- Creates alert file: `.claude/shared-context/DEADLINE_ALERTS.md`

```bash
npm run alerts:deadline
```

### Blocked Tasks Alert

**Runs:** Daily at 10:00 AM PST
**Manual Trigger:** `npm run alerts:blocked`

Identifies:
- Tasks blocked >48 hours (needs attention)
- Recently blocked tasks (<48 hours)
- Creates alert file: `.claude/shared-context/BLOCKED_TASKS_ALERTS.md`

```bash
npm run alerts:blocked
```

### Weekly Summary

**Runs:** Every Friday at 5:00 PM PST
**Manual Trigger:** `npm run summary:weekly`

Generates comprehensive report:
- Tasks completed this week
- Hours logged vs estimated
- Tasks in progress / blocked / not started
- Breakdown by category and priority
- Next week's priorities
- Creates summary file: `.claude/shared-context/WEEKLY_SUMMARY.md`

```bash
npm run summary:weekly
```

### Test All Automations

Run all automation scripts at once:

```bash
npm run test:all
```

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
├── package.json                        # Node.js dependencies & scripts
├── .env.example                        # Environment template
├── .env                                # Your config (gitignored)
├── README.md                           # This file
├── NOTION_IPHONE_WORKFLOW_GUIDE.md    # 📱 Complete iPhone/Apple Shortcuts guide
├── shortcut-router.js                  # 🆕 Command router for iPhone shortcuts
├── iphone-menu.js                      # 📱 Interactive menu interface for iPhone
├── global-manager.js                   # 🆕 Global component editor (Header, Footer, Theme)
├── page-manager.js                     # 🆕 Page management (create, duplicate, delete)
├── content-update.js                   # 🆕 Content editing for pages
├── sync-roadmap-to-notion.js           # Main roadmap sync script
├── daily-wip-sync.js                   # Daily WIP → Notion sync
├── deadline-alerts.js                  # Deadline monitoring
├── blocked-tasks-alert.js              # Blocked task detection
└── weekly-summary.js                   # Weekly progress reports

src/config/
└── globalContent.js                    # 🆕 Centralized global component configuration

.github/workflows/
├── daily-wip-sync.yml                  # Daily WIP automation
├── deadline-alerts.yml                 # Deadline check automation
├── blocked-tasks-alert.yml             # Blocked task automation
└── weekly-summary.yml                  # Weekly summary automation
```

---

## Next Steps

### 1. Set Up GitHub Secrets

For GitHub Actions to work, add your Notion credentials as repository secrets:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add two secrets:
   - Name: `NOTION_API_KEY`, Value: Your Notion API key
   - Name: `NOTION_ROADMAP_DB_ID`, Value: Your database ID

### 2. Enable GitHub Actions

1. Go to **Actions** tab in your GitHub repository
2. Enable workflows if not already enabled
3. Manually trigger a workflow to test:
   - Click on a workflow (e.g., "Daily WIP Sync")
   - Click "Run workflow" → "Run workflow"

### 3. Organize in Notion

- Drag tasks in Kanban view
- Set due dates (enables deadline alerts)
- Add additional notes in Description
- Update task status as you work

### 4. Maintain Markdown Files

- Markdown files remain source of truth
- Run `npm run sync` after updating roadmap files
- GitHub Actions will sync automatically daily
- Future enhancement: Bidirectional sync (Notion → Markdown)

### 5. Monitor Automation

Check generated files:
- `.claude/shared-context/DEADLINE_ALERTS.md`
- `.claude/shared-context/BLOCKED_TASKS_ALERTS.md`
- `.claude/shared-context/WEEKLY_SUMMARY.md`

### 6. Future Enhancements (Optional)

- Add N8N for complex workflow routing
- Integrate Slack/Discord for notifications
- Add time tracking based on git commits
- Build bidirectional sync (Notion → Markdown)

---

## Support

Issues? Questions?
- Check troubleshooting section above
- Review `.claude/shared-context/AUTOMATION_DEPLOYMENT_PLAN.md`
- Check Notion API docs: https://developers.notion.com
