# Scope: UnityNOTES Smooth Scrolling Improvements

**Created:** January 22, 2026
**Status:** Scoped

---

## Current State Analysis

### React Flow Configuration (`UnityNotesPage.jsx:4661-4687`)

| Setting | Current Value | Effect |
|---------|---------------|--------|
| `panOnScroll` | `true` | Mouse wheel pans canvas |
| `zoomOnScroll` | `false` | Scroll does NOT zoom |
| `zoomOnPinch` | `true` | Pinch gesture zooms (native) |
| `zoomOnDoubleClick` | `false` | Double-click doesn't zoom |
| `preventScrolling` | `false` | Page scroll works normally |
| `panOnDrag` | `[1, 2]` | Left/right mouse button pan |
| `minZoom` / `maxZoom` | `0.1` / `4` | Zoom limits |

### Current Animation Timings

- Keyboard zoom: **200ms** duration
- Viewport fit: **400ms** duration
- Touch feedback CSS: **150ms** transitions
- Mobile pulse animation: **1500ms** loop

### Touch Handling

- `touch-action: none !important` on React Flow container
- `-webkit-user-select: none` to prevent text selection
- 44px touch targets for resize handles (Apple HIG compliant)
- Mobile-specific larger handles via `@media (hover: none)`

### Deprecated Code

**`useIOSPinchZoom.js`** (365 lines) - Marked DEPRECATED (v5.2)
- Uses non-passive event listeners that **cause performance issues**
- Recommendation: Remove and rely on React Flow's native `zoomOnPinch={true}`

---

## Issues to Address

### Mobile Issues

1. **Jerky Pan on Touch** - Canvas pan on touch drag feels abrupt
2. **No Momentum Scrolling** - Pan stops immediately when finger lifts
3. **Deprecated Hook** - `useIOSPinchZoom` still in codebase
4. **Touch Conflicts** - 3-finger gestures trigger Safari navigation

### Desktop Issues

1. **No Smooth Pan Transition** - Mouse wheel pan is step-based, not fluid
2. **Zoom Animation** - Keyboard zoom (200ms) feels too fast
3. **No Inertial Pan** - Pan stops when mouse button released

---

## Proposed Improvements

### Phase 1: Quick Wins (2-3 hours)

#### 1.1 Remove Deprecated `useIOSPinchZoom` Hook
- Delete `/src/hooks/useIOSPinchZoom.js`
- Remove any imports/usages
- Verify `zoomOnPinch={true}` handles pinch natively

#### 1.2 Improve CSS Touch Experience
```css
/* Replace touch-action: none with more permissive setting */
.react-flow__viewport {
  touch-action: pan-x pan-y pinch-zoom;  /* Allow native gestures */
  -webkit-overflow-scrolling: touch;     /* Enable momentum scrolling */
}
```

#### 1.3 Extend Animation Durations
```jsx
// In handleZoomIn/handleZoomOut
zoomIn({ duration: 300 });   // Was 200ms
zoomOut({ duration: 300 });  // Was 200ms

// In fitView calls
fitView({ duration: 500, padding: 0.2 });  // Was 400ms
```

### Phase 2: Momentum Panning (4-6 hours)

#### 2.1 Create Momentum Pan Hook

```javascript
// /src/hooks/useMomentumPan.js
export function useMomentumPan(getViewport, setViewport) {
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef(null);
  const animationRef = useRef(null);

  const handlePanStart = useCallback((e) => {
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 };
    cancelAnimationFrame(animationRef.current);
  }, []);

  const handlePanMove = useCallback((e) => {
    if (!lastPosRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    velocityRef.current = { x: dx * 0.3, y: dy * 0.3 };
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePanEnd = useCallback(() => {
    lastPosRef.current = null;

    // Apply momentum with decay
    const animate = () => {
      const { x, y } = velocityRef.current;
      if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) return;

      const viewport = getViewport();
      setViewport({
        x: viewport.x + x,
        y: viewport.y + y,
        zoom: viewport.zoom
      });

      velocityRef.current = { x: x * 0.95, y: y * 0.95 }; // Decay factor
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [getViewport, setViewport]);

  return { handlePanStart, handlePanMove, handlePanEnd };
}
```

