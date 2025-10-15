import React, { useState, useEffect } from 'react';

const EditMemoryModal = ({ isOpen, onClose, memory, onSave }) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  // Pre-fill form with existing data when modal opens
  useEffect(() => {
    if (isOpen && memory) {
      setLocation(memory.location || '');
      setDate(memory.date || '');
      setDescription(memory.description || '');
    }
  }, [isOpen, memory]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedData = {
      location: location.trim(),
      date: date.trim(),
      description: description.trim()
    };

    console.log('📝 Saving updated memory:', updatedData);
    onSave(updatedData);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '0',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          borderBottom: '2px solid white'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            letterSpacing: '0.2em',
            color: 'white',
            margin: 0
          }}>
            EDIT MEMORY
          </h3>
          <button
            onClick={onClose}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            style={{
              padding: '4px 12px',
              fontSize: '24px',
              border: 'none',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              lineHeight: 1,
              transition: 'color 0.3s ease',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseOver={(e) => e.target.style.color = '#EECF00'}
            onMouseOut={(e) => e.target.style.color = 'white'}
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Preview Image */}
            {memory?.imageUrl && (
              <div style={{
                marginBottom: '12px',
                borderRadius: '0',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <img
                  src={memory.imageUrl}
                  alt="Memory preview"
                  crossOrigin="anonymous"
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}

            {/* Location */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.1em',
                color: 'white',
                marginBottom: '8px'
              }}>
                LOCATION
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Edinburgh Castle, Scotland"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0',
                  fontSize: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#EECF00';
                  e.target.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              />
            </div>

            {/* Date */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.1em',
                color: 'white',
                marginBottom: '8px'
              }}>
                DATE
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g., August 2023"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0',
                  fontSize: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#EECF00';
                  e.target.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                letterSpacing: '0.1em',
                color: 'white',
                marginBottom: '8px'
              }}>
                DESCRIPTION (OPTIONAL)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the story behind this memory..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0',
                  fontSize: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  resize: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Arial, sans-serif'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#EECF00';
                  e.target.style.backgroundColor = 'rgba(238, 207, 0, 0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={handleCancel}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancel();
                }}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '0',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  transition: 'all 0.3s ease',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                CANCEL
              </button>
              <button
                type="submit"
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit(e);
                }}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  backgroundColor: '#EECF00',
                  color: 'black',
                  border: 'none',
                  borderRadius: '0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  boxShadow: '0 4px 12px rgba(238, 207, 0, 0.3)',
                  transition: 'all 0.3s ease',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#fbbf24';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(238, 207, 0, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#EECF00';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(238, 207, 0, 0.3)';
                }}
              >
                SAVE CHANGES
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditMemoryModal;
