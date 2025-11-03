# SSH/Termius Access Guide - Mac Mini Remote Access

**Created:** November 2, 2025
**Purpose:** Quick reference for accessing Mac Mini via SSH from iPad/iPhone using Termius

---

## 🚀 Quick Connect

### Connection Details

**Host:** `100.97.143.9` (Tailscale IP)
**Alt Host:** `christophers-mac-mini.local` (local network)
**Username:** `christopherwilliamson`
**Password:** [Your Mac Mini login password]
**Port:** `22` (default SSH)

### In Termius App

1. Open Termius
2. Tap saved host: **"Mac Mini"**
3. Enter password
4. Connected! ✅

---

## 📂 Navigate to Project

```bash
# Go to yellow-circle project:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/

# Verify location:
pwd
# Expected: /Users/christopherwilliamson/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle

# Check current work status:
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md
```

---

## 🤖 Run Claude Code

```bash
# From project directory:
claude-code

# Claude Code will automatically:
# ✅ Read CLAUDE.md (multi-machine instructions)
# ✅ Check WIP_CURRENT_CRITICAL.md
# ✅ Load full project context
# ✅ See all dev-context/ files
# ✅ Access Google Drive integrated files
```

---

## 🔧 Common Commands

### Project Status
```bash
# Check git status:
git status

# Check recent commits:
git log --oneline -5

# Check running processes:
ps aux | grep node
ps aux | grep vite
```

### Development Server
```bash
# Start dev server:
npm run dev

# Or attach to existing tmux session:
tmux attach -t vite-server
```

### Claude Code Sessions
```bash
# Attach to existing Claude session:
tmux attach -t claude-dev

# Create new tmux session:
tmux new -s my-session

# Detach from tmux: Ctrl+B, then D
```

---

## 🎯 What You Can Access

### Full Repository ✅
- All source files (`src/`)
- All configuration files
- `.claude/` multi-machine system
- `dev-context/` (including private files)
- Google Drive integrated files (15 Rho assessments)
- Git history and branches
- npm packages and node_modules

### Multi-Machine Context ✅
- `CLAUDE.md` (auto-read by Claude Code)
- `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
- `.claude/INSTANCE_LOG_MacMini.md`
- `.claude/INSTANCE_LOG_MacBookAir.md` (from MacBook Air)
- All CRITICAL files
- Decision logs

### Tools Available ✅
- Claude Code CLI
- Git
- npm/node
- Firebase CLI
- Vite dev server
- All installed packages

---

## 🔍 Troubleshooting

### Can't Connect
**Issue:** Connection refused or timeout

**Solutions:**
1. Check Tailscale is running on Mac Mini:
   ```bash
   tailscale status
   ```
2. Check SSH is enabled:
   - Mac Mini → System Settings → Sharing
   - "Remote Login" should be ON
3. Check Tailscale is running on iPad/iPhone
4. Try alternate hostname: `christophers-mac-mini.local`

### Wrong Password
**Issue:** Authentication failed

**Solutions:**
1. Use your Mac Mini login password (not iCloud password)
2. If Mac Mini is locked, unlock it first
3. Try logging into Mac Mini directly to verify password

### Can't Find Project Directory
**Issue:** Directory not found

**Solutions:**
```bash
# Check Dropbox sync status:
ls ~/Library/CloudStorage/

# Verify path exists:
ls ~/Library/CloudStorage/Dropbox/CC\ Projects/

# Alternative paths to check:
ls ~/Dropbox/CC\ Projects/  # Legacy path
```

### Claude Code Not Found
**Issue:** `command not found: claude-code`

**Solutions:**
```bash
# Check if installed:
which claude-code

# If not found, install:
npm install -g @anthropic-ai/claude-code

# Or use npx:
npx @anthropic-ai/claude-code
```

---

## 📱 Termius Tips

### Save Multiple Connections
Create separate hosts for different scenarios:
- **Mac Mini (Tailscale):** `100.97.143.9` - Works anywhere
- **Mac Mini (Local):** `christophers-mac-mini.local` - Faster on home network

### Use Snippets
Save common commands as snippets:
- `cdproject` → `cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/`
- `status` → `cat .claude/shared-context/WIP_CURRENT_CRITICAL.md`
- `cc` → `claude-code`

### SSH Keys (Advanced)
For password-less login:
1. Mac Mini already has keys: `~/.ssh/id_ed25519`
2. Add public key to iPad/iPhone in Termius
3. Use key authentication instead of password

---

## 🔐 Security Notes

### Safe Practices
- ✅ Tailscale encrypts all traffic
- ✅ Tailscale only works with your authenticated devices
- ✅ SSH is secure by default
- ✅ Password required for each connection

### What NOT to Do
- ❌ Don't use public WiFi without VPN
- ❌ Don't share Tailscale login
- ❌ Don't save password in untrusted apps
- ✅ Use Face ID/Touch ID in Termius if available

---

## 🌟 Benefits Over Other Methods

### vs. GitHub Codespaces
- ✅ Access to dev-context/ (private files)
- ✅ No quota limits (unlimited usage)
- ✅ Faster (direct connection to Mac Mini)
- ✅ Full environment (not sandboxed)

### vs. TeamViewer
- ✅ Text-based (no GUI overhead)
- ✅ Faster (terminal vs screen sharing)
- ✅ Better for CLI/terminal work
- ✅ Lower bandwidth

### vs. VNC/Screen Sharing
- ✅ Much faster
- ✅ Works on mobile without desktop
- ✅ Perfect for terminal/CLI workflows
- ✅ Lower latency

---

## 🎯 Recommended Workflow

### Starting Work Session (iPad/iPhone)
1. Open Termius
2. Connect to Mac Mini
3. `cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/`
4. `cat .claude/shared-context/WIP_CURRENT_CRITICAL.md` - Read current status
5. `claude-code` - Start working
6. Make changes, test, iterate

### Ending Work Session
1. Update WIP file if needed
2. Commit changes: `git add . && git commit -m "message"`
3. Push to GitHub: `git push`
4. Detach from tmux if needed: `Ctrl+B, D`
5. Exit: `exit`
6. Close Termius

---

## 📚 Related Documentation

- **Multi-Machine System:** `.claude/README.md`
- **MacBook Air Sync:** `.claude/MACBOOK_AIR_SYNC_INSTRUCTIONS.md`
- **Codespaces Access:** `.claude/CODESPACES_MOBILE_ACCESS_CRITICAL.md`
- **Current Work:** `.claude/shared-context/WIP_CURRENT_CRITICAL.md`

---

**Created:** November 2, 2025 at 11:00 PM PST
**Updated:** November 2, 2025
**Machine:** Mac Mini
**For:** iPad/iPhone remote access via SSH/Termius
