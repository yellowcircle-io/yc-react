# Link Archiver (Pocket Alternative) - Feature Design

**Created:** 2026-01-17
**Status:** Design Phase
**Priority:** P1
**Agent:** Sleepless + Multi-LLM Review

---

## Executive Summary

With Pocket shutting down (October 2025), there's a significant gap in the read-it-later market. Link Archiver integrates with yellowCircle's Unity ecosystem to provide a modern, privacy-focused alternative with unique visual organization capabilities.

---

## Market Research Summary

### Key Findings

| App | Strengths | Weaknesses |
|-----|-----------|------------|
| **Pocket** (defunct) | Tagging, discovery, text-to-speech | Shutting down Oct 2025 |
| **Instapaper** | Speed reading, annotations, Kobo integration | Folder-only (no tags), limited free tier |
| **Wallabag** | Self-hosted, open source, API | Complex setup, dated UX |
| **Omnivore** | Clean UI, open source, newsletter support | Self-hosted only (cloud deprecated) |

### Must-Have Features (Industry Standard)
1. Browser extension / bookmarklet for quick save
2. Content extraction (reader mode - strips ads/clutter)
3. Tagging AND folder organization
4. Full-text search
5. Offline reading
6. Cross-platform sync
7. Import from Pocket/Instapaper/Wallabag

### Differentiators (yellowCircle Unique)
1. **UnityNOTES Integration** - Visual canvas organization of saved links
2. **AI Summarization** - Auto-generate summaries via Gemini/Ollama
3. **Archive Snapshots** - Permanent copies (like archive.is)
4. **Journey Integration** - Add links to UnityMAP sequences
5. **Collaboration** - Share collections with team members

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      Link Archiver System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Browser    │    │   Mobile     │    │   Email      │      │
│  │  Extension   │    │    App       │    │  Forwarding  │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Firebase Functions                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │  │
│  │  │ saveLink   │  │ fetchContent│  │ archivePage │          │  │
│  │  └────────────┘  └────────────┘  └────────────┘          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐              │
│         ▼                   ▼                   ▼               │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐           │
│  │ Firestore  │    │  Storage   │    │   Algolia  │           │
│  │  (links)   │    │ (archives) │    │  (search)  │           │
│  └────────────┘    └────────────┘    └────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model

#### Firestore: `links` Collection

```javascript
{
  id: "auto-generated",
  userId: "firebase-uid",

  // Core fields
  url: "https://example.com/article",
  title: "Article Title",
  excerpt: "First 200 chars of content...",
  content: "Full extracted text content",

  // Metadata
  domain: "example.com",
  favicon: "https://example.com/favicon.ico",
  image: "https://example.com/og-image.jpg",
  author: "John Doe",
  publishedAt: Timestamp,

  // Organization
  tags: ["tech", "ai", "reading"],
  folderId: "folder-id-or-null",
  starred: false,
  archived: false,

  // Reading progress
  readProgress: 0.45, // 45% read
  readTime: 180, // seconds spent reading
  estimatedReadTime: 420, // 7 minutes

  // AI enhancements
  aiSummary: "AI-generated summary...",
  aiTags: ["auto-tagged", "by-ai"],

  // Archive
  archiveUrl: "gs://bucket/archives/xxx.html",
  archiveTimestamp: Timestamp,

  // Unity integration
  unityNodeId: "node-id-if-added-to-canvas",
  unityCapsuleId: "capsule-id",

  // Timestamps
  savedAt: Timestamp,
  updatedAt: Timestamp,
  readAt: Timestamp | null
}
```

#### Firestore: `link_folders` Collection

```javascript
{
  id: "auto-generated",
  userId: "firebase-uid",
  name: "Tech Articles",
  color: "#3B82F6",
  icon: "folder",
  parentId: null, // for nested folders
  order: 0,
  createdAt: Timestamp
}
```

### API Endpoints (Firebase Functions)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/links` | GET | List user's links (paginated, filtered) |
| `/api/links` | POST | Save new link |
| `/api/links/:id` | GET | Get single link with full content |
| `/api/links/:id` | PATCH | Update link (tags, folder, etc.) |
| `/api/links/:id` | DELETE | Delete link |
| `/api/links/:id/archive` | POST | Create permanent archive snapshot |
| `/api/links/import` | POST | Bulk import from Pocket/Instapaper |
| `/api/links/search` | GET | Full-text search |
| `/api/folders` | CRUD | Folder management |

### Browser Extension

**Manifest V3 Chrome Extension:**

```javascript
// popup.js - Quick save functionality
chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
  const url = tabs[0].url;
  const title = tabs[0].title;

  // Save to yellowCircle Link Archiver
  const response = await fetch('https://api.yellowcircle.io/links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url, title })
  });
});
```

