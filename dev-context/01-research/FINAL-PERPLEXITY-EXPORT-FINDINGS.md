# Perplexity Export - Final Findings & Recommendations

**Date:** 2025-10-09
**Challenge:** Programmatic export of 355 Perplexity conversations
**Status:** ⚠️ No fully automated solution currently viable

---

## Executive Summary

After extensive research and implementation attempts, **there is currently no reliable, fully automated way to bulk export Perplexity conversations** due to:

1. **Unstable UI selectors** - Perplexity's DOM structure changes frequently
2. **No official API** - No documented endpoint for conversation data export
3. **Broken third-party tools** - Existing tools (perplexport) are outdated and non-functional
4. **Export button complexity** - Native export requires navigating nested menus with changing selectors

**Conclusion:** For 355 conversations, semi-automated or manual export remains the most practical approach.

---

## What We Attempted

### 1. Console Script (perplexity_bulk_export_console.js)
**Status:** ❌ Fundamentally broken
**Why it fails:**
- `window.location.href` navigation kills script execution
- No way to survive page reloads in browser console
- Cannot maintain state across multiple pages

**Verdict:** Console scripts cannot handle multi-page workflows

---

### 2. perplexport Tool (GitHub: leonid-shevtsov/perplexport)
**Status:** ❌ Broken due to UI changes
**What happened:**
- ✅ Successfully authenticated
- ✅ Found 355 conversations
- ❌ Stalled on first conversation export
- **Root cause:** Selector `[data-testid="thread-dropdown-menu"]` no longer exists

**Errors encountered:**
```
TimeoutError: Waiting for selector `div[data-testid="thread-title"]` failed
TimeoutError: No element found for selector: button::-p-text('Accept All Cookies')
TimeoutError: Waiting for selector `[data-testid="thread-dropdown-menu"]` failed
```

**Verdict:** Tool was working in 2025 but Perplexity UI has changed since then

---

### 3. Custom API-Based Exporter (perplexity-api-export.cjs)
**Status:** ⚠️ Partially implemented, login issues
**Approach:**
- Intercept network requests to capture API JSON responses
- Extract conversation data directly from Perplexity's internal APIs
- Fallback to DOM scraping if API data unavailable

**What we learned:**
- Perplexity may expose conversation data via GraphQL/REST APIs
- Network interception with Puppeteer is viable approach
- Login flow also has unstable selectors (`input[type="email"]` timeout)

**Verdict:** Promising approach but requires significant debugging of Perplexity's current UI

---

## Root Cause Analysis

### Why Automation Keeps Failing

1. **Perplexity actively develops their UI**
   - Selectors change without notice
   - No semantic HTML or stable data attributes
   - React/Next.js dynamic rendering

2. **No official export API**
   - Perplexity doesn't provide programmatic access to user data
   - Community has requested bulk export feature (unimplemented)
   - API exists only for search, not user conversations

3. **Authentication complexity**
   - Email-based OTP requires manual intervention
   - Session management across page navigations
   - Multiple authentication states to handle

4. **Export button buried in UI**
   - Three-dots menu → nested options
   - Menu selectors change frequently
   - Rate limiting on native export function

---

## Current State of Tools

| Tool | 2025 Status | Current Status | Reason |
|------|-------------|----------------|---------|
| Console script | ❌ Never worked | ❌ Still broken | Fundamental JS limitations |
| perplexport | ✅ Was working | ❌ Now broken | UI selector changes |
| Userscripts | ⚠️ Partial | ⚠️ Manual | Per-conversation only |
| Chrome extensions | ⚠️ Partial | ⚠️ Unknown | May also be broken |
| Official feature | ❌ Doesn't exist | ❌ Still absent | No bulk export |

---

## Practical Solutions (Ranked by Viability)

