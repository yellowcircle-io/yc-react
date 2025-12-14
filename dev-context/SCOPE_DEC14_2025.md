# Scope Document - December 14, 2025

**Created:** December 14, 2025
**Machine:** Mac Mini
**Status:** Scoping Document for Three Initiatives

---

## P0-P3 STATUS REVIEW (COMPLETE)

### Confirmed Complete (All Commits Verified)

| Phase | Task | Status | Commit |
|-------|------|--------|--------|
| P0 | GTM, Cal.com, Domain, Favicon | ✅ Complete | Various |
| P1 | Unity Notes v1 (local-first, tier-gating) | ✅ Complete | `e9ff4cd` |
| P2.1 | Design tokens (UNITY constants) | ✅ Complete | `f174a9d` |
| P2.2 | Mobile section dividers | ✅ Complete | `f174a9d` |
| P2.3 | Typography rhythm | ✅ Complete | `f174a9d` |
| P2.4 | Loading skeleton | ✅ Complete | `f174a9d` |
| P3.1 | Keyboard shortcuts | ✅ Complete | `f174a9d` |
| P3.2 | Section jump navigation | ✅ Complete | `f174a9d` |
| P3.3 | Lazy loading | ✅ Complete | `f174a9d` |

### Unity Notes Component Files (src/components/unity/)

| File | Purpose |
|------|---------|
| `LoadingSkeleton.jsx` | Shimmer animation during load |
| `StatusBar.jsx` | Save indicator, node count, progress |
| `useKeyboardShortcuts.jsx` | Cmd+S/E/N//, arrows, delete |
| `ShortcutsHelpModal.jsx` | Help overlay |
| `MobileNodeNavigator.jsx` | Mobile section nav + dividers |
| `LazyNodeWrapper.jsx` | content-visibility optimization |
| `typography.js` | Typography rhythm helpers |
| `UnityCircleNav.jsx` | Circle navigation component |
| `index.js` | Barrel exports |

### Current P1 Priorities (From WIP)

| Task | Effort | Category |
|------|--------|----------|
| Outbound Campaign Seed | 4-6 hrs | Revenue |
| LinkedIn Transition Post | 2-3 hrs | Revenue |
| Bundle Optimization | 4-6 hrs | Platform |
| Mobile Testing | 4-6 hrs | Platform |

---

## SCOPE 1: Firestore Cleanup for Old Collections

### Problem Statement

Excess Firestore storage from:
- Old `capsules` collection (legacy Time Capsule feature)
- Old `contacts` collection (test/demo data)
- Old `journeys` collection (abandoned automation flows)

### Current Cleanup Infrastructure

Existing functions in `functions/index.js`:
- `scheduledCleanup` (PubSub, every 4 hours) - Lines 873-991
- `manualCleanup` (HTTP endpoint) - Lines 1393-1451

Current criteria:
- Capsules: >90 days old AND <5 views
- Journeys: >90 days old AND (completed OR inactive)

### Proposed Enhancements

#### 1. Enhanced Cleanup Criteria

```javascript
// New cleanup rules
const CLEANUP_RULES = {
  capsules: {
    maxAge: 90,           // days
    minViews: 5,          // keep if more views
    protectedUsers: [],   // admin emails to never delete
    dryRun: false,        // preview mode
  },
  contacts: {
    maxAge: 180,          // 6 months for contacts
    keepIfHasJourneys: true,
    keepIfHasActivity: true,
    protectedSources: ['manual', 'assessment'],
  },
  journeys: {
    maxAge: 90,
    keepActive: true,
    keepWithEmailsSent: true,
  }
};
```

#### 2. Admin Dashboard Integration

Add cleanup controls to `/admin` dashboard:
- View collection sizes
- Preview what would be deleted (dry run)
- Manual trigger with confirmation
- Cleanup history/logs

#### 3. Implementation Steps

