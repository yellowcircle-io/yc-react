# Extended iPhone Shortcut Functionality - Specification

**Created:** November 21, 2025
**Purpose:** Phased approach to building content management via iPhone shortcuts
**Use Case:** Content page creation in lieu of CMS (future CMS planned)

---

## 🎯 Priority Order (Phased Approach)

### **Phase 1: Page Creation/Duplication (PRIORITY)**
- Create new pages based on existing templates
- Duplicate pages with modifications
- Standard component editing (headline, sub-header, paragraph, copy)
- **Timeline:** 3-5 hours
- **Status:** Ready to build

### **Phase 2: Global Components Editing**
- Footer, Header, Sidebar universal changes
- Color/theme customization
- Typography adjustments
- **Timeline:** 2-3 hours
- **Status:** After Phase 1

### **Phase 3: Navigation Editing**
- Add/remove nav items
- Reorder sidebar structure
- Icon and label updates
- **Timeline:** 2-3 hours
- **Status:** After Phase 2

### **Phase 4: Horizontal Page Management**
- Add/remove carousel pages
- Reorder horizontal scroll sections
- Background management
- **Timeline:** 3-4 hours
- **Status:** After Phase 3

---

## 🛡️ Failsafes & Validation System

### 1. **Preview Mode**
Every change creates a preview before committing:

```javascript
// Preview flow:
1. Create changes in memory
2. Show diff (before/after)
3. Wait for confirmation
4. Apply changes
5. Commit to git
```

**Implementation:**
```bash
# iPhone shortcut adds --preview flag
node shortcut-router.js create-page --name=about-alt --template=about --preview

# Output shows:
📋 PREVIEW: New page "AboutAlt"
- File: src/pages/AboutAltPage.jsx
- Route: /about-alt
- Template: AboutPage.jsx
- Changes: 3 files affected

Reply "confirm" to proceed, "cancel" to abort
```

### 2. **Automatic Rollback**
Every change creates a git checkpoint:

```javascript
// Rollback system:
1. Before change: Create git tag with timestamp
2. After change: Test build compilation
3. If build fails: Auto-rollback to tag
4. If build succeeds: Keep change, push to GitHub
```

**Implementation:**
```bash
# Before change
git tag -a "checkpoint-$(date +%s)" -m "Before: Create AboutAlt page"

# After change, test
npm run build

# If fails:
git reset --hard checkpoint-TIMESTAMP
echo "❌ Change reverted - build failed"

# If succeeds:
git tag -d checkpoint-TIMESTAMP  # Remove checkpoint
git push
```

### 3. **Validation Checks**

**Pre-flight validation:**
```javascript
validatePageCreation({
  name: "about-alt",
  template: "about"
}) {
  // 1. Check name is valid (lowercase, hyphens only)
  if (!/^[a-z0-9-]+$/.test(name)) {
    return { valid: false, error: "Name must be lowercase with hyphens only" };
  }

  // 2. Check page doesn't already exist
  if (fs.existsSync(`src/pages/${capitalize(name)}Page.jsx`)) {
    return { valid: false, error: "Page already exists" };
  }

  // 3. Check template exists
  if (!fs.existsSync(`src/pages/${capitalize(template)}Page.jsx`)) {
    return { valid: false, error: "Template page not found" };
  }

  // 4. Check route isn't taken
  const routerContent = fs.readFileSync('src/RouterApp.jsx', 'utf-8');
  if (routerContent.includes(`path="/${name}"`)) {
    return { valid: false, error: "Route already in use" };
  }

  return { valid: true };
}
```

