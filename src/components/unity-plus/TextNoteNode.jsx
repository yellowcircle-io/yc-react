import React, { useState, useCallback, memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * TextNoteNode - Draggable text note card for Unity Note Plus
 *
 * Features:
 * - Title and content editing
 * - Color accent selection
 * - Resizable width
 * - Dark/light theme support
 */
const TextNoteNode = memo(({ data, id, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title || 'New Note');
  const [content, setContent] = useState(data.content || '');

  const isDarkTheme = data.theme === 'dark';
  const accentColor = data.color || '#3B82F6'; // Default blue

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (data.onUpdate) {
      data.onUpdate(id, { title, content });
    }
  }, [id, title, content, data]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, []);

  const baseStyles = {
    backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
    color: isDarkTheme ? '#f3f4f6' : '#1f2937',
    borderColor: selected ? accentColor : (isDarkTheme ? '#374151' : '#e5e7eb'),
  };

  return (
    <div
      style={{
        minWidth: data.width || 280,
        maxWidth: 400,
        borderRadius: '8px',
        border: `2px solid ${baseStyles.borderColor}`,
        backgroundColor: baseStyles.backgroundColor,
        boxShadow: selected
          ? `0 0 0 2px ${accentColor}40, 0 8px 24px rgba(0,0,0,0.15)`
          : '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: accentColor,
          width: 10,
          height: 10,
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: accentColor,
          width: 10,
          height: 10,
          border: '2px solid white',
        }}
      />

      {/* Header with accent color */}
      <div style={{
        height: '6px',
        backgroundColor: accentColor,
      }} />

      {/* Card type label */}
      <div style={{
        padding: '8px 12px 4px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '0.1em',
          color: accentColor,
          textTransform: 'uppercase',
        }}>
          Note
        </span>
      </div>

      {/* Title */}
      <div style={{ padding: '0 12px 8px' }}>
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              width: '100%',
              fontSize: '15px',
              fontWeight: '700',
              color: baseStyles.color,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '4px 0',
            }}
          />
        ) : (
          <h3 style={{
            fontSize: '15px',
            fontWeight: '700',
            color: baseStyles.color,
            margin: 0,
            padding: '4px 0',
            cursor: 'text',
          }}>
            {title || 'Untitled'}
          </h3>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '0 12px 12px' }}>
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Add your note content..."
            style={{
              width: '100%',
              minHeight: '80px',
              fontSize: '13px',
              lineHeight: '1.5',
              color: isDarkTheme ? '#d1d5db' : '#4b5563',
              backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '4px',
              padding: '8px',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <p style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: isDarkTheme ? '#d1d5db' : '#6b7280',
            margin: 0,
            whiteSpace: 'pre-wrap',
            cursor: 'text',
            minHeight: content ? 'auto' : '40px',
          }}>
            {content || 'Double-click to edit...'}
          </p>
        )}
      </div>

      {/* Footer with timestamp */}
      <div style={{
        padding: '8px 12px',
        borderTop: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
        fontSize: '10px',
        color: isDarkTheme ? '#6b7280' : '#9ca3af',
      }}>
        {data.updatedAt ? (
          <span>Updated {new Date(data.updatedAt).toLocaleDateString()}</span>
        ) : (
          <span>Created {new Date(data.createdAt || Date.now()).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
});

TextNoteNode.displayName = 'TextNoteNode';

export default TextNoteNode;
