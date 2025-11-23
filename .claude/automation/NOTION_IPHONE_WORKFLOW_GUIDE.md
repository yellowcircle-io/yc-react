# 📱 iPhone SSH Workflow Guide - yellowCircle Automation

**Status:** Ready for Production Use
**Last Updated:** November 22, 2025
**Machine:** MacBook Air
**Version:** 2.0 (with rollback protection)

---

## 🎯 Quick Start (iPhone)

### Option 1: Menu-Driven Interface (Recommended)

```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
node iphone-menu.js
```

**Benefits:**
- ✅ Interactive menus - no need to remember commands
- ✅ Built-in confirmation prompts
- ✅ Preview mode before applying changes
- ✅ Guided input for all fields
- ✅ Visual categorization

### Option 2: Direct Commands (Advanced)

```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
node shortcut-router.js [command] [args]
```

---

## 📋 Available Commands

### **Global Components** 🎨

```bash
# Edit header logo text
node shortcut-router.js edit-header --field=part1 --value="golden"

# Edit footer - add link
node shortcut-router.js edit-footer --section=contact --action=add --text="GITHUB" --url="https://github.com"

# Edit theme color
node shortcut-router.js edit-theme --field=primary --value="#FF0000"

# Preview changes first
node shortcut-router.js edit-header --field=part1 --value="test" --preview

# View current configuration
node shortcut-router.js global --action=list --component=header
```

### **Page Management** 📄

```bash
# Create new page
node shortcut-router.js create-page --slug=contact --title="Contact Us" --template=standard

# Duplicate page
node shortcut-router.js duplicate-page --source=about --slug=about-us --title="About Us"

# Delete page
node shortcut-router.js delete-page --slug=old-page
```

### **Content Updates** ✏️

```bash
# Update page headline
node shortcut-router.js content --page=about --section=headline --text="New Headline"
```

### **Rollback & Safety** 🔒

```bash
# Rollback last change (creates revert commit)
node shortcut-router.js rollback

# Restore to last commit (uncommitted changes only)
node shortcut-router.js restore

# View last change
node shortcut-router.js last-change

# View recent history
node shortcut-router.js history
```

### **Sync & Alerts** 🔄

```bash
# Sync to Notion
node shortcut-router.js sync

# Daily WIP sync
node shortcut-router.js wip

# Check deadlines
node shortcut-router.js deadline

# Check blocked tasks
node shortcut-router.js blocked

# Weekly summary
node shortcut-router.js summary
```

---

## 🔒 Safety Features

### Automatic Backup System

**Every edit automatically:**
1. ✅ Creates backup before writing
2. ✅ Writes new configuration
3. ✅ Runs build validation (`npm run build`)
4. ✅ If build fails → Restores from backup
5. ✅ If build succeeds → Commits to git
6. ✅ Cleans up backup file

**You are protected from:**
- ❌ Breaking changes (build validates before commit)
- ❌ Lost data (backup created before writing)
- ❌ Accidental changes (preview mode available)

### Preview Mode

Add `--preview` to any command to see changes without applying:

```bash
node shortcut-router.js edit-header --field=part1 --value="test" --preview
```

**Shows:**
- What will change
- Old value → New value
- No files modified

### Rollback Options

| Command | When to Use | What It Does |
|---------|-------------|--------------|
| `rollback` | After commit, want to undo | Creates git revert commit (keeps history) |
| `restore` | Before commit, made mistake | Discards uncommitted changes |
| `last-change` | Check what was changed | Shows last commit details |
| `history` | View recent changes | Shows last 10 commits |

---

## 🎨 Header Fields Reference

```bash
# Logo Text
--field=part1          # First part (default: "yellow")
--field=part2          # Second part (default: "CIRCLE")

# Colors
--field=part1Color     # Color for part1 (default: "#fbbf24")
--field=part2Color     # Color for part2 (default: "white")
--field=backgroundColor  # Header background (default: "black")

# Styling
--field=fontSize       # Font size (default: "16px")
--field=fontWeight     # Font weight (default: "600")
--field=letterSpacing  # Letter spacing (default: "0.2em")
```

