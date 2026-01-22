/**
 * Vanity Save Page
 *
 * Handles vanity save URLs:
 * - Token-based: yellowcircle.io/s/{yc_token}/{destination-url}
 * - Slug-based: yellowcircle.io/s/{custom-slug}/{destination-url}
 *
 * Saves the link to user's collection and redirects to destination.
 *
 * @created 2026-01-22
 */

import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const FUNCTIONS_BASE_URL = 'https://us-central1-yellowcircle-app.cloudfunctions.net';

/**
 * Extract and normalize the destination URL from the path
 * Path format: /s/{token}/{destination-url}
 *
 * Handles URL normalization issues:
 * - Browser collapses :// to :/ in URL paths
 * - Auto-adds https:// if no protocol specified
 */
const extractDestinationUrl = (pathname, token) => {
  // Find where the token ends and destination begins
  const tokenIndex = pathname.indexOf(token);
  if (tokenIndex === -1) return null;

  // Get everything after /s/{token}/
  let destination = pathname.substring(tokenIndex + token.length + 1);

  if (!destination) return null;

  // Fix collapsed protocol (browser normalizes :// to :/ in URL paths)
  // https:/example.com → https://example.com
  // http:/example.com → http://example.com
  if (destination.startsWith('https:/') && !destination.startsWith('https://')) {
    destination = 'https://' + destination.substring(7);
  } else if (destination.startsWith('http:/') && !destination.startsWith('http://')) {
    destination = 'http://' + destination.substring(6);
  } else if (!destination.startsWith('http://') && !destination.startsWith('https://')) {
    // No protocol - add https://
    destination = 'https://' + destination;
  }

  // Decode URI components
  try {
    destination = decodeURIComponent(destination);
  } catch {
    // If decode fails, use as-is
  }

  return destination;
};

/**
 * Resolve a slug or token to an API token
 * - If starts with 'yc_', it's already a token
 * - Otherwise, look up in vanitySlugs collection
 */
const resolveToToken = async (slugOrToken) => {
  // If it's already a token format, return as-is
  if (slugOrToken.startsWith('yc_')) {
    return { token: slugOrToken, isSlug: false };
  }

  // Look up custom slug in Firestore
  try {
    const slugDoc = await getDoc(doc(db, 'vanitySlugs', slugOrToken.toLowerCase()));
    if (slugDoc.exists()) {
      const data = slugDoc.data();
      if (data.active && data.token) {
        return { token: data.token, isSlug: true, slug: slugOrToken };
      }
    }
  } catch (err) {
    console.error('Slug lookup error:', err);
  }

  return { token: null, isSlug: true, slug: slugOrToken };
};

function VanitySavePage() {
  const { token: slugOrToken } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState('saving'); // 'saving' | 'success' | 'error'
  const [error, setError] = useState(null);
  const [destinationUrl, setDestinationUrl] = useState(null);

  useEffect(() => {
    const handleSaveAndRedirect = async () => {
      // Extract destination URL from path
      const destination = extractDestinationUrl(location.pathname, slugOrToken);

      if (!destination) {
        setStatus('error');
        setError('No destination URL provided');
        return;
      }

      setDestinationUrl(destination);

      // Resolve slug or token to an API token
      const resolved = await resolveToToken(slugOrToken);

      if (!resolved.token) {
        setStatus('error');
        setError(resolved.isSlug
          ? `Unknown vanity path: ${resolved.slug}`
          : 'Invalid token format'
        );
        return;
      }

      try {
        // Call quickSave API with resolved token
        const response = await fetch(
          `${FUNCTIONS_BASE_URL}/linkArchiverQuickSave?token=${encodeURIComponent(resolved.token)}&url=${encodeURIComponent(destination)}`,
          { method: 'GET' }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          // Redirect immediately on success
          window.location.href = destination;
        } else {
          setStatus('error');
          setError(data.error || 'Failed to save link');
        }
      } catch (err) {
        console.error('Vanity save error:', err);
        setStatus('error');
        setError('Network error. The link may still have been saved.');
      }
    };

    handleSaveAndRedirect();
  }, [slugOrToken, location.pathname]);

  // Handle manual redirect for error cases
  const handleContinueAnyway = () => {
    if (destinationUrl) {
      window.location.href = destinationUrl;
    } else {
      navigate('/');
    }
  };

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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      {status === 'saving' && (
        <>
          {/* Loading spinner */}
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#fbbf24',
            marginBottom: '20px',
            animation: 'pulse 1s ease-in-out infinite'
          }} />
          <p style={{
            fontSize: '16px',
            fontWeight: '500',
            color: '#1a1a1a',
            margin: '0 0 8px 0'
          }}>
            Saving link...
          </p>
          <p style={{
            fontSize: '13px',
            color: '#666',
            margin: 0,
            maxWidth: '300px',
            textAlign: 'center',
            wordBreak: 'break-all'
          }}>
            {destinationUrl || 'Preparing redirect...'}
          </p>
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
          `}</style>
        </>
      )}

      {status === 'error' && (
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
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 10px 0',
            color: '#1a1a1a'
          }}>
            Couldn't Save Link
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: '0 0 20px 0',
            textAlign: 'center',
            maxWidth: '320px'
          }}>
            {error}
          </p>

          {destinationUrl && (
            <button
              onClick={handleContinueAnyway}
              style={{
                padding: '12px 24px',
                backgroundColor: '#fbbf24',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1a1a1a',
                cursor: 'pointer',
                marginBottom: '12px'
              }}
            >
              Continue to destination →
            </button>
          )}

          <button
            onClick={() => navigate('/links')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#666',
              cursor: 'pointer'
            }}
          >
            Go to Link Saver
          </button>

          {destinationUrl && (
            <p style={{
              fontSize: '11px',
              color: '#999',
              marginTop: '20px',
              maxWidth: '300px',
              textAlign: 'center',
              wordBreak: 'break-all'
            }}>
              Destination: {destinationUrl}
            </p>
          )}
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

export default VanitySavePage;
