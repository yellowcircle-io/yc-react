import React, { memo, useState, useMemo } from 'react';

/**
 * NodesTab - Displays all nodes on the current canvas with filtering
 */

const NODE_TYPE_INFO = {
  stickyNode: { icon: '📝', label: 'Sticky' },
  textNode: { icon: '📄', label: 'Note' },
  photoNode: { icon: '🖼️', label: 'Photo' },
  todoNode: { icon: '✅', label: 'Todo' },
  videoNode: { icon: '🎬', label: 'Video' },
  linkNode: { icon: '🔗', label: 'Link' },
  commentNode: { icon: '💬', label: 'Comment' },
  codeBlockNode: { icon: '💻', label: 'Code' },
  colorSwatchNode: { icon: '🎨', label: 'Palette' },
  groupNode: { icon: '📦', label: 'Group' },
  aiChatNode: { icon: '🤖', label: 'AI Chat' },
  prospectNode: { icon: '👤', label: 'Prospect' },
  emailNode: { icon: '✉️', label: 'Email' },
  waitNode: { icon: '⏱️', label: 'Wait' },
  conditionNode: { icon: '🔀', label: 'Condition' },
  exitNode: { icon: '🚪', label: 'Exit' },
};

const NodesTab = memo(({ nodes = [], onNodeClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Get available node types from current nodes
  const availableTypes = useMemo(() => {
    const types = new Set(nodes.map(n => n.type));
    return Array.from(types).sort();
  }, [nodes]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      // Skip child nodes (show only top-level)
      // Actually, let's show all nodes but indicate parent

      // Type filter
      if (typeFilter !== 'all' && node.type !== typeFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = (node.data?.title || node.data?.label || '').toLowerCase();
        const content = (node.data?.content || '').toLowerCase();
        return title.includes(query) || content.includes(query);
      }

      return true;
    });
  }, [nodes, typeFilter, searchQuery]);

  // Group by type for count
  const typeCounts = useMemo(() => {
    const counts = { all: nodes.length };
    nodes.forEach(node => {
      counts[node.type] = (counts[node.type] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  if (nodes.length === 0) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#6b7280',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}>📋</div>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No nodes yet</p>
        <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
          Add nodes to your canvas to see them here
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      {/* Type Filter */}
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <button
          onClick={() => setTypeFilter('all')}
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '500',
            backgroundColor: typeFilter === 'all' ? '#3b82f6' : '#f3f4f6',
            color: typeFilter === 'all' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
        >
          All ({typeCounts.all})
        </button>
        {availableTypes.map(type => {
          const info = NODE_TYPE_INFO[type] || { icon: '📎', label: type };
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '500',
                backgroundColor: typeFilter === type ? '#3b82f6' : '#f3f4f6',
                color: typeFilter === type ? 'white' : '#374151',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '12px' }}>{info.icon}</span>
              {typeCounts[type]}
            </button>
          );
        })}
      </div>

      {/* Node List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {filteredNodes.length === 0 ? (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px',
            }}
          >
            No matching nodes
          </div>
        ) : (
          filteredNodes.map((node) => {
            const info = NODE_TYPE_INFO[node.type] || { icon: '📎', label: node.type };
            const title = node.data?.title || node.data?.label || node.data?.content?.substring(0, 30) || 'Untitled';
            const hasParent = !!node.parentId;

            return (
              <div
                key={node.id}
                onClick={() => onNodeClick?.(node)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                  borderLeft: hasParent ? '3px solid #fbbf24' : '3px solid transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              >
                {/* Type icon */}
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  {info.icon}
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
                    {info.label}
                    {hasParent && <span style={{ marginLeft: '6px' }}>• In group</span>}
                  </div>
                </div>

                {/* Navigate indicator */}
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>→</span>
              </div>
            );
          })
        )}
      </div>

      {/* Summary footer */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #e5e7eb',
          fontSize: '11px',
          color: '#6b7280',
          textAlign: 'center',
        }}
      >
        {filteredNodes.length} of {nodes.length} nodes
      </div>
    </div>
  );
});

NodesTab.displayName = 'NodesTab';

export default NodesTab;
