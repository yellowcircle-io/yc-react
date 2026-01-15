# Claude Bot Relay - No Human Intervention Methods

**Scoped:** January 10, 2026
**Goal:** Enable Leads bot to trigger Claude responses automatically

## Executive Summary

| Method | Setup Time | Cost | Reliability | Maintenance |
|--------|-----------|------|-------------|-------------|
| Firebase Function | 2-3 hrs | Free tier | High | Low |
| n8n Workflow | 1-2 hrs | Railway ($5/mo) | Medium | Low |
| Local Polling Script | 1 hr | Free | Medium | Medium |
| Pipedream | 30 min | Free/Paid | High | None |

---

## Method 1: Firebase Cloud Function (Recommended)

**Why:** Already using Firebase, no new infrastructure needed.

### Architecture
```
Slack Event → Firebase Function → Claude API → Slack Reply
     ↑
  Webhook subscription
```

### Implementation

**1. Add to `functions/index.js`:**

```javascript
const functions = require('firebase-functions');
const fetch = require('node-fetch');

// Slack Event Subscription endpoint
exports.slackClaudeRelay = functions.https.onRequest(async (req, res) => {
  // Handle Slack URL verification
  if (req.body.type === 'url_verification') {
    return res.json({ challenge: req.body.challenge });
  }

  const event = req.body.event;

  // Only process messages from Leads bot mentioning Claude
  if (event?.type !== 'message') return res.sendStatus(200);
  if (event.user !== 'U0A2J4EK753') return res.sendStatus(200); // Leads bot only
  if (!event.text?.includes('U09TPRV5ZQB')) return res.sendStatus(200); // Must mention Claude

  // Extract message (remove Claude mention)
  const message = event.text.replace(/<@U09TPRV5ZQB>/g, '').trim();

  try {
    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': functions.config().anthropic.api_key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: 'You are Claude, reviewing content for the yellowCircle team. Be concise and actionable.',
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await claudeResponse.json();
    const reply = data.content[0]?.text || 'No response generated';

    // Post reply to Slack (in thread if applicable)
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${functions.config().slack.bot_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: event.channel,
        thread_ts: event.thread_ts || event.ts,
        text: `🤖 *Claude Response:*\n\n${reply}`,
      }),
    });

  } catch (error) {
    console.error('Claude relay error:', error);
  }

  res.sendStatus(200);
});
```

**2. Set Firebase config:**
```bash
firebase functions:config:set anthropic.api_key="sk-ant-..."
firebase functions:config:set slack.bot_token="xoxb-..."
```

**3. Deploy:**
```bash
cd functions && npm install node-fetch
firebase deploy --only functions:slackClaudeRelay
```

**4. Configure Slack Event Subscription:**
- Go to api.slack.com/apps → Your App
- Event Subscriptions → Enable
- Request URL: `https://us-central1-yellowcircle-app.cloudfunctions.net/slackClaudeRelay`
- Subscribe to: `message.channels`, `message.groups`

### Requirements
- [ ] Anthropic API key (`sk-ant-...`)
- [ ] Update Slack app with Event Subscriptions
- [ ] Firebase Blaze plan (for external API calls)

---

## Method 2: n8n Workflow (Existing Infrastructure)

**Why:** Already have n8n on Railway, just needs workflow.

### Architecture
```
Slack Trigger → Filter Bot Messages → Claude HTTP → Slack Reply
```

### Workflow JSON
```json
{
  "nodes": [
    {
      "name": "Slack Trigger",
      "type": "n8n-nodes-base.slackTrigger",
      "parameters": {
        "channel": "C09UQGASA2C",
        "events": ["message"]
      }
    },
    {
      "name": "Filter Leads Bot + Claude Mention",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            { "value1": "={{$json.user}}", "value2": "U0A2J4EK753" },
            { "value1": "={{$json.text}}", "operation": "contains", "value2": "U09TPRV5ZQB" }
          ]
        }
      }
    },
    {
      "name": "Call Claude API",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.anthropic.com/v1/messages",
        "method": "POST",
        "headers": {
          "x-api-key": "={{$env.ANTHROPIC_API_KEY}}",
          "anthropic-version": "2023-06-01"
        },
        "body": {
          "model": "claude-sonnet-4-5-20250929",
          "max_tokens": 1024,
          "messages": [{"role": "user", "content": "={{$json.text}}"}]
        }
      }
    },
    {
      "name": "Post to Slack",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "channel": "C09UQGASA2C",
        "text": "🤖 *Claude:* {{$json.content[0].text}}"
      }
    }
  ]
}
```

### Setup Steps
1. Restart n8n on Railway
2. Import workflow
3. Add `ANTHROPIC_API_KEY` to Railway environment
4. Activate workflow

---

## Method 3: Local Polling Script (Mac Mini)

**Why:** No external dependencies, runs locally.

### Script: `scripts/claude-relay-daemon.py`

