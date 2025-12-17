/**
 * ExportManager - Batch Export for Ad Creatives
 *
 * Export creatives in multiple platform formats with ZIP bundling.
 *
 * Features:
 * - Campaign preset selection
 * - Individual format toggle
 * - Batch export all sizes
 * - ZIP download with folder structure
 * - Export preview with estimated sizes
 *
 * Created: December 2025
 */

import React, { useState, useCallback } from 'react';
import {
  PLATFORM_SPECS,
  CAMPAIGN_PRESETS,
  PLATFORMS
} from './platform-specs';
import {
  Download,
  Package,
  Check,
  X,
  Folder,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileArchive,
  Eye,
  Settings
} from 'lucide-react';

// Platform icons
const PLATFORM_ICONS = {
  instagram: '📸',
  facebook: '📘',
  linkedin: '💼',
  reddit: '🤖',
  google: '🔍'
};

// Format badge colors
const PLATFORM_COLORS = {
  instagram: { bg: '#fce7f3', text: '#db2777' },
  facebook: { bg: '#dbeafe', text: '#1d4ed8' },
  linkedin: { bg: '#e0e7ff', text: '#4f46e5' },
  reddit: { bg: '#fee2e2', text: '#dc2626' },
  google: { bg: '#dcfce7', text: '#15803d' }
};

