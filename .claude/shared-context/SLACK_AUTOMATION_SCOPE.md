# Slack Automation & Threaded Conversations - Scope Document

**Created:** December 21, 2025
**Status:** Scoping Phase

---

## Overview

This document outlines the architecture for:
1. **Automated Slack messaging triggers** for Claude Code
2. **Threaded conversations with actions** (Notion, GitHub, etc.)

---

## Part 1: Automated Slack Messaging Triggers

### Current State
- **Outbound (Claude → Slack):** Working via `chat.postMessage` API
- **Inbound (Slack → Claude):** Working via `slackWebhook` → Firestore → polling

### Goal
Enable Claude Code to be triggered automatically by:
1. Scheduled events (cron)
2. External webhooks (GitHub, Notion, etc.)
3. Slack messages/commands
4. File system changes (Dropbox sync)

### Architecture Options

#### Option A: Polling-Based (Current + Extended)
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Slack     │────>│  Firebase    │────>│ Claude Code │
│   Message   │     │  Firestore   │     │  (polling)  │
└─────────────┘     └──────────────┘     └─────────────┘
```
**Pros:** Simple, works now, no persistent process needed
**Cons:** Not real-time, requires manual polling

**Implementation:**
```bash
# Claude Code runs periodically:
curl -s "https://.../getSlackMessages?status=pending" | process_messages
```

#### Option B: File-Based Triggers (Dropbox)
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Slack     │────>│  n8n/Make    │────>│ Dropbox     │
│   Message   │     │  Webhook     │     │ .inbox/     │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                    ┌───────────▼───────────┐
                                    │ Claude Code watches   │
                                    │ .claude/.inbox/*.json │
                                    └───────────────────────┘
```
**Pros:** Works offline, syncs automatically, persistent queue
**Cons:** Requires file watching, slight delay

**Implementation:**
1. n8n workflow receives Slack event
2. Creates JSON file in Dropbox: `.claude/.inbox/slack_{timestamp}.json`
3. Claude Code hook watches `.claude/.inbox/` directory
4. Processes file and moves to `.claude/.processed/`

