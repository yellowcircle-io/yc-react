/**
 * Save Link Page
 *
 * Handles link saving from multiple sources:
 * - URL query parameters (/save?url=...&title=...)
 * - Web Share Target API (PWA sharing)
 * - Direct link input
 *
 * Part of Link Saver feature (Pocket Alternative)
 *
 * @created 2026-01-17
 * @author Sleepless Agent
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Link2, Check, X, Loader2, Tag, FolderOpen, ArrowRight } from 'lucide-react';

// Brand Colors
const COLORS = {
  primary: '#fbbf24',
  primaryDark: '#d4a000',
  text: '#171717',
  textMuted: '#737373',
  white: '#ffffff',
  success: '#22c55e',
  danger: '#ef4444'
};

// API Configuration
const API_BASE = 'https://us-central1-yellowcircle-app.cloudfunctions.net';

/**
 * SaveLinkPage Component
 *
 * Automatically saves links passed via URL params or share target
 */
const SaveLinkPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Form state
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [autoSave, setAutoSave] = useState(false);

  // Extract URL params on mount
  useEffect(() => {
    const urlParam = searchParams.get('url') || searchParams.get('text') || '';
    const titleParam = searchParams.get('title') || '';
    const tagsParam = searchParams.get('tags') || '';
    const autoParam = searchParams.get('auto') === 'true';

    if (urlParam) {
      // Try to extract URL from text (in case of share target)
      const extractedUrl = extractUrl(urlParam);
      setUrl(extractedUrl || urlParam);
      setTitle(titleParam);
      setTags(tagsParam);
      setAutoSave(autoParam);
    }
  }, [searchParams]);

  // Auto-save if param is set (using ref to avoid stale closure)
  useEffect(() => {
    if (autoSave && url && user && status === 'idle') {
      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        handleSave();
      }, 100);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSave, url, user, status]);

  // Extract URL from text (handles share target text)
  const extractUrl = (text) => {
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : null;
  };

  // Save link to API
  const handleSave = async () => {
    if (!url) {
      setStatus('error');
      setMessage('Please enter a URL');
      return;
    }

    if (!user) {
      setStatus('error');
      setMessage('Please sign in to save links');
      return;
    }

    setStatus('loading');
    setMessage('Saving link...');

    try {
      let token;
      try {
        token = await user.getIdToken();
      } catch (authError) {
        console.error('Auth token error:', authError);
        throw new Error('Authentication failed - please sign in again');
      }

      if (!token) {
        throw new Error('No auth token - please sign in again');
      }

      const tagList = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

      const response = await fetch(`${API_BASE}/linkArchiverSaveLink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url,
          title: title || undefined,
          tags: tagList,
          folderId: null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save link');
      }

      const result = await response.json();
      setStatus('success');
      setMessage(result.duplicate ? 'Link already saved!' : 'Link saved successfully!');

      // Redirect after short delay
      setTimeout(() => {
        navigate('/links');
      }, 1500);

    } catch (error) {
      console.error('Save error:', error);
      setStatus('error');
      // Provide more helpful error messages
      let errorMessage = error.message || 'Failed to save link';
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error - please check your connection';
      } else if (error.message?.includes('401') || error.message?.includes('auth')) {
        errorMessage = 'Session expired - please sign in again';
      } else if (error.message?.includes('403')) {
        errorMessage = 'Access denied - please try signing in again';
      }
      setMessage(errorMessage);
    }
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)'
    },
    card: {
      background: COLORS.white,
      borderRadius: '16px',
      padding: '32px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px'
    },
    iconCircle: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: COLORS.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: COLORS.text,
      margin: 0
    },
    subtitle: {
      fontSize: '14px',
      color: COLORS.textMuted,
      margin: 0
    },
    inputGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: COLORS.text,
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '14px',
      border: `1px solid ${COLORS.primary}20`,
      borderRadius: '8px',
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '14px 24px',
      fontSize: '16px',
      fontWeight: '600',
      color: COLORS.text,
      background: COLORS.primary,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background-color 0.2s'
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    status: {
      textAlign: 'center',
      padding: '16px',
      borderRadius: '8px',
      marginTop: '16px'
    },
    statusSuccess: {
      background: `${COLORS.success}15`,
      color: COLORS.success
    },
    statusError: {
      background: `${COLORS.danger}15`,
      color: COLORS.danger
    },
    statusLoading: {
      background: `${COLORS.primary}15`,
      color: COLORS.text
    },
    signInPrompt: {
      textAlign: 'center',
      padding: '24px',
      background: `${COLORS.primary}10`,
      borderRadius: '8px'
    },
    signInButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 24px',
      background: COLORS.primary,
      color: COLORS.text,
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '600',
      marginTop: '12px'
    }
  };

  // Not signed in
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.iconCircle}>
              <Link2 size={24} color={COLORS.text} />
            </div>
            <div>
              <h1 style={styles.title}>Save Link</h1>
              <p style={styles.subtitle}>yellowCircle Link Saver</p>
            </div>
          </div>

          <div style={styles.signInPrompt}>
            <p style={{ margin: 0, color: COLORS.textMuted }}>
              Sign in to save links to your collection
            </p>
            <a href={`/login?redirect=${encodeURIComponent(window.location.href)}`} style={styles.signInButton}>
              Sign In <ArrowRight size={16} />
            </a>
          </div>

          {url && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '12px', color: COLORS.textMuted, wordBreak: 'break-all' }}>
              <strong>Link to save:</strong><br />{url}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <Link2 size={24} color={COLORS.text} />
          </div>
          <div>
            <h1 style={styles.title}>Save Link</h1>
            <p style={styles.subtitle}>yellowCircle Link Saver</p>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            style={styles.input}
            disabled={status === 'loading'}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            style={styles.input}
            disabled={status === 'loading'}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tech, article, read-later"
            style={styles.input}
            disabled={status === 'loading'}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            ...styles.button,
            ...(status === 'loading' ? styles.buttonDisabled : {})
          }}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              Saving...
            </>
          ) : (
            <>
              <Check size={20} />
              Save Link
            </>
          )}
        </button>

        {status !== 'idle' && (
          <div style={{
            ...styles.status,
            ...(status === 'success' ? styles.statusSuccess : {}),
            ...(status === 'error' ? styles.statusError : {}),
            ...(status === 'loading' ? styles.statusLoading : {})
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {status === 'success' && <Check size={20} />}
              {status === 'error' && <X size={20} />}
              {status === 'loading' && <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />}
              {message}
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SaveLinkPage;
