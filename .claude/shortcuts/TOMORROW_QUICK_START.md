# Tomorrow's Quick Start Guide

**Goal:** Get yellowCircle mobile commands working on iPhone in 15 minutes.

---

## Option 1: One-Command Setup (FASTEST - 5 min)

```bash
cd .claude/shortcuts

# Run comprehensive tests first
./test-all-systems.sh

# Create Mac shortcut (generates, signs, imports)
./create-mac-shortcut.sh
```

**Result:**
- ✅ Shortcut created on Mac
- ✅ Auto-syncs to iPhone via iCloud (30 seconds)
- ✅ Ready to use!

---

## Option 2: Manual Rich Shortcut (RECOMMENDED - 10 min)

**Why:** Full SSH menu with all commands, better than generated version

**On Mac Shortcuts App:**

### Step 1: Create Shortcut
1. Open Shortcuts app
2. Click **+** (New Shortcut)
3. Name: **"yellowCircle Command"**

### Step 2: Add Menu
- Add action: **"Choose from Menu"**
- Prompt: **"Select Command"**
- Add menu items:
  - Sync Roadmap
  - WIP Sync
  - Check Deadlines
  - Update Content

### Step 3: Add SSH Actions (for each menu item)

**For "Sync Roadmap":**
- Add: **"Run Script Over SSH"**
- Host: `Christophers-Mac-mini.local`
- Port: `22`
- User: `christopherwilliamson`
- Password: [enter once, saves to keychain]
- Script:
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js sync
```

**For "WIP Sync":**
- Same SSH settings
- Script: `... && node shortcut-router.js wip`

**For "Check Deadlines":**
- Same SSH settings
- Script: `... && node shortcut-router.js deadline`

**For "Update Content":**
- Same SSH settings
- Script: `... && node shortcut-router.js content --page=about --section=headline --text="From iPhone"`

### Step 4: Add to Siri
1. Right-click shortcut → **Details**
2. Click **"Add to Siri"**
3. Record: **"yellowCircle command"**

### Step 5: Wait for iCloud Sync
⏱️ **Wait 30 seconds**

### Step 6: Test on iPhone
📱 Open Shortcuts app on iPhone → Run "yellowCircle Command"

---

## Testing (5 min)

### Quick Verification

```bash
cd .claude/shortcuts

# Interactive command tests
./test-commands.sh

# Choose option 1: Show menu
# Choose option 4: Test Deadline Alerts
```

### iPhone Test

📱 **On iPhone:**
1. Open Shortcuts app
2. Run "yellowCircle Command"
3. Choose "Check Deadlines"
4. Verify output

🗣️ **Voice test:**
"Hey Siri, yellowCircle command"

---

## Full Testing (Tomorrow)

Follow complete checklist:

```bash
# Open testing guide
cat .claude/shortcuts/TESTING_CHECKLIST.md

# Or follow step-by-step
open .claude/shortcuts/TESTING_CHECKLIST.md
```

**Test Suites:**
1. ✅ Command Router (Mac Terminal)
2. ✅ Content Update System
3. ✅ Shortcuts Generation
4. ✅ Mac Shortcut Creation
5. ✅ iCloud Sync
6. ✅ iPhone Shortcut (Manual + Voice)
7. ✅ Email/GitHub Commands
8. ✅ Auto-Revert System

**Expected Time:** 1 hour for complete testing

---

## Quick Reference

### Mac Terminal Commands

```bash
# Show router menu
cd .claude/automation
node shortcut-router.js

# Test deadline alerts
node shortcut-router.js deadline

# Test content update (safe, with revert)
node content-update.js --page=about --section=headline --text="TEST"
git diff
git checkout -- src/pages/  # Revert

# Run comprehensive tests
cd .claude/shortcuts
./test-all-systems.sh
```

### Verify Setup

```bash
# Check hostname
hostname
# Expected: Christophers-Mac-mini.local

# Check shortcuts CLI
shortcuts list | grep -i yellowcircle

# Check generated files
ls -la .claude/shortcuts/generated/
```

### Troubleshooting

**SSH fails:**
```bash
# Get IP address
ifconfig | grep "inet " | grep -v 127.0.0.1
# Use IP instead of hostname in shortcut
```

**iCloud not syncing:**
```bash
# Force sync
open /Applications/Shortcuts.app  # On Mac
# Wait 60 seconds
# Open Shortcuts app on iPhone
# Pull to refresh
```

**Content update fails:**
```bash
# Verify file exists
ls -la src/pages/AboutPage.jsx

# Test router
cd .claude/automation
node shortcut-router.js content --page=about --section=headline --text="Test"
```

---

## Expected Results

### After Setup:
- ✅ Mac shortcut created and working
- ✅ iPhone shortcut synced via iCloud
- ✅ Voice control: "Hey Siri, yellowCircle command"
- ✅ Can execute any automation from iPhone
- ✅ Can update content via voice

### Test Results:
- ✅ 33/33 automated tests passing
- ✅ All manual tests verified
- ✅ Email/GitHub commands working
- ✅ Auto-revert functional

### Production Ready:
- ✅ Mobile command system operational
- ✅ Three execution methods available
- ✅ Safe testing with auto-revert
- ✅ Programmatic shortcut generation
- ✅ Full documentation

---

## Time Breakdown

| Task | Time | Status |
|------|------|--------|
| Run test suite | 2 min | Ready now |
| Create Mac shortcut | 10 min | Manual creation |
| iCloud sync wait | 30 sec | Automatic |
| Test on iPhone | 3 min | Verification |
| Test voice control | 1 min | Siri test |
| **TOTAL** | **15 min** | **Ready to start** |

---

## Success Criteria

You'll know it's working when:

1. ✅ Mac terminal: `shortcuts list | grep yellowCircle` shows the shortcut
2. ✅ iPhone: Shortcut appears in Shortcuts app (after 30 sec)
3. ✅ Mac: Running shortcut executes command and shows results
4. ✅ iPhone: Running shortcut via tap works
5. ✅ iPhone: "Hey Siri, yellowCircle command" works
6. ✅ Content update: Changes appear on yellowcircle-app.web.app

---

## Files to Reference

| File | Purpose |
|------|---------|
| `TESTING_CHECKLIST.md` | Complete manual testing guide |
| `test-all-systems.sh` | 33 automated tests |
| `test-commands.sh` | Interactive command testing |
| `create-mac-shortcut.sh` | One-command Mac setup |
| `PROGRAMMATIC_SHORTCUTS_SOLUTION.md` | Technical details |
| `QUICKSTART.md` | Original 5-minute guide |
| `README.md` | System overview |

---

**Start here tomorrow:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/shortcuts
./test-all-systems.sh && ./create-mac-shortcut.sh
```

**Then:** Follow TESTING_CHECKLIST.md for complete verification.

**Ready to use!** 🎉
