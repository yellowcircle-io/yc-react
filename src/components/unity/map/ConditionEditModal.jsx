import React, { useState, useEffect } from 'react';

/**
 * ConditionEditModal - Inline editor for UnityMAP condition nodes
 *
 * Supports standard conditions (opened, clicked, replied) and
 * custom conditions with field/operator/value configuration.
 */
const ConditionEditModal = ({ isOpen, onClose, conditionData, onSave }) => {
  const [conditionType, setConditionType] = useState('opened');
  const [waitDays, setWaitDays] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  // Custom condition state
  const [customField, setCustomField] = useState('email_domain');
  const [customOperator, setCustomOperator] = useState('equals');
  const [customValue, setCustomValue] = useState('');
  const [customLabel, setCustomLabel] = useState('');

  // Populate form when modal opens
  useEffect(() => {
    if (isOpen && conditionData) {
      setConditionType(conditionData.conditionType || 'opened');
      setWaitDays(conditionData.waitDays || 3);

      // Load custom condition data if present
      if (conditionData.customCondition) {
        setCustomField(conditionData.customCondition.field || 'email_domain');
        setCustomOperator(conditionData.customCondition.operator || 'equals');
        setCustomValue(conditionData.customCondition.value || '');
        setCustomLabel(conditionData.customCondition.label || '');
      }
    }
  }, [isOpen, conditionData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const conditionLabels = {
        opened: 'Email Opened?',
        clicked: 'Link Clicked?',
        replied: 'Got Reply?',
        custom: customLabel || buildCustomLabel()
      };

      const saveData = {
        ...conditionData,
        conditionType,
        waitDays,
        label: conditionLabels[conditionType] || 'Condition'
      };

      // Include custom condition data if type is custom
      if (conditionType === 'custom') {
        saveData.customCondition = {
          field: customField,
          operator: customOperator,
          value: customValue,
          label: customLabel || buildCustomLabel()
        };
      }

      await onSave(saveData);
      onClose();
    } catch (error) {
      console.error('Failed to save condition:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Build a human-readable label from custom condition parts
  const buildCustomLabel = () => {
    const fieldLabels = {
      email_domain: 'Email Domain',
      company_size: 'Company Size',
      industry: 'Industry',
      engagement_score: 'Engagement Score',
      open_count: 'Open Count',
      click_count: 'Click Count',
      days_since_last_activity: 'Days Since Activity',
      tag: 'Has Tag',
      list_membership: 'In List'
    };
    const operatorLabels = {
      equals: 'is',
      not_equals: 'is not',
      contains: 'contains',
      not_contains: 'does not contain',
      greater_than: '>',
      less_than: '<',
      greater_or_equal: '≥',
      less_or_equal: '≤',
      is_empty: 'is empty',
      is_not_empty: 'is not empty'
    };

    const field = fieldLabels[customField] || customField;
    const operator = operatorLabels[customOperator] || customOperator;

    if (['is_empty', 'is_not_empty'].includes(customOperator)) {
      return `${field} ${operator}`;
    }
    return `${field} ${operator} ${customValue}`;
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

          {/* Custom Condition Builder - Only show when custom is selected */}
          {conditionType === 'custom' && (
            <div style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #e5e7eb'
            }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Custom Condition Builder
              </label>

              {/* Field Selector */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '6px'
                }}>
                  Field
                </label>
                <select
                  value={customField}
                  onChange={(e) => setCustomField(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#111827',
                    cursor: 'pointer'
                  }}
                >
                  <optgroup label="Contact Properties">
                    <option value="email_domain">Email Domain</option>
                    <option value="company_size">Company Size</option>
                    <option value="industry">Industry</option>
                    <option value="job_title">Job Title</option>
                    <option value="location">Location</option>
                  </optgroup>
                  <optgroup label="Engagement Metrics">
                    <option value="engagement_score">Engagement Score</option>
                    <option value="open_count">Open Count</option>
                    <option value="click_count">Click Count</option>
                    <option value="reply_count">Reply Count</option>
                    <option value="days_since_last_activity">Days Since Last Activity</option>
                  </optgroup>
                  <optgroup label="Segmentation">
                    <option value="tag">Has Tag</option>
                    <option value="list_membership">In List</option>
                    <option value="source">Lead Source</option>
                  </optgroup>
                </select>
              </div>

              {/* Operator Selector */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '6px'
                }}>
                  Operator
                </label>
                <select
                  value={customOperator}
                  onChange={(e) => setCustomOperator(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#111827',
                    cursor: 'pointer'
                  }}
                >
                  <optgroup label="Text Operators">
                    <option value="equals">Equals</option>
                    <option value="not_equals">Does Not Equal</option>
                    <option value="contains">Contains</option>
                    <option value="not_contains">Does Not Contain</option>
                    <option value="starts_with">Starts With</option>
                    <option value="ends_with">Ends With</option>
                  </optgroup>
                  <optgroup label="Number Operators">
                    <option value="greater_than">Greater Than (&gt;)</option>
                    <option value="less_than">Less Than (&lt;)</option>
                    <option value="greater_or_equal">Greater or Equal (≥)</option>
                    <option value="less_or_equal">Less or Equal (≤)</option>
                  </optgroup>
                  <optgroup label="Existence">
                    <option value="is_empty">Is Empty</option>
                    <option value="is_not_empty">Is Not Empty</option>
                  </optgroup>
                </select>
              </div>

              {/* Value Input - Hide for is_empty/is_not_empty */}
              {!['is_empty', 'is_not_empty'].includes(customOperator) && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#6b7280',
                    marginBottom: '6px'
                  }}>
                    Value
                  </label>
                  <input
                    type="text"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Enter comparison value..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#fff',
                      color: '#111827',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Custom Label (optional) */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '6px'
                }}>
                  Display Label (optional)
                </label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder={buildCustomLabel() || 'Auto-generated from condition'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    color: '#111827',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Preview */}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fef3c7',
                borderRadius: '6px',
                border: '1px solid #fcd34d'
              }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#92400e',
                  textTransform: 'uppercase',
                  marginBottom: '4px'
                }}>
                  Condition Preview
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#78350f'
                }}>
                  {customLabel || buildCustomLabel() || 'Configure condition above'}
                </div>
              </div>
            </div>
          )}

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
