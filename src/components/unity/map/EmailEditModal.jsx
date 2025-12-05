import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * EmailEditModal - Inline editor for UnityMAP email nodes
 *
 * Allows editing subject, body, and delay without leaving UnityMAP.
 * For AI-assisted rewrites, user can go to Outreach Generator.
 */
const EmailEditModal = ({ isOpen, onClose, emailData, onSave }) => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when modal opens
  useEffect(() => {
    if (isOpen && emailData) {
      setSubject(emailData.subject || '');
      setBody(emailData.fullBody || emailData.preview || '');
    }
  }, [isOpen, emailData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...emailData,
        subject,
        fullBody: body,
        preview: body.substring(0, 100)
      });
      onClose();
    } catch (error) {
      console.error('Failed to save email:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📧</span>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#111827'
            }}>
              Edit Email
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Subject Line */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Email Body */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Email Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content..."
              rows={12}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* AI Assist Note - Clickable */}
          <button
            onClick={() => {
              onClose();
              navigate('/outreach');
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
              e.currentTarget.style.borderColor = 'rgb(251, 191, 36)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              <strong style={{ color: '#b45309' }}>Need AI assistance?</strong> Use the Outreach Generator to create
              AI-powered email sequences with personalization variables.
              <span style={{ color: '#b45309', marginLeft: '8px' }}>Go to Outreach →</span>
            </p>
          </button>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: 'rgb(251, 191, 36)',
              color: '#111827',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailEditModal;
