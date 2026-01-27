#!/bin/bash
#
# Slack Notification Script for yellowCircle
# Integrates with Apple Shortcuts "Run Script over SSH"
# Uses Leads Bot Token API (same as Python scripts)
#
# Usage:
#   ~/yellowcircle/scripts/slack-notify.sh "message"
#   ~/yellowcircle/scripts/slack-notify.sh "title" "url" "folder"
#
# Mode 1 (1 arg): Simple message notification
# Mode 2 (3 args): Link archived notification with title, URL, folder
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

# Default channel (same as Python scripts)
CHANNEL="${SLACK_CHANNEL:-C09UQGASA2C}"
TIMESTAMP=$(date "+%H:%M")

# Mode 1: Simple message (1 argument)
if [ $# -eq 1 ]; then
  MESSAGE="$1"

  RESPONSE=$(curl -s -X POST "https://slack.com/api/chat.postMessage" \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H 'Content-type: application/json; charset=utf-8' \
    -d "{
      \"channel\": \"$CHANNEL\",
      \"text\": \":yellow_circle: *yellowCircle* [$TIMESTAMP]\n$MESSAGE\",
      \"unfurl_links\": false
    }")

  if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✓ Sent: $MESSAGE"
  else
    ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "✗ Error: $ERROR"
    exit 1
  fi
  exit 0
fi

# Mode 2: Link archived (3 arguments: title, url, folder)
if [ $# -eq 3 ]; then
  TITLE="$1"
  URL="$2"
  FOLDER="$3"

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
            \"text\": \":link: *Link Saved*\"
          }
        },
        {
          \"type\": \"section\",
          \"text\": {
            \"type\": \"mrkdwn\",
            \"text\": \"<$URL|$TITLE>\"
          }
        },
        {
          \"type\": \"context\",
          \"elements\": [
            {
              \"type\": \"mrkdwn\",
              \"text\": \":file_folder: $FOLDER | $TIMESTAMP\"
            }
          ]
        }
      ],
      \"text\": \"Link Saved: $TITLE\"
    }")

  if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✓ Link saved: $TITLE → $FOLDER"
  else
    ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "✗ Error: $ERROR"
    exit 1
  fi
  exit 0
fi

# Usage help
echo "Usage:"
echo "  $0 \"message\"                    # Simple notification"
echo "  $0 \"title\" \"url\" \"folder\"       # Link archived notification"
exit 1
