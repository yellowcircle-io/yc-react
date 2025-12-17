import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Layout from '../../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../../styles/constants';
import { navigationItems } from '../../config/navigationItems';
import { listPublishedArticles, ARTICLE_CATEGORIES } from '../../utils/firestoreArticles';

// Static articles for fallback (always show the GTM article)
const STATIC_ARTICLES = [
  {
    id: 'static-gtm',
    slug: 'why-your-gtm-sucks',
    title: 'Why Your Go-To-Market Strategy Sucks',
    excerpt: 'Most companies fail not because of their product, but because of their approach to market. Here\'s why your GTM strategy is probably broken.',
    category: 'own-your-story',
    readingTime: 8,
    publishedAt: { toDate: () => new Date('2024-12-01') }
  }
];

function BlogPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const styleId = 'text-stagger-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      try {
        const result = await listPublishedArticles({ limitCount: 20 });
        // Combine Firestore articles with static fallback
        const allArticles = [...result.articles];
        // Add static article if not already in Firestore
        if (!allArticles.find(a => a.slug === 'why-your-gtm-sucks')) {
          allArticles.push(...STATIC_ARTICLES);
        }
        setArticles(allArticles);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(err.message);
        // Show static articles on error
        setArticles(STATIC_ARTICLES);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const getCategoryLabel = (categoryId) => {
    const category = ARTICLE_CATEGORIES.find(c => c.id === categoryId);
    return category?.label || categoryId;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="BLOG"
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
        <div style={{ ...TYPOGRAPHY.container, maxWidth: '800px' }}>
          <h1 style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            marginBottom: '30px',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            BLOG
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
            Essays, reflections &amp; observations
          </p>

          {/* Loading State */}
          {loading && (
            <div style={{
              padding: '40px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '8px',
              textAlign: 'center',
              animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #fbbf24',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px'
              }} />
              <p style={{ ...TYPOGRAPHY.body, color: 'rgba(0, 0, 0, 0.6)' }}>
                Loading articles...
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error State */}
          {error && !loading && articles.length === 0 && (
            <div style={{
              padding: '40px',
              backgroundColor: 'rgba(255, 200, 200, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '8px',
              textAlign: 'center',
              animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
            }}>
              <p style={{ ...TYPOGRAPHY.body, color: 'rgba(150, 0, 0, 0.8)' }}>
                Unable to load articles. Please try again later.
              </p>
            </div>
          )}

          {/* Articles List */}
          {!loading && articles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {articles.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/thoughts/${article.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <article style={{
                    padding: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    animation: `fadeInUp 0.6s ease-in-out ${0.6 + index * 0.1}s both`,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    {/* Category & Date */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: COLORS.yellow,
                        backgroundColor: 'rgba(251, 191, 36, 0.15)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {getCategoryLabel(article.category)}
                      </span>
                      <span style={{
                        fontSize: '13px',
                        color: 'rgba(0, 0, 0, 0.5)'
                      }}>
                        {formatDate(article.publishedAt)}
                      </span>
                      {article.readingTime && (
                        <span style={{
                          fontSize: '13px',
                          color: 'rgba(0, 0, 0, 0.5)'
                        }}>
                          {article.readingTime} min read
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      color: COLORS.black,
                      marginBottom: '8px',
                      lineHeight: '1.3'
                    }}>
                      {article.title}
                    </h2>

                    {/* Excerpt */}
                    {article.excerpt && (
                      <p style={{
                        ...TYPOGRAPHY.body,
                        color: 'rgba(0, 0, 0, 0.7)',
                        margin: 0,
                        lineHeight: '1.6'
                      }}>
                        {article.excerpt}
                      </p>
                    )}
                  </article>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && articles.length === 0 && !error && (
            <div style={{
              padding: '40px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: '8px',
              textAlign: 'center',
              animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
            }}>
              <p style={{ ...TYPOGRAPHY.body, color: 'rgba(0, 0, 0, 0.6)' }}>
                No published articles yet. Check back soon!
              </p>
            </div>
          )}

          <div style={{ height: '100px' }}></div>
        </div>
      </div>
    </Layout>
  );
}

export default BlogPage;
