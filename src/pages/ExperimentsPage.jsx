import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParallax } from '../hooks';
import HomeStyleSidebar from '../components/shared/HomeStyleSidebar';

function ExperimentsPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [footerOpen, setFooterOpen] = useState(false);

  // Use shared parallax hook
  const { x: parallaxX, y: parallaxY } = useParallax({
    enableMouse: true,
    enableDeviceMotion: true,
    mouseIntensity: 0.6,
    motionIntensity: 0.6
  });

  const handleHomeClick = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    setFooterOpen(false);
    navigate('/');
  };

  // Handle footer toggle
  const handleFooterToggle = () => {
    setFooterOpen(!footerOpen);
    setMenuOpen(false);
  };

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    if (sidebarOpen) {
      setExpandedSection(null);
    }
    setSidebarOpen(!sidebarOpen);
  };

  const navigationItems = [
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
      label: "EXPERIMENTS",
      itemKey: "experiments",
      subItems: ["golden unknown", "being + rhyme", "cath3dral"]
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

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'auto',
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

        /* Footer responsive fixes - keep 50/50 layout on all viewports */
        @media (max-width: 768px) {
          [style*="padding: 40px"][style*="backgroundColor: rgba(0,0,0,0.9)"],
          [style*="padding: 40px"][style*="backgroundColor: #EECF00"] {
            padding: 20px 12px !important;
          }

          [style*="fontSize: 24px"][style*="letterSpacing: 0.3em"] {
            font-size: 16px !important;
            margin-bottom: 10px !important;
          }

          [style*="fontSize: 14px"][style*="letterSpacing: 0.1em"] {
            font-size: 11px !important;
          }

          [style*="gap: 15px"] {
            gap: 10px !important;
          }
        }

        @media (max-width: 480px) {
          [style*="padding: 40px"][style*="backgroundColor: rgba(0,0,0,0.9)"],
          [style*="padding: 40px"][style*="backgroundColor: #EECF00"] {
            padding: 16px 8px !important;
          }

          [style*="fontSize: 24px"][style*="letterSpacing: 0.3em"] {
            font-size: 14px !important;
            margin-bottom: 8px !important;
          }

          [style*="fontSize: 14px"][style*="letterSpacing: 0.1em"] {
            font-size: 10px !important;
          }

          [style*="gap: 15px"] {
            gap: 8px !important;
          }
        }

        @media (max-width: 360px) {
          [style*="padding: 40px"][style*="backgroundColor: rgba(0,0,0,0.9)"],
          [style*="padding: 40px"][style*="backgroundColor: #EECF00"] {
            padding: 12px 6px !important;
          }

          [style*="fontSize: 24px"][style*="letterSpacing: 0.3em"] {
            font-size: 11px !important;
            margin-bottom: 6px !important;
            letter-spacing: 0.2em !important;
          }

          [style*="fontSize: 14px"][style*="letterSpacing: 0.1em"] {
            font-size: 9px !important;
            letter-spacing: 0.05em !important;
          }

          [style*="gap: 15px"] {
            gap: 6px !important;
          }

          [style*="borderBottom: 2px solid"] {
            padding-bottom: 6px !important;
          }
        }
      `}</style>
      {/* Enhanced gradient background for experiments page */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%)',
        zIndex: 10
      }}></div>
      
      {/* Subtle texture overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at 30% 20%, rgba(238, 207, 0, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(251, 191, 36, 0.03) 0%, transparent 50%)',
        zIndex: 11
      }}></div>

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
        paddingRight: '40px'
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

      {/* Sidebar */}
      <HomeStyleSidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        expandedSection={expandedSection}
        onExpandSection={setExpandedSection}
        pageLabel="EXPERIMENTS"
        pageLabelColor="#EECF00"
        logoSrc="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png"
        navigationItems={navigationItems}
      />

      {/* Content */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '200px',
        transform: 'translateY(-58%)',
        zIndex: 30,
        maxWidth: '480px'
      }}>
        <div style={{ 
          color: 'black', 
          fontWeight: '600',
          fontSize: 'clamp(0.9rem, 1.8vw, 1.2rem)',
          lineHeight: '1.2', 
          letterSpacing: '0.05em',
          textAlign: 'left'
        }}>
          <h1 style={{ 
            margin: '2px 0',
            backgroundColor: 'rgba(241, 239, 232, 0.38)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'inline-block',
            fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
            fontWeight: '700'
          }}>
            <span style={{ color: '#EECF00' }}>CREATIVE</span> EXPERIMENTS:
          </h1>

          {[
            '• Immersive Digital Experiences',
            '• Interactive Creative Prototypes',
            '• Boundary-Pushing Artistic Works',
            '• Innovative Technology Explorations',
          ].map((text, index) => (
            <p key={index} style={{ 
              margin: '2px 0',
              backgroundColor: 'rgba(241, 239, 232, 0.38)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'inline-block'
            }}>{text}</p>
          ))}
        </div>
        
        {/* Additional content section to demonstrate vertical scrolling */}
        <div style={{
          marginTop: '120px',
          padding: '0 20px',
          maxWidth: '600px'
        }}>
          <h2 style={{
            color: 'black',
            fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
            fontWeight: '700',
            letterSpacing: '0.2em',
            marginBottom: '30px',
            backgroundColor: 'rgba(241, 239, 232, 0.38)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'inline-block',
            padding: '8px 12px'
          }}>
            FEATURED WORKS
          </h2>
          
          {[
            {
              title: 'GOLDEN UNKNOWN',
              description: 'An immersive exploration of identity and transformation through interactive digital media.',
              tags: ['Interactive', 'Identity', 'Digital Art']
            },
            {
              title: 'BEING + RHYME',
              description: 'A poetic journey combining generative poetry with responsive visual design.',
              tags: ['Poetry', 'Generative', 'Visual']
            },
            {
              title: 'CATH3DRAL',
              description: 'Sacred geometry meets modern technology in this architectural meditation.',
              tags: ['Architecture', 'Sacred', '3D']
            }
          ].map((work, index) => (
            <div key={index} style={{
              marginBottom: '40px',
              padding: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '8px',
              border: '1px solid rgba(238, 207, 0, 0.2)'
            }}>
              <h3 style={{
                color: '#EECF00',
                fontSize: 'clamp(1rem, 1.5vw, 1.3rem)',
                fontWeight: '700',
                letterSpacing: '0.15em',
                marginBottom: '12px'
              }}>
                {work.title}
              </h3>
              <p style={{
                color: 'rgba(0, 0, 0, 0.8)',
                fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
                lineHeight: '1.6',
                marginBottom: '16px',
                letterSpacing: '0.02em'
              }}>
                {work.description}
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {work.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    color: 'rgba(0, 0, 0, 0.6)',
                    backgroundColor: 'rgba(238, 207, 0, 0.15)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    textTransform: 'uppercase'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          
          {/* Spacer to ensure footer doesn't overlap */}
          <div style={{ height: '120px' }}></div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: footerOpen ? '0' : '-290px',
        left: '0',
        right: '0',
        height: '300px',
        zIndex: 60,
        transition: 'bottom 0.5s ease-out'
      }}>
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
            {['HOME', 'EXPERIMENTS', 'UK MEMORIES', 'THOUGHTS', 'ABOUT'].map((item, index) => (
              <a key={item}
                href="#"
                onClick={
                  item === 'HOME' ? handleHomeClick :
                  item === 'UK MEMORIES' ? () => navigate('/uk-memories') :
                  undefined
                }
                onTouchEnd={(e) => {
                  e.preventDefault();
                  if (item === 'HOME') handleHomeClick(e);
                  else if (item === 'UK MEMORIES') navigate('/uk-memories');
                }}
                className={`menu-item-${index + 1} menu-link`}
                style={{
                  textDecoration: 'none',
                  fontSize: '20px',
                  fontWeight: '600',
                  letterSpacing: '0.3em',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = 'black'}
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

export default ExperimentsPage;