**Example:**
```bash
node shortcut-router.js edit-header --field=part1 --value="golden"
```

---

## 👣 Footer Fields Reference

### Contact Section

```bash
# Add link
node shortcut-router.js edit-footer \
  --section=contact \
  --action=add \
  --text="GITHUB" \
  --url="https://github.com/yellowcircle"

# Remove link
node shortcut-router.js edit-footer \
  --section=contact \
  --action=remove \
  --text="TWITTER"

# Change title
node shortcut-router.js edit-footer \
  --section=contact \
  --field=title \
  --value="GET IN TOUCH"
```

### Projects Section

```bash
# Add project link
node shortcut-router.js edit-footer \
  --section=projects \
  --action=add \
  --text="NEW PROJECT" \
  --url="/new-project"

# Edit existing link URL
node shortcut-router.js edit-footer \
  --section=projects \
  --action=edit \
  --text="TRAVEL MEMORIES" \
  --field=url \
  --value="/memories"
```

---

## 🎨 Theme Fields Reference

### Colors

```bash
--field=primary         # Primary color (default: "#EECF00")
--field=primaryDark     # Primary dark variant (default: "#d4b800")
--field=secondary       # Secondary color (default: "#fbbf24")
--field=accent          # Accent color (default: "#f59e0b")
--field=background      # Background color (default: "black")
--field=text            # Text color (default: "white")
--field=textMuted       # Muted text color (default: "rgba(255,255,255,0.8)")
```

### Typography

```bash
--field=fontFamily      # Font family (default: "Helvetica Neue, Arial, sans-serif")
--field=headingWeight   # Heading weight (default: "900")
--field=bodyWeight      # Body weight (default: "400")
--field=letterSpacing   # Letter spacing (default: "0.1em")
```

**Example:**
```bash
node shortcut-router.js edit-theme --field=primary --value="#FF0000"
```

---

## 📱 Apple Shortcuts Setup

### Method 1: Menu Interface (Easiest)

**Create shortcut:**
1. Open Shortcuts app
2. Create new shortcut
3. Add "Run Script Over SSH" action
4. Configure:
   - **Host:** Your Mac's IP or hostname
   - **User:** Your username
   - **Script:**
     ```bash
     cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node iphone-menu.js
     ```
5. Save as "yellowCircle Menu"

**Usage:** Tap shortcut → Navigate menus → Make changes

### Method 2: Quick Commands (Advanced)

**Create separate shortcuts for common tasks:**

**"YC Edit Header"**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js edit-header --field=part1 --value="[prompt for input]"
```

**"YC Add Footer Link"**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js edit-footer --section=contact --action=add --text="[prompt for text]" --url="[prompt for url]"
```

**"YC Rollback"**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js rollback
```

---

## ⚠️ Safety Checklist

### Before Making Changes

- [ ] **Verify you're on the right machine/environment**
- [ ] **Check git status** - no uncommitted work
- [ ] **Consider using preview mode** for major changes
- [ ] **Know how to rollback** if needed

### After Making Changes

- [ ] **Verify build succeeded** (automatic)
- [ ] **Check the website** to confirm changes look correct
- [ ] **If something went wrong:** Run `node shortcut-router.js rollback`

### Emergency Rollback

```bash
# If last change broke something
node shortcut-router.js rollback

# If you haven't committed yet
node shortcut-router.js restore

# Check what changed
node shortcut-router.js last-change
```

---

## 🔄 Workflow Examples

### Example 1: Change Header Logo Text

**Using Menu Interface:**
```
1. Run: node iphone-menu.js
2. Select: [1] Global Components
3. Select: [1] Edit Header
4. Select: [1] Change Logo Text (part1)
5. Enter: "golden"
6. Confirm preview
7. Confirm apply
```

**Using Direct Command:**
```bash
# Preview first
node shortcut-router.js edit-header --field=part1 --value="golden" --preview

