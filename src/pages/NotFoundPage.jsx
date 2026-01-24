import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import Layout from '../components/global/Layout';
import { COLORS, TYPOGRAPHY, BUTTON, EFFECTS } from '../styles/constants';
import { navigationItems } from '../config/navigationItems';

function NotFoundPage() {
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
      pageLabel="404"
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
          {/* Large "404" heading */}
          <h1 style={{
            ...TYPOGRAPHY.h1,
            color: COLORS.error,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            404
          </h1>

          <div style={{ position: 'relative', minHeight: '120px' }}>
            {/* Subtitle */}
            <p style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.black,
              backgroundColor: COLORS.backgroundLight,
              ...EFFECTS.blur,
              display: 'inline-block',
              padding: '2px 6px',
              animation: 'fadeInUp 0.6s ease-in-out 0.4s both'
            }}>
              Page not found
            </p>
          </div>

          {/* Description */}
          <p style={{
            ...TYPOGRAPHY.body,
            margin: '10px 0 0 0',
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '4px 8px',
            animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
          }}>
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Back to Home button */}
          <div style={{ marginTop: '30px', pointerEvents: 'auto', animation: 'fadeInUp 0.6s ease-in-out 0.8s both' }}>
            <button
              onClick={handleHomeClick}
              style={{
                ...BUTTON.primary,
                backgroundColor: 'rgb(238, 207, 0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(238, 207, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = BUTTON.primary.boxShadow;
              }}
            >
              BACK TO HOME
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default NotFoundPage;
