#!/usr/bin/env node

/**
 * Weekly Summary Script
 *
 * Generates weekly progress report from Notion database
 * Shows tasks completed, hours logged vs estimated, and next week's priorities
 *
 * Usage:
 *   node weekly-summary.js
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
const SUMMARY_FILE = path.join(REPO_ROOT, '.claude/shared-context/WEEKLY_SUMMARY.md');

/**
 * Generate weekly summary
 */
async function generateWeeklySummary() {
  console.log('📊 Generating weekly summary...\n');

  const now = new Date();
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Query all tasks
  const response = await notion.databases.query({
    database_id: ROADMAP_DB_ID,
  });

  const summary = {
    completedThisWeek: [],
    inProgress: [],
    notStarted: [],
    blocked: [],
    totalEstimatedHours: 0,
    totalCompletedHours: 0,
    byCategory: {},
    byPriority: {},
  };

  for (const page of response.results) {
    const title = page.properties.Feature?.title?.[0]?.text?.content || '';
    const status = page.properties.Status?.select?.name || 'Not Started';
    const priority = page.properties.Priority?.select?.name || 'P2';
    const category = page.properties.Category?.select?.name || 'Unknown';
    const estimatedHours = page.properties['Estimated Hours']?.number || 0;
    const lastEdited = new Date(page.last_edited_time);

    const taskData = {
      title,
      status,
      priority,
      category,
      estimatedHours,
      lastEdited: lastEdited.toLocaleString(),
    };

    // Track by category
    if (!summary.byCategory[category]) {
      summary.byCategory[category] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        blocked: 0,
      };
    }
    summary.byCategory[category].total++;

    // Track by priority
    if (!summary.byPriority[priority]) {
      summary.byPriority[priority] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        blocked: 0,
      };
    }
    summary.byPriority[priority].total++;

    // Add to total estimated hours
    summary.totalEstimatedHours += estimatedHours;

    // Categorize tasks
    if (status === 'Complete') {
      // Check if completed this week
      if (lastEdited >= oneWeekAgo) {
        summary.completedThisWeek.push(taskData);
        summary.totalCompletedHours += estimatedHours;
      }
      summary.byCategory[category].completed++;
      summary.byPriority[priority].completed++;
    } else if (status === 'In Progress') {
      summary.inProgress.push(taskData);
      summary.byCategory[category].inProgress++;
      summary.byPriority[priority].inProgress++;
    } else if (status === 'Blocked') {
      summary.blocked.push(taskData);
      summary.byCategory[category].blocked++;
      summary.byPriority[priority].blocked++;
    } else {
      summary.notStarted.push(taskData);
      summary.byCategory[category].notStarted++;
      summary.byPriority[priority].notStarted++;
    }
  }

  return summary;
}

/**
 * Create summary file
 */
