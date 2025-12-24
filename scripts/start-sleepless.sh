#!/bin/bash -l
# Start Sleepless Agent Daemon
# Using -l flag to load login shell profile (includes nvm)

# Change to project directory
cd /Users/christophercooper_1/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle

# Source environment variables (.env file)
set -a
source .env
set +a

echo "🚀 Starting Sleepless Agent daemon..."
echo "   Time: $(date)"
echo "   Slack Bot Token: ${SLACK_BOT_TOKEN:0:20}..."
echo "   Slack App Token: ${SLACK_APP_TOKEN:0:20}..."
echo "   Claude CLI: $(which claude)"
echo "   Working Dir: $(pwd)"
echo ""

# Run the daemon with async support
exec ~/.local/pipx/venvs/sleepless-agent/bin/python -c "
import asyncio
from sleepless_agent import SleeplessAgent

async def main():
    print('✅ Agent initialized, starting daemon...')
    agent = SleeplessAgent()
    await agent.run()

asyncio.run(main())
"
