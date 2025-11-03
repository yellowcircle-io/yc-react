# TeamViewer Setup Guide - Backup Remote Access

**Created:** November 2, 2025
**Purpose:** Set up TeamViewer as failsafe/backup for remote access when SSH/Termius has issues
**Speed:** Slower than SSH, but provides GUI access

---

## 🎯 Why TeamViewer as Backup

**Primary:** SSH/Termius (fast, terminal-only)
**Backup:** TeamViewer (slower, but GUI access)

**Use TeamViewer when:**
- SSH/Termius authentication fails
- Need to see visual desktop
- Need to click in System Settings
- Troubleshooting connection issues
- Want to see apps running visually

**Don't use TeamViewer for:**
- Regular Claude Code work (use SSH instead)
- Terminal commands (SSH is much faster)
- File editing (SSH is more efficient)

---

## 📦 Installation

### On Mac Mini (Host)

**Download and Install:**
1. Go to: https://www.teamviewer.com/en-us/download/mac-os/
2. Download TeamViewer (free for personal use)
3. Open downloaded .dmg file
4. Drag TeamViewer to Applications
5. Launch TeamViewer from Applications

**Initial Setup (macOS Ventura/Sonoma):**
1. TeamViewer will ask for permissions when first launched
2. Click "Open System Settings" when prompted, or:
   - Open System Settings
   - Go to: Privacy & Security
   - Scroll to "Accessibility" → Toggle ON for TeamViewer
   - Scroll to "Screen Recording" → Toggle ON for TeamViewer
3. You may need to quit and restart TeamViewer after granting permissions
4. TeamViewer icon should appear in menu bar (top right)

### On iPhone/iPad (Client)

**Download TeamViewer QuickSupport:**
1. Open App Store
2. Search "TeamViewer Remote Control"
3. Install (free)
4. Open app

---

## 🔐 Setup Unattended Access

### On Mac Mini - Set Up Personal Password

**This allows you to connect without accepting each time:**

1. **Open TeamViewer on Mac Mini**
   - Should already be running (check menu bar)
   - Or open from Applications folder

2. **Find Your TeamViewer ID:**
   - In the main TeamViewer window
   - Look for "Your ID" at the top
   - Format: `123 456 789` (9-10 digits)
   - **Write this down!**

3. **Set Personal Password:**
   - Click the arrow next to "Password" in TeamViewer window
   - Select "Set personal password..."
   - Enter a strong password (write this down!)
   - Check "Grant easy access"
   - Click "OK"

4. **Enable Start on Boot:**
   - Click TeamViewer in menu bar → "Preferences..."
   - Go to "General" section
   - Check ✓ "Start TeamViewer with system"
   - This ensures it's always available

5. **Verify Settings:**
   - Go to "Security" section in Preferences
   - Under "Personal password" you should see dots (password is set)
   - Under "Incoming LAN connections": Set to "accept" (optional, for local network)

**Note:** The personal password you set is what you'll use to connect from your iPhone/iPad.

### Password Types in TeamViewer

**Random Password (Default):**
- Changes every session
- Must accept connection manually
- ❌ Not good for unattended access

**Personal Password (Recommended):**
- Fixed password you set
- No need to accept manually
- ✅ Good for your own devices

**Unattended Access Password (Best):**
- Most secure for permanent setup
- Fixed password, automatic connection
- ✅ Best for remote work

---

## 📱 Connecting from iPhone/iPad

### Method 1: Quick Connect (Personal Password)

