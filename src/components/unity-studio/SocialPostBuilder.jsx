import React, { useState, useCallback } from 'react';

/**
 * SocialPostBuilder - Create social media posts for multiple platforms
 *
 * Features:
 * - Platform-specific templates (LinkedIn, Twitter/X, Instagram)
 * - Character count tracking with platform limits
 * - Hashtag suggestions
 * - Real-time preview
 * - Copy to clipboard
 */

const PLATFORMS = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    charLimit: 3000,
    hashtagLimit: 5,
    color: '#0077b5',
    tips: 'Professional tone, storytelling works well'
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    charLimit: 280,
    hashtagLimit: 3,
    color: '#000000',
    tips: 'Short, punchy, thread-friendly'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    charLimit: 2200,
    hashtagLimit: 30,
    color: '#e4405f',
    tips: 'Visual focus, hashtags in comments'
  }
];

const POST_TEMPLATES = [
  {
    id: 'announcement',
    name: 'Announcement',
    icon: '📢',
    description: 'Share news or updates',
    content: {
      linkedin: `🎉 Exciting news!\n\nWe're thrilled to announce {{announcement}}.\n\nThis is a game-changer for {{audience}} because it means:\n\n✅ Benefit 1\n✅ Benefit 2\n✅ Benefit 3\n\nLearn more: {{link}}\n\n#{{hashtag1}} #{{hashtag2}}`,
      twitter: `🎉 Big news: {{announcement}}\n\n{{benefit}}\n\nLearn more: {{link}}\n\n#{{hashtag1}} #{{hashtag2}}`,
      instagram: `🎉 ANNOUNCEMENT 🎉\n\n{{announcement}}\n\nThis changes everything for {{audience}}!\n\n✨ {{benefit1}}\n✨ {{benefit2}}\n✨ {{benefit3}}\n\nTap the link in bio to learn more! 👆`
    }
  },
  {
    id: 'tip',
    name: 'Quick Tip',
    icon: '💡',
    description: 'Share valuable insights',
    content: {
      linkedin: `💡 Quick tip for {{audience}}:\n\n{{tip}}\n\nHere's why this matters:\n\n{{explanation}}\n\nWhat strategies have worked for you? Share below! 👇\n\n#{{hashtag1}} #{{hashtag2}} #{{hashtag3}}`,
      twitter: `💡 Tip for {{audience}}:\n\n{{tip}}\n\n{{explanation}}\n\nRT to help others! 🔄`,
      instagram: `💡 PRO TIP 💡\n\nFor all my {{audience}} out there:\n\n{{tip}}\n\n⬇️ Why this matters ⬇️\n\n{{explanation}}\n\nSave this for later! 📌`
    }
  },
  {
    id: 'question',
    name: 'Engagement Question',
    icon: '❓',
    description: 'Start a conversation',
    content: {
      linkedin: `❓ I'm curious...\n\n{{question}}\n\nI've been thinking about this because {{context}}.\n\nDrop your thoughts in the comments! 👇\n\n#{{hashtag1}} #{{hashtag2}}`,
      twitter: `❓ {{question}}\n\n{{context}}\n\nReply with your take! 👇`,
      instagram: `❓ QUESTION TIME ❓\n\n{{question}}\n\n{{context}}\n\nDrop your answer in the comments! 💬`
    }
  },
  {
    id: 'story',
    name: 'Story / Thread',
    icon: '📖',
    description: 'Share a personal story',
    content: {
      linkedin: `I need to share something.\n\n{{hook}}\n\nHere's what happened:\n\n{{story}}\n\nThe lesson? {{lesson}}\n\nHas this ever happened to you?\n\n#{{hashtag1}} #{{hashtag2}}`,
      twitter: `🧵 Thread:\n\n{{hook}}\n\n1/ {{story_part1}}\n\n2/ {{story_part2}}\n\n3/ {{lesson}}\n\nRT if this resonates 🙏`,
      instagram: `📖 STORYTIME 📖\n\n{{hook}}\n\n{{story}}\n\n💡 The lesson: {{lesson}}\n\nDouble tap if you can relate! ❤️`
    }
  },
  {
    id: 'cta',
    name: 'Call-to-Action',
    icon: '🎯',
    description: 'Drive specific action',
    content: {
      linkedin: `🎯 {{audience}}, this is for you:\n\n{{value_prop}}\n\nWe're offering {{offer}} for a limited time.\n\n👉 {{cta}}\n\nLink in comments 👇\n\n#{{hashtag1}} #{{hashtag2}}`,
      twitter: `🎯 {{audience}}:\n\n{{value_prop}}\n\n{{offer}}\n\n👉 {{cta}}: {{link}}`,
      instagram: `🎯 CALLING ALL {{audience}} 🎯\n\n{{value_prop}}\n\n🔥 {{offer}} 🔥\n\n👉 {{cta}}\n\nLink in bio! 👆`
    }
  }
];