### Option 1: Semi-Automated Browser Extension ⭐ RECOMMENDED
**Tool:** [Perplexity to Notion - Batch Export](https://chromewebstore.google.com/detail/perplexity-to-notion-batc/gfmjaemghnjokjhafjiiijhllkkfcjpk)

**Pros:**
- Extension maintainers update for UI changes
- Batch export capability
- Downloads Markdown files
- Local processing (privacy)

**Cons:**
- May require some manual intervention
- Unclear if currently functional (needs testing)
- Possible Notion account requirement

**Time estimate:** 1-2 hours for 355 conversations

**Steps:**
1. Install extension from Chrome Web Store
2. Navigate to Perplexity library
3. Click batch export
4. Select all conversations
5. Download as Markdown

---

### Option 2: Perplexity Native Export (Manual)
**Estimated time:** 6-8 hours for 355 conversations
**Export rate:** ~45-60 per hour

**Process:**
1. Open conversation
2. Click three-dots menu (⋮)
3. Select "Export as Markdown"
4. Save file
5. Repeat

**Optimizations:**
- Use keyboard shortcuts if available
- Script mouse clicks with tools like AutoHotkey/Hammerspoon
- Export in batches with breaks

**Pros:**
- Guaranteed to work (official feature)
- Highest quality exports
- No dependency on third-party tools

**Cons:**
- Extremely time-consuming
- Risk of RSI from repetitive actions
- Mind-numbingly tedious

---

### Option 3: Fix perplexport Tool
**Estimated effort:** 4-8 hours development
**Maintenance:** Ongoing as UI changes

**What needs fixing:**
1. Update login selectors for current Perplexity UI
2. Find new selector for thread list
3. Find new selector for export menu
4. Handle authentication flow changes
5. Test and iterate

**Pros:**
- Open source, can maintain fork
- Fully automated once working
- Resume capability

**Cons:**
- Requires TypeScript/Puppeteer expertise
- Will break again with next UI update
- Time investment may not be worth it for one-time use

---

### Option 4: Build Custom API Scraper
**Estimated effort:** 8-16 hours development
**Maintenance:** High

**Approach:**
1. Manually authenticate and capture session cookies
2. Use browser DevTools to identify API endpoints
3. Reverse-engineer API requests
4. Build script to query API directly (bypass UI)
5. Handle pagination, rate limiting, auth refresh

**Pros:**
- More stable than UI scraping
- Faster export once working
- Can be reused

**Cons:**
- Significant development time
- API may also change
- Possible rate limiting/blocking
- May violate Terms of Service

---

### Option 5: Contact Perplexity Support
**Estimated time:** Unknown (days to weeks)

**Request:**
- Official bulk export feature
- API endpoint for user data
- One-time data dump

**Pros:**
- No technical work required
- Official, supported method
- May result in permanent feature

**Cons:**
- Unlikely to get response
- Feature request already exists (unfulfilled)
- No guarantee of timeline

---

## Recommendation for 355 Conversations

### Short-term (This week):
**Use Option 1: Perplexity to Notion Chrome Extension**

1. Install extension
2. Test with 5-10 conversations first
3. If working, run batch export
4. If broken, fall back to manual export in batches

**Rationale:**
- Lowest technical barrier
- Extensions are maintained by developers
- Batch capability reduces manual work
- Can test viability in 15 minutes

---

### Long-term (If this is recurring need):
**Invest in Option 4: Custom API Scraper**

1. Hire developer or allocate internal time
2. Reverse-engineer Perplexity's API
3. Build robust, maintainable tool
4. Schedule regular exports
5. Monitor for API changes

**Rationale:**
- One-time investment pays off over time
- More reliable than UI automation
- Can export incrementally (new conversations only)
- Useful if you regularly use Perplexity

---

## Alternative: Data Extraction from Browser

### Browser DevTools Approach
**Time:** 30-60 minutes per batch of ~20 conversations

**Process:**
1. Open Perplexity library
2. Open browser DevTools (F12)
3. Go to Network tab
4. Filter for XHR/Fetch requests
5. Navigate through conversations
6. Find API requests with conversation data
7. Copy JSON responses
8. Save manually
9. Convert JSON to Markdown offline

**Pros:**
- No coding required
- Works despite UI changes
- Direct access to API data

**Cons:**
- Still manual and tedious
- Requires technical knowledge
- Must process JSON separately

---

## Files Created During Research

1. `perplexity-bulk-export-console.js` - Original broken console script
2. `perplexity-programmatic-export-solution.md` - Initial research (outdated)
3. `console-script-failure-analysis.md` - Technical breakdown of console script limitations
4. `perplexity-export-analysis.md` - Early findings
5. `perplexity-export-summary.md` - Mid-research summary
6. `PERPLEXITY-EXPORT-QUICKSTART.md` - Instructions for perplexport (now broken)
7. `perplexport/` - Cloned repository with attempted fixes
8. `perplexity-api-export.cjs` - Custom API interceptor (incomplete)
9. `FINAL-PERPLEXITY-EXPORT-FINDINGS.md` - This document

---

## What Actually Works (Confirmed)

### ✅ Individual Manual Export
- Click three-dots → "Export as Markdown"
- **Confirmed working** as of 2025-10-09
- One conversation at a time

### ⚠️ Needs Testing
- Perplexity to Notion Chrome extension
- Save my Chatbot extension
- Userscript (Greasemonkey/Tampermonkey)

### ❌ Confirmed Broken
- perplexity_bulk_export_console.js
- perplexport (leonid-shevtsov)
- Our custom API exporter (login fails)

---

## Key Lessons Learned

1. **UI automation is fragile**
   - Selectors change without notice
   - Not viable for critical workflows
   - Requires ongoing maintenance

2. **Browser console scripts are inadequate**
   - Cannot survive page navigation
   - No state persistence
   - Only work for single-page operations

3. **Third-party tools lag behind**
   - perplexport was maintained but is now broken
   - Community tools can't keep up with UI changes
   - Open source doesn't guarantee longevity

4. **Perplexity doesn't prioritize export**
   - Feature requested since 2024
   - Still no bulk export option
   - No official API for user data

5. **For large datasets, manual may be fastest**
   - 6-8 hours of manual work vs. days of debugging
   - One-time task doesn't justify automation investment
   - Unless recurring need exists

---

## Next Steps

### Immediate Action (Choose One):

**A) Try Chrome Extension (15 minutes)**
```
1. Install: https://chromewebstore.google.com/detail/perplexity-to-notion-batc/gfmjaemghnjokjhafjiiijhllkkfcjpk
2. Open Perplexity library
3. Test batch export
4. If works → export all
5. If broken → proceed to Option B
```

