# Claude Code Autonomous Framework - Scope Document

**Created:** December 15, 2025
**Updated:** December 15, 2025
**Status:** Phase 1 Complete, Phase 2-5 In Planning
**Related:** `SCOPE_DEC14_2025.md`, `.claude/MCP_SERVERS_SETUP.md`

---

## Executive Summary

This document scopes the Claude Code Autonomous Task/Project Execution framework with the following objectives:

1. **Continuous refinement and scoping** of yellowCircle optimization relative to Roadmap/yc-MSF
2. **Goal tracking** in Notion/Slack
3. **Parallel conversation** via Slack, SSH
4. **Browser debugging/testing** via Playwright (and optionally Perplexity Comet)
5. **MCP servers** to amplify all capabilities
6. **Unity Collaboration** sharing on NOTES & MAP (minimizing costs)

---

## Current State (Dec 15, 2025)

### MCP Servers Installed

| Server | Status | Purpose |
|--------|--------|---------|
| **Notion** | ✅ Connected | Roadmap sync, task tracking, database ops |
| **Playwright** | ✅ Connected + Tested | Browser testing, screenshots, debugging |
| GitHub | ⏳ Pending | PR automation, issue tracking |
| Slack | ❌ Deferred | Requires manual app registration |

### Verification

```
Playwright Test: yellowcircle.io homepage loaded successfully
Screenshot captured: .playwright-mcp/playwright-test-yellowcircle.png
Page Title: "yellowCircle | Creative Growth Operations"
All UI elements rendered correctly (sidebar, hero, footer)
```

---

## Phase 1: MCP Foundation (COMPLETE)

### 1.1 Notion MCP ✅

**Connection:** OAuth via `https://mcp.notion.com/mcp`

**Capabilities:**
- Search workspace and connected sources
- Fetch page/database content
- Create pages in databases
- Update page properties and content
- Create and manage databases

**yellowCircle Integration Points:**

| Database | Purpose | Usage |
|----------|---------|-------|
| Roadmap | Task tracking, priorities | Sync with WIP files |
| yc-MSF | Marketing strategy framework | Reference for optimization |
| Content Calendar | LinkedIn/blog planning | Schedule posts |

### 1.2 Playwright MCP ✅

**Connection:** stdio via `npx -y @playwright/mcp`

**Capabilities:**
- Navigate URLs
- Take screenshots (viewport, full page, elements)
- Capture accessibility snapshots
- Fill forms, click elements
- Type text, press keys
- Execute JavaScript
- Monitor console/network

**Test Scenarios for yellowCircle:**

| Page | Test Type | Purpose |
|------|-----------|---------|
| `/` | Visual, Performance | Homepage load, hero animations |
| `/unity-notes` | Functional, Mobile | Canvas load, node interactions |
| `/unity-map` | Functional | Journey builder flow |
| `/assessment` | E2E | Full assessment completion |
| `/admin/*` | Auth, CRUD | Admin panel functions |

---

## Phase 2: GitHub MCP (NEXT)

### 2.1 Installation

```bash
# Add GitHub MCP server
claude mcp add github --transport stdio -- npx -y @modelcontextprotocol/server-github
```

**Authentication:** GitHub Personal Access Token (PAT) with repo scope

### 2.2 Capabilities Unlocked

| Capability | Use Case |
|------------|----------|
| **Create Branch** | Automated feature branches |
| **Create PR** | PRs from Claude Code sessions |
| **Read Issues** | Track bug reports, feature requests |
| **Create Issues** | Log discovered issues during testing |
| **Read Commits** | Understand recent changes |
| **Comment on PRs** | Code review automation |

### 2.3 Workflow Integration

```
Claude Code Session
        │
        ├─→ Code changes
        │
        ├─→ [GitHub MCP] Create branch: feature/xyz
        │
        ├─→ [GitHub MCP] Create PR with description
        │
        ├─→ [Playwright MCP] Run visual tests
        │
        └─→ [Notion MCP] Update roadmap task status
```

**Effort:** 2 hours (install + configure + test)

---

## Phase 3: Notion Roadmap Sync

### 3.1 Database Schema

**yellowCircle Roadmap Database:**

