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
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto'
  };

  return (
    <section style={containerStyle}>
      <h2 style={{
        ...TYPOGRAPHY.h2,
        color: COLORS.yellow,
        marginBottom: mobile ? '20px' : '40px'
      }}>
        The Data Isn't People
      </h2>

      <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
        <p style={{ marginBottom: '20px' }}>
          In 2015, LiveIntent analyzed 90 million email users and reminded marketers of something fundamental: "Data isn't people. Data is data."
        </p>

        <p style={{ marginBottom: '20px' }}>
          Ten years later, we're making the same mistake in Marketing Operations.
        </p>

        <p style={{ marginBottom: '20px' }}>
          You see "$2.5M/year" and think "technology problem." You see "300 manual workflows" and think "inefficiency problem." You see "45-minute data lag" and think "integration issue."
        </p>

        <p style={{ marginBottom: '20px', fontWeight: '700', color: COLORS.yellow }}>
          Wrong.
        </p>

        <p style={{ marginBottom: '20px' }}>
          These are people problems. They have names. They have job titles that don't match their job descriptions. They have goals that contradict their skills. They have families who ask why they're working weekends again.
        </p>

        <p style={{ marginBottom: '20px' }}>
          And they're drowning—not because your MAP sucks, but because you hired a Lifecycle Marketer and gave them Demand Gen goals. Then you blamed the tools when the real problem walked past you in the hallway yesterday looking exhausted.
        </p>

        <p style={{ marginBottom: '20px' }}>
          This isn't a consultant's projection. This is what actually happened when five organizations—200 to 2,000 employees, B2B SaaS and enterprise technology, $45M+ combined marketing budgets—decided to fix their "marketing automation problem."
        </p>

        <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>
          Turns out, their marketing automation was fine.
        </p>
      </div>
    </section>
  );
}

// Section 5: Why This Matters - Page 2
function WhyThisMattersSectionPage2({ mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto'
  };

  return (
    <section style={containerStyle}>
      <h2 style={{
        ...TYPOGRAPHY.h2,
        color: COLORS.yellow,
        marginBottom: mobile ? '20px' : '40px'
      }}>
        The Research
      </h2>

      <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
        <p style={{ marginBottom: '20px' }}>
          This article is built on five comprehensive GTM assessments conducted between 2023 and 2025. Real companies. Real failures. Real people paying the price.
        </p>

        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.yellow, marginTop: '30px', marginBottom: '15px' }}>
          Data Source:
        </h3>
        <ul style={{ marginLeft: '20px', marginBottom: '20px', lineHeight: '1.8' }}>
          <li>Five organizations (anonymized)</li>
          <li>Time period: 2023-2025</li>
          <li>Combined employee count: 200-2,000</li>
          <li>Industries: B2B SaaS, enterprise technology</li>
          <li>Combined MAT budget: $45M+ annually</li>
          <li>Platforms analyzed: Marketo, HubSpot, Salesforce, Tableau, custom data warehouses</li>
          <li>Total time studying these failures: 14 months</li>
        </ul>

        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.yellow, marginTop: '30px', marginBottom: '15px' }}>
          What we looked for:
        </h3>
        <ul style={{ marginLeft: '20px', marginBottom: '20px', lineHeight: '1.8' }}>
          <li>Where the job description and actual work diverged</li>
          <li>How long it took people to start building workarounds</li>
          <li>What "tool problems" were actually org chart problems</li>
          <li>The moment people started updating their resumes</li>
        </ul>

        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.yellow, marginTop: '30px', marginBottom: '15px' }}>
          What we found:
        </h3>
        <p style={{ marginBottom: '20px' }}>
          Every single organization followed the same pattern. They hired someone competent. They gave them a title that implied one type of work. They assigned goals that required completely different skills. Then they acted surprised when velocity collapsed and attribution stayed broken.
        </p>

        <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>
          The technical debt wasn't in the code. It was in the organizational assumptions nobody questioned.
        </p>
      </div>
    </section>
  );
}

// Section 6: Why This Matters - Page 3
function WhyThisMattersSectionPage3({ mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto',
    overflowY: 'auto'
  };

  const stageStyle = {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    borderLeft: `4px solid ${COLORS.yellow}`
  };

  return (
    <section style={containerStyle}>
      <h2 style={{
        ...TYPOGRAPHY.h2,
        color: COLORS.yellow,
        marginBottom: mobile ? '20px' : '40px'
      }}>
        The Pattern
      </h2>

      <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
        <p style={{ marginBottom: '30px' }}>
          Here's what organizational failure looks like when you map it:
        </p>

        <div style={stageStyle}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>
            Stage 1: The Hiring Misalignment (Month 0)
          </h3>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>Job description says "Lifecycle Marketing Operations"</li>
            <li>Interview conversation emphasizes "customer journey" and "nurture programs"</li>
            <li>Candidate has 5+ years experience building sophisticated journey paths</li>
            <li>Offer accepted with excitement</li>
          </ul>
        </div>

        <div style={stageStyle}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>
            Stage 2: The Goal Misalignment (Month 1-3)
          </h3>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>First 1:1 is about MQL volume</li>
            <li>Boss asks "Why aren't we generating more leads?"</li>
            <li>Candidate realizes title and actual work don't match</li>
            <li>First manual workaround created (just one, seems temporary)</li>
          </ul>
        </div>

        <div style={stageStyle}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>
            Stage 3: The Data Ownership Vacuum (Month 3-6)
          </h3>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>Nobody owns the schema</li>
            <li>Attribution model has 8% fill rate</li>
            <li>Data lag increases from 5 minutes to 15 minutes</li>
            <li>Manual workarounds now number 20+</li>
            <li>Velocity drops 40%</li>
          </ul>
        </div>

        <div style={stageStyle}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>
            Stage 4: The Tool Theater (Month 6-12)
          </h3>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>"Maybe Marketo just isn't right for us"</li>
            <li>Consultant hired for $175K</li>
            <li>Migration discussed</li>
            <li>Data schema ownership still unassigned</li>
            <li>Workarounds now 87+, velocity down 70%</li>
          </ul>
        </div>

        <div style={stageStyle}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>
            Stage 5: The Human Absorption (Month 12-18)
          </h3>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>Person spends 67% of time maintaining workarounds</li>
            <li>Campaigns per month: Was 3, now 0.7</li>
            <li>Car crying frequency: Twice a month</li>
            <li>Resume updates: Every Sunday night</li>
            <li>Tenure estimate: 4 months remaining</li>
          </ul>
        </div>

        <div style={stageStyle}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>
            Stage 6: The Repeat (Month 18+)
          </h3>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>Person quits</li>
            <li>New hire asked to "fix" the "tool problem"</li>
            <li>Pattern repeats</li>
            <li>Technical debt compounds</li>
            <li>$2.5M/year recurring cost established</li>
          </ul>
        </div>

        <p style={{ marginTop: '30px', fontStyle: 'italic', color: COLORS.lightGrey }}>
          This happened in all five organizations. Not similar patterns. The same pattern. Different names, same story.
        </p>
      </div>
    </section>
  );
}

// Section 7-11: Big Picture Pages
function BigPictureSectionPage1({ mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto'
  };

  return (
    <section style={containerStyle}>
      <h2 style={{
        ...TYPOGRAPHY.h2,
        color: COLORS.yellow,
        marginBottom: '10px'
      }}>
        The Velocity Gap
      </h2>

      <h3 style={{
        fontSize: '1.1rem',
        fontStyle: 'italic',
        color: COLORS.lightGrey,
        marginBottom: mobile ? '20px' : '30px'
      }}>
        When hiring misalignment kills productivity
      </h3>

      <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
        <p style={{ marginBottom: '20px' }}>
          When Alex was hired as a "Marketing Operations Manager" in Q1 2023, they shipped three campaigns in their first month.
        </p>

        <p style={{ marginBottom: '20px' }}>
          By Q4 2024, that number was 0.7 campaigns per month.
        </p>

        <p style={{ marginBottom: '30px' }}>
          Not because they got worse at their job. Because they spent 67% of their time fixing data schemas nobody owned.
        </p>

        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.yellow, marginTop: '30px', marginBottom: '15px' }}>
          The Math:
        </h3>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
          <p style={{ fontWeight: '700', marginBottom: '10px' }}>Year 1, Month 1:</p>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>3 campaigns shipped</li>
            <li>5% time on firefighting</li>
            <li>85% time on strategic building</li>
            <li>10% time on learning/development</li>
          </ul>
        </div>

        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444` }}>
          <p style={{ fontWeight: '700', marginBottom: '10px' }}>Year 2, Month 18:</p>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>0.7 campaigns shipped (77% velocity loss)</li>
            <li>67% time maintaining manual workarounds</li>
            <li>18% time on firefighting</li>
            <li>10% time on strategic building</li>
            <li>5% time on meetings explaining why things are slow</li>
            <li>0% time on learning/development</li>
          </ul>
        </div>

        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.yellow, marginTop: '30px', marginBottom: '15px' }}>
          What caused the velocity gap?
        </h3>

        <p style={{ marginBottom: '20px' }}>
          Not lack of skill. Not tool limitations. Not budget constraints.
        </p>

        <p style={{ marginBottom: '30px' }}>
          Role misalignment created a workflow debt spiral. Each month, the gap between "what the job title says" and "what the boss actually wants" generated new workarounds. Each workaround required maintenance. Maintenance consumed time that should have gone to building.
        </p>

        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.yellow, marginTop: '30px', marginBottom: '15px' }}>
          Industry Context (2025 Data):
        </h3>

        <p style={{ marginBottom: '15px' }}>
          Marketing Operations professionals report their time is dominated by KTLO (Keep the Lights On) work: managing tech, handling campaign operations, pulling reports, addressing urgent issues.
        </p>

        <p style={{ marginBottom: '15px' }}>
          Only 37% report having a strategic voice in their organizations despite the function maturing.
        </p>

        <p style={{ marginBottom: '15px' }}>
          Role clarity scores dropped 9% in 2024. Feeling valued dropped 5%. Fair pay perception dropped 8%.
        </p>

        <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>
          They're working harder than ever. They're accomplishing less than ever. And leadership keeps asking, "Why aren't we more agile?"
        </p>
      </div>
    </section>
  );
}

function BigPictureSectionPage2({ mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto',
    overflowY: 'auto'
  };

  const attemptStyle = {
    marginBottom: '25px',
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderLeft: `4px solid ${COLORS.yellow}`,
    borderRadius: '4px'
  };

  return (
    <section style={containerStyle}>
      <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
        The Attribution Illusion
      </h2>
      <h3 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: COLORS.lightGrey, marginBottom: mobile ? '20px' : '30px' }}>
        How org chart problems disguise as data problems
      </h3>

      <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
        <p style={{ marginBottom: '20px' }}>Casey built three attribution models in fourteen months.</p>
        <p style={{ marginBottom: '30px' }}>Not because they wanted to. Because the first two failed.</p>

        <div style={attemptStyle}>
          <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>Attempt 1: The Lone Wolf Build</h4>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>Timeline: 4 months</li>
            <li>Team size: Casey alone</li>
            <li>Data fill rate: 8%</li>
            <li>Cost: $0 external, Casey's sanity</li>
            <li>Outcome: Casey blamed for the 8%, started therapy</li>
          </ul>
        </div>

        <div style={attemptStyle}>
          <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>Attempt 2: The Consultant Band-Aid</h4>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>Timeline: 6 months</li>
            <li>Team size: Casey + $175K consultant</li>
            <li>Data fill rate: 42%</li>
            <li>Cost: $175K + Casey's continued sanity erosion</li>
            <li>Outcome: Better, but still useless for actual decision-making. Consultant left. Casey stayed to maintain it.</li>
          </ul>
        </div>

        <div style={{ ...attemptStyle, borderLeft: `4px solid #10b981` }}>
          <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10b981', marginBottom: '10px' }}>Attempt 3: The Org Chart Fix</h4>
          <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
            <li>Timeline: 4 months</li>
            <li>Team size: Casey + data engineer partner + proper cross-functional alignment</li>
            <li>Data fill rate: 85%</li>
            <li>Cost: $40K</li>
            <li>Outcome: Actually works. Casey can sleep now.</li>
          </ul>
        </div>

        <p style={{ marginTop: '30px', marginBottom: '15px', fontWeight: '700' }}>What Changed Between Attempt 2 and Attempt 3?</p>
        <p style={{ marginBottom: '20px' }}>Not the tools. Marketo didn't get smarter. Salesforce didn't release a magic update.</p>
        <p style={{ marginBottom: '20px' }}>What changed: Someone finally said, "Wait, who owns the data schema?" And then they assigned ownership. With decision-making authority. And accountability.</p>
        <p style={{ marginBottom: '20px' }}>Casey was capable from day one. The 8% wasn't a skill problem. It was an org chart problem masquerading as an attribution problem.</p>
        <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>But nobody apologized for the therapy bills.</p>
      </div>
    </section>
  );
}

