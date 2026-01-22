/**
 * Link Saver Extension Page
 *
 * Provides bookmarklet and instructions for saving links
 * from any webpage to yellowCircle Link Saver.
 *
 * @created 2026-01-18
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Share2,
  ExternalLink,
  MessageSquare,
  Code,
  Zap
} from 'lucide-react';

const COLORS = {
  primary: '#fbbf24',
  primaryDark: '#d4a000',
  text: '#171717',
  textMuted: '#737373',
  white: '#ffffff',
  success: '#22c55e',
  border: 'rgba(0, 0, 0, 0.1)'
};

// Bookmarklet code - saves current page to Link Saver (popup version)
const BOOKMARKLET_POPUP = `javascript:(function(){window.open('https://yellowcircle.co/save?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'yc_save','width=500,height=600,left=100,top=100')})()`;

// Bookmarklet code - saves current page (simple redirect - more reliable)
const BOOKMARKLET_REDIRECT = `javascript:location.href='https://yellowcircle.co/save?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title)`;

// URL save endpoint format
const URL_SAVE_ENDPOINT = 'https://yellowcircle.co/save?url=YOUR_URL&title=YOUR_TITLE&tags=tag1,tag2';

const LinkSaverExtensionPage = () => {
  const navigate = useNavigate();
  const { layoutConfig } = useLayout();
  const { user } = useAuth();
  const [copiedPopup, setCopiedPopup] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(URL_SAVE_ENDPOINT);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyPopup = () => {
    navigator.clipboard.writeText(BOOKMARKLET_POPUP);
    setCopiedPopup(true);
    setTimeout(() => setCopiedPopup(false), 2000);
  };

  const handleCopyRedirect = () => {
    navigator.clipboard.writeText(BOOKMARKLET_REDIRECT);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: COLORS.white,
      padding: '100px 40px 40px 120px'
    },
    innerContainer: {
      maxWidth: '800px',
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
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: COLORS.text,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '16px',
      color: COLORS.textMuted,
      lineHeight: '1.6'
    },
    section: {
      backgroundColor: '#fafafa',
      border: `1px solid ${COLORS.border}`,
      borderRadius: '16px',
      padding: '24px',
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
    bookmarkletButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '14px 24px',
      backgroundColor: COLORS.primary,
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      color: COLORS.text,
      cursor: 'grab',
      textDecoration: 'none',
      marginRight: '12px',
      marginBottom: '12px'
    },
    instructions: {
      fontSize: '14px',
      color: COLORS.textMuted,
      lineHeight: '1.8',
      marginTop: '16px'
    },
    step: {
      display: 'flex',
      gap: '12px',
      marginBottom: '12px'
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
      padding: '16px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      overflow: 'auto',
      marginTop: '16px',
      position: 'relative'
    },
    copyButton: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      padding: '6px 12px',
      backgroundColor: COLORS.primary,
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    copyButtonSuccess: {
      backgroundColor: COLORS.success
    },
    methodCard: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
      padding: '16px',
      backgroundColor: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '12px',
      marginBottom: '12px'
    },
    methodIcon: {
      width: '40px',
      height: '40px',
      backgroundColor: '#fef3c7',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    methodTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: '4px'
    },
    methodDesc: {
      fontSize: '13px',
      color: COLORS.textMuted,
      lineHeight: '1.5'
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
            padding: 70px 12px 12px 90px !important;
          }
        }
        @media (max-width: 480px) {
          .extension-container {
            padding: 70px 8px 8px 90px !important;
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
              Save Links Anywhere
            </h1>
            <p style={styles.subtitle}>
              Add the bookmarklet to your browser to save any webpage to your Link Saver
              collection with one click.
            </p>
          </div>

          {/* Sign-in Note */}
          {!user && (
            <div style={{
              padding: '20px',
              backgroundColor: '#fef3c7',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <p style={{ margin: 0, color: COLORS.text }}>
                <strong>Note:</strong> You'll need to sign in to save links to your collection.
              </p>
            </div>
          )}

          {/* Bookmarklet Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Monitor size={20} />
              Desktop Bookmarklet
            </h2>

            {/* Option 1: Popup Version */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text, marginBottom: '12px' }}>
                Option 1: Popup Window (Recommended)
              </h3>
              <p style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '12px' }}>
                Opens a small popup to save the link without leaving the page.
              </p>
              <a
                href={BOOKMARKLET_POPUP}
                style={styles.bookmarkletButton}
                onClick={(e) => e.preventDefault()}
                draggable="true"
              >
                <Link2 size={18} />
                Save to yellowCircle
              </a>
              <div style={styles.codeBlock}>
                <button
                  style={{...styles.copyButton, ...(copiedPopup ? styles.copyButtonSuccess : {})}}
                  onClick={handleCopyPopup}
                >
                  {copiedPopup ? <Check size={14} /> : <Copy size={14} />}
                  {copiedPopup ? 'Copied!' : 'Copy'}
                </button>
                <code style={{ wordBreak: 'break-all' }}>{BOOKMARKLET_POPUP}</code>
              </div>
            </div>

            {/* Option 2: Redirect Version */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text, marginBottom: '12px' }}>
                Option 2: Full Page (If popups are blocked)
              </h3>
              <p style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '12px' }}>
                Navigates to the save page. Use this if your browser blocks popups.
              </p>
              <a
                href={BOOKMARKLET_REDIRECT}
                style={{...styles.bookmarkletButton, backgroundColor: '#e5e7eb', color: COLORS.text}}
                onClick={(e) => e.preventDefault()}
                draggable="true"
              >
                <Link2 size={18} />
                Save (Full Page)
              </a>
              <div style={styles.codeBlock}>
                <button
                  style={{...styles.copyButton, ...(copiedRedirect ? styles.copyButtonSuccess : {})}}
                  onClick={handleCopyRedirect}
                >
                  {copiedRedirect ? <Check size={14} /> : <Copy size={14} />}
                  {copiedRedirect ? 'Copied!' : 'Copy'}
                </button>
                <code style={{ wordBreak: 'break-all' }}>{BOOKMARKLET_REDIRECT}</code>
              </div>
            </div>

            <div style={styles.instructions}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text, marginBottom: '12px' }}>
                How to Install:
              </h3>
              <div style={styles.step}>
                <div style={styles.stepNumber}>1</div>
                <div>Show your bookmarks bar (Cmd+Shift+B on Mac, Ctrl+Shift+B on Windows)</div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <div>Drag one of the buttons above to your bookmarks bar</div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <div>When you find a page you want to save, click the bookmark</div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>4</div>
                <div>Sign in if prompted, then your link will be saved</div>
              </div>
            </div>
          </div>

          {/* Mobile Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Smartphone size={20} />
              Mobile Sharing
            </h2>

            <div style={styles.methodCard}>
              <div style={styles.methodIcon}>
                <Share2 size={20} color={COLORS.text} />
              </div>
              <div>
                <div style={styles.methodTitle}>Share Sheet (iOS & Android)</div>
                <div style={styles.methodDesc}>
                  Use your browser's share button and select "Copy Link", then paste
                  directly into Link Saver. Or bookmark this URL to quick-save:
                </div>
                <code style={{
                  display: 'block',
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '11px',
                  wordBreak: 'break-all'
                }}>
                  https://yellowcircle.co/save?url=YOUR_URL
                </code>
              </div>
            </div>
          </div>

          {/* URL API Method */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Code size={20} />
              URL API Method
            </h2>
            <p style={{ fontSize: '14px', color: COLORS.textMuted, marginBottom: '16px', lineHeight: '1.6' }}>
              Save links programmatically using URL parameters. Perfect for automation,
              shortcuts, and integrating with other tools.
            </p>

            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' }}>Endpoint</span>
                <button
                  style={{
                    padding: '4px 10px',
                    backgroundColor: copiedUrl ? COLORS.success : COLORS.primary,
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={handleCopyUrl}
                >
                  {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
                  {copiedUrl ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <code style={{ color: '#f9fafb', fontSize: '13px', wordBreak: 'break-all' }}>
                https://yellowcircle.co/save?url=<span style={{ color: '#fbbf24' }}>URL</span>&title=<span style={{ color: '#fbbf24' }}>TITLE</span>&tags=<span style={{ color: '#fbbf24' }}>tag1,tag2</span>
              </code>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: COLORS.text, marginBottom: '4px' }}>
                  Parameters
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: COLORS.textMuted, lineHeight: '1.8' }}>
                  <li><code style={{ color: COLORS.text }}>url</code> (required) - The URL to save (URL encoded)</li>
                  <li><code style={{ color: COLORS.text }}>title</code> (optional) - Page title</li>
                  <li><code style={{ color: COLORS.text }}>tags</code> (optional) - Comma-separated tags</li>
                  <li><code style={{ color: COLORS.text }}>folder</code> (optional) - Folder ID to save to</li>
                </ul>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: COLORS.text, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} />
                  iOS/Mac Shortcut Example
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: COLORS.text, lineHeight: '1.5' }}>
                  Create a Shortcut that gets the current Safari URL, encodes it, and opens the save URL.
                  Assign it to share sheet for one-tap saving.
                </p>
              </div>
            </div>
          </div>

          {/* Slack Integration */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <MessageSquare size={20} />
              Slack Integration
            </h2>
            <p style={{ fontSize: '14px', color: COLORS.textMuted, marginBottom: '16px', lineHeight: '1.6' }}>
              Save links directly from Slack messages to your Link Saver collection.
            </p>

            <div style={styles.methodCard}>
              <div style={styles.methodIcon}>
                <Zap size={20} color={COLORS.text} />
              </div>
              <div>
                <div style={styles.methodTitle}>Slack Workflow</div>
                <div style={styles.methodDesc}>
                  Create a Slack workflow that extracts URLs from messages and sends them to the
                  save endpoint. Use the <code style={{ fontSize: '11px' }}>Webhook</code> step with the URL API above.
                </div>
              </div>
            </div>

            <div style={styles.methodCard}>
              <div style={styles.methodIcon}>
                <MessageSquare size={20} color={COLORS.text} />
              </div>
              <div>
                <div style={styles.methodTitle}>Slackbot Command</div>
                <div style={styles.methodDesc}>
                  Type <code style={{ fontSize: '11px' }}>/save https://example.com</code> in any channel
                  (coming soon - requires Slack app installation).
                </div>
              </div>
            </div>

            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              fontSize: '12px',
              color: COLORS.textMuted,
              marginTop: '8px'
            }}>
              Want native Slack integration? <a href="mailto:hello@yellowcircle.co" style={{ color: COLORS.primary }}>Contact us</a> to request early access.
            </div>
          </div>

          {/* Other Methods */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <Link2 size={20} />
              Other Ways to Save
            </h2>

            <div style={styles.methodCard}>
              <div style={styles.methodIcon}>
                <Bookmark size={20} color={COLORS.text} />
              </div>
              <div>
                <div style={styles.methodTitle}>Manual Entry</div>
                <div style={styles.methodDesc}>
                  Go to <a href="/links" style={{ color: COLORS.primary }}>Link Saver</a> and
                  click the "+" button to manually add a URL.
                </div>
              </div>
            </div>

            <div style={styles.methodCard}>
              <div style={styles.methodIcon}>
                <Copy size={20} color={COLORS.text} />
              </div>
              <div>
                <div style={styles.methodTitle}>Import from Pocket</div>
                <div style={styles.methodDesc}>
                  Export your Pocket data and import it via Settings in Link Saver.
                  Supports JSON and CSV export formats.
                </div>
              </div>
            </div>

            <div style={styles.methodCard}>
              <div style={styles.methodIcon}>
                <ExternalLink size={20} color={COLORS.text} />
              </div>
              <div>
                <div style={styles.methodTitle}>Browser Extension</div>
                <div style={styles.methodDesc}>
                  Chrome/Firefox extension coming soon for even faster saving with metadata extraction.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LinkSaverExtensionPage;
