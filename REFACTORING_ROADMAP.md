# YellowCircle Refactoring Roadmap

**Document:** Technical Implementation Guide  
**Status:** Ready to execute  
**Timeline:** 1 week for full implementation  
**Priority:** CRITICAL before production launch

---

## Quick Reference: Code Snippets for Refactoring

### 1. Extract useParallax Hook

**File:** `src/hooks/useParallax.js`

```javascript
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for parallax effects using mouse position and device motion
 * 
 * Returns: { parallaxX, parallaxY, mousePosition, deviceMotion }
 * 
 * Usage:
 * const { parallaxX, parallaxY } = useParallax();
 * <div style={{ transform: `translate(${parallaxX}px, ${parallaxY}px)` }} />
 */
export const useParallax = (options = {}) => {
  const {
    mouseMultiplier = 60,
    mouseBias = 20,
    motionMultiplier = 20,
    finalMultiplier = 0.6,
    enableDeviceMotion = true
  } = options;

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0 });

  // Mouse movement tracking
  const handleMouseMove = useCallback((e) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * mouseMultiplier - mouseBias,
      y: (e.clientY / window.innerHeight) * (mouseMultiplier * 0.67) - (mouseBias * 0.67)
    });
  }, [mouseMultiplier, mouseBias]);

  useEffect(() => {
    let timeoutId;
    const throttledMouseMove = (e) => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleMouseMove(e);
        timeoutId = null;
      }, 16); // ~60fps
    };

    window.addEventListener('mousemove', throttledMouseMove);
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleMouseMove]);

  // Device motion tracking
  useEffect(() => {
    if (!enableDeviceMotion) return;

    const handleDeviceOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        setDeviceMotion({
          x: Math.max(-20, Math.min(20, (e.gamma / 90) * motionMultiplier)),
          y: Math.max(-20, Math.min(20, (e.beta / 180) * motionMultiplier))
        });
      }
    };

    const handleDeviceMotionEvent = (e) => {
      if (e.accelerationIncludingGravity) {
        const acc = e.accelerationIncludingGravity;
        if (acc.x !== null && acc.y !== null) {
          setAccelerometerData({
            x: Math.max(-20, Math.min(20, (acc.x / 2) * -1)),
            y: Math.max(-20, Math.min(20, (acc.y / 2) * -1))
          });
        }
      }
    };

    const requestDevicePermissions = () => {
      if ('DeviceOrientationEvent' in window) {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          DeviceOrientationEvent.requestPermission()
            .then(response => {
              if (response === 'granted') {
                window.addEventListener('deviceorientation', handleDeviceOrientation);
              }
            })
            .catch(() => {});
        } else {
          window.addEventListener('deviceorientation', handleDeviceOrientation);
        }
      }

      if ('DeviceMotionEvent' in window) {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          DeviceMotionEvent.requestPermission()
            .then(response => {
              if (response === 'granted') {
                window.addEventListener('devicemotion', handleDeviceMotionEvent);
              }
            })
            .catch(() => {});
        } else {
          window.addEventListener('devicemotion', handleDeviceMotionEvent);
        }
      }
    };

    requestDevicePermissions();

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('devicemotion', handleDeviceMotionEvent);
    };
  }, [enableDeviceMotion, motionMultiplier]);

  // Combine motion data
  const combinedDeviceMotion = {
    x: deviceMotion.x + (accelerometerData.x * 0.3),
    y: deviceMotion.y + (accelerometerData.y * 0.3)
  };

  const parallaxX = (mousePosition.x + combinedDeviceMotion.x) * finalMultiplier;
  const parallaxY = (mousePosition.y + combinedDeviceMotion.y) * finalMultiplier;

  return {
    parallaxX,
    parallaxY,
    mousePosition,
    deviceMotion: combinedDeviceMotion
  };
};
```