**Post-change validation:**
```javascript
validateAfterChange() {
  // 1. Build compiles
  try {
    execSync('npm run build', { stdio: 'pipe' });
  } catch {
    return { valid: false, error: "Build failed - syntax error" };
  }

  // 2. No duplicate routes
  const routes = extractRoutes('src/RouterApp.jsx');
  if (hasDuplicates(routes)) {
    return { valid: false, error: "Duplicate routes detected" };
  }

  // 3. All imports resolve
  const imports = extractImports('src/RouterApp.jsx');
  for (const imp of imports) {
    if (!fs.existsSync(imp.path)) {
      return { valid: false, error: `Missing import: ${imp.path}` };
    }
  }

  return { valid: true };
}
```

### 4. **Dry-Run Mode**
Test changes without writing files:

```bash
# iPhone shortcut adds --dry-run flag
node shortcut-router.js create-page --name=about-alt --template=about --dry-run

# Output shows what WOULD happen:
🔍 DRY RUN - No files will be modified

Would create:
- src/pages/AboutAltPage.jsx (143 lines)

Would modify:
- src/RouterApp.jsx (+2 lines)
  Line 15: import AboutAltPage from './pages/AboutAltPage';
  Line 42: <Route path="/about-alt" element={<AboutAltPage />} />

- .claude/automation/content-update.js (+1 line)
  Line 50: 'about-alt': 'src/pages/AboutAltPage.jsx',

No changes made.
```

---

## 📋 Phase 1: Page Creation/Duplication Specification

### Use Cases

**1. Create New Page from Template**
```bash
# iPhone shortcut input:
Action: create
Template: about
Name: about-alt
Headline: ABOUT (ALTERNATIVE)
Subtitle: Designer, Developer, Strategist
Body: Alternative bio text here
```

**2. Duplicate Page with Modifications**
```bash
# iPhone shortcut input:
Action: duplicate
Source: about
Name: about-vertical
Modifications: remove-horizontal-scroll, change-layout-vertical
Headline: ABOUT
Subtitle: Product Manager | Developer
Body: Vertical layout bio text
```

**3. Create Horizontal Scroll Variant**
```bash
# iPhone shortcut input:
Action: create
Template: home
Name: projects
Style: horizontal
Pages: 3
Backgrounds: url1,url2,url3
```

### Targeting Rules (Documented)

**Rule Format:**
```
--page="PAGE_NAME" --section="SECTION_NAME" --change="NEW_VALUE"
```

**Available Sections (Standard Components):**

| Section | Component | Example | Notes |
|---------|-----------|---------|-------|
| `headline` | H1 tag | `ABOUT.` | Main page heading |
| `subtitle` | H2 paragraph | `Marketer, designer, developer` | Subheading text |
| `body` | Body paragraph | `Building meaningful experiences...` | Main copy |
| `background` | Background image | `https://cloudinary.com/...` | Page background |
| `route` | URL path | `/about` | Page route (read-only for safety) |
| `title` | Page title | `About - yellowCircle` | Browser tab title |
| `navigation-label` | Nav item | `ABOUT` | Sidebar label |

**Advanced Sections (Added in later phases):**

| Section | Component | Example | Phases |
|---------|-----------|---------|--------|
| `footer-email` | Footer contact | `hello@yellowcircle.io` | Phase 2 |
| `footer-phone` | Footer contact | `(555) 123-4567` | Phase 2 |
| `color-primary` | Brand color | `rgb(238, 207, 0)` | Phase 2 |
| `nav-icon` | Navigation icon | `https://cloudinary.com/icon.png` | Phase 3 |
| `nav-subitems` | Nested nav | `Projects,Thoughts,About` | Phase 3 |
| `horizontal-page-1` | Carousel page 1 | `https://bg1.jpg` | Phase 4 |

### Example Targeting (About Page Tests)

**From existing tests:**
```bash
# Test 1: Update headline
--page=about --section=headline --change="ABOUT."

# Test 2: Update subtitle
--page=about --section=subtitle --change="Marketer, designer, developer. Explorer"

# Test 3: Update body
--page=about --section=body --change="Building meaningful digital experiences..."

# Test 4: Update background
--page=about --section=background --change="https://res.cloudinary.com/.../new-bg.jpg"
```

