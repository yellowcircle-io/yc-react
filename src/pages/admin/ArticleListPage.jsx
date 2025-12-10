/**
 * Article List Admin Page
 *
 * Dashboard for managing all blog articles.
 * Shows drafts, published, and scheduled articles with quick actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/global/Layout';
import { useAuth } from '../../contexts/AuthContext';
import {
  listArticles,
  deleteArticle,
  publishArticle,
  unpublishArticle,
  getArticleStats,
  ARTICLE_STATUS,
  ARTICLE_CATEGORIES
} from '../../utils/firestoreArticles';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Send,
  Archive,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Clock,
  TrendingUp,
  Globe,
  FilePlus
} from 'lucide-react';

// ============================================================
// Brand Colors (yellowCircle)
// ============================================================
const COLORS = {
  primary: '#fbbf24',
  primaryDark: '#d4a000',
  text: '#171717',
  textMuted: '#737373',
  textLight: '#a3a3a3',
  border: 'rgba(0, 0, 0, 0.1)',
  inputBg: 'rgba(0, 0, 0, 0.02)',
  success: '#16a34a',
  error: '#dc2626',
  white: '#ffffff',
  cardBg: '#fafafa'
};

// Import shared admin navigation
import { adminNavigationItems } from '../../config/adminNavigationItems';

// ============================================================
// Status Badge Colors
// ============================================================
const STATUS_COLORS = {
  [ARTICLE_STATUS.DRAFT]: { bg: '#f3f4f6', text: '#6b7280' },
  [ARTICLE_STATUS.PUBLISHED]: { bg: '#dcfce7', text: '#15803d' },
  [ARTICLE_STATUS.SCHEDULED]: { bg: '#dbeafe', text: '#1d4ed8' },
  [ARTICLE_STATUS.ARCHIVED]: { bg: '#fef3c7', text: '#d97706' }
};

// ============================================================
// Reusable Styles
// ============================================================
const styles = {
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    color: '#000000'
  },
  secondaryButton: {
    backgroundColor: COLORS.cardBg,
    color: COLORS.text,
    border: `2px solid ${COLORS.border}`
  },
  card: {
    backgroundColor: COLORS.white,
    border: `2px solid ${COLORS.border}`,
    borderRadius: '12px',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: `2px solid ${COLORS.border}`,
    backgroundColor: COLORS.inputBg,
    flexShrink: 0,
    minWidth: '140px',
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer'
  }
};

const ArticleListPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();

  // State
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Layout callbacks
  const handleHomeClick = () => navigate('/');
  const handleFooterToggle = () => {};
  const handleMenuToggle = () => {};

  // Load articles
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const options = {
        limitCount: 50,
        orderField: 'updatedAt',
        orderDirection: 'desc'
      };

      if (statusFilter) {
        options.status = statusFilter;
      }
      if (categoryFilter) {
        options.category = categoryFilter;
      }

      const result = await listArticles(options);
      let articlesList = result.articles || [];

      // Client-side search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        articlesList = articlesList.filter(a =>
          a.title?.toLowerCase().includes(query) ||
          a.excerpt?.toLowerCase().includes(query) ||
          a.slug?.toLowerCase().includes(query)
        );
      }

      setArticles(articlesList);

      // Load stats
      const statsData = await getArticleStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load articles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  // Load on mount and filter changes
  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadArticles();
    }
  }, [authLoading, isAdmin, loadArticles]);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/unity-notes');
    }
  }, [authLoading, isAdmin, navigate]);

  // Quick actions
  const handleQuickPublish = async (articleId, e) => {
    e.stopPropagation();
    try {
      await publishArticle(articleId, user?.email || 'admin');
      loadArticles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickUnpublish = async (articleId, e) => {
    e.stopPropagation();
    try {
      await unpublishArticle(articleId, user?.email || 'admin');
      loadArticles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (articleId, title, e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      await deleteArticle(articleId);
      loadArticles();
    } catch (err) {
      setError(err.message);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Loading state
  if (authLoading) {
    return (
      <Layout
        hideParallaxCircle={true}
        hideCircleNav={true}
        sidebarVariant="standard"
        allowScroll={true}
        pageLabel="ARTICLES"
        onHomeClick={handleHomeClick}
        onFooterToggle={handleFooterToggle}
        onMenuToggle={handleMenuToggle}
        navigationItems={adminNavigationItems}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: COLORS.white,
          paddingTop: '80px',
          paddingLeft: '100px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: `3px solid ${COLORS.border}`,
            borderTopColor: COLORS.primary,
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout
      hideParallaxCircle={true}
      hideCircleNav={true}
      sidebarVariant="standard"
      allowScroll={true}
      pageLabel="ARTICLES"
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={adminNavigationItems}
    >
      <div style={{
        minHeight: '100vh',
        backgroundColor: COLORS.white,
        padding: '100px 40px 40px 120px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px'
          }}>
            <div>
              <h1 style={{
                color: COLORS.text,
                fontSize: '28px',
                fontWeight: '700',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FileText style={{ color: COLORS.primary }} size={28} />
                Articles
              </h1>
              <p style={{
                color: COLORS.textMuted,
                fontSize: '14px',
                marginTop: '8px'
              }}>
                Manage blog posts and thought leadership content
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigate('/admin')}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                ← Admin Hub
              </button>
              <button
                onClick={loadArticles}
                disabled={loading}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  opacity: loading ? 0.5 : 1
                }}
              >
                <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/admin/articles/new')}
                style={{ ...styles.button, ...styles.primaryButton }}
              >
                <Plus size={16} />
                New Article
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                ...styles.card,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={20} style={{ color: '#6b7280' }} />
                </div>
                <div>
                  <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>Total</p>
                  <p style={{ color: COLORS.text, fontSize: '24px', fontWeight: '600', margin: 0 }}>{stats.total}</p>
                </div>
              </div>

              <div style={{
                ...styles.card,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Globe size={20} style={{ color: '#15803d' }} />
                </div>
                <div>
                  <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>Published</p>
                  <p style={{ color: COLORS.text, fontSize: '24px', fontWeight: '600', margin: 0 }}>
                    {stats.byStatus?.[ARTICLE_STATUS.PUBLISHED] || 0}
                  </p>
                </div>
              </div>

              <div style={{
                ...styles.card,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FilePlus size={20} style={{ color: '#d97706' }} />
                </div>
                <div>
                  <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>Drafts</p>
                  <p style={{ color: COLORS.text, fontSize: '24px', fontWeight: '600', margin: 0 }}>
                    {stats.byStatus?.[ARTICLE_STATUS.DRAFT] || 0}
                  </p>
                </div>
              </div>

              <div style={{
                ...styles.card,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp size={20} style={{ color: '#1d4ed8' }} />
                </div>
                <div>
                  <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>Total Views</p>
                  <p style={{ color: COLORS.text, fontSize: '24px', fontWeight: '600', margin: 0 }}>
                    {stats.totalViews || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: COLORS.textLight
                }}
              />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  borderRadius: '8px',
                  border: `2px solid ${COLORS.border}`,
                  backgroundColor: COLORS.inputBg,
                  color: COLORS.text,
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.select}
            >
              <option value="">All Status</option>
              <option value={ARTICLE_STATUS.DRAFT}>Draft</option>
              <option value={ARTICLE_STATUS.PUBLISHED}>Published</option>
              <option value={ARTICLE_STATUS.SCHEDULED}>Scheduled</option>
              <option value={ARTICLE_STATUS.ARCHIVED}>Archived</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={styles.select}
            >
              <option value="">All Categories</option>
              {ARTICLE_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '2px solid #fecaca',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              color: COLORS.error
            }}>
              {error}
            </div>
          )}

          {/* Articles List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    height: '100px',
                    borderRadius: '12px',
                    backgroundColor: COLORS.cardBg,
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                />
              ))}
              <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; }}`}</style>
            </div>
          ) : articles.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              borderRadius: '12px',
              backgroundColor: COLORS.cardBg,
              border: `2px solid ${COLORS.border}`
            }}>
              <FileText size={48} style={{ color: COLORS.textLight, marginBottom: '16px' }} />
              <h3 style={{ color: COLORS.text, fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                No Articles Found
              </h3>
              <p style={{ color: COLORS.textMuted, marginBottom: '24px' }}>
                {searchQuery || statusFilter || categoryFilter
                  ? 'Try adjusting your filters'
                  : 'Create your first article to get started'}
              </p>
              <button
                onClick={() => navigate('/admin/articles/new')}
                style={{ ...styles.button, ...styles.primaryButton, margin: '0 auto' }}
              >
                <Plus size={16} />
                Create Article
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {articles.map(article => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/admin/articles/${article.id}`)}
                  style={{
                    ...styles.card,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.primary;
                    e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.primary}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px'
                  }}>
                    {/* Featured image or placeholder */}
                    <div style={{
                      width: '120px',
                      height: '80px',
                      borderRadius: '8px',
                      backgroundColor: COLORS.cardBg,
                      backgroundImage: article.featuredImage?.url ? `url(${article.featuredImage.url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {!article.featuredImage?.url && (
                        <FileText size={24} style={{ color: COLORS.textLight }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                        flexWrap: 'wrap'
                      }}>
                        {/* Status badge */}
                        <span style={{
                          ...(STATUS_COLORS[article.status] || STATUS_COLORS[ARTICLE_STATUS.DRAFT]),
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {article.status}
                        </span>

                        {/* Category */}
                        <span style={{
                          backgroundColor: COLORS.primary + '22',
                          color: COLORS.primaryDark,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {ARTICLE_CATEGORIES.find(c => c.id === article.category)?.label || article.category}
                        </span>

                        {/* Content source */}
                        {article.contentSource === 'mdx' && (
                          <span style={{
                            backgroundColor: '#e0e7ff',
                            color: '#4f46e5',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            MDX
                          </span>
                        )}
                      </div>

                      <h3 style={{
                        color: COLORS.text,
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: '0 0 6px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {article.title || 'Untitled'}
                      </h3>

                      {article.excerpt && (
                        <p style={{
                          color: COLORS.textMuted,
                          fontSize: '13px',
                          margin: '0 0 8px 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {article.excerpt}
                        </p>
                      )}

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '12px',
                        color: COLORS.textLight
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          {article.readingTime || 1} min
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={12} />
                          {article.viewCount || 0} views
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {formatDate(article.updatedAt || article.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0
                    }}>
                      {article.status === ARTICLE_STATUS.PUBLISHED ? (
                        <button
                          onClick={(e) => handleQuickUnpublish(article.id, e)}
                          style={{
                            ...styles.button,
                            ...styles.secondaryButton,
                            padding: '8px'
                          }}
                          title="Unpublish"
                        >
                          <Archive size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleQuickPublish(article.id, e)}
                          style={{
                            ...styles.button,
                            backgroundColor: '#dcfce7',
                            color: COLORS.success,
                            border: '2px solid #bbf7d0',
                            padding: '8px'
                          }}
                          title="Publish"
                        >
                          <Send size={16} />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/articles/${article.id}`);
                        }}
                        style={{
                          ...styles.button,
                          ...styles.secondaryButton,
                          padding: '8px'
                        }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        onClick={(e) => handleDelete(article.id, article.title, e)}
                        style={{
                          ...styles.button,
                          backgroundColor: '#fef2f2',
                          color: COLORS.error,
                          border: '2px solid #fecaca',
                          padding: '8px'
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ArticleListPage;
