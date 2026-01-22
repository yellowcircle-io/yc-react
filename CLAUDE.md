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

---

## Architecture Patterns

### Primary Pattern: Clean Architecture + Hexagonal Separation

**Rule:** Firebase integration code NEVER appears in UI components.

**Structure:**
```
src/
├── components/          # React UI layer (NO Firebase imports allowed)
├── contexts/            # React contexts (may use services)
├── hooks/               # Custom React hooks (use services, NO Firebase)
├── pages/               # Page components (composition layer)
├── utils/firestore*.js  # Firebase operations ONLY (canonical location)
├── services/firebase/   # Alternative Firebase location (if needed)
└── config/              # Configuration (pure data)
```

**Canonical Firebase Service Pattern:**
```javascript
// src/utils/firestoreLinks.js - SINGLE RESPONSIBILITY: Firebase operations only
export async function saveLink(userId, linkData) {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'links'), linkData);
    return { success: true, id: docRef.id, error: null };
  } catch (error) {
    return { success: false, id: null, error: error.message };
  }
}
// ✓ Returns structured result (never throws in services)
// ✓ All Firebase logic isolated here
```

**Component Pattern (React):**
```javascript
// src/components/LinkCard.jsx - SINGLE RESPONSIBILITY: UI rendering only
function LinkCard({ link }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteLink(link.id); // Call service
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  // JSX only - NO Firebase code, NO business logic
}
// ✓ Firebase code completely separated
// ✓ Clear loading/error state management
```

**Key Rule:**
> Firebase imports ONLY allowed in: `src/utils/firestore*.js`, `src/services/firebase/*`, `functions/`

---

## Forbidden Patterns

### Code Structure Violations

- ❌ `import { db } from` in any file EXCEPT `src/utils/firestore*.js` or `services/firebase/*`
- ❌ Firebase operations directly in components (use service layer)
- ❌ Nested ternaries beyond 1 level (max: `a ? b : c`)
- ❌ Component files > 200 lines (split into smaller components)
- ❌ Props object with >5 properties (use composition or context)
- ❌ Async operations without explicit loading/error state
- ❌ Multiple responsibilities in single function

### Dependency Violations

- ❌ Unused imports (ESLint: no-unused-vars error)
- ❌ Unused dependencies in package.json (knip will flag)
- ❌ Installing packages without checking if already installed

### Error Handling Violations

- ❌ Silent failures: `try { risky(); } catch(e) { /* ignore */ }`
- ❌ Unhandled promise rejections
- ❌ Missing loading states in async operations
- ❌ Missing cleanup in useEffect (event listeners, subscriptions)

---

## Quality Gates & Tools

### Pre-Commit Verification
```bash
npm run lint                  # ESLint checks
npm run build                 # Verify production build
npm run deadcode              # Dead code detection (knip)
```

### Quality Check Scripts
```bash
npm run check:deps            # knip production analysis
npm run check:unused          # depcheck for unused dependencies
```

### Weekly Maintenance
```bash
npm run deadcode              # Full dead code report
npm run check:unused          # Unused dependencies report
```

### Existing Tool Configuration

**knip** (already configured in `knip.json`):
- Entry points: `src/main.jsx`, `src/RouterApp.jsx`
- Ignores: `.claude/**`, `dev-context/**`, `functions/**`, `scripts/**`, `src/archive/**`
- Ignored deps: `@builder.io/dev-tools`, `@rollup/rollup-linux-x64-gnu`, `autoprefixer`, `postcss`

**ESLint** (configured in `eslint.config.js`):
- React hooks rules enabled
- React refresh plugin for HMR

**Sentry** (configured in `src/main.jsx`):
- DSN via `VITE_SENTRY_DSN` environment variable
- 10% transaction sampling
- Session replay enabled

---

## Development Workflows

Detailed workflow documentation available in `.claude/workflows/`:

### Plan-First Workflow
For new features - understand architecture before coding.
See: `.claude/workflows/WORKFLOW_PLAN_FIRST.md`

### Refactoring Workflow
For cleaning up existing code safely.
See: `.claude/workflows/WORKFLOW_REFACTORING.md`

### Waterfall Workflow
For systematic codebase improvements.
See: `.claude/workflows/WORKFLOW_WATERFALL.md`

### Quick Reference

**Before ANY Code Change:**
```
□ Read file(s) first - NEVER modify unread code
□ Check existing patterns in related files
□ Run `npm run lint` before and after changes
□ Verify build succeeds: `npm run build`
```

**Before Deployment:**
```
□ Deploy to staging first: `firebase hosting:channel:deploy staging --expires 30d`
□ Test staging URL before production
□ Deploy to production: `firebase deploy --only hosting`
□ Verify production URL works
```

---

## Common Mistakes to Avoid

### 1. Firebase + UI Coupling
**Problem:** Firebase operations directly in component
```javascript
// ❌ WRONG
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, 'users'), (snap) => {
    setUsers(snap.docs.map(d => d.data()));
  });
  return unsubscribe;
}, []);
```

