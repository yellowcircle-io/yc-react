#!/usr/bin/env node

/**
 * Roadmap → Notion Sync Script
 *
 * Parses markdown roadmap files and syncs to Notion database
 *
 * Usage:
 *   node sync-roadmap-to-notion.js [--dry-run]
 *
 * Environment variables required:
 *   NOTION_API_KEY - Notion integration token
 *   NOTION_ROADMAP_DB_ID - Database ID for yellowCircle Roadmap
 */

// Load environment variables from .env file
require('dotenv').config();

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const ROADMAP_DB_ID = process.env.NOTION_ROADMAP_DB_ID;
const DRY_RUN = process.argv.includes('--dry-run');

// File paths
const REPO_ROOT = path.join(__dirname, '../..');
const ROADMAP_CHECKLIST = path.join(REPO_ROOT, 'dev-context/ROADMAP_CHECKLIST_NOV8_2025.md');
const PROJECT_ROADMAP = path.join(REPO_ROOT, 'dev-context/PROJECT_ROADMAP_NOV2025.md');

/**
 * Parse markdown file and extract tasks
 */
function parseRoadmapFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const tasks = [];

  // Regex patterns
  const headerPattern = /^###?\s+(.+?)(?:\s+🔴|\s+⭐+|\s+\[P\d\])?$/gm;
  const priorityPattern = /\[P(\d)\]/;
  const hoursPattern = /(\d+(?:-\d+)?)\s*(?:hours?|hrs?)/i;
  const statusPattern = /Status:\s*(.+?)$/m;
  const checkboxPattern = /^- \[([ x✅])\]\s+(.+)$/gm;

  let currentSection = null;
  let currentPriority = 'P2';
  let currentCategory = 'yellowCircle';

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect category from headers
    if (line.includes('Rho')) currentCategory = 'Rho';
    else if (line.includes('Unity Notes')) currentCategory = 'Unity Notes';
    else if (line.includes('Personal')) currentCategory = 'Personal';
    else if (line.includes('yellowCircle')) currentCategory = 'yellowCircle';

    // Parse section headers
    const headerMatch = line.match(/^###?\s+(.+?)(?:\s+🔴|\s+⭐+)?$/);
    if (headerMatch) {
      const title = headerMatch[1].trim();

      // Extract priority
      const priorityMatch = title.match(priorityPattern) || line.match(/P(\d)/);
      if (priorityMatch) {
        currentPriority = `P${priorityMatch[1]}`;
      } else if (line.includes('🔴') || title.includes('PRIORITY')) {
        currentPriority = 'P0';
      }

      // Extract hours
      const hoursMatch = title.match(hoursPattern);
      const estimatedHours = hoursMatch ? parseHours(hoursMatch[1]) : null;

      // Detect status
      let status = 'Not Started';
      const nextLines = lines.slice(i, i + 10).join('\n');
      const statusMatch = nextLines.match(statusPattern);
      if (statusMatch) {
        const statusText = statusMatch[1].toLowerCase();
        if (statusText.includes('complete') || statusText.includes('✅')) {
          status = 'Complete';
        } else if (statusText.includes('in progress') || statusText.includes('🔴')) {
          status = 'In Progress';
        } else if (statusText.includes('blocked')) {
          status = 'Blocked';
        }
      } else if (title.includes('COMPLETE')) {
        status = 'Complete';
      }

      currentSection = {
        title: cleanTitle(title),
        priority: currentPriority,
        category: currentCategory,
        status: status,
        estimatedHours: estimatedHours,
        description: '',
        subtasks: [],
      };

      tasks.push(currentSection);
    }

    // Parse description (lines after header, before checkboxes)
    if (currentSection && !line.match(/^- \[/) && !line.match(/^###?/) && line.trim()) {
      if (!line.startsWith('**') && !line.startsWith('####')) {
        currentSection.description += line + '\n';
      }
    }

    // Parse checkboxes (subtasks)
    const checkboxMatch = line.match(/^- \[([ x✅])\]\s+(.+)$/);
    if (checkboxMatch && currentSection) {
      const isComplete = checkboxMatch[1] !== ' ';
      const subtaskText = checkboxMatch[2].trim();

      currentSection.subtasks.push({
        text: subtaskText,
        complete: isComplete,
      });
    }
  }

  return tasks.filter(t => t.title && t.title.length > 0);
}

/**
 * Clean title by removing status markers, priorities, hour estimates
 */
function cleanTitle(title) {
  return title
    .replace(/🔴|⭐+|\[P\d\]|✅/g, '')
    .replace(/\(\d+-?\d*\s*(?:hours?|hrs?)\)/gi, '')
    .replace(/NEW\s*-\s*NOV\s*\d+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse hour estimates (handle ranges like "12-17")
 */
function parseHours(hoursText) {
  if (hoursText.includes('-')) {
    const [min, max] = hoursText.split('-').map(Number);
    return Math.round((min + max) / 2); // Use average
  }
  return Number(hoursText);
}

/**
 * Create or update Notion page for task
 */
async function syncTaskToNotion(task) {
  const pageProperties = {
    'Feature': {
      title: [
        {
          text: {
            content: task.title,
          },
        },
      ],
    },
    'Status': {
      select: {
        name: task.status,
      },
    },
    'Priority': {
      select: {
        name: task.priority,
      },
    },
    'Category': {
      select: {
        name: task.category,
      },
    },
  };

  // Add description if exists
  if (task.description && task.description.trim()) {
    pageProperties['Description'] = {
      rich_text: [
        {
          text: {
            content: task.description.trim().substring(0, 2000), // Notion limit
          },
        },
      ],
    };
  }

  // Add estimated hours if exists
  if (task.estimatedHours) {
    pageProperties['Estimated Hours'] = {
      number: task.estimatedHours,
    };
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would create/update:', task.title);
    console.log('  Priority:', task.priority);
    console.log('  Status:', task.status);
    console.log('  Category:', task.category);
    console.log('  Hours:', task.estimatedHours || 'N/A');
    console.log('  Subtasks:', task.subtasks.length);
    return;
  }

  try {
    // Check if page already exists (search by title)
    const existingPages = await notion.databases.query({
      database_id: ROADMAP_DB_ID,
      filter: {
        property: 'Feature',
        title: {
          equals: task.title,
        },
      },
    });

    if (existingPages.results.length > 0) {
      // Update existing page
      const pageId = existingPages.results[0].id;
      await notion.pages.update({
        page_id: pageId,
        properties: pageProperties,
      });
      console.log(`✅ Updated: ${task.title}`);
    } else {
      // Create new page
      const newPage = await notion.pages.create({
        parent: {
          database_id: ROADMAP_DB_ID,
        },
        properties: pageProperties,
      });

      console.log(`✨ Created: ${task.title}`);

      // Add subtasks as children blocks if they exist
      if (task.subtasks.length > 0) {
        const subtaskBlocks = task.subtasks.map(subtask => ({
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                text: {
                  content: subtask.text,
                },
              },
            ],
            checked: subtask.complete,
          },
        }));

        await notion.blocks.children.append({
          block_id: newPage.id,
          children: subtaskBlocks,
        });

        console.log(`   └─ Added ${task.subtasks.length} subtasks`);
      }
    }
  } catch (error) {
    console.error(`❌ Error syncing "${task.title}":`, error.message);
  }
}

