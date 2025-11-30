import React from 'react';
import globalContent from '../../config/globalContent';

/**
 * Header - yellowCIRCLE navigation bar
 * Now driven by globalContent configuration
 * Editable via: .claude/automation/global-manager.js
 */
function Header({ onHomeClick }) {
  const handleHomeClick = (e) => {
    e.preventDefault();
    if (onHomeClick) onHomeClick(e);
  };

  // Get configuration
  const headerConfig = globalContent.header;
  const { logoText, colors, styling } = headerConfig;

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '80px',
      zIndex: 255,  // Above menu overlay (250), below hamburger button (260)
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
          backgroundColor: colors.backgroundColor,
          padding: '10px 20px',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          textDecoration: 'none',
          cursor: 'pointer'
        }}
      >
        <h1 style={{
          fontSize: styling.fontSize,
          fontWeight: styling.fontWeight,
          letterSpacing: styling.letterSpacing,
          margin: 0
        }}>
          <span style={{
            color: colors.part1Color,
            fontStyle: styling.part1Style
          }}>{logoText.part1}</span>
          <span style={{
            color: colors.part2Color
          }}>{logoText.part2}</span>
        </h1>
      </a>
    </nav>
  );
}

export default Header;
