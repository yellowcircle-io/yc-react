#!/usr/bin/env node

/**
 * Sync iPhone Shortcut Documentation to Notion
 *
 * Adds the Hybrid Shortcut System documentation to your Notion workspace
 * as a new page linked to the yellowCircle Roadmap database.
 *
 * Usage:
 *   node sync-iphone-docs-to-notion.js
 *   node sync-iphone-docs-to-notion.js --dry-run
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Configuration
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const ROADMAP_DB_ID = process.env.NOTION_ROADMAP_DB_ID;

// Validate environment
if (!NOTION_API_KEY) {
  console.error('❌ Error: NOTION_API_KEY environment variable not set');
  console.log('💡 Set it in .claude/automation/.env');
  process.exit(1);
}

if (!ROADMAP_DB_ID) {
  console.error('❌ Error: NOTION_ROADMAP_DB_ID environment variable not set');
  process.exit(1);
}

// Initialize Notion client
const notion = new Client({ auth: NOTION_API_KEY });

// Check for dry-run mode
const isDryRun = process.argv.includes('--dry-run');

console.log('\n🚀 iPhone Documentation → Notion Sync\n');
if (isDryRun) {
  console.log('⚠️  DRY RUN MODE - No changes will be made\n');
}

/**
 * Read documentation files
 */
function readDocs() {
  const repoRoot = path.resolve(__dirname, '../..');

  const docs = {
    hybrid: path.join(repoRoot, '.claude/shortcuts/HYBRID_SHORTCUT_SETUP.md'),
    reconciliation: path.join(repoRoot, '.claude/SHORTCUT_SYSTEMS_RECONCILIATION.md'),
    complete: path.join(repoRoot, '.claude/HYBRID_SYSTEM_COMPLETE.md')
  };

  const content = {};

  for (const [key, filePath] of Object.entries(docs)) {
    try {
      content[key] = fs.readFileSync(filePath, 'utf-8');
      console.log(`✅ Read: ${path.basename(filePath)}`);
    } catch (err) {
      console.error(`❌ Failed to read ${filePath}: ${err.message}`);
    }
  }

  return content;
}

/**
 * Convert markdown to Notion blocks (simplified)
 */
function markdownToBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');

  let currentList = null;
  let codeBlock = null;

  for (let line of lines) {
    // Code blocks
    if (line.startsWith('```')) {
      if (codeBlock) {
        // End code block
        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            rich_text: [{
              type: 'text',
              text: { content: codeBlock.content }
            }],
            language: codeBlock.language || 'plain text'
          }
        });
        codeBlock = null;
      } else {
        // Start code block
        const language = line.slice(3).trim() || 'plain text';
        codeBlock = { language, content: '' };
      }
      continue;
    }

    if (codeBlock) {
      codeBlock.content += line + '\n';
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.slice(3) } }]
        }
      });
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: line.slice(4) } }]
        }
      });
      continue;
    }

    // Lists
    if (line.match(/^[-*]\s/)) {
      const text = line.slice(2);
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: text } }]
        }
      });
      continue;
    }

    // Dividers
    if (line.trim() === '---') {
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {}
      });
      continue;
    }

    // Paragraphs
    if (line.trim().length > 0) {
      // Handle bold, italic, code inline
      const richText = parseInlineFormatting(line);

      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: richText
        }
      });
    }
  }

  return blocks;
}

/**
 * Parse inline formatting (bold, italic, code)
 */
function parseInlineFormatting(text) {
  // Simplified - just return as plain text for now
  // Full implementation would parse **bold**, *italic*, `code`, [links](url)
  return [{ type: 'text', text: { content: text } }];
}

/**
 * Create main iPhone documentation page
 */
