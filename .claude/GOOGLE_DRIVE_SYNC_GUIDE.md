# Google Drive Sync Guide for dev-context Files

**Date:** November 8, 2025
**Purpose:** Enable access to dev-context files from Claude Code Web, SSH, and Codespaces

---

## Problem Statement

The `dev-context/` directory contains essential project documentation (roadmaps, research, analysis) but is **excluded from GitHub** via `.gitignore`.

This creates an access issue for:
- **Claude Code Web** (browser-based) - No access to Dropbox
- **SSH/Termius** - Remote connections may not mount Dropbox
- **GitHub Codespaces** - Cloud environment without Dropbox access

**Solution:** Sync `dev-context/` to Google Drive as a secondary cloud storage option.

---

## Why dev-context/ is Not in GitHub

From `.gitignore`:
```
# Design assets (large images over 500KB)
design-assets/
dev-context/
```

**Reasons:**
1. **Large files** - Contains extensive analysis docs (30-40K each)
2. **Research exports** - 357+ Perplexity exports (markdown files)
3. **Proprietary content** - Strategic analysis and business planning
4. **Frequent changes** - Updated often, would clutter commit history

---

## Current Multi-Environment Access

### Desktop (Mac Mini, MacBook Air)
- ✅ **Dropbox sync** - Full access to all files
- ✅ **GitHub** - .claude/ directory for commands and context
- ✅ **Local filesystem** - All paths work

