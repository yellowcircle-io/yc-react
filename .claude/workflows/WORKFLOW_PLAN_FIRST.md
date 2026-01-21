# Plan-First Workflow

**Use this workflow for any new feature development.**

---

## Overview

Before writing code for a new feature, follow this structured approach to understand existing patterns and plan implementation.

---

## Step 1: Understand Current Architecture

**Prompt Template:**
```
Read the files in src/utils/ and src/components/ to understand patterns.
Don't write code yet. Just tell me:
- What architectural patterns are established?
- Where does new [feature] fit?
- What files touch Firebase?
```

**Actions:**
1. Review existing service files in `src/utils/firestore*.js`
2. Check component patterns in `src/components/`
3. Identify similar features already implemented
4. Note any patterns that should be followed

---

## Step 2: Create Explicit Plan

**Prompt Template:**
```
Before coding, plan for [feature]:
1. New service functions needed (list each)
2. New components needed (list each)
3. Explicit file locations (which layer each piece goes)
4. Firebase integration points (if any)
5. Error handling strategy

Reference existing patterns in CLAUDE.md.
```

**Plan Structure:**
```markdown
## Feature: [Name]

### Service Layer (src/utils/)
- [ ] Function: functionName() in firestoreXxx.js
- [ ] Function: anotherFunction() in firestoreXxx.js

### Component Layer (src/components/)
- [ ] Component: ComponentName.jsx
- [ ] Component: AnotherComponent.jsx

### Context/State (if needed)
- [ ] Context: XxxContext.jsx

### Integration Points
- [ ] Where feature connects to existing code
```

---

## Step 3: Implement Services First

**Prompt Template:**
```
Implement ONLY src/utils/firestore[Feature].js based on plan.
Verify against CLAUDE.md patterns.
Run: npm run lint
Fix any errors before showing output.
```

**Service File Template:**
```javascript
// src/utils/firestoreFeature.js
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

/**
 * Get items for user
 * @param {string} userId
 * @returns {Promise<{success: boolean, items: Array, error: string|null}>}
 */
export async function getItems(userId) {
  try {
    const q = query(collection(db, 'users', userId, 'items'));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, items, error: null };
  } catch (error) {
    return { success: false, items: [], error: error.message };
  }
}
```

---

## Step 4: Implement Components

**Prompt Template:**
```
Implement React components based on plan.
Reference existing components in src/components/ for pattern consistency.
NO Firebase imports allowed in this layer.
Call services layer only.
```

**Component Template:**
```javascript
// src/components/FeatureComponent.jsx
import { useState, useEffect } from 'react';
import { getItems } from '../utils/firestoreFeature';

function FeatureComponent({ userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadItems();
  }, [userId]);

  const loadItems = async () => {
    setLoading(true);
    const result = await getItems(userId);
    if (result.success) {
      setItems(result.items);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}

export default FeatureComponent;
```

---

## Step 5: Verify Implementation

**Verification Checklist:**
```
□ npm run lint passes
□ npm run build succeeds
□ Feature works in dev: npm run dev
□ No Firebase imports in components
□ All async operations have loading/error states
□ Proper cleanup in useEffect (if applicable)
```

---

## Quick Reference

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| Understand | Read existing code | Pattern summary |
| Plan | Design before coding | Implementation plan |
| Services | Firebase operations | Service functions |
| Components | UI layer | React components |
| Verify | Quality checks | Passing tests/lint |
