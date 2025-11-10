# Staging Deployment Guide - YellowCircle

**Date:** November 10, 2025
**Purpose:** Deploy to Firebase staging channel for testing
**Status:** Ready - requires Firebase authentication

---

## Quick Start

```bash
# 1. Ensure you're in the project directory
cd "/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle"

# 2. Login to Firebase (interactive - opens browser)
firebase login

# 3. Verify Firebase project
firebase projects:list

# 4. Build production bundle
npm run build

# 5. Deploy to staging channel (30-day preview URL)
firebase hosting:channel:deploy staging --expires 30d

# 6. Test the staging URL provided in output
```

---

## Two Deployment Options

### Option 1: Deploy Current Version (Alpha)

**Purpose:** Get current working version live for alpha testing while refactoring continues in parallel

**Status:** ✅ Build complete, ready to deploy

**Steps:**
```bash
# Build is already done (dist/ directory ready)
# Just need to deploy

firebase login
firebase hosting:channel:deploy staging --expires 30d
```

**What You Get:**
- Current HomePage with all fixes (sidebar, animations, GPU acceleration)
- All other pages as-is (some duplication, but functional)
- Error boundary protection
- Firebase Analytics enabled
- Feedback form at `/feedback`
- Known issues documented

**Ideal For:**
- Immediate alpha testing
- Gathering user feedback
- Validating current fixes
- Testing in real-world environment

### Option 2: Deploy Refactored Version (After Phase 3)

**Purpose:** Deploy cleaner, more maintainable codebase with reduced duplication

**Status:** ⏳ Needs Phase 3 completion (update pages to use shared components)

**Steps:**
```bash
# After completing page updates with shared components
npm run build
firebase login
firebase hosting:channel:deploy staging --expires 30d
```

**What You Get:**
- Same functionality as Option 1
- ~1,500 lines less code
- Centralized bug fixes
- Better maintainability
- Improved performance (smaller bundle)

**Ideal For:**
- Long-term sustainability
- Easier future development
- Better performance metrics
- Professional codebase quality

---

## Detailed Deployment Steps

### Step 1: Firebase Authentication

**Command:**
```bash
firebase login
```

**What Happens:**
1. Opens browser automatically
2. Sign in with Google account associated with Firebase project
3. Grant permissions to Firebase CLI
4. Returns to terminal when complete

**Troubleshooting:**
- If browser doesn't open: Copy the URL from terminal and paste in browser manually
- If already logged in: Command will confirm and proceed
- Multiple accounts: Use `firebase login:add` to add another account

### Step 2: Verify Firebase Project

**Command:**
```bash
firebase projects:list
```

**Expected Output:**
```
┌─────────────────────┬────────────────────┬────────────────┬──────────────────────┐
│ Project Display Name│ Project ID         │ Project Number │ Resource Location ID │
├─────────────────────┼────────────────────┼────────────────┼──────────────────────┤
│ yellowcircle-app    │ yellowcircle-app   │ [number]       │ [location]           │
└─────────────────────┴────────────────────┴────────────────┴──────────────────────┘
```

**Verify:**
- Project ID matches `yellowcircle-app` (from firebase.json)
- Project is active and accessible

### Step 3: Check Current Firebase Configuration

**Command:**
```bash
cat firebase.json
```

**Verify:**
```json
{
  "hosting": {
    "site": "yellowcircle-app",
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Important:**
- `public`: "dist" - Deploy from dist/ directory
- `site`: "yellowcircle-app" - Firebase hosting site ID
- `rewrites`: SPA routing configured (all routes → index.html)

### Step 4: Build Production Bundle

**Command:**
```bash
npm run build
```

**Expected Output:**
```
vite v5.4.19 building for production...
✓ [number] modules transformed.
dist/index.html                     [size] kB
dist/assets/index-[hash].css       [size] kB
dist/assets/index-[hash].js        [size] kB
✓ built in [time]s
```

**Verify:**
- No build errors
- dist/ directory created
- Files present: index.html, assets/

**Check Build:**
```bash
ls -la dist/
# Should show index.html and assets/ directory
```

### Step 5: Preview Build Locally (Optional)

**Command:**
```bash
npm run preview
```

**What It Does:**
- Serves production build locally
- Access at: http://localhost:4173
- Test before deploying to staging

**Verify:**
- Site loads correctly
- Navigation works
- No console errors
- Assets load (check Network tab)

**Stop Preview:**
- Press Ctrl+C in terminal

### Step 6: Deploy to Staging Channel

**Command:**
```bash
firebase hosting:channel:deploy staging --expires 30d
```

**What It Does:**
- Creates/updates "staging" preview channel
- Uploads dist/ contents to Firebase
- Generates unique preview URL
- Sets expiration to 30 days

**Expected Output:**
```
=== Deploying to 'yellowcircle-app'...

