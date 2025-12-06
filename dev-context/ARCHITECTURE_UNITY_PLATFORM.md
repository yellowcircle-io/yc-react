# Unity Platform Architecture
## Authentication, Campaign Flow, and Email Delivery

**Created:** December 6, 2025
**Status:** Design Document - Addressing Current Failure Points

---

## Current Failure Points

1. **UnityMAP not sending any emails** - ESP flow incomplete
2. **Login not functioning on Hub** - Firebase Auth not enabled in console
3. **No SSO on Generator** - Generator lacks any auth
4. **Unclear campaign progression** - How records flow through journey nodes

---

## Platform Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        UNITY PLATFORM ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│   │   UnityNOTE      │    │  UnityMAP        │    │  UnityMAP        │  │
│   │   (Public)       │───▶│  Generator       │───▶│  Hub             │  │
│   │                  │    │  (External)      │    │  (Internal)      │  │
│   └──────────────────┘    └──────────────────┘    └──────────────────┘  │
│         │                        │                        │              │
│         │                        │                        │              │
│         ▼                        ▼                        ▼              │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                     Shared Infrastructure                         │   │
│   │   • Firebase Auth (Google SSO)                                   │   │
│   │   • Firestore (Campaigns, Journeys, Prospects)                   │   │
│   │   • Firebase Functions (Email proxy via Resend)                  │   │
│   │   • LocalStorage (API keys, settings, draft state)               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Authentication Architecture

### 1.1 Hub (Internal) - Passcode + Optional SSO

```javascript
// Current: Passcode-based access
const ACCESS_HASH = 'eWMyMDI1b3V0cmVhY2g='; // btoa('yc2025outreach')

// Enhanced: Passcode OR Firebase SSO for clients
const AuthModes = {
  PASSCODE: 'passcode',        // Internal team access
  CLIENT_SSO: 'client-sso',    // Client Firebase login
  BYPASS: 'bypass'             // localStorage yc_bypass_active
};

// Implementation:
// 1. Check localStorage for bypass/client tokens
// 2. Show login modal with passcode input
// 3. Optional "Sign in with Google" for client access
// 4. Store auth state in localStorage: outreach_business_auth
```

### 1.2 Generator (External) - Firebase SSO Required

```javascript
// NEW: Generator requires Google SSO for:
// - Saving campaigns to Firestore
// - Tracking usage credits
// - Syncing with Hub

// Implementation Steps:
// 1. Add AuthContext provider to Generator
// 2. Gate campaign save/deploy behind auth
// 3. Free tier: 3 emails, 1 campaign
// 4. Pro tier: Unlimited (linked to Hub access)

// LeadGate already exists - enhance to require SSO for save
```

### 1.3 UnityNOTE (Public) - Optional Auth

```javascript
// Current: Fully public, localStorage only
// Enhanced: Optional SSO for cloud sync

// Free (no auth):
// - Local notes in localStorage
// - 3 AI queries/day (IP-limited)
// - Basic card types

// Signed in:
// - Cloud sync to Firestore
// - Unlimited AI (uses Hub's keys)
// - Access to Generator/MAP features
```

---

## 2. Campaign & Email Flow Architecture

### 2.1 Campaign Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CAMPAIGN LIFECYCLE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   [CREATE]          [ITERATE]           [DEPLOY]          [SEND]        │
│                                                                          │
│   Generator ──▶ Save to localStorage ──▶ Push to MAP ──▶ Add Prospects  │
│   or Hub           │                         │               │          │
│                    ▼                         ▼               ▼          │
│              Edit emails              Connect nodes     Campaign Node   │
│              Add sequence             Set conditions    "Deploy" button │
│                    │                         │               │          │
│                    └─────────────────────────┼───────────────┘          │
│                                              │                          │
│                                              ▼                          │
│                                      [RUNNING STATE]                    │
│                                              │                          │
│                                    Right Rail controls:                 │
│                                    • RUN (start all)                    │
│                                    • PAUSE (stop all)                   │
│                                    • Status indicators                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Node-Based Journey Progression

