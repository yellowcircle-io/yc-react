#!/usr/bin/env node

/**
 * Global Component Manager - Edit global components (Header, Footer, Theme)
 *
 * Usage:
 *   node global-manager.js --component=footer --section=contact --field=email --value="new@email.com"
 *   node global-manager.js --component=footer --section=projects --action=add --text="NEW PROJECT" --url="/project"
 *   node global-manager.js --component=header --field=part1 --value="new"
 *   node global-manager.js --component=theme --field=primary --value="#FF0000"
 *
 * Components:
 *   header   - Logo text and styling
 *   footer   - Contact and projects sections
 *   theme    - Colors and typography
 *
 * Actions:
 *   edit     - Edit existing field (default)
 *   add      - Add new item (footer links only)
 *   remove   - Remove item (footer links only)
 *   list     - Show current configuration
 *
 * Flags:
 *   --preview       Show changes without applying
 *   --dry-run       Test execution without modifying files
 *   --no-commit     Skip automatic git commit
 *   --no-build      Skip build validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  const cleanKey = key.replace(/^--/, '');
  acc[cleanKey] = value === undefined ? true : value;
  return acc;
}, {});

// Configuration
const projectRoot = path.join(__dirname, '..', '..');
const CONFIG = {
  configFile: path.join(projectRoot, 'src/config/globalContent.js'),
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Read current configuration
function readConfig() {
  try {
    const configContent = fs.readFileSync(CONFIG.configFile, 'utf-8');
    // Extract the object from the export
    const match = configContent.match(/const globalContent = ({[\s\S]*?});/);
    if (!match) {
      throw new Error('Could not parse globalContent object');
    }
    // Use eval to parse the object (safe since we control the file)
    return eval(`(${match[1]})`);
  } catch (err) {
    error(`Failed to read config: ${err.message}`);
    process.exit(1);
  }
}

// Create backup of current config
function createBackup() {
  try {
    const backupPath = CONFIG.configFile + '.backup';
    fs.copyFileSync(CONFIG.configFile, backupPath);
    info(`Backup created: ${backupPath}`);
    return backupPath;
  } catch (err) {
    warning(`Failed to create backup: ${err.message}`);
    return null;
  }
}

// Restore from backup
function restoreFromBackup(backupPath) {
  try {
    if (backupPath && fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, CONFIG.configFile);
      success(`Restored from backup: ${backupPath}`);
      // Clean up backup
      fs.unlinkSync(backupPath);
      return true;
    }
    return false;
  } catch (err) {
    error(`Failed to restore from backup: ${err.message}`);
    return false;
  }
}

// Write updated configuration
function writeConfig(config) {
  const content = `/**
 * Global Content Configuration
 *
 * Centralized editable content for global components (Header, Footer, Theme)
 * Editable via .claude/automation/global-manager.js
 *
 * Usage from iPhone:
 *   cd .claude/automation && node global-manager.js --component=footer --section=contact --field=email --value="newemail@yellowcircle.io"
 */

const globalContent = ${JSON.stringify(config, null, 2)};

