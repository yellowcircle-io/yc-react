#!/usr/bin/env python3
"""
Sleepless Daemon - Socket Mode Slash Command Handler with Multi-LLM Review

Handles /sleepless slash commands via Slack Socket Mode, invoking Claude Code CLI
for codebase-aware responses. Includes autonomous multi-LLM review system.

Features:
    - /sleepless [query] - Run Claude Code CLI commands
    - @sleepless mentions - Direct mentions in channels
    - Thread conversations - Reply in threads to continue conversations
    - Multi-LLM Review - Automatic review after 1hr user inactivity
    - /sleepless status - Check daemon status
    - /sleepless relay - Bot-to-bot relay (blocked on free Slack)

Multi-LLM Review System:
    - Triggers after 1 hour of user inactivity in a thread
    - Waterfall: Ollama (local) → Gemini (free) → Groq (free)
    - 15-minute max runtime with circuit breaker
    - Max 3 reviews per thread, 10 per day
    - Exponential backoff between reviews

Requirements:
    - SLACK_BOT_TOKEN in .env
    - SLACK_APP_TOKEN in .env (for Socket Mode)
    - Claude Code CLI installed and authenticated
    - Optional: Ollama running locally, GEMINI_API_KEY, GROQ_API_KEY
"""

import os
import sys
import json
import subprocess
import threading
import time
import signal
import re
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

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

# ============================================================
# Configuration
# ============================================================

HEARTBEAT_INTERVAL = 30  # seconds
CLI_TIMEOUT = 120  # seconds - max time for Claude CLI response
LOG_FILE = None  # Set to path for file logging
MAX_CONVERSATION_HISTORY = 10  # Max messages to keep per thread
CONVERSATION_TIMEOUT = 3600  # 1 hour - clear old conversations

# Connection Health Watchdog
HEALTH_CHECK_INTERVAL = 60  # seconds between Slack API health checks
HEALTH_MAX_CONSECUTIVE_FAILURES = 5  # exit for restart after this many failures (5 * 60s = 5 min)

# Multi-LLM Review Configuration
REVIEW_INACTIVITY_THRESHOLD = 3600  # 1 hour before triggering review
REVIEW_MAX_RUNTIME = 900  # 15 minutes max for review process
REVIEW_MAX_PER_THREAD = 3  # Max reviews per thread
REVIEW_MAX_PER_DAY = 10  # Max reviews per day (global)
REVIEW_CHECK_INTERVAL = 300  # Check for inactive threads every 5 min
REVIEW_BACKOFF_MULTIPLIER = 2  # Exponential backoff multiplier

# LLM Tier Configuration (waterfall order)
LLM_TIERS = [
    {
        'name': 'ollama',
        'model': 'llama3.2',  # or mistral, codellama, etc.
        'endpoint': 'http://localhost:11434/api/generate',
        'timeout': 120,
        'enabled': True,
    },
    {
        'name': 'gemini',
        'model': 'gemini-1.5-flash',
        'endpoint': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        'timeout': 60,
        'enabled': True,
        'env_key': 'GEMINI_API_KEY',
    },
    {
        'name': 'groq',
        'model': 'llama-3.3-70b-versatile',
        'endpoint': 'https://api.groq.com/openai/v1/chat/completions',
        'timeout': 30,
        'enabled': True,
        'env_key': 'GROQ_API_KEY',
    },
]

# Paths
LOCAL_HEARTBEAT_DIR = Path.home() / 'Library' / 'Application Support' / 'yellowcircle' / 'sleepless'
CIRCUIT_BREAKER_FILE = LOCAL_HEARTBEAT_DIR / 'circuit-breaker.json'
REVIEW_STATS_FILE = LOCAL_HEARTBEAT_DIR / 'review-stats.json'

# ============================================================
# Thread Storage
# ============================================================

# Thread conversation storage
# Format: {thread_ts: {'messages': [...], 'last_activity': timestamp, 'channel': channel_id,
#                      'last_user_activity': timestamp, 'review_count': int, 'next_review_delay': int}}
thread_conversations = defaultdict(lambda: {
    'messages': [],
    'last_activity': 0,
    'channel': None,
    'last_user_activity': 0,
    'review_count': 0,
    'next_review_delay': REVIEW_INACTIVITY_THRESHOLD,
})
conversations_lock = threading.Lock()

# Global review stats
review_stats = {
    'today': datetime.now().strftime('%Y-%m-%d'),
    'count': 0,
    'last_review': None,
}
review_stats_lock = threading.Lock()

# Review thread control
review_thread_running = False
review_stop_event = threading.Event()

# Slack client reference (set during app creation)
slack_client = None


# ============================================================
# Utility Functions
# ============================================================

def get_heartbeat_path():
    """Get heartbeat file path"""
    return LOCAL_HEARTBEAT_DIR / '.heartbeat.json'


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
        try:
            with open(LOG_FILE, 'a') as f:
                f.write(formatted + '\n')
        except:
            pass


