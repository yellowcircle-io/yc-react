import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';

function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Mobile detection
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
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

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: '700',
        color: COLORS.yellow,
        marginBottom: '12px',
        letterSpacing: '0.05em'
      }}>
        {title}
      </h2>
      <div style={{
        ...TYPOGRAPHY.body,
        lineHeight: '1.7',
        color: 'rgba(0, 0, 0, 0.8)'
      }}>
        {children}
      </div>
    </div>
  );

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="PRIVACY"
    >
      <div style={{
        position: 'fixed',
        top: '80px',
        bottom: footerOpen ? '320px' : '40px',
        left: isMobile ? 0 : (sidebarOpen ? 'min(35vw, 472px)' : '80px'),
        right: 0,
        padding: isMobile ? '0 20px' : '0 80px',
        overflow: 'auto',
        zIndex: 61,
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out'
      }}>
        <div style={{ maxWidth: '720px' }}>
          <h1 style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            marginBottom: '16px',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            Privacy Policy
          </h1>

          <p style={{
            ...TYPOGRAPHY.body,
            color: 'rgba(0, 0, 0, 0.5)',
            marginBottom: '40px',
            animation: 'fadeInUp 0.6s ease-in-out 0.3s both'
          }}>
            Last updated: December 2025
          </p>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '32px',
            animation: 'fadeInUp 0.6s ease-in-out 0.4s both'
          }}>
            <Section title="1. Information We Collect">
              <p style={{ marginBottom: '12px' }}>
                yellowCircle collects information you provide directly:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li style={{ marginBottom: '8px' }}>Contact form submissions (name, email, message)</li>
                <li style={{ marginBottom: '8px' }}>Assessment responses when using Growth Health Check</li>
                <li style={{ marginBottom: '8px' }}>Feedback submissions</li>
              </ul>
            </Section>

            <Section title="2. How We Use Your Information">
              <p style={{ marginBottom: '12px' }}>
                We use your information to:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li style={{ marginBottom: '8px' }}>Respond to inquiries and contact requests</li>
                <li style={{ marginBottom: '8px' }}>Provide assessment results and recommendations</li>
                <li style={{ marginBottom: '8px' }}>Improve our services and website experience</li>
                <li style={{ marginBottom: '8px' }}>Send relevant communications (with your consent)</li>
              </ul>
            </Section>

            <Section title="3. Data Storage & Security">
              <p>
                Your data is stored securely using industry-standard encryption. We use Firebase for hosting and data storage, which maintains SOC 2 compliance. We do not sell your personal information to third parties.
              </p>
            </Section>

            <Section title="4. Third-Party Services">
              <p style={{ marginBottom: '12px' }}>
                We use the following third-party services:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li style={{ marginBottom: '8px' }}>Firebase (hosting, database)</li>
                <li style={{ marginBottom: '8px' }}>Cloudinary (image delivery)</li>
                <li style={{ marginBottom: '8px' }}>Calendly (scheduling)</li>
              </ul>
              <p style={{ marginTop: '12px' }}>
                Each service has their own privacy policy governing data handling.
              </p>
            </Section>

            <Section title="5. Cookies & Analytics">
              <p>
                We use minimal cookies necessary for website functionality. We do not use invasive tracking or sell data to advertisers. Basic analytics help us understand site usage patterns.
              </p>
            </Section>

            <Section title="6. Your Rights">
              <p style={{ marginBottom: '12px' }}>
                You have the right to:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li style={{ marginBottom: '8px' }}>Request access to your personal data</li>
                <li style={{ marginBottom: '8px' }}>Request deletion of your data</li>
                <li style={{ marginBottom: '8px' }}>Opt out of communications</li>
                <li style={{ marginBottom: '8px' }}>Correct inaccurate information</li>
              </ul>
            </Section>

            <Section title="7. Contact">
              <p>
                For privacy-related questions, contact us at{' '}
                <a href="mailto:chris@yellowcircle.io" style={{ color: COLORS.yellow, textDecoration: 'none' }}>
                  chris@yellowcircle.io
                </a>
              </p>
            </Section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default PrivacyPolicyPage;
