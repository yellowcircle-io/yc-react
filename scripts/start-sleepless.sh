#!/bin/bash -l
# Start Sleepless Agent Daemon
# Using -l flag to load login shell profile (includes nvm)

# Change to project directory (works on both Mac Mini and MacBook Air)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Source environment variables (.env file)
set -a
source .env
set +a

# Ensure nvm/node paths are in PATH (for subprocess to find claude)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$HOME/.nvm/versions/node/$(nvm current 2>/dev/null || echo 'v20.19.0')/bin:$PATH"

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
