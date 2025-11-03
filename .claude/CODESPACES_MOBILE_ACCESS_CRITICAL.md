# 🔴 CRITICAL: GitHub Codespaces & Mobile Access Guide

**⚠️ USER ACTION REQUIRED:** This document contains essential instructions for accessing your repository from iPad, iPhone, and other devices.

**Purpose:** Enable repository access from iPad, iPhone, and non-primary machines
**Repository:** https://github.com/yellowcircle-io/yc-react.git
**Created:** November 2, 2025
**Status:** CRITICAL - Required for mobile access and Codespaces setup

---

## 🚨 IMMEDIATE ACTIONS NEEDED

1. **Commit `.claude/` to GitHub** - Required for Codespace access to shared context
   ```bash
   git add .claude/
   git commit -m "Add multi-machine Claude Code context system"
   git push
   ```

2. **Test Codespace Access** - Open GitHub repository and create a Codespace to verify setup

3. **Install GitHub Mobile App** (Optional) - For quick file access on iPad/iPhone

---

## Overview

**GitHub Codespaces** provides a cloud-based VS Code environment accessible from any device with a web browser.

**Use Cases:**
- Quick edits from iPad/iPhone
- Review code and shared context on mobile
- Emergency fixes when away from primary machines
- Temporary access from borrowed/public computers
- Testing in clean environment

**Shared Context Access:**
All `.claude/shared-context/` files are accessible via Codespaces, enabling full context awareness on any device.

---

## Quick Start: iPad/iPhone

### Method 1: GitHub Mobile App (Read + Quick Edits)

**Step 1: Install GitHub App**
- Download "GitHub" from App Store
- Sign in with your GitHub account

**Step 2: Navigate to Repository**
1. Tap "Repositories"
2. Find "yellowcircle-io/yc-react"
3. Tap to open

**Step 3: Browse Files**
- Tap "Code" tab
- Navigate folder structure
- Tap any file to view

**Step 4: Read Shared Context**
1. Navigate to `.claude/shared-context/`
2. Tap `WIP_CURRENT_CRITICAL.md` to see current work status
3. Tap `DECISIONS.md` to see decision log
4. Tap `README.md` for usage instructions

**Step 5: Make Quick Edits (Optional)**
1. Tap file to open
2. Tap "Edit" icon (pencil)
3. Make changes
4. Tap "Commit changes"
5. Add commit message
6. Tap "Commit" to save

**Limitations:**
- One file at a time
- No terminal access
- No multi-file operations
- Best for quick reference and simple edits

---

### Method 2: GitHub Codespaces (Full Development Environment)

**Step 1: Open Codespace**
1. Open Safari/Chrome on iPad/iPhone
2. Navigate to: https://github.com/yellowcircle-io/yc-react
3. Tap "Code" button (green)
4. Tap "Codespaces" tab
5. Tap "Create codespace on main"

**Step 2: Wait for Environment Setup**
- Codespace will initialize (30-60 seconds)
- VS Code will open in browser
- Full repository will be accessible

**Step 3: Access Shared Context**
```bash
# In Codespace terminal (tap Terminal → New Terminal)
cd .claude/shared-context
cat WIP_CURRENT_CRITICAL.md
```

Or navigate via file explorer:
1. Tap "Explorer" icon (files icon on left sidebar)
2. Navigate to `.claude/shared-context/`
3. Tap any file to open

**Step 4: Make Changes**
- Edit files using VS Code interface
- Use terminal for git commands
- Full development environment available

**Step 5: Commit and Push**
```bash
# In terminal
git add .
git commit -m "Your commit message"
git push
```

Or use VS Code Source Control:
1. Tap "Source Control" icon (branch icon on left sidebar)
2. Review changes
3. Enter commit message
4. Tap "Commit" checkmark
5. Tap "Sync Changes" to push

**Step 6: Stop Codespace When Done**
1. Tap menu icon (three lines, top-left)
2. Tap "Codespaces"
3. Tap "Stop Current Codespace"

**Advantages:**
- Full VS Code environment
- Terminal access
- Multi-file editing
- Git integration
- Run npm commands
- Test changes

**Limitations:**
- Requires internet connection
- Monthly usage limits (60 hours free tier)
- No Claude Code CLI (browser-based only)
- Mobile keyboard may be challenging for long sessions

---

## Desktop Browser Access (Non-Primary Machines)

### Use Case: Borrowed laptop, library computer, friend's machine

**Step 1: Open Codespace**
1. Navigate to https://github.com/yellowcircle-io/yc-react
2. Click "Code" → "Codespaces" → "Create codespace on main"
3. Wait for environment to load

**Step 2: Work as Normal**
- Full VS Code in browser
- All keyboard shortcuts work
- Terminal access
- Git integration
- File search and navigation

**Step 3: Access Shared Context**
```bash
# In terminal
cd .claude/shared-context
cat WIP_CURRENT_CRITICAL.md
cat DECISIONS.md
```

