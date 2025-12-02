import React from 'react';
import { useNavigate } from 'react-router-dom';
import ParallaxCircle from './ParallaxCircle';
import NavigationCircle from './NavigationCircle';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import HamburgerMenu from './HamburgerMenu';
import ContactModal from './ContactModal';
import { useLayout } from '../../contexts/LayoutContext';

/**
 * Layout - Master wrapper component
 * Matches HomePage.jsx structure (lines 654-1580)
 * Composes all global components without theme system
 *
 * Variants:
 * - sidebarVariant: "standard" (80px closed) or "hidden" (0px closed)
 * - circleNavBehavior: Custom behavior for NavigationCircle
 */
function Layout({
  children,
  onHomeClick,
  onFooterToggle,
  onMenuToggle,
  onScrollNext = null, // Handler for scroll jump to next page
  navigationItems = [],
  scrollOffset = 0,
  pageLabel = "HOME",
  sidebarVariant = "standard", // "standard" or "hidden"
  customCircleNav = null, // Custom circle nav component
  hideParallaxCircle = false, // Hide the background yellow circle
  hideCircleNav = false, // Hide the NavigationCircle completely (for pages with custom nav)
  isHomePage = false, // Show arrow Lottie during scroll, placeholder at end
  allowScroll = false // Enable vertical scrolling for article pages
}) {
  const navigate = useNavigate();
  const { openContactModal } = useLayout();

  // Navigation handlers for CircleNav menu
  const handleHomeClick = () => {
    navigate('/');
  };

  const handleWorksClick = () => {
    navigate('/works');
  };

  return (
    <div style={{
      height: allowScroll ? 'auto' : '100dvh', // Use dvh for mobile browser toolbar awareness
      minHeight: allowScroll ? '100dvh' : undefined,
      width: '100vw',
      position: 'relative',
      overflow: allowScroll ? 'visible' : 'hidden',
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* FOUNDATION BACKGROUND LAYER - WHITE BASE */}
      <div
        className="foundation-background-layer"
        data-layer="foundation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh', // Use dvh for mobile browser toolbar awareness
          backgroundColor: '#FFFFFF',
          zIndex: -1000,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />

      <style>{`
        /* Global viewport constraints - use dvh for mobile compatibility */
        ${allowScroll ? `
        body, html {
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }
        ` : `
        body, html {
          max-height: 100dvh !important;
          overflow: hidden !important;
        }
        /* Fallback for browsers that don't support dvh */
        @supports not (height: 100dvh) {
          body, html {
            max-height: 100vh !important;
          }
        }
        `}

        /* YC Logo visibility boost */
        .yc-logo {
          z-index: 100 !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.96; }
        }
        @keyframes slideInStagger {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes buttonFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpFadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Yellow Circle with Parallax */}
      {!hideParallaxCircle && <ParallaxCircle />}

      {/* Navigation Bar */}
      <Header onHomeClick={onHomeClick} />

      {/* Sidebar */}
      <Sidebar
        onHomeClick={onHomeClick}
        onFooterToggle={onFooterToggle}
        navigationItems={navigationItems}
        scrollOffset={scrollOffset}
        pageLabel={pageLabel}
        variant={sidebarVariant}
      />

      {/* Page Content */}
      <main style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </main>

      {/* Navigation Circle (Bottom Right) */}
      {!hideCircleNav && (
        customCircleNav ? customCircleNav : (
          <NavigationCircle
            onClick={onFooterToggle}
            scrollOffset={scrollOffset}
            isHomePage={isHomePage}
            onMenuToggle={onMenuToggle}
            onContactClick={openContactModal}
            onScrollNext={onScrollNext}
            onHomeClick={handleHomeClick}
            onWorksClick={handleWorksClick}
          />
        )
      )}

      {/* Footer */}
      <Footer onFooterToggle={onFooterToggle} />

      {/* Hamburger Menu */}
      <HamburgerMenu
        onMenuToggle={onMenuToggle}
        onHomeClick={onHomeClick}
        onFooterToggle={onFooterToggle}
        onContactClick={openContactModal}
      />

      {/* Contact Modal */}
      <ContactModal />
    </div>
  );
}

export default Layout;
