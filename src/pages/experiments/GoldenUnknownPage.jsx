import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Layout from '../../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../../styles/constants';
import { navigationItems } from '../../config/navigationItems';

function GoldenUnknownPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  // Mobile detection
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
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="GOLDEN UNKNOWN"
    >
      {/* Main Content */}
      <div style={{
        position: 'fixed',
        top: '80px',
        bottom: footerOpen ? '320px' : '40px',
        left: isMobile ? 0 : (sidebarOpen ? 'min(35vw, 472px)' : '80px'),
        right: 0,
        padding: isMobile ? '0 20px' : '0 80px',
        display: 'flex',
        alignItems: 'center',
        zIndex: 61,
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out'
      }}>
        <div style={{
          ...TYPOGRAPHY.container
        }}>
          {/* Large heading - using scaled version */}
          <h1 style={{
            ...TYPOGRAPHY.h1Scaled,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            GOLDEN UNKNOWN
          </h1>

          <div style={{ position: 'relative', minHeight: '120px' }}>
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
              Exploration through ambiguity
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
            animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
          }}>
            A creative project exploring the space between known and unknown, certainty and mystery.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default GoldenUnknownPage;