def write_heartbeat(status='running'):
    """Write heartbeat file for health monitoring"""
    try:
        heartbeat_file = get_heartbeat_path()
        heartbeat_file.parent.mkdir(parents=True, exist_ok=True)

        with review_stats_lock:
            daily_reviews = review_stats.get('count', 0)

        heartbeat = {
            'daemon': 'sleepless',
            'machine': os.uname().nodename,
            'status': status,
            'timestamp': time.time(),
            'iso_time': datetime.now().isoformat(),
            'pid': os.getpid(),
            'tier': 1,
            'features': ['slash_command', 'mentions', 'thread_conversations', 'multi_llm_review'],
            'review_stats': {
                'daily_count': daily_reviews,
                'max_daily': REVIEW_MAX_PER_DAY,
                'circuit_breaker': is_circuit_breaker_open(),
            }
        }
        with open(heartbeat_file, 'w') as f:
            json.dump(heartbeat, f, indent=2)
    except Exception as e:
        log(f'Heartbeat write failed: {e}', 'WARN')


# ============================================================
# Circuit Breaker
# ============================================================

def is_circuit_breaker_open():
    """Check if circuit breaker is open (reviews disabled)"""
    try:
        if CIRCUIT_BREAKER_FILE.exists():
            with open(CIRCUIT_BREAKER_FILE) as f:
                data = json.load(f)
                if data.get('open', False):
                    # Check if it should auto-reset
                    reset_time = data.get('reset_at')
                    if reset_time and time.time() > reset_time:
                        close_circuit_breaker()
                        return False
                    return True
        return False
    except:
        return False


