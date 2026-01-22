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

import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';

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
  const { user } = useAuth();
  const [copiedPopup, setCopiedPopup] = useState(false);
  // Redirect copy state kept for potential future use
  const [_copiedRedirect, _setCopiedRedirect] = useState(false);

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
      alignItems: 'flex-start'
    },
    stepNumber: {
      width: '24px',
      height: '24px',
      backgroundColor: COLORS.primary,
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
            padding: 70px 16px 16px 90px !important;
          }
        }
        @media (max-width: 480px) {
          .extension-container {
            padding: 70px 12px 12px 70px !important;
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
                  <strong>Download the Shortcut</strong> — One-tap install (iCloud link below)
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <div>
                  <strong>Add your Token</strong> — Paste when prompted during setup
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNumber}>4</div>
                <div style={{ marginBottom: 0 }}>
                  <strong>Done!</strong> — Share any link → tap "Save to yC"
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div style={{
              padding: '20px',
              backgroundColor: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '12px' }}>
                📱 Get the iOS Shortcut
              </div>
              <a
                href="/YellowCircle-LinkSaver.shortcut"
                download="YellowCircle-LinkSaver.shortcut"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  backgroundColor: COLORS.primary,
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: COLORS.text,
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <Download size={18} />
                Download Shortcut
              </a>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>
                Open on iPhone/iPad to add to Shortcuts • iOS 13+
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
                First run prompts for your <strong>Save ID</strong> (from Settings → API Access)
              </div>
            </div>

            {/* Manual Setup Accordion */}
            <details style={{
              backgroundColor: COLORS.cardBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              padding: '14px 16px'
            }}>
              <summary style={{
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: COLORS.text,
                outline: 'none'
              }}>
                Manual Setup (if link doesn't work)
              </summary>
              <div style={{ marginTop: '16px', fontSize: '13px', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '12px' }}>Create a new shortcut with these actions:</p>
                <ol style={{ margin: '0 0 0 20px', padding: 0 }}>
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
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>
                    yellowCircle Link Saver
                  </div>
                  <div style={{ fontSize: '13px', color: COLORS.textMuted }}>
                    Chrome Extension • Developer Mode
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                <strong>Features:</strong>
                <ul style={{ margin: '8px 0 0 20px', lineHeight: '1.8' }}>
                  <li>Click extension icon to save current page</li>
                  <li><code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>Alt+S</code> — Quick save (no popup)</li>
                  <li><code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>Alt+Shift+S</code> — Open popup with tags</li>
                  <li>Right-click on any link → Save to yellowCircle</li>
                </ul>
              </div>

              <div style={{
                padding: '14px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px'
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
                <div>Go to <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>chrome://extensions</code> and enable <strong>Developer mode</strong></div>
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
