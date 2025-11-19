#!/usr/bin/env node

/**
 * Blocked Tasks Alert Script
 *
 * Checks Notion database for tasks blocked >48 hours
 *
 * Usage:
 *   node blocked-tasks-alert.js
 *
 * Environment variables required:
 *   NOTION_API_KEY - Notion integration token
 *   NOTION_ROADMAP_DB_ID - Database ID for yellowCircle Roadmap
 */

require('dotenv').config();

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const ROADMAP_DB_ID = process.env.NOTION_ROADMAP_DB_ID;
const REPO_ROOT = path.join(__dirname, '../..');
const ALERTS_FILE = path.join(REPO_ROOT, '.claude/shared-context/BLOCKED_TASKS_ALERTS.md');

/**
 * Check for tasks blocked >48 hours
 */
async function checkBlockedTasks() {
  console.log('🚧 Checking for blocked tasks...\n');

  const now = new Date();
  const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);

  // Query Notion database for blocked tasks
  const response = await notion.databases.query({
    database_id: ROADMAP_DB_ID,
    filter: {
      property: 'Status',
      select: {
        equals: 'Blocked',
      },
    },
  });

  const blockedTasks = [];
  const recentlyBlocked = [];

  for (const page of response.results) {
    const title = page.properties.Feature?.title?.[0]?.text?.content || '';
    const priority = page.properties.Priority?.select?.name || 'P2';
    const category = page.properties.Category?.select?.name || 'Unknown';
    const lastEdited = new Date(page.last_edited_time);
    const description = page.properties.Description?.rich_text?.[0]?.text?.content || '';

    const hoursBlocked = Math.round((now - lastEdited) / (1000 * 60 * 60));
    const daysBlocked = Math.round(hoursBlocked / 24);

    const taskData = {
      title,
      priority,
      category,
      description,
      lastEdited: lastEdited.toLocaleString(),
      hoursBlocked,
      daysBlocked,
    };

    if (lastEdited < fortyEightHoursAgo) {
      blockedTasks.push(taskData);
    } else {
      recentlyBlocked.push(taskData);
    }
  }

  return { blockedTasks, recentlyBlocked };
}

/**
 * Create alert file
 */
function createAlertFile(blockedTasks, recentlyBlocked) {
  let content = `# Blocked Tasks Alert\n\n`;
  content += `**Generated:** ${new Date().toLocaleString()}\n\n`;

  if (blockedTasks.length > 0) {
    content += `## 🚨 BLOCKED >48 HOURS (${blockedTasks.length})\n\n`;
    content += `These tasks have been blocked for more than 48 hours and need attention:\n\n`;

    blockedTasks.forEach(task => {
      content += `### ${task.title}\n`;
      content += `- **Priority:** ${task.priority}\n`;
      content += `- **Category:** ${task.category}\n`;
      content += `- **Blocked for:** ${task.daysBlocked} days (${task.hoursBlocked} hours)\n`;
      content += `- **Last edited:** ${task.lastEdited}\n`;
      if (task.description) {
        content += `- **Description:** ${task.description.substring(0, 200)}${task.description.length > 200 ? '...' : ''}\n`;
      }
      content += `\n**Action Required:** Unblock or defer this task\n\n`;
    });
  }

  if (recentlyBlocked.length > 0) {
    content += `## ⚠️ RECENTLY BLOCKED (<48 hours) (${recentlyBlocked.length})\n\n`;
    recentlyBlocked.forEach(task => {
      content += `### ${task.title}\n`;
      content += `- **Priority:** ${task.priority}\n`;
      content += `- **Category:** ${task.category}\n`;
      content += `- **Blocked for:** ${task.hoursBlocked} hours\n\n`;
    });
  }

  if (blockedTasks.length === 0 && recentlyBlocked.length === 0) {
    content += `## ✅ No Blocked Tasks\n\n`;
    content += `Great! No tasks are currently blocked.\n`;
  }

  // Write to file
  fs.writeFileSync(ALERTS_FILE, content);
  console.log(`\n📝 Alert file created: ${ALERTS_FILE}`);
}

/**
 * Log summary to console
 */
function logSummary(blockedTasks, recentlyBlocked) {
  console.log('\n' + '='.repeat(60));
  console.log('🚧 BLOCKED TASKS SUMMARY');
  console.log('='.repeat(60));

  if (blockedTasks.length > 0) {
    console.log(`\n🚨 BLOCKED >48 HOURS: ${blockedTasks.length} tasks\n`);
    blockedTasks.forEach(task => {
      console.log(`  • [${task.priority}] ${task.title}`);
      console.log(`    Blocked for: ${task.daysBlocked} days (${task.hoursBlocked} hours)`);
      console.log(`    Category: ${task.category}`);
      console.log('');
    });
  }

  if (recentlyBlocked.length > 0) {
    console.log(`⚠️  RECENTLY BLOCKED: ${recentlyBlocked.length} tasks\n`);
    recentlyBlocked.forEach(task => {
      console.log(`  • [${task.priority}] ${task.title} (${task.hoursBlocked}h)`);
    });
  }

  if (blockedTasks.length === 0 && recentlyBlocked.length === 0) {
    console.log('\n✅ No blocked tasks - smooth sailing!');
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Blocked Tasks Alert Script\n');

  // Validate environment variables
  if (!process.env.NOTION_API_KEY) {
    console.error('❌ Error: NOTION_API_KEY environment variable not set');
    process.exit(1);
  }

  if (!process.env.NOTION_ROADMAP_DB_ID) {
    console.error('❌ Error: NOTION_ROADMAP_DB_ID environment variable not set');
    process.exit(1);
  }

  // Check blocked tasks
  const { blockedTasks, recentlyBlocked } = await checkBlockedTasks();

  // Create alert file
  createAlertFile(blockedTasks, recentlyBlocked);

  // Log summary
  logSummary(blockedTasks, recentlyBlocked);

  console.log('\n✅ Blocked tasks check complete!\n');
}

// Run script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
