# Mac Mini Disk Maintenance System

**Generated:** 2025-11-21
**Purpose:** Automated disk cleanup and maintenance for Mac Mini
**Location:** `.claude/maintenance/`

---

## 🎯 Overview

This maintenance system provides automated disk cleanup tools specifically designed for the Mac Mini. It safely removes browser caches, developer tool caches, and other temporary files that accumulate over time.

### Results from Nov 21, 2025 Cleanup:
- **Before:** 11 GB available
- **After:** 35 GB available
- **Reclaimed:** 24 GB (218% increase)

---

## 📁 Files in `.claude/maintenance/`

1. **`cleanup_disk_space.sh`** (11 KB)
   - Interactive cleanup script
   - Asks for confirmation before each deletion
   - Tracks space reclaimed
   - Safe and reversible

2. **`cleanup_preview.sh`** (4.9 KB)
   - Dry-run preview mode
   - Shows what would be deleted WITHOUT deleting
   - Always run this first

3. **`CLEANUP_README.md`** (6.2 KB)
   - Complete documentation
   - Manual commands
   - Troubleshooting guide

4. **`QUICKSTART_CLEANUP.txt`** (6.6 KB)
   - Quick reference guide
   - Fast commands for common cleanups

---

## 🚀 Quick Start

### From Project Root:
```bash
cd .claude/maintenance

# Preview what will be cleaned
./cleanup_preview.sh

# Run interactive cleanup
./cleanup_disk_space.sh
```

### Quick Manual Cleanup (Safe):
```bash
# Browser caches (7-8 GB)
rm -rf ~/Library/Caches/Google/Chrome/*
rm -rf ~/Library/Caches/Firefox/*
rm -rf ~/Library/Caches/Microsoft\ Edge/*

# Developer caches (2-3 GB)
npm cache clean --force
rm -rf ~/Library/Caches/Yarn
rm -rf ~/.cache

# Adobe caches (3-4 GB)
rm -rf ~/Library/Caches/Adobe/*

# Desktop installers
rm ~/Desktop/*.dmg ~/Desktop/*.pkg
```

---

## 📊 What Gets Cleaned

### Priority 1: Browser Caches (7-8 GB)
- Chrome cache: ~4.4 GB
- Firefox cache: ~2.5 GB
- Edge cache: ~1.2 GB

**Safety:** ✅ Safe to delete - rebuilds automatically
**Impact:** ✅ High - large space savings
**Frequency:** Monthly

### Priority 2: Developer Caches (2-3 GB)
- npm cache: ~1.7 GB
- Yarn cache: ~339 MB
- ~/.cache: ~1.5 GB
- Playwright browsers: ~725 MB

**Safety:** ✅ Safe to delete - rebuilds on next install
**Impact:** ✅ High - frees developer tool space
**Frequency:** Monthly

### Priority 3: Adobe Caches (3-4 GB)
- After Effects: ~2.3 GB
- Other Adobe apps: ~1.1 GB

**Safety:** ⚠️ Safe if not actively using Adobe
**Impact:** ✅ High - if Adobe is inactive
**Frequency:** Quarterly

### Priority 4: Application Caches (1-2 GB)
- TeamViewer: ~552 MB
- Slack updater: ~400 MB
- Other updaters: ~300 MB

**Safety:** ✅ Safe to delete
**Impact:** ✅ Medium
**Frequency:** Quarterly

### Priority 5: Desktop Installers (500 MB - 1 GB)
- .dmg files
- .pkg files

**Safety:** ✅ Safe after apps are installed
**Impact:** ✅ Medium
**Frequency:** After installing new software

---

## 🗓️ Recommended Maintenance Schedule

### Monthly (1st of month):
```bash
# Run during low-activity periods
cd .claude/maintenance
./cleanup_preview.sh
./cleanup_disk_space.sh
```

**Cleans:**
- Browser caches
- npm/Yarn caches
- Desktop installers
- Updater caches

**Expected Savings:** 10-15 GB

### Quarterly (Jan 1, Apr 1, Jul 1, Oct 1):
```bash
# Deep cleanup including Adobe
cd .claude/maintenance
./cleanup_disk_space.sh
# Answer "yes" to all prompts including Adobe
```

**Cleans:**
- All monthly items
- Adobe caches (if inactive)
- Steam (if not gaming)
- Old project node_modules

**Expected Savings:** 15-25 GB

### As Needed:
- After installing new applications (delete .dmg files)
- When disk space warning appears
- Before major OS updates

---

## ⚠️ What NOT to Clean

### Protected Items:
- ❌ Active project files (Yellow Circle)
- ❌ Chrome profiles (without verification)
- ❌ Documents, photos, music
- ❌ Application settings/preferences
- ❌ Browser bookmarks, passwords, history

### Manual Review Required:
- ⚠️ Chrome profiles (verify active profile first)
- ⚠️ Slack/Teams containers (may contain cached data)
- ⚠️ Steam installation (only if not gaming)
- ⚠️ Old projects in ~/email-dev or similar

---

## 🔧 Integration with Multi-Machine Framework