| Step | Task | Effort |
|------|------|--------|
| 1 | Add `getCollectionStats` endpoint | 1 hr |
| 2 | Add dry-run mode to cleanup | 1 hr |
| 3 | Create Admin Cleanup UI component | 2 hrs |
| 4 | Add contacts cleanup to existing function | 1 hr |
| 5 | Add protected user/source logic | 1 hr |
| 6 | Add cleanup history logging | 1 hr |

**Total Effort:** ~7 hours

#### 4. Firestore Collections Inventory

| Collection | Purpose | Cleanup Priority |
|------------|---------|------------------|
| `capsules` | Time Capsule nodes/edges | HIGH - Legacy |
| `capsules/{id}/nodes` | Subcollection | HIGH |
| `capsules/{id}/edges` | Subcollection | HIGH |
| `journeys` | UnityMAP automation | MEDIUM |
| `contacts` | Lead/prospect data | LOW - Valuable |
| `leads` | Form submissions | LOW - Valuable |
| `articles` | Blog content | NONE - Keep all |
| `triggerRules` | Automation rules | NONE - Active |
| `shortlinks` | URL shortener | LOW |
| `users` | Auth profiles | NONE - Keep all |

---

## SCOPE 2: Claude Code Autonomous Execution

### Objectives

1. Continuous refinement/execution relative to Roadmap/yc-MSF
2. Goal tracking in Notion/Slack
3. Parallel conversation via Slack, SSH
4. Frontend debugging via Playwright/browser
5. MCP servers to amplify capabilities

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Scheduler   │  │ Task Queue  │  │ State Mgmt  │         │
│  │ (cron/n8n)  │  │ (Redis/SQS) │  │ (Firestore) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE AGENTS                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Dev Agent   │  │ Test Agent  │  │ Docs Agent  │         │
│  │ (code/fix)  │  │ (Playwright)│  │ (WIP/MSF)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    MCP SERVERS                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ GitHub  │ │ Notion  │ │ Slack   │ │Playwright│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Continuous Roadmap Refinement

**Current State:**
- Manual WIP updates in `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
- Manual roadmap in `dev-context/PROJECT_ROADMAP_NOV2025.md`

**Proposed Automation:**

```javascript
// .claude/automation/roadmap-agent.js
const tasks = {
  daily: [
    'Review WIP for stale tasks (>3 days unchanged)',
    'Check git commits vs roadmap items',
    'Update completion percentages',
    'Flag blocked items',
  ],
  weekly: [
    'Generate progress summary',
    'Reprioritize based on completions',
    'Identify scope creep',
    'Suggest next sprint items',
  ],
};
```

### 2.2 Notion/Slack Goal Tracking

**MCP Servers Required:**

| Server | Purpose | Repo |
|--------|---------|------|
| `@modelcontextprotocol/server-notion` | Read/write Notion databases | Official |
| `@modelcontextprotocol/server-slack` | Send messages, read channels | Official |

**Integration Points:**

```yaml
# Notion Database: yellowCircle Roadmap
Database ID: 2b015c1b110d808d9c55d3b1c4908730
Properties:
  - Task (title)
  - Status (select: Not Started, In Progress, Complete)
  - Priority (P0-P3)
  - Owner (person)
  - Due Date (date)
  - Effort (number)
  - Category (multi-select)
```

```yaml
# Slack Channels
#yc-dev-updates - Automated progress posts
#yc-alerts - Blocked tasks, failures
#yc-daily - Daily standup summaries
```

### 2.3 Parallel Conversation (Slack/SSH)

**Slack Bot Setup:**

```javascript
// Bot capabilities
const slackBot = {
  commands: {
    '/yc-status': 'Show current WIP status',
    '/yc-deploy': 'Trigger Firebase deploy',
    '/yc-roadmap': 'Show roadmap summary',
    '/yc-ask': 'Ask Claude Code a question',
  },
  events: {
    'app_mention': 'Respond to @yellowCircle mentions',
    'message.channels': 'Monitor for keywords',
  },
};
```

**SSH/Headless Execution:**

```bash
# Start Claude Code in headless mode
claude --headless --session-id="autonomous-001" \
  --config=".claude/autonomous-config.json"

