# Content Expansion Guide

Complete guide for adding new pages and editing advanced content via mobile shortcuts.

## ✅ What's Currently Editable (Mobile-Ready)

### Supported Pages:
- `home` - HomePage.jsx
- `about` - AboutPage.jsx
- `works` - WorksPage.jsx
- `hands` - HandsPage.jsx
- `experiments` - ExperimentsPage.jsx
- `thoughts` - ThoughtsPage.jsx

### Supported Sections:

**1. Headline (H1)**
```bash
--section=headline
--section=h1
```
Updates the main page heading (e.g., "ABOUT.", "WORKS.", etc.)

**2. Subtitle (H2 paragraph)**
```bash
--section=subtitle
--section=description
--section=tagline
```
Updates the subheading text (e.g., "Marketer, designer, developer. Explorer")

**3. Body Text**
```bash
--section=body
--section=bodycopy
--section=bodytext
```
Updates the main body paragraph (e.g., "building meaningful digital experiences...")

**4. Background Image**
```bash
--section=background
--section=bg
--section=bgimage
--background="https://cloudinary.url/image.jpg"
```
Updates the page background image URL

## 📱 How to Use from iPhone

### Example 1: Update Headline
```
Page: about
Section: headline
Text: ABOUT ME.
```

### Example 2: Update Subtitle
```
Page: about
Section: subtitle
Text: Product Manager | Developer | Designer
```

### Example 3: Update Body
```
Page: about
Section: body
Text: Creating digital experiences that matter. Focused on meaningful work.
```

### Example 4: Change Background
```
Page: works
Section: background
Background: https://res.cloudinary.com/.../new-image.jpg
```

## 🆕 How to Add New Pages

### Option 1: Quick Add (Template-Based)

**Create a new page file:**

1. Copy an existing page as template:
```bash
cp src/pages/AboutPage.jsx src/pages/NewPage.jsx
```

2. Update the content in NewPage.jsx:
   - Change page title/headline
   - Update subtitle and body
   - Customize navigation items

3. Add route in `src/RouterApp.jsx`:
```javascript
import NewPage from './pages/NewPage';

// In routes array:
<Route path="/new" element={<NewPage />} />
```

4. Add to PAGE_FILES mapping in content-update.js:
```javascript
const PAGE_FILES = {
  // ... existing pages
  new: 'src/pages/NewPage.jsx',
};
```

5. Now you can edit it via mobile:
```
Page: new
Section: headline
Text: NEW PAGE
```

### Option 2: Full Custom Page

For pages with unique layouts, you'll need to:
1. Create the React component file
2. Add route to RouterApp.jsx
3. Either:
   - Follow the TYPOGRAPHY pattern (headline, subtitle, body) for mobile editing
   - Or edit via Claude Code for one-time setup

## 🔧 Editing Unity Notes

**Unity Notes can be edited** but requires a different approach:

### Option A: Via Content Script (For Standard Sections)

If Unity Notes page follows the same pattern (h1, p with TYPOGRAPHY.h2, p with TYPOGRAPHY.body):

```
Page: unity-notes
Section: headline
Text: UNITY NOTES
```

But first, add to PAGE_FILES:
```javascript
const PAGE_FILES = {
  // ... existing
  'unity-notes': 'src/pages/UnityNotesPage.jsx',
};
```

### Option B: Via Claude Code (For Complex Changes)

Unity Notes has unique interactive elements (sidebar states, navigation). For these:
1. Use Claude Code desktop/web
2. Edit `src/pages/UnityNotesPage.jsx` directly
3. Commit and push via normal git workflow

## 🎨 Editing Global Components

Global components (Header, Sidebar, Footer, etc.) are **not recommended for mobile editing** because:
- They affect multiple pages
- Require careful testing
- May break navigation if done incorrectly

**Best practice:** Edit global components via Claude Code session, not mobile shortcuts.

## 📋 Quick Reference

### All Supported Sections:

| Section | Aliases | Updates |
|---------|---------|---------|
| headline | h1 | Main page heading |
| subtitle | description, tagline | Subheading paragraph |
| body | bodycopy, bodytext | Main body paragraph |
| background | bg, bgimage | Background image URL |

### All Supported Pages:

| Page | File | Mobile-Ready |
|------|------|--------------|
| home | HomePage.jsx | ✅ Yes |
| about | AboutPage.jsx | ✅ Yes |
| works | WorksPage.jsx | ✅ Yes |
| hands | HandsPage.jsx | ✅ Yes |
| experiments | ExperimentsPage.jsx | ✅ Yes |
| thoughts | ThoughtsPage.jsx | ✅ Yes |
| unity-notes | UnityNotesPage.jsx | ⚠️ Partial (standard sections only) |

## 🚨 Important Notes

**What's Safe for Mobile:**
- ✅ Text content (headline, subtitle, body)
- ✅ Background images
- ✅ Adding new pages (after initial setup)

**What Should Use Claude Code:**
- ⚠️ Navigation structure changes
- ⚠️ Layout modifications
- ⚠️ Component behavior changes
- ⚠️ Global component edits

## 🔜 Future Enhancements

Possible future additions:
- Support for multiple body paragraphs (`body1`, `body2`, etc.)
- Support for list items
- Support for link URLs
- Support for color scheme changes
- Support for Unity Notes specific sections

Let me know which enhancements you'd like prioritized!
