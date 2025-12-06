import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * EmailNode - Email step in UnityMAP journey
 *
 * Represents a single email in an outreach sequence.
 * Has input (from prospect/condition) and output (to next step) handles.
 */
const EmailNode = memo(({ id, data, selected }) => {
  const {
    label = 'Email',
    subject = '',
    preview = '',
    fullBody = '', // Full email body for preview
    status = 'draft', // 'draft', 'scheduled', 'sent'
    stats = { sent: 0, opened: 0, clicked: 0, replied: 0 },
    prospectsAtNode = 0, // Number of prospects currently at this node
    onInlineEdit, // Open inline edit modal (preferred)
    onEditInOutreach, // Navigate to Outreach Generator (fallback)
    onPreview, // Show email preview modal
    onDelete // Delete this node
  } = data;

  const [isHovered, setIsHovered] = useState(false);

  const statusColors = {
    draft: { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' },
    scheduled: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    sent: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' }
  };

  const colors = statusColors[status] || statusColors.draft;

  // Calculate open rate
  const openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#fff',
        border: selected ? '3px solid rgb(251, 191, 36)' : `2px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '16px',
        minWidth: '220px',
        maxWidth: '280px',
        boxShadow: selected
          ? '0 8px 24px rgba(251, 191, 36, 0.4)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Input Handle - Top */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'rgb(251, 191, 36)',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>📧</span>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            color: '#374151',
            textTransform: 'uppercase'
          }}>
            {label}
          </span>
        </div>

        {/* Status Badge */}
        <span style={{
          fontSize: '9px',
          fontWeight: '700',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          color: colors.text,
          backgroundColor: colors.bg,
          padding: '3px 8px',
          borderRadius: '4px'
        }}>
          {status}
        </span>
      </div>

      {/* Subject Line */}
      {subject && (
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '6px',
          lineHeight: '1.4',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {subject}
        </div>
      )}

      {/* Preview Text */}
      {preview && (
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          lineHeight: '1.4',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {preview}
        </div>
      )}

      {/* Prospects at this node indicator */}
      {prospectsAtNode > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '8px',
          padding: '6px 10px',
          backgroundColor: 'rgba(251, 191, 36, 0.15)',
          borderRadius: '6px',
          border: '1px solid rgba(251, 191, 36, 0.3)'
        }}>
          <span style={{ fontSize: '14px' }}>👤</span>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#92400e'
          }}>
            {prospectsAtNode} waiting
          </span>
        </div>
      )}

      {/* Stats (if sent) */}
      {status === 'sent' && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
              {stats.sent}
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>
              Sent
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
              {openRate}%
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>
              Opened
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#b45309' }}>
              {stats.replied}
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>
              Replied
            </div>
          </div>
        </div>
      )}

      {/* Hover Actions */}
      {isHovered && (
        <div style={{
          display: 'flex',
          gap: '6px',
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onInlineEdit) {
                // Preferred: Open inline edit modal
                onInlineEdit(id, data);
              } else if (onEditInOutreach) {
                // Fallback: Navigate to Outreach Generator
                onEditInOutreach(id, data);
              } else {
                // Last resort: direct navigation
                window.location.href = '/outreach';
              }
            }}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '10px',
              fontWeight: '600',
              backgroundColor: 'rgb(251, 191, 36)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onPreview) {
                // Pass formatted data compatible with the preview handler
                onPreview(null, {
                  content: `**Subject:** ${subject}\n\n${fullBody || preview}`,
                  title: label
                });
              } else {
                // Better fallback: show formatted preview in alert
                const emailContent = `📧 ${label}\n\nSubject: ${subject || 'No subject'}\n\n${fullBody || preview || 'No content'}`;
                alert(emailContent);
              }
            }}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '10px',
              fontWeight: '600',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Preview
          </button>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              style={{
                width: '28px',
                height: '28px',
                padding: 0,
                fontSize: '14px',
                fontWeight: '400',
                backgroundColor: '#374151',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
              }}
              title="Delete node"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Output Handle - Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'rgb(251, 191, 36)',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
});

EmailNode.displayName = 'EmailNode';

export default EmailNode;
