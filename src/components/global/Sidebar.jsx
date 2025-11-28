import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Lottie from 'lottie-react';

// Import Lottie animations
import scrollAnimation from '../../assets/lottie/scroll.json';
import testTubeAnimation from '../../assets/lottie/testTube.json';
import waveAnimation from '../../assets/lottie/wave.json';

// Map of icon keys to Lottie animations
const LOTTIE_ICONS = {
  stories: scrollAnimation,
  labs: testTubeAnimation,
  about: waveAnimation
};

/**
 * Sidebar - Three-section collapsible sidebar with in-place accordion navigation
 *
 * Features:
 * - In-place accordion expansion for sub-items
 * - Lottie animated icons with hover control
 * - Font sizes reduced by 15%
 * - Firefox compatibility for animations
 *
 * Variants:
 * - "standard": 80px when closed (default)
 * - "hidden": 0px when closed (Unity Notes variant)
 */
function Sidebar({ onHomeClick, onFooterToggle, navigationItems = [], scrollOffset = 0, pageLabel = "HOME", variant = "standard" }) {
  const navigate = useNavigate();
  const {
    sidebarOpen,
    setSidebarOpen,
    expandedSection,
    setExpandedSection,
    expandedSubSection,
    setExpandedSubSection
  } = useLayout();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleHomeClick = (e) => {
    if (onHomeClick) onHomeClick(e);
  };

  // Navigation Item Component - In-place accordion with Lottie icons
  // Font sizes reduced by 15%: 15px→13px, 14px→12px, 12px→10px, 10px→8.5px
  // Firefox compatibility: debounced hover, CSS fallbacks
  const NavigationItem = ({ icon, label, subItems, itemKey, index }) => {
    const isExpanded = expandedSection === itemKey && sidebarOpen;
    const [isHovered, setIsHovered] = useState(false);
    const lottieRef = useRef(null);
    const hoverTimeoutRef = useRef(null);

    // Get Lottie animation data if available
    const lottieData = LOTTIE_ICONS[itemKey];

    const handleClick = () => {
      if (!sidebarOpen) {
        // First click: open sidebar and expand section
        setSidebarOpen(true);
        setExpandedSection(itemKey);
      } else {
        // Toggle expansion or navigate
        if (subItems && subItems.length > 0) {
          // Toggle accordion
          setExpandedSection(expandedSection === itemKey ? null : itemKey);
        } else {
          // Navigate directly for items without sub-items
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

    // Play Lottie on hover - debounced for Firefox stability
    const handleMouseEnter = () => {
      // Clear any pending leave timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setIsHovered(true);
      // Use requestAnimationFrame to ensure DOM is stable before playing
      requestAnimationFrame(() => {
        try {
          if (lottieRef.current && typeof lottieRef.current.play === 'function') {
            lottieRef.current.play();
          }
        } catch (e) {
          // Firefox fallback - ignore animation errors
          console.debug('Lottie play error:', e);
        }
      });
    };

    const handleMouseLeave = () => {
      // Debounce the leave to prevent flickering
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
        try {
          if (lottieRef.current && typeof lottieRef.current.stop === 'function') {
            lottieRef.current.stop();
          }
        } catch (e) {
          // Firefox fallback - ignore animation errors
          console.debug('Lottie stop error:', e);
        }
      }, 50);
    };

    return (
      <div style={{
        position: 'relative',
        width: '100%',
        flexShrink: 0
      }}>
        {/* Main navigation item container */}
        <button
          type="button"
          className="clickable-element"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 8px 10px 0',
            position: 'relative',
            minHeight: '48px',
            width: '100%',
            borderRadius: '6px',
            backgroundColor: (isHovered || isExpanded) && sidebarOpen ? 'rgba(238, 207, 0, 0.12)' : 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease-out',
            WebkitTapHighlightColor: 'transparent',
            border: 'none',
            outline: 'none',
            textAlign: 'left',
            font: 'inherit'
          }}
        >

          {/* Icon - Lottie animation or fallback img */}
          <div style={{
            position: 'absolute',
            left: '40px',
            top: '50%',
            transform: isExpanded
              ? 'translate(-50%, -50%) scale(1.05)'
              : isHovered
                ? 'translate(-50%, -50%) scale(1.03)'
                : 'translate(-50%, -50%) scale(1)',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none',
            transition: 'transform 0.15s ease-out'
          }}>
            {lottieData ? (
              <Lottie
                lottieRef={lottieRef}
                animationData={lottieData}
                loop={true}
                autoplay={false}
                renderer="svg"
                rendererSettings={{
                  preserveAspectRatio: 'xMidYMid slice',
                  progressiveLoad: true,
                  hideOnTransparent: true
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'block'
                }}
              />
            ) : (
              <img
                src={icon}
                alt={label}
                width="24"
                height="24"
                style={{
                  display: 'block',
                  filter: isExpanded ? 'brightness(1.2) saturate(1.1)' : 'brightness(1)',
                  transition: 'filter 0.15s ease-out'
                }}
              />
            )}
          </div>

          {/* Label - reduced font size (15px → 13px) */}
          <span style={{
            position: 'absolute',
            left: '60px',
            top: '50%',
            color: isExpanded ? '#EECF00' : 'black',
            fontSize: '13px',
            fontWeight: isExpanded ? '700' : '600',
            letterSpacing: '0.2em',
            opacity: sidebarOpen ? 1 : 0,
            transform: sidebarOpen ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-10px)',
            transition: 'color 0.15s ease-out, font-weight 0.15s ease-out, opacity 0.3s ease-out 0.1s, transform 0.3s ease-out 0.1s',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>{label}</span>

          {/* Sub-items indicator arrow - rotates when expanded */}
          {subItems && subItems.length > 0 && sidebarOpen && (
            <span style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: isExpanded ? 'translateY(-50%) rotate(90deg)' : 'translateY(-50%) rotate(0deg)',
              fontSize: '10px',
              color: isExpanded ? '#EECF00' : 'rgba(0,0,0,0.4)',
              opacity: sidebarOpen ? 1 : 0,
              transition: 'transform 0.2s ease-out, color 0.15s ease-out, opacity 0.2s ease-out'
            }}>→</span>
          )}
        </button>

        {/* Sub-items - In-place accordion expansion */}
        {subItems && subItems.length > 0 && (
          <div style={{
            marginLeft: '60px',
            marginTop: '-4px',
            maxHeight: isExpanded ? `${subItems.length * 36 + 10}px` : '0px',
            overflow: 'hidden',
            opacity: isExpanded ? 1 : 0,
            transition: 'max-height 0.3s ease-out, opacity 0.2s ease-out'
          }}>
            <div style={{ paddingTop: '4px', paddingBottom: '4px' }}>
              {subItems.map((item, idx) => {
                const itemLabel = typeof item === 'string' ? item : item.label;
                const itemKeyVal = typeof item === 'string' ? item : item.key;

                return (
                  <button
                    key={idx}
                    type="button"
                    className="clickable-element"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigation logic
                      if (itemKeyVal === 'home-17') {
                        navigate('/home-17');
                      } else if (itemKeyVal === 'uk-memories') {
                        navigate('/uk-memories');
                      } else if (itemKeyVal === 'component-library') {
                        navigate('/experiments/component-library');
                      } else if (itemKeyVal === 'golden-unknown') {
                        navigate('/experiments/golden-unknown');
                      } else if (itemKeyVal === 'thoughts') {
                        navigate('/thoughts');
                      }
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 10px',
                      marginBottom: '2px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: 'rgba(0,0,0,0.7)',
                      letterSpacing: '0.03em',
                      textAlign: 'left',
                      transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.15s ease',
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                      transitionDelay: isExpanded ? `${idx * 0.04}s` : '0s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.15)';
                      e.currentTarget.style.color = '#EECF00';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(0,0,0,0.7)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {itemLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const closedWidth = variant === "hidden" ? '0px' : '80px';

  // For "hidden" variant, determine if background/icons should be visible
  const showBackground = variant === "hidden" ? sidebarOpen : true;
  const togglePosition = variant === "hidden" ? 'fixed' : 'absolute';
  const toggleLeft = variant === "hidden" ? '20px' : '40px';

  return (
    <>
      {/* Sidebar Toggle Button - Fixed position for "hidden" variant */}
      <div
        className="clickable-element"
        onClick={handleSidebarToggle}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleSidebarToggle();
        }}
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
          WebkitTapHighlightColor: 'transparent',
          zIndex: 150,
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease-out'
        }}
        onMouseEnter={(e) => {
          const baseTransform = variant === "hidden" ? '' : 'translateX(-50%) ';
          e.currentTarget.style.transform = `${baseTransform}scale(1.12)`;
          e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          const baseTransform = variant === "hidden" ? 'none' : 'translateX(-50%) scale(1)';
          e.currentTarget.style.transform = baseTransform;
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

      {/* YC Logo - Fixed position for "hidden" variant only */}
      {variant === "hidden" && (
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
            zIndex: 150,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onClick={(e) => {
            e.preventDefault();
            // Engage footer on logo click
            if (onFooterToggle) {
              onFooterToggle();
            } else {
              handleHomeClick(e);
            }
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
      )}

      {/* Sidebar container with background and navigation */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: sidebarOpen ? 'min(max(280px, 35vw), 472px)' : closedWidth,
        height: '100vh',
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
        pointerEvents: sidebarOpen || variant === "standard" ? 'auto' : 'none'
      }}>

        {/* HEADER SECTION - HOME Label */}
        <div style={{
          flexShrink: 0,
          height: '100px',
          position: 'relative',
          opacity: showBackground ? 1 : 0,
          transition: 'opacity 0.3s ease-out'
        }}>
          {/* HOME Label - Breadcrumb indicator */}
          <div
            className="clickable-element"
            onClick={handleHomeClick}
            style={{
              position: 'absolute',
              top: 'calc(160% + 60px)',
              left: '40px',
              transform: 'rotate(-90deg)',
              transformOrigin: 'left center',
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
              letterSpacing: '0.1em',
              fontSize: '12px',
              transition: 'color 0.2s ease-out, font-weight 0.2s ease-out'
            }}>{pageLabel}</span>
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
            justifyContent: 'center',
            gap: '8px',
            padding: '20px 0',
            minHeight: 0,
            opacity: showBackground ? 1 : 0,
            transition: 'opacity 0.3s ease-out'
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

        {/* FOOTER SECTION - YC Logo (only for standard variant) */}
        {variant === "standard" && (
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
              onClick={(e) => {
                e.preventDefault();
                // Engage footer on logo click
                if (onFooterToggle) {
                  onFooterToggle();
                } else {
                  handleHomeClick(e);
                }
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

        {/* Firefox-compatible CSS hover fallback styles */}
        <style>{`
          /* Firefox-specific hover fixes */
          @-moz-document url-prefix() {
            .nav-item-button:hover {
              background-color: rgba(238, 207, 0, 0.12) !important;
            }
            .sub-item-button:hover {
              background-color: rgba(238, 207, 0, 0.15) !important;
              color: #EECF00 !important;
            }
          }

          /* General hover stability */
          .clickable-element {
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
          }

          /* Prevent hover flicker on nested elements */
          .clickable-element * {
            pointer-events: none;
          }
          .clickable-element button,
          .clickable-element a {
            pointer-events: auto;
          }
        `}</style>
      </div>
    </>
  );
}

export default Sidebar;
