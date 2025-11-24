# 📱 Hybrid Shortcut Setup - yellowCircle (RECOMMENDED)

**Combines:** System 1 (iOS Choose from Menu) + System 2 (Rollback Protection)
**Status:** ✅ Production Ready
**Time:** 15 minutes one-time setup

---

## 🎯 What You're Creating

**Two shortcuts:**

1. **"yellowCircle Command"** - Main workflow (Choose from Menu)
   - Global Components (Header, Footer, Theme editing)
   - Page Management (Create, Duplicate, Delete)
   - Content Updates
   - Sync & Alerts
   - View History

2. **"YC Rollback"** - Emergency undo (dedicated shortcut)
   - One-tap rollback of last change
   - Always accessible
   - No menu navigation needed

---

## 📋 Prerequisites

**On Mac (MacBook Air or Mac Mini):**

```bash
# 1. Get your hostname
hostname
# Example: Coopers-MacBook-Air.local or Christophers-Mac-mini.local

# 2. Verify automation works
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
node shortcut-router.js
# Should show command menu

# 3. Verify SSH enabled
sudo systemsetup -getremotelogin
# Should show: Remote Login: On
# If not: sudo systemsetup -setremotelogin on
```

**Note your:**
- Hostname: `___________________________`
- Username: `christophercooper` (MacBook Air) or `christopherwilliamson` (Mac Mini)
- Password: (your Mac password)

---

## 🍎 Shortcut 1: yellowCircle Command (Main Interface)

### On Mac - Shortcuts App

1. **Open Shortcuts app**
2. **Click "+" to create new shortcut**
3. **Name it:** `yellowCircle Command`

### Add Action 1: Choose from Menu

1. Search: **"Choose from Menu"**
2. Add it
3. Rename prompt to: **"yellowCircle Command"**
4. Click **"Add New Item"** to create menu items:

**Menu structure:**
```
yellowCircle Command
├── Global Components
├── Page Management
├── Content Updates
├── Sync & Alerts
└── View History
```

---

### Menu Item 1: Global Components

**Under "Global Components", add sub-menu:**

1. Click **Add Action** under "Global Components"
2. Search: **"Choose from Menu"**
3. Add it
4. Rename to: **"Select Component"**
5. Add items:
   - Edit Header
   - Edit Footer
   - Edit Theme
   - View Config

#### Edit Header (under Global Components → Edit Header)

1. Add **"Ask for Input"**
   - Prompt: `Header field (part1/part2/part1Color/backgroundColor):`
   - Variable name: `HeaderField`

2. Add **"Ask for Input"**
   - Prompt: `New value:`
   - Variable name: `HeaderValue`

3. Add **"Run Script Over SSH"**
   - Host: `[Your hostname]`
   - Port: `22`
   - User: `[Your username]`
   - Password: `[Your password]`
   - Script:
   ```bash
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js edit-header --field="[HeaderField]" --value="[HeaderValue]"
   ```
   (Replace `[HeaderField]` and `[HeaderValue]` with the Ask for Input variables)

4. Add **"Show Result"**

#### Edit Footer (under Global Components → Edit Footer)

1. Add **"Choose from Menu"**
   - Prompt: `Footer Action`
   - Items: Add Link, Remove Link, Change Title

**For "Add Link":**
1. Add **"Ask for Input"** - Prompt: `Section (contact/projects):`
2. Add **"Ask for Input"** - Prompt: `Link text:`
3. Add **"Ask for Input"** - Prompt: `URL:`
4. Add **"Run Script Over SSH"**
   - Script:
   ```bash
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js edit-footer --section="[Section]" --action=add --text="[LinkText]" --url="[URL]"
   ```
5. Add **"Show Result"**

#### Edit Theme (under Global Components → Edit Theme)

1. Add **"Ask for Input"** - Prompt: `Color field (primary/secondary/background/text):`
2. Add **"Ask for Input"** - Prompt: `Hex color (e.g. #FF0000):`
3. Add **"Run Script Over SSH"**
   - Script:
   ```bash
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js edit-theme --field="[ColorField]" --value="[ColorValue]"
   ```
