/**
 * Unity Notes Status Bar
 * Compact status indicator - shows auto-save status and node count
 *
 * Mobile UX Principles:
 * - CircleNav is PRIMARY action - never obscure it
 * - Status info is secondary - move to top on mobile
 * - Minimal footprint, maximum clarity
 *
 * v2: Combined with shortcuts hint into single compact element
 */

import { useState, useEffect } from 'react';
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

  // Mobile: Ultra-compact at top-right
  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '70px',
          right: '12px',
          zIndex: 150,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 8px',
          background: 'rgba(20, 20, 20, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          fontFamily: 'monospace',
          fontSize: '9px',
        }}
      >
        <span style={{ fontSize: '10px' }}>
          {isSaving ? '⏳' : '✓'}
        </span>
        <span
          style={{
            color: nodeUsagePercent >= 90
              ? UNITY.progress.high
              : 'rgba(255, 255, 255, 0.6)',
            fontWeight: nodeUsagePercent >= 90 ? '600' : '400',
          }}
        >
          {nodeCount}/{nodeLimit}
        </span>
      </div>
    );
  }

  // Desktop: Compact combined status bar (smaller than v1)
  return (
    <div
      style={{
        position: 'fixed',
        top: '70px',
        right: '20px',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        background: 'rgba(20, 20, 20, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        fontFamily: 'monospace',
        fontSize: '10px',
      }}
    >
      {/* Auto-save indicator - compact */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: isSaving ? COLORS.yellow : 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <span style={{ fontSize: '11px' }}>{isSaving ? '⏳' : '✓'}</span>
        <span>
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
          background: 'rgba(255, 255, 255, 0.1)',
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
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${nodeUsagePercent}%`,
              height: '100%',
              background: getProgressColor(),
              transition: 'width 0.3s, background-color 0.3s',
            }}
          />
        </div>
        <span
          style={{
            color: nodeUsagePercent >= 90
              ? UNITY.progress.high
              : 'rgba(255, 255, 255, 0.5)',
          }}
        >
          {nodeCount}/{nodeLimit}
        </span>
      </div>

      {/* Shortcuts hint - integrated, clickable */}
      {showShortcutsHint && (
        <>
          <div
            style={{
              width: '1px',
              height: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
            }}
          />
          <button
            onClick={onShortcutsClick}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              color: 'rgba(255, 255, 255, 0.35)',
              fontSize: '9px',
              cursor: 'pointer',
              borderRadius: '3px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = 'rgba(255, 255, 255, 0.7)';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'rgba(255, 255, 255, 0.35)';
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
