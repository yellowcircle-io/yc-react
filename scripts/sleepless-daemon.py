#!/usr/bin/env python3
"""
Sleepless Daemon - Socket Mode Slash Command Handler

Handles /sleepless slash commands via Slack Socket Mode, invoking Claude Code CLI
for codebase-aware responses. Uses existing Claude Pro subscription (no API key needed).

Usage:
    # Activate virtual environment first:
    source scripts/.venv/bin/activate

    # Run in foreground:
    python3 scripts/sleepless-daemon.py

    # Run in background:
    python3 scripts/sleepless-daemon.py --daemon

Requirements:
    - SLACK_BOT_TOKEN in .env
    - SLACK_APP_TOKEN in .env (for Socket Mode)
    - Claude Code CLI installed and authenticated

Architecture:
    This is Tier 1 of the multi-tier hybrid architecture.
    When this daemon is running, /sleepless commands are handled directly.
    Response time: 2-15 seconds depending on CLI operation.
"""

import os
import sys
import json
import subprocess
import threading
import time
import signal
import requests
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Slack Bolt imports
try:
    from slack_bolt import App
    from slack_bolt.adapter.socket_mode import SocketModeHandler
except ImportError:
    print("ERROR: slack-bolt not installed. Run:")
    print("  source scripts/.venv/bin/activate")
    print("  pip install slack-bolt")
    sys.exit(1)

# Configuration
HEARTBEAT_INTERVAL = 30  # seconds
CLI_TIMEOUT = 120  # seconds - max time for Claude CLI response
LOG_FILE = None  # Set to path for file logging

# Heartbeat storage (file-based for simplicity, can upgrade to Firebase)
# Write locally to avoid TCC issues; primary path for monitoring
LOCAL_HEARTBEAT_DIR = Path.home() / 'Library' / 'Application Support' / 'yellowcircle' / 'sleepless'

def get_heartbeat_path():
    """Get heartbeat file path - always local to avoid TCC restrictions"""
    return LOCAL_HEARTBEAT_DIR / '.heartbeat.json'

HEARTBEAT_FILE = None  # Set lazily


def load_env():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, _, value = line.partition('=')
                    os.environ.setdefault(key.strip(), value.strip())


