# Testing Checklist - yellowCircle Mobile Command System

Complete testing plan for all three execution methods.

---

## 🎯 Pre-Testing Setup (5 minutes)

### Mac Mini Verification

```bash
# 1. Run comprehensive test suite
cd .claude/shortcuts
./test-all-systems.sh
```

**Expected:** All tests pass ✅

```bash
# 2. Verify router is working
cd .claude/automation
node shortcut-router.js
```

**Expected:** Menu displays with all commands

```bash
# 3. Check Mac hostname
hostname
```

**Expected:** `Christophers-Mac-mini.local`

```bash
# 4. Verify SSH is enabled
sudo systemsetup -getremotelogin
```

**Expected:** `Remote Login: On`

```bash
# 5. Check git status
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle
git status
```

**Expected:** Clean working tree or only expected changes

---

## 📋 Test Suite 1: Command Router (Mac Terminal)

**Time:** 10 minutes
**Location:** Mac Mini Terminal
**Status:** ⬜ Not Started

### Test 1.1: Show Menu

```bash
cd .claude/automation
node shortcut-router.js
```

**Expected Output:**
```
📱 yellowCircle Command Router

Available Commands:

SYNC:
  sync         - Sync roadmap to Notion
  wip          - Run daily WIP sync

ALERTS:
  deadline     - Check deadline alerts
  blocked      - Check blocked tasks

REPORTING:
  summary      - Generate weekly summary

CONTENT:
  content      - Update page content

TESTING:
  all          - Run all automations
```

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 1.2: Router - Invalid Command

```bash
node shortcut-router.js invalid-command
```

**Expected:** Error message + available commands list

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 1.3: Router - Deadline Alerts (Safe)

```bash
node shortcut-router.js deadline
```

**Expected:**
- ✅ Executes without errors
- Shows deadline status or "no deadlines"

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 1.4: Router - Blocked Alerts (Safe)

```bash
node shortcut-router.js blocked
```

**Expected:**
- ✅ Executes without errors
- Shows blocked tasks or "no blocked tasks"

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 1.5: Content Update - Validation Only

```bash
node shortcut-router.js content
```

**Expected:**
- ❌ Error: Missing parameters
- Shows usage instructions

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

## 📋 Test Suite 2: Content Update System

**Time:** 15 minutes
**Location:** Mac Mini Terminal
**Status:** ⬜ Not Started

### Test 2.1: Safe Content Update (with revert)

```bash
cd .claude/automation

# Update About page headline
node content-update.js --page=about --section=headline --text="TEST HEADLINE - Will Revert"

# Check changes
cd ../..
git diff src/pages/AboutPage.jsx
```

**Expected:**
- ✅ File modified
- ✅ Git shows headline change
- ✅ Commit created

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 2.2: Verify Live Update

```bash
# Push changes
git push

# Wait 30 seconds for Firebase deploy
sleep 30
```

**Then:** Visit https://yellowcircle-app.web.app/about

**Expected:**
- ✅ Headline shows "TEST HEADLINE - Will Revert"
- ✅ Page loads correctly

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 2.3: Manual Revert

```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle

# Revert the change
git revert HEAD --no-edit

# Push revert
git push
```

**Expected:**
- ✅ Revert commit created
- ✅ After 30 sec, website shows original headline

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

## 📋 Test Suite 3: Shortcuts Generation

**Time:** 10 minutes
**Location:** Mac Mini Terminal
**Status:** ⬜ Not Started

### Test 3.1: Generate Shortcuts

```bash
cd .claude/shortcuts
npm run generate
```

**Expected:**
- ✅ 4 shortcuts created in `generated/`
- ✅ No errors

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 3.2: Sign Shortcuts

```bash
npm run sign
```

**Expected:**
- ✅ Signed versions created with `signed-` prefix
- ✅ No errors

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 3.3: List Generated Files

```bash
ls -lh generated/
```

**Expected Files:**
- `IMPORT_INSTRUCTIONS.md`
- `personal-sync.shortcut`
- `rho-sync.shortcut`
- `unity-sync.shortcut`
- `yellowcircle-command-generated.shortcut`
- `signed-*.shortcut` (if signed)

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

## 📋 Test Suite 4: Mac Shortcut Creation

**Time:** 5 minutes
**Location:** Mac Mini Terminal
**Status:** ⬜ Not Started

### Test 4.1: Create Mac Shortcut

```bash
cd .claude/shortcuts
./create-mac-shortcut.sh
```

**Expected:**
- ✅ Shortcut generated
- ✅ Shortcut signed
- ✅ Shortcuts app opens with import prompt

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 4.2: Verify in Shortcuts App

```bash
shortcuts list | grep -i yellowcircle
```

**Expected:**
- Shows "yellowCircle Command" or similar

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 4.3: Run Shortcut from CLI

