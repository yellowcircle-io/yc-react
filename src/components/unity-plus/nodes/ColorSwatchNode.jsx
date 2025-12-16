import React, { memo, useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';

/**
 * ColorSwatchNode - Color palette display
 *
 * Features:
 * - Display multiple colors in a grid
 * - Click to copy hex value
 * - Add/remove colors
 * - Palette name/label
 */

const ColorSwatchNode = memo(({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(-1);

  const title = data.title || 'Color Palette';
  const colors = data.colors || ['#fbbf24', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6'];

  const handleCopyColor = async (color, index) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(-1), 1500);
    } catch (err) {
      console.warn('Failed to copy color:', err);
    }
  };

  const handleAddColor = () => {
    if (data.onUpdateColors) {
      // Generate a random color
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      data.onUpdateColors(id, [...colors, randomColor]);
    }
  };

  const handleRemoveColor = (index) => {
    if (data.onUpdateColors && colors.length > 1) {
      const newColors = colors.filter((_, i) => i !== index);
      data.onUpdateColors(id, newColors);
    }
  };

  // Calculate luminance to determine text color
  const getLuminance = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '200px',
        backgroundColor: '#ffffff',
        border: `2px solid ${selected ? '#fbbf24' : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: 'grab',
        position: 'relative',
        boxShadow: selected
          ? '0 8px 24px rgba(251, 191, 36, 0.25)'
          : isHovered
            ? '0 6px 16px rgba(0, 0, 0, 0.12)'
            : '0 4px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#fbbf24',
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

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '18px' }}>🎨</span>
        <h3 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '700',
          color: '#111827',
          flex: 1,
        }}>
          {title}
        </h3>
        <span style={{
          fontSize: '10px',
          color: '#9ca3af',
        }}>
          {colors.length} colors
        </span>
      </div>

      {/* Color grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
        gap: '8px',
        marginBottom: '12px',
      }}>
        {colors.map((color, index) => {
          const isLight = getLuminance(color) > 0.5;
          const textColor = isLight ? '#000' : '#fff';

          return (
            <div
              key={index}
              className="nodrag"
              onClick={() => handleCopyColor(color, index)}
              style={{
                aspectRatio: '1 / 1',
                backgroundColor: color,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'transform 0.15s ease',
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`Click to copy ${color}`}
            >
              {copiedIndex === index ? (
                <span style={{ fontSize: '12px' }}>✓</span>
              ) : (
                <span style={{
                  fontSize: '9px',
                  fontWeight: '600',
                  color: textColor,
                  opacity: 0.7,
                }}>
                  {color.toUpperCase()}
                </span>
              )}

              {/* Remove button (only show on hover if more than 1 color) */}
              {isHovered && colors.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveColor(index);
                  }}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '16px',
                    height: '16px',
                    padding: 0,
                    border: '1px solid #fff',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add color button */}
      {data.onUpdateColors && colors.length < 12 && (
        <button
          onClick={handleAddColor}
          className="nodrag"
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#f9fafb',
            border: '2px dashed #e5e7eb',
            borderRadius: '8px',
            color: '#6b7280',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#fbbf24';
            e.currentTarget.style.color = '#fbbf24';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          + Add Color
        </button>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#fbbf24',
          border: '2px solid #fff',
        }}
      />
    </div>
  );
});

ColorSwatchNode.displayName = 'ColorSwatchNode';

export default ColorSwatchNode;
