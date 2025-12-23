#!/usr/bin/env node
/**
 * Inbox Processor for Claude Code Autonomous Operations
 *
 * Watches .claude/.inbox/ for incoming messages and processes them.
 * Messages are typically created by n8n workflows from Slack.
 *
 * Usage:
 *   node .claude/scripts/process-inbox.js           # Process once
 *   node .claude/scripts/process-inbox.js --watch   # Watch mode
 *
 * Created: December 22, 2025
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories
const BASE_DIR = path.join(__dirname, '..');
const INBOX_DIR = path.join(BASE_DIR, '.inbox');
const PROCESSED_DIR = path.join(BASE_DIR, '.processed');
const OUTBOX_DIR = path.join(BASE_DIR, '.outbox');

// Ensure directories exist
[INBOX_DIR, PROCESSED_DIR, OUTBOX_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Admin token for Firebase Functions auth
// Set via: export YC_ADMIN_TOKEN=your-token
const ADMIN_TOKEN = process.env.YC_ADMIN_TOKEN || '';

/**
 * Send a Slack message via Firebase Function
 */
async function sendSlackMessage(channel, text, threadTs = null) {
  const payload = {
    channel: channel || 'D0A2KG1RSDU', // Default to DM channel
    message: text, // API expects 'message' not 'text'
    ...(threadTs && { threadTs: threadTs })
  };

  try {
    const response = await fetch(
      'https://us-central1-yellowcircle-app.cloudfunctions.net/sendSlackMessage',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': ADMIN_TOKEN
        },
        body: JSON.stringify(payload)
      }
    );
    const result = await response.json();
    if (result.success) {
      console.log('📤 Slack message sent:', result.ts || result.messageId);
    } else {
      console.error('⚠️ Slack API error:', result.error);
    }
    return result;
  } catch (error) {
    console.error('❌ Failed to send Slack message:', error.message);
    return null;
  }
}

/**
 * Create an outbox file for deferred Slack message
 */
function queueSlackMessage(channel, text, threadTs = null) {
  const filename = `slack_${Date.now()}.json`;
  const filepath = path.join(OUTBOX_DIR, filename);

  const message = {
    type: 'slack_message',
    channel: channel || 'D0A2KG1RSDU',
    text,
    thread_ts: threadTs,
    created_at: new Date().toISOString()
  };

  fs.writeFileSync(filepath, JSON.stringify(message, null, 2));
  console.log(`📝 Queued Slack message: ${filename}`);
  return filename;
}

/**
 * Process a single inbox file
 */
async function processFile(filepath) {
  const filename = path.basename(filepath);
  console.log(`\n📨 Processing: ${filename}`);

  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const message = JSON.parse(content);

    console.log(`   Type: ${message.type}`);
    console.log(`   Source: ${message.source?.channel || 'unknown'}`);

    let response = null;

    switch (message.type) {
      case 'slack_message':
        response = await handleSlackMessage(message);
        break;

      case 'command':
        response = await handleCommand(message);
        break;

      case 'investigation_request':
        response = await handleInvestigationRequest(message);
        break;

      default:
        console.log(`   ⚠️ Unknown message type: ${message.type}`);
        response = { status: 'skipped', reason: 'unknown_type' };
    }

    // Add processing metadata
    message.processed_at = new Date().toISOString();
    message.response = response;

    // Move to processed
    const processedPath = path.join(PROCESSED_DIR, filename);
    fs.writeFileSync(processedPath, JSON.stringify(message, null, 2));
    fs.unlinkSync(filepath);

    console.log(`   ✅ Processed and moved to .processed/`);
    return response;

  } catch (error) {
    console.error(`   ❌ Error processing ${filename}:`, error.message);

    // Move to processed with error
    const errorPath = path.join(PROCESSED_DIR, `error_${filename}`);
    const errorContent = {
      original_file: filename,
      error: error.message,
      stack: error.stack,
      processed_at: new Date().toISOString()
    };
    fs.writeFileSync(errorPath, JSON.stringify(errorContent, null, 2));

    // Try to remove original
    try { fs.unlinkSync(filepath); } catch (e) {}

    return { status: 'error', error: error.message };
  }
}

/**
 * Handle incoming Slack messages
 */
async function handleSlackMessage(message) {
  const { source, content } = message;
  const text = content?.text || '';
  const channel = source?.channel;
  const threadTs = source?.thread_ts;

  console.log(`   📝 Message: "${text.substring(0, 50)}..."`);

  // Parse commands from message
  const lowerText = text.toLowerCase();

  if (lowerText.includes('status') || lowerText.includes('report')) {
    // Send status update
    const status = getSystemStatus();
    await sendSlackMessage(channel, status, threadTs);
    return { action: 'status_sent', status };
  }

  if (lowerText.includes('stop') || lowerText.includes('pause')) {
    // Create stop signal file
    fs.writeFileSync(path.join(BASE_DIR, '.stop'), new Date().toISOString());
    await sendSlackMessage(channel, '⏹️ Stop signal received. Operations will pause at next checkpoint.', threadTs);
    return { action: 'stop_requested' };
  }

  if (lowerText.includes('resume') || lowerText.includes('continue')) {
    // Remove stop signal
    const stopFile = path.join(BASE_DIR, '.stop');
    if (fs.existsSync(stopFile)) fs.unlinkSync(stopFile);
    await sendSlackMessage(channel, '▶️ Resuming operations.', threadTs);
    return { action: 'resumed' };
  }

  if (lowerText.includes('investigate') || lowerText.includes('check')) {
    await sendSlackMessage(channel, '🔍 Starting investigation...', threadTs);
    return { action: 'investigation_queued', query: text };
  }

  // Default: acknowledge receipt
  await sendSlackMessage(
    channel,
    `📥 Message received. Available commands:\n• status - Get system status\n• stop/pause - Pause operations\n• resume - Resume operations\n• investigate [topic] - Start investigation`,
    threadTs
  );

  return { action: 'acknowledged' };
}

