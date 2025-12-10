/**
 * Trigger Rules Admin Page
 *
 * Admin-only interface to manage automation trigger rules
 * for the lead-to-journey pipeline.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/global/Layout';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  listTriggerRules,
  saveTriggerRule,
  enableTriggerRule,
  disableTriggerRule,
  deleteTriggerRule,
  createWelcomeSequenceRule,
  createAssessmentFollowupRule,
  createFooterSignupRule,
  createTriggerRuleObject
} from '../../utils/firestoreTriggers';
import {
  Play,
  Pause,
  Trash2,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  AlertTriangle,
  Zap,
  Mail,
  Tag,
  Bell,
  ArrowRight,
  RefreshCw,
  Users,
  Home
} from 'lucide-react';

// Brand colors
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
  white: '#ffffff'
};

// Action type icons
const ACTION_ICONS = {
  enroll_journey: Mail,
  add_tag: Tag,
  update_score: Zap,
  notify_slack: Bell,
  send_webhook: ArrowRight
};

// Condition operators for display
const OPERATOR_LABELS = {
  equals: '=',
  not_equals: '≠',
  contains: 'contains',
  not_contains: 'not contains',
  starts_with: 'starts with',
  ends_with: 'ends with',
  greater_than: '>',
  less_than: '<',
  exists: 'exists',
  not_exists: 'not exists',
  in: 'in'
};

// Import shared admin navigation
import { adminNavigationItems } from '../../config/adminNavigationItems';

// Shared input styles
const inputStyles = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '14px',
  color: COLORS.text,
  border: `2px solid ${COLORS.border}`,
  borderRadius: '8px',
  backgroundColor: COLORS.inputBg,
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
  outline: 'none'
};

// Shared button styles
const buttonPrimary = {
  padding: '12px 20px',
  fontSize: '14px',
  fontWeight: '600',
  letterSpacing: '0.02em',
  color: COLORS.text,
  backgroundColor: COLORS.primary,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const buttonSecondary = {
  padding: '12px 20px',
  fontSize: '14px',
  fontWeight: '500',
  color: COLORS.textMuted,
  backgroundColor: COLORS.inputBg,
  border: `2px solid ${COLORS.border}`,
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const TriggerRulesPage = () => {
  const navigate = useNavigate();
  const { sidebarOpen } = useLayout();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRules, setExpandedRules] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRuleTemplate, setNewRuleTemplate] = useState('welcome');

  // Load rules on mount
  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRules = await listTriggerRules();
      setRules(fetchedRules);
    } catch (err) {
      console.error('Failed to load trigger rules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadRules();
    }
  }, [authLoading, isAdmin, loadRules]);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

  // Toggle rule expansion
  const toggleExpanded = (ruleId) => {
    setExpandedRules(prev => ({
      ...prev,
      [ruleId]: !prev[ruleId]
    }));
  };

  // Enable/disable rule
  const handleToggleEnabled = async (rule) => {
    const ruleId = rule.id;
    setActionLoading(prev => ({ ...prev, [ruleId]: true }));

    try {
      if (rule.enabled) {
        await disableTriggerRule(ruleId, user?.email || 'admin');
      } else {
        await enableTriggerRule(ruleId, user?.email || 'admin');
      }
      await loadRules();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
      setError(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [ruleId]: false }));
    }
  };

  // Delete rule
  const handleDelete = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this trigger rule?')) return;

    setActionLoading(prev => ({ ...prev, [ruleId]: true }));

    try {
      await deleteTriggerRule(ruleId);
      await loadRules();
    } catch (err) {
      console.error('Failed to delete rule:', err);
      setError(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [ruleId]: false }));
    }
  };

  // Create new rule from template
  const handleCreateRule = async () => {
    setActionLoading(prev => ({ ...prev, create: true }));

    try {
      let newRule;

      switch (newRuleTemplate) {
        case 'welcome':
          newRule = createWelcomeSequenceRule('placeholder-journey-id');
          break;
        case 'assessment':
          newRule = createAssessmentFollowupRule('placeholder-journey-id');
          break;
        case 'footer':
          newRule = createFooterSignupRule();
          break;
        case 'custom':
          newRule = createTriggerRuleObject({
            id: `rule-custom-${Date.now()}`,
            name: 'Custom Rule',
            description: 'Configure this rule manually',
            triggerType: 'lead_created',
            conditions: [],
            actions: []
          });
          break;
        default:
          newRule = createFooterSignupRule();
      }

      await saveTriggerRule(newRule, user?.email || 'admin');
      setShowCreateModal(false);
      await loadRules();

      // Expand the new rule
      setExpandedRules(prev => ({ ...prev, [newRule.id]: true }));
    } catch (err) {
      console.error('Failed to create rule:', err);
      setError(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, create: false }));
    }
  };

  // Layout handlers
  const handleHomeClick = () => navigate('/');
  const handleFooterToggle = () => {};
  const handleMenuToggle = () => {};

  if (authLoading) {
    return (
      <Layout
        hideParallaxCircle={true}
        hideCircleNav={true}
        sidebarVariant="standard"
        allowScroll={true}
        pageLabel="TRIGGERS"
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
            border: `3px solid ${COLORS.border}`,
            borderTopColor: COLORS.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
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
      pageLabel="TRIGGERS"
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={adminNavigationItems}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '100px 24px 40px 120px',
        minHeight: '100vh',
        backgroundColor: COLORS.white
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: COLORS.text,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: 0
            }}>
              <Zap style={{ color: COLORS.primary }} size={28} />
              Trigger Rules
            </h1>
            <p style={{ color: COLORS.textMuted, marginTop: '8px', fontSize: '15px' }}>
              Automate lead processing and journey enrollment
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/admin')}
              style={buttonSecondary}
            >
              ← Admin Hub
            </button>
            <button
              onClick={loadRules}
              disabled={loading}
              style={{
                ...buttonSecondary,
                padding: '10px',
                opacity: loading ? 0.5 : 1
              }}
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              style={buttonPrimary}
            >
              <Plus size={18} />
              New Rule
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: COLORS.error,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertTriangle size={20} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.error }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Rules list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  height: '80px',
                  borderRadius: '12px',
                  backgroundColor: COLORS.inputBg,
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            borderRadius: '12px',
            backgroundColor: COLORS.inputBg,
            border: `2px dashed ${COLORS.border}`
          }}>
            <Zap size={48} style={{ color: COLORS.textLight, marginBottom: '16px' }} />
            <h3 style={{ color: COLORS.text, fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No Trigger Rules
            </h3>
            <p style={{ color: COLORS.textMuted, marginBottom: '24px' }}>
              Create your first rule to automate lead processing
            </p>
            <button onClick={() => setShowCreateModal(true)} style={buttonPrimary}>
              <Plus size={18} />
              Create Rule
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rules.map(rule => (
              <div
                key={rule.id}
                style={{
                  borderRadius: '12px',
                  border: rule.enabled ? `2px solid ${COLORS.primary}` : `2px solid ${COLORS.border}`,
                  backgroundColor: COLORS.white,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Rule header */}
                <div style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <button
                    onClick={() => toggleExpanded(rule.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: COLORS.textMuted
                    }}
                  >
                    {expandedRules[rule.id] ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: COLORS.text,
                        margin: 0
                      }}>
                        {rule.name}
                      </h3>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: rule.enabled ? '#dcfce7' : COLORS.inputBg,
                        color: rule.enabled ? COLORS.success : COLORS.textMuted
                      }}>
                        {rule.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: COLORS.textMuted,
                      margin: '4px 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {rule.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'none',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '13px',
                    color: COLORS.textMuted
                  }} className="sm-flex">
                    <span>{rule.stats?.totalExecutions || 0} runs</span>
                    {rule.stats?.consecutiveErrors > 0 && (
                      <span style={{ color: COLORS.error }}>
                        {rule.stats.consecutiveErrors} errors
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleEnabled(rule)}
                      disabled={actionLoading[rule.id]}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: rule.enabled ? 'rgba(251, 191, 36, 0.15)' : COLORS.inputBg,
                        color: rule.enabled ? COLORS.primaryDark : COLORS.textMuted,
                        transition: 'all 0.2s ease'
                      }}
                      title={rule.enabled ? 'Disable' : 'Enable'}
                    >
                      {actionLoading[rule.id] ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : rule.enabled ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={actionLoading[rule.id]}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: COLORS.inputBg,
                        color: COLORS.textMuted,
                        transition: 'all 0.2s ease'
                      }}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedRules[rule.id] && (
                  <div style={{
                    padding: '20px',
                    borderTop: `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.inputBg
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '24px'
                    }}>
                      {/* Conditions */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: COLORS.textMuted,
                          marginBottom: '8px',
                          letterSpacing: '0.05em'
                        }}>
                          CONDITIONS
                        </label>
                        {rule.trigger?.conditions?.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {rule.trigger.conditions.map((cond, i) => (
                              <div
                                key={i}
                                style={{
                                  fontSize: '13px',
                                  color: COLORS.text,
                                  fontFamily: 'monospace',
                                  backgroundColor: COLORS.white,
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: `1px solid ${COLORS.border}`
                                }}
                              >
                                {cond.field} {OPERATOR_LABELS[cond.operator] || cond.operator} "{cond.value}"
                              </div>
                            ))}
                            <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '4px' }}>
                              Match: {rule.trigger.matchMode === 'all' ? 'ALL conditions' : 'ANY condition'}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: COLORS.textMuted }}>
                            No conditions (matches all leads)
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: COLORS.textMuted,
                          marginBottom: '8px',
                          letterSpacing: '0.05em'
                        }}>
                          ACTIONS
                        </label>
                        {rule.actions?.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {rule.actions.map((action, i) => {
                              const Icon = ACTION_ICONS[action.type] || Settings;
                              return (
                                <div
                                  key={i}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '13px',
                                    color: COLORS.text,
                                    backgroundColor: COLORS.white,
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: `1px solid ${COLORS.border}`
                                  }}
                                >
                                  <Icon size={16} style={{ color: COLORS.primary }} />
                                  <span>{action.type.replace(/_/g, ' ')}</span>
                                  {action.config?.tags && (
                                    <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>
                                      [{action.config.tags.join(', ')}]
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: COLORS.textMuted }}>
                            No actions configured
                          </div>
                        )}
                      </div>

                      {/* Settings */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: COLORS.textMuted,
                          marginBottom: '8px',
                          letterSpacing: '0.05em'
                        }}>
                          SETTINGS
                        </label>
                        <div style={{
                          backgroundColor: COLORS.white,
                          padding: '12px',
                          borderRadius: '6px',
                          border: `1px solid ${COLORS.border}`,
                          fontSize: '13px'
                        }}>
                          <div style={{ marginBottom: '8px' }}>
                            <strong>Dedup:</strong>{' '}
                            <span style={{ color: rule.dedup?.enabled ? COLORS.success : COLORS.textMuted }}>
                              {rule.dedup?.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            {rule.dedup?.enabled && (
                              <span style={{ color: COLORS.textMuted }}>
                                {' '}- {Math.round((rule.dedup.windowSeconds || 86400) / 3600)}h window
                              </span>
                            )}
                          </div>
                          <div>
                            <strong>Rate Limit:</strong>{' '}
                            <span style={{ color: rule.rateLimit?.enabled ? COLORS.success : COLORS.textMuted }}>
                              {rule.rateLimit?.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            {rule.rateLimit?.enabled && (
                              <span style={{ color: COLORS.textMuted }}>
                                {' '}- {rule.rateLimit.maxPerHour}/hr
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Statistics */}
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: COLORS.textMuted,
                          marginBottom: '8px',
                          letterSpacing: '0.05em'
                        }}>
                          STATISTICS
                        </label>
                        <div style={{
                          backgroundColor: COLORS.white,
                          padding: '12px',
                          borderRadius: '6px',
                          border: `1px solid ${COLORS.border}`,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '8px',
                          fontSize: '13px'
                        }}>
                          <div>
                            <span style={{ color: COLORS.textMuted }}>Total:</span>{' '}
                            <strong>{rule.stats?.totalExecutions || 0}</strong>
                          </div>
                          <div>
                            <span style={{ color: COLORS.textMuted }}>Success:</span>{' '}
                            <strong style={{ color: COLORS.success }}>{rule.stats?.successfulExecutions || 0}</strong>
                          </div>
                          <div>
                            <span style={{ color: COLORS.textMuted }}>Failed:</span>{' '}
                            <strong style={{ color: COLORS.error }}>{rule.stats?.failedExecutions || 0}</strong>
                          </div>
                          <div>
                            <span style={{ color: COLORS.textMuted }}>Deduped:</span>{' '}
                            <strong style={{ color: COLORS.primaryDark }}>{rule.stats?.skippedDedupe || 0}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: COLORS.white,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: COLORS.text,
              marginBottom: '24px'
            }}>
              Create Trigger Rule
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {[
                { value: 'welcome', label: 'Welcome Sequence', desc: 'Enroll tool signups into welcome journey' },
                { value: 'assessment', label: 'Assessment Followup', desc: 'Fast-track high-score assessment leads' },
                { value: 'footer', label: 'Footer Signup', desc: 'Tag newsletter signups from footer' },
                { value: 'custom', label: 'Custom Rule', desc: 'Start from scratch' }
              ].map(opt => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '16px',
                    borderRadius: '10px',
                    border: `2px solid ${newRuleTemplate === opt.value ? COLORS.primary : COLORS.border}`,
                    backgroundColor: newRuleTemplate === opt.value ? 'rgba(251, 191, 36, 0.05)' : COLORS.white,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="template"
                    value={opt.value}
                    checked={newRuleTemplate === opt.value}
                    onChange={(e) => setNewRuleTemplate(e.target.value)}
                    style={{
                      accentColor: COLORS.primary,
                      width: '18px',
                      height: '18px',
                      marginTop: '2px'
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: COLORS.text }}>{opt.label}</div>
                    <div style={{ fontSize: '13px', color: COLORS.textMuted, marginTop: '2px' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={buttonSecondary}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={actionLoading.create}
                style={{
                  ...buttonPrimary,
                  opacity: actionLoading.create ? 0.6 : 1
                }}
              >
                {actionLoading.create ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                Create
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @media (min-width: 640px) {
          .sm-flex { display: flex !important; }
        }
      `}</style>
    </Layout>
  );
};

export default TriggerRulesPage;
