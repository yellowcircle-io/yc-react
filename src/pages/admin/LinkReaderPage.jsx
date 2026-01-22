import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Clock,
  Calendar,
  Tag,
  Share2,
  ChevronUp,
  WifiOff,
  Wifi
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getLink, updateReadProgress, toggleStar, archiveLink } from '../../utils/firestoreLinks';
import { getOfflineLink, updateReadingProgress as updateOfflineProgress } from '../../utils/offlineStorage';
import { useNetworkStatus } from '../../hooks/useOfflineStatus';

const COLORS = {
  primary: '#fbbf24',
  text: '#1a1a1a',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  background: '#ffffff',
  backgroundDark: '#1a1a1a',
  textDark: '#f3f4f6',
  textSecondaryDark: '#9ca3af',
  borderDark: '#374151'
};

const FONT_SIZES = [14, 16, 18, 20, 22, 24];
const DEFAULT_FONT_SIZE_INDEX = 2; // 18px

function LinkReaderPage() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReadingOffline, setIsReadingOffline] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('readerDarkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [fontSizeIndex, setFontSizeIndex] = useState(() => {
    const saved = localStorage.getItem('readerFontSize');
    return saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE_INDEX;
  });
  const [readProgress, setReadProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const contentRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastSaveRef = useRef(0);

  // Fetch link data - check offline storage first, then Firestore
  useEffect(() => {
    const fetchLink = async () => {
      if (!linkId) {
        setError('No link ID provided');
        setLoading(false);
        return;
      }

      try {
        // First, try to get from IndexedDB (offline storage)
        const offlineLink = await getOfflineLink(linkId);

        // If offline or we have cached content, use it
        if (!isOnline && offlineLink) {
          console.log('[Reader] Using offline cached content');
          setLink(offlineLink);
          setReadProgress(offlineLink.readingProgress || 0);
          setIsReadingOffline(true);
          startTimeRef.current = Date.now();
          setLoading(false);
          return;
        }

        // Try to fetch from Firestore
        let linkData = null;
        try {
          linkData = await getLink(linkId);
        } catch (fetchErr) {
          // If fetch fails and we have offline data, use it
          if (offlineLink) {
            console.log('[Reader] Network error, using offline cached content');
            setLink(offlineLink);
            setReadProgress(offlineLink.readingProgress || 0);
            setIsReadingOffline(true);
            startTimeRef.current = Date.now();
            setLoading(false);
            return;
          }
          throw fetchErr;
        }

        if (!linkData) {
          // If not in Firestore but we have offline copy, use that
          if (offlineLink) {
            console.log('[Reader] Not in Firestore, using offline cached content');
            setLink(offlineLink);
            setReadProgress(offlineLink.readingProgress || 0);
            setIsReadingOffline(true);
            startTimeRef.current = Date.now();
            setLoading(false);
            return;
          }
          setError('Link not found');
          setLoading(false);
          return;
        }

        // Check access - user must own the link or have it shared with them
        if (user) {
          const isOwner = linkData.userId === user.uid;
          const isSharedWithUser = linkData.sharedWithUserIds?.includes(user.uid);
          const isSharedWithEmail = linkData.sharedWithEmails?.includes(user.email);

          if (!isOwner && !isSharedWithUser && !isSharedWithEmail) {
            setError('You do not have access to this link');
            setLoading(false);
            return;
          }
        }

        setLink(linkData);
        setReadProgress(linkData.readProgress || 0);
        setIsReadingOffline(false);
        startTimeRef.current = Date.now();
      } catch (err) {
        console.error('Error fetching link:', err);
        setError(isOnline ? 'Failed to load link' : 'No offline version available');
      } finally {
        setLoading(false);
      }
    };

    fetchLink();
  }, [linkId, user, isOnline]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('readerDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('readerFontSize', fontSizeIndex.toString());
  }, [fontSizeIndex]);

  // Enable scrolling on body (override global overflow: hidden) and hide scrollbar
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';

    // Hide scrollbar but keep functionality
    const style = document.createElement('style');
    style.id = 'reader-scrollbar-hide';
    style.textContent = `
      html, body { -ms-overflow-style: none; scrollbar-width: none; }
      html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
      *::-webkit-scrollbar { width: 0; height: 0; }
    `;
    document.head.appendChild(style);

    return () => {
      // Reset to default on unmount
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      const styleEl = document.getElementById('reader-scrollbar-hide');
      if (styleEl) styleEl.remove();
    };
  }, []);

  // Track scroll progress
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    const scrollTop = window.scrollY;
    const docHeight = element.scrollHeight;
    const winHeight = window.innerHeight;
    const scrollPercent = scrollTop / (docHeight - winHeight);
    const progress = Math.min(1, Math.max(0, scrollPercent));

    setReadProgress(progress);
    setShowScrollTop(scrollTop > 500);

    // Save progress periodically (every 10 seconds or when progress changes significantly)
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveRef.current;

    if (timeSinceLastSave > 10000 && user && link?.userId === user.uid) {
      const timeSpent = Math.floor((now - startTimeRef.current) / 1000);

      // Save to Firestore if online, save to IndexedDB for offline links
      if (isOnline && !isReadingOffline) {
        updateReadProgress(linkId, progress, timeSpent).catch(console.error);
      }

      // Always update IndexedDB if reading from offline cache
      if (isReadingOffline) {
        updateOfflineProgress(linkId, Math.round(progress * 100)).catch(console.error);
      }

      lastSaveRef.current = now;
      startTimeRef.current = now; // Reset for next interval
    }
  }, [linkId, user, link, isOnline, isReadingOffline]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (user && link?.userId === user.uid && startTimeRef.current) {
        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        updateReadProgress(linkId, readProgress, timeSpent).catch(console.error);
      }
    };
  }, [linkId, user, link, readProgress]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStar = async () => {
    if (!user || link.userId !== user.uid) return;

    try {
      await toggleStar(linkId, !link.starred);
      setLink(prev => ({ ...prev, starred: !prev.starred }));
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  const handleArchive = async () => {
    if (!user || link.userId !== user.uid) return;

    try {
      await archiveLink(linkId, !link.archived);
      setLink(prev => ({ ...prev, archived: !prev.archived }));
    } catch (err) {
      console.error('Error archiving:', err);
    }
  };

  const fontSize = FONT_SIZES[fontSizeIndex];

  const theme = darkMode ? {
    bg: COLORS.backgroundDark,
    text: COLORS.textDark,
    textSecondary: COLORS.textSecondaryDark,
    border: COLORS.borderDark,
    cardBg: '#262626'
  } : {
    bg: COLORS.background,
    text: COLORS.text,
    textSecondary: COLORS.textSecondary,
    border: COLORS.border,
    cardBg: '#f9fafb'
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: theme.bg,
      color: theme.text,
      transition: 'background-color 0.3s, color 0.3s'
    },
    progressBar: {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '3px',
      backgroundColor: COLORS.primary,
      width: `${readProgress * 100}%`,
      zIndex: 1000,
      transition: 'width 0.1s'
    },
    header: {
      position: 'sticky',
      top: 0,
      backgroundColor: theme.bg,
      borderBottom: `1px solid ${theme.border}`,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      zIndex: 100
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 14px',
      backgroundColor: darkMode ? '#2d2d2d' : '#f3f4f6',
      border: `1px solid ${darkMode ? '#404040' : '#d1d5db'}`,
      borderRadius: '8px',
      color: theme.text,
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s, transform 0.15s',
      boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
    },
    iconButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      backgroundColor: darkMode ? '#2d2d2d' : '#f3f4f6',
      border: `1px solid ${darkMode ? '#404040' : '#d1d5db'}`,
      borderRadius: '8px',
      color: theme.text,
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.15s',
      boxShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
    },
    fontSizeControl: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px',
      backgroundColor: theme.cardBg,
      borderRadius: '8px'
    },
    content: {
      maxWidth: '720px',
      margin: '0 auto',
      padding: '40px 24px 120px'
    },
    meta: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      lineHeight: '1.3',
      marginBottom: '16px',
      color: theme.text
    },
    metaRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      alignItems: 'center',
      color: theme.textSecondary,
      fontSize: '14px',
      marginBottom: '12px'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    sourceLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      color: COLORS.primary,
      textDecoration: 'none',
      fontSize: '14px'
    },
    tags: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '16px'
    },
    tag: {
      padding: '4px 10px',
      backgroundColor: theme.cardBg,
      borderRadius: '16px',
      fontSize: '12px',
      color: theme.textSecondary
    },
    summary: {
      padding: '20px',
      backgroundColor: theme.cardBg,
      borderRadius: '12px',
      marginBottom: '32px',
      borderLeft: `4px solid ${COLORS.primary}`
    },
    summaryTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    summaryText: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: theme.text
    },
    article: {
      fontSize: `${fontSize}px`,
      lineHeight: '1.9',
      color: theme.text,
      wordBreak: 'break-word'
    },
    // Rich HTML article styling
    articleHtml: {
      fontSize: `${fontSize}px`,
      lineHeight: '1.9',
      color: theme.text,
      wordBreak: 'break-word'
    },
    paragraph: {
      marginBottom: '1.5em',
      textAlign: 'left'
    },
    noContent: {
      textAlign: 'center',
      padding: '60px 20px',
      color: theme.textSecondary
    },
    noContentIcon: {
      marginBottom: '16px',
      opacity: 0.5
    },
    scrollTopButton: {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: COLORS.primary,
      color: COLORS.text,
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      opacity: showScrollTop ? 1 : 0,
      pointerEvents: showScrollTop ? 'auto' : 'none',
      transition: 'opacity 0.3s'
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: theme.bg
    },
    loadingSpinner: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      border: `3px solid ${theme.border}`,
      borderTopColor: COLORS.primary,
      animation: 'spin 1s linear infinite'
    },
    errorContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: theme.bg,
      padding: '24px',
      textAlign: 'center'
    },
    errorText: {
      fontSize: '18px',
      color: theme.textSecondary,
      marginBottom: '24px'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      marginLeft: '16px',
      paddingLeft: '16px',
      borderLeft: `1px solid ${theme.border}`
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <BookOpen size={48} color={darkMode ? '#9ca3af' : '#6b7280'} strokeWidth={1.5} style={{ marginBottom: '16px' }} />
        <p style={styles.errorText}>{error}</p>
        <button
          style={styles.backButton}
          onClick={() => navigate('/links')}
        >
          <ArrowLeft size={16} color={darkMode ? '#f3f4f6' : '#1a1a1a'} strokeWidth={2} />
          Back to Links
        </button>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOwner = user && link.userId === user.uid;

  // Format content into readable paragraphs
  const formatContent = (content) => {
    if (!content) return null;

    // First, try to split by double newlines (proper paragraph breaks)
    let paragraphs = content
      .split(/\n\s*\n|\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // If we have good paragraph breaks, use them
    if (paragraphs.length > 1) {
      return paragraphs.map((para, i) => (
        <p key={i} style={styles.paragraph}>
          {para}
        </p>
      ));
    }

    // Try single newlines
    const singleLineParagraphs = content
      .split(/\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (singleLineParagraphs.length > 1) {
      return singleLineParagraphs.map((para, i) => (
        <p key={i} style={styles.paragraph}>
          {para}
        </p>
      ));
    }

    // No natural breaks found - intelligently split long content
    // This handles legacy content that was saved without paragraph breaks
    if (content.length > 300) {
      // Strategy: Split at sentence boundaries where patterns indicate new paragraphs
      // Common patterns:
      // 1. Period followed by space and capital letter: ". A"
      // 2. Question mark or exclamation followed by space and capital
      // 3. Period followed by quote and capital: "." A
      // 4. Numbers/dates that start new sections

      // First, identify potential heading patterns (short sentences that might be headers)
      const headingPattern = /^[A-Z][^.!?]{5,50}[.!?]?\s*$/;

      // Split on sentence boundaries
      const sentences = content.split(/(?<=[.!?])\s+(?=[A-Z])/);

      if (sentences.length > 1) {
        // Group sentences into paragraphs (3-5 sentences per paragraph)
        const SENTENCES_PER_PARAGRAPH = 4;
        const resultParagraphs = [];
        let currentParagraph = [];

        sentences.forEach((sentence, _idx) => {
          const trimmed = sentence.trim();
          if (!trimmed) return;

          // Check if this might be a heading (short, capitalized)
          const isHeading = headingPattern.test(trimmed) && trimmed.length < 60;

          // Start new paragraph if:
          // 1. Current paragraph is full
          // 2. This sentence looks like a heading
          // 3. Previous was a heading
          if (currentParagraph.length >= SENTENCES_PER_PARAGRAPH ||
              (isHeading && currentParagraph.length > 0)) {
            resultParagraphs.push(currentParagraph.join(' '));
            currentParagraph = [];
          }

          currentParagraph.push(trimmed);

          // If this was a heading, also end the paragraph
          if (isHeading) {
            resultParagraphs.push(currentParagraph.join(' '));
            currentParagraph = [];
          }
        });

        // Don't forget the last paragraph
        if (currentParagraph.length > 0) {
          resultParagraphs.push(currentParagraph.join(' '));
        }

        if (resultParagraphs.length > 1) {
          return resultParagraphs.map((para, i) => (
            <p key={i} style={styles.paragraph}>
              {para}
            </p>
          ));
        }
      }

      // Last resort: split every ~500 characters at sentence boundaries
      const chunks = [];
      let remaining = content;
      const CHUNK_SIZE = 500;

      while (remaining.length > 0) {
        if (remaining.length <= CHUNK_SIZE) {
          chunks.push(remaining.trim());
          break;
        }

        // Find a good break point (sentence end) near CHUNK_SIZE
        let breakPoint = CHUNK_SIZE;
        const searchRange = remaining.substring(CHUNK_SIZE - 100, CHUNK_SIZE + 100);
        const sentenceEnd = searchRange.search(/[.!?]\s+/);

        if (sentenceEnd > -1) {
          breakPoint = CHUNK_SIZE - 100 + sentenceEnd + 2;
        }

        chunks.push(remaining.substring(0, breakPoint).trim());
        remaining = remaining.substring(breakPoint).trim();
      }

      return chunks.map((para, i) => (
        <p key={i} style={styles.paragraph}>
          {para}
        </p>
      ));
    }

    // Short content - just return as single paragraph
    return (
      <p style={styles.paragraph}>
        {content}
      </p>
    );
  };

  return (
    <div style={styles.container} ref={contentRef}>
      <div style={styles.progressBar} />

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            style={styles.backButton}
            onClick={() => navigate('/links')}
          >
            <ArrowLeft size={16} color={darkMode ? '#f3f4f6' : '#1a1a1a'} strokeWidth={2} />
            Back
          </button>

          <span style={{ color: theme.textSecondary, fontSize: '14px' }}>
            {Math.round(readProgress * 100)}% read
          </span>

          {/* Offline/Online indicator */}
          {isReadingOffline && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                fontSize: '12px',
                fontWeight: '500'
              }}
              title="Reading from offline cache"
            >
              <WifiOff size={12} />
              Offline
            </span>
          )}
          {!isOnline && !isReadingOffline && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: '500'
              }}
              title="You are offline"
            >
              <WifiOff size={12} />
              No Connection
            </span>
          )}
        </div>

        <div style={styles.headerRight}>
          {/* Font size controls */}
          <div style={styles.fontSizeControl}>
            <button
              style={{
                ...styles.iconButton,
                border: 'none',
                width: '32px',
                height: '32px',
                opacity: fontSizeIndex === 0 ? 0.5 : 1
              }}
              onClick={() => setFontSizeIndex(Math.max(0, fontSizeIndex - 1))}
              disabled={fontSizeIndex === 0}
              title="Decrease font size"
            >
              <span style={{ color: darkMode ? '#f3f4f6' : '#1a1a1a', fontSize: '16px', fontWeight: 'bold', lineHeight: 1 }}>−</span>
            </button>
            <span style={{ fontSize: '12px', padding: '0 8px', color: theme.textSecondary }}>
              {fontSize}px
            </span>
            <button
              style={{
                ...styles.iconButton,
                border: 'none',
                width: '32px',
                height: '32px',
                opacity: fontSizeIndex === FONT_SIZES.length - 1 ? 0.5 : 1
              }}
              onClick={() => setFontSizeIndex(Math.min(FONT_SIZES.length - 1, fontSizeIndex + 1))}
              disabled={fontSizeIndex === FONT_SIZES.length - 1}
              title="Increase font size"
            >
              <span style={{ color: darkMode ? '#f3f4f6' : '#1a1a1a', fontSize: '16px', fontWeight: 'bold', lineHeight: 1 }}>+</span>
            </button>
          </div>

          {/* Dark mode toggle */}
          <button
            style={styles.iconButton}
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span style={{ fontSize: '16px' }}>{darkMode ? '☀' : '☾'}</span>
          </button>

          {/* Action buttons for owners */}
          {isOwner && (
            <div style={styles.actionButtons}>
              <button
                style={styles.iconButton}
                onClick={handleToggleStar}
                title={link.starred ? 'Unstar' : 'Star'}
              >
                <span style={{ fontSize: '16px', color: link.starred ? COLORS.primary : (darkMode ? '#f3f4f6' : '#1a1a1a') }}>{link.starred ? '★' : '☆'}</span>
              </button>

              <button
                style={styles.iconButton}
                onClick={handleArchive}
                title={link.archived ? 'Unarchive' : 'Archive'}
              >
                <span style={{ fontSize: '14px', color: link.archived ? COLORS.primary : (darkMode ? '#f3f4f6' : '#1a1a1a'), display: 'flex', alignItems: 'center', gap: '1px' }}>
                  {link.archived ? <><span style={{ fontSize: '12px' }}>📄</span><span style={{ fontSize: '10px' }}>↓</span></> : <><span style={{ fontSize: '12px' }}>📄</span><span style={{ fontSize: '10px' }}>✕</span></>}
                </span>
              </button>
            </div>
          )}

          {/* External link */}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.iconButton}
            title="Open original"
          >
            <ExternalLink size={18} color={darkMode ? '#f3f4f6' : '#1a1a1a'} strokeWidth={2} />
          </a>
        </div>
      </header>

      <main style={styles.content}>
        <div style={styles.meta}>
          <h1 style={styles.title}>{link.title || 'Untitled'}</h1>

          <div style={styles.metaRow}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.sourceLink}
            >
              {link.domain || new URL(link.url).hostname}
              <ExternalLink size={12} color={COLORS.primary} strokeWidth={2} />
            </a>

            {link.savedAt && (
              <span style={styles.metaItem}>
                <Calendar size={14} color={darkMode ? '#9ca3af' : '#6b7280'} strokeWidth={2} />
                Saved {formatDate(link.savedAt)}
              </span>
            )}

            {link.estimatedReadTime > 0 && (
              <span style={styles.metaItem}>
                <Clock size={14} color={darkMode ? '#9ca3af' : '#6b7280'} strokeWidth={2} />
                {Math.min(60, Math.ceil(link.estimatedReadTime / 60))} min read
              </span>
            )}

            {(link.sharedWith?.length > 0 || link.sharedWithUserIds?.length > 0) && (
              <span style={styles.metaItem}>
                <Share2 size={14} color={darkMode ? '#9ca3af' : '#6b7280'} strokeWidth={2} />
                Shared
              </span>
            )}
          </div>

          {link.tags && link.tags.length > 0 && (
            <div style={styles.tags}>
              {link.tags.map((tag, i) => (
                <span key={i} style={styles.tag}>
                  <Tag size={10} color={darkMode ? '#9ca3af' : '#6b7280'} strokeWidth={2} style={{ marginRight: '4px' }} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Summary */}
        {link.aiSummary && (
          <div style={styles.summary}>
            <div style={styles.summaryTitle}>AI Summary</div>
            <p style={styles.summaryText}>{link.aiSummary}</p>
          </div>
        )}

        {/* Article Content - prefer HTML, fallback to plain text */}
        {link.contentHtml ? (
          <>
            <style>{`
              .reader-article-html {
                font-size: ${fontSize}px;
                line-height: 1.9;
                color: ${theme.text};
                word-break: break-word;
              }
              .reader-article-html p {
                margin-bottom: 1.5em;
              }
              .reader-article-html h1, .reader-article-html h2, .reader-article-html h3,
              .reader-article-html h4, .reader-article-html h5, .reader-article-html h6 {
                margin-top: 1.5em;
                margin-bottom: 0.75em;
                font-weight: 600;
                line-height: 1.3;
              }
              .reader-article-html h1 { font-size: 1.8em; }
              .reader-article-html h2 { font-size: 1.5em; }
              .reader-article-html h3 { font-size: 1.25em; }
              .reader-article-html img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                margin: 1.5em 0;
                display: block;
              }
              .reader-article-html a {
                color: ${COLORS.primary};
                text-decoration: underline;
              }
              .reader-article-html a:hover {
                opacity: 0.8;
              }
              .reader-article-html blockquote {
                border-left: 4px solid ${COLORS.primary};
                padding-left: 1em;
                margin: 1.5em 0;
                font-style: italic;
                color: ${theme.textSecondary};
              }
              .reader-article-html ul, .reader-article-html ol {
                margin: 1em 0;
                padding-left: 2em;
              }
              .reader-article-html li {
                margin-bottom: 0.5em;
              }
              .reader-article-html pre, .reader-article-html code {
                background-color: ${darkMode ? '#2d2d2d' : '#f3f4f6'};
                border-radius: 4px;
                font-family: 'SF Mono', Consolas, monospace;
                font-size: 0.9em;
              }
              .reader-article-html pre {
                padding: 1em;
                overflow-x: auto;
                margin: 1.5em 0;
              }
              .reader-article-html code {
                padding: 0.2em 0.4em;
              }
              .reader-article-html figure {
                margin: 1.5em 0;
              }
              .reader-article-html figcaption {
                font-size: 0.9em;
                color: ${theme.textSecondary};
                text-align: center;
                margin-top: 0.5em;
              }
              .reader-article-html table {
                width: 100%;
                border-collapse: collapse;
                margin: 1.5em 0;
              }
              .reader-article-html th, .reader-article-html td {
                border: 1px solid ${theme.border};
                padding: 0.75em;
                text-align: left;
              }
              .reader-article-html th {
                background-color: ${darkMode ? '#2d2d2d' : '#f3f4f6'};
                font-weight: 600;
              }
            `}</style>
            <article
              className="reader-article-html"
              dangerouslySetInnerHTML={{ __html: link.contentHtml }}
            />
          </>
        ) : link.content ? (
          <article style={styles.article}>
            {formatContent(link.content)}
          </article>
        ) : (
          <div style={styles.noContent}>
            <BookOpen size={48} color={darkMode ? '#9ca3af' : '#6b7280'} strokeWidth={1.5} style={styles.noContentIcon} />
            <p>No content available for this link.</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.sourceLink}
              >
                View original article
                <ExternalLink size={12} color={COLORS.primary} strokeWidth={2} />
              </a>
            </p>
          </div>
        )}
      </main>

      {/* Scroll to top button */}
      <button
        style={styles.scrollTopButton}
        onClick={scrollToTop}
        title="Scroll to top"
      >
        <ChevronUp size={24} color={COLORS.text} strokeWidth={2} />
      </button>
    </div>
  );
}

export default LinkReaderPage;
