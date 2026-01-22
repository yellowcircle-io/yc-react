/**
 * Email Stats Card Component
 *
 * Displays email delivery, open, and click statistics
 * from Resend for the Contact Dashboard.
 *
 * Created: December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Send,
  MousePointer,
  Eye,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminHeaders, FUNCTIONS_BASE_URL } from '../../utils/adminConfig';

// Colors
const COLORS = {
  primary: '#fbbf24',
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
  info: '#3b82f6',
  muted: '#6b7280',
  border: 'rgba(0, 0, 0, 0.1)',
  cardBg: '#fafafa',
  white: '#ffffff'
};

// Stat card style
const statCardStyle = {
  backgroundColor: COLORS.white,
  borderRadius: '12px',
  padding: '16px',
  border: `1px solid ${COLORS.border}`,
  minWidth: '120px',
  flex: 1
};

// eslint-disable-next-line no-unused-vars
const StatCard = ({ label, value, icon: IconComponent, color, subText }) => (
  <div style={statCardStyle}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <IconComponent size={18} style={{ color: color || COLORS.muted }} />
      <span style={{ fontSize: '12px', color: COLORS.muted, fontWeight: '500' }}>{label}</span>
    </div>
    <div style={{ fontSize: '24px', fontWeight: '600', color: '#171717' }}>{value}</div>
    {subText && (
      <div style={{ fontSize: '11px', color: COLORS.muted, marginTop: '4px' }}>{subText}</div>
    )}
  </div>
);

const EmailStatsCard = ({ refreshTrigger = 0 }) => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAdminHeaders();
      const response = await fetch(
        `${FUNCTIONS_BASE_URL}/getEmailStats`,
        {
          method: 'GET',
          headers
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch email stats (${response.status})`);
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Email stats error:', err);
      setError(err.message);
      // Set mock stats for display
      setStats({
        total: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        recentEmails: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats when auth is ready and user is logged in
  useEffect(() => {
    if (authLoading) return; // Wait for auth to be ready
    if (user) {
      fetchStats();
    } else {
      setLoading(false);
      setError('Not logged in');
    }
  }, [user, authLoading, fetchStats]);

  // Refetch when refreshTrigger changes
  useEffect(() => {
    if (!authLoading && user && refreshTrigger > 0) {
      fetchStats();
    }
  }, [refreshTrigger, authLoading, user, fetchStats]);

  if (loading) {
    return (
      <div style={{
        backgroundColor: COLORS.white,
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${COLORS.border}`,
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.muted }}>
          <RefreshCw size={16} className="animate-spin" />
          Loading email stats...
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Status badge colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return COLORS.success;
      case 'opened': return COLORS.info;
      case 'clicked': return COLORS.primary;
      case 'bounced': return COLORS.error;
      case 'sent': return COLORS.muted;
      default: return COLORS.muted;
    }
  };

  return (
    <div style={{
      backgroundColor: COLORS.white,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${COLORS.border}`,
      marginBottom: '16px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Mail size={20} style={{ color: COLORS.primary }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Email Performance
          </h3>
        </div>
        <button
          onClick={fetchStats}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: COLORS.muted,
            fontSize: '12px'
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          color: COLORS.error,
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <StatCard
          label="Total Sent"
          value={stats.total}
          icon={Send}
          color={COLORS.info}
        />
        <StatCard
          label="Delivery Rate"
          value={`${stats.deliveryRate}%`}
          icon={CheckCircle}
          color={COLORS.success}
          subText={`${stats.delivered} delivered`}
        />
        <StatCard
          label="Open Rate"
          value={`${stats.openRate}%`}
          icon={Eye}
          color={COLORS.info}
          subText={`${stats.opened} opened`}
        />
        <StatCard
          label="Click Rate"
          value={`${stats.clickRate}%`}
          icon={MousePointer}
          color={COLORS.primary}
          subText={`${stats.clicked} clicked`}
        />
        <StatCard
          label="Bounce Rate"
          value={`${stats.bounceRate}%`}
          icon={XCircle}
          color={COLORS.error}
          subText={`${stats.bounced} bounced`}
        />
      </div>

      {/* Recent Activity (Opens/Clicks) */}
      {stats.recentEvents?.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '10px',
            color: COLORS.muted,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Clock size={14} />
            Recent Activity
          </div>
          <div style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {stats.recentEvents.slice(0, 5).map((event, index) => (
              <div
                key={event.id}
                style={{
                  padding: '10px 12px',
                  borderBottom: index < 4 ? `1px solid ${COLORS.border}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {event.type === 'opened' ? (
                  <Eye size={14} style={{ color: COLORS.info, flexShrink: 0 }} />
                ) : (
                  <MousePointer size={14} style={{ color: COLORS.primary, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {event.to} {event.type === 'opened' ? 'opened' : 'clicked'}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: COLORS.muted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {event.subject}
                    {event.link && ` → ${event.link.replace(/^https?:\/\//, '').substring(0, 30)}...`}
                  </div>
                </div>
                <div style={{
                  fontSize: '10px',
                  color: COLORS.muted,
                  whiteSpace: 'nowrap'
                }}>
                  {event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Emails */}
      {stats.recentEmails?.length > 0 && (
        <div>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '10px',
            color: COLORS.muted
          }}>
            Recent Emails
          </div>
          <div style={{
            backgroundColor: COLORS.cardBg,
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {stats.recentEmails.slice(0, 5).map((email, index) => (
              <div
                key={email.id}
                style={{
                  padding: '10px 12px',
                  borderBottom: index < 4 ? `1px solid ${COLORS.border}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {email.subject}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: COLORS.muted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {email.to}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {email.opened && (
                    <Eye size={12} style={{ color: COLORS.info }} title="Opened" />
                  )}
                  {email.clicked && (
                    <MousePointer size={12} style={{ color: COLORS.primary }} title="Clicked" />
                  )}
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: `${getStatusColor(email.status)}15`,
                    color: getStatusColor(email.status),
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}>
                    {email.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: COLORS.cardBg,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <TrendingUp size={16} style={{ color: COLORS.success }} />
        <span style={{ fontSize: '12px', color: COLORS.muted }}>
          {stats.openRate >= 20
            ? 'Good open rate! Industry average is 15-25%'
            : stats.openRate >= 10
            ? 'Average open rate. Consider A/B testing subjects'
            : 'Low open rate. Review subject lines and sender reputation'}
        </span>
      </div>
    </div>
  );
};

export default EmailStatsCard;