**Before (HomePage.jsx):** 242 lines  
**After:** 5 lines in component
```javascript
const { parallaxX, parallaxY } = useParallax();
<div style={{ top: `calc(20% + ${parallaxY}px)`, left: `calc(38% + ${parallaxX}px)` }} />
```

---

### 2. Extract useDeviceMotion Hook

**File:** `src/hooks/useDeviceMotion.js`

```javascript
import { useState, useEffect } from 'react';

/**
 * Handles device orientation and motion events with permission handling
 * Returns: { motion, permission, error }
 */
export const useDeviceMotion = () => {
  const [motion, setMotion] = useState({ x: 0, y: 0 });
  const [permission, setPermission] = useState('pending');
  const [error, setError] = useState(null);

  useEffect(() => {
    const requestPermission = async () => {
      try {
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
          const result = await DeviceOrientationEvent.requestPermission();
          setPermission(result);
          return result === 'granted';
        }
        setPermission('granted');
        return true;
      } catch (err) {
        setError(err);
        setPermission('denied');
        return false;
      }
    };

    const handleOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        setMotion({
          x: Math.max(-30, Math.min(30, e.gamma || 0)),
          y: Math.max(-30, Math.min(30, e.beta ? e.beta - 90 : 0))
        });
      }
    };

    const initPermissions = async () => {
      const granted = await requestPermission();
      if (granted) {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    initPermissions();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return { motion, permission, error };
};
```

---

### 3. Create Shared Sidebar Component

**File:** `src/components/Sidebar.jsx`

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Shared Sidebar Component
 * 
 * Props:
 * - isOpen: boolean
 * - onToggle: function
 * - navigationItems: array of { icon, label, itemKey, subItems }
 * - theme: object with colors and styling
 */
export const Sidebar = ({ isOpen, onToggle, navigationItems, theme = {} }) => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);

  const defaultTheme = {
    backgroundColor: 'rgba(242, 242, 242, 0.44)',
    labelColor: 'black',
    accentColor: '#EECF00',
    closedWidth: '80px',
    openWidth: 'min(max(280px, 35vw), 472px)',
    ...theme
  };

  const toggleSection = (itemKey) => {
    setExpandedSection(expandedSection === itemKey ? null : itemKey);
  };

  const handleNavigation = (path) => {
    navigate(path);
    // Don't close sidebar automatically - let parent control it
  };

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: isOpen ? defaultTheme.openWidth : defaultTheme.closedWidth,
      height: '100vh',
      backgroundColor: defaultTheme.backgroundColor,
      backdropFilter: 'blur(8px)',
      zIndex: 50,
      transition: 'width 0.5s ease-out',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Toggle Button */}
      <div onClick={onToggle} style={{ 
        flexShrink: 0,
        height: '140px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '40px',
          transform: 'translateX(-50%)',
          cursor: 'pointer',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Hamburger SVG here */}
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '20px 0'
      }}>
        {navigationItems.map((item, idx) => (
          <SidebarItem
            key={item.itemKey}
            item={item}
            isOpen={isOpen}
            isExpanded={expandedSection === item.itemKey}
            onToggle={() => toggleSection(item.itemKey)}
            onNavigate={handleNavigation}
            theme={defaultTheme}
          />
        ))}
      </nav>

      {/* Logo Footer */}
      <div style={{ flexShrink: 0, height: '85px', position: 'relative' }}>
        {/* Logo here */}
      </div>
    </div>
  );
};

const SidebarItem = ({ item, isOpen, isExpanded, onToggle, onNavigate, theme }) => {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 8px 10px 0',
        width: '100%',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer'
      }}
    >
      {/* Item content */}
    </button>
  );
};

