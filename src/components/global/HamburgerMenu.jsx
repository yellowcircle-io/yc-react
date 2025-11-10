import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Shared Hamburger Menu Component
 * Fullscreen overlay menu with animated navigation items
 */
const HamburgerMenu = ({
  isOpen = false,
  onClose,
  menuItems = [],
  customStyles = {}
}) => {
  const navigate = useNavigate();

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(242, 242, 242, 0.98)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isOpen ? 1 : 0,
      transition: 'opacity 0.3s ease-out',
      ...customStyles.container
    }}>
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '30px',
          right: '30px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease-out',
          zIndex: 2001
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1)'}
        aria-label="Close menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Menu Items */}
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        ...customStyles.nav
      }}>
        {menuItems.map((item, index) => (
          <button
            key={item.id || index}
            type="button"
            onClick={() => handleItemClick(item)}
            style={{
              fontSize: item.fontSize || '32px',
              fontWeight: item.fontWeight || '600',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'black',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '12px 24px',
              transition: 'color 0.2s ease-out, transform 0.2s ease-out',
              font: 'inherit',
              opacity: 0,
              transform: 'translateY(20px)',
              animation: isOpen ? `slideInUp 0.4s ease-out ${index * 0.1}s forwards` : 'none',
              ...customStyles.item
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#EECF00';
              e.target.style.transform = 'translateY(0) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'black';
              e.target.style.transform = 'translateY(0) scale(1)';
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Animation keyframes injected via style tag */}
      <style>
        {`
          @keyframes slideInUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default HamburgerMenu;
