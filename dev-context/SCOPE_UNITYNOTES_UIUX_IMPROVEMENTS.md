# UnityNOTES UI/UX Improvements Research

**Research Date:** January 24, 2026
**Status:** Comprehensive Analysis Complete
**Competitive Analysis:** Threadeck, Milanote, Miro

---

## Executive Summary

UnityNOTES has a **solid foundation** as a canvas-based note-taking tool built on React Flow. Current implementation includes good core features (multi-node types, cloud sync, basic collaboration) but has gaps vs. market leaders.

### Key Strengths
- Modern tech stack (React 19, Firebase, XYFlow)
- Solid mobile support (touch detection, responsive)
- Good performance optimization (node types, lazy loading)
- Existing collaboration infrastructure (v3 metadata system)
- Multiple operational modes (notes, map, studio)

### Critical Gaps vs. Market Leaders
1. **Visual hierarchy**: Card design could be richer
2. **Organization**: No tagging/non-spatial organization
3. **Collaboration awareness**: Missing live cursor tracking
4. **Mobile UX**: Limited touch-friendly interaction paradigms
5. **Accessibility**: Keyboard navigation needs work
6. **Microinteractions**: Could be more polished
7. **Content discovery**: No advanced search/filter

---

## Top 15 Prioritized Recommendations

| Rank | Feature | Impact | Effort | Priority |
|------|---------|--------|--------|----------|
| 1 | Live Collaborator Cursors | Very High | 3-4 days | **CRITICAL** |
| 2 | Enhanced Card Design | High | 2-3 days | **HIGH** |
| 3 | Tagging & Organization System | Very High | 3-4 days | **HIGH** |
| 4 | Template System | High | 4-5 days | **HIGH** |
| 5 | Microinteractions & Motion | High | 2-3 days | **HIGH** |
| 6 | Advanced Search & Filter | High | 3-4 days | **MEDIUM** |
| 7 | Auto-Layout Options | Medium | 4-5 days | **MEDIUM** |
| 8 | Mobile Bottom Sheet UI | Medium | 3-4 days | **MEDIUM** |
| 9 | Mini-Map Enhancement | Medium | 2-3 days | **MEDIUM** |
| 10 | Enhanced Connection Indicators | Medium | 3 days | **MEDIUM** |
| 11 | Infinite Scroll Node Library | Low | 2 days | **LOW** |
| 12 | Component Locking & Permissions | Low | 3-4 days | **LOW** |
| 13 | Export & Integration | Low | 4-5 days | **LOW** |
| 14 | AI-Powered Features | Low | 5-7 days each | **LOW** |
| 15 | Visual Themes & Customization | Low | 2-3 days | **LOW** |

---

## Feature Details

### 1. Live Collaborator Cursors (CRITICAL)
**Impact:** Better awareness in multi-user sessions

**Implementation:**
```javascript
// Firebase Realtime path structure
capsules/{capsuleId}/activeUsers/{userId} = {
  email: string,
  color: string,
  position: { x, y },
  viewport: { x, y, zoom },
  focusedNodeId: string,
  lastUpdate: timestamp
}
```

**Features:**
- Track cursor position per collaborator
- Show username label above cursor
- Different colors per user
- Cursor trails (fading lines)
- Hide inactive cursors after 30 seconds

### 2. Enhanced Card Design
**Impact:** Improves scanning speed and content discovery

**Implementation:**
- Add type-specific icons to all node headers
- Show content preview (first line of text, image thumbnail)
- Implement 16-color stickyNode palette (Miro-style)
- Better visual hierarchy within cards
- Subtle shadow and border styling per state

```jsx
// Node header enhancement
<div className="node-header">
  <TypeIcon type={node.type} />
  <span className="node-title">{truncate(title, 30)}</span>
  {isStarred && <Star className="star-icon" />}
</div>
```

### 3. Tagging & Organization System
**Impact:** Better content organization without spatial constraints

