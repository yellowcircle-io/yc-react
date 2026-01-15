# Cross-Machine Disk Maintenance & Archival System

**Created:** 2026-01-15
**Purpose:** Unified disk cleanup and archival process for all machines
**Machines:** MacBook Air, Mac Mini
**Last Verified:** MacBook Air (Jan 15, 2026)

---

## Overview

This document provides a **replicable process** for disk cleanup and data archival across all machines in the Yellow Circle multi-machine framework. Each machine may have different external drives, but the process remains consistent.

### Key Principles
1. **Preview before execution** - Always dry-run first
2. **Archive before deletion** - Compress and backup data to external storage
3. **Document the process** - Update instance logs after each cleanup
4. **Machine-specific paths** - External drives vary by machine

---

## Machine Configuration

### MacBook Air
| Setting | Value |
|---------|-------|
| **Hostname** | Christophers-Air |
| **Primary External Drive** | ORICO (477 GB) |
| **Mount Path** | `/Volumes/ORICO` |
| **Archive Directory** | `/Volumes/ORICO/Mac-Archives/` |
| **Last Cleanup** | 2026-01-15 |
| **Result** | 10 GB → 46 GB available (+35 GB) |

### Mac Mini
| Setting | Value |
|---------|-------|
| **Hostname** | Christophers-Mac-mini |
| **Primary External Drive** | `[TO BE CONFIGURED]` |
| **Mount Path** | `/Volumes/[DRIVE_NAME]` |
| **Archive Directory** | `/Volumes/[DRIVE_NAME]/Mac-Archives/` |
| **Last Cleanup** | 2025-11-21 (cache only) |
| **Result** | 11 GB → 35 GB available |

---

## Phase 1: Cache Cleanup (Quick Wins)

### Step 1.1: Check Current Status
```bash
# Check available space
df -h /

# Check Library size (main culprit)
du -sh ~/Library

# Find largest cache directories
du -sh ~/Library/Caches/* | sort -hr | head -15
```

### Step 1.2: Run Preview Script
```bash
cd ~/.claude/maintenance 2>/dev/null || cd ~/
./cleanup_preview.sh
```

If preview script doesn't exist, continue manually.

### Step 1.3: Safe Cache Cleanup (No Data Loss)

These commands clear caches that rebuild automatically:

```bash
# Browser caches (typically 3-8 GB)
rm -rf ~/Library/Caches/Google/Chrome/*
rm -rf ~/Library/Caches/Firefox/*
rm -rf ~/Library/Caches/Microsoft\ Edge/*

# Developer caches (typically 2-4 GB)
rm -rf ~/.npm
rm -rf ~/Library/Caches/Yarn
rm -rf ~/Library/Caches/ms-playwright

# Application logs (typically 2-3 GB)
rm -rf ~/Library/Logs/CreativeCloud
rm -rf ~/Library/Logs/Adobe
rm -rf ~/Library/Logs/zoom.us

# Adobe caches (typically 1-3 GB)
rm -rf ~/Library/Caches/Adobe/*

# Updater caches
rm -rf ~/Library/Caches/com.teamviewer.TeamViewer
rm -rf ~/Library/Caches/com.tinyspeck.slackmacgap.ShipIt
rm -rf ~/Library/Caches/termius-updater
rm -rf ~/Library/Application\ Support/Caches/clickup-desktop-updater
rm -rf ~/Library/Application\ Support/Caches/notion-updater

# Desktop installers
rm -f ~/Desktop/*.dmg ~/Desktop/*.pkg
```

### Step 1.4: Verify Quick Cleanup
```bash
df -h /
# Should see 5-15 GB reclaimed
```

---

## Phase 2: Chrome Profile Management

Chrome profiles can consume 5-15 GB. This phase helps identify and archive unused profiles.

