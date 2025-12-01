import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';

/**
 * Own Your Story - Article 1
 * "Why Your GTM Sucks: The Human Cost of Operations Theater"
 *
 * Condensed 10-15 minute read with:
 * - Reading progress indicator
 * - Reading time display
 * - Viewport-constrained content
 * - Key statistics and visuals
 *
 * Updated: November 30, 2025
 */

// Reading Progress Bar Component
function ReadingProgressBar({ progress }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      backgroundColor: 'rgba(251, 191, 36, 0.2)',
      zIndex: 1000
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        backgroundColor: COLORS.yellow,
        transition: 'width 0.1s ease-out',
        boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
      }} />
    </div>
  );
}

// Stat Card Component
function StatCard({ value, label, source }) {
  return (
    <div style={{
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      border: `1px solid ${COLORS.yellow}`,
      borderRadius: '12px',
      padding: '24px',
      textAlign: 'center',
      flex: '1 1 200px',
      minWidth: '200px'
    }}>
      <div style={{
        fontSize: 'clamp(2rem, 5vw, 3rem)',
        fontWeight: '800',
        color: COLORS.yellow,
        lineHeight: 1
      }}>{value}</div>
      <div style={{
        fontSize: '0.95rem',
        color: COLORS.white,
        marginTop: '8px',
        fontWeight: '600'
      }}>{label}</div>
      {source && (
        <div style={{
          fontSize: '0.75rem',
          color: COLORS.lightGrey,
          marginTop: '8px',
          fontStyle: 'italic'
        }}>{source}</div>
      )}
    </div>
  );
}

// Section Heading Component
function SectionHeading({ children, number }) {
  return (
    <h2 style={{
      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
      fontWeight: '700',
      color: COLORS.yellow,
      marginTop: '60px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      {number && (
        <span style={{
          fontSize: '0.9rem',
          color: COLORS.lightGrey,
          fontWeight: '400'
        }}>{number}</span>
      )}
      {children}
    </h2>
  );
}

// Quote Block Component
function QuoteBlock({ children, author }) {
  return (
    <blockquote style={{
      borderLeft: `4px solid ${COLORS.yellow}`,
      paddingLeft: '24px',
      margin: '32px 0',
      fontStyle: 'italic',
      fontSize: '1.1rem',
      color: COLORS.lightGrey
    }}>
      "{children}"
      {author && (
        <footer style={{
          marginTop: '12px',
          fontSize: '0.9rem',
          color: COLORS.yellow,
          fontStyle: 'normal'
        }}>— {author}</footer>
      )}
    </blockquote>
  );
}

