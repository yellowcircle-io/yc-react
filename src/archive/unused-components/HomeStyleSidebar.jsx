import React from 'react';

/**
 * Home-Style Sidebar Component
 * Shared sidebar for ExperimentsPage and ThoughtsPage
 * Supports image-based icons and NavigationItem accordion behavior
 */
const HomeStyleSidebar = ({
  isOpen,
  onToggle,
  expandedSection,
  onExpandSection,
  pageLabel,
  pageLabelColor,
  logoSrc,
  navigationItems
}) => {
  // Navigation Item Component
  const NavigationItem = ({ icon, label, subItems, itemKey, index }) => {
    const isExpanded = expandedSection === itemKey && isOpen;

    let topPosition = index * 50;
    for (let i = 0; i < index; i++) {
      const prevItemKey = navigationItems[i]?.itemKey;
      if (expandedSection === prevItemKey && isOpen) {
        const prevSubItems = navigationItems[i]?.subItems || [];
        topPosition += prevSubItems.length * 18 + 5;
      }
    }

    const handleClick = () => {
      if (!isOpen) {
        onToggle();
        onExpandSection(itemKey);
      } else {
        onExpandSection(expandedSection === itemKey ? null : itemKey);
      }
    };

    return (
      <div style={{
        position: 'absolute',
        top: `${topPosition}px`,
        left: 0,
        width: '100%',
        transition: 'top 0.3s ease-out'
      }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 0',
            position: 'relative',
            minHeight: '40px',
            width: '100%'
          }}
        >
          <div
            className="clickable-element"
            onClick={handleClick}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleClick();
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: 'pointer',
              zIndex: 3,
              WebkitTapHighlightColor: 'transparent'
            }}
          />

          <div style={{
            position: 'absolute',
            left: '40px',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none'
          }}>
            <img
              src={icon}
              alt={label}
              width="24"
              height="24"
              style={{ display: 'block' }}
            />
          </div>

          {isOpen && (
            <span style={{
              position: 'absolute',
              left: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isExpanded ? '#EECF00' : 'black',
              fontSize: '14px',
              fontWeight: isExpanded ? '700' : '600',
              letterSpacing: '0.2em',
              transition: 'color 0.3s ease-out, font-weight 0.3s ease-out',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}>{label}</span>
          )}
        </div>

        {isOpen && (
          <div style={{
            marginLeft: '75px',
            marginTop: '-5px',
            maxHeight: isExpanded ? `${(subItems?.length || 0) * 18 + 5}px` : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-out'
          }}>
            {subItems && (
              <div style={{ paddingTop: '0px', paddingBottom: '0px' }}>
                {subItems.map((item, idx) => (
                  <a key={idx} href="#" className="clickable-element" style={{
                    display: 'block',
                    color: 'rgba(0,0,0,0.7)',
                    fontSize: '12px',
                    fontWeight: '500',
                    letterSpacing: '0.1em',
                    textDecoration: 'none',
                    padding: '1px 0',
                    transition: 'color 0.25s ease-in-out',
                    opacity: isExpanded ? 1 : 0,
                    transitionDelay: isExpanded ? `${idx * 0.05}s` : '0s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#EECF00';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'rgba(0,0,0,0.7)';
                  }}
                  >{item}</a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: isOpen ? 'min(30vw, 450px)' : '80px',
      height: '100vh',
      backgroundColor: 'rgba(242, 242, 242, 0.96)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 50,
      transition: 'width 0.5s ease-out',
    }}>

      <div
        className="clickable-element"
        onClick={onToggle}
        onTouchEnd={(e) => {
          e.preventDefault();
          onToggle();
        }}
        style={{
          position: 'absolute',
          top: '20px',
          left: '40px',
          transform: 'translateX(-50%)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          width: '40px',
          height: '40px',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 16 16">
          <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2z"/>
          <path d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
        </svg>
      </div>

      <div style={{
        position: 'absolute',
        top: pageLabel === 'EXPERIMENTS' ? '140px' : '100px',
        left: '40px',
        transform: 'translateX(-50%) rotate(-90deg)',
        transformOrigin: 'center',
        whiteSpace: 'nowrap'
      }}>
        <span style={{
          color: pageLabelColor,
          fontWeight: '600',
          letterSpacing: '0.3em',
          fontSize: '14px'
        }}>{pageLabel}</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          transform: 'translateY(-50%)',
          width: '100%',
          height: '240px'
        }}
      >
        {navigationItems.map((item, index) => (
          <NavigationItem
            key={item.itemKey}
            {...item}
            index={index}
          />
        ))}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(40px, 8vw)',
        height: 'min(40px, 8vw)',
        minWidth: '30px',
        minHeight: '30px',
        borderRadius: '50%',
        overflow: 'hidden'
      }}>
        <img
          src={logoSrc}
          alt="YC Logo"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    </div>
  );
};

export default HomeStyleSidebar;
