import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// COMPLETE 17-Frame Transformation Data Structure - ALL SVGs POPULATED
const transformations = [
  {
    id: 1,
    type: 'fetus_egg',
    title: 'Cosmic Egg',
    description: 'Primordial beginning',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="fetusGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#EECF00" />
          <stop offset="100%" stop-color="#FFFFFF" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="100" rx="60" ry="80" fill="url(#fetusGrad)" stroke="#000000" stroke-width="3"/>
      <circle cx="100" cy="70" r="20" fill="#EECF00" opacity="0.8"/>
      <path d="M80,120 Q100,140 120,120" stroke="#000000" stroke-width="3" fill="none"/>
    </svg>`,
    colors: ['#EECF00', '#FFFFFF', '#000000']
  },
  {
    id: 2,
    type: 'baby',
    title: 'Birth of Form',
    description: 'Life emergence',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="35" fill="#EECF00" stroke="#000000" stroke-width="2"/>
      <circle cx="85" cy="75" r="6" fill="#000000"/>
      <circle cx="115" cy="75" r="6" fill="#000000"/>
      <ellipse cx="100" cy="85" rx="3" ry="5" fill="#000000"/>
      <path d="M90,90 Q100,95 110,90" stroke="#000000" stroke-width="2" fill="none"/>
      <ellipse cx="100" cy="130" rx="28" ry="35" fill="#FFFFFF"/>
      <ellipse cx="75" cy="120" rx="15" ry="20" fill="#EECF00"/>
      <ellipse cx="125" cy="120" rx="15" ry="20" fill="#EECF00"/>
    </svg>`,
    colors: ['#EECF00', '#FFFFFF', '#000000']
  },
  {
    id: 3,
    type: 'sun',
    title: 'Solar Radiance',
    description: 'Luminous transformation',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#EECF00" />
          <stop offset="70%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#000000" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="40" fill="url(#sunGrad)"/>
      ${Array.from({length: 16}, (_, i) => {
        const angle = (i * 22.5) * (Math.PI / 180);
        const x1 = 100 + Math.cos(angle) * 50;
        const y1 = 100 + Math.sin(angle) * 50;
        const x2 = 100 + Math.cos(angle) * 75;
        const y2 = 100 + Math.sin(angle) * 75;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#EECF00" stroke-width="4"/>`;
      }).join('')}
    </svg>`,
    colors: ['#EECF00', '#FFFFFF', '#000000']
  },
  {
    id: 4,
    type: 'moon',
    title: 'Lunar Transition',
    description: 'Celestial shift',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="moonGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#EECF00" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="50" fill="url(#moonGrad)" stroke="#000000" stroke-width="2"/>
      <circle cx="120" cy="80" r="8" fill="#000000" opacity="0.4"/>
      <circle cx="85" cy="70" r="5" fill="#000000" opacity="0.3"/>
      <circle cx="110" cy="120" r="12" fill="#000000" opacity="0.35"/>
      <circle cx="75" cy="110" r="6" fill="#000000" opacity="0.25"/>
      <path d="M70,100 Q100,70 130,100" stroke="#000000" stroke-width="2" fill="none" opacity="0.3"/>
    </svg>`,
    colors: ['#FFFFFF', '#EECF00', '#000000']
  },
  {
    id: 5,
    type: 'stars',
    title: 'Stellar Field',
    description: 'Particle dissolution',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#000000"/>
      <circle cx="40" cy="40" r="3" fill="#EECF00" opacity="0.8"/>
      <circle cx="80" cy="30" r="2" fill="#EECF00" opacity="0.9"/>
      <circle cx="120" cy="50" r="4" fill="#EECF00" opacity="0.7"/>
      <circle cx="160" cy="35" r="2" fill="#EECF00" opacity="0.8"/>
      <circle cx="30" cy="80" r="3" fill="#EECF00" opacity="0.6"/>
      <circle cx="70" cy="70" r="2" fill="#EECF00" opacity="0.9"/>
      <circle cx="110" cy="90" r="3" fill="#EECF00" opacity="0.8"/>
      <circle cx="150" cy="75" r="2" fill="#EECF00" opacity="0.7"/>
      <circle cx="45" cy="120" r="4" fill="#EECF00" opacity="0.9"/>
      <circle cx="85" cy="110" r="2" fill="#EECF00" opacity="0.6"/>
      <circle cx="125" cy="130" r="3" fill="#EECF00" opacity="0.8"/>
      <circle cx="165" cy="115" r="2" fill="#EECF00" opacity="0.7"/>
      <circle cx="35" cy="160" r="3" fill="#EECF00" opacity="0.8"/>
      <circle cx="75" cy="150" r="2" fill="#EECF00" opacity="0.9"/>
      <circle cx="115" cy="170" r="4" fill="#EECF00" opacity="0.6"/>
      <circle cx="155" cy="155" r="2" fill="#EECF00" opacity="0.8"/>
    </svg>`,
    colors: ['#000000', '#EECF00', '#EECF00']
  },
  {
    id: 6,
    type: 'single_star',
    title: 'Stellar Convergence',
    description: 'Unity formation',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#000000"/>
      <defs>
        <radialGradient id="starGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#EECF00" />
          <stop offset="100%" stop-color="#EECF00" />
        </radialGradient>
      </defs>
      <polygon points="100,30 110,70 150,70 120,95 130,135 100,110 70,135 80,95 50,70 90,70"
               fill="url(#starGrad)" stroke="#EECF00" stroke-width="2"/>
      <circle cx="100" cy="100" r="15" fill="#EECF00" opacity="0.8"/>
    </svg>`,
    colors: ['#EECF00', '#EECF00', '#000000']
  },
  {
    id: 7,
    type: 'eye_iris',
    title: 'Cosmic Vision',
    description: 'Cosmic to organic',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000000" />
          <stop offset="70%" stop-color="#000000" />
          <stop offset="100%" stop-color="#FFFFFF" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="100" rx="80" ry="40" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <circle cx="100" cy="100" r="35" fill="url(#irisGrad)"/>
      <circle cx="100" cy="100" r="15" fill="#000000"/>
      <circle cx="105" cy="95" r="5" fill="#FFFFFF" opacity="0.8"/>
      <path d="M60,100 Q100,80 140,100" stroke="#000000" stroke-width="2" fill="none"/>
      <path d="M60,100 Q100,120 140,100" stroke="#000000" stroke-width="2" fill="none"/>
    </svg>`,
    colors: ['#000000', '#000000', '#FFFFFF']
  },
  {
    id: 8,
    type: 'wheel',
    title: 'Mechanical Form',
    description: 'Organic to mechanical',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="70" fill="none" stroke="#000000" stroke-width="6"/>
      <circle cx="100" cy="100" r="20" fill="#000000" stroke="#000000" stroke-width="3"/>
      ${Array.from({length: 8}, (_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const x1 = 100 + Math.cos(angle) * 25;
        const y1 = 100 + Math.sin(angle) * 25;
        const x2 = 100 + Math.cos(angle) * 65;
        const y2 = 100 + Math.sin(angle) * 65;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="4"/>`;
      }).join('')}
      ${Array.from({length: 8}, (_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const x = 100 + Math.cos(angle) * 70;
        const y = 100 + Math.sin(angle) * 70;
        return `<circle cx="${x}" cy="${y}" r="8" fill="#000000"/>`;
      }).join('')}
    </svg>`,
    colors: ['#000000', '#000000', '#000000']
  },
  {
    id: 9,
    type: 'eye_hand',
    title: 'Dual Genesis',
    description: 'Dual generation',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="70" cy="70" rx="40" ry="20" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <path d="M30,70 Q70,85 110,70" stroke="#000000" stroke-width="3" fill="none"/>
      <ellipse cx="130" cy="130" rx="15" ry="25" fill="#EECF00" stroke="#EECF00" stroke-width="2"/>
      <ellipse cx="115" cy="115" rx="8" ry="20" fill="#EECF00"/>
      <ellipse cx="125" cy="110" rx="8" ry="18" fill="#EECF00"/>
      <ellipse cx="135" cy="112" rx="8" ry="16" fill="#EECF00"/>
      <ellipse cx="145" cy="118" rx="7" ry="14" fill="#EECF00"/>
      <path d="M90,80 Q110,100 120,120" stroke="#000000" stroke-width="2" fill="none" opacity="0.6"/>
    </svg>`,
    colors: ['#FFFFFF', '#000000', '#EECF00']
  },
  {
    id: 10,
    type: 'shiva_hands',
    title: 'Divine Multiplication',
    description: 'Sacred geometry',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="130" rx="20" ry="40" fill="#000000"/>
      ${Array.from({length: 6}, (_, i) => {
        const angle = (i * 60) * (Math.PI / 180);
        const x = 100 + Math.cos(angle) * 60;
        const y = 100 + Math.sin(angle) * 60;
        const handAngle = angle + Math.PI/2;
        return `
          <line x1="100" y1="100" x2="${x}" y2="${y}" stroke="#000000" stroke-width="4"/>
          <ellipse cx="${x}" cy="${y}" rx="8" ry="15" fill="#000000"
                   transform="rotate(${handAngle * 180 / Math.PI} ${x} ${y})"/>
        `;
      }).join('')}
      <circle cx="100" cy="100" r="25" fill="#000000" stroke="#000000" stroke-width="3"/>
    </svg>`,
    colors: ['#000000', '#000000', '#000000']
  },
  {
    id: 11,
    type: 'red_tears',
    title: 'Crimson Flow',
    description: 'Liquid formation',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="70" cy="60" rx="20" ry="12" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <ellipse cx="130" cy="60" rx="20" ry="12" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
      <circle cx="70" cy="60" r="8" fill="#000000"/>
      <circle cx="130" cy="60" r="8" fill="#000000"/>
      <ellipse cx="70" cy="80" rx="3" ry="8" fill="#000000" opacity="0.8"/>
      <ellipse cx="130" cy="80" rx="3" ry="8" fill="#000000" opacity="0.8"/>
      <ellipse cx="70" cy="95" rx="3" ry="8" fill="#000000" opacity="0.7"/>
      <ellipse cx="130" cy="95" rx="3" ry="8" fill="#000000" opacity="0.7"/>
      <ellipse cx="70" cy="110" rx="3" ry="8" fill="#000000" opacity="0.6"/>
      <ellipse cx="130" cy="110" rx="3" ry="8" fill="#000000" opacity="0.6"/>
      <path d="M70,90 Q75,110 80,130 Q85,150 90,170" stroke="#000000" stroke-width="4" fill="none"/>
      <path d="M130,90 Q125,110 120,130 Q115,150 110,170" stroke="#000000" stroke-width="4" fill="none"/>
    </svg>`,
    colors: ['#000000', '#000000', '#FFFFFF']
  },
  {
    id: 12,
    type: 'pool',
    title: 'Crimson Pool',
    description: 'Flow dynamics',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="poolGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#000000" />
          <stop offset="100%" stop-color="#000000" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="140" rx="70" ry="40" fill="url(#poolGrad)" stroke="#000000" stroke-width="2"/>
      <ellipse cx="100" cy="140" rx="50" ry="28" fill="none" stroke="#000000" stroke-width="1" opacity="0.6"/>
      <ellipse cx="100" cy="140" rx="30" ry="18" fill="none" stroke="#000000" stroke-width="1" opacity="0.4"/>
      <circle cx="85" cy="100" r="3" fill="#000000"/>
      <circle cx="115" cy="110" r="2" fill="#000000" opacity="0.8"/>
      <path d="M85,100 L88,135" stroke="#000000" stroke-width="2" opacity="0.6"/>
      <path d="M115,110 L110,135" stroke="#000000" stroke-width="1" opacity="0.5"/>
    </svg>`,
    colors: ['#000000', '#000000', '#000000']
  },
  {
    id: 13,
    type: 'sword',
    title: 'Steel Formation',
    description: 'Liquid to solid',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="50%" stop-color="#000000" />
          <stop offset="100%" stop-color="#FFFFFF" />
        </linearGradient>
      </defs>
      <polygon points="100,30 110,150 100,160 90,150" fill="url(#bladeGrad)" stroke="#000000" stroke-width="2"/>
      <line x1="100" y1="40" x2="100" y2="140" stroke="#000000" stroke-width="2"/>
      <rect x="70" y="150" width="60" height="8" fill="#EECF00" stroke="#EECF00" stroke-width="1"/>
      <rect x="92" y="158" width="16" height="25" fill="#EECF00" stroke="#000000" stroke-width="1"/>
      <circle cx="100" cy="185" r="8" fill="#EECF00" stroke="#EECF00" stroke-width="2"/>
    </svg>`,
    colors: ['#000000', '#FFFFFF', '#EECF00']
  },
  {
    id: 14,
    type: 'cross',
    title: 'Sacred Geometry',
    description: 'Geometric religious',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#EECF00" />
          <stop offset="50%" stop-color="#EECF00" />
          <stop offset="100%" stop-color="#EECF00" />
        </linearGradient>
      </defs>
      <rect x="85" y="40" width="30" height="120" fill="url(#crossGrad)" stroke="#EECF00" stroke-width="2"/>
      <rect x="50" y="85" width="100" height="30" fill="url(#crossGrad)" stroke="#EECF00" stroke-width="2"/>
      <circle cx="100" cy="100" r="15" fill="#EECF00" stroke="#EECF00" stroke-width="2"/>
      <circle cx="100" cy="100" r="8" fill="#EECF00"/>
      <circle cx="100" cy="50" r="5" fill="#EECF00"/>
      <circle cx="100" cy="150" r="5" fill="#EECF00"/>
      <circle cx="60" cy="100" r="5" fill="#EECF00"/>
      <circle cx="140" cy="100" r="5" fill="#EECF00"/>
    </svg>`,
    colors: ['#EECF00', '#EECF00', '#EECF00']
  },
  {
    id: 15,
    type: 'clock',
    title: 'Temporal Gateway',
    description: 'Time manifestation (10:34)',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="75" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
      <circle cx="100" cy="100" r="65" fill="none" stroke="#FFFFFF" stroke-width="2"/>
      ${Array.from({length: 12}, (_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x1 = 100 + Math.cos(angle) * 55;
        const y1 = 100 + Math.sin(angle) * 55;
        const x2 = 100 + Math.cos(angle) * 65;
        const y2 = 100 + Math.sin(angle) * 65;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="3"/>`;
      }).join('')}
      <line x1="100" y1="100" x2="70" y2="64" stroke="#000000" stroke-width="6" stroke-linecap="round"/>
      <line x1="100" y1="100" x2="125" y2="145" stroke="#000000" stroke-width="4" stroke-linecap="round"/>
      <circle cx="100" cy="100" r="8" fill="#000000"/>
    </svg>`,
    colors: ['#FFFFFF', '#FFFFFF', '#000000']
  },
  {
    id: 16,
    type: 'full_circle',
    title: 'Unity Complete',
    description: 'Completion cycle',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="circleGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#EECF00" />
          <stop offset="30%" stop-color="#EECF00" />
          <stop offset="70%" stop-color="#EECF00" />
          <stop offset="100%" stop-color="#EECF00" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#circleGrad)" stroke="#EECF00" stroke-width="4"/>
      <circle cx="100" cy="100" r="60" fill="none" stroke="#EECF00" stroke-width="2" opacity="0.7"/>
      <circle cx="100" cy="100" r="40" fill="none" stroke="#EECF00" stroke-width="2" opacity="0.5"/>
      <circle cx="100" cy="100" r="20" fill="none" stroke="#EECF00" stroke-width="2" opacity="0.3"/>
      <circle cx="100" cy="100" r="5" fill="#EECF00"/>
    </svg>`,
    colors: ['#EECF00', '#EECF00', '#EECF00', '#EECF00']
  },
  {
    id: 17,
    type: 'cycle_overview',
    title: 'Eternal Return',
    description: 'Complete transformation cycle',
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cycleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#EECF00" />
          <stop offset="50%" stop-color="#000000" />
          <stop offset="100%" stop-color="#EECF00" />
        </linearGradient>
      </defs>
      <path d="M100,100 Q120,80 140,100 Q160,120 140,140 Q120,160 100,140 Q80,120 100,100"
            fill="none" stroke="url(#cycleGrad)" stroke-width="6"/>
      <circle cx="100" cy="100" r="8" fill="#EECF00"/>
      <circle cx="100" cy="100" r="15" fill="none" stroke="#EECF00" stroke-width="3"/>
      <path d="M70,100 Q85,85 100,100 Q115,115 130,100 Q145,85 160,100 Q145,115 130,100 Q115,85 100,100 Q85,115 70,100"
            fill="none" stroke="#000000" stroke-width="3" opacity="0.6"/>
    </svg>`,
    colors: ['#EECF00', '#000000', '#EECF00']
  }
];

// FIXED Visual Morphing System
const TransformationDisplay = ({ currentFrame, nextFrame, morphProgress }) => {
  const currentTransformation = transformations[currentFrame];
  const nextTransformation = transformations[nextFrame];

  return (
    <div style={{
      position: 'relative',
      width: '400px',
      height: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Current frame */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 1 - morphProgress,
          transform: `scale(${1 - morphProgress * 0.05})`,
          filter: `blur(${morphProgress * 2}px)`,
          transition: 'all 0.1s ease-out'
        }}
        dangerouslySetInnerHTML={{ __html: currentTransformation.svg }}
      />

      {/* Next frame (morphing in) */}
      {currentFrame !== nextFrame && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: morphProgress,
            transform: `scale(${0.95 + morphProgress * 0.05})`,
            filter: `blur(${(1 - morphProgress) * 2}px)`,
            transition: 'all 0.1s ease-out'
          }}
          dangerouslySetInnerHTML={{ __html: nextTransformation.svg }}
        />
      )}
    </div>
  );
};

// FIXED Frame Indicator
const FrameIndicator = ({ currentFrame, totalFrames, morphProgress, scrollProgress }) => (
  <div style={{
    position: 'fixed',
    bottom: '20px',
    left: '120px',
    backgroundColor: 'rgba(0,0,0,0.85)',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '20px',
    fontSize: '12px',
    zIndex: 999,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
    minWidth: '200px'
  }}>
    <div style={{
      marginBottom: '8px',
      fontWeight: '600',
      fontSize: '14px'
    }}>
      Frame {currentFrame + 1} / {totalFrames}
    </div>
    <div style={{
      marginBottom: '8px',
      fontSize: '11px',
      opacity: 0.8,
      color: '#EECF00'
    }}>
      Morph: {(morphProgress * 100).toFixed(1)}%
    </div>
    <div style={{
      width: '160px',
      height: '6px',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: '3px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${((currentFrame + morphProgress) / totalFrames) * 100}%`,
        height: '100%',
        backgroundColor: '#EECF00',
        transition: 'width 0.1s ease-out',
        borderRadius: '3px'
      }} />
    </div>
    <div style={{
      fontSize: '10px',
      marginTop: '6px',
      opacity: 0.7,
      color: '#EECF00'
    }}>
      Scroll: {Math.round(scrollProgress)}%
    </div>
  </div>
);

