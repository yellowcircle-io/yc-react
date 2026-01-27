/**
 * useThemedStyles - Helper hook for theme-aware styling
 *
 * Provides easy access to semantic color tokens that automatically
 * adapt to the current theme (light/dark/sunset).
 *
 * @created 2026-01-24
 *
 * Usage:
 * ```jsx
 * import { useThemedStyles } from '../hooks/useThemedStyles';
 *
 * function MyComponent() {
 *   const { colors, status, getStatusStyle, getPlatformColor } = useThemedStyles();
 *
 *   return (
 *     <div style={{ backgroundColor: colors.surface, color: colors.text.primary }}>
 *       <span style={getStatusStyle('success')}>Success!</span>
 *     </div>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SEMANTIC_COLORS, STATUS_COLORS, PLATFORM_COLORS } from '../styles/constants';

/**
 * Hook to get theme-aware styles and color utilities
 * @returns {Object} Themed styles and helper functions
 */
export function useThemedStyles() {
  const { isDarkMode, themeConfig, accentConfig } = useTheme();

  // Get semantic colors based on current theme
  const colors = useMemo(() => {
    const mode = isDarkMode ? 'dark' : 'light';
    return SEMANTIC_COLORS[mode];
  }, [isDarkMode]);

  // Status colors (consistent across themes)
  const status = useMemo(() => STATUS_COLORS, []);

  // Platform colors (consistent across themes)
  const platforms = useMemo(() => PLATFORM_COLORS, []);

  /**
   * Get inline style object for a status type
   * @param {'success' | 'error' | 'warning' | 'info'} type - Status type
   * @param {'text' | 'background' | 'badge'} variant - Style variant
   * @returns {Object} Style object
   */
  const getStatusStyle = useMemo(() => {
    return (type, variant = 'text') => {
      const color = STATUS_COLORS[type];
      if (!color) return {};

      switch (variant) {
        case 'text':
          return { color };
        case 'background':
          return {
            backgroundColor: `${color}1a`, // 10% opacity
            color,
          };
        case 'badge':
          return {
            backgroundColor: `${color}1a`,
            color,
            border: `1px solid ${color}66`, // 40% opacity
            padding: '0.25em 0.5em',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 500,
          };
        default:
          return { color };
      }
    };
  }, []);

  /**
   * Get platform brand color
   * @param {string} platform - Platform name (reddit, linkedin, etc.)
   * @returns {string | undefined} Hex color or undefined
   */
  const getPlatformColor = useMemo(() => {
    return (platform) => {
      const key = platform.toLowerCase();
      return PLATFORM_COLORS[key];
    };
  }, []);

  /**
   * Get common component styles pre-configured for current theme
   */
  const componentStyles = useMemo(() => ({
    // Card style
    card: {
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      boxShadow: `0 1px 3px ${colors.shadow}`,
    },
    // Elevated card
    cardElevated: {
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      boxShadow: `0 4px 16px ${colors.shadow}`,
    },
    // Input field
    input: {
      backgroundColor: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      color: colors.text.primary,
      padding: '8px 12px',
    },
    // Input focus (merge with input)
    inputFocus: {
      borderColor: accentConfig.color,
      outline: 'none',
      boxShadow: `0 0 0 2px ${accentConfig.bg}`,
    },
    // Modal/dialog overlay
    overlay: {
      backgroundColor: colors.overlay,
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
    },
    // Modal content
    modal: {
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      boxShadow: `0 8px 32px ${colors.shadow}`,
      padding: '24px',
    },
    // Divider/separator
    divider: {
      borderTop: `1px solid ${colors.border}`,
      margin: '16px 0',
    },
  }), [colors, accentConfig]);

  /**
   * Get text styles for different hierarchy levels
   */
  const textStyles = useMemo(() => ({
    primary: { color: colors.text.primary },
    secondary: { color: colors.text.secondary },
    tertiary: { color: colors.text.tertiary },
    accent: { color: accentConfig.color },
  }), [colors, accentConfig]);

  return {
    // Current theme state
    isDarkMode,
    themeConfig,
    accentConfig,

    // Semantic colors for current theme
    colors,

    // Status colors (always consistent)
    status,

    // Platform colors (always consistent)
    platforms,

    // Helper functions
    getStatusStyle,
    getPlatformColor,

    // Pre-built component styles
    componentStyles,

    // Text hierarchy styles
    textStyles,
  };
}

export default useThemedStyles;
