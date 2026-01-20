# Comments & In-Platform Notifications - Scope Document

**Created:** 2026-01-20
**Status:** Scoped - Architecture Design
**Priority:** Medium-High

---

## Overview

Enable users to comment on shared content and receive in-platform notifications for relevant activities. This creates engagement loops and facilitates collaboration within the yellowCircle ecosystem.

---

## Part 1: Comment System

### 1.1 Commentable Entities

| Entity | Collection | Comment Scope |
|--------|------------|---------------|
| **Links** | `links` | Comments on shared links |
| **Canvases** | `capsules` | Comments on canvas content |
| **Canvas Nodes** | `capsules/{id}/nodes` | Comments on specific nodes |

### 1.2 Data Model

```javascript
// comments collection
{
  id: string,

  // Target reference
  targetType: 'link' | 'capsule' | 'node',
  targetId: string,
  parentCapsuleId?: string,     // If commenting on a node

  // Author
  authorId: string,
  authorName: string,
  authorEmail: string,

  // Content
  content: string,              // Max 2000 chars
  mentions: string[],           // Array of @mentioned userIds

  // Threading
  parentCommentId: string|null, // For replies
  depth: number,                // 0 = top-level, 1 = reply, max 3

  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
  editedAt: timestamp|null,

  // Moderation
  isDeleted: boolean,
  deletedAt: timestamp|null,
  deletedBy: string|null
}
```

### 1.3 Firestore Structure Options

**Option A: Subcollection per Target**
```
links/{linkId}/comments/{commentId}
capsules/{capsuleId}/comments/{commentId}
```
- Pros: Easy to query comments for a specific item
- Cons: Harder to get "all comments by user" or "all mentions of user"

**Option B: Root Collection with Indexes**
```
comments/{commentId}
  - targetType: 'link'
  - targetId: 'abc123'
```
- Pros: Flexible querying, single collection
- Cons: More indexes needed

**Recommendation:** Option B (root collection) for flexibility

### 1.4 Comment Features

- **Create/Edit/Delete** - Basic CRUD
- **Threading** - Reply to comments (max depth 3)
- **@Mentions** - Mention users, triggers notification
- **Reactions** - Like/emoji reactions (future)
- **Edit History** - Track edits with `editedAt`
- **Soft Delete** - Show "[deleted]" placeholder

### 1.5 Security Rules

```javascript
match /comments/{commentId} {
  // Anyone can read comments on content they can access
  allow read: if request.auth != null;

  // Create: authenticated users on accessible targets
  allow create: if request.auth != null
    && request.resource.data.authorId == request.auth.uid
    && request.resource.data.content.size() <= 2000;

  // Update: author only, within 24 hours
  allow update: if request.auth != null
    && resource.data.authorId == request.auth.uid
    && (request.time - resource.data.createdAt) < duration.value(24, 'h');

  // Delete: author or target owner
  allow delete: if request.auth != null
    && (resource.data.authorId == request.auth.uid);
}
```

---

## Part 2: In-Platform Notifications

### 2.1 Notification Types

| Type | Trigger | Icon | Message |
|------|---------|------|---------|
| `link_shared` | Link shared with user | Share icon | "[Name] shared a link with you" |
| `canvas_shared` | Canvas shared/collaboration invite | Users icon | "[Name] invited you to collaborate" |
| `comment_added` | Comment on your content | Message icon | "[Name] commented on [Title]" |
| `comment_reply` | Reply to your comment | Reply icon | "[Name] replied to your comment" |
| `mention` | @mentioned in comment | At icon | "[Name] mentioned you in [Title]" |
| `canvas_update` | Significant change to shared canvas | Edit icon | "[Canvas] was updated" |

### 2.2 Notification Data Model

```javascript
// notifications collection
{
  id: string,

  // Recipient
  userId: string,               // Who receives this notification

  // Type & Action
  type: 'link_shared' | 'canvas_shared' | 'comment_added' | 'comment_reply' | 'mention',
  actionUrl: string,            // Deep link to relevant content

  // Content
  title: string,                // Short title
  message: string,              // Full message

  // Actor (who triggered this)
  actorId: string,
  actorName: string,
  actorAvatar?: string,

  // Target reference
  targetType: string,
  targetId: string,
  targetTitle: string,

  // Status
  isRead: boolean,
  readAt: timestamp|null,

  // Metadata
  createdAt: timestamp,

  // Grouping (for batching similar notifications)
  groupKey?: string,            // e.g., "comments:link:abc123"
  groupCount?: number
}
```

### 2.3 Notification UI Components

**2.3.1 Notification Bell (Header)**
```jsx
<NotificationBell>
  - Shows unread count badge
  - Dropdown with recent notifications
  - "Mark all read" action
  - "View all" link to full page
</NotificationBell>
```

**2.3.2 Notification Center (Full Page)**
```jsx
<NotificationCenter>
  - Filter by type (All, Shares, Comments, Mentions)
  - Group by date (Today, Yesterday, This Week, Earlier)
  - Infinite scroll/pagination
  - Bulk actions (mark read, delete)
</NotificationCenter>
```

