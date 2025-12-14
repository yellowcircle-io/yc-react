import React, { useState, useCallback, useEffect, memo, useRef } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import { getLLMAdapter, getLLMAdapterByName } from '../../adapters/llm';
import { useCredits } from '../../hooks/useCredits';
import { useAuth } from '../../contexts/AuthContext';
import SimpleMarkdown, { hasMarkdown } from './SimpleMarkdown';

// ============================================================================
// ENCRYPTION UTILITIES - To read Hub's encrypted settings
// ============================================================================
const ENCRYPTION_SALT = 'yellowcircle-outreach-2025';

async function deriveEncryptionKey(password) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(ENCRYPTION_SALT),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

async function decryptSettings(encryptedObj, password) {
  try {
    if (!encryptedObj?.encrypted) return encryptedObj;
    const key = await deriveEncryptionKey(password);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedObj.iv) },
      key,
      new Uint8Array(encryptedObj.data)
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
}

// Get API keys from Hub's encrypted settings or environment
async function getHubApiKeys() {
  try {
    const savedSettings = localStorage.getItem('outreach_business_settings_v4');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Try to decrypt with the known password hash
      const decrypted = await decryptSettings(parsed, atob('eWMyMDI1b3V0cmVhY2g='));
      if (decrypted) {
        // Hub stores keys directly as groqApiKey, perplexityApiKey
        return {
          groq: decrypted.groqApiKey || '',
          perplexity: decrypted.perplexityApiKey || '',
          resend: decrypted.resendApiKey || ''
        };
      }
    }
  } catch (e) {
    console.warn('Failed to decrypt Hub settings:', e);
  }

  // Fall back to environment variables
  return {
    groq: import.meta.env.VITE_GROQ_API_KEY || '',
    perplexity: import.meta.env.VITE_PERPLEXITY_API_KEY || '',
    openai: import.meta.env.VITE_OPENAI_API_KEY || ''
  };
}

/**
 * TextNoteNode - Draggable text note card for Unity Note Plus
 *
 * Features:
 * - Title and content editing
 * - Color accent selection
 * - Resizable width
 * - Dark/light theme support
 * - AI assistance using Hub's configured LLM (Groq/Perplexity)
 */
