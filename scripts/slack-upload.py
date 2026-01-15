#!/usr/bin/env python3
"""
Slack File Upload Script for Claude Code Autonomous Tasks
Uses new Slack files.getUploadURLExternal / files.completeUploadExternal API

Usage: python3 scripts/slack-upload.py "message" file1.png [file2.png ...] [channel]
"""

import sys
import os
import json
import urllib.request
import urllib.parse
from datetime import datetime
import mimetypes

def load_env():
    """Load environment variables from .env file"""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, _, value = line.strip().partition('=')
                    os.environ.setdefault(key, value)

def upload_file_to_slack_v2(file_path, channel, initial_comment=None):
    """Upload a file using new Slack API (v2)"""
    load_env()

    token = os.environ.get('SLACK_BOT_TOKEN')
    if not token:
        print("Error: SLACK_BOT_TOKEN not set")
        return None

    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return None

    filename = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)

    # Step 1: Get upload URL
    params = urllib.parse.urlencode({
        'filename': filename,
        'length': file_size
    })

    req = urllib.request.Request(
        f'https://slack.com/api/files.getUploadURLExternal?{params}',
        headers={'Authorization': f'Bearer {token}'}
    )

    try:
        response = urllib.request.urlopen(req)
        result = json.loads(response.read().decode())

        if not result.get('ok'):
            print(f"✗ Get upload URL error: {result.get('error')}")
            return None

        upload_url = result.get('upload_url')
        file_id = result.get('file_id')

    except Exception as e:
        print(f"✗ Get upload URL failed: {e}")
        return None

    # Step 2: Upload file to the URL
    with open(file_path, 'rb') as f:
        file_content = f.read()

    req = urllib.request.Request(
        upload_url,
        data=file_content,
        method='POST'
    )

    try:
        response = urllib.request.urlopen(req)
        # Upload returns empty 200 on success
    except Exception as e:
        print(f"✗ File upload failed: {e}")
        return None

    # Step 3: Complete upload and share to channel
    complete_data = json.dumps({
        'files': [{'id': file_id, 'title': filename}],
        'channel_id': channel,
        'initial_comment': initial_comment or ''
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://slack.com/api/files.completeUploadExternal',
        data=complete_data,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json; charset=utf-8'
        }
    )

    try:
        response = urllib.request.urlopen(req)
        result = json.loads(response.read().decode())

        if result.get('ok'):
            print(f"✓ Uploaded: {filename}")
            return result
        else:
            print(f"✗ Complete upload error: {result.get('error')}")
            return None

    except Exception as e:
        print(f"✗ Complete upload failed: {e}")
        return None

def upload_files_with_message(message, files, channel=None):
    """Upload multiple files with a message"""
    load_env()

    target_channel = channel or os.environ.get('SLACK_CHANNEL', 'C09UQGASA2C')

    if not files:
        print("Error: No files to upload")
        return False

    # Format message with timestamp
    timestamp = datetime.now().strftime('%H:%M')
    formatted_message = f"🤖 *Claude Agent* [{timestamp}]\n{message}"

    success_count = 0
    first_upload = True

    for file_path in files:
        # Only add comment to first file
        comment = formatted_message if first_upload else None
        result = upload_file_to_slack_v2(file_path, target_channel, initial_comment=comment)
        if result:
            success_count += 1
        first_upload = False

    print(f"\n✓ Uploaded {success_count}/{len(files)} files to {target_channel}")
    return success_count == len(files)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/slack-upload.py \"message\" file1.png [file2.png ...] [channel]")
        sys.exit(1)

    message = sys.argv[1]
    files = []
    channel = None

    for arg in sys.argv[2:]:
        if arg.startswith('#') or arg.startswith('C') or arg.startswith('U'):
            channel = arg
        elif os.path.exists(arg):
            files.append(arg)
        else:
            playwright_path = os.path.join(os.path.dirname(__file__), '..', '.playwright-mcp', arg)
            if os.path.exists(playwright_path):
                files.append(playwright_path)
            else:
                print(f"Warning: File not found: {arg}")

    if not files:
        print("Error: No valid files found")
        sys.exit(1)

    success = upload_files_with_message(message, files, channel)
    sys.exit(0 if success else 1)
