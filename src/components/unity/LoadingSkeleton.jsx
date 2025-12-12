/**
 * Loading Skeleton for Unity Notes
 * Shows animated placeholder while canvas data loads from localStorage
 */

import { useMemo } from 'react';
import { UNITY, COLORS } from '../../styles/constants';

const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('unity-shimmer-styles')) {
  const style = document.createElement('style');
  style.id = 'unity-shimmer-styles';
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}

const SkeletonCard = ({ x, y, width = 220, height = 150 }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      background: `linear-gradient(90deg,
        ${UNITY.card.bg} 0%,
        rgba(50, 50, 50, 0.8) 50%,
        ${UNITY.card.bg} 100%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '12px',
      border: `1px solid ${UNITY.card.border}`,
    }}
  >
    {/* Title placeholder */}
    <div
      style={{
        margin: '16px',
        height: '16px',
        width: '60%',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '4px',
      }}
    />
    {/* Content lines */}
    <div
      style={{
        margin: '16px',
        height: '12px',
        width: '90%',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '4px',
      }}
    />
    <div
      style={{
        margin: '16px',
        marginTop: '8px',
        height: '12px',
        width: '75%',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '4px',
      }}
    />
  </div>
);

export default function LoadingSkeleton({ nodeCount = 4 }) {
  // Generate random-ish positions for skeleton cards
  const positions = useMemo(() => {
    const cards = [];
    for (let i = 0; i < nodeCount; i++) {
      cards.push({
        id: i,
        x: 100 + (i % 3) * 280,
        y: 80 + Math.floor(i / 3) * 200,
        width: 200 + Math.random() * 60,
        height: 130 + Math.random() * 50,
      });
    }
    return cards;
  }, [nodeCount]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: UNITY.canvasBg,
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {/* Grid dots background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${UNITY.canvasDots} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Skeleton cards */}
      {positions.map((pos) => (
        <SkeletonCard key={pos.id} {...pos} />
      ))}

      {/* Loading indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: UNITY.statusBar.bg,
          border: `1px solid ${UNITY.statusBar.border}`,
          borderRadius: '8px',
          color: COLORS.textSecondaryOnDark,
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        <span style={{ animation: 'pulse 1s infinite' }}>Loading canvas...</span>
      </div>
    </div>
  );
}
