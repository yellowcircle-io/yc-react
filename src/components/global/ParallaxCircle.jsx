import React from 'react';
import { useLayout } from '../../contexts/LayoutContext';

/**
 * ParallaxCircle - Yellow circle with parallax motion
 * Matches HomePage.jsx lines 926-939 exactly
 */
function ParallaxCircle() {
  const { parallaxX, parallaxY } = useLayout();

  return (
    <div style={{
      position: 'fixed',
      top: `calc(20% + ${parallaxY}px)`,
      left: `calc(38% + ${parallaxX}px)`,
      width: '300px',
      height: '300px',
      backgroundColor: '#fbbf24',
      borderRadius: '50%',
      zIndex: 15,
      mixBlendMode: 'multiply',
      transition: 'all 0.1s ease-out',
      boxShadow: '0 20px 60px rgba(251,191,36,0.2)',
      pointerEvents: 'none'
    }}></div>
  );
}

export default ParallaxCircle;
