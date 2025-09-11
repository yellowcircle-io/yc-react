import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const GoldenUnknownPage = () => {
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
  const [expandedAccordionItems, setExpandedAccordionItems] = useState(new Set(['experiments']));

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
        backgroundColor: '#0f0f0f',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(255, 183, 77, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255, 193, 7, 0.15) 0%, transparent 50%)
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
          background: 'radial-gradient(circle, rgba(255, 183, 77, 0.4) 0%, rgba(255, 183, 77, 0.1) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(2px)',
          ...circleTransform
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-black/80 backdrop-blur-sm">
        <button 
          onClick={() => navigate('/')}
          className="text-2xl font-bold text-yellow-400 hover:text-orange-400 transition-colors duration-300"
          style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
        >
          yellowCIRCLE
        </button>
        
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200 text-yellow-400"
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
        className={`fixed top-0 right-0 h-full bg-black/95 backdrop-blur-md border-l border-gray-800 transform transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-yellow-400">Navigation</h2>
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200 text-yellow-400"
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
              className="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 flex items-center space-x-3 text-gray-300"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              <span>Home</span>
            </button>

            <div className="space-y-1">
              <button 
                onClick={() => toggleAccordionItem('experiments')}
                className="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 flex items-center justify-between bg-yellow-900/20 border border-yellow-500/30"
              >
                <div className="flex items-center space-x-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                    <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 11h6"></path>
                  </svg>
                  <span className="text-yellow-400">Experiments</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transform transition-transform duration-200 text-yellow-400 ${expandedAccordionItems.has('experiments') ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              
              {expandedAccordionItems.has('experiments') && (
                <div className="ml-8 space-y-1 overflow-hidden">
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments')}
                    className="block w-full text-left p-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors duration-200"
                  >
                    All Experiments
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments/golden-unknown')}
                    className="block w-full text-left p-2 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 rounded transition-colors duration-200"
                  >
                    golden unknown
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments/being-rhyme')}
                    className="block w-full text-left p-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors duration-200"
                  >
                    being + rhyme
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments/cath3dral')}
                    className="block w-full text-left p-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors duration-200"
                  >
                    cath3dral
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => handleSidebarNavigation('/thoughts')}
              className="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 flex items-center space-x-3 text-gray-300"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
              <span>Thoughts</span>
            </button>

            <button 
              onClick={() => handleSidebarNavigation('/about')}
              className="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 flex items-center space-x-3 text-gray-300"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>About</span>
            </button>

            <button 
              onClick={() => handleSidebarNavigation('/works')}
              className="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 flex items-center space-x-3 text-gray-300"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span>Works</span>
            </button>
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
                onClick={() => navigate('/experiments')}
                className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200 flex items-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
                Back to Experiments
              </button>
            </div>
            <h1 className="text-5xl font-bold mb-6 text-yellow-400" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
              golden unknown
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              An exploration of uncertainty and discovery through interactive digital landscapes. 
              A meditation on the beauty found in the spaces between knowing and unknowing.
            </p>
          </div>

          {/* Project Content */}
          <div className="space-y-16">
            {/* Project Overview */}
            <section className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-yellow-400">
                Overview
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-300 leading-relaxed mb-4">
                  "Golden Unknown" emerged from a fascination with liminal spaces—those threshold moments where certainty 
                  dissolves and possibility expands. This interactive piece invites participants to navigate an abstract 
                  landscape that responds to their presence while remaining perpetually elusive.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  The work challenges our need for immediate understanding, instead offering an experience that rewards 
                  patience, curiosity, and comfort with ambiguity. Each interaction reveals new layers while concealing 
                  others, creating an endless cycle of discovery and mystery.
                </p>
              </div>
            </section>

            {/* Technical Details */}
            <section className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-yellow-400">
                Technical Implementation
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-yellow-300">Core Technologies</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• WebGL shaders for dynamic visual generation</li>
                    <li>• Web Audio API for reactive soundscapes</li>
                    <li>• Canvas-based particle systems</li>
                    <li>• Device orientation and touch APIs</li>
                    <li>• Real-time data visualization</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-yellow-300">Interaction Methods</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Mouse movement and gestures</li>
                    <li>• Touch and multi-touch on mobile</li>
                    <li>• Device tilt and motion sensing</li>
                    <li>• Ambient sound input (optional)</li>
                    <li>• Time-based autonomous evolution</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Visual Examples */}
            <section className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-yellow-400">
                Visual Language
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="aspect-square bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-xl flex items-center justify-center border border-yellow-500/30">
                  <div className="w-20 h-20 rounded-full bg-yellow-400/20 animate-pulse"></div>
                </div>
                <div className="aspect-square bg-gradient-to-br from-amber-900/50 to-yellow-900/50 rounded-xl flex items-center justify-center border border-yellow-500/30">
                  <div className="w-16 h-16 border-2 border-yellow-400/40 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
                </div>
                <div className="aspect-square bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-xl flex items-center justify-center border border-yellow-500/30">
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(9)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-3 h-3 bg-yellow-400/30 rounded-sm"
                        style={{ 
                          animationDelay: `${i * 0.2}s`,
                          animation: 'pulse 2s infinite'
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-300 mt-6 text-center">
                The visual system employs organic forms, golden ratios, and emergent patterns that shift between order and chaos.
              </p>
            </section>

            {/* Conceptual Framework */}
            <section className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-yellow-400">
                Conceptual Framework
              </h2>
              <div className="space-y-6">
                <div className="p-4 bg-yellow-900/20 rounded-xl border border-yellow-500/30">
                  <h3 className="text-lg font-semibold mb-2 text-yellow-300">Uncertainty as Beauty</h3>
                  <p className="text-gray-300 text-sm">
                    Rather than providing clear answers or defined outcomes, the work embraces ambiguity as a creative force, 
                    allowing meaning to emerge through personal interpretation and extended engagement.
                  </p>
                </div>
                <div className="p-4 bg-orange-900/20 rounded-xl border border-orange-500/30">
                  <h3 className="text-lg font-semibold mb-2 text-orange-300">Responsive Environments</h3>
                  <p className="text-gray-300 text-sm">
                    The digital landscape adapts to user behavior while maintaining its own autonomous logic, 
                    creating a dialog between human intention and machine interpretation.
                  </p>
                </div>
                <div className="p-4 bg-red-900/20 rounded-xl border border-red-500/30">
                  <h3 className="text-lg font-semibold mb-2 text-red-300">Temporal Layers</h3>
                  <p className="text-gray-300 text-sm">
                    Multiple time scales operate simultaneously—immediate interaction, gradual evolution, 
                    and deep structural changes that only become apparent through sustained observation.
                  </p>
                </div>
              </div>
            </section>

            {/* Project Links */}
            <section className="text-center py-12">
              <h2 className="text-3xl font-semibold mb-4 text-yellow-400">
                Experience the Work
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Interact with the full experience or explore the development process and documentation.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  className="inline-flex items-center px-8 py-3 text-black rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ 
                    backgroundColor: '#fbbf24',
                    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)'
                  }}
                >
                  Launch Experience
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button 
                  className="inline-flex items-center px-6 py-3 text-yellow-400 border border-yellow-400 rounded-full font-medium transition-all duration-300 hover:bg-yellow-400 hover:text-black"
                >
                  View Documentation
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Navigation Circle */}
      <div 
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full border-2 border-yellow-500 bg-black/80 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:border-yellow-400 z-30"
        onClick={toggleFooter}
        style={{
          transform: `rotate(${navCircleAtEnd ? '0deg' : '-90deg'})`,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
        }}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className="text-yellow-400"
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>

      {/* Footer */}
      <footer 
        className={`fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-gray-800 transform transition-transform duration-300 ease-in-out z-20 ${
          footerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">Related Experiments</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSidebarNavigation('/experiments/being-rhyme')}
                  className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                >
                  being + rhyme
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/experiments/cath3dral')}
                  className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                >
                  cath3dral
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/experiments')}
                  className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                >
                  All Experiments
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">Explore More</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSidebarNavigation('/thoughts')}
                  className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                >
                  Process Notes
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/works')}
                  className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                >
                  Other Works
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/about')}
                  className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
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
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center">
          <div className="bg-black border border-yellow-500/30 rounded-2xl p-8 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">Menu</h2>
              <button 
                onClick={toggleMenu}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200 text-yellow-400"
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
                className="block w-full text-left p-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 text-gray-300"
              >
                Home
              </button>
              <button 
                onClick={() => handleMenuNavigation('/experiments')}
                className="block w-full text-left p-3 hover:bg-yellow-900/20 rounded-lg transition-colors duration-200 text-yellow-400"
              >
                Experiments
              </button>
              <button 
                onClick={() => handleMenuNavigation('/thoughts')}
                className="block w-full text-left p-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 text-gray-300"
              >
                Thoughts
              </button>
              <button 
                onClick={() => handleMenuNavigation('/about')}
                className="block w-full text-left p-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 text-gray-300"
              >
                About
              </button>
              <button 
                onClick={() => handleMenuNavigation('/works')}
                className="block w-full text-left p-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 text-gray-300"
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

export default GoldenUnknownPage;