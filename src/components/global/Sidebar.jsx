import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';

/**
 * Sidebar - Three-section collapsible sidebar with accordion navigation
 * Matches HomePage.jsx lines 982-1159 exactly
 * Includes NavigationItem sub-component (lines 364-652)
 *
 * Variants:
 * - "standard": 80px when closed (default)
 * - "hidden": 0px when closed (Unity Notes variant)
 */
function Sidebar({ onHomeClick, navigationItems = [], scrollOffset = 0, pageLabel = "HOME", variant = "standard" }) {
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
          } else if (itemKey === 'about') {
            navigate('/about');
          } else if (itemKey === 'stories') {
            navigate('/thoughts');
          }
          // Keep section expanded after navigation
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
        <button
          type="button"
          className="clickable-element"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 8px 10px 0',
            position: 'relative',
            minHeight: '48px',
            width: '100%',
            borderRadius: '6px',
            backgroundColor: isHovered && sidebarOpen ? 'rgba(238, 207, 0, 0.12)' : 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease-out',
            WebkitTapHighlightColor: 'transparent',
            border: 'none',
            outline: 'none',
            textAlign: 'left',
            font: 'inherit'
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
                ? 'translate(-50%, -50%) scale(1.03)'
                : 'translate(-50%, -50%) scale(1)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none',
            WebkitTransition: 'transform 0.2s ease-out',
            MozTransition: 'transform 0.2s ease-out',
            transition: 'transform 0.2s ease-out'
          }}>
            <img
              src={icon}
              alt={label}
              width="24"
              height="24"
              style={{
                display: 'block',
                filter: isExpanded ? 'brightness(1.2) saturate(1.1)' : 'brightness(1)',
                WebkitTransition: 'filter 0.2s ease-out',
                MozTransition: 'filter 0.2s ease-out',
                transition: 'filter 0.2s ease-out'
              }}
            />
          </div>

          {/* Label - appears to the RIGHT of the centered icon when sidebar opens */}
          <span style={{
            position: 'absolute',
            left: '60px',
            top: '50%',
            color: isExpanded ? '#EECF00' : 'black',
            fontSize: '15px',
            fontWeight: isExpanded ? '700' : '600',
            letterSpacing: '0.2em',
            opacity: sidebarOpen ? 1 : 0,
            transform: sidebarOpen ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-10px)',
            transition: 'color 0.3s ease-out, font-weight 0.3s ease-out, opacity 0.4s ease-out 0.1s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>{label}</span>
        </button>

        {/* Sub-items - accordion style with nested support */}
        <div style={{
          marginLeft: '60px',
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
                  <div key={idx} style={{ marginBottom: '2px' }}>
                    <button
                      type="button"
                      className="clickable-element"
                      onClick={(e) => {
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
                        letterSpacing: '0.03em',
                        textDecoration: 'none',
                        padding: '7px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        whiteSpace: 'nowrap',
                        overflow: 'visible',
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        textAlign: 'left',
                        font: 'inherit',
                        opacity: isExpanded ? 1 : 0,
                        transform: isExpanded ? 'translateX(0) translateZ(0)' : 'translateX(-8px) translateZ(0)',
                        transitionDelay: isExpanded ? `${idx * 0.06}s` : '0s',
                        willChange: 'transform, opacity',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        WebkitTransition: 'color 0.2s ease, background-color 0.2s ease, transform 0.25s ease, padding-left 0.2s ease, opacity 0.3s ease',
                        MozTransition: 'color 0.2s ease, background-color 0.2s ease, transform 0.25s ease, padding-left 0.2s ease, opacity 0.3s ease',
                        transition: 'color 0.2s ease, background-color 0.2s ease, transform 0.25s ease, padding-left 0.2s ease, opacity 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#EECF00';
                        e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = hasNestedItems && isSubExpanded ? '#EECF00' : 'rgba(0,0,0,0.7)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.paddingLeft = '6px';
                      }}
                    >
                      <span>{itemLabel}</span>
                      {hasNestedItems && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '400',
                          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          transform: isSubExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          display: 'inline-block'
                        }}>▼</span>
                      )}
                    </button>

                    {/* Render nested sub-items with accordion */}
                    {hasNestedItems && (
                      <div style={{
                        marginLeft: '12px',
                        marginTop: '2px',
                        maxHeight: isSubExpanded ? '300px' : '0px',
                        overflow: 'hidden',
                        opacity: isSubExpanded ? 1 : 0,
                        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out 0.1s'
                      }}>
                        {item.subItems.map((nestedItem, nestedIdx) => (
                          <button
                            type="button"
                            key={nestedIdx}
                            className="clickable-element"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add nested navigation logic here as needed
                            }}
                            style={{
                              display: 'block',
                              color: 'rgba(0,0,0,0.6)',
                              fontSize: '10px',
                              fontWeight: '400',
                              letterSpacing: '0.02em',
                              textDecoration: 'none',
                              padding: '6px 6px',
                              marginBottom: '1px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              backgroundColor: 'transparent',
                              whiteSpace: 'nowrap',
                              overflow: 'visible',
                              width: '100%',
                              border: 'none',
                              outline: 'none',
                              textAlign: 'left',
                              font: 'inherit',
                              opacity: isSubExpanded ? 1 : 0,
                              transform: isSubExpanded ? 'translateX(0) translateZ(0)' : 'translateX(-6px) translateZ(0)',
                              transitionDelay: isSubExpanded ? `${nestedIdx * 0.05}s` : '0s',
                              willChange: 'transform, opacity',
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              WebkitTransition: 'color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, padding-left 0.2s ease, opacity 0.3s ease',
                              MozTransition: 'color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, padding-left 0.2s ease, opacity 0.3s ease',
                              transition: 'color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, padding-left 0.2s ease, opacity 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#EECF00';
                              e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.08)';
                              e.currentTarget.style.transform = 'translateX(2px)';
                              e.currentTarget.style.paddingLeft = '8px';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'rgba(0,0,0,0.6)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.transform = 'translateX(0)';
                              e.currentTarget.style.paddingLeft = '6px';
                            }}
                          >
                            {nestedItem}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
            handleHomeClick(e);
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
              fontSize: '14px',
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
                handleHomeClick(e);
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
      </div>
    </>
  );
}

export default Sidebar;
