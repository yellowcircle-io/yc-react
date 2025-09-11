import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const BeingRhymePage = () => {
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
        backgroundColor: '#1a1a2e',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)
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
          background: 'radial-gradient(circle, rgba(255, 183, 77, 0.2) 0%, rgba(255, 183, 77, 0.05) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(1px)',
          ...circleTransform
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-purple-900/80 backdrop-blur-sm">
        <button 
          onClick={() => navigate('/')}
          className="text-2xl font-bold text-purple-300 hover:text-orange-400 transition-colors duration-300"
          style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
        >
          yellowCIRCLE
        </button>
        
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-purple-800 rounded-lg transition-colors duration-200 text-purple-300"
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
        className={`fixed top-0 right-0 h-full bg-purple-900/95 backdrop-blur-md border-l border-purple-800 transform transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-purple-300">Navigation</h2>
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-purple-800 rounded-lg transition-colors duration-200 text-purple-300"
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
              className="w-full text-left p-3 hover:bg-purple-800 rounded-lg transition-colors duration-200 flex items-center space-x-3 text-purple-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              <span>Home</span>
            </button>

            <div className="space-y-1">
              <button 
                onClick={() => toggleAccordionItem('experiments')}
                className="w-full text-left p-3 hover:bg-purple-800 rounded-lg transition-colors duration-200 flex items-center justify-between bg-purple-800/40 border border-purple-600/30"
              >
                <div className="flex items-center space-x-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300">
                    <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 11h6"></path>
                  </svg>
                  <span className="text-purple-300">Experiments</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transform transition-transform duration-200 text-purple-300 ${expandedAccordionItems.has('experiments') ? 'rotate-180' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              
              {expandedAccordionItems.has('experiments') && (
                <div className="ml-8 space-y-1 overflow-hidden">
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments')}
                    className="block w-full text-left p-2 text-sm text-purple-300 hover:text-purple-200 hover:bg-purple-800 rounded transition-colors duration-200"
                  >
                    All Experiments
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments/golden-unknown')}
                    className="block w-full text-left p-2 text-sm text-purple-300 hover:text-purple-200 hover:bg-purple-800 rounded transition-colors duration-200"
                  >
                    golden unknown
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments/being-rhyme')}
                    className="block w-full text-left p-2 text-sm text-pink-300 hover:text-pink-200 hover:bg-pink-900/20 rounded transition-colors duration-200"
                  >
                    being + rhyme
                  </button>
                  <button 
                    onClick={() => handleSidebarNavigation('/experiments/cath3dral')}
                    className="block w-full text-left p-2 text-sm text-purple-300 hover:text-purple-200 hover:bg-purple-800 rounded transition-colors duration-200"
                  >
                    cath3dral
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => handleSidebarNavigation('/thoughts')}
              className="w-full text-left p-3 hover:bg-purple-800 rounded-lg transition-colors duration-200 flex items-center space-x-3 text-purple-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
              <span>Thoughts</span>
            </button>

            <button 
              onClick={() => handleSidebarNavigation('/about')}
              className="w-full text-left p-3 hover:bg-purple-800 rounded-lg transition-colors duration-200 flex items-center space-x-3 text-purple-200"
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
              className="w-full text-left p-3 hover:bg-purple-800 rounded-lg transition-colors duration-200 flex items-center space-x-3 text-purple-200"
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
                className="text-purple-300 hover:text-purple-200 transition-colors duration-200 flex items-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
                Back to Experiments
              </button>
            </div>
            <h1 className="text-5xl font-bold mb-6 text-pink-400" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
              being + rhyme
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto leading-relaxed">
              An exploration of identity, language, and rhythm through generative poetry and interactive soundscapes. 
              Where the boundaries between being and becoming dissolve into verse.
            </p>
          </div>

          {/* Project Content */}
          <div className="space-y-16">
            {/* Project Overview */}
            <section className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-8 border border-pink-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-pink-400">
                Overview
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-purple-200 leading-relaxed mb-4">
                  "Being + Rhyme" emerged from questions about the nature of identity in digital spaces and the role of 
                  language in constructing our sense of self. This interactive work generates poetry in real-time, 
                  responding to user input while maintaining its own evolving voice and perspective.
                </p>
                <p className="text-purple-200 leading-relaxed">
                  The piece explores the tension between individual expression and collective linguistic patterns, 
                  creating verses that feel both familiar and strange, personal and universal. Each interaction 
                  contributes to an ever-growing corpus of generated text that shapes future responses.
                </p>
              </div>
            </section>

            {/* Technical Details */}
            <section className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-8 border border-pink-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-pink-400">
                Technical Implementation
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-pink-300">Language Processing</h3>
                  <ul className="space-y-2 text-purple-200">
                    <li>• Natural language processing for semantic analysis</li>
                    <li>• Markov chain text generation</li>
                    <li>• Phonetic pattern recognition</li>
                    <li>• Real-time sentiment analysis</li>
                    <li>• Dynamic vocabulary expansion</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-pink-300">Audio & Interaction</h3>
                  <ul className="space-y-2 text-purple-200">
                    <li>• Text-to-speech with emotional inflection</li>
                    <li>• Rhythm-based generative music</li>
                    <li>• Voice input and analysis</li>
                    <li>• Gesture-controlled parameters</li>
                    <li>• Collaborative composition features</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Poetry Examples */}
            <section className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-8 border border-pink-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-pink-400">
                Generated Verses
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 bg-pink-900/20 rounded-xl border border-pink-500/30">
                  <div className="text-pink-200 font-mono text-sm leading-relaxed italic">
                    "in digital dreams we breathe<br/>
                    between pixels and possibility<br/>
                    your voice becomes mine becomes<br/>
                    ours in the endless echo<br/>
                    of being, being, being..."
                  </div>
                  <div className="mt-4 text-xs text-purple-300">Generated from user input: "identity"</div>
                </div>
                <div className="p-6 bg-purple-800/20 rounded-xl border border-purple-500/30">
                  <div className="text-purple-200 font-mono text-sm leading-relaxed italic">
                    "rhythm finds me in the space<br/>
                    between heartbeat and algorithm<br/>
                    where words learn to dance<br/>
                    without feet, without fear<br/>
                    only the eternal now of sound"
                  </div>
                  <div className="mt-4 text-xs text-purple-300">Generated from user input: "music"</div>
                </div>
              </div>
              <p className="text-purple-200 mt-6 text-center text-sm">
                Each verse is unique, generated through interaction with the user's input and the system's evolving memory.
              </p>
            </section>

            {/* Conceptual Framework */}
            <section className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-8 border border-pink-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-pink-400">
                Conceptual Framework
              </h2>
              <div className="space-y-6">
                <div className="p-4 bg-pink-900/20 rounded-xl border border-pink-500/30">
                  <h3 className="text-lg font-semibold mb-2 text-pink-300">Identity as Process</h3>
                  <p className="text-purple-200 text-sm">
                    Rather than treating identity as fixed, the work explores selfhood as an ongoing 
                    negotiation between internal patterns and external influences.
                  </p>
                </div>
                <div className="p-4 bg-purple-800/20 rounded-xl border border-purple-500/30">
                  <h3 className="text-lg font-semibold mb-2 text-purple-300">Collaborative Meaning</h3>
                  <p className="text-purple-200 text-sm">
                    Meaning emerges through the interaction between human intention and machine interpretation, 
                    creating new forms of collaborative creativity.
                  </p>
                </div>
                <div className="p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/30">
                  <h3 className="text-lg font-semibold mb-2 text-indigo-300">Linguistic Evolution</h3>
                  <p className="text-purple-200 text-sm">
                    The system's language patterns evolve over time, influenced by user interactions 
                    and developing its own distinctive voice and perspective.
                  </p>
                </div>
              </div>
            </section>

            {/* Interactive Features */}
            <section className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-8 border border-pink-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-pink-400">
                Interactive Elements
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-400">
                      <path d="M12 1v22M17.5 2.5l-11 19M2.5 17.5l19-11M7 12h10"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-pink-300">Voice Input</h3>
                  <p className="text-purple-200 text-sm">Speak words or phrases to seed the generation process</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polygon points="10,8 16,12 10,16 10,8"></polygon>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-purple-300">Audio Playback</h3>
                  <p className="text-purple-200 text-sm">Listen to generated poetry with dynamic vocal expression</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-indigo-300">Real-time Response</h3>
                  <p className="text-purple-200 text-sm">Experience immediate poetic responses to your input</p>
                </div>
              </div>
            </section>

            {/* Project Links */}
            <section className="text-center py-12">
              <h2 className="text-3xl font-semibold mb-4 text-pink-400">
                Experience the Poetry
              </h2>
              <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
                Engage with the interactive poetry generator and explore the intersection of being and language.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  className="inline-flex items-center px-8 py-3 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ 
                    backgroundColor: '#ec4899',
                    boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)'
                  }}
                >
                  Start Creating
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v22M17.5 2.5l-11 19M2.5 17.5l19-11M7 12h10" />
                  </svg>
                </button>
                <button 
                  className="inline-flex items-center px-6 py-3 text-pink-400 border border-pink-400 rounded-full font-medium transition-all duration-300 hover:bg-pink-400 hover:text-white"
                >
                  View Source Code
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Navigation Circle */}
      <div 
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full border-2 border-pink-500 bg-purple-900/80 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:border-pink-400 z-30"
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
          className="text-pink-400"
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>

      {/* Footer */}
      <footer 
        className={`fixed bottom-0 left-0 right-0 bg-purple-900/95 backdrop-blur-md border-t border-purple-800 transform transition-transform duration-300 ease-in-out z-20 ${
          footerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-pink-400">Related Experiments</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSidebarNavigation('/experiments/golden-unknown')}
                  className="block text-purple-200 hover:text-pink-400 transition-colors duration-200"
                >
                  golden unknown
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/experiments/cath3dral')}
                  className="block text-purple-200 hover:text-pink-400 transition-colors duration-200"
                >
                  cath3dral
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/experiments')}
                  className="block text-purple-200 hover:text-pink-400 transition-colors duration-200"
                >
                  All Experiments
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-pink-400">Explore More</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSidebarNavigation('/thoughts')}
                  className="block text-purple-200 hover:text-pink-400 transition-colors duration-200"
                >
                  Process Notes
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/works')}
                  className="block text-purple-200 hover:text-pink-400 transition-colors duration-200"
                >
                  Other Works
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/about')}
                  className="block text-purple-200 hover:text-pink-400 transition-colors duration-200"
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
          <div className="bg-purple-900 border border-pink-500/30 rounded-2xl p-8 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-pink-400">Menu</h2>
              <button 
                onClick={toggleMenu}
                className="p-2 hover:bg-purple-800 rounded-lg transition-colors duration-200 text-pink-400"
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
                className="block w-full text-left p-3 hover:bg-purple-800 rounded-lg transition-colors duration-200 text-purple-200"
              >
                Home
              </button>
              <button 
                onClick={() => handleMenuNavigation('/experiments')}
                className="block w-full text-left p-3 hover:bg-pink-900/20 rounded-lg transition-colors duration-200 text-pink-400"
              >
                Experiments
              </button>
              <button 
                onClick={() => handleMenuNavigation('/thoughts')}
                className="block w-full text-left p-3 hover:bg-purple-800 rounded-lg transition-colors duration-200 text-purple-200"
              >
                Thoughts
              </button>
              <button 
                onClick={() => handleMenuNavigation('/about')}
                className="block w-full text-left p-3 hover:bg-purple-800 rounded-lg transition-colors duration-200 text-purple-200"
              >
                About
              </button>
              <button 
                onClick={() => handleMenuNavigation('/works')}
                className="block w-full text-left p-3 hover:bg-purple-800 rounded-lg transition-colors duration-200 text-purple-200"
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

export default BeingRhymePage;