import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * ExitNode - End point for UnityMAP journeys
 *
 * Represents campaign exit reasons: Won, Lost, Unsubscribed, etc.
 * Only has input handle (journey terminates here).
 */
const ExitNode = memo(({ data, selected }) => {
  const {
    label: _label = 'Exit',
    exitType = 'completed', // 'completed', 'won', 'lost', 'unsubscribed', 'bounced'
    count = 0
  } = data;

  const exitConfig = {
    completed: {
      icon: '✅',
      label: 'Completed',
      color: '#10b981',
      bgColor: '#d1fae5',
      borderColor: '#6ee7b7'
    },
    won: {
      icon: '🏆',
      label: 'Won',
      color: '#eab308',
      bgColor: '#fef3c7',
      borderColor: '#fcd34d'
    },
    lost: {
      icon: '❌',
      label: 'Lost',
      color: '#6b7280',
      bgColor: '#f3f4f6',
      borderColor: '#d1d5db'
    },
    unsubscribed: {
      icon: '🚫',
      label: 'Unsubscribed',
      color: '#ef4444',
      bgColor: '#fee2e2',
      borderColor: '#fca5a5'
    },
    bounced: {
      icon: '↩️',
      label: 'Bounced',
      color: '#f97316',
      bgColor: '#ffedd5',
      borderColor: '#fdba74'
    }
  };

  const config = exitConfig[exitType] || exitConfig.completed;

  return (
    <div
      style={{
        backgroundColor: config.bgColor,
        border: selected ? `3px solid ${config.color}` : `2px solid ${config.borderColor}`,
        borderRadius: '12px',
        padding: '16px',
        minWidth: '140px',
        textAlign: 'center',
        boxShadow: selected
          ? `0 8px 24px ${config.color}40`
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Input Handle - Top */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: config.color,
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />

      {/* Icon */}
      <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>
        {config.icon}
      </span>

      {/* Label */}
      <span style={{
        fontSize: '12px',
        fontWeight: '700',
        color: config.color,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'block'
      }}>
        {config.label}
      </span>

      {/* Count */}
      {count > 0 && (
        <span style={{
          fontSize: '20px',
          fontWeight: '800',
          color: config.color,
          display: 'block',
          marginTop: '8px'
        }}>
          {count}
        </span>
      )}
    </div>
  );
});

ExitNode.displayName = 'ExitNode';

export default ExitNode;
