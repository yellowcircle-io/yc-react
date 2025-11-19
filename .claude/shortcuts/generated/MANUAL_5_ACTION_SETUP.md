# Manual Setup Instructions for yellowCircle 5-Action Shortcut

## What Was Created

A template shortcut: `yellowcircle-command-5-actions.shortcut`

This needs manual enhancement in Shortcuts app to add SSH functionality.

---

## Complete Setup (10 minutes)

### Step 1: Import Template (Optional)

```bash
cd .claude/shortcuts
shortcuts sign -i generated/yellowcircle-command-5-actions.shortcut -o generated/yellowcircle-command-5-actions-signed.shortcut -m anyone
open "shortcuts://import-shortcut/?url=file://$(pwd)/generated/yellowcircle-command-5-actions-signed.shortcut"
```

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
   1. Sync Roadmap
   2. WIP Sync
   3. Update Content
   4. Check Deadlines
   5. Weekly Summary

---

### Step 4: Add SSH Action for Each Menu Item

For **EACH menu item**, add "Run Script Over SSH" action below it:

#### Common Settings (same for all):
- **Host:** `Christophers-Mac-mini.local`
- **Port:** `22`
- **User:** `christopherwilliamson`
- **Password:** [enter once, saves to keychain]

#### Scripts per menu item:

**1. Sync Roadmap:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js sync
```

**2. WIP Sync:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js wip
```

**3. Update Content:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js content --page=about --section=headline --text="Updated from iPhone"
```

**4. Check Deadlines:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js deadline
```

**5. Weekly Summary:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js summary
```

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

```
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
```

---

## Troubleshooting

### SSH Connection Failed
- Verify Mac Mini is on
- Check hostname: `hostname` → should be `Christophers-Mac-mini.local`
- Try IP instead: `ifconfig | grep "inet "`

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
