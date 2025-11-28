import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';

/**
 * HamburgerMenu - Three-line button and full-screen menu overlay
 * Inspired by canals-amsterdam.com - right-aligned with slide-in animation
 * Updated with slide-over pattern for subitems with indicators
 */
function HamburgerMenu({ onMenuToggle, onHomeClick, onFooterToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { menuOpen } = useLayout();
  const [hoveredItem, setHoveredItem] = React.useState(null);
  const [slideOverOpen, setSlideOverOpen] = React.useState(false);
  const [slideOverItems, setSlideOverItems] = React.useState([]);
  const [slideOverTitle, setSlideOverTitle] = React.useState('');

  // Menu items configuration with sub-items
  const menuConfig = {
    HOME: { hasSubItems: false },
    STORIES: {
      hasSubItems: true,
      subItems: [
        { label: 'Thoughts', route: '/thoughts' },
        { label: 'Case Studies', route: '/thoughts' }
      ]
    },
    LABS: {
      hasSubItems: true,
      subItems: [
        { label: 'UK-Memories', route: '/uk-memories' },
        { label: 'Unity Notes', route: '/unity-notes' },
        { label: 'Component Library', route: '/experiments/component-library' }
      ]
    },
    WORKS: { hasSubItems: false, isButton: true },
    CONTACT: { hasSubItems: false, isButton: true }
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

  const handleFooterToggle = () => {
    if (onFooterToggle) onFooterToggle();
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={handleMenuClick}
        style={{
          position: 'fixed',
          right: '50px',
          top: '20px',
          padding: '10px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          zIndex: 260,
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

      {/* Menu Overlay - Slides in from right with right-aligned content */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#EECF00',
          opacity: 0.96,
          zIndex: 250,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingRight: 'max(50px, 5vw)',
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
            {['HOME', 'STORIES', 'LABS', 'WORKS', 'CONTACT'].map((item, index) => {
              const config = menuConfig[item];
              const isButton = config?.isButton;
              const hasSubItems = config?.hasSubItems;

              if (isButton) {
                return (
                  <div
                    key={item}
                    className={item === 'WORKS' ? 'menu-button-works' : 'menu-button-contact'}
                    onClick={item === 'CONTACT' ? handleFooterToggle : undefined}
                    style={{
                      backgroundColor: item === 'WORKS' ? 'white' : 'black',
                      border: 'none',
                      padding: '15px 40px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      animation: `slideInMenuItem 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.12}s both`,
                      textAlign: 'right',
                      transition: 'all 0.3s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      if (item === 'WORKS') {
                        e.currentTarget.style.backgroundColor = 'black';
                        e.currentTarget.querySelector('span').style.color = 'white';
                      } else {
                        e.currentTarget.style.backgroundColor = '#EECF00';
                        e.currentTarget.querySelector('span').style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (item === 'WORKS') {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.querySelector('span').style.color = 'black';
                      } else {
                        e.currentTarget.style.backgroundColor = 'black';
                        e.currentTarget.querySelector('span').style.color = '#EECF00';
                      }
                    }}
                  >
                    <span style={{
                      color: item === 'WORKS' ? 'black' : '#EECF00',
                      fontSize: 'clamp(2rem, 5vh, 4rem)',
                      fontWeight: '900',
                      fontFamily: 'Helvetica, Arial Black, Arial, sans-serif',
                      letterSpacing: '0.3em',
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
                      } else if (item === 'LABS') {
                        navigate('/experiments');
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      if (item === 'HOME') handleHomeClick(e);
                      else if (hasSubItems) handleOpenSlideOver(item, config.subItems);
                      else if (item === 'LABS') navigate('/experiments');
                    }}
                    className={`menu-item-${index + 1} menu-link`}
                    style={{
                      textDecoration: 'none',
                      color: 'black',
                      fontSize: 'clamp(2rem, 5vh, 4rem)',
                      fontWeight: '900',
                      fontFamily: 'Helvetica, Arial Black, Arial, sans-serif',
                      letterSpacing: '0.3em',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      WebkitTapHighlightColor: 'transparent',
                      userSelect: 'none',
                      animation: `slideInMenuItem 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.12}s both`,
                      textAlign: 'right',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
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

          {/* Slide-over panel for sub-items */}
          {slideOverOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 'min(400px, 80vw)',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              zIndex: 260,
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.3)'
            }}>
              {/* Back button header */}
              <div style={{
                padding: '24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <button
                  onClick={handleCloseSlideOver}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.7)',
                    letterSpacing: '0.1em',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.2)';
                    e.currentTarget.style.color = '#EECF00';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>←</span>
                  <span>BACK</span>
                </button>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: '#EECF00',
                  letterSpacing: '0.2em'
                }}>{slideOverTitle}</span>
              </div>

              {/* Sub-items list */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {slideOverItems.map((subItem, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      navigate(subItem.route);
                      handleCloseSlideOver();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '18px 20px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'white',
                      letterSpacing: '0.1em',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      animation: `slideInMenuItem 0.3s ease-out ${idx * 0.08}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.15)';
                      e.currentTarget.style.color = '#EECF00';
                      e.currentTarget.style.transform = 'translateX(-8px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span>{subItem.label}</span>
                    <span style={{ opacity: 0.5, fontSize: '14px' }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default HamburgerMenu;
