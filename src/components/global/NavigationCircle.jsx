import React, { useState, useEffect, useRef } from 'react';
import { useLayout } from '../../contexts/LayoutContext';

/**
 * NavigationCircle - Bottom-right navigation circle with scroll indicator
 *
 * Features:
 * - Yellow circle (rgb(251, 191, 36), ~80x80px)
 * - Scroll indicator SVG that rotates based on page state
 * - State 1 (rotation -90): Scroll hint (wave/chevron down)
 * - State 2 (rotation 0): Arrow pointing right (scroll complete)
 * - Click: Opens context menu (unified for desktop/mobile)
 * - Long-press (mobile): Opens context menu
 * - Right-click (desktop): Opens context menu
 */

// Scroll Indicator Circle Component
// Icons are 20% bigger with smooth crossfade transition between wave and arrow
const ScrollIndicatorCircle = ({ size = 78, isHovered = false, rotation = -90 }) => {
  // Determine if we're showing scroll hint or arrow based on rotation
  // rotation -90 = scroll hint, rotation 0 = arrow
  // Smooth transition threshold at -45 degrees
  const showScrollHint = rotation < -45;

  // Calculate opacity for crossfade effect (smooth transition between -60 and -30)
  const waveOpacity = rotation < -60 ? 1 : rotation > -30 ? 0 : ((-rotation - 30) / 30);
  const arrowOpacity = 1 - waveOpacity;

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: 'rgb(251, 191, 36)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: isHovered
        ? '0 8px 24px rgba(238, 207, 0, 0.5)'
        : '0 4px 12px rgba(238, 207, 0, 0.3)',
      transition: 'box-shadow 0.3s ease, transform 0.2s ease',
      transform: isHovered ? 'scale(1.05)' : 'scale(1)'
    }}>
      {/* Center SVG Icon Container - 20% bigger (40px → 48px) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}>
        {/* Wave icon - always rendered, opacity controlled for crossfade */}
        <svg
          viewBox="0 0 40 40"
          width="43"
          height="43"
          style={{
            position: 'absolute',
            opacity: waveOpacity,
            transition: 'opacity 0.4s ease-out',
            animation: waveOpacity > 0.5 ? 'scrollBounce 1.5s ease-in-out infinite' : 'none'
          }}
        >
          {/* Scroll wave indicator */}
          <path
            d="M8,18 Q14,12 20,18 Q26,24 32,18"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {/* Arrow icon - always rendered, opacity controlled for crossfade */}
        <svg
          viewBox="0 0 40 40"
          width="38"
          height="38"
          style={{
            position: 'absolute',
            opacity: arrowOpacity,
            transform: `rotate(${rotation + 90}deg)`,
            transition: 'opacity 0.4s ease-out, transform 0.3s ease-out'
          }}
        >
          {/* Arrow pointing right */}
          <path
            d="M10,20 L26,20 M20,14 L26,20 L20,26"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
};

// Context Menu Component
const CircleContextMenu = ({
  isOpen,
  onClose,
  onFooter,
  onMenu,
  onDarkMode,
  onContact,
  onScrollNext,
  isDarkMode = false
}) => {
  if (!isOpen) return null;

  // Monochrome yellow palette, except Footer (dark grey) and Dark Mode (black)
  const menuItems = [
    { label: 'NEXT →', action: onScrollNext, color: 'rgb(251, 191, 36)', hoverColor: '#d4a000' },
    { label: 'MENU', action: onMenu, color: 'rgb(217, 164, 32)', hoverColor: 'rgb(251, 191, 36)' },
    { label: 'CONTACT', action: onContact, color: 'rgb(183, 138, 28)', hoverColor: 'rgb(217, 164, 32)' },
    { label: 'FOOTER', action: onFooter, color: '#4b5563', hoverColor: '#374151' },
    { label: isDarkMode ? 'LIGHT MODE' : 'DARK MODE', action: onDarkMode, color: '#1f2937', hoverColor: '#111827' }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: '140px',
      right: '25px',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '8px',
      borderRadius: '4px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      zIndex: 360,  // Above NavigationCircle (350)
      minWidth: '140px',
      animation: 'menuSlideUp 0.2s ease-out'
    }}>
      <style>{`
        @keyframes menuSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {menuItems.map((item, index) => (
        <button
          key={item.label}
          onClick={() => {
            item.action();
            onClose();
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: item.color,
            color: 'white',
            border: 'none',
            borderRadius: '0',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            marginBottom: index < menuItems.length - 1 ? '4px' : '0',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = item.hoverColor}
          onMouseOut={(e) => e.target.style.backgroundColor = item.color}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

function NavigationCircle({
  onClick,
  rotation = -90,
  onMenuToggle,
  onDarkModeToggle,
  onContactClick,
  onScrollNext  // New: handler for scroll jump to next section
}) {
  const { footerOpen } = useLayout();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const circleRef = useRef(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showContextMenu && circleRef.current && !circleRef.current.contains(e.target)) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showContextMenu]);

  // Click now opens context menu directly (no footer toggle)
  const handleClick = (e) => {
    e.preventDefault();
    setShowContextMenu(!showContextMenu);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowContextMenu(!showContextMenu);
  };

  // Handle long press for mobile context menu
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  const handleTouchStart = () => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setShowContextMenu(true);
    }, 400); // 400ms for long press
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    // If long press didn't trigger, treat as normal tap (open menu)
    if (!longPressTriggered.current) {
      setShowContextMenu(!showContextMenu);
    }
    longPressTriggered.current = false;
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTriggered.current = false;
  };

  // Menu action handlers
  const handleFooter = () => {
    if (onClick) onClick();
  };

  const handleMenu = () => {
    if (onMenuToggle) onMenuToggle();
  };

  const handleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (onDarkModeToggle) onDarkModeToggle(!isDarkMode);
    // TODO: Implement dark mode theme switching
    console.log('Dark mode toggled:', !isDarkMode);
  };

  const handleContact = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      // Default: scroll to footer contact section or open contact modal
      if (onClick) onClick(); // Open footer as fallback
    }
  };

  const handleScrollNext = () => {
    if (onScrollNext) {
      onScrollNext();
    }
  };

  return (
    <div ref={circleRef}>
      <div
        className="clickable-element"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          bottom: '50px',
          right: '50px',
          zIndex: 350,  // Above everything - sidebar (50), menu overlay (250), slide-over (270), hamburger (260)
          width: '78px',
          height: '78px',
          cursor: 'pointer',
          transform: footerOpen ? 'translateY(-300px)' : 'translateY(0)',
          transition: 'transform 0.5s ease-out',
          WebkitTapHighlightColor: 'transparent'
        }}
        title="Click for menu"
      >
        <ScrollIndicatorCircle size={78} isHovered={isHovered} rotation={rotation} />
      </div>

      {/* Context Menu */}
      <CircleContextMenu
        isOpen={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        onFooter={handleFooter}
        onMenu={handleMenu}
        onDarkMode={handleDarkMode}
        onContact={handleContact}
        onScrollNext={handleScrollNext}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default NavigationCircle;
