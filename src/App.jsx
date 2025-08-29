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
        const newOffset = Math.max(0, Math.min(100, prev + delta * 0.05));
        console.log('Scroll offset:', newOffset); // Debug log
        return newOffset;
      });
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setScrollOffset(prev => {
          const newOffset = Math.min(100, prev + 10);
          console.log('Key scroll offset:', newOffset); // Debug log
          return newOffset;
        });
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setScrollOffset(prev => {
          const newOffset = Math.max(0, prev - 10);
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

  const parallaxX = mousePosition.x + deviceMotion.x;
  const parallaxY = mousePosition.y + deviceMotion.y; // RESTORED Y movement

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
      `}</style>

      {/* 7. Background Images - Proper layering */}
      {/* First Background - Default visible state */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url(https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/background_f7cdue.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 10
      }}></div>

      {/* Second Background - Slides in on scroll (higher z-index) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: `${100 - scrollOffset}vw`, // Starts off-screen right, slides in from right
        width: '100vw',
        height: '100vh',
        backgroundImage: 'url(https://res.cloudinary.com/yellowcircle-io/image/upload/v1756496373/bg2_twmvqt.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 12, // Above first background
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
        Scroll: {Math.round(scrollOffset)}% (Use wheel/arrows)
      </div>

      {/* 6. Large Yellow Circle - RESTORED full parallax movement */}
      <div style={{ 
        position: 'fixed', 
        top: `calc(30% + ${parallaxY}px)`, 
        left: `calc(20% + ${parallaxX}px)`, 
        width: '300px', 
        height: '300px', 
        backgroundColor: '#fbbf24', 
        borderRadius: '50%', 
        zIndex: 20,
        mixBlendMode: 'multiply',
        transition: 'all 0.1s ease-out',
        boxShadow: '0 20px 60px rgba(251,191,36,0.2)'
      }}></div>

      {/* 5. Parallax Motion Circles - RESTORED */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 25
      }}>
        {[...Array(40)].map((_, i) => {
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
              opacity: 0.6,
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

      {/* 3. Navigation Circle */}
      <div style={{ 
        position: 'fixed', 
        bottom: '50px', 
        right: '50px',
        zIndex: 50,
        width: '60px',
        height: '60px'
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

      {/* 2. Full Screen Menu Overlay - with blur filter */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#EECF00',
          opacity: 0.96,
          mixBlendMode: 'multiply',
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
            gap: '40px'
          }}>
            <a href="#" className="menu-item-1" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '300',
              letterSpacing: '0.3em',
              opacity: 0.7,
              transition: 'opacity 0.3s'
            }}>HOME</a>
            
            <a href="#" className="menu-item-2" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '300',
              letterSpacing: '0.3em',
              opacity: 0.7,
              transition: 'opacity 0.3s'
            }}>EXPERIMENTS</a>
            
            <a href="#" className="menu-item-3" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '300',
              letterSpacing: '0.3em',
              opacity: 0.7,
              transition: 'opacity 0.3s'
            }}>THOUGHTS</a>
            
            <a href="#" className="menu-item-4" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '300',
              letterSpacing: '0.3em',
              opacity: 0.7,
              transition: 'opacity 0.3s'
            }}>ABOUT</a>
            
            <div className="menu-item-5" style={{
              backgroundColor: 'rgba(0,0,0,0.1)',
              padding: '15px 40px',
              borderRadius: '4px'
            }}>
              <a href="#" style={{
                color: 'black',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '400',
                letterSpacing: '0.3em'
              }}>PROJECTS</a>
            </div>
            
            <div className="menu-item-6" style={{
              border: '2px solid black',
              padding: '15px 40px',
              borderRadius: '4px'
            }}>
              <a href="#" style={{
                color: 'black',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '400',
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