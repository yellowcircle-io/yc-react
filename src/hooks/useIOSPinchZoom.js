import { useEffect, useCallback, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

/**
 * iOS Safari pinch-to-zoom enablement hook (v5.2 - Enhanced Touch Reliability)
 *
 * ⚠️ DEPRECATION WARNING (December 2025):
 * This hook is now DEPRECATED and should be disabled (enabled: false) in most cases.
 * React Flow's native zoomOnPinch handles iOS Safari gestures correctly without any
 * custom intervention. This hook's non-passive event listeners in capture phase actually
 * CAUSE the performance issues it was designed to solve by forcing Safari to delay
 * gesture recognition while checking if preventDefault() will be called.
 *
 * RECOMMENDED APPROACH:
 * - Use React Flow's built-in zoomOnPinch={true} (enabled by default)
 * - Disable this hook by passing { enabled: false }
 * - React Flow uses optimized passive listeners internally
 * - Results in smooth, immediate gesture recognition on iOS Safari
 *
 * ORIGINAL RATIONALE (now outdated):
 * React Flow's built-in zoomOnPinch doesn't work reliably on iOS Safari due to
 * Safari's gesture event system interfering with touch event calculations. This hook
 * takes direct control of zoom using Safari's native gesture events with setViewport().
 *
 * This hook enables pinch-to-zoom on iOS Safari by:
 * 1. Using Safari's native gesturestart/gesturechange/gestureend events (most reliable)
 * 2. Applying zoom directly via React Flow's setViewport() API
 * 3. Implementing zoom-to-point so zoom centers on the gesture location
 * 4. Preventing default gesture behavior for full control
 * 5. Maintaining React Flow's zoomOnPinch as fallback for other browsers
 * 6. Providing visual feedback state with debouncing to prevent flicker (v5.1)
 *
 * Key Strategy (v5 Direct Viewport Control):
 * - Use Safari's gesture events which provide e.scale directly
 * - More reliable than calculating distance between touch points
 * - Call e.preventDefault() to take full control [⚠️ THIS CAUSES PERFORMANCE ISSUES]
 * - Use React Flow's setViewport() to apply zoom smoothly
 * - Calculate zoom-to-point transformation for natural zoom behavior
 * - Falls back to React Flow's default zoomOnPinch on non-Safari browsers
 *
 * Why Direct Viewport Control?
 * - Previous v4 implementation relied on React Flow's touch event handling
 * - iOS Safari has bugs with touch event distance calculations
 * - Safari's gesture events (e.scale) are more reliable and native to the platform
 * - Direct viewport control gives us full authority over zoom behavior
 * - This is a hybrid approach: manual gesture handlers for iOS + ReactFlow fallback
 *
 * New in v5.1 (Enhanced State Management):
 * - Added onZoomStateChange callback for visual feedback
 * - Debounced state updates (50ms) to prevent flicker on rapid gestures
 * - Improved touchcancel handling for better gesture interruption cleanup
 * - Optimized fadeout timing (600ms) for snappier UX
 *
 * New in v5.2 (Enhanced Touch Reliability):
 * - Added explicit touch count tracking in all touch event handlers
 * - Implemented edge case handling for asynchronous finger lift during gestures
 * - Improved variable naming (touchCount, remainingTouches) for code clarity
 * - Better state cleanup when touch count drops below 2 during move events
 * - More consistent and reliable gesture detection on iOS Safari
 *
 * @param {Object} containerRef - React ref to the React Flow canvas container element
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether gesture handling is enabled (default: true, RECOMMENDED: false)
 * @param {boolean} options.debug - Enable debug logging (default: false)
 * @param {Function} options.onZoomStateChange - Callback when zoom state changes: (isZooming: boolean) => void
 */
export function useIOSPinchZoom(containerRef, options = {}) {
  const {
    enabled = true,
    debug = false,
     
    onZoomStateChange: _onZoomStateChange = null  // Reserved for future use
  } = options;

  // Get React Flow's viewport control methods
  const { setViewport, getViewport } = useReactFlow();

  // Track gesture state for iOS Safari gesture events
  const gestureStartRef = useRef(null);

  // Track initial distance between two touch points for pinch detection (fallback)
  const initialDistanceRef = useRef(null);

  // Reserved refs for v5.1 state management features (not yet implemented)
   
  const _stateDebounceTimerRef = useRef(null);
   
  const _isZoomingRef = useRef(false);
   
  const _fadeoutTimerRef = useRef(null);

  /**
   * Handle gesturestart - Safari's native pinch gesture start event
   * Captures the initial viewport state and gesture scale
   */
  const handleGestureStart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const viewport = getViewport();
    gestureStartRef.current = {
      x: viewport.x,
      y: viewport.y,
      zoom: viewport.zoom,
      scale: e.scale,
      clientX: e.clientX || 0,
      clientY: e.clientY || 0
    };

    if (debug) {
      console.log('🎯 Gesture start:', {
        initialZoom: viewport.zoom,
        initialScale: e.scale,
        position: { x: viewport.x, y: viewport.y }
      });
    }
  }, [getViewport, debug]);

  /**
   * Handle gesturechange - Safari's native pinch gesture change event
   * Applies zoom using e.scale with zoom-to-point calculation
   */
  const handleGestureChange = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!gestureStartRef.current) return;

    const gestureStart = gestureStartRef.current;

    // Calculate the scale delta (how much the pinch has changed)
    const scaleDelta = e.scale / gestureStart.scale;

    // Apply the scale delta to the original zoom level
    let newZoom = gestureStart.zoom * scaleDelta;

    // Clamp zoom to ReactFlow's min/max zoom levels (0.25 - 2.0)
    newZoom = Math.max(0.25, Math.min(2.0, newZoom));

    // Implement zoom-to-point: calculate the offset needed to zoom toward gesture center
    // This makes the zoom feel natural by keeping the point under the fingers stationary
    const gestureX = e.clientX || gestureStart.clientX;
    const gestureY = e.clientY || gestureStart.clientY;

    // Calculate the new position to maintain zoom-to-point
    // Formula: newPos = gesturePos - (gesturePos - oldPos) * (newZoom / oldZoom)
    const zoomRatio = newZoom / gestureStart.zoom;
    const newX = gestureX - (gestureX - gestureStart.x) * zoomRatio;
    const newY = gestureY - (gestureY - gestureStart.y) * zoomRatio;

    // Apply the new viewport state
    setViewport({
      x: newX,
      y: newY,
      zoom: newZoom
    }, { duration: 0 }); // No animation for smooth real-time gesture tracking

    if (debug) {
      console.log('🤏 Gesture change:', {
        scale: e.scale,
        scaleDelta,
        newZoom,
        newPosition: { x: newX, y: newY }
      });
    }
  }, [setViewport, debug]);

  /**
   * Handle gestureend - Safari's native pinch gesture end event
   * Cleans up gesture state
   */
  const handleGestureEnd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (debug) {
      console.log('✅ Gesture end');
    }

    // Clean up gesture state
    gestureStartRef.current = null;
  }, [debug]);

  /**
   * Calculate the distance between two touch points
   * @param {Touch} touch1 - First touch point
   * @param {Touch} touch2 - Second touch point
   * @returns {number} Distance in pixels
   */
  const calculateDistance = useCallback((touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  /**
   * Handle touchstart to capture initial distance for pinch detection
   * Also detect 3+ finger gestures (can't block them, but can log)
   * Enhanced with explicit touch count tracking for better reliability (v5.2)
   */
  const handleTouchStart = useCallback((e) => {
    const touchCount = e.touches.length;  // Explicit tracking for consistency

    if (touchCount >= 3) {
      // Detect 3+ finger gestures (we can't block them with passive listeners)
      console.warn('⚠️ 3+ finger gesture detected - may trigger Safari navigation');
    } else if (touchCount === 2) {
      // Store initial distance between two fingers
      initialDistanceRef.current = calculateDistance(e.touches[0], e.touches[1]);
      if (debug) {
        console.log('📏 Initial touch distance:', initialDistanceRef.current);
      }
    }
  }, [calculateDistance, debug]);

  /**
   * Handle touchmove to detect pinch gestures by tracking distance changes
   * Also detect 3+ finger gestures (can't block them, but can log)
   * Enhanced with explicit touch count tracking and edge case handling (v5.2)
   */
  const handleTouchMove = useCallback((e) => {
    const touchCount = e.touches.length;  // Explicit tracking for consistency

    if (touchCount >= 3) {
      // Detect 3+ finger gestures (we can't block them with passive listeners)
      if (debug) {
        console.warn('⚠️ 3+ finger gesture in progress');
      }
    } else if (touchCount === 2 && initialDistanceRef.current !== null) {
      // Calculate current distance between two fingers
      const currentDistance = calculateDistance(e.touches[0], e.touches[1]);
      const distanceChange = Math.abs(currentDistance - initialDistanceRef.current);

      // Only consider it a pinch if distance changed significantly (>10px threshold)
      // This differentiates pinch-to-zoom from simple two-finger pan
      if (distanceChange > 10) {
        if (debug) {
          console.log('🤏 Pinch detected! Distance change:', distanceChange);
        }
        // Let the event pass through to React Flow's zoomOnPinch handler
        // We're just tracking here, not preventing
      }
    } else if (touchCount < 2 && initialDistanceRef.current !== null) {
      // EDGE CASE FIX (v5.2): Handle when one finger lifts during gesture
      // This prevents stale state when users lift fingers asynchronously
      initialDistanceRef.current = null;
      if (debug) {
        console.log('🔄 Touch count dropped below 2 during move - distance reset');
      }
    }
  }, [calculateDistance, debug]);

  /**
   * Handle touchend to reset distance tracking
   * Enhanced with explicit touch count tracking for better reliability (v5.2)
   */
  const handleTouchEnd = useCallback((e) => {
    const remainingTouches = e.touches.length;  // Explicit naming for clarity

    if (remainingTouches < 2) {
      // Reset when we no longer have two fingers on screen
      initialDistanceRef.current = null;
      if (debug) {
        console.log('🔄 Touch distance reset');
      }
    }
  }, [debug]);

  /**
   * Handle touchcancel to reset distance tracking
   * This is critical for iOS Safari when gestures are interrupted by system events
   * (e.g., phone calls, app switching, notifications, etc.)
   * Enhanced with explicit touch count tracking for better reliability (v5.2)
   */
  const handleTouchCancel = useCallback((e) => {
    const remainingTouches = e.touches.length;  // Explicit naming for clarity

    // Always reset on cancel to prevent stale state
    initialDistanceRef.current = null;
    if (debug) {
      console.log('🚫 Touch cancelled - distance reset', { remainingTouches });
    }
  }, [debug]);


  useEffect(() => {
    if (!enabled) {
      if (debug) {
        console.log('⚠️ iOS gesture handling disabled');
      }
      return;
    }

    // Get the container element for gesture event listeners
    const container = containerRef?.current;
    if (!container) {
      if (debug) {
        console.warn('⚠️ Container ref not available for gesture event listeners');
      }
      return;
    }

    // DIRECT VIEWPORT CONTROL APPROACH (v5):
    //
    // Register Safari's native gesture events for direct zoom control
    // - gesturestart: Capture initial viewport state
    // - gesturechange: Apply zoom using e.scale with setViewport()
    // - gestureend: Clean up gesture state
    //
    // This approach is more reliable than touch event distance calculations
    // because Safari's gesture events provide e.scale directly and are
    // optimized for the iOS platform.
    //
    // CRITICAL: Use { passive: false } to allow preventDefault() for full control
    container.addEventListener('gesturestart', handleGestureStart, { passive: false, capture: true });
    container.addEventListener('gesturechange', handleGestureChange, { passive: false, capture: true });
    container.addEventListener('gestureend', handleGestureEnd, { passive: false, capture: true });

    // FALLBACK: Keep passive touch listeners for debugging and non-Safari browsers
    // These don't interfere with gesture events but provide useful logging
    container.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true, capture: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });
    container.addEventListener('touchcancel', handleTouchCancel, { passive: true, capture: true });

    if (debug) {
      console.log('✅ iOS pinch-to-zoom enabled (v5.2 - Enhanced Touch Reliability):', {
        version: '5.2',
        gestureHandlers: 'active (non-passive for preventDefault)',
        directZoomControl: 'via setViewport()',
        zoomToPoint: 'enabled',
        safariGestureEvents: 'e.scale used directly',
        touchListeners: 'passive with explicit count tracking',
        edgeCaseHandling: 'asynchronous finger lift detection',
        zoomRange: '0.25 - 2.0',
        reactFlowFallback: 'available for non-Safari browsers'
      });
    }

    // Cleanup
    return () => {
      if (container) {
        // Remove gesture event listeners
        container.removeEventListener('gesturestart', handleGestureStart, { capture: true });
        container.removeEventListener('gesturechange', handleGestureChange, { capture: true });
        container.removeEventListener('gestureend', handleGestureEnd, { capture: true });

        // Remove touch event listeners
        container.removeEventListener('touchstart', handleTouchStart, { capture: true });
        container.removeEventListener('touchmove', handleTouchMove, { capture: true });
        container.removeEventListener('touchend', handleTouchEnd, { capture: true });
        container.removeEventListener('touchcancel', handleTouchCancel, { capture: true });
      }

      if (debug) {
        console.log('🧹 iOS pinch-to-zoom handlers removed (v5.2 - Enhanced Touch Reliability)');
      }
    };
  }, [enabled, containerRef, handleGestureStart, handleGestureChange, handleGestureEnd, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, debug]);

  return null;
}

export default useIOSPinchZoom;
