#!/usr/bin/env node

/**
 * yellowCircle Link Saver - Shortcut Modifier
 *
 * Modifies an existing .shortcut file exported from iOS/macOS.
 * Use this to customize the base shortcut (change URLs, text, etc.)
 *
 * Usage:
 *   node modify-shortcut.js input.shortcut --domain mydomain.com
 *   node modify-shortcut.js input.shortcut --output customized.shortcut
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse arguments
const args = process.argv.slice(2);
const inputFile = args.find(a => !a.startsWith('--'));

if (!inputFile) {
  console.log(`
yellowCircle Shortcut Modifier

Usage:
  node modify-shortcut.js <input.shortcut> [options]

Options:
  --domain <domain>     Replace yellowcircle.io with custom domain
  --output <file>       Output file name (default: modified-{input})
  --prompt <text>       Custom prompt text for token input
  --notification <text> Custom notification message

Examples:
  node modify-shortcut.js base.shortcut --domain myapp.com
  node modify-shortcut.js base.shortcut --output production.shortcut
  `);
  process.exit(0);
}

const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const DOMAIN = getArg('--domain');
const OUTPUT = getArg('--output') || `modified-${path.basename(inputFile)}`;
const PROMPT = getArg('--prompt');
const NOTIFICATION = getArg('--notification');

console.log('🔧 Modifying shortcut...\n');

// Verify input exists
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Input file not found: ${inputFile}`);
  process.exit(1);
}

// Convert binary plist to XML for editing
const tempXml = path.join(__dirname, '.temp-shortcut.xml');
const outputPath = path.join(__dirname, OUTPUT);

try {
  // Convert to XML
  console.log('📖 Reading shortcut...');
  execSync(`plutil -convert xml1 -o "${tempXml}" "${inputFile}"`, { stdio: 'pipe' });

  // Read XML content
  let content = fs.readFileSync(tempXml, 'utf8');
  let modified = false;

  // Apply modifications
  if (DOMAIN) {
    console.log(`🌐 Replacing domain: yellowcircle.io → ${DOMAIN}`);
    content = content.replace(/yellowcircle\.io/g, DOMAIN);
    modified = true;
  }

  if (PROMPT) {
    console.log(`💬 Updating prompt text`);
    // Find and replace the Ask for Input prompt
    content = content.replace(
      /Enter your yellowCircle Save Token[^<]*/,
      PROMPT
    );
    modified = true;
  }

  if (NOTIFICATION) {
    console.log(`🔔 Updating notification text`);
    content = content.replace(
      /Link saved to yellowCircle!/,
      NOTIFICATION
    );
    modified = true;
  }

  if (!modified) {
    console.log('ℹ️  No modifications specified. Creating copy...');
  }

  // Write modified XML
  fs.writeFileSync(tempXml, content, 'utf8');

  // Convert back to binary plist
  console.log('💾 Saving shortcut...');
  execSync(`plutil -convert binary1 -o "${outputPath}" "${tempXml}"`, { stdio: 'pipe' });

  // Clean up
  fs.unlinkSync(tempXml);

  console.log(`\n✅ Shortcut modified successfully!`);
  console.log(`📁 Output: ${outputPath}`);

} catch (error) {
  console.error('❌ Modification failed:', error.message);

  // Clean up temp file
  if (fs.existsSync(tempXml)) {
    fs.unlinkSync(tempXml);
  }

  process.exit(1);
}
