# Termius Keychain Fix - "security unlock-keychain" Error

**Created:** November 2, 2025
**Issue:** Termius SSH shows "security unlock-keychain" error when running Claude Code
**Cause:** macOS keychain locked during SSH sessions (no GUI login)

---

## 🔍 The Problem

When you SSH into Mac Mini via Termius, you see:
```
security unlock-keychain
```

**Why this happens:**
- Claude Code stores API credentials in macOS Keychain
- SSH sessions don't have keychain access (security feature)
- Keychain is locked unless you're logged into the GUI
- Claude Code can't access stored credentials

---

## ✅ Solution 1: Use API Key Environment Variable (Recommended)

Instead of using keychain, set the API key as an environment variable that works in SSH sessions.

### Step A: Get Your API Key (Mac Mini)

**If you have Claude Code working on Mac Mini locally:**

1. **Check if API key already set:**
   ```bash
   # On Mac Mini (local terminal, not SSH):
   echo $ANTHROPIC_API_KEY
   ```

2. **If it shows a key (starts with `sk-ant-`):**
   - Copy that key (you'll use it below)

3. **If it shows nothing, get it from Anthropic:**
   - Go to: https://console.anthropic.com/settings/keys
   - Log in with your account
   - Create new API key or copy existing one
   - Save it securely

### Step B: Add API Key to Shell Profile (Mac Mini)

**On Mac Mini in local terminal (not via SSH yet):**

```bash
# Open shell profile:
nano ~/.zshrc

# Add at the end (replace with YOUR actual key):
export ANTHROPIC_API_KEY="sk-ant-api03-YOUR-ACTUAL-KEY-HERE"

# Save: Ctrl+O, Enter, Ctrl+X

# Reload shell:
source ~/.zshrc

# Verify it's set:
echo $ANTHROPIC_API_KEY
# Should show your key ✅
```

### Step C: Test in SSH Session (iPhone/Termius)

**Now connect via Termius from iPhone:**

```bash
# After connecting:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/

# Check API key is available:
echo $ANTHROPIC_API_KEY
# Should show your key ✅

# Run Claude Code:
claude-code
# Should work without keychain error! ✅
```

---

## ✅ Solution 2: Unlock Keychain in SSH Session (Alternative)

If you prefer to keep using keychain:

### On iPhone in Termius (after connecting):

```bash
# Unlock keychain with your Mac password:
security unlock-keychain ~/Library/Keychains/login.keychain-db

# Enter your Mac password when prompted

# Now run Claude Code:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
claude-code
# Should work now ✅
```

**Downside:** You have to unlock keychain every time you connect.

---

## ✅ Solution 3: Set Keychain to Stay Unlocked (Permanent)

**On Mac Mini:**

```bash
# Set login keychain to not auto-lock:
security set-keychain-settings ~/Library/Keychains/login.keychain-db

# This keeps it unlocked even in SSH sessions
```

**Note:** Less secure, but more convenient for SSH access.

---

## 🎯 Recommended Setup (Best Practice)

### Use API Key for SSH, Keychain for Local

**This gives you:**
- ✅ Fast SSH access (no keychain unlock needed)
- ✅ Secure (API key only in your shell profile)
- ✅ Works on all SSH connections automatically

**Setup:**

1. **Add to ~/.zshrc on Mac Mini:**
   ```bash
   # Claude Code API Key (for SSH sessions)
   export ANTHROPIC_API_KEY="sk-ant-YOUR-KEY"
   ```

2. **Reload shell:**
   ```bash
   source ~/.zshrc
   ```

3. **Test locally first:**
   ```bash
   # On Mac Mini local terminal:
   echo $ANTHROPIC_API_KEY
   claude-code
   # Both should work ✅
   ```

4. **Then test via SSH:**
   ```bash
   # On iPhone in Termius:
   echo $ANTHROPIC_API_KEY
   claude-code
   # Both should work ✅
   ```

---

## 🔧 Troubleshooting

### Error: "ANTHROPIC_API_KEY not set"

**In SSH session:**
```bash
# Check if variable is set:
echo $ANTHROPIC_API_KEY

# If empty, check shell profile:
cat ~/.zshrc | grep ANTHROPIC

# If not there, add it:
echo 'export ANTHROPIC_API_KEY="sk-ant-YOUR-KEY"' >> ~/.zshrc
source ~/.zshrc
```

### Error: "Invalid API key"

**Problem:** Wrong or expired key

**Fix:**
1. Go to: https://console.anthropic.com/settings/keys
2. Create new API key
3. Update ~/.zshrc with new key
4. Run: `source ~/.zshrc`

### Error: Still asks for keychain unlock

**Problem:** API key not being read

**Fix:**
```bash
# Check which shell you're using:
echo $SHELL

# If it's zsh (default on macOS):
source ~/.zshrc

# If it's bash:
source ~/.bash_profile

# Then try again:
claude-code
```

### Keychain unlock prompt keeps appearing

**Quick fix during SSH session:**
```bash
# Unlock once per session:
security unlock-keychain

# Enter Mac password

# OR set API key for this session only:
export ANTHROPIC_API_KEY="sk-ant-YOUR-KEY"
claude-code
```

---

## 📋 Quick Reference

### Working with API Keys

```bash
# Check if API key is set:
echo $ANTHROPIC_API_KEY

# Set API key for current session only:
export ANTHROPIC_API_KEY="sk-ant-YOUR-KEY"

# Set API key permanently (add to ~/.zshrc):
echo 'export ANTHROPIC_API_KEY="sk-ant-YOUR-KEY"' >> ~/.zshrc
source ~/.zshrc

# Remove API key from environment:
unset ANTHROPIC_API_KEY
```

### Keychain Commands

```bash
# List keychains:
security list-keychains

# Unlock login keychain:
security unlock-keychain ~/Library/Keychains/login.keychain-db

# Check keychain settings:
security show-keychain-info ~/Library/Keychains/login.keychain-db

# Keep keychain unlocked:
security set-keychain-settings ~/Library/Keychains/login.keychain-db
```

---

## 🔐 Security Notes

### API Key Security

**Good practices:**
- ✅ Store in ~/.zshrc (protected by file permissions)
- ✅ Don't commit to git (already in .gitignore)
- ✅ Don't share with others
- ✅ Rotate keys periodically
- ❌ Don't put in public files
- ❌ Don't store in browser/notes apps

### Keychain vs API Key

**Keychain (more secure):**
- Encrypted storage
- Requires Mac password
- Locked in SSH sessions
- Better for sensitive data

**API Key in ~/.zshrc (more convenient):**
- Plain text in shell profile
- Always available
- Works in SSH sessions
- Good for development

**Recommendation:** Use API key in environment variable for SSH access (your use case).

---

## ✅ Success Checklist

**After applying fix:**

- [ ] API key added to ~/.zshrc on Mac Mini
- [ ] Reloaded shell: `source ~/.zshrc`
- [ ] Tested locally: `echo $ANTHROPIC_API_KEY` shows key
- [ ] Tested locally: `claude-code` works without keychain prompt
- [ ] Connected via Termius from iPhone
- [ ] Tested in SSH: `echo $ANTHROPIC_API_KEY` shows key
- [ ] Tested in SSH: `claude-code` works without keychain prompt
- [ ] No more "security unlock-keychain" errors ✅
- [ ] Can access full project and multi-machine framework ✅

---

## 🎯 Complete SSH Session Flow (After Fix)

```bash
# 1. Connect via Termius from iPhone:
ssh christopherwilliamson@100.97.143.9

# 2. Navigate to project:
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/

# 3. Verify API key available:
echo $ANTHROPIC_API_KEY
# Shows: sk-ant-... ✅

# 4. Run Claude Code:
claude-code
# Works immediately, no keychain prompt! ✅

# 5. Claude Code reads CLAUDE.md automatically:
# - Sees multi-machine system
# - Reads WIP_CURRENT_CRITICAL.md
# - Has full context
# - Ready to work! ✅
```

**No more keychain issues!** 🎉

---

**Created:** November 2, 2025 at 11:35 PM PST
**Issue:** Keychain locked in SSH sessions
**Solution:** Use API key environment variable
**Result:** Claude Code works seamlessly via Termius
