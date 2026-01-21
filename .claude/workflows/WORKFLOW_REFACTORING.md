# Refactoring Workflow

**Use this workflow when cleaning up existing code.**

---

## Overview

Safe refactoring follows a structured approach: analyze, plan, implement incrementally, verify at each step.

---

## When to Use This Workflow

- Cleaning up code that violates CLAUDE.md patterns
- Extracting Firebase operations from components
- Splitting large files into smaller ones
- Improving error handling
- Removing dead code

---

## Step 1: Analyze Current State

**Prompt Template:**
```
Analyze [FILENAME] for refactoring:
1. What patterns does it violate from CLAUDE.md?
2. What dependencies does it have?
3. What depends on it?
4. What's the risk of breaking changes?
```

**Analysis Checklist:**
```
□ Firebase imports in non-service files?
□ Missing loading/error states?
□ Nested ternaries?
□ File > 200 lines?
□ Silent error handling?
□ Missing useEffect cleanup?
```

---

## Step 2: Plan Refactoring

**Before making changes:**
1. List all files that import the target file
2. Identify the specific changes needed
3. Determine if changes break the public API
4. Plan incremental steps

**Plan Template:**
```markdown
## Refactoring: [Filename]

### Current Issues
- Issue 1: Description
- Issue 2: Description

### Files That Import This
- File 1
- File 2

### Refactoring Steps
1. Step 1 (non-breaking)
2. Step 2 (non-breaking)
3. Step 3 (update importers if needed)

### Breaking Changes
- None / List any API changes
```

---

## Step 3: Implement Incrementally

**Rule:** One change at a time, verify after each.

### Extracting Firebase to Service Layer

**Before (in component):**
```javascript
// ❌ Component with Firebase
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

function MyComponent() {
  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'items'));
      setItems(snapshot.docs.map(d => d.data()));
    };
    fetchData();
  }, []);
}
```

**After (service layer):**
```javascript
// ✓ Service file: src/utils/firestoreItems.js
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function getItems() {
  try {
    const snapshot = await getDocs(collection(db, 'items'));
    return { success: true, items: snapshot.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (error) {
    return { success: false, items: [], error: error.message };
  }
}

// ✓ Component: src/components/MyComponent.jsx
import { getItems } from '../utils/firestoreItems';

function MyComponent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const result = await getItems();
    if (result.success) {
      setItems(result.items);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };
}
```

---

## Step 4: Verify After Each Change

**After EVERY refactoring step:**
```bash
npm run lint        # Check for errors
npm run build       # Verify production build
npm run dev         # Test locally
```

**If anything fails:** Revert the last change and try a different approach.

---

## Step 5: Clean Up

After refactoring is complete:
```bash
npm run deadcode    # Check for newly unused code
npm run lint        # Final lint check
npm run build       # Final build verification
```

---

## Common Refactoring Patterns

### Pattern 1: Add Error Handling

**Before:**
```javascript
const data = await fetchSomething();
setData(data);
```

**After:**
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const loadData = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await fetchSomething();
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
};
```

### Pattern 2: Add useEffect Cleanup

**Before:**
```javascript
useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []);
```

**After:**
```javascript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Pattern 3: Flatten Nested Ternaries

**Before:**
```javascript
return isLoading ? <Loader /> : error ? <Error /> : data ? <Data /> : <Empty />;
```

**After:**
```javascript
if (isLoading) return <Loader />;
if (error) return <Error message={error} />;
if (!data || data.length === 0) return <Empty />;
return <Data items={data} />;
```

---

## Refactoring Checklist

Before starting:
```
□ Analyzed current state
□ Listed all dependencies
□ Planned incremental steps
□ Identified breaking changes
```

During refactoring:
```
□ One change at a time
□ Verify after each change
□ Keep commits small
```

After completing:
```
□ All lint checks pass
□ Build succeeds
□ Feature still works
□ No new dead code introduced
```
