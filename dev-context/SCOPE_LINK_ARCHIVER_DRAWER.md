# Link Archiver Integration into Unity NOTES Drawer

## Overview
Integrate Link Archiver functionality into the Unity NOTES OverviewTray as a 4th tab, enabling quick access to saved links while working on the canvas.

---

## Current Architecture

### OverviewTray Structure (`src/components/unity/OverviewTray.jsx`)
```
OverviewTray
├── BookmarksTab (Saved capsules)
├── NodesTab (Canvas nodes - filterable)
└── NotificationsTab (Activity, @mentions)
```

### Proposed Addition
```
OverviewTray
├── BookmarksTab (Saved capsules)
├── NodesTab (Canvas nodes)
├── LinksTab (NEW - Saved links from Link Archiver)
└── NotificationsTab (Activity)
```

---

## LinksTab Specification

### Features
1. **Quick Access** - View recent/starred links without leaving canvas
2. **Search** - Filter links by title, domain, tags
3. **Add to Canvas** - Drag link to create LinkNode on canvas
4. **Quick Star/Archive** - Inline actions
5. **Open Link** - Click to open in new tab

### UI Components
```jsx
// src/components/unity/tray/LinksTab.jsx
- Search input (compact)
- Filter buttons: All | Starred | Recent
- Link list (scrollable)
  - Link card (thumbnail, title, domain, tags)
  - Quick actions (star, open, add to canvas)
- Empty state with "Import" CTA
```

### Data Flow
```
LinksTab
  ├── useAuth() → user.uid
  ├── getLinks(userId, options) → links[]
  ├── onAddToCanvas(link) → creates LinkNode
  └── onLinkClick(link) → window.open(link.url)
```

---

## Implementation Steps

### Phase 1: LinksTab Component
1. Create `src/components/unity/tray/LinksTab.jsx`
2. Add Links tab icon to `TabIcons` in OverviewTray
3. Update TABS array to include links
4. Wire up to firestoreLinks utils

### Phase 2: Canvas Integration
1. Add `onAddToCanvas` prop to LinksTab
2. Create LinkNode factory function in UnityNotesPage
3. Drag-and-drop support (optional enhancement)

### Phase 3: Quick Actions
1. Star/unstar from drawer
2. Archive from drawer
3. Sync state with Link Archiver page

---

## LinkNode Component (Already Planned)

Reference: Trimurti task "LinkNode Component" (2ea15c1b-110d-8195-8874-fbbdc85e54fa)

LinkNode should display:
- Favicon
- Title
- Domain
- Preview thumbnail (optional)
- Tags
- Quick actions (open, archive)

---

## File Changes Required

| File | Change |
|------|--------|
| `src/components/unity/OverviewTray.jsx` | Add LinksTab import, tab config |
| `src/components/unity/tray/LinksTab.jsx` | NEW - Links list component |
| `src/pages/UnityNotesPage.jsx` | Add onAddLinkToCanvas handler |
| `src/utils/firestoreLinks.js` | Already exists - may need getRecentLinks |

---

## Dependencies

- `firestoreLinks.js` utilities (getLinks, toggleStar, etc.)
- AuthContext for user.uid
- OverviewTray component structure
- LinkNode component (separate task)

---

## Notes from Research

### ThreadDeck Patterns
- Canvas-based workspace
- Blocks: "Personas, briefs, prompts, notes" - reusable content
- Folder organization
- Token-based usage

### Milanote Patterns
- Visual boards with drag-drop
- Web Clipper for saving from browser
- Flexible spatial arrangement

### Recommended Enhancements (per user notes)
- Save to Unity NOTES from Link Archiver
- Node templates/favorites
- AI summarization for text nodes
- Visual connection lines (ThreadDeck-style)

---

## Testing

1. Verify LinksTab loads user's links
2. Test search/filter functionality
3. Test add to canvas creates node
4. Verify state sync with Link Archiver page
5. Test empty state messaging

---

*Last Updated: January 18, 2026*
