/**
 * ArticleV2Page
 *
 * Renders block-based articles using the ArticleRenderer.
 * This page serves as the validation endpoint for the new CMS.
 *
 * Route: /thoughts/:slug-v2 (for comparison with original JSX pages)
 * Example: /thoughts/why-your-gtm-sucks-v2
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { ArticleRenderer } from '../../components/articles/ArticleRenderer';

// Import article data (static for now, will be Firestore later)
import { WHY_YOUR_GTM_SUCKS_V2 } from '../../data/articles/why-your-gtm-sucks-v2';

// Article registry (will be replaced by Firestore queries)
const ARTICLES = {
  'why-your-gtm-sucks-v2': WHY_YOUR_GTM_SUCKS_V2
};

function ArticleV2Page() {
  const { slug } = useParams();

  // Look up article by slug
  const article = ARTICLES[slug];

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