**Step 4: Make Changes**
- Edit files
- Run commands
- Test locally (within Codespace)
- Commit and push

**Step 5: Clean Up**
- Stop Codespace when done (or it auto-stops after 30 min idle)
- All changes are saved to GitHub
- No local files remain on borrowed machine

---

## Shared Context Access Patterns

### Reading Current Status (Mobile Quick Check)

**From GitHub Mobile App:**
1. Open repository
2. Navigate to `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
3. Read current work status
4. Check "Next Steps" section
5. Close app

**Time:** 30 seconds
**Use:** Quick check before starting work on primary machine

---

### Making Emergency Fix (iPad/iPhone)

**Scenario:** Critical bug discovered while away from desk

**Steps:**
1. Open GitHub app
2. Check `WIP_CURRENT_CRITICAL.md` to understand current state
3. Open Codespace in Safari
4. Make fix
5. Test if possible (or note in commit message)
6. Commit and push
7. Update `WIP_CURRENT_CRITICAL.md` with what was changed
8. Add entry to `DECISIONS.md` explaining emergency fix
9. Stop Codespace

**Time:** 5-15 minutes
**Result:** Fix deployed, context updated, primary machines can continue

---

### Reviewing Analysis Documents (Mobile Reading)

**Scenario:** Want to review critical analysis while commuting

**Steps:**
1. Open GitHub app
2. Navigate to `dev-context/`
3. Open desired document (e.g., `01_Visual_Notes_Technical_Roadmap_CRITICAL.md`)
4. Read in app (supports markdown rendering)
5. Take notes externally if needed

**Time:** 10-30 minutes
**Result:** Reviewed analysis, informed decisions for next work session

---

### Updating WIP from Non-Primary Machine

**Scenario:** Working on different machine temporarily

**Steps:**
1. Open Codespace
2. Read `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
3. Make changes to codebase
4. Update `WIP_CURRENT_CRITICAL.md`:
   ```markdown
   **Updated:** [Current timestamp]
   **Machine:** Codespace (Temporary)
   **Status:** [Status]

   ## Recent Work
   [What you just did]

   ## Next Steps
   [What should happen next]
   ```
5. Commit all changes
6. Push to GitHub
7. Stop Codespace

**Time:** Variable
**Result:** Work completed, context updated, ready for primary machine handoff

---

## Codespace Configuration

### Pre-installed Tools
- Node.js and npm
- Git
- VS Code extensions
- Terminal (bash)

### Repository-Specific Setup
All dependencies defined in `package.json` will be available:
- React 19.1
- Vite 5.4
- Tailwind CSS 4.1
- Firebase tools
- ESLint

### Running Development Server in Codespace
```bash
# Install dependencies (first time)
npm install

# Start dev server
npm run dev

# Codespace will forward port 5173
# Click "Open in Browser" notification to preview
```

### Limitations
- No Dropbox access (files only available via git)
- No Claude Code CLI (manual editing only)
- Monthly usage limits
- Internet required

### Best Practices
- Stop Codespace when done (saves hours)
- Keep sessions short on mobile (battery/data)
- Commit frequently
- Update shared context before stopping

---

## Mobile-Specific Tips

### iPad

