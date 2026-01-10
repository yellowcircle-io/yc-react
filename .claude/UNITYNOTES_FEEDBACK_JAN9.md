# UnityNotes Feedback & Issues - January 9, 2026

## Source: User Testing (Local Environment)

---

## Critical Issues (Data Loss / Broken Features)

### 1. Cannot Add Photo Node
- **Severity:** Critical
- **Platforms:** Local + Production (Chrome)
- **Status:** Not Working
- **Notes:** Core functionality blocked

### 2. Saving Cooldown Too Aggressive
- **Severity:** Critical
- **Impact:** Data/nodes lost if refresh occurs too quickly
- **Current:** Rate limiting causes data loss
- **Recommendation:** Reduce cooldown period, implement pending save queue
- **Applies to:** Local (needs scope/test before Production)

---

## Functional Bugs

### 3. Extra Space on Notes/Link Nodes
- **Severity:** Medium
- **Visual:** Excessive padding/margin around node content
- **Screenshot:** Link node showing extra whitespace around content area

### 4. Group Node Touch Target Oddity
- **Severity:** Medium
- **Screenshot:** Shows gray resize handles extending beyond expected area
- **Issue:** Touch/click targets not aligned with visual boundaries

### 5. Sticky Note Lacks Function
- **Severity:** Medium
- **Issues:**
  - Missing proper touch interaction
  - Core editing functionality incomplete
  - May not respond to expected gestures

### 6. Theme/Background Toggle Not Working
- **Severity:** Medium
- **Issue:** Theme selector doesn't change anything beyond minimap
- **Root Cause:** ThemeContext created but UnityNotesPage not fully migrated
- **Status:** Foundation implemented, migration incomplete (~70-80 hardcoded colors remain)

---

## Feature Gaps / Incomplete Architecture

### 7. TripPlanner Node - List Function Incomplete
- **Severity:** Medium
- **Issue:** List function doesn't populate/update based on related todo lists
- **Missing:**
  - Manual list population
  - Automatic list sync from todo nodes
- **Status:** Architecture never completed

### 8. Video Node - Limited Platform Support
- **Severity:** Low-Medium
- **Current:** Only YouTube/Vimeo supported
- **Requested:** Instagram video support (at minimum)
- **Additional:** Fullscreen support needed
- **Applies to:** Will affect Production after implementation

### 9. Multi-Select Mode Broken
- **Severity:** Medium
- **Issue:** Cannot select multiple nodes simultaneously via mouse or touch/mobile
- **Action:** Scope, retest, reimplement selection method

---

## Design Debt

### 10. Hardcoded Colors Need Harmonization
- **Severity:** Low
- **Issue:** Colors were implemented randomly, from templates
- **Goal:** Streamline to yellowCircle brand palette
- **Scope:** ~80-100 hardcoded color values in UnityNotesPage alone
- **Related:** Theme system migration (partially complete)

---

## Priority Order for Fixes

1. **P0 - Critical:** Photo Node creation broken
2. **P0 - Critical:** Saving cooldown causing data loss
3. **P1 - High:** Theme toggle not working
4. **P1 - High:** Multi-select mode broken
5. **P2 - Medium:** Extra space on nodes (visual)
6. **P2 - Medium:** Group node touch targets
7. **P2 - Medium:** Sticky note interactions
8. **P3 - Lower:** Video platform support expansion
9. **P3 - Lower:** TripPlanner list sync
10. **P3 - Lower:** Color harmonization

---

## Screenshots Reference

| Issue | Screenshot |
|-------|------------|
| Link node extra space | User-provided (shows Poutineville link) |
| Group node touch targets | User-provided (shows gray handles) |

---

## Next Steps

1. Investigate Photo Node creation failure
2. Review Firestore rate limiting implementation
3. Complete theme system migration
4. Test and fix multi-select functionality
