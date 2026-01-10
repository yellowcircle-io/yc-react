# UnityNOTES/MAP/STUDIO Comparison Report

**Date:** January 9, 2026
**Tested Environments:**
- Production: https://yellowcircle.io/unity-notes?capsule=ATz8yEeffWtsZuJHwSal
- Local: http://localhost:5173/unity-notes?capsule=ATz8yEeffWtsZuJHwSal

---

## Executive Summary

**RESULT: Production and Local environments are FULLY CONSISTENT**

All three modes (NOTES, MAP, STUDIO) behave identically on both environments. No discrepancies were found in node components, available actions, or UI elements.

---

## NOTES Mode Comparison

### Node Count & Types

| Metric | Production | Local |
|--------|------------|-------|
| Total Nodes | 24 | 24 |
| Counter Display | 24/999 | 24/999 |

### Node Types Observed (Both Environments)

| Type | Icon | Count | Description |
|------|------|-------|-------------|
| groupNode | 📦 | 3 | Container nodes (Daily Itinerary, Places to Visit, Food & Dining) |
| linkNode | 📄 | 11 | URL links with previews (Instagram embeds, external sites) |
| todoNode | ✅ | 3 | Checklist nodes (Dec 31 NYE, Jan 1 New Year's Day, Jan 2) |
| stickyNode | 📝 | 4 | Sticky notes with colored backgrounds |
| photoNode | 🖼️ | 1 | Image node (Our First Holiday - Dyker Heights) |
| commentNode | 💬 | 1 | Comment from Christopher Cooper |
| tripPlannerMapNode | 📎 | 1 | Interactive map with Google Maps integration |
| aiChatNode | 🤖 | 1 | Montreal AI Assistant with chat interface |

### UI Elements (Both Environments)

- **Node Selection:** Amber highlight bar at top of selected node
- **Star Buttons:** Outside cards (top-left) for favoriting
- **Resize Handles:** Green dots at corners
- **Canvas Overview Panel:** Right sidebar with node filtering
- **Mini Map:** Bottom-right corner
- **Zoom Controls:** +/- buttons with percentage display
- **Mode Buttons:** NOTES/MAP/STUDIO in left control panel

---

## MAP Mode Comparison

| Aspect | Production | Local |
|--------|------------|-------|
| Behavior | Navigates away | Navigates away |
| Target URL | `/experiments/outreach-generator?from=unity-map` | `/experiments/outreach-generator?from=unity-map` |
| Page Title | UNITY GENERATOR | UNITY GENERATOR |
| Description | Machine-assisted email sequence generation | Machine-assisted email sequence generation |

### MAP Mode Features (Both Environments)

**Email Type Options:**
- 🎯 Prospect (Cold outreach)
- 📣 MarCom (Marketing comms)

**Pathway Options:**
- ⚡ One-Off (Generate + Send NOW)
- 📨 3-Email Set (Sequence to copy)
- 🗺️ Journey Build (Deploy to UnityMAP)

**Note:** MAP mode is NOT an in-app map view. It navigates to a separate email generation tool.

---

## STUDIO Mode Comparison

| Aspect | Production | Local |
|--------|------------|-------|
| Behavior | Modal overlay | Modal overlay |
| URL Parameter | `&mode=studio` | `&mode=studio` |
| Modal Title | UnitySTUDIO | UnitySTUDIO |
| Tagline | Create marketing assets for GTM campaigns | Create marketing assets for GTM campaigns |

### STUDIO Mode Options (Both Environments)

| Option | Badge | Description |
|--------|-------|-------------|
| Campaign Quickstart | NEW | Generate content for ALL platforms at once |
| Email Template | - | Create email templates for campaigns |
| Ad Creative | - | Design ads for Reddit, LinkedIn, Meta |
| Social Post | - | Create posts for LinkedIn, Twitter, Instagram |

---

## Available Actions Summary

### Canvas Actions (NOTES Mode)
- Pan canvas (mouse drag, arrow keys)
- Zoom in/out (+/- buttons, scroll wheel)
- Center view
- Auto-organize nodes
- Duplicate selected (Cmd+D)
- Delete selected (Delete/Backspace)
- Add new node (+ button, right-click menu)
- Search nodes
- Filter by node type
- Toggle minimap
- Show/hide overview panel

### Node Actions
- Select/multi-select
- Drag to reposition
- Resize (corner handles)
- Star/favorite
- Edit content (double-click)
- Change color (sticky notes, groups)
- Delete

### Keyboard Shortcuts
- Cmd+S: Save to cloud
- Cmd+E: Export JSON
- Cmd+N: Add new card
- Cmd+D: Duplicate selected
- Cmd+Z: Undo
- Cmd+Shift+Z: Redo
- Cmd+/: Show shortcuts help
- Escape: Deselect all
- Delete/Backspace: Delete selected
- Arrow keys: Pan canvas

---

## Screenshots Captured

| File | Description |
|------|-------------|
| `production-overview-with-modal.png` | Production at 100% zoom |
| `production-centered-view.png` | Production at 24% zoom, full canvas |
| `production-studio-mode.png` | Production STUDIO modal |
| `local-overview.png` | Local environment view |
| `local-note-selected.png` | Local with node interaction |
| `local-centered-view.png` | Local at 24% zoom, full canvas |
| `local-notes-mode.png` | Local NOTES mode |
| `local-studio-mode.png` | Local STUDIO modal |

---

## Console Errors Observed

### Both Environments (Expected/Non-Critical)
- Google Maps 404 errors (tile loading, expected)
- `google.maps.Marker` deprecation warning (Google Maps v3)
- JSONLink API CORS errors (link preview service)
- Microlink API 400 errors (link metadata service)

### Auto-Save Rate Limiting
- Frequent `Rate limited: Please wait X seconds` messages
- Expected Firestore behavior, not a bug

---

## Conclusion

**Production and Local are in sync.** The Dec 30 reimplementation (Phases 1-3) has been successfully deployed without introducing UI/UX regressions. All node types render correctly, and all user interactions work as expected.

**Recommended Next Steps:**
1. Proceed with Theme System implementation (Phase 4)
2. Consider addressing deprecated Google Maps Marker API
3. Evaluate link preview service reliability (JSONLink/Microlink errors)
