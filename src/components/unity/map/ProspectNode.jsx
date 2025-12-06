import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * ProspectNode - Entry point for UnityMAP journeys
 *
 * Represents a prospect list or segment that starts a campaign journey.
 * Only has output handle (prospects flow out to email sequences).
 *
 * The prospect node is the "source of truth" for the campaign - clicking
 * "Edit Campaign" returns to Hub/Generator to modify the entire sequence.
 */
const ProspectNode = memo(({ id, data, selected }) => {
  const {
    label = 'Prospects',
    count = 0,
    segment = 'All',
    tags = [],
    source = 'manual', // 'manual', 'airtable', 'firebase', 'csv'
    status = 'draft', // 'draft', 'deployed', 'active', 'paused'
    onEditCampaign, // Callback to edit entire campaign in Hub/Generator
    onDeploy // Callback to deploy/add prospects
  } = data;

  const statusConfig = {
    draft: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', label: 'Draft' },
    deployed: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'Ready' },
    active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', label: 'Active' },
    paused: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Paused' }
  };

  const currentStatus = statusConfig[status] || statusConfig.draft;

  const sourceIcons = {
    manual: '✏️',
    airtable: '📊',
    firebase: '🔥',
    csv: '📄'
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: selected ? '3px solid #EECF00' : '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '180px',
        boxShadow: selected
          ? '0 8px 24px rgba(238, 207, 0, 0.3)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '20px' }}>👥</span>
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.05em',
          color: '#374151',
          textTransform: 'uppercase'
        }}>
          {label}
        </span>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Count</span>
          <span style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#EECF00',
            backgroundColor: 'rgba(238, 207, 0, 0.1)',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            {count}
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Segment</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
            {segment}
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Source</span>
          <span style={{ fontSize: '14px' }}>
            {sourceIcons[source] || '📋'}
          </span>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px solid #e5e7eb'
        }}>
          {tags.map((tag, i) => (
            <span
              key={i}
              style={{
                fontSize: '9px',
                fontWeight: '600',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Status Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          color: currentStatus.color,
          backgroundColor: currentStatus.bg,
          padding: '3px 10px',
          borderRadius: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {currentStatus.label}
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginTop: '10px'
      }}>
        {/* Deploy Button - Primary action */}
        {onDeploy && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeploy(id, data);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#111827',
              backgroundColor: status === 'draft' ? '#EECF00' : 'rgba(238, 207, 0, 0.2)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d4b800';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = status === 'draft' ? '#EECF00' : 'rgba(238, 207, 0, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>{status === 'draft' ? '🚀' : '➕'}</span>
            <span>{status === 'draft' ? 'Deploy' : 'Add Prospects'}</span>
          </button>
        )}

        {/* Edit Campaign Button */}
        {onEditCampaign && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditCampaign(id, data);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#6b7280',
              backgroundColor: 'rgba(107, 114, 128, 0.1)',
              border: '1px solid rgba(107, 114, 128, 0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.2)';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.1)';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <span>✏️</span>
            <span>Edit Campaign</span>
          </button>
        )}
      </div>

      {/* Output Handle - Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#EECF00',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
});

ProspectNode.displayName = 'ProspectNode';

export default ProspectNode;
