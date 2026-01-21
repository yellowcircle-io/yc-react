/**
 * useLottieAnimation - Lazy load Lottie JSON animations on demand
 *
 * Reduces initial bundle size by ~283KB by loading animations only when needed.
 * Each animation is code-split into its own chunk.
 *
 * @param {string} animationName - Name of the animation to load
 * @returns {{ animationData: object|null, loading: boolean, error: Error|null }}
 *
 * Usage:
 *   const { animationData, loading } = useLottieAnimation('arrow');
 *   if (loading) return <Placeholder />;
 *   return <Lottie animationData={animationData} />;
 */
import { useState, useEffect } from 'react';

// Animation loader map - each uses dynamic import for code splitting
const animationLoaders = {
  add: () => import('../assets/lottie/add.json'),
  arrow: () => import('../assets/lottie/arrow.json'),
  beaker: () => import('../assets/lottie/beaker.json'),
  checklist: () => import('../assets/lottie/checklist.json'),
  map: () => import('../assets/lottie/map.json'),
  placeholder: () => import('../assets/lottie/placeholder.json'),
  scroll: () => import('../assets/lottie/scroll.json'),
  'scroll-with-quill': () => import('../assets/lottie/scroll-with-quill.json'),
  'settings-gear': () => import('../assets/lottie/settings-gear.json'),
  testTube: () => import('../assets/lottie/testTube.json'),
  wave: () => import('../assets/lottie/wave.json'),
  wip: () => import('../assets/lottie/wip.json'),
};

// Cache for loaded animations (prevents re-fetching)
const animationCache = new Map();

export function useLottieAnimation(animationName) {
  const [animationData, setAnimationData] = useState(() => {
    // Check cache first for instant load
    return animationCache.get(animationName) || null;
  });
  const [loading, setLoading] = useState(!animationCache.has(animationName));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!animationName) {
      setLoading(false);
      return;
    }

    // Already cached
    if (animationCache.has(animationName)) {
      setAnimationData(animationCache.get(animationName));
      setLoading(false);
      return;
    }

    const loader = animationLoaders[animationName];
    if (!loader) {
      setError(new Error(`Unknown animation: ${animationName}`));
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    loader()
      .then((module) => {
        if (mounted) {
          const data = module.default;
          animationCache.set(animationName, data);
          setAnimationData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [animationName]);

  return { animationData, loading, error };
}

// Preload function for critical animations (call early in app lifecycle)
export async function preloadAnimations(names) {
  const promises = names.map(async (name) => {
    if (animationCache.has(name)) return;
    const loader = animationLoaders[name];
    if (loader) {
      const module = await loader();
      animationCache.set(name, module.default);
    }
  });
  await Promise.all(promises);
}

// Export animation names for type safety
export const ANIMATION_NAMES = Object.keys(animationLoaders);

export default useLottieAnimation;
