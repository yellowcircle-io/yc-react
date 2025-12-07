import React, { useState, useCallback } from 'react';

/**
 * EmailTemplateBuilder - Create email templates for campaigns
 *
 * Features:
 * - Pre-built templates with yellowCircle styling
 * - Section-based editing (header, body, CTA, footer)
 * - Variable placeholders for personalization
 * - Real-time preview
 * - Export as HTML or send to UnityMAP
 */

const EMAIL_TEMPLATES = [
  {
    id: 'outreach-initial',
    name: 'Outreach Initial',
    description: 'First touch cold outreach',
    icon: '🎯',
    sections: {
      subject: 'Quick question about {{company}}',
      greeting: 'Hi {{firstName}},',
      body: `I noticed {{company}} is doing interesting work in {{industry}}.

I help companies like yours optimize their go-to-market operations - recently helped a similar company reduce their technical debt by 40%.

Would you be open to a 15-minute conversation to see if there's a fit?`,
      cta: {
        text: 'Book a Call',
        url: '{{calendarLink}}'
      },
      signature: `Best,
{{senderName}}
{{senderTitle}}
yellowCircle`
    }
  },
  {
    id: 'followup-nudge',
    name: 'Follow-up Nudge',
    description: 'Quick follow-up reminder',
    icon: '📬',
    sections: {
      subject: 'Re: Quick question about {{company}}',
      greeting: 'Hi {{firstName}},',
      body: `Just circling back on my previous note.

I understand you're busy, so I'll keep this brief - if GTM efficiency is a priority for {{company}} this quarter, I'd love to share how we've helped similar companies.

If not the right time, no worries at all.`,
      cta: {
        text: 'Let me know',
        url: 'mailto:{{senderEmail}}'
      },
      signature: `Thanks,
{{senderName}}`
    }
  },
  {
    id: 'value-proposition',
    name: 'Value Proposition',
    description: 'Feature/benefit focused',
    icon: '💎',
    sections: {
      subject: 'Idea for {{company}}: Cut GTM waste by 30%',
      greeting: 'Hi {{firstName}},',
      body: `Most growth teams waste 20-40% of their budget on:
• Duplicate marketing tools
• Misaligned data schemas
• Manual processes that should be automated

We've developed a framework that identifies these gaps in under 2 weeks.

Would a quick diagnostic be valuable for {{company}}?`,
      cta: {
        text: 'Get the Free Assessment',
        url: '{{assessmentLink}}'
      },
      signature: `Cheers,
{{senderName}}
yellowCircle`
    }
  },
  {
    id: 'case-study',
    name: 'Case Study Share',
    description: 'Social proof template',
    icon: '📊',
    sections: {
      subject: 'How [Similar Company] fixed their GTM in 30 days',
      greeting: 'Hi {{firstName}},',
      body: `Thought you might find this interesting:

We recently worked with a company similar to {{company}} that was struggling with:
- 45-minute data lag between systems
- 15% sync error rate
- $2.5M/year in hidden technical debt

Within 30 days, we helped them:
✓ Reduce data lag to under 5 minutes
✓ Cut errors by 80%
✓ Identify $1.2M in recoverable costs

Happy to share the full case study if relevant.`,
      cta: {
        text: 'Send Me the Case Study',
        url: 'mailto:{{senderEmail}}?subject=Case%20Study%20Request'
      },
      signature: `Best,
{{senderName}}
GTM Strategy Lead, yellowCircle`
    }
  },
  {
    id: 'meeting-request',
    name: 'Meeting Request',
    description: 'Calendar booking focused',
    icon: '📅',
    sections: {
      subject: '15 min this week?',
      greeting: '{{firstName}},',
      body: `I'd love to learn more about what {{company}} is working on and share a few ideas that might be helpful.

I have some openings this week - would any of these work?
• Tuesday 2pm
• Wednesday 10am
• Thursday 3pm

Or feel free to grab a time that works better:`,
      cta: {
        text: 'Pick a Time',
        url: '{{calendarLink}}'
      },
      signature: `Talk soon,
{{senderName}}`
    }
  }
];

