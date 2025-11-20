# 📱 iPhone Shortcut Setup - Complete Guide

**Goal:** Create ONE shortcut with 5 commands accessible from iPhone/Mac

**Time:** 10-15 minutes
**Syncs to iPhone:** Automatically via iCloud (30-60 seconds)

---

## ✅ Prerequisites Check

Before starting, verify on your **Mac Mini**:

```bash
# 1. Check hostname (for SSH)
hostname
# Should show: Christophers-Mac-mini.local

# 2. Test automation scripts work
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
node shortcut-router.js
# Should show command menu

# 3. Verify SSH is enabled
sudo systemsetup -getremotelogin
# Should show: Remote Login: On
```

---

## 🎯 Option A: Unified Menu Shortcut (RECOMMENDED)

**Create ONE shortcut with a menu to choose from 5 commands**

### Mac Setup (Shortcuts App)

1. **Open Shortcuts app** on Mac
2. **Click "+" to create new shortcut**
3. **Name it:** `yellowCircle`

### Add Actions (In Order)

#### **Action 1: Choose from Menu**

1. Search for "Choose from Menu"
2. Add it
3. Click "Choose from Menu" → Rename to **"Select Command"**
4. Click "Add New Item" until you have 5 items:
   - Sync Roadmap
   - WIP Update
   - Content Update
   - Check Deadlines
   - Weekly Summary

#### **Action 2-6: Five SSH Scripts**

For EACH menu item, add the corresponding SSH action:

---

### **Menu Item 1: Sync Roadmap**

1. Under "Sync Roadmap", click **Add Action**
2. Search: **"Run Script Over SSH"**
3. Configure:
   - **Host:** `Christophers-Mac-mini.local`
   - **Port:** `22`
   - **User:** `christopherwilliamson`
   - **Password:** [enter your password - saves to keychain]
   - **Script:** (Copy-paste exactly)

```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js sync
```

4. Click **Done**

---

### **Menu Item 2: WIP Update**

1. Under "WIP Update", click **Add Action**
2. Add **"Run Script Over SSH"**
3. Configure (same host/port/user/password as above):
   - **Script:**

```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js wip
```

---

### **Menu Item 3: Content Update**

**This one needs user input for dynamic text:**

1. Under "Content Update", click **Add Action**
2. Search: **"Ask for Input"** → Add it FIRST
   - **Prompt:** `Enter page name (about/works/hands):`
   - Rename variable to: **PageName**
3. Add another **"Ask for Input"**
   - **Prompt:** `Enter section (headline/description):`
   - Rename variable to: **Section**
4. Add another **"Ask for Input"**
   - **Prompt:** `Enter new text:`
   - Rename variable to: **NewText**
5. Add **"Run Script Over SSH"**
6. Configure SSH (same as above)
7. **Script:** (Click inside script field, then use "Add Variable" button to insert blue pills)

```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js content --page=<PageName> --section=<Section> --text='<NewText>'
```

**IMPORTANT:**
- Replace `<PageName>`, `<Section>`, `<NewText>` with **blue variable pills**
- Click cursor where you want variable
- Click **Add Variable** button (looks like a variable icon)
- Select the variable (PageName, Section, or NewText)
- DO NOT type the variable names - they must be blue pills!

---

### **Menu Item 4: Check Deadlines**

1. Under "Check Deadlines", click **Add Action**
2. Add **"Run Script Over SSH"**
3. Configure (same SSH settings):
   - **Script:**

```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js deadline
```

---

### **Menu Item 5: Weekly Summary**

1. Under "Weekly Summary", click **Add Action**
2. Add **"Run Script Over SSH"**
3. Configure (same SSH settings):
   - **Script:**

```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js summary
```

---

### Final Step: Add Success Notification

After all 5 menu items:

1. Click outside menu (after all items)
2. Add **"Show Alert"**
3. Configure:
   - **Title:** `✅ Command Complete`
   - **Message:** `yellowCircle command executed successfully`

---

## 🧪 Test on Mac First

1. **Click the shortcut** in Shortcuts app
2. **Choose "Check Deadlines"** (safe, read-only)
3. Watch for:
   - SSH connection message
   - Command execution
   - Success alert

**If it works:** ✅ Proceed to iPhone sync
**If it fails:** ❌ Debug (see Troubleshooting below)

---

## 📲 Sync to iPhone

**Automatic iCloud Sync:**

1. Just wait 30-60 seconds
2. On iPhone: Open Shortcuts app
3. Pull down to refresh
4. Look for "yellowCircle" shortcut

**Force Sync (if needed):**

1. On Mac: Open/close Shortcuts app
2. On iPhone: Pull to refresh again
3. Check Settings → [Your Name] → iCloud → Manage Storage → Shortcuts

---

## 🎤 Add to Siri (Optional)

1. Long-press the "yellowCircle" shortcut
2. Tap **Details** (info icon)
3. Enable **"Show in Share Sheet"** (optional)
4. Tap **"Add to Siri"**
5. Record phrase: **"yellowCircle command"** or **"Update yellowCircle"**

Now you can say: **"Hey Siri, yellowCircle command"**

---

## 📱 Test from iPhone

### Safe Test First (Read-Only):

1. Open Shortcuts app
2. Tap **yellowCircle**
3. Choose **"Check Deadlines"** or **"Weekly Summary"**
4. Watch for success message

### Content Update Test:

