# Design Inspiration for yellowcircle-app

This document tracks design inspiration and references that influence the yellowcircle-app design system.

## Menu Navigation System

### Inspiration: canals-amsterdam.com
**Date Added:** November 2024
**URL:** https://canals-amsterdam.com/

#### Implemented Features:
1. **Slide-in from Right Animation**
   - Menu overlay slides in from the right side with smooth cubic-bezier easing
   - 0.5s duration with `cubic-bezier(0.4, 0, 0.2, 1)` timing function
   - Implementation: `/src/components/global/HamburgerMenu.jsx`

2. **Right-Aligned Content**
   - Full-width overlay with right-aligned menu items
   - Uses `flexbox` with `alignItems: 'flex-end'`
   - Responsive padding: `paddingRight: 'max(50px, 5vw)'`

3. **Staggered Menu Item Animation**
   - Each menu item slides in from right with delay
   - Progressive delay: `index * 0.08s` for cascade effect
   - Individual item animation: 0.5s with opacity + translateX transform

#### Technical Implementation:
```javascript
// Overlay Animation
animation: 'slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1)'

// Menu Item Stagger
animation: `slideInMenuItem 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s both`
```

#### Visual Design:
- Yellow overlay (`#EECF00`) with 96% opacity
- Backdrop blur: 12px
- Black text with white hover state
- Right-aligned text with generous letter-spacing (0.3em)

---

## Future Inspiration

_Add additional design inspirations here as the project evolves._
