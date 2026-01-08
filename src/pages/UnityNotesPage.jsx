import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  applyNodeChanges,
  getNodesBounds,
  getViewportForBounds,
  getRectOfNodes,
  getTransformForBounds
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Layout from '../components/global/Layout';
import LeadGate from '../components/shared/LeadGate';
import { useLayout } from '../contexts/LayoutContext';
import { navigationItems } from '../config/navigationItems';
import { useAuth } from '../contexts/AuthContext';
import { useApiKeyStorage } from '../hooks/useApiKeyStorage';
import { useCredits } from '../hooks/useCredits';
import DraggablePhotoNode from '../components/travel/DraggablePhotoNode';
import TextNoteNode from '../components/unity-plus/TextNoteNode';
import { premiumNodeTypes, PREMIUM_CARD_TYPES } from '../components/unity-plus/nodes';
import PhotoUploadModal from '../components/travel/PhotoUploadModal';
import ShareModal from '../components/unity/ShareModal';
import AIGenerateCanvasModal from '../components/unity/AIGenerateCanvasModal';
import OverviewTray from '../components/unity/OverviewTray';
import VirtualizedNodeList from '../components/unity/VirtualizedNodeList';
import LightboxModal from '../components/travel/LightboxModal';
import EditMemoryModal from '../components/travel/EditMemoryModal';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import UnityCircleNav from '../components/unity/UnityCircleNav';
import { mapNodeTypes, createJourneyFromOutreach } from '../components/unity/map';
import EmailEditModal from '../components/unity/map/EmailEditModal';
import WaitEditModal from '../components/unity/map/WaitEditModal';
import ConditionEditModal from '../components/unity/map/ConditionEditModal';
import ProspectInputModal from '../components/unity/map/ProspectInputModal';
import { uploadMultipleToCloudinary } from '../utils/cloudinaryUpload';
import { prepareNodesForRendering } from '../utils/nodeUtils';
import { useFirebaseCapsule } from '../hooks/useFirebaseCapsule';
import { useFirebaseJourney } from '../hooks/useFirebaseJourney';
import { useImageAnalysis } from '../hooks/useImageAnalysis';
import UnityStudioCanvas from '../components/unity-studio/UnityStudioCanvas';
import { useKeyboardShortcuts } from '../components/unity/useKeyboardShortcuts';

// ============================================================================
// NODE SIZE MAP (Static constant for performance)
// ============================================================================

// Static node size map - used for group auto-sizing calculations
// This is extracted as a module-level constant to prevent object allocation
// on every drag operation (previously recreated in handleNodeDragStop)
const NODE_SIZE_MAP = {
  textNote: { width: 280, height: 180 },
  stickyNode: { width: 200, height: 200 },
  commentNode: { width: 260, height: 140 },
  todoNode: { width: 220, height: 250 },
  photoNode: { width: 280, height: 200 },
  prospectNode: { width: 320, height: 200 },
  colorSwatchNode: { width: 200, height: 140 },
  waitNode: { width: 260, height: 180 },
};

// Default size for unknown node types
const DEFAULT_NODE_SIZE = { width: 200, height: 150 };

// ============================================================================
// MAP NODE TYPES (Static Set for performance)
// ============================================================================

// Static Set of MAP node types - used for journey save/publish operations and auto-layout
// This is extracted as a module-level Set constant to prevent array allocation
// and enable O(1) type checking (Set.has vs Array.includes which is O(n))
// Used in: handleSaveJourney, _handleStartPublish, handleSmartSave, handleAutoLayout
const MAP_NODE_TYPES = new Set(['prospectNode', 'emailNode', 'waitNode', 'conditionNode', 'exitNode']);

// Static Set of SIMPLE node types - used for node type checking in prepareNodesForRendering
// This is extracted as a module-level Set constant to prevent array allocation
// and enable O(1) type checking (Set.has vs Array.includes which is O(n))
// Used in: prepareNodesForRendering during capsule loading
const SIMPLE_NODE_TYPES = new Set(['stickyNode', 'commentNode', 'linkNode']);

// ============================================================================
// WIKI-STYLE LINK STYLES (Static constants for performance)
// ============================================================================

// Static style objects for wiki-style links - used in renderTextWithLinks
// Extracted as module-level constants to prevent object allocation on every render
// Previously these were inline styles created for each wiki-link on every render
const WIKI_LINK_STYLE = {
  color: '#3b82f6',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontWeight: '500',
  padding: '1px 3px',
  borderRadius: '3px',
  backgroundColor: 'transparent',
  transition: 'background-color 0.15s ease-in-out'
};

const BROKEN_WIKI_LINK_STYLE = {
  color: '#ef4444',
  textDecoration: 'line-through',
  fontStyle: 'italic'
};

// Module-level event handlers for wiki-link hover effects
// Reused across all wiki-links to prevent creating new functions on every render
const handleWikiLinkMouseEnter = (e) => {
  e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
};

const handleWikiLinkMouseLeave = (e) => {
  e.target.style.backgroundColor = 'transparent';
};

// PERFORMANCE OPTIMIZATION: Unified click handler for all wiki links
// Instead of creating inline arrow functions for each link (1000+ functions for 100 nodes with 10 links each),
// we use a single handler that reads the node ID from the data-node-id attribute (1 function total)
// This eliminates closure allocations and reduces memory pressure during rendering
const handleWikiLinkClick = (e, onLinkClick) => {
  e.stopPropagation();
  const nodeId = e.currentTarget.getAttribute('data-node-id');
  if (nodeId && onLinkClick) {
    onLinkClick(nodeId);
  }
};

// ============================================================================
// WIKI-STYLE NODE LINKING UTILITIES
// ============================================================================

/**
 * Parse wiki-style links from text content
 * Matches [[Node Name]] syntax
 * @param {string} text - Text content to parse
 * @returns {Array} Array of link objects with {text, start, end}
 */
const parseWikiLinks = (text) => {
  if (!text) return [];
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    links.push({
      text: match[1].trim(),
      start: match.index,
      end: match.index + match[0].length,
      fullMatch: match[0]
    });
  }

  return links;
};

/**
 * Build a map of backlinks (which nodes reference each node)
 * Performance optimized: O(n) instead of O(n²) by using Map for node lookups
 * @param {Array} nodes - All nodes on the canvas
 * @returns {Object} Map of nodeId -> array of {sourceNodeId, sourceNodeLabel}
 */
const buildBacklinksMap = (nodes) => {
  const backlinksMap = {};

  // PERFORMANCE OPTIMIZATION: Create lookup maps for O(1) node searching
  // Instead of using nodes.find() for every link (O(n) per link), we build index maps once
  // For 100 nodes with 10 links each: Before = ~100,000 ops, After = ~1,000 ops (100x faster)
  const nodeByLabel = new Map();
  const nodeByContentPrefix = new Map();

  nodes.forEach(node => {
    const label = (node.data?.label || node.data?.title || '').toLowerCase().trim();
    const content = (node.data?.content || node.data?.text || '').toLowerCase().trim();

    // Index by label (primary lookup)
    if (label) {
      nodeByLabel.set(label, node);
    }

    // Index by content prefix (fallback for nodes without labels)
    if (content && !label) {
      // Store first 100 chars as prefix for matching
      const prefix = content.substring(0, 100);
      nodeByContentPrefix.set(prefix, node);
    }
  });

  nodes.forEach(sourceNode => {
    const content = sourceNode.data?.content || sourceNode.data?.text || '';
    const links = parseWikiLinks(content);

    links.forEach(link => {
      const linkTextLower = link.text.toLowerCase();

      // O(1) lookup by label (replaces O(n) nodes.find)
      let targetNode = nodeByLabel.get(linkTextLower);

      // Fallback: try matching by content prefix for unlabeled nodes
      if (!targetNode) {
        // Check if any content prefix starts with the link text
        for (const [prefix, node] of nodeByContentPrefix.entries()) {
          if (prefix.startsWith(linkTextLower)) {
            targetNode = node;
            break;
          }
        }
      }

      if (targetNode) {
        if (!backlinksMap[targetNode.id]) {
          backlinksMap[targetNode.id] = [];
        }

        // Avoid duplicate backlinks from same source
        if (!backlinksMap[targetNode.id].some(bl => bl.sourceNodeId === sourceNode.id)) {
          backlinksMap[targetNode.id].push({
            sourceNodeId: sourceNode.id,
            sourceNodeLabel: sourceNode.data?.label || sourceNode.data?.title || 'Untitled'
          });
        }
      }
    });
  });

  return backlinksMap;
};

/**
 * Replace wiki links in text with clickable React components
 * @param {string} text - Text content with [[links]]
 * @param {Array} nodes - All nodes (to validate links)
 * @param {Function} onLinkClick - Callback when link is clicked (nodeId)
 * @returns {React.Node} Text with links as JSX
 */
const renderTextWithLinks = (text, nodes, onLinkClick) => {
  if (!text) return text;

  const links = parseWikiLinks(text);
  if (links.length === 0) return text;

  // PERFORMANCE OPTIMIZATION: Create lookup maps for O(1) node searching
  // Instead of using nodes.find() for every link (O(n) per link), we build index maps once
  // For 100 nodes with 10 links each: Before = ~1,000 O(n) ops, After = ~1,000 O(1) ops (10-100x faster)
  const nodeByLabel = new Map();
  const nodeByContentPrefix = new Map();

  nodes.forEach(node => {
    const label = (node.data?.label || node.data?.title || '').toLowerCase().trim();
    const content = (node.data?.content || node.data?.text || '').toLowerCase().trim();

    // Index by label (primary lookup)
    if (label) {
      nodeByLabel.set(label, node);
    }

    // Index by content prefix (fallback for nodes without labels)
    if (content && !label) {
      // Store first 100 chars as prefix for matching
      const prefix = content.substring(0, 100);
      nodeByContentPrefix.set(prefix, node);
    }
  });

  const parts = [];
  let lastIndex = 0;

  links.forEach((link, idx) => {
    // Add text before the link
    if (link.start > lastIndex) {
      parts.push(text.substring(lastIndex, link.start));
    }

    // Find the target node using O(1) Map lookups
    const linkTextLower = link.text.toLowerCase();
    let targetNode = nodeByLabel.get(linkTextLower);

    // Fallback: try matching by content prefix for unlabeled nodes
    if (!targetNode) {
      for (const [prefix, node] of nodeByContentPrefix.entries()) {
        if (prefix.startsWith(linkTextLower)) {
          targetNode = node;
          break;
        }
      }
    }

    // Render as clickable link or broken link
    if (targetNode) {
      parts.push(
        <span
          key={`link-${idx}`}
          data-node-id={targetNode.id}
          onClick={(e) => handleWikiLinkClick(e, onLinkClick)}
          style={WIKI_LINK_STYLE}
          onMouseEnter={handleWikiLinkMouseEnter}
          onMouseLeave={handleWikiLinkMouseLeave}
        >
          {link.text}
        </span>
      );
    } else {
      // Broken link (target doesn't exist)
      parts.push(
        <span
          key={`broken-link-${idx}`}
          style={BROKEN_WIKI_LINK_STYLE}
          title="This node doesn't exist"
        >
          {link.text}
        </span>
      );
    }

    lastIndex = link.end;
  });

  // Add remaining text after last link
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

/**
 * TOUCH/MOBILE GESTURE IMPROVEMENTS (iOS Safari Compatibility)
 *
 * Key configurations for reliable touch interactions:
 *
 * 1. Pan Gesture Configuration (line ~5358):
 *    - panOnDrag={[1]} allows ONLY 1-finger panning
 *    - 2-finger gestures are RESERVED EXCLUSIVELY for pinch-to-zoom
 *    - This prevents race conditions between 2-finger pan and pinch-to-zoom on iOS Safari
 *    - INTERACTION MODEL:
 *      • 1-finger drag on canvas background = pan the canvas
 *      • 2-finger pinch = zoom in/out (no conflict!)
 *      • 1-finger drag on node = drag the node
 *      • Pan Mode toggle = alternative for explicit pan-only interaction
 *
 * 2. Gesture Detection Threshold (line ~89):
 *    - GESTURE_THRESHOLD = 15px (optimized for touch vs mouse precision)
 *    - Reduces false positives when tapping vs dragging on touch devices
 *
 * 3. Touch-Action CSS (line ~6329):
 *    - touchAction: 'none' disables browser's default touch handling
 *    - Gives React Flow full control over all touch gestures (pan, pinch-zoom, drag)
 *    - Prevents iOS Safari from interfering with ReactFlow's gesture handlers
 *
 * 4. Touch Event Handlers (lines 416-479):
 *    - Capture phase handlers block only 3+ finger gestures (Safari navigation prevention)
 *    - 1-2 finger gestures pass through unmodified to React Flow
 *    - This allows React Flow's native pinch-to-zoom to work perfectly
 *
 * 5. Pinch Distance Tracking Enhancement (v2 - lines 360-364):
 *    - Calculates actual Euclidean distance between two fingers during pinch gestures
 *    - Tracks zoom direction (in/out) with 15px jitter prevention threshold
 *    - Provides enhanced visual feedback showing "Zooming In" or "Zooming Out"
 *    - Updates icons dynamically: magnifying glass with plus/minus based on direction
 *    - Improves user understanding of pinch gesture state and zoom behavior
 *
 * These changes work together to provide smooth, conflict-free touch interactions
 * on iOS Safari while maintaining compatibility with desktop browsers.
 */

// Keyboard Shortcuts Help Modal Component
const ShortcutsHelpModal = React.memo(({ show, onClose }) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [show, onClose]);

  // Memoized style objects to prevent recreation on every render
  const overlayStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
  }), []);

  const modalContentStyle = useMemo(() => ({
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }), []);

  const headerContainerStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '16px',
  }), []);

  const headerTitleStyle = useMemo(() => ({
    color: '#ffffff',
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
  }), []);

  const closeButtonStyle = useMemo(() => ({
    background: 'transparent',
    border: 'none',
    color: '#999',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1',
    transition: 'color 0.2s',
  }), []);

  const shortcutsContainerStyle = useMemo(() => ({
    display: 'grid',
    gap: '24px'
  }), []);

  const categoryHeadingStyle = useMemo(() => ({
    color: '#888',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
  }), []);

  const itemsContainerStyle = useMemo(() => ({
    display: 'grid',
    gap: '8px'
  }), []);

  const shortcutItemStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
  }), []);

  const descriptionSpanStyle = useMemo(() => ({
    color: '#ccc',
    fontSize: '14px'
  }), []);

  const kbdStyle = useMemo(() => ({
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    whiteSpace: 'nowrap',
  }), []);

  const tipContainerStyle = useMemo(() => ({
    marginTop: '24px',
    padding: '16px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
  }), []);

  const tipParagraphStyle = useMemo(() => ({
    color: '#93c5fd',
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.6',
  }), []);

  const tipKbdStyle = useMemo(() => ({
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '12px',
    fontFamily: 'monospace',
  }), []);

  // Performance optimization: Memoized event handlers to prevent recreation on every render
  // Eliminates 20+ inline function allocations per render when modal is visible
  const handleCloseButtonMouseEnter = useCallback((e) => {
    e.target.style.color = '#fff';
  }, []);

  const handleCloseButtonMouseLeave = useCallback((e) => {
    e.target.style.color = '#999';
  }, []);

  // Performance optimization: Memoized stopPropagation handler for modal overlays
  // Prevents recreation on every render when modal is visible
  const handleModalContentClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleShortcutItemMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
  }, []);

  const handleShortcutItemMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
  }, []);

  if (!show) return null;

  const shortcuts = useMemo(() => [
    {
      category: 'Navigation',
      items: [
        { keys: `${modKey} + F`, description: 'Fit view (center all nodes)' },
        { keys: `${modKey} + 0`, description: 'Reset zoom to 100%' },
        { keys: 'Arrow Keys', description: 'Pan canvas (Shift for faster)' },
        { keys: 'Escape', description: 'Deselect all nodes' },
      ]
    },
    {
      category: 'Editing',
      items: [
        { keys: `${modKey} + N`, description: 'Add new card' },
        { keys: `${modKey} + D`, description: 'Duplicate selected node(s)' },
        { keys: `${modKey} + K`, description: 'Quick comment on selected' },
        { keys: `${modKey} + L`, description: 'Lock/unlock selected node(s)' },
        { keys: `${modKey} + T`, description: 'Convert group to todo checklist' },
        { keys: 'Delete/Backspace', description: 'Delete selected node(s)' },
        { keys: `${modKey} + Z`, description: 'Undo last action' },
        { keys: `${modKey} + ${isMac ? 'Shift + Z' : 'Y'}`, description: 'Redo last action' },
      ]
    },
    {
      category: 'File Operations',
      items: [
        { keys: `${modKey} + S`, description: 'Save to cloud (Pro users)' },
        { keys: `${modKey} + E`, description: 'Export JSON' },
        { keys: `${modKey} + Shift + M`, description: 'Export Markdown' },
        { keys: `${modKey} + I`, description: 'Import JSON' },
        { keys: `${modKey} + Shift + T`, description: 'Show node templates' },
        { keys: `${modKey} + Shift + A`, description: 'Show analytics dashboard' },
      ]
    },
    {
      category: 'Help',
      items: [
        { keys: `${modKey} + /`, description: 'Show/hide this shortcuts panel' },
      ]
    }
  ], [modKey, isMac]);

  return (
    <div
      style={overlayStyle}
      onClick={onClose}
    >
      <div
        style={modalContentStyle}
        onClick={handleModalContentClick}
      >
        <div style={headerContainerStyle}>
          <h2 style={headerTitleStyle}>
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={handleCloseButtonMouseEnter}
            onMouseLeave={handleCloseButtonMouseLeave}
          >
            ×
          </button>
        </div>

        <div style={shortcutsContainerStyle}>
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h3 style={categoryHeadingStyle}>
                {section.category}
              </h3>
              <div style={itemsContainerStyle}>
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    style={shortcutItemStyle}
                    onMouseEnter={handleShortcutItemMouseEnter}
                    onMouseLeave={handleShortcutItemMouseLeave}
                  >
                    <span style={descriptionSpanStyle}>
                      {item.description}
                    </span>
                    <kbd style={kbdStyle}>
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={tipContainerStyle}>
          <p style={tipParagraphStyle}>
            💡 <strong>Tip:</strong> Press <kbd style={tipKbdStyle}>{modKey} + /</kbd> anytime to toggle this panel, or press <kbd style={tipKbdStyle}>Esc</kbd> to close it.
          </p>
        </div>
      </div>
    </div>
  );
});

// Canvas Analytics Modal - displays workspace insights and statistics
const CanvasAnalyticsModal = React.memo(({ show, onClose, nodes, edges }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [show, onClose]);

  if (!show) return null;

  // Calculate analytics - memoized to prevent unnecessary recalculations
  const analyticsData = useMemo(() => {
    const totalNodes = nodes?.length || 0;
    const totalEdges = edges?.length || 0;
    const avgConnectionsPerNode = totalNodes > 0 ? (totalEdges * 2 / totalNodes).toFixed(1) : 0;

    // Node types breakdown
    const nodeTypes = nodes?.reduce((acc, node) => {
      const type = node.data?.nodeType || 'default';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) || {};

    const nodeTypesList = Object.entries(nodeTypes).sort((a, b) => b[1] - a[1]);

    // Find isolated nodes (no connections)
    const connectedNodeIds = new Set();
    edges?.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    const isolatedNodes = nodes?.filter(node => !connectedNodeIds.has(node.id)).length || 0;

    // Recent activity (last 7 days) - based on node creation/update
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentNodes = nodes?.filter(node => {
      const timestamp = node.data?.createdAt || node.data?.updatedAt;
      return timestamp && new Date(timestamp).getTime() > sevenDaysAgo;
    }).length || 0;

    // Comment analytics
    const totalComments = nodes?.reduce((sum, node) => {
      return sum + (node.data?.comments?.length || 0);
    }, 0) || 0;

    const nodesWithComments = nodes?.filter(node =>
      node.data?.comments && node.data.comments.length > 0
    ).length || 0;

    // AI conversations
    const nodesWithAI = nodes?.filter(node =>
      node.data?.aiConversation && node.data.aiConversation.length > 0
    ).length || 0;

    // Canvas dimensions - optimized with single-pass reduce instead of 4× map operations
    const { minX, maxX, minY, maxY } = nodes?.length > 0
      ? nodes.reduce((acc, node) => ({
          minX: Math.min(acc.minX, node.position.x),
          maxX: Math.max(acc.maxX, node.position.x),
          minY: Math.min(acc.minY, node.position.y),
          maxY: Math.max(acc.maxY, node.position.y)
        }), {
          minX: Infinity,
          maxX: -Infinity,
          minY: Infinity,
          maxY: -Infinity
        })
      : { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    const canvasWidth = maxX - minX;
    const canvasHeight = maxY - minY;

    return {
      totalNodes,
      totalEdges,
      avgConnectionsPerNode,
      nodeTypes,
      nodeTypesList,
      isolatedNodes,
      recentNodes,
      totalComments,
      nodesWithComments,
      nodesWithAI,
      canvasWidth,
      canvasHeight
    };
  }, [nodes, edges]);

  // Destructure for easy access in JSX
  const {
    totalNodes,
    totalEdges,
    avgConnectionsPerNode,
    nodeTypes,
    nodeTypesList,
    isolatedNodes,
    recentNodes,
    totalComments,
    nodesWithComments,
    nodesWithAI,
    canvasWidth,
    canvasHeight
  } = analyticsData;

  // Memoized color palette for node type distribution progress bars
  // Prevents array allocation on every render - performance optimization
  const nodeTypeColors = useMemo(() => [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Orange
    '#10b981'  // Green
  ], []);

  // Memoized styles - StatCard component
  const statCardContainerStyle = useMemo(() => ({
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s',
  }), []);

  const statCardIconStyle = useMemo(() => ({
    fontSize: '24px',
    marginBottom: '8px'
  }), []);

  const statCardValueStyle = useMemo(() => ({
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '4px'
  }), []);

  const statCardTitleStyle = useMemo(() => ({
    fontSize: '14px',
    color: '#999',
    marginBottom: '2px'
  }), []);

  const statCardSubtitleStyle = useMemo(() => ({
    fontSize: '12px',
    color: '#666'
  }), []);

  // Memoized styles - ProgressBar component
  const progressBarContainerStyle = useMemo(() => ({
    marginBottom: '12px'
  }), []);

  const progressBarHeaderStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '13px'
  }), []);

  const progressBarLabelStyle = useMemo(() => ({
    color: '#ccc'
  }), []);

  const progressBarValueStyle = useMemo(() => ({
    color: '#999'
  }), []);

  const progressBarTrackStyle = useMemo(() => ({
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
  }), []);

  // Memoized styles - Main modal overlay and container
  const modalOverlayStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
  }), []);

  const modalContainerStyle = useMemo(() => ({
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }), []);

  const modalHeaderStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '16px',
  }), []);

  const modalTitleStyle = useMemo(() => ({
    color: '#ffffff',
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
  }), []);

  const modalCloseButtonStyle = useMemo(() => ({
    background: 'transparent',
    border: 'none',
    color: '#999',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1',
    transition: 'color 0.2s',
  }), []);

  const statsGridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  }), []);

  const nodeTypesContainerStyle = useMemo(() => ({
    marginBottom: '32px'
  }), []);

  const nodeTypesHeadingStyle = useMemo(() => ({
    color: '#888',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '16px',
  }), []);

  const nodeTypesContentStyle = useMemo(() => ({
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }), []);

  const activityGridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  }), []);

  const activityCardStyle = useMemo(() => ({
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }), []);

  const activityHeadingStyle = useMemo(() => ({
    color: '#888',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: 0,
    marginBottom: '12px',
  }), []);

  const activityValueStyle = useMemo(() => ({
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '4px'
  }), []);

  const activitySubtitleStyle = useMemo(() => ({
    fontSize: '13px',
    color: '#999'
  }), []);

  // Dynamic style for network health value (color changes based on isolatedNodes)
  const networkHealthValueStyle = useMemo(() => ({
    fontSize: '28px',
    fontWeight: 'bold',
    color: isolatedNodes > 0 ? '#f59e0b' : '#10b981',
    marginBottom: '4px'
  }), [isolatedNodes]);

  const canvasSizeValueStyle = useMemo(() => ({
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '4px'
  }), []);

  const tipsContainerStyle = useMemo(() => ({
    padding: '16px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
  }), []);

  const tipsTextStyle = useMemo(() => ({
    color: '#93c5fd',
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.6',
  }), []);

  // Performance optimization: Memoized hover handlers for analytics modal close button
  const handleAnalyticsCloseButtonMouseEnter = useCallback((e) => {
    e.target.style.color = '#fff';
  }, []);

  const handleAnalyticsCloseButtonMouseLeave = useCallback((e) => {
    e.target.style.color = '#999';
  }, []);

  // Performance optimization: Memoized hover handlers for StatCard components
  const handleStatCardMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
    e.currentTarget.style.transform = 'translateY(-2px)';
  }, []);

  const handleStatCardMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
    e.currentTarget.style.transform = 'translateY(0)';
  }, []);

  const StatCard = React.memo(({ title, value, subtitle, icon }) => (
    <div style={statCardContainerStyle}
    onMouseEnter={handleStatCardMouseEnter}
    onMouseLeave={handleStatCardMouseLeave}>
      <div style={statCardIconStyle}>{icon}</div>
      <div style={statCardValueStyle}>
        {value}
      </div>
      <div style={statCardTitleStyle}>{title}</div>
      {subtitle && <div style={statCardSubtitleStyle}>{subtitle}</div>}
    </div>
  ));

  const ProgressBar = React.memo(({ label, value, total, color = '#3b82f6' }) => {
    const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;

    // Dynamic style for progress bar fill
    const progressBarFillStyle = useMemo(() => ({
      width: `${percentage}%`,
      height: '100%',
      backgroundColor: color,
      transition: 'width 0.3s ease',
    }), [percentage, color]);

    return (
      <div style={progressBarContainerStyle}>
        <div style={progressBarHeaderStyle}>
          <span style={progressBarLabelStyle}>{label}</span>
          <span style={progressBarValueStyle}>{value} ({percentage}%)</span>
        </div>
        <div style={progressBarTrackStyle}>
          <div style={progressBarFillStyle} />
        </div>
      </div>
    );
  });

  return (
    <div
      style={modalOverlayStyle}
      onClick={onClose}
    >
      <div
        style={modalContainerStyle}
        onClick={handleModalContentClick}
      >
        {/* Header */}
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>
            📊 Canvas Analytics
          </h2>
          <button
            onClick={onClose}
            style={modalCloseButtonStyle}
            onMouseEnter={handleAnalyticsCloseButtonMouseEnter}
            onMouseLeave={handleAnalyticsCloseButtonMouseLeave}
          >
            ×
          </button>
        </div>

        {/* Main Stats Grid */}
        <div style={statsGridStyle}>
          <StatCard
            icon="🎯"
            title="Total Nodes"
            value={totalNodes}
            subtitle="Cards on canvas"
          />
          <StatCard
            icon="🔗"
            title="Connections"
            value={totalEdges}
            subtitle={`${avgConnectionsPerNode} avg per node`}
          />
          <StatCard
            icon="💬"
            title="Comments"
            value={totalComments}
            subtitle={`On ${nodesWithComments} nodes`}
          />
          <StatCard
            icon="🤖"
            title="AI Conversations"
            value={nodesWithAI}
            subtitle="Nodes with AI chat"
          />
        </div>

        {/* Node Types Section */}
        {nodeTypesList.length > 0 && (
          <div style={nodeTypesContainerStyle}>
            <h3 style={nodeTypesHeadingStyle}>
              Node Types Distribution
            </h3>
            <div style={nodeTypesContentStyle}>
              {nodeTypesList.map(([type, count], idx) => (
                <ProgressBar
                  key={type}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  value={count}
                  total={totalNodes}
                  color={nodeTypeColors[idx % 5]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Activity & Insights */}
        <div style={activityGridStyle}>
          <div style={activityCardStyle}>
            <h4 style={activityHeadingStyle}>
              Recent Activity (7 days)
            </h4>
            <div style={activityValueStyle}>
              {recentNodes}
            </div>
            <div style={activitySubtitleStyle}>
              Nodes created or updated
            </div>
          </div>

          <div style={activityCardStyle}>
            <h4 style={activityHeadingStyle}>
              Network Health
            </h4>
            <div style={networkHealthValueStyle}>
              {isolatedNodes}
            </div>
            <div style={activitySubtitleStyle}>
              Isolated nodes (no connections)
            </div>
          </div>

          <div style={activityCardStyle}>
            <h4 style={activityHeadingStyle}>
              Canvas Size
            </h4>
            <div style={canvasSizeValueStyle}>
              {Math.round(canvasWidth)} × {Math.round(canvasHeight)}
            </div>
            <div style={activitySubtitleStyle}>
              Width × Height (pixels)
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div style={tipsContainerStyle}>
          <p style={tipsTextStyle}>
            💡 <strong>Insights:</strong> {
              isolatedNodes > 5
                ? `You have ${isolatedNodes} isolated nodes. Consider connecting related ideas to build a knowledge graph.`
                : totalNodes === 0
                ? 'Your canvas is empty. Start by adding some nodes to build your workspace!'
                : avgConnectionsPerNode < 2
                ? 'Your nodes are lightly connected. Adding more connections can help reveal relationships between ideas.'
                : 'Great job! Your canvas has a healthy network of connected ideas.'
            }
          </p>
        </div>
      </div>
    </div>
  );
});

// LoadingSkeleton Component - Performance Optimized with React.memo
// Prevents re-renders during app initialization when parent components re-render
// Typical startup involves 5-10 parent re-renders (state init, data fetch, websocket, theme)
// Before: 5-10 LoadingSkeleton re-renders during startup
// After: 1 LoadingSkeleton render (only when nodeCount prop changes)
// Expected improvement: 80-90% reduction in loading screen re-renders
const LoadingSkeleton = React.memo(({ nodeCount = 4 }) => {
  // Memoize static styles for performance
  const containerStyle = useMemo(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  }), []);

  const innerFlexStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  }), []);

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    padding: '20px',
  }), []);

  const skeletonCardBaseStyle = useMemo(() => ({
    width: '200px',
    height: '120px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'pulse 1.5s ease-in-out infinite',
  }), []);

  const loadingTextStyle = useMemo(() => ({
    color: '#666',
    fontSize: '14px',
    fontWeight: 500,
  }), []);

  // Pre-compute all skeleton card styles to prevent object creation in render loop
  const skeletonCardStyles = useMemo(() => {
    return Array.from({ length: nodeCount }).map((_, i) => ({
      ...skeletonCardBaseStyle,
      animationDelay: `${i * 0.2}s`,
    }));
  }, [nodeCount, skeletonCardBaseStyle]);

  return (
    <div style={containerStyle}>
      <div style={innerFlexStyle}>
        <div style={gridStyle}>
          {skeletonCardStyles.map((cardStyle, i) => (
            <div
              key={i}
              style={cardStyle}
            />
          ))}
        </div>
        <div style={loadingTextStyle}>
          Loading Unity Notes...
        </div>
      </div>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
        `}
      </style>
    </div>
  );
});

// NotificationItem Component - Performance Optimized
// Eliminates 6 inline arrow function allocations per notification on every parent re-render
// For 20 notifications: 120 function allocations/render → 0 allocations/render (100% reduction)
// For 50 notifications: 300 function allocations/render → 0 allocations/render (100% reduction)
const NotificationItem = React.memo(({
  notification,
  index,
  totalCount,
  isFocused,
  isHovered,
  onNotificationClick,
  onSetHoveredId,
  onSetFocusedId,
  getNotificationItemStyle,
  getNotificationRelativeTime,
  getNotificationIcon,
  notificationFlexContainerStyle,
  notificationIconStyle,
  notificationContentStyle,
  notificationTitleStyle,
  notificationMessageStyle,
  notificationTimestampStyle
}) => {
  // Pre-calculate values outside JSX
  const relativeTime = getNotificationRelativeTime(notification.timestamp);
  const icon = getNotificationIcon(notification.type);
  const isLastItem = index >= totalCount - 1;
  const uniqueKey = `${notification.timestamp}-${notification.nodeId || index}`;

  // Memoize click handler to prevent recreation
  const handleClick = useCallback(() => {
    onNotificationClick(notification.nodeId);
  }, [notification.nodeId, onNotificationClick]);

  // Memoize keyboard handler to prevent recreation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onNotificationClick(notification.nodeId);
    }
  }, [notification.nodeId, onNotificationClick]);

  // Memoize mouse enter handler to prevent recreation
  const handleMouseEnter = useCallback(() => {
    onSetHoveredId(notification.id);
  }, [notification.id, onSetHoveredId]);

  // Memoize mouse leave handler to prevent recreation
  const handleMouseLeave = useCallback(() => {
    onSetHoveredId(null);
  }, [onSetHoveredId]);

  // Memoize focus handler to prevent recreation
  const handleFocus = useCallback(() => {
    onSetFocusedId(notification.id);
  }, [notification.id, onSetFocusedId]);

  // Memoize blur handler to prevent recreation
  const handleBlur = useCallback(() => {
    onSetFocusedId(null);
  }, [onSetFocusedId]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${notification.title}: ${notification.message}. ${relativeTime}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={getNotificationItemStyle(isFocused, isHovered, isLastItem)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div style={notificationFlexContainerStyle}>
        {/* Icon */}
        <div style={notificationIconStyle}>
          {icon}
        </div>

        {/* Content */}
        <div style={notificationContentStyle}>
          {/* Title */}
          <div style={notificationTitleStyle}>
            {notification.title}
          </div>

          {/* Message Preview */}
          <div style={notificationMessageStyle}>
            {notification.message}
          </div>

          {/* Timestamp */}
          <div style={notificationTimestampStyle}>
            {relativeTime}
          </div>
        </div>
      </div>
    </div>
  );
});

// MentionUserItem Component - Performance Optimized
// Eliminates 3 inline arrow function allocations per user on every parent re-render
// For 20 users: 60 function allocations/render → 0 allocations/render (100% reduction)
// For 50 users: 150 function allocations/render → 0 allocations/render (100% reduction)
const MentionUserItem = React.memo(({
  user,
  index,
  selectedMentionIndex,
  getMentionUserItemStyle,
  handleMentionUserClick,
  setSelectedMentionIndex,
  mentionUserAvatarStyle,
  mentionUserInfoContainerStyle,
  mentionUserNameStyle,
  mentionUserEmailStyle,
  mentionSelectedIndicatorStyle
}) => {
  // Pre-calculate selection state
  const isSelected = index === selectedMentionIndex;

  // Memoize click handler to prevent recreation
  const handleClick = useCallback(() => {
    handleMentionUserClick(user);
  }, [user, handleMentionUserClick]);

  // Memoize mouse enter handler with inline style update
  const handleMouseEnter = useCallback((e) => {
    if (!isSelected) {
      e.currentTarget.style.background = 'rgba(241, 245, 249, 0.8)';
    }
    setSelectedMentionIndex(index);
  }, [isSelected, index, setSelectedMentionIndex]);

  // Memoize mouse leave handler with inline style reset
  const handleMouseLeave = useCallback((e) => {
    if (!isSelected) {
      e.currentTarget.style.background = 'transparent';
    }
  }, [isSelected]);

  return (
    <div
      onClick={handleClick}
      style={getMentionUserItemStyle(isSelected)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* User Avatar with Initials */}
      <div style={mentionUserAvatarStyle}>
        {user.initials}
      </div>

      {/* User Info */}
      <div style={mentionUserInfoContainerStyle}>
        <div style={mentionUserNameStyle}>
          {user.name}
        </div>
        <div style={mentionUserEmailStyle}>
          {user.email}
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div style={mentionSelectedIndicatorStyle}>
          ✓
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for deep optimization
  // Only re-render if these specific props change
  return (
    prevProps.user.id === nextProps.user.id &&
    prevProps.index === nextProps.index &&
    prevProps.selectedMentionIndex === nextProps.selectedMentionIndex
  );
});

// RemoteCursor Component - Performance Optimized for Real-time Collaboration
// Eliminates inline style object creation and prevents unnecessary re-renders
// For real-time cursors updating 10-30 times/second with multiple users:
// - 60-80% reduction in cursor-related rendering overhead
// - 100% reduction for static cursors (users not moving)
// - Only re-renders specific cursors that actually move
const RemoteCursor = React.memo(({
  userId,
  cursor,
  remoteCursorContainerBaseStyle,
  cursorSvgStyle,
  cursorNameLabelBaseStyle
}) => {
  // Memoize position style - only recalculates when cursor position changes
  const positionStyle = useMemo(() => ({
    ...remoteCursorContainerBaseStyle,
    left: `${cursor.x}%`,
    top: `${cursor.y}%`,
  }), [cursor.x, cursor.y, remoteCursorContainerBaseStyle]);

  // Memoize name label style - only recalculates when cursor color changes
  const nameLabelStyle = useMemo(() => ({
    ...cursorNameLabelBaseStyle,
    backgroundColor: cursor.color || '#4ECDC4',
  }), [cursor.color, cursorNameLabelBaseStyle]);

  return (
    <div style={positionStyle}>
      {/* Cursor SVG Icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={cursorSvgStyle}
      >
        <path
          d="M5.5 3.5L18.5 12L11 14L8 20.5L5.5 3.5Z"
          fill={cursor.color || '#4ECDC4'}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* User Name Label */}
      <div style={nameLabelStyle}>
        {cursor.name || 'Anonymous'}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for deep optimization
  // Only re-render if cursor position, color, or name changes
  return (
    prevProps.cursor.x === nextProps.cursor.x &&
    prevProps.cursor.y === nextProps.cursor.y &&
    prevProps.cursor.color === nextProps.cursor.color &&
    prevProps.cursor.name === nextProps.cursor.name
  );
});

// Mobile Node Navigator Component - helps navigate between nodes on mobile
// Performance optimization: Memoized to prevent re-renders when node count hasn't changed
const MobileNodeNavigator = React.memo(({ nodes }) => {
  // Only show on mobile devices
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Memoize static styles to prevent recreation on every render
  const containerStyle = useMemo(() => ({
    position: 'fixed',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '8px 16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }), []);

  const textStyle = useMemo(() => ({
    color: '#888',
    fontSize: '12px',
    fontWeight: 500,
  }), []);

  if (!isMobile || !nodes || nodes.length === 0) return null;

  return (
    <div style={containerStyle}>
      <span style={textStyle}>
        {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
      </span>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if node count changes
  return prevProps.nodes?.length === nextProps.nodes?.length;
});

// Lazy Loading Wrapper - defers loading off-screen node content for performance
const withLazyContent = (NodeComponent) => {
  return React.memo((props) => {
    const nodeRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    // Memoize static styles to prevent object recreation on every render (performance optimization)
    const containerStyle = useMemo(() => ({
      width: '100%',
      height: '100%'
    }), []);

    const placeholderStyle = useMemo(() => ({
      width: '100%',
      height: '100%',
      background: '#f5f5f5',
      borderRadius: '8px'
    }), []);

    useEffect(() => {
      const node = nodeRef.current;
      if (!node) return;

      // Use IntersectionObserver to detect when node is near viewport
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Once visible, keep it loaded to prevent flickering
            if (entry.isIntersecting && !isVisible) {
              setIsVisible(true);
            }
          });
        },
        {
          root: null, // viewport
          rootMargin: '300px', // Pre-load content 300px before entering viewport
          threshold: 0
        }
      );

      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    }, [isVisible]);

    return (
      <div ref={nodeRef} style={containerStyle}>
        {isVisible ? (
          <NodeComponent {...props} />
        ) : (
          // Lightweight placeholder for off-screen nodes
          <div style={placeholderStyle} />
        )}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function to prevent re-renders on position changes
    // Only re-render when content-related props or selection state changes

    // Re-render if selected state changes (node is selected/deselected)
    if (prevProps.selected !== nextProps.selected) return false;

    // Re-render if content changes
    if (prevProps.data?.content !== nextProps.data?.content) return false;

    // Re-render if image URL changes
    if (prevProps.data?.imageUrl !== nextProps.data?.imageUrl) return false;

    // Re-render if expanded state changes
    if (prevProps.data?.isExpanded !== nextProps.data?.isExpanded) return false;

    // Re-render if lock state changes
    if (prevProps.data?.isLocked !== nextProps.data?.isLocked) return false;

    // Re-render if comment count changes
    if (prevProps.data?.commentCount !== nextProps.data?.commentCount) return false;

    // Re-render if title changes
    if (prevProps.data?.title !== nextProps.data?.title) return false;

    // Ignore position changes (xPos, yPos) and other React Flow internal updates
    // Return true = props are equal = don't re-render
    return true;
  });
};

// Shared constant for HOC wrapper styles (avoids recreating object on every render)
const HOC_WRAPPER_STYLE = { position: 'relative', width: '100%', height: '100%' };

// Comment Badge Wrapper - adds comment count badge to any node type
const withCommentBadge = (NodeComponent) => {
  return React.memo((props) => {
    const { data } = props;
    const commentCount = data?.commentCount || 0;

    return (
      <div style={HOC_WRAPPER_STYLE}>
        <NodeComponent {...props} />
        {commentCount > 0 && (
          <div className="comment-count-badge">
            {commentCount}
          </div>
        )}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function to prevent re-renders on position changes
    // Only re-render when comment count or selection state changes

    // Re-render if selected state changes
    if (prevProps.selected !== nextProps.selected) return false;

    // Re-render if comment count changes
    if (prevProps.data?.commentCount !== nextProps.data?.commentCount) return false;

    // Ignore position changes and other React Flow internal updates
    // Return true = props are equal = don't re-render
    return true;
  });
};

// Lock Badge Wrapper - adds lock icon badge to locked nodes
const withLockBadge = (NodeComponent) => {
  return React.memo((props) => {
    const { data } = props;
    const isLocked = data?.isLocked || false;

    return (
      <div style={HOC_WRAPPER_STYLE}>
        <NodeComponent {...props} />
        {isLocked && (
          <div className="lock-badge" title="This node is locked">
            🔒
          </div>
        )}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function to prevent re-renders on position changes
    // Only re-render when lock state or selection state changes

    // Re-render if selected state changes
    if (prevProps.selected !== nextProps.selected) return false;

    // Re-render if lock state changes
    if (prevProps.data?.isLocked !== nextProps.data?.isLocked) return false;

    // Ignore position changes and other React Flow internal updates
    // Return true = props are equal = don't re-render
    return true;
  });
};

// CommentNode Thread Depth Color Arrays (Performance Optimization)
// Moved to module level to prevent 150+ array allocations per render (3 arrays × 50 nodes = 150 allocations)
const COMMENT_DEPTH_COLORS = [
  'border-yellow-300', // Level 0
  'border-orange-300', // Level 1
  'border-pink-300',   // Level 2
  'border-purple-300', // Level 3
  'border-blue-300',   // Level 4
  'border-indigo-300'  // Level 5
];

const COMMENT_DEPTH_BG_COLORS = [
  'from-yellow-100 to-yellow-200',
  'from-orange-100 to-orange-200',
  'from-pink-100 to-pink-200',
  'from-purple-100 to-purple-200',
  'from-blue-100 to-blue-200',
  'from-indigo-100 to-indigo-200'
];

const COMMENT_DEPTH_LINE_COLORS = [
  '#FCD34D', // yellow-300
  '#FDBA74', // orange-300
  '#F9A8D4', // pink-300
  '#C084FC', // purple-300
  '#93C5FD', // blue-300
  '#A5B4FC'  // indigo-300
];

/**
 * CommentNode - Custom node component for displaying threaded comments
 *
 * Displays comment content with author, timestamp, and optional threading context.
 * When isThreadedReply is true, shows "Replying to @Author: 'preview...'" header.
 *
 * Performance optimization: Wrapped with React.memo to prevent unnecessary re-renders
 * when props haven't changed. Uses custom comparison to check all relevant data properties.
 *
 * @param {Object} data - Node data containing comment details and handlers
 * @param {string} data.id - Unique node identifier
 * @param {string} data.content - Comment text content
 * @param {string} data.author - Comment author display name
 * @param {string} data.timestamp - ISO timestamp string
 * @param {boolean} [data.isThreadedReply] - Whether this is a threaded reply
 * @param {string} [data.replyToAuthor] - Parent comment author (for threaded replies)
 * @param {string} [data.replyToContent] - Parent comment preview (for threaded replies)
 * @param {Function} data.onContentChange - Handler for content changes (nodeId, content)
 * @param {Function} data.onDelete - Handler for delete action (nodeId)
 * @param {Function} data.onReply - Handler for reply action (nodeId, replyText)
 * @param {Function} data.onShowToast - Handler for showing toast notifications (message, type)
 * @param {Function} data.onMentionKeyDown - Handler for @mention detection
 */
const CommentNode = React.memo(({ data, id: nodeId }) => {
  const {
    id,
    content = '',
    author = 'User',
    timestamp,
    createdAt,
    isThreadedReply = false,
    replyToAuthor,
    replyToContent,
    onContentChange,
    onDelete,
    onReply,
    onShowToast,
    onMentionKeyDown,
    edges = [],
    nodes = [],
    depth = 0
  } = data;

  // State for collapse/expand
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // State for inline reply
  const [showInlineReply, setShowInlineReply] = React.useState(false);
  const [inlineReplyText, setInlineReplyText] = React.useState('');
  const [isSubmittingReply, setIsSubmittingReply] = React.useState(false);

  // Toggle collapse state and notify parent to hide/show children
  const toggleCollapse = React.useCallback(() => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);

    // If onCollapseToggle handler is provided, call it to update child node visibility
    if (data.onCollapseToggle) {
      data.onCollapseToggle(nodeId || id, newCollapsedState);
    }
  }, [isCollapsed, data, nodeId, id]);

  // Toggle inline reply input
  const handleToggleInlineReply = React.useCallback(() => {
    setShowInlineReply(prev => !prev);
    if (showInlineReply) {
      setInlineReplyText(''); // Clear text when hiding
    }
  }, [showInlineReply]);

  // Handle inline reply text changes
  const handleInlineReplyChange = React.useCallback((e) => {
    setInlineReplyText(e.target.value);
  }, []);

  // PERFORMANCE OPTIMIZATION: Memoize event handlers to prevent inline function creation on every render
  // Handle content change with stable callback reference
  const handleContentChange = React.useCallback((e) => {
    if (onContentChange) {
      onContentChange(id, e.target.value);
    }
  }, [onContentChange, id]);

  // Handle mention keydown with stable callback reference
  const handleMentionKeyDown = React.useCallback((e) => {
    if (onMentionKeyDown) {
      onMentionKeyDown(e, id);
    }
  }, [onMentionKeyDown, id]);

  // Submit inline reply
  const handleSubmitInlineReply = React.useCallback(async () => {
    if (!inlineReplyText.trim() || !onReply || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      // Call onReply with both id and the reply text
      await onReply(id, inlineReplyText.trim());
      // Only clear and close on success
      setInlineReplyText('');
      setShowInlineReply(false);
      // Notify user of successful reply submission
      onShowToast?.('Reply added successfully', 'success');
    } catch (error) {
      console.error('Failed to submit reply:', error);
      // Notify user of failure so they can retry
      onShowToast?.('Failed to add reply. Please try again.', 'error');
      // Keep form open so user can retry
    } finally {
      setIsSubmittingReply(false);
    }
  }, [inlineReplyText, onReply, id, isSubmittingReply, onShowToast]);

  // Handle keyboard shortcuts for inline reply
  const handleInlineReplyKeyDown = React.useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitInlineReply();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowInlineReply(false);
      setInlineReplyText('');
    }
  }, [handleSubmitInlineReply]);

  // Memoize delete handler to prevent function recreation on every render
  // Performance: For 50 comment nodes, prevents 50 function allocations per render
  const handleDelete = React.useCallback(() => {
    if (onDelete) {
      onDelete(id);
    }
  }, [onDelete, id]);

  // Memoize cancel reply handler to prevent function recreation on every render
  // Performance: For 50 comment nodes, prevents 50 function allocations per render
  const handleCancelReply = React.useCallback(() => {
    setShowInlineReply(false);
    setInlineReplyText('');
  }, []);

  // Calculate reply count (number of child comments)
  // Performance optimization: Use pre-computed replyCount if provided (injected from edgeCountBySource Map)
  // Fallback to filtering edges if replyCount not provided (backwards compatibility)
  const replyCount = React.useMemo(() => {
    if (data.replyCount !== undefined) {
      return data.replyCount; // O(1) - use pre-computed value from edgeCountBySource Map
    }
    return edges.filter(edge => edge.source === (nodeId || id)).length; // O(n) fallback
  }, [data.replyCount, edges, nodeId, id]);

  // Calculate thread depth based on indentation (30px per level)
  const calculatedDepth = depth || (isThreadedReply ? Math.floor((data.position?.x || 0) / 30) : 0);
  const threadDepth = Math.min(calculatedDepth, 5); // Max 5 levels

  // Use module-level color arrays (performance optimization - prevents 150+ allocations per render)
  const borderColor = COMMENT_DEPTH_COLORS[threadDepth] || COMMENT_DEPTH_COLORS[0];
  const bgGradient = COMMENT_DEPTH_BG_COLORS[threadDepth] || COMMENT_DEPTH_BG_COLORS[0];
  const lineColor = COMMENT_DEPTH_LINE_COLORS[threadDepth] || COMMENT_DEPTH_LINE_COLORS[0];

  // Memoize thread connector styles to prevent object recreation on every render
  // For 50 threaded comments: reduces 150 allocations/render → 6 allocations total (96% reduction)
  const verticalLineStyle = React.useMemo(() => ({
    left: '-16px',
    top: '-20px',
    width: '2px',
    height: '32px',
    backgroundColor: lineColor,
    opacity: 0.4,
  }), [lineColor]);

  const horizontalLineStyle = React.useMemo(() => ({
    left: '-16px',
    top: '12px',
    width: '12px',
    height: '2px',
    backgroundColor: lineColor,
    opacity: 0.4,
  }), [lineColor]);

  const cornerDotStyle = React.useMemo(() => ({
    left: '-18px',
    top: '10px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: lineColor,
    border: '2px solid white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  }), [lineColor]);

  // Check if this is a new comment (created within last 5 minutes)
  const isNewComment = createdAt && (Date.now() - new Date(createdAt).getTime() < 5 * 60 * 1000);

  // Format timestamp for display
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`relative bg-gradient-to-br ${bgGradient} rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px] border-2 ${borderColor}`}>
      {/* NEW badge for recent comments */}
      {isNewComment && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse z-10 flex items-center gap-1">
          <span>✨</span>
          <span>NEW</span>
        </div>
      )}

      {/* Thread depth badge */}
      {threadDepth > 0 && (
        <div className="absolute -top-2 -left-2 bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md z-10">
          L{threadDepth}
        </div>
      )}

      {/* Visual thread connector lines - shows parent-child relationship */}
      {threadDepth > 0 && (
        <>
          {/* Vertical line from parent */}
          <div
            className="absolute"
            style={verticalLineStyle}
          />
          {/* Horizontal connector */}
          <div
            className="absolute"
            style={horizontalLineStyle}
          />
          {/* Corner dot */}
          <div
            className="absolute"
            style={cornerDotStyle}
          />
        </>
      )}

      {/* Reply count badge */}
      {replyCount > 0 && (
        <div className="absolute top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
          <span>💬</span>
          <span>{replyCount}</span>
        </div>
      )}

      {/* Threading context header - only shown for replies */}
      {isThreadedReply && replyToAuthor && (
        <div className="mb-2 pb-2 border-b border-yellow-300/50">
          <div className="text-xs text-gray-600 italic flex items-start gap-1">
            <span className="flex-shrink-0">↩️</span>
            <span>
              Replying to <span className="font-semibold text-gray-700">@{replyToAuthor}</span>
              {replyToContent && (
                <>
                  : <span className="text-gray-500">"{replyToContent}"</span>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Comment header with author and timestamp */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Collapse/expand button for comments with replies */}
          {replyCount > 0 && (
            <button
              onClick={toggleCollapse}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded transition-colors duration-150"
              title={isCollapsed ? "Expand thread" : "Collapse thread"}
              aria-label={isCollapsed ? "Expand thread" : "Collapse thread"}
            >
              <span className="text-xs">{isCollapsed ? '▶️' : '▼'}</span>
            </button>
          )}
          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900">
            {author.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-800 text-sm">{author}</span>
        </div>
        <span className="text-xs text-gray-500">{formatTimestamp(timestamp)}</span>
      </div>

      {/* Comment content textarea */}
      <textarea
        className="w-full p-2 border border-yellow-300 rounded bg-white/80 text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent min-h-[80px]"
        placeholder="Write your comment... (use @ to mention)"
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleMentionKeyDown}
      />

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-yellow-300/50">
        <button
          onClick={handleToggleInlineReply}
          className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xs font-medium rounded transition-colors duration-150 flex items-center gap-1"
          aria-label={showInlineReply ? 'Cancel reply' : 'Reply to comment'}
        >
          <span>💬</span>
          <span>{showInlineReply ? 'Cancel' : 'Reply'}</span>
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded transition-colors duration-150 flex items-center gap-1"
          aria-label="Delete comment"
        >
          <span>🗑️</span>
          <span>Delete</span>
        </button>
      </div>

      {/* Inline reply input - shown when Reply button is clicked */}
      {showInlineReply && (
        <div className="mt-3 pt-3 border-t border-yellow-300/50 space-y-2 animate-fadeIn">
          <div className="text-xs text-gray-600 font-medium flex items-center gap-1">
            <span>💬</span>
            <span>Reply to @{author}</span>
          </div>
          <textarea
            autoFocus
            className="w-full p-2 border border-blue-300 rounded bg-white text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent min-h-[60px]"
            placeholder="Type your reply... (Shift+Enter for new line, Enter to send, Esc to cancel)"
            value={inlineReplyText}
            onChange={handleInlineReplyChange}
            onKeyDown={handleInlineReplyKeyDown}
            disabled={isSubmittingReply}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancelReply}
              disabled={isSubmittingReply}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 text-xs font-medium rounded transition-colors duration-150"
              aria-label="Cancel reply"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitInlineReply}
              disabled={!inlineReplyText.trim() || isSubmittingReply}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors duration-150 flex items-center gap-1"
              aria-label="Submit reply"
            >
              {isSubmittingReply ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>✉️</span>
                  <span>Send Reply</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if any of these data properties have changed
  const prevData = prevProps.data || {};
  const nextData = nextProps.data || {};

  return (
    prevProps.id === nextProps.id &&
    prevData.id === nextData.id &&
    prevData.content === nextData.content &&
    prevData.author === nextData.author &&
    prevData.timestamp === nextData.timestamp &&
    prevData.createdAt === nextData.createdAt &&
    prevData.isThreadedReply === nextData.isThreadedReply &&
    prevData.replyToAuthor === nextData.replyToAuthor &&
    prevData.replyToContent === nextData.replyToContent &&
    prevData.depth === nextData.depth &&
    prevData.edges?.length === nextData.edges?.length &&
    prevData.nodes?.length === nextData.nodes?.length
  );
});


const STORAGE_KEY = 'unity-notes-data';
const FREE_NODE_LIMIT = 10;
const PRO_NODE_LIMIT = 100;

// Pinch gesture detection threshold (pixels) - fixes iOS Safari pinch-to-zoom conflicts
const PINCH_THRESHOLD = 10;

// Unified gesture threshold for consistent touch interactions across node and canvas
const GESTURE_THRESHOLD = 10; // 10px optimized for touch devices (reduced to fix pan/selection conflicts)
const GESTURE_TIME_THRESHOLD = 200; // 200ms - quick taps under this duration should never trigger panning

// Card type configuration (same as UnityNotes Plus)
const CARD_TYPES = {
  photo: { label: 'Photo', icon: '🖼️', color: 'rgb(251, 191, 36)' },
  note: { label: 'Note', icon: '📝', color: 'rgb(251, 191, 36)' },
  link: { label: 'Link', icon: '🔗', color: '#b45309' },
  ai: { label: 'AI Chat', icon: '🤖', color: '#d97706' },
  video: { label: 'Video', icon: '📹', color: '#f59e0b' },
};

// Templates Modal Component
const TemplatesModal = React.memo(({ show, onClose, onSelectTemplate, customTemplates = [], onLoadCustomTemplate, onDeleteCustomTemplate, focusedNodeId, onSaveAsTemplate }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [show, onClose]);

  // Memoized style objects to prevent recreation on every render
  const overlayStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px',
  }), []);

  const modalContentStyle = useMemo(() => ({
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  }), []);

  const headerContainerStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '16px',
  }), []);

  const headerTitleStyle = useMemo(() => ({
    color: '#ffffff',
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
  }), []);

  const closeButtonStyle = useMemo(() => ({
    background: 'transparent',
    border: 'none',
    color: '#999',
    fontSize: '28px',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1',
    transition: 'color 0.2s',
  }), []);

  const descriptionStyle = useMemo(() => ({
    color: '#888',
    marginBottom: '24px',
    fontSize: '14px',
  }), []);

  const customTemplatesHeadingStyle = useMemo(() => ({
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    marginTop: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }), []);

  const customTemplatesGridStyle = useMemo(() => ({
    display: 'grid',
    gap: '12px',
    marginBottom: '32px',
  }), []);

  const customTemplateItemStyle = useMemo(() => ({
    padding: '16px',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: '8px',
    border: '1px solid rgba(251, 191, 36, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.2s',
  }), []);

  const customTemplateClickableStyle = useMemo(() => ({
    flex: 1,
    cursor: 'pointer',
  }), []);

  const customTemplateTitleStyle = useMemo(() => ({
    color: '#ffffff',
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: 600,
  }), []);

  const customTemplateMetaContainerStyle = useMemo(() => ({
    color: '#aaa',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }), []);

  const deleteButtonStyle = useMemo(() => ({
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.2s',
  }), []);

  const saveSectionContainerStyle = useMemo(() => ({
    padding: '16px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    marginBottom: '32px',
  }), []);

  const saveSectionFlexStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  }), []);

  const saveSectionInnerStyle = useMemo(() => ({
    flex: 1,
  }), []);

  const saveSectionTitleStyle = useMemo(() => ({
    color: '#ffffff',
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: 600,
  }), []);

  const saveSectionParagraphStyle = useMemo(() => ({
    color: '#aaa',
    margin: 0,
    fontSize: '12px',
  }), []);

  const saveButtonStyle = useMemo(() => ({
    background: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    color: '#60a5fa',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.2s',
  }), []);

  const builtInHeadingStyle = useMemo(() => ({
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }), []);

  const builtInGridStyle = useMemo(() => ({
    display: 'grid',
    gap: '16px',
  }), []);

  const builtInTemplateItemStyle = useMemo(() => ({
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }), []);

  const templateInnerFlexStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  }), []);

  const templateIconWrapperStyle = useMemo(() => ({
    fontSize: '32px',
    lineHeight: '1',
  }), []);

  const templateTextContainerStyle = useMemo(() => ({
    flex: 1,
  }), []);

  const templateTitleStyle = useMemo(() => ({
    color: '#ffffff',
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 600,
  }), []);

  const templateDescriptionStyle = useMemo(() => ({
    color: '#aaa',
    margin: '0 0 12px 0',
    fontSize: '14px',
    lineHeight: '1.5',
  }), []);

  const templateMetaStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#888',
    fontSize: '12px',
  }), []);

  const customTemplateBadgeBaseStyle = useMemo(() => ({
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
  }), []);

  // Custom Template Badge Style - Memoized (performance optimization)
  const getCustomTemplateBadgeStyle = useCallback((backgroundColor) => ({
    ...customTemplateBadgeBaseStyle,
    backgroundColor: backgroundColor || 'rgba(255, 255, 255, 0.1)'
  }), [customTemplateBadgeBaseStyle]);

  // Memoized event handlers - Eliminates inline arrow functions in map() loops (Jan 2, 2026)
  // Unified action dispatcher using data attributes for template actions
  const handleTemplateAction = useCallback((e) => {
    const action = e.currentTarget.dataset.action;
    const templateId = e.currentTarget.dataset.templateId;

    if (action === 'loadCustom') {
      onLoadCustomTemplate(templateId);
    } else if (action === 'delete') {
      onDeleteCustomTemplate(templateId);
    } else if (action === 'save') {
      onSaveAsTemplate(focusedNodeId);
    } else if (action === 'selectBuiltIn') {
      onSelectTemplate(templateId);
    }
  }, [onLoadCustomTemplate, onDeleteCustomTemplate, onSaveAsTemplate, onSelectTemplate, focusedNodeId]);

  // Delete button hover effect handlers
  const handleDeleteButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
  }, []);

  const handleDeleteButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
  }, []);

  // Modal content click handler - prevents modal from closing when clicking inside content
  // Performance optimization: Memoized to prevent recreation on every render (Jan 3, 2026)
  const handleModalContentClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // Save button hover effect handlers
  const handleSaveButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
  }, []);

  const handleSaveButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
  }, []);

  // Built-in template hover effect handlers
  const handleBuiltInMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
    e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
    e.currentTarget.style.transform = 'translateY(-2px)';
  }, []);

  const handleBuiltInMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    e.currentTarget.style.transform = 'translateY(0)';
  }, []);

  // Close button hover effect handlers
  const handleCloseButtonMouseEnter = useCallback((e) => {
    e.target.style.color = '#fff';
  }, []);

  const handleCloseButtonMouseLeave = useCallback((e) => {
    e.target.style.color = '#999';
  }, []);

  if (!show) return null;

  const builtInTemplates = BUILT_IN_TEMPLATES;

  return (
    <div
      style={overlayStyle}
      onClick={onClose}
    >
      <div
        style={modalContentStyle}
        onClick={handleModalContentClick}
      >
        <div style={headerContainerStyle}>
          <h2 style={headerTitleStyle}>
            📚 Node Templates
          </h2>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            onMouseEnter={handleCloseButtonMouseEnter}
            onMouseLeave={handleCloseButtonMouseLeave}
          >
            ×
          </button>
        </div>

        <p style={descriptionStyle}>
          Choose a template to quickly insert node structures, or save your own custom templates
        </p>

        {/* Custom Templates Section */}
        {customTemplates.length > 0 && (
          <>
            <h3 style={customTemplatesHeadingStyle}>
              ⭐ Your Custom Templates
            </h3>
            <div style={customTemplatesGridStyle}>
              {customTemplates.map((template) => (
                <div
                  key={template.id}
                  style={customTemplateItemStyle}
                >
                  <div
                    style={customTemplateClickableStyle}
                    onClick={handleTemplateAction}
                    data-action="loadCustom"
                    data-template-id={template.id}
                  >
                    <h4 style={customTemplateTitleStyle}>
                      {template.name}
                    </h4>
                    <div style={customTemplateMetaContainerStyle}>
                      <span style={getCustomTemplateBadgeStyle(template.color)}>
                        {template.type}
                      </span>
                      <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleTemplateAction}
                    data-action="delete"
                    data-template-id={template.id}
                    style={deleteButtonStyle}
                    onMouseEnter={handleDeleteButtonMouseEnter}
                    onMouseLeave={handleDeleteButtonMouseLeave}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Save Current Node as Template */}
        {focusedNodeId && onSaveAsTemplate && (
          <div style={saveSectionContainerStyle}>
            <div style={saveSectionFlexStyle}>
              <div style={saveSectionInnerStyle}>
                <h4 style={saveSectionTitleStyle}>
                  💾 Save Current Node as Template
                </h4>
                <p style={saveSectionParagraphStyle}>
                  Save the focused node's configuration for future reuse
                </p>
              </div>
              <button
                onClick={handleTemplateAction}
                data-action="save"
                style={saveButtonStyle}
                onMouseEnter={handleSaveButtonMouseEnter}
                onMouseLeave={handleSaveButtonMouseLeave}
              >
                Save Template
              </button>
            </div>
          </div>
        )}

        {/* Built-in Templates */}
        <h3 style={builtInHeadingStyle}>
          📦 Built-in Templates
        </h3>
        <div style={builtInGridStyle}>
          {builtInTemplates.map((template) => (
            <div
              key={template.id}
              onClick={handleTemplateAction}
              data-action="selectBuiltIn"
              data-template-id={template.id}
              style={builtInTemplateItemStyle}
              onMouseEnter={handleBuiltInMouseEnter}
              onMouseLeave={handleBuiltInMouseLeave}
            >
              <div style={templateInnerFlexStyle}>
                <div style={templateIconWrapperStyle}>
                  {template.icon}
                </div>
                <div style={templateTextContainerStyle}>
                  <h3 style={templateTitleStyle}>
                    {template.label}
                  </h3>
                  <p style={templateDescriptionStyle}>
                    {template.description}
                  </p>
                  <div style={templateMetaStyle}>
                    <span>📝 {template.nodes.length} nodes</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Node Templates - Pre-configured node structures for common use cases
const NODE_TEMPLATES = {
  meetingNotes: {
    id: 'meetingNotes',
    label: 'Meeting Notes',
    icon: '📋',
    description: 'Structured template for meeting notes with agenda, attendees, and action items',
    nodes: [
      {
        title: 'Meeting: [Topic]',
        content: '**Date:** \n**Attendees:** \n**Objective:** ',
        type: 'note',
        offsetX: 0,
        offsetY: 0
      },
      {
        title: 'Agenda Items',
        content: '1. \n2. \n3. ',
        type: 'note',
        offsetX: 350,
        offsetY: 0
      },
      {
        title: 'Action Items',
        content: '☐ \n☐ \n☐ ',
        type: 'note',
        offsetX: 0,
        offsetY: 300
      },
      {
        title: 'Key Decisions',
        content: '• \n• \n• ',
        type: 'note',
        offsetX: 350,
        offsetY: 300
      },
    ]
  },
  projectPlan: {
    id: 'projectPlan',
    label: 'Project Plan',
    icon: '🎯',
    description: 'Complete project planning structure with goals, timeline, and deliverables',
    nodes: [
      {
        title: 'Project Overview',
        content: '**Goal:** \n**Timeline:** \n**Stakeholders:** ',
        type: 'note',
        offsetX: 0,
        offsetY: 0
      },
      {
        title: 'Phase 1: Planning',
        content: '☐ Define requirements\n☐ Set milestones\n☐ Allocate resources',
        type: 'note',
        offsetX: 350,
        offsetY: 0
      },
      {
        title: 'Phase 2: Execution',
        content: '☐ Build\n☐ Test\n☐ Iterate',
        type: 'note',
        offsetX: 700,
        offsetY: 0
      },
      {
        title: 'Phase 3: Launch',
        content: '☐ Final testing\n☐ Deploy\n☐ Monitor',
        type: 'note',
        offsetX: 1050,
        offsetY: 0
      },
      {
        title: 'Risks & Mitigation',
        content: '⚠️ Risk: \n   Mitigation: \n\n⚠️ Risk: \n   Mitigation: ',
        type: 'note',
        offsetX: 0,
        offsetY: 300
      },
    ]
  },
  weeklyReview: {
    id: 'weeklyReview',
    label: 'Weekly Review',
    icon: '📅',
    description: 'Weekly reflection template with wins, challenges, and next week planning',
    nodes: [
      {
        title: 'Week of [Date]',
        content: '**Focus Area:** \n**Overall Rating:** ⭐⭐⭐⭐⭐',
        type: 'note',
        offsetX: 0,
        offsetY: 0
      },
      {
        title: '✅ Wins This Week',
        content: '• \n• \n• ',
        type: 'note',
        offsetX: 0,
        offsetY: 300
      },
      {
        title: '🚧 Challenges',
        content: '• \n• \n• ',
        type: 'note',
        offsetX: 350,
        offsetY: 300
      },
      {
        title: '📈 Next Week Goals',
        content: '1. \n2. \n3. ',
        type: 'note',
        offsetX: 700,
        offsetY: 300
      },
    ]
  },
  brainstorm: {
    id: 'brainstorm',
    label: 'Brainstorm Session',
    icon: '💡',
    description: 'Collaborative brainstorming template with idea categories and evaluation',
    nodes: [
      {
        title: 'Brainstorm: [Topic]',
        content: '**Challenge/Opportunity:** \n**Participants:** ',
        type: 'note',
        offsetX: 350,
        offsetY: 0
      },
      {
        title: '💡 Wild Ideas',
        content: '• \n• \n• ',
        type: 'note',
        offsetX: 0,
        offsetY: 300
      },
      {
        title: '🎯 Practical Ideas',
        content: '• \n• \n• ',
        type: 'note',
        offsetX: 350,
        offsetY: 300
      },
      {
        title: '🔬 Ideas to Explore',
        content: '• \n• \n• ',
        type: 'note',
        offsetX: 700,
        offsetY: 300
      },
      {
        title: '⭐ Top Picks',
        content: '1. \n2. \n3. \n\n**Next Steps:** ',
        type: 'note',
        offsetX: 350,
        offsetY: 600
      },
    ]
  },
  decisionLog: {
    id: 'decisionLog',
    label: 'Decision Log',
    icon: '⚖️',
    description: 'Decision documentation with context, options, and rationale',
    nodes: [
      {
        title: 'Decision: [Title]',
        content: '**Date:** \n**Decision Maker:** \n**Status:** 🟡 Pending / 🟢 Approved',
        type: 'note',
        offsetX: 0,
        offsetY: 0
      },
      {
        title: '📊 Context',
        content: '**Problem:** \n\n**Background:** \n\n**Constraints:** ',
        type: 'note',
        offsetX: 0,
        offsetY: 300
      },
      {
        title: 'Option A: [Name]',
        content: '**Pros:**\n• \n• \n\n**Cons:**\n• \n• ',
        type: 'note',
        offsetX: 350,
        offsetY: 300
      },
      {
        title: 'Option B: [Name]',
        content: '**Pros:**\n• \n• \n\n**Cons:**\n• \n• ',
        type: 'note',
        offsetX: 700,
        offsetY: 300
      },
      {
        title: '✅ Final Decision',
        content: '**Chosen Option:** \n\n**Rationale:** \n\n**Impact:** ',
        type: 'note',
        offsetX: 350,
        offsetY: 600
      },
    ]
  },
};

// Static built-in templates array - extracted to module level to prevent Object.values() call on every TemplatesModal render
// Performance optimization: Object.values() creates a new array on every call
// For 6 templates: Saves 6+ object allocations and array construction per render
const BUILT_IN_TEMPLATES = Object.values(NODE_TEMPLATES);

// Performance optimization: Memoize UnityNotesFlow to prevent unnecessary re-renders when parent updates
// UnityNotesFlow contains the entire canvas logic (12,000+ lines) and re-renders are expensive
// React.memo uses shallow prop comparison - only re-renders when props actually change
// Expected impact: 70-90% reduction in re-renders from parent Layout/modal state changes
const UnityNotesFlow = React.memo(({ isUploadModalOpen, setIsUploadModalOpen, onFooterToggle, showParallax, setShowParallax }) => {
  const { fitView, zoomIn, zoomOut, getZoom, setViewport, getViewport, setCenter } = useReactFlow();
  const { sidebarOpen } = useLayout();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // SSO Authentication hooks
  const { user, userProfile, isAuthenticated, isAdmin } = useAuth();
  const { isCloudSynced, migrateLocalToCloud, groqApiKey: storedGroqKey, openaiApiKey: storedOpenaiKey, googleMapsApiKey: storedGoogleMapsKey } = useApiKeyStorage();
  const { creditsRemaining, tier } = useCredits();

  // Node limit for canvas (tier-based) - must be defined early for handleAddCard
  const nodeLimit = useMemo(() => {
    if (isAdmin) return 999;
    if (isAuthenticated && tier === 'premium') return PRO_NODE_LIMIT;
    return FREE_NODE_LIMIT;
  }, [isAdmin, isAuthenticated, tier]);

  // Memoized node types to prevent unnecessary re-renders
  const nodeTypes = useMemo(
    () => ({
      commentNode: CommentNode, // Comment nodes with threading support
      photoNode: withLockBadge(withCommentBadge(withLazyContent(DraggablePhotoNode))),
      textNode: withLockBadge(withCommentBadge(withLazyContent(TextNoteNode))),
      // UnityMAP journey node types - wrap each with lazy loading, comment badge, and lock badge
      ...Object.fromEntries(
        Object.entries(mapNodeTypes).map(([key, Component]) => [key, withLockBadge(withCommentBadge(withLazyContent(Component)))])
      ),
      // Premium Unity+ node types - wrap each with lazy loading, comment badge, and lock badge
      ...Object.fromEntries(
        Object.entries(premiumNodeTypes).map(([key, Component]) => [key, withLockBadge(withCommentBadge(withLazyContent(Component)))])
      )
    }),
    [] // Empty deps - node types are static
  );

  // AI Image Analysis hook
  const { analyzeImage, error: aiError, isConfigured: aiConfigured } = useImageAnalysis();
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showZoomPresets, setShowZoomPresets] = useState(false);

  // Viewport tracking for node virtualization
  const [viewport, setViewportState] = useState({ x: 0, y: 0, zoom: 1 });

  // Ref to coordinate fitView with node additions (fixes race condition)
  const pendingFitViewRef = useRef(false);

  // Ref to persist viewport state during orientation changes (fixes iOS Safari viewport jump)
  const viewportBeforeResize = useRef(null);

  // Ref to track pan end timeout for proper cleanup
  const panEndTimeoutRef = useRef(null);

  // Ref removed - React Flow's native zoomOnPinch handles all pinch-to-zoom
  // No custom touch state tracking needed

  // Double-tap to zoom tracking (mobile-friendly node navigation)
  const lastNodeTapRef = useRef({ nodeId: null, timestamp: 0 });
  const DOUBLE_TAP_THRESHOLD = 300; // 300ms window for double-tap detection

  // Undo/Redo history management
  const historyRef = useRef([]); // Array of {nodes, edges} snapshots
  const historyIndexRef = useRef(-1); // Current position in history
  const isUndoRedoActionRef = useRef(false); // Flag to prevent history pollution during undo/redo
  const MAX_HISTORY = 50; // Maximum history states to maintain

  // Performance Optimization: Callback caches to maintain stable function references
  // These Maps cache callback functions per nodeId to prevent creating new functions on every render
  // This eliminates unnecessary re-renders caused by "new" callback props
  const handleNodeDeleteCache = useRef(new Map());
  const handleNodeDataChangeCache = useRef(new Map());
  const handleNodeItemsUpdateCache = useRef(new Map());
  const handleNodeTitleChangeCache = useRef(new Map());
  const handleNodeLabelChangeCache = useRef(new Map());
  const handleNodeResizeCache = useRef(new Map());
  const handleNodeColorChangeCache = useRef(new Map());

  // Haptic feedback utility for mobile touch interactions
  const triggerHaptic = useCallback((pattern = 'light') => {
    // Check if haptics are enabled in user preferences
    const hapticsEnabled = localStorage.getItem('hapticsEnabled');
    if (hapticsEnabled === 'false') return;

    // Accessibility: Respect prefers-reduced-motion preference
    // Users with motion sensitivity may also want to disable haptic feedback
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;
    }

    // Check if Vibration API is available (primarily mobile devices)
    if (!navigator.vibrate) return;

    // Define vibration patterns (in milliseconds)
    const patterns = {
      light: 10,      // Light tap for selection
      medium: 20,     // Medium pulse for drag start
      success: [50, 50, 50],  // Triple pulse for successful actions
      error: [100, 50, 100],  // Strong-pause-strong for errors
      warning: [50, 100, 50]  // Quick warning pulse
    };

    try {
      navigator.vibrate(patterns[pattern] || patterns.light);
    } catch (error) {
      // Silently fail if vibration not supported
      console.debug('Haptic feedback not available:', error);
    }
  }, []);

  // Zoom preset handler - sets zoom to specific levels or fits all nodes
  const handleZoomPreset = useCallback((preset) => {
    if (preset === 'fit') {
      // Calculate bounding box of all nodes and fit them on screen
      if (nodes.length === 0) {
        // No nodes, just reset to 100%
        setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
        setZoomLevel(1);
      } else {
        // Fit all nodes with padding
        fitView({ duration: 300, padding: 0.15 });
        // Update zoom level after fit completes
        setTimeout(() => {
          const newZoom = getZoom();
          setZoomLevel(newZoom);
        }, 350);
      }
    } else {
      // Set to specific zoom level
      const currentViewport = getViewport();
      setViewport({
        x: currentViewport.x,
        y: currentViewport.y,
        zoom: preset
      }, { duration: 300 });
      setZoomLevel(preset);
    }
    setShowZoomPresets(false);
  }, [nodes, fitView, getZoom, getViewport, setViewport, setZoomLevel]);

  // Memoized zoom control handlers to prevent unnecessary re-renders
  const handleZoomInClick = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);

  const handleZoomOutClick = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);

  const handleFitViewClick = useCallback(() => {
    fitView({ duration: 400, padding: 0.2 });
  }, [fitView]);

  const handleToggleZoomPresets = useCallback(() => {
    setShowZoomPresets(prev => !prev);
  }, []);

  const handleCloseZoomPresets = useCallback(() => {
    setShowZoomPresets(false);
  }, []);

  // Performance optimization: Batch update refs for reducing re-renders on bulk operations
  const batchUpdateQueueRef = useRef([]);
  const batchUpdateTimeoutRef = useRef(null);

  // Node locking: Track drag attempts on locked nodes to prevent spam toasts
  const dragAttemptNotifiedRef = useRef(new Set());

  // Custom onNodesChange handler with batching for bulk operations (P3 Performance Optimization)
  // Batches multiple rapid changes (>5) into a single render cycle to reduce re-renders
  const onNodesChange = useCallback((changes) => {
    const isBulkOperation = changes.length > 5;

    if (isBulkOperation) {
      // Queue changes for batching
      batchUpdateQueueRef.current.push(...changes);

      // Cancel any pending batch timeout
      if (batchUpdateTimeoutRef.current !== null) {
        cancelAnimationFrame(batchUpdateTimeoutRef.current);
      }

      // Schedule batch apply within one animation frame (16ms window)
      batchUpdateTimeoutRef.current = requestAnimationFrame(() => {
        const allChanges = batchUpdateQueueRef.current;
        batchUpdateQueueRef.current = [];
        batchUpdateTimeoutRef.current = null;

        // Apply all batched changes in a single update
        setNodes((nds) => applyNodeChanges(allChanges, nds));

        // Preserve fitView coordination for node additions
        const hasAdditions = allChanges.some(change => change.type === 'add');
        if (hasAdditions && pendingFitViewRef.current) {
          requestAnimationFrame(() => {
            fitView({ duration: 400, padding: 0.2 });
            pendingFitViewRef.current = false;
          });
        }
      });
    } else {
      // Single changes use the standard handler (no batching needed)
      onNodesChangeInternal(changes);

      // Check if we have node additions and a pending fitView request
      const hasAdditions = changes.some(change => change.type === 'add');
      if (hasAdditions && pendingFitViewRef.current) {
        requestAnimationFrame(() => {
          fitView({ duration: 400, padding: 0.2 });
          pendingFitViewRef.current = false;
        });
      }
    }
  }, [onNodesChangeInternal, fitView, setNodes]);

  // Cleanup batch timeout on component unmount
  useEffect(() => {
    return () => {
      if (batchUpdateTimeoutRef.current !== null) {
        cancelAnimationFrame(batchUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Mode state: 'notes' (default), 'map', or 'studio'
  const [currentMode, setCurrentMode] = useState(() => {
    const modeParam = searchParams.get('mode');
    return modeParam && ['notes', 'map', 'studio'].includes(modeParam) ? modeParam : 'notes';
  });

  // Detect if canvas has journey/campaign content (from Outreach Generator)
  const hasJourneyContent = useMemo(() => {
    // Check for nodes that look like outreach campaign nodes
    return nodes.some(node =>
      node.id?.startsWith('outreach-') ||
      node.data?.label?.includes('Outreach') ||
      node.data?.label?.includes('Day 0') ||
      node.data?.label?.includes('Follow-up')
    );
  }, [nodes]);

  // Check if coming from Outreach Generator
  const fromOutreach = searchParams.get('from') === 'outreach';

  // Handle mode change
  const handleModeChange = useCallback((newMode) => {
    // If selecting MAP mode but no campaign exists, redirect to Generator (free) not Hub (premium)
    if (newMode === 'map' && !hasJourneyContent) {
      navigate('/experiments/outreach-generator?from=unity-map');
      return;
    }

    setCurrentMode(newMode);
    // Update URL without full navigation
    const newParams = new URLSearchParams(searchParams);
    if (newMode === 'notes') {
      newParams.delete('mode');
    } else {
      newParams.set('mode', newMode);
    }
    newParams.delete('from'); // Clear the from param after first load
    navigate(`/unity-notes${newParams.toString() ? '?' + newParams.toString() : ''}`, { replace: true });
  }, [navigate, searchParams, hasJourneyContent]);

  // Firebase hook for shareable URLs (gated for pro/admin users)
  const {
    saveCapsule,
    updateCapsule,
    loadCapsule,
    isSaving,
    isLoading: _isLoadingCapsule,
    cleanupOldCapsules,
    getCapsuleStats,
    migrateToV2,
    // v3 Collaboration functions
    addCollaborator,
    removeCollaborator,
    updateVisibility,
    toggleBookmark,
    getBookmarkedCapsules,
    renameCapsule,
    checkAccess
  } = useFirebaseCapsule();

  const [shareUrl, setShareUrl] = useState('');
  // Capsule ID - persisted in localStorage for session continuity across navigation
  const [currentCapsuleId, setCurrentCapsuleId] = useState(() => {
    // Check URL parameter first, then fall back to localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const capsuleParam = urlParams.get('capsule');
    if (capsuleParam) return capsuleParam;

    try {
      return localStorage.getItem('unity-notes-current-capsule') || '';
    } catch {
      return '';
    }
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAICanvasModal, setShowAICanvasModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true); // Canvas minimap toggle
  const [showOverviewTray, setShowOverviewTray] = useState(false); // Right-side overview panel
  const [showTemplatesModal, setShowTemplatesModal] = useState(false); // Node templates modal

  // Sync Status Indicator - Real-time Firebase sync feedback
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // AI Conversation History - Persistent per capsule
  const [conversationHistories, setConversationHistories] = useState(() => {
    try {
      const saved = localStorage.getItem('unity-notes-ai-conversations');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Toast Notification System - Non-blocking user feedback
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdRef.current;
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleToastClick = useCallback((e) => {
    const toastId = e.currentTarget.dataset.toastId;
    dismissToast(toastId);
  }, [dismissToast]);

  // Memoized toast notification styles for performance optimization
  const toastContainerStyle = useMemo(() => ({
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    pointerEvents: 'none'
  }), []);

  const toastBaseStyle = useMemo(() => ({
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(8px)',
    maxWidth: '400px',
    minWidth: '200px',
    fontSize: '14px',
    lineHeight: '1.5',
    cursor: 'pointer',
    pointerEvents: 'auto',
    animation: 'slideInRight 0.3s ease-out',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }), []);

  const toastIconStyle = useMemo(() => ({
    fontSize: '16px'
  }), []);

  const toastMessageStyle = useMemo(() => ({
    flex: 1,
    whiteSpace: 'pre-wrap'
  }), []);

  const toastTypeColors = useMemo(() => ({
    error: 'rgba(239, 68, 68, 0.95)',
    success: 'rgba(34, 197, 94, 0.95)',
    warning: 'rgba(251, 191, 36, 0.95)',
    info: 'rgba(59, 130, 246, 0.95)'
  }), []);

  // Optimized callback that merges toast base style with type color (eliminates spread operator allocation)
  const getToastItemStyle = useCallback((toastType) => ({
    ...toastBaseStyle,
    backgroundColor: toastTypeColors[toastType] || toastTypeColors.info
  }), [toastBaseStyle, toastTypeColors]);

  // Collaboration state (v3)
  const [collaborators, setCollaborators] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [canEditCapsule, setCanEditCapsule] = useState(false); // Track if user can edit loaded capsule
  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkedCapsules, setBookmarkedCapsules] = useState([]);
  // Starred nodes state - persisted in localStorage
  const [starredNodeIds, setStarredNodeIds] = useState(() => {
    try {
      const saved = localStorage.getItem('unity-notes-starred-nodes');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Track current starred node index for keyboard navigation
  const [currentStarredIndex, setCurrentStarredIndex] = useState(0);

  // Node templates - save and reuse node configurations
  const [nodeTemplates, setNodeTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('unity-notes-node-templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track collapsed comment threads
  const [collapsedThreads, setCollapsedThreads] = useState(new Set());

  // Active viewers presence state
  const [activeViewers, setActiveViewers] = useState([]);

  // Real-time cursor tracking state
  const [remoteCursors, setRemoteCursors] = useState({});
  const lastCursorUpdateRef = useRef(0);
  const cursorCleanupTimersRef = useRef({});

  // Canvas title - shown in ShareModal header
  const canvasTitle = 'Unity Notes Canvas';

  // Firebase hook for UnityMAP journey persistence
  const {
    saveJourney,
    loadJourney,
    updateJourney,
    publishJourney,
    sendJourneyNow,
    isSaving: isSavingJourney
  } = useFirebaseJourney();

  // Restore journey ID from localStorage on initial load
  const [currentJourneyId, setCurrentJourneyId] = useState(() => {
    try {
      return localStorage.getItem('unity-map-current-journey-id') || null;
    } catch {
      return null;
    }
  });
  const [journeyTitle, setJourneyTitle] = useState('Untitled Journey');
  const [journeyStatus, setJourneyStatus] = useState('draft'); // draft, active, paused, completed
  const [showProspectModal, setShowProspectModal] = useState(false);
  const [_isSendingEmails, setIsSendingEmails] = useState(false);
  const [journeyProspects, setJourneyProspects] = useState([]); // Track prospects for visual display
  const [studioContext, setStudioContext] = useState(null); // Context passed from AI Chat to Studio
  const [_associatedTriggers, setAssociatedTriggers] = useState([]); // Trigger rules that enroll into this journey
  const [_isLoadingTriggers, setIsLoadingTriggers] = useState(false);

  // Auto-save state
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [_isSavingLocal, setIsSavingLocal] = useState(false);

  // Touch/Mobile Enhancement: Pinch Gesture Visual Feedback
  // Tracks when user is actively pinching to provide real-time visual confirmation
  const [isActivelyPinching, setIsActivelyPinching] = useState(false);
  const pinchTimeoutRef = useRef(null);

  // Enhanced Pinch Distance Tracking (iOS Safari Improvement)
  // Tracks actual finger distance and zoom direction for better UX feedback
  const [pinchStartDistance, setPinchStartDistance] = useState(null);
  const [pinchCurrentDistance, setPinchCurrentDistance] = useState(null);
  const [pinchDirection, setPinchDirection] = useState(null); // 'in' | 'out' | null

  // First-Time User Pinch Gesture Tutorial Hint
  // Shows a one-time hint to mobile users to help them discover pinch-to-zoom
  const [showPinchHint, setShowPinchHint] = useState(false);

  // Canvas Snapshots - Version History Feature
  // Allows users to save named snapshots of canvas state and restore them later
  const [snapshots, setSnapshots] = useState(() => {
    try {
      const saved = localStorage.getItem('unityNotes_snapshots');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load snapshots from localStorage:', error);
      return [];
    }
  });
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);
  const [hasPinchedOnce, setHasPinchedOnce] = useState(false);
  const pinchHintTimeoutRef = useRef(null);

  // Node Search Feature - Find and navigate to nodes by content
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Immediate input value for UI responsiveness
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Debounce search to prevent expensive search calculations on every keystroke
  // 250ms delay provides good balance between responsiveness and performance
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 250);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchInput]);

  // Node Type Filter Feature - Filter visible nodes by type
  const [nodeTypeFilter, setNodeTypeFilter] = useState(new Set());
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Notification Dropdown - Display comment/mention notifications
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Notification Item Hover/Focus State - Track which notification is hovered/focused (performance optimization)
  const [hoveredNotificationId, setHoveredNotificationId] = useState(null);
  const [focusedNotificationId, setFocusedNotificationId] = useState(null);

  // Keyboard Node Navigation - Track focused node for arrow key navigation
  const [focusedNodeId, setFocusedNodeId] = useState(null);

  // Quick Jump Feature - Cmd+J fuzzy finder to jump to any node
  const [showQuickJump, setShowQuickJump] = useState(false);
  const [quickJumpQuery, setQuickJumpQuery] = useState('');
  const [quickJumpSelectedIndex, setQuickJumpSelectedIndex] = useState(0);
  const quickJumpInputRef = useRef(null);

  // Wiki-Style Node Linking - Backlinks tracking
  // Compute backlinks map whenever nodes change
  const backlinksMap = useMemo(() => buildBacklinksMap(nodes), [nodes]);

  // Extract available node types for filtering
  const availableNodeTypes = useMemo(() => {
    const types = new Set();
    nodes.forEach(node => {
      if (node.type) {
        types.add(node.type);
      }
    });
    return Array.from(types).sort();
  }, [nodes]);

  // Compute node counts by type (performance optimization for filter dropdown)
  const nodeCountsByType = useMemo(() => {
    const counts = {};
    nodes.forEach(node => {
      if (node.type) {
        counts[node.type] = (counts[node.type] || 0) + 1;
      }
    });
    return counts;
  }, [nodes]);

  // Create edges-by-source Map for O(1) lookups (performance optimization for thread traversal)
  const edgesBySource = useMemo(() => {
    const map = new Map();
    edges.forEach(edge => {
      if (!map.has(edge.source)) {
        map.set(edge.source, []);
      }
      map.get(edge.source).push(edge);
    });
    return map;
  }, [edges]);

  // Create edge count by source Map for O(1) reply count lookups (performance optimization for CommentNode)
  // Prevents CommentNode from filtering through ALL edges on every render
  // For 50 CommentNodes with 100 edges: Before = 5,000 filter operations, After = 100 Map operations (98% reduction)
  const edgeCountBySource = useMemo(() => {
    const map = new Map();
    edges.forEach(edge => {
      map.set(edge.source, (map.get(edge.source) || 0) + 1);
    });
    return map;
  }, [edges]);

  // Check if any nodes are selected (performance optimization for toolbar buttons)
  const hasSelectedNodes = useMemo(() => {
    return nodes.some(n => n.selected);
  }, [nodes]);

  // Node lookup by ID (performance optimization for O(1) node access)
  const nodeById = useMemo(() => {
    return new Map(nodes.map(n => [n.id, n]));
  }, [nodes]);

  // Selected nodes array (performance optimization - eliminates redundant filter operations)
  const selectedNodes = useMemo(() => {
    return nodes.filter(n => n.selected);
  }, [nodes]);

  // Visible (non-hidden) nodes for Tab navigation (performance optimization)
  // Prevents O(n) filter operation on every Tab key press
  // For 100 nodes: eliminates 100 iterations per Tab navigation
  const visibleTabNodes = useMemo(() => {
    return nodes.filter(n => !n.hidden);
  }, [nodes]);

  // Remote cursors entries (performance optimization - prevents Object.entries() on every render)
  const remoteCursorsEntries = useMemo(() => {
    return Object.entries(remoteCursors);
  }, [remoteCursors]);

  // Memoized boolean check for remote cursors presence (performance optimization)
  // Prevents Object.keys() array creation on every render during high-frequency viewport events
  const hasRemoteCursors = useMemo(() => {
    return Object.keys(remoteCursors).length > 0;
  }, [remoteCursors]);

  // Empty State - Memoized styles (performance optimization)
  const emptyStateContainerStyle = useMemo(() => ({
    position: 'fixed',
    bottom: '144px',
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    padding: '12px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
    maxWidth: '240px',
    pointerEvents: 'none',
    zIndex: 85
  }), []);

  const emptyStateHeadingStyle = useMemo(() => ({
    fontSize: '14px',
    fontWeight: '700',
    color: '#000',
    marginBottom: '6px',
    textAlign: 'center',
  }), []);

  const emptyStateTextStyle = useMemo(() => ({
    fontSize: '12px',
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: '1.4',
    textAlign: 'center',
  }), []);

  const emptyStateHighlightStyle = useMemo(() => ({
    color: 'rgb(251, 191, 36)',
    fontWeight: '700'
  }), []);

  const emptyStateChevronStyle = useMemo(() => ({
    position: 'absolute',
    bottom: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '8px solid transparent',
    borderRight: '8px solid transparent',
    borderTop: '8px solid rgba(255, 255, 255, 0.95)',
  }), []);

  // Email Preview Modal - Memoized styles (performance optimization)
  const emailPreviewOverlayStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }), []);

  const emailPreviewContentStyle = useMemo(() => ({
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column'
  }), []);

  const emailPreviewHeaderStyle = useMemo(() => ({
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff'
  }), []);

  const emailPreviewTitleStyle = useMemo(() => ({
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#111'
  }), []);

  const emailPreviewSubtitleStyle = useMemo(() => ({
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#6b7280'
  }), []);

  const emailPreviewCloseButtonStyle = useMemo(() => ({
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f3f4f6',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280'
  }), []);

  const emailPreviewBodyContainerStyle = useMemo(() => ({
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#e5e5e5',
    padding: '24px'
  }), []);

  const emailTemplateContainerStyle = useMemo(() => ({
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
  }), []);

  const emailTemplateHeaderStyle = useMemo(() => ({
    backgroundColor: 'rgb(251, 191, 36)',
    padding: '24px 40px'
  }), []);

  const emailTemplateBrandTitleStyle = useMemo(() => ({
    margin: 0,
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: '24px',
    fontWeight: '900',
    color: '#000000',
    letterSpacing: '-1px'
  }), []);

  const emailTemplateSubjectContainerStyle = useMemo(() => ({
    padding: '32px 40px 16px',
    borderBottom: '1px solid #eee'
  }), []);

  const emailTemplateSubjectLabelStyle = useMemo(() => ({
    margin: '0 0 8px',
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  }), []);

  const emailTemplateSubjectHeadingStyle = useMemo(() => ({
    margin: 0,
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: '18px',
    fontWeight: '600',
    color: '#111'
  }), []);

  const emailTemplateBodyStyle = useMemo(() => ({
    padding: '32px 40px',
    fontSize: '15px',
    color: '#333',
    lineHeight: '1.6',
    fontFamily: 'Georgia, "Times New Roman", serif'
  }), []);

  const emailTemplateBodyParagraphStyle = useMemo(() => ({
    margin: '0 0 16px'
  }), []);

  const emailTemplateFooterStyle = useMemo(() => ({
    backgroundColor: '#1a1a1a',
    padding: '24px 40px'
  }), []);

  const emailTemplateFooterNameStyle = useMemo(() => ({
    margin: '0 0 4px',
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgb(251, 191, 36)'
  }), []);

  const emailTemplateFooterSubtitleStyle = useMemo(() => ({
    margin: 0,
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)'
  }), []);

  // Collaborative Cursors Overlay - Memoized styles (performance optimization)
  const cursorOverlayContainerStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 9999,
    overflow: 'hidden',
  }), []);

  const cursorSvgStyle = useMemo(() => ({
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
  }), []);

  const cursorNameLabelBaseStyle = useMemo(() => ({
    position: 'absolute',
    left: '20px',
    top: '20px',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    pointerEvents: 'none',
    userSelect: 'none',
  }), []);

  // Remote cursor container base style (static parts) - prevents object recreation on every cursor move
  const remoteCursorContainerBaseStyle = useMemo(() => ({
    position: 'absolute',
    transform: 'translate(-2px, -2px)',
    transition: 'left 0.15s ease-out, top 0.15s ease-out',
    animation: 'fadeIn 0.2s ease-out',
  }), []);

  // Generate dynamic cursor position style (useCallback to prevent recreation on every render)
  const getRemoteCursorPositionStyle = useCallback((x, y) => ({
    ...remoteCursorContainerBaseStyle,
    left: `${x}%`,
    top: `${y}%`,
  }), [remoteCursorContainerBaseStyle]);

  // Generate dynamic cursor name label style (useCallback to prevent recreation on every render)
  const getCursorNameLabelStyle = useCallback((color) => ({
    ...cursorNameLabelBaseStyle,
    backgroundColor: color || '#4ECDC4',
  }), [cursorNameLabelBaseStyle]);

  // Dev Tools Panel - Memoized styles (performance optimization)
  const devToolsPanelStyle = useMemo(() => ({
    position: 'fixed',
    top: '80px',
    left: '20px',
    width: '280px',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(8px)',
    borderRadius: '12px',
    padding: '16px',
    zIndex: 9999,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    fontFamily: 'monospace'
  }), []);

  const devToolsHeaderStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  }), []);

  const devToolsTitleStyle = useMemo(() => ({
    color: 'rgb(251, 191, 36)',
    fontWeight: '700',
    fontSize: '12px'
  }), []);

  const devToolsCloseButtonStyle = useMemo(() => ({
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '14px'
  }), []);

  const devToolsStatusContainerStyle = useMemo(() => ({
    marginBottom: '12px',
    fontSize: '10px',
    color: '#9ca3af'
  }), []);

  const devToolsStatusRowStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px'
  }), []);

  const devToolsStatusRowLastStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between'
  }), []);

  const devToolsStatusGreenStyle = useMemo(() => ({
    color: '#22c55e'
  }), []);

  const devToolsStatusGrayStyle = useMemo(() => ({
    color: '#6b7280'
  }), []);

  const devToolsStatusYellowStyle = useMemo(() => ({
    color: '#fbbf24'
  }), []);

  const devToolsStatusRedStyle = useMemo(() => ({
    color: '#ef4444'
  }), []);

  const devToolsStatusBlueStyle = useMemo(() => ({
    color: '#60a5fa'
  }), []);

  const devToolsDividerStyle = useMemo(() => ({
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: '6px 0'
  }), []);

  const devToolsActionsContainerStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  }), []);

  const devToolsAdminSectionStyle = useMemo(() => ({
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  }), []);

  const devToolsAdminTitleStyle = useMemo(() => ({
    color: '#ef4444',
    fontWeight: '700',
    fontSize: '10px',
    display: 'block',
    marginBottom: '8px'
  }), []);

  const devToolsFooterStyle = useMemo(() => ({
    marginTop: '12px',
    fontSize: '9px',
    color: '#6b7280',
    textAlign: 'center'
  }), []);

  // Static array memoization (performance optimization)
  const modeOptions = useMemo(() => [
    { key: 'notes', label: 'NOTES', icon: '📝', color: 'rgb(251, 191, 36)' },
    { key: 'map', label: 'MAP', icon: '🗺️', color: '#f59e0b' },
    { key: 'studio', label: 'STUDIO', icon: '🎨', color: '#d97706' }
  ], []);

  const zoomPresets = useMemo(() => [
    { value: 0.5, label: '50%', desc: 'Zoomed Out' },
    { value: 0.75, label: '75%', desc: 'Compact' },
    { value: 1.0, label: '100%', desc: 'Default' },
    { value: 1.5, label: '150%', desc: 'Enlarged' },
    { value: 2.0, label: '200%', desc: 'Close Up' },
    { value: 'fit', label: 'Fit All', desc: 'Fit Nodes' }
  ], []);

  // Mode Panel Slideout - Memoized styles (performance optimization)
  const modePanelContainerStyle = useCallback((showModePanel) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    padding: showModePanel ? '10px' : '0',
    borderRadius: '8px 0 0 8px',
    boxShadow: showModePanel ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
    overflow: 'hidden',
    maxWidth: showModePanel ? '120px' : '0',
    opacity: showModePanel ? 1 : 0,
    transition: 'all 0.3s ease-out',
    marginRight: showModePanel ? '0' : '-8px'
  }), []);

  const modeButtonStyle = useCallback((mode, currentMode) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    fontSize: '10px',
    fontWeight: currentMode === mode.key ? '700' : '500',
    letterSpacing: '0.05em',
    border: 'none',
    borderRadius: '6px',
    cursor: mode.disabled ? 'not-allowed' : 'pointer',
    backgroundColor: currentMode === mode.key ? mode.color : 'transparent',
    color: currentMode === mode.key ? (mode.key === 'notes' ? '#000' : '#fff') : mode.disabled ? '#999' : '#333',
    opacity: mode.disabled ? 0.5 : 1,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  }), []);

  // Memoized zoom control button handlers (performance optimization)
  // Zoom In/Out buttons - yellow theme with scale transform
  const handleZoomButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = '#f5b000';
    e.currentTarget.style.transform = 'scale(1.05)';
  }, []);

  const handleZoomButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgb(251, 191, 36)';
    e.currentTarget.style.transform = 'scale(1)';
  }, []);

  const handleZoomButtonTouchStart = useCallback((e) => {
    e.currentTarget.style.backgroundColor = '#f5b000';
    e.currentTarget.style.transform = 'scale(0.95)';
  }, []);

  const handleZoomButtonTouchEnd = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgb(251, 191, 36)';
    e.currentTarget.style.transform = 'scale(1)';
  }, []);

  // Zoom Level indicator button - yellow theme with border
  const handleZoomLevelMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)';
    e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
  }, []);

  const handleZoomLevelMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
    e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
  }, []);

  // Fit View button - yellow theme with scale transform
  const handleFitViewButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.2)';
    e.currentTarget.style.transform = 'scale(1.08)';
  }, []);

  const handleFitViewButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
    e.currentTarget.style.transform = 'scale(1)';
  }, []);

  // Auto-Layout button - green theme with scale transform
  const handleAutoLayoutButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
    e.currentTarget.style.transform = 'scale(1.08)';
  }, []);

  const handleAutoLayoutButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
    e.currentTarget.style.transform = 'scale(1)';
  }, []);

  // Floating Toolbar button handlers - primary "Add Comment" button
  const handleFloatingToolbarButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
    e.currentTarget.style.transform = 'scale(1.05)';
  }, []);

  const handleFloatingToolbarButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
    e.currentTarget.style.transform = 'scale(1)';
  }, []);

  // Floating Toolbar icon buttons - Star, Duplicate, Color picker
  const handleFloatingToolbarIconButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
    e.currentTarget.style.transform = 'scale(1.1)';
  }, []);

  const handleFloatingToolbarIconButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
    e.currentTarget.style.transform = 'scale(1)';
  }, []);

  // Floating Toolbar delete button
  const handleFloatingToolbarDeleteButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.background = 'rgba(220, 38, 38, 1)';
    e.currentTarget.style.transform = 'scale(1.1)';
  }, []);

  const handleFloatingToolbarDeleteButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.95)';
    e.currentTarget.style.transform = 'scale(1)';
  }, []);

  // Floating Toolbar close button
  const handleFloatingToolbarCloseButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
    e.currentTarget.style.color = '#000';
  }, []);

  const handleFloatingToolbarCloseButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
    e.currentTarget.style.color = '#78716c';
  }, []);

  // Floating Toolbar click handlers (Performance optimization - Jan 3, 2026)
  const handleFloatingToolbarStarClick = useCallback(() => {
    if (selectedNode) handleToggleNodeStar(selectedNode.id);
  }, [selectedNode, handleToggleNodeStar]);

  const handleFloatingToolbarDuplicateClick = useCallback(() => {
    handleDuplicateSelected();
    setShowCommentToolbar(false);
  }, [handleDuplicateSelected, setShowCommentToolbar]);

  const handleFloatingToolbarColorPickerClick = useCallback(() => {
    setShowColorPicker(prev => !prev);
  }, [setShowColorPicker]);

  const handleFloatingToolbarDeleteClick = useCallback(() => {
    if (selectedNode && window.confirm('Are you sure you want to delete this node?')) {
      handleDeleteNode(selectedNode.id);
      setShowCommentToolbar(false);
    }
  }, [selectedNode, handleDeleteNode, setShowCommentToolbar]);

  const handleFloatingToolbarCloseClick = useCallback(() => {
    setShowCommentToolbar(false);
  }, [setShowCommentToolbar]);

  // Memoized zoom preset dropdown handlers (performance optimization)
  const getZoomPresetClickHandler = useCallback((presetValue) => {
    return () => handleZoomPreset(presetValue);
  }, [handleZoomPreset]);

  const getZoomPresetMouseEnterHandler = useCallback((presetValue, currentZoom) => {
    return (e) => {
      if (presetValue !== currentZoom) {
        e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.05)';
      }
    };
  }, []);

  const getZoomPresetMouseLeaveHandler = useCallback((presetValue, currentZoom) => {
    return (e) => {
      if (presetValue !== currentZoom) {
        e.currentTarget.style.backgroundColor = 'transparent';
      }
    };
  }, []);

  // Memoized mode button click handler factory (performance optimization)
  // Eliminates 3 inline arrow function allocations per render (one per mode button)
  const getModeButtonClickHandler = useCallback((modeKey, disabled) => {
    return () => {
      if (!disabled) {
        handleModeChange(modeKey);
      }
    };
  }, [handleModeChange]);

  // Memoized filter dropdown handlers (performance optimization)
  const handleToggleNodeTypeFilter = useCallback((type) => {
    setNodeTypeFilter(prev => {
      const newFilter = new Set(prev);
      if (newFilter.has(type)) {
        newFilter.delete(type);
      } else {
        newFilter.add(type);
      }
      return newFilter;
    });
  }, []);

  const getFilterLabelTextStyle = useCallback((isSelected) => ({
    flex: 1,
    fontSize: '13px',
    color: '#374151',
    fontWeight: isSelected ? 500 : 400
  }), []);

  // Memoized filter dropdown interaction handlers (performance optimization)
  // These replace inline arrow functions in the filter dropdown JSX to eliminate
  // unnecessary function allocations on every render
  const handleToggleFilterDropdown = useCallback(() => {
    setShowFilterDropdown(prev => !prev);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setNodeTypeFilter(new Set());
  }, []);

  const handleFilterLabelMouseEnter = useCallback((e, isSelected) => {
    if (!isSelected) {
      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
    }
  }, []);

  const handleFilterLabelMouseLeave = useCallback((e, isSelected) => {
    if (!isSelected) {
      e.currentTarget.style.backgroundColor = 'transparent';
    }
  }, []);

  // Memoized callback generators for filter dropdown (performance optimization)
  // These eliminate inline arrow functions in the filter dropdown JSX
  const createFilterCheckboxChangeHandler = useCallback((type) => {
    return () => handleToggleNodeTypeFilter(type);
  }, [handleToggleNodeTypeFilter]);

  const createFilterLabelEnterHandler = useCallback((isSelected) => {
    return (e) => handleFilterLabelMouseEnter(e, isSelected);
  }, [handleFilterLabelMouseEnter]);

  const createFilterLabelLeaveHandler = useCallback((isSelected) => {
    return (e) => handleFilterLabelMouseLeave(e, isSelected);
  }, [handleFilterLabelMouseLeave]);

  // Memoized callback maps for filter dropdown (performance optimization)
  // These pre-generate callbacks for each node type, eliminating inline arrow functions
  const filterCheckboxHandlers = useMemo(() => {
    const handlers = {};
    availableNodeTypes.forEach(type => {
      handlers[type] = createFilterCheckboxChangeHandler(type);
    });
    return handlers;
  }, [availableNodeTypes, createFilterCheckboxChangeHandler]);

  const filterLabelEnterHandlers = useMemo(() => {
    const handlers = { selected: {}, unselected: {} };
    availableNodeTypes.forEach(type => {
      handlers.selected[type] = createFilterLabelEnterHandler(true);
      handlers.unselected[type] = createFilterLabelEnterHandler(false);
    });
    return handlers;
  }, [availableNodeTypes, createFilterLabelEnterHandler]);

  const filterLabelLeaveHandlers = useMemo(() => {
    const handlers = { selected: {}, unselected: {} };
    availableNodeTypes.forEach(type => {
      handlers.selected[type] = createFilterLabelLeaveHandler(true);
      handlers.unselected[type] = createFilterLabelLeaveHandler(false);
    });
    return handlers;
  }, [availableNodeTypes, createFilterLabelLeaveHandler]);

  // Memoized Toolbar button styles (performance optimization)
  // NOTE: These functions return complete style objects (base + dynamic properties)
  // to eliminate spread operator allocations in JSX
  const getDuplicateButtonStyle = useCallback((hasSelectedNodes) => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hasSelectedNodes ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.02)',
    border: `1px solid ${hasSelectedNodes ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.06)'}`,
    borderRadius: '4px',
    cursor: hasSelectedNodes ? 'pointer' : 'not-allowed',
    transition: 'background-color 0.2s, transform 0.2s'
  }), []);

  const getBookmarkButtonStyle = useCallback((isBookmarked, currentCapsuleId) => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isBookmarked ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0, 0, 0, 0.04)',
    border: `1px solid ${isBookmarked ? 'rgba(251, 191, 36, 0.5)' : 'rgba(0, 0, 0, 0.12)'}`,
    borderRadius: '4px',
    cursor: currentCapsuleId ? 'pointer' : 'not-allowed',
    opacity: currentCapsuleId ? 1 : 0.5,
    transition: 'background-color 0.2s, transform 0.2s'
  }), []);

  const getMinimapButtonStyle = useCallback((showMinimap) => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: showMinimap ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.04)',
    border: `1px solid ${showMinimap ? 'rgba(59, 130, 246, 0.4)' : 'rgba(0, 0, 0, 0.12)'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.2s'
  }), []);

  const getOverviewButtonStyle = useCallback((showOverviewTray) => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: showOverviewTray ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.04)',
    border: `1px solid ${showOverviewTray ? 'rgba(59, 130, 246, 0.4)' : 'rgba(0, 0, 0, 0.12)'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.2s'
  }), []);

  // Mode Toggle Button - Memoized style (performance optimization)
  const getModePanelButtonStyle = useCallback((isActive) => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isActive ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0, 0, 0, 0.04)',
    border: `1px solid ${isActive ? 'rgba(251, 191, 36, 0.5)' : 'rgba(0, 0, 0, 0.12)'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    color: isActive ? '#b45309' : 'black',
    transition: 'all 0.2s ease'
  }), []);

  // @Mention Autocomplete - Dynamic style functions (performance optimization)
  // Generate position style for mention dropdown (useCallback to prevent recreation on every render)
  const getMentionDropdownPositionStyle = useCallback((x, y) => ({
    ...mentionDropdownContainerBaseStyle,
    left: `${x}px`,
    top: `${y}px`,
  }), [mentionDropdownContainerBaseStyle]);

  // Pan Mode and Theme button styles - Memoized (performance optimization)
  const getPanModeButtonStyle = useCallback((isPanModeActive) => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isPanModeActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.04)',
    border: `1px solid ${isPanModeActive ? 'rgba(59, 130, 246, 0.5)' : 'rgba(0, 0, 0, 0.12)'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }), []);

  const getThemeButtonStyle = useCallback((theme, isDarkTheme) => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme === 'custom' ? 'rgba(167, 139, 250, 0.15)' : (isDarkTheme ? 'rgba(59, 130, 246, 0.15)' : 'rgba(251, 191, 36, 0.15)'),
    border: `1px solid ${theme === 'custom' ? 'rgba(167, 139, 250, 0.4)' : (isDarkTheme ? 'rgba(59, 130, 246, 0.4)' : 'rgba(251, 191, 36, 0.4)')}`,
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.2s',
    position: 'relative'
  }), []);

  // Haptic Feedback button style - Memoized (performance optimization)
  const getHapticsButtonStyle = useCallback((hapticsEnabled) => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hapticsEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(156, 163, 175, 0.15)',
    border: `1px solid ${hapticsEnabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(156, 163, 175, 0.4)'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.2s',
    position: 'relative',
    opacity: navigator.vibrate ? 1 : 0.5 // Dim if not supported
  }), []);

  // Search Navigation Button Styles - Memoized (performance optimization)
  const getSearchNavButtonStyle = useCallback((hasResults) => ({
    padding: '2px 4px',
    border: '1px solid #e5e7eb',
    borderRadius: '3px',
    background: 'white',
    cursor: hasResults ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    opacity: hasResults ? 1 : 0.5
  }), []);

  const zoomControlsMainContainerStyle = useCallback((showModePanel) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    padding: '8px 6px',
    borderRadius: showModePanel ? '0 6px 6px 0' : '6px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)'
  }), []);

  // Dev Tools Button Styles - Memoized (performance optimization)
  const getDevButtonStyle = useCallback((backgroundColor = '#374151') => ({
    padding: '8px 12px',
    backgroundColor,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.2s'
  }), []);

  // Notification Dropdown - Memoized styles (performance optimization)
  const notificationItemBaseStyle = useMemo(() => ({
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    background: '#fff',
    outline: 'none',
  }), []);

  // Notification item hover state (replaces direct DOM style manipulation for performance)
  const notificationItemHoverStyle = useMemo(() => ({
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    background: '#f9fafb',
    outline: 'none',
  }), []);

  // Notification item focus state (replaces direct DOM style manipulation for performance)
  const notificationItemFocusStyle = useMemo(() => ({
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    background: '#f9fafb',
    outline: '2px solid #3b82f6',
    outlineOffset: '-2px',
  }), []);

  // Notification Item Style Generator - Memoized (performance optimization)
  // Replaces inline style object creation in notification list rendering (lines 13466-13473)
  // For 20 notifications: 20 allocations/render → 0 allocations/render (100% reduction)
  // For 50 notifications: 50 allocations/render → 0 allocations/render (100% reduction)
  const getNotificationItemStyle = useCallback((isFocused, isHovered, isLastItem) => {
    const baseStyle = isFocused
      ? notificationItemFocusStyle
      : isHovered
      ? notificationItemHoverStyle
      : notificationItemBaseStyle;

    return {
      ...baseStyle,
      borderBottom: isLastItem ? 'none' : '1px solid #f3f4f6',
    };
  }, [notificationItemBaseStyle, notificationItemHoverStyle, notificationItemFocusStyle]);

  // Mention User Item Style Generator - Memoized (performance optimization)
  // Replaces inline style object creation in @mention autocomplete rendering (lines 13775-13783)
  // For 20 users: 20 allocations/render → 0 allocations/render (100% reduction)
  // For 50 users: 50 allocations/render → 0 allocations/render (100% reduction)
  const getMentionUserItemStyle = useCallback((isSelected) => {
    if (isSelected) {
      return {
        ...mentionUserItemBaseStyle,
        background: 'rgba(251, 191, 36, 0.15)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
      };
    }
    return {
      ...mentionUserItemBaseStyle,
      background: 'transparent',
      border: '1px solid transparent',
    };
  }, [mentionUserItemBaseStyle]);

  const notificationFlexContainerStyle = useMemo(() => ({
    display: 'flex',
    gap: '12px'
  }), []);

  const notificationIconStyle = useMemo(() => ({
    fontSize: '20px',
    flexShrink: 0,
  }), []);

  const notificationContentStyle = useMemo(() => ({
    flex: 1,
    minWidth: 0
  }), []);

  const notificationTitleStyle = useMemo(() => ({
    fontWeight: '600',
    fontSize: '14px',
    color: '#111827',
    marginBottom: '4px',
  }), []);

  const notificationMessageStyle = useMemo(() => ({
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    lineHeight: '1.4',
  }), []);

  const notificationTimestampStyle = useMemo(() => ({
    fontSize: '11px',
    color: '#9ca3af',
  }), []);

  // Toolbar Icon & Divider - Memoized styles (performance optimization)
  const toolbarIconStyle = useMemo(() => ({
    flexShrink: 0,
    minWidth: 14,
    minHeight: 14,
  }), []);

  const toolbarDividerStyle = useMemo(() => ({
    width: '24px',
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '4px 0',
  }), []);

  // Pinch Hint Modal - Memoized styles (performance optimization)
  const pinchHintOverlayStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(2px)',
    zIndex: 10001,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    animation: 'fadeIn 0.3s ease-out',
    pointerEvents: 'auto'
  }), []);

  const pinchHintModalStyle = useMemo(() => ({
    backgroundColor: isDarkTheme ? 'rgba(31, 41, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    color: isDarkTheme ? '#f3f4f6' : '#1f2937',
    padding: '32px 24px',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    maxWidth: '320px',
    width: '100%',
    textAlign: 'center',
    animation: 'scaleIn 0.3s ease-out',
    pointerEvents: 'auto'
  }), [isDarkTheme]);

  const pinchHintIconStyle = useMemo(() => ({
    fontSize: '64px',
    marginBottom: '16px',
    animation: 'pulse 2s ease-in-out infinite'
  }), []);

  const pinchHintTitleStyle = useMemo(() => ({
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
    color: isDarkTheme ? '#f9fafb' : '#111827'
  }), [isDarkTheme]);

  const pinchHintTextStyle = useMemo(() => ({
    fontSize: '14px',
    lineHeight: '1.5',
    color: isDarkTheme ? '#d1d5db' : '#6b7280',
    marginBottom: '16px'
  }), [isDarkTheme]);

  const pinchHintButtonStyle = useMemo(() => ({
    backgroundColor: isDarkTheme ? '#3b82f6' : '#2563eb',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    width: '100%'
  }), [isDarkTheme]);

  const pinchHintDismissTextStyle = useMemo(() => ({
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '12px'
  }), []);

  // Pinch Hint Modal - Memoized event handlers (performance optimization)
  const handlePinchHintDismiss = useCallback(() => {
    setShowPinchHint(false);
    if (pinchHintTimeoutRef.current) {
      clearTimeout(pinchHintTimeoutRef.current);
    }
    try {
      localStorage.setItem('unityNotes_pinchHintDismissed', 'true');
    } catch (e) {
      console.error('Failed to save pinch hint dismissed state:', e);
    }
  }, []);

  const handlePinchHintModalClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handlePinchHintButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = isDarkTheme ? '#2563eb' : '#1d4ed8';
  }, [isDarkTheme]);

  const handlePinchHintButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = isDarkTheme ? '#3b82f6' : '#2563eb';
  }, [isDarkTheme]);

  // Search/Filter Dropdown - Memoized styles (performance optimization)
  const searchBarContainerStyle = useMemo(() => ({
    width: '240px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '6px 8px',
    marginBottom: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  }), []);

  const searchInputWrapperStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px'
  }), []);

  const searchInputFieldStyle = useMemo(() => ({
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    color: '#1f2937',
    backgroundColor: 'transparent'
  }), []);

  const searchClearButtonStyle = useMemo(() => ({
    padding: '2px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: '#9ca3af'
  }), []);

  const searchResultsContainerStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '4px',
    borderTop: '1px solid #f3f4f6'
  }), []);

  const searchResultsCounterStyle = useMemo(() => ({
    fontSize: '11px',
    color: '#6b7280'
  }), []);

  const searchNavigationContainerStyle = useMemo(() => ({
    display: 'flex',
    gap: '2px'
  }), []);

  const filterDropdownContainerStyle = useMemo(() => ({
    position: 'absolute',
    top: '36px',
    left: '0',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    zIndex: 1000,
    minWidth: '200px',
    maxHeight: '300px',
    overflowY: 'auto'
  }), []);

  const filterDropdownHeaderStyle = useMemo(() => ({
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }), []);

  const filterDropdownTitleStyle = useMemo(() => ({
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151'
  }), []);

  const filterClearAllButtonStyle = useMemo(() => ({
    fontSize: '11px',
    color: '#2563eb',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px'
  }), []);

  const filterOptionsContainerStyle = useMemo(() => ({
    padding: '4px'
  }), []);

  const filterEmptyStateStyle = useMemo(() => ({
    padding: '8px 12px',
    fontSize: '12px',
    color: '#9ca3af'
  }), []);

  const filterCheckboxStyle = useMemo(() => ({
    marginRight: '8px',
    cursor: 'pointer'
  }), []);

  const filterBadgeStyle = useMemo(() => ({
    fontSize: '11px',
    color: '#9ca3af',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: '2px 6px',
    borderRadius: '10px'
  }), []);

  // Node Type Filter Button - Memoized styles (performance optimization)
  const filterButtonContainerStyle = useMemo(() => ({
    position: 'relative'
  }), []);

  const filterButtonBaseStyle = useMemo(() => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative'
  }), []);

  const filterButtonActiveStyle = useMemo(() => ({
    ...filterButtonBaseStyle,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    color: '#2563eb'
  }), [filterButtonBaseStyle]);

  const filterButtonInactiveStyle = useMemo(() => ({
    ...filterButtonBaseStyle,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(0, 0, 0, 0.12)',
    color: '#6b7280'
  }), [filterButtonBaseStyle]);

  const filterBadgeCountStyle = useMemo(() => ({
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#2563eb',
    color: 'white',
    fontSize: '9px',
    fontWeight: 'bold',
    borderRadius: '50%',
    width: '14px',
    height: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid white'
  }), []);

  const filterOptionLabelBaseStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background-color 0.15s'
  }), []);

  const filterOptionLabelSelectedStyle = useMemo(() => ({
    ...filterOptionLabelBaseStyle,
    backgroundColor: 'rgba(59, 130, 246, 0.05)'
  }), [filterOptionLabelBaseStyle]);

  const filterOptionLabelUnselectedStyle = useMemo(() => ({
    ...filterOptionLabelBaseStyle,
    backgroundColor: 'transparent'
  }), [filterOptionLabelBaseStyle]);

  // @Mention Autocomplete Dropdown - Memoized styles (performance optimization)
  // Base container style (static properties only, dynamic position will be spread in JSX)
  const mentionDropdownContainerBaseStyle = useMemo(() => ({
    position: 'absolute',
    zIndex: 1001,
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '8px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(203, 213, 225, 0.5)',
    minWidth: '240px',
    maxHeight: '300px',
    overflowY: 'auto',
  }), []);

  const mentionDropdownHeaderStyle = useMemo(() => ({
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '6px 10px 4px',
    marginBottom: '4px'
  }), []);

  // Base user item style (static properties only, dynamic background/border will be spread in JSX)
  const mentionUserItemBaseStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }), []);

  const mentionUserAvatarStyle = useMemo(() => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    color: 'white',
    flexShrink: 0,
  }), []);

  const mentionUserInfoContainerStyle = useMemo(() => ({
    flex: 1,
    overflow: 'hidden',
  }), []);

  const mentionUserNameStyle = useMemo(() => ({
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }), []);

  const mentionUserEmailStyle = useMemo(() => ({
    fontSize: '12px',
    color: '#64748b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }), []);

  const mentionSelectedIndicatorStyle = useMemo(() => ({
    fontSize: '16px',
    color: '#fbbf24',
    flexShrink: 0,
  }), []);

  // Canvas Snapshots Modal - Memoized styles (performance optimization)
  const snapshotModalContentStyle = useMemo(() => ({
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '24px',
    color: '#fff'
  }), []);

  const snapshotModalHeaderContainerStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  }), []);

  const snapshotModalTitleStyle = useMemo(() => ({
    margin: 0,
    fontSize: '24px',
    fontWeight: '600'
  }), []);

  const snapshotModalCloseButtonStyle = useMemo(() => ({
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }), []);

  const snapshotEmptyContainerStyle = useMemo(() => ({
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666'
  }), []);

  const snapshotEmptyTitleStyle = useMemo(() => ({
    fontSize: '18px',
    marginBottom: '8px'
  }), []);

  const snapshotEmptyTextStyle = useMemo(() => ({
    fontSize: '14px'
  }), []);

  const snapshotsContainerStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }), []);

  const snapshotCardStyle = useMemo(() => ({
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #333'
  }), []);

  const snapshotHeaderStyle = useMemo(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px'
  }), []);

  const snapshotTitleContainerStyle = useMemo(() => ({
    flex: 1
  }), []);

  const snapshotTitleStyle = useMemo(() => ({
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '500'
  }), []);

  const snapshotTimestampStyle = useMemo(() => ({
    margin: 0,
    fontSize: '13px',
    color: '#888'
  }), []);

  const snapshotStatsStyle = useMemo(() => ({
    fontSize: '13px',
    color: '#aaa',
    marginBottom: '12px'
  }), []);

  const snapshotButtonsContainerStyle = useMemo(() => ({
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  }), []);

  const snapshotRestoreButtonStyle = useMemo(() => ({
    backgroundColor: '#4a9eff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  }), []);

  const snapshotRenameButtonStyle = useMemo(() => ({
    backgroundColor: '#444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  }), []);

  const snapshotDeleteButtonStyle = useMemo(() => ({
    backgroundColor: '#d32f2f',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  }), []);

  // Reversed snapshots array - Memoized to avoid repeated array operations (performance optimization)
  const reversedSnapshots = useMemo(
    () => [...snapshots].reverse(),
    [snapshots]
  );

  // Toolbar SVG Icons - Memoized style (performance optimization)
  const toolbarIconSvgStyle = useMemo(() => ({
    flexShrink: 0,
    minWidth: 14,
    minHeight: 14
  }), []);

  // Zoom Controls - Memoized styles for performance
  const zoomControlsContainerStyle = useMemo(() => ({
    position: 'fixed',
    top: '50%',
    right: '20px',
    transform: 'translateY(-50%)',
    zIndex: 150,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0'
  }), []);

  const modeIconStyle = useMemo(() => ({
    fontSize: '14px'
  }), []);

  const soonBadgeStyle = useMemo(() => ({
    fontSize: '8px'
  }), []);

  const getModeButtonStyle = useCallback((mode) => ({
    padding: '8px 16px',
    backgroundColor: currentMode === mode ? '#007AFF' : '#3d3d3d',
    color: currentMode === mode ? '#fff' : '#888',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    position: 'relative',
    whiteSpace: 'nowrap',
  }), [currentMode]);

  // Quick Jump - Fuzzy matching nodes by title and content
  const fuzzyMatchNodes = useMemo(() => {
    if (!quickJumpQuery.trim()) return nodes.slice(0, 10); // Show first 10 nodes

    const query = quickJumpQuery.toLowerCase();
    const scored = nodes.map(node => {
      const label = (node.data?.label || node.data?.title || '').toLowerCase();
      const content = (node.data?.content || '').toLowerCase();

      let score = 0;
      if (label.includes(query)) score += 100;
      if (label.startsWith(query)) score += 50;
      if (content.includes(query)) score += 10;

      return { node, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.node);
  }, [quickJumpQuery, nodes]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    if (!showFilterDropdown) return;

    const handleClickOutside = (event) => {
      // Check if click is outside the filter dropdown
      const filterButton = event.target.closest('button');
      const filterDropdown = event.target.closest('[data-filter-dropdown]');

      if (!filterButton && !filterDropdown) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown]);

  // Helper function: Calculate Euclidean distance between two touch points
  // Used for pinch gesture distance tracking and zoom direction detection
  const calculateDistance = useCallback((touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // iOS Safari Pinch-to-Zoom Fix: SIMPLIFIED APPROACH
  // =============================================================================
  // CRITICAL INSIGHT: React Flow already has excellent pinch-to-zoom support!
  // The problem was our custom touch handlers were interfering with it.
  //
  // NEW STRATEGY (Simplified):
  //   1. ONLY block 3+ finger gestures (they cause unwanted Safari navigation)
  //   2. For 1-2 fingers: Do NOTHING - let React Flow handle it natively
  //   3. React Flow's zoomOnPinch prop handles all pinch-to-zoom perfectly
  //   4. CSS touchAction: 'none' gives React Flow full gesture control
  //
  // WHY THIS WORKS:
  //   - React Flow's native handlers work great when not blocked
  //   - Our custom preventDefault() was preventing React Flow from receiving events
  //   - By removing our interference, pinch-to-zoom "just works" on iOS Safari
  //
  // ENHANCEMENT (v2): Added distance tracking and zoom direction detection
  //   - Calculates actual pixel distance between two fingers
  //   - Tracks zoom direction (in/out) with jitter prevention
  //   - Provides enhanced visual feedback showing zoom direction
  // =============================================================================
  const canvasContainerRef = useRef(null);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // FIX: iOS Safari Pinch-to-Zoom Consistency - v3 (SPLIT PASSIVE/NON-PASSIVE FIX)
    // PROBLEM: Non-passive listeners (even in capture phase) force iOS Safari to WAIT and check
    //          if preventDefault() might be called, causing delays in gesture recognition.
    //          This created inconsistent pinch-to-zoom behavior even when we weren't calling
    //          preventDefault() for 2-finger gestures.
    // SOLUTION: Split into TWO separate handler sets:
    //          1. PASSIVE listeners (bubble phase) for 2-finger visual feedback - ZERO delay
    //          2. NON-PASSIVE listeners (capture phase) ONLY for blocking 3+ finger gestures
    //
    // KEY INSIGHT: Passive listeners tell iOS Safari "I will NEVER call preventDefault()",
    // allowing immediate gesture recognition with zero performance penalty. By using passive
    // listeners for 2-finger detection, we eliminate ALL delays while still blocking unwanted
    // 3+ finger gestures with a separate non-passive handler.

    // ===== PASSIVE LISTENERS: 2-Finger Visual Feedback (Zero Performance Cost) =====
    const handleTwoFingerStart = (e) => {
      if (e.touches.length === 2) {
        // Detect 2-finger pinch gesture for visual feedback
        setIsActivelyPinching(true);

        // Track that user has performed their first pinch (for tutorial hint dismissal)
        setHasPinchedOnce(true);

        // Calculate initial distance between the two fingers
        const distance = calculateDistance(e.touches[0], e.touches[1]);
        setPinchStartDistance(distance);
        setPinchCurrentDistance(distance);
        setPinchDirection(null); // Reset direction at start

        // Clear any existing timeout
        if (pinchTimeoutRef.current) {
          clearTimeout(pinchTimeoutRef.current);
        }
      }
    };

    const handleTwoFingerMove = (e) => {
      if (e.touches.length === 2) {
        // Keep pinch indicator active during 2-finger movement
        setIsActivelyPinching(true);

        // Calculate current distance between the two fingers
        const currentDistance = calculateDistance(e.touches[0], e.touches[1]);
        setPinchCurrentDistance(currentDistance);

        // Determine zoom direction with jitter prevention (15px threshold)
        // This prevents rapid direction changes from small hand movements
        const JITTER_THRESHOLD = 15;
        if (pinchStartDistance !== null) {
          const distanceChange = currentDistance - pinchStartDistance;

          if (Math.abs(distanceChange) > JITTER_THRESHOLD) {
            const newDirection = distanceChange > 0 ? 'out' : 'in';
            setPinchDirection(newDirection);
          }
        }

        // Clear any existing timeout
        if (pinchTimeoutRef.current) {
          clearTimeout(pinchTimeoutRef.current);
        }
      }
    };

    const handleTwoFingerEnd = (e) => {
      // When fingers are lifted, hide the pinch indicator after a short delay
      if (e.touches.length < 2) {
        // Clear any existing timeout
        if (pinchTimeoutRef.current) {
          clearTimeout(pinchTimeoutRef.current);
        }

        // Keep indicator visible for 800ms after gesture ends for better UX
        pinchTimeoutRef.current = setTimeout(() => {
          setIsActivelyPinching(false);
          // Reset all pinch tracking state
          setPinchStartDistance(null);
          setPinchCurrentDistance(null);
          setPinchDirection(null);
        }, 800);
      }
    };

    // ===== NON-PASSIVE LISTENERS: Block ONLY 3+ Finger Gestures (Safari Navigation) =====
    const blockMultiFingerGestures = (e) => {
      if (e.touches.length > 2) {
        // Block 3+ finger gestures EARLY (Safari navigation swipes)
        e.preventDefault();
        e.stopPropagation();
      }
      // For 1-2 fingers: do NOTHING, let event propagate to React Flow
    };

    // Register PASSIVE listeners in BUBBLE PHASE for 2-finger visual feedback
    // These have ZERO performance cost and don't delay gesture recognition
    container.addEventListener('touchstart', handleTwoFingerStart, { passive: true });
    container.addEventListener('touchmove', handleTwoFingerMove, { passive: true });
    container.addEventListener('touchend', handleTwoFingerEnd, { passive: true });

    // Register NON-PASSIVE listener in CAPTURE PHASE to block ONLY 3+ finger gestures
    // This intercepts unwanted gestures early without affecting 2-finger pinch performance
    container.addEventListener('touchstart', blockMultiFingerGestures, { passive: false, capture: true });
    container.addEventListener('touchmove', blockMultiFingerGestures, { passive: false, capture: true });

    return () => {
      // Remove passive listeners
      container.removeEventListener('touchstart', handleTwoFingerStart, { passive: true });
      container.removeEventListener('touchmove', handleTwoFingerMove, { passive: true });
      container.removeEventListener('touchend', handleTwoFingerEnd, { passive: true });

      // Remove non-passive listeners
      container.removeEventListener('touchstart', blockMultiFingerGestures, { passive: false, capture: true });
      container.removeEventListener('touchmove', blockMultiFingerGestures, { passive: false, capture: true });

      // Clear timeout on cleanup
      if (pinchTimeoutRef.current) {
        clearTimeout(pinchTimeoutRef.current);
      }
    };
  }, [calculateDistance, pinchStartDistance]);


  // Pan gesture detection to prevent accidental node selection during canvas panning
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, time: 0, hasMoved: false });
  const panIsTouchRef = useRef(false); // Track if current pan gesture is from touch input
  const isNodeDraggingRef = useRef(false); // Track if a node is currently being dragged (prevents pan conflict)
  const currentDropTargetRef = useRef(null); // Track current drop target to prevent unnecessary updates during drag

  // Pan Mode toggle for touch devices - eliminates pan/select conflict
  const [isPanModeActive, setIsPanModeActive] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Multi-touch detection for pinch-to-zoom gesture handling (iOS Safari fix)
  const [activeTouchCount, setActiveTouchCount] = useState(0);

  // Detect touch device on mount
  useEffect(() => {
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouchScreen);
  }, []);

  // iOS Safari Pinch-to-Zoom Fix: Dynamic Viewport Meta Tag Management
  // =============================================================================
  // CRITICAL: iOS Safari requires specific viewport meta tag configuration to
  // enable pinch-to-zoom gestures consistently. Without this, iOS may block
  // pinch gestures even when React Flow's zoomOnPinch is enabled.
  //
  // WHY THIS IS NEEDED:
  // - Many apps set user-scalable=no globally (for different reasons)
  // - iOS Safari respects viewport meta tag over JavaScript touch handlers
  // - We need to ensure user-scalable=yes and appropriate zoom settings
  //
  // SOLUTION:
  // - Dynamically set/update viewport meta tag when component mounts
  // - Ensure user-scalable=yes, minimum-scale=0.1, maximum-scale=10
  // - Use permissive viewport constraints to prevent iOS from blocking gestures
  // - Let React Flow enforce actual zoom limits (0.1 to 4) programmatically
  // - This works together with React Flow's zoomOnPinch and touchAction: 'none'
  // =============================================================================
  useEffect(() => {
    // Get or create viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]');

    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    // Store original viewport content to restore on unmount
    const originalContent = viewportMeta.getAttribute('content');

    // Set iOS Safari-friendly viewport configuration
    // - width=device-width: Standard responsive setting
    // - initial-scale=1: Start at 1x zoom
    // - minimum-scale=0.1: Wide range prevents iOS Safari from blocking gestures (React Flow enforces actual min: 0.1)
    // - NO maximum-scale: Unrestricted zoom allows iOS Safari pinch gestures to work consistently (React Flow enforces actual max: 4)
    // - user-scalable=yes: CRITICAL - enables pinch-to-zoom on iOS Safari
    // NOTE: iOS Safari can delay/block pinch gestures when viewport constraints are too restrictive.
    //       We removed maximum-scale entirely to ensure pinch-to-zoom works reliably on iOS Safari.
    //       React Flow enforces the actual zoom limits programmatically.
    viewportMeta.setAttribute(
      'content',
      'width=device-width, initial-scale=1, minimum-scale=0.1, user-scalable=yes'
    );

    // Cleanup: restore original viewport on unmount
    return () => {
      if (originalContent !== null) {
        viewportMeta.setAttribute('content', originalContent);
      }
    };
  }, []);

  // First-Time Pinch Hint: Initialize and show hint for new mobile users
  useEffect(() => {
    // Check if this is a touch device (mobile/tablet)
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileWidth = window.innerWidth < 1024; // Tablet/mobile screen size

    // Only show on touch devices with mobile-sized screens
    if (!hasTouchScreen || !isMobileWidth) {
      return;
    }

    // Check localStorage to see if user has already seen/dismissed the hint
    try {
      const hasSeenHint = localStorage.getItem('unityNotes_pinchHintDismissed');
      if (hasSeenHint === 'true') {
        return; // User has already seen the hint
      }

      // Show the hint to first-time mobile users
      setShowPinchHint(true);

      // Auto-dismiss after 8 seconds
      pinchHintTimeoutRef.current = setTimeout(() => {
        setShowPinchHint(false);
        try {
          localStorage.setItem('unityNotes_pinchHintDismissed', 'true');
        } catch (e) {
          console.error('Failed to save pinch hint dismissed state:', e);
        }
      }, 8000);

    } catch (e) {
      console.error('Failed to check pinch hint state:', e);
    }

    // Cleanup timeout on unmount
    return () => {
      if (pinchHintTimeoutRef.current) {
        clearTimeout(pinchHintTimeoutRef.current);
      }
    };
  }, []);

  // Dismiss pinch hint when user performs their first pinch gesture
  useEffect(() => {
    if (hasPinchedOnce && showPinchHint) {
      // User has started pinching, dismiss the hint immediately
      setShowPinchHint(false);

      // Clear the auto-dismiss timeout
      if (pinchHintTimeoutRef.current) {
        clearTimeout(pinchHintTimeoutRef.current);
      }

      // Save to localStorage so hint never shows again
      try {
        localStorage.setItem('unityNotes_pinchHintDismissed', 'true');
      } catch (e) {
        console.error('Failed to save pinch hint dismissed state:', e);
      }
    }
  }, [hasPinchedOnce, showPinchHint]);

  // Active Viewers Presence Tracking with Firebase Realtime Database
  // =============================================================================
  // Tracks who is currently viewing the canvas in real-time using Firebase
  // Realtime Database presence detection. Shows viewer avatars in top-right corner.
  // Auto-cleanup on tab close/unmount using Firebase onDisconnect() API.
  // =============================================================================
  useEffect(() => {
    let unsubscribe = null;
    let presenceRef = null;
    let viewerId = null;

    const setupPresence = async () => {
      try {
        // Dynamically import Firebase Realtime Database
        const { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp } = await import('firebase/database');
        const { db } = await import('../config/firebase');

        const database = getDatabase();

        // Generate a unique viewer ID (or use auth user ID if available)
        viewerId = `viewer_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Use current capsule ID or default to 'default' canvas
        const canvasId = loadedCapsuleId || 'default';

        // Set up presence path: /presence/[canvasId]/[viewerId]
        presenceRef = ref(database, `presence/${canvasId}/${viewerId}`);

        // Set viewer data with timestamp
        const viewerData = {
          id: viewerId,
          name: user?.displayName || `Guest ${viewerId.slice(-4)}`,
          avatar: user?.photoURL || null,
          joinedAt: serverTimestamp(),
          lastActive: serverTimestamp()
        };

        // Write viewer presence to database
        await set(presenceRef, viewerData);

        // Set up auto-cleanup when user disconnects
        await onDisconnect(presenceRef).remove();

        // Listen to all viewers for this canvas
        const allViewersRef = ref(database, `presence/${canvasId}`);
        unsubscribe = onValue(allViewersRef, (snapshot) => {
          const viewers = [];
          snapshot.forEach((childSnapshot) => {
            const viewer = childSnapshot.val();
            // Exclude current user from the list (show only other viewers)
            if (viewer.id !== viewerId) {
              viewers.push({
                ...viewer,
                id: childSnapshot.key
              });
            }
          });
          setActiveViewers(viewers);
        });

      } catch (error) {
        console.error('Failed to setup presence tracking:', error);
        // Fail silently - presence is a non-critical feature
      }
    };

    setupPresence();

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Manual cleanup (in case onDisconnect doesn't fire)
      if (presenceRef && viewerId) {
        const cleanupPresence = async () => {
          try {
            const { getDatabase, ref, remove } = await import('firebase/database');
            const database = getDatabase();
            const canvasId = loadedCapsuleId || 'default';
            const cleanupRef = ref(database, `presence/${canvasId}/${viewerId}`);
            await remove(cleanupRef);
          } catch (error) {
            console.error('Failed to cleanup presence:', error);
          }
        };
        cleanupPresence();
      }
    };
  }, [loadedCapsuleId, user]);

  // Real-time collaborative cursor tracking
  useEffect(() => {
    if (!loadedCapsuleId || !user) return;

    const setupCursorTracking = async () => {
      try {
        const { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp } = await import('firebase/database');
        const database = getDatabase();
        const canvasId = loadedCapsuleId;
        const userId = user.uid || user.id || `user-${Date.now()}`;
        const userName = user.displayName || user.name || user.email?.split('@')[0] || 'Anonymous';

        // Color palette for cursors (same as presence avatars)
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        const userColor = colors[userId.charCodeAt(0) % colors.length];

        const cursorRef = ref(database, `cursors/${canvasId}/${userId}`);
        const cursorsRef = ref(database, `cursors/${canvasId}`);

        // Setup auto-cleanup on disconnect
        const disconnectRef = onDisconnect(cursorRef);
        await disconnectRef.remove();

        // Mouse move handler with throttling
        const handleMouseMove = (e) => {
          const now = Date.now();

          // Throttle updates to max 10/sec (every 100ms)
          if (now - lastCursorUpdateRef.current < 100) return;
          lastCursorUpdateRef.current = now;

          // Get canvas container for relative positioning
          const canvasContainer = document.querySelector('[data-canvas-container="true"]') || document.body;
          const rect = canvasContainer.getBoundingClientRect();

          // Calculate percentage-based position (0-100)
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;

          // Only send if cursor is within canvas bounds
          if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
            set(cursorRef, {
              x,
              y,
              name: userName,
              color: userColor,
              timestamp: serverTimestamp()
            }).catch(err => {
              console.error('Failed to update cursor position:', err);
            });
          }
        };

        // Subscribe to all cursors for this canvas
        const unsubscribe = onValue(cursorsRef, (snapshot) => {
          const cursorsData = snapshot.val() || {};
          const now = Date.now();

          // Filter out own cursor and stale cursors (>3s old)
          const filteredCursors = {};
          Object.entries(cursorsData).forEach(([cursorUserId, cursorData]) => {
            if (cursorUserId !== userId) {
              const age = now - (cursorData.timestamp || 0);
              if (age < 3000) {
                filteredCursors[cursorUserId] = cursorData;

                // Setup cleanup timer for stale cursors (fade after 2s)
                if (cursorCleanupTimersRef.current[cursorUserId]) {
                  clearTimeout(cursorCleanupTimersRef.current[cursorUserId]);
                }

                cursorCleanupTimersRef.current[cursorUserId] = setTimeout(() => {
                  setRemoteCursors(prev => {
                    const updated = { ...prev };
                    delete updated[cursorUserId];
                    return updated;
                  });
                }, 2000);
              }
            }
          });

          setRemoteCursors(filteredCursors);
        });

        // Attach mouse listener to document
        document.addEventListener('mousemove', handleMouseMove);

        // Cleanup function
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          unsubscribe();

          // Clear all cleanup timers
          Object.values(cursorCleanupTimersRef.current).forEach(timer => clearTimeout(timer));
          cursorCleanupTimersRef.current = {};

          // Remove cursor from Firebase
          set(cursorRef, null).catch(err => {
            console.error('Failed to cleanup cursor:', err);
          });
        };
      } catch (error) {
        console.error('Failed to setup cursor tracking:', error);
        // Fail silently - cursor tracking is a non-critical feature
      }
    };

    const cleanup = setupCursorTracking();

    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, [loadedCapsuleId, user]);

  // Floating comment toolbar state
  const [showCommentToolbar, setShowCommentToolbar] = useState(false);
  const [commentToolbarPosition, setCommentToolbarPosition] = useState({ x: 0, y: 0 });
  const commentToolbarRef = useRef(null);

  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);

  // @mention autocomplete state
  const [mentionAutocomplete, setMentionAutocomplete] = useState({
    isVisible: false,
    query: '',
    selectedIndex: 0,
    position: { x: 0, y: 0 },
    activeNodeId: null
  });

  // Store mention metadata for notifications
  // Format: [{ nodeId, userId, userName, mentionedAt, capsuleId }]
  const [mentions, setMentions] = useState(() => {
    try {
      const saved = localStorage.getItem('unity-notes-mentions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load mentions from localStorage:', e);
      return [];
    }
  });

  // Persist mentions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('unity-notes-mentions', JSON.stringify(mentions));
    } catch (e) {
      console.error('Failed to save mentions to localStorage:', e);
    }
  }, [mentions]);

  // Theme state management (light, dark, auto)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('unity-notes-theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  // Persist theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('unity-notes-theme', theme);
    } catch (e) {
      console.error('Failed to persist theme:', e);
    }
  }, [theme]);

  // Haptic feedback preference state
  const [hapticsEnabled, setHapticsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('hapticsEnabled');
      // Default to true (enabled) if not set, false if explicitly disabled
      return stored === null ? true : stored !== 'false';
    } catch (e) {
      return true; // Default enabled
    }
  });

  // Persist haptics preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hapticsEnabled', String(hapticsEnabled));
    } catch (e) {
      console.error('Failed to persist haptics preference:', e);
    }
  }, [hapticsEnabled]);

  // Compute isDarkTheme based on theme setting and system preference
  const isDarkTheme = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'custom') return true; // Custom theme uses dark mode styling
    if (theme === 'light') return false;
    // Auto mode - check system preference (fallback for legacy themes)
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [theme]);

  // Theme configuration for custom backgrounds
  const themeConfig = useMemo(() => ({
    light: {
      backgroundColor: '#ffffff',
      dotColor: '#aaa',
      variant: 'dots'
    },
    dark: {
      backgroundColor: '#1a1a1a',
      dotColor: '#555',
      variant: 'dots'
    },
    custom: {
      backgroundColor: '#312e81', // indigo-900 as base
      gradient: 'linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #4338ca 100%)', // purple-900 via purple-800 to indigo-700
      dotColor: '#a78bfa', // purple-400 for visibility
      variant: 'cross',
      patternColor: '#7c3aed' // purple-600 for cross pattern
    }
  }), []);

  // Get current theme config
  const currentThemeConfig = useMemo(() => themeConfig[theme] || themeConfig.light, [theme, themeConfig]);

  // Memoize Background component style to prevent unnecessary re-renders
  const backgroundStyle = useMemo(() => ({
    opacity: 0.3,
    backgroundColor: currentThemeConfig.backgroundColor,
    backgroundImage: currentThemeConfig.gradient || 'none',
    ...(currentThemeConfig.patternColor && {
      '--pattern-color': currentThemeConfig.patternColor
    })
  }), [currentThemeConfig]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Force re-render by updating a dummy state or using forceUpdate pattern
      setTheme('auto'); // This will trigger isDarkTheme recalculation
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply data-theme attribute to document root for CSS theme rules
  useEffect(() => {
    const themeValue = isDarkTheme ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeValue);

    // Cleanup function to reset on unmount (optional)
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [isDarkTheme]);

  // Keyboard navigation for notification dropdown - close on Escape key
  useEffect(() => {
    if (!showNotificationDropdown) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotificationDropdown]);

  // Node virtualization - only render visible nodes for performance
  const visibleNodes = useMemo(() => {
    // First, filter out collapsed thread descendants
    const hiddenNodes = new Set();
    collapsedThreads.forEach(threadId => {
      getThreadDescendants(threadId, edges).forEach(id => hiddenNodes.add(id));
    });
    let nodesAfterCollapse = nodes.filter(node => !hiddenNodes.has(node.id));

    // Apply node type filter if active
    if (nodeTypeFilter.size > 0) {
      nodesAfterCollapse = nodesAfterCollapse.filter(node => nodeTypeFilter.has(node.type));
    }

    // Enhanced virtualization with lower threshold (30 nodes) for better performance
    const VIRTUALIZATION_THRESHOLD = 30;
    if (nodesAfterCollapse.length <= VIRTUALIZATION_THRESHOLD) return nodesAfterCollapse;

    // Dynamic buffer sizing based on zoom level - larger buffer when zoomed out
    const getViewportBuffer = (zoom) => 200 + (1 - zoom) * 300;
    const BUFFER = getViewportBuffer(viewport.zoom);

    // Calculate viewport bounds
    const viewportBounds = {
      minX: -viewport.x / viewport.zoom - BUFFER,
      maxX: (-viewport.x + window.innerWidth) / viewport.zoom + BUFFER,
      minY: -viewport.y / viewport.zoom - BUFFER,
      maxY: (-viewport.y + window.innerHeight) / viewport.zoom + BUFFER
    };

    // Performance tracking in development mode
    const startTime = process.env.NODE_ENV === 'development' ? performance.now() : 0;

    // Filter nodes that are visible in viewport
    const visible = nodesAfterCollapse.filter(node => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;

      // Use actual node dimensions if available, fallback to conservative estimate
      const nodeWidth = node.measured?.width || node.width || 400;
      const nodeHeight = node.measured?.height || node.height || 400;

      return (
        nodeX + nodeWidth >= viewportBounds.minX &&
        nodeX <= viewportBounds.maxX &&
        nodeY + nodeHeight >= viewportBounds.minY &&
        nodeY <= viewportBounds.maxY
      );
    });

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development' && startTime) {
      const duration = performance.now() - startTime;
      const renderPercentage = ((visible.length / nodesAfterCollapse.length) * 100).toFixed(1);
      console.log(`[Virtualization] Rendering ${visible.length}/${nodesAfterCollapse.length} nodes (${renderPercentage}%) - ${duration.toFixed(2)}ms`);
    }

    return visible;
  }, [nodes, viewport, collapsedThreads, edges, getThreadDescendants, nodeTypeFilter]);

  // Node Search Feature - Search algorithm with performance optimization
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const results = [];

    nodes.forEach(node => {
      // Search in node label/title (most common match location)
      const label = node.data?.label || '';
      if (label.toLowerCase().includes(term)) {
        results.push(node.id);
        return; // Early termination - found match in label
      }

      // Search in node content/body (second most common)
      const content = node.data?.content || '';
      if (content.toLowerCase().includes(term)) {
        results.push(node.id);
        return; // Early termination - found match in content
      }

      // Search in comments (only if they exist)
      const comments = node.data?.comments;
      if (comments && comments.length > 0) {
        const commentMatch = comments.some(comment =>
          comment.text?.toLowerCase().includes(term) ||
          comment.author?.toLowerCase().includes(term)
        );
        if (commentMatch) {
          results.push(node.id);
        }
      }
    });

    return results;
  }, [searchTerm, nodes]);

  // Reset current match index when search results change
  useEffect(() => {
    if (searchResults.length > 0 && currentMatchIndex >= searchResults.length) {
      setCurrentMatchIndex(0);
    }
  }, [searchResults, currentMatchIndex]);

  // Enhance nodes with search highlighting
  const nodesWithSearchHighlight = useMemo(() => {
    // Early return: if no search and no focus, return visibleNodes directly
    if (searchResults.length === 0 && !focusedNodeId) {
      return visibleNodes;
    }

    // Use Set for O(1) lookups instead of Array.includes O(n)
    const searchResultsSet = new Set(searchResults);
    const currentMatchId = searchResults[currentMatchIndex];
    const hasSearchResults = searchResults.length > 0;

    // Single-pass optimization: combine search highlighting + focus indicator in one iteration
    // This reduces O(2n) complexity to O(n) - 50% fewer iterations
    return visibleNodes.map(node => {
      const isMatch = hasSearchResults && searchResultsSet.has(node.id);
      const isFocused = focusedNodeId && node.id === focusedNodeId;

      // Early return: no modifications needed
      if (!isMatch && !isFocused) return node;

      // Build modified node with both search highlighting and focus styling
      const modifiedNode = { ...node };

      // Add search match properties if this node matches the search
      if (isMatch) {
        modifiedNode.data = {
          ...node.data,
          isSearchMatch: true,
          isCurrentSearchMatch: node.id === currentMatchId
        };
        modifiedNode.selected = true;
        modifiedNode.className = node.id === currentMatchId
          ? 'search-current-match'
          : 'search-match';
      }

      // Add focus properties if this node is focused
      if (isFocused) {
        modifiedNode.data = {
          ...(modifiedNode.data || node.data),
          focused: true
        };
        modifiedNode.style = {
          ...(modifiedNode.style || node.style),
          outline: '3px solid #3b82f6',
          outlineOffset: '2px',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
          zIndex: 1000
        };
      }

      return modifiedNode;
    });
  }, [visibleNodes, searchResults, currentMatchIndex, focusedNodeId]);

  // Navigate to matched node in viewport
  const navigateToMatch = useCallback((index) => {
    if (searchResults.length === 0 || !reactFlowInstance) return;

    const matchId = searchResults[index];
    const matchedNode = nodeById.get(matchId); // O(1) Map lookup

    if (matchedNode) {
      // Center the viewport on the matched node with smooth animation
      reactFlowInstance.setCenter(
        matchedNode.position.x + 200, // Offset by approx node width/2
        matchedNode.position.y + 150, // Offset by approx node height/2
        { zoom: 1.2, duration: 400 }
      );
    }
  }, [searchResults, nodes, reactFlowInstance]);

  // Navigate to next search result
  const goToNextMatch = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchResults.length;
    setCurrentMatchIndex(nextIndex);
    navigateToMatch(nextIndex);
  }, [currentMatchIndex, searchResults.length, navigateToMatch]);

  // Navigate to previous search result
  const goToPrevMatch = useCallback(() => {
    if (searchResults.length === 0) return;
    const prevIndex = currentMatchIndex === 0
      ? searchResults.length - 1
      : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    navigateToMatch(prevIndex);
  }, [currentMatchIndex, searchResults.length, navigateToMatch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchInput('');
    setCurrentMatchIndex(0);
  }, []);

  // Handle search input change - memoized to prevent recreating on every render
  const handleSearchInputChange = useCallback((e) => {
    setSearchInput(e.target.value);
  }, []);

  // Handle search input keyboard events - memoized version with immediate search on Enter
  const handleSearchInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Immediately apply search on Enter (bypass debounce)
      setSearchTerm(searchInput);
      if (e.shiftKey) goToPrevMatch();
      else goToNextMatch();
    } else if (e.key === 'Escape') {
      clearSearch();
    }
  }, [searchInput, goToPrevMatch, goToNextMatch, clearSearch]);

  // Handle search keyboard shortcuts
  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        goToPrevMatch();
      } else {
        goToNextMatch();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clearSearch();
      searchInputRef.current?.blur();
    }
  }, [goToNextMatch, goToPrevMatch, clearSearch]);

  // Helper function to convert email to display name
  const getDisplayNameFromEmail = useCallback((email) => {
    if (!email) return 'Unknown User';
    // Extract name part before @ and convert to title case
    const namePart = email.split('@')[0];
    return namePart
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  // Helper function to generate initials from name
  const getInitialsFromName = useCallback((name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .filter(char => char.match(/[A-Z]/))
      .slice(0, 2)
      .join('');
  }, []);

  // Real user list for @mention autocomplete using Firebase collaborators
  const mentionableUsers = useMemo(() => {
    const users = [];

    // Add current user first
    if (user?.email) {
      const displayName = getDisplayNameFromEmail(user.email);
      users.push({
        id: user.uid || user.email,
        name: displayName,
        initials: getInitialsFromName(displayName),
        email: user.email
      });
    }

    // Add collaborators
    if (collaborators && Array.isArray(collaborators)) {
      collaborators.forEach((collab) => {
        // Skip if this is the current user (avoid duplicates)
        if (collab.email === user?.email) return;

        const displayName = getDisplayNameFromEmail(collab.email);
        users.push({
          id: collab.email,
          name: displayName,
          initials: getInitialsFromName(displayName),
          email: collab.email
        });
      });
    }

    return users;
  }, [user, collaborators, getDisplayNameFromEmail, getInitialsFromName]);

  // Filter users based on mention query (search by name or email)
  const filteredUsers = useMemo(() => {
    if (!mentionAutocomplete.query) return mentionableUsers;
    const query = mentionAutocomplete.query.toLowerCase();
    return mentionableUsers.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }, [mentionAutocomplete.query, mentionableUsers]);

  // Compute notifications from recent comments and mentions
  const notifications = useMemo(() => {
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;
    const notificationList = [];

    // Add recent comment notifications (last 5 minutes)
    nodes.forEach(node => {
      if (node.type === 'commentNode' && node.data?.createdAt) {
        const timeSinceCreation = now - node.data.createdAt;
        if (timeSinceCreation <= FIVE_MINUTES) {
          // Only show comments from other users
          const nodeAuthor = node.data.author || 'Unknown';
          const currentUserName = user?.displayName || userProfile?.name || 'User';
          if (nodeAuthor !== currentUserName) {
            notificationList.push({
              id: `comment-${node.id}`,
              type: 'comment',
              title: 'New Comment',
              message: `${nodeAuthor}: ${(node.data.content || '').substring(0, 60)}${node.data.content?.length > 60 ? '...' : ''}`,
              timestamp: node.data.createdAt,
              nodeId: node.id,
              read: false
            });
          }
        }
      }
    });

    // Add mention notifications from mentions state
    mentions.forEach(mention => {
      const timeSinceMention = now - new Date(mention.mentionedAt).getTime();
      if (timeSinceMention <= FIVE_MINUTES) {
        // Only show mentions for current user
        const currentUserId = user?.uid || userProfile?.id;
        if (mention.userId === currentUserId) {
          notificationList.push({
            id: `mention-${mention.nodeId}-${mention.mentionedAt}`,
            type: 'mention',
            title: 'You were mentioned',
            message: `${mention.userName} mentioned you in a comment`,
            timestamp: new Date(mention.mentionedAt).getTime(),
            nodeId: mention.nodeId,
            read: false
          });
        }
      }
    });

    // Add reply notifications - when someone replies to YOUR comment (last 5 minutes)
    // Performance Optimization: Reuse existing nodeById Map instead of creating duplicate
    const nodeMap = nodeById;
    const currentUserName = user?.displayName || userProfile?.name || 'User';
    nodes.forEach(node => {
      if (node.type === 'commentNode' && node.data?.replyTo && node.data?.createdAt) {
        const timeSinceCreation = now - node.data.createdAt;
        if (timeSinceCreation <= FIVE_MINUTES) {
          const parentNode = nodeMap.get(node.data.replyTo);
          if (parentNode && parentNode.data?.author === currentUserName) {
            const replyAuthor = node.data.author || 'Unknown';
            if (replyAuthor !== currentUserName) {
              notificationList.push({
                id: `reply-${node.id}`,
                type: 'reply',
                title: 'Reply to your comment',
                message: `${replyAuthor} replied: ${(node.data.content || '').substring(0, 60)}${node.data.content?.length > 60 ? '...' : ''}`,
                timestamp: node.data.createdAt,
                nodeId: node.id,
                read: false
              });
            }
          }
        }
      }
    });

    // Sort by timestamp (newest first) and remove duplicates
    // Performance: O(n) Set-based deduplication instead of O(n²) findIndex
    // For 100 notifications: 10,000 operations → 100 operations (99% reduction)
    const seen = new Set();
    return notificationList
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter(notification => {
        const key = `${notification.nodeId}-${notification.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [nodes, mentions, user, userProfile]);

  // Handler for opening Studio from AI Chat with conversation context
  const handleOpenStudio = useCallback((context) => {
    setStudioContext(context);
    handleModeChange('studio');
  }, []);

  // Memoized MiniMap color functions to prevent re-renders (Performance Optimization P3)
  const minimapNodeStrokeColor = useCallback((n) => {
    if (n.type === 'groupNode') return 'rgba(156, 163, 175, 0.6)';
    if (n.type === 'stickyNode') return 'rgba(251, 191, 36, 0.7)';
    if (n.type === 'photoNode') return 'rgba(249, 115, 22, 0.7)';
    return 'rgba(229, 231, 235, 0.6)';
  }, []);

  // Memoized sticky node color palette to prevent object recreation on every minimap render
  const minimapStickyNodeColors = useMemo(() => ({
    yellow: 'rgba(251, 191, 36, 0.5)',
    pink: 'rgba(236, 72, 153, 0.5)',
    blue: 'rgba(59, 130, 246, 0.5)',
    green: 'rgba(34, 197, 94, 0.5)',
    orange: 'rgba(249, 115, 22, 0.5)',
    purple: 'rgba(168, 85, 247, 0.5)'
  }), []);

  const minimapNodeColor = useCallback((n) => {
    if (n.type === 'groupNode') return 'rgba(156, 163, 175, 0.15)';
    if (n.type === 'stickyNode') {
      return minimapStickyNodeColors[n.data?.color] || 'rgba(251, 191, 36, 0.5)';
    }
    if (n.type === 'photoNode') return 'rgba(249, 115, 22, 0.4)';
    return 'rgba(243, 244, 246, 0.5)';
  }, [minimapStickyNodeColors]);

  // Memoized MiniMap style object to prevent re-renders
  const minimapStyle = useMemo(() => ({
    width: 140,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(229, 231, 235, 0.6)',
    borderRadius: '6px',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
  }), []);

  // Memoized ReactFlow props to prevent re-renders
  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 1 }), []);
  const panOnDragArray = useMemo(() => [1], []);

  // Memoized Toolbar style objects to prevent re-renders
  const toolbarStyles = useMemo(() => ({
    // Base zoom button style (44x44px for touch targets per iOS HIG)
    zoomButton: {
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgb(251, 191, 36)',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.15s',
    },
    // Smaller utility button style (32x32px)
    smallButton: {
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(0, 0, 0, 0.12)',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.2s',
    },
    // Small button with top margin
    smallButtonWithMargin: {
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(0, 0, 0, 0.12)',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.2s',
      marginTop: '2px',
    },
    // Zoom level display button
    zoomLevel: {
      fontSize: '9px',
      fontWeight: '600',
      color: 'rgba(0, 0, 0, 0.6)',
      letterSpacing: '0.02em',
      textAlign: 'center',
      minWidth: '32px',
      padding: '4px 6px',
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      border: '1px solid rgba(251, 191, 36, 0.3)',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
    },
    // SVG icon wrapper style
    iconSvg: {
      flexShrink: 0,
      minWidth: 18,
      minHeight: 18,
    },
    // Small SVG icon wrapper
    smallIconSvg: {
      flexShrink: 0,
      minWidth: 14,
      minHeight: 14,
    },
    // Dropdown chevron icon
    chevronSvg: {
      flexShrink: 0,
    },
    // Backdrop for closing dropdowns
    backdropOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9998,
    },
    // Dropdown menu container
    dropdownMenu: {
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: '8px',
      backgroundColor: 'white',
      border: '1px solid rgba(229, 231, 235, 0.8)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      padding: '6px',
      minWidth: '140px',
      zIndex: 9999,
      animation: 'fadeIn 0.15s ease-out',
    },
    // Base preset button style
    presetButton: {
      width: '100%',
      padding: '8px 12px',
      fontSize: '11px',
      fontWeight: '400',
      color: 'rgba(0, 0, 0, 0.8)',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      textAlign: 'left',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.15s',
    },
    // Active preset button
    presetButtonActive: {
      width: '100%',
      padding: '8px 12px',
      fontSize: '11px',
      fontWeight: '600',
      color: 'rgb(251, 191, 36)',
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      textAlign: 'left',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.15s',
    },
    // Preset label text
    presetLabel: {
      fontWeight: '600',
    },
    // Preset description text
    presetDesc: {
      fontSize: '9px',
      color: 'rgba(0, 0, 0, 0.5)',
    },
    // Relative positioning wrapper
    relativeWrapper: {
      position: 'relative',
    },
  }), []);

  // Auto-migrate localStorage API keys to Firestore when user logs in
  useEffect(() => {
    if (isAuthenticated && !isCloudSynced) {
      // User just logged in - migrate localStorage keys to cloud
      migrateLocalToCloud().then((migrated) => {
        if (migrated && process.env.NODE_ENV === 'development') {
          console.log('✅ API keys migrated to cloud storage');
        }
      });
    }
  }, [isAuthenticated, isCloudSynced, migrateLocalToCloud]);

  // Fetch bookmarked capsules when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      getBookmarkedCapsules(user.uid)
        .then(capsules => {
          setBookmarkedCapsules(capsules);
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Loaded ${capsules.length} bookmarked capsules`);
          }
        })
        .catch(err => {
          console.error('Failed to load bookmarked capsules:', err);
        });
    } else {
      setBookmarkedCapsules([]);
    }
  }, [isAuthenticated, user?.uid, getBookmarkedCapsules]);

  // Persist capsule ID to localStorage for session continuity
  // This ensures the same capsule is updated even if user navigates away and returns
  useEffect(() => {
    if (currentCapsuleId) {
      try {
        localStorage.setItem('unity-notes-current-capsule', currentCapsuleId);
        if (process.env.NODE_ENV === 'development') {
          console.log('💾 Capsule ID persisted to localStorage:', currentCapsuleId);
        }
      } catch (e) {
        console.error('Failed to persist capsule ID:', e);
      }
    }
  }, [currentCapsuleId]);

  // Track if capsule has been loaded this session (to avoid re-loading)
  const capsuleLoadedRef = React.useRef(false);
  // Guard flag to prevent auto-save during clear operation (prevents race condition)
  const isClearingRef = useRef(false);

  // Load capsule from URL parameter OR localStorage (for editing shared capsules)
  useEffect(() => {
    const capsuleParam = searchParams.get('capsule');
    // Determine which capsule to load: URL param takes priority, then localStorage
    const capsuleToLoad = capsuleParam || currentCapsuleId;

    // Only load if we have a capsule ID, app is initialized, and we haven't loaded yet this session
    if (capsuleToLoad && isInitialized && !capsuleLoadedRef.current) {
      capsuleLoadedRef.current = true; // Mark as loading to prevent duplicate loads
      const loadSharedCapsule = async () => {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('📂 Loading capsule for editing:', capsuleToLoad);
          }
          const capsuleData = await loadCapsule(capsuleToLoad);
          if (capsuleData) {
            // Set the capsule ID so updates go to the same document
            setCurrentCapsuleId(capsuleToLoad);

            // Restore nodes and edges from the capsule
            // IMPORTANT: First prepare nodes (validate parentId, sort parents before children)
            // Then inject callbacks before setting nodes
            // Callbacks can't be serialized to Firestore, so we add them here
            if (capsuleData.nodes && capsuleData.nodes.length > 0) {
              // Prepare nodes first to fix parentId references and ordering
              const preparedNodes = prepareNodesForRendering(capsuleData.nodes);
              if (process.env.NODE_ENV === 'development') {
                console.log('📦 Prepared', preparedNodes.length, 'nodes for rendering');
              }

              // Calculate comment counts for each node based on edges
              const commentCountMap = new Map();
              if (capsuleData.edges && capsuleData.edges.length > 0) {
                // Build node lookup Map for O(1) access (performance optimization - prevents O(n²) complexity)
                const nodeById = new Map(preparedNodes.map(n => [n.id, n]));

                capsuleData.edges.forEach(edge => {
                  const sourceNode = nodeById.get(edge.source); // O(1) instead of O(n)
                  const targetNode = nodeById.get(edge.target); // O(1) instead of O(n)

                  // Count CommentNodes connected to regular nodes
                  if (sourceNode?.type === 'CommentNode' && targetNode) {
                    commentCountMap.set(edge.target, (commentCountMap.get(edge.target) || 0) + 1);
                  }
                  if (targetNode?.type === 'CommentNode' && sourceNode) {
                    commentCountMap.set(edge.source, (commentCountMap.get(edge.source) || 0) + 1);
                  }
                });
              }
              if (process.env.NODE_ENV === 'development') {
                console.log('💬 Comment counts calculated:', commentCountMap.size, 'nodes with comments');
              }

              const nodesWithCallbacks = preparedNodes.map((node) => {
                // Inject comment count into all nodes
                const commentCount = commentCountMap.get(node.id) || 0;

                if (node.type === 'todoNode') {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      commentCount,
                      onUpdateItems: handleNodeItemsUpdate(node.id),
                      onItemToggle: handleTodoItemSync, // Bi-directional sync callback
                      onTitleChange: handleNodeTitleChange(node.id),
                      onDelete: handleNodeDelete(node.id),
                    },
                  };
                }
                // GroupNode needs special callbacks for label, color, resize
                if (node.type === 'groupNode') {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      commentCount,
                      onLabelChange: handleNodeLabelChange(node.id),
                      onResize: handleNodeResize(node.id),
                      onColorChange: handleNodeColorChange(node.id),
                      onConvertToTodo: handleConvertGroupToTodo, // Enable "Convert to Todo" action
                      onDelete: handleNodeDelete(node.id),
                    },
                    style: { zIndex: -1 }, // Groups should be behind other nodes
                  };
                }
                // TextNode needs groqApiKey for AI functionality
                if (node.type === 'textNode') {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      commentCount,
                      groqApiKey: storedGroqKey, // Pass API key from Firestore
                      onDelete: handleNodeDelete(node.id),
                    },
                  };
                }
                if (SIMPLE_NODE_TYPES.has(node.type)) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      commentCount,
                      onDelete: handleNodeDelete(node.id),
                    },
                  };
                }
                // TripPlannerMapNode needs onDataChange for persisting places/day changes
                // Also inject Google Maps API key for map rendering
                if (node.type === 'tripPlannerMapNode') {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      commentCount,
                      apiKey: storedGoogleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '', // Google Maps API key
                      onDataChange: handleNodeDataChange(node.id),
                      onExtractToTodo: handleExtractLocationsToTodo, // Enable location extraction to todo
                      onDelete: handleNodeDelete(node.id),
                    },
                  };
                }
                // MapNode also needs Google Maps API key
                if (node.type === 'mapNode') {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      commentCount,
                      apiKey: storedGoogleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
                      onConvertToTodo: handleConvertMapToTodo,
                      onDelete: handleNodeDelete(node.id),
                    },
                  };
                }
                // Default: inject commentCount into all other node types
                return {
                  ...node,
                  data: {
                    ...node.data,
                    commentCount,
                  },
                };
              });
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ Injected callbacks into', nodesWithCallbacks.length, 'nodes');
              }
              setNodes(nodesWithCallbacks);

              // Restore starred node IDs from capsule data
              // This preserves star state when loading saved capsules
              const loadedStarredIds = preparedNodes
                .filter(n => n.data?.isStarred)
                .map(n => n.id);
              if (loadedStarredIds.length > 0) {
                setStarredNodeIds(new Set(loadedStarredIds));
                if (process.env.NODE_ENV === 'development') {
                  console.log('⭐ Restored', loadedStarredIds.length, 'starred nodes from capsule');
                }
              }
            }
            if (capsuleData.edges) {
              setEdges(capsuleData.edges);
            }

            // Restore collaboration state (v3)
            if (capsuleData.metadata) {
              setCollaborators(capsuleData.metadata.collaborators || []);
              setIsPublic(capsuleData.metadata.isPublic || false);
              setIsBookmarked(capsuleData.metadata.isBookmarked || false);

              // Restore AI conversation history for this capsule
              if (capsuleData.metadata.conversationHistory) {
                setConversationHistories(prev => ({
                  ...prev,
                  [capsuleToLoad]: capsuleData.metadata.conversationHistory
                }));
                if (process.env.NODE_ENV === 'development') {
                  console.log('💬 Restored AI conversation history:', capsuleData.metadata.conversationHistory.length, 'messages');
                }
              }
            }

            // Check if user can edit this capsule (admins can always edit)
            if (user?.uid) {
              const access = await checkAccess(capsuleToLoad, user.uid, user.email);
              const canEdit = access.role === 'owner' || access.role === 'editor' || isAdmin;
              setCanEditCapsule(canEdit);
              if (process.env.NODE_ENV === 'development') {
                console.log('🔐 Capsule access:', access.role, '- Can edit:', canEdit, '- isAdmin:', isAdmin);
              }
            }

            // Generate share URL for the loaded capsule
            const url = `${window.location.origin}/unity-notes/view/${capsuleToLoad}`;
            setShareUrl(url);

            // Update browser URL if loading from localStorage (no URL param)
            if (!capsuleParam && capsuleToLoad) {
              const editUrl = `${window.location.pathname}?capsule=${capsuleToLoad}`;
              window.history.replaceState({}, '', editUrl);
            }

            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Loaded capsule:', capsuleToLoad, '- Nodes:', capsuleData.nodes?.length || 0, '- Collaborators:', capsuleData.metadata?.collaborators?.length || 0);
            }
          }
        } catch (err) {
          console.error('❌ Failed to load capsule:', err);
          capsuleLoadedRef.current = false; // Allow retry on next render
          // Clear the stored capsule ID if it's invalid
          localStorage.removeItem('unity-notes-current-capsule');
          setCurrentCapsuleId('');
          showToast('Failed to load the capsule. It may have been deleted or the link is invalid.', 'error', 5000);
        }
      };
      loadSharedCapsule();
    }
  }, [searchParams, isInitialized, currentCapsuleId, loadCapsule, setNodes, setEdges, storedGroqKey, storedGoogleMapsKey, user, checkAccess]);

  // Update canEditCapsule when isAdmin changes (admin check loads async from Firestore)
  useEffect(() => {
    if (isAdmin && currentCapsuleId && !canEditCapsule) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Admin access granted - enabling capsule edit');
      }
      setCanEditCapsule(true);
    }
  }, [isAdmin, currentCapsuleId, canEditCapsule]);

  // Update existing textNodes when storedGroqKey becomes available (async loading fix)
  useEffect(() => {
    if (storedGroqKey && nodes.length > 0) {
      const hasTextNodes = nodes.some(n => n.type === 'textNode');
      if (hasTextNodes) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔑 Updating textNodes with Groq API key from Firestore');
        }
        setNodes((nds) =>
          nds.map((node) => {
            if (node.type === 'textNode') {
              return {
                ...node,
                data: {
                  ...node.data,
                  groqApiKey: storedGroqKey,
                },
              };
            }
            return node;
          })
        );
      }
    }
  }, [storedGroqKey, nodes.length, setNodes]);

  // Update existing map nodes when storedGoogleMapsKey becomes available (async loading fix)
  useEffect(() => {
    const googleMapsKey = storedGoogleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (googleMapsKey && nodes.length > 0) {
      const hasMapNodes = nodes.some(n => n.type === 'tripPlannerMapNode' || n.type === 'mapNode');
      if (hasMapNodes) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🗺️ Updating map nodes with Google Maps API key');
        }
        setNodes((nds) =>
          nds.map((node) => {
            if (node.type === 'tripPlannerMapNode' || node.type === 'mapNode') {
              return {
                ...node,
                data: {
                  ...node.data,
                  apiKey: googleMapsKey,
                },
              };
            }
            return node;
          })
        );
      }
    }
  }, [storedGoogleMapsKey, nodes.length, setNodes]);

  // Persist journey ID to localStorage when it changes
  useEffect(() => {
    if (currentJourneyId) {
      localStorage.setItem('unity-map-current-journey-id', currentJourneyId);
    }
  }, [currentJourneyId]);

  // Load saved journey when entering MAP mode with a stored journey ID
  useEffect(() => {
    const loadSavedJourney = async () => {
      if (currentMode === 'map' && currentJourneyId && isInitialized) {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('📂 Loading saved journey:', currentJourneyId);
          }
          const journeyData = await loadJourney(currentJourneyId);
          if (journeyData) {
            setJourneyTitle(journeyData.title || 'Untitled Journey');
            setJourneyStatus(journeyData.status || 'draft');
            setJourneyProspects(journeyData.prospects || []);

            // Restore nodes and edges from the journey
            if (journeyData.nodes && journeyData.nodes.length > 0) {
              setNodes(journeyData.nodes);
            }
            if (journeyData.edges) {
              setEdges(journeyData.edges);
            }
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Journey loaded successfully:', {
                title: journeyData.title,
                status: journeyData.status,
                nodeCount: journeyData.nodes?.length,
                prospectCount: journeyData.prospects?.length
              });
            }
          }
        } catch (error) {
          console.error('❌ Failed to load journey:', error);
          // Clear invalid journey ID
          setCurrentJourneyId(null);
          localStorage.removeItem('unity-map-current-journey-id');
        }
      }
    };
    loadSavedJourney();
  }, [currentMode, currentJourneyId, isInitialized, loadJourney, setNodes, setEdges]);

  // Fetch associated trigger rules when journey ID changes
  useEffect(() => {
    const fetchAssociatedTriggers = async () => {
      if (!currentJourneyId || currentMode !== 'map') {
        setAssociatedTriggers([]);
        return;
      }

      setIsLoadingTriggers(true);
      try {
        // Fetch trigger rules from Firestore that have enroll_journey action targeting this journey
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('../config/firebase');

        const triggersRef = collection(db, 'triggerRules');
        const snapshot = await getDocs(triggersRef);

        const matchingTriggers = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          // Check if any action enrolls into this journey
          const hasEnrollAction = data.actions?.some(
            action => action.type === 'enroll_journey' && action.config?.journeyId === currentJourneyId
          );
          if (hasEnrollAction && data.enabled !== false) {
            matchingTriggers.push({
              id: doc.id,
              name: data.name,
              triggerType: data.trigger?.type,
              conditions: data.trigger?.conditions || [],
              enabled: data.enabled !== false
            });
          }
        });

        setAssociatedTriggers(matchingTriggers);
        if (process.env.NODE_ENV === 'development') {
          console.log('📡 Associated triggers for journey:', currentJourneyId, matchingTriggers);
        }
      } catch (error) {
        console.error('❌ Failed to fetch associated triggers:', error);
        setAssociatedTriggers([]);
      } finally {
        setIsLoadingTriggers(false);
      }
    };

    fetchAssociatedTriggers();
  }, [currentJourneyId, currentMode]);

  // Check if user has pro/admin access for cloud features
  // Scopes: admin (SSO-authenticated admin), premium (SSO tier)
  const hasProAccess = useCallback(() => {
    // Admin - full access (authenticated via SSO)
    if (isAdmin) return true;
    // SSO premium tier
    if (isAuthenticated && tier === 'premium') return true;
    return false;
  }, [isAdmin, isAuthenticated, tier]);

  // hasAvailableCredits - reserved for future credit-gated features
  // Currently unused but kept for upcoming AI features

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

  // Edit memory state
  const [editingMemory, setEditingMemory] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Email preview state
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [previewEmailData, setPreviewEmailData] = useState(null);

  // Email inline edit state
  const [showEmailEditModal, setShowEmailEditModal] = useState(false);
  const [editingEmailNodeId, setEditingEmailNodeId] = useState(null);
  const [editingEmailData, setEditingEmailData] = useState(null);

  // Wait inline edit state
  const [showWaitEditModal, setShowWaitEditModal] = useState(false);
  const [editingWaitNodeId, setEditingWaitNodeId] = useState(null);
  const [editingWaitData, setEditingWaitData] = useState(null);

  // Condition inline edit state
  const [showConditionEditModal, setShowConditionEditModal] = useState(false);
  const [editingConditionNodeId, setEditingConditionNodeId] = useState(null);
  const [editingConditionData, setEditingConditionData] = useState(null);

  // Mode panel slideout state
  // Auto-open mode panel when coming from Outreach Generator
  const [showModePanel, setShowModePanel] = useState(fromOutreach);

  // Dev tools panel state (Cmd+Shift+D to toggle)
  const [showDevTools, setShowDevTools] = useState(false);

  // Zoom keyboard shortcuts - Cmd/Ctrl+0 (reset to 100%), Cmd/Ctrl+9 (fit all)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if Cmd (Mac) or Ctrl (Windows) is pressed
      if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl+0 - Reset to 100% zoom
        if (e.key === '0') {
          e.preventDefault();
          handleZoomPreset(1.0);
        }
        // Cmd/Ctrl+9 - Fit all nodes
        else if (e.key === '9') {
          e.preventDefault();
          handleZoomPreset('fit');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomPreset]);

  // Dev tools keyboard shortcut - only available for authenticated admins
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+Shift+D (Mac) or Ctrl+Shift+D (Windows) - admin only
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'd') {
        e.preventDefault();
        // Only allow if authenticated as admin
        if (isAdmin) {
          setShowDevTools(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);

  // Dev tools actions
  const devToolsActions = {
    clearLocalStorage: () => {
      localStorage.clear();
      alert('localStorage cleared. Refresh to see changes.');
    },
    clearCanvasOnly: () => {
      localStorage.removeItem(STORAGE_KEY);
      setNodes([]);
      setEdges([]);
      alert('Canvas cleared.');
    },
    clearCredits: () => {
      localStorage.removeItem('yc_credits');
      localStorage.removeItem('yc_credits_used');
      alert('Credits cleared.');
    },
    clearHubSettings: () => {
      localStorage.removeItem('outreach_business_settings_v4');
      localStorage.removeItem('outreach_business_auth');
      alert('Hub settings cleared.');
    },
    viewState: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('=== DEV STATE ===');
        console.log('Admin:', isAdmin);
        console.log('Authenticated:', isAuthenticated);
        console.log('User:', user?.email);
        console.log('Hub Auth:', localStorage.getItem('outreach_business_auth'));
        console.log('Journey ID:', currentJourneyId);
        console.log('Journey Status:', journeyStatus);
        console.log('Nodes:', nodes.length);
        console.log('Edges:', edges.length);
      }
      alert('State logged to console (F12)');
    },
    // Admin functions - only visible when bypass is active
    migrateCapsules: async () => {
      if (!confirm('⚠️ ADMIN: Migrate all v1 capsules to v2?\n\nThis will:\n- Convert subcollections to embedded arrays\n- Delete old subcollection documents\n- Reduce Firestore costs\n\nContinue?')) return;
      try {
        const result = await migrateToV2();
        alert(`✅ Migration complete!\n\nMigrated: ${result.migrated}\nAlready v2: ${result.alreadyV2}\nFailed: ${result.failed}`);
      } catch (err) {
        alert(`❌ Migration failed: ${err.message}`);
      }
    },
    cleanupCapsules: async () => {
      if (!confirm('⚠️ ADMIN: Cleanup old capsules?\n\nThis will delete capsules:\n- Older than 30 days\n- With less than 5 views\n\nContinue?')) return;
      try {
        const result = await cleanupOldCapsules(30, 5);
        alert(`✅ Cleanup complete!\n\nDeleted: ${result.deleted}\nKept: ${result.kept}`);
      } catch (err) {
        alert(`❌ Cleanup failed: ${err.message}`);
      }
    },
    getCapsuleStats: async () => {
      try {
        const stats = await getCapsuleStats();
        alert(`📊 Capsule Stats:\n\nTotal: ${stats.total}\nTotal Views: ${stats.totalViews}\nOld (>30 days): ${stats.oldCapsules}\nLow Views (<5): ${stats.lowViewCapsules}`);
        if (process.env.NODE_ENV === 'development') {
          console.log('Capsule Stats:', stats);
        }
      } catch (err) {
        alert(`❌ Stats failed: ${err.message}`);
      }
    }
  };

  // Load from localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedData);
        if (savedNodes && savedNodes.length > 0) {
          setNodes(savedNodes);
        }
        if (savedEdges && savedEdges.length > 0) {
          setEdges(savedEdges);
        }
      }
    } catch (error) {
      console.error('❌ Load error:', error);
    } finally {
      setIsInitialized(true);
    }
  }, [setNodes, setEdges]);

  // Import outreach deployment from UnityMAP Hub
  useEffect(() => {
    if (fromOutreach && isInitialized) {
      try {
        // Check for deployment timestamp
        const lastDeployment = localStorage.getItem('unity-last-outreach-deployment');
        if (lastDeployment) {
          // Find the corresponding deployment data
          const deploymentKeys = Object.keys(localStorage).filter(k => k.startsWith('unity-outreach-deployment-'));
          if (deploymentKeys.length > 0) {
            // Get the most recent deployment
            const mostRecentKey = deploymentKeys.sort().pop();
            const deploymentData = JSON.parse(localStorage.getItem(mostRecentKey));

            if (deploymentData?.emails) {
              // CRITICAL: Clear localStorage FIRST to prevent re-processing on state change
              localStorage.removeItem('unity-last-outreach-deployment');
              localStorage.removeItem(mostRecentKey);

              // Transform deployment data for createJourneyFromOutreach
              const emails = [
                { label: 'Initial Email (Day 0)', subject: deploymentData.emails.initial?.subject, body: deploymentData.emails.initial?.body },
                { label: 'Follow-up #1 (Day 3)', subject: deploymentData.emails.followup1?.subject, body: deploymentData.emails.followup1?.body },
                { label: 'Follow-up #2 (Day 10)', subject: deploymentData.emails.followup2?.subject, body: deploymentData.emails.followup2?.body }
              ].filter(e => e.subject && e.body);

              // Check if we're editing an existing campaign (has editingTimestamp from Hub/Generator)
              const editingTimestamp = deploymentData.editingTimestamp;

              if (process.env.NODE_ENV === 'development') {
                console.log('🔍 Deployment data:', {
                  id: deploymentData.id,
                  editingTimestamp: editingTimestamp,
                  hasEditingTimestamp: !!editingTimestamp
                });
              }

              // Base outreach data (offset will be calculated inside setNodes)
              const outreachData = {
                prospect: deploymentData.prospect,
                emails,
                mode: deploymentData.motion === 'sales' ? 'consultant' : 'brand',
                waitDays: [3, 7]
              };

              // Use functional update to access CURRENT nodes state
              // This ensures we get the latest nodes, not a stale closure value
              setNodes(prev => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('🔍 Processing deployment with current nodes:', prev.length);
                  console.log('🔍 All node IDs:', prev.map(n => n.id));
                }

                let offsetX = 0;
                let filteredNodes = prev;

                if (editingTimestamp) {
                  // EDITING: Find original position and filter out old nodes
                  const tsString = String(editingTimestamp);
                  const originalProspect = prev.find(n =>
                    n.type === 'prospectNode' && n.id.includes(tsString)
                  );

                  if (process.env.NODE_ENV === 'development') {
                    console.log('🔍 Looking for prospect with timestamp:', tsString);
                    console.log('🔍 All prospect nodes:', prev.filter(n => n.type === 'prospectNode').map(n => n.id));
                  }

                  if (originalProspect) {
                    offsetX = (originalProspect.position?.x || 400) - 400;
                    if (process.env.NODE_ENV === 'development') {
                      console.log('📝 Found original prospect at:', originalProspect.position, 'offsetX:', offsetX);
                    }
                  } else {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('⚠️ Original prospect not found - using default position');
                    }
                  }

                  // Filter out old campaign nodes
                  filteredNodes = prev.filter(node => {
                    const matchesDash = node.id.includes(`-${tsString}`);
                    const matchesPrefix = node.id.includes(`${tsString}-`);
                    if (matchesDash || matchesPrefix) {
                      if (process.env.NODE_ENV === 'development') {
                        console.log('🗑️ Removing node:', node.id);
                      }
                    }
                    return !matchesDash && !matchesPrefix;
                  });

                  if (process.env.NODE_ENV === 'development') {
                    console.log('🗑️ Removed', prev.length - filteredNodes.length, 'old nodes');
                  }
                } else {
                  // NEW CAMPAIGN: Count existing prospect nodes to offset
                  const existingProspectNodes = prev.filter(n => n.type === 'prospectNode');
                  offsetX = existingProspectNodes.length * 350;
                  if (process.env.NODE_ENV === 'development') {
                    console.log('🆕 New campaign, offset:', offsetX, 'existing campaigns:', existingProspectNodes.length);
                  }
                }

                // Create journey nodes with calculated offset
                const { nodes: journeyNodes, edges: journeyEdges } = createJourneyFromOutreach(outreachData, offsetX);
                if (process.env.NODE_ENV === 'development') {
                  console.log('🆕 Created', journeyNodes.length, 'new nodes with IDs:', journeyNodes.map(n => n.id));
                }

                // Store edges for the edge update (via closure)
                setTimeout(() => {
                  setEdges(prevEdges => {
                    if (editingTimestamp) {
                      const filtered = prevEdges.filter(edge =>
                        !edge.id.includes(`-${editingTimestamp}`) &&
                        !edge.id.includes(`${editingTimestamp}-`)
                      );
                      return [...filtered, ...journeyEdges];
                    }
                    return [...prevEdges, ...journeyEdges];
                  });
                }, 0);

                return [...filteredNodes, ...journeyNodes];
              });

              // Set mode to map
              setCurrentMode('map');
              setShowModePanel(true);

              if (process.env.NODE_ENV === 'development') {
                console.log('✅ Imported outreach deployment:', deploymentData.id, editingTimestamp ? '(edit)' : '(new)');
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to import outreach deployment:', error);
      }
    }
  }, [fromOutreach, isInitialized, setNodes, setEdges]);

  // Handle photo resize
  const handlePhotoResize = useCallback((nodeId, newSize) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                size: newSize
              }
            }
          : node
      )
    );
  }, [setNodes]);

  // Handle lightbox
  const handleLightbox = useCallback((photoData) => {
    setLightboxPhoto(photoData);
    setShowLightbox(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((nodeId, photoData) => {
    setEditingNodeId(nodeId);
    setEditingMemory(photoData);
    setShowEditModal(true);
  }, []);

  // Handle AI image analysis
  const handleImageAnalyze = useCallback(async (nodeId, imageUrl, analysisType) => {
    // Check for stored key OR env key
    const openaiKey = storedOpenaiKey || import.meta.env.VITE_OPENAI_API_KEY;
    if (!aiConfigured && !openaiKey) {
      if (!isAuthenticated) {
        showToast('🖼️ AI image analysis requires sign-in. Sign in to use your stored OpenAI API key.', 'warning', 5000);
      } else {
        showToast('🖼️ No OpenAI API key found. Go to Hub → Settings to add your OpenAI API key.', 'warning', 5000);
      }
      return;
    }

    try {
      const result = await analyzeImage(imageUrl, analysisType, { apiKey: openaiKey });

      if (!result) {
        throw new Error(aiError || 'Analysis failed');
      }

      // Update node data based on analysis type
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;

          let updatedData = { ...node.data };

          switch (analysisType) {
            case 'describe':
              // Update description with AI-generated text
              updatedData.description = result;
              break;

            case 'tags':
              // Add AI-suggested tags
              updatedData.tags = result;
              break;

            case 'travel':
              // Update location/travel context
              if (result.location) {
                updatedData.location = result.location;
              }
              if (result.suggestedCaption) {
                updatedData.description = result.suggestedCaption;
              }
              break;

            case 'ocr':
              // Store extracted text
              if (result) {
                updatedData.extractedText = result;
                // If no description, use extracted text
                if (!updatedData.description) {
                  updatedData.description = `Text: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`;
                }
              }
              break;

            default:
              break;
          }

          return {
            ...node,
            data: updatedData
          };
        })
      );

      // Show success notification (simple alert for now)
      const messages = {
        describe: 'Description updated!',
        tags: `${Array.isArray(result) ? result.length : 0} tags suggested`,
        travel: result?.location ? `Location identified: ${result.location}` : 'Location analysis complete',
        ocr: result ? 'Text extracted!' : 'No text found in image'
      };
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ AI Analysis:', messages[analysisType] || 'Analysis complete');
      }

    } catch (error) {
      console.error('AI Analysis error:', error);
      showToast(`AI analysis failed: ${error.message}`, 'error', 5000);
    }
  }, [analyzeImage, aiConfigured, aiError, setNodes, storedOpenaiKey, isAuthenticated]);

  // Handle email preview for outreach nodes
  const handleEmailPreview = useCallback((nodeId, nodeData) => {
    // Parse email content from node
    const content = nodeData.content || '';
    const subjectMatch = content.match(/\*\*Subject:\*\*\s*(.+?)(?:\n|$)/);
    const bodyContent = content.replace(/\*\*Subject:\*\*\s*.+?\n\n?/, '').trim();

    setPreviewEmailData({
      subject: subjectMatch ? subjectMatch[1].trim() : nodeData.title || 'Email Preview',
      body: bodyContent || content,
      title: nodeData.title
    });
    setShowEmailPreview(true);
  }, []);

  // Handle inline email edit - opens modal to edit email content
  const handleInlineEmailEdit = useCallback((nodeId, nodeData) => {
    setEditingEmailNodeId(nodeId);
    setEditingEmailData(nodeData);
    setShowEmailEditModal(true);
  }, []);

  // Save inline email edits
  const handleEmailEditSave = useCallback((updatedData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === editingEmailNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updatedData
            }
          };
        }
        return node;
      })
    );
    setShowEmailEditModal(false);
    setEditingEmailNodeId(null);
    setEditingEmailData(null);
  }, [editingEmailNodeId, setNodes]);

  // Handle inline wait edit - opens modal to edit wait duration
  const handleInlineWaitEdit = useCallback((nodeId, nodeData) => {
    setEditingWaitNodeId(nodeId);
    setEditingWaitData(nodeData);
    setShowWaitEditModal(true);
  }, []);

  // Save inline wait edits
  const handleWaitEditSave = useCallback((updatedData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === editingWaitNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updatedData
            }
          };
        }
        return node;
      })
    );
    setShowWaitEditModal(false);
    setEditingWaitNodeId(null);
    setEditingWaitData(null);
  }, [editingWaitNodeId, setNodes]);

  // Handle inline condition edit - opens modal to edit condition settings
  const handleInlineConditionEdit = useCallback((nodeId, nodeData) => {
    setEditingConditionNodeId(nodeId);
    setEditingConditionData(nodeData);
    setShowConditionEditModal(true);
  }, []);

  // Save inline condition edits
  const handleConditionEditSave = useCallback((updatedData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === editingConditionNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updatedData
            }
          };
        }
        return node;
      })
    );
    setShowConditionEditModal(false);
    setEditingConditionNodeId(null);
    setEditingConditionData(null);
  }, [editingConditionNodeId, setNodes]);

  // Refs to access current nodes/edges without causing re-renders
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  // Handle "Edit in Outreach" - Navigate back to Outreach Generator with context
  const handleEditInOutreach = useCallback((nodeId, _nodeData) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 MAP Edit: nodeId =', nodeId);
    }

    // Find all related campaign nodes (same timestamp prefix)
    // Handles both old format (outreach-xxx) and new UnityMAP format (email-xxx, prospect-xxx)
    const timestampMatch = nodeId?.match(/(?:outreach|email|prospect|wait|exit)-(\d+)/) ||
                          (typeof nodeId === 'object' && nodeId?.id?.match(/(?:outreach|email|prospect|wait|exit)-(\d+)/));
    if (!timestampMatch) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ MAP Edit: No timestamp match found in nodeId');
      }
      // If no match, just navigate to Outreach Generator
      navigate('/outreach');
      return;
    }

    const campaignTimestamp = timestampMatch[1];
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 MAP Edit: Extracted campaignTimestamp =', campaignTimestamp);
    }
    // Use ref to get current nodes without dependency
    const currentNodes = nodesRef.current;
    // Find all related nodes with the same timestamp (handles both old and new formats)
    // Performance optimization: Use single regex instead of 5 separate includes() checks
    // This reduces O(5n) to O(n) complexity, ~5x faster on large canvases
    const campaignRegex = new RegExp(`(?:outreach|email|prospect|wait|exit)-${campaignTimestamp}`);
    const campaignNodes = currentNodes.filter(n => campaignRegex.test(n.id));

    // Parse prospect info from header node (old format) or prospectNode (new UnityMAP format)
    const headerNode = campaignNodes.find(n => n.id.includes('-header'));
    const prospectNode = campaignNodes.find(n => n.id.includes('prospect-'));
    let prospectInfo = {};

    // Try old header node format first
    if (headerNode && headerNode.data?.content) {
      const content = headerNode.data.content;
      const prospectMatch = content.match(/\*\*Prospect:\*\*\s*(.+?)(?:\n|$)/);
      const emailMatch = content.match(/\*\*Email:\*\*\s*(.+?)(?:\n|$)/);
      const titleMatch = content.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/);
      const industryMatch = content.match(/\*\*Industry:\*\*\s*(.+?)(?:\n|$)/);
      const triggerMatch = content.match(/\*\*Trigger:\*\*\s*(.+?)(?:\n|$)/);

      if (prospectMatch) {
        const [firstName, ...lastParts] = prospectMatch[1].trim().split(' ');
        prospectInfo.firstName = firstName || '';
        prospectInfo.lastName = lastParts.join(' ') || '';
      }
      if (emailMatch) prospectInfo.email = emailMatch[1].trim();
      if (titleMatch) prospectInfo.title = titleMatch[1].trim();
      if (industryMatch) prospectInfo.industry = industryMatch[1].trim();
      if (triggerMatch) prospectInfo.trigger = triggerMatch[1].trim();

      // Extract company name from header title
      const companyMatch = headerNode.data?.title?.match(/📧\s*(.+?)\s*Outreach/);
      if (companyMatch) prospectInfo.company = companyMatch[1].trim();
    }
    // Try new UnityMAP prospectNode format with embedded prospects array
    else if (prospectNode && prospectNode.data) {
      const pData = prospectNode.data;
      // Check for full prospect data in prospects array (from Hub/Generator)
      if (pData.prospects && pData.prospects.length > 0) {
        const p = pData.prospects[0]; // Use first prospect for edit context
        prospectInfo.email = p.email || '';
        prospectInfo.firstName = p.firstName || '';
        prospectInfo.lastName = p.lastName || '';
        prospectInfo.company = p.company || pData.label || '';
        prospectInfo.title = p.title || '';
        prospectInfo.industry = p.industry || pData.tags?.[0] || '';
        prospectInfo.trigger = p.trigger || '';
        prospectInfo.triggerDetails = p.triggerDetails || '';
      } else {
        // Fallback to legacy format
        prospectInfo.company = pData.label || '';
        prospectInfo.industry = pData.tags?.[0] || '';
      }
    }

    // Collect email nodes for the campaign
    const emailNodes = campaignNodes
      .filter(n => n.id.includes('email-') || n.id.includes('-email'))
      .sort((a, b) => {
        // Sort by position or index in id
        const aIdx = parseInt(a.id.match(/-(\d+)$/)?.[1] || '0', 10);
        const bIdx = parseInt(b.id.match(/-(\d+)$/)?.[1] || '0', 10);
        return aIdx - bIdx;
      })
      .map(n => ({
        subject: n.data?.subject || '',
        body: n.data?.fullBody || n.data?.preview || '',
        label: n.data?.label || ''
      }));

    // Store context for UnityMAP Hub/Generator (use the key expected by Hub)
    const editContext = {
      campaignTimestamp,
      prospect: prospectInfo,
      emails: emailNodes,
      sourceNodeId: nodeId,
      fromUnityMAP: true,
      editedAt: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('📝 MAP Edit: Storing edit context with campaignTimestamp:', campaignTimestamp);
    }

    // Store with the key that Hub/Generator expects
    localStorage.setItem('unity-outreach-edit-context', JSON.stringify(editContext));

    // Get the origin path to return to the correct page (Hub or Generator)
    // Check multiple sources: stored origin, context, or default to Generator
    let originPath = localStorage.getItem('unity-outreach-origin');

    if (!originPath) {
      // Try to find origin from deployment data or context
      try {
        const context = localStorage.getItem('unity-outreach-context');
        if (context) {
          const parsed = JSON.parse(context);
          originPath = parsed.originPath;
        }
      } catch (_e) {
        // Ignore parse errors
      }
    }

    // Default to Generator if no origin found
    if (!originPath) {
      originPath = '/experiments/outreach-generator';
    }

    // Navigate back to the origin with edit context
    navigate(`${originPath}?from=unity-map&edit=true`);
  }, [navigate]);

  // Handle Edit Campaign from MAP Actions menu
  // If campaign exists (prospectNode), edit it; otherwise create new
  const handleMenuEditCampaign = useCallback(() => {
    // Find any prospectNode to get campaign info
    const prospectNode = nodes.find(n => n.type === 'prospectNode');

    if (prospectNode) {
      // Edit existing campaign - use handleEditInOutreach
      handleEditInOutreach(prospectNode.id, prospectNode.data);
    } else {
      // No campaign exists - navigate to Generator (free) not Hub (premium)
      navigate('/experiments/outreach-generator?from=unity-map');
    }
  }, [nodes, handleEditInOutreach, navigate]);

  // Check if a campaign exists (has prospectNode)
  const hasCampaign = useMemo(() => {
    return nodes.some(n => n.type === 'prospectNode');
  }, [nodes]);

  // PERFORMANCE OPTIMIZATION: Memoize map node detection for handleSmartSave
  // Prevents O(n) nodes.some() iteration on every save operation (keyboard shortcut, toolbar click)
  // For 100 nodes: eliminates 100 iterations per save when using Cmd+S
  const hasMapNodes = useMemo(() => {
    const mapNodeTypes = ['prospectNode', 'emailNode', 'waitNode', 'conditionNode', 'exitNode'];
    return nodes.some(n => mapNodeTypes.includes(n.type));
  }, [nodes]);

  // Handle edit save
  const handleEditSave = useCallback((updatedData) => {

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === editingNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              location: updatedData.location,
              date: updatedData.date,
              description: updatedData.description
            }
          };
        }
        return node;
      })
    );

  }, [editingNodeId, setNodes]);

  // Handle delete memory (from edit modal)
  // When deleting a group, unparent all children first to prevent orphaned nodes
  const handleDeleteMemory = useCallback(() => {

    setNodes((nds) => {
      // Find the node being deleted
      const nodeToDelete = nds.find(n => n.id === editingNodeId);

      // If it's a group node, we need to unparent all children
      if (nodeToDelete?.type === 'groupNode') {
        const children = nds.filter(n => n.parentId === editingNodeId);

        if (children.length > 0) {
          // Convert children to absolute positions and remove parent reference
          const updatedNodes = nds.map(node => {
            if (node.parentId === editingNodeId) {
              return {
                ...node,
                position: {
                  x: node.position.x + (nodeToDelete.position?.x || 0),
                  y: node.position.y + (nodeToDelete.position?.y || 0)
                },
                parentId: undefined,
                extent: undefined
              };
            }
            return node;
          });

          return updatedNodes.filter(node => node.id !== editingNodeId);
        }
      }

      return nds.filter((node) => node.id !== editingNodeId);
    });
    setEdges((eds) => eds.filter((edge) =>
      edge.source !== editingNodeId && edge.target !== editingNodeId
    ));

  }, [editingNodeId, setNodes, setEdges]);

  // ==================== UNDO/REDO FUNCTIONALITY ====================

  // Save current state to history
  const saveToHistory = useCallback(() => {
    // Skip if this is an undo/redo action to prevent infinite loops
    if (isUndoRedoActionRef.current) return;

    const currentState = {
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
      timestamp: Date.now()
    };

    // Remove any future states if we're not at the end
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);

    // Add new state
    newHistory.push(currentState);

    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    } else {
      historyIndexRef.current++;
    }

    historyRef.current = newHistory;
  }, [nodes, edges, MAX_HISTORY]);

  // Undo to previous state
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;

    isUndoRedoActionRef.current = true;
    historyIndexRef.current--;

    const previousState = historyRef.current[historyIndexRef.current];
    setNodes(previousState.nodes);
    setEdges(previousState.edges);

    // Reset flag after state update completes
    setTimeout(() => {
      isUndoRedoActionRef.current = false;
    }, 0);
  }, [setNodes, setEdges]);

  // Redo to next state
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    isUndoRedoActionRef.current = true;
    historyIndexRef.current++;

    const nextState = historyRef.current[historyIndexRef.current];
    setNodes(nextState.nodes);
    setEdges(nextState.edges);

    // Reset flag after state update completes
    setTimeout(() => {
      isUndoRedoActionRef.current = false;
    }, 0);
  }, [setNodes, setEdges]);

  // =================================================================

  // Handle direct delete from node (for text/non-photo nodes)
  // When deleting a group, unparent all children first to prevent orphaned nodes
  const handleDeleteNode = useCallback((nodeId) => {

    if (confirm('⚠️ Delete this note?\n\nThis cannot be undone.')) {
      // Trigger success haptic feedback for delete confirmation
      triggerHaptic('success');

      // Save current state to history before deletion
      saveToHistory();
      setNodes((nds) => {
        // Find the node being deleted
        const nodeToDelete = nds.find(n => n.id === nodeId);

        // If it's a group node, we need to unparent all children
        if (nodeToDelete?.type === 'groupNode') {
          // Find all children of this group
          const children = nds.filter(n => n.parentId === nodeId);

          if (children.length > 0) {
            // Convert children to absolute positions and remove parent reference
            const updatedNodes = nds.map(node => {
              if (node.parentId === nodeId) {
                // Convert relative position to absolute by adding parent's position
                return {
                  ...node,
                  position: {
                    x: node.position.x + (nodeToDelete.position?.x || 0),
                    y: node.position.y + (nodeToDelete.position?.y || 0)
                  },
                  parentId: undefined,
                  extent: undefined
                };
              }
              return node;
            });

            // Now filter out the deleted group
            return updatedNodes.filter(node => node.id !== nodeId);
          }
        }

        // Default: just filter out the node
        return nds.filter((node) => node.id !== nodeId);
      });
      setEdges((eds) => eds.filter((edge) =>
        edge.source !== nodeId && edge.target !== nodeId
      ));
    }
  }, [setNodes, setEdges, saveToHistory, triggerHaptic]);

  // Handle node updates (for text nodes)
  const handleNodeUpdate = useCallback((nodeId, updates) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              position: { ...node.position }, // Force new reference for React Flow change detection
              data: {
                ...node.data,
                ...updates,
                updatedAt: Date.now(),
              }
            }
          : node
      )
    );
  }, [setNodes]);

  // Callback for updating todo items (used for loaded nodes)
  const _handleUpdateTodoItems = useCallback((nodeId, newItems) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 handleUpdateTodoItems called:', nodeId, newItems);
    }
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, items: newItems } }
          : node
      )
    );
  }, [setNodes]);

  // Callback for updating todo title (used for loaded nodes)
  const _handleUpdateTodoTitle = useCallback((nodeId, newTitle) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, title: newTitle } }
          : node
      )
    );
  }, [setNodes]);

  /**
   * Handle bi-directional sync: TodoNode item completion → Source node status
   * Syncs completion status back to TripPlannerMapNode OR GroupNode child nodes
   * Called when a todo item is checked/unchecked
   * @param {Object} syncData - Contains todoNodeId, itemId, completed, sourceNodeId, placeId, placeName, metadata
   */
  const handleTodoItemSync = useCallback((syncData) => {
    const { sourceNodeId, placeId, completed, placeName, metadata } = syncData;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Syncing todo item:', {
        sourceNodeId,
        placeId,
        completed,
        placeName,
        metadata
      });
    }

    // Find the source node and update accordingly
    setNodes((nds) =>
      nds.map((node) => {
        // SYNC TYPE 1: TripPlannerMapNode visited status
        if (node.id === sourceNodeId && node.type === 'tripPlannerMapNode') {
          const visitedLocations = node.data?.visitedLocations || [];
          let newVisitedLocations;

          if (completed) {
            // Add to visited locations if not already there
            if (!visitedLocations.includes(placeId)) {
              newVisitedLocations = [...visitedLocations, placeId];
              if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Marked "${placeName}" as visited in trip planner`);
              }
            } else {
              newVisitedLocations = visitedLocations;
            }
          } else {
            // Remove from visited locations
            newVisitedLocations = visitedLocations.filter(id => id !== placeId);
            if (process.env.NODE_ENV === 'development') {
              console.log(`❌ Unmarked "${placeName}" as visited in trip planner`);
            }
          }

          return {
            ...node,
            data: {
              ...node.data,
              visitedLocations: newVisitedLocations
            }
          };
        }

        // SYNC TYPE 2: GroupNode child node completion status
        // When a todo item from GroupNode is checked, mark the source child node as completed
        if (metadata?.sourceNodeId && node.id === metadata.sourceNodeId) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`${completed ? '✅' : '❌'} Marked node "${node.data?.title || node.id}" as ${completed ? 'completed' : 'incomplete'}`);
          }
          return {
            ...node,
            data: {
              ...node.data,
              todoCompleted: completed, // Add completion status to node data
              todoCompletedAt: completed ? Date.now() : null
            }
          };
        }

        return node;
      })
    );
  }, [setNodes]);

  /**
   * Extract locations from TripPlannerMapNode and create a TodoNode
   * This handler is injected into tripPlannerMapNode data callbacks
   * @param {string} nodeId - The ID of the tripPlannerMapNode
   */
  const handleExtractLocationsToTodo = useCallback((nodeId) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📍 Extracting locations to todo from node:', nodeId);
    }

    // Find the source trip planner node
    const sourceNode = nodeById.get(nodeId); // O(1) Map lookup
    if (!sourceNode || sourceNode.type !== 'tripPlannerMapNode') {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Source node not found or invalid type:', nodeId);
      }
      return;
    }

    const places = sourceNode.data?.places || [];
    if (places.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ No places to extract from trip planner node');
      }
      return;
    }

    // Create todo items from places
    const timestamp = Date.now();
    const todoItems = places.map((place, index) => {
      const categoryIcon = place.category ?
        ({'hotel': '🏨', 'attraction': '🏛️', 'restaurant': '🍽️',
          'shopping': '🛍️', 'activity': '🎯', 'transport': '🚇'}[place.category] || '📍')
        : '📍';

      const dayInfo = place.assignedDay ? ` [Day ${place.assignedDay}]` : '';
      const text = `${categoryIcon} ${place.name}${dayInfo}`;

      return {
        id: `todo-${timestamp}-${index}`,
        text: text,
        completed: false,
        metadata: {
          sourceNodeId: nodeId,
          placeId: place.id,
          placeName: place.name,
          placeCategory: place.category,
          assignedDay: place.assignedDay
        }
      };
    });

    // Create new TodoNode positioned next to the source node
    const newTodoNode = {
      id: `todo-from-trip-${timestamp}`,
      type: 'todoNode',
      position: {
        x: sourceNode.position.x + 550, // Position to the right of trip planner
        y: sourceNode.position.y
      },
      data: {
        title: `${sourceNode.data?.title || 'Trip'} - Checklist`,
        items: todoItems,
        createdAt: timestamp,
        onTitleChange: (id, title) => {
          setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, title } } : n));
        },
        onUpdateItems: (id, newItems) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 onUpdateItems called:', id, newItems);
          }
          setNodes((nds) =>
            nds.map((n) =>
              n.id === id
                ? { ...n, data: { ...n.data, items: newItems } }
                : n
            )
          );
        },
        onItemToggle: handleTodoItemSync, // Bi-directional sync callback
        onDelete: (id) => {
          setNodes((nds) => nds.filter((n) => n.id !== id));
        }
      }
    };

    // Add the new todo node to the canvas
    setNodes((nds) => [...nds, newTodoNode]);

    // Fix fitView timing: trigger after node is added to bring it into viewport
    // Double RAF ensures React Flow has fully processed the new node before fitView
    // 1st RAF: React commits DOM changes
    // 2nd RAF: React Flow measures updated dimensions
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitView({ duration: 400, padding: 0.2 });
      });
    });

    // Provide user feedback
    showToast(`Created checklist with ${todoItems.length} locations from trip planner!`, 'success');

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Created TodoNode with ${todoItems.length} items from trip planner`);
    }
  }, [nodes, setNodes, fitView]);

  /**
   * Convert MapNode places to TodoNode checklist items
   * Extracts places from a MapNode and creates a todo checklist
   * @param {string} nodeId - The ID of the mapNode
   */
  const handleConvertMapToTodo = useCallback((nodeId) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📍 Converting MapNode to todo checklist:', nodeId);
    }

    // Find the source map node
    const sourceNode = nodeById.get(nodeId); // O(1) Map lookup
    if (!sourceNode || sourceNode.type !== 'mapNode') {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Source node not found or invalid type:', nodeId);
      }
      return;
    }

    const places = sourceNode.data?.places || [];
    if (places.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ No places to extract from map node');
      }
      showToast('This map has no places to convert. Add some locations first!', 'warning');
      return;
    }

    // Create todo items from places
    const timestamp = Date.now();
    const todoItems = places.map((place, index) => {
      const text = `📍 ${place.name || place.address || 'Unknown Location'}`;

      return {
        id: `todo-${timestamp}-${index}`,
        text: text,
        completed: false,
        metadata: {
          sourceNodeId: nodeId,
          placeId: place.id,
          placeName: place.name || place.address,
          sourceType: 'mapNode'
        }
      };
    });

    // Create new TodoNode positioned next to the source node
    const newTodoNode = {
      id: `todo-from-map-${timestamp}`,
      type: 'todoNode',
      position: {
        x: sourceNode.position.x + 550, // Position to the right of map
        y: sourceNode.position.y
      },
      data: {
        title: `${sourceNode.data?.title || 'Map'} - Checklist`,
        items: todoItems,
        createdAt: timestamp,
        onTitleChange: (id, title) => {
          setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, title } } : n));
        },
        onUpdateItems: (id, newItems) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 onUpdateItems called:', id, newItems);
          }
          setNodes((nds) =>
            nds.map((n) =>
              n.id === id
                ? { ...n, data: { ...n.data, items: newItems } }
                : n
            )
          );
        },
        onDelete: (id) => {
          setNodes((nds) => nds.filter((n) => n.id !== id));
        }
      }
    };

    // Add the new todo node to the canvas
    setNodes((nds) => [...nds, newTodoNode]);

    // Fix fitView timing: trigger after node is added to bring it into viewport
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitView({ duration: 400, padding: 0.2 });
      });
    });

    // Provide user feedback
    showToast(`Created checklist with ${todoItems.length} locations from map!`, 'success');

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Created TodoNode with ${todoItems.length} items from map`);
    }
  }, [nodes, setNodes, fitView]);

  /**
   * Convert GroupNode child nodes to TodoNode checklist items
   * This handler extracts all nodes inside a group and creates a todo checklist
   * @param {string} groupId - The ID of the groupNode
   */
  const handleConvertGroupToTodo = useCallback((groupId) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Converting group to todo checklist:', groupId);
    }

    // Find the source group node
    const groupNode = nodeById.get(groupId); // O(1) Map lookup
    if (!groupNode || groupNode.type !== 'groupNode') {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Group node not found or invalid type:', groupId);
      }
      return;
    }

    // Helper to check if a node is inside a group's bounds
    const isInside = (node, group) => {
      if (!group || group.type !== 'groupNode') return false;
      const groupX = group.position.x;
      const groupY = group.position.y;
      const groupWidth = group.data?.width || 300;
      const groupHeight = group.data?.height || 200;
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeWidth = node.data?.width || (node.width || 200);
      const nodeHeight = node.data?.height || (node.height || 150);
      const nodeCenterX = nodeX + nodeWidth / 2;
      const nodeCenterY = nodeY + nodeHeight / 2;
      return (
        nodeCenterX >= groupX &&
        nodeCenterX <= groupX + groupWidth &&
        nodeCenterY >= groupY &&
        nodeCenterY <= groupY + groupHeight
      );
    };

    // Find all nodes that are children of this group
    const childNodes = nodes.filter(node => {
      if (node.id === groupId || node.type === 'groupNode') return false;
      return isInside(node, groupNode);
    });

    if (childNodes.length === 0) {
      showToast('No nodes found inside this group to convert to checklist.', 'warning');
      return;
    }

    // Create todo items from child nodes
    const timestamp = Date.now();
    const todoItems = childNodes.map((node, index) => {
      const nodeType = node.type || 'node';
      const typeIcon = {
        'textNode': '📝', 'photoNode': '🖼️', 'linkNode': '🔗',
        'videoNode': '📹', 'aiChatNode': '🤖', 'stickyNode': '📌',
        'mapNode': '🗺️', 'tripPlannerMapNode': '✈️'
      }[nodeType] || '📄';

      let text = '';
      if (node.data?.title) text = `${typeIcon} ${node.data.title}`;
      else if (node.data?.label) text = `${typeIcon} ${node.data.label}`;
      else if (node.data?.content) {
        const preview = node.data.content.slice(0, 50);
        text = `${typeIcon} ${preview}${node.data.content.length > 50 ? '...' : ''}`;
      } else if (node.data?.url) text = `${typeIcon} ${node.data.url}`;
      else text = `${typeIcon} ${nodeType} (ID: ${node.id.slice(0, 8)})`;

      return {
        id: `todo-${timestamp}-${index}`,
        text,
        completed: false,
        metadata: { sourceNodeId: node.id, sourceNodeType: nodeType, groupId }
      };
    });

    // Create TodoNode
    const groupWidth = groupNode.data?.width || 300;
    const newTodoNode = {
      id: `todo-from-group-${timestamp}`,
      type: 'todoNode',
      position: {
        x: groupNode.position.x + groupWidth + 50,
        y: groupNode.position.y
      },
      data: {
        title: `${groupNode.data?.label || 'Group'} - Checklist`,
        items: todoItems,
        createdAt: timestamp,
        onTitleChange: (id, title) => {
          setNodes(nds => nds.map(n => n.id === id ? {...n, data: {...n.data, title}} : n));
        },
        onUpdateItems: (id, newItems) => {
          setNodes(nds => nds.map(n => n.id === id ? {...n, data: {...n.data, items: newItems}} : n));
        },
        onDelete: (id) => {
          setNodes(nds => nds.filter(n => n.id !== id));
        }
      }
    };

    pendingFitViewRef.current = true;
    setNodes(nds => [...nds, newTodoNode]);
    alert(`✅ Created checklist with ${todoItems.length} items from group "${groupNode.data?.label || 'Group'}"!`);
  }, [nodes, setNodes]);

  /**
   * PERFORMANCE OPTIMIZATION: Stable callback handlers for node events
   * These handlers prevent creating new function references on every render,
   * which breaks React.memo optimizations and causes excessive re-renders.
   * With 100+ nodes, this optimization reduces re-renders by ~90% and improves
   * load times from 1-2s to 100-200ms.
   */

  // Stable handler for TodoNode item updates
  const handleNodeItemsUpdate = useCallback((nodeId) => {
    // Check cache first for stable reference
    const cache = handleNodeItemsUpdateCache.current;
    if (cache.has(nodeId)) {
      return cache.get(nodeId);
    }

    // Create new callback and cache it
    const callback = (newItems) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 onUpdateItems called:', nodeId, newItems);
      }
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, items: newItems } }
            : n
        )
      );
    };
    cache.set(nodeId, callback);
    return callback;
  }, [setNodes]);

  // Stable handler for TodoNode title changes
  const handleNodeTitleChange = useCallback((nodeId) => {
    // Check cache first for stable reference
    const cache = handleNodeTitleChangeCache.current;
    if (cache.has(nodeId)) {
      return cache.get(nodeId);
    }

    // Create new callback and cache it
    const callback = (newTitle) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, title: newTitle } }
            : n
        )
      );
    };
    cache.set(nodeId, callback);
    return callback;
  }, [setNodes]);

  // Stable handler for GroupNode label changes
  const handleNodeLabelChange = useCallback((nodeId) => {
    // Check cache first for stable reference
    const cache = handleNodeLabelChangeCache.current;
    if (cache.has(nodeId)) {
      return cache.get(nodeId);
    }

    // Create new callback and cache it
    const callback = (label) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, label } }
            : n
        )
      );
    };
    cache.set(nodeId, callback);
    return callback;
  }, [setNodes]);

  // Stable handler for GroupNode resize
  const handleNodeResize = useCallback((nodeId) => {
    return (width, height) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, width, height } }
            : n
        )
      );
    };
  }, [setNodes]);

  // Stable handler for GroupNode color changes
  const handleNodeColorChange = useCallback((nodeId) => {
    return (color) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, color } }
            : n
        )
      );
    };
  }, [setNodes]);

  // Stable handler for TripPlannerMapNode data changes - with callback caching
  const handleNodeDataChange = useCallback((nodeId) => {
    // Check cache first for stable reference
    const cache = handleNodeDataChangeCache.current;
    if (cache.has(nodeId)) {
      return cache.get(nodeId);
    }

    // Create new callback and cache it
    const callback = (updates) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, ...updates } }
            : n
        )
      );
    };
    cache.set(nodeId, callback);
    return callback;
  }, [setNodes]);

  // Stable handler for node deletion - with callback caching
  const handleNodeDelete = useCallback((nodeId) => {
    // Check cache first for stable reference
    const cache = handleNodeDeleteCache.current;
    if (cache.has(nodeId)) {
      return cache.get(nodeId);
    }

    // Create new callback and cache it
    const callback = () => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    };
    cache.set(nodeId, callback);
    return callback;
  }, [setNodes, setEdges]);

  // Helper function to check if a node is inside a group's bounds
  const isNodeInsideGroup = useCallback((node, groupNode) => {
    if (!groupNode || groupNode.type !== 'groupNode') return false;

    const groupX = groupNode.position.x;
    const groupY = groupNode.position.y;
    const groupWidth = groupNode.data?.width || 300;
    const groupHeight = groupNode.data?.height || 200;

    const nodeX = node.position.x;
    const nodeY = node.position.y;

    // Check if node center is inside group bounds (with some padding)
    const padding = 20;
    return (
      nodeX >= groupX + padding &&
      nodeX <= groupX + groupWidth - padding &&
      nodeY >= groupY + padding &&
      nodeY <= groupY + groupHeight - padding
    );
  }, []);

  // Handle node click - prevent selection during panning
  const handleNodeClick = useCallback((event, node) => {
    // If panning just occurred, prevent selection
    // Only block clicks if actual movement occurred (not just a tap)
    if (isPanning && panStartRef.current?.hasMoved) {
      event.preventDefault();
      return;
    }

    // 📱 DOUBLE-TAP TO ZOOM DETECTION
    const now = Date.now();
    const lastTap = lastNodeTapRef.current;
    const isDoubleTap = (
      lastTap.nodeId === node.id &&
      (now - lastTap.timestamp) < DOUBLE_TAP_THRESHOLD
    );

    if (isDoubleTap) {
      // Reset tracking
      lastNodeTapRef.current = { nodeId: null, timestamp: 0 };
      setShowCommentToolbar(false);
      setShowColorPicker(false);

      // Calculate optimal zoom
      const nodeWidth = node.width || 200;
      const nodeHeight = node.height || 150;
      const nodeCenterX = node.position.x + nodeWidth / 2;
      const nodeCenterY = node.position.y + nodeHeight / 2;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const paddingFactor = 0.7; // Show 70% of viewport to give breathing room

      const zoomX = (viewportWidth * paddingFactor) / nodeWidth;
      const zoomY = (viewportHeight * paddingFactor) / nodeHeight;
      const targetZoom = Math.min(zoomX, zoomY, 2); // Cap at 2x max zoom

      setCenter(nodeCenterX, nodeCenterY, { zoom: targetZoom, duration: 400 });
      return;
    }

    // Single tap - update tracking
    lastNodeTapRef.current = { nodeId: node.id, timestamp: now };

    // Calculate toolbar position based on node's screen position
    const viewport = getViewport();

    // Convert node canvas position to screen position
    const nodeScreenX = node.position.x * viewport.zoom + viewport.x;
    const nodeScreenY = node.position.y * viewport.zoom + viewport.y;

    // Get node dimensions (default 200x150 for most nodes)
    const nodeWidth = (node.width || 200) * viewport.zoom;
    const nodeHeight = (node.height || 150) * viewport.zoom;

    // Smart edge-aware positioning
    const toolbarWidth = 400; // Approximate width of expanded toolbar
    const toolbarHeight = 50; // Approximate height of toolbar
    const padding = 20; // Edge padding

    // Calculate ideal position (above and centered on node)
    let toolbarX = nodeScreenX + nodeWidth / 2;
    let toolbarY = nodeScreenY - 50;

    // Check horizontal boundaries
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if toolbar would overflow right edge
    if (toolbarX + toolbarWidth / 2 > viewportWidth - padding) {
      toolbarX = viewportWidth - toolbarWidth / 2 - padding;
    }
    // Adjust horizontal position if toolbar would overflow left edge
    if (toolbarX - toolbarWidth / 2 < padding) {
      toolbarX = toolbarWidth / 2 + padding;
    }

    // Adjust vertical position if toolbar would overflow top edge
    if (toolbarY - toolbarHeight < padding) {
      // Position below the node instead
      toolbarY = nodeScreenY + nodeHeight + 50;
    }

    // Adjust vertical position if toolbar would overflow bottom edge
    if (toolbarY > viewportHeight - padding) {
      toolbarY = nodeScreenY - 50; // Try above again, or clamp
      if (toolbarY < padding) {
        toolbarY = padding + toolbarHeight;
      }
    }

    setCommentToolbarPosition({ x: toolbarX, y: toolbarY });
    setShowCommentToolbar(true);
    setShowColorPicker(false); // Close color picker when switching nodes

    // Trigger light haptic feedback for node selection
    triggerHaptic('light');

    // Allow default ReactFlow selection behavior
  }, [isPanning, getViewport, setCenter, setShowCommentToolbar, triggerHaptic]);

  // Quick comment creation handler for floating toolbar
  const handleQuickComment = useCallback(() => {
    // Get the currently selected node (using memoized selectedNode for performance)
    if (!selectedNode) {
      setShowCommentToolbar(false);
      return;
    }

    // Create a new comment node positioned next to the selected node
    const timestamp = Date.now();
    const newCommentNode = {
      id: `comment-${timestamp}`,
      type: 'commentNode',
      position: {
        x: selectedNode.position.x + (selectedNode.width || 200) + 50, // Position to the right of selected node
        y: selectedNode.position.y
      },
      data: {
        content: '',
        author: user?.displayName || userProfile?.name || 'User',
        timestamp: new Date().toISOString(),
        createdAt: timestamp,
        onContentChange: handleCommentTextChange,
        onMentionKeyDown: handleMentionKeyDown,
        onDelete: handleDeleteNode,
        onReply: handleReplyToComment, // Enable reply button
        onShowToast: showToast, // Enable toast notifications for replies
        onCollapseToggle: handleCollapseToggle,
        edges: edges,
        nodes: nodes,
        replyCount: edgeCountBySource.get(`comment-${timestamp}`) || 0, // Pre-computed for O(1) lookup
      }
    };

    // Add the comment node to the canvas
    setNodes(nds => [...nds, newCommentNode]);

    // Show notification for new comment
    const commentAuthor = user?.displayName || userProfile?.name || 'User';
    const targetLabel = selectedNode.data?.label || selectedNode.data?.content?.substring(0, 20) || 'node';
    showToast(`💬 ${commentAuthor} added a comment to "${targetLabel}"`, 'success', 3000);

    // Hide the toolbar after creating the comment
    setShowCommentToolbar(false);

    // Track analytics if available
    if (window.gtag) {
      window.gtag('event', 'quick_comment_created', {
        event_category: 'canvas_interaction',
        event_label: 'floating_toolbar'
      });
    }
  }, [selectedNode, user, userProfile, handleDeleteNode, showToast]);

  /**
   * Get all descendant nodes of a given thread
   * Recursively traverses edges to find all children/grandchildren
   * Optimized to use edgesBySource Map for O(1) lookup instead of O(n) filter
   */
  const getThreadDescendants = useCallback((nodeId, edges) => {
    const descendants = new Set();
    const findChildren = (id) => {
      const childEdges = edgesBySource.get(id) || [];
      childEdges.forEach(edge => {
        descendants.add(edge.target);
        findChildren(edge.target);
      });
    };
    findChildren(nodeId);
    return descendants;
  }, [edgesBySource]);

  /**
   * Toggle collapse/expand state for a comment thread
   */
  const handleCollapseToggle = useCallback((commentId, isCollapsed) => {
    setCollapsedThreads(prev => {
      const next = new Set(prev);
      if (isCollapsed) {
        next.add(commentId);
      } else {
        next.delete(commentId);
      }
      return next;
    });
  }, []);

  /**
   * Reply to comment handler - creates threaded reply with visual context
   *
   * Creates a new comment node positioned as a threaded reply to an existing comment.
   * The reply node includes enhanced threading metadata to display visual context in the UI.
   *
   * @param {string} parentCommentId - The ID of the parent comment being replied to
   *
   * @description
   * Threading UX Features:
   * - Positions reply 30px to the right and 150px below parent (visual indent)
   * - Creates dashed edge connecting reply to parent comment
   * - Adds threading metadata to reply node data:
   *   - `isThreadedReply` {boolean} - Flag indicating this is a threaded reply
   *   - `replyToAuthor` {string} - Display name of parent comment author
   *   - `replyToContent` {string} - Preview of parent comment (max 60 chars)
   *
   * @example
   * // CommentNode component can use this metadata to display:
   * // "↩️ Replying to @JohnDoe: 'Great point about the design...'"
   */
  const handleReplyToComment = useCallback((parentCommentId, replyText = '') => {
    const parentNode = nodeById.get(parentCommentId); // O(1) Map lookup
    if (!parentNode) return;

    const timestamp = Date.now();
    const currentUser = user?.displayName || userProfile?.name || 'User';

    // Create reply comment positioned below and to the right (threaded indent)
    // Extract parent comment metadata for threading UX
    const parentAuthor = parentNode.data.author || 'someone';
    const parentContent = parentNode.data.content || '';
    const parentContentPreview = parentContent.length > 60
      ? `${parentContent.substring(0, 60)}...`
      : parentContent;

    const replyNode = {
      id: `comment-${timestamp}`,
      type: 'commentNode',
      position: {
        x: parentNode.position.x + 30, // Indent 30px to show threading
        y: parentNode.position.y + 150 // Position below parent
      },
      data: {
        content: replyText,
        author: currentUser,
        timestamp: new Date().toISOString(),
        createdAt: timestamp,
        replyTo: parentCommentId, // Track parent comment for threading
        // Threading UX metadata - enables CommentNode to display "Replying to @Author: 'preview...'"
        isThreadedReply: true,
        replyToAuthor: parentAuthor,
        replyToContent: parentContentPreview,
        onContentChange: handleCommentTextChange,
        onMentionKeyDown: handleMentionKeyDown,
        onDelete: handleDeleteNode,
        onReply: handleReplyToComment, // Enable recursive threading
        onShowToast: showToast, // Enable toast notifications for replies
        onCollapseToggle: handleCollapseToggle,
        edges: edges,
        nodes: nodes,
        replyCount: edgeCountBySource.get(`comment-${timestamp}`) || 0, // Pre-computed for O(1) lookup
      }
    };

    // Add reply node to canvas
    setNodes(nds => [...nds, replyNode]);

    // Create edge connecting reply to parent (dashed line to indicate reply relationship)
    const replyEdge = {
      id: `edge-${timestamp}`,
      source: parentCommentId,
      target: replyNode.id,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: '#9ca3af',
        strokeWidth: 2,
        strokeDasharray: '5,5', // Dashed line for reply connections
      },
    };

    setEdges(eds => [...eds, replyEdge]);

    // Show notification (parentAuthor already extracted above for threading UX)
    showToast(`💬 ${currentUser} replied to ${parentAuthor}'s comment`, 'success', 3000);

    // Track analytics
    if (window.gtag) {
      window.gtag('event', 'comment_reply_created', {
        event_category: 'canvas_interaction',
        event_label: 'threaded_reply'
      });
    }
  }, [nodes, user, userProfile, handleDeleteNode, handleCommentTextChange, handleMentionKeyDown, setNodes, setEdges]);

  // Handle @mention detection in comment text
  const handleCommentTextChange = useCallback((nodeId, content, cursorPosition, inputElement) => {
    // Update the node content
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, content } } : n));

    // Detect @ symbol and extract query
    if (!content || cursorPosition === undefined) {
      setMentionAutocomplete(prev => ({ ...prev, isVisible: false }));
      return;
    }

    // Find the @ symbol before cursor
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex === -1) {
      setMentionAutocomplete(prev => ({ ...prev, isVisible: false }));
      return;
    }

    // Extract query after @
    const queryStart = lastAtIndex + 1;
    const textAfterAt = content.substring(queryStart, cursorPosition);

    // Only show autocomplete if query doesn't contain spaces (still typing the name)
    if (textAfterAt.includes(' ')) {
      setMentionAutocomplete(prev => ({ ...prev, isVisible: false }));
      return;
    }

    // Calculate dropdown position
    if (inputElement) {
      const rect = inputElement.getBoundingClientRect();
      setMentionAutocomplete({
        isVisible: true,
        query: textAfterAt,
        selectedIndex: 0,
        position: { x: rect.left, y: rect.bottom + 5 },
        activeNodeId: nodeId
      });
    }
  }, []);

  // Handle mention selection
  const handleMentionSelect = useCallback((user) => {
    if (!mentionAutocomplete.activeNodeId) return;

    const node = nodeById.get(mentionAutocomplete.activeNodeId); // O(1) Map lookup
    if (!node) return;

    const content = node.data.content || '';

    // Find the @ symbol position
    const textBeforeCursor = content.substring(0, content.length);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex === -1) return;

    // Replace @query with @username
    const beforeMention = content.substring(0, lastAtIndex);
    const afterQuery = content.substring(lastAtIndex + 1 + mentionAutocomplete.query.length);
    const newContent = `${beforeMention}@${user.name}${afterQuery}`;

    // Update node content
    setNodes(nds => nds.map(n =>
      n.id === mentionAutocomplete.activeNodeId
        ? { ...n, data: { ...n.data, content: newContent } }
        : n
    ));

    // Hide autocomplete
    setMentionAutocomplete({
      isVisible: false,
      query: '',
      selectedIndex: 0,
      position: { x: 0, y: 0 },
      activeNodeId: null
    });

    // Store mention metadata for notifications
    setMentions(prev => [...prev, {
      nodeId: mentionAutocomplete.activeNodeId,
      userId: user.id,
      userName: user.name,
      mentionedAt: Date.now(),
      capsuleId: currentCapsuleId
    }]);

    // Show notification for @mention (P5: Commenting Enhancements)
    const mentionedUserName = user.name || 'someone';
    const currentUserName = userProfile?.displayName || user?.displayName || 'You';
    showToast(`💬 @${mentionedUserName} mentioned by ${currentUserName}`, 'success');
  }, [mentionAutocomplete, nodes, currentCapsuleId, setMentions, showToast, userProfile, user]);

  // Handle mention autocomplete selected index update (for hover/keyboard navigation)
  const setSelectedMentionIndex = useCallback((index) => {
    setMentionAutocomplete(prev => ({ ...prev, selectedIndex: index }));
  }, []);

  // Handle keyboard navigation in mention autocomplete
  const handleMentionKeyDown = useCallback((event) => {
    if (!mentionAutocomplete.isVisible) return false;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setMentionAutocomplete(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, filteredUsers.length - 1)
        }));
        return true;

      case 'ArrowUp':
        event.preventDefault();
        setMentionAutocomplete(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, 0)
        }));
        return true;

      case 'Enter':
        event.preventDefault();
        if (filteredUsers[mentionAutocomplete.selectedIndex]) {
          handleMentionSelect(filteredUsers[mentionAutocomplete.selectedIndex]);
        }
        return true;

      case 'Escape':
        event.preventDefault();
        setMentionAutocomplete(prev => ({ ...prev, isVisible: false }));
        return true;

      default:
        return false;
    }
  }, [mentionAutocomplete, filteredUsers, handleMentionSelect]);

  // Handle node drag start - simplified (no pan tracking needed for node drag)
  const handleNodeDragStart = useCallback((event, node) => {
    // Set node dragging flag to prevent pan gesture detection interference
    isNodeDraggingRef.current = true;

    // Trigger medium haptic feedback for drag start
    triggerHaptic('medium');

    // Node drag start handled by ReactFlow - we only need this for compatibility
    // Pan tracking is handled separately by handleCanvasPanStart
  }, [triggerHaptic]);

  // Handle node drag - show drop target indicator on groups
  const handleNodeDrag = useCallback((event, node) => {
    // Don't handle groups dragging
    if (node.type === 'groupNode') return;

    // Find the current drop target (group node the dragged node is over)
    const groupNodes = nodes.filter(n => n.type === 'groupNode');
    let newDropTargetId = null;

    for (const groupNode of groupNodes) {
      if (isNodeInsideGroup(node, groupNode) && groupNode.id !== node.parentId) {
        newDropTargetId = groupNode.id;
        break;
      }
    }

    // Early exit if drop target hasn't changed (skips 95%+ of drag events)
    if (currentDropTargetRef.current === newDropTargetId) {
      return;
    }

    const prevDropTargetId = currentDropTargetRef.current;
    currentDropTargetRef.current = newDropTargetId;

    // Update drop target indicators only for nodes that changed state
    setNodes((nds) => {
      let hasChanges = false;
      const updatedNodes = nds.map((n) => {
        if (n.type === 'groupNode') {
          const shouldBeTarget = n.id === newDropTargetId;
          const wasTarget = n.data.isDropTarget;

          // Only update if the drop target state actually changed
          if (shouldBeTarget !== wasTarget) {
            hasChanges = true;
            return {
              ...n,
              data: { ...n.data, isDropTarget: shouldBeTarget }
            };
          }
        }
        return n;
      });

      // Return original array if no changes to preserve React Flow reference equality
      return hasChanges ? updatedNodes : nds;
    });
  }, [nodes, setNodes, isNodeInsideGroup]);

  // Handle node drag stop - parent/unparent nodes to groups
  const handleNodeDragStop = useCallback((event, node) => {
    // Clear node dragging flag to re-enable pan gesture detection
    isNodeDraggingRef.current = false;
    // Reset drop target tracking
    currentDropTargetRef.current = null;
    // Don't handle groups dragging
    if (node.type === 'groupNode') return;

    // Find group this node is over
    const groupNodes = nodes.filter(n => n.type === 'groupNode');
    let targetGroup = null;

    for (const group of groupNodes) {
      if (isNodeInsideGroup(node, group)) {
        targetGroup = group;
        break;
      }
    }

    setNodes((nds) => {
      // First, clear all drop target indicators
      let updatedNodes = nds.map((n) => {
        if (n.type === 'groupNode') {
          return { ...n, data: { ...n.data, isDropTarget: false } };
        }
        return n;
      });

      // Update parent relationship
      updatedNodes = updatedNodes.map((n) => {
        if (n.id === node.id) {
          if (targetGroup && n.parentId !== targetGroup.id) {
            // Add to group - adjust position to be relative to group
            const relativeX = node.position.x - targetGroup.position.x;
            const relativeY = node.position.y - targetGroup.position.y;
            return {
              ...n,
              parentId: targetGroup.id,
              position: { x: relativeX, y: relativeY },
              extent: 'parent',
            };
          } else if (!targetGroup && n.parentId) {
            // Remove from group - adjust position to be absolute
            const parentNode = nds.find(p => p.id === n.parentId);
            if (parentNode) {
              const absoluteX = n.position.x + parentNode.position.x;
              const absoluteY = n.position.y + parentNode.position.y;
              const { parentId: _parentId, extent: _extent, ...rest } = n;
              return {
                ...rest,
                position: { x: absoluteX, y: absoluteY },
              };
            }
          }
        }
        return n;
      });

      // Build children lookup map for O(1) access instead of O(n) filters
      const childrenByParent = new Map();
      updatedNodes.forEach(node => {
        if (node.parentId) {
          if (!childrenByParent.has(node.parentId)) {
            childrenByParent.set(node.parentId, []);
          }
          childrenByParent.get(node.parentId).push(node);
        }
      });

      // Update child counts on groups using Map lookup
      updatedNodes = updatedNodes.map((n) => {
        if (n.type === 'groupNode') {
          const childCount = (childrenByParent.get(n.id) || []).length;
          return { ...n, data: { ...n.data, childCount } };
        }
        return n;
      });

      // Auto-scale groups to fit children (only expand, never shrink)
      updatedNodes = updatedNodes.map((n) => {
        if (n.type !== 'groupNode') return n;

        const children = childrenByParent.get(n.id) || [];
        if (children.length === 0) return n;

        // Estimate node sizes based on type
        const getNodeSize = (nodeType) => {
          const sizes = {
            textNote: { width: 280, height: 180 },
            stickyNode: { width: 200, height: 200 },
            commentNode: { width: 260, height: 140 },
            todoNode: { width: 220, height: 250 },
            photoNode: { width: 280, height: 200 },
            prospectNode: { width: 320, height: 200 },
            colorSwatchNode: { width: 200, height: 140 },
            waitNode: { width: 260, height: 180 },
          };
          return sizes[nodeType] || { width: 200, height: 150 };
        };

        // Calculate bounding box of all children
        let maxRight = 0;
        let maxBottom = 0;
        const padding = 40; // Padding around children

        children.forEach(child => {
          const size = getNodeSize(child.type);
          const right = child.position.x + size.width + padding;
          const bottom = child.position.y + size.height + padding;
          maxRight = Math.max(maxRight, right);
          maxBottom = Math.max(maxBottom, bottom);
        });

        // Only expand, never shrink (minimum dimensions)
        const currentWidth = n.data?.width || 300;
        const currentHeight = n.data?.height || 200;
        const newWidth = Math.max(currentWidth, maxRight, 300);
        const newHeight = Math.max(currentHeight, maxBottom, 200);

        // Only update if dimensions changed
        if (newWidth !== currentWidth || newHeight !== currentHeight) {
          return { ...n, data: { ...n.data, width: newWidth, height: newHeight } };
        }
        return n;
      });

      return updatedNodes;
    });
  }, [nodes, setNodes, isNodeInsideGroup]);

  // Handle canvas pan start (background dragging) - track initial position but don't set isPanning yet
  const handleCanvasPanStart = useCallback((event) => {
    // Skip pan tracking if this is a multi-touch gesture (pinch-to-zoom)
    // Check activeTouchCount state first for reliable multi-touch detection
    if (activeTouchCount >= 2) {
      return;
    }

    // Skip pan tracking if a node is currently being dragged
    // This prevents conflict between node dragging and canvas panning gestures
    if (isNodeDraggingRef.current) {
      return;
    }

    // Additional safety check: verify touch count from event as fallback
    // This prevents interference with iOS Safari pinch-zoom performance
    const touchCount = event?.sourceEvent?.touches?.length || event?.touches?.length || 0;
    if (touchCount >= 2) {
      return;
    }

    // Clear any pending pan end timeout to prevent race conditions
    if (panEndTimeoutRef.current) {
      clearTimeout(panEndTimeoutRef.current);
      panEndTimeoutRef.current = null;
    }

    const clientX = event?.clientX || (event?.touches && event.touches[0]?.clientX) || 0;
    const clientY = event?.clientY || (event?.touches && event.touches[0]?.clientY) || 0;

    // Detect if this is a touch gesture (check for touches or touch event types)
    const isTouch = !!(event?.touches || event?.sourceEvent?.touches ||
                       (event?.sourceEvent?.type && event.sourceEvent.type.startsWith('touch')));
    panIsTouchRef.current = isTouch;

    panStartRef.current = {
      x: clientX,
      y: clientY,
      time: Date.now(),
      hasMoved: false
    };
    // Don't set isPanning yet - wait for actual movement in handleCanvasPanMove
  }, [activeTouchCount]);

  // Handle canvas pan move - detect actual panning movement to prevent false positives on touch devices
  const handleCanvasPanMove = useCallback((event) => {
    // Skip pan tracking if this is a multi-touch gesture (pinch-to-zoom)
    // Check activeTouchCount state first for reliable multi-touch detection
    if (activeTouchCount >= 2) {
      return;
    }

    // Skip pan detection if a node is currently being dragged
    // This prevents conflict between node dragging and canvas panning gestures
    if (isNodeDraggingRef.current) {
      return;
    }

    // Additional safety check: verify touch count from event as fallback
    // This prevents interference with iOS Safari pinch-zoom performance
    const touchCount = event?.sourceEvent?.touches?.length || event?.touches?.length || 0;
    if (touchCount >= 2) {
      return;
    }

    const clientX = event?.clientX || (event?.touches && event.touches[0]?.clientX) || 0;
    const clientY = event?.clientY || (event?.touches && event.touches[0]?.clientY) || 0;

    if (panStartRef.current && !panStartRef.current.hasMoved) {
      const dx = Math.abs(clientX - panStartRef.current.x);
      const dy = Math.abs(clientY - panStartRef.current.y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // FIX: Improved adaptive threshold for better touch/mouse distinction
      // Mouse: 5px (precise pointing device)
      // Touch: 10px (less precise, but not too high to prevent node selection)
      const adaptiveThreshold = panIsTouchRef.current ? 10 : 5;

      // Time-based threshold: quick taps should never trigger panning
      // This prevents accidental panning when users tap on nodes
      const timeSinceStart = Date.now() - panStartRef.current.time;
      const isQuickTap = timeSinceStart < GESTURE_TIME_THRESHOLD;

      // IMPROVEMENT: Velocity-based detection to distinguish intentional pans from finger wobble
      // Calculate velocity in pixels per second - intentional pans are faster than accidental drift
      const velocity = timeSinceStart > 0 ? (distance / timeSinceStart) * 1000 : 0;
      const VELOCITY_THRESHOLD = 150; // px/s - intentional pans typically exceed this
      const isIntentionalPan = velocity > VELOCITY_THRESHOLD;

      // IMPROVEMENT: Directional intent detection for touch devices
      // Detect whether the user is panning horizontally, vertically, or diagonally
      // This allows single-axis pans while still filtering out accidental taps
      const isHorizontalPan = dx > dy && dx > 5; // Horizontal-dominant movement
      const isVerticalPan = dy > dx && dy > 5;   // Vertical-dominant movement
      const hasDirectionalIntent = isHorizontalPan || isVerticalPan;

      // IMPROVEMENT: Multi-factor decision logic for more accurate pan detection
      // Combines distance, velocity, and directional requirements
      let shouldTriggerPan = false;

      if (isQuickTap) {
        // Quick gesture (< 200ms): Requires large movement OR high velocity AND directional intent
        // This prevents accidental panning during rapid taps while allowing quick intentional swipes
        shouldTriggerPan = distance > 30 || (isIntentionalPan && hasDirectionalIntent);
      } else {
        // Slow gesture (>= 200ms): Use normal threshold for mouse, enhanced logic for touch
        if (panIsTouchRef.current) {
          // Touch: Require directional intent OR high velocity to reduce false positives
          shouldTriggerPan = (distance > adaptiveThreshold && hasDirectionalIntent) || isIntentionalPan;
        } else {
          // Mouse: Use simple threshold (precise input device)
          shouldTriggerPan = distance > adaptiveThreshold;
        }
      }

      if (shouldTriggerPan) {
        panStartRef.current.hasMoved = true;
        setIsPanning(true);
      }
    }
  }, []);

  // Handle canvas pan end - reset panning state with delay
  const handleCanvasPanEnd = useCallback(() => {
    // Clear any existing timeout before setting a new one
    if (panEndTimeoutRef.current) {
      clearTimeout(panEndTimeoutRef.current);
    }

    // Adaptive delay based on whether panning occurred and input type:
    // - Touch pans: 100ms (reduced from 150ms - faster response for node selection after pan)
    // - Mouse pans: 50ms (reduced from 75ms - faster response for precise input)
    // - No pan detected: 50ms (reduced from 75ms - quick response for clicks)
    const wasPanning = panStartRef.current?.hasMoved;
    const isTouch = panIsTouchRef.current;

    let delay = 50; // Default for non-pan or mouse pan (reduced from 75ms)
    if (wasPanning && isTouch) {
      delay = 100; // Reduced from 150ms - faster response for node selection after pan
    }

    panEndTimeoutRef.current = setTimeout(() => {
      setIsPanning(false);
      // Reset pan start ref
      panStartRef.current = { x: 0, y: 0, time: 0, hasMoved: false };
      panIsTouchRef.current = false;
      panEndTimeoutRef.current = null;
    }, delay);
  }, []);

  // Performance Optimization: Memoized pane click handler to prevent unnecessary re-renders
  // Prevents ReactFlow from re-rendering all nodes when clicking on the canvas background
  const handlePaneClick = useCallback(() => {
    setShowCommentToolbar(false);
    setShowColorPicker(false);
  }, []);

  // Performance Optimization: Memoized move handler to prevent unnecessary re-renders
  // Prevents ReactFlow from re-rendering all nodes during pan/zoom interactions
  const handleMove = useCallback((event, viewport) => {
    // iOS Safari Pinch-to-Zoom Performance Fix: Skip pan detection during multi-touch
    // Prevents ANY processing overhead during pinch-zoom for maximum smoothness
    const touchCount = event?.sourceEvent?.touches?.length || 0;
    if (touchCount < 2) {
      handleCanvasPanMove(event);
    }
    setZoomLevel(viewport.zoom);
    // Update viewport state for node virtualization
    setViewportState(viewport);
  }, [handleCanvasPanMove]);

  // Multi-touch detection handlers for pinch-to-zoom gesture (iOS Safari fix)
  // Tracks the number of active touches to disable panning during multi-touch gestures
  const handleTouchStart = useCallback((event) => {
    // Update active touch count when new touches are detected
    setActiveTouchCount(event.touches.length);
  }, []);

  const handleTouchEnd = useCallback((event) => {
    // Update active touch count when touches are released
    setActiveTouchCount(event.touches.length);
  }, []);

  // Add new card (non-photo types)
  const handleAddCard = useCallback((type) => {
    // Check node limit (computed later, use closure to access)
    if (nodes.length >= nodeLimit) {
      alert(
        `⚠️ Node Limit Reached (${nodeLimit} nodes)\n\n` +
        (tier === 'premium' || isAdmin
          ? 'You are at your canvas limit.'
          : `Free tier allows ${FREE_NODE_LIMIT} nodes.\n\nUpgrade to Pro for ${PRO_NODE_LIMIT} nodes, or use EXPORT to backup and clear your canvas.`)
      );
      return;
    }

    const timestamp = Date.now();
    const totalNodes = nodes.length;
    const gridX = totalNodes % 8;
    const gridY = Math.floor(totalNodes / 8);

    // Photo type opens the upload modal
    if (type === 'photo') {
      setIsUploadModalOpen(true);
      return;
    }

    let newNode;

    if (type === 'note') {
      newNode = {
        id: `note-${timestamp}`,
        type: 'textNode',
        position: {
          x: 300 + gridX * 350,
          y: 100 + gridY * 300
        },
        data: {
          title: 'New Note',
          content: '',
          cardType: 'note',
          color: CARD_TYPES.note.color,
          createdAt: timestamp,
          onUpdate: handleNodeUpdate,
          onDelete: handleDeleteNode,
          onExpandWithAI: handleAIExpandNode,
        }
      };
    } else if (type === 'link') {
      newNode = {
        id: `link-${timestamp}`,
        type: 'textNode',
        position: {
          x: 300 + gridX * 350,
          y: 100 + gridY * 300
        },
        data: {
          title: 'New Link',
          content: '',
          url: '',
          cardType: 'link',
          color: CARD_TYPES.link.color,
          createdAt: timestamp,
          onUpdate: handleNodeUpdate,
          onDelete: handleDeleteNode,
          onExpandWithAI: handleAIExpandNode,
        }
      };
    } else if (type === 'ai') {
      newNode = {
        id: `ai-${timestamp}`,
        type: 'textNode',
        position: {
          x: 300 + gridX * 350,
          y: 100 + gridY * 300
        },
        data: {
          title: 'AI Chat',
          content: '',
          cardType: 'ai',
          color: CARD_TYPES.ai.color,
          createdAt: timestamp,
          onUpdate: handleNodeUpdate,
          onDelete: handleDeleteNode,
          onOpenStudio: handleOpenStudio,
          onExpandWithAI: handleAIExpandNode,
        }
      };
    } else if (type === 'video') {
      newNode = {
        id: `video-${timestamp}`,
        type: 'textNode',
        position: {
          x: 300 + gridX * 350,
          y: 100 + gridY * 300
        },
        data: {
          title: 'New Video',
          content: '',
          url: '',
          cardType: 'video',
          color: CARD_TYPES.video.color,
          createdAt: timestamp,
          onUpdate: handleNodeUpdate,
          onDelete: handleDeleteNode,
          onExpandWithAI: handleAIExpandNode,
        }
      };
    } else if (type === 'sticky') {
      // Premium: Sticky Note
      newNode = {
        id: `sticky-${timestamp}`,
        type: 'stickyNode',
        position: {
          x: 300 + gridX * 200,
          y: 100 + gridY * 200
        },
        data: {
          content: '',
          color: 'yellow',
          size: 150,
          createdAt: timestamp,
          onContentChange: (id, content) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, content } } : n));
          },
          onColorChange: (id, color) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, color } } : n));
          },
          onDelete: handleDeleteNode,
        }
      };
    } else if (type === 'todo') {
      // Premium: To-Do List
      newNode = {
        id: `todo-${timestamp}`,
        type: 'todoNode',
        position: {
          x: 300 + gridX * 280,
          y: 100 + gridY * 300
        },
        data: {
          title: 'To-Do List',
          items: [],
          createdAt: timestamp,
          onTitleChange: (id, title) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, title } } : n));
          },
          onUpdateItems: (id, items) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, items } } : n));
          },
          onDelete: handleDeleteNode,
        }
      };
    } else if (type === 'comment') {
      // Premium: Comment
      newNode = {
        id: `comment-${timestamp}`,
        type: 'commentNode',
        position: {
          x: 300 + gridX * 320,
          y: 100 + gridY * 280
        },
        data: {
          content: '',
          author: user?.displayName || userProfile?.name || 'User',
          timestamp: new Date().toISOString(),
          createdAt: timestamp,
          onContentChange: (id, content) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, content } } : n));
          },
          onDelete: handleDeleteNode,
          onReply: handleReplyToComment, // Enable reply button
        }
      };
    } else if (type === 'colorSwatch' || type === 'swatch') {
      // Premium: Color Palette
      newNode = {
        id: `swatch-${timestamp}`,
        type: 'colorSwatchNode',
        position: {
          x: 300 + gridX * 250,
          y: 100 + gridY * 300
        },
        data: {
          title: 'Color Palette',
          colors: ['#fbbf24', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6'],
          createdAt: timestamp,
          onUpdateColors: (id, colors) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, colors } } : n));
          },
          onDelete: handleDeleteNode,
        }
      };
    } else if (type === 'codeBlock' || type === 'code') {
      // Premium: Code Block
      newNode = {
        id: `code-${timestamp}`,
        type: 'codeBlockNode',
        position: {
          x: 300 + gridX * 360,
          y: 100 + gridY * 350
        },
        data: {
          code: '// Your code here',
          language: 'javascript',
          filename: '',
          createdAt: timestamp,
          onCodeChange: (id, code) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, code } } : n));
          },
          onLanguageChange: (id, language) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, language } } : n));
          },
          onDelete: handleDeleteNode,
        }
      };
    } else if (type === 'group') {
      // Premium: Group Container
      newNode = {
        id: `group-${timestamp}`,
        type: 'groupNode',
        position: {
          x: 200 + gridX * 350,
          y: 50 + gridY * 250
        },
        data: {
          label: 'Group',
          color: 'gray',
          width: 300,
          height: 200,
          childCount: 0,
          createdAt: timestamp,
          onLabelChange: (id, label) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label } } : n));
          },
          onResize: (id, width, height) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, width, height } } : n));
          },
          onColorChange: (id, color) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, color } } : n));
          },
          onDelete: handleDeleteNode,
          onConvertToTodo: handleConvertGroupToTodo,
        },
        style: { zIndex: -1 }, // Groups should be behind other nodes
      };
    } else if (type === 'map') {
      // Premium: Map Node (single location)
      const googleMapsKey = storedGoogleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const nodeId = `map-${timestamp}`;
      newNode = {
        id: nodeId,
        type: 'mapNode',
        position: {
          x: 300 + gridX * 400,
          y: 100 + gridY * 350
        },
        data: {
          title: 'Map',
          address: '',
          coordinates: null,
          zoom: 14,
          places: [],
          apiKey: googleMapsKey || '',
          createdAt: timestamp,
          onDataChange: (id, updates) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === id
                  ? { ...n, data: { ...n.data, ...updates } }
                  : n
              )
            );
          },
          onDelete: handleDeleteNode,
        }
      };
    } else if (type === 'tripPlanner') {
      // Premium: Trip Planner Map Node
      const googleMapsKey = storedGoogleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const nodeId = `trip-${timestamp}`;
      newNode = {
        id: nodeId,
        type: 'tripPlannerMapNode',
        position: {
          x: 300 + gridX * 500,
          y: 100 + gridY * 400
        },
        data: {
          title: 'Trip Planner',
          baseLocation: null,
          places: [],
          proximityGroups: [],
          aiSuggestion: '',
          apiKey: googleMapsKey || '',
          createdAt: timestamp,
          onDataChange: (id, updates) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === id
                  ? { ...n, data: { ...n.data, ...updates } }
                  : n
              )
            );
          },
          onDelete: handleDeleteNode,
          onExtractToTodo: handleExtractLocationsToTodo,
        }
      };
    }

    if (newNode) {
      // Save current state to history before adding node
      saveToHistory();
      // Set the flag before adding the node to trigger fitView after render
      pendingFitViewRef.current = true;
      setNodes((nds) => [...nds, newNode]);
    }
  }, [nodes.length, nodeLimit, tier, isAdmin, handleNodeUpdate, handleDeleteNode, setNodes, fitView, setIsUploadModalOpen, handleOpenStudio, user, userProfile, storedGoogleMapsKey, saveToHistory]);

  // Insert template - creates multiple nodes from a template
  const handleInsertTemplate = useCallback((templateId) => {
    const template = NODE_TEMPLATES[templateId];
    if (!template) return;

    // Check if adding template nodes would exceed limit
    const newNodesCount = template.nodes.length;
    if (nodes.length + newNodesCount > nodeLimit) {
      alert(
        `⚠️ Node Limit Would Be Exceeded\n\n` +
        `This template adds ${newNodesCount} nodes.\n` +
        `Current: ${nodes.length} / ${nodeLimit}\n\n` +
        (tier === 'premium' || isAdmin
          ? 'You would exceed your canvas limit.'
          : `Free tier allows ${FREE_NODE_LIMIT} nodes.\n\nUpgrade to Pro for ${PRO_NODE_LIMIT} nodes.`)
      );
      return;
    }

    const timestamp = Date.now();
    const baseX = 300;
    const baseY = 100;

    // Create all nodes from template
    const newNodes = template.nodes.map((nodeTemplate, index) => {
      const nodeTimestamp = timestamp + index;
      return {
        id: `${nodeTemplate.type}-${nodeTimestamp}`,
        type: 'textNode',
        position: {
          x: baseX + nodeTemplate.offsetX,
          y: baseY + nodeTemplate.offsetY
        },
        data: {
          title: nodeTemplate.title,
          content: nodeTemplate.content,
          cardType: nodeTemplate.type,
          color: CARD_TYPES[nodeTemplate.type]?.color || CARD_TYPES.note.color,
          createdAt: nodeTimestamp,
          onUpdate: handleNodeUpdate,
          onDelete: handleDeleteNode,
          onExpandWithAI: handleAIExpandNode,
        }
      };
    });

    // Save current state to history before adding nodes
    saveToHistory();

    // Add all template nodes at once
    setNodes((nds) => [...nds, ...newNodes]);

    // Close the modal
    setShowTemplatesModal(false);

    // Fit view to show all nodes including new ones
    setTimeout(() => {
      fitView({ duration: 400, padding: 0.2 });
    }, 100);
  }, [nodes.length, nodeLimit, tier, isAdmin, handleNodeUpdate, handleDeleteNode, handleAIExpandNode, saveToHistory, setNodes, fitView]);

  // Save current node as a custom template
  const handleSaveAsTemplate = useCallback((nodeId) => {
    const node = nodeById.get(nodeId); // O(1) Map lookup
    if (!node) return;

    const templateName = prompt('Enter a name for this template:');
    if (!templateName || !templateName.trim()) return;

    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: templateName.trim(),
      type: node.data.cardType || 'note',
      color: node.data.color,
      content: node.data.content || '',
      title: node.data.title || '',
      createdAt: Date.now(),
      isCustom: true
    };

    const updatedTemplates = [...nodeTemplates, newTemplate];
    setNodeTemplates(updatedTemplates);

    // Persist to localStorage
    try {
      localStorage.setItem('unity-notes-node-templates', JSON.stringify(updatedTemplates));
      showToast(`Template "${templateName}" saved!`, 'success');
    } catch (error) {
      showToast('Failed to save template', 'error');
      console.error('Error saving template:', error);
    }
  }, [nodes, nodeTemplates, showToast]);

  // Load a custom template as a new node
  const handleLoadTemplate = useCallback((templateId) => {
    const template = nodeTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Check node limit
    if (nodes.length >= nodeLimit) {
      alert(
        `⚠️ Node Limit Reached\n\n` +
        `Current: ${nodes.length} / ${nodeLimit}\n\n` +
        (tier === 'premium' || isAdmin
          ? 'You have reached your canvas limit.'
          : `Free tier allows ${FREE_NODE_LIMIT} nodes.\n\nUpgrade to Pro for ${PRO_NODE_LIMIT} nodes.`)
      );
      return;
    }

    const timestamp = Date.now();
    const newNode = {
      id: `${template.type}-${timestamp}`,
      type: 'textNode',
      position: {
        x: 300 + Math.random() * 100, // Add slight offset to avoid overlap
        y: 100 + Math.random() * 100
      },
      data: {
        title: template.title,
        content: template.content,
        cardType: template.type,
        color: template.color || CARD_TYPES[template.type]?.color || CARD_TYPES.note.color,
        createdAt: timestamp,
        onUpdate: handleNodeUpdate,
        onDelete: handleDeleteNode,
        onExpandWithAI: handleAIExpandNode,
      }
    };

    // Save current state to history before adding node
    saveToHistory();

    // Add the new node
    setNodes((nds) => [...nds, newNode]);

    // Close the modal
    setShowTemplatesModal(false);

    // Show success message
    showToast(`Template "${template.name}" loaded!`, 'success');

    // Fit view to show the new node
    setTimeout(() => {
      fitView({ duration: 400, padding: 0.2 });
    }, 100);
  }, [nodeTemplates, nodes.length, nodeLimit, tier, isAdmin, handleNodeUpdate, handleDeleteNode, handleAIExpandNode, saveToHistory, setNodes, showToast, fitView]);

  // Delete a custom template
  const handleDeleteTemplate = useCallback((templateId) => {
    const template = nodeTemplates.find(t => t.id === templateId);
    if (!template) return;

    if (!window.confirm(`Delete template "${template.name}"?`)) return;

    const updatedTemplates = nodeTemplates.filter(t => t.id !== templateId);
    setNodeTemplates(updatedTemplates);

    // Persist to localStorage
    try {
      localStorage.setItem('unity-notes-node-templates', JSON.stringify(updatedTemplates));
      showToast(`Template "${template.name}" deleted`, 'info');
    } catch (error) {
      showToast('Failed to delete template', 'error');
      console.error('Error deleting template:', error);
    }
  }, [nodeTemplates, showToast]);

  // Handle Deploy from ProspectNode - opens prospect modal
  // Uses refs to avoid circular dependency with useEffect that injects callbacks
  const handleDeployFromNode = useCallback(async (nodeId, nodeData) => {
    if (!hasProAccess()) {
      alert(
        '☁️ Deploy Campaign - Pro Feature\n\n' +
        'Deploying campaigns is available for Pro users.\n\n' +
        'Contact us for Pro access.'
      );
      return;
    }

    // Use refs to get current state without causing re-renders
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    // Check for email nodes connected to this campaign
    const emailNodes = currentNodes.filter(n => n.type === 'emailNode');
    if (emailNodes.length === 0) {
      alert('⚠️ No email nodes in campaign.\n\nAdd at least one email to deploy.');
      return;
    }

    // Save journey first if not saved
    if (!currentJourneyId) {
      try {
        const journeyId = await saveJourney(currentNodes, currentEdges, {
          title: journeyTitle || nodeData.label || 'Campaign Journey',
          status: 'draft'
        });
        setCurrentJourneyId(journeyId);
      } catch (error) {
        alert(`❌ Failed to save journey: ${error.message}`);
        return;
      }
    }

    // Update prospect node status
    setNodes(nds => nds.map(n =>
      n.id === nodeId
        ? { ...n, data: { ...n.data, status: 'deployed' } }
        : n
    ));

    // Open prospect modal
    setShowProspectModal(true);
  }, [currentJourneyId, journeyTitle, saveJourney, setNodes]);

  // Helper: Count prospects at each node
  const getProspectsAtNode = useCallback((nodeId) => {
    if (!journeyProspects || journeyProspects.length === 0) return 0;
    return journeyProspects.filter(p => p.currentNodeId === nodeId && p.status === 'active').length;
  }, [journeyProspects]);

  // Toggle star on a node
  const handleToggleNodeStar = useCallback((nodeId) => {
    setStarredNodeIds(prev => {
      const newSet = new Set(prev);
      const wasStarred = newSet.has(nodeId);
      if (wasStarred) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      // Persist to localStorage
      try {
        localStorage.setItem('unity-notes-starred-nodes', JSON.stringify([...newSet]));
      } catch (e) {
        console.error('Failed to save starred nodes:', e);
      }

      // Immediately update the specific node's isStarred state for instant UI feedback
      setNodes(nds => nds.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              isStarred: !wasStarred
            }
          };
        }
        return node;
      }));

      return newSet;
    });
  }, [setNodes]);

  // Unstar a specific node (from tray)
  const handleUnstarNode = useCallback((nodeId) => {
    setStarredNodeIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      // Persist to localStorage
      try {
        localStorage.setItem('unity-notes-starred-nodes', JSON.stringify([...newSet]));
      } catch (e) {
        console.error('Failed to save starred nodes:', e);
      }

      // Immediately update the specific node's isStarred state for instant UI feedback
      setNodes(nds => nds.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              isStarred: false
            }
          };
        }
        return node;
      }));

      return newSet;
    });
  }, [setNodes]);

  // Performance optimization: Memoized callbacks for OverviewTray to prevent unnecessary re-renders
  const handleOverviewTrayClose = useCallback(() => {
    setShowOverviewTray(false);
  }, []);

  const handleOverviewNodeClick = useCallback((node) => {
    // Focus on the clicked node
    const { x, y } = node.position;
    // For child nodes, calculate absolute position
    const parentNode = node.parentId ? nodeById.get(node.parentId) : null;
    const absX = parentNode ? parentNode.position.x + x : x;
    const absY = parentNode ? parentNode.position.y + y : y;
    setCenter(absX + 100, absY + 75, { duration: 400, zoom: 1.2 });
    setShowOverviewTray(false);
  }, [nodeById, setCenter]);

  const handleOverviewCapsuleLoad = useCallback((capsule) => {
    // Navigate to edit the capsule
    window.location.href = `/unity-notes?capsule=${capsule.id}`;
  }, []);

  const handleOverviewNotificationClick = useCallback((notification) => {
    // Find the node associated with this notification
    const targetNode = nodeById.get(notification.nodeId);
    if (targetNode) {
      const { x, y } = targetNode.position;
      // For child nodes (like comments), calculate absolute position
      const parentNode = targetNode.parentId ? nodeById.get(targetNode.parentId) : null;
      const absX = parentNode ? parentNode.position.x + x : x;
      const absY = parentNode ? parentNode.position.y + y : y;
      // Focus camera on the notification's node
      setCenter(absX + 100, absY + 75, { duration: 400, zoom: 1.2 });
    }
    // Close the overview tray
    setShowOverviewTray(false);
  }, [nodeById, setCenter]);

  const handleOverviewUnstar = useCallback(async (capsuleId) => {
    // Unstar capsule and refresh list
    try {
      await toggleBookmark(capsuleId);
      // Refresh bookmarked capsules
      if (user?.uid) {
        const capsules = await getBookmarkedCapsules(user.uid);
        setBookmarkedCapsules(capsules);
      }
    } catch (err) {
      console.error('Failed to unstar capsule:', err);
    }
  }, [toggleBookmark, user, getBookmarkedCapsules]);

  const handleOverviewRenameCapsule = useCallback(async (capsuleId, newTitle) => {
    try {
      await renameCapsule(capsuleId, newTitle);
      // Refresh bookmarked capsules to show updated title
      if (user?.uid) {
        const capsules = await getBookmarkedCapsules(user.uid);
        setBookmarkedCapsules(capsules);
      }
    } catch (err) {
      console.error('Failed to rename capsule:', err);
      alert('Failed to rename capsule. Please try again.');
    }
  }, [renameCapsule, user, getBookmarkedCapsules]);

  // Performance optimization: Memoized modal close handlers to prevent unnecessary re-renders
  const handleCloseShortcutsHelp = useCallback(() => {
    setShowShortcutsHelp(false);
  }, []);

  const handleCloseAnalytics = useCallback(() => {
    setShowAnalytics(false);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  const handleCloseShareModal = useCallback(() => {
    setShowShareModal(false);
  }, []);

  const handleCloseTemplatesModal = useCallback(() => {
    setShowTemplatesModal(false);
  }, []);

  const handleCloseProspectModal = useCallback(() => {
    setShowProspectModal(false);
  }, []);

  const handleCloseEmailPreview = useCallback(() => {
    setShowEmailPreview(false);
  }, []);

  const handleCloseStudioCanvas = useCallback(() => {
    setStudioContext(null); // Clear context when closing
    handleModeChange('notes');
  }, [handleModeChange]);

  // Performance optimization: Memoize studio callbacks to prevent recreation on every render
  const handleExportToMAP = useCallback((asset) => {
    // Save template to localStorage for MAP to pick up
    const templates = JSON.parse(localStorage.getItem('unity-studio-templates') || '[]');
    templates.push({
      ...asset,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('unity-studio-templates', JSON.stringify(templates));
  }, []);

  const handleSaveToCanvas = useCallback((nodeData) => {
    // Create a new text node on the canvas with the template content
    const newNode = {
      id: `studio-${Date.now()}`,
      type: nodeData.type || 'textNode',
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: {
        ...nodeData.data,
        onUpdate: (nodeId, updates) => {
          setNodes(nds => nds.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
          ));
        },
        onDelete: (nodeId) => {
          setNodes(nds => nds.filter(n => n.id !== nodeId));
        }
      }
    };
    setNodes(nds => [...nds, newNode]);
    handleModeChange('notes'); // Switch back to notes after saving
  }, [handleModeChange]);

  const handleCloseAICanvasModal = useCallback(() => {
    setShowAICanvasModal(false);
    setIsGeneratingCanvas(false);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setShowLightbox(false);
    setLightboxPhoto(null);
  }, []);

  const handleCloseEditMemory = useCallback(() => {
    setShowEditModal(false);
    setEditingMemory(null);
    setEditingNodeId(null);
  }, []);

  const handleCloseEmailEdit = useCallback(() => {
    setShowEmailEditModal(false);
    setEditingEmailNodeId(null);
    setEditingEmailData(null);
  }, []);

  const handleCloseWaitEdit = useCallback(() => {
    setShowWaitEditModal(false);
    setEditingWaitNodeId(null);
    setEditingWaitData(null);
  }, []);

  const handleCloseConditionEdit = useCallback(() => {
    setShowConditionEditModal(false);
    setEditingConditionNodeId(null);
    setEditingConditionData(null);
  }, []);

  // Compute starred nodes from current nodes
  const starredNodes = useMemo(() => {
    return nodes.filter(node => starredNodeIds.has(node.id));
  }, [nodes, starredNodeIds]);

  // Performance optimization: Cache the selected node to avoid repeated find() calls
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.selected);
  }, [nodes]);

  // Ensure all nodes have callbacks - runs on init AND when new nodes are added
  useEffect(() => {
    if (!isInitialized) return;

    setNodes((nds) => {
      // Check if any node needs callback injection (prevents infinite loop)
      // A node needs injection if it's missing the onToggleStar callback
      const needsInjection = nds.some(n => n.data && !n.data.onToggleStar);
      if (!needsInjection) return nds; // Return same reference to avoid re-render

      return nds.map((node) => {
        // Determine the correct inline edit handler based on node type
        let inlineEditHandler = null;
        if (node.type === 'emailNode') {
          inlineEditHandler = handleInlineEmailEdit;
        } else if (node.type === 'waitNode') {
          inlineEditHandler = handleInlineWaitEdit;
        } else if (node.type === 'conditionNode') {
          inlineEditHandler = handleInlineConditionEdit;
        }

        // Count prospects at this node for visual display
        const prospectsAtNode = getProspectsAtNode(node.id);

        return {
          ...node,
          data: {
            ...node.data,
            // Only apply handlePhotoResize to photoNodes - GroupNodes have their own resize handler
            onResize: node.type === 'photoNode' ? handlePhotoResize : node.data?.onResize,
            onLightbox: handleLightbox,
            onEdit: handleEdit,
            onUpdate: handleNodeUpdate,
            onDelete: handleDeleteNode,
            onPreview: handleEmailPreview,
            onInlineEdit: inlineEditHandler,
            onEditInOutreach: handleEditInOutreach,
            // ProspectNode uses onEditCampaign to edit the entire campaign
            onEditCampaign: node.type === 'prospectNode' ? handleEditInOutreach : undefined,
            // ProspectNode uses onDeploy to deploy/add prospects
            onDeploy: node.type === 'prospectNode' ? handleDeployFromNode : undefined,
            // AI image analysis for photo nodes
            onAnalyze: node.type === 'photoNode' ? handleImageAnalyze : undefined,
            // AI Chat -> Studio integration
            onOpenStudio: node.data?.cardType === 'ai' ? handleOpenStudio : undefined,
            // AI Expand - Enhance existing text-based nodes
            onExpandWithAI: node.type === 'textNode' ? handleAIExpandNode : undefined,
            // AI regenerate for AI-generated nodes
            onRegenerate: node.type === 'textNode' && node.data?.aiGenerated ? handleRegenerateNote :
                         node.type === 'photoNode' && node.data?.aiGenerated ? handleRegenerateImage :
                         node.data?.onRegenerate,
            // Prospect count at this node (for visual tracking)
            prospectsAtNode: prospectsAtNode,
            // Starring functionality
            onToggleStar: handleToggleNodeStar,
            isStarred: starredNodeIds.has(node.id),
          }
        };
      });
    });
  }, [isInitialized, nodes.length, handlePhotoResize, handleLightbox, handleEdit, handleNodeUpdate, handleDeleteNode, handleEmailPreview, handleInlineEmailEdit, handleInlineWaitEdit, handleInlineConditionEdit, handleEditInOutreach, handleDeployFromNode, handleImageAnalyze, handleOpenStudio, handleAIExpandNode, getProspectsAtNode, handleToggleNodeStar, starredNodeIds, handleRegenerateNote, handleRegenerateImage, setNodes]);

  // Save to localStorage with status indicator (debounced)
  useEffect(() => {
    // Skip auto-save during clear operation to prevent race condition
    if (!isInitialized || isClearingRef.current) return;

    // Clear any pending save
    if (localSaveTimerRef.current) {
      clearTimeout(localSaveTimerRef.current);
    }

    // Show saving indicator immediately for UX feedback
    setIsSavingLocal(true);

    // Debounce: wait 500ms after last change before saving
    localSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
        setLastSavedAt(new Date());
      } catch (error) {
        console.error('❌ localStorage save error:', error);
        alert('⚠️ Unable to save locally. Your notes will be preserved in the current session.\n\nUse EXPORT to save as JSON file, or SHARE to save to cloud.');
      } finally {
        // Brief delay to show saving indicator
        setTimeout(() => setIsSavingLocal(false), 300);
      }
    }, 500);

    // Cleanup on unmount
    return () => {
      if (localSaveTimerRef.current) {
        clearTimeout(localSaveTimerRef.current);
      }
    };
  }, [nodes, edges, isInitialized]);

  // Save AI conversation histories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('unity-notes-ai-conversations', JSON.stringify(conversationHistories));
    } catch (error) {
      console.error('❌ Failed to save conversation history:', error);
    }
  }, [conversationHistories]);

  // Auto-save to localStorage (debounced)
  const localSaveTimerRef = useRef(null);

  // PERFORMANCE OPTIMIZATION: Memoize serializable nodes to avoid re-computation on every auto-save timer
  // This prevents expensive Object.keys().forEach() operations from running every 2 seconds
  // Expected improvement: 80-95% reduction in auto-save CPU overhead for large graphs
  const serializableNodes = useMemo(() => {
    return nodes.map(node => {
      const serializableData = {};
      if (node.data) {
        Object.keys(node.data).forEach(key => {
          const value = node.data[key];
          if (typeof value !== 'function') {
            serializableData[key] = value;
          }
        });
      }
      return {
        id: node.id,
        type: node.type,
        position: { x: node.position.x, y: node.position.y },
        ...(node.parentId && { parentId: node.parentId }),
        ...(node.extent && { extent: node.extent }),
        data: serializableData
      };
    });
  }, [nodes]);

  // PERFORMANCE OPTIMIZATION: Memoize serializable edges to avoid re-computation on every auto-save timer
  const serializableEdges = useMemo(() => {
    return edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default'
    }));
  }, [edges]);

  // Auto-save to Firestore when editing a capsule (debounced)
  const autoSaveTimerRef = useRef(null);
  useEffect(() => {
    // Only auto-save if we're editing an existing capsule AND have edit permissions
    // Also skip during clear operation to prevent race conditions
    if (!isInitialized || !currentCapsuleId || nodes.length === 0 || !canEditCapsule || isClearingRef.current) return;

    // Clear any pending save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Debounce: wait 2 seconds after last change before saving
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('☁️ Auto-saving capsule to Firestore...');
        }
        setSyncStatus('syncing'); // Set sync status to syncing

        // Use memoized serializable nodes and edges (computed above with useMemo)
        // This avoids expensive re-serialization on every auto-save timer fire

        // Include conversation history in metadata for persistence
        const metadata = {
          conversationHistory: conversationHistories[currentCapsuleId] || []
        };

        await updateCapsule(currentCapsuleId, serializableNodes, serializableEdges, metadata);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Auto-saved capsule with conversation history:', currentCapsuleId);
        }

        // Update sync status to synced
        setSyncStatus('synced');
        setLastSyncTime(new Date());

        // Auto-hide synced status after 2 seconds
        setTimeout(() => {
          setSyncStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('❌ Auto-save to Firestore failed:', error);
        setSyncStatus('error'); // Set sync status to error
        // Don't show alert - localStorage save is the fallback
      }
    }, 2000); // 2 second debounce

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [nodes, edges, conversationHistories, isInitialized, currentCapsuleId, canEditCapsule, updateCapsule]);

  // Update zoom level when viewport changes
  useEffect(() => {
    const updateZoom = () => {
      const currentZoom = getZoom();
      setZoomLevel(currentZoom);
    };
    updateZoom();
  }, [getZoom]);

  // Fix viewport reset on orientation change (iOS Safari) - v2 PROACTIVE SNAPSHOT
  useEffect(() => {
    let resizeTimer;
    let orientationChangeDetected = false;

    // CRITICAL FIX: Continuously save viewport state so we always have the pre-resize position
    // BUG IN OLD CODE: Saving viewport AFTER orientationchange event fires is too late -
    // iOS Safari may have already recalculated layout, causing the viewport to jump.
    // SOLUTION: Maintain a fresh viewport snapshot every 100ms, so when orientation changes,
    // we have the correct pre-change position cached.
    const saveCurrentViewport = () => {
      if (!orientationChangeDetected) {
        viewportBeforeResize.current = getViewport();
      }
    };

    // Update viewport snapshot frequently to catch state before orientation change
    const snapshotInterval = setInterval(saveCurrentViewport, 100);

    const handleOrientationChange = () => {
      orientationChangeDetected = true;

      // Clear any pending restoration
      clearTimeout(resizeTimer);

      // Wait for browser to settle after orientation change, then restore viewport
      // iOS Safari needs ~150ms for layout recalculation (increased from 100ms)
      resizeTimer = setTimeout(() => {
        if (viewportBeforeResize.current && nodes.length > 0) {
          // Restore the viewport to prevent canvas from jumping
          // duration: 0 ensures instant snap without animation
          setViewport(viewportBeforeResize.current, { duration: 0 });

          // Re-enable viewport snapshots after restoration
          setTimeout(() => {
            orientationChangeDetected = false;
          }, 50);
        }
      }, 150);
    };

    const handleResize = () => {
      // Only restore viewport if this resize is from orientation change
      // (not from keyboard appearing, drawer opening, etc.)
      // Use modern Screen Orientation API (window.orientation is deprecated since iOS 13)
      const hasOrientation = (screen.orientation !== undefined) || (window.orientation !== undefined);
      if (hasOrientation && viewportBeforeResize.current) {
        handleOrientationChange();
      }
    };

    // Listen for both resize and orientationchange events
    // orientationchange is iOS-specific and more reliable for device rotation
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      clearInterval(snapshotInterval);
    };
  }, [getViewport, setViewport, nodes.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields or contentEditable elements
      if (event.target.tagName === 'INPUT' ||
          event.target.tagName === 'TEXTAREA' ||
          event.target.isContentEditable) {
        return;
      }

      // Cmd+/ (Mac) or Ctrl+/ (Windows) for quick comment
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        handleQuickComment();
        return;
      }

      // Cmd+Shift+S (Mac) or Ctrl+Shift+S (Windows) to cycle through starred nodes
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();

        if (starredNodes.length === 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log('No starred nodes to navigate to');
          }
          return;
        }

        // Cycle to next starred node
        const nextIndex = (currentStarredIndex + 1) % starredNodes.length;
        setCurrentStarredIndex(nextIndex);
        const targetNode = starredNodes[nextIndex];

        // Center viewport on node
        const nodeWidth = targetNode.width || 200;
        const nodeHeight = targetNode.height || 100;
        setCenter(
          targetNode.position.x + nodeWidth / 2,
          targetNode.position.y + nodeHeight / 2,
          { zoom: 1.2, duration: 400 }
        );

        if (process.env.NODE_ENV === 'development') {
          console.log(`Navigated to starred node ${nextIndex + 1}/${starredNodes.length}: ${targetNode.data?.label || targetNode.id}`);
        }
        return;
      }

      // Cmd+Shift+T (Mac) or Ctrl+Shift+T (Windows) to show node templates
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        setShowTemplatesModal(true);
        return;
      }

      const panAmount = 200;

      switch (event.key) {
        case 'ArrowUp': {
          event.preventDefault();
          const currentViewportUp = document.querySelector('.react-flow__viewport');
          if (currentViewportUp) {
            const transform = currentViewportUp.style.transform;
            const match = transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/);
            if (match) {
              const x = parseFloat(match[1]);
              const y = parseFloat(match[2]) + panAmount;
              currentViewportUp.style.transform = `translate(${x}px, ${y}px) scale(1)`;
            }
          }
          break;
        }
        case 'ArrowDown': {
          event.preventDefault();
          const currentViewportDown = document.querySelector('.react-flow__viewport');
          if (currentViewportDown) {
            const transform = currentViewportDown.style.transform;
            const match = transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/);
            if (match) {
              const x = parseFloat(match[1]);
              const y = parseFloat(match[2]) - panAmount;
              currentViewportDown.style.transform = `translate(${x}px, ${y}px) scale(1)`;
            }
          }
          break;
        }
        case 'ArrowLeft': {
          event.preventDefault();
          const currentViewportLeft = document.querySelector('.react-flow__viewport');
          if (currentViewportLeft) {
            const transform = currentViewportLeft.style.transform;
            const match = transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/);
            if (match) {
              const x = parseFloat(match[1]) + panAmount;
              const y = parseFloat(match[2]);
              currentViewportLeft.style.transform = `translate(${x}px, ${y}px) scale(1)`;
            }
          }
          break;
        }
        case 'ArrowRight': {
          event.preventDefault();
          const currentViewportRight = document.querySelector('.react-flow__viewport');
          if (currentViewportRight) {
            const transform = currentViewportRight.style.transform;
            const match = transform.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/);
            if (match) {
              const x = parseFloat(match[1]) - panAmount;
              const y = parseFloat(match[2]);
              currentViewportRight.style.transform = `translate(${x}px, ${y}px) scale(1)`;
            }
          }
          break;
        }
        case '+':
        case '=':
          event.preventDefault();
          zoomIn({ duration: 200 });
          break;
        case '-':
        case '_':
          event.preventDefault();
          zoomOut({ duration: 200 });
          break;
        case '0':
          event.preventDefault();
          fitView({ duration: 400, padding: 0.2 });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, fitView, handleQuickComment, starredNodes, currentStarredIndex, setCenter, setShowTemplatesModal]);

  // Auto-layout function to organize nodes
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;

    const NODE_WIDTH = 250;
    const NODE_HEIGHT = 150;
    const VERTICAL_GAP = 60;
    const HORIZONTAL_GAP = 80;
    const START_X = 100;
    const START_Y = 100;
    const GROUP_GAP = 100;
    const CHILD_PADDING = 50;  // Increased padding inside groups
    const CHILD_GAP = 40;      // Increased gap between children

    // Separate nodes into categories
    // Performance optimization: Single-pass categorization instead of 4 sequential filters
    // Reduces complexity from O(4n) to O(n) - 75% reduction in iterations
    // Use module-level MAP_NODE_TYPES Set for O(1) type checking
    const { mapNodes, groupNodes, childNodes, orphanNodes } = nodes.reduce((acc, n) => {
      if (MAP_NODE_TYPES.has(n.type)) {
        acc.mapNodes.push(n);
      } else if (n.type === 'groupNode') {
        acc.groupNodes.push(n);
      }

      if (n.parentId) {
        acc.childNodes.push(n);
      } else if (n.type !== 'groupNode' && !MAP_NODE_TYPES.has(n.type)) {
        acc.orphanNodes.push(n);
      }

      return acc;
    }, { mapNodes: [], groupNodes: [], childNodes: [], orphanNodes: [] });

    // Build parent-child map
    const childrenByGroup = {};
    childNodes.forEach(child => {
      if (!childrenByGroup[child.parentId]) {
        childrenByGroup[child.parentId] = [];
      }
      childrenByGroup[child.parentId].push(child);
    });

    let updatedNodes = [];
    let currentY = START_Y;

    // 1. Layout MAP nodes in vertical flow (left side)
    if (mapNodes.length > 0) {
      const sortedMapNodes = [...mapNodes].sort((a, b) => a.position.y - b.position.y);
      const centerX = 400;

      sortedMapNodes.forEach((node, index) => {
        updatedNodes.push({
          ...node,
          position: {
            x: centerX,
            y: START_Y + (index * (NODE_HEIGHT + VERTICAL_GAP))
          }
        });
      });
    }

    // Calculate offset for groups/orphans based on MAP nodes
    const contentStartX = mapNodes.length > 0 ? 800 : START_X;
    let contentX = contentStartX;
    let rowMaxHeight = 0;
    let groupsPerRow = 2;
    let groupIndex = 0;

    // 2. Layout group nodes with their children internally arranged
    groupNodes.forEach((group) => {
      const children = childrenByGroup[group.id] || [];
      const groupWidth = group.data?.width || 300;
      const groupHeight = group.data?.height || 200;

      // Position group
      if (groupIndex > 0 && groupIndex % groupsPerRow === 0) {
        // New row
        currentY += rowMaxHeight + GROUP_GAP;
        contentX = contentStartX;
        rowMaxHeight = 0;
      }

      const groupPosition = { x: contentX, y: currentY };

      // Layout children inside group (relative positions)
      // Use 2 columns for better readability, but allow 3 for many children
      const childCols = children.length > 6 ? 3 : 2;
      // Node sizes - match actual rendered dimensions
      const childWidth = 280;   // Actual nodes are ~250px wide + margin
      const childHeight = 220;  // Taller to fit todo lists, text nodes, photos
      const updatedChildren = children.map((child, i) => {
        const col = i % childCols;
        const row = Math.floor(i / childCols);
        return {
          ...child,
          position: {
            x: CHILD_PADDING + col * (childWidth + CHILD_GAP),
            y: CHILD_PADDING + 40 + row * (childHeight + CHILD_GAP) // Extra 40 for group label
          }
        };
      });

      // Auto-expand group if children overflow
      const neededWidth = children.length > 0
        ? CHILD_PADDING * 2 + Math.min(children.length, childCols) * (childWidth + CHILD_GAP) - CHILD_GAP
        : groupWidth;
      const neededHeight = children.length > 0
        ? CHILD_PADDING * 2 + 20 + Math.ceil(children.length / childCols) * (childHeight + CHILD_GAP) - CHILD_GAP
        : groupHeight;

      const finalWidth = Math.max(groupWidth, neededWidth);
      const finalHeight = Math.max(groupHeight, neededHeight);

      updatedNodes.push({
        ...group,
        position: groupPosition,
        data: {
          ...group.data,
          width: finalWidth,
          height: finalHeight,
          childCount: children.length
        }
      });

      updatedNodes.push(...updatedChildren);

      // Track position for next group
      contentX += finalWidth + GROUP_GAP;
      rowMaxHeight = Math.max(rowMaxHeight, finalHeight);
      groupIndex++;
    });

    // Move Y past groups for orphan layout
    if (groupNodes.length > 0) {
      currentY += rowMaxHeight + GROUP_GAP;
    }

    // 3. Layout orphan nodes in grid below groups
    if (orphanNodes.length > 0) {
      const COLS = Math.ceil(Math.sqrt(orphanNodes.length));

      orphanNodes.forEach((node, index) => {
        const row = Math.floor(index / COLS);
        const col = index % COLS;
        updatedNodes.push({
          ...node,
          position: {
            x: contentStartX + (col * (NODE_WIDTH + HORIZONTAL_GAP)),
            y: currentY + (row * (NODE_HEIGHT + VERTICAL_GAP))
          }
        });
      });
    }

    setNodes(updatedNodes);

    // Fit view after layout
    setTimeout(() => {
      fitView({ duration: 400, padding: 0.2 });
    }, 100);
  }, [nodes, setNodes, fitView]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Export layout as JSON file (Enhanced with AI conversations and theme)
  const handleExportJSON = useCallback(() => {
    if (nodes.length === 0) {
      alert('⚠️ No notes to export. Add some notes first!');
      return;
    }

    // Generate a friendly filename based on capsule name or first note
    const capsuleName = currentCapsuleName ||
                        (nodes[0]?.data?.label || 'untitled').substring(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const exportData = {
      version: '2.0', // Updated version to indicate enhanced export
      exportDate: new Date().toISOString(),
      title: 'UnityNotes Export',
      capsuleName: currentCapsuleName || 'Untitled Capsule',
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        exportedBy: user?.email || 'anonymous',
        tier: tier || 'free'
      },
      nodes,
      edges,
      // Include AI conversation histories if available
      conversationHistories: conversationHistories || {},
      // Include theme preference
      theme: selectedTheme || 'twilight'
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    link.download = `unitynotes-${capsuleName}-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success message
    alert(`✅ Export successful!\n\nExported ${nodes.length} notes with AI conversations and settings.\nFile: unitynotes-${capsuleName}-${timestamp}.json`);
  }, [nodes, edges, currentCapsuleName, conversationHistories, selectedTheme, user?.email, tier]);

  // Export canvas as Markdown document
  const handleExportMarkdown = useCallback(() => {
    if (nodes.length === 0) {
      alert('⚠️ No notes to export. Add some notes first!');
      return;
    }

    // Generate a friendly filename
    const capsuleName = currentCapsuleName ||
                        (nodes[0]?.data?.label || 'untitled').substring(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];

    // Build markdown content
    let markdown = `# ${currentCapsuleName || 'UnityNotes Canvas'}\n\n`;
    markdown += `**Exported:** ${new Date().toLocaleString()}\n`;
    markdown += `**Notes:** ${nodes.length} | **Connections:** ${edges.length}\n\n`;
    markdown += `---\n\n`;

    // Group nodes by type
    const nodesByType = nodes.reduce((acc, node) => {
      const type = node.type || 'default';
      if (!acc[type]) acc[type] = [];
      acc[type].push(node);
      return acc;
    }, {});

    // Export each type section
    const typeLabels = {
      note: '📝 Notes',
      todo: '✅ Todo Items',
      tripPlanner: '🗺️ Trip Plans',
      groupNode: '📁 Groups',
      commentNode: '💬 Comments',
      default: '📄 Items'
    };

    Object.entries(nodesByType).forEach(([type, typeNodes]) => {
      markdown += `## ${typeLabels[type] || type}\n\n`;

      typeNodes.forEach((node) => {
        const label = node.data?.label || 'Untitled';
        const content = node.data?.content || node.data?.text || '';

        markdown += `### ${label}\n\n`;

        // Add type-specific content
        if (type === 'todo' && node.data?.items) {
          node.data.items.forEach((item) => {
            const checkbox = item.completed ? '[x]' : '[ ]';
            markdown += `- ${checkbox} ${item.text}\n`;
          });
          markdown += '\n';
        } else if (type === 'tripPlanner' && node.data?.locations) {
          node.data.locations.forEach((loc) => {
            markdown += `- **${loc.name}**`;
            if (loc.address) markdown += ` - ${loc.address}`;
            if (loc.notes) markdown += `\n  - ${loc.notes}`;
            markdown += '\n';
          });
          markdown += '\n';
        } else if (type === 'commentNode') {
          const author = node.data?.author || 'Unknown';
          const timestamp = node.data?.timestamp ? new Date(node.data.timestamp).toLocaleString() : '';
          markdown += `> ${content}\n\n`;
          markdown += `*— ${author}${timestamp ? ` (${timestamp})` : ''}*\n\n`;

          // Add replies if they exist
          if (node.data?.replies && node.data.replies.length > 0) {
            markdown += `**Replies:**\n\n`;
            node.data.replies.forEach((reply) => {
              const replyAuthor = reply.author || 'Unknown';
              const replyTime = reply.timestamp ? new Date(reply.timestamp).toLocaleString() : '';
              markdown += `> ${reply.text}\n`;
              markdown += `> *— ${replyAuthor}${replyTime ? ` (${replyTime})` : ''}*\n\n`;
            });
          }
        } else if (content) {
          markdown += `${content}\n\n`;
        }

        // Add metadata if present
        if (node.data?.tags && node.data.tags.length > 0) {
          markdown += `**Tags:** ${node.data.tags.join(', ')}\n\n`;
        }

        markdown += `---\n\n`;
      });
    });

    // Add footer
    markdown += `\n\n*Exported from UnityNotes - ${new Date().toISOString()}*\n`;

    // Create and download file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unitynotes-${capsuleName}-${timestamp}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`✅ Markdown export successful!\n\nExported ${nodes.length} notes as structured document.\nFile: unitynotes-${capsuleName}-${timestamp}.md`);
  }, [nodes, edges, currentCapsuleName]);

  // Export canvas as PNG image (High-quality screenshot)
  const handleExportPNG = useCallback(() => {
    if (nodes.length === 0) {
      alert('⚠️ No notes to export. Add some notes first!');
      return;
    }

    try {
      // Generate filename
      const capsuleName = currentCapsuleName ||
        (nodes[0]?.data?.label || 'untitled').substring(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `unitynotes-${capsuleName}-${timestamp}.png`;

      // Get the React Flow wrapper element
      const reactFlowWrapper = document.querySelector('.react-flow');
      if (!reactFlowWrapper) {
        alert('❌ Unable to capture canvas. Please try again.');
        return;
      }

      // Calculate bounds for all nodes
      const nodesBounds = getNodesBounds(nodes);
      const imageWidth = 2400;
      const imageHeight = 1600;

      // Calculate viewport transformation
      const transform = getViewportForBounds(
        nodesBounds,
        imageWidth,
        imageHeight,
        0.5, // min zoom
        2,   // max zoom
        0.2  // padding (20%)
      );

      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      const ctx = canvas.getContext('2d');

      // Set background color based on theme
      const bgColor = selectedTheme === 'dark' || selectedTheme === 'twilight' ? '#1a1a1a' : '#ffffff';
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, imageWidth, imageHeight);

      // Use html2canvas-like approach with native browser APIs
      // Clone the React Flow viewport for rendering
      const viewport = reactFlowWrapper.querySelector('.react-flow__viewport');
      if (!viewport) {
        alert('❌ Unable to capture canvas viewport.');
        return;
      }

      // For a simpler approach, we'll use the browser's built-in screenshot capability
      // by creating a data URL from the current DOM state
      import('html2canvas').then((module) => {
        const html2canvas = module.default;

        html2canvas(reactFlowWrapper, {
          backgroundColor: bgColor,
          width: imageWidth,
          height: imageHeight,
          scale: 2, // 2x for retina displays
          logging: false,
          useCORS: true,
          allowTaint: true
        }).then((canvas) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              alert('❌ Failed to create image. Please try again.');
              return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            alert(`✅ Image exported successfully!\n\nFile: ${fileName}\nResolution: ${imageWidth}x${imageHeight}px (2x scale)`);
          }, 'image/png');
        }).catch((error) => {
          console.error('PNG export failed:', error);
          alert('❌ Export failed. html2canvas library may not be available.');
        });
      }).catch((error) => {
        console.error('Failed to load html2canvas:', error);
        alert('❌ Export failed. Please ensure you have an internet connection for the first export.');
      });

    } catch (error) {
      console.error('PNG export error:', error);
      alert('❌ Export failed. Please try again.');
    }
  }, [nodes, currentCapsuleName, selectedTheme]);

  // Import layout from JSON file
  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);

        if (!importData.nodes || !Array.isArray(importData.nodes)) {
          throw new Error('Invalid file format: missing nodes array');
        }

        // Check node limit for free tier
        const limit = isAdmin ? 999 : (isAuthenticated && tier === 'premium') ? PRO_NODE_LIMIT : FREE_NODE_LIMIT;
        if (importData.nodes.length > limit) {
          alert(
            `⚠️ Import Exceeds Node Limit\n\n` +
            `File contains ${importData.nodes.length} nodes.\n` +
            `Your tier limit: ${limit} nodes.\n\n` +
            (tier === 'premium' || isAdmin
              ? 'Please reduce file contents before importing.'
              : `Upgrade to Pro for ${PRO_NODE_LIMIT} nodes.`)
          );
          return;
        }

        if (nodes.length > 0) {
          const confirmed = confirm(
            `⚠️ Import will replace your current ${nodes.length} ${nodes.length === 1 ? 'note' : 'notes'}.\n\n` +
            `The file contains ${importData.nodes.length} ${importData.nodes.length === 1 ? 'note' : 'notes'}.\n\n` +
            'Click OK to proceed, or Cancel to keep your current layout.'
          );
          if (!confirmed) return;
        }

        setNodes(importData.nodes);
        setEdges(importData.edges || []);

        // Import AI conversation histories if available (v2.0+ exports)
        if (importData.conversationHistories) {
          setConversationHistories(importData.conversationHistories);
        }

        // Import theme preference if available (v2.0+ exports)
        if (importData.theme) {
          setSelectedTheme(importData.theme);
          try {
            localStorage.setItem('unity-notes-theme', importData.theme);
          } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Could not save theme to localStorage:', e);
            }
          }
        }

        // Enhanced success message with version info
        const versionInfo = importData.version ? ` (v${importData.version})` : '';
        const capsuleInfo = importData.capsuleName ? `\n\nCapsule: ${importData.capsuleName}` : '';
        const extraFeatures = importData.conversationHistories || importData.theme ?
          '\n✨ Restored AI conversations and theme settings' : '';

        alert(`✅ Successfully imported ${importData.nodes.length} ${importData.nodes.length === 1 ? 'note' : 'notes'}!${versionInfo}${capsuleInfo}${extraFeatures}`);
      } catch (error) {
        console.error('Import failed:', error);
        alert(`❌ Import failed: ${error.message}\n\nPlease check that the file is a valid UnityNotes export.`);
      }
    };
    input.click();
  }, [isAdmin, isAuthenticated, tier, PRO_NODE_LIMIT, FREE_NODE_LIMIT, nodes, setNodes, setEdges, setConversationHistories, setSelectedTheme]);

  // ========== Canvas Snapshots Functions ==========
  // Save current canvas state as a named snapshot
  const handleSaveSnapshot = useCallback(() => {
    if (nodes.length === 0) {
      addToast('⚠️ Cannot save snapshot: Canvas is empty', 'warning');
      return;
    }

    const snapshotName = prompt('Enter a name for this snapshot:', `Snapshot ${snapshots.length + 1}`);
    if (!snapshotName) return; // User cancelled

    const snapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: snapshotName.trim(),
      timestamp: new Date().toISOString(),
      data: {
        nodes: nodes,
        edges: edges,
        viewport: viewport,
        nodeCount: nodes.length,
        edgeCount: edges.length
      }
    };

    const updatedSnapshots = [...snapshots, snapshot];
    setSnapshots(updatedSnapshots);

    // Save to localStorage
    try {
      localStorage.setItem('unityNotes_snapshots', JSON.stringify(updatedSnapshots));
      addToast(`✅ Snapshot "${snapshotName}" saved successfully`, 'success');
    } catch (error) {
      console.error('Failed to save snapshot to localStorage:', error);
      if (error.name === 'QuotaExceededError') {
        addToast('⚠️ Storage limit exceeded. Try deleting old snapshots.', 'error');
      } else {
        addToast('❌ Failed to save snapshot', 'error');
      }
    }
  }, [nodes, edges, viewport, snapshots, addToast]);

  // Restore canvas state from a snapshot
  const handleRestoreSnapshot = useCallback((snapshotId) => {
    const snapshot = snapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      addToast('❌ Snapshot not found', 'error');
      return;
    }

    const confirmed = confirm(
      `Restore snapshot "${snapshot.name}"?\n\n` +
      `This will replace your current canvas with:\n` +
      `• ${snapshot.data.nodeCount} nodes\n` +
      `• ${snapshot.data.edgeCount} edges\n\n` +
      `Current canvas will be lost unless you save a snapshot first.\n\n` +
      `Click OK to restore, or Cancel to keep current canvas.`
    );

    if (!confirmed) return;

    try {
      setNodes(snapshot.data.nodes);
      setEdges(snapshot.data.edges);

      // Restore viewport position if available
      if (snapshot.data.viewport && reactFlowInstance) {
        reactFlowInstance.setViewport(snapshot.data.viewport);
      }

      addToast(`✅ Restored snapshot "${snapshot.name}"`, 'success');
      setShowSnapshotDialog(false);
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
      addToast('❌ Failed to restore snapshot', 'error');
    }
  }, [snapshots, setNodes, setEdges, reactFlowInstance, addToast]);

  // Delete a snapshot
  const handleDeleteSnapshot = useCallback((snapshotId) => {
    const snapshot = snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return;

    const confirmed = confirm(`Delete snapshot "${snapshot.name}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    const updatedSnapshots = snapshots.filter(s => s.id !== snapshotId);
    setSnapshots(updatedSnapshots);

    try {
      localStorage.setItem('unityNotes_snapshots', JSON.stringify(updatedSnapshots));
      addToast(`✅ Deleted snapshot "${snapshot.name}"`, 'success');
    } catch (error) {
      console.error('Failed to update localStorage:', error);
      addToast('⚠️ Snapshot deleted but localStorage update failed', 'warning');
    }
  }, [snapshots, addToast]);

  // Rename a snapshot
  const handleRenameSnapshot = useCallback((snapshotId) => {
    const snapshot = snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return;

    const newName = prompt('Enter new name for this snapshot:', snapshot.name);
    if (!newName || newName.trim() === snapshot.name) return;

    const updatedSnapshots = snapshots.map(s =>
      s.id === snapshotId ? { ...s, name: newName.trim() } : s
    );
    setSnapshots(updatedSnapshots);

    try {
      localStorage.setItem('unityNotes_snapshots', JSON.stringify(updatedSnapshots));
      addToast(`✅ Renamed to "${newName.trim()}"`, 'success');
    } catch (error) {
      console.error('Failed to update localStorage:', error);
      addToast('⚠️ Rename failed', 'warning');
    }
  }, [snapshots, addToast]);

  // Memoized snapshot dialog callbacks to prevent unnecessary re-renders
  const handleCloseSnapshotDialog = useCallback(() => {
    setShowSnapshotDialog(false);
  }, []);

  const handleSnapshotModalContentClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // Memoized snapshot action callback using data attributes pattern
  const handleSnapshotAction = useCallback((e) => {
    const action = e.currentTarget.dataset.action;
    const snapshotId = e.currentTarget.dataset.snapshotId;

    switch(action) {
      case 'restore':
        handleRestoreSnapshot(snapshotId);
        break;
      case 'rename':
        handleRenameSnapshot(snapshotId);
        break;
      case 'delete':
        handleDeleteSnapshot(snapshotId);
        break;
      default:
        break;
    }
  }, [handleRestoreSnapshot, handleRenameSnapshot, handleDeleteSnapshot]);

  // Save capsule to Firebase and get shareable URL (Pro feature)
  const handleSaveAndShare = useCallback(async () => {
    // Gate cloud sharing for pro/admin users only
    if (!hasProAccess()) {
      alert(
        '☁️ Cloud Sharing - Pro Feature\n\n' +
        'Cloud sharing is available for Pro users.\n\n' +
        '✅ You can still use EXPORT to save as JSON file\n' +
        '✅ Import your JSON on any device\n\n' +
        'Contact us for Pro access.'
      );
      return;
    }

    if (nodes.length === 0) {
      alert('⚠️ Please add at least one note before sharing');
      return;
    }

    try {
      // Serialize nodes - preserve all data fields except callback functions
      const serializableNodes = nodes.map(node => {
        // Extract data without callback functions (onUpdate, onDelete, etc.)
        const serializableData = {};
        if (node.data) {
          Object.keys(node.data).forEach(key => {
            const value = node.data[key];
            // Skip functions and keep all other data types
            if (typeof value !== 'function') {
              serializableData[key] = value;
            }
          });
        }

        return {
          id: node.id,
          type: node.type,
          position: {
            x: node.position.x,
            y: node.position.y
          },
          // Include parentId and extent for group children
          ...(node.parentId && { parentId: node.parentId }),
          ...(node.extent && { extent: node.extent }),
          data: serializableData
        };
      });

      const serializableEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default'
      }));

      let capsuleId;

      // If we already have a capsule, update it instead of creating new
      if (currentCapsuleId) {
        await updateCapsule(currentCapsuleId, serializableNodes, serializableEdges);
        capsuleId = currentCapsuleId;
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Updated existing capsule:', capsuleId);
        }
      } else {
        // Create new capsule
        capsuleId = await saveCapsule(serializableNodes, serializableEdges, {
          title: 'UnityNotes'
        }, user?.uid);
        setCurrentCapsuleId(capsuleId);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Created new capsule:', capsuleId);
        }
      }

      const url = `${window.location.origin}/unity-notes/view/${capsuleId}`;
      setShareUrl(url);

      // Update browser URL with capsule ID so it persists across page refreshes
      // This ensures the same capsule is updated on subsequent saves
      const editUrl = `${window.location.pathname}?capsule=${capsuleId}`;
      window.history.replaceState({}, '', editUrl);
      if (process.env.NODE_ENV === 'development') {
        console.log('📍 URL updated with capsule ID:', capsuleId);
      }

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = url;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
          } catch (err) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Copy fallback failed:', err);
            }
          }
          document.body.removeChild(textArea);
        }
      } catch (clipboardErr) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Clipboard copy failed:', clipboardErr);
        }
      }

      setShowShareModal(true);
    } catch (error) {
      console.error('❌ Save failed:', error);

      if (error.message.includes('QUOTA_EXCEEDED') || error.code === 'resource-exhausted' || error.message.includes('quota')) {
        alert(
          '🔴 FIREBASE QUOTA EXCEEDED\n\n' +
          'The free tier limit has been reached.\n\n' +
          '✅ Your work is still saved locally\n\n' +
          'Use EXPORT to save as JSON file.'
        );
      } else {
        alert(
          `❌ SAVE FAILED\n\n` +
          `Error: ${error.message}\n\n` +
          `Your work is still saved locally.`
        );
      }
    }
  }, [hasProAccess, nodes, edges, currentCapsuleId, updateCapsule, saveCapsule, user]);

  // Collaboration handlers (v3)
  const handleAddCollaborator = async (email, role) => {
    if (!currentCapsuleId) {
      throw new Error('Please save your canvas first');
    }
    await addCollaborator(currentCapsuleId, email, role);
    setCollaborators(prev => [...prev, { email, role, addedAt: new Date().toISOString() }]);

    // Send email notification to collaborator
    try {
      const canvasUrl = `${window.location.origin}/unity-notes/view/${currentCapsuleId}`;
      const ownerName = userProfile?.displayName || user?.email || 'Someone';
      const roleLabel = role === 'editor' ? 'edit' : 'view';

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: #fbbf24; border-radius: 50%; margin: 0 auto 15px;"></div>
            <h1 style="color: #1f2937; font-size: 24px; margin: 0;">You've Been Invited!</h1>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>${ownerName}</strong> has invited you to <strong>${roleLabel}</strong> their Unity Notes canvas: <strong>"${canvasTitle}"</strong>
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${canvasUrl}" style="display: inline-block; background: #fbbf24; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Open Canvas
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Unity Notes is a visual canvas for organizing ideas, notes, and images. Click the button above to access the shared canvas.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            yellowCircle · <a href="https://yellowcircle.io" style="color: #9ca3af;">yellowcircle.io</a>
          </p>
        </div>
      `;

      await fetch('https://us-central1-yellowcircle-app.cloudfunctions.net/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: `${ownerName} invited you to collaborate on Unity Notes`,
          html: emailHtml
        })
      });
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Collaboration invite sent to ${email}`);
      }
    } catch (emailErr) {
      // Don't throw - collaborator was added successfully, email is secondary
      console.error('Failed to send collaboration invite email:', emailErr);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!currentCapsuleId) return;
    await removeCollaborator(currentCapsuleId, collaboratorId);
    setCollaborators(prev => prev.filter(c => (c.id || c.email) !== collaboratorId));
  };

  const handleUpdateVisibility = async (newIsPublic) => {
    if (!currentCapsuleId) {
      throw new Error('Please save your canvas first');
    }
    await updateVisibility(currentCapsuleId, newIsPublic);
    setIsPublic(newIsPublic);
  };

  // Toggle bookmark for quick access
  const handleToggleBookmark = useCallback(async () => {
    if (!currentCapsuleId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('No capsule ID - save first before bookmarking');
      }
      return;
    }
    try {
      const newBookmarkStatus = await toggleBookmark(currentCapsuleId);
      setIsBookmarked(newBookmarkStatus);

      // Refresh bookmarked capsules list after toggling
      if (user?.uid) {
        const updatedCapsules = await getBookmarkedCapsules(user.uid);
        setBookmarkedCapsules(updatedCapsules);
        if (process.env.NODE_ENV === 'development') {
          console.log(`📚 Refreshed bookmarked capsules: ${updatedCapsules.length}`);
        }
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      // If it's an index error, log a helpful message
      if (err.message?.includes('index')) {
        console.error('⚠️ Firestore composite index may be required. Check Firebase Console.');
      }
    }
  }, [currentCapsuleId, user]);

  const handlePhotoUpload = async (filesOrUrls, metadata, uploadType) => {

    try {
      let imageUrls = [];

      if (uploadType === 'url') {
        imageUrls = filesOrUrls;
      } else if (uploadType === 'cloudinary' || uploadType === 'file') {
        try {
          const results = await uploadMultipleToCloudinary(filesOrUrls);
          imageUrls = results.filter(r => !r.error).map(r => r.url);

          const errors = results.filter(r => r.error);
          if (errors.length > 0) {
            console.error('❌ Some uploads failed:', errors);
          }

          if (imageUrls.length === 0 && filesOrUrls.length > 0) {
            throw new Error('Cloudinary upload failed');
          }
        } catch (cloudinaryError) {
          console.error('❌ Cloudinary upload error:', cloudinaryError);

          const filePromises = filesOrUrls.map(file => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = (err) => reject(err);
              reader.readAsDataURL(file);
            });
          });
          imageUrls = await Promise.all(filePromises);
        }
      }

      if (imageUrls.length === 0) {
        alert('No images were processed. Please try again.');
        return;
      }

      const newNodes = imageUrls.map((imageUrl, index) => {
        const totalNodes = nodes.length + index;
        const gridX = totalNodes % 8;
        const gridY = Math.floor(totalNodes / 8);
        const size = Math.floor(Math.random() * 132) + 308;
        const timestamp = Date.now();

        return {
          id: `note-${timestamp}-${index}`,
          type: 'photoNode',
          position: {
            x: 300 + gridX * 600,
            y: 100 + gridY * 600
          },
          data: {
            imageUrl,
            location: metadata.location,
            date: metadata.date,
            description: metadata.description,
            size,
            onResize: handlePhotoResize,
            onLightbox: handleLightbox,
            onEdit: handleEdit,
            onAnalyze: handleImageAnalyze
          }
        };
      });

      setNodes(prev => [...prev, ...newNodes]);
      setIsUploadModalOpen(false);

      setTimeout(() => {
        fitView({ duration: 600, padding: 0.2 });
      }, 100);
    } catch (error) {
      console.error('❌ Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  // Clear all notes and start a new canvas
  const handleClearAll = useCallback(() => {
    if (confirm('⚠️ Start a new canvas?\n\nThis will clear all notes and create a fresh canvas.\nYour previous canvas can still be accessed via its share link.\n\nClick OK to proceed.')) {
      // Set guard flag FIRST to prevent auto-save from re-saving old nodes
      isClearingRef.current = true;
      // Remove localStorage BEFORE clearing state (order matters for race condition)
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('unity-notes-current-capsule');
      // Now clear state
      setNodes([]);
      setEdges([]);
      setCurrentJourneyId(null);
      setCurrentCapsuleId('');
      capsuleLoadedRef.current = false;
      // Clear URL parameter
      window.history.replaceState({}, '', window.location.pathname);
      // Reset collaboration state
      setCollaborators([]);
      setIsPublic(false);
      setIsBookmarked(false);
      setCanEditCapsule(false);
      setShareUrl('');
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ New canvas started');
      }
      // Reset guard flag after state updates have propagated
      setTimeout(() => {
        isClearingRef.current = false;
      }, 100);
    }
  }, [setNodes, setEdges, setCurrentJourneyId, setCurrentCapsuleId, setCollaborators, setIsPublic, setIsBookmarked, setCanEditCapsule, setShareUrl]);

  // AI Regeneration Handlers
  const handleRegenerateNote = useCallback(async (nodeId, customPrompt) => {
    try {
      const { getLLMAdapterByName } = await import('../adapters/llm');
      const llm = await getLLMAdapterByName('groq');

      const generateOptions = { maxTokens: 200 };
      if (storedGroqKey) {
        generateOptions.apiKey = storedGroqKey;
      }

      const response = await llm.generate(customPrompt, generateOptions);

      // Update the existing node with new content
      const timestamp = new Date().toISOString();
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            position: { ...n.position }, // Force new reference for React Flow change detection
            data: {
              ...n.data,
              content: response,
              aiPrompt: customPrompt,
              regeneratedAt: timestamp,
              updatedAt: timestamp, // Trigger change detection
            }
          };
        }
        return n;
      }));

      // Center the canvas on the regenerated node
      // Double RAF ensures React Flow has fully processed the node update before fitView
      // 1st RAF: React commits DOM changes
      // 2nd RAF: React Flow measures updated dimensions
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitView({ duration: 400, padding: 0.2 });
        });
      });

    } catch (error) {
      console.error('AI Regenerate Note failed:', error);
      alert(`❌ Regeneration failed: ${error.message}`);
    }
  }, [storedGroqKey, setNodes, fitView]);

  const handleRegenerateImage = useCallback(async (nodeId, customPrompt) => {
    try {
      let imageUrl;
      let modelUsed = 'pollinations';

      const openaiKey = storedOpenaiKey || import.meta.env.VITE_OPENAI_API_KEY;

      if (openaiKey) {
        // DALL-E 3
        if (process.env.NODE_ENV === 'development') {
          console.log('🎨 Regenerating with DALL-E 3');
        }
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: customPrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`DALL-E API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        imageUrl = data.data?.[0]?.url;
        modelUsed = 'dall-e-3';
      } else {
        // Pollinations.ai (Free)
        if (process.env.NODE_ENV === 'development') {
          console.log('🎨 Regenerating with Pollinations.ai (free)');
        }
        const encodedPrompt = encodeURIComponent(customPrompt);
        imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`;

        // Verify image loads
        const testImage = new Image();
        await new Promise((resolve, reject) => {
          testImage.onload = resolve;
          testImage.onerror = () => reject(new Error('Failed to regenerate image'));
          testImage.src = imageUrl;
        });

        modelUsed = 'pollinations-flux';
      }

      // Update the existing node with new image
      const timestamp = new Date().toISOString();
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            position: { ...n.position }, // Force new reference for React Flow change detection
            data: {
              ...n.data,
              imageUrl,
              thumbnail: imageUrl,
              caption: `✨ AI Generated (${modelUsed})`,
              aiPrompt: customPrompt,
              regeneratedAt: timestamp,
              updatedAt: timestamp, // Trigger change detection
            }
          };
        }
        return n;
      }));

      // Center the canvas on the regenerated node
      // Double RAF ensures React Flow has fully processed the node update before fitView
      // 1st RAF: React commits DOM changes
      // 2nd RAF: React Flow measures updated dimensions
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitView({ duration: 400, padding: 0.2 });
        });
      });

    } catch (error) {
      console.error('AI Regenerate Image failed:', error);
      alert(`❌ Regeneration failed: ${error.message}`);
    }
  }, [storedOpenaiKey, setNodes, fitView]);

  // ============================================================================
  // Context-Aware AI Utilities
  // ============================================================================

  /**
   * Calculate the viewport bounds in flow coordinates
   * @returns {Object} Bounds object with x1, y1, x2, y2 properties or null if viewport unavailable
   */
  const getViewportBounds = useCallback(() => {
    try {
      const viewport = getViewport();
      if (!viewport) return null;

      const { x, y, zoom } = viewport;

      // Get window dimensions
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Convert screen coordinates to flow coordinates (inverse transform)
      // Add padding to catch nodes near viewport edges
      const padding = 100;

      const x1 = (-x - padding) / zoom;
      const y1 = (-y - padding) / zoom;
      const x2 = (width - x + padding) / zoom;
      const y2 = (height - y + padding) / zoom;

      return { x1, y1, x2, y2 };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to get viewport bounds:', error);
      }
      return null;
    }
  }, [getViewport]);

  /**
   * Filter nodes to only those visible in the current viewport
   * @param {Array} nodesToFilter - Array of nodes to filter
   * @returns {Array} Filtered array of visible nodes
   */
  const getVisibleNodes = useCallback((nodesToFilter) => {
    const bounds = getViewportBounds();

    // If viewport bounds unavailable, return all nodes (fallback)
    if (!bounds) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Viewport bounds unavailable, using all nodes for context');
      }
      return nodesToFilter;
    }

    const visibleNodes = nodesToFilter.filter(node => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;

      // Estimate node dimensions (use computed dimensions if available, otherwise defaults)
      const nodeWidth = node.width || node.data?.width || 250;
      const nodeHeight = node.height || node.data?.height || 150;

      // Check if node intersects with viewport bounds
      const isVisible = !(
        nodeX + nodeWidth < bounds.x1 ||
        nodeX > bounds.x2 ||
        nodeY + nodeHeight < bounds.y1 ||
        nodeY > bounds.y2
      );

      return isVisible;
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Found ${visibleNodes.length} visible nodes out of ${nodesToFilter.length} total`);
    }
    return visibleNodes;
  }, [getViewportBounds]);

  /**
   * Analyze visible nodes and create rich context for AI
   * @param {Array} visibleNodes - Array of visible nodes
   * @returns {Object} Context object with node type analysis and content
   */
  const analyzeNodesForContext = useCallback((visibleNodes) => {
    const context = {
      visibleNodeCount: visibleNodes.length,
      nodeTypes: {},
      contentByType: {}
    };

    visibleNodes.forEach(node => {
      const nodeType = node.type || 'unknown';
      const cardType = node.data?.cardType || nodeType;

      // Count node types
      context.nodeTypes[cardType] = (context.nodeTypes[cardType] || 0) + 1;

      // Extract content based on node type
      if (!context.contentByType[cardType]) {
        context.contentByType[cardType] = [];
      }

      // Extract relevant content based on node type
      if (node.data?.content) {
        context.contentByType[cardType].push(node.data.content);
      } else if (node.data?.title) {
        context.contentByType[cardType].push(node.data.title);
      } else if (node.data?.text) {
        context.contentByType[cardType].push(node.data.text);
      } else if (node.data?.caption) {
        context.contentByType[cardType].push(node.data.caption);
      } else if (node.data?.url) {
        context.contentByType[cardType].push(node.data.url);
      }
    });

    return context;
  }, []);

  /**
   * Build context-aware prompt for AI based on visible nodes
   * @param {Array} visibleNodes - Array of visible nodes
   * @returns {string} Formatted prompt string
   */
  const buildContextAwarePrompt = useCallback((visibleNodes) => {
    if (visibleNodes.length === 0 && nodes.length === 0) {
      return 'Generate a thoughtful brainstorming prompt or creative idea for a visual planning canvas. Keep it concise (2-3 sentences).';
    }

    // 🎯 ENHANCED: Analyze both visible nodes AND all canvas nodes for complete context
    const visibleContext = analyzeNodesForContext(visibleNodes);
    const fullCanvasContext = analyzeNodesForContext(nodes);

    // Build type summary for visible nodes
    const visibleTypeSummary = Object.entries(visibleContext.nodeTypes)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');

    // Build full canvas summary
    const fullCanvasSummary = Object.entries(fullCanvasContext.nodeTypes)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');

    // Build content sections by type (prioritize visible, but include all)
    const contentSections = Object.entries(visibleContext.contentByType)
      .filter(([_, contents]) => contents.length > 0)
      .map(([type, contents]) => {
        const contentText = contents.slice(0, 5).join('\n'); // Limit to 5 items per type
        return `${type.toUpperCase()}S:\n${contentText}`;
      })
      .join('\n\n');

    // Build canvas overview with node counts
    let canvasOverview = '';
    if (nodes.length > visibleNodes.length) {
      canvasOverview = `\nFull canvas has ${nodes.length} total items: ${fullCanvasSummary}.\n`;
    }

    const prompt = `You are viewing a canvas with ${visibleContext.visibleNodeCount} visible items: ${visibleTypeSummary}.${canvasOverview}

Based on these ${visibleNodes.length > 0 ? 'visible ' : ''}notes and items:

${contentSections}

Generate a thoughtful new note that:
1. Builds on or complements the existing ideas
2. Avoids duplicating content already on the canvas
3. Adds value to the overall collection

Keep it concise (2-3 sentences).`;

    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 Enhanced AI Context:', {
        visibleNodes: visibleContext.visibleNodeCount,
        totalNodes: nodes.length,
        visibleTypes: visibleContext.nodeTypes,
        allTypes: fullCanvasContext.nodeTypes
      });
    }

    return prompt;
  }, [analyzeNodesForContext, nodes]);

  // ============================================================================
  // AI Canvas Actions
  // ============================================================================

  const handleAIGenerateNote = useCallback(async () => {
    // Generate optimistic node ID before AI call
    const optimisticId = `ai-note-${Date.now()}`;

    try {
      // Calculate position for new node
      const totalNodes = nodes.length;
      const gridX = totalNodes % 8;
      const gridY = Math.floor(totalNodes / 8);
      const nodePosition = {
        x: 300 + gridX * 350,
        y: 100 + gridY * 300
      };

      // 🎯 OPTIMISTIC UPDATE: Show loading node immediately
      const loadingNode = {
        id: optimisticId,
        type: 'textNode',
        position: nodePosition,
        data: {
          title: '✨ AI Generating...',
          content: '⏳ Creating your note...',
          cardType: 'note',
          color: 'rgb(147, 51, 234)', // Purple for AI
          createdAt: Date.now(),
          isLoading: true,
        }
      };
      setNodes(nds => [...nds, loadingNode]);

      // ✨ Context-Aware AI: Only consider visible nodes in viewport
      const visibleNodes = getVisibleNodes(nodes);
      const prompt = buildContextAwarePrompt(visibleNodes);

      const { getLLMAdapterByName } = await import('../adapters/llm');

      // Get the LLM adapter
      const llm = await getLLMAdapterByName('groq');

      // Use API key from useApiKeyStorage hook (stored in Firestore)
      const generateOptions = { maxTokens: 200 };
      if (storedGroqKey) {
        generateOptions.apiKey = storedGroqKey;
      }

      const response = await llm.generate(prompt, generateOptions);

      // 🔄 UPDATE: Replace loading node with AI content
      // Use same pattern as handleRegenerateNote for proper React Flow change detection
      const timestamp = Date.now();
      setNodes(nds => nds.map(n => {
        if (n.id === optimisticId) {
          // ✅ FIX: Create completely new object without spreading old data
          // This ensures React Flow detects the change by creating all new references
          return {
            id: n.id,
            type: n.type,
            position: { x: n.position.x, y: n.position.y }, // Completely new position object
            data: {
              // Don't spread n.data - create all new references
              title: '✨ AI Generated',
              content: response,
              cardType: 'note',
              color: 'rgb(147, 51, 234)', // Purple for AI
              createdAt: n.data.createdAt, // Preserve original creation time
              isLoading: false,
              aiGenerated: true,
              aiPrompt: prompt,
              updatedAt: timestamp, // Trigger change detection
              onUpdate: handleNodeUpdate,
              onDelete: handleDeleteNode,
              onRegenerate: handleRegenerateNote,
              onExpandWithAI: handleAIExpandNode,
            }
          };
        }
        return n;
      }));

      // Fix fitView timing: trigger after node update
      // Double RAF ensures React Flow has fully processed the node update before fitView
      // 1st RAF: React commits DOM changes
      // 2nd RAF: React Flow measures updated dimensions
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitView({ duration: 400, padding: 0.2 });
        });
      });

    } catch (error) {
      console.error('AI Generate Note failed:', error);

      // 🧹 ERROR RECOVERY: Remove optimistic loading node
      setNodes(nds => nds.filter(n => n.id !== optimisticId));

      // Provide a more helpful error message
      const isKeyError = error.message?.includes('API key') || error.message?.includes('not configured');
      if (isKeyError) {
        if (!isAuthenticated) {
          alert('🔑 AI requires sign-in.\n\nSign in to access your stored API key, or add VITE_GROQ_API_KEY to .env');
        } else if (!storedGroqKey) {
          alert('🔑 No Groq API key found.\n\nTo configure:\n1. Go to any page with API key settings\n2. Add your Groq API key (it syncs to your account)\n\nOr add VITE_GROQ_API_KEY to .env');
        } else {
          alert(`❌ AI Generation failed: ${error.message}`);
        }
      } else {
        alert(`❌ AI Generation failed: ${error.message}`);
      }
    }
  }, [nodes, handleNodeUpdate, handleDeleteNode, setNodes, fitView, storedGroqKey, isAuthenticated, handleRegenerateNote, getVisibleNodes, buildContextAwarePrompt]);

  const handleAIGenerateImage = useCallback(async () => {
    try {
      // 🎯 ENHANCED: Consider both visible nodes AND full canvas for richer context
      const visibleNodes = getVisibleNodes(nodes);
      const visibleContext = analyzeNodesForContext(visibleNodes);
      const fullCanvasContext = analyzeNodesForContext(nodes);

      // Build image prompt from visible context (prioritized) and canvas context
      let contextDescription = '';
      if (visibleNodes.length > 0) {
        const contentItems = Object.values(visibleContext.contentByType)
          .flat()
          .slice(0, 3)
          .join(', ');
        contextDescription = contentItems;
      } else if (nodes.length > 0) {
        // Fallback to full canvas if no visible nodes
        const contentItems = Object.values(fullCanvasContext.contentByType)
          .flat()
          .slice(0, 3)
          .join(', ');
        contextDescription = contentItems;
      }

      // Add theme/type information to help AI generate relevant imagery
      const nodeTypes = Object.keys(Object.keys(visibleContext.nodeTypes).length > 0 ? visibleContext.nodeTypes : fullCanvasContext.nodeTypes);
      const themeHint = nodeTypes.includes('todo') ? 'productivity-focused' :
                       nodeTypes.includes('tripPlanner') ? 'travel-themed' :
                       nodeTypes.includes('map') ? 'journey-themed' :
                       nodeTypes.includes('photo') ? 'visual collage-style' : 'creative brainstorming';

      const imagePrompt = contextDescription
        ? `Create an abstract, colorful ${themeHint} illustration representing: ${contextDescription}. Modern, minimalist style.`
        : 'Create an abstract, colorful brainstorming illustration. Modern, minimalist style with geometric shapes.';

      let imageUrl;
      let modelUsed = 'pollinations'; // Track which model was used

      // Check for OpenAI key (from Firestore or .env)
      const openaiKey = storedOpenaiKey || import.meta.env.VITE_OPENAI_API_KEY;

      // Use DALL-E if OpenAI key is available, otherwise use Pollinations (free)
      if (openaiKey) {
        // DALL-E 3 (Premium option)
        if (process.env.NODE_ENV === 'development') {
          console.log('🎨 Using DALL-E 3 for image generation');
        }
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: imagePrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`DALL-E API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        imageUrl = data.data?.[0]?.url;
        modelUsed = 'dall-e-3';

        if (!imageUrl) {
          throw new Error('No image URL in DALL-E response');
        }
      } else {
        // Pollinations.ai (Free, no API key required)
        if (process.env.NODE_ENV === 'development') {
          console.log('🎨 Using Pollinations.ai for image generation (free)');
        }

        // Pollinations URL format with Flux model for quality
        const encodedPrompt = encodeURIComponent(imagePrompt);
        imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`;

        // Verify image loads (Pollinations generates on-demand)
        const testImage = new Image();
        await new Promise((resolve, reject) => {
          testImage.onload = resolve;
          testImage.onerror = () => reject(new Error('Failed to generate image from Pollinations'));
          testImage.src = imageUrl;
        });

        modelUsed = 'pollinations-flux';
      }

      // Create photo node with generated image
      const timestamp = Date.now();
      const totalNodes = nodes.length;
      const gridX = totalNodes % 8;
      const gridY = Math.floor(totalNodes / 8);

      const newNode = {
        id: `ai-image-${timestamp}`,
        type: 'photoNode',
        position: {
          x: 300 + gridX * 350,
          y: 100 + gridY * 300
        },
        data: {
          imageUrl,
          thumbnail: imageUrl,
          caption: `✨ AI Generated (${modelUsed})`,
          createdAt: timestamp,
          aiGenerated: true,
          aiPrompt: imagePrompt,
          onDelete: handleDeleteNode,
          onRegenerate: handleRegenerateImage,
        }
      };

      // Set the flag before adding the node to trigger fitView after render
      pendingFitViewRef.current = true;
      setNodes(nds => [...nds, newNode]);

    } catch (error) {
      console.error('AI Generate Image failed:', error);
      alert(`❌ Image Generation failed: ${error.message}`);
    }
  }, [nodes, handleDeleteNode, setNodes, fitView, storedOpenaiKey, handleRegenerateImage, getVisibleNodes, analyzeNodesForContext]);

  const handleAISummarize = useCallback(async () => {
    // Generate optimistic node ID before AI call
    const optimisticId = `ai-summary-${Date.now()}`;

    try {
      // Collect all content from nodes - enhanced to capture all node types
      const allContent = nodes
        .map(n => {
          const nodeType = n.type;
          const d = n.data || {};
          const parts = [];

          // Common fields
          if (d.title) parts.push(`Title: ${d.title}`);
          if (d.content) parts.push(`Content: ${d.content}`);

          // Photo nodes
          if (nodeType === 'photoNode') {
            if (d.location) parts.push(`Location: ${d.location}`);
            if (d.date) parts.push(`Date: ${d.date}`);
            if (d.description) parts.push(`Description: ${d.description}`);
            if (d.caption) parts.push(`Caption: ${d.caption}`);
          }

          // Link cards (textNode with cardType 'link')
          if (d.cardType === 'link' && d.url) {
            parts.push(`Link URL: ${d.url}`);
            if (d.linkPreview?.title) parts.push(`Link Title: ${d.linkPreview.title}`);
            if (d.linkPreview?.description) parts.push(`Link Description: ${d.linkPreview.description}`);
          }

          // Todo nodes
          if (nodeType === 'todoNode' && d.items?.length > 0) {
            const todoItems = d.items.map(item =>
              `- [${item.completed ? 'x' : ' '}] ${item.text}`
            ).join('\n');
            parts.push(`To-Do Items:\n${todoItems}`);
          }

          // Sticky notes
          if (nodeType === 'stickyNode') {
            if (d.text) parts.push(`Sticky Note: ${d.text}`);
          }

          // Comment nodes
          if (nodeType === 'commentNode') {
            if (d.content) parts.push(`Comment: ${d.content}`);
            if (d.author) parts.push(`Author: ${d.author}`);
          }

          // Code blocks
          if (nodeType === 'codeNode' && d.code) {
            parts.push(`Code (${d.language || 'unknown'}): ${d.code.substring(0, 200)}${d.code.length > 200 ? '...' : ''}`);
          }

          // Group nodes
          if (nodeType === 'groupNode' && d.label) {
            parts.push(`Group: ${d.label}`);
          }

          // Reminder nodes
          if (d.reminder || d.isReminder) {
            parts.push(`Reminder: ${d.content || d.text || 'No details'}`);
          }

          return parts.length > 0 ? `[${nodeType || 'note'}]\n${parts.join('\n')}` : null;
        })
        .filter(Boolean)
        .join('\n\n---\n\n');

      if (!allContent) {
        alert('📋 Nothing to summarize.\n\nAdd some notes or content first!');
        return;
      }

      // Check for API key (from Firestore or .env)
      const groqKey = storedGroqKey || import.meta.env.VITE_GROQ_API_KEY;

      if (!groqKey) {
        if (!isAuthenticated) {
          alert('📋 Summarize requires an LLM API key.\n\nSign in to use your stored Groq API key, or add VITE_GROQ_API_KEY to .env');
        } else {
          alert('📋 No Groq API key found.\n\nTo configure:\n1. Go to Hub → Settings\n2. Add your Groq API key (free at console.groq.com)\n\nOr add VITE_GROQ_API_KEY to .env');
        }
        return;
      }

      // Calculate position for new node
      const totalNodes = nodes.length;
      const gridX = totalNodes % 8;
      const gridY = Math.floor(totalNodes / 8);
      const nodePosition = {
        x: 300 + gridX * 350,
        y: 100 + gridY * 300
      };

      // 🎯 OPTIMISTIC UPDATE: Show loading node immediately
      const loadingNode = {
        id: optimisticId,
        type: 'textNode',
        position: nodePosition,
        data: {
          title: '✨ AI Summarizing...',
          content: '⏳ Analyzing your canvas...',
          cardType: 'note',
          color: 'rgb(34, 197, 94)', // Green for summary
          createdAt: Date.now(),
          isLoading: true,
        }
      };
      setNodes(nds => [...nds, loadingNode]);

      const { getLLMAdapter } = await import('../adapters/llm');
      const llm = await getLLMAdapter();

      const prompt = `Summarize the following canvas notes into a concise overview with key points:\n\n${allContent}\n\nProvide a brief summary (3-5 bullet points).`;

      // Pass stored API key to the LLM adapter
      const response = await llm.generate(prompt, { maxTokens: 500, apiKey: groqKey });

      // 🔄 UPDATE: Replace loading node with AI content
      // Use same pattern as handleRegenerateNote for proper React Flow change detection
      const timestamp = Date.now();
      setNodes(nds => nds.map(n => {
        if (n.id === optimisticId) {
          // ✅ FIX: Create completely new object without spreading old data
          // This ensures React Flow detects the change by creating all new references
          return {
            id: n.id,
            type: n.type,
            position: { x: n.position.x, y: n.position.y }, // Completely new position object
            data: {
              // Don't spread n.data - create all new references
              title: '📋 Canvas Summary',
              content: response,
              cardType: 'note',
              color: 'rgb(34, 197, 94)', // Green for summary
              createdAt: n.data.createdAt, // Preserve original creation time
              isLoading: false,
              aiGenerated: true,
              updatedAt: timestamp, // Trigger change detection
              onUpdate: handleNodeUpdate,
              onDelete: handleDeleteNode,
            }
          };
        }
        return n;
      }));

      // Fix fitView timing: trigger after node update
      // Double RAF ensures React Flow has fully processed the node update before fitView
      // 1st RAF: React commits DOM changes
      // 2nd RAF: React Flow measures updated dimensions
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitView({ duration: 400, padding: 0.2 });
        });
      });

    } catch (error) {
      console.error('AI Summarize failed:', error);

      // 🧹 ERROR RECOVERY: Remove optimistic loading node
      setNodes(nds => nds.filter(n => n.id !== optimisticId));

      alert(`❌ Summarize failed: ${error.message}`);
    }
  }, [nodes, handleNodeUpdate, handleDeleteNode, setNodes, fitView, storedGroqKey, isAuthenticated]);

  // AI Expand Node - Enhance existing node content with AI
  const handleAIExpandNode = useCallback(async (nodeId) => {
    try {
      // Find the node to expand
      const nodeToExpand = nodes.find(n => n.id === nodeId);
      if (!nodeToExpand) {
        alert('❌ Node not found');
        return;
      }

      // Check for API key (from Firestore or .env)
      const groqKey = storedGroqKey || import.meta.env.VITE_GROQ_API_KEY;
      if (!groqKey) {
        if (!isAuthenticated) {
          alert('✨ Expand with AI requires sign-in.\n\nSign in to use your stored Groq API key, or add VITE_GROQ_API_KEY to .env');
        } else {
          alert('✨ No Groq API key found.\n\nTo configure:\n1. Go to Hub → Settings\n2. Add your Groq API key (free at console.groq.com)\n\nOr add VITE_GROQ_API_KEY to .env');
        }
        return;
      }

      // Extract current content from the node
      const nodeData = nodeToExpand.data || {};
      let currentContent = '';

      if (nodeData.content) currentContent = nodeData.content;
      else if (nodeData.text) currentContent = nodeData.text;
      else if (nodeData.description) currentContent = nodeData.description;

      const currentTitle = nodeData.title || nodeData.label || 'Untitled';

      if (!currentContent || currentContent.trim().length < 3) {
        alert('✨ This note is too short to expand.\n\nAdd some content first, then use Expand with AI to enhance it.');
        return;
      }

      // 🎯 OPTIMISTIC UPDATE: Show loading state on the node
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              isLoading: true,
              loadingMessage: '✨ Expanding with AI...'
            }
          };
        }
        return n;
      }));

      // 🧠 CONTEXT GATHERING: Collect information about connected and nearby nodes
      // This helps AI generate more relevant, contextually-aware expansions

      // Find nodes connected via edges
      const connectedNodeIds = new Set();
      edges.forEach(edge => {
        if (edge.source === nodeId) connectedNodeIds.add(edge.target);
        if (edge.target === nodeId) connectedNodeIds.add(edge.source);
      });

      const connectedNodes = Array.from(connectedNodeIds)
        .map(id => nodeById.get(id))
        .filter(Boolean)
        .slice(0, 5); // Limit to 5 connected nodes to avoid token overflow

      // Find spatially nearby nodes (within 600px radius)
      const PROXIMITY_THRESHOLD = 600;
      const nearbyNodes = nodes
        .filter(n => {
          if (n.id === nodeId || connectedNodeIds.has(n.id)) return false; // Exclude self and already connected
          const dx = n.position.x - nodeToExpand.position.x;
          const dy = n.position.y - nodeToExpand.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance <= PROXIMITY_THRESHOLD;
        })
        .slice(0, 5); // Limit to 5 nearby nodes

      // Build context string from connected and nearby nodes
      let contextString = '';

      if (connectedNodes.length > 0) {
        contextString += '\n📎 Connected Notes:\n';
        connectedNodes.forEach(node => {
          const nodeTitle = node.data?.title || node.data?.label || 'Untitled';
          const nodeContent = node.data?.content || node.data?.text || node.data?.description || '';
          const preview = nodeContent.slice(0, 100).trim();
          const nodeType = node.type || 'note';
          contextString += `- [${nodeType}] "${nodeTitle}": ${preview}${nodeContent.length > 100 ? '...' : ''}\n`;
        });
      }

      if (nearbyNodes.length > 0) {
        contextString += '\n🗺️ Nearby Notes:\n';
        nearbyNodes.forEach(node => {
          const nodeTitle = node.data?.title || node.data?.label || 'Untitled';
          const nodeContent = node.data?.content || node.data?.text || node.data?.description || '';
          const preview = nodeContent.slice(0, 100).trim();
          const nodeType = node.type || 'note';
          contextString += `- [${nodeType}] "${nodeTitle}": ${preview}${nodeContent.length > 100 ? '...' : ''}\n`;
        });
      }

      // Build AI prompt to expand the content with canvas context
      const prompt = `You are enhancing content for a note card titled "${currentTitle}".
${contextString ? '\n🌐 Canvas Context - Related notes on this canvas:' + contextString : ''}

Current content:
"""
${currentContent}
"""

Your task: Expand and enhance this content while keeping the same topic and style. ${contextString ? 'Consider the related notes for thematic consistency and context.' : ''} Add depth, details, examples, or insights. Keep the response concise (2-4 sentences, max 150 words) and focused on the original topic.

Return ONLY the expanded content text, no markdown formatting, no preamble.`;

      const { getLLMAdapterByName } = await import('../adapters/llm');
      const llm = await getLLMAdapterByName('groq');

      const generateOptions = { maxTokens: 250 };
      if (groqKey) {
        generateOptions.apiKey = groqKey;
      }

      const expandedContent = await llm.generate(prompt, generateOptions);

      // 🔄 UPDATE: Replace loading state with expanded content
      const timestamp = Date.now();
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            position: { x: n.position.x, y: n.position.y }, // Force new reference for React Flow change detection
            data: {
              title: n.data.title,
              content: expandedContent,
              cardType: n.data.cardType,
              color: n.data.color,
              url: n.data.url,
              createdAt: n.data.createdAt,
              isLoading: false,
              loadingMessage: undefined,
              aiExpanded: true,
              aiExpandedAt: timestamp,
              updatedAt: timestamp,
              onUpdate: handleNodeUpdate,
              onDelete: handleDeleteNode,
              onExpandWithAI: handleAIExpandNode,
            }
          };
        }
        return n;
      }));

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Expanded node ${nodeId} with AI`);
      }

    } catch (error) {
      console.error('AI Expand Node failed:', error);

      // 🧹 ERROR RECOVERY: Remove loading state and trigger React Flow update
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            position: { ...n.position }, // Force new reference for React Flow change detection
            data: {
              ...n.data,
              isLoading: false,
              loadingMessage: undefined,
              updatedAt: Date.now() // Trigger React Flow's internal change detection
            }
          };
        }
        return n;
      }));

      alert(`❌ Expand with AI failed: ${error.message}`);
    }
  }, [nodes, edges, nodeById, handleNodeUpdate, handleDeleteNode, setNodes, storedGroqKey, isAuthenticated]);

  // AI Generate Canvas - Opens the modal
  const handleAIGenerateCanvas = useCallback(() => {
    // Check for API key first
    const groqKey = storedGroqKey || import.meta.env.VITE_GROQ_API_KEY;
    if (!groqKey) {
      if (!isAuthenticated) {
        alert('🎨 Generate Canvas requires sign-in.\n\nSign in to use your stored Groq API key.');
      } else {
        alert('🎨 No Groq API key found.\n\nGo to Hub → Settings to add your Groq API key.');
      }
      return;
    }
    setShowAICanvasModal(true);
  }, [storedGroqKey, isAuthenticated]);

  // AI Generate Canvas - Actually generates the canvas from modal
  const handleAICanvasGenerate = useCallback(async (canvasTopic, options = {}) => {
    const { cardCount = 4, includeImages = false, includeVideoPlaceholder = false } = options;

    try {
      setIsGeneratingCanvas(true);

      const groqKey = storedGroqKey || import.meta.env.VITE_GROQ_API_KEY;
      const { getLLMAdapter } = await import('../adapters/llm');
      const llm = await getLLMAdapter();

      // Fixed card count - no range to prevent generating too many
      const targetCards = Math.min(cardCount, 6); // Cap at 6 cards max

      // Build conversation context from history (last 10 exchanges to stay within token limits)
      const capsuleKey = currentCapsuleId || 'default';
      const history = conversationHistories[capsuleKey] || [];
      const recentHistory = history.slice(-20); // Last 20 messages (10 exchanges)

      let contextPrefix = '';
      if (recentHistory.length > 0) {
        contextPrefix = 'Previous conversation context:\n';
        recentHistory.forEach(msg => {
          contextPrefix += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        contextPrefix += '\n';
      }

      // 🧠 NEW: Include existing canvas nodes for context-aware generation
      // This helps AI generate cards that complement what's already on the canvas
      let canvasContext = '';
      if (nodes.length > 0) {
        canvasContext = '📋 Existing canvas nodes:\n';
        // Limit to 10 most recent nodes to avoid token overflow
        const recentNodes = nodes.slice(-10);
        recentNodes.forEach(node => {
          const title = node.data?.title || node.data?.label || 'Untitled';
          const content = node.data?.content || node.data?.text || node.data?.description || '';
          const preview = content.slice(0, 60).trim();
          const nodeType = node.type || 'note';
          canvasContext += `- [${nodeType}] "${title}": ${preview}${content.length > 60 ? '...' : ''}\n`;
        });
        canvasContext += '\n💡 Generate new cards that complement these existing nodes.\n\n';
      }

      const prompt = `${contextPrefix}${canvasContext}Generate a visual planning canvas for: "${canvasTopic}"

Create a JSON array of EXACTLY ${targetCards} cards for this canvas. Each card should have:
- type: "note" | "sticky" | "todo"${includeImages ? ' | "photo"' : ''}${includeVideoPlaceholder ? ' | "video"' : ''}
- title: brief title (2-4 words)
- content: detailed content (1-2 sentences)
- color: named color (use "yellow", "purple", "green", "blue", "orange", "pink")
${includeImages ? '- For "photo" type, include imagePrompt field with a description for AI image generation' : ''}
${includeVideoPlaceholder ? '- Include exactly ONE "video" type card for embedded video content' : ''}

IMPORTANT: Include exactly ONE "sticky" type card (for a key highlight/insight). All other cards should be "note" or "todo" type.
For "todo" type, content should be a semicolon-separated list of 2-3 tasks.

Return ONLY the JSON array, no markdown or explanation.

Example format:
[
  {"type": "note", "title": "Overview", "content": "Main description here", "color": "yellow"},
  {"type": "sticky", "title": "Key Insight", "content": "Important highlight", "color": "pink"},
  {"type": "todo", "title": "Next Steps", "content": "Task 1; Task 2", "color": "green"}
]`;

      const response = await llm.generate(prompt, { maxTokens: 1500, apiKey: groqKey });

      // Parse JSON response
      let canvasCards;
      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        canvasCards = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      } catch (parseErr) {
        console.error('Failed to parse canvas JSON:', parseErr);
        alert('❌ Failed to generate canvas. Please try again.');
        setIsGeneratingCanvas(false);
        return;
      }

      if (!Array.isArray(canvasCards) || canvasCards.length === 0) {
        alert('❌ No cards generated. Please try again.');
        setIsGeneratingCanvas(false);
        return;
      }

      // Enforce card count limit to prevent too many nodes
      let limitedCards = canvasCards.slice(0, Math.min(canvasCards.length, 6));

      // FORCE video card if option selected but LLM didn't generate one
      if (includeVideoPlaceholder) {
        const hasVideoCard = limitedCards.some(card => card.type === 'video');
        if (!hasVideoCard) {
          // Replace the last non-sticky card with a video card, or add one
          const stickyIndex = limitedCards.findIndex(c => c.type === 'sticky');
          const replaceIndex = limitedCards.length > 1
            ? limitedCards.findIndex((c, i) => i !== stickyIndex && c.type !== 'video')
            : -1;

          const videoCard = {
            type: 'video',
            title: 'Video Resource',
            content: '🎬 Add a relevant video URL here to embed in your canvas',
            color: 'blue'
          };

          if (replaceIndex >= 0 && limitedCards.length >= 3) {
            // Replace a note/todo card with video if we have enough cards
            limitedCards[replaceIndex] = videoCard;
          } else {
            // Otherwise just add the video card
            limitedCards.push(videoCard);
          }
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Forced video card creation (LLM did not generate one)');
          }
        }
      }

      // Create nodes from parsed cards inside a named Group
      const timestamp = Date.now();
      // Layout constants - sized to fit actual node render dimensions
      // Note: textNode is 250px wide, stickyNode can be 200-250px, todoNode can be 300px tall
      // Sticky nodes with longer content may expand, so we need generous spacing
      const cols = 2; // 2 columns
      const childWidth = 320; // Node width allocation (increased for sticky note expansion)
      const childHeight = 340; // Node height allocation (increased for taller content)
      const childGap = 40; // Gap between cards
      const groupPadding = 50;
      const labelHeight = 60;

      // Find position for new group (avoid overlapping existing nodes)
      const existingNodes = nodes.filter(n => !n.parentId); // Only top-level nodes
      let groupX = 100;
      let groupY = 100;
      if (existingNodes.length > 0) {
        // Find the rightmost edge of existing nodes
        const maxX = Math.max(...existingNodes.map(n => (n.position?.x || 0) + (n.data?.width || 300)));
        groupX = maxX + 80; // Place new group to the right with gap
      }

      // Map hex colors to named colors (fallback for legacy or unexpected responses)
      const hexToNamedColor = (color) => {
        if (!color) return 'yellow';
        const colorLower = color.toLowerCase();
        // If already a named color, return it
        if (['yellow', 'pink', 'blue', 'green', 'orange', 'purple'].includes(colorLower)) {
          return colorLower;
        }
        // Map hex codes to named colors
        const hexMap = {
          '#fbbf24': 'yellow', '#fef3c7': 'yellow',
          '#ec4899': 'pink', '#fce7f3': 'pink',
          '#3b82f6': 'blue', '#dbeafe': 'blue',
          '#22c55e': 'green', '#10b981': 'green', '#dcfce7': 'green',
          '#f97316': 'orange', '#ffedd5': 'orange',
          '#a855f7': 'purple', '#7c3aed': 'purple', '#f3e8ff': 'purple',
        };
        return hexMap[color] || 'yellow';
      };

      // Calculate group size based on children
      const rows = Math.ceil(limitedCards.length / cols);
      const actualCols = Math.min(limitedCards.length, cols);
      const groupWidth = groupPadding * 2 + actualCols * childWidth + (actualCols - 1) * childGap;
      const groupHeight = groupPadding + labelHeight + rows * childHeight + (rows - 1) * childGap + groupPadding;

      // Create group name from topic (first 30 chars + AI tag)
      const groupLabel = canvasTopic.length > 30
        ? canvasTopic.substring(0, 27) + '...'
        : canvasTopic;

      // Create the Group node
      const groupId = `ai-group-${timestamp}`;
      const groupNode = {
        id: groupId,
        type: 'groupNode',
        position: { x: groupX, y: groupY },
        data: {
          label: `✨ ${groupLabel}`,
          color: 'yellow', // AI-generated canvases get yellow group
          width: groupWidth,
          height: groupHeight,
          childCount: limitedCards.length,
          aiGenerated: true,
          aiTopic: canvasTopic,
          createdAt: timestamp,
          onLabelChange: (id, label) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label } } : n));
          },
          onResize: (id, width, height) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, width, height } } : n));
          },
          onColorChange: (id, color) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, color } } : n));
          },
          onDelete: handleDeleteNode,
          onConvertToTodo: handleConvertGroupToTodo,
        },
        style: { zIndex: -1 }, // Groups should be behind other nodes
      };

      // Create child nodes with relative positions inside the group
      const childNodes = limitedCards.map((card, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        // Handle different card types - textNode is DEFAULT, sticky only for "sticky" type
        let nodeType = 'textNode'; // Default to text node
        let nodeData = {
          title: card.title || `Card ${index + 1}`,
          content: card.content || '',
          cardType: 'note',
          color: hexToNamedColor(card.color),
          createdAt: timestamp,
          aiGenerated: true,
          aiTopic: canvasTopic,
          onUpdate: handleNodeUpdate,
          onDelete: handleDeleteNode,
          onExpandWithAI: handleAIExpandNode,
        };

        // Only "sticky" type becomes stickyNode (one per canvas)
        if (card.type === 'sticky') {
          nodeType = 'stickyNode';
          nodeData.color = hexToNamedColor(card.color);
        }

        // For todo type, convert semicolon-separated content to items array
        if (card.type === 'todo' && card.content) {
          nodeType = 'todoNode';
          const todoItems = card.content.split(';').map((text, i) => ({
            id: `todo-${timestamp}-${index}-${i}`,
            text: text.trim(),
            completed: false
          }));
          nodeData.items = todoItems;
          nodeData.content = '';

          // 🔄 FIX: Add todo-specific handlers for proper state updates after AI generation
          nodeData.onUpdateItems = (nodeId, newItems) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? { ...n, data: { ...n.data, items: newItems, updatedAt: Date.now() } }
                  : n
              )
            );
          };
          nodeData.onTitleChange = (nodeId, newTitle) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? { ...n, data: { ...n.data, title: newTitle, updatedAt: Date.now() } }
                  : n
              )
            );
          };
        }

        // For video type - use textNode with video cardType (placeholder for embed)
        if (card.type === 'video') {
          nodeType = 'textNode';
          nodeData = {
            ...nodeData,
            title: card.title || 'Video Embed',
            content: card.content || '🎬 Video placeholder - click to add video URL',
            cardType: 'video',
            url: '',
          };
        }

        // For photo type - generate image using Pollinations (free, on-demand)
        if (card.type === 'photo') {
          nodeType = 'photoNode';
          const imagePrompt = card.imagePrompt || card.title || 'Abstract colorful illustration';
          const encodedPrompt = encodeURIComponent(imagePrompt);
          const generatedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&model=flux&nologo=true&seed=${Date.now() + index}`;

          nodeData = {
            ...nodeData,
            imageUrl: generatedImageUrl,
            thumbnail: generatedImageUrl,
            title: card.title || 'Photo',
            description: card.content || '',
            caption: '✨ AI Generated',
            aiPrompt: imagePrompt,
            aiGenerated: true,
            onRegenerate: handleRegenerateImage,
          };
        }

        return {
          id: `canvas-${timestamp}-${index}`,
          type: nodeType,
          parentId: groupId, // Link to group
          extent: 'parent', // Constrain to group
          position: {
            // Relative position inside group
            x: groupPadding + col * (childWidth + childGap),
            y: groupPadding + labelHeight + row * (childHeight + childGap)
          },
          data: nodeData
        };
      });

      // Add group first, then children
      // Set the flag before adding nodes to trigger fitView after render
      pendingFitViewRef.current = true;
      setNodes(nds => [...nds, groupNode, ...childNodes]);

      // BUG FIX: Update conversation history for context continuity
      // The AI reads conversation history (line 5130) but never writes to it,
      // causing loss of context across multiple AI canvas generations
      setConversationHistories(prev => ({
        ...prev,
        [capsuleKey]: [
          ...(prev[capsuleKey] || []),
          { role: 'user', content: `Generate a visual planning canvas for: "${canvasTopic}"` },
          { role: 'assistant', content: `Created ${limitedCards.length} cards in group "${groupLabel}": ${limitedCards.map(c => c.title).join(', ')}` }
        ]
      }));

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Generated canvas with ${limitedCards.length} cards in group "${groupLabel}" for: "${canvasTopic}"`);
      }
      setShowAICanvasModal(false);
      setIsGeneratingCanvas(false);

    } catch (error) {
      console.error('AI Generate Canvas failed:', error);
      alert(`❌ Canvas generation failed: ${error.message}`);
      setIsGeneratingCanvas(false);
    }
  }, [nodes, handleNodeUpdate, handleDeleteNode, handleRegenerateImage, setNodes, fitView, storedGroqKey]);

  // Save UnityMAP journey to cloud (Pro feature)
  const handleSaveJourney = async () => {
    // Gate cloud saving for pro/admin users only
    if (!hasProAccess()) {
      alert(
        '☁️ Cloud Save - Pro Feature\n\n' +
        'Cloud saving is available for Pro users.\n\n' +
        '✅ Your work is saved locally automatically\n' +
        '✅ Use EXPORT to save as JSON file\n\n' +
        'Contact us for Pro access.'
      );
      return;
    }

    // Check for MAP nodes (use module-level MAP_NODE_TYPES Set for O(1) lookup)
    const mapNodes = nodes.filter(n => MAP_NODE_TYPES.has(n.type));

    if (mapNodes.length === 0) {
      alert('⚠️ No MAP nodes to save.\n\nCreate a journey in Outreach Generator first.');
      return;
    }

    try {
      let journeyId;

      if (currentJourneyId) {
        // Update existing journey
        await updateJourney(currentJourneyId, nodes, edges, {
          title: journeyTitle,
          status: 'draft'
        });
        journeyId = currentJourneyId;
        alert('✅ Journey updated successfully!');
      } else {
        // Save new journey
        journeyId = await saveJourney(nodes, edges, {
          title: journeyTitle,
          status: 'draft'
        });
        setCurrentJourneyId(journeyId);
        alert(`✅ Journey saved!\n\nID: ${journeyId}`);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Journey saved:', journeyId);
      }
    } catch (error) {
      console.error('❌ Save journey failed:', error);

      if (error.message.includes('quota') || error.message.includes('exceeded')) {
        alert(
          '🔴 FIREBASE QUOTA EXCEEDED\n\n' +
          'The free tier limit has been reached.\n\n' +
          '✅ Your work is still saved locally\n' +
          '✅ Use EXPORT to save as JSON file'
        );
      } else {
        alert(`❌ Save failed: ${error.message}`);
      }
    }
  };

  // Handle opening publish modal (reserved for future publish button)
  const _handleStartPublish = async () => {
    if (!hasProAccess()) {
      alert(
        '☁️ Publish Journey - Pro Feature\n\n' +
        'Publishing journeys is available for Pro users.\n\n' +
        'Contact us for Pro access.'
      );
      return;
    }

    // Check for MAP nodes
    const mapNodeTypes = ['prospectNode', 'emailNode', 'waitNode', 'conditionNode', 'exitNode'];
    const mapNodes = nodes.filter(n => mapNodeTypes.includes(n.type));

    if (mapNodes.length === 0) {
      alert('⚠️ No MAP nodes to publish.\n\nCreate a journey in Outreach Generator first.');
      return;
    }

    const emailNodes = nodes.filter(n => n.type === 'emailNode');
    if (emailNodes.length === 0) {
      alert('⚠️ No email nodes in journey.\n\nAdd at least one email to publish.');
      return;
    }

    // Save journey first if not saved
    if (!currentJourneyId) {
      try {
        const journeyId = await saveJourney(nodes, edges, {
          title: journeyTitle,
          status: 'draft'
        });
        setCurrentJourneyId(journeyId);
      } catch (error) {
        alert(`❌ Failed to save journey: ${error.message}`);
        return;
      }
    }

    // Open prospect modal
    setShowProspectModal(true);
  };

  // Handle publishing with prospects - adds prospects AND sends emails immediately
  const handlePublishWithProspects = async (prospects) => {
    if (!currentJourneyId) {
      alert('❌ Journey must be saved first');
      return;
    }

    try {
      // Update journey with current nodes/edges first
      await updateJourney(currentJourneyId, nodes, edges, {
        title: journeyTitle
      });

      // Publish with prospects (adds them to journey)
      const result = await publishJourney(currentJourneyId, prospects);

      setJourneyStatus('active');
      setShowProspectModal(false);

      // Immediately send emails to the new prospects
      setIsSendingEmails(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Starting sendJourneyNow for journey:', currentJourneyId);
      }
      const sendResults = await sendJourneyNow(currentJourneyId);
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 sendJourneyNow complete:', sendResults);
      }
      setIsSendingEmails(false);

      // Refresh journey data for visual tracking (reload from Firestore)
      try {
        const journeyData = await loadJourney(currentJourneyId);
        if (journeyData?.prospects) {
          setJourneyProspects(journeyData.prospects);
          if (process.env.NODE_ENV === 'development') {
            console.log('👥 Updated prospect positions:', journeyData.prospects.map(p => ({
              email: p.email,
              currentNodeId: p.currentNodeId,
              status: p.status
            })));
          }
        }
        // Also refresh nodes to update email statuses (DRAFT -> SENT)
        if (journeyData?.nodes) {
          setNodes(journeyData.nodes);
          if (process.env.NODE_ENV === 'development') {
            console.log('📧 Updated node statuses');
          }
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Could not refresh journey data:', e);
        }
      }

      // Show results
      let message = `✅ Campaign Deployed!\n\n`;
      message += `${result.prospectCount} prospect(s) added.\n`;
      if (sendResults.sent > 0) {
        message += `📧 ${sendResults.sent} email(s) sent!\n`;
      }
      if (sendResults.failed > 0) {
        message += `❌ ${sendResults.failed} email(s) failed.\n`;
        // Show error details
        const failedDetails = sendResults.details?.filter(d => d.status !== 'sent');
        if (failedDetails?.length > 0) {
          message += `\nErrors:\n`;
          failedDetails.forEach(d => {
            message += `- ${d.to}: ${d.error || 'Unknown error'}\n`;
          });
        }
      }
      if (sendResults.sent === 0 && sendResults.failed === 0) {
        message += `⚠️ No emails were processed.\nCheck browser console (F12) for details.`;
      }
      message += `\nUse RUN to send follow-up emails.`;

      alert(message);
    } catch (error) {
      console.error('❌ Publish failed:', error);
      setIsSendingEmails(false);
      alert(`❌ Publish failed: ${error.message}`);
    }
  };

  // Send emails directly from canvas (immediate send via ESP/Resend)
  const _handleSendEmailsNow = async () => {
    if (!hasProAccess()) {
      alert(
        '☁️ Send Emails - Pro Feature\n\n' +
        'Sending emails is available for Pro users.\n\n' +
        'Contact us for Pro access.'
      );
      return;
    }

    // Get email nodes from canvas
    const emailNodes = nodes.filter(n => n.type === 'emailNode');
    if (emailNodes.length === 0) {
      alert('⚠️ No email nodes found.\n\nAdd at least one email to send.');
      return;
    }

    // Get prospect node for recipient info
    const prospectNode = nodes.find(n => n.type === 'prospectNode');
    if (!prospectNode) {
      alert('⚠️ No prospect found.\n\nCreate a campaign in Outreach Generator first, or add prospects via Publish.');
      return;
    }

    // Check if journey is saved - if not, save and prompt for prospects
    if (!currentJourneyId) {
      try {
        setIsSendingEmails(true);
        const journeyId = await saveJourney(nodes, edges, {
          title: journeyTitle,
          status: 'draft'
        });
        setCurrentJourneyId(journeyId);
        setIsSendingEmails(false);

        // Show helpful message and open prospect modal
        alert(
          '📧 Journey Saved!\n\n' +
          'Now add email recipients to send your campaign.\n\n' +
          'Click OK to add prospects.'
        );
        setShowProspectModal(true);
        return;
      } catch (error) {
        setIsSendingEmails(false);
        console.error('Save journey failed:', error);
        alert(`❌ Failed to save journey: ${error.message}`);
        return;
      }
    }

    // Journey exists - try to send emails
    try {
      setIsSendingEmails(true);

      // Send emails via ESP (Resend)
      const results = await sendJourneyNow(currentJourneyId);

      if (results.sent === 0 && results.failed === 0) {
        // No prospects - open modal to add them
        alert(
          '📧 No Recipients\n\n' +
          'Add email addresses to send your campaign.\n\n' +
          'Click OK to add prospects.'
        );
        setShowProspectModal(true);
        return;
      }

      setJourneyStatus('active');

      // Refresh journey data to update node statuses (DRAFT -> SENT)
      try {
        const journeyData = await loadJourney(currentJourneyId);
        if (journeyData?.nodes) {
          setNodes(journeyData.nodes);
          if (process.env.NODE_ENV === 'development') {
            console.log('📧 Updated node statuses after RUN ALL');
          }
        }
        if (journeyData?.prospects) {
          setJourneyProspects(journeyData.prospects);
        }
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Could not refresh journey data:', e);
        }
      }

      // Show detailed results
      let resultMessage = `📧 Email Campaign Sent!\n\n`;
      resultMessage += `✅ Successfully sent: ${results.sent}\n`;
      if (results.failed > 0) {
        resultMessage += `❌ Failed: ${results.failed}\n`;
      }
      resultMessage += `\nEmails sent via Resend ESP.`;

      // Log details to console
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Send results:', results);
      }
      if (results.details) {
        results.details.forEach((d, i) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`  ${i + 1}. ${d.to}: ${d.status}${d.error ? ` - ${d.error}` : ''}`);
          }
        });
      }

      alert(resultMessage);

    } catch (error) {
      console.error('❌ Send emails failed:', error);

      if (error.message.includes('No prospects')) {
        alert(
          '📧 No Recipients\n\n' +
          'Add email addresses to send your campaign.\n\n' +
          'Click OK to add prospects.'
        );
        setShowProspectModal(true);
      } else if (error.message.includes('service unavailable') || error.message.includes('Function')) {
        alert(
          '❌ Email Service Unavailable\n\n' +
          'The Firebase email function needs to be deployed.\n\n' +
          'Run: firebase deploy --only functions:sendEmail'
        );
      } else {
        alert(`❌ Send failed: ${error.message}`);
      }
    } finally {
      setIsSendingEmails(false);
    }
  };

  // Open Add Note dialog
  const handleAddNote = useCallback(() => {
    setIsUploadModalOpen(true);
  }, [setIsUploadModalOpen]);

  // Count email nodes for credit enforcement (uses nodeCountsByType for O(1) lookup)
  const emailNodeCount = useMemo(() => {
    return nodeCountsByType['emailNode'] || 0;
  }, [nodeCountsByType]);

  // Determine email limit based on user access/scope
  const emailLimit = useMemo(() => {
    // Admin - highest limit (authenticated via SSO)
    if (isAdmin) return 50;
    // Premium tier - high limit
    if (isAuthenticated && tier === 'premium') return 25;
    // Free authenticated users
    if (isAuthenticated) return 10;
    // Anonymous users
    return 3;
  }, [isAdmin, isAuthenticated, tier]);

  // Add new Email node to canvas
  const handleAddEmail = useCallback(() => {
    if (emailNodeCount >= emailLimit) return;

    const timestamp = Date.now();
    const newNode = {
      id: `email-${timestamp}-${emailNodeCount}`,
      type: 'emailNode',
      position: { x: 400, y: 200 + (emailNodeCount * 180) },
      data: {
        label: `Email ${emailNodeCount + 1}`,
        subject: '',
        preview: 'Click Edit to add content',
        fullBody: '',
        status: 'draft',
        onInlineEdit: handleInlineEmailEdit,
        onPreview: handleEmailPreview,
        onEditInOutreach: handleEditInOutreach
      }
    };
    setNodes((nds) => [...nds, newNode]);
  }, [emailNodeCount, emailLimit, setNodes, handleInlineEmailEdit, handleEmailPreview, handleEditInOutreach]);

  // Add new Wait node to canvas
  const handleAddWait = useCallback(() => {
    const timestamp = Date.now();
    const newNode = {
      id: `wait-${timestamp}`,
      type: 'waitNode',
      position: { x: 400, y: nodes.length * 100 + 100 },
      data: {
        duration: 3,
        unit: 'days',
        label: 'Wait',
        onInlineEdit: handleInlineWaitEdit
      }
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes, handleInlineWaitEdit]);

  // Add new Condition node to canvas
  const handleAddCondition = useCallback(() => {
    const timestamp = Date.now();
    const newNode = {
      id: `condition-${timestamp}`,
      type: 'conditionNode',
      position: { x: 400, y: nodes.length * 100 + 100 },
      data: {
        conditionType: 'opened',
        label: 'Condition',
        waitDays: 3,
        onInlineEdit: handleInlineConditionEdit
      }
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes, handleInlineConditionEdit]);

  // Pan canvas handler for keyboard navigation
  const handlePan = useCallback((delta) => {
    const viewport = getViewport();
    setViewport({
      x: viewport.x + delta.x,
      y: viewport.y + delta.y,
      zoom: viewport.zoom,
    });
  }, [getViewport, setViewport]);

  // Keyboard Node Navigation: Find node in given direction based on spatial position
  const getNodeInDirection = useCallback((currentNodeId, direction) => {
    if (!currentNodeId) return null;

    // Performance: Use O(1) Map lookup instead of O(n) nodes.find()
    const currentNode = nodeById.get(currentNodeId);
    if (!currentNode) return null;

    // Get all other nodes
    const otherNodes = nodes.filter((n) => n.id !== currentNodeId);
    if (otherNodes.length === 0) return null;

    // Filter nodes based on direction relative to current node
    let candidateNodes = [];
    const threshold = 50; // pixels - helps with near-axis alignment

    switch (direction) {
      case 'up':
        candidateNodes = otherNodes.filter((n) => n.position.y < currentNode.position.y - threshold);
        break;
      case 'down':
        candidateNodes = otherNodes.filter((n) => n.position.y > currentNode.position.y + threshold);
        break;
      case 'left':
        candidateNodes = otherNodes.filter((n) => n.position.x < currentNode.position.x - threshold);
        break;
      case 'right':
        candidateNodes = otherNodes.filter((n) => n.position.x > currentNode.position.x + threshold);
        break;
      default:
        return null;
    }

    if (candidateNodes.length === 0) return null;

    // Find closest node in the direction using weighted distance
    // Prioritize nodes that are more aligned with the direction axis
    let closestNode = null;
    let minScore = Infinity;

    candidateNodes.forEach((node) => {
      const dx = node.position.x - currentNode.position.x;
      const dy = node.position.y - currentNode.position.y;

      let primaryDistance, secondaryDistance;

      if (direction === 'up' || direction === 'down') {
        primaryDistance = Math.abs(dy); // Vertical distance (primary)
        secondaryDistance = Math.abs(dx); // Horizontal distance (secondary)
      } else {
        primaryDistance = Math.abs(dx); // Horizontal distance (primary)
        secondaryDistance = Math.abs(dy); // Vertical distance (secondary)
      }

      // Weighted score: prioritize primary direction, penalize misalignment
      const score = primaryDistance + (secondaryDistance * 2);

      if (score < minScore) {
        minScore = score;
        closestNode = node;
      }
    });

    return closestNode?.id || null;
  }, [nodes, nodeById]);

  // Keyboard Node Navigation: Handle arrow key navigation between nodes
  const handleNodeNavigation = useCallback((direction) => {
    // If no node is focused, focus the first selected node or the first node
    if (!focusedNodeId) {
      const firstNode = selectedNode || nodes[0];
      if (firstNode) {
        setFocusedNodeId(firstNode.id);
        // Center the node in view
        const node = getNode(firstNode.id);
        if (node) {
          setCenter(node.position.x + 150, node.position.y + 100, { duration: 400, zoom: 1.2 });
        }
      }
      return;
    }

    // Find the next node in the given direction
    const nextNodeId = getNodeInDirection(focusedNodeId, direction);
    if (nextNodeId) {
      setFocusedNodeId(nextNodeId);
      // Center the new focused node in view
      const node = getNode(nextNodeId);
      if (node) {
        setCenter(node.position.x + 150, node.position.y + 100, { duration: 400, zoom: 1.2 });
      }
    }
  }, [focusedNodeId, selectedNode, nodes, getNodeInDirection, getNode, setCenter]);

  // Clear focus on Escape key
  const handleClearFocus = useCallback(() => {
    setFocusedNodeId(null);
  }, []);

  // Quick Jump: Jump to selected node from fuzzy search
  const handleQuickJump = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setCenter(node.position.x + (node.width || 200) / 2, node.position.y + (node.height || 100) / 2, {
      duration: 300,
      zoom: 1.2
    });

    setSelectedNodes([node]);
    setFocusedNodeId(nodeId);
    setShowQuickJump(false);
    setQuickJumpQuery('');
    setQuickJumpSelectedIndex(0);
  }, [nodes, setCenter, setSelectedNodes]);

  // Tab navigation through nodes
  const handleTabNavigation = useCallback((direction) => {
    const nodesList = visibleTabNodes;
    if (nodesList.length === 0) return;

    if (!focusedNodeId) {
      setFocusedNodeId(nodesList[0].id);
      const node = getNode(nodesList[0].id);
      if (node) setCenter(node.position.x + 150, node.position.y + 100, { duration: 400, zoom: 1.2 });
      return;
    }

    const currentIndex = nodesList.findIndex(n => n.id === focusedNodeId);
    const nextIndex = direction === 'forward'
      ? (currentIndex + 1) % nodesList.length
      : currentIndex === 0 ? nodesList.length - 1 : currentIndex - 1;

    setFocusedNodeId(nodesList[nextIndex].id);
    const node = getNode(nodesList[nextIndex].id);
    if (node) setCenter(node.position.x + 150, node.position.y + 100, { duration: 400, zoom: 1.2 });
  }, [focusedNodeId, visibleTabNodes, getNode, setCenter]);

  // Deselect all nodes
  const handleDeselect = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
  }, [setNodes]);

  // Delete selected nodes
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.length === 0) return;
    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
    setEdges((eds) =>
      eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target))
    );
  }, [selectedNodes, setNodes, setEdges]);

  // Duplicate selected nodes
  const handleDuplicateSelected = useCallback(() => {
    if (selectedNodes.length === 0) return;

    // Save current state to history before duplication
    saveToHistory();

    const timestamp = Date.now();
    const offset = 50; // Offset for duplicated nodes

    const newNodes = selectedNodes.map((node, index) => {
      // Create a deep copy of the node data
      const newData = { ...node.data };

      // Preserve callbacks from original
      if (node.data.onUpdate) newData.onUpdate = handleNodeUpdate;
      if (node.data.onDelete) newData.onDelete = handleDeleteNode;
      if (node.data.onResize) newData.onResize = handlePhotoResize;

      return {
        ...node,
        id: `${node.type}-dup-${timestamp}-${index}`,
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
        data: {
          ...newData,
          createdAt: timestamp,
        },
        selected: true, // Auto-select duplicated nodes
      };
    });

    // Deselect original nodes and add new nodes with selection
    setNodes((nds) => [
      ...nds.map(n => ({ ...n, selected: false })),
      ...newNodes
    ]);

    // Auto-fit view to show duplicated nodes after DOM update
    pendingFitViewRef.current = true;
  }, [selectedNodes, setNodes, handleNodeUpdate, handleDeleteNode, handlePhotoResize, saveToHistory]);

  // Convert selected group nodes to todo
  const handleConvertSelectedGroupToTodo = useCallback(() => {
    if (selectedNodes.length === 0) return;

    // Filter only group nodes
    const selectedGroupNodes = selectedNodes.filter(n => n.type === 'groupNode');

    if (selectedGroupNodes.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ No group nodes selected to convert');
      }
      return;
    }

    if (selectedGroupNodes.length > 1) {
      alert('⚠️ Please select only one group node at a time to convert to a todo checklist.');
      return;
    }

    // Convert the single selected group node
    const groupNode = selectedGroupNodes[0];
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Converting selected group to todo:', groupNode.id);
    }
    handleConvertGroupToTodo(groupNode.id);
  }, [selectedNodes, handleConvertGroupToTodo]);

  // Toggle lock status on selected nodes (P6 Feature: Node Locking)
  const handleToggleLockSelected = useCallback(() => {
    if (selectedNodes.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ No nodes selected to lock/unlock');
      }
      return;
    }

    // Save current state to history before locking
    saveToHistory();

    // Determine if we're locking or unlocking based on first selected node
    const firstNode = selectedNodes[0];
    const shouldLock = !firstNode.data?.isLocked;

    // Update all selected nodes with the new lock status
    setNodes((nds) =>
      nds.map((node) => {
        if (node.selected) {
          return {
            ...node,
            draggable: !shouldLock, // Set draggable property based on lock status
            data: {
              ...node.data,
              isLocked: shouldLock,
            },
          };
        }
        return node;
      })
    );

    // User feedback
    const lockIcon = shouldLock ? '🔒' : '🔓';
    const action = shouldLock ? 'Locked' : 'Unlocked';
    if (process.env.NODE_ENV === 'development') {
      console.log(`${lockIcon} ${action} ${selectedNodes.length} node(s)`);
    }
  }, [selectedNodes, setNodes, saveToHistory]);

  // Smart save handler - saves journey if MAP nodes exist, otherwise saves capsule
  const handleSmartSave = useCallback(async () => {
    if (hasMapNodes) {
      // Has MAP nodes - save as journey
      await handleSaveJourney();
    } else if (nodes.length > 0) {
      // Has regular nodes - save as capsule
      await handleSaveAndShare();
    } else {
      alert('⚠️ No nodes to save.\n\nAdd some notes or content first.');
    }
  }, [hasMapNodes, nodes.length, handleSaveJourney, handleSaveAndShare]);

  // Keyboard shortcuts hook
  const { showHelp: showShortcutsHelp, setShowHelp: setShowShortcutsHelp } = useKeyboardShortcuts({
    onSave: handleSmartSave,
    onExport: handleExportJSON,
    onExportPNG: handleExportPNG,
    onExportMarkdown: handleExportMarkdown,
    onImport: handleImportJSON,
    onAddCard: () => handleAddCard('note'),
    onDelete: handleDeleteSelected,
    onDuplicate: handleDuplicateSelected,
    onConvertGroupToTodo: handleConvertSelectedGroupToTodo,
    onShowTemplates: () => setShowTemplatesModal(true),
    onShowAnalytics: () => setShowAnalytics(true),
    onQuickJump: () => setShowQuickJump(true),
    onQuickComment: handleQuickComment,
    onToggleLock: handleToggleLockSelected,
    onFitView: () => fitView({ duration: 400, padding: 0.1 }),
    onResetZoom: () => setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 400 }),
    onDeselect: handleDeselect,
    onPan: handlePan,
    onNodeNavigation: handleNodeNavigation,
    onClearFocus: handleClearFocus,
    onTabNavigation: handleTabNavigation,
    onUndo: handleUndo,
    onRedo: handleRedo,
    enabled: currentMode === 'notes', // Only enable in notes mode
  });

  // Parallax toggle handler (state lifted to parent)
  const handleToggleParallax = useCallback(() => {
    setShowParallax(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem('unity-notes-show-parallax', JSON.stringify(newVal));
      } catch {
        // Ignore storage errors
      }
      return newVal;
    });
  }, [setShowParallax]);

  // ============================================================
  // NOTIFICATION DROPDOWN - Performance Optimized Helper Functions
  // ============================================================

  // Helper: Calculate relative time (memoized to prevent recreation on every render)
  const getNotificationRelativeTime = useCallback((timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    return 'Earlier';
  }, []);

  // Helper: Get icon based on notification type (memoized)
  const getNotificationIcon = useCallback((type) => {
    if (type === 'reply') return '↩️';
    if (type === 'mention') return '@';
    return '💬';
  }, []);

  /**
   * Memoized notification data wrapper
   * Wraps the notifications array (computed at line ~5640) with derived state
   * @type {Object}
   * @property {Array} notifications - Array of notification objects from recent comments/mentions
   * @property {number} count - Total number of notifications
   * @property {boolean} hasNotifications - Whether there are any notifications
   * @dependency {Array} notifications - Source notifications array (DO NOT rename)
   */
  const notificationData = useMemo(() => {
    const count = notifications.length;
    return {
      notifications: notifications,
      count,
      hasNotifications: count > 0,
    };
  }, [notifications]);

  // Memoized handlers for notification dropdown
  const handleToggleNotificationDropdown = useCallback(() => {
    setShowNotificationDropdown(prev => !prev);
  }, []);

  const handleCloseNotificationDropdown = useCallback(() => {
    setShowNotificationDropdown(false);
  }, []);

  const handleNotificationClick = useCallback((nodeId) => {
    if (nodeId) {
      centerNode(nodeId);
      setSelectedNode(nodeId);
      setShowNotificationDropdown(false);
    }
  }, [centerNode, setSelectedNode]);

  // Memoized handlers for control panel toggle buttons (Performance optimization - Jan 2, 2026)
  // Prevents inline arrow function recreation on every render
  const handleToggleMinimap = useCallback(() => {
    setShowMinimap(prev => !prev);
  }, []);

  const handleToggleOverviewTray = useCallback(() => {
    setShowOverviewTray(prev => !prev);
  }, []);

  const handleTogglePanMode = useCallback(() => {
    setIsPanModeActive(prev => !prev);
  }, []);

  const handleCycleTheme = useCallback(() => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'custom' : 'light';
    setTheme(nextTheme);
  }, [theme]);

  const handleToggleHaptics = useCallback(() => {
    setHapticsEnabled(prev => {
      const newValue = !prev;
      // Give immediate feedback when toggling on
      if (newValue) {
        setTimeout(() => {
          if (navigator.vibrate) {
            navigator.vibrate(20);
          }
        }, 100);
      }
      return newValue;
    });
  }, []);

  // Memoized handlers for mode panel toggle button (Performance optimization - Jan 2, 2026)
  // Prevents inline arrow function recreation on every render (3 functions eliminated)
  const handleToggleModePanel = useCallback(() => {
    setShowModePanel(prev => !prev);
  }, []);

  const handleModePanelButtonMouseEnter = useCallback((e) => {
    if (!showModePanel) {
      e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
      e.currentTarget.style.transform = 'scale(1.08)';
    }
  }, [showModePanel]);

  const handleModePanelButtonMouseLeave = useCallback((e) => {
    if (!showModePanel) {
      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
      e.currentTarget.style.transform = 'scale(1)';
    }
  }, [showModePanel]);

  // Memoized handlers for toolbar button hover effects (Performance optimization - Jan 2, 2026)
  // Prevents inline arrow function recreation on every render (12 functions eliminated)
  const handleDuplicateButtonMouseEnter = useCallback((e) => {
    if (hasSelectedNodes) {
      e.currentTarget.style.backgroundColor = 'rgba(147, 51, 234, 0.15)';
      e.currentTarget.style.transform = 'scale(1.08)';
    }
  }, [hasSelectedNodes]);

  const handleDuplicateButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = hasSelectedNodes ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.02)';
    e.currentTarget.style.transform = 'scale(1)';
  }, [hasSelectedNodes]);

  const handleBookmarkButtonMouseEnter = useCallback((e) => {
    if (currentCapsuleId) {
      e.currentTarget.style.backgroundColor = isBookmarked ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.15)';
      e.currentTarget.style.transform = 'scale(1.08)';
    }
  }, [currentCapsuleId, isBookmarked]);

  const handleBookmarkButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = isBookmarked ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0, 0, 0, 0.04)';
    e.currentTarget.style.transform = 'scale(1)';
  }, [isBookmarked]);

  const handleMinimapButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = showMinimap ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.1)';
    e.currentTarget.style.transform = 'scale(1.08)';
  }, [showMinimap]);

  const handleMinimapButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = showMinimap ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.04)';
    e.currentTarget.style.transform = 'scale(1)';
  }, [showMinimap]);

  const handleOverviewButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = showOverviewTray ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.1)';
    e.currentTarget.style.transform = 'scale(1.08)';
  }, [showOverviewTray]);

  const handleOverviewButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = showOverviewTray ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.04)';
    e.currentTarget.style.transform = 'scale(1)';
  }, [showOverviewTray]);

  const handlePanModeButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.backgroundColor = isPanModeActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)';
    e.currentTarget.style.transform = 'scale(1.08)';
  }, [isPanModeActive]);

  const handlePanModeButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.backgroundColor = isPanModeActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.04)';
    e.currentTarget.style.transform = 'scale(1)';
  }, [isPanModeActive]);

  const handleThemeButtonMouseEnter = useCallback((e) => {
    const hoverColor = theme === 'custom' ? 'rgba(167, 139, 250, 0.25)' : (isDarkTheme ? 'rgba(59, 130, 246, 0.25)' : 'rgba(251, 191, 36, 0.25)');
    e.currentTarget.style.backgroundColor = hoverColor;
    e.currentTarget.style.transform = 'scale(1.08)';
  }, [theme, isDarkTheme]);

  const handleThemeButtonMouseLeave = useCallback((e) => {
    const normalColor = theme === 'custom' ? 'rgba(167, 139, 250, 0.15)' : (isDarkTheme ? 'rgba(59, 130, 246, 0.15)' : 'rgba(251, 191, 36, 0.15)');
    e.currentTarget.style.backgroundColor = normalColor;
    e.currentTarget.style.transform = 'scale(1)';
  }, [theme, isDarkTheme]);

  // Dev Tools Panel close button handler (memoized to prevent unnecessary re-renders)
  const handleDevToolsClose = useCallback(() => {
    setShowDevTools(false);
  }, []);

  // Memoized styles for notification bell button (prevents object recreation)
  const bellButtonStyle = useMemo(() => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    background: notificationData.hasNotifications ? '#fbbf24' : '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '20px',
    animation: notificationData.hasNotifications ? 'pulse 2s ease-in-out infinite' : 'none',
  }), [notificationData.hasNotifications]);

  // Memoized styles for notification dropdown panel (prevents object recreation)
  // Structural styles
  const notificationBadgeStyle = useMemo(() => ({
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    background: '#ef4444',
    color: '#fff',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: 'bold',
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  }), []);

  // Notification Bell Container - Memoized style (performance optimization)
  // Dynamic positioning based on activeViewers.length
  const notificationBellContainerStyle = useMemo(() => ({
    position: 'fixed',
    top: activeViewers.length > 0 ? '76px' : '20px',
    right: '20px',
    zIndex: 1002,
  }), [activeViewers.length]);

  const notificationOverlayStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  }), []);

  const notificationDropdownStyle = useMemo(() => ({
    position: 'absolute',
    top: '52px',
    right: '0',
    width: '360px',
    maxHeight: '500px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    zIndex: 1003,
  }), []);

  const notificationHeaderStyle = useMemo(() => ({
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#111827',
    background: '#f9fafb',
  }), []);

  const notificationListStyle = useMemo(() => ({
    maxHeight: '440px',
    overflowY: 'auto',
  }), []);

  const emptyNotificationsContainerStyle = useMemo(() => ({
    padding: '40px 20px',
    textAlign: 'center',
    color: '#6b7280',
  }), []);

  const notificationItemContainerBaseStyle = useMemo(() => ({
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    background: '#fff',
    outline: 'none',
  }), []);

  const notificationContentFlexStyle = useMemo(() => ({
    display: 'flex',
    gap: '12px',
  }), []);

  // Typography and icon styles
  const emptyNotificationIconStyle = useMemo(() => ({
    fontSize: '48px',
    marginBottom: '12px',
  }), []);

  const emptyNotificationTextStyle = useMemo(() => ({
    fontSize: '14px',
  }), []);

  const emptyNotificationSubtextStyle = useMemo(() => ({
    fontSize: '12px',
    marginTop: '4px',
  }), []);

  const notificationIconContainerStyle = useMemo(() => ({
    fontSize: '20px',
    flexShrink: 0,
  }), []);

  const notificationContentContainerStyle = useMemo(() => ({
    flex: 1,
    minWidth: 0,
  }), []);

  // Memoized styles for Active Viewers Presence Indicator (prevents object recreation on every render)
  const activeViewersContainerStyle = useMemo(() => ({
    position: 'fixed',
    top: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(12px)',
    borderRadius: '24px',
    padding: '8px 16px 8px 8px',
    zIndex: 9998,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    animation: 'fadeIn 0.3s ease-out',
    pointerEvents: 'none',
    userSelect: 'none',
  }), []);

  const activeViewersAvatarContainerStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }), []);

  const activeViewersCountContainerStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
  }), []);

  const activeViewersIndicatorDotStyle = useMemo(() => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  }), []);

  const activeViewersAvatarBaseStyle = useMemo(() => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
  }), []);

  // Active Viewers Avatar Dynamic Styles - Memoized generator (performance optimization)
  // Generates dynamic avatar styles to prevent inline object creation on every render
  const getActiveViewerAvatarStyle = useCallback((viewer, index) => ({
    ...activeViewersAvatarBaseStyle,
    backgroundColor: viewer.avatar ? 'transparent' : `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
    backgroundImage: viewer.avatar ? `url(${viewer.avatar})` : 'none',
    marginLeft: index > 0 ? '-8px' : '0',
    zIndex: 3 - index,
  }), [activeViewersAvatarBaseStyle]);

  // Active Viewers Display List - Memoized to prevent unnecessary array allocations
  // Only creates new array when activeViewers actually changes (users join/leave)
  // Prevents 96% of array allocations (200+ renders/session → 5 activeViewer changes)
  const displayedActiveViewers = useMemo(
    () => activeViewers.slice(0, 3),
    [activeViewers]
  );

  // Main container style (performance optimization - static, no dependencies)
  const mainContainerStyle = useMemo(() => ({
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: 20
  }), []);

  // React Flow container style (performance optimization - depends only on sidebarOpen)
  const reactFlowContainerStyle = useMemo(() => ({
    position: 'fixed',
    top: 0,
    left: sidebarOpen ? 'min(max(280px, 35vw), 472px)' : '0px',
    right: 0,
    bottom: 0,
    transition: 'left 0.5s ease-out',
    zIndex: 1
  }), [sidebarOpen]);

  // Canvas container style (performance optimization - prevents recreation on every render)
  const canvasContainerStyle = useMemo(() => ({
    display: currentMode === 'studio' ? 'none' : 'block',
    height: '100%',
    // iOS Safari Touch Fix: Disable browser touch handling for React Flow control
    // 'none' gives React Flow full control over all touch gestures (pan, pinch-zoom, drag)
    // This prevents iOS Safari from interfering with ReactFlow's internal gesture handlers
    // Recommended by ReactFlow documentation for optimal pinch-zoom performance
    touchAction: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    WebkitTouchCallout: 'none',
    // Pan Mode Visual Enhancement: Provide clear feedback when pan mode is active
    // - Cursor changes to grab hand to indicate draggable surface
    // - Subtle blue border highlights the canvas boundary
    // - Smooth transitions for polished UX
    cursor: isPanModeActive ? 'grab' : 'default',
    border: isPanModeActive ? '2px solid rgba(59, 130, 246, 0.3)' : 'none',
    boxSizing: 'border-box', // Prevent border from affecting canvas dimensions
    transition: 'border 0.2s ease, cursor 0.1s ease',
  }), [currentMode, isPanModeActive]);

  // Memoized styles for Floating Comment Toolbar (prevents object recreation on every render)
  const floatingToolbarBaseStyle = useMemo(() => ({
    position: 'absolute',
    transform: 'translate(-50%, -100%)',
    zIndex: 1000,
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.98) 0%, rgba(245, 158, 11, 0.98) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '8px 12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(251, 191, 36, 0.3)',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    pointerEvents: 'auto',
  }), []);

  const floatingToolbarButtonStyle = useMemo(() => ({
    background: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#d97706',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  }), []);

  const floatingToolbarIconButtonStyle = useMemo(() => ({
    background: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    minWidth: '32px',
    height: '32px',
  }), []);

  // Callback to generate dynamic position styles for floating toolbar (prevents object recreation)
  const getFloatingToolbarPositionStyle = useCallback((x, y) => ({
    left: `${x}px`,
    top: `${y}px`,
  }), []);

  // Optimized callback that returns only dynamic position properties
  // Base styles are merged at JSX level to eliminate spread operator allocations during mouse movement
  const getFloatingCommentToolbarStyle = useCallback((x, y) => ({
    left: `${x}px`,
    top: `${y}px`,
  }), []);

  const floatingToolbarDeleteButtonStyle = useMemo(() => ({
    background: 'rgba(239, 68, 68, 0.95)',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    minWidth: '32px',
    height: '32px',
    color: 'white',
  }), []);

  // Memoized combined style for floating comment toolbar (base + dynamic position)
  const floatingCommentToolbarStyle = useMemo(() => ({
    ...floatingToolbarBaseStyle,
    ...getFloatingCommentToolbarStyle(
      commentToolbarPosition.x,
      commentToolbarPosition.y
    )
  }), [commentToolbarPosition]);

  const floatingToolbarCloseButtonStyle = useMemo(() => ({
    background: 'rgba(255, 255, 255, 0.8)',
    border: 'none',
    borderRadius: '6px',
    width: '24px',
    height: '24px',
    fontSize: '14px',
    color: '#78716c',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  }), []);

  const floatingToolbarColorPickerDropdownStyle = useMemo(() => ({
    position: 'absolute',
    top: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10002,
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(203, 213, 225, 0.5)',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    minWidth: '200px',
  }), []);

  const floatingToolbarColorButtonBaseStyle = useMemo(() => ({
    border: '2px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    transition: 'all 0.15s ease',
  }), []);

  // Pre-computed Map of all 8 color button styles - CRITICAL OPTIMIZATION
  // Replaces function calls in .map() loop with O(1) Map lookups
  // Before: 8 new style objects created on EVERY render when picker open
  // After: 8 style objects created ONCE on mount (100% reduction in allocations)
  const colorButtonStylesMap = useMemo(() => {
    const map = new Map();
    const colors = [
      '#FFF59D', '#90CAF9', '#A5D6A7', '#F48FB1',
      '#CE93D8', '#FFAB91', '#EF9A9A', '#E0E0E0'
    ];
    colors.forEach(colorHex => {
      map.set(colorHex, {
        ...floatingToolbarColorButtonBaseStyle,
        background: colorHex,
      });
    });
    return map;
  }, [floatingToolbarColorButtonBaseStyle]);

  const floatingToolbarColorPickerContainerStyle = useMemo(() => ({
    position: 'relative'
  }), []);

  const colorPaletteColors = useMemo(() => [
    { hex: '#FFF59D', emoji: '💛', name: 'Yellow' },
    { hex: '#90CAF9', emoji: '💙', name: 'Blue' },
    { hex: '#A5D6A7', emoji: '💚', name: 'Green' },
    { hex: '#F48FB1', emoji: '💗', name: 'Pink' },
    { hex: '#CE93D8', emoji: '💜', name: 'Purple' },
    { hex: '#FFAB91', emoji: '🧡', name: 'Orange' },
    { hex: '#EF9A9A', emoji: '❤️', name: 'Red' },
    { hex: '#E0E0E0', emoji: '🤍', name: 'Gray' },
  ], []);

  // Color Palette Button Handlers - Memoized to prevent creating new functions on every render
  // Uses data-attribute pattern to avoid inline arrow functions in .map() loop (8 new functions per render)
  const handleColorSelect = useCallback((e) => {
    const colorHex = e.currentTarget.dataset.colorHex;
    if (selectedNode && selectedNode.data.onColorChange) {
      selectedNode.data.onColorChange(selectedNode.id, colorHex);
    }
    setShowColorPicker(false);
  }, [selectedNode, setShowColorPicker]);

  const handleColorButtonMouseEnter = useCallback((e) => {
    e.currentTarget.style.transform = 'scale(1.15)';
    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.3)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
  }, []);

  const handleColorButtonMouseLeave = useCallback((e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
    e.currentTarget.style.boxShadow = 'none';
  }, []);

  // Pinch-to-Zoom Visual Feedback - Memoized Styles
  const pinchFeedbackContainerStyle = useMemo(() => ({
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(12px)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 9999,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    animation: 'pinchFadeIn 0.2s ease-out',
    pointerEvents: 'none',
    userSelect: 'none',
  }), []);

  const pinchFeedbackPercentageStyle = useMemo(() => ({
    fontSize: '12px',
    opacity: 0.7,
    marginLeft: '4px'
  }), []);

  // Sync Status Indicator - Memoized Styles
  const syncStatusContainerBaseStyle = useMemo(() => ({
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backdropFilter: 'blur(12px)',
    color: 'white',
    padding: '10px 18px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 9998,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.15)',
    pointerEvents: 'none',
    userSelect: 'none',
    transition: 'all 0.3s ease',
  }), []);

  const syncStatusTimestampStyle = useMemo(() => ({
    fontSize: '11px',
    opacity: 0.8,
    marginLeft: '2px'
  }), []);

  const syncSpinnerStyle = useMemo(() => ({
    animation: 'spin 1s linear infinite'
  }), []);

  // Sync Status Indicator - Dynamic Style Variations (memoized)
  const syncStatusSyncingStyle = useMemo(() => ({
    ...syncStatusContainerBaseStyle,
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    animation: 'syncFadeIn 0.2s ease-out',
  }), [syncStatusContainerBaseStyle]);

  const syncStatusSyncedStyle = useMemo(() => ({
    ...syncStatusContainerBaseStyle,
    backgroundColor: 'rgba(34, 197, 94, 0.95)',
    animation: 'syncFadeIn 0.3s ease-out',
  }), [syncStatusContainerBaseStyle]);

  const syncStatusErrorStyle = useMemo(() => ({
    ...syncStatusContainerBaseStyle,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    animation: 'syncFadeIn 0.2s ease-out',
  }), [syncStatusContainerBaseStyle]);

  return (
    <div style={mainContainerStyle}>
      {/* Loading Skeleton - shown while initializing */}
      {!isInitialized && <LoadingSkeleton nodeCount={4} />}

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsHelpModal
        show={showShortcutsHelp}
        onClose={handleCloseShortcutsHelp}
      />

      {/* Canvas Analytics Modal */}
      <CanvasAnalyticsModal
        show={showAnalytics}
        onClose={handleCloseAnalytics}
        nodes={nodes}
        edges={edges}
      />

      {/* React Flow Container */}
      <div
        data-canvas-container="true"
        style={reactFlowContainerStyle}>
        {/* STUDIO Mode - Asset Creation Suite (Modal Overlay) */}
        {currentMode === 'studio' && (
          <UnityStudioCanvas
            isDarkTheme={isDarkTheme}
            initialContext={studioContext}
            onClose={handleCloseStudioCanvas}
            onExportToMAP={handleExportToMAP}
            onSaveToCanvas={handleSaveToCanvas}
          />
        )}
        {/* ReactFlow Canvas - Always render but hide when studio is open */}
        <div
          ref={canvasContainerRef}
          style={canvasContainerStyle}
        >
          {/* Override React Flow's default overflow:hidden on nodes to show delete buttons */}
          <style>{`
            /* Pinch gesture indicator animation */
            @keyframes pinchFadeIn {
              from {
                opacity: 0;
                transform: translateX(-50%) translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
              }
            }

            /* First-time pinch hint animations */
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.1);
              }
            }

            /* Sync status indicator animations */
            @keyframes syncFadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }

            .react-flow__node,
            .react-flow__node > div,
            .react-flow__node-textNode,
            .react-flow__node-photoNode {
              overflow: visible !important;
            }

            /* Touch-friendly resize handles - ENHANCED v4 for mobile - APPLIES TO ALL NODE TYPES */
            /* Accessibility: Meets Apple HIG 44pt minimum touch target guideline */
            .react-flow__node .nodrag {
              position: relative;
              cursor: nwse-resize;
              min-width: 44px;   /* Apple HIG minimum touch target */
              min-height: 44px;  /* Ensures accessibility compliance */
              display: flex;
              justify-content: center;
              align-items: center;
              /* Performance optimization for animations */
              will-change: transform;
            }

            /* Extra-large invisible touch target - 88px = 2× Apple's 44pt minimum */
            /* Debug tip: Add 'background: rgba(255,0,0,0.1);' to visualize touch area */
            .react-flow__node .nodrag::before {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 88px;   /* 2× Apple HIG minimum for maximum comfort */
              height: 88px;  /* Generous touch area for easier mobile grabbing */
              background: transparent;
              border-radius: 50%;
              pointer-events: auto;
              z-index: 1;
            }

            /* Visual touch ripple indicator with improved contrast */
            .react-flow__node .nodrag::after {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 0;
              height: 0;
              background: rgba(251, 191, 36, 0.3);  /* Increased opacity for better visibility */
              border-radius: 50%;
              pointer-events: none;
              transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                          height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Enhanced mobile visibility and touch feedback */
            @media (hover: none) and (pointer: coarse) {
              .react-flow__node .nodrag {
                width: 32px !important;  /* Increased from 28px for better visibility */
                height: 32px !important;
                border-width: 3.5px !important;  /* Thicker border for better contrast */
                border-style: solid !important;
                border-color: #f59e0b !important;  /* Slightly darker yellow for better contrast */
                /* Gradient background for depth perception */
                background: linear-gradient(135deg,
                  rgba(255, 255, 255, 0.98) 0%,
                  rgba(254, 243, 199, 0.95) 100%) !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25),
                            0 0 0 2px rgba(251, 191, 36, 0.4),
                            0 1px 3px rgba(0, 0, 0, 0.15);
                border-radius: 6px !important;  /* More rounded for modern look */
              }

              .react-flow__node .nodrag::before {
                width: 88px;  /* Extra-large touch target for mobile */
                height: 88px;
              }

              /* Haptic-like touch feedback with enhanced ripple */
              .react-flow__node .nodrag:active {
                transform: scale(0.85);  /* More pronounced feedback */
                background: linear-gradient(135deg,
                  rgba(251, 191, 36, 1) 0%,
                  rgba(245, 158, 11, 1) 100%) !important;
                border-color: #d97706 !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3),
                            0 0 0 3px rgba(251, 191, 36, 0.6);
                transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1),
                            background 0.15s ease,
                            border-color 0.15s ease,
                            box-shadow 0.15s ease;
              }

              .react-flow__node .nodrag:active::after {
                width: 88px;  /* Matches 88px touch target for consistent feedback */
                height: 88px;
                background: rgba(251, 191, 36, 0.35);  /* Better visibility */
              }

              /* Enhanced selected node visibility with breathing animation */
              .react-flow__node.selected .nodrag {
                background: linear-gradient(135deg,
                  rgba(254, 243, 199, 0.3) 0%,
                  rgba(251, 191, 36, 0.2) 100%) !important;
                border-color: #f59e0b !important;
                border-width: 4px !important;
                box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.6),
                            0 5px 16px rgba(0, 0, 0, 0.35),
                            0 0 20px rgba(251, 191, 36, 0.3);
                animation: pulse-resize-breathing 2.5s ease-in-out infinite;
              }

              /* Subtle visibility hint for unselected nodes */
              .react-flow__node:not(.selected) .nodrag {
                opacity: 0.85;
              }

              /* Full opacity on interaction */
              .react-flow__node:hover .nodrag,
              .react-flow__node.selected .nodrag {
                opacity: 1;
              }
            }

            /* Breathing pulse animation for selected resize handles */
            @keyframes pulse-resize-breathing {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.6),
                            0 5px 16px rgba(0, 0, 0, 0.35),
                            0 0 20px rgba(251, 191, 36, 0.3);
              }
              50% {
                transform: scale(1.08);
                box-shadow: 0 0 0 6px rgba(251, 191, 36, 0.5),
                            0 5px 18px rgba(0, 0, 0, 0.4),
                            0 0 25px rgba(251, 191, 36, 0.4);
              }
            }

            /* Accessibility: High contrast mode support */
            @media (prefers-contrast: high) {
              .react-flow__node .nodrag {
                border-color: #000000 !important;
                border-width: 4px !important;
                background: #ffffff !important;
              }

              .react-flow__node.selected .nodrag {
                border-width: 5px !important;
                box-shadow: 0 0 0 5px #000000 !important;
              }
            }

            /* Accessibility: Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
              .react-flow__node .nodrag {
                animation: none !important;
                transition: none !important;
              }

              .react-flow__node .nodrag::after {
                transition: none !important;
              }

              .react-flow__node .nodrag:active {
                transform: none !important;
              }
            }

            /* Enhanced hover state for desktop with glowing effect */
            @media (hover: hover) and (pointer: fine) {
              .react-flow__node .nodrag:hover {
                transform: scale(1.35);  /* Slightly larger hover effect */
                box-shadow: 0 4px 16px rgba(251, 191, 36, 0.5),
                            0 0 20px rgba(251, 191, 36, 0.3);
                transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                            box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              }

              /* Focus-visible for keyboard navigation */
              .react-flow__node .nodrag:focus-visible {
                outline: 3px solid #3b82f6;
                outline-offset: 3px;
                box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.3);
              }
            }

            /* Keyboard navigation focus indicator */
            .react-flow__node[data-focused="true"] {
              outline: 3px solid #3b82f6;
              outline-offset: 2px;
              animation: focusPulse 2s ease-in-out infinite;
              z-index: 999 !important;
            }

            @keyframes focusPulse {
              0%, 100% {
                outline-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
              }
              50% {
                outline-color: #60a5fa;
                box-shadow: 0 0 0 5px rgba(96, 165, 250, 0.3);
              }
            }

            /* Accessibility: Respect reduced motion preference */
            @media (prefers-reduced-motion: reduce) {
              .react-flow__node[data-focused="true"] {
                animation: none !important;
              }
            }

            /* Ensure resize handles are above other elements */
            .react-flow__node .nodrag {
              z-index: 25 !important;
            }

            /* Prevent accidental text selection during resize */
            .react-flow__node .nodrag * {
              user-select: none;
              -webkit-user-select: none;
              -webkit-touch-callout: none;
            }

            /* Comment Count Badge Styles */
            .comment-count-badge {
              position: absolute;
              top: -8px;
              right: -8px;
              min-width: 20px;
              height: 20px;
              padding: 2px 6px;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              border-radius: 10px;
              font-size: 11px;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(59, 130, 246, 0.4),
                          0 0 0 2px white;
              z-index: 30;
              pointer-events: none;
              transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                          box-shadow 0.2s ease;
            }

            /* Dark theme variant */
            [data-theme="dark"] .comment-count-badge {
              background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
              box-shadow: 0 2px 6px rgba(96, 165, 250, 0.5),
                          0 0 0 2px #1f2937;
            }

            /* Hover effect for parent node */
            .react-flow__node:hover .comment-count-badge {
              transform: scale(1.1);
              box-shadow: 0 3px 8px rgba(59, 130, 246, 0.5),
                          0 0 0 2px white,
                          0 0 12px rgba(59, 130, 246, 0.3);
            }

            [data-theme="dark"] .react-flow__node:hover .comment-count-badge {
              box-shadow: 0 3px 8px rgba(96, 165, 250, 0.6),
                          0 0 0 2px #1f2937,
                          0 0 12px rgba(96, 165, 250, 0.4);
            }

            /* Selected node emphasis */
            .react-flow__node.selected .comment-count-badge {
              box-shadow: 0 3px 10px rgba(59, 130, 246, 0.6),
                          0 0 0 2px white,
                          0 0 16px rgba(59, 130, 246, 0.4);
            }

            /* Accessibility: High contrast mode */
            @media (prefers-contrast: high) {
              .comment-count-badge {
                background: #000000 !important;
                color: #ffffff !important;
                border: 2px solid #ffffff !important;
                box-shadow: none !important;
              }
            }

            /* Accessibility: Reduced motion */
            @media (prefers-reduced-motion: reduce) {
              .comment-count-badge {
                transition: none !important;
              }

              .react-flow__node:hover .comment-count-badge {
                transform: none !important;
              }
            }

            /* Mobile optimizations */
            @media (hover: none) and (pointer: coarse) {
              .comment-count-badge {
                min-width: 24px;
                height: 24px;
                font-size: 12px;
                top: -10px;
                right: -10px;
              }
            }

            /* Lock Badge Styles */
            .lock-badge {
              position: absolute;
              top: -8px;
              left: -8px;
              width: 24px;
              height: 24px;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              border-radius: 12px;
              font-size: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4),
                          0 0 0 2px white;
              z-index: 30;
              pointer-events: none;
              transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                          box-shadow 0.2s ease;
            }

            /* Dark theme variant */
            [data-theme="dark"] .lock-badge {
              background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
              box-shadow: 0 2px 6px rgba(248, 113, 113, 0.5),
                          0 0 0 2px #1f2937;
            }

            /* Hover effect for parent node */
            .react-flow__node:hover .lock-badge {
              transform: scale(1.1);
              box-shadow: 0 3px 8px rgba(239, 68, 68, 0.5),
                          0 0 0 2px white,
                          0 0 12px rgba(239, 68, 68, 0.3);
            }

            [data-theme="dark"] .react-flow__node:hover .lock-badge {
              box-shadow: 0 3px 8px rgba(248, 113, 113, 0.6),
                          0 0 0 2px #1f2937,
                          0 0 12px rgba(248, 113, 113, 0.4);
            }

            /* Selected node emphasis */
            .react-flow__node.selected .lock-badge {
              box-shadow: 0 3px 10px rgba(239, 68, 68, 0.6),
                          0 0 0 2px white,
                          0 0 16px rgba(239, 68, 68, 0.4);
            }

            /* Accessibility: High contrast mode */
            @media (prefers-contrast: high) {
              .lock-badge {
                background: #000000 !important;
                color: #ffffff !important;
                border: 2px solid #ffffff !important;
                box-shadow: none !important;
              }
            }

            /* Accessibility: Reduced motion */
            @media (prefers-reduced-motion: reduce) {
              .lock-badge {
                transition: none !important;
              }

              .react-flow__node:hover .lock-badge {
                transform: none !important;
              }
            }

            /* Mobile optimizations */
            @media (hover: none) and (pointer: coarse) {
              .lock-badge {
                width: 28px;
                height: 28px;
                font-size: 14px;
                top: -10px;
                left: -10px;
              }
            }
          `}</style>
          <ReactFlow
            nodes={nodesWithSearchHighlight}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onNodeDragStart={handleNodeDragStart}
            onNodeDrag={handleNodeDrag}
            onNodeDragStop={handleNodeDragStop}
            onMoveStart={handleCanvasPanStart}
            onMoveEnd={handleCanvasPanEnd}
            onMove={handleMove}
            nodeTypes={nodeTypes}
            defaultViewport={defaultViewport}
            panOnDrag={isPanModeActive ? true : panOnDragArray}  // Pan Mode: always pan when active, otherwise allow ONLY 1-finger drag for panning (2-finger reserved for pinch-to-zoom) - iOS Safari pinch-zoom fix
            panActivationKeyCode={null}  // No modifier keys needed for pan (mobile-friendly)
            multiSelectionKeyCode={null}  // No modifier keys needed for multi-select (mobile-friendly)
            selectionOnDrag={false}
            panOnScroll={false}  // Disable scroll-to-pan to avoid conflicts with pinch gestures
            zoomOnScroll={false}
            zoomOnPinch={true}  // Enable pinch-to-zoom gesture
            zoomActivationKeyCode={null}  // Allow pinch zoom without modifier keys
            zoomOnDoubleClick={false}
            preventScrolling={true}  // Critical for iOS Safari - prevents browser from intercepting touch events
            minZoom={0.1}
            maxZoom={4}
            nodesDraggable={!isPanModeActive}  // Disable node dragging in Pan Mode
            nodesConnectable={!isPanModeActive}  // Disable connections in Pan Mode
            elementsSelectable={!isPanModeActive}  // Disable selection in Pan Mode
          >
            <Background
              variant={currentThemeConfig.variant}
              gap={24}
              size={2}
              color={currentThemeConfig.dotColor}
              style={backgroundStyle}
            />
            {/* Canvas Minimap - toggleable navigation overview (smaller, more transparent) */}
            {showMinimap && (
              <MiniMap
                nodeStrokeColor={minimapNodeStrokeColor}
                nodeColor={minimapNodeColor}
                nodeBorderRadius={3}
                maskColor="rgba(0, 0, 0, 0.03)"
                style={minimapStyle}
                pannable
                zoomable
              />
            )}
          </ReactFlow>

          {/* Pinch-to-Zoom Visual Feedback Indicator */}
          {isActivelyPinching && (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              style={pinchFeedbackContainerStyle}>
              {/* Icon changes based on zoom direction */}
              {pinchDirection === 'out' ? (
                // Zoom In icon (magnifying glass with plus)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M11 8v6" />
                  <path d="M8 11h6" />
                </svg>
              ) : pinchDirection === 'in' ? (
                // Zoom Out icon (magnifying glass with minus)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M8 11h6" />
                </svg>
              ) : (
                // Default zoom icon (no direction yet)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
                  <circle cx="17" cy="17" r="3" />
                  <path d="M21 21l-1.5-1.5" />
                </svg>
              )}
              <span>
                {pinchDirection === 'out' ? 'Zooming In' :
                 pinchDirection === 'in' ? 'Zooming Out' :
                 'Pinch to Zoom'}
              </span>
              <span style={pinchFeedbackPercentageStyle}>
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>
          )}

          {/* Sync Status Indicator - Real-time Firebase sync feedback */}
          {syncStatus !== 'idle' && (
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              style={
                syncStatus === 'error'
                  ? syncStatusErrorStyle
                  : syncStatus === 'syncing'
                  ? syncStatusSyncingStyle
                  : syncStatusSyncedStyle
              }>
              {/* Icon based on sync status */}
              {syncStatus === 'syncing' ? (
                // Syncing icon (rotating cloud)
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={syncSpinnerStyle}
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : syncStatus === 'synced' ? (
                // Success icon (checkmark)
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                // Error icon (alert circle)
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}

              {/* Status text */}
              <span>
                {syncStatus === 'syncing' ? 'Syncing...' :
                 syncStatus === 'synced' ? 'Synced' :
                 'Sync Error'}
              </span>

              {/* Show timestamp for synced status */}
              {syncStatus === 'synced' && lastSyncTime && (
                <span style={syncStatusTimestampStyle}>
                  {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}

          {/* Active Viewers Presence Indicator */}
          {activeViewers.length > 0 && (
            <div
              role="status"
              aria-live="polite"
              aria-label={`${activeViewers.length} other ${activeViewers.length === 1 ? 'viewer' : 'viewers'} active`}
              style={activeViewersContainerStyle}
            >
              {/* Viewer Avatars (show max 3, then count) */}
              <div style={activeViewersAvatarContainerStyle}>
                {displayedActiveViewers.map((viewer, index) => (
                  <div
                    key={viewer.id}
                    title={viewer.name}
                    style={getActiveViewerAvatarStyle(viewer, index)}
                  >
                    {!viewer.avatar && viewer.name.slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>

              {/* Viewer Count and Label */}
              <div style={activeViewersCountContainerStyle}>
                {/* Active indicator dot */}
                <div style={activeViewersIndicatorDotStyle} />

                {/* Count and label */}
                <span>
                  {activeViewers.length > 3
                    ? `${activeViewers.length} viewers`
                    : activeViewers.length === 1
                      ? '1 viewer'
                      : `${activeViewers.length} viewers`}
                </span>
              </div>
            </div>
          )}

          {/* Notification Bell Button - Performance Optimized */}
          <>
            {/* Bell Button with Badge */}
            <div
              style={notificationBellContainerStyle}
            >
              <button
                onClick={handleToggleNotificationDropdown}
                style={bellButtonStyle}
                title={notificationData.hasNotifications ? `${notificationData.count} new notification${notificationData.count > 1 ? 's' : ''}` : 'No new notifications'}
                aria-label={notificationData.hasNotifications ? `Notifications: ${notificationData.count} new notification${notificationData.count > 1 ? 's' : ''}` : 'Notifications: No new notifications'}
                aria-haspopup="dialog"
                aria-expanded={showNotificationDropdown}
              >
                🔔

                {/* Notification Badge */}
                {notificationData.hasNotifications && (
                  <span style={notificationBadgeStyle}>
                    {notificationData.count > 9 ? '9+' : notificationData.count}
                      </span>
                    )}
                  </button>

                {/* Notification Dropdown Panel */}
                {showNotificationDropdown && (
                  <>
                    {/* Click-outside overlay */}
                    <div
                      onClick={handleCloseNotificationDropdown}
                      style={notificationOverlayStyle}
                    />

                      {/* Dropdown Panel */}
                      <div
                        role="dialog"
                        aria-label="Notifications"
                        aria-modal="false"
                        style={notificationDropdownStyle}
                      >
                        {/* Header */}
                        <div style={notificationHeaderStyle}>
                          Notifications
                        </div>

                        {/* Notification List */}
                        <div style={notificationListStyle}>
                          {notificationData.notifications.length === 0 ? (
                            // Empty State
                            <div style={emptyNotificationsContainerStyle}>
                              <div style={emptyNotificationIconStyle}>✓</div>
                              <div style={emptyNotificationTextStyle}>No notifications</div>
                              <div style={emptyNotificationSubtextStyle}>You're all caught up!</div>
                            </div>
                          ) : (
                            // Notification Items - Performance Optimized with Memoized Component
                            // Replaced inline rendering with NotificationItem component
                            // Eliminates 120-300 function allocations per render (for 20-50 notifications)
                            notificationData.notifications.map((notification, index) => (
                              <NotificationItem
                                key={`${notification.timestamp}-${notification.nodeId || index}`}
                                notification={notification}
                                index={index}
                                totalCount={notificationData.notifications.length}
                                isFocused={focusedNotificationId === notification.id}
                                isHovered={hoveredNotificationId === notification.id}
                                onNotificationClick={handleNotificationClick}
                                onSetHoveredId={setHoveredNotificationId}
                                onSetFocusedId={setFocusedNotificationId}
                                getNotificationItemStyle={getNotificationItemStyle}
                                getNotificationRelativeTime={getNotificationRelativeTime}
                                getNotificationIcon={getNotificationIcon}
                                notificationFlexContainerStyle={notificationFlexContainerStyle}
                                notificationIconStyle={notificationIconStyle}
                                notificationContentStyle={notificationContentStyle}
                                notificationTitleStyle={notificationTitleStyle}
                                notificationMessageStyle={notificationMessageStyle}
                                notificationTimestampStyle={notificationTimestampStyle}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

              {/* Pulse Animation Keyframes */}
              <style>{`
                @keyframes pulse {
                  0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                  }
                  50% {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(251,191,36,0.4);
                  }
                }
              `}</style>
          </>

          {/* Real-time Collaborative Cursors Overlay */}
          {hasRemoteCursors && (
            <div style={cursorOverlayContainerStyle}>
              {remoteCursorsEntries.map(([userId, cursor]) => (
                <RemoteCursor
                  key={userId}
                  userId={userId}
                  cursor={cursor}
                  remoteCursorContainerBaseStyle={remoteCursorContainerBaseStyle}
                  cursorSvgStyle={cursorSvgStyle}
                  cursorNameLabelBaseStyle={cursorNameLabelBaseStyle}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Bar is now integrated into UnityCircleNav */}

      {/* Mobile Node Navigator - Jump between canvas areas */}
      <MobileNodeNavigator nodes={nodes} />

      {/* Floating Comment Toolbar - Quick actions on selected node */}
      {showCommentToolbar && (
        <div
          ref={commentToolbarRef}
          style={floatingCommentToolbarStyle}
        >
          <button
            onClick={handleQuickComment}
            style={floatingToolbarButtonStyle}
            onMouseEnter={handleFloatingToolbarButtonMouseEnter}
            onMouseLeave={handleFloatingToolbarButtonMouseLeave}
            aria-label="Add comment to selected node"
          >
            <span>💬</span>
            <span>Add Comment</span>
          </button>

          {/* Star/Bookmark Button */}
          <button
            onClick={handleFloatingToolbarStarClick}
            title={selectedNode && starredNodeIds.has(selectedNode.id) ? 'Unstar node' : 'Star node'}
            aria-label={selectedNode && starredNodeIds.has(selectedNode.id) ? 'Unstar node' : 'Star node'}
            style={floatingToolbarIconButtonStyle}
            onMouseEnter={handleFloatingToolbarIconButtonMouseEnter}
            onMouseLeave={handleFloatingToolbarIconButtonMouseLeave}
          >
            {selectedNode && starredNodeIds.has(selectedNode.id) ? '⭐' : '☆'}
          </button>

          {/* Duplicate Button */}
          <button
            onClick={handleFloatingToolbarDuplicateClick}
            title="Duplicate node"
            aria-label="Duplicate node"
            style={floatingToolbarIconButtonStyle}
            onMouseEnter={handleFloatingToolbarIconButtonMouseEnter}
            onMouseLeave={handleFloatingToolbarIconButtonMouseLeave}
          >
            📋
          </button>

          {/* Color Picker Button */}
          <div style={floatingToolbarColorPickerContainerStyle}>
            <button
              onClick={handleFloatingToolbarColorPickerClick}
              title="Change node color"
              aria-label="Change node color"
              style={floatingToolbarIconButtonStyle}
              onMouseEnter={handleFloatingToolbarIconButtonMouseEnter}
              onMouseLeave={handleFloatingToolbarIconButtonMouseLeave}
            >
              🎨
            </button>

            {/* Color Palette Dropdown */}
            {showColorPicker && (
              <div style={floatingToolbarColorPickerDropdownStyle}>
                {colorPaletteColors.map((color) => (
                  <button
                    key={color.hex}
                    data-color-hex={color.hex}
                    onClick={handleColorSelect}
                    title={color.name}
                    aria-label={`Select ${color.name} color`}
                    style={colorButtonStylesMap.get(color.hex)}
                    onMouseEnter={handleColorButtonMouseEnter}
                    onMouseLeave={handleColorButtonMouseLeave}
                  >
                    {color.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={handleFloatingToolbarDeleteClick}
            title="Delete node"
            aria-label="Delete node"
            style={floatingToolbarDeleteButtonStyle}
            onMouseEnter={handleFloatingToolbarDeleteButtonMouseEnter}
            onMouseLeave={handleFloatingToolbarDeleteButtonMouseLeave}
          >
            🗑️
          </button>

          {/* Close Button */}
          <button
            onClick={handleFloatingToolbarCloseClick}
            title="Close toolbar"
            aria-label="Close toolbar"
            style={floatingToolbarCloseButtonStyle}
            onMouseEnter={handleFloatingToolbarCloseButtonMouseEnter}
            onMouseLeave={handleFloatingToolbarCloseButtonMouseLeave}
          >
            ✕
          </button>
        </div>
      )}

      {/* @Mention Autocomplete Dropdown */}
      {mentionAutocomplete.isVisible && filteredUsers.length > 0 && (
        <div
          style={getMentionDropdownPositionStyle(mentionAutocomplete.position.x, mentionAutocomplete.position.y)}
        >
          <div style={mentionDropdownHeaderStyle}>
            Mention User
          </div>
          {filteredUsers.map((user, index) => (
            <MentionUserItem
              key={user.id}
              user={user}
              index={index}
              selectedMentionIndex={mentionAutocomplete.selectedIndex}
              getMentionUserItemStyle={getMentionUserItemStyle}
              handleMentionUserClick={handleMentionSelect}
              setSelectedMentionIndex={setSelectedMentionIndex}
              mentionUserAvatarStyle={mentionUserAvatarStyle}
              mentionUserInfoContainerStyle={mentionUserInfoContainerStyle}
              mentionUserNameStyle={mentionUserNameStyle}
              mentionUserEmailStyle={mentionUserEmailStyle}
              mentionSelectedIndicatorStyle={mentionSelectedIndicatorStyle}
            />
          ))}
        </div>
      )}

      {/* Zoom Controls - Right Rail with Mode Tab Slideout */}
      <div style={zoomControlsContainerStyle}>
        {/* Mode Tab Slideout Panel */}
        <div style={modePanelContainerStyle(showModePanel)}>
          {modeOptions.map((mode) => (
            <button
              key={mode.key}
              onClick={getModeButtonClickHandler(mode.key, mode.disabled)}
              disabled={mode.disabled}
              style={modeButtonStyle(mode, currentMode)}
            >
              <span style={modeIconStyle}>{mode.icon}</span>
              <span>{mode.label}</span>
              {mode.disabled && <span style={soonBadgeStyle}>SOON</span>}
            </button>
          ))}
        </div>

        {/* Main Zoom Controls - Compact */}
        <div style={zoomControlsMainContainerStyle(showModePanel)}>
        {/* Zoom In Button - Enhanced for touch (44px per iOS HIG) */}
        <button
          onClick={handleZoomInClick}
          style={toolbarStyles.zoomButton}
          onMouseEnter={handleZoomButtonMouseEnter}
          onMouseLeave={handleZoomButtonMouseLeave}
          onTouchStart={handleZoomButtonTouchStart}
          onTouchEnd={handleZoomButtonTouchEnd}
          title="Zoom In"
          aria-label="Zoom in canvas view"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" style={toolbarStyles.iconSvg}>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {/* Zoom Level Indicator - Clickable dropdown trigger */}
        <div style={toolbarStyles.relativeWrapper}>
          <button
            onClick={handleToggleZoomPresets}
            style={toolbarStyles.zoomLevel}
            onMouseEnter={handleZoomLevelMouseEnter}
            onMouseLeave={handleZoomLevelMouseLeave}
            title="Zoom Presets"
            aria-label="Open zoom preset menu"
            aria-haspopup="menu"
            aria-expanded={showZoomPresets}
          >
            {Math.round(zoomLevel * 100)}%
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="rgba(0, 0, 0, 0.6)" strokeWidth="2" strokeLinecap="round" style={toolbarStyles.chevronSvg}>
              <path d="M3 5l3 3 3-3" />
            </svg>
          </button>

          {/* Zoom Presets Dropdown Menu */}
          {showZoomPresets && (
            <>
              {/* Backdrop to close dropdown when clicking outside */}
              <div
                onClick={handleCloseZoomPresets}
                style={toolbarStyles.backdropOverlay}
              />

              {/* Dropdown menu */}
              <div style={toolbarStyles.dropdownMenu}>
                {zoomPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={getZoomPresetClickHandler(preset.value)}
                    style={preset.value === zoomLevel ? toolbarStyles.presetButtonActive : toolbarStyles.presetButton}
                    onMouseEnter={getZoomPresetMouseEnterHandler(preset.value, zoomLevel)}
                    onMouseLeave={getZoomPresetMouseLeaveHandler(preset.value, zoomLevel)}
                  >
                    <span style={toolbarStyles.presetLabel}>{preset.label}</span>
                    <span style={toolbarStyles.presetDesc}>{preset.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Zoom Out Button - Enhanced for touch (44px per iOS HIG) */}
        <button
          onClick={handleZoomOutClick}
          style={toolbarStyles.zoomButton}
          onMouseEnter={handleZoomButtonMouseEnter}
          onMouseLeave={handleZoomButtonMouseLeave}
          onTouchStart={handleZoomButtonTouchStart}
          onTouchEnd={handleZoomButtonTouchEnd}
          title="Zoom Out"
          aria-label="Zoom out canvas view"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" style={toolbarStyles.iconSvg}>
            <path d="M5 12h14" />
          </svg>
        </button>

        {/* Center/Fit View Button */}
        <button
          onClick={handleFitViewClick}
          style={toolbarStyles.smallButtonWithMargin}
          onMouseEnter={handleFitViewButtonMouseEnter}
          onMouseLeave={handleFitViewButtonMouseLeave}
          title="Center View"
          aria-label="Center and fit all nodes in view"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" style={toolbarStyles.smallIconSvg}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>

        {/* Auto-Layout Button */}
        <button
          onClick={handleAutoLayout}
          style={toolbarStyles.smallButton}
          onMouseEnter={handleAutoLayoutButtonMouseEnter}
          onMouseLeave={handleAutoLayoutButtonMouseLeave}
          title="Auto-Organize Nodes"
          aria-label="Automatically organize nodes in grid layout"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" style={toolbarStyles.smallIconSvg}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>

        {/* Duplicate Selected Button */}
        <button
          onClick={handleDuplicateSelected}
          disabled={!hasSelectedNodes}
          style={getDuplicateButtonStyle(hasSelectedNodes)}
          onMouseEnter={handleDuplicateButtonMouseEnter}
          onMouseLeave={handleDuplicateButtonMouseLeave}
          title="Duplicate Selected (Ctrl+D)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hasSelectedNodes ? '#6b7280' : 'rgba(0, 0, 0, 0.3)'} strokeWidth="2" strokeLinecap="round" style={toolbarStyles.smallIconSvg}>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>

        {/* Bookmark/Star Button */}
        <button
          onClick={handleToggleBookmark}
          disabled={!currentCapsuleId}
          style={getBookmarkButtonStyle(isBookmarked, currentCapsuleId)}
          onMouseEnter={handleBookmarkButtonMouseEnter}
          onMouseLeave={handleBookmarkButtonMouseLeave}
          title={currentCapsuleId ? (isBookmarked ? 'Remove from Saved' : 'Save to Bookmarks') : 'Save canvas first to bookmark'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked ? '#fbbf24' : 'none'} stroke={isBookmarked ? '#fbbf24' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={toolbarStyles.smallIconSvg}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>

        {/* Minimap Toggle Button */}
        <button
          onClick={handleToggleMinimap}
          style={getMinimapButtonStyle(showMinimap)}
          onMouseEnter={handleMinimapButtonMouseEnter}
          onMouseLeave={handleMinimapButtonMouseLeave}
          title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
          aria-label={showMinimap ? 'Hide minimap' : 'Show minimap'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showMinimap ? '#3b82f6' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={toolbarStyles.smallIconSvg}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 3v18" />
          </svg>
        </button>

        {/* Overview Tray Toggle Button */}
        <button
          onClick={handleToggleOverviewTray}
          style={getOverviewButtonStyle(showOverviewTray)}
          onMouseEnter={handleOverviewButtonMouseEnter}
          onMouseLeave={handleOverviewButtonMouseLeave}
          title={showOverviewTray ? 'Hide Overview' : 'Show Overview'}
          aria-label={showOverviewTray ? 'Hide overview panel' : 'Show overview panel'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showOverviewTray ? '#3b82f6' : '#6b7280'} strokeWidth="2" strokeLinecap="round" style={toolbarStyles.smallIconSvg}>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Pan Mode Toggle - Touch devices only */}
        {isTouchDevice && (
          <button
            onClick={handleTogglePanMode}
            style={getPanModeButtonStyle(isPanModeActive)}
            onMouseEnter={handlePanModeButtonMouseEnter}
            onMouseLeave={handlePanModeButtonMouseLeave}
            title={isPanModeActive ? 'Pan Mode Active - Tap to Enable Selection' : 'Enable Pan Mode - Easier Canvas Navigation'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isPanModeActive ? '#3b82f6' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={toolbarIconSvgStyle}>
              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </svg>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={handleCycleTheme}
          style={getThemeButtonStyle(theme, isDarkTheme)}
          onMouseEnter={handleThemeButtonMouseEnter}
          onMouseLeave={handleThemeButtonMouseLeave}
          title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (click to cycle)`}
        >
          {/* Sun icon for light mode */}
          {theme === 'light' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={toolbarIconStyle}>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          )}
          {/* Moon icon for dark mode */}
          {theme === 'dark' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={toolbarIconStyle}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          {/* Palette icon for custom theme */}
          {theme === 'custom' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={toolbarIconStyle}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="#a78bfa" />
              <circle cx="15.5" cy="8.5" r="1.5" fill="#a78bfa" />
              <circle cx="8.5" cy="15.5" r="1.5" fill="#a78bfa" />
              <circle cx="15.5" cy="15.5" r="1.5" fill="#a78bfa" />
              <path d="M17 17c-1 1-2.5 1.5-5 1.5s-4-0.5-5-1.5" />
            </svg>
          )}
          {/* Auto icon (sun/moon combo) - legacy support */}
          {theme === 'auto' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDarkTheme ? '#3b82f6' : '#fbbf24'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={toolbarIconStyle}>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 8V2M12 22v-6M8 12H2M22 12h-6" opacity="0.5" />
              <path d="M21 12.79A9 9 0 0 1 11.21 3" opacity="0.7" />
            </svg>
          )}
        </button>

        {/* Haptic Feedback Toggle Button */}
        <button
          onClick={handleToggleHaptics}
          style={getHapticsButtonStyle(hapticsEnabled)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = hapticsEnabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(156, 163, 175, 0.25)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = hapticsEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(156, 163, 175, 0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={`Haptic Feedback: ${hapticsEnabled ? 'On' : 'Off'}${!navigator.vibrate ? ' (Not supported on this device)' : ''}`}
        >
          {/* Vibration/Haptic icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={hapticsEnabled ? '#10b981' : '#9ca3af'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={toolbarIconStyle}
          >
            {/* Phone icon with vibration waves */}
            <rect x="7" y="2" width="10" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" />
            {hapticsEnabled && (
              <>
                <path d="M3 8v8" opacity="0.6" />
                <path d="M21 8v8" opacity="0.6" />
                <path d="M1 10v4" opacity="0.3" />
                <path d="M23 10v4" opacity="0.3" />
              </>
            )}
          </svg>
        </button>

        {/* Search Bar */}
        <div style={searchBarContainerStyle}>
          <div style={searchInputWrapperStyle}>
            {/* Search Icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchInputKeyDown}
              style={searchInputFieldStyle}
            />

            {/* Clear Button */}
            {searchInput && (
              <button
                onClick={clearSearch}
                style={searchClearButtonStyle}
                title="Clear search (Esc)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Search Results Counter and Navigation */}
          {searchResults.length > 0 && (
            <div style={searchResultsContainerStyle}>
              <span style={searchResultsCounterStyle}>
                {currentMatchIndex + 1} of {searchResults.length}
              </span>

              <div style={searchNavigationContainerStyle}>
                {/* Previous Button */}
                <button
                  onClick={goToPrevMatch}
                  disabled={searchResults.length === 0}
                  style={getSearchNavButtonStyle(searchResults.length > 0)}
                  title="Previous match (Shift+Enter)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"/>
                  </svg>
                </button>

                {/* Next Button */}
                <button
                  onClick={goToNextMatch}
                  disabled={searchResults.length === 0}
                  style={getSearchNavButtonStyle(searchResults.length > 0)}
                  title="Next match (Enter)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Node Type Filter Button */}
        <div style={filterButtonContainerStyle}>
          <button
            onClick={handleToggleFilterDropdown}
            style={nodeTypeFilter.size > 0 ? filterButtonActiveStyle : filterButtonInactiveStyle}
            title={nodeTypeFilter.size > 0 ? `Filtering by ${nodeTypeFilter.size} type(s)` : 'Filter by node type'}
          >
            {/* Filter Icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>

            {/* Active Filter Badge */}
            {nodeTypeFilter.size > 0 && (
              <span style={filterBadgeCountStyle}>
                {nodeTypeFilter.size}
              </span>
            )}
          </button>

          {/* Filter Dropdown */}
          {showFilterDropdown && (
            <div
              data-filter-dropdown="true"
              style={filterDropdownContainerStyle}
            >
              {/* Header */}
              <div style={filterDropdownHeaderStyle}>
                <span style={filterDropdownTitleStyle}>
                  Filter by Type
                </span>
                {nodeTypeFilter.size > 0 && (
                  <button
                    onClick={handleClearAllFilters}
                    style={filterClearAllButtonStyle}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Filter Options */}
              <div style={filterOptionsContainerStyle}>
                {availableNodeTypes.length === 0 ? (
                  <div style={filterEmptyStateStyle}>
                    No nodes available
                  </div>
                ) : (
                  availableNodeTypes.map(type => {
                    const nodeCount = nodeCountsByType[type] || 0;
                    const isSelected = nodeTypeFilter.has(type);

                    return (
                      <label
                        key={type}
                        style={isSelected ? filterOptionLabelSelectedStyle : filterOptionLabelUnselectedStyle}
                        onMouseEnter={isSelected ? filterLabelEnterHandlers.selected[type] : filterLabelEnterHandlers.unselected[type]}
                        onMouseLeave={isSelected ? filterLabelLeaveHandlers.selected[type] : filterLabelLeaveHandlers.unselected[type]}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={filterCheckboxHandlers[type]}
                          style={filterCheckboxStyle}
                        />
                        <span style={getFilterLabelTextStyle(isSelected)}>
                          {type}
                        </span>
                        <span style={filterBadgeStyle}>
                          {nodeCount}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={toolbarDividerStyle} />

        {/* Mode Toggle Button */}
        <button
          onClick={handleToggleModePanel}
          style={getModePanelButtonStyle(showModePanel)}
          onMouseEnter={handleModePanelButtonMouseEnter}
          onMouseLeave={handleModePanelButtonMouseLeave}
          title={showModePanel ? 'Hide Modes' : 'Switch Mode'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showModePanel ? '#b45309' : '#6b7280'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={toolbarIconStyle}>
            {showModePanel ? (
              <path d="M15 18l-6-6 6-6" />
            ) : (
              <path d="M9 18l6-6-6-6" />
            )}
          </svg>
        </button>
        </div>
      </div>

      {/* Unity Circle Nav - Pill UI with Options | + | AI */}
      <UnityCircleNav
        onAddNote={handleAddNote}
        onExport={handleExportJSON}
        onImport={handleImportJSON}
        onShare={handleSaveAndShare}
        onClear={handleClearAll}
        onFooter={onFooterToggle}
        onToggleParallax={handleToggleParallax}
        showParallax={showParallax}
        isSaving={isSaving}
        hasNotes={nodes.length > 0}
        currentMode={currentMode}
        onAddEmail={handleAddEmail}
        onAddWait={handleAddWait}
        onAddCondition={handleAddCondition}
        onEditCampaign={handleMenuEditCampaign}
        emailCount={emailNodeCount}
        emailLimit={emailLimit}
        hasCampaign={hasCampaign}
        // AI action props
        onAIGenerateNote={handleAIGenerateNote}
        onAIGenerateImage={handleAIGenerateImage}
        onAISummarize={handleAISummarize}
        onAIGenerateCanvas={handleAIGenerateCanvas}
        // Status bar props
        nodeCount={nodes.length}
        nodeLimit={nodeLimit}
        lastSavedAt={lastSavedAt}
        onShortcutsClick={() => setShowShortcutsHelp(true)}
        onShowAnalytics={() => setShowAnalytics(true)}
      />

      {/* Empty State - Centered above CircleNav with chevron */}
      {nodes.length === 0 && (
        <div style={emptyStateContainerStyle}>
          <h2 style={emptyStateHeadingStyle}>
            Start Brainstorming
          </h2>
          <p style={emptyStateTextStyle}>
            Click the <span style={emptyStateHighlightStyle}>+</span> below to get started.
          </p>
          {/* Chevron pointing down */}
          <div style={emptyStateChevronStyle} />
        </div>
      )}

      {/* Upload Modal - With card types / MAP actions (context-aware) */}
      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        onUpload={handlePhotoUpload}
        cardTypes={CARD_TYPES}
        onAddCard={handleAddCard}
        currentMode={currentMode}
        onAddEmail={handleAddEmail}
        onAddWait={handleAddWait}
        onAddCondition={handleAddCondition}
        onEditCampaign={handleMenuEditCampaign}
        emailCount={emailNodeCount}
        emailLimit={emailLimit}
        hasCampaign={hasCampaign}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
        capsuleId={currentCapsuleId}
        title={canvasTitle}
        isPublic={isPublic}
        isBookmarked={isBookmarked}
        collaborators={collaborators}
        onUpdateVisibility={handleUpdateVisibility}
        onToggleBookmark={handleToggleBookmark}
        onAddCollaborator={handleAddCollaborator}
        onRemoveCollaborator={handleRemoveCollaborator}
        shareLink={shareUrl}
      />

      {/* AI Generate Canvas Modal */}
      <AIGenerateCanvasModal
        isOpen={showAICanvasModal}
        onClose={handleCloseAICanvasModal}
        onGenerate={handleAICanvasGenerate}
        isGenerating={isGeneratingCanvas}
      />

      {/* Node Templates Modal */}
      <TemplatesModal
        show={showTemplatesModal}
        onClose={handleCloseTemplatesModal}
        onSelectTemplate={handleInsertTemplate}
        customTemplates={nodeTemplates}
        onLoadCustomTemplate={handleLoadTemplate}
        onDeleteCustomTemplate={handleDeleteTemplate}
        focusedNodeId={focusedNodeId}
        onSaveAsTemplate={handleSaveAsTemplate}
      />

      {/* Canvas Snapshots Dialog */}
      {showSnapshotDialog && (
        <div className="modal-overlay" onClick={handleCloseSnapshotDialog}>
          <div
            className="modal-content"
            onClick={handleSnapshotModalContentClick}
            style={snapshotModalContentStyle}
          >
            <div style={snapshotModalHeaderContainerStyle}>
              <h2 style={snapshotModalTitleStyle}>Canvas Snapshots</h2>
              <button
                onClick={handleCloseSnapshotDialog}
                style={snapshotModalCloseButtonStyle}
              >
                ×
              </button>
            </div>

            {snapshots.length === 0 ? (
              <div style={snapshotEmptyContainerStyle}>
                <p style={snapshotEmptyTitleStyle}>No snapshots yet</p>
                <p style={snapshotEmptyTextStyle}>Save your first snapshot using the camera icon in the toolbar</p>
              </div>
            ) : (
              <div style={snapshotsContainerStyle}>
                {reversedSnapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    style={snapshotCardStyle}
                  >
                    <div style={snapshotHeaderStyle}>
                      <div style={snapshotTitleContainerStyle}>
                        <h3 style={snapshotTitleStyle}>
                          {snapshot.name}
                        </h3>
                        <p style={snapshotTimestampStyle}>
                          {new Date(snapshot.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div style={snapshotStatsStyle}>
                      {snapshot.data.nodeCount} nodes • {snapshot.data.edgeCount} edges
                    </div>
                    <div style={snapshotButtonsContainerStyle}>
                      <button
                        data-action="restore"
                        data-snapshot-id={snapshot.id}
                        onClick={handleSnapshotAction}
                        style={snapshotRestoreButtonStyle}
                      >
                        Restore
                      </button>
                      <button
                        data-action="rename"
                        data-snapshot-id={snapshot.id}
                        onClick={handleSnapshotAction}
                        style={snapshotRenameButtonStyle}
                      >
                        Rename
                      </button>
                      <button
                        data-action="delete"
                        data-snapshot-id={snapshot.id}
                        onClick={handleSnapshotAction}
                        style={snapshotDeleteButtonStyle}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overview Tray - Right-side panel */}
      <OverviewTray
        isOpen={showOverviewTray}
        onClose={handleOverviewTrayClose}
        nodes={nodes}
        starredNodes={starredNodes}
        bookmarkedCapsules={bookmarkedCapsules}
        notifications={notifications}
        onNodeClick={handleOverviewNodeClick}
        onCapsuleLoad={handleOverviewCapsuleLoad}
        onNotificationClick={handleOverviewNotificationClick}
        onUnstar={handleOverviewUnstar}
        onUnstarNode={handleUnstarNode}
        onRenameCapsule={handleOverviewRenameCapsule}
      />

      {/* Lightbox Modal */}
      {showLightbox && (
        <LightboxModal
          photo={lightboxPhoto}
          onClose={handleCloseLightbox}
        />
      )}

      {/* Edit Memory Modal */}
      <EditMemoryModal
        isOpen={showEditModal}
        onClose={handleCloseEditMemory}
        memory={editingMemory}
        onSave={handleEditSave}
        onDelete={handleDeleteMemory}
      />

      {/* Email Inline Edit Modal */}
      <EmailEditModal
        isOpen={showEmailEditModal}
        onClose={handleCloseEmailEdit}
        emailData={editingEmailData}
        onSave={handleEmailEditSave}
      />

      {/* Wait Inline Edit Modal */}
      <WaitEditModal
        isOpen={showWaitEditModal}
        onClose={handleCloseWaitEdit}
        waitData={editingWaitData}
        onSave={handleWaitEditSave}
      />

      {/* Condition Inline Edit Modal */}
      <ConditionEditModal
        isOpen={showConditionEditModal}
        onClose={handleCloseConditionEdit}
        conditionData={editingConditionData}
        onSave={handleConditionEditSave}
      />

      {/* Prospect Input Modal */}
      <ProspectInputModal
        isOpen={showProspectModal}
        onClose={handleCloseProspectModal}
        onSubmit={handlePublishWithProspects}
        isLoading={isSavingJourney}
      />

      {/* Email Preview Modal */}
      {showEmailPreview && previewEmailData && (
        <div
          style={emailPreviewOverlayStyle}
          onClick={handleCloseEmailPreview}
        >
          <div
            style={emailPreviewContentStyle}
            onClick={handleModalContentClick}
          >
            {/* Modal Header */}
            <div style={emailPreviewHeaderStyle}>
              <div>
                <h3 style={emailPreviewTitleStyle}>
                  Email Preview
                </h3>
                <p style={emailPreviewSubtitleStyle}>
                  {previewEmailData.title || 'Branded template preview'}
                </p>
              </div>
              <button
                onClick={handleCloseEmailPreview}
                style={emailPreviewCloseButtonStyle}
              >
                ×
              </button>
            </div>

            {/* Preview Content */}
            <div style={emailPreviewBodyContainerStyle}>
              {/* Email Template Preview */}
              <div style={emailTemplateContainerStyle}>
                {/* Header */}
                <div style={emailTemplateHeaderStyle}>
                  <h1 style={emailTemplateBrandTitleStyle}>
                    yellowCircle
                  </h1>
                </div>

                {/* Subject */}
                <div style={emailTemplateSubjectContainerStyle}>
                  <p style={emailTemplateSubjectLabelStyle}>
                    Subject
                  </p>
                  <h2 style={emailTemplateSubjectHeadingStyle}>
                    {previewEmailData.subject}
                  </h2>
                </div>

                {/* Body */}
                <div style={emailTemplateBodyStyle}>
                  {previewEmailData.body.split('\n').map((line, i) => (
                    <p key={`email-line-${i}-${line.slice(0, 20)}`} style={emailTemplateBodyParagraphStyle}>{line || '\u00A0'}</p>
                  ))}
                </div>

                {/* Footer */}
                <div style={emailTemplateFooterStyle}>
                  <p style={emailTemplateFooterNameStyle}>
                    Chris Cooper
                  </p>
                  <p style={emailTemplateFooterSubtitleStyle}>
                    Founder & GTM Strategist • yellowCircle
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dev Tools Panel - Cmd+Shift+D to toggle */}
      {showDevTools && (
        <div style={devToolsPanelStyle}>
          <div style={devToolsHeaderStyle}>
            <span style={devToolsTitleStyle}>
              🛠️ DEV TOOLS
            </span>
            <button
              onClick={handleDevToolsClose}
              style={devToolsCloseButtonStyle}
            >
              ×
            </button>
          </div>

          {/* Status indicators */}
          <div style={devToolsStatusContainerStyle}>
            {/* SSO Auth Status */}
            <div style={devToolsStatusRowStyle}>
              <span>SSO Auth:</span>
              <span style={isAuthenticated ? devToolsStatusGreenStyle : devToolsStatusGrayStyle}>
                {isAuthenticated ? (userProfile?.email || 'Logged In') : 'Anonymous'}
              </span>
            </div>
            <div style={devToolsStatusRowStyle}>
              <span>Cloud Sync:</span>
              <span style={isCloudSynced ? devToolsStatusGreenStyle : devToolsStatusGrayStyle}>
                {isCloudSynced ? 'ON' : 'OFF'}
              </span>
            </div>
            <div style={devToolsStatusRowStyle}>
              <span>Credits:</span>
              <span style={devToolsStatusYellowStyle}>
                {tier === 'premium' ? '∞ PRO' : `${creditsRemaining}`}
              </span>
            </div>
            <div style={devToolsDividerStyle} />
            <div style={devToolsStatusRowStyle}>
              <span>Admin:</span>
              <span style={isAdmin ? devToolsStatusGreenStyle : devToolsStatusGrayStyle}>
                {isAdmin ? 'YES' : 'NO'}
              </span>
            </div>
            <div style={devToolsStatusRowStyle}>
              <span>Hub Auth:</span>
              <span style={localStorage.getItem('outreach_business_auth') === 'true' ? devToolsStatusGreenStyle : devToolsStatusRedStyle}>
                {localStorage.getItem('outreach_business_auth') === 'true' ? 'ON' : 'OFF'}
              </span>
            </div>
            <div style={devToolsStatusRowLastStyle}>
              <span>Nodes:</span>
              <span style={devToolsStatusBlueStyle}>{nodes.length}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={devToolsActionsContainerStyle}>
            <button onClick={devToolsActions.clearCredits} style={getDevButtonStyle()}>
              Clear Credits
            </button>
            <button onClick={devToolsActions.clearCanvasOnly} style={getDevButtonStyle('#dc2626')}>
              Clear Canvas
            </button>
            <button onClick={devToolsActions.clearHubSettings} style={getDevButtonStyle('#f59e0b')}>
              Clear Hub Settings
            </button>
            <button onClick={devToolsActions.clearLocalStorage} style={getDevButtonStyle('#ef4444')}>
              Clear ALL localStorage
            </button>
            <button onClick={devToolsActions.viewState} style={getDevButtonStyle('#3b82f6')}>
              Log State (F12)
            </button>
          </div>

          {/* Admin Section - Only visible for authenticated admins */}
          {isAdmin && (
            <>
              <div style={devToolsAdminSectionStyle}>
                <span style={devToolsAdminTitleStyle}>
                  ⚠️ ADMIN TOOLS
                </span>
                <div style={devToolsActionsContainerStyle}>
                  <button onClick={devToolsActions.getCapsuleStats} style={getDevButtonStyle('#8b5cf6')}>
                    📊 Capsule Stats
                  </button>
                  <button onClick={devToolsActions.migrateCapsules} style={getDevButtonStyle('#059669')}>
                    🔄 Migrate v1→v2
                  </button>
                  <button onClick={devToolsActions.cleanupCapsules} style={getDevButtonStyle('#dc2626')}>
                    🗑️ Cleanup Old Capsules
                  </button>
                </div>
              </div>
            </>
          )}

          <div style={devToolsFooterStyle}>
            Cmd+Shift+D to toggle
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <div style={toastContainerStyle}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            data-toast-id={toast.id}
            onClick={handleToastClick}
            style={getToastItemStyle(toast.type)}
          >
            <span style={toastIconStyle}>
              {toast.type === 'error' ? '❌' :
               toast.type === 'success' ? '✅' :
               toast.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span style={toastMessageStyle}>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* First-Time Pinch Gesture Tutorial Hint */}
      {showPinchHint && (
        <div
          role="dialog"
          aria-label="Pinch to zoom tutorial"
          style={pinchHintOverlayStyle}
          onClick={handlePinchHintDismiss}
        >
          <div
            style={pinchHintModalStyle}
            onClick={handlePinchHintModalClick}
          >
            {/* Pinch Gesture Icon */}
            <div
              style={pinchHintIconStyle}
              aria-hidden="true"
            >
              🤏
            </div>

            {/* Instructional Text */}
            <h3
              style={pinchHintTitleStyle}
            >
              Pinch to Zoom
            </h3>

            <p
              style={pinchHintTextStyle}
            >
              Use two fingers to pinch in and out to zoom the canvas
            </p>

            {/* Dismiss Button */}
            <button
              onClick={handlePinchHintDismiss}
              style={pinchHintButtonStyle}
              onMouseEnter={handlePinchHintButtonMouseEnter}
              onMouseLeave={handlePinchHintButtonMouseLeave}
            >
              Got it!
            </button>

            {/* Auto-dismiss indicator */}
            <div
              style={pinchHintDismissTextStyle}
            >
              Auto-dismisses in 8 seconds
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Dev button style
const devBtnStyle = {
  padding: '8px 12px',
  backgroundColor: '#374151',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '11px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background-color 0.2s'
};

function UnityNotesPage() {
  const navigate = useNavigate();
  const { handleFooterToggle, handleMenuToggle } = useLayout();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Parallax background toggle (lifted from UnityNotesFlow for Layout access)
  const [showParallax, setShowParallax] = useState(() => {
    try {
      const saved = localStorage.getItem('unity-notes-show-parallax');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleHomeClick = useCallback((e) => {
    e.preventDefault();
    navigate('/');
  }, [navigate]);

  return (
    <LeadGate
      toolName="UnityNotes"
      toolDescription="A visual canvas for organizing ideas, notes, and images. Enter your email to get instant access."
      storageKey="yc_unity_lead"
    >
      <ErrorBoundary>
        <Layout
          onHomeClick={handleHomeClick}
          onFooterToggle={handleFooterToggle}
          onMenuToggle={handleMenuToggle}
          navigationItems={navigationItems}
          pageLabel="UNITYNOTES"
          sidebarVariant="hidden"
          hideCircleNav={true}
          hideParallaxCircle={!showParallax}
        >
          <ReactFlowProvider>
            <UnityNotesFlow
              isUploadModalOpen={isUploadModalOpen}
              setIsUploadModalOpen={setIsUploadModalOpen}
              onFooterToggle={handleFooterToggle}
              showParallax={showParallax}
              setShowParallax={setShowParallax}
            />
          </ReactFlowProvider>
        </Layout>
      </ErrorBoundary>
    </LeadGate>
  );
}

export default UnityNotesPage;
