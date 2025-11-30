import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Layout from '../../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../../styles/constants';
import { navigationItems } from '../../config/navigationItems';

// Service data - yellowCircle service offerings
const SERVICE_DATA = {
  'gtm-audit': {
    name: 'GTM Strategic Audit',
    category: 'Strategic Assessment',
    price: '$4,000 - $5,000',
    duration: '2-3 weeks',
    description: 'Comprehensive go-to-market infrastructure assessment. Find out why your marketing ops feels stuck—and get a clear path forward.',
    deliverables: [
      'Tech stack and workflow audit',
      'Technical debt quantification (actual $ cost)',
      '30/60/90 day action plan',
      'Build vs. buy recommendations',
      'Executive summary presentation'
    ],
    idealFor: 'Growth-stage companies feeling friction between marketing and sales, or preparing for scale.'
  },
  'marketing-systems': {
    name: 'Marketing Systems Audit',
    category: 'Platform Assessment',
    price: '$2,500 - $4,000',
    duration: '1-2 weeks',
    description: 'Deep dive into your HubSpot, Salesforce, or marketing automation platform to identify inefficiencies and optimization opportunities.',
    deliverables: [
      'Platform configuration review',
      'Workflow efficiency analysis',
      'Integration health check',
      'Optimization roadmap',
      'Best practices documentation'
    ],
    idealFor: 'Teams with mature platforms that have accumulated technical debt or configuration drift.'
  },
  'technical-debt': {
    name: 'Technical Debt Quantification',
    category: 'Financial Assessment',
    price: '$2,500 - $3,500',
    duration: '1-2 weeks',
    description: 'Put a dollar figure on the hidden costs dragging down your marketing operations.',
    deliverables: [
      'Workflow inventory & status audit',
      'Integration error rate analysis',
      'Cost calculation by category',
      'Paydown prioritization (ROI-ranked)',
      'Executive business case'
    ],
    idealFor: 'Marketing leaders who need to justify ops investment to finance or executive team.'
  },
  'attribution-audit': {
    name: 'Attribution System Audit',
    category: 'Data Assessment',
    price: '$2,000 - $3,000',
    duration: '1-2 weeks',
    description: 'Finally answer "which channel drives revenue" with a single source of truth.',
    deliverables: [
      'Current implementations inventory',
      'Fill rate analysis by field',
      'Workflow dependency mapping',
      'Migration plan for deprecated fields',
      'Attribution model recommendation'
    ],
    idealFor: 'Teams struggling with conflicting reports or incomplete campaign tracking.'
  },
  'data-architecture': {
    name: 'Data Architecture Assessment',
    category: 'Technical Assessment',
    price: '$3,000 - $4,000',
    duration: '2-3 weeks',
    description: 'Diagnose data lag, sync errors, and schema inconsistencies across your marketing stack.',
    deliverables: [
      'Data flow mapping (system to system)',
      'Latency analysis',
      'Schema comparison across tools',
      'Event-driven migration recommendation',
      'Architecture diagram'
    ],
    idealFor: 'Companies with multiple tools that need to share data in real-time.'
  },
  'creative-operations': {
    name: 'Creative + Operations',
    category: 'Embedded Partnership',
    price: 'Custom',
    duration: 'Project-based',
    description: 'End-to-end email development, CRM standardization, and brand template systems for enterprise marketing teams.',
    deliverables: [
      'Responsive email template development',
      'CRM data standardization',
      'Cross-brand best practices',
      'Loyalty & lifecycle communications',
      'Template library with documentation'
    ],
    idealFor: 'Enterprise brands needing consistent, scalable creative operations.'
  },
  'email-development': {
    name: 'Email Template Development',
    category: 'Creative Services',
    price: 'Starting at $500',
    duration: 'Per template',
    description: 'Custom, responsive email templates that render perfectly across all clients and devices.',
    deliverables: [
      'Mobile-responsive design',
      'Dark mode compatible',
      'HubSpot/Salesforce/Marketo ready',
      'A/B test variations included',
      'QA across 50+ email clients'
    ],
    idealFor: 'Teams that need production-ready templates without the agency overhead.'
  }
};

function ServiceDetailPage() {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle, openContactModal } = useLayout();

  // Get service data or redirect to 404
  const service = SERVICE_DATA[serviceId];

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

  // Redirect to 404 if service not found
  useEffect(() => {
    if (!service) {
      navigate('/404', { replace: true });
    }
  }, [service, navigate]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleBackToServices = () => {
    navigate('/services');
  };

  const handleGetStarted = () => {
    openContactModal('', `Interested in: ${service.name}`);
  };

  if (!service) {
    return null; // Will redirect
  }

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel={service.name.toUpperCase()}
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
        onClick={handleBackToServices}
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
        ← BACK TO SERVICES
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
          {/* Service Name */}
          <h1 style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            {service.name}
          </h1>

          {/* Category & Price */}
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
              {service.category}
            </p>
          </div>

          {/* Price & Duration */}
          <p style={{
            ...TYPOGRAPHY.body,
            margin: '10px 0 0 0',
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '4px 8px',
            animation: 'fadeInUp 0.6s ease-in-out 0.5s both'
          }}>
            {service.price} • {service.duration}
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
            {service.description}
          </p>

          {/* Deliverables */}
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
              DELIVERABLES
            </p>
            {service.deliverables.map((item, index) => (
              <p key={index} style={{
                ...TYPOGRAPHY.body,
                margin: '8px 0',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                ...EFFECTS.blur,
                display: 'inline-block',
                padding: '6px 12px',
                fontSize: '14px'
              }}>
                • {item}
              </p>
            ))}
          </div>

          {/* Ideal For */}
          <div style={{
            margin: '24px 0 0 0',
            animation: 'fadeInUp 0.6s ease-in-out 0.8s both'
          }}>
            <p style={{
              ...TYPOGRAPHY.small,
              color: 'rgba(0, 0, 0, 0.4)',
              fontWeight: '700',
              letterSpacing: '0.15em',
              marginBottom: '8px'
            }}>
              IDEAL FOR
            </p>
            <p style={{
              ...TYPOGRAPHY.body,
              fontSize: '14px',
              color: 'rgba(0,0,0,0.7)',
              fontStyle: 'italic',
              maxWidth: '450px',
              lineHeight: '1.5'
            }}>
              {service.idealFor}
            </p>
          </div>

          {/* CTA */}
          <div style={{
            margin: '30px 0 0 0',
            animation: 'fadeInUp 0.6s ease-in-out 0.9s both'
          }}>
            <button
              onClick={handleGetStarted}
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
              GET STARTED
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ServiceDetailPage;
