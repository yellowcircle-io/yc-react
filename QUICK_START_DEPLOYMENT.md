# Quick Start: Deploy to Staging

**⚡ 3-Step Deploy - Takes 15 minutes**

---

## Prerequisites

✅ Production build complete (`dist/` directory exists)
✅ All safety measures in place
✅ Ready to deploy

---

## Deploy in 3 Steps

### Step 1: Login to Firebase (2 min)

```bash
firebase login
```

- Opens browser automatically
- Sign in with your Google account
- Grant permissions
- Returns to terminal when done

### Step 2: Deploy to Staging (10 min)

```bash
firebase hosting:channel:deploy staging --expires 30d
```

- Uploads files from `dist/` to Firebase
- Creates staging channel
- Generates preview URL
- **Copy the URL** - looks like: `https://yellowcircle-app--staging-[hash].web.app`

### Step 3: Test Staging URL (5-10 min)

Open the URL and verify:
- [ ] Site loads
- [ ] Navigation works
- [ ] Sidebar opens/closes
- [ ] No console errors
- [ ] Mobile view works (resize browser)

**That's it!** ✅

---

## If Something Goes Wrong

### "Failed to get Firebase project"

```bash
firebase use yellowcircle-app
```

### "Not logged in"

```bash
firebase login
```

### "Build not found"

```bash
npm run build
```

### "Permission denied"

Check you're logged into the correct Google account

---

## After Deployment

**Share with alpha testers:**
- Send them the staging URL
- Include link to: `/feedback`
- Include link to: `KNOWN_ISSUES.md`

**Monitor:**
- Firebase Console: https://console.firebase.google.com
- Analytics: Check for errors
- Feedback: Review `/feedback` submissions

---

## Delete Staging Later

When done testing:

```bash
firebase hosting:channel:delete staging
```

---

## Deploy to Production

**Only after thorough staging testing:**

```bash
firebase deploy --only hosting
```

⚠️ This updates the live site immediately!

---

**Need More Details?** See `STAGING_DEPLOYMENT_GUIDE.md`

**Questions?** See `SESSION_SUMMARY_NOV10_2025.md`
