# Apple Shortcuts - Programmatic Generation System

This directory contains the programmatic Apple Shortcuts generation system for yellowCircle and Trimurti projects.

---

## 🎯 What This Solves

**Problem:** Manually creating shortcuts on iPhone for each new project/command is tedious.

**Solution:**
1. ✅ Create shortcuts programmatically on Mac using JavaScript
2. ✅ Auto-sync to iPhone via iCloud (no manual setup!)
3. ✅ Update shortcuts as Trimurti projects evolve
4. ✅ Centralized command routing for easy updates

---

## 📁 Files

```
.claude/shortcuts/
├── README.md                           # This file
├── QUICKSTART.md                       # 5-minute iPhone setup guide
├── PROGRAMMATIC_SHORTCUTS_SOLUTION.md  # Complete technical solution
├── package.json                        # npm scripts
├── generate-shortcuts.js               # Programmatic generator (shortcuts-js)
└── generated/                          # Output directory
    ├── IMPORT_INSTRUCTIONS.md          # How to import generated shortcuts
    ├── rho-sync.shortcut               # Rho project shortcut
    ├── unity-sync.shortcut             # Unity project shortcut
    ├── personal-sync.shortcut          # Personal tasks shortcut
    └── yellowcircle-command-generated.shortcut  # Main command demo

Related:
├── .claude/automation/shortcut-router.js  # Dynamic command loader
└── .claude/EMAIL_COMMAND_EXAMPLES.md      # Email/GitHub issue templates
```

---

## 🚀 Quick Start

### ⭐ RECOMMENDED: Hybrid Approach (Best of Both Worlds)

**Combines iOS native menus + rollback protection**

See **`HYBRID_SHORTCUT_SETUP.md`** for complete setup guide.

**What you get:**
- ✅ Main shortcut with native iOS Choose from Menu (System 1)
- ✅ Dedicated rollback shortcut for emergencies (System 2)
- ✅ All 18 commands accessible
- ✅ Page management, global components, content updates
- ✅ Rollback protection for all edits

**Time:** 15 minutes one-time setup

---

### Option 1: Manual Creation (Original System 1)

**On Mac - Shortcuts App (10 minutes):**

1. Open Shortcuts app
2. Create new shortcut: "yellowCircle Command"
3. Add "Choose from Menu" action
4. For each menu item, add "Run Script Over SSH":
   - Host: `Christophers-Mac-mini.local`
   - User: `christopherwilliamson`
   - Script: `cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js [command]`
5. Add to Siri
6. **Result:** Automatically appears on iPhone via iCloud!

See `QUICKSTART.md` for detailed steps.

### Option 2: Programmatic Generation (EXPERIMENTAL)

**Generate shortcuts:**
```bash
npm run generate
```

**Sign shortcuts (optional):**
```bash
npm run sign
```

**Import to iPhone:**
- AirDrop .shortcut files to iPhone
- Or use URL scheme: `shortcuts://import-shortcut/?url=file://...`

**See:** `generated/IMPORT_INSTRUCTIONS.md`

---

## 🛠️ How It Works

### 1. Command Router (`../automation/shortcut-router.js`)

Central command dispatcher that shortcuts call:

```bash
node shortcut-router.js sync      # Syncs roadmap to Notion
node shortcut-router.js wip       # Daily WIP sync
node shortcut-router.js content --page=about --section=headline --text="New"
```

**Benefits:**
- ✅ Add new commands without updating shortcuts
- ✅ Centralized command registry
- ✅ Consistent error handling
- ✅ Easy to maintain

### 2. Shortcuts Generation (`generate-shortcuts.js`)

Uses `shortcuts-js` to create .shortcut files programmatically:

```javascript
const shortcut = buildShortcut(actions, {
  name: 'Rho Sync',
  icon: { color: 'yellow', glyph: 'gear' }
});
fs.writeFileSync('rho-sync.shortcut', shortcut);
```

**Limitations:**
- shortcuts-js doesn't support SSH actions (iOS 12 library)
- Complex menus need manual creation
- Generated shortcuts are simple demonstrations

### 3. iCloud Sync (Automatic!)

```
Mac Shortcuts app → iCloud (10-30 sec) → iPhone Shortcuts app
```

**No export/import needed!** Shortcuts created on Mac appear on iPhone automatically.

---

## 📱 Available Commands

### Via Shortcut Router

