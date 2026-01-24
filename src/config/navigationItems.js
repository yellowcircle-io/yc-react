/**
 * Global Navigation Items Configuration
 *
 * Centralized navigation configuration for the Sidebar component.
 * This ensures consistent navigation across ALL pages.
 *
 * Only pages that need different sidebar behavior (like UnityNotes)
 * should use the sidebarVariant prop - not different navigationItems.
 *
 * NOTE: Animations are loaded dynamically via useLottieAnimation hook
 * to reduce initial bundle size (~178KB saved).
 */

/**
 * Standard navigation items for all pages
 * Uses lottieAnimation name (string) - loaded dynamically by Sidebar
 * Organized into two sections: START HERE and EXPLORE
 *
 * IMPORTANT: Keep in sync with HamburgerMenu.jsx menuConfig
 */
export const navigationItems = [
  // ========================
  // START HERE - Primary actions
  // ========================
  {
    isSectionLabel: true,
    label: "START HERE",
    itemKey: "section-start-here"
  },
  {
    lottieAnimation: 'checklist',  // Dynamic load via useLottieAnimation
    label: "GROWTH HEALTH CHECK",
    itemKey: "assessment",
    route: "/assessment",
    subItems: []
  },
  {
    lottieAnimation: 'wip',  // Dynamic load via useLottieAnimation
    label: "SERVICES",
    itemKey: "services",
    subItems: [
      { label: "ALL SERVICES", key: "all-services", route: "/services", isSectionHeader: true },
      { label: "GROWTH INFRASTRUCTURE AUDIT", key: "gtm-audit", route: "/services/gtm-audit" },
      { label: "MARKETING SYSTEMS", key: "marketing-systems", route: "/services/marketing-systems" },
      { label: "TECHNICAL DEBT", key: "technical-debt", route: "/services/technical-debt" },
      { label: "ATTRIBUTION AUDIT", key: "attribution-audit", route: "/services/attribution-audit" },
      { label: "DATA ARCHITECTURE", key: "data-architecture", route: "/services/data-architecture" },
      { label: "CREATIVE + OPERATIONS", key: "creative-operations", route: "/services/creative-operations" },
      { label: "EMAIL DEVELOPMENT", key: "email-development", route: "/services/email-development" }
    ]
  },
  {
    lottieAnimation: 'wave',  // Dynamic load via useLottieAnimation
    label: "ABOUT",
    itemKey: "about",
    route: "/about",
    subItems: []
  },
  // ========================
  // EXPLORE - Stories and tools
  // ========================
  {
    isSectionLabel: true,
    label: "EXPLORE",
    itemKey: "section-explore"
  },
  {
    lottieAnimation: 'scroll-with-quill',  // Dynamic load via useLottieAnimation
    label: "STORIES",
    itemKey: "stories",
    subItems: [
      // Clients section
      { label: "CLIENTS", key: "works", route: "/works", isSectionHeader: true },
      { label: "RHO TECHNOLOGIES", key: "rho", route: "/works/rho" },
      { label: "REDDIT", key: "reddit", route: "/works/reddit" },
      { label: "ESTÉE LAUDER", key: "estee-lauder", route: "/works/estee-lauder" },
      // Divider + Ongoing Stories section
      { label: "divider", key: "divider-1", isDivider: true },
      { label: "ONGOING STORIES", key: "ongoing-header", isSectionHeader: true, isSubheader: true },
      { label: "GOLDEN UNKNOWN", key: "golden-unknown", route: "/experiments/golden-unknown" },
      { label: "CATH3DRAL", key: "cath3dral", route: "/experiments/cath3dral" },
      { label: "THOUGHTS", key: "thoughts", route: "/thoughts" }
    ]
  },
  {
    lottieAnimation: 'map',  // Dynamic load via useLottieAnimation
    label: "JOURNEYS",
    itemKey: "journeys",
    subItems: [
      { label: "UNITYMAP GENERATOR", key: "outreach-generator", route: "/experiments/outreach-generator" },
      { label: "UNITYNOTES", key: "unity-notes", route: "/unity-notes" }
      // Note: OUTREACH hidden from nav but accessible via /outreach and in sitemap
    ]
  },
  // ========================
  // ACCOUNT - User settings
  // ========================
  {
    isSectionLabel: true,
    label: "ACCOUNT",
    itemKey: "section-account"
  },
  {
    lottieAnimation: 'settings-gear',  // Dynamic load via useLottieAnimation
    label: "SETTINGS",
    itemKey: "settings",
    route: "/account/settings",
    subItems: []
  }
];

export default navigationItems;
