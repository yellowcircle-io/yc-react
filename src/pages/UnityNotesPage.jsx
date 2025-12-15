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
import { useAuth } from '../contexts/AuthContext';
import { useApiKeyStorage } from '../hooks/useApiKeyStorage';
import { useCredits } from '../hooks/useCredits';
import DraggablePhotoNode from '../components/travel/DraggablePhotoNode';
import TextNoteNode from '../components/unity-plus/TextNoteNode';
import PhotoUploadModal from '../components/travel/PhotoUploadModal';
import ShareModal from '../components/unity/ShareModal';
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
import { useImageAnalysis } from '../hooks/useImageAnalysis';
import UnityStudioCanvas from '../components/unity-studio/UnityStudioCanvas';
import { LoadingSkeleton, StatusBar, useKeyboardShortcuts, ShortcutsHelpModal, MobileNodeNavigator } from '../components/unity';

const nodeTypes = {
  photoNode: DraggablePhotoNode,
  textNode: TextNoteNode,
  // UnityMAP journey node types
  ...mapNodeTypes
};

const STORAGE_KEY = 'unity-notes-data';
const FREE_NODE_LIMIT = 10;
const PRO_NODE_LIMIT = 100;

// Card type configuration (same as UnityNotes Plus)
const CARD_TYPES = {
  photo: { label: 'Photo', icon: '🖼️', color: 'rgb(251, 191, 36)' },
  note: { label: 'Note', icon: '📝', color: 'rgb(251, 191, 36)' },
  link: { label: 'Link', icon: '🔗', color: '#b45309' },
  ai: { label: 'AI Chat', icon: '🤖', color: '#d97706' },
  video: { label: 'Video', icon: '📹', color: '#f59e0b' },
};