i  hosting[yellowcircle-app]: beginning deploy...
i  hosting[yellowcircle-app]: found [X] files in dist
✔  hosting[yellowcircle-app]: file upload complete
✔  hosting[yellowcircle-app]: version finalized
✔  hosting[yellowcircle-app]: release complete

Channel URL (staging): https://yellowcircle-app--staging-[hash].web.app
Expires at: [date in 30 days]
```

**Save the URL!** Copy the Channel URL for testing.

### Step 7: Verify Staging Deployment

**Open Staging URL in Multiple Browsers:**

**Chrome:**
1. Open staging URL
2. Open DevTools (F12)
3. Check Console for errors
4. Check Network tab for failed requests
5. Test navigation (all links)
6. Test sidebar (open/close, accordion)
7. Test mobile view (DevTools responsive mode)

**Firefox:**
1. Repeat Chrome tests
2. Verify animations work
3. Check hover effects

**Safari (if Mac):**
1. Repeat tests
2. Verify backdrop-filter works
3. Test touch/swipe if available

**Mobile (iPhone/Android):**
1. Open URL on phone
2. Test touch interactions
3. Test device motion (if implemented)
4. Test sidebar width (minimum 280px)
5. Verify no horizontal scrolling

### Step 8: Functional Testing Checklist

**Navigation:**
- [ ] Home link works
- [ ] Sidebar opens/closes smoothly
- [ ] All accordion sections expand/collapse
- [ ] Third-level navigation (Being + Rhyme) works
- [ ] Direct page links work (/about, /experiments, etc.)

**Animations:**
- [ ] Parallax effect smooth (yellow circle moves)
- [ ] Sidebar animations no jitter
- [ ] Icon hover effects work
- [ ] Staggered item animations appear

**Interactive Elements:**
- [ ] Sidebar toggle button works
- [ ] HOME breadcrumb clickable
- [ ] Logo in sidebar footer clickable
- [ ] Scroll navigation works (wheel, keyboard, touch)

**Error Handling:**
- [ ] Error boundary works (trigger intentional error to test)
- [ ] 404 page appears for invalid routes
- [ ] No console errors during normal use

**Mobile Specific:**
- [ ] Sidebar minimum width 280px (no text breaking)
- [ ] Touch events responsive
- [ ] No layout shift on interaction
- [ ] Footer visible and functional

**Feedback Form:**
- [ ] Access /feedback route
- [ ] Form loads correctly
- [ ] Browser/device auto-detected
- [ ] Submit button works
- [ ] Thank you page appears

---

## Staging Channel Management

### List All Channels

**Command:**
```bash
firebase hosting:channel:list
```

**Output:**
```
Channel ID    URL                                              Expire Time
staging       https://yellowcircle-app--staging-[hash].web.app [date]
```

### Delete a Channel

**Command:**
```bash
firebase hosting:channel:delete staging
```

**When to Use:**
- After testing complete
- To free up channel slot
- To create fresh deployment

### Create Different Channels

**Alpha Testing:**
```bash
firebase hosting:channel:deploy alpha --expires 14d
```

**Beta Testing:**
```bash
firebase hosting:channel:deploy beta --expires 60d
```

**Feature Testing:**
```bash
firebase hosting:channel:deploy feature-new-sidebar --expires 7d
```

**Benefits:**
- Multiple simultaneous test environments
- Different URLs for different audiences
- Independent expiration dates

---

## Promoting to Production

**⚠️ IMPORTANT:** Only promote after thorough staging testing!

### Option 1: Deploy Directly to Production

**Command:**
```bash
firebase deploy --only hosting
```

**What It Does:**
- Deploys dist/ to production URL
- Updates live site immediately
- No preview channel

**Use When:**
- Staging tested thoroughly
- Ready for public access
- Confident in deployment

### Option 2: Clone Channel to Production

**Command:**
```bash
firebase hosting:clone yellowcircle-app:staging yellowcircle-app:live
```

**What It Does:**
- Copies exact staging deployment to production
- Guarantees same code as tested
- Safer than re-building

**Use When:**
- Want exact staging version in production
- Avoid re-build differences
- Maximum confidence needed

### Option 3: Preview Before Production

**Commands:**
```bash
# Build fresh
npm run build

# Deploy to preview channel
firebase hosting:channel:deploy preview --expires 7d

# Test preview URL thoroughly