```yaml
Properties:
  Task: title
  Status: select [Not Started, In Progress, Complete, Blocked]
  Priority: select [P0, P1, P2, P3]
  Category: multi_select [Revenue, Platform, Infrastructure, Content]
  Effort: number (hours)
  Due Date: date
  Owner: person
  Related Files: rich_text (file paths)
  Commit: rich_text (git commit hash)
```

### 3.2 Sync Rules

| Trigger | Action |
|---------|--------|
| Git commit with task reference | Update Notion task status |
| WIP file update | Sync to Notion |
| Notion status change | Update WIP file |
| Task marked Complete | Add commit reference |

### 3.3 Implementation

```javascript
// Pseudo-code for roadmap sync
async function syncToNotion(task) {
  // Search for existing task
  const existing = await notion.search({ query: task.title });

  if (existing) {
    await notion.updatePage({
      page_id: existing.id,
      properties: {
        Status: task.status,
        Commit: task.commit
      }
    });
  } else {
    await notion.createPage({
      parent: { database_id: ROADMAP_DB_ID },
      properties: {
        Task: task.title,
        Status: task.status,
        Priority: task.priority,
        Category: task.category
      }
    });
  }
}
```

**Effort:** 4 hours

---

## Phase 4: Parallel Conversation (Slack/SSH)

### 4.1 Slack Integration (Deferred)

**Reason for Deferral:** Slack MCP requires manual app registration (no dynamic OAuth)

**Future Implementation:**
1. Create Slack App in yellowCircle workspace
2. Configure Bot Token scopes: `chat:write`, `channels:read`, `commands`
3. Add to `.claude.json` with manual credentials

**Alternative: Webhook-based notifications**

```javascript
// Firebase Function for Slack webhook
exports.notifySlack = functions.https.onCall(async (data, context) => {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: data.message,
      channel: data.channel || '#yc-dev-updates'
    })
  });
});
```

### 4.2 SSH/Headless Claude Code

**Use Case:** Run Claude Code on remote server without GUI

```bash
# SSH into Mac Mini and run Claude Code
ssh macmini
cd ~/yellow-circle
claude --headless --resume last-session
```

**Session Persistence:**
- WIP files in `.claude/shared-context/`
- Dropbox sync between machines
- Git push for remote access

### 4.3 Multi-Machine Workflow

```
Mac Mini (Primary)
    │
    ├─→ Dropbox Sync (30s) ←─┬─→ MacBook Air
    │                        │
    └─→ Git Push ←───────────┴─→ Codespaces/Web
```

**Effort:** 2 hours (SSH setup) + 4 hours (Slack app registration, optional)

---

## Phase 5: Advanced Debugging (Playwright+)

### 5.1 Playwright Test Suite

**Test Categories:**

| Category | Tests | Coverage |
|----------|-------|----------|
| **Smoke** | Homepage load, auth, navigation | Core paths |
| **Visual** | Screenshot comparison, responsive | UI regressions |
| **Functional** | Unity Notes CRUD, MAP builder | Feature correctness |
| **Performance** | Load times, bundle sizes | Performance regressions |
| **Mobile** | iPhone SE, iPad, Android | Responsive design |

**Example Test:**

```javascript
// Unity Notes smoke test
async function testUnityNotes(page) {
  await page.goto('https://yellowcircle.io/unity-notes');

  // Wait for canvas to load
  await page.waitForSelector('[data-testid="canvas"]', { timeout: 5000 });

  // Check for console errors
  const errors = await page.evaluate(() =>
    window.__consoleErrors || []
  );

  if (errors.length > 0) {
    return { status: 'fail', errors };
  }

  // Take screenshot for visual comparison
  await page.screenshot({ path: 'unity-notes-current.png' });

  return { status: 'pass' };
}
```

### 5.2 Perplexity Comet Integration (Future)

**Purpose:** AI-powered browser debugging with natural language queries

**Potential Use Cases:**
- "Why is the Unity Notes canvas blank on mobile?"
- "What API calls are failing on the assessment page?"
- "Compare performance between current and previous deploy"

**Status:** Evaluate after Phase 1-4 complete

### 5.3 Error Monitoring Integration

**Sentry MCP (Low Priority):**

```bash
# Add Sentry MCP for error tracking
claude mcp add sentry --transport http https://sentry.io/mcp
```

**Use Cases:**
- Query recent errors
- Link errors to commits
- Auto-create GitHub issues for new errors