# Example autonomous-config.json
{
  "mode": "autonomous",
  "permissions": {
    "write": true,
    "execute": ["npm", "firebase", "git"],
    "network": true
  },
  "reporting": {
    "slack_channel": "#yc-dev-updates",
    "notion_database": "roadmap"
  },
  "constraints": {
    "max_cost_per_run": 5.00,
    "require_approval": ["deploy", "delete"]
  }
}
```

### 2.4 Frontend Debugging (Playwright)

**MCP Server:** `@anthropic/mcp-server-playwright`

**Capabilities:**

```javascript
// Playwright test scenarios
const debugScenarios = {
  'unity-notes-load': async (page) => {
    await page.goto('https://yellowcircle.io/unity-notes');
    await page.waitForSelector('[data-testid="canvas"]');
    // Screenshot, performance metrics, console errors
  },
  'assessment-flow': async (page) => {
    await page.goto('https://yellowcircle.io/assessment');
    // Walk through assessment, capture each step
  },
  'mobile-responsive': async (page) => {
    await page.setViewportSize({ width: 375, height: 812 });
    // Test mobile layouts
  },
};
```

**Integration with Claude Code:**

```markdown
When debugging frontend issues:
1. Use Playwright MCP to load the page
2. Capture screenshot and console errors
3. Compare against expected behavior
4. Suggest code fixes based on findings
5. Re-test after fix to verify
```

### 2.5 MCP Servers Summary

| Server | Purpose | Priority |
|--------|---------|----------|
| `@modelcontextprotocol/server-github` | PR creation, issue tracking | HIGH |
| `@modelcontextprotocol/server-notion` | Roadmap sync, task tracking | HIGH |
| `@modelcontextprotocol/server-slack` | Notifications, commands | HIGH |
| `@anthropic/mcp-server-playwright` | Browser testing, debugging | MEDIUM |
| `@modelcontextprotocol/server-filesystem` | File operations (already have) | HAVE |
| `@modelcontextprotocol/server-memory` | Persistent context | MEDIUM |
| `@modelcontextprotocol/server-puppeteer` | Alt to Playwright | LOW |
| `@modelcontextprotocol/server-sentry` | Error monitoring | LOW |

### Implementation Phases

| Phase | Tasks | Effort |
|-------|-------|--------|
| **Phase 1** | Install Notion + Slack MCP servers | 2 hrs |
| **Phase 2** | Create Slack bot + basic commands | 4 hrs |
| **Phase 3** | Notion database sync automation | 4 hrs |
| **Phase 4** | Playwright MCP + test scenarios | 4 hrs |
| **Phase 5** | Orchestration layer (task queue) | 8 hrs |

**Total Effort:** ~22 hours

---

## SCOPE 3: Unity Platform Collaboration

### Problem Statement

Enable sharing and collaboration on Unity NOTES and MAP while minimizing Firestore costs.

### Cost Constraints

Current Unity Notes is **local-first** (localStorage) with optional cloud sync.
Collaboration requires:
- Shared state (real-time or eventually consistent)
- User presence (who's viewing/editing)
- Permissions (owner, editor, viewer)

### Architecture Options

#### Option A: Firestore Real-time (Highest Cost)

```
User A ──→ Firestore ←── User B
              │
         Real-time sync
```

**Pros:** Native real-time, proven
**Cons:** High read/write costs, always-on

**Estimated Cost:** ~$5-15/month at low usage

#### Option B: CRDT + Periodic Sync (Lowest Cost)

```
User A (local) ──→ Periodic Sync ←── User B (local)
                        │
                   Firestore
                 (checkpoints only)
```

**Pros:** Minimal Firestore usage, offline-first
**Cons:** Complex merge logic, eventual consistency

**Estimated Cost:** ~$0.50-2/month

#### Option C: Hybrid (Recommended)

```
User A ──→ Firestore (metadata only) ←── User B
    │                                       │
    └──→ Cloud Storage (canvas state) ←────┘
