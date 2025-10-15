import React, { memo, useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';

const DraggablePhotoNode = memo(({ id, data, selected }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const resizeStartRef = useRef({ size: 0, x: 0, y: 0 });

  // Use size from data, or default to 300px
  const size = data.size || 300;

  // Handle double tap for lightbox
  const handleDoubleTap = (e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      if (data.onLightbox) {
        data.onLightbox(data);
      }
    }
    setLastTap(now);
  };

  // Handle resize start - supports both mouse and touch
  const handleResizeStart = (e, corner) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🎯 Resize started from corner:', corner, 'current size:', size);
    setIsResizing(true);

    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    resizeStartRef.current = {
      size,
      x: clientX,
      y: clientY,
      corner
    };

    const handleMove = (moveEvent) => {
      moveEvent.stopPropagation();
      moveEvent.preventDefault();

      const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = moveX - resizeStartRef.current.x;
      const deltaY = moveY - resizeStartRef.current.y;

      // Use the larger delta for uniform scaling
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

      // Calculate new size (0.5x to 2x range: 154px to 880px for base 308-440px)
      let newSize = resizeStartRef.current.size + delta;
      newSize = Math.max(154, Math.min(880, newSize)); // Clamp to range

      // Update node size via callback
      if (data.onResize) {
        console.log('📏 Resizing to:', newSize);
        data.onResize(id, newSize);
      } else {
        console.warn('⚠️ No onResize callback found!');
      }
    };

    const handleEnd = () => {
      console.log('✋ Resize ended');
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    // Add both mouse and touch listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

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
          crossOrigin="anonymous"
          onClick={handleDoubleTap}
          onTouchEnd={handleDoubleTap}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'cover',
            display: 'block',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            cursor: 'pointer'
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

        {/* Edit Button - Only show when selected */}
        {selected && (
          <button
            className="nodrag nopan"
            onClick={(e) => {
              e.stopPropagation();
              if (data.onEdit) {
                data.onEdit(id, data);
              }
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (data.onEdit) {
                data.onEdit(id, data);
              }
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '6px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: '2px solid #EECF00',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              zIndex: 25,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(238, 207, 0, 0.95)';
              e.target.style.color = '#000000';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              e.target.style.color = 'white';
              e.target.style.transform = 'scale(1)';
            }}
          >
            ✏️ EDIT
          </button>
        )}

        {/* Resize Handles - Only show when selected */}
        {selected && (
          <>
            {/* Bottom-right corner handle */}
            <div
              className="nodrag nopan"
              onMouseDown={(e) => handleResizeStart(e, 'br')}
              onTouchStart={(e) => handleResizeStart(e, 'br')}
              style={{
                position: 'absolute',
                bottom: '-6px',
                right: '-6px',
                width: '16px',
                height: '16px',
                backgroundColor: '#EECF00',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'nwse-resize',
                zIndex: 20,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s ease',
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
            {/* Top-left corner handle */}
            <div
              className="nodrag nopan"
              onMouseDown={(e) => handleResizeStart(e, 'tl')}
              onTouchStart={(e) => handleResizeStart(e, 'tl')}
              style={{
                position: 'absolute',
                top: '-6px',
                left: '-6px',
                width: '16px',
                height: '16px',
                backgroundColor: '#EECF00',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'nwse-resize',
                zIndex: 20,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s ease',
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
            {/* Bottom-left corner handle */}
            <div
              className="nodrag nopan"
              onMouseDown={(e) => handleResizeStart(e, 'bl')}
              onTouchStart={(e) => handleResizeStart(e, 'bl')}
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: '-6px',
                width: '16px',
                height: '16px',
                backgroundColor: '#EECF00',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'nesw-resize',
                zIndex: 20,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s ease',
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
            {/* Top-right corner handle */}
            <div
              className="nodrag nopan"
              onMouseDown={(e) => handleResizeStart(e, 'tr')}
              onTouchStart={(e) => handleResizeStart(e, 'tr')}
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '16px',
                height: '16px',
                backgroundColor: '#EECF00',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'nesw-resize',
                zIndex: 20,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s ease',
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
          </>
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
