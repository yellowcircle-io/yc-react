# Cloudinary Setup Guide for UK Memories

## Current Status

**Issue**: "No images were processed. Please try again." error when uploading photos from device

**Root Cause**: Cloudinary credentials were commented out in `.env` file

**Fix Applied**:
- ✅ Enabled Cloudinary configuration in `.env`
- ⚠️ **REQUIRED**: Create unsigned upload preset in Cloudinary dashboard

---

## Configuration Applied

```bash
# .env file (already updated)
VITE_CLOUDINARY_CLOUD_NAME=yellowcircle-io
VITE_CLOUDINARY_UPLOAD_PRESET=uk-memories-unsigned
```

**Cloud Name**: `yellowcircle-io` (confirmed from existing images)
**Upload Preset**: `uk-memories-unsigned` (needs to be created in Cloudinary dashboard)

---

## Step-by-Step: Create Upload Preset

### 1. Log in to Cloudinary
Navigate to: https://cloudinary.com/console

### 2. Open Settings
Click the **⚙️ gear icon** in the top-right corner

### 3. Navigate to Upload Settings
In the left sidebar, click **"Upload"**

### 4. Add Upload Preset
Scroll down to the **"Upload presets"** section and click **"Add upload preset"**

### 5. Configure the Preset
Fill in the following settings:

| Setting | Value | Notes |
|---------|-------|-------|
| **Preset name** | `uk-memories-unsigned` | Must match .env exactly |
| **Signing Mode** | **Unsigned** | ⚠️ CRITICAL - enables client-side uploads |
| **Folder** | `uk-memories` | Organizes uploads in Cloudinary |
| **Access mode** | `public` | Allows images to be viewed publicly |
| **Unique filename** | ✅ Enabled | Prevents filename conflicts |
| **Resource type** | Auto | Detects image/video/raw automatically |
| **Upload type** | Upload | Standard upload behavior |

**Important**: Leave all other settings at their defaults unless you have specific requirements.

### 6. Save the Preset
Click **"Save"** at the bottom of the page

### 7. Verify Creation
- You should see `uk-memories-unsigned` in the list of upload presets
- **Signing Mode** column should show **"Unsigned"**
- Copy the preset name to verify it matches: `uk-memories-unsigned`

---

## How the Upload Flow Works

### Before Fix (Failed)
1. User selects photo from device
2. Code tries to upload to Cloudinary
3. ❌ **Fails**: No credentials configured
4. ❌ **Error**: "No images were processed"

### After Fix (With Preset Created)
1. User selects photo from device
2. Code attempts Cloudinary upload with:
   - Cloud name: `yellowcircle-io`
   - Upload preset: `uk-memories-unsigned`
   - Folder: `uk-memories`
3. ✅ **Success**: Image uploaded to Cloudinary
4. ✅ URL returned: `https://res.cloudinary.com/yellowcircle-io/image/upload/v[version]/uk-memories/[filename].jpg`
5. ✅ URL saved to Firebase (tiny string, no quota issues)
6. ✅ localStorage saves URL only (not base64)

### Fallback Behavior (If Cloudinary Fails)
If Cloudinary upload fails for any reason:
1. Code falls back to base64 encoding
2. ⚠️ Warning shown: "Using base64 encoding - may hit localStorage quota after 2-3 photos"
3. Image saved as data URI in localStorage
4. **Limitation**: Can only save 2-3 photos before hitting 5-10MB quota

---

## Testing the Upload Flow

### After Creating the Preset:

1. **Refresh your browser** (Vite should pick up new .env variables)
   - Or hard refresh: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+F5` (Windows)

2. **Navigate to Travel Memories**
   - Go to `/uk-memories` page

3. **Test Device Upload**
   - Click **"ADD PHOTO"** button (+ icon in top-right)
   - Select **"📱 FROM DEVICE"** tab
   - Choose 1-2 photos from your phone/computer
   - Fill in **Location** and **Date** (required)
   - Click **"ADD PHOTOS"**

4. **Verify Success**
   - Console should show: `☁️ Cloudinary results: X successful uploads`
   - Photos should appear as nodes on the canvas
   - No "No images were processed" error
   - No localStorage quota error

5. **Test Sharing**
   - Connect 2-3 photos with lines
   - Click **"SHARE"** button (top-right)
   - Should see success modal with shareable URL
   - Open URL in incognito window to verify

---

## Console Output Guide

### Successful Upload
```
🔄 Upload started: {uploadType: 'file', files: FileList, metadata: {...}}
☁️ Attempting Cloudinary upload...
☁️ Cloudinary results: 2 successful uploads
✅ Photo added: [node id]
💾 Saved to localStorage: 2 memories
```

### Failed Upload (No Preset)
```
🔄 Upload started: {uploadType: 'file', files: FileList, metadata: {...}}
☁️ Attempting Cloudinary upload...
❌ Cloudinary upload error: Error: Cloudinary credentials not configured...
📁 Falling back to local base64 encoding...
⚠️ Using base64 encoding - may hit localStorage quota after 2-3 photos
📁 Local files processed: 2
```

### Failed Upload (Wrong Preset Name)
```
🔄 Upload started: {uploadType: 'file', files: FileList, metadata: {...}}
☁️ Attempting Cloudinary upload...
❌ Some uploads failed: [{error: "Upload preset not found", filename: "IMG_1234.jpg"}]
❌ No image URLs generated!
```

---

## Troubleshooting

### Error: "Upload preset not found"
**Cause**: Preset name in `.env` doesn't match Cloudinary dashboard

**Fix**:
1. Check Cloudinary dashboard → Settings → Upload → Upload presets
2. Verify preset name is exactly: `uk-memories-unsigned`
3. Verify **Signing Mode** is **"Unsigned"** (not "Signed")
4. If wrong, either:
   - Rename preset in Cloudinary to match `.env`
   - Or update `.env` to match Cloudinary preset name
5. Restart dev server: `Ctrl+C` then `npm run dev`

### Error: "Invalid signature"
**Cause**: Preset is set to "Signed" instead of "Unsigned"

**Fix**:
1. Go to Cloudinary dashboard → Settings → Upload → Upload presets
2. Click on `uk-memories-unsigned` preset
3. Change **Signing Mode** to **"Unsigned"**
4. Click **"Save"**

### Error: "Cloudinary credentials not configured"
**Cause**: `.env` file changes not picked up by Vite

**Fix**:
1. Stop dev server: `Ctrl+C`
2. Verify `.env` has:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=yellowcircle-io
   VITE_CLOUDINARY_UPLOAD_PRESET=uk-memories-unsigned
   ```
