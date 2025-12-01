import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';

// Article data
const ARTICLES = [
  {
    id: 'why-your-gtm-sucks',
    title: 'Why Your GTM Sucks',
    subtitle: 'The Human Cost of Operations Theater',
    category: 'Own Your Story',
    readTime: '12 min read',
    date: 'November 2025',
    description: 'A confrontational look at why your go-to-market operations are failing your team—and how to fix it.',
    featured: true
  }
];

function ThoughtsPage() {
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

  const handleArticleClick = (articleId) => {
    navigate(`/thoughts/${articleId}`);
  };

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="THOUGHTS"
    >
      {/* Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(255, 255, 255, 1) 50%, rgba(251, 191, 36, 0.1) 100%)',
        zIndex: 1
      }}></div>

      {/* Main Content */}
      <div style={{
        position: 'fixed',
        bottom: '40px',
        left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(100px, 8vw)',
        maxWidth: sidebarOpen ? 'min(540px, 40vw)' : 'min(780px, 61vw)',
        zIndex: 61,
        transform: footerOpen ? 'translateY(-300px)' : 'translateY(0)',
        transition: 'left 0.5s ease-out, max-width 0.5s ease-out, transform 0.5s ease-out'
      }}>
        <div style={{
          ...TYPOGRAPHY.container
        }}>
          {/* Large "THOUGHTS" heading */}
          <h1 style={{
            ...TYPOGRAPHY.h1Scaled,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            THOUGHTS
          </h1>

          <div style={{ position: 'relative', minHeight: '80px' }}>
            {/* Main subtitle */}
            <p style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.black,
              backgroundColor: COLORS.backgroundLight,
              ...EFFECTS.blur,
              display: 'inline-block',
              padding: '2px 6px',
              animation: 'fadeInUp 0.6s ease-in-out 0.4s both'
            }}>
              Ideas, insights & reflections
            </p>
          </div>

          {/* Articles List */}
          <div style={{
            marginTop: '30px',
            animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
          }}>
            {ARTICLES.map((article, index) => (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article.id)}
                style={{
                  backgroundColor: article.featured ? 'rgba(251, 191, 36, 0.15)' : COLORS.backgroundLight,
                  border: article.featured ? `2px solid ${COLORS.yellow}` : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  ...EFFECTS.blur
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Category & Date */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    color: COLORS.yellow,
                    textTransform: 'uppercase'
                  }}>
                    {article.category}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: 'rgba(0, 0, 0, 0.4)'
                  }}>
                    {article.date}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: COLORS.black,
                  margin: '0 0 4px 0',
                  lineHeight: '1.3'
                }}>
                  {article.title}
                </h3>

                {/* Subtitle */}
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(0, 0, 0, 0.6)',
                  margin: '0 0 12px 0',
                  fontStyle: 'italic'
                }}>
                  {article.subtitle}
                </p>

                {/* Description */}
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(0, 0, 0, 0.7)',
                  margin: '0 0 12px 0',
                  lineHeight: '1.5'
                }}>
                  {article.description}
                </p>

                {/* Read Time */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: 'rgba(0, 0, 0, 0.5)'
                  }}>
                    {article.readTime}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: COLORS.yellow
                  }}>
                    READ ARTICLE →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Coming Soon Note */}
          <p style={{
            ...TYPOGRAPHY.small,
            color: 'rgba(0, 0, 0, 0.4)',
            marginTop: '20px',
            animation: 'fadeInUp 0.6s ease-in-out 0.8s both'
          }}>
            More articles coming soon.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default ThoughtsPage;
