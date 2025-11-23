#!/usr/bin/env node

/**
 * Shortcut Router - Dynamic Command Loader for Apple Shortcuts
 *
 * This script allows Apple Shortcuts to call a single endpoint while
 * command definitions are managed programmatically. Add new commands
 * here without modifying shortcuts.
 *
 * Usage from Apple Shortcut (SSH):
 *   cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js [command]
 *
 * Example:
 *   node shortcut-router.js sync
 *   node shortcut-router.js wip
 *   node shortcut-router.js content --page=about --section=headline --text="New Headline"
 */

const { execSync } = require('child_process');
const path = require('path');

// Command Registry - Add new commands here
const COMMANDS = {
  // Notion Syncs
  'sync': {
    script: 'npm run sync',
    description: 'Sync roadmap to Notion',
    category: 'sync'
  },
  'wip': {
    script: 'npm run wip:sync',
    description: 'Run daily WIP sync',
    category: 'sync'
  },

  // Alerts
  'deadline': {
    script: 'npm run alerts:deadline',
    description: 'Check deadline alerts',
    category: 'alerts'
  },
  'blocked': {
    script: 'npm run alerts:blocked',
    description: 'Check blocked tasks',
    category: 'alerts'
  },

  // Summaries
  'summary': {
    script: 'npm run summary:weekly',
    description: 'Generate weekly summary',
    category: 'reporting'
  },

  // Content Updates
  'content': {
    script: 'node content-update.js',
    description: 'Update page content',
    category: 'content',
    passthrough: true // Pass all args to script
  },

  // Page Management
  'create-page': {
    script: 'node page-manager.js --action=create',
    description: 'Create new page from template',
    category: 'pages',
    passthrough: true
  },
  'duplicate-page': {
    script: 'node page-manager.js --action=duplicate',
    description: 'Duplicate existing page',
    category: 'pages',
    passthrough: true
  },
  'delete-page': {
    script: 'node page-manager.js --action=delete',
    description: 'Delete a page',
    category: 'pages',
    passthrough: true
  },

  // Global Components
  'global': {
    script: 'node global-manager.js',
    description: 'Edit global components (header, footer, theme)',
    category: 'global',
    passthrough: true
  },
  'edit-footer': {
    script: 'node global-manager.js --component=footer',
    description: 'Edit footer content',
    category: 'global',
    passthrough: true
  },
  'edit-header': {
    script: 'node global-manager.js --component=header',
    description: 'Edit header content',
    category: 'global',
    passthrough: true
  },
  'edit-theme': {
    script: 'node global-manager.js --component=theme',
    description: 'Edit theme colors/typography',
    category: 'global',
    passthrough: true
  },
  'rollback': {
    script: 'cd ../../ && git revert HEAD --no-edit && echo "✅ Rolled back last change"',
    description: 'Rollback last global component change',
    category: 'global'
  },
  'restore': {
    script: 'cd ../../ && git restore src/config/globalContent.js && echo "✅ Restored global config from last commit"',
    description: 'Restore global config to last commit (uncommitted changes only)',
    category: 'global'
  },
  'last-change': {
    script: 'cd ../../ && git log -1 --stat src/config/globalContent.js',
    description: 'Show last change to global config',
    category: 'global'
  },
  'history': {
    script: 'cd ../../ && git log --oneline -10 src/config/globalContent.js',
    description: 'Show recent global config changes',
    category: 'global'
  },

  // Test All
  'all': {
    script: 'npm run test:all',
    description: 'Run all automations',
    category: 'testing'
  },

  // Trimurti Projects (Future)
  'rho': {
    script: 'echo "Rho sync not yet implemented"',
    description: 'Sync Rho project',
    category: 'projects',
    enabled: false
  },
  'unity': {
    script: 'echo "Unity sync not yet implemented"',
    description: 'Sync Unity Notes',
    category: 'projects',
    enabled: false
  },
  'personal': {
    script: 'echo "Personal sync not yet implemented"',
    description: 'Sync personal tasks',
    category: 'projects',
    enabled: false
  }
};

// Parse arguments
const args = process.argv.slice(2);
const command = args[0];

// No command - show menu
if (!command) {
  console.log('\n📱 yellowCircle Command Router\n');
  console.log('Usage: node shortcut-router.js [command] [args]\n');
  console.log('Available Commands:\n');

  // Group by category
  const categories = {};
  Object.entries(COMMANDS).forEach(([cmd, config]) => {
    if (config.enabled !== false) {
      if (!categories[config.category]) categories[config.category] = [];
      categories[config.category].push({ cmd, ...config });
    }
  });

  Object.entries(categories).forEach(([category, cmds]) => {
    console.log(`${category.toUpperCase()}:`);
    cmds.forEach(({ cmd, description }) => {
      console.log(`  ${cmd.padEnd(12)} - ${description}`);
    });
    console.log('');
  });

  process.exit(0);
}

// Get command config
const config = COMMANDS[command];

if (!config) {
  console.error(`❌ Unknown command: ${command}\n`);
  console.log('Available commands:', Object.keys(COMMANDS).filter(k => COMMANDS[k].enabled !== false).join(', '));
  process.exit(1);
}

if (config.enabled === false) {
  console.error(`❌ Command '${command}' is not yet enabled`);
  process.exit(1);
}

// Build full command
let fullCommand = config.script;

// If passthrough, append all remaining args
if (config.passthrough && args.length > 1) {
  const additionalArgs = args.slice(1).join(' ');
  // Only use '--' separator for npm commands, not direct node calls
  const separator = config.script.startsWith('npm ') ? ' -- ' : ' ';
  fullCommand += separator + additionalArgs;
}

// Execute command
console.log(`\n🚀 Executing: ${command}\n`);
console.log(`Command: ${fullCommand}\n`);

try {
  execSync(fullCommand, {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
  });

  console.log(`\n✅ Command '${command}' completed successfully\n`);
} catch (error) {
  console.error(`\n❌ Command '${command}' failed with exit code ${error.status}\n`);
  process.exit(error.status || 1);
}
