import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';

/**
 * JourneysPage - Interactive tools and guided experiences
 * Holistic page for GTM Health Assessment, Outreach Generator, UnityNotes
 */
function JourneysPage() {
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

  const journeys = [
    {
      title: 'GTM HEALTH ASSESSMENT',
      description: 'Diagnose the state of your go-to-market operations. Answer key questions and receive a personalized analysis of your infrastructure health.',
      tags: ['Diagnostic', 'Strategy', '15 min'],
      path: '/assessment',
      icon: '🔬',
      featured: true
    },
    {
      title: 'OUTREACH GENERATOR',
      description: 'AI-powered cold email generation using proven frameworks. Create personalized outreach sequences that convert.',
      tags: ['AI', 'Email', 'Sales'],
      path: '/experiments/outreach-generator',
      icon: '✉️'
    },
    {
      title: 'UNITY NOTES',
      description: 'Capture and organize your thoughts with an elegant note-taking experience. Simple, focused, beautiful.',
      tags: ['Productivity', 'Notes', 'PWA'],
      path: '/unity-notes',
      icon: '📝'
    }
  ];

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="JOURNEYS"
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
            marginBottom: '10px',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            JOURNEYS
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
            Interactive tools &amp; guided experiences
          </p>

          {/* Journey Cards - Grid Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            paddingBottom: '40px'
          }}>
            {journeys.map((journey, index) => (
              <div
                key={index}
                onClick={() => navigate(journey.path)}
                style={{
                  backgroundColor: journey.featured ? COLORS.yellow : 'rgba(0,0,0,0.85)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '8px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.6s ease-in-out ${0.5 + index * 0.1}s both`,
                  border: journey.featured ? 'none' : '1px solid rgba(251, 191, 36, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Icon */}
                <span style={{
                  fontSize: '2rem',
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  {journey.icon}
                </span>

                {/* Title */}
                <h3 style={{
                  fontSize: 'clamp(14px, 2vw, 18px)',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  color: journey.featured ? 'black' : 'white',
                  margin: '0 0 8px 0'
                }}>
                  {journey.title}
                  {journey.featured && (
                    <span style={{
                      display: 'inline-block',
                      fontSize: '9px',
                      fontWeight: '600',
                      backgroundColor: 'black',
                      color: COLORS.yellow,
                      padding: '3px 6px',
                      borderRadius: '3px',
                      marginLeft: '10px',
                      verticalAlign: 'middle',
                      letterSpacing: '0.1em'
                    }}>
                      START HERE
                    </span>
                  )}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: journey.featured ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                  margin: '0 0 16px 0'
                }}>
                  {journey.description}
                </p>

                {/* Tags */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px'
                }}>
                  {journey.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      letterSpacing: '0.08em',
                      color: journey.featured ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
                      backgroundColor: journey.featured ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
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
          </div>

          {/* Spacer for footer */}
          <div style={{ height: '120px' }}></div>
        </div>
      </div>
    </Layout>
  );
}

export default JourneysPage;