const SUGGESTED_HASHTAGS = {
  linkedin: ['GTM', 'SaaS', 'StartupLife', 'MarketingTips', 'GrowthHacking', 'B2B', 'Sales', 'Leadership', 'Innovation', 'TechStartup'],
  twitter: ['buildinpublic', 'indiehackers', 'startup', 'saas', 'marketing', 'growth', 'ai', 'tech', 'entrepreneurship', 'founder'],
  instagram: ['business', 'entrepreneur', 'startup', 'marketing', 'success', 'motivation', 'growth', 'tips', 'smallbusiness', 'digitalmarketing']
};

function SocialPostBuilder({ onBack, onSave, onSaveToCanvas, isDarkTheme = false }) {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [postName, setPostName] = useState('');

  const platform = PLATFORMS.find(p => p.id === selectedPlatform);
  const charCount = postContent.length;
  const isOverLimit = platform && charCount > platform.charLimit;

  const handleSelectPlatform = (platformId) => {
    setSelectedPlatform(platformId);
    setSelectedTemplate(null);
    setPostContent('');
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setPostContent(template.content[selectedPlatform] || '');
    setPostName(`${template.name} - ${platform.name}`);
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(postContent);
    alert('Copied to clipboard!');
  }, [postContent]);

  const handleSave = () => {
    const asset = {
      type: 'social',
      platform: selectedPlatform,
      name: postName || 'Untitled Post',
      content: postContent,
      charCount,
      template: selectedTemplate?.id
    };
    onSave(asset);
    alert('Post saved!');
  };

  const handleSaveToCanvas = () => {
    if (onSaveToCanvas) {
      const asset = {
        type: 'social',
        platform: selectedPlatform,
        name: postName || 'Social Post',
        content: postContent
      };
      onSaveToCanvas(asset);
      alert('Saved to canvas!');
    }
  };

  const insertHashtag = (tag) => {
    setPostContent(prev => prev + (prev.endsWith(' ') || prev.endsWith('\n') ? '' : ' ') + `#${tag}`);
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
          Choose Platform
        </h2>
        <p style={{
          fontSize: '14px',
          color: isDarkTheme ? '#9ca3af' : '#6b7280',
          marginBottom: '32px'
        }}>
          Select where you want to post
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {PLATFORMS.map(p => (
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
              <span style={{
                fontSize: '11px',
                color: isDarkTheme ? '#9ca3af' : '#6b7280',
                marginTop: '4px'
              }}>
                {p.charLimit} chars max
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
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: isDarkTheme ? '#f9fafb' : '#111827',
              margin: 0
            }}>
              {platform.name} Post
            </h2>
            <p style={{
              fontSize: '13px',
              color: platform.color,
              margin: '4px 0 0 0'
            }}>
              {platform.tips}
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {POST_TEMPLATES.map(template => (
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
            value={postName}
            onChange={(e) => setPostName(e.target.value)}
            placeholder="Post name..."
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

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Text Editor */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Write your post..."
            style={{
              flex: 1,
              padding: '16px',
              border: `2px solid ${isOverLimit ? '#ef4444' : (isDarkTheme ? '#374151' : '#e5e7eb')}`,
              borderRadius: '8px',
              backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
              color: isDarkTheme ? '#f9fafb' : '#111827',
              fontSize: '15px',
              lineHeight: '1.6',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />

          {/* Character count */}
          <div style={{
            marginTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '13px',
              color: isOverLimit ? '#ef4444' : (isDarkTheme ? '#9ca3af' : '#6b7280')
            }}>
              {charCount} / {platform.charLimit} characters
              {isOverLimit && ' (over limit!)'}
            </span>
            <div style={{
              width: '200px',
              height: '4px',
              backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min((charCount / platform.charLimit) * 100, 100)}%`,
                height: '100%',
                backgroundColor: isOverLimit ? '#ef4444' : platform.color,
                transition: 'width 0.2s'
              }} />
            </div>
          </div>

          {/* Hashtag suggestions */}
          <div style={{ marginTop: '16px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Suggested Hashtags
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {SUGGESTED_HASHTAGS[selectedPlatform].map(tag => (
                <button
                  key={tag}
                  onClick={() => insertHashtag(tag)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
                    color: isDarkTheme ? '#d1d5db' : '#4b5563',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{
          width: '350px',
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
            Preview
          </span>

          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: isDarkTheme ? '#1f2937' : '#fff',
            borderRadius: '12px',
            border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`
          }}>
            {/* Platform header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#FBBF24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                YC
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDarkTheme ? '#f9fafb' : '#111827'
                }}>
                  yellowCircle
                </div>
                <div style={{
                  fontSize: '12px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280'
                }}>
                  Just now
                </div>
              </div>
            </div>

            {/* Post content */}
            <div style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: isDarkTheme ? '#d1d5db' : '#374151',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {postContent || 'Your post will appear here...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialPostBuilder;
