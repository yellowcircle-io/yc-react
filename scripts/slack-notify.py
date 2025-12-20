#!/usr/bin/env python3
"""
Slack Notification Script for Claude Code Autonomous Tasks
Usage: python3 scripts/slack-notify.py "message" [channel]

Examples:
    python3 scripts/slack-notify.py "Task completed successfully"
    python3 scripts/slack-notify.py "Error in deployment" "#alerts"
"""

import sys
import os
import json
import urllib.request
from datetime import datetime

def load_env():
    """Load environment variables from .env file"""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, _, value = line.strip().partition('=')
                    os.environ.setdefault(key, value)

def send_slack_message(message, channel=None):
    """Send a message to Slack"""
    load_env()

    token = os.environ.get('SLACK_BOT_TOKEN')
    if not token:
        print("Error: SLACK_BOT_TOKEN not set")
        return False

    # Default to bot's DM channel or specified channel
    target_channel = channel or os.environ.get('SLACK_CHANNEL', 'U0A2J4EK753')

    timestamp = datetime.now().strftime('%H:%M')
    formatted_message = f"🤖 *Claude Agent* [{timestamp}]\n{message}"

    data = json.dumps({
        'channel': target_channel,
        'text': formatted_message,
        'unfurl_links': False
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://slack.com/api/chat.postMessage',
        data=data,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json; charset=utf-8'
        }
    )

    try:
        response = urllib.request.urlopen(req)
        result = json.loads(response.read().decode())
        if result.get('ok'):
            print(f"✓ Message sent to {target_channel}")
            return True
        else:
            print(f"✗ Slack error: {result.get('error')}")
            return False
    except Exception as e:
        print(f"✗ Request failed: {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/slack-notify.py \"message\" [channel]")
        sys.exit(1)

    message = sys.argv[1]
    channel = sys.argv[2] if len(sys.argv) > 2 else None

    success = send_slack_message(message, channel)
    sys.exit(0 if success else 1)
