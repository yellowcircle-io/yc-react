import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing scroll offset with smooth scrolling
 * @param {Object} options Configuration options
 * @param {number} options.maxOffset Maximum scroll offset (default: 2)
 * @param {number} options.scrollSpeed Speed multiplier for scroll (default: 1)
 * @param {boolean} options.enableKeyboard Enable keyboard navigation (default: true)
 * @param {boolean} options.enableTouch Enable touch/swipe navigation (default: true)
 * @returns {Object} Scroll state and handlers
 */
export const useScrollOffset = ({
  maxOffset = 2,
  scrollSpeed = 1,
  enableKeyboard = true,
  enableTouch = true
} = {}) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const touchStartRef = useRef(0);
  const scrollTimeoutRef = useRef(null);

  const scrollTo = useCallback((offset) => {
    const clampedOffset = Math.max(0, Math.min(maxOffset, offset));
    setScrollOffset(clampedOffset);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after animation completes
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 500);
  }, [maxOffset]);

  const scrollNext = useCallback(() => {
    setScrollOffset(prev => Math.min(maxOffset, prev + 1));
  }, [maxOffset]);

  const scrollPrev = useCallback(() => {
    setScrollOffset(prev => Math.max(0, prev - 1));
  }, []);

  const scrollToStart = useCallback(() => {
    scrollTo(0);
  }, [scrollTo]);

  const scrollToEnd = useCallback(() => {
    scrollTo(maxOffset);
  }, [scrollTo, maxOffset]);

  // Wheel event handler
  const handleWheel = useCallback((e) => {
    e.preventDefault();

    const delta = e.deltaY || e.deltaX;
    if (Math.abs(delta) < 10) return; // Ignore small deltas

    if (delta > 0) {
      scrollNext();
    } else {
      scrollPrev();
    }
  }, [scrollNext, scrollPrev]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!enableKeyboard) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      scrollNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      scrollPrev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToStart();
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToEnd();
    }
  }, [enableKeyboard, scrollNext, scrollPrev, scrollToStart, scrollToEnd]);

  // Touch/swipe handlers
  const handleTouchStart = useCallback((e) => {
    if (!enableTouch) return;
    touchStartRef.current = e.touches[0].clientX;
  }, [enableTouch]);

  const handleTouchEnd = useCallback((e) => {
    if (!enableTouch) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;

    // Require minimum swipe distance (50px)
    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
      scrollNext();
    } else {
      scrollPrev();
    }
  }, [enableTouch, scrollNext, scrollPrev]);

  // Setup event listeners
  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });

    if (enableKeyboard) {
      window.addEventListener('keydown', handleKeyDown);
    }

    if (enableTouch) {
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (enableKeyboard) {
        window.removeEventListener('keydown', handleKeyDown);
      }
      if (enableTouch) {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleWheel, handleKeyDown, handleTouchStart, handleTouchEnd, enableKeyboard, enableTouch]);

  return {
    scrollOffset,
    isScrolling,
    scrollTo,
    scrollNext,
    scrollPrev,
    scrollToStart,
    scrollToEnd,
    isAtStart: scrollOffset === 0,
    isAtEnd: scrollOffset === maxOffset,
    progress: scrollOffset / maxOffset
  };
};

export default useScrollOffset;
