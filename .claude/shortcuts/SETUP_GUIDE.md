# iPhone Shortcuts Setup Guide

Complete guide to set up yellowCircle mobile command system on your iPhone.

**Goal:** Execute yellowCircle commands from iPhone using Siri or taps.

---

## Method 1: SSH to Mac (RECOMMENDED - Fastest)

### Prerequisites
- Mac Mini running and connected to same network as iPhone
- SSH enabled on Mac Mini

### Setup Steps

**1. Enable SSH on Mac Mini** (if not already done)
```bash
# On Mac Mini Terminal:
sudo systemsetup -setremotelogin on
```

**2. Find Mac Mini IP Address**
```bash
# On Mac Mini Terminal:
ifconfig | grep "inet " | grep -v 127.0.0.1
# Look for line like: inet 192.168.1.100
# Or use: hostname
# Result: mac-mini.local
```

**3. Test SSH Connection**

On iPhone, download "Termius" app (free) from App Store, or use built-in Shortcuts SSH.

Test connection:
- Host: `192.168.1.X` or `mac-mini.local`
- User: `christopherwilliamson`
- Password: [your Mac password]

**4. Create iPhone Shortcut**

Open Shortcuts app on iPhone:

1. Tap **+** (top right)
2. Tap **Add Action**
3. Search for "**Run Script Over SSH**"
4. Configure:
   - **Host:** `mac-mini.local` (or IP address)
   - **Port:** `22`
   - **User:** `christopherwilliamson`
   - **Authentication:** Password or Key
   - **Script:** See below

5. Add menu before SSH step:
   - Tap **+** before SSH action
   - Search for "**Choose from Menu**"
   - Add menu items (see Command Menu below)

6. Name shortcut: "**yellowCircle**"
7. Tap **Done**

---

## Command Menu Structure

### Menu Items (matching slash commands):

**Automation Commands:**
- `/automation sync` - Sync roadmap to Notion
- `/automation wip` - Daily WIP sync
- `/automation deadline` - Check deadlines
- `/automation blocked` - Check blocked tasks
- `/automation summary` - Weekly summary

**Content Commands:**
- `/content update` - Update page content
- `/content deploy` - Build and deploy

**Project Commands:**
- `/rho` - Rho work
- `/projects` - Other projects

---

## SSH Scripts for Each Command

### For /automation sync
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
npm run sync
```

### For /automation wip
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
npm run wip:sync
```

### For /content update (with parameters)
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
# Ask for page, section, text first, then:
npm run content:update -- --page=about --section=headline --text="New headline"
```

---

## Complete Shortcut Configuration

**Shortcut Flow:**

```
1. Choose from Menu "What command?"
   ├─ Sync Roadmap
   │  └─ Run SSH: cd ~/.claude/automation && npm run sync
   │
   ├─ WIP Sync
   │  └─ Run SSH: cd ~/.claude/automation && npm run wip:sync
   │
   ├─ Update Content
   │  ├─ Ask: "Which page?" [about, home, works, etc.]
   │  ├─ Ask: "Which section?" [headline, description, background]
   │  ├─ Ask: "New text?"
   │  └─ Run SSH: cd ~/.claude/automation && npm run content:update -- --page=[page] --section=[section] --text="[text]"
   │
   ├─ Deadline Alerts
   │  └─ Run SSH: cd ~/.claude/automation && npm run alerts:deadline
   │
   └─ Weekly Summary
      └─ Run SSH: cd ~/.claude/automation && npm run summary:weekly

2. Show Result (SSH output)
3. Show Notification
```

---

## Method 2: GitHub API (Cloud-based, works anywhere)

### Prerequisites
- GitHub Personal Access Token

### Setup Steps

**1. Create GitHub Token**
- Go to: https://github.com/settings/tokens
- Click "Generate new token (classic)"
- Name: "iPhone Shortcuts"
- Scopes: `repo`, `workflow`
- Click "Generate token"
- **Copy token immediately** (can't view again)

**2. Create Shortcut**

```
1. Choose from Menu "What command?"
   - Sync, WIP, Deadline, etc.

2. Set Variable "command" to menu choice

3. Get Contents of URL
   URL: https://api.github.com/repos/yellowcircle-io/yc-react/actions/workflows/command-executor.yml/dispatches
   Method: POST
   Headers:
     Authorization: Bearer [YOUR_TOKEN]
     Accept: application/vnd.github+json
   Body: JSON
     {
       "ref": "main",
       "inputs": {
         "command": "[command variable]"
       }
     }

4. Show Alert "Command queued! Check GitHub Actions."
```

---

## Siri Integration

After creating shortcut:

1. Go to iPhone **Settings** → **Siri & Search**
2. Tap **Shortcuts**
3. Find "yellowCircle"
4. Tap **Add to Siri**
5. Record phrase: "**yellowCircle**" or "**yellow circle command**"

**To use:**
```
"Hey Siri, yellowCircle"
Siri: "What command?"
You: "WIP Sync" (tap or say)
Siri: [Shows result]
```

---

## Testing

### Test SSH Method

1. Open Shortcuts app
2. Tap your "yellowCircle" shortcut
3. Choose "WIP Sync"
4. Should see output of npm run wip:sync
5. Verify in Notion that tasks updated

### Test GitHub Method

1. Run shortcut
2. Choose command
3. Go to: https://github.com/yellowcircle-io/yc-react/actions
4. Should see workflow running
5. Check results when complete

---

## Content Update Example

**Scenario:** Update About page headline from iPhone

**Steps:**
1. "Hey Siri, yellowCircle"
2. Choose "Update Content"
3. Page: "about"
4. Section: "headline"
5. Text: "Building Creative Technology"
6. Wait ~30 seconds
7. Check: https://yellowcircle-app.web.app/about
8. (May need to deploy: "Hey Siri, yellowCircle" → "Deploy")

---

## Quick Reference

| Command | Purpose | Time |
|---------|---------|------|
| Sync | Roadmap → Notion | ~30s |
| WIP | Update task statuses | ~10s |
| Deadline | Check due tasks | ~5s |
| Summary | Weekly report | ~15s |
| Update Content | Change page text | ~5s |
| Deploy | Push to production | ~2min |

---

## Troubleshooting

### "SSH Connection Failed"
- Check Mac Mini is on
- Verify same WiFi network
- Try IP address instead of hostname
- Test in Termius app first

### "Command Not Found"
- Verify path: `~/Library/CloudStorage/Dropbox/CC\ Projects/...`
- Check npm is in PATH: `which npm`
- Try full path: `/usr/local/bin/npm`

### "Permission Denied"
- Check username is correct
- Verify password
- Or use SSH key (more secure)

---

## Next Steps

1. **Today:** Set up SSH method, test sync commands
2. **This Week:** Create content update workflows
3. **Future:** Add more automation, voice commands

---

**Created:** November 18, 2025
**Status:** Ready to implement
