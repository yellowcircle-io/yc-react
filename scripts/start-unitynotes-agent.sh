#!/bin/bash
###############################################################################
# UnityNOTES Agent - Safe, Focused, Staging-Only Autonomous Development
###############################################################################

set -e

# Setup environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$HOME/.nvm/versions/node/v20.19.0/bin:$PATH"

# Project directory
PROJECT_DIR="$HOME/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle"
cd "$PROJECT_DIR"

# Agent configuration
AGENT_DIR="$HOME/.local/pipx/venvs/sleepless-agent/lib/python3.14/site-packages/sleepless_agent"
CONFIG_FILE="$AGENT_DIR/config-unitynotes.yaml"

# Verify config exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ UnityNOTES config not found: $CONFIG_FILE"
    exit 1
fi

# Create staging branch if needed
STAGING_BRANCH="auto/unitynotes-staging"
if ! git show-ref --verify --quiet "refs/heads/$STAGING_BRANCH"; then
    echo "📌 Creating staging branch: $STAGING_BRANCH"
    git checkout -b "$STAGING_BRANCH"
    git checkout main
fi

# Pre-flight checks
echo "🔍 Pre-flight checks..."
echo "  ✓ Project: $PROJECT_DIR"
echo "  ✓ Config: $CONFIG_FILE"
echo "  ✓ Staging branch: $STAGING_BRANCH"

# Check current usage
USAGE=$(~/.nvm/versions/node/v20.19.0/bin/claude /usage 2>/dev/null | grep -o '[0-9]*%' | head -1 || echo "unknown")
echo "  ✓ Current usage: $USAGE"

# Safety reminder
echo ""
echo "⚠️  UnityNOTES Agent Safety Features:"
echo "    • Staging-only deployments (firebase hosting:channel:deploy)"
echo "    • Scoped to UnityNOTES components only"
echo "    • Max 60% day / 70% night usage (leaves headroom)"
echo "    • All changes to feature branches, not main"
echo "    • Slack notifications on every task"
echo ""

# Start the agent with UnityNOTES config
echo "🚀 Starting UnityNOTES Agent..."
export SLEEPLESS_CONFIG="$CONFIG_FILE"

exec "$HOME/.local/pipx/venvs/sleepless-agent/bin/python" -m sleepless_agent daemon
