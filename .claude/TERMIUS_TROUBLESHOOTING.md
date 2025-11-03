# Termius Troubleshooting Guide

**Created:** November 2, 2025
**Issue:** iPhone Termius connection issues with Mac Mini
**Status:** Fixing authentication and Claude Code API setup

---

## 🔍 Issues Identified

### 1. Username vs Home Directory Confusion
- **Username:** `christopherwilliamson` ✅ (use this to log in)
- **Home Directory:** `/Users/christophercooper_1` ✅ (this is correct, macOS naming)
- **Issue:** These are different, which is normal in macOS

### 2. Root Folder Appearing as `/Users/christophercooper_1`
**This is CORRECT!** ✅
- This is your home directory
- It's where you SHOULD be when you connect
- The project is at: `~/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/`

### 3. API Key Authentication Issues
- **Issue:** Claude Code API keys are machine-specific
- **Solution:** Each device needs its own authentication
- **iPhone:** Needs to authenticate Claude Code separately

---

## ✅ Correct Termius Configuration

### On iPhone - Add/Edit Host

**Host Configuration:**
```
Alias: Mac Mini
Hostname: 100.97.143.9
Port: 22
Username: christopherwilliamson    ← IMPORTANT: Use this username
```

**Authentication:**
```
Method: Password
Password: [Your Mac Mini login password]
```

**Advanced Settings:**
```
Keep Alive: ON
Compression: ON
```

---

## 🔧 Step-by-Step Fix

### Step 1: Delete and Recreate Connection (iPhone)

1. **Open Termius on iPhone**
2. **Delete** existing Mac Mini connection (if any)
3. **Tap "+" to add new host**
4. **Enter EXACTLY:**
   - Alias: `Mac Mini`
   - Hostname: `100.97.143.9`
   - Username: `christopherwilliamson` (NOT `christophercooper_1`)
   - Password: [Your Mac password]
   - Port: `22`

5. **Save and Connect**

### Step 2: Test Connection (iPhone)

After connecting, you should see:
```
Last login: [date]
christopherwilliamson@Christophers-Mac-mini ~ %
```

Run:
```bash
# Verify username:
whoami
# Expected: christopherwilliamson

# Verify home directory:
pwd
# Expected: /Users/christophercooper_1

# This is correct! ✅
```

### Step 3: Navigate to Project (iPhone)

```bash
# Go to project:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/

# Or use full path:
cd /Users/christophercooper_1/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/

# Verify you're there:
pwd
ls -la

# You should see:
# .claude/
# dev-context/
# src/
# CLAUDE.md
# etc.
```

---

## 🤖 Claude Code API Authentication

### Understanding the Issue

**Each device needs separate Claude Code authentication:**
- ✅ Mac Mini: Already authenticated
- ✅ MacBook Air: Authenticated (we saw this earlier)
- ❌ iPhone (via Termius SSH): **Needs authentication**

### Solution: Authenticate Claude Code on First Use

**On iPhone in Termius (after connecting):**

```bash
# Navigate to project:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/

# Try to run Claude Code:
claude-code

# If not authenticated, you'll see:
# "Please authenticate..."

# Follow the authentication prompt:
# 1. It will give you a URL
# 2. Open that URL in Safari on your iPhone
# 3. Log in with your Anthropic account
# 4. Authorize the device
# 5. Return to Termius
# 6. Claude Code should now work ✅
```

### Alternative: Use Existing API Key

If you have an API key set on Mac Mini:

```bash
# On Mac Mini - check if API key exists:
echo $ANTHROPIC_API_KEY

# If it shows a key, you can use it on iPhone:
# Method 1: Add to shell profile
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.zshrc
source ~/.zshrc

# Method 2: Set for current session only
export ANTHROPIC_API_KEY="sk-ant-..."
claude-code
```

---

## 📂 File Access Permissions

### Why iPhone Can't Read Files

**Possible causes:**

1. **Wrong Directory**
   - Solution: Use full path above