```bash
shortcuts run "yellowCircle Command"
```

**Expected:**
- Shortcut executes (may show info message)

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

## 📋 Test Suite 5: iCloud Sync

**Time:** 5 minutes
**Location:** Mac + iPhone
**Status:** ⬜ Not Started

### Test 5.1: Wait for iCloud Sync

⏱️ **Wait 30-60 seconds after creating Mac shortcut**

---

### Test 5.2: Check iPhone Shortcuts App

📱 **On iPhone:**
1. Open Shortcuts app
2. Pull to refresh
3. Look for "yellowCircle Command" or generated shortcuts

**Expected:**
- ✅ Shortcut appears on iPhone
- ✅ Can open and view shortcut

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 5.3: Verify Sync Status (Mac)

```bash
sqlite3 ~/Library/Shortcuts/Shortcuts.sqlite \
  "SELECT ZNAME, datetime(ZMODIFICATIONDATE + 978307200, 'unixepoch') as Modified
   FROM ZSHORTCUT
   ORDER BY ZMODIFICATIONDATE DESC
   LIMIT 5;"
```

**Expected:**
- Recent modification time for yellowCircle shortcut
- Indicates iCloud sync activity

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

## 📋 Test Suite 6: Manual iPhone Shortcut (RECOMMENDED)

**Time:** 10 minutes
**Location:** Mac Shortcuts App
**Status:** ⬜ Not Started

**Note:** This creates a FULL-FEATURED shortcut with SSH menu (recommended over generated version)

### Test 6.1: Create Rich Shortcut

📱 **On Mac Shortcuts App:**

1. Click **+** (New Shortcut)
2. Name: "yellowCircle Command"
3. Add **Choose from Menu**:
   - Prompt: "Select Command"
   - Add items: Sync, WIP, Deadline, Content
4. For each item, add **Run Script Over SSH**:
   - Host: `Christophers-Mac-mini.local`
   - Port: `22`
   - User: `christopherwilliamson`
   - Password: [enter once, saves to keychain]
   - Script: `cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js [command]`

**Commands per menu item:**
- Sync: `node shortcut-router.js sync`
- WIP: `node shortcut-router.js wip`
- Deadline: `node shortcut-router.js deadline`
- Content: `node shortcut-router.js content --page=about --section=headline --text="From iPhone"`

**Result:** ⬜ Created / ⬜ Skipped
**Notes:** _______________________________

---

### Test 6.2: Add to Siri

📱 **On Mac Shortcuts App:**
1. Right-click shortcut → Details
2. Click "Add to Siri"
3. Record phrase: "yellowCircle command"

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 6.3: Test on Mac

📱 **On Mac:**
1. Open Shortcuts app
2. Run "yellowCircle Command"
3. Choose "Deadline"

**Expected:**
- ✅ SSH connection succeeds
- ✅ Command executes on Mac Mini
- ✅ Results shown in Shortcuts app

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 6.4: Wait for iPhone Sync

⏱️ **Wait 30-60 seconds**

---

### Test 6.5: Test on iPhone

📱 **On iPhone:**
1. Open Shortcuts app
2. Find "yellowCircle Command"
3. Run it
4. Choose "Deadline"

**Expected:**
- ✅ Menu appears
- ✅ SSH connects to Mac Mini
- ✅ Command executes
- ✅ Results shown

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

### Test 6.6: Test Siri on iPhone

📱 **On iPhone:**

🗣️ "Hey Siri, yellowCircle command"

**Expected:**
- ✅ Siri recognizes command
- ✅ Menu appears
- ✅ Can select and execute

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

## 📋 Test Suite 7: Email/GitHub Commands

**Time:** 10 minutes
**Location:** GitHub
**Status:** ⬜ Not Started

### Test 7.1: Simple Command via GitHub Issue

📧 **Create GitHub Issue:**
- **Repository:** yellowcircle-io/yc-react
- **Title:** "Test Command - WIP Sync"
- **Labels:** `command`
- **Body:**
```
wip sync
```

**Expected:**
1. ✅ GitHub Action triggers (~30 seconds)
2. ✅ Issue gets comment with results
3. ✅ Issue closed with `executed` label

**Result:** ⬜ Pass / ⬜ Fail
**Issue #:** _______
**Notes:** _______________________________

---

### Test 7.2: Content Update via GitHub Issue

📧 **Create GitHub Issue:**
- **Title:** "Test Content Update"
- **Labels:** `command`
- **Body:**
```
content update
page: about
section: headline
text: "TEST from GitHub - No Revert"
```

**Expected:**
1. ✅ GitHub Action triggers
2. ✅ Content updates
3. ✅ Commit created
4. ✅ Issue comment with results
5. ✅ Live at yellowcircle-app.web.app/about