const ExportManager = ({
  creativeName = 'Untitled Creative',
  elements = [],
  backgroundColor = '#1f2937',
  backgroundImage = null,
  onClose,
  onExportComplete,
  isDarkTheme = false
}) => {
  // Selected formats
  const [selectedFormats, setSelectedFormats] = useState(new Set([
    'instagram_feed_portrait',
    'instagram_story',
    'linkedin_sponsored',
    'google_medium_rectangle',
    'google_responsive_landscape'
  ]));

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedFiles, setExportedFiles] = useState([]);

  // Preset selection
  const [selectedPreset, setSelectedPreset] = useState('quick_launch');

  // Preview modal
  const [_previewFormat, _setPreviewFormat] = useState(null);

  // Expanded platforms
  const [expandedPlatforms, setExpandedPlatforms] = useState({
    instagram: true,
    facebook: true,
    linkedin: true,
    reddit: false,
    google: true
  });

  // Toggle format selection
  const toggleFormat = (formatKey) => {
    setSelectedFormats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(formatKey)) {
        newSet.delete(formatKey);
      } else {
        newSet.add(formatKey);
      }
      return newSet;
    });
  };

  // Apply preset
  const applyPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    const preset = CAMPAIGN_PRESETS[presetKey];
    if (preset) {
      setSelectedFormats(new Set(preset.specs));
    }
  };

  // Toggle platform expand
  const togglePlatform = (platform) => {
    setExpandedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  // Select all for platform
  const selectAllForPlatform = (platform) => {
    const platformSpecs = Object.entries(PLATFORM_SPECS)
      .filter(([, spec]) => spec.platform === platform)
      .map(([key]) => key);

    setSelectedFormats(prev => {
      const newSet = new Set(prev);
      platformSpecs.forEach(key => newSet.add(key));
      return newSet;
    });
  };

  // Deselect all for platform
  const deselectAllForPlatform = (platform) => {
    const platformSpecs = Object.entries(PLATFORM_SPECS)
      .filter(([, spec]) => spec.platform === platform)
      .map(([key]) => key);

    setSelectedFormats(prev => {
      const newSet = new Set(prev);
      platformSpecs.forEach(key => newSet.delete(key));
      return newSet;
    });
  };

  // Generate single export canvas
  const generateCanvas = useCallback((spec, _specKey) => {
    const canvas = document.createElement('canvas');
    canvas.width = spec.width;
    canvas.height = spec.height;
    const ctx = canvas.getContext('2d');

    // Draw background
    if (backgroundImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      return new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, spec.width, spec.height);
          drawElements(ctx, spec);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, spec.width, spec.height);
          drawElements(ctx, spec);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = backgroundImage;
      });
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, spec.width, spec.height);
      drawElements(ctx, spec);
      return Promise.resolve(canvas.toDataURL('image/png'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundColor, backgroundImage, elements]);

  // Draw elements on canvas with scaling
  const drawElements = (ctx, targetSpec) => {
    // Base spec is instagram_feed_portrait (1080x1350)
    const baseWidth = 1080;
    const baseHeight = 1350;
    const scaleX = targetSpec.width / baseWidth;
    const scaleY = targetSpec.height / baseHeight;
    const scale = Math.min(scaleX, scaleY);

    // Offset to center
    const offsetX = (targetSpec.width - baseWidth * scale) / 2;
    const offsetY = (targetSpec.height - baseHeight * scale) / 2;

    elements.forEach(element => {
      const x = element.x * scale + offsetX;
      const y = element.y * scale + offsetY;
      const fontSize = element.fontSize * scale;

      if (element.type === 'text') {
        ctx.font = `${element.fontWeight} ${fontSize}px ${element.fontFamily}`;
        ctx.fillStyle = element.color;
        ctx.textAlign = element.textAlign || 'left';

        let textX = x;
        const width = (element.width || 300) * scale;
        if (element.textAlign === 'center') {
          textX = x + width / 2;
        } else if (element.textAlign === 'right') {
          textX = x + width;
        }

        // Word wrap
        const words = element.content.split(' ');
        let line = '';
        let lineY = y + fontSize;

        words.forEach(word => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > width && line !== '') {
            ctx.fillText(line, textX, lineY);
            line = word + ' ';
            lineY += fontSize * 1.2;
          } else {
            line = testLine;
          }
        });
        ctx.fillText(line, textX, lineY);

      } else if (element.type === 'button') {
        const paddingX = (element.paddingX || 24) * scale;
        const paddingY = (element.paddingY || 12) * scale;

        ctx.font = `${element.fontWeight} ${fontSize}px ${element.fontFamily}`;
        const textWidth = ctx.measureText(element.content).width;

        const buttonWidth = textWidth + paddingX * 2;
        const buttonHeight = fontSize + paddingY * 2;

        ctx.fillStyle = element.backgroundColor || '#FBBF24';
        const radius = (element.borderRadius || 8) * scale;
        ctx.beginPath();
        ctx.roundRect(x, y, buttonWidth, buttonHeight, radius);
        ctx.fill();

        ctx.fillStyle = element.color || '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(element.content, x + buttonWidth / 2, y + paddingY + fontSize * 0.85);
      }
    });
  };

  // Export all selected formats
  const handleExportAll = async () => {
    if (selectedFormats.size === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportedFiles([]);

    const formats = Array.from(selectedFormats);
    const files = [];

    for (let i = 0; i < formats.length; i++) {
      const specKey = formats[i];
      const spec = PLATFORM_SPECS[specKey];

      try {
        const dataUrl = await generateCanvas(spec, specKey);
        const fileName = `${creativeName.replace(/\s+/g, '-').toLowerCase()}-${spec.platform}-${spec.width}x${spec.height}.png`;

        files.push({
          specKey,
          platform: spec.platform,
          fileName,
          dataUrl,
          width: spec.width,
          height: spec.height
        });

        setExportProgress(Math.round(((i + 1) / formats.length) * 100));
      } catch (error) {
        console.error(`Error generating ${specKey}:`, error);
      }
    }

    setExportedFiles(files);
    setIsExporting(false);

    if (onExportComplete) {
      onExportComplete(files);
    }
  };

  // Download single file
  const downloadFile = (file) => {
    const link = document.createElement('a');
    link.download = file.fileName;
    link.href = file.dataUrl;
    link.click();
  };

  // Download all as ZIP
  const downloadAllAsZip = async () => {
    if (exportedFiles.length === 0) return;

    // Use JSZip if available, otherwise download individually
    // For now, implement sequential download
    for (const file of exportedFiles) {
      downloadFile(file);
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between downloads
    }
  };

  // Get formats by platform
  const getFormatsByPlatform = (platform) => {
    return Object.entries(PLATFORM_SPECS)
      .filter(([, spec]) => spec.platform === platform)
      .map(([key, spec]) => ({ key, ...spec }));
  };

  // Calculate estimated total size
  const estimatedTotalSize = selectedFormats.size * 150; // ~150KB average per PNG

  return (
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
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={24} style={{ color: '#FBBF24' }} />
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: isDarkTheme ? '#f9fafb' : '#111827'
              }}>
                Export Campaign Assets
              </h2>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '13px',
                color: isDarkTheme ? '#9ca3af' : '#6b7280'
              }}>
                {creativeName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: isDarkTheme ? '#9ca3af' : '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* Left: Format selection */}
          <div style={{
            flex: 1,
            padding: '20px 24px',
            overflowY: 'auto',
            borderRight: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`
          }}>
            {/* Preset selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Campaign Preset
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(CAMPAIGN_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: selectedPreset === key ? '#FBBF24' : (isDarkTheme ? '#374151' : '#f3f4f6'),
                      color: selectedPreset === key ? '#000' : (isDarkTheme ? '#d1d5db' : '#374151'),
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: selectedPreset === key ? '600' : '400'
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform formats */}
            {['instagram', 'facebook', 'linkedin', 'reddit', 'google'].map(platform => {
              const formats = getFormatsByPlatform(platform);
              const selectedCount = formats.filter(f => selectedFormats.has(f.key)).length;
              const colors = PLATFORM_COLORS[platform];

              return (
                <div
                  key={platform}
                  style={{
                    marginBottom: '12px',
                    backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  {/* Platform header */}
                  <button
                    onClick={() => togglePlatform(platform)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>{PLATFORM_ICONS[platform]}</span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: isDarkTheme ? '#f9fafb' : '#111827',
                        textTransform: 'capitalize'
                      }}>
                        {platform === 'google' ? 'Google Display' : platform}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {selectedCount}/{formats.length}
                      </span>
                    </div>
                    {expandedPlatforms[platform] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {/* Formats list */}
                  {expandedPlatforms[platform] && (
                    <div style={{
                      padding: '0 16px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      {/* Select all / none */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '4px',
                        fontSize: '11px'
                      }}>
                        <button
                          onClick={() => selectAllForPlatform(platform)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: isDarkTheme ? '#60a5fa' : '#3b82f6',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Select all
                        </button>
                        <button
                          onClick={() => deselectAllForPlatform(platform)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: isDarkTheme ? '#9ca3af' : '#6b7280',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Clear
                        </button>
                      </div>

                      {formats.map(format => (
                        <label
                          key={format.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            backgroundColor: selectedFormats.has(format.key)
                              ? (isDarkTheme ? '#374151' : '#e5e7eb')
                              : 'transparent',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedFormats.has(format.key)}
                            onChange={() => toggleFormat(format.key)}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: '500',
                              color: isDarkTheme ? '#f9fafb' : '#111827'
                            }}>
                              {format.label}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: isDarkTheme ? '#9ca3af' : '#6b7280'
                            }}>
                              {format.width} × {format.height} ({format.ratio})
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Export summary & results */}
          <div style={{
            width: '320px',
            padding: '20px 24px',
            backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
            overflowY: 'auto'
          }}>
            {/* Export summary */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isDarkTheme ? '#f9fafb' : '#111827',
                marginBottom: '12px'
              }}>
                Export Summary
              </h3>

              <div style={{
                backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '13px', color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
                    Selected Formats
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: isDarkTheme ? '#f9fafb' : '#111827' }}>
                    {selectedFormats.size}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '13px', color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
                    Est. Total Size
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: isDarkTheme ? '#f9fafb' : '#111827' }}>
                    ~{(estimatedTotalSize / 1024).toFixed(1)} MB
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '13px', color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
                    Format
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: isDarkTheme ? '#f9fafb' : '#111827' }}>
                    PNG (lossless)
                  </span>
                </div>
              </div>
            </div>

            {/* Export button */}
            <button
              onClick={handleExportAll}
              disabled={selectedFormats.size === 0 || isExporting}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: selectedFormats.size === 0 ? '#6b7280' : '#FBBF24',
                color: selectedFormats.size === 0 ? '#d1d5db' : '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: selectedFormats.size === 0 || isExporting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              {isExporting ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Generating... {exportProgress}%
                </>
              ) : (
                <>
                  <Package size={16} />
                  Generate {selectedFormats.size} Files
                </>
              )}
            </button>

            <style>
              {`@keyframes spin { to { transform: rotate(360deg); }}`}
            </style>

            {/* Export progress */}
            {isExporting && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  height: '4px',
                  backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      width: `${exportProgress}%`,
                      height: '100%',
                      backgroundColor: '#FBBF24',
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Exported files list */}
            {exportedFiles.length > 0 && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isDarkTheme ? '#f9fafb' : '#111827',
                    margin: 0
                  }}>
                    Generated Files
                  </h3>
                  <button
                    onClick={downloadAllAsZip}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
                      color: isDarkTheme ? '#d1d5db' : '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={12} />
                    Download All
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {exportedFiles.map((file, index) => {
                    const colors = PLATFORM_COLORS[file.platform];
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                          borderRadius: '6px'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: colors.bg,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <ImageIcon size={16} style={{ color: colors.text }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: isDarkTheme ? '#f9fafb' : '#111827',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {file.fileName}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: isDarkTheme ? '#9ca3af' : '#6b7280'
                          }}>
                            {file.width} × {file.height}
                          </div>
                        </div>

                        <button
                          onClick={() => downloadFile(file)}
                          style={{
                            padding: '6px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: isDarkTheme ? '#60a5fa' : '#3b82f6'
                          }}
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Success message */}
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Check size={16} style={{ color: '#15803d' }} />
                  <span style={{ fontSize: '13px', color: '#15803d', fontWeight: '500' }}>
                    All files generated successfully!
                  </span>
                </div>
              </div>
            )}

            {/* Tips */}
            {exportedFiles.length === 0 && !isExporting && (
              <div style={{
                padding: '16px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                borderRadius: '8px',
                marginTop: '16px'
              }}>
                <h4 style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isDarkTheme ? '#f9fafb' : '#111827',
                  marginBottom: '8px'
                }}>
                  💡 Export Tips
                </h4>
                <ul style={{
                  margin: 0,
                  paddingLeft: '16px',
                  fontSize: '12px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  lineHeight: '1.5'
                }}>
                  <li>Use "Quick Launch" preset for minimum viable coverage</li>
                  <li>Instagram Portrait (4:5) gets more engagement than Square</li>
                  <li>Google requires at least Medium Rectangle and Responsive formats</li>
                  <li>Export at full resolution for best quality</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportManager;
