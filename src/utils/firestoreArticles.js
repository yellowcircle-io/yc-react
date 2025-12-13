/**
 * Firestore Articles Utilities
 *
 * Blog/article management for yellowCircle hybrid CMS.
 * Supports both Firestore-stored articles and MDX file references.
 *
 * Schema designed for WordPress-like functionality with:
 * - Draft/published/scheduled status
 * - Categories and tags
 * - Featured images
 * - SEO metadata
 * - Author tracking
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================================
// Constants
// ============================================================

export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  SCHEDULED: 'scheduled',
  ARCHIVED: 'archived'
};

export const ARTICLE_CATEGORIES = [
  { id: 'own-your-story', label: 'Own Your Story', description: 'Thought leadership series' },
  { id: 'gtm-insights', label: 'GTM Insights', description: 'Go-to-market strategies' },
  { id: 'tech-notes', label: 'Tech Notes', description: 'Technical deep-dives' },
  { id: 'case-studies', label: 'Case Studies', description: 'Client success stories' },
  { id: 'industry', label: 'Industry', description: 'Market trends and analysis' },
  { id: 'updates', label: 'Updates', description: 'Company news and announcements' }
];

export const CONTENT_SOURCE = {
  FIRESTORE: 'firestore',
  MDX: 'mdx',
  BLOCKS: 'blocks' // Block-based content
};

// Block types for block-based articles
export const BLOCK_TYPES = {
  HERO: 'hero',
  LEAD_PARAGRAPH: 'lead-paragraph',
  PARAGRAPH: 'paragraph',
  SECTION_HEADER: 'section-header',
  STAT_GRID: 'stat-grid',
  BULLET_LIST: 'bullet-list',
  QUOTE: 'quote',
  PERSONA_CARD: 'persona-card',
  NUMBERED_LIST: 'numbered-list',
  ACTION_GRID: 'action-grid',
  CALLOUT_BOX: 'callout-box',
  CTA_SECTION: 'cta-section',
  SOURCES: 'sources'
};

// ============================================================
// Article Object Factory
// ============================================================

/**
 * Create a new article object with defaults
 */
