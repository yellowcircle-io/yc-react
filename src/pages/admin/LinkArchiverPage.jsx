/**
 * Link Saver Page (Pocket Alternative)
 *
 * Admin interface to view and manage saved links with tagging,
 * folders, reading progress, and AI summarization.
 *
 * Part of yellowCircle Unity ecosystem.
 *
 * @created 2026-01-17
 * @author Sleepless Agent
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Reorder } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import Layout from '../../components/global/Layout';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { navigationItems } from '../../config/navigationItems';
import {
  getLinks,
  getFolders,
  createFolder,
  updateFolder,
  updateLink,
  deleteLink,
  toggleStar,
  archiveLink,
  getUserTags,
  getTagCounts,
  getFolderCounts,
  getReadingStats,
  importFromPocket,
  moveTaggedLinksToFolder,
  shareLink,
  unshareLink,
  shareLinkToCanvas,
  unshareLinkFromCanvas,
  getLinkSharingInfo,
  fixMissingUserIds,
  ensureDefaultFolders,
  cleanupDuplicateSystemFolders,
  backfillSharedWithEmails,
  backfillCanvasShareNames,
  reorderFolders as _reorderFolders, // Sprint 2: drag-drop folder reordering
  moveFolder as _moveFolder, // Sprint 2: nested folder nesting
  getAllSharedWithMeLinks,
  getCanvasSharedLinks,
  deleteFolder,
  // Folder Sharing (Sprint 3)
  shareFolder,
  unshareFolder,
  getAllSharedFolders,
  getFolderSharingInfo
} from '../../utils/firestoreLinks';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useShortlinks } from '../../hooks/useShortlinks';
import {
  Link2,
  Folder,
  FolderPlus,
  Star,
  StarOff,
  Archive,
  ArchiveRestore,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  ExternalLink,
  Home,
  Tag,
  Clock,
  BookOpen,
  Upload,
  Download,
  MoreVertical,
  RefreshCw,
  Eye,
  Brain,
  Bookmark,
  FileText,
  Globe,
  Calendar,
  CheckCircle,
  AlertCircle,
  Share2,
  Users,
  Mail,
  Layout as LayoutIcon,
  Info,
  Inbox,
  FolderTree,
  Code,
  Heart,
  Briefcase,
  Pencil,
  GripVertical,
  MessageCircle,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { CommentList } from '../../components/comments';

// ============================================================
// Brand Colors (yellowCircle)
// ============================================================
const COLORS = {
  primary: '#fbbf24',
  primaryDark: '#d4a000',
  text: '#171717',
  textMuted: '#737373',
  textLight: '#a3a3a3',
  border: 'rgba(0, 0, 0, 0.1)',
  white: '#ffffff',
  cardBg: '#fafafa',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6'
};

// ============================================================
// Styles
// ============================================================
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: COLORS.white,
    padding: 'clamp(80px, 10vw, 100px) clamp(16px, 4vw, 40px) 40px clamp(16px, 10vw, 120px)'
  },
  innerContainer: {
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: COLORS.text,
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  statsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px'
  },
  statCard: {
    backgroundColor: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    padding: '10px 14px',
    textAlign: 'center',
    flex: '1 1 auto',
    minWidth: '80px'
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 1.2
  },
  statLabel: {
    fontSize: '10px',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: 'minmax(200px, 240px) 1fr',
    gap: '24px'
  },
  sidebar: {
    backgroundColor: COLORS.white,
    border: `2px solid ${COLORS.border}`,
    borderRadius: '16px',
    padding: '16px',
    height: 'fit-content'
  },
  sidebarSection: {
    marginBottom: '24px'
  },
  sidebarTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px'
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: '14px',
    color: COLORS.text
  },
  sidebarItemActive: {
    backgroundColor: COLORS.primary,
    color: COLORS.text,
    fontWeight: '600'
  },
  linksList: {
    backgroundColor: COLORS.white,
    border: `2px solid ${COLORS.border}`,
    borderRadius: '16px',
    overflow: 'hidden'
  },
  linksHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${COLORS.border}`,
    gap: '16px',
    flexWrap: 'wrap'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: COLORS.cardBg,
    borderRadius: '8px',
    padding: '8px 12px',
    flex: '1',
    maxWidth: '400px'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    flex: '1',
    fontSize: '14px',
    outline: 'none',
    color: COLORS.text
  },
  linkCard: {
    display: 'flex',
    flexDirection: 'row',
    gap: '12px',
    padding: '12px',
    borderBottom: `1px solid ${COLORS.border}`,
    transition: 'background-color 0.15s ease',
    cursor: 'pointer'
  },
  linkThumbnail: {
    width: '72px',
    height: '54px',
    borderRadius: '6px',
    objectFit: 'cover',
    backgroundColor: COLORS.cardBg,
    flexShrink: 0
  },
  linkCardRight: {
    flex: '1',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  linkContent: {
    flex: '1',
    minWidth: 0
  },
  linkTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: 1.3
  },
  linkDomain: {
    fontSize: '11px',
    color: COLORS.textMuted,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '3px'
  },
  linkExcerpt: {
    fontSize: '12px',
    color: COLORS.textLight,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    lineHeight: 1.4
  },
  linkMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '3px',
    flexWrap: 'wrap'
  },
  linkTag: {
    fontSize: '10px',
    padding: '1px 6px',
    borderRadius: '3px',
    backgroundColor: COLORS.cardBg,
    color: COLORS.textMuted
  },
  linkActions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '2px',
    marginTop: '4px'
  },
  actionButton: {
    padding: '4px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: COLORS.textMuted,
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressBar: {
    width: '60px',
    height: '4px',
    backgroundColor: COLORS.cardBg,
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    transition: 'width 0.3s ease'
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    color: COLORS.textMuted
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    color: COLORS.text
  },
  secondaryButton: {
    backgroundColor: COLORS.cardBg,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    paddingLeft: '100px', // Account for sidebar
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '420px',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    boxSizing: 'border-box'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: COLORS.text // Ensure title is dark text, not white
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.border}`,
    fontSize: '14px',
    marginBottom: '12px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.border}`,
    fontSize: '14px',
    marginBottom: '12px',
    outline: 'none',
    resize: 'vertical',
    minHeight: '100px',
    boxSizing: 'border-box'
  }
};

// ============================================================
// Stat Card Component
// ============================================================
const StatCard = ({ icon: Icon, value, label, color }) => {
  const IconComp = Icon;
  return (
    <div style={styles.statCard}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
        <IconComp size={24} color={color || COLORS.primary} />
      </div>
    <div style={styles.statValue}>{value}</div>
    <div style={styles.statLabel}>{label}</div>
  </div>
  );
};

// ============================================================
// Quick Save Tray Component - Slideout for quick link saving
// ============================================================
const AddLinkTray = ({ isOpen, onClose, onSave }) => {
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const inputRef = React.useRef(null);

  // Focus input when tray opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Reset state when tray closes
  React.useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setTags('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      new URL(finalUrl);
    } catch {
      setError('Invalid URL format');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const tagArray = tags.trim()
        ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

      await onSave(finalUrl, tagArray);
      setSuccess('Link saved!');
      setUrl('');
      setTags('');

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save link');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 999,
          }}
        />
      )}

      {/* Tray Panel - Slides from top-right */}
      <div
        style={{
          position: 'fixed',
          right: 'clamp(16px, 5vw, 60px)',
          top: isOpen ? 170 : -350,
          width: 260,
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: '#ffffff',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          borderRadius: '0 0 12px 12px',
          transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            backgroundColor: COLORS.primary,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={16} color={COLORS.text} />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: COLORS.text }}>
              Add Link
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'rgba(0, 0, 0, 0.6)',
              fontSize: '18px',
              fontWeight: '400',
              transition: 'color 0.2s ease'
            }}
            title="Close"
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(0, 0, 0, 0.9)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(0, 0, 0, 0.6)'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '12px' }}>
          {/* URL Input */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '500',
              color: COLORS.textMuted,
              marginBottom: '4px',
              textTransform: 'uppercase'
            }}>
              URL
            </label>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com/article"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '13px',
                border: `1px solid ${error ? COLORS.danger : COLORS.border}`,
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              disabled={saving}
            />
          </div>

          {/* Tags Input */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '500',
              color: COLORS.textMuted,
              marginBottom: '4px',
              textTransform: 'uppercase'
            }}>
              Tags (optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="tech, reading"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '13px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              disabled={saving}
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div style={{
              padding: '8px 10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: COLORS.danger,
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={12} />
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '8px 10px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: COLORS.success,
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle size={12} />
              {success}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !url.trim()}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: saving || !url.trim() ? '#e5e7eb' : COLORS.primary,
              color: saving || !url.trim() ? COLORS.textMuted : COLORS.text,
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: saving || !url.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {saving ? (
              <>
                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <Plus size={14} />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

// ============================================================
// Shortlink Tray Component - Create shortlinks for saved links
// ============================================================
const ShortlinkTray = ({ isOpen, onClose, link, onSuccess }) => {
  const [customCode, setCustomCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const { createShortlink } = useShortlinks();

  // Reset state when tray closes
  React.useEffect(() => {
    if (!isOpen) {
      setCustomCode('');
      setError(null);
      setCreatedLink(null);
      setCopied(false);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!link?.url) return;

    setCreating(true);
    setError(null);

    try {
      const result = await createShortlink({
        destinationUrl: link.url,
        title: link.title || link.domain || 'Saved Link',
        customCode: customCode.trim() || undefined,
        campaign: 'link-saver'
      });

      setCreatedLink(result);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err.message || 'Failed to create shortlink');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (!createdLink) return;
    const shortUrl = `${window.location.origin}/go/${createdLink.shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !createdLink) {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const shortUrl = createdLink ? `${window.location.origin}/go/${createdLink.shortCode}` : null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 999,
          }}
        />
      )}

      {/* Tray Panel - Slides from top-right */}
      <div
        style={{
          position: 'fixed',
          right: 'clamp(16px, 5vw, 60px)',
          top: isOpen ? 170 : -400,
          width: 260,
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: '#ffffff',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          borderRadius: '0 0 12px 12px',
          transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            backgroundColor: '#8B5CF6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExternalLink size={16} color="#fff" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#fff' }}>
              Shortlink
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '18px',
              fontWeight: '300',
              transition: 'color 0.2s ease'
            }}
            title="Close"
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '12px' }}>
          {/* Link Preview */}
          {link && (
            <div style={{
              padding: '8px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              marginBottom: '10px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: COLORS.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {link.title || 'Untitled'}
              </div>
            </div>
          )}

          {!createdLink ? (
            <>
              {/* Custom Code Input */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: COLORS.textMuted,
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  Custom Code (optional)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: COLORS.textMuted }}>
                    /go/
                  </span>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    onKeyDown={handleKeyDown}
                    placeholder="auto"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  padding: '8px 10px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '6px',
                  fontSize: '11px',
                  marginBottom: '10px'
                }}>
                  {error}
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: creating ? '#a78bfa' : '#8B5CF6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {creating ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Creating...
                  </>
                ) : (
                  <>
                    <ExternalLink size={14} />
                    Create
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Success State */}
              <div style={{
                padding: '12px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                textAlign: 'center',
                marginBottom: '10px'
              }}>
                <CheckCircle size={24} color="#22c55e" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>
                  Created!
                </div>
              </div>

              {/* Shortlink Display */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                marginBottom: '10px'
              }}>
                <input
                  type="text"
                  value={shortUrl}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '11px',
                    backgroundColor: '#fff'
                  }}
                />
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: copied ? '#22c55e' : COLORS.primary,
                    color: COLORS.text,
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setCreatedLink(null);
                    setCustomCode('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#f3f4f6',
                    color: COLORS.text,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Create Another
                </button>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#8B5CF6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// ============================================================
// Quick Shortlink Tray - Create shortlinks for any URL
// ============================================================
const QuickShortlinkTray = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const { createShortlink } = useShortlinks();
  const inputRef = React.useRef(null);

  // Focus input when tray opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Reset state when tray closes
  React.useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setCustomCode('');
      setError(null);
      setCreatedLink(null);
      setCopied(false);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      new URL(finalUrl);
    } catch {
      setError('Invalid URL format');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const result = await createShortlink({
        destinationUrl: finalUrl,
        title: new URL(finalUrl).hostname,
        customCode: customCode.trim() || undefined,
        campaign: 'quick-shortlink'
      });

      setCreatedLink(result);
    } catch (err) {
      setError(err.message || 'Failed to create shortlink');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (!createdLink) return;
    const shortUrl = `${window.location.origin}/go/${createdLink.shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !createdLink) {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const shortUrl = createdLink ? `${window.location.origin}/go/${createdLink.shortCode}` : null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            zIndex: 999,
          }}
        />
      )}

      {/* Tray Panel - Slides from top-right */}
      <div
        style={{
          position: 'fixed',
          right: 'clamp(16px, 5vw, 60px)',
          top: isOpen ? 170 : -400,
          width: 260,
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: '#ffffff',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          borderRadius: '0 0 12px 12px',
          transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            backgroundColor: '#8B5CF6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExternalLink size={16} color="#fff" />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#fff' }}>
              Quick Shortlink
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '18px',
              fontWeight: '300',
              transition: 'color 0.2s ease'
            }}
            title="Close"
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '12px' }}>
          {!createdLink ? (
            <>
              {/* URL Input */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: COLORS.textMuted,
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  URL
                </label>
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://example.com"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Custom Code Input */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: COLORS.textMuted,
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  Custom Code (optional)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: COLORS.textMuted }}>
                    /go/
                  </span>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    onKeyDown={handleKeyDown}
                    placeholder="auto"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  padding: '8px 10px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '6px',
                  fontSize: '11px',
                  marginBottom: '10px'
                }}>
                  {error}
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreate}
                disabled={creating || !url.trim()}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: creating || !url.trim() ? '#a78bfa' : '#8B5CF6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: creating || !url.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {creating ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Creating...
                  </>
                ) : (
                  <>
                    <ExternalLink size={14} />
                    Create
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Success State */}
              <div style={{
                padding: '12px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                textAlign: 'center',
                marginBottom: '10px'
              }}>
                <CheckCircle size={24} color="#22c55e" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>
                  Created!
                </div>
              </div>

              {/* Shortlink Display */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                marginBottom: '10px'
              }}>
                <input
                  type="text"
                  value={shortUrl}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '11px',
                    backgroundColor: '#fff'
                  }}
                />
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: copied ? '#22c55e' : COLORS.primary,
                    color: COLORS.text,
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => {
                    setCreatedLink(null);
                    setUrl('');
                    setCustomCode('');
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#f3f4f6',
                    color: COLORS.text,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Create Another
                </button>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#8B5CF6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// ============================================================
// Link Card Component
// ============================================================
// Share Tooltip Component - detailed hover tooltip for share pills
const ShareTooltip = ({ shares, type, isVisible, position }) => {
  if (!isVisible || shares.length === 0) return null;

  const isUser = type === 'user';
  const bgColor = isUser ? 'rgba(59, 130, 246, 0.95)' : 'rgba(139, 92, 246, 0.95)';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: position === 'right' ? 'auto' : '0',
        right: position === 'right' ? '0' : 'auto',
        marginBottom: '8px',
        backgroundColor: bgColor,
        color: '#fff',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '11px',
        minWidth: '160px',
        maxWidth: '280px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        pointerEvents: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontWeight: 600, marginBottom: '6px', opacity: 0.9 }}>
        {isUser ? 'Shared with Users' : 'Shared with Canvases'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {shares.map((share, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 0',
              borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none'
            }}
          >
            {isUser ? <Mail size={10} /> : <LayoutIcon size={10} />}
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {isUser ? (share.targetEmail || 'Unknown user') : (share.targetName || 'Unknown canvas')}
            </span>
          </div>
        ))}
      </div>
      {/* Tooltip arrow */}
      <div style={{
        position: 'absolute',
        bottom: '-6px',
        left: position === 'right' ? 'auto' : '12px',
        right: position === 'right' ? '12px' : 'auto',
        width: 0,
        height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `6px solid ${bgColor}`
      }} />
    </div>
  );
};

