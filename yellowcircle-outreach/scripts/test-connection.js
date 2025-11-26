#!/usr/bin/env node

/**
 * yellowCircle Outreach - Test Connections
 *
 * Tests AI provider and email sender connections.
 */

require('dotenv').config();
const Generator = require('../lib/generator');
const Sender = require('../lib/sender');

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   yellowCircle Connection Test            ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');

  // Test AI provider
  console.log('1. AI Provider');
  console.log('───────────────────────────────────────────');

  try {
    const generator = new Generator();
    console.log(`   Provider: ${generator.provider}`);
    console.log(`   Model: ${generator.model}`);

    const connected = await generator.testConnection();

    if (connected) {
      console.log('   Status: ✅ Connected\n');
    } else {
      console.log('   Status: ❌ Failed\n');
    }
  } catch (error) {
    console.log(`   Status: ❌ ${error.message}\n`);
  }

  // Test email sender
  console.log('2. Email Sender (Resend)');
  console.log('───────────────────────────────────────────');

  try {
    const sender = new Sender();

    if (!process.env.RESEND_API_KEY) {
      console.log('   Status: ⚠️  Not configured (optional)');
      console.log('   Set RESEND_API_KEY in .env to enable sending\n');
    } else {
      console.log(`   From: ${sender.fromEmail}`);
      await sender.testConnection();
      console.log('   Status: ✅ Configured\n');
    }
  } catch (error) {
    console.log(`   Status: ❌ ${error.message}\n`);
  }

  // Environment summary
  console.log('3. Environment');
  console.log('───────────────────────────────────────────');
  console.log(`   LLM_PROVIDER: ${process.env.LLM_PROVIDER || 'groq (default)'}`);
  console.log(`   GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✓ Set' : '○ Not set'}`);
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✓ Set' : '○ Not set'}`);
  console.log(`   CALENDAR_LINK: ${process.env.CALENDAR_LINK ? '✓ Set' : '○ Not set'}`);
  console.log(`   ARTICLE_LINK: ${process.env.ARTICLE_LINK ? '✓ Set' : '○ Not set'}`);
  console.log('');

  console.log('═══════════════════════════════════════════');
  console.log('Ready to generate emails!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Add prospects to data/targets.csv');
  console.log('  2. Run: npm run generate:batch');
  console.log('  3. Review emails in output/');
  console.log('  4. Run: npm run send --stage initial');
  console.log('═══════════════════════════════════════════\n');
}

main().catch(console.error);
