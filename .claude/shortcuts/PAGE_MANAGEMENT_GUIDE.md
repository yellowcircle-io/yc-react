# Page Management Guide

Complete guide for creating, duplicating, editing, and deleting pages via mobile shortcuts and command line.

**Updated:** November 21, 2025
**Status:** Phase 1 Complete - Page Creation/Duplication System Live

---

## 🎯 Overview

The page management system allows you to create, duplicate, and delete yellowCircle pages from iPhone (via SSH) or command line with automatic:

- ✅ **Validation** - Pre-flight checks (name format, route availability, template existence)
- ✅ **Preview Mode** - See changes before applying
- ✅ **Rollback** - Automatic git checkpoint and rollback on build failure
- ✅ **Content Editing** - Update headline, subtitle, body, background during creation
- ✅ **Router Updates** - Automatically add/remove routes in RouterApp.jsx
- ✅ **Git Automation** - Auto-commit and push changes

---

## 📋 Targeting Rules

### Format Pattern

All page management commands follow this pattern:

```bash
--action=[ACTION] --template=[TEMPLATE] --name=[NAME] --section=[CONTENT]
```

### Actions

| Action | Description | Required Parameters |
|--------|-------------|---------------------|
| `create` | Create new page from template | `--template`, `--name` |
| `duplicate` | Duplicate existing page | `--source`, `--name` |
| `delete` | Delete a page | `--name` |

### Content Sections (Optional During Creation)

| Section | Aliases | Updates |
|---------|---------|---------|
| `--headline` | None | Main page heading (h1) |
| `--subtitle` | None | Subheading paragraph (h2) |
| `--body` | None | Main body paragraph |
| `--background` | None | Background image URL |

### Validation Rules

**Page Names:**
- Must be lowercase
- Can include hyphens (e.g., `about-alt`, `my-page`)
- Cannot include spaces or special characters
- Must be unique (no duplicate routes)

**Examples:**
- ✅ `projects`, `about-alt`, `contact-form`
- ❌ `Projects`, `About_Page`, `my page`

---

## 🚀 Usage Examples

### 1. Create New Page

**Basic Creation (Template Only):**
```bash
cd .claude/automation
node page-manager.js --action=create --template=about --name=projects
```

**With Content Customization:**
```bash
node page-manager.js --action=create \
  --template=about \
  --name=projects \
  --headline="PROJECTS." \
  --subtitle="Portfolio of creative work" \
  --body="Explore my portfolio of projects spanning design, development, and marketing."
```

**With Background Image:**
```bash
node page-manager.js --action=create \
  --template=about \
  --name=gallery \
  --headline="GALLERY." \
  --background="https://res.cloudinary.com/yellowcircle-io/image/upload/v1/gallery.jpg"
```

### 2. Duplicate Existing Page

**Duplicate with Same Content:**
```bash
node page-manager.js --action=duplicate --source=about --name=about-alt
```

**Duplicate with Modified Content:**
```bash
node page-manager.js --action=duplicate \
  --source=about \
  --name=about-vertical \
  --headline="ABOUT ME." \
  --subtitle="New perspective" \
  --body="A different take on my story."
```

### 3. Delete Page

**Delete a Page:**
```bash
node page-manager.js --action=delete --name=projects
```

**Note:** Core pages (home, about, works, hands) cannot be deleted.

### 4. Preview Mode (Dry Run)

**Preview Before Creating:**
```bash
node page-manager.js --action=create \
  --template=about \
  --name=contact \
  --headline="CONTACT." \
  --preview
```

Output:
```
📋 PREVIEW MODE - No changes will be made

Would create:
  Page: contact
  Template: about
  File: /path/to/ContactPage.jsx
  Route: /contact
  Headline: "CONTACT."
```

### 5. Skip Build Validation (Faster Testing)

```bash
node page-manager.js --action=create \
  --template=about \
  --name=test-page \
  --no-build
```

**Warning:** Skipping build validation means errors won't be caught until deployment.

### 6. Skip Git Commit (Manual Control)

```bash
node page-manager.js --action=create \
  --template=about \
  --name=draft-page \
  --no-commit
```

Use this when you want to review changes before committing.

---

## 📱 Using from iPhone Shortcuts

### Via Router Commands

**Available Commands:**
- `create-page` - Create new page
- `duplicate-page` - Duplicate existing page
- `delete-page` - Delete a page

