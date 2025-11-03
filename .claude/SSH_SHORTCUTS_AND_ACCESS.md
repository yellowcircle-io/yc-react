# SSH Shortcuts & Termius Access Guide

**Created:** November 3, 2025
**Purpose:** Quick directory navigation and multi-platform Termius access

---

## ✅ Directory Jump Shortcuts (Already Set Up!)

### Quick Commands Added to ~/.zshrc

Instead of typing the long path every time, you now have three shortcuts:

```bash
# After SSH connection, just type:
yc          # Jump to yellow-circle project
# OR
yellow      # Same thing
# OR
project     # Also works
```

All three commands instantly jump to:
```
~/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/
```

### Usage from iPhone via Termius

**Before (long typing on mobile):**
```bash
ssh christopherwilliamson@100.97.143.9
[unlock keychain]
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
claude
```

**After (much easier!):**
```bash
ssh christopherwilliamson@100.97.143.9
[unlock keychain]
yc          # Just 2 characters! ✅
claude
```

### Available Shortcuts

| Shortcut | Goes To | Best For |
|----------|---------|----------|
| `yc` | Yellow-circle project | Quick typing (2 chars) |
| `yellow` | Yellow-circle project | Memorable name |
| `project` | Yellow-circle project | Generic, easy to remember |

**Use whichever you like!** All three work the same way.

---

## 💡 Additional Useful Shortcuts

You can also combine shortcuts:

```bash
# Jump and run Claude in one line:
yc && claude

# Check status and jump:
yc && git status

# Jump and check WIP:
yc && cat .claude/shared-context/WIP_CURRENT_CRITICAL.md
```

---

## 🖥️ Termius Access - Multi-Platform

### YES! Termius Available On:

**Mobile:**
- ✅ iPhone/iPad - iOS app (you have this)
- ✅ Android - Android app

**Desktop:**
- ✅ macOS - Desktop app
- ✅ Windows - Desktop app
- ✅ Linux - Desktop app

**Web:**
- ⚠️ Termius has a web version BUT requires Pro subscription
- Free tier: Mobile + one desktop only
- Pro tier: Unlimited devices + web access + sync

### Termius Free vs Pro

**Free Tier (What You Likely Have):**
- ✅ Connect to hosts (unlimited)
- ✅ One mobile device
- ✅ One desktop device
- ❌ Web access (requires Pro)
- ❌ Cross-device sync (requires Pro)

**Pro Tier (~$10/month):**
- ✅ All features above
- ✅ Web access (browser-based)
- ✅ Sync across unlimited devices
- ✅ SFTP file manager
- ✅ Snippet sync
- ✅ Vault sync

### Accessing from Other Computers

**Option 1: Install Termius Desktop (Free)**
- Download: https://termius.com/download
- Install on Mac/Windows/Linux
- Add same connection (100.97.143.9)
- Free for one desktop device

**Option 2: Use Native SSH (Free)**

Any computer with terminal can connect without Termius:

**macOS/Linux:**
```bash
ssh christopherwilliamson@100.97.143.9
[unlock keychain]
yc
claude
```

**Windows (PowerShell or Windows Terminal):**
```powershell
ssh christopherwilliamson@100.97.143.9
[unlock keychain]
yc
claude
```

**Option 3: TeamViewer (Already Set Up)**
- GUI access from any device
- Already configured on Mac Mini
- Slower but works from any browser

---

## 🌐 SSH from Web Browser (Alternative)

If you want browser-based SSH without Termius Pro:

**Free Web SSH Clients:**

1. **Chrome SSH Extension (Free)**
   - Install: "Secure Shell Extension" for Chrome
   - Add host: 100.97.143.9
   - Works in Chrome browser

2. **FireSSH (Free)**
   - Firefox extension
   - Full SSH client in browser

3. **WebSSH (Self-Hosted, Free)**
   - Can install on a server
   - Access SSH via web interface

**Recommendation:** Just use native SSH client on desktop computers (free, built-in).

---

## 📊 Access Methods Comparison

