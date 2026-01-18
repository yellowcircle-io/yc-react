/**
 * Link Archiver Admin Page (Pocket Alternative)
 *
 * Admin interface to view and manage saved links with tagging,
 * folders, reading progress, and AI summarization.
 *
 * Part of yellowCircle Unity ecosystem.
 *
 * @created 2026-01-17
 * @author Sleepless Agent
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/global/Layout';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { adminNavigationItems } from '../../config/adminNavigationItems';
import {
  getLinks,
  getFolders,
  createFolder,
  updateLink,
  deleteLink,
  toggleStar,
  archiveLink,
  getUserTags,
  getTagCounts,
  getReadingStats,
  importFromPocket
} from '../../utils/firestoreLinks';
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
  AlertCircle
} from 'lucide-react';

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
    padding: '100px 40px 40px 120px'
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
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: COLORS.white,
    border: `2px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: COLORS.text
  },
  statLabel: {
    fontSize: '12px',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
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
    gap: '16px',
    padding: '16px 20px',
    borderBottom: `1px solid ${COLORS.border}`,
    transition: 'background-color 0.15s ease',
    cursor: 'pointer'
  },
  linkThumbnail: {
    width: '80px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
    backgroundColor: COLORS.cardBg,
    flexShrink: 0
  },
  linkContent: {
    flex: '1',
    minWidth: 0
  },
  linkTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  linkDomain: {
    fontSize: '12px',
    color: COLORS.textMuted,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px'
  },
  linkExcerpt: {
    fontSize: '13px',
    color: COLORS.textLight,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  linkMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '8px'
  },
  linkTag: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: COLORS.cardBg,
    color: COLORS.textMuted
  },
  linkActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px'
  },
  actionButton: {
    padding: '6px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: COLORS.textMuted,
    transition: 'all 0.15s ease'
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: '16px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.border}`,
    fontSize: '14px',
    marginBottom: '12px',
    outline: 'none'
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
    minHeight: '100px'
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
// Link Card Component
// ============================================================
const LinkCard = ({ link, onStar, onArchive, onDelete, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

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
      {link.image ? (
        <img src={link.image} alt="" style={styles.linkThumbnail} />
      ) : (
        <div style={{
          ...styles.linkThumbnail,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Globe size={24} color={COLORS.textLight} />
        </div>
      )}

      <div style={styles.linkContent}>
        <div style={styles.linkTitle}>{link.title}</div>
        <div style={styles.linkDomain}>
          {link.favicon && (
            <img src={link.favicon} alt="" style={{ width: 14, height: 14 }} />
          )}
          {link.domain}
          {link.estimatedReadTime > 0 && (
            <>
              <span style={{ color: COLORS.textLight }}>•</span>
              <Clock size={12} />
              {Math.ceil(link.estimatedReadTime / 60)} min read
            </>
          )}
        </div>
        {link.excerpt && (
          <div style={styles.linkExcerpt}>{link.excerpt}</div>
        )}
        <div style={styles.linkMeta}>
          {link.tags?.slice(0, 3).map(tag => (
            <span key={tag} style={styles.linkTag}>{tag}</span>
          ))}
          {link.tags?.length > 3 && (
            <span style={{ fontSize: '11px', color: COLORS.textLight }}>
              +{link.tags.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div style={styles.linkActions}>
        <button
          style={styles.actionButton}
          onClick={(e) => { e.stopPropagation(); onStar(link); }}
          title={link.starred ? 'Remove star' : 'Add star'}
        >
          {link.starred ? (
            <Star size={18} fill={COLORS.warning} color={COLORS.warning} />
          ) : (
            <StarOff size={18} />
          )}
        </button>

        <button
          style={styles.actionButton}
          onClick={(e) => { e.stopPropagation(); onArchive(link); }}
          title={link.archived ? 'Unarchive' : 'Archive'}
        >
          {link.archived ? (
            <ArchiveRestore size={18} />
          ) : (
            <Archive size={18} />
          )}
        </button>

        <button
          style={styles.actionButton}
          onClick={(e) => { e.stopPropagation(); onDelete(link); }}
          title="Delete"
        >
          <Trash2 size={18} />
        </button>

        {link.readProgress > 0 && (
          <div style={styles.progressBar}>
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
  );
};

// ============================================================
// Import Modal Component
// ============================================================
const ImportModal = ({ isOpen, onClose, onImport }) => {
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    try {
      setIsImporting(true);
      const data = JSON.parse(importData);
      const links = Array.isArray(data) ? data : data.list || [];
      const importResult = await onImport(links);
      setResult(importResult);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>
          <span>Import from Pocket</span>
          <button
            style={{ ...styles.actionButton, padding: '4px' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '14px', color: COLORS.textMuted, marginBottom: '16px' }}>
          Export your Pocket data (Settings → Export → Export HTML), then paste
          the JSON export data below.
        </p>

        <textarea
          style={styles.textarea}
          placeholder="Paste your Pocket export JSON here..."
          value={importData}
          onChange={e => setImportData(e.target.value)}
          rows={8}
        />

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
                Imported {result.imported} links. Skipped {result.skipped} duplicates.
                {result.errors > 0 && ` ${result.errors} errors.`}
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleImport}
            disabled={isImporting || !importData.trim()}
          >
            {isImporting ? (
              <><RefreshCw size={16} className="animate-spin" /> Importing...</>
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
const AddFolderModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await onAdd({ name: name.trim(), color });
    setName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>
          <span>New Folder</span>
          <button
            style={{ ...styles.actionButton, padding: '4px' }}
            onClick={onClose}
          >
            <X size={20} />
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
// Link Detail Modal Component
// ============================================================
const LinkDetailModal = ({ link, isOpen, onClose, onUpdate }) => {
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
            style={{ ...styles.actionButton, padding: '4px' }}
            onClick={onClose}
          >
            <X size={20} />
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

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
  const [selectedLink, setSelectedLink] = useState(null);

  // Pagination
  const [_lastDoc, setLastDoc] = useState(null); // TODO: Implement pagination
  const [hasMore, setHasMore] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Build query options
      const options = {
        archived: activeView === 'archived',
        starred: activeView === 'starred' ? true : null,
        folderId: activeFolder,
        tag: activeTag,
        pageSize: 50
      };

      const [linksResult, foldersResult, tagsResult, tagCountsResult, statsResult] = await Promise.all([
        getLinks(user.uid, options),
        getFolders(user.uid),
        getUserTags(user.uid),
        getTagCounts(user.uid),
        getReadingStats(user.uid)
      ]);

      setLinks(linksResult.links);
      setLastDoc(linksResult.lastDoc);
      setHasMore(linksResult.hasMore);
      setFolders(foldersResult);
      setTags(tagsResult);
      setTagCounts(tagCountsResult);
      setStats(statsResult);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, activeView, activeFolder, activeTag]);

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

  const handleDelete = async (link) => {
    if (!window.confirm(`Delete "${link.title}"?`)) return;

    try {
      await deleteLink(link.id);
      setLinks(prev => prev.filter(l => l.id !== link.id));
    } catch (err) {
      console.error('Error deleting:', err);
    }
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

  // Filter links by search
  const filteredLinks = links.filter(link => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      link.title?.toLowerCase().includes(query) ||
      link.domain?.toLowerCase().includes(query) ||
      link.excerpt?.toLowerCase().includes(query) ||
      link.tags?.some(t => t.toLowerCase().includes(query))
    );
  });

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
        navigationItems={adminNavigationItems}
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
      navigationItems={adminNavigationItems}
      onHomeClick={handleHomeClick}
    >
      <div style={styles.container}>
        <div style={styles.innerContainer}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            <Bookmark size={32} color={COLORS.primary} />
            Link Archiver
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => setShowImportModal(true)}
            >
              <Upload size={16} /> Import
            </button>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={() => window.open('/link-archiver/extension', '_blank')}
            >
              <Download size={16} /> Get Extension
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
          </div>
        )}

        {/* Main Content */}
        <div style={styles.mainContent}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            {/* Views */}
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarTitle}>Views</div>
              {[
                { id: 'all', label: 'All Links', icon: Link2 },
                { id: 'starred', label: 'Starred', icon: Star },
                { id: 'archived', label: 'Archive', icon: Archive }
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
                  }}
                >
                  <view.icon size={18} />
                  {view.label}
                </div>
              ))}
            </div>

            {/* Folders */}
            <div style={styles.sidebarSection}>
              <div style={{ ...styles.sidebarTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Folders
                <button
                  style={{ ...styles.actionButton, padding: '2px' }}
                  onClick={() => setShowFolderModal(true)}
                >
                  <Plus size={16} />
                </button>
              </div>
              {folders.map(folder => (
                <div
                  key={folder.id}
                  style={{
                    ...styles.sidebarItem,
                    ...(activeFolder === folder.id ? styles.sidebarItemActive : {})
                  }}
                  onClick={() => {
                    setActiveFolder(folder.id);
                    setActiveView('all');
                    setActiveTag(null);
                  }}
                >
                  <Folder size={18} color={folder.color} />
                  {folder.name}
                </div>
              ))}
              {folders.length === 0 && (
                <p style={{ fontSize: '13px', color: COLORS.textLight, padding: '8px 12px' }}>
                  No folders yet
                </p>
              )}
            </div>

            {/* Tags */}
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarTitle}>Tags</div>
              {tags.slice(0, 10).map(tag => (
                <div
                  key={tag}
                  style={{
                    ...styles.sidebarItem,
                    ...(activeTag === tag ? styles.sidebarItemActive : {})
                  }}
                  onClick={() => {
                    setActiveTag(tag);
                    setActiveView('all');
                    setActiveFolder(null);
                  }}
                >
                  <Tag size={18} />
                  {tag}
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: COLORS.textLight }}>
                    {tagCounts[tag] || 0}
                  </span>
                </div>
              ))}
              {tags.length === 0 && (
                <p style={{ fontSize: '13px', color: COLORS.textLight, padding: '8px 12px' }}>
                  No tags yet
                </p>
              )}
            </div>
          </div>

          {/* Links List */}
          <div style={styles.linksList}>
            <div style={styles.linksHeader}>
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

      <LinkDetailModal
        link={selectedLink}
        isOpen={!!selectedLink}
        onClose={() => setSelectedLink(null)}
        onUpdate={handleUpdateLink}
      />
    </Layout>
  );
};

export default LinkArchiverPage;
