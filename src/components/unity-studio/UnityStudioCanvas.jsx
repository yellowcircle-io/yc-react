import React, { useState, useCallback } from 'react';
import EmailTemplateBuilder from './EmailTemplateBuilder';
import SocialPostBuilder from './SocialPostBuilder';
import AdCreativeBuilder from './AdCreativeBuilder';
import CampaignQuickstart from './CampaignQuickstart';

/**
 * UnityStudioCanvas - Main container for STUDIO mode
 *
 * Asset creation suite for GTM campaigns:
 * - Email templates
 * - Ad creatives
 * - Social posts
 */

/**
 * StudioModalContainer - Stable modal wrapper component
 * Defined outside UnityStudioCanvas to prevent remounting on parent re-renders
 */
const StudioModalContainer = ({ children, onClose, isDarkTheme, hasUnsavedChanges = false }) => {
  const [showExitWarning, setShowExitWarning] = React.useState(false);

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges) {
      setShowExitWarning(true);
    } else {
      onClose && onClose();
    }
  };

  const handleBackdropMouseDown = (e) => {
    // Only close if mousedown is directly on the backdrop (not bubbled from children)
    if (e.target === e.currentTarget) {
      handleCloseAttempt();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        padding: '20px'
      }}
      onMouseDown={handleBackdropMouseDown}
    >
      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: isDarkTheme ? '#f9fafb' : '#111827',
              marginBottom: '8px'
            }}>
              Unsaved Changes
            </h3>
            <p style={{
              fontSize: '14px',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              marginBottom: '20px'
            }}>
              You have unsaved work in the studio. Are you sure you want to close? Your changes will be lost.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowExitWarning(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                  color: isDarkTheme ? '#d1d5db' : '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowExitWarning(false);
                  onClose && onClose();
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          width: '90%',
          maxWidth: '1200px',
          height: '85vh',
          maxHeight: '900px',
          backgroundColor: isDarkTheme ? '#111827' : '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Close button - circular with proper sizing */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCloseAttempt();
          }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            padding: 0,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
            color: isDarkTheme ? '#d1d5db' : '#374151',
            fontSize: '24px',
            lineHeight: '1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 0.2s ease',
            aspectRatio: '1 / 1'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkTheme ? '#4b5563' : '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDarkTheme ? '#374151' : '#f3f4f6';
          }}
          title="Close Studio"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

const ASSET_TYPES = [
  {
    id: 'campaign',
    label: 'Campaign Quickstart',
    icon: '⚡',
    description: 'Generate content for ALL platforms at once',
    available: true,
    color: '#FBBF24', // Yellow - featured
    featured: true
  },
  {
    id: 'email',
    label: 'Email Template',
    icon: '📧',
    description: 'Create email templates for campaigns',
    available: true,
    color: '#10b981' // Green
  },
  {
    id: 'ad',
    label: 'Ad Creative',
    icon: '📢',
    description: 'Design ads for Reddit, LinkedIn, Meta',
    available: true,
    color: '#3b82f6' // Blue
  },
  {
    id: 'social',
    label: 'Social Post',
    icon: '📱',
    description: 'Create posts for LinkedIn, Twitter, Instagram',
    available: true,
    color: '#8b5cf6' // Purple
  }
];

