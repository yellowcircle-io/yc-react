import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Layout from '../components/global/Layout';
import LeadGate from '../components/shared/LeadGate';
import { useLayout } from '../contexts/LayoutContext';
import { navigationItems } from '../config/navigationItems';
import DraggablePhotoNode from '../components/travel/DraggablePhotoNode';
import TextNoteNode from '../components/unity-plus/TextNoteNode';
import PhotoUploadModal from '../components/travel/PhotoUploadModal';
import ShareModal from '../components/travel/ShareModal';
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
import { useFirebaseCapsule } from '../hooks/useFirebaseCapsule';
import { useFirebaseJourney } from '../hooks/useFirebaseJourney';

const nodeTypes = {
  photoNode: DraggablePhotoNode,
  textNode: TextNoteNode,
  // UnityMAP journey node types
  ...mapNodeTypes
};

const STORAGE_KEY = 'unity-notes-data';

// Card type configuration (same as UnityNotes Plus)
const CARD_TYPES = {
  photo: { label: 'Photo', icon: '🖼️', color: 'rgb(251, 191, 36)' },
  note: { label: 'Note', icon: '📝', color: 'rgb(251, 191, 36)' },
  link: { label: 'Link', icon: '🔗', color: '#b45309' },
  ai: { label: 'AI Chat', icon: '🤖', color: '#d97706' },
  video: { label: 'Video', icon: '📹', color: '#f59e0b' },
};

