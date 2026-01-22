# Manual Shortcut Creation Steps

This guide walks you through creating the "Save to yellowCircle" shortcut manually in the Shortcuts app on Mac or iOS.

**Time required:** ~5 minutes

---

## Overview

This shortcut:
1. **First run only:** Prompts for your Save Token
2. **Stores token** in iCloud Drive (never asks again)
3. **Accepts URLs** from Share Sheet OR clipboard
4. **Saves the link** to your yellowCircle account
5. **Redirects you** to the original page
6. **Shows notification** confirming save

---

## Step-by-Step Instructions

### 1. Create New Shortcut

1. Open **Shortcuts** app (Mac or iOS)
2. Click **+** to create new shortcut
3. Name it: **"Save to yellowCircle"**

### 2. Configure Share Sheet

1. Click **ⓘ** (info) icon or **Settings** gear
2. Enable **"Show in Share Sheet"**
3. Set **"Receives"** to: **URLs, Safari web pages, Articles**

### 3. Add Actions (in exact order)

---

#### SECTION A: Token Management

**Action 1: Get File**
- Search for: `Get File`
- File Path: `Shortcuts/yellowcircle-token.txt`
- ☐ Uncheck "Show Document Picker"
- ☐ Uncheck "Error if not found"

**Action 2: Count**
- Search for: `Count`
- Input: `File` (from previous action)

**Action 3: If**
- Search for: `If`
- Condition: `Count` **is** `0`

**Action 4: Ask for Input** (inside If)
- Search for: `Ask for Input`
- Prompt: `Enter your yellowCircle Save Token (from Settings → Link Saver)`
- Input Type: **Text**

**Action 5: Save File** (inside If)
- Search for: `Save File`
- Save: `Provided Input`
- Destination Path: `Shortcuts/yellowcircle-token.txt`
- ☑ Check "Overwrite If File Exists"
- ☐ Uncheck "Ask Where to Save"

**Action 6: Set Variable** (inside If)
- Search for: `Set Variable`
- Variable Name: `SaveToken`
- Input: `Provided Input` (from Ask action)

**Action 7: Otherwise**
- (This is automatically added with the If action)

**Action 8: Get File** (inside Otherwise)
- Search for: `Get File`
- File Path: `Shortcuts/yellowcircle-token.txt`
- ☐ Uncheck "Show Document Picker"

**Action 9: Set Variable** (inside Otherwise)
- Search for: `Set Variable`
- Variable Name: `SaveToken`
- Input: `File` (from Get File)

**Action 10: End If**
- (Automatically closes the If block)

---

#### SECTION B: URL Handling

**Action 11: Get Variable**
- Search for: `Get Variable`
- Select: `Shortcut Input`

**Action 12: Count**
- Search for: `Count`
- Input: `Shortcut Input`

**Action 13: If**
- Search for: `If`
- Condition: `Count` **is** `0`

**Action 14: Get Clipboard** (inside If)
- Search for: `Get Clipboard`

**Action 15: Get URLs from Input** (inside If)
- Search for: `Get URLs from`
- Input: `Clipboard`

**Action 16: Set Variable** (inside If)
- Variable Name: `LinkURL`
- Input: `URLs`

**Action 17: Otherwise**

**Action 18: Get URLs from Input** (inside Otherwise)
- Search for: `Get URLs from`
- Input: `Shortcut Input`

**Action 19: Set Variable** (inside Otherwise)
- Variable Name: `LinkURL`
- Input: `URLs`

**Action 20: End If**

---

#### SECTION C: Save and Open

**Action 21: Text**
- Search for: `Text`
- Content: `https://yellowcircle.io/s/` + tap **Insert Variable** → `SaveToken` + `/` + tap **Insert Variable** → `LinkURL`

The text should look like:
```
https://yellowcircle.io/s/[SaveToken]/[LinkURL]
```

**Action 22: Open URLs**
- Search for: `Open URLs`
- Input: `Text` (from previous action)

**Action 23: Show Notification**
- Search for: `Show Notification`
- Body: `Link saved to yellowCircle!`
- Title: `✓ Saved`

---

## 4. Test the Shortcut

### First Run Test:
1. Copy any URL to clipboard
2. Run the shortcut
3. Enter your Save Token when prompted
4. Should open URL and show notification

### Share Sheet Test:
1. Open Safari to any page
2. Tap Share button
3. Select "Save to yellowCircle"
4. Should save and stay on page

---

## 5. Get iCloud Link

1. In Shortcuts app, find your shortcut
2. **Right-click** (Mac) or **long-press** (iOS)
3. Select **Share** → **Copy iCloud Link**
4. Wait for upload to complete
5. Link will be copied to clipboard

Example link format:
```
https://www.icloud.com/shortcuts/abc123def456...
```

---

## Visual Reference

```
┌─────────────────────────────────────────────┐
│  Save to yellowCircle                       │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─ Get File ─────────────────────────────┐ │
│  │ Shortcuts/yellowcircle-token.txt       │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌─ Count ────────────────────────────────┐ │
│  │ Items in [File]                        │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌─ If [Count] is 0 ──────────────────────┐ │
│  │                                        │ │
│  │  ┌─ Ask for Input ───────────────────┐ │ │
│  │  │ "Enter your yellowCircle..."      │ │ │
│  │  └───────────────────────────────────┘ │ │
│  │                                        │ │
│  │  ┌─ Save File ───────────────────────┐ │ │
│  │  │ Save [Provided Input] to          │ │ │
│  │  │ Shortcuts/yellowcircle-token.txt  │ │ │
│  │  └───────────────────────────────────┘ │ │
│  │                                        │ │
│  │  ┌─ Set Variable ────────────────────┐ │ │
│  │  │ SaveToken = [Provided Input]      │ │ │
│  │  └───────────────────────────────────┘ │ │
│  │                                        │ │
│  ├─ Otherwise ────────────────────────────┤ │
│  │                                        │ │
│  │  ┌─ Get File ────────────────────────┐ │ │
│  │  │ Shortcuts/yellowcircle-token.txt  │ │ │
│  │  └───────────────────────────────────┘ │ │
│  │                                        │ │
│  │  ┌─ Set Variable ────────────────────┐ │ │
│  │  │ SaveToken = [File]                │ │ │
│  │  └───────────────────────────────────┘ │ │
│  │                                        │ │
│  └─ End If ───────────────────────────────┘ │
│                                             │
│  ... (URL handling section) ...             │
│                                             │
│  ┌─ Text ─────────────────────────────────┐ │
│  │ https://yellowcircle.io/s/[SaveToken]/ │ │
│  │ [LinkURL]                              │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌─ Open URLs ────────────────────────────┐ │
│  │ [Text]                                 │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌─ Show Notification ────────────────────┐ │
│  │ "Link saved to yellowCircle!"          │ │
│  └────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Troubleshooting

### "File not found" error
- Make sure the file path is exactly: `Shortcuts/yellowcircle-token.txt`
- The Shortcuts folder is auto-created in iCloud Drive

### Token not saving
- Check "Overwrite If File Exists" is enabled
- Ensure iCloud Drive is enabled on device

### URL not being captured
- Share Sheet: Make sure "URLs" is in the accepted types
- Clipboard: URL must be a valid http:// or https:// link

### Link not saving to yellowCircle
- Verify your token is correct (from Settings → Link Saver)
- Check yellowcircle.io/s/ route is deployed (ask admin)