```python
#!/usr/bin/env python3
"""
Claude Relay Daemon
Polls Slack for Leads bot messages mentioning Claude, calls API, posts response.
Run with: python3 scripts/claude-relay-daemon.py
"""

import os
import json
import time
import urllib.request
from datetime import datetime

# Load .env
def load_env():
    with open(os.path.join(os.path.dirname(__file__), '..', '.env')) as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, _, value = line.strip().partition('=')
                os.environ.setdefault(key, value)

load_env()

SLACK_TOKEN = os.environ.get('SLACK_BOT_TOKEN')
ANTHROPIC_KEY = os.environ.get('ANTHROPIC_API_KEY')
CHANNEL = 'C09UQGASA2C'
LEADS_BOT = 'U0A2J4EK753'
CLAUDE_BOT = 'U09TPRV5ZQB'
POLL_INTERVAL = 10  # seconds

processed_messages = set()

def get_recent_messages():
    req = urllib.request.Request(
        f'https://slack.com/api/conversations.history?channel={CHANNEL}&limit=10',
        headers={'Authorization': f'Bearer {SLACK_TOKEN}'}
    )
    response = urllib.request.urlopen(req)
    return json.loads(response.read().decode()).get('messages', [])

def call_claude(message):
    data = json.dumps({
        'model': 'claude-sonnet-4-5-20250929',
        'max_tokens': 1024,
        'system': 'You are Claude, reviewing content for yellowCircle. Be concise.',
        'messages': [{'role': 'user', 'content': message}]
    }).encode()

    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=data,
        headers={
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        }
    )
    response = urllib.request.urlopen(req)
    result = json.loads(response.read().decode())
    return result.get('content', [{}])[0].get('text', 'No response')

def post_reply(channel, thread_ts, text):
    data = json.dumps({
        'channel': channel,
        'thread_ts': thread_ts,
        'text': f'🤖 *Claude Response:*\n\n{text}'
    }).encode()

    req = urllib.request.Request(
        'https://slack.com/api/chat.postMessage',
        data=data,
        headers={
            'Authorization': f'Bearer {SLACK_TOKEN}',
            'Content-Type': 'application/json'
        }
    )
    urllib.request.urlopen(req)

def main():
    print(f'[{datetime.now()}] Claude Relay Daemon started')
    print(f'  Polling every {POLL_INTERVAL}s for messages from {LEADS_BOT} mentioning {CLAUDE_BOT}')

    while True:
        try:
            messages = get_recent_messages()

            for msg in messages:
                ts = msg.get('ts')
                if ts in processed_messages:
                    continue

                # Check if from Leads bot and mentions Claude
                if msg.get('user') != LEADS_BOT:
                    continue
                if CLAUDE_BOT not in msg.get('text', ''):
                    continue

                print(f'[{datetime.now()}] Processing message {ts}')
                processed_messages.add(ts)

                # Extract message content
                text = msg.get('text', '').replace(f'<@{CLAUDE_BOT}>', '').strip()

                # Call Claude
                response = call_claude(text)

                # Reply in thread
                post_reply(CHANNEL, ts, response)
                print(f'[{datetime.now()}] Posted Claude response')

        except Exception as e:
            print(f'[{datetime.now()}] Error: {e}')

        time.sleep(POLL_INTERVAL)

if __name__ == '__main__':
    main()
```

### Run as Background Service
```bash
# Using nohup
nohup python3 scripts/claude-relay-daemon.py > /tmp/claude-relay.log 2>&1 &

# Or using launchd (Mac)
# Create ~/Library/LaunchAgents/com.yellowcircle.claude-relay.plist
```

---

## Method 4: Pipedream (Fastest Setup)

**Why:** No code, visual workflow builder.

### Setup (30 minutes)
1. Sign up at pipedream.com
2. Create new workflow
3. Add trigger: "New Message in Slack Channel"
4. Add step: "Filter" - user = U0A2J4EK753 AND text contains U09TPRV5ZQB
5. Add step: "HTTP Request" - Claude API
6. Add step: "Send Slack Message" - Post response

### Cost
- Free: 100 invocations/day
- Pro ($19/mo): Unlimited

---

## Comparison Matrix

| Criteria | Firebase | n8n | Local Script | Pipedream |
|----------|----------|-----|--------------|-----------|
| Setup complexity | Medium | Low | Low | Very Low |
| Latency | ~1s | ~2s | 10s (polling) | ~1s |
| Reliability | High | Medium | Medium | High |
| Cost | Free* | $5/mo | Free | Free/Paid |
| Maintenance | Low | Low | Medium | None |
| Anthropic key needed | Yes | Yes | Yes | Yes |

*Firebase Blaze required for external API calls

---

## Prerequisites (All Methods)

### 1. Anthropic API Key
```bash
# Add to .env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Get from: https://console.anthropic.com/settings/keys

### 2. Slack Event Subscriptions (Firebase/n8n only)
- Enable at api.slack.com/apps
- Subscribe to `message.channels`

---

## Recommendation

**For yellowCircle:** Start with **Method 3 (Local Polling Script)**

**Reasoning:**
- No additional infrastructure
- Mac Mini already runs 24/7
- No external service dependencies
- Free (just need Anthropic key)
- Easy to debug and modify

**Upgrade path:** Move to Firebase Function when ready for production reliability.

---

## Next Steps

1. [ ] Obtain Anthropic API key
2. [ ] Add to `.env` as `ANTHROPIC_API_KEY`
3. [ ] Choose implementation method
4. [ ] Test with sample message
5. [ ] Monitor for 24 hours
