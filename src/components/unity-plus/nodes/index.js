/**
 * Unity+ Premium Node Types
 *
 * Export all premium node components for use in ReactFlow.
 *
 * Usage in UnityNotesPage:
 * import { premiumNodeTypes } from '../components/unity-plus/nodes';
 *
 * const nodeTypes = {
 *   ...existingNodeTypes,
 *   ...premiumNodeTypes
 * };
 */

import StickyNode from './StickyNode';
import TodoNode from './TodoNode';
import CommentNode from './CommentNode';
import ColorSwatchNode from './ColorSwatchNode';
import CodeBlockNode from './CodeBlockNode';
import GroupNode from './GroupNode';
import MapNode from './MapNode';
import TripPlannerMapNode from './TripPlannerMapNode';
import LinkNode from './LinkNode';

// Node type registry for ReactFlow
export const premiumNodeTypes = {
  stickyNode: StickyNode,
  todoNode: TodoNode,
  commentNode: CommentNode,
  colorSwatchNode: ColorSwatchNode,
  codeBlockNode: CodeBlockNode,
  groupNode: GroupNode,
  mapNode: MapNode,
  tripPlannerMapNode: TripPlannerMapNode,
  linkNode: LinkNode,
};

// Individual exports for direct imports
export {
  StickyNode,
  TodoNode,
  CommentNode,
  ColorSwatchNode,
  CodeBlockNode,
  GroupNode,
  MapNode,
  TripPlannerMapNode,
  LinkNode,
};

// Premium card type configuration (for Add Note dialog)
export const PREMIUM_CARD_TYPES = {
  sticky: {
    label: 'Sticky Note',
    icon: '📌',
    color: '#fbbf24',
    description: 'Quick colored sticky note',
    nodeType: 'stickyNode',
    defaultData: {
      content: '',
      color: 'yellow',
      size: 150,
    },
  },
  todo: {
    label: 'To-Do List',
    icon: '✅',
    color: '#22c55e',
    description: 'Checklist with progress',
    nodeType: 'todoNode',
    defaultData: {
      title: 'To-Do List',
      items: [],
    },
  },
  comment: {
    label: 'Comment',
    icon: '💬',
    color: '#6366f1',
    description: 'Annotation bubble',
    nodeType: 'commentNode',
    defaultData: {
      content: '',
      author: 'User',
      timestamp: new Date().toISOString(),
    },
  },
  colorSwatch: {
    label: 'Color Palette',
    icon: '🎨',
    color: '#f97316',
    description: 'Color collection',
    nodeType: 'colorSwatchNode',
    defaultData: {
      title: 'Color Palette',
      colors: ['#fbbf24', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6'],
    },
  },
  group: {
    label: 'Group',
    icon: '📦',
    color: '#9ca3af',
    description: 'Visual container',
    nodeType: 'groupNode',
    defaultData: {
      label: 'Group',
      color: 'gray',
      width: 300,
      height: 200,
    },
  },
  map: {
    label: 'Map',
    icon: '🗺️',
    color: '#22c55e',
    description: 'Location with Google Maps',
    nodeType: 'mapNode',
    defaultData: {
      title: 'Map',
      address: '',
      coordinates: null,
      zoom: 14,
      places: [],
      apiKey: '', // Set from environment or capsule config
    },
  },
  tripPlanner: {
    label: 'Trip Planner',
    icon: '✈️',
    color: '#3b82f6',
    description: 'Interactive map with destinations, distances & AI itinerary',
    nodeType: 'tripPlannerMapNode',
    defaultData: {
      title: 'Trip Planner',
      baseLocation: null,
      places: [],
      proximityGroups: [],
      aiSuggestion: '',
      apiKey: '', // Set from environment or capsule config
    },
  },
  codeBlock: {
    label: 'Code Block',
    icon: '💻',
    color: '#1e1e1e',
    description: 'Code snippet',
    nodeType: 'codeBlockNode',
    defaultData: {
      code: '// Your code here',
      language: 'javascript',
      filename: '',
    },
  },
  link: {
    label: 'Saved Link',
    icon: '🔗',
    color: '#f97316',
    description: 'Link from Link Archiver',
    nodeType: 'linkNode',
    defaultData: {
      url: '',
      title: 'Saved Link',
      domain: '',
      favicon: null,
      image: null,
      excerpt: '',
      tags: [],
      starred: false,
      readProgress: 0,
      aiSummary: null,
    },
  },
};

export default premiumNodeTypes;
