#!/usr/bin/env node

/**
 * Content Update Script
 *
 * Updates yellowCircle app content without requiring Claude Code session
 * Designed to be triggered from iPhone via Shortcuts or email
 *
 * Usage:
 *   node content-update.js --page=about --section=headline --text="New headline"
 *   node content-update.js --page=home --section=background --background="url"
 *
 * Supported pages: home, about, works, hands, experiments, thoughts
 * Supported sections: headline, description, background
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  acc[key] = value;
  return acc;
}, {});

const { page, section, text, background } = args;

// Validate inputs
if (!page || !section) {
  console.error('❌ Error: Missing required arguments');
  console.error('Usage: node content-update.js --page=about --section=headline --text="New text"');
  console.error('\nSupported pages: home, about, works, hands, experiments, thoughts');
  console.error('Supported sections: headline, description, background');
  process.exit(1);
}

// Page file mapping
const PAGE_FILES = {
  home: 'src/pages/HomePage.jsx',
  about: 'src/pages/AboutPage.jsx',
  works: 'src/pages/WorksPage.jsx',
  hands: 'src/pages/HandsPage.jsx',
  experiments: 'src/pages/ExperimentsPage.jsx',
  thoughts: 'src/pages/ThoughtsPage.jsx',
};

const REPO_ROOT = path.join(__dirname, '../..');
const pageFile = path.join(REPO_ROOT, PAGE_FILES[page]);

if (!fs.existsSync(pageFile)) {
  console.error(`❌ Error: Page file not found: ${pageFile}`);
  process.exit(1);
}

console.log(`📝 Updating ${page} page - ${section}\n`);

// Read current file
let content = fs.readFileSync(pageFile, 'utf-8');
const originalContent = content;

// Update based on section type
let updated = false;

switch (section) {
  case 'headline':
  case 'h1':
    // Find and replace H1 text
    const h1Regex = /(<h1[^>]*>)(.*?)(<\/h1>)/s;
    if (h1Regex.test(content)) {
      content = content.replace(h1Regex, `$1${text}$3`);
      updated = true;
    }
    break;

  case 'description':
  case 'tagline':
    // Find and replace description/tagline (first large paragraph)
    const descRegex = /(<p className="[^"]*text-lg[^"]*"[^>]*>)(.*?)(<\/p>)/s;
    if (descRegex.test(content)) {
      content = content.replace(descRegex, `$1${text}$3`);
      updated = true;
    }
    break;

  case 'background':
    // Update background image URL
    if (background) {
      const bgRegex = /(backgroundImage:.*?url\(['"])(.*?)(['"])/;
      if (bgRegex.test(content)) {
        content = content.replace(bgRegex, `$1${background}$3`);
        updated = true;
      }
    }
    break;

  default:
    console.error(`❌ Error: Unknown section: ${section}`);
    console.error('Supported sections: headline, description, background');
    process.exit(1);
}

if (!updated) {
  console.error(`⚠️  Warning: Could not find ${section} to update in ${page} page`);
  console.error('File may have different structure than expected.');
  process.exit(1);
}

// Write updated content
fs.writeFileSync(pageFile, content);
console.log('✅ File updated successfully\n');

// Git commit
try {
  const commitMessage = `Update: ${page} page ${section}\n\n${text || background}\n\n🤖 Via mobile command system\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;

  execSync(`git add "${pageFile}"`, { cwd: REPO_ROOT });
  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: REPO_ROOT });

  console.log('✅ Changes committed to git\n');

  // Optionally push (commented out for safety - uncomment to auto-push)
  // execSync('git push', { cwd: REPO_ROOT });
  // console.log('✅ Pushed to GitHub');

} catch (error) {
  console.error('⚠️  Git commit failed:', error.message);
  console.log('Changes saved to file but not committed\n');
}

console.log('📊 Summary:');
console.log(`  Page: ${page}`);
console.log(`  Section: ${section}`);
console.log(`  Updated: ${text || background}`);
console.log(`  File: ${pageFile}`);
console.log('\nNext steps:');
console.log('  - Review changes: git diff');
console.log('  - Push to GitHub: git push');
console.log('  - Test locally: npm run dev');
console.log('  - Deploy: npm run build && firebase deploy');
