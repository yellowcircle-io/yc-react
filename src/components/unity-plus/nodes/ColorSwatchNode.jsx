import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Palette, X, Star } from 'lucide-react';

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
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [customHex, setCustomHex] = useState('#');

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

  const handleAddRandomColor = () => {
    if (data.onUpdateColors) {
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      data.onUpdateColors(id, [...colors, randomColor]);
      setShowAddPanel(false);
    }
  };

  const handleAddCustomColor = (color) => {
    if (data.onUpdateColors && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      data.onUpdateColors(id, [...colors, color.toLowerCase()]);
      setCustomHex('#');
      setShowAddPanel(false);
    }
  };

  const handleHexInputChange = (e) => {
    let value = e.target.value;
    // Ensure # prefix
    if (!value.startsWith('#')) {
      value = '#' + value.replace('#', '');
    }
    // Limit to 7 characters (#RRGGBB)
    if (value.length <= 7) {
      setCustomHex(value.toUpperCase());
    }
  };

  const handleColorPickerChange = (e) => {
    const color = e.target.value;
    handleAddCustomColor(color);
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
            ? '0 8px 20px rgba(0, 0, 0, 0.15)'
            : '0 4px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
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
          width: '8px',
          height: '8px',
          backgroundColor: '#fbbf24',
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
            right: '-12px',
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
            left: '-12px',
            padding: 0,
            zIndex: 10,
          }}
          title={data.isStarred ? 'Unstar node' : 'Star node'}
        >
          <Star size={18} fill={data.isStarred ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      )}

      {/* Type icon - top-left */}
      <div style={{ position: 'absolute', top: '8px', left: '8px', opacity: 0.4 }}>
        <Palette size={14} />
      </div>

      {/* Header with Lucide icon */}
      <div className="unity-node-header" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <div className="unity-node-header-icon" style={{ color: '#fbbf24' }}>
          <Palette size={20} strokeWidth={2} />
        </div>
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

      {/* Add color section */}
      {data.onUpdateColors && colors.length < 12 && (
        <div className="nodrag" style={{ position: 'relative' }}>
          {!showAddPanel ? (
            <button
              onClick={() => setShowAddPanel(true)}
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
          ) : (
            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px',
            }}>
              {/* Hex input row */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  type="text"
                  value={customHex}
                  onChange={handleHexInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCustomColor(customHex);
                    } else if (e.key === 'Escape') {
                      setShowAddPanel(false);
                    }
                  }}
                  placeholder="#FFFFFF"
                  style={{
                    width: '80px',
                    padding: '4px 6px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    outline: 'none',
                    textTransform: 'uppercase',
                    boxSizing: 'border-box',
                  }}
                />
                {/* Color preview swatch */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(customHex) ? customHex : '#f3f4f6',
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }} />
                <button
                  onClick={() => handleAddCustomColor(customHex)}
                  disabled={!/^#[0-9A-Fa-f]{6}$/.test(customHex)}
                  style={{
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(customHex) ? '#fbbf24' : '#e5e7eb',
                    color: /^#[0-9A-Fa-f]{6}$/.test(customHex) ? '#000' : '#9ca3af',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: /^#[0-9A-Fa-f]{6}$/.test(customHex) ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  +
                </button>
              </div>

              {/* Action buttons row */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <label style={{
                  flex: 1,
                  padding: '4px 6px',
                  fontSize: '9px',
                  fontWeight: '600',
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  color: '#374151',
                  cursor: 'pointer',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                }}>
                  🎨 Pick
                  <input
                    type="color"
                    onChange={handleColorPickerChange}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                </label>
                <button
                  onClick={handleAddRandomColor}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    fontSize: '9px',
                    fontWeight: '600',
                    backgroundColor: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                  }}
                >
                  🎲 Rand
                </button>
                <button
                  onClick={() => {
                    setShowAddPanel(false);
                    setCustomHex('#');
                  }}
                  style={{
                    padding: '4px 6px',
                    fontSize: '9px',
                    fontWeight: '600',
                    backgroundColor: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    color: '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
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
