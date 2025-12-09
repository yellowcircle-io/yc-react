import React, { useState, useEffect } from 'react';

/**
 * WaitEditModal - Inline editor for UnityMAP wait nodes
 */
const WaitEditModal = ({ isOpen, onClose, waitData, onSave }) => {
  const [duration, setDuration] = useState(3);
  const [unit, setUnit] = useState('days');
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when modal opens
  useEffect(() => {
    if (isOpen && waitData) {
      setDuration(waitData.duration || 3);
      setUnit(waitData.unit || 'days');
    }
  }, [isOpen, waitData]);

  // Validate minimum 15 minutes (scheduler runs every 15 min)
  const getMinDuration = () => {
    switch (unit) {
      case 'minutes': return 15;
      case 'hours': return 1;
      case 'days': return 1;
      case 'weeks': return 1;
      default: return 1;
    }
  };

  const handleSave = async () => {
    // Enforce minimum duration
    const minDuration = getMinDuration();
    const finalDuration = Math.max(duration, minDuration);

    setIsSaving(true);
    try {
      await onSave({
        ...waitData,
        duration: finalDuration,
        unit,
        label: `Wait ${finalDuration} ${unit}`
      });
      onClose();
    } catch (error) {
      console.error('Failed to save wait:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: '400px',
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
            <span style={{ fontSize: '24px' }}>⏱️</span>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#111827'
            }}>
              Edit Wait Time
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
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Wait Duration
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
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
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 14px',
                border: '2px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#fff',
                color: '#111827',
                cursor: 'pointer',
                appearance: 'auto',
                WebkitAppearance: 'menulist'
              }}
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>

          <p style={{
            marginTop: '16px',
            fontSize: '13px',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            The sequence will pause for this duration before proceeding to the next step.
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

export default WaitEditModal;
