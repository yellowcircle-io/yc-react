# 📊 Firebase Idle Monitoring Test - 15-30 Minutes

**Start Time:** _____________ (when you left it idle)  
**End Time:** _____________ (when you check back)  
**Duration:** _____________ minutes

---

## 🎯 Purpose

Verify that Firebase is **NOT** constantly writing when the app is idle.

**Before Fix:** Thousands of writes from view count incrementing on every page load  
**After Fix:** Should see 0-2 writes during idle period

---

## 📋 When You Return (After 15-30 min)

### Step 1: Check Firebase Console

1. Open Firebase Console:
   https://console.firebase.google.com/project/yellowcircle-app/firestore/usage

2. Click on **"Usage"** tab

3. Look at the **"Writes"** graph

4. **Note the number:**
   - Before idle period: _________
   - After idle period: _________
   - **Difference:** _________

---

### Step 2: Expected Results

**✅ GOOD (Test PASSED):**
- Difference is **0-2 writes** during idle period
- Graph shows **flat line** (no spikes)
- No constant upward trend

**❌ BAD (Test FAILED):**
- Difference is **10+ writes** during idle period
- Graph shows **constant climbing**
- Upward trend continues

---

### Step 3: Check Browser Console

1. Go back to browser tab with yellowCircle open

2. Check Developer Console

3. **Count repeated messages:**
   - How many times did you see same message?
   - Are there hundreds of identical logs?

**✅ GOOD:**
- Few or no console messages
- No repeated "Modal is closed" spam
- Clean console output

**❌ BAD:**
- Hundreds of identical messages
- Console spam continues
- "Modal is closed" repeating

---

### Step 4: Browser Network Tab Check (Optional)

1. Open Network tab in Developer Tools

2. Filter by **"XHR"** or **"Fetch"**

3. Let it run for 1 minute

4. **Count Firestore requests:**
   - How many requests to `firestore.googleapis.com`?
   - Are they constant or occasional?

**✅ GOOD:**
- 0-1 requests during 1 minute
- No constant polling

**❌ BAD:**
- Multiple requests per second
- Constant Firestore calls

---

## 📊 Data to Collect

When you return, fill in:

```
=== IDLE MONITORING RESULTS ===

Duration: ________ minutes

Firebase Writes:
  Before: _________
  After:  _________
  Increase: ________ writes

Console Messages:
  ☐ Clean (few messages)
  ☐ Spam (repeated messages)
  Count: ________ repeated messages

Network Requests:
  Firestore calls in 1 min: ________
  
Browser left open on: 
  ☐ Homepage
  ☐ /uk-memories (create page)
  ☐ /uk-memories/view/[id] (shared capsule)
  ☐ Other: _________________

Test Result:
  ☐ PASS - No excessive writes
  ☐ FAIL - Still writing constantly
  
Notes:
________________________________________
________________________________________
```

---

## ✅ Success Criteria

### Test PASSES if:
- Firebase writes increase by **0-2** during idle period
- Console is clean (no spam)
- No constant network requests
- Browser can sit idle without generating writes

### Test FAILS if:
- Firebase writes increase by **10+** during idle period
- Console shows repeated spam
- Constant Firestore network requests
- Every page refresh = new write

---

## 🎯 What Each Result Means

### If Test PASSES ✅
**Meaning:** The Firebase excessive write issue is **FIXED!**
- Development writes: Eliminated ✅
- Production writes: Controlled ✅
- View count: Working correctly ✅
- Ready for production use ✅

**Next Steps:**
1. Document success
2. Continue 24-hour monitoring (lighter checks)
3. Mark deployment as stable
4. Celebrate! 🎉

---

### If Test FAILS ❌
**Meaning:** Still have an issue causing writes

**Possible causes:**
1. View count still incrementing in dev mode somehow
2. Another component making Firestore calls
3. Different source of writes we haven't identified
4. Browser extension or service worker

**Next Steps:**
1. Check browser console for errors
2. Review Network tab for request sources
3. Check if in development mode vs production
4. Investigate further with debugging

---

## 📸 Screenshots to Take (Optional)

1. Firebase Usage graph showing flat line
2. Browser console showing clean output
3. Network tab showing minimal requests

These help confirm the fix worked!

---

## Quick Reference

**Firebase Console:**  
https://console.firebase.google.com/project/yellowcircle-app/firestore/usage

**Production Site:**  
https://yellowcircle-app.web.app

**Expected Baseline:**
- Idle period: 0-2 writes
- Active usage: 1-3 writes per action
- View capsule: 1 write per new session

---

**⏰ See you in 15-30 minutes!**

