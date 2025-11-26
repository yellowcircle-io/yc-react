#!/usr/bin/env node

/**
 * yellowCircle Outreach - Email Sender
 *
 * Usage:
 *   node scripts/send.js --preview           # Preview pending emails
 *   node scripts/send.js --stage initial     # Send initial emails
 *   node scripts/send.js --stage followups   # Send due follow-ups
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Sender = require('../lib/sender');

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].replace('--', '');
    options[key] = args[i + 1] || true;
    if (args[i + 1] && !args[i + 1].startsWith('--')) i++;
  }
}

const OUTPUT_DIR = path.join(__dirname, '../output');
const DATA_DIR = path.join(__dirname, '../data');
const SENT_LOG = path.join(DATA_DIR, 'sent.json');

// Load all pending emails
function loadPendingEmails() {
  if (!fs.existsSync(OUTPUT_DIR)) return [];

  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
  const emails = [];

  for (const file of files) {
    const filepath = path.join(OUTPUT_DIR, file);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    if (data.status === 'pending') {
      emails.push({
        ...data,
        filepath,
        filename: file
      });
    }
  }

  return emails;
}

// Update email status
function updateStatus(filepath, status, sentAt = null) {
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  data.status = status;
  if (sentAt) data.sentAt = sentAt;
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// Filter emails by stage and due date
function filterEmails(emails, stage) {
  const now = new Date();

  return emails.filter(email => {
    // Check stage
    if (stage === 'initial' && email.email.stage !== 'initial') return false;
    if (stage === 'followups' && email.email.stage === 'initial') return false;

    // Check if due
    const scheduledFor = new Date(email.scheduledFor);
    return scheduledFor <= now;
  });
}

// Preview mode
function previewEmails(emails) {
  console.log('\n📋 PENDING EMAILS\n');

  if (emails.length === 0) {
    console.log('No pending emails found.\n');
    return;
  }

  // Group by company
  const byCompany = {};
  for (const email of emails) {
    const company = email.prospect.company;
    if (!byCompany[company]) byCompany[company] = [];
    byCompany[company].push(email);
  }

  for (const [company, companyEmails] of Object.entries(byCompany)) {
    console.log(`\n${company}`);
    console.log('-'.repeat(40));

    for (const email of companyEmails) {
      const due = new Date(email.scheduledFor);
      const isOverdue = due < new Date();
      const status = isOverdue ? '⏰ DUE' : `📅 ${due.toLocaleDateString()}`;

      console.log(`  ${email.email.stage.padEnd(10)} | ${status}`);
      console.log(`  Subject: ${email.email.subject}`);
      console.log(`  To: ${email.prospect.email}`);
      console.log('');
    }
  }

  console.log(`Total: ${emails.length} pending emails\n`);
}

// Send mode
async function sendEmails(sender, emails) {
  console.log(`\n📤 SENDING ${emails.length} EMAILS\n`);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];

    console.log(`[${i + 1}/${emails.length}] ${email.prospect.company} (${email.email.stage})`);

    const result = await sender.send({
      to: email.prospect.email,
      subject: email.email.subject,
      body: email.email.body
    });

    if (result.success) {
      updateStatus(email.filepath, 'sent', result.sentAt);
      sent++;
    } else {
      updateStatus(email.filepath, 'failed');
      failed++;
    }

    // Rate limit
    if (i < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`✅ Sent: ${sent}  ❌ Failed: ${failed}`);
  console.log('═══════════════════════════════════════════\n');
}

// Main
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   yellowCircle Outreach Sender            ║');
  console.log('╚═══════════════════════════════════════════╝');

  const allPending = loadPendingEmails();

  if (options.preview || (!options.stage && !options.all)) {
    // Preview mode (default)
    previewEmails(allPending);
    console.log('Use --stage initial or --stage followups to send.\n');
    return;
  }

  // Filter by stage
  const toSend = options.all
    ? filterEmails(allPending, null)
    : filterEmails(allPending, options.stage);

  if (toSend.length === 0) {
    console.log('\n✓ No emails due to send.\n');
    return;
  }

  // Confirm
  console.log(`\n⚠️  About to send ${toSend.length} emails.\n`);

  // Initialize sender
  const sender = new Sender();
  await sender.testConnection();

  // Send
  await sendEmails(sender, toSend);
}

main().catch(console.error);
