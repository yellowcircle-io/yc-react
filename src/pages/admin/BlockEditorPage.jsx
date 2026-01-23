/**
 * Block Editor Admin Page
 *
 * Visual block-based editor for yellowCircle CMS.
 * Creates articles using the same block structure as ArticleRenderer.
 *
 * Features:
 * - Drag-and-drop block ordering
 * - Visual block type selector
 * - Live preview with actual block components
 * - Save to Firestore with blocks array
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/global/Layout';
import { useAuth } from '../../contexts/AuthContext';
import {
  getArticle,
  saveArticle,
  publishArticle,
  ARTICLE_STATUS,
  ARTICLE_CATEGORIES,
  CONTENT_SOURCE,
  BLOCK_TYPES
} from '../../utils/firestoreArticles';
import {
  FileText,
  Save,
  Send,
  Eye,
  Trash2,
  X,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Type,
  Quote,
  ListOrdered,
  Users,
  BarChart3,
  Lightbulb,
  MessageSquare,
  MousePointerClick,
  BookOpen,
  Check,
  Copy
} from 'lucide-react';

// Import admin navigation
import { adminNavigationItems } from '../../config/adminNavigationItems';

// ============================================================
// Colors
// ============================================================
const COLORS = {
  primary: '#fbbf24',
  primaryDark: '#d4a000',
  text: '#171717',
  textMuted: '#737373',
  textLight: '#a3a3a3',
  border: 'rgba(0, 0, 0, 0.1)',
  inputBg: 'rgba(0, 0, 0, 0.02)',
  success: '#16a34a',
  error: '#dc2626',
  white: '#ffffff',
  cardBg: '#fafafa'
};

// ============================================================
// Block Type Definitions
// ============================================================
const BLOCK_DEFINITIONS = [
  { type: BLOCK_TYPES.HERO, label: 'Hero', icon: Type, color: '#fbbf24', description: 'Title, subtitle, meta info' },
  { type: BLOCK_TYPES.LEAD_PARAGRAPH, label: 'Lead Paragraph', icon: Type, color: '#3b82f6', description: 'Bold intro text' },
  { type: BLOCK_TYPES.PARAGRAPH, label: 'Paragraph', icon: Type, color: '#6b7280', description: 'Regular text' },
  { type: BLOCK_TYPES.SECTION_HEADER, label: 'Section Header', icon: Type, color: '#fbbf24', description: 'Numbered heading' },
  { type: BLOCK_TYPES.STAT_GRID, label: 'Stat Grid', icon: BarChart3, color: '#10b981', description: 'Statistics cards' },
  { type: BLOCK_TYPES.BULLET_LIST, label: 'Bullet List', icon: ListOrdered, color: '#8b5cf6', description: 'Arrow-style list' },
  { type: BLOCK_TYPES.QUOTE, label: 'Quote', icon: Quote, color: '#f59e0b', description: 'Blockquote with author' },
  { type: BLOCK_TYPES.PERSONA_CARD, label: 'Persona Card', icon: Users, color: '#ec4899', description: 'Name, role, description' },
  { type: BLOCK_TYPES.NUMBERED_LIST, label: 'Numbered List', icon: ListOrdered, color: '#14b8a6', description: 'Numbered items' },
  { type: BLOCK_TYPES.ACTION_GRID, label: 'Action Grid', icon: Lightbulb, color: '#f97316', description: 'Icon + title + description' },
  { type: BLOCK_TYPES.CALLOUT_BOX, label: 'Callout Box', icon: MessageSquare, color: '#fbbf24', description: 'Highlighted box' },
  { type: BLOCK_TYPES.CTA_SECTION, label: 'CTA Section', icon: MousePointerClick, color: '#22c55e', description: 'Call to action buttons' },
  { type: BLOCK_TYPES.SOURCES, label: 'Sources', icon: BookOpen, color: '#6b7280', description: 'Citation list' }
];

// ============================================================
// Default Block Data
// ============================================================
const getDefaultBlockData = (type) => {
  switch (type) {
    case BLOCK_TYPES.HERO:
      return { type, seriesLabel: '', title: '', subtitle: '', readingTime: 5, date: '', author: 'yellowCircle' };
    case BLOCK_TYPES.LEAD_PARAGRAPH:
      return { type, highlight: '', content: '' };
    case BLOCK_TYPES.PARAGRAPH:
      return { type, content: '', muted: false };
    case BLOCK_TYPES.SECTION_HEADER:
      return { type, number: '', title: '' };
    case BLOCK_TYPES.STAT_GRID:
      return { type, stats: [{ value: '', label: '', source: '' }] };
    case BLOCK_TYPES.BULLET_LIST:
      return { type, items: [''] };
    case BLOCK_TYPES.QUOTE:
      return { type, content: '', author: '' };
    case BLOCK_TYPES.PERSONA_CARD:
      return { type, name: '', role: '', description: '', cost: '' };
    case BLOCK_TYPES.NUMBERED_LIST:
      return { type, items: [{ title: '', description: '' }], highlighted: true };
    case BLOCK_TYPES.ACTION_GRID:
      return { type, items: [{ icon: '🔍', title: '', description: '' }] };
    case BLOCK_TYPES.CALLOUT_BOX:
      return { type, title: '', content: '', highlight: '' };
    case BLOCK_TYPES.CTA_SECTION:
      return { type, prompt: '', buttons: [{ label: '', link: '', primary: true }] };
    case BLOCK_TYPES.SOURCES:
      return { type, sources: [''] };
    default:
      return { type };
  }
};

// ============================================================
// Block Editor Component
// ============================================================
const BlockEditor = ({ block, index, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const def = BLOCK_DEFINITIONS.find(d => d.type === block.type);
  const Icon = def?.icon || Type;

  const updateBlock = (updates) => {
    onChange(index, { ...block, ...updates });
  };

  const renderFields = () => {
    switch (block.type) {
      case BLOCK_TYPES.HERO:
        return (
          <>
            <input
              placeholder="Series Label (e.g., OWN YOUR STORY)"
              value={block.seriesLabel || ''}
              onChange={(e) => updateBlock({ seriesLabel: e.target.value })}
              style={fieldStyle}
            />
            <input
              placeholder="Title *"
              value={block.title || ''}
              onChange={(e) => updateBlock({ title: e.target.value })}
              style={{ ...fieldStyle, fontSize: '16px', fontWeight: '600' }}
            />
            <input
              placeholder="Subtitle"
              value={block.subtitle || ''}
              onChange={(e) => updateBlock({ subtitle: e.target.value })}
              style={fieldStyle}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                placeholder="Reading Time (min)"
                type="number"
                value={block.readingTime || ''}
                onChange={(e) => updateBlock({ readingTime: parseInt(e.target.value) || 0 })}
                style={{ ...fieldStyle, width: '120px' }}
              />
              <input
                placeholder="Date (e.g., November 2025)"
                value={block.date || ''}
                onChange={(e) => updateBlock({ date: e.target.value })}
                style={fieldStyle}
              />
            </div>
          </>
        );

      case BLOCK_TYPES.LEAD_PARAGRAPH:
        return (
          <>
            <input
              placeholder="Highlight text (bold, e.g., 'Let's be direct:')"
              value={block.highlight || ''}
              onChange={(e) => updateBlock({ highlight: e.target.value })}
              style={fieldStyle}
            />
            <textarea
              placeholder="Content *"
              value={block.content || ''}
              onChange={(e) => updateBlock({ content: e.target.value })}
              style={{ ...fieldStyle, minHeight: '80px' }}
            />
          </>
        );

      case BLOCK_TYPES.PARAGRAPH:
        return (
          <>
            <textarea
              placeholder="Paragraph content *"
              value={block.content || ''}
              onChange={(e) => updateBlock({ content: e.target.value })}
              style={{ ...fieldStyle, minHeight: '100px' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: COLORS.textMuted }}>
              <input
                type="checkbox"
                checked={block.muted || false}
                onChange={(e) => updateBlock({ muted: e.target.checked })}
              />
              Muted (lighter text)
            </label>
          </>
        );

      case BLOCK_TYPES.SECTION_HEADER:
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              placeholder="Number (01)"
              value={block.number || ''}
              onChange={(e) => updateBlock({ number: e.target.value })}
              style={{ ...fieldStyle, width: '80px' }}
            />
            <input
              placeholder="Section Title *"
              value={block.title || ''}
              onChange={(e) => updateBlock({ title: e.target.value })}
              style={{ ...fieldStyle, flex: 1, fontWeight: '600' }}
            />
          </div>
        );

      case BLOCK_TYPES.STAT_GRID:
        return (
          <>
            {(block.stats || []).map((stat, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  placeholder="Value (68%)"
                  value={stat.value || ''}
                  onChange={(e) => {
                    const newStats = [...(block.stats || [])];
                    newStats[i] = { ...newStats[i], value: e.target.value };
                    updateBlock({ stats: newStats });
                  }}
                  style={{ ...fieldStyle, width: '80px', fontWeight: '600' }}
                />
                <input
                  placeholder="Label *"
                  value={stat.label || ''}
                  onChange={(e) => {
                    const newStats = [...(block.stats || [])];
                    newStats[i] = { ...newStats[i], label: e.target.value };
                    updateBlock({ stats: newStats });
                  }}
                  style={{ ...fieldStyle, flex: 1 }}
                />
                <input
                  placeholder="Source"
                  value={stat.source || ''}
                  onChange={(e) => {
                    const newStats = [...(block.stats || [])];
                    newStats[i] = { ...newStats[i], source: e.target.value };
                    updateBlock({ stats: newStats });
                  }}
                  style={{ ...fieldStyle, width: '120px' }}
                />
                <button
                  onClick={() => {
                    const newStats = block.stats.filter((_, idx) => idx !== i);
                    updateBlock({ stats: newStats });
                  }}
                  style={smallButtonStyle}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateBlock({ stats: [...(block.stats || []), { value: '', label: '', source: '' }] })}
              style={{ ...smallButtonStyle, color: COLORS.primary }}
            >
              <Plus size={14} /> Add Stat
            </button>
          </>
        );

      case BLOCK_TYPES.BULLET_LIST:
        return (
          <>
            {(block.items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: COLORS.primary, fontWeight: '600' }}>→</span>
                <input
                  placeholder="List item *"
                  value={item || ''}
                  onChange={(e) => {
                    const newItems = [...(block.items || [])];
                    newItems[i] = e.target.value;
                    updateBlock({ items: newItems });
                  }}
                  style={{ ...fieldStyle, flex: 1 }}
                />
                <button
                  onClick={() => {
                    const newItems = block.items.filter((_, idx) => idx !== i);
                    updateBlock({ items: newItems });
                  }}
                  style={smallButtonStyle}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateBlock({ items: [...(block.items || []), ''] })}
              style={{ ...smallButtonStyle, color: COLORS.primary }}
            >
              <Plus size={14} /> Add Item
            </button>
          </>
        );

      case BLOCK_TYPES.QUOTE:
        return (
          <>
            <textarea
              placeholder="Quote text *"
              value={block.content || ''}
              onChange={(e) => updateBlock({ content: e.target.value })}
              style={{ ...fieldStyle, minHeight: '80px', fontStyle: 'italic' }}
            />
            <input
              placeholder="Author (e.g., Anonymous MOPs Manager)"
              value={block.author || ''}
              onChange={(e) => updateBlock({ author: e.target.value })}
              style={fieldStyle}
            />
          </>
        );

      case BLOCK_TYPES.PERSONA_CARD:
        return (
          <>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                placeholder="Name *"
                value={block.name || ''}
                onChange={(e) => updateBlock({ name: e.target.value })}
                style={{ ...fieldStyle, width: '120px', fontWeight: '600' }}
              />
              <input
                placeholder="Role *"
                value={block.role || ''}
                onChange={(e) => updateBlock({ role: e.target.value })}
                style={{ ...fieldStyle, flex: 1 }}
              />
            </div>
            <textarea
              placeholder="Description *"
              value={block.description || ''}
              onChange={(e) => updateBlock({ description: e.target.value })}
              style={{ ...fieldStyle, minHeight: '80px' }}
            />
            <input
              placeholder="Cost (e.g., 15+ hours/week on reconciliation)"
              value={block.cost || ''}
              onChange={(e) => updateBlock({ cost: e.target.value })}
              style={{ ...fieldStyle, color: COLORS.primary }}
            />
          </>
        );

      case BLOCK_TYPES.NUMBERED_LIST:
        return (
          <>
            {(block.items || []).map((item, i) => (
              <div key={i} style={{ marginBottom: '12px', paddingLeft: '32px', position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '8px',
                  width: '24px',
                  height: '24px',
                  backgroundColor: COLORS.primary,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>{i + 1}</span>
                <input
                  placeholder="Title *"
                  value={item.title || ''}
                  onChange={(e) => {
                    const newItems = [...(block.items || [])];
                    newItems[i] = { ...newItems[i], title: e.target.value };
                    updateBlock({ items: newItems });
                  }}
                  style={{ ...fieldStyle, fontWeight: '600', marginBottom: '4px' }}
                />
                <input
                  placeholder="Description"
                  value={item.description || ''}
                  onChange={(e) => {
                    const newItems = [...(block.items || [])];
                    newItems[i] = { ...newItems[i], description: e.target.value };
                    updateBlock({ items: newItems });
                  }}
                  style={fieldStyle}
                />
                <button
                  onClick={() => {
                    const newItems = block.items.filter((_, idx) => idx !== i);
                    updateBlock({ items: newItems });
                  }}
                  style={{ ...smallButtonStyle, position: 'absolute', right: 0, top: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateBlock({ items: [...(block.items || []), { title: '', description: '' }] })}
              style={{ ...smallButtonStyle, color: COLORS.primary }}
            >
              <Plus size={14} /> Add Item
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: COLORS.textMuted, marginTop: '8px' }}>
              <input
                type="checkbox"
                checked={block.highlighted || false}
                onChange={(e) => updateBlock({ highlighted: e.target.checked })}
              />
              Highlighted box
            </label>
          </>
        );

      case BLOCK_TYPES.ACTION_GRID:
        return (
          <>
            {(block.items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                <input
                  placeholder="🔍"
                  value={item.icon || ''}
                  onChange={(e) => {
                    const newItems = [...(block.items || [])];
                    newItems[i] = { ...newItems[i], icon: e.target.value };
                    updateBlock({ items: newItems });
                  }}
                  style={{ ...fieldStyle, width: '50px', textAlign: 'center', fontSize: '18px' }}
                />
                <div style={{ flex: 1 }}>
                  <input
                    placeholder="Title *"
                    value={item.title || ''}
                    onChange={(e) => {
                      const newItems = [...(block.items || [])];
                      newItems[i] = { ...newItems[i], title: e.target.value };
                      updateBlock({ items: newItems });
                    }}
                    style={{ ...fieldStyle, fontWeight: '600', marginBottom: '4px' }}
                  />
                  <input
                    placeholder="Description"
                    value={item.description || ''}
                    onChange={(e) => {
                      const newItems = [...(block.items || [])];
                      newItems[i] = { ...newItems[i], description: e.target.value };
                      updateBlock({ items: newItems });
                    }}
                    style={fieldStyle}
                  />
                </div>
                <button
                  onClick={() => {
                    const newItems = block.items.filter((_, idx) => idx !== i);
                    updateBlock({ items: newItems });
                  }}
                  style={smallButtonStyle}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateBlock({ items: [...(block.items || []), { icon: '✨', title: '', description: '' }] })}
              style={{ ...smallButtonStyle, color: COLORS.primary }}
            >
              <Plus size={14} /> Add Action
            </button>
          </>
        );

      case BLOCK_TYPES.CALLOUT_BOX:
        return (
          <>
            <input
              placeholder="Title (e.g., The Bottom Line)"
              value={block.title || ''}
              onChange={(e) => updateBlock({ title: e.target.value })}
              style={{ ...fieldStyle, fontWeight: '600' }}
            />
            <textarea
              placeholder="Content *"
              value={block.content || ''}
              onChange={(e) => updateBlock({ content: e.target.value })}
              style={{ ...fieldStyle, minHeight: '100px' }}
            />
            <input
              placeholder="Highlight text (e.g., Your choice.)"
              value={block.highlight || ''}
              onChange={(e) => updateBlock({ highlight: e.target.value })}
              style={{ ...fieldStyle, color: COLORS.primary, fontWeight: '600' }}
            />
          </>
        );

      case BLOCK_TYPES.CTA_SECTION:
        return (
          <>
            <input
              placeholder="Prompt (e.g., Ready to stop the theater?)"
              value={block.prompt || ''}
              onChange={(e) => updateBlock({ prompt: e.target.value })}
              style={fieldStyle}
            />
            {(block.buttons || []).map((btn, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  placeholder="Button Label *"
                  value={btn.label || ''}
                  onChange={(e) => {
                    const newButtons = [...(block.buttons || [])];
                    newButtons[i] = { ...newButtons[i], label: e.target.value };
                    updateBlock({ buttons: newButtons });
                  }}
                  style={{ ...fieldStyle, flex: 1 }}
                />
                <input
                  placeholder="Link (/path)"
                  value={btn.link || ''}
                  onChange={(e) => {
                    const newButtons = [...(block.buttons || [])];
                    newButtons[i] = { ...newButtons[i], link: e.target.value };
                    updateBlock({ buttons: newButtons });
                  }}
                  style={{ ...fieldStyle, width: '150px' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: COLORS.textMuted }}>
                  <input
                    type="checkbox"
                    checked={btn.primary || false}
                    onChange={(e) => {
                      const newButtons = [...(block.buttons || [])];
                      newButtons[i] = { ...newButtons[i], primary: e.target.checked };
                      updateBlock({ buttons: newButtons });
                    }}
                  />
                  Primary
                </label>
                <button
                  onClick={() => {
                    const newButtons = block.buttons.filter((_, idx) => idx !== i);
                    updateBlock({ buttons: newButtons });
                  }}
                  style={smallButtonStyle}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateBlock({ buttons: [...(block.buttons || []), { label: '', link: '', primary: false }] })}
              style={{ ...smallButtonStyle, color: COLORS.primary }}
            >
              <Plus size={14} /> Add Button
            </button>
          </>
        );

      case BLOCK_TYPES.SOURCES:
        return (
          <>
            {(block.sources || []).map((source, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: COLORS.textMuted }}>•</span>
                <input
                  placeholder="Source citation *"
                  value={source || ''}
                  onChange={(e) => {
                    const newSources = [...(block.sources || [])];
                    newSources[i] = e.target.value;
                    updateBlock({ sources: newSources });
                  }}
                  style={{ ...fieldStyle, flex: 1 }}
                />
                <button
                  onClick={() => {
                    const newSources = block.sources.filter((_, idx) => idx !== i);
                    updateBlock({ sources: newSources });
                  }}
                  style={smallButtonStyle}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateBlock({ sources: [...(block.sources || []), ''] })}
              style={{ ...smallButtonStyle, color: COLORS.primary }}
            >
              <Plus size={14} /> Add Source
            </button>
          </>
        );

      default:
        return <p style={{ color: COLORS.textMuted }}>Unknown block type: {block.type}</p>;
    }
  };

  return (
    <div style={{
      backgroundColor: COLORS.white,
      border: `2px solid ${COLORS.border}`,
      borderRadius: '12px',
      marginBottom: '16px',
      overflow: 'hidden'
    }}>
      {/* Block header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: COLORS.cardBg,
        borderBottom: `1px solid ${COLORS.border}`
      }}>
        <GripVertical size={16} style={{ color: COLORS.textLight, cursor: 'grab' }} />
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          backgroundColor: `${def?.color || COLORS.textMuted}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={14} style={{ color: def?.color || COLORS.textMuted }} />
        </div>
        <span style={{ fontWeight: '600', fontSize: '14px', color: COLORS.text }}>{def?.label || block.type}</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => onMoveUp(index)} disabled={isFirst} style={{ ...smallButtonStyle, opacity: isFirst ? 0.3 : 1 }}>
          <ChevronUp size={14} />
        </button>
        <button onClick={() => onMoveDown(index)} disabled={isLast} style={{ ...smallButtonStyle, opacity: isLast ? 0.3 : 1 }}>
          <ChevronDown size={14} />
        </button>
        <button onClick={() => onDelete(index)} style={{ ...smallButtonStyle, color: COLORS.error }}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Block fields */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {renderFields()}
      </div>
    </div>
  );
};