### Step 2.1: List Profiles with Details
```bash
for profile in ~/Library/Application\ Support/Google/Chrome/Profile\ * ~/Library/Application\ Support/Google/Chrome/Default; do
  if [ -d "$profile" ]; then
    name=$(basename "$profile")
    size=$(du -sh "$profile" 2>/dev/null | cut -f1)
    prefs="$profile/Preferences"
    if [ -f "$prefs" ]; then
      friendly_name=$(python3 -c "import json; d=json.load(open('$prefs')); print(d.get('profile',{}).get('name','Unknown'))" 2>/dev/null || echo "Unknown")
      account=$(python3 -c "import json; d=json.load(open('$prefs')); print(d.get('account_info',[{}])[0].get('email','No account'))" 2>/dev/null || echo "No account")
    else
      friendly_name="Unknown"
      account="No account"
    fi
    last_used=$(stat -f "%Sm" -t "%Y-%m-%d" "$prefs" 2>/dev/null || echo "unknown")
    echo "$size | $name | $friendly_name | $account | $last_used"
  fi
done
```

### Step 2.2: Identify Active Profile
1. Open Chrome
2. Navigate to `chrome://version/`
3. Note the "Profile Path" - this is your ACTIVE profile
4. Do NOT delete the active profile

### Step 2.3: Archive Inactive Profiles

**IMPORTANT:** Close Chrome before archiving!

```bash
# Close Chrome
osascript -e 'quit app "Google Chrome"'
sleep 2

# Set external drive path (MACHINE-SPECIFIC)
# MacBook Air:
EXTERNAL_DRIVE="/Volumes/ORICO"
# Mac Mini:
# EXTERNAL_DRIVE="/Volumes/[YOUR_DRIVE_NAME]"

# Create backup directory
mkdir -p "$EXTERNAL_DRIVE/Chrome-Profile-Backups"

# Archive a profile (replace PROFILE_NUMBER and FRIENDLY_NAME)
cd ~/Library/Application\ Support/Google/Chrome
tar -czf "$EXTERNAL_DRIVE/Chrome-Profile-Backups/Profile_[NUMBER]_[FRIENDLY_NAME]_$(date +%Y-%m-%d).tar.gz" "Profile [NUMBER]"

# Delete original after successful archive
rm -rf "Profile [NUMBER]"
```

### Step 2.4: Example Archive Commands (MacBook Air - Jan 2026)
```bash
# These profiles were archived to ORICO:
# Profile 3 (DoorDash) - 2.1 GB - last used 2024-08-04
# Profile 5 (Archive) - 48 MB - no account
# Profile 6 (Estee Lauder) - 3.4 GB - last used 2025-01-04
# Profile 7 (Rho old) - 254 MB - superseded by Profile 8
# Profile 8 (Rho) - 1.5 GB - superseded
# Profile 9 (yellowcircle.io) - 1.0 GB - last used 2025-12-01
```

---

## Phase 3: Application Data Archival

Large application data that's not actively used can be archived to external storage.

### Step 3.1: Identify Large Application Data
```bash
# Application Support (typically 20-40 GB)
du -sh ~/Library/Application\ Support/* 2>/dev/null | sort -hr | head -15

# Group Containers (typically 5-15 GB)
find ~/Library/Group\ Containers -maxdepth 1 -type d -exec du -sh {} \; 2>/dev/null | sort -hr | head -10

# Containers (typically 5-10 GB)
du -sh ~/Library/Containers/* 2>/dev/null | sort -hr | head -10
```

### Step 3.2: Archive Large Application Data

**Set external drive path first:**
```bash
# MacBook Air:
EXTERNAL_DRIVE="/Volumes/ORICO"
# Mac Mini:
# EXTERNAL_DRIVE="/Volumes/[YOUR_DRIVE_NAME]"

# Create archive directories
mkdir -p "$EXTERNAL_DRIVE/Mac-Archives/Application-Data"
mkdir -p "$EXTERNAL_DRIVE/Mac-Archives/Documents"
mkdir -p "$EXTERNAL_DRIVE/Mac-Archives/Backups-Keep-Original"
```

### Step 3.3: Common Archive Candidates

| Application | Typical Size | Safe to Archive? | Notes |
|-------------|--------------|------------------|-------|
| Adobe Support | 3-5 GB | Yes, if not using Adobe | Preferences preserved |
| Firefox Data | 2-3 GB | Yes, if Chrome is primary | Will need reinstall |
| Airmail Data | 5-15 GB | Yes, if not using Airmail | Email client cache |
| Microsoft Data | 1-2 GB | Yes, if not using Office | Office app data |
| Amazon Luna | 500 MB | Yes, if not gaming | Cloud gaming data |
| Steam | 1+ GB | Yes, if not gaming | Can reinstall |
| Wallpaper Cache | 1 GB | Yes | Rebuilds automatically |

