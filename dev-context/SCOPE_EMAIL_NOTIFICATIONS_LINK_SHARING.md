# Email Notifications for Link Sharing - Scope Document

**Created:** 2026-01-20
**Status:** Scoped - Ready for Implementation
**Priority:** Medium

---

## Overview

When a user shares a link with another user (by email), the recipient should receive an email notification informing them about the shared link. This creates awareness and drives engagement with the shared content.

---

## Current State

- Links can be shared via `shareLink()` in `src/utils/firestoreLinks.js`
- Sharing stores target email and optional userId in `sharedWith` array
- **No email notifications are sent** - sharing is silent

---

## Proposed Implementation

### 1. Cloud Function Trigger

Create a Firestore trigger that fires when a link's `sharedWith` array is modified:

```javascript
// functions/linkSharingNotifications.js

exports.onLinkShared = onDocumentUpdated('links/{linkId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Find new shares (in after but not in before)
  const newShares = findNewShares(before.sharedWith, after.sharedWith);

  for (const share of newShares) {
    if (share.type === 'user' && share.targetEmail) {
      await sendShareNotificationEmail(share, after);
    }
  }
});
```

### 2. Email Template

**Subject:** `[Name] shared a link with you: "[Link Title]"`

**Body:**
```
Hi,

[Sharer Name or Email] shared a link with you on yellowCircle:

---
**[Link Title]**
[Link Domain]

[Link Excerpt - first 200 chars]
---

View this link in your Link Saver:
[CTA Button: View in Link Saver]

Or open the link directly:
[Link URL]

---
You received this email because someone shared a link with you on yellowCircle.
Manage your notification preferences: [Settings Link]
```

### 3. Email Service Options

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **SendGrid** | Free tier (100/day), good API | Additional service | Free - $19.95/mo |
| **Firebase Email Extension** | Native integration | Limited customization | ~$0.0001/email |
| **Resend** | Modern API, great DX | Newer service | Free tier 100/day |
| **AWS SES** | Very cheap at scale | More complex setup | $0.10/1000 emails |

**Recommendation:** Start with **Firebase Email Extension** for simplicity, migrate to SendGrid/Resend if customization needed.

### 4. Rate Limiting & Spam Prevention

- **Per-user limit:** Max 10 share notification emails per hour
- **Per-link limit:** Max 5 notification emails per link per day
- **Unsubscribe:** Honor user's `notificationEmails` preference in `user_settings`
- **Deduplication:** Don't re-notify if same link shared to same user again

### 5. User Settings Integration

Add to `UserSettingsContext.jsx`:
```javascript
DEFAULT_SETTINGS = {
  // ... existing
  linkShareNotifications: true,  // Receive email when someone shares with you
  linkShareDigest: false,        // Bundle into daily digest instead of immediate
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `functions/index.js` | Add Firestore trigger for share notifications |
| `functions/emailTemplates/linkShared.js` | Create email template |
| `src/contexts/UserSettingsContext.jsx` | Add notification preference |
| `src/pages/AccountSettingsPage.jsx` | Add toggle for share notifications |
| `firestore.rules` | Ensure user_settings readable for Cloud Function |

---

## Implementation Steps

1. **Phase 1: Basic Notification**
   - Set up email service (Firebase Extension or SendGrid)
   - Create Firestore trigger for `links/{linkId}` updates
   - Implement basic email template
   - Send immediate notification on share

2. **Phase 2: User Preferences**
   - Add `linkShareNotifications` to user settings
   - Check preference before sending
   - Add settings UI toggle

3. **Phase 3: Enhanced Features**
   - Daily digest option (bundle notifications)
   - Rich HTML email template
   - Click tracking for analytics
   - Unsubscribe link handling

---

## Security Considerations

- **Email validation:** Verify target email format before sending
- **Rate limiting:** Prevent spam/abuse via share-bombing
- **Sender verification:** Use verified domain for deliverability
- **No sensitive data:** Don't include full link content in email

---

## Testing Plan

1. Share link to test email, verify receipt
2. Share link to user with notifications disabled, verify no email
3. Exceed rate limit, verify throttling works
4. Test unsubscribe flow
5. Verify email renders correctly across clients (Gmail, Outlook, Apple Mail)

---

## Estimated Effort

- **Phase 1:** 2-3 hours
- **Phase 2:** 1-2 hours
- **Phase 3:** 3-4 hours

**Total:** 6-9 hours of development

---

## Dependencies

- Email service account (SendGrid/Firebase Extension)
- Verified sender domain for production
- Cloud Functions billing enabled

---

## Success Metrics

- Email delivery rate > 95%
- Open rate > 30%
- Click-through rate > 15%
- User opt-out rate < 10%
