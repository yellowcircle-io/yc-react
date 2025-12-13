/**
 * Global Design System Constants
 * Colors, typography, and spacing used across the yellowCircle app
 */

// Primary Colors
export const COLORS = {
  // Brand Colors - STANDARDIZED to rgb(251, 191, 36) / #fbbf24 (warm yellow-orange)
  yellow: 'rgb(251, 191, 36)',        // Primary brand yellow (buttons, accents, H1)
  yellowHex: '#fbbf24',               // Hex version for color pickers
  yellowTransparent: 'rgba(251, 191, 36, 0.7)',  // H1 text with transparency
  yellowLight: 'rgba(251, 191, 36, 0.15)',  // Light yellow for backgrounds
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
  footerYellow: 'rgb(238, 207, 0)',  // Brand yellow
  menuOverlay: 'rgb(238, 207, 0)'    // Brand yellow
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

// Spacing (consistent padding/margins)
export const SPACING = {
  xs: '8px',
  sm: '12px',
  md: '20px',
  lg: '30px',
  xl: '40px',
  xxl: '60px',
  section: '80px'
};

// Border styles (standardized)
export const BORDERS = {
  thin: '1px solid',
  standard: '2px solid',
  thick: '3px solid',
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  }
};

// Unity Notes specific tokens
export const UNITY = {
  // Canvas background
  canvasBg: '#0a0a0a',
  canvasDots: 'rgba(255, 255, 255, 0.03)',

  // Card styles
  card: {
    bg: 'rgba(30, 30, 30, 0.95)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderHover: 'rgba(251, 191, 36, 0.3)',
    shadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    minWidth: '200px',
    maxWidth: '320px',
  },

  // Typography rhythm - consistent vertical spacing
  typography: {
    // Card title
    title: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      lineHeight: '1.4',
      letterSpacing: '-0.01em',
      color: 'rgba(255, 255, 255, 0.95)',
      marginBottom: '8px',
    },
    // Card body text
    body: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '13px',
      fontWeight: '400',
      lineHeight: '1.5',
      letterSpacing: '0',
      color: 'rgba(255, 255, 255, 0.75)',
    },
    // Meta text (timestamps, labels)
    meta: {
      fontFamily: 'SF Mono, Monaco, "Cascadia Code", monospace',
      fontSize: '10px',
      fontWeight: '500',
      lineHeight: '1.3',
      letterSpacing: '0.02em',
      color: 'rgba(255, 255, 255, 0.45)',
      textTransform: 'uppercase',
    },
    // Node type labels
    label: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '10px',
      fontWeight: '600',
      lineHeight: '1',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
  },

  // Vertical rhythm spacing
  spacing: {
    cardPadding: '16px',
    elementGap: '8px',      // Between elements in a card
    sectionGap: '12px',     // Between sections in a card
    nodeGap: '24px',        // Between nodes on canvas
  },

  // Status bar
  statusBar: {
    bg: 'rgba(20, 20, 20, 0.9)',
    border: 'rgba(255, 255, 255, 0.1)',
  },

  // Progress colors for node limits
  progress: {
    low: '#22c55e',      // 0-50% - green
    medium: '#fbbf24',   // 50-90% - yellow
    high: '#ef4444',     // 90-100% - red
  },

  // Node type colors
  nodeTypes: {
    note: '#3b82f6',      // Blue
    photo: '#8b5cf6',     // Purple
    link: '#06b6d4',      // Cyan
    email: '#f59e0b',     // Orange
    prospect: '#10b981',  // Emerald
  },

  // Mobile breakpoints
  breakpoints: {
    mobile: 768,
    tablet: 1024,
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
  },
  shadow: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.1)',
    md: '0 4px 16px rgba(0, 0, 0, 0.2)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.3)',
    yellow: '0 4px 20px rgba(251, 191, 36, 0.3)'
  }
};

export default {
  COLORS,
  TYPOGRAPHY,
  BUTTON,
  EFFECTS,
  SPACING,
  BORDERS,
  UNITY
};
