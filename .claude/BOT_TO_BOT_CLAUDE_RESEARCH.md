# Bot-to-Bot Communication with Claude Slack Integration

**Research Date:** January 10, 2026

## Problem Statement
The yellowCircle sleepless agent (Leads bot) cannot trigger Claude responses via Slack mentions. Human DMs work, but bot-to-bot communication does not.

## Root Cause Analysis

### Slack Platform Limitation
Most Slack bots explicitly ignore `bot_message` subtypes to prevent infinite loops:
```javascript
// Common pattern in Slack bots
if (msg.subtype === 'bot_message') return; // Ignored
```

### Claude's Intent Detection
According to [TechCrunch](https://techcrunch.com/2025/12/08/claude-code-is-coming-to-slack-and-thats-a-bigger-deal-than-it-sounds/), Claude Code in Slack uses **intent detection** to classify messages:
> "Intent detection classifies whether this is a coding task. If it is, the message is routed to Claude Code instead of returning a simple chat answer."

Bot messages may be filtered before intent detection for security reasons.

## Solutions

### Option 1: Pipedream Bridge (Recommended)
Use [Pipedream](https://pipedream.com/apps/anthropic/integrations/slack) to create a workflow:

```
Leads Bot → Slack Message → Pipedream Trigger → Claude API → Slack Reply
```

**Pros:**
- Bypasses Slack bot-to-bot limitations
- Direct Claude API access
- Full control over request/response

**Cons:**
- Requires Pipedream account
- Additional infrastructure
- API costs separate from Slack integration

**Implementation:**
1. Create Pipedream workflow
2. Trigger: Slack message in specific channel
3. Filter: Messages from Leads bot with "@claude" text
4. Action: Call Claude API (Anthropic)
5. Action: Post response back to Slack

### Option 2: Webhook Relay
Create a Firebase/n8n workflow that:
1. Listens for Leads bot messages containing "@claude"
2. Reformats and sends as "human-like" message
3. Or calls Claude API directly

### Option 3: Open Source Bot
Use [mpociot/claude-code-slack-bot](https://github.com/mpociot/claude-code-slack-bot):
> "Connect your local Claude Code agent with Slack"

This community project may have more flexibility with bot message handling.

### Option 4: Shared Channel with Human Trigger
Keep current approach:
1. Leads bot tags `<@U09TPRV5ZQB>` for visibility
2. Human reviews and manually triggers Claude if needed
3. Claude responds to human, visible to all

## Technical Implementation: Pipedream

### Step 1: Create Pipedream Account
- Sign up at pipedream.com
- Connect Slack workspace
- Add Anthropic API key

### Step 2: Create Workflow

```yaml
Trigger:
  Type: Slack - New Message in Channel
  Channel: C09UQGASA2C

Filter:
  Condition: |
    message.user === 'U0A2J4EK753' AND  # Leads bot
    message.text.includes('@claude') OR
    message.text.includes('U09TPRV5ZQB')

Action 1 - Call Claude API:
  Model: claude-3-opus
  System: "You are Claude, responding to a request from the yellowCircle sleepless agent."
  Message: ${steps.trigger.event.text}

Action 2 - Post to Slack:
  Channel: C09UQGASA2C
  Text: ${steps.claude.response}
  Thread: ${steps.trigger.event.ts}  # Reply in thread
```

### Step 3: Test
- Send message from Leads bot with @claude mention
- Verify Pipedream triggers
- Check Claude response posted

## Cost Considerations

| Solution | Cost |
|----------|------|
| Pipedream Free | 100 invocations/day |
| Pipedream Pro | $19/month unlimited |
| Claude API | ~$15/million input tokens |
| Current Slack | Included in Team plan |

## Recommendation

**Short-term:** Use Option 4 (human trigger) for critical Claude reviews

**Medium-term:** Implement Option 1 (Pipedream) for automation:
- Low setup effort
- Reliable infrastructure
- Full API access

## Environment Variables Needed

```bash
# For Pipedream or custom solution
ANTHROPIC_API_KEY=sk-ant-...
SLACK_BOT_TOKEN=xoxb-...  # Already have
SLACK_CHANNEL=C09UQGASA2C  # Already have
```

## References

- [Claude Code Slack Integration Guide](https://www.digitalapplied.com/blog/claude-code-slack-integration-guide)
- [Pipedream Slack + Claude Integration](https://pipedream.com/apps/anthropic/integrations/slack)
- [mpociot/claude-code-slack-bot](https://github.com/mpociot/claude-code-slack-bot)
- [VentureBeat: Claude Code Slack](https://venturebeat.com/ai/anthropics-claude-code-can-now-read-your-slack-messages-and-write-code-for)
