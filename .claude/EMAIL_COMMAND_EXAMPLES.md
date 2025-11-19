# Email Command Examples

Send these via email or create GitHub issues with `command` label.

---

## Content Update (Permanent)

**Create GitHub Issue:**
- Title: `Content Update - About Page`
- Labels: `command`
- Body:
```
content update
page: about
section: headline
text: "Building Creative Technology"
```

**Result:**
- ✅ Content updated
- ✅ Committed to git
- ✅ Pushed to GitHub
- 💬 Comment with results
- 🏷️ Issue closed with `executed` label

---

## Content Update (Auto-Revert in 1 Hour) ⭐ NEW

**Create GitHub Issue:**
- Title: `Test Content Update`
- Labels: `command`
- Body:
```
content update
page: about
section: headline
text: "TEMPORARY TEST HEADLINE"
revert: 1h
```

**Result:**
- ✅ Content updated immediately
- ✅ Committed and pushed
- 💬 Comment: "✅ Command Executed"
- 💬 Comment: "⏰ Auto-Revert Scheduled for 1h"
- 🏷️ Issue labeled `auto-revert`
- ⏰ After 1 hour: Automatically reverted
- 💬 Comment: "⏪ Auto-Revert Executed"
- 🏷️ Label `auto-revert` removed

**To cancel auto-revert:**
- Remove `auto-revert` label from issue before 1 hour

---

## Example: Test Homepage Headline

**GitHub Issue Body:**
```
content update
page: home
section: headline
text: "TEST: New Homepage Headline"
revert: 1h
```

**Timeline:**
- **0:00** - Issue created with `command` label
- **0:01** - GitHub Action executes
- **0:02** - Content updated on yellowcircle-app.web.app
- **0:02** - Comment posted with results
- **0:02** - Issue labeled `auto-revert` and closed
- **1:00** - Auto-revert workflow runs (hourly)
- **1:01** - Change automatically reverted
- **1:02** - Comment posted: "⏪ Auto-Revert Executed"
- **1:02** - Label removed

---

## Example: Update About Page Description (Permanent)

**GitHub Issue Body:**
```
content update
page: about
section: description
text: "Marketing technologist specializing in automation and creative solutions."
```

**Result:**
- Updates About page description permanently
- No auto-revert (no `revert:` flag)
- Stays until manually changed

---

## Example: Change Works Page Background

**GitHub Issue Body:**
```
content update
page: works
section: background
text: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1234567890/new-background.jpg"
```

**Result:**
- Updates background image URL
- Permanent change

---

## Automation Commands (No Revert)

**WIP Sync:**
```
wip sync
```

**Roadmap Sync:**
```
sync
```

**Check Deadlines:**
```
deadline
```

**Weekly Summary:**
```
summary
```

---

## Email Workflow

### Method 1: Direct GitHub Issue (Mobile)

1. Open GitHub mobile app
2. Go to yellowcircle-io/yc-react
3. Tap **Issues**
4. Tap **+** (New Issue)
5. Title: "Content Update"
6. Body: (use template above)
7. Labels: Add `command`
8. Submit

### Method 2: Email to GitHub (If Configured)

1. Get repo email address from GitHub settings
2. Send email with issue content
3. GitHub creates issue automatically
4. Workflow executes

### Method 3: Shortcut/Automation

Create iOS Shortcut:
1. Ask for page, section, text
2. Create GitHub issue via API
3. Add `command` label
4. Done!

---

## Response Notifications

**Where you'll see responses:**

✅ **GitHub Issue Comments**
- Automatic comment with execution results
- Shows output of command
- Includes timestamp

✅ **GitHub Notifications**
- Email (if enabled in GitHub settings)
- Mobile app push notification
- Web notification

✅ **GitHub Actions Tab**
- Full execution logs
- Detailed output
- Error messages if any

---

## Testing Workflow

**Safe test with auto-revert:**

1. **Create issue on iPhone** (via GitHub app)
   ```
   Title: Test Content Update
   Labels: command
   Body:
   content update
   page: about
   section: headline
   text: "TEST - This will revert in 1 hour"
   revert: 1h
   ```

2. **Wait 30 seconds** - GitHub Action executes

3. **Check notifications** - Should see comment on issue

4. **Visit site** - https://yellowcircle-app.web.app/about

5. **Verify change** - Headline should say "TEST - This will revert in 1 hour"

6. **Wait 1 hour** - Or manually trigger auto-revert workflow

7. **Check again** - Should be reverted to original

---

## Error Handling

**If command fails:**
- ❌ Error message in issue comment
- 🏷️ Issue labeled `error`
- 📧 Notification sent
- Issue stays open for review

**Common errors:**
- Missing parameters (page, section, text)
- Invalid page name
- Invalid section name
- Git conflict (rare)

---

**Created:** November 18, 2025
**Status:** ✅ Ready to use
**Works via:** GitHub Issues, Email (if configured), Shortcuts
