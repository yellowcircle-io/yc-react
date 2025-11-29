/**
 * Shared Pages Configuration
 *
 * Single source of truth for all pages across yellowCircle.
 * Used by DirectoryPage and SitemapPage to stay in sync.
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
    status: 'migrated',
    description: 'Homepage with horizontal scrolling and interactive navigation',
    icon: '🏠'
  },
  {
    name: 'About',
    path: '/about',
    category: 'Main',
    status: 'migrated',
    description: 'Information about yellowCIRCLE philosophy and approach',
    icon: '👤'
  },
  {
    name: 'Works',
    path: '/works',
    category: 'Main',
    status: 'migrated',
    description: 'Portfolio of websites, graphics, and music projects',
    icon: '💼'
  },
  {
    name: 'Hands',
    path: '/hands',
    category: 'Main',
    status: 'migrated',
    description: 'Creative projects and hands-on work',
    icon: '🎨'
  },
  {
    name: 'Thoughts',
    path: '/thoughts',
    category: 'Main',
    status: 'migrated',
    description: 'Essays, reflections, and written content',
    icon: '💭'
  },
  {
    name: 'Experiments',
    path: '/experiments',
    category: 'Main',
    status: 'migrated',
    description: 'Collection of interactive experiments and creative projects',
    icon: '🧪'
  },

  // Experiments Sub-routes
  {
    name: 'Golden Unknown',
    path: '/experiments/golden-unknown',
    category: 'Experiments',
    status: 'migrated',
    description: 'Experimental brand exploration',
    icon: '✨'
  },
  {
    name: 'Being + Rhyme',
    path: '/experiments/being-rhyme',
    category: 'Experiments',
    status: 'migrated',
    description: 'Interactive poetry and rhythm experience',
    icon: '🎵'
  },
  {
    name: 'Cath3dral',
    path: '/experiments/cath3dral',
    category: 'Experiments',
    status: 'migrated',
    description: '3D architectural visualization experiment',
    icon: '🏛️'
  },
  {
    name: 'Component Library',
    path: '/experiments/component-library',
    category: 'Experiments',
    status: 'excluded',
    description: 'UI component showcase and documentation',
    icon: '📦'
  },
  {
    name: 'Outreach Generator',
    path: '/experiments/outreach-generator',
    category: 'Experiments',
    status: 'migrated',
    description: 'AI-powered outreach message generator',
    icon: '📨'
  },

  // Thoughts Sub-routes
  {
    name: 'Blog',
    path: '/thoughts/blog',
    category: 'Thoughts',
    status: 'migrated',
    description: 'Blog posts and articles',
    icon: '📝'
  },
  {
    name: 'Why Your GTM Sucks',
    path: '/thoughts/why-your-gtm-sucks',
    category: 'Thoughts',
    status: 'migrated',
    description: 'Deep dive into GTM infrastructure failures and solutions',
    icon: '📊'
  },

  // Labs / Tools
  {
    name: 'UK-Memories',
    path: '/uk-memories',
    category: 'Labs',
    status: 'excluded',
    description: 'Travel time capsule with photos and memories',
    icon: '✈️'
  },
  {
    name: 'Unity Notes',
    path: '/unity-notes',
    category: 'Labs',
    status: 'migrated',
    description: 'Visual noteboard and second brain application',
    icon: '🧠'
  },
  {
    name: 'Home-17',
    path: '/home-17',
    category: 'Labs',
    status: 'needs-migration',
    description: 'Experimental homepage variant with alternative layout',
    icon: '🏡'
  },
  {
    name: 'Outreach (Business)',
    path: '/outreach',
    category: 'Labs',
    status: 'migrated',
    description: 'Business outreach and contact page',
    icon: '🤝'
  },

  // Utility Pages
  {
    name: 'Feedback',
    path: '/feedback',
    category: 'Utility',
    status: 'migrated',
    description: 'Submit feedback, bug reports, and feature requests',
    icon: '📧'
  },
  {
    name: 'Sitemap',
    path: '/sitemap',
    category: 'Utility',
    status: 'migrated',
    description: 'Visual map of all pages with descriptions',
    icon: '🗺️'
  },
  {
    name: 'Directory',
    path: '/directory',
    category: 'Utility',
    status: 'migrated',
    description: 'Developer directory with migration status',
    icon: '📂'
  },
  {
    name: '404',
    path: '/nonexistent',
    category: 'Utility',
    status: 'migrated',
    description: 'Page not found error handler',
    icon: '❓'
  }
];

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
