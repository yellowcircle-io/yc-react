import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * ConditionNode - Branch logic in UnityMAP journey
 *
 * Creates conditional branches based on email engagement.
 * Has input handle (top) and two output handles (left=no, right=yes).
 * Click to edit condition settings.
 */
const ConditionNode = memo(({ id, data, selected }) => {
  const {
    label = 'Condition',
    conditionType = 'opened', // 'opened', 'clicked', 'replied', 'custom'
    operator = 'equals', // 'equals', 'contains', 'greater_than'
    value = true,
    waitDays = 3, // Days to wait before evaluating
    onInlineEdit // Edit handler
  } = data;

  const [isHovered, setIsHovered] = useState(false);

  const conditionIcons = {
    opened: '👁️',
    clicked: '🖱️',
    replied: '💬',
    custom: '⚙️'
  };

  const conditionLabels = {
    opened: 'Email Opened?',
    clicked: 'Link Clicked?',
    replied: 'Got Reply?',
    custom: 'Custom Condition'
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onInlineEdit) {
      onInlineEdit(id, data);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleEdit}
      style={{
        backgroundColor: '#fff',
        border: selected ? '3px solid #f59e0b' : '2px solid #fcd34d',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '160px',
        boxShadow: selected
          ? '0 8px 24px rgba(245, 158, 11, 0.3)'
          : isHovered
            ? '0 6px 20px rgba(245, 158, 11, 0.25)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        position: 'relative',
        cursor: 'pointer',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)'
      }}
    >
      {/* Input Handle - Top */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#f59e0b',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />

      {/* Diamond Shape Indicator */}
      <div style={{
        position: 'absolute',
        top: '-12px',
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: '24px',
        height: '24px',
        backgroundColor: '#f59e0b',
        borderRadius: '4px',
        zIndex: -1
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '24px' }}>{conditionIcons[conditionType]}</span>
        <span style={{
          fontSize: '12px',
          fontWeight: '700',
          color: '#374151',
          textAlign: 'center'
        }}>
          {conditionLabels[conditionType]}
        </span>
      </div>

      {/* Wait Period */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '6px 10px',
        backgroundColor: '#fef3c7',
        borderRadius: '6px',
        marginBottom: '8px'
      }}>
        <span style={{ fontSize: '12px' }}>⏳</span>
        <span style={{
          fontSize: '10px',
          fontWeight: '600',
          color: '#92400e'
        }}>
          After {waitDays} days
        </span>
      </div>

      {/* Branch Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12px'
      }}>
        <span style={{
          fontSize: '9px',
          fontWeight: '700',
          color: '#dc2626',
          textTransform: 'uppercase'
        }}>
          ← No
        </span>
        <span style={{
          fontSize: '9px',
          fontWeight: '700',
          color: '#10b981',
          textTransform: 'uppercase'
        }}>
          Yes →
        </span>
      </div>

      {/* Edit hint on hover */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          bottom: '-24px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '9px',
          fontWeight: '600',
          color: '#f59e0b',
          whiteSpace: 'nowrap'
        }}>
          Click to edit
        </div>
      )}

      {/* Output Handle - Left (No) */}
      <Handle
        type="source"
        position={Position.Left}
        id="no"
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#dc2626',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />

      {/* Output Handle - Right (Yes) */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#10b981',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode;
