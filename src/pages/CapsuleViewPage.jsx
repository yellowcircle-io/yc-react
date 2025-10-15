import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlow, Background, Controls, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import DraggablePhotoNode from '../components/travel/DraggablePhotoNode';
import { useFirebaseCapsule } from '../hooks/useFirebaseCapsule';

const nodeTypes = {
  photoNode: DraggablePhotoNode,
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
        console.log('Loading capsule:', capsuleId);
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
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#666', fontWeight: '500' }}>
            Loading time capsule...
          </p>
        </div>
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
        backgroundColor: '#fee'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#000' }}>
            Capsule Not Found
          </h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            This time capsule doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#EECF00',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

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
        <button
          onClick={() => navigate('/uk-memories')}
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
          CREATE YOUR OWN
        </button>
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
