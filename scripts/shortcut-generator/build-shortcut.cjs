#!/usr/bin/env node

/**
 * yellowCircle Link Saver - Shortcut Builder
 *
 * Converts the plist template to a .shortcut file that can be
 * imported into iOS/macOS Shortcuts app.
 *
 * Usage:
 *   node build-shortcut.js
 *   node build-shortcut.js --output custom-name.shortcut
 *   node build-shortcut.js --domain mydomain.com
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

const OUTPUT_FILE = getArg('--output') || 'YellowCircle-LinkSaver.shortcut';
const DOMAIN = getArg('--domain') || 'yellowcircle.io';
const TEMPLATE_FILE = path.join(__dirname, 'YellowCircle-LinkSaver.shortcut.plist');

console.log('🔨 Building yellowCircle Link Saver Shortcut...\n');

// Check if template exists
if (!fs.existsSync(TEMPLATE_FILE)) {
  console.error('❌ Template file not found:', TEMPLATE_FILE);
  process.exit(1);
}

// Read the plist template
let plistContent = fs.readFileSync(TEMPLATE_FILE, 'utf8');

// Replace domain if custom one provided
if (DOMAIN !== 'yellowcircle.io') {
  console.log(`📝 Using custom domain: ${DOMAIN}`);
  plistContent = plistContent.replace(/yellowcircle\.io/g, DOMAIN);
}

// Write the modified plist to a temp file
const tempPlist = path.join(__dirname, '.temp-shortcut.plist');
fs.writeFileSync(tempPlist, plistContent, 'utf8');

// Convert XML plist to binary plist (required for .shortcut files)
const outputPath = path.join(__dirname, OUTPUT_FILE);

try {
  // Use plutil to convert (macOS built-in)
  execSync(`plutil -convert binary1 -o "${outputPath}" "${tempPlist}"`, {
    stdio: 'pipe'
  });

  // Clean up temp file
  fs.unlinkSync(tempPlist);

  console.log('✅ Shortcut built successfully!');
  console.log(`📁 Output: ${outputPath}\n`);

  console.log('Next steps:');
  console.log('1. Double-click the .shortcut file to open in Shortcuts app');
  console.log('2. Review and save the shortcut');
  console.log('3. Right-click → Share → Copy iCloud Link');
  console.log('4. Use this link on the yellowCircle extension page');

} catch (error) {
  console.error('❌ Build failed:', error.message);

  // If plutil failed, try alternative approach
  console.log('\n📋 Alternative: Manual import');
  console.log('The plist file can be manually imported:');
  console.log(`1. Rename ${TEMPLATE_FILE} to .shortcut`);
  console.log('2. AirDrop to iPhone/iPad');
  console.log('3. Or use "Get File" → "Import Shortcut" action');

  // Clean up
  if (fs.existsSync(tempPlist)) {
    fs.unlinkSync(tempPlist);
  }

  process.exit(1);
}
