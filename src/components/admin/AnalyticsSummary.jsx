/**
 * Analytics Summary Component
 *
 * Collapsible analytics panel for Contact Dashboard
 * Shows compact key metrics when collapsed, full stats when expanded.
 *
 * Created: December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users,
  Mail,
  CheckCircle,
  XCircle,
  Eye,
  MousePointer,
  TrendingUp,
  RefreshCw
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

// Mini stat badge component
// eslint-disable-next-line no-unused-vars
const MiniBadge = ({ label, value, icon: IconComponent, color, trend }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: COLORS.white,
    borderRadius: '20px',
    border: `1px solid ${COLORS.border}`,
    fontSize: '12px',
    whiteSpace: 'nowrap'
  }}>
    <IconComponent size={14} style={{ color: color || COLORS.muted }} />
    <span style={{ color: COLORS.muted }}>{label}:</span>
    <span style={{ fontWeight: '600', color: '#171717' }}>{value}</span>
    {trend && (
      <TrendingUp size={12} style={{ color: COLORS.success }} />
    )}
  </div>
);

const AnalyticsSummary = ({ children, refreshTrigger = 0 }) => {
  const { user, loading: authLoading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem('yc_analytics_expanded');
    return saved === 'true';
  });

  const [summaryStats, setSummaryStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch compact summary stats
  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAdminHeaders();

      // Fetch pipeline stats
      const pipelineRes = await fetch(
        `${FUNCTIONS_BASE_URL}/getPipelineStats`,
        { method: 'GET', headers }
      );

      // Fetch email stats
      const emailRes = await fetch(
        `${FUNCTIONS_BASE_URL}/getEmailStats`,
        { method: 'GET', headers }
      );

      const pipelineData = pipelineRes.ok ? await pipelineRes.json() : null;
      const emailData = emailRes.ok ? await emailRes.json() : null;

      setSummaryStats({
        pipeline: pipelineData?.stats || null,
        email: emailData?.stats || null
      });
    } catch (err) {
      console.error('Summary stats error:', err);
      setSummaryStats({ pipeline: null, email: null });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats when auth is ready and user is logged in
  useEffect(() => {
    if (authLoading) return; // Wait for auth to be ready
    if (user) {
      fetchSummary();
    } else {
      setLoading(false);
    }
  }, [user, authLoading, fetchSummary]);

  // Refetch when refreshTrigger changes
  useEffect(() => {
    if (!authLoading && user && refreshTrigger > 0) {
      fetchSummary();
    }
  }, [refreshTrigger, authLoading, user, fetchSummary]);

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('yc_analytics_expanded', String(isExpanded));
  }, [isExpanded]);

  // Calculate qualified rate
  const getQualifiedRate = () => {
    if (!summaryStats?.pipeline) return '0%';
    const { total, pipelineA, pipelineB } = summaryStats.pipeline;
    if (!total) return '0%';
    const qualified = (pipelineA?.qualified || 0) + (pipelineB?.qualified || 0);
    return `${Math.round((qualified / total) * 100)}%`;
  };

  // Get PE exclusion count
  const getExcludedCount = () => {
    if (!summaryStats?.pipeline) return 0;
    return summaryStats.pipeline.pipelineA?.excluded || 0;
  };

  return (
    <div style={{
      marginBottom: '16px'
    }}>
      {/* Compact Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: COLORS.white,
          border: `2px solid ${COLORS.border}`,
          borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = COLORS.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = COLORS.border;
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 size={20} style={{ color: COLORS.primary }} />
          <span style={{ fontWeight: '600', fontSize: '14px', color: '#171717' }}>
            Analytics Summary
          </span>

          {/* Mini stats when collapsed */}
          {!isExpanded && !loading && summaryStats && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginLeft: '12px'
            }}>
              <MiniBadge
                label="Contacts"
                value={summaryStats.pipeline?.total || 0}
                icon={Users}
                color={COLORS.info}
              />
              <MiniBadge
                label="Qualified"
                value={getQualifiedRate()}
                icon={CheckCircle}
                color={COLORS.success}
              />
              <MiniBadge
                label="PE Excluded"
                value={getExcludedCount()}
                icon={XCircle}
                color={COLORS.error}
              />
              <MiniBadge
                label="Emails"
                value={summaryStats.email?.total || 0}
                icon={Mail}
                color={COLORS.info}
              />
              <MiniBadge
                label="Open Rate"
                value={`${summaryStats.email?.openRate || 0}%`}
                icon={Eye}
                color={COLORS.success}
              />
              <MiniBadge
                label="Click Rate"
                value={`${summaryStats.email?.clickRate || 0}%`}
                icon={MousePointer}
                color={COLORS.primary}
              />
            </div>
          )}

          {/* Loading indicator */}
          {!isExpanded && loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.muted }}>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '12px' }}>Loading...</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: COLORS.muted }}>
            {isExpanded ? 'Hide details' : 'Show details'}
          </span>
          {isExpanded ? (
            <ChevronUp size={18} style={{ color: COLORS.muted }} />
          ) : (
            <ChevronDown size={18} style={{ color: COLORS.muted }} />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <div style={{
        maxHeight: isExpanded ? '1000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease-in-out',
        backgroundColor: COLORS.cardBg,
        borderLeft: `2px solid ${COLORS.border}`,
        borderRight: `2px solid ${COLORS.border}`,
        borderBottom: isExpanded ? `2px solid ${COLORS.border}` : 'none',
        borderRadius: '0 0 12px 12px'
      }}>
        <div style={{ padding: '16px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsSummary;
