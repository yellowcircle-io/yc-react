import React, { useState, useCallback } from 'react';
import CreativeCanvas from './CreativeCanvas';
import ExportManager from './ExportManager';
import { PLATFORM_SPECS, getSpecsByPlatform } from './platform-specs';
import { useAIGeneration } from './useAIGeneration';

/**
 * AdCreativeBuilder - Create ad copy for multiple platforms
 *
 * Features:
 * - Platform-specific templates (Reddit, LinkedIn, Meta)
 * - Headline and description editors
 * - CTA button options
 * - Character limits per platform
 * - Copy to clipboard
 * - Visual canvas editor (NEW)
 * - Platform dimension presets (NEW)
 * - Export manager (NEW)
 */

const AD_PLATFORMS = [
  {
    id: 'reddit',
    name: 'Reddit Ads',
    icon: '🤖',
    color: '#ff4500',
    headline: { label: 'Title', limit: 300 },
    description: { label: 'Body', limit: 40000 },
    cta: ['Learn More', 'Shop Now', 'Sign Up', 'Get Quote', 'Watch Video', 'Download', 'Get Started']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Ads',
    icon: '💼',
    color: '#0077b5',
    headline: { label: 'Headline', limit: 70 },
    description: { label: 'Introductory Text', limit: 600 },
    cta: ['Learn More', 'Sign Up', 'Register', 'Download', 'Get Quote', 'Apply Now', 'Contact Us']
  },
  {
    id: 'meta',
    name: 'Meta (FB/IG)',
    icon: '📘',
    color: '#1877f2',
    headline: { label: 'Headline', limit: 40 },
    description: { label: 'Primary Text', limit: 125 },
    cta: ['Learn More', 'Shop Now', 'Sign Up', 'Get Offer', 'Book Now', 'Contact Us', 'Download']
  }
];

