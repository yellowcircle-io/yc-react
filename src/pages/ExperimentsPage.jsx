import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';

function ExperimentsPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  // Inject stagger animation
  React.useEffect(() => {
    const styleId = 'text-stagger-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

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
        {
          label: "Projects",
          key: "projects",
          subItems: ["Brand Development", "Marketing Architecture", "Email Development"]
        },
        { label: "Golden Unknown", key: "golden-unknown" },
        {
          label: "Cath3dral",
          key: "cath3dral",
          subItems: ["Being + Rhyme"]
        },
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

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="EXPERIMENTS"
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
            marginBottom: '30px',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            EXPERIMENTS
          </h1>

          <p style={{
            ...TYPOGRAPHY.h2,
            color: COLORS.black,
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '2px 6px',
            marginBottom: '40px',
            animation: 'fadeInUp 0.6s ease-in-out 0.4s both'
          }}>
            Creative explorations &amp; interactive projects
          </p>

          {/* Featured Works Section */}
          <h2 style={{
            fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
            fontWeight: '700',
            letterSpacing: '0.2em',
            marginBottom: '30px',
            color: COLORS.black,
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '8px 12px',
            animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
          }}>
            FEATURED WORKS
          </h2>

          {/* Work Cards */}
          {[
            {
              title: 'GOLDEN UNKNOWN',
              description: 'An immersive exploration of identity and transformation through interactive digital media.',
              tags: ['Interactive', 'Identity', 'Digital Art'],
              path: '/experiments/golden-unknown'
            },
            {
              title: 'BEING + RHYME',
              description: 'A poetic journey combining generative poetry with responsive visual design.',
              tags: ['Poetry', 'Generative', 'Visual'],
              path: '/experiments/being-rhyme'
            },
            {
              title: 'CATH3DRAL',
              description: 'Sacred geometry meets modern technology in this architectural meditation.',
              tags: ['Architecture', 'Sacred', '3D'],
              path: '/experiments/cath3dral'
            }
          ].map((work, index) => (
            <div
              key={index}
              onClick={() => navigate(work.path)}
              style={{
              marginBottom: '40px',
              padding: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '8px',
              border: '1px solid rgba(238, 207, 0, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              animation: `fadeInUp 0.6s ease-in-out ${0.8 + index * 0.2}s both`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(238, 207, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <h3 style={{
                color: COLORS.yellow,
                fontSize: 'clamp(1rem, 1.5vw, 1.3rem)',
                fontWeight: '700',
                letterSpacing: '0.15em',
                marginBottom: '12px'
              }}>
                {work.title}
              </h3>
              <p style={{
                color: 'rgba(0, 0, 0, 0.8)',
                fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
                lineHeight: '1.6',
                marginBottom: '16px',
                letterSpacing: '0.02em'
              }}>
                {work.description}
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {work.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    color: 'rgba(0, 0, 0, 0.6)',
                    backgroundColor: 'rgba(238, 207, 0, 0.15)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    textTransform: 'uppercase'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Spacer for footer */}
          <div style={{ height: '120px' }}></div>
        </div>
      </div>
    </Layout>
  );
}

export default ExperimentsPage;
