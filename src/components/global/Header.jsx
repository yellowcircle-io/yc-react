import React from 'react';

/**
 * Header - yellowCIRCLE navigation bar
 * Matches HomePage.jsx lines 941-980 exactly
 */
function Header({ onHomeClick }) {
  const handleHomeClick = (e) => {
    e.preventDefault();
    if (onHomeClick) onHomeClick(e);
  };

  return (
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
      paddingRight: '40px',
      transform: 'translateY(0)',
      transition: 'none'
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
  );
}

export default Header;