/**
 * Handle direct commands
 */
async function handleCommand(message) {
  const { command, args } = message;

  switch (command) {
    case 'git_status':
      const status = execSync('git status --short', { cwd: path.join(BASE_DIR, '..') }).toString();
      return { output: status };

    case 'build':
      try {
        execSync('npm run build', { cwd: path.join(BASE_DIR, '..') });
        return { status: 'success' };
      } catch (e) {
        return { status: 'failed', error: e.message };
      }

    case 'deploy':
      try {
        execSync('firebase deploy --only hosting', { cwd: path.join(BASE_DIR, '..') });
        return { status: 'deployed' };
      } catch (e) {
        return { status: 'failed', error: e.message };
      }

    default:
      return { status: 'unknown_command', command };
  }
}

/**
 * Handle investigation requests
 */
async function handleInvestigationRequest(message) {
  const { scope, priorities } = message;

  // This would integrate with Claude Code for actual investigation
  // For now, just acknowledge
  return {
    status: 'queued',
    scope,
    priorities,
    note: 'Investigation will be handled by Sleepless Agent'
  };
}

/**
 * Get current system status
 */
function getSystemStatus() {
  const gitStatus = execSync('git status --short', { cwd: path.join(BASE_DIR, '..') }).toString().trim();
  const branch = execSync('git branch --show-current', { cwd: path.join(BASE_DIR, '..') }).toString().trim();
  const lastCommit = execSync('git log -1 --format="%h %s"', { cwd: path.join(BASE_DIR, '..') }).toString().trim();

  const inboxCount = fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.json')).length;
  const processedCount = fs.readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.json')).length;

  const stopFile = path.join(BASE_DIR, '.stop');
  const isPaused = fs.existsSync(stopFile);

  return `📊 *System Status*
• Branch: \`${branch}\`
• Last commit: \`${lastCommit}\`
• Uncommitted changes: ${gitStatus || 'None'}
• Inbox: ${inboxCount} pending
• Processed: ${processedCount} total
• Status: ${isPaused ? '⏸️ PAUSED' : '▶️ RUNNING'}
• Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST`;
}

/**
 * Check for stop signal
 */
function shouldStop() {
  return fs.existsSync(path.join(BASE_DIR, '.stop'));
}

/**
 * Process all files in inbox
 */
async function processInbox() {
  const files = fs.readdirSync(INBOX_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(INBOX_DIR, f));

  if (files.length === 0) {
    console.log('📭 Inbox empty');
    return [];
  }

  console.log(`📬 Found ${files.length} message(s) in inbox`);

  const results = [];
  for (const file of files) {
    if (shouldStop()) {
      console.log('⏹️ Stop signal detected, pausing...');
      break;
    }
    results.push(await processFile(file));
  }

  return results;
}

/**
 * Watch mode - continuously monitor inbox
 */
function watchMode() {
  console.log('👀 Watching inbox for new messages...');
  console.log(`   Inbox: ${INBOX_DIR}`);
  console.log('   Press Ctrl+C to stop\n');

  // Initial check
  processInbox();

  // Watch for changes
  fs.watch(INBOX_DIR, { persistent: true }, async (eventType, filename) => {
    if (filename && filename.endsWith('.json') && eventType === 'rename') {
      const filepath = path.join(INBOX_DIR, filename);
      if (fs.existsSync(filepath)) {
        // Small delay to ensure file is fully written
        await new Promise(r => setTimeout(r, 500));
        await processFile(filepath);
      }
    }
  });
}

/**
 * Send outbox messages
 */
async function processOutbox() {
  const files = fs.readdirSync(OUTBOX_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(OUTBOX_DIR, f));

  if (files.length === 0) return;

  console.log(`\n📤 Sending ${files.length} queued message(s)...`);

  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(file, 'utf8'));

      if (content.type === 'slack_message') {
        await sendSlackMessage(content.channel, content.text, content.thread_ts);
      }

      // Move to processed
      const filename = path.basename(file);
      fs.renameSync(file, path.join(PROCESSED_DIR, `sent_${filename}`));

    } catch (error) {
      console.error(`❌ Failed to send ${path.basename(file)}:`, error.message);
    }
  }
}

// Main execution
async function main() {
  console.log('🤖 Claude Code Inbox Processor');
  console.log('================================\n');

  const args = process.argv.slice(2);

  if (args.includes('--watch') || args.includes('-w')) {
    watchMode();
  } else if (args.includes('--status') || args.includes('-s')) {
    console.log(getSystemStatus());
  } else if (args.includes('--outbox') || args.includes('-o')) {
    await processOutbox();
  } else {
    // Single run
    await processInbox();
    await processOutbox();
  }
}

main().catch(console.error);
