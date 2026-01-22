import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';
import { useArticles } from '../hooks/useArticles';
import { ARTICLE_CATEGORIES } from '../utils/firestoreArticles';

/**
 * ThoughtsPage - Article listing with hybrid CMS support
 *
 * Displays articles from:
 * 1. Firestore (admin-created content)
 * 2. Static MDX registry (developer-created content)
 *
 * Features:
 * - List/Carousel view toggle
 * - Featured articles highlighting
 * - Loading state
 */

function ThoughtsPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  // Load articles from both Firestore and MDX registry
  const { articles, loading, error } = useArticles({ limit: 20 });

  // Scroll mode: 'vertical' (list) or 'horizontal' (carousel)
  const [scrollMode, setScrollMode] = React.useState('vertical');

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

  const handleArticleClick = (article) => {
    // Navigate to the appropriate article URL
    // For block-based articles, use slug directly
    // For legacy articles, use existing slug
    navigate(`/thoughts/${article.slug}`);
  };

  // Format article for display
  const formatArticle = (article) => {
    const category = ARTICLE_CATEGORIES.find(c => c.id === article.category);
    const publishedDate = article.publishedAt?.toDate?.() || new Date(article.publishedAt);

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      subtitle: article.excerpt,
      category: category?.label || article.category || 'Article',
      readTime: `${article.readingTime || 5} min read`,
      date: publishedDate ? publishedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
      description: article.excerpt,
      featured: article.category === 'own-your-story', // Feature "Own Your Story" series
      contentSource: article.contentSource
    };
  };

  // Format articles for display
  const displayArticles = articles.map(formatArticle);

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

          {/* Scroll Mode Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px',
            animation: 'fadeInUp 0.6s ease-in-out 0.5s both'
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.1em',
              color: 'rgba(0, 0, 0, 0.4)',
              textTransform: 'uppercase'
            }}>
              VIEW:
            </span>
            <button
              onClick={() => setScrollMode('vertical')}
              style={{
                padding: '6px 12px',
                backgroundColor: scrollMode === 'vertical' ? COLORS.yellow : 'transparent',
                color: scrollMode === 'vertical' ? 'black' : 'rgba(0, 0, 0, 0.5)',
                border: scrollMode === 'vertical' ? 'none' : '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              LIST
            </button>
            <button
              onClick={() => setScrollMode('horizontal')}
              style={{
                padding: '6px 12px',
                backgroundColor: scrollMode === 'horizontal' ? COLORS.yellow : 'transparent',
                color: scrollMode === 'horizontal' ? 'black' : 'rgba(0, 0, 0, 0.5)',
                border: scrollMode === 'horizontal' ? 'none' : '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              CAROUSEL
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{
              marginTop: '20px',
              padding: '40px',
              textAlign: 'center',
              animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '3px solid rgba(251, 191, 36, 0.2)',
                borderTopColor: COLORS.yellow,
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
              animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
            }}>
              Failed to load articles: {error}
            </div>
          )}

          {/* Articles List/Carousel */}
          {!loading && displayArticles.length > 0 && (
            <div style={{
              marginTop: '20px',
              animation: 'fadeInUp 0.6s ease-in-out 0.6s both',
              ...(scrollMode === 'horizontal' ? {
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                paddingBottom: '16px',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch'
              } : {})
            }}>
              {displayArticles.map((article, _index) => (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  style={{
                    backgroundColor: article.featured ? 'rgba(251, 191, 36, 0.15)' : COLORS.backgroundLight,
                    border: article.featured ? `2px solid ${COLORS.yellow}` : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ...EFFECTS.blur,
                    ...(scrollMode === 'horizontal' ? {
                      minWidth: '300px',
                      maxWidth: '300px',
                      flexShrink: 0,
                      scrollSnapAlign: 'start'
                    } : {
                      marginBottom: '16px'
                    })
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = scrollMode === 'horizontal' ? 'translateY(-4px)' : 'translateY(-2px)';
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
                  {article.description && article.description !== article.subtitle && (
                    <p style={{
                      fontSize: '14px',
                      color: 'rgba(0, 0, 0, 0.7)',
                      margin: '0 0 12px 0',
                      lineHeight: '1.5'
                    }}>
                      {article.description}
                    </p>
                  )}

                  {/* Read Time & Source Badge */}
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
          )}

          {/* Empty State */}
          {!loading && displayArticles.length === 0 && (
            <div style={{
              marginTop: '20px',
              padding: '40px',
              textAlign: 'center',
              color: 'rgba(0, 0, 0, 0.5)',
              animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
            }}>
              No articles yet. Check back soon!
            </div>
          )}

          {/* Coming Soon Note */}
          <p style={{
            ...TYPOGRAPHY.small,
            color: 'rgba(0, 0, 0, 0.4)',
            marginTop: '20px',
            animation: 'fadeInUp 0.6s ease-in-out 0.8s both'
          }}>
            {displayArticles.length > 0 ? 'More articles coming soon.' : ''}
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default ThoughtsPage;
