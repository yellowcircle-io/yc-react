/**
 * Account Settings Page
 *
 * User-level configuration page for Unity Platform tools.
 * Distinct from admin pages - focused on personalization, not system management.
 *
 * Route: /account/settings
 *
 * @created 2026-01-18
 * @author Sleepless Agent
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/global/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from '../contexts/UserSettingsContext';
import { navigationItems } from '../config/navigationItems';
import {
  Settings,
  User,
  Palette,
  Link2,
  Wrench,
  Moon,
  Sun,
  Monitor,
  Bell,
  Mail,
  Camera,
  Save,
  Check,
  ChevronRight,
  Key,
  Copy,
  RefreshCw,
  Trash2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

// ============================================================
// Brand Colors (yellowCircle)
// ============================================================
const COLORS = {
  primary: '#fbbf24',
  primaryDark: '#d4a000',
  text: '#171717',
  textMuted: '#737373',
  textLight: '#a3a3a3',
  border: 'rgba(0, 0, 0, 0.1)',
  white: '#ffffff',
  cardBg: '#fafafa',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6'
};

// ============================================================
// Tab Configuration
// ============================================================
const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'tools', label: 'Unity Tools', icon: Wrench },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'api', label: 'API Access', icon: Key },
  { id: 'integrations', label: 'Integrations', icon: Link2 }
];

// ============================================================
// Styles
// ============================================================
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: COLORS.white,
    padding: '100px 40px 40px 120px'
  },
  innerContainer: {
    maxWidth: '900px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: COLORS.text,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '14px',
    color: COLORS.textMuted
  },
  tabsContainer: {
    display: 'flex',
    gap: '4px',
    borderBottom: `2px solid ${COLORS.border}`,
    marginBottom: '32px'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: COLORS.textMuted,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  tabActive: {
    color: COLORS.text,
    borderBottomColor: COLORS.primary
  },
  tabDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  section: {
    backgroundColor: COLORS.white,
    border: `2px solid ${COLORS.border}`,
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: '6px'
  },
  labelDescription: {
    fontSize: '12px',
    color: COLORS.textMuted,
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: `2px solid ${COLORS.border}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box'
  },
  inputReadOnly: {
    backgroundColor: COLORS.cardBg,
    cursor: 'not-allowed'
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: `2px solid ${COLORS.border}`,
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: COLORS.white,
    cursor: 'pointer'
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: COLORS.cardBg,
    borderRadius: '8px',
    marginBottom: '12px'
  },
  toggleSwitch: {
    width: '44px',
    height: '24px',
    backgroundColor: COLORS.border,
    borderRadius: '12px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  toggleSwitchActive: {
    backgroundColor: COLORS.primary
  },
  toggleKnob: {
    width: '20px',
    height: '20px',
    backgroundColor: COLORS.white,
    borderRadius: '50%',
    position: 'absolute',
    top: '2px',
    left: '2px',
    transition: 'transform 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },
  toggleKnobActive: {
    transform: 'translateX(20px)'
  },
  themeOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  themeOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    border: `2px solid ${COLORS.border}`,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  themeOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(251, 191, 36, 0.1)'
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: COLORS.primary,
    color: COLORS.text,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  savedIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: COLORS.success
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: COLORS.cardBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: `2px solid ${COLORS.border}`
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarPlaceholder: {
    color: COLORS.textLight
  },
  comingSoon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    color: COLORS.textMuted
  },
  comingSoonIcon: {
    marginBottom: '16px',
    opacity: 0.5
  }
};

// ============================================================
// Profile Tab Component
// ============================================================
const ProfileTab = ({ user, settings, updateSettings }) => {
  // Handle undefined settings gracefully
  const safeSettings = settings || {
    displayName: user?.displayName || '',
    marketingEmails: true,
    notificationEmails: true,
    shareNotificationEmails: true
  };

  return (
    <>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <User size={18} />
          Personal Information
        </h3>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={styles.avatar}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} style={styles.avatarImage} />
            ) : (
              <Camera size={24} style={styles.avatarPlaceholder} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Display Name</label>
              <input
                type="text"
                value={safeSettings.displayName}
                onChange={(e) => updateSettings({ displayName: e.target.value })}
                style={styles.input}
                placeholder="Enter your name"
              />
            </div>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Email Address</label>
          <p style={styles.labelDescription}>Your email is managed through your login provider</p>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            style={{ ...styles.input, ...styles.inputReadOnly }}
          />
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <Bell size={18} />
          Email Preferences
        </h3>

        <div style={styles.toggle}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: COLORS.text }}>Marketing Emails</div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted }}>Receive updates about new features and tips</div>
          </div>
          <div
            style={{ ...styles.toggleSwitch, ...(safeSettings.marketingEmails ? styles.toggleSwitchActive : {}) }}
            onClick={() => updateSettings({ marketingEmails: !safeSettings.marketingEmails })}
          >
            <div style={{ ...styles.toggleKnob, ...(safeSettings.marketingEmails ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>

        <div style={styles.toggle}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: COLORS.text }}>Notification Emails</div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted }}>Get notified about activity and mentions</div>
          </div>
          <div
            style={{ ...styles.toggleSwitch, ...(safeSettings.notificationEmails ? styles.toggleSwitchActive : {}) }}
            onClick={() => updateSettings({ notificationEmails: !safeSettings.notificationEmails })}
          >
            <div style={{ ...styles.toggleKnob, ...(safeSettings.notificationEmails ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>

        <div style={styles.toggle}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: COLORS.text }}>Sharing Notification Emails</div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted }}>Receive an email when someone shares a link, folder, or canvas with you</div>
          </div>
          <div
            style={{ ...styles.toggleSwitch, ...(safeSettings.shareNotificationEmails ? styles.toggleSwitchActive : {}) }}
            onClick={() => updateSettings({ shareNotificationEmails: !safeSettings.shareNotificationEmails })}
          >
            <div style={{ ...styles.toggleKnob, ...(safeSettings.shareNotificationEmails ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================
// Tools Tab Component
// ============================================================
const ToolsTab = ({ settings, updateSettings }) => {
  // Handle undefined settings gracefully
  const safeSettings = settings || {
    linkArchiverView: 'all',
    notesDefaultNode: 'textNode',
    notesShowGrid: false
  };

  return (
    <>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <Link2 size={18} />
          Link Saver
        </h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Default View</label>
          <p style={styles.labelDescription}>Which view to show when opening Link Saver</p>
          <select
            value={safeSettings.linkArchiverView}
            onChange={(e) => updateSettings({ linkArchiverView: e.target.value })}
            style={styles.select}
          >
            <option value="all">All Links</option>
            <option value="starred">Starred</option>
            <option value="recent">Recently Added</option>
          </select>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <Wrench size={18} />
          Unity NOTES
        </h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Default Node Type</label>
          <p style={styles.labelDescription}>Node type when adding new content</p>
          <select
            value={safeSettings.notesDefaultNode}
            onChange={(e) => updateSettings({ notesDefaultNode: e.target.value })}
            style={styles.select}
          >
            <option value="textNode">Text Note</option>
            <option value="stickyNode">Sticky Note</option>
            <option value="photoNode">Photo</option>
          </select>
        </div>

        <div style={styles.toggle}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: COLORS.text }}>Show Grid</div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted }}>Display canvas grid by default</div>
          </div>
          <div
            style={{ ...styles.toggleSwitch, ...(safeSettings.notesShowGrid ? styles.toggleSwitchActive : {}) }}
            onClick={() => updateSettings({ notesShowGrid: !safeSettings.notesShowGrid })}
          >
            <div style={{ ...styles.toggleKnob, ...(safeSettings.notesShowGrid ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================
// Appearance Tab Component
// ============================================================
const AppearanceTab = ({ settings, updateSettings }) => {
  // Handle undefined settings gracefully
  const safeSettings = settings || {
    theme: 'system',
    sidebarCollapsed: false
  };

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor }
  ];

  return (
    <>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <Palette size={18} />
          Theme
        </h3>

        <div style={styles.themeOptions}>
          {themeOptions.map((option) => (
            <div
              key={option.id}
              style={{
                ...styles.themeOption,
                ...(safeSettings.theme === option.id ? styles.themeOptionActive : {})
              }}
              onClick={() => updateSettings({ theme: option.id })}
            >
              <option.icon size={24} color={safeSettings.theme === option.id ? COLORS.primary : COLORS.textMuted} />
              <span style={{ fontSize: '13px', fontWeight: '500', color: safeSettings.theme === option.id ? COLORS.text : COLORS.textMuted }}>
                {option.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <Settings size={18} />
          Interface
        </h3>

        <div style={styles.toggle}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: COLORS.text }}>Sidebar Collapsed by Default</div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted }}>Start with sidebar minimized</div>
          </div>
          <div
            style={{ ...styles.toggleSwitch, ...(safeSettings.sidebarCollapsed ? styles.toggleSwitchActive : {}) }}
            onClick={() => updateSettings({ sidebarCollapsed: !safeSettings.sidebarCollapsed })}
          >
            <div style={{ ...styles.toggleKnob, ...(safeSettings.sidebarCollapsed ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================
// Cloud Functions Base URL
// ============================================================
const FUNCTIONS_BASE_URL = 'https://us-central1-yellowcircle-app.cloudfunctions.net';

// ============================================================
// API Access Tab Component - Token & External Save Methods
// ============================================================
const ApiAccessTab = ({ user }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);

  // Fetch current token on mount
  useEffect(() => {
    const fetchToken = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${FUNCTIONS_BASE_URL}/linkArchiverGetApiToken`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        const data = await response.json();
        if (data.success && data.token) {
          setToken(data.token);
        }
      } catch {
        // No token exists yet - that's fine
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, [user]);

  const generateToken = async () => {
    if (!user) return;
    setGenerating(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${FUNCTIONS_BASE_URL}/linkArchiverGenerateApiToken`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setToken(data.token);
      } else {
        setError(data.error || 'Failed to generate token');
      }
    } catch (_err) {
      setError('Failed to generate token. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const revokeToken = async () => {
    if (!user || !token) return;
    if (!window.confirm('Are you sure you want to revoke your API token? Any integrations using this token will stop working.')) {
      return;
    }
    setRevoking(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${FUNCTIONS_BASE_URL}/linkArchiverRevokeApiToken`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setToken(null);
      } else {
        setError(data.error || 'Failed to revoke token');
      }
    } catch (_err) {
      setError('Failed to revoke token. Please try again.');
    } finally {
      setRevoking(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const quickSaveUrl = token ? `${FUNCTIONS_BASE_URL}/linkArchiverQuickSave?token=${token}&url=` : null;
  const bookmarkletCode = token ? `javascript:(function(){window.location='${FUNCTIONS_BASE_URL}/linkArchiverQuickSave?token=${token}&url='+encodeURIComponent(window.location.href)})()` : null;

  if (loading) {
    return (
      <div style={styles.section}>
        <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textMuted }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <Key size={18} />
          Personal API Token
        </h3>
        <p style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '20px' }}>
          Use your personal API token to save links from anywhere - iOS Shortcuts, browser bookmarklets, automation tools, and more.
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: COLORS.danger
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {token ? (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label}>Your API Token</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={token}
                  readOnly
                  style={{ ...styles.input, ...styles.inputReadOnly, fontFamily: 'monospace', flex: 1 }}
                />
                <button
                  onClick={() => copyToClipboard(token, 'token')}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: copied === 'token' ? COLORS.success : COLORS.cardBg,
                    border: `2px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: copied === 'token' ? COLORS.white : COLORS.text,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copied === 'token' ? <Check size={14} /> : <Copy size={14} />}
                  {copied === 'token' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={generateToken}
                disabled={generating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  backgroundColor: COLORS.cardBg,
                  border: `2px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: COLORS.text,
                  opacity: generating ? 0.7 : 1
                }}
              >
                <RefreshCw size={14} style={generating ? { animation: 'spin 1s linear infinite' } : {}} />
                {generating ? 'Regenerating...' : 'Regenerate Token'}
              </button>
              <button
                onClick={revokeToken}
                disabled={revoking}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: `2px solid ${COLORS.danger}`,
                  borderRadius: '8px',
                  cursor: revoking ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: COLORS.danger,
                  opacity: revoking ? 0.7 : 1
                }}
              >
                <Trash2 size={14} />
                {revoking ? 'Revoking...' : 'Revoke Token'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Key size={40} color={COLORS.textLight} style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '14px', color: COLORS.textMuted, marginBottom: '20px' }}>
              No API token generated yet. Create one to start saving links from anywhere.
            </p>
            <button
              onClick={generateToken}
              disabled={generating}
              style={{
                ...styles.saveButton,
                opacity: generating ? 0.7 : 1,
                cursor: generating ? 'not-allowed' : 'pointer'
              }}
            >
              <Key size={16} />
              {generating ? 'Generating...' : 'Generate API Token'}
            </button>
          </div>
        )}
      </div>

      {token && (
        <>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Link2 size={18} />
              Quick Save URL
            </h3>
            <p style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '16px' }}>
              Append any URL to this endpoint to save it directly to your Link Saver.
            </p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Endpoint URL</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={quickSaveUrl}
                  readOnly
                  style={{
                    ...styles.input,
                    ...styles.inputReadOnly,
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    flex: 1
                  }}
                />
                <button
                  onClick={() => copyToClipboard(quickSaveUrl, 'url')}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: copied === 'url' ? COLORS.success : COLORS.cardBg,
                    border: `2px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: copied === 'url' ? COLORS.white : COLORS.text,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copied === 'url' ? <Check size={14} /> : <Copy size={14} />}
                  {copied === 'url' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{
              backgroundColor: COLORS.cardBg,
              padding: '16px',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: COLORS.text, marginBottom: '8px' }}>
                Example Usage:
              </div>
              <code style={{
                fontSize: '11px',
                color: COLORS.textMuted,
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {quickSaveUrl}https://example.com/article
              </code>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Link2 size={18} />
              Vanity Save URL
            </h3>
            <p style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '16px' }}>
              Prepend this URL prefix to any link to save it. Works great from mobile or messaging apps.
            </p>

            <div style={styles.formGroup}>
              <label style={styles.label}>URL Prefix</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={`yellowcircle.io/s/${token}/`}
                  readOnly
                  style={{
                    ...styles.input,
                    ...styles.inputReadOnly,
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    flex: 1
                  }}
                />
                <button
                  onClick={() => copyToClipboard(`yellowcircle.io/s/${token}/`, 'vanity')}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: copied === 'vanity' ? COLORS.success : COLORS.cardBg,
                    border: `2px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: copied === 'vanity' ? COLORS.white : COLORS.text,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copied === 'vanity' ? <Check size={14} /> : <Copy size={14} />}
                  {copied === 'vanity' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{
              backgroundColor: COLORS.cardBg,
              padding: '16px',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: COLORS.text, marginBottom: '8px' }}>
                Example:
              </div>
              <code style={{
                fontSize: '12px',
                color: COLORS.textMuted,
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                yellowcircle.io/s/{token}/https://nytimes.com/article
              </code>
              <p style={{ fontSize: '11px', color: COLORS.textLight, marginTop: '10px', marginBottom: 0 }}>
                The link is saved to your collection and you're redirected to the destination.
              </p>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <ExternalLink size={18} />
              Browser Bookmarklet
            </h3>
            <p style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '16px' }}>
              Drag this link to your bookmarks bar to save pages with one click.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              backgroundColor: COLORS.cardBg,
              borderRadius: '8px'
            }}>
              <a
                href={bookmarkletCode}
                onClick={(e) => e.preventDefault()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: COLORS.primary,
                  color: COLORS.text,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'grab'
                }}
                title="Drag to bookmarks bar"
              >
                <Link2 size={16} />
                Save to yellowCircle
              </a>
              <span style={{ fontSize: '12px', color: COLORS.textMuted }}>
                ← Drag this to your bookmarks bar
              </span>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Wrench size={18} />
              iOS Shortcut Example
            </h3>
            <p style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '16px' }}>
              Create a shortcut to save links from the iOS Share Sheet.
            </p>

            <div style={{
              backgroundColor: COLORS.cardBg,
              padding: '16px',
              borderRadius: '8px'
            }}>
              <ol style={{
                fontSize: '13px',
                color: COLORS.text,
                paddingLeft: '20px',
                margin: 0,
                lineHeight: '1.8'
              }}>
                <li>Open the Shortcuts app on your iPhone/iPad</li>
                <li>Create a new shortcut with "Receive Any input"</li>
                <li>Add "Get URLs from Input" action</li>
                <li>Add "Get Contents of URL" action with:
                  <ul style={{ marginTop: '4px', marginBottom: '4px' }}>
                    <li>URL: <code style={{ fontSize: '11px', backgroundColor: COLORS.white, padding: '2px 4px', borderRadius: '4px' }}>{FUNCTIONS_BASE_URL}/linkArchiverQuickSave</code></li>
                    <li>Method: GET</li>
                    <li>Add Query Parameter: <code style={{ fontSize: '11px', backgroundColor: COLORS.white, padding: '2px 4px', borderRadius: '4px' }}>token</code> = <code style={{ fontSize: '11px', backgroundColor: COLORS.white, padding: '2px 4px', borderRadius: '4px' }}>{token}</code></li>
                    <li>Add Query Parameter: <code style={{ fontSize: '11px', backgroundColor: COLORS.white, padding: '2px 4px', borderRadius: '4px' }}>url</code> = URLs</li>
                  </ul>
                </li>
                <li>Enable "Show in Share Sheet"</li>
              </ol>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <Mail size={18} />
              Email-to-Save
            </h3>
            <p style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '16px' }}>
              Forward or share emails containing links to this address. All URLs in the email will be saved to your collection.
            </p>

            <div style={styles.formGroup}>
              <label style={styles.label}>Your Save Email Address</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={`save+${token}@yellowcircle.io`}
                  readOnly
                  style={{
                    ...styles.input,
                    ...styles.inputReadOnly,
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    flex: 1
                  }}
                />
                <button
                  onClick={() => copyToClipboard(`save+${token}@yellowcircle.io`, 'email')}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: copied === 'email' ? COLORS.success : COLORS.cardBg,
                    border: `2px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: copied === 'email' ? COLORS.white : COLORS.text,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copied === 'email' ? <Check size={14} /> : <Copy size={14} />}
                  {copied === 'email' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{
              backgroundColor: COLORS.cardBg,
              padding: '16px',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: COLORS.text, marginBottom: '12px' }}>
                How to Use:
              </div>
              <ul style={{
                fontSize: '13px',
                color: COLORS.textMuted,
                paddingLeft: '20px',
                margin: 0,
                lineHeight: '1.8'
              }}>
                <li><strong>Slack:</strong> Forward messages via "More actions" → "Forward via email"</li>
                <li><strong>iOS:</strong> Use Share Sheet → Mail to forward content</li>
                <li><strong>Gmail:</strong> Forward newsletters or share interesting links</li>
                <li><strong>Zapier/n8n:</strong> Set up automation to forward emails with links</li>
              </ul>
              <p style={{ fontSize: '11px', color: COLORS.textLight, marginTop: '12px', marginBottom: 0 }}>
                All http:// and https:// URLs found in the email body will be saved automatically.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// ============================================================
// Integrations Tab Component - AI & External Services
// ============================================================
const IntegrationsTab = () => {
  const { settings, updateSettings } = useUserSettings();
  const { user } = useAuth();
  const [keyStatus, setKeyStatus] = useState({ gemini: false, openai: false });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // AI Provider options
  const AI_PROVIDERS = [
    { id: 'free', name: 'Free (Basic)', description: 'Simple text extraction, no AI', cost: 'Free' },
    { id: 'groq', name: 'Groq (Llama 3.1)', description: 'Fast AI summaries via Groq free tier', cost: 'Free' },
    { id: 'gemini', name: 'Google Gemini', description: 'Google AI for high-quality summaries', cost: 'Requires API Key' },
    { id: 'openai', name: 'OpenAI GPT', description: 'OpenAI GPT-3.5 for summaries', cost: 'Requires API Key' }
  ];

  const selectedProvider = settings?.aiProvider || 'free';
  const enableAutoSummary = settings?.enableAutoSummary ?? false;

  // Fetch key status on mount
  useEffect(() => {
    const fetchKeyStatus = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch(
          'https://us-central1-yellowcircle-app.cloudfunctions.net/linkArchiverGetSecretKeyStatus',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setKeyStatus(data.configured || {});
        }
      } catch (_err) {
        console.error('Failed to fetch key status');
      }
    };
    fetchKeyStatus();
  }, [user]);

  const handleProviderChange = (providerId) => {
    updateSettings({ aiProvider: providerId });
    setApiKeyInput('');
    setSaveMessage(null);
  };

  const handleSaveApiKey = async () => {
    if (!user || !apiKeyInput.trim()) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        'https://us-central1-yellowcircle-app.cloudfunctions.net/linkArchiverSaveSecretKey',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            provider: selectedProvider,
            apiKey: apiKeyInput.trim()
          })
        }
      );

      if (response.ok) {
        setKeyStatus(prev => ({ ...prev, [selectedProvider]: true }));
        setApiKeyInput('');
        setSaveMessage({ type: 'success', text: 'API key saved securely' });
      } else {
        const data = await response.json();
        setSaveMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (_err) {
      setSaveMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        'https://us-central1-yellowcircle-app.cloudfunctions.net/linkArchiverSaveSecretKey',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            provider: selectedProvider,
            apiKey: ''
          })
        }
      );

      if (response.ok) {
        setKeyStatus(prev => ({ ...prev, [selectedProvider]: false }));
        setSaveMessage({ type: 'success', text: 'API key removed' });
      }
    } catch (_err) {
      setSaveMessage({ type: 'error', text: 'Failed to remove key' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* AI Configuration Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <Settings size={18} />
          AI Summaries Configuration
        </h3>
        <p style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '20px' }}>
          Configure how AI-powered summaries are generated for your saved links.
          Default is free with no external API required.
        </p>

        {/* Auto-Summary Toggle */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '12px',
            backgroundColor: enableAutoSummary ? `${COLORS.primary}15` : '#f5f5f5',
            borderRadius: '8px',
            border: enableAutoSummary ? `1px solid ${COLORS.primary}` : '1px solid #e5e5e5'
          }}>
            <input
              type="checkbox"
              checked={enableAutoSummary}
              onChange={(e) => updateSettings({ enableAutoSummary: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: COLORS.primary }}
            />
            <div>
              <div style={{ fontWeight: '500', color: COLORS.text }}>Auto-generate summaries</div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '2px' }}>
                Automatically generate AI summaries when saving new links
              </div>
            </div>
          </label>
        </div>

        {/* Provider Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={styles.label}>AI Provider</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {AI_PROVIDERS.map(provider => (
              <label
                key={provider.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: selectedProvider === provider.id ? `${COLORS.primary}10` : '#fff',
                  border: selectedProvider === provider.id ? `2px solid ${COLORS.primary}` : '1px solid #e5e5e5',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="aiProvider"
                  value={provider.id}
                  checked={selectedProvider === provider.id}
                  onChange={() => handleProviderChange(provider.id)}
                  style={{ marginTop: '2px', accentColor: COLORS.primary }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '500', color: COLORS.text }}>{provider.name}</span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {keyStatus[provider.id] && (
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          borderRadius: '4px'
                        }}>
                          Configured
                        </span>
                      )}
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        backgroundColor: provider.cost === 'Free' ? '#dcfce7' : '#fef3c7',
                        color: provider.cost === 'Free' ? '#166534' : '#92400e',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {provider.cost}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '4px' }}>
                    {provider.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* API Key Input (for paid providers) */}
        {['gemini', 'openai'].includes(selectedProvider) && (
          <div style={{ marginBottom: '24px' }}>
            <label style={styles.label}>
              {selectedProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
            </label>

            {keyStatus[selectedProvider] ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: '14px', color: '#166534' }}>API key configured</span>
                </div>
                <button
                  onClick={handleRemoveApiKey}
                  disabled={saving}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: 'transparent',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    color: '#dc2626',
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={selectedProvider === 'gemini' ? 'AIza...' : 'sk-...'}
                  style={{
                    ...styles.input,
                    flex: 1,
                    fontFamily: "'Monaco', 'Menlo', monospace",
                    fontSize: '13px'
                  }}
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={saving || !apiKeyInput.trim()}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: apiKeyInput.trim() ? COLORS.primary : '#e5e5e5',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: saving || !apiKeyInput.trim() ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Key'}
                </button>
              </div>
            )}

            {saveMessage && (
              <p style={{
                fontSize: '12px',
                marginTop: '8px',
                color: saveMessage.type === 'success' ? '#22c55e' : '#dc2626'
              }}>
                {saveMessage.text}
              </p>
            )}

            <p style={{ fontSize: '11px', color: COLORS.textLight, marginTop: '8px' }}>
              {selectedProvider === 'gemini' ? (
                <>Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary }}>Google AI Studio</a></>
              ) : (
                <>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary }}>OpenAI Dashboard</a></>
              )}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bae6fd'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertCircle size={18} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: '500' }}>
                Privacy Note
              </div>
              <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px' }}>
                API keys are stored securely on our servers and never sent to your browser.
                Keys are only used server-side to call the respective AI service.
                The "Free" option uses no external AI service.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Future: External Integrations */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          <Link2 size={18} />
          External Integrations
        </h3>
        <div style={styles.comingSoon}>
          <Link2 size={48} style={styles.comingSoonIcon} />
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: COLORS.text, marginBottom: '8px' }}>
            Coming Soon
          </h4>
          <p style={{ fontSize: '14px', maxWidth: '400px', lineHeight: '1.6' }}>
            Connect external services like Pocket, Instapaper, Google Drive, and more
            to sync your links and content automatically.
          </p>
        </div>
      </div>
    </>
  );
};

