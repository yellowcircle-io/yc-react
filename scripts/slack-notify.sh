#!/bin/bash
# Slack Notification Script for Claude Code Autonomous Tasks
# Usage: ./scripts/slack-notify.sh "message" [emoji]
#
# Examples:
#   ./scripts/slack-notify.sh "Task completed successfully" ":white_check_mark:"
#   ./scripts/slack-notify.sh "Error in deployment" ":x:"

set -e

MESSAGE="$1"
EMOJI="${2:-:robot_face:}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$SLACK_BOT_TOKEN" ]; then
    echo "Error: SLACK_BOT_TOKEN not set"
    exit 1
fi

# Default channel - can be overridden with SLACK_CHANNEL env var
CHANNEL="${SLACK_CHANNEL:-general}"

# Send message to Slack
curl -s -X POST "https://slack.com/api/chat.postMessage" \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"channel\": \"$CHANNEL\",
        \"text\": \"$EMOJI *Claude Agent* [$TIMESTAMP]\\n$MESSAGE\",
        \"unfurl_links\": false
    }" | jq -r '.ok'
