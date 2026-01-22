# CLAUDE.md Reconciliation & Strategy
## Review of Existing Quality Scope with Tool Integration

---

## Part 1: Review of SCOPE_CODE_QUALITY_RULES.md

Your existing quality scope document is **exceptionally well-structured** and demonstrates mature thinking about AI-generated code governance. Key strengths:

### ✅ Strengths

1. **Pre-Implementation Checklist** - The "read file first, NEVER modify unread code" rule is critical and perfectly captures the single biggest risk with Claude Code.

2. **Explicit Safety Rules** - Dependency management, file modifications, and performance optimization rules are all pattern-based guardrails that prevent hallucination.

3. **Environment Synchronization** - The staged deployment pattern (local → build → staging → production) with verification checks is production-grade thinking.

4. **Sentry Integration** - Already built in for runtime monitoring, excellent complement to static analysis.

5. **Red Flags Section** - The psychological guardrails ("This is deprecated but...", "Works on my machine...") catch human decision-making errors, not just code errors.

6. **Code Review Checklist** - Covers functionality, performance, maintainability, and security systematically.

### ⚠️ Gaps to Address

1. **No Architectural Pattern Definition** - Rules exist but no explicit patterns documented (Clean Architecture, Hexagonal, DDD, etc.). Claude needs explicit models to follow.

2. **Firebase Integration Pattern Undefined** - Multiple mentions of Firebase but no canonical pattern showing how Firebase should be integrated (where it lives, how it's tested, etc.).

3. **No Dead Code/Dependency Cleanup** - Missing tools/practices for detecting accumulated technical debt (depcheck, knip not mentioned).

4. **Testing Strategy Unclear** - References tests but no explicit TDD workflow or testing patterns for Claude to follow.

5. **ESLint Configuration Implicit** - Assumes ESLint exists but no explicit complexity rules, cyclomatic complexity thresholds, or auto-fix configuration documented.

6. **No Refactoring Workflows** - Excellent safety rules but missing explicit workflows for "refactor existing code" scenarios (which is where spaghetti code gets cleaned up).

---

## Part 2: Recommended CLAUDE.md Structure

Here's how to reconcile your existing scope with a comprehensive CLAUDE.md that Claude reads and follows:

```markdown
# CLAUDE.md - Architecture & Code Quality Constitution

**Last Updated:** January 22, 2026  
**Purpose:** Guide Claude Code generation to maintain architecture, prevent spaghetti code, and reduce technical debt

---

## 1. ARCHITECTURE PATTERNS

### Primary Pattern: Clean Architecture + Hexagonal Separation

**Rule:** Firebase integration code NEVER appears in UI components or business logic.

**Structure:**
```
src/
├── components/          # React UI layer (NO Firebase imports allowed)
├── services/firebase/   # External integration layer (Firebase ONLY here)
├── services/auth/       # Business logic layer (pure functions)
├── hooks/               # Custom React hooks (use services, NO Firebase)
├── types/               # TypeScript interfaces (pure data)
└── utils/               # Utilities (pure functions, testable)
```

**Canonical Firebase Service Pattern:**
```typescript
// services/firebase/auth.ts - SINGLE RESPONSIBILITY: Firebase operations only
export async function loginUser(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user, error: null };
  } catch (error) {
    return { success: false, user: null, error: error.message };
  }
}

// ✓ Returns structured result (never throws in services)
// ✓ All Firebase logic isolated here
// ✓ Testable without Firebase (mock services layer in tests)
```

**Component Pattern (React):**
```typescript
// components/LoginForm.tsx - SINGLE RESPONSIBILITY: UI rendering only
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    const result = await loginUser(email, password); // Call service
    
    if (!result.success) {
      setError(result.error);
    } else {
      // Navigation handled by app context/router
      navigate('/dashboard');
    }
    setLoading(false);
  };
  
  return (
    // JSX only - NO Firebase code, NO business logic
  );
}