| Command | Description | Category |
|---------|-------------|----------|
| `sync` | Sync roadmap to Notion | Sync |
| `wip` | Run daily WIP sync | Sync |
| `deadline` | Check deadline alerts | Alerts |
| `blocked` | Check blocked tasks | Alerts |
| `summary` | Generate weekly summary | Reporting |
| `content` | Update page content | Content |
| `all` | Run all automations | Testing |
| `rho` | Sync Rho project | Projects (future) |
| `unity` | Sync Unity Notes | Projects (future) |
| `personal` | Sync personal tasks | Projects (future) |

### Via Email/GitHub Issues

See `.claude/EMAIL_COMMAND_EXAMPLES.md` for email-based commands with auto-revert.

---

## 📊 NPM Scripts

```bash
npm run generate   # Generate .shortcut files
npm run sign       # Sign shortcuts for import
npm run clean      # Remove generated directory
npm run rebuild    # Clean + generate
```

---

## 🔄 Workflow

### Adding a New Command

**1. Add to Command Router:**

```javascript
// .claude/automation/shortcut-router.js
COMMANDS: {
  'new-command': {
    script: 'npm run new-script',
    description: 'Does something new',
    category: 'automation'
  }
}
```

**2. Test locally:**

```bash
node shortcut-router.js new-command
```

**3. Use from iPhone:**

Shortcut already calls router, so new command is immediately available!

### Adding a New Project Shortcut

**1. Update generator:**

```javascript
// generate-shortcuts.js
const projects = [
  { name: 'New Project Sync', command: 'new-project', description: '...' }
];
```

**2. Generate:**

```bash
npm run generate
```

**3. Import:**

AirDrop `generated/new-project-sync.shortcut` to iPhone

---

## 🔍 Verification

**Check Mac shortcuts:**
```bash
shortcuts list | grep -i yellow
```

**Check iCloud sync status:**
```bash
sqlite3 ~/Library/Shortcuts/Shortcuts.sqlite \
  "SELECT ZNAME, datetime(ZMODIFICATIONDATE + 978307200, 'unixepoch') as Modified
   FROM ZSHORTCUT
   ORDER BY ZMODIFICATIONDATE DESC
   LIMIT 5;"
```

**Test command router:**
```bash
cd .claude/automation
node shortcut-router.js        # Show menu
node shortcut-router.js wip    # Run WIP sync
```

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| `QUICKSTART.md` | 5-minute iPhone setup |
| `PROGRAMMATIC_SHORTCUTS_SOLUTION.md` | Complete technical solution |
| `EMAIL_COMMAND_EXAMPLES.md` | Email/GitHub command templates |
| `generated/IMPORT_INSTRUCTIONS.md` | How to import generated shortcuts |

---

## 🎯 Next Steps

### Today
1. ✅ Create "yellowCircle Command" shortcut manually in Shortcuts app
2. ✅ Verify iCloud sync to iPhone (30 seconds)
3. ✅ Test SSH execution from iPhone
4. ✅ Test voice control: "Hey Siri, yellowCircle command"

### This Week
1. Enable Rho, Unity, Personal commands in router
2. Create project-specific npm scripts
3. Test content updates via iPhone

### Next Week
1. Generate project shortcuts with shortcuts-js
2. Set up auto-generation on roadmap updates
3. Create GitHub Action to generate shortcuts on project additions

---

## 🐛 Troubleshooting

### Shortcut not syncing to iPhone
- Wait 60 seconds for iCloud sync
- Open Shortcuts app on both devices
- Pull to refresh on iPhone
- Check iCloud status: System Settings → iCloud → Shortcuts (ON)

### SSH connection failed
- Verify Mac Mini is on and awake
- Check hostname: `hostname` → `Christophers-Mac-mini.local`
- Verify same WiFi network
- Try IP address instead: `ifconfig | grep "inet "`

### Command not found
- Verify path in shortcut matches actual location
- Check permissions: `ls -la .claude/automation/shortcut-router.js`
- Test manually: `cd .claude/automation && node shortcut-router.js`

### Generated shortcuts don't import
- Sign first: `shortcuts sign -i input.shortcut -o output.shortcut`
- Try AirDrop instead of URL scheme
- Check file isn't corrupted: `file generated/*.shortcut`

---

## 🔗 Related

- **Command Executor**: `.github/workflows/command-executor.yml` - Email/GitHub commands
- **Auto-Revert**: `.github/workflows/auto-revert.yml` - Automatic content rollback
- **Automation Scripts**: `.claude/automation/` - All npm scripts
- **Slash Commands**: `.claude/commands/automation.md` - Claude Code commands

---

**Status:** ✅ Ready to use
**Created:** November 19, 2025
**Last Updated:** November 19, 2025
