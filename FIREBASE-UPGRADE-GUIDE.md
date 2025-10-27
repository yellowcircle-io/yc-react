# Firebase Blaze Plan Upgrade Guide

## Current Status
- **Issue:** Quota exceeded on Spark (free) plan
- **Limit:** 20,000 writes/month
- **Cost after upgrade:** ~$0.04-$0.10/month for current usage

---

## Step-by-Step Upgrade Instructions

### Step 1: Close Current Dialog
- Click the **X** button in the top-left corner of the "Create a database" dialog
- This will return you to the main Firebase console

### Step 2: Navigate to Billing Settings

**Option A: Via Left Sidebar**
1. Look for the **gear/cog icon** (⚙️) in the left sidebar
2. Click on it to open settings menu
3. Select **"Usage and billing"** or **"Project settings"**

**Option B: Via Top Navigation**
1. Click **"Project Overview"** in the top-left
2. Click the **gear icon** (⚙️) next to "Project Overview"
3. Select **"Project settings"**
4. Click the **"Usage and billing"** tab

### Step 3: Modify Plan

Once in Usage and Billing:

1. Look for **"Modify plan"** or **"Upgrade project"** button
   - Usually appears near the top of the page
   - May be blue or prominently colored

2. Click **"Modify plan"** or **"Upgrade project"**

3. You'll see plan options:
   - **Spark** (current, free plan) ✅ Selected
   - **Blaze** (pay as you go) ⬅️ Select this one

### Step 4: Select Blaze Plan

1. Click **"Select plan"** under **Blaze** (Pay as you go)

2. **Review the pricing:**
   - **Document reads:** FREE up to 50,000/day, then $0.06 per 100,000
   - **Document writes:** FREE up to 20,000/day, then **$0.18 per 100,000**
   - **Document deletes:** FREE up to 20,000/day, then $0.02 per 100,000
   - **Storage:** FREE up to 1 GB, then $0.18/GB/month
   - **Network egress:** FREE up to 10 GB/month, then $0.12/GB

3. **Your estimated cost:**
   - Current usage: ~20,000-30,000 writes/month
   - Monthly cost: **$0.04 - $0.06**
   - Even at 50,000 writes: **$0.09/month**

### Step 5: Add Payment Method

1. Enter **payment information:**
   - Credit/debit card number
   - Expiration date
   - CVV
   - Billing address

2. **Accept terms and conditions**
   - Read through the pricing terms
   - Check the box to agree

3. Click **"Purchase"** or **"Confirm"**

### Step 6: Set Budget Alerts (Highly Recommended)

After upgrading, set budget alerts to avoid unexpected charges:

1. In **Usage and billing** tab:
   - Look for **"Set budget alerts"** or **"Budget & alerts"**

2. **Add budget alerts:**
   - **Alert 1:** $1.00 (warning level)
     - Email notification when cost reaches $1

   - **Alert 2:** $5.00 (critical level)
     - Email notification when cost reaches $5

   - **Alert 3:** $10.00 (emergency level)
     - Email notification when cost reaches $10

3. **Configure notification emails:**
   - Add your email address
   - Check "Send email notifications"
   - Click "Save"

### Step 7: Verify Upgrade

1. **Check plan status:**
   - Go back to **"Usage and billing"**
   - Verify it shows **"Blaze"** plan active
   - Look for ✅ confirmation message

2. **Test the SHARE button:**
   - Go back to your Travel Memories app
   - Add a photo (or use existing ones)
   - Click **SHARE** button
   - Should now complete successfully instead of stalling!

---

## Alternative: Create New Database (If Needed)

If you were trying to create a database and don't have one yet:

### After Upgrading to Blaze:

1. **Go to Firestore Database:**
   - In left sidebar, click **"Firestore Database"**
   - Or click **"Build"** → **"Firestore Database"**

2. **Click "Create database":**
   - **Database ID:** Leave as `(default)` or choose a name
   - **Location:** `nam5 (United States)` is fine (already selected in your screenshot)
   - Click **"Next"**

3. **Select security rules:**
   - **Production mode:** Start with security rules (more secure)
   - **Test mode:** Allow read/write access (easier for development)

   For development, select **"Test mode"** then click **"Create"**

4. **Wait for database creation:**
   - Takes 1-2 minutes
   - You'll see a loading indicator
   - When done, you'll see an empty database

---

## Current Cost Breakdown

