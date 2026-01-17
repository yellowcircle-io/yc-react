# Claude Bot Relay - Hybrid Multi-Tier Architecture Scope

**Status:** Sleepless Agent Task
**Priority:** P1
**Estimated Hours:** 12-16
**Created:** January 17, 2026

---

## Executive Summary

Implement a `/sleepless` slash command that triggers Claude Code CLI responses via a resilient multi-tier architecture. Differentiates from native `@claude` Slack integration by providing codebase-aware, tool-enabled responses.

---

## Problem Statement

1. Native `@claude` in Slack has no filesystem/codebase access
2. Current `claude-relay-daemon.py` requires Anthropic API key ($)
3. Need differentiated trigger for CLI-based responses
4. Single point of failure if daemon is down

---

## Solution: Three-Tier Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     /sleepless command                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Firebase Cloud Function (Router)                    │
│         Checks heartbeat → Routes to appropriate tier           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│    TIER 1     │ │    TIER 2     │ │    TIER 3     │
│  Socket Mode  │ │ Dropbox Queue │ │   Firestore   │
│   (Direct)    │ │  (Deferred)   │ │   (Offline)   │
├───────────────┤ ├───────────────┤ ├───────────────┤
│ Response: 2-5s│ │ Response: 30s │ │ Response: Next│
│ Req: Daemon up│ │ Req: Any Mac  │ │    session    │
└───────────────┘ └───────────────┘ └───────────────┘
```

---

## Tier Details

### Tier 1: Socket Mode (Primary)
- **Trigger:** Daemon heartbeat < 60 seconds old
- **Flow:** Slack → WebSocket → Daemon → Claude CLI → Slack
- **Response Time:** 2-5 seconds
- **Requirements:** Daemon running on Mac Mini
- **Backend:** Claude Code CLI (uses existing Claude Pro subscription)

### Tier 2: Dropbox Queue (Failover)
- **Trigger:** No heartbeat, but Dropbox recently active
- **Flow:** Slack → Firebase → Dropbox API → `.claude/.inbox/` → Local Watcher → CLI → Slack
- **Response Time:** 30-90 seconds (Dropbox sync delay)
- **Requirements:** Any machine with Dropbox + watcher daemon
- **Backend:** Claude Code CLI

### Tier 3: Persistent Queue (Offline)
- **Trigger:** No heartbeat, no Dropbox activity
- **Flow:** Slack → Firebase → Firestore → Processed next session
- **Response Time:** Deferred (notification when ready)
- **Requirements:** None (always available)
- **Backend:** Queued for later processing

---

## Differentiation from Native @claude

| Capability | @claude (Native) | /sleepless (CLI) |
|------------|------------------|------------------|
| Trigger | @mention | Slash command |
| Backend | Anthropic cloud | Local Claude Code |
| File access | No | Yes (full filesystem) |
| Codebase context | No | Yes (repository aware) |
| Tool use | Limited | Full Claude Code tools |
| Custom prompts | No | Yes (system prompts) |
| Automation | No | Yes (scripts, deploys) |
| Cost | Workspace plan | Claude Pro (existing) |
| Response time | Fast (~1s) | Variable (2-90s) |

---

## Implementation Phases

### Phase 1: Socket Mode Foundation (5-6 hrs)

#### 1.1 Slack App Configuration (15 min)
- [ ] Navigate to https://api.slack.com/apps/A0A2J35Q7D3
- [ ] Settings → Socket Mode → Enable (if not already)
- [ ] Slash Commands → Create New Command
  - Command: `/sleepless`
  - Description: "Run Claude Code CLI command"
  - Usage Hint: `[your prompt or question]`
- [ ] OAuth & Permissions → Add `commands` scope
- [ ] Reinstall app to workspace

#### 1.2 Socket Mode Daemon (2-3 hrs)
- [ ] Install slack-bolt: `pip install slack-bolt`
- [ ] Create new `scripts/sleepless-daemon.py`
- [ ] Implement `/sleepless` command handler
- [ ] Implement Claude CLI invocation
- [ ] Add error handling and timeouts
- [ ] Test locally

#### 1.3 Heartbeat System (1 hr)
- [ ] Add heartbeat endpoint to Firebase (or use Firestore)
- [ ] Daemon sends heartbeat every 30 seconds
- [ ] Include machine ID, timestamp, status

#### 1.4 Testing (1 hr)
- [ ] Test `/sleepless hello` returns response
- [ ] Test timeout handling
- [ ] Test error cases

### Phase 2: Firebase Router (3-4 hrs)

#### 2.1 Firebase Function Setup
- [ ] Create `functions/src/sleepless.ts`
- [ ] Implement webhook receiver
- [ ] Implement heartbeat checker
- [ ] Implement tier routing logic

#### 2.2 Dropbox API Integration
- [ ] Configure Dropbox API credentials
- [ ] Implement file write to `.claude/.inbox/`
- [ ] Test file creation

### Phase 3: Dropbox Watcher (2-3 hrs)

#### 3.1 File Watcher Daemon
- [ ] Install watchdog: `pip install watchdog`
- [ ] Create `scripts/dropbox-watcher-daemon.py`
- [ ] Watch `.claude/.inbox/` for new JSON files
- [ ] Process commands via Claude CLI
- [ ] Post responses via response_url
- [ ] Move processed files to `.processed/`

#### 3.2 Integration
- [ ] Test end-to-end Dropbox flow
- [ ] Test multi-machine scenario

### Phase 4: Unified Daemon + Polish (2 hrs)

#### 4.1 Combine Daemons
- [ ] Merge Socket Mode + Dropbox Watcher
- [ ] Single process manages both
- [ ] Graceful shutdown handling

#### 4.2 Monitoring
- [ ] Status command: `/sleepless status`
- [ ] Health dashboard (optional)

---

## File Structure

```
scripts/
├── sleepless-daemon.py      # NEW: Unified daemon (Socket Mode + Watcher)
├── dropbox-watcher-daemon.py # NEW: Standalone Dropbox watcher
├── claude-relay-daemon.py    # EXISTING: Keep for reference
└── slack-notify.py           # EXISTING: Utility

