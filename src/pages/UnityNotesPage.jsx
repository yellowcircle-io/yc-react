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
  NodeResizer
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
import { LoadingSkeleton, StatusBar, useKeyboardShortcuts, ShortcutsHelpModal, MobileNodeNavigator } from '../components/unity';
import { useIOSPinchZoom } from '../hooks/useIOSPinchZoom';
import notificationManager, { NotificationType } from '../utils/notificationManager';
import { showToast } from '../utils/toast';

// Export NodeResizer for use in node components
export { NodeResizer };

// Touch-Friendly Resizable Node Wrapper - adds NodeResizer with enhanced mobile support
const withResizableHandles = (NodeComponent, minWidth = 150, minHeight = 100) => {
  return React.memo((props) => {
    const { id, selected, data } = props;

    return (
      <>
        <NodeResizer
          nodeId={id}
          isVisible={selected}
          minWidth={minWidth}
          minHeight={minHeight}
          color="#f59e0b"
          handleClassName="nodrag"
          handleStyle={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: 'rgba(254, 243, 199, 0.95)',
            border: '3.5px solid #f59e0b',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          }}
          onResizeEnd={(event, params) => {
            // Call the onResize callback if provided in node data
            if (data?.onResize) {
              data.onResize(id, { width: params.width, height: params.height });
            }
          }}
        />
        <NodeComponent {...props} />
      </>
    );
  });
};

// Comment Badge Wrapper - adds comment count badge to any node type
const withCommentBadge = (NodeComponent) => {
  return React.memo((props) => {
    const { data } = props;
    const commentCount = data?.commentCount || 0;

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <NodeComponent {...props} />
        {commentCount > 0 && (
          <div className="comment-count-badge">
            {commentCount}
          </div>
        )}
      </div>
    );
  });
};

// Compose both wrappers - resizable + comment badge
const withAllEnhancements = (NodeComponent, minWidth, minHeight) => {
  const ResizableNode = withResizableHandles(NodeComponent, minWidth, minHeight);
  return withCommentBadge(ResizableNode);
};

// Haptic feedback utility for mobile touch interactions
// Provides tactile feedback on supported devices (iOS Safari 13+, Android Chrome 87+)
const triggerHaptic = (type = 'light') => {
  // Check if Vibration API is supported
  if (!navigator.vibrate) return;

  // Respect user's reduced motion preferences
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Vibration patterns in milliseconds [vibrate, pause, vibrate, ...]
  const patterns = {
    light: [10],              // Quick tap feedback for buttons
    medium: [20],             // Standard action feedback (node drag, create)
    heavy: [30],              // Important action (delete, major change)
    success: [10, 50, 10],    // Success pattern (save, completion)
    error: [50, 100, 50],     // Error/warning pattern
    double: [10, 100, 10]     // Double-tap detection
  };

  try {
    navigator.vibrate(patterns[type] || patterns.light);
  } catch (e) {
    // Silently fail if vibration not supported
    console.debug('Haptic feedback not available:', e.message);
  }
};

const nodeTypes = {
  photoNode: withAllEnhancements(DraggablePhotoNode, 200, 200),
  textNode: withAllEnhancements(TextNoteNode, 150, 100),
  // UnityMAP journey node types - wrap each with all enhancements
  ...Object.fromEntries(
    Object.entries(mapNodeTypes).map(([key, Component]) => [
      key, withAllEnhancements(Component, 180, 120)
    ])
  ),
  // Premium Unity+ node types - wrap each with all enhancements
  ...Object.fromEntries(
    Object.entries(premiumNodeTypes).map(([key, Component]) => [
      key, withAllEnhancements(Component, 150, 100)
    ])
  )
};

const STORAGE_KEY = 'unity-notes-data';
const FREE_NODE_LIMIT = 10;
const PRO_NODE_LIMIT = 100;

// Node color presets for customization
const NODE_COLOR_PRESETS = ['amber', 'blue', 'green', 'purple', 'pink', 'red', 'gray', 'emerald'];

// Card type configuration (same as UnityNotes Plus)
const CARD_TYPES = {
  photo: { label: 'Photo', icon: '🖼️', color: 'rgb(251, 191, 36)' },
  note: { label: 'Note', icon: '📝', color: 'rgb(251, 191, 36)' },
  link: { label: 'Link', icon: '🔗', color: '#b45309' },
  ai: { label: 'AI Chat', icon: '🤖', color: '#d97706' },
  video: { label: 'Video', icon: '📹', color: '#f59e0b' },
};