# If good, deploy to production
firebase deploy --only hosting
```

---

## Rollback Instructions

**If Deployment Has Issues:**

### Quick Rollback (Production Only)

**Via Firebase Console:**
1. Go to: https://console.firebase.google.com
2. Select yellowcircle-app project
3. Go to Hosting
4. Click "Release history"
5. Find previous working version
6. Click "..." → "Rollback"

**Via CLI:**
```bash
firebase hosting:rollback
```

### Staging Channel (Just Delete)

**Command:**
```bash
firebase hosting:channel:delete staging
```

**Why:** Staging is preview-only, deleting doesn't affect users

---

## Monitoring After Deployment

### Firebase Hosting Dashboard

**URL:** https://console.firebase.google.com/project/yellowcircle-app/hosting

**Check:**
- Deploy status (success/failed)
- URL of deployed site
- Number of requests
- Bandwidth usage

### Firebase Analytics

**URL:** https://console.firebase.google.com/project/yellowcircle-app/analytics

**Monitor:**
- Page views
- User sessions
- Error events (from ErrorBoundary)
- Feedback submissions

### Check for Errors

**Command:**
```bash
# View recent logs
firebase hosting:sites:list

# Check deployment history
firebase hosting:sites:get yellowcircle-app
```

---

## Common Issues & Solutions

### Issue: "Failed to get Firebase project"

**Cause:** Not logged in or wrong project

**Solution:**
```bash
firebase login
firebase use yellowcircle-app
```

### Issue: "No Firebase project directory detected"

**Cause:** Not in project root directory

**Solution:**
```bash
cd "/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle"
```

### Issue: "Build failed with errors"

**Cause:** Code errors or missing dependencies

**Solution:**
```bash
# Check for errors
npm run lint

# Reinstall dependencies
npm install

# Try build again
npm run build
```

### Issue: "Staging URL shows 404"

**Cause:** Deployment incomplete or wrong public directory

**Solution:**
- Verify firebase.json: `"public": "dist"`
- Check dist/ exists: `ls -la dist/`
- Redeploy: `firebase hosting:channel:deploy staging --expires 30d`

### Issue: "Site loads but assets missing"

**Cause:** Vite build path issues

**Solution:**
```bash
# Check vite.config.js base setting
# Should be: base: '/'

# Clean and rebuild
rm -rf dist/
npm run build
firebase hosting:channel:deploy staging --expires 30d
```

---

## Environment Variables

**Required for Production:**

Create `.env.production` file (if not exists):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=yellowcircle-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yellowcircle-app
VITE_FIREBASE_STORAGE_BUCKET=yellowcircle-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Security:**
- ✅ Vite exposes only `VITE_*` variables to client
- ✅ Firebase API keys are safe for public exposure (domain-restricted)
- ❌ Do NOT commit `.env.production` to git
- ✅ Do commit `.env.example` with placeholder values

**Check Current Config:**
```bash
# Verify Firebase config in built files
cat src/config/firebase.js
```

---

## Success Criteria

**Deployment Successful When:**

✅ Staging URL loads without errors
✅ All pages accessible
✅ Navigation works smoothly
✅ Sidebar animations smooth (no jitter)
✅ Mobile responsive (280px+ width)
✅ Error boundary catches errors gracefully
✅ Feedback form works
✅ Analytics tracking events
✅ No console errors during normal use
✅ All tests from checklist pass

**Performance Benchmarks:**

✅ Lighthouse Performance: 78+ (current), 90+ (target after refactor)
✅ First Contentful Paint: <1.5s
✅ Time to Interactive: <3s
✅ No layout shift on load

---

## Next Steps After Staging Deployment

### For Alpha Testing (Option 1):

1. **Share staging URL** with 10-50 alpha testers
2. **Monitor Firebase Analytics** for:
   - Error events
   - Page views
   - User sessions
   - Feedback submissions
3. **Collect feedback** via `/feedback` form
4. **Track issues** in GitHub or Notion
5. **Iterate based on feedback** (1-2 weeks)
6. **Deploy to production** when stable

### For Refactored Version (Option 2):

1. **Complete Phase 3** (update remaining pages)
2. **Test locally** with `npm run dev`
3. **Build and deploy** to staging
4. **Compare with alpha version**:
   - Performance metrics
   - Bundle size
   - User experience
5. **Choose best version** for production
6. **Deploy chosen version** to production

---

## Quick Reference Commands

```bash
# Authentication
firebase login
firebase logout

# Project info
firebase projects:list
firebase use yellowcircle-app

# Build
npm run build
npm run preview

# Deploy staging
firebase hosting:channel:deploy staging --expires 30d

# Manage channels
firebase hosting:channel:list
firebase hosting:channel:delete staging

# Deploy production
firebase deploy --only hosting

# Rollback
firebase hosting:rollback

# View logs
firebase hosting:sites:list
```

---

**Prepared by:** Claude Code
**Date:** November 10, 2025
**Status:** Ready for deployment (authentication required)
**Estimated Time:** 15-30 minutes for full staging deployment