**New targeting (Phase 1):**
```bash
# Create new page
--action=create --template=about --name=about-alt --headline="ABOUT ALT" --subtitle="New subtitle" --body="New body text"

# Duplicate page
--action=duplicate --source=about --name=about-vertical --modifications="vertical-layout"

# Update created page
--page=about-alt --section=headline --change="UPDATED HEADLINE"
```

### File Structure

**New script:** `.claude/automation/page-manager.js`

```javascript
#!/usr/bin/env node

/**
 * Page Manager - Create, duplicate, and modify pages via iPhone
 *
 * Usage:
 *   node page-manager.js --action=create --template=about --name=about-alt [options]
 *   node page-manager.js --action=duplicate --source=about --name=about-vertical [options]
 *   node page-manager.js --action=delete --name=about-alt --confirm
 *
 * Options:
 *   --preview          Show changes without applying
 *   --dry-run          Test mode, no files modified
 *   --headline="text"  Set H1 text
 *   --subtitle="text"  Set H2 text
 *   --body="text"      Set body paragraph
 *   --background="url" Set background image
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Validation, preview, rollback, and execution logic
```

**Updated:** `.claude/automation/shortcut-router.js`

```javascript
const COMMANDS = {
  // ... existing commands

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
    description: 'Delete page (requires confirmation)',
    category: 'pages',
    passthrough: true
  }
};
```

### Workflow Example

**Creating "About-Alt" page from iPhone:**

```
1. iPhone Shortcut prompts:
   - Action: create
   - Template: about
   - Name: about-alt
   - Headline: ABOUT (ALTERNATIVE)
   - Subtitle: Alternative perspective
   - Body: Different bio text

2. SSH to Mac Mini executes:
   cd .claude/automation
   node shortcut-router.js create-page \
     --template=about \
     --name=about-alt \
     --headline="ABOUT (ALTERNATIVE)" \
     --subtitle="Alternative perspective" \
     --body="Different bio text" \
     --preview

3. Preview output shown:
   📋 PREVIEW: Create AboutAlt page

   Files to create:
   - src/pages/AboutAltPage.jsx

   Files to modify:
   - src/RouterApp.jsx (add route)
   - .claude/automation/content-update.js (add mapping)

   Changes:
   - H1: "ABOUT (ALTERNATIVE)"
   - H2: "Alternative perspective"
   - Body: "Different bio text"

   Reply "y" to confirm

4. User confirms: "y"

5. Execution:
   ✅ Created src/pages/AboutAltPage.jsx
   ✅ Updated src/RouterApp.jsx (route added)
   ✅ Updated content-update.js (mapping added)
   ✅ Build test: PASSED
   ✅ Git committed
   ✅ Pushed to GitHub

   🎉 Page created: /about-alt
   Live in ~60 seconds at yellowcircle-app.web.app/about-alt

6. iPhone shows success alert
```

---

## 🖥️ GUI Feasibility Scope

### Option 1: Inline Editing (Simplest)

**What it is:**
- Click any text on page → edit in place
- Similar to Squarespace/Wix inline editing
- No separate admin panel

**How it works:**
```javascript
// Add to all pages:
<div
  contentEditable={editMode}
  onBlur={(e) => saveChange('headline', e.target.innerText)}
>
  {headline}
</div>

// Enable edit mode:
// URL: yellowcircle-app.web.app/about?edit=true
```

**Feasibility:**
- ✅ **Easy:** 2-3 hours to implement basic version
- ✅ **Low risk:** Doesn't affect production (edit mode toggle)
- ✅ **Mobile-friendly:** Works on iPhone/iPad
- ⚠️ **Limited:** Only text editing, no page creation

**Implementation:**
```javascript
// 1. Add EditModeContext
// 2. Wrap editable elements
// 3. Save changes to localStorage
// 4. Export as JSON
// 5. Apply via content-update.js

// Edit mode activated by:
// yellowcircle-app.web.app/about?edit=SECRET_KEY
```

