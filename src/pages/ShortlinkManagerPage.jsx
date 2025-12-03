import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import LeadGate from '../components/shared/LeadGate';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';
import { useShortlinks } from '../hooks/useShortlinks';

function ShortlinkManagerPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();
  const {
    createShortlink,
    getAllShortlinks,
    getClickAnalytics,
    deleteShortlink,
    toggleShortlink,
    isLoading
  } = useShortlinks();

  // State
  const [shortlinks, setShortlinks] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [copied, setCopied] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    destinationUrl: '',
    title: '',
    customCode: '',
    campaign: ''
  });
  const [formError, setFormError] = useState('');

  // Load shortlinks on mount
  useEffect(() => {
    loadShortlinks();
  }, []);

  const loadShortlinks = async () => {
    const links = await getAllShortlinks();
    setShortlinks(links);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.destinationUrl) {
      setFormError('Destination URL is required');
      return;
    }

    // Validate URL
    try {
      new URL(formData.destinationUrl);
    } catch {
      setFormError('Please enter a valid URL');
      return;
    }

    try {
      await createShortlink(formData);
      setFormData({ destinationUrl: '', title: '', customCode: '', campaign: '' });
      setShowCreateForm(false);
      await loadShortlinks();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (shortCode) => {
    if (!confirm(`Delete shortlink "${shortCode}"? This cannot be undone.`)) return;

    try {
      await deleteShortlink(shortCode);
      await loadShortlinks();
      if (selectedLink?.shortCode === shortCode) {
        setSelectedLink(null);
        setAnalytics(null);
      }
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleToggle = async (shortCode, currentStatus) => {
    try {
      await toggleShortlink(shortCode, !currentStatus);
      await loadShortlinks();
    } catch (err) {
      alert('Failed to toggle: ' + err.message);
    }
  };

  const handleViewAnalytics = async (link) => {
    setSelectedLink(link);
    const data = await getClickAnalytics(link.shortCode);
    setAnalytics(data);
  };

  const copyToClipboard = (shortCode) => {
    const url = `${window.location.origin}/go/${shortCode}`;
    navigator.clipboard.writeText(url);
    setCopied(shortCode);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const baseUrl = window.location.origin;

  return (
    <LeadGate toolName="Shortlink Manager" requiredAccess="admin">
      <Layout
        onHomeClick={handleHomeClick}
        onFooterToggle={handleFooterToggle}
        onMenuToggle={handleMenuToggle}
        navigationItems={navigationItems}
        pageLabel="SHORTLINKS"
      >
        {/* Background */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(255, 255, 255, 1) 50%, rgba(251, 191, 36, 0.05) 100%)',
          zIndex: 1
        }} />

        {/* Main Content */}
        <div style={{
          position: 'fixed',
          top: '60px',
          left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(100px, 8vw)',
          right: '40px',
          bottom: '40px',
          zIndex: 61,
          overflow: 'auto',
          transition: 'left 0.5s ease-out'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 style={{
                ...TYPOGRAPHY.h1,
                color: COLORS.yellow,
                margin: '0 0 8px 0'
              }}>
                Shortlink Manager
              </h1>
              <p style={{
                ...TYPOGRAPHY.body,
                color: 'rgba(0,0,0,0.5)',
                margin: 0
              }}>
                Create and track shortened URLs
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                padding: '12px 24px',
                backgroundColor: showCreateForm ? 'rgba(0,0,0,0.1)' : COLORS.yellow,
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {showCreateForm ? 'CANCEL' : '+ CREATE SHORTLINK'}
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                Create New Shortlink
              </h3>
              <form onSubmit={handleCreateSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#666' }}>
                    DESTINATION URL *
                  </label>
                  <input
                    type="url"
                    value={formData.destinationUrl}
                    onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                    placeholder="https://example.com/your-long-url"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#666' }}>
                      TITLE (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="My Campaign Link"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#666' }}>
                      CUSTOM CODE (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.customCode}
                      onChange={(e) => setFormData({ ...formData, customCode: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="my-custom-code"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#666' }}>
                    CAMPAIGN (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.campaign}
                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                    placeholder="linkedin-outreach-dec2025"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {formError && (
                  <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 16px 0' }}>
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'black',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  {isLoading ? 'CREATING...' : 'CREATE SHORTLINK'}
                </button>
              </form>
            </div>
          )}

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedLink ? '1fr 1fr' : '1fr', gap: '24px' }}>
            {/* Shortlinks List */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#666' }}>
                ALL SHORTLINKS ({shortlinks.length})
              </h3>

              {shortlinks.length === 0 ? (
                <div style={{
                  backgroundColor: 'white',
                  padding: '40px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#999'
                }}>
                  <p style={{ fontSize: '14px', margin: 0 }}>No shortlinks yet. Create your first one!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shortlinks.map(link => (
                    <div
                      key={link.shortCode}
                      style={{
                        backgroundColor: 'white',
                        padding: '16px',
                        borderRadius: '8px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        border: selectedLink?.shortCode === link.shortCode ? `2px solid ${COLORS.yellow}` : '2px solid transparent',
                        opacity: link.isActive ? 1 : 0.6
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: COLORS.yellow,
                              backgroundColor: 'rgba(251, 191, 36, 0.1)',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              /go/{link.shortCode}
                            </span>
                            {!link.isActive && (
                              <span style={{
                                fontSize: '10px',
                                color: '#ef4444',
                                fontWeight: '600'
                              }}>
                                INACTIVE
                              </span>
                            )}
                          </div>
                          {link.title && (
                            <p style={{ fontSize: '13px', fontWeight: '500', margin: '6px 0 0 0' }}>
                              {link.title}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => copyToClipboard(link.shortCode)}
                            style={{
                              padding: '6px 10px',
                              backgroundColor: copied === link.shortCode ? '#22c55e' : 'rgba(0,0,0,0.05)',
                              color: copied === link.shortCode ? 'white' : '#666',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            {copied === link.shortCode ? '✓ COPIED' : 'COPY'}
                          </button>
                        </div>
                      </div>

                      <p style={{
                        fontSize: '12px',
                        color: '#666',
                        margin: '0 0 12px 0',
                        wordBreak: 'break-all'
                      }}>
                        → {link.destinationUrl}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#999' }}>
                          <span><strong>{link.clicks || 0}</strong> clicks</span>
                          <span><strong>{link.uniqueClicks || 0}</strong> unique</span>
                          {link.campaign && <span style={{ color: '#666' }}>#{link.campaign}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleViewAnalytics(link)}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: 'transparent',
                              color: '#666',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            ANALYTICS
                          </button>
                          <button
                            onClick={() => handleToggle(link.shortCode, link.isActive)}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: 'transparent',
                              color: link.isActive ? '#ef4444' : '#22c55e',
                              border: `1px solid ${link.isActive ? '#ef4444' : '#22c55e'}`,
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            {link.isActive ? 'DISABLE' : 'ENABLE'}
                          </button>
                          <button
                            onClick={() => handleDelete(link.shortCode)}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: 'transparent',
                              color: '#999',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            DELETE
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Analytics Panel */}
            {selectedLink && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#666', margin: 0 }}>
                    ANALYTICS: {selectedLink.shortCode}
                  </h3>
                  <button
                    onClick={() => { setSelectedLink(null); setAnalytics(null); }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'transparent',
                      color: '#999',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    CLOSE
                  </button>
                </div>

                {analytics ? (
                  <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                  }}>
                    {/* Stats Overview */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px',
                      marginBottom: '20px'
                    }}>
                      <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>{selectedLink.clicks || 0}</p>
                        <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>TOTAL CLICKS</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>{selectedLink.uniqueClicks || 0}</p>
                        <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>UNIQUE</p>
                      </div>
                      <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
                          {selectedLink.clicks ? ((selectedLink.uniqueClicks / selectedLink.clicks) * 100).toFixed(0) : 0}%
                        </p>
                        <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>UNIQUE RATE</p>
                      </div>
                    </div>

                    {/* Device Breakdown */}
                    {analytics.devices && (
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '8px' }}>DEVICES</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <span style={{ fontSize: '12px' }}>🖥️ Desktop: <strong>{analytics.devices.desktop}</strong></span>
                          <span style={{ fontSize: '12px' }}>📱 Mobile: <strong>{analytics.devices.mobile}</strong></span>
                          <span style={{ fontSize: '12px' }}>📟 Tablet: <strong>{analytics.devices.tablet}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Top Referrers */}
                    {analytics.referrers && Object.keys(analytics.referrers).length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '8px' }}>TOP REFERRERS</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {Object.entries(analytics.referrers)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([ref, count]) => (
                              <div key={ref} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {ref === 'direct' ? '(direct)' : ref}
                                </span>
                                <strong>{count}</strong>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Clicks */}
                    {analytics.clicks && analytics.clicks.length > 0 && (
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: '600', color: '#999', marginBottom: '8px' }}>RECENT CLICKS</p>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {analytics.clicks.slice(0, 10).map((click, i) => (
                            <div key={i} style={{
                              padding: '8px 0',
                              borderBottom: '1px solid #eee',
                              fontSize: '11px',
                              color: '#666'
                            }}>
                              <div>{click.timestamp?.toLocaleString() || 'Unknown time'}</div>
                              <div style={{ color: '#999' }}>
                                {click.referrer === 'direct' ? 'Direct visit' : click.referrer}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#999'
                  }}>
                    Loading analytics...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </LeadGate>
  );
}

export default ShortlinkManagerPage;
