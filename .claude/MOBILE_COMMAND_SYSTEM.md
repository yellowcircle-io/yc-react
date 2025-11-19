# Mobile Command System - iPhone Integration

Execute yellowCircle automation commands from your iPhone using Email or Apple Shortcuts.

**Created:** November 18, 2025
**Status:** ✅ Ready for use

---

## Quick Start

### Method 1: Email to GitHub (SIMPLEST - Works NOW)

**To execute a command:**

1. Create a GitHub issue via email or GitHub mobile app
2. Add label: `command`
3. First line of issue body = command

**Example Email:**
```
To: (create issue via GitHub web/app first, then get email address)
Subject: Run automation

wip sync
```

**GitHub Action will:**
- Execute the command
- Comment results on the issue
- Close the issue automatically

---

### Method 2: iPhone Shortcuts (FASTEST - Requires setup)

#### Option A: SSH to Mac (Direct Execution)

**Setup (One-time):**

1. **Enable SSH on Mac Mini:**
   ```bash
   # On Mac Mini:
   sudo systemsetup -setremotelogin on
   ```

2. **Get Mac Mini IP Address:**
   ```bash
   # On Mac Mini:
   ifconfig | grep "inet "
   # Look for: inet 192.168.X.X (your local IP)
   ```

3. **Create SSH key on iPhone:**
   - Download "Termius" app or "SSH Client" from App Store
   - Or use Shortcuts with password (less secure)

4. **Create iPhone Shortcut:**

```
Shortcut: "yellowCircle Command"

Actions:
1. Ask for Input: "What command?"
   - Default: "wip sync"

2. Run Script over SSH
   - Host: 192.168.X.X (your Mac Mini IP)
   - User: christopherwilliamson
   - Script:
     cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
     npm run [command from input]

3. Show Result
```

**To use:**
```
"Hey Siri, yellowCircle Command"
Siri: "What command?"
You: "wip sync"
Siri: [Shows output of npm run wip:sync]
```

#### Option B: GitHub API (Cloud-based)

**Setup (One-time):**

1. **Create GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Scopes: `repo`, `workflow`
   - Copy token

2. **Create iPhone Shortcut:**

```
Shortcut: "yellowCircle GitHub"

Actions:
1. Ask for Input: "What command?"
   - Choices: sync, wip, deadline, blocked, summary, all

2. Get Contents of URL
   - URL: https://api.github.com/repos/yellowcircle-io/yc-react/actions/workflows/command-executor.yml/dispatches
   - Method: POST
   - Headers:
     - Authorization: Bearer [YOUR_GITHUB_TOKEN]
     - Accept: application/vnd.github+json
   - Request Body: JSON
     {
       "ref": "main",
       "inputs": {
         "command": "[command from input]"
       }
     }

3. Show Alert: "Command queued! Check GitHub Actions for results."
```

**To use:**
```
"Hey Siri, yellowCircle GitHub"
Siri: "What command?"
You: "wip sync"
Siri: "Command queued! Check GitHub Actions for results."
```

---

## Available Commands

### Automation Commands (via GitHub Actions)

| Command | Description | Output |
|---------|-------------|--------|
| `sync` | Sync roadmap → Notion | All 94 tasks synced |
| `wip` or `wip sync` | Daily WIP sync | Task statuses updated |
| `deadline` | Check deadline alerts | Tasks due soon |
| `blocked` | Check blocked tasks | Tasks blocked >48h |
| `summary` | Generate weekly summary | Weekly progress report |
| `all` | Run all automations | Complete sync + alerts |

### Future: Content Commands (via Claude Code)

These will require Claude Code API integration (coming soon):

| Command | Description | Example |
|---------|-------------|---------|
| `content: update [page] [change]` | Update page content | `content: update about Change headline to X` |
| `deploy` | Deploy to Firebase | `deploy` |
| `create page [name]` | Create new page | `create page contact` |

---

## How It Works

### Architecture

```
┌─────────────┐
│   iPhone    │
│             │
│  [Email]    │───────┐
│  [Shortcut] │       │
└─────────────┘       │
                      ▼
              ┌───────────────┐
              │ GitHub Issue  │
              │ Label:command │
              └───────────────┘
                      │
                      ▼
              ┌───────────────┐
              │GitHub Action  │
              │command-       │
              │executor.yml   │
              └───────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Execute npm   │
              │ run [command] │
              └───────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Update Notion │
              │ Generate files│
              └───────────────┘
                      │
                      ▼
              ┌───────────────┐
              │Comment result │
              │Close issue    │
              └───────────────┘
```