/**
 * Setup database schema with required properties
 */
async function setupDatabaseSchema() {
  if (DRY_RUN) {
    console.log('[DRY RUN] Would setup database schema\n');
    return;
  }

  try {
    console.log('🔧 Setting up database schema...');

    // Get current database to check existing properties
    const database = await notion.databases.retrieve({
      database_id: ROADMAP_DB_ID,
    });

    const existingProps = Object.keys(database.properties);
    const requiredProps = ['Feature', 'Status', 'Priority', 'Category', 'Description', 'Estimated Hours'];
    const missingProps = requiredProps.filter(prop => !existingProps.includes(prop));

    if (missingProps.length === 0) {
      console.log('✓ Database schema already configured\n');
      return;
    }

    console.log(`  Adding ${missingProps.length} missing properties: ${missingProps.join(', ')}`);

    // Build properties object with only missing properties
    const newProperties = {};

    if (missingProps.includes('Feature')) {
      newProperties['Feature'] = { title: {} };
    }

    if (missingProps.includes('Status')) {
      newProperties['Status'] = {
        select: {
          options: [
            { name: 'Not Started', color: 'gray' },
            { name: 'In Progress', color: 'blue' },
            { name: 'Complete', color: 'green' },
            { name: 'Blocked', color: 'red' },
          ],
        },
      };
    }

    if (missingProps.includes('Priority')) {
      newProperties['Priority'] = {
        select: {
          options: [
            { name: 'P0', color: 'red' },
            { name: 'P1', color: 'orange' },
            { name: 'P2', color: 'yellow' },
            { name: 'P3', color: 'gray' },
          ],
        },
      };
    }

    if (missingProps.includes('Category')) {
      newProperties['Category'] = {
        select: {
          options: [
            { name: 'yellowCircle', color: 'yellow' },
            { name: 'Rho', color: 'blue' },
            { name: 'Unity Notes', color: 'purple' },
            { name: 'Personal', color: 'green' },
          ],
        },
      };
    }

    if (missingProps.includes('Description')) {
      newProperties['Description'] = {
        rich_text: {},
      };
    }

    if (missingProps.includes('Estimated Hours')) {
      newProperties['Estimated Hours'] = {
        number: {
          format: 'number',
        },
      };
    }

    // Update database with new properties
    await notion.databases.update({
      database_id: ROADMAP_DB_ID,
      properties: newProperties,
    });

    console.log('✅ Database schema configured successfully\n');
  } catch (error) {
    console.error('❌ Error setting up database schema:', error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Roadmap → Notion Sync Script\n');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Validate environment variables
  if (!process.env.NOTION_API_KEY) {
    console.error('❌ Error: NOTION_API_KEY environment variable not set');
    process.exit(1);
  }

  if (!process.env.NOTION_ROADMAP_DB_ID) {
    console.error('❌ Error: NOTION_ROADMAP_DB_ID environment variable not set');
    process.exit(1);
  }

  // Setup database schema first
  await setupDatabaseSchema();

  console.log('📋 Parsing roadmap files...\n');

  // Parse both roadmap files
  let allTasks = [];

  if (fs.existsSync(ROADMAP_CHECKLIST)) {
    console.log('  ✓ ROADMAP_CHECKLIST_NOV8_2025.md');
    const checklistTasks = parseRoadmapFile(ROADMAP_CHECKLIST);
    allTasks = allTasks.concat(checklistTasks);
  }

  if (fs.existsSync(PROJECT_ROADMAP)) {
    console.log('  ✓ PROJECT_ROADMAP_NOV2025.md');
    const projectTasks = parseRoadmapFile(PROJECT_ROADMAP);
    allTasks = allTasks.concat(projectTasks);
  }

  console.log(`\n📊 Found ${allTasks.length} tasks total\n`);

  // Group by category for display
  const byCategory = allTasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {});

  console.log('Tasks by category:');
  Object.entries(byCategory).forEach(([category, tasks]) => {
    console.log(`  ${category}: ${tasks.length} tasks`);
  });

  console.log('\n⚙️  Syncing to Notion...\n');

  // Sync each task
  for (const task of allTasks) {
    await syncTaskToNotion(task);
  }

  console.log('\n✅ Sync complete!');

  if (!DRY_RUN) {
    console.log('\n🔗 View your roadmap: https://notion.so/' + ROADMAP_DB_ID.replace(/-/g, ''));
  }
}

// Run script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