**SSH Command Format:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js create-page --template=about --name=projects --headline="PROJECTS."
```

**Important:** Arguments with spaces need to be quoted in the shortcut. For complex content, it's easier to create the page first, then edit content using the existing `content` command.

### Recommended iPhone Workflow

**Step 1: Create Page (Basic)**
```
SSH Command:
cd .claude/automation && node page-manager.js --action=create --template=about --name=projects
```

**Step 2: Edit Content (Using Existing Content Command)**
```
Command: content
Page: projects
Section: headline
Text: PROJECTS.
```

```
Command: content
Page: projects
Section: subtitle
Text: Portfolio of creative work
```

```
Command: content
Page: projects
Section: body
Text: Explore my portfolio of projects spanning design, development, and marketing.
```

This approach is cleaner for mobile because:
- Simpler commands
- No complex quoting issues
- Uses proven content editing system
- Can edit in multiple steps

---

## 🔍 What Happens Behind the Scenes

When you create a page, the system automatically:

1. **Validates** the page name and checks for conflicts
2. **Creates git checkpoint** for rollback if needed
3. **Copies template** to new page file (e.g., `ProjectsPage.jsx`)
4. **Updates component name** throughout the file
5. **Replaces content sections** (headline, subtitle, body, background)
6. **Updates RouterApp.jsx**:
   - Adds import statement
   - Adds route definition
7. **Updates content-update.js**:
   - Adds page to PAGE_FILES mapping (enables mobile editing)
8. **Runs build validation** to ensure no errors
9. **Commits and pushes** to git
10. **Deletes checkpoint** (success)

If anything fails:
- **Automatic rollback** to git checkpoint
- Error message shows what went wrong
- No changes are persisted

---

## 🎨 Available Templates

| Template | Description | Best For |
|----------|-------------|----------|
| `about` | Single page vertical layout | Profile, bio, contact pages |
| `works` | Portfolio layout | Project galleries, case studies |
| `hands` | Interactive layout | Experience, skills |
| `home` | Horizontal scrolling | Landing pages, carousels |
| `experiments` | Experimental layout | Prototypes, tests |
| `thoughts` | Blog/article layout | Writing, articles, blog posts |

**Recommendation:** Start with `about` template for most new pages - it's the most flexible and includes all standard sections (headline, subtitle, body).

---

## ✅ Validation & Safety

### Pre-Flight Checks

Before creating/duplicating:
- ✓ Page name format is valid
- ✓ Page doesn't already exist
- ✓ Route isn't taken
- ✓ Template exists

### Post-Change Checks

After creating/duplicating:
- ✓ Build compiles successfully
- ✓ No syntax errors
- ✓ Routes resolve correctly

### Automatic Rollback

Rollback triggers on:
- Build failure
- Unhandled errors during creation
- File system errors

Manual rollback:
```bash
git log --tags  # Find checkpoint tag
git reset --hard checkpoint-TIMESTAMP
```

---

## 📝 Editing Pages After Creation

Once a page is created, you can edit it using the existing `content` command (see CONTENT_EXPANSION_GUIDE.md):

**From iPhone:**
```
Command: content
Page: projects
Section: headline
Text: NEW HEADLINE
```

**From Command Line:**
```bash
node content-update.js --page=projects --section=headline --text="NEW HEADLINE"
```

**Available Sections:**
- `headline` (or `h1`)
- `subtitle` (or `description`, `tagline`)
- `body` (or `bodycopy`, `bodytext`)
- `background` (or `bg`, `bgimage`)

---

## 🚨 Common Issues & Solutions

### Issue: Page name already exists

**Error:** `Page "projects" already exists at /path/to/ProjectsPage.jsx`

**Solution:** Choose a different name or delete the existing page first:
```bash
node page-manager.js --action=delete --name=projects
```

### Issue: Route already in use

**Error:** `Route "/projects" is already in use`

**Solution:** Check RouterApp.jsx for duplicate routes. The route may exist but the page file doesn't. Clean up RouterApp.jsx manually.

### Issue: Build fails after creation

**System Response:** Automatic rollback to checkpoint

**What to check:**
1. Template file has syntax errors
2. Content includes special characters that break JSX
3. Background URL is malformed

**How to debug:**
```bash
# Create with --no-build to skip validation
node page-manager.js --action=create --template=about --name=test --no-build

# Run build manually to see error
npm run build
```

### Issue: Arguments with spaces get truncated

**Example:** `--subtitle="Get in touch"` becomes just `"Get"`

**Solution:** When using via iPhone shortcut, either:
1. Create page first, then edit content separately using `content` command
2. Use underscores instead of spaces: `--subtitle="Get_in_touch"` then edit later

---

## 🔜 Roadmap

### Phase 1 (Complete) ✅
- Page creation from templates
- Page duplication
- Page deletion
- Content section editing during creation
- Validation and rollback system

### Phase 2 (Planned)
- Global components editing (footer, header, colors)
- Navigation structure editing
- Multiple body paragraphs support
- List items and custom sections

### Phase 3 (Planned)
- Horizontal page management (add/remove carousel pages)
- Layout modifications (horizontal ↔ vertical)
- Advanced component customization

### Phase 4 (Planned)
- Simple GUI on site for inline editing
- Admin panel for complex changes
- Visual page builder

---

## 📚 Related Documentation

- **CONTENT_EXPANSION_GUIDE.md** - How to edit existing pages
- **EXTENDED_FUNCTIONALITY_SPEC.md** - Technical specification for all phases
- **.claude/automation/page-manager.js** - Source code for page management
- **.claude/automation/shortcut-router.js** - Command routing system

---

## 🎯 Quick Reference

### Create Page
```bash
node page-manager.js --action=create --template=TEMPLATE --name=NAME
```

### Duplicate Page
```bash
node page-manager.js --action=duplicate --source=SOURCE --name=NAME
```

### Delete Page
```bash
node page-manager.js --action=delete --name=NAME
```

### Preview Changes
```bash
# Add --preview to any command
node page-manager.js --action=create --template=about --name=test --preview
```

### Skip Build/Commit
```bash
# Add --no-build and/or --no-commit
node page-manager.js --action=create --template=about --name=test --no-build --no-commit
```

---

**Status:** Phase 1 operational - tested and validated
**Last Updated:** November 21, 2025
**Next:** Phase 2 planning (global components editing)