function OwnYourStoryArticle1Page() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();
  const contentRef = useRef(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [readingTime, setReadingTime] = useState(12);

  // Calculate reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const element = contentRef.current;
      const scrollTop = window.scrollY;
      const docHeight = element.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleBackClick = () => {
    navigate('/thoughts');
  };

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="THOUGHTS"
    >
      {/* Reading Progress Indicator */}
      <ReadingProgressBar progress={readingProgress} />

      {/* Article Container */}
      <div
        ref={contentRef}
        data-article-content
        style={{
          minHeight: '100vh',
          backgroundColor: COLORS.black,
          color: COLORS.white,
          paddingTop: 'max(100px, env(safe-area-inset-top))',
          paddingBottom: 'max(120px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(20px, env(safe-area-inset-left))',
          paddingRight: 'max(20px, env(safe-area-inset-right))'
        }}
      >
        {/* Content Wrapper - Constrained Width */}
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          {/* Back Navigation */}
          <button
            onClick={handleBackClick}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.yellow,
              fontSize: '0.9rem',
              cursor: 'pointer',
              marginBottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: 0
            }}
          >
            ← Back to Thoughts
          </button>

          {/* Hero Section */}
          <header style={{ marginBottom: '48px' }}>
            <div style={{
              fontSize: '0.85rem',
              color: COLORS.yellow,
              fontWeight: '600',
              letterSpacing: '0.1em',
              marginBottom: '16px'
            }}>
              OWN YOUR STORY
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              fontWeight: '800',
              color: COLORS.white,
              lineHeight: 1.1,
              marginBottom: '16px'
            }}>
              Why Your GTM Sucks
            </h1>

            <p style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              color: COLORS.lightGrey,
              marginBottom: '24px',
              lineHeight: 1.4
            }}>
              The Human Cost of Operations Theater
            </p>

            {/* Meta Info */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
              fontSize: '0.9rem',
              color: COLORS.lightGrey
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                border: `1px solid ${COLORS.yellow}`,
                borderRadius: '20px',
                color: COLORS.yellow,
                fontWeight: '600'
              }}>
                📖 ~{readingTime} min read
              </span>
              <span>November 2025</span>
              <span>•</span>
              <span>yellowCircle</span>
            </div>
          </header>

          {/* Lead Paragraph */}
          <p style={{
            fontSize: '1.15rem',
            lineHeight: 1.8,
            color: COLORS.white,
            marginBottom: '32px'
          }}>
            <strong style={{ color: COLORS.yellow }}>Let's be direct:</strong> Your go-to-market operations are likely failing. Not because of the tools you're using—because of the gap between what those tools promise and how your organization actually runs.
          </p>

          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: COLORS.lightGrey,
            marginBottom: '32px'
          }}>
            This isn't another pitch for a new platform. This is about the people burning out in the space between "what the demo showed" and "what we actually got."
          </p>

          {/* The Numbers */}
          <SectionHeading number="01">The Numbers Don't Lie</SectionHeading>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <StatCard
              value="68%"
              label="of MarTech capabilities go unused"
              source="Gartner, 2024"
            />
            <StatCard
              value="$30B"
              label="wasted annually on unused SaaS"
              source="Zylo Report"
            />
            <StatCard
              value="47%"
              label="of ops professionals report burnout"
              source="MOPs Industry Survey"
            />
          </div>

          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: COLORS.lightGrey,
            marginBottom: '24px'
          }}>
            These aren't abstractions. They represent real people—marketing operations managers, data analysts, attribution specialists—caught in the crossfire of organizational dysfunction disguised as technology problems.
          </p>

          {/* Operations Theater */}
          <SectionHeading number="02">What Is Operations Theater?</SectionHeading>

          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: COLORS.lightGrey,
            marginBottom: '24px'
          }}>
            Operations Theater is the gap between your GTM presentation layer and operational reality. It's:
          </p>

          <ul style={{
            listStyle: 'none',
            padding: 0,
            marginBottom: '32px'
          }}>
            {[
              'Dashboards that look impressive but show different numbers than reality',
              'Integration announcements that mask months of manual workarounds',
              'Quarterly reviews celebrating "automation wins" while teams work weekends',
              'Attribution models that serve political narratives, not truth'
            ].map((item, i) => (
              <li key={i} style={{
                fontSize: '1rem',
                lineHeight: 1.8,
                color: COLORS.white,
                marginBottom: '12px',
                paddingLeft: '24px',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  color: COLORS.yellow
                }}>→</span>
                {item}
              </li>
            ))}
          </ul>

          <QuoteBlock author="Anonymous MOPs Manager, Series B Startup">
            I spend 60% of my time making spreadsheets that make our automation look like it's working. The other 40% is doing the automation manually.
          </QuoteBlock>

          {/* The Human Cost */}
          <SectionHeading number="03">The Human Cost</SectionHeading>

          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: COLORS.lightGrey,
            marginBottom: '24px'
          }}>
            Behind every "GTM strategy refresh" is a person. Let's meet them:
          </p>

          {/* Persona Cards */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              color: COLORS.yellow,
              fontSize: '1.1rem',
              fontWeight: '700',
              marginBottom: '12px'
            }}>Alex — Marketing Operations Manager</h3>
            <p style={{
              color: COLORS.lightGrey,
              fontSize: '0.95rem',
              lineHeight: 1.7,
              marginBottom: '12px'
            }}>
              Promised "full visibility across the funnel." Reality: maintains 14 spreadsheets to reconcile what the CRM says versus what's real. Spends Sundays fixing data before Monday's leadership sync.
            </p>
            <p style={{
              color: COLORS.yellow,
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              Cost: 15+ hours/week on reconciliation. Considering leaving the field.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              color: COLORS.yellow,
              fontSize: '1.1rem',
              fontWeight: '700',
              marginBottom: '12px'
            }}>Jordan — Marketing Data Analyst</h3>
            <p style={{
              color: COLORS.lightGrey,
              fontSize: '0.95rem',
              lineHeight: 1.7,
              marginBottom: '12px'
            }}>
              Hired to "unlock insights from our data infrastructure." Reality: spends 80% of time cleaning data that should have been structured correctly at intake.
            </p>
            <p style={{
              color: COLORS.yellow,
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              Cost: Zero strategic analysis. Team sees them as "slow" when they're drowning.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h3 style={{
              color: COLORS.yellow,
              fontSize: '1.1rem',
              fontWeight: '700',
              marginBottom: '12px'
            }}>Casey — Attribution Specialist</h3>
            <p style={{
              color: COLORS.lightGrey,
              fontSize: '0.95rem',
              lineHeight: 1.7,
              marginBottom: '12px'
            }}>
              Tasked with "single source of truth for channel performance." Reality: maintains three different attribution models—one for Sales, one for Marketing leadership, one that's actually accurate (kept private).
            </p>
            <p style={{
              color: COLORS.yellow,
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              Cost: Credibility erosion. "The numbers person" is now seen as political.
            </p>
          </div>

          {/* The Real Problem */}
          <SectionHeading number="04">The Real Problem</SectionHeading>

          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: COLORS.lightGrey,
            marginBottom: '24px'
          }}>
            Your GTM isn't broken because you picked the wrong CRM. It's broken because:
          </p>

          <div style={{
            backgroundColor: 'rgba(251, 191, 36, 0.05)',
            border: `1px solid ${COLORS.yellow}`,
            borderRadius: '12px',
            padding: '28px',
            marginBottom: '32px'
          }}>
            <ol style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              counterReset: 'item'
            }}>
              {[
                { title: 'Process gaps are blamed on tools', desc: 'Instead of fixing workflows, you buy new software.' },
                { title: 'Org chart friction is invisible', desc: "Sales and Marketing incentives are misaligned—tools can't fix that." },
                { title: 'Technical debt compounds silently', desc: 'Every workaround creates two more. Nobody budgets for cleanup.' },
                { title: 'Truth-telling is disincentivized', desc: 'The people who see the problems are punished for raising them.' }
              ].map((item, i) => (
                <li key={i} style={{
                  marginBottom: '20px',
                  paddingLeft: '40px',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '28px',
                    height: '28px',
                    backgroundColor: COLORS.yellow,
                    color: COLORS.black,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: '700'
                  }}>{i + 1}</span>
                  <strong style={{ color: COLORS.white, display: 'block', marginBottom: '4px' }}>
                    {item.title}
                  </strong>
                  <span style={{ color: COLORS.lightGrey, fontSize: '0.95rem' }}>
                    {item.desc}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* What Now */}
          <SectionHeading number="05">What Now?</SectionHeading>

          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.8,
            color: COLORS.lightGrey,
            marginBottom: '24px'
          }}>
            Stop buying tools to fix organizational problems. Start with:
          </p>

          <div style={{
            display: 'grid',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {[
              { icon: '🔍', title: 'Audit Honestly', desc: 'Map what actually happens, not what should happen. Interview the people doing the work.' },
              { icon: '📊', title: 'Quantify Technical Debt', desc: 'How many hours/week are spent on workarounds? Put a dollar figure on it.' },
              { icon: '🎯', title: 'Align Incentives First', desc: 'Before implementing any new tool, ensure Sales and Marketing are measured on shared outcomes.' },
              { icon: '🛡️', title: 'Protect Truth-Tellers', desc: 'Create safe channels for ops people to flag problems without career risk.' }
            ].map((item, i) => (
              <div key={i} style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                gap: '16px'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  flexShrink: 0
                }}>{item.icon}</div>
                <div>
                  <strong style={{ color: COLORS.yellow, display: 'block', marginBottom: '4px' }}>
                    {item.title}
                  </strong>
                  <span style={{ color: COLORS.lightGrey, fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {item.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Final Thought */}
          <div style={{
            backgroundColor: 'rgba(251, 191, 36, 0.08)',
            borderLeft: `4px solid ${COLORS.yellow}`,
            padding: '32px',
            marginTop: '48px',
            marginBottom: '48px'
          }}>
            <h3 style={{
              color: COLORS.yellow,
              fontSize: '1.2rem',
              fontWeight: '700',
              marginBottom: '16px'
            }}>The Bottom Line</h3>
            <p style={{
              color: COLORS.white,
              fontSize: '1.1rem',
              lineHeight: 1.7,
              marginBottom: '16px'
            }}>
              Your GTM problems aren't tool problems.
              <br />
              <strong>They're people problems disguised as tool problems.</strong>
            </p>
            <p style={{
              color: COLORS.lightGrey,
              fontSize: '1rem',
              lineHeight: 1.7
            }}>
              The data shows the symptoms. The people are paying the price. Own your story. Fix the org chart. Or keep buying tools and watching people quit.
            </p>
            <p style={{
              color: COLORS.yellow,
              fontSize: '1.2rem',
              fontWeight: '700',
              marginTop: '20px'
            }}>
              Your choice.
            </p>
          </div>

          {/* CTA Section */}
          <div style={{
            textAlign: 'center',
            padding: '40px 0',
            borderTop: `1px solid rgba(255, 255, 255, 0.1)`
          }}>
            <p style={{
              color: COLORS.lightGrey,
              fontSize: '1rem',
              marginBottom: '24px'
            }}>
              Ready to stop the theater?
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => navigate('/assessment')}
                style={{
                  padding: '14px 28px',
                  backgroundColor: COLORS.yellow,
                  color: COLORS.black,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.white;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.yellow;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Take the GTM Health Assessment
              </button>
              <button
                onClick={() => navigate('/services')}
                style={{
                  padding: '14px 28px',
                  backgroundColor: 'transparent',
                  color: COLORS.yellow,
                  border: `2px solid ${COLORS.yellow}`,
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Explore Our Services
              </button>
            </div>
          </div>

          {/* Sources */}
          <div style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h4 style={{
              color: COLORS.lightGrey,
              fontSize: '0.85rem',
              fontWeight: '600',
              letterSpacing: '0.1em',
              marginBottom: '16px'
            }}>SOURCES</h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '0.85rem',
              color: COLORS.lightGrey
            }}>
              <li style={{ marginBottom: '8px' }}>• Gartner Marketing Technology Survey, 2024</li>
              <li style={{ marginBottom: '8px' }}>• Zylo SaaS Management Report, 2024</li>
              <li style={{ marginBottom: '8px' }}>• Marketing Operations Professional Association Industry Survey, 2024</li>
              <li style={{ marginBottom: '8px' }}>• Internal interviews with 20+ MOPs professionals across B2B SaaS</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default OwnYourStoryArticle1Page;
