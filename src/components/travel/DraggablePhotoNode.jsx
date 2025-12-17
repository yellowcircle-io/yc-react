import React, { memo, useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';

const DraggablePhotoNode = memo(({ id, data, selected }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [_isResizing, setIsResizing] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisMenu, setShowAnalysisMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState(data.aiPrompt || '');
  const [isRegenerating, setIsRegenerating] = useState(false);
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        cursor: 'grab',
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'visible',
        border: selected ? '2px solid #fbbf24' : '2px solid transparent',
        // CSS containment for rendering optimization
        contentVisibility: 'auto',
        containIntrinsicSize: `${size}px ${size}px`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#fbbf24',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Inner container with overflow hidden for image clipping */}
      <div style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '8px',
        overflow: 'hidden',
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
          onError={(_e) => {
            console.error('Image failed to load:', data.imageUrl);
            setImageError(true);
            setImageLoaded(false);
          }}
        />

        {/* Compact dark overlay - max 30% of photo height */}
        {imageLoaded && (data.location || data.date) && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '8px 10px',
            backgroundColor: 'rgba(0, 0, 0, 0.60)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#ffffff',
            zIndex: 10,
            maxHeight: '30%',
            overflow: 'hidden',
          }}>
            {/* Single row: Location and Date */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}>
              {data.location && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flex: 1,
                  minWidth: 0,
                }}>
                  <span style={{ fontSize: '12px', opacity: 0.9 }}>📍</span>
                  <span style={{
                    fontSize: size > 250 ? '14px' : '12px',
                    fontWeight: '600',
                    color: '#ffffff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {data.location}
                  </span>
                </div>
              )}

              {data.date && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>📅</span>
                  <span style={{
                    fontSize: size > 250 ? '12px' : '10px',
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.85)',
                  }}>
                    {data.date}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Star button - top left, visible on hover/select/starred */}
        {(isHovered || selected || data.isStarred) && data.onToggleStar && (
          <button
            className="nodrag nopan"
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleStar(id);
            }}
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              width: '28px',
              height: '28px',
              padding: 0,
              borderRadius: '50%',
              backgroundColor: data.isStarred ? '#fbbf24' : 'rgba(0, 0, 0, 0.6)',
              border: '2px solid white',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              zIndex: 25,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={data.isStarred ? 'Unstar photo' : 'Star photo'}
          >
            ★
          </button>
        )}

        {/* Delete button - top right corner */}
        {(isHovered || selected) && data.onDelete && (
          <button
            className="nodrag nopan"
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete(id);
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '28px',
              height: '28px',
              padding: 0,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: '2px solid white',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              zIndex: 25,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Delete photo"
          >
            ×
          </button>
        )}

        {/* Action Buttons - Only show when selected */}
        {selected && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '44px',
            display: 'flex',
            gap: '6px',
            zIndex: 25
          }}>
            {/* AI Analyze Button */}
            <div style={{ position: 'relative' }}>
              <button
                className="nodrag nopan"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAnalysisMenu(!showAnalysisMenu);
                }}
                disabled={isAnalyzing}
                style={{
                  padding: '6px 10px',
                  backgroundColor: isAnalyzing ? 'rgba(251, 191, 36, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                  color: isAnalyzing ? '#000' : 'white',
                  border: '2px solid #fbbf24',
                  borderRadius: '4px',
                  cursor: isAnalyzing ? 'wait' : 'pointer',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'auto',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isAnalyzing ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #000',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    AI...
                  </>
                ) : (
                  '🤖 AI'
                )}
              </button>

              {/* Analysis Type Menu */}
              {showAnalysisMenu && !isAnalyzing && (
                <div
                  className="nodrag nopan"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    minWidth: '160px',
                    zIndex: 100
                  }}
                >
                  {[
                    { type: 'describe', label: '📝 Describe', desc: 'Get AI description' },
                    { type: 'tags', label: '🏷️ Tags', desc: 'Suggest tags' },
                    { type: 'travel', label: '🌍 Location', desc: 'Identify place' },
                    { type: 'ocr', label: '📄 Text (OCR)', desc: 'Extract text' },
                  ].map((option) => (
                    <button
                      key={option.type}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setShowAnalysisMenu(false);
                        if (data.onAnalyze) {
                          setIsAnalyzing(true);
                          try {
                            await data.onAnalyze(id, data.imageUrl, option.type);
                          } finally {
                            setIsAnalyzing(false);
                          }
                        }
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#111827',
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#fef3c7'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {option.label}
                      <span style={{
                        display: 'block',
                        fontSize: '10px',
                        fontWeight: '400',
                        color: '#6b7280',
                        marginTop: '2px'
                      }}>
                        {option.desc}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Edit Button - Only for non-AI images */}
            {!data.aiGenerated && (
              <button
                className="nodrag nopan"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAnalysisMenu(false);
                  if (data.onEdit) {
                    data.onEdit(id, data);
                  }
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowAnalysisMenu(false);
                  if (data.onEdit) {
                    data.onEdit(id, data);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  border: '2px solid #EECF00',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
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

            {/* Regenerate Button - Only for AI-generated images */}
            {data.aiGenerated && data.onRegenerate && (
              <button
                className="nodrag nopan"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAnalysisMenu(false);
                  setRegeneratePrompt(data.aiPrompt || '');
                  setShowRegenerateModal(true);
                }}
                disabled={isRegenerating}
                style={{
                  padding: '6px 12px',
                  backgroundColor: isRegenerating ? 'rgba(147, 51, 234, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  border: '2px solid #9333ea',
                  borderRadius: '4px',
                  cursor: isRegenerating ? 'wait' : 'pointer',
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'auto',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isRegenerating) {
                    e.target.style.backgroundColor = 'rgba(147, 51, 234, 0.95)';
                    e.target.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRegenerating) {
                    e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    e.target.style.transform = 'scale(1)';
                  }
                }}
              >
                {isRegenerating ? '⏳ GENERATING...' : '🔄 REGENERATE'}
              </button>
            )}
          </div>
        )}

        {/* Regenerate Modal for AI Images */}
        {showRegenerateModal && data.aiGenerated && (
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              zIndex: 100,
              width: '280px',
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <h4 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '700',
                color: '#111827',
              }}>
                🔄 Regenerate Image
              </h4>
              <button
                onClick={() => setShowRegenerateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>

            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              color: '#6b7280',
              marginBottom: '6px',
            }}>
              Edit prompt:
            </label>
            <textarea
              value={regeneratePrompt}
              onChange={(e) => setRegeneratePrompt(e.target.value)}
              placeholder="Describe the image you want..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
                resize: 'vertical',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowRegenerateModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!regeneratePrompt.trim()) return;
                  setIsRegenerating(true);
                  setShowRegenerateModal(false);
                  try {
                    await data.onRegenerate(id, regeneratePrompt);
                  } finally {
                    setIsRegenerating(false);
                  }
                }}
                disabled={!regeneratePrompt.trim() || isRegenerating}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: regeneratePrompt.trim() ? '#9333ea' : '#e5e7eb',
                  color: regeneratePrompt.trim() ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: regeneratePrompt.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                ✨ Generate
              </button>
            </div>
          </div>
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
          width: '12px',
          height: '12px',
          backgroundColor: '#fbbf24',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />
    </div>
  );
});

DraggablePhotoNode.displayName = 'DraggablePhotoNode';

export default DraggablePhotoNode;