4. Add **"Show Result"**

#### View Config (under Global Components → View Config)

1. Add **"Run Script Over SSH"**
   - Script:
   ```bash
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js global --action=list
   ```
2. Add **"Show Result"**

---

### Menu Item 2: Page Management

**Under "Page Management", add sub-menu:**

1. Add **"Choose from Menu"**
2. Rename to: **"Page Action"**
3. Add items:
   - Create Page
   - Duplicate Page
   - Delete Page

#### Create Page

1. Add **"Ask for Input"** - Prompt: `Page slug (e.g. contact):`
2. Add **"Ask for Input"** - Prompt: `Page title (e.g. Contact Us):`
3. Add **"Ask for Input"** - Prompt: `Template (standard/minimal/fullscreen):`
4. Add **"Run Script Over SSH"**
   - Script:
   ```bash
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js create-page --slug="[Slug]" --title="[Title]" --template="[Template]"
   ```
5. Add **"Show Result"**

#### Duplicate Page

1. Add **"Ask for Input"** - Prompt: `Source page slug:`
2. Add **"Ask for Input"** - Prompt: `New page slug:`
3. Add **"Ask for Input"** - Prompt: `New page title:`
4. Add **"Run Script Over SSH"**
   - Script:
   ```bash
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js duplicate-page --source="[Source]" --slug="[NewSlug]" --title="[NewTitle]"
   ```
5. Add **"Show Result"**

#### Delete Page

1. Add **"Ask for Input"** - Prompt: `Page slug to delete:`
2. Add **"Ask Confirmation"** - Prompt: `Really delete [PageSlug]?`
3. Add **"If"** statement - If Confirmation is true:
4. Add **"Run Script Over SSH"**
   - Script:
   ```bash
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js delete-page --slug="[PageSlug]"
   ```
5. Add **"Show Result"**

---

### Menu Item 3: Content Updates

1. Add **"Ask for Input"** - Prompt: `Page slug:`
2. Add **"Ask for Input"** - Prompt: `Section name:`
3. Add **"Ask for Input"** - Prompt: `New text:`
4. Add **"Run Script Over SSH"**
   - Script:
   ```bash
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js content --page="[Page]" --section="[Section]" --text="[Text]"
   ```
5. Add **"Show Result"**

---

### Menu Item 4: Sync & Alerts

**Under "Sync & Alerts", add sub-menu:**

1. Add **"Choose from Menu"**
2. Items:
   - Sync to Notion
   - WIP Sync
   - Check Deadlines
   - Check Blocked
   - Weekly Summary

#### For each item, add "Run Script Over SSH" with:

**Sync to Notion:**
```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js sync
```

**WIP Sync:**
```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js wip
```

**Check Deadlines:**
```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js deadline
```

**Check Blocked:**
```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js blocked
```

**Weekly Summary:**
```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js summary
```

Each should be followed by **"Show Result"**

---

### Menu Item 5: View History

**Under "View History", add sub-menu:**

1. Add **"Choose from Menu"**
2. Items:
   - Last Change
   - Recent History

#### Last Change

1. Add **"Run Script Over SSH"**
   - Script:
   ```bash
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js last-change
   ```
2. Add **"Show Result"**

#### Recent History

1. Add **"Run Script Over SSH"**
   - Script:
   ```bash
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js history
   ```
2. Add **"Show Result"**

---

## 🚨 Shortcut 2: YC Rollback (Emergency Undo)

**This is the critical addition from System 2!**

### On Mac - Shortcuts App

1. **Create new shortcut**
2. **Name it:** `YC Rollback`
3. **Add "Ask Confirmation"**
   - Prompt: `Rollback last change? This cannot be undone.`
4. **Add "If"** - If Confirmation is true
5. **Add "Run Script Over SSH"** (inside If block)
   - Host: `[Your hostname]`
   - Port: `22`
   - User: `[Your username]`
   - Password: `[Your password]`
   - Script:
   ```bash
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js rollback
   ```
