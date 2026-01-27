# Apple Shortcuts + SSH → Slack Integration

**Research Date:** January 24, 2026
**Status:** Ready for Implementation
**Estimated MVP Time:** 2-3 hours

---

## Executive Summary

**Verdict: HIGHLY FEASIBLE** - Both SSH and Slack webhook capabilities are well-established with multiple implementation paths.

### Two Recommended Approaches:

1. **Direct HTTP POST from Shortcuts** (Simplest) - Use Shortcuts "Get Contents of URL" to POST directly to Slack webhook
2. **SSH + Curl** (Advanced) - Execute SSH commands from Shortcuts to run server-side scripts

---

## Implementation Guide

### Step 1: Create Slack Webhook (One-time)

1. Go to: https://api.slack.com/apps
2. Create New App or select existing
3. Navigate to: Features → Incoming Webhooks
4. Click: "Activate Incoming Webhooks" (toggle on)
5. Click: "Add New Webhook to Workspace"
6. Select target channel
7. Copy webhook URL:
   ```
   https://hooks.slack.com/services/YOUR_TEAM_ID/YOUR_BOT_ID/YOUR_WEBHOOK_TOKEN
   ```

### Step 2: Apple Shortcut - Direct Webhook (Recommended)

Create a new Shortcut with these steps:

1. Ask for: "Message Text"
2. Set variable: message = (text input)
3. Add action: "Get Contents of URL"
   - URL: [Your Slack webhook URL]
   - Method: POST
   - Headers: Content-Type: application/json
   - Request Body:
     ```json
     {
       "text": "(message)",
       "username": "yellowCircle Bot",
       "icon_emoji": ":yellow_circle:"
     }
     ```
4. Add action: "Show Result"

### Step 3: SSH + Curl (Server-side Alternative)

```bash
# Command to run via Shortcuts "Run Script over SSH"
curl -X POST https://hooks.slack.com/services/YOUR_TEAM_ID/YOUR_BOT_ID/YOUR_TOKEN \
  -H 'Content-type: application/json' \
  -d '{"text":"Task completed on $(hostname) at $(date)"}'
```

---

## Advanced Formatting (Block Kit)

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "yellowCircle Status Update"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Status:*\nCompleted"
        },
        {
          "type": "mrkdwn",
          "text": "*Time:*\n2:30 PM"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "View details on [yellowCircle](https://yoursite.com)"
      }
    }
  ]
}
```

---

## yellowCircle Integration Opportunities

### A. Link Archiver Notifications
- **Trigger:** User archives link to LinkArchiverPage
- **Action:** Shortcuts sends message to Slack #link-archiver channel
- **Payload:** Link title, URL, storage location

### B. Shortlink Manager Status Updates
- **Trigger:** ShortlinkManagerPage generates short link
- **Action:** Notify team Slack of new shortlink creation

### C. Unified Notification Hub (Recommended)
Create centralized NotificationContext → Slack webhook integration:
- Link events (saved, archived, shared)
- System events (errors, completions)
- Analytics checkpoints
- User activity logging

---

## Known Limitations

| Issue | Solution |
|-------|----------|
| iOS SSH encryption may fail with older servers | Use direct HTTP POST instead |
| SSH requires user confirmation in certain contexts | Use HTTP POST (no confirmation needed) |
| Cannot customize Slack username/icon with incoming webhooks | Create Slack app with custom profile |
| Rate limiting (~5-10 req/sec per webhook) | Add delays between requests |

---

## Security Considerations

1. **Webhook URL**: Treat as API key - never commit to repo. Store in `.env` or Shortcuts secure variable
2. **SSH Keys**: Generate per-Shortcuts app, rotate regularly
3. **Message Content**: Don't log PII or sensitive data
4. **Access Control**: Restrict Slack channel to authorized users

---

## Sources

- [Slack Incoming Webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/)
- [Apple Shortcuts Run Script Over SSH](https://matthewcassinelli.com/actions/run-script-over-ssh/)
- [SSH Commands from iPhone](https://matsbauer.medium.com/how-to-run-ssh-terminal-commands-from-iphone-using-apple-shortcuts-ssh-29e868dccf22)
- [Slack Block Kit](https://api.slack.com/messaging/composing/layouts)