### Step 3.4: Archive Commands Template
```bash
# Archive Application Support item
cd ~/Library/Application\ Support
tar -czf "$EXTERNAL_DRIVE/Mac-Archives/Application-Data/[APP_NAME]_$(date +%Y-%m-%d).tar.gz" "[APP_FOLDER]"
rm -rf "[APP_FOLDER]"

# Archive Group Container item
cd ~/Library/Group\ Containers
tar -czf "$EXTERNAL_DRIVE/Mac-Archives/Application-Data/[APP_NAME]_$(date +%Y-%m-%d).tar.gz" "[CONTAINER_ID]"
rm -rf "[CONTAINER_ID]"
```

### Step 3.5: MacBook Air Archives (Jan 2026 Reference)
```bash
# Successfully archived to ORICO:
# - Airmail (11 GB) → 4.0 GB compressed
# - Adobe Support (4.8 GB) → 2.9 GB compressed
# - Firefox (2.7 GB) → 1.7 GB compressed
# - Microsoft (1.7 GB) → 761 MB compressed
# - Wallpaper (1.0 GB) → 1.0 GB compressed
# - Amazon Luna (590 MB) → 8.7 MB compressed
```

---

## Phase 4: Document & Media Archival

### Step 4.1: Identify Large Files
```bash
# Files over 100MB
find ~ -type f -size +100M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -hr | head -20

# Documents folder
du -sh ~/Documents/*
```

### Step 4.2: Archive Documents
```bash
# Archive entire Documents folder
cd ~
tar -czf "$EXTERNAL_DRIVE/Mac-Archives/Documents/Documents_Archive_$(date +%Y-%m-%d).tar.gz" Documents

# Or move specific large files
mv ~/Documents/LargeFile.wav "$EXTERNAL_DRIVE/Mac-Archives/Documents/"
```

---

## Phase 5: Backup Critical Data (Keep Originals)

Some data should be backed up but NOT deleted from the machine.

### Step 5.1: Identify Backup Candidates
- Active project folders
- Photos Library
- Notion data (if actively used)
- Other critical work files

### Step 5.2: Create Backup Copies
```bash
# Backup without deleting original
cd ~
tar -czf "$EXTERNAL_DRIVE/Mac-Archives/Backups-Keep-Original/[FOLDER_NAME]_$(date +%Y-%m-%d).tar.gz" "[FOLDER_NAME]"
# DO NOT delete original
```

### Step 5.3: MacBook Air Backups (Jan 2026 Reference)
```bash
# Backed up to ORICO (originals kept):
# - yellowcircle-redesign (1.8 GB) → 1.2 GB compressed
# - Photos Library (2.4 GB) → 1.7 GB compressed
# - Notion data (2.3 GB) → 1.3 GB compressed
```

---

## Phase 6: Restore Process

### Restore Application Data
```bash
cd ~/Library/Application\ Support
tar -xzf "/Volumes/[DRIVE]/Mac-Archives/Application-Data/[APP_NAME]_[DATE].tar.gz"
```

### Restore Chrome Profile
```bash
cd ~/Library/Application\ Support/Google/Chrome
tar -xzf "/Volumes/[DRIVE]/Chrome-Profile-Backups/Profile_[NUMBER]_[NAME]_[DATE].tar.gz"
# Restart Chrome
```

### Restore Documents
```bash
cd ~
tar -xzf "/Volumes/[DRIVE]/Mac-Archives/Documents/Documents_Archive_[DATE].tar.gz"
```

---

## Machine-Specific Checklists

### MacBook Air Cleanup Checklist
- [ ] Connect ORICO external drive
- [ ] Verify mount: `ls /Volumes/ORICO`
- [ ] Run Phase 1 (cache cleanup)
- [ ] Run Phase 2 (Chrome profiles) if needed
- [ ] Run Phase 3 (application archival) if needed
- [ ] Verify disk space: `df -h /`
- [ ] Update `.claude/INSTANCE_LOG_MacBookAir.md`
- [ ] Commit changes to git

