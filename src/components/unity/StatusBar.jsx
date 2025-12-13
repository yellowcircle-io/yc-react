/**
 * Unity Notes Status Bar
 * Compact status indicator - shows auto-save status and node count
 *
 * v3: Centered under CircleNav with white background (matching pill UI)
 * - Positioned at bottom center, below CircleNav
 * - Mobile responsive
 */

import { useState, useEffect } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { UNITY, COLORS } from '../../styles/constants';

// Mobile breakpoint
const MOBILE_BREAKPOINT = 768;

export default function StatusBar({
  isSaving,
  lastSavedAt,
  nodeCount,
  nodeLimit,
  showShortcutsHint = true,
  onShortcutsClick,
}) {
  const { footerOpen } = useLayout();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nodeUsagePercent = Math.min((nodeCount / nodeLimit) * 100, 100);

  // Progress bar color based on usage
  const getProgressColor = () => {
    if (nodeUsagePercent >= 90) return UNITY.progress.high;
    if (nodeUsagePercent >= 50) return UNITY.progress.medium;
    return UNITY.progress.low;
  };

  // Common centered position under CircleNav
  const containerStyle = {
    position: 'fixed',
    bottom: footerOpen ? '315px' : '12px', // Below CircleNav (40px + pill height ~76px + gap)
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 340, // Below CircleNav (350)
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? '6px' : '8px',
    padding: isMobile ? '5px 10px' : '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    fontFamily: 'monospace',
    fontSize: isMobile ? '9px' : '10px',
    transition: 'bottom 0.5s ease-out',
  };

  return (
    <div style={containerStyle}>
      {/* Auto-save indicator - compact */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: isSaving ? '#b45309' : 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <span style={{ fontSize: isMobile ? '10px' : '11px' }}>{isSaving ? '⏳' : '✓'}</span>
        <span style={{ textAlign: 'center' }}>
          {isSaving
            ? 'Saving'
            : lastSavedAt
              ? lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Local'}
        </span>
      </div>

      {/* Thin divider */}
      <div
        style={{
          width: '1px',
          height: '14px',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }}
      />

      {/* Node count with mini progress */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '3px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${nodeUsagePercent}%`,
              height: '100%',
              backgroundColor: getProgressColor(),
              transition: 'width 0.3s, background-color 0.3s',
            }}
          />
        </div>
        <span
          style={{
            color: nodeUsagePercent >= 90
              ? UNITY.progress.high
              : 'rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
          }}
        >
          {nodeCount}/{nodeLimit}
        </span>
      </div>

      {/* Shortcuts hint - integrated, clickable */}
      {showShortcutsHint && !isMobile && (
        <>
          <div
            style={{
              width: '1px',
              height: '14px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            }}
          />
          <button
            onClick={onShortcutsClick}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              color: 'rgba(0, 0, 0, 0.35)',
              fontSize: '9px',
              cursor: 'pointer',
              borderRadius: '3px',
              transition: 'all 0.2s',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'rgba(0, 0, 0, 0.7)';
              e.target.style.background = 'rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'rgba(0, 0, 0, 0.35)';
              e.target.style.background = 'none';
            }}
            title="View keyboard shortcuts"
          >
            ⌘/
          </button>
        </>
      )}
    </div>
  );
}
