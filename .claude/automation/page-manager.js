#!/usr/bin/env node

/**
 * Page Manager - Create, duplicate, and delete pages for yellowCircle site
 *
 * Usage:
 *   node page-manager.js --action=create --template=about --name=projects --headline="PROJECTS" --subtitle="My work" --body="Portfolio of projects"
 *   node page-manager.js --action=duplicate --source=about --name=about-alt --headline="ABOUT ME"
 *   node page-manager.js --action=delete --name=projects
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

// Configuration - Find project root (2 levels up from .claude/automation)
const projectRoot = path.join(__dirname, '..', '..');
const CONFIG = {
  pagesDir: path.join(projectRoot, 'src/pages'),
  routerFile: path.join(projectRoot, 'src/RouterApp.jsx'),
  contentUpdateFile: path.join(projectRoot, '.claude/automation/content-update.js'),
};

// Validation helpers
function validatePageName(name) {
  if (!name) {
    return { valid: false, error: 'Page name is required' };
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    return { valid: false, error: 'Page name must be lowercase with hyphens only (e.g., about-alt, projects)' };
  }

  return { valid: true };
}

function capitalize(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
}

function getPageFileName(name) {
  return `${capitalize(name)}Page.jsx`;
}

function getPagePath(name) {
  return path.join(CONFIG.pagesDir, getPageFileName(name));
}

function checkPageExists(name) {
  return fs.existsSync(getPagePath(name));
}

function checkRouteExists(name) {
  const routerContent = fs.readFileSync(CONFIG.routerFile, 'utf-8');
  return routerContent.includes(`path="/${name}"`);
}

function validateCreate({ name, template }) {
  // Validate name format
  const nameCheck = validatePageName(name);
  if (!nameCheck.valid) return nameCheck;

  // Check page doesn't already exist
  if (checkPageExists(name)) {
    return { valid: false, error: `Page "${name}" already exists at ${getPagePath(name)}` };
  }

  // Check route isn't taken
  if (checkRouteExists(name)) {
    return { valid: false, error: `Route "/${name}" is already in use` };
  }

  // Validate template exists
  if (!checkPageExists(template)) {
    return { valid: false, error: `Template page "${template}" not found` };
  }

  return { valid: true };
}

function validateDelete({ name }) {
  // Validate name format
  const nameCheck = validatePageName(name);
  if (!nameCheck.valid) return nameCheck;

  // Check page exists
  if (!checkPageExists(name)) {
    return { valid: false, error: `Page "${name}" does not exist` };
  }

  // Prevent deletion of core pages
  const corePages = ['home', 'about', 'works', 'hands'];
  if (corePages.includes(name)) {
    return { valid: false, error: `Cannot delete core page "${name}"` };
  }

  return { valid: true };
}

// Git helpers
function createCheckpoint(message) {
  const timestamp = Math.floor(Date.now() / 1000);
  const tag = `checkpoint-${timestamp}`;

  try {
    execSync(`git add -A`, { stdio: 'pipe' });
    execSync(`git commit -m "Checkpoint: ${message}" || true`, { stdio: 'pipe' });
    execSync(`git tag -a "${tag}" -m "${message}"`, { stdio: 'pipe' });
    console.log(`✅ Created checkpoint: ${tag}`);
    return tag;
  } catch (error) {
    console.error('⚠️  Warning: Could not create git checkpoint');
    return null;
  }
}

function rollback(tag) {
  if (!tag) {
    console.log('⚠️  No checkpoint available for rollback');
    return false;
  }

  try {
    execSync(`git reset --hard ${tag}`, { stdio: 'pipe' });
    execSync(`git tag -d ${tag}`, { stdio: 'pipe' });
    console.log(`✅ Rolled back to checkpoint: ${tag}`);
    return true;
  } catch (error) {
    console.error(`❌ Rollback failed: ${error.message}`);
    return false;
  }
}

function deleteCheckpoint(tag) {
  if (!tag) return;

  try {
    execSync(`git tag -d ${tag}`, { stdio: 'pipe' });
  } catch (error) {
    // Ignore errors - checkpoint might not exist
  }
}

// Build validation
function validateBuild() {
  console.log('🔨 Testing build...');

  try {
    execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
    console.log('✅ Build successful');
    return true;
  } catch (error) {
    console.error('❌ Build failed');
    return false;
  }
}

// Page creation logic
function createPage({ name, template, headline, subtitle, body, background }) {
  console.log(`\n📄 Creating page: ${name} (template: ${template})`);

  // Read template content
  const templatePath = getPagePath(template);
  let content = fs.readFileSync(templatePath, 'utf-8');

  // Replace component name
  const templateComponentName = `${capitalize(template)}Page`;
  const newComponentName = `${capitalize(name)}Page`;
  content = content.replace(new RegExp(templateComponentName, 'g'), newComponentName);

  // Update content sections if provided
  if (headline) {
    const h1Regex = /(<h1[^>]*>)(.*?)(<\/h1>)/s;
    if (h1Regex.test(content)) {
      content = content.replace(h1Regex, `$1${headline}$3`);
      console.log(`  ✓ Updated headline: "${headline}"`);
    }
  }

  if (subtitle) {
    const subtitlePatterns = [
      /(<p[^>]*TYPOGRAPHY\.h2[^>]*>)(.*?)(<\/p>)/s,
      /(<p className="[^"]*text-lg[^"]*"[^>]*>)(.*?)(<\/p>)/s,
      /(<p style=\{[^}]*TYPOGRAPHY\.h2[^}]*\}>)(.*?)(<\/p>)/s
    ];
    for (const regex of subtitlePatterns) {
      if (regex.test(content)) {
        content = content.replace(regex, `$1${subtitle}$3`);
        console.log(`  ✓ Updated subtitle: "${subtitle}"`);
        break;
      }
    }
  }

  if (body) {
    const bodyPatterns = [
      /(<p[^>]*TYPOGRAPHY\.body[^>]*>)(.*?)(<\/p>)/s,
      /(<p style=\{[^}]*TYPOGRAPHY\.body[^}]*\}>)(.*?)(<\/p>)/s
    ];
    for (const regex of bodyPatterns) {
      if (regex.test(content)) {
        content = content.replace(regex, `$1${body}$3`);
        console.log(`  ✓ Updated body: "${body.substring(0, 50)}..."`);
        break;
      }
    }
  }

  if (background) {
    const bgRegex = /(backgroundImage:.*?url\(['\"])(.*?)(['\"])/;
    if (bgRegex.test(content)) {
      content = content.replace(bgRegex, `$1${background}$3`);
      console.log(`  ✓ Updated background image`);
    }
  }

  // Write new page file
  const newPagePath = getPagePath(name);

  if (args['dry-run']) {
    console.log(`\n[DRY RUN] Would create: ${newPagePath}`);
    console.log(`[DRY RUN] Content preview:\n${content.substring(0, 300)}...\n`);
    return { success: true, dryRun: true };
  }

  fs.writeFileSync(newPagePath, content);
  console.log(`  ✓ Created: ${newPagePath}`);

  // Update RouterApp.jsx
  updateRouter({ name, action: 'add' });

  // Update content-update.js PAGE_FILES mapping
  updateContentUpdateMapping({ name, action: 'add' });

  return { success: true, path: newPagePath };
}

function updateRouter({ name, action }) {
  console.log(`\n🔀 Updating router...`);

  let routerContent = fs.readFileSync(CONFIG.routerFile, 'utf-8');
  const componentName = `${capitalize(name)}Page`;

  if (action === 'add') {
    // Add import at top
    const importStatement = `import ${componentName} from './pages/${componentName}';`;

    // Find the last import statement
    const lastImportMatch = routerContent.match(/import .* from .*;\n/g);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      routerContent = routerContent.replace(lastImport, `${lastImport}${importStatement}\n`);
      console.log(`  ✓ Added import for ${componentName}`);
    }

    // Add route
    const routeStatement = `        <Route path="/${name}" element={<${componentName} />} />`;

    // Find the last Route statement before </Routes>
    const routesEndMatch = routerContent.match(/( *)<\/Routes>/);
    if (routesEndMatch) {
      routerContent = routerContent.replace('</Routes>', `${routeStatement}\n${routesEndMatch[1]}</Routes>`);
      console.log(`  ✓ Added route: /${name}`);
    }
  } else if (action === 'remove') {
    // Remove import
    const importRegex = new RegExp(`import ${componentName} from .*;\n`, 'g');
    routerContent = routerContent.replace(importRegex, '');
    console.log(`  ✓ Removed import for ${componentName}`);

    // Remove route
    const routeRegex = new RegExp(`.*<Route path="/${name}".*/>.*\n`, 'g');
    routerContent = routerContent.replace(routeRegex, '');
    console.log(`  ✓ Removed route: /${name}`);
  }

  if (!args['dry-run']) {
    fs.writeFileSync(CONFIG.routerFile, routerContent);
  } else {
    console.log(`[DRY RUN] Would update: ${CONFIG.routerFile}`);
  }
}

function updateContentUpdateMapping({ name, action }) {
  console.log(`\n📝 Updating content-update.js mapping...`);

  let content = fs.readFileSync(CONFIG.contentUpdateFile, 'utf-8');

  if (action === 'add') {
    // Find PAGE_FILES object
    const pageFilesRegex = /(const PAGE_FILES = \{[^}]*)(};)/s;
    const match = content.match(pageFilesRegex);

    if (match) {
      const newEntry = `  '${name}': 'src/pages/${getPageFileName(name)}',\n`;
      const updated = content.replace(pageFilesRegex, `$1${newEntry}$2`);

      if (!args['dry-run']) {
        fs.writeFileSync(CONFIG.contentUpdateFile, updated);
        console.log(`  ✓ Added '${name}' to PAGE_FILES mapping`);
      } else {
        console.log(`[DRY RUN] Would add '${name}' to PAGE_FILES mapping`);
      }
    }
  } else if (action === 'remove') {
    // Remove entry from PAGE_FILES
    const entryRegex = new RegExp(`  '${name}': 'src/pages/${getPageFileName(name)}',\n`, 'g');
    const updated = content.replace(entryRegex, '');

    if (!args['dry-run']) {
      fs.writeFileSync(CONFIG.contentUpdateFile, updated);
      console.log(`  ✓ Removed '${name}' from PAGE_FILES mapping`);
    } else {
      console.log(`[DRY RUN] Would remove '${name}' from PAGE_FILES mapping`);
    }
  }
}

function deletePage({ name }) {
  console.log(`\n🗑️  Deleting page: ${name}`);

  const pagePath = getPagePath(name);

  if (args['dry-run']) {
    console.log(`[DRY RUN] Would delete: ${pagePath}`);
    console.log(`[DRY RUN] Would update router and content-update.js`);
    return { success: true, dryRun: true };
  }

  // Delete page file
  fs.unlinkSync(pagePath);
  console.log(`  ✓ Deleted: ${pagePath}`);

  // Update router
  updateRouter({ name, action: 'remove' });

  // Update content-update.js
  updateContentUpdateMapping({ name, action: 'remove' });

  return { success: true };
}

// Git commit
function commitChanges(message) {
  if (args['no-commit']) {
    console.log('\n⏭️  Skipping git commit (--no-commit flag)');
    return;
  }

  console.log('\n📦 Committing changes...');

  try {
    execSync('git add -A', { stdio: 'pipe' });
    execSync(`git commit -m "${message}"`, { stdio: 'pipe' });
    execSync('git push', { stdio: 'pipe' });
    console.log('✅ Changes committed and pushed');
  } catch (error) {
    console.error('⚠️  Warning: Could not commit changes');
    console.error(error.message);
  }
}

// Main execution
async function main() {
  const { action, name, template, source, headline, subtitle, body, background } = args;

  // Validate action
  if (!action) {
    console.error('❌ Error: --action is required (create, duplicate, or delete)');
    process.exit(1);
  }

  console.log(`\n🚀 Page Manager - Action: ${action}`);

  let checkpoint = null;
  let result = null;

  try {
    if (action === 'create') {
      // Validate
      const validation = validateCreate({ name, template });
      if (!validation.valid) {
        console.error(`❌ Validation failed: ${validation.error}`);
        process.exit(1);
      }

      // Preview mode
      if (args.preview) {
        console.log('\n📋 PREVIEW MODE - No changes will be made');
        console.log(`\nWould create:`);
        console.log(`  Page: ${name}`);
        console.log(`  Template: ${template}`);
        console.log(`  File: ${getPagePath(name)}`);
        console.log(`  Route: /${name}`);
        if (headline) console.log(`  Headline: "${headline}"`);
        if (subtitle) console.log(`  Subtitle: "${subtitle}"`);
        if (body) console.log(`  Body: "${body.substring(0, 50)}..."`);
        if (background) console.log(`  Background: ${background}`);
        process.exit(0);
      }

      // Create checkpoint
      checkpoint = createCheckpoint(`Before creating page: ${name}`);

      // Create page
      result = createPage({ name, template, headline, subtitle, body, background });

    } else if (action === 'duplicate') {
      // Use source as template
      const duplicateTemplate = source || template;

      // Validate
      const validation = validateCreate({ name, template: duplicateTemplate });
      if (!validation.valid) {
        console.error(`❌ Validation failed: ${validation.error}`);
        process.exit(1);
      }

      // Preview mode
      if (args.preview) {
        console.log('\n📋 PREVIEW MODE - No changes will be made');
        console.log(`\nWould duplicate:`);
        console.log(`  Source: ${duplicateTemplate}`);
        console.log(`  New page: ${name}`);
        console.log(`  File: ${getPagePath(name)}`);
        console.log(`  Route: /${name}`);
        if (headline) console.log(`  Modified headline: "${headline}"`);
        if (subtitle) console.log(`  Modified subtitle: "${subtitle}"`);
        if (body) console.log(`  Modified body: "${body.substring(0, 50)}..."`);
        process.exit(0);
      }

      // Create checkpoint
      checkpoint = createCheckpoint(`Before duplicating page: ${duplicateTemplate} -> ${name}`);

      // Duplicate page (same as create with source as template)
      result = createPage({ name, template: duplicateTemplate, headline, subtitle, body, background });

    } else if (action === 'delete') {
      // Validate
      const validation = validateDelete({ name });
      if (!validation.valid) {
        console.error(`❌ Validation failed: ${validation.error}`);
        process.exit(1);
      }

      // Preview mode
      if (args.preview) {
        console.log('\n📋 PREVIEW MODE - No changes will be made');
        console.log(`\nWould delete:`);
        console.log(`  Page: ${name}`);
        console.log(`  File: ${getPagePath(name)}`);
        console.log(`  Route: /${name}`);
        process.exit(0);
      }

      // Create checkpoint
      checkpoint = createCheckpoint(`Before deleting page: ${name}`);

      // Delete page
      result = deletePage({ name });

    } else {
      console.error(`❌ Error: Unknown action "${action}"`);
      process.exit(1);
    }

    // Dry run - exit early
    if (result && result.dryRun) {
      console.log('\n✅ Dry run complete - no changes made');
      deleteCheckpoint(checkpoint);
      process.exit(0);
    }

    // Build validation
    if (!args['no-build']) {
      const buildSuccess = validateBuild();

      if (!buildSuccess) {
        console.error('\n❌ Build validation failed - rolling back changes');
        rollback(checkpoint);
        process.exit(1);
      }
    } else {
      console.log('\n⏭️  Skipping build validation (--no-build flag)');
    }

    // Success - delete checkpoint
    deleteCheckpoint(checkpoint);

    // Commit changes
    let commitMessage = '';
    if (action === 'create') {
      commitMessage = `Add: New page "${name}" from template "${template}"`;
    } else if (action === 'duplicate') {
      commitMessage = `Add: Duplicate page "${name}" from "${source || template}"`;
    } else if (action === 'delete') {
      commitMessage = `Remove: Page "${name}"`;
    }

    commitChanges(commitMessage);

    console.log('\n✅ Success!');
    console.log(`\nPage "${name}" is now available at: http://localhost:5173/${name}`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);

    if (checkpoint) {
      console.log('\n🔄 Rolling back changes...');
      rollback(checkpoint);
    }

    process.exit(1);
  }
}

// Run
main();
