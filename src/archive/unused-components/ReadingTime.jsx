import React, { useEffect, useState } from 'react';
import { COLORS } from '../styles/constants';

/**
 * Reading Time Indicator
 * Calculates reading time based on word count
 * Displays estimated reading time in minutes
 *
 * Features:
 * - Automatic word count calculation
 * - 200 words per minute average
 * - Dynamic updates if content changes
 * - Responsive styling
 * - Optional custom selector for content
 *
 * Usage:
 * <ReadingTime selector="[data-article-content]" />
 */

function ReadingTime({ selector = '[data-article-content]', style }) {
  const [readingTime, setReadingTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    // Safety check for SSR
    if (typeof document === 'undefined') {
      return;
    }

    const calculateReadingTime = () => {
      try {
        const contentElement = document.querySelector(selector);

        if (!contentElement) {
          return;
        }

        // Get text content and count words
        const text = contentElement.textContent || '';
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const count = words.length;

        // Calculate reading time (200 words per minute average)
        const wordsPerMinute = 200;
        const minutes = Math.ceil(count / wordsPerMinute);

        setWordCount(count);
        setReadingTime(minutes);
      } catch (error) {
        console.error('ReadingTime calculation error:', error);
      }
    };

    // Delay initial calculation to ensure DOM is ready
    const timer = setTimeout(calculateReadingTime, 100);

    // Recalculate if content changes (using MutationObserver)
    const contentElement = document.querySelector(selector);
    if (contentElement && typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(calculateReadingTime);
      observer.observe(contentElement, {
        childList: true,
        subtree: true,
        characterData: true
      });

      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }

    return () => clearTimeout(timer);
  }, [selector]);

  // Don't render until we have a reading time
  if (readingTime === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        border: `1px solid ${COLORS.yellow}`,
        borderRadius: '20px',
        fontSize: '0.9rem',
        fontWeight: '600',
        color: COLORS.yellow,
        ...style
      }}
      aria-label={`Estimated reading time: ${readingTime} minutes`}
    >
      <span style={{ fontSize: '1rem' }}>📖</span>
      <span>~{readingTime} min read</span>
      <span
        style={{
          fontSize: '0.75rem',
          color: COLORS.lightGrey,
          marginLeft: '4px'
        }}
      >
        ({wordCount.toLocaleString()} words)
      </span>
    </div>
  );
}

export default ReadingTime;
