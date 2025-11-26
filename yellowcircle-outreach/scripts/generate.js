#!/usr/bin/env node

/**
 * yellowCircle Outreach - Email Generator
 *
 * Usage:
 *   node scripts/generate.js --company "Acme" --contact "Jane" --email "jane@acme.com"
 *   node scripts/generate.js --batch data/targets.csv
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const Generator = require('../lib/generator');

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].replace('--', '');
    options[key] = args[i + 1];
    i++;
  }
}

// Directories
const OUTPUT_DIR = path.join(__dirname, '../output');
const DATA_DIR = path.join(__dirname, '../data');
const SENT_LOG = path.join(DATA_DIR, 'sent.json');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Load/save sent log
function loadSentLog() {
  if (fs.existsSync(SENT_LOG)) {
    return JSON.parse(fs.readFileSync(SENT_LOG, 'utf8'));
  }
  return { prospects: [], lastUpdated: null };
}

function saveSentLog(log) {
  log.lastUpdated = new Date().toISOString();
  fs.writeFileSync(SENT_LOG, JSON.stringify(log, null, 2));
}

// Save generated email
function saveEmail(prospect, email) {
  const slug = prospect.company.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `${slug}_${email.stage}_${Date.now()}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  const output = {
    prospect: {
      company: prospect.company,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email,
      title: prospect.title,
      industry: prospect.industry,
      trigger: prospect.trigger
    },
    email: {
      stage: email.stage,
      day: email.day,
      subject: email.subject,
      body: email.body,
      generatedAt: email.generatedAt
    },
    status: 'pending',
    scheduledFor: getScheduledDate(email.day)
  };

  fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
  console.log(`    → Saved: ${filename}`);

  return output;
}

function getScheduledDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

// Process single prospect
async function processProspect(generator, prospect) {
  console.log(`\n📧 ${prospect.company}`);

  try {
    const sequence = await generator.generateSequence(prospect);

    const results = [];
    for (const email of sequence) {
      const saved = saveEmail(prospect, email);
      results.push(saved);
    }

    return results;

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return null;
  }
}

// Process batch from CSV
async function processBatch(generator, csvPath) {
  console.log(`\n📂 Loading: ${csvPath}`);

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`   Found ${records.length} prospects`);

  const sentLog = loadSentLog();
  const results = [];

  for (const record of records) {
    // Map CSV columns
    const prospect = {
      company: record.company || record.Company,
      firstName: record.first_name || record.firstName || record.contact?.split(' ')[0],
      lastName: record.last_name || record.lastName,
      email: record.email || record.Email,
      title: record.title || record.Title,
      industry: record.industry || record.Industry || 'B2B',
      trigger: record.trigger || record.Trigger || '',
      triggerDetails: record.trigger_details || record.triggerDetails || ''
    };

    // Skip if already processed
    const existing = sentLog.prospects.find(p => p.email === prospect.email);
    if (existing) {
      console.log(`\n⏭ Skipping ${prospect.company} (already processed)`);
      continue;
    }

    const result = await processProspect(generator, prospect);

    if (result) {
      results.push(...result);
      sentLog.prospects.push({
        email: prospect.email,
        company: prospect.company,
        processedAt: new Date().toISOString()
      });
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  saveSentLog(sentLog);
  return results;
}

// Process single from CLI
async function processSingle(generator, options) {
  const prospect = {
    company: options.company,
    firstName: options.contact || options.firstName,
    lastName: options.lastName || '',
    email: options.email,
    title: options.title || '',
    industry: options.industry || 'B2B',
    trigger: options.trigger || '',
    triggerDetails: options.triggerDetails || ''
  };

  return processProspect(generator, prospect);
}

// Main
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   yellowCircle Outreach Generator         ║');
  console.log('╚═══════════════════════════════════════════╝');

  // Initialize generator
  const generator = new Generator();

  // Test connection
  console.log(`\n🔌 Testing ${generator.provider}...`);
  const connected = await generator.testConnection();

  if (!connected) {
    console.error('\n❌ Failed to connect. Check your API key in .env');
    process.exit(1);
  }

  let results;

  if (options.batch) {
    // Batch mode
    results = await processBatch(generator, options.batch);
  } else if (options.company && options.email) {
    // Single mode
    results = await processSingle(generator, options);
  } else {
    // Show help
    console.log(`
Usage:

  Single prospect:
    node scripts/generate.js \\
      --company "Acme Corp" \\
      --contact "Jane" \\
      --email "jane@acme.com" \\
      --trigger "Series B funding" \\
      --triggerDetails "Announced $25M last week"

  Batch from CSV:
    node scripts/generate.js --batch data/targets.csv

Options:
  --company         Company name (required)
  --contact         First name (required)
  --email           Email address (required)
  --trigger         Personalization trigger
  --triggerDetails  Specific details
  --batch           Path to CSV file
  --preview         Preview only, don't save
`);
    process.exit(0);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`✅ Generated ${results?.length || 0} emails`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch(console.error);
