/**
 * AuthModal - Login/Signup modal with SSO support
 *
 * Features:
 * - Google OAuth
 * - Email/Password login and signup
 * - Password reset
 * - Displays credits remaining after login
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// SVG Icons for providers
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    error,
    clearError
  } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login', 'signup', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    clearError();
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setDisplayName('');
    onClose();
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      clearError();
      await signInWithGoogle();
      handleClose();
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      clearError();

      if (mode === 'login') {
        await signInWithEmail(email, password);
        handleClose();
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
        handleClose();
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccessMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    clearError();
    setSuccessMessage('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideIn 0.2s ease-out'
        }}
      >
        <style>{`
          @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#fbbf24',
              borderRadius: '50%',
              margin: '0 auto 16px'
            }}
          />
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
            {mode === 'login' && 'Sign in to sync your credits'}
            {mode === 'signup' && 'Get 3 free credits to start'}
            {mode === 'reset' && 'Enter your email to reset'}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          >
            {error}
          </div>
        )}
        {successMessage && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #dcfce7',
              color: '#16a34a',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          >
            {successMessage}
          </div>
        )}

        {/* SSO Buttons (not shown for password reset) */}
        {mode !== 'reset' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#1f2937',
                  transition: 'background-color 0.2s',
                  opacity: loading ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <GoogleIcon />
                Continue with Google
              </button>

            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              <span style={{ padding: '0 16px', color: '#9ca3af', fontSize: '14px' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>
          </>
        )}

        {/* Email Form */}
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />

          {mode !== 'reset' && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 16px',
              backgroundColor: '#fbbf24',
              color: 'black',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          {mode === 'login' && (
            <>
              <button
                onClick={() => switchMode('reset')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Forgot password?
              </button>
              <div style={{ marginTop: '12px' }}>
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  Sign up
                </button>
              </div>
            </>
          )}
          {mode === 'signup' && (
            <div>
              Already have an account?{' '}
              <button
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                Sign in
              </button>
            </div>
          )}
          {mode === 'reset' && (
            <button
              onClick={() => switchMode('login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Back to sign in
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#9ca3af',
            lineHeight: 1
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
