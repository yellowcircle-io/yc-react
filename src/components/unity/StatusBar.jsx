/**
 * Unity Notes Status Bar
 * Shows auto-save status, node count, and export/import buttons
 */

import { UNITY, COLORS } from '../../styles/constants';

export default function StatusBar({
  isSaving,
  lastSavedAt,
  nodeCount,
  nodeLimit,
  onExport,
  onImport,
  showShortcutsHint = true,
}) {
  const nodeUsagePercent = Math.min((nodeCount / nodeLimit) * 100, 100);

  // Progress bar color based on usage
  const getProgressColor = () => {
    if (nodeUsagePercent >= 90) return UNITY.progress.high;
    if (nodeUsagePercent >= 50) return UNITY.progress.medium;
    return UNITY.progress.low;
  };

  return (
    <div
      style={{
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
      }}
    >
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
            minWidth: '80px',
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

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />

        {/* Export/Import buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onExport}
            style={{
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: COLORS.textSecondaryOnDark,
              cursor: 'pointer',
              fontSize: '10px',
              fontFamily: 'monospace',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(251, 191, 36, 0.2)';
              e.target.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              e.target.style.color = COLORS.yellow;
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = COLORS.textSecondaryOnDark;
            }}
            title="Export canvas as JSON (Cmd+E)"
          >
            ⬇ EXPORT
          </button>
          <button
            onClick={onImport}
            style={{
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: COLORS.textSecondaryOnDark,
              cursor: 'pointer',
              fontSize: '10px',
              fontFamily: 'monospace',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(251, 191, 36, 0.2)';
              e.target.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              e.target.style.color = COLORS.yellow;
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = COLORS.textSecondaryOnDark;
            }}
            title="Import canvas from JSON (Cmd+N for new card)"
          >
            ⬆ IMPORT
          </button>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
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
