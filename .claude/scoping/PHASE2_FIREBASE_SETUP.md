# Phase 2: Firebase Webhook Fallback Setup

**Status:** Implementation Complete, Deployment Pending
**Created:** January 17, 2026

---

## Overview

Phase 2 implements a Firebase Cloud Function fallback for the `/sleepless` command when the Socket Mode daemon is unavailable.

### Architecture

```
Tier 1 (Primary - Socket Mode):
  Slack → Socket Mode → Daemon → Claude CLI → Response

Tier 2 (Fallback - Firebase):
  Slack → Firebase Function → Queue in Firestore → Delayed Response
```

---

## Files Created/Modified

### 1. Firebase Function (`functions/index.js`)
- Added `exports.sleepless` function (lines 12741-12924)
- Handles `/sleepless` slash commands
- Verifies Slack signature
- Queues commands in Firestore `sleepless_queue` collection
- Returns immediate acknowledgment

### 2. Firebase Config (`firebase.json`)
- Added rewrite: `/api/sleepless` → `sleepless` function

---

## Deployment Steps

### Step 1: Configure Slack Signing Secret

Get your Slack signing secret from: https://api.slack.com/apps/A0A2J35Q7D3 → Basic Information → Signing Secret

```bash
# Set Firebase config
firebase functions:config:set slack.signing_secret="YOUR_SIGNING_SECRET"
```

### Step 2: Deploy Firebase Functions

```bash
cd "/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle"

# Deploy only the sleepless function
firebase deploy --only functions:sleepless

# Or deploy all functions
firebase deploy --only functions
```

### Step 3: Configure Slack App Request URL

1. Go to: https://api.slack.com/apps/A0A2J35Q7D3
2. Click **Slash Commands** in left sidebar
3. Edit `/sleepless` command
4. Change **Request URL** to: `https://yellowcircle-app.web.app/api/sleepless`
5. Save Changes

**Note:** With Socket Mode enabled, Slack will prefer Socket Mode when the daemon is connected. The Request URL is only used as fallback when Socket Mode connection is unavailable.

---

## Testing

### Test 1: Verify Function Deployment

```bash
curl -X POST https://yellowcircle-app.web.app/api/sleepless \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "command=/sleepless&text=test&user_name=test"
```

Expected: JSON response with queued message (signature verification will fail without proper headers, but function should respond)

### Test 2: Check Firestore Queue

After sending a test command, check Firestore:
- Collection: `sleepless_queue`
- Documents should contain: command, text, user_name, status, created_at

### Test 3: Simulate Daemon Offline

1. Stop the daemon: `launchctl unload ~/Library/LaunchAgents/com.yellowcircle.sleepless-daemon.plist`
2. Send `/sleepless test` in Slack
3. Should see "Tier 2 fallback" response
4. Check Firestore queue for the command

---

## Firestore Collection Schema

**Collection:** `sleepless_queue`

| Field | Type | Description |
|-------|------|-------------|
| command | string | Always "/sleepless" |
| text | string | User's prompt |
| user_id | string | Slack user ID |
| user_name | string | Slack username |
| channel_id | string | Slack channel ID |
| channel_name | string | Channel name |
| team_id | string | Slack team ID |
| response_url | string | URL for delayed response |
| trigger_id | string | Slack trigger ID |
| status | string | "pending" / "processing" / "completed" / "failed" |
| tier | number | 2 (Firebase webhook) |
| created_at | timestamp | When queued |
| source | string | "firebase_webhook" |

---

## Queue Processing (Future Enhancement)

The queued commands can be processed by:

### Option A: Daemon Queue Processor (Recommended)
Add Firestore monitoring to daemon:
1. Install `google-cloud-firestore` in daemon venv
2. Download service account JSON from Firebase Console
3. Daemon polls queue on startup and periodically
4. Process pending commands, send response via `response_url`

### Option B: Scheduled Cloud Function
Create a scheduled function that:
1. Runs every 5 minutes
2. Checks for pending commands
3. Invokes Claude API (requires API key)
4. Sends response via `response_url`

### Option C: Firestore Trigger
Create an `onCreate` trigger on `sleepless_queue`:
1. Automatically fires when command is queued
2. Invokes Claude API
3. Sends immediate response

---

## Environment Variables

### Firebase Functions Config
```bash
firebase functions:config:set slack.signing_secret="xoxb-..."
```

### Local Daemon (.env)
Already configured with:
- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`

---

## Security Notes

1. **Slack Signature Verification**: The function verifies `x-slack-signature` header
2. **Timestamp Check**: Rejects requests older than 5 minutes
3. **Rate Limiting**: Consider adding rate limiting if needed
4. **Response URL**: Only valid for 30 minutes after command

---

## Monitoring

### Firebase Console
- Functions → sleepless → View Logs
- Firestore → sleepless_queue collection

### Local Daemon
```bash
tail -f /tmp/sleepless-daemon.log
```

---

## Rollback

If issues occur:
1. Disable Request URL in Slack App (set to empty)
2. Commands will fail gracefully if daemon is also down
3. Or delete the function: `firebase functions:delete sleepless`

---

## Next Steps

1. [ ] Deploy function: `firebase deploy --only functions:sleepless`
2. [ ] Configure Slack signing secret
3. [ ] Update Slack App Request URL
4. [ ] Test fallback flow
5. [ ] (Optional) Implement queue processor in daemon
