import React, { useState, useCallback } from 'react';
import { CAMPAIGN_PRESETS, PLATFORM_SPECS, TEXT_LIMITS, PLATFORMS } from './platform-specs';
import { useAIGeneration } from './useAIGeneration';
import CreativeCanvas from './CreativeCanvas';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
  Copy,
  Download,
  Edit3,
  Eye,
  Zap,
  Target,
  Users,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  Image as ImageIcon,
  FileDown
} from 'lucide-react';

/**
 * CampaignQuickstart - Omnichannel Campaign Generator
 *
 * Generate content for multiple platforms at once from a single brief.
 * Uses AI to create platform-optimized copy and visual templates.
 *
 * Features:
 * - Campaign presets (Social Awareness, LinkedIn B2B, etc.)
 * - AI-powered content generation for all platforms
 * - Platform-specific text limits and optimization
 * - Preview and edit each platform's content
 * - Batch export to individual builders
 */

// Campaign goals with descriptions
const CAMPAIGN_GOALS = [
  {
    id: 'awareness',
    name: 'Brand Awareness',
    icon: '🎯',
    description: 'Introduce your brand to new audiences',
    tone: 'friendly, memorable, approachable'
  },
  {
    id: 'leadgen',
    name: 'Lead Generation',
    icon: '📧',
    description: 'Capture leads and grow your list',
    tone: 'value-focused, compelling, trustworthy'
  },
  {
    id: 'conversion',
    name: 'Drive Conversions',
    icon: '🛒',
    description: 'Get immediate sales or sign-ups',
    tone: 'urgent, benefit-driven, persuasive'
  },
  {
    id: 'engagement',
    name: 'Boost Engagement',
    icon: '💬',
    description: 'Increase comments, shares, and interaction',
    tone: 'conversational, relatable, interactive'
  },
  {
    id: 'retargeting',
    name: 'Retargeting',
    icon: '🔄',
    description: 'Bring back interested visitors',
    tone: 'familiar, reminder-focused, personalized'
  }
];

// Platform icons/colors
const PLATFORM_ICONS = {
  instagram: { icon: '📸', color: '#E4405F', name: 'Instagram' },
  facebook: { icon: '📘', color: '#1877F2', name: 'Facebook' },
  linkedin: { icon: '💼', color: '#0A66C2', name: 'LinkedIn' },
  reddit: { icon: '🤖', color: '#FF4500', name: 'Reddit' },
  google: { icon: '🔍', color: '#4285F4', name: 'Google Display' }
};

/**
 * Generate a visual image from content using HTML Canvas
 * @param {Object} params - Generation parameters
 * @returns {Promise<string>} Data URL of generated image
 */