### Before Upgrade (Spark - Free)
- **Writes:** 20,000/month ❌ EXCEEDED
- **Cost:** $0.00
- **Status:** Quota exceeded, cannot save

### After Upgrade (Blaze - Pay as you go)
- **Writes:** Unlimited (pay per use)
- **Cost:** $0.04-$0.10/month for current usage
- **Status:** ✅ Can save unlimited times

### Cost Examples:

| Monthly Writes | Free Tier | Billable | Cost |
|----------------|-----------|----------|------|
| 20,000 | 20,000 | 0 | **$0.00** |
| 30,000 | 20,000 | 10,000 | **$0.02** |
| 50,000 | 20,000 | 30,000 | **$0.05** |
| 100,000 | 20,000 | 80,000 | **$0.14** |

**Note:** First 20,000 writes each month are FREE even on Blaze plan!

---

## Troubleshooting

### Can't Find "Modify Plan" Button

1. **Check your permissions:**
   - You must be an **Owner** of the Firebase project
   - If you're not the owner, ask the project owner to upgrade

2. **Look in these locations:**
   - Project Settings → Usage and billing
   - Main dashboard → "Upgrade" button (top-right)
   - Usage tab → "Modify plan"

### Payment Method Issues

1. **Card declined:**
   - Verify card details are correct
   - Ensure card supports international transactions (Firebase uses Google Cloud)
   - Try a different card

2. **Verification required:**
   - Google may require identity verification
   - Check your email for verification links
   - Follow the verification process

### Already Upgraded But Still See Quota Error

1. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)

2. **Wait 5-10 minutes:**
   - Firebase quota updates may take a few minutes to propagate

3. **Check Firebase console:**
   - Go to Usage and billing
   - Verify Blaze plan is active
   - Check current usage numbers

---

## After Upgrade: Testing Checklist

### 1. Verify SHARE Button Works
- [ ] Go to Travel Memories page (`/uk-memories`)
- [ ] Add 1-2 photos
- [ ] Click **SHARE** button
- [ ] Should see "SAVING..." briefly, then success modal
- [ ] Modal should show shareable URL
- [ ] Console should show: `✅ Capsule saved successfully: [id]`

### 2. Verify Shareable URL Works
- [ ] Copy the URL from the share modal
- [ ] Open in new private/incognito window
- [ ] Navigate to the URL
- [ ] Should see the saved photos in view mode
- [ ] Verify all photos and connections appear

### 3. Monitor Usage (First Week)
- [ ] Check Firebase Console → Usage daily
- [ ] Verify writes are counting correctly
- [ ] Confirm cost is within expected range
- [ ] Check budget alert emails (if any)

---

## Prevention: Avoid Future Quota Issues

### Implement UPDATE Logic (Recommended)

After upgrading, implement the UPDATE logic to reduce writes by ~25%:

See `SAVE-FUNCTIONALITY-AUDIT.md` lines 223-267 for code:

```javascript
// Check if we already have a capsule ID
if (currentCapsuleId) {
  // UPDATE existing capsule (saves writes)
  await updateCapsule(currentCapsuleId, serializableNodes, serializableEdges);
  capsuleId = currentCapsuleId;
} else {
  // CREATE new capsule (first save only)
  capsuleId = await saveCapsule(serializableNodes, serializableEdges);
  setCurrentCapsuleId(capsuleId);
}
```

### Monitor Usage Regularly

1. **Weekly checks:**
   - Firebase Console → Usage and billing
   - Review document read/write counts
   - Check estimated monthly cost

2. **Set up monitoring:**
   - Enable budget alerts (as described above)
   - Monitor console logs for excessive saves
   - Track user behavior patterns

---

## Support

If you encounter issues during upgrade:

**Firebase Support:**
- Firebase Help Center: https://support.google.com/firebase
- Community: https://firebase.google.com/support

**Billing Questions:**
- Google Cloud Billing Support
- Check Firebase Console → Support tab

**Technical Issues:**
- Check browser console for errors
- Verify .env file has correct Firebase config
- Review `ISSUES-RESOLVED-OCT-18.md` for error handling

---

## Summary

**Estimated Time:** 5-10 minutes
**Estimated Cost:** $0.04-$0.10/month
**Difficulty:** Easy
**Benefits:** Unlimited writes, no more quota errors, reliable cloud sharing

**Next Action:** Follow Step 1 above - close the current dialog and navigate to Project Settings → Usage and billing
