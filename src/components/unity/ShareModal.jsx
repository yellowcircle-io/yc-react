/**
 * ShareModal - Unity Collaboration sharing component
 * Enables sharing canvases with collaborators
 * Uses inline styles for reliable rendering
 */

import { useState } from 'react';
import { X, Copy, Check, Link2, Users, Globe, Lock, Mail, Trash2, Star } from 'lucide-react';

const ShareModal = ({
  isOpen,
  onClose,
  capsuleId,
  title,
  isPublic,
  isBookmarked = false,
  collaborators = [],
  onUpdateVisibility,
  onToggleBookmark,
  onAddCollaborator,
  onRemoveCollaborator,
  shareLink
}) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  // Generate share link
  const fullShareLink = shareLink || `${window.location.origin}/capsule/${capsuleId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullShareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsAdding(true);
    setError(null);

    try {
      await onAddCollaborator(email.trim().toLowerCase(), role);
      setEmail('');
      setRole('viewer');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (collaboratorId) => {
    try {
      await onRemoveCollaborator(collaboratorId);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
    },
    modal: {
      position: 'relative',
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '420px',
      margin: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#fff',
      margin: 0,
    },
    closeBtn: {
      padding: '4px',
      background: 'transparent',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      color: 'rgba(255, 255, 255, 0.6)',
    },
    content: {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    section: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '13px',
      color: 'rgba(255, 255, 255, 0.6)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    inputRow: {
      display: 'flex',
      gap: '8px',
    },
    input: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '10px 12px',
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.8)',
      outline: 'none',
    },
    copyBtn: {
      padding: '10px 16px',
      backgroundColor: '#F5A623',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#000',
      fontWeight: '500',
      fontSize: '14px',
    },
    toggleRow: {
      display: 'flex',
      gap: '8px',
    },
    toggleBtn: (active) => ({
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '10px 16px',
      borderRadius: '8px',
      border: active ? '1px solid #F5A623' : '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: active ? 'rgba(245, 166, 35, 0.2)' : 'rgba(0, 0, 0, 0.3)',
      color: active ? '#F5A623' : 'rgba(255, 255, 255, 0.6)',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
    }),
    hint: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.4)',
      margin: 0,
    },
    select: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '10px 12px',
      fontSize: '14px',
      color: '#fff',
      outline: 'none',
      cursor: 'pointer',
    },
    addBtn: {
      padding: '10px 16px',
      backgroundColor: '#F5A623',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      color: '#000',
      fontWeight: '500',
      fontSize: '14px',
    },
    addBtnDisabled: {
      padding: '10px 16px',
      backgroundColor: 'rgba(245, 166, 35, 0.5)',
      border: 'none',
      borderRadius: '8px',
      cursor: 'not-allowed',
      color: '#000',
      fontWeight: '500',
      fontSize: '14px',
    },
    error: {
      fontSize: '12px',
      color: '#f87171',
      margin: 0,
    },
    collabList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxHeight: '160px',
      overflowY: 'auto',
    },
    collabItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '8px',
      padding: '10px 12px',
    },
    collabInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: 'rgba(245, 166, 35, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '500',
      color: '#F5A623',
    },
    collabName: {
      fontSize: '14px',
      color: '#fff',
      margin: 0,
    },
    collabRole: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.4)',
      margin: 0,
      textTransform: 'capitalize',
    },
    removeBtn: {
      padding: '4px',
      background: 'transparent',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      color: 'rgba(255, 255, 255, 0.4)',
    },
    footer: {
      padding: '16px',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    },
    doneBtn: {
      width: '100%',
      padding: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '14px',
    },
  };

  return (
    <div style={styles.overlay}>
      {/* Backdrop */}
      <div style={styles.backdrop} onClick={onClose} />

      {/* Modal */}
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <Users size={20} color="#F5A623" />
            <h2 style={styles.title}>Share "{title}"</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Share Link Section */}
          <div style={styles.section}>
            <label style={styles.label}>
              <Link2 size={16} />
              Share link
            </label>
            <div style={styles.inputRow}>
              <input
                type="text"
                value={fullShareLink}
                readOnly
                style={styles.input}
              />
              <button style={styles.copyBtn} onClick={handleCopy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div style={styles.section}>
            <label style={styles.label}>Visibility</label>
            <div style={styles.toggleRow}>
              <button
                style={styles.toggleBtn(isPublic)}
                onClick={() => onUpdateVisibility(true)}
              >
                <Globe size={16} />
                Public
              </button>
              <button
                style={styles.toggleBtn(!isPublic)}
                onClick={() => onUpdateVisibility(false)}
              >
                <Lock size={16} />
                Private
              </button>
            </div>
            <p style={styles.hint}>
              {isPublic
                ? 'Anyone with the link can view this canvas'
                : 'Only you and collaborators can access'}
            </p>
          </div>

          {/* Bookmark Toggle */}
          {onToggleBookmark && (
            <div style={styles.section}>
              <label style={styles.label}>
                <Star size={16} />
                Quick Access
              </label>
              <button
                style={{
                  ...styles.toggleBtn(isBookmarked),
                  width: '100%',
                  justifyContent: 'center',
                }}
                onClick={onToggleBookmark}
              >
                <Star size={16} fill={isBookmarked ? '#F5A623' : 'none'} />
                {isBookmarked ? 'Bookmarked' : 'Add to Bookmarks'}
              </button>
              <p style={styles.hint}>
                {isBookmarked
                  ? 'This canvas is bookmarked for quick access'
                  : 'Bookmark this canvas for easy access later'}
              </p>
            </div>
          )}

          {/* Add Collaborator */}
          <div style={styles.section}>
            <label style={styles.label}>
              <Mail size={16} />
              Add collaborators
            </label>
            <form onSubmit={handleAddCollaborator} style={styles.inputRow}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                style={styles.input}
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={styles.select}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                type="submit"
                disabled={isAdding || !email.trim()}
                style={isAdding || !email.trim() ? styles.addBtnDisabled : styles.addBtn}
              >
                {isAdding ? '...' : 'Add'}
              </button>
            </form>
            {error && <p style={styles.error}>{error}</p>}
          </div>

          {/* Collaborators List */}
          {collaborators.length > 0 && (
            <div style={styles.section}>
              <label style={styles.label}>
                Collaborators ({collaborators.length})
              </label>
              <div style={styles.collabList}>
                {collaborators.map((collab) => (
                  <div key={collab.id || collab.email} style={styles.collabItem}>
                    <div style={styles.collabInfo}>
                      <div style={styles.avatar}>
                        {(collab.email || collab.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={styles.collabName}>{collab.email || collab.name}</p>
                        <p style={styles.collabRole}>{collab.role}</p>
                      </div>
                    </div>
                    <button
                      style={styles.removeBtn}
                      onClick={() => handleRemove(collab.id || collab.email)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
