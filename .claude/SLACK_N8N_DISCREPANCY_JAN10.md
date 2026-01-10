# Slack/n8n Notification Discrepancy - January 10, 2026

## Issue Reported
User reported Slack notifications were received from sleepless agent on Jan 7/8, 2026, but n8n/Railway was down.

## Investigation Findings

### Two Separate Notification Systems

| System | Mechanism | Status | Used By |
|--------|-----------|--------|---------|
| **n8n Pipeline** | Webhook → Railway → Airtable + Slack | DOWN (404) | Web app lead capture |
| **Sleepless Agent** | Direct `SLACK_BOT_TOKEN` → Slack API | UNKNOWN | Autonomous agent tasks |

### n8n Pipeline (Web App)
- **URL:** `https://n8n-production-9ef7.up.railway.app/webhook/06c2ff2a-632f-46a6-9326-3d73216e9713`
- **Status:** Returns 404 (Railway deployment down)
- **Fixed:** Added automatic fallback to direct Slack webhook in `src/config/integrations.js`
- **Files:** `src/config/integrations.js` lines 137-152

### Sleepless Agent (Direct)
- **Script:** `scripts/slack-notify.py`
- **API:** `https://slack.com/api/chat.postMessage`
- **Auth:** `SLACK_BOT_TOKEN` environment variable
- **Issue:** Token NOT FOUND in current `.env`

## Token Status

### Expected (from .env.example):
```
SLACK_BOT_TOKEN=[YOUR-BOT-TOKEN]
SLACK_APP_TOKEN=[YOUR-APP-TOKEN]
SLACK_CHANNEL=C0XXXXXX
```

### Current .env:
- `VITE_GROQ_API_KEY` ✅ Present
- `VITE_N8N_WEBHOOK` ✅ Present
- `VITE_SLACK_WEBHOOK` ❌ Empty (placeholder added)
- `SLACK_BOT_TOKEN` ❌ MISSING
- `SLACK_APP_TOKEN` ❌ MISSING
- `SLACK_CHANNEL` ❌ MISSING

## WIP Reference (Dec 21-24, 2025)
From `WIP_CURRENT_CRITICAL.md`:
> Dec 21, 2025: "Slack Integration ✅ WORKING - Bot token configured, notifications sending"

The tokens were configured and working as of Dec 24, 2025.

## Possible Explanations

1. **Tokens removed from .env** - Between Dec 24 and now, tokens were deleted
2. **Different .env on different machine** - MacBook Air may have different .env
3. **Tokens in environment directly** - Set via shell profile, not .env file
4. **sleepless agent has cached tokens** - Running process may have tokens in memory

## Resolution Required

### For Sleepless Agent Notifications:
Add to `.env`:
```bash
# Slack Bot Token (get from api.slack.com/apps → OAuth & Permissions)
SLACK_BOT_TOKEN=[YOUR-BOT-TOKEN]

# Optional: App token for Socket Mode
SLACK_APP_TOKEN=[YOUR-APP-TOKEN]

# Default channel (user ID for DMs: U0A2J4EK753)
SLACK_CHANNEL=U0A2J4EK753
```

### For Web App Lead Capture:
Either:
1. Restart n8n on Railway (https://railway.app dashboard)
2. Or add `VITE_SLACK_WEBHOOK` for direct fallback

## Files Modified Today
- `src/config/integrations.js` - Added n8n → Slack fallback
- `.env` - Added `VITE_SLACK_WEBHOOK=` placeholder
- `.claude/SLACK_N8N_DISCREPANCY_JAN10.md` - This document

## Next Steps
1. User to add `SLACK_BOT_TOKEN` to .env
2. Verify sleepless agent can send notifications
3. Optionally configure `VITE_SLACK_WEBHOOK` for web app fallback
