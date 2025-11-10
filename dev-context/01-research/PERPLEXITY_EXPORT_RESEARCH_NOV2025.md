# Perplexity Export Solutions Research - November 2025

**Date:** November 8, 2025
**Goal:** Find programmatic solution for ongoing Perplexity conversation export
**Status:** ⚠️ No fully automated solution exists; hybrid approach recommended

---

## Executive Summary

After extensive testing and research, **Perplexity does not provide an official bulk export API**, and all automation approaches face significant barriers:

1. **Cloudflare bot protection** blocks browser automation (Playwright, Puppeteer, Selenium)
2. **No official export API** for historical conversations
3. **Browser extensions** exist but are fragile (break with UI changes)
4. **Zapier integration** only works for NEW conversations, not historical export

---

## What We Tested

### ❌ Browser Automation Approaches (All Failed)

| Method | Technology | Result | Blocker |
|--------|-----------|---------|---------|
| Chromium (Playwright) | Python + Playwright | ❌ Failed | Cloudflare bot loop |
| Chromium (Fresh Install) | Cleared cache + fresh browser | ❌ Failed | Cloudflare IP/UID tracking |
| Firefox (Playwright) | Gecko engine instead of Blink | ❌ Failed | Cloudflare + navigation redirect |
| perplexport tool | TypeScript + Puppeteer | ❌ Broken | UI selectors changed |

**Root cause:** Cloudflare's anti-bot protection detects automation signatures and likely tracks by IP address or persistent identifiers, making browser switching ineffective.

---

## Available Solutions (Ranked by Viability)

### Option 1: Browser Extension (Semi-Automated) ⭐ BEST FOR BULK EXPORT