const UnityNotesFlow = ({ isUploadModalOpen, setIsUploadModalOpen, onFooterToggle }) => {
  const { fitView, zoomIn, zoomOut, getZoom } = useReactFlow();
  const { sidebarOpen } = useLayout();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

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
    // If selecting MAP mode but no campaign exists, redirect to Outreach Generator
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
  const { saveCapsule, isSaving } = useFirebaseCapsule();
  const [shareUrl, setShareUrl] = useState('');
  const [currentCapsuleId, setCurrentCapsuleId] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Firebase hook for UnityMAP journey persistence
  const { saveJourney, loadJourney, updateJourney, publishJourney, listJourneys, isSaving: isSavingJourney, isLoading: isLoadingJourney } = useFirebaseJourney();
  const [currentJourneyId, setCurrentJourneyId] = useState(null);
  const [journeyTitle, setJourneyTitle] = useState('Untitled Journey');
  const [journeyStatus, setJourneyStatus] = useState('draft'); // draft, active, paused, completed
  const [showProspectModal, setShowProspectModal] = useState(false);

  // Check if user has pro/admin access for cloud features
  const hasProAccess = () => {
    return localStorage.getItem('yc_bypass_active') === 'true' ||
           localStorage.getItem('yc_client_access') === 'true';
  };

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

  // Ref to access current nodes without causing re-renders
  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Handle "Edit in Outreach" - Navigate back to Outreach Generator with context
  const handleEditInOutreach = useCallback((nodeId, nodeData) => {
    // Find all related campaign nodes (same timestamp prefix)
    // Handles both old format (outreach-xxx) and new UnityMAP format (email-xxx, prospect-xxx)
    const timestampMatch = nodeId?.match(/(?:outreach|email|prospect|wait|exit)-(\d+)/) ||
                          (typeof nodeId === 'object' && nodeId?.id?.match(/(?:outreach|email|prospect|wait|exit)-(\d+)/));
    if (!timestampMatch) {
      // If no match, just navigate to Outreach Generator
      navigate('/outreach');
      return;
    }

    const campaignTimestamp = timestampMatch[1];
    // Use ref to get current nodes without dependency
    const currentNodes = nodesRef.current;
    // Find all related nodes with the same timestamp (handles both old and new formats)
    const campaignNodes = currentNodes.filter(n =>
      n.id.includes(`outreach-${campaignTimestamp}`) ||
      n.id.includes(`email-${campaignTimestamp}`) ||
      n.id.includes(`prospect-${campaignTimestamp}`) ||
      n.id.includes(`wait-${campaignTimestamp}`) ||
      n.id.includes(`exit-${campaignTimestamp}`)
    );

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
    // Try new UnityMAP prospectNode format
    else if (prospectNode && prospectNode.data) {
      const pData = prospectNode.data;
      prospectInfo.company = pData.label || '';
      prospectInfo.industry = pData.tags?.[0] || '';
      // Note: New format doesn't store full prospect details, user will enter in Outreach Generator
    }

    // Store context for Outreach Generator
    localStorage.setItem('outreach-edit-context', JSON.stringify({
      campaignTimestamp,
      prospectInfo,
      sourceNodeId: nodeId,
      fromUnityMAP: true,
      editedAt: new Date().toISOString()
    }));

    // Navigate to Outreach Generator with edit context
    navigate('/experiments/outreach-generator?from=unity-map&edit=true');
  }, [navigate]);

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
  const handleDeleteMemory = useCallback(() => {

    setNodes((nds) => nds.filter((node) => node.id !== editingNodeId));
    setEdges((eds) => eds.filter((edge) =>
      edge.source !== editingNodeId && edge.target !== editingNodeId
    ));

  }, [editingNodeId, setNodes, setEdges]);

  // Handle direct delete from node (for text/non-photo nodes)
  const handleDeleteNode = useCallback((nodeId) => {

    if (confirm('⚠️ Delete this note?\n\nThis cannot be undone.')) {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) =>
        edge.source !== nodeId && edge.target !== nodeId
      ));
    }
  }, [setNodes, setEdges]);

  // Handle node updates (for text nodes)
  const handleNodeUpdate = useCallback((nodeId, updates) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
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

  // Add new card (non-photo types)
  const handleAddCard = useCallback((type) => {
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
        }
      };
    }

    if (newNode) {
      setNodes((nds) => [...nds, newNode]);
      setTimeout(() => {
        fitView({ duration: 400, padding: 0.2 });
      }, 100);
    }
  }, [nodes.length, handleNodeUpdate, handleDeleteNode, setNodes, fitView, setIsUploadModalOpen]);

  // Ensure all nodes have callbacks
  useEffect(() => {
    if (!isInitialized) return;

    setNodes((nds) =>
      nds.map((node) => {
        // Determine the correct inline edit handler based on node type
        let inlineEditHandler = null;
        if (node.type === 'emailNode') {
          inlineEditHandler = handleInlineEmailEdit;
        } else if (node.type === 'waitNode') {
          inlineEditHandler = handleInlineWaitEdit;
        } else if (node.type === 'conditionNode') {
          inlineEditHandler = handleInlineConditionEdit;
        }

        return {
          ...node,
          data: {
            ...node.data,
            onResize: handlePhotoResize,
            onLightbox: handleLightbox,
            onEdit: handleEdit,
            onUpdate: handleNodeUpdate,
            onDelete: handleDeleteNode,
            onPreview: handleEmailPreview,
            onInlineEdit: inlineEditHandler,
            onEditInOutreach: handleEditInOutreach,
          }
        };
      })
    );
  }, [isInitialized, handlePhotoResize, handleLightbox, handleEdit, handleNodeUpdate, handleDeleteNode, handleEmailPreview, handleInlineEmailEdit, handleInlineWaitEdit, handleInlineConditionEdit, handleEditInOutreach, setNodes]);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    } catch (error) {
      console.error('❌ localStorage save error:', error);
      alert('⚠️ Unable to save locally. Your notes will be preserved in the current session.\n\nUse EXPORT to save as JSON file, or SHARE to save to cloud.');
    }
  }, [nodes, edges, isInitialized]);

  // Update zoom level when viewport changes
  useEffect(() => {
    const updateZoom = () => {
      const currentZoom = getZoom();
      setZoomLevel(currentZoom);
    };
    updateZoom();
  }, [getZoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
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
  }, [zoomIn, zoomOut, fitView]);

  // Auto-layout function to organize nodes
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;

    const NODE_WIDTH = 250;
    const NODE_HEIGHT = 150;
    const VERTICAL_GAP = 60;
    const HORIZONTAL_GAP = 80;
    const START_X = 100;
    const START_Y = 100;

    // Separate MAP nodes from regular nodes
    const mapNodeTypes = ['prospectNode', 'emailNode', 'waitNode', 'conditionNode', 'exitNode'];
    const mapNodes = nodes.filter(n => mapNodeTypes.includes(n.type));
    const regularNodes = nodes.filter(n => !mapNodeTypes.includes(n.type));

    let updatedNodes = [];

    // Layout MAP nodes in vertical flow
    if (mapNodes.length > 0) {
      // Sort by original position to maintain order
      const sortedMapNodes = [...mapNodes].sort((a, b) => a.position.y - b.position.y);

      // Center X position for vertical flow
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

    // Layout regular notes in grid
    if (regularNodes.length > 0) {
      const COLS = Math.ceil(Math.sqrt(regularNodes.length));
      const offsetX = mapNodes.length > 0 ? 800 : START_X; // Offset right if MAP nodes exist

      regularNodes.forEach((node, index) => {
        const row = Math.floor(index / COLS);
        const col = index % COLS;
        updatedNodes.push({
          ...node,
          position: {
            x: offsetX + (col * (NODE_WIDTH + HORIZONTAL_GAP)),
            y: START_Y + (row * (NODE_HEIGHT + VERTICAL_GAP))
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

  // Export layout as JSON file
  const handleExportJSON = () => {
    if (nodes.length === 0) {
      alert('⚠️ No notes to export. Add some notes first!');
      return;
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      title: 'UnityNotes',
      nodes,
      edges
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = Date.now();
    link.download = `unity-notes-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  };

  // Import layout from JSON file
  const handleImportJSON = () => {
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
        alert(`✅ Successfully imported ${importData.nodes.length} ${importData.nodes.length === 1 ? 'note' : 'notes'}!`);
      } catch (error) {
        console.error('Import failed:', error);
        alert(`❌ Import failed: ${error.message}\n\nPlease check that the file is a valid UnityNotes export.`);
      }
    };
    input.click();
  };

  // Save capsule to Firebase and get shareable URL (Pro feature)
  const handleSaveAndShare = async () => {
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
      const serializableNodes = nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: {
          x: node.position.x,
          y: node.position.y
        },
        data: {
          imageUrl: node.data?.imageUrl || '',
          location: node.data?.location || '',
          date: node.data?.date || '',
          description: node.data?.description || '',
          size: node.data?.size || 350
        }
      }));

      const serializableEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default'
      }));

      const capsuleId = await saveCapsule(serializableNodes, serializableEdges, {
        title: 'UnityNotes'
      });

      const url = `${window.location.origin}/unity-notes/view/${capsuleId}`;
      setShareUrl(url);
      setCurrentCapsuleId(capsuleId);

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
            console.warn('Copy fallback failed:', err);
          }
          document.body.removeChild(textArea);
        }
      } catch (clipboardErr) {
        console.warn('Clipboard copy failed:', clipboardErr);
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
  };

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
            onEdit: handleEdit
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

  // Clear all notes
  const handleClearAll = () => {
    if (confirm('⚠️ Clear all notes and reset layout?\n\nThis cannot be undone.\n\nClick OK to proceed.')) {
      setNodes([]);
      setEdges([]);
      localStorage.removeItem(STORAGE_KEY);
      setCurrentJourneyId(null);
    }
  };

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

    // Check for MAP nodes
    const mapNodeTypes = ['prospectNode', 'emailNode', 'waitNode', 'conditionNode', 'exitNode'];
    const mapNodes = nodes.filter(n => mapNodeTypes.includes(n.type));

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

      console.log('Journey saved:', journeyId);
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

  // Handle opening publish modal
  const handleStartPublish = async () => {
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

  // Handle publishing with prospects
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

      // Publish with prospects
      const result = await publishJourney(currentJourneyId, prospects);

      setJourneyStatus('active');
      setShowProspectModal(false);

      alert(
        `✅ Journey Published!\n\n` +
        `${result.prospectCount} prospect(s) added.\n\n` +
        `The Cloud Scheduler will process emails every 15 minutes.`
      );
    } catch (error) {
      console.error('❌ Publish failed:', error);
      alert(`❌ Publish failed: ${error.message}`);
    }
  };

  // Open Add Note dialog
  const handleAddNote = () => {
    setIsUploadModalOpen(true);
  };

  // Count email nodes for credit enforcement
  const emailNodeCount = useMemo(() => {
    return nodes.filter(n => n.type === 'emailNode').length;
  }, [nodes]);

  // Determine email limit based on user access
  const emailLimit = useMemo(() => {
    const hasApiAccess = localStorage.getItem('yc_bypass_active') === 'true' ||
                         localStorage.getItem('yc_client_access') === 'true';
    return hasApiAccess ? 10 : 3;
  }, []);

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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 20 }}>
      {/* React Flow Container */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 'min(max(280px, 35vw), 472px)' : '0px',
        right: 0,
        bottom: 0,
        transition: 'left 0.5s ease-out',
        zIndex: 1
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          panOnDrag={[1, 2]}
          selectionOnDrag={false}
          panOnScroll={true}
          zoomOnScroll={false}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          minZoom={0.1}
          maxZoom={4}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
        >
          <Background
            variant="dots"
            gap={24}
            size={2}
            color="#aaa"
            style={{ opacity: 0.3 }}
          />
        </ReactFlow>
      </div>

      {/* Zoom Controls - Right Rail with Mode Tab Slideout */}
      <div style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        zIndex: 150,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '0'
      }}>
        {/* Mode Tab Slideout Panel */}
        <div style={{
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
        }}>
          {[
            { key: 'notes', label: 'NOTES', icon: '📝', color: 'rgb(251, 191, 36)' },
            { key: 'map', label: 'MAP', icon: '🗺️', color: '#f59e0b' },
            { key: 'studio', label: 'STUDIO', icon: '🎨', color: '#d97706', disabled: true }
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => !mode.disabled && handleModeChange(mode.key)}
              disabled={mode.disabled}
              style={{
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
              }}
            >
              <span style={{ fontSize: '14px' }}>{mode.icon}</span>
              <span>{mode.label}</span>
              {mode.disabled && <span style={{ fontSize: '8px' }}>SOON</span>}
            </button>
          ))}
        </div>

        {/* Main Zoom Controls */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '12px 8px',
          borderRadius: showModePanel ? '0 8px 8px 0' : '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
        {/* Zoom In Button */}
        <button
          onClick={() => zoomIn({ duration: 200 })}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgb(251, 191, 36)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: '700',
            color: 'black',
            transition: 'background-color 0.2s, transform 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f5b000';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgb(251, 191, 36)';
            e.target.style.transform = 'scale(1)';
          }}
          title="Zoom In"
        >
          +
        </button>

        {/* Zoom Level Indicator */}
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: 'rgba(0, 0, 0, 0.7)',
          letterSpacing: '0.02em',
          textAlign: 'center',
          minWidth: '45px'
        }}>
          {Math.round(zoomLevel * 100)}%
        </div>

        {/* Zoom Out Button */}
        <button
          onClick={() => zoomOut({ duration: 200 })}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgb(251, 191, 36)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '24px',
            fontWeight: '700',
            color: 'black',
            transition: 'background-color 0.2s, transform 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f5b000';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgb(251, 191, 36)';
            e.target.style.transform = 'scale(1)';
          }}
          title="Zoom Out"
        >
          −
        </button>

        {/* Center/Fit View Button */}
        <button
          onClick={() => fitView({ duration: 400, padding: 0.2 })}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 0, 0, 0.15)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px',
            color: 'black',
            transition: 'background-color 0.2s, transform 0.2s',
            marginTop: '4px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(238, 207, 0, 0.2)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            e.target.style.transform = 'scale(1)';
          }}
          title="Center View"
        >
          ⊙
        </button>

        {/* Auto-Layout Button */}
        <button
          onClick={handleAutoLayout}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(0, 0, 0, 0.15)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: 'black',
            transition: 'background-color 0.2s, transform 0.2s',
            marginTop: '4px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            e.target.style.transform = 'scale(1)';
          }}
          title="Auto-Organize Nodes"
        >
          ⊞
        </button>

        {/* Cloud Save Button (MAP mode only) */}
        {hasJourneyContent && (
          <button
            onClick={handleSaveJourney}
            disabled={isSavingJourney}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: currentJourneyId ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${currentJourneyId ? 'rgba(251, 191, 36, 0.5)' : 'rgba(0, 0, 0, 0.15)'}`,
              borderRadius: '6px',
              cursor: isSavingJourney ? 'wait' : 'pointer',
              fontSize: '14px',
              color: currentJourneyId ? '#b45309' : 'black',
              transition: 'all 0.2s ease',
              marginTop: '4px',
              opacity: isSavingJourney ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSavingJourney) {
                e.target.style.backgroundColor = 'rgba(251, 191, 36, 0.3)';
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSavingJourney) {
                e.target.style.backgroundColor = currentJourneyId ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.05)';
                e.target.style.transform = 'scale(1)';
              }
            }}
            title={currentJourneyId ? 'Update Journey in Cloud' : 'Save Journey to Cloud'}
          >
            {isSavingJourney ? '⏳' : '☁️'}
          </button>
        )}

        {/* Publish Journey Button (MAP mode only) */}
        {hasJourneyContent && (
          <button
            onClick={handleStartPublish}
            disabled={isSavingJourney || journeyStatus === 'active'}
            style={{
              minWidth: '36px',
              height: '36px',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: journeyStatus === 'active'
                ? 'rgba(16, 185, 129, 0.15)'
                : journeyStatus === 'paused'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(139, 92, 246, 0.1)',
              border: `2px solid ${
                journeyStatus === 'active'
                  ? 'rgba(16, 185, 129, 0.5)'
                  : journeyStatus === 'paused'
                    ? 'rgba(245, 158, 11, 0.5)'
                    : 'rgba(139, 92, 246, 0.4)'
              }`,
              borderRadius: '8px',
              cursor: journeyStatus === 'active' ? 'default' : 'pointer',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              color: journeyStatus === 'active'
                ? '#b45309'
                : journeyStatus === 'paused'
                  ? '#d97706'
                  : '#92400e',
              transition: 'all 0.2s ease',
              marginTop: '4px'
            }}
            onMouseEnter={(e) => {
              if (journeyStatus !== 'active') {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)';
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              if (journeyStatus !== 'active') {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
            title={
              journeyStatus === 'active' ? 'Journey Running - Emails being sent'
              : journeyStatus === 'paused' ? 'Journey Paused'
              : 'Start Journey - Send emails to prospects'
            }
          >
            {journeyStatus === 'active' ? (
              <>
                <span style={{ fontSize: '12px' }}>🟢</span>
                <span>LIVE</span>
              </>
            ) : journeyStatus === 'paused' ? (
              <>
                <span style={{ fontSize: '12px' }}>⏸️</span>
                <span>PAUSED</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '14px' }}>🚀</span>
                <span>RUN</span>
              </>
            )}
          </button>
        )}

        {/* Divider */}
        <div style={{ width: '24px', height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />

        {/* Mode Toggle Button */}
        <button
          onClick={() => setShowModePanel(!showModePanel)}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: showModePanel ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0, 0, 0, 0.05)',
            border: `1px solid ${showModePanel ? 'rgba(251, 191, 36, 0.5)' : 'rgba(0, 0, 0, 0.15)'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: showModePanel ? '#b45309' : 'black',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!showModePanel) {
              e.target.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
              e.target.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!showModePanel) {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              e.target.style.transform = 'scale(1)';
            }
          }}
          title={showModePanel ? 'Hide Modes' : 'Switch Mode'}
        >
          {showModePanel ? '◀' : '▶'}
        </button>
        </div>
      </div>

      {/* Unity Circle Nav - Custom Add Note + Options Menu */}
      <UnityCircleNav
        onAddNote={handleAddNote}
        onExport={handleExportJSON}
        onImport={handleImportJSON}
        onShare={handleSaveAndShare}
        onClear={handleClearAll}
        onFooter={onFooterToggle}
        isSaving={isSaving}
        hasNotes={nodes.length > 0}
        currentMode={currentMode}
        onAddEmail={handleAddEmail}
        onAddWait={handleAddWait}
        onAddCondition={handleAddCondition}
        emailCount={emailNodeCount}
        emailLimit={emailLimit}
      />

      {/* Empty State */}
      {nodes.length === 0 && (
        <div style={{
          position: 'fixed',
          bottom: '140px',
          right: '20px',
          textAlign: 'right',
          padding: '20px 24px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          maxWidth: '280px',
          pointerEvents: 'none',
          zIndex: 85
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#000',
            marginBottom: '8px'
          }}>
            Start Your UnityNotes
          </h2>
          <p style={{
            fontSize: '12px',
            color: 'rgba(0, 0, 0, 0.6)',
            marginBottom: '12px',
            lineHeight: '1.4'
          }}>
            Click the yellow circle to add your first note.
          </p>
          <div style={{ fontSize: '11px', color: 'rgba(0, 0, 0, 0.5)', lineHeight: '1.6' }}>
            <p>✨ Drag notes to organize</p>
            <p>🔗 Connect notes together</p>
            <p>📍 Track locations and dates</p>
          </div>
        </div>
      )}

      {/* Upload Modal - With card types / MAP actions (context-aware) */}
      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handlePhotoUpload}
        cardTypes={CARD_TYPES}
        onAddCard={handleAddCard}
        currentMode={currentMode}
        onAddEmail={handleAddEmail}
        onAddWait={handleAddWait}
        onAddCondition={handleAddCondition}
        emailCount={emailNodeCount}
        emailLimit={emailLimit}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        capsuleId={currentCapsuleId}
      />

      {/* Lightbox Modal */}
      {showLightbox && (
        <LightboxModal
          photo={lightboxPhoto}
          onClose={() => {
            setShowLightbox(false);
            setLightboxPhoto(null);
          }}
        />
      )}

      {/* Edit Memory Modal */}
      <EditMemoryModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMemory(null);
          setEditingNodeId(null);
        }}
        memory={editingMemory}
        onSave={handleEditSave}
        onDelete={handleDeleteMemory}
      />

      {/* Email Inline Edit Modal */}
      <EmailEditModal
        isOpen={showEmailEditModal}
        onClose={() => {
          setShowEmailEditModal(false);
          setEditingEmailNodeId(null);
          setEditingEmailData(null);
        }}
        emailData={editingEmailData}
        onSave={handleEmailEditSave}
      />

      {/* Wait Inline Edit Modal */}
      <WaitEditModal
        isOpen={showWaitEditModal}
        onClose={() => {
          setShowWaitEditModal(false);
          setEditingWaitNodeId(null);
          setEditingWaitData(null);
        }}
        waitData={editingWaitData}
        onSave={handleWaitEditSave}
      />

      {/* Condition Inline Edit Modal */}
      <ConditionEditModal
        isOpen={showConditionEditModal}
        onClose={() => {
          setShowConditionEditModal(false);
          setEditingConditionNodeId(null);
          setEditingConditionData(null);
        }}
        conditionData={editingConditionData}
        onSave={handleConditionEditSave}
      />

      {/* Prospect Input Modal */}
      <ProspectInputModal
        isOpen={showProspectModal}
        onClose={() => setShowProspectModal(false)}
        onSubmit={handlePublishWithProspects}
        isLoading={isSavingJourney}
      />

      {/* Email Preview Modal */}
      {showEmailPreview && previewEmailData && (
        <div
          style={{
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
          }}
          onClick={() => setShowEmailPreview(false)}
        >
          <div
            style={{
              backgroundColor: '#f5f5f5',
              borderRadius: '12px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111' }}>
                  Email Preview
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                  {previewEmailData.title || 'Branded template preview'}
                </p>
              </div>
              <button
                onClick={() => setShowEmailPreview(false)}
                style={{
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
                }}
              >
                ×
              </button>
            </div>

            {/* Preview Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#e5e5e5',
              padding: '24px'
            }}>
              {/* Email Template Preview */}
              <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}>
                {/* Header */}
                <div style={{
                  backgroundColor: 'rgb(251, 191, 36)',
                  padding: '24px 40px'
                }}>
                  <h1 style={{
                    margin: 0,
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    fontSize: '24px',
                    fontWeight: '900',
                    color: '#000000',
                    letterSpacing: '-1px'
                  }}>
                    yellowCircle
                  </h1>
                </div>

                {/* Subject */}
                <div style={{
                  padding: '32px 40px 16px',
                  borderBottom: '1px solid #eee'
                }}>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Subject
                  </p>
                  <h2 style={{
                    margin: 0,
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111'
                  }}>
                    {previewEmailData.subject}
                  </h2>
                </div>

                {/* Body */}
                <div style={{
                  padding: '32px 40px',
                  fontSize: '15px',
                  color: '#333',
                  lineHeight: '1.6',
                  fontFamily: 'Georgia, "Times New Roman", serif'
                }}>
                  {previewEmailData.body.split('\n').map((line, i) => (
                    <p key={i} style={{ margin: '0 0 16px' }}>{line || '\u00A0'}</p>
                  ))}
                </div>

                {/* Footer */}
                <div style={{
                  backgroundColor: '#1a1a1a',
                  padding: '24px 40px'
                }}>
                  <p style={{
                    margin: '0 0 4px',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgb(251, 191, 36)'
                  }}>
                    Chris Cooper
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Founder & GTM Strategist • yellowCircle
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function UnityNotesPage() {
  const navigate = useNavigate();
  const { handleFooterToggle, handleMenuToggle } = useLayout();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

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
        >
          <ReactFlowProvider>
            <UnityNotesFlow
              isUploadModalOpen={isUploadModalOpen}
              setIsUploadModalOpen={setIsUploadModalOpen}
              onFooterToggle={handleFooterToggle}
            />
          </ReactFlowProvider>
        </Layout>
      </ErrorBoundary>
    </LeadGate>
  );
}

export default UnityNotesPage;