def log(message, level='INFO'):
    """Print timestamped log message"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f'[{timestamp}] [{level}] {message}'
    print(formatted)
    if LOG_FILE:
        with open(LOG_FILE, 'a') as f:
            f.write(formatted + '\n')


def write_heartbeat(status='running'):
    """Write heartbeat file for health monitoring"""
    try:
        heartbeat_file = get_heartbeat_path()
        heartbeat_file.parent.mkdir(parents=True, exist_ok=True)
        heartbeat = {
            'daemon': 'sleepless',
            'machine': os.uname().nodename,
            'status': status,
            'timestamp': time.time(),
            'iso_time': datetime.now().isoformat(),
            'pid': os.getpid(),
            'tier': 1
        }
        with open(heartbeat_file, 'w') as f:
            json.dump(heartbeat, f, indent=2)
    except Exception as e:
        log(f'Heartbeat write failed: {e}', 'WARN')


def call_claude_cli(prompt, timeout=CLI_TIMEOUT):
    """
    Invoke Claude Code CLI and return response.

    Uses the --print flag for non-interactive output.
    This leverages the existing Claude Pro subscription - no API key needed.
    """
    try:
        log(f'Invoking Claude CLI with prompt: {prompt[:100]}...')

        # Build command
        cmd = ['claude', '--print', '-p', prompt]

        # Run with timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=os.environ.get('CLAUDE_WORKDIR', str(Path(__file__).parent.parent))  # Run from project root
        )

        if result.returncode != 0:
            error_msg = result.stderr.strip() or 'Unknown error'
            log(f'Claude CLI error (code {result.returncode}): {error_msg}', 'ERROR')
            return f"Error: {error_msg}"

        response = result.stdout.strip()
        log(f'Claude CLI response: {response[:100]}...')
        return response

    except subprocess.TimeoutExpired:
        log(f'Claude CLI timed out after {timeout}s', 'ERROR')
        return f"Error: Request timed out after {timeout} seconds. Try a simpler query."
    except FileNotFoundError:
        log('Claude CLI not found. Is it installed?', 'ERROR')
        return "Error: Claude Code CLI not found. Please ensure it's installed and in PATH."
    except Exception as e:
        log(f'Claude CLI exception: {e}', 'ERROR')
        return f"Error: {str(e)}"


def format_response(text, execution_time=None):
    """Format response for Slack with proper markdown"""
    header = "*Sleepless Agent Response:*"

    # Add execution time if provided
    if execution_time:
        header += f" _({execution_time:.1f}s)_"

    # Detect if response contains code blocks
    if '```' in text:
        # Already has code blocks, use as-is
        return f"{header}\n\n{text}"
    elif len(text) > 500 or '\n' in text:
        # Long response or multi-line, wrap in code block
        return f"{header}\n```\n{text}\n```"
    else:
        # Short response, no special formatting
        return f"{header}\n\n{text}"


def create_app():
    """Create and configure Slack Bolt app"""
    slack_bot_token = os.environ.get('SLACK_BOT_TOKEN')

    if not slack_bot_token:
        log('ERROR: SLACK_BOT_TOKEN not set in .env', 'ERROR')
        sys.exit(1)

    app = App(token=slack_bot_token)

    # Handle /sleepless slash command
    @app.command("/sleepless")
    def handle_sleepless_command(ack, command, respond, client):
        """
        Handle /sleepless slash command.

        Acknowledges immediately, then processes in background thread
        to avoid Slack's 3-second timeout.
        """
        # Acknowledge immediately (required within 3 seconds)
        ack()

        user_id = command.get('user_id', 'unknown')
        user_name = command.get('user_name', 'unknown')
        channel_id = command.get('channel_id')
        text = command.get('text', '').strip()

        log(f'Received /sleepless from @{user_name}: {text[:100]}')

        # Handle empty command
        if not text:
            respond({
                "response_type": "ephemeral",
                "text": "*Usage:* `/sleepless [your prompt or question]`\n\n"
                        "*Examples:*\n"
                        "• `/sleepless summarize recent commits`\n"
                        "• `/sleepless what files handle authentication?`\n"
                        "• `/sleepless help me debug the login flow`\n"
                        "• `/sleepless status` - Check daemon status\n"
                        "• `/sleepless relay [msg]` - Send message to @claude (bot-to-bot test)"
            })
            return

        # Handle status command
        if text.lower() == 'status':
            try:
                with open(get_heartbeat_path()) as f:
                    heartbeat = json.load(f)
                status_msg = (
                    f"*Sleepless Agent Status:*\n"
                    f"• Tier: 1 (Socket Mode - Direct)\n"
                    f"• Machine: `{heartbeat.get('machine', 'unknown')}`\n"
                    f"• Status: {heartbeat.get('status', 'unknown')}\n"
                    f"• Last heartbeat: {heartbeat.get('iso_time', 'unknown')}\n"
                    f"• PID: {heartbeat.get('pid', 'unknown')}"
                )
            except Exception as e:
                status_msg = f"*Sleepless Agent Status:* Running (heartbeat unavailable: {e})"

            respond({
                "response_type": "ephemeral",
                "text": status_msg
            })
            return

        # Handle relay command - send message to @claude for bot-to-bot testing
        if text.lower().startswith('relay '):
            relay_text = text[6:].strip()  # Remove "relay " prefix
            if not relay_text:
                respond({
                    "response_type": "ephemeral",
                    "text": "*Usage:* `/sleepless relay [question for @claude]`"
                })
                return

            try:
                # Send message to channel mentioning @claude (native Anthropic integration)
                # @claude user ID: U09TPRV5ZQB (verified via users.list API)
                client.chat_postMessage(
                    channel=channel_id,
                    text=f"*Sleepless → @claude relay:*\n<@U09TPRV5ZQB> {relay_text}"
                )
                respond({
                    "response_type": "ephemeral",
                    "text": f"✓ Relayed to @claude: _{relay_text[:50]}{'...' if len(relay_text) > 50 else ''}_"
                })
                log(f'Relayed to @claude: {relay_text[:100]}')
            except Exception as e:
                log(f'Relay error: {e}', 'ERROR')
                respond({
                    "response_type": "ephemeral",
                    "text": f"*Relay error:* {str(e)}"
                })
            return

        # Process in background thread to avoid timeout
        def process_command():
            start_time = time.time()

            try:
                # Call Claude CLI
                response = call_claude_cli(text)
                execution_time = time.time() - start_time

                # Format and send response
                formatted = format_response(response, execution_time)

                respond({
                    "response_type": "in_channel",
                    "text": formatted
                })

                log(f'Response sent to @{user_name} in {execution_time:.1f}s')

            except Exception as e:
                log(f'Error processing command: {e}', 'ERROR')
                respond({
                    "response_type": "ephemeral",
                    "text": f"*Error:* {str(e)}"
                })

        # Start background processing
        thread = threading.Thread(target=process_command)
        thread.start()

    # Handle app mentions (optional - for @sleepless mentions)
    @app.event("app_mention")
    def handle_mention(event, say):
        """Handle @sleepless mentions in channels"""
        text = event.get('text', '')
        user = event.get('user', 'unknown')

        # Remove the bot mention from text
        # Format is usually: <@BOT_ID> message
        import re
        clean_text = re.sub(r'<@[A-Z0-9]+>\s*', '', text).strip()

        if not clean_text:
            say("Hi! Use `/sleepless [your question]` to interact with me.")
            return

        log(f'Received mention from {user}: {clean_text[:100]}')

        start_time = time.time()
        response = call_claude_cli(clean_text)
        execution_time = time.time() - start_time

        formatted = format_response(response, execution_time)
        say(formatted)

    return app


def heartbeat_loop():
    """Background thread to send periodic heartbeats"""
    log('Heartbeat thread started')
    while True:
        write_heartbeat('running')
        time.sleep(HEARTBEAT_INTERVAL)


def shutdown_handler(signum, frame):
    """Handle graceful shutdown"""
    log('Shutdown signal received')
    write_heartbeat('stopped')
    sys.exit(0)


def main():
    """Main entry point"""
    load_env()

    slack_app_token = os.environ.get('SLACK_APP_TOKEN')

    if not slack_app_token:
        log('ERROR: SLACK_APP_TOKEN not set in .env (required for Socket Mode)', 'ERROR')
        sys.exit(1)

    # Register shutdown handlers
    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)

    # Create Slack app
    app = create_app()

    # Start heartbeat thread
    heartbeat_thread = threading.Thread(target=heartbeat_loop, daemon=True)
    heartbeat_thread.start()

    # Write initial heartbeat
    write_heartbeat('starting')

    log('=' * 60)
    log('Sleepless Daemon Starting')
    log('=' * 60)
    log(f'  Mode: Socket Mode (Tier 1)')
    log(f'  Machine: {os.uname().nodename}')
    log(f'  PID: {os.getpid()}')
    log(f'  Heartbeat interval: {HEARTBEAT_INTERVAL}s')
    log(f'  CLI timeout: {CLI_TIMEOUT}s')
    log('')
    log('Listening for /sleepless commands...')
    log('')

    # Start Socket Mode handler (blocks)
    handler = SocketModeHandler(app, slack_app_token)

    try:
        write_heartbeat('running')
        handler.start()
    except KeyboardInterrupt:
        log('Interrupted by user')
    finally:
        write_heartbeat('stopped')
        log('Daemon stopped')


if __name__ == '__main__':
    if '--daemon' in sys.argv:
        # Fork to background (Unix only)
        if hasattr(os, 'fork'):
            if os.fork() > 0:
                sys.exit(0)
            os.setsid()
            if os.fork() > 0:
                sys.exit(0)

            # Redirect standard file descriptors
            sys.stdout.flush()
            sys.stderr.flush()

            # Set up log file for daemon mode
            LOG_FILE = Path(__file__).parent.parent / '.claude' / 'sleepless-daemon.log'
        else:
            log('Daemon mode not supported on this platform', 'WARN')

    main()