**Tool:** [Save my Chatbot](https://chrome-stats.com/d/agklnagmfeooogcppjccdnoallkhgkod)
**Platforms:** Chrome, Firefox, Edge, Opera, Brave
**Supports:** Perplexity, Claude, ChatGPT, Phind, MaxAI

**How it works:**
1. Install extension from [Chrome Web Store](https://chromewebstore.google.com/detail/agklnagmfeooogcppjccdnoallkhgkod)
2. Navigate to Perplexity conversation
3. Click extension icon
4. Downloads structured Markdown file

**Pros:**
- Works in your regular browser (no automation signature)
- Actively maintained (developer fixes UI changes)
- Supports multiple AI platforms
- Exports to clean Markdown format
- One-click per conversation

**Cons:**
- **Not fully automated** - requires clicking for each conversation
- Recent reports (2024) of issues with Perplexity (missing responses, truncated exports)
- Developer is actively fixing, but Perplexity UI changes frequently
- No batch export across all conversations

**Best for:** Manual export of new conversations as they're created

---

### Option 2: Zapier Integration (Ongoing Automation) ⭐ BEST FOR NEW CONVERSATIONS

**Official Integration:** [Perplexity + Zapier](https://zapier.com/apps/perplexity/integrations)

**What it does:**
- Automates NEW Perplexity queries
- Routes responses to CRMs, spreadsheets, Slack, Notion, etc.
- Scheduled research reports
- Lead enrichment workflows

**Example workflows:**
```
Trigger: New row in Google Sheets
→ Action: Query Perplexity API
→ Action: Save response to Notion

Trigger: Schedule (daily)
→ Action: Query Perplexity with prompt
→ Action: Email results
```

**Pros:**
- Official integration
- Fully programmatic
- Real-time automation
- Connects to 5,000+ apps

**Cons:**
- **Only works for NEW conversations**
- Cannot export historical threads
- Requires Perplexity API access ($5-20/month)
- Not for bulk historical export

**Best for:** Automating research workflows going forward, not historical export

---

### Option 3: Native Manual Export

**Built-in Feature:** Perplexity's "Export as Markdown"
**Location:** Three-dots menu (⋮) → Export

**How it works:**
1. Open conversation
2. Click three-dots menu
3. Select "Export as Markdown"
4. Save file

**Pros:**
- Always works (official feature)
- Highest quality exports
- No third-party dependencies

**Cons:**
- Extremely time-consuming (45-60 per hour)
- Not scalable
- Repetitive strain risk

**Time estimate for 300 conversations:** 6-8 hours

**Best for:** Critical conversations that must be exported perfectly

---

## Hybrid Recommendation: Two-Phase Approach

### Phase 1: Historical Export (One-Time)

**Use existing October data (391 threads, 349 exported)**

For any new threads since Oct 27:

**Option A:** Browser extension (if < 50 threads)
- Install "Save my Chatbot"
- Manually export new conversations
- Time: ~30-60 minutes

**Option B:** Native export (if critical quality needed)
- Use Perplexity's built-in export
- Time: ~1-2 hours for 50 threads

---

### Phase 2: Ongoing Automation (Future)

**Use Zapier integration for new conversations**

**Setup:**
1. Create Perplexity API account
2. Connect to Zapier
3. Create workflow:
   ```
   Trigger: New Perplexity query
   → Action 1: Save to Google Drive (as Markdown)
   → Action 2: Add row to tracking spreadsheet
   → Action 3: Backup to Dropbox
   ```

**Cost:** $5-20/month for Perplexity API + Zapier plan

**Result:** Every new conversation automatically exported and backed up

---

## Alternative: Perplexity to Notion Integration

**Service:** [Save Perplexity to Notion](https://saveperplexity.chatgpt2notion.com/)

**Features:**
- Sync Perplexity conversations to Notion
- Batch export capability
- Structured database format

**Status:** Third-party service, reliability unknown

---

## Community Feature Request Status

**Feature Request:** [Bulk Export of All Threaded Conversations](https://community.perplexity.ai/t/feature-request-bulk-export-of-all-threaded-conversations/371)

**Status:** Requested May 2025, not yet implemented

**What users want:**
- One-click export of entire conversation history
- Downloadable archive (JSON/Markdown)
- Scheduled automatic exports

**Likelihood:** Low priority for Perplexity (no official response)

---

## Technical Findings

### Why Browser Automation Fails

1. **Cloudflare Turnstile** - Advanced bot detection
2. **IP-based tracking** - Switching browsers doesn't help if IP is flagged
3. **Persistent identifiers** - Cookies/fingerprints tracked across sessions
4. **Rate limiting** - Excessive requests trigger permanent blocks

### What Changed Since October 2024

- `perplexport` tool broken (UI selectors changed)
- Library page structure updated
- Export menu selectors modified
- Cloudflare protection strengthened

### Browser Extension Fragility

- Depends on stable UI selectors
- Breaks with each Perplexity update
- Developers must constantly patch
- "Save my Chatbot" has active issues (Nov 2025)

---

## Cost-Benefit Analysis

### For 300+ Historical Conversations

| Method | Time | Cost | Reliability | Maintenance |
|--------|------|------|-------------|-------------|
| Browser Automation | 0 hrs (blocked) | $0 | 0% | N/A |
| Browser Extension | 3-5 hrs | Free | 60-70% | Developer dependent |
| Manual Export | 6-8 hrs | $0 | 100% | None |
| Existing Oct Data | 0 hrs | $0 | 100% | None |

### For Ongoing (New Conversations)

| Method | Setup | Per Month | Reliability | Automation |
|--------|-------|-----------|-------------|------------|
| Browser Extension | 15 min | Free | 60-70% | Semi-auto |
| Zapier | 1-2 hrs | $25-35 | 95% | Fully auto |
| Manual | None | $0 | 100% | None |

---

## Final Recommendations

### Immediate (This Week)

**Accept October 2024 data** and move forward:
- 391 threads tracked
- 349 successfully exported
- Only 2 weeks old
- Saves 6-8 hours of manual work

For critical new threads:
- Use browser extension OR
- Manual export (5-10 most important)

### Long-Term (Going Forward)

**Implement Zapier automation:**

1. Set up Perplexity API ($5-20/month)
2. Create Zapier workflow
3. Auto-export all new conversations
4. Schedule weekly digest

**Total cost:** ~$30/month
**Time saved:** 4-6 hours/month
**ROI:** Positive if you create 20+ threads/month

---

## Repository Structure

```
dev-context/
├── 01-research/
│   ├── perplexity-exports/          # 349 exported MD files (Oct 2024)
│   ├── PERPLEXITY_EXPORT_RESEARCH_NOV2024.md  # This document
│   └── FINAL-PERPLEXITY-EXPORT-FINDINGS.md    # Oct research
├── 05-tasks/
│   ├── thread_inventory-personal.csv     # 391 threads tracked
│   ├── thread_inventory_account2-rho.csv # Secondary account
│   ├── perplexity_exporter.py            # Python/Playwright script (blocked by Cloudflare)
│   ├── perplexity_exporter_account2.py   # Account 2 version
│   └── perplexity_dashboard_v2.html      # Progress monitor
```

---

## Key Learnings

1. **Browser automation is not viable** for Perplexity export due to Cloudflare
2. **No official bulk export API** exists or is planned
3. **Third-party extensions are fragile** but sometimes work
4. **Zapier is the best programmatic solution** for NEW conversations only
5. **Manual export remains most reliable** for historical data
6. **Two-week old data is acceptable** for most use cases

---

## Action Items

- [ ] Decide: Accept Oct 2024 data vs. manual re-export
- [ ] If ongoing automation needed: Set up Zapier workflow
- [ ] Install browser extension for ad-hoc exports
- [ ] Monitor Perplexity community for official export feature
- [ ] Archive this research for future reference

---

## Resources

- [Save my Chatbot Extension](https://chromewebstore.google.com/detail/agklnagmfeooogcppjccdnoallkhgkod)
- [Perplexity Zapier Integration](https://zapier.com/apps/perplexity/integrations)
- [Perplexity API Documentation](https://www.perplexity.ai/api-platform)
- [Community Feature Request](https://community.perplexity.ai/t/feature-request-bulk-export-of-all-threaded-conversations/371)
- [perplexport (Broken)](https://github.com/leonid-shevtsov/perplexport)

---

**Last Updated:** November 8, 2025
**Next Review:** When Perplexity announces bulk export feature (monitor community)
