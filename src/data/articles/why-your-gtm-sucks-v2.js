/**
 * "Why Your GTM Sucks" - Block-based version
 *
 * This is a duplicate of the original OwnYourStoryArticle1Page,
 * converted to block-based data structure for validation.
 *
 * Compare: /thoughts/why-your-gtm-sucks (original JSX)
 * vs: /thoughts/why-your-gtm-sucks-v2 (block-based renderer)
 */

export const WHY_YOUR_GTM_SUCKS_V2 = {
  id: 'why-your-gtm-sucks-v2',
  slug: 'why-your-gtm-sucks-v2',
  title: 'Why Your GTM Sucks',
  excerpt: 'The Human Cost of Operations Theater',
  category: 'own-your-story',
  tags: ['gtm', 'operations', 'leadership', 'strategy'],
  author: 'yellowCircle',
  readingTime: 12,
  status: 'published',
  contentSource: 'blocks',
  blocks: [
    // Hero
    {
      type: 'hero',
      seriesLabel: 'OWN YOUR STORY',
      title: 'Why Your GTM Sucks',
      subtitle: 'The Human Cost of Operations Theater',
      readingTime: 12,
      date: 'November 2025',
      author: 'yellowCircle'
    },

    // Lead paragraph
    {
      type: 'lead-paragraph',
      highlight: "Let's be direct:",
      content: "Your go-to-market operations are likely failing. Not because of the tools you're using—because of the gap between what those tools promise and how your organization actually runs."
    },

    // Supporting paragraph
    {
      type: 'paragraph',
      muted: true,
      content: 'This isn\'t another pitch for a new platform. This is about the people burning out in the space between "what the demo showed" and "what we actually got."'
    },

    // Section 1: The Numbers
    {
      type: 'section-header',
      number: '01',
      title: "The Numbers Don't Lie"
    },

    // Stats
    {
      type: 'stat-grid',
      stats: [
        { value: '68%', label: 'of MarTech capabilities go unused', source: 'Gartner, 2024' },
        { value: '$30B', label: 'wasted annually on unused SaaS', source: 'Zylo Report' },
        { value: '47%', label: 'of ops professionals report burnout', source: 'MOPs Industry Survey' }
      ]
    },

    {
      type: 'paragraph',
      muted: true,
      content: "These aren't abstractions. They represent real people—marketing operations managers, data analysts, attribution specialists—caught in the crossfire of organizational dysfunction disguised as technology problems."
    },

    // Section 2: Operations Theater
    {
      type: 'section-header',
      number: '02',
      title: 'What Is Operations Theater?'
    },

    {
      type: 'paragraph',
      muted: true,
      content: "Operations Theater is the gap between your GTM presentation layer and operational reality. It's:"
    },

    {
      type: 'bullet-list',
      items: [
        'Dashboards that look impressive but show different numbers than reality',
        'Integration announcements that mask months of manual workarounds',
        'Quarterly reviews celebrating "automation wins" while teams work weekends',
        'Attribution models that serve political narratives, not truth'
      ]
    },

    {
      type: 'quote',
      content: "I spend 60% of my time making spreadsheets that make our automation look like it's working. The other 40% is doing the automation manually.",
      author: 'Anonymous MOPs Manager, Series B Startup'
    },

    // Section 3: The Human Cost
    {
      type: 'section-header',
      number: '03',
      title: 'The Human Cost'
    },

    {
      type: 'paragraph',
      muted: true,
      content: 'Behind every "GTM strategy refresh" is a person. Let\'s meet them:'
    },

    // Persona cards
    {
      type: 'persona-card',
      name: 'Alex',
      role: 'Marketing Operations Manager',
      description: 'Promised "full visibility across the funnel." Reality: maintains 14 spreadsheets to reconcile what the CRM says versus what\'s real. Spends Sundays fixing data before Monday\'s leadership sync.',
      cost: '15+ hours/week on reconciliation. Considering leaving the field.'
    },

    {
      type: 'persona-card',
      name: 'Jordan',
      role: 'Marketing Data Analyst',
      description: 'Hired to "unlock insights from our data infrastructure." Reality: spends 80% of time cleaning data that should have been structured correctly at intake.',
      cost: 'Zero strategic analysis. Team sees them as "slow" when they\'re drowning.'
    },

    {
      type: 'persona-card',
      name: 'Casey',
      role: 'Attribution Specialist',
      description: 'Tasked with "single source of truth for channel performance." Reality: maintains three different attribution models—one for Sales, one for Marketing leadership, one that\'s actually accurate (kept private).',
      cost: 'Credibility erosion. "The numbers person" is now seen as political.'
    },

    // Section 4: The Real Problem
    {
      type: 'section-header',
      number: '04',
      title: 'The Real Problem'
    },

    {
      type: 'paragraph',
      muted: true,
      content: "Your GTM isn't broken because you picked the wrong CRM. It's broken because:"
    },

    {
      type: 'numbered-list',
      highlighted: true,
      items: [
        { title: 'Process gaps are blamed on tools', description: 'Instead of fixing workflows, you buy new software.' },
        { title: 'Org chart friction is invisible', description: "Sales and Marketing incentives are misaligned—tools can't fix that." },
        { title: 'Technical debt compounds silently', description: 'Every workaround creates two more. Nobody budgets for cleanup.' },
        { title: 'Truth-telling is disincentivized', description: 'The people who see the problems are punished for raising them.' }
      ]
    },

    // Section 5: What Now
    {
      type: 'section-header',
      number: '05',
      title: 'What Now?'
    },

    {
      type: 'paragraph',
      muted: true,
      content: 'Stop buying tools to fix organizational problems. Start with:'
    },

    {
      type: 'action-grid',
      items: [
        { icon: '🔍', title: 'Audit Honestly', description: 'Map what actually happens, not what should happen. Interview the people doing the work.' },
        { icon: '📊', title: 'Quantify Technical Debt', description: 'How many hours/week are spent on workarounds? Put a dollar figure on it.' },
        { icon: '🎯', title: 'Align Incentives First', description: 'Before implementing any new tool, ensure Sales and Marketing are measured on shared outcomes.' },
        { icon: '🛡️', title: 'Protect Truth-Tellers', description: 'Create safe channels for ops people to flag problems without career risk.' }
      ]
    },

    // Callout box
    {
      type: 'callout-box',
      title: 'The Bottom Line',
      content: "Your GTM problems aren't tool problems.\nThey're people problems disguised as tool problems.\n\nThe data shows the symptoms. The people are paying the price. Own your story. Fix the org chart. Or keep buying tools and watching people quit.",
      highlight: 'Your choice.'
    },

    // CTA section
    {
      type: 'cta-section',
      prompt: 'Ready to stop the theater?',
      buttons: [
        { label: 'Take the GTM Health Assessment', link: '/assessment', primary: true },
        { label: 'Explore Our Services', link: '/services', primary: false }
      ]
    },

    // Sources
    {
      type: 'sources',
      sources: [
        'Gartner Marketing Technology Survey, 2024',
        'Zylo SaaS Management Report, 2024',
        'Marketing Operations Professional Association Industry Survey, 2024',
        'Internal interviews with 20+ MOPs professionals across B2B SaaS'
      ]
    }
  ]
};

export default WHY_YOUR_GTM_SUCKS_V2;
