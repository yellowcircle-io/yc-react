# iPhone Shortcut - 5 Minute Setup

Get yellowCircle commands running on your iPhone in 5 minutes.

---

## Step 1: Get Mac Info (2 minutes)

On your Mac Mini Terminal:

```bash
# Find your Mac's local address
hostname
# Result: mac-mini.local

# Or get IP address
ifconfig | grep "inet " | grep -v 127.0.0.1
# Result: inet 192.168.1.100 (use this number)

# Verify SSH is enabled
sudo systemsetup -getremotelogin
# Should say: Remote Login: On
# If not: sudo systemsetup -setremotelogin on
```

**Write down:** `mac-mini.local` OR `192.168.1.X`

---

## Step 2: Create iPhone Shortcut (3 minutes)

On your iPhone:

1. **Open Shortcuts app**

2. **Tap + (top right)**

3. **Add these actions in order:**

### Action 1: Choose from Menu
- Search: "Choose from Menu"
- Tap "Add Action"
- Prompt: "yellowCircle Command"
- Add menu items:
  - Sync Roadmap
  - WIP Sync
  - Update Content
  - Check Deadlines
  - Weekly Summary

### Action 2: Run Script Over SSH

**For "Sync Roadmap" menu item:**
- Search: "Run Script Over SSH"
- Tap "Add Action"
- Configure:
  - **Host:** `mac-mini.local` (from Step 1)
  - **Port:** `22`
  - **User:** `christopherwilliamson`
  - **Password:** [your Mac password]
  - **Script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation && npm run sync
```

**Repeat for other menu items** (just change the `npm run` command):
- WIP Sync: `npm run wip:sync`
- Update Content: `npm run content:update -- --page=about --section=headline --text="Test"`
- Check Deadlines: `npm run alerts:deadline`
- Weekly Summary: `npm run summary:weekly`

### Action 3: Show Result
- Search: "Show Result"
- Tap "Add Action"
- Input: Shell Script Result

4. **Name shortcut:** `yellowCircle`

5. **Tap Done**

---

## Step 3: Add to Siri (30 seconds)

1. **Tap shortcut** (don't run, just tap to edit)
2. **Tap ⓘ (info icon)**
3. **Tap "Add to Siri"**
4. **Record:** "yellowCircle" or "yellow circle command"
5. **Tap Done**

---

## Test It!

**Voice:**
```
"Hey Siri, yellowCircle"
→ Choose "WIP Sync"
→ See output in ~5 seconds
```

**Manual:**
```
Open Shortcuts app
→ Tap "yellowCircle"
→ Choose command
→ See result
```

---

## Troubleshooting

### "Connection Failed"
- ✅ Mac Mini is on?
- ✅ iPhone on same WiFi as Mac?
- ✅ Try IP address instead of hostname

### "Permission Denied"
- ✅ Username correct? (`christopherwilliamson`)
- ✅ Password correct?

### "Command Not Found"
- ✅ Path correct? Check on Mac Terminal:
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/.claude/automation
ls
# Should show: content-update.js, daily-wip-sync.js, etc.
```

---

## What You Can Do Now

**From iPhone (voice or tap):**

✅ Sync roadmap to Notion
✅ Run daily WIP sync
✅ Check deadline alerts
✅ Generate weekly summary
🔜 Update page content (requires parameters)
🔜 Deploy to production

---

## Next: Content Updates

To update yellowCircle content from iPhone:

**Simple version (hardcoded):**
```
Hey Siri, Update About Page
→ Runs: npm run content:update -- --page=about --section=headline --text="Building Creative Technology"
```

**Advanced version (asks for input):**
Create separate shortcut with:
1. Ask for Input: "Which page?"
2. Ask for Input: "Which section?"
3. Ask for Input: "New text?"
4. Run SSH with those variables

---

**Setup Time:** 5 minutes
**Works:** TODAY
**Requires:** Mac Mini running on same network

Ready to test!
