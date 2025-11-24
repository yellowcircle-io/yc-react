import React, { useState, useEffect } from 'react';
import { COLORS, EFFECTS } from '../styles/constants';

/**
 * Back to Top Button
 * Mobile-only floating action button
 * Appears after scrolling 100vh, smooth scroll to top on click
 *
 * Features:
 * - Fixed position (bottom-right)
 * - Yellow circle with ↑ icon
 * - Fade in/out based on scroll position
 * - Hidden on desktop (>800px)
 * - Touch-optimized (48px target)
 */

function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);

  useEffect(() => {
    // Handle resize
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 800);
    };

    // Handle scroll
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const viewportHeight = window.innerHeight;

      // Show after scrolling past first viewport
      setVisible(scrolled > viewportHeight);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Hide on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '80px', // Above safe area
        right: '20px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: COLORS.yellow,
        color: COLORS.black,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: '700',
        boxShadow: EFFECTS.shadow.yellow,
        zIndex: 999,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.8)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: visible ? 'auto' : 'none',
        // Safe area support
        paddingBottom: 'env(safe-area-inset-bottom)',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = 'scale(0.9)';
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = visible ? 'scale(1)' : 'scale(0.8)';
      }}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}

export default BackToTop;
