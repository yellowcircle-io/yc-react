import React, { useEffect } from 'react';
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
      'Built and scaled email marketing infrastructure',
      'Implemented HubSpot-Salesforce integration',
      'Developed attribution and reporting frameworks',
      'Designed marketing automation architecture'
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

  // Get company data or redirect to 404
  const company = COMPANY_DATA[companyId];

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
    return null; // Will redirect
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
      }}></div>

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
          {/* Company Name */}
          <h1 style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            {company.name}
          </h1>

          {/* Back Link - Under H1 */}
          <a
            href="/works"
            onClick={(e) => {
              e.preventDefault();
              handleBackToWorks();
            }}
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              letterSpacing: '0.05em',
              color: COLORS.yellow,
              textDecoration: 'none',
              marginTop: '8px',
              marginBottom: '16px',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              animation: 'fadeInUp 0.6s ease-in-out 0.3s both'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            ← Back to Clients
          </a>

          {/* Role & Category */}
          <div style={{ position: 'relative', minHeight: '80px' }}>
            <p style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.black,
              backgroundColor: COLORS.backgroundLight,
              ...EFFECTS.blur,
              display: 'inline-block',
              padding: '2px 6px',
              animation: 'fadeInUp 0.6s ease-in-out 0.4s both'
            }}>
              {company.engagement}
            </p>
          </div>

          {/* Year & Category */}
          <p style={{
            ...TYPOGRAPHY.body,
            margin: '10px 0 0 0',
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '4px 8px',
            animation: 'fadeInUp 0.6s ease-in-out 0.5s both'
          }}>
            {company.category} • {company.year}
          </p>

          {/* Description */}
          <p style={{
            ...TYPOGRAPHY.body,
            margin: '20px 0 0 0',
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '8px 12px',
            maxWidth: '500px',
            lineHeight: '1.6',
            animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
          }}>
            {company.description}
          </p>

          {/* Highlights */}
          <div style={{
            margin: '30px 0 0 0',
            animation: 'fadeInUp 0.6s ease-in-out 0.7s both'
          }}>
            <p style={{
              ...TYPOGRAPHY.small,
              color: 'rgba(0, 0, 0, 0.4)',
              fontWeight: '700',
              letterSpacing: '0.15em',
              marginBottom: '12px'
            }}>
              KEY HIGHLIGHTS
            </p>
            {company.highlights.map((highlight, index) => (
              <p key={index} style={{
                ...TYPOGRAPHY.body,
                margin: '8px 0',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                ...EFFECTS.blur,
                display: 'inline-block',
                padding: '6px 12px',
                fontSize: '14px'
              }}>
                • {highlight}
              </p>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{
            marginTop: '30px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            animation: 'fadeInUp 0.6s ease-in-out 0.8s both'
          }}>
            <button
              onClick={() => openContactModal('', `Inquiry from ${company.name} case study`)}
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
            <button
              onClick={() => navigate('/assessment')}
              style={{
                padding: '14px 28px',
                backgroundColor: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.yellow;
                e.currentTarget.style.color = 'black';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'black';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              GROWTH HEALTH CHECK
            </button>
            {company.caseStudy && (
              <button
                onClick={() => navigate('/portfolio')}
                style={{
                  padding: '14px 28px',
                  backgroundColor: 'transparent',
                  color: 'black',
                  border: '2px solid rgba(0,0,0,0.2)',
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
                  e.currentTarget.style.borderColor = 'black';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'black';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                VIEW PORTFOLIO
              </button>
            )}
          </div>

          {/* Case Study Section */}
          {company.caseStudy ? (
            <div style={{
              marginTop: '30px',
              animation: 'fadeInUp 0.6s ease-in-out 0.9s both'
            }}>
              {/* Timeline & Scope */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <span style={{
                  backgroundColor: 'black',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.05em'
                }}>
                  {company.caseStudy.timeline}
                </span>
                <span style={{
                  backgroundColor: COLORS.yellow,
                  color: 'black',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.05em'
                }}>
                  {company.caseStudy.scope}
                </span>
              </div>

              {/* Challenge & Solution */}
              {company.caseStudy.challenge && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{
                    ...TYPOGRAPHY.small,
                    color: 'rgba(0, 0, 0, 0.4)',
                    fontWeight: '700',
                    letterSpacing: '0.15em',
                    marginBottom: '8px'
                  }}>
                    THE CHALLENGE
                  </p>
                  <p style={{
                    ...TYPOGRAPHY.body,
                    backgroundColor: COLORS.backgroundLight,
                    ...EFFECTS.blur,
                    padding: '8px 12px',
                    maxWidth: '500px',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>
                    {company.caseStudy.challenge}
                  </p>
                </div>
              )}

              {company.caseStudy.solution && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{
                    ...TYPOGRAPHY.small,
                    color: 'rgba(0, 0, 0, 0.4)',
                    fontWeight: '700',
                    letterSpacing: '0.15em',
                    marginBottom: '8px'
                  }}>
                    THE SOLUTION
                  </p>
                  <p style={{
                    ...TYPOGRAPHY.body,
                    backgroundColor: COLORS.backgroundLight,
                    ...EFFECTS.blur,
                    padding: '8px 12px',
                    maxWidth: '500px',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>
                    {company.caseStudy.solution}
                  </p>
                </div>
              )}

              {/* Testimonial */}
              {company.caseStudy.testimonial && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  borderLeft: `3px solid ${COLORS.yellow}`,
                  maxWidth: '520px'
                }}>
                  <p style={{
                    ...TYPOGRAPHY.body,
                    fontStyle: 'italic',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    marginBottom: '12px',
                    color: 'rgba(0, 0, 0, 0.8)'
                  }}>
                    "{company.caseStudy.testimonial.quote}"
                  </p>
                  <p style={{
                    ...TYPOGRAPHY.small,
                    fontWeight: '600',
                    margin: 0
                  }}>
                    — {company.caseStudy.testimonial.author}
                  </p>
                  <p style={{
                    ...TYPOGRAPHY.small,
                    color: 'rgba(0, 0, 0, 0.5)',
                    margin: '2px 0 0 0'
                  }}>
                    {company.caseStudy.testimonial.title}
                  </p>
                </div>
              )}

              {/* Technologies */}
              {company.caseStudy.technologies && (
                <div style={{
                  marginTop: '20px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {company.caseStudy.technologies.map((tech, index) => (
                    <span key={index} style={{
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      color: 'rgba(0, 0, 0, 0.7)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              marginTop: '20px',
              animation: 'fadeInUp 0.6s ease-in-out 0.9s both'
            }}>
              <button
                disabled
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: 'rgba(0, 0, 0, 0.3)',
                  border: '1px dashed rgba(0, 0, 0, 0.2)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  cursor: 'not-allowed'
                }}
                title="Case study coming soon"
              >
                VIEW FULL CASE STUDY — COMING SOON
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default CompanyDetailPage;