export default Sidebar;
```

---

### 4. Centralize Theme Constants

**File:** `src/constants/theme.js`

```javascript
export const THEME = {
  colors: {
    primary: '#EECF00',
    black: '#000000',
    white: '#FFFFFF',
    darkGray: 'rgba(0, 0, 0, 0.9)',
    lightGray: 'rgba(242, 242, 242, 0.44)',
    transparent: 'rgba(0, 0, 0, 0)',
    
    // Page-specific accents
    purple: '#8b5cf6',    // About
    green: '#22c55e',     // Works
    orange: '#f59e0b',    // Default
  },

  zIndex: {
    background: -1000,
    content: 1,
    backgroundGradient: 10,
    yellow circle: 20,
    navigationBar: 40,
    sidebar: 50,
    navigationCircle: 50,
    footer: 60,
    menuOverlay: 90,
    hamburgerButton: 100,
  },

  animations: {
    sidebarTransition: '0.5s ease-out',
    parallaxTransition: '0.1s ease-out',
    fadeIn: '0.3s ease-out',
    slideInStagger: '0.4s ease-out',
    buttonFadeIn: '0.4s ease-out',
    menuTransition: '0.3s ease',
    footerTransition: '0.5s ease-out',
  },

  spacing: {
    sidebarClosed: '80px',
    sidebarOpen: 'min(max(280px, 35vw), 472px)',
    navHeight: '80px',
    footerHeight: '300px',
  },

  parallax: {
    mouseMultiplier: 60,
    mouseBias: 20,
    motionMultiplier: 20,
    finalMultiplier: 0.6,
  }
};

export const getPageTheme = (pageName) => {
  const pageThemes = {
    about: { accentColor: THEME.colors.purple },
    works: { accentColor: THEME.colors.green },
    home: { accentColor: THEME.colors.primary },
    default: { accentColor: THEME.colors.primary },
  };
  
  return pageThemes[pageName] || pageThemes.default;
};
```

---

### 5. Centralize Navigation Structure

**File:** `src/constants/navigation.js`

```javascript
export const MAIN_NAVIGATION = [
  {
    icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/history-edu_nuazpv.png",
    label: "STORIES",
    itemKey: "stories",
    subItems: [
      {
        label: "Projects",
        key: "projects",
        subItems: ["Brand Development", "Marketing Architecture", "Email Development"]
      },
      { label: "Golden Unknown", key: "golden-unknown" },
      {
        label: "Cath3dral",
        key: "cath3dral",
        subItems: ["Being + Rhyme"]
      },
      { label: "Thoughts", key: "thoughts" }
    ]
  },
  {
    icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
    label: "LABS",
    itemKey: "labs",
    subItems: [
      { label: "Home-17", key: "home-17" },
      { label: "Visual Noteboard", key: "visual-noteboard" },
      { label: "UK-Memories", key: "uk-memories" },
      { label: "Component Library", key: "component-library" }
    ]
  },
  {
    icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/face-profile_dxxbba.png",
    label: "ABOUT",
    itemKey: "about",
    subItems: []
  }
];

export const EXPERIMENTS_NAVIGATION = [
  {
    icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
    label: "EXPERIMENTS",
    itemKey: "experiments",
    subItems: ["golden unknown", "being + rhyme", "cath3dral"]
  },
  // ... other items
];

export const FOOTER_SECTIONS = {
  contact: {
    title: "CONTACT",
    items: [
      { label: "EMAIL@YELLOWCIRCLE.IO", href: "#" },
      { label: "LINKEDIN", href: "#" },
      { label: "TWITTER", href: "#" }
    ]
  },
  projects: {
    title: "PROJECTS",
    items: [
      { label: "GOLDEN UNKNOWN", href: "/experiments/golden-unknown" },
      { label: "BEING + RHYME", href: "/experiments/being-rhyme" },
      { label: "CATH3DRAL", href: "/experiments/cath3dral" },
      { label: "RHO CONSULTING", href: "#" }
    ]
  }
};
```

---

### 6. Create Global Image Constants

**File:** `src/constants/images.js`

```javascript
export const IMAGES = {
  icons: {
    stories: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/history-edu_nuazpv.png",
    labs: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
    about: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/face-profile_dxxbba.png",
    thoughts: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684385/write-book_gfaiu8.png",
  },
  logo: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png",
  navCircle: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494537/NavCircle_ioqlsr.png",
  backgrounds: {
    home1: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/background_f7cdue.png",
    home2: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756513503/Group_34_tfqn6y.png",
    home3: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756512745/bg-3_xbayq3.png",
  }
};

