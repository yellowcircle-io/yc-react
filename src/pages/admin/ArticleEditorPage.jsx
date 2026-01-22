/**
 * Article Editor Admin Page
 *
 * WordPress-like blog editor for yellowCircle hybrid CMS.
 * Supports rich text editing, draft/publish workflow, and MDX sync.
 *
 * Features:
 * - Rich text editor with formatting toolbar
 * - Draft/Published/Scheduled status
 * - Categories and tags
 * - Featured image
 * - SEO metadata
 * - Preview mode
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/global/Layout';
import { useAuth } from '../../contexts/AuthContext';
import {
  getArticle,
  saveArticle,
  unpublishArticle,
  deleteArticle,
  createArticleObject,
  ARTICLE_STATUS,
  ARTICLE_CATEGORIES
} from '../../utils/firestoreArticles';
import {
  FileText,
  Save,
  Send,
  Eye,
  Archive,
  Trash2,
  X,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  Plus,
  Image,
  Link,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Calendar,
  Tag,
  Globe,
  Clock,
  Home,
  Check
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
// Reusable Styles
// ============================================================
const styles = {
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: `2px solid ${COLORS.border}`,
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: `2px solid ${COLORS.border}`,
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '100px',
    fontFamily: 'inherit',
    lineHeight: '1.6',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: `2px solid ${COLORS.border}`,
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
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
  dangerButton: {
    backgroundColor: '#fef2f2',
    color: COLORS.error,
    border: `2px solid #fecaca`
  },
  successButton: {
    backgroundColor: '#dcfce7',
    color: COLORS.success,
    border: `2px solid #bbf7d0`
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  card: {
    backgroundColor: COLORS.white,
    border: `2px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '20px'
  }
};

// ============================================================
// Simple Rich Text Toolbar
// ============================================================
const EditorToolbar = ({ onFormat }) => {
  const tools = [
    { icon: Bold, action: 'bold', title: 'Bold' },
    { icon: Italic, action: 'italic', title: 'Italic' },
    { icon: Heading1, action: 'h1', title: 'Heading 1' },
    { icon: Heading2, action: 'h2', title: 'Heading 2' },
    { icon: Heading3, action: 'h3', title: 'Heading 3' },
    { icon: List, action: 'ul', title: 'Bullet List' },
    { icon: ListOrdered, action: 'ol', title: 'Numbered List' },
    { icon: Quote, action: 'quote', title: 'Quote' },
    { icon: Code, action: 'code', title: 'Code Block' },
    { icon: Link, action: 'link', title: 'Link' },
    { icon: Image, action: 'image', title: 'Image' }
  ];

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      padding: '8px 12px',
      backgroundColor: COLORS.cardBg,
      borderBottom: `2px solid ${COLORS.border}`,
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px'
    }}>
      {tools.map((tool) => {
        const IconComponent = tool.icon;
        return (
          <button
            key={tool.action}
            type="button"
            onClick={() => onFormat(tool.action)}
            title={tool.title}
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              color: COLORS.textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = COLORS.white;
              e.target.style.color = COLORS.text;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = COLORS.textMuted;
            }}
          >
            <IconComponent size={16} />
          </button>
        );
      })}
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
const ArticleEditorPage = () => {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const contentRef = useRef(null);

  // Article state
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('updates');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState(ARTICLE_STATUS.DRAFT);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [_hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Layout callbacks
  const handleHomeClick = () => navigate('/');
  const handleFooterToggle = () => {};
  const handleMenuToggle = () => {};

  // Load article if editing
  useEffect(() => {
    const loadArticle = async () => {
      if (!articleId || articleId === 'new') {
        // New article
        setArticle(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getArticle(articleId);
        if (data) {
          setArticle(data);
          setTitle(data.title || '');
          setSlug(data.slug || '');
          setExcerpt(data.excerpt || '');
          setContent(data.content || '');
          setCategory(data.category || 'updates');
          setTags(data.tags?.join(', ') || '');
          setStatus(data.status || ARTICLE_STATUS.DRAFT);
          setFeaturedImageUrl(data.featuredImage?.url || '');
          setMetaTitle(data.seo?.metaTitle || '');
          setMetaDescription(data.seo?.metaDescription || '');
        } else {
          setError('Article not found');
        }
      } catch (err) {
        console.error('Failed to load article:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAdmin) {
      loadArticle();
    }
  }, [articleId, authLoading, isAdmin]);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/unity-notes');
    }
  }, [authLoading, isAdmin, navigate]);

  // Track unsaved changes
  useEffect(() => {
    if (!loading && !saving) {
      setHasUnsavedChanges(true);
    }
  }, [title, slug, excerpt, content, category, tags, featuredImageUrl, metaTitle, metaDescription]);

  // Auto-generate slug from title
  const generateSlug = useCallback((titleText) => {
    return titleText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!article) {
      // Only auto-generate slug for new articles
      setSlug(generateSlug(newTitle));
    }
  };

  // Handle formatting
  const handleFormat = (action) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = '';
    let cursorOffset = 0;

    switch (action) {
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case 'h1':
        newText = `\n# ${selectedText || 'Heading 1'}\n`;
        break;
      case 'h2':
        newText = `\n## ${selectedText || 'Heading 2'}\n`;
        break;
      case 'h3':
        newText = `\n### ${selectedText || 'Heading 3'}\n`;
        break;
      case 'ul':
        newText = `\n- ${selectedText || 'List item'}\n`;
        break;
      case 'ol':
        newText = `\n1. ${selectedText || 'List item'}\n`;
        break;
      case 'quote':
        newText = `\n> ${selectedText || 'Quote text'}\n`;
        break;
      case 'code':
        newText = selectedText.includes('\n')
          ? `\n\`\`\`\n${selectedText || 'code'}\n\`\`\`\n`
          : `\`${selectedText || 'code'}\``;
        break;
      case 'link':
        newText = `[${selectedText || 'link text'}](url)`;
        break;
      case 'image':
        newText = `![${selectedText || 'alt text'}](image-url)`;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + newText.length + cursorOffset;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Save article
  const handleSave = async (newStatus = null) => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const articleData = createArticleObject({
        id: article?.id || `article-${Date.now()}`,
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        status: newStatus || status,
        featuredImage: featuredImageUrl ? { url: featuredImageUrl, alt: title } : null,
        author: user?.displayName || 'Chris Cooper',
        authorEmail: user?.email || 'chris@yellowcircle.io',
        seo: {
          metaTitle: metaTitle.trim() || title,
          metaDescription: metaDescription.trim() || excerpt
        }
      });

      // Preserve existing metadata
      if (article) {
        articleData.createdAt = article.createdAt;
        articleData.viewCount = article.viewCount || 0;
        if (article.publishedAt) {
          articleData.publishedAt = article.publishedAt;
        }
      }

      const saved = await saveArticle(articleData, user?.email || 'admin');
      setArticle(saved);
      setHasUnsavedChanges(false);
      setSuccessMessage('Article saved successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

      // Navigate to edit URL if this was a new article
      if (!articleId || articleId === 'new') {
        navigate(`/admin/articles/${saved.id}`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to save article:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Publish article
  const handlePublish = async () => {
    await handleSave(ARTICLE_STATUS.PUBLISHED);
    if (!error) {
      setStatus(ARTICLE_STATUS.PUBLISHED);
      setSuccessMessage('Article published!');
    }
  };

  // Unpublish article
  const handleUnpublish = async () => {
    if (!article?.id) return;

    setSaving(true);
    try {
      await unpublishArticle(article.id, user?.email || 'admin');
      setStatus(ARTICLE_STATUS.DRAFT);
      setSuccessMessage('Article unpublished');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete article
  const handleDelete = async () => {
    if (!article?.id) return;

    setSaving(true);
    try {
      await deleteArticle(article.id);
      navigate('/admin/articles');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  // Estimate reading time
  const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200));

  // Loading state
  if (authLoading || loading) {
    return (
      <Layout
        hideParallaxCircle={true}
        hideCircleNav={true}
        sidebarVariant="standard"
        allowScroll={true}
        pageLabel="EDITOR"
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
      pageLabel="EDITOR"
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
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => navigate('/admin/articles')}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  padding: '8px 12px'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h1 style={{
                  color: COLORS.text,
                  fontSize: '24px',
                  fontWeight: '700',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FileText style={{ color: COLORS.primary }} size={24} />
                  {article ? 'Edit Article' : 'New Article'}
                </h1>
                {article && (
                  <p style={{ color: COLORS.textMuted, fontSize: '13px', marginTop: '4px' }}>
                    {status === ARTICLE_STATUS.PUBLISHED ? 'Published' : 'Draft'} • {readingTime} min read
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Preview button */}
              <button
                onClick={() => setShowPreview(true)}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                <Eye size={16} />
                Preview
              </button>

              {/* Save draft */}
              <button
                onClick={() => handleSave()}
                disabled={saving}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  opacity: saving ? 0.5 : 1
                }}
              >
                {saving ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                Save Draft
              </button>

              {/* Publish/Unpublish */}
              {status === ARTICLE_STATUS.PUBLISHED ? (
                <button
                  onClick={handleUnpublish}
                  disabled={saving}
                  style={{ ...styles.button, ...styles.dangerButton }}
                >
                  <Archive size={16} />
                  Unpublish
                </button>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={saving}
                  style={{ ...styles.button, ...styles.successButton }}
                >
                  <Send size={16} />
                  Publish
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '2px solid #fecaca',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertTriangle size={20} style={{ color: COLORS.error }} />
              <span style={{ color: COLORS.error, flex: 1 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} style={{ color: '#f87171' }} />
              </button>
            </div>
          )}

          {successMessage && (
            <div style={{
              backgroundColor: '#dcfce7',
              border: '2px solid #bbf7d0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Check size={20} style={{ color: COLORS.success }} />
              <span style={{ color: COLORS.success }}>{successMessage}</span>
            </div>
          )}

          {/* Main editor grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: '24px'
          }}>
            {/* Left column - Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Title */}
              <div>
                <label style={styles.label}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Enter article title..."
                  style={{
                    ...styles.input,
                    fontSize: '18px',
                    fontWeight: '600',
                    padding: '14px 16px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}33`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = COLORS.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Excerpt */}
              <div>
                <label style={styles.label}>Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary for article cards and SEO..."
                  rows={3}
                  style={styles.textarea}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}33`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = COLORS.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Content editor */}
              <div>
                <label style={styles.label}>Content (Markdown)</label>
                <div style={{
                  border: `2px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <EditorToolbar onFormat={handleFormat} />
                  <textarea
                    ref={contentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your article content in Markdown..."
                    style={{
                      ...styles.textarea,
                      border: 'none',
                      borderRadius: 0,
                      minHeight: '400px',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '14px',
                      lineHeight: '1.7'
                    }}
                    onFocus={(e) => {
                      e.target.parentElement.style.borderColor = COLORS.primary;
                      e.target.parentElement.style.boxShadow = `0 0 0 3px ${COLORS.primary}33`;
                    }}
                    onBlur={(e) => {
                      e.target.parentElement.style.borderColor = COLORS.border;
                      e.target.parentElement.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <p style={{
                  color: COLORS.textLight,
                  fontSize: '12px',
                  marginTop: '8px'
                }}>
                  {content.split(/\s+/).filter(Boolean).length} words • {readingTime} min read
                </p>
              </div>
            </div>

            {/* Right column - Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Status card */}
              <div style={styles.card}>
                <h3 style={{
                  color: COLORS.text,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Globe size={16} style={{ color: COLORS.primary }} />
                  Status
                </h3>

                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: status === ARTICLE_STATUS.PUBLISHED ? '#dcfce7' : COLORS.cardBg,
                  border: `1px solid ${status === ARTICLE_STATUS.PUBLISHED ? '#bbf7d0' : COLORS.border}`,
                  marginBottom: '12px'
                }}>
                  <span style={{
                    color: status === ARTICLE_STATUS.PUBLISHED ? COLORS.success : COLORS.textMuted,
                    fontWeight: '500',
                    fontSize: '13px'
                  }}>
                    {status === ARTICLE_STATUS.PUBLISHED && '● '}
                    {status === ARTICLE_STATUS.PUBLISHED ? 'Published' :
                     status === ARTICLE_STATUS.SCHEDULED ? 'Scheduled' :
                     status === ARTICLE_STATUS.ARCHIVED ? 'Archived' : 'Draft'}
                  </span>
                </div>

                {article?.publishedAt && (
                  <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '12px' }}>
                    Published: {article.publishedAt.toDate?.().toLocaleDateString() || 'Unknown'}
                  </p>
                )}

                {/* Delete button */}
                {article && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      ...styles.button,
                      ...styles.dangerButton,
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={16} />
                    Delete Article
                  </button>
                )}
              </div>

              {/* Permalink card */}
              <div style={styles.card}>
                <h3 style={{
                  color: COLORS.text,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Link size={16} style={{ color: COLORS.primary }} />
                  Permalink
                </h3>

                <label style={styles.label}>Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="article-url-slug"
                  style={styles.input}
                />
                <p style={{ color: COLORS.textLight, fontSize: '11px', marginTop: '6px' }}>
                  /thoughts/{slug || 'your-slug'}
                </p>
              </div>

              {/* Category card */}
              <div style={styles.card}>
                <h3 style={{
                  color: COLORS.text,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Tag size={16} style={{ color: COLORS.primary }} />
                  Organization
                </h3>

                <label style={styles.label}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={styles.select}
                >
                  {ARTICLE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>

                <label style={{ ...styles.label, marginTop: '16px' }}>Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  style={styles.input}
                />
                <p style={{ color: COLORS.textLight, fontSize: '11px', marginTop: '6px' }}>
                  Separate tags with commas
                </p>
              </div>

              {/* Featured Image card */}
              <div style={styles.card}>
                <h3 style={{
                  color: COLORS.text,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Image size={16} style={{ color: COLORS.primary }} />
                  Featured Image
                </h3>

                <label style={styles.label}>Image URL</label>
                <input
                  type="text"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="https://..."
                  style={styles.input}
                />

                {featuredImageUrl && (
                  <div style={{
                    marginTop: '12px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: `1px solid ${COLORS.border}`
                  }}>
                    <img
                      src={featuredImageUrl}
                      alt="Featured"
                      style={{
                        width: '100%',
                        height: '160px',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* SEO card */}
              <div style={styles.card}>
                <h3 style={{
                  color: COLORS.text,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Globe size={16} style={{ color: COLORS.primary }} />
                  SEO
                </h3>

                <label style={styles.label}>Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || 'Page title for search engines'}
                  style={styles.input}
                />

                <label style={{ ...styles.label, marginTop: '16px' }}>Meta Description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={excerpt || 'Description for search results'}
                  rows={3}
                  style={styles.textarea}
                />
                <p style={{ color: COLORS.textLight, fontSize: '11px', marginTop: '6px' }}>
                  {metaDescription.length}/160 characters
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              backgroundColor: COLORS.white,
              border: `2px solid ${COLORS.border}`,
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '400px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              color: COLORS.text,
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              Delete Article?
            </h2>
            <p style={{ color: COLORS.textMuted, marginBottom: '24px' }}>
              This action cannot be undone. The article "{title}" will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                style={{ ...styles.button, backgroundColor: COLORS.error, color: COLORS.white }}
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Preview Modal */}
      {showPreview && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            overflow: 'auto'
          }}
        >
          <div style={{
            maxWidth: '800px',
            margin: '40px auto',
            backgroundColor: COLORS.white,
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            {/* Preview header */}
            <div style={{
              padding: '16px 24px',
              backgroundColor: COLORS.cardBg,
              borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>Preview Mode</span>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: COLORS.textMuted
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Featured image */}
            {featuredImageUrl && (
              <img
                src={featuredImageUrl}
                alt={title}
                style={{
                  width: '100%',
                  height: '300px',
                  objectFit: 'cover'
                }}
              />
            )}

            {/* Content */}
            <div style={{ padding: '40px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <span style={{
                  backgroundColor: COLORS.primary,
                  color: '#000',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {ARTICLE_CATEGORIES.find(c => c.id === category)?.label || category}
                </span>
                <span style={{ color: COLORS.textLight, fontSize: '13px' }}>
                  {readingTime} min read
                </span>
              </div>

              <h1 style={{
                color: COLORS.text,
                fontSize: '32px',
                fontWeight: '700',
                lineHeight: '1.2',
                marginBottom: '16px'
              }}>
                {title || 'Untitled Article'}
              </h1>

              {excerpt && (
                <p style={{
                  color: COLORS.textMuted,
                  fontSize: '18px',
                  lineHeight: '1.6',
                  marginBottom: '32px'
                }}>
                  {excerpt}
                </p>
              )}

              <div style={{
                color: COLORS.text,
                fontSize: '16px',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap'
              }}>
                {content || 'No content yet...'}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
};

export default ArticleEditorPage;
