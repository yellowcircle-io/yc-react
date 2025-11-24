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
  grey: '#333333',           // Body text (4.6:1 contrast on white)
  lightGrey: '#999999',      // Secondary text (8.6:1 contrast on black - WCAG AAA)
  darkGrey: '#1a1a1a',       // Subtle backgrounds

  // Accessible text colors for dark backgrounds
  textOnDark: '#e5e5e5',     // Primary text on black (13.5:1 contrast - WCAG AAA)
  textSecondaryOnDark: '#b3b3b3',  // Secondary text on black (9:1 contrast - WCAG AAA)

  // Status Colors
  error: '#ef4444',          // Error, 404 page
  success: '#22c55e',        // Success states
  warning: '#f59e0b',        // Warning states

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
    minHeight: '48px',  // Ensures 44px+ touch target with padding
    minWidth: '120px',
    backgroundColor: COLORS.yellow,
    color: COLORS.black,
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
    textTransform: 'uppercase',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none'
  },
  // Hover state
  primaryHover: {
    backgroundColor: '#f5b000',  // Darker yellow
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(251, 191, 36, 0.5)'
  },
  // Focus state (accessibility)
  primaryFocus: {
    outline: '3px solid rgba(251, 191, 36, 0.5)',
    outlineOffset: '2px'
  },
  // Active/Pressed state
  primaryActive: {
    transform: 'translateY(0)',
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)'
  },
  // Disabled state
  primaryDisabled: {
    backgroundColor: '#666',
    cursor: 'not-allowed',
    opacity: 0.6,
    boxShadow: 'none'
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