// Share Pill with Tooltip
const SharePill = ({ shares, type }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isUser = type === 'user';

  if (shares.length === 0) return null;

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '10px',
          padding: '2px 6px',
          backgroundColor: isUser ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
          color: isUser ? COLORS.info : '#8B5CF6',
          borderRadius: '10px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          ...(showTooltip && {
            backgroundColor: isUser ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)'
          })
        }}
      >
        {isUser ? <Users size={10} /> : <LayoutIcon size={10} />}
        {shares.length}
      </span>
      <ShareTooltip
        shares={shares}
        type={type}
        isVisible={showTooltip}
        position={isUser ? 'left' : 'right'}
      />
    </div>
  );
};

const LinkCard = ({ link, onStar, onArchive, onDelete, onClick, onShare, onRead, onShortlink }) => {
  const [isHovered, setIsHovered] = useState(false);
  const sharedWith = link.sharedWith || [];
  const userShares = sharedWith.filter(s => s.type === 'user');
  const canvasShares = sharedWith.filter(s => s.type === 'canvas');
  const isShared = sharedWith.length > 0;

  // Build tooltip text
  const getShareTooltip = () => {
    if (!isShared) return 'Share link';
    const parts = [];
    if (userShares.length > 0) {
      parts.push(`${userShares.length} user${userShares.length > 1 ? 's' : ''}`);
    }
    if (canvasShares.length > 0) {
      parts.push(`${canvasShares.length} canvas${canvasShares.length > 1 ? 'es' : ''}`);
    }
    return `Shared with ${parts.join(' & ')}`;
  };

  return (
    <div
      style={{
        ...styles.linkCard,
        backgroundColor: isHovered ? COLORS.cardBg : COLORS.white
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(link)}
    >
      {/* Left column: Thumbnail */}
      {link.image ? (
        <img src={link.image} alt="" style={styles.linkThumbnail} />
      ) : (
        <div style={{
          ...styles.linkThumbnail,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Globe size={20} color={COLORS.textLight} />
        </div>
      )}

      {/* Right column: Content + Actions */}
      <div style={styles.linkCardRight}>
        {/* Content preview */}
        <div style={styles.linkContent}>
          <div
            style={{
              ...styles.linkTitle,
              ...(link.content ? {
                cursor: 'pointer',
                transition: 'color 0.15s'
              } : {})
            }}
            onClick={(e) => {
              if (link.content) {
                e.stopPropagation();
                onRead(link);
              }
            }}
            onMouseEnter={(e) => {
              if (link.content) e.target.style.color = COLORS.primary;
            }}
            onMouseLeave={(e) => {
              if (link.content) e.target.style.color = COLORS.text;
            }}
            title={link.content ? 'Click to read' : undefined}
          >
            {link.title}
            {link.content && (
              <BookOpen size={12} style={{ marginLeft: '4px', opacity: 0.5, verticalAlign: 'middle' }} />
            )}
          </div>
          <div style={styles.linkDomain}>
            {link.favicon && (
              <img src={link.favicon} alt="" style={{ width: 12, height: 12 }} />
            )}
            {link.domain}
            {link.estimatedReadTime > 0 && (
              <>
                <span style={{ color: COLORS.textLight }}>•</span>
                <Clock size={10} />
                {Math.ceil(link.estimatedReadTime / 60)}m
              </>
            )}
          </div>
          {link.excerpt && (
            <div style={styles.linkExcerpt}>{link.excerpt}</div>
          )}
          <div style={styles.linkMeta}>
            {link.tags?.slice(0, 2).map(tag => (
              <span key={tag} style={styles.linkTag}>{tag}</span>
            ))}
            {link.tags?.length > 2 && (
              <span style={{ fontSize: '10px', color: COLORS.textLight }}>
                +{link.tags.length - 2}
              </span>
            )}
            {isShared && (
              <div style={{ display: 'flex', gap: '3px', marginLeft: 'auto' }}>
                <SharePill shares={userShares} type="user" />
                <SharePill shares={canvasShares} type="canvas" />
              </div>
            )}
          </div>
        </div>

        {/* Actions row (aligned with text) */}
        <div style={styles.linkActions}>
          {link.content && (
            <button
              style={{
                ...styles.actionButton,
                color: link.readProgress > 0 ? COLORS.success : COLORS.textMuted
              }}
              onClick={(e) => { e.stopPropagation(); onRead(link); }}
              title={link.readProgress > 0 ? `Continue (${Math.round(link.readProgress * 100)}%)` : 'Read'}
            >
              <BookOpen size={16} />
            </button>
          )}

          <button
            style={styles.actionButton}
            onClick={(e) => { e.stopPropagation(); onStar(link); }}
            title={link.starred ? 'Unstar' : 'Star'}
          >
            {link.starred ? (
              <Star size={16} fill={COLORS.warning} color={COLORS.warning} />
            ) : (
              <StarOff size={16} />
            )}
          </button>

          <button
            style={styles.actionButton}
            onClick={(e) => { e.stopPropagation(); onArchive(link); }}
            title={link.archived ? 'Unarchive' : 'Archive'}
          >
            {link.archived ? (
              <ArchiveRestore size={16} />
            ) : (
              <Archive size={16} />
            )}
          </button>

          <button
            style={{
              ...styles.actionButton,
              color: isShared ? COLORS.primary : COLORS.textMuted
            }}
            onClick={(e) => { e.stopPropagation(); onShare(link); }}
            title={getShareTooltip()}
          >
            <Share2 size={16} />
          </button>

          <button
            style={{
              ...styles.actionButton,
              color: '#8B5CF6'
            }}
            onClick={(e) => { e.stopPropagation(); onShortlink(link); }}
            title="Shortlink"
          >
            <ExternalLink size={16} />
          </button>

          <button
            style={styles.actionButton}
            onClick={(e) => { e.stopPropagation(); onDelete(link); }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>

          {link.readProgress > 0 && (
            <div style={{ ...styles.progressBar, marginLeft: 'auto' }}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${link.readProgress * 100}%`
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Import Modal Component
// ============================================================

// Parse CSV data into link objects
const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));

  // Map common header names to our format
  const headerMap = {
    'url': 'url',
    'link': 'url',
    'href': 'url',
    'title': 'title',
    'name': 'title',
    'tags': 'tags',
    'tag': 'tags',
    'labels': 'tags',
    'date': 'savedAt',
    'saved': 'savedAt',
    'created': 'savedAt',
    'time_added': 'savedAt',
    'excerpt': 'excerpt',
    'description': 'excerpt',
    'summary': 'excerpt'
  };

  // Find which columns we can use
  const urlIndex = headers.findIndex(h => headerMap[h] === 'url' || h.includes('url'));
  const titleIndex = headers.findIndex(h => headerMap[h] === 'title' || h.includes('title'));
  const tagsIndex = headers.findIndex(h => headerMap[h] === 'tags' || h.includes('tag'));
  const dateIndex = headers.findIndex(h => headerMap[h] === 'savedAt' || h.includes('date') || h.includes('time'));
  const excerptIndex = headers.findIndex(h => headerMap[h] === 'excerpt' || h.includes('excerpt') || h.includes('description'));

  if (urlIndex === -1) {
    throw new Error('CSV must have a URL column');
  }

  // Parse data rows
  const links = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV values (handle quoted values)
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    const url = values[urlIndex];
    if (!url || !url.startsWith('http')) continue;

    const link = {
      given_url: url,
      resolved_title: titleIndex >= 0 ? values[titleIndex] : '',
      excerpt: excerptIndex >= 0 ? values[excerptIndex] : '',
      tags: {}
    };

    // Parse tags
    if (tagsIndex >= 0 && values[tagsIndex]) {
      const tagList = values[tagsIndex].split(/[;|]/).map(t => t.trim()).filter(Boolean);
      tagList.forEach(tag => {
        link.tags[tag] = { item_id: '', tag };
      });
    }

    // Parse date
    if (dateIndex >= 0 && values[dateIndex]) {
      const timestamp = Date.parse(values[dateIndex]);
      if (!isNaN(timestamp)) {
        link.time_added = Math.floor(timestamp / 1000);
      }
    }

    links.push(link);
  }

  return links;
};

const ImportModal = ({ isOpen, onClose, onImport }) => {
  const [importData, setImportData] = useState('');
  const [importFormat, setImportFormat] = useState('auto'); // 'auto', 'json', 'csv'
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = React.useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Auto-detect format from extension
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'csv') {
      setImportFormat('csv');
    } else if (ext === 'json') {
      setImportFormat('json');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportData(event.target.result);
      setResult(null);
    };
    reader.onerror = () => {
      setResult({ error: 'Failed to read file' });
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setProgress(null);

      let links = [];

      // Determine format
      const format = importFormat === 'auto'
        ? (importData.trim().startsWith('{') || importData.trim().startsWith('[') ? 'json' : 'csv')
        : importFormat;

      if (format === 'csv') {
        links = parseCSV(importData);
      } else {
        const data = JSON.parse(importData);
        links = Array.isArray(data) ? data : data.list || [];
      }

      // For large imports, process in batches with progress
      if (links.length > 100) {
        const BATCH_SIZE = 100;
        let totalImported = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        for (let i = 0; i < links.length; i += BATCH_SIZE) {
          const batch = links.slice(i, i + BATCH_SIZE);
          setProgress({ current: Math.min(i + BATCH_SIZE, links.length), total: links.length });
          const batchResult = await onImport(batch);
          totalImported += batchResult.imported || 0;
          totalSkipped += batchResult.skipped || 0;
          totalErrors += batchResult.errors || 0;
        }

        setResult({ imported: totalImported, skipped: totalSkipped, errors: totalErrors });
      } else {
        const importResult = await onImport(links);
        setResult(importResult);
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setIsImporting(false);
      setProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>
          <span>Import Links</span>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'rgba(0, 0, 0, 0.5)',
              fontSize: '20px',
              transition: 'background-color 0.2s ease'
            }}
            title="Close"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: '14px', color: COLORS.textMuted, marginBottom: '16px' }}>
          Import links from Pocket (JSON) or any CSV file with a URL column.
        </p>

        {/* Format Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>
            File Format
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'auto', label: 'Auto-detect' },
              { id: 'json', label: 'JSON (Pocket)' },
              { id: 'csv', label: 'CSV' }
            ].map(f => (
              <button
                key={f.id}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${importFormat === f.id ? COLORS.primary : COLORS.border}`,
                  backgroundColor: importFormat === f.id ? COLORS.primary : COLORS.white,
                  color: COLORS.text,
                  fontSize: '13px',
                  fontWeight: importFormat === f.id ? '600' : '400',
                  cursor: 'pointer'
                }}
                onClick={() => setImportFormat(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            style={{ ...styles.button, ...styles.secondaryButton, flex: 1 }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} /> {fileName ? fileName : 'Choose File (JSON or CSV)'}
          </button>
          {importData && (
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => { setImportData(''); setResult(null); setFileName(''); }}
            >
              Clear
            </button>
          )}
        </div>

        <textarea
          style={styles.textarea}
          placeholder={importFormat === 'csv'
            ? "Paste your CSV data here (with headers: url, title, tags, etc.)..."
            : "Paste your Pocket export JSON or CSV data here..."
          }
          value={importData}
          onChange={e => setImportData(e.target.value)}
          rows={6}
        />

        {importData && (
          <p style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '8px' }}>
            {(() => {
              try {
                // Determine format for preview
                const format = importFormat === 'auto'
                  ? (importData.trim().startsWith('{') || importData.trim().startsWith('[') ? 'json' : 'csv')
                  : importFormat;

                if (format === 'csv') {
                  const links = parseCSV(importData);
                  return `${links.length.toLocaleString()} links ready to import (CSV)`;
                } else {
                  const data = JSON.parse(importData);
                  const count = Array.isArray(data) ? data.length : Object.keys(data.list || {}).length;
                  return `${count.toLocaleString()} links ready to import (JSON)`;
                }
              } catch (err) {
                return `Error: ${err.message}`;
              }
            })()}
          </p>
        )}

        {progress && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor: '#e0f2fe',
            color: '#0369a1'
          }}>
            <div style={{ marginBottom: '8px' }}>
              Importing: {progress.current.toLocaleString()} / {progress.total.toLocaleString()} links
            </div>
            <div style={{
              height: '6px',
              backgroundColor: '#bae6fd',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#0ea5e9',
                width: `${(progress.current / progress.total) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {result && !progress && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor: result.error ? '#fee2e2' : '#d1fae5',
            color: result.error ? COLORS.danger : COLORS.success
          }}>
            {result.error ? (
              <span>Error: {result.error}</span>
            ) : (
              <span>
                Imported {result.imported?.toLocaleString()} links. Skipped {result.skipped?.toLocaleString()} duplicates.
                {result.errors > 0 && ` ${result.errors} errors.`}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
            disabled={isImporting}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleImport}
            disabled={isImporting || !importData.trim()}
          >
            {isImporting ? (
              <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> {progress ? `${Math.round((progress.current / progress.total) * 100)}%` : 'Importing...'}</>
            ) : (
              <><Upload size={16} /> Import</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Add Folder Modal Component
// ============================================================
// Icon options for folder customization
const FOLDER_ICON_OPTIONS = [
  { id: 'folder', icon: Folder, label: 'Folder' },
  { id: 'star', icon: Star, label: 'Star' },
  { id: 'bookmark', icon: Bookmark, label: 'Bookmark' },
  { id: 'inbox', icon: Inbox, label: 'Inbox' },
  { id: 'archive', icon: Archive, label: 'Archive' },
  { id: 'book', icon: BookOpen, label: 'Reading' },
  { id: 'tag', icon: Tag, label: 'Tags' },
  { id: 'file', icon: FileText, label: 'Documents' },
  { id: 'globe', icon: Globe, label: 'Web' },
  { id: 'brain', icon: Brain, label: 'Ideas' },
  { id: 'code', icon: Code, label: 'Code' },
  { id: 'heart', icon: Heart, label: 'Favorites' },
  { id: 'briefcase', icon: Briefcase, label: 'Work' }
];

const AddFolderModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('folder');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await onAdd({ name: name.trim(), color, icon });
    setName('');
    setIcon('folder');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>
          <span>New Folder</span>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'rgba(0, 0, 0, 0.5)',
              fontSize: '20px',
              transition: 'background-color 0.2s ease'
            }}
            title="Close"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        <input
          style={styles.input}
          placeholder="Folder name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>
            Icon
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FOLDER_ICON_OPTIONS.map(opt => {
              const IconComp = opt.icon;
              const isSelected = icon === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? color : '#f0f0f0',
                    border: isSelected ? '2px solid #171717' : '1px solid #d1d5db',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setIcon(opt.id)}
                  title={opt.label}
                >
                  <IconComp
                    size={18}
                    color={isSelected ? '#ffffff' : '#374151'}
                    strokeWidth={2}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>
            Color
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['#3B82F6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map(c => (
              <button
                key={c}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: c,
                  border: color === c ? '3px solid #171717' : '3px solid transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleAdd}
            disabled={!name.trim()}
          >
            <FolderPlus size={16} /> Create Folder
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Edit Folder Modal Component
// ============================================================
const EditFolderModal = ({ isOpen, onClose, onSave, folder }) => {
  const [name, setName] = useState(folder?.name || '');
  const [color, setColor] = useState(folder?.color || '#3B82F6');
  const [icon, setIcon] = useState(folder?.icon || 'folder');

  // Reset form when folder changes
  useEffect(() => {
    if (folder) {
      setName(folder.name || '');
      setColor(folder.color || '#3B82F6');
      setIcon(folder.icon || 'folder');
    }
  }, [folder]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave(folder.id, { name: name.trim(), color, icon });
    onClose();
  };

  if (!isOpen || !folder) return null;

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>
          <span>Edit Folder</span>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'rgba(0, 0, 0, 0.5)',
              fontSize: '20px',
              transition: 'background-color 0.2s ease'
            }}
            title="Close"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        <input
          style={styles.input}
          placeholder="Folder name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>
            Icon
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FOLDER_ICON_OPTIONS.map(opt => {
              const IconComp = opt.icon;
              const isSelected = icon === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? color : '#f0f0f0',
                    border: isSelected ? '2px solid #171717' : '1px solid #d1d5db',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setIcon(opt.id)}
                  title={opt.label}
                >
                  <IconComp
                    size={18}
                    color={isSelected ? '#ffffff' : '#374151'}
                    strokeWidth={2}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>
            Color
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['#3B82F6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'].map(c => (
              <button
                key={c}
                type="button"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: c,
                  border: color === c ? '3px solid #171717' : '3px solid transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleSave}
            disabled={!name.trim()}
          >
            <Pencil size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Folder Tree Item Component (for nested hierarchy)
// ============================================================
const FolderTreeItem = ({
  folder,
  depth = 0,
  isActive,
  onSelect,
  folderCounts,
  children,
  onToggleExpand,
  isExpanded,
  hasChildren,
  onDelete,
  onEdit,
  onShare,
  isDraggable = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get the right icon based on folder type using FOLDER_ICON_OPTIONS
  const getFolderIcon = () => {
    const iconOption = FOLDER_ICON_OPTIONS.find(opt => opt.id === folder.icon);
    return iconOption ? iconOption.icon : Folder;
  };

  const IconComponent = getFolderIcon();

  const handleDelete = (e) => {
    e.stopPropagation();
    if (folder.isSystem) {
      alert('System folders cannot be deleted');
      return;
    }
    if (window.confirm(`Delete folder "${folder.name}"? Links in this folder will become unfiled.`)) {
      onDelete(folder.id);
    }
  };

  return (
    <div>
      <div
        style={{
          ...styles.sidebarItem,
          paddingLeft: isDraggable ? '4px' : `${12 + depth * 16}px`,
          ...(isActive ? styles.sidebarItemActive : {}),
          backgroundColor: isHovered && !isActive ? COLORS.cardBg : (isActive ? COLORS.primary : 'transparent'),
          cursor: isDraggable ? 'grab' : 'pointer'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSelect(folder.id)}
      >
        {/* Drag handle for draggable folders */}
        {isDraggable && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              color: COLORS.textMuted,
              opacity: isHovered ? 0.8 : 0.4,
              marginRight: '4px',
              cursor: 'grab'
            }}
          >
            <GripVertical size={14} />
          </span>
        )}

        {/* Expand/collapse toggle for folders with children */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(folder.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: COLORS.textMuted
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span style={{ width: '18px' }} /> // Spacer for alignment
        )}

        <IconComponent
          size={18}
          color={folder.color || COLORS.info}
          fill={folder.isSystem ? folder.color : 'none'}
          strokeWidth={folder.isSystem ? 1.5 : 2}
        />

        <span style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {folder.name}
        </span>

        {/* Edit, Share, and Delete buttons - only show on hover for non-system folders */}
        {isHovered && !folder.isSystem && (
          <>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(folder);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: COLORS.textMuted,
                  opacity: 0.7,
                  marginRight: '2px'
                }}
                title="Edit folder"
              >
                <Pencil size={14} />
              </button>
            )}
            {onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(folder);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: (folder.sharedWith?.length > 0) ? COLORS.primary : COLORS.textMuted,
                  opacity: 0.7,
                  marginRight: '2px'
                }}
                title={folder.sharedWith?.length > 0 ? `Shared with ${folder.sharedWith.length} user(s)` : 'Share folder'}
              >
                <Share2 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: COLORS.danger,
                  opacity: 0.7,
                  marginRight: '4px'
                }}
                title="Delete folder"
              >
                <Trash2 size={14} />
              </button>
            )}
          </>
        )}

        {/* System folder badge */}
        {folder.isSystem && (
          <span style={{
            fontSize: '9px',
            color: COLORS.textMuted,
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '1px 4px',
            borderRadius: '3px',
            marginRight: '4px'
          }}>
            SYS
          </span>
        )}

        <span style={{
          fontSize: '11px',
          color: isActive ? COLORS.text : COLORS.textMuted,
          backgroundColor: isActive ? 'rgba(0,0,0,0.1)' : COLORS.cardBg,
          padding: '2px 6px',
          borderRadius: '4px',
          minWidth: '24px',
          textAlign: 'center'
        }}>
          {folderCounts[folder.id] || 0}
        </span>
      </div>

      {/* Render children if expanded */}
      {isExpanded && children}
    </div>
  );
};

// ============================================================
// Folder Tree Component (with virtual scrolling for large lists)
// ============================================================
const FolderTreeComponent = ({
  folders,
  activeFolder,
  onSelectFolder,
  folderCounts,
  expandedFolders,
  onToggleExpand,
  onDeleteFolder,
  onEditFolder,
  onShareFolder,
  onReorderFolders
}) => {
  const parentRef = useRef(null);

  // Separate system folders from user folders at root level
  const rootFolders = folders.filter(f => f.parentId === null || f.parentId === undefined);
  const systemFolders = rootFolders.filter(f => f.isSystem).sort((a, b) => (a.order || 0) - (b.order || 0));
  const userFolders = rootFolders.filter(f => !f.isSystem).sort((a, b) => (a.order || 0) - (b.order || 0));

  // Flatten visible folders into a single array for virtualization
  const flattenFolders = useCallback((folderList, depth = 0, isSystemSection = false) => {
    const result = [];
    folderList.forEach(folder => {
      const childFolders = folders.filter(f => f.parentId === folder.id);
      const hasChildren = childFolders.length > 0;
      const isExpanded = expandedFolders.has(folder.id);

      result.push({
        folder,
        depth,
        hasChildren,
        isExpanded,
        isDraggable: !isSystemSection && depth === 0
      });

      // Add children if expanded
      if (hasChildren && isExpanded) {
        const sortedChildren = childFolders.sort((a, b) => (a.order || 0) - (b.order || 0));
        result.push(...flattenFolders(sortedChildren, depth + 1, isSystemSection));
      }
    });
    return result;
  }, [folders, expandedFolders]);

  // Create flattened list of all visible folders
  const flattenedFolders = useMemo(() => {
    const systemFlattened = flattenFolders(systemFolders, 0, true);
    const userFlattened = flattenFolders(userFolders, 0, false);
    return [...systemFlattened, ...userFlattened];
  }, [flattenFolders, systemFolders, userFolders]);

  // Use virtualization only when there are many folders (> 20 visible)
  const useVirtual = flattenedFolders.length > 20;

  // Virtual row renderer
  const rowVirtualizer = useVirtualizer({
    count: flattenedFolders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 42, // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
    enabled: useVirtual
  });

  // Handle reorder - only for user folders
  const handleReorder = (newOrder) => {
    onReorderFolders(newOrder.map(f => f.id));
  };

  // Render a folder item (non-draggable version for virtual list)
  const renderVirtualItem = (item) => {
    const { folder, depth, hasChildren, isExpanded, isDraggable } = item;

    return (
      <FolderTreeItem
        key={folder.id}
        folder={folder}
        depth={depth}
        isActive={activeFolder === folder.id}
        onSelect={onSelectFolder}
        folderCounts={folderCounts}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onDelete={onDeleteFolder}
        onEdit={onEditFolder}
        onShare={onShareFolder}
        isDraggable={isDraggable}
      />
    );
  };

  // Render a single folder item (with children if expanded) - for non-virtual mode
  const renderFolderItem = (folder, depth = 0, isDraggable = false) => {
    const childFolders = folders.filter(f => f.parentId === folder.id);
    const hasChildren = childFolders.length > 0;
    const isExpanded = expandedFolders.has(folder.id);

    const folderContent = (
      <FolderTreeItem
        key={folder.id}
        folder={folder}
        depth={depth}
        isActive={activeFolder === folder.id}
        onSelect={onSelectFolder}
        folderCounts={folderCounts}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onDelete={onDeleteFolder}
        onEdit={onEditFolder}
        onShare={onShareFolder}
        isDraggable={isDraggable && depth === 0}
      >
        {hasChildren && isExpanded && childFolders
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(child => renderFolderItem(child, depth + 1, false))}
      </FolderTreeItem>
    );

    return folderContent;
  };

  // Virtual scrolling mode for large folder lists
  if (useVirtual) {
    return (
      <div
        ref={parentRef}
        style={{
          maxHeight: '400px',
          overflow: 'auto',
          // Hide scrollbar but keep functionality
          scrollbarWidth: 'thin',
          scrollbarColor: `${COLORS.border} transparent`
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = flattenedFolders[virtualRow.index];
            return (
              <div
                key={item.folder.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                {renderVirtualItem(item)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard mode with drag-drop support for smaller folder lists
  return (
    <div>
      {/* System folders - not draggable */}
      {systemFolders.map(folder => renderFolderItem(folder, 0, false))}

      {/* User folders - draggable */}
      {userFolders.length > 0 && (
        <Reorder.Group
          axis="y"
          values={userFolders}
          onReorder={handleReorder}
          style={{ listStyle: 'none', margin: 0, padding: 0 }}
        >
          {userFolders.map(folder => (
            <Reorder.Item
              key={folder.id}
              value={folder}
              style={{ listStyle: 'none' }}
              whileDrag={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            >
              {renderFolderItem(folder, 0, true)}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
};

// ============================================================
// Bulk Folder Management Modal
// ============================================================
const BulkFolderModal = ({ isOpen, onClose, folders, tags, onMoveTags, onRefresh }) => {
  const [selectedTag, setSelectedTag] = useState('');
  const [targetFolderId, setTargetFolderId] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [result, setResult] = useState(null);

  const handleMove = async () => {
    if (!selectedTag) return;

    setIsMoving(true);
    setResult(null);

    try {
      const moveResult = await onMoveTags(selectedTag, targetFolderId || null);
      setResult(moveResult);
      if (moveResult.moved > 0) {
        onRefresh();
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setIsMoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>
          <span>Bulk Folder Management</span>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'rgba(0, 0, 0, 0.5)',
              fontSize: '20px',
              transition: 'background-color 0.2s ease'
            }}
            title="Close"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        <p style={{ fontSize: '14px', color: COLORS.textMuted, marginBottom: '16px' }}>
          Move all links with a specific tag to a folder. Great for organizing imported links.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', color: COLORS.textMuted, display: 'block', marginBottom: '6px' }}>
            Select Tag
          </label>
          <select
            style={{
              ...styles.input,
              cursor: 'pointer'
            }}
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
          >
            <option value="">Select a tag...</option>
            {tags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', color: COLORS.textMuted, display: 'block', marginBottom: '6px' }}>
            Move to Folder
          </label>
          <select
            style={{
              ...styles.input,
              cursor: 'pointer'
            }}
            value={targetFolderId}
            onChange={e => setTargetFolderId(e.target.value)}
          >
            <option value="">Unfiled (no folder)</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        {result && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor: result.error ? '#fee2e2' : '#d1fae5',
            color: result.error ? COLORS.danger : COLORS.success
          }}>
            {result.error ? (
              <span>Error: {result.error}</span>
            ) : (
              <span>
                Moved {result.moved} links to folder.
                {result.errors > 0 && ` ${result.errors} errors.`}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
            disabled={isMoving}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleMove}
            disabled={isMoving || !selectedTag}
          >
            {isMoving ? (
              <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Moving...</>
            ) : (
              <><Folder size={16} /> Move Links</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Add Link Modal Component
// ============================================================
const AddLinkModal = ({
  isOpen,
  onClose,
  url, setUrl,
  title, setTitle,
  tags, setTags,
  loading, error,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>
          <span>Add Link</span>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'rgba(0, 0, 0, 0.5)',
              fontSize: '20px',
              transition: 'background-color 0.2s ease'
            }}
            title="Close"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', color: COLORS.textMuted, display: 'block', marginBottom: '6px' }}>
            URL *
          </label>
          <input
            style={styles.input}
            placeholder="https://example.com/article"
            value={url}
            onChange={e => setUrl(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', color: COLORS.textMuted, display: 'block', marginBottom: '6px' }}>
            Title (optional - auto-fetched if empty)
          </label>
          <input
            style={styles.input}
            placeholder="Article title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', color: COLORS.textMuted, display: 'block', marginBottom: '6px' }}>
            Tags (comma separated)
          </label>
          <input
            style={styles.input}
            placeholder="tech, article, read-later"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </div>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            color: COLORS.danger,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton, opacity: loading ? 0.6 : 1 }}
            onClick={onSubmit}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <Plus size={16} /> Save Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Link Detail Modal Component
// ============================================================
const LinkDetailModal = ({ link, isOpen, onClose, onUpdate, onRead }) => {
  const [newTag, setNewTag] = useState('');

  if (!isOpen || !link) return null;

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const updatedTags = [...(link.tags || []), newTag.trim()];
    await onUpdate(link.id, { tags: updatedTags });
    setNewTag('');
  };

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={{ ...styles.modalContent, maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>
          <span>Link Details</span>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'rgba(0, 0, 0, 0.5)',
              fontSize: '20px',
              transition: 'background-color 0.2s ease'
            }}
            title="Close"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {link.image && (
          <img
            src={link.image}
            alt=""
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '12px',
              marginBottom: '16px'
            }}
          />
        )}

        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
          {link.title}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          {link.favicon && (
            <img src={link.favicon} alt="" style={{ width: 16, height: 16 }} />
          )}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: COLORS.info, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {link.domain} <ExternalLink size={14} />
          </a>
        </div>

        {link.excerpt && (
          <p style={{ fontSize: '14px', color: COLORS.textMuted, marginBottom: '16px', lineHeight: '1.6' }}>
            {link.excerpt}
          </p>
        )}

        {link.aiSummary && (
          <div style={{
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600' }}>
              <Brain size={18} color={COLORS.warning} />
              AI Summary
            </div>
            <p style={{ fontSize: '14px', color: COLORS.text, lineHeight: '1.6' }}>
              {link.aiSummary}
            </p>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
            Tags
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {link.tags?.map(tag => (
              <span key={tag} style={{
                ...styles.linkTag,
                backgroundColor: COLORS.primary,
                color: COLORS.text
              }}>
                {tag}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{ ...styles.input, marginBottom: 0, flex: 1 }}
              placeholder="Add a tag..."
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTag()}
            />
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handleAddTag}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '4px' }}>Reading Progress</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ ...styles.progressBar, flex: 1 }}>
                <div style={{ ...styles.progressFill, width: `${(link.readProgress || 0) * 100}%` }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                {Math.round((link.readProgress || 0) * 100)}%
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '4px' }}>Time Spent</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {Math.round((link.readTime || 0) / 60)} min
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: `1px solid ${COLORS.border}`
        }}>
          <CommentList
            targetType="link"
            targetId={link.id}
            collaborators={[]}
            showInput={true}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
          {link.content && (
            <button
              onClick={() => { onRead(link); onClose(); }}
              style={{ ...styles.button, ...styles.primaryButton, backgroundColor: COLORS.success }}
            >
              <BookOpen size={16} /> Read
            </button>
          )}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.button, ...styles.primaryButton, textDecoration: 'none' }}
          >
            <ExternalLink size={16} /> Open Link
          </a>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Share Link Modal Component
// ============================================================
const ShareLinkModal = ({ link, isOpen, onClose, user, onShareComplete }) => {
  const [activeTab, setActiveTab] = useState('user'); // 'user' | 'canvas'
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(null);
  const [sharingInfo, setSharingInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Canvas sharing state
  const [userCanvases, setUserCanvases] = useState([]);
  const [loadingCanvases, setLoadingCanvases] = useState(false);
  const [selectedCanvasId, setSelectedCanvasId] = useState('');

  // Fix missing userIds state
  const [isFixing, setIsFixing] = useState(false);

  // Load sharing info when modal opens
  React.useEffect(() => {
    if (isOpen && link) {
      setLoadingInfo(true);
      setShareError(null);
      setShareSuccess(null);
      getLinkSharingInfo(link.id)
        .then(info => {
          setSharingInfo(info);
        })
        .catch(err => {
          console.error('Error loading sharing info:', err);
        })
        .finally(() => {
          setLoadingInfo(false);
        });
    }
  }, [isOpen, link]);

  // Load user's canvases when tab changes to canvas
  React.useEffect(() => {
    if (isOpen && activeTab === 'canvas' && user?.uid && userCanvases.length === 0) {
      setLoadingCanvases(true);

      const loadCanvases = async () => {
        try {
          const capsulesRef = collection(db, 'capsules');

          // Query 1: Capsules owned by user
          const ownedQuery = query(
            capsulesRef,
            where('ownerId', '==', user.uid),
            limit(50)
          );
          const ownedSnap = await getDocs(ownedQuery);
          console.log('[ShareLinkModal] Owned canvases found:', ownedSnap.docs.length);

          const owned = ownedSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            _source: 'owned'
          }));

          // Query 2: Also check recent capsules for collaborator access
          // (Firestore can't query nested array objects, so fetch and filter)
          const recentQuery = query(
            capsulesRef,
            orderBy('updatedAt', 'desc'),
            limit(100)
          );
          const recentSnap = await getDocs(recentQuery);

          const userEmail = user.email?.toLowerCase();
          const shared = recentSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(cap =>
              cap.ownerId !== user.uid &&
              cap.collaborators?.some(c => c.email === userEmail)
            )
            .map(cap => ({ ...cap, _source: 'shared' }));

          console.log('[ShareLinkModal] Shared canvases found:', shared.length);

          // Combine and dedupe
          const allCanvases = [...owned];
          shared.forEach(cap => {
            if (!allCanvases.some(c => c.id === cap.id)) {
              allCanvases.push(cap);
            }
          });

          // Sort by updatedAt
          allCanvases.sort((a, b) => {
            const aTime = a.updatedAt?.toMillis?.() || a.updatedAt || 0;
            const bTime = b.updatedAt?.toMillis?.() || b.updatedAt || 0;
            return bTime - aTime;
          });

          console.log('[ShareLinkModal] Total canvases:', allCanvases.length);
          setUserCanvases(allCanvases);
        } catch (err) {
          console.error('[ShareLinkModal] Error loading canvases:', err);
        } finally {
          setLoadingCanvases(false);
        }
      };

      loadCanvases();
    }
  }, [isOpen, activeTab, user?.uid, user?.email, userCanvases.length]);

  const handleShareToUser = async () => {
    if (!email.trim()) {
      setShareError('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setShareError('Please enter a valid email address');
      return;
    }

    setIsSharing(true);
    setShareError(null);
    setShareSuccess(null);

    try {
      // First, try to resolve the email to a Firebase user ID
      let targetUserId = null;
      const targetEmail = email.trim().toLowerCase();

      try {
        const response = await fetch(
          `https://us-central1-yellowcircle-app.cloudfunctions.net/getUserInfo?email=${encodeURIComponent(targetEmail)}`
        );
        const data = await response.json();
        if (data.success && data.user?.uid) {
          targetUserId = data.user.uid;
          console.log('[ShareLink] Resolved email to userId:', targetUserId);
        }
      } catch (lookupErr) {
        // User might not exist in Firebase Auth yet - still allow sharing by email
        console.log('[ShareLink] Could not resolve email to userId, sharing by email only:', lookupErr.message);
      }

      await shareLink(link.id, user.uid, targetEmail, targetUserId);
      setShareSuccess(`Link shared with ${email}`);
      setEmail('');

      const info = await getLinkSharingInfo(link.id);
      setSharingInfo(info);

      if (onShareComplete) {
        onShareComplete();
      }
    } catch (err) {
      console.error('Error sharing link:', err);
      setShareError(err.message || 'Failed to share link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareToCanvas = async () => {
    if (!selectedCanvasId) {
      setShareError('Please select a canvas');
      return;
    }

    setIsSharing(true);
    setShareError(null);
    setShareSuccess(null);

    try {
      const canvas = userCanvases.find(c => c.id === selectedCanvasId);
      await shareLinkToCanvas(link.id, user.uid, selectedCanvasId, canvas?.title);
      setShareSuccess(`Link shared to "${canvas?.title || 'canvas'}"`);
      setSelectedCanvasId('');

      const info = await getLinkSharingInfo(link.id);
      setSharingInfo(info);

      if (onShareComplete) {
        onShareComplete();
      }
    } catch (err) {
      console.error('Error sharing to canvas:', err);
      setShareError(err.message || 'Failed to share to canvas');
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshare = async (share) => {
    try {
      if (share.type === 'user') {
        await unshareLink(link.id, user.uid, share.targetEmail || share.targetId);
      } else if (share.type === 'canvas') {
        await unshareLinkFromCanvas(link.id, user.uid, share.targetId);
      }

      const info = await getLinkSharingInfo(link.id);
      setSharingInfo(info);

      if (onShareComplete) {
        onShareComplete();
      }
    } catch (err) {
      console.error('Error unsharing:', err);
      setShareError(err.message || 'Failed to remove share');
    }
  };

  // Fix missing user IDs for existing shares
  const handleFixMissingUserIds = async () => {
    setIsFixing(true);
    setShareError(null);
    setShareSuccess(null);

    try {
      const lookupUserByEmail = async (email) => {
        const response = await fetch(
          `https://us-central1-yellowcircle-app.cloudfunctions.net/getUserInfo?email=${encodeURIComponent(email)}`
        );
        const data = await response.json();
        if (data.success && data.user?.uid) {
          return data.user.uid;
        }
        return null;
      };

      const result = await fixMissingUserIds(link.id, lookupUserByEmail);

      if (result.fixedCount > 0) {
        setShareSuccess(`Fixed ${result.fixedCount} share(s). User IDs now: ${result.sharedWithUserIds.join(', ')}`);
        // Reload sharing info
        const info = await getLinkSharingInfo(link.id);
        setSharingInfo(info);

        if (onShareComplete) {
          onShareComplete();
        }
      } else {
        setShareSuccess('No fixes needed - all shares already have user IDs');
      }
    } catch (err) {
      console.error('Error fixing user IDs:', err);
      setShareError(err.message || 'Failed to fix missing user IDs');
    } finally {
      setIsFixing(false);
    }
  };

  if (!isOpen || !link) return null;

  const userShares = sharingInfo?.sharedWith?.filter(s => s.type === 'user') || [];
  const canvasShares = sharingInfo?.sharedWith?.filter(s => s.type === 'canvas') || [];

  // Check if there are user shares missing targetId (need fixing)
  const sharesNeedingFix = userShares.filter(s => s.targetEmail && !s.targetId);
  const hasMissingUserIds = sharesNeedingFix.length > 0;

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={{ ...styles.modalContent, maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={20} color={COLORS.primary} />
            Share Link
          </span>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'rgba(0, 0, 0, 0.5)',
              fontSize: '20px',
              transition: 'background-color 0.2s ease'
            }}
            title="Close"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Link being shared */}
        <div style={{
          padding: '12px',
          backgroundColor: COLORS.cardBg,
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: COLORS.text,
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {link.title}
          </div>
          <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
            {link.domain}
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          padding: '4px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px'
        }}>
          <button
            onClick={() => { setActiveTab('user'); setShareError(null); setShareSuccess(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              backgroundColor: activeTab === 'user' ? '#ffffff' : 'transparent',
              color: activeTab === 'user' ? COLORS.text : COLORS.textMuted,
              boxShadow: activeTab === 'user' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <Users size={16} />
            Share with User
          </button>
          <button
            onClick={() => { setActiveTab('canvas'); setShareError(null); setShareSuccess(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              backgroundColor: activeTab === 'canvas' ? '#ffffff' : 'transparent',
              color: activeTab === 'canvas' ? COLORS.text : COLORS.textMuted,
              boxShadow: activeTab === 'canvas' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <LayoutIcon size={16} />
            Share to Canvas
          </button>
        </div>

        {/* User Sharing Tab */}
        {activeTab === 'user' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>
              Enter email address
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ ...styles.searchBox, flex: 1, maxWidth: 'none' }}>
                <Mail size={16} color={COLORS.textMuted} />
                <input
                  style={styles.searchInput}
                  placeholder="user@example.com"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setShareError(null);
                    setShareSuccess(null);
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleShareToUser()}
                />
              </div>
              <button
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isSharing ? 0.6 : 1
                }}
                onClick={handleShareToUser}
                disabled={isSharing || !email.trim()}
              >
                {isSharing ? (
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Share2 size={16} />
                )}
                Share
              </button>
            </div>
          </div>
        )}

        {/* Canvas Sharing Tab */}
        {activeTab === 'canvas' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>
              Select a canvas to share to
            </label>
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '12px',
              color: '#0369a1'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span><strong>Sharing Options:</strong></span>
              </div>
              <ul style={{ margin: '0', paddingLeft: '22px', lineHeight: '1.6' }}>
                <li><strong>UnityNotes</strong> — Link appears in the Links tab of <em>every</em> canvas</li>
                <li><strong>Individual Canvas</strong> — Link appears only in that specific canvas</li>
              </ul>
            </div>
            {loadingCanvases ? (
              <div style={{ padding: '16px', textAlign: 'center', color: COLORS.textMuted }}>
                Loading your canvases...
              </div>
            ) : userCanvases.length === 0 ? (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                border: `1px dashed ${COLORS.border}`,
                borderRadius: '8px',
                color: COLORS.textMuted
              }}>
                <LayoutIcon size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ fontSize: '13px', margin: 0 }}>
                  No canvases found. Create one in Unity Notes first.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <select
                  value={selectedCanvasId}
                  onChange={e => {
                    setSelectedCanvasId(e.target.value);
                    setShareError(null);
                    setShareSuccess(null);
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '10px 12px',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    color: COLORS.text,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select a canvas...</option>
                  {/* Universal option - UnityNotes shares to ALL canvases */}
                  <optgroup label="📌 Universal (All Canvases)">
                    {userCanvases
                      .filter(canvas => (canvas.title || '').toLowerCase().includes('unitynotes'))
                      .map(canvas => (
                        <option
                          key={canvas.id}
                          value={canvas.id}
                          disabled={canvasShares.some(s => s.targetId === canvas.id)}
                        >
                          {canvas.title || 'UnityNotes'} — visible in ALL canvases
                          {canvasShares.some(s => s.targetId === canvas.id) ? ' (already shared)' : ''}
                        </option>
                      ))}
                  </optgroup>
                  {/* Individual canvas options */}
                  <optgroup label="📁 Individual Canvases">
                    {userCanvases
                      .filter(canvas => !(canvas.title || '').toLowerCase().includes('unitynotes'))
                      .map(canvas => (
                        <option
                          key={canvas.id}
                          value={canvas.id}
                          disabled={canvasShares.some(s => s.targetId === canvas.id)}
                        >
                          {canvas.title || 'Untitled Canvas'}
                          {canvasShares.some(s => s.targetId === canvas.id) ? ' (already shared)' : ''}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <button
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                    flexShrink: 0,
                    opacity: isSharing || !selectedCanvasId ? 0.6 : 1
                  }}
                  onClick={handleShareToCanvas}
                  disabled={isSharing || !selectedCanvasId}
                >
                  {isSharing ? (
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Share2 size={16} />
                  )}
                  Share
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error/Success messages */}
        {shareError && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            marginBottom: '16px',
            color: COLORS.danger,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {shareError}
          </div>
        )}

        {shareSuccess && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#d1fae5',
            borderRadius: '8px',
            marginBottom: '16px',
            color: COLORS.success,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} />
            {shareSuccess}
          </div>
        )}

        {/* Current shares */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', color: COLORS.textMuted }}>
              Currently shared with ({userShares.length + canvasShares.length})
            </label>
            {/* Fix button for shares missing userId */}
            {hasMissingUserIds && !loadingInfo && (
              <button
                onClick={handleFixMissingUserIds}
                disabled={isFixing}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: `1px solid ${COLORS.warning}`,
                  borderRadius: '4px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  cursor: isFixing ? 'not-allowed' : 'pointer',
                  opacity: isFixing ? 0.6 : 1
                }}
                title={`${sharesNeedingFix.length} share(s) need user ID resolution for "Shared" tab to work`}
              >
                {isFixing ? (
                  <>
                    <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    Fixing...
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} />
                    Fix {sharesNeedingFix.length} share(s)
                  </>
                )}
              </button>
            )}
          </div>

          {loadingInfo ? (
            <div style={{ padding: '16px', textAlign: 'center', color: COLORS.textMuted }}>
              Loading...
            </div>
          ) : (userShares.length + canvasShares.length) > 0 ? (
            <div style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              overflow: 'hidden',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {/* User shares */}
              {userShares.map((share, idx) => (
                <div
                  key={share.targetEmail || share.targetId || `user-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderBottom: `1px solid ${COLORS.border}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: COLORS.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Users size={16} color={COLORS.text} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: COLORS.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {share.targetEmail}
                        {!share.targetId && (
                          <AlertCircle
                            size={12}
                            color={COLORS.warning}
                            title="Missing user ID - click 'Fix' to resolve"
                          />
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: COLORS.textMuted }}>
                        User • Shared {new Date(share.sharedAt).toLocaleDateString()}
                        {share.targetId && <span style={{ color: COLORS.success }}> ✓</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    style={{
                      ...styles.actionButton,
                      color: COLORS.danger
                    }}
                    onClick={() => handleUnshare(share)}
                    title="Remove share"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {/* Canvas shares */}
              {canvasShares.map((share, idx) => {
                const canvas = userCanvases.find(c => c.id === share.targetId);
                return (
                  <div
                    key={share.targetId || `canvas-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderBottom: idx < canvasShares.length - 1 || userShares.length > 0 ? `1px solid ${COLORS.border}` : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#e0e7ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <LayoutIcon size={16} color="#4f46e5" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: COLORS.text }}>
                          {canvas?.title || 'Canvas'}
                        </div>
                        <div style={{ fontSize: '11px', color: COLORS.textMuted }}>
                          Canvas • Shared {new Date(share.sharedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      style={{
                        ...styles.actionButton,
                        color: COLORS.danger
                      }}
                      onClick={() => handleUnshare(share)}
                      title="Remove share"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              border: `1px dashed ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.textMuted
            }}>
              <Share2 size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px', margin: 0 }}>
                Not shared with anyone yet
              </p>
            </div>
          )}
        </div>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Share Folder Modal Component
// ============================================================
const ShareFolderModal = ({ folder, isOpen, onClose, user, onShareComplete }) => {
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(null);
  const [sharingInfo, setSharingInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Load sharing info when modal opens
  React.useEffect(() => {
    if (isOpen && folder) {
      setLoadingInfo(true);
      setShareError(null);
      setShareSuccess(null);
      getFolderSharingInfo(folder.id)
        .then(info => {
          setSharingInfo(info);
        })
        .catch(err => {
          console.error('Error loading folder sharing info:', err);
        })
        .finally(() => {
          setLoadingInfo(false);
        });
    }
  }, [isOpen, folder]);

  const handleShare = async () => {
    if (!email.trim()) {
      setShareError('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setShareError('Please enter a valid email address');
      return;
    }

    setIsSharing(true);
    setShareError(null);
    setShareSuccess(null);

    try {
      // Try to resolve email to user ID
      let targetUserId = null;
      const targetEmail = email.trim().toLowerCase();

      try {
        const response = await fetch(
          `https://us-central1-yellowcircle-app.cloudfunctions.net/getUserInfo?email=${encodeURIComponent(targetEmail)}`
        );
        const data = await response.json();
        if (data.success && data.user?.uid) {
          targetUserId = data.user.uid;
        }
      } catch (lookupErr) {
        console.log('[ShareFolder] Could not resolve email to userId:', lookupErr.message);
      }

      await shareFolder(folder.id, user.uid, targetEmail, targetUserId);
      setShareSuccess(`Folder shared with ${email}`);
      setEmail('');

      const info = await getFolderSharingInfo(folder.id);
      setSharingInfo(info);

      if (onShareComplete) {
        onShareComplete();
      }
    } catch (err) {
      console.error('Error sharing folder:', err);
      setShareError(err.message || 'Failed to share folder');
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshare = async (share) => {
    try {
      await unshareFolder(folder.id, user.uid, share.targetEmail || share.targetId);
      const info = await getFolderSharingInfo(folder.id);
      setSharingInfo(info);

      if (onShareComplete) {
        onShareComplete();
      }
    } catch (err) {
      console.error('Error unsharing folder:', err);
      setShareError(err.message || 'Failed to remove share');
    }
  };

  if (!isOpen || !folder) return null;

  const shares = sharingInfo?.sharedWith || [];

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={{ ...styles.modalContent, maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={20} color={COLORS.primary} />
            Share Folder
          </span>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'rgba(0, 0, 0, 0.5)',
              fontSize: '20px'
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Folder being shared */}
        <div style={{
          padding: '12px',
          backgroundColor: COLORS.cardBg,
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Folder size={24} color={folder.color || COLORS.info} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.text }}>
              {folder.name}
            </div>
            <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
              All links in this folder will be visible to shared users
            </div>
          </div>
        </div>

        {/* Email input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: COLORS.textMuted, display: 'block', marginBottom: '8px' }}>
            Share with user (email)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ ...styles.searchBox, flex: 1, maxWidth: 'none' }}>
              <Mail size={16} color={COLORS.textMuted} />
              <input
                style={styles.searchInput}
                placeholder="user@example.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setShareError(null);
                  setShareSuccess(null);
                }}
                onKeyDown={e => e.key === 'Enter' && handleShare()}
              />
            </div>
            <button
              style={{
                ...styles.button,
                ...styles.primaryButton,
                flexShrink: 0,
                opacity: isSharing ? 0.6 : 1
              }}
              onClick={handleShare}
              disabled={isSharing || !email.trim()}
            >
              {isSharing ? (
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Share2 size={16} />
              )}
              Share
            </button>
          </div>
        </div>

        {/* Error/Success messages */}
        {shareError && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            marginBottom: '16px',
            color: COLORS.danger,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {shareError}
          </div>
        )}

        {shareSuccess && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: '#d1fae5',
            borderRadius: '8px',
            marginBottom: '16px',
            color: COLORS.success,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} />
            {shareSuccess}
          </div>
        )}

        {/* Current shares */}
        <div>
          <label style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '8px', display: 'block' }}>
            Currently shared with ({shares.length})
          </label>

          {loadingInfo ? (
            <div style={{ padding: '16px', textAlign: 'center', color: COLORS.textMuted }}>
              Loading...
            </div>
          ) : shares.length === 0 ? (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              border: `1px dashed ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.textMuted
            }}>
              <Users size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px', margin: 0 }}>
                Not shared with anyone yet
              </p>
            </div>
          ) : (
            <div style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              overflow: 'hidden',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {shares.map((share, idx) => (
                <div
                  key={share.targetEmail || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderBottom: idx < shares.length - 1 ? `1px solid ${COLORS.border}` : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: COLORS.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Users size={16} color={COLORS.text} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: COLORS.text }}>
                        {share.targetEmail}
                      </div>
                      <div style={{ fontSize: '11px', color: COLORS.textMuted }}>
                        {share.role || 'viewer'} • Shared {new Date(share.sharedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    style={{
                      ...styles.actionButton,
                      color: COLORS.danger
                    }}
                    onClick={() => handleUnshare(share)}
                    title="Remove access"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
const LinkArchiverPage = () => {
  const navigate = useNavigate();
  useLayout(); // Context subscription for sidebar
  const { user, isAdmin, loading: authLoading } = useAuth();

  // State
  const [links, setLinks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagCounts, setTagCounts] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeView, setActiveView] = useState('all'); // all, starred, archived
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState(null);
  const [showShareFolderModal, setShowShareFolderModal] = useState(false);
  const [folderToShare, setFolderToShare] = useState(null);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showBulkFolderModal, setShowBulkFolderModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [shareLink, setShareLinkState] = useState(null); // Link being shared

  // Add Link Form
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkTags, setNewLinkTags] = useState('');
  const [addLinkLoading, setAddLinkLoading] = useState(false);
  const [addLinkError, setAddLinkError] = useState(null);

  // UI State
  const [tagSearch, setTagSearch] = useState('');
  const [folderCounts, setFolderCounts] = useState({});
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [sharedLinksCount, setSharedLinksCount] = useState(0);
  const [personalSharedCount, setPersonalSharedCount] = useState(0);
  const [canvasSharedCount, setCanvasSharedCount] = useState(0);
  const [sharedSectionExpanded, setSharedSectionExpanded] = useState(true);
  const [sharedFolders, setSharedFolders] = useState([]); // Folders shared with user
  const [sharedFoldersExpanded, setSharedFoldersExpanded] = useState(true);
  const [activeSharedFolder, setActiveSharedFolder] = useState(null); // For viewing links in shared folders
  const [showAddLinkTray, setShowAddLinkTray] = useState(false);
  const [shortlinkLink, setShortlinkLink] = useState(null); // Link to create shortlink for
  const [showQuickShortlink, setShowQuickShortlink] = useState(false); // Quick shortlink tray (no link selected)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [_mobileTagDropdown, _setMobileTagDropdown] = useState(false); // TODO: Implement mobile tag dropdown

  // Pagination
  const [_lastDoc, setLastDoc] = useState(null); // TODO: Implement pagination
  const [hasMore, setHasMore] = useState(false);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Ensure default system folders exist (Inbox) and cleanup any duplicates
      await ensureDefaultFolders(user.uid);
      await cleanupDuplicateSystemFolders(user.uid);

      // Backfill sharing data for existing shares
      await backfillSharedWithEmails(user.uid);      // Enables email-based querying
      await backfillCanvasShareNames(user.uid);      // Adds canvas names to tooltips

      // Handle shared views differently - fetch links shared with user or canvases
      if (activeView === 'shared-personal' || activeView === 'shared-canvas') {
        const isPersonal = activeView === 'shared-personal';

        // Always get user's canvas IDs for counts (needed for both views)
        const capsulesRef = collection(db, 'capsules');
        const ownedQuery = query(capsulesRef, where('ownerId', '==', user.uid), limit(100));
        const ownedSnap = await getDocs(ownedQuery);
        const canvasIds = ownedSnap.docs.map(doc => doc.id);

        const [sharedLinksResult, personalCountResult, canvasCountResult, foldersResult, sharedFoldersResult, tagsResult, tagCountsResult, folderCountsResult, statsResult] = await Promise.all([
          isPersonal
            ? getAllSharedWithMeLinks(user.uid, user.email, { pageSize: 50 })
            : getCanvasSharedLinks(canvasIds, { pageSize: 50 }),
          getAllSharedWithMeLinks(user.uid, user.email, { pageSize: 100 }),
          canvasIds.length > 0 ? getCanvasSharedLinks(canvasIds, { pageSize: 100 }) : Promise.resolve({ links: [] }),
          getFolders(user.uid),
          getAllSharedFolders(user.uid, user.email), // Folders shared with this user
          getUserTags(user.uid),
          getTagCounts(user.uid),
          getFolderCounts(user.uid),
          getReadingStats(user.uid)
        ]);

        setLinks(sharedLinksResult.links);
        setLastDoc(null);
        setHasMore(false);
        setPersonalSharedCount(personalCountResult.links.length);
        setCanvasSharedCount(canvasCountResult.links.length);
        setSharedLinksCount(personalCountResult.links.length + canvasCountResult.links.length);
        setFolders(foldersResult);
        setSharedFolders(sharedFoldersResult);
        setTags(tagsResult);
        setTagCounts(tagCountsResult);
        setFolderCounts(folderCountsResult);
        setStats(statsResult);
        return;
      }

      // Handle shared folder view - show links in a folder shared with this user
      if (activeView === 'shared-folder' && activeSharedFolder) {
        const ownerId = activeSharedFolder.userId; // The folder owner's ID
        const sharedFolderId = activeSharedFolder.id;

        // Get user's canvas IDs for counts
        const capsulesRef = collection(db, 'capsules');
        const ownedQuery = query(capsulesRef, where('ownerId', '==', user.uid), limit(100));
        const ownedSnap = await getDocs(ownedQuery);
        const canvasIds = ownedSnap.docs.map(doc => doc.id);

        // Fetch links from the folder owner, filtered to this specific folder
        const [ownerLinksResult, personalCountResult, canvasCountResult, foldersResult, sharedFoldersResult, tagsResult, tagCountsResult, folderCountsResult, statsResult] = await Promise.all([
          getLinks(ownerId, { folderId: sharedFolderId, pageSize: 100 }), // Get links from owner's folder
          getAllSharedWithMeLinks(user.uid, user.email, { pageSize: 100 }),
          canvasIds.length > 0 ? getCanvasSharedLinks(canvasIds, { pageSize: 100 }) : Promise.resolve({ links: [] }),
          getFolders(user.uid),
          getAllSharedFolders(user.uid, user.email),
          getUserTags(user.uid),
          getTagCounts(user.uid),
          getFolderCounts(user.uid),
          getReadingStats(user.uid)
        ]);

        setLinks(ownerLinksResult.links);
        setLastDoc(null);
        setHasMore(false);
        setPersonalSharedCount(personalCountResult.links.length);
        setCanvasSharedCount(canvasCountResult.links.length);
        setSharedLinksCount(personalCountResult.links.length + canvasCountResult.links.length);
        setFolders(foldersResult);
        setSharedFolders(sharedFoldersResult);
        setTags(tagsResult);
        setTagCounts(tagCountsResult);
        setFolderCounts(folderCountsResult);
        setStats(statsResult);
        return;
      }

      // Build query options for normal views
      const options = {
        archived: activeView === 'archived',
        starred: activeView === 'starred' ? true : null,
        folderId: activeFolder,
        tag: activeTag,
        pageSize: 50
      };

      // Get user's canvas IDs for canvas shared links count
      const capsulesRef = collection(db, 'capsules');
      const ownedQuery = query(capsulesRef, where('ownerId', '==', user.uid), limit(100));
      const ownedSnap = await getDocs(ownedQuery);
      const canvasIds = ownedSnap.docs.map(doc => doc.id);

      const [linksResult, personalCountResult, canvasCountResult, foldersResult, sharedFoldersResult, tagsResult, tagCountsResult, folderCountsResult, statsResult] = await Promise.all([
        getLinks(user.uid, options),
        getAllSharedWithMeLinks(user.uid, user.email, { pageSize: 100 }), // Personal shared count (by ID and email)
        canvasIds.length > 0 ? getCanvasSharedLinks(canvasIds, { pageSize: 100 }) : Promise.resolve({ links: [] }), // Canvas shared count
        getFolders(user.uid),
        getAllSharedFolders(user.uid, user.email), // Folders shared with this user
        getUserTags(user.uid),
        getTagCounts(user.uid),
        getFolderCounts(user.uid),
        getReadingStats(user.uid)
      ]);

      setLinks(linksResult.links);
      setLastDoc(linksResult.lastDoc);
      setHasMore(linksResult.hasMore);
      setPersonalSharedCount(personalCountResult.links.length);
      setCanvasSharedCount(canvasCountResult.links.length);
      setSharedLinksCount(personalCountResult.links.length + canvasCountResult.links.length);

      // Debug: Log sharing data for all links
      const sharedLinks = linksResult.links.filter(l => l.sharedWith?.length > 0 || l.sharedWithUserIds?.length > 0);
      if (sharedLinks.length > 0) {
        console.log('[LinkArchiver] Links with sharing data:', sharedLinks.map(l => ({
          id: l.id,
          title: l.title,
          sharedWith: l.sharedWith,
          sharedWithUserIds: l.sharedWithUserIds,
          sharedWithCanvasIds: l.sharedWithCanvasIds
        })));
      }
      setFolders(foldersResult);
      setSharedFolders(sharedFoldersResult);
      setTags(tagsResult);
      setTagCounts(tagCountsResult);
      setFolderCounts(folderCountsResult);
      setStats(statsResult);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, activeView, activeFolder, activeTag, activeSharedFolder]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/unity-notes');
    }
  }, [authLoading, isAdmin, navigate]);

  // Handlers
  const handleStar = async (link) => {
    try {
      await toggleStar(link.id, !link.starred);
      setLinks(prev => prev.map(l =>
        l.id === link.id ? { ...l, starred: !l.starred } : l
      ));
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  const handleArchive = async (link) => {
    try {
      await archiveLink(link.id, !link.archived);
      setLinks(prev => prev.filter(l => l.id !== link.id));
    } catch (err) {
      console.error('Error archiving:', err);
    }
  };

  const handleRead = (link) => {
    navigate(`/links/read/${link.id}`);
  };

  const handleDelete = async (link) => {
    if (!window.confirm(`Delete "${link.title}"?`)) return;

    try {
      await deleteLink(link.id);
      setLinks(prev => prev.filter(l => l.id !== link.id));
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  // Add new link manually
  const handleAddLink = async () => {
    if (!newLinkUrl.trim()) {
      setAddLinkError('Please enter a URL');
      return;
    }

    setAddLinkLoading(true);
    setAddLinkError(null);

    try {
      const response = await fetch('https://us-central1-yellowcircle-app.cloudfunctions.net/linkArchiverSaveLink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          url: newLinkUrl.trim(),
          title: newLinkTitle.trim() || undefined,
          tags: newLinkTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
          folderId: activeFolder || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save link');
      }

      // Reset form and close modal
      setNewLinkUrl('');
      setNewLinkTitle('');
      setNewLinkTags('');
      setShowAddLinkModal(false);

      // Reload data
      loadData();
    } catch (err) {
      console.error('Error adding link:', err);
      setAddLinkError(err.message || 'Failed to add link');
    } finally {
      setAddLinkLoading(false);
    }
  };

  // Quick save link from tray
  const handleQuickSave = async (url, tagArray) => {
    const response = await fetch('https://us-central1-yellowcircle-app.cloudfunctions.net/linkArchiverSaveLink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await user.getIdToken()}`
      },
      body: JSON.stringify({
        url: url,
        tags: tagArray,
        folderId: activeFolder || null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save link');
    }

    // Reload data
    loadData();
  };

  const handleImport = async (pocketLinks) => {
    return await importFromPocket(user.uid, pocketLinks);
  };

  const handleAddFolder = async (folderData) => {
    try {
      const newFolder = await createFolder(user.uid, folderData);
      setFolders(prev => [...prev, newFolder]);
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  const handleEditFolder = (folder) => {
    setFolderToEdit(folder);
    setShowEditFolderModal(true);
  };

  const handleShareFolder = (folder) => {
    setFolderToShare(folder);
    setShowShareFolderModal(true);
  };

  const handleSaveFolder = async (folderId, updates) => {
    try {
      await updateFolder(folderId, updates);
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, ...updates } : f));
    } catch (err) {
      console.error('Error updating folder:', err);
    }
  };

  const handleReorderFolders = async (orderedIds) => {
    try {
      // Optimistic update - update local state immediately
      setFolders(prev => {
        const updated = [...prev];
        orderedIds.forEach((id, index) => {
          const folder = updated.find(f => f.id === id);
          if (folder) folder.order = index;
        });
        return updated;
      });
      // Persist to Firestore
      await _reorderFolders(user.uid, orderedIds);
    } catch (err) {
      console.error('Error reordering folders:', err);
      // Reload data on error to restore correct state
      loadData();
    }
  };

  const handleBulkMoveByTag = async (tag, targetFolderId) => {
    return await moveTaggedLinksToFolder(user.uid, tag, targetFolderId);
  };

  const handleUpdateLink = async (linkId, updates) => {
    try {
      await updateLink(linkId, updates);
      setLinks(prev => prev.map(l =>
        l.id === linkId ? { ...l, ...updates } : l
      ));
      if (selectedLink?.id === linkId) {
        setSelectedLink(prev => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.error('Error updating link:', err);
    }
  };

  // Filter links by search and smart views (includes full-text content search)
  // Memoized to prevent recalculation on every render (important for 7000+ links)
  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      // Smart view filters (applied before search)
      if (activeView === 'unread') {
        // Unread = readProgress is 0, null, or undefined
        if (link.readProgress && link.readProgress > 0) return false;
      } else if (activeView === 'recent') {
        // Recent = saved in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const savedAt = link.savedAt?.toDate ? link.savedAt.toDate() : new Date(link.savedAt);
        if (savedAt < sevenDaysAgo) return false;
      } else if (activeView === 'hasComments') {
        // Has comments = commentCount > 0
        if (!link.commentCount || link.commentCount === 0) return false;
      }

      // Search filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        link.title?.toLowerCase().includes(query) ||
        link.domain?.toLowerCase().includes(query) ||
        link.excerpt?.toLowerCase().includes(query) ||
        link.content?.toLowerCase().includes(query) ||
        link.aiSummary?.toLowerCase().includes(query) ||
        link.tags?.some(t => t.toLowerCase().includes(query))
      );
    });
  }, [links, activeView, searchQuery]);

  // Calculate smart view counts
  const smartViewCounts = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return {
      unread: links.filter(l => !l.readProgress || l.readProgress === 0).length,
      recent: links.filter(l => {
        const savedAt = l.savedAt?.toDate ? l.savedAt.toDate() : new Date(l.savedAt);
        return savedAt >= sevenDaysAgo;
      }).length,
      hasComments: links.filter(l => l.commentCount && l.commentCount > 0).length
    };
  }, [links]);

  // Toggle folder expand/collapse
  const handleToggleFolderExpand = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Handle folder selection
  const handleSelectFolder = (folderId) => {
    setActiveFolder(folderId);
    setActiveSharedFolder(null); // Clear shared folder when selecting own folder
    setActiveView('all');
    setActiveTag(null);
  };

  // Handle shared folder selection (folders shared with this user)
  const handleSelectSharedFolder = (folder) => {
    setActiveSharedFolder(folder);
    setActiveFolder(folder.id); // Use same activeFolder for highlighting
    setActiveView('shared-folder'); // New view type for shared folders
    setActiveTag(null);
  };

  // Handle folder deletion
  const handleDeleteFolder = async (folderId) => {
    try {
      await deleteFolder(folderId);
      // If we were viewing this folder, reset to all links
      if (activeFolder === folderId) {
        setActiveFolder(null);
        setActiveView('all');
      }
      // Reload data to refresh folder list and counts
      loadData();
    } catch (err) {
      console.error('Error deleting folder:', err);
      alert(err.message || 'Failed to delete folder');
    }
  };

  // Layout callbacks
  const handleHomeClick = () => navigate('/');

  if (authLoading || loading) {
    return (
      <Layout
        hideParallaxCircle={true}
        hideCircleNav={true}
        sidebarVariant="standard"
        allowScroll={true}
        pageLabel="LINKS"
        navigationItems={navigationItems}
        onHomeClick={handleHomeClick}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: COLORS.white,
          paddingTop: '80px',
          paddingLeft: '100px'
        }}>
          <div style={{
            textAlign: 'center'
          }}>
            <RefreshCw size={40} color={COLORS.primary} className="animate-spin" />
            <p style={{ marginTop: '16px', color: COLORS.textMuted }}>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      hideParallaxCircle={true}
      hideCircleNav={true}
      sidebarVariant="standard"
      allowScroll={true}
      pageLabel="LINKS"
      navigationItems={navigationItems}
      onHomeClick={handleHomeClick}
    >
      {/* Mobile-responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .links-header-buttons {
            flex-wrap: nowrap !important;
            overflow-x: auto;
            gap: 6px !important;
          }
          .links-header-buttons .btn-label {
            display: none;
          }
          .links-header-buttons button {
            padding: 8px !important;
            min-width: auto !important;
            flex-shrink: 0;
          }
          .links-main-content {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .links-sidebar {
            display: none !important; /* Hidden on mobile - using mobile views bar instead */
          }
          .links-container {
            padding: 70px 12px 12px 90px !important; /* top right bottom left - clear header and sidebar */
          }
          .links-list-header {
            padding: 12px !important;
            gap: 10px !important;
          }
        }
        @media (max-width: 480px) {
          .links-header {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .links-header-buttons {
            width: 100%;
            justify-content: space-between !important;
          }
          .links-header-buttons button {
            padding: 6px !important;
            font-size: 12px !important;
          }
          .links-container {
            padding: 70px 8px 8px 90px !important; /* top right bottom left - clear header and sidebar */
          }
        }
      `}</style>
      <div style={styles.container} className="links-container">
        <div style={styles.innerContainer}>
        {/* Header */}
        <div style={styles.header} className="links-header">
          <h1 style={styles.title}>
            <Bookmark size={32} color={COLORS.primary} />
            Link Saver
          </h1>
          <div
            className="links-header-buttons"
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'flex-end'
            }}
          >
            <button
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...(user ? {} : {
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }),
                ...(showAddLinkTray && user ? {
                  backgroundColor: '#d97706',
                  borderColor: '#d97706'
                } : {})
              }}
              onClick={() => user && setShowAddLinkTray(!showAddLinkTray)}
              disabled={!user}
              title={user ? (showAddLinkTray ? 'Close' : 'Add a new link') : 'Sign in to add links'}
            >
              <Plus size={16} /><span className="btn-label"> Add Link</span>
            </button>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => setShowImportModal(true)}
              title="Import links"
            >
              <Upload size={16} /><span className="btn-label"> Import</span>
            </button>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => setShowBulkFolderModal(true)}
              title="Move links by tag to folders"
            >
              <Folder size={16} /><span className="btn-label"> Organize</span>
            </button>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => window.open('/links/extension', '_blank')}
              title="Get browser extension"
            >
              <Download size={16} /><span className="btn-label"> Get Extension</span>
            </button>
            <button
              style={{
                ...styles.button,
                backgroundColor: showQuickShortlink ? '#7c3aed' : '#8B5CF6',
                borderColor: showQuickShortlink ? '#7c3aed' : '#8B5CF6',
                color: '#fff'
              }}
              onClick={() => setShowQuickShortlink(!showQuickShortlink)}
              title={showQuickShortlink ? 'Close' : 'Create a shortlink'}
            >
              <ExternalLink size={16} /><span className="btn-label"> Shortlink</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div style={styles.statsRow}>
            <StatCard icon={Link2} value={stats.totalLinks} label="Total Links" color={COLORS.info} />
            <StatCard icon={BookOpen} value={stats.readLinks} label="Read" color={COLORS.success} />
            <StatCard icon={Clock} value={stats.unreadLinks} label="Unread" color={COLORS.warning} />
            <StatCard icon={Star} value={stats.starred} label="Starred" color="#f59e0b" />
            <StatCard icon={Archive} value={stats.archived} label="Archived" color={COLORS.textMuted} />
            <StatCard icon={CalendarDays} value={smartViewCounts.recent} label="This Week" color={COLORS.success} />
          </div>
        )}

        {/* Mobile Views/Tags Bar - Compact sticky bar for mobile */}
        {isMobile && (
          <div
            className="mobile-views-bar"
            style={{
              position: 'sticky',
              top: '60px',
              zIndex: 50,
              backgroundColor: COLORS.white,
              borderRadius: '12px',
              border: `1px solid ${COLORS.border}`,
              padding: '8px 12px',
              marginBottom: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            {/* Views Row */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {[
                { id: 'all', label: 'All', icon: Link2 },
                { id: 'starred', label: 'Starred', icon: Star },
                { id: 'archived', label: 'Archive', icon: Archive },
                { id: 'shared-personal', label: 'Shared', icon: Share2 },
                { id: 'unread', label: 'Unread', icon: Eye },
                { id: 'recent', label: 'Recent', icon: CalendarDays }
              ].map(view => (
                <button
                  key={view.id}
                  onClick={() => {
                    setActiveView(view.id);
                    setActiveFolder(null);
                    setActiveTag(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: activeView === view.id && !activeFolder && !activeTag ? '600' : '400',
                    backgroundColor: activeView === view.id && !activeFolder && !activeTag ? COLORS.primary : COLORS.cardBg,
                    color: COLORS.text,
                    cursor: 'pointer'
                  }}
                >
                  <view.icon size={14} />
                  {view.label}
                </button>
              ))}
            </div>

            {/* Folders + Tags Row */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Folders Dropdown */}
              <div style={{ position: 'relative', flex: 1 }}>
                <select
                  value={activeFolder || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      setActiveFolder(val);
                      setActiveView('all');
                      setActiveTag(null);
                    } else {
                      setActiveFolder(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${activeFolder ? COLORS.primary : COLORS.border}`,
                    fontSize: '12px',
                    backgroundColor: activeFolder ? 'rgba(251, 191, 36, 0.15)' : COLORS.white,
                    color: COLORS.text,
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center'
                  }}
                >
                  <option value="">📁 All Folders</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name} ({folderCounts[folder.id] || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags Dropdown */}
              <div style={{ position: 'relative', flex: 1 }}>
                <select
                  value={activeTag || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      setActiveTag(val);
                      setActiveView('all');
                      setActiveFolder(null);
                    } else {
                      setActiveTag(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${activeTag ? '#8B5CF6' : COLORS.border}`,
                    fontSize: '12px',
                    backgroundColor: activeTag ? 'rgba(139, 92, 246, 0.15)' : COLORS.white,
                    color: COLORS.text,
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center'
                  }}
                >
                  <option value="">🏷️ All Tags</option>
                  {tags.slice(0, 30).map(tag => (
                    <option key={tag} value={tag}>
                      {tag} ({tagCounts[tag] || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filter Indicator */}
            {(activeFolder || activeTag) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '8px',
                padding: '4px 8px',
                backgroundColor: COLORS.cardBg,
                borderRadius: '4px',
                fontSize: '11px',
                color: COLORS.textMuted
              }}>
                <span>Filtering:</span>
                {activeFolder && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    backgroundColor: 'rgba(251, 191, 36, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    color: COLORS.text
                  }}>
                    <Folder size={10} />
                    {folders.find(f => f.id === activeFolder)?.name || 'Folder'}
                    <button
                      onClick={() => setActiveFolder(null)}
                      style={{ background: 'none', border: 'none', padding: '0 0 0 2px', cursor: 'pointer', display: 'flex' }}
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
                {activeTag && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    color: COLORS.text
                  }}>
                    <Tag size={10} />
                    {activeTag}
                    <button
                      onClick={() => setActiveTag(null)}
                      style={{ background: 'none', border: 'none', padding: '0 0 0 2px', cursor: 'pointer', display: 'flex' }}
                    >
                      <X size={10} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div style={styles.mainContent} className="links-main-content">
          {/* Sidebar */}
          <div style={styles.sidebar} className="links-sidebar">
            {/* Views */}
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarTitle}>Views</div>
              {[
                { id: 'all', label: 'All Links', icon: Link2, count: stats ? stats.totalLinks - stats.archived : 0 },
                { id: 'starred', label: 'Starred', icon: Star, count: stats?.starred || 0 },
                { id: 'archived', label: 'Archive', icon: Archive, count: stats?.archived || 0 }
              ].map(view => (
                <div
                  key={view.id}
                  style={{
                    ...styles.sidebarItem,
                    ...(activeView === view.id && !activeFolder && !activeTag ? styles.sidebarItemActive : {})
                  }}
                  onClick={() => {
                    setActiveView(view.id);
                    setActiveFolder(null);
                    setActiveTag(null);
                    setActiveSharedFolder(null);
                  }}
                >
                  <view.icon size={18} />
                  <span style={{ flex: 1 }}>{view.label}</span>
                  <span style={{
                    fontSize: '11px',
                    color: activeView === view.id && !activeFolder && !activeTag ? COLORS.text : COLORS.textMuted,
                    backgroundColor: activeView === view.id && !activeFolder && !activeTag ? 'rgba(0,0,0,0.1)' : COLORS.cardBg,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    minWidth: '24px',
                    textAlign: 'center'
                  }}>
                    {view.count}
                  </span>
                </div>
              ))}

              {/* Shared Section with Subfolders */}
              <div>
                {/* Shared Header - expandable */}
                <div
                  style={{
                    ...styles.sidebarItem,
                    ...(sharedLinksCount > 0 ? { backgroundColor: 'rgba(59, 130, 246, 0.08)' } : {})
                  }}
                  onClick={() => setSharedSectionExpanded(!sharedSectionExpanded)}
                >
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: COLORS.textMuted
                    }}
                  >
                    {sharedSectionExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <Share2 size={18} color={sharedLinksCount > 0 ? COLORS.info : undefined} />
                  <span style={{ flex: 1 }}>Shared</span>
                  <span style={{
                    fontSize: '11px',
                    color: sharedLinksCount > 0 ? COLORS.info : COLORS.textMuted,
                    backgroundColor: sharedLinksCount > 0 ? 'rgba(59, 130, 246, 0.15)' : COLORS.cardBg,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    minWidth: '24px',
                    textAlign: 'center',
                    fontWeight: sharedLinksCount > 0 ? '600' : 'normal'
                  }}>
                    {sharedLinksCount}
                  </span>
                </div>

                {/* Shared Subfolders */}
                {sharedSectionExpanded && (
                  <div>
                    {/* Personal - links shared directly with user */}
                    <div
                      style={{
                        ...styles.sidebarItem,
                        paddingLeft: '36px',
                        ...(activeView === 'shared-personal' ? styles.sidebarItemActive : {})
                      }}
                      onClick={() => {
                        setActiveView('shared-personal');
                        setActiveFolder(null);
                        setActiveTag(null);
                        setActiveSharedFolder(null);
                      }}
                    >
                      <Users size={16} />
                      <span style={{ flex: 1, fontSize: '13px' }}>Personal</span>
                      <span style={{
                        fontSize: '10px',
                        color: activeView === 'shared-personal' ? COLORS.text : COLORS.textMuted,
                        backgroundColor: activeView === 'shared-personal' ? 'rgba(0,0,0,0.1)' : COLORS.cardBg,
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        {personalSharedCount}
                      </span>
                    </div>

                    {/* Canvas - links shared to canvases */}
                    <div
                      style={{
                        ...styles.sidebarItem,
                        paddingLeft: '36px',
                        ...(activeView === 'shared-canvas' ? styles.sidebarItemActive : {})
                      }}
                      onClick={() => {
                        setActiveView('shared-canvas');
                        setActiveFolder(null);
                        setActiveTag(null);
                        setActiveSharedFolder(null);
                      }}
                    >
                      <LayoutIcon size={16} />
                      <span style={{ flex: 1, fontSize: '13px' }}>Canvas</span>
                      <span style={{
                        fontSize: '10px',
                        color: activeView === 'shared-canvas' ? COLORS.text : COLORS.textMuted,
                        backgroundColor: activeView === 'shared-canvas' ? 'rgba(0,0,0,0.1)' : COLORS.cardBg,
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        {canvasSharedCount}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Views - Dynamic Filters */}
            <div style={styles.sidebarSection}>
              <div style={{ ...styles.sidebarTitle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} />
                Smart Views
              </div>
              {[
                { id: 'unread', label: 'Unread', icon: Eye, count: smartViewCounts.unread },
                { id: 'recent', label: 'This Week', icon: CalendarDays, count: smartViewCounts.recent },
                { id: 'hasComments', label: 'Has Comments', icon: MessageCircle, count: smartViewCounts.hasComments }
              ].map(view => (
                <div
                  key={view.id}
                  style={{
                    ...styles.sidebarItem,
                    ...(activeView === view.id ? styles.sidebarItemActive : {})
                  }}
                  onClick={() => {
                    setActiveView(view.id);
                    setActiveFolder(null);
                    setActiveTag(null);
                    setActiveSharedFolder(null);
                  }}
                >
                  <view.icon size={18} />
                  <span style={{ flex: 1 }}>{view.label}</span>
                  <span style={{
                    fontSize: '11px',
                    color: activeView === view.id ? COLORS.text : COLORS.textMuted,
                    backgroundColor: activeView === view.id ? 'rgba(0,0,0,0.1)' : COLORS.cardBg,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    minWidth: '24px',
                    textAlign: 'center'
                  }}>
                    {view.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Folders - Nested Tree View */}
            <div style={styles.sidebarSection}>
              <div style={{ ...styles.sidebarTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FolderTree size={14} />
                  Folders
                </span>
                <button
                  style={{ ...styles.actionButton, padding: '2px' }}
                  onClick={() => setShowFolderModal(true)}
                  title="New folder"
                >
                  <Plus size={16} />
                </button>
              </div>
              <FolderTreeComponent
                folders={folders}
                activeFolder={activeFolder}
                onSelectFolder={handleSelectFolder}
                folderCounts={folderCounts}
                expandedFolders={expandedFolders}
                onToggleExpand={handleToggleFolderExpand}
                onDeleteFolder={handleDeleteFolder}
                onEditFolder={handleEditFolder}
                onShareFolder={handleShareFolder}
                onReorderFolders={handleReorderFolders}
              />
              {folders.length === 0 && (
                <p style={{ fontSize: '13px', color: COLORS.textLight, padding: '8px 12px' }}>
                  No folders yet
                </p>
              )}
            </div>

            {/* Shared Folders - Folders shared with this user */}
            {sharedFolders.length > 0 && (
              <div style={styles.sidebarSection}>
                <div
                  style={{
                    ...styles.sidebarTitle,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSharedFoldersExpanded(!sharedFoldersExpanded)}
                >
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: COLORS.textMuted
                    }}
                  >
                    {sharedFoldersExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <Users size={14} color={COLORS.info} />
                  <span style={{ flex: 1 }}>Shared Folders</span>
                  <span style={{
                    fontSize: '11px',
                    color: COLORS.info,
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {sharedFolders.length}
                  </span>
                </div>
                {sharedFoldersExpanded && (
                  <div style={{ marginTop: '4px' }}>
                    {sharedFolders.map(folder => (
                      <div
                        key={folder.id}
                        style={{
                          ...styles.sidebarItem,
                          paddingLeft: '24px',
                          ...(activeFolder === folder.id ? styles.sidebarItemActive : {})
                        }}
                        onClick={() => handleSelectSharedFolder(folder)}
                        title={`Shared by: ${folder.ownerEmail || 'Unknown'}`}
                      >
                        <Folder
                          size={16}
                          color={folder.color || COLORS.textMuted}
                          fill={activeFolder === folder.id ? (folder.color || COLORS.primary) : 'none'}
                        />
                        <span style={{
                          flex: 1,
                          fontSize: '13px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {folder.name}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          color: COLORS.textMuted,
                          backgroundColor: COLORS.cardBg,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <Users size={10} />
                          <span style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {folder.ownerEmail?.split('@')[0] || 'Shared'}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tags - Searchable */}
            <div style={styles.sidebarSection}>
              <div style={{ ...styles.sidebarTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Tags</span>
                <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
                  {tags.length}
                </span>
              </div>
              {/* Tag Search Input */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: COLORS.cardBg,
                borderRadius: '6px',
                padding: '6px 10px',
                marginBottom: '8px'
              }}>
                <Search size={14} color={COLORS.textMuted} />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '12px',
                    outline: 'none',
                    flex: 1,
                    color: COLORS.text
                  }}
                />
                {tagSearch && (
                  <button
                    onClick={() => setTagSearch('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex'
                    }}
                  >
                    <X size={12} color={COLORS.textMuted} />
                  </button>
                )}
              </div>
              {/* Filtered Tags List */}
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {tags
                  .filter(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()))
                  .slice(0, tagSearch ? 50 : 15)
                  .map(tag => (
                    <div
                      key={tag}
                      style={{
                        ...styles.sidebarItem,
                        padding: '8px 10px',
                        ...(activeTag === tag ? styles.sidebarItemActive : {})
                      }}
                      onClick={() => {
                        setActiveTag(tag);
                        setActiveView('all');
                        setActiveFolder(null);
                        setActiveSharedFolder(null);
                      }}
                    >
                      <Tag size={14} />
                      <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tag}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        color: activeTag === tag ? COLORS.text : COLORS.textMuted,
                        backgroundColor: activeTag === tag ? 'rgba(0,0,0,0.1)' : COLORS.cardBg,
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        {tagCounts[tag] || 0}
                      </span>
                    </div>
                  ))}
                {tagSearch && tags.filter(tag => tag.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                  <p style={{ fontSize: '12px', color: COLORS.textLight, padding: '8px 10px' }}>
                    No tags match "{tagSearch}"
                  </p>
                )}
                {!tagSearch && tags.length > 15 && (
                  <p style={{ fontSize: '11px', color: COLORS.textMuted, padding: '6px 10px', textAlign: 'center' }}>
                    Type to search {tags.length - 15} more tags...
                  </p>
                )}
              </div>
              {tags.length === 0 && (
                <p style={{ fontSize: '13px', color: COLORS.textLight, padding: '8px 12px' }}>
                  No tags yet
                </p>
              )}
            </div>
          </div>

          {/* Links List */}
          <div style={styles.linksList}>
            <div style={styles.linksHeader} className="links-list-header">
              <div style={styles.searchBox}>
                <Search size={18} color={COLORS.textMuted} />
                <input
                  style={styles.searchInput}
                  placeholder="Search links..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    style={{ ...styles.actionButton, padding: '2px' }}
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                style={{ ...styles.actionButton }}
                onClick={loadData}
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {error && (
              <div style={{
                padding: '16px 20px',
                backgroundColor: '#fee2e2',
                color: COLORS.danger,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {filteredLinks.length === 0 ? (
              <div style={styles.emptyState}>
                <Bookmark size={48} color={COLORS.textLight} />
                <h3 style={{ marginTop: '16px', marginBottom: '8px', color: COLORS.text }}>
                  No links found
                </h3>
                <p style={{ fontSize: '14px' }}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Save links using the browser extension or import from Pocket'}
                </p>
              </div>
            ) : (
              filteredLinks.map(link => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onStar={handleStar}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onClick={setSelectedLink}
                  onShare={setShareLinkState}
                  onRead={handleRead}
                  onShortlink={setShortlinkLink}
                />
              ))
            )}

            {hasMore && (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <button
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onClick={() => {/* TODO: Load more */}}
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Modals */}
      <AddLinkModal
        isOpen={showAddLinkModal}
        onClose={() => {
          setShowAddLinkModal(false);
          setAddLinkError(null);
        }}
        url={newLinkUrl}
        setUrl={setNewLinkUrl}
        title={newLinkTitle}
        setTitle={setNewLinkTitle}
        tags={newLinkTags}
        setTags={setNewLinkTags}
        loading={addLinkLoading}
        error={addLinkError}
        onSubmit={handleAddLink}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      <AddFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onAdd={handleAddFolder}
      />

      <EditFolderModal
        isOpen={showEditFolderModal}
        onClose={() => {
          setShowEditFolderModal(false);
          setFolderToEdit(null);
        }}
        onSave={handleSaveFolder}
        folder={folderToEdit}
      />

      <BulkFolderModal
        isOpen={showBulkFolderModal}
        onClose={() => setShowBulkFolderModal(false)}
        folders={folders}
        tags={tags}
        onMoveTags={handleBulkMoveByTag}
        onRefresh={loadData}
      />

      <LinkDetailModal
        link={selectedLink}
        isOpen={!!selectedLink}
        onClose={() => setSelectedLink(null)}
        onUpdate={handleUpdateLink}
        onRead={handleRead}
      />

      <ShareLinkModal
        link={shareLink}
        isOpen={!!shareLink}
        onClose={() => setShareLinkState(null)}
        user={user}
        onShareComplete={loadData}
      />

      <ShareFolderModal
        folder={folderToShare}
        isOpen={showShareFolderModal}
        onClose={() => {
          setShowShareFolderModal(false);
          setFolderToShare(null);
        }}
        user={user}
        onShareComplete={loadData}
      />

      {/* Add Link Tray - Slideout for fast link saving */}
      <AddLinkTray
        isOpen={showAddLinkTray}
        onClose={() => setShowAddLinkTray(false)}
        onSave={handleQuickSave}
      />

      {/* Shortlink Tray - Create shortlinks for saved links */}
      <ShortlinkTray
        isOpen={!!shortlinkLink}
        onClose={() => setShortlinkLink(null)}
        link={shortlinkLink}
        onSuccess={() => {
          // Could show a toast notification here
        }}
      />

      {/* Quick Shortlink Tray - Create shortlinks for any URL */}
      <QuickShortlinkTray
        isOpen={showQuickShortlink}
        onClose={() => setShowQuickShortlink(false)}
      />
    </Layout>
  );
};

export default LinkArchiverPage;