const VARIABLES = [
  { key: 'firstName', label: 'First Name', sample: 'Jane' },
  { key: 'lastName', label: 'Last Name', sample: 'Smith' },
  { key: 'company', label: 'Company', sample: 'Acme Corp' },
  { key: 'industry', label: 'Industry', sample: 'SaaS' },
  { key: 'senderName', label: 'Your Name', sample: 'Chris' },
  { key: 'senderTitle', label: 'Your Title', sample: 'GTM Consultant' },
  { key: 'senderEmail', label: 'Your Email', sample: 'chris@yellowcircle.io' },
  { key: 'calendarLink', label: 'Calendar Link', sample: 'https://cal.com/yellowcircle' },
  { key: 'assessmentLink', label: 'Assessment Link', sample: 'https://yellowcircle.io/assessment' }
];

function EmailTemplateBuilder({ onBack, onSave, onSaveToCanvas, onExportToMAP, isDarkTheme = false, aiContext = null }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editedSections, setEditedSections] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showAiContext, setShowAiContext] = useState(false);

  // Store AI context for reference (NOT pre-filling - just available as context)
  // Similar to how photos/notes provide metadata context
  const aiConversationContext = React.useMemo(() => {
    if (aiContext?.type === 'ai-conversation' && aiContext.messages?.length > 0) {
      return {
        title: aiContext.title || 'AI Chat',
        messages: aiContext.messages,
        // Extract key insights from conversation for quick reference
        summary: aiContext.messages
          .filter(m => m.role === 'assistant' && !m.isError)
          .slice(-2)
          .map(m => m.content.substring(0, 200) + (m.content.length > 200 ? '...' : ''))
      };
    }
    return null;
  }, [aiContext]);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setEditedSections({ ...template.sections });
    setTemplateName(template.name);
  };

  const handleSectionChange = (sectionKey, value) => {
    setEditedSections(prev => ({
      ...prev,
      [sectionKey]: value
    }));
  };

  const handleCTAChange = (field, value) => {
    setEditedSections(prev => ({
      ...prev,
      cta: {
        ...prev.cta,
        [field]: value
      }
    }));
  };

  const insertVariable = useCallback((sectionKey, variable) => {
    const placeholder = `{{${variable}}}`;
    const currentValue = editedSections[sectionKey] || '';
    handleSectionChange(sectionKey, currentValue + placeholder);
  }, [editedSections]);

  const replaceVariablesWithSample = (text) => {
    if (!text) return '';
    let result = text;
    VARIABLES.forEach(v => {
      result = result.replace(new RegExp(`{{${v.key}}}`, 'g'), v.sample);
    });
    return result;
  };

  const generateHTML = useCallback(() => {
    if (!editedSections) return '';

    const { subject, greeting, body, cta, signature } = editedSections;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || 'Email'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 3px solid #FBBF24; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 18px; font-weight: 700; color: #1f2937; }
    .logo span { color: #FBBF24; }
    .greeting { font-size: 16px; margin-bottom: 16px; }
    .body { font-size: 15px; white-space: pre-wrap; margin-bottom: 24px; }
    .cta { display: inline-block; background: #FBBF24; color: #1f2937; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .signature { font-size: 14px; color: #6b7280; white-space: pre-wrap; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">yellow<span>Circle</span></div>
  </div>
  <div class="greeting">${greeting || ''}</div>
  <div class="body">${body || ''}</div>
  ${cta ? `<a href="${cta.url || '#'}" class="cta">${cta.text || 'Learn More'}</a>` : ''}
  <div class="signature">${signature || ''}</div>
</body>
</html>`;
  }, [editedSections]);

  const handleSaveTemplate = () => {
    const asset = {
      type: 'email',
      name: templateName,
      baseTemplate: selectedTemplate?.id,
      sections: editedSections,
      html: generateHTML()
    };
    onSave(asset);
    alert('Template saved!');
  };

  const handleExportToMAP = () => {
    const asset = {
      type: 'email',
      name: templateName,
      subject: editedSections.subject,
      body: `${editedSections.greeting}\n\n${editedSections.body}\n\n${editedSections.signature}`,
      fullBody: editedSections.body,
      cta: editedSections.cta
    };
    onExportToMAP(asset);
    alert('Sent to UnityMAP! Create an Email node to use this template.');
  };

  const handleSaveToCanvas = () => {
    if (onSaveToCanvas) {
      const asset = {
        type: 'email',
        name: templateName,
        sections: editedSections,
        html: generateHTML()
      };
      onSaveToCanvas(asset);
      alert('Saved to canvas as a note card!');
    }
  };

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(generateHTML());
    alert('HTML copied to clipboard!');
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([generateHTML()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Template selector view
  if (!selectedTemplate) {
    return (
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          padding: '32px',
          backgroundColor: isDarkTheme ? '#111827' : '#f9fafb',
          minHeight: '100%',
          height: '100%',
          overflowY: 'auto'
        }}
      >
        <div style={{ marginBottom: '32px' }}>
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
              fontSize: '13px'
            }}
          >
            ← Back to Assets
          </button>
        </div>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: isDarkTheme ? '#f9fafb' : '#111827',
            marginBottom: '8px'
          }}
        >
          Choose a Template
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: isDarkTheme ? '#9ca3af' : '#6b7280',
            marginBottom: '32px'
          }}
        >
          Start with a pre-built template and customize it
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}
        >
          {EMAIL_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              style={{
                textAlign: 'left',
                padding: '24px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                border: `2px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
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
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>
                {template.icon}
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: isDarkTheme ? '#f9fafb' : '#111827',
                  display: 'block',
                  marginBottom: '4px'
                }}
              >
                {template.name}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280'
                }}
              >
                {template.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Template editor view
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        display: 'flex',
        height: '100%',
        backgroundColor: isDarkTheme ? '#111827' : '#f9fafb'
      }}
    >
      {/* Editor Panel */}
      <div
        style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          borderRight: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setSelectedTemplate(null)}
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
              marginBottom: '16px'
            }}
          >
            ← Templates
          </button>

          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template Name"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '18px',
              fontWeight: '700',
              backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: isDarkTheme ? '#f9fafb' : '#111827',
              outline: 'none'
            }}
          />
        </div>

        {/* AI Context Panel - Shows conversation context when launched from AI Chat */}
        {aiConversationContext && (
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowAiContext(!showAiContext)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px 16px',
                backgroundColor: isDarkTheme ? '#1e3a5f' : '#eff6ff',
                border: `1px solid ${isDarkTheme ? '#3b82f6' : '#bfdbfe'}`,
                borderRadius: '8px',
                color: isDarkTheme ? '#93c5fd' : '#1d4ed8',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'left'
              }}
            >
              <span>🤖</span>
              <span style={{ flex: 1 }}>AI Conversation Context: {aiConversationContext.title}</span>
              <span style={{ fontSize: '10px' }}>{showAiContext ? '▼' : '▶'}</span>
            </button>
            {showAiContext && (
              <div style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <p style={{
                  fontSize: '11px',
                  color: isDarkTheme ? '#9ca3af' : '#6b7280',
                  marginBottom: '8px'
                }}>
                  Reference this conversation while writing your template:
                </p>
                {aiConversationContext.messages.slice(-4).map((msg, idx) => (
                  <div key={idx} style={{
                    marginBottom: '8px',
                    padding: '8px',
                    backgroundColor: msg.role === 'user'
                      ? (isDarkTheme ? '#374151' : '#f3f4f6')
                      : (isDarkTheme ? '#1e3a5f' : '#eff6ff'),
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: isDarkTheme ? '#e5e7eb' : '#374151'
                  }}>
                    <span style={{
                      fontWeight: '600',
                      fontSize: '10px',
                      color: isDarkTheme ? '#9ca3af' : '#6b7280'
                    }}>
                      {msg.role === 'user' ? '💬 You' : '🤖 AI'}:
                    </span>
                    <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                      {msg.content.length > 300 ? msg.content.substring(0, 300) + '...' : msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subject Line */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              marginBottom: '8px'
            }}
          >
            Subject Line
          </label>
          <input
            type="text"
            value={editedSections.subject || ''}
            onChange={(e) => handleSectionChange('subject', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px',
              color: isDarkTheme ? '#f9fafb' : '#111827',
              outline: 'none'
            }}
          />
        </div>

        {/* Greeting */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              marginBottom: '8px'
            }}
          >
            Greeting
          </label>
          <input
            type="text"
            value={editedSections.greeting || ''}
            onChange={(e) => handleSectionChange('greeting', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px',
              color: isDarkTheme ? '#f9fafb' : '#111827',
              outline: 'none'
            }}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              marginBottom: '8px'
            }}
          >
            Body
          </label>
          <textarea
            value={editedSections.body || ''}
            onChange={(e) => handleSectionChange('body', e.target.value)}
            rows={8}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px',
              color: isDarkTheme ? '#f9fafb' : '#111827',
              outline: 'none',
              resize: 'vertical',
              lineHeight: '1.6',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* CTA */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              marginBottom: '8px'
            }}
          >
            Call to Action
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Button Text"
              value={editedSections.cta?.text || ''}
              onChange={(e) => handleCTAChange('text', e.target.value)}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '14px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                borderRadius: '6px',
                color: isDarkTheme ? '#f9fafb' : '#111827',
                outline: 'none'
              }}
            />
            <input
              type="text"
              placeholder="URL"
              value={editedSections.cta?.url || ''}
              onChange={(e) => handleCTAChange('url', e.target.value)}
              style={{
                flex: 2,
                padding: '12px',
                fontSize: '14px',
                backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
                borderRadius: '6px',
                color: isDarkTheme ? '#f9fafb' : '#111827',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Signature */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              marginBottom: '8px'
            }}
          >
            Signature
          </label>
          <textarea
            value={editedSections.signature || ''}
            onChange={(e) => handleSectionChange('signature', e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkTheme ? '#374151' : '#e5e7eb'}`,
              borderRadius: '6px',
              color: isDarkTheme ? '#f9fafb' : '#111827',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Variables */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              marginBottom: '8px'
            }}
          >
            Insert Variables
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {VARIABLES.map((v) => (
              <button
                key={v.key}
                onClick={() => navigator.clipboard.writeText(`{{${v.key}}}`)}
                title={`Click to copy: {{${v.key}}}`}
                style={{
                  padding: '6px 10px',
                  fontSize: '11px',
                  backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
                  border: 'none',
                  borderRadius: '4px',
                  color: isDarkTheme ? '#d1d5db' : '#374151',
                  cursor: 'pointer'
                }}
              >
                {`{{${v.key}}}`}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSaveTemplate}
            style={{
              padding: '12px 24px',
              backgroundColor: '#FBBF24',
              color: '#111827',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            💾 Save Template
          </button>
          <button
            onClick={handleExportToMAP}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            🗺️ Send to MAP
          </button>
          {onSaveToCanvas && (
            <button
              onClick={handleSaveToCanvas}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              📝 Save to Canvas
            </button>
          )}
          <button
            onClick={handleCopyHTML}
            style={{
              padding: '12px 24px',
              backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
              color: isDarkTheme ? '#d1d5db' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📋 Copy HTML
          </button>
          <button
            onClick={handleDownloadHTML}
            style={{
              padding: '12px 24px',
              backgroundColor: isDarkTheme ? '#374151' : '#e5e7eb',
              color: isDarkTheme ? '#d1d5db' : '#374151',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            ⬇️ Download HTML
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div
        style={{
          width: '45%',
          minWidth: '400px',
          padding: '24px',
          backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: isDarkTheme ? '#9ca3af' : '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Preview
          </h3>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              backgroundColor: showPreview ? '#FBBF24' : (isDarkTheme ? '#374151' : '#e5e7eb'),
              color: showPreview ? '#111827' : (isDarkTheme ? '#d1d5db' : '#374151'),
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showPreview ? 'With Variables' : 'Sample Data'}
          </button>
        </div>

        {/* Email Preview */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '24px',
            color: '#1f2937'
          }}
        >
          {/* Subject */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              marginBottom: '16px'
            }}
          >
            <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>
              Subject:
            </span>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              {showPreview
                ? editedSections.subject
                : replaceVariablesWithSample(editedSections.subject)
              }
            </span>
          </div>

          {/* Header */}
          <div
            style={{
              borderBottom: '3px solid #FBBF24',
              paddingBottom: '12px',
              marginBottom: '20px'
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: '700' }}>
              yellow<span style={{ color: '#FBBF24' }}>Circle</span>
            </span>
          </div>

          {/* Greeting */}
          <p style={{ fontSize: '15px', marginBottom: '16px' }}>
            {showPreview
              ? editedSections.greeting
              : replaceVariablesWithSample(editedSections.greeting)
            }
          </p>

          {/* Body */}
          <p
            style={{
              fontSize: '14px',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
              marginBottom: '24px'
            }}
          >
            {showPreview
              ? editedSections.body
              : replaceVariablesWithSample(editedSections.body)
            }
          </p>

          {/* CTA */}
          {editedSections.cta && (
            <div style={{ marginBottom: '24px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#FBBF24',
                  color: '#111827',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {editedSections.cta.text}
              </span>
            </div>
          )}

          {/* Signature */}
          <p
            style={{
              fontSize: '13px',
              color: '#6b7280',
              whiteSpace: 'pre-wrap',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '16px'
            }}
          >
            {showPreview
              ? editedSections.signature
              : replaceVariablesWithSample(editedSections.signature)
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmailTemplateBuilder;
