/**
 * Centralized theme constants for YellowCircle
 * Use these values throughout the application for consistency
 */

export const colors = {
  // Primary brand color
  yellow: '#EECF00',

  // Yellow variations for backgrounds
  yellowLight: 'rgba(238, 207, 0, 0.12)',
  yellowMedium: 'rgba(238, 207, 0, 0.08)',
  yellowFaint: 'rgba(238, 207, 0, 0.06)',
  yellowHover: 'rgba(238, 207, 0, 0.1)',

  // Text colors
  textPrimary: 'black',
  textSecondary: 'rgba(0,0,0,0.7)',
  textTertiary: 'rgba(0,0,0,0.6)',
  textLight: 'rgba(0,0,0,0.4)',

  // Background colors
  bgLight: '#F2F2F2',
  bgWhite: '#FFFFFF',
  bgOverlay: 'rgba(242, 242, 242, 0.96)',
  bgOverlayLight: 'rgba(242, 242, 242, 0.44)',
  bgOverlayHeavy: 'rgba(242, 242, 242, 0.98)',

  // Accent colors
  black: '#000000',
  white: '#FFFFFF'
};

export const typography = {
  // Font sizes
  fontSize: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    lg: '15px',
    xl: '18px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px'
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },

  // Letter spacing
  letterSpacing: {
    tight: '0.02em',
    normal: '0.03em',
    wide: '0.05em',
    wider: '0.08em',
    widest: '0.12em'
  },

  // Line heights
  lineHeight: {
    tight: '1.2',
    normal: '1.4',
    relaxed: '1.6',
    loose: '1.8'
  }
};

export const spacing = {
  // Spacing scale (in px)
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  '5xl': '48px',
  '6xl': '64px'
};

export const animation = {
  // Timing functions
  easing: {
    default: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  },

  // Durations (in seconds)
  duration: {
    fast: '0.2s',
    normal: '0.3s',
    slow: '0.4s',
    slower: '0.5s'
  },

  // Combined transition strings
  transitions: {
    color: 'color 0.2s ease-out',
    background: 'background-color 0.2s ease-out',
    transform: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    opacity: 'opacity 0.3s ease-out',
    all: 'all 0.2s ease-out'
  }
};

export const dimensions = {
  // Sidebar
  sidebar: {
    closed: '80px',
    openMin: '280px',
    openMax: '472px',
    open: 'min(max(280px, 35vw), 472px)'
  },

  // Header/Footer heights
  header: {
    height: '140px'
  },

  footer: {
    heightCollapsed: '60px',
    heightExpanded: '300px'
  },

  // Touch targets (accessibility)
  touchTarget: {
    min: '44px',
    comfortable: '48px'
  },

  // Border radius
  borderRadius: {
    sm: '3px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    full: '50%'
  }
};

export const zIndex = {
  // Z-index scale
  base: 1,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  sidebar: 1000,
  modal: 1500,
  hamburger: 2000,
  tooltip: 2500,
  notification: 3000
};

export const breakpoints = {
  // Responsive breakpoints (in px)
  mobile: 375,
  mobileLg: 425,
  tablet: 768,
  laptop: 1024,
  desktop: 1440,
  desktopLg: 1920
};

// Export default theme object
const theme = {
  colors,
  typography,
  spacing,
  animation,
  dimensions,
  zIndex,
  breakpoints
};

export default theme;
