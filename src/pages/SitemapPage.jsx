import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';

function SitemapPage() {
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
        { label: "Projects", key: "projects", subItems: ["Brand Development", "Marketing Architecture", "Email Development"] },
        { label: "Golden Unknown", key: "golden-unknown" },
        { label: "Cath3dral", key: "cath3dral", subItems: ["Being + Rhyme"] },
        { label: "Thoughts", key: "thoughts" }
      ]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
      label: "LABS",
      itemKey: "labs",
      subItems: [
        { label: "UK-Memories", key: "uk-memories" },
        { label: "Home-17", key: "home-17" },
        { label: "Visual Noteboard", key: "visual-noteboard" },
        { label: "Component Library", key: "component-library" }
      ]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/face-profile_dxxbba.png",
      label: "ABOUT",
      itemKey: "about",
      subItems: []
    }
  ];

  const pages = [
    { category: 'Main Pages', items: [
      { path: '/', name: 'Home', description: 'Homepage with horizontal scrolling and interactive navigation', icon: '🏠' },
      { path: '/about', name: 'About', description: 'Information about yellowCIRCLE philosophy and approach', icon: '👤' },
      { path: '/works', name: 'Works', description: 'Portfolio of websites, graphics, and music projects', icon: '💼' },
      { path: '/hands', name: 'Hands', description: 'Creative projects and hands-on work', icon: '🎨' }
    ]},
    { category: 'Experiments', items: [
      { path: '/experiments', name: 'Experiments Hub', description: 'Collection of interactive experiments and creative projects', icon: '🧪' },
      { path: '/experiments/golden-unknown', name: 'Golden Unknown', description: 'Experimental brand exploration', icon: '✨' },
      { path: '/experiments/being-rhyme', name: 'Being Rhyme', description: 'Interactive poetry and rhythm experience', icon: '🎵' },
      { path: '/experiments/cath3dral', name: 'Cath3dral', description: '3D architectural visualization experiment', icon: '🏛️' },
      { path: '/experiments/component-library', name: 'Component Library', description: 'UI component showcase and documentation', icon: '📦' }
    ]},
    { category: 'Thoughts', items: [
      { path: '/thoughts', name: 'Thoughts Hub', description: 'Essays, reflections, and written content', icon: '💭' },
      { path: '/thoughts/blog', name: 'Blog', description: 'Blog posts and articles', icon: '📝' }
    ]},
    { category: 'Special Features', items: [
      { path: '/uk-memories', name: 'UK Memories', description: 'Travel time capsule with photos and memories', icon: '✈️' },
      { path: '/feedback', name: 'Feedback', description: 'Submit feedback, bug reports, and feature requests', icon: '📧' },
      { path: '/sitemap', name: 'Sitemap', description: 'This page - complete directory of all pages', icon: '🗺️' }
    ]}
  ];

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
                  <div
                    key={pageIdx}
                    onClick={() => navigate(page.path)}
                    style={{
                      padding: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      borderRadius: '8px',
                      border: '1px solid rgba(238, 207, 0, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out'
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
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{page.icon}</div>
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
                  </div>
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
