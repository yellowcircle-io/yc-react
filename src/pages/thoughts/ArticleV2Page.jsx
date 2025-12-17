/**
 * ArticleV2Page
 *
 * Renders block-based articles using the ArticleRenderer.
 * Fetches articles from Firestore CMS.
 *
 * Route: /thoughts/:slug
 * Example: /thoughts/why-your-gtm-sucks
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleRenderer } from '../../components/articles/ArticleRenderer';
import { getArticleBySlug, incrementViewCount } from '../../utils/firestoreArticles';

// Fallback static articles (for backwards compatibility)
import { WHY_YOUR_GTM_SUCKS_V2 } from '../../data/articles/why-your-gtm-sucks-v2';

const STATIC_ARTICLES = {
  'why-your-gtm-sucks': WHY_YOUR_GTM_SUCKS_V2,
  'why-your-gtm-sucks-v2': WHY_YOUR_GTM_SUCKS_V2
};

function ArticleV2Page() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true);
      setError(null);

      try {
        // First try Firestore
        const firestoreArticle = await getArticleBySlug(slug);

        if (firestoreArticle && firestoreArticle.status === 'published') {
          setArticle(firestoreArticle);
          // Track view
          incrementViewCount(firestoreArticle.id).catch(() => {});
        } else if (STATIC_ARTICLES[slug]) {
          // Fall back to static articles
          setArticle(STATIC_ARTICLES[slug]);
        } else {
          setArticle(null);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        // Try static fallback on error
        if (STATIC_ARTICLES[slug]) {
          setArticle(STATIC_ARTICLES[slug]);
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #fbbf24',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#666' }}>Loading article...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Show not found state for unknown slugs
  if (!article) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
        padding: '40px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', color: '#fbbf24', marginBottom: '16px' }}>404</h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>
            Article not found: {slug}
          </p>
          <a
            href="/thoughts"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#fbbf24',
              color: 'black',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            ← Back to Thoughts
          </a>
        </div>
      </div>
    );
  }

  return <ArticleRenderer article={article} showBackNav={true} />;
}

export default ArticleV2Page;
