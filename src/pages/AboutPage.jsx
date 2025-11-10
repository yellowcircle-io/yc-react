import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParallax } from '../hooks';

const AboutPage = () => {
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
        backgroundColor: '#f8fafc',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 183, 77, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(254, 202, 202, 0.05) 0%, transparent 50%)
        `
      }}
    >
      {/* FOUNDATION BACKGROUND LAYER - WHITE BASE */}
      <div
        className="foundation-background-layer"
        data-layer="foundation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#FFFFFF',
          zIndex: -1000,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />

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

      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full bg-white/95 backdrop-blur-md border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold">Navigation</h2>
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => handleSidebarNavigation('/')}
              className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center space-x-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              <span>Home</span>
            </button>

            <div className="space-y-1">
              <button 
                onClick={() => toggleAccordionItem('experiments')}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 11h6"></path>
                  </svg>
                  <span>Experiments</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transform transition-transform duration-200 ${expandedAccordionItems.has('experiments') ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              
              {expandedAccordionItems.has('experiments') && (
                <div className="ml-8 space-y-1 overflow-hidden">
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    All Experiments
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments/golden-unknown')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    golden unknown
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments/being-rhyme')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    being + rhyme
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments/cath3dral')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    cath3dral
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button 
                onClick={() => toggleAccordionItem('thoughts')}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                  </svg>
                  <span>Thoughts</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transform transition-transform duration-200 ${expandedAccordionItems.has('thoughts') ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              
              {expandedAccordionItems.has('thoughts') && (
                <div className="ml-8 space-y-1 overflow-hidden">
                  <button 
                    onClick={() => handleSidebarNavigation('/thoughts')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    All Thoughts
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/thoughts/blog')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    blog
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button 
                onClick={() => toggleAccordionItem('about')}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-between bg-purple-50 border border-purple-200"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
              >
                <div className="flex items-center space-x-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#8b5cf6' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span style={{ color: '#8b5cf6' }}>About</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ color: '#8b5cf6' }}
                  className={`transform transition-transform duration-200 ${expandedAccordionItems.has('about') ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              
              {expandedAccordionItems.has('about') && (
                <div className="ml-8 space-y-1 overflow-hidden">
                  <button 
                    onClick={() => handleSidebarNavigation('/about')}
                    className="block w-full text-left p-2 text-sm text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors duration-200"
                  >
                    Overview
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/about/timeline')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    timeline
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/about/services')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    services
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/about/contact')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    contact
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button 
                onClick={() => toggleAccordionItem('works')}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <span>Works</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transform transition-transform duration-200 ${expandedAccordionItems.has('works') ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              
              {expandedAccordionItems.has('works') && (
                <div className="ml-8 space-y-1 overflow-hidden">
                  <button 
                    onClick={() => handleSidebarNavigation('/works')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    All Works
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/works/websites')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    websites
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/works/graphics')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    graphics
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/works/music')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
                  >
                    music
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-6">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6" style={{ color: '#8b5cf6', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
              About
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Designer, developer, and creative explorer building meaningful digital experiences at the intersection of art and technology.
            </p>
          </div>

          {/* About Sections */}
          <div className="space-y-16">
            {/* Philosophy Section */}
            <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h2 className="text-3xl font-semibold mb-6" style={{ color: '#8b5cf6' }}>
                Philosophy
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  I believe in the power of intentional design to create experiences that resonate on both emotional and functional levels. 
                  Every project is an opportunity to explore new possibilities, push creative boundaries, and solve meaningful problems.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  My approach combines technical precision with artistic intuition, always considering the human element in digital interactions. 
                  Whether working on experimental interfaces or production applications, I strive to create work that is both innovative and accessible.
                </p>
              </div>
            </section>

            {/* Background Section */}
            <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h2 className="text-3xl font-semibold mb-6" style={{ color: '#8b5cf6' }}>
                Background
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Design</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Specializing in interaction design, visual systems, and user experience. I focus on creating cohesive design languages 
                    that scale across platforms while maintaining their unique character and usability.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Development</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Proficient in modern web technologies including React, JavaScript, and CSS. I enjoy working at the intersection 
                    of design and code, bringing concepts to life with attention to performance and accessibility.
                  </p>
                </div>
              </div>
            </section>

            {/* Skills Section */}
            <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h2 className="text-3xl font-semibold mb-6" style={{ color: '#8b5cf6' }}>
                Skills & Expertise
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <h3 className="font-semibold mb-3" style={{ color: '#8b5cf6' }}>Design</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Interface Design</li>
                    <li>• Visual Systems</li>
                    <li>• Typography</li>
                    <li>• Color Theory</li>
                    <li>• Prototyping</li>
                  </ul>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <h3 className="font-semibold mb-3" style={{ color: '#f59e0b' }}>Development</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• React & JavaScript</li>
                    <li>• CSS & Animations</li>
                    <li>• Responsive Design</li>
                    <li>• Performance Optimization</li>
                    <li>• Version Control</li>
                  </ul>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold mb-3" style={{ color: '#3b82f6' }}>Creative</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Creative Direction</li>
                    <li>• Brand Identity</li>
                    <li>• Content Strategy</li>
                    <li>• Digital Art</li>
                    <li>• Experimental Media</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Values Section */}
            <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h2 className="text-3xl font-semibold mb-6" style={{ color: '#8b5cf6' }}>
                Values
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#8b5cf6' }}>Curiosity</h3>
                    <p className="text-gray-700">
                      Constantly exploring new tools, techniques, and perspectives to push the boundaries of what's possible.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#8b5cf6' }}>Quality</h3>
                    <p className="text-gray-700">
                      Committed to excellence in every detail, from initial concept to final implementation.
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#8b5cf6' }}>Collaboration</h3>
                    <p className="text-gray-700">
                      Believing that the best work emerges from diverse perspectives and open communication.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#8b5cf6' }}>Impact</h3>
                    <p className="text-gray-700">
                      Focusing on creating work that makes a positive difference in people's lives and experiences.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact CTA */}
            <section className="text-center py-12">
              <h2 className="text-3xl font-semibold mb-4" style={{ color: '#8b5cf6' }}>
                Let's Create Something Together
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Interested in collaborating or learning more about my work? I'd love to hear from you.
              </p>
              <button 
                onClick={() => handleSidebarNavigation('/about/contact')}
                className="inline-flex items-center px-8 py-3 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ 
                  backgroundColor: '#8b5cf6',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                }}
              >
                Get In Touch
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
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full border-2 border-gray-300 bg-white/80 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:border-purple-400 z-30"
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
          style={{ color: '#8b5cf6' }}
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
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#8b5cf6' }}>Connect</h3>
              <div className="space-y-2">
                <a href="mailto:hello@yellowcircle.dev" className="block text-gray-700 hover:text-purple-600 transition-colors duration-200">
                  hello@yellowcircle.dev
                </a>
                <a href="#" className="block text-gray-700 hover:text-purple-600 transition-colors duration-200">
                  LinkedIn
                </a>
                <a href="#" className="block text-gray-700 hover:text-purple-600 transition-colors duration-200">
                  Twitter
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#8b5cf6' }}>Quick Links</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSidebarNavigation('/about/timeline')}
                  className="block text-gray-700 hover:text-purple-600 transition-colors duration-200 text-left"
                >
                  Timeline
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/about/services')}
                  className="block text-gray-700 hover:text-purple-600 transition-colors duration-200 text-left"
                >
                  Services
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/works')}
                  className="block text-gray-700 hover:text-purple-600 transition-colors duration-200 text-left"
                >
                  View All Works
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
              <h2 className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>Menu</h2>
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
                className="block w-full text-left p-3 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
              >
                <span style={{ color: '#8b5cf6' }}>About</span>
              </button>
              <button 
                onClick={() => handleMenuNavigation('/works')}
                className="block w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Works
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutPage;