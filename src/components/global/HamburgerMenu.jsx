import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';

/**
 * HamburgerMenu - Three-line button and full-screen menu overlay
 * Inspired by canals-amsterdam.com - right-aligned with slide-in animation
 */
function HamburgerMenu({ onMenuToggle, onHomeClick, onFooterToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { menuOpen } = useLayout();
  const [hoveredItem, setHoveredItem] = React.useState(null);

  // Close menu on location change
  React.useEffect(() => {
    if (menuOpen && onMenuToggle) {
      onMenuToggle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
              const isIndented = item.startsWith('>');
              const displayText = isIndented ? item.substring(1) : item;
              const isButton = item === 'WORKS' || item === 'CONTACT';

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
                    }}>{displayText}</span>
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
                    gap: '20px'
                  }}
                  onMouseEnter={() => {
                    if (item === 'LABS') setHoveredItem('LABS');
                  }}
                  onMouseLeave={() => {
                    if (item === 'LABS') setHoveredItem(null);
                  }}
                >
                  {/* Show Labs sub-items to the LEFT of LABS when hovering */}
                  {item === 'LABS' && hoveredItem === 'LABS' && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '8px',
                      marginRight: '20px'
                    }}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/uk-memories');
                        }}
                        style={{
                          textDecoration: 'none',
                          color: 'black',
                          fontSize: 'clamp(1rem, 2.5vh, 2rem)',
                          fontWeight: '700',
                          fontFamily: 'Helvetica, Arial, sans-serif',
                          letterSpacing: '0.2em',
                          padding: '8px 0px',
                          borderRadius: '4px',
                          textAlign: 'right',
                          display: 'block',
                          opacity: 0.8,
                          transition: 'all 0.3s ease-in-out',
                          animation: 'slideInMenuItem 0.3s ease-in-out',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = 'white';
                          e.target.style.opacity = 1;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = 'black';
                          e.target.style.opacity = 0.8;
                        }}
                      >
                        UK-Memories &gt;
                      </a>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/unity-notes');
                        }}
                        style={{
                          textDecoration: 'none',
                          color: 'black',
                          fontSize: 'clamp(1rem, 2.5vh, 2rem)',
                          fontWeight: '700',
                          fontFamily: 'Helvetica, Arial, sans-serif',
                          letterSpacing: '0.2em',
                          padding: '8px 0px',
                          borderRadius: '4px',
                          textAlign: 'right',
                          display: 'block',
                          opacity: 0.8,
                          transition: 'all 0.3s ease-in-out',
                          animation: 'slideInMenuItem 0.35s ease-in-out',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = 'white';
                          e.target.style.opacity = 1;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = 'black';
                          e.target.style.opacity = 0.8;
                        }}
                      >
                        Unity Notes &gt;
                      </a>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/experiments/component-library');
                        }}
                        style={{
                          textDecoration: 'none',
                          color: 'black',
                          fontSize: 'clamp(1rem, 2.5vh, 2rem)',
                          fontWeight: '700',
                          fontFamily: 'Helvetica, Arial, sans-serif',
                          letterSpacing: '0.2em',
                          padding: '8px 0px',
                          borderRadius: '4px',
                          textAlign: 'right',
                          display: 'block',
                          opacity: 0.8,
                          transition: 'all 0.3s ease-in-out',
                          animation: 'slideInMenuItem 0.4s ease-in-out',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = 'white';
                          e.target.style.opacity = 1;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = 'black';
                          e.target.style.opacity = 0.8;
                        }}
                      >
                        Component Library &gt;
                      </a>
                    </div>
                  )}

                  <a
                    href="#"
                    onClick={
                      item === 'HOME' ? handleHomeClick :
                      item === 'STORIES' ? undefined :
                      item === 'LABS' ? () => navigate('/experiments') :
                      undefined
                    }
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      if (item === 'HOME') handleHomeClick(e);
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
                      paddingRight: isIndented ? '60px' : '20px',
                      borderRadius: '4px',
                      WebkitTapHighlightColor: 'transparent',
                      userSelect: 'none',
                      animation: `slideInMenuItem 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.12}s both`,
                      textAlign: 'right',
                      display: 'block',
                      transition: 'color 0.3s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'black';
                    }}
                  >
                    {displayText}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default HamburgerMenu;
