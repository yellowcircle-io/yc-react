import React, { memo, useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Layers, X, Star } from 'lucide-react';

/**
 * GroupNode - Container for grouping nodes
 *
 * Features:
 * - Resizable container
 * - Label/title
 * - Color themes
 * - Semi-transparent background
 * - Child nodes move with group (via React Flow parentId)
 * - Drop zone indication
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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState(data.color || 'gray');
  const [_isResizing, setIsResizing] = useState(false);  
  const resizeStartRef = useRef({ width: 0, height: 0, x: 0, y: 0 });

  const colorScheme = GROUP_COLORS[currentColor] || GROUP_COLORS.gray;
  const width = data.width || 300;
  const height = data.height || 200;
  const isDropTarget = data.isDropTarget || false;
  const childCount = data.childCount || 0;

  // Custom resize handler for corner handles
  const handleResizeStart = (e, corner) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    resizeStartRef.current = { width, height, x: clientX, y: clientY, corner };

    const handleMove = (moveEvent) => {
      moveEvent.stopPropagation();
      moveEvent.preventDefault();

      const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = moveX - resizeStartRef.current.x;
      const deltaY = moveY - resizeStartRef.current.y;

      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;

      // Adjust based on corner being dragged
      if (corner.includes('r')) newWidth += deltaX;
      if (corner.includes('l')) newWidth -= deltaX;
      if (corner.includes('b')) newHeight += deltaY;
      if (corner.includes('t')) newHeight -= deltaY;

      // Clamp to minimum size
      newWidth = Math.max(150, newWidth);
      newHeight = Math.max(100, newHeight);

      if (data.onResize) {
        data.onResize(id, newWidth, newHeight);
      }
    };

    const handleEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  const handleColorChange = (colorKey) => {
    setCurrentColor(colorKey);
    setShowColorPicker(false);
    if (data.onColorChange) {
      data.onColorChange(id, colorKey);
    }
  };

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
        backgroundColor: isDropTarget ? `${colorScheme.bg.replace('0.1', '0.25').replace('0.15', '0.3')}` : colorScheme.bg,
        border: `2px ${selected || isDropTarget ? 'solid' : 'dashed'} ${colorScheme.border}`,
        borderRadius: '12px',
        position: 'relative',
        cursor: 'grab',
        transition: 'all 0.2s ease',
        boxShadow: selected
          ? '0 8px 24px rgba(0, 0, 0, 0.2)'
          : isHovered
            ? '0 8px 20px rgba(0, 0, 0, 0.15)'
            : isDropTarget
              ? `0 0 20px ${colorScheme.border}40`
              : '0 4px 8px rgba(0, 0, 0, 0.1)',
        transform: isHovered ? 'scale(1.01)' : 'scale(1)',
        outline: selected ? '2px solid #3b82f6' : 'none',
        outlineOffset: selected ? '2px' : '0',
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: colorScheme.border,
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Custom circular resize handles - enhanced touch targets (44px) */}
      {(selected || isHovered) && (
        <>
          {/* Top-left corner */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'tl')}
            onTouchStart={(e) => handleResizeStart(e, 'tl')}
            className="nodrag unity-node-resize-handle"
            style={{
              position: 'absolute',
              top: '4px',
              left: '4px',
              backgroundColor: colorScheme.border,
              cursor: 'nwse-resize',
              zIndex: 10,
            }}
          />
          {/* Top-right corner */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'tr')}
            onTouchStart={(e) => handleResizeStart(e, 'tr')}
            className="nodrag unity-node-resize-handle"
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: colorScheme.border,
              cursor: 'nesw-resize',
              zIndex: 10,
            }}
          />
          {/* Bottom-left corner */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'bl')}
            onTouchStart={(e) => handleResizeStart(e, 'bl')}
            className="nodrag unity-node-resize-handle"
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '4px',
              backgroundColor: colorScheme.border,
              cursor: 'nesw-resize',
              zIndex: 10,
            }}
          />
          {/* Bottom-right corner */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'br')}
            onTouchStart={(e) => handleResizeStart(e, 'br')}
            className="nodrag unity-node-resize-handle"
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              backgroundColor: colorScheme.border,
              cursor: 'nwse-resize',
              zIndex: 10,
            }}
          />
        </>
      )}

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
            right: '-12px',
            padding: 0,
            zIndex: 10,
          }}
          title="Delete group"
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
            right: '36px',
            padding: 0,
            zIndex: 10,
          }}
          title={data.isStarred ? 'Unstar group' : 'Star group'}
        >
          <Star size={18} fill={data.isStarred ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      )}

      {/* Group label with color picker */}
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {/* Label */}
        <div
          onDoubleClick={handleLabelDoubleClick}
          style={{
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

        {/* Color picker button - circular with options icon, next to label */}
        <div style={{ position: 'relative' }}>
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

          {/* Color picker dropdown - positioned below button */}
          {showColorPicker && (
            <div
              className="nodrag"
              style={{
                position: 'absolute',
                top: '24px',
                left: '0',
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                gap: '4px',
                flexWrap: 'wrap',
                width: '80px',
                zIndex: 20,
              }}
            >
              {Object.entries(GROUP_COLORS).map(([colorKey, colors]) => (
                <button
                  key={colorKey}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorChange(colorKey);
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: colors.border,
                    border: currentColor === colorKey ? '2px solid #111' : '1px solid #e5e7eb',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  title={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instruction text (shown when empty/hovered) */}
      {(isHovered || selected) && childCount === 0 && (
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

      {/* Drop indicator */}
      {isDropTarget && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: '13px',
            color: colorScheme.text,
            fontWeight: '600',
          }}>
            Drop to add to group
          </span>
        </div>
      )}

      {/* Corner indicator with child count */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        color: colorScheme.text,
        opacity: 0.6,
      }}>
        {childCount > 0 && (
          <span style={{ fontWeight: '600' }}>
            {childCount} item{childCount !== 1 ? 's' : ''}
          </span>
        )}
        <Layers size={18} style={{ opacity: 0.8 }} />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: colorScheme.border,
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

export default GroupNode;
