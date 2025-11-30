import React, { useState, useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import { useLayout } from '../../contexts/LayoutContext';
import arrowAnimation from '../../assets/lottie/arrow.json';
import placeholderAnimation from '../../assets/lottie/placeholder.json';

/**
 * NavigationCircle - Bottom-right navigation circle with Lottie icons
 *
 * Features:
 * - Yellow circle (rgb(251, 191, 36), ~80x80px)
 * - Arrow Lottie animation during scroll (scrollOffset < 200)
 * - Placeholder Lottie animation at scroll end (scrollOffset >= 200)
 * - Click: Opens context menu (unified for desktop/mobile)
 * - Long-press (mobile): Opens context menu
 * - Right-click (desktop): Opens context menu
 *
 * Props:
 * - scrollOffset: Current scroll position (0-200)
 * - isHomePage: Boolean to show arrow/placeholder swap (true) or just placeholder (false)
 */

// Lottie Circle Component with icon swapping
const LottieCircle = ({ size = 78, isHovered = false, scrollOffset = 0, isHomePage = false }) => {
  // On HomePage: show arrow during scroll, placeholder at end
  // On other pages: always show placeholder
  const showArrow = isHomePage && scrollOffset < 200;

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
      {/* Center Lottie Icon Container */}
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
        {/* Arrow Lottie - shown during scroll on HomePage, animates on hover */}
        <div style={{
          position: 'absolute',
          opacity: showArrow ? 1 : 0,
          transition: 'opacity 0.4s ease-out',
          width: '48px',
          height: '48px'
        }}>
          <Lottie
            animationData={arrowAnimation}
            loop={isHovered}
            autoplay={isHovered && showArrow}
            style={{ width: 48, height: 48 }}
          />
        </div>

        {/* Placeholder Lottie - shown at scroll end or on non-HomePage, animates on hover */}
        <div style={{
          position: 'absolute',
          opacity: showArrow ? 0 : 1,
          transition: 'opacity 0.4s ease-out',
          width: '48px',
          height: '48px'
        }}>
          <Lottie
            animationData={placeholderAnimation}
            loop={isHovered}
            autoplay={isHovered && !showArrow}
            style={{ width: 48, height: 48 }}
          />
        </div>
      </div>
    </div>
  );
};

// Context Menu Component - Two column layout with smaller buttons
const CircleContextMenu = ({
  isOpen,
  onClose,
  onFooter,
  onMenu,
  onContact,
  onScrollNext,
  onHome,
  onWorks
}) => {
  if (!isOpen) return null;

  // Top row: HOME and WORKS in two columns
  const topRowItems = [
    { label: 'HOME', action: onHome, color: 'rgb(251, 191, 36)', hoverColor: '#d4a000' },
    { label: 'WORKS', action: onWorks, color: 'rgb(217, 164, 32)', hoverColor: 'rgb(251, 191, 36)' }
  ];

  // Bottom grid: 2x2 layout for NEXT, MENU, CONTACT, FOOTER
  const gridItems = [
    { label: 'FORWARD >', action: onScrollNext, color: 'rgb(183, 138, 28)', hoverColor: 'rgb(217, 164, 32)' },
    { label: 'MENU', action: onMenu, color: 'rgb(150, 113, 23)', hoverColor: 'rgb(183, 138, 28)' },
    { label: 'CONTACT', action: onContact, color: '#4b5563', hoverColor: '#374151' },
    { label: 'FOOTER', action: onFooter, color: '#374151', hoverColor: '#1f2937' }
  ];

  const buttonStyle = (item) => ({
    flex: 1,
    padding: '8px 6px',
    backgroundColor: item.color,
    color: 'white',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontSize: '8px',
    fontWeight: '700',
    letterSpacing: '0.03em',
    transition: 'background-color 0.2s',
    minWidth: '58px'
  });

  return (
    <div style={{
      position: 'fixed',
      bottom: '140px',
      right: '25px',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      padding: '6px',
      borderRadius: '4px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      zIndex: 360,
      width: '130px',
      animation: 'menuSlideUp 0.2s ease-out'
    }}>
      <style>{`
        @keyframes menuSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Top row: HOME / WORKS */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
        {topRowItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.action) item.action();
              onClose();
            }}
            style={buttonStyle(item)}
            onMouseOver={(e) => e.target.style.backgroundColor = item.hoverColor}
            onMouseOut={(e) => e.target.style.backgroundColor = item.color}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 2x2 Grid: NEXT, MENU, CONTACT, FOOTER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
        {gridItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.action) item.action();
              onClose();
            }}
            style={buttonStyle(item)}
            onMouseOver={(e) => e.target.style.backgroundColor = item.hoverColor}
            onMouseOut={(e) => e.target.style.backgroundColor = item.color}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

function NavigationCircle({
  onClick,
  scrollOffset = 0, // Current scroll position (0-200)
  isHomePage = false, // Show arrow/placeholder swap on HomePage
  onMenuToggle,
  onContactClick,
  onScrollNext,  // Handler for scroll jump to next section
  onHomeClick,   // Handler for HOME button
  onWorksClick   // Handler for WORKS button
}) {
  const { footerOpen } = useLayout();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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

  const handleHome = () => {
    if (onHomeClick) {
      onHomeClick();
    }
  };

  const handleWorks = () => {
    if (onWorksClick) {
      onWorksClick();
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
        <LottieCircle size={78} isHovered={isHovered} scrollOffset={scrollOffset} isHomePage={isHomePage} />
      </div>

      {/* Context Menu */}
      <CircleContextMenu
        isOpen={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        onFooter={handleFooter}
        onMenu={handleMenu}
        onContact={handleContact}
        onScrollNext={handleScrollNext}
        onHome={handleHome}
        onWorks={handleWorks}
      />
    </div>
  );
}

export default NavigationCircle;
