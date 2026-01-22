# yellowCircle Link Saver - iOS Shortcut Generator

This directory contains tools to create and customize the iOS Shortcut for saving links to yellowCircle.

## How It Works

1. User downloads shortcut from iCloud link
2. **First run**: Prompts for Save Token (from yellowCircle Settings)
3. Token is stored locally in iCloud Drive (never asked again)
4. **Subsequent runs**: Share any URL → Link saved → Redirects to page

## Files

- `YellowCircle-LinkSaver.shortcut.plist` - The raw shortcut template (XML plist)
- `build-shortcut.cjs` - Node.js script to build the .shortcut file
- `modify-shortcut.cjs` - Node.js script to modify existing .shortcut files

## Quick Start

### Option 1: Manual Creation (Recommended)

See `MANUAL_CREATION_STEPS.md` for step-by-step instructions to create the shortcut in the iOS/macOS Shortcuts app.

### Option 2: Build from Template

```bash
# Install dependencies
npm install plist

# Build the shortcut file
node build-shortcut.cjs

# Output: YellowCircle-LinkSaver.shortcut
```

## Uploading to iCloud

1. Open the `.shortcut` file on Mac (double-click)
2. In Shortcuts app: Right-click → Share → Copy iCloud Link
3. Use this link on the yellowCircle extension page

## Shortcut Logic Flow

```
START
  │
  ├─► Check if token file exists
  │   ├─► YES: Read token from file
  │   └─► NO: Prompt user for token → Save to file
  │
  ├─► Get URL from Share Sheet input
  │   └─► If empty: Get URL from clipboard
  │
  ├─► Build URL: yellowcircle.io/s/{token}/{url}
  │
  ├─► Open URL in Safari (saves link + redirects)
  │
  └─► Show "Link Saved!" notification
END
```
