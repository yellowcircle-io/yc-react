import React, { useState, useEffect } from 'react';
import './App.css'

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse movement for parallax effect on large circle
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10, // Range: -10 to 10
        y: (e.clientY / window.innerHeight) * 20 - 10
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      backgroundColor: '#f5f5f5', 
      position: 'relative', 
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, sans-serif'
    }}>

      {/* Top Navigation Bar */}
      <nav style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '100px', // Account for sidebar width
        paddingRight: '40px'
      }}>
        {/* Centered YELLOWCIRCLE logo with black background */}
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
        
        {/* Hamburger menu - right aligned with small circle */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ 
            position: 'absolute',
            right: '50px', // Same distance as small circle
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            zIndex: 100
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ width: '24px', height: '2px', backgroundColor: 'black' }}></div>
            <div style={{ width: '24px', height: '2px', backgroundColor: 'black' }}></div>
            <div style={{ width: '24px', height: '2px', backgroundColor: 'black' }}></div>
          </div>
        </button>
      </nav>

      {/* Left Sidebar - max-width 100px */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100px',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        
        {/* HOME text - top aligned with padding */}
        <div style={{ 
          paddingTop: '120px',
          transform: 'rotate(-90deg)',
          transformOrigin: 'center'
        }}>
          <span style={{ 
            color: 'black', 
            fontWeight: '300', 
            letterSpacing: '0.3em', 
            fontSize: '11px'
          }}>HOME</span>
        </div>

        {/* Copyright logo - center aligned */}
        <div style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '2px solid black', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <span style={{ color: 'black', fontSize: '10px', fontWeight: '300' }}>©</span>
          </div>
        </div>
      </div>

      {/* Main Content Area - starts after sidebar */}
      <div style={{ 
        marginLeft: '100px',
        height: '100vh',
        width: 'calc(100vw - 100px)',
        backgroundColor: 'black',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background texture/pattern overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 40%, rgba(40,40,40,0.8) 0%, rgba(0,0,0,0.9) 60%), linear-gradient(135deg, rgba(20,20,20,0.8) 0%, rgba(0,0,0,1) 100%)'
        }}>
          
          {/* Ornate decorative elements */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '40px',
            right: '40px',
            height: '120px'
          }}>
            {/* Circular ornamental patterns */}
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${20 + i * 80}px`,
                top: `${10 + (i % 2) * 40}px`,
                width: `${15 + i * 3}px`,
                height: `${15 + i * 3}px`,
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '50%',
                opacity: 0.7
              }}></div>
            ))}
            
            {/* Decorative dots */}
            {[...Array(30)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${Math.random() * 500}px`,
                top: `${Math.random() * 100}px`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: '50%'
              }}></div>
            ))}
          </div>

          {/* Jewelry/chain patterns */}
          <div style={{
            position: 'absolute',
            right: '40px',
            top: '25%',
            bottom: '25%',
            width: '150px'
          }}>
            {[...Array(5)].map((_, chainIndex) => (
              <div key={chainIndex} style={{
                position: 'absolute',
                left: `${chainIndex * 25}px`,
                top: 0,
                bottom: 0
              }}>
                {[...Array(15)].map((_, beadIndex) => (
                  <div key={beadIndex} style={{
                    position: 'absolute',
                    top: `${beadIndex * 20}px`,
                    width: '6px',
                    height: '6px',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    borderRadius: '50%',
                    boxShadow: '0 0 4px rgba(255,255,255,0.2)'
                  }}></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Large Yellow Circle - Parallax Effect, Second Highest Z-Index */}
      <div style={{ 
        position: 'fixed', 
        top: '30%', 
        left: '20%',
        width: '300px', 
        height: '300px', 
        backgroundColor: '#fbbf24', 
        borderRadius: '50%', 
        zIndex: 70,
        mixBlendMode: 'multiply',
        transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
        transition: 'transform 0.1s ease-out',
        background: 'radial-gradient(circle at 30% 30%, #fcd34d 0%, #f59e0b 40%, #d97706 100%)',
        boxShadow: '0 20px 60px rgba(251,191,36,0.2)'
      }}>
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          right: '40px',
          bottom: '40px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)'
        }}></div>
      </div>

      {/* Text Content - Highest Z-Index, Bottom Left */}
      <div style={{
        position: 'fixed',
        bottom: '50px',
        left: '200px',
        zIndex: 90,
        maxWidth: '300px'
      }}>
        <div style={{ 
          color: 'black', 
          fontWeight: '400', 
          fontSize: '14px', 
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

      {/* Small Navigation Circle - Bottom Right */}
      <div style={{ 
        position: 'fixed', 
        bottom: '50px', 
        right: '50px',
        zIndex: 80
      }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          backgroundColor: '#fbbf24', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(251,191,36,0.3)',
          background: 'radial-gradient(circle at 30% 30%, #fcd34d 0%, #f59e0b 70%)'
        }}>
          {/* Downward Chevron */}
          <svg style={{ width: '16px', height: '16px', color: 'black' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Full Screen Menu Overlay */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#fbbf24',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, #fcd34d 0%, #f59e0b 100%)'
        }}>
          {/* Close Button */}
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'absolute',
              top: '40px',
              right: '40px',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '30px',
              color: 'black',
              cursor: 'pointer',
              width: '40px',
              height: '40px'
            }}
          >
            ×
          </button>

          {/* Menu Items */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '40px'
          }}>
            <a href="#" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '300',
              letterSpacing: '0.3em',
              opacity: 0.7,
              transition: 'opacity 0.3s'
            }}>HOME</a>
            
            <a href="#" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '300',
              letterSpacing: '0.3em',
              opacity: 0.7,
              transition: 'opacity 0.3s'
            }}>EXPERIMENTS</a>
            
            <a href="#" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '300',
              letterSpacing: '0.3em',
              opacity: 0.7,
              transition: 'opacity 0.3s'
            }}>THOUGHTS</a>
            
            <a href="#" style={{
              color: 'black',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '300',
              letterSpacing: '0.3em',
              opacity: 0.7,
              transition: 'opacity 0.3s'
            }}>ABOUT</a>
            
            {/* Projects button with background */}
            <div style={{
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
            
            {/* Subscribe button with border */}
            <div style={{
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