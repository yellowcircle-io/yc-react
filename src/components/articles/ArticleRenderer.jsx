/**
 * ArticleRenderer
 *
 * Renders an article from a block-based data structure.
 * Used by both Firestore-stored articles and MDX articles.
 *
 * Usage:
 * <ArticleRenderer article={articleData} onNavigate={navigate} />
 *
 * Article Structure:
 * {
 *   id: 'article-id',
 *   title: 'Article Title',
 *   blocks: [
 *     { type: 'hero', ... },
 *     { type: 'paragraph', content: '...' },
 *     ...
 *   ]
 * }
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Layout from '../global/Layout';
import ReadingProgressBar from '../shared/ReadingProgressBar';
import { COLORS } from '../../styles/constants';
import { navigationItems } from '../../config/navigationItems';
import {
  HeroBlock,
  LeadParagraphBlock,
  ParagraphBlock,
  SectionHeaderBlock,
  StatGridBlock,
  BulletListBlock,
  QuoteBlock,
  PersonaCardBlock,
  NumberedListBlock,
  ActionGridBlock,
  CalloutBoxBlock,
  CTASectionBlock,
  SourcesBlock,
  BackNavBlock
} from './ArticleBlocks';

// ============================================================
// Block Type Constants
// ============================================================
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
// Block Renderer
// ============================================================
function renderBlock(block, index, navigate) {
  const key = `block-${index}`;

  switch (block.type) {
    case BLOCK_TYPES.HERO:
      return (
        <HeroBlock
          key={key}
          seriesLabel={block.seriesLabel}
          title={block.title}
          subtitle={block.subtitle}
          readingTime={block.readingTime}
          date={block.date}
          author={block.author}
        />
      );

    case BLOCK_TYPES.LEAD_PARAGRAPH:
      return (
        <LeadParagraphBlock key={key} highlight={block.highlight}>
          {block.content}
        </LeadParagraphBlock>
      );

    case BLOCK_TYPES.PARAGRAPH:
      return (
        <ParagraphBlock key={key} muted={block.muted}>
          {block.content}
        </ParagraphBlock>
      );

    case BLOCK_TYPES.SECTION_HEADER:
      return (
        <SectionHeaderBlock key={key} number={block.number}>
          {block.title}
        </SectionHeaderBlock>
      );

    case BLOCK_TYPES.STAT_GRID:
      return <StatGridBlock key={key} stats={block.stats} />;

    case BLOCK_TYPES.BULLET_LIST:
      return <BulletListBlock key={key} items={block.items} />;

    case BLOCK_TYPES.QUOTE:
      return (
        <QuoteBlock key={key} author={block.author}>
          {block.content}
        </QuoteBlock>
      );

    case BLOCK_TYPES.PERSONA_CARD:
      return (
        <PersonaCardBlock
          key={key}
          name={block.name}
          role={block.role}
          description={block.description}
          cost={block.cost}
        />
      );

    case BLOCK_TYPES.NUMBERED_LIST:
      return (
        <NumberedListBlock
          key={key}
          items={block.items}
          highlighted={block.highlighted}
        />
      );

    case BLOCK_TYPES.ACTION_GRID:
      return <ActionGridBlock key={key} items={block.items} />;

    case BLOCK_TYPES.CALLOUT_BOX:
      return (
        <CalloutBoxBlock key={key} title={block.title} highlight={block.highlight}>
          {block.content}
        </CalloutBoxBlock>
      );

    case BLOCK_TYPES.CTA_SECTION: {
      // Map button links to navigate calls
      const buttons = (block.buttons || []).map(btn => ({
        ...btn,
        onClick: btn.link ? () => navigate(btn.link) : btn.onClick
      }));
      return <CTASectionBlock key={key} prompt={block.prompt} buttons={buttons} />;
    }

    case BLOCK_TYPES.SOURCES:
      return <SourcesBlock key={key} sources={block.sources} />;

    default:
      console.warn(`Unknown block type: ${block.type}`);
      return null;
  }
}

// ============================================================
// Main ArticleRenderer Component
// ============================================================
export function ArticleRenderer({ article, showBackNav = true }) {
  const navigate = useNavigate();
  const { sidebarOpen, handleFooterToggle, handleMenuToggle } = useLayout();
  const contentRef = useRef(null);
  const [readingProgress, setReadingProgress] = useState(0);

  // Calculate reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const element = contentRef.current;
      const scrollTop = window.scrollY;
      const docHeight = element.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleBackClick = () => {
    navigate('/thoughts');
  };

  if (!article) {
    return (
      <Layout
        onHomeClick={handleHomeClick}
        onFooterToggle={handleFooterToggle}
        onMenuToggle={handleMenuToggle}
        navigationItems={navigationItems}
        pageLabel="THOUGHTS"
        allowScroll={true}
      >
        <div style={{
          minHeight: '100vh',
          backgroundColor: COLORS.black,
          color: COLORS.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p>Article not found</p>
        </div>
      </Layout>
    );
  }

  const blocks = article.blocks || [];

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="THOUGHTS"
      allowScroll={true}
    >
      {/* Reading Progress Indicator */}
      <ReadingProgressBar progress={readingProgress} />

      {/* Article Container */}
      <div
        ref={contentRef}
        data-article-content
        style={{
          minHeight: '100vh',
          backgroundColor: COLORS.black,
          color: COLORS.white,
          paddingTop: '240px',
          paddingBottom: 'max(120px, env(safe-area-inset-bottom))',
          paddingLeft: sidebarOpen ? 'calc(min(35vw, 472px) + 40px)' : 'max(100px, 8vw)',
          paddingRight: 'max(40px, env(safe-area-inset-right))',
          transition: 'padding-left 0.5s ease-out'
        }}
      >
        {/* Content Wrapper - Constrained Width */}
        <div style={{
          maxWidth: '720px',
          padding: '0 20px'
        }}>
          {/* Back Navigation */}
          {showBackNav && (
            <BackNavBlock onClick={handleBackClick} />
          )}

          {/* Render Blocks */}
          {blocks.map((block, index) => renderBlock(block, index, navigate))}
        </div>
      </div>
    </Layout>
  );
}

// ============================================================
// Helper: Convert legacy article to blocks
// ============================================================
export function convertLegacyArticleToBlocks(article) {
  // For articles stored as plain markdown content,
  // wrap them in a simple structure
  if (article.content && !article.blocks) {
    return {
      ...article,
      blocks: [
        {
          type: BLOCK_TYPES.HERO,
          seriesLabel: article.category,
          title: article.title,
          subtitle: article.excerpt,
          readingTime: article.readingTime,
          date: article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null,
          author: article.author
        },
        {
          type: BLOCK_TYPES.PARAGRAPH,
          content: article.content
        }
      ]
    };
  }
  return article;
}

export default ArticleRenderer;
