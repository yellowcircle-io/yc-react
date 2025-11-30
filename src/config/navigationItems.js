/**
 * Global Navigation Items Configuration
 *
 * Centralized navigation configuration for the Sidebar component.
 * This ensures consistent navigation across ALL pages.
 *
 * Only pages that need different sidebar behavior (like Unity Notes)
 * should use the sidebarVariant prop - not different navigationItems.
 */

// Lottie animation data for sidebar icons
import servicesAnimation from '../assets/lottie/wip.json';
import storiesAnimation from '../assets/lottie/scroll-with-quill.json';
import labsAnimation from '../assets/lottie/beaker.json';
import aboutAnimation from '../assets/lottie/wave.json';

/**
 * Standard navigation items for all pages
 * Uses Lottie animations for icons
 */
export const navigationItems = [
  {
    lottieData: servicesAnimation,
    label: "SERVICES",
    itemKey: "services",
    subItems: [
      { label: "GTM STRATEGIC AUDIT", key: "gtm-audit", route: "/services" },
      { label: "MARKETING SYSTEMS", key: "marketing-systems", route: "/services" },
      { label: "TECHNICAL DEBT", key: "technical-debt", route: "/services" },
      { label: "DATA ARCHITECTURE", key: "data-architecture", route: "/services" },
      { label: "CREATIVE + OPERATIONS", key: "creative-operations", route: "/services" },
      { label: "EMAIL DEVELOPMENT", key: "email-development", route: "/services" }
    ]
  },
  {
    lottieData: storiesAnimation,
    label: "STORIES",
    itemKey: "stories",
    subItems: [
      // Works section
      { label: "WORKS", key: "works", route: "/works", isSectionHeader: true },
      { label: "RHO", key: "rho", route: "/works/rho" },
      { label: "AUDITBOARD", key: "auditboard", route: "/works/auditboard" },
      { label: "REDDIT", key: "reddit", route: "/works/reddit" },
      { label: "ESTÉE LAUDER", key: "estee-lauder", route: "/works/estee-lauder" },
      // Divider + Ongoing Stories section
      { label: "divider", key: "divider-1", isDivider: true },
      { label: "ONGOING STORIES", key: "ongoing-header", isSectionHeader: true, isSubheader: true },
      { label: "GOLDEN UNKNOWN", key: "golden-unknown", route: "/experiments/golden-unknown" },
      { label: "CATH3DRAL", key: "cath3dral" },
      { label: "THOUGHTS", key: "thoughts", route: "/thoughts" }
    ]
  },
  {
    lottieData: labsAnimation,
    label: "LABS",
    itemKey: "labs",
    subItems: [
      { label: "UNITY NOTES", key: "unity-notes", route: "/unity-notes" },
      { label: "OUTREACH", key: "outreach", route: "/outreach" }
    ]
  },
  {
    lottieData: aboutAnimation,
    label: "ABOUT",
    itemKey: "about",
    subItems: []
  }
];

export default navigationItems;
