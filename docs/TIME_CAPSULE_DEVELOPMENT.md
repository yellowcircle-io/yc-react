# Time Capsule Development Process & Technical Overview

## Project Overview

The **Travel Memories Time Capsule** is an interactive, drag-and-drop photo timeline application built with React Flow. It allows users to create visual memory boards with photos, arrange them on an infinite canvas, and share them via Firebase-hosted shareable URLs.

---

## Development Phases

### Phase 1: Core Canvas & Photo System (localStorage)

**Goal**: Create a drag-and-drop photo canvas with persistent storage

**Key Features Implemented**:
- React Flow canvas for infinite draggable workspace
- Photo upload via 3 methods:
  - Local file upload (base64 encoding)
  - Direct URL input
  - Cloudinary integration (cloud hosting)
- Photo nodes with metadata (location, date, description)
- Variable photo sizes (308-440px) for visual interest
- 8-column horizontal layout with 600px spacing
- localStorage persistence for auto-save
- Zoom controls (50-250% range)
- Keyboard shortcuts (arrows for pan, +/- for zoom, 0 for center)

**Technical Implementation**:
```javascript
// Photo node structure
{
  id: 'photo-timestamp-index',
  type: 'photoNode',
  position: { x: 100 + gridX * 600, y: 100 + gridY * 600 },
  data: {
    imageUrl: 'base64 or URL',
    location: 'London, UK',
    date: '2024-03-15',
    description: 'Description text',
    size: 374, // Random 308-440px
    onResize: handlePhotoResize // Callback for resizing
  }
}
```

**Storage Strategy**:
- Auto-save to `localStorage` on every change
- JSON format: `{ nodes: [], edges: [] }`
- Storage key: `'uk-memories-data'`
- Load on mount, save on every state change

---

### Phase 2: Firebase Backend for Shareable URLs

**Goal**: Enable users to save and share their memory boards

**Firebase Setup**:
```javascript
// Firebase structure
capsules/
  {capsuleId}/
    - id: string
    - title: string
    - createdAt: timestamp
    - updatedAt: timestamp
    - viewCount: number
    - isPublic: boolean

    nodes/
      {nodeId}/
        - all node data (without functions)

    edges/
      {edgeId}/
        - edge connection data
```

**Implementation Details**:

1. **Save Flow** (`useFirebaseCapsule.js`):
   - User clicks "SHARE" button
   - Strips non-serializable functions (`onResize`) from nodes
   - Uses Firestore batch writes for atomic operations
   - Generates unique capsule ID
   - Returns shareable URL: `{origin}/uk-memories/view/{capsuleId}`
   - Auto-copies URL to clipboard
   - Shows branded ShareModal with copy/preview options

2. **Load Flow** (`CapsuleViewPage.jsx`):
   - Read capsule ID from URL params
   - Fetch capsule metadata and nodes/edges from Firestore
   - Re-attach `onResize` callbacks to loaded nodes
   - Increment view counter
   - Display in read-only mode (no editing)
   - Show view count badge

**Critical Bug Fix**:
- **Problem**: Infinite loop in CapsuleViewPage caused by useEffect dependencies
- **Solution**: Memoized `handlePhotoResize` with `useCallback` and proper dependency array

---

### Phase 3: Full Site Navigation Integration

**Goal**: Add yellowCIRCLE site navigation to Time Capsule page

**Navigation Components Added**:

1. **Main Sidebar** (Left):
   - 80px collapsed, 450px expanded (max 30vw)
   - Frosted glass effect: `rgba(242, 242, 242, 0.96)` + `backdrop-filter: blur(8px)`
   - Accordion navigation matching HomePage
   - Sections: EXPERIMENTS, THOUGHTS, ABOUT, WORKS
   - Dynamic vertical positioning with smooth transitions
   - YC logo at bottom

2. **Secondary Sidebar** (Right):
   - Travel Memories controls in vertical layout
   - 160px expanded (max 25vw), 50px collapsed
   - Compact design with abbreviated button text
   - Actions: DEBUG, CLEAR, EXPORT, IMPORT, SHARE, + ADD
   - Photo count display
   - Mobile responsive with viewport-based sizing

3. **Navigation Bar** (Top):
   - yellowCIRCLE logo (centered)
   - Black background with yellow accent
   - Always visible, z-index: 40

