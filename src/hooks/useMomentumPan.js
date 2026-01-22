/**
 * useMomentumPan - Adds momentum/inertia to canvas panning
 *
 * Tracks velocity during pan gestures and continues movement
 * after release with exponential decay for a smooth feel.
 *
 * Works with React Flow's onMoveStart, onMove, onMoveEnd events.
 */
import { useCallback, useRef } from 'react';

export function useMomentumPan(getViewport, setViewport) {
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastViewportRef = useRef(null);
  const lastTimeRef = useRef(null);
  const animationRef = useRef(null);
  const isPanningRef = useRef(false);

  /**
   * Called when pan starts (onMoveStart)
   * Only tracks user-initiated pans (event !== null)
   */
  const handleMoveStart = useCallback((event, viewport) => {
    // Cancel any ongoing momentum animation
    cancelAnimationFrame(animationRef.current);
    animationRef.current = null;

    // Only track user-initiated pans (programmatic changes pass event = null)
    if (!event) {
      isPanningRef.current = false;
      return;
    }

    // Initialize tracking
    isPanningRef.current = true;
    lastViewportRef.current = { x: viewport.x, y: viewport.y };
    lastTimeRef.current = performance.now();
    velocityRef.current = { x: 0, y: 0 };
  }, []);

  /**
   * Called during pan (onMove) - tracks velocity
   * Only tracks when isPanningRef is true (user-initiated pan)
   */
  const handleMove = useCallback((event, viewport) => {
    // Skip if not user-initiated pan or programmatic change
    if (!isPanningRef.current || !lastViewportRef.current || !event) return;

    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt === 0) return;

    const dx = viewport.x - lastViewportRef.current.x;
    const dy = viewport.y - lastViewportRef.current.y;

    // Exponential moving average for smoother velocity tracking
    // Normalizes to ~60fps (16ms per frame)
    const alpha = 0.4;
    velocityRef.current = {
      x: alpha * (dx / dt * 16) + (1 - alpha) * velocityRef.current.x,
      y: alpha * (dy / dt * 16) + (1 - alpha) * velocityRef.current.y,
    };

    lastViewportRef.current = { x: viewport.x, y: viewport.y };
    lastTimeRef.current = now;
  }, []);

  /**
   * Called when pan ends (onMoveEnd) - applies momentum
   */
  const handleMoveEnd = useCallback(() => {
    isPanningRef.current = false;
    lastViewportRef.current = null;

    // Momentum physics parameters
    const DECAY = 0.92;        // Friction factor (0.9 = more friction, 0.95 = less)
    const MIN_VELOCITY = 0.5;  // Stop threshold in pixels

    const animate = () => {
      const { x, y } = velocityRef.current;

      // Stop when velocity is negligible
      if (Math.abs(x) < MIN_VELOCITY && Math.abs(y) < MIN_VELOCITY) {
        animationRef.current = null;
        return;
      }

      const viewport = getViewport();
      setViewport({
        x: viewport.x + x,
        y: viewport.y + y,
        zoom: viewport.zoom,
      });

      // Apply friction
      velocityRef.current = { x: x * DECAY, y: y * DECAY };
      animationRef.current = requestAnimationFrame(animate);
    };

    // Only apply momentum if there's significant velocity
    if (Math.abs(velocityRef.current.x) > MIN_VELOCITY ||
        Math.abs(velocityRef.current.y) > MIN_VELOCITY) {
      animate();
    }
  }, [getViewport, setViewport]);

  /**
   * Cancel any ongoing momentum animation
   */
  const cancelMomentum = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    velocityRef.current = { x: 0, y: 0 };
  }, []);

  return {
    handleMoveStart,
    handleMove,
    handleMoveEnd,
    cancelMomentum
  };
}

export default useMomentumPan;
