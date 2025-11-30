import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useLayout } from '../contexts/LayoutContext';
import { navigationItems } from '../config/navigationItems';
import DraggablePhotoNode from '../components/travel/DraggablePhotoNode';
import TextNoteNode from '../components/unity-plus/TextNoteNode';
import PhotoUploadModal from '../components/travel/PhotoUploadModal';
import ShareModal from '../components/travel/ShareModal';
import LightboxModal from '../components/travel/LightboxModal';
import EditMemoryModal from '../components/travel/EditMemoryModal';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { uploadMultipleToCloudinary } from '../utils/cloudinaryUpload';
import { useFirebaseCapsule } from '../hooks/useFirebaseCapsule';

/**
 * UnityNotePlusPage - Multi-card canvas workspace (v2)
 *
 * Inspired by ThreadDeck features:
 * - Multiple card types: Photo, Text Note, Link, AI Chat, Video
 * - Dark/Light theme toggle
 * - Quick add floating panel
 * - AI integration support
 */

const nodeTypes = {
  photoNode: DraggablePhotoNode,
  textNode: TextNoteNode,
};

const STORAGE_KEY = 'unity-notes-plus-data';

// Card type configuration
const CARD_TYPES = {
  photo: { label: 'Photo', icon: '🖼️', color: '#EECF00' },
  note: { label: 'Note', icon: '📝', color: '#3B82F6' },
  link: { label: 'Link', icon: '🔗', color: '#8B5CF6' },
  ai: { label: 'AI Chat', icon: '🤖', color: '#10B981' },
  video: { label: 'Video', icon: '📹', color: '#EF4444' },
};

// Card types removed - using unified context menu like Unity Notes

// Theme Toggle Component
const ThemeToggle = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: isDark ? '#374151' : '#f3f4f6',
        border: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
        cursor: 'pointer',
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 150,
        transition: 'all 0.3s ease',
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