3. Restart dev server: `npm run dev`
4. Hard refresh browser: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+F5` (Windows)

### Upload Works in Dev but Not Production
**Cause**: `.env` file not deployed to Firebase

**Fix**:
- Environment variables are compiled into the build at build-time
- Run `npm run build` to rebuild with new credentials
- Deploy: `firebase deploy --only hosting`

---

## Security Notes

### Why "Unsigned" Upload Preset?

**Unsigned uploads** allow client-side code (browser/mobile) to upload directly to Cloudinary without exposing your API secret.

**Security measures**:
- ✅ Folder restriction: All uploads go to `uk-memories/` folder only
- ✅ Resource type: Auto-detects images (prevents malicious file types)
- ✅ Rate limiting: Cloudinary applies automatic rate limits
- ✅ No API secret exposed: Unsigned preset requires no authentication

**Recommended additional security** (optional):
- Set max file size in preset (e.g., 10MB)
- Enable moderation: Auto-detect inappropriate content
- Set allowed formats: jpg, png, webp only

### Environment Variables Best Practices

- ✅ `.env` file is in `.gitignore` (already configured)
- ✅ Never commit `.env` to version control
- ✅ `VITE_` prefix makes variables available to client-side code
- ⚠️ These credentials are visible in browser (safe for unsigned uploads only)

---

## Cost Implications

### Cloudinary Free Tier
- **Transformations**: 25 credits/month (generous for personal projects)
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Request limit**: 25,000/month

### Current Usage Estimate
- **Uploads**: ~10-50 photos/month (very low)
- **Transformations**: Thumbnails generated on upload (~1 credit per 100 images)
- **Storage**: ~50-500 MB for typical photo collection
- **Bandwidth**: ~100-500 MB/month for viewing

**Expected cost**: $0.00/month (well within free tier)

---

## Alternative: Use Firebase Storage Instead

If you prefer not to use Cloudinary, you can modify the code to use Firebase Storage:

### Pros of Firebase Storage
- ✅ Already integrated (same project as Firestore)
- ✅ Simple upload API
- ✅ Free tier: 5 GB storage, 1 GB/day downloads

### Cons vs Cloudinary
- ❌ No automatic image optimization/compression
- ❌ No automatic thumbnail generation
- ❌ No CDN delivery (slower for global users)
- ❌ More complex URL management

**Recommendation**: Stick with Cloudinary for better image handling and CDN delivery.

---

## Next Steps

1. **Create the upload preset** in Cloudinary dashboard (see instructions above)
2. **Refresh browser** to pick up new environment variables
3. **Test upload** with 1-2 photos from your device
4. **Verify console output** shows successful Cloudinary upload
5. **Test sharing** to ensure URLs work in view mode
6. **Deploy to production** when ready:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## Support

**Cloudinary Documentation**:
- Upload presets: https://cloudinary.com/documentation/upload_presets
- Unsigned uploads: https://cloudinary.com/documentation/upload_images#unsigned_upload

**If Upload Still Fails**:
1. Check browser console for detailed error messages
2. Verify preset name matches exactly (case-sensitive)
3. Verify preset is "Unsigned" mode
4. Try creating a new preset with a different name
5. Check Cloudinary dashboard → Usage to verify quota

---

## Summary

**Time Required**: 5 minutes
**Difficulty**: Easy
**Cost**: Free (within Cloudinary free tier)
**Benefits**:
- ✅ Unlimited photo uploads (no localStorage quota)
- ✅ Fast CDN delivery
- ✅ Automatic image optimization
- ✅ Reliable cloud storage

**Next Action**: Create `uk-memories-unsigned` unsigned upload preset in Cloudinary dashboard
