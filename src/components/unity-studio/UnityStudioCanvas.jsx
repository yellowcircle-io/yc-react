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

function UnityStudioCanvas({ onExportToMAP, isDarkTheme = false }) {
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

  // Render asset-specific builder
  if (selectedAssetType === 'email') {
    return (
      <EmailTemplateBuilder
        onBack={handleBack}
        onSave={handleSaveAsset}
        onExportToMAP={handleExportToMAP}
        isDarkTheme={isDarkTheme}
      />
    );
  }

  // Default: Asset type selector
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px',
        backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
        minHeight: '60vh'
      }}
    >
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
  );
}

export default UnityStudioCanvas;
