import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * DenyAccessPage - Handles client access denial
 * Redirects to Firebase function with token
 */
function DenyAccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid link. Missing token.');
      return;
    }

    // Redirect to Firebase function
    window.location.href = `https://us-central1-yellowcircle-app.cloudfunctions.net/denyAccess?token=${token}`;
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '16px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: '400px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: status === 'error' ? '#ef4444' : '#6b7280',
          borderRadius: '50%',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {status === 'processing' ? (
            <svg width="40" height="40" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <h1 style={{ color: '#1f2937', fontSize: '24px', margin: '0 0 10px' }}>
          {status === 'processing' ? 'Processing...' : 'Error'}
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>{message}</p>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default DenyAccessPage;
