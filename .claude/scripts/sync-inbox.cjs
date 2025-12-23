#!/usr/bin/env node
/**
 * Sync Inbox from Firestore
 *
 * Polls Firestore for incoming messages and writes them to .claude/.inbox/
 * This bridges the gap between the slackWebhook function and local processing.
 *
 * Usage:
 *   node .claude/scripts/sync-inbox.js           # Sync once
 *   node .claude/scripts/sync-inbox.js --poll    # Continuous polling
 *
 * Created: December 22, 2025
 */

const fs = require('fs');
const path = require('path');

// Directories
const BASE_DIR = path.join(__dirname, '..');
const INBOX_DIR = path.join(BASE_DIR, '.inbox');

// Firebase endpoints
const FIREBASE_URL = 'https://us-central1-yellowcircle-app.cloudfunctions.net';

// Ensure inbox exists
if (!fs.existsSync(INBOX_DIR)) {
  fs.mkdirSync(INBOX_DIR, { recursive: true });
}

/**
 * Fetch pending messages from Firestore via Firebase Function
 */
async function fetchPendingMessages() {
  try {
    const response = await fetch(`${FIREBASE_URL}/getSlackMessages?status=pending`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.log('ℹ️ No getSlackMessages function or no pending messages');
      return [];
    }

    const data = await response.json();
    return data.messages || [];

  } catch (error) {
    // Function may not exist yet
    console.log('ℹ️ Could not fetch messages:', error.message);
    return [];
  }
}

/**
 * Mark message as processed in Firestore
 */
async function markProcessed(messageId) {
  try {
    await fetch(`${FIREBASE_URL}/markSlackMessageProcessed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId })
    });
  } catch (error) {
    console.log(`⚠️ Could not mark ${messageId} as processed:`, error.message);
  }
}

/**
 * Write message to local inbox
 */
function writeToInbox(message) {
  const filename = `slack_${message.id || Date.now()}.json`;
  const filepath = path.join(INBOX_DIR, filename);

  const inboxMessage = {
    type: 'slack_message',
    id: message.id,
    timestamp: message.timestamp || new Date().toISOString(),
    source: {
      channel: message.channel,
      user: message.user,
      thread_ts: message.thread_ts
    },
    content: {
      text: message.text,
      attachments: message.attachments || []
    },
    metadata: {
      is_command: message.text?.startsWith('/') || false,
      mentions_bot: message.text?.includes('<@') || false,
      synced_at: new Date().toISOString()
    }
  };

  fs.writeFileSync(filepath, JSON.stringify(inboxMessage, null, 2));
  console.log(`📥 Synced message to inbox: ${filename}`);

  return filename;
}

/**
 * Sync messages from Firestore to local inbox
 */
async function syncInbox() {
  console.log('🔄 Syncing inbox from Firestore...');

  const messages = await fetchPendingMessages();

  if (messages.length === 0) {
    console.log('📭 No pending messages');
    return 0;
  }

  console.log(`📬 Found ${messages.length} pending message(s)`);

  let synced = 0;
  for (const message of messages) {
    writeToInbox(message);
    await markProcessed(message.id);
    synced++;
  }

  console.log(`✅ Synced ${synced} message(s)`);
  return synced;
}

/**
 * Create a test message in inbox (for testing)
 */
function createTestMessage(text = 'Test message from sync-inbox.js') {
  const testMessage = {
    type: 'slack_message',
    id: `test_${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: {
      channel: 'D0A2KG1RSDU',
      user: 'U3JP2J8NS',
      thread_ts: null
    },
    content: {
      text,
      attachments: []
    },
    metadata: {
      is_command: false,
      mentions_bot: false,
      is_test: true,
      synced_at: new Date().toISOString()
    }
  };

  const filename = `test_${Date.now()}.json`;
  const filepath = path.join(INBOX_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(testMessage, null, 2));

  console.log(`📝 Created test message: ${filename}`);
  return filename;
}

/**
 * Polling mode - continuously sync
 */
async function pollMode(intervalMs = 30000) {
  console.log(`👀 Polling mode (every ${intervalMs / 1000}s)`);
  console.log('   Press Ctrl+C to stop\n');

  while (true) {
    await syncInbox();
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

// Main execution
async function main() {
  console.log('🔄 Claude Code Inbox Sync');
  console.log('==========================\n');

  const args = process.argv.slice(2);

  if (args.includes('--poll') || args.includes('-p')) {
    const interval = parseInt(args[args.indexOf('--interval') + 1]) || 30000;
    await pollMode(interval);
  } else if (args.includes('--test') || args.includes('-t')) {
    const text = args.slice(args.indexOf('--test') + 1).join(' ') || 'Test message';
    createTestMessage(text);
  } else {
    await syncInbox();
  }
}

main().catch(console.error);
