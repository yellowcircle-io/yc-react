import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LazyLottieIcon from '../shared/LazyLottieIcon';
import { useLayout } from '../../contexts/LayoutContext';
import UserMenu from '../auth/UserMenu';

/**
 * Sidebar - Three-section collapsible sidebar with slide-over navigation
 *
 * Features:
 * - Slide-over panel for sub-items (not accordion)
 * - Lottie animation icons (pass lottieData prop) or static images (pass icon URL)
 * - Font sizes reduced by 15%
 * - Firefox compatibility
 *
 * Variants:
 * - "standard": 80px when closed (default)
 * - "hidden": 0px when closed (UnityNotes variant)
 */
function Sidebar({ onHomeClick, onFooterToggle, navigationItems = [], scrollOffset = 0, pageLabel = "HOME", variant = "standard" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sidebarOpen,
    setSidebarOpen,
    expandedSection: _expandedSection,
    setExpandedSection: _setExpandedSection
  } = useLayout();

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Slide-over state
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverItems, setSlideOverItems] = useState([]);
  const [slideOverTitle, setSlideOverTitle] = useState('');

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleHomeClick = (e) => {
    if (onHomeClick) onHomeClick(e);
  };

  // Open slide-over panel with sub-items
  const handleOpenSlideOver = (title, items) => {
    setSlideOverTitle(title);
    setSlideOverItems(items);
    setSlideOverOpen(true);
  };

  // Close slide-over panel (back to main nav)
  const handleCloseSlideOver = () => {
    setSlideOverOpen(false);
    setSlideOverItems([]);
    setSlideOverTitle('');
  };

  // Close slide-over on navigation
  useEffect(() => {
    handleCloseSlideOver();
  }, [location.pathname]);

  // Close slide-over when sidebar closes
  useEffect(() => {
    if (!sidebarOpen) {
      handleCloseSlideOver();
    }
  }, [sidebarOpen]);

  // Inject keyframe animations
  useEffect(() => {
    const styleId = 'sidebar-slide-over-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes slideOverFromLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOverItem {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Section Label Component - renders "START HERE" and "EXPLORE" headers
  const SectionLabel = ({ label }) => {
    return (
      <div style={{
        padding: sidebarOpen ? '8px 36px 4px' : '8px 0 4px',
        width: '100%'
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '0.15em',
          color: 'rgba(0, 0, 0, 0.4)',
          opacity: sidebarOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-out 0.1s',
          textTransform: 'uppercase'
        }}>{label}</span>
      </div>
    );
  };

  // Navigation Item Component - with slide-over trigger
  // Supports both Lottie animations (lottieData) and static images (icon URL)
  const NavigationItem = ({ icon, lottieData, label, subItems, itemKey, index: _index, route }) => {
    const [isHovered, setIsHovered] = useState(false);
    const hoverTimeoutRef = useRef(null);
    const hasSubItems = subItems && subItems.length > 0;

    const handleClick = () => {
      if (!sidebarOpen) {
        // First click: open sidebar
        setSidebarOpen(true);
        if (hasSubItems) {
          // Show slide-over after sidebar opens
          setTimeout(() => {
            handleOpenSlideOver(label, subItems);
          }, 300);
        } else if (route) {
          // Navigate directly for items with route
          setTimeout(() => {
            navigate(route);
          }, 300);
        }
      } else {
        if (hasSubItems) {
          // Open slide-over panel
          handleOpenSlideOver(label, subItems);
        } else if (route) {
          // Navigate directly for items with route
          navigate(route);
        } else {
          // Legacy fallback for items without route
          if (itemKey === 'labs') {
            navigate('/experiments');
          } else if (itemKey === 'about') {
            navigate('/about');
          } else if (itemKey === 'stories') {
            navigate('/thoughts');
          }
        }
      }
    };

    // Hover handlers - debounced for stability
    const handleMouseEnter = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 50);
    };

    // Touch handlers for mobile hover simulation
    const handleTouchStart = (_e) => {
      // Trigger hover state on touch
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setIsHovered(true);
    };

    const handleTouchEnd = () => {
      // Keep hover active briefly after touch ends for visual feedback
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 300);
    };

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          flexShrink: 0
        }}
        // Firefox fix: attach hover to container when sidebar closed
        onMouseEnter={!sidebarOpen ? handleMouseEnter : undefined}
        onMouseLeave={!sidebarOpen ? handleMouseLeave : undefined}
        // Touch events for mobile hover simulation
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          className="clickable-element nav-item-button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          onMouseEnter={sidebarOpen ? handleMouseEnter : undefined}
          onMouseLeave={sidebarOpen ? handleMouseLeave : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: sidebarOpen ? '12px 16px' : '10px 8px 10px 0',
            position: 'relative',
            minHeight: '48px',
            // Firefox fix: ensure button covers icon area when closed
            minWidth: sidebarOpen ? 'auto' : '80px',
            width: sidebarOpen ? 'calc(100% - 40px)' : '100%',
            marginLeft: sidebarOpen ? '20px' : '0',
            marginRight: sidebarOpen ? '20px' : '0',
            borderRadius: '6px',
            backgroundColor: sidebarOpen
              ? (isHovered ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.5)')
              : (isHovered ? 'rgba(251, 191, 36, 0.12)' : 'transparent'),
            cursor: 'pointer',
            transition: 'all 0.2s ease-out',
            WebkitTapHighlightColor: 'transparent',
            border: 'none',
            outline: 'none',
            textAlign: 'left',
            font: 'inherit'
          }}
        >
          {/* Icon - Uses LazyLottieIcon to defer loading lottie-web (~877KB) */}
          {/* Supports: lottieData (local JSON), dotLottieSrc (remote .lottie), or static icon URL */}
          <div style={{
            position: sidebarOpen ? 'relative' : 'absolute',
            left: sidebarOpen ? '0' : '40px',
            top: sidebarOpen ? 'auto' : '50%',
            transform: sidebarOpen ? 'none' : 'translate(-50%, -50%)',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none',
            flexShrink: 0
          }}>
            {lottieData ? (
              <LazyLottieIcon
                animationData={lottieData}
                size={28}
                isHovered={isHovered}
                alt={label}
              />
            ) : icon ? (
              <img
                src={icon}
                alt={label}
                width="28"
                height="28"
                style={{
                  display: 'block',
                  objectFit: 'contain',
                  transition: 'transform 0.2s ease-out, filter 0.3s ease-out',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  filter: isHovered ? 'grayscale(0)' : 'grayscale(1)'
                }}
              />
            ) : (
              /* No icon - render empty placeholder */
              <div style={{ width: 28, height: 28 }} />
            )}
          </div>

          {/* Label */}
          <span style={{
            position: sidebarOpen ? 'relative' : 'absolute',
            left: sidebarOpen ? '0' : '60px',
            top: sidebarOpen ? 'auto' : '50%',
            marginLeft: sidebarOpen ? '12px' : '0',
            color: 'black',
            fontSize: '13px',
            fontWeight: '600',
            letterSpacing: '0.05em',
            opacity: sidebarOpen ? 1 : 0,
            transform: sidebarOpen ? 'none' : 'translateY(-50%) translateX(-10px)',
            transition: 'opacity 0.3s ease-out 0.1s, transform 0.3s ease-out 0.1s',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            flex: sidebarOpen ? 1 : 'none'
          }}>{label}</span>

          {/* Sub-items indicator arrow */}
          {hasSubItems && sidebarOpen && (
            <span style={{
              fontSize: '12px',
              color: 'rgba(0,0,0,0.4)',
              opacity: 1,
              transition: 'opacity 0.2s ease-out'
            }}>→</span>
          )}
        </button>
      </div>
    );
  };

  const closedWidth = variant === "hidden" ? '0px' : '80px';
  const showBackground = variant === "hidden" ? sidebarOpen : true;
  // Always use fixed position for toggle button to prevent scrolling issues
  const togglePosition = 'fixed';
  const toggleLeft = variant === "hidden" ? '20px' : '40px';

  // Helper function for sub-item navigation
  const handleSubItemClick = (item) => {
    // Skip click for subheaders (non-clickable labels)
    if (typeof item === 'object' && item.isSubheader) {
      return;
    }

    const itemKeyVal = typeof item === 'string' ? item : item.key;
    const itemRoute = typeof item === 'object' && item.route ? item.route : null;

    if (itemRoute) {
      navigate(itemRoute);
    } else if (itemKeyVal === 'home-17') {
      navigate('/home-17');
    } else if (itemKeyVal === 'uk-memories') {
      navigate('/uk-memories');
    } else if (itemKeyVal === 'component-library') {
      navigate('/experiments/component-library');
    } else if (itemKeyVal === 'golden-unknown') {
      navigate('/experiments/golden-unknown');
    } else if (itemKeyVal === 'thoughts') {
      navigate('/thoughts');
    } else if (itemKeyVal === 'unity-notes') {
      navigate('/unity-notes');
    } else if (itemKeyVal === 'unity-notes-plus') {
      navigate('/unity-notes-plus');
    } else if (itemKeyVal === 'outreach') {
      navigate('/outreach');
    } else if (itemKeyVal === 'visual-noteboard') {
      navigate('/experiments/visual-noteboard');
    } else if (itemKeyVal === 'works') {
      navigate('/works');
    } else if (itemKeyVal === 'services') {
      navigate('/services');
    }
    handleCloseSlideOver();
  };

  return (
    <>
      {/* Backdrop overlay - closes sidebar on click/touch outside */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          onTouchEnd={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 49, // Below sidebar (50) but above content
            backgroundColor: 'transparent',
            cursor: 'default',
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Toggle Button */}
      <button
        type="button"
        className="clickable-element sidebar-toggle-btn"
        onClick={handleSidebarToggle}
        style={{
          position: togglePosition,
          top: '20px',
          left: toggleLeft,
          transform: variant === "hidden" ? 'none' : 'translateX(-50%)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          width: '40px',
          height: '40px',
          borderRadius: '6px',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
          zIndex: 260,
          pointerEvents: 'auto'
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
      </button>

      {/* YC Logo - Fixed position for "hidden" variant only */}
      {/* Always opens Footer only */}
      {variant === "hidden" && (
        <>
          <div
            className="yc-logo clickable-element"
            style={{
              position: 'fixed',
              left: '20px',
              bottom: '20px',
              width: '45px',
              height: '45px',
              minWidth: '40px',
              minHeight: '40px',
              borderRadius: '50%',
              overflow: 'visible',
              cursor: 'pointer',
              zIndex: 290,  // Above everything - sidebar (50), menu overlay (250), slide-over (270)
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => {
              e.preventDefault();
              if (onFooterToggle) {
                onFooterToggle();
              }
              // Logo only opens Footer - no home navigation
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            }}
          >
            <img
              src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png"
              alt="YC Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          </div>
          {/* User Menu removed from hidden variant - should only be in sidebar */}
        </>
      )}

      {/* Sidebar container */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: sidebarOpen ? 'min(max(280px, 35vw), 472px)' : closedWidth,
        height: '100dvh', // Use dvh for mobile browser toolbar awareness
        backgroundColor: showBackground ? 'rgba(242, 242, 242, 0.44)' : 'transparent',
        backdropFilter: showBackground ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: showBackground ? 'blur(8px)' : 'none',
        zIndex: 50,
        transition: 'width 0.5s ease-out, background-color 0.3s ease-out, backdrop-filter 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transform: 'translateZ(0)',
        willChange: 'width',
        WebkitTransform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        pointerEvents: 'auto'
      }}>

        {/* HEADER SECTION - HOME Label */}
        {/* Hide on mobile when slide-over is open to avoid overlap */}
        {/* Hide breadcrumb when sidebar is open to avoid overlap with navigation items */}
        <div style={{
          flexShrink: 0,
          height: '100px',
          position: 'relative',
          opacity: showBackground && !(isMobile && slideOverOpen) && !sidebarOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          pointerEvents: (isMobile && slideOverOpen) || sidebarOpen ? 'none' : 'auto'
        }}>
          {/* Breadcrumb wrapper - positioned above navigation items (only visible when sidebar closed) */}
          <div style={{
            position: 'absolute',
            top: isMobile ? '120px' : '140px',
            left: 0,
            width: '80px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div
              className="clickable-element"
              onClick={handleHomeClick}
              style={{
                transform: 'rotate(-90deg)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s ease-out, opacity 0.3s ease-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{
                color: scrollOffset === 0 ? 'rgb(251, 191, 36)' : 'black',
                fontWeight: scrollOffset === 0 ? '700' : '600',
                letterSpacing: '0.1em',
                fontSize: isMobile ? '10px' : '11px',
                transition: 'color 0.2s ease-out, font-weight 0.2s ease-out',
                maxWidth: isMobile ? '100px' : '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block'
              }}>{pageLabel}</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION SECTION - Main nav items (hidden when slide-over is open) */}
        <nav
          className="navigation-items-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '8px',
            padding: '20px 0',
            minHeight: 0,
            opacity: showBackground && !slideOverOpen ? 1 : 0,
            transform: slideOverOpen ? 'translateX(-20px)' : 'translateX(0)',
            transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
            pointerEvents: slideOverOpen ? 'none' : 'auto'
          }}
        >
          {navigationItems.map((item, index) => {
            // Render section labels (START HERE, EXPLORE)
            if (item.isSectionLabel) {
              return (
                <SectionLabel
                  key={item.itemKey}
                  label={item.label}
                />
              );
            }
            // Render regular navigation items
            return (
              <NavigationItem
                key={item.itemKey}
                {...item}
                index={index}
              />
            );
          })}
        </nav>

        {/* SLIDE-OVER PANEL - Sub-items (vertically centered) */}
        {slideOverOpen && (
          <div style={{
            position: 'absolute',
            top: '100px',
            left: 0,
            right: 0,
            bottom: variant === "standard" ? '85px' : '0',
            backgroundColor: 'transparent',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            animation: 'slideOverFromLeft 0.3s ease-out',
            padding: '0 20px'
          }}>
            {/* Section title */}
            <h3 style={{
              fontSize: '13px',
              fontWeight: '700',
              color: 'rgb(251, 191, 36)',
              letterSpacing: '0.2em',
              marginBottom: '12px',
              paddingLeft: '8px'
            }}>
              {slideOverTitle}
            </h3>

            {/* Sub-items list - centered group */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {slideOverItems.map((item, idx) => {
                const itemLabel = typeof item === 'string' ? item : item.label;
                const isDivider = typeof item === 'object' && item.isDivider;
                const isSectionHeader = typeof item === 'object' && item.isSectionHeader;
                const isSubheader = typeof item === 'object' && item.isSubheader;

                // Render divider
                if (isDivider) {
                  return (
                    <div
                      key={idx}
                      style={{
                        height: '1px',
                        backgroundColor: 'rgba(0, 0, 0, 0.15)',
                        margin: '8px 0',
                        animation: `slideOverItem 0.25s ease-out ${idx * 0.05}s both`
                      }}
                    />
                  );
                }

                // Render section header
                if (isSectionHeader) {
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSubItemClick(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: isSubheader ? '8px 16px' : '12px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isSubheader ? 'transparent' : 'rgba(251, 191, 36, 0.15)',
                        cursor: isSubheader ? 'default' : 'pointer',
                        fontSize: isSubheader ? '11px' : '13px',
                        fontWeight: '700',
                        color: isSubheader ? 'rgba(0,0,0,0.4)' : 'rgb(251, 191, 36)',
                        letterSpacing: '0.1em',
                        textAlign: 'left',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s ease',
                        animation: `slideOverItem 0.25s ease-out ${idx * 0.05}s both`
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubheader) {
                          e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.3)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubheader) {
                          e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.15)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      }}
                    >
                      <span>{itemLabel}</span>
                      {!isSubheader && <span style={{ opacity: 0.6, fontSize: '12px' }}>→</span>}
                    </button>
                  );
                }

                // Regular item
                return (
                  <button
                    key={idx}
                    onClick={() => handleSubItemClick(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'black',
                      letterSpacing: '0.05em',
                      textAlign: 'left',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s ease',
                      animation: `slideOverItem 0.25s ease-out ${idx * 0.05}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)';
                      e.currentTarget.style.color = 'rgb(251, 191, 36)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                      e.currentTarget.style.color = 'black';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span>{itemLabel}</span>
                    <span style={{ opacity: 0.4, fontSize: '12px' }}>→</span>
                  </button>
                );
              })}
            </div>

            {/* Back button - positioned at bottom */}
            <button
              onClick={handleCloseSlideOver}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                marginTop: '16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(0,0,0,0.6)',
                letterSpacing: '0.1em',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)';
                e.currentTarget.style.color = 'rgb(251, 191, 36)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.color = 'rgba(0,0,0,0.6)';
              }}
            >
              <span style={{ fontSize: '14px' }}>←</span>
              <span>BACK</span>
            </button>
          </div>
        )}

        {/* FOOTER SECTION - YC Logo + UserMenu (only for standard variant) */}
        {/* Always opens Footer only */}
        {variant === "standard" && (
          <div style={{
            flexShrink: 0,
            height: '85px',
            position: 'relative',
            zIndex: 60  // Above sidebar container (50)
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
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 290  // Above everything - sidebar (50), menu overlay (250), slide-over (270)
              }}
              onClick={(e) => {
                e.preventDefault();
                if (onFooterToggle) {
                  onFooterToggle();
                }
                // Logo only opens Footer - no home navigation
              }}
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
        )}

        {/* User Menu - Fixed position, always visible on standard variant pages (Home, Services, etc.) */}
        {variant === "standard" && (
          <div style={{
            position: 'fixed',
            left: '80px',
            bottom: '20px',
            zIndex: 290,
            display: 'flex',
            alignItems: 'center'
          }}>
            <UserMenu compact dropdownDirection="up" />
          </div>
        )}

        {/* User Menu for hidden variant - Fixed position at bottom left (matches standard variant) */}
        {variant === "hidden" && (
          <div style={{
            position: 'fixed',
            left: '80px',
            bottom: '20px',
            zIndex: 290,
            display: 'flex',
            alignItems: 'center'
          }}>
            <UserMenu compact dropdownDirection="up" />
          </div>
        )}

        {/* CSS styles */}
        <style>{`
          /* Sidebar toggle button hover */
          .sidebar-toggle-btn {
            transition: transform 0.2s ease-out, background-color 0.2s ease-out;
          }
          .sidebar-toggle-btn:hover {
            transform: ${variant === "hidden" ? 'scale(1.1)' : 'translateX(-50%) scale(1.1)'};
            background-color: rgba(251, 191, 36, 0.1);
          }

          /* General hover stability */
          .clickable-element {
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
          }

          /* Nav item button - ensure hover works on entire area */
          .nav-item-button {
            isolation: isolate;
          }

          /* Only apply pointer-events:none to non-interactive children */
          .nav-item-button > div,
          .nav-item-button > span {
            pointer-events: none;
          }
        `}</style>
      </div>
    </>
  );
}

export default Sidebar;
