# Slack Bot Capabilities Status

**Updated:** January 10, 2026

## Current Bot Info
- **Workspace:** yellow circle
- **Bot Name:** leads
- **User ID:** U0A2J4EK753
- **Bot ID:** B0A30EXHLE5

## Current Capabilities

| Feature | Status | Notes |
|---------|--------|-------|
| Send messages | ✅ Working | `chat.postMessage` API |
| Mention @christopher | ✅ Working | Use `<@U0A2J4EK753>` |
| Mention @claude | ✅ Working | Use `<@U09TPRV5ZQB>` |
| Read channel history | ✅ Working | `conversations.history` API |
| Upload files/images | ✅ Working | New v2 API (Jan 2026) |
| List users | ✅ Working | `users.list` API |

## Required Scopes to Add

To enable file uploads, add these scopes at:
**https://api.slack.com/apps** → Your App → OAuth & Permissions → Bot Token Scopes

### Missing Scopes
1. `files:write` - Upload, edit, and delete files
2. `files:read` - View files shared in channels
3. `users:read` - View users in workspace (for user ID lookup)

### After Adding Scopes
1. Reinstall the app to the workspace
2. Copy the new Bot User OAuth Token
3. Update `SLACK_BOT_TOKEN` in `.env`

## User IDs in Workspace

| Name | User ID | Type | Notes |
|------|---------|------|-------|
| Christopher | U0A2J4EK753 | Bot | Leads bot / posting identity |
| Claude | U09TPRV5ZQB | Bot | Claude Integration |
| Unknown | U3JP2J8NS | User | Seen in channel history |
| Perplexity | U09TW7V1GAE | Bot | Perplexity AI |
| Notion | U09UQGKJL56 | Bot | Notion Integration |
| GitHub | U09TEQ1TFM5 | Bot | GitHub Integration |

## @claude Tagging - RESOLVED

✅ Claude Integration is installed. Correct user ID: **`U09TPRV5ZQB`**

### Usage in Messages
```
<@U09TPRV5ZQB>  → triggers @claude mention
```

### To Trigger Claude Bot Actions
The Claude Slack integration may have specific trigger patterns. Check:
1. Direct messages to @claude
2. Mentions in channels where Claude bot is invited
3. Specific slash commands (if configured)

## Screenshot Sharing - WORKING

✅ File uploads now work with new Slack v2 API.

### Primary: Direct Slack Upload
```bash
python3 scripts/slack-upload.py "Message" file1.png file2.png
```

### Backup: Cloudinary URLs
```bash
# Upload to Cloudinary, returns URL
# Cloud: yellowcircle-io
# Preset: uk-memories-unsigned
```

### Local Storage
Files saved in `.playwright-mcp/` for local access.

## Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `scripts/slack-notify.py` | Send text messages | ✅ Working |
| `scripts/slack-upload.py` | Upload files (v2 API) | ✅ Working |

## Test Commands

```bash
# Test message sending
python3 scripts/slack-notify.py "Test message"

# Test file upload (will fail without scope)
python3 scripts/slack-upload.py "Test" screenshot.png

# Check bot identity
curl -H "Authorization: Bearer $SLACK_BOT_TOKEN" https://slack.com/api/auth.test
```
