import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';

function AboutPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle, openContactModal } = useLayout();

  // Mobile detection
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inject stagger animation
  React.useEffect(() => {
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
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
          60% {
            transform: translateY(-4px);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleContactClick = () => {
    openContactModal();
  };

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="ABOUT"
    >
      {/* Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(255, 255, 255, 1) 50%, rgba(251, 191, 36, 0.1) 100%)',
        zIndex: 1
      }}></div>

      {/* Main Content - Scrollable */}
      <div style={{
        position: 'fixed',
        top: '80px',
        bottom: footerOpen ? '320px' : '40px',
        left: sidebarOpen ? 'min(35vw, 472px)' : '80px',
        right: 0,
        padding: isMobile ? '0 20px' : '0 80px',
        zIndex: 61,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out'
      }}>
        <div style={{
          ...TYPOGRAPHY.container,
          maxWidth: '700px'
        }}>
          {/* Large "ABOUT" heading */}
          <h1 style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>ABOUT.</h1>

          <div style={{ position: 'relative', minHeight: '80px' }}>
            {/* Main subtitle */}
            <p style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.black,
              backgroundColor: COLORS.backgroundLight,
              ...EFFECTS.blur,
              display: 'inline-block',
              padding: '2px 6px',
              animation: 'fadeInUp 0.6s ease-in-out 0.4s both'
            }}>
              Creative Growth Operations Studio
            </p>
          </div>

          {/* Description text */}
          <p style={{
            ...TYPOGRAPHY.body,
            margin: '10px 0 0 0',
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '4px 8px',
            animation: 'fadeInUp 0.6s ease-in-out 0.6s both',
            maxWidth: '520px',
            lineHeight: '1.6'
          }}>
            Where operational rigor meets creative execution. yellowCircle bridges the gap between beautiful brand experiences and the infrastructure that scales them—helping growing companies build growth systems that actually work.
          </p>

          {/* What we do */}
          <div style={{
            marginTop: '25px',
            animation: 'fadeInUp 0.6s ease-in-out 0.7s both'
          }}>
            <p style={{
              ...TYPOGRAPHY.small,
              color: 'rgba(0, 0, 0, 0.4)',
              fontWeight: '700',
              letterSpacing: '0.15em',
              marginBottom: '12px',
              textTransform: 'uppercase'
            }}>
              What We Do
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {[
                { text: 'Growth Audits & Technical Debt', tag: 'Strategy' },
                { text: 'Marketing Systems & Automation', tag: 'Operations' },
                { text: 'Attribution & Data Architecture', tag: 'Infrastructure' },
                { text: 'Email Design & Brand Templates', tag: 'Creative' },
                { text: 'Campaign Development & Launch', tag: 'Execution' }
              ].map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <p style={{
                    ...TYPOGRAPHY.body,
                    fontSize: '14px',
                    margin: 0,
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    ...EFFECTS.blur,
                    display: 'inline-block',
                    padding: '6px 12px',
                    width: 'fit-content'
                  }}>
                    {item.text}
                  </p>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    color: COLORS.yellow,
                    backgroundColor: 'rgba(251, 191, 36, 0.15)',
                    padding: '3px 8px',
                    borderRadius: '10px'
                  }}>
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{
            marginTop: '30px',
            animation: 'fadeInUp 0.6s ease-in-out 0.8s both'
          }}>
            <button
              onClick={handleContactClick}
              style={{
                padding: '14px 28px',
                backgroundColor: COLORS.yellow,
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'black';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.yellow;
                e.currentTarget.style.color = 'black';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              GET IN TOUCH
            </button>
          </div>

          {/* Scroll Indicator */}
          <div style={{
            marginTop: '40px',
            textAlign: 'center',
            animation: 'fadeInUp 0.6s ease-in-out 0.85s both'
          }}>
            <div style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(0, 0, 0, 0.4)',
              cursor: 'pointer'
            }}
            onClick={() => {
              document.querySelector('.faq-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            >
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase'
              }}>
                FAQ Below
              </span>
              <span style={{
                fontSize: '20px',
                animation: 'bounce 2s infinite'
              }}>
                ↓
              </span>
            </div>
          </div>

          {/* FAQ Section */}
          <div
            className="faq-section"
            style={{
              marginTop: '60px',
              animation: 'fadeInUp 0.6s ease-in-out 0.9s both'
            }}>
            <h2 style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
              fontWeight: '700',
              letterSpacing: '0.15em',
              marginBottom: '30px',
              color: COLORS.yellow
            }}>
              QUESTIONS FOUNDERS ASK
            </h2>

            {[
              {
                q: "Can you do this for a $50K annual marketing budget?",
                a: "Yes. I actually prefer it—you can't afford bloat, which means we focus on the 20% that matters."
              },
              {
                q: "How long does this take?",
                a: "Growth Infrastructure Audit is 2–4 weeks. Build engagements are 4–12 weeks depending on scope."
              },
              {
                q: "What if I can't afford a $4K build?",
                a: "Start with the Growth Audit ($1.5K). 70% of the time, there's low-hanging fruit you can implement yourself with my guidance."
              },
              {
                q: "Why aren't you cheaper?",
                a: "I don't have team overhead. My work costs less than agencies, but I'm not competing with $200/month templates. You're paying for diagnosis + execution, not just templates."
              },
              {
                q: "Will you help me pick between HubSpot and Marketo?",
                a: "Yes, but the honest answer is usually: \"HubSpot unless you have 2-week lead scoring requirements or need campaign orchestration.\" Most early-stage companies overshoot on complexity."
              },
              {
                q: "Can we do equity/revenue share instead of cash?",
                a: "Let's talk. I've done it before for founders I believe in."
              },
              {
                q: "How do you stay current with new tools and AI?",
                a: "I use Claude for code + architecture, build tools with Vercel/Firebase, and test new platforms as they launch. I'm not dogmatic about tech stack—I optimize for your specific problem."
              }
            ].map((faq, index) => (
              <div key={index} style={{
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: '8px',
                border: '1px solid rgba(251, 191, 36, 0.2)'
              }}>
                <p style={{
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: COLORS.black,
                  marginBottom: '10px',
                  lineHeight: '1.5'
                }}>
                  Q: {faq.q}
                </p>
                <p style={{
                  fontSize: '0.9rem',
                  fontWeight: '400',
                  color: 'rgba(0, 0, 0, 0.75)',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  A: {faq.a}
                </p>
              </div>
            ))}
          </div>

          {/* Spacer for footer */}
          <div style={{ height: '120px' }}></div>
        </div>
      </div>
    </Layout>
  );
}

export default AboutPage;
