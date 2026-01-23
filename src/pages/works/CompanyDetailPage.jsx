import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Layout from '../../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../../styles/constants';
import { navigationItems } from '../../config/navigationItems';

// Client project data - yellowCircle studio work
const COMPANY_DATA = {
  liveintent: {
    name: 'LiveIntent',
    category: 'Ad Tech',
    year: '2013-2016',
    engagement: 'Embedded Partnership',
    description: 'Marketing operations transformation for identity resolution and programmatic advertising platform serving publishers and advertisers globally.',
    highlights: [
      'Built and scaled email marketing infrastructure in Marketo',
      'Developed attribution and reporting frameworks',
      'Designed marketing automation architecture',
      'Created demand generation programs'
    ]
  },
  tunecore: {
    name: 'TuneCore',
    category: 'Music Tech',
    year: '2016-2018',
    engagement: 'Embedded Partnership',
    description: 'Lifecycle marketing and automation development for the leading music distribution platform serving independent artists worldwide.',
    highlights: [
      'Scaled email program to 1M+ subscribers',
      'Improved open rates by +250%',
      'Improved click-to-open rates by +200%',
      'Built comprehensive lifecycle automation'
    ]
  },
  thimble: {
    name: 'Thimble',
    category: 'InsurTech',
    year: '2019',
    engagement: 'Strategic Engagement',
    description: 'Growth marketing systems for on-demand insurance platform targeting small businesses and gig economy workers.',
    highlights: [
      'Developed customer acquisition strategy',
      'Optimized quote-to-bind conversion funnel',
      'Built referral marketing automation',
      'Designed retention and renewal flows'
    ]
  },
  yieldstreet: {
    name: 'YieldStreet',
    category: 'FinTech',
    year: '2019',
    engagement: 'Strategic Engagement',
    description: 'Marketing automation architecture for alternative investment platform serving accredited investors.',
    highlights: [
      'Built investor nurture sequences',
      'Developed investment alerts system',
      'Created portfolio update campaigns',
      'Implemented compliance-ready email workflows'
    ]
  },
  zerogrocery: {
    name: 'Zero Grocery',
    category: 'E-Commerce',
    year: '2021',
    engagement: 'Embedded Partnership',
    description: 'End-to-end marketing operations for zero-waste grocery delivery startup focused on sustainability.',
    highlights: [
      'Built subscription lifecycle program',
      'Developed environmental impact reporting',
      'Created re-engagement campaigns',
      'Designed automated delivery sequences'
    ]
  },
  doordash: {
    name: 'DoorDash',
    category: 'Delivery',
    year: '2021',
    engagement: 'Strategic Engagement',
    description: 'Merchant-facing marketing operations and restaurant growth program development.',
    highlights: [
      'Optimized merchant onboarding flows',
      'Built restaurant partner communications',
      'Developed performance analytics',
      'Created merchant success automation'
    ]
  },
  virtana: {
    name: 'Virtana',
    category: 'Enterprise SaaS',
    year: '2022',
    engagement: 'Growth Assessment',
    description: 'Marketing operations assessment for AIOps platform serving enterprise infrastructure teams.',
    highlights: [
      'Assessed MarTech stack efficiency',
      'Designed lead scoring models',
      'Built account-based marketing flows',
      'Optimized demo request process'
    ]
  },
  reddit: {
    name: 'Reddit',
    category: 'Social Media',
    year: '2022-2023',
    engagement: 'Strategic Engagement',
    description: 'Marketing systems architecture for community and advertiser engagement programs.',
    highlights: [
      'Refined ETL and data processes',
      'Improved Salesforce-HubSpot integration',
      'Built advertiser nurture journeys',
      'Optimized self-serve ad platform flows'
    ]
  },
  'estee-lauder': {
    name: 'Estée Lauder',
    category: 'Beauty',
    year: '2023-2024',
    engagement: 'Creative + Operations',
    description: 'Email development and CRM standardization for luxury beauty brand portfolio (Origins).',
    highlights: [
      'Created responsive email templates',
      'Developed CRM data standardization',
      'Built cross-brand best practices documentation',
      'Designed loyalty program communications'
    ]
  },
  auditboard: {
    name: 'AuditBoard',
    category: 'Enterprise SaaS',
    year: '2024',
    engagement: 'Email Development',
    description: 'Developed a global, reusable email template system in Marketo for enterprise audit, risk, and compliance SaaS platform. 80+ hours of scoping, development, and QA across a 6-week engagement.',
    highlights: [
      'Built modular Marketo email template with 200+ editable parameters',
      'Created responsive, cross-client compatible HTML/CSS architecture',
      'Designed configurable component system (headers, CTAs, columns, signatures)',
      'Implemented AuditBoard brand guidelines with Inter typography',
      'Delivered comprehensive documentation for marketing team self-service'
    ],
    caseStudy: {
      timeline: 'November - December 2024',
      scope: '80+ hours',
      deliverables: [
        'Global Marketo email template',
        'Modular component library',
        'Brand-compliant design system',
        'Marketing team documentation'
      ],
      challenge: 'AuditBoard needed a scalable, brand-consistent email template that their marketing team could easily customize without developer support. The existing templates required code changes for each campaign.',
      solution: 'Developed a comprehensive modular template system using MJML for initial prototyping, then converted to production-ready Marketo HTML with 200+ configurable meta variables. Each component—headers, buttons, columns, images, signatures—could be customized directly in the Marketo editor.',
      results: [
        'Marketing team can now build emails without developer support',
        'Template supports all major email clients (Outlook, Gmail, Apple Mail)',
        'Brand consistency maintained across all campaigns',
        'Reduced email production time by 60%'
      ],
      testimonial: {
        quote: 'We hired Christopher for a time-sensitive project that required technical expertise in email development and Marketo. He was responsive, professional, and delivered high-quality work that exceeded our expectations. His ability to translate complex requirements into clean, functional code made the entire process seamless. I highly recommend Christopher for any email development or marketing automation needs.',
        author: 'Freddy Ho',
        title: 'Art Director, AuditBoard'
      },
      technologies: ['Marketo', 'MJML', 'HTML/CSS', 'Email Development']
    }
  },
  rho: {
    name: 'Rho Technologies',
    category: 'FinTech',
    year: '2025',
    engagement: 'Embedded Partnership',
    description: 'Comprehensive marketing operations for B2B fintech platform offering business banking and spend management solutions.',
    highlights: [
      'Managed HubSpot-Salesforce integration',
      'Identified $2.5M+ annual technical debt',
      'Built attribution and reporting systems',
      'Optimized lifecycle marketing workflows',
      'Built processes for events and webinar marketing'
    ]
  }
};

function CompanyDetailPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle, openContactModal } = useLayout();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Get company data or redirect to 404
  const company = COMPANY_DATA[companyId];

  // Handle responsive - breakpoint at 1024px for earlier mobile layout
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inject stagger animation
  useEffect(() => {
    const styleId = 'text-stagger-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Redirect to 404 if company not found
  useEffect(() => {
    if (!company) {
      navigate('/404', { replace: true });
    }
  }, [company, navigate]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleBackToWorks = () => {
    navigate('/works');
  };

  if (!company) {
    return null;
  }

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel={company.name.toUpperCase()}
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
      }} />

      {/* Two-Column Layout Container */}
      <div style={{
        position: 'fixed',
        top: '80px',
        left: isMobile ? 0 : (sidebarOpen ? 'min(35vw, 472px)' : '80px'),
        right: 0,
        bottom: footerOpen ? '320px' : '20px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'flex-start',
        gap: isMobile ? '20px' : '40px',
        padding: isMobile ? '20px' : '80px 40px 40px 40px',
        zIndex: 61,
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out',
        overflow: isMobile ? 'auto' : 'hidden'
      }}>
        {/* Left Column - Fixed Info */}
        <div style={{
          flex: isMobile ? 'none' : '0 0 45%',
          maxWidth: isMobile ? '100%' : '500px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          paddingRight: isMobile ? 0 : '20px'
        }}>
          {/* Back Link */}
          <a
            href="/works"
            onClick={(e) => { e.preventDefault(); handleBackToWorks(); }}
            style={{
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: '500',
              letterSpacing: '0.1em',
              color: 'rgba(0,0,0,0.4)',
              textDecoration: 'none',
              marginBottom: isMobile ? '8px' : '16px',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              animation: 'fadeInUp 0.6s ease-in-out 0.1s both'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = COLORS.yellow}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(0,0,0,0.4)'}
          >
            ← BACK TO CLIENTS
          </a>

          {/* Company Name */}
          <h1 style={{
            fontSize: isMobile ? 'clamp(24px, 8vw, 32px)' : 'clamp(36px, 5vw, 56px)',
            fontWeight: '700',
            lineHeight: '1.1',
            color: COLORS.yellow,
            margin: isMobile ? '0 0 8px 0' : '0 0 16px 0',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            {company.name}
          </h1>

          {/* Engagement Type */}
          <p style={{
            fontSize: isMobile ? '14px' : '18px',
            fontWeight: '500',
            color: 'black',
            margin: isMobile ? '0 0 4px 0' : '0 0 8px 0',
            animation: 'fadeInUp 0.6s ease-in-out 0.3s both'
          }}>
            {company.engagement}
          </p>

          {/* Category & Year */}
          <p style={{
            fontSize: isMobile ? '12px' : '14px',
            color: 'rgba(0,0,0,0.5)',
            margin: isMobile ? '0 0 12px 0' : '0 0 20px 0',
            animation: 'fadeInUp 0.6s ease-in-out 0.4s both'
          }}>
            {company.category} • {company.year}
          </p>

          {/* Description - hide on mobile to save space */}
          {!isMobile && (
            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: 'rgba(0,0,0,0.7)',
              margin: '0 0 24px 0',
              maxWidth: '440px',
              animation: 'fadeInUp 0.6s ease-in-out 0.5s both'
            }}>
              {company.description}
            </p>
          )}

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: isMobile ? '8px' : '12px',
            animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
          }}>
            <button
              onClick={() => openContactModal('', `Inquiry from ${company.name} case study`)}
              style={{
                padding: isMobile ? '10px 16px' : '14px 28px',
                backgroundColor: COLORS.yellow,
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                fontSize: isMobile ? '10px' : '12px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'black';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.yellow;
                e.currentTarget.style.color = 'black';
              }}
            >
              GET IN TOUCH
            </button>
            <button
              onClick={() => navigate('/assessment')}
              style={{
                padding: isMobile ? '10px 16px' : '14px 28px',
                backgroundColor: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: isMobile ? '10px' : '12px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.yellow;
                e.currentTarget.style.color = 'black';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'black';
                e.currentTarget.style.color = 'white';
              }}
            >
              GROWTH HEALTH CHECK
            </button>
            {company.caseStudy && (
              <button
                onClick={() => navigate('/portfolio')}
                style={{
                  padding: isMobile ? '10px 16px' : '14px 28px',
                  backgroundColor: 'transparent',
                  color: 'black',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  fontSize: isMobile ? '10px' : '12px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'black';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 'black';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'black';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)';
                }}
              >
                VIEW PORTFOLIO
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Scrollable Details (aligned with H1) */}
        <div style={{
          flex: 1,
          maxHeight: isMobile ? 'none' : 'calc(100vh - 280px)',
          overflowY: isMobile ? 'visible' : 'auto',
          paddingRight: '20px',
          paddingBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          maxWidth: isMobile ? '100%' : '600px'
        }}>
          {/* Highlights */}
          <div style={{
            marginBottom: '32px',
            animation: 'fadeInUp 0.6s ease-in-out 0.7s both'
          }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.15em',
              color: 'rgba(0,0,0,0.4)',
              marginBottom: '16px'
            }}>
              KEY HIGHLIGHTS
            </p>
            {company.highlights.map((highlight, index) => (
              <p key={index} style={{
                fontSize: '14px',
                lineHeight: '1.6',
                margin: '0 0 10px 0',
                padding: '8px 14px',
                backgroundColor: 'rgba(251, 191, 36, 0.08)',
                borderRadius: '4px',
                color: 'rgba(0,0,0,0.8)'
              }}>
                • {highlight}
              </p>
            ))}
          </div>

          {/* Case Study Content */}
          {company.caseStudy && (
            <>
              {/* Timeline & Scope Tags */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '24px',
                animation: 'fadeInUp 0.6s ease-in-out 0.8s both'
              }}>
                <span style={{
                  backgroundColor: 'black',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {company.caseStudy.timeline}
                </span>
                <span style={{
                  backgroundColor: COLORS.yellow,
                  color: 'black',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {company.caseStudy.scope}
                </span>
              </div>

              {/* Challenge */}
              {company.caseStudy.challenge && (
                <div style={{ marginBottom: '24px', animation: 'fadeInUp 0.6s ease-in-out 0.9s both' }}>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.15em',
                    color: 'rgba(0,0,0,0.4)',
                    marginBottom: '10px'
                  }}>
                    THE CHALLENGE
                  </p>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: '1.7',
                    color: 'rgba(0,0,0,0.7)',
                    margin: 0,
                    padding: '12px 16px',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    borderRadius: '6px'
                  }}>
                    {company.caseStudy.challenge}
                  </p>
                </div>
              )}

              {/* Solution */}
              {company.caseStudy.solution && (
                <div style={{ marginBottom: '24px', animation: 'fadeInUp 0.6s ease-in-out 1.0s both' }}>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    letterSpacing: '0.15em',
                    color: 'rgba(0,0,0,0.4)',
                    marginBottom: '10px'
                  }}>
                    THE SOLUTION
                  </p>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: '1.7',
                    color: 'rgba(0,0,0,0.7)',
                    margin: 0,
                    padding: '12px 16px',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    borderRadius: '6px'
                  }}>
                    {company.caseStudy.solution}
                  </p>
                </div>
              )}

              {/* Testimonial */}
              {company.caseStudy.testimonial && (
                <div style={{
                  marginBottom: '24px',
                  padding: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderLeft: `4px solid ${COLORS.yellow}`,
                  borderRadius: '0 8px 8px 0',
                  animation: 'fadeInUp 0.6s ease-in-out 1.1s both'
                }}>
                  <p style={{
                    fontSize: '14px',
                    fontStyle: 'italic',
                    lineHeight: '1.8',
                    marginBottom: '16px',
                    color: 'rgba(0, 0, 0, 0.75)'
                  }}>
                    "{company.caseStudy.testimonial.quote}"
                  </p>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    margin: 0,
                    color: 'black'
                  }}>
                    — {company.caseStudy.testimonial.author}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: 'rgba(0, 0, 0, 0.5)',
                    margin: '4px 0 0 0'
                  }}>
                    {company.caseStudy.testimonial.title}
                  </p>
                </div>
              )}

              {/* Technologies */}
              {company.caseStudy.technologies && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  animation: 'fadeInUp 0.6s ease-in-out 1.2s both'
                }}>
                  {company.caseStudy.technologies.map((tech, index) => (
                    <span key={index} style={{
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      color: 'rgba(0, 0, 0, 0.7)',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Coming Soon for non-case-study companies */}
          {!company.caseStudy && (
            <div style={{
              padding: '40px 0',
              textAlign: 'center',
              animation: 'fadeInUp 0.6s ease-in-out 0.8s both'
            }}>
              <p style={{
                fontSize: '12px',
                color: 'rgba(0,0,0,0.3)',
                letterSpacing: '0.1em',
                fontWeight: '600'
              }}>
                FULL CASE STUDY COMING SOON
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default CompanyDetailPage;
