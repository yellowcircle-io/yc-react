import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { PAGES_CONFIG } from '../config/pagesConfig';

function DirectoryPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const navigationItems = [
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/history-edu_nuazpv.png",
      label: "STORIES",
      itemKey: "stories",
      subItems: [
        { label: "Thoughts", key: "thoughts", route: "/thoughts" },
        { label: "Golden Unknown", key: "golden-unknown", route: "/experiments/golden-unknown" },
        { label: "Cath3dral", key: "cath3dral", route: "/experiments/cath3dral" }
      ]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
      label: "LABS",
      itemKey: "labs",
      subItems: [
        { label: "UK-Memories", key: "uk-memories", route: "/uk-memories" },
        { label: "Unity Notes", key: "unity-notes", route: "/unity-notes" },
        { label: "Unity Notes+", key: "unity-notes-plus", route: "/unity-notes-plus" },
        { label: "Component Library", key: "component-library", route: "/experiments/component-library" }
      ]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/face-profile_dxxbba.png",
      label: "ABOUT",
      itemKey: "about",
      subItems: []
    }
  ];

  // Use shared pages config
  const pages = PAGES_CONFIG;

  const getStatusColor = (status) => {
    switch (status) {
      case 'migrated': return '#22c55e';
      case 'needs-migration': return '#f59e0b';
      case 'excluded': return '#6b7280';
      default: return COLORS.black;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'migrated': return '✓ Global Layout';
      case 'needs-migration': return '⚠ Needs Migration';
      case 'excluded': return '○ Excluded';
      default: return '';
    }
  };

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="DIRECTORY"
    >
      {/* Scrollable content area */}
      <div style={{
        position: 'fixed',
        top: '100px',
        bottom: footerOpen ? '400px' : '40px',
        left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(100px, 8vw)',
        right: '100px',
        zIndex: 61,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out',
        paddingRight: '20px'
      }}>
        <div style={{
          ...TYPOGRAPHY.container,
          maxWidth: '900px'
        }}>
          {/* Page title */}
          <h1 style={{
            ...TYPOGRAPHY.h1Scaled,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            marginBottom: '30px'
          }}>
            DIRECTORY
          </h1>

          <p style={{
            ...TYPOGRAPHY.h2,
            color: COLORS.black,
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '2px 6px',
            marginBottom: '40px'
          }}>
            All live pages for navigation & testing
          </p>

          {/* Page list - use anchor tags for right-click support */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {pages.map((page, index) => (
              <a
                key={index}
                href={page.path}
                onClick={(e) => {
                  // Allow middle-click and ctrl/cmd-click to open in new tab
                  if (e.button === 1 || e.ctrlKey || e.metaKey) return;
                  e.preventDefault();
                  navigate(page.path);
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  border: `2px solid ${getStatusColor(page.status)}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(10px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${getStatusColor(page.status)}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <h3 style={{
                    fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                    fontWeight: '700',
                    color: COLORS.black,
                    marginBottom: '4px',
                    fontFamily: 'Helvetica, Arial, sans-serif'
                  }}>
                    {page.icon} {page.name}
                  </h3>
                  <p style={{
                    fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
                    color: COLORS.lightGrey,
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em'
                  }}>
                    {page.path}
                  </p>
                  {page.description && (
                    <p style={{
                      fontSize: 'clamp(0.7rem, 1.2vw, 0.85rem)',
                      color: 'rgba(0,0,0,0.5)',
                      marginTop: '4px',
                      fontFamily: 'Helvetica, Arial, sans-serif'
                    }}>
                      {page.description}
                    </p>
                  )}
                </div>
                <span style={{
                  fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)',
                  fontWeight: '600',
                  color: getStatusColor(page.status),
                  backgroundColor: `${getStatusColor(page.status)}20`,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  whiteSpace: 'nowrap'
                }}>
                  {getStatusLabel(page.status)}
                </span>
              </a>
            ))}
          </div>

          {/* Legend */}
          <div style={{
            marginTop: '40px',
            padding: '20px',
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <h4 style={{
              fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)',
              fontWeight: '700',
              color: COLORS.black,
              marginBottom: '12px'
            }}>
              Legend:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: 'clamp(0.8rem, 1.2vw, 1rem)' }}>
                <span style={{ color: '#22c55e', fontWeight: '700' }}>✓ Global Layout</span> - Migrated to global components
              </div>
              <div style={{ fontSize: 'clamp(0.8rem, 1.2vw, 1rem)' }}>
                <span style={{ color: '#f59e0b', fontWeight: '700' }}>⚠ Needs Migration</span> - Still using old components
              </div>
              <div style={{ fontSize: 'clamp(0.8rem, 1.2vw, 1rem)' }}>
                <span style={{ color: '#6b7280', fontWeight: '700' }}>○ Excluded</span> - Not using global layout
              </div>
            </div>
          </div>

          <div style={{ height: '100px' }}></div>
        </div>
      </div>
    </Layout>
  );
}

export default DirectoryPage;