const UnityNotesFlow = ({ isUploadModalOpen, setIsUploadModalOpen, onFooterToggle, showParallax, setShowParallax }) => {
  const { fitView, zoomIn, zoomOut, getZoom, setViewport, getViewport, setCenter } = useReactFlow();
  const { sidebarOpen } = useLayout();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
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

  // Calculate comment counts for each node based on edges from commentNodes
  const commentCounts = useMemo(() => {
    const counts = {};

    // Find all comment nodes
    const commentNodeIds = new Set(
      nodes
        .filter(node => node.type === 'commentNode')
        .map(node => node.id)
    );

    // Count edges where source is a comment node and target is another node
    edges.forEach(edge => {
      if (commentNodeIds.has(edge.source)) {
        counts[edge.target] = (counts[edge.target] || 0) + 1;
      }
    });

    return counts;
  }, [nodes, edges]);

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
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true); // Canvas minimap toggle
  const [showOverviewTray, setShowOverviewTray] = useState(false); // Right-side overview panel
  const [notifications, setNotifications] = useState([]); // In-app notifications

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

  // Floating toolbar state for single-node quick actions
  const [floatingToolbar, setFloatingToolbar] = useState({ visible: false, nodeId: null, position: { x: 0, y: 0 } });

  // Theme state - persisted to localStorage
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('unity-notes-theme') || 'light';
    } catch {
      return 'light';
    }
  });

  // Theme selector dropdown visibility state
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Background pattern state - persisted to localStorage
  const [backgroundPattern, setBackgroundPattern] = useState(() => {
    try {
      return localStorage.getItem('unity-notes-background-pattern') || 'dots';
    } catch {
      return 'dots';
    }
  });

  // Background pattern selector dropdown visibility state
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);

  // Custom accent color state - persisted to localStorage
  const [customAccentColor, setCustomAccentColor] = useState(() => {
    try {
      return localStorage.getItem('unity-notes-accent-color') || 'amber';
    } catch {
      return 'amber';
    }
  });

  // Color picker dropdown visibility state
  const [showColorPicker, setShowColorPicker] = useState(false);

  // AI Conversation History - persisted per capsule for context-aware interactions
  // Stores { role: 'user' | 'assistant', content: string, timestamp: number, nodeId?: string }
  const [aiConversationHistory, setAiConversationHistory] = useState(() => {
    try {
      const capsuleKey = `unity-notes-ai-history-${currentCapsuleId || 'default'}`;
      const saved = localStorage.getItem(capsuleKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Theme configurations
  const themes = {
    light: {
      background: '#ffffff',
      canvasBg: '#fafafa',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      cardBg: '#ffffff',
      dotColor: '#e5e7eb',
      minimapBg: 'rgba(255, 255, 255, 0.9)',
      minimapBorder: '#e5e7eb',
      buttonBg: '#f3f4f6',
      buttonHover: '#e5e7eb',
    },
    dark: {
      background: '#111827',
      canvasBg: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#9ca3af',
      border: '#374151',
      cardBg: '#1f2937',
      dotColor: '#374151',
      minimapBg: 'rgba(31, 41, 55, 0.9)',
      minimapBorder: '#374151',
      buttonBg: '#374151',
      buttonHover: '#4b5563',
    },
    sunset: {
      background: '#2d1b3d',
      canvasBg: '#3d2750',
      text: '#fef3c7',
      textSecondary: '#fde68a',
      border: '#92400e',
      cardBg: '#4c2f5e',
      dotColor: '#92400e',
      minimapBg: 'rgba(61, 39, 80, 0.9)',
      minimapBorder: '#92400e',
      buttonBg: '#5b3470',
      buttonHover: '#6d3f85',
    },
  };

  const currentTheme = themes[theme] || themes.light;

  // Accent color palette for custom theming
  const accentColors = {
    amber: { name: 'Amber', color: '#f59e0b', hover: '#d97706', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.4)' },
    blue: { name: 'Blue', color: '#3b82f6', hover: '#2563eb', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.4)' },
    purple: { name: 'Purple', color: '#a855f7', hover: '#9333ea', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.4)' },
    green: { name: 'Green', color: '#10b981', hover: '#059669', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.4)' },
    pink: { name: 'Pink', color: '#ec4899', hover: '#db2777', bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.4)' },
    red: { name: 'Red', color: '#ef4444', hover: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.4)' },
  };

  const currentAccentColor = accentColors[customAccentColor] || accentColors.amber;

  // Persist theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('unity-notes-theme', theme);
    } catch (e) {
      console.error('Failed to persist theme:', e);
    }
  }, [theme]);

  // Persist background pattern to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('unity-notes-background-pattern', backgroundPattern);
    } catch (e) {
      console.error('Failed to persist background pattern:', e);
    }
  }, [backgroundPattern]);

  // Persist custom accent color to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('unity-notes-accent-color', customAccentColor);
    } catch (e) {
      console.error('Failed to persist accent color:', e);
    }
  }, [customAccentColor]);

  // Persist AI conversation history to localStorage per capsule
  useEffect(() => {
    try {
      const capsuleKey = `unity-notes-ai-history-${currentCapsuleId || 'default'}`;
      localStorage.setItem(capsuleKey, JSON.stringify(aiConversationHistory));
    } catch (error) {
      console.warn('Failed to persist AI conversation history:', error);
    }
  }, [aiConversationHistory, currentCapsuleId]);

  // Subscribe to notification manager updates
  useEffect(() => {
    // Initialize with current notifications
    setNotifications(notificationManager.getAll());

    // Subscribe to updates
    const unsubscribe = notificationManager.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Click-outside detection for theme selector dropdown
  useEffect(() => {
    if (!showThemeSelector) return;

    const handleClickOutside = (event) => {
      const themeSelector = document.getElementById('theme-selector-dropdown');
      const themeButton = document.getElementById('theme-selector-button');

      if (themeSelector && themeButton &&
          !themeSelector.contains(event.target) &&
          !themeButton.contains(event.target)) {
        setShowThemeSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThemeSelector]);

  // Click-outside detection for background pattern selector dropdown
  useEffect(() => {
    if (!showBackgroundSelector) return;

    const handleClickOutside = (event) => {
      const backgroundSelector = document.getElementById('background-selector-dropdown');
      const backgroundButton = document.getElementById('background-selector-button');

      if (backgroundSelector && backgroundButton &&
          !backgroundSelector.contains(event.target) &&
          !backgroundButton.contains(event.target)) {
        setShowBackgroundSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBackgroundSelector]);

  // Click-outside detection for color picker dropdown
  useEffect(() => {
    if (!showColorPicker) return;

    const handleClickOutside = (event) => {
      const colorPicker = document.getElementById('color-picker-dropdown');
      const colorButton = document.getElementById('color-picker-button');

      if (colorPicker && colorButton &&
          !colorPicker.contains(event.target) &&
          !colorButton.contains(event.target)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  // ========================================================================
  // AI Conversation History Utilities
  // ========================================================================

  // Record a conversation exchange in the AI history
  const recordConversation = useCallback((userPrompt, aiResponse, nodeId = null) => {
    const timestamp = Date.now();
    setAiConversationHistory(prev => [
      ...prev,
      { role: 'user', content: userPrompt, timestamp, nodeId },
      { role: 'assistant', content: aiResponse, timestamp, nodeId }
    ].slice(-100)); // Keep only last 100 messages (50 exchanges) to prevent unbounded growth
  }, []);

  // Get relevant conversation history for a given node or global context
  const getRelevantHistory = useCallback((nodeId = null, maxExchanges = 3) => {
    // Filter history: global messages (no nodeId) + messages for this specific node
    const relevantMessages = aiConversationHistory.filter(msg =>
      !msg.nodeId || msg.nodeId === nodeId
    );

    // Get last N exchanges (N*2 messages)
    return relevantMessages.slice(-(maxExchanges * 2));
  }, [aiConversationHistory]);

  // Build a context-aware prompt that includes conversation history
  const buildContextAwarePrompt = useCallback((prompt, nodeId = null, maxExchanges = 3) => {
    const history = getRelevantHistory(nodeId, maxExchanges);

    if (history.length === 0) {
      return prompt;
    }

    // Format history as a conversation
    const historyText = history
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    return `Previous conversation context:\n${historyText}\n\nCurrent request:\n${prompt}`;
  }, [getRelevantHistory]);

  // Save conversation history to localStorage when it changes
  useEffect(() => {
    if (currentCapsuleId && aiConversationHistory.length > 0) {
      const capsuleKey = `unity-notes-ai-history-${currentCapsuleId}`;
      try {
        localStorage.setItem(capsuleKey, JSON.stringify(aiConversationHistory));
      } catch (err) {
        console.warn('Failed to save AI conversation history:', err);
      }
    }
  }, [aiConversationHistory, currentCapsuleId]);

  // Clear conversation history when switching capsules
  useEffect(() => {
    if (currentCapsuleId) {
      const capsuleKey = `unity-notes-ai-history-${currentCapsuleId}`;
      try {
        const saved = localStorage.getItem(capsuleKey);
        setAiConversationHistory(saved ? JSON.parse(saved) : []);
      } catch {
        setAiConversationHistory([]);
      }
    }
  }, [currentCapsuleId]);

  // Handler for opening Studio from AI Chat with conversation context
  const handleOpenStudio = useCallback((context) => {
    setStudioContext(context);
    handleModeChange('studio');
  }, []);

  // AI Conversation History Helper Functions
  const updateAiConversationHistory = useCallback((role, content, nodeId = null) => {
    const newMessage = {
      role, // 'user' or 'assistant'
      content,
      timestamp: Date.now(),
      ...(nodeId && { nodeId }) // Include nodeId if provided
    };

    setAiConversationHistory(prev => {
      const updated = [...prev, newMessage];
      // Keep only last 50 messages to avoid localStorage limits
      return updated.slice(-50);
    });
  }, []);

  const clearAiConversationHistory = useCallback(() => {
    setAiConversationHistory([]);
    if (currentCapsuleId) {
      const capsuleKey = `unity-notes-ai-history-${currentCapsuleId}`;
      try {
        localStorage.removeItem(capsuleKey);
      } catch (err) {
        console.warn('Failed to clear AI conversation history:', err);
      }
    }
  }, [currentCapsuleId]);

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

  // Fetch bookmarked capsules when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      getBookmarkedCapsules(user.uid)
        .then(capsules => {
          setBookmarkedCapsules(capsules);
          console.log(`✅ Loaded ${capsules.length} bookmarked capsules`);
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
        console.log('💾 Capsule ID persisted to localStorage:', currentCapsuleId);
      } catch (e) {
        console.error('Failed to persist capsule ID:', e);
      }
    }
  }, [currentCapsuleId]);

  // Track if capsule has been loaded this session (to avoid re-loading)
  const capsuleLoadedRef = React.useRef(false);
  // Guard flag to prevent auto-save during clear operation (prevents race condition)
  const isClearingRef = useRef(false);

  // Ref for ReactFlow container to enable iOS Safari pinch-to-zoom
  // This ref is attached to the wrapper div and consumed by useIOSPinchZoom hook
  // for reliable two-finger pinch gesture detection on iOS devices
  const reactFlowContainerRef = useRef(null);

  // Track whether a node is currently being dragged to prevent conflicts with canvas panning
  // This helps distinguish between node-level interactions (dragging nodes) and canvas-level
  // interactions (panning the viewport), improving touch gesture reliability on mobile devices
  const isDraggingNodeRef = useRef(false);

  // Track when node drag ends to prevent false clicks immediately after dragging
  // This debounce mechanism prevents nodes from being selected when user releases after drag
  const dragEndTimeRef = useRef(0);

  // Track canvas pan gesture state to distinguish from node interactions
  // This prevents false positives where node clicks/drags are incorrectly flagged as canvas panning
  // panStartRef stores: { x, y, time, hasMoved, lastX, lastY, lastTime, isTouch } when pan starts
  // Enhanced with velocity and directional tracking for better touch/mobile pan detection
  const panStartRef = useRef({ x: 0, y: 0, time: 0, hasMoved: false, lastX: 0, lastY: 0, lastTime: 0, isTouch: false });
  const [_isPanning, setIsPanning] = useState(false);

  // Visual feedback state for active panning on touch devices
  // Shows a subtle indicator when panning is detected to help users distinguish between pan and tap gestures
  const [showPanningIndicator, setShowPanningIndicator] = useState(false);

  // Track previously selected node ID to enable smarter toolbar display
  // Toolbar will only appear when re-selecting or double-clicking, not on every selection
  const previouslySelectedNodeRef = useRef(null);

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
          console.log('📂 Loading capsule for editing:', capsuleToLoad);
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
              console.log('📦 Prepared', preparedNodes.length, 'nodes for rendering');

              const nodesWithCallbacks = preparedNodes.map((node) => {
                if (node.type === 'todoNode') {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      onUpdateItems: (nodeId, newItems) => {
                        console.log('🔄 onUpdateItems called:', nodeId, newItems);
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === nodeId
                              ? { ...n, data: { ...n.data, items: newItems } }
                              : n
                          )
                        );
                      },
                      onTitleChange: (nodeId, newTitle) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === nodeId
                              ? { ...n, data: { ...n.data, title: newTitle } }
                              : n
                          )
                        );
                      },
                      onDelete: (nodeId) => {
                        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
                        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
                      },
                    },
                  };
                }
                // GroupNode needs special callbacks for label, color, resize
                if (node.type === 'groupNode') {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      onLabelChange: (nodeId, label) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === nodeId
                              ? { ...n, data: { ...n.data, label } }
                              : n
                          )
                        );
                      },
                      onResize: (nodeId, width, height) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === nodeId
                              ? { ...n, data: { ...n.data, width, height } }
                              : n
                          )
                        );
                      },
                      onColorChange: (nodeId, color) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === nodeId
                              ? { ...n, data: { ...n.data, color } }
                              : n
                          )
                        );
                      },
                      onDelete: (nodeId) => {
                        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
                        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
                      },
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
                      groqApiKey: storedGroqKey, // Pass API key from Firestore
                      onDelete: (nodeId) => {
                        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
                        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
                      },
                      onChangeColor: handleChangeNodeColor,
                      colorPresets: NODE_COLOR_PRESETS,
                    },
                  };
                }
                if (['stickyNode', 'commentNode', 'linkNode'].includes(node.type)) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      onDelete: (nodeId) => {
                        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
                        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
                      },
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
                      apiKey: storedGoogleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '', // Google Maps API key
                      onDataChange: (nodeId, updates) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === nodeId
                              ? { ...n, data: { ...n.data, ...updates } }
                              : n
                          )
                        );
                      },
                      onDelete: (nodeId) => {
                        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
                        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
                      },
                    },
                  };
                }
                // MapNode also needs Google Maps API key
                if (node.type === 'mapNode') {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      apiKey: storedGoogleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
                      onDelete: (nodeId) => {
                        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
                        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
                      },
                    },
                  };
                }
                return node;
              });
              console.log('✅ Injected callbacks into', nodesWithCallbacks.length, 'nodes');
              setNodes(nodesWithCallbacks);

              // Restore starred node IDs from capsule data
              // This preserves star state when loading saved capsules
              const loadedStarredIds = preparedNodes
                .filter(n => n.data?.isStarred)
                .map(n => n.id);
              if (loadedStarredIds.length > 0) {
                setStarredNodeIds(new Set(loadedStarredIds));
                console.log('⭐ Restored', loadedStarredIds.length, 'starred nodes from capsule');
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
            }

            // Check if user can edit this capsule (admins can always edit)
            if (user?.uid) {
              const access = await checkAccess(capsuleToLoad, user.uid, user.email);
              const canEdit = access.role === 'owner' || access.role === 'editor' || isAdmin;
              setCanEditCapsule(canEdit);
              console.log('🔐 Capsule access:', access.role, '- Can edit:', canEdit, '- isAdmin:', isAdmin);
            }

            // Generate share URL for the loaded capsule
            const url = `${window.location.origin}/unity-notes/view/${capsuleToLoad}`;
            setShareUrl(url);

            // Update browser URL if loading from localStorage (no URL param)
            if (!capsuleParam && capsuleToLoad) {
              const editUrl = `${window.location.pathname}?capsule=${capsuleToLoad}`;
              window.history.replaceState({}, '', editUrl);
            }

            console.log('✅ Loaded capsule:', capsuleToLoad, '- Nodes:', capsuleData.nodes?.length || 0, '- Collaborators:', capsuleData.metadata?.collaborators?.length || 0);
          }
        } catch (err) {
          console.error('❌ Failed to load capsule:', err);
          capsuleLoadedRef.current = false; // Allow retry on next render
          // Clear the stored capsule ID if it's invalid
          localStorage.removeItem('unity-notes-current-capsule');
          setCurrentCapsuleId('');
          showToast('Failed to load the capsule. It may have been deleted or the link is invalid.', 'error');
        }
      };
      loadSharedCapsule();
    }
  }, [searchParams, isInitialized, currentCapsuleId, loadCapsule, setNodes, setEdges, storedGroqKey, storedGoogleMapsKey, user, checkAccess]);

  // Update canEditCapsule when isAdmin changes (admin check loads async from Firestore)
  useEffect(() => {
    if (isAdmin && currentCapsuleId && !canEditCapsule) {
      console.log('🔐 Admin access granted - enabling capsule edit');
      setCanEditCapsule(true);
    }
  }, [isAdmin, currentCapsuleId, canEditCapsule]);

  // Update existing textNodes when storedGroqKey becomes available (async loading fix)
  useEffect(() => {
    if (storedGroqKey && nodes.length > 0) {
      const hasTextNodes = nodes.some(n => n.type === 'textNode');
      if (hasTextNodes) {
        console.log('🔑 Updating textNodes with Groq API key from Firestore');
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
        console.log('🗺️ Updating map nodes with Google Maps API key');
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
      showToast('localStorage cleared. Refresh to see changes.', 'success');
    },
    clearCanvasOnly: () => {
      localStorage.removeItem(STORAGE_KEY);
      setNodes([]);
      setEdges([]);
      showToast('Canvas cleared.', 'success');
    },
    clearCredits: () => {
      localStorage.removeItem('yc_credits');
      localStorage.removeItem('yc_credits_used');
      showToast('Credits cleared.', 'success');
    },
    clearHubSettings: () => {
      localStorage.removeItem('outreach_business_settings_v4');
      localStorage.removeItem('outreach_business_auth');
      showToast('Hub settings cleared.', 'success');
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
      showToast('State logged to console (F12)', 'info');
    },
    // Admin functions - only visible when bypass is active
    migrateCapsules: async () => {
      if (!confirm('⚠️ ADMIN: Migrate all v1 capsules to v2?\n\nThis will:\n- Convert subcollections to embedded arrays\n- Delete old subcollection documents\n- Reduce Firestore costs\n\nContinue?')) return;
      try {
        const result = await migrateToV2();
        showToast(`Migration complete!\n\nMigrated: ${result.migrated}\nAlready v2: ${result.alreadyV2}\nFailed: ${result.failed}`, 'success');
      } catch (err) {
        showToast(`Migration failed: ${err.message}`, 'error');
      }
    },
    cleanupCapsules: async () => {
      if (!confirm('⚠️ ADMIN: Cleanup old capsules?\n\nThis will delete capsules:\n- Older than 30 days\n- With less than 5 views\n\nContinue?')) return;
      try {
        const result = await cleanupOldCapsules(30, 5);
        showToast(`Cleanup complete!\n\nDeleted: ${result.deleted}\nKept: ${result.kept}`, 'success');
      } catch (err) {
        showToast(`Cleanup failed: ${err.message}`, 'error');
      }
    },
    getCapsuleStats: async () => {
      try {
        const stats = await getCapsuleStats();
        showToast(`📊 Capsule Stats:\n\nTotal: ${stats.total}\nTotal Views: ${stats.totalViews}\nOld (>30 days): ${stats.oldCapsules}\nLow Views (<5): ${stats.lowViewCapsules}`, 'info');
        console.log('Capsule Stats:', stats);
      } catch (err) {
        showToast(`Stats failed: ${err.message}`, 'error');
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

  // ============================================================
  // UNDO/REDO SYSTEM
  // ============================================================

  // History state - tracks past and future states for undo/redo
  const historyRef = useRef({
    past: [],
    future: []
  });

  // Flag to prevent recording history during undo/redo operations
  const isUndoRedoActionRef = useRef(false);

  // Record current state to history before making changes
  const recordHistory = useCallback(() => {
    // Don't record if we're in the middle of an undo/redo operation
    if (isUndoRedoActionRef.current) {
      return;
    }

    // Deep clone current nodes and edges to avoid reference issues
    const currentState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges))
    };

    // Add to past array
    historyRef.current.past.push(currentState);

    // Clear future array (new action invalidates redo history)
    historyRef.current.future = [];

    // Limit history to 50 entries (remove oldest if exceeded)
    if (historyRef.current.past.length > 50) {
      historyRef.current.past.shift();
    }

    console.log('📝 History recorded:', {
      past: historyRef.current.past.length,
      future: historyRef.current.future.length
    });
  }, [nodes, edges]);

  // Undo - restore previous state
  const handleUndo = useCallback(() => {
    if (historyRef.current.past.length === 0) {
      console.log('⚠️ No more undo history');
      return;
    }

    // Set flag to prevent recording this change
    isUndoRedoActionRef.current = true;

    // Save current state to future
    const currentState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges))
    };
    historyRef.current.future.push(currentState);

    // Pop last state from past
    const previousState = historyRef.current.past.pop();

    // Restore the previous state
    setNodes(previousState.nodes);
    setEdges(previousState.edges);

    console.log('↶ Undo:', {
      past: historyRef.current.past.length,
      future: historyRef.current.future.length
    });

    // Reset flag after state updates
    setTimeout(() => {
      isUndoRedoActionRef.current = false;
    }, 0);
  }, [nodes, edges, setNodes, setEdges]);

  // Redo - restore next state
  const handleRedo = useCallback(() => {
    if (historyRef.current.future.length === 0) {
      console.log('⚠️ No more redo history');
      return;
    }

    // Set flag to prevent recording this change
    isUndoRedoActionRef.current = true;

    // Save current state to past
    const currentState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges))
    };
    historyRef.current.past.push(currentState);

    // Pop last state from future
    const nextState = historyRef.current.future.pop();

    // Restore the next state
    setNodes(nextState.nodes);
    setEdges(nextState.edges);

    console.log('↷ Redo:', {
      past: historyRef.current.past.length,
      future: historyRef.current.future.length
    });

    // Reset flag after state updates
    setTimeout(() => {
      isUndoRedoActionRef.current = false;
    }, 0);
  }, [nodes, edges, setNodes, setEdges]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+Z (Mac) / Ctrl+Z (Windows) for undo
      // Cmd+Shift+Z (Mac) / Ctrl+Shift+Z (Windows) for redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();

        if (e.shiftKey) {
          // Redo
          handleRedo();
        } else {
          // Undo
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Wrap onNodesChange to track drag/resize operations for undo/redo
  // We track when drag/resize starts and record history at that point
  const nodeOperationStartRef = useRef(false);

  const onNodesChangeWithHistory = useCallback((changes) => {
    // Detect drag start or resize start
    const isDragStart = changes.some(change =>
      change.type === 'position' && change.dragging === true && !nodeOperationStartRef.current
    );
    const isResizeStart = changes.some(change =>
      change.type === 'dimensions' && !nodeOperationStartRef.current
    );

    // Record history when operation starts (not during or at end)
    if (isDragStart || isResizeStart) {
      recordHistory();
      nodeOperationStartRef.current = true;
    }

    // Detect drag end or resize end to reset flag
    const isDragEnd = changes.some(change =>
      change.type === 'position' && change.dragging === false
    );
    const isResizeEnd = changes.some(change =>
      change.type === 'dimensions'
    );

    if (isDragEnd || isResizeEnd) {
      nodeOperationStartRef.current = false;
    }

    // Call the original onNodesChange
    onNodesChange(changes);
  }, [onNodesChange, recordHistory]);

  // ============================================================
  // END UNDO/REDO SYSTEM
  // ============================================================

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
        showToast('AI image analysis requires sign-in.\n\nSign in to use your stored OpenAI API key.', 'warning');
      } else {
        showToast('No OpenAI API key found.\n\nGo to Hub → Settings to add your OpenAI API key.', 'warning');
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
      console.log('✅ AI Analysis:', messages[analysisType] || 'Analysis complete');

    } catch (error) {
      console.error('AI Analysis error:', error);
      showToast(`AI analysis failed: ${error.message}`, 'error');
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

  // Auto-fit viewport when nodes are added/changed
  // Uses requestAnimationFrame to ensure nodes are rendered to DOM before fitView calculates positions
  useEffect(() => {
    if (!fitView || nodes.length === 0) return;

    // Wait for next render cycle to ensure nodes are in DOM
    requestAnimationFrame(() => {
      fitView({
        padding: 0.2,        // 20% padding around nodes
        duration: 200,       // Smooth 200ms animation
        maxZoom: 1.5,        // Don't zoom in too much
        includeHiddenNodes: false
      });
    });
  }, [nodes, fitView]);

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

  // Handle direct delete from node (for text/non-photo nodes)
  // When deleting a group, unparent all children first to prevent orphaned nodes
  const handleDeleteNode = useCallback((nodeId) => {

    if (confirm('⚠️ Delete this note?\n\nThis cannot be undone.')) {
      // Haptic feedback for node deletion
      triggerHaptic('heavy');

      // Record history before deleting
      recordHistory();

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
  }, [setNodes, setEdges, recordHistory]);

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

  // Handle color change for nodes
  const handleChangeNodeColor = useCallback((nodeId, newColor) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                color: newColor,
                updatedAt: Date.now(),
              }
            }
          : node
      )
    );
  }, [setNodes]);

  // Callback for updating todo items (used for loaded nodes)
  const _handleUpdateTodoItems = useCallback((nodeId, newItems) => {
    console.log('🔄 handleUpdateTodoItems called:', nodeId, newItems);
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

  // iOS Safari pinch-to-zoom fix - DISABLED (see rationale below)
  //
  // RATIONALE: The useIOSPinchZoom hook uses non-passive event listeners in capture phase
  // which forces iOS Safari to delay gesture recognition while checking if preventDefault()
  // will be called. This causes the laggy/inconsistent pinch-to-zoom behavior we're trying to fix.
  //
  // SOLUTION: React Flow's built-in zoomOnPinch already handles iOS Safari pinch gestures correctly.
  // By disabling this custom hook and relying solely on React Flow's native gesture handling,
  // we get smooth, immediate gesture recognition without any JavaScript intervention delays.
  //
  // React Flow internally uses passive listeners and optimized touch event handling that works
  // perfectly with iOS Safari's gesture system. The custom hook was well-intentioned but actually
  // causes the performance issues it was trying to solve.
  //
  // If visual feedback is needed in the future, add ONLY passive event listeners that don't
  // call preventDefault() and don't interfere with React Flow's gesture handling.
  useIOSPinchZoom(reactFlowContainerRef, {
    enabled: false  // Disabled to allow React Flow's native gesture handling
  });

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

  // Handle node drag start - set flag to prevent canvas pan conflicts
  const _handleNodeDragStart = useCallback((event, node) => {
    // Don't handle groups dragging
    if (node.type === 'groupNode') return;

    // Haptic feedback for drag start
    triggerHaptic('light');

    // Set flag to indicate a node is being dragged
    // This prevents canvas panning from interfering with node drag operations
    isDraggingNodeRef.current = true;
  }, []);

  // Handle node drag - show drop target indicator on groups
  const handleNodeDrag = useCallback((event, node) => {
    // Don't handle groups dragging
    if (node.type === 'groupNode') return;

    setNodes((nds) => {
      return nds.map((n) => {
        if (n.type === 'groupNode') {
          const isOver = isNodeInsideGroup(node, n) && n.id !== node.parentId;
          return {
            ...n,
            data: { ...n.data, isDropTarget: isOver }
          };
        }
        return n;
      });
    });
  }, [setNodes, isNodeInsideGroup]);

  // Handle node drag stop - parent/unparent nodes to groups
  const handleNodeDragStop = useCallback((event, node) => {
    // Don't handle groups dragging
    if (node.type === 'groupNode') return;

    // Clear drag flag and record end time to prevent false clicks
    isDraggingNodeRef.current = false;
    dragEndTimeRef.current = Date.now();

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

      // Update child counts on groups
      updatedNodes = updatedNodes.map((n) => {
        if (n.type === 'groupNode') {
          const childCount = updatedNodes.filter(c => c.parentId === n.id).length;
          return { ...n, data: { ...n.data, childCount } };
        }
        return n;
      });

      // Auto-scale groups to fit children (only expand, never shrink)
      updatedNodes = updatedNodes.map((n) => {
        if (n.type !== 'groupNode') return n;

        const children = updatedNodes.filter(c => c.parentId === n.id);
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

  // Handle canvas pan start - detect if user is panning canvas vs interacting with nodes
  // This prevents false positives where node clicks/drags are incorrectly flagged as canvas panning
  const _handleCanvasPanStart = useCallback((event, viewport) => {
    // Check if the event target is a node element
    // If so, skip pan tracking because this is a node interaction, not canvas panning
    const target = event?.target;
    if (target && target.closest && target.closest('.react-flow__node')) {
      // User is interacting with a node - don't track as canvas pan
      // Keep panStartRef reset so handleCanvasPanMove knows to ignore this gesture
      panStartRef.current = { x: 0, y: 0, time: 0, hasMoved: false, lastX: 0, lastY: 0, lastTime: 0, isTouch: false };
      return;
    }

    // Detect if this is a touch event
    const isTouch = event?.touches || event?.sourceEvent?.touches;
    const now = Date.now();

    // This is a genuine canvas pan - track the start position and time
    panStartRef.current = {
      x: viewport.x,
      y: viewport.y,
      time: now,
      hasMoved: false,
      lastX: viewport.x,
      lastY: viewport.y,
      lastTime: now,
      isTouch: !!isTouch
    };
  }, []);

  // Handle canvas pan move - detect movement threshold to set isPanning flag
  // This works in conjunction with handleCanvasPanStart to distinguish canvas panning from node clicks
  const _handleCanvasPanMove = useCallback((event, viewport) => {
    // Safety check: ensure panStartRef was properly initialized by handleCanvasPanStart
    // If time === 0, this means the gesture started on a node (not canvas), so skip
    if (!panStartRef.current || panStartRef.current.time === 0) {
      return;
    }

    // Calculate distance moved since pan started
    const deltaX = Math.abs(viewport.x - panStartRef.current.x);
    const deltaY = Math.abs(viewport.y - panStartRef.current.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Enhanced pan gesture detection with timing-based thresholds
    // This improves distinction between quick taps (for node selection) and intentional panning

    // Base distance threshold for mouse/desktop interactions
    // Optimized to 8px for better responsiveness while maintaining precision
    const MOUSE_PAN_THRESHOLD = 8;

    // Base distance threshold for touch interactions (more forgiving due to finger size)
    const BASE_DISTANCE_THRESHOLD = 20;

    // iOS Safari-specific threshold: slightly more forgiving due to WebKit touch behavior
    // iOS Safari can have minor touch coordinate jitter, so we use 22px instead of 20px
    const IOS_SAFARI_THRESHOLD = 22;

    // Quick-tap multiplier: increase threshold for very fast gestures to prevent accidental panning
    // When a user taps quickly (<150ms), require 2.5x more movement to trigger pan
    // This ensures quick taps for node selection don't accidentally trigger panning on touch devices
    const QUICK_TAP_TIME_MS = 150;
    const QUICK_TAP_MULTIPLIER = 2.5; // Increased from 2x to 2.5x for better tap detection

    // iOS Safari quick-tap multiplier: slightly higher to account for touch jitter
    const IOS_SAFARI_QUICK_TAP_MULTIPLIER = 2.8;

    // NEW: Velocity-based pan detection constants
    // Fast swipes (>0.5 px/ms = 500 px/sec) are clearly intentional pans, not accidental touches
    const MIN_PAN_VELOCITY = 0.5; // pixels per millisecond

    // NEW: Directional bias threshold for detecting intentional directional swipes
    // A ratio > 2.0 means movement is strongly horizontal or vertical (not diagonal wobble)
    const DIRECTIONAL_BIAS_THRESHOLD = 2.0;

    // Calculate time elapsed since gesture started
    const timeElapsed = Date.now() - panStartRef.current.time;

    // Determine if this is a touch or mouse event (use stored value from panStart for consistency)
    const isTouch = panStartRef.current.isTouch || event?.touches || event?.sourceEvent?.touches;

    // Detect iOS Safari using WebKit-specific properties
    const isIOSSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && /WebKit/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);

    // NEW: Calculate instantaneous velocity for velocity-based pan detection
    const now = Date.now();
    const timeDelta = now - panStartRef.current.lastTime;
    let velocity = 0;

    if (timeDelta > 0) {
      const lastDeltaX = viewport.x - panStartRef.current.lastX;
      const lastDeltaY = viewport.y - panStartRef.current.lastY;
      const lastDistance = Math.sqrt(lastDeltaX * lastDeltaX + lastDeltaY * lastDeltaY);
      velocity = lastDistance / timeDelta; // pixels per millisecond

      // Update tracking for next move event
      panStartRef.current.lastX = viewport.x;
      panStartRef.current.lastY = viewport.y;
      panStartRef.current.lastTime = now;
    }

    // NEW: Calculate directional bias to detect strong horizontal/vertical swipes
    const absDeltaX = Math.abs(viewport.x - panStartRef.current.x);
    const absDeltaY = Math.abs(viewport.y - panStartRef.current.y);
    const directionalBias = Math.max(absDeltaX, absDeltaY) / (Math.min(absDeltaX, absDeltaY) || 1);
    const hasStrongDirection = directionalBias > DIRECTIONAL_BIAS_THRESHOLD;

    // NEW: Fast swipe detection - bypass distance checks for obvious intentional pans
    if (isTouch && velocity > MIN_PAN_VELOCITY && distance > 5) {
      // Fast swipe detected - immediately recognize as pan gesture
      setIsPanning(true);
      setShowPanningIndicator(true);
      panStartRef.current.hasMoved = true;
      return;
    }

    // NEW: Directional bias detection - strong directional movement suggests intentional pan
    // Only applies to touch and when we have meaningful distance (>10px)
    if (isTouch && hasStrongDirection && distance > 10) {
      // Strong directional swipe detected - likely an intentional pan
      setIsPanning(true);
      setShowPanningIndicator(true);
      panStartRef.current.hasMoved = true;
      return;
    }

    // EXISTING: Select appropriate base threshold based on input type and browser
    let threshold = isTouch
      ? (isIOSSafari ? IOS_SAFARI_THRESHOLD : BASE_DISTANCE_THRESHOLD)
      : MOUSE_PAN_THRESHOLD;

    // EXISTING: Apply quick-tap multiplier for touch devices on very fast gestures
    // This makes it much harder to accidentally pan when quickly tapping nodes
    if (isTouch && timeElapsed < QUICK_TAP_TIME_MS) {
      const multiplier = isIOSSafari ? IOS_SAFARI_QUICK_TAP_MULTIPLIER : QUICK_TAP_MULTIPLIER;
      threshold *= multiplier; // e.g., 22px * 2.8 = 61.6px for iOS Safari quick taps
    }

    // EXISTING: Set isPanning flag only if distance exceeds the calculated threshold
    if (distance > threshold) {
      setIsPanning(true);
      setShowPanningIndicator(true); // Show visual feedback when panning is detected
      panStartRef.current.hasMoved = true;
    }
  }, []);

  // Handle canvas pan end - reset pan tracking state
  const _handleCanvasPanEnd = useCallback(() => {
    // Delay resetting isPanning to prevent immediate node selection after pan
    // This prevents false clicks when user releases after panning
    setTimeout(() => {
      setIsPanning(false);
      // Reset pan tracking including hasMoved flag and velocity tracking after delay
      // This allows handleSelectionChange to check if a pan just completed
      panStartRef.current = { x: 0, y: 0, time: 0, hasMoved: false, lastX: 0, lastY: 0, lastTime: 0, isTouch: false };
    }, 150); // 150ms delay for touch devices

    // Hide panning visual indicator with a fade-out delay
    // Slightly longer delay (200ms) to ensure smooth visual transition
    setTimeout(() => {
      setShowPanningIndicator(false);
    }, 200);
  }, []);

  // Add new card (non-photo types)
  const handleAddCard = useCallback((type) => {
    // Check node limit (computed later, use closure to access)
    if (nodes.length >= nodeLimit) {
      showToast(
        `Node Limit Reached (${nodeLimit} nodes)\n\n` +
        (tier === 'premium' || isAdmin
          ? 'You are at your canvas limit.'
          : `Free tier allows ${FREE_NODE_LIMIT} nodes.\n\nUpgrade to Pro for ${PRO_NODE_LIMIT} nodes, or use EXPORT to backup and clear your canvas.`),
        'warning'
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
          onChangeColor: handleChangeNodeColor,
          colorPresets: NODE_COLOR_PRESETS,
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
          onChangeColor: handleChangeNodeColor,
          colorPresets: NODE_COLOR_PRESETS,
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
          onChangeColor: handleChangeNodeColor,
          colorPresets: NODE_COLOR_PRESETS,
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
          onChangeColor: handleChangeNodeColor,
          colorPresets: NODE_COLOR_PRESETS,
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
        }
      };
    }

    if (newNode) {
      // Record history before adding new node
      recordHistory();

      // Haptic feedback for node creation
      triggerHaptic('medium');

      setNodes((nds) => [...nds, newNode]);
      // Use double requestAnimationFrame to ensure React Flow has fully rendered the new node
      // before calling fitView. This prevents timing issues where the viewport doesn't update.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Scope fitView to only the new node to avoid jarring viewport jumps
          fitView({
            duration: 400,
            padding: 0.2,
            nodes: [{ id: newNode.id }],
            maxZoom: 1
          });
        });
      });
    }
  }, [nodes.length, nodeLimit, tier, isAdmin, handleNodeUpdate, handleDeleteNode, setNodes, fitView, setIsUploadModalOpen, handleOpenStudio, user, userProfile, storedGoogleMapsKey, recordHistory]);

  // Handle Deploy from ProspectNode - opens prospect modal
  // Uses refs to avoid circular dependency with useEffect that injects callbacks
  const handleDeployFromNode = useCallback(async (nodeId, nodeData) => {
    if (!hasProAccess()) {
      showToast(
        'Deploy Campaign - Pro Feature\n\n' +
        'Deploying campaigns is available for Pro users.\n\n' +
        'Contact us for Pro access.',
        'warning'
      );
      return;
    }

    // Use refs to get current state without causing re-renders
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    // Check for email nodes connected to this campaign
    const emailNodes = currentNodes.filter(n => n.type === 'emailNode');
    if (emailNodes.length === 0) {
      showToast('No email nodes in campaign.\n\nAdd at least one email to deploy.', 'warning');
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
        showToast(`Failed to save journey: ${error.message}`, 'error');
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

  // Compute starred nodes from current nodes
  const starredNodes = useMemo(() => {
    return nodes.filter(node => starredNodeIds.has(node.id));
  }, [nodes, starredNodeIds]);

  // Ensure all nodes have callbacks - runs on init AND when new nodes are added
  useEffect(() => {
    if (!isInitialized) return;

    setNodes((nds) => {
      // Check if any node needs callback injection (prevents infinite loop)
      // A node needs injection if it's missing essential callbacks
      // This is especially important for AI-generated nodes which may have some callbacks but not all
      const needsInjection = nds.some(n => {
        if (!n.data) return false;
        // Check if essential callbacks are missing
        return !n.data.onUpdate || !n.data.onDelete || !n.data.onToggleStar;
      });
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
            // AI Expand - context-aware content expansion for text nodes
            onExpandWithAI: node.type === 'textNode' ? handleAIExpandNode : undefined,
            // Prospect count at this node (for visual tracking)
            prospectsAtNode: prospectsAtNode,
            // Starring functionality
            onToggleStar: handleToggleNodeStar,
            isStarred: starredNodeIds.has(node.id),
          }
        };
      });
    });
  }, [isInitialized, nodes.length, handlePhotoResize, handleLightbox, handleEdit, handleNodeUpdate, handleDeleteNode, handleEmailPreview, handleInlineEmailEdit, handleInlineWaitEdit, handleInlineConditionEdit, handleEditInOutreach, handleDeployFromNode, handleImageAnalyze, handleOpenStudio, handleAIExpandNode, getProspectsAtNode, handleToggleNodeStar, starredNodeIds, setNodes]);

  // Save to localStorage with status indicator
  useEffect(() => {
    // Skip auto-save during clear operation to prevent race condition
    if (!isInitialized || isClearingRef.current) return;
    setIsSavingLocal(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
      setLastSavedAt(new Date());
    } catch (error) {
      console.error('❌ localStorage save error:', error);
      showToast('Unable to save locally. Your notes will be preserved in the current session.\n\nUse EXPORT to save as JSON file, or SHARE to save to cloud.', 'warning');
    } finally {
      // Brief delay to show saving indicator
      setTimeout(() => setIsSavingLocal(false), 300);
    }
  }, [nodes, edges, isInitialized]);

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
        console.log('☁️ Auto-saving capsule to Firestore...');

        // Serialize nodes - preserve all data fields except callback functions
        const serializableNodes = nodes.map(node => {
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

        const serializableEdges = edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type || 'default'
        }));

        await updateCapsule(currentCapsuleId, serializableNodes, serializableEdges);
        console.log('✅ Auto-saved capsule:', currentCapsuleId);
      } catch (error) {
        console.error('❌ Auto-save to Firestore failed:', error);
        // Don't show alert - localStorage save is the fallback
      }
    }, 2000); // 2 second debounce

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [nodes, edges, isInitialized, currentCapsuleId, canEditCapsule, updateCapsule]);

  // Update zoom level when viewport changes
  useEffect(() => {
    const updateZoom = () => {
      const currentZoom = getZoom();
      setZoomLevel(currentZoom);
    };
    updateZoom();
  }, [getZoom]);

  // Preserve viewport on orientation change (mobile fix with iOS Safari Visual Viewport API support)
  //
  // Problem: When iOS devices rotate, React Flow automatically adjusts the viewport,
  // causing the canvas to jump to a different position/zoom. Users expect the canvas
  // to maintain its position and zoom level after rotation. Additionally, iOS Safari's
  // address bar appearing/disappearing causes viewport changes that should not trigger
  // canvas position resets.
  //
  // Solution Strategy:
  // 1. Save viewport continuously on resize events (BEFORE orientation change)
  // 2. Detect actual orientation changes using matchMedia API (not just any resize)
  // 3. Restore the saved viewport AFTER orientation change completes
  // 4. Use requestAnimationFrame to ensure DOM layout is complete before restoring
  // 5. Handle iOS Safari Visual Viewport API for address bar show/hide
  // 6. Detect and adjust for page-level zoom vs canvas zoom
  //
  // Why matchMedia instead of orientationchange event:
  // - matchMedia is more reliable and modern
  // - orientationchange is deprecated on some browsers
  // - matchMedia provides accurate portrait/landscape detection
  // - Better cross-browser compatibility
  //
  // iOS Safari Improvements:
  // - Increased timeout from 150ms to 300ms for Safari's animation completion
  // - Visual Viewport API support for address bar changes
  // - Page zoom detection to prevent conflicts with canvas zoom
  useEffect(() => {
    let savedViewport = null;
    let isRestoringViewport = false;
    let resizeTimeout = null;
    let visualViewportTimeout = null;
    let currentOrientation = window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
    let lastVisualViewportScale = window.visualViewport?.scale || 1;
    let isOrientationChanging = false;

    // Use matchMedia for reliable orientation detection (more modern than orientationchange event)
    const orientationMediaQuery = window.matchMedia('(orientation: portrait)');

    const handleOrientationChange = (e) => {
      const newOrientation = e.matches ? 'portrait' : 'landscape';

      // Only restore if orientation actually changed
      if (newOrientation !== currentOrientation && savedViewport) {
        isOrientationChanging = true;
        isRestoringViewport = true;
        console.log(`📱 Orientation changed: ${currentOrientation} → ${newOrientation}, restoring viewport:`, savedViewport);

        // Clear any pending timeouts
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        if (visualViewportTimeout) {
          clearTimeout(visualViewportTimeout);
        }

        // iOS Safari needs more time (300ms) for orientation animation to complete
        // Previous 150ms was too short and caused viewport jumping
        resizeTimeout = setTimeout(() => {
          // Use double requestAnimationFrame to ensure layout is complete
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Check if page zoom changed during rotation
              const currentPageZoom = window.visualViewport?.scale || 1;
              if (Math.abs(currentPageZoom - lastVisualViewportScale) > 0.01) {
                console.log(`📱 Page zoom changed during rotation: ${lastVisualViewportScale.toFixed(2)} → ${currentPageZoom.toFixed(2)}`);
                // Adjust canvas zoom to compensate for page zoom if needed
                // This prevents "double zoom" where both page and canvas are zoomed
              }

              setViewport(savedViewport, { duration: 200 });
              console.log('✅ Viewport restored:', savedViewport);
              isRestoringViewport = false;
              isOrientationChanging = false;
              currentOrientation = newOrientation;
              lastVisualViewportScale = currentPageZoom;
            });
          });
        }, 300); // Increased from 150ms to 300ms for iOS Safari
      } else {
        currentOrientation = newOrientation;
      }
    };

    // Save viewport on resize events (BEFORE orientation change happens)
    // This captures the user's viewport position before the device rotates
    const handleResize = () => {
      // Don't save viewport during orientation change or viewport restoration
      if (!isRestoringViewport && !isOrientationChanging) {
        savedViewport = getViewport();
        // No logging here to avoid spam, but viewport is saved continuously
      }
    };

    // iOS Safari Visual Viewport API handler for address bar show/hide
    // This prevents canvas jumping when the Safari address bar appears/disappears
    const handleVisualViewportChange = () => {
      // Only handle if not currently restoring from orientation change
      if (!isRestoringViewport && !isOrientationChanging && window.visualViewport) {
        const currentScale = window.visualViewport.scale;

        // Check if this is a zoom change (user pinch-zooming the page)
        // vs just the address bar appearing/disappearing
        if (Math.abs(currentScale - lastVisualViewportScale) > 0.01) {
          console.log(`🔍 Visual viewport scale changed: ${lastVisualViewportScale.toFixed(2)} → ${currentScale.toFixed(2)}`);
          lastVisualViewportScale = currentScale;
        } else {
          // Address bar change without zoom - save viewport but don't trigger restoration
          // This is what we want - silent handling of address bar changes
          if (visualViewportTimeout) {
            clearTimeout(visualViewportTimeout);
          }
          visualViewportTimeout = setTimeout(() => {
            if (!isRestoringViewport && !isOrientationChanging) {
              savedViewport = getViewport();
            }
          }, 100);
        }
      }
    };

    // Listen for orientation changes using matchMedia (modern, reliable approach)
    orientationMediaQuery.addEventListener('change', handleOrientationChange);

    // Listen for resize to save viewport state preemptively
    window.addEventListener('resize', handleResize);

    // iOS Safari: Listen for visual viewport changes (address bar show/hide)
    // Visual Viewport API is supported in iOS Safari 13+
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
    }

    // Save initial viewport
    savedViewport = getViewport();

    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (visualViewportTimeout) {
        clearTimeout(visualViewportTimeout);
      }
      orientationMediaQuery.removeEventListener('change', handleOrientationChange);
      window.removeEventListener('resize', handleResize);

      // Clean up visual viewport listeners
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
      }
    };
  }, [getViewport, setViewport]);

  // Keyboard shortcuts
  // Arrow keys use React Flow's viewport API for smooth animations and zoom-aware panning
  // Pan distance is adjusted by zoom level for consistent movement at any zoom
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const panAmount = 200;

      switch (event.key) {
        case 'ArrowUp': {
          event.preventDefault();
          const currentViewport = getViewport();
          const adjustedPan = panAmount / currentViewport.zoom;
          setViewport({
            x: currentViewport.x,
            y: currentViewport.y + adjustedPan,
            zoom: currentViewport.zoom
          }, { duration: 150 });
          break;
        }
        case 'ArrowDown': {
          event.preventDefault();
          const currentViewport = getViewport();
          const adjustedPan = panAmount / currentViewport.zoom;
          setViewport({
            x: currentViewport.x,
            y: currentViewport.y - adjustedPan,
            zoom: currentViewport.zoom
          }, { duration: 150 });
          break;
        }
        case 'ArrowLeft': {
          event.preventDefault();
          const currentViewport = getViewport();
          const adjustedPan = panAmount / currentViewport.zoom;
          setViewport({
            x: currentViewport.x + adjustedPan,
            y: currentViewport.y,
            zoom: currentViewport.zoom
          }, { duration: 150 });
          break;
        }
        case 'ArrowRight': {
          event.preventDefault();
          const currentViewport = getViewport();
          const adjustedPan = panAmount / currentViewport.zoom;
          setViewport({
            x: currentViewport.x - adjustedPan,
            y: currentViewport.y,
            zoom: currentViewport.zoom
          }, { duration: 150 });
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
  }, [zoomIn, zoomOut, fitView, getViewport, setViewport]);

  // Note: Viewport preservation on orientation change is handled above (lines 2212-2269)
  // The previous "viewport reset" handler has been removed to prevent conflicts

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
    const mapNodeTypes = ['prospectNode', 'emailNode', 'waitNode', 'conditionNode', 'exitNode'];
    const mapNodes = nodes.filter(n => mapNodeTypes.includes(n.type));
    const groupNodes = nodes.filter(n => n.type === 'groupNode');
    const childNodes = nodes.filter(n => n.parentId);
    const orphanNodes = nodes.filter(n =>
      !n.parentId &&
      n.type !== 'groupNode' &&
      !mapNodeTypes.includes(n.type)
    );

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

    // Use double requestAnimationFrame to ensure React Flow has repositioned all nodes
    // before calling fitView. This prevents the viewport from calculating incorrect bounds.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitView({ duration: 400, padding: 0.2 });
      });
    });
  }, [nodes, setNodes, fitView]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Export layout as JSON file
  const handleExportJSON = () => {
    if (nodes.length === 0) {
      showToast('No notes to export. Add some notes first!', 'warning');
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
        showToast(`Successfully imported ${importData.nodes.length} ${importData.nodes.length === 1 ? 'note' : 'notes'}!`, 'success');
      } catch (error) {
        console.error('Import failed:', error);
        showToast(`Import failed: ${error.message}\n\nPlease check that the file is a valid UnityNotes export.`, 'error');
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
      showToast('Please add at least one note before sharing', 'warning');
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
        console.log('✅ Updated existing capsule:', capsuleId);
      } else {
        // Create new capsule
        capsuleId = await saveCapsule(serializableNodes, serializableEdges, {
          title: 'UnityNotes'
        }, user?.uid);
        setCurrentCapsuleId(capsuleId);
        console.log('✅ Created new capsule:', capsuleId);
      }

      const url = `${window.location.origin}/unity-notes/view/${capsuleId}`;
      setShareUrl(url);

      // Update browser URL with capsule ID so it persists across page refreshes
      // This ensures the same capsule is updated on subsequent saves
      const editUrl = `${window.location.pathname}?capsule=${capsuleId}`;
      window.history.replaceState({}, '', editUrl);
      console.log('📍 URL updated with capsule ID:', capsuleId);

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
      console.log(`✅ Collaboration invite sent to ${email}`);
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
  const handleToggleBookmark = async () => {
    if (!currentCapsuleId) {
      console.warn('No capsule ID - save first before bookmarking');
      return;
    }
    try {
      const newBookmarkStatus = await toggleBookmark(currentCapsuleId);
      setIsBookmarked(newBookmarkStatus);

      // Refresh bookmarked capsules list after toggling
      if (user?.uid) {
        const updatedCapsules = await getBookmarkedCapsules(user.uid);
        setBookmarkedCapsules(updatedCapsules);
        console.log(`📚 Refreshed bookmarked capsules: ${updatedCapsules.length}`);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      // If it's an index error, log a helpful message
      if (err.message?.includes('index')) {
        console.error('⚠️ Firestore composite index may be required. Check Firebase Console.');
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
        showToast('No images were processed. Please try again.', 'warning');
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

      // Use double requestAnimationFrame to ensure React Flow has fully rendered all uploaded nodes
      // before calling fitView. This ensures proper viewport calculation for multiple nodes.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitView({ duration: 600, padding: 0.2 });
        });
      });
    } catch (error) {
      console.error('❌ Upload failed:', error);
      showToast(`Upload failed: ${error.message}`, 'error');
    }
  };

  // Clear all notes and start a new canvas
  const handleClearAll = () => {
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
      console.log('✅ New canvas started');
      // Reset guard flag after state updates have propagated
      setTimeout(() => {
        isClearingRef.current = false;
      }, 100);
    }
  };

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
      // Force React Flow to detect changes by:
      // 1. Creating new object references for ALL nodes
      // 2. Adding renderKey to force component re-render
      const timestamp = Date.now();
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              content: response,
              aiPrompt: customPrompt,
              regeneratedAt: timestamp,
              renderKey: timestamp, // Force re-render
              onUpdate: handleNodeUpdate,
              onDelete: handleDeleteNode,
              onRegenerate: handleRegenerateNote,
            },
            position: { ...n.position }, // Force position reference update
          };
        }
        // Return new reference for all nodes to ensure React Flow detects change
        return { ...n };
      }));

    } catch (error) {
      console.error('AI Regenerate Note failed:', error);
      showToast(`Regeneration failed: ${error.message}`, 'error');
    }
  }, [storedGroqKey, setNodes, handleNodeUpdate, handleDeleteNode]);

  const handleRegenerateImage = useCallback(async (nodeId, customPrompt) => {
    try {
      let imageUrl;
      let modelUsed = 'pollinations';

      const openaiKey = storedOpenaiKey || import.meta.env.VITE_OPENAI_API_KEY;

      if (openaiKey) {
        // DALL-E 3
        console.log('🎨 Regenerating with DALL-E 3');
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
        console.log('🎨 Regenerating with Pollinations.ai (free)');
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
      // Force React Flow to detect changes by:
      // 1. Creating new object references for ALL nodes
      // 2. Adding renderKey to force component re-render
      const timestamp = Date.now();
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              imageUrl,
              thumbnail: imageUrl,
              caption: `✨ AI Generated (${modelUsed})`,
              aiPrompt: customPrompt,
              regeneratedAt: timestamp,
              renderKey: timestamp, // Force re-render
              onUpdate: handleNodeUpdate,
              onDelete: handleDeleteNode,
              onRegenerate: handleRegenerateImage,
            },
            position: { ...n.position }, // Force position reference update
          };
        }
        // Return new reference for all nodes to ensure React Flow detects change
        return { ...n };
      }));

    } catch (error) {
      console.error('AI Regenerate Image failed:', error);
      showToast(`Regeneration failed: ${error.message}`, 'error');
    }
  }, [storedOpenaiKey, setNodes, handleNodeUpdate, handleDeleteNode]);

  // ========================================================================
  // OPTIMISTIC UI UPDATE UTILITIES
  // ========================================================================
  // These utilities provide immediate visual feedback during AI operations
  // by creating placeholder nodes that are later replaced with actual content

  /**
   * Creates a loading placeholder node for optimistic UI updates
   * @param {Object} options - Placeholder configuration
   * @param {string} options.type - Node type (textNode, photoNode, etc.)
   * @param {string} options.title - Placeholder title
   * @param {string} options.message - Loading message to display
   * @param {number} options.x - X position
   * @param {number} options.y - Y position
   * @returns {Object} Placeholder node with loading state
   */
  const createPlaceholderNode = useCallback((options) => {
    const {
      type = 'textNode',
      title = '⏳ Loading...',
      message = 'Generating AI content...',
      x = 300,
      y = 100,
      color = 'rgb(148, 163, 184)' // Slate gray for loading state
    } = options;

    const placeholderId = `placeholder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: placeholderId,
      type,
      position: { x, y },
      data: {
        title,
        content: message,
        cardType: type === 'textNode' ? 'note' : undefined,
        color,
        isPlaceholder: true, // Flag to identify placeholder nodes
        createdAt: Date.now(),
        // Minimal handlers to prevent errors
        onUpdate: () => {},
        onDelete: () => {},
      },
      style: {
        opacity: 0.7,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    };
  }, []);

  /**
   * Removes a placeholder node from the canvas
   * @param {string} placeholderId - ID of the placeholder to remove
   */
  const removePlaceholder = useCallback((placeholderId) => {
    setNodes(nds => nds.filter(n => n.id !== placeholderId));
  }, [setNodes]);

  /**
   * Replaces a placeholder node with actual content
   * @param {string} placeholderId - ID of the placeholder to replace
   * @param {Object} realNode - The actual node to insert
   */
  const replacePlaceholder = useCallback((placeholderId, realNode) => {
    // Force React Flow to detect changes by:
    // 1. Creating new object references for ALL nodes
    // 2. Ensuring the realNode has new object references for nested properties
    // This ensures React Flow's change detection works properly
    const timestamp = Date.now();
    setNodes(nds => nds.map(n => {
      if (n.id === placeholderId) {
        // Replace with realNode, ensuring all nested objects have new references
        return {
          ...realNode,
          data: {
            ...realNode.data,
            renderKey: timestamp, // Force re-render
          },
          position: { ...realNode.position }, // Force position reference update
        };
      }
      // Return new reference for all nodes to ensure React Flow detects change
      return { ...n };
    }));
  }, [setNodes]);

  /**
   * Calculates grid position for new nodes
   * @param {number} totalNodes - Current number of nodes
   * @returns {Object} {x, y} position
   */
  const calculateGridPosition = useCallback((totalNodes) => {
    const gridX = totalNodes % 8;
    const gridY = Math.floor(totalNodes / 8);
    return {
      x: 300 + gridX * 350,
      y: 100 + gridY * 300
    };
  }, []);

  /**
   * Extracts semantic context from a node based on its type
   * Returns a formatted string with type markers for better AI understanding
   * @param {Object} node - The node to extract context from
   * @returns {string} Formatted context string or empty string if no content
   */
  const getNodeContextString = useCallback((node) => {
    if (!node || !node.data) return '';

    const nodeType = node.type;
    const d = node.data;
    const parts = [];
    const MAX_CONTENT_LENGTH = 200; // Truncate long content for context

    // Helper to truncate long text
    const truncate = (text, maxLen = MAX_CONTENT_LENGTH) => {
      if (!text) return '';
      const cleaned = text.trim();
      return cleaned.length > maxLen
        ? cleaned.substring(0, maxLen) + '...'
        : cleaned;
    };

    // Skip placeholder nodes
    if (d.isPlaceholder) return '';

    // Todo List nodes - format with checkbox markers
    if (nodeType === 'todoNode') {
      if (d.title) parts.push(`[TODO LIST] ${d.title}`);
      if (d.items?.length > 0) {
        const todoItems = d.items
          .slice(0, 5) // Limit to first 5 items for context
          .map(item => `- [${item.completed ? 'x' : ' '}] ${truncate(item.text, 100)}`)
          .join('\n');
        parts.push(todoItems);
        if (d.items.length > 5) {
          parts.push(`... and ${d.items.length - 5} more items`);
        }
      }
      return parts.filter(Boolean).join('\n');
    }

    // Sticky notes - mark as quick highlights
    if (nodeType === 'stickyNode') {
      const text = d.text || d.content;
      if (text) return `[STICKY NOTE] ${truncate(text, 150)}`;
      return '';
    }

    // Photo nodes - include location and caption context
    if (nodeType === 'photoNode') {
      const photoLabel = d.location || d.title || 'Photo';
      parts.push(`[PHOTO: ${photoLabel}]`);
      if (d.caption) parts.push(truncate(d.caption, 100));
      if (d.description) parts.push(truncate(d.description, 100));
      if (d.date) parts.push(`Date: ${d.date}`);
      return parts.filter(Boolean).join(' - ');
    }

    // Group nodes - identify grouped content
    if (nodeType === 'groupNode') {
      const label = d.label || 'Group';
      return `[GROUP: ${label}]`;
    }

    // Comment nodes
    if (nodeType === 'commentNode') {
      if (d.content) {
        const author = d.author ? ` (by ${d.author})` : '';
        return `[COMMENT${author}] ${truncate(d.content, 150)}`;
      }
      return '';
    }

    // Code nodes - include language
    if (nodeType === 'codeNode' && d.code) {
      const lang = d.language || 'code';
      const preview = truncate(d.code, 150);
      return `[CODE: ${lang}] ${preview}`;
    }

    // Link cards - include URL context
    if (d.cardType === 'link' && d.url) {
      parts.push(`[LINK] ${d.title || 'Untitled'}`);
      if (d.linkPreview?.description) {
        parts.push(truncate(d.linkPreview.description, 120));
      }
      parts.push(`URL: ${d.url}`);
      return parts.filter(Boolean).join(' - ');
    }

    // Default text nodes - standard notes
    if (d.title || d.content) {
      const title = d.title ? `[NOTE: ${truncate(d.title, 80)}]` : '[NOTE]';
      const content = truncate(d.content || '', MAX_CONTENT_LENGTH);
      return [title, content].filter(Boolean).join('\n');
    }

    return '';
  }, []);

  /**
   * Build a general canvas context overview (for AI Generate Note, summarize, etc.)
   * @param {number} maxNodes - Maximum nodes to include in context
   * @returns {string} Formatted canvas overview
   */
  const buildGeneralCanvasContext = useCallback((maxNodes = 10) => {
    const contextParts = [];
    const now = Date.now();
    const RECENT_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    // Filter out placeholders
    const validNodes = nodes.filter(n => !n.data?.isPlaceholder);

    // Recent activity
    const recentNodes = validNodes.filter(n => {
      const createdAt = n.data?.createdAt || 0;
      const updatedAt = n.data?.updatedAt || 0;
      const expandedAt = n.data?.expandedAt || 0;
      const mostRecent = Math.max(createdAt, updatedAt, expandedAt);
      return (now - mostRecent) < RECENT_THRESHOLD;
    });

    if (recentNodes.length > 0) {
      contextParts.push('🆕 RECENT ACTIVITY:');
      recentNodes.slice(0, 3).forEach(n => {
        const isNew = (now - (n.data?.createdAt || 0)) < RECENT_THRESHOLD;
        const marker = isNew ? '🆕 New' : '✏️ Recently edited';
        const contextStr = getNodeContextString(n);
        if (contextStr) {
          contextParts.push(`${marker}: ${contextStr}`);
        }
      });
      contextParts.push('');
    }

    // Connected ideas (nodes with edges)
    if (edges.length > 0) {
      contextParts.push('🔗 CONNECTED IDEAS:');
      const connectedNodeIds = new Set();
      edges.forEach(e => {
        connectedNodeIds.add(e.source);
        connectedNodeIds.add(e.target);
      });
      Array.from(connectedNodeIds).slice(0, 5).forEach(id => {
        const node = nodes.find(n => n.id === id);
        if (node && !node.data?.isPlaceholder) {
          const contextStr = getNodeContextString(node);
          if (contextStr) contextParts.push(contextStr);
        }
      });
      contextParts.push('');
    }

    // Other canvas notes
    const otherNodes = validNodes
      .filter(n => !recentNodes.includes(n))
      .slice(0, Math.max(0, maxNodes - recentNodes.length));

    if (otherNodes.length > 0) {
      contextParts.push('📋 OTHER CANVAS NOTES:');
      otherNodes.forEach(n => {
        const contextStr = getNodeContextString(n);
        if (contextStr) contextParts.push(contextStr);
      });
    }

    return contextParts.filter(Boolean).join('\n');
  }, [nodes, edges, getNodeContextString]);

  // Enhanced context builder - includes relationships, recent activity, and spatial clustering
  const buildEnhancedContext = useCallback((targetNodeId, maxNodes = 10) => {
    const contextParts = [];
    const now = Date.now();
    const RECENT_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    const PROXIMITY_THRESHOLD = 300; // pixels

    // Filter out target node and placeholders
    const contextNodes = nodes.filter(n =>
      n.id !== targetNodeId && !n.data?.isPlaceholder
    );

    // 1. RECENT ACTIVITY - nodes created or updated in last 5 minutes
    const recentNodes = contextNodes.filter(n => {
      const createdAt = n.data?.createdAt || 0;
      const updatedAt = n.data?.updatedAt || 0;
      const expandedAt = n.data?.expandedAt || 0;
      const mostRecent = Math.max(createdAt, updatedAt, expandedAt);
      return (now - mostRecent) < RECENT_THRESHOLD;
    });

    if (recentNodes.length > 0) {
      contextParts.push('🆕 RECENT ACTIVITY:');
      recentNodes.slice(0, 3).forEach(n => {
        const isNew = (now - (n.data?.createdAt || 0)) < RECENT_THRESHOLD;
        const marker = isNew ? '🆕 New' : '✏️ Recently edited';
        const contextStr = getNodeContextString(n);
        if (contextStr) {
          contextParts.push(`${marker}: ${contextStr}`);
        }
      });
      contextParts.push('');
    }

    // 2. PARENT GROUP CONTEXT - group membership and siblings
    const targetNode = nodes.find(n => n.id === targetNodeId);
    if (targetNode?.parentId) {
      const parentGroup = nodes.find(n => n.id === targetNode.parentId);
      if (parentGroup && parentGroup.type === 'groupNode') {
        const groupLabel = parentGroup.data?.label || 'Unnamed Group';
        contextParts.push(`📦 GROUP: "${groupLabel}"`);

        // Find other nodes in the same group for thematic context
        const siblingNodesInGroup = nodes
          .filter(n => n.parentId === targetNode.parentId && n.id !== targetNodeId && !n.data?.isPlaceholder)
          .slice(0, 3); // Limit to 3 siblings

        if (siblingNodesInGroup.length > 0) {
          contextParts.push('   Group members:');
          siblingNodesInGroup.forEach(sibling => {
            const contextStr = getNodeContextString(sibling);
            if (contextStr) {
              contextParts.push(`   • ${contextStr}`);
            }
          });
        }
        contextParts.push('');
      }
    }

    // 3. RELATIONSHIP TRACKING - connected nodes
    if (targetNode && edges.length > 0) {
      const connectedEdges = edges.filter(e =>
        e.source === targetNodeId || e.target === targetNodeId
      );

      if (connectedEdges.length > 0) {
        contextParts.push('🔗 RELATED NODES:');
        connectedEdges.slice(0, 5).forEach(edge => {
          const relatedNodeId = edge.source === targetNodeId ? edge.target : edge.source;
          const relatedNode = nodes.find(n => n.id === relatedNodeId);

          if (relatedNode && !relatedNode.data?.isPlaceholder) {
            const direction = edge.source === targetNodeId ? '→' : '←';
            const label = edge.label ? ` (${edge.label})` : '';
            const contextStr = getNodeContextString(relatedNode);
            if (contextStr) {
              contextParts.push(`${direction}${label} ${contextStr}`);
            }
          }
        });
        contextParts.push('');
      }
    }

    // 4. SPATIAL CLUSTERING - nearby nodes
    if (targetNode?.position) {
      const nearbyNodes = contextNodes.filter(n => {
        if (!n.position) return false;
        const dx = n.position.x - targetNode.position.x;
        const dy = n.position.y - targetNode.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < PROXIMITY_THRESHOLD;
      });

      if (nearbyNodes.length > 0) {
        contextParts.push('📍 NEARBY NOTES:');
        nearbyNodes.slice(0, 4).forEach(n => {
          const contextStr = getNodeContextString(n);
          if (contextStr) {
            contextParts.push(contextStr);
          }
        });
        contextParts.push('');
      }
    }

    // 5. OTHER CANVAS CONTEXT - remaining nodes
    const alreadyIncluded = new Set([
      targetNodeId,
      ...recentNodes.map(n => n.id),
      ...edges.filter(e => e.source === targetNodeId || e.target === targetNodeId)
        .map(e => e.source === targetNodeId ? e.target : e.source),
      ...(targetNode?.position ? contextNodes.filter(n => {
        if (!n.position) return false;
        const dx = n.position.x - targetNode.position.x;
        const dy = n.position.y - targetNode.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < PROXIMITY_THRESHOLD;
      }).map(n => n.id) : [])
    ]);

    const otherNodes = contextNodes
      .filter(n => !alreadyIncluded.has(n.id))
      .slice(0, Math.max(0, maxNodes - alreadyIncluded.size));

    if (otherNodes.length > 0) {
      contextParts.push('📋 OTHER CANVAS NOTES:');
      otherNodes.forEach(n => {
        const contextStr = getNodeContextString(n);
        if (contextStr) {
          contextParts.push(contextStr);
        }
      });
    }

    return contextParts.filter(Boolean).join('\n');
  }, [nodes, edges, getNodeContextString]);

  // ========================================================================
  // AI Canvas Actions (with Optimistic Updates)
  // ========================================================================
  const handleAIGenerateNote = useCallback(async () => {
    // STEP 1: Create placeholder immediately for instant feedback
    const position = calculateGridPosition(nodes.length);
    const placeholder = createPlaceholderNode({
      type: 'textNode',
      title: '⏳ Generating Note...',
      message: 'AI is creating a thoughtful note for your canvas...',
      x: position.x,
      y: position.y,
      color: 'rgb(147, 51, 234)' // Purple tint for AI
    });

    // Add placeholder to canvas immediately
    setNodes(nds => [...nds, placeholder]);

    // Focus on the placeholder
    requestAnimationFrame(() => {
      fitView({
        duration: 800,
        padding: 0.2,
        nodes: [{ id: placeholder.id }]
      });
    });

    try {
      // STEP 2: Collect enhanced canvas context (relationships, recent activity)
      const existingContent = buildGeneralCanvasContext(10);

      const { getLLMAdapterByName } = await import('../adapters/llm');

      // Get the LLM adapter
      const llm = await getLLMAdapterByName('groq');

      const prompt = existingContent
        ? `Based on these existing notes and their relationships:\n\n${existingContent}\n\nGenerate a thoughtful new note that builds on or relates to these ideas. Consider the recent activity and connected concepts. Keep it concise (2-3 sentences).`
        : 'Generate a thoughtful brainstorming prompt or creative idea for a visual planning canvas. Keep it concise (2-3 sentences).';

      // Use API key from useApiKeyStorage hook (stored in Firestore)
      const generateOptions = { maxTokens: 200 };
      if (storedGroqKey) {
        generateOptions.apiKey = storedGroqKey;
      }

      // STEP 3: Generate AI content
      const response = await llm.generate(prompt, generateOptions);

      // STEP 4: Create the actual node with AI content
      const timestamp = Date.now();
      const newNode = {
        id: `ai-note-${timestamp}`,
        type: 'textNode',
        position: placeholder.position, // Use same position as placeholder
        data: {
          title: '✨ AI Generated',
          content: response,
          cardType: 'note',
          color: 'rgb(147, 51, 234)', // Purple for AI
          createdAt: timestamp,
          aiGenerated: true,
          aiPrompt: prompt,
          onUpdate: handleNodeUpdate,
          onDelete: handleDeleteNode,
          onRegenerate: handleRegenerateNote,
        }
      };

      // STEP 5: Replace placeholder with actual node
      replacePlaceholder(placeholder.id, newNode);

      // Focus on the new node
      requestAnimationFrame(() => {
        fitView({
          duration: 800,
          padding: 0.2,
          nodes: [{ id: newNode.id }]
        });
      });

    } catch (error) {
      console.error('AI Generate Note failed:', error);

      // STEP 6: Remove placeholder on error
      removePlaceholder(placeholder.id);

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
  }, [nodes, handleNodeUpdate, handleDeleteNode, setNodes, fitView, storedGroqKey, isAuthenticated, handleRegenerateNote, createPlaceholderNode, calculateGridPosition, replacePlaceholder, removePlaceholder]);

  const handleAIGenerateImage = useCallback(async () => {
    // STEP 1: Create placeholder immediately for instant feedback
    const position = calculateGridPosition(nodes.length);
    const placeholder = createPlaceholderNode({
      type: 'textNode', // Use textNode for placeholder (photoNode needs imageUrl)
      title: '🎨 Generating Image...',
      message: 'AI is creating a beautiful image for your canvas...\n\nThis may take 10-30 seconds.',
      x: position.x,
      y: position.y,
      color: 'rgb(251, 191, 36)' // Amber/yellow tint for images
    });

    // Add placeholder to canvas immediately
    setNodes(nds => [...nds, placeholder]);

    // Focus on the placeholder
    requestAnimationFrame(() => {
      fitView({
        duration: 800,
        padding: 0.2,
        nodes: [{ id: placeholder.id }]
      });
    });

    try {
      // STEP 2: Get enhanced context from canvas (exclude placeholders)
      const relevantNodes = nodes
        .filter(n => !n.data?.isPlaceholder && !n.parentId && n.type !== 'groupNode')
        .slice(-8); // Get up to 8 most recent nodes for context

      let contextTheme = '';
      if (relevantNodes.length > 0) {
        // Extract themes from node titles and content
        const themes = relevantNodes.map(n => {
          const title = n.data?.title || n.data?.label || '';
          const content = n.data?.content || '';
          // Get key terms (prioritize titles for theme detection)
          return `${title} ${content}`.substring(0, 80);
        }).filter(t => t.length > 0);

        contextTheme = themes.slice(0, 5).join(', ');
      }

      const imagePrompt = contextTheme
        ? `Create an abstract, colorful illustration representing these themes: ${contextTheme}. Modern, minimalist style with geometric shapes and vibrant colors. Make it visually engaging and inspiring.`
        : 'Create an abstract, colorful brainstorming illustration. Modern, minimalist style with geometric shapes and vibrant colors.';

      let imageUrl;
      let modelUsed = 'pollinations'; // Track which model was used

      // Check for OpenAI key (from Firestore or .env)
      const openaiKey = storedOpenaiKey || import.meta.env.VITE_OPENAI_API_KEY;

      // STEP 3: Use DALL-E if OpenAI key is available, otherwise use Pollinations (free)
      if (openaiKey) {
        // DALL-E 3 (Premium option)
        console.log('🎨 Using DALL-E 3 for image generation');
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
        console.log('🎨 Using Pollinations.ai for image generation (free)');

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

      // STEP 4: Create photo node with generated image
      const timestamp = Date.now();
      const newNode = {
        id: `ai-image-${timestamp}`,
        type: 'photoNode',
        position: placeholder.position, // Use same position as placeholder
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

      // STEP 5: Replace placeholder with actual image node
      replacePlaceholder(placeholder.id, newNode);

      // Focus on the new image
      requestAnimationFrame(() => {
        fitView({
          duration: 800,
          padding: 0.2,
          nodes: [{ id: newNode.id }]
        });
      });

    } catch (error) {
      console.error('AI Generate Image failed:', error);

      // STEP 6: Remove placeholder on error
      removePlaceholder(placeholder.id);

      alert(`❌ Image Generation failed: ${error.message}`);
    }
  }, [nodes, handleDeleteNode, setNodes, fitView, storedOpenaiKey, handleRegenerateImage, createPlaceholderNode, calculateGridPosition, replacePlaceholder, removePlaceholder]);

  const handleAISummarize = useCallback(async () => {
    // STEP 1: Pre-validate content and API key before showing placeholder
    // (Avoid showing placeholder if operation will fail immediately)

    // Collect all content from nodes with enhanced type-aware context
    const allContent = nodes
      .map(n => getNodeContextString(n))
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

    // STEP 2: Create placeholder after validation passes
    const position = calculateGridPosition(nodes.length);
    const placeholder = createPlaceholderNode({
      type: 'textNode',
      title: '📋 Summarizing Canvas...',
      message: 'AI is analyzing your canvas and creating a summary...',
      x: position.x,
      y: position.y,
      color: 'rgb(34, 197, 94)' // Green tint for summary
    });

    // Add placeholder to canvas immediately
    setNodes(nds => [...nds, placeholder]);

    // Focus on the placeholder
    requestAnimationFrame(() => {
      fitView({
        duration: 800,
        padding: 0.2,
        nodes: [{ id: placeholder.id }]
      });
    });

    try {
      // STEP 3: Generate summary
      const { getLLMAdapter } = await import('../adapters/llm');
      const llm = await getLLMAdapter();

      const prompt = `Summarize the following canvas notes into a concise overview with key points:\n\n${allContent}\n\nProvide a brief summary (3-5 bullet points).`;

      // Pass stored API key to the LLM adapter
      const response = await llm.generate(prompt, { maxTokens: 500, apiKey: groqKey });

      // STEP 4: Create summary note
      const timestamp = Date.now();
      const newNode = {
        id: `summary-${timestamp}`,
        type: 'textNode',
        position: placeholder.position, // Use same position as placeholder
        data: {
          title: '📋 Canvas Summary',
          content: response,
          cardType: 'note',
          color: 'rgb(34, 197, 94)', // Green for summary
          createdAt: timestamp,
          onUpdate: handleNodeUpdate,
          onDelete: handleDeleteNode,
        }
      };

      // STEP 5: Replace placeholder with actual summary
      replacePlaceholder(placeholder.id, newNode);

      // Focus on the summary
      requestAnimationFrame(() => {
        fitView({ duration: 400, padding: 0.2 });
      });

    } catch (error) {
      console.error('AI Summarize failed:', error);

      // STEP 6: Remove placeholder on error
      removePlaceholder(placeholder.id);

      alert(`❌ Summarize failed: ${error.message}`);
    }
  }, [nodes, handleNodeUpdate, handleDeleteNode, setNodes, fitView, storedGroqKey, isAuthenticated, createPlaceholderNode, calculateGridPosition, replacePlaceholder, removePlaceholder]);

  // AI Expand Node - Expands a specific node's content using canvas context
  const handleAIExpandNode = useCallback(async (nodeId) => {
    // STEP 1: Find the target node
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) {
      console.error('Target node not found:', nodeId);
      return;
    }

    // Extract current content
    const currentContent = targetNode.data?.content || targetNode.data?.title || '';
    if (!currentContent) {
      alert('⚠️ This note is empty.\n\nAdd some content first before expanding!');
      return;
    }

    // Check for API key (from Firestore or .env)
    const groqKey = storedGroqKey || import.meta.env.VITE_GROQ_API_KEY;
    if (!groqKey) {
      if (!isAuthenticated) {
        alert('🔑 Expand with AI requires an LLM API key.\n\nSign in to use your stored Groq API key, or add VITE_GROQ_API_KEY to .env');
      } else {
        alert('🔑 No Groq API key found.\n\nTo configure:\n1. Go to Hub → Settings\n2. Add your Groq API key (free at console.groq.com)\n\nOr add VITE_GROQ_API_KEY to .env');
      }
      return;
    }

    // STEP 2: Collect enhanced canvas context (relationships, recent activity, spatial clustering)
    const canvasContext = buildEnhancedContext(nodeId, 10);

    try {
      // STEP 3: Update node to show loading state
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              isExpanding: true, // Flag for UI to show loading
            }
          };
        }
        return n;
      }));

      // STEP 4: Generate expanded content with context
      const { getLLMAdapterByName } = await import('../adapters/llm');
      const llm = await getLLMAdapterByName('groq');

      // Build context-aware prompt
      const prompt = canvasContext
        ? `You are helping expand a note on a visual planning canvas. Here is the context from other visible notes on the canvas:

${canvasContext}

---

Now expand this note to be more detailed and comprehensive:

"${currentContent}"

Consider the context above and make the expansion relevant to the surrounding notes. Add 2-3 sentences that provide more depth, examples, or actionable details. Keep the expansion focused and concise.`
        : `Expand this note to be more detailed and comprehensive:

"${currentContent}"

Add 2-3 sentences that provide more depth, examples, or actionable details. Keep it focused and concise.`;

      // Generate expansion
      const expandedContent = await llm.generate(prompt, {
        maxTokens: 300,
        apiKey: groqKey
      });

      // STEP 5: Update node with expanded content
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              content: expandedContent,
              isExpanding: false,
              expandedAt: Date.now(), // Track when it was expanded
              previousContent: currentContent, // Store original for potential undo
            }
          };
        }
        return n;
      }));

      // STEP 6: Focus on the expanded node
      requestAnimationFrame(() => {
        setCenter(targetNode.position.x, targetNode.position.y, {
          duration: 400,
          zoom: 1.2,
        });
      });

    } catch (error) {
      console.error('AI Expand Node failed:', error);

      // Remove loading state on error
      setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              isExpanding: false,
            }
          };
        }
        return n;
      }));

      alert(`❌ Expand failed: ${error.message}`);
    }
  }, [nodes, edges, setNodes, setCenter, storedGroqKey, isAuthenticated, buildEnhancedContext]);

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

      // ========================================================================
      // ENHANCED CANVAS CONTEXT EXTRACTION
      // ========================================================================
      // This section builds a comprehensive context summary of the existing canvas
      // to provide the AI with awareness of what's already present. This enables:
      // 1. Context-aware generation that complements (not duplicates) existing content
      // 2. Better thematic coherence with existing nodes
      // 3. Balanced variety in node types and colors
      // 4. Meaningful connections to existing canvas elements
      //
      // The context includes:
      // - Node count, types, and distribution
      // - Connection/relationship metadata (incoming/outgoing edges)
      // - Color usage patterns
      // - Detailed content previews of each existing node
      // - Canvas state (empty/minimal/populated)
      //
      // This is formatted as a structured prompt section that guides the AI to
      // generate content that naturally extends the existing canvas ecosystem.
      // ========================================================================
      let canvasContext = '';
      try {
        // Get existing non-group, non-outreach nodes for context (limit to 15 most recent)
        const existingNodes = nodes
          .filter(n => !n.parentId && n.type !== 'groupNode' &&
                       n.type !== 'emailNode' && n.type !== 'waitNode' && n.type !== 'conditionNode')
          .slice(-15); // Get up to 15 most recent nodes for better context

        if (existingNodes.length > 0) {
          // Build enhanced context with node types, relationships, and metadata
          const nodeTypeCounts = {};
          const colorCounts = {};
          const contextItems = existingNodes
            .map(node => {
              const title = node.data?.title || node.data?.label || 'Untitled';
              const nodeType = node.type || 'textNode';
              const nodeColor = node.data?.color || 'default';

              // Track node type distribution
              nodeTypeCounts[nodeType] = (nodeTypeCounts[nodeType] || 0) + 1;

              // Track color usage for better AI context
              if (nodeColor !== 'default') {
                colorCounts[nodeColor] = (colorCounts[nodeColor] || 0) + 1;
              }

              // Extract content based on node type
              let content = '';
              if (node.type === 'todoNode') {
                const items = node.data?.items || [];
                const completedCount = items.filter(i => i.done).length;
                const pendingCount = items.length - completedCount;
                content = `${items.length} tasks (${completedCount} done, ${pendingCount} pending)`;
                if (items.length > 0) {
                  const topTasks = items.slice(0, 3).map(i => `"${i.text}"`).join(', ');
                  content += ` - includes: ${topTasks}${items.length > 3 ? ', ...' : ''}`;
                }
              } else if (node.type === 'stickyNode') {
                content = node.data?.content || '';
                content = `STICKY: ${content}`;
              } else if (node.type === 'photoNode') {
                const caption = node.data?.caption || node.data?.title || 'Image';
                content = `IMAGE: ${caption}`;
              } else if (node.type === 'videoNode') {
                content = `VIDEO: ${node.data?.url || 'Embedded video'}`;
              } else {
                content = node.data?.content || node.data?.description || '';
              }

              const truncatedContent = content.length > 150 ? content.slice(0, 150) + '...' : content;

              // Check for connections to this node
              const outgoing = edges.filter(e => e.source === node.id);
              const incoming = edges.filter(e => e.target === node.id);
              let connectionInfo = '';
              if (outgoing.length > 0 || incoming.length > 0) {
                connectionInfo = ` [↗${outgoing.length} ↙${incoming.length}]`;
              }

              return `  • [${nodeType}] "${title}"${connectionInfo}\n    ${truncatedContent}`;
            })
            .filter(item => item.length > 10) // Filter out empty items
            .join('\n');

          if (contextItems) {
            // Build metadata summary
            const totalNodes = existingNodes.length;
            const typesSummary = Object.entries(nodeTypeCounts)
              .map(([type, count]) => `${count} ${type.replace('Node', '')}${count > 1 ? 's' : ''}`)
              .join(', ');
            const connectionCount = edges.filter(e => {
              const sourceNode = existingNodes.find(n => n.id === e.source);
              const targetNode = existingNodes.find(n => n.id === e.target);
              return sourceNode && targetNode;
            }).length;

            // Build color summary if colors are used
            const colorSummary = Object.keys(colorCounts).length > 0
              ? ` | Colors used: ${Object.keys(colorCounts).join(', ')}`
              : '';

            // Detect if canvas is empty or has minimal content
            const canvasState = totalNodes === 0 ? 'empty' : totalNodes < 3 ? 'minimal' : 'populated';

            canvasContext = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CURRENT CANVAS CONTEXT (Canvas is ${canvasState} with ${totalNodes} existing nodes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 CANVAS OVERVIEW:
  • Total nodes: ${totalNodes}
  • Node types: ${typesSummary}
  • Connections: ${connectionCount} relationship${connectionCount !== 1 ? 's' : ''}${colorSummary}

📝 EXISTING CONTENT:
${contextItems}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ CRITICAL INSTRUCTIONS FOR AI:
1. Generate content that COMPLEMENTS and EXTENDS the existing nodes above
2. DO NOT duplicate or repeat existing content, titles, or themes
3. Build upon the relationships and themes present in the canvas
4. Consider the existing node types and create a balanced variety
5. Use different colors than those already heavily used
6. Create content that could meaningfully connect to existing nodes

Generate new content that fits naturally into this existing canvas ecosystem.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
          }
        } else {
          // Canvas is empty - inform the AI
          canvasContext = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CURRENT CANVAS CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is a BLANK CANVAS with no existing content.
You are creating the foundation for a new canvas from scratch.
Make it comprehensive, well-structured, and immediately useful.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        }
      } catch (err) {
        console.warn('⚠️ Failed to extract canvas context:', err);
        // Continue without context if extraction fails
      }

      const basePrompt = `Generate a visual planning canvas for: "${canvasTopic}"${canvasContext}

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

      // Build context-aware prompt that includes conversation history
      const prompt = buildContextAwarePrompt(basePrompt, null, 3);

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
          console.log('✅ Forced video card creation (LLM did not generate one)');
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
          // Inject callbacks for text/sticky nodes
          groqApiKey: storedGroqKey, // Required for AI functionality in textNode
          onUpdate: (nodeId, updates) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? { ...n, data: { ...n.data, ...updates, updatedAt: Date.now() } }
                  : n
              )
            );
          },
          onDelete: (nodeId) => {
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
          },
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
          // TodoNode needs special callbacks
          nodeData.onUpdateItems = (nodeId, newItems) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? { ...n, data: { ...n.data, items: newItems } }
                  : n
              )
            );
          };
          nodeData.onTitleChange = (nodeId, newTitle) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === nodeId
                  ? { ...n, data: { ...n.data, title: newTitle } }
                  : n
              )
            );
          };
          // Override onUpdate and onDelete for todoNode (they use different signatures)
          delete nodeData.onUpdate; // TodoNode doesn't use onUpdate
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
      setNodes(nds => [...nds, groupNode, ...childNodes]);

      // Use double requestAnimationFrame to ensure React Flow has fully rendered the new nodes
      // before calling fitView. This fixes the issue where nodes don't appear properly after AI generation.
      // IMPORTANT: fitView must be called AFTER setNodes completes, not inside the callback
      // First RAF: Waits for React's state update to commit
      // Second RAF: Waits for browser's paint/layout cycle to complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitView({
            duration: 800,
            padding: 0.2,
            nodes: [groupNode, ...childNodes].map(n => ({ id: n.id }))
          });
        });
      });

      // Record this conversation in history for context-aware future interactions
      recordConversation(
        `Generate a visual planning canvas for: "${canvasTopic}"`,
        `Generated ${limitedCards.length} cards: ${limitedCards.map(c => c.title).join(', ')}`,
        null // Global conversation, not tied to specific node
      );

      console.log(`✅ Generated canvas with ${limitedCards.length} cards in group "${groupLabel}" for: "${canvasTopic}"`);
      setShowAICanvasModal(false);
      setIsGeneratingCanvas(false);

    } catch (error) {
      console.error('AI Generate Canvas failed:', error);
      alert(`❌ Canvas generation failed: ${error.message}`);
      setIsGeneratingCanvas(false);
    }
  }, [nodes, setNodes, setEdges, fitView, storedGroqKey, handleRegenerateImage, handleDeleteNode, buildContextAwarePrompt, recordConversation, edges]);

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
        showToast(`Failed to save journey: ${error.message}`, 'error');
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
        showToast(`Failed to save journey: ${error.message}`, 'error');
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

  // Duplicate selected nodes
  const handleDuplicateSelected = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const timestamp = Date.now();
    const offset = 50; // Offset for duplicated nodes

    const newNodes = selectedNodes.map((node, index) => {
      // Create a deep copy of the node data
      const newData = { ...node.data };

      // Preserve all callbacks from original node
      if (node.data.onUpdate) newData.onUpdate = handleNodeUpdate;
      if (node.data.onDelete) newData.onDelete = handleDeleteNode;
      if (node.data.onResize) newData.onResize = handlePhotoResize;
      if (node.data.onOpenStudio) newData.onOpenStudio = handleOpenStudio;
      if (node.data.onExpandWithAI) newData.onExpandWithAI = handleAIExpandNode;

      const newNodeId = `${node.type}-dup-${timestamp}-${index}`;

      return {
        ...node,
        id: newNodeId,
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
        data: {
          ...newData,
          createdAt: timestamp,
        },
        selected: true, // Auto-select duplicated nodes for immediate visual feedback
      };
    });

    // Deselect original nodes and add duplicates
    setNodes((nds) => [
      ...nds.map(n => n.selected ? { ...n, selected: false } : n),
      ...newNodes
    ]);

    // Use double requestAnimationFrame to ensure React Flow has fully rendered the new nodes
    // before calling fitView. This provides smooth auto-pan to show duplicated nodes.
    const newNodeIds = newNodes.map(n => n.id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitView({
          nodes: newNodeIds.map(id => ({ id })),
          duration: 400,
          padding: 0.2
        });
      });
    });
  }, [nodes, setNodes, handleNodeUpdate, handleDeleteNode, handlePhotoResize, handleOpenStudio, handleAIExpandNode, fitView]);

  // Floating Toolbar Quick Actions - for single-node selections
  const _handleQuickDuplicate = useCallback(() => {
    if (!floatingToolbar.nodeId) return;
    const node = nodes.find(n => n.id === floatingToolbar.nodeId);
    if (!node) return;

    const timestamp = Date.now();
    const offset = 50;
    const newData = { ...node.data };

    // Preserve callbacks
    if (node.data.onUpdate) newData.onUpdate = handleNodeUpdate;
    if (node.data.onDelete) newData.onDelete = handleDeleteNode;
    if (node.data.onResize) newData.onResize = handlePhotoResize;
    if (node.data.onOpenStudio) newData.onOpenStudio = handleOpenStudio;
    if (node.data.onExpandWithAI) newData.onExpandWithAI = handleAIExpandNode;

    const newNodeId = `${node.type}-dup-${timestamp}`;
    const newNode = {
      ...node,
      id: newNodeId,
      position: { x: node.position.x + offset, y: node.position.y + offset },
      data: { ...newData, createdAt: timestamp },
      selected: true,
    };

    setNodes((nds) => [...nds.map(n => ({ ...n, selected: false })), newNode]);
    setFloatingToolbar({ visible: false, nodeId: null, position: { x: 0, y: 0 } });

    // Auto-pan to show duplicated node
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitView({ nodes: [{ id: newNodeId }], duration: 400, padding: 0.2 });
      });
    });
  }, [floatingToolbar.nodeId, nodes, setNodes, handleNodeUpdate, handleDeleteNode, handlePhotoResize, handleOpenStudio, handleAIExpandNode, fitView]);

  const _handleQuickDelete = useCallback(() => {
    if (!floatingToolbar.nodeId) return;
    handleDeleteNode(floatingToolbar.nodeId);
    setFloatingToolbar({ visible: false, nodeId: null, position: { x: 0, y: 0 } });
  }, [floatingToolbar.nodeId, handleDeleteNode]);

  const _handleQuickColorCycle = useCallback(() => {
    if (!floatingToolbar.nodeId) return;
    const colorPalette = ['#FFE5E5', '#E5F3FF', '#E8F5E9', '#FFF9E6', '#F3E5F5', '#FCE4EC'];

    setNodes((nds) => nds.map(n => {
      if (n.id === floatingToolbar.nodeId) {
        const currentColor = n.data.color || colorPalette[0];
        const currentIndex = colorPalette.indexOf(currentColor);
        const nextIndex = (currentIndex + 1) % colorPalette.length;
        return { ...n, data: { ...n.data, color: colorPalette[nextIndex] } };
      }
      return n;
    }));
  }, [floatingToolbar.nodeId, setNodes]);

  const _handleQuickComment = useCallback(() => {
    if (!floatingToolbar.nodeId) return;
    const node = nodes.find(n => n.id === floatingToolbar.nodeId);
    if (!node) return;

    const timestamp = Date.now();
    const commentNodeId = `comment-${timestamp}`;
    const commentNode = {
      id: commentNodeId,
      type: 'commentNode',
      position: { x: node.position.x + 300, y: node.position.y },
      data: {
        content: '',
        author: user?.displayName || userProfile?.name || 'User',
        timestamp: new Date().toISOString(),
        createdAt: timestamp,
        onContentChange: (id, content) => {
          setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, content } } : n));
        },
        onDelete: handleDeleteNode,
      }
    };

    setNodes((nds) => [...nds, commentNode]);

    // Create edge connecting comment to parent node
    const newEdge = {
      id: `edge-comment-${timestamp}`,
      source: node.id,
      target: commentNodeId,
      type: 'default',
      animated: false,
      style: { stroke: '#9ca3af', strokeWidth: 1.5 }
    };
    setEdges(eds => [...eds, newEdge]);

    // Update commentCount on the parent node
    setNodes(nds => nds.map(n => {
      if (n.id === node.id) {
        const currentCount = n.data?.commentCount || 0;
        return {
          ...n,
          data: {
            ...n.data,
            commentCount: currentCount + 1
          }
        };
      }
      return n;
    }));

    setFloatingToolbar({ visible: false, nodeId: null, position: { x: 0, y: 0 } });

    // Add notification for comment creation
    const nodeName = node.data?.label || node.data?.content || 'a node';
    const authorName = user?.displayName || userProfile?.name || 'Someone';
    notificationManager.addNotification(
      NotificationType.COMMENT,
      `${authorName} added a comment`,
      {
        nodeId: node.id,
        nodeName: nodeName,
        commentId: commentNode.id,
        author: authorName,
        timestamp: timestamp
      }
    );
  }, [floatingToolbar.nodeId, nodes, setNodes, setEdges, handleDeleteNode, user, userProfile]);

  // Handle selection changes to show/hide floating toolbar
  // Improved UX: Toolbar only appears when re-selecting an already selected node, not on initial selection
  // This reduces visual clutter and makes the toolbar feel more intentional
  const handleSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    if (selectedNodes.length === 1) {
      const selectedNode = selectedNodes[0];
      const isReselecting = previouslySelectedNodeRef.current === selectedNode.id;

      // Only show toolbar if user is re-selecting the same node (intentional action)
      if (isReselecting) {
        // Position toolbar above the selected node
        const toolbarX = selectedNode.position.x + (selectedNode.width || 200) / 2;
        const toolbarY = selectedNode.position.y - 60; // 60px above node
        setFloatingToolbar({
          visible: true,
          nodeId: selectedNode.id,
          position: { x: toolbarX, y: toolbarY }
        });
      } else {
        // First selection - hide toolbar but track this node for future re-selection
        setFloatingToolbar({ visible: false, nodeId: null, position: { x: 0, y: 0 } });
      }

      // Track this as the previously selected node
      previouslySelectedNodeRef.current = selectedNode.id;
    } else {
      // No selection or multiple selection - hide toolbar and reset tracking
      setFloatingToolbar({ visible: false, nodeId: null, position: { x: 0, y: 0 } });
      previouslySelectedNodeRef.current = null;
    }
  }, []);

  // Handle node double-click to show floating toolbar
  // Alternative interaction method for showing the toolbar (in addition to re-selection)
  const _handleNodeDoubleClick = useCallback((event, node) => {
    // Position toolbar above the double-clicked node
    const toolbarX = node.position.x + (node.width || 200) / 2;
    const toolbarY = node.position.y - 60; // 60px above node
    setFloatingToolbar({
      visible: true,
      nodeId: node.id,
      position: { x: toolbarX, y: toolbarY }
    });
    // Track as previously selected so clicking elsewhere and back will also work
    previouslySelectedNodeRef.current = node.id;
  }, []);

  // Smart save handler - saves journey if MAP nodes exist, otherwise saves capsule
  const handleSmartSave = useCallback(async () => {
    const mapNodeTypes = ['prospectNode', 'emailNode', 'waitNode', 'conditionNode', 'exitNode'];
    const hasMapNodes = nodes.some(n => mapNodeTypes.includes(n.type));

    if (hasMapNodes) {
      // Has MAP nodes - save as journey
      await handleSaveJourney();
    } else if (nodes.length > 0) {
      // Has regular nodes - save as capsule
      await handleSaveAndShare();
    } else {
      alert('⚠️ No nodes to save.\n\nAdd some notes or content first.');
    }
  }, [nodes, handleSaveJourney, handleSaveAndShare]);

  // Keyboard shortcuts hook
  const { showHelp: showShortcutsHelp, setShowHelp: setShowShortcutsHelp } = useKeyboardShortcuts({
    onSave: handleSmartSave,
    onExport: handleExportJSON,
    onAddCard: () => handleAddCard('note'),
    onDelete: handleDeleteSelected,
    onDuplicate: handleDuplicateSelected,
    onDeselect: handleDeselect,
    onPan: handlePan,
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
        <div
          ref={reactFlowContainerRef}
          style={{
            display: currentMode === 'studio' ? 'none' : 'block',
            height: '100%',
            touchAction: 'pan-x pan-y pinch-zoom',  // Explicitly enable pan and pinch-zoom for iOS Safari
            WebkitTouchCallout: 'none',             // No iOS context menu on long-press
            WebkitUserSelect: 'none',               // No iOS text selection during gestures
          }}
        >
          {/* Override React Flow's default overflow:hidden on nodes to show delete buttons */}
          <style>{`
            .react-flow__node,
            .react-flow__node > div,
            .react-flow__node-textNode,
            .react-flow__node-photoNode {
              overflow: visible !important;
            }

            /* CRITICAL iOS Safari Pinch-to-Zoom Fix */
            /* Apply touch-action to all React Flow elements to prevent iOS Safari from intercepting */
            /* 2-finger gestures before React Flow can process them. This ensures consistent pinch-to-zoom */
            /* behavior across all iOS Safari versions by explicitly telling the browser at every DOM level */
            /* that React Flow should handle all touch interactions, not the browser's default handlers. */
            .react-flow,
            .react-flow__renderer,
            .react-flow__viewport,
            .react-flow__pane,
            .react-flow__container {
              touch-action: none !important;
              -webkit-user-select: none !important;
              user-select: none !important;
            }

            /* Touch-friendly resize handles - Enhanced for mobile */
            /* Applied to all 10 resizable node types for consistent UX */
            /* position: relative creates stacking context for ::before pseudo-element */
            /* Default handle size for desktop - mobile sizes override in media query below */
            .react-flow__node-photoNode .nodrag,
            .react-flow__node-textNode .nodrag,
            .react-flow__node-stickyNode .nodrag,
            .react-flow__node-todoNode .nodrag,
            .react-flow__node-commentNode .nodrag,
            .react-flow__node-colorSwatchNode .nodrag,
            .react-flow__node-codeBlockNode .nodrag,
            .react-flow__node-groupNode .nodrag,
            .react-flow__node-mapNode .nodrag,
            .react-flow__node-tripPlannerMapNode .nodrag {
              position: relative;
              min-width: 12px;
              min-height: 12px;
              /* iOS Safari touch optimizations */
              touch-action: none;
              -webkit-touch-callout: none;
              -webkit-tap-highlight-color: transparent;
              isolation: isolate;
            }

            /* Add larger invisible touch target around resize handles */
            /* 80px optimal touch target for iOS Safari (Apple HIG recommends 44pt minimum, but 80px improves reliability) */
            /* The ::before pseudo-element creates an enlarged touch area centered on the handle */
            /* z-index: 1 ensures the touch area is above the handle to receive pointer events */
            .react-flow__node-photoNode .nodrag::before,
            .react-flow__node-textNode .nodrag::before,
            .react-flow__node-stickyNode .nodrag::before,
            .react-flow__node-todoNode .nodrag::before,
            .react-flow__node-commentNode .nodrag::before,
            .react-flow__node-colorSwatchNode .nodrag::before,
            .react-flow__node-codeBlockNode .nodrag::before,
            .react-flow__node-groupNode .nodrag::before,
            .react-flow__node-mapNode .nodrag::before,
            .react-flow__node-tripPlannerMapNode .nodrag::before {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) translate3d(0, 0, 0);
              width: 80px;
              height: 80px;
              background: transparent;
              border-radius: 50%;
              pointer-events: auto;
              z-index: 1; /* Changed from -1 to 1 to ensure touch area receives events */
              /* iOS Safari touch optimizations */
              touch-action: none;
              -webkit-touch-callout: none;
            }

            /* Active state glow effect for touch targets - provides radial feedback */
            .react-flow__node-photoNode .nodrag:active::before,
            .react-flow__node-textNode .nodrag:active::before,
            .react-flow__node-stickyNode .nodrag:active::before,
            .react-flow__node-todoNode .nodrag:active::before,
            .react-flow__node-commentNode .nodrag:active::before,
            .react-flow__node-colorSwatchNode .nodrag:active::before,
            .react-flow__node-codeBlockNode .nodrag:active::before,
            .react-flow__node-groupNode .nodrag:active::before,
            .react-flow__node-mapNode .nodrag:active::before,
            .react-flow__node-tripPlannerMapNode .nodrag:active::before,
            .react-flow__node-photoNode .nodrag.active::before,
            .react-flow__node-textNode .nodrag.active::before,
            .react-flow__node-stickyNode .nodrag.active::before,
            .react-flow__node-todoNode .nodrag.active::before,
            .react-flow__node-commentNode .nodrag.active::before,
            .react-flow__node-colorSwatchNode .nodrag.active::before,
            .react-flow__node-codeBlockNode .nodrag.active::before,
            .react-flow__node-groupNode .nodrag.active::before,
            .react-flow__node-mapNode .nodrag.active::before,
            .react-flow__node-tripPlannerMapNode .nodrag.active::before {
              background: radial-gradient(circle, rgba(238, 207, 0, 0.15) 0%, transparent 70%);
              transition: background 0.15s ease;
            }

            /* DEBUG MODE: Uncomment to visualize touch-friendly hit areas */
            /* Useful for testing and verifying touch target sizes during development */
            /*
            .react-flow__node-photoNode .nodrag::before,
            .react-flow__node-textNode .nodrag::before,
            .react-flow__node-stickyNode .nodrag::before,
            .react-flow__node-todoNode .nodrag::before,
            .react-flow__node-commentNode .nodrag::before,
            .react-flow__node-colorSwatchNode .nodrag::before,
            .react-flow__node-codeBlockNode .nodrag::before,
            .react-flow__node-groupNode .nodrag::before,
            .react-flow__node-mapNode .nodrag::before,
            .react-flow__node-tripPlannerMapNode .nodrag::before {
              background: rgba(255, 0, 0, 0.2) !important;
              border: 2px dashed rgba(255, 0, 0, 0.5) !important;
            }
            */

            /* Make resize handles more visible and larger on mobile/touch devices */
            @media (hover: none) and (pointer: coarse) {
              .react-flow__node-photoNode .nodrag,
              .react-flow__node-groupNode .nodrag,
              .react-flow__node-codeBlockNode .nodrag,
              .react-flow__node-markdownNode .nodrag,
              .react-flow__node-tableNode .nodrag,
              .react-flow__node-kpiTrackerNode .nodrag {
                width: 20px !important;
                height: 20px !important;
                border-width: 3px !important;
              }

              /* Larger touch targets on mobile (80px optimized for iOS Safari) */
              .react-flow__node-photoNode .nodrag::before,
              .react-flow__node-groupNode .nodrag::before,
              .react-flow__node-codeBlockNode .nodrag::before,
              .react-flow__node-markdownNode .nodrag::before,
              .react-flow__node-tableNode .nodrag::before,
              .react-flow__node-kpiTrackerNode .nodrag::before {
                width: 80px;
                height: 80px;
                /* iOS Safari hardware acceleration */
                -webkit-transform: translate(-50%, -50%) translate3d(0, 0, 0);
                transform: translate(-50%, -50%) translate3d(0, 0, 0);
              }

              /* Show handles more prominently on selected nodes with yellow highlight */
              .react-flow__node.selected .nodrag {
                background-color: rgba(238, 207, 0, 0.9) !important;
                box-shadow: 0 0 0 2px rgba(238, 207, 0, 0.3),
                            0 2px 8px rgba(0, 0, 0, 0.2);
                animation: pulse-resize 1.5s ease-in-out infinite;
              }
            }

            /* Pulse animation for resize handles on mobile - draws attention to resizability */
            @keyframes pulse-resize {
              0%, 100% {
                transform: scale(1);
                opacity: 1;
              }
              50% {
                transform: scale(1.15);
                opacity: 0.85;
              }
            }

            /* Hover state for desktop - visual feedback on mouse hover */
            @media (hover: hover) and (pointer: fine) {
              .react-flow__node-photoNode .nodrag:hover,
              .react-flow__node-groupNode .nodrag:hover,
              .react-flow__node-codeBlockNode .nodrag:hover,
              .react-flow__node-markdownNode .nodrag:hover,
              .react-flow__node-tableNode .nodrag:hover,
              .react-flow__node-kpiTrackerNode .nodrag:hover {
                transform: scale(1.3);
                box-shadow: 0 2px 12px rgba(238, 207, 0, 0.4);
                transition: transform 0.15s ease, box-shadow 0.15s ease;
              }
            }

            /* Active state for resize handles - visual feedback during resize */
            .react-flow__node-photoNode .nodrag:active,
            .react-flow__node-groupNode .nodrag:active,
            .react-flow__node-codeBlockNode .nodrag:active,
            .react-flow__node-markdownNode .nodrag:active,
            .react-flow__node-tableNode .nodrag:active,
            .react-flow__node-kpiTrackerNode .nodrag:active,
            .react-flow__node-photoNode .nodrag.active,
            .react-flow__node-groupNode .nodrag.active,
            .react-flow__node-codeBlockNode .nodrag.active,
            .react-flow__node-markdownNode .nodrag.active,
            .react-flow__node-tableNode .nodrag.active,
            .react-flow__node-kpiTrackerNode .nodrag.active {
              transform: scale(1.2);
              background-color: rgba(238, 207, 0, 1) !important;
              box-shadow: 0 0 0 3px rgba(238, 207, 0, 0.3),
                          0 4px 16px rgba(238, 207, 0, 0.4);
              transition: all 0.15s ease;
            }

            /* Ensure resize handles are above other elements */
            .react-flow__node-photoNode .nodrag,
            .react-flow__node-groupNode .nodrag,
            .react-flow__node-codeBlockNode .nodrag,
            .react-flow__node-markdownNode .nodrag,
            .react-flow__node-tableNode .nodrag,
            .react-flow__node-kpiTrackerNode .nodrag {
              z-index: 25 !important;
            }

            /* Prevent accidental text selection during resize operations */
            .react-flow__node-photoNode .nodrag *,
            .react-flow__node-groupNode .nodrag *,
            .react-flow__node-codeBlockNode .nodrag *,
            .react-flow__node-markdownNode .nodrag *,
            .react-flow__node-tableNode .nodrag *,
            .react-flow__node-kpiTrackerNode .nodrag * {
              user-select: none;
              -webkit-user-select: none;
              -webkit-touch-callout: none;
            }
          `}</style>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeWithHistory}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={_handleNodeDragStart}
            onNodeDrag={handleNodeDrag}
            onNodeDragStop={handleNodeDragStop}
            onSelectionChange={handleSelectionChange}
            onMove={(event, viewport) => {
              // Only update zoom level during single-touch pan to avoid unnecessary state updates
              // during pinch-to-zoom. The useEffect hook (lines 2892-2898) will handle zoom updates.
              const touchCount = event?.sourceEvent?.touches?.length || event?.touches?.length || 0;
              if (touchCount < 2) {
                setZoomLevel(viewport.zoom);
              }
            }}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            // Pan gesture configuration for desktop and mobile
            // panOnDrag=[1, 2] enables 1-finger and 2-finger panning for optimal iOS Safari compatibility
            // This eliminates gesture disambiguation delays by allowing React Flow to immediately
            // delegate 2-finger gestures to the pinch-zoom handler without checking if they're pan gestures
            // Prevents race conditions on iOS Safari between 2-finger pan and pinch gestures
            panOnDrag={[1, 2]}
            selectionOnDrag={true}
            // Prevent accidental node selection during pan gestures on mobile
            // This fixes the conflict between panning and node selection on touch devices
            selectNodesOnDrag={false}
            // iOS Safari Touch Gesture Configuration (Updated Dec 2025)
            // panOnScroll=false prevents scroll conflicts with pinch-to-zoom gestures
            // panOnDrag=[1, 2] enables optimized panning for iOS Safari (see above for details)
            panOnScroll={false}
            zoomOnScroll={false}
            // zoomOnPinch enabled - React Flow handles pinch gestures natively on ALL platforms
            // IMPORTANT: React Flow uses optimized passive event listeners internally for iOS Safari
            // This provides smooth, immediate gesture recognition without JavaScript delays
            // The useIOSPinchZoom hook is now DISABLED as it was causing performance issues
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
            // preventScrolling=false allows iOS Safari to properly deliver touch events for pinch gestures
            // React Flow's internal gesture handling works perfectly without custom intervention
            preventScrolling={false}
            minZoom={0.25}
            maxZoom={2.0}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
          >
            {backgroundPattern !== 'none' && (
              <Background
                variant={backgroundPattern}
                gap={24}
                size={2}
                color={currentTheme.dotColor}
                style={{ opacity: 0.3 }}
              />
            )}
            {/* Canvas Minimap - toggleable navigation overview (smaller, more transparent) */}
            {showMinimap && (
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.type === 'groupNode') return 'rgba(156, 163, 175, 0.6)';
                  if (n.type === 'stickyNode') return 'rgba(251, 191, 36, 0.7)';
                  if (n.type === 'photoNode') return 'rgba(249, 115, 22, 0.7)';
                  return 'rgba(229, 231, 235, 0.6)';
                }}
                nodeColor={(n) => {
                  if (n.type === 'groupNode') return 'rgba(156, 163, 175, 0.15)';
                  if (n.type === 'stickyNode') {
                    const colors = {
                      yellow: 'rgba(251, 191, 36, 0.5)',
                      pink: 'rgba(236, 72, 153, 0.5)',
                      blue: 'rgba(59, 130, 246, 0.5)',
                      green: 'rgba(34, 197, 94, 0.5)',
                      orange: 'rgba(249, 115, 22, 0.5)',
                      purple: 'rgba(168, 85, 247, 0.5)'
                    };
                    return colors[n.data?.color] || 'rgba(251, 191, 36, 0.5)';
                  }
                  if (n.type === 'photoNode') return 'rgba(249, 115, 22, 0.4)';
                  return 'rgba(243, 244, 246, 0.5)';
                }}
                nodeBorderRadius={3}
                maskColor="rgba(0, 0, 0, 0.03)"
                style={{
                  width: 140,
                  height: 90,
                  backgroundColor: currentTheme.minimapBg,
                  border: `1px solid ${currentTheme.minimapBorder}`,
                  borderRadius: '6px',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                }}
                pannable
                zoomable
              />
            )}
          </ReactFlow>
        </div>
      </div>

      {/* Status Bar is now integrated into UnityCircleNav */}

      {/* Mobile Node Navigator - Jump between canvas areas */}
      <MobileNodeNavigator nodes={nodes} />

      {/* Panning Visual Indicator - Touch gesture feedback for mobile devices */}
      {showPanningIndicator && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(59, 130, 246, 0.15)', // Blue tint with transparency
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)', // Safari support
            border: '2px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '16px',
            padding: '12px 20px',
            zIndex: 9999,
            pointerEvents: 'none', // Don't interfere with touch events
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
            }

            @keyframes zoomFlash {
              0% {
                transform: translateX(-100%);
                opacity: 0.4;
              }
              50% {
                opacity: 0.8;
              }
              100% {
                transform: translateX(200%);
                opacity: 0;
              }
            }

            @keyframes zoomPulse {
              0%, 100% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.08);
              }
            }
          `}</style>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(59, 130, 246, 0.9)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3" />
          </svg>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'rgba(59, 130, 246, 0.95)',
              letterSpacing: '0.3px',
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
            }}
          >
            Panning
          </span>
        </div>
      )}

      {/* Comment Count Badges - Show how many comments are attached to each node */}
      {Object.entries(commentCounts).map(([nodeId, count]) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || count === 0) return null;

        const viewport = getViewport();

        // Calculate the position of the badge in screen coordinates
        const x = node.position.x * viewport.zoom + viewport.x;
        const y = node.position.y * viewport.zoom + viewport.y;

        // Position badge at top-right corner of node
        const nodeWidth = node.width || 200; // default width if not set
        const badgeX = x + (nodeWidth * viewport.zoom) - 10;
        const badgeY = y - 10;

        return (
          <div
            key={`badge-${nodeId}`}
            style={{
              position: 'absolute',
              left: `${badgeX}px`,
              top: `${badgeY}px`,
              zIndex: 1000,
              backgroundColor: '#f59e0b', // amber-500
              color: 'white',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              border: '2px solid white',
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <span>💬</span>
            <span>{count}</span>
          </div>
        );
      })}

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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, minWidth: 14, minHeight: 14 }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {/* Zoom Level Indicator */}
        <div
          className="zoom-level-indicator"
          style={{
            fontSize: '10px',
            fontWeight: '700',
            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(31, 41, 55, 0.9)',
            letterSpacing: '0.03em',
            textAlign: 'center',
            minWidth: '38px',
            padding: '4px 6px',
            borderRadius: '4px',
            background: theme === 'dark'
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.12))'
              : 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.08))',
            border: `1px solid ${theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(251, 191, 36, 0.25)'}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            position: 'relative',
            overflow: 'hidden',
            animation: 'zoomPulse 0.3s ease-out'
          }}
          key={Math.round(zoomLevel * 100)} // Trigger re-animation on zoom change
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            background: theme === 'dark'
              ? 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.15), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.2), transparent)',
            animation: 'zoomFlash 0.4s ease-out',
            pointerEvents: 'none'
          }} />
          <span style={{ position: 'relative', zIndex: 1 }}>
            {Math.round(zoomLevel * 100)}%
          </span>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, minWidth: 14, minHeight: 14 }}>
            <path d="M5 12h14" />
          </svg>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, minWidth: 14, minHeight: 14 }}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, minWidth: 14, minHeight: 14 }}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>

        {/* Duplicate Selected Button */}
        <button
          onClick={handleDuplicateSelected}
          disabled={!nodes.some(n => n.selected)}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: nodes.some(n => n.selected) ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${nodes.some(n => n.selected) ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.06)'}`,
            borderRadius: '4px',
            cursor: nodes.some(n => n.selected) ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            if (nodes.some(n => n.selected)) {
              e.currentTarget.style.backgroundColor = 'rgba(147, 51, 234, 0.15)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = nodes.some(n => n.selected) ? 'rgba(0, 0, 0, 0.04)' : 'rgba(0, 0, 0, 0.02)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Duplicate Selected (Ctrl+D)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={nodes.some(n => n.selected) ? '#6b7280' : 'rgba(0, 0, 0, 0.3)'} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, minWidth: 14, minHeight: 14 }}>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>

        {/* Convert to Todo Button - TODO: Implement handleConvertSelectedGroupToTodo
        {(() => {
          const selectedNode = nodes.find(n => n.selected);
          if (selectedNode?.type === 'groupNode') {
            return (
              <button
                onClick={() => {
                  handleConvertSelectedGroupToTodo();
                }}
                title="Convert group to todo checklist"
                style={{...}}
              >
                <span style={{ fontSize: '16px' }}>✅</span>
              </button>
            );
          }
          return null;
        })()} */}

        {/* Bookmark/Star Button */}
        <button
          onClick={handleToggleBookmark}
          disabled={!currentCapsuleId}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isBookmarked ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0, 0, 0, 0.04)',
            border: `1px solid ${isBookmarked ? 'rgba(251, 191, 36, 0.5)' : 'rgba(0, 0, 0, 0.12)'}`,
            borderRadius: '4px',
            cursor: currentCapsuleId ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s, transform 0.2s',
            opacity: currentCapsuleId ? 1 : 0.5,
          }}
          onMouseEnter={(e) => {
            if (currentCapsuleId) {
              e.currentTarget.style.backgroundColor = isBookmarked ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.15)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isBookmarked ? 'rgba(251, 191, 36, 0.2)' : 'rgba(0, 0, 0, 0.04)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={currentCapsuleId ? (isBookmarked ? 'Remove from Saved' : 'Save to Bookmarks') : 'Save canvas first to bookmark'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked ? '#fbbf24' : 'none'} stroke={isBookmarked ? '#fbbf24' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, minWidth: 14, minHeight: 14 }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>

        {/* Minimap Toggle Button */}
        <button
          onClick={() => setShowMinimap(!showMinimap)}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: showMinimap ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.04)',
            border: `1px solid ${showMinimap ? 'rgba(59, 130, 246, 0.4)' : 'rgba(0, 0, 0, 0.12)'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = showMinimap ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = showMinimap ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.04)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showMinimap ? '#3b82f6' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, minWidth: 14, minHeight: 14 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 3v18" />
          </svg>
        </button>

        {/* Overview Tray Toggle Button */}
        <button
          onClick={() => setShowOverviewTray(!showOverviewTray)}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: showOverviewTray ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.04)',
            border: `1px solid ${showOverviewTray ? 'rgba(59, 130, 246, 0.4)' : 'rgba(0, 0, 0, 0.12)'}`,
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = showOverviewTray ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = showOverviewTray ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.04)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={showOverviewTray ? 'Hide Overview' : 'Show Overview'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showOverviewTray ? '#3b82f6' : '#6b7280'} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, minWidth: 14, minHeight: 14 }}>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Theme Selector Button & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            id="theme-selector-button"
            onClick={() => setShowThemeSelector(!showThemeSelector)}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: showThemeSelector ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 0, 0, 0.04)',
              border: `1px solid ${showThemeSelector ? 'rgba(251, 191, 36, 0.4)' : 'rgba(0, 0, 0, 0.12)'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s, transform 0.2s, border-color 0.2s',
              fontSize: '16px',
            }}
            onMouseEnter={(e) => {
              if (!showThemeSelector) {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showThemeSelector) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            title={`Theme: ${theme}`}
          >
            {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🌅'}
          </button>

          {/* Theme Selector Dropdown */}
          {showThemeSelector && (
            <div
              id="theme-selector-dropdown"
              style={{
                position: 'absolute',
                top: '38px',
                left: '0',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 10000,
                minWidth: '140px',
                overflow: 'hidden',
              }}
            >
              {/* Light Theme Option */}
              <button
                onClick={() => {
                  setTheme('light');
                  setShowThemeSelector(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: theme === 'light' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'light' ? 'rgba(251, 191, 36, 0.1)' : 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>☀️</span>
                <span style={{ color: '#1f2937', fontWeight: theme === 'light' ? '600' : '400' }}>Light</span>
              </button>

              {/* Dark Theme Option */}
              <button
                onClick={() => {
                  setTheme('dark');
                  setShowThemeSelector(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>🌙</span>
                <span style={{ color: '#1f2937', fontWeight: theme === 'dark' ? '600' : '400' }}>Dark</span>
              </button>

              {/* Sunset Theme Option */}
              <button
                onClick={() => {
                  setTheme('sunset');
                  setShowThemeSelector(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: theme === 'sunset' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'sunset' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'sunset' ? 'rgba(251, 191, 36, 0.1)' : 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>🌅</span>
                <span style={{ color: '#1f2937', fontWeight: theme === 'sunset' ? '600' : '400' }}>Sunset</span>
              </button>
            </div>
          )}
        </div>

        {/* Background Pattern Selector Button & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            id="background-selector-button"
            onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: showBackgroundSelector ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 0, 0, 0.04)',
              border: `1px solid ${showBackgroundSelector ? 'rgba(251, 191, 36, 0.4)' : 'rgba(0, 0, 0, 0.12)'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s, transform 0.2s, border-color 0.2s',
              fontSize: '16px',
            }}
            onMouseEnter={(e) => {
              if (!showBackgroundSelector) {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                e.currentTarget.style.transform = 'scale(1.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showBackgroundSelector) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            title={`Background: ${backgroundPattern}`}
          >
            {backgroundPattern === 'dots' ? '⚫' : backgroundPattern === 'lines' ? '▬' : backgroundPattern === 'cross' ? '✚' : '⬜'}
          </button>

          {/* Background Pattern Selector Dropdown */}
          {showBackgroundSelector && (
            <div
              id="background-selector-dropdown"
              style={{
                position: 'absolute',
                top: '38px',
                left: '0',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 10000,
                minWidth: '140px',
                overflow: 'hidden',
              }}
            >
              {/* Dots Pattern Option */}
              <button
                onClick={() => {
                  setBackgroundPattern('dots');
                  setShowBackgroundSelector(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: backgroundPattern === 'dots' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = backgroundPattern === 'dots' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = backgroundPattern === 'dots' ? 'rgba(251, 191, 36, 0.1)' : 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>⚫</span>
                <span style={{ color: '#1f2937', fontWeight: backgroundPattern === 'dots' ? '600' : '400' }}>Dots</span>
              </button>

              {/* Lines Pattern Option */}
              <button
                onClick={() => {
                  setBackgroundPattern('lines');
                  setShowBackgroundSelector(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: backgroundPattern === 'lines' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = backgroundPattern === 'lines' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = backgroundPattern === 'lines' ? 'rgba(251, 191, 36, 0.1)' : 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>▬</span>
                <span style={{ color: '#1f2937', fontWeight: backgroundPattern === 'lines' ? '600' : '400' }}>Lines</span>
              </button>

              {/* Cross Pattern Option */}
              <button
                onClick={() => {
                  setBackgroundPattern('cross');
                  setShowBackgroundSelector(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: backgroundPattern === 'cross' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = backgroundPattern === 'cross' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = backgroundPattern === 'cross' ? 'rgba(251, 191, 36, 0.1)' : 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>✚</span>
                <span style={{ color: '#1f2937', fontWeight: backgroundPattern === 'cross' ? '600' : '400' }}>Cross</span>
              </button>

              {/* None Pattern Option */}
              <button
                onClick={() => {
                  setBackgroundPattern('none');
                  setShowBackgroundSelector(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: backgroundPattern === 'none' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = backgroundPattern === 'none' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = backgroundPattern === 'none' ? 'rgba(251, 191, 36, 0.1)' : 'transparent';
                }}
              >
                <span style={{ fontSize: '16px' }}>⬜</span>
                <span style={{ color: '#1f2937', fontWeight: backgroundPattern === 'none' ? '600' : '400' }}>None</span>
              </button>
            </div>
          )}
        </div>

        {/* Custom Color Picker Button & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            id="color-picker-button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: showColorPicker ? currentAccentColor.bg : 'rgba(0, 0, 0, 0.04)',
              border: `1px solid ${showColorPicker ? currentAccentColor.border : 'rgba(0, 0, 0, 0.12)'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s, transform 0.2s, border-color 0.2s',
              fontSize: '16px',
            }}
            onMouseEnter={(e) => {
              if (!showColorPicker) {
                e.currentTarget.style.backgroundColor = currentAccentColor.bg;
                e.currentTarget.style.transform = 'scale(1.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showColorPicker) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            title={`Accent Color: ${currentAccentColor.name}`}
          >
            🎨
          </button>

          {/* Color Picker Dropdown */}
          {showColorPicker && (
            <div
              id="color-picker-dropdown"
              style={{
                position: 'absolute',
                top: '38px',
                left: '0',
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 10000,
                minWidth: '140px',
                overflow: 'hidden',
              }}
            >
              {Object.entries(accentColors).map(([colorId, colorData], index, arr) => (
                <button
                  key={colorId}
                  onClick={() => {
                    setCustomAccentColor(colorId);
                    setShowColorPicker(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: customAccentColor === colorId ? colorData.bg : 'transparent',
                    border: 'none',
                    borderBottom: index < arr.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = customAccentColor === colorId ? colorData.bg : 'rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = customAccentColor === colorId ? colorData.bg : 'transparent';
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: colorData.color,
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  }} />
                  <span style={{ color: '#1f2937', fontWeight: customAccentColor === colorId ? '600' : '400' }}>
                    {colorData.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showModePanel ? '#b45309' : '#6b7280'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, minWidth: 14, minHeight: 14 }}>
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
        onClose={() => {
          setShowAICanvasModal(false);
          setIsGeneratingCanvas(false);
        }}
        onGenerate={handleAICanvasGenerate}
        isGenerating={isGeneratingCanvas}
        conversationHistory={aiConversationHistory}
        onUpdateHistory={updateAiConversationHistory}
        onClearHistory={clearAiConversationHistory}
      />

      {/* Overview Tray - Right-side panel */}
      <OverviewTray
        isOpen={showOverviewTray}
        onClose={() => setShowOverviewTray(false)}
        nodes={nodes}
        starredNodes={starredNodes}
        bookmarkedCapsules={bookmarkedCapsules}
        notifications={notifications}
        onNodeClick={(node) => {
          // Focus on the clicked node
          const { x, y } = node.position;
          // For child nodes, calculate absolute position
          const parentNode = node.parentId ? nodes.find(n => n.id === node.parentId) : null;
          const absX = parentNode ? parentNode.position.x + x : x;
          const absY = parentNode ? parentNode.position.y + y : y;
          setCenter(absX + 100, absY + 75, { duration: 400, zoom: 1.2 });
          setShowOverviewTray(false);
        }}
        onCapsuleLoad={(capsule) => {
          // Navigate to edit the capsule
          window.location.href = `/unity-notes?capsule=${capsule.id}`;
        }}
        onNotificationClick={(notification) => {
          console.log('Notification clicked:', notification);
        }}
        onUnstar={async (capsuleId) => {
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
        }}
        onUnstarNode={handleUnstarNode}
        onRenameCapsule={async (capsuleId, newTitle) => {
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
        }}
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
