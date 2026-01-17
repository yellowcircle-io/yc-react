#!/bin/bash
# Sleepless Daemon Launcher for launchd
# Sources environment variables and starts the daemon

PROJECT_DIR="/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle"

# Wait for Dropbox to mount (up to 60 seconds)
WAIT_COUNT=0
while [ ! -d "$PROJECT_DIR" ] && [ $WAIT_COUNT -lt 60 ]; do
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

if [ ! -d "$PROJECT_DIR" ]; then
    echo "ERROR: Project directory not accessible after 60s" >&2
    exit 1
fi

# Set working directory
cd "$PROJECT_DIR"

# Source environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^\s*$' | xargs)
fi

# Add node to PATH for claude CLI
export PATH="/Users/christophercooper_1/.nvm/versions/node/v20.19.0/bin:$PATH"

# Log startup
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Launcher starting, waited ${WAIT_COUNT}s for Dropbox"

# Activate virtual environment and run daemon
source scripts/.venv/bin/activate
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Venv activated, starting daemon"
exec python3 scripts/sleepless-daemon.py