# Apply
node shortcut-router.js edit-header --field=part1 --value="golden"
```

### Example 2: Add GitHub Link to Footer

**Using Menu Interface:**
```
1. Run: node iphone-menu.js
2. Select: [1] Global Components
3. Select: [2] Edit Footer
4. Select: [1] Add Contact Link
5. Enter text: "GITHUB"
6. Enter URL: "https://github.com/yellowcircle"
```

**Using Direct Command:**
```bash
node shortcut-router.js edit-footer \
  --section=contact \
  --action=add \
  --text="GITHUB" \
  --url="https://github.com/yellowcircle"
```

### Example 3: Change Theme Color

**Using Menu Interface:**
```
1. Run: node iphone-menu.js
2. Select: [1] Global Components
3. Select: [3] Edit Theme
4. Select: [1] Primary Color
5. Enter: "#FF0000"
6. Preview (optional)
7. Apply
```

**Using Direct Command:**
```bash
# Preview first
node shortcut-router.js edit-theme --field=primary --value="#FF0000" --preview

# Apply
node shortcut-router.js edit-theme --field=primary --value="#FF0000"
```

### Example 4: Rollback Last Change

**If you made a mistake:**
```bash
# See what was changed
node shortcut-router.js last-change

# Rollback (creates revert commit)
node shortcut-router.js rollback

# Verify rollback worked
node shortcut-router.js last-change
```

---

## 📊 Command Reference Table

| Category | Command | Description | Rollback-Safe |
|----------|---------|-------------|---------------|
| **Global** | `global` | General global component editing | ✅ Yes |
| | `edit-header` | Edit header logo/colors/styling | ✅ Yes |
| | `edit-footer` | Edit footer sections/links | ✅ Yes |
| | `edit-theme` | Edit theme colors/typography | ✅ Yes |
| | `rollback` | Undo last change | N/A |
| | `restore` | Restore to last commit | N/A |
| | `last-change` | View last change | Read-only |
| | `history` | View recent changes | Read-only |
| **Pages** | `create-page` | Create new page from template | ✅ Yes |
| | `duplicate-page` | Duplicate existing page | ✅ Yes |
| | `delete-page` | Delete a page | ⚠️ Destructive |
| **Content** | `content` | Update page content | ✅ Yes |
| **Sync** | `sync` | Sync roadmap to Notion | ✅ Yes |
| | `wip` | Daily WIP sync | ✅ Yes |
| | `deadline` | Check deadline alerts | Read-only |
| | `blocked` | Check blocked tasks | Read-only |
| | `summary` | Weekly summary | Read-only |

---

## 🐛 Troubleshooting

### "Build validation failed"

**Problem:** Changes broke the React build

**Solution:**
- Changes automatically rolled back from backup
- Check error message for syntax issues
- Fix and try again

### "git commit failed"

**Problem:** Git couldn't create commit

**Solution:**
- Usually harmless (already committed)
- Check `git status` to verify
- Changes are still applied and safe

### "Host key verification failed"

**Problem:** SSH connection failed from iPhone

**Solution:**
- Verify Mac is on same network
- Check Mac's IP address
- Re-add SSH host key in Shortcuts app

### "Command not found: node"

**Problem:** Node.js not in PATH for SSH session

**Solution:**
- Add to shortcut: `export PATH=/usr/local/bin:$PATH &&`
- Or use full path: `/usr/local/bin/node`

---

## 📞 Support & Resources

- **README:** `.claude/automation/README.md`
- **Router Source:** `.claude/automation/shortcut-router.js`
- **Manager Source:** `.claude/automation/global-manager.js`
- **Menu Source:** `.claude/automation/iphone-menu.js`
- **Config File:** `src/config/globalContent.js`

---

## ✅ Production Ready Checklist

- [x] Rollback commands implemented
- [x] Backup/restore mechanism added
- [x] Build validation automatic
- [x] Git auto-commit enabled
- [x] Preview mode available
- [x] Menu-driven interface created
- [x] Documentation complete
- [x] All commands tested
- [ ] Apple Shortcuts created (user action)
- [ ] Tested from iPhone (user action)

---

**Ready for iPhone Use! 🚀**
