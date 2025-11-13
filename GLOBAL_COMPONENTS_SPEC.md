# Global Components Specification
**Date:** November 12, 2025, 8:30 PM PST
**Approach:** Option B - Theme Variations with Two-Phase Migration
**Status:** 🟢 Phase 1 In Progress

---

## Architecture Overview

### Design Philosophy

**Global components with theme support:**
- ONE component codebase
- MULTIPLE theme variations via props
- Change once, update everywhere
- Consistent behavior, variable aesthetics

### Theme System

**Supported Themes:**
1. **dark** (HomePage, Experiments, Thoughts, uk-memories)
   - Background: Dark (#0f0f0f, #1a1a1a)
   - Primary: Yellow/Gold (#EECF00, #fbbf24)
   - Accent: Orange/Amber
   - Text: White/Light gray

2. **light** (About, Works, Hands)
   - Background: Light (#f8fafc, #ffffff)
   - Primary: Purple (#8b5cf6), Green (#22c55e), Orange (#f59e0b)
   - Accent: Varies by page
   - Text: Dark gray/Black

3. **custom** (Special pages like Component Library)
   - Fully customizable via props
   - Override any theme value

---

## Global Components

### 1. ParallaxCircle Component

**File:** `src/components/global/ParallaxCircle.jsx`

**Purpose:** Background animated circle with parallax effect

**Props:**
```typescript
{
  theme?: 'dark' | 'light' | 'custom',
  color?: string,           // Override theme color
  size?: number,            // Circle diameter in px (default: 600)
  opacity?: number,         // Max opacity 0-1 (default: 0.15)
  blur?: number,            // Blur amount in px (default: 2)
  intensity?: number,       // Parallax intensity 0-1 (default: 0.6)
  enableMouse?: boolean,    // Mouse tracking (default: true)
  enableMotion?: boolean,   // Device motion (default: true)
  position?: { x: string, y: string }, // CSS position (default: 50%, 50%)
  zIndex?: number          // Z-index (default: 0)
}
```

**Theme Defaults:**
```javascript
const themeDefaults = {
  dark: {
    color: 'rgba(255, 183, 77, 0.15)',  // Yellow/gold
    gradient: 'radial-gradient(circle, rgba(255, 183, 77, 0.15) 0%, rgba(255, 183, 77, 0.05) 40%, transparent 70%)'
  },
  light: {
    color: 'rgba(139, 92, 246, 0.1)',   // Purple
    gradient: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.03) 40%, transparent 70%)'
  }
}
```

**Usage:**
```jsx
// Dark theme (HomePage)
<ParallaxCircle theme="dark" />

// Light theme (AboutPage)
<ParallaxCircle theme="light" color="rgba(139, 92, 246, 0.1)" />

// Custom (uk-memories)
<ParallaxCircle theme="custom" color="rgba(255, 215, 0, 0.2)" size={800} />
```

---

### 2. NavigationCircle Component

**File:** `src/components/global/NavigationCircle.jsx`

**Purpose:** Bottom-right navigation circle (scroll indicator / footer toggle)

**Props:**
```typescript
{
  theme?: 'dark' | 'light' | 'custom',
  rotation?: number,        // Rotation in degrees (default: -90)
  onClick?: () => void,     // Click handler (default: toggle footer)
  color?: string,           // Border/icon color
  size?: number,            // Circle size in px (default: 64)
  position?: { bottom: string, right: string }, // Position (default: 2rem, 2rem)
  icon?: 'arrow' | 'dots' | 'custom', // Icon type
  animated?: boolean,       // Enable scroll animation (default: true)
  scrollOffset?: number,    // For scroll-based rotation (0-200)
  zIndex?: number          // Z-index (default: 30)
}
```

**Theme Defaults:**
```javascript
const themeDefaults = {
  dark: {
    borderColor: '#EECF00',      // Yellow
    iconColor: '#EECF00',
    background: 'rgba(0, 0, 0, 0.8)'
  },
  light: {
    borderColor: '#8b5cf6',      // Purple (varies by page)
    iconColor: '#8b5cf6',
    background: 'rgba(255, 255, 255, 0.8)'
  }
}
```

**Usage:**
```jsx
// HomePage (scroll-based rotation)
<NavigationCircle
  theme="dark"
  scrollOffset={scrollOffset}
  animated={true}
/>

// AboutPage (static)
<NavigationCircle
  theme="light"
  color="#8b5cf6"
  onClick={() => setFooterOpen(true)}
/>
```

---

### 3. Header Component

**File:** `src/components/global/Header.jsx`

**Purpose:** Top navigation bar with branding + menu button

**Props:**
```typescript
{
  theme?: 'dark' | 'light' | 'custom',
  brandText?: string,       // Logo text (default: 'yellowCIRCLE')
  brandColor?: string,      // Brand text color
  onBrandClick?: () => void, // Click handler (default: navigate('/'))
  onMenuClick?: () => void, // Menu button click
  menuIcon?: 'hamburger' | 'dots' | 'custom',
  backgroundColor?: string, // Background color with alpha
  blur?: boolean,           // Backdrop blur (default: true)
  sticky?: boolean,         // Fixed position (default: true)
  height?: number,          // Height in px (default: 80)
  zIndex?: number,          // Z-index (default: 50)
  showShadow?: boolean     // Drop shadow (default: false)
}
```

**Theme Defaults:**
```javascript
const themeDefaults = {
  dark: {
    brandColor: '#fbbf24',           // Yellow/gold
    menuColor: '#fbbf24',
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  light: {
    brandColor: '#000000',           // Black
    menuColor: '#000000',
    backgroundColor: 'rgba(255, 255, 255, 0.8)'
  }
}
```

**Usage:**
```jsx
// HomePage
<Header theme="dark" onMenuClick={() => setMenuOpen(true)} />

// AboutPage
<Header
  theme="light"
  brandColor="#8b5cf6"
  onMenuClick={() => setSidebarOpen(true)}
/>
```

---

### 4. Sidebar Component (Already Exists!)

**File:** `src/components/global/Sidebar.jsx` (440 lines, created Nov 10)

**Enhancements Needed:**
- Add theme prop support
- Add color customization props
- Simplify for non-HomePage use cases

**Props to Add:**
```typescript
{
  theme?: 'dark' | 'light' | 'custom',
  scrollOffset?: number,        // Optional (HomePage only)
  simplified?: boolean,         // Simpler accordion (no 3-level)
  backgroundColor?: string,
  textColor?: string,
  accentColor?: string,
  iconType?: 'svg' | 'image',  // SVG inline or Cloudinary images
  navigationItems?: Array,      // Custom nav structure
  logoSrc?: string,
  position?: 'left' | 'right'  // (default: right)
}
```

---

### 5. Footer Component (Already Exists!)

**File:** `src/components/global/Footer.jsx` (194 lines, created Nov 10)

**Enhancements Needed:**
- Add theme prop support
- Add color customization props

**Props to Add:**
```typescript
{
  theme?: 'dark' | 'light' | 'custom',
  backgroundColor?: string,
  textColor?: string,
  accentColor?: string,
  sections?: Array,            // Custom footer content
  collapsible?: boolean,       // (default: true)
  defaultOpen?: boolean,
  height?: number,             // Collapsed height
  expandedHeight?: number,
  zIndex?: number
}
```

---

### 6. HamburgerMenu Component (Already Exists!)

**File:** `src/components/global/HamburgerMenu.jsx` (126 lines, created Nov 10)

**Enhancements Needed:**
- Add theme prop support
- Add color customization props

**Props to Add:**
```typescript
{
  theme?: 'dark' | 'light' | 'custom',
  isOpen: boolean,
  onClose: () => void,
  backgroundColor?: string,
  textColor?: string,
  accentColor?: string,
  menuItems?: Array,           // Custom menu structure
  animationType?: 'fade' | 'slide' | 'stagger',
  closeOnEscape?: boolean,     // (default: true)
  closeOnOutsideClick?: boolean // (default: true)
}
```

---

### 7. Layout Component (NEW - To Create)

**File:** `src/components/global/Layout.jsx`

**Purpose:** Wrapper component that includes all global elements

**Props:**
```typescript
{
  theme?: 'dark' | 'light' | 'custom',
  pageId?: string,             // For active nav highlighting
  customColors?: {
    primary?: string,
    accent?: string,
    background?: string,
    text?: string
  },
  enableParallax?: boolean,    // (default: true)
  enableNavCircle?: boolean,   // (default: true)
  enableHeader?: boolean,      // (default: true)
  enableFooter?: boolean,      // (default: true)
  scrollBehavior?: 'normal' | 'horizontal' | 'custom',
  children: React.ReactNode
}
```

**Usage:**
```jsx
// HomePage (full features, dark theme)
<Layout
  theme="dark"
  pageId="home"
  scrollBehavior="horizontal"
>
  <HomePageContent />
</Layout>

// AboutPage (light theme, purple accent)
<Layout
  theme="light"
  pageId="about"
  customColors={{ primary: '#8b5cf6' }}
>
  <AboutPageContent />
</Layout>

// uk-memories (custom theme)
<Layout
  theme="custom"
  customColors={{
    primary: '#ffd700',
    background: '#1a1a1a'
  }}
>
  <UKMemoriesContent />
</Layout>
```

---

## Theme Constants

**File:** `src/constants/theme.js` (exists, needs expansion)

### Color Palettes

```javascript
export const colors = {
  // Brand colors
  brand: {
    yellow: '#EECF00',
    yellowLight: '#fbbf24',
    yellowDark: '#d4a500',
    orange: '#f59e0b',
    purple: '#8b5cf6',
    green: '#22c55e'
  },

  // Theme palettes
  dark: {
    background: {
      primary: '#0f0f0f',
      secondary: '#1a1a1a',
      tertiary: '#2a2a2a'
    },
    text: {
      primary: '#ffffff',
      secondary: '#e5e5e5',
      tertiary: '#a3a3a3'
    },
    accent: '#EECF00'
  },

  light: {
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9'
    },
    text: {
      primary: '#000000',
      secondary: '#1e293b',
      tertiary: '#64748b'
    },
    accent: '#8b5cf6'  // Default, varies by page
  }
}

export const typography = {
  fontFamily: {
    primary: "'SF Pro Display', system-ui, sans-serif",
    secondary: "'Helvetica Neue', sans-serif",
    mono: "'SF Mono', 'Menlo', monospace"
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem'
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  }
}

export const spacing = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
  '2xl': '4rem'
}

export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  }
}

export const zIndex = {
  background: -10,
  base: 0,
  content: 10,
  overlay: 20,
  footer: 20,
  navCircle: 30,
  sidebar: 40,
  header: 50,
  menu: 60,
  modal: 70
}
```

---

## Two-Phase Migration Plan

### Phase 1: Critical Pages (Testing & Validation)

**Pages to Migrate:**
1. **uk-memories** (TimeCapsulePage)
   - Theme: custom (gold/dark)
   - Reason: Special use case, good test for custom theme

2. **404** (NotFoundPage)
   - Theme: dark
   - Reason: Simple page, low risk

3. **about** (AboutPage)
   - Theme: light (purple accent)
   - Reason: Most different from HomePage, good test for light theme

**Success Criteria:**
- All 3 pages use global components
- Theme variations work correctly
- No visual regressions
- Build successful
- User approval ✅

---

### Phase 2: Remaining Pages (After Approval)

**Pages to Migrate:**
1. **HomePage** (/)
   - Theme: dark
   - Complex: Horizontal scroll, all features

2. **WorksPage** (/works)
   - Theme: light (green accent)

3. **HandsPage** (/hands)
   - Theme: light (orange accent)

4. **ExperimentsPage** (/experiments)
   - Theme: dark

5. **ThoughtsPage** (/thoughts)
   - Theme: dark

6. **GoldenUnknownPage** (/experiments/golden-unknown)
   - Theme: dark (gold accent)

7. **BeingRhymePage** (/experiments/being-rhyme)
   - Theme: dark

8. **Cath3dralPage** (/experiments/cath3dral)
   - Theme: dark

9. **ComponentLibraryPage** (/experiments/component-library)
   - Theme: custom

10. **BlogPage** (/thoughts/blog)
    - Theme: dark

**Success Criteria:**
- ALL pages use global components
- ~4,000+ lines removed
- Bundle size reduced ~300 KB
- ONE change updates ALL pages
- True global architecture achieved

---

## Implementation Checklist

### Create Global Components
- [ ] Enhance `constants/theme.js` with full theme system
- [ ] Create `global/ParallaxCircle.jsx`
- [ ] Create `global/NavigationCircle.jsx`
- [ ] Create `global/Header.jsx`
- [ ] Create `global/Layout.jsx`
- [ ] Enhance `global/Sidebar.jsx` with theme props
- [ ] Enhance `global/Footer.jsx` with theme props
- [ ] Enhance `global/HamburgerMenu.jsx` with theme props

### Phase 1 Migration
- [ ] Migrate `pages/TimeCapsulePage.jsx` (uk-memories)
- [ ] Migrate `pages/NotFoundPage.jsx` (404)
- [ ] Migrate `pages/AboutPage.jsx` (about)
- [ ] Test all 3 pages thoroughly
- [ ] Build and verify bundle size
- [ ] Get user approval

### Phase 2 Migration (After Approval)
- [ ] Migrate HomePage
- [ ] Migrate remaining main pages (Works, Hands, Experiments, Thoughts)
- [ ] Migrate sub-pages (5 pages)
- [ ] Final testing
- [ ] Production deployment

---

## Expected Outcomes

### Code Quality
- **Duplication:** 25-30% → <5%
- **Lines removed:** ~4,000+
- **Maintainability:** 11x improvement (1 file vs 11 files)

### Performance
- **Bundle size:** 1,323 KB → ~900-1,000 KB
- **Reduction:** ~300-400 KB (25-30%)
- **Lighthouse:** Estimated 85-90/100

### Architecture
- **Global components:** TRUE ✅
- **Theme support:** Light + Dark + Custom
- **Change propagation:** ONE change → ALL pages
- **Design system:** Unified

---

**Document Created:** November 12, 2025, 8:30 PM PST
**Status:** Ready for Phase 1 implementation
**Next:** Create missing global components
