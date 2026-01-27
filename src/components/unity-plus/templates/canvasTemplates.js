/**
 * Canvas Templates for UnityNOTES
 *
 * Pre-defined canvas layouts that users can quickly instantiate
 * to start projects. Each template includes positioned nodes
 * and optional edges for connections.
 *
 * Template Categories:
 * - work: Professional/productivity templates
 * - creative: Design and creative project templates
 * - personal: Personal organization templates
 *
 * @created 2026-01-24
 * @author Claude Code
 */

/**
 * Generate a unique ID for nodes
 * Uses crypto.randomUUID() for proper UUID generation
 * @returns {string} Unique identifier
 */
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Template category definitions
 */
export const TEMPLATE_CATEGORIES = {
  work: { label: 'Work', color: '#3b82f6' },
  creative: { label: 'Creative', color: '#a855f7' },
  personal: { label: 'Personal', color: '#22c55e' },
};

/**
 * Canvas template definitions
 * Each template includes:
 * - id: Unique identifier
 * - name: Display name
 * - description: Brief description
 * - icon: Lucide icon name
 * - category: Template category (work, creative, personal)
 * - nodes: Array of node definitions with type, position, and data
 * - edges: Array of edge connections between nodes
 */
export const CANVAS_TEMPLATES = {
  projectPlanning: {
    id: 'project-planning',
    name: 'Project Planning',
    description: 'Organize project tasks and brainstorm ideas with groups and sticky notes',
    icon: 'FolderKanban',
    category: 'work',
    nodes: [
      // Main ideas group
      {
        type: 'groupNode',
        position: { x: 50, y: 50 },
        data: {
          label: 'Ideas',
          width: 380,
          height: 280,
          color: 'yellow',
        },
      },
      // Sticky notes inside ideas group
      {
        type: 'stickyNode',
        position: { x: 70, y: 100 },
        data: {
          content: 'Main feature concept',
          color: 'yellow',
          size: 150,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 240, y: 100 },
        data: {
          content: 'User requirements',
          color: 'blue',
          size: 150,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 70, y: 200 },
        data: {
          content: 'Technical constraints',
          color: 'pink',
          size: 150,
        },
      },
      // Tasks group
      {
        type: 'groupNode',
        position: { x: 480, y: 50 },
        data: {
          label: 'Tasks',
          width: 280,
          height: 340,
          color: 'green',
        },
      },
      // Todo list for tasks
      {
        type: 'todoNode',
        position: { x: 510, y: 100 },
        data: {
          title: 'Project Tasks',
          items: [
            { text: 'Define scope', completed: false },
            { text: 'Create wireframes', completed: false },
            { text: 'Set up repository', completed: false },
            { text: 'Write documentation', completed: false },
          ],
        },
      },
      // Notes section
      {
        type: 'commentNode',
        position: { x: 50, y: 380 },
        data: {
          content: 'Project kickoff notes and important decisions go here.',
          author: 'Project Lead',
          timestamp: new Date().toISOString(),
        },
      },
    ],
    edges: [],
  },

  journeyMap: {
    id: 'journey-map',
    name: 'Journey Map',
    description: 'Map out user journeys or process flows with connected steps',
    icon: 'Route',
    category: 'work',
    nodes: [
      // Stage 1 - Awareness
      {
        type: 'stickyNode',
        position: { x: 50, y: 150 },
        data: {
          content: 'Stage 1: Awareness\nUser discovers the product',
          color: 'blue',
          size: 180,
        },
      },
      // Stage 2 - Consideration
      {
        type: 'stickyNode',
        position: { x: 280, y: 150 },
        data: {
          content: 'Stage 2: Consideration\nUser evaluates options',
          color: 'green',
          size: 180,
        },
      },
      // Stage 3 - Decision
      {
        type: 'stickyNode',
        position: { x: 510, y: 150 },
        data: {
          content: 'Stage 3: Decision\nUser makes a choice',
          color: 'yellow',
          size: 180,
        },
      },
      // Stage 4 - Action
      {
        type: 'stickyNode',
        position: { x: 740, y: 150 },
        data: {
          content: 'Stage 4: Action\nUser completes purchase',
          color: 'orange',
          size: 180,
        },
      },
      // Stage 5 - Retention
      {
        type: 'stickyNode',
        position: { x: 970, y: 150 },
        data: {
          content: 'Stage 5: Retention\nUser becomes loyal',
          color: 'purple',
          size: 180,
        },
      },
      // Pain points group
      {
        type: 'groupNode',
        position: { x: 50, y: 380 },
        data: {
          label: 'Pain Points',
          width: 500,
          height: 150,
          color: 'pink',
        },
      },
      {
        type: 'stickyNode',
        position: { x: 70, y: 420 },
        data: {
          content: 'Add pain points here...',
          color: 'pink',
          size: 130,
        },
      },
      // Opportunities group
      {
        type: 'groupNode',
        position: { x: 600, y: 380 },
        data: {
          label: 'Opportunities',
          width: 500,
          height: 150,
          color: 'green',
        },
      },
      {
        type: 'stickyNode',
        position: { x: 620, y: 420 },
        data: {
          content: 'Add opportunities here...',
          color: 'green',
          size: 130,
        },
      },
    ],
    edges: [
      { source: 0, target: 1, animated: true },
      { source: 1, target: 2, animated: true },
      { source: 2, target: 3, animated: true },
      { source: 3, target: 4, animated: true },
    ],
  },

  mindMap: {
    id: 'mind-map',
    name: 'Mind Map',
    description: 'Central topic with branching ideas for brainstorming',
    icon: 'Network',
    category: 'creative',
    nodes: [
      // Central topic
      {
        type: 'stickyNode',
        position: { x: 400, y: 250 },
        data: {
          content: 'Central Topic\n(Double-click to edit)',
          color: 'yellow',
          size: 200,
        },
      },
      // Branch 1 - Top
      {
        type: 'stickyNode',
        position: { x: 430, y: 50 },
        data: {
          content: 'Idea 1',
          color: 'blue',
          size: 140,
        },
      },
      // Branch 2 - Right
      {
        type: 'stickyNode',
        position: { x: 680, y: 180 },
        data: {
          content: 'Idea 2',
          color: 'green',
          size: 140,
        },
      },
      // Branch 3 - Bottom Right
      {
        type: 'stickyNode',
        position: { x: 650, y: 400 },
        data: {
          content: 'Idea 3',
          color: 'purple',
          size: 140,
        },
      },
      // Branch 4 - Bottom Left
      {
        type: 'stickyNode',
        position: { x: 200, y: 400 },
        data: {
          content: 'Idea 4',
          color: 'orange',
          size: 140,
        },
      },
      // Branch 5 - Left
      {
        type: 'stickyNode',
        position: { x: 150, y: 180 },
        data: {
          content: 'Idea 5',
          color: 'pink',
          size: 140,
        },
      },
      // Sub-branches
      {
        type: 'stickyNode',
        position: { x: 550, y: 30 },
        data: {
          content: 'Sub-idea',
          color: 'blue',
          size: 100,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 800, y: 120 },
        data: {
          content: 'Sub-idea',
          color: 'green',
          size: 100,
        },
      },
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 0, target: 2 },
      { source: 0, target: 3 },
      { source: 0, target: 4 },
      { source: 0, target: 5 },
      { source: 1, target: 6 },
      { source: 2, target: 7 },
    ],
  },

  moodBoard: {
    id: 'mood-board',
    name: 'Mood Board',
    description: 'Visual inspiration board with colors and notes',
    icon: 'Palette',
    category: 'creative',
    nodes: [
      // Title group
      {
        type: 'groupNode',
        position: { x: 50, y: 30 },
        data: {
          label: 'Mood Board',
          width: 900,
          height: 80,
          color: 'purple',
        },
      },
      // Color palette
      {
        type: 'colorSwatchNode',
        position: { x: 50, y: 150 },
        data: {
          title: 'Color Palette',
          colors: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
        },
      },
      // Inspiration notes
      {
        type: 'stickyNode',
        position: { x: 300, y: 150 },
        data: {
          content: 'Key Themes:\n- Minimalist\n- Modern\n- Warm tones',
          color: 'yellow',
          size: 180,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 520, y: 150 },
        data: {
          content: 'Typography:\n- Sans-serif headers\n- Clean body text',
          color: 'blue',
          size: 180,
        },
      },
      // Visual elements group
      {
        type: 'groupNode',
        position: { x: 50, y: 350 },
        data: {
          label: 'Visual References',
          width: 650,
          height: 200,
          color: 'gray',
        },
      },
      {
        type: 'stickyNode',
        position: { x: 70, y: 400 },
        data: {
          content: 'Add image links or sketches here',
          color: 'pink',
          size: 150,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 240, y: 400 },
        data: {
          content: 'Reference 2',
          color: 'green',
          size: 150,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 410, y: 400 },
        data: {
          content: 'Reference 3',
          color: 'orange',
          size: 150,
        },
      },
      // Notes section
      {
        type: 'commentNode',
        position: { x: 740, y: 150 },
        data: {
          content: 'Design notes and feedback for the mood board.',
          author: 'Designer',
          timestamp: new Date().toISOString(),
        },
      },
    ],
    edges: [],
  },

  kanbanBoard: {
    id: 'kanban-board',
    name: 'Kanban Board',
    description: 'Three-column task board: To Do, In Progress, Done',
    icon: 'Columns3',
    category: 'work',
    nodes: [
      // To Do column
      {
        type: 'groupNode',
        position: { x: 50, y: 50 },
        data: {
          label: 'To Do',
          width: 280,
          height: 450,
          color: 'gray',
        },
      },
      {
        type: 'todoNode',
        position: { x: 80, y: 100 },
        data: {
          title: 'Backlog Tasks',
          items: [
            { text: 'Research competitors', completed: false },
            { text: 'Define user personas', completed: false },
            { text: 'Create sitemap', completed: false },
          ],
        },
      },
      {
        type: 'stickyNode',
        position: { x: 80, y: 360 },
        data: {
          content: 'Priority: High',
          color: 'pink',
          size: 120,
        },
      },
      // In Progress column
      {
        type: 'groupNode',
        position: { x: 380, y: 50 },
        data: {
          label: 'In Progress',
          width: 280,
          height: 450,
          color: 'blue',
        },
      },
      {
        type: 'todoNode',
        position: { x: 410, y: 100 },
        data: {
          title: 'Active Work',
          items: [
            { text: 'Design mockups', completed: false },
            { text: 'Write copy', completed: false },
          ],
        },
      },
      {
        type: 'stickyNode',
        position: { x: 410, y: 340 },
        data: {
          content: 'Blocked: Waiting on assets',
          color: 'orange',
          size: 130,
        },
      },
      // Done column
      {
        type: 'groupNode',
        position: { x: 710, y: 50 },
        data: {
          label: 'Done',
          width: 280,
          height: 450,
          color: 'green',
        },
      },
      {
        type: 'todoNode',
        position: { x: 740, y: 100 },
        data: {
          title: 'Completed',
          items: [
            { text: 'Project kickoff', completed: true },
            { text: 'Stakeholder alignment', completed: true },
          ],
        },
      },
      {
        type: 'stickyNode',
        position: { x: 740, y: 340 },
        data: {
          content: 'Shipped!',
          color: 'green',
          size: 120,
        },
      },
    ],
    edges: [],
  },

  brainstormSession: {
    id: 'brainstorm-session',
    name: 'Brainstorm Session',
    description: 'Scattered sticky notes for free-form ideation',
    icon: 'Lightbulb',
    category: 'creative',
    nodes: [
      // Topic header
      {
        type: 'groupNode',
        position: { x: 350, y: 30 },
        data: {
          label: 'Brainstorm: [Your Topic]',
          width: 350,
          height: 60,
          color: 'yellow',
        },
      },
      // Scattered sticky notes
      {
        type: 'stickyNode',
        position: { x: 80, y: 120 },
        data: {
          content: 'What if we...',
          color: 'yellow',
          size: 140,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 280, y: 150 },
        data: {
          content: 'How might we...',
          color: 'blue',
          size: 140,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 500, y: 120 },
        data: {
          content: 'Imagine...',
          color: 'green',
          size: 140,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 720, y: 160 },
        data: {
          content: 'Explore...',
          color: 'purple',
          size: 140,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 120, y: 300 },
        data: {
          content: 'Consider...',
          color: 'pink',
          size: 140,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 350, y: 320 },
        data: {
          content: 'Challenge...',
          color: 'orange',
          size: 140,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 580, y: 290 },
        data: {
          content: 'Question...',
          color: 'yellow',
          size: 140,
        },
      },
      {
        type: 'stickyNode',
        position: { x: 800, y: 320 },
        data: {
          content: 'Dream...',
          color: 'blue',
          size: 140,
        },
      },
      // Action items at bottom
      {
        type: 'todoNode',
        position: { x: 80, y: 480 },
        data: {
          title: 'Next Steps',
          items: [
            { text: 'Vote on top 3 ideas', completed: false },
            { text: 'Assign owners', completed: false },
            { text: 'Schedule follow-up', completed: false },
          ],
        },
      },
      // Notes
      {
        type: 'commentNode',
        position: { x: 400, y: 480 },
        data: {
          content: 'Session notes: Capture key insights and decisions here.',
          author: 'Facilitator',
          timestamp: new Date().toISOString(),
        },
      },
    ],
    edges: [],
  },
};

