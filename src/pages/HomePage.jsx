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
  const [expandedSubSection, setExpandedSubSection] = useState(null); // For third-level accordion
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
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/history-edu_nuazpv.png",
      label: "STORIES",
      itemKey: "stories",
      subItems: [
        {
          label: "Projects",
          key: "projects",
          subItems: ["Brand Development", "Marketing Architecture", "Email Development"]
        },
        { label: "Golden Unknown", key: "golden-unknown" },
        {
          label: "Cath3dral",
          key: "cath3dral",
          subItems: ["Being + Rhyme"]
        },
        { label: "Thoughts", key: "thoughts" }
      ]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
      label: "LABS",
      itemKey: "labs",
      subItems: [
        { label: "Home-17", key: "home-17" },
        { label: "Visual Noteboard", key: "visual-noteboard" },
        { label: "UK-Memories", key: "uk-memories" },
        { label: "Component Library", key: "component-library" }
      ]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/face-profile_dxxbba.png",
      label: "ABOUT",
      itemKey: "about",
      subItems: []
    }
  ];

  // Calculate total height for expanded sections (recursive)
  const calculateExpandedHeight = (items) => {
    if (!items || items.length === 0) return 0;

    let height = 0;
    items.forEach(item => {
      height += 18; // Each item base height
      if (typeof item === 'object' && item.subItems) {
        height += calculateExpandedHeight(item.subItems);
      }
    });
    return height;
  };

  // Navigation Item Component - Natural flex flow with accordion functionality
  const NavigationItem = ({ icon, label, subItems, itemKey, index }) => {
    const isExpanded = expandedSection === itemKey && sidebarOpen;
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
      if (!sidebarOpen) {
        // First click: open sidebar and expand this section
        setSidebarOpen(true);
        setExpandedSection(itemKey);
      } else {
        // Subsequent clicks: toggle accordion or navigate
        if (expandedSection === itemKey) {
          // If already expanded, navigate to the page
          if (itemKey === 'labs') {
            navigate('/experiments');
          }
          setExpandedSection(null);
          setExpandedSubSection(null); // Close all sub-sections
        } else {
          setExpandedSection(itemKey);
          setExpandedSubSection(null); // Reset sub-section when changing sections
        }
      }
    };

    return (
      <div style={{
        position: 'relative',
        width: '100%',
        flexShrink: 0
      }}>
        {/* Main navigation item container */}
        <div
          className="clickable-element"
          onClick={handleClick}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleClick();
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 8px 8px 0',
            position: 'relative',
            minHeight: '44px',
            width: '100%',
            borderRadius: '6px',
            backgroundColor: isHovered && sidebarOpen ? 'rgba(238, 207, 0, 0.12)' : 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease-out',
            WebkitTapHighlightColor: 'transparent'
          }}
        >

          {/* Icon - Always centered relative to closed sidebar width */}
          <div style={{
            position: 'absolute',
            left: '40px', // Center of 80px closed sidebar width
            top: '50%',
            transform: isExpanded
              ? 'translate(-50%, -50%) scale(1.05)'
              : isHovered
                ? 'translate(-50%, -50%) scale(1.08)'
                : 'translate(-50%, -50%) scale(1)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <img
              src={icon}
              alt={label}
              width="24"
              height="24"
              style={{
                display: 'block',
                transition: 'filter 0.3s ease-out, transform 0.2s ease-out',
                filter: isExpanded ? 'brightness(1.2) saturate(1.1)' : 'brightness(1)',
                transform: isHovered ? 'rotate(-3deg)' : 'rotate(0deg)'
              }}
            />
          </div>

          {/* Label - appears to the RIGHT of the centered icon when sidebar opens */}
          <span style={{
            position: 'absolute',
            left: '60px',
            top: '50%',
            color: isExpanded ? '#EECF00' : 'black',
            fontSize: '14px',
            fontWeight: isExpanded ? '700' : '600',
            letterSpacing: '0.2em',
            opacity: sidebarOpen ? 1 : 0,
            transform: sidebarOpen ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-10px)',
            transition: 'color 0.3s ease-out, font-weight 0.3s ease-out, opacity 0.4s ease-out 0.1s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>{label}</span>
        </div>
        
        {/* Sub-items - accordion style with nested support */}
        <div style={{
          marginLeft: '75px',
          marginTop: '-5px',
          maxHeight: sidebarOpen && isExpanded ? '600px' : '0px',
          overflow: 'hidden',
          opacity: sidebarOpen && isExpanded ? 1 : 0,
          transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out 0.1s'
        }}>
            {subItems && (
              <div style={{ paddingTop: '0px', paddingBottom: '0px' }}>
                {subItems.map((item, idx) => {
                  // Handle both string items and object items with nested subItems
                  const itemLabel = typeof item === 'string' ? item : item.label;
                  const itemKey = typeof item === 'string' ? item : item.key;
                  const hasNestedItems = typeof item === 'object' && item.subItems;

                  const isSubExpanded = expandedSubSection === itemKey;

                  return (
                    <div key={idx} style={{ marginBottom: '4px' }}>
                      <div
                        className="clickable-element"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          if (hasNestedItems) {
                            // Toggle third-level accordion
                            setExpandedSubSection(isSubExpanded ? null : itemKey);
                          } else {
                            // Navigate for non-nested items
                            if (itemKey === 'home-17') {
                              navigate('/home-17');
                            } else if (itemKey === 'uk-memories') {
                              navigate('/uk-memories');
                            } else if (itemKey === 'component-library') {
                              navigate('/experiments/component-library');
                            } else if (itemKey === 'golden-unknown') {
                              navigate('/experiments/golden-unknown');
                            } else if (itemKey === 'thoughts') {
                              navigate('/thoughts');
                            }
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: hasNestedItems && isSubExpanded ? '#EECF00' : 'rgba(0,0,0,0.7)',
                          fontSize: '12px',
                          fontWeight: '500',
                          letterSpacing: '0.05em',
                          textDecoration: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          opacity: isExpanded ? 1 : 0,
                          transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                          transitionDelay: isExpanded ? `${idx * 0.06}s` : '0s',
                          backgroundColor: 'transparent',
                          whiteSpace: 'nowrap',
                          overflow: 'visible'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#EECF00';
                          e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.1)';
                          e.currentTarget.style.transform = 'translateX(2px)';
                          e.currentTarget.style.paddingLeft = '12px';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = hasNestedItems && isSubExpanded ? '#EECF00' : 'rgba(0,0,0,0.7)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.paddingLeft = '10px';
                        }}
                      >
                        <span>{itemLabel}</span>
                        {hasNestedItems && (
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '400',
                            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            transform: isSubExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            display: 'inline-block'
                          }}>▼</span>
                        )}
                      </div>

                      {/* Render nested sub-items with accordion */}
                      {hasNestedItems && (
                        <div style={{
                          marginLeft: '15px',
                          marginTop: '4px',
                          maxHeight: isSubExpanded ? '300px' : '0px',
                          overflow: 'hidden',
                          opacity: isSubExpanded ? 1 : 0,
                          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out 0.1s'
                        }}>
                          {item.subItems.map((nestedItem, nestedIdx) => (
                            <div
                              key={nestedIdx}
                              className="clickable-element"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Add nested navigation logic here as needed
                              }}
                              style={{
                                display: 'block',
                                color: 'rgba(0,0,0,0.6)',
                                fontSize: '11px',
                                fontWeight: '400',
                                letterSpacing: '0.03em',
                                textDecoration: 'none',
                                padding: '5px 10px',
                                marginBottom: '2px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                opacity: isSubExpanded ? 1 : 0,
                                transform: isSubExpanded ? 'translateX(0)' : 'translateX(-6px)',
                                transitionDelay: isSubExpanded ? `${nestedIdx * 0.05}s` : '0s',
                                backgroundColor: 'transparent',
                                whiteSpace: 'nowrap',
                                overflow: 'visible'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#EECF00';
                                e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.08)';
                                e.currentTarget.style.transform = 'translateX(2px)';
                                e.currentTarget.style.paddingLeft = '12px';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'rgba(0,0,0,0.6)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.paddingLeft = '10px';
                              }}
                            >{nestedItem}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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
        /* Global viewport constraints */
        body, html {
          max-height: 100vh !important;
          overflow: hidden !important;
        }

        /* YC Logo visibility boost */
        .yc-logo {
          z-index: 100 !important;
        }

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

        /* Responsive sidebar fixes */
        @media (max-width: 768px) {
          .sidebar-label, .navigation-items-container span {
            font-size: 12px !important;
            letter-spacing: 0.15em !important;
            max-width: calc(100% - 70px) !important;
            white-space: normal !important;
            word-break: break-word !important;
            line-height: 1.2 !important;
          }
        }
        @media (max-width: 480px) {
          .sidebar-label, .navigation-items-container span {
            font-size: 10px !important;
            letter-spacing: 0.1em !important;
          }
        }

        /* Footer equal columns - ensure 50/50 split */
        .footer-content {
          display: flex !important;
        }
        .footer-section {
          flex: 1 1 50% !important;
          min-width: 0 !important;
          max-width: 50% !important;
        }

        /* Footer responsive fixes - keep 50/50 layout on all viewports */
        @media (max-width: 768px) {
          /* Reduce padding in footer sections but keep side-by-side */
          [style*="padding: 40px"][style*="backgroundColor: rgba(0,0,0,0.9)"],
          [style*="padding: 40px"][style*="backgroundColor: #EECF00"] {
            padding: 20px 12px !important;
          }

          /* Reduce footer heading sizes */
          [style*="fontSize: 24px"][style*="letterSpacing: 0.3em"] {
            font-size: 16px !important;
            margin-bottom: 10px !important;
          }

          /* Reduce footer link sizes */
          [style*="fontSize: 14px"][style*="letterSpacing: 0.1em"] {
            font-size: 11px !important;
          }

          /* Reduce gap between links */
          [style*="gap: 15px"] {
            gap: 10px !important;
          }
        }

        @media (max-width: 480px) {
          /* More compact padding on small mobile */
          [style*="padding: 40px"][style*="backgroundColor: rgba(0,0,0,0.9)"],
          [style*="padding: 40px"][style*="backgroundColor: #EECF00"] {
            padding: 16px 8px !important;
          }

          /* Smaller headings on small screens */
          [style*="fontSize: 24px"][style*="letterSpacing: 0.3em"] {
            font-size: 14px !important;
            margin-bottom: 8px !important;
          }

          /* Smaller links */
          [style*="fontSize: 14px"][style*="letterSpacing: 0.1em"] {
            font-size: 10px !important;
          }

          /* Tighter gap on small screens */
          [style*="gap: 15px"] {
            gap: 8px !important;
          }
        }

        @media (max-width: 360px) {
          /* Ultra-compact for very small viewports (360px) */
          [style*="padding: 40px"][style*="backgroundColor: rgba(0,0,0,0.9)"],
          [style*="padding: 40px"][style*="backgroundColor: #EECF00"] {
            padding: 12px 6px !important;
          }

          /* Very small headings */
          [style*="fontSize: 24px"][style*="letterSpacing: 0.3em"] {
            font-size: 11px !important;
            margin-bottom: 6px !important;
            letter-spacing: 0.2em !important;
          }

          /* Tiny links */
          [style*="fontSize: 14px"][style*="letterSpacing: 0.1em"] {
            font-size: 9px !important;
            letter-spacing: 0.05em !important;
          }

          /* Minimal gap */
          [style*="gap: 15px"] {
            gap: 6px !important;
          }

          /* Reduce border padding */
          [style*="borderBottom: 2px solid"] {
            padding-bottom: 6px !important;
          }
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
        zIndex: 1,
        transition: 'left 0.1s ease-out',
        willChange: 'left',
        filter: 'grayscale(100%) contrast(1.3)',
        WebkitFilter: 'grayscale(100%) contrast(1.3)'
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
        zIndex: 2,
        transition: 'left 0.1s ease-out',
        willChange: 'left',
        filter: 'grayscale(100%) contrast(1.3)',
        WebkitFilter: 'grayscale(100%) contrast(1.3)'
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
        zIndex: 3,
        transition: 'left 0.1s ease-out',
        willChange: 'left',
        filter: 'grayscale(100%) contrast(1.3)',
        WebkitFilter: 'grayscale(100%) contrast(1.3)'
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
        zIndex: 30
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
          SIDEBAR MODULE - Flexbox Three-Section Layout
          =========================================== */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: sidebarOpen ? 'min(max(280px, 35vw), 472px)' : '80px',
        height: '100vh',
        backgroundColor: 'rgba(242, 242, 242, 0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 50,
        transition: 'width 0.5s ease-out',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* HEADER SECTION - Toggle + HOME Label */}
        <div style={{
          flexShrink: 0,
          height: '140px',
          position: 'relative'
        }}>
          {/* Sidebar Toggle Button */}
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
              borderRadius: '6px',
              backgroundColor: 'transparent',
              WebkitTapHighlightColor: 'transparent',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.12)';
              e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="black"
              viewBox="0 0 16 16"
              style={{
                transition: 'transform 0.3s ease-out',
                transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(0deg)'
              }}
            >
              <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2z"/>
              <path
                d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"
                style={{
                  transition: 'opacity 0.3s ease-out',
                  opacity: sidebarOpen ? 0.5 : 1
                }}
              />
            </svg>
          </div>

          {/* HOME Label - Breadcrumb indicator */}
          <div
            className="clickable-element"
            onClick={handleHomeClick}
            style={{
              position: 'absolute',
              top: '100px',
              left: '40px',
              transform: 'translateX(-50%) rotate(-90deg)',
              transformOrigin: 'center',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{
              color: scrollOffset === 0 ? '#EECF00' : 'black',
              fontWeight: scrollOffset === 0 ? '700' : '600',
              letterSpacing: '0.3em',
              fontSize: '14px',
              transition: 'color 0.2s ease-out, font-weight 0.2s ease-out'
            }}>HOME</span>
          </div>
        </div>

        {/* NAVIGATION SECTION - Scrollable flex container */}
        <nav
          className="navigation-items-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', // Center items vertically
            gap: '8px',
            padding: '20px 0',
            minHeight: 0 // Critical for flex scroll behavior
          }}
        >
          {navigationItems.map((item, index) => (
            <NavigationItem
              key={item.itemKey}
              {...item}
              index={index}
            />
          ))}
        </nav>

        {/* FOOTER SECTION - YC Logo */}
        <div style={{
          flexShrink: 0,
          height: '85px',
          position: 'relative'
        }}>
          <div
            className="yc-logo clickable-element"
            style={{
              position: 'absolute',
              left: '40px',
              bottom: '20px',
              transform: 'translateX(-50%)',
              width: '45px',
              height: '45px',
              minWidth: '40px',
              minHeight: '40px',
              borderRadius: '50%',
              overflow: 'visible',
              cursor: 'pointer',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1.15) rotate(5deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1) rotate(0deg)'}
          >
            <img
              src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png"
              alt="YC Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          </div>
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
        {/* YOUR CIRCLE FOR Copy - Adjusts for sidebar */}
        <div style={{
          position: 'fixed',
          bottom: '40px',
          left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(100px, 8vw)',
          maxWidth: sidebarOpen ? 'min(540px, 40vw)' : 'min(780px, 61vw)',
          zIndex: 61,
          pointerEvents: 'none',
          transform: footerOpen ? 'translateY(-300px)' : 'translateY(0)',
          transition: 'left 0.5s ease-out, max-width 0.5s ease-out, transform 0.5s ease-out'
        }}>
          <div style={{
            color: 'black',
            fontWeight: '600',
            fontSize: 'clamp(0.855rem, 1.98vw, 1.62rem)',
            lineHeight: '1.3',
            letterSpacing: '0.05em',
            textAlign: 'left'
          }}>
            {/* Header with new "Your Story" typography */}
            <h1 style={{
              margin: '-1rem 0px',
              backdropFilter: 'blur(1px)',
              WebkitBackdropFilter: 'blur(1px)',
              display: 'inline-block',
              fontSize: 'clamp(1.17rem, 18vw, 15rem)',
              fontWeight: '900',
              padding: '-40px 0px',
              lineHeight: '0.82',
              fontFamily: 'Helvetica, Arial, sans-serif',
              letterSpacing: '-5px',
              color: 'rgba(238, 207, 2, 0.7)'
            }}>
              YOUR STORY
            </h1>

            {/* Paragraphs - one per page, 3 pages total */}
            <div style={{ position: 'relative', minHeight: '120px' }}>
              <p
                key={`page-${scrollOffset < 100 ? '1' : scrollOffset < 200 ? '2' : '3'}`}
                style={{
                  margin: '3px 0',
                  backgroundColor: 'rgba(241, 239, 232, 0.38)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  display: 'inline-block',
                  padding: '2px 6px',
                  fontSize: 'clamp(1.17rem, 6.2vw, 3rem)',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontWeight: '400',
                  letterSpacing: '-2px'
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
        </div>

        {/* Full Footer Content */}
        <div
          onClick={handleFooterToggle}
          className="footer-content"
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
          <div className="footer-section footer-contact" style={{
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
          <div className="footer-section footer-projects" style={{
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

              <a href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/uk-memories');
                }}
                style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >TRAVEL MEMORIES</a>
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
          zIndex: 100,
          pointerEvents: 'auto'
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
            {['HOME', 'STORIES', 'LABS', '>UK MEMORIES', 'WORKS', 'CONTACT'].map((item, index) => {
              const isIndented = item.startsWith('>');
              const displayText = isIndented ? item.substring(1) : item;
              const isButton = item === 'WORKS' || item === 'CONTACT';

              if (isButton) {
                return (
                  <div
                    key={item}
                    className={item === 'WORKS' ? 'menu-button-5 works-btn' : 'menu-button-6 contact-btn'}
                    onClick={item === 'CONTACT' ? handleFooterToggle : undefined}
                    style={{
                      backgroundColor: item === 'WORKS' ? 'rgba(0,0,0,0.1)' : 'transparent',
                      border: item === 'CONTACT' ? '2px solid black' : 'none',
                      padding: '15px 40px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{
                      color: 'black',
                      fontSize: '20px',
                      fontWeight: '600',
                      letterSpacing: '0.3em',
                      transition: 'color 0.3s ease-in'
                    }}>{displayText}</span>
                  </div>
                );
              }

              return (
                <a key={item}
                  href="#"
                  onClick={
                    item === 'HOME' ? handleHomeClick :
                    item === 'STORIES' ? undefined :
                    item === 'LABS' ? () => navigate('/experiments') :
                    item === '>UK MEMORIES' ? () => navigate('/uk-memories') :
                    undefined
                  }
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (item === 'HOME') handleHomeClick(e);
                    else if (item === 'LABS') navigate('/experiments');
                    else if (item === '>UK MEMORIES') navigate('/uk-memories');
                  }}
                  className={`menu-item-${index + 1} menu-link`}
                  style={{
                    textDecoration: 'none',
                    fontSize: '20px',
                    fontWeight: '600',
                    letterSpacing: '0.3em',
                    padding: '10px 20px',
                    paddingLeft: isIndented ? '40px' : '20px',
                    borderRadius: '4px',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'white'}
                  onMouseLeave={(e) => e.target.style.color = 'black'}
                >
                  {displayText}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return <HomePage />;
}