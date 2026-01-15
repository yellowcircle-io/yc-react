# Blocked Tasks Alert

**Generated:** January 15, 2026
**Previous:** November 18, 2025 (No blocked tasks at that time)

---

## ⚠️ Currently Blocked Tasks

### 1. Launch Outbound Campaign
| Field | Value |
|-------|-------|
| Priority | P1 |
| Blocked By | Ad Platform Tokens |
| Required Actions | LinkedIn OAuth regeneration, Meta Business Verification |
| Owner | User |
| Duration Blocked | Since Dec 19, 2025 |

**Details:** Campaign infrastructure is ready (ESP configured, contacts imported, sequences built). Waiting on:
- LinkedIn: OAuth token needs regeneration
- Meta: Business verification pending
- Google Ads: On hold

### 2. Claude Bot Relay (Automated)
| Field | Value |
|-------|-------|
| Priority | P2 |
| Blocked By | ANTHROPIC_API_KEY |
| Required Actions | Obtain API key from console.anthropic.com |
| Owner | User |
| Duration Blocked | Since Jan 10, 2026 |

**Details:** Bot-to-bot communication scoped with 4 implementation options. Native Slack Claude integration filters bot messages by design - all automated methods require API access.

---

## ✅ Recently Unblocked

### Cron Job Automation (Unblocked Jan 7, 2026)
- **Was blocked by:** Missing `--verbose` flag
- **Resolution:** Added flag to `scripts/claude-auto.sh`
- **Commit:** `0e7846c`

### Demo Mode Button (Unblocked Jan 10, 2026)
- **Was blocked by:** CI build error (missing ThemeContext.jsx)
- **Resolution:** Committed ThemeContext.jsx
- **Staging verified:** Working

---

## Historical Record

### November 18, 2025
✅ No blocked tasks at that time.

---

## How to Resolve Blocked Tasks

### Ad Platform Tokens
1. **LinkedIn:** Go to LinkedIn Developer Portal → Regenerate OAuth tokens
2. **Meta:** Complete Business Verification at business.facebook.com
3. **Google Ads:** Review and activate when ready

### Claude Bot Relay
1. **Get API Key:** https://console.anthropic.com/settings/keys
2. **Add to .env:** `ANTHROPIC_API_KEY=sk-ant-...`
3. **Start daemon:** `python3 scripts/claude-relay-daemon.py`

---

*Auto-generated alert file. Update when tasks become blocked or unblocked.*