/**
 * Get all templates as an array
 * @returns {Array} Array of template objects
 */
export const getTemplatesList = () => {
  return Object.values(CANVAS_TEMPLATES);
};

/**
 * Get templates filtered by category
 * @param {string} category - Category to filter by (work, creative, personal)
 * @returns {Array} Filtered array of templates
 */
export const getTemplatesByCategory = (category) => {
  return getTemplatesList().filter((template) => template.category === category);
};

/**
 * Get a single template by ID
 * @param {string} templateId - Template identifier
 * @returns {Object|null} Template object or null if not found
 */
export const getTemplateById = (templateId) => {
  return Object.values(CANVAS_TEMPLATES).find((t) => t.id === templateId) || null;
};

/**
 * Instantiate a template with unique node IDs
 * Creates a deep copy of the template with fresh UUIDs for all nodes
 * and properly mapped edge source/target references
 *
 * @param {string} templateId - Template identifier
 * @param {Object} options - Optional configuration
 * @param {number} options.offsetX - X offset for all nodes (default: 0)
 * @param {number} options.offsetY - Y offset for all nodes (default: 0)
 * @returns {Object|null} Object with { nodes: [], edges: [] } or null if template not found
 */
export function instantiateTemplate(templateId, options = {}) {
  const template = getTemplateById(templateId);
  if (!template) {
    console.warn(`Template not found: ${templateId}`);
    return null;
  }

  const { offsetX = 0, offsetY = 0 } = options;

  // Generate new IDs for all nodes and create mapping from index to new ID
  const idMap = new Map();

  const nodes = template.nodes.map((node, index) => {
    const newId = generateId();
    idMap.set(index, newId);

    return {
      id: newId,
      type: node.type,
      position: {
        x: node.position.x + offsetX,
        y: node.position.y + offsetY,
      },
      data: JSON.parse(JSON.stringify(node.data)), // Deep copy data
    };
  });

  // Map edges to use new node IDs
  const edges = (template.edges || []).map((edge) => {
    const sourceId = idMap.get(edge.source);
    const targetId = idMap.get(edge.target);

    return {
      id: `edge-${generateId()}`,
      source: sourceId,
      target: targetId,
      ...(edge.animated && { animated: true }),
      ...(edge.type && { type: edge.type }),
      ...(edge.label && { label: edge.label }),
    };
  });

  return { nodes, edges };
}

/**
 * Get template preview info (for displaying in selector)
 * @param {string} templateId - Template identifier
 * @returns {Object|null} Preview info or null
 */
export const getTemplatePreview = (templateId) => {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    icon: template.icon,
    category: template.category,
    nodeCount: template.nodes.length,
    hasEdges: template.edges && template.edges.length > 0,
  };
};

export default CANVAS_TEMPLATES;
