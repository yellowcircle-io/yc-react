/**
 * Unity Notes Status Bar
 * Shows auto-save status and node count
 *
 * Mobile UX Principles:
 * - CircleNav is PRIMARY action - never obscure it
 * - Status info is secondary - move to top on mobile
 * - Keyboard shortcuts hint hidden on mobile (no keyboard!)
 * - Minimal footprint, maximum clarity
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

  // Mobile: Compact bar at top-right, never obscure CircleNav
  // Desktop: Full bar at bottom-right
  const containerStyle = isMobile
    ? {
        position: 'fixed',
        top: '70px', // Below header
        right: '12px',
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        alignItems: 'flex-end',
        fontFamily: 'monospace',
        fontSize: '10px',
      }
    : {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
        fontFamily: 'monospace',
        fontSize: '11px',
      };

  // Mobile: Ultra-compact single line
  if (isMobile) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            background: 'rgba(20, 20, 20, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {/* Save indicator - minimal */}
          <span style={{ fontSize: '12px' }}>
            {isSaving ? '⏳' : '✓'}
          </span>

          {/* Node count - compact */}
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
      </div>
    );
  }

  // Desktop: Full status bar
  return (
    <div style={containerStyle}>
      {/* Main status container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          background: UNITY.statusBar.bg,
          border: `1px solid ${UNITY.statusBar.border}`,
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* Auto-save indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: isSaving ? COLORS.yellow : COLORS.textSecondaryOnDark,
          }}
        >
          <span style={{ fontSize: '14px' }}>{isSaving ? '⏳' : '✓'}</span>
          <span>
            {isSaving
              ? 'Saving...'
              : lastSavedAt
                ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Local'}
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />

        {/* Node count with progress bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '70px',
          }}
        >
          <div
            style={{
              flex: 1,
              height: '4px',
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
              color:
                nodeUsagePercent >= 90
                  ? UNITY.progress.high
                  : COLORS.textSecondaryOnDark,
            }}
          >
            {nodeCount}/{nodeLimit}
          </span>
        </div>
      </div>

      {/* Keyboard shortcut hint - DESKTOP ONLY */}
      {showShortcutsHint && (
        <div
          style={{
            padding: '4px 8px',
            background: 'rgba(20, 20, 20, 0.7)',
            borderRadius: '4px',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '10px',
          }}
        >
          Press ⌘/ for shortcuts
        </div>
      )}
    </div>
  );
}
