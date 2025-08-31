import React, { useState, useEffect } from 'react';

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);

  // Track mouse movement and device motion for parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 40 - 20,
        y: (e.clientY / window.innerHeight) * 40 - 20
      });
    };

    const handleDeviceMotion = (e) => {
      if (e.accelerationIncludingGravity) {
        setDeviceMotion({
          x: (e.accelerationIncludingGravity.x || 0) * 2,
          y: (e.accelerationIncludingGravity.y || 0) * 2
        });
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        setMousePosition({
          x: (touch.clientX / window.innerWidth) * 40 - 20,
          y: (touch.clientY / window.innerHeight) * 40 - 20
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('devicemotion', handleDeviceMotion);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('devicemotion', handleDeviceMotion);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Track scroll/arrow key events and touch inputs for mobile
  useEffect(() => {
    const handleScroll = (e) => {
      e.preventDefault();
      let delta = 0;
      
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        delta = e.deltaX * 0.08;
      } else {
        delta = e.deltaY * 0.025;
      }
      
      setScrollOffset(prev => {
        const newOffset = Math.max(0, Math.min(200, prev + delta));
        return newOffset;
      });
    };

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      setMousePosition({
        startX: touch.clientX,
        startY: touch.clientY,
        x: (touch.clientX / window.innerWidth) * 40 - 20,
        y: (touch.clientY / window.innerHeight) * 40 - 20
      });
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1 || e.touches.length === 2) {
        const touch = e.touches[0];
        const deltaX = (mousePosition.startX || touch.clientX) - touch.clientX;
        
        setMousePosition(prev => ({
          ...prev,
          x: (touch.clientX / window.innerWidth) * 40 - 20,
          y: (touch.clientY / window.innerHeight) * 40 - 20
        }));
        
        if (Math.abs(deltaX) > 5) {
          setScrollOffset(prev => {
            const newOffset = Math.max(0, Math.min(200, prev + deltaX * 0.1));
            return newOffset;
          });
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setScrollOffset(prev => Math.min(200, prev + 9));
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setScrollOffset(prev => Math.max(0, prev - 9));
      }
    };

    window.addEventListener('wheel', handleScroll, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mousePosition]);

  const parallaxX = (mousePosition.x + deviceMotion.x) * 0.6;
  const parallaxY = (mousePosition.y + deviceMotion.y) * 0.6;

  // Handle home navigation
  const handleHomeClick = (e) => {
    e.preventDefault();
    setScrollOffset(0);
    setMenuOpen(false);
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

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.96; }
        }
        @keyframes slideInStagger {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        @keyframes buttonFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
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
        
        /* Updated menu link hover with 1-second ease-in transition */
        .menu-link {
          color: black;
          transition: color 1s ease-in;
        }
        .menu-link:hover {
          color: white !important;
        }
        
        .works-btn {
          transition: background-color 1s ease-in;
        }
        .works-btn:hover { 
          background-color: rgba(0,0,0,1) !important; 
        }
        .works-btn:hover .works-text { 
          color: #EECF00 !important; 
          transition: color 1s ease-in; 
        }
        .contact-btn {
          transition: background-color 1s ease-in;
        }
        .contact-btn:hover { 
          background-color: white !important; 
        }
      `}</style>

      {/* Multi-page Background System */}
      {/* Page 1 */}
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

      {/* Page 2 */}
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

      {/* Page 3 */}
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
        bottom: 'calc(50px - 30px)',
        left: 'calc(200px - 80px)',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '15px',
        fontSize: '12px',
        zIndex: 999
      }}>
        Scroll: {Math.round(scrollOffset)}% (Use wheel/arrows) - Page {scrollOffset < 100 ? '1-2' : '3'}
      </div>

      {/* Large Yellow Circle with parallax */}
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

      {/* Top Navigation Bar */}
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
        {/* Wordmark - Now links to home */}
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

      {/* Left Sidebar with transition */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: sidebarOpen ? '25vw' : '4.7vw',
        maxWidth: sidebarOpen ? '400px' : '90px',
        height: '100vh',
        backgroundColor: 'white',
        zIndex: 50,
        transition: 'width 0.5s ease-out, max-width 0.5s ease-out',
      }}>
        
        {/* Sidebar Icon - Fixed position, no movement */}
        <div 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute',
            top: '30px',
            left: 'calc(2.35vw)',  // Fixed to center of closed sidebar width
            maxLeft: '45px',  // Max position when using vw
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="black" viewBox="0 0 16 16">
            <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2z"/>
            <path d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
          </svg>
        </div>
        
        {/* HOME text - Vertical (always present, fades out when sidebar opens) */}
        <div style={{ 
          position: 'absolute',
          top: '100px',
          left: 'calc(2.35vw)',  // Fixed to center of closed sidebar width
          maxLeft: '45px',
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
        
        {/* HOME text - Horizontal (always present, fades in when sidebar opens) */}
        <div style={{ 
          position: 'absolute',
          top: '40px',
          left: '100px',
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

        {/* YC Logo - Fixed position at bottom */}
        <div style={{ 
          position: 'absolute',
          bottom: '20px',
          left: 'calc(2.35vw)',  // Fixed to center of closed sidebar width
          maxLeft: '45px',
          transform: 'translateX(-50%)',
          width: '40px', 
          height: '40px',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img 
            src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png" 
            alt="YC Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
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
          lineHeight: '1.4', 
          letterSpacing: '0.05em',
          textAlign: 'left'
        }}>
          <p style={{ margin: '2px 0' }}>VIVAMUS SAGITTIS LACUS VEL</p>
          <p style={{ margin: '2px 0' }}>AUGUE LAOREET RUTRUM</p>
          <p style={{ margin: '2px 0' }}>FAUCIBUS DOLOR AUCTOR.</p>
          <p style={{ margin: '2px 0' }}>AENEAN EU LEO QUAM.</p>
          <p style={{ margin: '2px 0' }}>PELLENTESQUE ORNARE SEM</p>
          <p style={{ margin: '2px 0' }}>LACINIA QUAM VENENATIS</p>
          <p style={{ margin: '2px 0' }}>VESTIBULUM. DONEC</p>
        </div>
      </div>

      {/* Hamburger Menu Button */}
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ 
          position: 'fixed',
          right: '50px',
          top: '30px',
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
          <div style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '40px', 
            height: '3px', 
            backgroundColor: 'black',
            transformOrigin: 'center',
            transform: menuOpen ? 'translate(-50%, -50%) rotate(45deg)' : 'translate(-50%, -50%) translateY(-6px)',
            transition: 'transform 0.3s ease'
          }}></div>
          <div style={{ 
            position: 'absolute',
            top: '50%',
            left: '60%',
            width: '40px', 
            height: '3px', 
            backgroundColor: 'black',
            transformOrigin: 'center',
            transform: 'translate(-50%, -50%)',
            opacity: menuOpen ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}></div>
          <div style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '40px', 
            height: '3px', 
            backgroundColor: 'black',
            transformOrigin: 'center',
            transform: menuOpen ? 'translate(-50%, -50%) rotate(-45deg)' : 'translate(-50%, -50%) translateY(6px)',
            transition: 'transform 0.3s ease'
          }}></div>
        </div>
      </button>

      {/* Full Screen Menu Overlay */}
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
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            {/* First 4 menu items with 1-second ease-in transition */}
            <a href="#" onClick={handleHomeClick} className="menu-item-1 menu-link" style={{
              textDecoration: 'none',
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              padding: '10px 20px',
              borderRadius: '4px'
            }}>HOME</a>
            
            <a href="#" className="menu-item-2 menu-link" style={{
              textDecoration: 'none',
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              padding: '10px 20px',
              borderRadius: '4px'
            }}>EXPERIMENTS</a>
            
            <a href="#" className="menu-item-3 menu-link" style={{
              textDecoration: 'none',
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              padding: '10px 20px',
              borderRadius: '4px'
            }}>THOUGHTS</a>
            
            <a href="#" className="menu-item-4 menu-link" style={{
              textDecoration: 'none',
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              padding: '10px 20px',
              borderRadius: '4px'
            }}>ABOUT</a>
            
            {/* Works button (formerly Projects) */}
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
            
            {/* Contact button (formerly Subscribe) */}
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

function App() {
  return <HomePage />;
}

export default App;