import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';

// Company data for Works showcase - ordered most recent first
const COMPANIES = [
  {
    id: 'rho',
    name: 'Rho Technologies',
    category: 'FinTech',
    stage: 'Series B',
    year: '2025',
    headline: '45-minute data sync → real-time clarity',
    highlights: ['80% faster decisions', '$2.5M identified waste']
  },
  {
    id: 'auditboard',
    name: 'AuditBoard',
    category: 'Enterprise SaaS',
    stage: 'Growth',
    year: '2024',
    headline: 'HubSpot-Salesforce integration audit',
    highlights: ['$2M+ potential savings', 'Attribution roadmap']
  },
  {
    id: 'estee-lauder',
    name: 'Estée Lauder',
    category: 'Beauty',
    stage: 'Enterprise',
    year: '2023-2024',
    headline: 'Email development & CRM standardization',
    highlights: ['Responsive templates', 'Cross-brand standards']
  },
  {
    id: 'reddit',
    name: 'Reddit',
    category: 'Social Media',
    stage: 'Pre-IPO',
    year: '2022-2023',
    headline: 'Marketing systems architecture',
    highlights: ['ETL refinement', 'Advertiser nurture flows']
  },
  {
    id: 'virtana',
    name: 'Virtana',
    category: 'Enterprise SaaS',
    stage: 'Growth',
    year: '2022',
    headline: 'MarTech stack efficiency assessment',
    highlights: ['Lead scoring models', 'ABM workflows']
  },
  {
    id: 'doordash',
    name: 'DoorDash',
    category: 'Delivery',
    stage: 'Public',
    year: '2021',
    headline: 'Merchant-facing marketing operations',
    highlights: ['Onboarding optimization', 'Partner automation']
  },
  {
    id: 'zerogrocery',
    name: 'Zero Grocery',
    category: 'E-Commerce',
    stage: 'Seed',
    year: '2021',
    headline: 'End-to-end marketing operations',
    highlights: ['Subscription lifecycle', 'Delivery sequences']
  },
  {
    id: 'yieldstreet',
    name: 'YieldStreet',
    category: 'FinTech',
    stage: 'Series B',
    year: '2019',
    headline: 'Investment platform automation',
    highlights: ['Investor nurture flows', 'Compliance-ready emails']
  },
  {
    id: 'thimble',
    name: 'Thimble',
    category: 'InsurTech',
    stage: 'Series A',
    year: '2019',
    headline: 'Growth marketing systems',
    highlights: ['Quote-to-bind funnel', 'Referral automation']
  },
  {
    id: 'tunecore',
    name: 'TuneCore',
    category: 'Music Tech',
    stage: 'Growth',
    year: '2016-2018',
    headline: 'Scaled to 1M+ subscribers',
    highlights: ['+250% open rates', '+200% click-to-open']
  },
  {
    id: 'liveintent',
    name: 'LiveIntent',
    category: 'Ad Tech',
    stage: 'Series C',
    year: '2013-2016',
    headline: 'Marketing ops transformation',
    highlights: ['Marketo infrastructure', 'Attribution frameworks']
  }
];

function WorksPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cards per view: 1 on mobile, 3 on desktop
  const cardsPerView = isMobile ? 1 : 3;
  const totalGroups = Math.ceil(COMPANIES.length / cardsPerView);

  // Scrolling state - mirroring HomePage pattern
  const [scrollOffset, setScrollOffset] = useState(0);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Calculate which group is currently in view
  const currentGroupIndex = Math.min(
    totalGroups - 1,
    Math.floor((scrollOffset / 200) * totalGroups)
  );

  // Get current companies to display (1 on mobile, 3 on desktop)
  const startIndex = currentGroupIndex * cardsPerView;
  const currentCompanies = COMPANIES.slice(startIndex, startIndex + cardsPerView);

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

  // Handle scroll jump to next group (NEXT button in CircleNav menu)
  const handleScrollNext = useCallback(() => {
    if (scrollOffset >= 200) {
      // Already at end, open footer
      handleFooterToggle();
    } else {
      // Jump to next group
      const nextIndex = Math.min(totalGroups - 1, currentGroupIndex + 1);
      const nextOffset = totalGroups > 1 ? (nextIndex / (totalGroups - 1)) * 200 : 0;
      setScrollOffset(nextOffset);
    }
  }, [scrollOffset, totalGroups, currentGroupIndex, handleFooterToggle]);

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
      pageLabel="CLIENTS"
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

      {/* Group Progress Indicator - Left side vertical dots (hidden on mobile) */}
      <div style={{
        position: 'fixed',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: isMobile ? 'none' : 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 100
      }}>
        {Array.from({ length: totalGroups }).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              const targetOffset = (index / (totalGroups - 1)) * 200;
              setScrollOffset(targetOffset);
            }}
            style={{
              width: index === currentGroupIndex ? '12px' : '8px',
              height: index === currentGroupIndex ? '12px' : '8px',
              borderRadius: '50%',
              backgroundColor: index === currentGroupIndex
                ? COLORS.yellow
                : 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0
            }}
            title={`Group ${index + 1}`}
          />
        ))}
      </div>

      {/* Main Content */}
      <div style={{
        position: 'fixed',
        bottom: '40px',
        left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(100px, 8vw)',
        right: '40px',
        zIndex: 61,
        transform: footerOpen ? 'translateY(-300px)' : 'translateY(0)',
        transition: 'left 0.5s ease-out, transform 0.5s ease-out'
      }}>
        <div style={{
          ...TYPOGRAPHY.container
        }}>
          {/* Large "CLIENTS" heading */}
          <h1 style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            CLIENTS
          </h1>

          {/* Company Cards - 1 on mobile, 3 on desktop */}
          <div
            key={`group-${currentGroupIndex}`}
            style={{
              display: 'flex',
              gap: '20px',
              marginTop: '16px',
              animation: 'fadeInUp 0.4s ease-in-out both',
              flexDirection: isMobile ? 'column' : 'row'
            }}
          >
            {currentCompanies.map((company, idx) => (
              <div
                key={company.id}
                onClick={() => handleCompanyClick(company.id)}
                style={{
                  flex: isMobile ? 'none' : '1 1 0',
                  maxWidth: isMobile ? '100%' : '320px',
                  width: isMobile ? '100%' : 'auto',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `2px solid ${COLORS.yellow}`,
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  animation: `fadeInUp 0.4s ease-in-out ${0.1 * idx}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(251, 191, 36, 0.25)';
                  e.currentTarget.style.borderColor = 'black';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = COLORS.yellow;
                }}
              >
                {/* Company Name */}
                <h2 style={{
                  fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                  fontWeight: '700',
                  color: COLORS.black,
                  margin: '0 0 4px 0',
                  letterSpacing: '-0.5px'
                }}>
                  {company.name.toUpperCase()}
                </h2>

                {/* Category • Stage • Year */}
                <p style={{
                  fontSize: isMobile ? '12px' : '11px',
                  color: 'rgba(0, 0, 0, 0.6)',
                  margin: '0 0 12px 0',
                  fontWeight: '500'
                }}>
                  {company.category} • {company.stage} • {company.year}
                </p>

                {/* Divider */}
                <div style={{
                  height: '1px',
                  backgroundColor: 'rgba(251, 191, 36, 0.3)',
                  margin: '0 0 12px 0'
                }}></div>

                {/* Headline */}
                <p style={{
                  fontSize: isMobile ? '14px' : '13px',
                  color: COLORS.black,
                  margin: '0 0 12px 0',
                  lineHeight: '1.4',
                  fontWeight: '500'
                }}>
                  {company.headline}
                </p>

                {/* Highlights */}
                <div style={{ marginBottom: '16px' }}>
                  {company.highlights.map((highlight, hidx) => (
                    <div key={hidx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px'
                    }}>
                      <span style={{
                        color: COLORS.yellow,
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>✓</span>
                      <span style={{
                        fontSize: '12px',
                        color: 'rgba(0, 0, 0, 0.75)'
                      }}>{highlight}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompanyClick(company.id);
                  }}
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px 16px' : '10px 16px',
                    minHeight: '44px',
                    backgroundColor: COLORS.yellow,
                    color: COLORS.black,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: isMobile ? '13px' : '11px',
                    fontWeight: '700',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.black;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.yellow;
                    e.currentTarget.style.color = COLORS.black;
                  }}
                >
                  READ CASE STUDY →
                </button>
              </div>
            ))}
          </div>

          {/* Navigation + Progress Counter */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px'
          }}>
            {/* Navigation Arrows - Left side */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  const prevIndex = Math.max(0, currentGroupIndex - 1);
                  const prevOffset = totalGroups > 1 ? (prevIndex / (totalGroups - 1)) * 200 : 0;
                  setScrollOffset(prevOffset);
                }}
                disabled={currentGroupIndex === 0}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: currentGroupIndex === 0 ? 'rgba(0,0,0,0.1)' : COLORS.yellow,
                  color: currentGroupIndex === 0 ? 'rgba(0,0,0,0.3)' : 'black',
                  fontSize: '16px',
                  cursor: currentGroupIndex === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ←
              </button>
              <button
                onClick={() => {
                  const nextIndex = Math.min(totalGroups - 1, currentGroupIndex + 1);
                  const nextOffset = totalGroups > 1 ? (nextIndex / (totalGroups - 1)) * 200 : 0;
                  setScrollOffset(nextOffset);
                }}
                disabled={currentGroupIndex === totalGroups - 1}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: currentGroupIndex === totalGroups - 1 ? 'rgba(0,0,0,0.1)' : COLORS.yellow,
                  color: currentGroupIndex === totalGroups - 1 ? 'rgba(0,0,0,0.3)' : 'black',
                  fontSize: '16px',
                  cursor: currentGroupIndex === totalGroups - 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                →
              </button>
            </div>

            {/* Progress Counter - Right side */}
            <p style={{
              ...TYPOGRAPHY.small,
              margin: 0,
              color: 'rgba(0, 0, 0, 0.4)',
              fontWeight: '600',
              letterSpacing: '0.1em'
            }}>
              {currentGroupIndex + 1} / {totalGroups}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default WorksPage;
