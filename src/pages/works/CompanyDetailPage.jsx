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
    role: 'VP of Design',
    description: 'Led design for identity resolution and programmatic advertising platform serving 200M+ users.',
    highlights: [
      'Built design team from 2 to 8 designers',
      'Launched new brand identity and design system',
      'Redesigned core platform UX increasing adoption 40%'
    ]
  },
  tunecore: {
    name: 'TuneCore',
    category: 'Music',
    year: '2018-2019',
    role: 'Design Lead',
    description: 'Designed music distribution platform used by independent artists worldwide.',
    highlights: [
      'Streamlined artist onboarding flow',
      'Designed royalty reporting dashboard',
      'Created artist analytics tools'
    ]
  },
  thimble: {
    name: 'Thimble',
    category: 'Insurance',
    year: '2020',
    role: 'Design Consultant',
    description: 'Designed on-demand insurance platform for small businesses and gig workers.',
    highlights: [
      'Simplified quote-to-bind flow',
      'Mobile-first policy management',
      'Claims tracking dashboard'
    ]
  },
  yieldstreet: {
    name: 'YieldStreet',
    category: 'FinTech',
    year: '2021',
    role: 'Design Consultant',
    description: 'Designed alternative investment platform for accredited investors.',
    highlights: [
      'Investment discovery experience',
      'Portfolio visualization tools',
      'Due diligence documentation flow'
    ]
  },
  zerogrocery: {
    name: 'Zero Grocery',
    category: 'E-Commerce',
    year: '2020',
    role: 'Design Lead',
    description: 'Designed zero-waste grocery delivery service focused on sustainability.',
    highlights: [
      'Subscription management system',
      'Environmental impact tracking',
      'Reusable container logistics'
    ]
  },
  doordash: {
    name: 'DoorDash',
    category: 'Delivery',
    year: '2022',
    role: 'Senior Designer',
    description: 'Contributed to merchant-facing tools and restaurant management platform.',
    highlights: [
      'Menu management optimization',
      'Order flow improvements',
      'Analytics dashboard redesign'
    ]
  },
  virtana: {
    name: 'Virtana',
    category: 'Enterprise',
    year: '2023',
    role: 'Design Consultant',
    description: 'Designed AIOps platform for hybrid cloud infrastructure management.',
    highlights: [
      'Unified monitoring dashboard',
      'Anomaly detection visualization',
      'Capacity planning tools'
    ]
  },
  reddit: {
    name: 'Reddit',
    category: 'Social',
    year: '2024',
    role: 'Senior Designer',
    description: 'Designed features for community engagement and moderation tools.',
    highlights: [
      'Community growth analytics',
      'Moderation workflow optimization',
      'Engagement insights dashboard'
    ]
  },
  'estee-lauder': {
    name: 'Estee Lauder',
    category: 'Beauty',
    year: '2024',
    role: 'Design Lead',
    description: 'Led digital experience design for luxury beauty brands.',
    highlights: [
      'Personalization engine UX',
      'Virtual try-on experience',
      'Loyalty program redesign'
    ]
  },
  auditboard: {
    name: 'AuditBoard',
    category: 'Enterprise',
    year: '2024',
    role: 'Design Consultant',
    description: 'Designed audit and risk management platform for enterprise teams.',
    highlights: [
      'Workflow automation tools',
      'Risk assessment visualization',
      'Compliance tracking dashboard'
    ]
  },
  rho: {
    name: 'Rho',
    category: 'FinTech',
    year: '2024-Present',
    role: 'Head of Design',
    description: 'Leading design for business banking and spend management platform.',
    highlights: [
      'Corporate card experience',
      'Expense management workflow',
      'Treasury and cash management'
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
