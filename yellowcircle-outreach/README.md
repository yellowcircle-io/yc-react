# yellowCircle Outreach System

**AI-powered cold outreach automation for GTM consulting**

Built for Christopher Cooper's consulting practice. Generates personalized cold emails using the NextPlay.so framework and sends via modern email infrastructure.

---

## Quick Start

```bash
cd yellowcircle-outreach
cp .env.example .env
# Add GROQ_API_KEY (free at console.groq.com)
npm install

# Generate single email
node scripts/generate.js --company "Acme Corp" --contact "Jane" --email "jane@acme.com" --trigger "Series B"

# Generate batch from CSV
node scripts/generate.js --batch data/targets.csv
```

---

## System Overview

```
Target Companies (CSV/Manual)
    ↓
AI Content Generation (Groq FREE / OpenAI)
    ↓
Personalized Cold Emails (NextPlay.so 3-part structure)
    ↓
Follow-up Sequences (Day 0, Day 3, Day 10)
    ↓
Response Tracking
```

---

## Directory Structure

```
yellowcircle-outreach/
├── README.md                 # This file
├── package.json              # Dependencies
├── .env.example              # Environment template
├── config/
│   ├── brand.js              # yellowCircle brand voice
│   └── templates.js          # Email template configs
├── components/
│   ├── Header.jsx            # Email header component
│   ├── Body.jsx              # Email body component
│   └── Footer.jsx            # Email footer component
├── lib/
│   ├── generator.js          # AI content generation
│   ├── renderer.js           # Email HTML rendering
│   └── sender.js             # Email sending (Resend)
├── scripts/
│   ├── generate.js           # Generate emails CLI
│   ├── send.js               # Send emails CLI
│   └── track.js              # Track responses
├── templates/
│   ├── initial.md            # First touch template
│   ├── followup-1.md         # Day 3 follow-up
│   └── followup-2.md         # Day 10 follow-up
├── data/
│   ├── targets.csv           # Prospect list
│   └── sent.json             # Sent email log
├── output/                   # Generated emails
└── docs/
    └── FRAMEWORK.md          # NextPlay.so framework docs
```

---

## The NextPlay.so Framework

Every cold email follows a 3-part structure:

### 1. Who You Are (1 sentence)
Brief, credible introduction with specific credential.

### 2. Why You're Reaching Out (1-2 sentences)
Specific trigger about their company (funding, hiring, news).

### 3. Why They Should Care (2-3 sentences)
Clear value proposition + specific, easy-to-answer ask.

### Rules
- **< 200 words** total
- **No jargon** — write like you speak
- **Specific ask** — question or meeting request
- **No fake personalization** — real research only
- **1-2 follow-ups max** — not spam

---

## Email Templates

### Initial (Day 0)

```
Subject: quick question about {{company}}'s GTM

Hi {{firstName}},

{{trigger}}

I help B2B companies fix misaligned sales/marketing stacks. Recently
helped a similar company identify $2.5M in hidden operational costs
and reduce attribution setup time by 60%.

Two questions:
1. Is GTM alignment a current priority at {{company}}?
2. Who handles marketing ops strategy there?

Either way, happy to share the audit framework I use (free).

— Chris
```

### Follow-up 1 (Day 3)

```
Subject: Re: quick question about {{company}}'s GTM

Hi {{firstName}},

Following up on my note about GTM alignment.

Here's a quick diagnostic I use with clients:
- Can you trace a closed deal back to the marketing touch that sourced it?
- How long does your monthly attribution report take?
- Do sales and marketing agree on lead qualification criteria?

If any of those made you wince, might be worth a 15-minute call.

— Chris
```

### Follow-up 2 (Day 10)

```
Subject: last note on GTM audit

Hi {{firstName}},

Last ping on this — don't want to be spammy.

If GTM operations isn't a priority right now, no worries.
If it becomes one, here's my calendar: {{calendarLink}}

Also wrote this recently: "Why Your GTM Sucks" — covers the
patterns I see across most B2B orgs. {{articleLink}}

Good luck with {{company}}'s growth.

— Chris
```

---

## Configuration

### Environment Variables

```bash
# LLM Provider (groq recommended - FREE)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here

# Email Sending (optional)
RESEND_API_KEY=re_your_key_here
FROM_EMAIL=chris@yellowcircle.co
FROM_NAME=Chris Cooper

# Links
CALENDAR_LINK=https://calendly.com/your-link
ARTICLE_LINK=https://yellowcircle-app.web.app/thoughts/why-your-gtm-sucks
```

### Brand Configuration

Edit `config/brand.js` to customize:
- Voice and tone
- Key credentials
- Value propositions
- Things to avoid

---

## Usage

### Generate Single Email

```bash
node scripts/generate.js \
  --company "Acme Corp" \
  --contact "Jane Doe" \
  --email "jane@acme.com" \
  --trigger "Series B funding" \
  --triggerDetails "Announced $25M last week"
```

### Generate Batch

```bash
# From CSV
node scripts/generate.js --batch data/targets.csv

# Preview only (no save)
node scripts/generate.js --batch data/targets.csv --preview
```

### Send Emails

```bash
# Preview what would be sent
node scripts/send.js --preview

# Send initial emails only
node scripts/send.js --stage initial

# Send due follow-ups
node scripts/send.js --stage followups
```

---

## Metrics & Tracking

### Target Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Open Rate | > 50% | Subject line quality |
| Reply Rate | > 10% | Email + targeting quality |
| Meeting Rate | > 3% | Offer relevance |
| Conversion | > 1% | Paid engagements |

### Response Categories

- **Positive**: Meeting booked, interested reply
- **Negative**: Not interested, unsubscribe
- **Neutral**: Questions, referral
- **No Response**: After full sequence

---

## Cost

| Service | Cost | Limits |
|---------|------|--------|
| Groq AI | FREE | 14,400 req/day |
| Resend | FREE | 100 emails/day, 3K/month |
| **Total** | **$0/month** | For MVP scale |

### Paid Upgrades (If Needed)

- Resend Pro: $20/month (50K emails)
- OpenAI GPT-4: ~$5/month (better personalization)

---

## Integration with 60-Day Revenue Plan

| Week | Activity | Volume |
|------|----------|--------|
| 1-2 | Setup + first batch | 20 emails |
| 3-4 | Scale outreach | 50 emails |
| 5-8 | Continue + iterate | 100+ emails |

**Target:** 5-10 discovery calls from 100 outreach emails

---

## License

MIT - Christopher Cooper / yellowCircle
