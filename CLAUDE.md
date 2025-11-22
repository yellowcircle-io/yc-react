# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📚 Documentation Navigation

**📖 [REPOSITORY_TOC.md](REPOSITORY_TOC.md)** - Complete repository documentation index
**🗂️ [.claude/TABLE_OF_CONTENTS.md](.claude/TABLE_OF_CONTENTS.md)** - Multi-Machine Framework documentation

---

## 🔴 MULTI-MACHINE CONTEXT SYSTEM - READ FIRST

**⚠️ IMPORTANT:** This repository uses a multi-machine Claude Code context sharing system.

### On Every Session Startup:

1. **Verify Sync Status (CRITICAL):**
   ```bash
   ./.claude/verify-sync.sh
   ```
   Run this script to verify:
   - Git status (uncommitted changes)
   - GitHub sync (ahead/behind remote)
   - Critical files exist and are current
   - Dropbox sync active (Mac only)

   **If out of sync:** Run `git pull` to get latest changes BEFORE starting work.

2. **Check Current Work Status:**
   ```bash
   cat .claude/shared-context/WIP_CURRENT_CRITICAL.md
   ```
   This file contains the current work-in-progress, context from the last session, and next steps. **Always read this before starting work.**

3. **Identify This Machine:**
   - Determine which machine you're running on (Mac Mini, MacBook Air, etc.)
   - Check if `.claude/INSTANCE_LOG_[MACHINE].md` exists for this machine
   - If not, this is a **first-time setup** - read `.claude/MULTI_MACHINE_SETUP_CRITICAL.md`

4. **Before Ending Session:**
   - Update `.claude/shared-context/WIP_CURRENT_CRITICAL.md` with current status
   - Update machine-specific instance log (`.claude/INSTANCE_LOG_[MACHINE].md`)
   - **PRIMARY:** Wait 30 seconds for Dropbox sync (automatic - just wait!)
   - **FOUNDATIONAL:** Push to GitHub after significant work:
     ```bash
     git add .claude/ dev-context/
     git commit -m "Update: [description]"
     git push
     ```
   - Git push is for version control + remote access (Codespaces/Web/iPad)

### Key Files:

- 🔴 **`.claude/verify-sync.sh`** - Sync status checker (RUN FIRST every session)
- 🔴 **`.claude/shared-context/WIP_CURRENT_CRITICAL.md`** - Current work status (check EVERY session)
- 🔴 **`.claude/MULTI_ENVIRONMENT_SYNC_GUIDE.md`** - Complete sync guide for all platforms
- 🔴 **`MULTI_ENVIRONMENT_SETUP_COMPLETE.md`** - Quick start guide
- 🔴 **`.claude/MULTI_MACHINE_SETUP_CRITICAL.md`** - Setup instructions for new machines
- 🔴 **`.claude/CODESPACES_MOBILE_ACCESS_CRITICAL.md`** - Mobile/Codespace access guide
- **`.claude/README.md`** - Complete multi-machine system overview
- **`.claude/INSTANCE_LOG_[MACHINE].md`** - Machine-specific session history

### Multi-Environment Sync (Updated Nov 9, 2025):

**⚠️ CRITICAL: Correct Dropbox Path**

**Official Dropbox location (Mac):** `/Users/[USERNAME]/Library/CloudStorage/Dropbox`

**DO NOT USE:** `/Users/[USERNAME]/Dropbox` (old path, not synced!)

The `.claude/verify-sync.sh` script will detect and warn about incorrect paths.

**Sync Hierarchy (in order of priority):**

1. **PRIMARY: Dropbox** (10-30 seconds automatic)
   - Mac Mini ↔ MacBook Air: Real-time context sharing
   - Claude Code reads from Dropbox files immediately
   - No manual commands needed
   - Wait 30 seconds before switching machines
   - **MUST use official path:** `~/Library/CloudStorage/Dropbox`

2. **SECONDARY: Google Drive** (Backup + Rho Projects)
   - Automatic backup repository
   - Rho-related project storage
   - Additional redundancy

3. **TERTIARY: GitHub** (Version Control - UPDATE OFTEN!)
   - Foundational version control and history
   - Enables Codespaces, Web, remote access
   - Push after significant work sessions
   - Required for: `git commit` then `git push`

**For Mac-to-Mac work:** Dropbox handles everything automatically (use correct path!)
**For remote access (Codespaces/Web):** Requires `git pull` first
**Verification:** Run `./.claude/verify-sync.sh` anytime to check status

### Custom Commands:

This repository includes custom slash commands for project management:

- **`/roadmap`** - Main command for managing Trimurti project roadmap
  - Check current priorities and status
  - Add new action items
  - Continue working on existing tasks
  - Update task completion status
  - Adjust priorities

- **Aliases:** `/trimurti`, `/trimurti-roadmap`, `/yc-roadmap` (all redirect to `/roadmap`)

**Usage:**
```
/roadmap              # Show status and options
/roadmap continue     # Continue current work
/roadmap add          # Add new task
```

**For Web/SSH/Codespaces:** Commands are synced via GitHub. Run `git pull` before use and commit changes after updates.

See `.claude/commands/README.md` for full documentation.

---

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