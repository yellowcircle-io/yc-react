/**
 * Email Templates Configuration
 * Based on NextPlay.so 3-part cold email structure
 */

const TEMPLATES = {
  // Initial cold email - first touch
  initial: {
    name: 'Initial Outreach',
    stage: 'initial',
    day: 0,
    subjectOptions: [
      'quick question about {{company}}\'s GTM',
      '{{company}}\'s GTM alignment',
      'noticed {{company}} is scaling',
      'question for {{firstName}}'
    ],
    template: `Hi {{firstName}},

{{trigger}}

I help B2B companies fix misaligned sales/marketing stacks. Recently helped a similar company identify $2.5M in hidden operational costs and reduce attribution setup time by 60%.

Two questions:
1. Is GTM alignment a current priority at {{company}}?
2. Who handles marketing ops strategy there?

Either way, happy to share the audit framework I use (free).

— Chris`,
    variables: ['firstName', 'company', 'trigger'],
    maxWords: 150
  },

  // First follow-up - add value with diagnostic
  followUp1: {
    name: 'Follow-up 1: Diagnostic',
    stage: 'followup1',
    day: 3,
    subjectOptions: [
      'Re: quick question about {{company}}\'s GTM',
      'quick diagnostic for {{company}}',
      'following up'
    ],
    template: `Hi {{firstName}},

Following up on my note about GTM alignment.

Here's a quick diagnostic I use with clients:
- Can you trace a closed deal back to the marketing touch that sourced it?
- How long does your monthly attribution report take?
- Do sales and marketing agree on lead qualification criteria?

If any of those made you wince, might be worth a 15-minute call.

— Chris`,
    variables: ['firstName', 'company'],
    maxWords: 100
  },

  // Final follow-up - close the loop with resources
  followUp2: {
    name: 'Follow-up 2: Final + Resources',
    stage: 'followup2',
    day: 10,
    subjectOptions: [
      'last note on GTM audit',
      'closing the loop',
      'resource for {{company}}'
    ],
    template: `Hi {{firstName}},

Last ping on this — don't want to be spammy.

If GTM operations isn't a priority right now, no worries. If it becomes one, here's my calendar: {{calendarLink}}

Also wrote this recently: "Why Your GTM Sucks" — covers the patterns I see across most B2B orgs. {{articleLink}}

Good luck with {{company}}'s growth.

— Chris`,
    variables: ['firstName', 'company', 'calendarLink', 'articleLink'],
    maxWords: 80
  },

  // Warm intro (when someone refers you)
  warmIntro: {
    name: 'Warm Introduction',
    stage: 'warm',
    day: 0,
    subjectOptions: [
      '{{referrer}} suggested I reach out',
      'intro from {{referrer}}'
    ],
    template: `Hi {{firstName}},

{{referrer}} mentioned you're working on {{challenge}} at {{company}}.

I just wrapped a similar project — helped a company fix their attribution system and uncover $2.5M in hidden ops costs. {{referrer}} thought my experience might be relevant.

Worth a 15-minute call to see if there's fit?

— Chris`,
    variables: ['firstName', 'company', 'referrer', 'challenge'],
    maxWords: 100
  },

  // LinkedIn follow-up (after they accept connection)
  linkedinFollowUp: {
    name: 'LinkedIn Follow-up',
    stage: 'linkedin',
    day: 0,
    subjectOptions: [
      'following up on LinkedIn',
      'thanks for connecting'
    ],
    template: `Hi {{firstName}},

Thanks for connecting on LinkedIn.

Your post about {{topic}} caught my eye — especially {{specificPoint}}.

I work with B2B companies on exactly this. Most are dealing with:
- Attribution systems that don't actually attribute
- Sales and marketing pointing fingers
- Marketing ops spending 80% of time on fire drills

If any of that resonates, happy to share what's working for my clients.

— Chris`,
    variables: ['firstName', 'topic', 'specificPoint'],
    maxWords: 120
  },

  // Post-meeting follow-up
  postMeeting: {
    name: 'Post-Meeting Follow-up',
    stage: 'post-meeting',
    day: 0,
    subjectOptions: [
      'next steps from our call',
      'following up on our conversation'
    ],
    template: `Hi {{firstName}},

Good talking today. Quick summary:

**What we discussed:**
{{summary}}

**Recommended next step:**
{{nextStep}}

I'll send over a GTM Assessment proposal by {{proposalDate}}. The audit typically runs $4K and takes 2-3 weeks.

Let me know if you have questions before then.

— Chris`,
    variables: ['firstName', 'summary', 'nextStep', 'proposalDate'],
    maxWords: 120
  }
};

// Response templates
const RESPONSES = {
  positive: {
    meetingRequest: `Great — here's my calendar: {{calendarLink}}

Looking forward to it.

— Chris`,
    tellMeMore: `Happy to elaborate.

Quick summary of what I do:
- GTM Strategic Audit ($4K) — find hidden costs and misalignment
- Implementation Support (custom) — help fix what the audit uncovers

Most clients start with the audit. Takes 2-3 weeks, delivers a 10-15 page report with prioritized recommendations.

Worth a quick call to see if it fits your situation?

— Chris`
  },

  referral: {
    askForIntro: `Perfect — thanks for the pointer.

Would you mind making an intro, or should I reach out cold and mention you suggested it?

— Chris`
  },

  softNo: {
    notRightNow: `Totally understand — timing is everything.

Mind if I check back in {{timeframe}}?

Good luck with everything at {{company}}.

— Chris`
  },

  hardNo: {
    notInterested: `Appreciate the directness. Removing you from my list.

Best of luck with {{company}}.

— Chris`
  }
};

module.exports = {
  TEMPLATES,
  RESPONSES
};
