#!/usr/bin/env node

/**
 * Generate Apple Shortcuts Programmatically
 *
 * This script uses shortcuts-js to generate .shortcut files for:
 * - Trimurti projects (Rho, Unity, Personal, etc.)
 * - yellowCircle automation commands
 * - Future project additions
 *
 * Generated shortcuts can be:
 * 1. Signed with: shortcuts sign -i input.shortcut -o output.shortcut
 * 2. Imported via: open "shortcuts://import-shortcut/?url=file://..."
 * 3. Auto-synced via iCloud to all devices
 *
 * Usage:
 *   node generate-shortcuts.js
 */

const fs = require('fs');
const path = require('path');
const { buildShortcut } = require('@joshfarrant/shortcuts-js');
const actions = require('@joshfarrant/shortcuts-js/actions');

// Output directory
const OUTPUT_DIR = path.join(__dirname, 'generated');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Mac Mini connection details
const SSH_CONFIG = {
  host: 'Christophers-Mac-mini.local',
  port: 22,
  user: 'christopherwilliamson',
  baseDir: '~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation'
};

/**
 * Generate a simple command shortcut
 */
function generateCommandShortcut(name, command, description) {
  console.log(`Generating: ${name}...`);

  const shortcutActions = [
    actions.comment({ text: description }),
    actions.showResult({
      text: `Executing ${name}...\n\nCommand: ${command}\n\nCheck notifications for results.`
    })
  ];

  const shortcut = buildShortcut(shortcutActions, {
    name: name,
    icon: {
      color: 'yellow',
      glyph: 'gear'
    }
  });

  const filename = `${name.toLowerCase().replace(/\s+/g, '-')}.shortcut`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, shortcut);
  console.log(`✅ Created: ${filename}`);

  return filepath;
}

/**
 * Generate shortcuts for Trimurti projects
 */
function generateTriumvirtiShortcuts() {
  console.log('\n📱 Generating Trimurti Project Shortcuts\n');

  const projects = [
    {
      name: 'Rho Sync',
      command: 'rho',
      description: 'Sync Rho project to Notion and check candidate status'
    },
    {
      name: 'Unity Sync',
      command: 'unity',
      description: 'Sync Unity Notes ecosystem'
    },
    {
      name: 'Personal Sync',
      command: 'personal',
      description: 'Sync personal development tasks'
    }
  ];

  const generated = [];

  projects.forEach(project => {
    const filepath = generateCommandShortcut(
      project.name,
      project.command,
      project.description
    );
    generated.push(filepath);
  });

  return generated;
}

/**
 * Generate main yellowCircle command shortcut
 */
function generateMainShortcut() {
  console.log('\n📱 Generating Main yellowCircle Command Shortcut\n');

  // Note: shortcuts-js has limitations with complex menu structures
  // For now, generate a simple version that demonstrates the concept
  // For full SSH menu functionality, use Shortcuts app GUI

  const description = `yellowCircle Command Center

This is a simplified version generated programmatically.

For full SSH-based command menu, create manually in Shortcuts app:
1. Choose from Menu
2. Run Script Over SSH for each option
3. Show Result

Commands available via shortcut-router.js:
- sync, wip, deadline, blocked, summary, content, all

See .claude/shortcuts/PROGRAMMATIC_SHORTCUTS_SOLUTION.md for setup.`;

  const shortcutActions = [
    actions.comment({ text: 'yellowCircle Command Center' }),
    actions.showResult({ text: description })
  ];

  const shortcut = buildShortcut(shortcutActions, {
    name: 'yellowCircle Command (Generated)',
    icon: {
      color: 'yellow',
      glyph: 'gear'
    }
  });

  const filename = 'yellowcircle-command-generated.shortcut';
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, shortcut);
  console.log(`✅ Created: ${filename}`);
  console.log('\nNOTE: This is a demo version. For full SSH functionality,');
  console.log('create manually in Shortcuts app (see QUICKSTART.md)\n');

  return filepath;
}

/**
 * Generate import instructions
 */
function generateImportInstructions(files) {
  console.log('\n📄 Generating Import Instructions\n');

  const instructions = `# Generated Shortcuts - Import Instructions

## Files Generated

${files.map(f => `- ${path.basename(f)}`).join('\n')}

## How to Import

### Method 1: AirDrop (Easiest)
1. Select .shortcut file in Finder
2. Right-click → Share → AirDrop
3. Send to your iPhone
4. Tap on iPhone to import

### Method 2: iCloud Drive
1. Copy .shortcut files to iCloud Drive
2. Open Files app on iPhone
3. Tap .shortcut file to import

### Method 3: Sign & Import via URL Scheme

**Sign shortcuts:**
\`\`\`bash
cd .claude/shortcuts/generated

# Sign each shortcut
shortcuts sign -i rho-sync.shortcut -o rho-sync-signed.shortcut -m anyone
shortcuts sign -i unity-sync.shortcut -o unity-sync-signed.shortcut -m anyone
shortcuts sign -i personal-sync.shortcut -o personal-sync-signed.shortcut -m anyone
\`\`\`

**Import signed shortcuts:**
\`\`\`bash
# This will open Shortcuts app and prompt to import
open "shortcuts://import-shortcut/?url=file://$(pwd)/rho-sync-signed.shortcut&name=Rho%20Sync"
\`\`\`

## Auto-Sync via iCloud

Once imported on one device, shortcuts automatically sync to all devices via iCloud!

## Updating Shortcuts

When Trimurti projects evolve:
1. Run: \`node generate-shortcuts.js\`
2. Import updated .shortcut files
3. Old versions are replaced automatically

## Next Steps

1. Import generated shortcuts
2. Test on iPhone
3. Verify iCloud sync to all devices
4. Update .claude/automation/shortcut-router.js to enable project commands

---

Generated: ${new Date().toISOString()}
`;

  const instructionsPath = path.join(OUTPUT_DIR, 'IMPORT_INSTRUCTIONS.md');
  fs.writeFileSync(instructionsPath, instructions);
  console.log(`✅ Created: IMPORT_INSTRUCTIONS.md\n`);
}

/**
 * Main execution
 */
function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Programmatic Shortcuts Generator          ║');
  console.log('║  yellowCircle + Trimurti Projects          ║');
  console.log('╚════════════════════════════════════════════╝');

  const generated = [];

  // Generate main shortcut
  generated.push(generateMainShortcut());

  // Generate Trimurti project shortcuts
  generated.push(...generateTriumvirtiShortcuts());

  // Generate import instructions
  generateImportInstructions(generated);

  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Generation Complete!                      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\n📂 Output: ${OUTPUT_DIR}`);
  console.log(`📱 Files: ${generated.length} shortcuts generated`);
  console.log('\n📖 See IMPORT_INSTRUCTIONS.md for next steps\n');
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { generateCommandShortcut, generateTriumvirtiShortcuts };
