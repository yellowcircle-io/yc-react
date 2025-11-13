/**
 * Global Design System Constants
 * Colors, typography, and spacing used across the yellowCircle app
 */

// Primary Colors
export const COLORS = {
  // Brand Colors
  yellow: '#fbbf24',        // Primary yellow (buttons, accents, H1)
  yellowTransparent: 'rgba(238, 207, 2, 0.7)',  // H1 text with transparency
  black: '#000000',          // Text, backgrounds
  white: '#FFFFFF',          // Backgrounds, text on dark
  grey: '#333333',           // Body text
  lightGrey: '#666666',      // Secondary text

  // Status Colors
  error: '#ef4444',          // Error, 404 page

  // Background Colors
  backgroundLight: 'rgba(241, 239, 232, 0.38)',  // Text background with blur
  sidebarBg: 'rgba(242, 242, 242, 0.44)',
  footerBlack: 'rgba(0,0,0,0.9)',
  footerYellow: '#EECF00',
  menuOverlay: '#EECF00'
};

// Typography Styles
export const TYPOGRAPHY = {
  // H1 - Massive display heading (like "YOUR STORY", "ABOUT", "404")
  // Matches HomePage.jsx lines 1227-1240
  h1: {
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: 'clamp(1.17rem, 18vw, 15rem)',  // HomePage exact values
    fontWeight: '900',
    lineHeight: '0.82',  // HomePage tight line height
    letterSpacing: '-5px',  // HomePage letter spacing
    margin: '-1rem 0px',
    padding: '-40px 0px'
  },

  // H1 Scaled - For longer words that would exceed viewport
  h1Scaled: {
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: 'clamp(1.17rem, 12vw, 10rem)',  // Reduced from 18vw to 12vw
    fontWeight: '900',
    lineHeight: '0.82',
    letterSpacing: '-5px',
    margin: '-1rem 0px',
    padding: '-40px 0px'
  },

  // H2 - Serif subheading (like "Deserves to be Told")
  // Matches HomePage.jsx lines 1245-1265
  h2: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 'clamp(1.17rem, 6.2vw, 3rem)',  // HomePage exact values
    fontWeight: '400',  // HomePage uses 400, not 700
    lineHeight: '1.3',
    letterSpacing: '-2px',
    margin: '3px 0'
  },

  // Container for text sections
  container: {
    color: 'black',
    fontWeight: '600',
    fontSize: 'clamp(0.855rem, 1.98vw, 1.62rem)',
    lineHeight: '1.3',
    letterSpacing: '0.05em',
    textAlign: 'left'
  },

  // Body text (smaller)
  body: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 'clamp(1rem, 2vw, 1.5rem)',
    fontWeight: '400',
    lineHeight: '1.6',
    letterSpacing: '-0.5px',
    color: COLORS.grey
  },

  // Small text
  small: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
    fontWeight: '400',
    lineHeight: '1.5',
    color: COLORS.lightGrey
  }
};

// Button Styles
export const BUTTON = {
  primary: {
    padding: '16px 40px',
    backgroundColor: COLORS.yellow,
    color: COLORS.black,
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
    textTransform: 'uppercase'
  }
};

// Effects
export const EFFECTS = {
  blur: {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  },
  blurLight: {
    backdropFilter: 'blur(1px)',
    WebkitBackdropFilter: 'blur(1px)'
  }
};

export default {
  COLORS,
  TYPOGRAPHY,
  BUTTON,
  EFFECTS
};
