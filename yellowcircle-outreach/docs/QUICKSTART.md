# yellowCircle Outreach - Quick Start Guide

Get up and running in 5 minutes.

---

## 1. Install Dependencies

```bash
cd yellowcircle-outreach
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Groq API key (FREE):

```bash
# Get free key: https://console.groq.com/keys
GROQ_API_KEY=gsk_your_key_here

# Optional: For sending emails
RESEND_API_KEY=re_your_key_here

# Your links
CALENDAR_LINK=https://calendly.com/your-link
ARTICLE_LINK=https://yellowcircle-app.web.app/thoughts/why-your-gtm-sucks
```

## 3. Test Connection

```bash
npm test
```

Should show:
```
✅ groq connected
```

## 4. Generate Your First Email

**Single prospect:**

```bash
node scripts/generate.js \
  --company "Acme Corp" \
  --contact "Jane" \
  --email "jane@acme.com" \
  --trigger "Series B funding"
```

**Batch from CSV:**

```bash
# Edit data/targets.csv first
node scripts/generate.js --batch data/targets.csv
```

## 5. Review Generated Emails

Check `output/` folder. Each file contains:

```json
{
  "prospect": { "company": "...", "email": "..." },
  "email": {
    "stage": "initial",
    "subject": "quick question about Acme's GTM",
    "body": "Hi Jane,..."
  },
  "status": "pending",
  "scheduledFor": "2025-11-26T..."
}
```

## 6. Send Emails

**Preview first:**

```bash
node scripts/send.js --preview
```

**Send initial emails:**

```bash
node scripts/send.js --stage initial
```

**Send follow-ups (when due):**

```bash
node scripts/send.js --stage followups
```

---

## Directory Structure

```
yellowcircle-outreach/
├── config/
│   ├── brand.js        # Your brand voice
│   └── templates.js    # Email templates
├── data/
│   ├── targets.csv     # Your prospect list
│   └── sent.json       # Sent email log
├── output/             # Generated emails
├── scripts/
│   ├── generate.js     # Generate emails
│   ├── send.js         # Send emails
│   └── test-connection.js
└── templates/          # Reference templates
```

---

## CSV Format

```csv
company,first_name,email,title,trigger,trigger_details
Acme Corp,Jane,jane@acme.com,VP Marketing,funding,Series B last week
```

**Required columns:** `company`, `first_name` (or `firstName`), `email`

**Optional:** `last_name`, `title`, `industry`, `trigger`, `trigger_details`

---

## Workflow

1. **Research** - Find prospects, note triggers
2. **Add to CSV** - `data/targets.csv`
3. **Generate** - `npm run generate:batch`
4. **Review** - Check `output/` files
5. **Send** - `npm run send --stage initial`
6. **Follow up** - Day 3 and Day 10 automatically scheduled

---

## Tips

- **Start small** - Test with 5-10 prospects first
- **Personalize triggers** - Generic emails get ignored
- **Review AI output** - Edit if needed before sending
- **Track responses** - Update `sent.json` manually for now

---

## Cost

| Service | Cost | Limits |
|---------|------|--------|
| Groq | FREE | 14,400 req/day |
| Resend | FREE | 100 emails/day |

**Total: $0/month for MVP scale**
