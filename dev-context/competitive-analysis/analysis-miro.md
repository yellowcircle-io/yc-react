# Competitive Analysis: Miro

**Date:** January 27, 2026
**Product:** Miro (miro.com)
**Category:** Collaborative whiteboard platform

---

## Product Overview

Miro is the market-leading collaborative whiteboard platform used by teams for brainstorming, planning, and visual collaboration. It sets the standard for real-time collaboration on infinite canvas surfaces with extensive template and integration ecosystems.

## Feature Analysis

### Visual Design & Card Quality (Score: 4.0)
- Clean, functional card design optimized for readability
- 16-color sticky note palette (industry standard)
- Consistent visual language across widget types
- Dynamic text sizing based on zoom level
- Color-coded frames and sections
- Professional but not decorative

### Interaction & Microinteractions (Score: 4.5)
- Exceptional hover states with contextual toolbars
- Smooth drag-and-drop with magnetic snapping
- Multi-select with rubber-band selection
- Connection line drawing with smart routing
- Zoom-aware interaction (different behaviors at different zoom levels)
- Undo/redo with visual indication
- Smart guides for alignment

### Organization & Discovery (Score: 4.0)
- Tags and labels on any element
- Frame-based sections for canvas regions
- Search across boards and elements
- Filter by type, color, author, date
- Mind map auto-layout
- Grid and alignment tools

### Collaboration Awareness (Score: 5.0)
- Live cursor tracking with user name labels
- User color coding (consistent per session)
- Follow mode (track another user's viewport)
- Voting and timer tools for workshops
- Video chat integration
- Comments with @mentions
- Activity log per board
- Presence indicators (who's viewing)

### Mobile UX (Score: 4.0)
- Dedicated mobile app with touch-optimized canvas
- Pinch-to-zoom, pan gestures
- Quick creation of stickies and shapes
- Mobile-specific toolbar
- Presentation mode for mobile

### Content Type Richness (Score: 4.5)
- Sticky notes (16 colors)
- Text blocks
- Shapes and connectors
- Images and file uploads
- Embedded documents (Google Docs, etc.)
- Video embeds
- Tables and charts
- Mind maps with auto-layout
- Kanban-style card layouts
- Wireframe components

### Templates & Starter Content (Score: 5.0)
- 1000+ templates in Miroverse marketplace
- Categories: agile, design, strategy, education, workshops
- Community-contributed templates
- Team-shared template libraries
- One-click template application with guided setup

### Performance & Reliability (Score: 4.0)
- Good performance up to ~1000 elements
- Degrades on very large boards (5000+ elements)
- Reliable real-time sync
- Offline mode with sync on reconnection
- CDN-based asset delivery

---

## Key Patterns for UnityNOTES

### Adopt (High Priority)
1. **16-color sticky palette** - Direct upgrade from our 6 colors (IMP-002)
2. **Contextual hover toolbars** - Show actions on node hover (IMP-001)
3. **Consistent shadow/elevation** - Standardize across node types (IMP-003)
4. **Tags and labels** - Non-spatial organization (IMP-015, IMP-016)

### Consider (Medium Priority)
1. **Smart guides for alignment** - Help users position nodes precisely
2. **Zoom-aware interactions** - Different detail levels at different zoom
3. **Frame-based sections** - Canvas regions (related to GroupNode)
4. **Search and filter** - Find nodes across canvas (IMP-017)

### Long-term (Low Priority)
1. **Live cursor tracking** - Requires Firebase Realtime Database (IMP-021)
2. **Follow mode** - Track another user's viewport
3. **Auto-layout** - Algorithmic node arrangement (IMP-020)

### Skip
1. **Video chat integration** - Different product scope
2. **Wireframe components** - Not aligned with our use cases
3. **Template marketplace** - Our template system is sufficient for now