def open_circuit_breaker(reason, duration_hours=24):
    """Open circuit breaker to stop all reviews"""
    try:
        CIRCUIT_BREAKER_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = {
            'open': True,
            'reason': reason,
            'opened_at': datetime.now().isoformat(),
            'reset_at': time.time() + (duration_hours * 3600),
        }
        with open(CIRCUIT_BREAKER_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        log(f'Circuit breaker OPENED: {reason}', 'WARN')
    except Exception as e:
        log(f'Failed to open circuit breaker: {e}', 'ERROR')


def close_circuit_breaker():
    """Close circuit breaker to allow reviews"""
    try:
        if CIRCUIT_BREAKER_FILE.exists():
            CIRCUIT_BREAKER_FILE.unlink()
        log('Circuit breaker closed', 'INFO')
    except Exception as e:
        log(f'Failed to close circuit breaker: {e}', 'ERROR')


# ============================================================
# Review Stats Management
# ============================================================

def load_review_stats():
    """Load review stats from file"""
    global review_stats
    try:
        if REVIEW_STATS_FILE.exists():
            with open(REVIEW_STATS_FILE) as f:
                review_stats = json.load(f)
        # Reset if new day
        today = datetime.now().strftime('%Y-%m-%d')
        if review_stats.get('today') != today:
            review_stats = {'today': today, 'count': 0, 'last_review': None}
            save_review_stats()
    except:
        review_stats = {'today': datetime.now().strftime('%Y-%m-%d'), 'count': 0, 'last_review': None}


def save_review_stats():
    """Save review stats to file"""
    try:
        REVIEW_STATS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(REVIEW_STATS_FILE, 'w') as f:
            json.dump(review_stats, f, indent=2)
    except Exception as e:
        log(f'Failed to save review stats: {e}', 'ERROR')


def can_do_review():
    """Check if we can perform a review (daily limit)"""
    with review_stats_lock:
        today = datetime.now().strftime('%Y-%m-%d')
        if review_stats.get('today') != today:
            review_stats['today'] = today
            review_stats['count'] = 0
            save_review_stats()
        return review_stats.get('count', 0) < REVIEW_MAX_PER_DAY


def increment_review_count():
    """Increment daily review count"""
    with review_stats_lock:
        review_stats['count'] = review_stats.get('count', 0) + 1
        review_stats['last_review'] = datetime.now().isoformat()
        save_review_stats()


# ============================================================
# Conversation Management
# ============================================================

def cleanup_old_conversations():
    """Remove conversations older than CONVERSATION_TIMEOUT"""
    with conversations_lock:
        current_time = time.time()
        expired = [ts for ts, conv in thread_conversations.items()
                   if current_time - conv['last_activity'] > CONVERSATION_TIMEOUT * 2]  # 2x for cleanup
        for ts in expired:
            del thread_conversations[ts]
        if expired:
            log(f'Cleaned up {len(expired)} expired conversations')


def add_to_conversation(thread_ts, role, content, channel=None, is_user=False):
    """Add a message to thread conversation history"""
    with conversations_lock:
        conv = thread_conversations[thread_ts]
        conv['messages'].append({'role': role, 'content': content, 'time': time.time()})
        conv['last_activity'] = time.time()
        if is_user:
            conv['last_user_activity'] = time.time()
            # Reset review delay on user activity
            conv['next_review_delay'] = REVIEW_INACTIVITY_THRESHOLD
        if channel:
            conv['channel'] = channel
        # Trim to max history
        if len(conv['messages']) > MAX_CONVERSATION_HISTORY:
            conv['messages'] = conv['messages'][-MAX_CONVERSATION_HISTORY:]


def get_conversation_context(thread_ts):
    """Get conversation history as context string"""
    with conversations_lock:
        conv = thread_conversations.get(thread_ts)
        if not conv or not conv['messages']:
            return None

        context_parts = []
        for msg in conv['messages']:
            role = "User" if msg['role'] == 'user' else "Assistant"
            context_parts.append(f"{role}: {msg['content']}")

        return "\n".join(context_parts)


def is_sleepless_thread(thread_ts):
    """Check if sleepless has participated in this thread"""
    with conversations_lock:
        return thread_ts in thread_conversations and len(thread_conversations[thread_ts]['messages']) > 0


def get_threads_needing_review():
    """Get threads that need review (inactive for threshold period)"""
    threads_to_review = []
    current_time = time.time()

    with conversations_lock:
        for thread_ts, conv in thread_conversations.items():
            # Skip if no messages or no channel
            if not conv['messages'] or not conv['channel']:
                continue

            # Skip if max reviews reached for this thread
            if conv.get('review_count', 0) >= REVIEW_MAX_PER_THREAD:
                continue

            # Check inactivity threshold (with backoff)
            threshold = conv.get('next_review_delay', REVIEW_INACTIVITY_THRESHOLD)
            last_user = conv.get('last_user_activity', conv['last_activity'])

            if current_time - last_user >= threshold:
                # Check if last message was from assistant (avoid reviewing user messages)
                if conv['messages'] and conv['messages'][-1]['role'] == 'assistant':
                    threads_to_review.append({
                        'thread_ts': thread_ts,
                        'channel': conv['channel'],
                        'context': get_conversation_context(thread_ts),
                        'review_count': conv.get('review_count', 0),
                    })

    return threads_to_review


def mark_thread_reviewed(thread_ts):
    """Mark thread as reviewed and update backoff"""
    with conversations_lock:
        if thread_ts in thread_conversations:
            conv = thread_conversations[thread_ts]
            conv['review_count'] = conv.get('review_count', 0) + 1
            # Exponential backoff for next review
            current_delay = conv.get('next_review_delay', REVIEW_INACTIVITY_THRESHOLD)
            conv['next_review_delay'] = min(current_delay * REVIEW_BACKOFF_MULTIPLIER, 86400)  # Max 24hr


# ============================================================
# LLM Integration
# ============================================================

def call_ollama(prompt, model='llama3.2', timeout=120):
    """Call local Ollama instance"""
    try:
        data = json.dumps({
            'model': model,
            'prompt': prompt,
            'stream': False,
        }).encode('utf-8')

        req = urllib.request.Request(
            'http://localhost:11434/api/generate',
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=timeout) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('response', '')
    except urllib.error.URLError as e:
        log(f'Ollama connection failed: {e}', 'WARN')
        return None
    except Exception as e:
        log(f'Ollama error: {e}', 'ERROR')
        return None


def call_gemini(prompt, api_key, model='gemini-1.5-flash', timeout=60):
    """Call Google Gemini API"""
    try:
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
        data = json.dumps({
            'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {'maxOutputTokens': 2048},
        }).encode('utf-8')

        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=timeout) as response:
            result = json.loads(response.read().decode('utf-8'))
            candidates = result.get('candidates', [])
            if candidates:
                content = candidates[0].get('content', {})
                parts = content.get('parts', [])
                if parts:
                    return parts[0].get('text', '')
        return None
    except Exception as e:
        log(f'Gemini error: {e}', 'ERROR')
        return None


def call_groq(prompt, api_key, model='llama-3.1-70b-versatile', timeout=30):
    """Call Groq API (OpenAI-compatible)"""
    try:
        data = json.dumps({
            'model': model,
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 2048,
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.groq.com/openai/v1/chat/completions',
            data=data,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}',
            },
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=timeout) as response:
            result = json.loads(response.read().decode('utf-8'))
            choices = result.get('choices', [])
            if choices:
                return choices[0].get('message', {}).get('content', '')
        return None
    except Exception as e:
        log(f'Groq error: {e}', 'ERROR')
        return None


