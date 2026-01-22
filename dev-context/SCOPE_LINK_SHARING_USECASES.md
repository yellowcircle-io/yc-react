# Scope: Link Sharing Use Cases

**Created:** 2026-01-21
**Status:** Research / Scoping

---

## Overview

Enable multiple methods for users to save and share links to yellowCircle, including external methods (Slack, email, iPhone) and cross-user sharing without requiring direct login.

---

## Current State

### Existing Infrastructure

1. **URL Save Endpoint** (exists)
   ```
   https://yellowcircle.co/save?url=YOUR_URL&title=YOUR_TITLE&tags=tag1,tag2
   ```
   - Requires authentication
   - Opens save dialog

2. **Bookmarklet** (exists)
   - Popup and redirect versions
   - Works on desktop browsers

3. **Link Sharing** (partial)
   - Can share links to canvases
   - Can share folders with other users
   - Basic share modal exists

4. **Shortlinks** (exists)
   - `/go/{code}` redirects
   - Tracks clicks

---

## Use Cases to Support

### 1. Adding Links via Slack

**User Story:** User receives a link in Slack and wants to save it to yellowCircle.

**Options:**

**A. Slack App Integration** (Full Featured)
- Slash command: `/yc-save https://example.com`
- Message action: "Save to yellowCircle"
- Requires Slack App configuration
- OAuth flow for user linking

**B. Incoming Webhook** (Simpler)
- Zapier/Make.com integration
- Forward messages containing URLs
- Process and save to user's account

**C. Email-to-Save** (Cross-Platform)
- Dedicated email: `save@yellowcircle.io`
- Forward/share to email
- Parse links from email body
- Associate with user account

**Implementation Recommendation:** Start with Option C (Email-to-Save) as it works across all platforms including Slack's "Share via Email" feature.

---

### 2. Adding Links via Email

**User Story:** User receives a link via email and wants to save it.

**Implementation: Email-to-Save**

1. **Dedicated Inbox**
   - `save@yellowcircle.io` or `save+{usercode}@yellowcircle.io`
   - Process with Cloud Function or email webhook

2. **Email Parsing**
   - Extract URLs from body
   - Extract title from subject or link metadata
   - Handle forwarded emails

3. **User Association**
   - Option A: Unique email per user (`save+abc123@yellowcircle.io`)
   - Option B: Reply-to email must match registered account
   - Option C: Verification code in subject

**Services:**
- Resend (already integrated for notifications)
- SendGrid Inbound Parse
- Mailgun Routes

---

### 3. Adding Instagram Links via iPhone

**User Story:** User sees an Instagram post and wants to save it.

**A. Copy/Paste**
- Already works with existing bookmarklet/URL endpoint
- User copies link, opens yellowCircle, pastes

**B. iOS Share Sheet**
- Requires Safari/iOS extension or PWA
- "Share to yellowCircle" action
- Opens save dialog

**Implementation:**

1. **PWA with Web Share Target API**
   ```json
   // manifest.webmanifest
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
   - Works when app is installed to home screen
   - Appears in share sheet

2. **iOS Shortcut**
   - Create Siri Shortcut that opens save URL
   - Distribute via iCloud link
   - Works without app installation

---

### 4. Cross-User Link Sharing (Key Use Case)

**User Story:** User A wants to share a link with User B so it appears in User B's Link Archiver and UnityNOTES, without User B needing to log in at that moment.

**Scenarios:**

**A. Both Users Have Accounts**
- User A shares link to User B's email
- Link appears in User B's "Shared with Me" section
- User B can add to their own folders/canvases

**B. User B Doesn't Have Account**
- User A shares link via email/message
- Link includes invitation to view
- User B can view without account (public link page)
- Optional: Create account to save

**Implementation:**

1. **Share Modal Enhancement**
   ```jsx
   // ShareLinkModal.jsx
   - Share to existing user (email lookup)
   - Share via email (generates link)
   - Share to canvas
   - Copy shareable link
   ```

2. **Shareable Link Page**
   - `/shared/{shareCode}` - Public readable view
   - Shows link content, title, excerpt
   - "Save to My Links" button (if logged in)
   - "Sign up to save" prompt (if not logged in)

3. **Backend Changes**
   ```javascript
   // New collection: shared_links
   {
     shareCode: 'abc123',        // Short unique code
     linkId: 'original-link-id',
     sharedBy: 'user-a-id',
     sharedWith: 'user-b@email.com',  // or null for public
     sharedAt: timestamp,
     expiresAt: timestamp | null,     // Optional expiration
     viewCount: 0
   }
   ```

4. **Notification Integration**
   - Email to User B when link shared
   - In-app notification when User B logs in
   - Link appears in "Shared with Me" section

---

## Implementation Phases

### Phase 1: Email-to-Save (Slack + Email)
1. Set up email inbound webhook (Resend or SendGrid)
2. Cloud Function to parse and save links
3. User preference for unique save email
4. Documentation/onboarding

### Phase 2: iOS Share Sheet (Instagram)
1. Add Web Share Target to PWA manifest
2. Create iOS Shortcut for non-PWA users
3. Optimize mobile save flow

### Phase 3: Cross-User Sharing
1. Create `shared_links` collection
2. Build ShareLinkModal with email input
3. Create `/shared/{code}` public page
4. Notification on share

### Phase 4: Slack App (Optional)
1. Create Slack App
2. Implement slash command
3. OAuth for user linking
4. Message action

---

## Data Model Changes

### New: `shared_links` Collection
```javascript
{
  id: string,              // Auto-generated
  shareCode: string,       // Short unique code for URL
  linkId: string,          // Original link document ID
  sharedBy: string,        // User ID of sharer
  sharedWith: string,      // Email of recipient (null = public)
  sharedAt: timestamp,
  expiresAt: timestamp,    // Optional
  viewCount: number,
  savedBy: string[],       // User IDs who saved this
  status: 'active' | 'expired' | 'revoked'
}
```

### New: `user_save_emails` Collection
```javascript
{
  userId: string,
  saveEmail: string,       // save+{code}@yellowcircle.io
  createdAt: timestamp
}
```

---

## Security Considerations

1. **Email-to-Save**: Verify sender email matches account
2. **Shareable Links**: Rate limit creation, optional expiration
3. **Public View**: Strip sensitive metadata
4. **Spam Prevention**: Limit shares per day

---

## Effort Estimate

| Phase | Description | Effort |
|-------|-------------|--------|
| 1 | Email-to-Save | 8-12 hours |
| 2 | iOS Share Sheet | 2-4 hours |
| 3 | Cross-User Sharing | 6-10 hours |
| 4 | Slack App (Optional) | 8-12 hours |

**Core (Phases 1-3): 16-26 hours**
**With Slack: 24-38 hours**

---

## Open Questions

1. **Email Provider**: Use Resend (existing) or dedicated inbound like SendGrid?
2. **Public Links**: How long should shareable links last by default?
3. **Notifications**: Email + in-app or just one?
4. **Canvas Integration**: Should shared links auto-appear on shared canvases?

---

## Related Files

- `src/pages/LinkSaverExtensionPage.jsx` - Extension instructions
- `src/components/unity/ShareModal.jsx` - Existing share modal
- `src/utils/firestoreLinks.js` - Link operations
- `functions/linkArchiver.js` - Cloud Functions
