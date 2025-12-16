import React, { memo, useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';

/**
 * StickyNode - Colored sticky note for quick notes
 *
 * Features:
 * - Multiple color options (yellow, pink, blue, green, orange, purple)
 * - Editable text content
 * - Draggable and resizable
 * - Delete button on hover
 */

const STICKY_COLORS = {
  yellow: { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  pink: { bg: '#fce7f3', border: '#ec4899', text: '#831843' },
  blue: { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
  green: { bg: '#dcfce7', border: '#22c55e', text: '#14532d' },
  orange: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  purple: { bg: '#f3e8ff', border: '#a855f7', text: '#581c87' },
};

const StickyNode = memo(({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content || '');

  const colorScheme = STICKY_COLORS[data.color] || STICKY_COLORS.yellow;
  const size = data.size || 150;

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onContentChange) {
      data.onContentChange(id, content);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
      style={{
        width: `${size}px`,
        minHeight: `${size}px`,
        backgroundColor: colorScheme.bg,
        border: `2px solid ${selected ? colorScheme.border : 'transparent'}`,
        borderRadius: '4px',
        padding: '12px',
        cursor: isEditing ? 'text' : 'grab',
        position: 'relative',
        boxShadow: selected
          ? `0 8px 24px ${colorScheme.border}40`
          : isHovered
            ? '0 6px 16px rgba(0, 0, 0, 0.15)'
            : '0 4px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        transform: isHovered && !isEditing ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: colorScheme.border,
          border: '2px solid #fff',
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
            title="Delete node"
          >
            ×
          </button>
        )}
      </NodeToolbar>

      {/* Content area */}
      {isEditing ? (
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="nodrag"
          style={{
            width: '100%',
            minHeight: `${size - 40}px`,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: "'Patrick Hand', cursive, sans-serif",
            fontSize: '14px',
            lineHeight: '1.4',
            color: colorScheme.text,
          }}
        />
      ) : (
        <div
          style={{
            fontFamily: "'Patrick Hand', cursive, sans-serif",
            fontSize: '14px',
            lineHeight: '1.4',
            color: colorScheme.text,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            minHeight: `${size - 40}px`,
          }}
        >
          {content || (
            <span style={{ opacity: 0.5, fontStyle: 'italic' }}>
              Double-click to add note...
            </span>
          )}
        </div>
      )}

      {/* Color indicator */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: colorScheme.border,
        }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: colorScheme.border,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
});

StickyNode.displayName = 'StickyNode';

export default StickyNode;
