import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Layout from '../../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../../styles/constants';
import { navigationItems } from '../../config/navigationItems';

// Company data with detailed information
const COMPANY_DATA = {
  liveintent: {
    name: 'LiveIntent',
    category: 'Ad Tech',
    year: '2019-2023',
    role: 'Marketing Operations Manager',
    description: 'Led marketing operations for identity resolution and programmatic advertising platform serving publishers and advertisers globally.',
    highlights: [
      'Built and scaled email marketing infrastructure',
      'Implemented HubSpot-Salesforce integration',
      'Developed attribution and reporting frameworks',
      'Managed marketing automation workflows'
    ]
  },
  tunecore: {
    name: 'TuneCore',
    category: 'Music',
    year: '2018-2019',
    role: 'Digital Marketing Lead',
    description: 'Drove digital marketing strategy for the leading music distribution platform serving independent artists worldwide.',
    highlights: [
      'Scaled email marketing to 1M+ subscribers',
      'Optimized artist onboarding funnels',
      'Built lifecycle marketing programs',
      'Increased artist activation rates 35%'
    ]
  },
  thimble: {
    name: 'Thimble',
    category: 'Insurance',
    year: '2020',
    role: 'Growth Marketing Consultant',
    description: 'Consulted on growth marketing for on-demand insurance platform targeting small businesses and gig workers.',
    highlights: [
      'Developed acquisition strategy',
      'Optimized quote-to-bind conversion',
      'Built referral marketing program',
      'Improved customer retention flows'
    ]
  },
  yieldstreet: {
    name: 'YieldStreet',
    category: 'FinTech',
    year: '2021',
    role: 'Marketing Automation Consultant',
    description: 'Designed and implemented marketing automation for alternative investment platform serving accredited investors.',
    highlights: [
      'Built investor nurture sequences',
      'Developed investment alerts system',
      'Created portfolio update campaigns',
      'Implemented compliance-ready email flows'
    ]
  },
  zerogrocery: {
    name: 'Zero Grocery',
    category: 'E-Commerce',
    year: '2020',
    role: 'Email Marketing Lead',
    description: 'Led email marketing for zero-waste grocery delivery startup focused on sustainability.',
    highlights: [
      'Built subscription lifecycle program',
      'Developed environmental impact reporting',
      'Created re-engagement campaigns',
      'Designed delivery reminder sequences'
    ]
  },
  doordash: {
    name: 'DoorDash',
    category: 'Delivery',
    year: '2022',
    role: 'Marketing Operations Consultant',
    description: 'Consulted on merchant-facing marketing operations and restaurant growth programs.',
    highlights: [
      'Optimized merchant onboarding flows',
      'Built restaurant partner communications',
      'Developed performance reporting',
      'Created merchant success campaigns'
    ]
  },
  virtana: {
    name: 'Virtana',
    category: 'Enterprise',
    year: '2023',
    role: 'Marketing Ops Consultant',
    description: 'Advised on marketing operations for AIOps platform serving enterprise infrastructure teams.',
    highlights: [
      'Assessed tech stack efficiency',
      'Designed lead scoring models',
      'Built account-based marketing flows',
      'Optimized demo request process'
    ]
  },
  reddit: {
    name: 'Reddit',
    category: 'Social',
    year: '2024',
    role: 'Marketing Systems Consultant',
    description: 'Consulted on marketing systems architecture for community and advertiser engagement programs.',
    highlights: [
      'Audited marketing tech stack',
      'Designed advertiser nurture journeys',
      'Built community growth campaigns',
      'Optimized self-serve ad platform flows'
    ]
  },
  'estee-lauder': {
    name: 'Estee Lauder',
    category: 'Beauty',
    year: '2024',
    role: 'Email Development Consultant',
    description: 'Developed email templates and marketing automation for luxury beauty brand portfolio.',
    highlights: [
      'Created responsive email templates',
      'Built personalization frameworks',
      'Developed loyalty program communications',
      'Designed product launch sequences'
    ]
  },
  auditboard: {
    name: 'AuditBoard',
    category: 'Enterprise',
    year: '2024',
    role: 'GTM Systems Consultant',
    description: 'Advised on go-to-market systems for audit and risk management SaaS platform.',
    highlights: [
      'Audited HubSpot-Salesforce integration',
      'Identified technical debt ($2M+ savings)',
      'Designed workflow optimization plan',
      'Created attribution improvement roadmap'
    ]
  },
  rho: {
    name: 'Rho',
    category: 'FinTech',
    year: '2024-2025',
    role: 'Senior Marketing Operations Manager',
    description: 'Led marketing operations for B2B fintech platform offering business banking and spend management solutions.',
    highlights: [
      'Managed HubSpot-Salesforce integration',
      'Identified $2.5M+ annual technical debt',
      'Built attribution and reporting systems',
      'Optimized lifecycle marketing workflows',
      'Led events and webinar marketing'
    ]
  }
};

function CompanyDetailPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

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

      {/* Back Button */}
      <button
        onClick={handleBackToWorks}
        style={{
          position: 'fixed',
          top: '20px',
          left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(100px, 8vw)',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '10px 20px',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '0.1em',
          color: 'rgba(0, 0, 0, 0.5)',
          zIndex: 100,
          transition: 'left 0.5s ease-out, color 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.color = COLORS.yellow}
        onMouseLeave={(e) => e.target.style.color = 'rgba(0, 0, 0, 0.5)'}
      >
        ← BACK TO WORKS
      </button>

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
              {company.role}
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
        </div>
      </div>
    </Layout>
  );
}

export default CompanyDetailPage;
