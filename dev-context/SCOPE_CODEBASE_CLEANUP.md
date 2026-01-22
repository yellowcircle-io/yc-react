# Scope: Codebase Cleanup & Refactoring Opportunities

**Created:** January 22, 2026
**Status:** Scoped
**Total Cleanup Potential:** ~22,000 LOC

---

## Executive Summary

Analysis identified 14 cleanup opportunities across 4 priority phases:
- **630+ console statements** to remove/replace
- **12,075 LOC of dead code** in archive directory (safe to delete)
- **5 files >1,500 LOC** needing component extraction
- **6 Firestore utility files** with duplicate patterns

---

## Phase 1: Critical (1-2 weeks)

### 1.1 Console Log Cleanup

**Issue:** 630+ console statements across codebase
**Impact:** High - affects production performance, exposes debug info

| File | Console Statements |
|------|-------------------|
| `UnityNotesPage.jsx` | 116 |
| `useFirebaseJourney.js` | 56 |
| `useFirebaseCapsule.js` | 49 |
| `firestoreLinks.js` | 34 |
| `LinkArchiverPage.jsx` | 26 |
| Other files | ~350 |

**Solution Options:**
1. **Quick:** Add Vite plugin to strip console in production
2. **Better:** Replace with Sentry/LogRocket logging
3. **Best:** Create `logger.js` utility with log levels

**Effort:** 4-6 hours

### 1.2 Archive Directory Cleanup

**Issue:** 12,075 LOC of deprecated code in `src/archive/`
**Impact:** Medium - increases search noise, bundle size risk

| File | LOC |
|------|-----|
| `pages/TimeCapsulePage.jsx` | 2,228 |
| `app-alternatives/App-exp.jsx` | 1,147 |
| `app-alternatives/App.jsx` | 1,120 |
| `pages/UnityNotePlusPage.jsx` | 881 |
| Other archived files | ~6,699 |

**Verification:** No active imports from archive directory
**Action:** Safe to delete entire `src/archive/` directory

**Effort:** 1-2 hours (verification + deletion)

### 1.3 Deprecated useIOSPinchZoom Hook

**File:** `src/hooks/useIOSPinchZoom.js` (365 LOC)
**Issue:** Marked deprecated, uses non-passive listeners that hurt performance
**Action:** Delete file, rely on React Flow's native `zoomOnPinch={true}`

**Effort:** 30 minutes

---

## Phase 2: High Priority (2-4 weeks)

### 2.1 Split firestoreLinks.js

**Current:** 2,000 LOC with 50 exports (links + folders + tags + sharing)

**Proposed Split:**

| New File | Responsibility | ~LOC |
|----------|----------------|------|
| `firestoreLinks.js` | Core link CRUD | 600 |
| `firestoreLinkFolders.js` | Folder operations | 400 |
| `firestoreLinkTags.js` | Tag operations | 300 |
| `firestoreLinkSharing.js` | Sharing logic | 400 |
| `firestoreComments.js` | Comments CRUD | 300 |

**Effort:** 8-12 hours

### 2.2 Create Firestore Base Factory

**Issue:** 6 Firestore utility files with duplicate patterns

| File | LOC | Exports |
|------|-----|---------|
| `firestoreLinks.js` | 2,000 | 50 |
| `firestoreContacts.js` | 1,414 | 29 |
| `firestorePipeline.js` | 580 | 22 |
| `firestoreArticles.js` | 538 | 20 |
| `firestoreLeads.js` | 560 | 7 |
| `firestoreTriggers.js` | 508 | 14 |

**Proposed:** Create `firestoreBase.js` with:
```javascript
// Generic CRUD factory
export function createCollectionService(collectionName) {
  return {
    getOne: (id) => getDoc(doc(db, collectionName, id)),
    getAll: (userId) => getDocs(query(collection(db, collectionName), where('userId', '==', userId))),
    create: (data) => addDoc(collection(db, collectionName), { ...data, createdAt: serverTimestamp() }),
    update: (id, data) => updateDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() }),
    delete: (id) => deleteDoc(doc(db, collectionName, id))
  };
}

// Common query builders
export const queryBuilders = {
  byUser: (userId) => where('userId', '==', userId),
  byStatus: (status) => where('status', '==', status),
  orderByDate: (field = 'createdAt', dir = 'desc') => orderBy(field, dir)
};
```

**Effort:** 12-16 hours

### 2.3 Extract TextNoteNode Utilities

**File:** `src/components/unity-plus/TextNoteNode.jsx` (1,891 LOC)

**Extract:**
| New File | Content | ~LOC |
|----------|---------|------|
| `src/utils/encryption.js` | Encryption utilities (lines 8-84) | 80 |
| `src/utils/hubApiKeys.js` | `getHubApiKeys()` function | 50 |