**Features:**
- Add `tags` array to node data structure
- Create tag manager UI (right panel)
- Visual tag badges on nodes
- Filter canvas by tags
- Global tag cloud view
- Auto-tag suggestions

### 4. Template System
**Impact:** Faster canvas setup for common patterns

**Templates:**
- Project Planning (group + tasks)
- Journey Mapping (flow diagram)
- Mood Board (image-focused)
- Mind Map (hierarchical)
- Kanban Board (swimlane layout)
- Brainstorm Session (sticky notes + grouping)

### 5. Microinteractions & Motion
**Impact:** Improved perceived quality and feedback

| Microinteraction | Duration | Purpose |
|-----------------|----------|---------|
| Node hover | 150ms | Reveal action buttons |
| Node selection | 200ms | Visual feedback |
| Zoom transition | 200ms | Smooth viewport change |
| Pan animation | 200ms | Smooth camera movement |
| Auto-layout animation | 300-500ms | Arrange nodes smoothly |
| Node add/remove | 300ms | Entrance/exit animation |
| Group collapse/expand | 200-300ms | Smooth height change |

---

## Competitive Patterns Identified

### From Threadeck
- Thread-based navigation (parent/child relationships)
- Visual hierarchy indicators
- Nested content with expandable threads
- Comment timeline UI

### From Milanote
- Visual mood board organization
- Rich media mixing (images, text, links)
- Flexible grid with free-form placement
- Content preview cards

### From Miro
- 16-color sticky note palette
- Live cursor tracking
- Connector lines with customizable styling
- Tags and labels for multi-categorization
- Mind map auto-layout
- Linkable frames for canvas regions

---

## 90-Day Implementation Roadmap

### Sprint 1 (Week 1-2) - Quick Wins
- Enhanced Card Design (add type icons, previews)
- Microinteractions (node hover, smooth transitions)
- Mini-Map improvements (colors, viewport bounds)
- Visual themes & customization (dark mode toggle)

### Sprint 2 (Week 3-4) - Core Organization
- Tagging & organization system
- Live collaborator cursors
- Template system setup (Firestore schema)
- Enhanced search & filter UI

### Sprint 3 (Week 5-8) - Advanced Features
- Auto-layout for grouped nodes
- Template system implementation
- Mobile bottom sheet UI
- Enhanced connection indicators

### Sprint 4 (Week 9-12) - Polish & Optimization
- Component locking & permissions
- Export/integration features
- Accessibility audit & fixes (keyboard nav)
- Performance optimization
- User testing & feedback iterations

---

## Mobile-Specific Recommendations

| Pattern | Current Status | Priority |
|---------|----------------|----------|
| Touch Targets (44px minimum) | Needs Review | **HIGH** |
| Bottom Navigation | Not Implemented | **HIGH** |
| Progressive Disclosure | Not Implemented | **MEDIUM** |
| Bottom Sheet for Node Operations | Not Implemented | **HIGH** |
| Long-press Context Menus | Not Implemented | **MEDIUM** |
| Haptic Feedback | Not Implemented | **LOW** |

---

## Accessibility Requirements

| Criterion | Current Status | Priority |
|-----------|---------------|----------|
| Keyboard Navigation | Partial | **CRITICAL** |
| Focus Indicators | Needs Review | **HIGH** |
| Touch Target Size | 44px minimum needed | **HIGH** |
| Color Contrast | Needs audit | **HIGH** |
| Screen Reader Support | Limited | **MEDIUM** |
| Motion Preferences | Implemented | Done |

---

## Sources

- [Miro Infinite Canvas](https://miro.com/online-canvas-for-design/)
- [Milanote Official](https://milanote.com/)
- [React Flow Guide](https://reactflow.dev)
- [Card UI Design Examples 2025](https://bricxlabs.com/blogs/card-ui-design-examples)
- [Motion UI Trends 2025](https://www.betasofttechnology.com/motion-ui-trends-and-micro-interactions/)
- [WCAG Keyboard Accessibility](https://www.getstark.co/wcag-explained/operable/keyboard-accessible/)