**2.3.3 Toast Notifications (Real-time)**
```jsx
<NotificationToast>
  - Appears for new notifications while in-app
  - Auto-dismiss after 5 seconds
  - Click to navigate to content
  - "X" to dismiss immediately
</NotificationToast>
```

### 2.4 Real-time Updates

Use Firestore `onSnapshot` listener for real-time notifications:

```javascript
// NotificationContext.jsx
const unsubscribe = onSnapshot(
  query(
    collection(db, 'notifications'),
    where('userId', '==', currentUserId),
    where('isRead', '==', false),
    orderBy('createdAt', 'desc'),
    limit(20)
  ),
  (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUnreadNotifications(notifications);
  }
);
```

### 2.5 Notification Triggers (Cloud Functions)

```javascript
// functions/notifications.js

// Trigger when link is shared
exports.onLinkShared = onDocumentUpdated('links/{linkId}', async (event) => {
  const newShares = findNewShares(event.data.before, event.data.after);
  for (const share of newShares) {
    await createNotification({
      userId: share.targetId,
      type: 'link_shared',
      actorId: share.sharedBy,
      targetType: 'link',
      targetId: event.params.linkId,
      targetTitle: event.data.after.data().title
    });
  }
});

// Trigger when comment is created
exports.onCommentCreated = onDocumentCreated('comments/{commentId}', async (event) => {
  const comment = event.data.data();

  // Notify target owner
  await notifyTargetOwner(comment);

  // Notify parent comment author (if reply)
  if (comment.parentCommentId) {
    await notifyCommentAuthor(comment);
  }

  // Notify @mentioned users
  for (const mentionedUserId of comment.mentions) {
    await createMentionNotification(comment, mentionedUserId);
  }
});
```

---

## Part 3: Implementation Plan

### Phase 1: Notifications Infrastructure (Foundation)
1. Create `notifications` collection
2. Create `NotificationContext` provider
3. Implement `NotificationBell` component
4. Add to header/navigation
5. Basic Cloud Function triggers

**Files:**
- `src/contexts/NotificationContext.jsx` (new)
- `src/components/notifications/NotificationBell.jsx` (new)
- `src/components/notifications/NotificationDropdown.jsx` (new)
- `functions/notifications.js` (new)
- `firestore.rules` (update)
- `firestore.indexes.json` (update)

### Phase 2: Comment System
1. Create `comments` collection
2. Implement comment UI components
3. Add comments to Link detail view
4. Add comments to Canvas nodes
5. Notification triggers for comments

**Files:**
- `src/components/comments/CommentList.jsx` (new)
- `src/components/comments/CommentInput.jsx` (new)
- `src/components/comments/CommentThread.jsx` (new)
- `src/utils/firestoreComments.js` (new)
- `functions/commentTriggers.js` (new)

### Phase 3: Enhanced Features
1. @mention autocomplete
2. Toast notifications (real-time)
3. Notification center full page
4. Email digest integration
5. Notification preferences

**Files:**
- `src/components/comments/MentionInput.jsx` (new)
- `src/components/notifications/NotificationToast.jsx` (new)
- `src/pages/NotificationsPage.jsx` (new)
- Settings integration

---

## Firestore Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isRead", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "comments",
      "fields": [
        { "fieldPath": "targetType", "order": "ASCENDING" },
        { "fieldPath": "targetId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## UI Mockups

### Notification Bell
```
┌─────────────────────────────────┐
│  [Logo]    [Nav]    [Bell🔴3]  │
└─────────────────────────────────┘
                          ↓
              ┌──────────────────────┐
              │ Notifications        │
              ├──────────────────────┤
              │ 🔗 John shared a     │
              │    link with you     │
              │    "React Best..."   │
              │           2 min ago  │
              ├──────────────────────┤
              │ 💬 Jane commented on │
              │    your canvas       │
              │          15 min ago  │
              ├──────────────────────┤
              │ [Mark all read]      │
              │ [View all →]         │
              └──────────────────────┘
```

### Comment Thread
```
┌─────────────────────────────────┐
│ Comments (3)                    │
├─────────────────────────────────┤
│ [Avatar] John Doe               │
│ Great article! @Jane should     │
│ check this out.                 │
│                    2 hours ago  │
│     ↳ [Reply] [Like]            │
│                                 │
│     [Avatar] Jane Smith         │
│     Thanks for the mention!     │
│                    1 hour ago   │
├─────────────────────────────────┤
│ [Add a comment...]        [Post]│
└─────────────────────────────────┘
```

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Notifications | 8-12 hours |
| Phase 2: Comments | 10-15 hours |
| Phase 3: Enhanced | 8-10 hours |
| **Total** | **26-37 hours** |

---

## Dependencies

- Firebase Cloud Functions v2
- Real-time Firestore listeners
- User presence tracking (optional)
- Push notification service (future - Firebase Cloud Messaging)

---

## Success Metrics

- Notification delivery latency < 2 seconds
- User engagement with notifications > 40%
- Comment participation rate > 15% of shared content
- Feature adoption > 50% of active users

---

## Future Enhancements (Out of Scope)

- Push notifications (mobile/desktop)
- Email notification digest
- Notification snooze/mute
- Comment reactions (emoji)
- Comment threading beyond 3 levels
- Rich text comments (markdown)
- File attachments in comments
