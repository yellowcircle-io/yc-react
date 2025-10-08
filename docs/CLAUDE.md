# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Development
- `npm run dev` - Start development server with Vite (runs on port 5173)
- `npm run start` - Start development server with host binding (accepts connections from all network interfaces)
- `npm run build` - Build for production using Vite
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint on the codebase

### Firebase Deployment
- Firebase hosting is configured to serve from `dist/` directory
- Deploy with `firebase deploy` (requires Firebase CLI)
- SPA routing configured with rewrites to `/index.html`

## Project Architecture

This is a React-based interactive portfolio website built with Vite and modern web technologies.

### Tech Stack
- **Frontend**: React 19.1, Vite 5.4
- **Styling**: Tailwind CSS 4.1 with inline styles for complex interactions
- **Icons**: Lucide React for UI icons
- **Deployment**: Firebase Hosting
- **Dev Tools**: Builder.io dev tools, ESLint with React plugins

### Application Structure

#### Main Application (`src/App.jsx` vs `src/App2.jsx`)
There are two main application files:
- `App.jsx` - Advanced version with sophisticated navigation circle animation, footer interactions, and true accordion sidebar
- `App2.jsx` - Simpler version with basic interactions and static navigation

**App.jsx Features (Current Advanced Version):**
- Multi-page horizontal scrolling system (3 background images)
- Dynamic navigation circle that rotates based on scroll progress (-90° to 0°)
- Collapsible footer with contact/projects sections
- True accordion sidebar navigation with smooth vertical positioning
- Advanced parallax effects using both mouse movement and device motion
- Optimized touch/swipe controls for mobile
- Hamburger menu overlay with staggered animations

#### Interactive Systems

**Navigation Circle Animation:**
- Starts at -90° rotation, animates to 0° at scroll completion
- Functions as next-page navigator and footer toggle when at end
- Smooth rotation transitions synchronized with scroll progress

**Sidebar Accordion System:**
- True accordion behavior where expanding items push others down
- Dynamic vertical positioning with `transform` and smooth transitions
- Icons, labels, and sub-items with hover tooltips when collapsed

**Multi-Input Scrolling:**
- Mouse wheel (horizontal/vertical)
- Keyboard arrows
- Touch gestures with enhanced mobile sensitivity
- Device motion/orientation (with iOS 13+ permission handling)

**Parallax System:**
- Combined mouse position and device motion for yellow circle movement
- Throttled mouse tracking at ~60fps
- Responsive calculations based on viewport dimensions

### Asset Management
- Images hosted on Cloudinary with optimized delivery
- Local assets in `src/` for development screenshots and exported designs
- Navigation icons use inline SVG for customization

### Configuration Notes
- Vite configured to accept connections from all network interfaces (useful for mobile testing)
- ESLint configured with React hooks and refresh plugins
- Modern ECMAScript features enabled (ES2020+)
- No TypeScript - uses JavaScript with JSX

### Development Workflow
Always run `npm run lint` after making changes to ensure code quality. The project uses modern React patterns with hooks and functional components exclusively.