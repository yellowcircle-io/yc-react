/**
 * CommentInput - Input component for adding comments
 *
 * Features:
 * - Textarea with character counter
 * - @mention autocomplete for collaborators
 * - Submit/cancel buttons
 * - Loading state
 */

import React, { useState, useRef, useMemo } from 'react';
import { Send, X } from 'lucide-react';

const CommentInput = ({
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  collaborators = [],
  isLoading = false,
  autoFocus = false,
  replyTo = null
}) => {
  const [content, setContent] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  const MAX_LENGTH = 2000;

  // Filter collaborators based on mention query
  const filteredCollaborators = useMemo(() => {
    if (!mentionQuery) return collaborators.slice(0, 5);
    const query = mentionQuery.toLowerCase();
    return collaborators
      .filter(c =>
        c.email?.toLowerCase().includes(query) ||
        c.name?.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [collaborators, mentionQuery]);

  const handleTextChange = (e) => {
    const newContent = e.target.value;
    const newCursorPos = e.target.selectionStart;

    if (newContent.length <= MAX_LENGTH) {
      setContent(newContent);
      setCursorPosition(newCursorPos);

      // Check for @ mention trigger
      const textBeforeCursor = newContent.substring(0, newCursorPos);
      const atIndex = textBeforeCursor.lastIndexOf('@');

      if (atIndex !== -1 && collaborators.length > 0) {
        const textAfterAt = textBeforeCursor.substring(atIndex + 1);
        // Show dropdown if typing mention (no space after @)
        if (!textAfterAt.includes(' ')) {
          setMentionQuery(textAfterAt);
          setShowMentionDropdown(true);
        } else {
          setShowMentionDropdown(false);
        }
      } else {
        setShowMentionDropdown(false);
      }
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

  const handleSubmit = async () => {
    if (!content.trim() || isLoading) return;

    try {
      await onSubmit(content.trim());
      setContent('');
      setShowMentionDropdown(false);
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (showMentionDropdown) {
        setShowMentionDropdown(false);
      } else if (onCancel) {
        onCancel();
      }
    }

    // Handle arrow keys for dropdown navigation
    if (showMentionDropdown && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
      e.preventDefault();
      // Simple: select first on Enter
      if (e.key === 'Enter' && filteredCollaborators.length > 0) {
        insertMention(filteredCollaborators[0].email);
      }
    }

    // Ctrl/Cmd + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Reply indicator */}
      {replyTo && (
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          Replying to <span style={{ fontWeight: '500' }}>{replyTo.authorName}</span>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                marginLeft: '8px',
                padding: '2px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        placeholder={placeholder}
        disabled={isLoading}
        style={{
          width: '100%',
          minHeight: '80px',
          maxHeight: '200px',
          padding: '12px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: '1.5',
          color: '#374151',
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color 0.15s',
          fontFamily: 'inherit',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => e.target.style.borderColor = '#fbbf24'}
        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
      />

      {/* Mention autocomplete dropdown */}
      {showMentionDropdown && filteredCollaborators.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: '4px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 20,
            maxHeight: '160px',
            overflow: 'auto'
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
                transition: 'background-color 0.1s'
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
                  backgroundColor: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontSize: '11px',
                  fontWeight: '600'
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
                  textOverflow: 'ellipsis'
                }}>
                  {collab.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Footer with character count and submit */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '12px',
            color: content.length > MAX_LENGTH * 0.9 ? '#ef4444' : '#9ca3af'
          }}>
            {content.length}/{MAX_LENGTH}
          </span>
          {collaborators.length > 0 && (
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
              Type @ to mention
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isLoading}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#6b7280',
                cursor: 'pointer',
                transition: 'background-color 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isLoading}
            style={{
              padding: '6px 12px',
              backgroundColor: content.trim() ? '#fbbf24' : '#e5e7eb',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              color: content.trim() ? '#000' : '#9ca3af',
              cursor: content.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.15s'
            }}
            onMouseOver={(e) => {
              if (content.trim()) e.currentTarget.style.backgroundColor = '#f59e0b';
            }}
            onMouseOut={(e) => {
              if (content.trim()) e.currentTarget.style.backgroundColor = '#fbbf24';
            }}
          >
            {isLoading ? 'Posting...' : 'Post'}
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;
