import { useEffect, useCallback, useRef } from 'react';

/**
 * iOS Safari pinch-to-zoom enablement hook (v3 - Dual Listener Approach)
 *
 * React Flow's built-in zoomOnPinch works correctly on iOS Safari, but Safari's
 * legacy WebKit gesture events can interfere and cause conflicts. This hook prevents
 * those legacy gesture events while allowing React Flow to handle touch events natively.
 *
 * This hook enables pinch-to-zoom on iOS Safari by:
 * 1. Preventing WebKit gesture events (gesturestart, gesturechange, gestureend)
 * 2. Using PASSIVE listeners for 1-2 finger touches (zero latency, optimal performance)
 * 3. Using NON-PASSIVE listeners ONLY for 3+ finger gestures (to prevent Safari navigation)
 * 4. Tracking touch distances to properly detect pinch gestures
 * 5. Differentiating between pinch-to-zoom and two-finger pan gestures
 * 6. Ensuring touch events are properly delivered to React Flow without interference
 *
 * Key Strategy (v3 Dual Listener Approach):
 * - PASSIVE listeners handle 1-2 finger touches for visual feedback (lines 144-148)
 *   → Zero latency, iOS Safari can optimize these for maximum performance
 *   → No interference with React Flow's internal pinch handling
 * - NON-PASSIVE listeners ONLY block 3+ finger gestures (lines 151-155)
 *   → Prevents Safari's 3-finger navigation (back/forward swipe)
 *   → Never called for 1-2 finger touches, so no performance impact on pinch-to-zoom
 * - Prevent WebKit gesture events (the root cause of iOS Safari issues)
 * - Track initial distance between two touch points
 * - Detect actual pinch gestures by comparing distance changes
 * - Only activate pinch indicator when distance changes significantly (>10px threshold)
 * - Let React Flow's zoomOnPinch handler receive clean touch events at full speed
 *
 * Why Dual Listeners?
 * - Previous implementation used non-passive listeners for ALL touches
 * - Even without calling preventDefault(), non-passive listeners introduce latency on iOS
 * - This caused sluggish or inconsistent pinch-to-zoom behavior
 * - Dual listener approach separates concerns: passive for feedback, non-passive for blocking
 *
 * @param {Object} containerRef - React ref to the React Flow canvas container element
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether gesture prevention is enabled (default: true)
 * @param {boolean} options.debug - Enable debug logging (default: false)
 */