```javascript
// Journey Structure in Firestore
{
  id: 'journey-123',
  userId: 'user-abc',
  title: 'Q1 Outreach Campaign',
  status: 'active', // draft | active | paused | completed

  nodes: [
    { id: 'campaign-1', type: 'campaignNode', data: { ... } },
    { id: 'email-1', type: 'emailNode', data: { subject, body } },
    { id: 'wait-1', type: 'waitNode', data: { duration: 3, unit: 'days' } },
    { id: 'condition-1', type: 'conditionNode', data: { type: 'opened' } },
    { id: 'email-2', type: 'emailNode', data: { subject, body } }
  ],

  edges: [
    { source: 'campaign-1', target: 'email-1' },
    { source: 'email-1', target: 'wait-1' },
    { source: 'wait-1', target: 'condition-1' },
    { source: 'condition-1', target: 'email-2', sourceHandle: 'yes' }
  ],

  prospects: [
    {
      id: 'prospect-1',
      email: 'jane@company.com',
      firstName: 'Jane',
      status: 'active', // active | completed | bounced | unsubscribed
      currentNodeId: 'email-1',
      nodeHistory: [
        { nodeId: 'email-1', enteredAt: timestamp, exitedAt: timestamp, result: 'sent' }
      ],
      scheduledFor: timestamp // When to process next
    }
  ],

  stats: {
    sent: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
    bounced: 0
  }
}
```

### 2.3 Email Sending Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EMAIL SENDING FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   [User clicks DEPLOY on Campaign Node]                                  │
│              │                                                           │
│              ▼                                                           │
│   ┌─────────────────────┐                                               │
│   │ Save journey to     │                                               │
│   │ Firestore           │                                               │
│   └─────────────────────┘                                               │
│              │                                                           │
│              ▼                                                           │
│   ┌─────────────────────┐                                               │
│   │ Open Prospect Modal │                                               │
│   │ - Manual entry      │                                               │
│   │ - CSV upload        │                                               │
│   │ - CRM import        │                                               │
│   └─────────────────────┘                                               │
│              │                                                           │
│              ▼                                                           │
│   ┌─────────────────────┐                                               │
│   │ Prospects added to  │                                               │
│   │ journey.prospects[] │                                               │
│   │ currentNodeId = first email                                         │
│   └─────────────────────┘                                               │
│              │                                                           │
│   [User clicks RUN on right rail]                                       │
│              │                                                           │
│              ▼                                                           │
│   ┌─────────────────────┐     ┌─────────────────────┐                   │
│   │ sendJourneyNow()    │────▶│ For each prospect   │                   │
│   │                     │     │ where status=active │                   │
│   └─────────────────────┘     └─────────────────────┘                   │
│                                        │                                 │
│                                        ▼                                 │
│                               ┌─────────────────────┐                   │
│                               │ Get currentNodeId   │                   │
│                               │ Find email node     │                   │
│                               │ Personalize content │                   │
│                               └─────────────────────┘                   │
│                                        │                                 │
│                                        ▼                                 │
│                               ┌─────────────────────┐                   │
│                               │ sendEmailNow()      │                   │
│                               │ via Resend ESP      │                   │
│                               │ (Firebase Function) │                   │
│                               └─────────────────────┘                   │
│                                        │                                 │
│                                        ▼                                 │
│                               ┌─────────────────────┐                   │
│                               │ Update prospect     │                   │
│                               │ - Move to next node │                   │
│                               │ - Log in nodeHistory│                   │
│                               │ - Set scheduledFor  │                   │
│                               └─────────────────────┘                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Fixing Current Issues

### 3.1 Fix Email Sending (Priority 1)

**Problem:** Emails not sending from UnityMAP

**Root Causes:**
1. Firebase Function `sendEmail` needs deployment
2. Prospects not properly added to journey
3. sendJourneyNow expects `prospect.status === 'active'` and `prospect.currentNodeId`

**Solution:**

```javascript
// 1. Deploy Firebase Function
// Run: firebase deploy --only functions:sendEmail

// 2. Fix prospect initialization when deploying
// In handlePublishWithProspects or similar:
const initializeProspect = (prospectData, firstEmailNodeId) => ({
  ...prospectData,
  id: `prospect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  status: 'active',
  currentNodeId: firstEmailNodeId,
  nodeHistory: [],
  scheduledFor: new Date().toISOString()
});