const UnityNotesFlow = ({ isUploadModalOpen, setIsUploadModalOpen, onFooterToggle, showParallax, setShowParallax }) => {
  const { fitView, zoomIn, zoomOut, getZoom, setViewport, getViewport } = useReactFlow();
  const { sidebarOpen } = useLayout();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // SSO Authentication hooks
  const { user, userProfile, isAuthenticated, isAdmin } = useAuth();
  const { isCloudSynced, migrateLocalToCloud } = useApiKeyStorage();
  const { creditsRemaining, tier } = useCredits();

  // Node limit for canvas (tier-based) - must be defined early for handleAddCard
  const nodeLimit = useMemo(() => {
    if (isAdmin) return 999;
    if (isAuthenticated && tier === 'premium') return PRO_NODE_LIMIT;
    return FREE_NODE_LIMIT;
  }, [isAdmin, isAuthenticated, tier]);

  // AI Image Analysis hook
  const { analyzeImage, error: aiError, isConfigured: aiConfigured } = useImageAnalysis();
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
    isSaving,
    cleanupOldCapsules,
    getCapsuleStats,
    migrateToV2,
    // v3 Collaboration functions
    addCollaborator,
    removeCollaborator,
    updateVisibility
  } = useFirebaseCapsule();
  const [shareUrl, setShareUrl] = useState('');
  const [currentCapsuleId, setCurrentCapsuleId] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Collaboration state (v3)
  const [collaborators, setCollaborators] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
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

  // Handler for opening Studio from AI Chat with conversation context
  const handleOpenStudio = useCallback((context) => {
    setStudioContext(context);
    handleModeChange('studio');
  }, []);

  // Auto-migrate localStorage API keys to Firestore when user logs in
  useEffect(() => {
    if (isAuthenticated && !isCloudSynced) {
      // User just logged in - migrate localStorage keys to cloud
      migrateLocalToCloud().then((migrated) => {
        if (migrated) {
          console.log('✅ API keys migrated to cloud storage');
        }
      });
    }
  }, [isAuthenticated, isCloudSynced, migrateLocalToCloud]);

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
          console.log('📂 Loading saved journey:', currentJourneyId);
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
            console.log('✅ Journey loaded successfully:', {
              title: journeyData.title,
              status: journeyData.status,
              nodeCount: journeyData.nodes?.length,
              prospectCount: journeyData.prospects?.length
            });
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
        console.log('📡 Associated triggers for journey:', currentJourneyId, matchingTriggers);
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
      console.log('=== DEV STATE ===');
      console.log('Admin:', isAdmin);
      console.log('Authenticated:', isAuthenticated);
      console.log('User:', user?.email);
      console.log('Hub Auth:', localStorage.getItem('outreach_business_auth'));
      console.log('Journey ID:', currentJourneyId);
      console.log('Journey Status:', journeyStatus);
      console.log('Nodes:', nodes.length);
      console.log('Edges:', edges.length);
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
        console.log('Capsule Stats:', stats);
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

              console.log('🔍 Deployment data:', {
                id: deploymentData.id,
                editingTimestamp: editingTimestamp,
                hasEditingTimestamp: !!editingTimestamp
              });

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
                console.log('🔍 Processing deployment with current nodes:', prev.length);
                console.log('🔍 All node IDs:', prev.map(n => n.id));

                let offsetX = 0;
                let filteredNodes = prev;

                if (editingTimestamp) {
                  // EDITING: Find original position and filter out old nodes
                  const tsString = String(editingTimestamp);
                  const originalProspect = prev.find(n =>
                    n.type === 'prospectNode' && n.id.includes(tsString)
                  );

                  console.log('🔍 Looking for prospect with timestamp:', tsString);
                  console.log('🔍 All prospect nodes:', prev.filter(n => n.type === 'prospectNode').map(n => n.id));

                  if (originalProspect) {
                    offsetX = (originalProspect.position?.x || 400) - 400;
                    console.log('📝 Found original prospect at:', originalProspect.position, 'offsetX:', offsetX);
                  } else {
                    console.log('⚠️ Original prospect not found - using default position');
                  }

                  // Filter out old campaign nodes
                  filteredNodes = prev.filter(node => {
                    const matchesDash = node.id.includes(`-${tsString}`);
                    const matchesPrefix = node.id.includes(`${tsString}-`);
                    if (matchesDash || matchesPrefix) {
                      console.log('🗑️ Removing node:', node.id);
                    }
                    return !matchesDash && !matchesPrefix;
                  });

                  console.log('🗑️ Removed', prev.length - filteredNodes.length, 'old nodes');
                } else {
                  // NEW CAMPAIGN: Count existing prospect nodes to offset
                  const existingProspectNodes = prev.filter(n => n.type === 'prospectNode');
                  offsetX = existingProspectNodes.length * 350;
                  console.log('🆕 New campaign, offset:', offsetX, 'existing campaigns:', existingProspectNodes.length);
                }

                // Create journey nodes with calculated offset
                const { nodes: journeyNodes, edges: journeyEdges } = createJourneyFromOutreach(outreachData, offsetX);
                console.log('🆕 Created', journeyNodes.length, 'new nodes with IDs:', journeyNodes.map(n => n.id));

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

              console.log('✅ Imported outreach deployment:', deploymentData.id, editingTimestamp ? '(edit)' : '(new)');
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
    if (!aiConfigured) {
      alert('AI analysis requires an OpenAI API key. Add VITE_OPENAI_API_KEY to your .env file.');
      return;
    }

    try {
      const result = await analyzeImage(imageUrl, analysisType);

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
      console.log('✅ AI Analysis:', messages[analysisType] || 'Analysis complete');

    } catch (error) {
      console.error('AI Analysis error:', error);
      alert(`AI analysis failed: ${error.message}`);
    }
  }, [analyzeImage, aiConfigured, aiError, setNodes]);

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
    console.log('📝 MAP Edit: nodeId =', nodeId);

    // Find all related campaign nodes (same timestamp prefix)
    // Handles both old format (outreach-xxx) and new UnityMAP format (email-xxx, prospect-xxx)
    const timestampMatch = nodeId?.match(/(?:outreach|email|prospect|wait|exit)-(\d+)/) ||
                          (typeof nodeId === 'object' && nodeId?.id?.match(/(?:outreach|email|prospect|wait|exit)-(\d+)/));
    if (!timestampMatch) {
      console.log('⚠️ MAP Edit: No timestamp match found in nodeId');
      // If no match, just navigate to Outreach Generator
      navigate('/outreach');
      return;
    }

    const campaignTimestamp = timestampMatch[1];
    console.log('📝 MAP Edit: Extracted campaignTimestamp =', campaignTimestamp);
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

    console.log('📝 MAP Edit: Storing edit context with campaignTimestamp:', campaignTimestamp);

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
          onOpenStudio: handleOpenStudio,
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
  }, [nodes.length, nodeLimit, tier, isAdmin, handleNodeUpdate, handleDeleteNode, setNodes, fitView, setIsUploadModalOpen, handleOpenStudio]);

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

        // Count prospects at this node for visual display
        const prospectsAtNode = getProspectsAtNode(node.id);

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
            // ProspectNode uses onEditCampaign to edit the entire campaign
            onEditCampaign: node.type === 'prospectNode' ? handleEditInOutreach : undefined,
            // ProspectNode uses onDeploy to deploy/add prospects
            onDeploy: node.type === 'prospectNode' ? handleDeployFromNode : undefined,
            // AI image analysis for photo nodes
            onAnalyze: node.type === 'photoNode' ? handleImageAnalyze : undefined,
            // AI Chat -> Studio integration
            onOpenStudio: node.data?.cardType === 'ai' ? handleOpenStudio : undefined,
            // Prospect count at this node (for visual tracking)
            prospectsAtNode: prospectsAtNode,
          }
        };
      })
    );
  }, [isInitialized, handlePhotoResize, handleLightbox, handleEdit, handleNodeUpdate, handleDeleteNode, handleEmailPreview, handleInlineEmailEdit, handleInlineWaitEdit, handleInlineConditionEdit, handleEditInOutreach, handleDeployFromNode, handleImageAnalyze, handleOpenStudio, getProspectsAtNode, setNodes]);

  // Save to localStorage with status indicator
  useEffect(() => {
    if (!isInitialized) return;
    setIsSavingLocal(true);
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

  // Collaboration handlers (v3)
  const handleAddCollaborator = async (email, role) => {
    if (!currentCapsuleId) {
      throw new Error('Please save your canvas first');
    }
    await addCollaborator(currentCapsuleId, email, role);
    setCollaborators(prev => [...prev, { email, role, addedAt: new Date().toISOString() }]);
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
      console.log('🚀 Starting sendJourneyNow for journey:', currentJourneyId);
      const sendResults = await sendJourneyNow(currentJourneyId);
      console.log('📊 sendJourneyNow complete:', sendResults);
      setIsSendingEmails(false);

      // Refresh journey data for visual tracking (reload from Firestore)
      try {
        const journeyData = await loadJourney(currentJourneyId);
        if (journeyData?.prospects) {
          setJourneyProspects(journeyData.prospects);
          console.log('👥 Updated prospect positions:', journeyData.prospects.map(p => ({
            email: p.email,
            currentNodeId: p.currentNodeId,
            status: p.status
          })));
        }
        // Also refresh nodes to update email statuses (DRAFT -> SENT)
        if (journeyData?.nodes) {
          setNodes(journeyData.nodes);
          console.log('📧 Updated node statuses');
        }
      } catch (e) {
        console.warn('Could not refresh journey data:', e);
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
          console.log('📧 Updated node statuses after RUN ALL');
        }
        if (journeyData?.prospects) {
          setJourneyProspects(journeyData.prospects);
        }
      } catch (e) {
        console.warn('Could not refresh journey data:', e);
      }

      // Show detailed results
      let resultMessage = `📧 Email Campaign Sent!\n\n`;
      resultMessage += `✅ Successfully sent: ${results.sent}\n`;
      if (results.failed > 0) {
        resultMessage += `❌ Failed: ${results.failed}\n`;
      }
      resultMessage += `\nEmails sent via Resend ESP.`;

      // Log details to console
      console.log('📧 Send results:', results);
      if (results.details) {
        results.details.forEach((d, i) => {
          console.log(`  ${i + 1}. ${d.to}: ${d.status}${d.error ? ` - ${d.error}` : ''}`);
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
  const handleAddNote = () => {
    setIsUploadModalOpen(true);
  };

  // Count email nodes for credit enforcement
  const emailNodeCount = useMemo(() => {
    return nodes.filter(n => n.type === 'emailNode').length;
  }, [nodes]);

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

  // Deselect all nodes
  const handleDeselect = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
  }, [setNodes]);

  // Delete selected nodes
  const handleDeleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;
    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
    setEdges((eds) =>
      eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target))
    );
  }, [nodes, setNodes, setEdges]);

  // Keyboard shortcuts hook
  const { showHelp: showShortcutsHelp, setShowHelp: setShowShortcutsHelp } = useKeyboardShortcuts({
    onSave: handleSaveJourney,
    onExport: handleExportJSON,
    onAddCard: () => handleAddCard('note'),
    onDelete: handleDeleteSelected,
    onDeselect: handleDeselect,
    onPan: handlePan,
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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 20 }}>
      {/* Loading Skeleton - shown while initializing */}
      {!isInitialized && <LoadingSkeleton nodeCount={4} />}

      {/* Keyboard Shortcuts Help Modal */}
      <ShortcutsHelpModal
        show={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

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
        {/* STUDIO Mode - Asset Creation Suite (Modal Overlay) */}
        {currentMode === 'studio' && (
          <UnityStudioCanvas
            isDarkTheme={false}
            initialContext={studioContext}
            onClose={() => {
              setStudioContext(null); // Clear context when closing
              handleModeChange('notes');
            }}
            onExportToMAP={(asset) => {
              // Save template to localStorage for MAP to pick up
              const templates = JSON.parse(localStorage.getItem('unity-studio-templates') || '[]');
              templates.push({
                ...asset,
                id: `template-${Date.now()}`,
                createdAt: new Date().toISOString()
              });
              localStorage.setItem('unity-studio-templates', JSON.stringify(templates));
            }}
            onSaveToCanvas={(nodeData) => {
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
            }}
          />
        )}
        {/* ReactFlow Canvas - Always render but hide when studio is open */}
        <div style={{ display: currentMode === 'studio' ? 'none' : 'block', height: '100%' }}>
          {/* Override React Flow's default overflow:hidden on nodes to show delete buttons */}
          <style>{`
            .react-flow__node,
            .react-flow__node > div,
            .react-flow__node-textNode,
            .react-flow__node-photoNode {
              overflow: visible !important;
            }
          `}</style>
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
      </div>

      {/* Status Bar is now integrated into UnityCircleNav */}

      {/* Mobile Node Navigator - Jump between canvas areas */}
      <MobileNodeNavigator nodes={nodes} />

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
            { key: 'studio', label: 'STUDIO', icon: '🎨', color: '#d97706' }
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

        {/* Main Zoom Controls - Compact */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '8px 6px',
          borderRadius: showModePanel ? '0 6px 6px 0' : '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)'
        }}>
        {/* Zoom In Button */}
        <button
          onClick={() => zoomIn({ duration: 200 })}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgb(251, 191, 36)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'black',
            transition: 'background-color 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5b000';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(251, 191, 36)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Zoom In"
        >
