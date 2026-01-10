/* eslint-disable react-refresh/only-export-components */
/**
 * Theme Context for UnityNotes (and future site-wide theming)
 *
 * Features:
 * - Light/Dark/Sunset theme support
 * - Accent color customization (amber, blue, purple, green, pink, red)
 * - System preference detection (prefers-color-scheme)
 * - Real-time system preference change detection
 * - CSS custom properties applied to document.documentElement
 * - localStorage persistence
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext();

// Theme definitions
const THEMES = {
  light: {
    name: 'Light',
    background: '#ffffff',
    canvasBg: '#fafafa',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    cardBg: '#ffffff',
    dotColor: '#e5e7eb',
    minimapBg: 'rgba(255, 255, 255, 0.9)',
    minimapBorder: '#e5e7eb',
    buttonBg: '#f3f4f6',
    buttonHover: '#e5e7eb',
    inputBg: '#ffffff',
    inputBorder: '#d1d5db',
    modalBg: '#ffffff',
    overlayBg: 'rgba(0, 0, 0, 0.5)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    name: 'Dark',
    background: '#1a1a1a',
    canvasBg: '#0f0f0f',
    text: '#f3f4f6',
    textSecondary: '#9ca3af',
    border: '#374151',
    cardBg: '#262626',
    dotColor: '#374151',
    minimapBg: 'rgba(26, 26, 26, 0.9)',
    minimapBorder: '#374151',
    buttonBg: '#374151',
    buttonHover: '#4b5563',
    inputBg: '#262626',
    inputBorder: '#4b5563',
    modalBg: '#1a1a1a',
    overlayBg: 'rgba(0, 0, 0, 0.7)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
  },
  sunset: {
    name: 'Sunset',
    background: '#fef3e2',
    canvasBg: '#fdf8f0',
    text: '#78350f',
    textSecondary: '#92400e',
    border: '#fed7aa',
    cardBg: '#fffbf5',
    dotColor: '#fdba74',
    minimapBg: 'rgba(254, 243, 226, 0.9)',
    minimapBorder: '#fed7aa',
    buttonBg: '#ffedd5',
    buttonHover: '#fed7aa',
    inputBg: '#fffbf5',
    inputBorder: '#fdba74',
    modalBg: '#fef3e2',
    overlayBg: 'rgba(120, 53, 15, 0.3)',
    shadowColor: 'rgba(120, 53, 15, 0.1)',
  },
};

// Accent color definitions
const ACCENT_COLORS = {
  amber: {
    name: 'Amber',
    color: '#f59e0b',
    hover: '#d97706',
    bg: 'rgba(251, 191, 36, 0.1)',
    border: 'rgba(251, 191, 36, 0.4)',
    text: '#92400e',
  },
  blue: {
    name: 'Blue',
    color: '#3b82f6',
    hover: '#2563eb',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.4)',
    text: '#1e40af',
  },
  purple: {
    name: 'Purple',
    color: '#8b5cf6',
    hover: '#7c3aed',
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.4)',
    text: '#5b21b6',
  },
  green: {
    name: 'Green',
    color: '#10b981',
    hover: '#059669',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.4)',
    text: '#047857',
  },
  pink: {
    name: 'Pink',
    color: '#ec4899',
    hover: '#db2777',
    bg: 'rgba(236, 72, 153, 0.1)',
    border: 'rgba(236, 72, 153, 0.4)',
    text: '#be185d',
  },
  red: {
    name: 'Red',
    color: '#ef4444',
    hover: '#dc2626',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.4)',
    text: '#b91c1c',
  },
};

// localStorage keys
const STORAGE_KEYS = {
  theme: 'unity-notes-theme',
  useSystem: 'unity-notes-theme-auto',
  accent: 'unity-notes-accent',
};

// Helper to detect system preference
const getSystemPreference = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Apply CSS custom properties to document
const applyCSSCustomProperties = (themeConfig, accentConfig) => {
  const root = document.documentElement;

  // Theme properties
  root.style.setProperty('--theme-background', themeConfig.background);
  root.style.setProperty('--theme-canvas-bg', themeConfig.canvasBg);
  root.style.setProperty('--theme-text', themeConfig.text);
  root.style.setProperty('--theme-text-secondary', themeConfig.textSecondary);
  root.style.setProperty('--theme-border', themeConfig.border);
  root.style.setProperty('--theme-card-bg', themeConfig.cardBg);
  root.style.setProperty('--theme-dot-color', themeConfig.dotColor);
  root.style.setProperty('--theme-minimap-bg', themeConfig.minimapBg);
  root.style.setProperty('--theme-minimap-border', themeConfig.minimapBorder);
  root.style.setProperty('--theme-button-bg', themeConfig.buttonBg);
  root.style.setProperty('--theme-button-hover', themeConfig.buttonHover);
  root.style.setProperty('--theme-input-bg', themeConfig.inputBg);
  root.style.setProperty('--theme-input-border', themeConfig.inputBorder);
  root.style.setProperty('--theme-modal-bg', themeConfig.modalBg);
  root.style.setProperty('--theme-overlay-bg', themeConfig.overlayBg);
  root.style.setProperty('--theme-shadow-color', themeConfig.shadowColor);

  // Accent properties
  root.style.setProperty('--accent-color', accentConfig.color);
  root.style.setProperty('--accent-hover', accentConfig.hover);
  root.style.setProperty('--accent-bg', accentConfig.bg);
  root.style.setProperty('--accent-border', accentConfig.border);
  root.style.setProperty('--accent-text', accentConfig.text);
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }) {
  // Initialize from localStorage or defaults
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.theme);
      if (saved && THEMES[saved]) return saved;
    }
    return 'light';
  });

  const [useSystemPreference, setUseSystemPreference] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.useSystem);
      return saved === 'true';
    }
    return false;
  });

  const [accentColor, setAccentColorState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.accent);
      if (saved && ACCENT_COLORS[saved]) return saved;
    }
    return 'amber';
  });

  const [systemPreference, setSystemPreference] = useState(getSystemPreference);

  // Compute effective theme based on system preference setting
  const effectiveTheme = useMemo(() => {
    if (useSystemPreference) {
      return systemPreference;
    }
    return theme;
  }, [useSystemPreference, systemPreference, theme]);

  // Get current theme and accent configs
  const themeConfig = useMemo(() => THEMES[effectiveTheme], [effectiveTheme]);
  const accentConfig = useMemo(() => ACCENT_COLORS[accentColor], [accentColor]);

  // Computed values
  const isDarkMode = effectiveTheme === 'dark';

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Apply CSS custom properties whenever theme or accent changes
  useEffect(() => {
    applyCSSCustomProperties(themeConfig, accentConfig);
  }, [themeConfig, accentConfig]);

  // Theme setters with localStorage persistence
  const setTheme = useCallback((newTheme) => {
    if (!THEMES[newTheme]) return;
    setThemeState(newTheme);
    setUseSystemPreference(false);
    localStorage.setItem(STORAGE_KEYS.theme, newTheme);
    localStorage.setItem(STORAGE_KEYS.useSystem, 'false');
  }, []);

  const setAccentColor = useCallback((newAccent) => {
    if (!ACCENT_COLORS[newAccent]) return;
    setAccentColorState(newAccent);
    localStorage.setItem(STORAGE_KEYS.accent, newAccent);
  }, []);

  const enableSystemPreference = useCallback(() => {
    setUseSystemPreference(true);
    localStorage.setItem(STORAGE_KEYS.useSystem, 'true');
  }, []);

  const toggleTheme = useCallback(() => {
    const themeKeys = Object.keys(THEMES);
    const currentIndex = themeKeys.indexOf(effectiveTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setTheme(themeKeys[nextIndex]);
  }, [effectiveTheme, setTheme]);

  const value = useMemo(() => ({
    // Current state
    theme: effectiveTheme,
    themeConfig,
    accentColor,
    accentConfig,
    systemPreference,
    isUsingSystemPreference: useSystemPreference,
    isDarkMode,

    // Available options
    themes: THEMES,
    accentColors: ACCENT_COLORS,

    // Setters
    setTheme,
    setAccentColor,
    enableSystemPreference,
    toggleTheme,
  }), [
    effectiveTheme,
    themeConfig,
    accentColor,
    accentConfig,
    systemPreference,
    useSystemPreference,
    isDarkMode,
    setTheme,
    setAccentColor,
    enableSystemPreference,
    toggleTheme,
  ]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { THEMES, ACCENT_COLORS };
export default ThemeContext;
