import React, { useState } from 'react';
import { COLORS, BUTTON } from '../../styles/constants';

/**
 * EmailCaptureModal Component
 * Modal for capturing email addresses for consultation or template downloads
 * Includes validation and submission handling
 */
function EmailCaptureModal({ isOpen, onClose, type = 'consultation', onSubmit }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const titles = {
    consultation: 'Schedule a Consultation',
    template: 'Get the Audit Template'
  };

  const descriptions = {
    consultation: "We'll review your specific situation and provide actionable insights. No sales pitch, just honest assessment.",
    template: "Get our comprehensive alignment audit template. Start diagnosing your GTM issues today."
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call


      if (onSubmit) {
        onSubmit({ email, name, type });
      }

      setSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9998,
          animation: 'fadeIn 0.3s ease-out'
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: COLORS.black,
          border: `2px solid ${COLORS.yellow}`,
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          width: '90%',
          zIndex: 9999,
          boxShadow: `0 20px 60px rgba(251, 191, 36, 0.3)`,
          animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: COLORS.textSecondaryOnDark,
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            lineHeight: 1,
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = COLORS.yellow}
          onMouseLeave={(e) => e.currentTarget.style.color = COLORS.textSecondaryOnDark}
        >
          ×
        </button>

        {/* Success state */}
        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
            <h2 style={{ color: COLORS.success, fontSize: '1.5rem', marginBottom: '12px' }}>
              Success!
            </h2>
            <p style={{ color: COLORS.textSecondaryOnDark }}>
              {type === 'consultation'
                ? "We'll be in touch within 24 hours."
                : "Check your email for the audit template."}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <h2 style={{
              color: COLORS.yellow,
              fontSize: '1.8rem',
              marginBottom: '12px',
              fontWeight: '700'
            }}>
              {titles[type]}
            </h2>
            <p style={{
              color: COLORS.textSecondaryOnDark,
              marginBottom: '32px',
              lineHeight: 1.6
            }}>
              {descriptions[type]}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Name input */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="name"
                  style={{
                    display: 'block',
                    color: COLORS.textOnDark,
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Smith"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                    backgroundColor: COLORS.darkGrey,
                    color: COLORS.textOnDark,
                    border: `2px solid ${COLORS.darkGrey}`,
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = COLORS.yellow}
                  onBlur={(e) => e.currentTarget.style.borderColor = COLORS.darkGrey}
                />
              </div>

              {/* Email input */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    color: COLORS.textOnDark,
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                    backgroundColor: COLORS.darkGrey,
                    color: COLORS.textOnDark,
                    border: `2px solid ${COLORS.darkGrey}`,
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = COLORS.yellow}
                  onBlur={(e) => e.currentTarget.style.borderColor = COLORS.darkGrey}
                />
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${COLORS.error}`,
                  borderRadius: '8px',
                  color: COLORS.error,
                  fontSize: '0.9rem',
                  marginBottom: '20px'
                }}>
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...BUTTON.primary,
                  width: '100%',
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Submitting...' : (type === 'consultation' ? 'Schedule Now' : 'Get Template')}
              </button>

              {/* Privacy note */}
              <p style={{
                marginTop: '16px',
                fontSize: '0.75rem',
                color: COLORS.textSecondaryOnDark,
                textAlign: 'center',
                lineHeight: 1.4
              }}>
                We respect your privacy. No spam, just valuable insights.
              </p>
            </form>
          </>
        )}
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translate(-50%, -45%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}
      </style>
    </>
  );
}

export default EmailCaptureModal;
