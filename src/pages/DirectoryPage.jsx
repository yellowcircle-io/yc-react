import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { PAGES_CONFIG, STATUS_CONFIG, formatDate } from '../config/pagesConfig';
import { navigationItems } from '../config/navigationItems';

// Status order for cycling
const STATUS_ORDER = ['live', 'in-progress', 'draft', 'issue'];

function DirectoryPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  // Load saved statuses from localStorage, fallback to config defaults
  const [pageStatuses, setPageStatuses] = useState(() => {
    const saved = localStorage.getItem('yc-directory-statuses');
    if (saved) {
      return JSON.parse(saved);
    }
    // Initialize from config
    const initial = {};
    PAGES_CONFIG.forEach(page => {
      initial[page.path] = page.status;
    });
    return initial;
  });

  // Save to localStorage when statuses change
  useEffect(() => {
    localStorage.setItem('yc-directory-statuses', JSON.stringify(pageStatuses));
  }, [pageStatuses]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  // Cycle status on click
  const handleStatusClick = (e, path) => {
    e.preventDefault();
    e.stopPropagation();

    const currentStatus = pageStatuses[path] || 'draft';
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % STATUS_ORDER.length;
    const nextStatus = STATUS_ORDER[nextIndex];

    setPageStatuses(prev => ({
      ...prev,
      [path]: nextStatus
    }));
  };

  // Reset all to config defaults
  const handleReset = () => {
    const initial = {};
    PAGES_CONFIG.forEach(page => {
      initial[page.path] = page.status;
    });
    setPageStatuses(initial);
  };

  // Export current state for updating pagesConfig.js
  const handleExport = () => {
    const updates = PAGES_CONFIG.map(page => ({
      ...page,
      status: pageStatuses[page.path] || page.status
    }));
    console.log('Updated PAGES_CONFIG:', JSON.stringify(updates, null, 2));

    // Copy to clipboard
    const text = updates.map(p => `  { path: '${p.path}', status: '${pageStatuses[p.path] || p.status}' }`).join(',\n');
    navigator.clipboard.writeText(text);
    alert('Status updates copied to clipboard!\nCheck console for full config.');
  };

  const pages = PAGES_CONFIG;

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="DIRECTORY"
    >
      <div style={{
        position: 'fixed',
        top: '100px',
        bottom: footerOpen ? '400px' : '40px',
        left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(100px, 8vw)',
        right: '40px',
        zIndex: 61,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out',
        paddingRight: '20px'
      }}>
        <div style={{
          ...TYPOGRAPHY.container,
          maxWidth: '1100px'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 style={{
                ...TYPOGRAPHY.h1Scaled,
                color: COLORS.yellow,
                ...EFFECTS.blurLight,
                display: 'inline-block',
                marginBottom: '8px'
              }}>
                DIRECTORY
              </h1>
              <p style={{
                fontSize: '0.85rem',
                color: '#6b7280'
              }}>
                Click status to toggle • Changes save locally
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleReset}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#6b7280',
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)';
                }}
              >
                Reset
              </button>
              <button
                onClick={handleExport}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#fff',
                  backgroundColor: COLORS.yellow,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d4b800';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.yellow;
                }}
              >
                Export
              </button>
            </div>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px'
          }}>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <div key={key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: config.color, fontWeight: '700' }}>{config.icon}</span>
                <span style={{ color: '#4b5563' }}>{config.label}</span>
              </div>
            ))}
          </div>

          {/* Two-Column Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {pages.map((page, index) => {
              const currentStatus = pageStatuses[page.path] || page.status;
              const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG['draft'];

              return (
                <a
                  key={index}
                  href={page.path}
                  onClick={(e) => {
                    if (e.button === 1 || e.ctrlKey || e.metaKey) return;
                    e.preventDefault();
                    navigate(page.path);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(8px)',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${statusConfig.color}25`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${statusConfig.color}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Row 1: Icon + Name */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '1.3rem' }}>{page.icon}</span>
                    <span style={{
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: COLORS.black,
                      flex: 1
                    }}>
                      {page.name}
                    </span>
                  </div>

                  {/* Row 2: Path */}
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    fontFamily: 'monospace'
                  }}>
                    {page.path}
                  </div>

                  {/* Row 3: Date + Status */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '4px'
                  }}>
                    {/* Date */}
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      {formatDate(page.lastUpdated)}
                    </span>

                    {/* Toggleable Status */}
                    <button
                      onClick={(e) => handleStatusClick(e, page.path)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        color: statusConfig.color,
                        backgroundColor: `${statusConfig.color}12`,
                        padding: '4px 10px',
                        borderRadius: '10px',
                        border: `1px solid ${statusConfig.color}30`,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${statusConfig.color}25`;
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${statusConfig.color}12`;
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Click to change status"
                    >
                      <span>{statusConfig.icon}</span>
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        {statusConfig.label}
                      </span>
                    </button>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const count = Object.values(pageStatuses).filter(s => s === key).length;
              return (
                <div key={key} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: config.color
                  }}>
                    {count}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#6b7280',
                    textTransform: 'uppercase'
                  }}>
                    {config.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ height: '80px' }}></div>
        </div>
      </div>
    </Layout>
  );
}

export default DirectoryPage;
