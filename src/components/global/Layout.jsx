import React from 'react';
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
  navCircleRotation = 0,
  scrollOffset = 0,
  pageLabel = "HOME",
  sidebarVariant = "standard", // "standard" or "hidden"
  customCircleNav = null, // Custom circle nav component
  hideParallaxCircle = false, // Hide the background yellow circle
  hideCircleNav = false // Hide the NavigationCircle completely (for pages with custom nav)
}) {
  const { openContactModal } = useLayout();

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
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
          height: '100vh',
          backgroundColor: '#FFFFFF',
          zIndex: -1000,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />

      <style>{`
        /* Global viewport constraints */
        body, html {
          max-height: 100vh !important;
          overflow: hidden !important;
        }

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
            rotation={navCircleRotation}
            onMenuToggle={onMenuToggle}
            onContactClick={openContactModal}
            onScrollNext={onScrollNext}
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
