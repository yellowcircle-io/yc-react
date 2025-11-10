import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Sitemap/Directory Page
 * Lists all pages in the application with descriptions
 */
const SitemapPage = () => {
  const navigate = useNavigate();

  const pages = [
    {
      category: 'Main Pages',
      items: [
        {
          path: '/',
          name: 'Home',
          description: 'Homepage with horizontal scrolling and interactive navigation',
          icon: '🏠'
        },
        {
          path: '/about',
          name: 'About',
          description: 'Information about yellowCIRCLE philosophy and approach',
          icon: '👤'
        },
        {
          path: '/works',
          name: 'Works',
          description: 'Portfolio of websites, graphics, and music projects',
          icon: '💼'
        },
        {
          path: '/hands',
          name: 'Hands',
          description: 'Creative projects and hands-on work',
          icon: '🎨'
        }
      ]
    },
    {
      category: 'Experiments',
      items: [
        {
          path: '/experiments',
          name: 'Experiments Hub',
          description: 'Collection of interactive experiments and creative projects',
          icon: '🧪'
        },
        {
          path: '/experiments/golden-unknown',
          name: 'Golden Unknown',
          description: 'Experimental brand exploration',
          icon: '✨'
        },
        {
          path: '/experiments/being-rhyme',
          name: 'Being Rhyme',
          description: 'Interactive poetry and rhythm experience',
          icon: '🎵'
        },
        {
          path: '/experiments/cath3dral',
          name: 'Cath3dral',
          description: '3D architectural visualization experiment',
          icon: '🏛️'
        },
        {
          path: '/experiments/component-library',
          name: 'Component Library',
          description: 'UI component showcase and documentation',
          icon: '📦'
        }
      ]
    },
    {
      category: 'Thoughts',
      items: [
        {
          path: '/thoughts',
          name: 'Thoughts Hub',
          description: 'Essays, reflections, and written content',
          icon: '💭'
        },
        {
          path: '/thoughts/blog',
          name: 'Blog',
          description: 'Blog posts and articles',
          icon: '📝'
        }
      ]
    },
    {
      category: 'Special Features',
      items: [
        {
          path: '/uk-memories',
          name: 'UK Memories',
          description: 'Travel time capsule with photos and memories',
          icon: '✈️'
        },
        {
          path: '/feedback',
          name: 'Feedback',
          description: 'Submit feedback, bug reports, and feature requests',
          icon: '📧'
        },
        {
          path: '/sitemap',
          name: 'Sitemap',
          description: 'This page - complete directory of all pages',
          icon: '🗺️'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold hover:text-orange-400 transition-colors duration-300"
            style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
          >
            yellowCIRCLE
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition-colors duration-200"
          >
            Back to Home
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4" style={{ color: '#1e293b' }}>
            Site Directory
          </h1>
          <p className="text-xl text-gray-600">
            Complete map of all pages and features on yellowCIRCLE
          </p>
        </div>

        {/* Page Categories */}
        <div className="space-y-12">
          {pages.map((category, idx) => (
            <section key={idx} className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-4">
                {category.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((page, pageIdx) => (
                  <button
                    key={pageIdx}
                    onClick={() => navigate(page.path)}
                    className="text-left p-6 rounded-xl bg-gradient-to-br from-gray-50 to-orange-50 hover:from-orange-50 hover:to-orange-100 transition-all duration-300 transform hover:scale-105 hover:shadow-md border border-gray-200 hover:border-orange-300"
                  >
                    <div className="flex items-start space-x-4">
                      <span className="text-4xl" role="img" aria-label={page.name}>
                        {page.icon}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 text-gray-800">
                          {page.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {page.description}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {page.path}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 p-8 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-200">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">
            Site Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500">
                {pages.reduce((sum, cat) => sum + cat.items.length, 0)}
              </div>
              <div className="text-sm text-gray-600 mt-2">Total Pages</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500">4</div>
              <div className="text-sm text-gray-600 mt-2">Main Sections</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500">5</div>
              <div className="text-sm text-gray-600 mt-2">Experiments</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500">2</div>
              <div className="text-sm text-gray-600 mt-2">Thoughts</div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            This sitemap is automatically maintained. Last updated: November 2025
          </p>
        </div>
      </main>
    </div>
  );
};

export default SitemapPage;
