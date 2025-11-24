import React, { useState } from 'react';
import { COLORS, EFFECTS } from '../styles/constants';

/**
 * Share Button Component
 * Native Web Share API (mobile) + Copy link fallback (desktop)
 * Social share presets (Twitter, LinkedIn)
 *
 * Features:
 * - Floating button (mobile: bottom-left, desktop: top-right)
 * - Web Share API support detection
 * - Copy to clipboard with success toast
 * - Pre-filled social share text
 * - Touch-optimized for mobile
 */

function ShareButton({ title, url, text }) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Use current page URL if not provided (safe for SSR)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Default share text
  const shareText = text || `Why Your GTM Sucks: The Human Cost of Operations Theater - A @yellowCircle perspective on fixing marketing ops chaos`;

  // Check if Web Share API is available (safe for SSR)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share !== 'undefined';

  // Initialize mobile state on mount
  React.useEffect(() => {
    setIsMobile(window.innerWidth <= 800);
  }, []);

  const handleNativeShare = async () => {
    if (canShare) {
      try {
        await navigator.share({
          title: title || 'Why Your GTM Sucks',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled:', err);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };

  const handleButtonClick = () => {
    if (canShare && isMobile) {
      handleNativeShare();
    } else {
      setShowMenu(!showMenu);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 998 }}>
      {/* Share Button */}
      <button
        onClick={handleButtonClick}
        style={{
          position: 'fixed',
          bottom: isMobile ? '80px' : 'auto',
          top: isMobile ? 'auto' : '20px',
          left: isMobile ? '20px' : 'auto',
          right: isMobile ? 'auto' : '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: COLORS.yellow,
          color: COLORS.black,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: '600',
          boxShadow: EFFECTS.shadow.yellow,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'scale(0.9)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="Share article"
      >
        {canShare && isMobile ? '↗' : '⋮'}
      </button>

      {/* Share Menu (Desktop/Fallback) */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 997
            }}
          />

          {/* Menu */}
          <div
            style={{
              position: 'fixed',
              top: isMobile ? 'auto' : '80px',
              bottom: isMobile ? '140px' : 'auto',
              left: isMobile ? '20px' : 'auto',
              right: isMobile ? 'auto' : '20px',
              backgroundColor: COLORS.white,
              borderRadius: '12px',
              boxShadow: EFFECTS.shadow.lg,
              padding: '12px',
              minWidth: '200px',
              animation: 'fadeIn 0.2s ease',
              zIndex: 999
            }}
          >
            <button
              onClick={handleCopyLink}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: copied ? COLORS.success : 'transparent',
                color: copied ? COLORS.white : COLORS.black,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '8px',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!copied) e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                if (!copied) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </button>

            <button
              onClick={handleTwitterShare}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                color: COLORS.black,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '8px',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              𝕏 Share on Twitter
            </button>

            <button
              onClick={handleLinkedInShare}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                color: COLORS.black,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              in Share on LinkedIn
            </button>
          </div>
        </>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

export default ShareButton;
