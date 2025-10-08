import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Adult Swim / Flying Lotus inspired color palette
const ADULT_SWIM_PALETTE = {
  // Warm psychedelic progression
  warm: ['#FF6B35', '#F7931E', '#FFD23F', '#FFEB3B'],
  // Cool cosmic progression
  cool: ['#06FFA5', '#1FB3D3', '#3F48CC', '#673AB7'],
  // Deep mystical progression
  mystical: ['#C33C54', '#8E44AD', '#2C3E50', '#1A237E'],
  // Neutral clean tones
  neutral: ['#ECEFF1', '#CFD8DC', '#B0BEC5', '#90A4AE']
};

// Color blending utility
const blendColors = (colors, ratio) => {
  const segmentCount = colors.length - 1;
  const segment = Math.floor(ratio * segmentCount);
  const localRatio = (ratio * segmentCount) - segment;

  if (segment >= segmentCount) return colors[segmentCount];

  const color1 = colors[segment];
  const color2 = colors[segment + 1];

  // Simple hex color blending
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substr(0,2), 16);
  const g1 = parseInt(hex1.substr(2,2), 16);
  const b1 = parseInt(hex1.substr(4,2), 16);

  const r2 = parseInt(hex2.substr(0,2), 16);
  const g2 = parseInt(hex2.substr(2,2), 16);
  const b2 = parseInt(hex2.substr(4,2), 16);

  const r = Math.round(r1 + (r2 - r1) * localRatio);
  const g = Math.round(g1 + (g2 - g1) * localRatio);
  const b = Math.round(b1 + (b2 - b1) * localRatio);

  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
};

// Generate smooth color progression across 17 frames
const getFrameColors = (frameIndex) => {
  const progress = frameIndex / 16; // 0 to 1

  return {
    primary: blendColors(ADULT_SWIM_PALETTE.warm, progress),
    secondary: blendColors(ADULT_SWIM_PALETTE.cool, progress),
    accent: blendColors(ADULT_SWIM_PALETTE.mystical, progress),
    neutral: blendColors(ADULT_SWIM_PALETTE.neutral, progress)
  };
};

