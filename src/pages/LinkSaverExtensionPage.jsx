/**
 * Link Saver Save Tools Page
 *
 * Ways to save links to yellowCircle from anywhere:
 * - Mobile & API (iOS Shortcuts, automation)
 * - Desktop bookmarklet
 *
 * @created 2026-01-18
 * @updated 2026-01-22 - Reordered: Mobile first, Desktop second
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/global/Layout';
import { useLayout } from '../contexts/LayoutContext';
import { useAuth } from '../contexts/AuthContext';
import { navigationItems } from '../config/navigationItems';
import {
  Bookmark,
  Link2,
  Copy,
  Check,
  ArrowLeft,
  Smartphone,
  Monitor,
  Settings,
  ChevronRight,
  Chrome,
  Download,
  ExternalLink,
  Loader2
} from 'lucide-react';

// Firebase Functions base URL
const FUNCTIONS_BASE_URL = import.meta.env.PROD
  ? 'https://us-central1-yellowcircle-app.cloudfunctions.net'
  : 'https://us-central1-yellowcircle-app.cloudfunctions.net';

const COLORS = {
  primary: '#fbbf24',
  primaryDark: '#d4a000',
  text: '#171717',
  textMuted: '#737373',
  white: '#ffffff',
  success: '#22c55e',
  border: 'rgba(0, 0, 0, 0.1)',
  cardBg: '#fafafa'
};

// Bookmarklet code - saves current page to Link Saver (popup version)
const BOOKMARKLET_POPUP = `javascript:(function(){window.open('https://yellowcircle.io/save?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'yc_save','width=500,height=600,left=100,top=100')})()`;

// Bookmarklet code - saves current page (simple redirect - more reliable)
const BOOKMARKLET_REDIRECT = `javascript:location.href='https://yellowcircle.io/save?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title)`;

const LinkSaverExtensionPage = () => {
  const navigate = useNavigate();
  const { layoutConfig } = useLayout();
  const { user, isAdmin } = useAuth();
  const [copiedPopup, setCopiedPopup] = useState(false);
  // Redirect copy state kept for potential future use
  const [_copiedRedirect, _setCopiedRedirect] = useState(false);

  // User's save slug (vanity or save ID)
  const [userSlug, setUserSlug] = useState(null);
  const [loadingSlug, setLoadingSlug] = useState(false);
  const [downloadingShortcut, setDownloadingShortcut] = useState(false);
  // Shortcut status: { signed: boolean, url?: string }
  const [shortcutStatus, setShortcutStatus] = useState(null);

  // Fetch user's vanity slug or save ID when logged in
  useEffect(() => {
    const fetchUserSlug = async () => {
      if (!user) {
        setUserSlug(null);
        setShortcutStatus(null);
        return;
      }

      setLoadingSlug(true);
      try {
        const idToken = await user.getIdToken();

        // Try to get vanity slug first, then fall back to save ID
        const [vanityRes, saveIdRes] = await Promise.all([
          fetch(`${FUNCTIONS_BASE_URL}/getVanitySlug`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${idToken}` }
          }),
          fetch(`${FUNCTIONS_BASE_URL}/linkArchiverGetSaveId`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${idToken}` }
          })
        ]);

        const vanityData = await vanityRes.json();
        const saveIdData = await saveIdRes.json();

        // Prefer vanity slug over save ID
        let slug = null;
        if (vanityData.success && vanityData.hasVanitySlug) {
          slug = vanityData.slug;
        } else if (saveIdData.success && saveIdData.saveId) {
          slug = saveIdData.saveId;
        }

        setUserSlug(slug);

        // Check if pre-signed shortcut exists for this slug
        if (slug) {
          try {
            const statusRes = await fetch(`${FUNCTIONS_BASE_URL}/getShortcutStatus?slug=${encodeURIComponent(slug)}`);
            const statusData = await statusRes.json();
            setShortcutStatus(statusData);
          } catch (statusErr) {
            console.error('Failed to check shortcut status:', statusErr);
            setShortcutStatus({ signed: false });
          }
        }
      } catch (err) {
        console.error('Failed to fetch user slug:', err);
      } finally {
        setLoadingSlug(false);
      }
    };

    fetchUserSlug();
  }, [user]);

  // Universal fallback shortcut URL (prompts for token on first run)
  const UNIVERSAL_SHORTCUT_URL = 'https://firebasestorage.googleapis.com/v0/b/yellowcircle-app.firebasestorage.app/o/shortcuts%2Fsigned%2Funiversal.shortcut?alt=media';

  // Download personalized shortcut (user-specific signed or universal fallback)
  const handleDownloadShortcut = async () => {
    setDownloadingShortcut(true);
    try {
      let downloadUrl;

      // Priority: user-specific signed shortcut > universal fallback
      if (shortcutStatus?.signed && shortcutStatus?.url) {
        // User has a pre-signed personalized shortcut
        downloadUrl = shortcutStatus.url;
      } else {
        // Fallback to universal shortcut (prompts for Save ID on first run)
        downloadUrl = UNIVERSAL_SHORTCUT_URL;
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'Save-to-yellowCircle.shortcut';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download shortcut:', err);
    } finally {
      setTimeout(() => setDownloadingShortcut(false), 1000);
    }
  };

  const handleCopyPopup = () => {
    navigator.clipboard.writeText(BOOKMARKLET_POPUP);
    setCopiedPopup(true);
    setTimeout(() => setCopiedPopup(false), 2000);
  };

  // Redirect copy handler kept for potential future use
  const _handleCopyRedirect = () => {
    navigator.clipboard.writeText(BOOKMARKLET_REDIRECT);
    _setCopiedRedirect(true);
    setTimeout(() => _setCopiedRedirect(false), 2000);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: COLORS.white,
      padding: '100px 40px 40px 120px'
    },
    innerContainer: {
      maxWidth: '700px',
      margin: '0 auto'
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: 'transparent',
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      color: COLORS.text,
      marginBottom: '24px'
    },
    header: {
      marginBottom: '32px',
      textAlign: 'center'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: COLORS.text,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '12px'
    },
    subtitle: {
      fontSize: '16px',
      color: COLORS.textMuted,
      lineHeight: '1.6',
      maxWidth: '500px',
      margin: '0 auto'
    },
    section: {
      backgroundColor: COLORS.cardBg,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '24px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: COLORS.text,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '16px'
    },
    bookmarkletContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px',
      backgroundColor: COLORS.white,
      borderRadius: '12px',
      border: `2px dashed ${COLORS.primary}`,
      marginBottom: '20px'
    },
    bookmarkletButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      padding: '16px 28px',
      backgroundColor: COLORS.primary,
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      color: COLORS.text,
      cursor: 'grab',
      textDecoration: 'none',
      boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)'
    },
    dragHint: {
      marginTop: '12px',
      fontSize: '13px',
      color: COLORS.textMuted,
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    instructions: {
      fontSize: '14px',
      color: COLORS.text,
      lineHeight: '1.8'
    },
    step: {
      display: 'flex',
      gap: '12px',
      marginBottom: '12px',
      alignItems: 'flex-start',
      color: COLORS.text
    },
    stepNumber: {
      width: '24px',
      height: '24px',
      backgroundColor: COLORS.primary,
      color: COLORS.text,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '700',
      flexShrink: 0
    },
    codeBlock: {
      backgroundColor: '#1f2937',
      color: '#f9fafb',
      padding: '14px 16px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      overflow: 'auto',
      marginTop: '12px',
      position: 'relative'
    },
    copyButton: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      padding: '5px 10px',
      backgroundColor: COLORS.primary,
      border: 'none',
      borderRadius: '4px',
      fontSize: '11px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    copyButtonSuccess: {
      backgroundColor: COLORS.success,
      color: COLORS.white
    },
    altOption: {
      padding: '16px',
      backgroundColor: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '10px',
      marginTop: '16px'
    },
    altOptionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: '6px'
    },
    altOptionDesc: {
      fontSize: '13px',
      color: COLORS.textMuted,
      marginBottom: '12px'
    },
    linkCard: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      backgroundColor: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '12px',
      textDecoration: 'none',
      color: COLORS.text,
      transition: 'border-color 0.2s, background-color 0.2s'
    },
    linkCardContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    },
    linkCardIcon: {
      width: '40px',
      height: '40px',
      backgroundColor: '#fef3c7',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    linkCardTitle: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '2px'
    },
    linkCardDesc: {
      fontSize: '12px',
      color: COLORS.textMuted
    }
  };

  return (
    <Layout
      navigationItems={navigationItems}
      layoutConfig={layoutConfig}
      allowScroll={true}
      pageLabel="LINKS"
    >
      {/* Mobile-responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .extension-container {
            padding: 70px 16px 16px 16px !important; /* sidebar hidden on mobile */
          }
        }
        @media (max-width: 480px) {
          .extension-container {
            padding: 70px 12px 12px 12px !important; /* sidebar hidden on mobile */
          }
        }
      `}</style>
      <div style={styles.container} className="extension-container">
        <div style={styles.innerContainer}>
          <button style={styles.backButton} onClick={() => navigate('/links')}>
            <ArrowLeft size={16} /> Back to Link Saver
          </button>

          <div style={styles.header}>
            <h1 style={styles.title}>
              <Bookmark size={32} color={COLORS.primary} />
              Save Tools
            </h1>
            <p style={styles.subtitle}>
              Multiple ways to save links to your collection from any device.
            </p>
          </div>

          {/* Sign-in Note */}
          {!user && (
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#fef3c7',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              <strong>Note:</strong> You'll need to sign in to save links.
            </div>
          )}

          {/* iOS Shortcut Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Smartphone size={20} />
              iOS Share Sheet
            </h2>
            <p style={{ fontSize: '14px', color: COLORS.textMuted, marginBottom: '16px' }}>
              Save links directly from Safari, Twitter, or any app using the iOS Share Sheet.
            </p>

            {/* Quick Steps Overview */}
            <div style={{
              padding: '20px',
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: COLORS.text }}>
                Quick Setup (2 minutes)
              </div>

              <div style={styles.step}>
                <div style={styles.stepNumber}>1</div>
                <div>
                  <strong>Get your Save Token</strong> from{' '}
                  <Link to="/account/settings?tab=api" style={{ color: COLORS.primary, fontWeight: '600' }}>
                    Settings → API Access
                  </Link>
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <div>
                  <strong>Create the Shortcut</strong> — Follow the steps below (takes 2 minutes)
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <div>
                  <strong>Add your Save ID</strong> — Replace YOUR_SAVE_ID in the URL
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNumber}>4</div>
                <div style={{ marginBottom: 0 }}>
                  <strong>Done!</strong> — Share any link → tap "Save to yC"
                </div>
              </div>
            </div>

            {/* Manual Setup - Primary */}
            <details open style={{
              backgroundColor: COLORS.cardBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '16px'
            }}>
              <summary style={{
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: COLORS.text,
                outline: 'none'
              }}>
                📱 Create the Shortcut (2 minutes)
              </summary>
              <div style={{ marginTop: '16px', fontSize: '13px', lineHeight: '1.8', color: COLORS.text }}>
                <p style={{ marginBottom: '12px', color: COLORS.text }}>Create a new shortcut with these actions:</p>
                <ol style={{ margin: '0 0 0 20px', padding: 0, color: COLORS.text }}>
                  <li style={{ marginBottom: '8px' }}>Add <strong>"Receive URLs"</strong> from Share Sheet</li>
                  <li style={{ marginBottom: '8px' }}>Add <strong>"Text"</strong> action with:<br/>
                    <code style={{
                      fontSize: '11px',
                      backgroundColor: '#1f2937',
                      color: '#f9fafb',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginTop: '4px',
                      wordBreak: 'break-all'
                    }}>
                      https://yellowcircle.io/s/YOUR_SAVE_ID/[Shortcut Input]
                    </code>
                    <br/><span style={{ fontSize: '11px', color: '#6b7280' }}>Replace YOUR_SAVE_ID with your Save ID from Settings</span>
                  </li>
                  <li style={{ marginBottom: '8px' }}>Add <strong>"Open URLs"</strong> action</li>
                  <li style={{ marginBottom: '8px' }}>Add <strong>"Show Notification"</strong>: "Link saved!"</li>
                  <li>Enable <strong>"Show in Share Sheet"</strong> in shortcut settings</li>
                </ol>
              </div>
            </details>

            {/* Personalized Download - Primary Option for logged-in users */}
            {user && (
              <div style={{
                padding: '20px',
                backgroundColor: shortcutStatus?.signed ? '#dcfce7' : '#fef3c7',
                border: `2px solid ${shortcutStatus?.signed ? '#22c55e' : COLORS.primary}`,
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: COLORS.text, fontSize: '15px' }}>
                  {shortcutStatus?.signed ? '✅ Signed Shortcut Ready' : '⚡ One-Click Setup'}
                </div>
                {loadingSlug ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted }}>
                    <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Loading your Save ID...
                  </div>
                ) : userSlug ? (
                  <>
                    <div style={{ color: COLORS.text, marginBottom: '12px', fontSize: '13px' }}>
                      {shortcutStatus?.signed ? (
                        <>Your signed shortcut for <strong>yellowcircle.io/s/{userSlug}/</strong> is ready!</>
                      ) : (
                        <>Download a pre-configured shortcut for <strong>yellowcircle.io/s/{userSlug}/</strong></>
                      )}
                    </div>
                    <button
                      onClick={handleDownloadShortcut}
                      disabled={downloadingShortcut}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        backgroundColor: shortcutStatus?.signed ? '#22c55e' : COLORS.primary,
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: shortcutStatus?.signed ? '#fff' : COLORS.text,
                        cursor: downloadingShortcut ? 'wait' : 'pointer',
                        opacity: downloadingShortcut ? 0.7 : 1
                      }}
                    >
                      {downloadingShortcut ? (
                        <>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          {shortcutStatus?.signed ? 'Download My Shortcut' : 'Download Shortcut'}
                        </>
                      )}
                    </button>
                    <p style={{ fontSize: '11px', color: COLORS.textMuted, marginTop: '10px', marginBottom: 0 }}>
                      {shortcutStatus?.signed ? (
                        <>Pre-configured with your Save ID — just tap "Add Shortcut" and you're done!</>
                      ) : (
                        <>
                          On first use, you'll be prompted to enter your Save ID (find it in{' '}
                          <Link to="/account/settings?tab=api" style={{ color: COLORS.primary }}>Settings</Link>).
                        </>
                      )}
                    </p>
                  </>
                ) : (
                  <div style={{ fontSize: '13px', color: COLORS.text }}>
                    You need a Save ID first.{' '}
                    <Link to="/account/settings?tab=api" style={{ color: COLORS.primary, fontWeight: '600' }}>
                      Generate one in Settings →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Style for spinner animation */}
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>

            {/* Mac Users - Download Option (fallback/manual) */}
            <div style={{
              padding: '14px 16px',
              backgroundColor: '#f5f5f4',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '13px'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: COLORS.text }}>
                {user && userSlug ? '📋 Alternative: Manual Setup' : '💻 Mac users:'}
              </div>
              <div style={{ color: COLORS.textMuted, marginBottom: '12px' }}>
                {user && userSlug ? (
                  <>Or download a template and edit manually. Open in Shortcuts app, edit the first "Text" action to change the URL.</>
                ) : (
                  <>
                    Download the shortcut file below, open it in Shortcuts app, then <strong>edit the first "Text" action</strong> to replace "YOUR_SAVE_ID" with your Save ID from{' '}
                    <Link to="/account/settings?tab=api" style={{ color: COLORS.primary }}>Settings</Link>.
                    Then AirDrop to your iPhone or use "File → Share → Copy iCloud Link".
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <a
                  href="/YellowCircle-LinkSaver.shortcut"
                  download="YellowCircle-LinkSaver.shortcut"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: COLORS.text,
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} />
                  Download Template
                </a>
                {isAdmin && (
                  <a
                    href="/YellowCircle-LinkSaver-Admin.shortcut"
                    download="YellowCircle-LinkSaver-Admin.shortcut"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      backgroundColor: '#fef3c7',
                      border: `1px solid ${COLORS.primary}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: COLORS.text,
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={14} />
                    Admin: Pre-configured
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Chrome Extension Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Chrome size={20} />
              Chrome Extension
            </h2>
            <p style={{ fontSize: '14px', color: COLORS.textMuted, marginBottom: '16px' }}>
              Save links with one click, keyboard shortcuts, or right-click menu.
            </p>

            <div style={{
              padding: '20px',
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Chrome size={24} color={COLORS.text} />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px', color: COLORS.text }}>
                    yellowCircle Link Saver
                  </div>
                  <div style={{ fontSize: '13px', color: COLORS.textMuted }}>
                    Chrome Extension • Developer Mode
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '14px', marginBottom: '16px', color: COLORS.text }}>
                <strong>Features:</strong>
                <ul style={{ margin: '8px 0 0 20px', lineHeight: '1.8', color: COLORS.text }}>
                  <li>Click extension icon to save current page</li>
                  <li><code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: COLORS.text }}>Alt+S</code> — Quick save (no popup)</li>
                  <li><code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: COLORS.text }}>Alt+Shift+S</code> — Open popup with tags</li>
                  <li>Right-click on any link → Save to yellowCircle</li>
                </ul>
              </div>

              <div style={{
                padding: '14px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                color: COLORS.text
              }}>
                <strong>Note:</strong> This extension requires Developer Mode.
                Chrome Web Store version coming soon.
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href="/chrome-extension.zip"
                  download
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    backgroundColor: COLORS.primary,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: COLORS.text,
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={16} />
                  Download Extension
                </a>
                <a
                  href="/chrome-extension/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: COLORS.text,
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink size={16} />
                  Full Documentation
                </a>
              </div>
            </div>

            <div style={styles.instructions}>
              <div style={styles.step}>
                <div style={styles.stepNumber}>1</div>
                <div>Download and unzip the extension</div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <div>Go to <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: COLORS.text }}>chrome://extensions</code> and enable <strong>Developer mode</strong></div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <div>Click <strong>Load unpacked</strong> and select the unzipped folder</div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>4</div>
                <div>Click the extension icon and enter your <Link to="/account/settings?tab=api" style={{ color: COLORS.primary }}>API token</Link></div>
              </div>
            </div>
          </div>

          {/* Desktop Bookmarklet Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Monitor size={20} />
              Desktop Bookmarklet
            </h2>
            <p style={{ fontSize: '14px', color: COLORS.textMuted, marginBottom: '16px' }}>
              Works in any browser — Firefox, Safari, Edge, and more. No extension required.
            </p>

            <div style={styles.bookmarkletContainer}>
              <a
                href={BOOKMARKLET_POPUP}
                style={styles.bookmarkletButton}
                onClick={(e) => e.preventDefault()}
                draggable="true"
              >
                <Link2 size={20} />
                Save to yellowCircle
              </a>
              <div style={styles.dragHint}>
                <span>↑</span> Drag this button to your bookmarks bar
              </div>
            </div>

            <div style={styles.instructions}>
              <div style={styles.step}>
                <div style={styles.stepNumber}>1</div>
                <div>Show your bookmarks bar (<strong>Cmd+Shift+B</strong> on Mac, <strong>Ctrl+Shift+B</strong> on Windows)</div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <div>Drag the yellow button above to your bookmarks bar</div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <div>When you find a page to save, click the bookmark</div>
              </div>
            </div>

            {/* Alternative: Full Page Redirect */}
            <div style={styles.altOption}>
              <div style={styles.altOptionTitle}>Popup blocked?</div>
              <div style={styles.altOptionDesc}>
                If your browser blocks popups, use this version instead:
              </div>
              <a
                href={BOOKMARKLET_REDIRECT}
                style={{...styles.bookmarkletButton, backgroundColor: '#e5e7eb', boxShadow: 'none', padding: '12px 20px', fontSize: '14px'}}
                onClick={(e) => e.preventDefault()}
                draggable="true"
              >
                <Link2 size={16} />
                Save (Full Page)
              </a>
            </div>

            {/* Code for manual setup */}
            <div style={styles.codeBlock}>
              <button
                style={{...styles.copyButton, ...(copiedPopup ? styles.copyButtonSuccess : {})}}
                onClick={handleCopyPopup}
              >
                {copiedPopup ? <Check size={12} /> : <Copy size={12} />}
                {copiedPopup ? 'Copied!' : 'Copy'}
              </button>
              <code style={{ wordBreak: 'break-all', paddingRight: '70px', display: 'block' }}>{BOOKMARKLET_POPUP}</code>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LinkSaverExtensionPage;
