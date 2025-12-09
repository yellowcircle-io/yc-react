import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { navigationItems } from '../config/navigationItems';

function HomePage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  // HomePage-specific state
  const [scrollOffset, setScrollOffset] = useState(0);
  const [navCircleRotation, setNavCircleRotation] = useState(0);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inject stagger animation
  useEffect(() => {
    const styleId = 'text-stagger-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Initialize navigation circle animation on page load
  useEffect(() => {
    // Animate to starting position on mount
    setTimeout(() => {
      setNavCircleRotation(-90);
    }, 500);
  }, []);

  // Simplified smooth scrolling system
  const updateScrollOffset = useCallback((delta) => {
    setScrollOffset(prev => {
      const newOffset = Math.max(0, Math.min(200, prev + delta));

      // Update navigation circle rotation
      if (newOffset >= 200) {
        setNavCircleRotation(0);
      } else {
        const rotationProgress = (newOffset / 200) * 90;
        setNavCircleRotation(-90 + rotationProgress);
      }

      return newOffset;
    });
  }, []);

  // Wheel handling
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();

      let delta = 0;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        delta = e.deltaX * 0.05;
      } else {
        delta = e.deltaY * 0.05;
      }

      updateScrollOffset(delta);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [updateScrollOffset]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          updateScrollOffset(10);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          updateScrollOffset(-10);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateScrollOffset]);

  // Touch handling
  useEffect(() => {
    const handleTouchStart = (e) => {
      const target = e.target;
      const isBackground = target.style.backgroundImage ||
                          target.closest('[style*="background-image"]') ||
                          target.tagName === 'BODY' ||
                          target.classList.contains('scrollable-area');

      if (!isBackground ||
          target.closest('.clickable-element') ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('nav') ||
          target.closest('[role="button"]') ||
          target.closest('.sidebar')) {
        return;
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchMove = (e) => {
      const target = e.target;
      const isBackground = target.style.backgroundImage ||
                          target.closest('[style*="background-image"]') ||
                          target.tagName === 'BODY' ||
                          target.classList.contains('scrollable-area');

      if (!isBackground ||
          target.closest('.clickable-element') ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('nav') ||
          target.closest('[role="button"]') ||
          target.closest('.sidebar')) {
        return;
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          const scrollDelta = -deltaX * 0.2;

          if (Math.abs(scrollDelta) > 1) {
            updateScrollOffset(scrollDelta);
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
          }
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = { x: 0, y: 0 };
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [updateScrollOffset]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    setScrollOffset(0);
    setNavCircleRotation(-90);
    handleMenuToggle(); // Close menu if open
  };

  // Handle navigation circle click - progress through pages or toggle footer
  const handleNavCircleClick = () => {
    if (scrollOffset >= 200) {
      handleFooterToggle();
    } else if (scrollOffset >= 100) {
      setScrollOffset(200);
      setNavCircleRotation(0);
    } else {
      setScrollOffset(100);
      const rotationProgress = (100 / 200) * 90;
      setNavCircleRotation(-90 + rotationProgress);
    }
  };

  // Handle scroll jump to next page (NEXT button in CircleNav menu)
  const handleScrollNext = () => {
    if (scrollOffset >= 200) {
      // Already at end, open footer
      handleFooterToggle();
    } else if (scrollOffset >= 100) {
      // Jump from page 2 to page 3
      setScrollOffset(200);
      setNavCircleRotation(0);
    } else {
      // Jump from page 1 to page 2
      setScrollOffset(100);
      const rotationProgress = (100 / 200) * 90;
      setNavCircleRotation(-90 + rotationProgress);
    }
  };

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      onScrollNext={handleScrollNext}
      navigationItems={navigationItems}
      navCircleRotation={navCircleRotation}
      scrollOffset={scrollOffset}
      pageLabel="HOME"
      isHomePage={true}
    >
      {/* 3 Background Images - Horizontal Scrolling */}
      <div className="scrollable-area" style={{
        position: 'fixed',
        top: 0,
        left: scrollOffset <= 100 ? `-${scrollOffset}vw` : '-100vw',
        width: '100vw',
        height: '100dvh', // Use dvh for mobile browser toolbar awareness
        backgroundImage: 'url(https://res.cloudinary.com/yellowcircle-io/image/upload/v1764457813/Gemini_Generated_Image_jpswjujpswjujpsw_hi7ltv)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 1,
        transition: 'left 0.1s ease-out',
        willChange: 'left',
        filter: 'grayscale(100%) contrast(1.17)', // Reduced from 1.3 (10% less)
        WebkitFilter: 'grayscale(100%) contrast(1.17)'
      }}></div>

      <div className="scrollable-area" style={{
        position: 'fixed',
        top: 0,
        left: scrollOffset <= 100 ? `${100 - scrollOffset}vw` : '0vw',
        width: '100vw',
        height: '100dvh', // Use dvh for mobile browser toolbar awareness
        backgroundImage: 'url(https://res.cloudinary.com/yellowcircle-io/image/upload/v1764457814/Gemini_Generated_Image_7mrn897mrn897mrn_hzgvsb)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 2,
        transition: 'left 0.1s ease-out',
        willChange: 'left',
        filter: 'grayscale(100%) contrast(1.17)', // Reduced from 1.3 (10% less)
        WebkitFilter: 'grayscale(100%) contrast(1.17)'
      }}></div>

      <div className="scrollable-area" style={{
        position: 'fixed',
        top: 0,
        left: scrollOffset > 100 ? `${200 - scrollOffset}vw` : '100vw',
        width: '100vw',
        height: '100dvh', // Use dvh for mobile browser toolbar awareness
        backgroundImage: 'url(https://res.cloudinary.com/yellowcircle-io/image/upload/v1764457815/Gemini_Generated_Image_i20pegi20pegi20p_pa7t5w)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 3,
        transition: 'left 0.1s ease-out',
        willChange: 'left',
        filter: 'grayscale(100%) contrast(1.17)', // Reduced from 1.3 (10% less)
        WebkitFilter: 'grayscale(100%) contrast(1.17)'
      }}></div>

      {/* Talk Bubble Description - Upper right, appears on final page */}
      {scrollOffset >= 180 && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '100px' : '120px',
          right: isMobile ? '20px' : '80px',
          zIndex: 60,
          pointerEvents: 'none',
          animation: 'fadeInUp 0.6s ease-in-out 0.1s both'
        }}>
          {/* Talk bubble container */}
          <div style={{
            backgroundColor: '#f1efe8',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: isMobile ? '12px 14px' : '16px 20px',
            borderRadius: '12px 12px 12px 0',
            maxWidth: isMobile ? '200px' : '320px',
            textAlign: 'right',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <p style={{
              margin: '0',
              fontSize: isMobile ? '11px' : '14px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: '400',
              letterSpacing: '0',
              lineHeight: '1.5',
              color: 'rgba(0, 0, 0, 0.85)'
            }}>
              yellowCircle helps early-stage and small-to-medium sized companies fix their growth systems in weeks, not quarters. We bring clarity to chaos and turn complexity into competitive advantage.
            </p>
          </div>
        </div>
      )}

      {/* Main Content - H1 and Subtitle - Fixed position from bottom */}
      {/* Positioned to match FINAL scroll state - buttons separate to prevent jump */}
      <div style={{
        position: 'fixed',
        bottom: footerOpen ? '420px' : (isMobile ? '120px' : '80px'),
        left: sidebarOpen ? 'min(35vw, 472px)' : '80px',
        right: isMobile ? '100px' : '140px',
        padding: isMobile ? '0 20px' : '0 40px',
        zIndex: 61,
        pointerEvents: 'none',
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out'
      }}>
        <div style={{
          color: 'black',
          fontWeight: '600',
          fontSize: 'clamp(0.855rem, 1.98vw, 1.62rem)',
          lineHeight: '1.3',
          letterSpacing: '0.05em',
          textAlign: 'left',
          maxWidth: isMobile ? '100%' : '780px'
        }}>
          {/* H1 - YOUR STORY - Always same position */}
          <h1 style={{
            margin: '-1rem 0px',
            backdropFilter: 'blur(1px)',
            WebkitBackdropFilter: 'blur(1px)',
            display: 'inline-block',
            fontSize: isMobile ? 'clamp(2rem, 15vw, 4rem)' : 'clamp(1.17rem, 18vw, 15rem)',
            fontWeight: '900',
            padding: '-40px 0px',
            lineHeight: '0.82',
            fontFamily: 'Helvetica, Arial, sans-serif',
            letterSpacing: isMobile ? '-2px' : '-5px',
            color: 'rgba(251, 191, 36, 0.7)',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            YOUR STORY
          </h1>

          {/* Subtitle - Always same position, only text changes */}
          <p
            key={`page-${scrollOffset < 100 ? '1' : scrollOffset < 200 ? '2' : '3'}`}
            style={{
              margin: '3px 0',
              backgroundColor: 'rgba(241, 239, 232, 0.38)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'inline-block',
              padding: '2px 6px',
              fontSize: isMobile ? 'clamp(1.2rem, 5vw, 2rem)' : 'clamp(1.17rem, 6.2vw, 3rem)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: '400',
              letterSpacing: '-2px',
              animation: 'fadeInUp 0.6s ease-in-out 0.4s both'
            }}
          >
            {scrollOffset < 100
              ? 'Deserves to be Told'
              : scrollOffset < 200
                ? 'Built Better and Faster'
                : 'From Beginning to End'}
          </p>
        </div>
      </div>

      {/* Buttons - Separate fixed container to prevent H1/subtitle jump */}
      {scrollOffset >= 180 && (
        <div style={{
          position: 'fixed',
          bottom: footerOpen ? '340px' : '40px',
          left: sidebarOpen ? 'min(35vw, 472px)' : '80px',
          right: isMobile ? '100px' : '140px',
          padding: isMobile ? '0 20px' : '0 40px',
          zIndex: 61,
          pointerEvents: 'auto',
          transition: 'left 0.5s ease-out, bottom 0.5s ease-out'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? '8px' : '12px',
            animation: 'fadeInUp 0.6s ease-in-out 0.5s both'
          }}>
            <button
              onClick={() => navigate('/services')}
              style={{
                padding: isMobile ? '8px 12px' : '12px 24px',
                minHeight: isMobile ? '36px' : '44px',
                backgroundColor: 'rgba(251, 191, 36, 0.95)',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                fontSize: isMobile ? '10px' : '11px',
                fontWeight: '700',
                letterSpacing: '0.02em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.95)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              SERVICES
            </button>
            <button
              onClick={() => navigate('/journeys')}
              style={{
                padding: isMobile ? '8px 12px' : '12px 24px',
                minHeight: isMobile ? '36px' : '44px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'black',
                border: '1px solid rgba(251, 191, 36, 0.5)',
                borderRadius: '4px',
                fontSize: isMobile ? '10px' : '11px',
                fontWeight: '700',
                letterSpacing: '0.02em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.95)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              JOURNEYS
            </button>
            <button
              onClick={handleFooterToggle}
              style={{
                padding: isMobile ? '8px 12px' : '12px 24px',
                minHeight: isMobile ? '36px' : '44px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                border: '1px solid rgba(251, 191, 36, 0.5)',
                borderRadius: '4px',
                fontSize: isMobile ? '10px' : '11px',
                fontWeight: '700',
                letterSpacing: '0.02em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.95)';
                e.currentTarget.style.color = 'black';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              CONTACT
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default HomePage;
