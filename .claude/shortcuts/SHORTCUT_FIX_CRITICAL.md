# 🔴 CRITICAL FIX: Shortcut Variable Interpolation Issue

## The Problem

Your shortcut isn't creating commits because SSH doesn't interpolate variables that are inside a Text variable. When you build the command in a Text action and pass it to SSH, the variables remain as literal strings.

**What's happening:**
```bash
# SSH receives this (literally):
--page="Provided Input 1" --section="Provided Input" --text="Provided Input 2"

# Instead of this:
--page="about" --section="headline" --text="Your actual text"
```

## The Solution

Variables must be inserted **DIRECTLY** into the SSH script field using the "Add Variable" button.

## Updated Shortcut Configuration

### Delete These Actions:
- ❌ Delete the "Text" action that builds the command
- ✅ Keep all 3 "Ask for Input" actions

### Update "Run Script Over SSH" Action:

1. Click into the SSH script field
2. **Delete everything currently there**
3. Type/paste this EXACTLY, but **STOP** at each `[INSERT_VAR]` marker:

```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js content --page=[INSERT_VAR_1] --section=[INSERT_VAR_2] --text="[INSERT_VAR_3]"
```

4. **At each `[INSERT_VAR]` position:**
   - Delete the `[INSERT_VAR_X]` placeholder
   - Tap "Add Variable" button (above keyboard)
   - Select the correct variable:
     - `[INSERT_VAR_1]` → Select "Provided Input 1"
     - `[INSERT_VAR_2]` → Select "Provided Input"
     - `[INSERT_VAR_3]` → Select "Provided Input 2"

**Final result should look like this in the editor:**
```
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js content --page=<Provided Input 1> --section=<Provided Input> --text="<Provided Input 2>"
```

Where `<Provided Input X>` appears as a blue bubble/pill, not as text.

### Add "Show Alert" Action

After the SSH action, add:
1. Click "+" to add new action
2. Search for "Show Alert"
3. In the alert text field:
   - Type: "Content Update Complete! "
   - Tap "Add Variable" → Select "Shortcut Result"
4. Set title: "yellowCircle Update"

## Test Command

After updating, test with:
- Page: `about`
- Section: `headline`
- Text: `Shortcut Test Working`

Check:
1. Alert shows full deployment output
2. GitHub shows new commit
3. https://yellowcircle-app.web.app/about shows "Shortcut Test Working"

## Why This Works

**Wrong (current approach):**
```
Text Action builds: "command --page=Provided Input 1"
    ↓
SSH receives: Literal string "command --page=Provided Input 1"
    ↓
❌ Variables not substituted
```

**Correct (new approach):**
```
SSH field has: command --page=<blue pill: Provided Input 1>
    ↓
Shortcuts substitutes variables BEFORE sending to SSH
    ↓
SSH receives: "command --page=about"
    ✅ Variables properly substituted
```

## Quick Reference: All 5 Shortcuts

Once you fix the Content Update shortcut, here are the SSH commands for the other 4:

### 1. Sync Roadmap
```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js sync
```

### 2. WIP Sync
```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js wip
```

### 3. Check Deadlines
```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js deadline
```

### 4. Weekly Summary
```bash
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js summary
```

These 4 don't need variables, so they can be typed directly (no blue pills needed).
