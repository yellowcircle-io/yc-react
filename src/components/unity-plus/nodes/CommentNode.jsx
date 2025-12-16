import React, { memo, useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';

/**
 * CommentNode - Annotation/comment bubble
 *
 * Features:
 * - Speech bubble design
 * - Author avatar/initials
 * - Timestamp display
 * - Editable content
 * - Reply indicator (optional)
 */

const CommentNode = memo(({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content || '');

  const author = data.author || 'User';
  const timestamp = data.timestamp || new Date().toISOString();
  const initials = author.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        maxWidth: '280px',
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#6366f1',
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

      {/* Comment bubble */}
      <div
        onDoubleClick={handleDoubleClick}
        style={{
          backgroundColor: '#ffffff',
          border: `2px solid ${selected ? '#6366f1' : '#e5e7eb'}`,
          borderRadius: '12px',
          padding: '12px',
          cursor: isEditing ? 'text' : 'grab',
          boxShadow: selected
            ? '0 8px 24px rgba(99, 102, 241, 0.25)'
            : isHovered
              ? '0 6px 16px rgba(0, 0, 0, 0.12)'
              : '0 4px 8px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Header with avatar and author */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '700',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#111827',
            }}>
              {author}
            </div>
            <div style={{
              fontSize: '10px',
              color: '#9ca3af',
            }}>
              {formatTime(timestamp)}
            </div>
          </div>
          <span style={{ fontSize: '16px', opacity: 0.5 }}>💬</span>
        </div>

        {/* Content area */}
        {isEditing ? (
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsEditing(false);
              }
            }}
            className="nodrag"
            style={{
              width: '100%',
              minHeight: '60px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '13px',
              lineHeight: '1.5',
              color: '#374151',
              outline: 'none',
              resize: 'none',
            }}
          />
        ) : (
          <div style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#374151',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            minHeight: '20px',
          }}>
            {content || (
              <span style={{ opacity: 0.5, fontStyle: 'italic' }}>
                Double-click to add comment...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Speech bubble tail */}
      <div style={{
        position: 'absolute',
        bottom: '-8px',
        left: '20px',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: `8px solid ${selected ? '#6366f1' : '#e5e7eb'}`,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-5px',
        left: '22px',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid #ffffff',
      }} />

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#6366f1',
          border: '2px solid #fff',
        }}
      />
    </div>
  );
});

CommentNode.displayName = 'CommentNode';

export default CommentNode;