### Mac Mini Cleanup Checklist
- [ ] Connect external drive (name: `_____________`)
- [ ] Verify mount: `ls /Volumes/[DRIVE_NAME]`
- [ ] Set `EXTERNAL_DRIVE` variable
- [ ] Run Phase 1 (cache cleanup)
- [ ] Run Phase 2 (Chrome profiles) if needed
- [ ] Run Phase 3 (application archival) if needed
- [ ] Verify disk space: `df -h /`
- [ ] Update `.claude/INSTANCE_LOG_MacMini.md`
- [ ] Commit changes to git

---

## Expected Results

### Phase 1 Only (Cache Cleanup)
- **Time:** 5-10 minutes
- **Expected Savings:** 10-20 GB
- **Risk:** None (caches rebuild)

### Full Cleanup (All Phases)
- **Time:** 30-60 minutes
- **Expected Savings:** 25-50 GB
- **Risk:** Low (archived data recoverable)

---

## Archive Directory Structure

```
/Volumes/[EXTERNAL_DRIVE]/
├── Chrome-Profile-Backups/
│   ├── Profile_3_DoorDash_2026-01-15.tar.gz
│   ├── Profile_6_Estee_Lauder_2026-01-15.tar.gz
│   └── ...
└── Mac-Archives/
    ├── Application-Data/
    │   ├── Adobe_AppSupport_2026-01-15.tar.gz
    │   ├── Airmail_2026-01-15.tar.gz
    │   ├── Firefox_2026-01-15.tar.gz
    │   └── ...
    ├── Documents/
    │   ├── Documents_Archive_2026-01-15.tar.gz
    │   ├── Dropbox_OLD_FULL_BACKUP_2025-11-09.tar.gz
    │   └── ...
    └── Backups-Keep-Original/
        ├── PhotosLibrary_2026-01-15.tar.gz
        ├── Notion_2026-01-15.tar.gz
        └── yellowcircle-redesign_2026-01-15.tar.gz
```

---

## Warning Signs (When to Run Cleanup)

| Available Space | Action |
|-----------------|--------|
| > 30 GB | Normal - no action needed |
| 20-30 GB | Consider Phase 1 cleanup |
| 10-20 GB | Run Phase 1 cleanup |
| < 10 GB | Run full cleanup (all phases) |
| < 5 GB | **URGENT** - Run immediately |

---

## Related Documentation

- `.claude/MAC_MINI_DISK_MAINTENANCE.md` - Original Mac Mini cleanup scripts
- `.claude/maintenance/` - Cleanup scripts directory
- `.claude/INSTANCE_LOG_MacBookAir.md` - MacBook Air session history
- `.claude/INSTANCE_LOG_MacMini.md` - Mac Mini session history

---

## Cleanup History

### MacBook Air - 2026-01-15
- **Before:** 10 GB available (70% capacity)
- **After:** 46 GB available (34% capacity)
- **Reclaimed:** 35 GB
- **External Drive:** ORICO
- **Actions:**
  - Phase 1: Deleted logs (2.7 GB)
  - Phase 2: Archived 6 Chrome profiles (8.3 GB)
  - Phase 3: Archived Airmail, Adobe, Firefox, Microsoft, Wallpaper, Amazon Luna (~22 GB)
  - Phase 4: Archived Documents and media (~5 GB)
  - Phase 5: Backed up yellowcircle-redesign, Photos, Notion (copies only)

### Mac Mini - 2025-11-21
- **Before:** 11 GB available
- **After:** 35 GB available
- **Reclaimed:** 24 GB
- **Actions:** Cache cleanup only (Phase 1)
- **Note:** Full archival process not yet performed

---

## Next Steps for Mac Mini

When running cleanup on Mac Mini:

1. **Identify external drive** - Name and mount path
2. **Update this document** - Fill in Mac Mini configuration section
3. **Run Phase 1** - Cache cleanup (immediate space)
4. **Evaluate Phase 2-5** - Based on disk analysis
5. **Update instance log** - Document results
6. **Sync to Dropbox** - Wait 30 seconds for sync

---

**Document Status:** Active
**Last Updated:** 2026-01-15
**Maintainer:** YC-MSF (Multi-Machine Shared Framework)
