import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../../hooks';

/**
 * Shared Sidebar Component
 * Three-section flexbox layout with accordion navigation
 */
const Sidebar = ({
  scrollOffset = 0,
  onHomeClick,
  navigationItems = [],
  logoSrc,
  customStyles = {}
}) => {
  const navigate = useNavigate();
  const {
    isOpen: sidebarOpen,
    expandedSection,
    expandedSubSection,
    toggle: handleSidebarToggle,
    toggleSection,
    toggleSubSection,
    isExpanded,
    isSubExpanded
  } = useSidebar(false);

  const handleHomeClickInternal = () => {
    if (onHomeClick) {
      onHomeClick();
    }
  };

  // Navigation Item Component
  const NavigationItem = ({ icon, label, subItems, itemKey, index }) => {
    const isItemExpanded = isExpanded(itemKey);
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
      if (!sidebarOpen) {
        handleSidebarToggle();
        toggleSection(itemKey);
      } else {
        if (expandedSection === itemKey) {
          if (itemKey === 'labs') {
            navigate('/experiments');
          }
          toggleSection(null);
        } else {
          toggleSection(itemKey);
        }
      }
    };

    return (
      <div style={{ position: 'relative', width: '100%', flexShrink: 0 }}>
        <button
          type="button"
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
          {/* Icon */}
          <div style={{
            position: 'absolute',
            left: '40px',
            top: '50%',
            transform: isItemExpanded
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
            WebkitTransition: 'transform 0.25s ease-out',
            MozTransition: 'transform 0.25s ease-out',
            transition: 'transform 0.25s ease-out'
          }}>
            <img
              src={icon}
              alt={label}
              width="24"
              height="24"
              style={{
                display: 'block',
                filter: isItemExpanded ? 'brightness(1.2) saturate(1.1)' : 'brightness(1)',
                transform: isHovered ? 'rotate(-3deg)' : 'rotate(0deg)',
                WebkitTransition: 'filter 0.25s ease-out, transform 0.2s ease-out',
                MozTransition: 'filter 0.25s ease-out, transform 0.2s ease-out',
                transition: 'filter 0.25s ease-out, transform 0.2s ease-out'
              }}
            />
          </div>

          {/* Label */}
          {sidebarOpen && (
            <span style={{
              position: 'relative',
              marginLeft: '75px',
              fontSize: '15px',
              fontWeight: isItemExpanded ? '700' : '600',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isItemExpanded ? '#EECF00' : isHovered ? '#EECF00' : 'black',
              transition: 'color 0.2s ease-out, font-weight 0.2s ease-out',
              whiteSpace: 'nowrap'
            }}>
              {label}
            </span>
          )}
        </button>

        {/* Sub-items accordion */}
        {sidebarOpen && subItems && subItems.length > 0 && (
          <div style={{
            marginLeft: '60px',
            maxHeight: isItemExpanded ? '500px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.4s ease-out'
          }}>
            {subItems.map((subItem, idx) => {
              const hasNestedItems = typeof subItem === 'object' && subItem.subItems;
              const subItemKey = typeof subItem === 'object' ? subItem.key : subItem;
              const subItemLabel = typeof subItem === 'object' ? subItem.label : subItem;
              const nestedItems = hasNestedItems ? subItem.subItems : null;
              const isSubItemExpanded = isSubExpanded(subItemKey);
              const [isSubHovered, setIsSubHovered] = useState(false);

              return (
                <div key={subItemKey} style={{ marginBottom: '4px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasNestedItems) {
                        toggleSubSection(subItemKey);
                      } else {
                        // Navigate to sub-item
                        if (subItemLabel === 'Golden Unknown') {
                          navigate('/experiments/golden-unknown');
                        } else if (subItemLabel === 'Thoughts') {
                          navigate('/thoughts');
                        }
                      }
                    }}
                    onMouseEnter={() => setIsSubHovered(true)}
                    onMouseLeave={() => setIsSubHovered(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: hasNestedItems && isSubItemExpanded ? '#EECF00' : 'rgba(0,0,0,0.7)',
                      fontSize: '12px',
                      fontWeight: '500',
                      letterSpacing: '0.03em',
                      padding: '7px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: isSubHovered ? 'rgba(238, 207, 0, 0.08)' : 'transparent',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      textAlign: 'left',
                      font: 'inherit',
                      opacity: isItemExpanded ? 1 : 0,
                      transform: isItemExpanded ? 'translateX(0) translateZ(0)' : 'translateX(-8px) translateZ(0)',
                      transitionDelay: isItemExpanded ? `${idx * 0.06}s` : '0s',
                      willChange: 'transform, opacity',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      WebkitTransition: 'color 0.2s ease, background-color 0.2s ease, transform 0.25s ease, padding-left 0.2s ease, opacity 0.3s ease',
                      MozTransition: 'color 0.2s ease, background-color 0.2s ease, transform 0.25s ease, padding-left 0.2s ease, opacity 0.3s ease',
                      transition: 'color 0.2s ease, background-color 0.2s ease, transform 0.25s ease, padding-left 0.2s ease, opacity 0.3s ease'
                    }}
                  >
                    <span style={{
                      color: isSubHovered ? '#EECF00' : (hasNestedItems && isSubItemExpanded ? '#EECF00' : 'rgba(0,0,0,0.7)'),
                      transition: 'color 0.2s ease'
                    }}>
                      {subItemLabel}
                    </span>
                    {hasNestedItems && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '400',
                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transform: isSubItemExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        display: 'inline-block'
                      }}>▼</span>
                    )}
                  </button>

                  {/* Nested third-level items */}
                  {hasNestedItems && nestedItems && (
                    <div style={{
                      marginLeft: '12px',
                      maxHeight: isSubItemExpanded ? '300px' : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease-out'
                    }}>
                      {nestedItems.map((nestedItem, nestedIdx) => {
                        const [isNestedHovered, setIsNestedHovered] = useState(false);

                        return (
                          <button
                            key={nestedIdx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to nested item
                              if (nestedItem === 'Being + Rhyme') {
                                navigate('/experiments/being-rhyme');
                              }
                            }}
                            onMouseEnter={() => setIsNestedHovered(true)}
                            onMouseLeave={() => setIsNestedHovered(false)}
                            style={{
                              display: 'block',
                              color: 'rgba(0,0,0,0.6)',
                              fontSize: '10px',
                              fontWeight: '400',
                              letterSpacing: '0.02em',
                              padding: '6px 6px',
                              marginBottom: '1px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              backgroundColor: isNestedHovered ? 'rgba(238, 207, 0, 0.06)' : 'transparent',
                              whiteSpace: 'nowrap',
                              width: '100%',
                              border: 'none',
                              outline: 'none',
                              textAlign: 'left',
                              font: 'inherit',
                              opacity: isSubItemExpanded ? 1 : 0,
                              transform: isSubItemExpanded ? 'translateX(0) translateZ(0)' : 'translateX(-6px) translateZ(0)',
                              transitionDelay: isSubItemExpanded ? `${nestedIdx * 0.05}s` : '0s',
                              willChange: 'transform, opacity',
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              WebkitTransition: 'color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, padding-left 0.2s ease, opacity 0.3s ease',
                              MozTransition: 'color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, padding-left 0.2s ease, opacity 0.3s ease',
                              transition: 'color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, padding-left 0.2s ease, opacity 0.3s ease'
                            }}
                          >
                            <span style={{
                              color: isNestedHovered ? '#EECF00' : 'rgba(0,0,0,0.6)',
                              transition: 'color 0.2s ease'
                            }}>
                              {nestedItem}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: sidebarOpen ? 'min(max(280px, 35vw), 472px)' : '80px',
      height: '100vh',
      backgroundColor: customStyles.backgroundColor || 'rgba(242, 242, 242, 0.44)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      transition: 'width 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
      transform: 'translateZ(0)',
      willChange: 'width',
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      ...customStyles.container
    }}>
      {/* Header Section */}
      <div style={{ flexShrink: 0, height: '140px', position: 'relative' }}>
        {/* Toggle Button */}
        <button
          type="button"
          onClick={handleSidebarToggle}
          style={{
            position: 'absolute',
            top: '20px',
            left: '40px',
            transform: 'translateX(-50%)',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease-out',
            zIndex: 1001
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
        >
          <div style={{
            width: '24px',
            height: '2px',
            backgroundColor: 'black',
            position: 'relative',
            transition: 'transform 0.3s ease-out'
          }}>
            <div style={{
              position: 'absolute',
              width: '24px',
              height: '2px',
              backgroundColor: 'black',
              top: '-7px',
              transition: 'transform 0.3s ease-out'
            }} />
            <div style={{
              position: 'absolute',
              width: '24px',
              height: '2px',
              backgroundColor: 'black',
              top: '7px',
              transition: 'transform 0.3s ease-out'
            }} />
          </div>
        </button>

        {/* HOME Breadcrumb */}
        <button
          type="button"
          onClick={handleHomeClickInternal}
          style={{
            position: 'absolute',
            top: '100px',
            left: '40px',
            transform: 'translateX(-50%) rotate(-90deg)',
            transformOrigin: 'center',
            fontSize: '12px',
            fontWeight: scrollOffset === 0 ? '700' : '600',
            letterSpacing: '0.12em',
            color: scrollOffset === 0 ? '#EECF00' : 'black',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'color 0.3s ease-out, font-weight 0.3s ease-out',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            font: 'inherit'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#EECF00'}
          onMouseLeave={(e) => e.currentTarget.style.color = scrollOffset === 0 ? '#EECF00' : 'black'}
        >
          HOME
        </button>
      </div>

      {/* Navigation Section */}
      <nav style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '8px',
        padding: '20px 0',
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0
      }}>
        {navigationItems.map((item, index) => (
          <NavigationItem key={item.itemKey} {...item} index={index} />
        ))}
      </nav>

      {/* Footer Section */}
      <div style={{ flexShrink: 0, height: '85px', position: 'relative' }}>
        {logoSrc && (
          <a
            href="/"
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'block',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1.1) rotate(5deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1) rotate(0deg)'}
          >
            <img
              src={logoSrc}
              alt="Logo"
              width="40"
              height="40"
              style={{ display: 'block' }}
            />
          </a>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
