# 📱 iPhone Testing Guide - yellowCircle Automation

**Status:** Ready for Testing
**Machine:** MacBook Air
**Date:** November 22, 2025

---

## 🎯 Testing Objective

Validate the complete iPhone SSH workflow works from actual iPhone device:
- Menu navigation
- Command execution
- Preview/confirmation flows
- Rollback functionality
- Visual display on iPhone screen

---

## ⚙️ Pre-Test Setup

### Step 1: Verify Mac is Ready

```bash
# On MacBook Air, verify these files exist:
ls -la ~/.claude/automation/iphone-menu.js
ls -la ~/.claude/automation/shortcut-router.js
ls -la ~/src/config/globalContent.js

# Should see all 3 files
```

### Step 2: Check Network Connectivity

```bash
# Get MacBook Air IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example output: inet 192.168.1.100 netmask...
# Note the IP address for iPhone SSH connection
```

### Step 3: Verify SSH is Enabled

**On MacBook Air:**
1. System Settings → General → Sharing
2. Enable "Remote Login"
3. Note your username (should be: christophercooper)

### Step 4: Test SSH Locally (MacBook Air)

```bash
# Test SSH to yourself (validate SSH server works)
ssh christophercooper@localhost

# Should connect without errors
# Type 'exit' to disconnect
```

---

## 📱 iPhone Testing Procedure

### Test 1: Basic SSH Connection

**On iPhone (using Shortcuts app or SSH client like Termius):**

```bash
ssh christophercooper@[MacBook Air IP]
# Example: ssh christophercooper@192.168.1.100

# Enter password when prompted
```

**Expected Result:**
- ✅ Connection successful
- ✅ See terminal prompt
- ✅ Can execute basic commands (ls, pwd)

**If fails:** Check IP address, verify both on same WiFi network

---

### Test 2: Navigate to Automation Directory

```bash
cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
pwd
ls -la iphone-menu.js
```

**Expected Result:**
- ✅ Directory exists
- ✅ iphone-menu.js file visible
- ✅ File is executable (x permission)

**If fails:**
- Check Dropbox path on MacBook Air
- May need different path: `~/Library/CloudStorage/Dropbox/...`
- Run on MacBook: `echo $HOME/Dropbox`

---

### Test 3: Launch Menu Interface

```bash
node iphone-menu.js
```

**Expected Result:**
```
🚀 Starting yellowCircle iPhone Menu...

==================================================
📱 yellowCircle Mobile Commands
==================================================

  [1] Global Components
  [2] Page Management
  [3] Content Updates
  [4] Sync & Alerts
  [5] View History
  [q] Quit

Select option:
```

**Visual Check:**
- ✅ Menu displays clearly on iPhone screen
- ✅ Text is readable (not too small)
- ✅ Options numbered correctly
- ✅ Can type input easily

---

### Test 4: Navigate to Global Components Menu

**Type:** `1` (then Enter)

**Expected Result:**
```
==================================================
🎨 Global Components
==================================================

  [1] Edit Header
  [2] Edit Footer
  [3] Edit Theme
  [4] View Current Config
  [5] Rollback Last Change
  [b] Back

Select option:
```

**Visual Check:**
- ✅ Sub-menu appears
- ✅ Back option works (test: type 'b')
- ✅ Can navigate between menus smoothly

---

### Test 5: View Current Configuration (Read-Only Test)

**From Global Components menu, type:** `4`

**Expected Result:**
```
🚀 Executing: node shortcut-router.js global --action=list

[Displays current header, footer, theme config in JSON format]

✅ Command completed

Press Enter to continue...
```

**Visual Check:**
- ✅ Configuration displays
- ✅ JSON is readable on iPhone
- ✅ Can scroll through output
- ✅ "Press Enter" prompt works

---

### Test 6: Edit Header with Preview (Safe Test)

