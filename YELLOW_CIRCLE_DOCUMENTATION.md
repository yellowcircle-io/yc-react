# Yellow Circle - Interactive Portfolio Website Documentation

## Overview

Yellow Circle is a sophisticated React-based interactive portfolio website that showcases human-centered digital storytelling and brand experiences. The application features advanced animations, multi-page horizontal scrolling, and innovative interactive elements designed to create an engaging user experience.

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Core Application Components](#core-application-components)
3. [Interactive Systems](#interactive-systems)
4. [Page Structure & Content](#page-structure--content)
5. [Technology Stack](#technology-stack)
6. [Assets & Resources](#assets--resources)
7. [Development Environment](#development-environment)
8. [Deployment](#deployment)

## Project Architecture

### Tech Stack
- **Frontend Framework**: React 19.1 with functional components and hooks
- **Build Tool**: Vite 5.4 for fast development and optimized builds
- **Styling**: Tailwind CSS 4.1 with extensive inline styles for complex interactions
- **Icons**: Lucide React for consistent UI iconography
- **Routing**: React Router DOM 6.30 for multi-page navigation
- **Development Tools**: Builder.io dev tools, ESLint with React-specific configurations
- **Deployment**: Firebase Hosting with SPA routing configuration

### Application Structure

The application exists in two primary implementations:

#### 1. **App.jsx** - Advanced Interactive Version (Current Production)
This is the main, feature-rich implementation with:
- **Multi-page horizontal scrolling system** (3 background images)
- **Dynamic navigation circle** that rotates based on scroll progress (-90° to 0°)
- **Collapsible footer** with contact/projects sections
- **True accordion sidebar navigation** with smooth vertical positioning
- **Advanced parallax effects** using mouse movement and device motion
- **Optimized touch/swipe controls** for mobile devices
- **Hamburger menu overlay** with staggered animations

#### 2. **App2.jsx** - Simplified Version
A more basic implementation featuring:
- Static background with decorative elements
- Basic mouse parallax on yellow circle
- Simple sidebar navigation
- Standard menu overlay
- Ornate visual patterns and jewelry-inspired decorative elements

#### 3. **RouterApp.jsx** - Multi-Page Router System
Comprehensive routing setup with:
- Main pages: Home, Experiments, Thoughts, About, Works
- Experiment sub-routes: Golden Unknown, Being + Rhyme, Cath3dral
- Thought sub-routes: Blog
- Placeholder routes for future expansion

## Core Application Components

### Main Application Entry Point
- **File**: `src/main.jsx`
- **Purpose**: Application initialization with React StrictMode
- **Router**: Uses RouterApp.jsx for multi-page navigation

### Page Components
Located in `src/pages/`:
- **HomePage.jsx** - Enhanced version of App.jsx with React Router integration
- **ExperimentsPage.jsx** - Creative projects showcase
- **ThoughtsPage.jsx** - Blog and written content
- **AboutPage.jsx** - Company and personal information
- **WorksPage.jsx** - Professional portfolio

### Sub-page Components
#### Experiments (`src/pages/experiments/`):
- **GoldenUnknownPage.jsx** - Interactive art project
- **BeingRhymePage.jsx** - Creative writing/poetry project
- **Cath3dralPage.jsx** - 3D or architectural project

#### Thoughts (`src/pages/thoughts/`):
- **BlogPage.jsx** - Blog posts and articles

## Interactive Systems

### 1. Navigation Circle Animation
**Location**: Bottom-right corner
- **Initial State**: -90° rotation (pointing left)
- **Animation**: Rotates from -90° to 0° based on scroll progress
- **Functionality**:
  - Pages 1-2: Advances to next page
  - Page 3 (final): Toggles footer visibility
- **Visual**: Uses rotating PNG image from Cloudinary

### 2. Multi-Page Horizontal Scrolling
**Implementation**: Three background images transition horizontally
- **Page 1**: `background.png` - Initial landing view
- **Page 2**: `Group_34.png` - Secondary content view
- **Page 3**: `bg-3.png` - Final view with footer interaction
- **Scroll Progress**: 0-100% (Page 1-2), 100-200% (Page 2-3)

### 3. Sidebar Accordion System
**Location**: Left side of screen
- **Closed State**: 80px wide with centered icons
- **Open State**: Expands to min(30vw, 450px)
- **Navigation Items**:
  - **Experiments**: golden unknown, being + rhyme, cath3dral
  - **Thoughts**: blog
  - **About**: about me, about yellowcircle, contact
  - **Works**: consulting, rho, reddit, cv
- **Behavior**: True accordion where expanding items push others down vertically

### 4. Parallax System
**Components Affected**: Large yellow circle
- **Mouse Tracking**: Throttled at ~60fps for smooth performance
- **Device Motion**: iOS 13+ permission handling for orientation/accelerometer
- **Mobile Enhancement**: Combined orientation and accelerometer data
- **Calculation**: Responsive based on viewport dimensions

### 5. Multi-Input Scrolling Controls
**Supported Inputs**:
- **Mouse Wheel**: Both horizontal and vertical scrolling
- **Keyboard**: Arrow keys (Up/Down, Left/Right)
- **Touch Gestures**: Enhanced mobile sensitivity with conflict prevention
- **Device Motion**: Orientation and accelerometer support

### 6. Footer Interaction System
**States**:
- **Hidden**: -290px bottom offset (only small portion visible)
- **Expanded**: 0px bottom offset (full 300px height)
- **Sections**: Two-column layout (Contact | Projects)
- **Trigger**: Navigation circle when at final page

## Page Structure & Content

### Home Page Content
**Main Headline**: "YOUR CIRCLE FOR:"
**Value Propositions**:
- Human-Centered Digital Storytelling
- Building Engaging Brand Experiences
- Illuminating Your Unique Vision
- Delighting Audiences & Delivering Results

**Visual Elements**:
- Large animated yellow circle with parallax
- Three transitioning background images
- Dynamic navigation circle
- Glassmorphism text backgrounds

### Navigation Structure
**Primary Navigation**:
- Home (via logo click)
- Experiments (with sub-projects)
- Thoughts (blog content)
- About (company/personal info)
- Works (portfolio/CV)

**Secondary Actions**:
- Contact (via footer)
- Project links (footer projects section)

### Contact Information
**Available Channels**:
- EMAIL@YELLOWCIRCLE.IO
- LinkedIn profile
- Twitter/X profile

**Featured Projects**:
- Golden Unknown
- Being + Rhyme
- Cath3dral
- Rho Consulting

## Technology Stack

### Dependencies
**Core React**:
- react: ^19.1.0
- react-dom: ^19.1.0
- react-router-dom: ^6.30.1

**Build & Development**:
- vite: ^5.4.19
- @vitejs/plugin-react: ^4.6.0

**Styling**:
- tailwindcss: ^4.1.11
- @tailwindcss/vite: ^4.1.11
- autoprefixer: ^10.4.21

**Development Tools**:
- @builder.io/dev-tools: ^1.7.9
- eslint: ^9.30.1 with React plugins
- lucide-react: ^0.539.0

### Build Configuration
**Vite Settings**:
- Host binding: 0.0.0.0 for network access
- Port: 5173 (development)
- ES2020+ features enabled
- React refresh for hot reloading

**ESLint Configuration**:
- React hooks rules
- React refresh plugin
- Modern JavaScript standards

## Assets & Resources

### Images & Graphics
**Source**: Cloudinary CDN hosting
**Key Assets**:
- Background images: 3 sequential page backgrounds
- Navigation circle: Rotating navigation element
- YC Logo: Company branding
- Navigation icons: Experiments, thoughts, about, works
- Design mockups: Various UI state documentation

**Local Development Assets** (`src/` directory):
- Design exports and screenshots
- Navigation SVG elements
- State documentation images

### Font & Typography
**System**: Arial, sans-serif fallback
**Styling Approach**:
- Extensive letter-spacing for modern aesthetic
- Weight variations: 300, 400, 500, 600, 700
- Responsive font sizing with clamp()

### Color Palette
**Primary Colors**:
- Yellow: #EECF00, #fbbf24, #fcd34d
- Black: Various opacities for text/backgrounds
- White: High contrast elements
- Grays: rgba(242, 242, 242, 0.96) for glassmorphism

## Development Environment

### Available Scripts
```bash
npm run dev          # Start Vite development server (port 5173)
npm run start        # Start with host binding (0.0.0.0:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint code quality checks
```

### Development Features
- **Hot Module Replacement**: Instant updates during development
- **Network Access**: Host binding allows mobile device testing
- **Code Quality**: ESLint integration with React-specific rules
- **Modern Build**: ES modules and tree-shaking optimization

### File Structure
```
src/
├── App.jsx                     # Main advanced application
├── App2.jsx                    # Simplified version
├── RouterApp.jsx               # Multi-page router setup
├── main.jsx                    # Application entry point
├── pages/
│   ├── HomePage.jsx            # Router-enabled home page
│   ├── ExperimentsPage.jsx     # Creative projects
│   ├── ThoughtsPage.jsx        # Blog content
│   ├── AboutPage.jsx           # Company info
│   ├── WorksPage.jsx           # Portfolio
│   ├── experiments/            # Experiment sub-pages
│   └── thoughts/               # Thought sub-pages
└── assets/                     # Local images and exports
```

## Deployment

### Firebase Hosting
**Configuration**:
- Build directory: `dist/`
- SPA routing: Rewrites to `/index.html`
- Deploy command: `firebase deploy`

**Build Process**:
1. `npm run build` - Creates optimized production build
2. `firebase deploy` - Deploys to Firebase hosting
3. Automatic routing configuration for SPA

### Performance Optimizations
**JavaScript**:
- Code splitting and tree shaking
- Throttled event handlers (60fps mouse tracking)
- Efficient React re-renders with useCallback

**Assets**:
- Cloudinary CDN for image optimization
- WebP/modern format support
- Responsive image sizing

**Interactions**:
- Hardware-accelerated CSS transforms
- Optimized animation timing functions
- Touch event conflict prevention

## Key Features Summary

### User Experience
- **Responsive Design**: Works across desktop, tablet, and mobile
- **Progressive Enhancement**: Graceful fallbacks for unsupported features
- **Accessibility**: Keyboard navigation and screen reader considerations
- **Performance**: Optimized animations and asset loading

### Technical Innovation
- **Advanced Scrolling**: Multi-axis input handling with smooth transitions
- **Device Integration**: Motion sensors for enhanced mobile interaction
- **Modular Architecture**: Multiple app versions for different use cases
- **Modern Development**: Latest React patterns with TypeScript-ready setup

### Content Strategy
- **Brand Positioning**: Human-centered digital storytelling focus
- **Portfolio Showcase**: Multiple project categories and detailed sub-pages
- **Professional Presence**: Contact integration and social media links
- **Growth Ready**: Expandable routing and component structure

This documentation provides a comprehensive overview of the Yellow Circle application for developers, designers, LLMs, and other technical stakeholders who need to understand the application's architecture, features, and implementation details.