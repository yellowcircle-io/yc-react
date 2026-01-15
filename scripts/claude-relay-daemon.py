#!/usr/bin/env python3
"""
Claude Relay Daemon - No Human Intervention Bot-to-Bot Communication

Polls Slack for Leads bot messages mentioning @claude, calls Claude API, posts response.

Usage:
    python3 scripts/claude-relay-daemon.py           # Run in foreground
    python3 scripts/claude-relay-daemon.py --daemon  # Run in background

Requirements:
    - SLACK_BOT_TOKEN in .env
    - ANTHROPIC_API_KEY in .env (get from console.anthropic.com)
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
from datetime import datetime

# Configuration
CHANNEL = 'C09UQGASA2C'
LEADS_BOT = 'U0A2J4EK753'
CLAUDE_USER = 'U09TPRV5ZQB'
POLL_INTERVAL = 10  # seconds
MAX_PROCESSED = 1000  # Max messages to track

def load_env():
    """Load environment variables from .env file"""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, _, value = line.strip().partition('=')
                    os.environ.setdefault(key, value)

def log(message):
    """Print timestamped log message"""
    print(f'[{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}] {message}')

def get_recent_messages(token, channel, limit=20):
    """Fetch recent messages from Slack channel"""
    req = urllib.request.Request(
        f'https://slack.com/api/conversations.history?channel={channel}&limit={limit}',
        headers={'Authorization': f'Bearer {token}'}
    )
    response = urllib.request.urlopen(req)
    result = json.loads(response.read().decode())
    if not result.get('ok'):
        raise Exception(f"Slack API error: {result.get('error')}")
    return result.get('messages', [])

def call_claude_api(api_key, message, context=None):
    """Call Claude API and return response"""
    system_prompt = """You are Claude, an AI assistant integrated with the yellowCircle Slack workspace.
You are responding to a request from the sleepless agent (an automated bot).

Your role:
- Review content for language oddities, design inconsistencies, or off-brand messaging
- Provide concise, actionable feedback
- Be direct and helpful

Keep responses brief and focused."""

    # Include context if provided
    full_message = message
    if context:
        full_message = f"Context:\n{context}\n\nRequest:\n{message}"

    data = json.dumps({
        'model': 'claude-sonnet-4-5-20250929',
        'max_tokens': 1024,
        'system': system_prompt,
        'messages': [{'role': 'user', 'content': full_message}]
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=data,
        headers={
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        }
    )

    response = urllib.request.urlopen(req)
    result = json.loads(response.read().decode())

    if 'content' in result and len(result['content']) > 0:
        return result['content'][0].get('text', 'No response generated')
    return 'No response generated'

def post_slack_reply(token, channel, thread_ts, text):
    """Post a reply to Slack, optionally in a thread"""
    data = json.dumps({
        'channel': channel,
        'thread_ts': thread_ts,
        'text': f'🤖 *Claude Response:*\n\n{text}',
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

    response = urllib.request.urlopen(req)
    result = json.loads(response.read().decode())
    if not result.get('ok'):
        raise Exception(f"Slack post error: {result.get('error')}")
    return result

def should_process_message(msg, leads_bot, claude_user):
    """Check if message should trigger Claude relay"""
    # Must be from Leads bot
    if msg.get('user') != leads_bot:
        return False

    text = msg.get('text', '')

    # Must mention Claude (by user ID or @claude text)
    if claude_user not in text and '@claude' not in text.lower():
        return False

    # Skip if it's already a Claude response
    if 'Claude Response:' in text:
        return False

    return True

def extract_message_content(text, claude_user):
    """Extract the actual message content, removing Claude mention"""
    # Remove user ID mention
    content = text.replace(f'<@{claude_user}>', '')
    # Remove @claude text mentions
    content = content.replace('@claude', '').replace('@Claude', '')
    # Clean up
    return content.strip()

def main():
    load_env()

    slack_token = os.environ.get('SLACK_BOT_TOKEN')
    anthropic_key = os.environ.get('ANTHROPIC_API_KEY')

    if not slack_token:
        log('ERROR: SLACK_BOT_TOKEN not set in .env')
        sys.exit(1)

    if not anthropic_key:
        log('ERROR: ANTHROPIC_API_KEY not set in .env')
        log('Get your API key from: https://console.anthropic.com/settings/keys')
        sys.exit(1)

    log('Claude Relay Daemon started')
    log(f'  Channel: {CHANNEL}')
    log(f'  Monitoring messages from: {LEADS_BOT}')
    log(f'  Trigger: mentions of {CLAUDE_USER}')
    log(f'  Poll interval: {POLL_INTERVAL}s')
    log('')

    processed_messages = set()

    while True:
        try:
            messages = get_recent_messages(slack_token, CHANNEL)

            for msg in messages:
                ts = msg.get('ts')

                # Skip already processed
                if ts in processed_messages:
                    continue

                # Check if should process
                if not should_process_message(msg, LEADS_BOT, CLAUDE_USER):
                    processed_messages.add(ts)  # Mark as seen
                    continue

                log(f'Processing message {ts}')
                processed_messages.add(ts)

                # Extract content
                content = extract_message_content(msg.get('text', ''), CLAUDE_USER)
                if not content:
                    log('  Empty content, skipping')
                    continue

                log(f'  Content: {content[:100]}...')

                # Call Claude API
                try:
                    response = call_claude_api(anthropic_key, content)
                    log(f'  Claude response: {response[:100]}...')

                    # Post reply in thread
                    post_slack_reply(slack_token, CHANNEL, ts, response)
                    log('  Reply posted successfully')

                except urllib.error.HTTPError as e:
                    error_body = e.read().decode()
                    log(f'  Claude API error: {e.code} - {error_body}')
                except Exception as e:
                    log(f'  Error calling Claude: {e}')

            # Cleanup old processed messages
            if len(processed_messages) > MAX_PROCESSED:
                processed_messages.clear()

        except urllib.error.HTTPError as e:
            log(f'Slack API error: {e.code}')
        except Exception as e:
            log(f'Error: {e}')

        time.sleep(POLL_INTERVAL)

if __name__ == '__main__':
    if '--daemon' in sys.argv:
        # Fork to background
        if os.fork() > 0:
            sys.exit(0)
        os.setsid()
        if os.fork() > 0:
            sys.exit(0)

    main()
