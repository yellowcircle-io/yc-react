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
// Now includes WaitNodes between emails with proper timing
// UPDATED: Stores full prospect contact info for email sending
export const createJourneyFromOutreach = (outreachData, offsetX = 0) => {
  const { prospect, emails = [], mode = 'consultant', waitDays = [3, 7] } = outreachData;
  const timestamp = Date.now();

  // Base X position (can be offset for multiple campaigns)
  const baseX = 400 + offsetX;

  // Create prospect node with FULL contact info for email sending
  const prospectNode = {
    id: `prospect-${timestamp}`,
    type: 'prospectNode',
    position: { x: baseX, y: 50 },
    data: {
      label: prospect?.company || 'Prospects',
      count: 1,
      segment: mode === 'consultant' ? 'Cold Outreach' : 'Warm Leads',
      source: 'manual',
      tags: [prospect?.industry || 'Unknown'].filter(Boolean),
      // CRITICAL: Store full prospect info for email sending
      prospects: prospect ? [{
        id: `contact-${timestamp}`,
        email: prospect.email || '',
        firstName: prospect.firstName || '',
        lastName: prospect.lastName || '',
        company: prospect.company || '',
        title: prospect.title || '',
        industry: prospect.industry || '',
        trigger: prospect.trigger || '',
        triggerDetails: prospect.triggerDetails || '',
        status: 'active',
        currentNodeId: null // Will be set when journey starts
      }] : []
    }
  };

  // Create nodes array with emails and wait nodes interleaved
  const allNodes = [prospectNode];
  const edges = [];
  let yPosition = 200;
  const nodeSpacing = 160;

  // Process each email, adding wait nodes between them
  emails.forEach((email, index) => {
    // Add email node
    const emailNode = {
      id: `email-${timestamp}-${index}`,
      type: 'emailNode',
      position: { x: baseX, y: yPosition },
      data: {
        label: email.label || `Email ${index + 1}`,
        subject: email.subject || '',
        preview: email.body?.substring(0, 100) || '',
        status: 'draft',
        fullBody: email.body
      }
    };
    allNodes.push(emailNode);
    yPosition += nodeSpacing;

    // Add wait node after email (except after last email)
    if (index < emails.length - 1) {
      const waitDuration = waitDays[index] || 3; // Default 3 days if not specified
      const waitNode = {
        id: `wait-${timestamp}-${index}`,
        type: 'waitNode',
        position: { x: baseX, y: yPosition },
        data: {
          label: 'Wait',
          duration: waitDuration,
          unit: 'days'
        }
      };
      allNodes.push(waitNode);
      yPosition += nodeSpacing;
    }
  });

  // Create exit node
  const exitNode = {
    id: `exit-${timestamp}`,
    type: 'exitNode',
    position: { x: baseX, y: yPosition },
    data: {
      exitType: 'completed',
      label: 'Sequence End'
    }
  };
  allNodes.push(exitNode);

  // Create edges connecting all nodes in sequence
  // Prospect -> First Email
  if (emails.length > 0) {
    edges.push({
      id: `edge-prospect-email-${timestamp}`,
      source: prospectNode.id,
      target: `email-${timestamp}-0`
    });
  }

  // Connect emails and waits in sequence
  for (let i = 0; i < emails.length; i++) {
    const emailId = `email-${timestamp}-${i}`;

    if (i < emails.length - 1) {
      // Email -> Wait
      const waitId = `wait-${timestamp}-${i}`;
      edges.push({
        id: `edge-email-wait-${timestamp}-${i}`,
        source: emailId,
        target: waitId
      });

      // Wait -> Next Email
      edges.push({
        id: `edge-wait-email-${timestamp}-${i}`,
        source: waitId,
        target: `email-${timestamp}-${i + 1}`
      });
    } else {
      // Last Email -> Exit
      edges.push({
        id: `edge-email-exit-${timestamp}`,
        source: emailId,
        target: exitNode.id
      });
    }
  }

  return {
    nodes: allNodes,
    edges
  };
};

export default mapNodeTypes;
