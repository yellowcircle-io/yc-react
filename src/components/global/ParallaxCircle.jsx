import React, { useMemo } from 'react';
import { useLayout } from '../../contexts/LayoutContext';

/**
 * ParallaxCircle - Yellow circle with parallax motion
 * Uses CSS transform for GPU-accelerated movement (no repaints)
 */
function ParallaxCircle() {
  const { parallaxX, parallaxY } = useLayout();

  // Memoize style to prevent unnecessary object creation
  const circleStyle = useMemo(() => ({
    position: 'fixed',
    top: '20%',
    left: '38%',
    width: '300px',
    height: '300px',
    backgroundColor: '#fbbf24',
    borderRadius: '50%',
    zIndex: 15,
    mixBlendMode: 'multiply',
    // Use transform for GPU acceleration - no layout thrashing
    transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
    willChange: 'transform',
    boxShadow: '0 20px 60px rgba(251,191,36,0.2)',
    pointerEvents: 'none'
  }), [parallaxX, parallaxY]);

  return <div style={circleStyle}></div>;
}

export default React.memo(ParallaxCircle);