def call_review_llm(prompt):
    """
    Call LLM using waterfall pattern.
    Tries each tier until one succeeds.
    Returns tuple: (response, llm_name) or (None, None)
    """
    for tier in LLM_TIERS:
        if not tier.get('enabled', True):
            continue

        name = tier['name']
        log(f'Trying {name} for review...')

        try:
            if name == 'ollama':
                response = call_ollama(prompt, tier.get('model', 'llama3.2'), tier.get('timeout', 120))
            elif name == 'gemini':
                api_key = os.environ.get(tier.get('env_key', 'GEMINI_API_KEY'))
                if not api_key:
                    log(f'Gemini API key not found, skipping', 'WARN')
                    continue
                response = call_gemini(prompt, api_key, tier.get('model'), tier.get('timeout', 60))
            elif name == 'groq':
                api_key = os.environ.get(tier.get('env_key', 'GROQ_API_KEY'))
                if not api_key:
                    log(f'Groq API key not found, skipping', 'WARN')
                    continue
                response = call_groq(prompt, api_key, tier.get('model'), tier.get('timeout', 30))
            else:
                continue

            if response:
                log(f'{name} responded successfully')
                return response, name

        except Exception as e:
            log(f'{name} failed: {e}', 'ERROR')
            continue

    return None, None


# ============================================================
# Review Process
# ============================================================

def build_review_prompt(context, last_assistant_message):
    """Build prompt for review LLM"""
    return f"""You are a code review assistant helping to refine work done by another AI assistant (Claude Code CLI).

CONVERSATION CONTEXT:
{context}

LAST ASSISTANT RESPONSE TO REVIEW:
{last_assistant_message}

INSTRUCTIONS:
1. Review the assistant's last response for completeness and accuracy
2. Identify any improvements, missing details, or potential issues
3. Suggest specific refinements or next steps
4. Be concise - this is a quick review, not a full rewrite
5. If the response looks complete and correct, say "LGTM" with brief reasoning

Provide your review feedback (max 500 words):"""


def perform_review(thread_info):
    """
    Perform a review on a thread.
    Returns True if review was posted, False otherwise.
    """
    thread_ts = thread_info['thread_ts']
    channel = thread_info['channel']
    context = thread_info['context']

    # Get last assistant message
    with conversations_lock:
        conv = thread_conversations.get(thread_ts, {})
        messages = conv.get('messages', [])
        last_assistant_msg = None
        for msg in reversed(messages):
            if msg['role'] == 'assistant':
                last_assistant_msg = msg['content']
                break

    if not last_assistant_msg:
        log(f'No assistant message found in thread {thread_ts}', 'WARN')
        return False

    # Build review prompt
    prompt = build_review_prompt(context, last_assistant_msg)

    # Call review LLM (waterfall)
    review_response, llm_name = call_review_llm(prompt)

    if not review_response:
        log(f'All LLMs failed for thread {thread_ts}', 'WARN')
        return False

    # Post review to Slack thread
    try:
        global slack_client
        if slack_client:
            review_text = f"🤖 *Auto-Review ({llm_name}):* _(1hr+ no user activity)_\n\n{review_response}\n\n_Reply to continue, or this thread will remain dormant._"

            slack_client.chat_postMessage(
                channel=channel,
                thread_ts=thread_ts,
                text=review_text
            )

            # Add review to conversation history
            add_to_conversation(thread_ts, 'reviewer', review_response, channel)
            mark_thread_reviewed(thread_ts)
            increment_review_count()

            log(f'Review posted to thread {thread_ts} via {llm_name}')
            return True
    except Exception as e:
        log(f'Failed to post review: {e}', 'ERROR')

    return False


def review_loop():
    """Background loop to check for threads needing review"""
    global review_thread_running
    review_thread_running = True

    log('Review loop started')

    while not review_stop_event.is_set():
        try:
            # Check circuit breaker
            if is_circuit_breaker_open():
                log('Circuit breaker open, skipping review check', 'WARN')
                review_stop_event.wait(REVIEW_CHECK_INTERVAL)
                continue

            # Check daily limit
            if not can_do_review():
                log(f'Daily review limit reached ({REVIEW_MAX_PER_DAY})', 'WARN')
                review_stop_event.wait(REVIEW_CHECK_INTERVAL)
                continue

            # Find threads needing review
            threads = get_threads_needing_review()

            if threads:
                log(f'Found {len(threads)} thread(s) needing review')

                # Process one thread at a time with timeout
                start_time = time.time()
                for thread_info in threads:
                    # Check runtime limit
                    if time.time() - start_time > REVIEW_MAX_RUNTIME:
                        log('Review runtime limit reached (15min)', 'WARN')
                        break

                    # Check circuit breaker again
                    if is_circuit_breaker_open():
                        break

                    # Check daily limit again
                    if not can_do_review():
                        break

                    # Perform review
                    perform_review(thread_info)

                    # Small delay between reviews
                    time.sleep(5)

        except Exception as e:
            log(f'Review loop error: {e}', 'ERROR')
            # Open circuit breaker on repeated errors
            open_circuit_breaker(f'Review loop error: {e}', duration_hours=1)

        # Wait for next check
        review_stop_event.wait(REVIEW_CHECK_INTERVAL)

    review_thread_running = False
    log('Review loop stopped')