4. **Hamburger Menu**:
   - Yellow overlay (#EECF00, 96% opacity)
   - Menu items: HOME, EXPERIMENTS, THOUGHTS, ABOUT, CONTACT
   - Animated hamburger → X transformation
   - Closes footer when opened

5. **Footer**:
   - Slides up from bottom (300px height)
   - Two sections: CONTACT (black) | PROJECTS (yellow)
   - Triggered by Navigation Circle
   - Pushes zoom controls up with transform

6. **Navigation Circle**:
   - Lower right corner (bottom: 40px, right: 40px)
   - Functions as footer toggle
   - Cloudinary-hosted image asset
   - Moves up 300px when footer opens

**Layout System**:
```javascript
// ReactFlow container padding adjusts for sidebars
paddingLeft: secondarySidebarOpen ? '240px' : '130px'

// Secondary sidebar position based on main sidebar state
left: sidebarOpen ? 'min(30vw, 450px)' : '80px'

// All controls respond to footer state
transform: footerOpen ? 'translateY(-300px)' : 'translateY(0)'
```

---

### Phase 4: Photo Resize System

**Goal**: Allow users to resize individual photos via corner handles

**Implementation**:

1. **Resize Handles** (DraggablePhotoNode.jsx):
   - 4 yellow circular handles (16px diameter)
   - Positioned at corners: top-left, top-right, bottom-left, bottom-right
   - Only visible when photo is selected
   - Class names: `nodrag nopan` to exclude from React Flow drag system
   - Cursors: `nwse-resize` (diagonal) and `nesw-resize` (anti-diagonal)

2. **Resize Logic**:
   ```javascript
   const handleResizeStart = (e, corner) => {
     e.stopPropagation();
     e.preventDefault();

     // Store initial state
     resizeStartRef.current = { size, x: e.clientX, y: e.clientY, corner };

     // Track mouse movement
     const handleMouseMove = (moveEvent) => {
       const deltaX = moveEvent.clientX - resizeStartRef.current.x;
       const deltaY = moveEvent.clientY - resizeStartRef.current.y;
       const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

       // Calculate new size (clamped 154-880px)
       let newSize = resizeStartRef.current.size + delta;
       newSize = Math.max(154, Math.min(880, newSize));

       // Update via callback
       data.onResize(id, newSize);
     };

     document.addEventListener('mousemove', handleMouseMove);
     document.addEventListener('mouseup', handleMouseUp);
   };
   ```

3. **React Flow Configuration**:
   - `panOnDrag={[1, 2]}` - Only middle/right mouse buttons pan
   - `selectionOnDrag={false}` - Prevent drag selection conflicts
   - `nodesDraggable={true}` - Allow photo dragging
   - `elementsSelectable={true}` - Allow photo selection

**Debugging Tools**:
- Console logs with emojis: 🎯 (start), 📏 (resize), ✋ (end), ⚠️ (no callback)

---

### Phase 5: Branding & Polish

**Enhancements**:

1. **ShareModal Component**:
   - Branded modal with yellowCIRCLE styling
   - URL display with copy button
   - Preview link button
   - Close on backdrop click
   - Auto-dismisses on successful copy

2. **Loading States**:
   - Spinner in photo nodes while images load
   - "SAVING..." text on SHARE button during upload
   - Disabled button states with reduced opacity

3. **View Counter**:
   - Increments on each capsule view
   - Displays in read-only view: "👁️ X views"
   - Firestore `increment()` for race-condition safety

4. **Export/Import System**:
   - Export to JSON file with metadata
   - Import with validation and confirmation
   - Versioned format for future compatibility

5. **Parallax Yellow Circle**:
   - Combined mouse position + device motion
   - Throttled at ~60fps for performance
   - iOS 13+ permission handling for gyroscope
   - Mix blend mode: `multiply`

---

## How It Works: Complete Flow

### User Journey: Creating a Memory Board

1. **Navigate to Page**:
   - User visits `/uk-memories`
   - Empty state shows: "Start Your Time Capsule" with instructions

2. **Add Photos**:
   - Click "+ ADD" button in secondary sidebar
   - PhotoUploadModal opens with 3 tabs:
     - **Local Files**: File input → FileReader → base64 encoding
     - **URL**: Direct image URL input
     - **Cloudinary**: Upload to cloud → get permanent URL
   - Enter metadata: location, date, description
   - Click "Upload" → Modal closes

3. **Photos Render**:
   - New nodes added to React Flow canvas
   - Random sizes (308-440px) for visual variety
   - 8-column grid layout (600px horizontal spacing)
   - Auto-save to localStorage

4. **Arrange Board**:
   - **Drag photos**: Click and drag to reposition
   - **Resize photos**: Click to select → drag corner handles
   - **Pan canvas**: Middle/right mouse or arrow keys
   - **Zoom**: +/- keys or zoom buttons
   - **Connect photos**: Drag from handle to handle (optional)

5. **Save & Share**:
   - Click "SHARE" button
   - Firebase save process:
     - Strips `onResize` function from nodes
     - Creates Firestore document with unique ID
     - Saves nodes and edges in subcollections
   - URL generated: `{origin}/uk-memories/view/{capsuleId}`
   - URL auto-copied to clipboard
   - ShareModal displays with copy/preview options

6. **Share with Others**:
   - Send URL to friends/family
   - They visit URL → CapsuleViewPage loads
   - Reads capsule from Firebase
   - Re-attaches `onResize` callbacks
   - Displays in read-only mode
   - View counter increments

---

## Technical Architecture

### Component Hierarchy

```
TimeCapsulePage (route: /uk-memories)
├── ErrorBoundary
├── Parallax Yellow Circle
├── Navigation Bar
├── Main Sidebar
│   ├── Sidebar Toggle
│   ├── HOME Label
│   ├── Navigation Items (accordion)
│   └── YC Logo
├── Secondary Sidebar
│   ├── Toggle Button
│   └── Action Buttons
│       ├── DEBUG
│       ├── CLEAR
│       ├── EXPORT
│       ├── IMPORT
│       ├── SHARE
│       └── + ADD
├── Hamburger Menu
├── Menu Overlay
├── Footer
│   ├── Contact Section (black)
│   └── Projects Section (yellow)
├── ReactFlowProvider
│   └── ReactFlow
│       ├── Background (yellow dots)
│       └── Nodes (DraggablePhotoNode[])
│           ├── Image
│           ├── Metadata Footer
│           ├── Handles (top/bottom)
│           └── Resize Handles (4 corners)
├── Empty State (if no photos)
├── PhotoUploadModal
├── ShareModal
└── Zoom Controls & Nav Circle
    ├── Zoom In
    ├── Zoom Out
    ├── Center
    └── Navigation Circle
```

### State Management

**Local State** (useState):
- `nodes` - Array of photo nodes (React Flow state)
- `edges` - Array of connections (React Flow state)
- `isUploadModalOpen` - Modal visibility
- `showShareModal` - Share modal visibility
- `shareUrl` - Generated shareable URL
- `currentCapsuleId` - ID of saved capsule
- Navigation states: `menuOpen`, `sidebarOpen`, `footerOpen`, `secondarySidebarOpen`
- Parallax: `mousePosition`, `deviceMotion`, `accelerometerData`

**Persistent State**:
- `localStorage['uk-memories-data']` - Auto-saved board state
- Firebase Firestore - Saved capsules with shareable URLs

**Derived State**:
- Photo count: `nodes.length`
- Button enabled/disabled based on `nodes.length === 0`
- Combined parallax position from mouse + device motion

### Data Flow

1. **Upload Flow**:
   ```
   User clicks "+ ADD"
   → PhotoUploadModal opens
   → User selects files/URLs
   → handlePhotoUpload() processes images
   → Creates nodes with positions, data, callbacks
   → setNodes([...prev, ...newNodes])
   → React Flow renders
   → Auto-saves to localStorage
   ```

2. **Resize Flow**:
   ```
   User clicks photo (selected=true)
   → Resize handles render
   → User drags handle
   → handleResizeStart() captures initial state
   → mousemove: calculates delta → new size
   → data.onResize(id, newSize) callback
   → handlePhotoResize() updates node in state
   → React re-renders with new size
   → Auto-saves to localStorage
   ```

3. **Save Flow**:
   ```
   User clicks "SHARE"
   → handleSaveAndShare()
   → saveCapsule(nodes, edges, metadata)
   → Strips functions from node.data
   → Firestore batch write (capsule + nodes + edges)
   → Returns capsuleId
   → Generates URL
   → Copies to clipboard
   → Shows ShareModal
   ```

4. **Load Flow**:
   ```
   User visits /uk-memories/view/{capsuleId}
   → CapsuleViewPage mounts
   → useEffect: loadCapsule(capsuleId)
   → Fetches from Firestore
   → Increments view count
   → setNodes/setEdges with loaded data
   → useEffect: re-attaches onResize callbacks
   → Renders read-only view
   ```

---

## Key Technical Decisions

### 1. Why React Flow?
- Handles complex drag-and-drop interactions
- Built-in pan/zoom controls
- Efficient rendering with virtualization
- Node/edge connection system (for future features)
- Customizable node components

### 2. Why localStorage + Firebase?
- **localStorage**: Instant auto-save, works offline, no backend needed for personal use
- **Firebase**: Shareable URLs, view tracking, multi-device access
- Best of both: Local draft + cloud sharing

### 3. Why Strip Functions Before Firebase?
- Firestore doesn't accept JavaScript functions
- Functions (callbacks) can't be serialized to JSON
- Solution: Remove before save, re-attach on load
- Pattern: `const { onResize, ...cleanData } = node.data`

### 4. Why Batch Writes?
- Atomic operations: all-or-nothing saves
- Better performance (single network round-trip)
- Prevents partial save failures
- Transaction-like safety

### 5. Why Base64 for Local Files?
- No server upload needed for local storage
- Inline in localStorage (no separate file storage)
- Works offline
- Trade-off: Larger storage size vs. convenience

### 6. Why Variable Photo Sizes?
- Visual interest (not boring grid)
- Mimics physical photo collages
- Random 308-440px range (~25% variance)
- User can resize to exact preference

---

## Performance Optimizations

1. **Throttled Mouse Tracking**:
   ```javascript
   // Parallax updates capped at ~60fps
   setTimeout(() => handleMouseMove(e), 16);
   ```

2. **Lazy Image Loading**:
   ```javascript
   <img loading="lazy" ... />
   ```

3. **Memoized Callbacks**:
   ```javascript
   const handlePhotoResize = useCallback((nodeId, newSize) => {
     // Prevents recreation on every render
   }, [setNodes]);
   ```

4. **Conditional Rendering**:
   - Resize handles only when selected
   - Empty state only when `nodes.length === 0`
   - Zoom controls only when photos exist

5. **React Flow Viewport Limits**:
   - `minZoom={0.5}`, `maxZoom={2.5}` - Prevents extreme scaling
   - `preventScrolling={false}` - Better mobile experience

---

## Browser Compatibility

**Tested & Supported**:
- Chrome/Edge (Chromium) ✅
- Safari (desktop/mobile) ✅
- Firefox ✅

**Mobile Features**:
- Touch drag support (React Flow native)
- Device orientation parallax (iOS/Android)
- Responsive sidebars (viewport-based sizing)
- Touch-friendly button sizes

**iOS-Specific**:
- DeviceMotionEvent permission handling (iOS 13+)
- Silent fail if permission denied
- Fallback to mouse-only parallax

---

## Future Enhancements

**Planned Features**:
1. **Collaborative Editing**:
   - Real-time updates with Firebase listeners
   - Multi-user cursor tracking
   - Conflict resolution

2. **Advanced Layouts**:
   - Timeline view (chronological auto-layout)
   - Map view (geo-location based)
   - Grid view (Pinterest-style masonry)

3. **Rich Media**:
   - Video support
   - Audio notes
   - Embedded maps

4. **Social Features**:
   - Comments on photos
   - Like/favorite system
   - User profiles

5. **Export Options**:
   - PDF export
   - High-res image export
   - Video slideshow generation

6. **Advanced Editing**:
   - Photo filters/adjustments
   - Text annotations
   - Stickers/overlays
   - Photo cropping

---

## Deployment

**Development**:
```bash
npm run dev  # Vite dev server on :5173
```

**Production Build**:
```bash
npm run build  # Outputs to dist/
```

**Firebase Hosting**:
```bash
firebase deploy  # Deploys from dist/
```

**Environment Variables** (.env):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=yellowcircle-app
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Troubleshooting

### Common Issues

**1. Photos won't resize**:
- Check console for debug logs (🎯, 📏, ✋)
- Ensure photo is selected (yellow border)
- Verify `nodrag nopan` classes on handles
- Check `onResize` callback is attached

**2. Firebase save fails**:
- Check for functions in node data
- Verify Firebase credentials in .env
- Check Firestore rules (allow read/write)
- Look for `undefined` values in data

**3. Photos not loading**:
- Check image URL CORS headers
- Try `crossOrigin="anonymous"` attribute
- Verify base64 encoding for local files
- Check network tab for 404s

**4. Infinite loop on load**:
- Check useEffect dependency arrays
- Ensure callbacks are memoized with useCallback
- Avoid state updates in render

**5. Navigation sidebar issues**:
- Verify z-index layering
- Check transform/transition properties
- Ensure click handlers don't conflict
- Test on mobile (touch events)

---

## Credits & Dependencies

**Core Libraries**:
- React 19.1 - UI framework
- Vite 5.4 - Build tool
- @xyflow/react - Interactive canvas
- Firebase 11.1 - Backend/hosting
- Tailwind CSS 4.1 - Utility styles

**Assets**:
- Cloudinary - Image hosting
- Lucide React - Icons (in other pages)

**Development**:
- ESLint - Code quality
- Builder.io dev tools

---

## License & Usage

This is a proprietary portfolio project for yellowCIRCLE. All rights reserved.

**Contact**: email@yellowcircle.io

---

*Documentation last updated: 2025-01-15*
