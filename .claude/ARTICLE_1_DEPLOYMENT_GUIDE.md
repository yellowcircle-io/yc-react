# Article 1 Deployment Guide - "Why Your GTM Sucks"

**Machine:** Mac Mini
**Created:** November 22, 2025
**Status:** Ready for deployment (build validated)
**Route:** `/thoughts/why-your-gtm-sucks`

---

## ✅ Pre-Deployment Checklist (COMPLETE)

- [x] 2025 industry data researched and compiled
- [x] Article content written (35 sections, ~15,500 words)
- [x] React component built with horizontal scroll
- [x] Build validated successfully (2.17s build time)
- [x] Route added to RouterApp.jsx
- [x] Git committed and pushed to GitHub
- [x] Rollback checkpoint created (tag: `article-1-pre-deployment`)

---

## 🚀 Deployment Instructions

### Step 1: Re-authenticate Firebase (if needed)

```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle
firebase login --reauth
```

### Step 2: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

**Expected Output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/yellowcircle-app/overview
Hosting URL: https://yellowcircle-app.web.app
```

### Step 3: Verify Deployment

Visit: **https://yellowcircle-app.web.app/thoughts/why-your-gtm-sucks**

**What You Should See:**
- Hero section: "WHY YOUR GTM SUCKS"
- Subtitle: "The Human Cost of Operations Theater"
- Desktop (>800px): Horizontal scrolling with 35 sections
- Mobile (<800px): Vertical scrolling layout
- Placeholder sections for content "TK - Being written"

**What's Live:**
- ✅ Full article structure (35 sections)
- ✅ Hero, Data Grid, Table of Contents (fully implemented)
- ✅ Horizontal scroll mechanics (desktop)
- ✅ Mobile responsive layout
- ⏳ Placeholder content sections (will show "[Content TK - Being written]")

**What's Coming:**
- Data visualizations (charts, timelines, persona cards)
- Email capture forms
- Full content integration from markdown
- PDF export

---

## 🔄 Rollback Instructions

### If Something Goes Wrong

**Option 1: Quick Rollback (Revert to Pre-Deployment State)**

```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle

# Reset to checkpoint (before route was added)
git reset --hard article-1-pre-deployment

# Rebuild
npm run build

# Redeploy previous version
firebase deploy --only hosting
```

**This reverts:**
- Article 1 route removal
- Returns to state before `/thoughts/why-your-gtm-sucks` existed

---

**Option 2: Soft Rollback (Remove Route, Keep Files)**

```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle

# Open RouterApp.jsx and comment out the article route
# Lines to comment:
# - Line 29: import OwnYourStoryArticle1Page from './pages/OwnYourStoryArticle1Page';
# - Line 56: <Route path="/thoughts/why-your-gtm-sucks" element={<OwnYourStoryArticle1Page />} />

# Rebuild
npm run build

# Redeploy
firebase deploy --only hosting
```

**This:**
- Removes public access to article
- Keeps files in codebase for continued development
- Can re-enable anytime by uncommenting

---

**Option 3: Emergency Rollback (Last Known Good Deployment)**

```bash
# Check Firebase deployment history
firebase hosting:channel:list

# Rollback to specific deployment
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

---

## 📊 Current Deployment State

**Git Status:**
- Latest commit: `662ef73` - "Add: Route for Article 1 draft deployment (Mac Mini)"
- Rollback tag: `article-1-pre-deployment`
- Branch: `main`
- Pushed to GitHub: ✅

**Build Status:**
- Last build: Successful (2.17s)
- Warnings: Chunk size (1.2MB - expected for now)
- Errors: None

**Files Deployed:**
- `src/pages/OwnYourStoryArticle1Page.jsx` - Main component
- `dev-context/ARTICLE_1_FULL_CONTENT.md` - Content source (not deployed, dev only)
- `dev-context/ARTICLE_1_2025_DATA_REFERENCE.md` - Research data (not deployed, dev only)

---

## 🔍 Post-Deployment Verification

**Desktop (>800px viewport):**
1. Visit `/thoughts/why-your-gtm-sucks`
2. Verify horizontal scroll works (mouse wheel, keyboard arrows, swipe)
3. Check scroll progress indicator (bottom center)
4. Navigate through all 35 sections
5. Verify yellowCircle design system (yellow accent, black background)