const UnityNotePlusFlow = ({
  isUploadModalOpen,
  setIsUploadModalOpen,
  onFooterToggle,
  theme,
  setTheme
}) => {
  const navigate = useNavigate();
  const { fitView, zoomIn, zoomOut, getZoom } = useReactFlow();
  const { sidebarOpen } = useLayout();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showContextMenu, setShowContextMenu] = useState(false);

  // Firebase hook for shareable URLs
  const { saveCapsule, isSaving } = useFirebaseCapsule();
  const [shareUrl, setShareUrl] = useState('');
  const [currentCapsuleId, setCurrentCapsuleId] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

  // Edit memory state
  const [editingMemory, setEditingMemory] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const isDark = theme === 'dark';

  // Load from localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const { nodes: savedNodes, edges: savedEdges, theme: savedTheme } = JSON.parse(savedData);
        console.log('📥 Loaded:', savedNodes?.length || 0, 'cards');
        if (savedNodes && savedNodes.length > 0) {
          setNodes(savedNodes);
        }
        if (savedEdges && savedEdges.length > 0) {
          setEdges(savedEdges);
        }
        if (savedTheme) {
          setTheme(savedTheme);
        }
      }
    } catch (error) {
      console.error('❌ Load error:', error);
    } finally {
      setIsInitialized(true);
    }
  }, [setNodes, setEdges, setTheme]);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges, theme }));
      console.log('💾 Saved:', nodes.length, 'cards');
    } catch (error) {
      console.error('❌ Save error:', error);
    }
  }, [nodes, edges, theme, isInitialized]);

  // Handle node updates
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

  // Handle photo resize
  const handlePhotoResize = useCallback((nodeId, newSize) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, size: newSize } }
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

  // Handle delete
  const handleDeleteMemory = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== editingNodeId));
    setEdges((eds) => eds.filter((edge) =>
      edge.source !== editingNodeId && edge.target !== editingNodeId
    ));
  }, [editingNodeId, setNodes, setEdges]);

  // Ensure all nodes have callbacks
  useEffect(() => {
    if (!isInitialized) return;

    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          theme,
          onResize: handlePhotoResize,
          onLightbox: handleLightbox,
          onEdit: handleEdit,
          onUpdate: handleNodeUpdate,
        }
      }))
    );
  }, [isInitialized, theme, handlePhotoResize, handleLightbox, handleEdit, handleNodeUpdate, setNodes]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Add new card
  const handleAddCard = useCallback((type) => {
    const timestamp = Date.now();
    const totalNodes = nodes.length;
    const gridX = totalNodes % 6;
    const gridY = Math.floor(totalNodes / 6);

    let newNode;

    if (type === 'photo') {
      setIsUploadModalOpen(true);
      return;
    }

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
          color: CARD_TYPES.note.color,
          theme,
          createdAt: timestamp,
          onUpdate: handleNodeUpdate,
        }
      };
    } else if (type === 'link') {
      // Link card - placeholder for now
      newNode = {
        id: `link-${timestamp}`,
        type: 'textNode',
        position: {
          x: 300 + gridX * 350,
          y: 100 + gridY * 300
        },
        data: {
          title: 'New Link',
          content: 'Link cards coming soon...',
          color: CARD_TYPES.link.color,
          theme,
          createdAt: timestamp,
          onUpdate: handleNodeUpdate,
        }
      };
    } else if (type === 'ai') {
      // AI Chat card - placeholder
      newNode = {
        id: `ai-${timestamp}`,
        type: 'textNode',
        position: {
          x: 300 + gridX * 350,
          y: 100 + gridY * 300
        },
        data: {
          title: 'AI Chat',
          content: 'AI chat integration coming soon...',
          color: CARD_TYPES.ai.color,
          theme,
          createdAt: timestamp,
          onUpdate: handleNodeUpdate,
        }
      };
    } else if (type === 'video') {
      // Video card - placeholder
      newNode = {
        id: `video-${timestamp}`,
        type: 'textNode',
        position: {
          x: 300 + gridX * 350,
          y: 100 + gridY * 300
        },
        data: {
          title: 'New Video',
          content: 'Video embeds coming soon...',
          color: CARD_TYPES.video.color,
          theme,
          createdAt: timestamp,
          onUpdate: handleNodeUpdate,
        }
      };
    }

    if (newNode) {
      setNodes((nds) => [...nds, newNode]);
      setTimeout(() => {
        fitView({ duration: 400, padding: 0.2 });
      }, 100);
    }
  }, [nodes.length, theme, handleNodeUpdate, setNodes, fitView, setIsUploadModalOpen]);

  // Photo upload handler
  const handlePhotoUpload = async (filesOrUrls, metadata, uploadType) => {
    try {
      let imageUrls = [];

      if (uploadType === 'url') {
        imageUrls = filesOrUrls;
      } else {
        const results = await uploadMultipleToCloudinary(filesOrUrls);
        imageUrls = results.filter(r => !r.error).map(r => r.url);

        if (imageUrls.length === 0 && filesOrUrls.length > 0) {
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

      const newNodes = imageUrls.map((imageUrl, index) => {
        const totalNodes = nodes.length + index;
        const gridX = totalNodes % 6;
        const gridY = Math.floor(totalNodes / 6);
        const size = Math.floor(Math.random() * 100) + 300;
        const timestamp = Date.now();

        return {
          id: `photo-${timestamp}-${index}`,
          type: 'photoNode',
          position: {
            x: 300 + gridX * 450,
            y: 100 + gridY * 450
          },
          data: {
            imageUrl,
            location: metadata.location,
            date: metadata.date,
            description: metadata.description,
            size,
            theme,
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

  // Export JSON
  const handleExportJSON = () => {
    if (nodes.length === 0) {
      alert('⚠️ No cards to export.');
      return;
    }

    const exportData = {
      version: '2.0',
      type: 'unity-notes-plus',
      exportDate: new Date().toISOString(),
      theme,
      nodes,
      edges
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unity-notes-plus-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Clear all
  const handleClearAll = () => {
    if (confirm('⚠️ Clear all cards?\n\nThis cannot be undone.')) {
      setNodes([]);
      setEdges([]);
      localStorage.removeItem(STORAGE_KEY);
      setShowContextMenu(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 20 }}>
      {/* Theme Toggle */}
      <ThemeToggle theme={theme} onToggle={() => setTheme(isDark ? 'light' : 'dark')} />

      {/* React Flow Canvas */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 'min(max(280px, 35vw), 472px)' : '0px',
        right: 0,
        bottom: 0,
        transition: 'left 0.5s ease-out',
        zIndex: 1,
        backgroundColor: isDark ? '#111827' : '#ffffff',
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
            color={isDark ? '#374151' : '#d1d5db'}
            style={{ opacity: isDark ? 0.5 : 0.3 }}
          />
        </ReactFlow>
      </div>

      {/* Circle Nav - Bottom Center (same as Unity Notes) */}
      <div
        onClick={() => setIsUploadModalOpen(true)}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowContextMenu(!showContextMenu);
        }}
        data-context-menu
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '78px',
          height: '78px',
          cursor: 'pointer',
          zIndex: 80,
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
        title="Add Note (Right-click for more options)"
      >
        <img
          src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494537/NavCircle_ioqlsr.png"
          alt="Add Note"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'rotate(0deg)',
            transition: 'transform 0.3s ease-out',
            pointerEvents: 'none'
          }}
        />
        {/* Plus Symbol */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '32px',
          fontWeight: '300',
          color: 'black',
          pointerEvents: 'none',
          lineHeight: '1'
        }}>
          +
        </div>
      </div>

      {/* Zoom Controls */}
      <div style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        padding: '12px 8px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      }}>
        <button
          onClick={() => zoomIn({ duration: 200 })}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#EECF00',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: '700',
            color: 'black',
          }}
        >+</button>

        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: isDark ? '#9ca3af' : '#6b7280',
          textAlign: 'center',
          minWidth: '45px'
        }}>
          {Math.round(getZoom() * 100)}%
        </div>

        <button
          onClick={() => zoomOut({ duration: 200 })}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#EECF00',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '24px',
            fontWeight: '700',
            color: 'black',
          }}
        >−</button>

        <button
          onClick={() => fitView({ duration: 400, padding: 0.2 })}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
            border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px',
            color: isDark ? '#d1d5db' : '#1f2937',
            marginTop: '4px'
          }}
        >⊙</button>
      </div>

      {/* Context Menu - Center aligned, same as Unity Notes */}
      {showContextMenu && (
        <div style={{
          position: 'fixed',
          bottom: '130px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(8px)',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          zIndex: 200,
          minWidth: '180px'
        }}>
          <button
            onClick={() => {
              setIsUploadModalOpen(true);
              setShowContextMenu(false);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#EECF00',
              color: 'black',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              marginBottom: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#fbbf24'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#EECF00'}
          >
            + ADD NOTE
          </button>

          <button
            onClick={() => { handleExportJSON(); setShowContextMenu(false); }}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              marginBottom: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            EXPORT
          </button>

          <button
            onClick={handleClearAll}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              marginBottom: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            CLEAR
          </button>

          {/* Separator */}
          <div style={{ height: '1px', backgroundColor: '#e5e5e5', margin: '4px 0' }} />

          <button
            onClick={() => {
              onFooterToggle();
              setShowContextMenu(false);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
          >
            FOOTER
          </button>
        </div>
      )}

      {/* Empty State */}
      {nodes.length === 0 && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          padding: '40px',
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          maxWidth: '400px',
          zIndex: 85
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: isDark ? '#f3f4f6' : '#1f2937',
            marginBottom: '12px'
          }}>
            Unity Notes Plus
          </h2>
          <p style={{
            fontSize: '14px',
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: '24px',
            lineHeight: '1.5'
          }}>
            Your multi-card canvas workspace.<br />
            Click the + button to add your first card.
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            fontSize: '12px',
            color: isDark ? '#6b7280' : '#9ca3af',
          }}>
            {Object.entries(CARD_TYPES).map(([type, config]) => (
              <span key={type} style={{
                padding: '4px 12px',
                backgroundColor: `${config.color}20`,
                borderRadius: '12px',
                color: config.color,
                fontWeight: '600',
              }}>
                {config.icon} {config.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal - With card types for Plus version */}
      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handlePhotoUpload}
        cardTypes={CARD_TYPES}
        onAddCard={handleAddCard}
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
    </div>
  );
};

function UnityNotePlusPage() {
  const navigate = useNavigate();
  const { handleFooterToggle, handleMenuToggle } = useLayout();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  // Handle circle nav click - opens upload modal for Unity Notes+
  const handleCircleNavClick = () => {
    setIsUploadModalOpen(true);
  };

  return (
    <ErrorBoundary>
      <Layout
        onHomeClick={handleHomeClick}
        onFooterToggle={handleFooterToggle}
        onMenuToggle={handleMenuToggle}
        navigationItems={navigationItems}
        pageLabel="UNITY NOTES+"
        sidebarVariant="hidden"
        circleNavBehavior={handleCircleNavClick}
      >
        <ReactFlowProvider>
          <UnityNotePlusFlow
            isUploadModalOpen={isUploadModalOpen}
            setIsUploadModalOpen={setIsUploadModalOpen}
            onFooterToggle={handleFooterToggle}
            theme={theme}
            setTheme={setTheme}
          />
        </ReactFlowProvider>
      </Layout>
    </ErrorBoundary>
  );
}

export default UnityNotePlusPage;
