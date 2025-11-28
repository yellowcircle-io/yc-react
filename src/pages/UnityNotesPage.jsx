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
import DraggablePhotoNode from '../components/travel/DraggablePhotoNode';
import PhotoUploadModal from '../components/travel/PhotoUploadModal';
import ShareModal from '../components/travel/ShareModal';
import LightboxModal from '../components/travel/LightboxModal';
import EditMemoryModal from '../components/travel/EditMemoryModal';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { uploadMultipleToCloudinary } from '../utils/cloudinaryUpload';
import { useFirebaseCapsule } from '../hooks/useFirebaseCapsule';

const nodeTypes = {
  photoNode: DraggablePhotoNode,
};

const STORAGE_KEY = 'unity-notes-data';

const UnityNotesFlow = ({ isUploadModalOpen, setIsUploadModalOpen, onFooterToggle, showContextMenu, setShowContextMenu }) => {
  const navigate = useNavigate();
  const { fitView, zoomIn, zoomOut, getZoom, setViewport } = useReactFlow();
  const { sidebarOpen } = useLayout();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

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

  // Load from localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedData);
        console.log('📥 Loaded:', savedNodes?.length || 0, 'notes');
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
    console.log('🖼️ Opening lightbox for note:', photoData);
    setLightboxPhoto(photoData);
    setShowLightbox(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((nodeId, photoData) => {
    console.log('✏️ Editing note:', nodeId, photoData);
    setEditingNodeId(nodeId);
    setEditingMemory(photoData);
    setShowEditModal(true);
  }, []);

  // Handle edit save
  const handleEditSave = useCallback((updatedData) => {
    console.log('💾 Saving edited note:', editingNodeId, updatedData);

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

    console.log('✅ Note updated successfully');
  }, [editingNodeId, setNodes]);

  // Handle delete memory
  const handleDeleteMemory = useCallback(() => {
    console.log('🗑️ Deleting note:', editingNodeId);

    setNodes((nds) => nds.filter((node) => node.id !== editingNodeId));
    setEdges((eds) => eds.filter((edge) =>
      edge.source !== editingNodeId && edge.target !== editingNodeId
    ));

    console.log('✅ Note deleted successfully');
  }, [editingNodeId, setNodes, setEdges]);

  // Ensure all nodes have callbacks
  useEffect(() => {
    if (!isInitialized) return;

    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onResize: handlePhotoResize,
          onLightbox: handleLightbox,
          onEdit: handleEdit
        }
      }))
    );
  }, [isInitialized, handlePhotoResize, handleLightbox, handleEdit, setNodes]);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
      console.log('💾 Saved to localStorage:', nodes.length, 'notes');
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
      title: 'Unity Notes',
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

    console.log('📤 Exported', nodes.length, 'notes');
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
        console.log('📥 Imported', importData.nodes.length, 'notes');
        alert(`✅ Successfully imported ${importData.nodes.length} ${importData.nodes.length === 1 ? 'note' : 'notes'}!`);
      } catch (error) {
        console.error('Import failed:', error);
        alert(`❌ Import failed: ${error.message}\n\nPlease check that the file is a valid Unity Notes export.`);
      }
    };
    input.click();
  };

  // Save capsule to Firebase and get shareable URL
  const handleSaveAndShare = async () => {
    if (nodes.length === 0) {
      alert('⚠️ Please add at least one note before sharing');
      return;
    }

    console.log('🔄 Starting save process...');

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
        title: 'Unity Notes'
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
    console.log('🔄 Upload started:', { uploadType, files: filesOrUrls, metadata });

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
      setShowContextMenu(false);
      console.log('🗑️ All notes cleared');
    }
  };

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

      {/* Zoom Controls - Right Rail */}
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        padding: '12px 8px',
        borderRadius: '8px',
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
            backgroundColor: '#EECF00',
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
            e.target.style.backgroundColor = '#fbbf24';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#EECF00';
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
            backgroundColor: '#EECF00',
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
            e.target.style.backgroundColor = '#fbbf24';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#EECF00';
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
      </div>

      {/* Context Menu - Center aligned */}
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
            onClick={() => {
              handleExportJSON();
              setShowContextMenu(false);
            }}
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
            onClick={() => {
              handleImportJSON();
              setShowContextMenu(false);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#8b5cf6',
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
            onMouseOver={(e) => e.target.style.backgroundColor = '#7c3aed'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#8b5cf6'}
          >
            IMPORT
          </button>

          <button
            onClick={() => {
              handleSaveAndShare();
              setShowContextMenu(false);
            }}
            disabled={isSaving || nodes.length === 0}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: nodes.length === 0 ? 'rgba(16, 185, 129, 0.3)' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: isSaving ? 'wait' : (nodes.length === 0 ? 'not-allowed' : 'pointer'),
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              marginBottom: '4px',
              opacity: nodes.length === 0 ? 0.5 : 1,
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              if (nodes.length > 0 && !isSaving) {
                e.target.style.backgroundColor = '#059669';
              }
            }}
            onMouseOut={(e) => {
              if (nodes.length > 0) {
                e.target.style.backgroundColor = '#10b981';
              }
            }}
          >
            {isSaving ? 'SAVING...' : 'SHARE'}
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
          <div style={{
            height: '1px',
            backgroundColor: '#e5e5e5',
            margin: '4px 0'
          }} />

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
            Start Your Unity Notes
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

      {/* Upload Modal */}
      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handlePhotoUpload}
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

function UnityNotesPage() {
  const navigate = useNavigate();
  const { handleFooterToggle, handleMenuToggle } = useLayout();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showContextMenu && !e.target.closest('[data-context-menu]')) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showContextMenu]);

  // Navigation items - Three categories matching global structure
  const navigationItems = [
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/history-edu_nuazpv.png",
      label: "STORIES",
      itemKey: "stories",
      subItems: [
        { label: "Projects", key: "projects", subItems: ["Brand Development", "Marketing Architecture", "Email Development"] },
        { label: "Golden Unknown", key: "golden-unknown" },
        { label: "Cath3dral", key: "cath3dral", subItems: ["Being + Rhyme"] },
        { label: "Thoughts", key: "thoughts" }
      ]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
      label: "LABS",
      itemKey: "labs",
      subItems: [
        { label: "UK-Memories", key: "uk-memories" },
        { label: "Unity Notes", key: "unity-notes" },
        { label: "Home-17", key: "home-17" },
        { label: "Visual Noteboard", key: "visual-noteboard" },
        { label: "Component Library", key: "component-library" }
      ]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/face-profile_dxxbba.png",
      label: "ABOUT",
      itemKey: "about",
      subItems: []
    }
  ];

  // Custom Circle Nav - Bottom Center
  const CustomCircleNav = (
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
      title="Add Note (Right-click for options)"
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
  );

  return (
    <ErrorBoundary>
      <Layout
        onHomeClick={handleHomeClick}
        onFooterToggle={handleFooterToggle}
        onMenuToggle={handleMenuToggle}
        navigationItems={navigationItems}
        pageLabel="UNITY NOTES"
        sidebarVariant="hidden"
        customCircleNav={CustomCircleNav}
      >
        <ReactFlowProvider>
          <UnityNotesFlow
            isUploadModalOpen={isUploadModalOpen}
            setIsUploadModalOpen={setIsUploadModalOpen}
            onFooterToggle={handleFooterToggle}
            showContextMenu={showContextMenu}
            setShowContextMenu={setShowContextMenu}
          />
        </ReactFlowProvider>
      </Layout>
    </ErrorBoundary>
  );
}

export default UnityNotesPage;