// ✓ Firebase code completely separated
// ✓ Clear loading/error state management
// ✓ Single responsibility: render UI
```

**Testing Pattern:**
```typescript
// services/firebase/__tests__/auth.test.ts
describe('Firebase Auth Service', () => {
  test('loginUser returns success on valid credentials', async () => {
    const result = await loginUser('test@example.com', 'password123');
    expect(result.success).toBe(true);
  });
  
  test('loginUser returns error on invalid credentials', async () => {
    const result = await loginUser('test@example.com', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// components/__tests__/LoginForm.test.tsx
test('LoginForm shows error message on login failure', async () => {
  // Mock service layer
  jest.mock('../../services/firebase/auth', () => ({
    loginUser: jest.fn().mockResolvedValue({ 
      success: false, 
      error: 'Invalid credentials' 
    })
  }));
  
  render(<LoginForm />);
  // Test UI behavior, NOT Firebase behavior
});
```

---

## 2. FORBIDDEN PATTERNS (Non-Negotiable)

### Code Structure Violations

- ❌ `import firebase from 'firebase'` in any file EXCEPT `services/firebase/*`
- ❌ `useEffect(() => { firebase.auth().onSnapshot(...) })` (Firebase in components)
- ❌ Nested ternaries (max 1 level: `a ? b : c`)
- ❌ Component files > 30 lines (not 200)
- ❌ Props object with >5 properties (use composition or context)
- ❌ Async operations without explicit loading/error state
- ❌ Hardcoded values except string literals (`config` object for environment values)
- ❌ Mixing async/await and promises in same file (pick one pattern)
- ❌ Multiple responsibilities in single function

### Dependency Violations

- ❌ Unused imports (ESLint: no-unused-vars error)
- ❌ Unused dependencies in package.json (knip will flag)
- ❌ Transitive dependency usage (must be in package.json explicitly)

### Error Handling Violations

- ❌ Silent failures: `try { risky(); } catch(e) { /* ignore */ }`
- ❌ Unhandled promise rejections
- ❌ Missing loading states in async operations

---

## 3. REQUIRED PATTERNS

### Before ANY Code Change

```
□ Read file(s) first - NEVER modify unread code
□ Check existing patterns in related files
□ Run `npm run lint` before changes
□ Verify build succeeds: `npm run build`
□ Test locally before committing
```

### Code Quality Thresholds

- **Cyclomatic Complexity:** Max 5 per function (ESLint: complexity rule)
- **Function Length:** Max 30 lines (forces single responsibility)
- **Test Coverage:** 80%+ for services/, 50%+ for UI components
- **Unused Variables:** 0 allowed
- **Unused Imports:** 0 allowed
- **Type Safety:** `noImplicitAny: true`, `strictNullChecks: true`

### Verification Steps (MANDATORY BEFORE COMMIT)

```bash
npm run typecheck    # TypeScript compilation - catches type errors
npm run lint         # ESLint with complexity rules - catches patterns
npm run test:unit    # Unit tests - validates correctness
npm run test:coverage # Shows coverage gaps
npm run build        # Production build - catches tree-shaking issues
```

If any step fails, code is not complete.

---

## 4. WORKFLOW: Plan-First for New Features

**Use this workflow for any feature Claude proposes:**

### Step 1: Understand Current Architecture
```
"Read the files in services/ and components/ to understand patterns.
Don't write code yet. Just tell me:
- What architectural patterns are established?
- Where does new [feature] fit?
- What files touch Firebase?"
```
[You read summary → iterate if needed]

### Step 2: Make Explicit Plan
```
"Before coding, use EXTENDED THINKING mode.
Plan for [feature]:
1. New service functions needed (list each)
2. New components needed (list each)
3. Explicit file locations (which layer each piece goes)
4. Firebase integration points (if any)
5. Test strategy (what to test, where)

Reference existing patterns in CLAUDE.md."
```
[You review plan → approve or iterate]

### Step 3: Implement Services Layer First
```
"Implement ONLY services/firebase/[feature].ts based on plan.
Verify against CLAUDE.md patterns.
Run: npm run typecheck && npm run lint
Fix any errors before showing output."
```

### Step 4: Test Services
```
"Write tests for services/firebase/[feature].ts.
Ensure 100% coverage of happy path + error cases.
All tests must pass before moving to components."
```

### Step 5: Implement Components
```
"Implement React components based on plan.
Reference existing components in components/ for pattern consistency.
NO Firebase imports allowed in this layer.
Call services layer only."
```

---

## 5. WORKFLOW: Refactoring Existing Code

When you notice spaghetti code:

```
"Refactor [FILENAME] according to CLAUDE.md:

1. Check forbidden patterns - remove any violations
2. Split if >30 lines - break into smaller functions
3. Extract Firebase logic - move to services/ if present
4. Add error handling - for all async operations
5. Verify patterns - against cyclomatic complexity rules
6. Write/update tests - for all functions

After refactoring, run:
  npm run typecheck && npm run lint && npm run test:unit

Show me summary of changes and why."
```

---

## 6. WORKFLOW: Test-Driven Refactoring

For fixing hallucinated code:

```
"FIRST: Write tests that would FAIL on current code but PASS on refactored code.
SECOND: Implement code to pass tests.
THIRD: Commit.

Goal: [specific refactoring target]

Write tests now. Make them VERY SPECIFIC about the expected interface."
```

Tests prevent over-engineering and validate pattern compliance.

---

## 7. COMMON MISTAKES I'VE SEEN CLAUDE MAKE

### 1. Firebase + UI Coupling
**Problem:** `onSnapshot()` directly in component
```javascript
// ❌ WRONG
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, 'users'), (snap) => {
    setUsers(snap.docs.map(d => d.data()));
  });
  return unsubscribe;
}, []);
```

**Fix:** Fetch in effect, store in state, return data only
```javascript
// ✓ RIGHT
useEffect(() => {
  loadUsers();
}, []);

