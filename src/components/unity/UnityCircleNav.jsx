import React, { useState, useRef, useEffect } from 'react';
import LottieIcon from '../shared/LottieIcon';
import { useLayout } from '../../contexts/LayoutContext';
// Import Lottie JSON files directly for reliability
import settingsAnimation from '../../assets/lottie/settings-gear.json';
import addAnimation from '../../assets/lottie/add.json';

/**
 * UnityCircleNav - Custom CircleNav for UnityNotes
 *
 * v2 Features:
 * - Centered yellow circle with Lottie "+" animation inside a pill UI
 * - Options button on left side of pill
 * - AI button on right side of pill (canvas AI with write capabilities)
 * - Settings gear overlapping bottom-right of main circle
 * - Click main circle: Opens Add Note dialog
 * - Right-click/Long-press: Opens options menu
 */

// Add Icon Circle Component with Lottie animation
const AddIconCircle = ({ size = 64, isHovered = false }) => {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: 'rgb(251, 191, 36)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: isHovered
        ? '0 6px 20px rgba(251, 191, 36, 0.5)'
        : '0 3px 10px rgba(251, 191, 36, 0.3)',
      transition: 'box-shadow 0.3s ease, transform 0.2s ease',
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <LottieIcon
        animationData={addAnimation}
        size={size * 0.7}
        isHovered={isHovered}
        useGrayscale={false}
        alt="Add note"
      />
    </div>
  );
};

// Settings Gear Button - Perfect circle with Lottie animation
const SettingsGear = ({ onClick, isHovered, onHover }) => {
  const size = 28;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        position: 'absolute',
        bottom: '-4px',
        right: '-4px',
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
        width: '16px',
        height: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'invert(1) brightness(2) grayscale(1)'
      }}>
        <LottieIcon
          animationData={settingsAnimation}
          size={16}
          isHovered={isHovered}
          useGrayscale={false}
          alt="Settings"
        />
      </div>
    </button>
  );
};

