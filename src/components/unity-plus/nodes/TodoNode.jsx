import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * TodoNode - Checklist/task list node
 *
 * Features:
 * - Add/remove todo items
 * - Check/uncheck items
 * - Edit item text
 * - Progress indicator
 * - Delete button on hover
 */

const TodoNode = memo(({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const items = data.items || [];
  const title = data.title || 'To-Do List';

  const handleTitleChange = (newTitle) => {
    if (data.onTitleChange && newTitle.trim()) {
      data.onTitleChange(id, newTitle.trim());
    }
    setIsEditingTitle(false);
  };
  const completedCount = items.filter(item => item.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const handleToggleItem = (index) => {
    if (data.onUpdateItems) {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], completed: !newItems[index].completed };
      data.onUpdateItems(id, newItems);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItemText.trim() && data.onUpdateItems) {
      const newItems = [...items, { text: newItemText.trim(), completed: false }];
      data.onUpdateItems(id, newItems);
      setNewItemText('');
    }
  };

  const handleRemoveItem = (index) => {
    if (data.onUpdateItems) {
      const newItems = items.filter((_, i) => i !== index);
      data.onUpdateItems(id, newItems);
    }
  };

  const handleEditItem = (index, newText) => {
    if (data.onUpdateItems) {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], text: newText };
      data.onUpdateItems(id, newItems);
    }
    setEditingIndex(-1);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '220px',
        backgroundColor: '#ffffff',
        border: `2px solid ${selected ? '#22c55e' : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: 'grab',
        position: 'relative',
        boxShadow: selected
          ? '0 8px 24px rgba(34, 197, 94, 0.25)'
          : isHovered
            ? '0 6px 16px rgba(0, 0, 0, 0.12)'
            : '0 4px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#22c55e',
          border: '2px solid #fff',
        }}
      />

      {/* Delete button - positioned directly on node like WaitNode */}
      {(isHovered || selected) && data.onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete(id);
          }}
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '24px',
            height: '24px',
            minWidth: '24px',
            minHeight: '24px',
            padding: 0,
            borderRadius: '50%',
            backgroundColor: '#374151',
            border: '2px solid white',
            color: 'white',
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            zIndex: 10,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1f2937';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#374151';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Delete node"
        >
          ×
        </button>
      )}

      {/* Star button - visible on hover or if starred */}
      {(isHovered || selected || data.isStarred) && data.onToggleStar && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleStar(id);
          }}
          className="nodrag"
          style={{
            position: 'absolute',
            top: '-6px',
            left: '-6px',
            width: '24px',
            height: '24px',
            minWidth: '24px',
            minHeight: '24px',
            padding: 0,
            borderRadius: '50%',
            backgroundColor: data.isStarred ? '#fbbf24' : '#6b7280',
            border: '2px solid white',
            color: 'white',
            fontSize: '12px',
            fontWeight: '400',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            zIndex: 10,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = data.isStarred ? '#f59e0b' : '#4b5563';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = data.isStarred ? '#fbbf24' : '#6b7280';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={data.isStarred ? 'Unstar node' : 'Star node'}
        >
          ★
        </button>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '18px' }}>✅</span>
        {isEditingTitle ? (
          <input
            type="text"
            defaultValue={title}
            autoFocus
            className="nodrag"
            onBlur={(e) => handleTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleChange(e.target.value);
              if (e.key === 'Escape') setIsEditingTitle(false);
            }}
            style={{
              flex: 1,
              margin: 0,
              padding: '2px 4px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#111827',
              border: '1px solid #22c55e',
              borderRadius: '4px',
              outline: 'none',
              backgroundColor: '#fff',
            }}
          />
        ) : (
          <h3
            onDoubleClick={() => setIsEditingTitle(true)}
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '700',
              color: '#111827',
              flex: 1,
              cursor: 'text',
            }}
            title="Double-click to edit title"
          >
            {title}
          </h3>
        )}
        <span style={{
          fontSize: '11px',
          fontWeight: '600',
          color: '#6b7280',
        }}>
          {completedCount}/{items.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '4px',
        backgroundColor: '#e5e7eb',
        borderRadius: '2px',
        marginBottom: '12px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: '#22c55e',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Todo items */}
      <div
        className="nowheel nodrag"
        style={{
          maxHeight: '200px',
          overflowY: 'auto',
          marginBottom: '8px',
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 0',
              borderBottom: index < items.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => handleToggleItem(index)}
              className="nodrag"
              style={{
                width: '16px',
                height: '16px',
                accentColor: '#22c55e',
                cursor: 'pointer',
              }}
            />
            {editingIndex === index ? (
              <input
                type="text"
                defaultValue={item.text}
                autoFocus
                className="nodrag"
                onBlur={(e) => handleEditItem(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditItem(index, e.target.value);
                  if (e.key === 'Escape') setEditingIndex(-1);
                }}
                style={{
                  flex: 1,
                  padding: '2px 4px',
                  border: '1px solid #22c55e',
                  borderRadius: '4px',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            ) : (
              <span
                onDoubleClick={() => setEditingIndex(index)}
                style={{
                  flex: 1,
                  fontSize: '12px',
                  color: item.completed ? '#9ca3af' : '#374151',
                  textDecoration: item.completed ? 'line-through' : 'none',
                  cursor: 'text',
                }}
              >
                {item.text}
              </span>
            )}
            <button
              onClick={() => handleRemoveItem(index)}
              className="nodrag"
              style={{
                width: '18px',
                height: '18px',
                padding: 0,
                border: 'none',
                backgroundColor: 'transparent',
                color: '#9ca3af',
                fontSize: '14px',
                cursor: 'pointer',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
              title="Remove item"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add new item */}
      <form onSubmit={handleAddItem} className="nodrag" style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add item..."
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '11px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!newItemText.trim()}
          style={{
            padding: '6px 10px',
            backgroundColor: newItemText.trim() ? '#22c55e' : '#e5e7eb',
            color: newItemText.trim() ? '#fff' : '#9ca3af',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: newItemText.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          +
        </button>
      </form>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#22c55e',
          border: '2px solid #fff',
        }}
      />
    </div>
  );
});

TodoNode.displayName = 'TodoNode';

export default TodoNode;
