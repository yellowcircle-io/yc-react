import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Link2 } from 'lucide-react';

/**
 * LinkNode - Saved link card for Unity canvas
 *
 * Displays a saved link from the Link Archiver with:
 * - Thumbnail/favicon
 * - Title and domain
 * - Excerpt
 * - Tags
 * - Reading progress
 * - Quick actions (open, star, archive)
 *
 * Part of yellowCircle Unity ecosystem - Link Archiver integration.
 *
 * @created 2026-01-17
 * @author Sleepless Agent
 */

const LINK_COLORS = {
  default: { bg: '#ffffff', border: '#e5e5e5', accent: '#f97316' },
  starred: { bg: '#fffbeb', border: '#fbbf24', accent: '#f59e0b' },
  read: { bg: '#f0fdf4', border: '#22c55e', accent: '#16a34a' },
};

const LinkNode = memo(({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Destructure link data
  const {
    url = '',
    title = 'Untitled',
    domain = 'unknown',
    favicon = null,
    image = null,
    excerpt = '',
    tags = [],
    starred = false,
    readProgress = 0,
    aiSummary = null,
    onOpen,
    onStar,
    onArchive,
    onDelete,
  } = data;

  // Determine color scheme
  const colorScheme = starred
    ? LINK_COLORS.starred
    : readProgress >= 0.9
      ? LINK_COLORS.read
      : LINK_COLORS.default;

  const handleOpen = (e) => {
    e.stopPropagation();
    if (onOpen) {
      onOpen(id, url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStar = (e) => {
    e.stopPropagation();
    if (onStar) {
      onStar(id, !starred);
    }
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    if (onArchive) {
      onArchive(id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleOpen}
      style={{
        width: '280px',
        backgroundColor: colorScheme.bg,
        border: `2px solid ${selected ? colorScheme.accent : colorScheme.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: selected
          ? `0 8px 24px ${colorScheme.accent}30`
          : isHovered
            ? '0 8px 20px rgba(0, 0, 0, 0.15)'
            : '0 4px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'scale(1.01)' : 'scale(1)',
        outline: selected ? '2px solid #3b82f6' : 'none',
        outlineOffset: selected ? '2px' : '0',
      }}
    >
      {/* Type icon - top-left */}
      <div style={{ position: 'absolute', top: '8px', left: '8px', opacity: 0.4, zIndex: 5 }}>
        <Link2 size={14} />
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: colorScheme.accent,
          border: '2px solid #fff',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: colorScheme.accent,
          border: '2px solid #fff',
        }}
      />

      {/* Delete button */}
      {(isHovered || selected) && onDelete && (
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            border: '2px solid white',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          ×
        </button>
      )}

      {/* Thumbnail */}
      {image ? (
        <div
          style={{
            width: '100%',
            height: '120px',
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderBottom: `1px solid ${colorScheme.border}`,
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '60px',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${colorScheme.border}`,
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a3a3a3"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {/* Domain */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '6px',
          }}
        >
          {favicon && (
            <img
              src={favicon}
              alt=""
              style={{ width: '14px', height: '14px', borderRadius: '2px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <span
            style={{
              fontSize: '11px',
              color: '#737373',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {domain}
          </span>
          {starred && (
            <span style={{ marginLeft: 'auto' }}>⭐</span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#171717',
            margin: '0 0 8px 0',
            lineHeight: '1.3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p
            style={{
              fontSize: '12px',
              color: '#737373',
              margin: '0 0 10px 0',
              lineHeight: '1.4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {excerpt}
          </p>
        )}

        {/* AI Summary (if available) */}
        {aiSummary && (
          <div
            style={{
              backgroundColor: '#fef3c7',
              borderRadius: '6px',
              padding: '8px',
              marginBottom: '10px',
              fontSize: '11px',
              color: '#92400e',
              lineHeight: '1.4',
            }}
          >
            <span style={{ fontWeight: '600' }}>AI: </span>
            {aiSummary.length > 80 ? `${aiSummary.slice(0, 80)}...` : aiSummary}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              marginBottom: '10px',
            }}
          >
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#f5f5f5',
                  color: '#525252',
                }}
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span
                style={{
                  fontSize: '10px',
                  color: '#a3a3a3',
                }}
              >
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Reading Progress */}
        {readProgress > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#737373',
                marginBottom: '4px',
              }}
            >
              <span>Reading Progress</span>
              <span>{Math.round(readProgress * 100)}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#e5e5e5',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${readProgress * 100}%`,
                  height: '100%',
                  backgroundColor: readProgress >= 0.9 ? '#22c55e' : colorScheme.accent,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {(isHovered || selected) && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: `1px solid ${colorScheme.border}`,
            }}
          >
            <button
              onClick={handleOpen}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '11px',
                fontWeight: '600',
                backgroundColor: colorScheme.accent,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Open
            </button>
            <button
              onClick={handleStar}
              style={{
                padding: '6px 10px',
                fontSize: '14px',
                backgroundColor: starred ? '#fbbf24' : '#f5f5f5',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {starred ? '★' : '☆'}
            </button>
            {onArchive && (
              <button
                onClick={handleArchive}
                style={{
                  padding: '6px 10px',
                  fontSize: '14px',
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                title="Archive"
              >
                📥
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

LinkNode.displayName = 'LinkNode';

export default LinkNode;