```

**Pros:** Balance of cost and features
**Cons:** Some complexity

**Estimated Cost:** ~$1-5/month

### Recommended Implementation (Option C)

#### Data Model

```javascript
// Firestore: capsules/{id} (metadata only)
{
  id: 'abc123',
  title: 'My Canvas',
  ownerId: 'user123',
  collaborators: [
    { id: 'user456', role: 'editor', addedAt: timestamp },
    { id: 'user789', role: 'viewer', addedAt: timestamp },
  ],
  lastModified: timestamp,
  lastModifiedBy: 'user123',
  version: 5,
  stateUrl: 'gs://yellowcircle-app/capsules/abc123/state-v5.json',
  isPublic: false,
  shareLink: 'yc.io/c/abc123',
}

// Cloud Storage: capsules/{id}/state-v{n}.json
{
  nodes: [...],
  edges: [...],
  viewport: { x, y, zoom },
  createdAt: timestamp,
}
```

#### Sharing Flow

```
1. Owner clicks "Share" on canvas
2. Modal shows:
   - Share link (read-only by default)
   - Add collaborators by email
   - Permission level (viewer/editor)
3. Save updates Firestore collaborators array
4. Collaborators see canvas in their list
5. On open, load state from Cloud Storage
6. On save, upload new state + increment version
```

#### Conflict Resolution (Simple Version)

```javascript
// Last-write-wins with notification
async function saveCanvas(capsuleId, newState, userId) {
  const capsule = await getDoc(capsuleId);

  if (capsule.version !== localVersion) {
    // Someone else saved - show conflict modal
    return { conflict: true, remoteVersion: capsule.version };
  }

  // Upload new state
  await uploadState(capsuleId, newState, capsule.version + 1);

  // Update metadata
  await updateDoc(capsuleId, {
    version: capsule.version + 1,
    lastModified: serverTimestamp(),
    lastModifiedBy: userId,
  });
}
```

#### Implementation Steps

| Step | Task | Effort |
|------|------|--------|
| 1 | Add Cloud Storage for canvas state | 2 hrs |
| 2 | Update useFirebaseCapsule hook | 3 hrs |
| 3 | Create ShareModal component | 3 hrs |
| 4 | Add collaborators array to schema | 1 hr |
| 5 | Create shared capsules list view | 2 hrs |
| 6 | Add conflict detection UI | 2 hrs |
| 7 | Add share link generation | 1 hr |
| 8 | Add viewer-only mode | 2 hrs |

**Total Effort:** ~16 hours

#### Cost Comparison

| Scenario | Firestore Only | Hybrid |
|----------|----------------|--------|
| 10 users, 5 canvases each | ~$3/month | ~$0.50/month |
| 100 users, 10 canvases each | ~$30/month | ~$3/month |
| 1000 users, 20 canvases each | ~$300/month | ~$15/month |

---

## SUMMARY: Priority Ordering

| Initiative | Effort | Impact | Priority |
|------------|--------|--------|----------|
| **Firestore Cleanup** | 7 hrs | Cost savings, hygiene | P2 |
| **Claude Autonomous** | 22 hrs | Productivity 10x | P1 (phased) |
| **Unity Collaboration** | 16 hrs | Feature unlock | P3 |

### Recommended Sequence

1. **Week 1:** Firestore Cleanup (quick win, reduces costs)
2. **Weeks 2-3:** Claude Autonomous Phase 1-3 (Notion/Slack MCPs)
3. **Week 4:** Unity Collaboration MVP (share links only)
4. **Ongoing:** Claude Autonomous Phase 4-5 (Playwright, orchestration)

---

## Next Actions

1. [ ] Review and approve scope priorities
2. [ ] Set up Notion MCP server
3. [ ] Set up Slack MCP server
4. [ ] Create Firestore cleanup admin UI
5. [ ] Design collaboration share modal mockup
