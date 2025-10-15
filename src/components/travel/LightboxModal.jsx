import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const LightboxModal = ({ photo, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!photo) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        cursor: 'zoom-out'
      }}
      onClick={onClose}
      onTouchEnd={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClose();
        }}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
          WebkitTapHighlightColor: 'transparent',
          zIndex: 10000
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        <X size={24} color="white" strokeWidth={3} />
      </button>

      {/* Image Container */}
      <div
        style={{
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'default'
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <img
          src={photo.imageUrl}
          alt={photo.description || 'Travel memory'}
          crossOrigin="anonymous"
          style={{
            maxWidth: '100%',
            maxHeight: '70vh',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}
        />

        {/* Metadata Card */}
        {(photo.location || photo.date || photo.description) && (
          <div
            style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '100%',
              borderTop: '3px solid #fbbf24',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}
          >
            {photo.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '24px' }}>📍</span>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#000000',
                  margin: 0
                }}>
                  {photo.location}
                </h3>
              </div>
            )}

            {photo.date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: photo.description ? '10px' : '0' }}>
                <span style={{ fontSize: '18px' }}>📅</span>
                <p style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#333333',
                  margin: 0
                }}>
                  {photo.date}
                </p>
              </div>
            )}

            {photo.description && (
              <p style={{
                fontSize: '16px',
                fontWeight: '500',
                color: '#555555',
                marginTop: '8px',
                marginBottom: 0,
                lineHeight: '1.6'
              }}>
                {photo.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          fontWeight: '500',
          textAlign: 'center'
        }}
      >
        Click anywhere or press ESC to close
      </div>
    </div>
  );
};

export default LightboxModal;
