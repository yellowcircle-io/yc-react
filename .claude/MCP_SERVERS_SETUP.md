# MCP Servers Setup for yellowCircle

**Created:** December 14, 2025
**Purpose:** Claude Code autonomous execution capabilities

---

## Configured MCP Servers

### 1. Notion (`notion`)
- **Type:** HTTP
- **URL:** `https://mcp.notion.com/mcp`
- **Status:** ✓ Connected (Dec 14, 2025)
- **Purpose:** Roadmap sync, task tracking, database operations

### 2. Playwright (`playwright`)
- **Type:** stdio
- **Command:** `npx -y @playwright/mcp`
- **Status:** ✓ Connected (Dec 14, 2025)
- **Purpose:** Browser testing, screenshot capture, debugging

### Removed: Slack
- Slack MCP requires manual app registration (doesn't support dynamic OAuth)
- Can be added later with pre-configured Slack app credentials

---

## MCP Server Commands

```bash
# List all servers and status
claude mcp list

# Add a new server
claude mcp add --transport http <name> <url>

# Remove a server
claude mcp remove <name>

# Get details
claude mcp get <name>
```

---

## Authentication Required

Both Notion and Slack require OAuth authentication before use:

1. Run `/mcp` in Claude Code
2. Select the server needing authentication
3. Follow OAuth flow in browser
4. Return to Claude Code

---

## Planned Additional Servers

| Server | Purpose | Priority |
|--------|---------|----------|
| `@modelcontextprotocol/server-github` | PR creation, issue tracking | HIGH |
| `@modelcontextprotocol/server-memory` | Persistent context | MEDIUM |
| `@modelcontextprotocol/server-sentry` | Error monitoring | LOW |

---

## Configuration Location

- **Local scope:** `~/.claude.json` (project-specific)
- **Project scope:** `.mcp.json` (team-shared, in repo root)

Current config stored in `~/.claude.json` under:
```
projects["/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle"].mcpServers
```

---

## Usage Examples

### Notion Integration
```
@notion Search the yellowCircle Roadmap database for P1 tasks
@notion Create a new task in the Roadmap database
@notion Update task status to "Complete"
```

### Slack Integration
```
@slack Post to #yc-dev-updates: "Build complete, deployed to production"
@slack Send DM to @chris: "Task blocked, need approval"
```

### Playwright Integration
```
@playwright Navigate to https://yellowcircle.io/unity-notes and take a screenshot
@playwright Check console for errors on the homepage
@playwright Test mobile viewport (375x812) on assessment page
```

---

## Next Steps

1. [x] Install Notion MCP server
2. [x] Install Playwright MCP server
3. [x] Authenticate Notion ✓
4. [x] Playwright connected ✓
5. [ ] Test Playwright with yellowcircle.io pages
6. [ ] Add GitHub MCP server for PR automation
7. [ ] (Optional) Add Slack with manual app registration
