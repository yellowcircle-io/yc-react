import React, { memo } from 'react';

/**
 * BookmarksTab - Displays bookmarked/starred capsules AND starred nodes
 */

// Node type icons for display
const NODE_TYPE_ICONS = {
  stickyNode: '📝',
  textNode: '📄',
  photoNode: '🖼️',
  todoNode: '✅',
  videoNode: '🎬',
  linkNode: '🔗',
  commentNode: '💬',
  codeBlockNode: '💻',
  colorSwatchNode: '🎨',
  groupNode: '📦',
  aiChatNode: '🤖',
};

const BookmarksTab = memo(({ capsules = [], starredNodes = [], onLoad, onUnstar, onNodeClick, onUnstarNode }) => {
  const hasNoItems = capsules.length === 0 && starredNodes.length === 0;

  if (hasNoItems) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#6b7280',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>⭐</div>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No saved items</p>
        <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
          Star capsules or nodes to quickly access them here
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px' }}>
      {/* Starred Nodes Section */}
      {starredNodes.length > 0 && (
        <>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '4px 0 8px',
            }}
          >
            Starred Nodes ({starredNodes.length})
          </div>
          {starredNodes.map((node) => {
            const icon = NODE_TYPE_ICONS[node.type] || '📎';
            const title = node.data?.title || node.data?.label || node.data?.content?.substring(0, 30) || 'Untitled';
            return (
              <div
                key={node.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  backgroundColor: '#fefce8',
                  borderRadius: '8px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  borderLeft: '3px solid #fbbf24',
                }}
                onClick={() => onNodeClick?.(node)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef9c3'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fefce8'}
              >
                {/* Type icon */}
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fef3c7',
                    borderRadius: '6px',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </span>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                    {node.type?.replace('Node', '')}
                  </div>
                </div>

                {/* Unstar button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnstarNode?.(node.id);
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#fbbf24',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef3c7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Unstar node"
                >
                  ★
                </button>
              </div>
            );
          })}
        </>
      )}

      {/* Capsules Section */}
      {capsules.length > 0 && (
        <>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: starredNodes.length > 0 ? '12px 0 8px' : '4px 0 8px',
            }}
          >
            Saved Capsules ({capsules.length})
          </div>
          {capsules.map((capsule) => (
            <div
              key={capsule.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onClick={() => onLoad?.(capsule)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              {/* Thumbnail or icon */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                {capsule.thumbnail ? (
                  <img
                    src={capsule.thumbnail}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                  />
                ) : (
                  '📦'
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {capsule.title || 'Untitled Capsule'}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '4px',
                  }}
                >
                  {capsule.stats?.nodeCount || capsule.nodeCount || 0} nodes
                  {capsule.updatedAt && (
                    <span style={{ marginLeft: '8px' }}>
                      {/* Handle both Firestore Timestamp and regular Date */}
                      {capsule.updatedAt.toDate
                        ? capsule.updatedAt.toDate().toLocaleDateString()
                        : new Date(capsule.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Unstar button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnstar?.(capsule.id);
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#fbbf24',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef3c7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Remove from saved"
              >
                ★
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
});

BookmarksTab.displayName = 'BookmarksTab';

export default BookmarksTab;
