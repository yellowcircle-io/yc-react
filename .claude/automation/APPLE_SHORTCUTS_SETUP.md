# 🍎 Apple Shortcuts Setup Guide - yellowCircle Automation

**Complete step-by-step instructions to create iPhone shortcuts**

**Time Required:** 15 minutes (one-time setup)
**Prerequisites:** iPhone with Shortcuts app installed (built-in iOS app)

---

## 📋 Overview

We'll create 4 essential shortcuts:

1. **yellowCircle Menu** ⭐ - Main interface (most important)
2. **YC Rollback** ⚡ - Emergency undo
3. **YC History** 📊 - View recent changes
4. **YC View Config** 👀 - Quick config viewer

---

## 🔐 Prerequisites Setup

### Step 1: Enable Remote Login on MacBook Air

**On MacBook Air:**
1. Open **System Settings**
2. Click **General** → **Sharing**
3. Toggle **Remote Login** to **ON**
4. Verify your username appears (christophercooper)

✅ You should see: "Remote Login: On - Allow access for: All users"

### Step 2: Verify Network Connection

**Both devices must be on the same WiFi network:**
- MacBook Air: Check WiFi icon (top right)
- iPhone: Settings → Wi-Fi
- Both should show same network name

### Step 3: Get MacBook Air IP Address

**On MacBook Air, open Terminal and run:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Note the IP address:** `192.168.4.148`
(Your IP may be different - use the one shown)

---

## 🍎 Shortcut 1: yellowCircle Menu ⭐ ESSENTIAL

**This is your main interface - create this one first!**

### Step-by-Step Instructions:

1. **Open Shortcuts app** on iPhone

2. **Tap the + button** (top right) to create new shortcut

3. **Tap "Add Action"**

4. **Search for "SSH"** in the search bar

5. **Select "Run Script Over SSH"**

6. **Configure the SSH action:**

   **Host:**
   ```
   192.168.4.148
   ```
   (Or tap "Ask Each Time" if IP changes frequently)

   **Port:**
   ```
   22
   ```

   **User:**
   ```
   christophercooper
   ```

   **Authentication:**
   - Tap "Authentication"
   - Select **"Password"**
   - Tap "Password" field
   - Enter your MacBook Air password
   - Tap "Done"

   **Script:**
   ```bash
   cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && export PATH=/usr/local/bin:$PATH && node iphone-menu.js
   ```

7. **Add output display:**
   - Tap "+" below the SSH action
   - Search for "Show Result"
   - Select "Show Result"
   - This will display the menu output

8. **Name your shortcut:**
   - Tap the shortcut name at top (default: "Run Script Over SSH")
   - Change to: **"yellowCircle Menu"**
   - Tap "Done"

9. **Customize icon (optional):**
   - Tap the shortcut icon/name in the list
   - Tap the icon at top
   - Choose a color (Yellow or Orange recommended)
   - Choose an icon (Terminal, Globe, or Gear recommended)
   - Tap "Done"

10. **Add to Home Screen (optional but recommended):**
    - Tap the ⋯ menu on the shortcut
    - Tap "Share"
    - Select "Add to Home Screen"
    - Name it "YC Menu"
    - Tap "Add"

### Test It:
- Tap the shortcut
- Should connect to MacBook Air
- Menu should display
- Type `q` to quit

✅ **If menu displays, you're successful!**

---

## ⚡ Shortcut 2: YC Rollback (Emergency Undo)

**Quick rollback for when you make a mistake**

### Step-by-Step:

1. **Create new shortcut** (+ button)

2. **Add "Run Script Over SSH"**

3. **Configure:**
   - Host: `192.168.4.148`
   - Port: `22`
   - User: `christophercooper`
   - Authentication: Password (same as before)
   - Script:
     ```bash
     cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && export PATH=/usr/local/bin:$PATH && node shortcut-router.js rollback
     ```

4. **Add "Show Result"** action below SSH action

5. **Name it:** "YC Rollback"

6. **Icon:** Red color, undo/back arrow icon

7. **Add to Home Screen** (recommended for emergency access)

### Test It:
- Tap shortcut
- Should execute rollback command
- Shows git revert output

---

## 📊 Shortcut 3: YC History (View Recent Changes)

**See what changes were made recently**

### Step-by-Step:

1. **Create new shortcut**

2. **Add "Run Script Over SSH"**

3. **Configure:**
   - Host: `192.168.4.148`
   - Port: `22`
   - User: `christophercooper`
   - Authentication: Password
   - Script:
     ```bash
     cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && export PATH=/usr/local/bin:$PATH && node shortcut-router.js history
     ```

4. **Add "Show Result"**

5. **Name it:** "YC History"

6. **Icon:** Blue color, list/document icon

### Test It:
- Tap shortcut
- Shows last 10 commits to globalContent.js
- Readable git log format

---

## 👀 Shortcut 4: YC View Config (Quick Viewer)

**Quickly view current configuration without menu**

### Step-by-Step:

1. **Create new shortcut**

2. **Add "Run Script Over SSH"**

3. **Configure:**
   - Host: `192.168.4.148`
   - Port: `22`
   - User: `christophercooper`
   - Authentication: Password
   - Script:
     ```bash
     cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && export PATH=/usr/local/bin:$PATH && node shortcut-router.js global --action=list
     ```

4. **Add "Show Result"**

5. **Name it:** "YC View Config"

6. **Icon:** Green color, eye/view icon

### Test It:
- Tap shortcut
- Shows complete configuration (header, footer, theme)
- JSON format

---

