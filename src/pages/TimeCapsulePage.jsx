import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import LightboxModal from '../components/travel/LightboxModal';
import EditMemoryModal from '../components/travel/EditMemoryModal';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { uploadMultipleToCloudinary } from '../utils/cloudinaryUpload';
import { useFirebaseCapsule } from '../hooks/useFirebaseCapsule';

const nodeTypes = {
  photoNode: DraggablePhotoNode,
};

const STORAGE_KEY = 'uk-memories-data';

const TimeCapsuleFlow = () => {
  const navigate = useNavigate();
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Firebase hook for shareable URLs and auto-sync
  const { saveCapsule, isSaving } = useFirebaseCapsule();
  const [shareUrl, setShareUrl] = useState('');
  const [currentCapsuleId, setCurrentCapsuleId] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [autoSyncEnabled] = useState(true); // setAutoSyncEnabled intentionally unused for now

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

  // Edit memory state
  const [editingMemory, setEditingMemory] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Navigation state
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [footerOpen, setFooterOpen] = useState(false);
  const [secondarySidebarOpen, setSecondarySidebarOpen] = useState(true);

  // Parallax circle state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0 });
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0 });

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

  // Handle photo resize - defined early so it can be used in useEffect
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

  // Handle lightbox - defined early so it can be used in useEffect
  const handleLightbox = useCallback((photoData) => {
    console.log('🖼️ Opening lightbox for photo:', photoData);
    setLightboxPhoto(photoData);
    setShowLightbox(true);
  }, []);

  // Handle edit - defined early so it can be used in useEffect
  const handleEdit = useCallback((nodeId, photoData) => {
    console.log('✏️ Editing memory:', nodeId, photoData);
    setEditingNodeId(nodeId);
    setEditingMemory(photoData);
    setShowEditModal(true);
  }, []);

  // Handle edit save - update node data
  const handleEditSave = useCallback((updatedData) => {
    console.log('💾 Saving edited memory:', editingNodeId, updatedData);

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

    console.log('✅ Memory updated successfully');
  }, [editingNodeId, setNodes]);

  // Ensure all nodes have callbacks (for nodes loaded from storage/import)
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
      console.log('💾 Saved to localStorage:', nodes.length, 'memories');
    } catch (error) {
      console.error('❌ localStorage save error:', error);
    }
  }, [nodes, edges, isInitialized]);

  // Auto-sync to Firebase (debounced to avoid excessive writes)
  useEffect(() => {
    if (!isInitialized || !autoSyncEnabled || nodes.length === 0) return;

    // Debounce: wait 3 seconds after last change before syncing
    const timeoutId = setTimeout(async () => {
      try {
        // Strip out ALL React Flow internal properties for Safari compatibility
        const serializableNodes = nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            imageUrl: node.data?.imageUrl || '',
            location: node.data?.location || '',
            date: node.data?.date || '',
            description: node.data?.description || '',
            size: node.data?.size || 350
          }
        }));

        // Also clean edges
        const serializableEdges = edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type || 'default'
        }));

        // Use existing capsuleId if available, otherwise create new one
        const capsuleId = currentCapsuleId || `autosave-${Date.now()}`;
        await saveCapsule(serializableNodes, serializableEdges, {
          title: 'UK Travel Memories (Auto-saved)'
        });

        if (!currentCapsuleId) {
          setCurrentCapsuleId(capsuleId);
        }

        setLastSyncTime(new Date());
        console.log('☁️ Auto-synced to Firebase:', nodes.length, 'memories');
      } catch (error) {
        console.error('❌ Firebase auto-sync error:', error);
        // Don't show alert for auto-sync failures, just log
      }
    }, 3000); // 3 second debounce

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, isInitialized, autoSyncEnabled, currentCapsuleId, saveCapsule]);

  // Don't auto-fit view - let users manually zoom/pan
  // This prevents cards from being scaled down to thumbnails

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger if user is typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const panAmount = 200; // pixels to pan per keypress

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

  // Parallax: Mouse movement handler with throttling
  const handleMouseMove = useCallback((e) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 60 - 20,
      y: (e.clientY / window.innerHeight) * 40 - 20
    });
  }, []);

  useEffect(() => {
    let timeoutId;
    const throttledMouseMove = (e) => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleMouseMove(e);
        timeoutId = null;
      }, 16); // ~60fps
    };

    window.addEventListener('mousemove', throttledMouseMove);
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleMouseMove]);

  // Parallax: Device motion for mobile
  useEffect(() => {
    const handleDeviceOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        setDeviceMotion({
          x: (e.gamma / 90) * 30,
          y: (e.beta / 180) * 20
        });
      }
    };

    const handleDeviceMotion = (e) => {
      if (e.accelerationIncludingGravity) {
        const acc = e.accelerationIncludingGravity;
        if (acc.x !== null && acc.y !== null) {
          setAccelerometerData({
            x: Math.max(-5, Math.min(5, (acc.x || 0) * 0.5)),
            y: Math.max(-5, Math.min(5, (acc.y || 0) * 0.5))
          });
        }
      }
    };

    window.addEventListener('deviceorientation', handleDeviceOrientation);

    if ('DeviceMotionEvent' in window) {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('devicemotion', handleDeviceMotion);
            }
          })
          .catch(() => {}); // Silent fail
      } else {
        window.addEventListener('devicemotion', handleDeviceMotion);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Export layout as JSON file
  const handleExportJSON = () => {
    if (nodes.length === 0) {
      alert('⚠️ No memories to export. Add some photos first!');
      return;
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      title: 'UK Travel Memories',
      nodes,
      edges
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `travel-memories-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('📤 Exported', nodes.length, 'memories');
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

        // Validate structure
        if (!importData.nodes || !Array.isArray(importData.nodes)) {
          throw new Error('Invalid file format: missing nodes array');
        }

        // Confirm before overwriting
        if (nodes.length > 0) {
          const confirmed = confirm(
            `⚠️ Import will replace your current ${nodes.length} ${nodes.length === 1 ? 'memory' : 'memories'}.\n\n` +
            `The file contains ${importData.nodes.length} ${importData.nodes.length === 1 ? 'memory' : 'memories'}.\n\n` +
            'Click OK to proceed, or Cancel to keep your current layout.'
          );
          if (!confirmed) return;
        }

        setNodes(importData.nodes);
        setEdges(importData.edges || []);
        console.log('📥 Imported', importData.nodes.length, 'memories');
        alert(`✅ Successfully imported ${importData.nodes.length} ${importData.nodes.length === 1 ? 'memory' : 'memories'}!`);
      } catch (error) {
        console.error('Import failed:', error);
        alert(`❌ Import failed: ${error.message}\n\nPlease check that the file is a valid travel memories export.`);
      }
    };
    input.click();
  };

  // Save capsule to Firebase and get shareable URL
  const handleSaveAndShare = async () => {
    if (nodes.length === 0) {
      alert('⚠️ Please add at least one photo before saving');
      return;
    }

    try {
      // Strip out ALL React Flow internal properties and callbacks for Safari compatibility
      const serializableNodes = nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          imageUrl: node.data?.imageUrl || '',
          location: node.data?.location || '',
          date: node.data?.date || '',
          description: node.data?.description || '',
          size: node.data?.size || 350
        }
      }));

      // Also clean edges for Safari
      const serializableEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default'
      }));

      const capsuleId = await saveCapsule(serializableNodes, serializableEdges, {
        title: 'UK Travel Memories'
      });

      const url = `${window.location.origin}/uk-memories/view/${capsuleId}`;
      setShareUrl(url);
      setCurrentCapsuleId(capsuleId);

      // Copy to clipboard with fallback for mobile Safari
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          // Fallback for older browsers or mobile Safari
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
        // Continue anyway - the URL is still shown in the modal
      }

      // Show beautiful branded modal instead of alert
      setShowShareModal(true);
    } catch (error) {
      console.error('Save failed:', error);
      alert(`❌ Failed to save: ${error.message}\n\nPlease check the console for details.`);
    }
  };

  const handlePhotoUpload = async (filesOrUrls, metadata, uploadType) => {
    console.log('🔄 Upload started:', { uploadType, files: filesOrUrls, metadata });

    try {
      let imageUrls = [];

      if (uploadType === 'url') {
        imageUrls = filesOrUrls;
        console.log('📎 URL upload:', imageUrls);
      } else if (uploadType === 'cloudinary') {
        console.log('☁️ Uploading to Cloudinary...');
        const results = await uploadMultipleToCloudinary(filesOrUrls);
        imageUrls = results.filter(r => !r.error).map(r => r.url);
        console.log('☁️ Cloudinary results:', imageUrls);
      } else {
        // Local file upload
        console.log('📁 Reading local files...');
        const filePromises = filesOrUrls.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              console.log('✅ File read:', file.name, e.target.result.substring(0, 50) + '...');
              resolve(e.target.result);
            };
            reader.onerror = (err) => {
              console.error('❌ File read error:', file.name, err);
              reject(err);
            };
            reader.readAsDataURL(file);
          });
        });
        imageUrls = await Promise.all(filePromises);
        console.log('📁 Local files processed:', imageUrls.length);
      }

      if (imageUrls.length === 0) {
        console.error('❌ No image URLs generated!');
        alert('No images were processed. Please try again.');
        return;
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
            x: 300 + gridX * 600,  // Much larger clearance to prevent sidebar clipping (especially on mobile)
            y: 100 + gridY * 600   // Wide vertical spacing: 600px
          },
          data: {
            imageUrl,
            location: metadata.location,
            date: metadata.date,
            description: metadata.description,
            size, // Pass size to component
            onResize: handlePhotoResize, // Pass resize callback
            onLightbox: handleLightbox, // Pass lightbox callback
            onEdit: handleEdit // Pass edit callback
          }
        };
      });

      console.log('✅ Adding', newNodes.length, 'nodes');
      console.log('📊 New nodes:', newNodes);
      console.log('📊 Current nodes count:', nodes.length);

      setNodes(prev => {
        const updated = [...prev, ...newNodes];
        console.log('📊 Updated nodes count:', updated.length);
        return updated;
      });

      setIsUploadModalOpen(false);
      console.log('🎉 Upload complete! Modal closed.');

      // Auto-focus on newly uploaded photos after a brief delay for rendering
      setTimeout(() => {
        fitView({ duration: 600, padding: 0.2 });
        console.log('📷 Camera focused on new memories');
      }, 100);
    } catch (error) {
      console.error('❌ Upload failed:', error);
      console.error('❌ Error stack:', error.stack);
      alert(`Upload failed: ${error.message}\n\nCheck console for details.`);
    }
  };

  // Calculate combined parallax position
  const combinedDeviceMotion = {
    x: deviceMotion.x + (accelerometerData.x * 0.3),
    y: deviceMotion.y + (accelerometerData.y * 0.3)
  };

  const parallaxX = (mousePosition.x + combinedDeviceMotion.x) * 0.6;
  const parallaxY = (mousePosition.y + combinedDeviceMotion.y) * 0.6;

  // Navigation handlers
  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleFooterToggle = () => {
    setFooterOpen(!footerOpen);
    setMenuOpen(false);
  };

  const handleSidebarToggle = () => {
    if (sidebarOpen) {
      setExpandedSection(null);
    }
    setSidebarOpen(!sidebarOpen);
  };

  // Navigation items data
  const navigationItems = [
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/test-tubes-lab_j4cie7.png",
      label: "EXPERIMENTS",
      itemKey: "experiments",
      subItems: ["golden unknown", "being + rhyme", "cath3dral", "17-frame animatic", "travel memories"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684385/write-book_gfaiu8.png",
      label: "THOUGHTS",
      itemKey: "thoughts",
      subItems: ["blog"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/face-profile_dxxbba.png",
      label: "ABOUT",
      itemKey: "about",
      subItems: ["about me", "about yellowcircle", "contact"]
    },
    {
      icon: "https://res.cloudinary.com/yellowcircle-io/image/upload/v1756684384/history-edu_nuazpv.png",
      label: "WORKS",
      itemKey: "works",
      subItems: ["consulting", "rho", "reddit", "cv"]
    }
  ];

  // Navigation Item Component
  const NavigationItem = ({ icon, label, subItems, itemKey, index }) => {
    const isExpanded = expandedSection === itemKey && sidebarOpen;

    let topPosition = index * 50;
    for (let i = 0; i < index; i++) {
      const prevItemKey = navigationItems[i]?.itemKey;
      if (expandedSection === prevItemKey && sidebarOpen) {
        const prevSubItems = navigationItems[i]?.subItems || [];
        topPosition += prevSubItems.length * 18 + 5;
      }
    }

    const handleClick = () => {
      if (!sidebarOpen) {
        setSidebarOpen(true);
        setExpandedSection(itemKey);
      } else {
        if (expandedSection === itemKey) {
          if (itemKey === 'experiments') {
            navigate('/experiments');
          }
          setExpandedSection(null);
        } else {
          setExpandedSection(itemKey);
        }
      }
    };

    return (
      <div style={{
        position: 'absolute',
        top: `${topPosition}px`,
        left: 0,
        width: '100%',
        transition: 'top 0.3s ease-out'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 0',
          position: 'relative',
          minHeight: '40px',
          width: '100%'
        }}>
          <div
            className="clickable-element"
            onClick={handleClick}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleClick();
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: 'pointer',
              zIndex: 3,
              WebkitTapHighlightColor: 'transparent'
            }}
          />
          <div style={{
            position: 'absolute',
            left: '40px',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none'
          }}>
            <img
              src={icon}
              alt={label}
              width="24"
              height="24"
              style={{ display: 'block' }}
            />
          </div>
          {sidebarOpen && (
            <span className="sidebar-label" style={{
              position: 'absolute',
              left: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isExpanded ? '#EECF00' : 'black',
              fontSize: '14px',
              fontWeight: isExpanded ? '700' : '600',
              letterSpacing: '0.2em',
              transition: 'color 0.3s ease-out, font-weight 0.3s ease-out',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}>{label}</span>
          )}
        </div>

        {sidebarOpen && (
          <div style={{
            marginLeft: '75px',
            marginTop: '-5px',
            maxHeight: isExpanded ? `${(subItems?.length || 0) * 18 + 5}px` : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-out'
          }}>
            {subItems && (
              <div style={{ paddingTop: '0px', paddingBottom: '0px' }}>
                {subItems.map((item, idx) => (
                  <a key={idx}
                     href="#"
                     className="clickable-element"
                     onClick={(e) => {
                       e.preventDefault();
                       if (item === '17-frame animatic') {
                         navigate('/home-17');
                       } else if (item === 'travel memories') {
                         navigate('/uk-memories');
                       }
                     }}
                     onTouchEnd={(e) => {
                       e.preventDefault();
                       if (item === '17-frame animatic') {
                         navigate('/home-17');
                       } else if (item === 'travel memories') {
                         navigate('/uk-memories');
                       }
                     }}
                     style={{
                       display: 'block',
                       color: 'rgba(0,0,0,0.7)',
                       fontSize: '12px',
                       fontWeight: '500',
                       letterSpacing: '0.1em',
                       textDecoration: 'none',
                       padding: '1px 0',
                       transition: 'color 0.25s ease-in-out',
                       opacity: isExpanded ? 1 : 0,
                       transitionDelay: isExpanded ? `${idx * 0.05}s` : '0s',
                       WebkitTapHighlightColor: 'transparent',
                       userSelect: 'none'
                     }}
                     onMouseEnter={(e) => {
                       e.target.style.color = '#EECF00';
                     }}
                     onMouseLeave={(e) => {
                       e.target.style.color = 'rgba(0,0,0,0.7)';
                     }}
                  >{item}</a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 20 }}>
      {/* Parallax Yellow Circle */}
      <div style={{
        position: 'fixed',
        top: `calc(20% + ${parallaxY}px)`,
        left: `calc(38% + ${parallaxX}px)`,
        width: '300px',
        height: '300px',
        backgroundColor: '#fbbf24',
        borderRadius: '50%',
        zIndex: 15,
        mixBlendMode: 'multiply',
        pointerEvents: 'none',
        transition: 'top 0.1s ease-out, left 0.1s ease-out'
      }} />

      {/* Navigation Bar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '4.7vw',
        paddingRight: '40px'
      }}>
        <a
          href="#"
          onClick={handleHomeClick}
          style={{
            backgroundColor: 'black',
            padding: '10px 20px',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          <h1 style={{
            fontSize: '16px',
            fontWeight: '600',
            letterSpacing: '0.2em',
            margin: 0
          }}>
            <span style={{ color: '#fbbf24', fontStyle: 'italic' }}>yellow</span>
            <span style={{ color: 'white' }}>CIRCLE</span>
          </h1>
        </a>
      </nav>

      {/* Main Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: sidebarOpen ? 'min(35vw, 472px)' : '80px',
        height: '100vh',
        maxHeight: '100vh',
        backgroundColor: 'rgba(242, 242, 242, 0.96)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 50,
        transition: 'width 0.5s ease-out',
        overflowY: 'auto'
      }}>
        {/* Sidebar Toggle Button */}
        <div
          className="clickable-element"
          onClick={handleSidebarToggle}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleSidebarToggle();
          }}
          style={{
            position: 'absolute',
            top: '20px',
            left: '40px',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            width: '40px',
            height: '40px',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 16 16">
            <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2z"/>
            <path d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
          </svg>
        </div>

        {/* HOME Label */}
        <div style={{
          position: 'absolute',
          top: '100px',
          left: '40px',
          transform: 'translateX(-50%) rotate(-90deg)',
          transformOrigin: 'center',
          whiteSpace: 'nowrap'
        }}>
          <span style={{
            color: 'black',
            fontWeight: '600',
            letterSpacing: '0.3em',
            fontSize: '14px'
          }}>HOME</span>
        </div>

        {/* Navigation Items Container */}
        <div
          className="navigation-items-container"
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            width: '100%',
            height: '240px'
          }}
        >
          {navigationItems.map((item, index) => (
            <NavigationItem
              key={item.itemKey}
              {...item}
              index={index}
              sidebarOpen={sidebarOpen}
              expandedSection={expandedSection}
              setExpandedSection={setExpandedSection}
              setSidebarOpen={setSidebarOpen}
            />
          ))}
        </div>

        {/* YC Logo - Navigate to Homepage */}
        <div
          className="clickable-element yc-logo"
          onClick={handleHomeClick}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleHomeClick(e);
          }}
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '45px',
            height: '45px',
            minWidth: '40px',
            minHeight: '40px',
            borderRadius: '50%',
            overflow: 'visible',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
            zIndex: 100
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            e.currentTarget.style.opacity = '1';
          }}
          title="Return to Homepage"
        >
          <img
            src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png"
            alt="YC Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', borderRadius: '50%' }}
          />
        </div>
      </div>

      {/* Secondary Sidebar - Travel Memories Controls */}
      <div style={{
        position: 'fixed',
        left: sidebarOpen ? 'min(35vw, 472px)' : '80px',
        top: 0,
        width: secondarySidebarOpen ? 'min(160px, 25vw)' : '50px',
        height: '100vh',
        maxHeight: '100vh',
        backgroundColor: secondarySidebarOpen ? 'rgba(255, 255, 255, 0.98)' : 'transparent',
        backdropFilter: secondarySidebarOpen ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: secondarySidebarOpen ? 'blur(8px)' : 'none',
        zIndex: 45,
        transition: 'left 0.5s ease-out, width 0.3s ease-out, background-color 0.3s ease-out, backdrop-filter 0.3s ease-out',
        boxShadow: secondarySidebarOpen ? '2px 0 8px rgba(0, 0, 0, 0.08)' : 'none',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
      className="travel-sidebar">
        {/* Toggle Button - Chevron indicates open/closed state */}
        <div
          className="clickable-element"
          onClick={() => setSecondarySidebarOpen(!secondarySidebarOpen)}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSecondarySidebarOpen(!secondarySidebarOpen);
          }}
          style={{
            position: 'absolute',
            top: '20px',
            right: secondarySidebarOpen ? '18px' : '9px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            width: '32px',
            height: '32px',
            WebkitTapHighlightColor: 'transparent',
            zIndex: 10,
            backgroundColor: secondarySidebarOpen ? 'rgba(238, 207, 0, 0.1)' : 'transparent',
            borderRadius: secondarySidebarOpen ? '4px' : '0',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (secondarySidebarOpen) {
              e.currentTarget.style.backgroundColor = 'rgba(238, 207, 0, 0.2)';
            }
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = secondarySidebarOpen ? 'rgba(238, 207, 0, 0.1)' : 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={secondarySidebarOpen ? 'Hide Memories Sidebar' : 'Show Memories Sidebar'}
        >
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#000000',
            transition: 'all 0.3s ease',
            lineHeight: 1
          }}>
            {secondarySidebarOpen ? '◀' : '▶'}
          </div>
        </div>

        {secondarySidebarOpen && (
          <div style={{ padding: '12px 8px', paddingTop: '50px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h1 style={{
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                color: '#000000',
                margin: '0 0 6px 0',
                borderBottom: '2px solid #EECF00',
                paddingBottom: '4px',
                textAlign: 'center'
              }}>
                MEMORIES
              </h1>
              <p style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.05em',
                color: 'rgba(0, 0, 0, 0.6)',
                margin: '6px 0 0 0',
                textAlign: 'center'
              }}>
                {nodes.length} {nodes.length === 1 ? 'item' : 'items'}
              </p>
              {lastSyncTime && (
                <p style={{
                  fontSize: '8px',
                  fontWeight: '500',
                  letterSpacing: '0.03em',
                  color: '#10b981',
                  margin: '4px 0 0 0',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}>
                  <span>☁️</span>
                  <span>Synced {new Date().getTime() - lastSyncTime.getTime() < 10000 ? 'just now' : 'recently'}</span>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="travel-actions">
          <button
            onClick={() => {
              console.log('Nodes:', nodes);
              console.log('Edges:', edges);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              console.log('Nodes:', nodes);
              console.log('Edges:', edges);
            }}
            style={{
              width: '100%',
              padding: '8px 6px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '9px',
              fontWeight: '600',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
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
            onClick={(e) => {
              e.preventDefault();
              if (confirm('⚠️ Clear all memories and reset layout?\n\nThis will remove all photos and cannot be undone.\n\nClick OK to proceed.')) {
                setNodes([]);
                setEdges([]);
                localStorage.removeItem(STORAGE_KEY);
                console.log('🗑️ All memories cleared');
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (confirm('⚠️ Clear all memories and reset layout?\n\nThis will remove all photos and cannot be undone.\n\nClick OK to proceed.')) {
                setNodes([]);
                setEdges([]);
                localStorage.removeItem(STORAGE_KEY);
                console.log('🗑️ All memories cleared');
              }
            }}
            style={{
              width: '100%',
              padding: '8px 6px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.3s ease',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
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
            CLEAR
          </button>
          <button
            onClick={handleExportJSON}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (nodes.length > 0) {
                handleExportJSON();
              }
            }}
            disabled={nodes.length === 0}
            style={{
              width: '100%',
              padding: '8px 6px',
              backgroundColor: nodes.length === 0 ? 'rgba(59, 130, 246, 0.3)' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              boxShadow: nodes.length === 0 ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
              opacity: nodes.length === 0 ? 0.5 : 1,
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
            }}
            onMouseOver={(e) => {
              if (nodes.length > 0) {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (nodes.length > 0) {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
              }
            }}
            title="Download layout as JSON file"
          >
            EXPORT
          </button>
          <button
            onClick={handleImportJSON}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleImportJSON();
            }}
            style={{
              width: '100%',
              padding: '8px 6px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.3s ease',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#7c3aed';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(139, 92, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#8b5cf6';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.3)';
            }}
            title="Load layout from JSON file"
          >
            IMPORT
          </button>
          <button
            onClick={handleSaveAndShare}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (!isSaving && nodes.length > 0) {
                handleSaveAndShare();
              }
            }}
            disabled={isSaving || nodes.length === 0}
            style={{
              width: '100%',
              padding: '10px 6px',
              backgroundColor: nodes.length === 0 ? 'rgba(16, 185, 129, 0.3)' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              cursor: isSaving ? 'wait' : (nodes.length === 0 ? 'not-allowed' : 'pointer'),
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              boxShadow: nodes.length === 0 ? 'none' : '0 4px 8px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease',
              opacity: nodes.length === 0 ? 0.5 : 1,
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
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
            {isSaving ? 'SAVING...' : 'SHARE'}
          </button>
          <button
            onClick={() => {
              console.log('🔘 Add Memory button clicked');
              setIsUploadModalOpen(true);
              console.log('📂 Modal state set to true');
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              console.log('🔘 Add Memory button clicked (touch)');
              setIsUploadModalOpen(true);
              console.log('📂 Modal state set to true (touch)');
            }}
            style={{
              width: '100%',
              padding: '10px 6px',
              backgroundColor: '#EECF00',
              color: 'black',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 8px rgba(238, 207, 0, 0.3)',
              transition: 'all 0.3s ease',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
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
            + ADD
          </button>
            </div>
          </div>
        )}
      </div>

      {/* Hamburger Menu */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        onTouchEnd={(e) => {
          e.preventDefault();
          setMenuOpen(!menuOpen);
        }}
        style={{
          position: 'fixed',
          right: '50px',
          top: '20px',
          padding: '10px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          zIndex: 100,
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '18px',
          position: 'relative'
        }}>
          {[0, 1, 2].map((index) => (
            <div key={index} style={{
              position: 'absolute',
              top: '50%',
              left: index === 1 ? '60%' : '50%',
              width: '40px',
              height: '3px',
              backgroundColor: 'black',
              transformOrigin: 'center',
              transform: menuOpen
                ? index === 0
                  ? 'translate(-50%, -50%) rotate(45deg)'
                  : index === 2
                    ? 'translate(-50%, -50%) rotate(-45deg)'
                    : 'translate(-50%, -50%)'
                : `translate(-50%, -50%) translateY(${(index - 1) * 6}px)`,
              opacity: menuOpen && index === 1 ? 0 : 1,
              transition: 'all 0.3s ease'
            }}></div>
          ))}
        </div>
      </button>

      {/* Menu Overlay */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#EECF00',
          opacity: 0.96,
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            {['HOME', 'EXPERIMENTS', 'UK MEMORIES', 'THOUGHTS', 'ABOUT'].map((item, index) => (
              <a key={item}
                href="#"
                onClick={
                  item === 'HOME' ? handleHomeClick :
                  item === 'EXPERIMENTS' ? () => navigate('/experiments') :
                  item === 'UK MEMORIES' ? () => navigate('/uk-memories') :
                  undefined
                }
                onTouchEnd={(e) => {
                  e.preventDefault();
                  if (item === 'HOME') handleHomeClick(e);
                  else if (item === 'EXPERIMENTS') navigate('/experiments');
                  else if (item === 'UK MEMORIES') navigate('/uk-memories');
                }}
                className={`menu-item-${index + 1} menu-link`}
                style={{
                  textDecoration: 'none',
                  fontSize: '20px',
                  fontWeight: '600',
                  letterSpacing: '0.3em',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  color: 'black',
                  transition: 'color 0.3s ease-in',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = 'black'}
              >
                {item}
              </a>
            ))}
            <div
              onClick={handleFooterToggle}
              style={{
                border: '2px solid black',
                padding: '15px 40px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <span style={{
                color: 'black',
                fontSize: '20px',
                fontWeight: '600',
                letterSpacing: '0.3em'
              }}>CONTACT</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer-container" style={{
        position: 'fixed',
        bottom: footerOpen ? '0' : '-290px',
        left: '0',
        right: '0',
        height: '300px',
        zIndex: 60,
        transition: 'bottom 0.5s ease-out'
      }}>
        <div
          onClick={handleFooterToggle}
          className="footer-content"
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            display: 'flex',
            cursor: footerOpen ? 'default' : 'pointer'
          }}
        >
          {/* Contact Section */}
          <div className="footer-section footer-contact" style={{
            flex: '1',
            backgroundColor: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              margin: '0 0 20px 0',
              borderBottom: '2px solid white',
              paddingBottom: '10px'
            }}>CONTACT</h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >EMAIL@YELLOWCIRCLE.IO</a>

              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >LINKEDIN</a>

              <a href="#" style={{
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'white'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
              >TWITTER</a>
            </div>
          </div>

          {/* Projects Section */}
          <div className="footer-section footer-projects" style={{
            flex: '1',
            backgroundColor: '#EECF00',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            <h2 style={{
              color: 'black',
              fontSize: '24px',
              fontWeight: '600',
              letterSpacing: '0.3em',
              margin: '0 0 20px 0',
              borderBottom: '2px solid black',
              paddingBottom: '10px'
            }}>PROJECTS</h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >GOLDEN UNKNOWN</a>

              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >BEING + RHYME</a>

              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >CATH3DRAL</a>

              <a href="#" style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >RHO CONSULTING</a>

              <a href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/uk-memories');
                }}
                style={{
                color: 'rgba(0,0,0,0.8)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.1em',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = 'black'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(0,0,0,0.8)'}
              >TRAVEL MEMORIES</a>
            </div>
          </div>
        </div>
      </div>

      {/* React Flow Container */}
      <div style={{
        width: '100%',
        height: '100%',
        paddingLeft: sidebarOpen
          ? (secondarySidebarOpen
              ? 'calc(min(35vw, 472px) + min(160px, 25vw))'
              : 'calc(min(35vw, 472px) + 50px)')
          : (secondarySidebarOpen
              ? '240px'  // 80px main + 160px secondary
              : '130px'), // 80px main + 50px secondary
        transition: 'padding-left 0.5s ease-out'
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
          minZoom={0.5}
          maxZoom={2.5}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
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
      />

      {/* Zoom Controls & Navigation Circle - Lower Right Corner */}
      {nodes.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          transform: footerOpen ? 'translateY(-300px)' : 'translateY(0)',
          transition: 'transform 0.5s ease-out'
        }}>
          {/* Zoom In Button */}
          <button
            onClick={() => zoomIn({ duration: 300 })}
            onTouchEnd={(e) => {
              e.preventDefault();
              zoomIn({ duration: 300 });
            }}
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
              transition: 'all 0.3s ease',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
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

          {/* Zoom Out Button */}
          <button
            onClick={() => zoomOut({ duration: 300 })}
            onTouchEnd={(e) => {
              e.preventDefault();
              zoomOut({ duration: 300 });
            }}
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
              transition: 'all 0.3s ease',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
              zIndex: 150,
              position: 'relative'
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

          {/* Center View Button */}
          <button
            onClick={() => fitView({ duration: 400, padding: 0.2 })}
            onTouchEnd={(e) => {
              e.preventDefault();
              fitView({ duration: 400, padding: 0.2 });
            }}
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
              transition: 'all 0.3s ease',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
              zIndex: 150,
              position: 'relative'
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

          {/* Navigation Circle */}
          <div
            className="clickable-element"
            onClick={handleFooterToggle}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleFooterToggle();
            }}
            style={{
              width: '78px',
              height: '78px',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              zIndex: 150,
              position: 'relative'
            }}
          >
            <img
              src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494537/NavCircle_ioqlsr.png"
              alt="Navigation"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'rotate(0deg)',
                transition: 'transform 0.3s ease-out',
                transformOrigin: 'center',
                position: 'relative',
                zIndex: 150
              }}
            />
          </div>
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
        maxWidth: '100vw',
        maxHeight: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden'
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

        {/* Responsive CSS */}
        <style>{`
          /* Global viewport constraints */
          body, html {
            max-height: 100vh !important;
            overflow: hidden !important;
          }

          /* YC Logo visibility boost for all browsers */
          .yc-logo {
            z-index: 100 !important;
            position: relative !important;
          }

          /* Firefox-specific fixes for controls visibility */
          @-moz-document url-prefix() {
            button, .clickable-element {
              z-index: auto !important;
              isolation: isolate;
            }

            /* Boost zoom controls z-index for Firefox */
            button[title*="Zoom"], button[title*="Center"] {
              z-index: 150 !important;
              position: relative;
            }

            /* Fix navigation circle for Firefox */
            .clickable-element img[alt="Navigation"] {
              z-index: 150 !important;
              position: relative;
            }
          }

          @media (max-width: 768px) {
            .travel-header {
              padding: 16px 20px !important;
              gap: 12px !important;
            }
            .travel-header h1 {
              font-size: 16px !important;
            }
            .travel-header p {
              font-size: 11px !important;
            }
            .travel-actions {
              width: 100%;
              justify-content: flex-end;
            }
            .travel-actions button {
              font-size: 12px !important;
              padding: 8px 14px !important;
            }

            /* Footer responsive fixes - keep 50/50 side-by-side on mobile */
            .footer-section {
              padding: 20px 10px !important;
            }
            .footer-section h2 {
              font-size: 14px !important;
              margin-bottom: 8px !important;
              letter-spacing: 0.15em !important;
            }
            .footer-section a {
              font-size: 10px !important;
              letter-spacing: 0.05em !important;
            }
            [style*="gap: 15px"] {
              gap: 8px !important;
            }

            /* Sidebar text overflow fix */
            .sidebar-label {
              font-size: 12px !important;
              letter-spacing: 0.15em !important;
              max-width: calc(100% - 70px) !important;
              white-space: normal !important;
              word-break: break-word !important;
              line-height: 1.2 !important;
            }
          }
          @media (max-width: 480px) {
            .travel-header {
              padding: 12px 16px !important;
              flex-direction: column;
              align-items: flex-start !important;
            }
            .travel-actions {
              width: 100%;
              flex-direction: column;
            }
            .travel-actions button {
              width: 100%;
              text-align: center;
            }

            /* Footer even more compact on small mobile */
            .footer-section {
              padding: 16px !important;
              min-height: 120px !important;
            }
            .footer-section h2 {
              font-size: 16px !important;
              margin-bottom: 8px !important;
            }
            .footer-section a {
              font-size: 11px !important;
            }

            /* Sidebar text even smaller on mobile */
            .sidebar-label {
              font-size: 10px !important;
              letter-spacing: 0.1em !important;
            }
          }

          @media (max-width: 360px) {
            /* Ultra-compact for very small viewports (360px width) */
            .footer-section {
              padding: 12px 6px !important;
              min-height: 100px !important;
            }
            .footer-section h2 {
              font-size: 11px !important;
              margin-bottom: 6px !important;
              letter-spacing: 0.2em !important;
              padding-bottom: 6px !important;
            }
            .footer-section a {
              font-size: 9px !important;
              letter-spacing: 0.05em !important;
            }
            [style*="gap: 15px"] {
              gap: 6px !important;
            }

            /* Sidebar text tiny on very small mobile */
            .sidebar-label {
              font-size: 9px !important;
              letter-spacing: 0.08em !important;
            }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default TimeCapsulePage;