// Pill Button Component - Used for Options and AI
const PillButton = ({ label, icon, onClick, isHovered, onHover, position, isActive = false }) => {
  const isLeft = position === 'left';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '8px 12px',
        backgroundColor: isActive
          ? 'rgba(251, 191, 36, 0.2)'
          : isHovered
            ? 'rgba(255, 255, 255, 0.15)'
            : 'transparent',
        border: 'none',
        borderRadius: isLeft ? '20px 0 0 20px' : '0 20px 20px 0',
        cursor: 'pointer',
        color: isActive ? 'rgb(251, 191, 36)' : 'rgba(255, 255, 255, 0.8)',
        fontSize: '10px',
        fontWeight: '600',
        letterSpacing: '0.03em',
        transition: 'all 0.2s ease',
        textTransform: 'uppercase',
        minWidth: '60px',
      }}
      title={label}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span>{label}</span>
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
  onToggleParallax,
  showParallax = true,
  isSaving = false,
  hasNotes = false,
  currentMode = 'notes',
  onAddEmail,
  onAddWait,
  onAddCondition,
  emailCount = 0,
  emailLimit = 3,
}) => {
  if (!isOpen) return null;

  const canAddEmail = emailCount < emailLimit;

  // Different menu items based on mode
  const notesMenuItems = [
    { label: '+ ADD NOTE', action: onAddNote, color: 'rgb(251, 191, 36)', textColor: 'black', hoverColor: '#d4a000' },
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
    { label: 'CLEAR', action: onClear, color: '#dc2626', textColor: 'white', hoverColor: '#b91c1c', separator: true },
    {
      label: showParallax ? 'HIDE PARALLAX' : 'SHOW PARALLAX',
      action: onToggleParallax,
      color: '#6b7280',
      textColor: 'white',
      hoverColor: '#4b5563'
    },
    { label: 'FOOTER', action: onFooter, color: '#1f2937', textColor: 'white', hoverColor: '#111827' }
  ];

  const mapMenuItems = [
    {
      label: canAddEmail ? `+ ADD EMAIL (${emailCount}/${emailLimit})` : `LIMIT REACHED (${emailLimit})`,
      action: onAddEmail,
      color: canAddEmail ? 'rgb(251, 191, 36)' : 'rgba(251, 191, 36, 0.3)',
      textColor: 'black',
      hoverColor: '#d4a000',
      disabled: !canAddEmail
    },
    { label: '+ ADD WAIT', action: onAddWait, color: 'rgba(238, 207, 0, 0.85)', textColor: 'black', hoverColor: '#d4a000' },
    { label: '+ ADD CONDITION', action: onAddCondition, color: 'rgba(238, 207, 0, 0.7)', textColor: 'black', hoverColor: '#d4a000', separator: true },
    {
      label: 'NEW CAMPAIGN',
      action: () => {
        const origin = localStorage.getItem('unity-outreach-origin') || '/outreach';
        window.location.href = `${origin}?from=unity-map`;
      },
      color: 'rgba(238, 207, 0, 0.5)',
      textColor: 'black',
      hoverColor: '#d4a000'
    },
    { label: 'EXPORT', action: onExport, color: '#6b7280', textColor: 'white', hoverColor: '#4b5563' },
    { label: 'CLEAR', action: onClear, color: '#dc2626', textColor: 'white', hoverColor: '#b91c1c' },
    { label: 'FOOTER', action: onFooter, color: '#1f2937', textColor: 'white', hoverColor: '#111827' }
  ];

  const menuItems = currentMode === 'map' ? mapMenuItems : notesMenuItems;

  return (
    <div
      data-context-menu
      style={{
        position: 'fixed',
        bottom: '115px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '6px',
        borderRadius: '4px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        zIndex: 400,
        minWidth: '160px',
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
              margin: '3px 0'
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
              padding: item.label === '+ ADD NOTE' ? '8px 10px' : '6px 10px',
              backgroundColor: item.color,
              color: item.textColor,
              border: 'none',
              borderRadius: '0',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              fontSize: item.label === '+ ADD NOTE' ? '9px' : '8px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              marginBottom: index < menuItems.length - 1 && !menuItems[index + 1]?.separator ? '3px' : '0',
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

// AI Menu Component
const AIMenu = ({ isOpen, onClose, onGenerateNote, onGenerateImage, onSummarize }) => {
  if (!isOpen) return null;

  const aiActions = [
    { label: '✨ GENERATE NOTE', action: onGenerateNote, description: 'AI creates a new note' },
    { label: '🖼️ GENERATE IMAGE', action: onGenerateImage, description: 'Create AI image card' },
    { label: '📋 SUMMARIZE ALL', action: onSummarize, description: 'Summarize canvas notes' },
  ];

  return (
    <div
      data-ai-menu
      style={{
        position: 'fixed',
        bottom: '115px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '8px',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(251, 191, 36, 0.2)',
        zIndex: 400,
        minWidth: '180px',
        animation: 'aiMenuSlideUp 0.2s ease-out'
      }}
    >
      <style>{`
        @keyframes aiMenuSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{
        fontSize: '8px',
        fontWeight: '700',
        color: 'rgb(251, 191, 36)',
        letterSpacing: '0.1em',
        marginBottom: '8px',
        paddingLeft: '4px',
      }}>
        AI CANVAS ACTIONS
      </div>

      {aiActions.map((item, index) => (
        <button
          key={item.label}
          onClick={() => {
            if (item.action) item.action();
            onClose();
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            color: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.02em',
            marginBottom: index < aiActions.length - 1 ? '4px' : '0',
            transition: 'all 0.2s',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>{item.label}</span>
          <span style={{
            fontSize: '8px',
            color: 'rgba(255, 255, 255, 0.4)',
            fontWeight: '400',
          }}>
            {item.description}
          </span>
        </button>
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
  onToggleParallax,
  showParallax = true,
  isSaving = false,
  hasNotes = false,
  currentMode = 'notes',
  onAddEmail,
  onAddWait,
  onAddCondition,
  onEditCampaign,
  emailCount = 0,
  emailLimit = 3,
  hasCampaign = false,
  // AI actions
  onAIGenerateNote,
  onAIGenerateImage,
  onAISummarize,
}) {
  const { footerOpen } = useLayout();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [isCircleHovered, setIsCircleHovered] = useState(false);
  const [isGearHovered, setIsGearHovered] = useState(false);
  const [isOptionsHovered, setIsOptionsHovered] = useState(false);
  const [isAIHovered, setIsAIHovered] = useState(false);
  const containerRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) &&
          !e.target.closest('[data-context-menu]') && !e.target.closest('[data-ai-menu]')) {
        setShowOptionsMenu(false);
        setShowAIMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
    setShowAIMenu(false);
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
    }, 500);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
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
    setShowAIMenu(false);
    setShowOptionsMenu(!showOptionsMenu);
  };

  // Options button click
  const handleOptionsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAIMenu(false);
    setShowOptionsMenu(!showOptionsMenu);
  };

  // AI button click
  const handleAIClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptionsMenu(false);
    setShowAIMenu(!showAIMenu);
  };

  return (
    <div ref={containerRef}>
      {/* Main Pill Container - Centered */}
      <div
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: footerOpen
            ? 'translateX(-50%) translateY(-300px)'
            : 'translateX(-50%)',
          zIndex: 350,
          transition: 'transform 0.5s ease-out'
        }}
      >
        {/* Pill UI with Options | Circle | AI */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '40px',
            padding: '6px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Options Button - Left */}
          <PillButton
            label="Options"
            icon="⚙️"
            onClick={handleOptionsClick}
            isHovered={isOptionsHovered}
            onHover={setIsOptionsHovered}
            position="left"
            isActive={showOptionsMenu}
          />

          {/* Main Circle with Gear */}
          <div style={{ position: 'relative', margin: '0 4px' }}>
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
              <AddIconCircle size={64} isHovered={isCircleHovered} />
            </div>

            {/* Settings Gear - Overlapping bottom-right */}
            <SettingsGear
              onClick={handleGearClick}
              isHovered={isGearHovered}
              onHover={setIsGearHovered}
            />
          </div>

          {/* AI Button - Right */}
          <PillButton
            label="AI"
            icon="✨"
            onClick={handleAIClick}
            isHovered={isAIHovered}
            onHover={setIsAIHovered}
            position="right"
            isActive={showAIMenu}
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
        onToggleParallax={onToggleParallax}
        showParallax={showParallax}
        isSaving={isSaving}
        hasNotes={hasNotes}
        currentMode={currentMode}
        onAddEmail={onAddEmail}
        onAddWait={onAddWait}
        onAddCondition={onAddCondition}
        emailCount={emailCount}
        emailLimit={emailLimit}
      />

      {/* AI Menu */}
      <AIMenu
        isOpen={showAIMenu}
        onClose={() => setShowAIMenu(false)}
        onGenerateNote={onAIGenerateNote}
        onGenerateImage={onAIGenerateImage}
        onSummarize={onAISummarize}
      />
    </div>
  );
}

export default UnityCircleNav;
