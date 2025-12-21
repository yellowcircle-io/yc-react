# Sample Campaign: Photography Studio (Headshot Outreach)

**Created:** December 20, 2025
**Client:** dash@dashkolos.com (Dash Kolos Photography)
**ESP:** Brevo (300/day, 9K/month)
**Status:** Ready for Execution

---

## Campaign Overview

**Target Audience:** Professionals and businesses that need headshots
- Law firms (partners, associates)
- Real estate agencies (agents, brokers)
- Financial advisors (wealth managers, CPAs)
- Consulting firms
- Tech startups (founder headshots)
- Corporate teams (LinkedIn profile updates)

**Goal:** Book headshot sessions at $250-500/session

---

## Journey Configuration

### Journey ID: `headshot-outreach-photography`

### Email Sequence (A/B/C Test)

#### Email A: Personal Introduction
**Subject:** Quick question about headshots

```
Hi{{#if name}} {{name}}{{else}} there{{/if}},

I came across {{#if company}}{{company}}{{else}}your firm{{/if}} and noticed your team might benefit from professional headshots.

I'm a professional photographer specializing in corporate headshots - the kind that make people look approachable AND professional on LinkedIn, company websites, and marketing materials.

What sets my work apart:
• 30-minute sessions (no all-day commitments)
• Same-day digital delivery
• Retouching included (tasteful - you'll still look like you)
• Indoor studio or on-location options

Would you be open to a quick call to see if this might be useful for you or your team?

Best,
Dash Kolos
Professional Headshot Photographer

P.S. - Happy to share some recent work if helpful. Just reply "portfolio" and I'll send it over.
```

#### Email B: Value Proposition
**Subject:** Your LinkedIn photo might be costing you clients

```
Hi{{#if name}} {{name}}{{else}} there{{/if}},

Here's something I see constantly with {{#if industry}}{{industry}}{{else}}professional services{{/if}} firms:

Amazing work. Great reputation. But LinkedIn photos that look like they were taken in 2015 with an iPhone 4.

Why it matters: Studies show that profiles with professional headshots get 14x more profile views and 36x more messages.

For {{#if company}}{{company}}{{else}}your firm{{/if}}, that could mean:
• More inbound leads finding you credible at first glance
• Clients choosing you over competitors with outdated photos
• A team that looks cohesive and professional online

I offer headshot sessions specifically designed for busy professionals:
→ 30 minutes in-studio or at your office
→ 5+ retouched images delivered same day
→ Team packages available (groups of 3+)

Interested in seeing what this could look like for your team?

Best,
Dash Kolos
Professional Headshot Photographer

Book a call: [Cal.com link]
```

#### Email C: Direct Offer
**Subject:** Quick headshot session this month?

```
Hi{{#if name}} {{name}}{{else}} there{{/if}},

I'll be direct: if your team's headshots are already polished and consistent, feel free to ignore this.

But if:
→ Some team members don't have professional photos yet
→ Photos are inconsistent across LinkedIn, website, and email signatures
→ It's been more than 2-3 years since the last update

Then a quick 30-minute session could be worth your time.

I'm offering a special rate for {{#if industry}}{{industry}}{{else}}local{{/if}} professionals this month: $350/person (normally $450), includes:
• 30-minute session
• 5+ retouched images
• Same-day delivery
• Indoor studio or on-location

Team of 3+? I'll throw in an extra 2 images per person.

Book here: [Cal.com link]

Best,
Dash Kolos
Professional Headshot Photographer

P.S. - Not the right time? Just reply "later" and I'll follow up in 6 months.
```

---

## Firestore Journey Document

