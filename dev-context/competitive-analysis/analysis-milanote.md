# Competitive Analysis: Milanote

**Date:** January 27, 2026
**Product:** Milanote (milanote.com)
**Category:** Visual organization / mood board tool

---

## Product Overview

Milanote is a visual organization tool designed for creative professionals. It combines free-form canvas placement with rich media support, targeting designers, writers, and project managers who need visual thinking tools.

## Feature Analysis

### Visual Design & Card Quality (Score: 4.5)
- Cards have clean, well-spaced layouts with content previews
- Image cards show thumbnail previews with metadata
- Link cards display favicon, title, and description
- Note cards have clear typography hierarchy
- Consistent shadow system across all card types
- Color-coded boards and cards for visual categorization

### Interaction & Microinteractions (Score: 4.0)
- Smooth drag-and-drop with visual feedback
- Card hover reveals action buttons (edit, move, delete)
- Transition animations on card state changes
- Drag placeholder shows target position
- Multi-select with shift-click and drag selection

### Organization & Discovery (Score: 3.5)
- Board-in-board nesting (visual hierarchy)
- Free-form spatial organization
- Column layouts within boards
- Search across boards
- Limited non-spatial organization (no tags in free plan)

### Collaboration Awareness (Score: 3.0)
- Shared boards with invitation links
- Comments on cards
- Activity feed showing recent changes
- No live cursor tracking
- No real-time presence indicators

### Mobile UX (Score: 3.5)
- Dedicated mobile app (iOS/Android)
- Touch-optimized card interactions
- Simplified mobile canvas with zoom
- Quick capture from mobile
- Some features desktop-only

### Content Type Richness (Score: 4.0)
- Text notes (rich text)
- Images (upload, paste, web capture)
- Links with preview cards
- File attachments
- To-do lists
- Columns and groups
- Video embeds
- Audio notes (mobile)

### Templates & Starter Content (Score: 4.5)
- 100+ curated templates
- Categories: marketing, design, writing, planning
- Template previews with descriptions
- One-click template application
- Community template sharing

### Performance & Reliability (Score: 4.0)
- Fast canvas rendering
- Smooth scrolling and zooming
- Reliable cloud sync
- Good offline handling
- Some lag on very large boards (100+ cards)

---

## Key Patterns for UnityNOTES

### Adopt
1. **Content preview in cards** - Show first line of text, image thumbnails in link/media nodes
2. **Consistent shadow system** - Standardize elevation across all node types
3. **Color-coded organization** - Expand beyond 6 sticky colors

### Consider
1. **Board-in-board nesting** - Could map to GroupNode improvements
2. **Quick capture flow** - Mobile-optimized node creation

### Skip
1. **Column layouts** - Different paradigm from our canvas approach
2. **File attachments** - Requires storage infrastructure changes
