import React, { useState, useEffect } from 'react';

const ShareModal = ({ isOpen, onClose, shareUrl, capsuleId }) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Slight delay for smooth entrance animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy URL. Please copy manually.');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out'
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '0',
          padding: '0',
          maxWidth: '600px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(238, 207, 0, 0.3)',
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          backgroundColor: '#000000',
          padding: '24px 32px',
          borderBottom: '3px solid #EECF00'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            letterSpacing: '0.1em',
            margin: 0,
            color: '#FFFFFF',
            textTransform: 'uppercase'
          }}>
            🎉 Time Capsule Saved
          </h3>
          <p style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: '8px 0 0 0',
            letterSpacing: '0.05em'
          }}>
            Your memories are now preserved and shareable
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          <p style={{
            marginBottom: '20px',
            color: '#333',
            fontSize: '14px',
            lineHeight: '1.6',
            letterSpacing: '0.02em'
          }}>
            Share this link with anyone to let them explore your travel memories:
          </p>

          {/* URL Display & Copy */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <input
              type="text"
              value={shareUrl}
              readOnly
              onClick={(e) => e.target.select()}
              style={{
                flex: 1,
                padding: '14px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '0',
                fontSize: '13px',
                fontFamily: 'monospace',
                backgroundColor: '#f9fafb',
                color: '#1f2937',
                letterSpacing: '0.02em',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#EECF00';
                e.target.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.backgroundColor = '#f9fafb';
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                padding: '14px 28px',
                backgroundColor: copied ? '#10b981' : '#EECF00',
                color: copied ? 'white' : 'black',
                border: 'none',
                borderRadius: '0',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '13px',
                letterSpacing: '0.05em',
                transition: 'all 0.3s ease',
                boxShadow: copied ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(238, 207, 0, 0.3)',
                transform: copied ? 'scale(1.05)' : 'scale(1)',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => {
                if (!copied) {
                  e.target.style.backgroundColor = '#fbbf24';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(238, 207, 0, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (!copied) {
                  e.target.style.backgroundColor = '#EECF00';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(238, 207, 0, 0.3)';
                }
              }}
            >
              {copied ? '✓ COPIED!' : 'COPY LINK'}
            </button>
          </div>

          {/* Capsule ID Reference */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(238, 207, 0, 0.1)',
            border: '1px solid rgba(238, 207, 0, 0.3)',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '11px',
              color: '#666',
              margin: 0,
              letterSpacing: '0.05em',
              fontFamily: 'monospace'
            }}>
              <strong>Capsule ID:</strong> {capsuleId}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#666',
                border: '2px solid #e5e7eb',
                borderRadius: '0',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                letterSpacing: '0.05em',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = '#EECF00';
                e.target.style.color = '#000';
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.color = '#666';
              }}
            >
              CLOSE
            </button>
            <button
              onClick={() => {
                window.open(shareUrl, '_blank');
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                letterSpacing: '0.05em',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#EECF00';
                e.target.style.color = '#000000';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(238, 207, 0, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#000000';
                e.target.style.color = '#FFFFFF';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
            >
              OPEN IN NEW TAB →
            </button>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #EECF00 0%, #fbbf24 50%, #EECF00 100%)'
        }} />
      </div>
    </div>
  );
};

export default ShareModal;
