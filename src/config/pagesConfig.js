/**
 * Shared Pages Configuration
 *
 * Single source of truth for all pages across yellowCircle.
 * Used by DirectoryPage and SitemapPage to stay in sync.
 *
 * Status Values:
 * - 'live': Page is complete and deployed
 * - 'in-progress': Currently being developed
 * - 'draft': Initial development, not ready
 * - 'issue': Has known issues/bugs to fix
 *
 * When adding new pages:
 * 1. Add route to RouterApp.jsx
 * 2. Add entry here with all fields
 * 3. Both Directory and Sitemap will automatically update
 */

export const PAGES_CONFIG = [
  // Main Pages
  {
    name: 'Home',
    path: '/',
    category: 'Main',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Homepage with horizontal scrolling and interactive navigation',
    icon: '🏠'
  },
  {
    name: 'Services',
    path: '/services',
    category: 'Main',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Creative Growth Operations - infrastructure audits, systems assessment, technical debt',
    icon: '⚡'
  },
  {
    name: 'About',
    path: '/about',
    category: 'Main',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'About yellowCircle studio - Creative Growth Operations',
    icon: '👤'
  },
  {
    name: 'Works',
    path: '/works',
    category: 'Main',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Studio work with companies like Rho, Reddit, Estée Lauder, AuditBoard',
    icon: '💼'
  },
  {
    name: 'Hands',
    path: '/hands',
    category: 'Main',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Creative projects and hands-on work',
    icon: '🎨'
  },
  {
    name: 'Thoughts',
    path: '/thoughts',
    category: 'Main',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Essays, articles, and thought leadership content',
    icon: '💭'
  },
  {
    name: 'Experiments',
    path: '/experiments',
    category: 'Main',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Collection of interactive experiments and creative projects',
    icon: '🧪'
  },

  // Services Sub-routes
  {
    name: 'Growth Infrastructure Audit',
    path: '/services/growth-audit',
    category: 'Services',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Comprehensive growth infrastructure assessment ($4K-5K)',
    icon: '🎯'
  },
  {
    name: 'Marketing Systems',
    path: '/services/marketing-systems',
    category: 'Services',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'HubSpot, Salesforce, marketing automation platform audit ($2.5K-4K)',
    icon: '⚙️'
  },
  {
    name: 'Technical Debt',
    path: '/services/technical-debt',
    category: 'Services',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Quantify hidden costs dragging down operations ($2.5K-3.5K)',
    icon: '💰'
  },
  {
    name: 'Attribution Audit',
    path: '/services/attribution-audit',
    category: 'Services',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Single source of truth for channel attribution ($2K-3K)',
    icon: '📈'
  },
  {
    name: 'Data Architecture',
    path: '/services/data-architecture',
    category: 'Services',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Diagnose data lag, sync errors, schema issues ($3K-4K)',
    icon: '🔄'
  },
  {
    name: 'Creative + Operations',
    path: '/services/creative-operations',
    category: 'Services',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Email development, CRM standardization, brand templates (Custom)',
    icon: '🎨'
  },
  {
    name: 'Email Development',
    path: '/services/email-development',
    category: 'Services',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Custom responsive email templates ($500+)',
    icon: '📧'
  },

  // Works Sub-routes (Company Detail Pages)
  {
    name: 'Rho Technologies',
    path: '/works/rho',
    category: 'Works',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'B2B fintech - Embedded Partnership (2024-2025)',
    icon: '🏦'
  },
  {
    name: 'AuditBoard',
    path: '/works/auditboard',
    category: 'Works',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Enterprise SaaS - Growth Assessment (2024)',
    icon: '📋'
  },
  {
    name: 'Reddit',
    path: '/works/reddit',
    category: 'Works',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Social Media - Strategic Engagement (2024)',
    icon: '🔴'
  },
  {
    name: 'Estée Lauder',
    path: '/works/estee-lauder',
    category: 'Works',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Beauty - Creative + Operations (2024)',
    icon: '💄'
  },
  {
    name: 'DoorDash',
    path: '/works/doordash',
    category: 'Works',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Delivery - Strategic Engagement (2022)',
    icon: '🚗'
  },
  {
    name: 'Virtana',
    path: '/works/virtana',
    category: 'Works',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Enterprise SaaS - Growth Assessment (2023)',
    icon: '☁️'
  },
  {
    name: 'YieldStreet',
    path: '/works/yieldstreet',
    category: 'Works',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'FinTech - Strategic Engagement (2021)',
    icon: '📊'
  },
  {
    name: 'Zero Grocery',
    path: '/works/zerogrocery',
    category: 'Works',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'E-Commerce - Embedded Partnership (2020)',
    icon: '🌱'
  },
  {
    name: 'Thimble',
    path: '/works/thimble',
    category: 'Works',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'InsurTech - Strategic Engagement (2020)',
    icon: '🛡️'
  },
  {
    name: 'LiveIntent',
    path: '/works/liveintent',
    category: 'Works',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Ad Tech - Embedded Partnership (2019-2023)',
    icon: '📺'
  },
  {
    name: 'TuneCore',
    path: '/works/tunecore',
    category: 'Works',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Music Tech - Embedded Partnership (2018-2019)',
    icon: '🎵'
  },

  // Experiments Sub-routes
  {
    name: 'Golden Unknown',
    path: '/experiments/golden-unknown',
    category: 'Experiments',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Experimental brand exploration',
    icon: '✨'
  },
  {
    name: 'Being + Rhyme',
    path: '/experiments/being-rhyme',
    category: 'Experiments',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Interactive poetry and rhythm experience',
    icon: '🎶'
  },
  {
    name: 'Cath3dral',
    path: '/experiments/cath3dral',
    category: 'Experiments',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: '3D architectural visualization experiment',
    icon: '🏛️'
  },
  {
    name: 'Component Library',
    path: '/experiments/component-library',
    category: 'Experiments',
    status: 'draft',
    lastUpdated: '2025-11-30',
    description: 'UI component showcase and documentation',
    icon: '📦'
  },
  {
    name: 'UnityMAP Generator',
    path: '/experiments/outreach-generator',
    category: 'Experiments',
    status: 'live',
    lastUpdated: '2025-12-05',
    description: 'Machine-assisted outreach message generator',
    icon: '📨'
  },

  // Thoughts Sub-routes
  {
    name: 'Why Your GTM Sucks',
    path: '/thoughts/why-your-gtm-sucks',
    category: 'Thoughts',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Deep dive into growth infrastructure failures and solutions',
    icon: '📊'
  },

  // Labs / Tools
  {
    name: 'Growth Health Assessment',
    path: '/assessment',
    category: 'Labs',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: '8-question growth health quiz with scoring and recommendations',
    icon: '🩺'
  },
  {
    name: 'UnityNotes',
    path: '/unity-notes',
    category: 'Labs',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Visual noteboard and second brain application',
    icon: '🧠'
  },
  {
    name: 'UnityMAP Hub',
    path: '/outreach',
    category: 'Labs',
    status: 'live',
    lastUpdated: '2025-12-05',
    description: 'Machine-assisted email outreach with templates and sending',
    icon: '🤝'
  },
  {
    name: 'Journeys',
    path: '/journeys',
    category: 'Labs',
    status: 'live',
    lastUpdated: '2025-12-07',
    description: 'Email journey builder and automation flows',
    icon: '🛤️'
  },
  {
    name: 'Portfolio',
    path: '/portfolio',
    category: 'Labs',
    status: 'live',
    lastUpdated: '2025-12-07',
    description: 'Alternative portfolio view with project showcase',
    icon: '📁'
  },
  // ARCHIVED: UK-Memories (Travel Time Capsule)
  {
    name: 'Home-17',
    path: '/home-17',
    category: 'Labs',
    status: 'draft',
    lastUpdated: '2025-11-30',
    description: 'Experimental homepage variant with alternative layout',
    icon: '🏡'
  },

  // Utility Pages
  {
    name: 'Feedback',
    path: '/feedback',
    category: 'Utility',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Submit feedback, bug reports, and feature requests',
    icon: '📧'
  },
  {
    name: 'Sitemap',
    path: '/sitemap',
    category: 'Utility',
    status: 'live',
    lastUpdated: '2025-12-07',
    description: 'Visual map of all pages with descriptions',
    icon: '🗺️'
  },
  {
    name: 'Directory',
    path: '/directory',
    category: 'Utility',
    status: 'live',
    lastUpdated: '2025-12-07',
    description: 'Developer directory with status tracking',
    icon: '📂'
  },
  {
    name: 'Shortlinks',
    path: '/shortlinks',
    category: 'Utility',
    status: 'live',
    lastUpdated: '2025-12-07',
    description: 'Manage custom short links for sharing',
    icon: '🔗'
  },
  {
    name: '404',
    path: '/nonexistent',
    category: 'Utility',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Page not found error handler',
    icon: '❓'
  },

  // Legal Pages
  {
    name: 'Privacy Policy',
    path: '/privacy',
    category: 'Legal',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Privacy policy and data handling practices',
    icon: '🔒'
  },
  {
    name: 'Terms of Service',
    path: '/terms',
    category: 'Legal',
    status: 'live',
    lastUpdated: '2025-11-30',
    description: 'Terms and conditions for using yellowCircle services',
    icon: '📜'
  }
];

// Status configuration for display
export const STATUS_CONFIG = {
  'live': { label: 'Live', color: '#22c55e', icon: '●' },
  'in-progress': { label: 'In Progress', color: '#3b82f6', icon: '◐' },
  'draft': { label: 'Draft', color: '#6b7280', icon: '○' },
  'issue': { label: 'Issue', color: '#ef4444', icon: '⚠' }
};

// Helper to get pages grouped by category
export const getPagesByCategory = () => {
  const categories = {};
  PAGES_CONFIG.forEach(page => {
    if (!categories[page.category]) {
      categories[page.category] = [];
    }
    categories[page.category].push(page);
  });
  return categories;
};

// Helper to get category order for display
export const CATEGORY_ORDER = ['Main', 'Services', 'Works', 'Experiments', 'Thoughts', 'Labs', 'Utility', 'Legal'];

// Get pages as array of category objects (for Sitemap)
export const getPagesCategorized = () => {
  const grouped = getPagesByCategory();
  return CATEGORY_ORDER
    .filter(cat => grouped[cat])
    .map(category => ({
      category,
      items: grouped[category]
    }));
};

// Format date for display
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
