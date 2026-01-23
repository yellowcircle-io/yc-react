#!/usr/bin/env node
/**
 * Sign iOS Shortcut Locally
 *
 * Generates and signs a pre-configured iOS Shortcut for a user's vanity slug.
 * The signed shortcut is saved to /tmp/signed-shortcuts/
 * Upload manually to Firebase Storage: shortcuts/signed/{slug}.shortcut
 *
 * Usage:
 *   node scripts/signShortcutLocal.mjs <slug>
 *   node scripts/signShortcutLocal.mjs christopher
 *
 * Requirements:
 *   - macOS (for shortcuts sign command)
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import path from 'path';

// Generate shortcut plist XML
function generateShortcutPlist(slug) {
  const uuid = 'FFFFFFFF-FFFF-4FFF-BFFF-' + Date.now().toString(16).toUpperCase().padStart(12, '0');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>WFWorkflowClientVersion</key>
\t<string>2605.0.5</string>
\t<key>WFWorkflowMinimumClientVersion</key>
\t<integer>900</integer>
\t<key>WFWorkflowMinimumClientVersionString</key>
\t<string>900</string>
\t<key>WFWorkflowName</key>
\t<string>Save to yellowCircle</string>
\t<key>WFWorkflowTypes</key>
\t<array>
\t\t<string>ActionExtension</string>
\t</array>
\t<key>WFWorkflowInputContentItemClasses</key>
\t<array>
\t\t<string>WFURLContentItem</string>
\t\t<string>WFArticleContentItem</string>
\t</array>
\t<key>WFWorkflowIcon</key>
\t<dict>
\t\t<key>WFWorkflowIconGlyphNumber</key>
\t\t<integer>59819</integer>
\t\t<key>WFWorkflowIconStartColor</key>
\t\t<integer>4294956800</integer>
\t</dict>
\t<key>WFWorkflowActions</key>
\t<array>
\t\t<dict>
\t\t\t<key>WFWorkflowActionIdentifier</key>
\t\t\t<string>is.workflow.actions.gettext</string>
\t\t\t<key>WFWorkflowActionParameters</key>
\t\t\t<dict>
\t\t\t\t<key>WFTextActionText</key>
\t\t\t\t<dict>
\t\t\t\t\t<key>Value</key>
\t\t\t\t\t<dict>
\t\t\t\t\t\t<key>string</key>
\t\t\t\t\t\t<string>https://yellowcircle.io/s/${slug}/</string>
\t\t\t\t\t\t<key>attachmentsByRange</key>
\t\t\t\t\t\t<dict>
\t\t\t\t\t\t</dict>
\t\t\t\t\t</dict>
\t\t\t\t\t<key>WFSerializationType</key>
\t\t\t\t\t<string>WFTextTokenString</string>
\t\t\t\t</dict>
\t\t\t\t<key>UUID</key>
\t\t\t\t<string>${uuid}</string>
\t\t\t</dict>
\t\t</dict>
\t\t<dict>
\t\t\t<key>WFWorkflowActionIdentifier</key>
\t\t\t<string>is.workflow.actions.openurl</string>
\t\t\t<key>WFWorkflowActionParameters</key>
\t\t\t<dict>
\t\t\t\t<key>WFInput</key>
\t\t\t\t<dict>
\t\t\t\t\t<key>Value</key>
\t\t\t\t\t<dict>
\t\t\t\t\t\t<key>string</key>
\t\t\t\t\t\t<string>\uFFFC\uFFFC</string>
\t\t\t\t\t\t<key>attachmentsByRange</key>
\t\t\t\t\t\t<dict>
\t\t\t\t\t\t\t<key>{0, 1}</key>
\t\t\t\t\t\t\t<dict>
\t\t\t\t\t\t\t\t<key>Type</key>
\t\t\t\t\t\t\t\t<string>ActionOutput</string>
\t\t\t\t\t\t\t\t<key>OutputName</key>
\t\t\t\t\t\t\t\t<string>Text</string>
\t\t\t\t\t\t\t\t<key>OutputUUID</key>
\t\t\t\t\t\t\t\t<string>${uuid}</string>
\t\t\t\t\t\t\t</dict>
\t\t\t\t\t\t\t<key>{1, 1}</key>
\t\t\t\t\t\t\t<dict>
\t\t\t\t\t\t\t\t<key>Type</key>
\t\t\t\t\t\t\t\t<string>ExtensionInput</string>
\t\t\t\t\t\t\t</dict>
\t\t\t\t\t\t</dict>
\t\t\t\t\t</dict>
\t\t\t\t\t<key>WFSerializationType</key>
\t\t\t\t\t<string>WFTextTokenString</string>
\t\t\t\t</dict>
\t\t\t</dict>
\t\t</dict>
\t</array>
</dict>
</plist>`;
}

// Sign a shortcut file
function signShortcut(slug) {
  const tempDir = '/tmp/shortcut-signing';
  const outputDir = '/tmp/signed-shortcuts';

  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const unsignedPath = path.join(tempDir, `${slug}-unsigned.shortcut`);
  const signedPath = path.join(outputDir, `${slug}.shortcut`);

  console.log(`  Generating plist for: ${slug}`);

  // Generate and write the plist
  const plist = generateShortcutPlist(slug);
  writeFileSync(unsignedPath, plist);

  // Convert to binary plist
  console.log(`  Converting to binary plist...`);
  try {
    execSync(`plutil -convert binary1 "${unsignedPath}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error(`  Error converting to binary: ${err.message}`);
    throw err;
  }

  // Sign the shortcut
  console.log(`  Signing shortcut...`);
  try {
    execSync(`shortcuts sign -i "${unsignedPath}" -o "${signedPath}" 2>&1`, { stdio: 'pipe' });
  } catch (err) {
    // shortcuts sign often returns warnings but still succeeds
    if (!existsSync(signedPath)) {
      console.error(`  Error signing: ${err.message}`);
      throw err;
    }
  }

  // Verify signed file exists and has content
  const stats = existsSync(signedPath) ? statSync(signedPath) : null;
  if (!stats || stats.size < 1000) {
    throw new Error('Signed shortcut file is too small or missing');
  }

  console.log(`  ✅ Signed successfully (${stats.size} bytes)`);
  console.log(`  📁 Output: ${signedPath}`);

  return signedPath;
}

// Main
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node scripts/signShortcutLocal.mjs <slug>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/signShortcutLocal.mjs christopher');
    console.log('  node scripts/signShortcutLocal.mjs my-save-id');
    console.log('');
    console.log('After signing, upload to Firebase Storage:');
    console.log('  Path: shortcuts/signed/{slug}.shortcut');
    console.log('  Bucket: yellowcircle-app.appspot.com');
    process.exit(1);
  }

  const slug = args[0];
  console.log(`\nSigning shortcut for: ${slug}`);

  try {
    const outputPath = signShortcut(slug);
    console.log(`\n========================================`);
    console.log(`✅ Success!`);
    console.log(`\nNext step: Upload to Firebase Storage`);
    console.log(`  Source: ${outputPath}`);
    console.log(`  Destination: gs://yellowcircle-app.appspot.com/shortcuts/signed/${slug}.shortcut`);
    console.log(`\nYou can upload via Firebase Console:`);
    console.log(`  https://console.firebase.google.com/project/yellowcircle-app/storage/yellowcircle-app.appspot.com/files/~2Fshortcuts~2Fsigned`);
  } catch (err) {
    console.error(`\n❌ Failed: ${err.message}`);
    process.exit(1);
  }
}

main();