// Adult Swim inspired SVG definitions (clean, geometric, psychedelic)
const ADULT_SWIM_SVGS = [
  {
    id: 1,
    type: 'fetus_egg',
    title: 'Cosmic Genesis',
    description: 'Primordial beginning',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cosmicGrad1" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </radialGradient>
        <filter id="glow1">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <ellipse cx="100" cy="100" rx="65" ry="85" fill="url(#cosmicGrad1)" stroke="${colors.secondary}" stroke-width="2.5" opacity="0.9" filter="url(#glow1)"/>
      <circle cx="100" cy="75" r="18" fill="${colors.secondary}" opacity="0.7"/>
      <path d="M75,110 Q100,130 125,110" stroke="${colors.accent}" stroke-width="2.5" fill="none" opacity="0.8"/>
    </svg>`
  },

  {
    id: 2,
    type: 'baby',
    title: 'Emergence',
    description: 'Form taking shape',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="formGrad2" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="100%" stop-color="${colors.secondary}" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="85" r="38" fill="url(#formGrad2)" stroke="${colors.accent}" stroke-width="2.5" opacity="0.9"/>
      <ellipse cx="100" cy="135" rx="32" ry="40" fill="${colors.secondary}" stroke="${colors.accent}" stroke-width="2" opacity="0.8"/>
      <circle cx="85" cy="80" r="4" fill="${colors.accent}"/>
      <circle cx="115" cy="80" r="4" fill="${colors.accent}"/>
      <path d="M90,95 Q100,100 110,95" stroke="${colors.accent}" stroke-width="2" fill="none"/>
    </svg>`
  },

  {
    id: 3,
    type: 'sun',
    title: 'Solar Radiance',
    description: 'Luminous transformation',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="solarGrad3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="70%" stop-color="${colors.secondary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="42" fill="url(#solarGrad3)" stroke="${colors.accent}" stroke-width="2.5" opacity="0.9"/>
      ${Array.from({length: 12}, (_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const x1 = 100 + Math.cos(angle) * 52;
        const y1 = 100 + Math.sin(angle) * 52;
        const x2 = 100 + Math.cos(angle) * 72;
        const y2 = 100 + Math.sin(angle) * 72;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colors.secondary}" stroke-width="3" opacity="0.8"/>`;
      }).join('')}
    </svg>`
  },

  {
    id: 4,
    type: 'tree',
    title: 'Growth Spiral',
    description: 'Organic expansion',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="treeGrad4" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="${colors.accent}" />
          <stop offset="50%" stop-color="${colors.primary}" />
          <stop offset="100%" stop-color="${colors.secondary}" />
        </linearGradient>
      </defs>
      <rect x="95" y="120" width="10" height="60" fill="url(#treeGrad4)" opacity="0.9"/>
      <circle cx="100" cy="110" r="25" fill="${colors.primary}" stroke="${colors.secondary}" stroke-width="2" opacity="0.8"/>
      <circle cx="85" cy="95" r="18" fill="${colors.secondary}" opacity="0.7"/>
      <circle cx="115" cy="95" r="18" fill="${colors.secondary}" opacity="0.7"/>
      <circle cx="100" cy="80" r="15" fill="${colors.accent}" opacity="0.6"/>
    </svg>`
  },

  {
    id: 5,
    type: 'flower',
    title: 'Blooming Consciousness',
    description: 'Awareness unfolds',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="flowerGrad5" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="15" fill="url(#flowerGrad5)" stroke="${colors.secondary}" stroke-width="2"/>
      ${Array.from({length: 8}, (_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const x = 100 + Math.cos(angle) * 35;
        const y = 100 + Math.sin(angle) * 35;
        return `<ellipse cx="${x}" cy="${y}" rx="12" ry="22" fill="${colors.secondary}" opacity="0.8" transform="rotate(${i * 45} ${x} ${y})"/>`;
      }).join('')}
    </svg>`
  },

  {
    id: 6,
    type: 'butterfly',
    title: 'Metamorphic Flight',
    description: 'Transformation complete',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wingGrad6" cx="30%" cy="30%" r="60%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="100%" stop-color="${colors.secondary}" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="100" rx="3" ry="25" fill="${colors.accent}"/>
      <ellipse cx="75" cy="85" rx="20" ry="30" fill="url(#wingGrad6)" opacity="0.9" transform="rotate(-15 75 85)"/>
      <ellipse cx="125" cy="85" rx="20" ry="30" fill="url(#wingGrad6)" opacity="0.9" transform="rotate(15 125 85)"/>
      <ellipse cx="80" cy="115" rx="15" ry="20" fill="${colors.secondary}" opacity="0.8" transform="rotate(-10 80 115)"/>
      <ellipse cx="120" cy="115" rx="15" ry="20" fill="${colors.secondary}" opacity="0.8" transform="rotate(10 120 115)"/>
    </svg>`
  },

  {
    id: 7,
    type: 'spiral',
    title: 'Energy Vortex',
    description: 'Dynamic flow',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="spiralGrad7" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="50%" stop-color="${colors.secondary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </radialGradient>
      </defs>
      <path d="M100,100 Q120,80 140,100 Q120,120 100,100 Q80,80 60,100 Q80,120 100,100"
            fill="none" stroke="url(#spiralGrad7)" stroke-width="4" opacity="0.9"/>
      <circle cx="100" cy="100" r="8" fill="${colors.primary}"/>
      <circle cx="100" cy="100" r="25" fill="none" stroke="${colors.secondary}" stroke-width="2" opacity="0.6"/>
      <circle cx="100" cy="100" r="45" fill="none" stroke="${colors.accent}" stroke-width="1.5" opacity="0.4"/>
    </svg>`
  },

  {
    id: 8,
    type: 'eye',
    title: 'Cosmic Awareness',
    description: 'All-seeing consciousness',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="eyeGrad8" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${colors.secondary}" />
          <stop offset="70%" stop-color="${colors.primary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="100" rx="60" ry="35" fill="url(#eyeGrad8)" stroke="${colors.accent}" stroke-width="2.5" opacity="0.9"/>
      <circle cx="100" cy="100" r="22" fill="${colors.accent}" stroke="${colors.secondary}" stroke-width="2"/>
      <circle cx="100" cy="100" r="12" fill="${colors.primary}"/>
      <circle cx="105" cy="95" r="4" fill="${colors.neutral}" opacity="0.8"/>
    </svg>`
  },

  {
    id: 9,
    type: 'mandala',
    title: 'Sacred Geometry',
    description: 'Universal patterns',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mandalaGrad9" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="50%" stop-color="${colors.secondary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="45" fill="none" stroke="url(#mandalaGrad9)" stroke-width="3" opacity="0.9"/>
      ${Array.from({length: 6}, (_, i) => {
        const angle = (i * 60) * (Math.PI / 180);
        const x = 100 + Math.cos(angle) * 30;
        const y = 100 + Math.sin(angle) * 30;
        return `<circle cx="${x}" cy="${y}" r="12" fill="${colors.secondary}" stroke="${colors.accent}" stroke-width="1.5" opacity="0.8"/>`;
      }).join('')}
      <circle cx="100" cy="100" r="15" fill="${colors.primary}" stroke="${colors.accent}" stroke-width="2"/>
    </svg>`
  },

  {
    id: 10,
    type: 'crystal',
    title: 'Crystalline Structure',
    description: 'Perfect form',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="crystalGrad10" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="50%" stop-color="${colors.secondary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </linearGradient>
      </defs>
      <polygon points="100,60 130,90 120,130 80,130 70,90"
               fill="url(#crystalGrad10)" stroke="${colors.accent}" stroke-width="2.5" opacity="0.9"/>
      <polygon points="100,60 115,75 100,90 85,75"
               fill="${colors.secondary}" opacity="0.7"/>
      <line x1="100" y1="60" x2="100" y2="130" stroke="${colors.accent}" stroke-width="2" opacity="0.6"/>
    </svg>`
  },

  {
    id: 11,
    type: 'lotus',
    title: 'Enlightened Bloom',
    description: 'Spiritual awakening',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lotusGrad11" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="100%" stop-color="${colors.secondary}" />
        </radialGradient>
      </defs>
      ${Array.from({length: 12}, (_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const x = 100 + Math.cos(angle) * 25;
        const y = 100 + Math.sin(angle) * 25;
        return `<ellipse cx="${x}" cy="${y}" rx="8" ry="20" fill="url(#lotusGrad11)" opacity="0.8" transform="rotate(${i * 30} ${x} ${y})"/>`;
      }).join('')}
      <circle cx="100" cy="100" r="12" fill="${colors.accent}" stroke="${colors.secondary}" stroke-width="2"/>
    </svg>`
  },

  {
    id: 12,
    type: 'star',
    title: 'Stellar Radiance',
    description: 'Cosmic luminosity',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="starGrad12" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="70%" stop-color="${colors.secondary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </radialGradient>
      </defs>
      <polygon points="100,60 110,85 135,85 117,105 125,130 100,115 75,130 83,105 65,85 90,85"
               fill="url(#starGrad12)" stroke="${colors.accent}" stroke-width="2.5" opacity="0.9"/>
      <circle cx="100" cy="100" r="15" fill="${colors.secondary}" opacity="0.7"/>
    </svg>`
  },

  {
    id: 13,
    type: 'wave',
    title: 'Flowing Energy',
    description: 'Rhythmic motion',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="waveGrad13" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="50%" stop-color="${colors.secondary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </linearGradient>
      </defs>
      <path d="M30,100 Q70,60 100,100 Q130,140 170,100"
            fill="none" stroke="url(#waveGrad13)" stroke-width="6" opacity="0.9"/>
      <path d="M30,120 Q70,80 100,120 Q130,160 170,120"
            fill="none" stroke="${colors.secondary}" stroke-width="4" opacity="0.7"/>
      <path d="M30,80 Q70,40 100,80 Q130,120 170,80"
            fill="none" stroke="${colors.accent}" stroke-width="4" opacity="0.7"/>
    </svg>`
  },

  {
    id: 14,
    type: 'infinity',
    title: 'Eternal Loop',
    description: 'Infinite potential',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="infinityGrad14" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="50%" stop-color="${colors.secondary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </linearGradient>
      </defs>
      <path d="M60,100 Q80,70 100,100 Q120,130 140,100 Q120,70 100,100 Q80,130 60,100"
            fill="none" stroke="url(#infinityGrad14)" stroke-width="8" opacity="0.9"/>
      <circle cx="75" cy="100" r="6" fill="${colors.primary}"/>
      <circle cx="125" cy="100" r="6" fill="${colors.accent}"/>
    </svg>`
  },

  {
    id: 15,
    type: 'galaxy',
    title: 'Cosmic Spiral',
    description: 'Universal dance',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="galaxyGrad15" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="30%" stop-color="${colors.secondary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="100" rx="50" ry="20" fill="url(#galaxyGrad15)" opacity="0.8" transform="rotate(45 100 100)"/>
      <ellipse cx="100" cy="100" rx="40" ry="15" fill="${colors.secondary}" opacity="0.6" transform="rotate(45 100 100)"/>
      <circle cx="100" cy="100" r="8" fill="${colors.primary}"/>
      ${Array.from({length: 8}, (_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const x = 100 + Math.cos(angle) * (20 + i * 3);
        const y = 100 + Math.sin(angle) * (20 + i * 3);
        return `<circle cx="${x}" cy="${y}" r="2" fill="${colors.accent}" opacity="0.7"/>`;
      }).join('')}
    </svg>`
  },

  {
    id: 16,
    type: 'portal',
    title: 'Dimensional Gateway',
    description: 'Transcendent passage',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="portalGrad16" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${colors.secondary}" />
          <stop offset="50%" stop-color="${colors.primary}" />
          <stop offset="100%" stop-color="${colors.accent}" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="50" fill="none" stroke="url(#portalGrad16)" stroke-width="6" opacity="0.9"/>
      <circle cx="100" cy="100" r="35" fill="none" stroke="${colors.secondary}" stroke-width="4" opacity="0.7"/>
      <circle cx="100" cy="100" r="20" fill="none" stroke="${colors.accent}" stroke-width="3" opacity="0.6"/>
      <circle cx="100" cy="100" r="8" fill="${colors.primary}" opacity="0.8"/>
    </svg>`
  },

  {
    id: 17,
    type: 'unity',
    title: 'Perfect Unity',
    description: 'Complete integration',
    svg: (colors) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="unityGrad17" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${colors.primary}" />
          <stop offset="30%" stop-color="${colors.secondary}" />
          <stop offset="70%" stop-color="${colors.accent}" />
          <stop offset="100%" stop-color="${colors.neutral}" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="50" fill="url(#unityGrad17)" stroke="${colors.accent}" stroke-width="3" opacity="0.9"/>
      <circle cx="100" cy="100" r="30" fill="none" stroke="${colors.secondary}" stroke-width="2" opacity="0.8"/>
      <circle cx="100" cy="100" r="15" fill="none" stroke="${colors.primary}" stroke-width="2" opacity="0.7"/>
      <circle cx="100" cy="100" r="5" fill="${colors.accent}"/>
    </svg>`
  }
];

// Universal SVG Morphing Component
const SVGMorphTransition = ({
  currentSVG,
  nextSVG,
  morphProgress,
  transitionType = 'scale_morph'
}) => {
  const transitionStyles = {
    scale_morph: {
      current: {
        opacity: 1 - morphProgress,
        transform: `scale(${1 - morphProgress * 0.15}) rotate(${morphProgress * 5}deg)`,
        filter: `blur(${morphProgress * 2}px) saturate(${1 - morphProgress * 0.3})`
      },
      next: {
        opacity: morphProgress,
        transform: `scale(${0.85 + morphProgress * 0.15}) rotate(${(1 - morphProgress) * -5}deg)`,
        filter: `blur(${(1 - morphProgress) * 2}px) saturate(${0.7 + morphProgress * 0.3})`
      }
    },
    crossfade: {
      current: {
        opacity: 1 - morphProgress,
        filter: `contrast(${1 + morphProgress * 0.5})`
      },
      next: {
        opacity: morphProgress,
        filter: `contrast(${1 + (1 - morphProgress) * 0.5})`
      }
    },
    dissolve: {
      current: {
        opacity: 1 - morphProgress,
        filter: `saturate(${1 - morphProgress}) brightness(${1 + morphProgress * 0.3})`
      },
      next: {
        opacity: morphProgress,
        filter: `saturate(${morphProgress}) brightness(${1.3 - morphProgress * 0.3})`
      }
    }
  };

  const transition = transitionStyles[transitionType];

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        willChange: 'transform, opacity, filter',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)'
      }}
    >
      {/* Current SVG morphing out */}
      <div
        className="absolute inset-0 transition-all duration-200 ease-out flex items-center justify-center"
        style={transition.current}
        dangerouslySetInnerHTML={{ __html: currentSVG }}
      />

      {/* Next SVG morphing in */}
      {currentSVG !== nextSVG && (
        <div
          className="absolute inset-0 transition-all duration-200 ease-out flex items-center justify-center"
          style={transition.next}
          dangerouslySetInnerHTML={{ __html: nextSVG }}
        />
      )}
    </div>
  );
};

// Function to generate styled SVG with dynamic colors
const generateStyledSVG = (frameIndex) => {
  const colors = getFrameColors(frameIndex);
  const svgTemplate = ADULT_SWIM_SVGS[frameIndex];
  return svgTemplate.svg(colors);
};

// Frame indicator with enhanced styling
const FrameIndicator = ({ currentFrame, totalFrames }) => {
  const frameColors = getFrameColors(currentFrame);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {Array.from({length: totalFrames}, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === currentFrame ? frameColors.primary : '#ffffff40',
                  transform: i === currentFrame ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: i === currentFrame ? `0 0 8px ${frameColors.primary}40` : 'none'
                }}
              />
            ))}
          </div>
          <span
            className="text-sm font-medium ml-2"
            style={{ color: frameColors.primary }}
          >
            {String(currentFrame + 1).padStart(2, '0')}/{totalFrames}
          </span>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App17FrameEnhanced() {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTransitionType, setCurrentTransitionType] = useState('scale_morph');

  const TOTAL_FRAMES = 17;
  const SCROLL_RANGE = TOTAL_FRAMES - 1;

  // Calculate frame position and morphing
  const framePosition = scrollProgress * SCROLL_RANGE;
  const currentFrameIndex = Math.floor(framePosition);
  const nextFrameIndex = Math.min(currentFrameIndex + 1, TOTAL_FRAMES - 1);
  const morphProgress = framePosition - currentFrameIndex;

  // Generate current and next SVGs with dynamic colors
  const currentSVG = generateStyledSVG(currentFrameIndex);
  const nextSVG = generateStyledSVG(nextFrameIndex);
  const frameColors = getFrameColors(currentFrameIndex);

  // Scroll handling
  const handleScroll = useCallback((delta) => {
    setScrollProgress(prev => {
      const newProgress = prev + delta * 0.02;
      return Math.max(0, Math.min(1, newProgress));
    });
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY || e.deltaX;
      handleScroll(delta);
    };

    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          handleScroll(50);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          handleScroll(-50);
          break;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleScroll]);

  // Background style with dynamic colors
  const backgroundStyle = {
    background: `linear-gradient(135deg,
      ${frameColors.primary}15 0%,
      ${frameColors.secondary}10 50%,
      ${frameColors.accent}15 100%)`,
    transition: 'background 0.3s ease-out'
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={backgroundStyle}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="text-white/80 hover:text-white transition-colors"
            style={{ color: frameColors.primary }}
          >
            ← Back to Standard
          </button>

          <div className="flex items-center space-x-4">
            <select
              value={currentTransitionType}
              onChange={(e) => setCurrentTransitionType(e.target.value)}
              className="bg-black/20 backdrop-blur-sm rounded px-3 py-1 text-white/80 border border-white/20"
              style={{ borderColor: frameColors.secondary }}
            >
              <option value="scale_morph">Scale Morph</option>
              <option value="crossfade">Crossfade</option>
              <option value="dissolve">Dissolve</option>
            </select>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 flex flex-col justify-center items-center space-y-1"
            >
              <div
                className="w-6 h-0.5 transition-all duration-300"
                style={{
                  backgroundColor: frameColors.primary,
                  transform: isMenuOpen ? 'rotate(45deg) translate(2px, 2px)' : 'none'
                }}
              />
              <div
                className="w-6 h-0.5 transition-all duration-300"
                style={{
                  backgroundColor: frameColors.secondary,
                  opacity: isMenuOpen ? 0 : 1
                }}
              />
              <div
                className="w-6 h-0.5 transition-all duration-300"
                style={{
                  backgroundColor: frameColors.accent,
                  transform: isMenuOpen ? 'rotate(-45deg) translate(2px, -2px)' : 'none'
                }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-screen flex items-center justify-center">
        <div className="w-96 h-96 relative">
          <SVGMorphTransition
            currentSVG={currentSVG}
            nextSVG={nextSVG}
            morphProgress={morphProgress}
            transitionType={currentTransitionType}
          />
        </div>
      </main>

      {/* Transformation Info */}
      <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-40">
        <div
          className="bg-black/20 backdrop-blur-sm rounded-lg p-4 max-w-xs"
          style={{ borderLeft: `4px solid ${frameColors.primary}` }}
        >
          <h3
            className="text-lg font-bold mb-1"
            style={{ color: frameColors.primary }}
          >
            {ADULT_SWIM_SVGS[currentFrameIndex].title}
          </h3>
          <p
            className="text-sm opacity-80"
            style={{ color: frameColors.secondary }}
          >
            {ADULT_SWIM_SVGS[currentFrameIndex].description}
          </p>
        </div>
      </div>

      {/* Frame Indicator */}
      <FrameIndicator currentFrame={currentFrameIndex} totalFrames={TOTAL_FRAMES} />

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center">
          <div className="text-center">
            <h2
              className="text-4xl font-bold mb-8"
              style={{ color: frameColors.primary }}
            >
              17-Frame Transformation
            </h2>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/')}
                className="block w-full text-white/80 hover:text-white py-2 transition-colors"
                style={{ color: frameColors.secondary }}
              >
                Return to Standard View
              </button>
              <button
                onClick={() => navigate('/experiments')}
                className="block w-full text-white/80 hover:text-white py-2 transition-colors"
                style={{ color: frameColors.accent }}
              >
                Explore Experiments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App17FrameEnhanced;