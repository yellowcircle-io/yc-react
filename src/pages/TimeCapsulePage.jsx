import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import DraggablePhotoNode from '../components/travel/DraggablePhotoNode';
import PhotoUploadModal from '../components/travel/PhotoUploadModal';
import ShareModal from '../components/travel/ShareModal';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { uploadMultipleToCloudinary } from '../utils/cloudinaryUpload';
import { useFirebaseCapsule } from '../hooks/useFirebaseCapsule';

const nodeTypes = {
  photoNode: DraggablePhotoNode,
};

const STORAGE_KEY = 'uk-memories-data';

const TimeCapsuleFlow = () => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Firebase hook for shareable URLs
  const { saveCapsule, isSaving } = useFirebaseCapsule();
  const [shareUrl, setShareUrl] = useState('');
  const [currentCapsuleId, setCurrentCapsuleId] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedData);
        console.log('📥 Loaded:', savedNodes?.length || 0, 'memories');
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

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
      console.log('💾 Saved:', nodes.length, 'memories');
    } catch (error) {
      console.error('❌ Save error:', error);
    }
  }, [nodes, edges, isInitialized]);

  // Don't auto-fit view - let users manually zoom/pan
  // This prevents cards from being scaled down to thumbnails

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Save capsule to Firebase and get shareable URL
  const handleSaveAndShare = async () => {
    if (nodes.length === 0) {
      alert('⚠️ Please add at least one photo before saving');
      return;
    }

    try {
      const capsuleId = await saveCapsule(nodes, edges, {
        title: 'UK Travel Memories'
      });

      const url = `${window.location.origin}/uk-memories/view/${capsuleId}`;
      setShareUrl(url);
      setCurrentCapsuleId(capsuleId);

      // Copy to clipboard automatically
      await navigator.clipboard.writeText(url);

      // Show beautiful branded modal instead of alert
      setShowShareModal(true);
    } catch (error) {
      console.error('Save failed:', error);
      alert(`❌ Failed to save: ${error.message}\n\nPlease check the console for details.`);
    }
  };

  const handlePhotoUpload = async (filesOrUrls, metadata, uploadType) => {
    console.log('Upload:', uploadType, filesOrUrls);

    try {
      let imageUrls = [];

      if (uploadType === 'url') {
        imageUrls = filesOrUrls;
      } else if (uploadType === 'cloudinary') {
        const results = await uploadMultipleToCloudinary(filesOrUrls);
        imageUrls = results.filter(r => !r.error).map(r => r.url);
      } else {
        // Local file upload
        const filePromises = filesOrUrls.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });
        imageUrls = await Promise.all(filePromises);
      }

      // Create nodes with size variance and horizontal layout (matching homepage)
      const newNodes = imageUrls.map((imageUrl, index) => {
        const totalNodes = nodes.length + index;

        // Horizontal priority layout: 8 photos per row
        const gridX = totalNodes % 8; // 8 columns
        const gridY = Math.floor(totalNodes / 8); // Multiple rows

        // Increased size variance: 308-440px (average ~374px, 25% increase from original)
        const size = Math.floor(Math.random() * 132) + 308; // 308-439px

        return {
          id: `photo-${Date.now()}-${index}`,
          type: 'photoNode',
          position: {
            x: 100 + gridX * 600,  // Wide horizontal spacing: 600px
            y: 100 + gridY * 600   // Wide vertical spacing: 600px
          },
          data: {
            imageUrl,
            location: metadata.location,
            date: metadata.date,
            description: metadata.description,
            size // Pass size to component
          }
        };
      });

      console.log('✅ Adding', newNodes.length, 'nodes');
      setNodes(prev => [...prev, ...newNodes]);
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 20 }}>
      {/* Header - matching sidebar nav frosted glass style */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        backgroundColor: 'rgba(242, 242, 242, 0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}>
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            letterSpacing: '0.2em',
            color: '#000000',
            margin: 0
          }}>
            TRAVEL MEMORIES
          </h1>
          <p style={{
            fontSize: '12px',
            fontWeight: '500',
            letterSpacing: '0.05em',
            color: 'rgba(0, 0, 0, 0.6)',
            margin: '6px 0 0 0'
          }}>
            {nodes.length} {nodes.length === 1 ? 'memory' : 'memories'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => {
              console.log('Nodes:', nodes);
              console.log('Edges:', edges);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            DEBUG
          </button>
          <button
            onClick={() => {
              if (confirm('⚠️ Clear all memories and reset layout?\n\nThis will remove all photos and cannot be undone.\n\nClick OK to proceed.')) {
                setNodes([]);
                setEdges([]);
                localStorage.removeItem(STORAGE_KEY);
                console.log('🗑️ All memories cleared');
              }
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#b91c1c';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.3)';
            }}
          >
            CLEAR ALL
          </button>
          <button
            onClick={handleSaveAndShare}
            disabled={isSaving || nodes.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: nodes.length === 0 ? 'rgba(16, 185, 129, 0.3)' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: isSaving ? 'wait' : (nodes.length === 0 ? 'not-allowed' : 'pointer'),
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              boxShadow: nodes.length === 0 ? 'none' : '0 4px 8px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease',
              opacity: nodes.length === 0 ? 0.5 : 1
            }}
            onMouseOver={(e) => {
              if (nodes.length > 0 && !isSaving) {
                e.target.style.backgroundColor = '#059669';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (nodes.length > 0) {
                e.target.style.backgroundColor = '#10b981';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
              }
            }}
          >
            {isSaving ? '💾 SAVING...' : '🔗 SAVE & SHARE'}
          </button>
          <button
            onClick={() => {
              console.log('🔘 Add Memory button clicked');
              setIsUploadModalOpen(true);
              console.log('📂 Modal state set to true');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#EECF00',
              color: 'black',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 8px rgba(238, 207, 0, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#fbbf24';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(238, 207, 0, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#EECF00';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 8px rgba(238, 207, 0, 0.3)';
            }}
          >
            + ADD MEMORY
          </button>
        </div>
      </div>

      {/* React Flow Container */}
      <div style={{ width: '100%', height: '100%', paddingTop: '80px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          panOnDrag={true}
          selectionOnDrag={true}
          panOnScroll={true}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          minZoom={0.5}
          maxZoom={2.5}
        >
          <Background
            variant="dots"
            gap={24}
            size={2}
            color="#fbbf24"
            style={{ opacity: 0.4 }}
          />
        </ReactFlow>
      </div>

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '80px' }}>
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg max-w-md">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Start Your Time Capsule
            </h2>
            <p className="text-gray-600 mb-4">
              Add your first travel memory by clicking "+ Add Memory" above.
            </p>
            <div className="text-sm text-gray-500">
              <p>✨ Drag photos to organize them</p>
              <p>🔗 Connect memories together</p>
              <p>📍 Track locations and dates</p>
            </div>
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

      {/* Zoom Controls - Lower Right Corner */}
      {nodes.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button
            onClick={() => zoomIn({ duration: 300 })}
            style={{
              padding: '12px 16px',
              backgroundColor: '#EECF00',
              color: 'black',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#fbbf24';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#EECF00';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            title="Zoom In"
          >
            🔍+
          </button>
          <button
            onClick={() => zoomOut({ duration: 300 })}
            style={{
              padding: '12px 16px',
              backgroundColor: '#EECF00',
              color: 'black',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#fbbf24';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#EECF00';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            title="Zoom Out"
          >
            🔍−
          </button>
          <button
            onClick={() => fitView({ duration: 400, padding: 0.2 })}
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
              e.target.style.borderColor = '#EECF00';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            title="Center View"
          >
            CENTER
          </button>
        </div>
      )}
    </div>
  );
};

const TimeCapsulePage = () => {
  return (
    <ErrorBoundary>
      <div style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0
      }}>
        {/* Foundation white background */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#FFFFFF',
          zIndex: -1000
        }} />

        {/* Gradient background matching ExperimentsPage */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%)',
          zIndex: 10
        }} />

        {/* Subtle yellow texture overlay */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(circle at 30% 20%, rgba(238, 207, 0, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(251, 191, 36, 0.03) 0%, transparent 50%)',
          zIndex: 11
        }} />
        <ReactFlowProvider>
          <TimeCapsuleFlow />
        </ReactFlowProvider>
      </div>
    </ErrorBoundary>
  );
};

export default TimeCapsulePage;
