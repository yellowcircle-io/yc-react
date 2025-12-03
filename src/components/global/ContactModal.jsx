import React, { useState, useRef, useEffect } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { submitContactForm } from '../../utils/formSubmit';

// Service options for dropdown
const SERVICE_OPTIONS = [
  { value: '', label: 'Select a service (optional)' },
  { value: 'growth-audit', label: 'Growth Infrastructure Audit' },
  { value: 'marketing-systems', label: 'Marketing Systems Audit' },
  { value: 'role-alignment', label: 'Role Alignment Assessment' },
  { value: 'technical-debt', label: 'Technical Debt Quantification' },
  { value: 'attribution-audit', label: 'Attribution System Audit' },
  { value: 'data-architecture', label: 'Data Architecture Assessment' },
  { value: 'creative-operations', label: 'Creative + Operations' },
  { value: 'email-development', label: 'Email Template Development' },
  { value: 'discovery-call', label: 'Discovery Call' },
  { value: 'other', label: 'Other / Not Sure' }
];

/**
 * ContactModal - "Get In Touch" modal with email input
 *
 * Features:
 * - Centered modal overlay
 * - Email input field with validation
 * - Service dropdown selector
 * - Message textarea (optional)
 * - Submit button
 * - Close on backdrop click or X button
 * - Accessible keyboard navigation
 */