const TextNoteNode = memo(({ data, id, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Credits hook for AI usage restrictions
  const { hasCredits, useCredit: consumeCredit, tier } = useCredits();

  // Authentication for admin check
  const { isAdmin } = useAuth();

  // Check if user has unlimited access (admin/premium)
  const hasUnlimitedAccess = useCallback(() => {
    // Admin - unlimited (authenticated via SSO)
    if (isAdmin) return true;
    if (tier === 'premium') return true;
    return false;
  }, [isAdmin, tier]);

  // Local state that syncs with data prop
  const [localTitle, setLocalTitle] = useState(data.title || 'New Note');
  const [localContent, setLocalContent] = useState(data.content || '');
  const [localUrl, setLocalUrl] = useState(data.url || '');

  // AI Chat thread state (Phase 1 UX improvement)
  const [aiMessages, setAiMessages] = useState(data.aiMessages || []);
  const [aiInput, setAiInput] = useState('');
  const threadRef = useRef(null);

  // Link preview state - rich Open Graph data
  const [linkPreview, setLinkPreview] = useState(data.linkPreview || null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Determine card type from id prefix or explicit type (needed early for useEffect)
  const cardType = data.cardType ||
    (id?.startsWith('link-') ? 'link' :
     id?.startsWith('ai-') ? 'ai' :
     id?.startsWith('video-') ? 'video' : 'note');

  // Sync local state when data changes from parent
  useEffect(() => {
    setLocalTitle(data.title || 'New Note');
    setLocalContent(data.content || '');
    setLocalUrl(data.url || '');
    if (data.aiMessages) {
      setAiMessages(data.aiMessages);
    }
    if (data.linkPreview) {
      setLinkPreview(data.linkPreview);
    }
  }, [data.title, data.content, data.url, data.aiMessages, data.linkPreview]);

  // Fetch rich link preview (Open Graph) when URL changes
  useEffect(() => {
    if (cardType !== 'link' || !localUrl) return;

    // Skip if we already have a preview for this URL
    if (linkPreview?.url === localUrl) return;

    const fetchLinkPreview = async () => {
      setIsLoadingPreview(true);
      try {
        // Try to fetch Open Graph data via a CORS-friendly service
        // Using jsonlink.io free tier (no API key needed)
        const response = await fetch(
          `https://jsonlink.io/api/extract?url=${encodeURIComponent(localUrl)}`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (response.ok) {
          const ogData = await response.json();
          const preview = {
            url: localUrl,
            title: ogData.title || null,
            description: ogData.description || null,
            image: ogData.images?.[0] || null,
            siteName: ogData.domain || null,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(localUrl).hostname}&sz=32`,
          };
          setLinkPreview(preview);

          // Save preview to node data for persistence
          if (data.onUpdate) {
            data.onUpdate({ linkPreview: preview });
          }
        }
      } catch (err) {
        // Fallback to basic preview on error
        console.warn('Link preview fetch failed:', err);
        const basicPreview = {
          url: localUrl,
          title: null,
          description: null,
          image: null,
          siteName: new URL(localUrl).hostname.replace('www.', ''),
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(localUrl).hostname}&sz=32`,
        };
        setLinkPreview(basicPreview);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    // Debounce the fetch
    const timer = setTimeout(fetchLinkPreview, 500);
    return () => clearTimeout(timer);
  }, [localUrl, cardType, linkPreview?.url, data]);

  // Auto-scroll thread to bottom when new messages arrive
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [aiMessages]);

  const isDarkTheme = data.theme === 'dark';
  const accentColor = data.color || 'rgb(251, 191, 36)';

  // Card type configurations
  const cardTypeConfig = {
    note: { icon: '📝', label: 'Note' },
    link: { icon: '🔗', label: 'Link' },
    ai: { icon: '🤖', label: 'Assistance' },
    video: { icon: '📹', label: 'Video' }
  };

  const config = cardTypeConfig[cardType] || cardTypeConfig.note;

  // Start editing
  const startEditing = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsEditing(true);
  }, []);

  // Save changes and exit editing
  const saveAndClose = useCallback(() => {
    setIsEditing(false);
    if (data.onUpdate) {
      data.onUpdate(id, {
        title: localTitle,
        content: localContent,
        url: localUrl,
        cardType
      });
    }
  }, [id, localTitle, localContent, localUrl, cardType, data]);

  // Handle key events
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      saveAndClose();
    }
    // Don't propagate to prevent node dragging while typing
    e.stopPropagation();
  }, [saveAndClose]);

  // Extract video embed info
  const getVideoEmbed = useCallback((videoUrl) => {
    if (!videoUrl) return null;
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (youtubeMatch) return { type: 'youtube', id: youtubeMatch[1] };
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] };
    return null;
  }, []);

  // Extract domain and favicon from URL for link preview
  const getLinkPreviewData = useCallback((url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      return {
        domain: urlObj.hostname.replace('www.', ''),
        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`,
        isSecure: urlObj.protocol === 'https:'
      };
    } catch {
      return null;
    }
  }, []);

  // Gather context from localStorage (notes and MAP journey nodes)
  const gatherPageContext = useCallback(() => {
    try {
      const contextParts = [];
      let noteCount = 0;
      let mapNodeCount = 0;

      // 1. Gather regular notes context
      const savedData = localStorage.getItem('unity-notes-data');
      if (savedData) {
        const { nodes: savedNodes } = JSON.parse(savedData);
        if (savedNodes && savedNodes.length > 0) {
          savedNodes.forEach((node) => {
            if (node.id === id) return; // Skip current node

            const nodeData = node.data || {};
            const nodeType = node.type || 'unknown';

            // Extract relevant content based on node type
            if (nodeType === 'textNode' || nodeType === 'photoNode') {
              const title = nodeData.title || nodeData.label || '';
              const content = nodeData.content || nodeData.description || '';
              const url = nodeData.url || '';

              if (title || content) {
                noteCount++;
                let nodeContext = `[Note ${noteCount}]`;
                if (title) nodeContext += ` Title: ${title}`;
                if (content) nodeContext += ` | Content: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`;
                if (url) nodeContext += ` | URL: ${url}`;
                contextParts.push(nodeContext);
              }
            }

            // Also capture MAP nodes from the same localStorage (UnityNotes stores both)
            if (['prospectNode', 'emailNode', 'conditionNode', 'waitNode', 'exitNode'].includes(nodeType)) {
              mapNodeCount++;
              let mapContext = `[MAP ${nodeType.replace('Node', '')} ${mapNodeCount}]`;

              if (nodeType === 'prospectNode') {
                mapContext += ` Company: ${nodeData.label || 'Unknown'}`;
                if (nodeData.prospects?.length > 0) {
                  const p = nodeData.prospects[0];
                  mapContext += ` | Contact: ${p.firstName || ''} ${p.lastName || ''} (${p.email || 'no email'})`;
                  if (p.trigger) mapContext += ` | Trigger: ${p.trigger}`;
                }
              } else if (nodeType === 'emailNode') {
                mapContext += ` Subject: ${nodeData.subject || nodeData.label || 'No subject'}`;
                if (nodeData.fullBody) {
                  mapContext += ` | Body: ${nodeData.fullBody.substring(0, 150)}${nodeData.fullBody.length > 150 ? '...' : ''}`;
                }
              } else if (nodeType === 'waitNode') {
                mapContext += ` Wait: ${nodeData.duration || 1} ${nodeData.unit || 'days'}`;
              } else if (nodeType === 'conditionNode') {
                mapContext += ` Condition: ${nodeData.label || 'Unknown'}`;
                if (nodeData.customCondition) {
                  mapContext += ` (${nodeData.customCondition.label || ''})`;
                }
              } else if (nodeType === 'exitNode') {
                mapContext += ` Exit: ${nodeData.exitType || 'completed'}`;
              }
              contextParts.push(mapContext);
            }
          });
        }
      }

      if (contextParts.length === 0) return '';

      const summary = [];
      if (noteCount > 0) summary.push(`${noteCount} notes`);
      if (mapNodeCount > 0) summary.push(`${mapNodeCount} journey nodes`);

      return `\n\n--- Context from your canvas (${summary.join(', ')}) ---\n${contextParts.join('\n')}`;
    } catch (error) {
      console.warn('Failed to gather page context:', error);
      return '';
    }
  }, [id]);

  // Handle AI query - uses Hub's configured LLM or falls back to env
  // Updated for Phase 1 Thread UI - uses message array instead of appending to textarea
  const handleAiQuery = useCallback(async (inputText) => {
    const queryText = inputText || aiInput;
    if (!queryText.trim()) return;
    if (isAiLoading) return;

    // Check credits before making AI request (unless user has unlimited access)
    if (!hasUnlimitedAccess() && !hasCredits()) {
      // No credits - show error message in thread
      const errorMessage = {
        role: 'assistant',
        content: '⚠️ No credits remaining. Sign in or upgrade to continue using AI assistance.',
        timestamp: Date.now(),
        isError: true
      };
      setAiMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Add user message to thread immediately
    const userMessage = {
      role: 'user',
      content: queryText.trim(),
      timestamp: Date.now()
    };
    const updatedMessages = [...aiMessages, userMessage];
    setAiMessages(updatedMessages);
    setAiInput(''); // Clear input

    setIsAiLoading(true);
    try {
      // First try to get API keys from Hub's encrypted settings
      const hubKeys = await getHubApiKeys();
      let adapter = null;
      let providerUsed = '';

      // Try Groq first (fastest/cheapest)
      if (hubKeys.groq) {
        adapter = await getLLMAdapterByName('groq');
        if (adapter) {
          // Temporarily set the API key for this request
          adapter._hubApiKey = hubKeys.groq;
          providerUsed = 'Groq';
        }
      }

      // Fall back to standard adapter if Hub keys not available
      if (!adapter) {
        adapter = await getLLMAdapter();
        providerUsed = 'default';
      }

      if (!adapter) {
        throw new Error('No AI configured. Set up API keys in UnityMAP Hub settings.');
      }

      // Check if configured - for Hub keys, we have them; for default, check isConfigured
      if (providerUsed === 'default' && adapter.isConfigured && !adapter.isConfigured()) {
        throw new Error('No AI API key found. Configure in UnityMAP Hub or add VITE_GROQ_API_KEY to .env');
      }

      // Gather context from other notes on the page
      const pageContext = gatherPageContext();

      // Build conversation history for context (last 6 messages)
      const recentHistory = updatedMessages.slice(-6).map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n\n');

      // Build enhanced prompt with conversation history and page context
      const enhancedPrompt = `${recentHistory ? `Previous conversation:\n${recentHistory}\n\n` : ''}Current question: ${queryText}${pageContext}`;

      // Generate with Hub's API key if available
      const generateOptions = {
        systemPrompt: `You are a helpful AI assistant integrated into Unity, a marketing automation platform. You have access to the user's notes and marketing journey nodes (email campaigns, prospect data, wait times, conditions, etc.) as context.

Key capabilities:
- Help write and refine email copy for outreach campaigns
- Suggest improvements to email sequences and timing
- Provide insights about prospects and targeting
- Reference their existing notes and journey nodes when applicable
- Keep responses concise and actionable

If you see MAP journey nodes in the context, you can help optimize the email sequence, suggest subject lines, or improve the messaging strategy.`,
        maxTokens: 1024
      };

      // If using Hub's API key, pass it to the adapter
      if (adapter._hubApiKey) {
        generateOptions.apiKey = adapter._hubApiKey;
      }

      const aiResponse = await adapter.generate(enhancedPrompt, generateOptions);

      // Consume credit after successful AI response (unless unlimited access)
      if (!hasUnlimitedAccess()) {
        const creditResult = await consumeCredit();
        if (!creditResult.success) {
          console.warn('Failed to consume credit:', creditResult.error);
        }
      }

      // Add AI response to thread
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now()
      };
      const finalMessages = [...updatedMessages, assistantMessage];
      setAiMessages(finalMessages);

      // Save to node data
      if (data.onUpdate) {
        data.onUpdate(id, {
          title: localTitle,
          content: localContent,
          url: localUrl,
          cardType,
          aiMessages: finalMessages
        });
      }
    } catch (error) {
      console.error('AI error:', error);
      // Add error as system message
      const errorMessage = {
        role: 'assistant',
        content: `⚠️ Error: ${error.message}`,
        timestamp: Date.now(),
        isError: true
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setAiMessages(finalMessages);
    } finally {
      setIsAiLoading(false);
    }
  }, [aiInput, aiMessages, isAiLoading, id, cardType, data, localTitle, localContent, localUrl, gatherPageContext, hasUnlimitedAccess, hasCredits, consumeCredit]);

  const baseStyles = {
    backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
    color: isDarkTheme ? '#f3f4f6' : '#1f2937',
    borderColor: selected ? accentColor : (isDarkTheme ? '#374151' : '#e5e7eb'),
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

      {/* Delete button - uses NodeToolbar (portal) to avoid clipping */}
      {/* Functionality matches UnityMAP WaitNode: hover-only visibility */}
      <NodeToolbar
        isVisible={isHovered}
        position={Position.Top}
        align="end"
        offset={8}
      >
        <button
          className="nodrag nopan"
          onClick={(e) => {
            e.stopPropagation();
            if (data.onDelete) data.onDelete(id);
          }}
          style={{
            width: '24px',
            height: '24px',
            minWidth: '24px',
            minHeight: '24px',
            padding: 0,
            borderRadius: '50%',
            backgroundColor: '#374151',
            border: '2px solid white',
            color: 'white',
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            zIndex: 10,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1f2937';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#374151';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Delete node"
        >
          ×
        </button>
      </NodeToolbar>

      {/* Edit hint on hover - matches UnityMAP WaitNode pattern */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          bottom: '-24px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '9px',
          fontWeight: '600',
          color: accentColor,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          Click to edit
        </div>
      )}

      {/* Card content wrapper */}
      <div style={{ overflow: 'hidden', borderRadius: '6px' }}>

      {/* Header accent */}
      <div style={{ height: '6px', backgroundColor: accentColor }} />

      {/* Card type label */}
      <div style={{ padding: '8px 12px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px' }}>{config.icon}</span>
        <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', color: accentColor, textTransform: 'uppercase' }}>
          {config.label}
        </span>
      </div>

      {/* Title - Always editable inline */}
      <div style={{ padding: '0 12px 8px' }}>
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={saveAndClose}
          onKeyDown={handleKeyDown}
          className="nodrag nopan"
          style={{
            width: '100%',
            fontSize: '15px',
            fontWeight: '700',
            color: baseStyles.color,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '4px 0',
            cursor: 'text',
          }}
        />
      </div>

      {/* LINK: URL Input + Preview */}
      {cardType === 'link' && (
        <div style={{ padding: '0 12px 8px' }}>
          {/* URL Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            backgroundColor: isDarkTheme ? '#111827' : '#eff6ff',
            borderRadius: '4px',
            border: `1px solid ${isDarkTheme ? '#374151' : '#bfdbfe'}`,
            marginBottom: localUrl ? '8px' : '0',
          }}>
            <input
              type="url"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              onBlur={saveAndClose}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com"
              className="nodrag nopan"
              style={{
                flex: 1,
                fontSize: '12px',
                color: isDarkTheme ? '#93c5fd' : '#2563eb',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
            {localUrl && (
              <a
                href={localUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ fontSize: '16px', textDecoration: 'none' }}
                title="Open link"
              >
                ↗️
              </a>
            )}
          </div>
          {/* Rich Link Preview (iMessage-style) */}
          {localUrl && (
            <a
              href={localUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="nodrag nopan"
              style={{
                display: 'block',
                backgroundColor: isDarkTheme ? '#1f2937' : '#f8fafc',
                borderRadius: '8px',
                border: `1px solid ${isDarkTheme ? '#374151' : '#e2e8f0'}`,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              {/* Loading State */}
              {isLoadingPreview && (
                <div style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isDarkTheme ? '#9ca3af' : '#64748b',
                  fontSize: '11px',
                }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  Loading preview...
                </div>
              )}

              {/* Rich Preview with Image */}
              {!isLoadingPreview && linkPreview?.image && (
                <div>
                  {/* Preview Image */}
                  <div style={{
                    width: '100%',
                    height: '120px',
                    backgroundColor: isDarkTheme ? '#111827' : '#e5e7eb',
                    overflow: 'hidden',
                  }}>
                    <img
                      src={linkPreview.image}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                    />
                  </div>
                  {/* Text Content */}
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: isDarkTheme ? '#f3f4f6' : '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '4px',
                    }}>
                      {linkPreview.title || localTitle || linkPreview.siteName}
                    </div>
                    {linkPreview.description && (
                      <div style={{
                        fontSize: '11px',
                        color: isDarkTheme ? '#9ca3af' : '#64748b',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4',
                        marginBottom: '6px',
                      }}>
                        {linkPreview.description}
                      </div>
                    )}
                    <div style={{
                      fontSize: '10px',
                      color: isDarkTheme ? '#6b7280' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <img
                        src={linkPreview.favicon}
                        alt=""
                        style={{ width: '12px', height: '12px', borderRadius: '2px' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      {linkPreview.siteName || getLinkPreviewData(localUrl)?.domain}
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback: Simple Preview (no image) */}
              {!isLoadingPreview && (!linkPreview?.image) && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                }}>
                  <img
                    src={linkPreview?.favicon || getLinkPreviewData(localUrl)?.favicon}
                    alt=""
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      flexShrink: 0,
                      backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: isDarkTheme ? '#f3f4f6' : '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {linkPreview?.title || (localTitle !== 'New Link' ? localTitle : linkPreview?.siteName || getLinkPreviewData(localUrl)?.domain)}
                    </div>
                    {linkPreview?.description && (
                      <div style={{
                        fontSize: '10px',
                        color: isDarkTheme ? '#9ca3af' : '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                      }}>
                        {linkPreview.description}
                      </div>
                    )}
                    <div style={{
                      fontSize: '10px',
                      color: isDarkTheme ? '#6b7280' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '2px',
                    }}>
                      {getLinkPreviewData(localUrl)?.isSecure && (
                        <span style={{ color: '#22c55e', fontSize: '8px' }}>🔒</span>
                      )}
                      {linkPreview?.siteName || getLinkPreviewData(localUrl)?.domain}
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', color: isDarkTheme ? '#6b7280' : '#94a3b8' }}>→</span>
                </div>
              )}
            </a>
          )}
        </div>
      )}

      {/* VIDEO: URL Input + Preview */}
      {cardType === 'video' && (
        <div style={{ padding: '0 12px 8px' }}>
          <div style={{
            padding: '8px',
            backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
            borderRadius: '4px',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            marginBottom: '8px',
          }}>
            <input
              type="url"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              onBlur={saveAndClose}
              onKeyDown={handleKeyDown}
              placeholder="YouTube or Vimeo URL"
              className="nodrag nopan"
              style={{
                width: '100%',
                fontSize: '12px',
                color: isDarkTheme ? '#d1d5db' : '#4b5563',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
          </div>
          {getVideoEmbed(localUrl) && (
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
                  getVideoEmbed(localUrl).type === 'youtube'
                    ? `https://www.youtube.com/embed/${getVideoEmbed(localUrl).id}`
                    : `https://player.vimeo.com/video/${getVideoEmbed(localUrl).id}`
                }
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {localUrl && !getVideoEmbed(localUrl) && (
            <div style={{ fontSize: '11px', color: '#dc2626', padding: '8px' }}>
              Invalid URL. Use YouTube or Vimeo links.
            </div>
          )}
        </div>
      )}

      {/* AI Card: Thread-based chat UI */}
      {cardType === 'ai' && (
        <div style={{ padding: '0 12px 12px' }}>
          {/* Thread view - scrollable message history */}
          <div
            ref={threadRef}
            className="nodrag nopan"
            style={{
              maxHeight: '200px',
              minHeight: aiMessages.length > 0 ? '100px' : '40px',
              overflowY: 'auto',
              marginBottom: '8px',
              padding: aiMessages.length > 0 ? '8px' : '12px',
              backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
              borderRadius: '6px',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            }}
          >
            {aiMessages.length === 0 ? (
              <div style={{
                fontSize: '12px',
                color: isDarkTheme ? '#6b7280' : '#9ca3af',
                textAlign: 'center',
              }}>
                Ask me anything! I can see your other notes.
              </div>
            ) : (
              aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: idx < aiMessages.length - 1 ? '10px' : 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '90%',
                    padding: '8px 12px',
                    borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    backgroundColor: msg.role === 'user'
                      ? 'rgb(251, 191, 36)'
                      : msg.isError
                        ? (isDarkTheme ? '#7f1d1d' : '#fef2f2')
                        : (isDarkTheme ? '#1f2937' : '#ffffff'),
                    color: msg.role === 'user'
                      ? '#111827'
                      : msg.isError
                        ? (isDarkTheme ? '#fca5a5' : '#dc2626')
                        : (isDarkTheme ? '#e5e7eb' : '#374151'),
                    fontSize: '12px',
                    lineHeight: '1.5',
                    border: msg.role === 'assistant' && !msg.isError
                      ? `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`
                      : 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      marginBottom: '4px',
                      opacity: 0.7,
                    }}>
                      {msg.role === 'user' ? '💬 You' : '🤖 AI'}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            {/* Loading indicator */}
            {isAiLoading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: aiMessages.length > 0 ? '10px' : 0,
                padding: '8px 12px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                borderRadius: '12px 12px 12px 4px',
                border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                width: 'fit-content',
              }}>
                <span style={{ fontSize: '12px' }}>🤖</span>
                <span style={{
                  fontSize: '12px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                }}>
                  Thinking...
                </span>
              </div>
            )}
          </div>

          {/* Input row */}
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
          }}>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                // Send on Enter (without Shift), allow Shift+Enter for newlines
                if (e.key === 'Enter' && !e.shiftKey && aiInput.trim() && !isAiLoading) {
                  e.preventDefault();
                  handleAiQuery();
                }
              }}
              placeholder="Ask a question... (Shift+Enter for newline)"
              className="nodrag nopan"
              disabled={isAiLoading}
              rows={2}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '12px',
                color: isDarkTheme ? '#e5e7eb' : '#374151',
                backgroundColor: isDarkTheme ? '#111827' : '#ffffff',
                border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.4',
                minHeight: '42px',
                maxHeight: '100px',
              }}
            />
            <button
              className="nodrag nopan"
              onClick={() => handleAiQuery()}
              disabled={isAiLoading || !aiInput.trim()}
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                backgroundColor: isAiLoading || !aiInput.trim()
                  ? (isDarkTheme ? '#374151' : '#e5e7eb')
                  : 'rgb(251, 191, 36)',
                color: isAiLoading || !aiInput.trim()
                  ? (isDarkTheme ? '#6b7280' : '#9ca3af')
                  : '#111827',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: isAiLoading ? 'wait' : !aiInput.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              title="Send message"
            >
              {isAiLoading ? '⏳' : '→'}
            </button>
          </div>

          {/* Action buttons row */}
          {aiMessages.length > 0 && (
            <div style={{
              marginTop: '8px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              {/* Open in Studio button */}
              {data.onOpenStudio && (
                <button
                  className="nodrag nopan"
                  onClick={() => {
                    // Pass conversation context to Studio
                    const context = {
                      type: 'ai-conversation',
                      messages: aiMessages,
                      title: localTitle,
                      nodeId: id
                    };
                    data.onOpenStudio(context);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#111827',
                    backgroundColor: 'rgb(251, 191, 36)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(245, 180, 25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(251, 191, 36)';
                  }}
                  title="Create email template from this conversation"
                >
                  ✨ Open in Studio
                </button>
              )}
              {/* Clear history button */}
              <button
                className="nodrag nopan"
                onClick={() => {
                  setAiMessages([]);
                  if (data.onUpdate) {
                    data.onUpdate(id, {
                      title: localTitle,
                      content: localContent,
                      url: localUrl,
                      cardType,
                      aiMessages: []
                    });
                  }
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  color: isDarkTheme ? '#6b7280' : '#9ca3af',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: 0.7,
                }}
              >
                Clear conversation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content area - For non-AI cards only */}
      {cardType !== 'ai' && (
        <div style={{ padding: '0 12px 12px' }}>
          {/* Edit mode: Show textarea */}
          {isEditing ? (
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              onBlur={() => {
                setIsEditing(false);
                saveAndClose();
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder={
                cardType === 'link' ? 'Add notes about this link...' :
                cardType === 'video' ? 'Add notes about this video...' :
                'Add your note content... (supports **bold**, *italic*, # headers, - lists)'
              }
              className="nodrag nopan"
              style={{
                width: '100%',
                minHeight: '80px',
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
            /* View mode: Show rendered markdown or placeholder */
            <div
              className="nodrag nopan"
              onClick={startEditing}
              style={{
                minHeight: '40px',
                padding: '8px',
                fontSize: '13px',
                lineHeight: '1.5',
                color: localContent ? (isDarkTheme ? '#d1d5db' : '#4b5563') : (isDarkTheme ? '#6b7280' : '#9ca3af'),
                backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
                border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                borderRadius: '4px',
                cursor: 'text',
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isDarkTheme ? '#4b5563' : '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDarkTheme ? '#374151' : '#e5e7eb';
              }}
              title="Click to edit"
            >
              {localContent ? (
                hasMarkdown(localContent) ? (
                  <SimpleMarkdown content={localContent} isDarkTheme={isDarkTheme} />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{localContent}</div>
                )
              ) : (
                cardType === 'link' ? 'Add notes about this link...' :
                cardType === 'video' ? 'Add notes about this video...' :
                'Click to add note content...'
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '8px 12px',
        borderTop: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
        fontSize: '10px',
        color: isDarkTheme ? '#6b7280' : '#9ca3af',
      }}>
        {data.updatedAt
          ? `Updated ${new Date(data.updatedAt).toLocaleDateString()}`
          : `Created ${new Date(data.createdAt || Date.now()).toLocaleDateString()}`
        }
      </div>
      </div>
    </div>
  );
});

TextNoteNode.displayName = 'TextNoteNode';

export default TextNoteNode;