const loadUsers = async () => {
  const result = await getUsers(); // services/firebase/users.ts
  setUsers(result.users);
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
// ✓ RIGHT
const displayUserName = (name) => name.toUpperCase();
// Implement inline until pattern repeats
```

### 4. Async Race Conditions
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
  setLoading(true);
  const results = await searchUsers(query);
  setResults(results);
  setLoading(false);
};
```

### 5. Props Drilling
**Problem:** Passing 8+ props through component tree
```javascript
// ❌ WRONG
<Parent user={user} setUser={setUser} theme={theme} ... />
```

**Fix:** Use Context API or composition
```javascript
// ✓ RIGHT
const UserContext = createContext();
<UserContext.Provider value={{ user, setUser }}>
  <Parent />
</UserContext.Provider>
```

---

## 8. RED FLAGS - When to PAUSE Claude

1. **"This is deprecated but..."** → Understand why FIRST
2. **"Just remove this..."** → Verify nothing depends on it with grep
3. **"Quick fix..."** → Consider long-term implications
4. **"Works on my machine..."** → Must test in staging
5. **"I'll add the types later..."** → NO - do it now

---

## 9. DEPLOYMENT CHECKLIST

### Before Deployment

```
□ Verify staging matches local: firebase hosting:channel:list
□ Deploy to staging: firebase hosting:channel:deploy staging --expires 30d
□ Test staging URL thoroughly
□ Run build size check: npm run build 2>&1 | grep -E "\\.js|\\.css"
□ Check no new warnings: npm run build 2>&1 | grep -i "warning\\|error"
```

### Production Deployment

```
□ Deploy to production: firebase deploy --only hosting
□ Verify production URL: curl -I https://yellowcircle-app.web.app
□ Check Sentry for errors (5 min window)
□ Test key user flows on production
```

---

## 10. VERIFICATION SCRIPTS

### Session Startup
```bash
# At start of Claude session
./.claude/verify-sync.sh  # Custom script - check staging age, etc.
```

### Automated Checks
```bash
# Run before ANY commit
npm run typecheck && npm run lint && npm run test:unit && npm run build
```

### Build Verification
```bash
npm run build 2>&1 | grep -E "\\.js|\\.css" | tail -20  # Size report
npm run build 2>&1 | grep -i "error"                     # Errors only
```

---

## 11. MONITORING & OBSERVABILITY

### Sentry Configuration
- DSN: `VITE_SENTRY_DSN` environment variable
- Transaction sampling: 10% (performance monitoring)
- User context: Email added for debugging
- Non-actionable errors: Filtered

### Performance Monitoring
- Monitor bundle size trends (Vite build output)
- Check lazy loading effectiveness
- Monitor Firebase operations timing

---

## 12. WHEN CLAUDE HALLUCINATES (What to Do)

**Signs of hallucination:**
1. Unnecessary abstractions (factories, config layers)
2. Inconsistent patterns (error handling differs)
3. Mixed concerns (Firebase + UI)
4. Same issue fixed 3+ times

**Recovery steps:**
1. Use `/clear` in Claude Code to reset context
2. Start fresh with explicit plan
3. OR use multi-Claude pattern (one writes, new one reviews)

---

## Tools Already Configured (Don't Modify)

- ✅ ESLint: complexity rules, no-unused-vars, explicit return types
- ✅ TypeScript: strict mode, noImplicitAny, strictNullChecks
- ✅ Vite: tree-shaking enabled, build optimization
- ✅ Firebase: staging channels, production channels
- ✅ Sentry: error tracking + performance monitoring

---

## Tools To Add (Optional But Recommended)

- **knip** (v3.x): Detect unused dependencies, exports, files
- **depcheck**: Simpler alternative to knip (legacy but lighter)
- Both run once weekly in CI, or manually: `npx knip` / `npx depcheck`

---

## References

- Existing scope: SCOPE_CODE_QUALITY_RULES.md (deployment, Sentry)
- Firebase patterns: services/firebase/ (canonical implementations)
- Component patterns: components/ (reference implementations)
- Test patterns: **/*.test.ts (reference tests)

```

---

## Part 3: depcheck vs knip - Value Analysis

Now let me create a detailed comparison document:

```markdown
# depcheck vs knip: Technical Comparison & Recommendation

---

## Quick Summary

| Aspect | depcheck | knip |
|--------|----------|------|
| **Scope** | Unused dependencies only | Dependencies + exports + files + dead code |
| **Monorepo** | ❌ No | ✅ Yes, first-class support |
| **Maintenance** | ⚠️ Maintenance mode (2020+) | ✅ Active development (2024+) |
| **Configuration** | Simple | More complex but auto-detects most |
| **False Positives** | High (40%+ in modern projects) | Lower (20-30%) |
| **Performance** | Fast | Slower (but acceptable) |
| **Auto-fix** | ❌ No | ✅ Yes (--fix flag) |
| **Production Mode** | ❌ No | ✅ Yes (strict production-only analysis) |
| **Industry Adoption** | Still used but declining | Growing rapidly (2024+) |
| **Recommended for** | Simple projects, quick audit | Complex projects, ongoing CI use |

---

## What depcheck Does

**Scope:** Detects only **unused dependencies** in package.json

```bash
npx depcheck

# Output:
# Unused dependencies
# * @storybook/addon-a11y
# * @types/jest
# * lodash
# 
# Missing dependencies
# * express (used but not in package.json)
```

### depcheck Strengths
1. **Lightweight** - Fast execution, minimal false positives on simple projects
2. **Simple output** - Clear list of unused packages to remove
3. **No configuration needed** - Works out of the box for 80% of projects
4. **Good for quick audits** - Run once, see what can be removed

### depcheck Limitations
1. **Maintenance mode** - No monorepo support, no recent updates
2. **High false positives in modern setups** - Struggles with:
   - TypeScript decorators
   - Webpack plugins referenced in config
   - ESLint/Prettier/Babel plugins (declared but referenced in config)
   - Dynamic imports
3. **Only sees package level** - Can't find unused exports within packages
4. **Can't detect dead code** - Only dependency-level visibility
5. **No auto-fix** - You must manually uninstall packages

**Recommended use:** One-time audit of small projects or quick "what can I remove?"

---

## What knip Does

**Scope:** Detects **dependencies + exports + files + dead code**

```bash
npx knip

# Output:
# Unused dependencies
# src/config.ts: 'lodash'
# src/utils.ts: 'axios'
#
# Unused files
# src/legacy/oldComponent.tsx
# src/utils/deprecated.ts
#
# Unused exports
# src/services/auth.ts: export function unusedHelper()
# src/types.ts: export interface LegacyType
#
# Missing dependencies
# src/main.ts: 'express' used but not in package.json
```

### knip Strengths

1. **Comprehensive analysis** - Not just dependencies, but exports and files
2. **Production mode** - `knip --production` shows only what matters to users
3. **Active development** - Monorepo support, TypeScript, modern tooling
4. **Auto-fix capability** - `knip --fix` removes dependencies, deletes files, removes exports
5. **Better accuracy** - Lower false positive rate (20-30% vs 40%+)
6. **Built-in plugins** - Understands Jest, ESLint, Webpack, Vite, etc. automatically
7. **Monorepo-aware** - Tracks dependencies across multiple packages
8. **CI integration** - Can fail builds if dead code detected (enforces cleanliness)

### knip Limitations

1. **Slower than depcheck** - Builds full AST (abstract syntax tree)
2. **More configuration needed** - Though much better than alternatives
3. **Can have false positives** - Still reports issues that may be intentional
4. **Not recommended for immediate auto-fix** - Review before using `--fix`

### knip Real-World Usage

**From research:** Developer removed **120 unused dependencies** from Nx monorepo using knip
- Initial scan: 40% false positives
- After config tuning: 5-10% false positives
- Time to clean: ~1 week of part-time work
- Value: Reduced install times, smaller node_modules, cleaner codebase

---

## Why knip Wins for Your Use Case

Given your Claude Code + Firebase web app context:

1. **Detects hallucinated abstractions**
   - Claude sometimes creates unused utility functions
   - knip finds them (depcheck misses entirely)

2. **Prevents dead code accumulation**
   - As you refactor, old exports linger
   - knip's export detection catches these
   - depcheck doesn't see them

3. **Unused file detection**
   - Claude sometimes creates extra files that aren't imported
   - knip finds orphaned files
   - depcheck doesn't care

4. **Production mode**
   - `knip --production` shows what actually ships to users
   - Helps ensure refactoring didn't break prod dependencies

5. **Auto-fix reduces manual work**
   - For obvious cases, `knip --fix` removes clutter
   - Requires review but saves hours of manual deletion

---

## Integration Recommendation

### Use Both in Layered Approach

```bash
# Quick weekly check (depcheck)
npx depcheck --specials=babel,eslint,jest,prettier

# Deep monthly cleanup (knip)
npx knip --production --reporter json > knip-report.json
# Review report, then:
npx knip --fix  # Auto-removes unused
```

### Or Just Use knip (Recommended)

```bash
# Setup once
npm install --save-dev knip
echo '{}' > knip.config.ts  # Empty config, auto-detection works

# Run regularly
npx knip                     # Full analysis
npx knip --production        # Production deps only
npx knip --fix              # Auto-fix (review changes)
```

---

## Recommended CI Integration

Add to package.json:

```json
{
  "scripts": {
    "check:deps": "knip --production",
    "check:deps:fix": "knip --fix"
  }
}
```

Add to CI/CD (GitHub Actions):

```yaml
- name: Check for dead code
  run: npm run check:deps
  # Will fail if unused deps detected
```

This prevents Claude from adding dependencies that aren't actually used (or removing them when they are).

---

## My Recommendation

**Use knip for your Claude Code workflow:**

1. **In CLAUDE.md, add:**
   ```markdown
   ### Before Committing
   □ Run `npm run check:deps` to ensure no dead code
   □ Review knip report, iterate if needed
   ```

2. **Add knip to your lint workflow:**
   ```bash
   npm run typecheck && npm run lint && npm run test && npm run check:deps
   ```

3. **Use knip --production weekly** to catch accumulation

4. **Never run knip --fix without review** (can be destructive)

This catches hallucinated abstractions, dead code, and orphaned files before they become technical debt.

---

## When to Use Each

### Use depcheck if:
- Simple project (<50 dependencies)
- Quick one-time audit needed
- Don't care about dead code/exports
- Want minimal configuration

### Use knip if:
- Growing codebase with Claude Code
- Want to prevent technical debt
- Using monorepo structure
- Want production-aware analysis
- Need auto-fix capabilities

**For your use case: Use knip.**
```

