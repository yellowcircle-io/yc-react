import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Database, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminHeaders, FUNCTIONS_BASE_URL as API_BASE } from '../../utils/adminConfig';

/**
 * Storage Cleanup Admin Page
 * View collection stats and run cleanup with dry-run preview
 */
export default function StorageCleanupPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [error, setError] = useState(null);
  const [includeContacts, setIncludeContacts] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (user && !isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, navigate]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAdminHeaders({ tokenType: 'cleanup' });
      const response = await fetch(`${API_BASE}/getCollectionStats`, { headers });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async (dryRun = true) => {
    setLoading(true);
    setError(null);
    setCleanupResult(null);
    try {
      const headers = await getAdminHeaders({ tokenType: 'cleanup' });
      const params = new URLSearchParams({
        dryRun: dryRun.toString(),
        includeContacts: includeContacts.toString()
      });
      const response = await fetch(`${API_BASE}/cleanupWithPreview?${params}`, {
        method: 'POST',
        headers
      });
      const data = await response.json();
      if (data.success) {
        setCleanupResult(data);
        // Refresh stats after actual cleanup
        if (!dryRun) {
          await fetchStats();
        }
      } else {
        setError(data.error || 'Cleanup failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const CollectionCard = ({ name, data }) => {
    const hasCleanupCandidates = data.cleanupCandidates > 0;
    return (
      <div style={{
        background: 'rgba(30, 30, 30, 0.95)',
        border: `1px solid ${hasCleanupCandidates ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '14px', textTransform: 'uppercase' }}>
            {name}
          </h3>
          <span style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: hasCleanupCandidates ? '#fbbf24' : '#e5e5e5'
          }}>
            {data.total}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#b3b3b3' }}>
          {data.active !== undefined && (
            <div>Active: {data.active}</div>
          )}
          <div style={{ color: hasCleanupCandidates ? '#f59e0b' : '#6b7280' }}>
            Cleanup candidates: {data.cleanupCandidates}
          </div>
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
            {data.criteria}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e5e5e5',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fbbf24',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
          Storage Cleanup
        </h1>
        <button
          onClick={fetchStats}
          disabled={loading}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#e5e5e5',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} color="#ef4444" />
          <span style={{ color: '#ef4444' }}>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', color: '#b3b3b3', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} />
            Collection Stats
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              (as of {new Date(stats.timestamp).toLocaleString()})
            </span>
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '12px'
          }}>
            {Object.entries(stats.collections).map(([name, data]) => (
              <CollectionCard key={name} name={name} data={data} />
            ))}
          </div>
        </div>
      )}

      {/* Cleanup Controls */}
      <div style={{
        background: 'rgba(30, 30, 30, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '16px', color: '#fbbf24', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trash2 size={18} />
          Cleanup Actions
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeContacts}
              onChange={(e) => setIncludeContacts(e.target.checked)}
              style={{ accentColor: '#fbbf24' }}
            />
            <span style={{ fontSize: '14px' }}>Include test contacts in cleanup</span>
          </label>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 24px' }}>
            Only contacts with source="test", no journeys, and older than 180 days
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => runCleanup(true)}
            disabled={loading}
            style={{
              background: 'rgba(251, 191, 36, 0.2)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Running...' : 'Preview Cleanup (Dry Run)'}
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to permanently delete the cleanup candidates? This cannot be undone.')) {
                runCleanup(false);
              }
            }}
            disabled={loading}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Running...' : 'Execute Cleanup'}
          </button>
        </div>
      </div>

      {/* Cleanup Results */}
      {cleanupResult && (
        <div style={{
          background: 'rgba(30, 30, 30, 0.95)',
          border: `1px solid ${cleanupResult.dryRun ? 'rgba(251, 191, 36, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h2 style={{
            fontSize: '16px',
            color: cleanupResult.dryRun ? '#fbbf24' : '#22c55e',
            marginTop: 0,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={18} />
            {cleanupResult.dryRun ? 'Dry Run Results (No changes made)' : 'Cleanup Complete'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Capsules</div>
              <div style={{ fontSize: '16px' }}>
                <span style={{ color: '#ef4444' }}>{cleanupResult.summary.capsules.deleted} deleted</span>
                {' / '}
                <span style={{ color: '#22c55e' }}>{cleanupResult.summary.capsules.kept} kept</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Journeys</div>
              <div style={{ fontSize: '16px' }}>
                <span style={{ color: '#ef4444' }}>{cleanupResult.summary.journeys.deleted} deleted</span>
                {' / '}
                <span style={{ color: '#22c55e' }}>{cleanupResult.summary.journeys.kept} kept</span>
              </div>
            </div>
            {cleanupResult.summary.contacts !== 'skipped' && (
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Contacts</div>
                <div style={{ fontSize: '16px' }}>
                  <span style={{ color: '#ef4444' }}>{cleanupResult.summary.contacts.deleted} deleted</span>
                  {' / '}
                  <span style={{ color: '#22c55e' }}>{cleanupResult.summary.contacts.kept} kept</span>
                </div>
              </div>
            )}
          </div>

          {/* Detailed list of deleted items */}
          {cleanupResult.details.capsules.deleted.length > 0 && (
            <details style={{ marginBottom: '12px' }}>
              <summary style={{ cursor: 'pointer', color: '#b3b3b3', fontSize: '14px' }}>
                Capsules to delete ({cleanupResult.details.capsules.deleted.length})
              </summary>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', maxHeight: '200px', overflow: 'auto' }}>
                {cleanupResult.details.capsules.deleted.map((item, i) => (
                  <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {item.title} ({item.viewCount} views, created {new Date(item.createdAt).toLocaleDateString()})
                  </div>
                ))}
              </div>
            </details>
          )}

          {cleanupResult.details.journeys.deleted.length > 0 && (
            <details style={{ marginBottom: '12px' }}>
              <summary style={{ cursor: 'pointer', color: '#b3b3b3', fontSize: '14px' }}>
                Journeys to delete ({cleanupResult.details.journeys.deleted.length})
              </summary>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', maxHeight: '200px', overflow: 'auto' }}>
                {cleanupResult.details.journeys.deleted.map((item, i) => (
                  <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {item.name} (status: {item.status}, updated {new Date(item.updatedAt).toLocaleDateString()})
                  </div>
                ))}
              </div>
            </details>
          )}

          {cleanupResult.details.contacts?.deleted?.length > 0 && (
            <details>
              <summary style={{ cursor: 'pointer', color: '#b3b3b3', fontSize: '14px' }}>
                Contacts to delete ({cleanupResult.details.contacts.deleted.length})
              </summary>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', maxHeight: '200px', overflow: 'auto' }}>
                {cleanupResult.details.contacts.deleted.map((item, i) => (
                  <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {item.email} (source: {item.source}, created {new Date(item.createdAt).toLocaleDateString()})
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