// Utility to get image with fallback
export const getImage = (category, name, fallback = '') => {
  return IMAGES[category]?.[name] || fallback;
};
```

---

## Refactoring Execution Plan

### Day 1: Foundation
1. Create all custom hooks (useParallax, useDeviceMotion)
2. Create constants files (theme, navigation, images)
3. Create ErrorBoundary wrapper
4. Test hooks in isolated component

### Day 2: Shared Components
1. Create Sidebar component
2. Create Footer component
3. Create NavigationCircle component
4. Create HamburgerMenu component
5. Test all components with different themes

### Day 3: Refactor HomePage
1. Replace inline parallax with useParallax hook
2. Replace inline device motion with useDeviceMotion hook
3. Replace inline sidebar with Sidebar component
4. Replace inline footer with Footer component
5. Update to use theme constants
6. Test all interactions

### Day 4: Refactor Experiment Pages
1. Apply same refactoring to ExperimentsPage
2. Apply to ThoughtsPage
3. Update navigation structure to use constants
4. Test page navigation flow

### Day 5: Refactor Tailwind Pages
1. Apply refactoring to AboutPage, WorksPage, HandsPage
2. Standardize sidebar implementation
3. Standardize footer implementation
4. Update all to use theme constants

### Day 6: Testing & QA
1. Cross-browser testing (Chrome, Safari, Firefox)
2. Mobile testing (iPhone, Android)
3. Tablet testing
4. Parallax performance check
5. Navigation flow testing
6. Event listener cleanup verification

### Day 7: Documentation & Polish
1. Add JSDoc comments to all components
2. Create component usage documentation
3. Update README with architecture
4. Deploy to staging for final review

---

## Code Review Checklist

Before merging refactored code:

- [ ] No console errors or warnings
- [ ] All event listeners properly cleaned up
- [ ] useEffect dependencies correct
- [ ] No memory leaks on page transitions
- [ ] Parallax effects smooth (60fps)
- [ ] Navigation animations consistent
- [ ] Z-index layering correct
- [ ] Responsive on all breakpoints
- [ ] Touch interactions work on mobile
- [ ] Device motion permission requests work
- [ ] Footer doesn't overlap content
- [ ] Images load with fallbacks
- [ ] No hardcoded values (use constants)
- [ ] Component prop validation
- [ ] Error boundaries catch errors
- [ ] Loading states implemented

---

## Post-Refactoring Improvements

After basic refactoring is complete:

1. **Performance:**
   - Add React.memo to components
   - Implement code splitting for pages
   - Lazy load images
   - Optimize bundle size

2. **Accessibility:**
   - Add ARIA labels
   - Keyboard navigation
   - Color contrast verification
   - Screen reader testing

3. **Testing:**
   - Unit tests for hooks
   - Component tests for UI
   - Integration tests for navigation
   - E2E tests for user flows

4. **Monitoring:**
   - Add error tracking (Sentry)
   - Add analytics
   - Performance monitoring (Lighthouse)
   - User interaction tracking

---

## Success Metrics

After refactoring:

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Total Lines | 12,000+ | 7,500 | <7,500 |
| Duplicated Lines | 4,500 | <1,000 | <500 |
| Custom Hooks | 0 | 4 | 4 |
| Shared Components | 1 | 7 | 7 |
| Test Coverage | 0% | 50% | 80% |
| Bundle Size | ? | -35% | <150KB |
| Page Load Time | ? | -20% | <3s |