### Mac Mini Specific:
This maintenance system is **Mac Mini only** because:
1. Mac Mini is the primary development machine
2. Mac Mini has more accumulated cache data
3. MacBook Air uses different storage patterns

### Synced via Dropbox:
- Scripts are in `.claude/maintenance/`
- Synced automatically via Dropbox
- Available on Mac Mini immediately
- NOT recommended for MacBook Air (different disk setup)

### Version Control:
```bash
# After running cleanup, update instance log
cd /path/to/yellow-circle
# Edit .claude/INSTANCE_LOG_MacMini.md
# Add entry about disk cleanup performed
git add .claude/
git commit -m "Update: Mac Mini disk cleanup - [date]"
git push
```

---

## 📈 Monitoring Disk Usage

### Check Current Status:
```bash
# Overall disk space
df -h /

# Library directory (main culprit)
du -sh ~/Library

# Largest cache directories
du -sh ~/Library/Caches/* | sort -hr | head -20
```

### Watch for Warnings:
- **< 20 GB free:** Run monthly cleanup
- **< 10 GB free:** Run full cleanup immediately
- **< 5 GB free:** Emergency cleanup + manual review

### After Cleanup:
```bash
# Verify space reclaimed
df -h /

# Empty Trash to finalize
# Finder: Cmd+Shift+Delete

# Restart Mac for optimal performance
sudo shutdown -r now
```

---

## 🔄 Automation Potential

### Future Enhancement:
Create monthly automated cleanup using the automation framework:

```bash
# .claude/automation/monthly-cleanup.sh (future)
#!/bin/bash
# Run on 1st of each month
cd .claude/maintenance
./cleanup_disk_space.sh --auto-browser-caches
```

### Integration with Alerts:
Could be integrated with `.claude/automation/alerts/`:
- Disk space warning alerts
- Automatic cleanup suggestions
- Post-cleanup reports

---

## 📝 Session Notes Template

When running cleanup, add to `.claude/INSTANCE_LOG_MacMini.md`:

```markdown
### Session [Date] - Disk Maintenance

**Task:** Monthly disk cleanup

**Actions:**
- Ran `.claude/maintenance/cleanup_preview.sh`
- Executed `.claude/maintenance/cleanup_disk_space.sh`
- Cleared: [list items]

**Results:**
- Before: [X] GB available
- After: [Y] GB available
- Reclaimed: [Z] GB

**Next Cleanup:** [Date + 1 month]
```

---

## 🆘 Troubleshooting

### Script Won't Run:
```bash
# Make executable
chmod +x .claude/maintenance/*.sh
```

### Permission Denied:
- Scripts only touch user-accessible files
- For system-level cleanup, use macOS Storage Management
- No sudo required for normal operation

### Accidentally Deleted Something:
1. Check Trash: `open ~/.Trash`
2. Restore from Trash before emptying
3. Check Dropbox version history (if synced files)
4. Check Time Machine backups

### Want to Exclude Something:
Edit `cleanup_disk_space.sh` and comment out the function:
```bash
# cleanup_adobe_caches  # Skip this
cleanup_browser_caches  # Run this
```

---

## 📊 Historical Performance

### Nov 21, 2025 Initial Cleanup:

**Cleaned:**
- Chrome cache: 4.4 GB
- Firefox cache: 2.5 GB
- Edge cache: 1.2 GB
- Adobe caches: 3.4 GB
- npm cache: 1.7 GB
- Yarn cache: 339 MB
- ~/.cache: 1.5 GB
- Updaters: 1.2 GB
- Desktop installers: 650 MB

**Total:** ~16.9 GB direct + ~7 GB system cleanup = **24 GB reclaimed**

**Time:** ~5 minutes
**User Impact:** None (caches rebuild transparently)

---

## 🔗 Related Documentation

- `.claude/INSTANCE_LOG_MacMini.md` - Mac Mini session history
- `.claude/MULTI_ENVIRONMENT_SYNC_GUIDE.md` - Sync framework
- `.claude/verify-sync.sh` - Sync verification tool

---

## ✅ Pre-Session Checklist

Before each cleanup session:

- [ ] Verify sync status: `./.claude/verify-sync.sh`
- [ ] Check current disk usage: `df -h /`
- [ ] Close all browsers (for cache cleanup)
- [ ] Preview first: `./cleanup_preview.sh`
- [ ] Run cleanup: `./cleanup_disk_space.sh`
- [ ] Empty Trash after completion
- [ ] Update instance log
- [ ] Commit changes to git

---

## 💡 Tips

1. **Best Time:** Run during lunch or break periods
2. **Browser Behavior:** Browsers may be slow on first launch (rebuilding cache)
3. **npm/Yarn:** Next install will rebuild cache (takes 30-60s longer)
4. **Frequency:** Monthly is optimal (prevents excessive accumulation)
5. **Monitoring:** Set calendar reminder for 1st of month
6. **Emergency:** If < 5GB free, use Quick Manual Cleanup commands

---

**Maintenance System Status:** ✅ Active
**Last Updated:** 2025-11-21
**Next Scheduled Cleanup:** 2025-12-01
**Responsible:** Mac Mini only (not MacBook Air)
