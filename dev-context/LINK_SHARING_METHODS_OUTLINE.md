# Link Sharing Methods - Complete Outline

**Created:** 2026-01-22
**Status:** Reference Document
**Related:** `dev-context/SCOPE_LINK_SHARING_USECASES.md`

---

## Overview

This document outlines all available methods for sharing links within the yellowCircle platform. The system supports multiple sharing paradigms to accommodate different user workflows.

---

## 1. Cross-User Sharing (In-Platform)

### 1.1 Share Link with User (Email)
**Status:** ✅ Implemented

**Flow:**
1. User clicks Share button on a link in Link Archiver
2. ShareLinkDrawer opens with email input
3. Enter collaborator's email address
4. Choose share type: `user` (direct) or `canvas` (add to canvas)
5. Recipient receives in-app notification
6. Link appears in recipient's "Shared with Me" view

**Firestore Structure:**
```javascript
// In links collection, sharedWith array
{
  sharedWith: [
    {
      type: 'user',
      targetId: 'user-abc123',
      targetEmail: 'colleague@example.com',
      sharedAt: timestamp,
      sharedBy: 'user-xyz789',
      permissions: 'view' // or 'edit'
    }
  ]
}
```

**Components:**
- `LinkArchiverPage.jsx` - Share button on LinkCard
- `ShareLinkDrawer` - UI for adding shares
- `firestoreLinks.js` - `shareLink()`, `unshareLink()`

### 1.2 Share Link to Canvas
**Status:** ✅ Implemented

**Flow:**
1. User clicks Share button on link
2. Select "Add to Canvas" option
3. Choose target canvas from list
4. Link appears as LinkNode on selected canvas

**Firestore Structure:**
```javascript
{
  sharedWith: [
    {
      type: 'canvas',
      targetId: 'capsule-id',
      targetName: 'My Research Canvas',
      sharedAt: timestamp,
      sharedBy: 'user-xyz789'
    }
  ]
}
```

**Components:**
- `ShareLinkDrawer` - Canvas selection
- `firestoreLinks.js` - `shareLinkToCanvas()`, `unshareLinkFromCanvas()`

### 1.3 Share Folder
**Status:** ✅ Implemented

**Flow:**
1. Right-click folder in sidebar
2. Select "Share Folder"
3. Enter collaborator email
4. All links in folder become accessible

**Components:**
- `LinkArchiverPage.jsx` - Folder context menu
- `firestoreLinks.js` - `shareFolder()`, `unshareFolder()`

---

## 2. Slack Integration

### 2.1 Save Link via Slack Command
**Status:** ✅ Implemented

**Usage:**
```
!savelink https://example.com/article
!save https://example.com/article
```

**Flow:**
1. User posts link with `!savelink` or `!save` command in Slack
2. `slackWebhook` Cloud Function receives event
3. URL extracted and saved to Link Archiver
4. Confirmation posted back to Slack channel

**Configuration:**
- Cloud Function: `functions/index.js` → `slackWebhook`
- Slack App: Events API subscription for `message.channels`, `message.im`, `app_mention`

### 2.2 Share Link via Sleepless Agent
**Status:** ⚠️ Partial (Infrastructure Ready)

**Usage:**
```
/sleepless share link "Article Title" with @user
/sleepless post link to #channel
```

**Flow:**
1. User invokes `/sleepless` command with share request
2. Command queued to `sleepless_queue` collection
3. Agent processes request, creates share, posts confirmation

**Firestore Structure:**
```javascript
// sleepless_queue collection
{
  command: '/sleepless share link...',
  text: 'share link "Article" with @john',
  user_id: 'U12345',
  channel_id: 'C67890',
  status: 'pending',
  tier: 2,
  created_at: timestamp,
  source: 'firebase_webhook'
}
```

### 2.3 Post Share Notification to Slack
**Status:** 🔲 To Implement

**Trigger:** When a link is shared with another user

**Flow:**
1. User shares link via UI
2. `shareLink()` function calls notification service
3. Slack message posted to configured channel
4. Recipient notified in Slack

**Integration Points:**
- `firestoreLinks.js` - Add Slack notification to `shareLink()`
- `integrations.js` - `sendToSlack()` function
- n8n webhook for threaded notifications

---

## 3. External Sharing Methods

### 3.1 Bookmarklet (Desktop)
**Status:** ✅ Implemented

**Flow:**
1. User drags bookmarklet to bookmark bar
2. On any webpage, click bookmarklet
3. Opens save dialog with pre-filled URL/title
4. Link saved to Link Archiver

**Location:**
- `src/pages/LinkSaverExtensionPage.jsx` - Instructions and bookmarklet code

**Bookmarklet Code:**
```javascript
javascript:(function(){window.open('https://yellowcircle.io/save?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'yellowcircle','width=500,height=600')})();
```

### 3.2 URL Save Endpoint
**Status:** ✅ Implemented

**Endpoint:**
```
https://yellowcircle.io/save?url={URL}&title={TITLE}&tags={TAGS}
```

