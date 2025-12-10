import React, { useState, useEffect } from 'react';
import { COLORS } from '../../styles/constants';
import { submitLeadGate } from '../../utils/formSubmit';
import { sendLeadCapture } from '../../config/integrations';
import { createLead } from '../../utils/firestoreLeads';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useAccessRequest } from '../../hooks/useAccessRequest';

/**
 * LeadGate - Email capture gate for tools
 *
 * Requires email before allowing access to tools.
 * Uses shared form submission utility.
 *
 * Access methods:
 * - SSO login (Google) - automatic unlock
 * - Email capture - basic unlock
 * - Request client access - admin-approved premium access
 *
 * Usage:
 * <LeadGate toolName="Outreach Generator" onUnlock={() => setUnlocked(true)}>
 *   <YourToolContent />
 * </LeadGate>
 */

// SVG Icon for Google SSO
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

function LeadGate({
  children,
  toolName = 'Tool',
  toolDescription = 'Get instant access to this tool',
  storageKey = 'yc_lead_captured',
  onUnlock
}) {
  // SSO Authentication - bypass gate when logged in
  const { isAuthenticated, signInWithGoogle, error: authError, clearError } = useAuth();

  // Layout context for sidebar state
  const { sidebarOpen } = useLayout();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ssoLoading, setSsoLoading] = useState(false);
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [accessEmail, setAccessEmail] = useState('');
  const [accessName, setAccessName] = useState('');
  const [accessCompany, setAccessCompany] = useState('');

  // Access request hook
  const {
    requestAccess,
    isSubmitting: isRequestingAccess,
    success: accessRequestSuccess,
    message: accessRequestMessage,
    error: accessRequestError,
    reset: resetAccessRequest
  } = useAccessRequest();

  // Check if already unlocked on mount (or via SSO)
  useEffect(() => {
    const captured = localStorage.getItem(storageKey);
    // Bypass when authenticated via SSO or already captured email
    if (captured || isAuthenticated) {
      setIsUnlocked(true);
      onUnlock?.();
    }
  }, [storageKey, onUnlock, isAuthenticated]);

  // Handle SSO login
  const handleGoogleSignIn = async () => {
    try {
      setSsoLoading(true);
      clearError?.();
      await signInWithGoogle();
      // isAuthenticated will update via useEffect and unlock
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setSsoLoading(false);
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
      // === NEW: Create lead in Firestore (canonical data store) ===
      // This triggers the automation pipeline via Firestore triggers
      createLead({
        email,
        submittedData: { name, tool: toolName },
        source: 'lead_gate',
        sourceTool: toolName
      }).catch(err => {
        // Fire and forget - don't block user on Firestore errors
        console.error('[LeadGate] Firestore lead creation failed:', err);
      });

      // Use shared form submission utility (Web3Forms backup)
      await submitLeadGate(email, name, toolName);

      // Send to n8n for Airtable + Slack automation (fire and forget)
      sendLeadCapture(
        { email, name, tool: toolName },
        'lead_gate',
        'Tool Access'
      );

      // Store in localStorage (client-side tracking)
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

      {/* Show gate overlay when locked - positioned to not cover sidebar */}
      {!isUnlocked && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 'min(max(280px, 35vw), 472px)' : '0px',
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10, // Below sidebar (260), header (255), and other UI elements
          padding: '20px',
          transition: 'left 0.5s ease-out'
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
          margin: '0 0 24px 0',
          lineHeight: '1.5'
        }}>
          {toolDescription}
        </p>

        {/* SSO Login Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleGoogleSignIn}
            disabled={ssoLoading}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '12px 16px',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: ssoLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: '#1f2937',
              transition: 'all 0.2s ease',
              opacity: ssoLoading ? 0.6 : 1
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          <span style={{ padding: '0 16px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>or use email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

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
          {(error || authError) && (
            <div style={{
              color: '#ef4444',
              fontSize: '13px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {error || authError}
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

        {/* Client Access Request Section */}
        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          {!showAccessRequest ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowAccessRequest(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Request client access
              </button>
            </div>
          ) : (
            // Access Request Form
            <div>
              {accessRequestSuccess ? (
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: '#10b981', fontSize: '13px', margin: 0 }}>
                    ✓ {accessRequestMessage}
                  </p>
                  <button
                    onClick={() => {
                      resetAccessRequest();
                      setShowAccessRequest(false);
                    }}
                    style={{
                      marginTop: '12px',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  await requestAccess({
                    email: accessEmail,
                    name: accessName,
                    company: accessCompany
                  });
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '0 0 12px', textAlign: 'center' }}>
                    Request premium access for your team
                  </p>
                  <input
                    type="email"
                    value={accessEmail}
                    onChange={(e) => setAccessEmail(e.target.value)}
                    placeholder="Work email *"
                    required
                    className="lead-input"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={accessName}
                      onChange={(e) => setAccessName(e.target.value)}
                      placeholder="Name"
                      className="lead-input"
                      style={{
                        flex: '1 1 0',
                        minWidth: 0,
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <input
                      type="text"
                      value={accessCompany}
                      onChange={(e) => setAccessCompany(e.target.value)}
                      placeholder="Company"
                      className="lead-input"
                      style={{
                        flex: '1 1 0',
                        minWidth: 0,
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        color: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  {accessRequestError && (
                    <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 8px', textAlign: 'center' }}>
                      {accessRequestError}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        resetAccessRequest();
                        setShowAccessRequest(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.6)',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isRequestingAccess}
                      style={{
                        flex: 2,
                        padding: '10px 16px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'black',
                        backgroundColor: COLORS.yellow,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isRequestingAccess ? 'not-allowed' : 'pointer',
                        opacity: isRequestingAccess ? 0.6 : 1
                      }}
                    >
                      {isRequestingAccess ? 'Submitting...' : 'Request Access'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
        </div>
      )}
    </>
  );
}

export default LeadGate;
