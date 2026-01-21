import React, { useState, useRef, useEffect, useCallback, Suspense, lazy, memo } from 'react';

// Lazy load Lottie library (removed unused @lottiefiles/dotlottie-react for ~50% bundle reduction)
const Lottie = lazy(() => import('lottie-react'));

/**
 * LazyLottieIcon - Lazy-loaded Lottie component to reduce initial bundle
 *
 * Lazy loads lottie-web only when needed.
 * Falls back to a simple placeholder during loading.
 * Wrapped with React.memo to prevent unnecessary re-renders.
 */
const LazyLottieIcon = memo(({
  animationData,
  size = 28,
  isHovered = false,
  alwaysAnimate = false,
  useGrayscale = true,
  alt = 'icon',
  style = {},
  onAnimationLoaded
}) => {
  const [internalHover, setInternalHover] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const effectiveHover = isHovered || internalHover;
  const shouldAnimate = alwaysAnimate || effectiveHover;

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setInternalHover(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setInternalHover(false);
    }, 50);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // GPU-accelerated styles with will-change hint
  const containerStyle = {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease-out, filter 0.3s ease-out',
    transform: effectiveHover ? 'scale(1.05)' : 'scale(1)',
    filter: useGrayscale ? (effectiveHover ? 'grayscale(0)' : 'grayscale(1)') : 'none',
    willChange: 'transform, filter',
    flexShrink: 0,
    pointerEvents: 'auto',
    ...style
  };

  // Simple placeholder while loading
  const Placeholder = () => (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '4px',
        backgroundColor: 'rgba(128, 128, 128, 0.2)',
      }}
    />
  );

  if (animationData) {
    return (
      <div
        style={containerStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={alt}
        role="img"
      >
        <Suspense fallback={<Placeholder />}>
          <Lottie
            animationData={animationData}
            loop={shouldAnimate}
            autoplay={shouldAnimate}
            style={{ width: size, height: size }}
            onDOMLoaded={onAnimationLoaded}
          />
        </Suspense>
      </div>
    );
  }

  // Fallback placeholder for missing animation data
  return (
    <div
      style={{
        ...containerStyle,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '4px'
      }}
      aria-label={alt}
      role="img"
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render when these props change
  return (
    prevProps.animationData === nextProps.animationData &&
    prevProps.size === nextProps.size &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.alwaysAnimate === nextProps.alwaysAnimate &&
    prevProps.useGrayscale === nextProps.useGrayscale
  );
});

LazyLottieIcon.displayName = 'LazyLottieIcon';

export default LazyLottieIcon;