**Effort:** 3-4 hours

---

## Phase 3: Medium Priority (4-6 weeks)

### 3.1 Split CreativeCanvas

**File:** `src/components/unity-studio/CreativeCanvas.jsx` (4,546 LOC)

**Proposed Components:**
| Component | Responsibility |
|-----------|----------------|
| `ColorPicker.jsx` | Color/gradient selection |
| `VectorShapeLibrary.jsx` | Shape presets panel |
| `LayerPanel.jsx` | Layer management UI |
| `CanvasControls.jsx` | Toolbar controls |
| `TextEditor.jsx` | Text element editing |
| `ExportDialog.jsx` | Export options |

**Effort:** 16-24 hours

### 3.2 Split LinkArchiverPage

**File:** `src/pages/admin/LinkArchiverPage.jsx` (5,863 LOC)

**Proposed Components:**
| Component | Responsibility |
|-----------|----------------|
| `LinkTable.jsx` | Table/grid display |
| `LinkFilters.jsx` | Filter UI |
| `LinkBulkActions.jsx` | Bulk operations |
| `LinkDetailsModal.jsx` | Detail view modal |
| `FolderTree.jsx` | Already partially extracted |

**Effort:** 20-30 hours

### 3.3 Split UnityNotesPage

**File:** `src/pages/UnityNotesPage.jsx` (5,714 LOC)

**Proposed Components:**
| Component | Responsibility |
|-----------|----------------|
| `CanvasToolbar.jsx` | Top controls |
| `NodeTypeSelector.jsx` | Node creation UI |
| `CanvasSettingsPanel.jsx` | Canvas options |
| `ExportPanel.jsx` | Export functionality |
| `HistoryControls.jsx` | Undo/redo |

**Effort:** 20-30 hours

---

## Phase 4: Nice-to-Have (Ongoing)

### 4.1 Inline Style Consolidation

**Issue:** 2,159+ instances of `style={{` in components
**Impact:** Bundle size, maintainability

**Approach:**
1. Create utility CSS classes for common patterns
2. Gradually migrate inline styles to Tailwind
3. Extract component-specific styles to CSS modules

**Effort:** Ongoing (1-2 hours per component)

### 4.2 Hook Consolidation

**Large Hooks:**
| File | LOC |
|------|-----|
| `useFirebaseCapsule.js` | 1,064 |
| `useFirebaseJourney.js` | 1,047 |

**Action:** Extract shared patterns to `useFirebaseBase.js`

**Effort:** 8-12 hours

### 4.3 TODO/FIXME Audit

**Active TODOs:**
- `UnityNotesPage.jsx`: "TODO: Wire up notifications"
- `LinkArchiverPage.jsx`: "TODO: Implement mobile tag dropdown"
- `LinkArchiverPage.jsx`: "TODO: Implement pagination"
- `firestoreLinks.js`: "TODO: Implement with Algolia for full-text search"
- `firestoreTriggers.js`: "TODO: Send Slack alert if failsafe.alertOnPause"

**Action:** Create GitHub issues for tracking

**Effort:** 2 hours

---

## Quick Wins (Immediate)

| Task | Effort | Impact |
|------|--------|--------|
| Delete `src/archive/` | 1 hour | 12,075 LOC removed |
| Delete `useIOSPinchZoom.js` | 30 min | 365 LOC removed |
| Add console strip Vite plugin | 1 hour | Production performance |

**Total Quick Wins:** 2.5 hours for ~12,500 LOC cleanup

---

## Effort Summary

| Phase | Priority | Effort | LOC Impact |
|-------|----------|--------|------------|
| Phase 1 | Critical | 8-12 hours | ~13,000 |
| Phase 2 | High | 24-32 hours | ~3,000 |
| Phase 3 | Medium | 60-80 hours | ~5,000 |
| Phase 4 | Low | Ongoing | ~1,000 |

**Total:** ~100-130 hours for comprehensive cleanup

---

## Recommended Order

1. **Delete archive directory** (immediate, low risk)
2. **Delete useIOSPinchZoom.js** (immediate, low risk)
3. **Add console strip plugin** (quick, high impact)
4. **Split firestoreLinks.js** (medium effort, high value)
5. **Create firestoreBase.js** (medium effort, reduces future debt)
6. **Extract TextNoteNode utilities** (small effort, improves maintainability)

---

## Risk Assessment

| Task | Risk | Mitigation |
|------|------|------------|
| Archive deletion | Low | Verified no imports |
| Firestore splits | Medium | Keep same export names, add re-exports |
| Component extraction | Medium | Create barrel exports, update imports |
| Hook refactoring | High | Full test coverage before refactor |
