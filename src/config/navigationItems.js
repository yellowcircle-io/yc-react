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
      { label: "GTM Strategic Audit", key: "gtm-audit" },
      { label: "Marketing Systems", key: "marketing-systems" },
      { label: "Technical Debt Audit", key: "technical-debt" },
      { label: "Data Architecture", key: "data-architecture" },
      { label: "Email Development", key: "email-development" }
    ]
  },
  {
    lottieData: storiesAnimation,
    label: "STORIES",
    itemKey: "stories",
    subItems: [
      {
        label: "Projects",
        key: "projects",
        subItems: ["Brand Development", "Marketing Architecture", "Email Development"]
      },
      { label: "Golden Unknown", key: "golden-unknown" },
      {
        label: "Cath3dral",
        key: "cath3dral",
        subItems: ["Being + Rhyme"]
      },
      { label: "Thoughts", key: "thoughts" }
    ]
  },
  {
    lottieData: labsAnimation,
    label: "LABS",
    itemKey: "labs",
    subItems: [
      { label: "Unity Notes", key: "unity-notes" },
      { label: "Outreach", key: "outreach" },
      { label: "Home-17", key: "home-17" },
      { label: "Visual Noteboard", key: "visual-noteboard" },
      { label: "Component Library", key: "component-library" }
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
