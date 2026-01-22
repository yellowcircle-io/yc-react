/**
 * Easing functions and animation utilities
 *
 * Provides smooth transitions for viewport animations.
 * All easing functions take t in range [0, 1] and return value in [0, 1].
 */

// Easing functions
export const easeOutQuad = (t) => t * (2 - t);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
export const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/**
 * Animate a single value from -> to with easing
 *
 * @param {Object} options
 * @param {number} options.from - Start value
 * @param {number} options.to - End value
 * @param {number} options.duration - Duration in milliseconds
 * @param {Function} options.easing - Easing function
 * @param {Function} options.onUpdate - Called each frame with current value
 * @param {Function} [options.onComplete] - Called when animation completes
 * @returns {Function} Cancel function
 */
export function animateValue({ from, to, duration, easing, onUpdate, onComplete }) {
  const start = performance.now();
  let animationId;

  const animate = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    const current = from + (to - from) * easedProgress;
    onUpdate(current);

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };

  animationId = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(animationId);
}

/**
 * Animate viewport position with easing
 *
 * @param {Object} options
 * @param {Function} options.getViewport - React Flow getViewport function
 * @param {Function} options.setViewport - React Flow setViewport function
 * @param {number} options.targetX - Target X position
 * @param {number} options.targetY - Target Y position
 * @param {number} [options.duration=150] - Duration in milliseconds
 * @param {Function} [options.easing=easeOutQuad] - Easing function
 * @returns {Function} Cancel function
 */
export function animateViewport({
  getViewport,
  setViewport,
  targetX,
  targetY,
  duration = 150,
  easing = easeOutQuad
}) {
  const startViewport = getViewport();
  const start = performance.now();
  let animationId;

  const animate = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    setViewport({
      x: startViewport.x + (targetX - startViewport.x) * easedProgress,
      y: startViewport.y + (targetY - startViewport.y) * easedProgress,
      zoom: startViewport.zoom,
    });

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    }
  };

  animationId = requestAnimationFrame(animate);

  return () => cancelAnimationFrame(animationId);
}

export default {
  easeOutQuad,
  easeOutCubic,
  easeOutExpo,
  easeInOutQuad,
  animateValue,
  animateViewport
};
