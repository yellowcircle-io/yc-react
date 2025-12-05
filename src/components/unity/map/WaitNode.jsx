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
    onInlineEdit, // Edit handler
    onDelete // Delete this node
  } = data;

  const [isHovered, setIsHovered] = useState(false);

  const unitIcons = {
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
        border: selected ? '3px solid #6366f1' : '2px solid #c7d2fe',
        borderRadius: '50%',
        width: '100px',
        height: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected
          ? '0 8px 24px rgba(99, 102, 241, 0.3)'
          : isHovered
            ? '0 6px 20px rgba(99, 102, 241, 0.25)'
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
          backgroundColor: '#6366f1',
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
        color: '#4f46e5'
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
            color: '#6366f1',
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
                top: '-8px',
                right: '-8px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                border: '2px solid #dc2626',
                color: '#dc2626',
                fontSize: '10px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                zIndex: 10
              }}
              title="Delete node"
            >
              ✕
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
          backgroundColor: '#6366f1',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
});

WaitNode.displayName = 'WaitNode';

export default WaitNode;