+
        </button>

        {/* Zoom Level Indicator */}
        <div style={{
          fontSize: '9px',
          fontWeight: '600',
          color: 'rgba(0, 0, 0, 0.6)',
          letterSpacing: '0.02em',
          textAlign: 'center',
          minWidth: '32px'
        }}>
          {Math.round(zoomLevel * 100)}%
        </div>

        {/* Zoom Out Button */}
        <button
          onClick={() => zoomOut({ duration: 200 })}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgb(251, 191, 36)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'black',
            transition: 'background-color 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5b000';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(251, 191, 36)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Zoom Out"
        >
−
        </button>

        {/* Center/Fit View Button */}
        <button
          onClick={() => fitView({ duration: 400, padding: 0.2 })}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'black',
            transition: 'background-color 0.2s, transform 0.2s',
            marginTop: '2px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.2)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Center View"
        >
⊙
        </button>

        {/* Auto-Layout Button */}
        <button
          onClick={handleAutoLayout}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'black',
            transition: 'background-color 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Auto-Organize Nodes"
        >
⊞
        </button>

        {/* MAP-specific controls moved to UnityCircleNav for cleaner zoom module */}

        {/* Divider */}
        <div style={{ width: '24px', height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />

        {/* Mode Toggle Button */}
        <button
          onClick={() => setShowModePanel(!showModePanel)}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: showModePanel ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0, 0, 0, 0.04)',
            border: `1px solid ${showModePanel ? 'rgba(251, 191, 36, 0.5)' : 'rgba(0, 0, 0, 0.12)'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            color: showModePanel ? '#b45309' : 'black',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!showModePanel) {
              e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }
          }}
          onMouseLeave={(e) => {
            if (!showModePanel) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          title={showModePanel ? 'Hide Modes' : 'Switch Mode'}
        >
{showModePanel ? '◀' : '▶'}
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
        // Status bar props
        nodeCount={nodes.length}
        nodeLimit={nodeLimit}
        lastSavedAt={lastSavedAt}
        onShortcutsClick={() => setShowShortcutsHelp(true)}
      />

      {/* Empty State - Centered above CircleNav with chevron */}
      {nodes.length === 0 && (
        <div style={{
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
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#000',
            marginBottom: '6px',
            textAlign: 'center',
          }}>
            Start Brainstorming
          </h2>
          <p style={{
            fontSize: '12px',
            color: 'rgba(0, 0, 0, 0.6)',
            lineHeight: '1.4',
            textAlign: 'center',
          }}>
            Click the <span style={{ color: 'rgb(251, 191, 36)', fontWeight: '700' }}>+</span> below to get started.
          </p>
          {/* Chevron pointing down */}
          <div style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(255, 255, 255, 0.95)',
          }} />
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
        onEditCampaign={handleMenuEditCampaign}
        emailCount={emailNodeCount}
        emailLimit={emailLimit}
        hasCampaign={hasCampaign}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        capsuleId={currentCapsuleId}
        title={canvasTitle}
        isPublic={isPublic}
        collaborators={collaborators}
        onUpdateVisibility={handleUpdateVisibility}
        onAddCollaborator={handleAddCollaborator}
        onRemoveCollaborator={handleRemoveCollaborator}
        shareLink={shareUrl}
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

      {/* Dev Tools Panel - Cmd+Shift+D to toggle */}
      {showDevTools && (
        <div
          style={{
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
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ color: 'rgb(251, 191, 36)', fontWeight: '700', fontSize: '12px' }}>
              🛠️ DEV TOOLS
            </span>
            <button
              onClick={() => setShowDevTools(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ×
            </button>
          </div>

          {/* Status indicators */}
          <div style={{ marginBottom: '12px', fontSize: '10px', color: '#9ca3af' }}>
            {/* SSO Auth Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>SSO Auth:</span>
              <span style={{ color: isAuthenticated ? '#22c55e' : '#6b7280' }}>
                {isAuthenticated ? (userProfile?.email || 'Logged In') : 'Anonymous'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Cloud Sync:</span>
              <span style={{ color: isCloudSynced ? '#22c55e' : '#6b7280' }}>
                {isCloudSynced ? 'ON' : 'OFF'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Credits:</span>
              <span style={{ color: '#fbbf24' }}>
                {tier === 'premium' ? '∞ PRO' : `${creditsRemaining}`}
              </span>
            </div>
            <div style={{
              height: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              margin: '6px 0'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Admin:</span>
              <span style={{ color: isAdmin ? '#22c55e' : '#6b7280' }}>
                {isAdmin ? 'YES' : 'NO'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Hub Auth:</span>
              <span style={{ color: localStorage.getItem('outreach_business_auth') === 'true' ? '#22c55e' : '#ef4444' }}>
                {localStorage.getItem('outreach_business_auth') === 'true' ? 'ON' : 'OFF'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Nodes:</span>
              <span style={{ color: '#60a5fa' }}>{nodes.length}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button onClick={devToolsActions.clearCredits} style={devBtnStyle}>
              Clear Credits
            </button>
            <button onClick={devToolsActions.clearCanvasOnly} style={{ ...devBtnStyle, backgroundColor: '#dc2626' }}>
              Clear Canvas
            </button>
            <button onClick={devToolsActions.clearHubSettings} style={{ ...devBtnStyle, backgroundColor: '#f59e0b' }}>
              Clear Hub Settings
            </button>
            <button onClick={devToolsActions.clearLocalStorage} style={{ ...devBtnStyle, backgroundColor: '#ef4444' }}>
              Clear ALL localStorage
            </button>
            <button onClick={devToolsActions.viewState} style={{ ...devBtnStyle, backgroundColor: '#3b82f6' }}>
              Log State (F12)
            </button>
          </div>

          {/* Admin Section - Only visible for authenticated admins */}
          {isAdmin && (
            <>
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '10px', display: 'block', marginBottom: '8px' }}>
                  ⚠️ ADMIN TOOLS
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button onClick={devToolsActions.getCapsuleStats} style={{ ...devBtnStyle, backgroundColor: '#8b5cf6' }}>
                    📊 Capsule Stats
                  </button>
                  <button onClick={devToolsActions.migrateCapsules} style={{ ...devBtnStyle, backgroundColor: '#059669' }}>
                    🔄 Migrate v1→v2
                  </button>
                  <button onClick={devToolsActions.cleanupCapsules} style={{ ...devBtnStyle, backgroundColor: '#dc2626' }}>
                    🗑️ Cleanup Old Capsules
                  </button>
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: '12px', fontSize: '9px', color: '#6b7280', textAlign: 'center' }}>
            Cmd+Shift+D to toggle
          </div>
        </div>
      )}
    </div>
  );
};

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
