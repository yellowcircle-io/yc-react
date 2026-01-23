#!/usr/bin/env node
/**
 * Generate Universal Fallback Shortcut
 *
 * Creates a signed iOS Shortcut that:
 * 1. On first run: Prompts user for their Save ID, stores it locally
 * 2. On subsequent runs: Uses the stored Save ID automatically
 *
 * This is the fallback for users who don't have a pre-signed personalized shortcut.
 *
 * Usage:
 *   node scripts/generateUniversalShortcut.mjs
 *
 * Requirements:
 *   - macOS (for shortcuts sign command)
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import path from 'path';

/**
 * Generate the universal shortcut plist
 *
 * Flow:
 * 1. Receive URL from Share Sheet
 * 2. Try to read stored token from file
 * 3. If no token stored, ask user and save it
 * 4. Construct URL with token and shared URL
 * 5. Open the URL
 * 6. Show notification
 */
function generateUniversalShortcutPlist() {
  // UUIDs for action references
  const getFileUUID = 'AAAAAAAA-AAAA-4AAA-AAAA-' + Date.now().toString(16).toUpperCase().padStart(12, '0');
  const askInputUUID = 'BBBBBBBB-BBBB-4BBB-BBBB-' + (Date.now() + 1).toString(16).toUpperCase().padStart(12, '0');
  const textUUID = 'CCCCCCCC-CCCC-4CCC-CCCC-' + (Date.now() + 2).toString(16).toUpperCase().padStart(12, '0');
  const tokenVarUUID = 'DDDDDDDD-DDDD-4DDD-DDDD-' + (Date.now() + 3).toString(16).toUpperCase().padStart(12, '0');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>WFWorkflowClientVersion</key>
	<string>2605.0.5</string>
	<key>WFWorkflowMinimumClientVersion</key>
	<integer>900</integer>
	<key>WFWorkflowMinimumClientVersionString</key>
	<string>900</string>
	<key>WFWorkflowName</key>
	<string>Save to yellowCircle</string>
	<key>WFWorkflowTypes</key>
	<array>
		<string>ActionExtension</string>
	</array>
	<key>WFWorkflowInputContentItemClasses</key>
	<array>
		<string>WFURLContentItem</string>
		<string>WFArticleContentItem</string>
	</array>
	<key>WFWorkflowIcon</key>
	<dict>
		<key>WFWorkflowIconGlyphNumber</key>
		<integer>59819</integer>
		<key>WFWorkflowIconStartColor</key>
		<integer>4294956800</integer>
	</dict>
	<key>WFWorkflowActions</key>
	<array>
		<!-- Action 1: Get file contents (stored token) -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.file.getfoldercontents</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFFile</key>
				<dict>
					<key>WFFileExtension</key>
					<string>txt</string>
					<key>WFFileName</key>
					<string>yellowcircle-token.txt</string>
					<key>WFFilePath</key>
					<string>Shortcuts/yellowcircle-token.txt</string>
					<key>WFIsDirectory</key>
					<false/>
					<key>WFSerializationType</key>
					<string>WFFile</string>
				</dict>
				<key>UUID</key>
				<string>${getFileUUID}</string>
			</dict>
		</dict>
		<!-- Action 2: Count items (check if file exists/has content) -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.count</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>Input</key>
				<dict>
					<key>Value</key>
					<dict>
						<key>OutputName</key>
						<string>File</string>
						<key>OutputUUID</key>
						<string>${getFileUUID}</string>
						<key>Type</key>
						<string>ActionOutput</string>
					</dict>
					<key>WFSerializationType</key>
					<string>WFTextTokenAttachment</string>
				</dict>
				<key>WFCountType</key>
				<string>Characters</string>
			</dict>
		</dict>
		<!-- Action 3: If count is 0 (no token stored) -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.conditional</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>GroupingIdentifier</key>
				<string>TOKEN-CHECK-GROUP</string>
				<key>WFCondition</key>
				<integer>3</integer>
				<key>WFControlFlowMode</key>
				<integer>0</integer>
				<key>WFNumberValue</key>
				<integer>1</integer>
			</dict>
		</dict>
		<!-- Action 4: Ask for Save ID -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.ask</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFAskActionPrompt</key>
				<string>Enter your yellowCircle Save ID (find it in Settings → API Access)</string>
				<key>WFInputType</key>
				<string>Text</string>
				<key>UUID</key>
				<string>${askInputUUID}</string>
			</dict>
		</dict>
		<!-- Action 5: Save the token to file -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.file.createfolder</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFFilePath</key>
				<dict>
					<key>Value</key>
					<dict>
						<key>string</key>
						<string>Shortcuts</string>
						<key>attachmentsByRange</key>
						<dict/>
					</dict>
					<key>WFSerializationType</key>
					<string>WFTextTokenString</string>
				</dict>
				<key>WFFileDestinationPath</key>
				<dict>
					<key>Value</key>
					<dict>
						<key>string</key>
						<string>/Shortcuts/</string>
						<key>attachmentsByRange</key>
						<dict/>
					</dict>
					<key>WFSerializationType</key>
					<string>WFTextTokenString</string>
				</dict>
			</dict>
		</dict>
		<!-- Action 6: Save token to file -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.documentpicker.save</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFDocument</key>
				<dict>
					<key>Value</key>
					<dict>
						<key>OutputName</key>
						<string>Provided Input</string>
						<key>OutputUUID</key>
						<string>${askInputUUID}</string>
						<key>Type</key>
						<string>ActionOutput</string>
					</dict>
					<key>WFSerializationType</key>
					<string>WFTextTokenAttachment</string>
				</dict>
				<key>WFFileDestinationPath</key>
				<dict>
					<key>Value</key>
					<dict>
						<key>string</key>
						<string>/Shortcuts/yellowcircle-token.txt</string>
						<key>attachmentsByRange</key>
						<dict/>
					</dict>
					<key>WFSerializationType</key>
					<string>WFTextTokenString</string>
				</dict>
				<key>WFSaveFileOverwrite</key>
				<true/>
			</dict>
		</dict>
		<!-- Action 7: Set variable to provided input -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.setvariable</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFInput</key>
				<dict>
					<key>Value</key>
					<dict>
						<key>OutputName</key>
						<string>Provided Input</string>
						<key>OutputUUID</key>
						<string>${askInputUUID}</string>
						<key>Type</key>
						<string>ActionOutput</string>
					</dict>
					<key>WFSerializationType</key>
					<string>WFTextTokenAttachment</string>
				</dict>
				<key>WFVariableName</key>
				<string>saveToken</string>
			</dict>
		</dict>
		<!-- Action 8: Otherwise (token exists) -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.conditional</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>GroupingIdentifier</key>
				<string>TOKEN-CHECK-GROUP</string>
				<key>WFControlFlowMode</key>
				<integer>1</integer>
			</dict>
		</dict>
		<!-- Action 9: Set variable to file contents -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.setvariable</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFInput</key>
				<dict>
					<key>Value</key>
					<dict>
						<key>OutputName</key>
						<string>File</string>
						<key>OutputUUID</key>
						<string>${getFileUUID}</string>
						<key>Type</key>
						<string>ActionOutput</string>
					</dict>
					<key>WFSerializationType</key>
					<string>WFTextTokenAttachment</string>
				</dict>
				<key>WFVariableName</key>
				<string>saveToken</string>
			</dict>
		</dict>
		<!-- Action 10: End If -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.conditional</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>GroupingIdentifier</key>
				<string>TOKEN-CHECK-GROUP</string>
				<key>WFControlFlowMode</key>
				<integer>2</integer>
			</dict>
		</dict>
		<!-- Action 11: Create URL text -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.gettext</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFTextActionText</key>
				<dict>
					<key>Value</key>
					<dict>
						<key>string</key>
						<string>https://yellowcircle.io/s/￼/￼</string>
						<key>attachmentsByRange</key>
						<dict>
							<key>{27, 1}</key>
							<dict>
								<key>Type</key>
								<string>Variable</string>
								<key>VariableName</key>
								<string>saveToken</string>
							</dict>
							<key>{29, 1}</key>
							<dict>
								<key>Type</key>
								<string>ExtensionInput</string>
							</dict>
						</dict>
					</dict>
					<key>WFSerializationType</key>
					<string>WFTextTokenString</string>
				</dict>
				<key>UUID</key>
				<string>${textUUID}</string>
			</dict>
		</dict>
		<!-- Action 12: Open URL -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.openurl</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFInput</key>
				<dict>
					<key>Value</key>
					<dict>
						<key>OutputName</key>
						<string>Text</string>
						<key>OutputUUID</key>
						<string>${textUUID}</string>
						<key>Type</key>
						<string>ActionOutput</string>
					</dict>
					<key>WFSerializationType</key>
					<string>WFTextTokenAttachment</string>
				</dict>
			</dict>
		</dict>
		<!-- Action 13: Show notification -->
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.notification</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFNotificationActionBody</key>
				<string>Link saved to yellowCircle!</string>
				<key>WFNotificationActionTitle</key>
				<string>yellowCircle</string>
			</dict>
		</dict>
	</array>
</dict>
</plist>`;
}

// Sign the shortcut
function signShortcut() {
  const tempDir = '/tmp/shortcut-signing';
  const outputDir = '/tmp/signed-shortcuts';

  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const unsignedPath = path.join(tempDir, 'universal-unsigned.shortcut');
  const signedPath = path.join(outputDir, 'universal.shortcut');

  console.log('Generating universal shortcut plist...');
  const plist = generateUniversalShortcutPlist();
  writeFileSync(unsignedPath, plist);

  // Convert to binary plist
  console.log('Converting to binary plist...');
  try {
    execSync(`plutil -convert binary1 "${unsignedPath}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error(`Error converting to binary: ${err.message}`);
    throw err;
  }

  // Sign the shortcut
  console.log('Signing shortcut...');
  try {
    execSync(`shortcuts sign -i "${unsignedPath}" -o "${signedPath}" 2>&1`, { stdio: 'pipe' });
  } catch (err) {
    // shortcuts sign often returns warnings but still succeeds
    if (!existsSync(signedPath)) {
      console.error(`Error signing: ${err.message}`);
      throw err;
    }
  }

  // Verify signed file exists and has content
  const stats = existsSync(signedPath) ? statSync(signedPath) : null;
  if (!stats || stats.size < 1000) {
    throw new Error('Signed shortcut file is too small or missing');
  }

  console.log(`✅ Signed successfully (${stats.size} bytes)`);
  console.log(`📁 Output: ${signedPath}`);

  return signedPath;
}

// Main
function main() {
  console.log('\n========================================');
  console.log('Generating Universal Fallback Shortcut');
  console.log('========================================\n');

  try {
    const outputPath = signShortcut();
    console.log('\n========================================');
    console.log('✅ Success!');
    console.log('\nNext step: Upload to Firebase Storage');
    console.log(`  Source: ${outputPath}`);
    console.log('  Destination: gs://yellowcircle-app.firebasestorage.app/shortcuts/signed/universal.shortcut');
    console.log('\nOr use the upload script:');
    console.log('  node scripts/uploadSignedShortcut.mjs universal "<auth-token>"');
  } catch (err) {
    console.error(`\n❌ Failed: ${err.message}`);
    process.exit(1);
  }
}

main();
