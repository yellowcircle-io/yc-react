import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';

// Company data for Works showcase
const COMPANIES = [
  { id: 'liveintent', name: 'LiveIntent', category: 'Ad Tech', year: '2019-2023' },
  { id: 'tunecore', name: 'TuneCore', category: 'Music', year: '2018-2019' },
  { id: 'thimble', name: 'Thimble', category: 'Insurance', year: '2020' },
  { id: 'yieldstreet', name: 'YieldStreet', category: 'FinTech', year: '2021' },
  { id: 'zerogrocery', name: 'Zero Grocery', category: 'E-Commerce', year: '2020' },
  { id: 'doordash', name: 'DoorDash', category: 'Delivery', year: '2022' },
  { id: 'virtana', name: 'Virtana', category: 'Enterprise', year: '2023' },
  { id: 'reddit', name: 'Reddit', category: 'Social', year: '2024' },
  { id: 'estee-lauder', name: 'Estée Lauder', category: 'Beauty', year: '2024' },
  { id: 'auditboard', name: 'AuditBoard', category: 'Enterprise', year: '2024' },
  { id: 'rho', name: 'Rho', category: 'FinTech', year: '2024-Present' }
];

function WorksPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  // Scrolling state - mirroring HomePage pattern
  const [scrollOffset, setScrollOffset] = useState(0);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Calculate which company is currently in view (0-10 for 11 companies)
  // scrollOffset 0-200 maps across all companies
  const currentCompanyIndex = Math.min(
    COMPANIES.length - 1,
    Math.floor((scrollOffset / 200) * COMPANIES.length)
  );
  const currentCompany = COMPANIES[currentCompanyIndex];

  // Inject stagger animation
  useEffect(() => {
    const styleId = 'text-stagger-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Simplified smooth scrolling system - mirrors HomePage
  const updateScrollOffset = useCallback((delta) => {
    setScrollOffset(prev => {
      const newOffset = Math.max(0, Math.min(200, prev + delta));
      return newOffset;
    });
  }, []);

  // Wheel handling - mirrors HomePage
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();

      let delta = 0;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        delta = e.deltaX * 0.05;
      } else {
        delta = e.deltaY * 0.05;
      }

      updateScrollOffset(delta);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [updateScrollOffset]);

  // Keyboard handling - mirrors HomePage
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          updateScrollOffset(10);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          updateScrollOffset(-10);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateScrollOffset]);

  // Touch handling - VERTICAL scrolling for mobile (different from HomePage)
  useEffect(() => {
    const handleTouchStart = (e) => {
      const target = e.target;
      const isBackground = target.style.backgroundImage ||
                          target.closest('[style*="background-image"]') ||
                          target.tagName === 'BODY' ||
                          target.classList.contains('scrollable-area');

      if (!isBackground ||
          target.closest('.clickable-element') ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('nav') ||
          target.closest('[role="button"]') ||
          target.closest('.sidebar')) {
        return;
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchMove = (e) => {
      const target = e.target;
      const isBackground = target.style.backgroundImage ||
                          target.closest('[style*="background-image"]') ||
                          target.tagName === 'BODY' ||
                          target.classList.contains('scrollable-area');

      if (!isBackground ||
          target.closest('.clickable-element') ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('nav') ||
          target.closest('[role="button"]') ||
          target.closest('.sidebar')) {
        return;
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaY = touch.clientY - touchStartRef.current.y;

        // VERTICAL scrolling for mobile - swipe up/down to progress
        const scrollDelta = -deltaY * 0.2;

        if (Math.abs(scrollDelta) > 1) {
          updateScrollOffset(scrollDelta);
          touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = { x: 0, y: 0 };
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [updateScrollOffset]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  // Handle scroll jump to next company (NEXT button in CircleNav menu)
  const handleScrollNext = () => {
    if (scrollOffset >= 200) {
      // Already at end, open footer
      handleFooterToggle();
    } else {
      // Jump to next company
      const nextIndex = Math.min(COMPANIES.length - 1, currentCompanyIndex + 1);
      const nextOffset = (nextIndex / (COMPANIES.length - 1)) * 200;
      setScrollOffset(nextOffset);
    }
  };

  // Handle company click - navigate to company detail page
  const handleCompanyClick = (companyId) => {
    navigate(`/works/${companyId}`);
  };

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      onScrollNext={handleScrollNext}
      navigationItems={navigationItems}
      scrollOffset={scrollOffset}
      pageLabel="WORKS"
    >
      {/* Background - Gradient based on scroll progress */}
      <div className="scrollable-area" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        background: `linear-gradient(135deg,
          rgba(251, 191, 36, ${0.1 + (scrollOffset / 200) * 0.2}) 0%,
          rgba(255, 255, 255, 1) 50%,
          rgba(251, 191, 36, ${0.05 + (scrollOffset / 200) * 0.15}) 100%)`,
        zIndex: 1,
        transition: 'background 0.3s ease-out'
      }}></div>

      {/* Company Progress Indicator - Left side vertical dots */}
      <div style={{
        position: 'fixed',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 100
      }}>
        {COMPANIES.map((company, index) => (
          <button
            key={company.id}
            onClick={() => {
              const targetOffset = (index / (COMPANIES.length - 1)) * 200;
              setScrollOffset(targetOffset);
            }}
            style={{
              width: index === currentCompanyIndex ? '12px' : '8px',
              height: index === currentCompanyIndex ? '12px' : '8px',
              borderRadius: '50%',
              backgroundColor: index === currentCompanyIndex
                ? COLORS.yellow
                : 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0
            }}
            title={company.name}
          />
        ))}
      </div>

      {/* Main Content */}
      <div style={{
        position: 'fixed',
        bottom: '40px',
        left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(100px, 8vw)',
        maxWidth: sidebarOpen ? 'min(540px, 40vw)' : 'min(780px, 61vw)',
        zIndex: 61,
        transform: footerOpen ? 'translateY(-300px)' : 'translateY(0)',
        transition: 'left 0.5s ease-out, max-width 0.5s ease-out, transform 0.5s ease-out'
      }}>
        <div style={{
          ...TYPOGRAPHY.container
        }}>
          {/* Large "WORKS" heading */}
          <h1 style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            WORKS
          </h1>

          {/* Company Name - Changes based on scroll */}
          <div style={{ position: 'relative', minHeight: '120px' }}>
            <p
              key={`company-${currentCompany.id}`}
              style={{
                ...TYPOGRAPHY.h2,
                color: COLORS.black,
                backgroundColor: COLORS.backgroundLight,
                ...EFFECTS.blur,
                display: 'inline-block',
                padding: '2px 6px',
                animation: 'fadeInUp 0.4s ease-in-out both',
                cursor: 'pointer'
              }}
              onClick={() => handleCompanyClick(currentCompany.id)}
            >
              {currentCompany.name}
            </p>
          </div>

          {/* Company Category & Year */}
          <p style={{
            ...TYPOGRAPHY.body,
            margin: '10px 0 0 0',
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '4px 8px',
            animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
          }}>
            {currentCompany.category} • {currentCompany.year}
          </p>

          {/* Progress Counter */}
          <p style={{
            ...TYPOGRAPHY.small,
            margin: '20px 0 0 0',
            color: 'rgba(0, 0, 0, 0.4)',
            fontWeight: '600',
            letterSpacing: '0.1em'
          }}>
            {currentCompanyIndex + 1} / {COMPANIES.length}
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default WorksPage;
