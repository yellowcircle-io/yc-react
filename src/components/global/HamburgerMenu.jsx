import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';

/**
 * HamburgerMenu - Three-line button and full-screen menu overlay
 * Inspired by canals-amsterdam.com - right-aligned with slide-in animation
 * Updated with slide-over pattern for subitems with indicators
 */
// eslint-disable-next-line no-unused-vars
function HamburgerMenu({ onMenuToggle, onHomeClick, onFooterToggle, onContactClick, darkBackground = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { menuOpen } = useLayout();
  // eslint-disable-next-line no-unused-vars
  const [hoveredItem, setHoveredItem] = React.useState(null);

  // Mobile detection
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-detect dark background pages
  const darkPages = ['/thoughts/why-your-gtm-sucks'];
  const isDarkPage = darkBackground || darkPages.some(path => location.pathname.startsWith(path));
  const [slideOverOpen, setSlideOverOpen] = React.useState(false);
  const [slideOverItems, setSlideOverItems] = React.useState([]);
  const [slideOverTitle, setSlideOverTitle] = React.useState('');

  // Menu items configuration with sub-items
  // IMPORTANT: Keep in sync with navigationItems.js
  const menuConfig = {
    HOME: { hasSubItems: false },
    SERVICES: {
      hasSubItems: true,
      subItems: [
        { label: 'ALL SERVICES', route: '/services' },
        { label: 'GROWTH INFRASTRUCTURE AUDIT', route: '/services/gtm-audit' },
        { label: 'MARKETING SYSTEMS', route: '/services/marketing-systems' },
        { label: 'TECHNICAL DEBT', route: '/services/technical-debt' },
        { label: 'ATTRIBUTION AUDIT', route: '/services/attribution-audit' },
        { label: 'DATA ARCHITECTURE', route: '/services/data-architecture' },
        { label: 'CREATIVE + OPERATIONS', route: '/services/creative-operations' },
        { label: 'EMAIL DEVELOPMENT', route: '/services/email-development' }
      ]
    },
    STORIES: {
      hasSubItems: true,
      subItems: [
        { label: 'CLIENTS', route: '/works' },
        { label: 'THOUGHTS', route: '/thoughts' },
        { label: 'GOLDEN UNKNOWN', route: '/experiments/golden-unknown' }
      ]
    },
    JOURNEYS: {
      hasSubItems: true,
      subItems: [
        { label: 'GROWTH HEALTH CHECK', route: '/assessment' },
        { label: 'UNITYMAP GENERATOR', route: '/experiments/outreach-generator' },
        { label: 'UNITYNOTES', route: '/unity-notes' }
      ]
    },
    CLIENTS: { hasSubItems: false, isButton: true },
    CONTACT: { hasSubItems: false, isButton: true },
    SETTINGS: { hasSubItems: false, route: '/account/settings' }
  };

  const handleOpenSlideOver = (title, items) => {
    setSlideOverTitle(title);
    setSlideOverItems(items);
    setSlideOverOpen(true);
  };

  const handleCloseSlideOver = () => {
    setSlideOverOpen(false);
    setSlideOverItems([]);
    setSlideOverTitle('');
  };

  // Close menu and slide-over on location change
  React.useEffect(() => {
    if (menuOpen && onMenuToggle) {
      onMenuToggle();
    }
    handleCloseSlideOver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Reset slide-over when menu closes
  React.useEffect(() => {
    if (!menuOpen) {
      handleCloseSlideOver();
    }
  }, [menuOpen]);

  // Inject keyframe animations
  React.useEffect(() => {
    const styleId = 'hamburger-menu-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 0.96;
          }
        }
        @keyframes slideInMenuItem {
          from {
            transform: translateX(50px);
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

  const handleMenuClick = () => {
    if (onMenuToggle) onMenuToggle();
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (onHomeClick) onHomeClick(e);
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={handleMenuClick}
        style={{
          position: 'fixed',
          right: isMobile ? '20px' : '50px',
          top: '20px',
          padding: '10px',
          backgroundColor: isDarkPage && !menuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 310,
          pointerEvents: 'auto',
          transition: 'background-color 0.3s ease'
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
              backgroundColor: menuOpen ? 'black' : (isDarkPage ? 'white' : 'black'),
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

      {/* Menu Overlay - Slides in from right with right-aligned content */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgb(251, 191, 36)',
          opacity: 0.96,
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingRight: isMobile ? '20px' : 'max(50px, 5vw)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '5px'
          }}>
            {['HOME', 'SERVICES', 'STORIES', 'JOURNEYS', 'CLIENTS', 'CONTACT', 'SETTINGS'].map((item, index) => {
              const config = menuConfig[item];
              const isButton = config?.isButton;
              const hasSubItems = config?.hasSubItems;

              if (isButton) {
                return (
                  <div
                    key={item}
                    className={item === 'CLIENTS' ? 'menu-button-clients' : 'menu-button-contact'}
                    onClick={item === 'CONTACT' ? () => { if (onContactClick) onContactClick(); if (onMenuToggle) onMenuToggle(); } : item === 'CLIENTS' ? () => { navigate('/works'); if (onMenuToggle) onMenuToggle(); } : undefined}
                    style={{
                      backgroundColor: item === 'CLIENTS' ? 'white' : 'black',
                      border: 'none',
                      padding: '15px 40px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      animation: `slideInMenuItem 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.12}s both`,
                      textAlign: 'right',
                      transition: 'all 0.3s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      if (item === 'CLIENTS') {
                        e.currentTarget.style.backgroundColor = 'black';
                        e.currentTarget.querySelector('span').style.color = 'white';
                      } else {
                        e.currentTarget.style.backgroundColor = 'rgb(251, 191, 36)';
                        e.currentTarget.querySelector('span').style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (item === 'CLIENTS') {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.querySelector('span').style.color = 'black';
                      } else {
                        e.currentTarget.style.backgroundColor = 'black';
                        e.currentTarget.querySelector('span').style.color = 'rgb(251, 191, 36)';
                      }
                    }}
                  >
                    <span style={{
                      color: item === 'CLIENTS' ? 'black' : 'rgb(251, 191, 36)',
                      fontSize: isMobile ? 'clamp(1.5rem, 4vh, 2.5rem)' : 'clamp(2rem, 5vh, 4rem)',
                      fontWeight: '900',
                      fontFamily: 'Helvetica, Arial Black, Arial, sans-serif',
                      letterSpacing: isMobile ? '0.2em' : '0.3em',
                      transition: 'color 0.3s ease-in-out'
                    }}>{item}</span>
                  </div>
                );
              }

              return (
                <div
                  key={item}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '12px'
                  }}
                >
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (item === 'HOME') {
                        handleHomeClick(e);
                      } else if (hasSubItems) {
                        handleOpenSlideOver(item, config.subItems);
                      } else if (config?.route) {
                        navigate(config.route);
                        if (onMenuToggle) onMenuToggle();
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      if (item === 'HOME') handleHomeClick(e);
                      else if (hasSubItems) handleOpenSlideOver(item, config.subItems);
                      else if (config?.route) {
                        navigate(config.route);
                        if (onMenuToggle) onMenuToggle();
                      }
                    }}
                    className={`menu-item-${index + 1} menu-link`}
                    style={{
                      textDecoration: 'none',
                      color: 'black',
                      fontSize: isMobile ? 'clamp(1.5rem, 4vh, 2.5rem)' : 'clamp(2rem, 5vh, 4rem)',
                      fontWeight: '900',
                      fontFamily: 'Helvetica, Arial Black, Arial, sans-serif',
                      letterSpacing: isMobile ? '0.2em' : '0.3em',
                      padding: isMobile ? '8px 16px' : '10px 20px',
                      borderRadius: '4px',
                      WebkitTapHighlightColor: 'transparent',
                      userSelect: 'none',
                      animation: `slideInMenuItem 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.12}s both`,
                      textAlign: 'right',
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '12px' : '16px',
                      transition: 'color 0.3s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'black';
                    }}
                  >
                    {item}
                    {/* Sub-items indicator */}
                    {hasSubItems && (
                      <span style={{
                        fontSize: 'clamp(1rem, 2vh, 1.5rem)',
                        opacity: 0.6,
                        transition: 'opacity 0.2s ease'
                      }}>→</span>
                    )}
                  </a>
                </div>
              );
            })}
          </div>

          {/* Slide-over panel for sub-items - Yellow theme matching main overlay */}
          {slideOverOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: isMobile ? '100vw' : 'min(500px, 85vw)',
              height: '100vh',
              backgroundColor: 'rgb(251, 191, 36)',
              zIndex: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingRight: isMobile ? '20px' : 'max(50px, 5vw)',
              animation: 'slideInRight 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.15)'
            }}>
              {/* Section title - matching parent category typography */}
              <span style={{
                fontSize: 'clamp(2rem, 5vh, 4rem)',
                fontWeight: '900',
                fontFamily: 'Helvetica, Arial Black, Arial, sans-serif',
                color: 'black',
                letterSpacing: '0.3em',
                marginBottom: '20px',
                animation: 'slideInMenuItem 0.3s ease-out both'
              }}>{slideOverTitle}</span>

              {/* Sub-items list - matching parent category typography */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: slideOverItems.length > 6 ? '2px' : '5px'
              }}>
                {slideOverItems.map((subItem, idx) => {
                  // Scale font size based on number of items
                  const itemCount = slideOverItems.length;
                  let fontSize = 'clamp(1.5rem, 4vh, 3rem)';
                  let padding = '10px 20px';
                  if (itemCount > 8) {
                    fontSize = 'clamp(0.9rem, 2.5vh, 1.8rem)';
                    padding = '6px 20px';
                  } else if (itemCount > 6) {
                    fontSize = 'clamp(1.1rem, 3vh, 2.2rem)';
                    padding = '8px 20px';
                  }

                  return (
                    <a
                      key={idx}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(subItem.route);
                        handleCloseSlideOver();
                      }}
                      style={{
                        textDecoration: 'none',
                        color: 'black',
                        fontSize: fontSize,
                        fontWeight: '300',
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        padding: padding,
                        borderRadius: '4px',
                        WebkitTapHighlightColor: 'transparent',
                        userSelect: 'none',
                        textAlign: 'right',
                        transition: 'color 0.3s ease-in-out',
                        animation: `slideInMenuItem 0.3s ease-out ${(idx + 1) * 0.08}s both`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'black';
                      }}
                    >
                      {subItem.label}
                    </a>
                  );
                })}

                {/* Back button - under last item */}
                <button
                  onClick={handleCloseSlideOver}
                  style={{
                    marginTop: '30px',
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: 'clamp(1rem, 2vh, 1.5rem)',
                    fontWeight: '700',
                    fontFamily: 'Helvetica, Arial Black, Arial, sans-serif',
                    color: 'rgba(0,0,0,0.5)',
                    letterSpacing: '0.2em',
                    transition: 'color 0.3s ease',
                    animation: `slideInMenuItem 0.3s ease-out ${(slideOverItems.length + 1) * 0.08}s both`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(0,0,0,0.5)';
                  }}
                >
                  <span>←</span>
                  <span>BACK</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default HamburgerMenu;
