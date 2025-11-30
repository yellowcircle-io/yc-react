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
    status: 'issue',
    lastUpdated: '2024-11-29',
    description: 'Homepage with horizontal scrolling and interactive navigation',
    icon: '🏠'
  },
  {
    name: 'About',
    path: '/about',
    category: 'Main',
    status: 'live',
    lastUpdated: '2024-11-20',
    description: 'Information about yellowCIRCLE philosophy and approach',
    icon: '👤'
  },
  {
    name: 'Works',
    path: '/works',
    category: 'Main',
    status: 'live',
    lastUpdated: '2024-11-15',
    description: 'Portfolio of websites, graphics, and music projects',
    icon: '💼'
  },
  {
    name: 'Hands',
    path: '/hands',
    category: 'Main',
    status: 'live',
    lastUpdated: '2024-11-15',
    description: 'Creative projects and hands-on work',
    icon: '🎨'
  },
  {
    name: 'Thoughts',
    path: '/thoughts',
    category: 'Main',
    status: 'live',
    lastUpdated: '2024-11-18',
    description: 'Essays, reflections, and written content',
    icon: '💭'
  },
  {
    name: 'Experiments',
    path: '/experiments',
    category: 'Main',
    status: 'live',
    lastUpdated: '2024-11-22',
    description: 'Collection of interactive experiments and creative projects',
    icon: '🧪'
  },

  // Experiments Sub-routes
  {
    name: 'Golden Unknown',
    path: '/experiments/golden-unknown',
    category: 'Experiments',
    status: 'live',
    lastUpdated: '2024-11-10',
    description: 'Experimental brand exploration',
    icon: '✨'
  },
  {
    name: 'Being + Rhyme',
    path: '/experiments/being-rhyme',
    category: 'Experiments',
    status: 'live',
    lastUpdated: '2024-11-10',
    description: 'Interactive poetry and rhythm experience',
    icon: '🎵'
  },
  {
    name: 'Cath3dral',
    path: '/experiments/cath3dral',
    category: 'Experiments',
    status: 'live',
    lastUpdated: '2024-11-10',
    description: '3D architectural visualization experiment',
    icon: '🏛️'
  },
  {
    name: 'Component Library',
    path: '/experiments/component-library',
    category: 'Experiments',
    status: 'draft',
    lastUpdated: '2024-11-05',
    description: 'UI component showcase and documentation',
    icon: '📦'
  },
  {
    name: 'Outreach Generator',
    path: '/experiments/outreach-generator',
    category: 'Experiments',
    status: 'in-progress',
    lastUpdated: '2024-11-29',
    description: 'AI-powered outreach message generator',
    icon: '📨'
  },

  // Thoughts Sub-routes
  {
    name: 'Blog',
    path: '/thoughts/blog',
    category: 'Thoughts',
    status: 'live',
    lastUpdated: '2024-11-18',
    description: 'Blog posts and articles',
    icon: '📝'
  },
  {
    name: 'Why Your GTM Sucks',
    path: '/thoughts/why-your-gtm-sucks',
    category: 'Thoughts',
    status: 'in-progress',
    lastUpdated: '2024-11-29',
    description: 'Deep dive into GTM infrastructure failures and solutions',
    icon: '📊'
  },

  // Labs / Tools
  {
    name: 'UK-Memories',
    path: '/uk-memories',
    category: 'Labs',
    status: 'draft',
    lastUpdated: '2024-10-15',
    description: 'Travel time capsule with photos and memories',
    icon: '✈️'
  },
  {
    name: 'Unity Notes',
    path: '/unity-notes',
    category: 'Labs',
    status: 'issue',
    lastUpdated: '2024-11-29',
    description: 'Visual noteboard and second brain application',
    icon: '🧠'
  },
  {
    name: 'Unity Notes+',
    path: '/unity-notes-plus',
    category: 'Labs',
    status: 'issue',
    lastUpdated: '2024-11-29',
    description: 'Enhanced Unity Notes with advanced features',
    icon: '🧠'
  },
  {
    name: 'Home-17',
    path: '/home-17',
    category: 'Labs',
    status: 'draft',
    lastUpdated: '2024-09-01',
    description: 'Experimental homepage variant with alternative layout',
    icon: '🏡'
  },
  {
    name: 'Outreach Pro',
    path: '/outreach',
    category: 'Labs',
    status: 'in-progress',
    lastUpdated: '2024-11-29',
    description: 'AI-powered email outreach with templates and sending',
    icon: '🤝'
  },

  // Utility Pages
  {
    name: 'Feedback',
    path: '/feedback',
    category: 'Utility',
    status: 'live',
    lastUpdated: '2024-11-15',
    description: 'Submit feedback, bug reports, and feature requests',
    icon: '📧'
  },
  {
    name: 'Sitemap',
    path: '/sitemap',
    category: 'Utility',
    status: 'live',
    lastUpdated: '2024-11-29',
    description: 'Visual map of all pages with descriptions',
    icon: '🗺️'
  },
  {
    name: 'Directory',
    path: '/directory',
    category: 'Utility',
    status: 'live',
    lastUpdated: '2024-11-29',
    description: 'Developer directory with status tracking',
    icon: '📂'
  },
  {
    name: '404',
    path: '/nonexistent',
    category: 'Utility',
    status: 'live',
    lastUpdated: '2024-11-10',
    description: 'Page not found error handler',
    icon: '❓'
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
export const CATEGORY_ORDER = ['Main', 'Experiments', 'Thoughts', 'Labs', 'Utility'];

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
