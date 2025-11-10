# Mac Mini: Slash Commands Not Appearing - Quick Fix

**Issue:** Mac Mini doesn't see new `/roadmap` slash command
**Cause:** Claude Code caches command definitions, needs restart
**Solution:** Just restart Claude Code (files already synced via Dropbox)

---

## ✅ Quick Fix (30 seconds)

**On Mac Mini:**

1. **Verify files are synced** (they should be - Dropbox is automatic)
   ```bash
   cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/
   ls -lh .claude/commands/roadmap.md
   # Should show: Nov  9 21:01 (or later)
   ```

2. **Restart Claude Code**
   - Press `Cmd+Q` to fully quit Claude Code
   - Reopen Claude Code
   - Wait for it to fully load

3. **Test slash command**
   - Type `/` in Claude Code
   - Look for `/roadmap` in dropdown
   - Select and test

**That's it!** Dropbox already synced the files. Claude Code just needed to reload.

---

## 📊 How Sync Actually Works

### **Mac Mini ← Dropbox ← MacBook Air** (10-30 seconds automatic)

**Timeline:**
1. MacBook Air: Save file at 21:01
2. Dropbox: Upload to cloud (instant)
3. Mac Mini: Download from cloud (10-30 seconds)
4. **Files are synced** ✅

**Problem:** Claude Code doesn't auto-reload commands from disk
**Solution:** Manual restart triggers reload

---

## 🔍 Verification

**After restarting Claude Code on Mac Mini:**

```bash
# Type / in Claude Code
# Should see:
/roadmap
/trimurti
/trimurti-roadmap
/yc-roadmap

# All redirect to the same roadmap.md file
```

---

## ❌ What You DON'T Need to Do

**DON'T run git pull** (files already synced via Dropbox)
**DON'T copy files manually** (Dropbox handles it)
**DON'T wait longer** (30 seconds is enough for Dropbox)

**DO restart Claude Code** (only thing needed to reload commands)

---

## 🎯 Understanding the Sync Priority

**For Mac-to-Mac work:**

1. **PRIMARY: Dropbox** ✅ Automatic (10-30 seconds)
   - MacBook Air saves file
   - Dropbox syncs to cloud
   - Mac Mini gets file automatically
   - **No commands needed**

2. **SECONDARY: Google Drive** (Backup + Rho)
   - Automatic backup
   - Rho projects
   - Not for real-time sync

3. **TERTIARY: GitHub** (Version Control)
   - Push after significant work
   - For version control history
   - Required for Codespaces/Web/remote access
   - **Not needed for Mac-to-Mac**

---

## 🚨 If Still Not Working

**If slash commands still don't appear after restart:**

1. **Verify Dropbox path:**
   ```bash
   pwd
   # Should be: ~/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/
   ```

2. **Check file actually synced:**
   ```bash
   head -20 .claude/commands/roadmap.md
   # Should see: "Verify Sync Status (CRITICAL - DO FIRST)"
   ```

3. **Check Claude Code project directory:**
   - Look at status bar in Claude Code
   - Should show correct project path
   - If wrong, use File → Open Folder

4. **Last resort - full reload:**
   ```bash
   # Quit Claude Code
   # Clear cache (optional)
   rm -rf ~/Library/Caches/claude-code/
   # Reopen Claude Code
   ```

---

## ✅ Expected Result

**After restart, `/roadmap` command should:**
- ✅ Appear in slash command dropdown
- ✅ Run `./.claude/verify-sync.sh` first
- ✅ Show sync status before roadmap
- ✅ Display current roadmap priorities
- ✅ Offer options: Check/Add/Continue/Update/Adjust

---

**Last Updated:** November 9, 2025
**Files Synced:** Via Dropbox (automatic)
**Solution:** Just restart Claude Code on Mac Mini
