# Production Testing Plan - yellowCircle App
**Deployment Date:** November 2, 2025 @ 5:18 PM
**Test Date:** November 2, 2025 @ 5:30 PM
**Site URL:** https://yellowcircle-app.web.app

---

## Test 1: Firebase Write Reduction Verification

### Objective
Verify that view count increments are NOT happening during development and ARE controlled in production.

### Steps - Development Mode Test
1. Open Terminal:
   ```bash
   cd "/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle"
   npm run dev
   ```

2. Open http://localhost:5173/uk-memories in browser

3. Open Browser Developer Console (F12 or Cmd+Option+I)

4. Create a test time capsule:
   - Click "📤 UPLOAD PHOTOS"
   - Upload 1-2 test images
   - Click "💾 SHARE"
   - Copy the share URL

5. Open the share URL (should be like: http://localhost:5173/uk-memories/view/XXXXX)

6. **Check Console Output:**
   - ✅ PASS: Should see "⚠️ DEV MODE: Skipping view count increment"
   - ❌ FAIL: If you see any Firebase write operations

7. Refresh the page 5 times

8. **Expected Result:** 
   - Console shows dev mode message each time
   - NO Firebase writes occur

### Steps - Production Test
1. Open https://yellowcircle-app.web.app/uk-memories

2. Open Browser Developer Console (F12)

3. Create a new time capsule with 1-2 photos

4. Click "💾 SHARE" and open the share URL

5. **Check Console Output on FIRST load:**
   - ✅ PASS: Should see "✅ View count incremented"
   - Check Network tab: Should see 1 updateDoc request to Firestore

6. Refresh the page 5 times

7. **Check Console Output on subsequent loads:**
   - ✅ PASS: Should see "ℹ️ Already viewed this capsule in this session"
   - ❌ FAIL: If you see "View count incremented" again
   - Check Network tab: Should NOT see updateDoc requests

8. Open same URL in Incognito/Private window

9. **Expected Result:**
   - New session = 1 more view count increment
   - Then subsequent refreshes = no more increments

### Verification
- [ ] Dev mode shows skip message
- [ ] Dev mode creates 0 Firebase writes
- [ ] Production increments view count once per session
- [ ] Production prevents duplicate counts on refresh
- [ ] Incognito/private window = new session = new count

---

## Test 2: Time Capsule Delete Functionality

### Objective
Verify that the delete functionality (deployed Oct 26, now live) works correctly.

### Steps
1. Open https://yellowcircle-app.web.app/uk-memories

2. Upload 3-5 test photos:
   - Click "📤 UPLOAD PHOTOS"
   - Select multiple images
   - Wait for upload to complete

3. **Test Right-Click Delete (Desktop):**
   - Right-click on a photo node
   - ✅ PASS: Context menu appears with "Delete" option
   - Click "Delete"
   - ✅ PASS: Confirmation dialog appears
   - Click "Confirm" or "Delete"
   - ✅ PASS: Photo disappears from canvas
   - ✅ PASS: LocalStorage updates (check Application tab)

4. **Test Long-Press Delete (Mobile - if testing on mobile):**
   - Long-press on a photo node (hold for 500ms)
   - ✅ PASS: Delete UI appears
   - Confirm deletion
   - ✅ PASS: Photo removed

5. **Test Multiple Deletions:**
   - Delete 2-3 more photos
   - ✅ PASS: Each deletion works independently
   - ✅ PASS: Remaining photos stay intact

6. **Test Persistence:**
   - Refresh the page
   - ✅ PASS: Deleted photos remain deleted
   - ✅ PASS: Remaining photos still visible

### Verification
- [ ] Right-click menu appears
- [ ] Delete confirmation works
- [ ] Photos are removed from canvas
- [ ] LocalStorage updates correctly
- [ ] Changes persist after refresh
- [ ] Multiple deletes work correctly

---

## Test 3: Firebase Quota Monitoring

### Objective
Verify that Firebase write operations have dramatically decreased.

### Steps
1. Open Firebase Console:
   https://console.firebase.google.com/project/yellowcircle-app/firestore/usage

2. Note current statistics:
   - **Reads:** _____________
   - **Writes:** _____________
   - **Deletes:** _____________
   - **Document Count:** _____________
   - **Data Size:** _____________

3. Perform 10 test operations (mix of create/share/view/delete)

4. Wait 5 minutes for Firebase to update

5. Refresh Firebase Console

6. Compare before/after:
   - **Writes:** Should increase by ~1-3 (not 10+)
   - **Reads:** Moderate increase (expected)
   - **Deletes:** Should increase if you deleted capsules

### Expected Results
- ✅ Writes are minimal (1-3 per test operation, not 10+ per refresh)
- ✅ View count increments only once per session
- ✅ No runaway write operations
- ✅ Quota usage stays well under limits

### Verification
- [ ] Writes are significantly lower than before
- [ ] No unexpected write spikes
- [ ] Quota stays under 20,000/month limit
- [ ] Usage pattern looks healthy

---

## Test 4: General App Functionality

### Objective
Ensure all features still work after deployment.

### Quick Smoke Test
1. **Homepage:**
   - [ ] Visit https://yellowcircle-app.web.app
   - [ ] Yellow circle parallax works
   - [ ] Navigation sidebar opens/closes
   - [ ] Hamburger menu works

2. **Experiments Page:**
   - [ ] Visit /experiments
   - [ ] All experiment cards display
   - [ ] Links to sub-experiments work

3. **About Page:**
   - [ ] Visit /about
   - [ ] Content loads correctly

4. **Works Page:**
   - [ ] Visit /works
   - [ ] Portfolio items display

5. **Time Capsule (Create):**
   - [ ] Visit /uk-memories
   - [ ] Upload photos works
   - [ ] Drag photos around canvas
   - [ ] Edit memory metadata (title, location, date)
   - [ ] Share creates URL
   - [ ] Export JSON works
   - [ ] Import JSON works

6. **Time Capsule (View Shared):**
   - [ ] Shared URL loads
   - [ ] Photos display correctly
   - [ ] Read-only mode (can't edit)
   - [ ] View count increments once

---

## Post-Test Actions

### If All Tests Pass ✅
1. Document successful deployment
2. Monitor Firebase for 24 hours
3. Check for any user reports
4. Mark deployment as stable

### If Any Tests Fail ❌
1. Document failure details
2. Check browser console for errors
3. Review Firebase errors
4. Rollback if critical
5. Fix and redeploy

---

## 24-Hour Monitoring Checklist

**Day 1 (Today - Nov 2):**
- [ ] 6:00 PM - Check Firebase usage (1 hour post-deploy)
- [ ] 9:00 PM - Check Firebase usage (evening check)
- [ ] Take screenshot of Firebase quota

**Day 2 (Tomorrow - Nov 3):**
- [ ] 9:00 AM - Morning check
- [ ] 5:00 PM - Evening check
- [ ] Compare 24hr totals vs previous pattern

**Expected 24hr Usage:**
- Writes: < 100 (previously 1,000+)
- Reads: < 500 (reasonable)
- Errors: 0

---

## Success Criteria

✅ **PASS if:**
- Dev mode creates 0 Firebase writes
- Production view counts increment max 1x per session
- Delete functionality works on all devices
- All app features remain functional
- Firebase quota stays under 20,000/month trajectory
- No console errors or Firebase errors

❌ **FAIL if:**
- View counts increment on every refresh
- Delete functionality broken
- Firebase quota still growing rapidly
- Critical app features broken
- Console shows errors

---

**Tester:** _________________
**Date:** _________________
**Result:** ☐ PASS  ☐ FAIL
**Notes:** _________________________________________________________________