async function generateImageFromContent({
  content,
  spec,
  brandColor = '#FBBF24',
  backgroundColor = '#111827',
  textColor = '#ffffff'
}) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions from spec
    const width = spec?.width || 1080;
    const height = spec?.height || 1080;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Add subtle gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Calculate font sizes based on canvas size
    const baseFontSize = Math.min(width, height) / 20;
    const headlineFontSize = baseFontSize * 1.8;
    const bodyFontSize = baseFontSize * 0.9;
    const ctaFontSize = baseFontSize * 0.8;

    // Padding
    const padding = width * 0.08;
    const maxTextWidth = width - (padding * 2);

    // Draw headline
    ctx.fillStyle = textColor;
    ctx.font = `bold ${headlineFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.textBaseline = 'top';

    const headline = content.headline || 'Your Headline Here';
    const headlineLines = wrapText(ctx, headline, maxTextWidth);
    let yPos = height * 0.25;

    headlineLines.forEach(line => {
      ctx.fillText(line, padding, yPos);
      yPos += headlineFontSize * 1.3;
    });

    // Draw body text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `${bodyFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

    const body = content.body || 'Your message here';
    const bodyLines = wrapText(ctx, body, maxTextWidth);
    yPos += headlineFontSize * 0.5;

    bodyLines.slice(0, 5).forEach(line => { // Limit to 5 lines
      ctx.fillText(line, padding, yPos);
      yPos += bodyFontSize * 1.5;
    });

    // Draw CTA button
    const cta = content.cta || 'Learn More';
    ctx.font = `bold ${ctaFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    const ctaMetrics = ctx.measureText(cta);
    const ctaWidth = ctaMetrics.width + (padding * 0.8);
    const ctaHeight = ctaFontSize * 2.2;
    const ctaX = padding;
    const ctaY = height - padding - ctaHeight - (height * 0.05);

    // CTA background
    ctx.fillStyle = brandColor;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, 8);
    ctx.fill();

    // CTA text
    ctx.fillStyle = '#000000';
    ctx.fillText(cta, ctaX + (padding * 0.4), ctaY + (ctaHeight - ctaFontSize) / 2 + ctaFontSize * 0.15);

    // Brand accent line
    ctx.fillStyle = brandColor;
    ctx.fillRect(0, 0, width, 6);

    resolve(canvas.toDataURL('image/png'));
  });
}

/**
 * Wrap text to fit within a maximum width
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Download an image from data URL
 */
function downloadImage(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function CampaignQuickstart({ onBack, onSave, onSaveToCanvas: _onSaveToCanvas, isDarkTheme = false, aiContext = null }) {
  // Wizard step state
  const [step, setStep] = useState(1); // 1: Brief, 2: Platforms, 3: Generate, 4: Review

  // Brief state
  const [brief, setBrief] = useState({
    campaignName: '',
    brand: aiContext?.brand || '',
    product: aiContext?.product || aiContext?.summary || '',
    targetAudience: aiContext?.audience || '',
    uniqueValue: aiContext?.value || '',
    goal: aiContext?.campaignType || 'awareness',
    customTone: ''
  });

  // Platform selection
  const [selectedPreset, setSelectedPreset] = useState('quick_launch');
  const [customPlatforms, setCustomPlatforms] = useState([]);
  const [useCustomPlatforms, setUseCustomPlatforms] = useState(false);

  // Generated content
  const [generatedContent, setGeneratedContent] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Edit/preview state
  const [selectedPlatformEdit, setSelectedPlatformEdit] = useState(null);
  const [showCanvasPreview, setShowCanvasPreview] = useState(false);

  // Image export state
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [, setExportedImages] = useState({}); // Store generated image URLs

  // AI hook
  const { generateAdCopy, isGenerating: aiGenerating, error: _aiError, CAMPAIGN_TYPES } = useAIGeneration();

  // Get platforms for current selection
  const getSelectedPlatforms = useCallback(() => {
    if (useCustomPlatforms) {
      return customPlatforms;
    }
    const preset = CAMPAIGN_PRESETS[selectedPreset];
    return preset ? preset.specs : [];
  }, [useCustomPlatforms, customPlatforms, selectedPreset]);

  // Toggle custom platform
  const toggleCustomPlatform = (specKey) => {
    setCustomPlatforms(prev =>
      prev.includes(specKey)
        ? prev.filter(k => k !== specKey)
        : [...prev, specKey]
    );
  };

  // Generate content for all platforms
  const handleGenerateAll = async () => {
    const platforms = getSelectedPlatforms();
    if (platforms.length === 0) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    const newContent = {};

    // Group specs by platform to avoid duplicate API calls
    const platformGroups = {};
    platforms.forEach(specKey => {
      const spec = PLATFORM_SPECS[specKey];
      if (spec) {
        const platform = spec.platform;
        if (!platformGroups[platform]) {
          platformGroups[platform] = [];
        }
        platformGroups[platform].push({ specKey, spec });
      }
    });

    // Generate content for each unique platform
    const platformKeys = Object.keys(platformGroups);
    let completed = 0;

    for (const platform of platformKeys) {
      try {
        // Map platform names for API
        const apiPlatform = platform === 'instagram' || platform === 'facebook' ? 'facebook' : platform;

        const result = await generateAdCopy({
          platform: apiPlatform,
          campaignType: brief.goal,
          brand: brief.brand,
          product: brief.product,
          targetAudience: brief.targetAudience || 'general audience',
          uniqueValue: brief.uniqueValue || 'exceptional quality',
          tone: brief.customTone || null,
          variants: 1
        });

        if (result && result.variants && result.variants.length > 0) {
          const variant = result.variants[0];

          // Apply content to all specs for this platform
          platformGroups[platform].forEach(({ specKey, spec }) => {
            // Truncate text to platform limits
            const limits = TEXT_LIMITS[platform === 'instagram' || platform === 'facebook' ? 'facebook_feed' : platform] || {};

            newContent[specKey] = {
              headline: truncateText(variant.headline || '', limits.headline || limits.title || 100),
              body: truncateText(variant.body || '', limits.primary || limits.intro || limits.body || 300),
              cta: variant.cta || 'Learn More',
              spec: spec,
              platform: platform,
              generated: true
            };
          });
        }
      } catch (err) {
        console.error(`Error generating for ${platform}:`, err);
        // Add placeholder content on error
        platformGroups[platform].forEach(({ specKey, spec }) => {
          newContent[specKey] = {
            headline: `${brief.brand} - ${CAMPAIGN_GOALS.find(g => g.id === brief.goal)?.name || 'Campaign'}`,
            body: brief.product || 'Your message here',
            cta: 'Learn More',
            spec: spec,
            platform: platform,
            generated: false,
            error: err.message
          };
        });
      }

      completed++;
      setGenerationProgress(Math.round((completed / platformKeys.length) * 100));
    }

    setGeneratedContent(newContent);
    setIsGenerating(false);
    setStep(4); // Move to review step
  };

  // Truncate text to limit
  const truncateText = (text, limit) => {
    if (!limit || text.length <= limit) return text;
    return text.substring(0, limit - 3) + '...';
  };

  // Update content for a specific platform
  const updateContent = (specKey, field, value) => {
    setGeneratedContent(prev => ({
      ...prev,
      [specKey]: {
        ...prev[specKey],
        [field]: value
      }
    }));
  };

  // Regenerate single platform
  const regeneratePlatform = async (specKey) => {
    const spec = PLATFORM_SPECS[specKey];
    if (!spec) return;

    const apiPlatform = spec.platform === 'instagram' || spec.platform === 'facebook' ? 'facebook' : spec.platform;

    try {
      const result = await generateAdCopy({
        platform: apiPlatform,
        campaignType: brief.goal,
        brand: brief.brand,
        product: brief.product,
        targetAudience: brief.targetAudience || 'general audience',
        uniqueValue: brief.uniqueValue || 'exceptional quality',
        variants: 1
      });

      if (result && result.variants && result.variants.length > 0) {
        const variant = result.variants[0];
        const limits = TEXT_LIMITS[apiPlatform === 'facebook' ? 'facebook_feed' : apiPlatform] || {};

        updateContent(specKey, 'headline', truncateText(variant.headline || '', limits.headline || limits.title || 100));
        updateContent(specKey, 'body', truncateText(variant.body || '', limits.primary || limits.intro || 300));
        updateContent(specKey, 'cta', variant.cta || 'Learn More');
        updateContent(specKey, 'generated', true);
      }
    } catch (err) {
      console.error('Regeneration error:', err);
    }
  };

  // Copy content to clipboard
  const copyToClipboard = (specKey) => {
    const content = generatedContent[specKey];
    if (!content) return;

    const text = `[${content.spec?.label || specKey}]\n\nHeadline: ${content.headline}\n\nBody: ${content.body}\n\nCTA: ${content.cta}`;
    navigator.clipboard.writeText(text);
  };

  // Export campaign data
  const handleExportCampaign = () => {
    const exportData = {
      campaignName: brief.campaignName || 'Untitled Campaign',
      brief: brief,
      content: generatedContent,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brief.campaignName || 'campaign'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save campaign
  const handleSaveCampaign = () => {
    const asset = {
      type: 'campaign',
      name: brief.campaignName || 'Untitled Campaign',
      brief: brief,
      platforms: getSelectedPlatforms(),
      content: generatedContent,
      createdAt: new Date().toISOString()
    };
    onSave(asset);
  };

  // Download single image
  const handleDownloadImage = async (specKey) => {
    const content = generatedContent[specKey];
    if (!content) return;

    const platformInfo = PLATFORM_ICONS[content.platform];

    try {
      const imageUrl = await generateImageFromContent({
        content: {
          headline: content.headline,
          body: content.body,
          cta: content.cta
        },
        spec: content.spec,
        brandColor: platformInfo?.color || '#FBBF24',
        backgroundColor: '#111827',
        textColor: '#ffffff'
      });

      // Store the generated image
      setExportedImages(prev => ({ ...prev, [specKey]: imageUrl }));

      // Download it
      const filename = `${brief.campaignName || 'campaign'}-${content.spec?.label || specKey}-${content.spec?.width}x${content.spec?.height}.png`
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '-');
      downloadImage(imageUrl, filename);
    } catch (err) {
      console.error('Image generation error:', err);
    }
  };

  // Download all images as a batch
  const handleDownloadAllImages = async () => {
    const specKeys = Object.keys(generatedContent);
    if (specKeys.length === 0) return;

    setIsExportingImages(true);
    setExportProgress(0);

    const newExportedImages = {};
    let completed = 0;

    for (const specKey of specKeys) {
      const content = generatedContent[specKey];
      const platformInfo = PLATFORM_ICONS[content.platform];

      try {
        const imageUrl = await generateImageFromContent({
          content: {
            headline: content.headline,
            body: content.body,
            cta: content.cta
          },
          spec: content.spec,
          brandColor: platformInfo?.color || '#FBBF24',
          backgroundColor: '#111827',
          textColor: '#ffffff'
        });

        newExportedImages[specKey] = imageUrl;

        // Download each image with a slight delay to prevent browser blocking
        const filename = `${brief.campaignName || 'campaign'}-${content.spec?.label || specKey}-${content.spec?.width}x${content.spec?.height}.png`
          .toLowerCase()
          .replace(/[^a-z0-9.-]/g, '-');

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 200));
        downloadImage(imageUrl, filename);

      } catch (err) {
        console.error(`Error generating image for ${specKey}:`, err);
      }

      completed++;
      setExportProgress(Math.round((completed / specKeys.length) * 100));
    }

    setExportedImages(newExportedImages);
    setIsExportingImages(false);
  };

  // Render Step 1: Campaign Brief
  const renderBriefStep = () => (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '700',
        color: isDarkTheme ? '#f9fafb' : '#111827',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Zap size={24} style={{ color: '#FBBF24' }} />
        Campaign Quickstart
      </h2>
      <p style={{
        fontSize: '14px',
        color: isDarkTheme ? '#9ca3af' : '#6b7280',
        marginBottom: '32px'
      }}>
        Fill in your campaign brief and we&apos;ll generate content for all your platforms
      </p>

      {/* Campaign Name */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: isDarkTheme ? '#9ca3af' : '#6b7280',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Campaign Name
        </label>
        <input
          type="text"
          value={brief.campaignName}
          onChange={(e) => setBrief(prev => ({ ...prev, campaignName: e.target.value }))}
          placeholder="e.g. Q1 Product Launch"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
            color: isDarkTheme ? '#f9fafb' : '#111827',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Brand */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: isDarkTheme ? '#9ca3af' : '#6b7280',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Brand Name *
        </label>
        <input
          type="text"
          value={brief.brand}
          onChange={(e) => setBrief(prev => ({ ...prev, brand: e.target.value }))}
          placeholder="e.g. yellowCircle"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
            color: isDarkTheme ? '#f9fafb' : '#111827',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Product/Service */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: isDarkTheme ? '#9ca3af' : '#6b7280',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Product or Service *
        </label>
        <textarea
          value={brief.product}
          onChange={(e) => setBrief(prev => ({ ...prev, product: e.target.value }))}
          placeholder="What are you promoting? Describe your product or service..."
          rows={3}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
            color: isDarkTheme ? '#f9fafb' : '#111827',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Target Audience */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: isDarkTheme ? '#9ca3af' : '#6b7280',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Target Audience
        </label>
        <input
          type="text"
          value={brief.targetAudience}
          onChange={(e) => setBrief(prev => ({ ...prev, targetAudience: e.target.value }))}
          placeholder="e.g. Small business owners, 25-45, tech-savvy"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
            color: isDarkTheme ? '#f9fafb' : '#111827',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Unique Value */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: isDarkTheme ? '#9ca3af' : '#6b7280',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Unique Value Proposition
        </label>
        <input
          type="text"
          value={brief.uniqueValue}
          onChange={(e) => setBrief(prev => ({ ...prev, uniqueValue: e.target.value }))}
          placeholder="What makes you different from competitors?"
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
            color: isDarkTheme ? '#f9fafb' : '#111827',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Campaign Goal */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: isDarkTheme ? '#9ca3af' : '#6b7280',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <Target size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Campaign Goal
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CAMPAIGN_GOALS.map(goal => (
            <button
              key={goal.id}
              onClick={() => setBrief(prev => ({ ...prev, goal: goal.id }))}
              style={{
                padding: '10px 16px',
                backgroundColor: brief.goal === goal.id
                  ? '#FBBF24'
                  : (isDarkTheme ? '#374151' : '#f3f4f6'),
                color: brief.goal === goal.id
                  ? '#000'
                  : (isDarkTheme ? '#d1d5db' : '#374151'),
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <span>{goal.icon}</span>
              {goal.name}
            </button>
          ))}
        </div>
        {brief.goal && (
          <p style={{
            marginTop: '8px',
            fontSize: '12px',
            color: isDarkTheme ? '#9ca3af' : '#6b7280',
            fontStyle: 'italic'
          }}>
            {CAMPAIGN_GOALS.find(g => g.id === brief.goal)?.description}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: isDarkTheme ? '#9ca3af' : '#6b7280',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={() => setStep(2)}
          disabled={!brief.brand || !brief.product}
          style={{
            padding: '10px 24px',
            backgroundColor: brief.brand && brief.product ? '#FBBF24' : (isDarkTheme ? '#374151' : '#e5e7eb'),
            color: brief.brand && brief.product ? '#000' : (isDarkTheme ? '#6b7280' : '#9ca3af'),
            border: 'none',
            borderRadius: '8px',
            cursor: brief.brand && brief.product ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          Choose Platforms <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // Render Step 2: Platform Selection
  const renderPlatformStep = () => (
    <div style={{ padding: '24px', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '700',
        color: isDarkTheme ? '#f9fafb' : '#111827',
        marginBottom: '8px'
      }}>
        Select Platforms
      </h2>
      <p style={{
        fontSize: '14px',
        color: isDarkTheme ? '#9ca3af' : '#6b7280',
        marginBottom: '24px'
      }}>
        Choose a preset or select individual platforms for your campaign
      </p>

      {/* Preset Selection */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '12px',
          fontWeight: '600',
          color: isDarkTheme ? '#9ca3af' : '#6b7280',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Campaign Presets
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {Object.entries(CAMPAIGN_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedPreset(key);
                setUseCustomPlatforms(false);
              }}
              style={{
                padding: '16px',
                backgroundColor: !useCustomPlatforms && selectedPreset === key
                  ? (isDarkTheme ? '#1f2937' : '#fff')
                  : (isDarkTheme ? '#111827' : '#f9fafb'),
                border: `2px solid ${!useCustomPlatforms && selectedPreset === key ? '#FBBF24' : (isDarkTheme ? '#374151' : '#e5e7eb')}`,
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isDarkTheme ? '#f9fafb' : '#111827',
                marginBottom: '4px'
              }}>
                {preset.name}
              </div>
              <div style={{
                fontSize: '12px',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                marginBottom: '8px'
              }}>
                {preset.description}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {preset.specs.slice(0, 4).map(specKey => {
                  const spec = PLATFORM_SPECS[specKey];
                  const platformInfo = PLATFORM_ICONS[spec?.platform];
                  return platformInfo ? (
                    <span
                      key={specKey}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: `${platformInfo.color}20`,
                        color: platformInfo.color,
                        borderRadius: '4px'
                      }}
                    >
                      {platformInfo.icon}
                    </span>
                  ) : null;
                })}
                {preset.specs.length > 4 && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
                    color: isDarkTheme ? '#9ca3af' : '#6b7280',
                    borderRadius: '4px'
                  }}>
                    +{preset.specs.length - 4}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Selection Toggle */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setUseCustomPlatforms(!useCustomPlatforms)}
          style={{
            padding: '10px 16px',
            backgroundColor: useCustomPlatforms ? '#FBBF24' : 'transparent',
            color: useCustomPlatforms ? '#000' : (isDarkTheme ? '#9ca3af' : '#6b7280'),
            border: `1px solid ${useCustomPlatforms ? '#FBBF24' : (isDarkTheme ? '#374151' : '#e5e7eb')}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          {useCustomPlatforms ? '✓ Custom Selection' : '+ Custom Selection'}
        </button>
      </div>

      {/* Custom Platform Grid */}
      {useCustomPlatforms && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '12px',
            fontWeight: '600',
            color: isDarkTheme ? '#9ca3af' : '#6b7280',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Select Individual Formats
          </h3>

          {Object.entries(PLATFORM_ICONS).map(([platform, info]) => {
            const specs = Object.entries(PLATFORM_SPECS).filter(([, spec]) => spec.platform === platform);
            return (
              <div key={platform} style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: info.color,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {info.icon} {info.name}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {specs.map(([key, spec]) => (
                    <button
                      key={key}
                      onClick={() => toggleCustomPlatform(key)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: customPlatforms.includes(key)
                          ? `${info.color}20`
                          : (isDarkTheme ? '#1f2937' : '#fff'),
                        border: `1px solid ${customPlatforms.includes(key) ? info.color : (isDarkTheme ? '#374151' : '#e5e7eb')}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        color: customPlatforms.includes(key) ? info.color : (isDarkTheme ? '#d1d5db' : '#374151')
                      }}
                    >
                      {customPlatforms.includes(key) && <Check size={10} style={{ marginRight: '4px' }} />}
                      {spec.label.replace(`${info.name} `, '')}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Summary */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: isDarkTheme ? '#1f2937' : '#f9fafb',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: isDarkTheme ? '#9ca3af' : '#6b7280',
          marginBottom: '4px'
        }}>
          Selected: {getSelectedPlatforms().length} format(s)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {getSelectedPlatforms().slice(0, 8).map(specKey => {
            const spec = PLATFORM_SPECS[specKey];
            return (
              <span
                key={specKey}
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
                  color: isDarkTheme ? '#d1d5db' : '#374151',
                  borderRadius: '4px'
                }}
              >
                {spec?.label || specKey}
              </span>
            );
          })}
          {getSelectedPlatforms().length > 8 && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              backgroundColor: '#FBBF24',
              color: '#000',
              borderRadius: '4px'
            }}>
              +{getSelectedPlatforms().length - 8} more
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={() => setStep(1)}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: isDarkTheme ? '#9ca3af' : '#6b7280',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={handleGenerateAll}
          disabled={getSelectedPlatforms().length === 0}
          style={{
            padding: '10px 24px',
            backgroundColor: getSelectedPlatforms().length > 0 ? '#FBBF24' : (isDarkTheme ? '#374151' : '#e5e7eb'),
            color: getSelectedPlatforms().length > 0 ? '#000' : (isDarkTheme ? '#6b7280' : '#9ca3af'),
            border: 'none',
            borderRadius: '8px',
            cursor: getSelectedPlatforms().length > 0 ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={16} /> Generate Content
        </button>
      </div>
    </div>
  );

  // Render Step 3: Generating
  const renderGeneratingStep = () => (
    <div style={{
      padding: '48px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <Loader2
        size={48}
        style={{
          color: '#FBBF24',
          animation: 'spin 1s linear infinite',
          marginBottom: '24px'
        }}
      />
      <h2 style={{
        fontSize: '24px',
        fontWeight: '700',
        color: isDarkTheme ? '#f9fafb' : '#111827',
        marginBottom: '8px'
      }}>
        Generating Your Campaign
      </h2>
      <p style={{
        fontSize: '14px',
        color: isDarkTheme ? '#9ca3af' : '#6b7280',
        marginBottom: '24px'
      }}>
        Creating optimized content for {getSelectedPlatforms().length} formats...
      </p>

      {/* Progress Bar */}
      <div style={{
        width: '300px',
        height: '8px',
        backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${generationProgress}%`,
          height: '100%',
          backgroundColor: '#FBBF24',
          transition: 'width 0.3s ease'
        }} />
      </div>
      <span style={{
        marginTop: '8px',
        fontSize: '12px',
        color: isDarkTheme ? '#9ca3af' : '#6b7280'
      }}>
        {generationProgress}% complete
      </span>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  // Render Step 4: Review & Edit
  const renderReviewStep = () => (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: isDarkTheme ? '#f9fafb' : '#111827',
            marginBottom: '4px'
          }}>
            {brief.campaignName || 'Your Campaign'} ✨
          </h2>
          <p style={{
            fontSize: '14px',
            color: isDarkTheme ? '#9ca3af' : '#6b7280'
          }}>
            {Object.keys(generatedContent).length} formats generated • Click to edit
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Export progress indicator */}
          {isExportingImages && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: isDarkTheme ? '#1f2937' : '#f3f4f6',
              borderRadius: '6px'
            }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '12px', color: isDarkTheme ? '#9ca3af' : '#6b7280' }}>
                Exporting... {exportProgress}%
              </span>
            </div>
          )}
          <button
            onClick={handleDownloadAllImages}
            disabled={isExportingImages}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isExportingImages ? 'wait' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isExportingImages ? 0.7 : 1
            }}
          >
            <ImageIcon size={14} /> Download All Images
          </button>
          <button
            onClick={handleExportCampaign}
            style={{
              padding: '8px 16px',
              backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
              color: isDarkTheme ? '#d1d5db' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileDown size={14} /> Export JSON
          </button>
          <button
            onClick={handleSaveCampaign}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FBBF24',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={14} /> Save Campaign
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {Object.entries(generatedContent).map(([specKey, content]) => {
          const platformInfo = PLATFORM_ICONS[content.platform];
          return (
            <div
              key={specKey}
              style={{
                backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
                border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              {/* Platform Header */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: `${platformInfo?.color || '#666'}20`,
                borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{platformInfo?.icon || '📄'}</span>
                  <div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: isDarkTheme ? '#f9fafb' : '#111827'
                    }}>
                      {content.spec?.label || specKey}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: isDarkTheme ? '#9ca3af' : '#6b7280'
                    }}>
                      {content.spec?.width}×{content.spec?.height}px
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => regeneratePlatform(specKey)}
                    disabled={aiGenerating}
                    title="Regenerate"
                    style={{
                      padding: '6px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: aiGenerating ? 'wait' : 'pointer',
                      color: isDarkTheme ? '#9ca3af' : '#6b7280',
                      borderRadius: '4px'
                    }}
                  >
                    <RefreshCw size={14} className={aiGenerating ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => copyToClipboard(specKey)}
                    title="Copy to clipboard"
                    style={{
                      padding: '6px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: isDarkTheme ? '#9ca3af' : '#6b7280',
                      borderRadius: '4px'
                    }}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '16px' }}>
                {/* Headline */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: isDarkTheme ? '#6b7280' : '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Headline
                  </label>
                  <input
                    type="text"
                    value={content.headline}
                    onChange={(e) => updateContent(specKey, 'headline', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
                      color: isDarkTheme ? '#f9fafb' : '#111827',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  />
                </div>

                {/* Body */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: isDarkTheme ? '#6b7280' : '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Body Copy
                  </label>
                  <textarea
                    value={content.body}
                    onChange={(e) => updateContent(specKey, 'body', e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
                      color: isDarkTheme ? '#f9fafb' : '#111827',
                      fontSize: '12px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* CTA */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: isDarkTheme ? '#6b7280' : '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    CTA Button
                  </label>
                  <input
                    type="text"
                    value={content.cta}
                    onChange={(e) => updateContent(specKey, 'cta', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '6px',
                      backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
                      color: isDarkTheme ? '#f9fafb' : '#111827',
                      fontSize: '12px'
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleDownloadImage(specKey)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <ImageIcon size={14} /> Download Image
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPlatformEdit(specKey);
                      setShowCanvasPreview(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: platformInfo?.color || '#666',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Edit3 size={14} /> Edit in Canvas
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`
      }}>
        <button
          onClick={() => setStep(2)}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: isDarkTheme ? '#9ca3af' : '#6b7280',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ChevronLeft size={16} /> Change Platforms
        </button>
        <button
          onClick={onBack}
          style={{
            padding: '10px 24px',
            backgroundColor: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Check size={16} /> Done
        </button>
      </div>

      {/* Canvas Preview Modal */}
      {showCanvasPreview && selectedPlatformEdit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200
        }}>
          <div style={{
            width: '90%',
            maxWidth: '1000px',
            height: '80vh',
            backgroundColor: isDarkTheme ? '#111827' : '#fff',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: isDarkTheme ? '#f9fafb' : '#111827'
              }}>
                {generatedContent[selectedPlatformEdit]?.spec?.label || 'Canvas Preview'}
              </div>
              <button
                onClick={() => {
                  setShowCanvasPreview(false);
                  setSelectedPlatformEdit(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isDarkTheme ? '#374151' : '#f3f4f6',
                  color: isDarkTheme ? '#d1d5db' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Close Preview
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <CreativeCanvas
                dimension={generatedContent[selectedPlatformEdit]?.spec || PLATFORM_SPECS.instagram_feed_square}
                isDarkTheme={isDarkTheme}
                initialContent={{
                  headline: generatedContent[selectedPlatformEdit]?.headline || '',
                  description: generatedContent[selectedPlatformEdit]?.body || '',
                  cta: generatedContent[selectedPlatformEdit]?.cta || 'Learn More'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Main render
  return (
    <div style={{
      height: '100%',
      backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Progress Steps */}
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
        display: 'flex',
        justifyContent: 'center',
        gap: '8px'
      }}>
        {[
          { num: 1, label: 'Brief' },
          { num: 2, label: 'Platforms' },
          { num: 3, label: 'Generate' },
          { num: 4, label: 'Review' }
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: step >= s.num ? '#FBBF24' : (isDarkTheme ? '#374151' : '#e5e7eb'),
              color: step >= s.num ? '#000' : (isDarkTheme ? '#9ca3af' : '#6b7280'),
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: step === s.num ? '600' : '400'
            }}>
              {step > s.num ? <Check size={12} /> : s.num}
              <span>{s.label}</span>
            </div>
            {i < 3 && (
              <div style={{
                width: '20px',
                height: '2px',
                backgroundColor: step > s.num ? '#FBBF24' : (isDarkTheme ? '#374151' : '#e5e7eb')
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {step === 1 && renderBriefStep()}
        {step === 2 && renderPlatformStep()}
        {step === 3 && (isGenerating ? renderGeneratingStep() : renderReviewStep())}
        {step === 4 && renderReviewStep()}
      </div>
    </div>
  );
}

export default CampaignQuickstart;