export const createArticleObject = ({
  id = null,
  title = '',
  slug = '',
  excerpt = '',
  content = '',
  category = 'updates',
  tags = [],
  status = ARTICLE_STATUS.DRAFT,
  featuredImage = null,
  author = 'Chris Cooper',
  authorEmail = 'chris@yellowcircle.io',
  seo = {},
  readingTime = null,
  contentSource = CONTENT_SOURCE.FIRESTORE,
  mdxPath = null
} = {}) => {
  // Auto-generate slug from title if not provided
  const generatedSlug = slug || title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Estimate reading time (avg 200 words/min)
  const estimatedReadingTime = readingTime || Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

  return {
    // Identity
    id: id || `article-${Date.now()}`,
    slug: generatedSlug,

    // Content
    title,
    excerpt,
    content, // Legacy: plain text/markdown
    blocks: [], // Block-based content array
    contentSource,
    mdxPath, // For MDX files: '/content/blog/my-article.mdx'

    // Organization
    category,
    tags,

    // Status
    status,
    publishedAt: null,
    scheduledFor: null,

    // Media
    featuredImage: featuredImage || {
      url: null,
      alt: title,
      caption: null
    },

    // Author
    author,
    authorEmail,

    // SEO
    seo: {
      metaTitle: seo.metaTitle || title,
      metaDescription: seo.metaDescription || excerpt,
      ogImage: seo.ogImage || null,
      canonicalUrl: seo.canonicalUrl || null,
      noIndex: seo.noIndex || false,
      ...seo
    },

    // Stats
    readingTime: estimatedReadingTime,
    viewCount: 0,

    // Timestamps
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
};

// ============================================================
// CRUD Operations
// ============================================================

/**
 * Get article by ID
 */
export const getArticle = async (articleId) => {
  const docRef = doc(db, 'articles', articleId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() };
};

/**
 * Get article by slug
 */
export const getArticleBySlug = async (slug) => {
  const q = query(
    collection(db, 'articles'),
    where('slug', '==', slug),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

/**
 * List articles with filters
 */
export const listArticles = async ({
  status = null,
  category = null,
  tag = null,
  contentSource = null,
  limitCount = 20,
  orderField = 'publishedAt',
  orderDirection = 'desc',
  afterDoc = null
} = {}) => {
  let q = collection(db, 'articles');
  const constraints = [];

  // Status filter
  if (status) {
    constraints.push(where('status', '==', status));
  }

  // Category filter
  if (category) {
    constraints.push(where('category', '==', category));
  }

  // Tag filter (array-contains)
  if (tag) {
    constraints.push(where('tags', 'array-contains', tag));
  }

  // Content source filter
  if (contentSource) {
    constraints.push(where('contentSource', '==', contentSource));
  }

  // Ordering
  constraints.push(orderBy(orderField, orderDirection));

  // Pagination
  if (afterDoc) {
    constraints.push(startAfter(afterDoc));
  }

  // Limit
  constraints.push(limit(limitCount));

  q = query(q, ...constraints);

  const snapshot = await getDocs(q);
  const articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    articles,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === limitCount
  };
};

/**
 * List published articles (public-facing)
 */
export const listPublishedArticles = async (options = {}) => {
  return listArticles({
    ...options,
    status: ARTICLE_STATUS.PUBLISHED,
    orderField: 'publishedAt',
    orderDirection: 'desc'
  });
};

/**
 * Save article (create or update)
 */
export const saveArticle = async (article, updatedBy = 'system') => {
  const { id, ...articleData } = article;

  if (!id) {
    throw new Error('Article ID is required');
  }

  const docRef = doc(db, 'articles', id);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    // Update
    await updateDoc(docRef, {
      ...articleData,
      updatedAt: serverTimestamp(),
      updatedBy
    });
  } else {
    // Create
    await setDoc(docRef, {
      id,
      ...articleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: updatedBy,
      updatedBy
    });
  }

  return getArticle(id);
};

/**
 * Publish article
 */
export const publishArticle = async (articleId, updatedBy = 'system') => {
  const docRef = doc(db, 'articles', articleId);

  await updateDoc(docRef, {
    status: ARTICLE_STATUS.PUBLISHED,
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy
  });

  return getArticle(articleId);
};

/**
 * Unpublish article (revert to draft)
 */
export const unpublishArticle = async (articleId, updatedBy = 'system') => {
  const docRef = doc(db, 'articles', articleId);

  await updateDoc(docRef, {
    status: ARTICLE_STATUS.DRAFT,
    updatedAt: serverTimestamp(),
    updatedBy
  });

  return getArticle(articleId);
};

/**
 * Schedule article for future publication
 */
export const scheduleArticle = async (articleId, scheduledDate, updatedBy = 'system') => {
  const docRef = doc(db, 'articles', articleId);

  await updateDoc(docRef, {
    status: ARTICLE_STATUS.SCHEDULED,
    scheduledFor: Timestamp.fromDate(new Date(scheduledDate)),
    updatedAt: serverTimestamp(),
    updatedBy
  });

  return getArticle(articleId);
};

/**
 * Archive article
 */
export const archiveArticle = async (articleId, updatedBy = 'system') => {
  const docRef = doc(db, 'articles', articleId);

  await updateDoc(docRef, {
    status: ARTICLE_STATUS.ARCHIVED,
    updatedAt: serverTimestamp(),
    updatedBy
  });

  return getArticle(articleId);
};

/**
 * Delete article permanently
 */
export const deleteArticle = async (articleId) => {
  const docRef = doc(db, 'articles', articleId);
  await deleteDoc(docRef);
  return { deleted: true, id: articleId };
};

/**
 * Increment view count
 */
export const incrementViewCount = async (articleId) => {
  const article = await getArticle(articleId);
  if (!article) return null;

  const docRef = doc(db, 'articles', articleId);
  await updateDoc(docRef, {
    viewCount: (article.viewCount || 0) + 1
  });

  return getArticle(articleId);
};

// ============================================================
// Search
// ============================================================

/**
 * Search articles by title/excerpt
 * Note: Basic search - for full-text search consider Algolia integration
 */
export const searchArticles = async (searchTerm, options = {}) => {
  // Firestore doesn't have native full-text search
  // This fetches all and filters client-side (fine for small collections)
  const { articles } = await listArticles({
    ...options,
    limitCount: 100
  });

  const term = searchTerm.toLowerCase();

  return articles.filter(article =>
    article.title?.toLowerCase().includes(term) ||
    article.excerpt?.toLowerCase().includes(term) ||
    article.tags?.some(tag => tag.toLowerCase().includes(term))
  );
};

// ============================================================
// Stats
// ============================================================

/**
 * Get article stats
 */
export const getArticleStats = async () => {
  const allArticles = await listArticles({ limitCount: 500 });

  const stats = {
    total: allArticles.articles.length,
    byStatus: {},
    byCategory: {},
    bySource: {},
    totalViews: 0
  };

  for (const article of allArticles.articles) {
    // By status
    stats.byStatus[article.status] = (stats.byStatus[article.status] || 0) + 1;

    // By category
    stats.byCategory[article.category] = (stats.byCategory[article.category] || 0) + 1;

    // By source
    stats.bySource[article.contentSource] = (stats.bySource[article.contentSource] || 0) + 1;

    // Total views
    stats.totalViews += article.viewCount || 0;
  }

  return stats;
};

// ============================================================
// MDX Integration Helpers
// ============================================================

/**
 * Register an MDX file as an article in Firestore
 * Called during build or manually to sync MDX content
 */
export const registerMdxArticle = async ({
  mdxPath,
  title,
  slug,
  excerpt,
  category,
  tags = [],
  author = 'Chris Cooper',
  featuredImage = null,
  publishedAt = null
}) => {
  const id = `mdx-${slug}`;

  const article = createArticleObject({
    id,
    title,
    slug,
    excerpt,
    content: '', // Content loaded from MDX at runtime
    category,
    tags,
    status: publishedAt ? ARTICLE_STATUS.PUBLISHED : ARTICLE_STATUS.DRAFT,
    author,
    featuredImage,
    contentSource: CONTENT_SOURCE.MDX,
    mdxPath
  });

  // Set published date if provided
  if (publishedAt) {
    article.publishedAt = Timestamp.fromDate(new Date(publishedAt));
  }

  return saveArticle(article, 'mdx-sync');
};

/**
 * Get all MDX articles (for build-time processing)
 */
export const getMdxArticles = async () => {
  return listArticles({ contentSource: CONTENT_SOURCE.MDX, limitCount: 100 });
};

// ============================================================
// Export
// ============================================================

export default {
  // Constants
  ARTICLE_STATUS,
  ARTICLE_CATEGORIES,
  CONTENT_SOURCE,

  // Factory
  createArticleObject,

  // CRUD
  getArticle,
  getArticleBySlug,
  listArticles,
  listPublishedArticles,
  saveArticle,
  publishArticle,
  unpublishArticle,
  scheduleArticle,
  archiveArticle,
  deleteArticle,
  incrementViewCount,

  // Search
  searchArticles,

  // Stats
  getArticleStats,

  // MDX
  registerMdxArticle,
  getMdxArticles
};