const AD_TEMPLATES = [
  {
    id: 'problem-solution',
    name: 'Problem → Solution',
    icon: '🎯',
    description: 'Identify pain point, offer solution',
    content: {
      reddit: {
        headline: 'Tired of {{pain_point}}? Here\'s the fix.',
        description: 'We get it. {{pain_point}} is frustrating.\n\nThat\'s why we built {{product}} - the simple way to {{benefit}}.\n\n✅ {{feature_1}}\n✅ {{feature_2}}\n✅ {{feature_3}}\n\nJoin {{social_proof}} who\'ve already made the switch.'
      },
      linkedin: {
        headline: 'Stop wasting time on {{pain_point}}',
        description: '{{audience}}: Are you still struggling with {{pain_point}}?\n\n{{product}} helps you {{benefit}} in half the time.\n\nSee how {{company}} achieved {{result}}.'
      },
      meta: {
        headline: 'Fix {{pain_point}} today',
        description: 'Struggling with {{pain_point}}? {{product}} helps you {{benefit}}. Join {{social_proof}}+ happy customers.'
      }
    }
  },
  {
    id: 'social-proof',
    name: 'Social Proof',
    icon: '⭐',
    description: 'Lead with testimonials & results',
    content: {
      reddit: {
        headline: '"{{testimonial}}" - {{customer_name}}, {{company}}',
        description: 'Real results from real users:\n\n📈 {{stat_1}}\n📈 {{stat_2}}\n📈 {{stat_3}}\n\n{{product}} is trusted by {{social_proof}} teams including {{brands}}.\n\nSee why everyone\'s switching.'
      },
      linkedin: {
        headline: '{{social_proof}}+ companies trust us',
        description: '"{{testimonial}}"\n\n— {{customer_name}}, {{title}} at {{company}}\n\nSee how {{product}} can help your team {{benefit}}.'
      },
      meta: {
        headline: '⭐⭐⭐⭐⭐ {{rating}}',
        description: '"{{testimonial}}" - {{customer_name}}\n\n{{social_proof}}+ trust {{product}}. You should too.'
      }
    }
  },
  {
    id: 'offer',
    name: 'Special Offer',
    icon: '🎁',
    description: 'Limited time deals & discounts',
    content: {
      reddit: {
        headline: '{{offer}} - Limited Time Only',
        description: '🔥 {{offer_details}}\n\nWhat you get:\n• {{benefit_1}}\n• {{benefit_2}}\n• {{benefit_3}}\n\n⏰ Offer ends {{deadline}}\n\nDon\'t miss out - {{urgency}}'
      },
      linkedin: {
        headline: 'Exclusive: {{offer}}',
        description: 'For a limited time, get {{offer_details}}.\n\nThis exclusive offer for {{audience}} includes:\n✓ {{benefit_1}}\n✓ {{benefit_2}}\n\nExpires {{deadline}}.'
      },
      meta: {
        headline: '🎁 {{offer}} - Ends Soon!',
        description: 'Get {{offer_details}} before {{deadline}}. {{urgency}}'
      }
    }
  },
  {
    id: 'how-it-works',
    name: 'How It Works',
    icon: '🔧',
    description: 'Simple 3-step process',
    content: {
      reddit: {
        headline: '{{benefit}} in 3 simple steps',
        description: 'Getting started with {{product}} is easy:\n\n1️⃣ {{step_1}}\n2️⃣ {{step_2}}\n3️⃣ {{step_3}}\n\nThat\'s it. No {{complexity}}. Just {{result}}.\n\nStart your free trial today.'
      },
      linkedin: {
        headline: '3 steps to {{benefit}}',
        description: '{{audience}}: Here\'s how {{product}} works:\n\n1. {{step_1}}\n2. {{step_2}}\n3. {{step_3}}\n\nSimple. Effective. {{result}}.'
      },
      meta: {
        headline: '{{benefit}} made simple',
        description: '1. {{step_1}} 2. {{step_2}} 3. {{step_3}} Start free today!'
      }
    }
  },
  {
    id: 'comparison',
    name: 'Us vs Them',
    icon: '⚔️',
    description: 'Compare to competitors',
    content: {
      reddit: {
        headline: 'Why {{audience}} are switching from {{competitor}}',
        description: 'Here\'s what {{product}} does differently:\n\n❌ {{competitor}}: {{competitor_weakness}}\n✅ {{product}}: {{our_strength}}\n\nPlus:\n• {{benefit_1}}\n• {{benefit_2}}\n• {{benefit_3}}\n\nSee the difference for yourself.'
      },
      linkedin: {
        headline: 'The smarter alternative to {{competitor}}',
        description: 'Still using {{competitor}}? {{product}} gives you {{benefit}} without {{competitor_weakness}}.\n\nMake the switch today.'
      },
      meta: {
        headline: 'Better than {{competitor}}',
        description: '{{product}} vs {{competitor}}: Get {{benefit}} without {{competitor_weakness}}. Try free.'
      }
    }
  }
];

