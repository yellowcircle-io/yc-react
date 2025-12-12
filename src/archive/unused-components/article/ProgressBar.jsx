import React from 'react';
import { COLORS } from '../../styles/constants';

/**
 * ProgressBar Component
 * Animated horizontal bar for showing percentages
 * Used for visualizing stats like misalignment rates
 */
function ProgressBar({ percentage, label, color = 'yellow', height = 40, animated = true }) {
  const colorMap = {
    yellow: COLORS.yellow,
    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning
  };

  const selectedColor = colorMap[color] || COLORS.yellow;

  return (
    <div style={{ width: '100%', marginBottom: '20px' }}>
      {/* Label */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: 'clamp(0.9rem, 1.3vw, 1rem)',
          color: COLORS.textOnDark,
          fontWeight: '600'
        }}
      >
        <span>{label}</span>
        <span style={{ color: selectedColor }}>{percentage}%</span>
      </div>

      {/* Progress bar container */}
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: COLORS.darkGrey,
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid rgba(255, 255, 255, 0.1)`
        }}
      >
        {/* Progress fill */}
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${selectedColor}dd 0%, ${selectedColor} 100%)`,
            borderRadius: `${height / 2}px`,
            transition: animated ? 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            boxShadow: `0 0 20px ${selectedColor}80`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Shine effect */}
          {animated && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'shine 2s infinite'
              }}
            />
          )}
        </div>

        {/* Percentage text overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: `${height * 0.5}px`,
            fontWeight: '700',
            color: percentage > 50 ? COLORS.black : COLORS.textOnDark,
            textShadow: percentage > 50 ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.8)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {percentage}%
        </div>
      </div>

      <style>
        {`
          @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}
      </style>
    </div>
  );
}

export default ProgressBar;
