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

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/global/Layout';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { navigationItems } from '../../config/navigationItems';
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
  getFolderCounts,
  getReadingStats,
  importFromPocket,
  moveTaggedLinksToFolder,
  shareLink,
  unshareLink,
  shareLinkToCanvas,
  unshareLinkFromCanvas,
  getLinkSharingInfo,
  fixMissingUserIds
} from '../../utils/firestoreLinks';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
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
  Layout as LayoutIcon
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
const LinkCard = ({ link, onStar, onArchive, onDelete, onClick, onShare }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isShared = (link.sharedWith?.length || 0) > 0;

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
          style={{
            ...styles.actionButton,
            color: isShared ? COLORS.primary : COLORS.textMuted
          }}
          onClick={(e) => { e.stopPropagation(); onShare(link); }}
          title={isShared ? `Shared with ${link.sharedWith.length} user(s)` : 'Share link'}
        >
          <Share2 size={18} />
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
            style={{ ...styles.actionButton, padding: '4px' }}
            onClick={onClose}
          >
            <X size={20} />
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
            style={{ ...styles.actionButton, padding: '4px' }}
            onClick={onClose}
          >
            <X size={20} />
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
            style={{ ...styles.actionButton, padding: '4px' }}
            onClick={onClose}
          >
            <X size={20} />
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
      await shareLinkToCanvas(link.id, user.uid, selectedCanvasId);
      const canvas = userCanvases.find(c => c.id === selectedCanvasId);
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
            style={{ ...styles.actionButton, padding: '4px' }}
            onClick={onClose}
          >
            <X size={20} />
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedCanvasId}
                  onChange={e => {
                    setSelectedCanvasId(e.target.value);
                    setShareError(null);
                    setShareSuccess(null);
                  }}
                  style={{
                    flex: 1,
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
                  {userCanvases.map(canvas => (
                    <option
                      key={canvas.id}
                      value={canvas.id}
                      disabled={canvasShares.some(s => s.targetId === canvas.id)}
                    >
                      {canvas.title || 'Untitled Canvas'}
                      {canvasShares.some(s => s.targetId === canvas.id) ? ' (already shared)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
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

      const [linksResult, foldersResult, tagsResult, tagCountsResult, folderCountsResult, statsResult] = await Promise.all([
        getLinks(user.uid, options),
        getFolders(user.uid),
        getUserTags(user.uid),
        getTagCounts(user.uid),
        getFolderCounts(user.uid),
        getReadingStats(user.uid)
      ]);

      setLinks(linksResult.links);
      setLastDoc(linksResult.lastDoc);
      setHasMore(linksResult.hasMore);

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
      <div style={styles.container}>
        <div style={styles.innerContainer}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            <Bookmark size={32} color={COLORS.primary} />
            Link Saver
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={() => setShowAddLinkModal(true)}
            >
              <Plus size={16} /> Add Link
            </button>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => setShowImportModal(true)}
            >
              <Upload size={16} /> Import
            </button>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => setShowBulkFolderModal(true)}
              title="Move links by tag to folders"
            >
              <Folder size={16} /> Organize
            </button>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => window.open('/links/extension', '_blank')}
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
                  <span style={{ flex: 1 }}>{folder.name}</span>
                  <span style={{
                    fontSize: '11px',
                    color: activeFolder === folder.id ? COLORS.text : COLORS.textMuted,
                    backgroundColor: activeFolder === folder.id ? 'rgba(0,0,0,0.1)' : COLORS.cardBg,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    minWidth: '24px',
                    textAlign: 'center'
                  }}>
                    {folderCounts[folder.id] || 0}
                  </span>
                </div>
              ))}
              {folders.length === 0 && (
                <p style={{ fontSize: '13px', color: COLORS.textLight, padding: '8px 12px' }}>
                  No folders yet
                </p>
              )}
            </div>

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
                  onShare={setShareLinkState}
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
      />

      <ShareLinkModal
        link={shareLink}
        isOpen={!!shareLink}
        onClose={() => setShareLinkState(null)}
        user={user}
        onShareComplete={loadData}
      />
    </Layout>
  );
};

export default LinkArchiverPage;
