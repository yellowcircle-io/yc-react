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
  archiveContact
} from '../../utils/firestoreContacts';
import {
  listLeads
} from '../../utils/firestoreLeads';
import PipelineStatsCard from '../../components/admin/PipelineStatsCard';
import EmailStatsCard from '../../components/admin/EmailStatsCard';
import AnalyticsSummary from '../../components/admin/AnalyticsSummary';
import PESignalsPanel from '../../components/admin/PESignalsPanel';
import {
  Users,
  UserPlus,
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
  BarChart3
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

// Type colors
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

  // Tab state
  const [activeTab, setActiveTab] = useState('contacts');

  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState(null);
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilter, setContactFilter] = useState({ type: null, stage: null, pipeline: null });

  // PE Signals panel state
  const [showPESignals, setShowPESignals] = useState(false);

  // Leads state
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState(null);
  const [leadFilter, setLeadFilter] = useState({ status: null, source: null });

  // Detail modal
  const [detailModal, setDetailModal] = useState(null);

  // Action loading
  const [actionLoading, setActionLoading] = useState({});

  // Layout callbacks
  const handleHomeClick = () => navigate('/');
  const handleFooterToggle = () => {};
  const handleMenuToggle = () => {};

  // Load contacts
  const loadContacts = useCallback(async () => {
    try {
      setContactsLoading(true);
      setContactsError(null);

      let result;
      if (contactSearch.trim()) {
        result = await searchContacts(contactSearch.trim());
      } else {
        result = await listContacts({
          type: contactFilter.type,
          stage: contactFilter.stage,
          limit: 50
        });
      }

      setContacts(result.contacts || result || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setContactsError(err.message);
    } finally {
      setContactsLoading(false);
    }
  }, [contactSearch, contactFilter]);

  // Load leads
  const loadLeads = useCallback(async () => {
    try {
      setLeadsLoading(true);
      setLeadsError(null);

      const result = await listLeads({
        status: leadFilter.status,
        source: leadFilter.source,
        limit: 50
      });

      setLeads(result.leads || result || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
      setLeadsError(err.message);
    } finally {
      setLeadsLoading(false);
    }
  }, [leadFilter]);

  // Load data on mount and filter changes
  useEffect(() => {
    if (!authLoading && isAdmin) {
      if (activeTab === 'contacts') {
        loadContacts();
      } else {
        loadLeads();
      }
    }
  }, [authLoading, isAdmin, activeTab, loadContacts, loadLeads]);

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
                onClick={() => activeTab === 'contacts' ? loadContacts() : loadLeads()}
                disabled={contactsLoading || leadsLoading}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: (contactsLoading || leadsLoading) ? 0.5 : 1
                }}
              >
                <RefreshCw
                  size={16}
                  style={{
                    animation: (contactsLoading || leadsLoading) ? 'spin 1s linear infinite' : 'none'
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

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: `2px solid ${COLORS.border}`,
            paddingBottom: '16px'
          }}>
            <button
              onClick={() => setActiveTab('contacts')}
              style={{
                ...styles.button,
                backgroundColor: activeTab === 'contacts' ? COLORS.primary : COLORS.cardBg,
                color: activeTab === 'contacts' ? '#000000' : COLORS.text,
                fontWeight: activeTab === 'contacts' ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Users size={16} />
              Contacts ({contacts.length})
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              style={{
                ...styles.button,
                backgroundColor: activeTab === 'leads' ? COLORS.primary : COLORS.cardBg,
                color: activeTab === 'leads' ? '#000000' : COLORS.text,
                fontWeight: activeTab === 'leads' ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Inbox size={16} />
              Leads ({leads.length})
            </button>
          </div>

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
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
                  value={contactFilter.type || ''}
                  onChange={(e) => setContactFilter(prev => ({ ...prev, type: e.target.value || null }))}
                  style={styles.select}
                >
                  <option value="">All Types</option>
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="client">Client</option>
                  <option value="partner">Partner</option>
                </select>

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
                            {contact.type && (
                              <span style={{
                                ...TYPE_COLORS[contact.type] || TYPE_COLORS.other,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                {contact.type}
                              </span>
                            )}
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
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <>
              {/* Filters */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <select
                  value={leadFilter.status || ''}
                  onChange={(e) => setLeadFilter(prev => ({ ...prev, status: e.target.value || null }))}
                  style={styles.select}
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="processing">Processing</option>
                  <option value="resolved">Resolved</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="error">Error</option>
                </select>

                <select
                  value={leadFilter.source || ''}
                  onChange={(e) => setLeadFilter(prev => ({ ...prev, source: e.target.value || null }))}
                  style={styles.select}
                >
                  <option value="">All Sources</option>
                  <option value="lead_gate">Lead Gate</option>
                  <option value="contact_form">Contact Form</option>
                  <option value="assessment">Assessment</option>
                  <option value="footer">Footer</option>
                  <option value="outreach_tool">Outreach Tool</option>
                </select>
              </div>

              {/* Error */}
              {leadsError && (
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
                  <span style={{ color: COLORS.error, flex: 1 }}>{leadsError}</span>
                  <button
                    onClick={() => setLeadsError(null)}
                    style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Leads List */}
              {leadsLoading ? (
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
                </div>
              ) : leads.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  borderRadius: '12px',
                  backgroundColor: COLORS.cardBg,
                  border: `2px solid ${COLORS.border}`
                }}>
                  <Inbox size={48} style={{ color: COLORS.textLight, marginBottom: '16px' }} />
                  <h3 style={{ color: COLORS.text, fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    No Leads Found
                  </h3>
                  <p style={{ color: COLORS.textMuted }}>
                    Lead submissions will appear here
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {leads.map(lead => {
                    const statusConfig = LEAD_STATUS_COLORS[lead.status] || LEAD_STATUS_COLORS.new;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={lead.id}
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
                          {/* Status Icon */}
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            backgroundColor: statusConfig.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <StatusIcon size={20} style={{ color: statusConfig.text }} />
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
                                {lead.email}
                              </h3>
                              <span style={{
                                backgroundColor: statusConfig.bg,
                                color: statusConfig.text,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                {lead.status}
                              </span>
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '13px',
                              color: COLORS.textMuted,
                              marginTop: '4px'
                            }}>
                              <span>Source: {lead.source || 'Unknown'}</span>
                              {lead.sourceTool && (
                                <span>Tool: {lead.sourceTool}</span>
                              )}
                            </div>
                          </div>

                          {/* Date */}
                          <div style={{
                            fontSize: '13px',
                            color: COLORS.textLight
                          }}>
                            {formatRelativeTime(lead.capturedAt)}
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => setDetailModal({ type: 'lead', data: lead })}
                              style={{
                                ...styles.button,
                                ...styles.secondaryButton,
                                padding: '8px'
                              }}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
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
                {detailModal.data.journey && (
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
                          {detailModal.data.journey.name || 'Welcome Journey'}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: detailModal.data.journey.status === 'completed' ? '#dcfce7' : '#dbeafe',
                          color: detailModal.data.journey.status === 'completed' ? '#15803d' : '#1d4ed8'
                        }}>
                          {detailModal.data.journey.status || 'active'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: COLORS.textMuted }}>
                        Current Node: {detailModal.data.journey.currentNode || 'N/A'}
                      </div>
                      {detailModal.data.journey.enrolledAt && (
                        <div style={{ fontSize: '12px', color: COLORS.textLight, marginTop: '4px' }}>
                          Enrolled: {formatDate(detailModal.data.journey.enrolledAt)}
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
    </Layout>
  );
};

export default ContactDashboardPage;
