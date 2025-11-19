#!/usr/bin/env node

/**
 * Create yellowCircle Command Shortcut with 5 Actions
 *
 * This creates a shortcut with menu for:
 * - Sync Roadmap
 * - WIP Sync
 * - Update Content
 * - Check Deadlines
 * - Weekly Summary
 *
 * Note: shortcuts-js has limitations with SSH actions.
 * This creates a template that shows the structure.
 * For full SSH functionality, use manual creation in Shortcuts app.
 */

const fs = require('fs');
const path = require('path');
const { buildShortcut, withVariables } = require('@joshfarrant/shortcuts-js');
const actions = require('@joshfarrant/shortcuts-js/actions');

const OUTPUT_DIR = path.join(__dirname, 'generated');

console.log('╔════════════════════════════════════════════╗');
console.log('║  Creating yellowCircle 5-Action Shortcut  ║');
console.log('╚════════════════════════════════════════════╝');
console.log('');

// SSH configuration
const SSH_HOST = 'Christophers-Mac-mini.local';
const SSH_USER = 'christopherwilliamson';
const BASE_PATH = '~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation';

// Create the menu structure
// Note: shortcuts-js doesn't support "Choose from Menu" or "Run Script Over SSH"
// So we create a demonstration version that shows what needs to be added manually

const menuItems = [
  {
    name: 'Sync Roadmap',
    command: 'sync',
    description: 'Sync roadmap to Notion database',
    script: `cd ${BASE_PATH} && node shortcut-router.js sync`
  },
  {
    name: 'WIP Sync',
    command: 'wip',
    description: 'Run daily WIP sync to Notion',
    script: `cd ${BASE_PATH} && node shortcut-router.js wip`
  },
  {
    name: 'Update Content',
    command: 'content',
    description: 'Update page content (requires input)',
    script: `cd ${BASE_PATH} && node shortcut-router.js content --page=about --section=headline --text="Updated from iPhone"`
  },
  {
    name: 'Check Deadlines',
    command: 'deadline',
    description: 'Check for upcoming deadlines',
    script: `cd ${BASE_PATH} && node shortcut-router.js deadline`
  },
  {
    name: 'Weekly Summary',
    command: 'summary',
    description: 'Generate weekly summary report',
    script: `cd ${BASE_PATH} && node shortcut-router.js summary`
  }
];

// Build shortcut with information about the actions
const shortcutActions = [
  actions.comment({
    text: `yellowCircle Command Center - 5 Actions

This shortcut needs manual enhancement in Shortcuts app:

1. Replace this with "Choose from Menu" action
2. Add menu items: ${menuItems.map(m => m.name).join(', ')}
3. For each item, add "Run Script Over SSH":
   - Host: ${SSH_HOST}
   - User: ${SSH_USER}
   - Script: [see instructions below]

SSH Scripts per action:
${menuItems.map(m => `
${m.name}:
${m.script}
`).join('')}

After manual setup:
- Add to Siri: "yellowCircle command"
- Will auto-sync to iPhone via iCloud
- Full voice control ready
`
  }),
  actions.showResult({
    text: withVariables`yellowCircle Command System

To complete setup:
1. Open this shortcut in Shortcuts app
2. Add "Choose from Menu" action
3. Add menu items for each command
4. Add SSH actions (template provided in comment)
5. Test on Mac
6. Wait 30 sec for iCloud sync
7. Use on iPhone!

See .claude/shortcuts/TOMORROW_QUICK_START.md for details.`
  })
];

console.log('📱 Building shortcut structure...');

const shortcut = buildShortcut(shortcutActions, {
  name: 'yellowCircle Command',
  icon: {
    color: 4282601983, // Yellow color
    glyph: 'Gear'
  }
});

const filename = 'yellowcircle-command-5-actions.shortcut';
const filepath = path.join(OUTPUT_DIR, filename);

fs.writeFileSync(filepath, shortcut);

console.log(`✅ Created: ${filename}`);
console.log('');
console.log('📝 Template shortcut created');
console.log('⚠️  Requires manual enhancement for full SSH functionality');
console.log('');

