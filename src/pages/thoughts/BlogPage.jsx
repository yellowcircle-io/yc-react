import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const BlogPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [navCircleAtEnd] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0 });
  const [motionPermission, setMotionPermission] = useState('granted');
  const [expandedAccordionItems, setExpandedAccordionItems] = useState(new Set(['thoughts']));

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const throttledMouseMove = useCallback((e) => {
    const now = Date.now();
    if (now - throttledMouseMove.lastCall < 16) return;
    throttledMouseMove.lastCall = now;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = (e.clientX - rect.left - centerX) / centerX;
    const y = (e.clientY - rect.top - centerY) / centerY;
    
    setMousePosition({ x: x * 50, y: y * 50 });
  }, []);

  useEffect(() => {
    const requestMotionPermission = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          setMotionPermission(permission);
        } catch (error) {
          console.error('Error requesting device motion permission:', error);
          setMotionPermission('denied');
        }
      }
    };

    const handleDeviceOrientation = (event) => {
      if (motionPermission === 'granted') {
        const { beta, gamma } = event;
        setDeviceMotion({
          x: Math.max(-30, Math.min(30, gamma || 0)),
          y: Math.max(-30, Math.min(30, beta ? beta - 90 : 0))
        });
      }
    };

    const handleDeviceMotion = (event) => {
      if (motionPermission === 'granted' && event.accelerationIncludingGravity) {
        const { x, y } = event.accelerationIncludingGravity;
        setAccelerometerData({
          x: Math.max(-10, Math.min(10, (x || 0) * 3)),
          y: Math.max(-10, Math.min(10, (y || 0) * 3))
        });
      }
    };

    if (isMobile) {
      requestMotionPermission();
      window.addEventListener('deviceorientation', handleDeviceOrientation);
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (isMobile) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [isMobile, motionPermission]);

  const combinedDeviceMotion = {
    x: deviceMotion.x + (accelerometerData.x * 0.3),
    y: deviceMotion.y + (accelerometerData.y * 0.3)
  };

  const circleTransform = {
    transform: `translate(${(mousePosition.x + combinedDeviceMotion.x) * 0.6}px, ${(mousePosition.y + combinedDeviceMotion.y) * 0.6}px)`
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
      onMouseMove={throttledMouseMove}
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 183, 77, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)
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
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-between bg-blue-50 border border-blue-200"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
              >
                <div className="flex items-center space-x-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#3b82f6' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                  </svg>
                  <span style={{ color: '#3b82f6' }}>Thoughts</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ color: '#3b82f6' }}
                  className={`transform transition-transform duration-200 ${expandedAccordionItems.has('thoughts') ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              
              {expandedAccordionItems.has('thoughts') && (
                <div className="ml-8 space-y-1 overflow-hidden">
                  <button 
                    onClick={() => handleSidebarNavigation('/thoughts')}
                    className="block w-full text-left p-2 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors duration-200"
                  >
                    All Thoughts
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/thoughts/blog')}
                    className="block w-full text-left p-2 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors duration-200 bg-blue-100"
                  >
                    blog
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <button 
                onClick={() => toggleAccordionItem('about')}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>About</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transform transition-transform duration-200 ${expandedAccordionItems.has('about') ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              
              {expandedAccordionItems.has('about') && (
                <div className="ml-8 space-y-1 overflow-hidden">
                  <button 
                    onClick={() => handleSidebarNavigation('/about')}
                    className="block w-full text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors duration-200"
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
            <div className="flex items-center justify-center mb-4">
              <button 
                onClick={() => navigate('/thoughts')}
                className="text-blue-600 hover:text-blue-500 transition-colors duration-200 flex items-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
                Back to Thoughts
              </button>
            </div>
            <h1 className="text-5xl font-bold mb-6" style={{ color: '#3b82f6', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
              Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Reflections on design, technology, creativity, and the spaces where they intersect. 
              Thoughts in progress, shared as they evolve.
            </p>
          </div>

          {/* Blog Posts */}
          <div className="space-y-12">
            {/* Featured Post */}
            <article className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full mr-3">Featured</span>
                <span className="text-gray-500 text-sm">December 15, 2024</span>
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: '#3b82f6' }}>
                The Language of Interactive Systems
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                How do we communicate with machines, and more importantly, how do they communicate back? 
                This exploration dives into the evolving vocabulary of human-computer interaction, from 
                command lines to voice interfaces to the gestural languages we're still inventing.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Interaction Design</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Technology</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Future</span>
                </div>
                <button className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200">
                  Read More →
                </button>
              </div>
            </article>

            {/* Recent Posts */}
            <div className="grid md:grid-cols-2 gap-8">
              <article className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-3">
                  <span className="text-gray-500 text-sm">November 28, 2024</span>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#3b82f6' }}>
                  Building Digital Cathedrals
                </h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  What can we learn from sacred architecture when designing digital spaces? 
                  An exploration of verticality, light, and contemplative experience in code.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Design</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Architecture</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors duration-200">
                    Read →
                  </button>
                </div>
              </article>

              <article className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-3">
                  <span className="text-gray-500 text-sm">November 12, 2024</span>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#3b82f6' }}>
                  The Poetry of Code
                </h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Beyond functionality lies rhythm, meter, and meaning. How programming languages 
                  can be viewed as expressive mediums for creative thought.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Programming</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Creativity</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors duration-200">
                    Read →
                  </button>
                </div>
              </article>

              <article className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-3">
                  <span className="text-gray-500 text-sm">October 30, 2024</span>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#3b82f6' }}>
                  Ambient Computing
                </h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  As technology becomes increasingly invisible, how do we maintain meaningful 
                  relationships with our digital tools? Thoughts on calm technology and presence.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">UX</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Future Tech</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors duration-200">
                    Read →
                  </button>
                </div>
              </article>

              <article className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center mb-3">
                  <span className="text-gray-500 text-sm">October 15, 2024</span>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#3b82f6' }}>
                  Designing for Unknown Futures
                </h3>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  In a rapidly changing technological landscape, how do we create systems that 
                  remain relevant and adaptable? Principles for future-friendly design.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Strategy</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Innovation</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors duration-200">
                    Read →
                  </button>
                </div>
              </article>
            </div>

            {/* Categories */}
            <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-semibold mb-6" style={{ color: '#3b82f6' }}>
                Explore by Topic
              </h2>
              <div className="grid md:grid-cols-4 gap-4">
                <button className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-200 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Design Process</h3>
                  <p className="text-blue-700 text-sm">Methods, tools, and thinking behind creative work</p>
                </button>
                <button className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-200 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">Technology</h3>
                  <p className="text-green-700 text-sm">Web development, tools, and emerging tech</p>
                </button>
                <button className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors duration-200 border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2">Experiments</h3>
                  <p className="text-purple-700 text-sm">Behind-the-scenes of creative projects</p>
                </button>
                <button className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors duration-200 border border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-2">Reflections</h3>
                  <p className="text-orange-700 text-sm">Personal thoughts on creativity and craft</p>
                </button>
              </div>
            </section>

            {/* Newsletter Signup */}
            <section className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4" style={{ color: '#3b82f6' }}>
                Stay Updated
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Get notified when new posts are published. No spam, just thoughts on design and technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="your@email.com" 
                  className="px-4 py-3 border border-gray-300 rounded-full flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button 
                  className="px-6 py-3 text-white rounded-full font-medium transition-all duration-300 hover:scale-105"
                  style={{ 
                    backgroundColor: '#3b82f6',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  Subscribe
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Navigation Circle */}
      <div 
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full border-2 border-gray-300 bg-white/80 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:border-blue-400 z-30"
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
          style={{ color: '#3b82f6' }}
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
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#3b82f6' }}>Recent Thoughts</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSidebarNavigation('/thoughts')}
                  className="block text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  All Thoughts
                </button>
                <a href="#" className="block text-gray-700 hover:text-blue-600 transition-colors duration-200">
                  The Language of Interactive Systems
                </a>
                <a href="#" className="block text-gray-700 hover:text-blue-600 transition-colors duration-200">
                  Building Digital Cathedrals
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#3b82f6' }}>Explore More</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSidebarNavigation('/experiments')}
                  className="block text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  Experiments
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/works')}
                  className="block text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  Works
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/about')}
                  className="block text-gray-700 hover:text-blue-600 transition-colors duration-200"
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
              <h2 className="text-2xl font-bold" style={{ color: '#3b82f6' }}>Menu</h2>
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
                className="block w-full text-left p-3 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
              >
                <span style={{ color: '#3b82f6' }}>Thoughts</span>
              </button>
              <button 
                onClick={() => handleMenuNavigation('/about')}
                className="block w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                About
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

export default BlogPage;