---

### Option 2: Admin Panel (More Features)

**What it is:**
- Dedicated `/admin` page
- Form-based editing
- Page management interface
- Preview changes before publishing

**How it works:**
```
/admin
├─ Pages
│  ├─ List all pages
│  ├─ Edit page content
│  ├─ Create new page (form)
│  └─ Delete page (confirmation)
├─ Navigation
│  └─ Edit sidebar items
├─ Global
│  ├─ Colors
│  ├─ Footer
│  └─ Header
└─ Preview
   └─ See changes before publish
```

**Feasibility:**
- ⚠️ **Moderate:** 8-12 hours to build
- ⚠️ **Authentication needed:** Password protect /admin
- ✅ **Full features:** Create pages, edit navigation, global changes
- ⚠️ **More complex:** Requires backend API or localStorage export

**Implementation:**
```javascript
// 1. Create AdminPage.jsx
// 2. Build forms for each section
// 3. Store changes in state
// 4. Export as JSON
// 5. Apply via content-update.js OR GitHub API
```

---

### Option 3: Hybrid (Best of Both)

**What it is:**
- Inline editing for quick text changes
- Admin panel for page creation and navigation
- Mobile-optimized interface

**How it works:**
```
// Quick edit (inline):
yellowcircle-app.web.app/about?edit=true
→ Click headline → edit → save

// Advanced edit (admin):
yellowcircle-app.web.app/admin
→ Create page → set all properties → preview → publish
```

**Feasibility:**
- ⚠️ **Complex:** 12-15 hours total
- ✅ **Best UX:** Simple for quick edits, powerful for complex tasks
- ✅ **Progressive:** Build inline first, add admin later
- ⚠️ **Requires planning:** Careful architecture for export/import

---

### Recommended Approach: **Phased GUI**

**Phase 1A: Inline Text Editing (2-3 hours)**
- Build first alongside page creation
- URL param: `?edit=SECRET_KEY` activates edit mode
- Click text → edit → auto-save to localStorage
- Export button → generate JSON → copy to iPhone shortcut
- **Result:** Quick text edits on actual site

**Phase 1B: Page Creation Form (3-4 hours)**
- Simple form at `/admin/create-page`
- Template selection dropdown
- Name, headline, subtitle, body inputs
- Preview button shows mock
- Submit → exports JSON → apply via shortcut-router
- **Result:** Create pages via web form instead of iPhone prompts

**Phase 2: Admin Dashboard (8-10 hours)**
- Full `/admin` panel
- All editing features (navigation, colors, global)
- Authentication (password or GitHub OAuth)
- Direct git commit (no export needed)
- **Result:** Full CMS-lite

---

## 🎯 Technical Architecture

### Data Flow

**iPhone Shortcut → SSH → Git:**
```
iPhone
  ↓ (SSH)
Mac Mini
  ↓ (node page-manager.js)
Validation → Preview → Confirmation
  ↓
File Creation/Modification
  ↓
Build Test
  ↓ (if pass)
Git Commit → GitHub Push
  ↓
Firebase Auto-Deploy
  ↓
Live on yellowcircle-app.web.app
```

**GUI → Export → iPhone Shortcut:**
```
Browser (yellowcircle-app.web.app/about?edit=true)
  ↓ (click text, edit)
localStorage (save changes)
  ↓ (export button)
JSON export
  ↓ (copy to clipboard)
iPhone Shortcut (paste JSON as input)
  ↓ (SSH to Mac)
Apply changes via content-update.js
  ↓
Git Commit → Push → Deploy
```

**GUI → Direct Commit (Phase 2):**
```
Browser (yellowcircle-app.web.app/admin)
  ↓ (GitHub API token)
Authenticate
  ↓ (make changes)
Preview
  ↓ (confirm)
GitHub API: Create commit
  ↓
GitHub Actions: Auto-deploy
  ↓
Live on yellowcircle-app.web.app
```

---

## 📊 Comparison Matrix

| Feature | iPhone Shortcut Only | + Inline Editing | + Admin Panel | Full CMS |
|---------|---------------------|------------------|---------------|----------|
| **Text editing** | ✅ Via prompts | ✅ Click & edit | ✅ Form-based | ✅ Rich editor |
| **Page creation** | ✅ Via prompts | ❌ | ✅ Form-based | ✅ Template library |
| **Navigation editing** | Phase 3 | ❌ | ✅ | ✅ |
| **Preview changes** | Terminal only | ✅ Live preview | ✅ Mock preview | ✅ Staging env |
| **Mobile-friendly** | ✅ Native iOS | ✅ Responsive | ⚠️ Smaller screens | ⚠️ Desktop-first |
| **Setup time** | ✅ Ready now | 2-3 hours | 8-12 hours | 40+ hours |
| **Authentication** | SSH key | URL param | Password | OAuth + roles |
| **Rollback** | ✅ Git tags | ⚠️ Manual | ✅ Version history | ✅ Full versioning |
| **Cost** | $0 | $0 | $0 | Firebase/CMS fees |

---

## 🚀 Recommended Implementation Plan

### Week 1: Phase 1 (Page Creation)
**Days 1-2:** Build page-manager.js
- Create page from template
- Duplicate page with mods
- Validation and preview
- Rollback system

**Days 3-4:** Test and refine
- Create 3 test pages (about-alt, projects, contact)
- Test via iPhone shortcut
- Verify all failsafes work
- Document targeting rules

**Day 5:** GUI prototype (inline editing)
- Edit mode toggle (?edit=SECRET_KEY)
- Click-to-edit text
- localStorage save
- JSON export

### Week 2: Phase 2 (Global Components)
**Days 1-2:** Global editing
- Footer content (email, phone, links)
- Header tagline
- Color theme variables

**Days 3-4:** GUI expansion
- Admin page skeleton (/admin)
- Global settings form
- Color picker
- Preview mode

**Day 5:** Testing and docs

### Week 3-4: Phases 3-4 (Navigation + Horizontal)
- Navigation editing (Phase 3)
- Horizontal page management (Phase 4)
- Full admin panel (Phase 2 GUI complete)
- Comprehensive testing

---

## ✅ Immediate Next Steps (Today)

**1. Get Approval on Approach**
- Phased implementation plan
- Failsafe/validation strategy
- GUI scope (inline editing first)

**2. Build Phase 1 Foundation**
- Create page-manager.js script
- Implement validation system
- Add preview/rollback
- Update shortcut-router.js

**3. Test Page Creation**
- Create "about-alt" page via iPhone
- Verify all failsafes work
- Test rollback on intentional error
- Document targeting rules

**4. Prototype Inline Editing**
- Add edit mode to AboutPage
- Click-to-edit headline
- Save to localStorage
- Export as JSON

**Estimated time for today:** 4-5 hours (Phase 1 foundation + inline editing prototype)

---

## 📝 Questions for Approval

1. **Start building now?** Ready to implement Phase 1 (page creation with failsafes)

2. **GUI priority?** Should inline editing be built alongside Phase 1, or after?

3. **Secret key for edit mode?** What should the URL param be? (e.g., `?edit=YELLOWCIRCLE2025`)

4. **Test pages to create?** Which pages should I create first to test the system?
   - About-Alt (horizontal variant)?
   - Projects (new page)?
   - Contact (new page)?

5. **Rollback trigger?** Should rollback happen:
   - Only on build failure?
   - On any error?
   - Manual trigger option?

---

**Status:** Specification complete, awaiting approval to build
**Timeline:** Phase 1 ready to build today (4-5 hours)
**Next:** Create page-manager.js with full validation/preview/rollback system
