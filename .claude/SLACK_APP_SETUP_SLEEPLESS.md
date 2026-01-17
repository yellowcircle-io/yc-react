# Slack App Configuration: /sleepless Command

**Status:** Manual setup required
**Time:** ~15 minutes
**App:** Leads (A0A2J35Q7D3)

---

## Prerequisites

- [x] Slack Bot Token configured (`SLACK_BOT_TOKEN` in .env)
- [x] Slack App Token configured (`SLACK_APP_TOKEN` in .env)
- [x] Socket Mode daemon created (`scripts/sleepless-daemon.py`)
- [ ] Slack App UI configuration (this document)

---

## Step 1: Access Slack App Dashboard

Navigate to: **https://api.slack.com/apps/A0A2J35Q7D3**

Or: https://api.slack.com/apps → Select "Leads" app

---

## Step 2: Enable Socket Mode (if not already)

1. Click **Settings** → **Socket Mode** in left sidebar
2. Toggle **Enable Socket Mode** to ON
3. If prompted, create an App-Level Token:
   - Token Name: `sleepless-socket`
   - Scope: `connections:write`
   - Click **Generate**
   - Copy the `xapp-...` token
4. Update `.env` if token changed:
   ```
   SLACK_APP_TOKEN=xapp-1-A0A2J35Q7D3-...
   ```

---

## Step 3: Create Slash Command

1. Click **Features** → **Slash Commands** in left sidebar
2. Click **Create New Command**
3. Fill in:
   | Field | Value |
   |-------|-------|
   | Command | `/sleepless` |
   | Short Description | Run Claude Code CLI command |
   | Usage Hint | `[your prompt or question]` |
   | Escape channels, users, and links | ✅ Checked |

4. Click **Save**

---

## Step 4: Verify Bot Token Scopes

1. Click **OAuth & Permissions** in left sidebar
2. Scroll to **Scopes** → **Bot Token Scopes**
3. Ensure these scopes are present:
   - [x] `chat:write` - Send messages
   - [x] `commands` - Add slash commands
   - [x] `app_mentions:read` - Read mentions (optional)
   - [x] `channels:history` - Read channel messages (optional)

4. If you added new scopes, click **Reinstall to Workspace**

---

## Step 5: Reinstall App (if prompted)

After making changes:
1. Look for yellow banner: "Please reinstall your app..."
2. Click **Reinstall to Workspace**
3. Review permissions and click **Allow**
4. Copy new Bot Token if changed and update `.env`

---

## Step 6: Start the Daemon

```bash
# Navigate to project
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle

# Activate virtual environment
source scripts/.venv/bin/activate

# Run daemon (foreground for testing)
python3 scripts/sleepless-daemon.py

# Or run in background
python3 scripts/sleepless-daemon.py --daemon
```

---

## Step 7: Test the Command

In Slack, type:
```
/sleepless hello
```

Expected response:
```
Sleepless Agent Response: (2.5s)

Hello! I'm Claude Code running via the Sleepless daemon...
```

Other test commands:
```
/sleepless status
/sleepless what is the current working directory?
/sleepless summarize the most recent git commits
```

---

## Troubleshooting

### "dispatch_failed" error
- Socket Mode not enabled
- App token invalid/expired
- Daemon not running

### "not_authed" error
- Bot token invalid
- Run: `source .env && echo $SLACK_BOT_TOKEN` to verify

### No response
- Check daemon logs
- Verify Claude CLI is installed: `which claude`
- Try: `claude --version`

### Timeout
- CLI taking too long (>120s)
- Try simpler prompt
- Check CLI auth: `claude auth status`

---

## Verification Checklist

- [ ] Socket Mode enabled in Slack App
- [ ] `/sleepless` command created
- [ ] `commands` scope added
- [ ] App reinstalled to workspace
- [ ] Daemon starts without errors
- [ ] `/sleepless status` returns response
- [ ] `/sleepless hello` returns Claude response

---

## Quick Reference

| Item | Value |
|------|-------|
| App ID | `A0A2J35Q7D3` |
| App Name | Leads |
| Bot User ID | `U0A2J4EK753` |
| Command | `/sleepless` |
| Daemon | `scripts/sleepless-daemon.py` |
| Venv | `scripts/.venv/` |
| Heartbeat | `.claude/.heartbeat.json` |
| Logs (daemon mode) | `.claude/sleepless-daemon.log` |

---

**Created:** January 17, 2026
**Last Updated:** January 17, 2026
