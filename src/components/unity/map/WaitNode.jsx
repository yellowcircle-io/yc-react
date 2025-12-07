import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * WaitNode - Time delay in UnityMAP journey
 *
 * Adds a waiting period before the next step.
 * Simple pass-through with configurable delay.
 * Click to edit duration.
 */
const WaitNode = memo(({ id, data, selected }) => {
  const {
    label = 'Wait',
    duration = 3,
    unit = 'days', // 'hours', 'days', 'weeks'
    reason = '', // Optional: "Let them think", "Weekend buffer", etc.
    prospectsAtNode = 0, // Number of prospects waiting at this node
    onInlineEdit, // Edit handler
    onDelete // Delete this node
  } = data;

  const [isHovered, setIsHovered] = useState(false);

  const unitIcons = {
    minutes: '⏱️',
    hours: '⏰',
    days: '📅',
    weeks: '🗓️'
  };

  // Format display text
  const displayText = duration === 1
    ? `${duration} ${unit.slice(0, -1)}`
    : `${duration} ${unit}`;

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onInlineEdit) {
      onInlineEdit(id, data);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleEdit}
      style={{
        backgroundColor: '#fff',
        border: selected ? '3px solid rgb(251, 191, 36)' : '2px solid rgb(253, 224, 139)',
        borderRadius: '50%',
        width: '100px',
        height: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected
          ? '0 8px 24px rgba(251, 191, 36, 0.4)'
          : isHovered
            ? '0 6px 20px rgba(251, 191, 36, 0.35)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        position: 'relative',
        cursor: 'pointer',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)'
      }}
    >
      {/* Input Handle - Top */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'rgb(251, 191, 36)',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />

      {/* Icon */}
      <span style={{ fontSize: '24px', marginBottom: '4px' }}>
        {unitIcons[unit] || '⏱️'}
      </span>

      {/* Duration */}
      <span style={{
        fontSize: '13px',
        fontWeight: '700',
        color: '#b45309'
      }}>
        {displayText}
      </span>

      {/* Label */}
      <span style={{
        fontSize: '9px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {label}
      </span>

      {/* Prospects waiting badge */}
      {prospectsAtNode > 0 && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '-8px',
          backgroundColor: '#EECF00',
          color: '#111827',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '700',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          {prospectsAtNode}
        </div>
      )}

      {/* Edit hint and delete button on hover */}
      {isHovered && (
        <>
          <div style={{
            position: 'absolute',
            bottom: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '9px',
            fontWeight: '600',
            color: '#b45309',
            whiteSpace: 'nowrap'
          }}>
            Click to edit
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '24px',
                height: '24px',
                minWidth: '24px',
                minHeight: '24px',
                padding: 0,
                borderRadius: '50%',
                backgroundColor: '#374151',
                border: '2px solid white',
                color: 'white',
                fontSize: '14px',
                fontWeight: '400',
                lineHeight: 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                zIndex: 10,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Delete node"
            >
              ×
            </button>
          )}
        </>
      )}

      {/* Output Handle - Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'rgb(251, 191, 36)',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
});

WaitNode.displayName = 'WaitNode';

export default WaitNode;
