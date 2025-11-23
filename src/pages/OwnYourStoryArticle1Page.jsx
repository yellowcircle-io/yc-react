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