# ============================================================
# Claude CLI Integration
# ============================================================

def call_claude_cli(prompt, context=None, timeout=CLI_TIMEOUT):
    """
    Invoke Claude Code CLI and return response.
    """
    try:
        if context:
            full_prompt = f"""Previous conversation context:
{context}

Current question/request:
{prompt}

Please respond considering the conversation context above."""
        else:
            full_prompt = prompt

        log(f'Invoking Claude CLI with prompt: {prompt[:100]}...')

        cmd = ['claude', '--print', '-p', full_prompt]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=os.environ.get('CLAUDE_WORKDIR', str(Path(__file__).parent.parent))
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


def format_response(text, execution_time=None, is_thread=False):
    """Format response for Slack with proper markdown"""
    if is_thread:
        header = "*Sleepless:*"
    else:
        header = "*Sleepless Agent Response:*"

    if execution_time:
        header += f" _({execution_time:.1f}s)_"

    if '```' in text:
        return f"{header}\n\n{text}"
    elif len(text) > 500 or '\n' in text:
        return f"{header}\n```\n{text}\n```"
    else:
        return f"{header}\n\n{text}"


# ============================================================
# Slack App
# ============================================================

def create_app():
    """Create and configure Slack Bolt app"""
    global slack_client

    slack_bot_token = os.environ.get('SLACK_BOT_TOKEN')

    if not slack_bot_token:
        log('ERROR: SLACK_BOT_TOKEN not set in .env', 'ERROR')
        sys.exit(1)

    app = App(token=slack_bot_token)
    slack_client = app.client

    # Get bot user ID
    bot_user_id = None
    try:
        auth_result = app.client.auth_test()
        bot_user_id = auth_result.get('user_id')
        log(f'Bot user ID: {bot_user_id}')
    except Exception as e:
        log(f'Could not get bot user ID: {e}', 'WARN')

    # Handle /sleepless slash command
    @app.command("/sleepless")
    def handle_sleepless_command(ack, command, respond, client):
        """Handle /sleepless slash command."""
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
                        "• `/sleepless relay [msg]` - Send message to @claude\n"
                        "• `/sleepless circuit [open|close]` - Control review circuit breaker\n\n"
                        "*Improvement Commands:* `/sleepless improve <cmd>`\n"
                        "• `/sleepless improve` - Show improvement backlog status\n"
                        "• `/sleepless improve IMP-XXX` - Execute specific improvement\n"
                        "• `/sleepless improve next` - Execute next ready improvement\n"
                        "• `/sleepless improve dry IMP-XXX` - Dry run (preview prompt)\n"
                        "• `/sleepless improve reset` - Reset circuit breaker\n\n"
                        "*yellowCircle Commands:* `/sleepless yc <command>`\n"
                        "• `/sleepless yc notify \"message\"` - Send notification\n"
                        "• `/sleepless yc status success \"message\"` - Status update\n"
                        "• `/sleepless yc history` - Show recent changes\n"
                        "• `/sleepless yc rollback` - Rollback last change\n"
                        "• `/sleepless yc help` - Full command list\n\n"
                        "*Thread Support:* Reply to continue conversations!\n"
                        "*Auto-Review:* After 1hr inactivity, LLMs review and suggest refinements."
            })
            return

        # Handle status command
        if text.lower() == 'status':
            try:
                with open(get_heartbeat_path()) as f:
                    heartbeat = json.load(f)

                with conversations_lock:
                    active_threads = len([t for t in thread_conversations.values() if t['messages']])

                with review_stats_lock:
                    daily_reviews = review_stats.get('count', 0)

                circuit_status = "🔴 OPEN" if is_circuit_breaker_open() else "🟢 Closed"

                # Get improvement backlog status
                imp_status = ""
                try:
                    backlog_index = Path(__file__).parent.parent / '.claude' / 'improvement-backlog' / 'BACKLOG_INDEX.json'
                    if backlog_index.exists():
                        with open(backlog_index) as bf:
                            backlog = json.load(bf)
                        imp_cb = backlog.get('circuitBreaker', {})
                        imp_round = backlog.get('currentRound', '?')
                        imp_theme = backlog.get('roundTheme', '?')
                        imp_cb_status = "OPEN" if imp_cb.get('status') == 'open' else "Closed"
                        rp = backlog.get('roundProgress', {}).get(f'round{imp_round}', {})
                        imp_status = (
                            f"\n*Improvement System:*\n"
                            f"• Round: {imp_round} ({imp_theme})\n"
                            f"• Progress: {rp.get('merged', 0)}/{rp.get('total', '?')} merged\n"
                            f"• Circuit breaker: {imp_cb_status} ({imp_cb.get('consecutiveFailures', 0)}/3)\n"
                        )
                except Exception:
                    pass

                status_msg = (
                    f"*Sleepless Agent Status:*\n"
                    f"• Tier: 1 (Socket Mode - Direct)\n"
                    f"• Machine: `{heartbeat.get('machine', 'unknown')}`\n"
                    f"• Status: {heartbeat.get('status', 'unknown')}\n"
                    f"• PID: {heartbeat.get('pid', 'unknown')}\n"
                    f"• Active threads: {active_threads}\n"
                    f"• Daily reviews: {daily_reviews}/{REVIEW_MAX_PER_DAY}\n"
                    f"• Circuit breaker: {circuit_status}\n"
                    f"• Features: commands, mentions, threads, auto-review, improvements"
                    f"{imp_status}"
                )
            except Exception as e:
                status_msg = f"*Sleepless Agent Status:* Running (details unavailable: {e})"

            respond({"response_type": "ephemeral", "text": status_msg})
            return

        # Handle circuit breaker command
        if text.lower().startswith('circuit '):
            action = text[8:].strip().lower()
            if action == 'open':
                open_circuit_breaker('Manual override via /sleepless circuit open', duration_hours=24)
                respond({"response_type": "ephemeral", "text": "🔴 Circuit breaker OPENED - Auto-reviews disabled for 24 hours"})
            elif action == 'close':
                close_circuit_breaker()
                respond({"response_type": "ephemeral", "text": "🟢 Circuit breaker CLOSED - Auto-reviews enabled"})
            else:
                respond({"response_type": "ephemeral", "text": "*Usage:* `/sleepless circuit [open|close]`"})
            return

        # Handle relay command
        if text.lower().startswith('relay '):
            relay_text = text[6:].strip()
            if not relay_text:
                respond({"response_type": "ephemeral", "text": "*Usage:* `/sleepless relay [question for @claude]`"})
                return

            try:
                client.chat_postMessage(
                    channel=channel_id,
                    text=f"*Sleepless → @claude relay:*\n<@U09TPRV5ZQB> {relay_text}"
                )
                respond({
                    "response_type": "ephemeral",
                    "text": f"✓ Relayed to @claude (note: bot-to-bot blocked on free Slack): _{relay_text[:50]}{'...' if len(relay_text) > 50 else ''}_"
                })
                log(f'Relayed to @claude: {relay_text[:100]}')
            except Exception as e:
                log(f'Relay error: {e}', 'ERROR')
                respond({"response_type": "ephemeral", "text": f"*Relay error:* {str(e)}"})
            return

        # Handle improve command (autonomous UI/UX improvements)
        if text.lower().startswith('improve ') or text.lower() == 'improve':
            imp_args = text[8:].strip() if len(text) > 8 else ''
            log(f'Improve command: {imp_args}')

            def run_improve_command():
                try:
                    runner_script = Path(__file__).parent / 'improvement-runner.sh'
                    if not runner_script.exists():
                        client.chat_postMessage(
                            channel=channel_id,
                            text="*Improve:* Runner script not found at `scripts/improvement-runner.sh`"
                        )
                        return

                    if not imp_args:
                        # Show status
                        cmd_args = ['--status']
                    elif imp_args.lower() == 'next':
                        cmd_args = ['--next']
                    elif imp_args.lower() == 'reset':
                        cmd_args = ['--reset-circuit']
                    elif imp_args.lower().startswith('dry '):
                        # dry IMP-002 -> IMP-002 --dry-run
                        imp_id = imp_args[4:].strip()
                        cmd_args = [imp_id, '--dry-run']
                    else:
                        # Direct IMP-XXX execution
                        cmd_args = [imp_args.strip()]

                    result = subprocess.run(
                        ['bash', str(runner_script)] + cmd_args,
                        capture_output=True,
                        text=True,
                        timeout=360,  # 6 min (runner has 5 min CLI timeout)
                        cwd=str(Path(__file__).parent.parent)
                    )

                    output = result.stdout.strip() or result.stderr.strip() or 'Command completed (no output)'

                    if len(output) > 2900:
                        output = output[:2900] + '...(truncated)'

                    status_emoji = '✅' if result.returncode == 0 else '❌'
                    client.chat_postMessage(
                        channel=channel_id,
                        text=f"{status_emoji} *Improve {imp_args or 'status'}:*\n```\n{output}\n```"
                    )
                    log(f'Improve command completed: {imp_args} (exit {result.returncode})')

                except subprocess.TimeoutExpired:
                    client.chat_postMessage(
                        channel=channel_id,
                        text=f"*Improve {imp_args}:* Timed out after 6 minutes"
                    )
                except Exception as e:
                    log(f'Improve command error: {e}', 'ERROR')
                    client.chat_postMessage(
                        channel=channel_id,
                        text=f"*Improve {imp_args}:* Error: {str(e)}"
                    )

            thread = threading.Thread(target=run_improve_command)
            thread.start()
            return

        # Handle yc (yellowCircle) commands
        if text.lower().startswith('yc ') or text.lower() == 'yc':
            yc_args = text[3:].strip() if len(text) > 3 else 'help'
            log(f'Executing yc command: {yc_args}')

            def run_yc_command():
                try:
                    script_path = Path(__file__).parent / 'yc-command.sh'
                    result = subprocess.run(
                        ['bash', str(script_path)] + yc_args.split(),
                        capture_output=True,
                        text=True,
                        timeout=60,
                        cwd=str(Path(__file__).parent.parent)
                    )

                    output = result.stdout.strip() or result.stderr.strip() or 'Command completed'

                    # Format output for Slack
                    if len(output) > 2900:
                        output = output[:2900] + '...(truncated)'

                    client.chat_postMessage(
                        channel=channel_id,
                        text=f"*yc {yc_args}:*\n```\n{output}\n```"
                    )
                    log(f'yc command completed: {yc_args}')

                except subprocess.TimeoutExpired:
                    client.chat_postMessage(
                        channel=channel_id,
                        text=f"*yc {yc_args}:* ⏱️ Command timed out after 60s"
                    )
                except Exception as e:
                    log(f'yc command error: {e}', 'ERROR')
                    client.chat_postMessage(
                        channel=channel_id,
                        text=f"*yc {yc_args}:* ❌ Error: {str(e)}"
                    )

            thread = threading.Thread(target=run_yc_command)
            thread.start()
            return

        # Process command in background thread
        def process_command():
            start_time = time.time()

            try:
                response = call_claude_cli(text)
                execution_time = time.time() - start_time
                formatted = format_response(response, execution_time)

                result = client.chat_postMessage(channel=channel_id, text=formatted)

                thread_ts = result.get('ts')
                if thread_ts:
                    add_to_conversation(thread_ts, 'user', text, channel_id, is_user=True)
                    add_to_conversation(thread_ts, 'assistant', response)
                    log(f'Started conversation thread: {thread_ts}')

                log(f'Response sent to @{user_name} in {execution_time:.1f}s')

            except Exception as e:
                log(f'Error processing command: {e}', 'ERROR')
                respond({"response_type": "ephemeral", "text": f"*Error:* {str(e)}"})

        thread = threading.Thread(target=process_command)
        thread.start()

    # Handle @sleepless mentions
    @app.event("app_mention")
    def handle_mention(event, say, client):
        """Handle @sleepless mentions in channels"""
        text = event.get('text', '')
        user = event.get('user', 'unknown')
        channel = event.get('channel')
        thread_ts = event.get('thread_ts') or event.get('ts')

        clean_text = re.sub(r'<@[A-Z0-9]+>\s*', '', text).strip()

        if not clean_text:
            say("Hi! Use `/sleepless [your question]` to interact with me, or reply to any of my messages to continue a conversation.", thread_ts=thread_ts)
            return

        log(f'Received mention from {user}: {clean_text[:100]}')

        context = get_conversation_context(thread_ts) if thread_ts else None

        start_time = time.time()
        response = call_claude_cli(clean_text, context=context)
        execution_time = time.time() - start_time

        add_to_conversation(thread_ts, 'user', clean_text, channel, is_user=True)
        add_to_conversation(thread_ts, 'assistant', response)

        formatted = format_response(response, execution_time, is_thread=bool(context))
        say(formatted, thread_ts=thread_ts)

    # Handle thread replies
    @app.event("message")
    def handle_message(event, say, client):
        """Handle messages - specifically thread replies"""
        if event.get('bot_id') or event.get('subtype'):
            return

        thread_ts = event.get('thread_ts')

        if not thread_ts or not is_sleepless_thread(thread_ts):
            return

        text = event.get('text', '').strip()
        user = event.get('user', 'unknown')
        channel = event.get('channel')

        clean_text = re.sub(r'<@[A-Z0-9]+>\s*', '', text).strip()
        if not clean_text:
            return

        log(f'Thread reply from {user} in {thread_ts}: {clean_text[:100]}')

        context = get_conversation_context(thread_ts)

        def process_reply():
            start_time = time.time()

            try:
                response = call_claude_cli(clean_text, context=context)
                execution_time = time.time() - start_time

                add_to_conversation(thread_ts, 'user', clean_text, channel, is_user=True)
                add_to_conversation(thread_ts, 'assistant', response)

                formatted = format_response(response, execution_time, is_thread=True)
                say(formatted, thread_ts=thread_ts)

                log(f'Thread response sent in {execution_time:.1f}s')

            except Exception as e:
                log(f'Error processing thread reply: {e}', 'ERROR')
                say(f"*Error:* {str(e)}", thread_ts=thread_ts)

        thread = threading.Thread(target=process_reply)
        thread.start()

    return app


