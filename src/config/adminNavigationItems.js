/**
 * Admin Navigation Items
 *
 * Shared navigation configuration for admin pages sidebar.
 * Includes all admin tools and utilities.
 */

// Admin navigation items for sidebar
export const adminNavigationItems = [
  { isSectionLabel: true, label: 'ADMIN', itemKey: 'admin-section' },
  {
    itemKey: 'admin-hub',
    label: 'Admin Hub',
    icon: null,
    route: '/admin'
  },
  {
    itemKey: 'admin-articles',
    label: 'Articles',
    icon: null,
    route: '/admin/articles'
  },
  {
    itemKey: 'admin-contacts',
    label: 'Contacts',
    icon: null,
    route: '/admin/contacts'
  },
  {
    itemKey: 'admin-triggers',
    label: 'Trigger Rules',
    icon: null,
    route: '/admin/trigger-rules'
  },
  { isSectionLabel: true, label: 'TOOLS', itemKey: 'tools-section' },
  {
    itemKey: 'tool-unity-notes',
    label: 'UnityNOTES',
    icon: null,
    route: '/unity-notes'
  },
  {
    itemKey: 'tool-outreach',
    label: 'UnityMAP',
    icon: null,
    route: '/outreach'
  },
  {
    itemKey: 'tool-journeys',
    label: 'Journeys',
    icon: null,
    route: '/journeys'
  },
  {
    itemKey: 'tool-shortlinks',
    label: 'Shortlinks',
    icon: null,
    route: '/shortlinks'
  },
  { isSectionLabel: true, label: 'NAVIGATION', itemKey: 'nav-section' },
  {
    itemKey: 'nav-home',
    label: 'Home',
    icon: null,
    route: '/'
  },
  {
    itemKey: 'nav-works',
    label: 'Works',
    icon: null,
    route: '/works'
  }
];

export default adminNavigationItems;