// FIXED Background Style Calculator
const getBackgroundStyle = (currentFrame) => {
  const current = transformations[currentFrame];

  return {
    background: `linear-gradient(135deg,
      ${current.colors[0]}15 0%,
      ${current.colors[1]}10 50%,
      ${current.colors[2] || current.colors[1]}05 100%)`,
    transition: 'background 0.3s ease'
  };
};

// FIXED Navigation Circle Rotation
const getNavigationRotation = (scrollProgress) => {
  return -90 + (scrollProgress * 90); // -90° to 0° across full scroll range
};

function App17Frame() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [expandedSection, setExpandedSection] = useState(null);
  const [footerOpen, setFooterOpen] = useState(false);
  const [navCircleRotation, setNavCircleRotation] = useState(-90);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // CORRECTED SCROLL CALCULATIONS
  const TOTAL_FRAMES = 17;
  const SCROLL_RANGE = TOTAL_FRAMES - 1; // 0 to 16
  const MAX_SCROLL = 1600; // 16 * 100 = 1600%

  // Calculate scroll progress (0 to 1)
  const scrollProgress = scrollOffset / MAX_SCROLL;

  // Calculate current position in the 17-frame sequence
  const framePosition = scrollProgress * SCROLL_RANGE; // 0.0 to 16.0
  const currentFrameIndex = Math.floor(framePosition); // 0 to 16
  const nextFrameIndex = Math.min(currentFrameIndex + 1, TOTAL_FRAMES - 1);
  const morphProgress = framePosition - currentFrameIndex; // 0.0 to 1.0

  // Ensure proper bounds
  const clampedCurrentFrame = Math.max(0, Math.min(currentFrameIndex, TOTAL_FRAMES - 1));
  const clampedMorphProgress = Math.max(0, Math.min(morphProgress, 1));

  // Initialize navigation circle animation
  useEffect(() => {
    setTimeout(() => {
      setNavCircleRotation(-90);
    }, 500);
  }, []);

  // Optimized mouse movement handler
  const handleMouseMove = useCallback((e) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 60 - 20,
      y: (e.clientY / window.innerHeight) * 40 - 20
    });
  }, []);

  useEffect(() => {
    let timeoutId;
    const throttledMouseMove = (e) => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleMouseMove(e);
        timeoutId = null;
      }, 16);
    };

    window.addEventListener('mousemove', throttledMouseMove);
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleMouseMove]);

  // Device motion handling
  useEffect(() => {
    const handleDeviceOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        setDeviceMotion({
          x: Math.max(-20, Math.min(20, (e.gamma / 90) * 20)),
          y: Math.max(-20, Math.min(20, (e.beta / 180) * 20))
        });
      }
    };

    if ('DeviceOrientationEvent' in window) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, []);

  // CORRECTED scrolling system for 17 frames
  const updateScrollOffset = useCallback((delta) => {
    setScrollOffset(prev => {
      const newOffset = Math.max(0, Math.min(MAX_SCROLL, prev + delta));

      // Update navigation circle rotation across 17 frames
      const newScrollProgress = newOffset / MAX_SCROLL;
      setNavCircleRotation(getNavigationRotation(newScrollProgress));

      return newOffset;
    });
  }, []);

  // Mouse wheel handling with adjusted sensitivity
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();

      let delta = 0;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        delta = e.deltaX * 1.2; // Increased for 17 frames
      } else {
        delta = e.deltaY * 1.2;
      }

      updateScrollOffset(delta);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [updateScrollOffset]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          updateScrollOffset(100); // Move one frame forward
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          updateScrollOffset(-100); // Move one frame backward
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateScrollOffset]);

  // Enhanced touch handling
  useEffect(() => {
    const handleTouchStart = (e) => {
      const target = e.target;
      const isBackground = target.classList.contains('transformation-container') ||
                          target.tagName === 'BODY' ||
                          target.closest('.transformation-container');

      if (!isBackground ||
          target.closest('.clickable-element') ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('nav') ||
          target.closest('.sidebar')) {
        return;
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchMove = (e) => {
      const target = e.target;
      const isBackground = target.classList.contains('transformation-container') ||
                          target.tagName === 'BODY' ||
                          target.closest('.transformation-container');

      if (!isBackground ||
          target.closest('.clickable-element') ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('nav') ||
          target.closest('.sidebar')) {
        return;
      }

      if (e.touches.length === 1 && touchStartRef.current.x !== 0) {
        const touch = e.touches[0];
        const deltaX = touchStartRef.current.x - touch.clientX;
        const deltaY = touchStartRef.current.y - touch.clientY;
        const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (totalDistance > 30) {
          let scrollDelta = 0;
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            scrollDelta = deltaX * 0.5; // Increased sensitivity for 17 frames
          } else {
            scrollDelta = deltaY * 0.4;
          }

          if (Math.abs(scrollDelta) > 2) {
            updateScrollOffset(scrollDelta);
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
          }
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = { x: 0, y: 0 };
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [updateScrollOffset]);

  const parallaxX = (mousePosition.x + deviceMotion.x) * 0.6;
  const parallaxY = (mousePosition.y + deviceMotion.y) * 0.6;

  const handleHomeClick = (e) => {
    e.preventDefault();
    setScrollOffset(0);
    setNavCircleRotation(-90);
    setMenuOpen(false);
    setFooterOpen(false);
  };

  // Enhanced navigation circle click for 17 frames
  const handleNavCircleClick = () => {
    if (scrollOffset >= MAX_SCROLL) {
      setFooterOpen(!footerOpen);
    } else {
      // Move to next frame
      const nextFrameOffset = Math.min(MAX_SCROLL, (clampedCurrentFrame + 1) * (MAX_SCROLL / SCROLL_RANGE));
      setScrollOffset(nextFrameOffset);
    }
  };

  const handleFooterToggle = () => {
    setFooterOpen(!footerOpen);
    setMenuOpen(false);
  };

  const handleSidebarToggle = () => {
    if (sidebarOpen) {
      setExpandedSection(null);
    }
    setSidebarOpen(!sidebarOpen);
  };

  const navigationItems = [
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png",
      label: "STANDARD HOME",
      itemKey: "standard_home",
      subItems: ["3-slide version", "original experience"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
      label: "EXPERIMENTS",
      itemKey: "experiments",
      subItems: ["golden unknown", "being + rhyme", "cath3dral"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684385/write-book_gfaiu8.png",
      label: "THOUGHTS",
      itemKey: "thoughts",
      subItems: ["blog"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/face-profile_dxxbba.png",
      label: "ABOUT",
      itemKey: "about",
      subItems: ["about me", "about yellowcircle", "contact"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/history-edu_nuazpv.png",
      label: "WORKS",
      itemKey: "works",
      subItems: ["consulting", "rho", "reddit", "cv"]
    }
  ];

  // Navigation Item Component (preserved from original)
  const NavigationItem = ({ icon, label, subItems, itemKey, index }) => {
    const isExpanded = expandedSection === itemKey && sidebarOpen;

    let topPosition = index * 50;
    for (let i = 0; i < index; i++) {
      const prevItemKey = navigationItems[i]?.itemKey;
      if (expandedSection === prevItemKey && sidebarOpen) {
        const prevSubItems = navigationItems[i]?.subItems || [];
        topPosition += prevSubItems.length * 18 + 5;
      }
    }

    const handleClick = () => {
      if (!sidebarOpen) {
        setSidebarOpen(true);
        setExpandedSection(itemKey);
      } else {
        if (itemKey === 'standard_home') {
          navigate('/');
        } else {
          setExpandedSection(expandedSection === itemKey ? null : itemKey);
        }
      }
    };

    return (
      <div style={{
        position: 'absolute',
        top: `${topPosition}px`,
        left: 0,
        width: '100%',
        transition: 'top 0.3s ease-out'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 0',
          position: 'relative',
          minHeight: '40px',
          width: '100%'
        }}>
          <div
            className="clickable-element"
            onClick={handleClick}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleClick();
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: 'pointer',
              zIndex: 3,
              WebkitTapHighlightColor: 'transparent'
            }}
          />

          <div style={{
            position: 'absolute',
            left: '40px',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none'
          }}>
            <img
              src={icon}
              alt={label}
              width="24"
              height="24"
              style={{ display: 'block' }}
            />
          </div>

          {sidebarOpen && (
            <span style={{
              position: 'absolute',
              left: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isExpanded ? '#EECF00' : 'black',
              fontSize: '14px',
              fontWeight: isExpanded ? '700' : '600',
              letterSpacing: '0.2em',
              transition: 'color 0.3s ease-out, font-weight 0.3s ease-out',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}>{label}</span>
          )}
        </div>

        {sidebarOpen && (
          <div style={{
            marginLeft: '75px',
            marginTop: '-5px',
            maxHeight: isExpanded ? `${(subItems?.length || 0) * 18 + 5}px` : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-out'
          }}>
            {subItems && (
              <div style={{ paddingTop: '0px', paddingBottom: '0px' }}>
                {subItems.map((item, idx) => (
                  <a key={idx} href="#" className="clickable-element" style={{
                    display: 'block',
                    color: 'rgba(0,0,0,0.7)',
                    fontSize: '12px',
                    fontWeight: '500',
                    letterSpacing: '0.1em',
                    textDecoration: 'none',
                    padding: '1px 0',
                    transition: 'color 0.25s ease-in-out',
                    opacity: isExpanded ? 1 : 0,
                    transitionDelay: isExpanded ? `${idx * 0.05}s` : '0s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#EECF00';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'rgba(0,0,0,0.7)';
                  }}
                  >{item}</a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, sans-serif'
    }}>
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.96; }
        }
        @keyframes slideInStagger {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes buttonFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        .menu-item-1 { animation: slideInStagger 0.4s ease-out 0.1s both; }
        .menu-item-2 { animation: slideInStagger 0.4s ease-out 0.2s both; }
        .menu-item-3 { animation: slideInStagger 0.4s ease-out 0.3s both; }
        .menu-item-4 { animation: slideInStagger 0.4s ease-out 0.4s both; }
        .menu-button-5 { animation: buttonFadeIn 0.4s ease-out 0.6s both; }
        .menu-button-6 { animation: buttonFadeIn 0.4s ease-out 0.7s both; }

        .menu-link {
          color: black;
          transition: color 0.3s ease-in;
        }
        .menu-link:hover {
          color: white !important;
        }

        .works-btn {
          transition: background-color 0.3s ease-in;
        }
        .works-btn:hover {
          background-color: rgba(0,0,0,1) !important;
        }
        .works-btn:hover .works-text {
          color: #EECF00 !important;
          transition: color 0.3s ease-in;
        }

        .contact-btn {
          transition: background-color 0.3s ease-in;
        }
        .contact-btn:hover {
          background-color: white !important;
        }
      `}</style>

      {/* FIXED 17-Frame Transformation Container */}
      <div
        className="transformation-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...getBackgroundStyle(clampedCurrentFrame, clampedMorphProgress)
        }}
      >
        <TransformationDisplay
          currentFrame={clampedCurrentFrame}
          nextFrame={nextFrameIndex}
          morphProgress={clampedMorphProgress}
        />
      </div>

      {/* FIXED Frame Progress Indicator */}
      <FrameIndicator
        currentFrame={clampedCurrentFrame}
        totalFrames={TOTAL_FRAMES}
        morphProgress={clampedMorphProgress}
        scrollProgress={scrollProgress * 100}
      />

      {/* Yellow Circle with Parallax (Preserved) */}
      <div style={{
        position: 'fixed',
        top: `calc(20% + ${parallaxY}px)`,
        left: `calc(38% + ${parallaxX}px)`,
        width: '300px',
        height: '300px',
        backgroundColor: '#EECF00',
        borderRadius: '50%',
        zIndex: 20,
        mixBlendMode: 'multiply',
        transition: 'all 0.1s ease-out',
        boxShadow: '0 20px 60px rgba(251,191,36,0.2)'
      }}></div>

      {/* Navigation Bar (Preserved) */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '4.7vw',
        paddingRight: '40px'
      }}>
        <a
          href="#"
          onClick={handleHomeClick}
          style={{
            backgroundColor: 'black',
            padding: '10px 20px',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          <h1 style={{
            fontSize: '16px',
            fontWeight: '600',
            letterSpacing: '0.2em',
            margin: 0
          }}>
            <span style={{ color: '#EECF00', fontStyle: 'italic' }}>yellow</span>
            <span style={{ color: 'white' }}>CIRCLE</span>
          </h1>
        </a>
      </nav>

      {/* Sidebar (Preserved) */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: sidebarOpen ? 'min(30vw, 450px)' : '80px',
        height: '100vh',
        backgroundColor: 'rgba(242, 242, 242, 0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 50,
        transition: 'width 0.5s ease-out',
      }}>

        <div
          className="clickable-element"
          onClick={handleSidebarToggle}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleSidebarToggle();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            left: '40px',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            width: '40px',
            height: '40px',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 16 16">
            <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2z"/>
            <path d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
          </svg>
        </div>

        <div style={{
          position: 'absolute',
          top: '100px',
          left: '40px',
          transform: 'translateX(-50%) rotate(-90deg)',
          transformOrigin: 'center',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            color: 'black',
            fontWeight: '600',
            letterSpacing: '0.3em',
            fontSize: '14px'
          }}>HOME</span>
        </div>

        <div
          className="navigation-items-container"
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            width: '100%',
            height: '240px'
          }}
        >
          {navigationItems.map((item, index) => (
            <NavigationItem
              key={item.itemKey}
              {...item}
              index={index}
              sidebarOpen={sidebarOpen}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
              setSidebarOpen={setSidebarOpen}
            />
          ))}
        </div>

        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(40px, 8vw)',
          height: 'min(40px, 8vw)',
          minWidth: '30px',
          minHeight: '30px',
          borderRadius: '50%',
          overflow: 'hidden'
        }}>
          <img
            src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png"
            alt="YC Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Navigation Circle (Enhanced for 17 frames) */}
      <div
        className="clickable-element"
        onClick={handleNavCircleClick}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleNavCircleClick();
        }}
        style={{
          position: 'fixed',
          bottom: '50px',
          right: '50px',
          zIndex: 50,
          width: '78px',
          height: '78px',
          cursor: 'pointer',
          transform: footerOpen ? 'translateY(-300px)' : 'translateY(0)',
          transition: 'transform 0.5s ease-out',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <img
          src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494537/NavCircle_ioqlsr.png"
          alt="Navigation"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `rotate(${navCircleRotation}deg)`,
            transition: 'transform 0.3s ease-out',
            transformOrigin: 'center'
          }}
        />
      </div>

      {/* Text Content (Enhanced for current transformation) */}
      <div style={{
        position: 'fixed',
        bottom: '50px',
        left: '200px',
        zIndex: 30,
        maxWidth: '480px'
      }}>
        <div style={{
          color: 'black',
          fontWeight: '600',
          fontSize: 'clamp(1rem, 1.7vw, 1.2rem)',
          lineHeight: '1.1',
          letterSpacing: '0.05em',
          textAlign: 'left'
        }}>
          <h1 style={{
            margin: '2px 0',
            backgroundColor: 'rgba(241, 239, 232, 0.38)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'inline-block',
            fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
            fontWeight: '700'
          }}>
            <span style={{ color: transformations[clampedCurrentFrame]?.colors[0] || '#EECF00' }}>
              {transformations[clampedCurrentFrame]?.title.toUpperCase()}
            </span>
          </h1>

          <p style={{
            margin: '2px 0',
            backgroundColor: 'rgba(241, 239, 232, 0.38)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'inline-block',
            color: transformations[clampedCurrentFrame]?.colors[1] || '#EECF00',
            fontWeight: '700'
          }}>
            • {transformations[clampedCurrentFrame]?.description}
          </p>

          <p style={{
            margin: '2px 0',
            backgroundColor: 'rgba(241, 239, 232, 0.38)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'inline-block'
          }}>
            • Frame {clampedCurrentFrame + 1} of {TOTAL_FRAMES}
          </p>

          <p style={{
            margin: '2px 0',
            backgroundColor: 'rgba(241, 239, 232, 0.38)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'inline-block'
          }}>
            • Interactive Transformation Sequence
          </p>
        </div>
      </div>

      {/* Footer (Preserved) */}
      <div style={{
        position: 'fixed',
        bottom: footerOpen ? '0' : '-290px',
        left: '0',
        right: '0',
        height: '300px',
        zIndex: 60,
        transition: 'bottom 0.5s ease-out'
      }}>
        <div
          onClick={handleFooterToggle}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            cursor: footerOpen ? 'default' : 'pointer'
          }}
        >
          <div style={{
            flex: '1',
            backgroundColor: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              margin: '0 0 20px 0',
              borderBottom: '2px solid white',
              paddingBottom: '10px'
            }}>CONTACT</h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >EMAIL@YELLOWCIRCLE.IO</a>

              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >LINKEDIN</a>

              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >TWITTER</a>
            </div>
          </div>

          <div style={{
            flex: '1',
            backgroundColor: '#EECF00',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <h2 style={{
              color: 'black',
              fontSize: '24px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              margin: '0 0 20px 0',
              borderBottom: '2px solid black',
              paddingBottom: '10px'
            }}>PROJECTS</h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >GOLDEN UNKNOWN</a>

              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >BEING + RHYME</a>

              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >CATH3DRAL</a>

              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >17-FRAME ANIMATIC</a>
            </div>
          </div>
        </div>
      </div>

      {/* Hamburger Menu (Preserved) */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed',
          right: '50px',
          top: '20px',
          padding: '10px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          zIndex: 100
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '18px',
          position: 'relative'
        }}>
          {[0, 1, 2].map((index) => (
            <div key={index} style={{
              position: 'absolute',
              top: '50%',
              left: index === 1 ? '60%' : '50%',
              width: '40px',
              height: '3px',
              backgroundColor: 'black',
              transformOrigin: 'center',
              transform: menuOpen
                ? index === 0
                  ? 'translate(-50%, -50%) rotate(45deg)'
                  : index === 2
                    ? 'translate(-50%, -50%) rotate(-45deg)'
                    : 'translate(-50%, -50%)'
                : `translate(-50%, -50%) translateY(${(index - 1) * 6}px)`,
              opacity: menuOpen && index === 1 ? 0 : 1,
              transition: 'all 0.3s ease'
            }}></div>
          ))}
        </div>
      </button>

      {/* Menu Overlay (Enhanced) */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#EECF00',
          opacity: 0.96,
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            {['HOME', 'EXPERIMENTS', 'THOUGHTS', 'ABOUT'].map((item, index) => (
              <a key={item}
                href="#"
                onClick={item === 'HOME' ? handleHomeClick : undefined}
                className={`menu-item-${index + 1} menu-link`}
                style={{
                  textDecoration: 'none',
                  fontSize: '20px',
                  fontWeight: '600',
                  letterSpacing: '0.3em',
                  padding: '10px 20px',
                  borderRadius: '4px'
                }}
              >
                {item}
              </a>
            ))}

            <div className="menu-button-5 works-btn" style={{
              backgroundColor: 'rgba(0,0,0,0.1)',
              padding: '15px 40px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              <span className="works-text" style={{
                color: 'black',
                fontSize: '20px',
                fontWeight: '600',
                letterSpacing: '0.3em',
                transition: 'color 0.3s ease-in'
              }}>17-FRAME ANIMATIC</span>
            </div>

            <div className="menu-button-6 contact-btn"
              onClick={handleFooterToggle}
              style={{
                border: '2px solid black',
                padding: '15px 40px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <span style={{
                color: 'black',
                fontSize: '20px',
                fontWeight: '600',
                letterSpacing: '0.3em'
              }}>CONTACT</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App17Frame;