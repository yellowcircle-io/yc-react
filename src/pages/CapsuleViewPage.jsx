import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlow, Background, Controls, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DraggablePhotoNode from '../components/travel/DraggablePhotoNode';
import TextNoteNode from '../components/unity-plus/TextNoteNode';
import { mapNodeTypes } from '../components/unity/map';
import { premiumNodeTypes } from '../components/unity-plus/nodes';
import { useFirebaseCapsule } from '../hooks/useFirebaseCapsule';

const nodeTypes = {
  photoNode: DraggablePhotoNode,
  textNode: TextNoteNode,
  // Include all UnityMAP node types for journey sharing
  ...mapNodeTypes,
  // Include premium node types (sticky, todo, group, map, etc.)
  ...premiumNodeTypes
};

const CapsuleView = () => {
  const { capsuleId } = useParams();
  const navigate = useNavigate();
  const { loadCapsule, isLoading, error } = useFirebaseCapsule();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    const fetchCapsule = async () => {
      try {
        const data = await loadCapsule(capsuleId);
        setNodes(data.nodes);
        setEdges(data.edges);
        setMetadata(data.metadata);
      } catch (err) {
        console.error('Failed to load capsule:', err);
      }
    };

    if (capsuleId) {
      fetchCapsule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capsuleId]); // Only trigger when capsuleId changes

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '0',
          border: '3px solid #EECF00',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>⏳</div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#000',
            margin: '0 0 12px 0',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            Loading Time Capsule
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#666',
            fontWeight: '500',
            margin: 0,
            letterSpacing: '0.05em'
          }}>
            Fetching your memories...
          </p>
          {/* Animated progress bar */}
          <div style={{
            marginTop: '24px',
            width: '200px',
            height: '4px',
            backgroundColor: 'rgba(238, 207, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: '50%',
              backgroundColor: '#EECF00',
              animation: 'loading 1.5s ease-in-out infinite'
            }} />
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fee 0%, #fef2f2 50%, #fee 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          padding: '48px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: '0',
          border: '3px solid #dc2626',
          boxShadow: '0 20px 60px rgba(220, 38, 38, 0.2)'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px'
          }}>🔒</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '12px',
            color: '#000',
            letterSpacing: '0.05em'
          }}>
            Capsule Not Found
          </h2>
          <p style={{
            color: '#666',
            marginBottom: '32px',
            fontSize: '15px',
            lineHeight: '1.6',
            letterSpacing: '0.02em'
          }}>
            This time capsule doesn't exist, has been removed, or the link is incorrect.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '14px 28px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '0',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '13px',
                letterSpacing: '0.05em',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#EECF00';
                e.target.style.color = '#000';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(238, 207, 0, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#000';
                e.target.style.color = '#fff';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
            >
              GO HOME
            </button>
            <button
              onClick={() => navigate('/uk-memories')}
              style={{
                padding: '14px 28px',
                backgroundColor: '#EECF00',
                color: '#000',
                border: 'none',
                borderRadius: '0',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '13px',
                letterSpacing: '0.05em',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(238, 207, 0, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#fbbf24';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(238, 207, 0, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#EECF00';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(238, 207, 0, 0.3)';
              }}
            >
              CREATE YOUR OWN
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0 }}>
      {/* Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, letterSpacing: '0.05em' }}>
            {metadata?.title || 'TRAVEL MEMORIES'}
          </h1>
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0', fontWeight: '500' }}>
            👁️ {metadata?.viewCount || 0} views • Read-only view
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate(`/unity-notes?capsule=${capsuleId}`)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '0',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              letterSpacing: '0.05em',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#333';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#000';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            }}
          >
            ✏️ EDIT CAPSULE
          </button>
          <button
            onClick={() => navigate('/unity-notes')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#EECF00',
              border: 'none',
              borderRadius: '0',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              letterSpacing: '0.05em',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(238, 207, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#fbbf24';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 8px rgba(238, 207, 0, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#EECF00';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(238, 207, 0, 0.3)';
            }}
          >
            CREATE NEW
          </button>
        </div>
      </div>

      {/* YC Logo - Fixed to viewport, bottom left */}
      <div
        className="clickable-element yc-logo"
        onClick={handleHomeClick}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleHomeClick(e);
        }}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '40px',
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
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
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

      {/* Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #f0f0f0 100%)',
        zIndex: 10
      }} />

      {/* React Flow - Read Only */}
      <div style={{ width: '100%', height: '100%', paddingTop: '80px', position: 'relative', zIndex: 20 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll={true}
          zoomOnScroll={false}
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
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
};

const CapsuleViewPage = () => {
  return (
    <ReactFlowProvider>
      <CapsuleView />
    </ReactFlowProvider>
  );
};

export default CapsuleViewPage;
