# Cloud Scheduler for UnityMAP Follow-ups
## Automated Email Sequence Processing

**Created:** December 6, 2025
**Status:** Scoped - Ready for Implementation

---

## Overview

The Cloud Scheduler automatically processes prospects through their journey nodes, handling wait times and sending follow-up emails without manual intervention.

---

## Current Implementation (Already Exists)

The Firebase Function `processJourneys` is **already deployed** and running:

```javascript
// functions/index.js - lines 425-520
exports.processJourneys = functions.pubsub
  .schedule("every 15 minutes")
  .timeZone("America/New_York")
  .onRun(async (context) => { ... });
```

### What It Does:
1. Runs every 15 minutes
2. Queries all journeys with `status === 'active'`
3. For each prospect with `status === 'active'`:
   - Checks if `nextExecuteAt` has passed
   - Processes based on current node type:
     - **emailNode**: Sends email, advances to next node
     - **waitNode**: First hit = set wait time, second hit = advance
     - **conditionNode**: Evaluates and routes (currently defaults to "no" path)
     - **exitNode**: Marks prospect as completed
4. Updates journey document with modified prospects and stats

### What's Working:
- Scheduled trigger (every 15 minutes)
- Email sending via Resend
- Wait node timing
- Prospect history tracking
- Stats aggregation

---

## Gap Analysis

### 1. Client-Side Progression (Just Implemented)
**Status:** ✅ Complete

When `sendJourneyNow()` sends an email, it now:
- Advances prospect to next node
- Records history entry
- Marks completed if no next node

### 2. Cloud-Side Progression
**Status:** ✅ Already Working

The `processJourneys` function handles this every 15 minutes.

### 3. Condition Node Evaluation
**Status:** ⚠️ Partial

Currently defaults to "no" path. Full implementation requires:
- Webhook handlers for email opens/clicks (from Resend)
- Storing engagement data on prospects
- Evaluating conditions against stored data

---

## Recommended Enhancements

### Phase 1: Monitoring & Debugging (Now)

Add monitoring endpoint to check scheduler health:

```javascript
// Add to functions/index.js
exports.schedulerHealth = functions.https.onRequest(async (req, res) => {
  const journeys = await db.collection('journeys')
    .where('status', '==', 'active')
    .get();

  const stats = {
    activeJourneys: journeys.size,
    totalProspects: 0,
    waitingProspects: 0,
    nextRun: 'every 15 minutes'
  };

  journeys.docs.forEach(doc => {
    const data = doc.data();
    stats.totalProspects += data.prospects?.length || 0;
    stats.waitingProspects += data.prospects?.filter(p =>
      p.status === 'active' && p.nextExecuteAt
    ).length || 0;
  });

  res.json(stats);
});
```

### Phase 2: Webhook Handlers (Future)

For condition node evaluation based on email engagement:

```javascript
// Resend webhook for email events
exports.resendWebhook = functions.https.onRequest(async (req, res) => {
  const { type, data } = req.body;

  // type: 'email.opened', 'email.clicked', 'email.bounced', etc.
  const messageId = data.email_id;

  // Find prospect by messageId in history
  const journeys = await db.collection('journeys')
    .where('status', 'in', ['active', 'paused'])
    .get();

  for (const doc of journeys.docs) {
    const journey = doc.data();
    const prospect = journey.prospects?.find(p =>
      p.history?.some(h => h.messageId === messageId)
    );

    if (prospect) {
      // Record engagement event
      prospect.engagement = prospect.engagement || {};
      prospect.engagement[type] = true;
      prospect.engagement[`${type}At`] = admin.firestore.Timestamp.now();

      await doc.ref.update({ prospects: journey.prospects });
      break;
    }
  }

  res.status(200).send('OK');
});
```

### Phase 3: Enhanced Condition Evaluation (Future)

```javascript
// In processProspect function, update conditionNode case:
case "conditionNode": {
  const conditionType = currentNode.data.conditionType;
  let result = false;

  switch (conditionType) {
    case 'opened':
      result = prospect.engagement?.['email.opened'] === true;
      break;
    case 'clicked':
      result = prospect.engagement?.['email.clicked'] === true;
      break;
    case 'replied':
      result = prospect.engagement?.['email.replied'] === true;
      break;
    case 'custom':
      // Evaluate custom condition from node data
      result = evaluateCustomCondition(currentNode.data.customCondition, prospect);
      break;
    default:
      result = false;
  }

  const sourceHandle = result ? "yes" : "no";
  // ... rest of routing logic
}
```

---

## Testing the Scheduler

### Manual Trigger
```bash
curl -X POST https://us-central1-yellowcircle-app.cloudfunctions.net/triggerJourneyProcessing \
  -H "Content-Type: application/json" \
  -H "x-journey-auth: yc-journey-exec-2024"
```

### Check Function Logs
```bash
firebase functions:log --only processJourneys
```

### Verify in Firebase Console
1. Go to Firebase Console → Functions
2. Click on `processJourneys`
3. View "Logs" tab for execution history

---

## Current Configuration

| Setting | Value |
|---------|-------|
| Schedule | Every 15 minutes |
| Timezone | America/New_York |
| Memory | 256MB |
| Runtime | Node.js 20 |
| Resend API Key | Configured via `firebase functions:config:set` |

---

## No Immediate Action Required

The scheduler is already:
1. **Deployed** and running every 15 minutes
2. **Processing** active journeys automatically
3. **Sending** follow-up emails when wait times expire
4. **Tracking** prospect history and stats

The client-side changes made today (prospect progression in `sendJourneyNow`) complement the server-side scheduler. Prospects will:
1. Get their first email immediately on deploy (client-side)
2. Have follow-ups sent automatically by scheduler (server-side)

---

*Document Version: 1.0*
*Last Updated: December 6, 2025*