#### Option C: WebSocket Daemon (Advanced)
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Slack     │<───>│  Bolt App    │<───>│ Claude Code │
│   (Socket)  │     │  (Railway)   │     │  (IPC/HTTP) │
└─────────────┘     └──────────────┘     └─────────────┘
```
**Pros:** Real-time, bi-directional
**Cons:** Requires persistent hosting, more complex

### Recommended: Option B (File-Based)

**Why:**
- Works with existing Dropbox sync infrastructure
- No additional hosting costs
- Survives network issues
- Easy to debug (JSON files)
- Claude Code hooks can trigger on file changes

### Implementation Plan

1. **Create inbox directory structure:**
   ```
   .claude/
   ├── .inbox/           # Incoming messages queue
   │   └── .gitkeep
   ├── .processed/       # Processed messages archive
   │   └── .gitkeep
   └── .outbox/          # Outgoing messages queue
       └── .gitkeep
   ```

2. **n8n Workflow:**
   - Trigger: Slack "New Message" event
   - Action: Create file in Dropbox `.claude/.inbox/`
   - File format:
     ```json
     {
       "type": "slack_message",
       "timestamp": "2025-12-21T00:38:29Z",
       "source": {
         "channel": "D0A2KG1RSDU",
         "user": "U3JP2J8NS",
         "thread_ts": "1234567890.123456"
       },
       "content": {
         "text": "User's message here",
         "attachments": []
       },
       "metadata": {
         "is_command": false,
         "mentions_bot": true
       }
     }
     ```

3. **Claude Code Hook (`.claude/hooks/inbox-watcher.sh`):**
   ```bash
   #!/bin/bash
   # Triggered by file system watcher or cron

   INBOX_DIR=".claude/.inbox"
   PROCESSED_DIR=".claude/.processed"

   for file in "$INBOX_DIR"/*.json; do
     [ -e "$file" ] || continue

     # Process message
     message=$(cat "$file")
     type=$(echo "$message" | jq -r '.type')

     case $type in
       slack_message)
         # Trigger Claude Code with context
         claude --message "Process Slack message: $message"
         ;;
       github_event)
         # Handle GitHub webhook
         ;;
     esac

     # Move to processed
     mv "$file" "$PROCESSED_DIR/"
   done
   ```

---

## Part 2: Threaded Conversations with Actions

### Goal
Enable multi-turn conversations where Claude can:
1. Track conversation context across messages
2. Execute actions (update Notion, create GitHub issues, etc.)
3. Report back results to the same thread

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Conversation Thread                       │
├─────────────────────────────────────────────────────────────┤
│  User: "Update the Montreal trip in Notion"                 │
│  Claude: "I'll update Notion. Which sections?"              │
│  User: "Add the NYE dinner reservation"                     │
│  Claude: [Executes Notion action] "Done! Added Le 9e..."    │
└─────────────────────────────────────────────────────────────┘
```

### Components

#### 1. Thread Context Store (Firestore)
```javascript
// Collection: conversation_threads
{
  thread_id: "slack_1234567890.123456",
  channel_id: "D0A2KG1RSDU",
  user_id: "U3JP2J8NS",
  started_at: timestamp,
  last_activity: timestamp,
  status: "active", // active, completed, abandoned
  context: {
    topic: "montreal_trip",
    entities: ["Le 9e", "NYE dinner"],
    pending_actions: []
  },
  messages: [
    { role: "user", content: "...", timestamp: "..." },
    { role: "assistant", content: "...", timestamp: "..." }
  ],
  actions_executed: [
    { type: "notion_update", target: "page_id", result: "success" }
  ]
}
```

#### 2. Action Registry
```javascript
const AVAILABLE_ACTIONS = {
  // Notion Actions
  'notion.update_page': {
    description: 'Update a Notion page',
    params: ['page_id', 'properties'],
    handler: notionUpdatePage
  },
  'notion.create_page': {
    description: 'Create a new Notion page',
    params: ['database_id', 'title', 'properties'],
    handler: notionCreatePage
  },

  // GitHub Actions
  'github.create_issue': {
    description: 'Create a GitHub issue',
    params: ['repo', 'title', 'body', 'labels'],
    handler: githubCreateIssue
  },
  'github.update_pr': {
    description: 'Update a pull request',
    params: ['repo', 'pr_number', 'action'],
    handler: githubUpdatePR
  },

  // Calendar Actions
  'calendar.create_event': {
    description: 'Create a calendar event',
    params: ['title', 'date', 'time', 'duration'],
    handler: calendarCreateEvent
  },

  // Internal Actions
  'capsule.update': {
    description: 'Update a Unity Notes capsule',
    params: ['capsule_id', 'updates'],
    handler: capsuleUpdate
  }
};
```

#### 3. Conversation Flow

```
1. User sends message → slackWebhook receives
2. Check if thread_ts exists in Firestore
   - If yes: Load context, append message
   - If no: Create new thread
3. Claude analyzes message + context
4. If action needed:
   a. Confirm with user (if destructive)
   b. Execute action via handler
   c. Report result
5. Update thread context
6. Reply in Slack thread
```

#### 4. Action Confirmation Flow
```
User: "Delete all my test capsules"
Claude: "⚠️ This will delete 3 capsules:
  - test-capsule-1
  - test-capsule-2
  - test-capsule-3

  Reply 'confirm' to proceed or 'cancel' to abort."
User: "confirm"
Claude: "✅ Deleted 3 capsules successfully."
```

### Implementation Priority

| Priority | Feature | Effort |
|----------|---------|--------|
| P0 | Thread context storage | Medium |
| P0 | Slack thread replies | Low |
| P1 | Notion integration | Medium |
| P1 | Action confirmation flow | Medium |
| P2 | GitHub integration | Medium |
| P2 | Calendar integration | High |
| P3 | Multi-platform threads | High |

### Firebase Functions to Add

```javascript
// 1. Get or create thread
exports.getOrCreateThread = functions.https.onRequest(...)

// 2. Append message to thread
exports.appendToThread = functions.https.onRequest(...)

// 3. Execute action
exports.executeAction = functions.https.onRequest(...)

// 4. Get thread history
exports.getThreadHistory = functions.https.onRequest(...)
```

### MCP Integration

The Notion MCP server is already configured:
```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-notion"]
    }
  }
}
```

This can be leveraged for:
- `mcp__notion__notion-search` - Find pages
- `mcp__notion__notion-fetch` - Read page content
- `mcp__notion__notion-create-pages` - Create/update pages

---

## Next Steps

1. **Implement inbox file structure** - Create directories
2. **Create n8n workflow** - Slack → Dropbox file
3. **Build thread context store** - Firestore schema
4. **Add thread reply function** - `replyToSlackThread`
5. **Test end-to-end flow** - Slack → Claude → Action → Reply

---

## Security Considerations

- Actions require explicit user confirmation for destructive operations
- Thread context expires after 24 hours of inactivity
- Action execution is logged and auditable
- Rate limiting on action execution (10/hour per user)
- Sensitive actions require re-authentication