## 🎨 Optional: Advanced Shortcut with Input

**Create a shortcut that asks for input before editing**

### Example: "YC Edit Header Text"

1. **Create new shortcut**

2. **Add "Ask for Input"**
   - Prompt: "Enter new header text (part1):"
   - Input Type: Text
   - Default: (leave blank)

3. **Add "Run Script Over SSH"**
   - Host: `192.168.4.148`
   - Port: `22`
   - User: `christophercooper`
   - Authentication: Password
   - Script:
     ```bash
     cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && export PATH=/usr/local/bin:$PATH && node shortcut-router.js edit-header --field=part1 --value="[Provided Input]"
     ```
     (Note: Tap after `--value="` and select "Provided Input" from variables)

4. **Add "Show Result"**

5. **Name it:** "YC Edit Header Text"

6. **Icon:** Orange color, pencil/edit icon

### Test It:
- Tap shortcut
- Enter test text
- Should edit header and commit
- Use "YC Rollback" to undo if needed

---

## 📱 Organizing Your Shortcuts

### Recommended Home Screen Layout:

**yellowCircle Folder:**
- 🟡 YC Menu (main)
- 🔴 YC Rollback (emergency)
- 🔵 YC History (info)
- 🟢 YC View Config (info)

### Or Add to Widget:

1. Long press Home Screen
2. Tap "+" (top left)
3. Search "Shortcuts"
4. Choose widget size
5. Add widget
6. Tap widget to configure
7. Select your yellowCircle shortcuts

---

## 🔧 Troubleshooting

### "Host Authenticity Can't Be Verified"

**First time connecting, you'll see:**
```
The authenticity of host '192.168.4.148' can't be established.
Continue connecting?
```

**Tap "Continue"** - This is normal for first SSH connection

### "Connection Refused"

**Fix:**
- Verify Remote Login is ON (MacBook Air System Settings)
- Check both devices on same WiFi
- Verify IP address is correct
- Try using hostname instead: `Coopers-MacBook-Air.local`

### "node: command not found"

**Fix:**
Your script already includes `export PATH=/usr/local/bin:$PATH` which should fix this. If still fails, try:
```bash
/usr/local/bin/node iphone-menu.js
```

### "Permission denied (publickey,password)"

**Fix:**
- Verify password is correct
- Re-enter password in shortcut settings
- Make sure username is exact: `christophercooper` (no spaces)

### Script Output Cuts Off

**Fix:**
- Add "Show Result" action after SSH action
- Or add "Get Contents of" → "Show Result" to see full output
- Or use Scriptable app for better output viewing

### Menu Doesn't Display Correctly

**Fix:**
- Use landscape mode for better viewing
- Increase iOS text size (Settings → Display → Text Size)
- Install Termius or Blink Shell app for better terminal experience
- Connect external keyboard for easier typing

---

## 🎯 Testing Your Shortcuts

### Test 1: yellowCircle Menu
```
1. Tap "yellowCircle Menu" shortcut
2. Wait for connection (~2-3 seconds)
3. Menu should display
4. Type: 1 (Global Components)
5. Type: 4 (View Current Config)
6. Press Enter
7. Type: b (Back)
8. Type: q (Quit)
```
✅ Success if menu navigates smoothly

### Test 2: YC Rollback
```
1. Tap "YC Rollback" shortcut
2. Should show rollback confirmation
3. If nothing to rollback, shows "Already up to date"
```
✅ Success if executes without error

### Test 3: YC History
```
1. Tap "YC History" shortcut
2. Should show git log with commits
```
✅ Success if displays commit history

### Test 4: YC View Config
```
1. Tap "YC View Config" shortcut
2. Should show JSON with header/footer/theme
```
✅ Success if configuration displays

---

## 📊 Complete Setup Checklist

### Prerequisites
- [ ] MacBook Air Remote Login enabled
- [ ] Both devices on same WiFi
- [ ] Know MacBook Air IP address
- [ ] Have MacBook Air password

### Shortcuts Created
- [ ] yellowCircle Menu (main interface)
- [ ] YC Rollback (emergency undo)
- [ ] YC History (view changes)
- [ ] YC View Config (quick viewer)

### Optional
- [ ] Added shortcuts to Home Screen
- [ ] Created shortcuts folder
- [ ] Created widget
- [ ] Created advanced input shortcuts

### Testing
- [ ] Tested SSH connection
- [ ] Menu displays correctly
- [ ] Navigation works
- [ ] Can view config
- [ ] Rollback executes
- [ ] History displays

---

## 🎉 You're Done!

**You now have:**
- ✅ 4 working shortcuts
- ✅ One-tap access to yellowCircle automation
- ✅ Emergency rollback capability
- ✅ Quick config viewer
- ✅ Complete change history

**Next:** Try making a real edit using the menu!

---

## 📱 Quick Reference Card

**Save this for easy reference:**

### Connection Info
- Host: `192.168.4.148` or `Coopers-MacBook-Air.local`
- User: `christophercooper`
- Port: `22`
- Auth: Password

### Script Paths
```bash
# Menu
cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && export PATH=/usr/local/bin:$PATH && node iphone-menu.js

# Rollback
node shortcut-router.js rollback

# History
node shortcut-router.js history

# View Config
node shortcut-router.js global --action=list
```

### Shortcuts to Create
1. 🟡 yellowCircle Menu (essential)
2. 🔴 YC Rollback (important)
3. 🔵 YC History (useful)
4. 🟢 YC View Config (optional)

---

**Ready to create shortcuts? Start with #1 (yellowCircle Menu)!**
