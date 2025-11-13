import React from 'react';
import { useLayout } from '../../contexts/LayoutContext';

/**
 * NavigationCircle - Bottom-right navigation circle
 * Matches HomePage.jsx lines 1161-1194 exactly
 */
function NavigationCircle({ onClick, rotation = -90 }) {
  const { footerOpen } = useLayout();

  const handleClick = (e) => {
    if (onClick) onClick(e);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleClick(e);
  };

  return (
    <div
      className="clickable-element"
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        bottom: '50px',
        right: '50px',
        zIndex: 50,
        width: '78px',
        height: '78px',
        cursor: 'pointer',
        transform: footerOpen ? 'translateY(-300px)' : 'translateY(0)',
        transition: 'transform 0.5s ease-out',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <img
        src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494537/NavCircle_ioqlsr.png"
        alt="Navigation"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.3s ease-out',
          transformOrigin: 'center'
        }}
      />
    </div>
  );
}

export default NavigationCircle;
