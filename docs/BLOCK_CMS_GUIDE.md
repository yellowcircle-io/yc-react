# Block-Based CMS Guide

## Overview

The yellowCircle Blog CMS uses a block-based content system similar to WordPress Gutenberg or Notion. Articles are composed of reusable blocks that render consistently across the platform.

**Key URLs:**
- Article Listing: `/thoughts`
- Admin Articles: `/admin/articles` (lists all articles with block/legacy badges)
- Block Editor: `/admin/blocks/new` or `/admin/blocks/:articleId`
- Legacy Editor: `/admin/articles/new` or `/admin/articles/:articleId`
- Article View: `/thoughts/:slug`

**Admin Integration:**
The Article List page (`/admin/articles`) is fully integrated with the block editor:
- "New Block Article" button creates block-based articles (recommended)
- "New (Legacy)" button creates traditional articles
- Block articles show a yellow "Blocks" badge
- Clicking a block article opens the Block Editor
- Clicking a legacy article opens the Legacy Editor

---

## Block Types Reference

### 1. Hero Block
The main header section for articles.

```javascript
{
  type: 'hero',
  seriesLabel: 'OWN YOUR STORY',      // Optional series badge
  title: 'Article Title',
  subtitle: 'Article Subtitle',
  readingTime: 12,                     // Minutes
  date: 'November 2025',
  author: 'yellowCircle'
}
```

### 2. Lead Paragraph
Opening paragraph with highlighted lead-in text.

```javascript
{
  type: 'lead-paragraph',
  highlight: "Let's be direct:",       // Bold yellow lead-in
  content: 'The main paragraph text that follows the highlight.'
}
```

### 3. Paragraph
Standard paragraph text.

```javascript
{
  type: 'paragraph',
  content: 'Regular paragraph text.',
  muted: true                          // Optional: gray text style
}
```

### 4. Section Header
Numbered section divider.

```javascript
{
  type: 'section-header',
  number: '01',                        // Two-digit number
  title: 'Section Title'
}
```

### 5. Stat Grid
Display statistics in a grid layout.

```javascript
{
  type: 'stat-grid',
  stats: [
    { value: '68%', label: 'of MarTech capabilities go unused', source: 'Gartner, 2024' },
    { value: '$30B', label: 'wasted annually on unused SaaS', source: 'Zylo Report' },
    { value: '47%', label: 'of ops professionals report burnout', source: 'MOPs Survey' }
  ]
}
```

### 6. Bullet List
Unordered list with yellow bullet points.

```javascript
{
  type: 'bullet-list',
  items: [
    'First bullet point',
    'Second bullet point',
    'Third bullet point'
  ]
}
```

### 7. Quote
Blockquote with attribution.

```javascript
{
  type: 'quote',
  content: 'The quoted text goes here.',
  author: 'Person Name, Title/Role'
}
```

### 8. Persona Card
Character/persona profile card.

```javascript
{
  type: 'persona-card',
  name: 'Alex',
  role: 'Marketing Operations Manager',
  description: 'Description of the persona and their situation.',
  cost: 'The impact or cost they experience.'
}
```

### 9. Numbered List
Ordered list with optional descriptions.

```javascript
{
  type: 'numbered-list',
  highlighted: true,                   // Yellow background style
  items: [
    { title: 'First item title', description: 'Optional description' },
    { title: 'Second item title', description: 'Optional description' }
  ]
}
```

### 10. Action Grid
Grid of action items with icons.

```javascript
{
  type: 'action-grid',
  items: [
    { icon: '🔍', title: 'Action Title', description: 'Description of the action.' },
    { icon: '📊', title: 'Another Action', description: 'Another description.' }
  ]
}
```

### 11. Callout Box
Highlighted callout/summary box.

```javascript
{
  type: 'callout-box',
  title: 'The Bottom Line',
  content: 'Main callout content.\nSupports newlines.',
  highlight: 'Final emphasized phrase.'
}
```

### 12. CTA Section
Call-to-action with buttons.

```javascript
{
  type: 'cta-section',
  prompt: 'Ready to take action?',
  buttons: [
    { label: 'Primary Action', link: '/assessment', primary: true },
    { label: 'Secondary Action', link: '/services', primary: false }
  ]
}
```

### 13. Sources
Reference/citation section.

```javascript
{
  type: 'sources',
  sources: [
    'Source Name, Year',
    'Another Source, Year'
  ]
}
```

---

## Article Data Structure

Complete article object structure for Firestore:

```javascript
{
  id: 'unique-id',
  slug: 'url-friendly-slug',
  title: 'Article Title',
  excerpt: 'Brief description for listings',
  category: 'own-your-story',          // See categories below
  tags: ['tag1', 'tag2'],
  author: 'yellowCircle',
  readingTime: 12,
  status: 'published',                  // 'draft' or 'published'
  contentSource: 'blocks',              // Must be 'blocks' for block-based
  publishedAt: Timestamp,
  updatedAt: Timestamp,
  blocks: [
    // Array of block objects
  ]
}
```

