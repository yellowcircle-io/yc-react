# Claude Code Autonomous Setup - Hybrid B+C

**Created:** December 18, 2025
**Purpose:** 24/7 autonomous Claude Code operation for yellowCircle

---

## Overview

This guide implements a **Hybrid B+C** approach combining:
- **Option B**: Claude Agent SDK for custom automation scripts
- **Option C**: Sleepless Agent pattern for 24/7 background processing

---

## Quick Start (Recommended Path)

### 1. Claude Code Headless Mode (Immediate)

Run Claude Code in non-interactive mode for scripted tasks:

```bash
# Basic headless command
claude -p "Your prompt here" --output-format stream-json

# With permissions bypass (for trusted automation)
claude -p "Fix all ESLint errors in functions/index.js" \
  --dangerously-skip-permissions \
  --output-format stream-json

# Pipe from file
claude -p "$(cat task-description.txt)" --output-format json
```

**Output Formats:**
- `json` - Final result only
- `stream-json` - Streaming JSON (good for long tasks)
- `text` - Plain text output

### 2. Task Automation Script

Create a simple automation script for yellowCircle:

**File:** `scripts/claude-auto.sh`
```bash
#!/bin/bash

# Claude Code Automation Script for yellowCircle
# Usage: ./scripts/claude-auto.sh "task description"

TASK="$1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_DIR="logs/claude-auto"
mkdir -p "$LOG_DIR"

echo "Starting task: $TASK"
echo "Logging to: $LOG_DIR/$TIMESTAMP.log"

claude -p "$TASK" \
  --dangerously-skip-permissions \
  --output-format stream-json \
  2>&1 | tee "$LOG_DIR/$TIMESTAMP.log"

echo "Task completed at $(date)"
```

### 3. n8n Integration (Existing Infrastructure)

Use your existing n8n on Railway to trigger Claude tasks:

**Webhook → Execute Command → Log Result**

```javascript
// n8n Execute Command node
const task = $input.first().json.task;
const result = await $execute(`claude -p "${task}" --output-format json`);
return { result: JSON.parse(result) };
```

---

## Option B: Claude Agent SDK

For building custom agents with full programmatic control.

### Installation (Python)

```bash
pip install claude-agent-sdk
```

### Installation (TypeScript)

```bash
npm install @anthropic-ai/claude-agent-sdk
```

### Basic Agent Script

**File:** `scripts/claude-agent.py`
```python
from anthropic import Anthropic
from claude_agent_sdk import Agent, AgentConfig

# Initialize the agent
agent = Agent(
    config=AgentConfig(
        model="claude-sonnet-4-20250514",
        working_directory="/path/to/yellowcircle/yellow-circle",
        allowed_tools=["bash", "file_read", "file_write", "grep"],
        max_turns=50
    )
)

# Run a task
result = agent.run("""
    Review the Contact Dashboard for any performance issues.
    Check for:
    1. N+1 query patterns
    2. Missing error boundaries
    3. Unnecessary re-renders
    Report findings in a structured format.
""")

print(result.summary)
```

### SDK Capabilities

- **File Operations**: Read, write, search files
- **Bash Commands**: Execute shell commands
- **Subagents**: Parallel task execution
- **Context Management**: Automatic summarization
- **Custom Tools**: MCP server integration

---

## Option C: Sleepless Agent

For 24/7 autonomous operation with Slack integration.

### Installation

```bash
pip install sleepless-agent

# Or clone and install
git clone https://github.com/context-machine-lab/sleepless-agent.git
cd sleepless-agent
pip install -e .
```

### Slack App Setup

1. Create app at https://api.slack.com/apps
2. Enable Socket Mode (generates app token)
3. Create slash commands:
   - `/think` - Submit new task
   - `/check` - Check task status
   - `/cancel` - Cancel running task
   - `/report` - Get usage report
4. Configure OAuth scopes: `chat:write`, `commands`, `app_mentions:read`

### Environment Configuration

**File:** `.env`
```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
```

### Configuration

**File:** `config.yaml`
```yaml
# Sleepless Agent Configuration for yellowCircle

workspace_dir: ./workspace

# Usage thresholds (Claude Pro subscription optimization)
usage_thresholds:
  night:  # 1 AM - 9 AM
    max_usage: 0.96  # Use up to 96% of allocation
  day:    # 9 AM - 1 AM
    max_usage: 0.95  # Use up to 95% of allocation

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

# Task generation (idle time)
auto_generate:
  enabled: true
  strategies:
    - name: refine_focused
      weight: 45
    - name: balanced
      weight: 35
    - name: new_friendly
      weight: 20
```