| Method | Platform | Cost | Speed | Best For |
|--------|----------|------|-------|----------|
| **Termius Mobile** | iPhone/iPad | Free | ⭐⭐⭐⭐⭐ | Mobile work ✅ |
| **Termius Desktop** | Mac/Win/Linux | Free | ⭐⭐⭐⭐⭐ | Desktop work |
| **Native SSH** | Any terminal | Free | ⭐⭐⭐⭐⭐ | Desktop work ✅ |
| **Termius Web** | Browser | $10/mo | ⭐⭐⭐⭐ | Multi-device |
| **TeamViewer** | Any | Free | ⭐⭐ | GUI backup |

---

## 🎯 Recommended Setup

### What You Have Now (Free):
- ✅ Termius on iPhone (primary mobile)
- ✅ Native SSH on Mac Mini (local)
- ✅ Native SSH on MacBook Air (local)
- ✅ TeamViewer (backup GUI access)

### For Additional Computers:
**Just use native SSH** (no Termius needed):
```bash
# On any Mac/Linux/Windows computer:
ssh christopherwilliamson@100.97.143.9
yc
claude
```

**No additional software needed!** ✅

---

## 🚀 Complete Quick Start Guide

### From iPhone (Termius):
```bash
# 1. Open Termius, connect to Mac Mini
# 2. Unlock keychain with Mac password
# 3. Jump to project:
yc

# 4. Start working:
claude
```

### From Another Mac/Linux Computer:
```bash
# Open Terminal:
ssh christopherwilliamson@100.97.143.9
yc
claude
```

### From Windows Computer:
```powershell
# Open PowerShell or Windows Terminal:
ssh christopherwilliamson@100.97.143.9
yc
claude
```

### From MacBook Air (Local):
```bash
# Open Terminal:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
# OR use the shortcut:
yc
claude
```

---

## 💾 Termius Snippets (Mobile Typing Helper)

**In Termius, you can create snippets for common commands:**

1. Open Termius → Settings → Snippets
2. Add snippets:
   - Name: "Go to project"
   - Command: `yc`

   - Name: "Start Claude"
   - Command: `yc && claude`

   - Name: "Check status"
   - Command: `yc && cat .claude/shared-context/WIP_CURRENT_CRITICAL.md`

3. Use: Type `/` in Termius to access snippets

---

## 🔧 Additional Shortcuts You Can Add

**Edit ~/.zshrc to add more shortcuts:**

```bash
# Quick Claude Code start
alias cc='cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/ && claude'

# Quick status check
alias status='cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/ && cat .claude/shared-context/WIP_CURRENT_CRITICAL.md'

# Quick git status
alias ycgit='cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/ && git status'
```

Then:
```bash
source ~/.zshrc  # Reload

# Use:
cc        # Go to project and start Claude!
status    # Jump and show WIP status
ycgit     # Jump and show git status
```

---

## ✅ Current Setup Summary

**Shortcuts Available NOW:**
- `yc` - Jump to yellow-circle project ✅
- `yellow` - Same as above ✅
- `project` - Same as above ✅

**Access Methods Available:**
- iPhone (Termius) - ✅ Working
- Mac Mini (local terminal) - ✅ Working
- MacBook Air (local terminal) - ✅ Should work (synced)
- Any computer (native SSH) - ✅ Ready
- TeamViewer (GUI) - ✅ Configured

**Cost:**
- Everything: **FREE** ✅
- Uses existing tools and subscriptions
- No Termius Pro needed for your use case

---

## 🎉 Final Workflow

**Most efficient mobile workflow:**

```bash
# From iPhone Termius:
ssh christopherwilliamson@100.97.143.9    # Connect
[enter Mac password]                       # Unlock keychain
yc                                         # Jump (2 chars!)
claude                                     # Start working

# That's it! 4 commands total. ✅
```

---

**Created:** November 3, 2025 at 12:30 AM PST
**Shortcuts:** yc, yellow, project
**Cost:** $0 (all free methods)
**Status:** Ready to use!
