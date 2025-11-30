import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';

function AboutPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle, openContactModal } = useLayout();

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
              Marketing Operations Studio
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
            maxWidth: '500px',
            lineHeight: '1.6'
          }}>
            yellowCircle helps growth-stage companies fix their go-to-market infrastructure. We specialize in marketing operations, data architecture, and the organizational alignment that makes it all work.
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
                'GTM Audits & Technical Debt Quantification',
                'HubSpot, Salesforce & Marketing Automation',
                'Attribution Systems & Data Architecture',
                'Email Development & Creative Operations'
              ].map((item, index) => (
                <p key={index} style={{
                  ...TYPOGRAPHY.body,
                  fontSize: '14px',
                  margin: 0,
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  ...EFFECTS.blur,
                  display: 'inline-block',
                  padding: '6px 12px',
                  width: 'fit-content'
                }}>
                  {item}
                </p>
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
        </div>
      </div>
    </Layout>
  );
}

export default AboutPage;
