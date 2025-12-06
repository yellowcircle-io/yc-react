import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';
import { CALENDAR_ENABLED, openCalendarBooking } from '../config/calendarConfig';

/**
 * ServicesPage - Growth Infrastructure Solutions
 *
 * Organized as a journey of progressively scaling vendor-client relationship:
 *
 * DIAGNOSTIC SERVICES:
 * - Growth Infrastructure Audit ($4K-5K)
 * - Marketing Systems Audit ($2.5K-4K)
 * - Hire-or-Build Assessment ($1.5K-2.5K)
 * - Technical Debt Quantification ($2.5K-3.5K)
 * - Attribution System Audit ($2K-3K)
 * - Data Architecture Assessment ($3K-4K)
 *
 * BUILD & EXECUTION SERVICES:
 * - Creative + Operations (Custom)
 * - Email Template Development ($1,500+)
 * - Custom Engagement (Let's Talk)
 */

const DIAGNOSTIC_SERVICES = [
  {
    id: 'gtm-audit',
    title: 'Growth Infrastructure Audit',
    price: '$4,000 - $5,000',
    duration: '2-3 weeks',
    description: 'Comprehensive go-to-market infrastructure assessment. Find out why your marketing ops feels stuck—and get a clear path forward.',
    highlights: [
      'Tech stack and workflow audit',
      'Technical debt quantification (actual $ cost)',
      '30/60/90 day action plan',
      'Build vs. buy recommendations'
    ],
    featured: true
  },
  {
    id: 'marketing-systems',
    title: 'Marketing Systems Audit',
    price: '$2,500 - $4,000',
    duration: '1-2 weeks',
    description: 'Deep dive into your HubSpot, Salesforce, or marketing automation platform to identify inefficiencies and optimization opportunities.',
    highlights: [
      'Platform configuration review',
      'Workflow efficiency analysis',
      'Integration health check',
      'Optimization roadmap'
    ],
    featured: false
  },
  {
    id: 'role-alignment',
    title: 'Hire-or-Build Assessment',
    price: '$1,500 - $2,500',
    duration: '2-3 weeks',
    description: 'Thinking about hiring a marketing ops person, fractional CMO, or agency? Let\'s figure out what you actually need before you spend $100K+ on the wrong hire.',
    highlights: [
      'Gap analysis (what\'s missing in your current setup)',
      'Role definition (exact job description if you hire)',
      'Build-vs-buy recommendation (can tools solve this?)',
      'Cost comparison: hire vs. contract vs. automate'
    ],
    featured: false
  },
  {
    id: 'technical-debt',
    title: 'Technical Debt Quantification',
    price: '$2,500 - $3,500',
    duration: '1-2 weeks',
    description: 'Put a dollar figure on the hidden costs dragging down your marketing operations.',
    highlights: [
      'Workflow inventory & status audit',
      'Integration error rate analysis',
      'Cost calculation by category',
      'Paydown prioritization (ROI-ranked)'
    ],
    featured: false
  },
  {
    id: 'attribution-audit',
    title: 'Attribution System Audit',
    price: '$2,000 - $3,000',
    duration: '1-2 weeks',
    description: 'Finally answer "which channel drives revenue" with a single source of truth.',
    highlights: [
      'Current implementations inventory',
      'Fill rate analysis by field',
      'Workflow dependency mapping',
      'Migration plan for deprecated fields'
    ],
    featured: false
  },
  {
    id: 'data-architecture',
    title: 'Data Architecture Assessment',
    price: '$3,000 - $4,000',
    duration: '2-3 weeks',
    description: 'Diagnose data lag, sync errors, and schema inconsistencies across your marketing stack.',
    highlights: [
      'Data flow mapping (system to system)',
      'Latency analysis',
      'Schema comparison across tools',
      'Event-driven migration recommendation'
    ],
    featured: false
  }
];

const BUILD_SERVICES = [
  {
    id: 'creative-operations',
    title: 'Creative + Operations',
    price: 'Custom',
    duration: 'Project-based',
    description: 'End-to-end email development, CRM standardization, and brand template systems for enterprise marketing teams.',
    highlights: [
      'Responsive email template development',
      'CRM data standardization',
      'Cross-brand best practices',
      'Loyalty & lifecycle communications'
    ],
    featured: false
  },
  {
    id: 'email-development',
    title: 'Email Template Development',
    price: 'Starting at $1,500',
    duration: 'Per template',
    description: 'Custom, responsive email templates that render perfectly across all clients and devices.',
    highlights: [
      'Mobile-responsive design',
      'Dark mode compatible',
      'HubSpot/Salesforce/Marketo ready',
      'A/B test variations included'
    ],
    featured: false
  },
  {
    id: 'custom',
    title: 'Custom Engagement',
    price: "Let's Talk",
    duration: 'Flexible',
    description: 'Have a specific challenge that doesn\'t fit the boxes above? Let\'s design something that works for your situation.',
    highlights: [
      'Scoping call to understand your needs',
      'Custom proposal within 48 hours',
      'Flexible payment structures available',
      'Equity/revenue share for right fit'
    ],
    featured: false
  }
];

function ServicesPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle, openContactModal } = useLayout();
  const [selectedService, setSelectedService] = React.useState(null);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Mobile detection
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inject animations
  React.useEffect(() => {
    const styleId = 'services-animations';
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
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
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

  const handleGetStarted = (service) => {
    openContactModal('', `Interested in: ${service.title}`);
  };

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="SERVICES"
    >
      {/* Main Content */}
      <div style={{
        position: 'fixed',
        top: '80px',
        bottom: footerOpen ? '320px' : '20px',
        left: sidebarOpen ? 'min(35vw, 472px)' : '80px',
        right: 0,
        padding: isMobile ? '0 16px' : '0 80px',
        overflow: 'auto',
        overflowX: 'hidden',
        zIndex: 61,
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out'
      }}>
        <div style={{
          ...TYPOGRAPHY.container,
          maxWidth: '1200px'
        }}>
          {/* Header */}
          <h1 style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both',
            marginBottom: '10px'
          }}>SERVICES.</h1>

          <p style={{
            ...TYPOGRAPHY.h2,
            color: COLORS.black,
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '2px 6px',
            animation: 'fadeInUp 0.6s ease-in-out 0.4s both',
            marginBottom: '30px'
          }}>
            Growth Infrastructure Solutions
          </p>

          <p style={{
            ...TYPOGRAPHY.body,
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '4px 8px',
            animation: 'fadeInUp 0.6s ease-in-out 0.5s both',
            marginBottom: isMobile ? '20px' : '40px',
            maxWidth: '600px'
          }}>
            Stop buying tools to fix organizational problems. Get strategic clarity on your go-to-market infrastructure.
          </p>

          {/* Mobile Quick CTAs */}
          {isMobile && (
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '24px',
              animation: 'fadeInUp 0.6s ease-in-out 0.55s both'
            }}>
              <button
                onClick={() => navigate('/assessment')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  backgroundColor: COLORS.yellow,
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.08em',
                  cursor: 'pointer'
                }}
              >
                START ASSESSMENT
              </button>
              <button
                onClick={() => openCalendarBooking(() => openContactModal('', 'Discovery Call Request'))}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.08em',
                  cursor: 'pointer'
                }}
              >
                BOOK A CALL
              </button>
            </div>
          )}

          {/* DIAGNOSTIC SERVICES Section */}
          <h2 style={{
            fontSize: 'clamp(14px, 2vw, 16px)',
            fontWeight: '700',
            letterSpacing: '0.15em',
            color: 'rgba(0,0,0,0.5)',
            marginBottom: '16px',
            animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
          }}>
            DIAGNOSTIC SERVICES
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            paddingBottom: '40px'
          }}>
            {DIAGNOSTIC_SERVICES.map((service, index) => (
              <div
                key={service.id}
                onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
                style={{
                  backgroundColor: service.featured ? COLORS.yellow : 'rgba(0,0,0,0.85)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '8px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.6s ease-in-out ${0.3 + index * 0.1}s both`,
                  border: selectedService === service.id ? `2px solid ${COLORS.yellow}` : '2px solid transparent',
                  transform: selectedService === service.id ? 'scale(1.02)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (selectedService !== service.id) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedService !== service.id) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {/* Service Title */}
                <h3 style={{
                  fontSize: 'clamp(16px, 2vw, 20px)',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  color: service.featured ? 'black' : 'white',
                  margin: '0 0 8px 0'
                }}>
                  {service.title}
                </h3>

                {/* Price & Duration */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: service.featured ? 'rgba(0,0,0,0.8)' : COLORS.yellow
                  }}>
                    {service.price}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: service.featured ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
                    letterSpacing: '0.05em'
                  }}>
                    {service.duration}
                  </span>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: service.featured ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                  margin: '0 0 16px 0'
                }}>
                  {service.description}
                </p>

                {/* Highlights - Show when expanded */}
                {selectedService === service.id && (
                  <div style={{
                    animation: 'scaleIn 0.3s ease-out',
                    marginBottom: '16px'
                  }}>
                    <ul style={{
                      margin: '0',
                      padding: '0 0 0 16px',
                      listStyle: 'disc'
                    }}>
                      {service.highlights.map((highlight, i) => (
                        <li key={i} style={{
                          fontSize: '12px',
                          color: service.featured ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
                          marginBottom: '6px',
                          lineHeight: '1.4'
                        }}>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Click hint */}
                {selectedService !== service.id && (
                  <p style={{
                    fontSize: '11px',
                    color: service.featured ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                    margin: '8px 0 0 0',
                    textAlign: 'center',
                    letterSpacing: '0.05em'
                  }}>
                    Click for details
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* BUILD & EXECUTION SERVICES Section */}
          <h2 style={{
            fontSize: 'clamp(14px, 2vw, 16px)',
            fontWeight: '700',
            letterSpacing: '0.15em',
            color: 'rgba(0,0,0,0.5)',
            marginBottom: '16px',
            animation: 'fadeInUp 0.6s ease-in-out 0.9s both'
          }}>
            BUILD & EXECUTION SERVICES
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            paddingBottom: '40px'
          }}>
            {BUILD_SERVICES.map((service, index) => (
              <div
                key={service.id}
                onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
                style={{
                  backgroundColor: service.featured ? COLORS.yellow : 'rgba(0,0,0,0.85)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '8px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.6s ease-in-out ${0.9 + index * 0.1}s both`,
                  border: selectedService === service.id ? `2px solid ${COLORS.yellow}` : '2px solid transparent',
                  transform: selectedService === service.id ? 'scale(1.02)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (selectedService !== service.id) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedService !== service.id) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {/* Service Title */}
                <h3 style={{
                  fontSize: 'clamp(16px, 2vw, 20px)',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  color: service.featured ? 'black' : 'white',
                  margin: '0 0 8px 0'
                }}>
                  {service.title}
                </h3>

                {/* Price & Duration */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: service.featured ? 'rgba(0,0,0,0.8)' : COLORS.yellow
                  }}>
                    {service.price}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: service.featured ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
                    letterSpacing: '0.05em'
                  }}>
                    {service.duration}
                  </span>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: service.featured ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                  margin: '0 0 16px 0'
                }}>
                  {service.description}
                </p>

                {/* Highlights - Show when expanded */}
                {selectedService === service.id && (
                  <div style={{
                    animation: 'scaleIn 0.3s ease-out',
                    marginBottom: '16px'
                  }}>
                    <ul style={{
                      margin: '0',
                      padding: '0 0 0 16px',
                      listStyle: 'disc'
                    }}>
                      {service.highlights.map((highlight, i) => (
                        <li key={i} style={{
                          fontSize: '12px',
                          color: service.featured ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
                          marginBottom: '6px',
                          lineHeight: '1.4'
                        }}>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Click hint */}
                {selectedService !== service.id && (
                  <p style={{
                    fontSize: '11px',
                    color: service.featured ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                    margin: '8px 0 0 0',
                    textAlign: 'center',
                    letterSpacing: '0.05em'
                  }}>
                    Click for details
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Assessment CTA */}
          <div style={{
            backgroundColor: COLORS.yellow,
            borderRadius: '8px',
            padding: '24px 30px',
            animation: 'fadeInUp 0.6s ease-in-out 1s both',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'black',
                margin: '0 0 4px 0'
              }}>
                Not sure where to start?
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'rgba(0,0,0,0.7)',
                margin: 0
              }}>
                Take our 2-minute Growth Health Check
              </p>
            </div>
            <button
              onClick={() => navigate('/assessment')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'black';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              START ASSESSMENT
            </button>
          </div>

          {/* Bottom CTA */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(12px)',
            borderRadius: '8px',
            padding: '30px',
            textAlign: 'center',
            animation: 'fadeInUp 0.6s ease-in-out 1.1s both',
            marginBottom: '40px'
          }}>
            <h2 style={{
              fontSize: 'clamp(18px, 3vw, 24px)',
              fontWeight: '700',
              color: 'white',
              margin: '0 0 10px 0',
              letterSpacing: '0.05em'
            }}>
              Ready to talk?
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              margin: '0 0 20px 0'
            }}>
              Book a free 30-minute discovery call to discuss your challenges.
            </p>
            <button
              onClick={() => openCalendarBooking(() => openContactModal('', 'Discovery Call Request'))}
              style={{
                padding: '14px 32px',
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
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.yellow;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {CALENDAR_ENABLED ? 'BOOK A CALL' : 'SCHEDULE A CALL'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ServicesPage;