### Command Flow

1. **iPhone:** Create GitHub issue with command (email or Shortcuts)
2. **GitHub:** Issue created with label `command`
3. **GitHub Action:** Triggered by `command` label
4. **Parse:** Extract command from issue body
5. **Execute:** Run corresponding npm script
6. **Respond:** Comment results on issue
7. **Close:** Mark issue as executed

---

## Example Use Cases

### Morning Routine

**Shortcut: "Start Work"**
```
1. Run: wip sync
2. Run: deadline
3. Run: blocked
4. Show notification with summary
```

**Result:** Morning dashboard of today's priorities

### Quick Status Check

**Shortcut: "yellowCircle Status"**
```
1. Run: summary
2. Parse output for completed tasks
3. Show notification: "8 tasks done this week"
```

### Content Update (Future)

**Shortcut: "Update yellowCircle"**
```
1. Ask: "What needs updating?"
2. Create GitHub issue: content: [user input]
3. (Future) Claude Code processes and deploys
4. Show: "Updated and deployed!"
```

---

## Setup Instructions

### For GitHub Actions (Email/API Method)

1. **Add GitHub Secrets** (if not done):
   - Go to: https://github.com/yellowcircle-io/yc-react/settings/secrets/actions
   - Add: `NOTION_API_KEY`
   - Add: `NOTION_ROADMAP_DB_ID`

2. **Enable GitHub Actions:**
   - Go to: https://github.com/yellowcircle-io/yc-react/actions
   - Enable workflows if not already enabled

3. **Test manually:**
   - Create issue with label `command`
   - Body: `wip sync`
   - Watch Actions tab for execution

### For SSH Method (Direct Mac Execution)

1. **Enable SSH on Mac Mini:**
   ```bash
   sudo systemsetup -setremotelogin on
   ```

2. **Find Mac IP:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

3. **Test SSH from iPhone:**
   - Use Termius or SSH app
   - Connect to Mac Mini
   - Test command: `cd ~/.claude/automation && npm run wip:sync`

4. **Create Shortcut** (use template above)

---

## Security Considerations

### GitHub Token Method
- ✅ Token only has `repo` and `workflow` scope
- ✅ Stored securely in iOS Keychain
- ⚠️ Don't share token publicly

### SSH Method
- ✅ Uses local network (not internet-facing)
- ✅ SSH key authentication recommended
- ⚠️ Requires Mac to be running

### Email Method
- ✅ No credentials stored on phone
- ✅ Uses GitHub's authentication
- ⚠️ Anyone with repo access can create issues (but repo is private)

---

## Troubleshooting

### "Command not executed"
- Check Actions tab: https://github.com/yellowcircle-io/yc-react/actions
- Verify issue has `command` label
- Check GitHub Secrets are configured

### "SSH connection failed"
- Verify Mac Mini is on and SSH is enabled
- Check IP address hasn't changed (use hostname if on same network)
- Test connection in Termius first

### "Shortcut doesn't work"
- Verify Shortcuts app has necessary permissions
- Test each step individually
- Check GitHub token hasn't expired

---

## Next Steps

### Immediate
1. Test email/GitHub issue method today
2. Create one basic iPhone Shortcut
3. Test SSH connection to Mac

### Short-term
1. Create library of useful shortcuts
2. Add more automation commands
3. Integrate with Apple Watch for quick checks

### Long-term (When Claude Code adds API)
1. Enable actual code changes from iPhone
2. Voice commands: "Change homepage background"
3. Photo uploads: "Use this screenshot for design"
4. Conversational interface: Full Claude Code chat on iPhone

---

## Resources

**GitHub Repository:** https://github.com/yellowcircle-io/yc-react
**Actions Tab:** https://github.com/yellowcircle-io/yc-react/actions
**Issues:** https://github.com/yellowcircle-io/yc-react/issues

**Shortcuts Gallery:**
- [iOS Shortcuts Documentation](https://support.apple.com/guide/shortcuts/welcome/ios)
- [GitHub API Reference](https://docs.github.com/en/rest)

**Created:** November 18, 2025
**Last Updated:** November 18, 2025
