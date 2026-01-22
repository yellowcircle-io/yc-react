/**
 * useSmoothWheel - Adds smooth easing to mouse wheel pan
 *
 * Batches rapid wheel events and animates pan with easeOutQuad
 * for a more fluid feel compared to step-based default.
 */
import { useCallback, useRef, useEffect } from 'react';
import { animateViewport, easeOutQuad } from '../utils/easing';

export function useSmoothWheel(containerRef, getViewport, setViewport, enabled = true) {
  const cancelRef = useRef(null);
  const accumulatedDelta = useRef({ x: 0, y: 0 });
  const debounceRef = useRef(null);

  const handleWheel = useCallback((e) => {
    // Only handle wheel on canvas pane, not on nodes or controls
    if (e.target.closest('.react-flow__node') ||
        e.target.closest('.react-flow__controls') ||
        e.target.closest('.react-flow__minimap')) {
      return;
    }

    e.preventDefault();

    // Cancel any ongoing animation
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }

    // Accumulate delta for batched animation
    accumulatedDelta.current.x += e.deltaX;
    accumulatedDelta.current.y += e.deltaY;

    // Debounce to batch rapid wheel events (~1 frame)
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const viewport = getViewport();
      const targetX = viewport.x - accumulatedDelta.current.x;
      const targetY = viewport.y - accumulatedDelta.current.y;

      cancelRef.current = animateViewport({
        getViewport,
        setViewport,
        targetX,
        targetY,
        duration: 120,
        easing: easeOutQuad,
      });

      // Reset accumulated delta
      accumulatedDelta.current = { x: 0, y: 0 };
    }, 16);
  }, [getViewport, setViewport]);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    // Find the React Flow pane element
    const pane = container.querySelector('.react-flow__pane');
    if (!pane) return;

    pane.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      pane.removeEventListener('wheel', handleWheel);
      clearTimeout(debounceRef.current);
      if (cancelRef.current) {
        cancelRef.current();
      }
    };
  }, [containerRef, handleWheel, enabled]);
}

export default useSmoothWheel;