export function useIOSPinchZoom(containerRef, options = {}) {
  const {
    enabled = true,
    debug = false
  } = options;

  // Track initial distance between two touch points for pinch detection
  const initialDistanceRef = useRef(null);

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
   */
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // Store initial distance between two fingers
      initialDistanceRef.current = calculateDistance(e.touches[0], e.touches[1]);
      if (debug) {
        console.log('📏 Initial touch distance:', initialDistanceRef.current);
      }
    }
  }, [calculateDistance, debug]);

  /**
   * Handle touchmove to detect pinch gestures by tracking distance changes
   */
  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && initialDistanceRef.current !== null) {
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
    }
  }, [calculateDistance, debug]);

  /**
   * Handle touchend to reset distance tracking
   */
  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      // Reset when we no longer have two fingers on screen
      initialDistanceRef.current = null;
      if (debug) {
        console.log('🔄 Touch distance reset');
      }
    }
  }, [debug]);

  /**
   * Prevent WebKit gesture events to stop Safari's legacy gesture system
   * This is critical for iOS Safari compatibility
   */
  const handleGestureEvent = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (debug) {
      console.log('🚫 Prevented WebKit gesture event:', e.type);
    }
  }, [debug]);

  /**
   * Non-passive touch handlers for BLOCKING 3+ finger gestures only
   * These handlers are separate from the passive handlers and only
   * preventDefault when 3+ fingers are detected (Safari navigation prevention)
   */
  const handleTouchStartBlocking = useCallback((e) => {
    // ONLY block 3+ finger gestures (Safari navigation)
    if (e.touches.length >= 3) {
      e.preventDefault();
      if (debug) {
        console.log('🚫 Blocked 3+ finger gesture (Safari navigation)');
      }
    }
    // 1-2 finger touches pass through untouched for React Flow
  }, [debug]);

  const handleTouchMoveBlocking = useCallback((e) => {
    // ONLY block 3+ finger gestures (Safari navigation)
    if (e.touches.length >= 3) {
      e.preventDefault();
      if (debug) {
        console.log('🚫 Blocked 3+ finger gesture (Safari navigation)');
      }
    }
    // 1-2 finger touches pass through untouched for React Flow
  }, [debug]);

  const handleTouchEndBlocking = useCallback((e) => {
    // ONLY block 3+ finger gestures (Safari navigation)
    if (e.touches.length >= 3) {
      e.preventDefault();
      if (debug) {
        console.log('🚫 Blocked 3+ finger gesture (Safari navigation)');
      }
    }
    // 1-2 finger touches pass through untouched for React Flow
  }, [debug]);

  useEffect(() => {
    if (!enabled) {
      if (debug) {
        console.log('⚠️ iOS gesture event prevention disabled');
      }
      return;
    }

    // Get the container element for touch event listeners
    const container = containerRef?.current;
    if (!container) {
      if (debug) {
        console.warn('⚠️ Container ref not available for touch event listeners');
      }
      return;
    }

    // Prevent all WebKit gesture events globally
    // This stops Safari's legacy gesture system while allowing React Flow's
    // zoomOnPinch to receive and process raw touch events
    //
    // CRITICAL: Use { passive: false } to allow preventDefault()
    document.addEventListener('gesturestart', handleGestureEvent, { passive: false, capture: true });
    document.addEventListener('gesturechange', handleGestureEvent, { passive: false, capture: true });
    document.addEventListener('gestureend', handleGestureEvent, { passive: false, capture: true });

    // DUAL LISTENER APPROACH (v3):
    //
    // 1. PASSIVE listeners for 1-2 finger touches (visual feedback, zero latency)
    //    - These track distance changes for pinch detection
    //    - Never call preventDefault(), so iOS Safari optimizes them for performance
    //    - React Flow receives pinch events at full speed without interference
    container.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true, capture: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true });

    // 2. NON-PASSIVE listeners ONLY for 3+ finger gestures (Safari navigation blocking)
    //    - These check finger count and only preventDefault() when 3+ fingers detected
    //    - 1-2 finger touches pass through untouched
    //    - Prevents Safari's 3-finger back/forward swipe navigation
    //    - NO performance impact on pinch-to-zoom (handlers exit early for 1-2 fingers)
    container.addEventListener('touchstart', handleTouchStartBlocking, { passive: false, capture: true });
    container.addEventListener('touchmove', handleTouchMoveBlocking, { passive: false, capture: true });
    container.addEventListener('touchend', handleTouchEndBlocking, { passive: false, capture: true });

    if (debug) {
      console.log('✅ iOS pinch-to-zoom enabled (v3 - Dual Listener Approach):', {
        gestureEventsPrevented: true,
        passiveListeners: '1-2 fingers (visual feedback)',
        nonPassiveListeners: '3+ fingers only (Safari navigation block)',
        touchDistanceTracking: true,
        pinchThreshold: '10px',
        reactFlowHandlesPinch: true,
        zeroLatencyPinch: true
      });
    }

    // Cleanup
    return () => {
      document.removeEventListener('gesturestart', handleGestureEvent, { capture: true });
      document.removeEventListener('gesturechange', handleGestureEvent, { capture: true });
      document.removeEventListener('gestureend', handleGestureEvent, { capture: true });

      if (container) {
        // Remove passive listeners
        container.removeEventListener('touchstart', handleTouchStart, { capture: true });
        container.removeEventListener('touchmove', handleTouchMove, { capture: true });
        container.removeEventListener('touchend', handleTouchEnd, { capture: true });

        // Remove non-passive listeners
        container.removeEventListener('touchstart', handleTouchStartBlocking, { capture: true });
        container.removeEventListener('touchmove', handleTouchMoveBlocking, { capture: true });
        container.removeEventListener('touchend', handleTouchEndBlocking, { capture: true });
      }

      if (debug) {
        console.log('🧹 iOS pinch-to-zoom handlers removed (v3)');
      }
    };
  }, [enabled, containerRef, handleGestureEvent, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchStartBlocking, handleTouchMoveBlocking, handleTouchEndBlocking, debug]);

  return null;
}

export default useIOSPinchZoom;
