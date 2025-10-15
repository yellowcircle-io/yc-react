import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [expandedSection, setExpandedSection] = useState(null);
  const [footerOpen, setFooterOpen] = useState(false);
  const [navCircleRotation, setNavCircleRotation] = useState(0); // Start at 0 degrees, animate to -90
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Initialize navigation circle animation on page load
  useEffect(() => {
    // Animate to starting position on mount
    setTimeout(() => {
      setNavCircleRotation(-90);
    }, 500);
  }, []);

  // Optimized mouse movement handler with throttling
  const handleMouseMove = useCallback((e) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 60 - 20,
      y: (e.clientY / window.innerHeight) * 40 - 20
    });
  }, []);

  useEffect(() => {
    let timeoutId;
    const throttledMouseMove = (e) => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleMouseMove(e);
        timeoutId = null;
      }, 16); // ~60fps
    };

    window.addEventListener('mousemove', throttledMouseMove);
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleMouseMove]);

  // Device motion with better error handling
  useEffect(() => {
    const handleDeviceOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        setDeviceMotion({
          x: Math.max(-20, Math.min(20, (e.gamma / 90) * 20)),
          y: Math.max(-20, Math.min(20, (e.beta / 180) * 20))
        });
      }
    };

    // Handle device motion (accelerometer) alongside orientation
    const handleDeviceMotion = (e) => {
      if (e.accelerationIncludingGravity) {
        const acc = e.accelerationIncludingGravity;
        if (acc.x !== null && acc.y !== null) {
          // Convert acceleration to motion range, with gravity compensation
          // Using smaller multiplier for smoother motion and filtering out gravity
          setAccelerometerData({
            x: Math.max(-20, Math.min(20, (acc.x / 2) * -1)), // Invert X for natural motion
            y: Math.max(-20, Math.min(20, (acc.y / 2) * -1))  // Invert Y for natural motion
          });
        }
      }
    };

    if ('DeviceOrientationEvent' in window) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
          })
          .catch(() => {}); // Silent fail for unsupported devices
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    }

    // Add DeviceMotionEvent for accelerometer support
    if ('DeviceMotionEvent' in window) {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', handleDeviceMotion);
            }
          })
          .catch(() => {}); // Silent fail for unsupported devices
      } else {
        window.addEventListener('devicemotion', handleDeviceMotion);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, []);

  // Simplified smooth scrolling system
  const updateScrollOffset = useCallback((delta) => {
    setScrollOffset(prev => {
      const newOffset = Math.max(0, Math.min(200, prev + delta));
      
      // Update navigation circle rotation and state
      if (newOffset >= 200) {
        setNavCircleRotation(0);
      } else {
        const rotationProgress = (newOffset / 200) * 90;
        setNavCircleRotation(-90 + rotationProgress);
      }
      
      return newOffset;
    });
  }, []);

  // Mouse wheel handling with improved sensitivity
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      
      // Improved delta normalization for better cross-device consistency
      let delta = 0;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Horizontal scrolling (trackpad side-scroll, shift+wheel)
        delta = e.deltaX * 0.05;
      } else {
        // Vertical scrolling (most common) - increased sensitivity
        delta = e.deltaY * 0.05;
      }
      
      updateScrollOffset(delta);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [updateScrollOffset]);

  // Keyboard handling with consistent sensitivity
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateScrollOffset]);

  // Simplified touch handling - only handle scrolling on background areas
  useEffect(() => {
    const handleTouchStart = (e) => {
      // Only handle touch on the background images or main content areas
      const target = e.target;
      const isBackground = target.style.backgroundImage || 
                          target.closest('[style*="background-image"]') ||
                          target.tagName === 'BODY' ||
                          target.classList.contains('scrollable-area');
      
      // Skip touch handling if it's on any interactive element
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
      
      // Skip touch handling if not on background
      if (!isBackground || 
          target.closest('.clickable-element') || 
          target.closest('button') || 
          target.closest('a') ||
          target.closest('nav') ||
          target.closest('[role="button"]') ||
          target.closest('.sidebar')) {
        return;
      }
      
      if (e.touches.length === 1 && touchStartRef.current.x !== 0) {
        const touch = e.touches[0];
        const deltaX = touchStartRef.current.x - touch.clientX;
        const deltaY = touchStartRef.current.y - touch.clientY;
        const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Only scroll for significant movement
        if (totalDistance > 30) {
          let scrollDelta = 0;
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            scrollDelta = deltaX * 0.15;
          } else {
            scrollDelta = deltaY * 0.12;
          }
          
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

  // Combine orientation and accelerometer data intelligently for enhanced mobile parallax
  const combinedDeviceMotion = {
    x: deviceMotion.x + (accelerometerData.x * 0.3), // Blend 70% orientation + 30% accelerometer
    y: deviceMotion.y + (accelerometerData.y * 0.3)
  };
  
  const parallaxX = (mousePosition.x + combinedDeviceMotion.x) * 0.6;
  const parallaxY = (mousePosition.y + combinedDeviceMotion.y) * 0.6;

  const handleHomeClick = (e) => {
    e.preventDefault();
    setScrollOffset(0);
    setNavCircleRotation(-90);
    setMenuOpen(false);
    setFooterOpen(false);
  };

  // Handle navigation circle click - progress sequentially through pages
  const handleNavCircleClick = () => {
    if (scrollOffset >= 200) {
      // At final page - toggle footer
      setFooterOpen(!footerOpen);
    } else if (scrollOffset >= 100) {
      // On page 2 - go to page 3 (final page)
      setScrollOffset(200);
      setNavCircleRotation(0);
    } else {
      // On page 1 - go to page 2
      setScrollOffset(100);
      const rotationProgress = (100 / 200) * 90;
      setNavCircleRotation(-90 + rotationProgress);
    }
  };

  // Handle footer toggle
  const handleFooterToggle = () => {
    setFooterOpen(!footerOpen);
    setMenuOpen(false); // Close menu overlay when footer opens
  };

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    if (sidebarOpen) {
      // Closing sidebar - reset all accordion states
      setExpandedSection(null);
    }
    setSidebarOpen(!sidebarOpen);
  };

  const navigationItems = [
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
      label: "EXPERIMENTS",
      itemKey: "experiments",
      subItems: ["golden unknown", "being + rhyme", "cath3dral", "17-frame animatic"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684385/write-book_gfaiu8.png",
      label: "THOUGHTS",
      itemKey: "thoughts",
      subItems: ["blog"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/face-profile_dxxbba.png",
      label: "ABOUT",
      itemKey: "about",
      subItems: ["about me", "about yellowcircle", "contact"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/history-edu_nuazpv.png",
      label: "WORKS",
      itemKey: "works",
      subItems: ["consulting", "rho", "reddit", "cv"]
    }
  ];

  // Navigation Item Component - Fixed positioning with accordion functionality
  const NavigationItem = ({ icon, label, subItems, itemKey, index }) => {
    const isExpanded = expandedSection === itemKey && sidebarOpen;
    
    // Calculate vertical position accounting for expanded items above
    let topPosition = index * 50; // Base spacing
    for (let i = 0; i < index; i++) {
      const prevItemKey = navigationItems[i]?.itemKey;
      if (expandedSection === prevItemKey && sidebarOpen) {
        const prevSubItems = navigationItems[i]?.subItems || [];
        topPosition += prevSubItems.length * 18 + 5; // Tighter spacing to match new layout
      }
    }
    
    const handleClick = () => {
      if (!sidebarOpen) {
        // First click: open sidebar and expand this section
        setSidebarOpen(true);
        setExpandedSection(itemKey);
      } else {
        // Subsequent clicks: toggle accordion or navigate
        if (expandedSection === itemKey) {
          // If already expanded, navigate to the page
          if (itemKey === 'experiments') {
            navigate('/experiments');
          }
          setExpandedSection(null);
        } else {
          setExpandedSection(itemKey);
        }
      }
    };

    return (
      <div style={{
        position: 'absolute',
        top: `${topPosition}px`,
        left: 0,
        width: '100%',
        transition: 'top 0.3s ease-out' // Smooth movement for accordion
      }}>
        {/* Main navigation item container */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 0',
            position: 'relative',
            minHeight: '40px',
            width: '100%'
          }}
        >
          {/* Clickable area - covers full width for better interaction */}
          <div 
            className="clickable-element"
            onClick={handleClick}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleClick();
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: 'pointer',
              zIndex: 3,
              WebkitTapHighlightColor: 'transparent'
            }}
          />

          {/* Icon - Always centered relative to closed sidebar width */}
          <div style={{ 
            position: 'absolute',
            left: '40px', // Center of 80px closed sidebar width
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none'
          }}>
            <img 
              src={icon}
              alt={label}
              width="24" 
              height="24" 
              style={{ display: 'block' }}
            />
          </div>

          {/* Label - appears to the RIGHT of the centered icon when sidebar opens */}
          {sidebarOpen && (
            <span style={{
              position: 'absolute',
              left: '60px', // Moved closer to centered icon area
              top: '50%',
              transform: 'translateY(-50%)',
              color: isExpanded ? '#EECF00' : 'black',
              fontSize: '14px',
              fontWeight: isExpanded ? '700' : '600',
              letterSpacing: '0.2em',
              transition: 'color 0.3s ease-out, font-weight 0.3s ease-out',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}>{label}</span>
          )}
        </div>
        
        {/* Sub-items - accordion style */}
        {sidebarOpen && (
          <div style={{
            marginLeft: '75px', // Moved 15px closer to category title (was 60px, now closer to icon)
            marginTop: '-5px', // Pull up closer to category title by 5px
            maxHeight: isExpanded ? `${(subItems?.length || 0) * 18 + 5}px` : '0px', // Tighter spacing
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-out'
          }}>
            {subItems && (
              <div style={{ paddingTop: '0px', paddingBottom: '0px' }}> {/* No padding for tighter spacing */}
                {subItems.map((item, idx) => (
                  <a key={idx}
                     href="#"
                     className="clickable-element"
                     onClick={(e) => {
                       e.preventDefault();
                       if (item === '17-frame animatic') {
                         navigate('/home-17');
                       }
                     }}
                     style={{
                       display: 'block',
                       color: 'rgba(0,0,0,0.7)',
                       fontSize: '12px',
                       fontWeight: '500',
                       letterSpacing: '0.1em',
                       textDecoration: 'none',
                       padding: '1px 0', // Very tight padding
                       transition: 'color 0.25s ease-in-out',
                       opacity: isExpanded ? 1 : 0,
                       transitionDelay: isExpanded ? `${idx * 0.05}s` : '0s'
                     }}
                     onMouseEnter={(e) => {
                       e.target.style.color = '#EECF00';
                     }}
                     onMouseLeave={(e) => {
                       e.target.style.color = 'rgba(0,0,0,0.7)';
                     }}
                  >{item}</a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* FOUNDATION BACKGROUND LAYER - WHITE BASE */}
      <div
        className="foundation-background-layer"
        data-layer="foundation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#FFFFFF',
          zIndex: -1000,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.96; }
        }
        @keyframes slideInStagger {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes buttonFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpFadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .menu-item-1 { animation: slideInStagger 0.4s ease-out 0.1s both; }
        .menu-item-2 { animation: slideInStagger 0.4s ease-out 0.2s both; }
        .menu-item-3 { animation: slideInStagger 0.4s ease-out 0.3s both; }
        .menu-item-4 { animation: slideInStagger 0.4s ease-out 0.4s both; }
        .menu-button-5 { animation: buttonFadeIn 0.4s ease-out 0.6s both; }
        .menu-button-6 { animation: buttonFadeIn 0.4s ease-out 0.7s both; }

        .menu-link {
          color: black;
          transition: color 0.3s ease-in;
        }
        .menu-link:hover {
          color: white !important;
        }

        .works-btn {
          transition: background-color 0.3s ease-in;
        }
        .works-btn:hover {
          background-color: rgba(0,0,0,1) !important;
        }
        .works-btn:hover .works-text {
          color: #EECF00 !important;
          transition: color 0.3s ease-in;
        }

        .contact-btn {
          transition: background-color 0.3s ease-in;
        }
        .contact-btn:hover {
          background-color: white !important;
        }

      `}</style>

      {/* Background System */}
      <div className="scrollable-area" style={{
        position: 'fixed',
        top: 0,
        left: scrollOffset <= 100 ? `-${scrollOffset}vw` : '-100vw',
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url(https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/background_f7cdue.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 10,
        transition: 'left 0.1s ease-out',
        willChange: 'left'
      }}></div>

      <div className="scrollable-area" style={{
        position: 'fixed',
        top: 0,
        left: scrollOffset <= 100 ? `${100 - scrollOffset}vw` : '0vw',
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url(https://res.cloudinary.com/yellowcircle-io/image/upload/v1756513503/Group_34_tfqn6y.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 11,
        transition: 'left 0.1s ease-out',
        willChange: 'left'
      }}></div>

      <div className="scrollable-area" style={{
        position: 'fixed',
        top: 0,
        left: scrollOffset > 100 ? `${200 - scrollOffset}vw` : '100vw',
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url(https://res.cloudinary.com/yellowcircle-io/image/upload/v1756512745/bg-3_xbayq3.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 12,
        transition: 'left 0.1s ease-out',
        willChange: 'left'
      }}></div>

      {/* Scroll Progress Indicator */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '120px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '15px',
        fontSize: '12px',
        zIndex: 999
      }}>
        Scroll: {Math.round(scrollOffset)}% - Page {scrollOffset < 100 ? '1-2' : '3'}
      </div>

      {/* Yellow Circle with Parallax */}
      <div style={{ 
        position: 'fixed', 
        top: `calc(20% + ${parallaxY}px)`,
        left: `calc(38% + ${parallaxX}px)`,
        width: '300px', 
        height: '300px', 
        backgroundColor: '#fbbf24', 
        borderRadius: '50%', 
        zIndex: 20,
        mixBlendMode: 'multiply',
        transition: 'all 0.1s ease-out',
        boxShadow: '0 20px 60px rgba(251,191,36,0.2)'
      }}></div>

      {/* Navigation Bar */}
      <nav style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '4.7vw',
        paddingRight: '40px',
        transform: 'translateY(0)', // Keep nav fixed - don't move with footer
        transition: 'none' // No transition to prevent movement
      }}>
        <a 
          href="#" 
          onClick={handleHomeClick}
          style={{
            backgroundColor: 'black',
            padding: '10px 20px',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          <h1 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            letterSpacing: '0.2em',
            margin: 0
          }}>
            <span style={{ color: '#fbbf24', fontStyle: 'italic' }}>yellow</span>
            <span style={{ color: 'white' }}>CIRCLE</span>
          </h1>
        </a>
      </nav>

      {/* ===========================================
          SIDEBAR MODULE - Consistent Alignment System
          =========================================== */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: sidebarOpen ? 'min(30vw, 450px)' : '80px',
        height: '100vh',
        backgroundColor: 'rgba(242, 242, 242, 0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 50,
        transition: 'width 0.5s ease-out',
      }}>
        
        {/* Sidebar Toggle Button - Fixed pixel position, never moves */}
        <div 
          className="clickable-element"
          onClick={handleSidebarToggle}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleSidebarToggle();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            left: '40px',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            width: '40px',
            height: '40px',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 16 16">
            <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2z"/>
            <path d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
          </svg>
        </div>
        
        {/* HOME Label - Fixed pixel position, never moves */}
        <div style={{ 
          position: 'absolute',
          top: '100px',
          left: '40px',
          transform: 'translateX(-50%) rotate(-90deg)',
          transformOrigin: 'center',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ 
            color: 'black', 
            fontWeight: '600', 
            letterSpacing: '0.3em', 
            fontSize: '14px'
          }}>HOME</span>
        </div>

        {/* Navigation Items Container - Centered vertically in viewport */}
        <div 
          className="navigation-items-container"
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            width: '100%',
            height: '240px' // Space for navigation items
          }}
        >
          {/* Each navigation item */}
          {navigationItems.map((item, index) => (
            <NavigationItem 
              key={item.itemKey} 
              {...item} 
              index={index}
              sidebarOpen={sidebarOpen}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
              setSidebarOpen={setSidebarOpen}
            />
          ))}
        </div>

        {/* YC Logo - Responsive positioning for mobile */}
        <div style={{ 
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(40px, 8vw)', 
          height: 'min(40px, 8vw)',
          minWidth: '30px',
          minHeight: '30px',
          borderRadius: '50%',
          overflow: 'hidden'
        }}>
          <img 
            src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png" 
            alt="YC Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Navigation Circle with Dynamic Rotation */}
      <div 
        className="clickable-element"
        onClick={handleNavCircleClick}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleNavCircleClick();
        }}
        style={{ 
          position: 'fixed', 
          bottom: '50px', 
          right: '50px',
          zIndex: 50,
          width: '78px',
          height: '78px',
          cursor: 'pointer',
          transform: footerOpen ? 'translateY(-300px)' : 'translateY(0)',
          transition: 'transform 0.5s ease-out',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <img 
          src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494537/NavCircle_ioqlsr.png"
          alt="Navigation"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `rotate(${navCircleRotation}deg)`,
            transition: 'transform 0.3s ease-out',
            transformOrigin: 'center'
          }}
        />
      </div>


      {/* Partially Hidden Footer (State 0) */}
      <div style={{
        position: 'fixed',
        bottom: footerOpen ? '0' : '-290px',
        left: '0',
        right: '0',
        height: '300px',
        zIndex: 60,
        transition: 'bottom 0.5s ease-out'
      }}>
        {/* YOUR CIRCLE FOR Copy - Fixed position in viewport */}
        <div style={{
          position: 'fixed',
          bottom: '40px',
          left: 'max(120px, 8vw)',
          maxWidth: 'min(640px, 50vw)',
          zIndex: 61,
          pointerEvents: 'none',
          transform: footerOpen ? 'translateY(-300px)' : 'translateY(0)',
          transition: 'transform 0.5s ease-out'
        }}>
          <div style={{
            color: 'black',
            fontWeight: '600',
            fontSize: 'clamp(0.855rem, 1.98vw, 1.62rem)',
            lineHeight: '1.3',
            letterSpacing: '0.05em',
            textAlign: 'left'
          }}>
            {/* Header with yellow "YOUR CIRCLE" */}
            <h1 style={{
              margin: '4px 0',
              backgroundColor: 'rgba(241, 239, 232, 0.38)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'inline-block',
              fontSize: 'clamp(1.17rem, 2.52vw, 1.98rem)',
              fontWeight: '700',
              padding: '2px 6px'
            }}>
              <span style={{ color: '#EECF00' }}>YOUR CIRCLE</span> FOR:
            </h1>

            {/* Bullet points - 4 bullets per page, 3 pages total */}
            <div style={{ position: 'relative', minHeight: '120px' }}>
              {(scrollOffset < 100 ? [
                '• Guiding Heroes Through Digital Galaxies',
                '• Crafting Human-Centric, Hero Arcs',
                '• Lighting Up Brand Horizons',
                '• Sparking Loyal Fan Alliances',
              ] : scrollOffset < 200 ? [
                '• Rolling Momentum Into Every Campaign',
                '• Mapping Data-Driven Rebel Paths',
                '• Turning Wonder Into Measurable Wins',
                '• Amplifying Voices at Lightspeed',
              ] : [
                '• Keeping Brands In Balance With The Force',
                '• Designing Experiences That Radiate Hope',
                '• Transforming Clicks Into Legacies',
                '• Delivering Results Worth Oodles of Os',
              ]).map((text, index) => (
                <p
                  key={`${scrollOffset < 100 ? 'page1' : scrollOffset < 200 ? 'page2' : 'page3'}-${index}`}
                  style={{
                    margin: '3px 0',
                    backgroundColor: 'rgba(241, 239, 232, 0.38)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    display: 'inline-block',
                    padding: '2px 6px'
                  }}
                >{text}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Full Footer Content */}
        <div
          onClick={handleFooterToggle}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            cursor: footerOpen ? 'default' : 'pointer'
          }}
        >
          {/* Contact Section */}
          <div style={{
            flex: '1',
            backgroundColor: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              margin: '0 0 20px 0',
              borderBottom: '2px solid white',
              paddingBottom: '10px'
            }}>CONTACT</h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >EMAIL@YELLOWCIRCLE.IO</a>
              
              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >LINKEDIN</a>
              
              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >TWITTER</a>
            </div>
          </div>

          {/* Projects Section */}
          <div style={{
            flex: '1',
            backgroundColor: '#EECF00',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <h2 style={{
              color: 'black',
              fontSize: '24px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              margin: '0 0 20px 0',
              borderBottom: '2px solid black',
              paddingBottom: '10px'
            }}>PROJECTS</h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >GOLDEN UNKNOWN</a>
              
              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >BEING + RHYME</a>
              
              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >CATH3DRAL</a>
              
              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >RHO CONSULTING</a>
            </div>
          </div>
        </div>
      </div>

      {/* Hamburger Menu */}
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ 
          position: 'fixed',
          right: '50px',
          top: '20px',
          padding: '10px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          zIndex: 100
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '18px',
          position: 'relative'
        }}>
          {[0, 1, 2].map((index) => (
            <div key={index} style={{ 
              position: 'absolute',
              top: '50%',
              left: index === 1 ? '60%' : '50%',
              width: '40px', 
              height: '3px', 
              backgroundColor: 'black',
              transformOrigin: 'center',
              transform: menuOpen 
                ? index === 0 
                  ? 'translate(-50%, -50%) rotate(45deg)'
                  : index === 2 
                    ? 'translate(-50%, -50%) rotate(-45deg)'
                    : 'translate(-50%, -50%)'
                : `translate(-50%, -50%) translateY(${(index - 1) * 6}px)`,
              opacity: menuOpen && index === 1 ? 0 : 1,
              transition: 'all 0.3s ease'
            }}></div>
          ))}
        </div>
      </button>

      {/* Menu Overlay */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#EECF00',
          opacity: 0.96,
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            {['HOME', 'EXPERIMENTS', 'THOUGHTS', 'ABOUT'].map((item, index) => (
              <a key={item} 
                href="#" 
                onClick={item === 'HOME' ? handleHomeClick : item === 'EXPERIMENTS' ? () => navigate('/experiments') : undefined}
                className={`menu-item-${index + 1} menu-link`} 
                style={{
                  textDecoration: 'none',
                  fontSize: '20px',
                  fontWeight: '600',
                  letterSpacing: '0.3em',
                  padding: '10px 20px',
                  borderRadius: '4px'
                }}
              >
                {item}
              </a>
            ))}
            
            <div className="menu-button-5 works-btn" style={{
              backgroundColor: 'rgba(0,0,0,0.1)',
              padding: '15px 40px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              <span className="works-text" style={{
                color: 'black',
                fontSize: '20px',
                fontWeight: '600',
                letterSpacing: '0.3em',
                transition: 'color 0.3s ease-in'
              }}>WORKS</span>
            </div>
            
            <div className="menu-button-6 contact-btn" 
              onClick={handleFooterToggle}
              style={{
                border: '2px solid black',
                padding: '15px 40px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <span style={{
                color: 'black',
                fontSize: '20px',
                fontWeight: '600',
                letterSpacing: '0.3em'
              }}>CONTACT</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return <HomePage />;
}