/**
 * CommentList - Displays comments with threading and actions
 *
 * Features:
 * - Comment display with author avatar/info
 * - Mention highlighting
 * - Edit/delete for own comments
 * - Reply functionality
 * - Timestamp display
 * - Empty state
 */

import React, { useState, useEffect } from 'react';
import { MessageCircle, Edit2, Trash2, Reply, MoreVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CommentInput from './CommentInput';
import {
  getComments,
  addComment,
  updateComment,
  deleteComment
} from '../../utils/firestoreLinks';

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
          backgroundColor: '#fef3c7',
          color: '#92400e',
          padding: '1px 4px',
          borderRadius: '4px',
          fontWeight: '500'
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

// Format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return '';

  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
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

// Single comment component
const CommentItem = ({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  isReply = false,
  collaborators: _collaborators = []
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthor = currentUserId === comment.authorId;
  const initials = (comment.authorName || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleEdit = async () => {
    if (!editContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing comment:', error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: isReply ? '12px 0 12px 40px' : '12px 0',
        borderBottom: '1px solid #f3f4f6'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div
        style={{
          width: isReply ? '28px' : '32px',
          height: isReply ? '28px' : '32px',
          borderRadius: '50%',
          backgroundColor: '#fbbf24',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontSize: isReply ? '10px' : '12px',
          fontWeight: '600',
          flexShrink: 0
        }}
      >
        {initials}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#111827'
            }}>
              {comment.authorName || 'User'}
            </span>
            <span style={{
              fontSize: '11px',
              color: '#9ca3af'
            }}>
              {formatTime(comment.createdAt)}
            </span>
            {comment.editedAt && (
              <span style={{
                fontSize: '10px',
                color: '#9ca3af',
                fontStyle: 'italic'
              }}>
                (edited)
              </span>
            )}
          </div>

          {/* Actions */}
          {showActions && !isEditing && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => onReply(comment)}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Reply"
              >
                <Reply size={14} />
              </button>
              {isAuthor && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '4px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      padding: '4px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        {isEditing ? (
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '8px',
                backgroundColor: '#f9fafb',
                border: '1px solid #fbbf24',
                borderRadius: '6px',
                fontSize: '13px',
                lineHeight: '1.5',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px'
            }}>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                style={{
                  padding: '4px 10px',
                  backgroundColor: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={!editContent.trim() || isSubmitting}
                style={{
                  padding: '4px 10px',
                  backgroundColor: editContent.trim() ? '#fbbf24' : '#e5e7eb',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: editContent.trim() ? 'pointer' : 'not-allowed',
                  color: editContent.trim() ? '#000' : '#9ca3af'
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#374151',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {renderContentWithMentions(comment.content)}
          </div>
        )}
      </div>
    </div>
  );
};

// Main CommentList component
const CommentList = ({
  targetType,
  targetId,
  collaborators = [],
  showInput = true
}) => {
  const { user, userProfile } = useAuth();
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      if (!targetType || !targetId) return;

      setIsLoading(true);
      try {
        const loadedComments = await getComments(targetType, targetId);
        setComments(loadedComments);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
      setIsLoading(false);
    };

    loadComments();
  }, [targetType, targetId]);

  // Add comment
  const handleAddComment = async (content) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const newComment = await addComment({
        targetType,
        targetId,
        authorId: user.uid,
        authorName: userProfile?.displayName || user.email?.split('@')[0] || 'User',
        authorEmail: user.email,
        content,
        parentCommentId: replyTo?.id || null
      });

      setComments(prev => [...prev, newComment]);
      setReplyTo(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
    setIsSubmitting(false);
  };

  // Edit comment
  const handleEditComment = async (commentId, newContent) => {
    try {
      await updateComment(commentId, user.uid, newContent);
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? { ...c, content: newContent, editedAt: new Date() }
            : c
        )
      );
    } catch (error) {
      console.error('Error editing comment:', error);
      throw error;
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId, user.uid);
      setComments(prev => prev.filter(c => c.id !== commentId && c.parentCommentId !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  // Organize comments into threads
  const rootComments = comments.filter(c => !c.parentCommentId);
  const replies = comments.filter(c => c.parentCommentId);

  const getRepliesToComment = (commentId) => {
    return replies.filter(r => r.parentCommentId === commentId);
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#9ca3af'
      }}>
        Loading comments...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <MessageCircle size={18} color="#6b7280" />
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151'
        }}>
          Comments ({comments.length})
        </span>
      </div>

      {/* Comments list */}
      {rootComments.length === 0 ? (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: '#9ca3af'
        }}>
          <MessageCircle size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
          <div style={{ fontSize: '14px' }}>No comments yet</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Be the first to share your thoughts
          </div>
        </div>
      ) : (
        <div>
          {rootComments.map(comment => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={user?.uid}
                onReply={setReplyTo}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                collaborators={collaborators}
              />
              {/* Replies */}
              {getRepliesToComment(comment.id).map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={user?.uid}
                  onReply={setReplyTo}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                  isReply={true}
                  collaborators={collaborators}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      {showInput && user && (
        <div style={{ marginTop: '16px' }}>
          <CommentInput
            onSubmit={handleAddComment}
            onCancel={replyTo ? () => setReplyTo(null) : undefined}
            placeholder={replyTo ? `Reply to ${replyTo.authorName}...` : 'Write a comment...'}
            collaborators={collaborators}
            isLoading={isSubmitting}
            replyTo={replyTo}
          />
        </div>
      )}

      {/* Sign in prompt */}
      {showInput && !user && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '13px'
        }}>
          Sign in to leave a comment
        </div>
      )}
    </div>
  );
};

export default CommentList;
