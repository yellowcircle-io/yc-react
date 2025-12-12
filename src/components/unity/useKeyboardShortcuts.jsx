/**
 * Keyboard Shortcuts Hook for Unity Notes
 *
 * Shortcuts:
 * - Cmd/Ctrl + S: Save to cloud (if Pro)
 * - Cmd/Ctrl + E: Export JSON
 * - Cmd/Ctrl + N: Add new card
 * - Cmd/Ctrl + /: Show shortcuts help
 * - Escape: Deselect all nodes
 * - Delete/Backspace: Delete selected node(s)
 * - Arrow keys: Pan canvas (when no text input focused)
 */

import { useEffect, useCallback, useState } from 'react';

export function useKeyboardShortcuts({
  onSave,
  onExport,
  onAddCard,
  onDelete,
  onDeselect,
  onPan,
  enabled = true,
}) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const tagName = e.target.tagName.toLowerCase();
    const isEditable = e.target.isContentEditable;
    const isInput = tagName === 'input' || tagName === 'textarea' || isEditable;

    const isMod = e.metaKey || e.ctrlKey;

    // Cmd/Ctrl + S: Save
    if (isMod && e.key === 's') {
      e.preventDefault();
      onSave?.();
      return;
    }

    // Cmd/Ctrl + E: Export
    if (isMod && e.key === 'e') {
      e.preventDefault();
      onExport?.();
      return;
    }

    // Cmd/Ctrl + N: New card
    if (isMod && e.key === 'n') {
      e.preventDefault();
      onAddCard?.();
      return;
    }

    // Cmd/Ctrl + /: Show help
    if (isMod && e.key === '/') {
      e.preventDefault();
      setShowHelp((prev) => !prev);
      return;
    }

    // Only handle these when not in an input
    if (isInput) return;

    // Escape: Deselect
    if (e.key === 'Escape') {
      e.preventDefault();
      onDeselect?.();
      setShowHelp(false);
      return;
    }

    // Delete/Backspace: Delete selected
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete?.();
      return;
    }

    // Arrow keys: Pan canvas
    const panAmount = e.shiftKey ? 100 : 50;
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onPan?.({ x: 0, y: panAmount });
        break;
      case 'ArrowDown':
        e.preventDefault();
        onPan?.({ x: 0, y: -panAmount });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onPan?.({ x: panAmount, y: 0 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        onPan?.({ x: -panAmount, y: 0 });
        break;
    }
  }, [enabled, onSave, onExport, onAddCard, onDelete, onDeselect, onPan]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  return { showHelp, setShowHelp };
}

export default useKeyboardShortcuts;