6. **Add "Show Result"**
7. **Color it RED** (tap icon, choose red)
8. **Add to iPhone Home Screen** (Share → Add to Home Screen)

---

## ✅ Testing Checklist

### Test Shortcut 1: yellowCircle Command

**Global Components:**
- [ ] Edit Header → part1 → "TEST" → Verify on website → Works
- [ ] Edit Footer → Add Link → contact → "GITHUB" → Works
- [ ] Edit Theme → primary → "#FF0000" → Works
- [ ] View Config → Shows JSON → Works

**Page Management:**
- [ ] Create Page → slug: "test" → title: "Test Page" → Works
- [ ] Duplicate Page → source: "about" → slug: "about2" → Works
- [ ] Delete Page → "test" → Confirms → Deletes

**Content Updates:**
- [ ] page: "about" → section: "headline" → text: "New" → Works

**Sync & Alerts:**
- [ ] Sync to Notion → Executes
- [ ] WIP Sync → Executes
- [ ] Check Deadlines → Shows output
- [ ] Check Blocked → Shows output
- [ ] Weekly Summary → Generates

**View History:**
- [ ] Last Change → Shows recent commit
- [ ] Recent History → Shows 10 commits

### Test Shortcut 2: YC Rollback

- [ ] Run after making a test edit
- [ ] Confirms before executing
- [ ] Rollback succeeds
- [ ] Verify change reverted on website

---

## 🎊 You're Done!

**You now have:**
- ✅ Native iOS Choose from Menu interface
- ✅ All 18 commands accessible
- ✅ Page management (create/duplicate/delete)
- ✅ Global component editing
- ✅ Content updates
- ✅ Sync & alerts
- ✅ **Dedicated rollback shortcut (NEW!)**

**Usage:**
- **Daily work:** Use "yellowCircle Command" → Choose from menu
- **Emergency:** Tap "YC Rollback" (on Home Screen)
- **Voice:** "Hey Siri, yellowCircle Command"

---

## 📱 Syncing to iPhone

**Shortcuts sync automatically via iCloud:**
1. Wait 30-60 seconds after creating on Mac
2. Open Shortcuts app on iPhone
3. Shortcuts should appear
4. If not, force quit Shortcuts app and reopen

---

## 🆘 Troubleshooting

**"Connection refused"**
- Enable Remote Login: System Settings → Sharing → Remote Login ON
- Verify both devices on same WiFi

**"node: command not found"**
- Scripts include `source ~/.nvm/nvm.sh` which loads Node.js
- If still fails, try full path: `/usr/local/bin/node`

**"Command not found: shortcut-router.js"**
- Verify path is correct for your machine
- Mac Mini uses: `~/Library/CloudStorage/Dropbox/...`
- MacBook Air may use: `~/Dropbox/...`

**Menu doesn't show all options**
- Scroll down in Choose from Menu
- Some items may be collapsed

**Changes don't appear on website**
- Hard refresh browser (Cmd+Shift+R)
- Wait 30 seconds for build
- Check command output for errors

---

## 📚 Documentation

**System 1 (Original):**
- `.claude/shortcuts/QUICKSTART.md` - Basic setup
- `.claude/shortcuts/IPHONE_SHORTCUT_SETUP_GUIDE.md` - Detailed setup

**System 2 (Rollback Features):**
- `.claude/automation/APPLE_SHORTCUTS_SETUP.md` - Rollback shortcuts
- `.claude/automation/iphone-menu.js` - Terminal menu (alternative)

**Hybrid (This File):**
- `.claude/shortcuts/HYBRID_SHORTCUT_SETUP.md` - Complete hybrid setup

**Reconciliation:**
- `.claude/SHORTCUT_SYSTEMS_RECONCILIATION.md` - System comparison

---

**Status:** ✅ Ready for Production Use
**Best of Both:** iOS Native + Rollback Protection