function createSummaryFile(summary) {
  const now = new Date();
  const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);

  let content = `# Weekly Summary\n\n`;
  content += `**Week of:** ${weekStart.toLocaleDateString()} - ${now.toLocaleDateString()}\n`;
  content += `**Generated:** ${now.toLocaleString()}\n\n`;

  content += `---\n\n`;

  // Overall metrics
  content += `## 📈 Overall Metrics\n\n`;
  content += `- **Tasks Completed This Week:** ${summary.completedThisWeek.length}\n`;
  content += `- **Currently In Progress:** ${summary.inProgress.length}\n`;
  content += `- **Blocked:** ${summary.blocked.length}\n`;
  content += `- **Not Started:** ${summary.notStarted.length}\n`;
  content += `- **Hours Completed This Week:** ${summary.totalCompletedHours}h\n`;
  content += `- **Total Estimated Hours (All Tasks):** ${summary.totalEstimatedHours}h\n\n`;

  // Completed this week
  if (summary.completedThisWeek.length > 0) {
    content += `## ✅ Completed This Week (${summary.completedThisWeek.length})\n\n`;
    summary.completedThisWeek.forEach(task => {
      content += `### ${task.title}\n`;
      content += `- **Priority:** ${task.priority}\n`;
      content += `- **Category:** ${task.category}\n`;
      content += `- **Estimated Hours:** ${task.estimatedHours}h\n`;
      content += `- **Completed:** ${task.lastEdited}\n\n`;
    });
  }

  // In progress
  if (summary.inProgress.length > 0) {
    content += `## 🔄 In Progress (${summary.inProgress.length})\n\n`;
    summary.inProgress.forEach(task => {
      content += `- [${task.priority}] ${task.title} (${task.category})\n`;
    });
    content += `\n`;
  }

  // Blocked tasks
  if (summary.blocked.length > 0) {
    content += `## 🚨 Blocked (${summary.blocked.length})\n\n`;
    summary.blocked.forEach(task => {
      content += `- [${task.priority}] ${task.title} (${task.category})\n`;
    });
    content += `\n`;
  }

  // By category
  content += `## 📊 By Category\n\n`;
  Object.entries(summary.byCategory).forEach(([category, stats]) => {
    content += `### ${category}\n`;
    content += `- Total: ${stats.total}\n`;
    content += `- ✅ Completed: ${stats.completed}\n`;
    content += `- 🔄 In Progress: ${stats.inProgress}\n`;
    content += `- ⏸️ Not Started: ${stats.notStarted}\n`;
    content += `- 🚨 Blocked: ${stats.blocked}\n\n`;
  });

  // By priority
  content += `## 🎯 By Priority\n\n`;
  ['P0', 'P1', 'P2', 'P3'].forEach(priority => {
    const stats = summary.byPriority[priority];
    if (stats) {
      content += `### ${priority}\n`;
      content += `- Total: ${stats.total}\n`;
      content += `- ✅ Completed: ${stats.completed}\n`;
      content += `- 🔄 In Progress: ${stats.inProgress}\n`;
      content += `- ⏸️ Not Started: ${stats.notStarted}\n`;
      content += `- 🚨 Blocked: ${stats.blocked}\n\n`;
    }
  });

  // Next week's priorities
  content += `## 📅 Next Week's Priorities\n\n`;
  content += `Based on current task list, focus on:\n\n`;

  // Get top P0 and P1 tasks not started or in progress
  const priorities = [...summary.notStarted, ...summary.inProgress]
    .filter(task => task.priority === 'P0' || task.priority === 'P1')
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority.localeCompare(b.priority);
      }
      return 0;
    })
    .slice(0, 5);

  if (priorities.length > 0) {
    priorities.forEach((task, index) => {
      content += `${index + 1}. [${task.priority}] ${task.title} (${task.category})\n`;
    });
  } else {
    content += `All high-priority tasks are complete! Review P2/P3 tasks or plan new work.\n`;
  }

  content += `\n---\n\n`;
  content += `*Generated automatically by yellowCircle automation*\n`;

  // Write to file
  fs.writeFileSync(SUMMARY_FILE, content);
  console.log(`\n📝 Summary file created: ${SUMMARY_FILE}`);
}

/**
 * Log summary to console
 */
function logSummary(summary) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 WEEKLY SUMMARY');
  console.log('='.repeat(60));

  console.log(`\n✅ Completed This Week: ${summary.completedThisWeek.length} tasks`);
  console.log(`🔄 In Progress: ${summary.inProgress.length} tasks`);
  console.log(`🚨 Blocked: ${summary.blocked.length} tasks`);
  console.log(`⏸️  Not Started: ${summary.notStarted.length} tasks`);
  console.log(`\n⏱️  Hours:`);
  console.log(`   Completed this week: ${summary.totalCompletedHours}h`);
  console.log(`   Total estimated: ${summary.totalEstimatedHours}h`);

  if (summary.completedThisWeek.length > 0) {
    console.log(`\n🎉 Top Achievements:`);
    summary.completedThisWeek.slice(0, 3).forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title} (${task.estimatedHours}h)`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Weekly Summary Script\n');

  // Validate environment variables
  if (!process.env.NOTION_API_KEY) {
    console.error('❌ Error: NOTION_API_KEY environment variable not set');
    process.exit(1);
  }

  if (!process.env.NOTION_ROADMAP_DB_ID) {
    console.error('❌ Error: NOTION_ROADMAP_DB_ID environment variable not set');
    process.exit(1);
  }

  // Generate summary
  const summary = await generateWeeklySummary();

  // Create summary file
  createSummaryFile(summary);

  // Log summary
  logSummary(summary);

  console.log('\n✅ Weekly summary complete!\n');
}

// Run script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
