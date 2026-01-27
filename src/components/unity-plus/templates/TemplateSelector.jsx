import React, { useState, useMemo } from 'react';
import {
  X,
  FolderKanban,
  Route,
  Network,
  Palette,
  Columns3,
  Lightbulb,
  Search,
  Briefcase,
  Sparkles,
  User,
} from 'lucide-react';
import { CANVAS_TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory } from './canvasTemplates';

/**
 * TemplateSelector - Modal component for selecting canvas templates
 *
 * Features:
 * - Grid layout showing template previews
 * - Category filtering (work, creative, personal)
 * - Search functionality
 * - Template preview with icon, name, description
 * - Click to select and apply template
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSelectTemplate - Callback when template is selected (receives templateId)
 *
 * @created 2026-01-24
 * @author Claude Code
 */

// Icon mapping for template icons
const TEMPLATE_ICONS = {
  FolderKanban: FolderKanban,
  Route: Route,
  Network: Network,
  Palette: Palette,
  Columns3: Columns3,
  Lightbulb: Lightbulb,
};

// Category icons
const CATEGORY_ICONS = {
  work: Briefcase,
  creative: Sparkles,
  personal: User,
};

const TemplateSelector = ({ isOpen, onClose, onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  // Get all templates as array
  const allTemplates = useMemo(() => Object.values(CANVAS_TEMPLATES), []);

  // Filter templates based on category and search
  const filteredTemplates = useMemo(() => {
    let templates = selectedCategory === 'all'
      ? allTemplates
      : getTemplatesByCategory(selectedCategory);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    return templates;
  }, [allTemplates, selectedCategory, searchQuery]);

  const handleSelectTemplate = (templateId) => {
    if (onSelectTemplate) {
      onSelectTemplate(templateId);
    }
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-selector-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Modal Content */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div>
            <h2
              id="template-selector-title"
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
              }}
            >
              Choose a Template
            </h2>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              Start with a pre-made canvas layout
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#6b7280';
            }}
            aria-label="Close template selector"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search Input */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 200px',
              minWidth: '200px',
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#fbbf24';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            />
          </div>

          {/* Category Filters */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
            }}
          >
            {/* All category */}
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: selectedCategory === 'all' ? '#fbbf24' : '#f3f4f6',
                color: selectedCategory === 'all' ? '#92400e' : '#6b7280',
              }}
            >
              All
            </button>

            {/* Category buttons */}
            {Object.entries(TEMPLATE_CATEGORIES).map(([key, { label, color }]) => {
              const Icon = CATEGORY_ICONS[key];
              const isSelected = selectedCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: isSelected ? color : '#f3f4f6',
                    color: isSelected ? '#ffffff' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {Icon && <Icon size={14} />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {filteredTemplates.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#6b7280',
              }}
            >
              <p style={{ fontSize: '16px', margin: 0 }}>No templates found</p>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0', opacity: 0.7 }}>
                Try a different search or category
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredTemplates.map((template) => {
                const Icon = TEMPLATE_ICONS[template.icon] || FolderKanban;
                const categoryColor = TEMPLATE_CATEGORIES[template.category]?.color || '#6b7280';
                const isHovered = hoveredTemplate === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    onMouseEnter={() => setHoveredTemplate(template.id)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      border: `2px solid ${isHovered ? categoryColor : '#e5e7eb'}`,
                      backgroundColor: isHovered ? `${categoryColor}08` : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: isHovered
                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                        : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: `${categoryColor}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '14px',
                      }}
                    >
                      <Icon
                        size={24}
                        style={{ color: categoryColor }}
                      />
                    </div>

                    {/* Name */}
                    <h3
                      style={{
                        margin: '0 0 6px 0',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#111827',
                      }}
                    >
                      {template.name}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        margin: '0 0 12px 0',
                        fontSize: '13px',
                        color: '#6b7280',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {template.description}
                    </p>

                    {/* Meta info */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '500',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: `${categoryColor}15`,
                          color: categoryColor,
                          textTransform: 'capitalize',
                        }}
                      >
                        {template.category}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#9ca3af',
                        }}
                      >
                        {template.nodes.length} elements
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              color: '#6b7280',
            }}
          >
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
