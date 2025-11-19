# Programmatic Apple Shortcuts Solution

## Answer to Your Question: "Can Shortcuts be Created Automatically?"

**YES - with important caveats:**

Apple Shortcuts CAN be:
1. ✅ Created programmatically using JavaScript (`shortcuts-js`)
2. ✅ Signed using macOS CLI (`shortcuts sign`)
3. ✅ Auto-synced via iCloud to all your devices
4. ✅ Updated by changing referenced scripts (not the shortcut itself)

**BUT:**
- iOS 15+ shortcuts are signed and encrypted
- SSH actions are complex to generate programmatically
- **Best approach**: Create template once, then update the scripts it calls

---

## Recommended Solution: Hybrid Approach

### Strategy
1. **One-time manual creation** - Create SSH-based shortcut on Mac (5 min)
2. **iCloud auto-sync** - Shortcut appears on iPhone automatically (instant)
3. **Programmatic updates** - Update scripts/configs that shortcuts reference
4. **Future: shortcuts-js** - Generate simple shortcuts for new Trimurti projects

### Why This Works
- **iCloud already syncs** - Shortcuts created on Mac appear on iPhone in seconds
- **Scripts are parameterized** - Changing scripts updates behavior without touching shortcut
- **Zero iPhone setup** - Create everything on Mac, use instantly on iPhone
- **Trimurti scalability** - New projects = new scripts, not new shortcuts

---

## Implementation Plan

### Phase 1: Template Creation (TODAY - 10 minutes)

**On Mac Mini Shortcuts App:**

1. Open Shortcuts app
2. Click **+** (New Shortcut)
3. Name: **"yellowCircle Command"**
4. Add actions:
   - **Choose from Menu** → Prompt: "Select Command"
   - Menu items:
     - Sync Roadmap
     - WIP Sync
     - Content Update
     - Check Deadlines
     - Weekly Summary
   - For each item: **Run Script Over SSH**
     - Host: `Christophers-Mac-mini.local`
     - Port: `22`
     - User: `christopherwilliamson`
     - Password: [saved in keychain]
     - Script: (see below)

**SSH Scripts to Use:**

```bash
# Sync Roadmap
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && npm run sync

# WIP Sync
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && npm run wip:sync

# Content Update
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && npm run content:update -- --page=about --section=headline --text="$(osascript -e 'text returned of (display dialog "Enter new text:" default answer "")')"

# Check Deadlines
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && npm run alerts:deadline

# Weekly Summary
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && npm run summary:weekly
```

5. **Add to Siri**: Tap ⓘ → Add to Siri → "yellowCircle command"
6. **iCloud syncs automatically** → Appears on iPhone in 10-30 seconds

**Result:** Full mobile command system ready with ZERO iPhone setup!

---

### Phase 2: Programmatic Scripts (IN PROGRESS)

**Create dynamic script loader:**

```javascript
// .claude/automation/shortcut-router.js
#!/usr/bin/env node

const commands = {
  'sync': 'npm run sync',
  'wip': 'npm run wip:sync',
  'deadline': 'npm run alerts:deadline',
  'blocked': 'npm run alerts:blocked',
  'summary': 'npm run summary:weekly'
};

const command = process.argv[2];
if (commands[command]) {
  require('child_process').execSync(commands[command], {stdio: 'inherit'});
} else {
  console.log('Available commands:', Object.keys(commands).join(', '));
}
```

**Update shortcut to call single script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js sync
```

**Benefit:** Add new commands to `shortcut-router.js` without touching shortcut

---

### Phase 3: shortcuts-js for New Projects (NEXT WEEK)

**Use shortcuts-js to generate simple shortcuts for Trimurti projects:**

```javascript
// .claude/shortcuts/generate-project-shortcuts.js
const { buildShortcut, withVariables } = require('@joshfarrant/shortcuts-js');
const { comment, runShellScript, showResult } = require('@joshfarrant/shortcuts-js/actions');

// Generate shortcut for each Trimurti project
const projects = ['rho', 'unity', 'personal', 'golden-unknown'];

