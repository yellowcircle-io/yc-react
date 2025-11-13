# Phase 5 Visual Testing Guide

**Testing URL:** http://localhost:5173/
**Date:** November 11, 2025
**Purpose:** Visual verification of ExperimentsPage and ThoughtsPage migrations

---

## 🎯 Quick Start

1. **Open browser:** http://localhost:5173/
2. **Navigate to Experiments:** Click "Experiments" or go to `/experiments`
3. **Navigate to Thoughts:** Click "Thoughts" or go to `/thoughts`
4. **Follow visual checks below**

---

## 📸 Visual Testing - ExperimentsPage

### URL: http://localhost:5173/experiments

#### Initial View (Collapsed Sidebar)
**What you should see:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [≡]  ← Sidebar icon (left side, ~40px from left)         │
│                                                             │
│  E                                                          │
│  X                                                          │
│  P  ← "EXPERIMENTS" rotated -90° (yellow #EECF00)         │
│  E                                                          │
│  R                                                          │
│  I                                                          │
│  M                                                          │
│  E                                                          │
│  N                                                          │
│  T                                                          │
│  S                                                          │
│                                                             │
│  [◉] ← YC Logo (bottom, centered)                         │
│                                                             │
│────────────────────────────────────────────────────────────┤
│                                                             │
│         [Gradient background with yellow circle]           │
│                                                             │
│         CREATIVE EXPERIMENTS:                              │
│         • Immersive Digital Experiences                    │
│         • Interactive Creative Prototypes                  │
│         • Boundary-Pushing Artistic Works                  │
│         • Innovative Technology Explorations               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual Checks:**
- [ ] Sidebar is 80px wide (narrow)
- [ ] "EXPERIMENTS" text is rotated vertically
- [ ] "EXPERIMENTS" text is yellow (#EECF00)
- [ ] YC logo is visible at bottom
- [ ] Yellow parallax circle is visible in center
- [ ] Content is readable and not overlapped

---

#### Expanded Sidebar
**Click the sidebar icon (≡)**

**What you should see:**

```
┌────────────────────┬───────────────────────────────────────┐
│                    │                                       │
│  [≡]               │                                       │
│                    │                                       │
│  EXPERIMENTS       │                                       │
│                    │                                       │
│  [🧪] EXPERIMENTS  │   [Gradient background with          │
│      • golden...   │    yellow circle]                    │
│      • being...    │                                       │
│      • cath3dral   │   CREATIVE EXPERIMENTS:              │
│                    │   • Immersive Digital...             │
│  [📝] THOUGHTS     │                                       │
│      • blog        │                                       │
│                    │                                       │
│  [👤] ABOUT        │                                       │
│      • about me    │                                       │
│      • about yc    │                                       │
│      • contact     │                                       │
│                    │                                       │
│  [📚] WORKS        │                                       │
│      • consulting  │                                       │
│      • rho         │                                       │
│      • reddit      │                                       │
│      • cv          │                                       │
│                    │                                       │
│  [◉]               │                                       │
│                    │                                       │
└────────────────────┴───────────────────────────────────────┘
```

**Visual Checks:**
- [ ] Sidebar expands smoothly (0.5s animation)
- [ ] Sidebar is ~450px wide (max 30vw)
- [ ] All 4 navigation items visible with icons
- [ ] Icons are image-based (from Cloudinary)
- [ ] Icons are 24x24px
- [ ] "EXPERIMENTS" label is still visible at top (rotated)
- [ ] Navigation labels are uppercase
- [ ] Sub-items are indented and smaller font
- [ ] YC logo still visible at bottom

---

#### Accordion Interaction
**Click "EXPERIMENTS" navigation item**

**What you should see:**

```
│  [🧪] EXPERIMENTS ← Bold, yellow (#EECF00)
│      • golden unknown      ← Sub-items appear
│      • being + rhyme
│      • cath3dral
```

**Visual Checks:**
- [ ] "EXPERIMENTS" label becomes bold (700)
- [ ] "EXPERIMENTS" label becomes yellow (#EECF00)
- [ ] Sub-items slide down smoothly (0.3s animation)
- [ ] Sub-items have staggered animation (0.05s delay each)
- [ ] Sub-items are indented (~75px from left)
- [ ] Sub-items are gray (rgba(0,0,0,0.7))
- [ ] Font size is smaller (12px)

**Hover over sub-item:**
- [ ] Sub-item changes to yellow (#EECF00)
- [ ] Transition is smooth (0.25s)

**Click another section (e.g., "THOUGHTS"):**
- [ ] "EXPERIMENTS" section collapses
- [ ] "THOUGHTS" section expands
- [ ] Smooth accordion animation
- [ ] Items below push down correctly

---

## 📸 Visual Testing - ThoughtsPage

### URL: http://localhost:5173/thoughts

#### Initial View (Collapsed Sidebar)
**What you should see:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [≡]  ← Sidebar icon (left side)                          │
│                                                             │
│  T                                                          │
│  H  ← "THOUGHTS" rotated -90° (blue #3b82f6)             │
│  O                                                          │
│  U                                                          │
│  G                                                          │
│  H                                                          │
│  T                                                          │
│  S                                                          │
│                                                             │
│  [◉] ← YC Logo (bottom, centered)                         │
│                                                             │
│────────────────────────────────────────────────────────────┤
│                                                             │
│         [Gradient background with yellow circle]           │
│                                                             │
│         THOUGHTS & REFLECTIONS:                            │
│         • Insights from Creative Practice                  │
│         • Design Philosophy & Process                      │
│         • Technology & Human Connection                    │
│         • Building Meaningful Experiences                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual Checks:**
- [ ] Sidebar is 80px wide (identical to ExperimentsPage)
- [ ] "THOUGHTS" text is rotated vertically
- [ ] "THOUGHTS" text is BLUE (#3b82f6) ← Different from Experiments!
- [ ] YC logo is visible at bottom
- [ ] Yellow parallax circle is visible
- [ ] Content positioning matches ExperimentsPage

---

#### Expanded Sidebar
**Click the sidebar icon (≡)**

**Visual Checks:**
- [ ] Sidebar expands to same width as ExperimentsPage (~450px)
- [ ] Same navigation items (identical to ExperimentsPage)
- [ ] Same icons (identical Cloudinary images)
- [ ] "THOUGHTS" label visible at top (blue #3b82f6)
- [ ] All animations match ExperimentsPage timing

---

#### Accordion Interaction
**Click "THOUGHTS" navigation item**

**What you should see:**

```
│  [📝] THOUGHTS ← Bold, yellow (#EECF00)
│      • blog           ← Sub-item appears
```

**Visual Checks:**
- [ ] "THOUGHTS" label becomes bold (700)
- [ ] "THOUGHTS" label becomes yellow (#EECF00) ← Same as Experiments
- [ ] Single sub-item "blog" appears
- [ ] Same styling as ExperimentsPage sub-items
- [ ] Same hover behavior (yellow on hover)

---

## 📱 Mobile Testing

### Viewport: 375px (iPhone)

**Test URL:** http://localhost:5173/experiments

#### Chrome DevTools Steps:
1. Press F12 (open DevTools)
2. Press Cmd+Shift+M (Toggle Device Toolbar)
3. Select "iPhone SE" or "375px" width
4. Refresh page

**What you should see:**

```
┌───────────────────┐
│  [≡]             │
│                   │
│  E               │
│  X               │
│  P               │
│  E               │
│  R               │
│  I               │
│  M               │
│  E               │
│  N               │
│  T               │
│  S               │
│                   │
│  [◉]             │
└───────────────────┘
```

**Mobile Visual Checks:**
- [ ] Sidebar still 80px wide when collapsed
- [ ] Sidebar expands to ~112px (30vw of 375px)
- [ ] Content doesn't overlap sidebar
- [ ] No horizontal scrolling
- [ ] Touch tap works (not just click)
- [ ] Page label still visible
- [ ] Logo still visible

---

### Viewport: 768px (iPad)

**Repeat above steps with iPad dimensions**

**Visual Checks:**
- [ ] Sidebar expands to ~230px (30vw of 768px)
- [ ] More comfortable navigation
- [ ] Labels fully readable
- [ ] Icons maintain size

---

## 🎨 Color Verification

### ExperimentsPage
- [ ] Page label: `#EECF00` (yellow)
- [ ] Expanded nav item: `#EECF00` (yellow)
- [ ] Sub-item hover: `#EECF00` (yellow)
- [ ] Background: Gradient with subtle yellow radial

### ThoughtsPage
- [ ] Page label: `#3b82f6` (BLUE) ← KEY DIFFERENCE
- [ ] Expanded nav item: `#EECF00` (yellow)
- [ ] Sub-item hover: `#EECF00` (yellow)
- [ ] Background: Gradient with subtle blue radial

**Important:** The ONLY color difference should be the page label!

---

## 🔄 Animation Verification

### Timing to Check:
1. **Sidebar expand/collapse:** 0.5s ease-out
2. **Accordion expand:** 0.3s ease-out
3. **Sub-item stagger:** 0.05s delay per item
4. **Hover transitions:** 0.25s ease-in-out
5. **Icon hover:** Subtle scale and rotate

### How to Verify:
- Watch sidebar expand - should be smooth, not instant
- Watch accordion - should slide down, not pop
- Watch sub-items - should appear one by one
- Hover over elements - should transition smoothly

**Red Flags:**
- ❌ Instant transitions (no animation)
- ❌ Jerky or stuttering animations
- ❌ Items appearing out of order
- ❌ Layout shifts during animation

---

## 🖱️ Interaction Testing

### Click Targets:
- [ ] **Sidebar icon:** Easy to click, ~40x40px
- [ ] **Navigation items:** Full width clickable
- [ ] **Sub-items:** Links are clickable
- [ ] **Logo:** Clickable (links to home)

### Hover States:
- [ ] **Navigation items:** Background changes to yellow tint
- [ ] **Sub-items:** Text changes to yellow
- [ ] **Icons:** Subtle scale and rotation
- [ ] **Sidebar icon:** Scales slightly on hover

### Touch Behavior (Mobile):
- [ ] **Tap highlight:** Should be transparent (no blue flash)
- [ ] **preventDefault:** Touch should not trigger default behaviors
- [ ] **Smooth scrolling:** No janky scroll on touch devices

---

## 🚨 Common Issues to Watch For

### Visual Bugs:
- [ ] Sidebar not expanding/collapsing
- [ ] Icons not loading (broken image icons)
- [ ] Text overlapping
- [ ] Layout shifts when expanding accordion
- [ ] Color incorrect (wrong yellow/blue)
- [ ] Font sizes incorrect
- [ ] Spacing inconsistent

### Functional Bugs:
- [ ] Click not working
- [ ] Accordion stuck open/closed
- [ ] Multiple sections expanded at once
- [ ] Navigation items not hovering
- [ ] Sub-items not appearing
- [ ] Sidebar toggle not responding

### Performance Issues:
- [ ] Animations stuttering
- [ ] Slow loading
- [ ] High CPU usage
- [ ] Memory leaks (after many interactions)

---

## ✅ Success Criteria

### ExperimentsPage:
- ✅ Sidebar expands/collapses smoothly
- ✅ All icons load correctly
- ✅ "EXPERIMENTS" label is yellow (#EECF00)
- ✅ Accordion works with smooth animations
- ✅ Sub-items appear with stagger
- ✅ Mobile responsive (375px, 768px)
- ✅ No console errors

### ThoughtsPage:
- ✅ Sidebar expands/collapses smoothly
- ✅ All icons load correctly
- ✅ "THOUGHTS" label is blue (#3b82f6)
- ✅ Accordion works with smooth animations
- ✅ Sub-items appear with stagger
- ✅ Mobile responsive (375px, 768px)
- ✅ No console errors

### Consistency:
- ✅ Both pages use identical sidebar width
- ✅ Both pages use identical animation timing
- ✅ Both pages use identical navigation structure
- ✅ Only difference is page label color

---

## 📊 Test Report Template

```markdown
## Visual Test Results - [Date]

**Tester:** [Your Name]
**Browser:** [Chrome/Firefox/Safari]
**Device:** [Desktop/Mobile]

### ExperimentsPage (/experiments)
- [ ] Sidebar functionality: PASS / FAIL
- [ ] Icons loading: PASS / FAIL
- [ ] Accordion behavior: PASS / FAIL
- [ ] Mobile responsive: PASS / FAIL
- [ ] Animations smooth: PASS / FAIL
- [ ] Color correct (yellow): PASS / FAIL
- **Issues found:** [None / List issues]

### ThoughtsPage (/thoughts)
- [ ] Sidebar functionality: PASS / FAIL
- [ ] Icons loading: PASS / FAIL
- [ ] Accordion behavior: PASS / FAIL
- [ ] Mobile responsive: PASS / FAIL
- [ ] Animations smooth: PASS / FAIL
- [ ] Color correct (blue): PASS / FAIL
- **Issues found:** [None / List issues]

### Overall Result
- [ ] PASS - Ready for deployment
- [ ] FAIL - Requires fixes

**Notes:** [Additional observations]
```

---

## 🎬 Next Steps After Testing

### If Tests Pass:
1. Fill out test report above
2. Take screenshots for documentation
3. Proceed with deployment (git push + firebase deploy)
4. Update WIP file with completion status

### If Tests Fail:
1. Document failed tests in detail
2. Screenshot the issues
3. Report to developer for fixes
4. Re-test after fixes applied

---

**Created:** November 11, 2025
**Version:** 1.0
**Tool:** Claude Code Phase 5 Testing