```javascript
{
  id: "headshot-outreach-photography",
  title: "Headshot Photography Outreach",
  description: "Cold outreach for headshot-ready businesses: law firms, real estate, financial advisors, consulting. A/B/C test with random initial email.",
  status: "active",
  clientId: "dash@dashkolos.com",

  config: {
    version: "2.0",
    testMode: "abc_split",
    throttle: {
      maxPerDay: 50,  // Brevo allows 300/day, conservative start
      requireVerification: false
    },
    followUpMode: "engagement_only",
    conversionAction: "booking"
  },

  emailVariants: {
    A: {
      subject: "Quick question about headshots",
      body: "...",
      label: "Personal Introduction"
    },
    B: {
      subject: "Your LinkedIn photo might be costing you clients",
      body: "...",
      label: "Value Proposition"
    },
    C: {
      subject: "Quick headshot session this month?",
      body: "...",
      label: "Direct Offer"
    }
  },

  followUp: {
    enabled: true,
    triggerOn: ["clicked", "opened"],
    delayDays: 3,
    email: {
      subject: "Following up on headshots",
      body: "..."
    }
  },

  sender: {
    name: "Dash Kolos",
    email: "dash@dashkolos.com",
    replyTo: "dash@dashkolos.com"
  }
}
```

---

## Prospect Sources

### 1. Headshot Prospects (Already Imported)
- 36 headshot prospects imported Dec 19
- Sources: Google Places (law firms, real estate, financial advisors in SF, LA, NYC)

### 2. Additional Sources to Import
- LinkedIn Sales Navigator (industry filters)
- Local Chamber of Commerce directories
- Real estate association member lists
- Bar association directories

---

## Campaign Metrics to Track

| Metric | Target | Tracking |
|--------|--------|----------|
| Open Rate | >25% | handleResendWebhook |
| Click Rate | >3% | handleResendWebhook |
| Reply Rate | >2% | Manual tracking |
| Booking Rate | >0.5% | Cal.com webhooks |
| Revenue/Email | >$1.25 | (Target: $250 session / 200 emails) |

---

## Execution Steps

### Phase 1: Setup (Completed)
- [x] Brevo ESP configured for dash@dashkolos.com
- [x] 36 headshot prospects imported
- [x] Email tracking webhook active

### Phase 2: Launch (Ready)
1. Create journey document in Firestore
2. Enroll 36 prospects
3. Start with 10/day throttle
4. Monitor deliverability

### Phase 3: Scale (After Week 1)
1. Review open/click rates by variant
2. Increase throttle to 30/day
3. Import additional prospects
4. A/B test subject lines

---

## API Calls to Execute

### 1. Create Journey (Admin required)
```bash
# Seed the journey via Firebase Function
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/seedHeadshotJourney" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [FIREBASE_ID_TOKEN]" \
  -d '{"clientId": "dash@dashkolos.com"}'
```

### 2. Enroll Prospects
```bash
# Enroll headshot prospects in journey
curl -X POST "https://us-central1-yellowcircle-app.cloudfunctions.net/enrollContactsInJourneys" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [FIREBASE_ID_TOKEN]" \
  -d '{
    "journeyId": "headshot-outreach-photography",
    "prospectType": "headshot",
    "limit": 36
  }'
```

### 3. Dry Run (Test without sending)
```bash
curl "https://us-central1-yellowcircle-app.cloudfunctions.net/processOutboundJourneys?dryRun=true&journeyId=headshot-outreach-photography"
```

### 4. Live Send
```bash
curl "https://us-central1-yellowcircle-app.cloudfunctions.net/processOutboundJourneys?dryRun=false&journeyId=headshot-outreach-photography"
```

---

## Notes

- **Sender Verification:** Dash needs to verify `dash@dashkolos.com` in Brevo before sending
- **SPF/DKIM:** Domain DNS records required for deliverability
- **Unsubscribe:** Brevo automatically adds unsubscribe link
- **Cal.com Integration:** Dash should set up a Cal.com booking page

---

## Next Steps for User

1. **Verify sender** in Brevo dashboard
2. **Set up Cal.com** booking page for headshot consultations
3. **Approve campaign copy** (review emails above)
4. **Trigger dry run** to test
5. **Go live** with 10/day throttle