2. **Dropbox Not Synced**
   - Check: `ls ~/Library/CloudStorage/`
   - Should show: `Dropbox/` directory

3. **SSH User Mismatch**
   - Check: `whoami` should show `christopherwilliamson`
   - Fix: Recreate Termius connection with correct username

4. **File Permissions**
   - Check: `ls -la ~/Library/CloudStorage/Dropbox/CC\ Projects/`
   - Files should be readable by your user

### Test File Access

```bash
# Test reading a file:
cat ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/README.md | head -20

# If this works, file access is OK ✅

# Test Claude Code:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
cat CLAUDE.md | head -20

# If this works, you can access project files ✅
```

---

## 🔑 Password vs SSH Key Authentication

### Current Issue: Too Many Keys

Mac Mini has multiple SSH keys, which can cause "too many authentication failures."

### Fix Option 1: Use Password Only (Easier)

**In Termius on iPhone:**
- Authentication Method: **Password**
- Don't use SSH keys for now
- Just enter your Mac password

### Fix Option 2: Use SSH Key (Advanced)

**On Mac Mini - Copy public key for easier login:**
```bash
# Display your public key:
cat ~/.ssh/id_ed25519.pub

# Copy this key
# In Termius on iPhone:
# - Add the public key
# - Use key authentication
# - No password needed
```

**Recommendation:** Start with Password method (Option 1) - it's simpler.

---

## ✅ Success Checklist

When everything is working, you should be able to:

- [ ] Connect to Mac Mini from iPhone via Termius
- [ ] See username: `christopherwilliamson`
- [ ] See home directory: `/Users/christophercooper_1`
- [ ] Navigate to project: `cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/`
- [ ] List files: `ls -la` shows `.claude/`, `dev-context/`, etc.
- [ ] Read files: `cat .claude/README.md` works
- [ ] Authenticate Claude Code (first time)
- [ ] Run Claude Code: `claude-code` works
- [ ] Claude Code reads `CLAUDE.md` automatically
- [ ] Claude Code has full multi-machine context

---

## 🚨 Common Errors and Fixes

### Error: "Connection refused"
**Fix:**
- Check Tailscale is running on both devices
- Try: `ssh christopherwilliamson@christophers-mac-mini.local`

### Error: "Permission denied"
**Fix:**
- Verify username is `christopherwilliamson` (not `christophercooper_1`)
- Check password is correct
- Try password authentication instead of keys

### Error: "No such file or directory"
**Fix:**
- Use tab completion: `cd ~/Library/Clou` then TAB
- Check Dropbox is synced: `ls ~/Library/CloudStorage/`

### Error: "Too many authentication failures"
**Fix:**
- Use password authentication in Termius
- Or limit SSH keys in Termius settings

### Error: "Claude Code API not authenticated"
**Fix:**
- Run `claude-code` and follow authentication URL
- Or set API key: `export ANTHROPIC_API_KEY="..."`

---

## 📱 Quick Reference Commands

### Connect and Start Working
```bash
# After connecting via Termius:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
cat .claude/shared-context/WIP_CURRENT_CRITICAL.md
claude-code
```

### Check Status
```bash
whoami                          # Should show: christopherwilliamson
pwd                            # Should show: /Users/christophercooper_1
ls ~/Library/CloudStorage/     # Should show: Dropbox/
```

### Project Navigation
```bash
# Project root:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/

# Quick paths:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/dev-context/
```

---

## 📞 Next Steps

1. **Delete and recreate Termius connection** with correct username
2. **Test file access** with `cat` commands above
3. **Authenticate Claude Code** on first run
4. **Verify full access** to multi-machine framework

Once these work, you'll have:
- ✅ Full remote access from iPhone
- ✅ All project files accessible
- ✅ Claude Code with multi-machine context
- ✅ Same experience as Mac Mini terminal

---

**Created:** November 2, 2025 at 11:15 PM PST
**Updated:** November 2, 2025
**Status:** Troubleshooting in progress
