import React, { useState, useEffect } from 'react';

/**
 * ConditionEditModal - Inline editor for UnityMAP condition nodes
 */
const ConditionEditModal = ({ isOpen, onClose, conditionData, onSave }) => {
  const [conditionType, setConditionType] = useState('opened');
  const [waitDays, setWaitDays] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when modal opens
  useEffect(() => {
    if (isOpen && conditionData) {
      setConditionType(conditionData.conditionType || 'opened');
      setWaitDays(conditionData.waitDays || 3);
    }
  }, [isOpen, conditionData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const conditionLabels = {
        opened: 'Email Opened?',
        clicked: 'Link Clicked?',
        replied: 'Got Reply?',
        custom: 'Custom Condition'
      };
      await onSave({
        ...conditionData,
        conditionType,
        waitDays,
        label: conditionLabels[conditionType] || 'Condition'
      });
      onClose();
    } catch (error) {
      console.error('Failed to save condition:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const conditionOptions = [
    { value: 'opened', label: 'Email Opened?', icon: '👁️', description: 'Check if the recipient opened the email' },
    { value: 'clicked', label: 'Link Clicked?', icon: '🖱️', description: 'Check if a link in the email was clicked' },
    { value: 'replied', label: 'Got Reply?', icon: '💬', description: 'Check if the recipient replied' },
    { value: 'custom', label: 'Custom Condition', icon: '⚙️', description: 'Define a custom condition (advanced)' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '450px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🔀</span>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#111827'
            }}>
              Edit Condition
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Condition Type */}
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Condition Type
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {conditionOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setConditionType(option.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  border: conditionType === option.value
                    ? '2px solid #f59e0b'
                    : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: conditionType === option.value
                    ? '#fef3c7'
                    : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '20px' }}>{option.icon}</span>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {option.label}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginTop: '2px'
                  }}>
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Wait Days */}
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Evaluation Delay
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="number"
              min="1"
              value={waitDays}
              onChange={(e) => setWaitDays(parseInt(e.target.value) || 1)}
              style={{
                width: '100px',
                padding: '12px 14px',
                border: '2px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#fff',
                color: '#111827'
              }}
            />
            <span style={{
              fontSize: '14px',
              color: '#374151',
              fontWeight: '500'
            }}>
              days after sending
            </span>
          </div>

          <p style={{
            marginTop: '16px',
            fontSize: '13px',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            The condition will be evaluated after this many days, then route contacts to the appropriate branch.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#f59e0b',
              color: '#000',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConditionEditModal;
