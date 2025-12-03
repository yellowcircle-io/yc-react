import React, { useState, useEffect } from 'react';
import { COLORS } from '../../styles/constants';
import { submitLeadGate } from '../../utils/formSubmit';

/**
 * LeadGate - Email capture gate for tools
 *
 * Requires email before allowing access to tools.
 * Uses shared form submission utility.
 *
 * Usage:
 * <LeadGate toolName="Outreach Generator" onUnlock={() => setUnlocked(true)}>
 *   <YourToolContent />
 * </LeadGate>
 */

// Client bypass uses hash comparison (not plaintext)
// To generate: btoa('yourpassword') in console
const BYPASS_HASH = 'eWMyMDI1'; // Base64 encoded

function LeadGate({
  children,
  toolName = 'Tool',
  toolDescription = 'Get instant access to this tool',
  storageKey = 'yc_lead_captured',
  onUnlock
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');

  // Check if already unlocked on mount
  useEffect(() => {
    const captured = localStorage.getItem(storageKey);
    const bypassActive = localStorage.getItem('yc_bypass_active');
    if (captured || bypassActive) {
      setIsUnlocked(true);
      onUnlock?.();
    }
  }, [storageKey, onUnlock]);

  // Handle password bypass (hash comparison)
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    try {
      if (btoa(password) === BYPASS_HASH) {
        localStorage.setItem('yc_bypass_active', 'true');
        setIsUnlocked(true);
        onUnlock?.();
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Invalid password');
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use shared form submission utility
      await submitLeadGate(email, name, toolName);

      // Store in localStorage
      localStorage.setItem(storageKey, JSON.stringify({
        email,
        name,
        tool: toolName,
        timestamp: new Date().toISOString()
      }));

      // Track conversion in Google Ads + GA4
      if (typeof gtag === 'function') {
        gtag('event', 'conversion', {
          'send_to': 'AW-17772974519/lead_gate',
          'event_category': 'lead_gate',
          'event_label': toolName
        });
        gtag('event', 'sign_up', {
          'event_category': 'lead_gate',
          'event_label': toolName
        });
      }

      setIsUnlocked(true);
      onUnlock?.();
    } catch (err) {
      console.error('Lead capture error:', err);
      // Still unlock on error to not block users
      localStorage.setItem(storageKey, JSON.stringify({
        email,
        name,
        tool: toolName,
        timestamp: new Date().toISOString(),
        error: true
      }));
      setIsUnlocked(true);
      onUnlock?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Always render children - nav stays accessible, only content area gated
  return (
    <>
      {/* Render children normally - Layout/Nav have their own z-index */}
      {children}

      {/* Show gate overlay when locked - positioned to not cover nav */}
      {!isUnlocked && (
        <div style={{
          position: 'fixed',
          top: '80px', // Below header
          left: '80px', // Right of sidebar when closed
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50, // Well below sidebar (260) and header (255)
          padding: '20px'
        }}>
      <style>{`
        .lead-input:focus {
          outline: none;
          border-color: ${COLORS.yellow} !important;
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.2);
        }
        .lead-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .lead-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
        }
        .lead-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div style={{
        backgroundColor: 'rgba(20, 20, 20, 1)',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '420px',
        width: '100%',
        border: `1px solid rgba(251, 191, 36, 0.3)`,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Yellow circle icon */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: COLORS.yellow,
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
        </div>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: 'white',
          textAlign: 'center',
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px'
        }}>
          Access {toolName}
        </h2>

        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          margin: '0 0 28px 0',
          lineHeight: '1.5'
        }}>
          {toolDescription}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              className="lead-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '16px',
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Name Input (optional) */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              className="lead-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '16px',
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              color: '#ef4444',
              fontSize: '13px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="lead-btn"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              color: 'black',
              backgroundColor: COLORS.yellow,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isSubmitting ? 'UNLOCKING...' : 'GET ACCESS'}
          </button>
        </form>

        <p style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
          textAlign: 'center',
          margin: '16px 0 0 0'
        }}>
          Free to use. We'll send occasional updates about new tools.
        </p>

        {/* Password bypass option */}
        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          {!showPasswordInput ? (
            <button
              onClick={() => setShowPasswordInput(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.3)',
                fontSize: '11px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'center'
              }}
            >
              Client access →
            </button>
          ) : (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="lead-input"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  fontSize: '14px',
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'black',
                  backgroundColor: COLORS.yellow,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                GO
              </button>
            </form>
          )}
        </div>
      </div>
        </div>
      )}
    </>
  );
}

export default LeadGate;
