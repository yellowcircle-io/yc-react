# Bot-to-Bot Communication Testing: /sleepless → @claude

**Status:** Ready for Testing
**Created:** January 17, 2026
**Phase:** 2A - Proof of Concept

---

## Overview

This document covers testing the interaction between the Sleepless daemon (`/sleepless`) and Anthropic's native Slack Claude integration (`@claude`).

### Key Differentiators

| Feature | `/sleepless` | `@claude` |
|---------|-------------|-----------|
| Backend | Claude Code CLI | Anthropic API |
| Context | Full codebase access | Conversation only |
| Subscription | Claude Pro (CLI) | Claude for Slack |
| Response Time | 2-30s (CLI execution) | 1-5s (API) |
| Use Case | Code questions, file analysis | General questions |

---

## Test Commands

### 1. Basic Status Check
```
/sleepless status
```
Expected: Returns daemon status, machine, heartbeat info

### 2. CLI Code Query
```
/sleepless what is the structure of UnityNotesPage.jsx?
```
Expected: Codebase-aware response from Claude Code CLI

### 3. Relay to @claude (Bot-to-Bot)
```
/sleepless relay what is 2+2?
```
Expected:
1. Sleepless posts message to channel mentioning @claude
2. @claude responds with answer
3. User sees both messages

**Note:** The relay command requires the correct @claude user ID. Currently configured as `U0A2J4EK753` - may need adjustment.

---

## Finding @claude User ID

To use the relay command, you need to find @claude's user ID in your workspace:

1. **Method 1: Mention and Inspect**
   - Type `@claude` in any Slack message
   - Click on the @claude mention
   - Click "Copy member ID" from profile

2. **Method 2: Slack API**
   ```bash
   curl -X POST https://slack.com/api/users.list \
     -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
     -d "limit=100" | jq '.members[] | select(.name | contains("claude")) | {id, name, real_name}'
   ```

3. **Method 3: Slack Admin**
   - Go to Slack Admin → Member Settings
   - Search for "claude"
   - Note the User ID

---

## Updating the Relay User ID

Once you have @claude's user ID, update line ~251 in:
```
~/Library/Application Support/yellowcircle/sleepless/sleepless-daemon.py
```

Change:
```python
text=f"*Sleepless → @claude relay:*\n<@U0A2J4EK753> {relay_text}"
```

To:
```python
text=f"*Sleepless → @claude relay:*\n<@YOUR_CLAUDE_USER_ID> {relay_text}"
```

Then restart the daemon:
```bash
launchctl unload ~/Library/LaunchAgents/com.yellowcircle.sleepless-daemon.plist
launchctl load ~/Library/LaunchAgents/com.yellowcircle.sleepless-daemon.plist
```

---

## Test Results Template

### Test 1: Status Check
- **Command:** `/sleepless status`
- **Result:** [ ] Pass / [ ] Fail
- **Notes:**

### Test 2: CLI Query
- **Command:** `/sleepless summarize recent commits`
- **Result:** [ ] Pass / [ ] Fail
- **Response Time:**
- **Notes:**

### Test 3: Relay to @claude
- **Command:** `/sleepless relay hello, this is a test from /sleepless`
- **Result:** [ ] Pass / [ ] Fail
- **@claude Response:** [ ] Yes / [ ] No
- **Notes:**

---

## Architecture Insights

### Current Flow (Tier 1 - Socket Mode)
```
User → /sleepless [prompt] → Sleepless Daemon → Claude CLI → Response
```

### Relay Flow (Bot-to-Bot)
```
User → /sleepless relay [msg] → Sleepless Daemon
                                    ↓
                             Slack chat.postMessage(@claude [msg])
                                    ↓
                             @claude responds in channel
```

### Potential Enhancement: Automated @claude Response Capture
Future enhancement could:
1. Post message mentioning @claude
2. Listen for @claude's response in channel
3. Return combined/formatted response to user

This would require:
- Event subscription for message events
- Filtering for @claude's user ID
- Timeout handling
- Response aggregation

---

## Success Criteria

- [ ] `/sleepless status` returns daemon info
- [ ] `/sleepless [query]` invokes CLI and returns codebase-aware response
- [ ] `/sleepless relay [msg]` posts message with @claude mention
- [ ] @claude responds to the relay message
- [ ] Both bots can operate independently in same channel

---

## Troubleshooting

### Relay Not Working
1. Check @claude user ID is correct
2. Verify bot has `chat:write` permission
3. Check channel permissions for both bots

### @claude Not Responding
1. Ensure Claude for Slack is installed in workspace
2. Check @claude is added to the channel
3. Try mentioning @claude directly to verify it works

### Daemon Not Running
```bash
launchctl list | grep sleepless
# Should show PID with exit code 0 (running)

# Check logs
tail -50 /tmp/sleepless-daemon.log
```

---

## Next Steps

1. **Complete Testing:** Run all test scenarios
2. **Document Results:** Update test results section
3. **Adjust User ID:** If needed, update @claude user ID
4. **Phase 2:** Implement Firebase fallback for daemon downtime
5. **Enhancement:** Consider automated response capture from @claude
