# Scope: Persistent Link Saving (Offline Reading)

**Created:** 2026-01-21
**Status:** Research / Scoping

---

## Overview

Enable users to save links for offline reading without returning to the original source. Links would be accessible even without an internet connection.

---

## Current State

### Existing Infrastructure
- **Content Storage**: Links already store `content` field (parsed article text from Cloud Function)
- **Reader View**: `LinkReaderPage.jsx` provides clean reading experience
- **No PWA**: No service worker or web app manifest currently exists
- **No Offline Storage**: No IndexedDB or localStorage for content caching

### What's Already Available
1. Article content is parsed and stored in Firestore (`link.content`)
2. AI summaries are stored (`link.aiSummary`)
3. Reader view UI exists for displaying content

---

## Proposed Architecture

### Option A: Progressive Web App (PWA) + IndexedDB (Recommended)

**Components:**
1. **Service Worker**
   - Cache app shell (HTML, CSS, JS)
   - Cache static assets
   - Intercept network requests

2. **IndexedDB**
   - Store link content locally
   - Sync with Firestore when online
   - Mark links as "saved offline"

3. **Web App Manifest**
   - Enable "Add to Home Screen"
   - Define app icons and colors
   - Set display mode (standalone)

**User Experience:**
1. User clicks "Save Offline" on a link
2. Content is downloaded to IndexedDB
3. Link shows offline badge in UI
4. User can read without internet
5. Reading progress syncs when back online

### Option B: Browser Extension Enhanced

**Components:**
1. **Extension Storage**
   - Use chrome.storage.local API
   - Store content in extension context

2. **Background Sync**
   - Sync content when online
   - Update reading progress

**Pros:** Works across tabs, deeper browser integration
**Cons:** Extension-only (not mobile web)

### Option C: Download as File (Simple)

**Components:**
1. **Export to HTML/EPUB/PDF**
   - Generate readable file
   - Download to device

**Pros:** Works everywhere, no infrastructure
**Cons:** Not integrated, manual process

---

## Recommended Approach: PWA + IndexedDB

### Phase 1: Foundation
1. Create `public/manifest.webmanifest`
2. Create `public/service-worker.js`
3. Register service worker in `index.html`
4. Add basic caching for app shell

### Phase 2: Offline Storage
1. Create `src/utils/offlineStorage.js`
   - IndexedDB wrapper
   - `saveOffline(linkId)` / `removeOffline(linkId)`
   - `getOfflineLinks()` / `isOffline(linkId)`

2. Modify `LinkArchiverPage.jsx`
   - Add "Save Offline" button
   - Show offline badge on saved links
   - Filter view: "Offline Available"

### Phase 3: Reader Integration
1. Modify `LinkReaderPage.jsx`
   - Check IndexedDB first
   - Fall back to Firestore if online
   - Show offline indicator

### Phase 4: Sync & Cleanup
1. Background sync for reading progress
2. Storage management (quotas, cleanup)
3. Settings: auto-save starred links offline

---

## Technical Considerations

### Storage Limits
- IndexedDB: ~50MB default, can request more
- Per-link content: ~10-50KB average
- ~1000 links offline = ~50MB

### Sync Strategy
- On app open: Check for updates
- On save offline: Download immediately
- On read: Sync progress when online

### Dependencies
- `idb` - Promise-based IndexedDB wrapper (2KB)
- No additional major dependencies needed

---

## Implementation Estimate

| Phase | Description | Effort |
|-------|-------------|--------|
| 1 | PWA Foundation | 2-4 hours |
| 2 | Offline Storage | 4-6 hours |
| 3 | Reader Integration | 2-3 hours |
| 4 | Sync & Polish | 2-3 hours |

**Total: 10-16 hours**

---

## Files to Create/Modify

### New Files
- `public/manifest.webmanifest`
- `public/service-worker.js`
- `public/icons/` (app icons)
- `src/utils/offlineStorage.js`
- `src/hooks/useOfflineStatus.js`

### Modified Files
- `index.html` - Register service worker
- `src/pages/admin/LinkArchiverPage.jsx` - Offline controls
- `src/pages/admin/LinkReaderPage.jsx` - Offline support

---

## Open Questions

1. **Auto-save policy**: Should starred links auto-save offline?
2. **Storage cleanup**: Auto-cleanup links older than X days?
3. **Mobile priority**: Is this primarily for mobile use cases?
4. **Images**: Store images offline too? (significantly increases storage)

---

## References

- [Workbox (Google PWA toolkit)](https://developer.chrome.com/docs/workbox/)
- [IndexedDB with idb](https://github.com/jakearchibald/idb)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
