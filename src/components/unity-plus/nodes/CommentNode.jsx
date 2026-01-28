import React, { memo, useState, useMemo, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare, X, Star } from 'lucide-react';

/**
 * CommentNode - Annotation/comment bubble with @mention support
 *
 * Features:
 * - Speech bubble design
 * - Author avatar/initials
 * - Timestamp display
 * - Editable content
 * - @email mentions with autocomplete
 * - Mention highlighting
 * - Reply indicator (optional)
 */

// Parse mentions from content
const parseMentions = (text) => {
  if (!text) return [];
  const mentionRegex = /@([^\s@]+@[^\s@]+\.[^\s@]+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
};

// Render content with highlighted mentions
const renderContentWithMentions = (content) => {
  if (!content) return null;

  const mentionRegex = /@([^\s@]+@[^\s@]+\.[^\s@]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex, match.index)}
        </span>
      );
    }

    // Add highlighted mention
    parts.push(
      <span
        key={`mention-${match.index}`}
        style={{
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          padding: '1px 4px',
          borderRadius: '4px',
          fontWeight: '500',
        }}
      >
        @{match[1]}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>
        {content.substring(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : content;
};

const CommentNode = memo(({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content || '');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  const author = data.author || 'User';
  const timestamp = data.timestamp || new Date().toISOString();
  const initials = author.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const collaborators = data.collaborators || []; // Array of { email, name }

  // Filter collaborators based on mention query
  const filteredCollaborators = useMemo(() => {
    if (!mentionQuery) return collaborators.slice(0, 5);
    const query = mentionQuery.toLowerCase();
    return collaborators
      .filter(c =>
        c.email.toLowerCase().includes(query) ||
        (c.name && c.name.toLowerCase().includes(query))
      )
      .slice(0, 5);
  }, [collaborators, mentionQuery]);

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
    // Delay to allow dropdown click
    setTimeout(() => {
      setIsEditing(false);
      setShowMentionDropdown(false);

      // Check for new mentions and notify
      const newMentions = parseMentions(content);
      const oldMentions = parseMentions(data.content || '');
      const addedMentions = newMentions.filter(m => !oldMentions.includes(m));

      if (data.onContentChange) {
        data.onContentChange(id, content);
      }

      // Trigger notification for new mentions
      if (addedMentions.length > 0 && data.onMention) {
        addedMentions.forEach(email => {
          data.onMention(id, email, content);
        });
      }
    }, 150);
  };

  const handleTextChange = (e) => {
    const newContent = e.target.value;
    const newCursorPos = e.target.selectionStart;
    setContent(newContent);
    setCursorPosition(newCursorPos);

    // Check for @ mention trigger
    const textBeforeCursor = newContent.substring(0, newCursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      // Show dropdown if typing mention (no space after @)
      if (!textAfterAt.includes(' ') && collaborators.length > 0) {
        setMentionQuery(textAfterAt);
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const insertMention = (email) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const newContent = textBeforeCursor.substring(0, atIndex) + `@${email} ` + textAfterCursor;
      setContent(newContent);
      setShowMentionDropdown(false);

      // Focus back on textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = atIndex + email.length + 2;
        setTimeout(() => {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: '280px',
        maxWidth: '300px',
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
              ? '0 8px 20px rgba(0, 0, 0, 0.15)'
              : '0 4px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
          transform: isHovered && !isEditing ? 'scale(1.01)' : 'scale(1)',
          outline: selected ? '2px solid #3b82f6' : 'none',
          outlineOffset: selected ? '2px' : '0',
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
          <MessageSquare size={18} style={{ opacity: 0.5, color: '#6366f1' }} />
        </div>

        {/* Content area */}
        {isEditing ? (
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              autoFocus
              value={content}
              onChange={handleTextChange}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setShowMentionDropdown(false);
                }
                // Handle arrow keys for dropdown navigation
                if (showMentionDropdown && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
                  e.preventDefault();
                  // Simple: select first on Enter
                  if (e.key === 'Enter' && filteredCollaborators.length > 0) {
                    insertMention(filteredCollaborators[0].email);
                  }
                }
              }}
              className="nodrag"
              style={{
                width: '100%',
                minHeight: '60px',
                maxWidth: '100%',
                backgroundColor: '#f9fafb',
                border: '1px solid #6366f1',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '13px',
                lineHeight: '1.5',
                color: '#374151',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              placeholder="Write a comment... Use @email to mention"
            />

            {/* Mention autocomplete dropdown */}
            {showMentionDropdown && filteredCollaborators.length > 0 && (
              <div
                className="nodrag"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 20,
                  maxHeight: '160px',
                  overflow: 'auto',
                }}
              >
                {filteredCollaborators.map((collab, index) => (
                  <button
                    key={collab.email}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(collab.email);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      backgroundColor: index === 0 ? '#f3f4f6' : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => {
                      if (index !== 0) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      {(collab.name || collab.email).substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                        {collab.name || collab.email.split('@')[0]}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {collab.email}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Hint for mentions */}
            {collaborators.length > 0 && !showMentionDropdown && (
              <div style={{
                fontSize: '10px',
                color: '#9ca3af',
                marginTop: '4px',
                fontStyle: 'italic',
              }}>
                Type @ to mention collaborators
              </div>
            )}
          </div>
        ) : (
          <div style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#374151',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            minHeight: '20px',
          }}>
            {content ? (
              renderContentWithMentions(content)
            ) : (
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
