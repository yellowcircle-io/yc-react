# iOS Shortcut Scope Document

**Created:** January 22, 2026
**Status:** Planned
**Priority:** P2
**Est. Effort:** 2-4 hours

---

## Problem Statement

Users must manually build an iOS Shortcut following step-by-step instructions. This is cumbersome and error-prone. A prebuilt shortcut that users can install with one tap would significantly improve usability.

---

## Proposed Solution

### Option A: Downloadable .shortcut File (Recommended)

Create a `.shortcut` file that users can download and install directly.

**Workflow:**
1. User generates API token in Account Settings
2. User clicks "Download iOS Shortcut"
3. Shortcut file downloads with token pre-configured
4. User taps to install in Shortcuts app
5. Shortcut appears in Share Sheet

**Technical Approach:**
- Generate `.shortcut` file dynamically with user's token embedded
- Host file via Cloud Function that returns proper MIME type
- Endpoint: `GET /linkArchiverDownloadShortcut?token={user_token}`

**Shortcut Actions:**
```
1. Receive [URLs, Text] from Share Sheet
2. Get URLs from Input
3. For each URL:
   - Get Contents of URL
     - URL: https://us-central1-yellowcircle-app.cloudfunctions.net/linkArchiverQuickSave
     - Method: GET
     - Query: token={TOKEN}&url={URL}
   - Show Notification: "Saved to yellowCircle"
```

---

### Option B: iCloud Shortcut Link

Host the shortcut on iCloud and provide a shareable link.

**Pros:**
- Apple-native distribution
- Automatic updates possible

**Cons:**
- Requires manual token entry after install
- Can't pre-configure token
- Depends on iCloud availability

**Workflow:**
1. User installs shortcut from iCloud link
2. On first run, shortcut prompts for API token
3. Token stored in Shortcuts app
4. Subsequent runs use stored token

---

## Recommendation: Hybrid Approach

1. **Primary:** Option A (downloadable .shortcut with token embedded)
2. **Fallback:** Option B (iCloud link for users who prefer it)

---

## Implementation Plan

### Phase 1: Shortcut File Generation (2 hours)

1. **Research `.shortcut` file format**
   - Apple's Shortcuts app uses a plist-based format
   - Can be generated programmatically

2. **Create Cloud Function**
   ```javascript
   exports.linkArchiverDownloadShortcut = functions.https.onRequest(async (req, res) => {
     const token = req.query.token;
     // Validate token exists in Firestore
     // Generate .shortcut plist with token embedded
     // Return with Content-Type: application/x-apple-shortcut
   });
   ```

3. **Add UI in Account Settings**
   - "Download iOS Shortcut" button (only shows if token exists)
   - Brief instructions

### Phase 2: iCloud Fallback (1 hour)

1. Create template shortcut with "Ask for Input" for token
2. Upload to iCloud
3. Add link to Account Settings as alternative

### Phase 3: Testing & Polish (1 hour)

1. Test on iOS 16+ devices
2. Test Share Sheet integration
3. Add success/error notifications in shortcut
4. Update documentation

---

## UI Changes

### Account Settings → Integrations Tab

**Current:**
- iOS Shortcut Example (manual step-by-step)

**Proposed:**
```
┌─────────────────────────────────────────┐
│ 📱 iOS Shortcut                         │
│                                         │
│ Save links directly from the Share      │
│ Sheet on your iPhone or iPad.           │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  [📥 Download Shortcut]             │ │
│ │  One-tap install with your token    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Or install manually via iCloud ›        │
└─────────────────────────────────────────┘
```

---

## Technical Notes

### .shortcut File Format

The `.shortcut` file is a binary plist containing:
- WFWorkflowActions (array of action dictionaries)
- WFWorkflowImportQuestions (setup prompts)
- WFWorkflowTypes (share extension types)

**Key Fields:**
```xml
<dict>
  <key>WFWorkflowTypes</key>
  <array>
    <string>NCWidget</string>
    <string>WatchKit</string>
    <string>ActionExtension</string>  <!-- Share Sheet -->
  </array>
  <key>WFWorkflowInputContentItemClasses</key>
  <array>
    <string>WFURLContentItem</string>
    <string>WFArticleContentItem</string>
  </array>
</dict>
```

### Dependencies

- None (pure Cloud Function)
- Requires existing API token system

---

## Success Criteria

1. User can install shortcut in under 30 seconds
2. Shortcut works from Safari Share Sheet
3. Saves link with success notification
4. Works offline (queues for later sync - stretch goal)

---

## Out of Scope

- Android equivalent (no native shortcut system)
- Siri integration ("Hey Siri, save this link")
- Widget support

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `functions/linkArchiver.js` | Add `downloadShortcut` function |
| `functions/index.js` | Export new function |
| `src/pages/AccountSettingsPage.jsx` | Add download button |
| `public/shortcuts/template.shortcut` | Base shortcut template |

---

## References

- [Apple Shortcuts File Format](https://support.apple.com/guide/shortcuts/welcome/ios)
- [Web Share Target API](https://web.dev/web-share-target/)
- [Shortcut Signing](https://routinehub.co/) (community shortcuts)
