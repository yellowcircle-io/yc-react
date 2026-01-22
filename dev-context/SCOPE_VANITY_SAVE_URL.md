# Vanity Save URL Scope Document

**Created:** January 22, 2026
**Status:** Proposed
**Priority:** P2
**Est. Effort:** 3-4 hours

---

## Problem Statement

Current methods to save links externally require:
- **Bookmarklet:** Only works on desktop, requires installation
- **API Token GET:** User must construct URL manually with query params
- **iOS Shortcut:** Requires building/installing shortcut

A simpler method: just prepend a URL prefix to any link.

---

## Proposed Solution

### Vanity Save URL Pattern

```
yellowcircle.io/s/{token}/{destination-url}
```

**Examples:**
```
yellowcircle.io/s/yc_abc123/https://example.com/article
yellowcircle.io/s/yc_abc123/https://nytimes.com/2026/01/22/tech/ai.html
yellowcircle.io/s/yc_abc123/reddit.com/r/programming/comments/xyz
```

### Flow

1. User visits vanity URL
2. App extracts token and destination URL
3. Validates token → retrieves userId
4. Saves link to user's collection (via existing linkArchiver)
5. Tracks click (optional - leverage shortlink analytics)
6. HTTP 302 redirects to destination

### Route Configuration

```jsx
// RouterApp.jsx
<Route path="/s/:token/*" element={<VanitySavePage />} />
```

The `*` splat captures everything after the token as the destination URL.

---

## Technical Details

### URL Parsing

The destination URL needs careful parsing:

```javascript
// VanitySavePage.jsx
const { token } = useParams();
const location = useLocation();

// Extract everything after /s/{token}/
const fullPath = location.pathname;
const tokenIndex = fullPath.indexOf(token) + token.length + 1;
let destinationUrl = fullPath.substring(tokenIndex);

// Handle protocol
if (!destinationUrl.startsWith('http')) {
  destinationUrl = 'https://' + destinationUrl;
}

// Decode URI components
destinationUrl = decodeURIComponent(destinationUrl);
```

### Edge Cases

| URL Input | Parsed Result |
|-----------|---------------|
| `https://example.com` | `https://example.com` |
| `example.com` | `https://example.com` |
| `http://example.com` | `http://example.com` |
| `https://example.com/path?q=1&b=2` | Preserved with query params |
| `https://example.com/path#anchor` | Preserved with hash |

### Security

1. **Token Validation:** Must be valid `yc_*` format token in Firestore
2. **Rate Limiting:** Consider limiting saves per token per minute
3. **No PII Exposure:** Token is not userId - can be revoked independently

### Integration with Existing Systems

Leverage existing infrastructure:
- `linkArchiver.quickSave()` for saving
- `shortlinks` collection pattern for tracking (optional)
- Firestore `apiTokens` for validation

---

## Implementation Plan

### Phase 1: Core Route (2 hours)

1. **Create VanitySavePage.jsx**
   ```javascript
   // Extract token and URL
   // Validate token (call Cloud Function or client-side Firestore)
   // Save link
   // Redirect
   ```

2. **Add route to RouterApp.jsx**
   ```jsx
   <Route path="/s/:token/*" element={<VanitySavePage />} />
   ```

3. **UI States**
   - Loading: "Saving & redirecting..."
   - Error: "Invalid link or token" with manual redirect option
   - Success: Immediate redirect

### Phase 2: Cloud Function (1 hour)

Create serverless version for faster execution:

```javascript
// /s/{token}/{url} → Cloud Function
exports.vanitySave = functions.https.onRequest(async (req, res) => {
  const pathParts = req.path.split('/');
  const token = pathParts[2];
  const destinationUrl = pathParts.slice(3).join('/');

  // Validate token
  // Save link
  // Redirect
  res.redirect(302, destinationUrl);
});
```

### Phase 3: UI Integration (1 hour)

1. Show vanity URL in Account Settings (Integrations tab)
2. Add to extension page as alternative method
3. Copy button for easy sharing

---

## UI Display

### Account Settings → Integrations

```
┌─────────────────────────────────────────────────────┐
│ 🔗 Vanity Save URL                                  │
│                                                     │
│ Prepend this to any URL to save it:                 │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ yellowcircle.io/s/yc_abc123/                    │ │
│ └─────────────────────────────────────────────────┘ │
│ [Copy URL Prefix]                                   │
│                                                     │
│ Example:                                            │
│ yellowcircle.io/s/yc_abc123/https://example.com    │
└─────────────────────────────────────────────────────┘
```

---

## Comparison with Alternatives

| Feature | Bookmarklet | API GET | Vanity URL |
|---------|-------------|---------|------------|
| Setup Required | Install bookmark | None | None |
| Desktop | ✅ | ✅ | ✅ |
| Mobile | ❌ | ✅ | ✅ |
| One-handed use | ❌ | ❌ | ✅ |
| Memorable | ❌ | ❌ | ✅ |
| Works in messages | ❌ | ✅ | ✅ |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/VanitySavePage.jsx` | CREATE - Main redirect page |
| `src/RouterApp.jsx` | MODIFY - Add /s/:token/* route |
| `src/pages/AccountSettingsPage.jsx` | MODIFY - Show vanity URL |
| `functions/vanitySave.js` | CREATE (optional) - Serverless version |

---

## Out of Scope

- Custom vanity slugs (e.g., `/s/myname/...`)
- Save confirmation page (direct redirect preferred)
- Batch saving multiple URLs

---

## Success Criteria

1. User can save any link by prepending vanity URL
2. Redirect happens in <2 seconds
3. Link appears in user's Link Saver
4. Works from any device/browser
5. Invalid tokens show clear error message

---

## Open Questions

1. Should we track analytics (like shortlinks)?
2. Should invalid URLs show a "save anyway" option?
3. Should we support saving without redirect (for automation)?
