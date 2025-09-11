import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const Cath3dralPage = () => {
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
        backgroundColor: '#0a0a0a',
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)
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
      <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-gray-900/80 backdrop-blur-sm">
        <button 
          onClick={() => navigate('/')}
          className="text-2xl font-bold text-blue-400 hover:text-orange-400 transition-colors duration-300"
          style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
        >
          yellowCIRCLE
        </button>
        
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200 text-blue-400"
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
        className={`fixed top-0 right-0 h-full bg-gray-900/95 backdrop-blur-md border-l border-gray-700 transform transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-blue-400">Navigation</h2>
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200 text-blue-400"
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
                className="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition-colors duration-200 flex items-center justify-between bg-blue-900/20 border border-blue-500/30"
              >
                <div className="flex items-center space-x-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                    <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 11h6"></path>
                  </svg>
                  <span className="text-blue-400">Experiments</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`transform transition-transform duration-200 text-blue-400 ${expandedAccordionItems.has('experiments') ? 'rotate-180' : ''}`}
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
                    className="block w-full text-left p-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors duration-200"
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
                    className="block w-full text-left p-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors duration-200"
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
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
                Back to Experiments
              </button>
            </div>
            <h1 className="text-5xl font-bold mb-6 text-blue-400" style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}>
              cath3dral
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              A contemplative exploration of sacred spaces in digital form. An immersive 3D environment 
              that translates the experience of cathedral architecture into interactive code.
            </p>
          </div>

          {/* Project Content */}
          <div className="space-y-16">
            {/* Project Overview */}
            <section className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-blue-400">
                Overview
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-300 leading-relaxed mb-4">
                  "Cath3dral" explores the transcendent qualities of sacred architecture through code and computation. 
                  This project reimagines the cathedral not as a physical structure, but as a digital space that 
                  captures the essence of reverence, verticality, and luminous beauty.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  The work combines 3D graphics, spatial audio, and procedural generation to create an environment 
                  that evolves over time. Each visit reveals new configurations while maintaining the fundamental 
                  sense of awe and contemplation that defines sacred spaces.
                </p>
              </div>
            </section>

            {/* Technical Details */}
            <section className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-blue-400">
                Technical Implementation
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-blue-300">3D Rendering</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Three.js for WebGL 3D graphics</li>
                    <li>• Procedural geometry generation</li>
                    <li>• Dynamic lighting and shadows</li>
                    <li>• Volumetric fog and atmosphere</li>
                    <li>• Real-time reflections and refractions</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-blue-300">Spatial Experience</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• First-person navigation controls</li>
                    <li>• Spatial audio with reverb modeling</li>
                    <li>• Physics-based interaction</li>
                    <li>• Adaptive performance optimization</li>
                    <li>• VR/AR compatibility (experimental)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Architectural Elements */}
            <section className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-blue-400">
                Digital Architecture
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-blue-900/20 rounded-xl border border-blue-500/30">
                  <div className="w-16 h-24 mx-auto mb-4 bg-gradient-to-t from-blue-600/30 to-blue-400/30 rounded-sm"></div>
                  <h3 className="text-lg font-semibold mb-2 text-blue-300 text-center">Pillars</h3>
                  <p className="text-gray-300 text-sm text-center">
                    Procedurally generated columns that reach toward infinite height
                  </p>
                </div>
                <div className="p-6 bg-purple-900/20 rounded-xl border border-purple-500/30">
                  <div className="w-20 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-600/30 to-purple-400/30 rounded-t-full"></div>
                  <h3 className="text-lg font-semibold mb-2 text-purple-300 text-center">Arches</h3>
                  <p className="text-gray-300 text-sm text-center">
                    Flowing curves that frame passages and create spatial rhythm
                  </p>
                </div>
                <div className="p-6 bg-indigo-900/20 rounded-xl border border-indigo-500/30">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-600/30 to-indigo-400/30 rounded-full opacity-60"></div>
                  <h3 className="text-lg font-semibold mb-2 text-indigo-300 text-center">Light</h3>
                  <p className="text-gray-300 text-sm text-center">
                    Dynamic illumination that shifts like sun through stained glass
                  </p>
                </div>
              </div>
            </section>

            {/* Conceptual Framework */}
            <section className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-blue-400">
                Conceptual Framework
              </h2>
              <div className="space-y-6">
                <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-500/30">
                  <h3 className="text-lg font-semibold mb-2 text-blue-300">Sacred Geometry</h3>
                  <p className="text-gray-300 text-sm">
                    Mathematical principles that have guided cathedral builders for centuries are 
                    translated into algorithmic form, creating spaces that feel both ancient and futuristic.
                  </p>
                </div>
                <div className="p-4 bg-purple-900/20 rounded-xl border border-purple-500/30">
                  <h3 className="text-lg font-semibold mb-2 text-purple-300">Temporal Layers</h3>
                  <p className="text-gray-300 text-sm">
                    The space evolves across multiple time scales—immediate interaction, daily cycles, 
                    and longer architectural transformations that unfold over weeks and months.
                  </p>
                </div>
                <div className="p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/30">
                  <h3 className="text-lg font-semibold mb-2 text-indigo-300">Digital Pilgrimage</h3>
                  <p className="text-gray-300 text-sm">
                    Navigation through the space becomes a form of contemplative practice, encouraging 
                    slow movement and mindful observation of detail and atmosphere.
                  </p>
                </div>
              </div>
            </section>

            {/* Interactive Features */}
            <section className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
              <h2 className="text-3xl font-semibold mb-6 text-blue-400">
                Experience Elements
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold mb-2 text-blue-300">Exploration</h3>
                  <p className="text-gray-300 text-xs">Navigate freely through endless sacred spaces</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold mb-2 text-purple-300">Customization</h3>
                  <p className="text-gray-300 text-xs">Adjust lighting, atmosphere, and architectural style</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
                      <path d="M9 19c-5 0-8-3-8-8s3-8 8-8 8 3 8 8-3 8-8 8"></path>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                      <line x1="9" y1="9" x2="9.01" y2="9"></line>
                      <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold mb-2 text-indigo-300">Meditation</h3>
                  <p className="text-gray-300 text-xs">Guided contemplative experiences and soundscapes</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-400">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold mb-2 text-teal-300">Community</h3>
                  <p className="text-gray-300 text-xs">Share spaces and experiences with other visitors</p>
                </div>
              </div>
            </section>

            {/* Project Links */}
            <section className="text-center py-12">
              <h2 className="text-3xl font-semibold mb-4 text-blue-400">
                Enter the Cathedral
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Experience the intersection of sacred architecture and digital art in this immersive 3D environment.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  className="inline-flex items-center px-8 py-3 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{ 
                    backgroundColor: '#3b82f6',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  Enter Cathedral
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <button 
                  className="inline-flex items-center px-6 py-3 text-blue-400 border border-blue-400 rounded-full font-medium transition-all duration-300 hover:bg-blue-400 hover:text-white"
                >
                  Technical Details
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Navigation Circle */}
      <div 
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full border-2 border-blue-500 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:border-blue-400 z-30"
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
          className="text-blue-400"
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>

      {/* Footer */}
      <footer 
        className={`fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700 transform transition-transform duration-300 ease-in-out z-20 ${
          footerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Related Experiments</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSidebarNavigation('/experiments/golden-unknown')}
                  className="block text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  golden unknown
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/experiments/being-rhyme')}
                  className="block text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  being + rhyme
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/experiments')}
                  className="block text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  All Experiments
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Explore More</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleSidebarNavigation('/thoughts')}
                  className="block text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Process Notes
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/works')}
                  className="block text-gray-300 hover:text-blue-400 transition-colors duration-200"
                >
                  Other Works
                </button>
                <button 
                  onClick={() => handleSidebarNavigation('/about')}
                  className="block text-gray-300 hover:text-blue-400 transition-colors duration-200"
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
          <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-8 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-400">Menu</h2>
              <button 
                onClick={toggleMenu}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200 text-blue-400"
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
                className="block w-full text-left p-3 hover:bg-blue-900/20 rounded-lg transition-colors duration-200 text-blue-400"
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

export default Cath3dralPage;