**Keyboard Shortcuts:**
- Cmd+P: Quick file search
- Cmd+Shift+P: Command palette
- Cmd+`: Toggle terminal
- Cmd+S: Save file

**External Keyboard Recommended:**
- Full VS Code shortcuts available
- Faster coding
- Better terminal experience

**Split View:**
- Safari + Notes app for context reference
- Safari + other app for research while coding

### iPhone

**Best Practices:**
- Use for reading/reviewing only
- Avoid heavy coding (small screen)
- Perfect for checking WIP_CURRENT_CRITICAL.md
- Quick commit message updates acceptable

**Landscape Mode:**
- Wider code view
- Better terminal visibility
- Easier navigation

**Text Size:**
- Pinch to zoom in browser
- VS Code settings → Zoom level

---

## GitHub Usage Limits

### Free Tier (Personal Account)
- **Codespaces:** 60 hours/month (120 core-hours)
- **Storage:** 15 GB
- **Automatic stop:** After 30 min idle

### Best Practices to Stay Within Limits
1. **Stop Codespaces** when not actively using
2. **Use local machines** for long sessions
3. **Reserve Codespaces** for mobile/emergency/quick access
4. **Monitor usage:** GitHub Settings → Billing → Codespaces

### If Limit Reached
- Upgrade to paid plan ($0.18/hour)
- Wait until next month (resets monthly)
- Use local development on primary machines

---

## Synchronization with Dropbox

### Important: Codespace = GitHub Only

**Codespace sees:**
- ✅ Files committed and pushed to GitHub
- ✅ All branches and tags
- ❌ Uncommitted local changes on Mac Mini
- ❌ Dropbox-only files (not in git)

**Workflow:**
1. **Mac Mini:** Make changes
2. **Mac Mini:** Commit and push to GitHub
3. **Codespace:** Pull latest changes
4. **Codespace:** Make changes
5. **Codespace:** Commit and push
6. **Mac Mini:** Pull changes from GitHub
7. **Dropbox:** Syncs `.git/` directory across Mac Mini and MacBook Air

**Shared Context Availability:**
- `.claude/` directory must be committed to GitHub for Codespace access
- Or: Reference shared context files in commit messages
- Or: Create separate `docs/` folder for Codespace-accessible notes

---

## Recommended Git Workflow for Mobile Access

### Option 1: Commit `.claude/` to Git (Recommended)

**Pros:**
- Full context available in Codespaces
- Version history of decisions and WIP notes
- Easy to reference in commits

**Cons:**
- Context files visible in repository
- Increases repository size slightly

**Setup:**
```bash
# On Mac Mini
git add .claude/
git commit -m "Add Claude Code shared context system"
git push
```

Now all `.claude/` files are accessible in Codespaces!

### Option 2: Keep `.claude/` Dropbox-Only

**Pros:**
- Cleaner repository (no context clutter)
- Private context files

**Cons:**
- No context access in Codespaces
- Must reference context manually in commits

**Setup:**
```bash
# Add to .gitignore
echo ".claude/" >> .gitignore
git add .gitignore
git commit -m "Ignore Claude Code context directory"
git push
```

### Recommendation

**Commit `.claude/` to git** because:
- Shared context is valuable historical record
- Decisions.md helps understand codebase evolution
- WIP history shows project progress
- Enables full mobile/Codespace functionality
- Can always mark as private repository if needed

---

## Quick Reference Commands (Codespace Terminal)

```bash
# Read current work status
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md

# Read decision log
cat .claude/shared-context/DECISIONS.md

# Read instance logs
ls -l .claude/INSTANCE_LOG_*.md
cat .claude/INSTANCE_LOG_MacMini.md

# Search shared context
grep -r "search term" .claude/shared-context/

# Update WIP
# (Edit .claude/shared-context/WIP_CURRENT_CRITICAL.md in VS Code)

# Commit changes
git add .
git commit -m "Your commit message"
git push

# Pull latest changes
git pull

# Check git status
git status

# Install dependencies
npm install

# Run dev server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

---

## Emergency Access Procedures

### Scenario: Urgent Fix Needed, Only Have Phone

**Steps:**
1. **Check status** (30 sec):
   - GitHub app → `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
   - Understand current state

2. **Assess urgency** (1 min):
   - Can it wait for primary machine access?
   - Is it truly urgent?
   - Is mobile fix feasible?

3. **If urgent, open Codespace** (2 min):
   - Browser → github.com/yellowcircle-io/yc-react
   - Code → Codespaces → Create codespace

4. **Make minimal fix** (5-10 min):
   - Edit only necessary files
   - Test if possible
   - Commit with detailed message explaining context

5. **Update shared context** (2 min):
   - Edit `WIP_CURRENT_CRITICAL.md`
   - Add entry to `DECISIONS.md`
   - Document what was changed and why

6. **Push and stop** (1 min):
   - Commit and push
   - Stop Codespace
   - Total time: ~15 minutes

7. **Follow up on primary machine**:
   - Pull changes
   - Review fix
   - Add tests or improvements if needed

---

## Support and Troubleshooting

### Codespace Won't Start
- **Check:** GitHub status page
- **Try:** Refresh page, try again
- **Solution:** Wait a few minutes, GitHub may be experiencing issues

### Can't See Latest Changes
- **Check:** Did Mac Mini push to GitHub?
- **Try:** `git pull` in Codespace
- **Solution:** Ensure all machines are synced via git push/pull

### WIP_CURRENT_CRITICAL.md Not Found in Codespace
- **Check:** Is `.claude/` in `.gitignore`?
- **Solution:** Commit `.claude/` to git on Mac Mini, push, then pull in Codespace

### Codespace Quota Exceeded
- **Check:** GitHub Settings → Billing → Codespaces usage
- **Solution:** Stop unused Codespaces, delete old Codespaces, wait for monthly reset

### Mobile Performance Slow
- **Check:** Network connection
- **Try:** Stop and restart Codespace
- **Solution:** Use lighter editing (GitHub app) instead of full Codespace

---

## Additional Resources

**GitHub Codespaces Documentation:**
https://docs.github.com/en/codespaces

**GitHub Mobile App:**
https://github.com/mobile

**VS Code Web Documentation:**
https://code.visualstudio.com/docs/editor/vscode-web

**Repository:**
https://github.com/yellowcircle-io/yc-react

---

**Guide Created:** November 2, 2025
**Last Updated:** November 2, 2025
**Maintained By:** Mac Mini primary instance
