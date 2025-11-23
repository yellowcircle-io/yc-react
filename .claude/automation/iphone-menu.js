#!/usr/bin/env node

/**
 * iPhone Menu-Driven Interface for yellowCircle Automation
 *
 * This script provides an interactive menu system optimized for iPhone SSH access.
 * Use this as a wrapper around shortcut-router.js for easier mobile navigation.
 *
 * Usage from iPhone SSH:
 *   cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
 *   node iphone-menu.js
 *
 * Or add to Apple Shortcut for one-tap access.
 */

const readline = require('readline');
const { execSync } = require('child_process');

// Menu structure
const MENUS = {
  main: {
    title: '📱 yellowCircle Mobile Commands',
    options: [
      { key: '1', label: 'Global Components', action: 'global_menu' },
      { key: '2', label: 'Page Management', action: 'page_menu' },
      { key: '3', label: 'Content Updates', action: 'content_menu' },
      { key: '4', label: 'Sync & Alerts', action: 'sync_menu' },
      { key: '5', label: 'View History', action: 'history_menu' },
      { key: 'q', label: 'Quit', action: 'quit' }
    ]
  },

  global_menu: {
    title: '🎨 Global Components',
    options: [
      { key: '1', label: 'Edit Header', action: 'header_menu' },
      { key: '2', label: 'Edit Footer', action: 'footer_menu' },
      { key: '3', label: 'Edit Theme', action: 'theme_menu' },
      { key: '4', label: 'View Current Config', action: 'exec:node shortcut-router.js global --action=list' },
      { key: '5', label: 'Rollback Last Change', action: 'confirm_exec:node shortcut-router.js rollback' },
      { key: 'b', label: 'Back', action: 'main' }
    ]
  },

  header_menu: {
    title: '📝 Edit Header',
    options: [
      { key: '1', label: 'Change Logo Text (part1)', action: 'input_exec:edit-header:part1:Enter new part1 text' },
      { key: '2', label: 'Change Logo Text (part2)', action: 'input_exec:edit-header:part2:Enter new part2 text' },
      { key: '3', label: 'Change Part1 Color', action: 'input_exec:edit-header:part1Color:Enter hex color (e.g. #FF0000)' },
      { key: '4', label: 'Change Part2 Color', action: 'input_exec:edit-header:part2Color:Enter hex color' },
      { key: '5', label: 'Change Background Color', action: 'input_exec:edit-header:backgroundColor:Enter hex color' },
      { key: '6', label: 'Preview Current Header', action: 'exec:node global-manager.js --component=header --action=list' },
      { key: 'b', label: 'Back', action: 'global_menu' }
    ]
  },

  footer_menu: {
    title: '👣 Edit Footer',
    options: [
      { key: '1', label: 'Add Contact Link', action: 'footer_add_contact' },
      { key: '2', label: 'Add Project Link', action: 'footer_add_project' },
      { key: '3', label: 'Remove Link', action: 'footer_remove' },
      { key: '4', label: 'Change Contact Title', action: 'input_exec:edit-footer:title:Enter new contact title:--section=contact --field=title' },
      { key: '5', label: 'Change Projects Title', action: 'input_exec:edit-footer:title:Enter new projects title:--section=projects --field=title' },
      { key: '6', label: 'Preview Current Footer', action: 'exec:node global-manager.js --component=footer --action=list' },
      { key: 'b', label: 'Back', action: 'global_menu' }
    ]
  },

  theme_menu: {
    title: '🎨 Edit Theme',
    options: [
      { key: '1', label: 'Primary Color', action: 'input_exec:edit-theme:primary:Enter hex color for primary' },
      { key: '2', label: 'Secondary Color', action: 'input_exec:edit-theme:secondary:Enter hex color for secondary' },
      { key: '3', label: 'Background Color', action: 'input_exec:edit-theme:background:Enter color for background' },
      { key: '4', label: 'Text Color', action: 'input_exec:edit-theme:text:Enter color for text' },
      { key: '5', label: 'Font Family', action: 'input_exec:edit-theme:fontFamily:Enter font family' },
      { key: '6', label: 'Preview Current Theme', action: 'exec:node global-manager.js --component=theme --action=list' },
      { key: 'b', label: 'Back', action: 'global_menu' }
    ]
  },

  page_menu: {
    title: '📄 Page Management',
    options: [
      { key: '1', label: 'Create New Page', action: 'page_create' },
      { key: '2', label: 'Duplicate Page', action: 'page_duplicate' },
      { key: '3', label: 'Delete Page', action: 'page_delete' },
      { key: 'b', label: 'Back', action: 'main' }
    ]
  },

  content_menu: {
    title: '✏️ Content Updates',
    options: [
      { key: '1', label: 'Update Page Headline', action: 'content_headline' },
      { key: '2', label: 'Update Page Section', action: 'content_section' },
      { key: 'b', label: 'Back', action: 'main' }
    ]
  },

  sync_menu: {
    title: '🔄 Sync & Alerts',
    options: [
      { key: '1', label: 'Sync to Notion', action: 'exec:node shortcut-router.js sync' },
      { key: '2', label: 'Daily WIP Sync', action: 'exec:node shortcut-router.js wip' },
      { key: '3', label: 'Check Deadlines', action: 'exec:node shortcut-router.js deadline' },
      { key: '4', label: 'Check Blocked Tasks', action: 'exec:node shortcut-router.js blocked' },
      { key: '5', label: 'Weekly Summary', action: 'exec:node shortcut-router.js summary' },
      { key: 'b', label: 'Back', action: 'main' }
    ]
  },

  history_menu: {
    title: '📜 History & Changes',
    options: [
      { key: '1', label: 'Last Change', action: 'exec:node shortcut-router.js last-change' },
      { key: '2', label: 'Recent History', action: 'exec:node shortcut-router.js history' },
      { key: '3', label: 'Git Status', action: 'exec:cd ../../ && git status' },
      { key: 'b', label: 'Back', action: 'main' }
    ]
  }
};

