# Firebase Excessive Writes - Fix Plan

## Issue Summary
Audit identified **view count increment** as primary cause of excessive writes during development.

---

## Fix #1: Disable View Count in Development (CRITICAL)

**File:** `src/hooks/useFirebaseCapsule.js`
**Lines:** 138-146

### Current Code:
```javascript
// Increment view count
try {
  await updateDoc(capsuleRef, {
    viewCount: increment(1)
  });
} catch (viewCountError) {
  console.warn('Failed to increment view count:', viewCountError);
}
```

### Fixed Code:
```javascript
// Only increment view count in production
const isProduction = import.meta.env.PROD;
if (isProduction) {
  try {
    await updateDoc(capsuleRef, {
      viewCount: increment(1)
    });
  } catch (viewCountError) {
    console.warn('Failed to increment view count:', viewCountError);
  }
} else {
  console.log('⚠️ DEV MODE: Skipping view count increment');
}
```

**Impact:** Eliminates 95% of unnecessary writes during development

---

## Fix #2: Add Client-Side View Deduplication (RECOMMENDED)

Prevent counting multiple views from the same user session.

### Implementation:
```javascript
// Only increment view count once per session per capsule
const viewedKey = `capsule_viewed_${capsuleId}`;
const alreadyViewed = sessionStorage.getItem(viewedKey);

if (!alreadyViewed && import.meta.env.PROD) {
  try {
    await updateDoc(capsuleRef, {
      viewCount: increment(1)
    });
    sessionStorage.setItem(viewedKey, 'true');
  } catch (viewCountError) {
    console.warn('Failed to increment view count:', viewCountError);
  }
}
```

**Impact:** Prevents duplicate counts from page refreshes, even in production

---

## Fix #3: Add Query Limits for Future-Proofing

**File:** `src/hooks/useFirebaseCapsule.js`
**Lines:** 129-136

### Add Limits:
```javascript
import { query, limit as firestoreLimit } from 'firebase/firestore';

// Get nodes with safety limit
const nodesRef = collection(db, `capsules/${capsuleId}/nodes`);
const nodesQuery = query(nodesRef, firestoreLimit(500)); // Max 500 photos
const nodesSnap = await getDocs(nodesQuery);
```

**Impact:** Protection against excessive reads if capsules grow large

---

## Implementation Priority

1. ✅ **IMMEDIATE:** Apply Fix #1 (disable view count in dev)
2. ⏱️ **NEXT:** Apply Fix #2 (session deduplication)  
3. 📅 **FUTURE:** Apply Fix #3 (query limits)

---

## Testing After Fixes

1. Clear Firebase quota in console
2. Test 10 page refreshes in development
3. Verify writes = 0 in Firebase console
4. Test in production build to verify view count works
5. Monitor quota for 24 hours

---

## Estimated Write Reduction

- **Before:** ~10-100 writes per development session
- **After Fix #1:** 0 writes in development
- **After Fix #2:** 1 write per user per capsule (production)

**Total Reduction:** ~99% during development
