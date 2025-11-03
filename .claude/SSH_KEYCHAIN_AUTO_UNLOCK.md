# SSH Keychain Auto-Unlock - Claude Code Subscription Access

**Created:** November 3, 2025
**Issue:** Claude Code subscription uses keychain (locked in SSH)
**Solution:** Auto-unlock keychain when connecting via SSH/Termius

---

## 🔍 The Real Problem

**You have Claude Code subscription (not API access):**
- ✅ Subscription works via web authentication
- ✅ Credentials stored in macOS keychain
- ❌ Keychain locked in SSH sessions
- ❌ API keys are separate billing (you don't have credits)

**My previous solution was wrong** - it assumed API access, but you're using subscription!

---

## ✅ Solution 1: Add Keychain Unlock to Shell Profile (Recommended)

This automatically unlocks your keychain when you SSH in.

### Setup (Mac Mini - Do This Once):

```bash
# Edit your .zshrc:
nano ~/.zshrc

# Add at the end:
# Auto-unlock keychain for SSH sessions (Claude Code subscription access)
if [ -n "$SSH_CONNECTION" ]; then
    # Only unlock if connected via SSH
    security unlock-keychain ~/Library/Keychains/login.keychain-db 2>/dev/null
fi

# Save: Ctrl+O, Enter, Ctrl+X

# Test it:
source ~/.zshrc
```

### How It Works:

1. When you SSH from iPhone/Termius, it detects SSH connection
2. Automatically runs `security unlock-keychain`
3. Prompts for your Mac password ONCE per session
4. Keychain stays unlocked for that SSH session
5. Claude Code can access subscription credentials
6. Works! ✅

### Usage from iPhone/Termius:

```bash
# Connect via Termius:
ssh christopherwilliamson@100.97.143.9

# It will prompt:
# "password to unlock /Users/christophercooper_1/Library/Keychains/login.keychain-db:"

# Enter your Mac Mini password

# Now keychain is unlocked! Navigate and run:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
claude
# Works! No errors! ✅
```

---

## ✅ Solution 2: Keep Keychain Unlocked Permanently (Easier but Less Secure)

Makes keychain never auto-lock (even in SSH).

### Setup (Mac Mini):

```bash
# Make keychain stay unlocked:
security set-keychain-settings ~/Library/Keychains/login.keychain-db

# That's it! Now keychain is always unlocked
```

### Usage from iPhone/Termius:

```bash
# Connect via Termius:
ssh christopherwilliamson@100.97.143.9

# Navigate and run (no password prompt!):
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
claude
# Works immediately! ✅
```

**Note:** Less secure because keychain is always unlocked, but very convenient for home use.

---

## ✅ Solution 3: Use TeamViewer for GUI Access (Already Set Up)

Since TeamViewer gives you GUI access, the keychain is already unlocked.

### Usage from iPhone:

1. Open TeamViewer on iPhone
2. Connect to Mac Mini (you have ID and password)
3. See Mac Mini desktop
4. Open Terminal from desktop
5. Claude Code works normally (keychain unlocked via GUI)

**Slower than SSH, but works perfectly with subscription!**

---

## 🎯 Recommended Approach

### For Regular Use (Choose One):

**Option A: Auto-unlock on SSH (More Secure)**
- Prompts for password once per session
- Good balance of security and convenience
- Add to ~/.zshrc (Solution 1)

**Option B: Keep Unlocked (Most Convenient)**
- No password prompts
- Always available
- Run security command (Solution 2)
- Good for home network with Tailscale

### For Backup:
- TeamViewer when SSH has issues
- Already set up and working

---

## 🔧 Step-by-Step: Auto-Unlock Setup (Recommended)

**On Mac Mini terminal right now:**

```bash
# 1. Open shell profile:
nano ~/.zshrc

# 2. Scroll to the very bottom (arrow keys)

# 3. Add these lines:
# Claude Code subscription - auto-unlock keychain for SSH
if [ -n "$SSH_CONNECTION" ]; then
    security unlock-keychain ~/Library/Keychains/login.keychain-db 2>/dev/null
fi

# 4. Save and exit:
#    Press: Ctrl+O
#    Press: Enter
#    Press: Ctrl+X

# 5. Reload shell:
source ~/.zshrc

# 6. Done! ✅
```

**Test from iPhone/Termius:**

```bash
# Connect:
ssh christopherwilliamson@100.97.143.9

# You'll see:
# password to unlock /Users/christophercooper_1/Library/Keychains/login.keychain-db:

# Enter your Mac password

# Now run:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
claude

# Works! ✅
```

---

## 🔑 Subscription vs API - Clarified

### Claude Code Subscription (What You Have)
- **Cost:** Included with Claude Pro subscription
- **Auth:** Web login (Claude.ai account)
- **Storage:** macOS keychain
- **Works:** Mac Mini local ✅, MacBook Air local ✅
- **SSH:** Needs keychain unlock (this fix!)

### API Access (Not What You Have)
- **Cost:** Pay-as-you-go credits
- **Auth:** API keys (sk-ant-...)
- **Storage:** Environment variables
- **Works:** SSH natively ✅
- **SSH:** No keychain needed

**You're using subscription, so forget about API keys!** Use keychain unlock instead.

---

## ✅ Quick Reference

### Auto-Unlock Each SSH Session
```bash
# Add to ~/.zshrc:
if [ -n "$SSH_CONNECTION" ]; then
    security unlock-keychain ~/Library/Keychains/login.keychain-db 2>/dev/null
fi
```

### Keep Keychain Always Unlocked
```bash
# Run once:
security set-keychain-settings ~/Library/Keychains/login.keychain-db
```

### Check Keychain Status
```bash
# See if keychain is locked:
security show-keychain-info ~/Library/Keychains/login.keychain-db
```

### Manual Unlock (One-Time)
```bash
# During SSH session if needed:
security unlock-keychain ~/Library/Keychains/login.keychain-db
# Enter password
```

---

## 🎉 Final Result

After setup:
- ✅ Connect from iPhone via Termius
- ✅ Unlock keychain (automatic or prompted once)
- ✅ Run Claude Code with subscription
- ✅ Full multi-machine framework access
- ✅ No API credits needed
- ✅ No additional costs

**This is the correct solution for Claude Code subscription users!**

---

**Created:** November 3, 2025 at 12:05 AM PST
**Issue:** Subscription auth via SSH
**Solution:** Keychain auto-unlock
**Cost:** Free (uses existing subscription)
