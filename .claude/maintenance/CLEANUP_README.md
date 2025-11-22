# Disk Space Cleanup Guide

Generated: 2025-11-21

## 📊 Quick Stats

- **Current Usage:** 23GB / 228GB (68% capacity)
- **Primary Culprit:** ~/Library (68GB)
- **Potential Savings:** 35-40 GB
- **Safe to Execute:** Yes, with confirmations

---

## 🚀 How to Use

### Step 1: Preview (Recommended First)

Run the preview script to see what would be deleted WITHOUT actually deleting anything:

```bash
./cleanup_preview.sh
```

This will show you:
- Exactly what files/folders would be affected
- How much space each item is using
- Total potential savings

### Step 2: Run Cleanup

When ready, run the main cleanup script:

```bash
./cleanup_disk_space.sh
```

**Features:**
- ✅ Interactive - asks before deleting each category
- ✅ Safe - shows sizes and paths before deletion
- ✅ Tracked - reports total space reclaimed
- ✅ Colorful - easy to read output
- ✅ Reversible - deleted items go to Trash first

### Step 3: Manual Tasks

Some tasks require manual intervention:

#### Chrome Profile Cleanup (5-8 GB potential)
1. Open Chrome
2. Go to: `chrome://version/`
3. Note your "Profile Path" (this is your ACTIVE profile)
4. Settings → Profiles → Delete unused profiles

#### Check Storage Settings
```bash
# Open macOS Storage Management
# Apple menu → System Settings → General → Storage
```

---

## 📁 What Gets Cleaned

### Priority 1: High Impact (20+ GB)
- ✅ Browser caches (Chrome, Firefox, Edge) - **7.6 GB**
- ✅ Chrome profiles (unused) - **5-8 GB**
- ✅ Application containers (Slack, Teams) - **4 GB**
- ✅ Adobe caches - **3.4 GB**

### Priority 2: Developer Tools (2-3 GB)
- ✅ npm cache - **1.7 GB**
- ✅ Yarn cache - **339 MB**
- ✅ Playwright browsers - **725 MB**
- ✅ Old node_modules (email-dev) - **809 MB**

### Priority 3: Installers & Old Files (1-2 GB)
- ✅ Desktop .dmg files - **650 MB**
- ✅ Application updater caches - **1.2 GB**
- ✅ Steam (if unused) - **1 GB**

### Priority 4: System Caches
- ✅ ~/.cache directory
- ✅ Xcode Instruments data
- ✅ Misc updater caches

---

## ⚠️ Safety Notes

### WILL BE DELETED (Safe):
- ✅ Browser caches (rebuild automatically)
- ✅ npm/Yarn caches (rebuild on next install)
- ✅ Adobe caches (if not using Adobe apps)
- ✅ Installer DMG files (apps already installed)
- ✅ Application updater caches
- ✅ Temporary caches

### WILL NOT BE DELETED:
- ❌ Active project files (Yellow Circle)
- ❌ Your documents, photos, music
- ❌ Application settings/preferences
- ❌ Browser bookmarks, passwords, history
- ❌ Any files without explicit confirmation

### USE CAUTION:
- ⚠️ Chrome profiles (verify which is active)
- ⚠️ Slack/Teams containers (may contain cached data)
- ⚠️ Steam (only if you don't game)

---

## 🎯 Quick Manual Commands

If you prefer to run specific cleanups manually:

### Safe & Quick Wins
```bash
# Clear browser caches (7.6 GB)
rm -rf ~/Library/Caches/Google/Chrome/*
rm -rf ~/Library/Caches/Firefox/*
rm -rf ~/Library/Caches/Microsoft\ Edge/*

# Clear npm cache (1.7 GB)
npm cache clean --force

# Delete desktop installers
rm ~/Desktop/*.dmg ~/Desktop/*.pkg

# Clear Adobe caches (3.4 GB)
rm -rf ~/Library/Caches/Adobe/*

# Clear updater caches
rm -rf ~/Library/Caches/com.teamviewer.TeamViewer
rm -rf ~/Library/Caches/com.tinyspeck.slackmacgap.ShipIt
rm -rf ~/Library/Caches/termius-updater
```

### Developer-Specific
```bash
# Clear Yarn cache
rm -rf ~/Library/Caches/Yarn

# Remove old email-dev project (if inactive)
rm -rf ~/email-dev

# Clear Playwright browsers
rm -rf ~/Library/Caches/ms-playwright
```

---

## 📈 Monitoring

### Check Current Disk Usage
```bash
# Overall disk space
df -h /

# Library directory size
du -sh ~/Library

# Largest directories in Library
du -sh ~/Library/* | sort -hr | head -20

# Browser cache sizes
du -sh ~/Library/Caches/Google ~/Library/Caches/Firefox ~/Library/Caches/Microsoft\ Edge
```

### Find Large Files
```bash
# Files over 100MB in Library
find ~/Library -type f -size +100M -exec ls -lh {} \; | awk '{print $5, $9}' | sort -hr | head -20

# All node_modules directories
find ~ -name "node_modules" -type d -prune -exec du -sh {} \;
```

---

## 🔄 Maintenance Schedule

### Monthly
- Run browser cache cleanup
- Clear npm/Yarn caches
- Delete desktop installers

### Quarterly
- Full cleanup script run
- Review Chrome profiles
- Check for old projects

### Annually
- Deep storage audit
- Review application data
- Archive old projects to external drive

---

## 🆘 Troubleshooting

### Script won't run
```bash
# Make executable
chmod +x cleanup_disk_space.sh cleanup_preview.sh

# Run from home directory
cd ~
./cleanup_disk_space.sh
```

### "Permission denied" errors
Some system directories require elevated permissions. The script only touches user-accessible files. For system-level cleanup, use:
- macOS Storage Management (System Settings)
- Disk Utility
- Manual `sudo` commands (use with caution)

### Accidentally deleted something
1. Check Trash: `open ~/.Trash`
2. Restore from Trash before emptying
3. Check Time Machine backups if available

### Want to exclude something
Edit the script and comment out the specific cleanup function:
```bash
# cleanup_browser_caches  # Skip this
cleanup_adobe_caches      # Run this
```

---

## 📝 Files Created

1. **cleanup_disk_space.sh** - Main interactive cleanup script
2. **cleanup_preview.sh** - Dry-run preview (no deletions)
3. **CLEANUP_README.md** - This guide

---

## 🎓 Understanding the Problem

Your disk shows:
- **228GB capacity**
- **23GB used** (only 10%)
- **11GB available** (!)

This discrepancy is common on macOS and can be caused by:
1. **Snapshots** - Time Machine local snapshots
2. **Purgeable space** - Files macOS will delete if needed
3. **System files** - Hidden OS data

To check:
```bash
# See breakdown including purgeable
diskutil apfs list

# Check for snapshots
tmutil listlocalsnapshots /
```

The cleanup script focuses on **user-accessible** files. For system-level issues, use macOS built-in tools.

---

## 📞 Need Help?

1. Run preview script first: `./cleanup_preview.sh`
2. Review this README
3. Script asks for confirmation at every step
4. Items go to Trash first (can be restored)

**Remember:** When in doubt, skip it! You can always run the script again.

---

**Happy Cleaning! 🧹**