// ============================================================
// Main Component
// ============================================================
function AccountSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin: _isAdmin, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading, saving, error, hasUnsavedChanges, updateSettings, saveSettings } = useUserSettings();

  // Initialize tab from URL query param or default to 'profile'
  const validTabs = TABS.map(t => t.id);
  const tabFromUrl = searchParams.get('tab');
  const initialTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saved, setSaved] = useState(false);

  // Handle save
  const handleSave = async () => {
    const success = await saveSettings();
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleTabChange = (tabId) => {
    const tab = TABS.find(t => t.id === tabId);
    if (tab && !tab.disabled) {
      setActiveTab(tabId);
      // Update URL for shareable links
      setSearchParams(tabId === 'profile' ? {} : { tab: tabId });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab user={user} settings={settings} updateSettings={updateSettings} />;
      case 'tools':
        return <ToolsTab settings={settings} updateSettings={updateSettings} />;
      case 'appearance':
        return <AppearanceTab settings={settings} updateSettings={updateSettings} />;
      case 'api':
        return <ApiAccessTab user={user} />;
      case 'integrations':
        return <IntegrationsTab />;
      default:
        return <ProfileTab user={user} settings={settings} updateSettings={updateSettings} />;
    }
  };

  if (authLoading || settingsLoading) {
    return (
      <Layout navigationItems={navigationItems} allowScroll={true}>
        <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout navigationItems={navigationItems} allowScroll={true}>
      <div style={styles.container}>
        <div style={styles.innerContainer}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>
              <Settings size={28} color={COLORS.primary} />
              Account Settings
            </h1>
            <p style={styles.subtitle}>
              Manage your profile, tool preferences, and appearance
            </p>
          </div>

          {/* Tabs */}
          <div style={styles.tabsContainer}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.id ? styles.tabActive : {}),
                  ...(tab.disabled ? styles.tabDisabled : {})
                }}
                disabled={tab.disabled}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.disabled && (
                  <span style={{ fontSize: '10px', backgroundColor: COLORS.cardBg, padding: '2px 6px', borderRadius: '4px' }}>
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {renderTabContent()}

          {/* Save Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
            <button
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && (
              <div style={styles.savedIndicator}>
                <Check size={14} />
                Changes saved
              </div>
            )}
            {error && (
              <div style={{ fontSize: '13px', color: COLORS.danger }}>
                {error}
              </div>
            )}
            {hasUnsavedChanges && !saved && !error && (
              <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                Unsaved changes
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AccountSettingsPage;