### Article Categories

| ID | Label |
|----|-------|
| `own-your-story` | Own Your Story |
| `gtm-strategy` | GTM Strategy |
| `marketing-ops` | Marketing Ops |
| `data-analytics` | Data & Analytics |
| `leadership` | Leadership |
| `case-study` | Case Study |

---

## Article Templates

### Template 1: Thought Leadership Article

Standard structure for opinion/insight pieces.

```javascript
{
  slug: 'your-article-slug',
  title: 'Your Article Title',
  excerpt: 'One-sentence description',
  category: 'own-your-story',
  tags: ['relevant', 'tags'],
  author: 'yellowCircle',
  readingTime: 10,
  status: 'draft',
  contentSource: 'blocks',
  blocks: [
    // Hero
    {
      type: 'hero',
      seriesLabel: 'OWN YOUR STORY',
      title: 'Your Article Title',
      subtitle: 'Your Subtitle',
      readingTime: 10,
      date: 'December 2025',
      author: 'yellowCircle'
    },

    // Opening
    {
      type: 'lead-paragraph',
      highlight: 'Opening hook:',
      content: 'Your compelling opening paragraph.'
    },

    // Context
    {
      type: 'paragraph',
      muted: true,
      content: 'Additional context or background.'
    },

    // Section 1
    {
      type: 'section-header',
      number: '01',
      title: 'First Main Point'
    },
    {
      type: 'paragraph',
      content: 'Content for first section.'
    },

    // Section 2
    {
      type: 'section-header',
      number: '02',
      title: 'Second Main Point'
    },
    {
      type: 'paragraph',
      content: 'Content for second section.'
    },

    // Section 3 - Conclusion
    {
      type: 'section-header',
      number: '03',
      title: 'What This Means'
    },
    {
      type: 'callout-box',
      title: 'Key Takeaway',
      content: 'Summary of your main argument.',
      highlight: 'Final thought.'
    },

    // CTA
    {
      type: 'cta-section',
      prompt: 'Want to learn more?',
      buttons: [
        { label: 'Take Assessment', link: '/assessment', primary: true },
        { label: 'View Services', link: '/services', primary: false }
      ]
    }
  ]
}
```

### Template 2: Data-Driven Analysis

For articles with statistics and research.

```javascript
{
  slug: 'data-article-slug',
  title: 'Data-Driven Article Title',
  excerpt: 'Analysis of...',
  category: 'data-analytics',
  tags: ['data', 'analysis'],
  author: 'yellowCircle',
  readingTime: 8,
  status: 'draft',
  contentSource: 'blocks',
  blocks: [
    {
      type: 'hero',
      title: 'Data-Driven Article Title',
      subtitle: 'What the numbers tell us',
      readingTime: 8,
      date: 'December 2025',
      author: 'yellowCircle'
    },

    {
      type: 'lead-paragraph',
      highlight: 'The data is clear:',
      content: 'Opening statement about what the data shows.'
    },

    {
      type: 'stat-grid',
      stats: [
        { value: 'XX%', label: 'First metric', source: 'Source' },
        { value: '$XXM', label: 'Second metric', source: 'Source' },
        { value: 'XX%', label: 'Third metric', source: 'Source' }
      ]
    },

    {
      type: 'section-header',
      number: '01',
      title: 'What These Numbers Mean'
    },
    {
      type: 'paragraph',
      content: 'Analysis of the statistics.'
    },

    {
      type: 'section-header',
      number: '02',
      title: 'Key Findings'
    },
    {
      type: 'numbered-list',
      highlighted: true,
      items: [
        { title: 'Finding 1', description: 'Explanation' },
        { title: 'Finding 2', description: 'Explanation' },
        { title: 'Finding 3', description: 'Explanation' }
      ]
    },

    {
      type: 'sources',
      sources: [
        'Source 1, Year',
        'Source 2, Year'
      ]
    }
  ]
}
```

### Template 3: How-To / Action Guide

For practical advice articles.

```javascript
{
  slug: 'how-to-slug',
  title: 'How to Do Something',
  excerpt: 'Step-by-step guide to...',
  category: 'marketing-ops',
  tags: ['how-to', 'guide'],
  author: 'yellowCircle',
  readingTime: 6,
  status: 'draft',
  contentSource: 'blocks',
  blocks: [
    {
      type: 'hero',
      title: 'How to Do Something',
      subtitle: 'A practical guide',
      readingTime: 6,
      date: 'December 2025',
      author: 'yellowCircle'
    },

    {
      type: 'lead-paragraph',
      highlight: 'The problem:',
      content: 'Description of the problem this guide solves.'
    },

    {
      type: 'section-header',
      number: '01',
      title: 'Before You Start'
    },
    {
      type: 'bullet-list',
      items: [
        'Prerequisite 1',
        'Prerequisite 2',
        'Prerequisite 3'
      ]
    },

    {
      type: 'section-header',
      number: '02',
      title: 'Step-by-Step Process'
    },
    {
      type: 'action-grid',
      items: [
        { icon: '1️⃣', title: 'Step One', description: 'What to do first.' },
        { icon: '2️⃣', title: 'Step Two', description: 'What to do next.' },
        { icon: '3️⃣', title: 'Step Three', description: 'What to do after.' },
        { icon: '4️⃣', title: 'Step Four', description: 'Final step.' }
      ]
    },

    {
      type: 'section-header',
      number: '03',
      title: 'Common Pitfalls'
    },
    {
      type: 'bullet-list',
      items: [
        'Mistake to avoid 1',
        'Mistake to avoid 2'
      ]
    },

    {
      type: 'callout-box',
      title: 'Quick Summary',
      content: 'Recap of the key steps.',
      highlight: 'Now go do it.'
    }
  ]
}
```

