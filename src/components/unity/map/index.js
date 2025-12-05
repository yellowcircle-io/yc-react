/**
 * UnityMAP Journey Node Types
 *
 * Export all journey node components for use in ReactFlow.
 *
 * Usage in UnityNotesPage:
 * import { mapNodeTypes } from '../components/unity/map';
 *
 * const nodeTypes = {
 *   ...existingNodeTypes,
 *   ...mapNodeTypes
 * };
 */

import ProspectNode from './ProspectNode';
import EmailNode from './EmailNode';
import ConditionNode from './ConditionNode';
import WaitNode from './WaitNode';
import ExitNode from './ExitNode';

// Node type registry for ReactFlow
export const mapNodeTypes = {
  prospectNode: ProspectNode,
  emailNode: EmailNode,
  conditionNode: ConditionNode,
  waitNode: WaitNode,
  exitNode: ExitNode
};

// Individual exports for direct imports
export {
  ProspectNode,
  EmailNode,
  ConditionNode,
  WaitNode,
  ExitNode
};

// Helper to create a new journey from Outreach Generator output
export const createJourneyFromOutreach = (outreachData) => {
  const { prospect, emails = [], mode = 'consultant' } = outreachData;
  const timestamp = Date.now();

  // Create prospect node
  const prospectNode = {
    id: `prospect-${timestamp}`,
    type: 'prospectNode',
    position: { x: 400, y: 50 },
    data: {
      label: prospect?.company || 'Prospects',
      count: 1,
      segment: mode === 'consultant' ? 'Cold Outreach' : 'Warm Leads',
      source: 'manual',
      tags: [prospect?.industry || 'Unknown'].filter(Boolean)
    }
  };

  // Create email nodes (timing controlled by WaitNodes instead)
  const emailNodes = emails.map((email, index) => {
    return {
      id: `email-${timestamp}-${index}`,
      type: 'emailNode',
      position: { x: 400, y: 200 + (index * 180) },
      data: {
        label: email.label || `Email ${index + 1}`,
        subject: email.subject || '',
        preview: email.body?.substring(0, 100) || '',
        status: 'draft',
        fullBody: email.body
      }
    };
  });

  // Create exit node
  const exitNode = {
    id: `exit-${timestamp}`,
    type: 'exitNode',
    position: { x: 400, y: 200 + (emails.length * 180) },
    data: {
      exitType: 'completed',
      label: 'Sequence End'
    }
  };

  // Create edges connecting all nodes
  const edges = [];

  // Prospect -> First Email
  if (emailNodes.length > 0) {
    edges.push({
      id: `edge-prospect-email-${timestamp}`,
      source: prospectNode.id,
      target: emailNodes[0].id
    });
  }

  // Email -> Email connections
  for (let i = 0; i < emailNodes.length - 1; i++) {
    edges.push({
      id: `edge-email-${timestamp}-${i}`,
      source: emailNodes[i].id,
      target: emailNodes[i + 1].id
    });
  }

  // Last Email -> Exit
  if (emailNodes.length > 0) {
    edges.push({
      id: `edge-email-exit-${timestamp}`,
      source: emailNodes[emailNodes.length - 1].id,
      target: exitNode.id
    });
  }

  return {
    nodes: [prospectNode, ...emailNodes, exitNode],
    edges
  };
};

export default mapNodeTypes;