async function createDocumentationPage(content) {
  console.log('\n📄 Creating main documentation page...');

  const title = '📱 iPhone Shortcut System - Hybrid Setup';

  if (isDryRun) {
    console.log(`[DRY RUN] Would create page: "${title}"`);
    return null;
  }

  try {
    // Create the page
    const page = await notion.pages.create({
      parent: { database_id: ROADMAP_DB_ID },
      icon: { emoji: '📱' },
      properties: {
        'Feature': {
          title: [{ text: { content: title } }]
        },
        'Status': {
          select: { name: 'Complete' }
        },
        'Priority': {
          select: { name: 'P0' }
        },
        'Category': {
          select: { name: 'yellowCircle' }
        },
        'Description': {
          rich_text: [{
            text: {
              content: 'Complete iPhone shortcut system documentation with hybrid approach (System 1 + System 2 rollback). Ready for deployment.'
            }
          }]
        }
      }
    });

    console.log(`✅ Created page: ${page.url}`);

    return page;
  } catch (err) {
    console.error(`❌ Failed to create page: ${err.message}`);
    if (err.code === 'validation_error') {
      console.log('💡 Note: Database schema may need adjustment');
    }
    return null;
  }
}

/**
 * Add content blocks to page
 */
async function addContentToPage(pageId, blocks) {
  console.log(`\n📝 Adding content blocks (${blocks.length} blocks)...`);

  if (isDryRun) {
    console.log(`[DRY RUN] Would add ${blocks.length} blocks to page`);
    return;
  }

  // Notion has a limit of 100 blocks per request
  const chunkSize = 100;

  for (let i = 0; i < blocks.length; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize);

    try {
      await notion.blocks.children.append({
        block_id: pageId,
        children: chunk
      });

      console.log(`✅ Added blocks ${i + 1}-${Math.min(i + chunkSize, blocks.length)}`);
    } catch (err) {
      console.error(`❌ Failed to add blocks ${i + 1}-${i + chunkSize}: ${err.message}`);
      break;
    }
  }
}

/**
 * Create child page for reconciliation doc
 */
async function createChildPage(parentPageId, title, emoji, content) {
  console.log(`\n📄 Creating child page: "${title}"...`);

  if (isDryRun) {
    console.log(`[DRY RUN] Would create child page: "${title}"`);
    return null;
  }

  try {
    const page = await notion.pages.create({
      parent: { page_id: parentPageId },
      icon: { emoji: emoji },
      properties: {
        title: {
          title: [{ text: { content: title } }]
        }
      }
    });

    console.log(`✅ Created child page: ${page.url}`);

    // Add content
    const blocks = markdownToBlocks(content);
    await addContentToPage(page.id, blocks.slice(0, 100)); // First 100 blocks

    return page;
  } catch (err) {
    console.error(`❌ Failed to create child page: ${err.message}`);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Read documentation files
    const docs = readDocs();

    if (!docs.hybrid) {
      console.error('❌ No documentation files found');
      process.exit(1);
    }

    // Create main documentation page
    const mainPage = await createDocumentationPage(docs);

    if (!mainPage) {
      console.log('\n⚠️  Could not create main page');
      console.log('💡 You can manually create a page and copy/paste the docs');
      console.log(`📂 Files are in: .claude/shortcuts/HYBRID_SHORTCUT_SETUP.md`);
      return;
    }

    // Convert hybrid setup to blocks
    console.log('\n📝 Converting documentation to Notion format...');
    const blocks = markdownToBlocks(docs.hybrid);
    console.log(`✅ Converted ${blocks.length} blocks`);

    // Add content to main page (first 100 blocks due to Notion limit)
    await addContentToPage(mainPage.id, blocks.slice(0, 100));

    // Create child pages for additional docs
    if (docs.reconciliation) {
      await createChildPage(
        mainPage.id,
        'System Reconciliation',
        '🔄',
        docs.reconciliation
      );
    }

    if (docs.complete) {
      await createChildPage(
        mainPage.id,
        'Implementation Summary',
        '✅',
        docs.complete
      );
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ iPhone Documentation Synced to Notion!');
    console.log('='.repeat(50));
    console.log(`\n📱 Main Page: ${mainPage.url}`);
    console.log(`\n🔗 Direct Database Access: https://notion.so/${ROADMAP_DB_ID.replace(/-/g, '')}`);
    console.log('\n💡 You can now access this documentation from:');
    console.log('   - Notion web app');
    console.log('   - Notion mobile app');
    console.log('   - Share with team members');
    console.log('');

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run
main();