# ============================================================
# Main
# ============================================================

def heartbeat_loop():
    """Background thread for heartbeats and cleanup"""
    log('Heartbeat thread started')
    cleanup_counter = 0
    while True:
        write_heartbeat('running')
        cleanup_counter += 1
        if cleanup_counter >= 10:
            cleanup_old_conversations()
            cleanup_counter = 0
        time.sleep(HEARTBEAT_INTERVAL)


def health_watchdog():
    """
    Background thread that monitors Slack API connectivity.
    Exits the process with code 2 if connection is persistently broken,
    allowing the launcher supervisor to restart cleanly.
    """
    log('Health watchdog started')
    consecutive_failures = 0

    # Give the daemon time to fully start before checking
    time.sleep(HEALTH_CHECK_INTERVAL)

    while True:
        try:
            if slack_client:
                result = slack_client.auth_test()
                if result.get('ok'):
                    if consecutive_failures > 0:
                        log(f'Health watchdog: connection recovered after {consecutive_failures} failures')
                    consecutive_failures = 0
                else:
                    consecutive_failures += 1
                    log(f'Health watchdog: auth_test not ok ({consecutive_failures}/{HEALTH_MAX_CONSECUTIVE_FAILURES})', 'WARN')
            else:
                consecutive_failures += 1
                log(f'Health watchdog: no slack_client ({consecutive_failures}/{HEALTH_MAX_CONSECUTIVE_FAILURES})', 'WARN')
        except Exception as e:
            consecutive_failures += 1
            log(f'Health watchdog: check failed ({consecutive_failures}/{HEALTH_MAX_CONSECUTIVE_FAILURES}): {e}', 'WARN')

        if consecutive_failures >= HEALTH_MAX_CONSECUTIVE_FAILURES:
            log(f'Health watchdog: {consecutive_failures} consecutive failures, triggering restart', 'ERROR')
            write_heartbeat('unhealthy')
            review_stop_event.set()
            os._exit(2)  # Non-zero, non-standard exit triggers supervisor restart

        time.sleep(HEALTH_CHECK_INTERVAL)


