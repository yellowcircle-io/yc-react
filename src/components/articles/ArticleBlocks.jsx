/**
 * Article Block Components
 *
 * Reusable blocks for the yellowCircle blog CMS.
 * Extracted from OwnYourStoryArticle1Page.jsx to enable
 * consistent rendering across admin-created and MDX articles.
 *
 * Block Types:
 * - hero: Series label, title, subtitle, meta info
 * - lead-paragraph: Bold intro text
 * - paragraph: Regular text
 * - section-header: Numbered section heading
 * - stat-grid: Array of stat cards
 * - bullet-list: List with arrow bullets
 * - quote: Blockquote with author
 * - persona-card: Name, role, description, cost
 * - numbered-list: Numbered items with title/description
 * - action-grid: Icon + title + description cards
 * - callout-box: Highlighted box with title and content
 * - cta-section: Centered buttons
 * - sources: Citation list
 */

import React from 'react';
import { COLORS } from '../../styles/constants';

// ============================================================
// Hero Block
// ============================================================
export function HeroBlock({
  seriesLabel,
  title,
  subtitle,
  readingTime,
  date,
  author = 'yellowCircle'
}) {
  return (
    <header style={{ marginBottom: '48px' }}>
      {seriesLabel && (
        <div style={{
          fontSize: '0.85rem',
          color: COLORS.yellow,
          fontWeight: '600',
          letterSpacing: '0.1em',
          marginBottom: '16px',
          textTransform: 'uppercase'
        }}>
          {seriesLabel}
        </div>
      )}

      <h1 style={{
        fontSize: 'clamp(2rem, 6vw, 3.5rem)',
        fontWeight: '800',
        color: COLORS.white,
        lineHeight: 1.1,
        marginBottom: '16px'
      }}>
        {title}
      </h1>

      {subtitle && (
        <p style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
          color: COLORS.lightGrey,
          marginBottom: '24px',
          lineHeight: 1.4
        }}>
          {subtitle}
        </p>
      )}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        fontSize: '0.9rem',
        color: COLORS.lightGrey
      }}>
        {readingTime && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            border: `1px solid ${COLORS.yellow}`,
            borderRadius: '20px',
            color: COLORS.yellow,
            fontWeight: '600'
          }}>
            📖 ~{readingTime} min read
          </span>
        )}
        {date && <span>{date}</span>}
        {date && author && <span>•</span>}
        {author && <span>{author}</span>}
      </div>
    </header>
  );
}

// ============================================================
// Lead Paragraph Block
// ============================================================
export function LeadParagraphBlock({ children, highlight }) {
  return (
    <p style={{
      fontSize: '1.15rem',
      lineHeight: 1.8,
      color: COLORS.white,
      marginBottom: '32px'
    }}>
      {highlight && (
        <strong style={{ color: COLORS.yellow }}>{highlight}</strong>
      )}{' '}
      {children}
    </p>
  );
}

// ============================================================
// Paragraph Block
// ============================================================
export function ParagraphBlock({ children, muted = false }) {
  return (
    <p style={{
      fontSize: '1.05rem',
      lineHeight: 1.8,
      color: muted ? COLORS.lightGrey : COLORS.white,
      marginBottom: '24px'
    }}>
      {children}
    </p>
  );
}

// ============================================================
// Section Header Block
// ============================================================
export function SectionHeaderBlock({ children, number }) {
  return (
    <h2 style={{
      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
      fontWeight: '700',
      color: COLORS.yellow,
      marginTop: '60px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      {number && (
        <span style={{
          fontSize: '0.9rem',
          color: COLORS.lightGrey,
          fontWeight: '400'
        }}>{number}</span>
      )}
      {children}
    </h2>
  );
}

// ============================================================
// Stat Card Component (internal)
// ============================================================
function StatCard({ value, label, source }) {
  return (
    <div style={{
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      border: `1px solid ${COLORS.yellow}`,
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center',
      flex: '1 1 200px',
      minWidth: '200px'
    }}>
      <div style={{
        fontSize: 'clamp(2rem, 5vw, 3rem)',
        fontWeight: '800',
        color: COLORS.yellow,
        lineHeight: 1
      }}>{value}</div>
      <div style={{
        fontSize: '0.95rem',
        color: COLORS.white,
        marginTop: '8px',
        fontWeight: '600'
      }}>{label}</div>
      {source && (
        <div style={{
          fontSize: '0.75rem',
          color: COLORS.lightGrey,
          marginTop: '8px',
          fontStyle: 'italic'
        }}>{source}</div>
      )}
    </div>
  );
}

// ============================================================
// Stat Grid Block
// ============================================================
export function StatGridBlock({ stats }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '40px'
    }}>
      {stats.map((stat, i) => (
        <StatCard
          key={i}
          value={stat.value}
          label={stat.label}
          source={stat.source}
        />
      ))}
    </div>
  );
}