export default globalContent;
`;

  if (args['dry-run'] || args.preview) {
    info('Dry run mode - would write:');
    console.log(content);
    return;
  }

  fs.writeFileSync(CONFIG.configFile, content, 'utf-8');
  success(`Updated ${CONFIG.configFile}`);
}

// List current configuration
function listConfig() {
  const config = readConfig();
  const { component, section } = args;

  if (!component) {
    log('\n📋 Global Configuration:', 'bright');
    log('\n=== HEADER ===', 'cyan');
    console.log(JSON.stringify(config.header, null, 2));
    log('\n=== FOOTER ===', 'cyan');
    console.log(JSON.stringify(config.footer, null, 2));
    log('\n=== THEME ===', 'cyan');
    console.log(JSON.stringify(config.theme, null, 2));
  } else if (component === 'header') {
    log('\n📋 Header Configuration:', 'bright');
    console.log(JSON.stringify(config.header, null, 2));
  } else if (component === 'footer') {
    if (section) {
      log(`\n📋 Footer ${section} Configuration:`, 'bright');
      console.log(JSON.stringify(config.footer[section], null, 2));
    } else {
      log('\n📋 Footer Configuration:', 'bright');
      console.log(JSON.stringify(config.footer, null, 2));
    }
  } else if (component === 'theme') {
    log('\n📋 Theme Configuration:', 'bright');
    console.log(JSON.stringify(config.theme, null, 2));
  }
}

// Edit header
function editHeader(config) {
  const { field, value } = args;

  if (!field || !value) {
    error('Header edit requires --field and --value');
    info('Examples:');
    info('  --field=part1 --value="new"');
    info('  --field=part2 --value="TEXT"');
    info('  --field=part1Color --value="#FF0000"');
    process.exit(1);
  }

  // Map common field names
  const fieldMap = {
    part1: ['logoText', 'part1'],
    part2: ['logoText', 'part2'],
    part1Color: ['colors', 'part1Color'],
    part2Color: ['colors', 'part2Color'],
    backgroundColor: ['colors', 'backgroundColor'],
    fontSize: ['styling', 'fontSize'],
    fontWeight: ['styling', 'fontWeight'],
    letterSpacing: ['styling', 'letterSpacing']
  };

  const path = fieldMap[field];
  if (!path) {
    error(`Unknown field: ${field}`);
    info('Available fields: ' + Object.keys(fieldMap).join(', '));
    process.exit(1);
  }

  const oldValue = config.header[path[0]][path[1]];
  config.header[path[0]][path[1]] = value;

  if (args.preview) {
    log('\nPreview Changes:', 'yellow');
    log(`  ${field}: "${oldValue}" → "${value}"`, 'cyan');
  } else {
    success(`Updated header.${field}: "${oldValue}" → "${value}"`);
  }

  return config;
}

// Edit footer
function editFooter(config) {
  const { section, action = 'edit', field, value, text, url, index } = args;

  if (!section) {
    error('Footer edit requires --section (contact or projects)');
    process.exit(1);
  }

  if (section !== 'contact' && section !== 'projects') {
    error(`Unknown section: ${section}. Use 'contact' or 'projects'`);
    process.exit(1);
  }

  if (action === 'add') {
    // Add new link
    if (!text) {
      error('Add action requires --text');
      process.exit(1);
    }

    const newLink = {
      text: text.toUpperCase(),
      url: url || '#',
    };

    if (section === 'projects' && url && url.startsWith('/')) {
      newLink.route = url;
    }

    if (section === 'contact') {
      newLink.type = field || 'social';
    }

    config.footer[section].links.push(newLink);
    success(`Added "${text}" to footer.${section}`);

  } else if (action === 'remove') {
    // Remove link by index or text
    const targetIndex = index !== undefined
      ? parseInt(index)
      : config.footer[section].links.findIndex(link => link.text === text.toUpperCase());

    if (targetIndex === -1) {
      error(`Link not found: ${text || index}`);
      process.exit(1);
    }

    const removed = config.footer[section].links.splice(targetIndex, 1)[0];
    success(`Removed "${removed.text}" from footer.${section}`);

  } else if (action === 'edit') {
    // Edit existing link or title
    if (field === 'title') {
      const oldTitle = config.footer[section].title;
      config.footer[section].title = value.toUpperCase();
      success(`Updated footer.${section}.title: "${oldTitle}" → "${value.toUpperCase()}"`);
    } else {
      // Edit link
      const targetIndex = index !== undefined
        ? parseInt(index)
        : config.footer[section].links.findIndex(link => link.text === text.toUpperCase());

      if (targetIndex === -1) {
        error(`Link not found: ${text || index}`);
        process.exit(1);
      }

      const link = config.footer[section].links[targetIndex];

      if (field === 'text') {
        const oldText = link.text;
        link.text = value.toUpperCase();
        success(`Updated link text: "${oldText}" → "${value.toUpperCase()}"`);
      } else if (field === 'url') {
        const oldUrl = link.url;
        link.url = value;
        if (section === 'projects' && value.startsWith('/')) {
          link.route = value;
        }
        success(`Updated link URL: "${oldUrl}" → "${value}"`);
      }
    }
  }

  return config;
}

// Edit theme
function editTheme(config) {
  const { field, value } = args;

  if (!field || !value) {
    error('Theme edit requires --field and --value');
    info('Examples:');
    info('  --field=primary --value="#FF0000"');
    info('  --field=background --value="black"');
    info('  --field=fontFamily --value="Arial"');
    process.exit(1);
  }

  // Check if field exists in colors or typography
  const inColors = config.theme.colors.hasOwnProperty(field);
  const inTypography = config.theme.typography.hasOwnProperty(field);

  if (!inColors && !inTypography) {
    error(`Unknown field: ${field}`);
    info('Available color fields: ' + Object.keys(config.theme.colors).join(', '));
    info('Available typography fields: ' + Object.keys(config.theme.typography).join(', '));
    process.exit(1);
  }

  const section = inColors ? 'colors' : 'typography';
  const oldValue = config.theme[section][field];
  config.theme[section][field] = value;

  if (args.preview) {
    log('\nPreview Changes:', 'yellow');
    log(`  theme.${section}.${field}: "${oldValue}" → "${value}"`, 'cyan');
  } else {
    success(`Updated theme.${section}.${field}: "${oldValue}" → "${value}"`);
  }

  return config;
}

// Build validation
function validateBuild() {
  if (args['no-build']) {
    warning('Skipping build validation (--no-build)');
    return true;
  }

  try {
    info('Running build validation...');
    execSync('npm run build', {
      cwd: projectRoot,
      stdio: 'pipe'
    });
    success('Build validation passed');
    return true;
  } catch (err) {
    error('Build failed - rolling back changes');
    return false;
  }
}

// Git operations
function gitCommit(message) {
  if (args['no-commit']) {
    warning('Skipping git commit (--no-commit)');
    return;
  }

  try {
    execSync('git add src/config/globalContent.js', { cwd: projectRoot });
    execSync(`git commit -m "${message}"`, { cwd: projectRoot });
    success('Changes committed to git');
  } catch (err) {
    warning('Git commit failed (may already be committed)');
  }
}

// Main execution
function main() {
  const { action = 'edit', component } = args;

  // Handle list action
  if (action === 'list' || !component) {
    listConfig();
    return;
  }

  // Read current config
  let config = readConfig();

  // Execute action based on component
  if (component === 'header') {
    config = editHeader(config);
  } else if (component === 'footer') {
    config = editFooter(config);
  } else if (component === 'theme') {
    config = editTheme(config);
  } else {
    error(`Unknown component: ${component}`);
    info('Available components: header, footer, theme');
    process.exit(1);
  }

  // Write updated config
  if (!args.preview) {
    // Create backup before writing
    const backupPath = createBackup();

    writeConfig(config);

    // Validate build
    if (!validateBuild()) {
      error('Build validation failed - restoring from backup');
      if (restoreFromBackup(backupPath)) {
        info('Config restored to previous state');
      }
      process.exit(1);
    }

    // Build successful - clean up backup
    if (backupPath && fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }

    // Commit changes
    const commitMsg = `Update: Global ${component} configuration via global-manager

Machine: MacBook Air
Updated: ${component}${args.section ? `.${args.section}` : ''}${args.field ? `.${args.field}` : ''}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

    gitCommit(commitMsg);

    success('Global component update complete!');
  }
}

// Run
try {
  main();
} catch (err) {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
}
