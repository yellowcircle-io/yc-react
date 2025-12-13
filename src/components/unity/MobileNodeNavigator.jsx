/**
 * Mobile Node Navigator
 * Compact navigation for UnityNotes on mobile devices
 *
 * Features:
 * - Shows node clusters as tappable indicators
 * - Quick jump to different areas of the canvas
 * - Current viewport indicator
 * - Auto-hides when not needed (< 3 nodes)
 * - Only shows on mobile by default
 *
 * UX Principles:
 * - Non-intrusive: small and positioned out of way
 * - Touch-friendly: large enough tap targets
 * - Informative: shows where you are and where you can go
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { UNITY, COLORS } from '../../styles/constants';

// Cluster nodes into groups based on proximity
const clusterNodes = (nodes, gridSize = 500) => {
  if (!nodes || nodes.length === 0) return [];

  const clusters = [];
  const assigned = new Set();

  nodes.forEach((node) => {
    if (assigned.has(node.id)) return;

    // Start a new cluster
    const cluster = {
      id: `cluster-${clusters.length}`,
      nodes: [node],
      center: { x: node.position.x, y: node.position.y },
      bounds: {
        minX: node.position.x,
        maxX: node.position.x + 200,
        minY: node.position.y,
        maxY: node.position.y + 100,
      },
    };
    assigned.add(node.id);

    // Find nearby nodes
    nodes.forEach((other) => {
      if (assigned.has(other.id)) return;

      const dx = Math.abs(other.position.x - cluster.center.x);
      const dy = Math.abs(other.position.y - cluster.center.y);

      if (dx < gridSize && dy < gridSize) {
        cluster.nodes.push(other);
        assigned.add(other.id);

        // Update bounds
        cluster.bounds.minX = Math.min(cluster.bounds.minX, other.position.x);
        cluster.bounds.maxX = Math.max(cluster.bounds.maxX, other.position.x + 200);
        cluster.bounds.minY = Math.min(cluster.bounds.minY, other.position.y);
        cluster.bounds.maxY = Math.max(cluster.bounds.maxY, other.position.y + 100);
      }
    });

    // Recalculate center based on all nodes in cluster
    const sumX = cluster.nodes.reduce((sum, n) => sum + n.position.x, 0);
    const sumY = cluster.nodes.reduce((sum, n) => sum + n.position.y, 0);
    cluster.center = {
      x: sumX / cluster.nodes.length,
      y: sumY / cluster.nodes.length,
    };

    clusters.push(cluster);
  });

  return clusters;
};

export default function MobileNodeNavigator({
  nodes = [],
  showOnDesktop = false,
  minNodesForDisplay = 3,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeCluster, setActiveCluster] = useState(null);
  const { fitBounds, getViewport } = useReactFlow();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < UNITY.breakpoints.mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cluster nodes
  const clusters = useMemo(() => clusterNodes(nodes), [nodes]);

  // Determine which cluster is currently in view
  useEffect(() => {
    const viewport = getViewport();
    const viewCenterX = -viewport.x / viewport.zoom + window.innerWidth / 2 / viewport.zoom;
    const viewCenterY = -viewport.y / viewport.zoom + window.innerHeight / 2 / viewport.zoom;

    let closestCluster = null;
    let minDistance = Infinity;

    clusters.forEach((cluster) => {
      const dx = cluster.center.x - viewCenterX;
      const dy = cluster.center.y - viewCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        closestCluster = cluster.id;
      }
    });

    setActiveCluster(closestCluster);
  }, [clusters, getViewport]);

  // Jump to cluster
  const jumpToCluster = useCallback((cluster) => {
    const padding = 50;
    fitBounds({
      x: cluster.bounds.minX - padding,
      y: cluster.bounds.minY - padding,
      width: cluster.bounds.maxX - cluster.bounds.minX + padding * 2,
      height: cluster.bounds.maxY - cluster.bounds.minY + padding * 2,
    }, { duration: 400, padding: 0.2 });
  }, [fitBounds]);

  // Don't show if not enough nodes or not on mobile (unless forced)
  if (nodes.length < minNodesForDisplay) return null;
  if (!isMobile && !showOnDesktop) return null;
  if (clusters.length <= 1) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '140px', // Above CircleNav
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'rgba(20, 20, 20, 0.9)',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Cluster indicators */}
      {clusters.map((cluster) => {
        const isActive = cluster.id === activeCluster;
        const nodeCount = cluster.nodes.length;

        return (
          <button
            key={cluster.id}
            onClick={() => jumpToCluster(cluster)}
            style={{
              width: isActive ? '32px' : '24px',
              height: isActive ? '32px' : '24px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isActive
                ? COLORS.yellow
                : 'rgba(255, 255, 255, 0.15)',
              color: isActive ? '#000' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '10px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              transform: isActive ? 'scale(1)' : 'scale(0.85)',
            }}
            title={`${nodeCount} note${nodeCount > 1 ? 's' : ''}`}
          >
            {nodeCount}
          </button>
        );
      })}

      {/* Total count label */}
      <div
        style={{
          marginLeft: '4px',
          paddingLeft: '8px',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.5)',
          fontFamily: 'monospace',
        }}
      >
        {nodes.length}
      </div>
    </div>
  );
}