---

## Adding New Block Types

### Step 1: Define the Block Component

Add to `src/components/articles/ArticleBlocks.jsx`:

```javascript
export function NewBlockType({ data }) {
  return (
    <div style={{
      // Your styles here
    }}>
      {/* Block content */}
    </div>
  );
}
```

### Step 2: Register in ArticleRenderer

Update `src/components/articles/ArticleRenderer.jsx`:

```javascript
// Add to BLOCK_TYPES constant
export const BLOCK_TYPES = {
  // ... existing types
  NEW_BLOCK: 'new-block',
};

// Add case in renderBlock function
case 'new-block':
  return <NewBlockType key={index} data={block} />;
```

### Step 3: Add to Block Editor

Update `src/pages/admin/BlockEditorPage.jsx`:

1. Add to `BLOCK_TYPE_OPTIONS`:
```javascript
{ value: 'new-block', label: 'New Block', icon: '🆕' },
```

2. Add default data in `getDefaultBlockData`:
```javascript
case 'new-block':
  return { type: 'new-block', field1: '', field2: '' };
```

3. Add editor UI in `renderBlockEditor`:
```javascript
case 'new-block':
  return (
    <>
      <label>Field 1</label>
      <input
        value={editingBlock.field1 || ''}
        onChange={(e) => setEditingBlock({...editingBlock, field1: e.target.value})}
      />
    </>
  );
```

### Step 4: Update Firestore Schema (Optional)

If the block type should be documented, add to `src/utils/firestoreArticles.js`:

```javascript
export const BLOCK_TYPES = {
  // ... existing types
  NEW_BLOCK: 'new-block',
};
```

---

## File Reference

| File | Purpose |
|------|---------|
| `src/components/articles/ArticleBlocks.jsx` | Block component definitions |
| `src/components/articles/ArticleRenderer.jsx` | Block-to-component mapping |
| `src/pages/admin/BlockEditorPage.jsx` | Visual block editor |
| `src/pages/thoughts/ArticleV2Page.jsx` | Article display page |
| `src/utils/firestoreArticles.js` | Firestore schema & operations |
| `src/hooks/useArticles.js` | Article fetching hook |
| `src/data/articles/` | Static article data files |

---

## Quick Start: Creating a New Article

### Option A: Via Admin Panel (Recommended)

1. Navigate to `/admin/articles`
2. Click "New Block Article" (yellow button)
3. Add blocks using the "Add Block" button
4. Configure each block's content
5. Set article metadata (title, slug, category)
6. Click "Save Article"

**To edit existing block articles:**
- Click any article with a "Blocks" badge to open the Block Editor
- Or click the yellow grid icon in the actions column

### Option B: Via Static Data File

1. Create file: `src/data/articles/your-article.js`
2. Use a template from above
3. Import in `ArticleV2Page.jsx`:
   ```javascript
   import { YOUR_ARTICLE } from '../../data/articles/your-article';

   const ARTICLES = {
     'your-slug': YOUR_ARTICLE,
     // ... other articles
   };
   ```
4. Deploy

---

## Programmatic Article Creation

For automated article creation via CLI, n8n, or SSH, see:

**`scripts/article-generator/README.md`**

### Quick CLI Usage

```bash
# From project root
cd scripts/article-generator

# Preview article from markdown
node generate.cjs --input article.md --dry-run

# Save to Firestore
node generate.cjs --input article.md --output firestore

# From stdin (pipe content)
cat article.md | node generate.cjs --input - --output firestore
```

### n8n Integration

The `n8n-webhook-handler.cjs` can be deployed as a Firebase Function to receive article content from n8n workflows:

```json
POST /api/articles/generate
{
  "content": "# Article Title\n\nMarkdown content...",
  "format": "markdown",
  "metadata": {
    "title": "Article Title",
    "category": "own-your-story"
  },
  "status": "draft"
}
```

### SSH Shortcuts (iPhone)

See `scripts/article-generator/ssh-shortcuts.md` for iPhone Shortcut commands to create articles remotely.

---

*Last updated: December 2025*
