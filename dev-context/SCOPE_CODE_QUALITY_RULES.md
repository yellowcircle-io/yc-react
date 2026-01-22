# Code Quality Rules & Patterns for CLAUDE.md

**Created:** January 22, 2026
**Purpose:** Prevent poor code execution through established patterns

---

## 🔴 CRITICAL: Pre-Implementation Checklist

### Before ANY Code Change:
```
□ Read file(s) first - NEVER modify unread code
□ Check existing patterns in related files
□ Run `npm run lint` before and after changes
□ Verify build succeeds: `npm run build`
□ Test locally before committing
```

### Before Deployment:
```
□ Verify staging matches local: `firebase hosting:channel:list`
□ Deploy to staging first: `firebase hosting:channel:deploy staging --expires 30d`
□ Test staging URL before production
□ Deploy to production: `firebase deploy --only hosting`
```

---

## 🔒 Code Execution Safety Rules

### 1. Dependency Management
```markdown
**NEVER:**
- Install packages without checking if already installed
- Remove packages without verifying no imports exist
- Update major versions without testing

**ALWAYS:**
- Check package.json first: `grep "package-name" package.json`
- Verify imports: `grep -r "from 'package-name'" src/`
- Test build after dependency changes
```

### 2. File Modifications
```markdown
**NEVER:**
- Delete files without verifying no imports
- Modify files marked as "DO NOT EDIT"
- Remove code without understanding usage

**ALWAYS:**
- Read file before editing
- Search for imports: `grep -r "filename" src/`
- Keep backup patterns in archive/ if uncertain
```

### 3. Performance Optimizations
```markdown
**NEVER:**
- Add memoization without measuring impact
- Remove optimizations without understanding why they exist
- Add dependencies for <100 LOC of custom code

**ALWAYS:**
- Verify build size before/after: Check Vite build output
- Test on slow device/network
- Document optimization rationale in comments
```

### 4. Environment Synchronization
```markdown
**DEPLOYMENT ORDER:**
1. Local dev server test: `npm run dev`
2. Production build test: `npm run build && npm run preview`
3. Staging deploy: `firebase hosting:channel:deploy staging --expires 30d`
4. Staging verification: Test staging URL
5. Production deploy: `firebase deploy --only hosting`
6. Production verification: Test live URL

**SYNC CHECK:**
- Run `./.claude/verify-sync.sh` at session start
- Check staging age: `firebase hosting:channel:list`
- If staging >3 days old, redeploy before production changes
```

---

## ⚠️ Common Anti-Patterns to Avoid

### 1. Premature Optimization
```javascript
// BAD: Adding complexity for theoretical performance
const memoizedValue = useMemo(() => simpleCalculation, [dep]); // If simpleCalculation is O(1)

// GOOD: Memoize expensive operations
const memoizedValue = useMemo(() => expensiveFilter(items), [items]); // If items.length > 100
```

### 2. Over-Engineering
```javascript
// BAD: Creating abstraction for one use case
const createGenericFactory = (type) => ({ ... }); // Only used once

// GOOD: Direct implementation until pattern repeats 3+ times
const specificThing = { type: 'specific', ... };
```

### 3. Incomplete Error Handling
```javascript
// BAD: Silent failures
try { await riskyOperation(); } catch (e) { /* ignore */ }

// GOOD: Meaningful error handling
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  Sentry.captureException(error);
  showUserError('Operation failed. Please try again.');
}
```

### 4. Missing Cleanup
```javascript
// BAD: Event listeners without cleanup
useEffect(() => {
  window.addEventListener('resize', handler);
}, []);

// GOOD: Proper cleanup
useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

---

## 📋 Code Review Checklist

### Functionality
- [ ] Does it solve the stated problem?
- [ ] Are edge cases handled?
- [ ] Does it work on mobile?

### Performance
- [ ] No unnecessary re-renders?
- [ ] Expensive operations memoized?
- [ ] Bundle size acceptable?

### Maintainability
- [ ] Code is readable without extensive comments?
- [ ] Follows existing patterns in codebase?
- [ ] No magic numbers/strings?

### Security
- [ ] No exposed secrets?
- [ ] User input validated?
- [ ] No XSS vulnerabilities?

---

## 🚨 Red Flags That Require Pause

1. **"This is deprecated but..."** → Understand why before using
2. **"Just remove this..."** → Verify nothing depends on it
3. **"Quick fix..."** → Consider long-term implications
4. **"Works on my machine..."** → Test in staging first
5. **"No time to test..."** → Make time or don't ship

---

## 📊 Monitoring & Verification

### Sentry Integration
- DSN configured via `VITE_SENTRY_DSN` env var
- 10% transaction sampling for performance
- User email context added for debugging
- Common non-actionable errors filtered

### Build Verification
```bash
# Check bundle sizes
npm run build 2>&1 | grep -E "\.js|\.css" | tail -20

# Verify no new warnings
npm run build 2>&1 | grep -i "warning\|error"
```

### Deployment Verification
```bash
# List all hosting channels
firebase hosting:channel:list

# Check specific channel
curl -s -o /dev/null -w "%{http_code}" https://yellowcircle-app--staging-*.web.app
```
