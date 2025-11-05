import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const HandsPage = () => {
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
  const [expandedAccordionItems, setExpandedAccordionItems] = useState(new Set());

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
        backgroundColor: '#fef7ed',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(255, 183, 77, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(254, 202, 202, 0.08) 0%, transparent 50%)
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
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.08) 40%, transparent 70%)',
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
                </div>
              )}
            </div>

            <button
              onClick={() => handleSidebarNavigation('/hands')}
              className="w-full text-left p-3 hover:bg-yellow-100 rounded-lg transition-colors duration-200 flex items-center space-x-3 bg-yellow-50 border border-yellow-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#f59e0b' }}>
                <path d="M9 11l3-3m0 0l3 3m-3-3v8"></path>
                <path d="M3 12c0 1.657 1.343 3 3 3h12c1.657 0 3-1.343 3-3s-1.343-3-3-3-3-1.343-3-3-1.343-3-3-3-3 1.343-3 3-1.343 3-3 3-3 1.343-3 3z"></path>
              </svg>
              <span style={{ color: '#f59e0b', fontWeight: '600' }}>Hands</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-6">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6" style={{ color: '#f59e0b', fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
              Hands
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              The tools we use to create, connect, and craft our digital futures.
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-16">
            {/* Introduction Section */}
            <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-yellow-200 shadow-sm">
              <h2 className="text-3xl font-semibold mb-6" style={{ color: '#f59e0b' }}>
                The Power of Making
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our hands are our most fundamental creative tools. From the earliest cave paintings to modern digital interfaces,
                  they translate our thoughts into tangible reality. Every click, swipe, and gesture is an act of creation.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  In the digital age, our hands dance across keyboards and touchscreens, sculpting experiences from pixels and code.
                  They bridge the gap between imagination and execution, turning abstract concepts into living, breathing interfaces.
                </p>
              </div>
            </section>

            {/* Skills Grid */}
            <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-yellow-200 shadow-sm">
              <h2 className="text-3xl font-semibold mb-6" style={{ color: '#f59e0b' }}>
                Crafted With Care
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-300">
                  <div className="text-4xl mb-4">✋</div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#f59e0b' }}>Design</h3>
                  <p className="text-gray-700">
                    Every interface, every interaction is carefully crafted by hand. From initial sketches to final pixels,
                    the human touch guides every decision.
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-300">
                  <div className="text-4xl mb-4">👆</div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#ea580c' }}>Code</h3>
                  <p className="text-gray-700">
                    Fingers translate logic into syntax, building the invisible architecture that powers our digital world.
                    Each line typed with intention and purpose.
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-300">
                  <div className="text-4xl mb-4">🤝</div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#d97706' }}>Collaboration</h3>
                  <p className="text-gray-700">
                    Great work emerges when hands join together. Team collaboration, pair programming, and shared creation
                    multiply our creative potential.
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-300">
                  <div className="text-4xl mb-4">👋</div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#f59e0b' }}>Connection</h3>
                  <p className="text-gray-700">
                    Through our hands, we reach out and connect with users around the world, creating experiences
                    that resonate and inspire.
                  </p>
                </div>
              </div>
            </section>

            {/* Philosophy Section */}
            <section className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-yellow-300 shadow-lg">
              <h2 className="text-3xl font-semibold mb-6" style={{ color: '#f59e0b' }}>
                Hands-On Philosophy
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">🎨</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#f59e0b' }}>
                      Start With Sketches
                    </h3>
                    <p className="text-gray-700">
                      The best ideas often start with pencil and paper. Quick sketches and rough prototypes help us
                      think through problems before committing to code.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="text-3xl">🔨</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#f59e0b' }}>
                      Build Real Things
                    </h3>
                    <p className="text-gray-700">
                      Theory only takes you so far. We learn by doing, by getting our hands dirty with real projects
                      and tangible challenges.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="text-3xl">✨</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#f59e0b' }}>
                      Polish With Pride
                    </h3>
                    <p className="text-gray-700">
                      The final touches matter. We take pride in hand-crafting every detail, ensuring each interaction
                      feels intentional and delightful.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Call to Action */}
            <section className="text-center py-12">
              <h2 className="text-3xl font-semibold mb-4" style={{ color: '#f59e0b' }}>
                Let's Build Something Together
              </h2>
              <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                Great work happens when creative hands collaborate. Ready to make something amazing?
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-8 py-3 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: '#f59e0b',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                }}
              >
                Return Home
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </section>
          </div>
        </div>
      </main>

      {/* Navigation Circle */}
      <div
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full border-2 border-yellow-400 bg-white/80 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:border-orange-400 z-30"
        onClick={toggleFooter}
        style={{
          transform: `rotate(${navCircleAtEnd ? '0deg' : '-90deg'})`,
          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)'
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: '#f59e0b' }}
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>

      {/* Footer */}
      <footer
        className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-yellow-200 transform transition-transform duration-300 ease-in-out z-20 ${
          footerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#f59e0b' }}>Connect</h3>
              <div className="space-y-2">
                <a href="mailto:hello@yellowcircle.dev" className="block text-gray-700 hover:text-orange-600 transition-colors duration-200">
                  hello@yellowcircle.dev
                </a>
                <a href="#" className="block text-gray-700 hover:text-orange-600 transition-colors duration-200">
                  LinkedIn
                </a>
                <a href="#" className="block text-gray-700 hover:text-orange-600 transition-colors duration-200">
                  Twitter
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#f59e0b' }}>Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleSidebarNavigation('/')}
                  className="block text-gray-700 hover:text-orange-600 transition-colors duration-200 text-left"
                >
                  Home
                </button>
                <button
                  onClick={() => handleSidebarNavigation('/experiments')}
                  className="block text-gray-700 hover:text-orange-600 transition-colors duration-200 text-left"
                >
                  Experiments
                </button>
                <button
                  onClick={() => handleSidebarNavigation('/about')}
                  className="block text-gray-700 hover:text-orange-600 transition-colors duration-200 text-left"
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
              <h2 className="text-2xl font-bold" style={{ color: '#f59e0b' }}>Menu</h2>
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
                onClick={() => handleMenuNavigation('/hands')}
                className="block w-full text-left p-3 hover:bg-yellow-100 rounded-lg transition-colors duration-200"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
              >
                <span style={{ color: '#f59e0b' }}>Hands</span>
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

export default HandsPage;
