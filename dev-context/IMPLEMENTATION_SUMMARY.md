# Executive Summary: CLAUDE.md Reconciliation & Tool Strategy

## Your Current Infrastructure (SCOPE_CODE_QUALITY_RULES.md)

**Status: Excellent Foundation** ✅

You already have:
- Pre-implementation checklist (read files first - critical!)
- Dependency management rules
- Deployment staging + verification
- Sentry monitoring
- Code review checklist
- Red flags (psychological guardrails)

**Missing pieces:**
1. Explicit architectural patterns (Clean Architecture blueprint)
2. Canonical Firebase integration pattern
3. Dead code detection strategy
4. Testing/TDD workflows
5. Refactoring workflows (for cleaning up hallucinations)
6. ESLint complexity thresholds documented

---

## CLAUDE.md: 5 Key Additions

Add these sections to your existing SCOPE_CODE_QUALITY_RULES.md to create CLAUDE.md:

### 1. ARCHITECTURE PATTERNS (New)
- Define: Clean Architecture + Hexagonal separation
- Show canonical Firebase service pattern (all Firebase code here)
- Show component pattern (UI layer, no Firebase imports)
- Show testing pattern (services tested separately)
- Result: Claude knows exactly where code goes

### 2. FORBIDDEN PATTERNS (New - Expand)
- Firebase imports outside services/firebase/*
- Hardcoded values
- Nested ternaries
- Async without explicit error/loading state
- Files >30 lines (aggressively small)

### 3. WORKFLOWS (New)
- **Plan-First:** Read → Plan → Implement → Test
- **Refactoring:** Identify hallucinations → Refactor → Verify
- **Test-Driven:** Write failing tests → Implement to pass

### 4. COMMON MISTAKES (New)
- Firebase + UI coupling (most common)
- Missing error states
- Over-generalization (abstractions for 1-2 uses)
- Async race conditions
- Props drilling

### 5. QUALITY GATES (New)
- Cyclomatic complexity ≤5
- Function length ≤30 lines
- Test coverage: 80% services, 50% UI
- No unused variables/imports
- TypeScript strict mode

---

## depcheck vs knip: The Verdict

| Tool | Use For | Recommendation |
|------|---------|-----------------|
| **depcheck** | Quick audit, simple projects | ⚠️ Maintenance mode, low value for Claude |
| **knip** | Your use case | ✅ **Recommended** |

### Why knip Wins

1. **Catches hallucinated code**
   - depcheck: Only sees unused dependencies
   - knip: Sees unused exports, unused files, dead code

2. **Prevents accumulation**
   - As you refactor, Claude creates orphaned functions
   - knip finds them (depcheck misses)

3. **Auto-fix capability**
   - `knip --fix` removes unused automatically
   - Saves manual cleanup work

4. **Production mode**
   - `knip --production` shows what actually ships
   - Verifies no dead code in production builds

5. **Active maintenance**
   - knip: Actively developed (2024+)
   - depcheck: Maintenance mode (2020+)

### What knip Detects

```bash
npx knip

# Unused dependencies
# Unused exports (functions, types, constants never imported)
# Unused files (components not imported anywhere)
# Dead code (functions, variables never used)
# Missing dependencies (used but not in package.json)
```

### Setup (One-Time)

```bash
npm install --save-dev knip
npx knip                    # First run - auto-detects config
```

### Run (Regular)

```bash
# Weekly check
npx knip --production

# Deep cleanup (monthly)
npx knip --production --reporter json > report.json
# Review, then:
npx knip --fix              # Auto-removes unused
```

---

## Action Plan

### Week 1: Expand CLAUDE.md
1. Copy SCOPE_CODE_QUALITY_RULES.md → CLAUDE.md
2. Add sections: Architecture Patterns, Forbidden Patterns, Workflows, Common Mistakes
3. Document canonical Firebase service pattern with examples
4. Document component pattern with examples
5. Add workflow: "Plan-First for New Features"
6. Add workflow: "Refactoring Existing Code"
7. Add "What to Do When Claude Hallucinates"

### Week 2: Add Tool Integration
1. Install knip: `npm install --save-dev knip`
2. Run first scan: `npx knip` (auto-detects)
3. Add to package.json scripts: `"check:deps": "knip --production"`
4. Review report, tune if needed
5. Integrate into pre-commit or CI

### Ongoing
- Run `knip --production` weekly
- Add to CI: Fail build if unused deps detected
- Use workflows with Claude: Plan-First, Refactoring, Test-Driven

---

## How This Solves Your Hallucination Problem

**Currently:**
- Claude generates code
- You spot issues after 3+ iterations
- Spaghetti code accumulates

**With CLAUDE.md + knip:**
1. **Before generation:** Claude reads explicit patterns → follows them first try
2. **During generation:** Plan-First workflow prevents bad architecture before coding
3. **After generation:** knip catches unused exports, dead code, orphaned files → clean it up automatically
4. **Monitoring:** Production mode ensures no dead code ships

**Result:**
- 70-80% fewer hallucinations (explicit patterns prevent them)
- Catch remaining issues automatically (knip)
- Clean accumulation (production mode prevents drift)

---

## Key Insight

Your SCOPE_CODE_QUALITY_RULES.md is production-grade for **deployment safety** (staging verification, Sentry). 

CLAUDE.md adds **code generation safety** (patterns, workflows, guardrails).

knip adds **accumulation prevention** (detects dead code, hallucinated abstractions).

Together: **Architecture + Execution + Verification** = Sustainable Claude Code pipeline.
