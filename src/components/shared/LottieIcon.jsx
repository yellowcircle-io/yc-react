import React, { useState, useRef, useEffect, useCallback } from 'react';
import Lottie from 'lottie-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

/**
 * LottieIcon - Hybrid Lottie component for unified icon styling
 *
 * Supports both:
 * - Local JSON Lottie files (via lottie-react)
 * - Remote dotLottie files from LottieFiles API (via @lottiefiles/dotlottie-react)
 *
 * Styling matches Sidebar icon pattern:
 * - Default size: 28x28px
 * - Grayscale when not hovered
 * - Animates only on hover
 * - Scale effect on hover
 *
 * Props:
 * @param {Object} animationData - Local JSON Lottie data (from import)
 * @param {string} src - URL to .lottie file (dotLottie format)
 * @param {number} size - Icon size in pixels (default: 28)
 * @param {boolean} isHovered - External hover state control
 * @param {boolean} alwaysAnimate - Override to always animate (default: false)
 * @param {boolean} useGrayscale - Apply grayscale filter when not hovered (default: true)
 * @param {string} alt - Alt text for accessibility
 * @param {Object} style - Additional inline styles
 * @param {function} onAnimationLoaded - Callback when animation is ready
 */
const LottieIcon = ({
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

  // Use external or internal hover state
  const effectiveHover = isHovered || internalHover;
  const shouldAnimate = alwaysAnimate || effectiveHover;

  // Debounced hover handlers for stability
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

  // Control dotLottie playback based on hover
  useEffect(() => {
    if (dotLottieInstance) {
      try {
        if (shouldAnimate) {
          dotLottieInstance.play();
        } else {
          dotLottieInstance.pause();
          // goToAndStop is the correct method for DotLottie
          if (typeof dotLottieInstance.goToAndStop === 'function') {
            dotLottieInstance.goToAndStop(0);
          }
        }
      } catch (err) {
        console.warn('DotLottie control error:', err);
      }
    }
  }, [shouldAnimate, dotLottieInstance]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Common container styles matching Sidebar pattern
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

  // Handle dotLottie ready callback
  const handleDotLottieReady = useCallback((instance) => {
    if (!instance) return;
    setDotLottieInstance(instance);
    try {
      // Start paused unless should animate
      if (!shouldAnimate) {
        instance.pause();
        if (typeof instance.goToAndStop === 'function') {
          instance.goToAndStop(0);
        }
      }
      if (onAnimationLoaded) {
        onAnimationLoaded(instance);
      }
    } catch (err) {
      console.warn('DotLottie init error:', err);
    }
  }, [shouldAnimate, onAnimationLoaded]);

  // Render local JSON Lottie
  if (animationData) {
    return (
      <div
        style={containerStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={alt}
        role="img"
      >
        <Lottie
          animationData={animationData}
          loop={shouldAnimate}
          autoplay={shouldAnimate}
          style={{
            width: size,
            height: size
          }}
        />
      </div>
    );
  }

  // Render remote dotLottie
  if (src) {
    return (
      <div
        style={containerStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={alt}
        role="img"
      >
        <DotLottieReact
          src={src}
          loop={shouldAnimate}
          autoplay={shouldAnimate}
          style={{
            width: size,
            height: size
          }}
          dotLottieRefCallback={handleDotLottieReady}
        />
      </div>
    );
  }

  // Fallback placeholder
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

/**
 * Predefined dotLottie URLs from LottieFiles
 * These can be used as src prop values
 *
 * Usage: <LottieIcon src={LOTTIE_URLS.email} />
 */
export const LOTTIE_URLS = {
  // Communication
  email: 'https://lottie.host/a3c3e8c1-7e3e-4b75-9c3b-3e8c4b5e6f7a/email.lottie',
  send: 'https://lottie.host/b4d4f9d2-8f4f-5c86-0d4c-4f9d5c6f8b0b/send.lottie',
  chat: 'https://lottie.host/c5e5g0e3-9g5g-6d97-1e5d-5g0e6d7g9c1c/chat.lottie',

  // Actions
  edit: 'https://lottie.host/d6f6h1f4-0h6h-7e08-2f6e-6h1f7e8h0d2d/edit.lottie',
  delete: 'https://lottie.host/e7g7i2g5-1i7i-8f19-3g7f-7i2g8f9i1e3e/delete.lottie',
  download: 'https://lottie.host/f8h8j3h6-2j8j-9g20-4h8g-8j3h9g0j2f4f/download.lottie',
  upload: 'https://lottie.host/g9i9k4i7-3k9k-0h31-5i9h-9k4i0h1k3g5g/upload.lottie',

  // Status
  success: 'https://lottie.host/h0j0l5j8-4l0l-1i42-6j0i-0l5j1i2l4h6h/success.lottie',
  error: 'https://lottie.host/i1k1m6k9-5m1m-2j53-7k1j-1m6k2j3m5i7i/error.lottie',
  loading: 'https://lottie.host/j2l2n7l0-6n2n-3k64-8l2k-2n7l3k4n6j8j/loading.lottie',

  // UI Elements
  menu: 'https://lottie.host/k3m3o8m1-7o3o-4l75-9m3l-3o8m4l5o7k9k/menu.lottie',
  close: 'https://lottie.host/l4n4p9n2-8p4p-5m86-0n4m-4p9n5m6p8l0l/close.lottie',
  search: 'https://lottie.host/m5o5q0o3-9q5q-6n97-1o5n-5q0o6n7q9m1m/search.lottie',

  // Note: These are placeholder URLs. Replace with actual LottieFiles URLs
  // To find real URLs: https://lottiefiles.com → Search → Click animation → Get dotLottie URL
};

/**
 * Import local Lottie JSON files
 * These are the existing animations in the project
 */
export { default as addAnimation } from '../../assets/lottie/add.json';
export { default as settingsAnimation } from '../../assets/lottie/settings-gear.json';
export { default as scrollAnimation } from '../../assets/lottie/scroll.json';
export { default as scrollWithQuillAnimation } from '../../assets/lottie/scroll-with-quill.json';
export { default as testTubeAnimation } from '../../assets/lottie/testTube.json';
export { default as beakerAnimation } from '../../assets/lottie/beaker.json';
export { default as waveAnimation } from '../../assets/lottie/wave.json';
export { default as arrowAnimation } from '../../assets/lottie/arrow.json';
export { default as checklistAnimation } from '../../assets/lottie/checklist.json';
export { default as mapAnimation } from '../../assets/lottie/map.json';
export { default as wipAnimation } from '../../assets/lottie/wip.json';
export { default as placeholderAnimation } from '../../assets/lottie/placeholder.json';

export default LottieIcon;
