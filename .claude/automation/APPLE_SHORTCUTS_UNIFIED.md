# Apple Shortcuts - Unified Command System

**Updated:** January 24, 2026
**Status:** Ready for Use

---

## Quick Start

All commands now use a single unified script: `yc-command.sh`

### SSH Connection Info
| Field | Value |
|-------|-------|
| Host | `192.168.4.148` or `Coopers-MacBook-Air.local` |
| Port | `22` |
| User | `christophercooper` |
| Auth | Password |

### Base Script Path
```bash
~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/scripts/yc-command.sh
```

---

## Shortcuts to Create

### 1. YC Notify (Quick Message)

**Purpose:** Send quick notification to Slack

**SSH Script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle && ./scripts/yc-command.sh notify "[Provided Input]"
```

**Shortcut Steps:**
1. Ask for Input: "Message to send"
2. Run Script Over SSH (with input variable)
3. Show Result

---

### 2. YC Save Link (Link Archiver)

**Purpose:** Save a link with metadata to Slack

**SSH Script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle && ./scripts/yc-command.sh notify "[Title]" "[URL]" "[Folder]"
```

**Shortcut Steps:**
1. Receive input from Share Sheet (URL)
2. Ask for Input: "Title for this link"
3. Choose from Menu: Reading List, Research, Reference, Inbox
4. Run Script Over SSH
5. Show Result

---

### 3. YC Status Update

**Purpose:** Send status notification (success/warning/error/info)

**SSH Script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle && ./scripts/yc-command.sh status [type] "[message]"
```

**Examples:**
```bash
./scripts/yc-command.sh status success "Build completed"
./scripts/yc-command.sh status warning "Low disk space"
./scripts/yc-command.sh status error "Deploy failed"
./scripts/yc-command.sh status info "Sync started"
```

---

### 4. YC History (View Changes)

**Purpose:** View recent git changes

**SSH Script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle && ./scripts/yc-command.sh history
```

---

### 5. YC Rollback (Emergency Undo)

**Purpose:** Rollback last commit

**SSH Script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle && ./scripts/yc-command.sh rollback
```

**Icon:** Red, undo arrow

---

### 6. YC View Config

**Purpose:** View current global configuration

**SSH Script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle && ./scripts/yc-command.sh global --action=list
```

---

### 7. YC Menu (All Commands)

**Purpose:** Show all available commands

**SSH Script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle && ./scripts/yc-command.sh help
```

---

### 8. YC Sync (Notion)

**Purpose:** Sync roadmap to Notion

**SSH Script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle && ./scripts/yc-command.sh sync
```

---

### 9. YC Deadline Check

**Purpose:** Check tasks due within 24 hours

**SSH Script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle && ./scripts/yc-command.sh deadline
```

---

### 10. YC Blocked Check

**Purpose:** Check blocked tasks (>48hrs)

**SSH Script:**
```bash
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle && ./scripts/yc-command.sh blocked
```

---

## Complete Command Reference

### Notifications
| Command | Description |
|---------|-------------|
| `yc notify "msg"` | Send simple notification |
| `yc notify "title" "url" "folder"` | Link archived notification |
| `yc status success "msg"` | Success status |
| `yc status warning "msg"` | Warning status |
| `yc status error "msg"` | Error status |
| `yc status info "msg"` | Info status |

### Git/History
| Command | Description |
|---------|-------------|
| `yc history` | Recent changes (10 commits) |
| `yc last-change` | Last commit details |
| `yc rollback` | Revert last commit |
| `yc restore` | Restore uncommitted changes |

### Sync
| Command | Description |
|---------|-------------|
| `yc sync` | Sync roadmap to Notion |
| `yc wip` | Daily WIP sync |

### Alerts
| Command | Description |
|---------|-------------|
| `yc deadline` | Tasks due within 24hrs |
| `yc blocked` | Tasks blocked >48hrs |

### Global Components
| Command | Description |
|---------|-------------|
| `yc global --action=list` | View current config |
| `yc edit-header` | Edit header |
| `yc edit-footer` | Edit footer |
| `yc edit-theme` | Edit theme |

### System
| Command | Description |
|---------|-------------|
| `yc help` | Show all commands |
| `yc menu` | Same as help |

---

## Slack Integration

Same commands work from Slack via `/sleepless`:

```
/sleepless yc notify "Test message"
/sleepless yc status success "Build done"
/sleepless yc history
/sleepless yc help
```

---

## Migration from Legacy Shortcuts

If you have existing shortcuts using `shortcut-router.js` or `iphone-menu.js`:

| Old Command | New Command |
|-------------|-------------|
| `node shortcut-router.js rollback` | `./scripts/yc-command.sh rollback` |
| `node shortcut-router.js history` | `./scripts/yc-command.sh history` |
| `node shortcut-router.js global --action=list` | `./scripts/yc-command.sh global --action=list` |
| `node iphone-menu.js` | `./scripts/yc-command.sh help` (non-interactive) |

**Benefits of unified approach:**
- Single script for all commands
- Works from both Apple Shortcuts AND Slack
- Automatic Slack notifications on rollback
- Consistent error handling
- No Node.js dependency for simple commands

---

## Troubleshooting

### "Permission denied"
```bash
chmod +x ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle/scripts/yc-command.sh
```

### "SLACK_BOT_TOKEN not set"
The script reads from `.env` automatically. Ensure `.env` exists with:
```
SLACK_BOT_TOKEN=xoxb-...
```

### Connection refused
- Verify Remote Login is ON (System Settings > Sharing)
- Check both devices on same WiFi
- Try hostname: `Coopers-MacBook-Air.local`

---

## Recommended Home Screen Layout

Create a folder named "yellowCircle" with:

| Icon | Name | Command |
|------|------|---------|
| Yellow | YC Notify | notify |
| Blue | YC History | history |
| Red | YC Rollback | rollback |
| Green | YC Config | global --action=list |
| Purple | YC Status | status (with menu) |

---

**Created:** January 24, 2026
**Author:** Claude Code
