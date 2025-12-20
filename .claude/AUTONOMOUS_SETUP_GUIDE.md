# Claude Autonomous Setup Guide

**Created:** December 20, 2025
**Updated:** December 20, 2025
**Machine:** MacBook Air (applies to all machines)

---

## Quick Status

| Component | Status | Notes |
|-----------|--------|-------|
| `claude-auto.sh` | ✅ Ready | Headless automation script |
| Cron Jobs | ✅ Installed | 4 jobs (daily, weekly, sync, monthly) |
| Sleepless Agent | ✅ Installed | Via pipx, tested working |
| GitHub MCP | ✅ Connected | Token configured |
| Slack Integration | ✅ Configured | Bot + App tokens in .env |

---

## 1. GitHub Token Setup

### Create a Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `claude-code-mcp`
4. Expiration: 90 days (or longer)
5. Select scopes:
   - `repo` (full control of private repositories)
   - `read:org` (if working with org repos)
   - `workflow` (if updating GitHub Actions)
6. Click "Generate token"
7. **Copy the token immediately** (starts with `ghp_`)

### Configure the Token

**Option A: Add to shell profile (recommended)**
```bash
# Add to ~/.zshrc
echo 'export GITHUB_TOKEN="ghp_YOUR_TOKEN_HERE"' >> ~/.zshrc
source ~/.zshrc
```

**Option B: Add to Claude MCP config**
```bash
claude mcp remove github
claude mcp add github -e GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE -- npx -y @modelcontextprotocol/server-github
```

### Verify GitHub MCP
```bash
claude mcp list
# Should show: github: npx -y @modelcontextprotocol/server-github - ✓ Connected
```

---

## 2. Cron Jobs Setup

### Install Cron Jobs
```bash
# View the crontab file first
cat scripts/claude-crontab.txt

# Install cron jobs
crontab scripts/claude-crontab.txt

# Verify installation
crontab -l
```

### Scheduled Tasks

| Schedule | Task | Log File |
|----------|------|----------|
| Daily 2 AM | Code review | `logs/claude-auto/cron-daily.log` |
| Sunday 3 AM | Dependency audit | `logs/claude-auto/cron-weekly.log` |
| Daily 6 AM | Sync verification | `logs/claude-auto/cron-sync.log` |
| 1st of month 4 AM | Performance report | `logs/claude-auto/cron-monthly.log` |

### Remove Cron Jobs
```bash
crontab -r
```

### Check Logs
```bash
tail -50 logs/claude-auto/cron-daily.log
```

---

## 3. Sleepless Agent Setup

### Prerequisites

**Install Python 3.11+**
```bash
# Install via Homebrew
brew install python@3.12

# Verify
/opt/homebrew/bin/python3.12 --version

# Add to PATH (optional)
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Install Sleepless Agent
```bash
# Using Python 3.12
/opt/homebrew/bin/pip3.12 install sleepless-agent

# Or from GitHub
/opt/homebrew/bin/pip3.12 install git+https://github.com/context-machine-lab/sleepless-agent.git
```

### Slack App Setup

1. Go to: https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: `yellowCircle Claude Agent`
4. Workspace: Select your Slack workspace

**Enable Socket Mode:**
- Settings → Socket Mode → Enable
- Generate App-Level Token with `connections:write` scope
- Save as `SLACK_APP_TOKEN`

**Add Bot Scopes (OAuth & Permissions):**
- `chat:write`
- `commands`
- `app_mentions:read`

**Create Slash Commands:**
| Command | Description |
|---------|-------------|
| `/think` | Submit a new task for Claude to work on |
| `/check` | Check status of a running task |
| `/cancel` | Cancel a running task |
| `/report` | Get usage and task report |

**Install App to Workspace:**
- OAuth & Permissions → Install to Workspace
- Copy `Bot User OAuth Token` as `SLACK_BOT_TOKEN`

### Configure Environment

Create `.env` in project root:
```bash
# Slack tokens
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token

# Anthropic API (optional, uses Claude Code auth if not set)
# ANTHROPIC_API_KEY=sk-ant-xxx
```

### Create Sleepless Config

Create `config.yaml` in project root:
```yaml
# Sleepless Agent Configuration for yellowCircle

workspace_dir: ./workspace

# Usage thresholds (Claude Pro subscription optimization)
usage_thresholds:
  night:  # 1 AM - 9 AM
    max_usage: 0.96
  day:    # 9 AM - 1 AM
    max_usage: 0.95

# Git automation
git:
  remote_url: git@github.com:yellowcircle-io/yc-react.git
  thought_branch: thought-ideas
  feature_branch_prefix: feature/
  auto_commit: true
  create_prs: true

# Multi-agent workflow
agents:
  planner:
    max_turns: 10
  worker:
    max_turns: 50
  evaluator:
    max_turns: 5
```

### Run Sleepless Agent
```bash
# Start daemon
sle daemon

# Or run in background
nohup sle daemon > logs/sleepless.log 2>&1 &
```

### Slack Commands
```
/think Fix the performance issue in ContactDashboard
/think -p Review all Firebase functions for security issues
/check 12345
/cancel 12345
/report
```

---

## 4. Manual Automation (No Setup Required)

Run tasks directly without cron or Sleepless:

```bash
# Basic usage
./scripts/claude-auto.sh "Your task description here"

# Examples
./scripts/claude-auto.sh "Fix ESLint errors in functions/index.js"
./scripts/claude-auto.sh "Review ContactDashboardPage.jsx for performance issues"
./scripts/claude-auto.sh "Run npm audit and fix vulnerabilities"
./scripts/claude-auto.sh "Generate a summary of recent git commits"
```

Logs are saved to `logs/claude-auto/YYYYMMDD-HHMMSS.log`

---

## 5. Troubleshooting

### GitHub MCP "Needs authentication"
```bash
# Check if token is set
echo $GITHUB_TOKEN

# Re-add with token
claude mcp remove github
claude mcp add github -e GITHUB_TOKEN=$GITHUB_TOKEN -- npx -y @modelcontextprotocol/server-github
```

### Cron jobs not running
```bash
# Check cron service
sudo launchctl list | grep cron

# Check system log
log show --predicate 'process == "cron"' --last 1h
```

### Sleepless Agent daemon crashes
```bash
# Check logs
tail -100 logs/sleepless.log

# Restart daemon
pkill -f "sle daemon"
sle daemon
```

---

## Current MCP Status (MacBook Air)

```
playwright: npx -y @playwright/mcp - ✓ Connected
notion: npx -y @notionhq/notion-mcp-server - ✓ Connected
github: npx -y @modelcontextprotocol/server-github - ⚠️ Needs GITHUB_TOKEN
```
