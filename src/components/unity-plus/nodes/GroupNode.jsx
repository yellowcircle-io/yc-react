import React, { memo, useState } from 'react';
import { NodeResizer, NodeToolbar, Position } from '@xyflow/react';

/**
 * GroupNode - Visual container/frame for grouping nodes
 *
 * Features:
 * - Resizable container
 * - Label/title
 * - Color themes
 * - Semi-transparent background
 * - No handles (grouping is visual only)
 */

const GROUP_COLORS = {
  gray: { bg: 'rgba(156, 163, 175, 0.15)', border: '#9ca3af', text: '#6b7280' },
  blue: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#2563eb' },
  green: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#16a34a' },
  yellow: { bg: 'rgba(251, 191, 36, 0.1)', border: '#fbbf24', text: '#d97706' },
  purple: { bg: 'rgba(168, 85, 247, 0.1)', border: '#a855f7', text: '#9333ea' },
  pink: { bg: 'rgba(236, 72, 153, 0.1)', border: '#ec4899', text: '#db2777' },
};

const GroupNode = memo(({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(data.label || 'Group');

  const colorScheme = GROUP_COLORS[data.color] || GROUP_COLORS.gray;
  const width = data.width || 300;
  const height = data.height || 200;

  const handleLabelDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditingLabel(true);
  };

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    if (data.onLabelChange) {
      data.onLabelChange(id, label);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: colorScheme.bg,
        border: `2px ${selected ? 'solid' : 'dashed'} ${colorScheme.border}`,
        borderRadius: '12px',
        position: 'relative',
        cursor: 'grab',
      }}
    >
      {/* Resizer */}
      <NodeResizer
        minWidth={150}
        minHeight={100}
        isVisible={selected}
        lineStyle={{
          borderColor: colorScheme.border,
          borderWidth: 1,
        }}
        handleStyle={{
          backgroundColor: colorScheme.border,
          width: 10,
          height: 10,
          borderRadius: '50%',
        }}
        onResize={(_, params) => {
          if (data.onResize) {
            data.onResize(id, params.width, params.height);
          }
        }}
      />

      {/* Delete button toolbar */}
      <NodeToolbar isVisible={isHovered || selected} position={Position.Top}>
        {data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete(id);
            }}
            style={{
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
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1f2937';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#374151';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Delete group"
          >
            ×
          </button>
        )}
      </NodeToolbar>

      {/* Group label */}
      <div
        onDoubleClick={handleLabelDoubleClick}
        style={{
          position: 'absolute',
          top: '-12px',
          left: '16px',
          backgroundColor: '#ffffff',
          padding: '2px 10px',
          borderRadius: '4px',
          border: `2px solid ${colorScheme.border}`,
        }}
      >
        {isEditingLabel ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                handleLabelBlur();
              }
            }}
            className="nodrag"
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '12px',
              fontWeight: '700',
              color: colorScheme.text,
              width: 'auto',
              minWidth: '40px',
            }}
          />
        ) : (
          <span style={{
            fontSize: '12px',
            fontWeight: '700',
            color: colorScheme.text,
            letterSpacing: '0.02em',
            cursor: 'text',
          }}>
            {label}
          </span>
        )}
      </div>

      {/* Instruction text (shown when empty/hovered) */}
      {(isHovered || selected) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: '11px',
            color: colorScheme.text,
            opacity: 0.5,
            fontStyle: 'italic',
          }}>
            Drag nodes here to group
          </span>
        </div>
      )}

      {/* Corner indicator */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        fontSize: '16px',
        opacity: 0.3,
      }}>
        📦
      </div>
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

export default GroupNode;
