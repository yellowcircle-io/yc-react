import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';

/**
 * Footer - Two-section footer (Contact + Projects)
 * Matches HomePage.jsx lines 1197-1439 exactly
 */
function Footer({ onFooterToggle }) {
  const navigate = useNavigate();
  const { footerOpen } = useLayout();
  const footerRef = React.useRef(null);

  const handleFooterClick = () => {
    if (!footerOpen && onFooterToggle) {
      onFooterToggle();
    }
  };

  // Close footer when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (footerOpen && footerRef.current && !footerRef.current.contains(event.target)) {
        if (onFooterToggle) {
          onFooterToggle();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [footerOpen, onFooterToggle]);

  return (
    <div
      ref={footerRef}
      style={{
        position: 'fixed',
        bottom: footerOpen ? '0' : '-290px',
        left: '0',
        right: '0',
        height: '300px',
        zIndex: 200,
        transition: 'bottom 0.5s ease-out'
      }}
    >
      {/* Full Footer Content */}
      <div
        onClick={handleFooterClick}
        className="footer-content"
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          display: 'flex',
          flexWrap: 'wrap',
          cursor: footerOpen ? 'default' : 'pointer'
        }}
      >
        {/* Contact Section */}
        <div className="footer-section footer-contact" style={{
          flex: '1 1 50%',
          minWidth: 'min(300px, 100%)',
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
            fontSize: 'clamp(18px, 4vw, 24px)',
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
              fontSize: 'clamp(11px, 2.5vw, 14px)',
              fontWeight: '500',
              letterSpacing: '0.1em',
              transition: 'color 0.3s ease',
              wordBreak: 'break-word'
            }}
            onMouseEnter={(e) => e.target.style.color = 'white'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
            >EMAIL@YELLOWCIRCLE.IO</a>

            <a href="#" style={{
              color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              fontSize: 'clamp(11px, 2.5vw, 14px)',
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
              fontSize: 'clamp(11px, 2.5vw, 14px)',
              fontWeight: '500',
              letterSpacing: '0.1em',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = 'white'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
            >TWITTER</a>
          </div>
        </div>

        {/* Projects Section */}
        <div className="footer-section footer-projects" style={{
          flex: '1 1 50%',
          minWidth: 'min(300px, 100%)',
          backgroundColor: '#EECF00',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}>
          <h2 style={{
            color: 'black',
            fontSize: 'clamp(18px, 4vw, 24px)',
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
              fontSize: 'clamp(11px, 2.5vw, 14px)',
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
              fontSize: 'clamp(11px, 2.5vw, 14px)',
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
              fontSize: 'clamp(11px, 2.5vw, 14px)',
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
              fontSize: 'clamp(11px, 2.5vw, 14px)',
              fontWeight: '500',
              letterSpacing: '0.1em',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = 'black'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
            >RHO CONSULTING</a>

            <a href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate('/uk-memories');
              }}
              style={{
              color: 'rgba(0,0,0,0.8)',
              textDecoration: 'none',
              fontSize: 'clamp(11px, 2.5vw, 14px)',
              fontWeight: '500',
              letterSpacing: '0.1em',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = 'black'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
            >TRAVEL MEMORIES</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
