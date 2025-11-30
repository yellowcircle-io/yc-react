import React, { useState, useRef, useEffect } from 'react';
import Lottie from 'lottie-react';
import { useLayout } from '../../contexts/LayoutContext';
import settingsAnimation from '../../../design-assets/settings-gear.json';

/**
 * UnityCircleNav - Custom CircleNav for Unity Notes
 *
 * Features:
 * - Centered yellow circle with "+" icon
 * - Settings gear to the right
 * - Click: Opens Add Note dialog
 * - Right-click/Long-press: Opens options menu (Export, Import, Share, Clear, Footer)
 */

// Plus Icon Circle Component
const PlusIconCircle = ({ size = 78, isHovered = false }) => {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: 'rgb(251, 191, 36)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: isHovered
        ? '0 8px 24px rgba(238, 207, 0, 0.5)'
        : '0 4px 12px rgba(238, 207, 0, 0.3)',
      transition: 'box-shadow 0.3s ease, transform 0.2s ease',
      transform: isHovered ? 'scale(1.05)' : 'scale(1)'
    }}>
      {/* Plus Icon */}
      <svg
        viewBox="0 0 40 40"
        width="40"
        height="40"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <path
          d="M20,10 L20,30 M10,20 L30,20"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// Settings Gear Button - Perfect circle with Lottie animation, overlapping bottom-right
const SettingsGear = ({ onClick, isHovered, onHover }) => {
  const size = 32; // Fixed size ensures perfect circle

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        position: 'absolute',
        bottom: '-6px',
        right: '-6px',
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        aspectRatio: '1 / 1',
        borderRadius: '50%',
        backgroundColor: isHovered ? 'rgba(75, 85, 99, 0.98)' : 'rgba(107, 114, 128, 0.9)',
        border: '2px solid white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        transition: 'all 0.2s ease',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        boxShadow: isHovered ? '0 3px 10px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.25)',
        zIndex: 10,
        overflow: 'hidden'
      }}
      title="Options"
    >
      <div style={{
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'invert(1) brightness(2)'
      }}>
        <Lottie
          key={`gear-${isHovered ? 'playing' : 'stopped'}`}
          animationData={settingsAnimation}
          loop={isHovered}
          autoplay={isHovered}
          style={{
            width: 20,
            height: 20
          }}
        />
      </div>
    </button>
  );
};

// Options Menu Component
const OptionsMenu = ({
  isOpen,
  onClose,
  onAddNote,
  onExport,
  onImport,
  onShare,
  onClear,
  onFooter,
  isSaving = false,
  hasNotes = false
}) => {
  if (!isOpen) return null;

  const menuItems = [
    { label: '+ ADD NOTE', action: onAddNote, color: '#EECF00', textColor: 'black', hoverColor: '#fbbf24' },
    { label: 'EXPORT', action: onExport, color: '#3b82f6', textColor: 'white', hoverColor: '#2563eb' },
    { label: 'IMPORT', action: onImport, color: '#8b5cf6', textColor: 'white', hoverColor: '#7c3aed' },
    {
      label: isSaving ? 'SAVING...' : 'SHARE',
      action: onShare,
      color: hasNotes ? '#10b981' : 'rgba(16, 185, 129, 0.3)',
      textColor: 'white',
      hoverColor: '#059669',
      disabled: isSaving || !hasNotes
    },
    { label: 'CLEAR', action: onClear, color: '#dc2626', textColor: 'white', hoverColor: '#b91c1c' },
    { label: 'FOOTER', action: onFooter, color: '#6b7280', textColor: 'white', hoverColor: '#4b5563', separator: true }
  ];

  return (
    <div
      data-context-menu
      style={{
        position: 'fixed',
        bottom: '130px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '8px',
        borderRadius: '4px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        zIndex: 400,
        minWidth: '180px',
        animation: 'menuSlideUp 0.2s ease-out'
      }}
    >
      <style>{`
        @keyframes menuSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {menuItems.map((item, index) => (
        <React.Fragment key={item.label}>
          {item.separator && (
            <div style={{
              height: '1px',
              backgroundColor: '#e5e5e5',
              margin: '4px 0'
            }} />
          )}
          <button
            onClick={() => {
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
            disabled={item.disabled}
            style={{
              width: '100%',
              padding: item.label === '+ ADD NOTE' ? '10px 12px' : '8px 12px',
              backgroundColor: item.color,
              color: item.textColor,
              border: 'none',
              borderRadius: '0',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              fontSize: item.label === '+ ADD NOTE' ? '10px' : '9px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              marginBottom: index < menuItems.length - 1 && !menuItems[index + 1]?.separator ? '4px' : '0',
              opacity: item.disabled ? 0.5 : 1,
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              if (!item.disabled) {
                e.target.style.backgroundColor = item.hoverColor;
              }
            }}
            onMouseOut={(e) => {
              if (!item.disabled) {
                e.target.style.backgroundColor = item.color;
              }
            }}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

function UnityCircleNav({
  onAddNote,
  onExport,
  onImport,
  onShare,
  onClear,
  onFooter,
  isSaving = false,
  hasNotes = false
}) {
  const { footerOpen } = useLayout();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isCircleHovered, setIsCircleHovered] = useState(false);
  const [isGearHovered, setIsGearHovered] = useState(false);
  const containerRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showOptionsMenu && containerRef.current && !containerRef.current.contains(e.target) && !e.target.closest('[data-context-menu]')) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showOptionsMenu]);

  // Click opens Add Note dialog directly
  const handleCircleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddNote) onAddNote();
  };

  // Right-click opens options menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptionsMenu(!showOptionsMenu);
  };

  // Handle long press for mobile context menu
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  const handleTouchStart = () => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setShowOptionsMenu(true);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    // If long press didn't trigger, treat as normal tap (add note)
    if (!longPressTriggered.current) {
      if (onAddNote) onAddNote();
    }
    longPressTriggered.current = false;
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTriggered.current = false;
  };

  // Gear click opens options menu
  const handleGearClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptionsMenu(!showOptionsMenu);
  };

  return (
    <div ref={containerRef}>
      {/* Main Circle + Gear Container - Centered */}
      <div
        style={{
          position: 'fixed',
          bottom: '50px',
          left: '50%',
          transform: footerOpen
            ? 'translateX(-50%) translateY(-300px)'
            : 'translateX(-50%)',
          zIndex: 350,
          transition: 'transform 0.5s ease-out'
        }}
      >
        {/* Circle with overlapping gear wrapper */}
        <div
          style={{
            position: 'relative',
            display: 'inline-block'
          }}
        >
          {/* Main Plus Circle */}
          <div
            className="clickable-element"
            onClick={handleCircleClick}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onMouseEnter={() => setIsCircleHovered(true)}
            onMouseLeave={() => setIsCircleHovered(false)}
            style={{
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent'
            }}
            title="Add Note (right-click for options)"
          >
            <PlusIconCircle size={78} isHovered={isCircleHovered} />
          </div>

          {/* Settings Gear - Overlapping bottom-right */}
          <SettingsGear
            onClick={handleGearClick}
            isHovered={isGearHovered}
            onHover={setIsGearHovered}
          />
        </div>
      </div>

      {/* Options Menu */}
      <OptionsMenu
        isOpen={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        onAddNote={onAddNote}
        onExport={onExport}
        onImport={onImport}
        onShare={onShare}
        onClear={onClear}
        onFooter={onFooter}
        isSaving={isSaving}
        hasNotes={hasNotes}
      />
    </div>
  );
}

export default UnityCircleNav;