projects.forEach(project => {
  const actions = [
    comment({ text: `${project} Project Command` }),
    runShellScript({
      script: `cd ~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation && npm run ${project}:sync`
    }),
    showResult()
  ];

  const shortcut = buildShortcut(actions, {
    name: `${project} Sync`,
    icon: { color: 'blue', glyph: 'gear' }
  });

  // Write .shortcut file
  require('fs').writeFileSync(`${project}-sync.shortcut`, shortcut);
});
```

**Sign shortcuts:**
```bash
shortcuts sign -i rho-sync.shortcut -o rho-sync-signed.shortcut -m anyone
```

**Import via URL scheme:**
```bash
open "shortcuts://import-shortcut/?url=file:///path/to/rho-sync-signed.shortcut&name=Rho%20Sync&silent=true"
```

**Result:** Auto-generated shortcuts for all Trimurti projects

---

## How iCloud Sync Works

**Automatic Syncing:**
1. Create/edit shortcut on **Mac** → Saves to `~/Library/Shortcuts/Shortcuts.sqlite`
2. **iCloud** detects change → Syncs to iCloud servers (10-30 seconds)
3. **iPhone** receives update → Shortcut appears/updates automatically
4. **No manual export/import needed!**

**Verification:**
```bash
# On Mac - Check when shortcut was last modified
sqlite3 ~/Library/Shortcuts/Shortcuts.sqlite \
  "SELECT ZNAME, datetime(ZMODIFICATIONDATE + 978307200, 'unixepoch') as Modified
   FROM ZSHORTCUT
   ORDER BY ZMODIFICATIONDATE DESC
   LIMIT 5;"
```

**Force Sync (if needed):**
- Mac: Open Shortcuts app → Wait 10 seconds
- iPhone: Open Shortcuts app → Pull to refresh

---

## Programmatic Updates: What Changes What

| Change Type | Requires Shortcut Update | Auto-Syncs |
|-------------|-------------------------|------------|
| **Add new npm script** | ❌ No (if using router) | ✅ Via code |
| **Change script behavior** | ❌ No | ✅ Via code |
| **Add menu item** | ✅ Yes | ✅ Via iCloud |
| **Change SSH host** | ✅ Yes | ✅ Via iCloud |
| **Add new project** | ✅ Yes (or use shortcuts-js) | ✅ Via iCloud |

**Key Insight:**
- **90% of updates** = change scripts only (no shortcut modification)
- **10% of updates** = add menu items (shortcut updates via iCloud)

---

## Testing Plan (Tomorrow)

### Test 1: iCloud Sync
1. ✅ Create "yellowCircle Command" shortcut on Mac
2. ⏱️ Wait 30 seconds
3. 📱 Open Shortcuts app on iPhone
4. ✅ Verify shortcut appears
5. 🗣️ Test Siri: "Hey Siri, yellowCircle command"

### Test 2: SSH Execution
1. 📱 Run "WIP Sync" from iPhone
2. ✅ Verify Mac executes command
3. ✅ Check output on iPhone

### Test 3: Content Update
1. 📱 Choose "Content Update"
2. 📝 Enter text via iPhone dialog
3. ✅ Verify yellowCircle-app.web.app updates
4. 💬 Check GitHub commit

---

## Future: Full Automation

**Goal:** Generate shortcuts as Trimurti projects evolve

**Workflow:**
1. **Add new project to roadmap** → Triggers GitHub Action
2. **Action runs generate-shortcuts.js** → Creates .shortcut file
3. **Signs with `shortcuts sign`** → Makes it importable
4. **Commits to repo** → Available for manual import
5. **Future:** Auto-import via URL scheme on iPhone

**Limitation:**
- Cannot auto-import without user action (iOS security)
- But can auto-generate + commit for easy manual import

---

## Summary: What You Can Do

### TODAY (Mac Mini only - iPhone auto-syncs):
1. ✅ Create "yellowCircle Command" shortcut in Shortcuts app (10 min)
2. ✅ Appears on iPhone automatically via iCloud (30 sec)
3. ✅ Voice control: "Hey Siri, yellowCircle command"
4. ✅ Full menu of all automation commands

### THIS WEEK (Programmatic):
1. ✅ Create shortcut-router.js for dynamic command loading
2. ✅ Update shortcuts to call router (one-time change)
3. ✅ Add new commands by editing router only (no shortcut changes)

### NEXT WEEK (shortcuts-js):
1. ✅ Generate .shortcut files for Trimurti projects
2. ✅ Sign and commit to repo
3. ✅ Import via URL scheme or AirDrop
4. ✅ Update as projects evolve

---

## Direct Answer to Your Questions

**Q: Can Apple Shortcuts be created automatically?**
✅ YES - using shortcuts-js + shortcuts CLI sign

**Q: Can we create a template on Mac Mini that ports to iPhone?**
✅ YES - iCloud handles this automatically (no manual port needed!)

**Q: Can it auto-add via iCloud to iPhone?**
✅ YES - 100% automatic, 10-30 second sync

**Q: Can we do programmatic updates for Trimurti projects?**
✅ YES - via shortcuts-js generation + iCloud sync

---

## Ready to Implement

**Next steps:**
1. Create yellowCircle Command shortcut on Mac (10 min using Shortcuts app)
2. Test iCloud sync to iPhone (30 seconds)
3. Test SSH execution from iPhone
4. Create shortcut-router.js for dynamic updates
5. Generate Trimurti project shortcuts with shortcuts-js

**The shortcut itself syncs via iCloud automatically. No manual porting needed!**