.claude/
├── .inbox/                   # EXISTING: Command queue (Dropbox synced)
│   └── cmd-{timestamp}.json  # Command files
├── .processed/               # EXISTING: Processed commands
│   └── cmd-{timestamp}.json  # Archived
└── scoping/
    └── CLAUDE_BOT_RELAY_SCOPE.md  # THIS FILE

functions/
└── src/
    └── sleepless.ts          # NEW: Firebase webhook handler
```

---

## Command JSON Format

```json
{
  "id": "cmd-1705432100000",
  "command": "summarize the recent commits",
  "user_id": "U123456",
  "user_name": "chris",
  "channel_id": "C09UQGASA2C",
  "response_url": "https://hooks.slack.com/commands/T3JPE1JH5/...",
  "timestamp": 1705432100000,
  "source": "firebase",
  "tier": 2
}
```

---

## Environment Variables

```bash
# Existing (in .env)
SLACK_BOT_TOKEN=xoxb-...      # Bot token
SLACK_APP_TOKEN=xapp-...      # App token (Socket Mode)
SLACK_CHANNEL=C09UQGASA2C     # Default channel

# New (to add)
DROPBOX_ACCESS_TOKEN=...      # For Firebase → Dropbox writes
FIREBASE_HEARTBEAT_URL=...    # Heartbeat endpoint
```

---

## Success Criteria

- [ ] `/sleepless hello` returns Claude Code response
- [ ] Response appears within 30 seconds (Tier 1) or 90 seconds (Tier 2)
- [ ] Errors are handled gracefully with user feedback
- [ ] Differentiates from native `@claude`
- [ ] Works when Mac Mini is down (Tier 2 via MacBook Air)
- [ ] Queues commands when all machines offline (Tier 3)
- [ ] `/sleepless status` shows current tier availability

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CLI timeout (>30s) | Medium | Medium | Async response via response_url |
| Daemon crash | Low | High | Supervisor/launchd auto-restart |
| Dropbox sync delay | Medium | Low | User notified of estimated time |
| Firebase cold start | Low | Low | Keep warm OR accept latency |
| All machines offline | Low | Medium | Tier 3 queues for later |

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Leads Slack App | ✅ Configured | App ID: A0A2J35Q7D3 |
| Socket Mode | ✅ App token exists | xapp-... in .env |
| Firebase | ✅ Configured | yellowcircle-app project |
| Dropbox | ✅ Syncing | .claude/.inbox/ exists |
| Claude Code CLI | ✅ Installed | `claude` command available |
| slack-bolt | ❌ Not installed | `pip install slack-bolt` |
| watchdog | ❌ Not installed | `pip install watchdog` |

---

## Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Phase 1 | Socket Mode working |
| 2 | Phase 2-3 | Firebase + Dropbox fallback |
| 3 | Phase 4 | Unified daemon + monitoring |

---

## References

- Existing daemon: `scripts/claude-relay-daemon.py`
- Slack app: https://api.slack.com/apps/A0A2J35Q7D3
- Dropbox queue spec: `.claude/shared-context/SLACK_AUTOMATION_SCOPE.md`
- Socket Mode docs: https://api.slack.com/apis/connections/socket

---

**Created:** January 17, 2026
**Last Updated:** January 17, 2026
**Author:** Sleepless Agent