// Shared styles
const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.white,
  color: COLORS.text,
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
};

const smallButtonStyle = {
  padding: '6px 8px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: 'transparent',
  color: COLORS.textMuted,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px'
};

// ============================================================
// Main Component
// ============================================================
const BlockEditorPage = () => {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Article state
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('updates');
  const [blocks, setBlocks] = useState([]);

  // UI state
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  // Load article
  useEffect(() => {
    const loadArticle = async () => {
      if (!articleId || articleId === 'new') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getArticle(articleId);
        if (data) {
          setArticle(data);
          setTitle(data.title || '');
          setSlug(data.slug || '');
          setExcerpt(data.excerpt || '');
          setCategory(data.category || 'updates');
          setBlocks(data.blocks || []);
        } else {
          setError('Article not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAdmin) {
      loadArticle();
    }
  }, [articleId, authLoading, isAdmin]);

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

  // Block operations
  const addBlock = (type) => {
    setBlocks([...blocks, getDefaultBlockData(type)]);
    setShowBlockPicker(false);
  };

  const updateBlock = (index, updatedBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
  };

  const deleteBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  // Save article
  const handleSave = async (publish = false) => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const articleData = {
        id: article?.id || `article-${Date.now()}`,
        title: title.trim(),
        slug: generatedSlug,
        excerpt: excerpt.trim(),
        content: '', // Legacy field - empty for block-based articles
        blocks,
        contentSource: CONTENT_SOURCE.BLOCKS,
        category,
        tags: [],
        status: publish ? ARTICLE_STATUS.PUBLISHED : ARTICLE_STATUS.DRAFT,
        author: user?.displayName || 'Chris Cooper',
        authorEmail: user?.email || 'chris@yellowcircle.io',
        readingTime: Math.max(1, Math.ceil(blocks.length * 1.5)),
        seo: {
          metaTitle: title,
          metaDescription: excerpt
        }
      };

      if (article) {
        articleData.createdAt = article.createdAt;
        articleData.viewCount = article.viewCount || 0;
        if (article.publishedAt) {
          articleData.publishedAt = article.publishedAt;
        }
      }

      const saved = await saveArticle(articleData, user?.email || 'admin');

      if (publish) {
        await publishArticle(saved.id, user?.email || 'admin');
      }

      setArticle(saved);
      setSuccessMessage(publish ? 'Article published!' : 'Article saved');
      setTimeout(() => setSuccessMessage(null), 3000);

      if (!articleId || articleId === 'new') {
        navigate(`/admin/blocks/${saved.id}`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Loading/auth check
  if (authLoading || loading) {
    return (
      <Layout
        hideParallaxCircle={true}
        hideCircleNav={true}
        sidebarVariant="standard"
        allowScroll={true}
        pageLabel="BLOCKS"
        onHomeClick={() => navigate('/')}
        onFooterToggle={() => {}}
        onMenuToggle={() => {}}
        navigationItems={adminNavigationItems}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          paddingTop: '80px',
          paddingLeft: '100px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: `3px solid ${COLORS.border}`,
            borderTopColor: COLORS.primary,
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) return null;

  return (
    <Layout
      hideParallaxCircle={true}
      hideCircleNav={true}
      sidebarVariant="standard"
      allowScroll={true}
      pageLabel="BLOCKS"
      onHomeClick={() => navigate('/')}
      onFooterToggle={() => {}}
      onMenuToggle={() => {}}
      navigationItems={adminNavigationItems}
    >
      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .block-editor-container {
            padding: 80px 16px 16px 16px !important;
          }
        }
        @media (max-width: 480px) {
          .block-editor-container {
            padding: 70px 12px 12px 12px !important;
          }
        }
      `}</style>
      <div className="block-editor-container" style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '100px 40px 40px 120px'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => navigate('/admin/articles')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `2px solid ${COLORS.border}`,
                  backgroundColor: COLORS.white,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FileText style={{ color: COLORS.primary }} size={24} />
                  Block Editor
                </h1>
                <p style={{ color: COLORS.textMuted, fontSize: '13px', marginTop: '4px' }}>
                  {blocks.length} blocks
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: `2px solid ${COLORS.border}`,
                  backgroundColor: COLORS.white,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: saving ? 0.5 : 1
                }}
              >
                {saving ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                Save Draft
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dcfce7',
                  color: COLORS.success,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <Send size={16} />
                Publish
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '2px solid #fecaca',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertTriangle size={20} style={{ color: COLORS.error }} />
              <span style={{ color: COLORS.error, flex: 1 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} style={{ color: '#f87171' }} />
              </button>
            </div>
          )}

          {successMessage && (
            <div style={{
              backgroundColor: '#dcfce7',
              border: '2px solid #bbf7d0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Check size={20} style={{ color: COLORS.success }} />
              <span style={{ color: COLORS.success }}>{successMessage}</span>
            </div>
          )}

          {/* Article meta */}
          <div style={{
            backgroundColor: COLORS.white,
            border: `2px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: COLORS.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!article) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                    }
                  }}
                  placeholder="Article title..."
                  style={{ ...fieldStyle, fontSize: '18px', fontWeight: '600' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: COLORS.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={fieldStyle}
                >
                  {ARTICLE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: COLORS.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary..."
                rows={2}
                style={fieldStyle}
              />
            </div>
            <p style={{ color: COLORS.textLight, fontSize: '11px', marginTop: '8px' }}>
              URL: /thoughts/{slug || 'your-slug'}
            </p>
          </div>

          {/* Blocks */}
          <div style={{ marginBottom: '24px' }}>
            {blocks.map((block, index) => (
              <BlockEditor
                key={index}
                block={block}
                index={index}
                onChange={updateBlock}
                onDelete={deleteBlock}
                onMoveUp={() => moveBlock(index, -1)}
                onMoveDown={() => moveBlock(index, 1)}
                isFirst={index === 0}
                isLast={index === blocks.length - 1}
              />
            ))}

            {/* Add block button */}
            <button
              onClick={() => setShowBlockPicker(true)}
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: '12px',
                border: `2px dashed ${COLORS.border}`,
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: COLORS.textMuted,
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = COLORS.primary;
                e.target.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = COLORS.border;
                e.target.style.color = COLORS.textMuted;
              }}
            >
              <Plus size={20} />
              Add Block
            </button>
          </div>
        </div>
      </div>

      {/* Block Picker Modal */}
      {showBlockPicker && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowBlockPicker(false)}
        >
          <div
            style={{
              backgroundColor: COLORS.white,
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Add Block</h2>
              <button
                onClick={() => setShowBlockPicker(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
              {BLOCK_DEFINITIONS.map(def => (
                <button
                  key={def.type}
                  onClick={() => addBlock(def.type)}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: `2px solid ${COLORS.border}`,
                    backgroundColor: COLORS.white,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = def.color;
                    e.currentTarget.style.backgroundColor = `${def.color}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.backgroundColor = COLORS.white;
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: `${def.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <def.icon size={16} style={{ color: def.color }} />
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: COLORS.text, marginBottom: '2px' }}>
                    {def.label}
                  </div>
                  <div style={{ fontSize: '11px', color: COLORS.textMuted }}>
                    {def.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
};

export default BlockEditorPage;
