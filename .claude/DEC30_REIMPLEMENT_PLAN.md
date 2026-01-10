# Dec 30 Changes Reimplementation Plan

## ✅ STATUS: COMPLETE (Jan 9, 2026)

All safe features from Dec 30 have been reimplemented:
- Phase 1: CSS Touch Feedback (`69a1072`)
- Phase 2: Visual Viewport/Orientation (`ea80982`)
- Phase 3: Undo/Redo System (`f9e0df9`)

Theme System is a separate task with its own plan.

---

## Analysis Summary

The Dec 30 commit `60c7432` introduced ~4200 lines of changes. After analysis, here's what to reimplement vs skip.

---

## ❌ DO NOT REIMPLEMENT (Problematic)

| Change | Reason |
|--------|--------|
| `withResizableHandles` wrapper | 32x32 opaque handles block touch |
| `withCommentBadge` wrapper | Bug: references undefined `NodeComponent` |
| `withAllEnhancements` wrapper | Combines problematic wrappers |
| `triggerHaptic()` function | Questionable UX, vibration can annoy users |
| `useIOSPinchZoom` hook import | **DEPRECATED** - causes performance issues |
| nodeTypes wrapping | Uses the problematic wrappers |

---

## ✅ REIMPLEMENT (Safe & Valuable)

### Phase 1: CSS Touch Feedback (LOW RISK)
- **Risk Level:** Very Low (pure CSS, GPU-accelerated)
- **Impact:** Improved mobile touch UX
- **Changes:**
  - Active state glow effects for `.nodrag:active`
  - Radial gradient feedback on touch targets
  - Smooth 150ms transitions
  - `touch-action: none` for better touch handling

### Phase 2: Visual Viewport/Orientation (MEDIUM RISK)
- **Risk Level:** Medium (DOM event listeners)
- **Impact:** Fixes iOS Safari orientation bugs
- **Changes:**
  - Extended 300ms debounce (was 150ms)
  - matchMedia for orientation detection
  - Visual Viewport API for address bar handling
  - Prevents canvas jumping on rotation

### Phase 3: Undo/Redo System (MEDIUM RISK)
- **Risk Level:** Medium (state management)
- **Impact:** Core UX feature
- **Changes:**
  - historyRef with past/future arrays
  - 50-entry history limit
  - Keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)
  - recordHistory() before state changes

### Phase 4: Theme System (Already Planned)
- **Status:** Separate task with existing plan
- **Changes:**
  - light/dark/sunset themes
  - Accent color palette (6 colors)
  - Background patterns (dots/lines)
  - localStorage persistence

---

## 🔄 DEFER (Lower Priority)

| Change | Reason |
|--------|--------|
| AI conversation history | Complex, needs more evaluation |
| Comment counts | Needs badge UI to display |
| Floating toolbar | Minor feature |
| Notification state | Lower priority |

---

## Implementation Order

1. **Phase 1: CSS Touch Feedback** - Start here (safest)
2. **Phase 2: Visual Viewport** - Test on Safari mobile
3. **Phase 3: Undo/Redo** - Test thoroughly
4. **Phase 4: Theme System** - Use existing plan

Each phase should be:
1. Implemented incrementally
2. Tested locally with Playwright
3. Committed separately
4. Deployed to staging before production
