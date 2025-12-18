/**
 * Pipeline Stats Card Component
 *
 * Displays dual-pipeline prospecting statistics
 * for the Contact Dashboard.
 *
 * Created: December 2025
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  GitBranch
} from 'lucide-react';
import { ADMIN_TOKEN } from '../../utils/adminConfig';

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
  minWidth: '140px',
  flex: 1
};

// eslint-disable-next-line no-unused-vars
const StatCard = ({ label, value, icon: Icon, color, subText }) => (
  <div style={statCardStyle}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <Icon size={18} style={{ color: color || COLORS.muted }} />
      <span style={{ fontSize: '12px', color: COLORS.muted, fontWeight: '500' }}>{label}</span>
    </div>
    <div style={{ fontSize: '24px', fontWeight: '600', color: '#171717' }}>{value}</div>
    {subText && (
      <div style={{ fontSize: '11px', color: COLORS.muted, marginTop: '4px' }}>{subText}</div>
    )}
  </div>
);

const PipelineStatsCard = ({ refreshTrigger = 0 }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        'https://us-central1-yellowcircle-app.cloudfunctions.net/getPipelineStats',
        {
          method: 'GET',
          headers: {
            'x-admin-token': ADMIN_TOKEN
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pipeline stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Pipeline stats error:', err);
      setError(err.message);
      // Set mock stats for display
      setStats({
        total: 0,
        pipelineA: { qualified: 0, excluded: 0, flagged: 0, lowScore: 0, pending: 0 },
        pipelineB: { qualified: 0, excluded: 0, flagged: 0, lowScore: 0, pending: 0 },
        dualPipeline: 0,
        unassigned: 0,
        manualReviewPending: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

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
          Loading pipeline stats...
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const _pipelineATotal = stats.pipelineA.qualified + stats.pipelineA.excluded +
    stats.pipelineA.flagged + stats.pipelineA.lowScore + stats.pipelineA.pending;
  const _pipelineBTotal = stats.pipelineB.qualified + stats.pipelineB.excluded +
    stats.pipelineB.flagged + stats.pipelineB.lowScore + stats.pipelineB.pending;

  const qualifiedRate = stats.total > 0
    ? Math.round(((stats.pipelineA.qualified + stats.pipelineB.qualified) / stats.total) * 100)
    : 0;

  const exclusionRate = stats.total > 0
    ? Math.round(((stats.pipelineA.excluded + stats.pipelineB.excluded) / 2 / stats.total) * 100)
    : 0;

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
          <GitBranch size={20} style={{ color: COLORS.primary }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Dual-Pipeline Prospecting
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

      {/* Overview Stats */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <StatCard
          label="Total Contacts"
          value={stats.total}
          icon={Users}
          color={COLORS.info}
        />
        <StatCard
          label="Qualified Rate"
          value={`${qualifiedRate}%`}
          icon={CheckCircle}
          color={COLORS.success}
          subText={`${stats.pipelineA.qualified + stats.pipelineB.qualified} qualified`}
        />
        <StatCard
          label="PE Exclusion Rate"
          value={`${exclusionRate}%`}
          icon={XCircle}
          color={COLORS.error}
          subText={`${stats.pipelineA.excluded} excluded`}
        />
        <StatCard
          label="Manual Review"
          value={stats.manualReviewPending || 0}
          icon={Clock}
          color={COLORS.warning}
          subText="pending review"
        />
      </div>

      {/* Pipeline Breakdown */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Pipeline A */}
        <div style={{
          flex: 1,
          minWidth: '200px',
          backgroundColor: COLORS.cardBg,
          borderRadius: '8px',
          padding: '12px'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6'
            }} />
            Pipeline A (Traditional)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: COLORS.success }}>
              <CheckCircle size={12} style={{ display: 'inline', marginRight: '2px' }} />
              {stats.pipelineA.qualified} qualified
            </span>
            <span style={{ color: COLORS.error }}>
              <XCircle size={12} style={{ display: 'inline', marginRight: '2px' }} />
              {stats.pipelineA.excluded} excluded
            </span>
            <span style={{ color: COLORS.warning }}>
              <AlertTriangle size={12} style={{ display: 'inline', marginRight: '2px' }} />
              {stats.pipelineA.flagged} flagged
            </span>
            <span style={{ color: COLORS.muted }}>
              {stats.pipelineA.pending} pending
            </span>
          </div>
        </div>

        {/* Pipeline B */}
        <div style={{
          flex: 1,
          minWidth: '200px',
          backgroundColor: COLORS.cardBg,
          borderRadius: '8px',
          padding: '12px'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#8b5cf6'
            }} />
            Pipeline B (Digital-First)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: COLORS.success }}>
              <CheckCircle size={12} style={{ display: 'inline', marginRight: '2px' }} />
              {stats.pipelineB.qualified} qualified
            </span>
            <span style={{ color: COLORS.error }}>
              <XCircle size={12} style={{ display: 'inline', marginRight: '2px' }} />
              {stats.pipelineB.excluded} excluded
            </span>
            <span style={{ color: COLORS.warning }}>
              <AlertTriangle size={12} style={{ display: 'inline', marginRight: '2px' }} />
              {stats.pipelineB.flagged} flagged
            </span>
            <span style={{ color: COLORS.muted }}>
              {stats.pipelineB.pending} pending
            </span>
          </div>
        </div>
      </div>

      {/* Dual Pipeline & Unassigned */}
      <div style={{
        marginTop: '12px',
        display: 'flex',
        gap: '16px',
        fontSize: '12px',
        color: COLORS.muted
      }}>
        <span>
          <strong style={{ color: '#171717' }}>{stats.dualPipeline}</strong> dual-pipeline (A+B)
        </span>
        <span>
          <strong style={{ color: '#171717' }}>{stats.unassigned}</strong> unassigned
        </span>
      </div>
    </div>
  );
};

export default PipelineStatsCard;