**Result:** ⬜ Pass / ⬜ Fail
**Issue #:** _______
**Notes:** _______________________________

---

### Test 7.3: Content Update with Auto-Revert

📧 **Create GitHub Issue:**
- **Title:** "Test Auto-Revert"
- **Labels:** `command`
- **Body:**
```
content update
page: about
section: headline
text: "TEST - Will Auto-Revert in 1 Hour"
revert: 1h
```

**Expected (Immediate):**
1. ✅ Content updates
2. ✅ Issue labeled `auto-revert`
3. ✅ Comment: "⏰ Auto-Revert Scheduled"
4. ✅ Commit hash stored

**Expected (After 1 Hour):**
5. ✅ Auto-revert workflow runs
6. ✅ Change reverted
7. ✅ Comment: "⏪ Auto-Revert Executed"
8. ✅ Label removed

**Result (Immediate):** ⬜ Pass / ⬜ Fail
**Result (After 1 Hour):** ⬜ Pass / ⬜ Fail
**Issue #:** _______
**Notes:** _______________________________

---

### Test 7.4: Manual Auto-Revert Trigger

```bash
# Trigger auto-revert workflow manually (don't wait 1 hour)
```

📧 **On GitHub:**
1. Go to Actions tab
2. Select "Auto-Revert Content Changes"
3. Click "Run workflow"
4. Click "Run workflow" button

**Expected:**
- ✅ Workflow runs
- ✅ Finds issue with `auto-revert` label
- ✅ Reverts commit
- ✅ Comments on issue

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

## 📋 Test Suite 8: Interactive Command Tests

**Time:** 5 minutes
**Location:** Mac Mini Terminal
**Status:** ⬜ Not Started

### Test 8.1: Interactive Test Menu

```bash
cd .claude/shortcuts
./test-commands.sh
```

Run through menu and test:
- ⬜ Show menu
- ⬜ Deadline alerts
- ⬜ Blocked alerts
- ⬜ Test all safe commands

**Result:** ⬜ Pass / ⬜ Fail
**Notes:** _______________________________

---

## 📊 Test Summary

| Test Suite | Status | Pass/Fail | Notes |
|------------|--------|-----------|-------|
| 1. Command Router | ⬜ | __ / __ | |
| 2. Content Update | ⬜ | __ / __ | |
| 3. Shortcuts Generation | ⬜ | __ / __ | |
| 4. Mac Shortcut | ⬜ | __ / __ | |
| 5. iCloud Sync | ⬜ | __ / __ | |
| 6. iPhone Shortcut | ⬜ | __ / __ | |
| 7. Email/GitHub | ⬜ | __ / __ | |
| 8. Interactive Tests | ⬜ | __ / __ | |

**Overall Status:** ⬜ Not Started / ⬜ In Progress / ⬜ Complete

**Total Tests:** ____ passed, ____ failed out of ____

---

## 🚀 Quick Start (Recommended Order)

**Day 1 - Foundation (30 min):**
1. ✅ Run `./test-all-systems.sh` (verify all systems)
2. ✅ Test router commands via `./test-commands.sh`
3. ✅ Test content update (with revert)

**Day 1 - Mac Shortcut (15 min):**
4. ✅ Create manual shortcut in Shortcuts app
5. ✅ Test on Mac
6. ✅ Add to Siri

**Day 1 - iPhone (5 min):**
7. ⏱️ Wait 30 seconds for iCloud sync
8. ✅ Test on iPhone
9. ✅ Test Siri on iPhone

**Day 2 - Email System (15 min):**
10. ✅ Test simple GitHub issue command
11. ✅ Test content update via issue
12. ✅ Test auto-revert (wait 1 hour or trigger manually)

**Day 2 - Polish (10 min):**
13. ✅ Generate Trimurti shortcuts
14. ✅ Import additional shortcuts
15. ✅ Final verification

---

## 🐛 Troubleshooting

**SSH Connection Failed:**
```bash
# Verify hostname
hostname

# Verify SSH enabled
sudo systemsetup -getremotelogin

# Get IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Use IP instead: ssh christopherwilliamson@192.168.X.X
```

**Shortcut Not Syncing:**
```bash
# Force iCloud sync
# 1. Open Shortcuts app on Mac
# 2. Wait 60 seconds
# 3. Open Shortcuts app on iPhone
# 4. Pull to refresh
```

**Content Update Failed:**
```bash
# Check file exists
ls -la src/pages/AboutPage.jsx

# Check permissions
cd .claude/automation
node content-update.js --page=about --section=headline --text="Test"

# View error
npm run content:update -- --page=about --section=headline --text="Test"
```

---

**Testing Date:** _________________
**Tested By:** _________________
**System Version:** Mobile Command System v1.0
**Status:** ✅ Ready for Production / ⚠️ Issues Found / ❌ Not Ready