function ContactModal() {
  const { contactModalOpen, closeContactModal, contactModalEmail } = useLayout();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [utmParams, setUtmParams] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: ''
  });
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);

  // Capture UTM parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setUtmParams({
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      utm_content: urlParams.get('utm_content') || '',
      utm_term: urlParams.get('utm_term') || ''
    });
  }, []);

  // Track previous modal state to detect open transitions
  const wasOpen = useRef(false);

  // Set prefilled email when modal transitions from closed to open
  useEffect(() => {
    // Detect transition from closed to open
    if (contactModalOpen && !wasOpen.current) {
      // Try to get saved contact info from localStorage (from lead gates)
      let savedEmail = '';
      let savedName = '';

      try {
        // Check common storage keys from lead gates and assessment
        const leadData = localStorage.getItem('yc_assessment_data') ||
                        localStorage.getItem('yc_lead_captured') ||
                        localStorage.getItem('yc_outreach_lead') ||
                        localStorage.getItem('yc_unity_lead');
        if (leadData) {
          const parsed = JSON.parse(leadData);
          savedEmail = parsed.email || '';
          savedName = parsed.name || parsed.company || ''; // Assessment uses company field
        }
      } catch (e) {
        // Ignore parse errors
      }

      // Modal just opened - apply prefill if provided (priority: passed prop > localStorage)
      if (contactModalEmail) {
        setEmail(contactModalEmail);
        if (savedName && !name) setName(savedName);
        setTimeout(() => nameInputRef.current?.focus(), 50);
      } else if (savedEmail) {
        setEmail(savedEmail);
        if (savedName) setName(savedName);
        setTimeout(() => nameInputRef.current?.focus(), 50);
      } else {
        // No prefill - focus email field
        setTimeout(() => emailInputRef.current?.focus(), 50);
      }
    }

    // Reset form when modal closes
    if (!contactModalOpen && wasOpen.current) {
      setEmail('');
      setName('');
      setPhone('');
      setService('');
      setMessage('');
      setError('');
      setSubmitted(false);
    }

    // Update tracking ref
    wasOpen.current = contactModalOpen;
  }, [contactModalOpen, contactModalEmail]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && contactModalOpen) {
        closeContactModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [contactModalOpen, closeContactModal]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return true; // Optional field
    // Allow various phone formats: digits, spaces, dashes, parentheses, plus
    const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use shared form submission utility
      const serviceName = service ? SERVICE_OPTIONS.find(s => s.value === service)?.label : '';

      const result = await submitContactForm({
        email,
        name,
        phone,
        service: serviceName,
        message
      });

      if (result.success) {
        setSubmitted(true);
        // Track conversion in Google Ads + GA4
        if (typeof gtag === 'function') {
          gtag('event', 'conversion', {
            'send_to': 'AW-17772974519/contact_form',
            'event_category': 'form',
            'event_label': serviceName || 'general'
          });
          gtag('event', 'generate_lead', {
            'event_category': 'form',
            'event_label': 'contact_form'
          });
        }
        // Close modal after showing success
        setTimeout(() => {
          closeContactModal();
        }, 2000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      setError('Something went wrong. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeContactModal();
    }
  };

  if (!contactModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 400,
        padding: '20px',
        animation: 'modalFadeIn 0.2s ease-out'
      }}
      onClick={handleBackdropClick}
    >
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .contact-input:focus {
          outline: none;
          border-color: rgb(251, 191, 36) !important;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.2);
        }
        .contact-input::placeholder {
          color: rgba(0, 0, 0, 0.4);
        }
        .submit-btn:hover:not(:disabled) {
          background-color: #d4a000 !important;
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .close-btn:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '420px',
          width: '100%',
          position: 'relative',
          animation: 'modalSlideUp 0.3s ease-out',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="close-btn"
          onClick={closeContactModal}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: 'rgba(0, 0, 0, 0.5)',
            transition: 'all 0.2s ease'
          }}
          aria-label="Close modal"
        >
          ×
        </button>

        {submitted ? (
          /* Success State */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgb(251, 191, 36)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '28px'
            }}>
              ✓
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'black',
              margin: '0 0 8px 0'
            }}>
              Thanks for reaching out!
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'rgba(0, 0, 0, 0.6)',
              margin: 0
            }}>
              We'll get back to you soon.
            </p>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'black',
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px'
            }}>
              Get In Touch
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'rgba(0, 0, 0, 0.6)',
              margin: '0 0 24px 0'
            }}>
              Enter your email and we'll reach out to start the conversation.
            </p>

            {/* Email Input */}
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="contact-email"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'rgba(0, 0, 0, 0.7)',
                  marginBottom: '6px',
                  letterSpacing: '0.05em'
                }}
              >
                EMAIL <span style={{ color: 'rgb(251, 191, 36)', fontWeight: '400' }}>*</span>
              </label>
              <input
                ref={emailInputRef}
                id="contact-email"
                type="email"
                className="contact-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  color: 'black',
                  border: '2px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Name Input */}
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="contact-name"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'rgba(0, 0, 0, 0.7)',
                  marginBottom: '6px',
                  letterSpacing: '0.05em'
                }}
              >
                NAME <span style={{ color: 'rgb(251, 191, 36)', fontWeight: '400' }}>*</span>
              </label>
              <input
                ref={nameInputRef}
                id="contact-name"
                type="text"
                className="contact-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  color: 'black',
                  border: '2px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Phone Input */}
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="contact-phone"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'rgba(0, 0, 0, 0.7)',
                  marginBottom: '6px',
                  letterSpacing: '0.05em'
                }}
              >
                PHONE <span style={{ color: 'rgba(0, 0, 0, 0.4)', fontWeight: '400' }}>(optional)</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                className="contact-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  color: 'black',
                  border: '2px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Service Dropdown */}
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="contact-service"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'rgba(0, 0, 0, 0.7)',
                  marginBottom: '6px',
                  letterSpacing: '0.05em'
                }}
              >
                SERVICE <span style={{ color: 'rgba(0, 0, 0, 0.4)', fontWeight: '400' }}>(optional)</span>
              </label>
              <select
                id="contact-service"
                className="contact-input"
                value={service}
                onChange={(e) => setService(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '2px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center'
                }}
              >
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Input (Optional) */}
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="contact-message"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'rgba(0, 0, 0, 0.7)',
                  marginBottom: '6px',
                  letterSpacing: '0.05em'
                }}
              >
                MESSAGE <span style={{ color: 'rgba(0, 0, 0, 0.4)', fontWeight: '400' }}>(optional)</span>
              </label>
              <textarea
                id="contact-message"
                className="contact-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your project..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  color: 'black',
                  border: '2px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '80px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                color: '#dc2626',
                fontSize: '13px',
                marginBottom: '16px',
                padding: '10px 12px',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                borderRadius: '6px'
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px 24px',
                fontSize: '14px',
                fontWeight: '700',
                letterSpacing: '0.05em',
                color: 'white',
                backgroundColor: 'rgb(251, 191, 36)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
            </button>

            {/* Direct Email Link */}
            <p style={{
              fontSize: '12px',
              color: 'rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
              marginTop: '16px',
              marginBottom: 0
            }}>
              Or email us directly at{' '}
              <a
                href="mailto:info@yellowcircle.io"
                style={{
                  color: 'rgb(251, 191, 36)',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                info@yellowcircle.io
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ContactModal;