#### 2.2 Wire Momentum to React Flow Events
```jsx
const { handlePanStart, handlePanMove, handlePanEnd } = useMomentumPan(getViewport, setViewport);

<ReactFlow
  onPaneMouseDown={handlePanStart}
  onPaneMouseMove={handlePanMove}
  onPaneMouseUp={handlePanEnd}
  // ... existing props
/>
```

### Phase 3: Smooth Scroll Enhancement (3-4 hours)

#### 3.1 Smooth Mouse Wheel Pan
```jsx
// Custom wheel handler with easing
const handleWheel = useCallback((e) => {
  e.preventDefault();

  const viewport = getViewport();
  const targetX = viewport.x - e.deltaX;
  const targetY = viewport.y - e.deltaY;

  // Use CSS-style animation
  animateViewport(
    { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
    { x: targetX, y: targetY, zoom: viewport.zoom },
    { duration: 150, easing: 'easeOutQuad' }
  );
}, [getViewport]);
```

#### 3.2 Add Easing Function Utility
```javascript
// /src/utils/easing.js
export const easeOutQuad = (t) => t * (2 - t);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export function animateValue(from, to, duration, easing, onUpdate, onComplete) {
  const start = performance.now();

  const animate = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    const current = from + (to - from) * easedProgress;
    onUpdate(current);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };

  requestAnimationFrame(animate);
}
```

### Phase 4: Mobile-Specific Optimizations (2-3 hours)

#### 4.1 Optimize Touch Target Interaction
```css
/* Larger touch targets on mobile */
@media (hover: none) and (pointer: coarse) {
  .react-flow__node {
    /* Increase node padding for easier selection */
    padding: 8px;
    margin: -8px;
  }

  /* Reduce animation durations for snappier feel */
  .react-flow__node * {
    transition-duration: 100ms !important;
  }
}
```

#### 4.2 Prevent 3-Finger Safari Gesture Conflicts
```javascript
// Add passive listener to track finger count
useEffect(() => {
  const handleTouchStart = (e) => {
    if (e.touches.length >= 3) {
      e.preventDefault(); // Prevent Safari back/forward gesture
    }
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  return () => document.removeEventListener('touchstart', handleTouchStart);
}, []);
```

---

## Implementation Priority

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| Phase 1 | 2-3 hrs | Medium | **HIGH** |
| Phase 2 | 4-6 hrs | High | **MEDIUM** |
| Phase 3 | 3-4 hrs | Medium | **LOW** |
| Phase 4 | 2-3 hrs | Medium | **MEDIUM** |

**Total Estimate:** 11-16 hours

---

## Testing Checklist

### Desktop
- [ ] Mouse wheel pan feels smooth
- [ ] Keyboard zoom (+ / -) has natural easing
- [ ] Trackpad two-finger scroll pans smoothly
- [ ] Pan stops gracefully with momentum

### Mobile (iOS Safari)
- [ ] Single-finger drag pans canvas
- [ ] Two-finger pinch zooms smoothly
- [ ] Pan has momentum after lift
- [ ] 3-finger gesture doesn't trigger back navigation
- [ ] Touch targets are easy to hit

### Mobile (Android Chrome)
- [ ] Same as iOS tests
- [ ] No browser pull-to-refresh conflicts

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/UnityNotesPage.jsx` | Add momentum handlers, update animations |
| `src/hooks/useIOSPinchZoom.js` | **DELETE** (deprecated) |
| `src/hooks/useMomentumPan.js` | **NEW** (Phase 2) |
| `src/utils/easing.js` | **NEW** (Phase 3) |

---

## Dependencies

None new - uses native browser APIs and React Flow's built-in features.

---

## Risks

1. **Momentum may feel "floaty"** - Tune decay factor (0.95) based on testing
2. **Mobile Safari quirks** - May need WebKit-specific CSS prefixes
3. **Performance on large canvases** - Momentum calculations must be lightweight
