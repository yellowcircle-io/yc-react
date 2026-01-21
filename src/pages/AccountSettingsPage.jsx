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
import { useNavigate } from 'react-router-dom';
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
  ChevronRight
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
  { id: 'integrations', label: 'Integrations', icon: Link2, disabled: true }
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
    transition: 'border-color 0.2s ease'
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
// Integrations Tab Component (Coming Soon)
// ============================================================
const IntegrationsTab = () => {
  return (
    <div style={styles.section}>
      <div style={styles.comingSoon}>
        <Link2 size={48} style={styles.comingSoonIcon} />
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Integrations Coming Soon</h3>
        <p style={{ fontSize: '14px', maxWidth: '400px' }}>
          Connect your favorite tools like HubSpot, Brevo, and more to supercharge your workflow.
        </p>
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
function AccountSettingsPage() {
  const navigate = useNavigate();
  const { user, isAdmin: _isAdmin, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading, saving, error, hasUnsavedChanges, updateSettings, saveSettings } = useUserSettings();
  const [activeTab, setActiveTab] = useState('profile');
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
      case 'integrations':
        return <IntegrationsTab />;
      default:
        return <ProfileTab user={user} settings={settings} updateSettings={updateSettings} />;
    }
  };

  if (authLoading || settingsLoading) {
    return (
      <Layout navigationItems={navigationItems}>
        <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout navigationItems={navigationItems}>
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
