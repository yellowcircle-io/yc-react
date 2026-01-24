import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Layout from '../../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../../styles/constants';
import { navigationItems } from '../../config/navigationItems';

function Cath3dralPage() {
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

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="CATH3DRAL"
    >
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
        <div style={{ ...TYPOGRAPHY.container }}>
          <h1 style={{
            ...TYPOGRAPHY.h1Scaled,
            color: COLORS.yellow,
            ...EFFECTS.blurLight,
            display: 'inline-block',
            animation: 'fadeInUp 0.6s ease-in-out 0.2s both'
          }}>
            CATH3DRAL
          </h1>

          <div style={{ position: 'relative', minHeight: '120px' }}>
            <p style={{
              ...TYPOGRAPHY.h2,
              color: COLORS.black,
              backgroundColor: COLORS.backgroundLight,
              ...EFFECTS.blur,
              display: 'inline-block',
              padding: '2px 6px',
              animation: 'fadeInUp 0.6s ease-in-out 0.4s both'
            }}>
              Sacred geometry meets digital space
            </p>
          </div>

          <p style={{
            ...TYPOGRAPHY.body,
            margin: '10px 0 0 0',
            backgroundColor: COLORS.backgroundLight,
            ...EFFECTS.blur,
            display: 'inline-block',
            padding: '4px 8px',
            animation: 'fadeInUp 0.6s ease-in-out 0.6s both'
          }}>
            An architectural meditation exploring sacred patterns and modern technology through 3D visualization.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Cath3dralPage;