**B) Manual Export in Batches (6-8 hours total)**
```
1. Set timer for 1-hour sessions
2. Export 45-60 conversations per session
3. Take 15-minute breaks
4. Spread across 2-3 days
5. Use keyboard shortcuts to speed up
```

**C) Hire Developer to Fix perplexport (1-2 weeks)**
```
1. Post job on Upwork/Fiverr
2. Budget: $200-500
3. Provide access to test account
4. Deliverable: Working export of all 355 conversations
5. Bonus: Maintain for future exports
```

---

## Conclusion

**There is no magic bullet for bulk exporting Perplexity conversations.**

The most practical path forward depends on:
- **One-time need:** Manual export or Chrome extension
- **Recurring need:** Invest in custom API scraper
- **Budget available:** Hire developer to fix/maintain tool

For your specific case (355 conversations, appears to be one-time):
1. ✅ **Try Perplexity to Notion extension** (15 min test)
2. ✅ **If broken, manual export in batches** (6-8 hours, spread over 2-3 days)
3. ❌ **Do not** spend more time debugging broken automation tools

The tedious reality: Sometimes manual work is faster than automation for one-time tasks.

---

## Resources

- **Community Feature Request**: https://community.perplexity.ai/t/feature-request-bulk-export-of-all-threaded-conversations/371
- **perplexport (broken)**: https://github.com/leonid-shevtsov/perplexport
- **Chrome Extension**: https://chromewebstore.google.com/detail/perplexity-to-notion-batc/gfmjaemghnjokjhafjiiijhllkkfcjpk
- **Our Implementation**: `dev-context/05-tasks/perplexport/` and `perplexity-api-export.cjs`

---

**Final verdict:** For 355 conversations, budget 8 hours for manual export as most reliable path. Consider automation only if this becomes a recurring need.
