# Dependency Mismatch Report - @xyflow/react

**Date:** October 15, 2025
**Issue:** Vite import resolution failure for `@xyflow/react`
**Status:** ⚠️ BLOCKING - Development server cannot start

---

## Error Summary

```
[plugin:vite:import-analysis] Failed to resolve import "@xyflow/react" from "src/pages/TimeCapsulePage.jsx". Does the file exist?
```

**Location:** `src/pages/TimeCapsulePage.jsx:12:7`

---

## Root Cause Analysis

### The Problem: Missing Node Modules

The project has a **critical mismatch** between:
1. **Code on disk** - Contains `TimeCapsulePage.jsx` that imports `@xyflow/react`
2. **Declared dependencies** - `package.json` lists `"@xyflow/react": "^12.8.6"`
3. **Installed packages** - `node_modules/` does **NOT** contain `@xyflow/react`

### Timeline Investigation

**Git History:**
```bash
72c13ae - "Travel Memories Time Capsule: Complete Feature Implementation" (committed with @xyflow/react)
ff07d69 - "feat: Add Firebase backend for shareable URLs"
587ec02 - "V0.9.2" (current HEAD on main branch)
```

**Key Findings:**

1. **package.json** - Contains `@xyflow/react` dependency:
   ```json
   "@xyflow/react": "^12.8.6"
   ```

2. **TimeCapsulePage.jsx** - Imports from `@xyflow/react`:
   ```javascript
   import {
     ReactFlow,
     Controls,
     Background,
     useNodesState,
     useEdgesState,
     addEdge,
     ReactFlowProvider,
     useReactFlow
   } from '@xyflow/react';
   import '@xyflow/react/dist/style.css';
   ```

3. **node_modules/** - Directory checked:
   ```bash
   ls -la node_modules/@xyflow
   # Result: No such file or directory
   ```

4. **npm list** - Verification:
   ```bash
   npm list @xyflow/react
   # Result: (empty) - Package not installed
   ```

5. **package-lock.json** - Last modified: `Oct 15 21:44` (today)

6. **node_modules/** - Last modified: `Oct 14 23:39:18` (yesterday)

---

## Version Sync Analysis

### Scenario: Separate Computer vs This Machine

**What Likely Happened:**

1. **On Computer A (separate machine):**
   - Developer worked on Travel Memories Time Capsule feature
   - Ran `npm install @xyflow/react` to install the package
   - Added code to `TimeCapsulePage.jsx` using the package
   - Updated `package.json` with the dependency
   - Committed changes (commit `72c13ae`)
   - **DID NOT** commit `package-lock.json` or `node_modules/` (correctly excluded by `.gitignore`)

2. **On Computer B (this machine - most recent git fetch):**
   - Pulled latest commits from remote
   - Received updated `TimeCapsulePage.jsx` with imports
   - Received updated `package.json` with dependency listed
   - **Did NOT run** `npm install` to sync dependencies
   - Node modules remain out of sync with package.json

### The Missing Step

After pulling code that adds new dependencies, you must run:
```bash
npm install
```

This synchronizes `node_modules/` with the dependencies declared in `package.json`.

---

## Current State

| Component | Status | Details |
|-----------|--------|---------|
| **package.json** | ✅ Has dependency | `"@xyflow/react": "^12.8.6"` |
| **TimeCapsulePage.jsx** | ✅ Has imports | Imports 8+ exports from `@xyflow/react` |
| **node_modules/** | ❌ Missing package | Directory `@xyflow/` does not exist |
| **package-lock.json** | ✅ Exists | Modified Oct 15 21:44 |
| **Dev server** | ❌ Cannot start | Vite cannot resolve imports |

---

## Related Files Using @xyflow/react

Only one file uses this dependency:
- `src/pages/TimeCapsulePage.jsx` (2169 lines)

**Features using @xyflow/react:**
- Interactive travel memories canvas
- Draggable photo nodes
- Node connections/edges
- Zoom/pan controls
- Custom node types
- Background grid
- Node state management

---

## Solution

### Immediate Fix (Required)

Run this command to install all missing dependencies:

```bash
npm install
```

This will:
1. Read `package.json` dependencies
2. Download `@xyflow/react@^12.8.6` and all other declared packages
3. Update `node_modules/` directory
4. Update `package-lock.json` with exact versions
5. Resolve all transitive dependencies

**Verification after install:**

```bash
# Check package is installed
ls node_modules/@xyflow/react

# Verify version
npm list @xyflow/react
# Should show: @xyflow/react@12.8.6 (or similar 12.8.x version)

# Try starting dev server
npm run dev
# Should start without import errors
```

---

## Prevention for Future

### Best Practices When Syncing Code Between Machines:

1. **After every `git pull` or `git fetch`:**
   ```bash
   npm install  # Always sync dependencies
   ```

2. **Check for package.json changes:**
   ```bash
   git diff origin/main -- package.json
   ```
   If you see changes in `dependencies` or `devDependencies`, run `npm install`

3. **Set up a git hook** (optional):
   Create `.git/hooks/post-merge`:
   ```bash
   #!/bin/bash
   changed_files="$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)"

   if echo "$changed_files" | grep --quiet "package.json"; then
     echo "📦 package.json changed - running npm install..."
     npm install
   fi
   ```

4. **Use npm scripts** that check dependency freshness:
   Add to `package.json`:
   ```json
   "scripts": {
     "predev": "npm install",
     "dev": "vite"
   }
   ```

---

## Additional Notes

### Why package-lock.json is Newer Than node_modules

**Timestamps:**
- `package-lock.json`: Oct 15 21:44 (today)
- `node_modules/`: Oct 14 23:39:18 (yesterday)

**Possible causes:**
1. Someone ran `npm install` on another machine, generating a new lock file, which was committed
2. Lock file was manually edited or updated via git
3. An `npm` command ran that updated the lock file but didn't fully install packages (e.g., `npm ls`, `npm outdated`)

**This discrepancy confirms** that the installation state is stale and out of sync.

---

## Impact Assessment

### Blocking Issues:
- ✅ Dev server (`npm run dev`) cannot start - **CONFIRMED BLOCKING**
- ✅ Build process (`npm run build`) will fail
- ✅ TimeCapsulePage cannot be viewed or tested
- ✅ No development work possible on Travel Memories feature

### Non-blocking:
- ✅ Other pages not using `@xyflow/react` may work if server can start (but it can't)
- ✅ Git operations work fine
- ✅ Code editing works fine

---

## Testing After Fix

After running `npm install`, test these:

1. **Start dev server:**
   ```bash
   npm run dev
   # Expected: Server starts on port 5173 without errors
   ```

2. **Navigate to Travel Memories page:**
   - Go to `http://localhost:5173/uk-memories`
   - Should see interactive canvas with controls
   - Should be able to add photos and drag them

3. **Check console:**
   - No import errors
   - No module resolution errors
   - React Flow initialized successfully

4. **Verify all routes:**
   ```
   / (HomePage)
   /experiments (ExperimentsPage)
   /uk-memories (TimeCapsulePage) ← Primary test target
   /about (AboutPage)
   ```

---

## Summary

**Problem:** Missing `@xyflow/react` package in `node_modules/`
**Cause:** Dependencies not installed after pulling code from remote
**Solution:** Run `npm install`
**Prevention:** Always run `npm install` after `git pull` when `package.json` changes

**Status:** Ready to fix - one command resolves the issue.
