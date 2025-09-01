import React, { useState, useEffect, useRef, useCallback } from 'react';

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

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

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, []);

  // Consolidated scroll and keyboard handling
  useEffect(() => {
    const updateScrollOffset = (delta) => {
      setScrollOffset(prev => Math.max(0, Math.min(200, prev + delta)));
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) 
        ? e.deltaX * 0.08 
        : e.deltaY * 0.025;
      updateScrollOffset(delta);
    };

    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          updateScrollOffset(9);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          updateScrollOffset(-9);
          break;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Optimized touch handling
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touchStartRef.current.x - touch.clientX;
        const deltaY = touchStartRef.current.y - touch.clientY;
        
        const scrollDelta = Math.abs(deltaX) > Math.abs(deltaY) 
          ? deltaX * 0.5 
          : deltaY * 0.3;
        
        if (Math.abs(scrollDelta) > 0.5) {
          setScrollOffset(prev => Math.max(0, Math.min(200, prev + scrollDelta)));
          touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const parallaxX = (mousePosition.x + deviceMotion.x) * 0.6;
  const parallaxY = (mousePosition.y + deviceMotion.y) * 0.6;

  const handleHomeClick = (e) => {
    e.preventDefault();
    setScrollOffset(0);
    setMenuOpen(false);
  };

  // Reusable navigation item component
  const NavigationItem = ({ icon, label, subItems, itemKey }) => (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: sidebarOpen ? 'flex-start' : 'center',
        padding: '20px 0',
        cursor: 'pointer',
        position: 'relative',
        width: '100%'
      }}
      onMouseEnter={() => setHoveredItem(itemKey)}
      onMouseLeave={() => setHoveredItem(null)}
      onClick={() => {
        if (!sidebarOpen) {
          setSidebarOpen(true);
        } else {
          setExpandedSection(expandedSection === itemKey ? null : itemKey);
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src={icon}
          alt={label}
          width="24" 
          height="24" 
          style={{ flexShrink: 0 }}
        />
        {sidebarOpen && (
          <span style={{
            marginLeft: '15px',
            color: 'black',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.2em',
            opacity: sidebarOpen ? 1 : 0,
            transition: 'opacity 0.3s ease-out 0.2s'
          }}>{label}</span>
        )}
      </div>
      
      {sidebarOpen && expandedSection === itemKey && subItems && (
        <div style={{
          marginLeft: '39px',
          marginTop: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {subItems.map((item, index) => (
            <a key={index} href="#" style={{
              color: 'rgba(0,0,0,0.7)',
              fontSize: '12px',
              fontWeight: '500',
              letterSpacing: '0.1em',
              textDecoration: 'none'
            }}>{item}</a>
          ))}
        </div>
      )}
      
      {!sidebarOpen && hoveredItem === itemKey && (
        <div style={{
          position: 'absolute',
          left: '60px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: '#EECF00',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '8px 16px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.2em',
          color: 'black',
          zIndex: 1000,
          opacity: 0.96,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {label}
          <div style={{
            position: 'absolute',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '0',
            height: '0',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '6px solid #EECF00'
          }}></div>
        </div>
      )}
    </div>
  );

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
      height: '100vh', 
      width: '100vw',
      position: 'relative', 
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, sans-serif'
    }}>
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
          transition: color 1s ease-in;
        }
        .menu-link:hover { color: white !important; }
        
        .works-btn { transition: background-color 1s ease-in; }
        .works-btn:hover { background-color: rgba(0,0,0,1) !important; }
        .works-btn:hover .works-text { color: #EECF00 !important; transition: color 1s ease-in; }
        
        .contact-btn { transition: background-color 1s ease-in; }
        .contact-btn:hover { background-color: white !important; }
      `}</style>

      {/* Background System */}
      <div style={{
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
        transition: 'left 0.5s ease-out'
      }}></div>

      <div style={{
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
        transition: 'left 0.5s ease-out'
      }}></div>

      <div style={{
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
        transition: 'left 0.5s ease-out'
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
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: sidebarOpen ? '30vw' : '4.7vw',
        minWidth: '40px',
        maxWidth: sidebarOpen ? '450px' : '90px',
        height: '100vh',
        backgroundColor: 'rgba(242, 242, 242, 0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 50,
        transition: 'width 0.5s ease-out, max-width 0.5s ease-out',
      }}>
        
        {/* Sidebar Toggle */}
        <div 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute',
            top: '12px',
            left: 'calc(2.35vw)',
            minLeft: '20px',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="black" viewBox="0 0 16 16">
            <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2z"/>
            <path d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
          </svg>
        </div>
        
        {/* HOME Labels */}
        <div style={{ 
          position: 'absolute',
          top: '100px',
          left: 'calc(2.35vw)',
          minLeft: '20px',
          transform: 'translateX(-50%) rotate(-90deg)',
          transformOrigin: 'center',
          opacity: sidebarOpen ? 0 : 1,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: sidebarOpen ? 'none' : 'auto'
        }}>
          <span style={{ 
            color: 'black', 
            fontWeight: '600', 
            letterSpacing: '0.3em', 
            fontSize: '14px'
          }}>HOME</span>
        </div>
        
        <div style={{ 
          position: 'absolute',
          top: '26px',
          left: '8.5vw',
          opacity: sidebarOpen ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: sidebarOpen ? 'auto' : 'none'
        }}>
          <span style={{ 
            color: 'black', 
            fontWeight: '600', 
            letterSpacing: '0.3em', 
            fontSize: '14px'
          }}>HOME</span>
        </div>

        {/* Navigation Items */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0px'
        }}>
          {navigationItems.map((item) => (
            <NavigationItem key={item.itemKey} {...item} />
          ))}
        </div>

        {/* YC Logo */}
        <div style={{ 
          position: 'absolute',
          bottom: '20px',
          left: 'calc(2.35vw)',
          minLeft: '20px',
          transform: 'translateX(-50%)',
          width: '40px', 
          height: '40px',
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

      {/* Navigation Circle */}
      <div style={{ 
        position: 'fixed', 
        bottom: '50px', 
        right: '50px',
        zIndex: 50,
        width: '78px',
        height: '78px'
      }}>
        <img 
          src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494537/NavCircle_ioqlsr.png"
          alt="Navigation"
          style={{
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            objectFit: 'cover'
          }}
        />
      </div>

      {/* Text Content */}
      <div style={{
        position: 'fixed',
        bottom: '50px',
        left: '200px',
        zIndex: 30,
        maxWidth: '480px'
      }}>
        <div style={{ 
          color: 'black', 
          fontWeight: '600',
          fontSize: 'clamp(1rem, 1.7vw, 1.2rem)',
          lineHeight: '1.1', 
          letterSpacing: '0.05em',
          textAlign: 'left'
        }}>
          {[
            'VIVAMUS SAGITTIS LACUS VEL',
            'AUGUE LAOREET RUTRUM',
            'FAUCIBUS DOLOR AUCTOR.',
            'AENEAN EU LEO QUAM.',
            'PELLENTESQUE ORNARE SEM',
            'LACINIA QUAM VENENATIS',
            'VESTIBULUM. DONEC'
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
                onClick={item === 'HOME' ? handleHomeClick : undefined}
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
                transition: 'color 1s ease-in'
              }}>WORKS</span>
            </div>
            
            <div className="menu-button-6 contact-btn" style={{
              border: '2px solid black',
              padding: '15px 40px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
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