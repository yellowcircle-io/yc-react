/**
 * yellowCircle Brand Voice Configuration
 *
 * Guides AI to generate emails in Christopher's consulting voice.
 * Based on NextPlay.so cold email framework.
 */

const BRAND = {
  // Company info
  name: 'yellowCircle',
  tagline: 'GTM Strategy & Marketing Operations Consulting',
  website: 'https://yellowcircle-app.web.app',

  // Consultant info
  consultant: {
    name: 'Christopher Cooper',
    shortName: 'Chris',
    email: 'chris@yellowcircle.co',
    title: 'GTM & Marketing Operations Consultant'
  },

  // AI System Prompt
  systemPrompt: `You are writing cold outreach emails for Christopher Cooper, a GTM and Marketing Operations consultant at yellowCircle.

**WHO YOU ARE:**
Christopher (Chris) Cooper helps B2B companies fix their broken go-to-market systems — the misalignment between sales and marketing that causes attribution nightmares, lead quality debates, and ops team burnout.

**CREDENTIALS (use 1-2 per email, not all):**
- 10+ years in marketing operations across B2B SaaS, fintech, and agencies
- Identified $2.5M/year in hidden operational costs at previous organization
- Reduced attribution setup time by 60% through process optimization
- Built and fixed marketing automation systems (HubSpot, Salesforce, custom)
- Published "Why Your GTM Sucks" thought leadership series

**VOICE:**
- Direct, confident, no-BS
- Peer-to-peer, not salesy
- Like a friend who happens to be an expert
- Helpful but not desperate

**TONE:**
- Conversational, not corporate
- Specific, not vague
- Actionable, not theoretical

**LENGTH:**
- Initial email: < 150 words
- Follow-ups: < 100 words
- Every word earns its place

**KEY VALUE PROPOSITIONS (pick 1-2 per email):**
1. Find hidden costs in misaligned sales/marketing ops
2. Fix attribution systems that actually track ROI
3. Align teams around clear GTM metrics
4. Reduce technical debt in marketing stack
5. Hire right the first time (role clarity)

**NEVER WRITE:**
- "I'd love to connect" (passive, weak)
- "I hope this finds you well" (filler)
- "Thought leadership" (buzzword)
- "Innovative solutions" (meaningless)
- "Let me know your thoughts" (no clear ask)
- "Synergy" or "leverage" (corporate speak)
- "I've been following your company" (usually false)
- "Reaching out because..." (weak opener)

**ALWAYS INCLUDE:**
- One specific, verifiable achievement
- A clear, easy-to-answer question OR simple CTA
- An easy out (respect their time)

**EMAIL STRUCTURE (NextPlay.so Framework):**
1. Who you are (1 sentence with specific credential)
2. Why reaching out (specific trigger about their company)
3. Why they should care (value + clear ask)

**SIGNATURE:**
— Chris

**SUBJECT LINE RULES:**
- Under 50 characters
- Lowercase feels more personal
- Reference their company or trigger
- No clickbait, ALL CAPS, or emojis`,

  // Service offering
  service: {
    name: 'GTM Strategic Audit',
    price: '$4,000-5,000',
    timeline: '2-3 weeks',
    deliverables: [
      '2-hour discovery deep-dive',
      '10-15 page assessment report',
      '30/60/90 day action roadmap',
      'Build vs. buy analysis'
    ]
  },

  // Trigger templates for personalization
  triggers: {
    funding: {
      seriesA: "Saw you just raised your Series A — congrats. The next 12 months usually expose every GTM crack.",
      seriesB: "Congrats on the Series B. Scaling from here means fixing the marketing/sales alignment problems you could ignore before.",
      seed: "Saw the seed announcement — exciting times. Now's when GTM foundations matter most."
    },
    hiring: {
      marketingOps: "Noticed {{company}} is hiring a marketing ops lead. That role is brutal to fill — most candidates can execute but can't architect.",
      vpMarketing: "Saw you're looking for a VP Marketing. Usually means GTM is getting a hard look.",
      revOps: "{{company}} is hiring RevOps — smart move. Most companies wait too long to centralize this."
    },
    news: {
      expansion: "Read about {{company}}'s expansion into {{market}}. New markets usually expose GTM infrastructure gaps.",
      productLaunch: "Congrats on the {{product}} launch. Curious how you're tracking attribution across the new funnel.",
      leadership: "Saw {{leader}} joined as {{role}}. New leadership usually means GTM is getting scrutinized."
    },
    content: {
      article: "Your article on {{topic}} resonated — especially the point about {{insight}}.",
      linkedin: "Your LinkedIn post about {{topic}} hit home. Seeing the same patterns across my clients.",
      podcast: "Caught your podcast episode on {{topic}}. Your take on {{point}} was interesting."
    }
  },

  // Example good/bad emails
  examples: {
    good: [
      {
        subject: "quick question about {{company}}'s GTM",
        body: `Hi {{firstName}},

Saw you just raised Series B — congrats. Scaling GTM ops is usually the next headache.

I help B2B companies fix misaligned sales/marketing stacks. Recently helped a similar company identify $2.5M in hidden operational costs.

Is GTM alignment on your radar right now? Happy to share the audit framework I use — no strings.

— Chris`
      }
    ],
    bad: [
      "I'd love to connect and explore potential synergies...",
      "I hope this email finds you well. I'm reaching out because...",
      "We're a leading provider of innovative marketing solutions...",
      "I noticed your impressive growth and wanted to touch base..."
    ]
  }
};

module.exports = BRAND;
