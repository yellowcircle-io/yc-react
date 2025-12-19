/**
 * Contact Dashboard Admin Page
 *
 * Admin interface to view and manage contacts/leads
 * for the yellowCircle CRM pipeline.
 *
 * Updated with proper Layout props and yellowCircle brand styling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/global/Layout';
import { useAuth } from '../../contexts/AuthContext';
import {
  listContacts,
  searchContacts,
  archiveContact,
  changeRecordType,
  listContactsByRecordType,
  upsertContact,
  migrateContactsToRecordType,
  RECORD_TYPES
} from '../../utils/firestoreContacts';
import PipelineStatsCard from '../../components/admin/PipelineStatsCard';
import EmailStatsCard from '../../components/admin/EmailStatsCard';
import AnalyticsSummary from '../../components/admin/AnalyticsSummary';
import PESignalsPanel from '../../components/admin/PESignalsPanel';
import {
  Users,
  UserPlus,
  UserCheck,
  Briefcase,
  Mail,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  AlertTriangle,
  RefreshCw,
  Eye,
  Archive,
  Tag,
  Calendar,
  TrendingUp,
  Inbox,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Home,
  Send,
  MousePointer,
  Activity,
  Target,
  BarChart3,
  Upload,
  Download,
  MoreVertical,
  Edit3
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
  inputBg: 'rgba(0, 0, 0, 0.02)',
  success: '#16a34a',
  error: '#dc2626',
  white: '#ffffff',
  cardBg: '#fafafa'
};

// Import shared admin navigation
import { adminNavigationItems } from '../../config/adminNavigationItems';

// Stage colors
const STAGE_COLORS = {
  new: { bg: '#dbeafe', text: '#1d4ed8' },
  nurturing: { bg: '#fef3c7', text: '#d97706' },
  engaged: { bg: '#d1fae5', text: '#059669' },
  qualified: { bg: '#e0e7ff', text: '#4f46e5' },
  opportunity: { bg: '#fce7f3', text: '#db2777' },
  customer: { bg: '#dcfce7', text: '#15803d' },
  churned: { bg: '#f3f4f6', text: '#6b7280' }
};

// Record Type colors (4-tier CRM taxonomy)
const RECORD_TYPE_COLORS = {
  client: { bg: '#dcfce7', text: '#15803d', icon: Briefcase },
  contact: { bg: '#dbeafe', text: '#1d4ed8', icon: UserCheck },
  lead: { bg: '#fef3c7', text: '#d97706', icon: UserPlus },
  prospect: { bg: '#f3e8ff', text: '#7c3aed', icon: Target }
};

// Legacy type colors (for backwards compatibility)
const TYPE_COLORS = {
  lead: { bg: '#fef3c7', text: '#d97706' },
  prospect: { bg: '#dbeafe', text: '#1d4ed8' },
  client: { bg: '#dcfce7', text: '#15803d' },
  partner: { bg: '#e0e7ff', text: '#4f46e5' },
  other: { bg: '#f3f4f6', text: '#6b7280' }
};

// Lead status colors
const LEAD_STATUS_COLORS = {
  new: { bg: '#dbeafe', text: '#1d4ed8', icon: Inbox },
  processing: { bg: '#fef3c7', text: '#d97706', icon: Clock },
  resolved: { bg: '#dcfce7', text: '#15803d', icon: CheckCircle },
  duplicate: { bg: '#f3f4f6', text: '#6b7280', icon: Archive },
  error: { bg: '#fee2e2', text: '#dc2626', icon: AlertCircle }
};

// ============================================================
// Reusable Styles
// ============================================================
const styles = {
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: `2px solid ${COLORS.border}`,
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box'
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: `2px solid ${COLORS.border}`,
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    flexShrink: 0,
    minWidth: '130px',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer'
  },
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    color: '#000000'
  },
  secondaryButton: {
    backgroundColor: COLORS.cardBg,
    color: COLORS.text,
    border: `2px solid ${COLORS.border}`
  },
  card: {
    backgroundColor: COLORS.white,
    border: `2px solid ${COLORS.border}`,
    borderRadius: '12px',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }
};

const ContactDashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Tab state - 4-tier CRM taxonomy
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'client' | 'contact' | 'lead' | 'prospect'

  // Contacts state (unified - includes all record types)
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState(null);
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilter, setContactFilter] = useState({ stage: null, pipeline: null });

  // PE Signals panel state
  const [showPESignals, setShowPESignals] = useState(false);

  // Counts per record type
  const [recordTypeCounts, setRecordTypeCounts] = useState({
    all: 0,
    client: 0,
    contact: 0,
    lead: 0,
    prospect: 0
  });

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState('options'); // 'options' | 'csv' | 'manual'
  const [manualEmails, setManualEmails] = useState('');
  const [importRecordType, setImportRecordType] = useState('prospect');
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Migration state
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationResults, setMigrationResults] = useState(null);

  // Record type change dropdown
  const [typeChangeDropdown, setTypeChangeDropdown] = useState(null);

  // Detail modal
  const [detailModal, setDetailModal] = useState(null);

  // Action loading
  const [actionLoading, setActionLoading] = useState({});

  // Layout callbacks
  const handleHomeClick = () => navigate('/');
  const handleFooterToggle = () => {};
  const handleMenuToggle = () => {};

  // Load contacts with optional record type filter
  const loadContacts = useCallback(async () => {
    try {
      setContactsLoading(true);
      setContactsError(null);

      let result;
      if (contactSearch.trim()) {
        result = await searchContacts(contactSearch.trim());
      } else if (activeTab !== 'all') {
        // Filter by record type when a specific tab is selected
        result = await listContactsByRecordType(activeTab, { limit: 100 });
      } else {
        result = await listContacts({
          stage: contactFilter.stage,
          limit: 100
        });
      }

      const allContacts = result.contacts || result || [];
      setContacts(allContacts);

      // Calculate counts for each record type
      const counts = {
        all: allContacts.length,
        client: 0,
        contact: 0,
        lead: 0,
        prospect: 0
      };

      allContacts.forEach(c => {
        const type = c.recordType || 'prospect';
        if (counts[type] !== undefined) {
          counts[type]++;
        }
      });

      // If filtering by tab, get total count separately
      if (activeTab !== 'all') {
        const allResult = await listContacts({ limit: 200 });
        const allData = allResult.contacts || allResult || [];
        counts.all = allData.length;
        counts.client = allData.filter(c => c.recordType === 'client').length;
        counts.contact = allData.filter(c => c.recordType === 'contact').length;
        counts.lead = allData.filter(c => c.recordType === 'lead').length;
        counts.prospect = allData.filter(c => (c.recordType || 'prospect') === 'prospect').length;
      }

      setRecordTypeCounts(counts);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setContactsError(err.message);
    } finally {
      setContactsLoading(false);
    }
  }, [contactSearch, contactFilter, activeTab]);

  // Load data on mount and filter changes
  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadContacts();
    }
  }, [authLoading, isAdmin, activeTab, loadContacts]);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/unity-notes');
    }
  }, [authLoading, isAdmin, navigate]);

  // Archive contact
  const handleArchiveContact = async (contactId) => {
    if (!confirm('Are you sure you want to archive this contact?')) return;

    setActionLoading(prev => ({ ...prev, [contactId]: true }));
    try {
      await archiveContact(contactId, user?.email || 'admin');
      await loadContacts();
    } catch (err) {
      console.error('Failed to archive contact:', err);
      setContactsError(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [contactId]: false }));
    }
  };

  // Change record type
  const handleChangeRecordType = async (contactId, newType) => {
    setActionLoading(prev => ({ ...prev, [contactId]: true }));
    setTypeChangeDropdown(null);
    try {
      await changeRecordType(contactId, newType, user?.email || 'admin');
      await loadContacts();
    } catch (err) {
      console.error('Failed to change record type:', err);
      setContactsError(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [contactId]: false }));
    }
  };

  // Handle manual email import
  const handleManualImport = async () => {
    if (!manualEmails.trim()) return;

    setImportLoading(true);
    setImportResults(null);

    try {
      // Parse emails from text (comma, semicolon, newline, or space separated)
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = manualEmails.match(emailRegex) || [];
      const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase()))];

      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const email of uniqueEmails) {
        try {
          const result = await upsertContact({
            email,
            recordType: importRecordType,
            source: { original: 'manual_import', medium: 'admin' }
          });
          if (result.created) {
            created++;
          } else {
            updated++;
          }
        } catch (err) {
          console.error(`Failed to import ${email}:`, err);
          errors++;
        }
      }

      setImportResults({ total: uniqueEmails.length, created, updated, errors });

      // Reload contacts
      await loadContacts();
    } catch (err) {
      console.error('Manual import failed:', err);
      setImportResults({ error: err.message });
    } finally {
      setImportLoading(false);
    }
  };

  // Handle CSV file upload
  const handleCSVUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportResults(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      // Skip header if present
      const hasHeader = lines[0].toLowerCase().includes('email');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const line of dataLines) {
        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        const email = parts[0];
        const name = parts[1] || null;
        const company = parts[2] || null;
        const recordType = parts[3] || importRecordType;

        if (!email || !email.includes('@')) continue;

        try {
          const result = await upsertContact({
            email: email.toLowerCase(),
            name,
            company,
            recordType,
            source: { original: 'csv_import', medium: 'admin' }
          });
          if (result.created) {
            created++;
          } else {
            updated++;
          }
        } catch (err) {
          console.error(`Failed to import ${email}:`, err);
          errors++;
        }
      }

      setImportResults({ total: dataLines.length, created, updated, errors });
      await loadContacts();
    } catch (err) {
      console.error('CSV import failed:', err);
      setImportResults({ error: err.message });
    } finally {
      setImportLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  // Reset import modal state
  const closeImportModal = () => {
    setShowImportModal(false);
    setImportMode('options');
    setManualEmails('');
    setImportResults(null);
  };

  // Run migration to ensure all contacts have recordType and status
  const handleMigration = async () => {
    if (!confirm('This will update all contacts to ensure they have recordType and status fields. Continue?')) {
      return;
    }

    setMigrationLoading(true);
    setMigrationResults(null);

    try {
      const result = await migrateContactsToRecordType();
      setMigrationResults(result);
      // Reload contacts after migration
      await loadContacts();
    } catch (err) {
      console.error('Migration failed:', err);
      setMigrationResults({ error: err.message });
    } finally {
      setMigrationLoading(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(timestamp);
  };

  // Loading state
  if (authLoading) {
    return (
      <Layout
        hideParallaxCircle={true}
        hideCircleNav={true}
        sidebarVariant="standard"
        allowScroll={true}
        pageLabel="CONTACTS"
        onHomeClick={handleHomeClick}
        onFooterToggle={handleFooterToggle}
        onMenuToggle={handleMenuToggle}
        navigationItems={adminNavigationItems}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: COLORS.white,
          paddingTop: '80px',
          paddingLeft: '100px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: `3px solid ${COLORS.border}`,
            borderTopColor: COLORS.primary,
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout
      hideParallaxCircle={true}
      hideCircleNav={true}
      sidebarVariant="standard"
      allowScroll={true}
      pageLabel="CONTACTS"
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={adminNavigationItems}
    >
      <div style={{
        minHeight: '100vh',
        backgroundColor: COLORS.white,
        padding: '100px 40px 40px 120px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px'
          }}>
            <div>
              <h1 style={{
                color: COLORS.text,
                fontSize: '28px',
                fontWeight: '700',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Users style={{ color: COLORS.primary }} size={28} />
                Contact Dashboard
              </h1>
              <p style={{
                color: COLORS.textMuted,
                fontSize: '14px',
                marginTop: '8px'
              }}>
                Manage contacts and lead submissions
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate('/admin')}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ← Admin Hub
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Upload size={16} />
                Import
              </button>
              <button
                onClick={handleMigration}
                disabled={migrationLoading}
                title="Update all contacts to have recordType and status fields"
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: migrationLoading ? 0.5 : 1
                }}
              >
                <RefreshCw
                  size={16}
                  style={{
                    animation: migrationLoading ? 'spin 1s linear infinite' : 'none'
                  }}
                />
                {migrationLoading ? 'Migrating...' : 'Fix Data'}
              </button>
              <button
                onClick={() => loadContacts()}
                disabled={contactsLoading}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: contactsLoading ? 0.5 : 1
                }}
              >
                <RefreshCw
                  size={16}
                  style={{
                    animation: contactsLoading ? 'spin 1s linear infinite' : 'none'
                  }}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Collapsible Analytics Summary */}
          <AnalyticsSummary>
            {/* Pipeline Stats Card */}
            <PipelineStatsCard />

            {/* Email Performance Stats */}
            <EmailStatsCard />
          </AnalyticsSummary>

          {/* Tabs - 4-Tier CRM Taxonomy */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: `2px solid ${COLORS.border}`,
            paddingBottom: '16px',
            flexWrap: 'wrap'
          }}>
            {/* All Tab */}
            <button
              onClick={() => setActiveTab('all')}
              style={{
                ...styles.button,
                backgroundColor: activeTab === 'all' ? COLORS.primary : COLORS.cardBg,
                color: activeTab === 'all' ? '#000000' : COLORS.text,
                fontWeight: activeTab === 'all' ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Users size={16} />
              All ({recordTypeCounts.all})
            </button>

            {/* Clients Tab */}
            <button
              onClick={() => setActiveTab('client')}
              style={{
                ...styles.button,
                backgroundColor: activeTab === 'client' ? RECORD_TYPE_COLORS.client.bg : COLORS.cardBg,
                color: activeTab === 'client' ? RECORD_TYPE_COLORS.client.text : COLORS.text,
                fontWeight: activeTab === 'client' ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: activeTab === 'client' ? `2px solid ${RECORD_TYPE_COLORS.client.text}` : `2px solid transparent`
              }}
            >
              <Briefcase size={16} />
              Clients ({recordTypeCounts.client})
            </button>

            {/* Contacts Tab */}
            <button
              onClick={() => setActiveTab('contact')}
              style={{
                ...styles.button,
                backgroundColor: activeTab === 'contact' ? RECORD_TYPE_COLORS.contact.bg : COLORS.cardBg,
                color: activeTab === 'contact' ? RECORD_TYPE_COLORS.contact.text : COLORS.text,
                fontWeight: activeTab === 'contact' ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: activeTab === 'contact' ? `2px solid ${RECORD_TYPE_COLORS.contact.text}` : `2px solid transparent`
              }}
              title="Marketing opt-in, two-way permission"
            >
              <UserCheck size={16} />
              Contacts ({recordTypeCounts.contact})
            </button>

            {/* Leads Tab */}
            <button
              onClick={() => setActiveTab('lead')}
              style={{
                ...styles.button,
                backgroundColor: activeTab === 'lead' ? RECORD_TYPE_COLORS.lead.bg : COLORS.cardBg,
                color: activeTab === 'lead' ? RECORD_TYPE_COLORS.lead.text : COLORS.text,
                fontWeight: activeTab === 'lead' ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: activeTab === 'lead' ? `2px solid ${RECORD_TYPE_COLORS.lead.text}` : `2px solid transparent`
              }}
              title="Provided info without full opt-in"
            >
              <UserPlus size={16} />
              Leads ({recordTypeCounts.lead})
            </button>

            {/* Prospects Tab */}
            <button
              onClick={() => setActiveTab('prospect')}
              style={{
                ...styles.button,
                backgroundColor: activeTab === 'prospect' ? RECORD_TYPE_COLORS.prospect.bg : COLORS.cardBg,
                color: activeTab === 'prospect' ? RECORD_TYPE_COLORS.prospect.text : COLORS.text,
                fontWeight: activeTab === 'prospect' ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: activeTab === 'prospect' ? `2px solid ${RECORD_TYPE_COLORS.prospect.text}` : `2px solid transparent`
              }}
              title="Cold outreach targets"
            >
              <Target size={16} />
              Prospects ({recordTypeCounts.prospect})
            </button>
          </div>

          {/* Unified Contacts View */}
          <>
            {/* Search and Filters */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: COLORS.textLight
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadContacts()}
                  style={{
                    ...styles.input,
                    paddingLeft: '40px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}33`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = COLORS.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <select
                value={contactFilter.stage || ''}
                onChange={(e) => setContactFilter(prev => ({ ...prev, stage: e.target.value || null }))}
                style={styles.select}
              >
                <option value="">All Stages</option>
                <option value="new">New</option>
                <option value="nurturing">Nurturing</option>
                <option value="engaged">Engaged</option>
                <option value="qualified">Qualified</option>
                <option value="opportunity">Opportunity</option>
                <option value="customer">Customer</option>
              </select>

              <select
                value={contactFilter.pipeline || ''}
                onChange={(e) => setContactFilter(prev => ({ ...prev, pipeline: e.target.value || null }))}
                style={styles.select}
              >
                <option value="">All Pipelines</option>
                <option value="A">Pipeline A (Traditional)</option>
                <option value="B">Pipeline B (Digital-First)</option>
                <option value="AB">Dual Pipeline (A+B)</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="EXCLUDED_PE">PE Excluded</option>
                <option value="FLAGGED">Flagged for Review</option>
                <option value="PENDING">Pending Analysis</option>
              </select>
            </div>

              {/* Error */}
              {contactsError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '2px solid #fecaca',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <AlertTriangle size={20} style={{ color: COLORS.error, flexShrink: 0 }} />
                  <span style={{ color: COLORS.error, flex: 1 }}>{contactsError}</span>
                  <button
                    onClick={() => setContactsError(null)}
                    style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Migration Results */}
              {migrationResults && (
                <div style={{
                  backgroundColor: migrationResults.error ? '#fef2f2' : '#f0fdf4',
                  border: `2px solid ${migrationResults.error ? '#fecaca' : '#bbf7d0'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {migrationResults.error ? (
                    <>
                      <AlertTriangle size={20} style={{ color: COLORS.error, flexShrink: 0 }} />
                      <span style={{ color: COLORS.error, flex: 1 }}>Migration failed: {migrationResults.error}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} style={{ color: COLORS.success, flexShrink: 0 }} />
                      <span style={{ color: COLORS.success, flex: 1 }}>
                        Migration complete: {migrationResults.updated} updated, {migrationResults.skipped} already up-to-date
                        {migrationResults.errors > 0 && `, ${migrationResults.errors} errors`}
                      </span>
                    </>
                  )}
                  <button
                    onClick={() => setMigrationResults(null)}
                    style={{ color: migrationResults.error ? '#f87171' : '#4ade80', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Contacts List */}
              {contactsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      style={{
                        height: '80px',
                        borderRadius: '12px',
                        backgroundColor: COLORS.cardBg,
                        animation: 'pulse 2s ease-in-out infinite'
                      }}
                    />
                  ))}
                  <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; }}`}</style>
                </div>
              ) : contacts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  borderRadius: '12px',
                  backgroundColor: COLORS.cardBg,
                  border: `2px solid ${COLORS.border}`
                }}>
                  <Users size={48} style={{ color: COLORS.textLight, marginBottom: '16px' }} />
                  <h3 style={{ color: COLORS.text, fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    No Contacts Found
                  </h3>
                  <p style={{ color: COLORS.textMuted }}>
                    {contactSearch ? 'Try a different search term' : 'Contacts will appear here when leads are captured'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {contacts.map(contact => (
                    <div
                      key={contact.id}
                      style={styles.card}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = COLORS.primary;
                        e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.primary}22`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = COLORS.border;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          backgroundColor: COLORS.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000000',
                          fontWeight: '600',
                          fontSize: '16px',
                          flexShrink: 0
                        }}>
                          {(contact.name || contact.email || '?')[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <h3 style={{
                              color: COLORS.text,
                              fontSize: '15px',
                              fontWeight: '600',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {contact.name || contact.email}
                            </h3>
                            {/* Record Type Badge with Dropdown */}
                            <div style={{ position: 'relative' }}>
                              {(() => {
                                const recordType = contact.recordType || 'prospect';
                                const typeConfig = RECORD_TYPE_COLORS[recordType] || RECORD_TYPE_COLORS.prospect;
                                const TypeIcon = typeConfig.icon;
                                return (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTypeChangeDropdown(typeChangeDropdown === contact.id ? null : contact.id);
                                      }}
                                      style={{
                                        backgroundColor: typeConfig.bg,
                                        color: typeConfig.text,
                                        padding: '2px 8px',
                                        borderRadius: '9999px',
                                        fontSize: '11px',
                                        fontWeight: '500',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                      title="Click to change record type"
                                    >
                                      <TypeIcon size={12} />
                                      {recordType}
                                      <ChevronDown size={10} />
                                    </button>
                                    {typeChangeDropdown === contact.id && (
                                      <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        marginTop: '4px',
                                        backgroundColor: COLORS.white,
                                        border: `2px solid ${COLORS.border}`,
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        zIndex: 100,
                                        minWidth: '140px',
                                        overflow: 'hidden'
                                      }}>
                                        {Object.entries(RECORD_TYPE_COLORS).map(([type, config]) => {
                                          const Icon = config.icon;
                                          return (
                                            <button
                                              key={type}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleChangeRecordType(contact.id, type);
                                              }}
                                              disabled={type === recordType}
                                              style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                border: 'none',
                                                backgroundColor: type === recordType ? config.bg : 'transparent',
                                                color: type === recordType ? config.text : COLORS.text,
                                                cursor: type === recordType ? 'default' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '13px',
                                                textAlign: 'left'
                                              }}
                                              onMouseEnter={(e) => {
                                                if (type !== recordType) {
                                                  e.currentTarget.style.backgroundColor = config.bg;
                                                }
                                              }}
                                              onMouseLeave={(e) => {
                                                if (type !== recordType) {
                                                  e.currentTarget.style.backgroundColor = 'transparent';
                                                }
                                              }}
                                            >
                                              <Icon size={14} style={{ color: config.text }} />
                                              <span style={{ textTransform: 'capitalize' }}>{type}</span>
                                              {type === recordType && <CheckCircle size={12} style={{ marginLeft: 'auto' }} />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            {contact.stage && (
                              <span style={{
                                ...STAGE_COLORS[contact.stage] || STAGE_COLORS.new,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                {contact.stage}
                              </span>
                            )}
                            {/* Pipeline Assignment Badge */}
                            {contact.pipelineAssignment?.primaryPipeline && (
                              <span style={{
                                backgroundColor: contact.pipelineAssignment.primaryPipeline === 'A' ? '#dbeafe' :
                                                 contact.pipelineAssignment.primaryPipeline === 'B' ? '#f3e8ff' : '#e0e7ff',
                                color: contact.pipelineAssignment.primaryPipeline === 'A' ? '#1d4ed8' :
                                       contact.pipelineAssignment.primaryPipeline === 'B' ? '#7c3aed' : '#4f46e5',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                Pipeline {contact.pipelineAssignment.primaryPipeline}
                              </span>
                            )}
                            {/* PE Status Badge */}
                            {contact.pipelineAssignment?.pipelineAStatus === 'EXCLUDED_PE' && (
                              <span style={{
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                PE Excluded
                              </span>
                            )}
                            {contact.pipelineAssignment?.pipelineAStatus === 'FLAGGED' && (
                              <span style={{
                                backgroundColor: '#fef3c7',
                                color: '#d97706',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                Flagged
                              </span>
                            )}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '13px',
                            color: COLORS.textMuted,
                            marginTop: '4px'
                          }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {contact.email}
                            </span>
                            {contact.company && (
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                @ {contact.company}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        {contact.score !== undefined && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: COLORS.textMuted
                          }}>
                            <TrendingUp size={16} />
                            <span style={{ color: COLORS.text, fontWeight: '600' }}>{contact.score}</span>
                          </div>
                        )}

                        {/* Date */}
                        <div style={{
                          fontSize: '13px',
                          color: COLORS.textLight,
                          display: 'none'
                        }} className="hidden md:block">
                          {formatRelativeTime(contact.createdAt)}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => setDetailModal({ type: 'contact', data: contact })}
                            style={{
                              ...styles.button,
                              ...styles.secondaryButton,
                              padding: '8px'
                            }}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleArchiveContact(contact.id)}
                            disabled={actionLoading[contact.id]}
                            style={{
                              ...styles.button,
                              ...styles.secondaryButton,
                              padding: '8px',
                              opacity: actionLoading[contact.id] ? 0.5 : 1
                            }}
                            title="Archive"
                          >
                            {actionLoading[contact.id] ? (
                              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Archive size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => { setDetailModal(null); setShowPESignals(false); }}
        >
          <div
            style={{
              backgroundColor: COLORS.white,
              border: `2px solid ${COLORS.border}`,
              borderRadius: '16px',
              padding: '28px',
              maxWidth: showPESignals ? '900px' : '600px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              transition: 'max-width 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: `2px solid ${COLORS.border}`
            }}>
              <h2 style={{
                color: COLORS.text,
                fontSize: '20px',
                fontWeight: '700',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                {detailModal.type === 'contact' ? (
                  <>
                    <Users size={22} style={{ color: COLORS.primary }} />
                    Contact Details
                  </>
                ) : (
                  <>
                    <Inbox size={22} style={{ color: COLORS.primary }} />
                    Lead Details
                  </>
                )}
              </h2>
              <button
                onClick={() => { setDetailModal(null); setShowPESignals(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: COLORS.textMuted,
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Contact Details */}
            {detailModal.type === 'contact' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={styles.label}>Email</label>
                  <p style={{ color: COLORS.text, margin: 0 }}>{detailModal.data.email}</p>
                </div>
                {detailModal.data.name && (
                  <div>
                    <label style={styles.label}>Name</label>
                    <p style={{ color: COLORS.text, margin: 0 }}>{detailModal.data.name}</p>
                  </div>
                )}
                {detailModal.data.company && (
                  <div>
                    <label style={styles.label}>Company</label>
                    <p style={{ color: COLORS.text, margin: 0 }}>{detailModal.data.company}</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={styles.label}>Type</label>
                    <p style={{ color: COLORS.text, margin: 0 }}>{detailModal.data.type || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={styles.label}>Stage</label>
                    <p style={{ color: COLORS.text, margin: 0 }}>{detailModal.data.stage || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={styles.label}>Score</label>
                    <p style={{ color: COLORS.text, margin: 0 }}>{detailModal.data.score ?? 'N/A'}</p>
                  </div>
                  <div>
                    <label style={styles.label}>Created</label>
                    <p style={{ color: COLORS.text, margin: 0 }}>{formatDate(detailModal.data.createdAt)}</p>
                  </div>
                </div>

                {/* Engagement Stats */}
                <div>
                  <label style={styles.label}>Email Engagement</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginTop: '8px'
                  }}>
                    <div style={{
                      backgroundColor: '#dbeafe',
                      padding: '12px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <Send size={16} style={{ color: '#1d4ed8', marginBottom: '4px' }} />
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#1d4ed8' }}>
                        {detailModal.data.engagement?.emailsSent || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: '#3b82f6' }}>Sent</div>
                    </div>
                    <div style={{
                      backgroundColor: '#dcfce7',
                      padding: '12px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <Eye size={16} style={{ color: '#15803d', marginBottom: '4px' }} />
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#15803d' }}>
                        {detailModal.data.engagement?.emailsOpened || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: '#22c55e' }}>Opened</div>
                    </div>
                    <div style={{
                      backgroundColor: '#fef3c7',
                      padding: '12px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <MousePointer size={16} style={{ color: '#d97706', marginBottom: '4px' }} />
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#d97706' }}>
                        {detailModal.data.engagement?.emailsClicked || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: '#f59e0b' }}>Clicked</div>
                    </div>
                  </div>
                </div>

                {/* Journey Status */}
                {(detailModal.data.journey || detailModal.data.currentJourney || detailModal.data.journeys?.active?.length > 0) && (
                  <div>
                    <label style={styles.label}>Journey Status</label>
                    <div style={{
                      backgroundColor: COLORS.cardBg,
                      padding: '14px',
                      borderRadius: '8px',
                      marginTop: '8px',
                      border: `1px solid ${COLORS.border}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Activity size={16} style={{ color: COLORS.primary }} />
                        <span style={{ fontWeight: '600', color: COLORS.text }}>
                          {detailModal.data.currentJourney?.journeyId || detailModal.data.journey?.name || detailModal.data.journeys?.active?.[0] || 'Welcome Journey'}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: (detailModal.data.currentJourney?.status || detailModal.data.journey?.status) === 'completed' ? '#dcfce7' :
                                          (detailModal.data.currentJourney?.status || detailModal.data.journey?.status) === 'email_sent' ? '#fef3c7' : '#dbeafe',
                          color: (detailModal.data.currentJourney?.status || detailModal.data.journey?.status) === 'completed' ? '#15803d' :
                                 (detailModal.data.currentJourney?.status || detailModal.data.journey?.status) === 'email_sent' ? '#d97706' : '#1d4ed8'
                        }}>
                          {detailModal.data.currentJourney?.status || detailModal.data.journey?.status || 'active'}
                        </span>
                        {/* A/B/C Variant Badge */}
                        {detailModal.data.currentJourney?.variant && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: '#f3e8ff',
                            color: '#7c3aed'
                          }}>
                            Variant {detailModal.data.currentJourney.variant}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: COLORS.textMuted }}>
                        Current Node: {detailModal.data.currentJourney?.currentNodeId || detailModal.data.journey?.currentNode || 'N/A'}
                      </div>
                      {/* Email Sent Info for Outbound */}
                      {detailModal.data.currentJourney?.emailSentAt && (
                        <div style={{ fontSize: '12px', color: '#d97706', marginTop: '4px' }}>
                          📧 Email sent: {formatDate(detailModal.data.currentJourney.emailSentAt)}
                        </div>
                      )}
                      {(detailModal.data.currentJourney?.enteredAt || detailModal.data.journey?.enrolledAt) && (
                        <div style={{ fontSize: '12px', color: COLORS.textLight, marginTop: '4px' }}>
                          Enrolled: {formatDate(detailModal.data.currentJourney?.enteredAt || detailModal.data.journey?.enrolledAt)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Assessment Data */}
                {detailModal.data.assessment && (
                  <div>
                    <label style={styles.label}>Assessment Results</label>
                    <div style={{
                      backgroundColor: COLORS.cardBg,
                      padding: '14px',
                      borderRadius: '8px',
                      marginTop: '8px',
                      border: `1px solid ${COLORS.border}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: detailModal.data.assessment.score >= 70 ? '#dcfce7' :
                                          detailModal.data.assessment.score >= 40 ? '#fef3c7' : '#fee2e2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Target size={24} style={{
                            color: detailModal.data.assessment.score >= 70 ? '#15803d' :
                                   detailModal.data.assessment.score >= 40 ? '#d97706' : '#dc2626'
                          }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: COLORS.text }}>
                            {detailModal.data.assessment.score}/100
                          </div>
                          <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
                            {detailModal.data.assessment.level || 'GTM Health Score'}
                          </div>
                        </div>
                      </div>
                      {detailModal.data.assessment.recommendations?.length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: COLORS.textMuted, marginBottom: '6px' }}>
                            RECOMMENDATIONS
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: COLORS.text }}>
                            {detailModal.data.assessment.recommendations.slice(0, 3).map((rec, i) => (
                              <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PE Signals Section */}
                {(detailModal.data.peSignals || detailModal.data.pipelineAssignment) && (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <label style={styles.label}>Pipeline Analysis</label>
                      <button
                        onClick={() => setShowPESignals(!showPESignals)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: COLORS.primary,
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {showPESignals ? 'Hide' : 'Show'} PE Signals
                        <ChevronDown
                          size={14}
                          style={{
                            transform: showPESignals ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        />
                      </button>
                    </div>

                    {/* Quick Pipeline Summary */}
                    {detailModal.data.pipelineAssignment && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                        marginBottom: showPESignals ? '16px' : '0'
                      }}>
                        <div style={{
                          backgroundColor: '#dbeafe',
                          padding: '10px',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '11px', color: '#3b82f6', marginBottom: '2px' }}>Pipeline</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8' }}>
                            {detailModal.data.pipelineAssignment.primaryPipeline || '-'}
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: detailModal.data.pipelineAssignment.pipelineAStatus === 'QUALIFIED' ? '#dcfce7' :
                                          detailModal.data.pipelineAssignment.pipelineAStatus === 'EXCLUDED_PE' ? '#fee2e2' :
                                          detailModal.data.pipelineAssignment.pipelineAStatus === 'FLAGGED' ? '#fef3c7' : '#f3f4f6',
                          padding: '10px',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Status</div>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '700',
                            color: detailModal.data.pipelineAssignment.pipelineAStatus === 'QUALIFIED' ? '#15803d' :
                                   detailModal.data.pipelineAssignment.pipelineAStatus === 'EXCLUDED_PE' ? '#dc2626' :
                                   detailModal.data.pipelineAssignment.pipelineAStatus === 'FLAGGED' ? '#d97706' : '#6b7280'
                          }}>
                            {detailModal.data.pipelineAssignment.pipelineAStatus || 'PENDING'}
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: '#f3f4f6',
                          padding: '10px',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>A Score</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>
                            {detailModal.data.pipelineAssignment.pipelineAScore?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: '#f3f4f6',
                          padding: '10px',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>B Score</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>
                            {detailModal.data.pipelineAssignment.pipelineBScore?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PE Exclusion Reason */}
                    {detailModal.data.pipelineAssignment?.peExclusionReason && (
                      <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        marginBottom: showPESignals ? '16px' : '0',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <AlertTriangle size={16} />
                        <span><strong>Exclusion Reason:</strong> {detailModal.data.pipelineAssignment.peExclusionReason}</span>
                      </div>
                    )}

                    {/* Full PE Signals Panel */}
                    {showPESignals && (
                      <PESignalsPanel
                        contact={detailModal.data}
                        onClose={() => setShowPESignals(false)}
                      />
                    )}
                  </div>
                )}

                {detailModal.data.tags?.length > 0 && (
                  <div>
                    <label style={styles.label}>Tags</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {detailModal.data.tags.map((tag, i) => (
                        <span
                          key={i}
                          style={{
                            backgroundColor: COLORS.cardBg,
                            color: COLORS.text,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            border: `1px solid ${COLORS.border}`
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lifecycle Timeline */}
                {detailModal.data.lifecycle?.length > 0 && (
                  <div>
                    <label style={styles.label}>Lifecycle Timeline</label>
                    <div style={{
                      marginTop: '8px',
                      borderLeft: `2px solid ${COLORS.border}`,
                      paddingLeft: '16px'
                    }}>
                      {detailModal.data.lifecycle.map((event, i) => (
                        <div key={i} style={{ position: 'relative', paddingBottom: '16px' }}>
                          <div style={{
                            position: 'absolute',
                            left: '-21px',
                            top: '2px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: i === 0 ? COLORS.primary : COLORS.border
                          }} />
                          <div style={{ fontSize: '13px', fontWeight: '500', color: COLORS.text }}>
                            {event.action}
                          </div>
                          <div style={{ fontSize: '12px', color: COLORS.textLight }}>
                            {formatRelativeTime(event.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailModal.data.source && (
                  <div>
                    <label style={styles.label}>Source</label>
                    <p style={{ color: COLORS.text, margin: 0 }}>
                      {detailModal.data.source.original || 'Unknown'}
                      {detailModal.data.source.medium && ` (${detailModal.data.source.medium})`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Lead Details */}
            {detailModal.type === 'lead' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={styles.label}>Email</label>
                  <p style={{ color: COLORS.text, margin: 0 }}>{detailModal.data.email}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={styles.label}>Status</label>
                    <p style={{ color: COLORS.text, margin: 0 }}>{detailModal.data.status}</p>
                  </div>
                  <div>
                    <label style={styles.label}>Source</label>
                    <p style={{ color: COLORS.text, margin: 0 }}>{detailModal.data.source || 'Unknown'}</p>
                  </div>
                  <div>
                    <label style={styles.label}>Source Tool</label>
                    <p style={{ color: COLORS.text, margin: 0 }}>{detailModal.data.sourceTool || 'N/A'}</p>
                  </div>
                  <div>
                    <label style={styles.label}>Captured</label>
                    <p style={{ color: COLORS.text, margin: 0 }}>{formatDate(detailModal.data.capturedAt)}</p>
                  </div>
                </div>
                {detailModal.data.submittedData && Object.keys(detailModal.data.submittedData).length > 0 && (
                  <div>
                    <label style={styles.label}>Submitted Data</label>
                    <pre style={{
                      backgroundColor: COLORS.cardBg,
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      overflow: 'auto',
                      color: COLORS.text,
                      border: `1px solid ${COLORS.border}`,
                      marginTop: '8px'
                    }}>
                      {JSON.stringify(detailModal.data.submittedData, null, 2)}
                    </pre>
                  </div>
                )}
                {detailModal.data.resolution && (
                  <div>
                    <label style={styles.label}>Resolution</label>
                    <pre style={{
                      backgroundColor: COLORS.cardBg,
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      overflow: 'auto',
                      color: COLORS.text,
                      border: `1px solid ${COLORS.border}`,
                      marginTop: '8px'
                    }}>
                      {JSON.stringify(detailModal.data.resolution, null, 2)}
                    </pre>
                  </div>
                )}
                {detailModal.data.triggers && (
                  <div>
                    <label style={styles.label}>Trigger Results</label>
                    <div style={{
                      backgroundColor: COLORS.cardBg,
                      padding: '14px',
                      borderRadius: '8px',
                      marginTop: '8px',
                      border: `1px solid ${COLORS.border}`
                    }}>
                      <p style={{ color: COLORS.text, margin: '0 0 4px 0', fontSize: '13px' }}>
                        Rules Evaluated: {detailModal.data.triggers.rulesEvaluated || 0}
                      </p>
                      <p style={{ color: COLORS.text, margin: '0 0 4px 0', fontSize: '13px' }}>
                        Rules Matched: {detailModal.data.triggers.rulesMatched || 0}
                      </p>
                      <p style={{ color: COLORS.text, margin: 0, fontSize: '13px' }}>
                        Actions Executed: {detailModal.data.triggers.actionsExecuted || 0}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: `2px solid ${COLORS.border}`,
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => { setDetailModal(null); setShowPESignals(false); }}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Import Modal */}
      {showImportModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={closeImportModal}
        >
          <div
            style={{
              backgroundColor: COLORS.white,
              border: `2px solid ${COLORS.border}`,
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '550px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: `2px solid ${COLORS.border}`
            }}>
              <h2 style={{
                color: COLORS.text,
                fontSize: '20px',
                fontWeight: '700',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                {importMode === 'options' && <Upload size={22} style={{ color: COLORS.primary }} />}
                {importMode === 'csv' && <Upload size={22} style={{ color: '#1d4ed8' }} />}
                {importMode === 'manual' && <UserPlus size={22} style={{ color: '#15803d' }} />}
                {importMode === 'options' ? 'Import Contacts' :
                 importMode === 'csv' ? 'Upload CSV File' : 'Manually Add Contacts'}
              </h2>
              <button
                onClick={closeImportModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: COLORS.textMuted,
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Import Results */}
            {importResults && (
              <div style={{
                backgroundColor: importResults.error ? '#fef2f2' : '#dcfce7',
                border: `2px solid ${importResults.error ? '#fecaca' : '#86efac'}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                {importResults.error ? (
                  <div style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} />
                    <span>Error: {importResults.error}</span>
                  </div>
                ) : (
                  <div style={{ color: '#15803d' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Import Complete</div>
                    <div style={{ fontSize: '14px' }}>
                      {importResults.created} created, {importResults.updated} updated
                      {importResults.errors > 0 && `, ${importResults.errors} errors`}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Options Mode */}
            {importMode === 'options' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: 0 }}>
                  Choose how you want to import contacts:
                </p>

                {/* CSV Upload Option */}
                <div
                  onClick={() => setImportMode('csv')}
                  style={{
                    ...styles.card,
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.primary;
                    e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.primary}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Upload size={24} style={{ color: '#1d4ed8' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: COLORS.text, fontSize: '15px', fontWeight: '600', margin: 0 }}>
                      Upload CSV File
                    </h3>
                    <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '4px 0 0' }}>
                      Import from CSV with email, name, company columns
                    </p>
                  </div>
                  <ChevronRight size={20} style={{ color: COLORS.textLight }} />
                </div>

                {/* Manual Entry Option */}
                <div
                  onClick={() => setImportMode('manual')}
                  style={{
                    ...styles.card,
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.primary;
                    e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.primary}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserPlus size={24} style={{ color: '#15803d' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: COLORS.text, fontSize: '15px', fontWeight: '600', margin: 0 }}>
                      Manually Add Contacts
                    </h3>
                    <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '4px 0 0' }}>
                      Paste emails (comma or newline separated)
                    </p>
                  </div>
                  <ChevronRight size={20} style={{ color: COLORS.textLight }} />
                </div>
              </div>
            )}

            {/* CSV Upload Mode */}
            {importMode === 'csv' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Record Type Selector */}
                <div>
                  <label style={styles.label}>Default Record Type</label>
                  <select
                    value={importRecordType}
                    onChange={(e) => setImportRecordType(e.target.value)}
                    style={{ ...styles.select, width: '100%' }}
                  >
                    <option value="prospect">Prospect</option>
                    <option value="lead">Lead</option>
                    <option value="contact">Contact</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                {/* File Upload Area */}
                <div
                  style={{
                    border: `2px dashed ${COLORS.border}`,
                    borderRadius: '12px',
                    padding: '32px',
                    textAlign: 'center',
                    backgroundColor: COLORS.cardBg,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => document.getElementById('csv-file-input').click()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.primary;
                    e.currentTarget.style.backgroundColor = '#fef9e7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.backgroundColor = COLORS.cardBg;
                  }}
                >
                  <Upload size={32} style={{ color: COLORS.textMuted, marginBottom: '12px' }} />
                  <p style={{ color: COLORS.text, fontWeight: '500', margin: '0 0 8px' }}>
                    Click to upload CSV file
                  </p>
                  <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: 0 }}>
                    Columns: email, name, company, recordType
                  </p>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleCSVUpload}
                    disabled={importLoading}
                  />
                </div>

                {/* Download Template */}
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: COLORS.cardBg,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Download size={16} style={{ color: COLORS.textMuted }} />
                  <span style={{ fontSize: '13px', color: COLORS.textMuted }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const template = 'email,name,company,recordType\nexample@email.com,John Doe,Acme Inc,prospect\njane@company.com,Jane Smith,Beta LLC,lead';
                        const blob = new Blob([template], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'contact_import_template.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      style={{ color: COLORS.primary, textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      Download CSV template
                    </a>
                  </span>
                </div>
              </div>
            )}

            {/* Manual Entry Mode */}
            {importMode === 'manual' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Record Type Selector */}
                <div>
                  <label style={styles.label}>Record Type</label>
                  <select
                    value={importRecordType}
                    onChange={(e) => setImportRecordType(e.target.value)}
                    style={{ ...styles.select, width: '100%' }}
                  >
                    <option value="prospect">Prospect</option>
                    <option value="lead">Lead</option>
                    <option value="contact">Contact</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                {/* Email Input */}
                <div>
                  <label style={styles.label}>Email Addresses</label>
                  <textarea
                    value={manualEmails}
                    onChange={(e) => setManualEmails(e.target.value)}
                    placeholder="Enter emails (one per line, or comma/space separated)&#10;&#10;Example:&#10;john@example.com&#10;jane@company.com, bob@startup.io"
                    style={{
                      ...styles.input,
                      minHeight: '150px',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                      fontSize: '13px'
                    }}
                  />
                  <p style={{ color: COLORS.textMuted, fontSize: '12px', marginTop: '8px' }}>
                    Supports comma, semicolon, space, or newline separated emails
                  </p>
                </div>

                {/* Preview Count */}
                {manualEmails && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: COLORS.cardBg,
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: COLORS.text
                  }}>
                    {(() => {
                      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
                      const emails = manualEmails.match(emailRegex) || [];
                      const unique = [...new Set(emails.map(e => e.toLowerCase()))];
                      return `${unique.length} email${unique.length !== 1 ? 's' : ''} detected`;
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: `2px solid ${COLORS.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              {importMode !== 'options' && (
                <button
                  onClick={() => {
                    setImportMode('options');
                    setImportResults(null);
                  }}
                  style={{
                    ...styles.button,
                    ...styles.secondaryButton
                  }}
                >
                  ← Back
                </button>
              )}
              <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                <button
                  onClick={closeImportModal}
                  style={{
                    ...styles.button,
                    ...styles.secondaryButton
                  }}
                >
                  {importResults ? 'Close' : 'Cancel'}
                </button>
                {importMode === 'manual' && !importResults && (
                  <button
                    onClick={handleManualImport}
                    disabled={importLoading || !manualEmails.trim()}
                    style={{
                      ...styles.button,
                      ...styles.primaryButton,
                      opacity: (importLoading || !manualEmails.trim()) ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {importLoading ? (
                      <>
                        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Importing...
                      </>
                    ) : (
                      'Import Contacts'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Click-away listener for dropdown */}
      {typeChangeDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99
          }}
          onClick={() => setTypeChangeDropdown(null)}
        />
      )}
    </Layout>
  );
};

export default ContactDashboardPage;
