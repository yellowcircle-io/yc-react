#!/bin/bash
# Sleepless Daemon Launcher for launchd
# Sources environment variables and starts the daemon (Dropbox-based variant)
#
# Note: Production launcher is at ~/bin/sleepless-launcher.sh (runs from
# ~/Library/Application Support/yellowcircle/sleepless/ to avoid TCC restrictions).
# This repo copy runs directly from the project directory.
#
# Safeguards:
#   1. Dropbox mount check (up to 60s)
#   2. DNS readiness check (up to 120s)
#   3. Slack API reachability check (up to 30s)
#   4. Supervisor loop with self-restart on sustained connection failure
#   5. launchd KeepAlive handles launcher-level crashes (exit 1 -> restart after 30s)

PROJECT_DIR="/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle"
MAX_DNS_WAIT=120
MAX_CONSECUTIVE_FAILURES=3

# --- Phase 1: Wait for Dropbox to mount ---
WAIT_COUNT=0
while [ ! -d "$PROJECT_DIR" ] && [ $WAIT_COUNT -lt 60 ]; do
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

if [ ! -d "$PROJECT_DIR" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Project directory not accessible after 60s" >&2
    exit 1
fi

# --- Phase 2: Wait for DNS/network readiness ---
DNS_WAIT=0
while ! /usr/bin/host slack.com >/dev/null 2>&1 && [ $DNS_WAIT -lt $MAX_DNS_WAIT ]; do
    sleep 2
    DNS_WAIT=$((DNS_WAIT + 2))
done

if ! /usr/bin/host slack.com >/dev/null 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: DNS not ready after ${MAX_DNS_WAIT}s, cannot resolve slack.com" >&2
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] DNS ready after ${DNS_WAIT}s"

# --- Phase 3: Verify Slack API is reachable ---
API_WAIT=0
while ! curl -sf --max-time 5 -o /dev/null https://slack.com/api/api.test 2>/dev/null && [ $API_WAIT -lt 30 ]; do
    sleep 2
    API_WAIT=$((API_WAIT + 2))
done

if ! curl -sf --max-time 5 -o /dev/null https://slack.com/api/api.test 2>/dev/null; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: Slack API not reachable after 30s, proceeding anyway" >&2
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Network checks passed (Dropbox: ${WAIT_COUNT}s, DNS: ${DNS_WAIT}s, API: ${API_WAIT}s)"

# --- Phase 4: Setup environment ---
cd "$PROJECT_DIR"

# Source environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^\s*$' | xargs)
fi

# Add node to PATH for claude CLI
export PATH="/Users/christophercooper_1/.nvm/versions/node/v20.19.0/bin:$PATH"

# Activate virtual environment
source scripts/.venv/bin/activate

# Unbuffered Python output for logging
export PYTHONUNBUFFERED=1

# --- Phase 5: Supervisor loop ---
FAILURES=0
trap 'echo "[$(date "+%Y-%m-%d %H:%M:%S")] Launcher received SIGTERM, stopping"; kill $DAEMON_PID 2>/dev/null; wait $DAEMON_PID 2>/dev/null; exit 0' TERM INT

while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting daemon (attempt $((FAILURES + 1)))"

    python3 scripts/sleepless-daemon.py &
    DAEMON_PID=$!
    wait $DAEMON_PID
    EXIT_CODE=$?

    # Clean exit (SIGTERM/SIGINT) -> stop supervisor too
    if [ $EXIT_CODE -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Daemon exited cleanly (code 0), stopping launcher"
        exit 0
    fi

    FAILURES=$((FAILURES + 1))
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Daemon exited with code $EXIT_CODE (failure $FAILURES/$MAX_CONSECUTIVE_FAILURES)"

    if [ $FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Too many consecutive failures ($FAILURES), exiting for launchd to handle" >&2
        exit 1
    fi

    # Wait for network before restart (handles sleep/wake DNS loss)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for network before restart..."
    RESTART_WAIT=0
    while ! /usr/bin/host slack.com >/dev/null 2>&1 && [ $RESTART_WAIT -lt 60 ]; do
        sleep 5
        RESTART_WAIT=$((RESTART_WAIT + 5))
    done

    if ! /usr/bin/host slack.com >/dev/null 2>&1; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Network still down after 60s, exiting for launchd" >&2
        exit 1
    fi

    BACKOFF=$((10 * FAILURES))
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Network OK, backing off ${BACKOFF}s before restart"
    sleep $BACKOFF
done
