# Valentine's Day 2025 Campaign Workflow Test

## Overview
End-to-end test of Unity Generator → UnityMAP workflow for Valentine's Day campaign creation.

## Test Date: January 9, 2026

---

## Workflow Steps Completed

### Step 1: Unity Generator Configuration
- **Email Type**: MarCom (Marketing Communications)
- **Pathway**: Journey Build (Deploy to UnityMAP)

### Step 2: Prospect Information
| Field | Value |
|-------|-------|
| Company | Heartfelt Gifts Co |
| Contact | Sarah Valentine |
| Email | sarah@heartfeltgifts.com |
| Title | Marketing Director |
| Industry | E-commerce |
| Trigger | Company News/Announcement |

### Step 3: Campaign Details
**Valentine's Day 2025 Campaign**
- Launching Feb 14th promotion
- 25% off all gift packages
- Personalized love letters service
- Same-day delivery for last-minute shoppers
- Target audience: couples, gift-givers, corporate gifting

### Step 4: Journey Build Plan
The system will generate:
1. **Welcome email** (Day 0) - Initial campaign announcement
2. **Follow-up with content** (Day 3) - Additional value/engagement
3. **Final nurture** (Day 10) - Closing offer/reminder
4. **Deploy to UnityMAP** for orchestration

---

## Blockers Identified

### API Key Required
- Generator requires LLM API key (Groq/OpenAI/Claude) to generate content
- Keys available from:
  - Groq (free): https://console.groq.com/keys
  - OpenAI: https://platform.openai.com/api-keys
  - Claude: https://console.anthropic.com

---

## Screenshots Captured
1. `valentine-campaign-step1-prospect-info.png` - Form with prospect data
2. `valentine-campaign-step2-ready-to-generate.png` - Journey build summary
3. `valentine-campaign-api-key-needed.png` - API key requirement

---

## Next Steps
1. Add LLM API key to complete email generation
2. Deploy generated sequence to UnityMAP
3. Create visual collateral in UnitySTUDIO
4. Test full end-to-end campaign deployment

---

## Workflow Assessment

### What Works Well
- Clear step-by-step flow from Generator
- Good prospect information capture
- Journey Build pathway clear about email schedule
- Integration path to UnityMAP defined

### Recommendations
- Consider adding test/demo mode without API key
- Pre-populate Valentine's Day template options
- Add seasonal campaign templates (Valentine's, Black Friday, etc.)
