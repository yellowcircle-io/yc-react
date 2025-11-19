# SSH Scripts Reference - Copy & Paste Guide

Quick reference for creating yellowCircle 5-action shortcut in Shortcuts app.

---

## SSH Configuration (Same for All 5 Actions)

**Use these settings for ALL "Run Script Over SSH" actions:**

- **Host:** `Christophers-Mac-mini.local`
- **Port:** `22`
- **User:** `christopherwilliamson`
- **Password:** [enter once, saves to keychain]

---

## 5 SSH Scripts (Copy-Paste Each)

### 1. Sync Roadmap

```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js sync
```

**What it does:** Syncs roadmap to Notion database

---

### 2. WIP Sync

```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js wip
```

**What it does:** Runs daily WIP sync to Notion

---

### 3. Update Content

```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js content --page=about --section=headline --text="From iPhone"
```

**What it does:** Updates About page headline (example - customize as needed)

---

### 4. Check Deadlines

```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js deadline
```

**What it does:** Checks for upcoming deadlines

---

### 5. Weekly Summary

```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js summary
```

**What it does:** Generates weekly summary report

---

## Quick Setup Steps

1. **Open Shortcuts app**
2. **Create new shortcut:** Name "yellowCircle Command"
3. **Add "Choose from Menu"** with 5 items:
   - Sync Roadmap
   - WIP Sync
   - Update Content
   - Check Deadlines
   - Weekly Summary
4. **For each menu item:**
   - Add "Run Script Over SSH"
   - Use SSH config above
   - Copy-paste corresponding script
5. **Add to Siri:** "yellowCircle command"
6. **Test on Mac**
7. **Wait 30 seconds for iCloud sync**
8. **Use on iPhone!**

---

## Shortcut Structure

```
yellowCircle Command
│
├─ Choose from Menu: "Select Command"
│
├─ Menu Item: "Sync Roadmap"
│  └─ Run Script Over SSH
│     Script: ... && node shortcut-router.js sync
│
├─ Menu Item: "WIP Sync"
│  └─ Run Script Over SSH
│     Script: ... && node shortcut-router.js wip
│
├─ Menu Item: "Update Content"
│  └─ Run Script Over SSH
│     Script: ... && node shortcut-router.js content ...
│
├─ Menu Item: "Check Deadlines"
│  └─ Run Script Over SSH
│     Script: ... && node shortcut-router.js deadline
│
└─ Menu Item: "Weekly Summary"
   └─ Run Script Over SSH
      Script: ... && node shortcut-router.js summary
```

---

## Verification

**After creating shortcut:**

```bash
# Check shortcut exists
shortcuts list | grep -i yellowcircle

# Test router commands (Mac terminal)
cd .claude/automation
node shortcut-router.js deadline
```

**On iPhone (after iCloud sync):**
- Open Shortcuts app
- Find "yellowCircle Command"
- Tap to run
- Choose "Check Deadlines"

**Voice test:**
"Hey Siri, yellowCircle command"

---

## Customization Options

### Content Update Variations

**Different pages:**
```bash
# Home page
--page=home --section=headline --text="New Home Headline"

# Works page
--page=works --section=description --text="Project Portfolio"

# Hands page
--page=hands --section=headline --text="Hands-On Work"
```

**Different sections:**
```bash
# Headline
--section=headline --text="Your Text"

# Description
--section=description --text="Your Text"

# Background (image URL)
--section=background --background="https://cloudinary.com/..."
```

### Advanced: Ask for Input

To make content update interactive, replace fixed text with "Ask for Input":

1. Before SSH action, add: **"Ask for Input"**
   - Prompt: "Enter new headline"
2. In SSH script, replace `"From iPhone"` with: **Input**
   - The variable will be inserted automatically

---

## Testing Commands

**Safe to test (read-only):**
- ✅ Check Deadlines
- ✅ Weekly Summary

**Modifies data (test carefully):**
- ⚠️ Sync Roadmap (updates Notion)
- ⚠️ WIP Sync (updates Notion)
- ⚠️ Update Content (updates website)

---

## Troubleshooting

**SSH Connection Failed:**
- Verify Mac Mini is on
- Check: `hostname` = `Christophers-Mac-mini.local`
- Try IP instead: `ifconfig | grep "inet "`

**Password Prompt Every Time:**
- Delete old keychain entry
- Re-enter password in shortcut
- Should save to keychain automatically

**Shortcut Not on iPhone:**
- Open Shortcuts app on Mac (forces sync)
- Wait 60 seconds
- Open Shortcuts app on iPhone
- Pull to refresh

---

**Setup Time:** 10 minutes
**Auto-sync to iPhone:** 30 seconds
**Ready to use!**
