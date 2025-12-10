/**
 * useArticles Hook
 *
 * Unified hook for loading articles from both:
 * 1. Firestore (admin-created content)
 * 2. MDX files (dev/SSH-created content)
 *
 * Supports the hybrid CMS approach where content can come
 * from either source with consistent API.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  listPublishedArticles,
  getArticleBySlug,
  incrementViewCount,
  ARTICLE_STATUS
} from '../utils/firestoreArticles';

// ============================================================
// MDX Content Registry
// ============================================================

/**
 * Static registry of MDX articles
 * Updated manually or via build-time script
 *
 * For SSH/Claude Code workflow:
 * 1. Create .md file in /content/blog/
 * 2. Add entry to MDX_ARTICLES below
 * 3. Deploy
 */
const MDX_ARTICLES = [
  {
    id: 'mdx-why-your-gtm-sucks',
    slug: 'why-your-gtm-sucks',
    title: 'Why Your GTM Sucks',
    excerpt: 'The Human Cost of Operations Theater - A thought leadership piece on why traditional GTM approaches fail.',
    category: 'own-your-story',
    tags: ['gtm', 'operations', 'leadership', 'strategy'],
    author: 'Chris Cooper',
    featuredImage: null,
    publishedAt: new Date('2025-11-01'),
    readingTime: 12,
    contentSource: 'mdx',
    mdxPath: '/content/blog/why-your-gtm-sucks.md',
    status: ARTICLE_STATUS.PUBLISHED
  }
  // Add more MDX articles here as they're created
];

// ============================================================
// Content Loader
// ============================================================

/**
 * Load MDX content from file
 * In production, this would be a fetch to the static file
 * For SSR/build-time, this would import the file directly
 */
const loadMdxContent = async (mdxPath) => {
  try {
    // Fetch the raw markdown content
    const response = await fetch(mdxPath);
    if (!response.ok) {
      throw new Error(`Failed to load ${mdxPath}`);
    }
    const text = await response.text();

    // Parse frontmatter (simple implementation)
    const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (frontmatterMatch) {
      return {
        frontmatter: parseFrontmatter(frontmatterMatch[1]),
        content: frontmatterMatch[2].trim()
      };
    }

    return { frontmatter: {}, content: text };
  } catch (err) {
    console.error('Failed to load MDX content:', err);
    return null;
  }
};

/**
 * Simple frontmatter parser
 */
const parseFrontmatter = (raw) => {
  const result = {};
  const lines = raw.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      // Handle arrays (tags)
      if (value.startsWith('[') && value.endsWith(']')) {
        result[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, ''));
      }
      // Handle quoted strings
      else if (value.startsWith('"') && value.endsWith('"')) {
        result[key] = value.slice(1, -1);
      }
      // Handle null
      else if (value === 'null') {
        result[key] = null;
      }
      // Handle numbers
      else if (!isNaN(value)) {
        result[key] = Number(value);
      }
      // Default to string
      else {
        result[key] = value;
      }
    }
  }

  return result;
};

// ============================================================
// Main Hook
// ============================================================

/**
 * Hook to list articles from both sources
 */
