# 🚀 Quick Production Test Checklist

**Site:** https://yellowcircle-app.web.app  
**Time:** ~10 minutes  
**Status:** 🟡 TESTING IN PROGRESS

---

## ⚡ 5-Minute Critical Tests

### Test 1: Firebase Write Fix (CRITICAL) 🔥
**Goal:** Verify dev mode = 0 writes, production = 1 write per session

**Steps:**
1. ✅ Open https://yellowcircle-app.web.app/uk-memories
2. ✅ Open Developer Console (F12 or Cmd+Option+I)
3. ✅ Upload 1 photo, click SHARE
4. ✅ Open shared URL
5. ✅ Look for console message: "✅ View count incremented"
6. ✅ Refresh page 3 times
7. ✅ Look for console message: "ℹ️ Already viewed this capsule"

**✅ PASS if:** Only 1 write on first load, then "already viewed" messages  
**❌ FAIL if:** Multiple "View count incremented" messages

**Result:** ☐ PASS  ☐ FAIL

---

### Test 2: Delete Functionality ✂️
**Goal:** Verify delete works on production

**Steps:**
1. ✅ Go to https://yellowcircle-app.web.app/uk-memories
2. ✅ Upload 3 photos
3. ✅ Right-click on one photo
4. ✅ Click "Delete" from menu
5. ✅ Confirm deletion
6. ✅ Photo should disappear

**✅ PASS if:** Photo deletes and stays deleted after refresh  
**❌ FAIL if:** Delete doesn't work or photo reappears

**Result:** ☐ PASS  ☐ FAIL

---

### Test 3: Firebase Console Check 📊
**Goal:** Verify writes are low

**Steps:**
1. ✅ Open https://console.firebase.google.com/project/yellowcircle-app/firestore/usage
2. ✅ Note current "Writes" number: _________
3. ✅ Perform Tests 1 & 2 above
4. ✅ Wait 2 minutes
5. ✅ Refresh Firebase console
6. ✅ Note new "Writes" number: _________
7. ✅ Calculate difference: _________

**✅ PASS if:** Difference is < 10 writes (should be ~2-5)  
**❌ FAIL if:** Difference is > 20 writes

**Result:** ☐ PASS  ☐ FAIL  
**Write Count Increase:** _________

---

## 🎯 Quick Feature Checks (2 min)

### Navigation
- [ ] Homepage loads (https://yellowcircle-app.web.app)
- [ ] Yellow circle moves with mouse
- [ ] Sidebar opens/closes

### Other Pages
- [ ] /experiments loads
- [ ] /about loads  
- [ ] /works loads

---

## 📸 Screenshots to Take

1. ✅ Browser console showing "Already viewed" message
2. ✅ Firebase usage dashboard (before tests)
3. ✅ Firebase usage dashboard (after tests)
4. ✅ Delete functionality in action

---

## 🎉 Success Summary

If all 3 critical tests PASS:
- ✅ Firebase write issue is FIXED
- ✅ Delete functionality is working
- ✅ Deployment is SUCCESSFUL
- ✅ App is ready for users

**Overall Result:** ☐ ALL PASS  ☐ SOME FAIL

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Tested By:** ________________  
**Date:** November 2, 2025  
**Time:** ________________

