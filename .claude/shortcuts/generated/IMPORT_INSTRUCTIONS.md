# Generated Shortcuts - Import Instructions

## Files Generated

- yellowcircle-command-generated.shortcut
- rho-sync.shortcut
- unity-sync.shortcut
- personal-sync.shortcut

## How to Import

### Method 1: AirDrop (Easiest)
1. Select .shortcut file in Finder
2. Right-click → Share → AirDrop
3. Send to your iPhone
4. Tap on iPhone to import

### Method 2: iCloud Drive
1. Copy .shortcut files to iCloud Drive
2. Open Files app on iPhone
3. Tap .shortcut file to import

### Method 3: Sign & Import via URL Scheme

**Sign shortcuts:**
```bash
cd .claude/shortcuts/generated

# Sign each shortcut
shortcuts sign -i rho-sync.shortcut -o rho-sync-signed.shortcut -m anyone
shortcuts sign -i unity-sync.shortcut -o unity-sync-signed.shortcut -m anyone
shortcuts sign -i personal-sync.shortcut -o personal-sync-signed.shortcut -m anyone
```

**Import signed shortcuts:**
```bash
# This will open Shortcuts app and prompt to import
open "shortcuts://import-shortcut/?url=file://$(pwd)/rho-sync-signed.shortcut&name=Rho%20Sync"
```

## Auto-Sync via iCloud

Once imported on one device, shortcuts automatically sync to all devices via iCloud!

## Updating Shortcuts

When Trimurti projects evolve:
1. Run: `node generate-shortcuts.js`
2. Import updated .shortcut files
3. Old versions are replaced automatically

## Next Steps

1. Import generated shortcuts
2. Test on iPhone
3. Verify iCloud sync to all devices
4. Update .claude/automation/shortcut-router.js to enable project commands

---

Generated: 2025-11-19T07:29:58.481Z
