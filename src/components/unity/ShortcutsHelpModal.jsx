/**
 * Keyboard Shortcuts Help Modal
 * Displays available keyboard shortcuts for Unity Notes
 */

export default function ShortcutsHelpModal({ show, onClose }) {
  if (!show) return null;

  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
  const mod = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { keys: `${mod} + S`, action: 'Save to cloud' },
    { keys: `${mod} + E`, action: 'Export JSON' },
    { keys: `${mod} + N`, action: 'Add new card' },
    { keys: `${mod} + /`, action: 'Toggle shortcuts help' },
    { keys: 'Esc', action: 'Deselect all' },
    { keys: 'Delete', action: 'Delete selected' },
    { keys: '↑ ↓ ← →', action: 'Pan canvas' },
    { keys: 'Shift + Arrows', action: 'Pan faster' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(30, 30, 30, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            color: '#fbbf24',
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: 'monospace',
          }}
        >
          ⌨️ Keyboard Shortcuts
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {shortcuts.map(({ keys, action }) => (
            <div
              key={keys}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: '#e5e5e5',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
              >
                {keys}
              </span>
              <span style={{ color: '#b3b3b3', fontSize: '13px' }}>{action}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '10px',
            background: 'rgba(251, 191, 36, 0.2)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            color: '#fbbf24',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}
        >
          Close (Esc)
        </button>
      </div>
    </div>
  );
}