// ============================================================
// Bullet List Block
// ============================================================
export function BulletListBlock({ items }) {
  return (
    <ul style={{
      listStyle: 'none',
      padding: 0,
      marginBottom: '32px'
    }}>
      {items.map((item, i) => (
        <li key={i} style={{
          fontSize: '1rem',
          lineHeight: 1.8,
          color: COLORS.white,
          marginBottom: '12px',
          paddingLeft: '24px',
          position: 'relative'
        }}>
          <span style={{
            position: 'absolute',
            left: 0,
            color: COLORS.yellow
          }}>→</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

// ============================================================
// Quote Block
// ============================================================
export function QuoteBlock({ children, author }) {
  return (
    <blockquote style={{
      borderLeft: `4px solid ${COLORS.yellow}`,
      paddingLeft: '24px',
      margin: '32px 0',
      fontStyle: 'italic',
      fontSize: '1.1rem',
      color: COLORS.lightGrey
    }}>
      "{children}"
      {author && (
        <footer style={{
          marginTop: '12px',
          fontSize: '0.9rem',
          color: COLORS.yellow,
          fontStyle: 'normal'
        }}>— {author}</footer>
      )}
    </blockquote>
  );
}

// ============================================================
// Persona Card Block
// ============================================================
export function PersonaCardBlock({ name, role, description, cost }) {
  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <h3 style={{
        color: COLORS.yellow,
        fontSize: '1.1rem',
        fontWeight: '700',
        marginBottom: '12px'
      }}>{name} — {role}</h3>
      <p style={{
        color: COLORS.lightGrey,
        fontSize: '0.95rem',
        lineHeight: 1.7,
        marginBottom: '12px'
      }}>
        {description}
      </p>
      {cost && (
        <p style={{
          color: COLORS.yellow,
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          Cost: {cost}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Numbered List Block
// ============================================================
export function NumberedListBlock({ items, highlighted = false }) {
  const containerStyle = highlighted ? {
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    border: `1px solid ${COLORS.yellow}`,
    borderRadius: '12px',
    padding: '28px',
    marginBottom: '32px'
  } : {
    marginBottom: '32px'
  };

  return (
    <div style={containerStyle}>
      <ol style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        counterReset: 'item'
      }}>
        {items.map((item, i) => (
          <li key={i} style={{
            marginBottom: '20px',
            paddingLeft: '40px',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '28px',
              height: '28px',
              backgroundColor: COLORS.yellow,
              color: COLORS.black,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: '700'
            }}>{i + 1}</span>
            <strong style={{ color: COLORS.white, display: 'block', marginBottom: '4px' }}>
              {item.title}
            </strong>
            <span style={{ color: COLORS.lightGrey, fontSize: '0.95rem' }}>
              {item.description}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ============================================================
// Action Grid Block
// ============================================================
export function ActionGridBlock({ items }) {
  return (
    <div style={{
      display: 'grid',
      gap: '16px',
      marginBottom: '32px'
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          gap: '16px'
        }}>
          <div style={{
            fontSize: '1.5rem',
            flexShrink: 0
          }}>{item.icon}</div>
          <div>
            <strong style={{ color: COLORS.yellow, display: 'block', marginBottom: '4px' }}>
              {item.title}
            </strong>
            <span style={{ color: COLORS.lightGrey, fontSize: '0.95rem', lineHeight: 1.6 }}>
              {item.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Callout Box Block
// ============================================================
export function CalloutBoxBlock({ title, children, highlight }) {
  return (
    <div style={{
      backgroundColor: 'rgba(251, 191, 36, 0.08)',
      borderLeft: `4px solid ${COLORS.yellow}`,
      padding: '32px',
      marginTop: '48px',
      marginBottom: '48px'
    }}>
      {title && (
        <h3 style={{
          color: COLORS.yellow,
          fontSize: '1.2rem',
          fontWeight: '700',
          marginBottom: '16px'
        }}>{title}</h3>
      )}
      <div style={{
        color: COLORS.white,
        fontSize: '1.1rem',
        lineHeight: 1.7
      }}>
        {children}
      </div>
      {highlight && (
        <p style={{
          color: COLORS.yellow,
          fontSize: '1.2rem',
          fontWeight: '700',
          marginTop: '20px'
        }}>
          {highlight}
        </p>
      )}
    </div>
  );
}

// ============================================================
// CTA Section Block
// ============================================================
export function CTASectionBlock({ prompt, buttons }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 0',
      borderTop: `1px solid rgba(255, 255, 255, 0.1)`
    }}>
      {prompt && (
        <p style={{
          color: COLORS.lightGrey,
          fontSize: '1rem',
          marginBottom: '24px'
        }}>
          {prompt}
        </p>
      )}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'center'
      }}>
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            style={{
              padding: '14px 28px',
              backgroundColor: btn.primary ? COLORS.yellow : 'transparent',
              color: btn.primary ? COLORS.black : COLORS.yellow,
              border: btn.primary ? 'none' : `2px solid ${COLORS.yellow}`,
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Sources Block
// ============================================================
export function SourcesBlock({ sources }) {
  return (
    <div style={{
      marginTop: '48px',
      paddingTop: '24px',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h4 style={{
        color: COLORS.lightGrey,
        fontSize: '0.85rem',
        fontWeight: '600',
        letterSpacing: '0.1em',
        marginBottom: '16px'
      }}>SOURCES</h4>
      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        fontSize: '0.85rem',
        color: COLORS.lightGrey
      }}>
        {sources.map((source, i) => (
          <li key={i} style={{ marginBottom: '8px' }}>• {source}</li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// Back Navigation Block
// ============================================================
export function BackNavBlock({ onClick, label = '← Back to Thoughts' }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: COLORS.yellow,
        fontSize: '0.9rem',
        cursor: 'pointer',
        marginBottom: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: 0
      }}
    >
      {label}
    </button>
  );
}

// ============================================================
// Export all blocks
// ============================================================
export default {
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
};
