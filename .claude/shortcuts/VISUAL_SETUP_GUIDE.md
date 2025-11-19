# Visual Guide: Creating the Content Update Shortcut

## What You'll Build

A shortcut that:
1. Asks for page name (about/home/works/etc)
2. Asks for section (headline/description/background)
3. Asks for the new text
4. Updates the file, commits, pushes to GitHub
5. Shows deployment status and timeline

## Step-by-Step Setup

### Step 1: Create New Shortcut
1. Open **Shortcuts** app
2. Click "+" to create new shortcut
3. Name it: **"yellowCircle: Update Content"**

### Step 2: Add Input Actions

**Action 1 - Ask for Page:**
```
Search: "Ask for Input"
Add: "Ask for Input"
Configure:
  - Prompt: "Which page?"
  - Default Answer: "about"
  - Input Type: Text
```
This creates variable: "Provided Input 1"

**Action 2 - Ask for Section:**
```
Add: "Ask for Input"
Configure:
  - Prompt: "Which section?"
  - Default Answer: "headline"
  - Input Type: Text
```
This creates variable: "Provided Input"

**Action 3 - Ask for Text:**
```
Add: "Ask for Input"
Configure:
  - Prompt: "New text?"
  - Default Answer: ""
  - Input Type: Text
```
This creates variable: "Provided Input 2"

### Step 3: Add SSH Action

**⚠️ CRITICAL: Do NOT use a Text action to build the command!**

```
Search: "Run script over SSH"
Add: "Run script over SSH"
Configure:
  - Host: Your Mac Mini hostname/IP
  - User: Your SSH username
  - Authentication: Your SSH key/password
```

**In the Script field (this is the critical part):**

1. Type the first part:
   ```
   source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js content --page=
   ```

2. **Tap "Add Variable"** → Select **"Provided Input 1"**
   (A blue pill appears)

3. Type the next part:
   ```
    --section=
   ```

4. **Tap "Add Variable"** → Select **"Provided Input"**
   (Another blue pill appears)

5. Type the next part:
   ```
    --text="
   ```

6. **Tap "Add Variable"** → Select **"Provided Input 2"**
   (Third blue pill appears)

7. Type the closing quote:
   ```
   "
   ```

**What it looks like in the editor:**
```
source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js content --page=<Provided Input 1> --section=<Provided Input> --text="<Provided Input 2>"
```

Where `<...>` are blue variable pills, not actual text.

### Step 4: Add Alert Action

```
Search: "Show Alert"
Add: "Show Alert"
Configure:
  - Title: "yellowCircle Update"
  - Message: Tap "Add Variable" → Select "Shortcut Result"
  - Show Cancel Button: OFF
```

This displays the formatted output showing what changed and deployment timeline.

## Final Shortcut Structure

```
┌─────────────────────────────────────┐
│ 1. Ask for Input                     │
│    Prompt: "Which page?"             │
│    Default: "about"                  │
│    → Creates "Provided Input 1"      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. Ask for Input                     │
│    Prompt: "Which section?"          │
│    Default: "headline"               │
│    → Creates "Provided Input"        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. Ask for Input                     │
│    Prompt: "New text?"               │
│    → Creates "Provided Input 2"      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 4. Run Script Over SSH               │
│    Script field contains:            │
│    source ~/.nvm/nvm.sh; cd ~/...; \ │
│    node shortcut-router.js content \ │
│    --page=<blue pill> \              │
│    --section=<blue pill> \           │
│    --text="<blue pill>"              │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 5. Show Alert                        │
│    Title: "yellowCircle Update"      │
│    Message: <Shortcut Result pill>   │
└─────────────────────────────────────┘
```

## Testing

1. Run the shortcut
2. Enter:
   - Page: `about`
   - Section: `headline`
   - Text: `Shortcut Test Working`
3. Wait for alert showing deployment info
4. Verify:
   - ✅ Alert shows complete deployment timeline
   - ✅ New commit appears on GitHub
   - ✅ After 60 seconds, https://yellowcircle-app.web.app/about shows new text

## Troubleshooting

**If you don't see changes:**

1. Check the alert output - does it say "✅ Pushed to GitHub"?
2. Check GitHub commits - is there a new commit?
3. If no commit, the SSH variables aren't being substituted
   - Make sure you used "Add Variable" button for blue pills
   - DO NOT type "Provided Input 1" as text
   - The variables must appear as blue/gray pills in the editor

**Common mistakes:**

❌ Using a Text action to build the command
❌ Typing variable names as text instead of using "Add Variable"
❌ Forgetting quotes around the `--text=` value
❌ Wrong variable mapping (Input 1 should go to --page)

## iCloud Sync to iPhone

Once the shortcut works on Mac:
1. Wait 30 seconds for iCloud sync
2. Open Shortcuts app on iPhone
3. Shortcut appears automatically
4. Tap to run (no voice commands needed)
5. Works identically to Mac version

## Creating the Other 4 Shortcuts

For the simpler commands (no variables needed):

**Sync Roadmap:**
- Skip the "Ask for Input" actions
- Just use "Run Script Over SSH" with:
  ```
  source ~/.nvm/nvm.sh; cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation; node shortcut-router.js sync
  ```
- Add "Show Alert" to display results

Same pattern for WIP Sync, Check Deadlines, Weekly Summary.
