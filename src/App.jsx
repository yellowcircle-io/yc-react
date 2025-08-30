import React, { useState, useEffect } from 'react';
import './App.css'

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);

  // PERFORMANCE OPTIMIZATION REMINDER: Consider memoizing circle generation
  // and using CSS animations instead of JavaScript for better performance

  // Track mouse movement and device motion for parallax effect (RESTORED)
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 40 - 20, // Range -20 to 20
        y: (e.clientY / window.innerHeight) * 40 - 20 // RESTORED Y movement
      });
    };

    const handleDeviceMotion = (e) => {
      if (e.accelerationIncludingGravity) {
        setDeviceMotion({
          x: (e.accelerationIncludingGravity.x || 0) * 2,
          y: (e.accelerationIncludingGravity.y || 0) * 2 // RESTORED Y movement
        });
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        setMousePosition({
          x: (touch.clientX / window.innerWidth) * 40 - 20,
          y: (touch.clientY / window.innerHeight) * 40 - 20 // RESTORED Y movement
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

  // Track scroll/arrow key events for revealing content
  useEffect(() => {
    const handleScroll = (e) => {
      e.preventDefault();
      const delta = e.deltaY || e.deltaX;
      setScrollOffset(prev => {
        const newOffset = Math.max(0, Math.min(200, prev + delta * 0.045)); // 10% slower
        console.log('Scroll offset:', newOffset); // Debug log
        return newOffset;
      });
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setScrollOffset(prev => {
          const newOffset = Math.min(200, prev + 9); // 10% slower
          console.log('Key scroll offset:', newOffset); // Debug log
          return newOffset;
        });
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setScrollOffset(prev => {
          const newOffset = Math.max(0, prev - 9); // 10% slower
          console.log('Key scroll offset:', newOffset); // Debug log
          return newOffset;
        });
      }
    };

    window.addEventListener('wheel', handleScroll, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Get mouse-based color for background circles (RESTORED)
  const getMouseColor = () => {
    const hue = ((mousePosition.x + 20) / 40) * 360;
    const saturation = Math.abs(mousePosition.y + 20) / 40 * 100;
    return `hsl(${hue}, ${saturation}%, 70%)`;
  };

  const parallaxX = (mousePosition.x + deviceMotion.x) * 0.2; // 60% reduction from 0.5
  const parallaxY = (mousePosition.y + deviceMotion.y) * 0.2; // 60% reduction from 0.5

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

      {/* CSS for menu animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.96; }
        }
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .menu-item-1 { animation: slideInUp 0.5s ease-out 0.1s both; }
        .menu-item-2 { animation: slideInUp 0.5s ease-out 0.2s both; }
        .menu-item-3 { animation: slideInUp 0.5s ease-out 0.3s both; }
        .menu-item-4 { animation: slideInUp 0.5s ease-out 0.4s both; }
        .menu-item-5 { animation: slideInUp 0.5s ease-out 0.5s both; }
        .menu-item-6 { animation: slideInUp 0.5s ease-out 0.6s both; }
        .menu-link:hover { background-color: white; transition: background-color 0.3s ease; }
        .subscribe-btn:hover { background-color: white !important; transition: background-color 0.3s ease; }
      `}</style>

      {/* Multi-page Background System */}
      {/* Page 1 - Reverted to original background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: scrollOffset <= 100 ? `-${scrollOffset}vw` : '-100vw', // Scrolls past sidebar
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url(https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/background_f7cdue.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 10,
        transition: 'left 0.5s ease-out'
      }}></div>

      {/* Page 2 - Updated background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: scrollOffset <= 100 ? `${100 - scrollOffset}vw` : '0vw', // Scrolls past sidebar
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url(https://res.cloudinary.com/yellowcircle-io/image/upload/v1756513503/Group_34_tfqn6y.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 11,
        transition: 'left 0.5s ease-out'
      }}></div>

      {/* Page 3 - Third background (overlay style) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: scrollOffset > 100 ? `${200 - scrollOffset}vw` : '100vw', // Starts when scroll > 100
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url(https://res.cloudinary.com/yellowcircle-io/image/upload/v1756512745/bg-3_xbayq3.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 12, // Above other backgrounds
        transition: 'left 0.5s ease-out'
      }}></div>

      {/* Scroll Progress Indicator (Placeholder/Debug) */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '15px',
        fontSize: '12px',
        zIndex: 999
      }}>
        Scroll: {Math.round(scrollOffset)}% (Use wheel/arrows) - Page {scrollOffset < 100 ? '1-2' : '3'}
      </div>

      {/* Large Yellow Circle - Moved 300px right, 100px up, reduced parallax */}
      <div style={{ 
        position: 'fixed', 
        top: `calc(20% + ${parallaxY}px)`, // 100px up from 30%
        left: `calc(38% + ${parallaxX}px)`, // 300px right from 20% 
        width: '300px', 
        height: '300px', 
        backgroundColor: '#fbbf24', 
        borderRadius: '50%', 
        zIndex: 20,
        mixBlendMode: 'multiply',
        transition: 'all 0.1s ease-out',
        boxShadow: '0 20px 60px rgba(251,191,36,0.2)'
      }}></div>

      {/* Parallax Motion Circles - Further reduced count and opacity */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 18 // Next-to-last z-level
      }}>
        {[...Array(8)].map((_, i) => { // 50% reduction from 16 to 8
          const size = 10 + Math.random() * 30;
          const baseX = Math.random() * 100;
          const baseY = Math.random() * 100;
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `calc(${baseX}% + ${parallaxX * 0.3}px)`,
              top: `calc(${baseY}% + ${parallaxY * 0.3}px)`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: getMouseColor(),
              borderRadius: '50%',
              opacity: 0.1, // Reduced to 10% opacity
              transition: 'background-color 0.3s ease'
            }}></div>
          );
        })}
      </div>

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
        <div style={{
          backgroundColor: 'black',
          padding: '10px',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <h1 style={{ 
            color: '#fbbf24', 
            fontSize: '12px', 
            fontWeight: '300', 
            letterSpacing: '0.4em',
            margin: 0
          }}>YELLOWCIRCLE</h1>
        </div>
      </nav>

      {/* 3. Left Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '4.7vw',
        maxWidth: '90px',
        height: '100vh',
        backgroundColor: 'white',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '60px'
      }}>
        
        {/* HOME text - Updated to 14px */}
        <div style={{ 
          position: 'absolute',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%) rotate(-90deg)',
          transformOrigin: 'center'
        }}>
          <span style={{ 
            color: 'black', 
            fontWeight: '600', 
            letterSpacing: '0.3em', 
            fontSize: '14px' // Updated from 11px
          }}>HOME</span>
        </div>

        {/* YC Logo */}
        <div style={{ 
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

      {/* 3. Navigation Circle - 30% bigger */}
      <div style={{ 
        position: 'fixed', 
        bottom: '50px', 
        right: '50px',
        zIndex: 50,
        width: '78px', // 30% bigger than 60px
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

      {/* 4. Text Content */}
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

      {/* 1. Hamburger Menu Button - HIGHEST Z-INDEX */}
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ 
          position: 'fixed',
          right: '50px',
          top: '40px',
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
            width: '24px', 
            height: '2px', 
            backgroundColor: 'black',
            transformOrigin: 'center',
            transform: menuOpen ? 'translate(-50%, -50%) rotate(45deg)' : 'translate(-50%, -50%) translateY(-6px)',
            transition: 'transform 0.3s ease'
          }}></div>
          <div style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '24px', 
            height: '2px', 
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
            width: '24px', 
            height: '2px', 
            backgroundColor: 'black',
            transformOrigin: 'center',
            transform: menuOpen ? 'translate(-50%, -50%) rotate(-45deg)' : 'translate(-50%, -50%) translateY(6px)',
            transition: 'transform 0.3s ease'
          }}></div>
        </div>
      </button>

      {/* 2. Full Screen Menu Overlay - Updated styling to match attached */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#EECF00',
          opacity: 0.96,
          zIndex: 90, // Removed mixBlendMode
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
            gap: '40px'
          }}>
            <a href="#" className="menu-item-1 menu-link" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500', // Updated to 500
              letterSpacing: '0.3em',
              opacity: 0.7,
              padding: '10px 20px',
              borderRadius: '4px',
              transition: 'background-color 0.3s ease'
            }}>HOME</a>
            
            <a href="#" className="menu-item-2 menu-link" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500', // Updated to 500
              letterSpacing: '0.3em',
              opacity: 0.7,
              padding: '10px 20px',
              borderRadius: '4px',
              transition: 'background-color 0.3s ease'
            }}>EXPERIMENTS</a>
            
            <a href="#" className="menu-item-3 menu-link" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500', // Updated to 500
              letterSpacing: '0.3em',
              opacity: 0.7,
              padding: '10px 20px',
              borderRadius: '4px',
              transition: 'background-color 0.3s ease'
            }}>THOUGHTS</a>
            
            <a href="#" className="menu-item-4 menu-link" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '500', // Updated to 500
              letterSpacing: '0.3em',
              opacity: 0.7,
              padding: '10px 20px',
              borderRadius: '4px',
              transition: 'background-color 0.3s ease'
            }}>ABOUT</a>
            
            <div className="menu-item-5" style={{
              backgroundColor: 'rgba(0,0,0,0.1)',
              padding: '15px 40px',
              borderRadius: '4px'
            }}>
              <a href="#" className="menu-link" style={{
                color: 'black',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500', // Updated to 500
                letterSpacing: '0.3em',
                padding: '5px 10px',
                borderRadius: '4px',
                transition: 'background-color 0.3s ease'
              }}>PROJECTS</a>
            </div>
            
            <div className="menu-item-6 subscribe-btn" style={{
              border: '2px solid black',
              padding: '15px 40px',
              borderRadius: '4px',
              transition: 'background-color 0.3s ease'
            }}>
              <a href="#" style={{
                color: 'black',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '500', // Updated to 500
                letterSpacing: '0.3em'
              }}>SUBSCRIBE</a>
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