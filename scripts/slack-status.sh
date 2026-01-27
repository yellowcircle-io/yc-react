#!/bin/bash
#
# Slack Status Notification Script for yellowCircle
# Uses Leads Bot Token API (same as Python scripts)
#
# Usage from Apple Shortcuts "Run Script over SSH":
#   ~/yellowcircle/scripts/slack-status.sh success "Build completed"
#   ~/yellowcircle/scripts/slack-status.sh error "Deploy failed"
#
# Status types: success, warning, error, info
#

# Load bot token from environment or .env file
if [ -z "$SLACK_BOT_TOKEN" ]; then
  if [ -f "$(dirname "$0")/../.env" ]; then
    SLACK_BOT_TOKEN=$(grep "^SLACK_BOT_TOKEN=" "$(dirname "$0")/../.env" | cut -d '=' -f2)
  fi
fi

if [ -z "$SLACK_BOT_TOKEN" ]; then
  echo "ERROR: SLACK_BOT_TOKEN not set"
  echo "Ensure SLACK_BOT_TOKEN is in .env file"
  exit 1
fi

if [ $# -lt 2 ]; then
  echo "Usage: $0 <status> <message>"
  echo "Status: success, warning, error, info"
  exit 1
fi

STATUS="$1"
MESSAGE="$2"
STATUS_UPPER=$(echo "$STATUS" | tr '[:lower:]' '[:upper:]')
CHANNEL="${SLACK_CHANNEL:-C09UQGASA2C}"
HOSTNAME=$(hostname)
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Map status to emoji
case "$STATUS" in
  success) EMOJI=":white_check_mark:" ;;
  warning) EMOJI=":warning:" ;;
  error)   EMOJI=":x:" ;;
  info)    EMOJI=":information_source:" ;;
  *)       EMOJI=":bell:" ;;
esac

RESPONSE=$(curl -s -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H 'Content-type: application/json; charset=utf-8' \
  -d "{
    \"channel\": \"$CHANNEL\",
    \"blocks\": [
      {
        \"type\": \"section\",
        \"text\": {
          \"type\": \"mrkdwn\",
          \"text\": \"$EMOJI *$STATUS_UPPER*: $MESSAGE\"
        }
      },
      {
        \"type\": \"context\",
        \"elements\": [
          {
            \"type\": \"mrkdwn\",
            \"text\": \"Host: $HOSTNAME | $TIMESTAMP\"
          }
        ]
      }
    ],
    \"text\": \"$STATUS_UPPER: $MESSAGE\"
  }")

if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo "✓ Status sent: [$STATUS] $MESSAGE"
else
  ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo "✗ Error: $ERROR"
  exit 1
fi