**Fix:** Use service layer
```javascript
// ✓ RIGHT
useEffect(() => {
  loadUsers();
}, []);

const loadUsers = async () => {
  const result = await getUsers(); // from src/utils/firestoreUsers.js
  if (result.success) {
    setUsers(result.users);
  }
};
```

### 2. Missing Error States
**Problem:** Showing data before checking for errors
```javascript
// ❌ WRONG
if (loading) return <Skeleton />;
return <UserList users={users} />; // What if error?
```

**Fix:** Always render error state
```javascript
// ✓ RIGHT
if (loading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
return <UserList users={users} />;
```

### 3. Over-Generalization
**Problem:** Creating utility functions for 1-2 use cases
```javascript
// ❌ WRONG
const formatDataForDisplay = (data, format, locale) => {
  // 50 lines of logic for ONE use case
};
```

**Fix:** Only abstract patterns used 3+ times
```javascript
// ✓ RIGHT - Implement inline until pattern repeats
const displayName = name.toUpperCase();
```

### 4. Missing Cleanup
**Problem:** Event listeners without cleanup
```javascript
// ❌ WRONG
useEffect(() => {
  window.addEventListener('resize', handler);
}, []);
```

**Fix:** Proper cleanup
```javascript
// ✓ RIGHT
useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

### 5. Async Race Conditions
**Problem:** Multiple simultaneous requests with shared state
```javascript
// ❌ WRONG
const handleSearch = async (query) => {
  setResults(await searchUsers(query));
  // What if user types again before response?
};
```

**Fix:** Use loading flags or abort controllers
```javascript
// ✓ RIGHT
const [loading, setLoading] = useState(false);
const handleSearch = async (query) => {
  if (loading) return; // Prevent concurrent requests
  setLoading(true);
  const results = await searchUsers(query);
  setResults(results);
  setLoading(false);
};
```

---

## Red Flags - When to PAUSE

1. **"This is deprecated but..."** → Understand why FIRST
2. **"Just remove this..."** → Verify nothing depends on it with grep
3. **"Quick fix..."** → Consider long-term implications
4. **"Works on my machine..."** → Must test in staging
5. **"I'll add error handling later..."** → NO - do it now

---

## yc-MSF: Multi-Session Framework

The yellowCircle Multi-Session Framework (yc-MSF) ensures context continuity across sessions and machines.

### Key Documents (Priority Order)

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| `.claude/shared-context/WIP_CURRENT_CRITICAL.md` | Current work status, session handoff | Every session |
| `.claude/shared-context/ACTIVE_SPRINT.md` | Sprint tasks, scope status, priorities | When tasks change |
| `dev-context/SCOPE_*.md` | Feature specifications | When scope changes |
| `.claude/plans/*.md` | Detailed implementation plans | When planning |

### Session Protocol

**On Session Start:**
1. Run `./.claude/verify-sync.sh` (sync status)
2. Read `WIP_CURRENT_CRITICAL.md` (current context)
3. Check `ACTIVE_SPRINT.md` (priorities)

**On Session End:**
1. Update `WIP_CURRENT_CRITICAL.md` with status
2. Update `ACTIVE_SPRINT.md` if tasks completed
3. Wait 30 seconds for Dropbox sync
4. Git push if significant changes

### Status Indicators

- ✅ Complete
- ⚠️ Partial (some work done)
- 🔲 Not Started
- ⏳ Blocked
- 📋 Planned

---

## Agent Protocols

### Sleepless Agent

**Purpose:** Automated codebase improvements during off-hours.

**Protocol:**
1. Changes are committed to a feature branch (not main)
2. All changes require human review
3. Architecture compliance is mandatory
4. Must not break build or tests

**Review Checklist:**
- [ ] No direct Firebase imports in components
- [ ] Uses `useAuth()` hook for auth state
- [ ] All imports used or prefixed with `_`
- [ ] No new lint errors introduced
- [ ] Build passes: `npm run build`

### Playwright MCP

**Purpose:** Browser automation for testing and verification.

**Available via MCP tools:**
- `mcp__playwright__browser_navigate` - Navigate to URL
- `mcp__playwright__browser_snapshot` - Capture page state
- `mcp__playwright__browser_click` - Interact with elements
- `mcp__playwright__browser_type` - Enter text

**Use Cases:**
1. Visual verification of deployments
2. Integration testing of UI flows
3. Screenshot capture for documentation

**Best Practices:**
- Use `browser_snapshot` before interactions (accessibility tree)
- Prefer `browser_snapshot` over `browser_take_screenshot` for actions

**⚠️ CRITICAL: DO NOT close Playwright browser during session**
- Keep browser open throughout the session for iterative testing
- User may need to visually verify changes at any time
- Only close if explicitly requested by user
- Browser persists state, tabs, and login sessions

---

## References

- **Deployment Rules:** `dev-context/SCOPE_CODE_QUALITY_RULES.md`
- **Firebase Patterns:** `src/utils/firestore*.js` (canonical implementations)
- **Component Patterns:** `src/components/` (reference implementations)
- **Workflow Details:** `.claude/workflows/`
- **MSF Context:** `.claude/shared-context/` (WIP, Active Sprint)
- **Agent Plans:** `.claude/plans/` (feature designs)