// Create detailed manual instructions
const instructions = `# Manual Setup Instructions for yellowCircle 5-Action Shortcut

## What Was Created

A template shortcut: \`${filename}\`

This needs manual enhancement in Shortcuts app to add SSH functionality.

---

## Complete Setup (10 minutes)

### Step 1: Import Template (Optional)

\`\`\`bash
cd .claude/shortcuts
shortcuts sign -i generated/${filename} -o generated/${filename.replace('.shortcut', '-signed.shortcut')} -m anyone
open "shortcuts://import-shortcut/?url=file://$(pwd)/generated/${filename.replace('.shortcut', '-signed.shortcut')}"
\`\`\`

OR: Create from scratch in Shortcuts app (recommended for full control)

---

### Step 2: Create Shortcut in Shortcuts App

**Open Shortcuts app on Mac**

1. Click **+** (New Shortcut)
2. Name: **"yellowCircle Command"**
3. Icon: Click icon → Choose yellow color + gear icon

---

### Step 3: Add Choose from Menu

1. Search for **"Choose from Menu"**
2. Drag to shortcut area
3. Prompt: **"yellowCircle Command"**
4. Add 5 menu items:
${menuItems.map((m, i) => `   ${i + 1}. ${m.name}`).join('\n')}

---

### Step 4: Add SSH Action for Each Menu Item

For **EACH menu item**, add "Run Script Over SSH" action below it:

#### Common Settings (same for all):
- **Host:** \`${SSH_HOST}\`
- **Port:** \`22\`
- **User:** \`${SSH_USER}\`
- **Password:** [enter once, saves to keychain]

#### Scripts per menu item:

**1. Sync Roadmap:**
\`\`\`bash
${menuItems[0].script}
\`\`\`

**2. WIP Sync:**
\`\`\`bash
${menuItems[1].script}
\`\`\`

**3. Update Content:**
\`\`\`bash
${menuItems[2].script}
\`\`\`

**4. Check Deadlines:**
\`\`\`bash
${menuItems[3].script}
\`\`\`

**5. Weekly Summary:**
\`\`\`bash
${menuItems[4].script}
\`\`\`

---

### Step 5: Add Show Result (Optional)

After all SSH actions, add **"Show Result"** to display output.

---

### Step 6: Add to Siri

1. Right-click shortcut → **Details**
2. Click **"Add to Siri"**
3. Record phrase: **"yellowCircle command"**

---

### Step 7: Test on Mac

1. Run shortcut
2. Choose a menu item
3. Verify SSH connection works
4. Check output

---

### Step 8: iCloud Sync to iPhone

⏱️ **Wait 30-60 seconds**

iPhone Shortcuts app will automatically receive the shortcut via iCloud!

---

### Step 9: Test on iPhone

📱 **On iPhone:**
1. Open Shortcuts app
2. Pull to refresh if needed
3. Tap "yellowCircle Command"
4. Choose action
5. Verify it works

🗣️ **Voice test:**
"Hey Siri, yellowCircle command"

---

## Shortcut Structure

\`\`\`
yellowCircle Command
├─ Choose from Menu
│  ├─ Sync Roadmap
│  │  └─ Run Script Over SSH → sync
│  ├─ WIP Sync
│  │  └─ Run Script Over SSH → wip
│  ├─ Update Content
│  │  └─ Run Script Over SSH → content
│  ├─ Check Deadlines
│  │  └─ Run Script Over SSH → deadline
│  └─ Weekly Summary
│     └─ Run Script Over SSH → summary
└─ Show Result (optional)
\`\`\`

---

## Troubleshooting

### SSH Connection Failed
- Verify Mac Mini is on
- Check hostname: \`hostname\` → should be \`${SSH_HOST}\`
- Try IP instead: \`ifconfig | grep "inet "\`

### Password Prompt Every Time
- First run: Enter password, it saves to keychain
- If still prompts: Check Keychain Access for saved SSH credentials

### Shortcut Not Syncing to iPhone
- Open Shortcuts app on Mac (forces sync)
- Wait 60 seconds
- Open Shortcuts app on iPhone
- Pull to refresh

---

## Expected Result

✅ **Mac:** Full 5-action menu with SSH execution
✅ **iPhone:** Same shortcut via iCloud sync (30 sec)
✅ **Voice:** "Hey Siri, yellowCircle command" works
✅ **Execution:** All 5 commands work from iPhone

---

**Setup Time:** 10 minutes
**Auto-sync:** 30 seconds Mac → iPhone
**Ready to use!**
`;

const instructionsPath = path.join(OUTPUT_DIR, 'MANUAL_5_ACTION_SETUP.md');
fs.writeFileSync(instructionsPath, instructions);

console.log(`📄 Created: MANUAL_5_ACTION_SETUP.md`);
console.log('');
console.log('╔════════════════════════════════════════════╗');
console.log('║  Next Steps                                ║');
console.log('╚════════════════════════════════════════════╝');
console.log('');
console.log('1. Open Shortcuts app on Mac');
console.log('2. Follow: generated/MANUAL_5_ACTION_SETUP.md');
console.log('3. Create 5-action menu with SSH');
console.log('4. Add to Siri');
console.log('5. Wait 30 sec for iCloud sync');
console.log('6. Test on iPhone!');
console.log('');
console.log(`Output: ${OUTPUT_DIR}`);
console.log('');