**Features:**
- One-click save from toolbar
- Right-click context menu "Save to Link Archiver"
- Keyboard shortcut (Ctrl+Shift+S)
- Tag selection popup
- "Add to UnityNOTES" option

### Content Extraction

Using **Mozilla Readability** (same library Pocket used):

```javascript
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

async function extractContent(url) {
  const response = await fetch(url);
  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  return {
    title: article.title,
    content: article.content,
    textContent: article.textContent,
    excerpt: article.excerpt,
    byline: article.byline,
    length: article.length,
    siteName: article.siteName
  };
}
```

### Archive Snapshots

Using **SingleFile** or **archive.is** style approach:

```javascript
async function archivePage(url, linkId) {
  // Option 1: Use archive.is API
  const archiveUrl = `https://archive.is/submit/?url=${encodeURIComponent(url)}`;

  // Option 2: Self-hosted with Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Capture full page as MHTML
  const cdp = await page.target().createCDPSession();
  const { data } = await cdp.send('Page.captureSnapshot', { format: 'mhtml' });

  // Store in Firebase Storage
  const bucket = admin.storage().bucket();
  const file = bucket.file(`archives/${linkId}.mhtml`);
  await file.save(data);

  return file.publicUrl();
}
```

---

## Unity Integration

### LinkNode for UnityNOTES

New node type for the canvas:

```jsx
// src/components/nodes/LinkNode.jsx
const LinkNode = ({ data, selected }) => {
  const { title, url, domain, image, excerpt, tags, readProgress } = data;

  return (
    <div className={`link-node ${selected ? 'selected' : ''}`}>
      {image && <img src={image} alt="" className="link-thumbnail" />}
      <div className="link-content">
        <h3>{title}</h3>
        <span className="domain">{domain}</span>
        <p className="excerpt">{excerpt}</p>
        <div className="tags">
          {tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
        </div>
        <div className="progress-bar" style={{ width: `${readProgress * 100}%` }} />
      </div>
    </div>
  );
};
```

### Capsule Template: Reading List

```javascript
const seedReadingListCapsule = async (userId) => {
  const capsule = {
    id: `reading-list-${userId}`,
    name: "Reading List",
    type: "link-archiver",
    nodes: [
      { type: 'groupNode', data: { label: 'To Read' }, position: { x: 0, y: 0 } },
      { type: 'groupNode', data: { label: 'In Progress' }, position: { x: 400, y: 0 } },
      { type: 'groupNode', data: { label: 'Completed' }, position: { x: 800, y: 0 } },
    ]
  };

  return capsule;
};
```

---

## Implementation Phases

### Phase 1: Core MVP (Week 1-2)
- [ ] Firestore schema setup
- [ ] Firebase Functions: saveLink, getLinks, deleteLink
- [ ] Content extraction with Readability
- [ ] Basic web UI (list view)
- [ ] Chrome extension (save button only)

### Phase 2: Organization (Week 3)
- [ ] Tagging system
- [ ] Folder management
- [ ] Full-text search (Algolia or Firestore)
- [ ] Import from Pocket (export file)

### Phase 3: Reader Experience (Week 4)
- [ ] Reader mode view
- [ ] Reading progress tracking
- [ ] Highlighting & annotations
- [ ] Offline support (PWA)

### Phase 4: Unity Integration (Week 5)
- [ ] LinkNode component
- [ ] Reading List capsule template
- [ ] Drag links to canvas
- [ ] Visual organization

### Phase 5: AI Enhancement (Week 6)
- [ ] Auto-summarization (Gemini/Ollama)
- [ ] Smart tagging
- [ ] Related links suggestions
- [ ] Archive snapshots

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Links saved | 100+ in first month | Firestore count |
| DAU | 10+ daily active users | Analytics |
| Import success | 95%+ from Pocket | Import logs |
| Content extraction | 90%+ accuracy | Manual QA |
| Archive success | 99%+ permanent copies | Storage logs |

---

## Open Questions

1. **Monetization:** Free tier limits? Premium features?
2. **Storage costs:** Archive snapshots could be expensive at scale
3. **API rate limits:** Content extraction might hit source site limits
4. **Mobile app:** React Native or PWA-only initially?

---

## References

- [Pocket Shutdown Announcement](https://techcrunch.com/2025/05/27/read-it-later-app-pocket-is-shutting-down-here-are-the-best-alternatives/)
- [Wallabag GitHub](https://github.com/wallabag/wallabag)
- [Omnivore GitHub](https://github.com/omnivore-app/omnivore)
- [Mozilla Readability](https://github.com/mozilla/readability)
- [Zapier: Best Read-It-Later Apps](https://zapier.com/blog/best-bookmaking-read-it-later-app/)
