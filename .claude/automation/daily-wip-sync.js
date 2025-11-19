#!/usr/bin/env node

/**
 * Daily WIP Sync Script
 *
 * Reads WIP_CURRENT_CRITICAL.md and updates Notion database with current status
 * Generates daily summary of tasks in progress
 *
 * Usage:
 *   node daily-wip-sync.js
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
const WIP_FILE = path.join(REPO_ROOT, '.claude/shared-context/WIP_CURRENT_CRITICAL.md');

/**
 * Parse WIP file to extract current status
 */
function parseWIPFile() {
  if (!fs.existsSync(WIP_FILE)) {
    console.log('⚠️  WIP file not found:', WIP_FILE);
    return null;
  }

  const content = fs.readFileSync(WIP_FILE, 'utf-8');
  const lines = content.split('\n');

  const wipData = {
    updated: null,
    status: null,
    currentWork: [],
    completedTasks: [],
    nextSteps: [],
    blockers: [],
  };

  // Extract update timestamp
  const updatedMatch = content.match(/\*\*Updated:\*\*\s*(.+)/);
  if (updatedMatch) {
    wipData.updated = updatedMatch[1].trim();
  }

  // Extract status
  const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
  if (statusMatch) {
    wipData.status = statusMatch[1].trim();
  }

  // Extract sections
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect sections
    if (line.includes('CURRENT WORK') || line.includes('IN PROGRESS')) {
      currentSection = 'currentWork';
    } else if (line.includes('COMPLETED') || line.includes('DONE')) {
      currentSection = 'completed';
    } else if (line.includes('NEXT STEPS') || line.includes('TODO')) {
      currentSection = 'nextSteps';
    } else if (line.includes('BLOCKER') || line.includes('BLOCKED')) {
      currentSection = 'blockers';
    }

    // Extract bullet points
    if (line.match(/^[-*]\s+/) || line.match(/^\d+\.\s+/)) {
      const taskText = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim();

      if (currentSection === 'currentWork') {
        wipData.currentWork.push(taskText);
      } else if (currentSection === 'completed') {
        wipData.completedTasks.push(taskText);
      } else if (currentSection === 'nextSteps') {
        wipData.nextSteps.push(taskText);
      } else if (currentSection === 'blockers') {
        wipData.blockers.push(taskText);
      }
    }

    // Extract tasks with status markers
    if (line.includes('🔴') || line.includes('IN PROGRESS')) {
      const taskText = line.replace(/🔴/g, '').replace(/IN PROGRESS/g, '').trim();
      if (taskText && !wipData.currentWork.includes(taskText)) {
        wipData.currentWork.push(taskText);
      }
    }

    if (line.includes('✅') || line.includes('COMPLETE')) {
      const taskText = line.replace(/✅/g, '').replace(/COMPLETE/g, '').trim();
      if (taskText && !wipData.completedTasks.includes(taskText)) {
        wipData.completedTasks.push(taskText);
      }
    }
  }

  return wipData;
}

/**
 * Update Notion database with WIP status
 */
async function updateNotionTasks(wipData) {
  console.log('📊 Updating Notion database with WIP status...\n');

  // Query all tasks to update their status
  const response = await notion.databases.query({
    database_id: ROADMAP_DB_ID,
  });

  let updatedCount = 0;
  let completedCount = 0;
  let inProgressCount = 0;

  for (const page of response.results) {
    const title = page.properties.Feature?.title?.[0]?.text?.content || '';

    if (!title) continue;

    // Check if task is mentioned in WIP
    const isInProgress = wipData.currentWork.some(task =>
      title.toLowerCase().includes(task.toLowerCase().substring(0, 20)) ||
      task.toLowerCase().includes(title.toLowerCase().substring(0, 20))
    );

    const isCompleted = wipData.completedTasks.some(task =>
      title.toLowerCase().includes(task.toLowerCase().substring(0, 20)) ||
      task.toLowerCase().includes(title.toLowerCase().substring(0, 20))
    );

    // Update status if changed
    const currentStatus = page.properties.Status?.select?.name;
    let newStatus = currentStatus;

    if (isCompleted && currentStatus !== 'Complete') {
      newStatus = 'Complete';
      completedCount++;
    } else if (isInProgress && currentStatus !== 'In Progress') {
      newStatus = 'In Progress';
      inProgressCount++;
    }

    if (newStatus !== currentStatus) {
      await notion.pages.update({
        page_id: page.id,
        properties: {
          Status: {
            select: {
              name: newStatus,
            },
          },
        },
      });
      console.log(`  ✅ Updated: ${title} → ${newStatus}`);
      updatedCount++;
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`  Total tasks updated: ${updatedCount}`);
  console.log(`  Marked complete: ${completedCount}`);
  console.log(`  Marked in progress: ${inProgressCount}`);

  return { updatedCount, completedCount, inProgressCount };
}

/**
 * Generate and log daily summary
 */
function generateDailySummary(wipData, updateStats) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 DAILY WIP SUMMARY');
  console.log('='.repeat(60));

  console.log(`\n🕐 Last Updated: ${wipData.updated || 'Unknown'}`);
  console.log(`📊 Status: ${wipData.status || 'Not specified'}`);

  if (wipData.currentWork.length > 0) {
    console.log(`\n🔴 In Progress (${wipData.currentWork.length}):`);
    wipData.currentWork.forEach(task => console.log(`  • ${task}`));
  }

  if (wipData.completedTasks.length > 0) {
    console.log(`\n✅ Completed (${wipData.completedTasks.length}):`);
    wipData.completedTasks.forEach(task => console.log(`  • ${task}`));
  }

  if (wipData.blockers.length > 0) {
    console.log(`\n🚨 Blockers (${wipData.blockers.length}):`);
    wipData.blockers.forEach(blocker => console.log(`  • ${blocker}`));
  }

  if (wipData.nextSteps.length > 0) {
    console.log(`\n📝 Next Steps (${wipData.nextSteps.length}):`);
    wipData.nextSteps.forEach(step => console.log(`  • ${step}`));
  }

  console.log(`\n💾 Notion Database Updates:`);
  console.log(`  Total updated: ${updateStats.updatedCount}`);
  console.log(`  Completed: ${updateStats.completedCount}`);
  console.log(`  In Progress: ${updateStats.inProgressCount}`);

  console.log('\n' + '='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Daily WIP Sync Script\n');

  // Validate environment variables
  if (!process.env.NOTION_API_KEY) {
    console.error('❌ Error: NOTION_API_KEY environment variable not set');
    process.exit(1);
  }

  if (!process.env.NOTION_ROADMAP_DB_ID) {
    console.error('❌ Error: NOTION_ROADMAP_DB_ID environment variable not set');
    process.exit(1);
  }

  // Parse WIP file
  console.log('📄 Reading WIP file...');
  const wipData = parseWIPFile();

  if (!wipData) {
    console.error('❌ Failed to parse WIP file');
    process.exit(1);
  }

  console.log('✅ WIP file parsed successfully\n');

  // Update Notion
  const updateStats = await updateNotionTasks(wipData);

  // Generate summary
  generateDailySummary(wipData, updateStats);

  console.log('\n✅ Daily WIP sync complete!\n');
}

// Run script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
