import React, { useState, useEffect } from 'react';
import { COLORS } from '../../styles/constants';

/**
 * ReadingProgressBar - Shows reading progress for long-form content
 *
 * Usage:
 * 1. Add ref to your content container: ref={contentRef}
 * 2. Render this component: <ReadingProgressBar contentRef={contentRef} />
 *
 * Or use the hook:
 * const { progress, contentRef } = useReadingProgress();
 * <ReadingProgressBar progress={progress} />
 */

// Progress bar component - can receive progress directly or contentRef
function ReadingProgressBar({ progress: externalProgress, contentRef }) {
  const [internalProgress, setInternalProgress] = useState(0);

  // Calculate progress from contentRef if provided
  useEffect(() => {
    if (!contentRef?.current) return;

    const handleScroll = () => {
      const element = contentRef.current;
      if (!element) return;

      const scrollTop = window.scrollY;
      const docHeight = element.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      setInternalProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, [contentRef]);

  const progress = externalProgress !== undefined ? externalProgress : internalProgress;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      backgroundColor: 'rgba(251, 191, 36, 0.2)',
      zIndex: 1000
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        backgroundColor: COLORS.yellow,
        transition: 'width 0.1s ease-out',
        boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
      }} />
    </div>
  );
}

// Custom hook for managing reading progress
export function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  const contentRef = React.useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const element = contentRef.current;
      const scrollTop = window.scrollY;
      const docHeight = element.scrollHeight - window.innerHeight;
      const calculatedProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      setProgress(Math.min(100, Math.max(0, calculatedProgress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { progress, contentRef };
}

export default ReadingProgressBar;
