import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShortlinks } from '../hooks/useShortlinks';
import { COLORS } from '../styles/constants';

/**
 * Handles shortlink redirects with tracking
 * Route: /go/:shortCode
 */
function ShortlinkRedirectPage() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const { getShortlink, isLoading } = useShortlinks();
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        setError('No shortlink code provided');
        return;
      }

      try {
        const shortlink = await getShortlink(shortCode, true);

        if (!shortlink) {
          setError('Shortlink not found or has been deactivated');
          // Redirect to home after 3 seconds
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Redirect to destination
        window.location.href = shortlink.destinationUrl;

      } catch (err) {
        console.error('Redirect error:', err);
        setError('An error occurred while redirecting');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleRedirect();
  }, [shortCode, getShortlink, navigate]);

  // Countdown for error state
  useEffect(() => {
    if (error && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [error, countdown]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      backgroundColor: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {error ? (
        <>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            fontSize: '28px'
          }}>
            ⚠️
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            margin: '0 0 10px 0',
            color: '#1a1a1a'
          }}>
            Link Not Found
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: '0 0 20px 0',
            textAlign: 'center',
            maxWidth: '300px'
          }}>
            {error}
          </p>
          <p style={{
            fontSize: '12px',
            color: '#999'
          }}>
            Redirecting to homepage in {countdown}...
          </p>
        </>
      ) : (
        <>
          {/* Loading spinner */}
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: COLORS.yellow,
            marginBottom: '20px',
            animation: 'pulse 1s ease-in-out infinite'
          }} />
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: 0
          }}>
            Redirecting...
          </p>
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
          `}</style>
        </>
      )}

      {/* yellowCircle branding */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        fontSize: '11px',
        color: '#ccc',
        letterSpacing: '0.1em'
      }}>
        YELLOWCIRCLE.IO
      </div>
    </div>
  );
}

export default ShortlinkRedirectPage;
