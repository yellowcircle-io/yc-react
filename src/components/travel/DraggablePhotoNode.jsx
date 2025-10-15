import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';

const DraggablePhotoNode = memo(({ data, selected }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Use size from data, or default to 300px
  const size = data.size || 300;

  console.log('🖼️ Rendering node with data:', {
    imageUrl: data.imageUrl?.substring(0, 50),
    location: data.location,
    size,
    imageError,
    imageLoaded
  });

  return (
    <div
      style={{
        cursor: 'grab',
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        border: selected ? '2px solid #fbbf24' : '2px solid transparent'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#fbbf24',
          border: '2px solid white'
        }}
      />

      <div style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`
      }}>
        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '2px solid #fbbf24',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}

        {/* Error State */}
        {imageError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            color: '#374151'
          }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>⚠️</div>
            <p style={{ fontSize: '0.75rem', fontWeight: '600' }}>Image unavailable</p>
          </div>
        )}

        {/* Image */}
        <img
          src={data.imageUrl}
          alt={data.description || 'Travel memory'}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'cover',
            display: 'block',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          loading="lazy"
          onLoad={() => {
            setImageLoaded(true);
            setImageError(false);
          }}
          onError={(e) => {
            console.error('Image failed to load:', data.imageUrl);
            setImageError(true);
            setImageLoaded(false);
          }}
        />

        {/* Light background card footer with yellow accent - matching homepage style */}
        {imageLoaded && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.97)',
            borderTop: '3px solid #fbbf24',
            color: '#000000',
            zIndex: 10,
            backdropFilter: 'blur(8px)'
          }}>
            {data.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px', minHeight: '18px' }}>📍</span>
                <p style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#000000',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {data.location}
                </p>
              </div>
            )}

            {data.date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: data.description ? '6px' : '0' }}>
                <span style={{ fontSize: '16px', minHeight: '16px' }}>📅</span>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#333333',
                  margin: 0
                }}>
                  {data.date}
                </p>
              </div>
            )}

            {data.description && (
              <p style={{
                fontSize: '15px',
                fontWeight: '500',
                color: '#555555',
                marginTop: '4px',
                marginBottom: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.4'
              }}>
                {data.description}
              </p>
            )}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#fbbf24',
          border: '2px solid white'
        }}
      />
    </div>
  );
});

DraggablePhotoNode.displayName = 'DraggablePhotoNode';

export default DraggablePhotoNode;
