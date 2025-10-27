# Firebase Quota Exceeded - Critical Issue

**Date:** October 18, 2025
**Status:** 🔴 BLOCKING - Firestore write quota exceeded
**Impact:** SHARE button cannot save capsules to Firebase

---

## Issue Summary

Firebase Console shows: **"Quota exceeded."**

This explains why the SHARE button is stuck showing "SAVING..." - Firebase is rejecting all write attempts because the free tier limit has been reached.

---

## Firebase Spark Plan Limits

### Monthly Quotas:
- **Document Writes:** 20,000/month ❌ EXCEEDED
- **Document Reads:** 50,000/month
- **Document Deletes:** 20,000/month
- **Stored Data:** 1 GB
- **Network Egress:** 10 GB/month

---

## Root Cause Analysis

Based on previous audits (SAVE-FUNCTIONALITY-AUDIT.md and FIREBASE-COST-ANALYSIS.md), we determined:

1. ✅ **Auto-save was removed** - No longer writing every 3 seconds
2. ✅ **Manual SHARE only** - Current implementation
3. ❌ **Still exceeded quota** - Despite removal of auto-save

### Possible Causes:

**1. Testing/Development Writes (Most Likely)**
- Multiple test saves during development
- Each save with 10 photos = 16 writes (1 metadata + 10 nodes + 5 edges)
- 10-20 test sessions × 5 saves each = 800-1,600 writes
- Multiple developers/computers testing = multiplies usage

**2. Old Auto-Save Data (If removed recently)**
- If auto-save was running before removal, it may have already consumed quota
- Previous sessions with 3,000+ writes each would hit limit quickly

**3. Creating New Capsules Instead of Updating**
- Current implementation creates NEW capsule on every SHARE click
- Each new capsule = full 16 writes
- If user clicked SHARE 10 times = 160 writes
- Recommendation in audit to use UPDATE mode not yet implemented

---

## Immediate Solutions

### Option 1: Upgrade to Firebase Blaze Plan (Pay-as-you-go) ⭐ RECOMMENDED

**Cost:**
- $0.18 per 100,000 writes
- Even with 50,000 writes/month = **$0.09/month**
- Very affordable for development

**Benefits:**
- ✅ No more quota blocks
- ✅ Can continue development
- ✅ Can test freely
- ✅ Scalable for production

**Setup:**
1. Go to Firebase Console → Project Settings
2. Click "Upgrade Project"
3. Select Blaze Plan
4. Set budget alert at $5/month (safety net)

---

### Option 2: Wait Until Next Month (Free)

**Timeline:**
- Quota resets on calendar month (likely November 1st)
- ~12 days until reset

**Workarounds while waiting:**
- ✅ localStorage still works (unlimited, local only)
- ✅ Export/Import JSON works (local file backup)
- ❌ SHARE button won't work (cloud save blocked)
- ❌ Shareable URLs won't work

---

### Option 3: Delete Old Capsule Data to Free Up Space

**Not Recommended:**
- Deletes count against quota too (20,000 delete limit)
- Won't reset write quota (quota is based on writes, not storage)
- Only helps if storage (1 GB) is the issue, not write quota

---

## Temporary Code Fix: Better Error Message

Currently, the SHARE button shows "SAVING..." forever because Firebase silently rejects quota-exceeded writes.

**Recommended Enhancement:**
```javascript
const handleSaveAndShare = async () => {
  if (nodes.length === 0) {
    alert('⚠️ Please add at least one photo before saving');
    return;
  }

  try {
    // ... existing serialization code ...

    const capsuleId = await saveCapsule(serializableNodes, serializableEdges, {
      title: 'UK Travel Memories'
    });

    // ... rest of success handling ...
  } catch (error) {
    console.error('❌ Save failed:', error);

    // Check for quota exceeded error
    if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
      alert(
        '🔴 Firebase quota exceeded!\n\n' +
        'The free tier limit (20,000 writes/month) has been reached.\n\n' +
        'Options:\n' +
        '1. Upgrade to Blaze plan ($0.18/100k writes)\n' +
        '2. Wait until next month for quota reset\n' +
        '3. Use EXPORT to save locally as JSON\n\n' +
        'Your work is still saved locally in your browser.'
      );
    } else if (error.message.includes('permission-denied')) {
      alert('❌ Permission denied. Please check Firebase security rules.');
    } else {
      alert(`❌ Failed to save: ${error.message}\n\nPlease check the console for details.`);
    }
  }
};
```

---

## Additional Issues from Screenshots

### YC Logo Positioning
**Issue:** Logo appears to be cut off or misplaced in sidebar
**Current Code:** Lines 959-998 in TimeCapsulePage.jsx
**Investigation Needed:** May need to adjust z-index or positioning

### Hamburger Menu on Firefox
**Issue:** Menu not visible/clickable on Firefox
**Current Code:** Lines 1332-1380 in TimeCapsulePage.jsx
**Investigation Needed:** Firefox-specific z-index or rendering issue

---

## Recommended Immediate Actions

1. **Check Firebase Console Usage Tab:**
   - Go to Firebase Console → Usage
   - Verify which quota is exceeded (writes vs reads vs storage)
   - Check when quota resets

2. **Upgrade to Blaze Plan (Recommended):**
   - Minimal cost (~$0.10-0.50/month for development)
   - Enables continued development
   - Set budget alerts to prevent overspending

3. **Implement Better Error Handling:**
   - Detect quota exceeded errors
   - Show helpful message to user
   - Suggest alternatives (Export, wait, upgrade)

4. **Implement UPDATE Logic (Prevents future quota waste):**
   - Check if `currentCapsuleId` exists
   - Use `updateCapsule` instead of `saveCapsule`
   - Reduces writes by ~25% per subsequent save

5. **Add Client-Side Rate Limiting:**
   - Prevent multiple rapid SHARE clicks
   - Debounce save button (prevent double-clicks)
   - Track daily save count in localStorage

---

## Firebase Console Next Steps

### To Check Current Usage:
1. Open Firebase Console
2. Navigate to **Usage & Billing** tab
3. View breakdown:
   - Document Reads: ?/50,000
   - Document Writes: ?/20,000 ❌ EXCEEDED
   - Document Deletes: ?/20,000
   - Storage: ?/1 GB

### To Upgrade:
1. Project Settings → Usage & Billing
2. Click "Modify plan"
3. Select "Blaze (Pay as you go)"
4. Add payment method
5. Set budget alerts:
   - $1 warning
   - $5 limit

---

## Testing After Quota Resolved

Once quota is resolved (upgrade or reset), test these scenarios:

1. **Single Save:**
   - Add 1 photo
   - Click SHARE once
   - Verify success message
   - Verify shareable URL works

2. **Multiple Saves (Same Session):**
   - Add 5 photos
   - Click SHARE (should create new capsule)
   - Add 3 more photos
   - Click SHARE again (should update same capsule if fix implemented)
   - Verify URL stays the same

3. **Error Handling:**
   - Temporarily disable internet
   - Click SHARE
   - Verify helpful error message (not stuck on SAVING...)

---

## Summary

**Problem:** Firebase Spark plan exceeded 20,000 writes/month
**Cause:** Development testing + creating new capsules on each save
**Impact:** SHARE button stuck on "SAVING..." indefinitely
**Solution:** Upgrade to Blaze plan (~$0.10/month) or wait until month reset
**Prevention:** Implement UPDATE logic + better error handling + rate limiting

**Cost Estimate with Blaze Plan:**
- Current usage: ~20,000-30,000 writes/month
- Cost: $0.18 per 100,000 writes
- **Monthly cost: $0.04 - $0.06** (extremely affordable)