// 3. Update sendJourneyNow to handle edge cases better
```

### 3.2 Fix Hub Login (Priority 2)

**Problem:** Google Sign-In not configured error

**Solution:**
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Add authorized domains (localhost, yellowcircle.io)

The code already handles this - just needs Firebase Console configuration.

### 3.3 Add Generator SSO (Priority 3)

**Implementation Plan:**

```javascript
// 1. Wrap OutreachGeneratorPage with AuthProvider
// 2. Add login gate before save/deploy
// 3. Track anonymous usage with localStorage
// 4. Prompt SSO when user tries to:
//    - Save more than 1 campaign
//    - Send more than 3 emails
//    - Deploy to UnityMAP

// Generator-specific auth flow:
const GeneratorAuthGate = ({ children }) => {
  const { user } = useAuth();
  const [canProceed, setCanProceed] = useState(false);

  // Free tier checks
  const campaignCount = localStorage.getItem('yc_generator_campaigns') || 0;
  const emailsSent = localStorage.getItem('yc_generator_emails') || 0;

  if (!user && (campaignCount >= 1 || emailsSent >= 3)) {
    return <SignupPrompt reason="limit_reached" />;
  }

  return children;
};
```

### 3.4 Campaign Node Deploy vs Rail Run/Pause

**Clarified Architecture:**

| Control | Location | Action |
|---------|----------|--------|
| **Deploy** | Campaign Node button | Opens prospect modal, initializes journey |
| **RUN** | Right rail | Sends emails for ALL active campaigns |
| **PAUSE** | Right rail | Stops all email sending |
| **Send Test** | Email Node | Sends single test email |

```javascript
// Campaign Node Component
const CampaignNode = ({ data, id }) => {
  const handleDeploy = () => {
    // 1. Validate campaign has email nodes connected
    // 2. Save journey to Firestore
    // 3. Open AddProspectsModal
    // 4. Initialize prospects with currentNodeId
    data.onDeploy?.(id);
  };

  return (
    <div>
      <h3>{data.title}</h3>
      <button onClick={handleDeploy}>
        {data.status === 'draft' ? 'Deploy' : 'Add More Prospects'}
      </button>
      <span className="status">{data.stats?.sent || 0} sent</span>
    </div>
  );
};
```

---

## 4. Data Flow Summary

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Generator  │────▶│  localStorage│────▶│   UnityMAP  │
│  (Create)   │     │  (Draft)    │     │   (Canvas)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           │                    ▼
                           │            ┌─────────────┐
                           │            │  Firestore  │
                           │            │  (Journey)  │
                           │            └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   UnityNOTE │     │  Firebase   │
                    │   (Notes)   │     │  Functions  │
                    └─────────────┘     │  (Resend)   │
                                        └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Email     │
                                        │   Sent!     │
                                        └─────────────┘
```

---

## 5. Implementation Priorities

### Immediate (This Session)
1. ✅ Fix AI card to use Hub's API keys
2. 🔄 Debug email sending flow
3. 🔄 Document Firebase Auth setup steps

### Short-term (Next Session)
1. Add Deploy button to CampaignNode
2. Clarify RUN/PAUSE behavior in rail
3. Add prospect initialization on deploy

### Medium-term
1. Add Google SSO to Generator
2. Implement usage tracking/limits
3. Cloud sync for UnityNOTE

---

## 6. Firebase Console Setup Required

### Authentication
1. Go to: https://console.firebase.google.com/project/yellowcircle-app/authentication/providers
2. Enable "Google" provider
3. Add authorized domains:
   - localhost
   - yellowcircle.io
   - yellowcircle-io.web.app

### Functions
1. Ensure `sendEmail` function is deployed
2. Check functions logs for errors
3. Verify Resend API key is set: `firebase functions:config:set resend.api_key="re_xxxxx"`

---

*Document Version: 1.0*
*Last Updated: December 6, 2025*