1. **Open TeamViewer on iPhone**
2. **Enter Partner ID:** [Your Mac Mini's ID from above]
3. **Tap "Remote Control"**
4. **Enter Password:** [Your personal password]
5. **Connected!** You'll see Mac Mini's desktop

### Method 2: Save Connection

1. **Open TeamViewer on iPhone**
2. **Tap "Computers"** at bottom
3. **Tap "+"** to add computer
4. **Enter:**
   - Alias: `Mac Mini`
   - Partner ID: [Your TeamViewer ID]
   - Password: [Your personal/unattended password]
5. **Save**
6. **Next time:** Just tap "Mac Mini" to connect instantly

---

## 🖥️ Using TeamViewer

### Desktop View
- Pinch to zoom in/out
- Two-finger scroll
- Tap to click
- Hold to right-click (or use toolbar)

### Keyboard Access
- Tap keyboard icon in toolbar
- Type as normal
- Access to special keys (Cmd, Ctrl, etc.)

### Open Terminal via TeamViewer
1. Connect to Mac Mini
2. Open Spotlight (Cmd+Space) or use toolbar
3. Type "Terminal"
4. Press Enter
5. Use terminal normally (but slower than SSH)

---

## 🔧 TeamViewer Settings for Best Performance

### On Mac Mini - Optimize Settings

**Go to TeamViewer → Preferences:**

1. **General Tab:**
   - ✅ Start TeamViewer with system
   - ✅ Show icon in menu bar

2. **Security Tab:**
   - Set unattended access password
   - ✅ Allow unattended access
   - Choose: "Grant easy access"

3. **Remote Control Tab:**
   - Quality: Automatic or Medium (for mobile)
   - ❌ Uncheck "Show remote cursor"
   - ✅ Check "Optimize speed"

4. **Advanced Tab:**
   - Under "For this computer"
   - ✅ Check "Disable remote input"  while configuring (uncheck after setup)

---

## ⚡ Performance Tips

### Faster Connection
1. **Use WiFi, not cellular** (if possible)
2. **Lower quality** in TeamViewer settings
3. **Disable animations** on Mac Mini:
   - System Settings → Accessibility → Display
   - ✅ Reduce motion
4. **Close unused apps** on Mac Mini

### When to Use Each Method

| Task | Best Method | Why |
|------|-------------|-----|
| **Run Claude Code** | SSH/Termius | Much faster, direct terminal |
| **Edit code** | SSH/Termius | Native terminal experience |
| **Enable SSH** | TeamViewer | Need to click in System Settings |
| **Check app visually** | TeamViewer | See desktop/windows |
| **Run git commands** | SSH/Termius | Faster, text-based |
| **Install software** | TeamViewer | May need GUI |
| **Emergency access** | TeamViewer | Works when SSH fails |

---

## 🆘 Troubleshooting TeamViewer

### Can't Connect
**Issue:** "Partner did not connect"

**Fixes:**
1. Check Mac Mini is on and unlocked
2. Check TeamViewer is running on Mac Mini
3. Verify TeamViewer ID is correct
4. Check internet on both devices
5. Try: Restart TeamViewer on Mac Mini

### Wrong Password
**Issue:** "Password incorrect"

**Fixes:**
1. Verify you're using personal/unattended password
2. NOT using random password (changes each time)
3. Reset password on Mac Mini:
   - TeamViewer → Preferences → Security
   - Change personal password

### Slow Performance
**Issue:** Screen updates slowly

**Fixes:**
1. Switch to WiFi (not cellular)
2. Lower quality: Settings → Remote Control → Quality: Low
3. Close apps on Mac Mini
4. Restart TeamViewer on both devices

### Can't Type
**Issue:** Keyboard not working

**Fixes:**
1. Tap keyboard icon in toolbar
2. Use on-screen keyboard
3. Check keyboard hasn't disconnected
4. Restart TeamViewer session

---

## 🔐 Security Best Practices

### Password Security
- ✅ Use strong password (12+ characters)
- ✅ Different from Mac login password
- ✅ Don't share with others
- ✅ Store in password manager

### Access Control
- ✅ Use unattended access (not random password)
- ✅ Enable two-factor auth in TeamViewer account
- ✅ Check "Confirmation of all activities" in settings
- ✅ Log out of TeamViewer on public devices

### Network Security
- ✅ TeamViewer uses end-to-end encryption
- ✅ Safer than unencrypted VNC
- ✅ Works through firewalls/NAT
- ✅ No port forwarding needed

---

## 📊 Quick Reference: SSH vs TeamViewer

| Feature | SSH/Termius | TeamViewer |
|---------|-------------|------------|
| **Speed** | ⭐⭐⭐⭐⭐ Very fast | ⭐⭐ Slow |
| **Setup** | ⚠️ Requires config | ✅ Easy |
| **Terminal** | ⭐⭐⭐⭐⭐ Native | ⭐⭐ Via GUI |
| **GUI Access** | ❌ No desktop | ✅ Full desktop |
| **Bandwidth** | ⭐⭐⭐⭐⭐ Minimal | ⭐⭐ High |
| **Claude Code** | ⭐⭐⭐⭐⭐ Perfect | ⭐⭐ Works but slow |
| **Failsafe** | ⚠️ Needs SSH enabled | ✅ Always works |
| **Mobile** | ✅ Excellent | ✅ Good |

**Recommendation:**
- **Primary:** SSH/Termius (much faster for Claude Code)
- **Backup:** TeamViewer (when SSH fails or need GUI)

---

## 🎯 Typical Workflow

### SSH Works (Normal Case)
```bash
# iPhone → Termius → SSH → Mac Mini Terminal
1. Open Termius
2. Connect to Mac Mini
3. cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
4. claude-code
5. Work at full speed ⚡
```

### SSH Not Working (Failsafe)
```
# iPhone → TeamViewer → Mac Mini Desktop → Terminal
1. Open TeamViewer
2. Connect to Mac Mini (see desktop)
3. Open Terminal app
4. cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
5. claude-code
6. Work (slower, but functional) 🐌
```

### Use TeamViewer to Fix SSH
1. Connect via TeamViewer
2. Open System Settings → Sharing
3. Enable "Remote Login"
4. Close TeamViewer
5. Use SSH/Termius from now on

---

## 📝 Your TeamViewer Credentials

**Fill this out after setup:**

```
TeamViewer ID: ___________________
Personal Password: _______________
Unattended Password: _____________

Saved in Password Manager: ☐ Yes

Tested from iPhone: ☐ Yes
Connection Speed: ☐ Good ☐ Acceptable ☐ Slow
```

---

## ✅ Setup Checklist

**On Mac Mini:**
- [ ] TeamViewer installed
- [ ] Accessibility permissions granted
- [ ] Screen Recording permission granted
- [ ] Personal password set
- [ ] Unattended access configured
- [ ] "Start with system" enabled
- [ ] TeamViewer ID noted down

**On iPhone:**
- [ ] TeamViewer app installed
- [ ] Mac Mini added to computers list
- [ ] Connection tested successfully
- [ ] Can see Mac Mini desktop
- [ ] Can open Terminal
- [ ] Can type and run commands

**Both Working:**
- [ ] Can connect via SSH/Termius (primary)
- [ ] Can connect via TeamViewer (backup)
- [ ] Both methods can access project files
- [ ] Both methods can run Claude Code
- [ ] Understand when to use which method

---

**Created:** November 2, 2025 at 11:20 PM PST
**Purpose:** Backup remote access method
**Primary Method:** SSH/Termius (faster)
**Backup Method:** TeamViewer (failsafe)