1. Tap **yellowCircle**
2. Choose **"Content Update"**
3. Enter:
   - **Page:** `about`
   - **Section:** `headline`
   - **Text:** `iPhone Test at [current time]`
4. Wait for execution
5. Check success message

### Verify Git Commit:

On Mac terminal:
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle
git log --oneline -3
```

Should show new commit from iPhone!

---

## 🔧 Troubleshooting

### SSH Connection Failed

**Error:** "Connection refused" or "Host not reachable"

**Solutions:**

1. **Check Mac Mini is on and awake:**
   ```bash
   # On Mac Mini
   caffeinate -d  # Prevent sleep
   ```

2. **Verify hostname:**
   ```bash
   hostname  # Should be: Christophers-Mac-mini.local
   ```

3. **Try IP address instead:**
   ```bash
   ifconfig | grep "inet "
   # Find your local IP (192.168.x.x)
   # Replace hostname in shortcut with IP
   ```

4. **Check Remote Login enabled:**
   ```bash
   sudo systemsetup -setremotelogin on
   ```

---

### Password Prompt Every Time

**Problem:** iPhone asks for password every run

**Solutions:**

1. Delete old keychain entry:
   - Settings → Passwords → Search "Mac-mini"
   - Delete old entries
2. Re-enter password in shortcut
3. Allow keychain save prompt

---

### Shortcut Doesn't Sync to iPhone

**Problem:** Can't find shortcut on iPhone after 60+ seconds

**Solutions:**

1. **Force Mac sync:**
   - Open Shortcuts app on Mac
   - Click on shortcut
   - Make tiny edit (add space, delete space)
   - Save
   - Wait 30s

2. **Force iPhone sync:**
   - iPhone: Settings → [Name] → iCloud
   - Toggle Shortcuts OFF
   - Wait 10 seconds
   - Toggle Shortcuts ON
   - Open Shortcuts app
   - Pull to refresh

3. **Check iCloud sync enabled:**
   - Mac: System Settings → Apple ID → iCloud → Shortcuts (ON)
   - iPhone: Settings → [Name] → iCloud → Shortcuts (ON)

---

### Variables Not Working in Content Update

**Problem:** Getting literal text `<PageName>` instead of input value

**Solution:**

The variables MUST be blue pills, not typed text:

1. Delete the typed `<PageName>` text
2. Click cursor where variable should go
3. Click **Add Variable** button (top right)
4. Select **PageName** from dropdown
5. Blue pill should appear
6. Repeat for Section and NewText

---

### Script Fails with "nvm: command not found"

**Problem:** SSH can't find Node.js

**Solution:**

Verify the script starts with:
```bash
source ~/.nvm/nvm.sh; cd ...
```

The `source ~/.nvm/nvm.sh;` MUST come first.

---

### Git Push Fails with Authentication Error

**Problem:** Can't push to GitHub from script

**Solution:**

1. **Use SSH keys (not HTTPS):**
   ```bash
   cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle
   git remote -v
   # Should show: git@github.com:... (NOT https://)
   ```

2. **If HTTPS, switch to SSH:**
   ```bash
   git remote set-url origin git@github.com:yellowcircle-io/yc-react.git
   ```

3. **Ensure SSH key is loaded:**
   ```bash
   ssh-add -l  # Should list your key
   # If empty:
   ssh-add ~/.ssh/id_ed25519  # or id_rsa
   ```

---

## 🎯 Quick Reference: All 5 Commands

| Command | Safe? | What It Does |
|---------|-------|-------------|
| **Sync Roadmap** | ⚠️ Writes | Syncs roadmap files to Notion database |
| **WIP Update** | ⚠️ Writes | Updates work-in-progress status in Notion |
| **Content Update** | ⚠️ Writes | Updates website content + git push |
| **Check Deadlines** | ✅ Safe | Shows upcoming deadlines (read-only) |
| **Weekly Summary** | ✅ Safe | Generates weekly report (read-only) |

**Recommended testing order:**
1. ✅ Check Deadlines (safe)
2. ✅ Weekly Summary (safe)
3. ⚠️ Content Update (test with dummy text first)
4. ⚠️ WIP Update (only when ready to update Notion)
5. ⚠️ Sync Roadmap (only when ready to update Notion)

---

## 📊 Success Checklist

- [ ] Shortcut created on Mac with all 5 menu items
- [ ] All SSH connections configured (same host/port/user)
- [ ] Content Update uses blue variable pills (not typed text)
- [ ] Tested "Check Deadlines" successfully on Mac
- [ ] Shortcut synced to iPhone (visible in Shortcuts app)
- [ ] Tested from iPhone successfully
- [ ] Git commit visible after Content Update test
- [ ] Added to Siri (optional but cool!)

---

## 🚀 What's Next

Once this works:

1. **Create more content update presets:**
   - Quick shortcut for "Update About headline"
   - Quick shortcut for "Update Works description"
   - Each can be separate shortcuts with no inputs

2. **Schedule automations:**
   - Daily WIP sync at 9 AM
   - Weekly summary every Friday at 5 PM
   - Use iOS Automation app

3. **Add notifications:**
   - Get push notification when deadline approaching
   - Daily standup reminder
   - Weekly goals review

---

**Setup Time:** 10-15 minutes
**Maintenance:** Zero - runs forever
**Coolness Factor:** 💯

**Ready to update your website from your iPhone while on a walk? Let's go! 🚀**