### Web / SSH / Codespaces
- ✅ **GitHub** - .claude/ directory accessible
- ❌ **dev-context/** - NOT accessible (not in GitHub, not in environment)
- ⚠️ **Problem:** Roadmap commands reference dev-context/ files

---

## Solution: Google Drive Sync

### Option 1: Google Drive Desktop App (Recommended)

**Setup on Mac Mini:**

1. **Install Google Drive for Desktop**
   ```bash
   # Download from: https://www.google.com/drive/download/
   # Or via Homebrew:
   brew install --cask google-drive
   ```

2. **Configure Sync Settings**
   - Open Google Drive preferences
   - Select "Mirror files" (not "Stream files")
   - Choose sync location: `/Users/christophercooper/Google\ Drive/`

3. **Create Symbolic Link or Sync Folder**

   **Option A: Symbolic Link** (Keeps original location)
   ```bash
   # Create link in Google Drive to dev-context
   ln -s /Users/christophercooper/Dropbox/CC\ Projects/yellowcircle/yellow-circle/dev-context \
         /Users/christophercooper/Google\ Drive/yellowcircle-dev-context
   ```

   **Option B: Copy to Google Drive** (Duplicate)
   ```bash
   # Copy entire dev-context directory
   cp -r /Users/christophercooper/Dropbox/CC\ Projects/yellowcircle/yellow-circle/dev-context \
         /Users/christophercooper/Google\ Drive/yellowcircle-dev-context

   # Set up cron job to sync daily (optional)
   crontab -e
   # Add: 0 2 * * * rsync -av --delete /Users/.../dev-context/ /Users/.../Google\ Drive/yellowcircle-dev-context/
   ```

4. **Share Folder for Web Access**
   - Right-click folder in Google Drive
   - Select "Share" → "Anyone with link can view"
   - Copy shareable link
   - Document link in `.claude/GOOGLE_DRIVE_LINKS.md`

### Option 2: Manual Sync (Simplest)

**For essential files only:**

1. **Select key files to sync:**
   - `ROADMAP_CHECKLIST_NOV8_2025.md`
   - `PROJECT_ROADMAP_NOV2025.md`
   - `CLOUDFLARE_AUTOMATION_WORKAROUNDS_NOV2025.md`
   - `CLOUDFLARE_BLOCKING_TIMELINE_NOV2025.md`
   - `PERPLEXITY_EXPORT_RESEARCH_NOV2025.md`

2. **Upload to Google Drive**
   - Create folder: `yellowcircle-essential-docs/`
   - Upload files manually
   - Or use `rclone` for automation

3. **Update roadmap command**
   - Modify `/roadmap` command to include Google Drive links
   - Add fallback instructions if files not found locally

---

## Accessing dev-context/ from Web/SSH

### From Claude Code Web:

**Before using `/roadmap` command:**

1. **Check if dev-context is accessible:**
   ```bash
   ls dev-context/
   ```

2. **If not accessible:**
   ```
   Files are in Google Drive: https://drive.google.com/drive/folders/[FOLDER_ID]

   Download key files:
   - ROADMAP_CHECKLIST_NOV8_2025.md
   - PROJECT_ROADMAP_NOV2025.md

   Then use /roadmap command.
   ```

3. **Alternative:** Use web links in command
   - Command can fetch from Google Drive shareable links
   - Requires WebFetch tool

### From SSH/Termius:

**Option A: Mount Google Drive**
```bash
# Install rclone
brew install rclone

# Configure Google Drive remote
rclone config

# Mount Google Drive
mkdir -p ~/google-drive
rclone mount gdrive: ~/google-drive --daemon

# Access files
ls ~/google-drive/yellowcircle-dev-context/
```

**Option B: Download key files**
```bash
# Use rclone to download essential files
rclone copy gdrive:yellowcircle-dev-context/ ./dev-context/

# Now /roadmap command will work
```

---

## Updated Roadmap Command Strategy

### Modify `/roadmap` to Handle Missing Files

**Current behavior:**
```
1. Read dev-context/ROADMAP_CHECKLIST_NOV8_2025.md
2. Read dev-context/PROJECT_ROADMAP_NOV2025.md
3. Execute command
```

**Improved behavior:**
```
1. Check if dev-context/ exists locally
2. If YES: Read files normally
3. If NO:
   a. Check for Google Drive mount
   b. Provide download instructions
   c. Offer to use cached context from WIP_CURRENT_CRITICAL.md
   d. Display Google Drive links for manual access
```

**Example error handling:**
```markdown
⚠️ dev-context/ not accessible in this environment.

Options:
1. Download from Google Drive: [link]
2. Mount Google Drive: See .claude/GOOGLE_DRIVE_SYNC_GUIDE.md
3. Use cached context from WIP_CURRENT_CRITICAL.md
4. Continue with limited context

Which would you like to do?
```

---

## File Sync Priority

### Essential (Must sync to Google Drive):
- ✅ `ROADMAP_CHECKLIST_NOV8_2025.md` - Current action items
- ✅ `PROJECT_ROADMAP_NOV2025.md` - Long-term roadmap
- ✅ `CLOUDFLARE_AUTOMATION_WORKAROUNDS_NOV2025.md` - Research findings
- ✅ `01-research/PERPLEXITY_EXPORT_RESEARCH_NOV2025.md` - Export solutions

### Important (Sync if space allows):
- `01_Visual_Notes_Technical_Roadmap_CRITICAL.md`
- `02_yellowCircle_Strategy_CRITICAL.md`
- `03_Rho_Position_CRITICAL.md`

### Optional (Dropbox only):
- Perplexity exports (357 files) - Too large for frequent sync
- Older analysis documents

---

## Automation Script

**Auto-sync essential dev-context files to Google Drive:**

```bash
#!/bin/bash
# File: sync-essential-docs.sh

SOURCE="/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context"
DEST="/Users/christophercooper/Google Drive/yellowcircle-essential-docs"

# Essential files to sync
FILES=(
  "ROADMAP_CHECKLIST_NOV8_2025.md"
  "PROJECT_ROADMAP_NOV2025.md"
  "01-research/CLOUDFLARE_AUTOMATION_WORKAROUNDS_NOV2025.md"
  "01-research/CLOUDFLARE_BLOCKING_TIMELINE_NOV2025.md"
  "01-research/PERPLEXITY_EXPORT_RESEARCH_NOV2025.md"
)

echo "🔄 Syncing essential docs to Google Drive..."

for file in "${FILES[@]}"; do
  if [ -f "$SOURCE/$file" ]; then
    mkdir -p "$DEST/$(dirname $file)"
    cp "$SOURCE/$file" "$DEST/$file"
    echo "✅ Synced: $file"
  else
    echo "⚠️  Not found: $file"
  fi
done

echo "✨ Sync complete!"
```

**Make executable and run:**
```bash
chmod +x sync-essential-docs.sh
./sync-essential-docs.sh

# Optional: Add to cron for daily sync
crontab -e
# Add: 0 8 * * * /path/to/sync-essential-docs.sh
```

---

## Testing Access from Different Environments

### Test 1: Claude Code Web
1. Open repository in browser: https://claude.com/code
2. Clone repo (contains .claude/ but not dev-context/)
3. Run `/roadmap` command
4. Verify error handling provides Google Drive links

### Test 2: GitHub Codespaces
1. Open repository in Codespaces
2. Attempt to access dev-context/
3. Use rclone to download from Google Drive
4. Verify `/roadmap` works after download

### Test 3: SSH (Termius)
1. SSH into Mac Mini
2. Check dev-context/ access (should work via Dropbox)
3. SSH into remote server (no Dropbox)
4. Verify Google Drive download instructions work

---

## Recommended Setup

**For optimal multi-environment access:**

1. **Keep .claude/ in GitHub** ✅ (Already done)
   - Commands available everywhere
   - WIP_CURRENT syncs via git

2. **Sync essential dev-context/ to Google Drive** ⭐
   - Run sync-essential-docs.sh script weekly
   - Provides fallback for web/SSH access

3. **Update /roadmap command** 🔧
   - Add Google Drive fallback logic
   - Provide helpful error messages
   - Include download instructions

4. **Document Google Drive links** 📝
   - Create `.claude/GOOGLE_DRIVE_LINKS.md`
   - List shareable links for each essential file
   - Update when files are added/renamed

---

## Next Steps

### Immediate Actions:
- [ ] Install Google Drive for Desktop on Mac Mini
- [ ] Create `yellowcircle-essential-docs/` folder in Google Drive
- [ ] Run `sync-essential-docs.sh` script (create it first)
- [ ] Get shareable links for each file
- [ ] Document links in `.claude/GOOGLE_DRIVE_LINKS.md`
- [ ] Test access from Claude Code Web
- [ ] Update `/roadmap` command with fallback logic

### Optional Actions:
- [ ] Set up cron job for automatic daily sync
- [ ] Configure rclone for SSH environments
- [ ] Create mobile-friendly Google Drive access guide
- [ ] Add Google Drive links to WIP_CURRENT_CRITICAL.md

---

## Troubleshooting

### "Google Drive not syncing"
- Check Google Drive preferences → Sync status
- Verify internet connection
- Try manual upload as fallback

### "rclone mount failed"
- Check rclone config: `rclone config`
- Verify Google Drive auth: `rclone lsd gdrive:`
- Try without daemon first: `rclone mount gdrive: ~/google-drive`

### "Files out of date in Google Drive"
- Run sync script manually: `./sync-essential-docs.sh`
- Check last modified dates
- Use rsync with `--update` flag to sync only newer files

---

**Created:** November 8, 2025
**Last Updated:** November 8, 2025
**Status:** Draft - Pending implementation
**Priority:** Medium (improves web/SSH access but not critical)
