# Claude Code Autonomous Operation Guide

This document covers running Claude Code in autonomous/headless mode, SSH integration, and Slack connectivity.

---

## 1. Headless/Autonomous Mode

### Basic Usage
Run Claude Code non-interactively with the `-p` (prompt) flag:

```bash
# Single prompt execution
claude -p "Create a React component for a login form"

# With specific model
claude -p "Analyze the codebase structure" --model claude-sonnet-4

# Continue conversation with follow-ups
claude -p "Add validation to the form" --continue
```

### Key Flags for Autonomous Operation

| Flag | Description |
|------|-------------|
| `-p, --prompt` | Non-interactive mode, execute prompt and exit |
| `--continue` | Continue most recent conversation |
| `--resume <id>` | Resume specific conversation by ID |
| `--output-format json` | Output structured JSON for parsing |
| `--no-confirmation` | Skip all confirmation prompts |
| `--max-turns N` | Limit number of agent turns |
| `--allowedTools` | Restrict available tools |

### Piping Input

```bash
# Pipe file for analysis
cat src/App.jsx | claude -p "Review this code for performance issues"

# Pipe multiple files
cat package.json tsconfig.json | claude -p "Check for version conflicts"

# From stdin
echo "Write a utility function for date formatting" | claude -p -
```

### Output Parsing

```bash
# JSON output for automation
claude -p "List all TODO comments in codebase" --output-format json | jq '.result'

# Stream to file
claude -p "Generate API documentation" > docs/api.md
```

---

## 2. SSH Remote Access

### Setup SSH Tunnel to Remote Server

```bash
# 1. SSH into server with port forwarding
ssh -L 8080:localhost:8080 user@server.example.com

# 2. On remote server, start Claude Code
claude --port 8080

# 3. Access from local machine at localhost:8080
```

### Using Screen/Tmux for Persistence

```bash
# Create persistent session
tmux new -s claude-session
claude

# Detach: Ctrl+B, D
# Reattach from anywhere
tmux attach -t claude-session
```

### Remote Execution via SSH

```bash
# Execute Claude Code command remotely
ssh user@server "cd /project && claude -p 'Run tests and fix failures'"

# With environment variables
ssh user@server "ANTHROPIC_API_KEY=xxx claude -p 'Deploy to staging'"
```

---

## 3. Slack Integration (MCP Server)

### Install MCP Slack Server

```bash
# Via Claude Code MCP management
claude mcp add slack npx -y @anthropic-ai/mcp-server-slack

# Verify installation
claude mcp list
```

### Required Slack App Setup

1. Create Slack App at https://api.slack.com/apps
2. Add required scopes:
   - `channels:history` - Read channel messages
   - `channels:read` - List channels
   - `chat:write` - Post messages
   - `users:read` - Read user info
   - `files:read` - Access file content
   - `files:write` - Upload files

3. Install app to workspace
4. Copy Bot User OAuth Token (`xoxb-...`)

### Configure Environment

```bash
# Set Slack token
export SLACK_BOT_TOKEN=xoxb-your-token-here

# Or in Claude Code settings
claude config set slack.bot_token xoxb-your-token-here
```

### Available Slack Tools

Once configured, Claude Code gains these capabilities:

| Tool | Description |
|------|-------------|
| `slack_list_channels` | List available channels |
| `slack_read_channel` | Read recent messages from channel |
| `slack_post_message` | Post message to channel |
| `slack_upload_file` | Upload file to channel |
| `slack_search` | Search messages across workspace |

### Usage Examples

```bash
# Read recent messages
claude -p "Summarize the last 20 messages in #engineering"

# Post status update
claude -p "Post a message to #deployments saying the v2.0 release is complete"

# Monitor channel
claude -p "Watch #alerts for any error mentions and summarize"
```

---

## 4. Automation Patterns

### Cron Job Integration

```bash
# Daily code review
0 9 * * * /usr/local/bin/claude -p "Review PRs opened in the last 24 hours" >> /var/log/claude-reviews.log

# Nightly test runs
0 2 * * * cd /project && /usr/local/bin/claude -p "Run full test suite, fix any failures, commit fixes" --no-confirmation
```

### Git Hooks

```bash
# pre-commit hook
#!/bin/bash
claude -p "Review staged changes for issues" --output-format json | jq -e '.issues == []' || exit 1

# post-merge hook
#!/bin/bash
claude -p "Summarize changes since last merge" >> CHANGELOG.md
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
jobs:
  claude-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Claude Code Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npm install -g @anthropic-ai/claude-code
          claude -p "Review this PR for security issues" --output-format json > review.json
```

---

## 5. Best Practices

### Security
- Never hardcode API keys in scripts
- Use environment variables or secrets managers
- Limit tool access with `--allowedTools` in automation
- Use `--max-turns` to prevent runaway operations

### Reliability
- Always use `--output-format json` for parsing
- Add timeouts to long-running operations
- Log all autonomous operations
- Test prompts interactively before automation

### Performance
- Use `--continue` for related tasks
- Batch related operations in single prompts
- Use specific file paths rather than searching

---

## Quick Reference

```bash
# Basic autonomous
claude -p "your prompt here"

# JSON output
claude -p "prompt" --output-format json

# Headless with restrictions
claude -p "prompt" --no-confirmation --max-turns 5 --allowedTools Read,Write

# SSH remote
ssh server "cd /project && claude -p 'prompt'"

# With Slack
SLACK_BOT_TOKEN=xoxb-xxx claude -p "Post update to #channel"
```

---

## Related Documentation

- Claude Code docs: https://docs.anthropic.com/claude-code
- MCP servers: https://github.com/anthropics/model-context-protocol
- Slack API: https://api.slack.com/docs

---

*Last updated: December 16, 2025*
