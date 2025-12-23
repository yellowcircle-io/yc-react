/**
 * Node Utilities for ReactFlow
 *
 * Provides helper functions for preparing and validating nodes
 * before rendering in ReactFlow to prevent common errors.
 */

/**
 * Prepare nodes for ReactFlow rendering by:
 * 1. Validating parentId references (remove invalid ones)
 * 2. Sorting so parent nodes come before children
 * 3. Ensuring all nodes have required properties
 *
 * This prevents the common error:
 * "TypeError: can't access property 'measured', node is undefined"
 * which occurs when child nodes reference non-existent parents.
 *
 * @param {Array} rawNodes - Raw nodes from Firestore or other source
 * @returns {Array} Processed nodes ready for ReactFlow
 */
export const prepareNodesForRendering = (rawNodes) => {
  if (!rawNodes || !Array.isArray(rawNodes)) return [];

  // Create a set of valid node IDs
  const validNodeIds = new Set(rawNodes.map(n => n.id));

  // Process nodes: validate parentId references and ensure required props
  const processedNodes = rawNodes.map(node => {
    const processed = { ...node };

    // Validate parentId - remove if parent doesn't exist
    if (processed.parentId && !validNodeIds.has(processed.parentId)) {
      console.warn(`⚠️ Node ${processed.id} has invalid parentId ${processed.parentId}, removing reference`);
      delete processed.parentId;
      delete processed.extent;
    }

    // Ensure position exists
    if (!processed.position) {
      processed.position = { x: 0, y: 0 };
    }

    // Ensure data object exists
    if (!processed.data) {
      processed.data = {};
    }

    return processed;
  });

  // Sort nodes: parents first, then children
  // This ensures ReactFlow can measure parent nodes before children reference them
  return processedNodes.sort((a, b) => {
    // Nodes without parentId (top-level) come first
    const aIsChild = !!a.parentId;
    const bIsChild = !!b.parentId;

    if (aIsChild && !bIsChild) return 1;  // a is child, b is parent -> b first
    if (!aIsChild && bIsChild) return -1; // a is parent, b is child -> a first
    return 0; // Same level, keep original order
  });
};

/**
 * Validate that a node has all required properties for its type
 * @param {Object} node - Node to validate
 * @returns {boolean} True if valid
 */
export const isValidNode = (node) => {
  if (!node || typeof node !== 'object') return false;
  if (!node.id || typeof node.id !== 'string') return false;
  if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') return false;
  return true;
};

/**
 * Filter out invalid nodes from an array
 * @param {Array} nodes - Array of nodes
 * @returns {Array} Array of valid nodes
 */
export const filterValidNodes = (nodes) => {
  if (!nodes || !Array.isArray(nodes)) return [];
  return nodes.filter(node => {
    const valid = isValidNode(node);
    if (!valid) {
      console.warn('⚠️ Filtering out invalid node:', node);
    }
    return valid;
  });
};

export default {
  prepareNodesForRendering,
  isValidNode,
  filterValidNodes,
};