export const useArticles = (options = {}) => {
  const {
    includeFirestore = true,
    includeMdx = true,
    category = null,
    tag = null,
    limit = 20
  } = options;

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let allArticles = [];

      // Load Firestore articles
      if (includeFirestore) {
        try {
          const firestoreResult = await listPublishedArticles({
            category,
            tag,
            limitCount: limit
          });
          allArticles = [...allArticles, ...(firestoreResult.articles || [])];
        } catch (err) {
          console.warn('Firestore articles unavailable:', err);
        }
      }

      // Add MDX articles
      if (includeMdx) {
        let mdxArticles = MDX_ARTICLES.filter(a => a.status === ARTICLE_STATUS.PUBLISHED);

        // Apply filters
        if (category) {
          mdxArticles = mdxArticles.filter(a => a.category === category);
        }
        if (tag) {
          mdxArticles = mdxArticles.filter(a => a.tags?.includes(tag));
        }

        // Transform dates to match Firestore format
        const transformedMdx = mdxArticles.map(a => ({
          ...a,
          publishedAt: a.publishedAt instanceof Date ? { toDate: () => a.publishedAt } : a.publishedAt,
          createdAt: a.publishedAt instanceof Date ? { toDate: () => a.publishedAt } : a.publishedAt,
          updatedAt: a.publishedAt instanceof Date ? { toDate: () => a.publishedAt } : a.publishedAt,
          viewCount: a.viewCount || 0
        }));

        allArticles = [...allArticles, ...transformedMdx];
      }

      // Remove duplicates (Firestore takes precedence)
      const slugSet = new Set();
      const uniqueArticles = [];
      for (const article of allArticles) {
        if (!slugSet.has(article.slug)) {
          slugSet.add(article.slug);
          uniqueArticles.push(article);
        }
      }

      // Sort by published date (newest first)
      uniqueArticles.sort((a, b) => {
        const dateA = a.publishedAt?.toDate?.() || new Date(a.publishedAt);
        const dateB = b.publishedAt?.toDate?.() || new Date(b.publishedAt);
        return dateB - dateA;
      });

      // Apply limit
      setArticles(uniqueArticles.slice(0, limit));
    } catch (err) {
      console.error('Failed to load articles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [includeFirestore, includeMdx, category, tag, limit]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  return { articles, loading, error, refresh: loadArticles };
};

/**
 * Hook to load a single article by slug
 */
export const useArticle = (slug) => {
  const [article, setArticle] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First, check Firestore
        let articleData = await getArticleBySlug(slug);

        // If not in Firestore, check MDX registry
        if (!articleData) {
          const mdxArticle = MDX_ARTICLES.find(a => a.slug === slug);
          if (mdxArticle) {
            articleData = {
              ...mdxArticle,
              publishedAt: mdxArticle.publishedAt instanceof Date
                ? { toDate: () => mdxArticle.publishedAt }
                : mdxArticle.publishedAt
            };
          }
        }

        if (!articleData) {
          setError('Article not found');
          setLoading(false);
          return;
        }

        setArticle(articleData);

        // Load content based on source
        if (articleData.contentSource === 'mdx' && articleData.mdxPath) {
          const mdxData = await loadMdxContent(articleData.mdxPath);
          if (mdxData) {
            setContent(mdxData.content);
          }
        } else {
          // Firestore content
          setContent(articleData.content || '');
        }

        // Increment view count for Firestore articles
        if (articleData.id && articleData.contentSource !== 'mdx') {
          incrementViewCount(articleData.id).catch(console.error);
        }
      } catch (err) {
        console.error('Failed to load article:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  return { article, content, loading, error };
};

// ============================================================
// Utilities
// ============================================================

/**
 * Get all unique categories from articles
 */
export const useArticleCategories = () => {
  const { articles } = useArticles({ limit: 100 });

  const categories = [...new Set(articles.map(a => a.category))].filter(Boolean);
  return categories;
};

/**
 * Get all unique tags from articles
 */
export const useArticleTags = () => {
  const { articles } = useArticles({ limit: 100 });

  const tags = [...new Set(articles.flatMap(a => a.tags || []))].filter(Boolean);
  return tags;
};

/**
 * Get related articles (same category or shared tags)
 */
export const useRelatedArticles = (currentSlug, limit = 3) => {
  const { article: currentArticle } = useArticle(currentSlug);
  const { articles: allArticles } = useArticles({ limit: 50 });

  if (!currentArticle) {
    return { articles: [], loading: true };
  }

  // Score articles by relevance
  const scored = allArticles
    .filter(a => a.slug !== currentSlug)
    .map(a => {
      let score = 0;

      // Same category
      if (a.category === currentArticle.category) {
        score += 3;
      }

      // Shared tags
      const sharedTags = (a.tags || []).filter(t =>
        (currentArticle.tags || []).includes(t)
      );
      score += sharedTags.length;

      return { ...a, relevanceScore: score };
    })
    .filter(a => a.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  return { articles: scored, loading: false };
};

// ============================================================
// Export
// ============================================================

export default useArticles;
