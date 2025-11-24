# 📱 iPhone Quick Start - yellowCircle Automation

**MacBook Air Connection Info:**
- **IP Address:** `192.168.4.148`
- **Hostname:** `Coopers-MacBook-Air.local`
- **Username:** `christophercooper`
- **SSH Command:** `ssh christophercooper@192.168.4.148`

---

## 🚀 Quick Test (5 Minutes)

### Step 1: Connect from iPhone
```bash
ssh christophercooper@192.168.4.148
# Enter password when prompted
```

### Step 2: Launch Menu
```bash
cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
node iphone-menu.js
```

### Step 3: Try View Config (Safe - Read Only)
```
1. Type: 1 (Global Components)
2. Type: 4 (View Current Config)
3. Review output
4. Press Enter
5. Type: b (Back)
6. Type: q (Quit)
```

**If this works, you're ready for full testing!**

---

## 🎯 Safe Test Commands

**View current header:**
```bash
node shortcut-router.js global --action=list --component=header
```

**Preview a change (doesn't apply):**
```bash
node shortcut-router.js edit-header --field=part1 --value="TEST" --preview
```

**View history:**
```bash
node shortcut-router.js history
```

---

## ⚡ Apple Shortcuts - Copy/Paste Ready

### Shortcut: "yellowCircle Menu"

**Action:** Run Script Over SSH

**Settings:**
- Host: `192.168.4.148` or `Coopers-MacBook-Air.local`
- Port: `22`
- User: `christophercooper`
- Authentication: Password

**Script:**
```bash
cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && export PATH=/usr/local/bin:$PATH && node iphone-menu.js
```

---

### Shortcut: "YC Rollback"

**Action:** Run Script Over SSH

**Settings:**
- Host: `192.168.4.148`
- User: `christophercooper`

**Script:**
```bash
cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && export PATH=/usr/local/bin:$PATH && node shortcut-router.js rollback
```

---

### Shortcut: "YC History"

**Action:** Run Script Over SSH

**Settings:**
- Host: `192.168.4.148`
- User: `christophercooper`

**Script:**
```bash
cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && export PATH=/usr/local/bin:$PATH && node shortcut-router.js history
```

---

## 🐛 Common Issues

**"node: command not found"**
→ Add `export PATH=/usr/local/bin:$PATH &&` before node command

**"Permission denied"**
→ Run: `chmod +x ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation/iphone-menu.js`

**"Connection refused"**
→ Enable Remote Login: System Settings → Sharing → Remote Login ON

**Can't see menu clearly**
→ Use landscape mode or SSH app with bigger font (Termius)

---

## ✅ Testing Checklist

**Quick Test (5 min):**
- [ ] SSH connection works
- [ ] Menu displays
- [ ] Can view config
- [ ] Can quit menu

**Full Test (15 min):**
- [ ] Preview mode works
- [ ] Can make edit
- [ ] Change appears on site
- [ ] Rollback works

**Production Setup:**
- [ ] Create "yellowCircle Menu" shortcut
- [ ] Create "YC Rollback" shortcut
- [ ] Test shortcuts work
- [ ] Add to Home Screen

---

**Next:** See `IPHONE_TESTING_GUIDE.md` for complete testing procedure
