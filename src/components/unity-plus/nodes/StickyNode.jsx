import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { StickyNote, X, Star } from 'lucide-react';

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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [content, setContent] = useState(data.content || '');
  const [currentColor, setCurrentColor] = useState(data.color || 'yellow');

  const colorScheme = STICKY_COLORS[currentColor] || STICKY_COLORS.yellow;
  const size = data.size || 150;

  const handleColorChange = (colorKey) => {
    setCurrentColor(colorKey);
    setShowColorPicker(false);
    if (data.onColorChange) {
      data.onColorChange(id, colorKey);
    }
  };

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
            ? '0 8px 20px rgba(0,0,0,0.15)'
            : '0 2px 8px rgba(0,0,0,0.08)',
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

      {/* Delete button - enhanced touch target (44px) */}
      {(isHovered || selected) && data.onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete(id);
          }}
          className="unity-node-delete-btn"
          style={{
            position: 'absolute',
            top: '-12px',
            left: '-12px',
            padding: 0,
            zIndex: 10,
          }}
          title="Delete node"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      )}

      {/* Star button - enhanced touch target (44px) */}
      {(isHovered || selected || data.isStarred) && data.onToggleStar && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleStar(id);
          }}
          className={`nodrag unity-node-star-btn ${data.isStarred ? 'starred' : ''}`}
          style={{
            position: 'absolute',
            top: '-12px',
            left: data.onDelete ? '36px' : '-12px',
            padding: 0,
            zIndex: 10,
          }}
          title={data.isStarred ? 'Unstar node' : 'Star node'}
        >
          <Star size={18} fill={data.isStarred ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      )}

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
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            color: colorScheme.text,
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
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

      {/* Color picker button with options icon */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          className="nodrag"
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: colorScheme.border,
            border: '2px solid white',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'transform 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Change color"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>

        {/* Color picker dropdown */}
        {showColorPicker && (
          <div
            className="nodrag nopan"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '28px',
              right: '-4px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              zIndex: 100,
            }}
          >
            {Object.entries(STICKY_COLORS).map(([colorKey, colors]) => (
              <button
                key={colorKey}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleColorChange(colorKey);
                }}
                className="nodrag nopan"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: colors.bg,
                  border: currentColor === colorKey ? `3px solid ${colors.border}` : '2px solid #e5e7eb',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'transform 0.1s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                title={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
              />
            ))}
          </div>
        )}
      </div>

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
