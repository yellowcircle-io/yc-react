import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';

function TermsPage() {
  const navigate = useNavigate();
  const { sidebarOpen, handleFooterToggle, handleMenuToggle } = useLayout();

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
      pageLabel="TERMS"
      allowScroll={true}
    >
      <div style={{
        position: 'relative',
        minHeight: '100vh',
        paddingTop: '100px',
        paddingBottom: '120px',
        paddingLeft: sidebarOpen ? 'max(calc(min(35vw, 472px) + 40px), 12vw)' : 'max(120px, 8vw)',
        paddingRight: 'max(40px, 8vw)',
        transition: 'padding-left 0.5s ease-out'
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
            Terms of Service
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
            <Section title="1. Agreement to Terms">
              <p>
                By accessing yellowcircle.io, you agree to these Terms of Service. If you disagree with any part, you may not access the website or use our services.
              </p>
            </Section>

            <Section title="2. Services">
              <p style={{ marginBottom: '12px' }}>
                yellowCircle provides GTM strategy and marketing operations consulting services including:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li style={{ marginBottom: '8px' }}>Strategic GTM audits</li>
                <li style={{ marginBottom: '8px' }}>Marketing operations consulting</li>
                <li style={{ marginBottom: '8px' }}>Growth Health Check assessments</li>
                <li style={{ marginBottom: '8px' }}>Outreach generation tools</li>
              </ul>
              <p style={{ marginTop: '12px' }}>
                Specific engagement terms are defined in separate service agreements.
              </p>
            </Section>

            <Section title="3. Intellectual Property">
              <p>
                All content on this website, including text, graphics, logos, and software, is the property of yellowCircle or its licensors. You may not reproduce, distribute, or create derivative works without explicit permission.
              </p>
            </Section>

            <Section title="4. User Responsibilities">
              <p style={{ marginBottom: '12px' }}>
                When using our website and services, you agree to:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li style={{ marginBottom: '8px' }}>Provide accurate information</li>
                <li style={{ marginBottom: '8px' }}>Not misuse or attempt to disrupt the website</li>
                <li style={{ marginBottom: '8px' }}>Respect intellectual property rights</li>
                <li style={{ marginBottom: '8px' }}>Comply with applicable laws</li>
              </ul>
            </Section>

            <Section title="5. Disclaimers">
              <p style={{ marginBottom: '12px' }}>
                The website and services are provided "as is" without warranties of any kind. While we strive for accuracy, we do not guarantee:
              </p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li style={{ marginBottom: '8px' }}>Uninterrupted or error-free operation</li>
                <li style={{ marginBottom: '8px' }}>Specific results from our services or tools</li>
                <li style={{ marginBottom: '8px' }}>That content is current or complete</li>
              </ul>
            </Section>

            <Section title="6. Limitation of Liability">
              <p>
                yellowCircle shall not be liable for indirect, incidental, special, or consequential damages arising from your use of the website or services. Our total liability shall not exceed the amount paid for services.
              </p>
            </Section>

            <Section title="7. Consulting Engagements">
              <p>
                Formal consulting engagements are governed by separate service agreements that define scope, deliverables, fees, and terms specific to each project.
              </p>
            </Section>

            <Section title="8. Changes to Terms">
              <p>
                We reserve the right to modify these terms at any time. Continued use of the website after changes constitutes acceptance of updated terms.
              </p>
            </Section>

            <Section title="9. Governing Law">
              <p>
                These terms are governed by the laws of the State of New York, United States, without regard to conflict of law provisions.
              </p>
            </Section>

            <Section title="10. Contact">
              <p>
                For questions about these terms, contact us at{' '}
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

export default TermsPage;