**Mobile (<800px viewport):**
1. Visit same URL on mobile device
2. Verify vertical scroll (native)
3. Check all sections stack properly
4. Verify typography scaling
5. Test touch interactions

**Performance:**
- Initial load time: <3s (target)
- Scroll smoothness: 60fps (target)
- Mobile responsiveness: No horizontal scroll on mobile

---

## 📝 Known Issues / Limitations (Draft Phase)

**Expected Placeholder Sections:**
- Section 4-6: "Why This Matters" pages
- Section 7-11: "The Big Picture" pages
- Section 12-31: Persona sections (20 pages)
- Section 32-34: "What Now" pages

**These will show:** "[Content TK - Being written]"

**This is intentional for draft deployment.**

**Missing Features (Next Phase):**
- Data visualizations (charts)
- Email capture forms on CTA section
- PDF export functionality
- Full content integration (currently placeholders)

---

## 🎯 Next Steps After Deployment

### Phase 1: Verify Live Draft
1. Deploy to Firebase (run commands above)
2. Visit live URL: `/thoughts/why-your-gtm-sucks`
3. Test on desktop and mobile
4. Verify no console errors

### Phase 2: Integrate Full Content
1. Read `dev-context/ARTICLE_1_FULL_CONTENT.md`
2. Replace placeholder sections with actual content
3. Implement data visualization components
4. Add email capture forms

### Phase 3: Polish & Launch
1. Build PDF export
2. Test all interactions
3. Performance optimization
4. Public announcement

---

## 🆘 Troubleshooting

**Issue: Build fails**
```bash
# Check for syntax errors
npm run build

# If errors, check RouterApp.jsx line 56
# Ensure route is properly formatted
```

**Issue: 404 on article URL**
```bash
# Verify route exists in RouterApp.jsx
grep "why-your-gtm-sucks" src/RouterApp.jsx

# If missing, rollback and re-add route
```

**Issue: Firebase deploy fails**
```bash
# Re-authenticate
firebase login --reauth

# Check Firebase project
firebase projects:list

# Verify correct project
firebase use yellowcircle-app
```

**Issue: Blank page on article**
```bash
# Check browser console for errors
# Common causes:
# - Missing import in RouterApp.jsx
# - Component export issue
# - Build not updated (run npm run build)
```

---

## 📞 Rollback Decision Tree

**When to Rollback:**

❌ **ROLLBACK if:**
- Site is completely broken (404 errors everywhere)
- Build errors prevent deployment
- Critical navigation broken
- Performance degradation (>5s load time)

✅ **DON'T ROLLBACK if:**
- Article has placeholder sections (expected in draft)
- Minor styling issues (fix forward)
- Missing data viz (coming in next phase)
- Email forms not working (not implemented yet)

---

## 🔖 Rollback Tags Reference

**Available Tags:**
- `article-1-pre-deployment` - Checkpoint before route integration (safe rollback point)

**Create New Checkpoint:**
```bash
# Before making changes
git tag -a "article-1-post-deployment" -m "Checkpoint: After successful deployment"
git push --tags
```

**List All Tags:**
```bash
git tag -l | grep article
```

**Jump to Specific Tag:**
```bash
git checkout article-1-pre-deployment
# Look around, test
# Return to main:
git checkout main
```

---

## ✅ Deployment Complete Checklist

After running deployment commands, verify:

- [ ] Firebase deploy succeeded (no errors)
- [ ] URL accessible: https://yellowcircle-app.web.app/thoughts/why-your-gtm-sucks
- [ ] Desktop horizontal scroll works
- [ ] Mobile vertical scroll works
- [ ] Hero section displays correctly
- [ ] Data grid section displays correctly
- [ ] No console errors
- [ ] Sidebar navigation works
- [ ] Footer works
- [ ] Can navigate back to main site

**If all checked:** ✅ Deployment successful!

**If any fail:** See troubleshooting section or execute rollback.

---

**Status:** Ready for manual deployment
**Next Command:** `firebase login --reauth && firebase deploy --only hosting`
**Rollback:** `git reset --hard article-1-pre-deployment && npm run build && firebase deploy`
