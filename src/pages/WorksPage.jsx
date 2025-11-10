import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParallax } from '../hooks';
import TailwindSidebar from '../components/shared/TailwindSidebar';

const WorksPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [navCircleAtEnd] = useState(false);
  const [expandedAccordionItems, setExpandedAccordionItems] = useState(new Set());

  // Use shared parallax hook
  const { x, y } = useParallax({
    enableMouse: true,
    enableDeviceMotion: true,
    mouseIntensity: 0.6,
    motionIntensity: 0.6
  });

  const circleTransform = {
    transform: `translate(${x}px, ${y}px)`
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleFooter = () => setFooterOpen(!footerOpen);

  const toggleAccordionItem = (item) => {
    const newExpanded = new Set(expandedAccordionItems);
    if (newExpanded.has(item)) {
      newExpanded.delete(item);
    } else {
      newExpanded.add(item);
    }
    setExpandedAccordionItems(newExpanded);
  };

  const handleSidebarNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleMenuNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div
      className="relative h-screen w-full overflow-auto bg-white"
      style={{
        backgroundColor: '#fafafa',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(255, 183, 77, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)
        `
      }}
    >
      {/* Background Yellow Circle */}
      <div 
        className="fixed pointer-events-none z-0"
        style={{
          top: '50%',
          left: '50%',
          width: '600px',
          height: '600px',
          marginLeft: '-300px',
          marginTop: '-300px',
          background: 'radial-gradient(circle, rgba(255, 183, 77, 0.15) 0%, rgba(255, 183, 77, 0.05) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(1px)',
          ...circleTransform
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-white/80 backdrop-blur-sm">
        <button 
          onClick={() => navigate('/')}
          className="text-2xl font-bold hover:text-orange-400 transition-colors duration-300"
          style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
        >
          yellowCIRCLE
        </button>
        
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          aria-label="Toggle sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </header>

      {/* Shared Tailwind Sidebar */}
      <TailwindSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        expandedItems={expandedAccordionItems}
        onToggleItem={toggleAccordionItem}
        currentPage="works"
      />

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-32">
        <div className="max-w-6xl mx-auto px-6">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6" style={{ color: '#22c55e', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
              Works
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              A collection of selected projects showcasing design, development, and creative exploration across multiple disciplines.
            </p>
          </div>

          {/* Featured Projects Grid */}
          <div className="space-y-16">
            {/* Websites Section */}
            <section>
              <div className="flex items-center mb-8">
                <h2 className="text-3xl font-semibold" style={{ color: '#22c55e' }}>
                  Websites
                </h2>
                <button 
                  onClick={() => handleSidebarNavigation('/works/websites')}
                  className="ml-4 px-4 py-2 text-sm text-green-600 border border-green-200 rounded-full hover:bg-green-50 transition-colors duration-200"
                >
                  View All
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mb-4 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#22c55e' }}>
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Interactive Portfolio</h3>
                  <p className="text-gray-600 text-sm mb-4">Dynamic portfolio with parallax effects and gesture-based navigation.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">React</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">CSS</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Animations</span>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl mb-4 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#3b82f6' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="9" cy="9" r="2"></circle>
                      <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">E-commerce Platform</h3>
                  <p className="text-gray-600 text-sm mb-4">Modern shopping experience with advanced filtering and checkout flow.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Next.js</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Stripe</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">API</span>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl mb-4 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#8b5cf6' }}>
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Creative Agency Site</h3>
                  <p className="text-gray-600 text-sm mb-4">Bold agency website with experimental layouts and micro-interactions.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Vue.js</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">GSAP</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">WebGL</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Graphics Section */}
            <section>
              <div className="flex items-center mb-8">
                <h2 className="text-3xl font-semibold" style={{ color: '#22c55e' }}>
                  Graphics
                </h2>
                <button 
                  onClick={() => handleSidebarNavigation('/works/graphics')}
                  className="ml-4 px-4 py-2 text-sm text-green-600 border border-green-200 rounded-full hover:bg-green-50 transition-colors duration-200"
                >
                  View All
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl mb-3 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#f59e0b' }}>
                      <polygon points="12,2 15.09,8.26 22,9 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9 8.91,8.26"></polygon>
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1">Brand Identity</h3>
                  <p className="text-gray-600 text-xs">Logo systems and visual identity design</p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-32 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl mb-3 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#ec4899' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="9" cy="9" r="2"></circle>
                      <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1">Digital Illustrations</h3>
                  <p className="text-gray-600 text-xs">Custom artwork and icon design</p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-32 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl mb-3 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#6366f1' }}>
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1">Print Design</h3>
                  <p className="text-gray-600 text-xs">Posters, brochures, and packaging</p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl mb-3 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#10b981' }}>
                      <path d="M9 19c-5 0-8-3-8-8s3-8 8-8 8 3 8 8-3 8-8 8"></path>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                      <line x1="9" y1="9" x2="9.01" y2="9"></line>
                      <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1">Motion Graphics</h3>
                  <p className="text-gray-600 text-xs">Animated logos and transitions</p>
                </div>
              </div>
            </section>

            {/* Music Section */}
            <section>
              <div className="flex items-center mb-8">
                <h2 className="text-3xl font-semibold" style={{ color: '#22c55e' }}>
                  Music
                </h2>
                <button 
                  onClick={() => handleSidebarNavigation('/works/music')}
                  className="ml-4 px-4 py-2 text-sm text-green-600 border border-green-200 rounded-full hover:bg-green-50 transition-colors duration-200"
                >
                  View All
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-red-100 to-red-200 rounded-xl mb-4 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#ef4444' }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="10,8 16,12 10,16 10,8"></polygon>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ambient Soundscapes</h3>
                  <p className="text-gray-600 text-sm mb-4">Atmospheric compositions for meditation and focus.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Ambient</span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Drone</span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Experimental</span>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl mb-4 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#eab308' }}>
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Electronic Compositions</h3>
                  <p className="text-gray-600 text-sm mb-4">Synthesized pieces exploring rhythm and texture.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Electronic</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Synth</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Beat</span>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl mb-4 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#14b8a6' }}>
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Interactive Audio</h3>
                  <p className="text-gray-600 text-sm mb-4">Web-based musical instruments and sound toys.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">Interactive</span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">Web Audio</span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">Generative</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <section className="text-center py-12">
              <h2 className="text-3xl font-semibold mb-4" style={{ color: '#22c55e' }}>
                Interested in Working Together?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                I'm always excited to take on new challenges and collaborate on meaningful projects.
              </p>
              <button 
                onClick={() => handleSidebarNavigation('/about/contact')}
                className="inline-flex items-center px-8 py-3 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ 
                  backgroundColor: '#22c55e',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                }}
              >
                Start a Project
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </section>
          </div>
        </div>
      </main>

      {/* Navigation Circle */}
      <div 
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full border-2 border-gray-300 bg-white/80 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:border-green-400 z-30"
        onClick={toggleFooter}
        style={{
          transform: `rotate(${navCircleAtEnd ? '0deg' : '-90deg'})`,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ color: '#22c55e' }}
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>

      {/* Footer */}
      <footer 
        className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 transform transition-transform duration-300 ease-in-out z-20 ${
          footerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#22c55e' }}>Get In Touch</h3>
              <div className="space-y-2">
                <a href="mailto:hello@yellowcircle.dev" className="block text-gray-700 hover:text-green-600 transition-colors duration-200">
                  hello@yellowcircle.dev
                </a>
                <a href="#" className="block text-gray-700 hover:text-green-600 transition-colors duration-200">
                  LinkedIn
                </a>
                <a href="#" className="block text-gray-700 hover:text-green-600 transition-colors duration-200">
                  Dribbble
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#22c55e' }}>Explore More</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSidebarNavigation('/experiments')}
                  className="block text-gray-700 hover:text-green-600 transition-colors duration-200 text-left"
                >
                  Experiments
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/thoughts')}
                  className="block text-gray-700 hover:text-green-600 transition-colors duration-200 text-left"
                >
                  Thoughts
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/about')}
                  className="block text-gray-700 hover:text-green-600 transition-colors duration-200 text-left"
                >
                  About
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#22c55e' }}>Menu</h2>
              <button 
                onClick={toggleMenu}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <nav className="space-y-4">
              <button 
                onClick={() => handleMenuNavigation('/')}
                className="block w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Home
              </button>
              <button 
                onClick={() => handleMenuNavigation('/experiments')}
                className="block w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Experiments
              </button>
              <button 
                onClick={() => handleMenuNavigation('/thoughts')}
                className="block w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Thoughts
              </button>
              <button 
                onClick={() => handleMenuNavigation('/about')}
                className="block w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                About
              </button>
              <button 
                onClick={() => handleMenuNavigation('/works')}
                className="block w-full text-left p-3 hover:bg-green-100 rounded-lg transition-colors duration-200"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
              >
                <span style={{ color: '#22c55e' }}>Works</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorksPage;