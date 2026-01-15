# MCP Server Configuration (Cross-Machine Reference)

**Created:** December 19, 2025
**Purpose:** Document MCP server setup for yellowCircle across all machines

---

## ⚠️ IMPORTANT

MCP servers are configured **per-machine** at `~/.claude/` (not synced via Dropbox).

Each machine needs to run these setup commands independently.

---

## Required MCP Servers

### 1. Playwright (Browser Automation)
**Purpose:** Automated browser testing, screenshots, web scraping

```bash
claude mcp add playwright -- npx -y @playwright/mcp
```

**Capabilities:**
- `browser_navigate` - Navigate to URLs
- `browser_snapshot` - Accessibility snapshots
- `browser_click` - Click elements
- `browser_type` - Type into fields
- `browser_take_screenshot` - Capture screenshots

### 2. GitHub
**Purpose:** Repository access, PR management, issue tracking

```bash
claude mcp add github -- npx -y @modelcontextprotocol/server-github
```

**Requires:** `GITHUB_TOKEN` environment variable
```bash
export GITHUB_TOKEN="your_github_pat"
```

**Capabilities:**
- Repository file access
- PR creation and management
- Issue management

### 3. Notion
**Purpose:** Notion workspace access, page/database management

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

**Requires:** Notion integration token (configured in Notion)

**Capabilities:**
- `notion-search` - Search workspace
- `notion-fetch` - Get page/database content
- `notion-create-pages` - Create new pages
- `notion-update-page` - Update existing pages

### 4. Brevo (Email Marketing)
**Purpose:** Email campaign management, contact lists, transactional emails

```bash
claude mcp add --transport http brevo https://mcp.brevo.com/sse
```

**Requires:** Brevo MCP API key (from Brevo dashboard → Settings → MCP Integration)

**Capabilities:**
- Send transactional emails
- Manage contact lists
- View campaign stats
- Template management

---

## Quick Setup Script

Save as `setup-mcp.sh` and run on each machine:

```bash
#!/bin/bash

echo "=== Setting up MCP servers for yellowCircle ==="

# Playwright
echo "Adding Playwright..."
claude mcp add playwright -- npx -y @playwright/mcp

# GitHub
echo "Adding GitHub..."
claude mcp add github -- npx -y @modelcontextprotocol/server-github

# Notion
echo "Adding Notion..."
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Brevo (requires MCP key from dashboard)
echo "Adding Brevo..."
echo "Note: Get MCP key from Brevo Dashboard → Settings → MCP Integration"
# claude mcp add --transport http brevo https://mcp.brevo.com/sse

echo ""
echo "=== Verifying MCP servers ==="
claude mcp list

echo ""
echo "Done! If GitHub shows issues, ensure GITHUB_TOKEN is set."
```

---

## Machine Status

| Machine | Playwright | GitHub | Notion | Figma | Last Verified |
|---------|------------|--------|--------|-------|---------------|
| Mac Mini | ✅ | ✅ | ⚠️ Needs OAuth | ⚠️ Needs OAuth | Jan 15, 2026 |
| MacBook Air | ✅ | ⚠️ | ⚠️ Needs OAuth | ⚠️ Needs OAuth | Dec 20, 2025 |

**Configuration (Jan 15, 2026):**
- `playwright` - **DEFAULT**: Chrome with persistent profile (for auth sessions)
- `playwright-safari` - WebKit for iOS compatibility testing
- `playwright-firefox` - Firefox/Gecko for cross-browser testing
- `playwright-comet` - **EDGE CASE ONLY**: Comet agentic browser (SSO redirects to default browser)
- `github` - stdio-based, working
- `notion` - HTTP-based, requires browser OAuth (restart Claude after auth)
- `figma` - HTTP-based, requires browser OAuth (restart Claude after auth)

**Notes:**
- Notion/Figma use HTTP-based MCP which requires browser OAuth authentication
- OAuth sessions expire - re-authenticate via browser when "Unauthorized" errors occur
- Comet should only be used by explicit request due to SSO limitations

---

## Troubleshooting

### Notion "Failed to connect"
- Ensure Notion integration is properly configured
- Check if Notion API is accessible from your network
- Try: `curl https://mcp.notion.com/mcp` to test connectivity

### GitHub authentication issues
```bash
# Set GitHub token
export GITHUB_TOKEN="ghp_your_token_here"

# Or add to shell profile (~/.zshrc or ~/.bashrc)
echo 'export GITHUB_TOKEN="ghp_your_token_here"' >> ~/.zshrc
source ~/.zshrc
```

### Playwright browser not installed
```bash
# Install browsers if needed
npx playwright install
```

---

## Removing MCP Servers

```bash
claude mcp remove playwright
claude mcp remove github
claude mcp remove notion
```

---

## Additional MCP Servers (Optional)

### Filesystem (if needed for specific paths)
```bash
claude mcp add filesystem -- npx -y @anthropic/mcp-filesystem /path/to/allow
```

### Fetch (web content)
```bash
claude mcp add fetch -- npx -y @anthropic/mcp-fetch
```

---

*This file syncs via Dropbox. Update when MCP configuration changes.*
