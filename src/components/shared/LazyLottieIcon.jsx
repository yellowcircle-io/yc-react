import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from 'react';

// Lazy load the heavy Lottie libraries
const Lottie = lazy(() => import('lottie-react'));
const DotLottieReact = lazy(() =>
  import('@lottiefiles/dotlottie-react').then(m => ({ default: m.DotLottieReact }))
);

/**
 * LazyLottieIcon - Lazy-loaded Lottie component to reduce initial bundle
 *
 * Same API as LottieIcon but lazy loads lottie-web (~877KB) only when needed.
 * Falls back to a simple placeholder during loading.
 */
const LazyLottieIcon = ({
  animationData,
  src,
  size = 28,
  isHovered = false,
  alwaysAnimate = false,
  useGrayscale = true,
  alt = 'icon',
  style = {},
  onAnimationLoaded
}) => {
  const [internalHover, setInternalHover] = useState(false);
  const [dotLottieInstance, setDotLottieInstance] = useState(null);
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
    if (dotLottieInstance) {
      try {
        if (shouldAnimate) {
          dotLottieInstance.play();
        } else {
          dotLottieInstance.pause();
          if (typeof dotLottieInstance.goToAndStop === 'function') {
            dotLottieInstance.goToAndStop(0);
          }
        }
      } catch (_err) {
        // Silently handle
      }
    }
  }, [shouldAnimate, dotLottieInstance]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const containerStyle = {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease-out, filter 0.3s ease-out',
    transform: effectiveHover ? 'scale(1.05)' : 'scale(1)',
    filter: useGrayscale ? (effectiveHover ? 'grayscale(0)' : 'grayscale(1)') : 'none',
    flexShrink: 0,
    pointerEvents: 'auto',
    ...style
  };

  const handleDotLottieReady = useCallback((instance) => {
    if (!instance) return;
    setDotLottieInstance(instance);
    try {
      if (!shouldAnimate) {
        instance.pause();
        if (typeof instance.goToAndStop === 'function') {
          instance.goToAndStop(0);
        }
      }
      if (onAnimationLoaded) {
        onAnimationLoaded(instance);
      }
    } catch (_err) {
      // Silently handle
    }
  }, [shouldAnimate, onAnimationLoaded]);

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
          />
        </Suspense>
      </div>
    );
  }

  if (src) {
    return (
      <div
        style={containerStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={alt}
        role="img"
      >
        <Suspense fallback={<Placeholder />}>
          <DotLottieReact
            src={src}
            loop={shouldAnimate}
            autoplay={shouldAnimate}
            style={{ width: size, height: size }}
            dotLottieRefCallback={handleDotLottieReady}
          />
        </Suspense>
      </div>
    );
  }

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
};

export default LazyLottieIcon;
