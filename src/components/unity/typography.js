/**
 * Unity Typography Helpers
 * Consistent typography styles for Unity Notes components
 *
 * Usage:
 * import { cardTitle, cardBody, cardMeta, cardLabel } from '../unity/typography';
 * <div style={cardTitle}>Title</div>
 * <p style={cardBody}>Content</p>
 */

import { UNITY } from '../../styles/constants';

// Card title style
export const cardTitle = {
  ...UNITY.typography.title,
};

// Card body text style
export const cardBody = {
  ...UNITY.typography.body,
};

// Meta text style (timestamps, labels)
export const cardMeta = {
  ...UNITY.typography.meta,
};

// Node type label style
export const cardLabel = {
  ...UNITY.typography.label,
};

// Helper to get node type color
export const getNodeTypeColor = (type) => {
  return UNITY.nodeTypes[type] || UNITY.nodeTypes.note;
};

// Spacing helpers
export const spacing = UNITY.spacing;

// Card container style helper
export const cardContainer = {
  backgroundColor: UNITY.card.bg,
  border: `1px solid ${UNITY.card.border}`,
  borderRadius: UNITY.card.borderRadius,
  padding: UNITY.card.padding,
  minWidth: UNITY.card.minWidth,
  maxWidth: UNITY.card.maxWidth,
  boxShadow: UNITY.card.shadow,
};

// Mobile-aware style helper
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < UNITY.breakpoints.mobile;
};

export default {
  cardTitle,
  cardBody,
  cardMeta,
  cardLabel,
  cardContainer,
  spacing,
  getNodeTypeColor,
  isMobile,
};