function BigPictureSectionPage3({ mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto',
    overflowY: 'auto'
  };

  return (
    <section style={containerStyle}>
      <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
        The Build vs Buy Trap
      </h2>
      <h3 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: COLORS.lightGrey, marginBottom: mobile ? '20px' : '30px' }}>
        When you fix the wrong problem
      </h3>

      <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
        <p style={{ marginBottom: '15px' }}>Morgan led a migration from HubSpot to Marketo. Six months, $180K all-in.</p>
        <p style={{ marginBottom: '15px' }}>Month 7: Data schema issues surfaced. Reports don't match between systems.</p>
        <p style={{ marginBottom: '15px' }}>Month 8: Morgan proposed data governance framework. Rejected as "too complex."</p>
        <p style={{ marginBottom: '15px' }}>Months 8-14: Morgan firefights reporting discrepancies while maintaining dual-system frankenstack.</p>
        <p style={{ marginBottom: '15px' }}>Month 15: Leadership conversation includes phrase "Maybe we should switch to Pardot?"</p>
        <p style={{ marginBottom: '30px' }}>Month 16: Morgan updates resume.</p>

        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.yellow, marginTop: '30px', marginBottom: '15px' }}>The Pattern:</h3>
        <div style={{ padding: '15px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444`, marginBottom: '20px' }}>
          <p><strong>Problem:</strong> Data schema has no owner</p>
          <p><strong>Symptom:</strong> Reports don't match between systems</p>
          <p><strong>Diagnosis:</strong> "HubSpot was easier"</p>
          <p><strong>Solution:</strong> "Let's switch to [other MAP]"</p>
          <p style={{ marginTop: '10px', fontWeight: '700', color: COLORS.yellow }}><strong>Actual Problem:</strong> Still no data owner</p>
        </div>

        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.yellow, marginTop: '30px', marginBottom: '15px' }}>The Correct Diagnosis Would Have Been:</h3>
        <div style={{ padding: '15px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: `4px solid #10b981`, marginBottom: '20px' }}>
          <p><strong>Problem:</strong> Data schema ownership vacuum</p>
          <p><strong>Symptom:</strong> Reports will never match regardless of platform</p>
          <p><strong>Diagnosis:</strong> Org chart gap, not tool gap</p>
          <p><strong>Solution:</strong> Assign data governance ownership ($32K audit + $6K/month ongoing)</p>
          <p style={{ marginTop: '10px', fontWeight: '700', color: '#10b981' }}><strong>Actual Solution Cost:</strong> $104K first year vs $180K migration that didn't fix root cause</p>
        </div>

        <p style={{ marginTop: '30px', fontStyle: 'italic', color: COLORS.lightGrey }}>
          It's not build vs buy. It's "fix the org chart" vs "buy another tool and pretend that's the same thing."
        </p>
      </div>
    </section>
  );
}

function BigPictureSectionPage4({ mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto',
    overflowY: 'auto'
  };

  const phaseStyle = {
    marginBottom: '25px',
    padding: '15px',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    borderLeft: `4px solid ${COLORS.yellow}`
  };

  return (
    <section style={containerStyle}>
      <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
        The Technical Debt Spiral
      </h2>
      <h3 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: COLORS.lightGrey, marginBottom: mobile ? '20px' : '30px' }}>
        How $2.5M/year happens incrementally
      </h3>

      <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
        <p style={{ marginBottom: '30px' }}>Technical debt doesn't announce itself. It accumulates in tiny decisions that seem reasonable at the time.</p>

        <div style={phaseStyle}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>Month 1: The First Workaround</h4>
          <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>"I'll just manually pull this list once a week until we fix the sync. Should take a week or two."</p>
          <p style={{ fontSize: '0.9rem', color: COLORS.lightGrey }}>Time cost: 30 minutes/week | Annual cost: $800</p>
        </div>

        <div style={phaseStyle}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>Month 3: The Workaround Has Friends</h4>
          <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>"Okay, the list pull is still manual, but now I also need to manually update lead scores..."</p>
          <p style={{ fontSize: '0.9rem', color: COLORS.lightGrey }}>Workarounds: 8 | Time cost: 6 hours/week | Annual cost: $15,600</p>
        </div>

        <div style={phaseStyle}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>Month 8: The Workaround City</h4>
          <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>"I have 47 workarounds now. Some of them have workarounds."</p>
          <p style={{ fontSize: '0.9rem', color: COLORS.lightGrey }}>Workarounds: 47 | Time cost: 18 hours/week | Annual cost: $46,800</p>
        </div>

        <div style={phaseStyle}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: COLORS.yellow, marginBottom: '10px' }}>Month 14: The Workaround Civilization</h4>
          <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>"87 workarounds. I document them in a spreadsheet, but I'm the only one who understands it."</p>
          <p style={{ fontSize: '0.9rem', color: COLORS.lightGrey }}>Workarounds: 87 | Time cost: 28 hours/week | Annual cost: $145,600</p>
        </div>

        <div style={{ ...phaseStyle, borderLeft: `4px solid #ef4444`, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444', marginBottom: '10px' }}>Month 18: The Workaround Empire</h4>
          <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>"300 workarounds across the team. This is just 'how marketing operations works here.'"</p>
          <p style={{ fontSize: '0.9rem', color: COLORS.lightGrey }}>Workarounds: 300 (team) | Time cost: 75 hours/week | Annual cost: $390,000</p>
        </div>

        <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.yellow, marginTop: '30px', marginBottom: '15px' }}>Add:</h3>
        <ul style={{ marginLeft: '20px', marginBottom: '20px', lineHeight: '1.8' }}>
          <li>Data lag cost (45-min stale data): $340K/year</li>
          <li>Failed platform costs: $215K sunk</li>
          <li>Consultant fees: $400K/year</li>
          <li>Recruiting costs: $140K/year</li>
          <li>Opportunity cost: Unquantified but substantial</li>
        </ul>

        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS.yellow, marginTop: '20px' }}>Total: $2.5M+/year recurring cost</p>
        <p style={{ marginTop: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
          And none of it shows up as "technical debt" on any report. It shows up as "why is marketing ROI declining?" and "why can't we move faster?"
        </p>
      </div>
    </section>
  );
}

