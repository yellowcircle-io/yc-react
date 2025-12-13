/**
 * LazyNodeWrapper - Performance optimization for off-screen canvas nodes
 *
 * Uses IntersectionObserver to:
 * - Render lightweight placeholder when node is off-screen
 * - Swap to full content when node enters viewport
 * - Preload content slightly before visible (rootMargin)
 *
 * Benefits:
 * - Reduces DOM complexity for large canvases
 * - Improves scroll/pan performance on mobile
 * - Decreases memory usage with many nodes
 */

import { useState, useEffect, useRef, memo } from 'react';

const LazyNodeWrapper = memo(({
  children,
  width = 280,
  height = 200,
  placeholderColor = 'rgba(30, 30, 30, 0.6)',
  rootMargin = '200px', // Preload when within 200px of viewport
}) => {
  const [_isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Check if IntersectionObserver is available
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: always render content
      setIsVisible(true);
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasBeenVisible(true);
          } else {
            // Only hide if we want to aggressively unload
            // For now, keep visible once loaded (better UX)
            setIsVisible(entry.isIntersecting);
          }
        });
      },
      {
        root: null, // viewport
        rootMargin, // preload margin
        threshold: 0,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  // Placeholder styles match the node container appearance
  const placeholderStyle = {
    width: `${width}px`,
    minHeight: `${height}px`,
    backgroundColor: placeholderColor,
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // CSS content-visibility optimization
    contentVisibility: 'auto',
    containIntrinsicSize: `${width}px ${height}px`,
  };

  // Loading indicator
  const loadingIndicator = (
    <div style={{
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      border: '2px solid rgba(251, 191, 36, 0.3)',
      borderTopColor: 'rgb(251, 191, 36)',
      animation: 'lazy-spin 1s linear infinite',
    }}>
      <style>{`
        @keyframes lazy-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return (
    <div ref={containerRef}>
      {/* Once visible, always render to avoid layout thrash */}
      {hasBeenVisible ? (
        children
      ) : (
        <div style={placeholderStyle}>
          {loadingIndicator}
        </div>
      )}
    </div>
  );
});

LazyNodeWrapper.displayName = 'LazyNodeWrapper';

export default LazyNodeWrapper;