**Navigation:**
1. From main menu: `1` (Global Components)
2. Then: `1` (Edit Header)
3. Then: `6` (Preview Current Header)

**Expected Result:**
```
🚀 Executing: node global-manager.js --component=header --action=list

📋 Header Configuration:
{
  "logoText": {
    "part1": "yellow",
    "part2": "CIRCLE"
  },
  ...
}

✅ Command completed
Press Enter to continue...
```

**Now test actual edit with preview:**

1. From Edit Header menu: `1` (Change Logo Text part1)
2. Enter new text: `test123`
3. Preview first? `y`
4. **Should show preview, then ask "Apply changes?"**
5. **Type `n` (don't apply)**

**Expected Result:**
- ✅ Preview shows change (yellow → test123)
- ✅ Asked for confirmation before applying
- ✅ Typing 'n' cancels without making changes
- ✅ Returns to menu

---

### Test 7: Make Actual Change (Real Edit)

**⚠️ This will make a real change to your site!**

**Navigation:**
1. From Edit Header menu: `1` (Change Logo Text part1)
2. Enter: `TEST`
3. Preview first? `y`
4. Review preview output
5. Apply changes? `y`

**Expected Result:**
```
🚀 Executing: node shortcut-router.js edit-header --field=part1 --value="TEST"

📝 Backup created: src/config/globalContent.js.backup
✅ Updated src/config/globalContent.js
ℹ️  Running build validation...
✅ Build validation passed
✅ Changes committed to git
✅ Global component update complete!

✅ Command completed
Press Enter to continue...
```

**Validation Steps:**
1. ✅ Backup created message
2. ✅ Build validation passed
3. ✅ Git commit succeeded
4. ✅ No errors displayed

---

### Test 8: Verify Change on Website

**Open browser on iPhone:**
- Visit: `http://localhost:5173` (if dev server running)
- Or: `https://yellowcircle-app.web.app` (production)

**Check:**
- ✅ Header shows "TESTCIRCLE" (not "yellowCIRCLE")
- ✅ Styling unchanged
- ✅ No broken layout

**Note:** You may need to refresh or clear cache

---

### Test 9: Test Rollback (Undo the Change)

**From main menu:**
1. Type: `5` (View History)
2. Type: `1` (Last Change)
3. Review what changed
4. Press Enter
5. Type: `b` (Back)
6. Type: `1` (Global Components)
7. Type: `5` (Rollback Last Change)
8. Confirm: `y`

**Expected Result:**
```
⚠️  About to execute: node shortcut-router.js rollback

Continue? (y/n) y

🚀 Executing: node shortcut-router.js rollback

[Git revert output]
✅ Rolled back last change

✅ Command completed
```

**Verify rollback worked:**
- Check website - should show "yellow" again (not "TEST")
- Or run "Last Change" again - should show the revert commit

---

### Test 10: Test Direct Command (Advanced)

**Exit menu (type 'q'), then run:**

```bash
node shortcut-router.js edit-header --field=part1 --value="golden" --preview
```

**Expected Result:**
```
🚀 Executing: edit-header

Command: node global-manager.js --component=header --field=part1 --value=golden --preview

Preview Changes:
  part1: "yellow" → "golden"

✅ Command completed successfully
```

**Check:**
- ✅ Preview shows change
- ✅ No actual change made (preview mode)
- ✅ Command completed successfully

---

### Test 11: Test History Commands

```bash
# View recent changes
node shortcut-router.js history

# View last change details
node shortcut-router.js last-change
```

**Expected Result:**
- ✅ Git log displays
- ✅ Shows recent commits
- ✅ Readable on iPhone screen

---

## ✅ Testing Checklist

### Essential Tests (Must Pass)
- [ ] SSH connection works from iPhone
- [ ] Menu displays correctly on iPhone screen
- [ ] Can navigate between menus
- [ ] View config works (read-only)
- [ ] Preview mode works (shows changes without applying)
- [ ] Can cancel changes before applying
- [ ] Can make actual edit (header text change)
- [ ] Build validation passes
- [ ] Git commit succeeds
- [ ] Changes appear on website
- [ ] Rollback works (undo last change)

### Advanced Tests (Nice to Have)
- [ ] Direct commands work (without menu)
- [ ] History commands work
- [ ] Can add footer link
- [ ] Can change theme color
- [ ] Multiple edits in one session
- [ ] Error handling (test invalid input)

---

## 🐛 Troubleshooting

### Issue: "node: command not found"

**Solution:**
```bash
# Add Node.js to PATH
export PATH=/usr/local/bin:$PATH
node iphone-menu.js
```

Or use full path:
```bash
/usr/local/bin/node iphone-menu.js
```

### Issue: Menu text too small on iPhone

**Solution:**
- Use landscape mode
- Increase iPhone font size (Settings → Display)
- Or use SSH client app with adjustable font (Termius, Blink)

### Issue: Can't type easily

**Solution:**
- Use external keyboard with iPhone
- Use SSH app with better keyboard (Termius)
- Consider voice typing for longer inputs

### Issue: "Permission denied" on files

**Solution:**
```bash
# Make executable
chmod +x ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation/iphone-menu.js
```

### Issue: Changes don't appear on website

**Solution:**
- Refresh browser with cache clear (hard refresh)
- Check if dev server is running (`npm run dev`)
- Check build didn't fail (look for errors in output)
- Verify correct environment (local vs production)

### Issue: Git commit fails

**Solution:**
- Usually safe to ignore (change still applied)
- May need to commit manually later
- Check git status: `git status`

---

## 📊 Test Results Template

**Date:** _______________
**Tester:** _______________
**iPhone Model:** _______________
**iOS Version:** _______________
**Network:** WiFi / Cellular
**MacBook Air IP:** _______________

### Results

| Test | Status | Notes |
|------|--------|-------|
| SSH Connection | ✅ / ❌ | |
| Menu Display | ✅ / ❌ | |
| Navigation | ✅ / ❌ | |
| View Config | ✅ / ❌ | |
| Preview Mode | ✅ / ❌ | |
| Make Edit | ✅ / ❌ | |
| Build Validation | ✅ / ❌ | |
| Git Commit | ✅ / ❌ | |
| Website Updated | ✅ / ❌ | |
| Rollback | ✅ / ❌ | |

**Overall:** Pass / Fail

**Issues Found:**
-
-

**Recommendations:**
-
-

---

## 📱 Next: Create Apple Shortcuts

After testing passes, create these shortcuts:

### Shortcut 1: "yellowCircle Menu"
```
Action: Run Script Over SSH
Host: [MacBook Air IP or hostname]
User: christophercooper
Script:
  cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation &&
  export PATH=/usr/local/bin:$PATH &&
  node iphone-menu.js
```

### Shortcut 2: "YC Rollback"
```
Action: Run Script Over SSH
Host: [MacBook Air IP]
User: christophercooper
Script:
  cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation &&
  export PATH=/usr/local/bin:$PATH &&
  node shortcut-router.js rollback
```

### Shortcut 3: "YC View History"
```
Action: Run Script Over SSH
Host: [MacBook Air IP]
User: christophercooper
Script:
  cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation &&
  export PATH=/usr/local/bin:$PATH &&
  node shortcut-router.js history
```

---

## ✅ Success Criteria

**Testing is successful when:**
1. ✅ All essential tests pass
2. ✅ Can make a change from iPhone
3. ✅ Change appears on website
4. ✅ Can rollback the change
5. ✅ No critical errors encountered

**Ready for production use when:**
1. ✅ Testing successful
2. ✅ At least 1 Apple Shortcut created
3. ✅ Team knows how to use it (if applicable)
4. ✅ Documented any issues/workarounds

---

**Good luck with testing! 🚀**
