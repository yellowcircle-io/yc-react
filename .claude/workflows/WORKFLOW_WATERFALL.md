# Waterfall Workflow

**Use this workflow for systematic codebase improvements and cleanup.**

---

## Overview

The Waterfall workflow is for large-scale, methodical improvements to the codebase. Unlike feature work, this is about systematic cleanup and quality improvement.

---

## When to Use This Workflow

- Weekly/monthly codebase maintenance
- Removing accumulated dead code
- Cleaning up unused dependencies
- Systematic pattern compliance checks
- Technical debt reduction

---

## Phase 1: Detection

**Goal:** Identify all issues requiring attention.

### Run Detection Tools

```bash
# Dead code detection
npm run deadcode

# Unused dependencies
npm run check:unused

# Lint issues
npm run lint

# Build warnings
npm run build 2>&1 | grep -i "warning"
```

### Generate Reports

**knip Report:**
```bash
npx knip --reporter json > reports/knip-report.json
```

**depcheck Report:**
```bash
npx depcheck --json > reports/depcheck-report.json
```

### Document Findings

Create a findings document:
```markdown
## Codebase Cleanup - [Date]

### Dead Code Found
- [ ] File: path/to/file.js - Reason
- [ ] Export: functionName in file.js - Unused

### Unused Dependencies
- [ ] package-name - Can remove
- [ ] package-name - Needs verification

### Pattern Violations
- [ ] File: path - Firebase in component
- [ ] File: path - Missing error handling
```

---

## Phase 2: Analysis

**Goal:** Categorize findings and prioritize.

### Categorization

**Safe to Remove (Green):**
- Clearly unused exports with no dynamic imports
- Dependencies not imported anywhere
- Orphaned test files
- Dead code in archived directories

**Needs Verification (Yellow):**
- Dependencies used only in build tools
- Exports that might be dynamically imported
- Code referenced in configuration files
- Recently added (might be for upcoming feature)

**Risky (Red):**
- Shared utility functions (might be used dynamically)
- Core dependencies (firebase, react, etc.)
- Files with many importers

### Verification Steps

For each "Yellow" item:
```bash
# Check for dynamic imports
grep -r "import(" src/ | grep "filename"

# Check for string references
grep -r "functionName" src/

# Check git history
git log --oneline -10 -- path/to/file
```

---

## Phase 3: Execution

**Goal:** Remove issues systematically.

### Execution Order

1. **Remove clearly unused files first** (lowest risk)
2. **Remove unused exports** (medium risk)
3. **Remove unused dependencies** (verify build after)
4. **Fix pattern violations** (use Refactoring Workflow)

### Batch Processing

**For each batch of ~5 related items:**

```bash
# 1. Make changes
# 2. Verify lint
npm run lint

# 3. Verify build
npm run build

# 4. Commit if passes
git add -A
git commit -m "Cleanup: Remove unused [description]"
```

### Rollback Strategy

If anything breaks:
```bash
# Revert last commit
git revert HEAD

# Or reset to previous state
git reset --hard HEAD~1
```

---

## Phase 4: Verification

**Goal:** Ensure no regressions.

### Final Checks

```bash
# Full lint check
npm run lint

# Production build
npm run build

# Re-run detection tools (should be cleaner)
npm run deadcode
npm run check:unused

# Test critical flows manually
npm run dev
```

### Document Results

Update findings document:
```markdown
## Codebase Cleanup - [Date] - COMPLETED

### Removed
- [x] File: path/to/file.js - Removed (unused)
- [x] Dependency: package-name - Removed

### Kept (Verified in use)
- package-name - Used by build tool
- export functionName - Used dynamically

### Metrics
- Files removed: X
- Dependencies removed: X
- Bundle size before: X KB
- Bundle size after: X KB
```

---

## Weekly Maintenance Schedule

### Quick Check (5 minutes)
```bash
npm run lint
npm run deadcode
```

### Monthly Deep Clean (30-60 minutes)
1. Run full detection phase
2. Address all "Green" items
3. Investigate "Yellow" items
4. Document "Red" items for future

---

## Tool Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run deadcode` | Run knip for dead code |
| `npm run check:deps` | knip production analysis |
| `npm run check:unused` | depcheck for unused deps |
| `npm run lint` | ESLint checks |
| `npm run build` | Production build verification |

---

## Cleanup Checklist Template

```markdown
## Cleanup Session - [Date]

### Pre-Cleanup
- [ ] Run all detection tools
- [ ] Document current bundle size
- [ ] Create branch: cleanup/[date]

### Execution
- [ ] Remove unused files
- [ ] Remove unused exports
- [ ] Remove unused dependencies
- [ ] Verify build after each batch

### Post-Cleanup
- [ ] Final lint check passes
- [ ] Final build succeeds
- [ ] Document what was removed
- [ ] Record new bundle size
- [ ] Merge cleanup branch
```
