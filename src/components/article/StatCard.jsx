import React from 'react';
import { COLORS } from '../../styles/constants';

/**
 * StatCard Component
 * Displays a statistic with visual emphasis
 * Used in article sections for data visualization
 */
function StatCard({ value, label, trend, description, color = 'yellow' }) {
  const colorMap = {
    yellow: COLORS.yellow,
    success: COLORS.success,
    error: COLORS.error,
    warning: COLORS.warning
  };

  const selectedColor = colorMap[color] || COLORS.yellow;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(26, 26, 26, 0.9) 100%)`,
        border: `2px solid ${selectedColor}`,
        borderRadius: '12px',
        padding: '24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${selectedColor}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Background glow effect */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle, ${selectedColor}15 0%, transparent 70%)`,
          pointerEvents: 'none'
        }}
      />

      {/* Trend indicator */}
      {trend && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            fontSize: '20px',
            opacity: 0.8
          }}
        >
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
        </div>
      )}

      {/* Main stat value */}
      <div
        style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: '900',
          color: selectedColor,
          marginBottom: '12px',
          lineHeight: 1,
          fontFamily: 'Helvetica, Arial, sans-serif',
          letterSpacing: '-2px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {value}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)',
          fontWeight: '600',
          color: COLORS.textOnDark,
          marginBottom: description ? '8px' : '0',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          position: 'relative',
          zIndex: 1
        }}
      >
        {label}
      </div>

      {/* Description */}
      {description && (
        <div
          style={{
            fontSize: 'clamp(0.8rem, 1.2vw, 0.95rem)',
            color: COLORS.textSecondaryOnDark,
            lineHeight: 1.4,
            position: 'relative',
            zIndex: 1
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
}

export default StatCard;