// Input prompts
function prompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(question + ' ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Execute command
function executeCommand(cmd) {
  try {
    console.log(`\n🚀 Executing: ${cmd}\n`);
    const output = execSync(cmd, {
      cwd: __dirname,
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    console.log('\n✅ Command completed\n');
    return true;
  } catch (error) {
    console.log('\n❌ Command failed\n');
    return false;
  }
}

// Display menu
function displayMenu(menuKey) {
  const menu = MENUS[menuKey];
  if (!menu) {
    console.log(`\n❌ Menu not found: ${menuKey}\n`);
    return false;
  }

  console.clear();
  console.log('\n' + '='.repeat(50));
  console.log(menu.title);
  console.log('='.repeat(50) + '\n');

  menu.options.forEach(option => {
    console.log(`  [${option.key}] ${option.label}`);
  });

  console.log('');
  return true;
}

// Handle special actions
async function handleAction(action) {
  // Direct menu navigation
  if (MENUS[action]) {
    return action;
  }

  // Quit
  if (action === 'quit') {
    console.log('\n👋 Goodbye!\n');
    process.exit(0);
  }

  // Execute command
  if (action.startsWith('exec:')) {
    const cmd = action.substring(5);
    executeCommand(cmd);
    await prompt('Press Enter to continue...');
    return null; // Stay on current menu
  }

  // Confirm and execute
  if (action.startsWith('confirm_exec:')) {
    const cmd = action.substring(13);
    console.log(`\n⚠️  About to execute: ${cmd}\n`);
    const confirm = await prompt('Continue? (y/n)');
    if (confirm.toLowerCase() === 'y') {
      executeCommand(cmd);
    }
    await prompt('Press Enter to continue...');
    return null;
  }

  // Input and execute
  if (action.startsWith('input_exec:')) {
    const parts = action.substring(11).split(':');
    const command = parts[0]; // e.g. 'edit-header'
    const field = parts[1];   // e.g. 'part1'
    const promptText = parts[2]; // e.g. 'Enter new part1 text'
    const extraArgs = parts[3] || ''; // optional extra args

    const value = await prompt(promptText + ':');
    if (value) {
      const cmd = `node shortcut-router.js ${command} --field=${field} --value="${value}" ${extraArgs}`;
      const preview = await prompt('Preview first? (y/n)');
      if (preview.toLowerCase() === 'y') {
        executeCommand(cmd + ' --preview');
        const confirm = await prompt('Apply changes? (y/n)');
        if (confirm.toLowerCase() !== 'y') {
          console.log('\n⚠️  Changes cancelled\n');
          await prompt('Press Enter to continue...');
          return null;
        }
      }
      executeCommand(cmd);
    }
    await prompt('Press Enter to continue...');
    return null;
  }

  // Footer add contact
  if (action === 'footer_add_contact') {
    const text = await prompt('Link text (e.g. GITHUB):');
    const url = await prompt('URL:');
    if (text && url) {
      const cmd = `node shortcut-router.js edit-footer --section=contact --action=add --text="${text}" --url="${url}"`;
      executeCommand(cmd);
    }
    await prompt('Press Enter to continue...');
    return null;
  }

  // Footer add project
  if (action === 'footer_add_project') {
    const text = await prompt('Project name (e.g. NEW PROJECT):');
    const url = await prompt('URL or route (e.g. /project or https://...):');
    if (text && url) {
      const cmd = `node shortcut-router.js edit-footer --section=projects --action=add --text="${text}" --url="${url}"`;
      executeCommand(cmd);
    }
    await prompt('Press Enter to continue...');
    return null;
  }

  // Footer remove
  if (action === 'footer_remove') {
    const section = await prompt('Section (contact/projects):');
    const text = await prompt('Link text to remove:');
    if (section && text) {
      const cmd = `node shortcut-router.js edit-footer --section=${section} --action=remove --text="${text}"`;
      executeCommand(cmd);
    }
    await prompt('Press Enter to continue...');
    return null;
  }

  // Page create
  if (action === 'page_create') {
    const slug = await prompt('Page slug (e.g. contact):');
    const title = await prompt('Page title (e.g. Contact Us):');
    const template = await prompt('Template (standard/minimal/fullscreen):') || 'standard';
    if (slug && title) {
      const cmd = `node shortcut-router.js create-page --slug=${slug} --title="${title}" --template=${template}`;
      executeCommand(cmd);
    }
    await prompt('Press Enter to continue...');
    return null;
  }

  // Page duplicate
  if (action === 'page_duplicate') {
    const source = await prompt('Source page slug:');
    const slug = await prompt('New page slug:');
    const title = await prompt('New page title:');
    if (source && slug && title) {
      const cmd = `node shortcut-router.js duplicate-page --source=${source} --slug=${slug} --title="${title}"`;
      executeCommand(cmd);
    }
    await prompt('Press Enter to continue...');
    return null;
  }

  // Page delete
  if (action === 'page_delete') {
    const slug = await prompt('Page slug to delete:');
    if (slug) {
      const confirm = await prompt(`⚠️  Really delete ${slug}? (y/n):`);
      if (confirm.toLowerCase() === 'y') {
        const cmd = `node shortcut-router.js delete-page --slug=${slug}`;
        executeCommand(cmd);
      }
    }
    await prompt('Press Enter to continue...');
    return null;
  }

  // Content headline
  if (action === 'content_headline') {
    const page = await prompt('Page slug:');
    const text = await prompt('New headline:');
    if (page && text) {
      const cmd = `node shortcut-router.js content --page=${page} --section=headline --text="${text}"`;
      executeCommand(cmd);
    }
    await prompt('Press Enter to continue...');
    return null;
  }

  // Content section
  if (action === 'content_section') {
    const page = await prompt('Page slug:');
    const section = await prompt('Section name:');
    const text = await prompt('New text:');
    if (page && section && text) {
      const cmd = `node shortcut-router.js content --page=${page} --section=${section} --text="${text}"`;
      executeCommand(cmd);
    }
    await prompt('Press Enter to continue...');
    return null;
  }

  return null;
}

// Main loop
async function main() {
  let currentMenu = 'main';

  while (true) {
    if (!displayMenu(currentMenu)) {
      currentMenu = 'main';
      continue;
    }

    const choice = await prompt('Select option:');
    const menu = MENUS[currentMenu];
    const option = menu.options.find(opt => opt.key === choice);

    if (!option) {
      console.log('\n❌ Invalid option\n');
      await prompt('Press Enter to continue...');
      continue;
    }

    const nextMenu = await handleAction(option.action);
    if (nextMenu) {
      currentMenu = nextMenu;
    }
  }
}

// Run
console.log('\n🚀 Starting yellowCircle iPhone Menu...\n');
main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
