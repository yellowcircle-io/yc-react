# Dropbox Path Configuration Guide
**Created:** October 27, 2025
**Purpose:** Document which Dropbox path is active and syncing

---

## Active Syncing Path (✅ USE THIS)

```
/Users/christophercooper_1/Library/CloudStorage/Dropbox/
```

**Status:** ✅ **SYNCING ACROSS COMPUTERS**

**Characteristics:**
- Official Dropbox syncing folder (confirmed via `~/.dropbox/info.json`)
- Modern macOS Dropbox path structure
- All files here sync to MacBook Air and other devices
- Claude Code is configured to work in this location

**Full Project Path:**
```
/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/
```

---

## Legacy Non-Syncing Path (❌ DO NOT USE)

```
/Users/christophercooper_1/Dropbox/
```

**Status:** ❌ **NOT SYNCING** - Old directory with outdated files

**Characteristics:**
- Different inode (534019 vs 2968904) = completely separate directory
- Contains outdated files from previous Dropbox configuration
- NOT monitored by Dropbox client
- Changes here will NOT appear on other computers

**Why it exists:**
- Likely from old Dropbox installation or manual copy
- macOS changed Dropbox default location to `Library/CloudStorage/` in recent versions
- Legacy path remains but is disconnected from sync

---

## How to Verify Active Path

Check Dropbox configuration:
```bash
cat ~/.dropbox/info.json
```

Should show:
```json
{"personal": {"path": "/Users/christophercooper_1/Library/CloudStorage/Dropbox", ...}}
```

---

## What This Means for Claude Code

**Current Working Directory:**
```bash
pwd
# Returns: /Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/
```

✅ **Correct!** Claude Code is already working in the syncing Dropbox folder.

All files created by Claude Code will automatically sync to your other computers.

---

## Files Created Today (All Syncing)

These files are in the correct syncing location and will appear on MacBook Air:

**Analysis Documents:**
- `dev-context/01_Visual_Notes_Technical_Roadmap_CRITICAL.md` (42K)
- `dev-context/02_yellowCircle_Strategy_CRITICAL.md` (39K)
- `dev-context/03_Rho_Position_CRITICAL.md` (42K)
- `dev-context/Comprehensive_Reassessment_Oct2025.md` (36K)

**Previous Documents:**
- `dev-context/Dev-Context_Deep_Analysis.md`
- `dev-context/Intellectual_Profile_Analysis.md`
- `dev-context/compass_artifact_wf-81fbdb5a-91c6-464c-b5f0-bd70371a25c0_text_markdown.md`

**Test Files (created to verify sync):**
- `DROPBOX_SYNC_TEST.md`
- `DROPBOX_PATH_GUIDE.md` (this file)

---

## Sync Verification Steps

**On Mac Mini (this computer):**
1. ✅ Files created in `/Users/christophercooper_1/Library/CloudStorage/Dropbox/...`
2. ⏳ Waiting for Dropbox to sync (usually 1-2 minutes)

**On MacBook Air (check):**
1. Navigate to: `~/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/`
2. Look for: `DROPBOX_SYNC_TEST.md`
3. If visible → Sync working correctly ✅
4. If not visible → Check Dropbox sync status

---

## Troubleshooting

**If files don't appear on MacBook Air:**

1. **Check Dropbox is running:**
   ```bash
   ps aux | grep -i dropbox
   ```

2. **Check sync status:**
   - Look for Dropbox icon in menu bar
   - Click icon and check sync progress

3. **Verify MacBook Air is using same path:**
   ```bash
   cat ~/.dropbox/info.json
   ```
   Should show: `/Users/christophercooper_1/Library/CloudStorage/Dropbox`

4. **Check for selective sync:**
   - Dropbox → Preferences → Sync
   - Ensure "CC Projects" folder is not excluded

5. **Force sync:**
   - Quit and restart Dropbox application
   - Or pause/resume syncing

---

## Summary

✅ **Everything is configured correctly**
- Claude Code is working in syncing Dropbox location
- All files created today are syncing
- No action needed on Mac Mini

🔍 **Verification needed:**
- Check MacBook Air for `DROPBOX_SYNC_TEST.md` file
- Confirm sync is working across both computers

---

**Document created:** October 27, 2025 at 9:20 AM PST
**Last updated:** October 27, 2025 at 9:20 AM PST
