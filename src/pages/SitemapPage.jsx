import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { getPagesCategorized, STATUS_CONFIG } from '../config/pagesConfig';
import { navigationItems } from '../config/navigationItems';

function SitemapPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  // Get pages from shared config - automatically stays in sync with DirectoryPage
  const pagesFromConfig = getPagesCategorized();

  // Transform config format to sitemap display format - show all except draft
  const pages = pagesFromConfig.map(cat => ({
    category: cat.category,
    items: cat.items
      .filter(page => page.status !== 'draft') // Hide draft pages from public sitemap
      .map(page => ({
        path: page.path,
        name: page.name,
        description: page.description,
        icon: page.icon,
        status: page.status
      }))
  })).filter(cat => cat.items.length > 0);

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="SITEMAP"
    >
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
          maxWidth: '1000px'
        }}>
          <h1 style={{
            ...TYPOGRAPHY.h1Scaled,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            marginBottom: '10px'
          }}>
            SITEMAP
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
            Complete map of all pages
          </p>

          {pages.map((category, idx) => (
            <div key={idx} style={{ marginBottom: '50px' }}>
              <h2 style={{
                fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                fontWeight: '700',
                letterSpacing: '0.2em',
                marginBottom: '20px',
                color: COLORS.black,
                borderBottom: `2px solid ${COLORS.yellow}`,
                paddingBottom: '10px'
              }}>
                {category.category}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {category.items.map((page, pageIdx) => (
                  <a
                    key={pageIdx}
                    href={page.path}
                    onClick={(e) => {
                      // Allow middle-click and ctrl/cmd-click to open in new tab
                      if (e.button === 1 || e.ctrlKey || e.metaKey) return;
                      e.preventDefault();
                      navigate(page.path);
                    }}
                    style={{
                      padding: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      borderRadius: '8px',
                      border: '1px solid rgba(238, 207, 0, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      textDecoration: 'none',
                      display: 'block'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(238, 207, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px'
                    }}>
                      <span style={{ fontSize: '2.5rem' }}>{page.icon}</span>
                      {page.status && page.status !== 'live' && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: '600',
                          color: STATUS_CONFIG[page.status]?.color || '#6b7280',
                          backgroundColor: `${STATUS_CONFIG[page.status]?.color || '#6b7280'}15`,
                          padding: '3px 8px',
                          borderRadius: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {STATUS_CONFIG[page.status]?.icon} {STATUS_CONFIG[page.status]?.label}
                        </span>
                      )}
                    </div>
                    <h3 style={{
                      fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)',
                      fontWeight: '700',
                      letterSpacing: '0.1em',
                      marginBottom: '8px',
                      color: COLORS.black
                    }}>
                      {page.name}
                    </h3>
                    <p style={{
                      fontSize: 'clamp(0.8rem, 1vw, 0.9rem)',
                      color: 'rgba(0, 0, 0, 0.7)',
                      marginBottom: '8px',
                      lineHeight: '1.4'
                    }}>
                      {page.description}
                    </p>
                    <p style={{
                      fontSize: '0.7rem',
                      color: COLORS.lightGrey,
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em'
                    }}>
                      {page.path}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          ))}

          <div style={{ height: '80px' }}></div>
        </div>
      </div>
    </Layout>
  );
}

export default SitemapPage;
