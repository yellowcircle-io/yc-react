import React from 'react';
import './App.css'

function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6', 
      position: 'relative', 
      overflow: 'hidden' 
    }}>
      {/* Navigation */}
      <nav style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 50, 
        padding: '24px' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          {/* Left side navigation text */}
          <div style={{ 
            transform: 'rotate(-90deg) translateY(20px) translateX(16px)', 
            transformOrigin: 'left' 
          }}>
            <span style={{ 
              color: 'black', 
              fontWeight: '300', 
              letterSpacing: '0.2em', 
              fontSize: '14px' 
            }}>HOME</span>
          </div>
          
          {/* Logo */}
          <div style={{ 
            position: 'absolute', 
            top: '24px', 
            left: '50%', 
            transform: 'translateX(-50%)' 
          }}>
            <h1 style={{ 
              color: 'black', 
              fontSize: '14px', 
              fontWeight: '300', 
              letterSpacing: '0.3em',
              margin: 0 
            }}>YELLOWCIRCLE</h1>
          </div>
          
          {/* Hamburger menu */}
          <button style={{ padding: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ width: '24px', height: '2px', backgroundColor: 'black' }}></div>
              <div style={{ width: '24px', height: '2px', backgroundColor: 'black' }}></div>
              <div style={{ width: '24px', height: '2px', backgroundColor: 'black' }}></div>
            </div>
          </button>
        </div>
      </nav>

      {/* Main content container */}
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Left section with text */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '48px' 
        }}>
          <div style={{ maxWidth: '400px' }}>
            <div style={{ 
              color: 'black', 
              fontWeight: '300', 
              fontSize: '14px', 
              lineHeight: '1.6', 
              letterSpacing: '0.05em' 
            }}>
              <p style={{ margin: '4px 0' }}>VIVAMUS SAGITTIS LACUS VEL</p>
              <p style={{ margin: '4px 0' }}>AUGUE LAOREET RUTRUM</p>
              <p style={{ margin: '4px 0' }}>FAUCIBUS DOLOR AUCTOR.</p>
              <p style={{ margin: '4px 0' }}>AENEAN EU LEO QUAM.</p>
              <p style={{ margin: '4px 0' }}>PELLENTESQUE ORNARE SEM</p>
              <p style={{ margin: '4px 0' }}>LACINIA QUAM VENENATIS</p>
              <p style={{ margin: '4px 0' }}>VESTIBULUM. DONEC</p>
            </div>
          </div>
        </div>

        {/* Right section with image and decorative elements */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Main image placeholder */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'black' 
          }}>
            {/* Model silhouette overlay */}
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.8), rgba(0,0,0,0.6))' 
            }}>
              {/* Decorative pattern overlays */}
              <div style={{ 
                position: 'absolute', 
                top: '80px', 
                right: '80px', 
                width: '128px', 
                height: '128px', 
                opacity: 0.3 
              }}>
                {/* Ornamental pattern 1 */}
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: '2px solid rgba(255,255,255,0.2)', 
                  borderRadius: '50%', 
                  position: 'relative' 
                }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    left: '16px', 
                    right: '16px', 
                    bottom: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '50%' 
                  }}></div>
                  <div style={{ 
                    position: 'absolute', 
                    top: '32px', 
                    left: '32px', 
                    right: '32px', 
                    bottom: '32px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '50%' 
                  }}></div>
                </div>
              </div>
              
              {/* Decorative dots pattern */}
              <div style={{ 
                position: 'absolute', 
                top: '128px', 
                right: '160px', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '8px' 
              }}>
                {[...Array(16)].map((_, i) => (
                  <div key={i} style={{ 
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    borderRadius: '50%' 
                  }}></div>
                ))}
              </div>
              
              {/* Jewelry chain simulation */}
              <div style={{ 
                position: 'absolute', 
                bottom: '160px', 
                right: '128px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '4px' 
              }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: '4px' }}>
                    {[...Array(6)].map((_, j) => (
                      <div key={j} style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: 'rgba(255,255,255,0.4)', 
                        borderRadius: '50%' 
                      }}></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Yellow circle accent */}
          <div style={{ 
            position: 'absolute', 
            top: '33%', 
            left: '25%', 
            width: '192px', 
            height: '192px', 
            backgroundColor: '#facc15', 
            borderRadius: '50%', 
            opacity: 0.9, 
            zIndex: 10 
          }}>
            {/* Inner texture pattern */}
            <div style={{ 
              position: 'absolute', 
              top: '32px', 
              left: '32px', 
              right: '32px', 
              bottom: '32px', 
              background: 'linear-gradient(to bottom right, #fde047, #eab308)', 
              borderRadius: '50%' 
            }}>
              <div style={{ 
                position: 'absolute', 
                top: '16px', 
                left: '16px', 
                right: '16px', 
                bottom: '16px', 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                borderRadius: '50%' 
              }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decorative elements */}
      <div style={{ position: 'absolute', bottom: '32px', left: '32px' }}>
        {/* Copyright or brand mark */}
        <div style={{ 
          width: '48px', 
          height: '48px', 
          border: '2px solid black', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <span style={{ color: 'black', fontSize: '12px', fontWeight: '300' }}>©</span>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '32px', right: '32px' }}>
        {/* Navigation arrow/button */}
        <div style={{ 
          width: '64px', 
          height: '64px', 
          backgroundColor: '#facc15', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <svg style={{ width: '24px', height: '24px', color: 'black' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Additional decorative elements scattered across the page */}
      <div style={{ 
        position: 'absolute', 
        top: '25%', 
        left: '33%', 
        width: '16px', 
        height: '16px', 
        backgroundColor: 'rgba(255,255,255,0.3)', 
        borderRadius: '50%' 
      }}></div>
      <div style={{ 
        position: 'absolute', 
        top: '66%', 
        left: '25%', 
        width: '24px', 
        height: '24px', 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        borderRadius: '50%' 
      }}></div>
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        right: '33%', 
        width: '12px', 
        height: '12px', 
        backgroundColor: 'rgba(250,204,21,0.4)', 
        borderRadius: '50%' 
      }}></div>
      
      {/* Ornamental border elements */}
      <div style={{ 
        position: 'absolute', 
        top: '160px', 
        right: '80px', 
        width: '64px', 
        height: '4px', 
        backgroundColor: 'rgba(255,255,255,0.2)' 
      }}></div>
      <div style={{ 
        position: 'absolute', 
        top: '240px', 
        right: '64px', 
        width: '4px', 
        height: '64px', 
        backgroundColor: 'rgba(255,255,255,0.2)' 
      }}></div>
    </div>
  );
}

function App() {
  return <HomePage />;
}

export default App;