def shutdown_handler(signum, frame):
    """Handle graceful shutdown"""
    log('Shutdown signal received')
    review_stop_event.set()
    write_heartbeat('stopped')
    sys.exit(0)


def main():
    """Main entry point"""
    load_env()
    load_review_stats()

    slack_app_token = os.environ.get('SLACK_APP_TOKEN')

    if not slack_app_token:
        log('ERROR: SLACK_APP_TOKEN not set in .env (required for Socket Mode)', 'ERROR')
        sys.exit(1)

    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)

    app = create_app()

    # Start heartbeat thread
    heartbeat_thread = threading.Thread(target=heartbeat_loop, daemon=True)
    heartbeat_thread.start()

    # Start review loop thread
    review_thread = threading.Thread(target=review_loop, daemon=True)
    review_thread.start()

    # Start health watchdog thread
    watchdog_thread = threading.Thread(target=health_watchdog, daemon=True)
    watchdog_thread.start()

    write_heartbeat('starting')

    log('=' * 60)
    log('Sleepless Daemon Starting (Multi-LLM Review Enabled)')
    log('=' * 60)
    log(f'  Mode: Socket Mode (Tier 1)')
    log(f'  Machine: {os.uname().nodename}')
    log(f'  PID: {os.getpid()}')
    log(f'  Features:')
    log(f'    - /sleepless commands')
    log(f'    - @sleepless mentions')
    log(f'    - Thread conversations')
    log(f'    - Multi-LLM auto-review (1hr inactivity)')
    log(f'    - /sleepless improve (autonomous UI/UX improvements)')
    log(f'  Review Config:')
    log(f'    - Inactivity threshold: {REVIEW_INACTIVITY_THRESHOLD}s')
    log(f'    - Max runtime: {REVIEW_MAX_RUNTIME}s')
    log(f'    - Max per thread: {REVIEW_MAX_PER_THREAD}')
    log(f'    - Max per day: {REVIEW_MAX_PER_DAY}')
    log(f'  LLM Tiers: {" → ".join([t["name"] for t in LLM_TIERS if t.get("enabled")])}')
    log('')
    log('Listening for commands...')
    log('')

    handler = SocketModeHandler(app, slack_app_token)

    try:
        write_heartbeat('running')
        handler.start()
    except KeyboardInterrupt:
        log('Interrupted by user')
    finally:
        review_stop_event.set()
        write_heartbeat('stopped')
        log('Daemon stopped')


if __name__ == '__main__':
    if '--daemon' in sys.argv:
        if hasattr(os, 'fork'):
            if os.fork() > 0:
                sys.exit(0)
            os.setsid()
            if os.fork() > 0:
                sys.exit(0)

            sys.stdout.flush()
            sys.stderr.flush()

            LOG_FILE = Path(__file__).parent.parent / '.claude' / 'sleepless-daemon.log'
        else:
            log('Daemon mode not supported on this platform', 'WARN')

    main()