**Query Parameters:**
- `url` - Required: URL to save
- `title` - Optional: Custom title
- `tags` - Optional: Comma-separated tags

**Flow:**
1. User opens URL with parameters
2. Auth check (must be logged in)
3. Save dialog opens with pre-filled data
4. Confirm to save

### 3.3 iOS Share Sheet (PWA)
**Status:** 🔲 Planned (Phase 2)

**Requirements:**
- PWA installed to home screen
- Web Share Target API in manifest

**manifest.json Addition:**
```json
{
  "share_target": {
    "action": "/save",
    "method": "GET",
    "params": {
      "url": "url",
      "title": "title"
    }
  }
}
```

### 3.4 iOS Shortcut
**Status:** 🔲 Planned

**Flow:**
1. User installs Shortcut from iCloud link
2. Share any content → "Save to yellowCircle"
3. Shortcut opens save URL

**Shortcut Actions:**
1. Get clipboard/share input
2. Get URL from input
3. Open URL: `https://yellowcircle.io/save?url={input}`

### 3.5 Email-to-Save
**Status:** 🔲 Planned (Phase 1)

**Address:**
```
save@yellowcircle.io
save+{usercode}@yellowcircle.io
```

**Flow:**
1. User forwards email containing links to save address
2. Email webhook (Resend/SendGrid) receives
3. Cloud Function parses URLs from email body
4. Links saved to user's account
5. Confirmation email sent

**User Association:**
- Option A: Unique save address per user
- Option B: Match sender email to account
- Option C: Code in subject line

---

## 4. Public/External Link Sharing

### 4.1 Shareable Public Link
**Status:** 🔲 Planned (Phase 3)

**Flow:**
1. User generates public share link for saved link
2. URL: `https://yellowcircle.io/shared/{shareCode}`
3. Anyone with link can view content
4. Optional: Sign up prompt to save

**Firestore Structure:**
```javascript
// shared_links collection
{
  shareCode: 'abc123',
  linkId: 'original-link-id',
  sharedBy: 'user-id',
  sharedWith: null, // null = public
  expiresAt: timestamp | null,
  viewCount: 0,
  status: 'active'
}
```

### 4.2 Copy Link to Clipboard
**Status:** ✅ Implemented

**Flow:**
1. Click "Copy Link" on any saved link
2. Original URL copied to clipboard
3. Paste and share anywhere

---

## 5. Integration Methods

### 5.1 n8n Webhook
**Status:** ✅ Implemented

**Endpoint:** Configured via `VITE_N8N_WEBHOOK`

**Use Cases:**
- Lead capture → Airtable + Slack + AI drafts
- Link share notifications
- Threaded Slack conversations

### 5.2 Direct Slack Webhook (Fallback)
**Status:** ✅ Implemented

**Endpoint:** Configured via `VITE_SLACK_WEBHOOK`

**Use Cases:**
- Direct notifications when n8n is down
- Simple link share alerts

---

## 6. Summary Matrix

| Method | Save Link | Share Link | Status |
|--------|-----------|------------|--------|
| In-App Share to User | - | ✅ | Implemented |
| In-App Share to Canvas | - | ✅ | Implemented |
| Folder Sharing | - | ✅ | Implemented |
| Slack `!savelink` | ✅ | - | Implemented |
| Sleepless `/sleepless share` | - | ⚠️ | Infrastructure Ready |
| Bookmarklet | ✅ | - | Implemented |
| URL Endpoint | ✅ | - | Implemented |
| iOS Share Sheet | ✅ | - | Planned |
| iOS Shortcut | ✅ | - | Planned |
| Email-to-Save | ✅ | - | Planned |
| Public Share Link | - | 🔲 | Planned |
| Slack Notification on Share | - | 🔲 | To Implement |

---

## 7. Next Steps

### Immediate (Slack Notifications)
1. Add Slack notification when link is shared
2. Post to designated channel with share details
3. Include link to view shared content

### Phase 1: Email-to-Save
1. Set up Resend inbound webhook
2. Create Cloud Function for email parsing
3. Generate unique save addresses per user

### Phase 2: iOS Share Sheet
1. Add `share_target` to PWA manifest
2. Create `/save` route handler for share intents
3. Test PWA installation flow

### Phase 3: Public Sharing
1. Create `shared_links` collection
2. Build `/shared/{code}` page
3. Add expiration and view tracking

---

## 8. Configuration Reference

### Environment Variables
```bash
VITE_N8N_WEBHOOK=https://n8n.railway.app/webhook/...
VITE_SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

### Firebase Config
```bash
firebase functions:config:set slack.bot_token=xoxb-...
firebase functions:config:set slack.signing_secret=...
firebase functions:config:set slack.default_channel=C...
```

### Slack App Permissions
- `chat:write` - Post messages
- `channels:read` - Read channel info
- `commands` - Slash commands
- `incoming-webhook` - Webhooks

---

*Last updated: 2026-01-22*