function AdCreativeBuilder({ onBack, onSave, onSaveToCanvas, isDarkTheme = false, initialContent = null, aiContext = null }) {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [headline, setHeadline] = useState(initialContent?.headline || '');
  const [description, setDescription] = useState(initialContent?.description || '');
  const [selectedCta, setSelectedCta] = useState('');
  const [adName, setAdName] = useState(initialContent?.name || '');

  // NEW: Visual editor states
  const [editorMode, setEditorMode] = useState('visual'); // 'text' | 'visual' - default to visual
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [showExportManager, setShowExportManager] = useState(false);
  const [canvasData, setCanvasData] = useState(null);

  // AI Generation - pre-populate from aiContext if available
  const [showAIPanel, setShowAIPanel] = useState(!!aiContext);
  const [aiInputs, setAiInputs] = useState({
    brand: aiContext?.brand || '',
    product: aiContext?.product || aiContext?.summary || '',
    targetAudience: aiContext?.audience || '',
    uniqueValue: aiContext?.value || '',
    campaignType: aiContext?.campaignType || 'awareness'
  });
  const [aiVariants, setAiVariants] = useState([]);
  const {
    generateAdCopy,
    generateCTAs: _generateCTAs,
    isGenerating,
    error: aiError,
    CAMPAIGN_TYPES,
    AI_PROVIDERS,
    provider,
    setProvider,
    usageCount: _usageCount,
    remainingGenerations
  } = useAIGeneration();

  const platform = AD_PLATFORMS.find(p => p.id === selectedPlatform);

  // Get platform-specific dimensions
  const platformDimensions = selectedPlatform ? getSpecsByPlatform(
    selectedPlatform === 'meta' ? 'facebook' : selectedPlatform
  ) : [];

  // Helper function to replace {{placeholder}} with actual values
  const replacePlaceholders = useCallback((text) => {
    if (!text) return text;

    // Map aiInputs to template variables
    const replacements = {
      // From user inputs
      '{{product}}': aiInputs.product || '[your product]',
      '{{brand}}': aiInputs.brand || '[your brand]',
      '{{audience}}': aiInputs.targetAudience || '[target audience]',
      '{{unique_value}}': aiInputs.uniqueValue || '[your unique value]',

      // Common defaults - encourage user to fill these
      '{{pain_point}}': '[pain point]',
      '{{benefit}}': '[key benefit]',
      '{{social_proof}}': '1,000+',
      '{{feature_1}}': 'Feature one',
      '{{feature_2}}': 'Feature two',
      '{{feature_3}}': 'Feature three',
      '{{company}}': aiInputs.brand || '[company]',
      '{{result}}': '[specific result]',

      // Testimonial placeholders
      '{{testimonial}}': '[customer quote]',
      '{{customer_name}}': '[Customer Name]',
      '{{title}}': '[Title]',
      '{{rating}}': '4.9/5',

      // Offer placeholders
      '{{offer}}': '[Your Offer]',
      '{{offer_details}}': '[offer details]',
      '{{deadline}}': '[deadline]',
      '{{urgency}}': '[call to action]',

      // How it works
      '{{step_1}}': 'Step 1',
      '{{step_2}}': 'Step 2',
      '{{step_3}}': 'Step 3',
      '{{complexity}}': 'complexity',

      // Comparison
      '{{competitor}}': '[Competitor]',
      '{{competitor_weakness}}': '[weakness]',
      '{{our_strength}}': '[your advantage]',
      '{{benefit_1}}': 'Benefit 1',
      '{{benefit_2}}': 'Benefit 2',
      '{{benefit_3}}': 'Benefit 3',
      '{{brands}}': '[notable brands]',
      '{{stat_1}}': '50% faster',
      '{{stat_2}}': '2x ROI',
      '{{stat_3}}': '99% uptime'
    };

    let result = text;
    for (const [placeholder, value] of Object.entries(replacements)) {
      result = result.split(placeholder).join(value);
    }
    return result;
  }, [aiInputs]);

  const handleSelectPlatform = (platformId) => {
    setSelectedPlatform(platformId);
    setSelectedTemplate(null);
    setHeadline('');
    setDescription('');
    const p = AD_PLATFORMS.find(pl => pl.id === platformId);
    setSelectedCta(p?.cta[0] || '');
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    const content = template.content[selectedPlatform];
    // Apply placeholder replacements when loading template
    setHeadline(replacePlaceholders(content?.headline || ''));
    setDescription(replacePlaceholders(content?.description || ''));
    setAdName(`${template.name} - ${platform.name}`);
  };

  const handleCopy = useCallback(() => {
    const text = `[${platform.name} Ad]\n\n${platform.headline.label}: ${headline}\n\n${platform.description.label}: ${description}\n\nCTA: ${selectedCta}`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }, [platform, headline, description, selectedCta]);

  const handleSave = () => {
    const asset = {
      type: 'ad',
      platform: selectedPlatform,
      name: adName || 'Untitled Ad',
      headline,
      description,
      cta: selectedCta,
      template: selectedTemplate?.id
    };
    onSave(asset);
    alert('Ad saved!');
  };

  const handleSaveToCanvas = () => {
    if (onSaveToCanvas) {
      const content = `**${platform.name} Ad**\n\n**${platform.headline.label}:** ${headline}\n\n**${platform.description.label}:** ${description}\n\n**CTA Button:** ${selectedCta}`;
      const asset = {
        type: 'ad',
        platform: selectedPlatform,
        name: adName || 'Ad Creative',
        content
      };
      onSaveToCanvas(asset);
      alert('Saved to canvas!');
    }
  };

  // AI Generation handler
  const handleGenerateAI = async () => {
    if (!aiInputs.brand || !aiInputs.product) {
      alert('Please provide at least a brand name and product/service description');
      return;
    }

    const platformMap = {
      reddit: 'reddit',
      linkedin: 'linkedin',
      meta: 'facebook'
    };

    const result = await generateAdCopy({
      platform: platformMap[selectedPlatform] || 'facebook',
      campaignType: aiInputs.campaignType,
      brand: aiInputs.brand,
      product: aiInputs.product,
      targetAudience: aiInputs.targetAudience || 'general audience',
      uniqueValue: aiInputs.uniqueValue || 'exceptional quality',
      variants: 3
    });

    if (result && result.variants && result.variants.length > 0) {
      setAiVariants(result.variants);
    }
  };

  const handleSelectAIVariant = (variant) => {
    setHeadline(variant.headline || '');
    setDescription(variant.body || '');
    if (variant.cta) {
      // Try to find matching CTA or use first one
      const matchingCta = platform.cta.find(c => c.toLowerCase().includes(variant.cta.toLowerCase()));
      setSelectedCta(matchingCta || platform.cta[0]);
    }
    setShowAIPanel(false);
    setAiVariants([]);
  };

  // Platform selector
  if (!selectedPlatform) {
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          padding: '32px',
          backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
          minHeight: '100%',
          overflowY: 'auto'
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            borderRadius: '6px',
            color: isDarkTheme ? '#9ca3af' : '#6b7280',
            cursor: 'pointer',
            fontSize: '13px',
            marginBottom: '24px'
          }}
        >
          ← Back to Assets
        </button>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: isDarkTheme ? '#f9fafb' : '#111827',
          marginBottom: '8px'
        }}>
          Choose Ad Platform
        </h2>
        <p style={{
          fontSize: '14px',
          color: isDarkTheme ? '#9ca3af' : '#6b7280',
          marginBottom: '32px'
        }}>
          Select where you want to advertise
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {AD_PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectPlatform(p.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '24px 32px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
                border: `2px solid ${p.color}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: '150px'
              }}
            >
              <span style={{ fontSize: '32px', marginBottom: '8px' }}>{p.icon}</span>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: isDarkTheme ? '#f9fafb' : '#111827'
              }}>
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Template selector
  if (!selectedTemplate) {
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          padding: '32px',
          backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
          minHeight: '100%',
          overflowY: 'auto'
        }}
      >
        <button
          onClick={() => setSelectedPlatform(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            borderRadius: '6px',
            color: isDarkTheme ? '#9ca3af' : '#6b7280',
            cursor: 'pointer',
            fontSize: '13px',
            marginBottom: '24px'
          }}
        >
          ← Back to Platforms
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '28px' }}>{platform.icon}</span>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: isDarkTheme ? '#f9fafb' : '#111827',
            margin: 0
          }}>
            {platform.name}
          </h2>
        </div>

        <p style={{
          fontSize: '14px',
          color: isDarkTheme ? '#9ca3af' : '#6b7280',
          marginBottom: '24px'
        }}>
          Choose a template to get started
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {AD_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '20px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
                border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              <span style={{ fontSize: '24px', marginBottom: '8px' }}>{template.icon}</span>
              <span style={{
                fontSize: '15px',
                fontWeight: '600',
                color: isDarkTheme ? '#f9fafb' : '#111827'
              }}>
                {template.name}
              </span>
              <span style={{
                fontSize: '12px',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                marginTop: '4px'
              }}>
                {template.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Editor view
  const headlineOver = headline.length > platform.headline.limit;
  const descOver = description.length > platform.description.limit;

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: isDarkTheme ? '#111827' : '#f9fafb'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setSelectedTemplate(null)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ← Templates
          </button>
          <span style={{ fontSize: '20px' }}>{platform.icon}</span>
          <input
            type="text"
            value={adName}
            onChange={(e) => setAdName(e.target.value)}
            placeholder="Ad name..."
            style={{
              padding: '8px 12px',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px',
              backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
              color: isDarkTheme ? '#f9fafb' : '#111827',
              fontSize: '14px',
              width: '200px'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            style={{
              padding: '8px 16px',
              backgroundColor: showAIPanel ? '#8b5cf6' : (isDarkTheme ? '#5b21b6' : '#7c3aed'),
              color: '#fff',
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
            ✨ AI Generate
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 16px',
              backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
              color: isDarkTheme ? '#f9fafb' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            📋 Copy
          </button>
          <button
            onClick={handleSaveToCanvas}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FBBF24',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            📌 Save to Canvas
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: platform.color,
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            💾 Save
          </button>
        </div>
      </div>

      {/* Mode Toggle & Dimension Selector */}
      <div style={{
        padding: '12px 20px',
        borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: isDarkTheme ? '#111827' : '#f9fafb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: isDarkTheme ? '#9ca3af' : '#6b7280', fontWeight: '600' }}>MODE:</span>
          <button
            onClick={() => setEditorMode('text')}
            style={{
              padding: '6px 12px',
              backgroundColor: editorMode === 'text' ? '#FBBF24' : (isDarkTheme ? '#374151' : '#e5e7eb'),
              color: editorMode === 'text' ? '#000' : (isDarkTheme ? '#9ca3af' : '#6b7280'),
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            📝 Text
          </button>
          <button
            onClick={() => setEditorMode('visual')}
            style={{
              padding: '6px 12px',
              backgroundColor: editorMode === 'visual' ? '#FBBF24' : (isDarkTheme ? '#374151' : '#e5e7eb'),
              color: editorMode === 'visual' ? '#000' : (isDarkTheme ? '#9ca3af' : '#6b7280'),
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            🎨 Visual
          </button>
        </div>

        {editorMode === 'visual' && platformDimensions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: isDarkTheme ? '#9ca3af' : '#6b7280', fontWeight: '600' }}>SIZE:</span>
            <select
              value={selectedDimension || ''}
              onChange={(e) => setSelectedDimension(e.target.value)}
              style={{
                padding: '6px 12px',
                border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                borderRadius: '4px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
                color: isDarkTheme ? '#f9fafb' : '#111827',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="">Select dimension...</option>
              {platformDimensions.map(spec => (
                <option key={spec.key} value={spec.key}>
                  {spec.label} ({spec.width}x{spec.height})
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowExportManager(true)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              📦 Export
            </button>
          </div>
        )}
      </div>

      {/* AI Generation Panel */}
      {showAIPanel && (
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
          backgroundColor: isDarkTheme ? '#1f1b2e' : '#f3e8ff'
        }}>
          {/* Provider Selection */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${isDarkTheme ? '#4c1d95' : '#ddd6fe'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: isDarkTheme ? '#a78bfa' : '#7c3aed', fontWeight: '600' }}>
                AI MODE:
              </span>
              {AI_PROVIDERS && Object.entries(AI_PROVIDERS).map(([key, prov]) => (
                <button
                  key={key}
                  onClick={() => !prov.disabled && setProvider(key)}
                  disabled={prov.disabled}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: provider === key
                      ? (key === 'free' ? '#10b981' : key === 'standard' ? '#7c3aed' : '#6b7280')
                      : (isDarkTheme ? '#2d2640' : '#ede9fe'),
                    color: provider === key ? '#fff' : (isDarkTheme ? '#a78bfa' : '#7c3aed'),
                    border: 'none',
                    borderRadius: '6px',
                    cursor: prov.disabled ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    opacity: prov.disabled ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  title={prov.description}
                >
                  <span>{prov.icon}</span>
                  <span>{prov.name}</span>
                </button>
              ))}
            </div>
            {/* Usage Counter for Standard mode */}
            {provider === 'standard' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: remainingGenerations <= 3
                  ? (isDarkTheme ? '#7f1d1d' : '#fef2f2')
                  : (isDarkTheme ? '#2d2640' : '#ede9fe'),
                borderRadius: '6px',
                color: remainingGenerations <= 3
                  ? '#ef4444'
                  : (isDarkTheme ? '#a78bfa' : '#7c3aed'),
                fontSize: '12px',
                fontWeight: '500'
              }}>
                <span>⚡</span>
                <span>{remainingGenerations} / 10 remaining today</span>
              </div>
            )}
            {provider === 'free' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: isDarkTheme ? '#064e3b' : '#d1fae5',
                borderRadius: '6px',
                color: isDarkTheme ? '#34d399' : '#059669',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                <span>✓</span>
                <span>Unlimited - No API calls</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
              <label style={{ fontSize: '11px', color: isDarkTheme ? '#a78bfa' : '#7c3aed', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                Brand Name *
              </label>
              <input
                type="text"
                placeholder="e.g. yellowCircle"
                value={aiInputs.brand}
                onChange={(e) => setAiInputs(prev => ({ ...prev, brand: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${isDarkTheme ? '#4c1d95' : '#c4b5fd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkTheme ? '#2d2640' : '#fff',
                  color: isDarkTheme ? '#f9fafb' : '#111827',
                  fontSize: '13px'
                }}
              />
            </div>
            <div style={{ flex: '2 1 200px', minWidth: '200px' }}>
              <label style={{ fontSize: '11px', color: isDarkTheme ? '#a78bfa' : '#7c3aed', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                Product/Service *
              </label>
              <input
                type="text"
                placeholder="e.g. AI-powered marketing automation"
                value={aiInputs.product}
                onChange={(e) => setAiInputs(prev => ({ ...prev, product: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${isDarkTheme ? '#4c1d95' : '#c4b5fd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkTheme ? '#2d2640' : '#fff',
                  color: isDarkTheme ? '#f9fafb' : '#111827',
                  fontSize: '13px'
                }}
              />
            </div>
            <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
              <label style={{ fontSize: '11px', color: isDarkTheme ? '#a78bfa' : '#7c3aed', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                Target Audience
              </label>
              <input
                type="text"
                placeholder="e.g. Small business owners"
                value={aiInputs.targetAudience}
                onChange={(e) => setAiInputs(prev => ({ ...prev, targetAudience: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${isDarkTheme ? '#4c1d95' : '#c4b5fd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkTheme ? '#2d2640' : '#fff',
                  color: isDarkTheme ? '#f9fafb' : '#111827',
                  fontSize: '13px'
                }}
              />
            </div>
            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
              <label style={{ fontSize: '11px', color: isDarkTheme ? '#a78bfa' : '#7c3aed', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                Campaign Type
              </label>
              <select
                value={aiInputs.campaignType}
                onChange={(e) => setAiInputs(prev => ({ ...prev, campaignType: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${isDarkTheme ? '#4c1d95' : '#c4b5fd'}`,
                  borderRadius: '6px',
                  backgroundColor: isDarkTheme ? '#2d2640' : '#fff',
                  color: isDarkTheme ? '#f9fafb' : '#111827',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {Object.entries(CAMPAIGN_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>{val.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || (provider === 'standard' && remainingGenerations <= 0)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: isGenerating || (provider === 'standard' && remainingGenerations <= 0)
                    ? '#6b7280'
                    : provider === 'free' ? '#10b981' : '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isGenerating || (provider === 'standard' && remainingGenerations <= 0) ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isGenerating
                  ? '⏳ Generating...'
                  : provider === 'standard' && remainingGenerations <= 0
                    ? '❌ Rate Limited'
                    : provider === 'free'
                      ? '🆓 Generate (Free)'
                      : '⚡ Generate (API)'
                }
              </button>
            </div>
          </div>

          {/* AI Error */}
          {aiError && (
            <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '6px', color: '#dc2626', fontSize: '12px' }}>
              Error: {aiError}
            </div>
          )}

          {/* AI Variants */}
          {aiVariants.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: isDarkTheme ? '#a78bfa' : '#7c3aed', fontWeight: '600', marginBottom: '8px' }}>
                Select a variant to use:
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {aiVariants.map((variant, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectAIVariant(variant)}
                    style={{
                      flex: '1 1 250px',
                      padding: '12px',
                      backgroundColor: isDarkTheme ? '#2d2640' : '#fff',
                      border: `1px solid ${isDarkTheme ? '#4c1d95' : '#c4b5fd'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '600', color: isDarkTheme ? '#f9fafb' : '#111827', marginBottom: '6px' }}>
                      {variant.headline?.substring(0, 50)}{variant.headline?.length > 50 ? '...' : ''}
                    </div>
                    <div style={{ fontSize: '12px', color: isDarkTheme ? '#9ca3af' : '#6b7280', lineHeight: '1.4' }}>
                      {variant.body?.substring(0, 80)}{variant.body?.length > 80 ? '...' : ''}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#7c3aed', fontWeight: '600' }}>
                      CTA: {variant.cta || 'Learn More'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {editorMode === 'text' ? (
        <>
        {/* Text Form */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {/* Headline */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {platform.headline.label}
              </label>
              <span style={{
                fontSize: '12px',
                color: headlineOver ? '#ef4444' : (isDarkTheme ? '#6b7280' : '#9ca3af')
              }}>
                {headline.length} / {platform.headline.limit}
              </span>
            </div>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={`Enter ${platform.headline.label.toLowerCase()}...`}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${headlineOver ? '#ef4444' : (isDarkTheme ? '#374151' : '#e5e7eb')}`,
                borderRadius: '8px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
                color: isDarkTheme ? '#f9fafb' : '#111827',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {platform.description.label}
              </label>
              <span style={{
                fontSize: '12px',
                color: descOver ? '#ef4444' : (isDarkTheme ? '#6b7280' : '#9ca3af')
              }}>
                {description.length} / {platform.description.limit}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Enter ${platform.description.label.toLowerCase()}...`}
              rows={8}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${descOver ? '#ef4444' : (isDarkTheme ? '#374151' : '#e5e7eb')}`,
                borderRadius: '8px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
                color: isDarkTheme ? '#f9fafb' : '#111827',
                fontSize: '15px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* CTA */}
          <div>
            <label style={{
              fontSize: '12px',
              fontWeight: '600',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '8px'
            }}>
              Call-to-Action Button
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {platform.cta.map(cta => (
                <button
                  key={cta}
                  onClick={() => setSelectedCta(cta)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedCta === cta ? platform.color : (isDarkTheme ? '#374151' : '#e5e7eb'),
                    color: selectedCta === cta ? '#fff' : (isDarkTheme ? '#d1d5db' : '#4b5563'),
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  {cta}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{
          width: '380px',
          borderLeft: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
          padding: '24px',
          backgroundColor: isDarkTheme ? '#0f172a' : '#f3f4f6',
          overflowY: 'auto'
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: isDarkTheme ? '#9ca3af' : '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Ad Preview
          </span>

          <div style={{
            marginTop: '16px',
            backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
            borderRadius: '12px',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
            overflow: 'hidden'
          }}>
            {/* Ad Image Placeholder */}
            <div style={{
              height: '180px',
              backgroundColor: '#FBBF24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{ fontSize: '48px' }}>🖼️</span>
              <span style={{ fontSize: '12px', color: '#000', fontWeight: '500' }}>
                Ad Image
              </span>
            </div>

            {/* Ad Content */}
            <div style={{ padding: '16px' }}>
              <div style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: isDarkTheme ? '#d1d5db' : '#374151',
                marginBottom: '12px',
                whiteSpace: 'pre-wrap'
              }}>
                {description || 'Your ad copy will appear here...'}
              </div>

              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: isDarkTheme ? '#f9fafb' : '#111827',
                marginBottom: '12px'
              }}>
                {headline || 'Your headline here'}
              </div>

              <button style={{
                width: '100%',
                padding: '10px',
                backgroundColor: platform.color,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                {selectedCta}
              </button>
            </div>
          </div>

          <p style={{
            marginTop: '16px',
            fontSize: '11px',
            color: isDarkTheme ? '#6b7280' : '#9ca3af',
            textAlign: 'center'
          }}>
            Preview is approximate. Actual appearance may vary.
          </p>
        </div>
        </>
        ) : (
        /* Visual Canvas Editor */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedDimension && PLATFORM_SPECS[selectedDimension] ? (
            <CreativeCanvas
              dimension={PLATFORM_SPECS[selectedDimension]}
              isDarkTheme={isDarkTheme}
              initialContent={{
                headline: headline,
                description: description,
                cta: selectedCta
              }}
              onExport={(data) => setCanvasData(data)}
            />
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
              gap: '16px'
            }}>
              <span style={{ fontSize: '48px' }}>🎨</span>
              <h3 style={{
                color: isDarkTheme ? '#f9fafb' : '#111827',
                margin: 0,
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Select a dimension to start designing
              </h3>
              <p style={{
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                margin: 0,
                fontSize: '14px'
              }}>
                Choose a platform size from the dropdown above
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '400px', justifyContent: 'center' }}>
                {platformDimensions.slice(0, 4).map(spec => (
                  <button
                    key={spec.key}
                    onClick={() => setSelectedDimension(spec.key)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
                      color: isDarkTheme ? '#f9fafb' : '#111827',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Export Manager Modal */}
      {showExportManager && canvasData && (
        <ExportManager
          canvasData={canvasData}
          platform={selectedPlatform === 'meta' ? 'facebook' : selectedPlatform}
          isDarkTheme={isDarkTheme}
          onClose={() => setShowExportManager(false)}
        />
      )}
    </div>
  );
}

export default AdCreativeBuilder;
