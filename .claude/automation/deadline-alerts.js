#!/usr/bin/env node

/**
 * Deadline Alerts Script
 *
 * Checks Notion database for tasks due within 24 hours and creates alerts
 *
 * Usage:
 *   node deadline-alerts.js
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
const ALERTS_FILE = path.join(REPO_ROOT, '.claude/shared-context/DEADLINE_ALERTS.md');

/**
 * Check for tasks due within 24 hours
 */
async function checkDeadlines() {
  console.log('📅 Checking for upcoming deadlines...\n');

  // Calculate tomorrow's date
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Query Notion database
  const response = await notion.databases.query({
    database_id: ROADMAP_DB_ID,
    filter: {
      and: [
        {
          property: 'Status',
          select: {
            does_not_equal: 'Complete',
          },
        },
      ],
    },
  });

  const upcomingDeadlines = [];
  const overdueDeadlines = [];

  for (const page of response.results) {
    const title = page.properties.Feature?.title?.[0]?.text?.content || '';
    const dueDate = page.properties['Due Date']?.date?.start;
    const priority = page.properties.Priority?.select?.name || 'P2';
    const status = page.properties.Status?.select?.name || 'Not Started';
    const category = page.properties.Category?.select?.name || 'Unknown';

    if (!dueDate) continue;

    const due = new Date(dueDate);

    // Check if due within 24 hours
    if (due >= todayStart && due <= tomorrow) {
      upcomingDeadlines.push({
        title,
        dueDate: due.toLocaleDateString(),
        priority,
        status,
        category,
        hoursUntilDue: Math.round((due - now) / (1000 * 60 * 60)),
      });
    }

    // Check if overdue
    if (due < todayStart) {
      overdueDeadlines.push({
        title,
        dueDate: due.toLocaleDateString(),
        priority,
        status,
        category,
        daysOverdue: Math.ceil((now - due) / (1000 * 60 * 60 * 24)),
      });
    }
  }

  return { upcomingDeadlines, overdueDeadlines };
}

/**
 * Create alert file
 */
function createAlertFile(upcomingDeadlines, overdueDeadlines) {
  let content = `# Deadline Alerts\n\n`;
  content += `**Generated:** ${new Date().toLocaleString()}\n\n`;

  if (overdueDeadlines.length > 0) {
    content += `## 🚨 OVERDUE TASKS (${overdueDeadlines.length})\n\n`;
    overdueDeadlines.forEach(task => {
      content += `### ${task.title}\n`;
      content += `- **Priority:** ${task.priority}\n`;
      content += `- **Due Date:** ${task.dueDate} (${task.daysOverdue} days overdue)\n`;
      content += `- **Status:** ${task.status}\n`;
      content += `- **Category:** ${task.category}\n\n`;
    });
  }

  if (upcomingDeadlines.length > 0) {
    content += `## ⏰ DUE WITHIN 24 HOURS (${upcomingDeadlines.length})\n\n`;
    upcomingDeadlines.forEach(task => {
      content += `### ${task.title}\n`;
      content += `- **Priority:** ${task.priority}\n`;
      content += `- **Due Date:** ${task.dueDate} (${task.hoursUntilDue} hours)\n`;
      content += `- **Status:** ${task.status}\n`;
      content += `- **Category:** ${task.category}\n\n`;
    });
  }

  if (upcomingDeadlines.length === 0 && overdueDeadlines.length === 0) {
    content += `## ✅ No Urgent Deadlines\n\n`;
    content += `All tasks are on track! No deadlines in the next 24 hours.\n`;
  }

  // Write to file
  fs.writeFileSync(ALERTS_FILE, content);
  console.log(`\n📝 Alert file created: ${ALERTS_FILE}`);
}

/**
 * Log summary to console
 */
function logSummary(upcomingDeadlines, overdueDeadlines) {
  console.log('\n' + '='.repeat(60));
  console.log('⏰ DEADLINE ALERTS SUMMARY');
  console.log('='.repeat(60));

  if (overdueDeadlines.length > 0) {
    console.log(`\n🚨 OVERDUE: ${overdueDeadlines.length} tasks`);
    overdueDeadlines.forEach(task => {
      console.log(`  • [${task.priority}] ${task.title} (${task.daysOverdue} days overdue)`);
    });
  }

  if (upcomingDeadlines.length > 0) {
    console.log(`\n⏰ DUE SOON: ${upcomingDeadlines.length} tasks`);
    upcomingDeadlines.forEach(task => {
      console.log(`  • [${task.priority}] ${task.title} (${task.hoursUntilDue}h remaining)`);
    });
  }

  if (upcomingDeadlines.length === 0 && overdueDeadlines.length === 0) {
    console.log('\n✅ No urgent deadlines - all tasks on track!');
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Deadline Alerts Script\n');

  // Validate environment variables
  if (!process.env.NOTION_API_KEY) {
    console.error('❌ Error: NOTION_API_KEY environment variable not set');
    process.exit(1);
  }

  if (!process.env.NOTION_ROADMAP_DB_ID) {
    console.error('❌ Error: NOTION_ROADMAP_DB_ID environment variable not set');
    process.exit(1);
  }

  // Check deadlines
  const { upcomingDeadlines, overdueDeadlines } = await checkDeadlines();

  // Create alert file
  createAlertFile(upcomingDeadlines, overdueDeadlines);

  // Log summary
  logSummary(upcomingDeadlines, overdueDeadlines);

  console.log('\n✅ Deadline check complete!\n');
}

// Run script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
