import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, BUTTON, EFFECTS } from '../styles/constants';

/**
 * Own Your Story - Article 1
 * "Why Your GTM Sucks: The Human Cost of Operations Theater"
 *
 * Horizontal scrolling article (>800px viewports)
 * Vertical scrolling (mobile <800px)
 * 60% Confrontational / 40% Creative Explorer voice
 *
 * Machine: Mac Mini
 * Created: November 22, 2025
 */

function OwnYourStoryArticle1Page() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  // Horizontal scroll state (>800px)
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Detect viewport size
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth <= 800);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);

    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Horizontal scroll mechanics (desktop only)
  const updateScrollOffset = useCallback((delta) => {
    if (isMobile) return; // Mobile uses native vertical scroll

    setScrollOffset(prev => {
      // Total sections: ~35 sections = 3500vw total width
      const maxScroll = 3500;
      return Math.max(0, Math.min(maxScroll, prev + delta));
    });
  }, [isMobile]);

  // Wheel handling (desktop)
  useEffect(() => {
    if (isMobile) return;

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
  }, [updateScrollOffset, isMobile]);

  // Keyboard handling (desktop)
  useEffect(() => {
    if (isMobile) return;

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
  }, [updateScrollOffset, isMobile]);

  // Touch handling (desktop)
  useEffect(() => {
    if (isMobile) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touchStartRef.current.x - touch.clientX;

        updateScrollOffset(deltaX * 0.5);
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [updateScrollOffset, isMobile]);

  return (
    <Layout
      backgroundColor={COLORS.black}
      navCircleRotation={0}
      scrollProgress={isMobile ? 0 : scrollOffset / 3500}
    >
      {/* Desktop: Horizontal Scroll Container */}
      {!isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: COLORS.black
          }}
        >
          <div
            style={{
              display: 'flex',
              height: '100%',
              transform: `translateX(-${scrollOffset}vw)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            {/* Section 1: Hero/Cover */}
            <HeroSection />

            {/* Section 2: Executive Summary - Data Grid */}
            <DataGridSection />

            {/* Section 3: Table of Contents */}
            <TableOfContentsSection />

            {/* Section 4-6: Why This Matters (3 pages) */}
            <WhyThisMattersSectionPage1 />
            <WhyThisMattersSectionPage2 />
            <WhyThisMattersSectionPage3 />

            {/* Section 7-11: The Big Picture (5 pages) */}
            <BigPictureSectionPage1 />
            <BigPictureSectionPage2 />
            <BigPictureSectionPage3 />
            <BigPictureSectionPage4 />
            <BigPictureSectionPage5 />

            {/* Section 12-31: The People - 5 Personas (4 pages each = 20 pages) */}
            {/* Persona 1: Alex */}
            <PersonaMeetSection name="Alex" role="Marketing Operations Manager" />
            <PersonaPromiseSection name="Alex" />
            <PersonaRealitySection name="Alex" />
            <PersonaCostSection name="Alex" />

            {/* Persona 2: Jordan */}
            <PersonaMeetSection name="Jordan" role="Marketing Data Analyst" />
            <PersonaPromiseSection name="Jordan" />
            <PersonaRealitySection name="Jordan" />
            <PersonaCostSection name="Jordan" />

            {/* Persona 3: Casey */}
            <PersonaMeetSection name="Casey" role="Marketing Attribution Specialist" />
            <PersonaPromiseSection name="Casey" />
            <PersonaRealitySection name="Casey" />
            <PersonaCostSection name="Casey" />

            {/* Persona 4: Morgan */}
            <PersonaMeetSection name="Morgan" role="Marketing Operations Lead" />
            <PersonaPromiseSection name="Morgan" />
            <PersonaRealitySection name="Morgan" />
            <PersonaCostSection name="Morgan" />

            {/* Persona 5: Riley */}
            <PersonaMeetSection name="Riley" role="Senior Marketing Operations Manager" />
            <PersonaPromiseSection name="Riley" />
            <PersonaRealitySection name="Riley" />
            <PersonaCostSection name="Riley" />

            {/* Section 32-34: What Now (3 pages) */}
            <WhatNowSectionPage1 />
            <WhatNowSectionPage2 />
            <WhatNowSectionPage3 />

            {/* Section 35: CTA / Closing */}
            <CTASection />
          </div>

          {/* Scroll Progress Indicator */}
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 20px',
              backgroundColor: 'rgba(251, 191, 36, 0.9)',
              color: COLORS.black,
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              zIndex: 1000
            }}
          >
            Section {Math.floor(scrollOffset / 100) + 1} of 35
          </div>
        </div>
      )}

      {/* Mobile: Vertical Scroll Container */}
      {isMobile && (
        <div
          style={{
            width: '100%',
            backgroundColor: COLORS.black,
            color: COLORS.white,
            padding: '80px 20px 40px'
          }}
        >
          <HeroSection mobile />
          <DataGridSection mobile />
          <TableOfContentsSection mobile />
          <WhyThisMattersSectionPage1 mobile />
          <WhyThisMattersSectionPage2 mobile />
          <WhyThisMattersSectionPage3 mobile />
          <BigPictureSectionPage1 mobile />
          <BigPictureSectionPage2 mobile />
          <BigPictureSectionPage3 mobile />
          <BigPictureSectionPage4 mobile />
          <BigPictureSectionPage5 mobile />

          {/* Personas */}
          <PersonaMeetSection name="Alex" role="Marketing Operations Manager" mobile />
          <PersonaPromiseSection name="Alex" mobile />
          <PersonaRealitySection name="Alex" mobile />
          <PersonaCostSection name="Alex" mobile />

          <PersonaMeetSection name="Jordan" role="Marketing Data Analyst" mobile />
          <PersonaPromiseSection name="Jordan" mobile />
          <PersonaRealitySection name="Jordan" mobile />
          <PersonaCostSection name="Jordan" mobile />

          <PersonaMeetSection name="Casey" role="Marketing Attribution Specialist" mobile />
          <PersonaPromiseSection name="Casey" mobile />
          <PersonaRealitySection name="Casey" mobile />
          <PersonaCostSection name="Casey" mobile />

          <PersonaMeetSection name="Morgan" role="Marketing Operations Lead" mobile />
          <PersonaPromiseSection name="Morgan" mobile />
          <PersonaRealitySection name="Morgan" mobile />
          <PersonaCostSection name="Morgan" mobile />

          <PersonaMeetSection name="Riley" role="Senior Marketing Operations Manager" mobile />
          <PersonaPromiseSection name="Riley" mobile />
          <PersonaRealitySection name="Riley" mobile />
          <PersonaCostSection name="Riley" mobile />

          <WhatNowSectionPage1 mobile />
          <WhatNowSectionPage2 mobile />
          <WhatNowSectionPage3 mobile />
          <CTASection mobile />
        </div>
      )}
    </Layout>
  );
}

/* ============================================
   SECTION COMPONENTS (Desktop + Mobile Responsive)
   ============================================ */

// Section 1: Hero/Cover
function HeroSection({ mobile }) {
  const style = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 60px'
  };

  return (
    <section style={style}>
      <h1 style={{
        ...TYPOGRAPHY.h1Scaled,
        color: COLORS.yellow,
        textAlign: 'center',
        marginBottom: mobile ? '20px' : '40px'
      }}>
        WHY YOUR GTM SUCKS
      </h1>

      <h2 style={{
        ...TYPOGRAPHY.h2,
        color: COLORS.white,
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        The Human Cost of Operations Theater
      </h2>

      {!mobile && (
        <p style={{
          ...TYPOGRAPHY.body,
          color: COLORS.lightGrey,
          textAlign: 'center',
          maxWidth: '700px',
          marginTop: '40px'
        }}>
          Scroll to explore →
        </p>
      )}
    </section>
  );
}

// Section 2: Executive Summary - Data Grid
function DataGridSection({ mobile }) {
  const dataPoints = [
    { number: '$2.5M+', label: 'Average annual cost of GTM misalignment' },
    { number: '45 min', label: 'Data lag in misaligned systems' },
    { number: '300+', label: 'Manual workflows when roles misalign' },
    { number: '53%', label: 'Organizations with sales/marketing hand-off issues' },
    { number: '10%', label: 'Average revenue loss from misalignment per year' },
    { number: '20-40%', label: 'IT budget consumed by technical debt' }
  ];

  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 60px'
  };

  return (
    <section style={containerStyle}>
      <h2 style={{
        ...TYPOGRAPHY.h2,
        color: COLORS.yellow,
        marginBottom: mobile ? '30px' : '60px',
        textAlign: 'center'
      }}>
        By the Numbers
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
        gap: mobile ? '30px' : '40px',
        maxWidth: '1000px',
        width: '100%'
      }}>
        {dataPoints.map((item, index) => (
          <div
            key={index}
            style={{
              padding: '30px',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              borderLeft: `4px solid ${COLORS.yellow}`,
              ...EFFECTS.blur
            }}
          >
            <div style={{
              fontSize: mobile ? '2.5rem' : '3.5rem',
              fontWeight: '900',
              color: COLORS.yellow,
              marginBottom: '10px',
              lineHeight: '1'
            }}>
              {item.number}
            </div>
            <div style={{
              ...TYPOGRAPHY.body,
              color: COLORS.white,
              fontSize: mobile ? '1rem' : '1.2rem'
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <p style={{
        ...TYPOGRAPHY.body,
        color: COLORS.white,
        textAlign: 'center',
        maxWidth: '700px',
        marginTop: mobile ? '30px' : '60px',
        fontStyle: 'italic'
      }}>
        These aren't projections. These are the actual metrics from five organizations that hired the wrong person for the right job—or the right person for the wrong job.
      </p>

      <p style={{
        ...TYPOGRAPHY.body,
        color: COLORS.white,
        textAlign: 'center',
        marginTop: '20px'
      }}>
        The tools worked fine. The people are exhausted.
      </p>
    </section>
  );
}

// Section 3: Table of Contents
function TableOfContentsSection({ mobile }) {
  const sections = [
    { title: 'Why This Matters', description: 'The $2.5M elephant in your tech stack' },
    { title: 'The Big Picture', description: 'How GTM misalignment compounds' },
    { title: 'The People', description: 'Five personas behind your failures' },
    { title: 'What Now', description: 'The honest path forward' }
  ];

  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 60px'
  };

  return (
    <section style={containerStyle}>
      <h2 style={{
        ...TYPOGRAPHY.h2,
        color: COLORS.yellow,
        marginBottom: mobile ? '30px' : '60px'
      }}>
        What You'll Learn
      </h2>

      <div style={{
        maxWidth: '600px',
        width: '100%'
      }}>
        {sections.map((section, index) => (
          <div
            key={index}
            style={{
              marginBottom: '30px',
              paddingBottom: '30px',
              borderBottom: index < sections.length - 1 ? `1px solid rgba(251, 191, 36, 0.3)` : 'none'
            }}
          >
            <h3 style={{
              fontSize: mobile ? '1.5rem' : '2rem',
              fontWeight: '700',
              color: COLORS.yellow,
              marginBottom: '10px'
            }}>
              {index + 1}. {section.title}
            </h3>
            <p style={{
              ...TYPOGRAPHY.body,
              color: COLORS.lightGrey
            }}>
              {section.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Section 4: Why This Matters - Page 1
function WhyThisMattersSectionPage1({ mobile }) {
  // Content TK - Will be written next
  return <PlaceholderSection title="Why This Matters - Page 1" mobile={mobile} />;
}

// Section 5: Why This Matters - Page 2
function WhyThisMattersSectionPage2({ mobile }) {
  return <PlaceholderSection title="Why This Matters - Page 2" mobile={mobile} />;
}

// Section 6: Why This Matters - Page 3
function WhyThisMattersSectionPage3({ mobile }) {
  return <PlaceholderSection title="Why This Matters - Page 3" mobile={mobile} />;
}

// Section 7-11: Big Picture Pages
function BigPictureSectionPage1({ mobile }) {
  return <PlaceholderSection title="The Big Picture - Page 1" mobile={mobile} />;
}

function BigPictureSectionPage2({ mobile }) {
  return <PlaceholderSection title="The Big Picture - Page 2" mobile={mobile} />;
}

function BigPictureSectionPage3({ mobile }) {
  return <PlaceholderSection title="The Big Picture - Page 3" mobile={mobile} />;
}

function BigPictureSectionPage4({ mobile }) {
  return <PlaceholderSection title="The Big Picture - Page 4" mobile={mobile} />;
}

function BigPictureSectionPage5({ mobile }) {
  return <PlaceholderSection title="The Big Picture - Page 5" mobile={mobile} />;
}

// Persona Sections (Template - will be customized per persona)
function PersonaMeetSection({ name, role, mobile }) {
  return <PlaceholderSection title={`Meet ${name} - ${role}`} mobile={mobile} />;
}

function PersonaPromiseSection({ name, mobile }) {
  return <PlaceholderSection title={`${name}: The Promise`} mobile={mobile} />;
}

function PersonaRealitySection({ name, mobile }) {
  return <PlaceholderSection title={`${name}: The Reality`} mobile={mobile} />;
}

function PersonaCostSection({ name, mobile }) {
  return <PlaceholderSection title={`${name}: The Cost`} mobile={mobile} />;
}

// What Now Sections
function WhatNowSectionPage1({ mobile }) {
  return <PlaceholderSection title="What Now - Page 1" mobile={mobile} />;
}

function WhatNowSectionPage2({ mobile }) {
  return <PlaceholderSection title="What Now - Page 2" mobile={mobile} />;
}

function WhatNowSectionPage3({ mobile }) {
  return <PlaceholderSection title="What Now - Page 3" mobile={mobile} />;
}

// CTA Section with Email Capture
function CTASection({ mobile }) {
  const containerStyle = mobile ? {
    padding: '60px 0'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 60px'
  };

  return (
    <section style={containerStyle}>
      <h2 style={{
        ...TYPOGRAPHY.h2,
        color: COLORS.yellow,
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        Ready to Fix Your GTM?
      </h2>

      <div style={{
        display: 'flex',
        flexDirection: mobile ? 'column' : 'row',
        gap: '30px',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '60px'
      }}>
        <button style={{
          ...BUTTON.primary,
          minWidth: '250px'
        }}>
          Schedule a Consultation
        </button>

        <button style={{
          ...BUTTON.primary,
          minWidth: '250px'
        }}>
          Get the Audit Template
        </button>
      </div>

      <p style={{
        ...TYPOGRAPHY.body,
        color: COLORS.lightGrey,
        textAlign: 'center',
        fontSize: '0.9rem',
        marginTop: '40px'
      }}>
        Download this article as PDF  |  Read next: "Why Your MAP Is a Mess"
      </p>
    </section>
  );
}

// Placeholder for content TK
function PlaceholderSection({ title, mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 60px'
  };

  return (
    <section style={containerStyle}>
      <h2 style={{
        ...TYPOGRAPHY.h2,
        color: COLORS.yellow,
        marginBottom: '30px'
      }}>
        {title}
      </h2>
      <p style={{
        ...TYPOGRAPHY.body,
        color: COLORS.lightGrey,
        textAlign: 'center'
      }}>
        [Content TK - Being written]
      </p>
    </section>
  );
}

export default OwnYourStoryArticle1Page;
