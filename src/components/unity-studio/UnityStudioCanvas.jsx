import React, { useState, useCallback } from 'react';
import EmailTemplateBuilder from './EmailTemplateBuilder';

/**
 * UnityStudioCanvas - Main container for STUDIO mode
 *
 * Asset creation suite for GTM campaigns:
 * - Email templates
 * - Ad creatives
 * - Social posts
 */

const ASSET_TYPES = [
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
    description: 'Design ads for Reddit, LinkedIn, Instagram',
    available: false, // Coming soon
    color: '#3b82f6' // Blue
  },
  {
    id: 'social',
    label: 'Social Post',
    icon: '📱',
    description: 'Create posts for LinkedIn, Twitter, Instagram',
    available: false, // Coming soon
    color: '#8b5cf6' // Purple
  }
];

function UnityStudioCanvas({ onExportToMAP, onClose, onSaveToCanvas, isDarkTheme = false, initialContext = null }) {
  // User selects asset type manually - don't auto-select even with AI context
  const [selectedAssetType, setSelectedAssetType] = useState(null);
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

  // Handle save to canvas (creates a note card with the template)
  const handleSaveToCanvas = useCallback((asset) => {
    if (onSaveToCanvas) {
      onSaveToCanvas({
        type: 'textNode',
        data: {
          title: asset.name || 'Email Template',
          content: `**Subject:** ${asset.sections?.subject || ''}\n\n${asset.sections?.body || ''}`,
          cardType: 'note',
          sourceType: 'studio',
          sourceAsset: asset
        }
      });
    }
  }, [onSaveToCanvas]);

  // Wrapper component for responsive modal container
  // Uses onMouseDown instead of onClick to prevent accidental closes during drag/selection
  const ModalContainer = ({ children }) => {
    const handleBackdropMouseDown = (e) => {
      // Only close if mousedown is directly on the backdrop (not bubbled from children)
      if (e.target === e.currentTarget && onClose) {
        onClose();
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
              onClose && onClose();
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

  // Render asset-specific builder
  if (selectedAssetType === 'email') {
    return (
      <ModalContainer>
        <EmailTemplateBuilder
          onBack={handleBack}
          onSave={handleSaveAsset}
          onSaveToCanvas={handleSaveToCanvas}
          onExportToMAP={handleExportToMAP}
          isDarkTheme={isDarkTheme}
          aiContext={initialContext}
        />
      </ModalContainer>
    );
  }

  // Default: Asset type selector
  return (
    <ModalContainer>
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
              padding: '32px 40px',
              backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
              border: `2px solid ${assetType.available ? assetType.color : (isDarkTheme ? '#374151' : '#e5e7eb')}`,
              borderRadius: '16px',
              cursor: assetType.available ? 'pointer' : 'not-allowed',
              opacity: assetType.available ? 1 : 0.5,
              transition: 'all 0.2s ease',
              minWidth: '200px',
              boxShadow: assetType.available
                ? '0 4px 12px rgba(0, 0, 0, 0.1)'
                : 'none'
            }}
            onMouseEnter={(e) => {
              if (assetType.available) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = assetType.available
                ? '0 4px 12px rgba(0, 0, 0, 0.1)'
                : 'none';
            }}
          >
            <span style={{ fontSize: '48px', marginBottom: '16px' }}>
              {assetType.icon}
            </span>
            <span
              style={{
                fontSize: '16px',
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
              <div
                key={asset.id}
                style={{
                  padding: '16px',
                  backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                  border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  minWidth: '180px',
                  flexShrink: 0
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
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </ModalContainer>
  );
}

export default UnityStudioCanvas;
