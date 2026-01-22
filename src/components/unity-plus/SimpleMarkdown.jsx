/**
 * SimpleMarkdown - Lightweight markdown renderer for Unity Notes
 *
 * Supports:
 * - **bold** and *italic*
 * - # Headers (h1-h3)
 * - [links](url)
 * - `inline code`
 * - - bullet lists
 * - 1. numbered lists
 * - > blockquotes
 *
 * No external dependencies - pure React.
 */

import React from 'react';

// Parse markdown text into rendered elements
const parseMarkdown = (text, isDarkTheme = true) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let listType = null;
  let blockquoteLines = [];

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(
        <ListTag key={`list-${elements.length}`} style={{
          margin: '8px 0',
          paddingLeft: '20px',
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
        }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ marginBottom: '4px', fontSize: '13px', lineHeight: '1.5' }}>
              {parseInline(item, isDarkTheme)}
            </li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <blockquote key={`bq-${elements.length}`} style={{
          margin: '8px 0',
          paddingLeft: '12px',
          borderLeft: `3px solid ${isDarkTheme ? 'rgba(251, 191, 36, 0.5)' : 'rgba(251, 191, 36, 0.7)'}`,
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
          fontStyle: 'italic',
          fontSize: '12px',
          lineHeight: '1.5',
        }}>
          {blockquoteLines.map((line, i) => (
            <span key={i}>{parseInline(line, isDarkTheme)}{i < blockquoteLines.length - 1 && <br />}</span>
          ))}
        </blockquote>
      );
      blockquoteLines = [];
    }
  };

  lines.forEach((line, index) => {
    // Headers
    if (line.startsWith('### ')) {
      flushList();
      flushBlockquote();
      elements.push(
        <h4 key={index} style={{
          fontSize: '13px',
          fontWeight: '600',
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)',
          margin: '12px 0 6px',
        }}>
          {parseInline(line.slice(4), isDarkTheme)}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      flushBlockquote();
      elements.push(
        <h3 key={index} style={{
          fontSize: '14px',
          fontWeight: '600',
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)',
          margin: '12px 0 6px',
        }}>
          {parseInline(line.slice(3), isDarkTheme)}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      flushList();
      flushBlockquote();
      elements.push(
        <h2 key={index} style={{
          fontSize: '15px',
          fontWeight: '700',
          color: isDarkTheme ? 'rgb(251, 191, 36)' : '#b45309',
          margin: '12px 0 8px',
        }}>
          {parseInline(line.slice(2), isDarkTheme)}
        </h2>
      );
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      flushList();
      blockquoteLines.push(line.slice(2));
    }
    // Bullet list
    else if (line.match(/^[-*] /)) {
      flushBlockquote();
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(line.slice(2));
    }
    // Numbered list
    else if (line.match(/^\d+\. /)) {
      flushBlockquote();
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(line.replace(/^\d+\. /, ''));
    }
    // Empty line
    else if (line.trim() === '') {
      flushList();
      flushBlockquote();
      // Add spacing
      if (elements.length > 0) {
        elements.push(<div key={`space-${index}`} style={{ height: '8px' }} />);
      }
    }
    // Regular paragraph
    else {
      flushList();
      flushBlockquote();
      elements.push(
        <p key={index} style={{
          margin: '4px 0',
          fontSize: '13px',
          lineHeight: '1.5',
          color: isDarkTheme ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.75)',
        }}>
          {parseInline(line, isDarkTheme)}
        </p>
      );
    }
  });

  // Flush remaining lists/blockquotes
  flushList();
  flushBlockquote();

  return elements;
};

// Parse inline markdown (bold, italic, code, links)
const parseInline = (text, isDarkTheme = true) => {
  if (!text) return text;

  const parts = [];
  let remaining = text;
  let key = 0;

  // Regex patterns for inline elements
  const patterns = [
    // Code (must be first to avoid conflicts)
    { regex: /`([^`]+)`/, render: (match) => (
      <code key={key++} style={{
        backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
        padding: '1px 4px',
        borderRadius: '3px',
        fontSize: '11px',
        fontFamily: 'SF Mono, Monaco, monospace',
        color: isDarkTheme ? '#fbbf24' : '#b45309',
      }}>
        {match[1]}
      </code>
    )},
    // Bold
    { regex: /\*\*([^*]+)\*\*/, render: (match) => (
      <strong key={key++} style={{ fontWeight: '600', color: isDarkTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)' }}>
        {match[1]}
      </strong>
    )},
    // Italic
    { regex: /\*([^*]+)\*/, render: (match) => (
      <em key={key++} style={{ fontStyle: 'italic' }}>{match[1]}</em>
    )},
    // Link
    { regex: /\[([^\]]+)\]\(([^)]+)\)/, render: (match) => (
      <a
        key={key++}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          color: '#3b82f6',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
        }}
      >
        {match[1]}
      </a>
    )},
  ];

  while (remaining.length > 0) {
    let earliestMatch = null;
    let earliestIndex = remaining.length;
    let matchedPattern = null;

    // Find the earliest match
    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match && match.index < earliestIndex) {
        earliestMatch = match;
        earliestIndex = match.index;
        matchedPattern = pattern;
      }
    }

    if (earliestMatch && matchedPattern) {
      // Add text before match
      if (earliestIndex > 0) {
        parts.push(remaining.slice(0, earliestIndex));
      }
      // Add matched element
      parts.push(matchedPattern.render(earliestMatch));
      // Continue with remaining text
      remaining = remaining.slice(earliestIndex + earliestMatch[0].length);
    } else {
      // No more matches, add remaining text
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
};

// Main component
export default function SimpleMarkdown({ content, isDarkTheme = true, className = '' }) {
  if (!content) return null;

  return (
    <div className={`simple-markdown ${className}`} style={{ wordBreak: 'break-word' }}>
      {parseMarkdown(content, isDarkTheme)}
    </div>
  );
}

// Also export a hook for checking if content has markdown
export function hasMarkdown(text) {
  if (!text) return false;
  return /[#*`>\-[\]]/.test(text);
}
