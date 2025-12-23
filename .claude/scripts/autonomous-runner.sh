#!/bin/bash
#
# Autonomous Runner for Claude Code
#
# Runs investigation tasks with periodic Slack updates.
# Monitors for stop signals and inbox messages.
#
# Usage:
#   ./.claude/scripts/autonomous-runner.sh              # Run until stopped
#   ./.claude/scripts/autonomous-runner.sh --duration 4h  # Run for 4 hours
#   ./.claude/scripts/autonomous-runner.sh --dry-run    # Test mode
#
# Created: December 22, 2025
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$BASE_DIR")"
ADMIN_TOKEN="${YC_ADMIN_TOKEN:-}" # Set via: export YC_ADMIN_TOKEN=your-token
SLACK_CHANNEL="D0A2KG1RSDU"
FIREBASE_URL="https://us-central1-yellowcircle-app.cloudfunctions.net"
UPDATE_INTERVAL=1800  # 30 minutes
MAX_DURATION=${1:-14400}  # Default 4 hours (in seconds)

# Logging
LOG_FILE="$BASE_DIR/.logs/autonomous-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$BASE_DIR/.logs"

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Send Slack message
send_slack() {
    local message="$1"
    curl -s -X POST "$FIREBASE_URL/sendSlackMessage" \
        -H "Content-Type: application/json" \
        -H "x-admin-token: $ADMIN_TOKEN" \
        -d "{\"channel\": \"$SLACK_CHANNEL\", \"message\": \"$message\"}" > /dev/null
}

# Check for stop signal
should_stop() {
    [ -f "$BASE_DIR/.stop" ]
}

# Process inbox
process_inbox() {
    log "📥 Checking inbox..."
    node "$SCRIPT_DIR/process-inbox.cjs" 2>&1 | tee -a "$LOG_FILE"
}

# Get system status
get_status() {
    local git_status=$(cd "$PROJECT_DIR" && git status --short | head -5)
    local branch=$(cd "$PROJECT_DIR" && git branch --show-current)
    local last_commit=$(cd "$PROJECT_DIR" && git log -1 --format="%h %s" | head -c 50)
    local inbox_count=$(ls -1 "$BASE_DIR/.inbox"/*.json 2>/dev/null | wc -l | tr -d ' ')
    local sle_status=$(~/.local/bin/sle check 2>/dev/null | grep -E "Queue Depth|pending" | head -1 || echo "Unknown")

    echo "📊 *Status Update*
• Branch: \`$branch\`
• Last commit: \`$last_commit\`
• Uncommitted: ${git_status:-None}
• Inbox: $inbox_count pending
• Agent: $sle_status
• Time: $(date '+%I:%M %p %Z')"
}

# Main execution
main() {
    log "🚀 Starting autonomous runner"
    log "   Duration: ${MAX_DURATION}s"
    log "   Update interval: ${UPDATE_INTERVAL}s"
    log "   Log file: $LOG_FILE"

    # Initial status
    send_slack "$(get_status)\n\n_Starting autonomous investigation..._"

    START_TIME=$(date +%s)
    LAST_UPDATE=$START_TIME

    while true; do
        CURRENT_TIME=$(date +%s)
        ELAPSED=$((CURRENT_TIME - START_TIME))

        # Check stop conditions
        if should_stop; then
            log "⏹️ Stop signal detected"
            send_slack "⏹️ *Autonomous mode stopped by user*\n\n$(get_status)"
            rm -f "$BASE_DIR/.stop"
            exit 0
        fi

        if [ $ELAPSED -ge $MAX_DURATION ]; then
            log "⏱️ Duration limit reached"
            send_slack "⏱️ *Autonomous mode completed (duration limit)*\n\n$(get_status)"
            exit 0
        fi

        # Process inbox
        process_inbox

        # Periodic status update
        if [ $((CURRENT_TIME - LAST_UPDATE)) -ge $UPDATE_INTERVAL ]; then
            log "📤 Sending status update"
            send_slack "$(get_status)\n\n⏱️ Running for $(($ELAPSED / 60)) minutes"
            LAST_UPDATE=$CURRENT_TIME
        fi

        # Brief sleep to prevent tight loop
        sleep 60
    done
}

# Handle arguments
case "${1:-}" in
    --dry-run)
        log "🧪 Dry run mode"
        echo "Status message:"
        get_status
        exit 0
        ;;
    --help|-h)
        echo "Usage: $0 [--duration SECONDS] [--dry-run] [--help]"
        exit 0
        ;;
esac

main