**Effort:** 8 hours (full test suite) + 2 hours (Sentry, optional)

---

## MCP Server Priority Matrix

| Server | Status | Priority | Effort | Impact |
|--------|--------|----------|--------|--------|
| Notion | ✅ Done | - | - | High |
| Playwright | ✅ Done | - | - | High |
| **GitHub** | ⏳ Next | **HIGH** | 2 hrs | High |
| Memory | ⏳ Planned | MEDIUM | 2 hrs | Medium |
| Slack | ⏳ Deferred | LOW | 4 hrs | Medium |
| Sentry | ⏳ Deferred | LOW | 2 hrs | Low |

---

## Unity Collaboration Scope (Separate Track)

### Problem Statement

Enable sharing and collaboration on Unity NOTES and MAP while minimizing Firestore costs.

### Recommended Architecture: Hybrid (Cloud Storage + Firestore Metadata)

```
User A ──→ Firestore (metadata only) ←── User B
    │                                       │
    └──→ Cloud Storage (canvas state) ←────┘
```

### Cost Analysis

| Scenario | Firestore Only | Hybrid |
|----------|----------------|--------|
| 10 users, 5 canvases | ~$3/month | ~$0.50/month |
| 100 users, 10 canvases | ~$30/month | ~$3/month |
| 1000 users, 20 canvases | ~$300/month | ~$15/month |

### Implementation Summary

| Feature | Effort | Priority |
|---------|--------|----------|
| Share link generation | 1 hr | P1 |
| Collaborator management | 3 hrs | P1 |
| Cloud Storage for state | 2 hrs | P1 |
| Viewer-only mode | 2 hrs | P2 |
| Conflict detection | 2 hrs | P2 |
| Real-time presence | 6 hrs | P3 |

**Total Effort:** 16 hours

**Full Spec:** See `SCOPE_DEC14_2025.md` Section: "SCOPE 3: Unity Platform Collaboration"

---

## Implementation Roadmap

### Week 1 (Dec 16-22)

| Day | Task | Effort |
|-----|------|--------|
| Mon | Add GitHub MCP server | 2 hrs |
| Tue | Create Playwright test scenarios | 4 hrs |
| Wed | Notion Roadmap database setup | 2 hrs |
| Thu | Test full MCP workflow | 2 hrs |
| Fri | Documentation + WIP update | 2 hrs |

### Week 2 (Dec 23-29)

| Day | Task | Effort |
|-----|------|--------|
| Mon | Unity Collaboration: Share links | 3 hrs |
| Tue | Unity Collaboration: Cloud Storage | 2 hrs |
| Wed | Unity Collaboration: Collaborators UI | 3 hrs |
| Thu | Testing + bug fixes | 4 hrs |
| Fri | Deploy + documentation | 2 hrs |

### Week 3+ (Jan 2026)

- SSH/headless Claude Code setup
- Slack app registration (if needed)
- Advanced Playwright test suite
- Sentry integration

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Task completion tracking | Manual | Automated | Notion sync accuracy |
| Bug discovery time | Hours | Minutes | Playwright catch rate |
| Context switching cost | High | Low | Multi-machine sync latency |
| Collaboration capability | None | Full | Share link usage |
| Storage costs | N/A | <$5/mo | Firebase console |

---

## Next Actions

1. **Immediate:** Add GitHub MCP server
2. **Today:** Create Playwright test scenarios for critical pages
3. **This Week:** Set up Notion Roadmap database
4. **Next Week:** Begin Unity Collaboration implementation

---

## Appendix: MCP Commands Reference

```bash
# List all MCP servers
claude mcp list

# Add GitHub MCP
claude mcp add github --transport stdio -- npx -y @modelcontextprotocol/server-github

# Remove a server
claude mcp remove <name>

# Run with MCP reconnection
/mcp
```

## Appendix: Playwright Quick Reference

```javascript
// Navigate
await browser_navigate({ url: 'https://yellowcircle.io' });

// Screenshot
await browser_take_screenshot({ filename: 'test.png' });

// Click
await browser_click({ element: 'Sign In button', ref: 'e190' });

// Type
await browser_type({ element: 'Email input', ref: 'e247', text: 'test@example.com' });

// Snapshot (accessibility tree)
await browser_snapshot();
```