// Big Picture Section Page 5: The Mobile Parallel
function BigPictureSectionPage5({ mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto',
    overflowY: 'auto'
  };

  return (
    <section style={containerStyle}>
      <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
        The Mobile Parallel
      </h2>
      <h3 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: COLORS.lightGrey, marginBottom: mobile ? '20px' : '30px' }}>
        We learned this lesson once. We're ignoring it again.
      </h3>

      <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
        <p style={{ marginBottom: '20px' }}>
          In 2015, LiveIntent analyzed 90 million email users and discovered something every marketer now takes for granted: 52% of email was opened on mobile.
        </p>

        <p style={{ marginBottom: '20px' }}>
          But here's what's wild: In 2015, most marketing teams still designed for desktop first. Mobile was the "also consider" afterthought.
        </p>

        <p style={{ marginBottom: '20px' }}>
          By 2025? 55% of emails open on mobile—but more importantly, 85% of online users check email via mobile, 90% in the US. Mobile email generates $1B+ in revenue annually.
        </p>

        <p style={{ marginBottom: '30px', fontStyle: 'italic', color: COLORS.lightGrey }}>
          We finally design mobile-first. Took us ten years, but we got there.
        </p>

        <p style={{ marginBottom: '30px', fontWeight: '700', fontSize: '1.2rem' }}>
          Now Ask Yourself This:
        </p>

        <p style={{ marginBottom: '20px' }}>
          In 2025, 53% of organizations experience sales/marketing hand-off misalignment. Only 11% have successful alignment. Only 37% of Marketing Ops professionals have a strategic voice in their organizations.
        </p>

        <p style={{ marginBottom: '30px', fontWeight: '700', color: COLORS.yellow }}>
          So... when are we going to design the org chart for the reality?
        </p>

        {/* Pattern Comparison Table */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
          <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>
            The Pattern Repeats:
          </p>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontWeight: '700', marginBottom: '5px' }}>2015 Email:</p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              "52% mobile opens but we design for desktop"
            </p>
            <p style={{ fontWeight: '700', marginBottom: '5px' }}>2025 Email:</p>
            <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>
              "We design mobile-first now (finally)"
            </p>
          </div>

          <div style={{ borderTop: `1px solid rgba(251, 191, 36, 0.2)`, paddingTop: '20px' }}>
            <p style={{ fontWeight: '700', marginBottom: '5px' }}>2015 Marketing Ops:</p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              "We'll figure out roles later, just ship campaigns"
            </p>
            <p style={{ fontWeight: '700', marginBottom: '5px' }}>2025 Marketing Ops:</p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              "53% misalignment but we keep writing job descriptions like it's 2010"
            </p>
            <p style={{ fontWeight: '700', marginBottom: '5px' }}>2035 Marketing Ops:</p>
            <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>
              TBD but probably "We design org charts for reality now (finally)"
            </p>
          </div>
        </div>

        <p style={{ fontWeight: '700', marginBottom: '10px' }}>
          Why It Took 10 Years for Email:
        </p>
        <p style={{ marginBottom: '20px' }}>
          Because we treated mobile as a technical problem (responsive design! mobile-first CSS!) instead of a strategic problem (the audience changed, we need to change first).
        </p>

        <p style={{ fontWeight: '700', marginBottom: '10px' }}>
          Why It'll Take 10 Years for Ops:
        </p>
        <p style={{ marginBottom: '30px' }}>
          Because we're treating role misalignment as a technical problem (better tools! more integrations!) instead of a strategic problem (the work changed, our job descriptions didn't).
        </p>

        <p style={{ fontWeight: '700', marginBottom: '10px' }}>
          What Mobile Taught Us:
        </p>
        <p style={{ marginBottom: '20px' }}>
          You can have the best technology in the world. But if you design for the wrong audience, it fails.
        </p>
        <p style={{ marginBottom: '30px' }}>
          You can have Marketo, HubSpot, Salesforce, and a $40M martech stack. But if you design the org chart for 2010 while doing 2025 work, it fails.
        </p>

        {/* Data box */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444` }}>
          <p style={{ fontWeight: '700', marginBottom: '15px' }}>
            The Data We're Ignoring:
          </p>
          <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
            <li>Mobile opens grew from 52% to 55% over 10 years (3% increase, plateau)</li>
            <li>Marketing Ops role misalignment sits at 53% in 2025</li>
            <li>Role clarity dropped 9% in just one year (2023→2024)</li>
            <li>Martech stack size tripled (5-7 tools in 2015, 90-120 for enterprise in 2025)</li>
            <li>But only 49% of tools are actively used</li>
          </ul>
        </div>

        <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
          We learned to design mobile-first.
        </p>

        <p style={{ fontWeight: '700', fontSize: '1.2rem', color: COLORS.yellow }}>
          When do we learn to design org-charts-first?
        </p>
      </div>
    </section>
  );
}

// Persona Sections - Meet [Name]
function PersonaMeetSection({ name, role, mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto',
    overflowY: 'auto'
  };

  // Alex - Marketing Operations Manager
  if (name === 'Alex') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          Meet {name}
        </h2>
        <h3 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: COLORS.lightGrey, marginBottom: mobile ? '20px' : '30px' }}>
          {role} | Hired Q1 2023 | 800-person B2B SaaS
        </h3>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          <p style={{ marginBottom: '20px' }}>
            Alex was hired to "optimize lifecycle programs."
          </p>

          <p style={{ marginBottom: '20px' }}>
            They'd spent five years at their previous company designing sophisticated nurture paths—the kind where a single persona could experience seventeen different journey variations based on behavior, firmographic fit, and engagement history.
          </p>

          <p style={{ marginBottom: '20px' }}>
            They loved it. They were good at it.
          </p>

          <p style={{ marginBottom: '20px' }}>
            The job description said "Lifecycle." The interview said "Customer journey." The hiring manager said, "We need someone who really understands how to move people through stages."
          </p>

          <p style={{ marginBottom: '20px' }}>
            Alex said, "That's exactly what I love—designing experiences that guide people."
          </p>

          <p style={{ marginBottom: '30px' }}>
            Offer signed. Start date set. Excitement: High.
          </p>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>What Alex Expected:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>Build multi-touch nurture programs</li>
              <li>Implement behavioral scoring</li>
              <li>Design stage-based journey paths</li>
              <li>Optimize conversion rates between lifecycle stages</li>
              <li>A/B test messaging and timing</li>
            </ul>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Alex's Background:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>5 years lifecycle marketing experience</li>
              <li>Marketo certified expert</li>
              <li>Built full lifecycle program from scratch at previous company</li>
              <li>Portfolio included 12-stage customer journey with 40+ nurture variations</li>
              <li>Exit velocity at previous company: 23% improvement in conversion rates</li>
            </ul>
          </div>

          <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
            "I'm going to build something beautiful here."
          </p>
        </div>
      </section>
    );
  }

  // Jordan - Marketing Data Analyst
  if (name === 'Jordan') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          Meet {name}
        </h2>
        <h3 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: COLORS.lightGrey, marginBottom: mobile ? '20px' : '30px' }}>
          {role} | Hired Q3 2023 | 1,200-person enterprise tech
        </h3>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          <p style={{ marginBottom: '20px' }}>
            Jordan loves data.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Not in the vague "data-driven" marketing buzzword sense. In the "I get genuinely excited about designing clean schemas" sense.
          </p>

          <p style={{ marginBottom: '20px' }}>
            SQL is Jordan's creative medium. Tableau is their canvas. A well-normalized database makes them smile.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Previous company: Built the entire reporting infrastructure from scratch. Designed the schema. Owned the data pipelines. Created dashboards that actually answered questions instead of generating more questions.
          </p>

          <p style={{ marginBottom: '30px', fontStyle: 'italic' }}>
            They were the data architect. Not officially titled that, but everyone knew: If you wanted data to make sense, you asked Jordan.
          </p>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>The Job Description (excerpt):</p>
            <p style={{ fontStyle: 'italic' }}>
              "Marketing Data Analyst - Own our data strategy. Design reporting architecture. Build executive dashboards. Work cross-functionally to ensure data quality and accessibility."
            </p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>The Interview:</p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Hiring Manager:</span> "We're drowning in data but starving for insights. We need someone who can make sense of our chaos."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Jordan:</span> "That's my specialty. Show me the chaos, I'll show you the patterns."
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Hiring Manager:</span> "Perfect. Our last analyst was very tactical—ran reports but didn't think strategically about the underlying architecture."
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Jordan (mentally):</span> "Okay, so they need someone to actually architect the data. I can do that."
            </p>
          </div>

          <p style={{ marginBottom: '10px' }}>Offer accepted.</p>
          <p style={{ marginBottom: '10px' }}>Start date: September 2023.</p>
          <p style={{ marginBottom: '30px', fontWeight: '700', color: COLORS.yellow }}>
            Jordan's excitement level: High. Finally, a place that wants actual data architecture, not just dashboard puppetry.
          </p>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>What Jordan Expected:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>Design clean data schemas</li>
              <li>Build automated reporting pipelines</li>
              <li>Create executive dashboards</li>
              <li>Implement data governance</li>
              <li>Document data definitions and sources</li>
            </ul>
          </div>

          <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
            "Jordan's Actual Superpower: Seeing the schema that should exist underneath the mess of what does exist."
          </p>
        </div>
      </section>
    );
  }

  // Casey - Marketing Attribution Specialist
  if (name === 'Casey') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          Meet {name}
        </h2>
        <h3 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: COLORS.lightGrey, marginBottom: mobile ? '20px' : '30px' }}>
          {role} | Hired Q1 2024 | 450-person B2B SaaS
        </h3>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          <p style={{ marginBottom: '20px' }}>
            Casey built a full attribution model at their previous company.
          </p>

          <p style={{ marginBottom: '20px' }}>
            Not "we use last-touch and call it attribution." A real multi-touch attribution model. Custom weighting. Cross-channel journey mapping. Actually told you which campaigns drove revenue and which ones just looked good in isolation.
          </p>

          <p style={{ marginBottom: '20px' }}>
            It took Casey 8 months to build. Another 4 months to get sales and marketing aligned on the definitions. But when it was done, it worked. 89% data fill rate. Decisions got made based on it. Budget got allocated differently. Revenue improved.
          </p>

          <p style={{ marginBottom: '30px', fontWeight: '700' }}>
            Casey was proud of it.
          </p>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>The Job Posting:</p>
            <p style={{ fontStyle: 'italic' }}>
              "Marketing Attribution Specialist - Build our attribution model from the ground up. You'll own our multi-touch attribution strategy, implement tracking, and partner with sales and marketing to ensure we're measuring what matters."
            </p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>The Interview:</p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP Marketing:</span> "We have no attribution right now. We're flying blind. Last year we spent $8M on marketing and couldn't tell you which $1M actually worked."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "That's exactly what attribution solves. What's your data infrastructure like?"
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "We have Marketo, Salesforce, and a data warehouse. You'd have access to all of it."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "And who owns the data schema definitions?"
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "You would, as part of building attribution."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey (mentally):</span> "Perfect. Schema ownership, cross-functional support, blank slate to build it right."
            </p>
          </div>

          <p style={{ marginBottom: '10px' }}>Offer signed: February 2024</p>
          <p style={{ marginBottom: '10px' }}>Casey's confidence: High</p>
          <p style={{ marginBottom: '30px' }}>Casey's previous track record: 89% fill rate, drove $2.1M in budget reallocation based on attribution insights</p>

          <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
            "What Could Go Wrong?"
          </p>
        </div>
      </section>
    );
  }

  // Placeholder for other personas
  // Morgan - Meet
  if (name === 'Morgan') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          Meet {name}
        </h2>
        <h3 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: COLORS.lightGrey, marginBottom: mobile ? '20px' : '30px' }}>
          {role} | Hired Q2 2023 | 650-person SaaS
        </h3>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          <p style={{ marginBottom: '15px' }}>Morgan is a HubSpot expert.</p>
          <p style={{ marginBottom: '15px' }}>Seven years of experience. Certified. Built programs for three different companies. Knows the platform inside and out.</p>
          <p style={{ marginBottom: '30px' }}>
            Previous company ran on HubSpot for 5 years under Morgan's leadership. Clean data. Automated workflows. Reports that actually helped make decisions. It worked.
          </p>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.1rem' }}>The Opportunity:</p>
            <p style={{ fontStyle: 'italic', marginBottom: '20px' }}>
              "We're migrating from HubSpot to Marketo. We need someone to lead the transition and then optimize the new platform."
            </p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Morgan's Thought Process:</p>
            <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>
              "I've never used Marketo, but I've led platform migrations before. The principles are the same: clean data, clear workflows, documented processes. Platform is just the tool. The strategy is what matters."
            </p>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>The Interview:</p>

            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP Marketing:</span> "Why are we switching to Marketo?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan:</span> "That's actually my first question too. What's driving the change?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "HubSpot doesn't scale to enterprise needs. Marketo has better reporting, more advanced automation, stronger Salesforce integration."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan:</span> "Makes sense. What's the current state of your HubSpot instance?"
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "Honestly? It's a mess. Data's all over the place. That's part of why we're switching—fresh start."
            </p>

            <p style={{ fontWeight: '700', marginBottom: '10px', color: COLORS.yellow }}>Morgan's Internal Alarm Bell:</p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic' }}>
              "A messy HubSpot instance doesn't get cleaner by moving to Marketo. The mess moves with you."
            </p>

            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan (out loud):</span> "Just to clarify—have you done a data audit? Because if we migrate messy data, we'll just have a messy Marketo instance."
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "The migration partner will help clean it up during the move."
            </p>

            <p style={{ fontWeight: '700', marginBottom: '10px', color: COLORS.yellow }}>Morgan's Thought:</p>
            <p style={{ fontStyle: 'italic' }}>
              "That's not how this works. But okay, I'll fix it once I'm in there."
            </p>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
            <p style={{ marginBottom: '10px' }}>Offer accepted: June 2023</p>
            <p style={{ marginBottom: '10px' }}>Migration start date: July 2023</p>
            <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
              Morgan's optimism: Moderate (that alarm bell is still ringing)
            </p>
          </div>
        </div>
      </section>
    );
  }

  return <PlaceholderSection title={`Meet ${name} - ${role}`} mobile={mobile} />;
}

// Persona Sections - The Promise
function PersonaPromiseSection({ name, mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto',
    overflowY: 'auto'
  };

  // Alex - The Promise
  if (name === 'Alex') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Promise
        </h2>
        <h3 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: COLORS.lightGrey, marginBottom: mobile ? '20px' : '30px' }}>
          What the job description said
        </h3>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '10px', color: COLORS.yellow }}>Job Title:</p>
            <p style={{ marginBottom: '20px' }}>Marketing Operations Manager</p>

            <p style={{ fontWeight: '700', marginBottom: '10px', color: COLORS.yellow }}>Posted:</p>
            <p style={{ marginBottom: '20px' }}>February 2023</p>

            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>Key Responsibilities (excerpt):</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>"Build sophisticated nurture programs to guide prospects through the customer lifecycle"</li>
              <li>"Optimize customer journey mapping and stage transitions"</li>
              <li>"Implement behavioral scoring and segmentation strategies"</li>
              <li>"Design multi-channel campaign orchestration"</li>
              <li>"Drive conversion rate improvements through testing and optimization"</li>
            </ul>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Interview Highlights (Alex's notes from conversation):</p>

            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Hiring Manager:</span> "We're investing heavily in the customer experience. We need someone who understands that marketing isn't just about generating leads—it's about building relationships."
            </p>

            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Alex:</span> "Absolutely. That's why I focus on journey design. It's not about one campaign. It's about the entire experience."
            </p>

            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Hiring Manager:</span> "Exactly! That's what we need. Our previous person was very tactical. We need strategic thinking."
            </p>

            <p style={{ marginBottom: '20px', fontStyle: 'italic', fontWeight: '700', color: COLORS.yellow }}>
              Alex's Note to Self After Interview: "This is perfect. They get it."
            </p>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Offer Letter Highlights:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>Base: $95K</li>
              <li>Title: Marketing Operations Manager</li>
              <li>Department: Marketing</li>
              <li>Reports to: VP Marketing</li>
              <li>Start Date: March 15, 2023</li>
            </ul>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderLeft: `4px solid ${COLORS.yellow}` }}>
            <p style={{ fontStyle: 'italic', marginBottom: '10px' }}>
              <span style={{ fontWeight: '700' }}>Alex's LinkedIn Update (March 14, 2023):</span>
            </p>
            <p style={{ marginBottom: '15px' }}>
              "Excited to join [Company] as Marketing Operations Manager! Looking forward to building sophisticated lifecycle programs and optimizing the customer journey. Let's do this! 🚀"
            </p>
            <p style={{ fontSize: '0.9rem', color: COLORS.lightGrey }}>
              Likes: 147 | Comments: 23 (mostly "Congrats!" and "They're lucky to have you!")
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Jordan - The Promise
  if (name === 'Jordan') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Promise
        </h2>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>Job Posting - Marketing Data Analyst:</p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic' }}>
              "We're looking for a data-obsessed analyst who can transform our marketing data chaos into strategic insights. You'll own our data architecture, design our reporting strategy, and partner with sales, marketing, and operations to ensure everyone's working from the same source of truth."
            </p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Key Responsibilities:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>Design and maintain marketing data architecture</li>
              <li>Build automated reporting and dashboards</li>
              <li>Ensure data quality and governance</li>
              <li>Partner cross-functionally on data strategy</li>
              <li>Document data sources and definitions</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>What We're Looking For:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>Strong SQL skills (required)</li>
              <li>Tableau or similar BI tool expertise</li>
              <li>Data modeling and schema design experience</li>
              <li>Strategic thinker who sees the big picture</li>
              <li>Someone who can translate data into action</li>
            </ul>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Interview Conversation (Jordan's notes):</p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Hiring Manager (VP Marketing):</span> "Our data is a mess. Honestly, I don't trust half the reports I see because they never match. Sales says one thing, marketing says another, finance says a third thing."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Jordan:</span> "That's usually a schema design issue. If everyone's pulling from different sources with different definitions, you'll never have alignment."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "Exactly! That's what we need—someone who can fix the underlying architecture, not just make prettier dashboards."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Jordan:</span> "Have you documented your data sources and definitions?"
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "No. That's what you'd help us do."
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Jordan:</span> "Perfect. That's where I'd start. Define the source of truth, document the schema, then build reporting on top of that foundation."
            </p>
            <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
              VP: "You're hired."
            </p>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Offer Details:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>Title: Marketing Data Analyst</li>
              <li>Salary: $105K</li>
              <li>Reports to: VP Marketing</li>
              <li>Scope: "Own our data strategy"</li>
              <li>Start: September 15, 2023</li>
            </ul>
          </div>

          <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
            Jordan's thought leaving the interview: "Finally, a place that gets it."
          </p>
        </div>
      </section>
    );
  }

  // Casey - The Promise
  if (name === 'Casey') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Promise
        </h2>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.1rem' }}>Marketing Attribution Specialist</p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic' }}>
              "Own our attribution strategy from the ground up. We're a $450-person B2B SaaS company scaling fast, and we need to know what's working. You'll build our multi-touch attribution model, implement tracking infrastructure, and partner across sales and marketing to ensure we're making data-driven decisions."
            </p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Responsibilities:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px', fontSize: '0.95rem' }}>
              <li>Design and implement multi-touch attribution model</li>
              <li>Define data requirements and tracking infrastructure</li>
              <li>Partner with marketing, sales, and analytics on definitions</li>
              <li>Build dashboards and reporting for attribution insights</li>
              <li>Drive budget allocation recommendations based on attribution data</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>What We Offer:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <li>Blank slate to build attribution the right way</li>
              <li>Executive support (VP Marketing sponsor)</li>
              <li>Access to full data infrastructure</li>
              <li>Opportunity to drive $8M+ budget decisions</li>
            </ul>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Interview Highlights:</p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP Marketing:</span> "We're embarrassed that we don't have attribution. Last board meeting, the CFO asked 'Which campaigns drove the most revenue?' and we had no answer. Just vibes and vanity metrics."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "Attribution fixes that. But it requires cross-functional buy-in. Who would I work with?"
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "You'd partner with the demand gen team, sales ops, and our data analyst. Everyone's aligned that we need this."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "And data schema ownership—would I have the authority to define fields and definitions?"
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "Absolutely. That's part of the role."
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "Then I can build this. I've done it before. 8-12 months to full implementation, 85%+ fill rate target."
            </p>
            <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
              VP: "Perfect. Let's do it."
            </p>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Offer Accepted:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>Title: Marketing Attribution Specialist</li>
              <li>Salary: $98K</li>
              <li>Start Date: February 1, 2024</li>
              <li>Reporting: VP Marketing</li>
            </ul>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Casey's plan:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <li>Month 1-2: Audit data sources, define requirements</li>
              <li>Month 3-4: Build attribution model (first version)</li>
              <li>Month 5-6: Implement tracking, test fill rates</li>
              <li>Month 7-8: Iterate based on feedback</li>
              <li>Month 9+: Run at steady state, provide insights</li>
            </ul>
          </div>

          <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
            "I'm going to build something they can actually use."
          </p>
        </div>
      </section>
    );
  }

  // Placeholder for other personas
  // Morgan - The Promise
  if (name === 'Morgan') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Promise
        </h2>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.1rem' }}>Marketing Operations Lead</p>

            <p style={{ marginBottom: '20px', fontStyle: 'italic' }}>
              "Lead our migration from HubSpot to Marketo and own our marketing automation strategy. You'll manage the transition, optimize the platform, and build scalable processes for our growing marketing team."
            </p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Key Responsibilities:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>Lead HubSpot → Marketo migration (6-month project)</li>
              <li>Partner with migration vendor</li>
              <li>Own marketing automation strategy</li>
              <li>Build workflows, campaigns, and reports in Marketo</li>
              <li>Train marketing team on new platform</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Requirements:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>5+ years marketing operations experience</li>
              <li>Platform migration experience (HubSpot, Marketo, or similar)</li>
              <li>Strong project management skills</li>
              <li>Strategic thinker who can design scalable processes</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>What We Offer:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>Lead a high-impact platform transformation</li>
              <li>Executive visibility (report to VP Marketing)</li>
              <li>$120K salary + bonus</li>
              <li>Growth opportunity as we scale</li>
            </ul>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.1rem' }}>
              Morgan's Migration Plan (presented in interview):
            </p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Phase 1 (Months 1-2): Audit & Clean</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>Audit HubSpot data quality</li>
              <li>Define data standards for migration</li>
              <li>Clean duplicates, standardize fields</li>
              <li>Document current workflows and campaigns</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Phase 2 (Months 3-4): Migrate & Test</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>Work with vendor on data migration</li>
              <li>Rebuild workflows in Marketo</li>
              <li>Test integrations (Salesforce, etc.)</li>
              <li>Parallel run both systems</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Phase 3 (Months 5-6): Optimize & Train</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>Sunset HubSpot</li>
              <li>Optimize Marketo setup</li>
              <li>Train marketing team</li>
              <li>Document processes</li>
            </ul>

            <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>
              <span style={{ fontWeight: '700' }}>VP's reaction:</span> "This is exactly what we need. You're hired."
            </p>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '10px', color: COLORS.yellow }}>Offer Details:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>Title: Marketing Operations Lead</li>
              <li>Salary: $120K</li>
              <li>Start: June 15, 2023</li>
              <li>Scope: Lead migration, then own platform strategy</li>
              <li>Migration budget: $180K (vendor + licenses)</li>
            </ul>

            <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
              Morgan's confidence: "I can do this."
            </p>
          </div>
        </div>
      </section>
    );
  }

  return <PlaceholderSection title={`${name}: The Promise`} mobile={mobile} />;
}

// Persona Sections - The Reality
function PersonaRealitySection({ name, mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto',
    overflowY: 'auto'
  };

  // Alex - The Reality
  if (name === 'Alex') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Reality
        </h2>
        <h3 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: COLORS.lightGrey, marginBottom: mobile ? '20px' : '30px' }}>
          What the actual work became
        </h3>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          {/* Month 1 */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>Month 1, Week 1:</p>
            <p style={{ marginBottom: '10px' }}>First 1:1 with VP Marketing.</p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "So, we need to talk about MQL volume. We're tracking at 40% below target this quarter."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Alex (internal monologue):</span> "Okay, maybe this is context before we dive into lifecycle strategy..."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "Can you pull a report of everyone who visited the pricing page in the last 30 days and push them to sales?"
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Alex:</span> "Sure, I can do that. Are we thinking of that as the top of a nurture sequence or...?"
            </p>
            <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "No, just send the list to sales. We need MQLs."
            </p>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Month 1, Week 4 - Alex's workload breakdown (actual time logged):</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>45% | Manual list pulls for sales ("pricing page visitors," "webinar attendees," "content downloaders")</li>
              <li>25% | Firefighting form failures (webhook broke, nobody's fixing it)</li>
              <li>15% | Explaining why attribution doesn't work (spoiler: 8% fill rate)</li>
              <li>10% | Actual lifecycle optimization work</li>
              <li>5% | Meetings about "why aren't we generating more MQLs?"</li>
            </ul>
            <p style={{ marginTop: '15px' }}>Campaigns shipped: 3 (all demand gen, not lifecycle)</p>
            <p>Nurture programs built: 0</p>
            <p>Excitement level: Dropping</p>
          </div>

          {/* Month 6 */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Month 6:</p>
            <p style={{ marginBottom: '10px' }}>Workarounds created: 43</p>
            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Manual processes Alex owns:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', fontSize: '0.9rem' }}>
              <li>Weekly list pull: pricing page visitors (30 min)</li>
              <li>Daily list pull: demo requests (15 min)</li>
              <li>Bi-weekly list pull: webinar attendees (45 min)</li>
              <li>Manual lead score updates (webhook still broken) (2 hours/week)</li>
              <li>Attribution reconciliation (systems don't match) (3 hours/week)</li>
              <li>Campaign performance reporting (dashboard broke, unfixed) (2 hours/week)</li>
              <li>Form failure triage (ongoing issue, no root cause fix) (1 hour/week)</li>
              <li style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>... [36 more workarounds]</li>
            </ul>
          </div>

          {/* Month 12 */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Month 12:</p>
            <p style={{ marginBottom: '10px' }}>Campaigns per month: 1.2 (down from 3)</p>
            <p style={{ marginBottom: '10px' }}>Nurture programs built: Still 0</p>
            <p style={{ marginBottom: '20px' }}>Workarounds: 87</p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Conversation with friend (text exchange):</p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Friend:</span> "How's the new job?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Alex:</span> "I'm a glorified list puller."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Friend:</span> "What?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Alex:</span> "I was hired to build lifecycle programs. I pull lists for sales all day."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Friend:</span> "Did you talk to your boss?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Alex:</span> "Four times. He keeps saying 'we'll get to lifecycle stuff once we hit our MQL targets.'"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Friend:</span> "Are you hitting targets?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Alex:</span> "No. Because I'm not building the nurture programs that would actually convert people. I'm just pulling lists."
            </p>
          </div>

          {/* Month 18 */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Month 18:</p>
            <p style={{ marginBottom: '10px' }}>Campaigns per month: 0.7</p>
            <p style={{ marginBottom: '15px' }}>Workarounds maintained: 87 (personal), 300 (team-wide)</p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Time allocation:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>67% | Maintaining workarounds</li>
              <li>18% | Firefighting</li>
              <li>10% | Meetings explaining why velocity is slow</li>
              <li>5% | Actual strategic work</li>
              <li>0% | Learning/development</li>
            </ul>

            <p style={{ marginTop: '15px', marginBottom: '5px' }}>Car crying frequency: Twice a month (parking lot after particularly bad 1:1s)</p>
            <p style={{ marginBottom: '5px' }}>Resume updates: Every Sunday night</p>
            <p style={{ marginBottom: '5px' }}>Therapy topic: "I thought I forgot how to do my job"</p>
            <p style={{ marginBottom: '5px' }}>LinkedIn activity: None (down from daily)</p>
          </div>

          <p style={{ fontWeight: '700', color: COLORS.yellow }}>
            What Changed Between Month 1 and Month 18:
          </p>
          <p style={{ marginTop: '10px' }}>
            Not Alex's skill. Not Marketo's capability. Not budget.
          </p>
          <p style={{ marginTop: '10px', fontStyle: 'italic' }}>
            What changed: The gap between job title and actual work crushed Alex's capacity to build anything strategic.
          </p>
        </div>
      </section>
    );
  }

  // Jordan - The Reality
  if (name === 'Jordan') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Reality
        </h2>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>Week 1:</p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP in first 1:1:</span> "Hey, can you pull a list of all opportunities created in the last 90 days with associated campaign touches? Sales needs it by EOD."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Jordan:</span> "Sure. Where's the schema documentation?"
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "The what?"
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Jordan (internally):</span> "Okay, so step one is documenting the schema. I'll do this list pull, then propose the documentation project."
            </p>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Week 2 - Jordan proposes data governance project:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px', fontSize: '0.95rem' }}>
              <li>2 weeks to audit current data sources</li>
              <li>2 weeks to document schema</li>
              <li>1 week to get stakeholder alignment on definitions</li>
              <li>2 weeks to build automated reporting on clean foundation</li>
            </ul>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "That sounds great, but can it wait until next quarter? Right now we need you focused on pulling reports for the board meeting."
            </p>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Month 3 - Jordan's actual workload:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>71% | "Can you pull this list?" requests (averaging 8 per day)</li>
              <li>12% | Reconciling why two reports don't match</li>
              <li>11% | Building dashboards on undefined data (knowing they'll be wrong)</li>
              <li>6% | Actual data architecture work (done after hours)</li>
            </ul>
            <p style={{ marginTop: '15px', fontWeight: '700', color: COLORS.yellow }}>
              Time spent doing what they were hired for: 6%
            </p>
          </div>

          {/* Data Lag Evolution */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: `2px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.1rem' }}>
              The Data Lag Evolution:
            </p>
            <p style={{ marginBottom: '15px', fontSize: '0.9rem', fontStyle: 'italic' }}>
              Jordan tracked it obsessively because it was the canary in the coal mine:
            </p>

            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontWeight: '700' }}>Month 1:</p>
              <p>Data refresh lag: 5 minutes</p>
              <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>Jordan's diagnosis: "Healthy system"</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontWeight: '700' }}>Month 6:</p>
              <p>Data refresh lag: 15 minutes</p>
              <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>Jordan's diagnosis: "Systems under stress, need optimization"</p>
              <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>Response: "Maybe next quarter"</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontWeight: '700' }}>Month 12:</p>
              <p>Data refresh lag: 30 minutes</p>
              <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>Jordan's diagnosis: "This is a problem. Sales is working with stale data."</p>
              <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>Response: "Can you just run the refresh more frequently?"</p>
            </div>

            <div>
              <p style={{ fontWeight: '700' }}>Month 18:</p>
              <p style={{ marginBottom: '10px' }}>Data refresh lag: 45 minutes</p>
              <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>Jordan's diagnosis: "This is now causing revenue impact"</p>
              <p style={{ fontStyle: 'italic', color: COLORS.lightGrey }}>Response: "Just use yesterday's data if it's not refreshed yet"</p>
            </div>
          </div>

          <p style={{ marginBottom: '20px', fontWeight: '700' }}>
            Why the Lag Kept Growing:
          </p>
          <p style={{ marginBottom: '20px' }}>
            Not because the systems got slower. Because nobody owned the schema.
          </p>
          <p style={{ marginBottom: '30px', fontStyle: 'italic' }}>
            Every new campaign added data. Every new integration added a source. Every new dashboard added a query. All built on top of an undocumented, ungoverned mess.
          </p>
          <p style={{ marginBottom: '30px', fontStyle: 'italic', color: COLORS.lightGrey }}>
            It's like building a skyscraper on quicksand and being confused when it sinks.
          </p>

          <p style={{ marginBottom: '10px', fontWeight: '700', color: COLORS.yellow }}>Month 18 Reality:</p>
          <p style={{ marginBottom: '10px' }}>Jordan spends 6% of time on data architecture.</p>
          <p style={{ marginBottom: '10px' }}>The other 94% is spent pulling lists and building dashboards on top of data that nobody owns, nobody documents, and nobody will fix.</p>
          <p style={{ marginBottom: '20px' }}>Jordan can see the solution. Jordan has proposed the solution 14 times.</p>
          <p style={{ marginBottom: '20px', fontStyle: 'italic' }}>
            Nobody will prioritize it because "we need to hit this quarter's numbers first."
          </p>
          <p style={{ fontWeight: '700', color: COLORS.yellow }}>
            Meanwhile, the 45-minute data lag means sales is calling prospects after they've already talked to a competitor.
          </p>
        </div>
      </section>
    );
  }

  // Casey - The Reality
  if (name === 'Casey') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Reality
        </h2>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          {/* Attempt 1 */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)' }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.1rem' }}>
              Attempt 1: The Solo Build (Months 1-4)
            </p>

            <p style={{ marginBottom: '15px' }}>Casey starts with an audit.</p>
            <p style={{ marginBottom: '10px' }}>Good news: Marketo and Salesforce are connected.</p>
            <p style={{ marginBottom: '20px' }}>Bad news: Nobody documented how. Or what fields mean. Or which data is source of truth.</p>

            <p style={{ marginBottom: '10px', fontWeight: '700' }}>Example discovery:</p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "What's the definition of an MQL?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Demand Gen Manager:</span> "Someone who hits 100 lead score points."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Sales Ops:</span> "Someone who requests a demo."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP Marketing:</span> "I thought it was when they hit a lifecycle stage?"
            </p>

            <p style={{ marginTop: '15px', marginBottom: '10px' }}>All three definitions exist in the data. None are consistently used.</p>
            <p style={{ marginBottom: '10px' }}>Casey documents this: "We have three MQL definitions operating simultaneously."</p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "Interesting. Can you just use the Salesforce one for now and we'll align on definitions later?"
            </p>
          </div>

          {/* Month 4 Result */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Month 4 - Attempt 1 Launch:</p>
            <p style={{ marginBottom: '10px' }}>Casey builds the best attribution model possible with:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>Undefined MQL definitions</li>
              <li>Undocumented campaign taxonomies</li>
              <li>Inconsistent tracking (some campaigns tracked, some not, nobody knows which)</li>
              <li>No cross-functional agreement on what "conversion" means</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px', color: COLORS.yellow, fontSize: '1.2rem' }}>
              Result: Data fill rate: 8%
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', fontSize: '0.95rem' }}>
              Meaning: 92% of the time, the model can't attribute revenue to campaigns because the data is too messy
            </p>

            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "8%? Why so low?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "Because nobody owns the data definitions. We have three different MQL definitions, campaign tracking is inconsistent, and—"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "Can you fix it?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "Yes, but I need cross-functional alignment to define standards and—"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "How long will that take?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "Probably 2 months if we get everyone in a room and—"
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "We don't have 2 months. The board wants attribution next quarter."
            </p>

            <p style={{ marginTop: '15px', fontStyle: 'italic' }}>
              Casey's internal dialogue: "I built an 89% fill rate model at my last company. What's different here? ...Oh. There, I had schema ownership and cross-functional alignment. Here, I have neither."
            </p>
          </div>

          {/* Attempt 2 */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.1rem' }}>
              Attempt 2: The Consultant Band-Aid (Months 5-10)
            </p>

            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "I'm bringing in a consultant to help. They specialize in attribution."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "The problem isn't attribution expertise. It's data governance. We need to—"
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "They're starting Monday."
            </p>

            <p style={{ marginBottom: '15px', fontWeight: '700' }}>Consultant cost: $175K for 6 months</p>

            <p style={{ marginBottom: '20px', fontStyle: 'italic' }}>
              Consultant's first diagnosis (Week 1): "Your data governance is a mess. You need to define standards, get cross-functional alignment, and—"
            </p>
            <p style={{ marginBottom: '30px', fontWeight: '700', color: COLORS.yellow }}>
              Casey (internally): "I SAID THAT IN MONTH 1."
            </p>

            <p style={{ marginBottom: '10px', fontWeight: '700' }}>Months 5-10 Progress:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>Got marketing and sales in a room (finally)</li>
              <li>Defined MQL (chose one definition, deprecated the others)</li>
              <li>Documented campaign taxonomy</li>
              <li>Rebuilt attribution model on cleaner foundation</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px', color: COLORS.yellow, fontSize: '1.2rem' }}>
              Result: Data fill rate: 42%
            </p>
            <p style={{ marginBottom: '10px' }}>Consultant leaves (contract complete)</p>
            <p style={{ marginBottom: '20px' }}>Casey inherits maintenance of 42% model</p>

            <p style={{ marginTop: '15px', fontStyle: 'italic' }}>
              Casey's assessment: "42% is better than 8%, but it's still useless for real decision-making. We spent $175K to go from 'doesn't work' to 'kind of works sometimes.'"
            </p>
          </div>

          {/* Attempt 3 */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderLeft: `4px solid #22c55e` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: '#22c55e', fontSize: '1.1rem' }}>
              Attempt 3: The Org Chart Fix (Months 11-14)
            </p>

            <p style={{ marginBottom: '15px' }}>New VP Marketing starts (previous VP moved to another company).</p>

            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>New VP's first question:</span> "Why is our attribution at 42%?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey (prepared):</span> "Because we never fully solved the data governance problem. The consultant got us partway there, but we need ongoing schema ownership and—"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>New VP:</span> "Show me your proposal."
            </p>
            <p style={{ marginBottom: '30px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey (shocked):</span> "Really?"
            </p>

            <p style={{ marginBottom: '10px', fontWeight: '700', color: '#22c55e' }}>What Changed:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>New VP assigned a data engineer to partner with Casey</li>
              <li>Gave Casey actual schema ownership authority</li>
              <li>Made data governance a Q1 priority (not "next quarter")</li>
              <li>Funded cross-functional working group</li>
            </ul>

            <p style={{ marginBottom: '10px', fontWeight: '700' }}>Months 11-14:</p>
            <p style={{ marginBottom: '10px' }}>Casey + data engineer partner:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>Finished governance work consultant started</li>
              <li>Cleaned up remaining schema issues</li>
              <li>Automated tracking for all campaigns</li>
              <li>Got finance, sales, and marketing aligned on revenue definitions</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px', color: '#22c55e', fontSize: '1.2rem' }}>
              Result: Data fill rate: 85%
            </p>
            <p style={{ marginBottom: '10px' }}>Cost: $40K (data engineer's time + Casey's time)</p>
            <p style={{ marginBottom: '30px' }}>Timeline: 4 months</p>

            <p style={{ marginBottom: '15px', fontWeight: '700', color: '#22c55e' }}>Attribution Finally Works:</p>
            <p style={{ marginBottom: '10px' }}>Insight from attribution: $1.2M in budget was going to campaigns with 2% conversion rates, while high-performing campaigns were underfunded.</p>
            <p style={{ marginBottom: '10px' }}>Budget reallocation: $800K moved to high-performers.</p>
            <p style={{ marginBottom: '20px' }}>Projected revenue impact: $2.8M lift.</p>

            <p style={{ marginTop: '15px', fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
              Casey's reaction: "I could have built this in Month 4 if someone had just given me schema ownership from day one."
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Morgan - The Reality
  if (name === 'Morgan') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Reality
        </h2>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          {/* Month 1-2: Audit Discovery */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.1rem' }}>
              Month 1-2: The Audit Discovery
            </p>

            <p style={{ marginBottom: '15px' }}>Morgan starts auditing HubSpot.</p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Findings:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>47,000 duplicate contacts (no merge strategy)</li>
              <li>Custom fields: 312 (87 are unused, 43 are duplicates with different names)</li>
              <li>Workflows: 156 (92 are inactive, 28 nobody understands)</li>
              <li>Data definitions: Undocumented</li>
              <li>Schema ownership: Nobody</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Morgan's Report to VP (Week 3):</p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>
              "We need to clean this up before migration. If we move 47K duplicates into Marketo, they'll still be duplicates. Just in a more expensive platform."
            </p>

            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "Can the vendor handle that during migration?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan:</span> "They can dedupe based on email, but the deeper issues—field definitions, schema design—we need to own that."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "How long will that take?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan:</span> "2-3 weeks if we prioritize it."
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "We're already paying the vendor. Let's just move forward and clean it up in Marketo after."
            </p>

            <p style={{ fontWeight: '700', color: COLORS.yellow }}>Morgan's Alarm Bell: Now screaming</p>
          </div>

          {/* Month 3-6: The Migration */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Month 3-6: The Migration</p>

            <p style={{ marginBottom: '15px' }}>Vendor migrates data from HubSpot to Marketo.</p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Result:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>47,000 duplicates successfully migrated (still duplicates)</li>
              <li>312 custom fields recreated (still mostly useless)</li>
              <li>Workflows rebuilt (still nobody knows what 28 of them do)</li>
              <li>Cost: $180K</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>Month 6: Go-Live</p>
            <p style={{ marginBottom: '10px' }}>HubSpot sunset.</p>
            <p style={{ marginBottom: '20px' }}>Marketo is now the system of record.</p>

            <p style={{ fontWeight: '700', fontStyle: 'italic' }}>
              Morgan's assessment: "We spent $180K to move the mess from one platform to another."
            </p>
          </div>

          {/* Month 7: Reports Don't Match */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Month 7: The Reports Don't Match</p>

            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px', fontSize: '0.95rem' }}>
              <li>Sales reports opportunity data from Salesforce: "$2.3M closed-won from marketing this quarter"</li>
              <li>Marketing reports opportunity data from Marketo: "$1.8M closed-won from marketing this quarter"</li>
              <li>Finance reports: "$2.1M" (uses different attribution rules)</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Meeting (Week 27):</p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "Why don't these match?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan:</span> "Because we never defined data standards before migration. Salesforce, Marketo, and Finance are using different field definitions for 'marketing-sourced.'"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "Can you fix it?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan:</span> "Yes, but we need to define schema standards and get cross-functional buy-in on definitions. That's what I proposed in Month 2."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "How long will that take?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan:</span> "3-4 weeks if we prioritize it."
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "That seems complex. Is Marketo just harder to use than HubSpot?"
            </p>

            <p style={{ fontWeight: '700', color: COLORS.yellow }}>Morgan's Internal Scream: Prolonged</p>
          </div>

          {/* Month 8: Governance Proposal Rejected */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.25)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Month 8: The Data Governance Proposal</p>

            <p style={{ marginBottom: '15px' }}>Morgan writes a comprehensive proposal:</p>

            <p style={{ fontWeight: '700', marginBottom: '10px', color: COLORS.yellow }}>Data Governance Framework</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>Cost: $32K audit (external partner to document current state)</li>
              <li>Ongoing: $6K/month data governance ownership (could be Morgan + data analyst time)</li>
              <li>Timeline: 2 months to implement standards</li>
              <li>Benefit: Reports that match, clean attribution, no more "which number is right?" meetings</li>
            </ul>

            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP's reaction:</span> "This seems really complex. Isn't there a simpler solution?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan:</span> "The simple solution was doing this before migration. Now we need to retrofit it."
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "Let me think about it."
            </p>

            <p style={{ fontWeight: '700', color: COLORS.yellow }}>Month 8 Status: Proposal tabled as "too complex"</p>
          </div>

          {/* Month 9-14: Firefighting */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.3)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Month 9-14: The Firefighting</p>

            <p style={{ marginBottom: '10px' }}>Morgan spends 6 months firefighting reporting discrepancies.</p>

            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px', fontStyle: 'italic', fontSize: '0.95rem' }}>
              <li>Every week: "Why do these numbers not match?"</li>
              <li>Every week: Morgan explains that undefined data schema means numbers will never match</li>
              <li>Every week: VP asks "Can't you just make them match?"</li>
              <li>Every week: Morgan dies a little inside</li>
            </ul>
          </div>

          {/* Month 15: The Unthinkable */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.35)', border: `2px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem', color: COLORS.yellow }}>
              Month 15: The Unthinkable Conversation
            </p>

            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP (in strategy meeting):</span> "You know, maybe Marketo just isn't right for us. I'm hearing Pardot is really good for Salesforce integration..."
            </p>

            <p style={{ marginBottom: '5px', fontWeight: '700' }}>Morgan (out loud): "..."</p>
            <p style={{ marginBottom: '20px', fontWeight: '700', color: COLORS.yellow }}>
              Morgan (internally): "WE SPENT $180K TO MIGRATE FROM HUBSPOT TO MARKETO BECAUSE OF 'SALESFORCE INTEGRATION' AND NOW YOU WANT TO MIGRATE AGAIN?!"
            </p>

            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan (out loud):</span> "Pardot won't fix the data schema issue."
            </p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "But it's built by Salesforce, so the integration would be native..."
            </p>

            <p style={{ marginBottom: '15px', fontWeight: '700', color: COLORS.yellow }}>
              Morgan (internally): "THE INTEGRATION ISN'T THE PROBLEM. THE ORG CHART IS THE PROBLEM."
            </p>

            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan (out loud):</span> "Let me update my proposal from Month 8. Data governance first, then we can evaluate platforms."
            </p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>VP:</span> "Okay, send it over."
            </p>
          </div>

          {/* Month 16 */}
          <div style={{ padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderLeft: `4px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Month 16:</p>
            <p style={{ marginBottom: '10px' }}>Morgan updates resume.</p>
            <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
              Every Sunday night.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Placeholder for other personas
  return <PlaceholderSection title={`${name}: The Reality`} mobile={mobile} />;
}

// Persona Sections - The Cost
function PersonaCostSection({ name, mobile }) {
  const containerStyle = mobile ? {
    padding: '40px 0',
    marginBottom: '40px'
  } : {
    minWidth: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 60px',
    maxWidth: '900px',
    margin: '0 auto',
    overflowY: 'auto'
  };

  // Alex - The Cost
  if (name === 'Alex') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Cost
        </h2>
        <h3 style={{ fontSize: '1.1rem', fontStyle: 'italic', color: COLORS.lightGrey, marginBottom: mobile ? '20px' : '30px' }}>
          What this misalignment actually costs
        </h3>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          {/* Financial Cost */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>Financial Cost:</p>

            <p style={{ marginBottom: '10px' }}>Alex's salary: $95K/year</p>

            <p style={{ marginBottom: '10px', fontWeight: '700' }}>Alex's effective hourly rate:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>Contracted: 40 hours/week = $45.67/hour</li>
              <li>Actual: 60 hours/week = $30.44/hour (working overtime for free)</li>
            </ul>

            <p style={{ marginBottom: '10px', fontWeight: '700' }}>Cost of 87 manual workarounds (Alex's personal load):</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>Average time per workaround: 1.5 hours/month</li>
              <li>Total time: 130.5 hours/month</li>
              <li>Annual cost in Alex's time: ~$47,600</li>
            </ul>

            <p style={{ marginBottom: '10px', fontWeight: '700' }}>Opportunity cost of strategic work NOT built:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>Lifecycle programs not launched: 3 (estimated)</li>
              <li>Conversion rate improvement not realized: ~15% (based on Alex's previous company performance)</li>
              <li>Revenue impact of 15% conversion improvement: ~$2.3M ARR (company's $15M pipeline × 15%)</li>
            </ul>

            <p style={{ marginBottom: '10px', fontWeight: '700' }}>Recruiting cost when Alex quits:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>External recruiter fee: 25% of salary = $23,750</li>
              <li>Internal time cost: ~$5K</li>
              <li>Onboarding cost: ~$8K</li>
              <li>Time to productivity: 6 months</li>
              <li style={{ fontWeight: '700', color: COLORS.yellow }}>Total replacement cost: $28K-$47K</li>
            </ul>
          </div>

          {/* Human Cost */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Human Cost:</p>

            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>Slack messages containing "urgent": 2,847 in past year (tracked)</li>
              <li>Weekends worked: 41 of 52 (79%)</li>
              <li>Vacation days taken: 3 of 15 (canceled 8 due to "urgency")</li>
              <li>Sunday night resume updates: 47</li>
              <li>Car crying sessions: ~24 (estimated, Alex stopped counting)</li>
              <li>Therapy sessions discussing work: 18</li>
              <li>Friends who've said "You should just quit": 6</li>
              <li>Self-doubt moments per week: Daily</li>
              <li>Number of times Alex's expertise was actually used: 4 in 18 months</li>
            </ul>
          </div>

          {/* Organizational Cost */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Organizational Cost:</p>

            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>Institutional knowledge at risk: High (Alex is the only one who understands the 87 workarounds)</li>
              <li>Team morale impact: Moderate (others see Alex drowning, wonder if they're next)</li>
              <li>Attribution fill rate: Still 8% (Casey tried, failed, nobody helped)</li>
              <li>Data lag: Now 45 minutes (was 5 minutes when Alex started)</li>
              <li>Lifecycle programs built: 0</li>
              <li>Strategic marketing capability: Declining</li>
              <li>VP's assessment of "marketing operations": "Why can't we move faster?"</li>
            </ul>
          </div>

          {/* The Real Cost */}
          <div style={{ padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderLeft: `4px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.2rem' }}>
              The Real Cost:
            </p>

            <p style={{ marginBottom: '15px' }}>You hired someone talented.</p>
            <p style={{ marginBottom: '15px' }}>You paid them $95K to pull lists.</p>
            <p style={{ marginBottom: '15px' }}>You ignored their expertise for 18 months.</p>
            <p style={{ marginBottom: '15px' }}>You're about to spend $40K replacing them.</p>
            <p style={{ marginBottom: '30px' }}>Then you'll hire someone new and do it again.</p>

            <p style={{ marginBottom: '20px', fontWeight: '700' }}>
              The cost isn't $95K salary. The cost is the $2.3M in conversion improvements you didn't get because you couldn't see the difference between a Lifecycle Marketer and a Demand Gen Coordinator.
            </p>

            <p style={{ marginBottom: '10px' }}>But hey, at least you hit your MQL targets.</p>
            <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
              Oh wait. You didn't.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Jordan - The Cost
  if (name === 'Jordan') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Cost
        </h2>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>Financial Cost:</p>

            <p style={{ marginBottom: '15px' }}>Jordan's salary: $105K/year</p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Time allocation analysis:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>Hired to design data architecture: 6% actual time spent</li>
              <li>Pulling lists: 71% actual time spent</li>
              <li style={{ fontWeight: '700', color: COLORS.yellow }}>Effective cost per list pull: ~$75K/year (Jordan's salary × 71%)</li>
            </ul>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>The 45-Minute Lag Impact:</p>

            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px', fontSize: '0.95rem' }}>
              <li>Sales team size: 42 reps</li>
              <li>Average lead response time goal: &lt;5 minutes (industry standard)</li>
              <li>Actual response time: 50 minutes (45-min lag + 5-min rep response)</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Impact of delayed response (industry data):</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>Response in &lt;5 min: 21% contact rate</li>
              <li>Response in 5-60 min: 7% contact rate</li>
              <li style={{ fontWeight: '700', color: COLORS.yellow }}>Conversion rate drop: 67%</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Annual revenue impact (estimated):</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
              <li>Pipeline generated from inbound: $12M</li>
              <li>Conversion rate loss from delay: 67%</li>
              <li style={{ fontWeight: '700', fontSize: '1.1rem', color: COLORS.yellow }}>Estimated revenue loss: $340K/year</li>
            </ul>

            <p style={{ marginTop: '15px', fontStyle: 'italic' }}>
              And that's just ONE symptom of ungoverned data.
            </p>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>The Architecture Debt:</p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>What Jordan proposed (Month 2):</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>7 weeks of architecture work</li>
              <li>Cost: Jordan's time (~$14K in salary)</li>
              <li>Benefit: Clean schema, documented sources, automated reporting, eliminated 45-min lag</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>What actually happened:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>18 months of patchwork</li>
              <li>Cost: Jordan's time ($157K in salary) + data lag revenue impact ($340K) + opportunity cost of wrong decisions made on bad data (unquantified)</li>
              <li>Benefit: More dashboards that don't match each other</li>
            </ul>

            <p style={{ fontWeight: '700', fontSize: '1.2rem', color: COLORS.yellow }}>
              Total 18-month cost of NOT doing the 7-week project: $497K+ quantified
            </p>
            <p style={{ marginTop: '10px', fontSize: '0.9rem', fontStyle: 'italic', color: COLORS.lightGrey }}>
              Unquantified: Bad decisions made on wrong data, sales rep frustration, deals lost to competitors who responded faster
            </p>
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Human Cost:</p>

            <p style={{ fontWeight: '700', marginBottom: '10px' }}>Jordan's Sunday night ritual:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <li>7:00 PM: Open laptop</li>
              <li>7:15 PM: Try to do the architecture work nobody will approve</li>
              <li>9:30 PM: Give up because tomorrow's list pulls are piling up</li>
              <li>10:00 PM: Update resume</li>
              <li>10:45 PM: Close laptop</li>
              <li>11:00 PM: Lie awake thinking about how fixable this is</li>
            </ul>

            <p style={{ fontWeight: '700', marginTop: '20px', marginBottom: '10px' }}>Conversations with spouse:</p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', fontSize: '0.95rem', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Spouse:</span> "How was work?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', fontSize: '0.95rem', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Jordan:</span> "I pulled 11 lists today."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', fontSize: '0.95rem', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Spouse:</span> "Isn't that... not what you were hired for?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', fontSize: '0.95rem', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Jordan:</span> "Nope."
            </p>
            <p style={{ fontStyle: 'italic', fontSize: '0.95rem', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Spouse:</span> "Are you going to quit?"
            </p>
            <p style={{ fontStyle: 'italic', fontSize: '0.95rem', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Jordan:</span> "Probably."
            </p>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderLeft: `4px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.2rem' }}>
              The Real Cost:
            </p>

            <p style={{ marginBottom: '15px' }}>You hired a data architect.</p>
            <p style={{ marginBottom: '15px' }}>You paid them $105K to pull lists.</p>
            <p style={{ marginBottom: '15px' }}>You ignored their warnings about the data lag.</p>
            <p style={{ marginBottom: '15px' }}>You're losing $340K/year because sales works with stale data.</p>
            <p style={{ marginBottom: '30px' }}>You're about to lose Jordan's institutional knowledge of your data chaos.</p>

            <p style={{ marginBottom: '20px', fontWeight: '700' }}>
              Then you'll hire someone new, ignore them for 18 months, and wonder why your data is still a mess.
            </p>

            <p style={{ marginBottom: '10px' }}>But at least you got those board reports.</p>
            <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
              Even if they didn't match each other.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Casey - The Cost
  if (name === 'Casey') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Cost
        </h2>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          {/* Financial Cost */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>Financial Cost:</p>

            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>14-Month Journey:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>Attempt 1 (Months 1-4): $33K (Casey's salary), 8% fill rate</li>
              <li>Attempt 2 (Months 5-10): $175K (consultant) + $49K (Casey's salary) = $224K, 42% fill rate</li>
              <li>Attempt 3 (Months 11-14): $40K (data engineer + Casey time), 85% fill rate</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px', fontSize: '1.2rem', color: COLORS.yellow }}>
              Total Cost: $297K over 14 months
            </p>

            <p style={{ fontWeight: '700', marginTop: '20px', marginBottom: '10px' }}>
              What It Should Have Cost:
            </p>
            <p style={{ marginBottom: '10px' }}>If Casey had schema ownership and cross-functional support from Month 1:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li>Timeline: 4-6 months (not 14)</li>
              <li>Cost: $65K (Casey's salary for period)</li>
              <li>Fill rate: 85%</li>
            </ul>

            <p style={{ fontWeight: '700', fontSize: '1.2rem', color: COLORS.yellow }}>
              Money Wasted: $232K
            </p>
            <p style={{ fontWeight: '700', fontSize: '1.2rem', color: COLORS.yellow }}>
              Time Wasted: 10 months
            </p>
          </div>

          {/* Bad Decision Cost */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>
              Decisions Made on Bad Data (Months 1-10):
            </p>

            <p style={{ marginBottom: '10px' }}>Budget allocated without attribution insights: $6.5M</p>
            <p style={{ marginBottom: '20px' }}>Estimated waste from misallocation (industry average): 15-20%</p>

            <p style={{ fontWeight: '700', fontSize: '1.2rem', color: COLORS.yellow, marginBottom: '20px' }}>
              Cost of Bad Decisions: $975K - $1.3M
            </p>

            <p style={{ fontStyle: 'italic' }}>
              Remember: Month 14 attribution revealed $1.2M was going to campaigns with 2% conversion rates while high-performers were underfunded. That $1.2M misallocation? It was happening during the entire 10 months Casey didn't have authority to fix the data.
            </p>
          </div>

          {/* Human Cost */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Human Cost:</p>

            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Month 4 (8% fill rate):</p>
            <p style={{ marginBottom: '20px', fontStyle: 'italic' }}>
              Casey's internal monologue: "I built an 89% model at my last company. I must have forgotten how to do this."
            </p>
            <p style={{ marginBottom: '20px' }}>Therapy sessions started: Month 5</p>
            <p style={{ marginBottom: '30px' }}>Topic: Imposter syndrome</p>

            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>
              Month 10 (42% fill rate after consultant):
            </p>
            <p style={{ marginBottom: '10px', fontWeight: '700' }}>Conversation with consultant (last day):</p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Consultant:</span> "You were right in Month 1, you know. The problem was always data governance."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "I know."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Consultant:</span> "You told them that."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "I know."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Consultant:</span> "They ignored you and hired me to say the same thing."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "I know."
            </p>
            <p style={{ marginBottom: '30px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Consultant:</span> "That sucks."
            </p>
            <p style={{ marginBottom: '30px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Casey:</span> "Yeah."
            </p>

            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>
              Month 14 (85% fill rate, finally working):
            </p>
            <p style={{ marginBottom: '15px', fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
              Casey's realization: "I wasn't bad at my job. The org chart was broken."
            </p>
            <p style={{ marginBottom: '10px' }}>Therapy topic: Organizational dysfunction (no longer imposter syndrome)</p>
          </div>

          {/* Organizational Cost */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>The Organizational Cost:</p>

            <p style={{ marginBottom: '5px', fontWeight: '700' }}>CMO's Conclusion (Month 6, looking at 8%):</p>
            <p style={{ marginBottom: '30px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              "Attribution is just too hard for our company. We're not Google. We can't do this."
            </p>

            <p style={{ marginBottom: '5px', fontWeight: '700' }}>Board's Conclusion (Month 8):</p>
            <p style={{ marginBottom: '30px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              "Marketing can't measure ROI. Maybe we should shift budget to sales."
            </p>

            <p style={{ marginBottom: '5px', fontWeight: '700' }}>New VP's Conclusion (Month 11):</p>
            <p style={{ marginBottom: '15px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              "Wait, why didn't you just give Casey schema ownership and a data partner from day one?"
            </p>

            <p style={{ marginBottom: '10px' }}>Previous VP (no longer at company): No answer</p>
          </div>

          {/* The Real Cost */}
          <div style={{ padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderLeft: `4px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.2rem' }}>
              The Real Cost:
            </p>

            <p style={{ marginBottom: '15px' }}>You hired an attribution expert.</p>
            <p style={{ marginBottom: '15px' }}>They built an 89% fill rate model at their previous company.</p>
            <p style={{ marginBottom: '30px' }}>At your company, you:</p>

            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>Gave them no schema ownership</li>
              <li>Gave them no cross-functional authority</li>
              <li>Let them build a model on undefined data (8% fill rate)</li>
              <li>Spent $175K on a consultant to say what Casey said in Month 1</li>
              <li>Got to 42% (still unusable)</li>
              <li>Finally gave Casey the authority they needed (Month 11)</li>
              <li>Got to 85% in 4 months</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px', fontSize: '1.1rem' }}>Total Waste:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>$232K financial</li>
              <li>10 months timeline</li>
              <li>$975K-$1.3M in bad budget decisions</li>
              <li>Casey's mental health</li>
              <li>Board's confidence in marketing</li>
            </ul>

            <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>
              But hey, nobody apologized for the therapy bills.
            </p>
            <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
              Or for ignoring Casey in Month 1.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Morgan - The Cost
  if (name === 'Morgan') {
    return (
      <section style={containerStyle}>
        <h2 style={{ ...TYPOGRAPHY.h2, color: COLORS.yellow, marginBottom: '10px' }}>
          The Cost
        </h2>

        <div style={{ ...TYPOGRAPHY.body, color: COLORS.white }}>
          {/* Financial Cost */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.05)', border: `1px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow }}>Financial Cost:</p>

            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>HubSpot → Marketo Migration:</p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>Vendor cost: $120K</li>
              <li>Marketo first-year licenses: $60K</li>
              <li>Morgan's time (6 months): ~$60K</li>
              <li style={{ fontWeight: '700', color: COLORS.yellow }}>Total: $180K</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px', color: COLORS.yellow }}>What It Fixed:</p>
            <p style={{ marginBottom: '30px', fontStyle: 'italic' }}>Nothing (migrated the mess to a new platform)</p>

            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>
              Month 8 Data Governance Proposal (rejected):
            </p>
            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>External audit: $32K</li>
              <li>Ongoing ownership: $6K/month = $72K/year</li>
              <li>Timeline: 2 months</li>
              <li style={{ fontWeight: '700', color: COLORS.yellow }}>Total first year: $104K</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px', color: COLORS.yellow }}>What It Would Fix:</p>
            <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>Root cause (undefined data schema)</p>
          </div>

          {/* Organizational Math */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Organizational Math:</p>

            <ul style={{ marginLeft: '20px', lineHeight: '1.8', marginBottom: '20px' }}>
              <li>Spent $180K on migration that didn't fix root cause</li>
              <li>Rejected $104K proposal that would fix root cause</li>
              <li>Reason: "Too complex"</li>
              <li>Now discussing another migration (Marketo → Pardot): ~$200K estimated</li>
            </ul>

            <p style={{ fontWeight: '700', marginBottom: '10px', fontSize: '1.2rem', color: COLORS.yellow }}>
              Total Potential Spend: $380K (two migrations)
            </p>
            <p style={{ fontWeight: '700', marginBottom: '10px', fontSize: '1.2rem', color: COLORS.yellow }}>
              Actual Problem Cost to Fix: $104K (one governance project)
            </p>
            <p style={{ fontWeight: '700', fontSize: '1.2rem', color: COLORS.yellow }}>
              Waste: $276K and counting
            </p>
          </div>

          {/* Firefighting Cost */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Month 9-15 Firefighting Cost:</p>

            <p style={{ marginBottom: '10px' }}>Morgan's time spent reconciling reports: 15 hours/week</p>
            <p style={{ marginBottom: '10px' }}>Cost: ~$52K (6 months × Morgan's salary)</p>
            <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow }}>
              Value created: Zero (fires put out, none prevented)
            </p>
          </div>

          {/* Human Cost */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderLeft: `4px solid #ef4444` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px' }}>Human Cost:</p>

            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Month 7:</p>
            <p style={{ marginBottom: '30px', fontStyle: 'italic' }}>
              Morgan's realization: "I led this migration perfectly. The migration isn't the problem. The org chart is the problem."
            </p>

            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Month 8:</p>
            <p style={{ marginBottom: '10px' }}>Morgan's proposal rejected as "too complex."</p>
            <p style={{ marginBottom: '30px', fontStyle: 'italic' }}>
              Morgan's thought: "I literally designed a solution. It's not complex. You just don't want to prioritize it."
            </p>

            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Month 12:</p>
            <p style={{ marginBottom: '10px', fontWeight: '700' }}>Conversation with former colleague:</p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Colleague:</span> "How's the new job?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan:</span> "I migrated us from HubSpot to Marketo."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Colleague:</span> "Nice! How's it going?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan:</span> "The same problems exist. We just paid $180K to move them."
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Colleague:</span> "Did you propose fixing the root cause?"
            </p>
            <p style={{ marginBottom: '5px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Morgan:</span> "In Month 2 and Month 8. Both rejected."
            </p>
            <p style={{ marginBottom: '30px', fontStyle: 'italic', color: COLORS.lightGrey }}>
              <span style={{ fontWeight: '700', color: COLORS.white }}>Colleague:</span> "That sucks."
            </p>

            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Month 15:</p>
            <p style={{ marginBottom: '10px' }}>Morgan hears "maybe Pardot" conversation.</p>
            <p style={{ marginBottom: '30px', fontStyle: 'italic', color: COLORS.yellow }}>
              Morgan's internal monologue: "I can't do this again."
            </p>

            <p style={{ fontWeight: '700', marginBottom: '15px', fontSize: '1.1rem' }}>Month 16:</p>
            <p style={{ marginBottom: '10px' }}>Resume updated.</p>
            <p style={{ marginBottom: '10px' }}>LinkedIn profile changed to "open to opportunities."</p>
            <p style={{ fontWeight: '700' }}>Projected departure: Month 20</p>
          </div>

          {/* The Real Cost */}
          <div style={{ padding: '20px', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderLeft: `4px solid ${COLORS.yellow}` }}>
            <p style={{ fontWeight: '700', marginBottom: '15px', color: COLORS.yellow, fontSize: '1.2rem' }}>
              The Real Cost:
            </p>

            <p style={{ marginBottom: '15px' }}>You hired a migration expert.</p>
            <p style={{ marginBottom: '15px' }}>They correctly diagnosed that your HubSpot mess would become a Marketo mess.</p>
            <p style={{ marginBottom: '15px' }}>They proposed fixing it twice.</p>
            <p style={{ marginBottom: '15px' }}>You rejected it as "too complex."</p>
            <p style={{ marginBottom: '15px' }}>You spent $180K migrating the mess.</p>
            <p style={{ marginBottom: '30px' }}>You're considering another $200K migration (Marketo → Pardot).</p>

            <p style={{ marginBottom: '30px', fontWeight: '700', fontSize: '1.1rem' }}>
              The actual fix costs $104K.
            </p>

            <p style={{ marginBottom: '15px' }}>But Morgan will be gone before you realize that.</p>
            <p style={{ marginBottom: '15px' }}>And the next person will propose the same thing.</p>
            <p style={{ marginBottom: '30px' }}>And you'll reject it again.</p>

            <p style={{ marginBottom: '15px', fontWeight: '700' }}>Because the problem isn't the tools.</p>
            <p style={{ fontWeight: '700', fontStyle: 'italic', color: COLORS.yellow, fontSize: '1.1rem' }}>
              It's that you'd rather spend $380K on platform migrations than $104K admitting the org chart needs data governance.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Placeholder for other personas
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