### Launch Daemon

```bash
sle daemon
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

## Hybrid B+C: Recommended Setup for yellowCircle

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    yellowCircle Automation                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Slack     │    │    n8n      │    │   Cron      │     │
│  │  Commands   │    │  Webhooks   │    │   Jobs      │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │ Task Queue  │                          │
│                    │  (SQLite)   │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐       │
│  │  Agent 1    │   │  Agent 2    │   │  Agent 3    │       │
│  │ (Headless)  │   │ (SDK Bot)   │   │ (Sleepless) │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  Git Repository                          ││
│  │   - Auto-commits to thought-ideas branch                 ││
│  │   - Feature branches for major tasks                     ││
│  │   - PRs for human review                                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Phase 1: Headless Scripts (This Week)

1. Create `scripts/claude-auto.sh` (above)
2. Add to cron for scheduled tasks:
   ```bash
   # Daily code review at 2 AM
   0 2 * * * /path/to/yellowcircle/scripts/claude-auto.sh "Review functions/index.js for potential issues"

   # Weekly dependency audit
   0 3 * 0 * /path/to/yellowcircle/scripts/claude-auto.sh "Audit package.json dependencies for security issues"
   ```

#### Phase 2: Slack Bot (Next Week)

1. Install Sleepless Agent
2. Configure Slack app
3. Connect to yellowCircle Slack workspace
4. Test with `/think` commands

#### Phase 3: Full Autonomy (Future)

1. Enable auto-generate for idle time tasks
2. Configure multi-agent workflows
3. Set up monitoring dashboards
4. Integrate with n8n for complex workflows

---

## Task Types for yellowCircle

### Automated Tasks (No Review Needed)

- ESLint/formatting fixes
- Dependency updates (minor)
- Documentation updates
- Test file generation
- Performance profiling

### Review-Required Tasks

- New feature implementation
- Security-related changes
- Database schema changes
- API endpoint modifications
- Configuration changes

### Scheduled Tasks

| Schedule | Task | Priority |
|----------|------|----------|
| Daily 2AM | Code review for new commits | Low |
| Daily 3AM | Security audit scan | Medium |
| Weekly | Dependency audit | Low |
| Monthly | Performance report | Low |

---

## Environment Variables

```bash
# Required
export ANTHROPIC_API_KEY="your-api-key"

# Optional (for Slack integration)
export SLACK_BOT_TOKEN="xoxb-..."
export SLACK_APP_TOKEN="xapp-..."

# Optional (for n8n integration)
export N8N_WEBHOOK_URL="https://n8n-production-9ef7.up.railway.app/webhook/..."
```

---

## Monitoring

### Log Locations

- Headless mode: `logs/claude-auto/`
- Sleepless Agent: `workspace/logs/`
- n8n: Railway dashboard

### Health Checks

```bash
# Check if Sleepless daemon is running
sle status

# View recent task results
sle results --last 10

# Usage report
sle report
```

---

## Cost Considerations

| Plan | Monthly Cost | Usage Limit | Best For |
|------|--------------|-------------|----------|
| Claude Pro | $20/mo | 5x higher limits | Individual developer |
| Claude Max | $200/mo | 20x higher limits | Heavy automation |
| API (Sonnet) | $3/$15 per MTok | Pay-per-use | SDK-based agents |

**Recommendation:** Start with Claude Pro + headless mode, upgrade to Max if hitting limits.

---

## Security Notes

1. **Never commit API keys** - Use environment variables
2. **Review auto-generated commits** - Especially for feature branches
3. **Limit permissions** - Use `--allowed-tools` flag for SDK
4. **Monitor usage** - Set up alerts for unusual activity
5. **Test in staging first** - Before enabling production automation

---

## Sources

- [Claude Code Headless Mode](https://code.claude.com/docs/en/headless)
- [Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Sleepless Agent GitHub](https://github.com/context-machine-lab/sleepless-agent)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

---

## Next Steps

1. [x] Create this documentation
2. [ ] Install Sleepless Agent on Mac Mini
3. [ ] Configure Slack app for yellowCircle workspace
4. [ ] Create initial automation scripts
5. [ ] Set up cron jobs for scheduled tasks
6. [ ] Test end-to-end workflow
