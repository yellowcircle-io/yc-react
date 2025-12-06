import React, { useState, useCallback, memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getLLMAdapter } from '../../adapters/llm';

/**
 * TextNoteNode - Draggable text note card for Unity Note Plus
 *
 * Features:
 * - Title and content editing
 * - Color accent selection
 * - Resizable width
 * - Dark/light theme support
 */
const TextNoteNode = memo(({ data, id, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title || 'New Note');
  const [content, setContent] = useState(data.content || '');
  const [url, setUrl] = useState(data.url || '');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Determine card type from id prefix or explicit type
  const cardType = data.cardType ||
    (id?.startsWith('link-') ? 'link' :
     id?.startsWith('ai-') ? 'ai' :
     id?.startsWith('video-') ? 'video' : 'note');

  const isDarkTheme = data.theme === 'dark';
  const accentColor = data.color || 'rgb(251, 191, 36)'; // Default yellow

  // Card type configurations
  const cardTypeConfig = {
    note: { icon: '📝', label: 'Note' },
    link: { icon: '🔗', label: 'Link' },
    ai: { icon: '🤖', label: 'Assistance' },
    video: { icon: '📹', label: 'Video' }
  };

  const config = cardTypeConfig[cardType] || cardTypeConfig.note;

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (data.onUpdate) {
      data.onUpdate(id, { title, content, url, cardType });
    }
  }, [id, title, content, url, cardType, data]);

  // Extract video embed info
  const getVideoEmbed = useCallback((videoUrl) => {
    if (!videoUrl) return null;

    // YouTube
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (youtubeMatch) {
      return { type: 'youtube', id: youtubeMatch[1] };
    }

    // Vimeo
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return { type: 'vimeo', id: vimeoMatch[1] };
    }

    return null;
  }, []);

  // Handle AI query - uses configured LLM adapter
  const handleAiQuery = useCallback(async () => {
    if (!content.trim() || isAiLoading) return;

    setIsAiLoading(true);
    try {
      // Get the configured LLM adapter (async - OpenAI, Groq, Claude, etc.)
      const adapter = await getLLMAdapter();

      if (!adapter || !adapter.isConfigured()) {
        throw new Error('No AI provider configured. Add API key in .env (VITE_OPENAI_API_KEY, VITE_GROQ_API_KEY, or VITE_CLAUDE_API_KEY)');
      }

      // Generate response using the adapter
      const aiResponse = await adapter.generate(content, {
        systemPrompt: 'You are a helpful assistant in a note-taking app. Keep responses concise and helpful.',
        maxTokens: 1024
      });

      const newContent = `${content}\n\n---\n🤖 AI: ${aiResponse}`;
      setContent(newContent);

      if (data.onUpdate) {
        data.onUpdate(id, { title, content: newContent, cardType });
      }
    } catch (error) {
      console.error('AI query error:', error);
      const errorContent = `${content}\n\n---\n⚠️ AI error: ${error.message}`;
      setContent(errorContent);
    } finally {
      setIsAiLoading(false);
    }
  }, [content, isAiLoading, id, title, cardType, data]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, []);

  const baseStyles = {
    backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
    color: isDarkTheme ? '#f3f4f6' : '#1f2937',
    borderColor: selected ? accentColor : (isDarkTheme ? '#374151' : '#e5e7eb'),
  };

  return (
    <div
      style={{
        position: 'relative',
        minWidth: data.width || 280,
        maxWidth: 400,
        borderRadius: '8px',
        border: `2px solid ${baseStyles.borderColor}`,
        backgroundColor: baseStyles.backgroundColor,
        boxShadow: selected
          ? `0 0 0 2px ${accentColor}40, 0 8px 24px rgba(0,0,0,0.15)`
          : '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'visible',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: accentColor,
          width: 10,
          height: 10,
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: accentColor,
          width: 10,
          height: 10,
          border: '2px solid white',
        }}
      />

      {/* Header with accent color */}
      <div style={{
        height: '6px',
        backgroundColor: accentColor,
      }} />

      {/* Card type label */}
      <div style={{
        padding: '8px 12px 4px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span style={{ fontSize: '12px' }}>{config.icon}</span>
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '0.1em',
          color: accentColor,
          textTransform: 'uppercase',
        }}>
          {config.label}
        </span>
      </div>

      {/* Title */}
      <div style={{ padding: '0 12px 8px' }}>
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              width: '100%',
              fontSize: '15px',
              fontWeight: '700',
              color: baseStyles.color,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '4px 0',
            }}
          />
        ) : (
          <h3 style={{
            fontSize: '15px',
            fontWeight: '700',
            color: baseStyles.color,
            margin: 0,
            padding: '4px 0',
            cursor: 'text',
          }}>
            {title || 'Untitled'}
          </h3>
        )}
      </div>

      {/* Type-specific content areas */}
      {cardType === 'link' && (
        <div style={{ padding: '0 12px 8px' }}>
          {isEditing ? (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleBlur}
              placeholder="https://example.com"
              autoFocus
              className="nodrag nopan"
              style={{
                width: '100%',
                fontSize: '12px',
                color: isDarkTheme ? '#93c5fd' : '#2563eb',
                backgroundColor: isDarkTheme ? '#111827' : '#eff6ff',
                border: `1px solid ${isDarkTheme ? '#374151' : '#bfdbfe'}`,
                borderRadius: '4px',
                padding: '8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                backgroundColor: isDarkTheme ? '#111827' : '#eff6ff',
                borderRadius: '4px',
                cursor: 'text',
              }}
            >
              {url ? (
                <>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: '12px',
                      color: isDarkTheme ? '#93c5fd' : '#2563eb',
                      textDecoration: 'underline',
                      wordBreak: 'break-all',
                      flex: 1,
                    }}
                  >
                    {url}
                  </a>
                  <span style={{ fontSize: '16px' }}>🔗</span>
                </>
              ) : (
                <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                  Click to add URL...
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {cardType === 'video' && (
        <div style={{ padding: '0 12px 8px' }}>
          {isEditing ? (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleBlur}
              placeholder="YouTube or Vimeo URL"
              autoFocus
              className="nodrag nopan"
              style={{
                width: '100%',
                fontSize: '12px',
                color: isDarkTheme ? '#d1d5db' : '#4b5563',
                backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
                border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                borderRadius: '4px',
                padding: '8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          ) : getVideoEmbed(url) ? (
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '56.25%',
                backgroundColor: '#000',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <iframe
                  src={
                    getVideoEmbed(url).type === 'youtube'
                      ? `https://www.youtube.com/embed/${getVideoEmbed(url).id}`
                      : `https://player.vimeo.com/video/${getVideoEmbed(url).id}`
                  }
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {/* Edit URL button */}
              <button
                className="nodrag nopan"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                style={{
                  marginTop: '6px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  backgroundColor: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                ✏️ Edit URL
              </button>
            </div>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              style={{
                padding: '16px',
                backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
                borderRadius: '4px',
                cursor: 'text',
                textAlign: 'center',
              }}
            >
              {url ? (
                <span style={{ fontSize: '11px', color: '#dc2626' }}>
                  Invalid video URL. Click to edit.
                </span>
              ) : (
                <>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📹</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                    Click to add YouTube or Vimeo URL
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {cardType === 'ai' && (
        <div style={{ padding: '0 12px 8px' }}>
          <button
            className="nodrag nopan"
            onClick={(e) => {
              e.stopPropagation();
              if (content.trim()) {
                handleAiQuery();
              } else {
                // If no content, enter edit mode so user can type
                setIsEditing(true);
              }
            }}
            disabled={isAiLoading}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              backgroundColor: isAiLoading ? '#d1d5db' : 'rgb(251, 191, 36)',
              color: isAiLoading ? 'white' : '#111827',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: isAiLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              opacity: isAiLoading ? 0.7 : 1,
            }}
          >
            {isAiLoading ? (
              <>⏳ Thinking...</>
            ) : (
              <>🤖 Assistance</>
            )}
          </button>
        </div>
      )}

      {/* Content (shown for all types) */}
      <div style={{ padding: '0 12px 12px' }}>
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={
              cardType === 'ai' ? 'Type your question for AI...' :
              cardType === 'link' ? 'Add notes about this link...' :
              cardType === 'video' ? 'Add notes about this video...' :
              'Add your note content...'
            }
            style={{
              width: '100%',
              minHeight: cardType === 'ai' ? '60px' : '80px',
              fontSize: '13px',
              lineHeight: '1.5',
              color: isDarkTheme ? '#d1d5db' : '#4b5563',
              backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '4px',
              padding: '8px',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <p
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            style={{
              fontSize: '13px',
              lineHeight: '1.5',
              color: content ? (isDarkTheme ? '#d1d5db' : '#6b7280') : '#9ca3af',
              margin: 0,
              whiteSpace: 'pre-wrap',
              cursor: 'text',
              minHeight: '40px',
              padding: '8px',
              backgroundColor: isDarkTheme ? 'rgba(17, 24, 39, 0.5)' : 'rgba(249, 250, 251, 0.5)',
              borderRadius: '4px',
              fontStyle: content ? 'normal' : 'italic',
            }}>
            {content || (
              cardType === 'ai' ? 'Click to type a question...' :
              cardType === 'link' ? 'Add notes about this link...' :
              cardType === 'video' ? 'Add notes about this video...' :
              'Add your note content...'
            )}
          </p>
        )}
      </div>

      {/* Footer with timestamp */}
      <div style={{
        padding: '8px 12px',
        borderTop: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
        fontSize: '10px',
        color: isDarkTheme ? '#6b7280' : '#9ca3af',
      }}>
        {data.updatedAt ? (
          <span>Updated {new Date(data.updatedAt).toLocaleDateString()}</span>
        ) : (
          <span>Created {new Date(data.createdAt || Date.now()).toLocaleDateString()}</span>
        )}
      </div>

      {/* Action Buttons - Only show when selected */}
      {selected && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '6px',
          zIndex: 25,
        }}>
          {/* Preview Button - Show for email/outreach nodes */}
          {(id?.includes('outreach') || content?.includes('**Subject:**')) && (
            <button
              className="nodrag nopan"
              onClick={(e) => {
                e.stopPropagation();
                if (data.onPreview) {
                  data.onPreview(id, { title, content, color: accentColor });
                }
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (data.onPreview) {
                  data.onPreview(id, { title, content, color: accentColor });
                }
              }}
              style={{
                padding: '6px 10px',
                backgroundColor: 'rgba(251, 191, 36, 0.9)',
                color: '#111827',
                border: '2px solid rgb(251, 191, 36)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: '700',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease',
                pointerEvents: 'auto',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgb(245, 176, 0)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(251, 191, 36, 0.9)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              👁️ PREVIEW
            </button>
          )}

          {/* Edit in Outreach Button - Show for outreach campaign nodes */}
          {id?.includes('outreach') && data.onEditInOutreach && (
            <button
              className="nodrag nopan"
              onClick={(e) => {
                e.stopPropagation();
                data.onEditInOutreach(id, { title, content, color: accentColor });
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                data.onEditInOutreach(id, { title, content, color: accentColor });
              }}
              style={{
                padding: '6px 10px',
                backgroundColor: 'rgba(238, 207, 0, 0.9)',
                color: 'black',
                border: '2px solid #EECF00',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: '700',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease',
                pointerEvents: 'auto',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f5b000';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(238, 207, 0, 0.9)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              ⚡ OUTREACH
            </button>
          )}

          {/* Edit Button */}
          <button
            className="nodrag nopan"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsEditing(true);
            }}
            style={{
              padding: '6px 10px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: `2px solid ${accentColor}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = accentColor;
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

          {/* Delete Button */}
          <button
            className="nodrag nopan"
            onClick={(e) => {
              e.stopPropagation();
              if (data.onDelete) {
                data.onDelete(id);
              }
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (data.onDelete) {
                data.onDelete(id);
              }
            }}
            style={{
              padding: '6px 10px',
              backgroundColor: '#374151',
              color: 'white',
              border: '2px solid #374151',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1f2937';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#374151';
              e.target.style.transform = 'scale(1)';
            }}
          >
            × DELETE
          </button>
        </div>
      )}
    </div>
  );
});

TextNoteNode.displayName = 'TextNoteNode';

export default TextNoteNode;
