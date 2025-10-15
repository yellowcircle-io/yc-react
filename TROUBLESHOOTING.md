# UK Travel Memories - Troubleshooting Guide

## Issue: Photos Not Showing After Upload

### Quick Fixes to Try:

1. **Clear localStorage and start fresh:**
   - Click the "Clear All" button in the header
   - Refresh the page
   - Try uploading again

2. **Check browser console (F12 → Console tab):**
   Look for these log messages:
   - `Upload started:` - Confirms upload initiated
   - `File read successfully:` - File is being processed
   - `✅ Adding nodes to flow:` - Nodes are being created
   - `📊 Total nodes after update:` - Final node count
   - `💾 Saved to localStorage:` - Data is persisting

3. **Use the Debug button:**
   - Click "Debug" in the header
   - Check console for current state
   - Verify nodes array has items

### Common Issues:

#### Issue 1: Nodes Created But Images Not Visible
**Symptoms:** You see blank boxes or loading spinners
**Causes:**
- Image data URLs are corrupted
- Browser security blocking data URLs
- File format not supported

**Solutions:**
1. Try uploading via URL method instead:
   ```
   Test URL: https://images.unsplash.com/photo-1513635269975-59663e0ac1ad
   ```

2. Check console for "Image failed to load:" errors

3. Try smaller image files (< 1MB)

#### Issue 2: localStorage Interference
**Symptoms:** Nothing shows up even after upload
**Cause:** Stale localStorage data

**Solution:**
```javascript
// Open browser console (F12) and run:
localStorage.removeItem('uk-memories-data');
// Then refresh the page
```

#### Issue 3: React Flow Not Rendering
**Symptoms:** Empty canvas with no nodes
**Cause:** React Flow viewport needs adjustment

**Solution:**
1. Try dragging the canvas
2. Use the zoom controls (bottom left)
3. Check that nodes.length shows > 0 in header

### Test Sequence:

1. **Clear everything:**
   - Click "Clear All"
   - Confirm the action
   - Verify header shows "0 memories"

2. **Test with URL upload:**
   - Click "Add Memory"
   - Choose "Add from URL"
   - Paste: `https://images.unsplash.com/photo-1513635269975-59663e0ac1ad`
   - Location: "Test Location"
   - Date: Today
   - Submit

3. **Check console logs:**
   ```
   Expected output:
   Upload started: {filesOrUrls: Array(1), metadata: {...}, uploadType: "url"}
   Using URL: ["https://images..."]
   ✅ Adding nodes to flow: 1 nodes
   📍 Node positions: [{id: "photo-...", pos: {x: ..., y: ...}}]
   🖼️ Image URLs: ["https://images..."]
   📊 Total nodes after update: 1
   💾 Saved to localStorage: 1 memories
   ```

4. **Verify visually:**
   - Header should show "1 memory"
   - Canvas should show a photo card
   - Card should have the image visible
   - Location and date should appear on hover

### Still Not Working?

**Check these:**

1. **Browser compatibility:**
   - Chrome/Edge: ✅ Full support
   - Firefox: ✅ Full support
   - Safari: ⚠️ May have data URL limits

2. **File size limits:**
   - Local files: < 5MB recommended
   - Data URLs have browser limits (~10MB)
   - Use Cloudinary for larger files

3. **Network issues:**
   - If using URL method, ensure URL is accessible
   - Check CORS errors in console
   - Try a different image URL

### Debug Commands:

Open browser console (F12) and try:

```javascript
// Check current state
console.log('Nodes:', window.localStorage.getItem('uk-memories-data'));

// Force clear everything
localStorage.clear();
window.location.reload();

// Check if React Flow is loaded
document.querySelector('.react-flow');
```

### Report Issue:

If problem persists, gather this info:
- Browser name and version
- Console error messages (screenshot)
- Steps you took before the issue
- Result of clicking "Debug" button
