# Mobile Optimization Scope - Unity Platform

**Generated:** January 9, 2026
**Agent:** Sleepless Agent (Mobile Optimization Specialist)

---

## Current Mobile Implementation State

The Unity Platform (UnityNotes, UnityMap, UnityStudio) has foundational mobile support with significant optimization opportunities:

### What's Already Implemented

#### 1. iOS Safari-Specific Handling (UnityNotesPage.jsx, lines 814-902)
- Visual Viewport API support for iOS 13+
- Orientation change detection and viewport restoration
- Address bar show/hide handling (300ms animation delay)
- Uses matchMedia for reliable orientation detection

#### 2. Touch Target Sizing (UnityNotesPage.jsx, lines 4356-4400)
- 44px invisible touch targets around resize handles (Apple minimum)
- Touch-friendly styles with `touch-action: none`
- Active state glow effects (rgba(238, 207, 0, 0.15))
- Mobile media queries: `@media (hover: none) and (pointer: coarse)`

#### 3. Mobile Breakpoints (constants.js)
- Mobile breakpoint: 768px
- Tablet breakpoint: 1024px
- Touch detection: `ontouchstart` in window

#### 4. MobileNodeNavigator Component (MobileNodeNavigator.jsx)
- Node clustering for canvas areas
- Jump-to-cluster navigation (400ms animation)
- Shows only on mobile (< 768px) or when 3+ nodes exist
- Positioned at bottom:140px above CircleNav

#### 5. Performance Optimizations
- LazyNodeWrapper with IntersectionObserver (200px preload margin)
- ResizeObserver for accurate height tracking
- IntrinsicSize constraints with `content-visibility: auto`
- Code splitting via Vite: vendor-react, vendor-firebase, vendor-xyflow, vendor-lottie
- 59 useMemo/useCallback optimizations in UnityNotesPage

#### 6. PWA Configuration
- Web manifest with 192x192 and 512x512 icons
- Maskable icon support
- Display: "standalone" mode
- Theme color: #fbbf24 (yellow brand)

---

## P0 (Critical) - Mobile Issues

### 1. React Flow Canvas Mobile Interaction
- Pan/zoom on touch may have jank from large node counts
- Selection mode with touch could be confusing
- No multi-touch gesture documentation
- MiniMap position may overlap mobile UI

### 2. Viewport Stability on Address Bar Toggle
- Visual Viewport API fallback missing for older iOS
- Edge case: rapid show/hide of address bar
- No debouncing on resize handlers

### 3. Touch Feedback Timing
- 44px target is correct but visual feedback may lag
- Pulse animation (1.5s) too long for mobile feel
- No haptic feedback integration

### 4. Image Handling on Mobile
- Cloudinary URLs may not have mobile-optimized transformation params
- No lazy loading strategy beyond IntersectionObserver
- EXIF orientation not always handled

---

## P1 (High Priority) - Improvements

### 1. Canvas Performance
- Implement node virtualization for large capsules (50+ nodes)
- Add touch-specific pan/zoom sensitivity settings
- Reduce re-renders on pan/zoom via memoization

### 2. MiniMap Mobile UX
- Reposition to avoid bottom navigation overlap
- Add collapsible state for more canvas space
- Touch-friendly minimap navigation

### 3. Node Interaction
- Add long-press context menu
- Implement swipe gestures for node actions
- Touch-optimized resize handles (larger hit areas)

### 4. Keyboard Handling
- Virtual keyboard aware layout adjustments
- Auto-scroll to focused inputs
- Handle iOS keyboard dismissal properly

---

## P2 (Medium Priority) - Enhancements

### 1. PWA Improvements
- Service worker caching strategy optimization
- Offline mode with local-first sync
- App-like splash screen
- Push notifications for collaboration

### 2. Performance Monitoring
- Add mobile-specific performance metrics
- Monitor touch interaction latency
- Track mobile-specific errors in Sentry

### 3. Accessibility
- VoiceOver/TalkBack compatibility testing
- Touch target size audit (44x44px minimum)
- Color contrast verification on mobile

---

## P3 (Future) - Nice to Have

### 1. Advanced Gestures
- Pinch-to-zoom on individual nodes
- Two-finger rotation for GroupNodes
- Shake to undo

### 2. Mobile-First Features
- Camera integration for image nodes
- Voice-to-text for notes
- Share sheet integration

### 3. Platform-Specific
- iOS Dynamic Island integration
- Android Material You theming
- iPad Stage Manager support

---

## Recommended Touch Target Sizes

| Element | Current | Recommended | Notes |
|---------|---------|-------------|-------|
| Node resize handles | 32x32px + 44px invisible | ✅ Good | Already meets Apple guidelines |
| Toolbar buttons | 40x40px | 44x44px | Increase for better tap targets |
| Delete buttons | 24x24px | 32x32px (40px hit area) | Add invisible padding |
| Connection handles | 8x8px | 24x24px visible | Significantly increase |
| MiniMap toggle | 32x32px | 44x44px | Increase for accessibility |

---

## Performance Optimization Opportunities

### Quick Wins
1. Add `will-change: transform` to frequently animated elements
2. Use CSS `contain: layout paint` on nodes
3. Reduce shadow complexity on mobile (CSS custom property)
4. Implement `requestIdleCallback` for non-critical updates

### Medium Effort
1. Canvas node virtualization with react-window
2. Image srcset for responsive images
3. Preload critical fonts
4. Service worker cache strategies

### Long-term
1. WASM-based canvas rendering
2. OffscreenCanvas for background processing
3. WebGL-accelerated node rendering

---

## Files Needing Attention

| File | Lines | Issues |
|------|-------|--------|
| `UnityNotesPage.jsx` | 814-902 | iOS viewport handling needs debouncing |
| `UnityNotesPage.jsx` | 4356-4400 | Touch targets good, feedback timing |
| `MobileNodeNavigator.jsx` | All | Cluster algorithm may need optimization |
| `constants.js` | Breakpoints | Consider adding tablet-specific modes |
| `manifest.json` | All | Add screenshots, shortcuts, categories |
| `service-worker.js` | N/A | Create if doesn't exist |

---

## Summary

The Unity Platform has solid mobile foundations with iOS Safari handling and touch targets. Key priorities:

1. **P0:** Fix viewport stability and touch feedback timing
2. **P1:** Improve canvas performance and MiniMap UX
3. **P2:** Enhance PWA capabilities and add performance monitoring
4. **P3:** Add advanced gesture support and platform integrations