function UnityStudioCanvas({ onExportToMAP, onClose, onSaveToCanvas, isDarkTheme = false, initialContext = null }) {
  // User selects asset type manually - don't auto-select even with AI context
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  // State for loading assets from recent list
  const [loadedContent, setLoadedContent] = useState(null);
  const [savedAssets, setSavedAssets] = useState(() => {
    try {
      const stored = localStorage.getItem('unity-studio-assets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleSelectAssetType = (assetType) => {
    if (assetType.available) {
      setSelectedAssetType(assetType.id);
    }
  };

  const handleBack = () => {
    setSelectedAssetType(null);
  };

  const handleSaveAsset = useCallback((asset) => {
    const newAsset = {
      ...asset,
      id: `asset-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [...savedAssets, newAsset];
    setSavedAssets(updated);
    localStorage.setItem('unity-studio-assets', JSON.stringify(updated));
    return newAsset;
  }, [savedAssets]);

  const handleExportToMAP = useCallback((asset) => {
    if (onExportToMAP) {
      onExportToMAP(asset);
    }
  }, [onExportToMAP]);

  // Handle save to canvas (creates a note card with the template including HTML)
  const handleSaveToCanvas = useCallback((asset) => {
    if (onSaveToCanvas) {
      // Include HTML code block for easy copying to MAP email nodes
      const htmlBlock = asset.html ? `\n\n---\n\n**HTML Code:**\n\`\`\`html\n${asset.html}\n\`\`\`` : '';

      onSaveToCanvas({
        type: 'textNode',
        data: {
          title: asset.name || 'Email Template',
          content: `**Subject:** ${asset.sections?.subject || ''}\n\n${asset.sections?.body || ''}${htmlBlock}`,
          cardType: 'note',
          sourceType: 'studio',
          sourceAsset: asset,
          // Also store raw HTML for programmatic access
          html: asset.html || ''
        }
      });
    }
  }, [onSaveToCanvas]);

  // Render asset-specific builder
  if (selectedAssetType === 'campaign') {
    return (
      <StudioModalContainer onClose={onClose} isDarkTheme={isDarkTheme} hasUnsavedChanges={true}>
        <CampaignQuickstart
          onBack={() => {
            handleBack();
            setLoadedContent(null);
          }}
          onSave={handleSaveAsset}
          onSaveToCanvas={handleSaveToCanvas}
          isDarkTheme={isDarkTheme}
          aiContext={initialContext}
        />
      </StudioModalContainer>
    );
  }

  if (selectedAssetType === 'email') {
    return (
      <StudioModalContainer onClose={onClose} isDarkTheme={isDarkTheme} hasUnsavedChanges={true}>
        <EmailTemplateBuilder
          onBack={() => {
            handleBack();
            setLoadedContent(null);
          }}
          onSave={handleSaveAsset}
          onSaveToCanvas={handleSaveToCanvas}
          onExportToMAP={handleExportToMAP}
          isDarkTheme={isDarkTheme}
          initialContent={loadedContent || null}
          aiContext={initialContext}
        />
      </StudioModalContainer>
    );
  }

  if (selectedAssetType === 'ad') {
    return (
      <StudioModalContainer onClose={onClose} isDarkTheme={isDarkTheme} hasUnsavedChanges={true}>
        <AdCreativeBuilder
          onBack={() => {
            handleBack();
            setLoadedContent(null); // Clear loaded content when going back
          }}
          onSave={handleSaveAsset}
          onSaveToCanvas={handleSaveToCanvas}
          isDarkTheme={isDarkTheme}
          initialContent={loadedContent || initialContext?.content || null}
          aiContext={initialContext}
        />
      </StudioModalContainer>
    );
  }

  if (selectedAssetType === 'social') {
    return (
      <StudioModalContainer onClose={onClose} isDarkTheme={isDarkTheme} hasUnsavedChanges={true}>
        <SocialPostBuilder
          onBack={() => {
            handleBack();
            setLoadedContent(null);
          }}
          onSave={handleSaveAsset}
          onSaveToCanvas={handleSaveToCanvas}
          isDarkTheme={isDarkTheme}
          initialContent={loadedContent || null}
          aiContext={initialContext}
        />
      </StudioModalContainer>
    );
  }

  // Default: Asset type selector
  return (
    <StudioModalContainer onClose={onClose} isDarkTheme={isDarkTheme}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '40px',
          overflowY: 'auto'
        }}
      >
      {/* AI Context Banner - shows when launched from AI Chat */}
      {initialContext?.type === 'ai-conversation' && (
        <div style={{
          marginBottom: '24px',
          padding: '12px 20px',
          backgroundColor: isDarkTheme ? '#1e3a5f' : '#eff6ff',
          border: `1px solid ${isDarkTheme ? '#3b82f6' : '#bfdbfe'}`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '500px'
        }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: isDarkTheme ? '#93c5fd' : '#1d4ed8'
            }}>
              AI Conversation Context Available
            </div>
            <div style={{
              fontSize: '11px',
              color: isDarkTheme ? '#93c5fd' : '#3b82f6',
              opacity: 0.8
            }}>
              Your chat history will be available as reference when creating templates
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: isDarkTheme ? '#f9fafb' : '#111827',
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}
        >
          UnitySTUDIO
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: isDarkTheme ? '#9ca3af' : '#6b7280',
            maxWidth: '400px'
          }}
        >
          Create marketing assets for your GTM campaigns
        </p>
      </div>

      {/* Asset Type Cards */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '800px'
        }}
      >
        {ASSET_TYPES.map((assetType) => (
          <button
            key={assetType.id}
            onClick={() => handleSelectAssetType(assetType)}
            disabled={!assetType.available}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: assetType.featured ? '36px 44px' : '32px 40px',
              backgroundColor: assetType.featured
                ? (isDarkTheme ? '#292524' : '#fffbeb')
                : (isDarkTheme ? '#1f2937' : '#ffffff'),
              border: `2px solid ${assetType.available ? assetType.color : (isDarkTheme ? '#374151' : '#e5e7eb')}`,
              borderRadius: '16px',
              cursor: assetType.available ? 'pointer' : 'not-allowed',
              opacity: assetType.available ? 1 : 0.5,
              transition: 'all 0.2s ease',
              minWidth: '200px',
              boxShadow: assetType.featured
                ? '0 6px 20px rgba(251, 191, 36, 0.25)'
                : (assetType.available ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'),
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (assetType.available) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = assetType.featured
                  ? '0 12px 32px rgba(251, 191, 36, 0.35)'
                  : '0 8px 24px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = assetType.featured
                ? '0 6px 20px rgba(251, 191, 36, 0.25)'
                : (assetType.available ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none');
            }}
          >
            {assetType.featured && (
              <span
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  backgroundColor: '#FBBF24',
                  color: '#000',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                NEW
              </span>
            )}
            <span style={{ fontSize: assetType.featured ? '56px' : '48px', marginBottom: '16px' }}>
              {assetType.icon}
            </span>
            <span
              style={{
                fontSize: assetType.featured ? '18px' : '16px',
                fontWeight: '700',
                color: isDarkTheme ? '#f9fafb' : '#111827',
                marginBottom: '8px'
              }}
            >
              {assetType.label}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                textAlign: 'center',
                maxWidth: '160px'
              }}
            >
              {assetType.description}
            </span>
            {!assetType.available && (
              <span
                style={{
                  marginTop: '12px',
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isDarkTheme ? '#6b7280' : '#9ca3af',
                  backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                  padding: '4px 12px',
                  borderRadius: '4px'
                }}
              >
                Coming Soon
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Saved Assets Preview */}
      {savedAssets.length > 0 && (
        <div
          style={{
            marginTop: '48px',
            width: '100%',
            maxWidth: '800px'
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '16px'
            }}
          >
            Recent Assets ({savedAssets.length})
          </h3>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '8px'
            }}
          >
            {savedAssets.slice(-5).reverse().map((asset) => (
              <button
                key={asset.id}
                onClick={() => {
                  // Load asset into appropriate editor based on type
                  const content = asset.content || { name: asset.name };
                  setLoadedContent(content);
                  if (asset.type === 'ad' || asset.type === 'ad-creative') {
                    setSelectedAssetType('ad');
                  } else if (asset.type === 'social') {
                    setSelectedAssetType('social');
                  } else if (asset.type === 'email') {
                    setSelectedAssetType('email');
                  }
                }}
                style={{
                  padding: '16px',
                  backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  minWidth: '180px',
                  flexShrink: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FBBF24';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDarkTheme ? '#374151' : '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: isDarkTheme ? '#f9fafb' : '#111827',
                    marginBottom: '4px'
                  }}
                >
                  {asset.name || 'Untitled'}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: isDarkTheme ? '#6b7280' : '#9ca3af'
                  }}
                >
                  {asset.type} • {new Date(asset.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </StudioModalContainer>
  );
}

export default UnityStudioCanvas;
