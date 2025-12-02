import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Layout from '../../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../../styles/constants';
import { navigationItems } from '../../config/navigationItems';

// Default brand configuration (can be customized by user)
const DEFAULT_BRAND = {
  name: 'yellowCircle',
  sender: {
    name: 'Chris Cooper',
    title: 'GTM & Marketing Operations Consultant',
    email: 'chris@yellowcircle.io'
  },
  links: {
    calendar: 'https://calendly.com/christophercooper',
    article: 'https://yellowcircle.io/thoughts/why-your-gtm-sucks',
    website: 'https://yellowcircle.io'
  }
};

// Generate system prompt based on user's brand config
const generateSystemPrompt = (brand) => `You are writing cold outreach emails for ${brand.sender.name}, ${brand.sender.title}${brand.name ? ` at ${brand.name}` : ''}.

**VOICE:**
- Direct, no fluff
- Peer-to-peer (not salesy)
- Specific and credible
- Under 150 words for initial, under 100 for follow-ups

**CREDENTIALS (use sparingly):**
${brand.credentials || '- Experienced professional in their field'}

**FRAMEWORK (NextPlay.so 3-part structure):**
1. Who you are (1 sentence)
2. Why reaching out (specific trigger)
3. Why they should care (value prop + easy ask)

**RULES:**
- Never use "I hope this finds you well" or similar
- No corporate jargon
- One clear CTA
- Reference specific trigger when provided
- Sign off as "— ${brand.sender.name.split(' ')[0]}"`;

function OutreachGeneratorPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  // Form state
  const [formData, setFormData] = useState({
    company: '',
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    industry: 'B2B SaaS',
    trigger: '',
    triggerDetails: ''
  });

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState(null);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showBrandSettings, setShowBrandSettings] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Brand customization state
  const [brand, setBrand] = useState(DEFAULT_BRAND);

  // Load API key and brand from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setShowApiKeyInput(true);
    }

    const savedBrand = localStorage.getItem('outreach_brand_config');
    if (savedBrand) {
      try {
        setBrand(JSON.parse(savedBrand));
      } catch (e) {
        console.error('Failed to parse saved brand config');
      }
    }
  }, []);

  // Save brand to localStorage when changed
  useEffect(() => {
    localStorage.setItem('outreach_brand_config', JSON.stringify(brand));
  }, [brand]);

  // Inject animations
  useEffect(() => {
    const styleId = 'outreach-generator-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('groq_api_key', apiKey.trim());
      setShowApiKeyInput(false);
    }
  };

  const triggerOptions = [
    { value: 'funding', label: 'Recent Funding' },
    { value: 'hiring', label: 'Hiring for Marketing/Ops Role' },
    { value: 'content', label: 'LinkedIn Post/Content' },
    { value: 'news', label: 'Company News/Announcement' },
    { value: 'none', label: 'No Specific Trigger' }
  ];

  const generateEmailContent = async (stage, prospect) => {
    const stagePrompts = {
      initial: `Write an initial cold email (Day 0) for this prospect. Keep it under 150 words.`,
      followup1: `Write follow-up #1 (Day 3). Reference the previous email without repeating it. Add value with a diagnostic question. Under 100 words.`,
      followup2: `Write final follow-up (Day 10). Acknowledge this is the last touch, offer resources, leave door open. Under 80 words.`
    };

    const prompt = `${generateSystemPrompt(brand)}

PROSPECT:
- Company: ${prospect.company}
- Name: ${prospect.firstName}${prospect.lastName ? ' ' + prospect.lastName : ''}
- Title: ${prospect.title || 'Unknown'}
- Industry: ${prospect.industry}
- Trigger: ${prospect.trigger || 'None'}
- Trigger Details: ${prospect.triggerDetails || 'None'}

TASK: ${stagePrompts[stage]}

Return ONLY a JSON object with this exact format:
{"subject": "subject line here", "body": "email body here"}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');

    return JSON.parse(jsonMatch[0]);
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const emails = {
        initial: await generateEmailContent('initial', formData),
        followup1: await generateEmailContent('followup1', formData),
        followup2: await generateEmailContent('followup2', formData)
      };

      setGeneratedEmails(emails);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadAsJson = () => {
    const data = {
      prospect: formData,
      emails: generatedEmails,
      generatedAt: new Date().toISOString(),
      brand: brand.name
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.company.toLowerCase().replace(/\s+/g, '-')}-outreach-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Styles
  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    border: '1px solid rgba(238, 207, 0, 0.2)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.1em',
    color: '#374151',
    marginBottom: '6px',
    textTransform: 'uppercase'
  };

  const buttonStyle = {
    padding: '14px 28px',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.05em',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.yellow,
    color: '#000'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    border: `2px solid ${COLORS.yellow}`,
    color: '#000'
  };

  return (
    <Layout
      onHomeClick={handleHomeClick}
      onFooterToggle={handleFooterToggle}
      onMenuToggle={handleMenuToggle}
      navigationItems={navigationItems}
      pageLabel="OUTREACH"
    >
      <div style={{
        position: 'fixed',
        top: '100px',
        bottom: footerOpen ? '400px' : '40px',
        left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(100px, 8vw)',
        right: '100px',
        zIndex: 61,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out',
        paddingRight: '20px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '30px', animation: 'fadeInUp 0.6s ease-out' }}>
            <h1 style={{
              ...TYPOGRAPHY.h1Scaled,
              color: COLORS.yellow,
              ...EFFECTS.blurLight,
              display: 'inline-block',
              marginBottom: '12px'
            }}>
              OUTREACH GENERATOR
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#4b5563',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              AI-powered cold email generation using the NextPlay.so framework
            </p>
          </div>

          {/* Settings Toggle */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}
            >
              🔑 API Key {showApiKeyInput ? '▲' : '▼'}
            </button>
            <button
              onClick={() => setShowBrandSettings(!showBrandSettings)}
              style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}
            >
              ⚙️ Brand Settings {showBrandSettings ? '▲' : '▼'}
            </button>
          </div>

          {/* API Key Input */}
          {showApiKeyInput && (
            <div style={{ ...cardStyle, borderColor: COLORS.yellow, animation: 'fadeInUp 0.4s ease-out' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                Enter Groq API Key
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Get a free key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                  style={{ color: COLORS.yellow, textDecoration: 'underline' }}>console.groq.com/keys</a>
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gsk_..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={saveApiKey} style={primaryButtonStyle}>
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Brand Settings */}
          {showBrandSettings && (
            <div style={{ ...cardStyle, borderColor: COLORS.yellow, animation: 'fadeInUp 0.4s ease-out' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
                Customize Your Brand
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Personalize the outreach emails with your own brand and sender information.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Company Name</label>
                  <input
                    type="text"
                    value={brand.name}
                    onChange={(e) => setBrand(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your Company"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Your Name</label>
                  <input
                    type="text"
                    value={brand.sender.name}
                    onChange={(e) => setBrand(prev => ({ ...prev, sender: { ...prev.sender, name: e.target.value } }))}
                    placeholder="Jane Smith"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Your Title</label>
                  <input
                    type="text"
                    value={brand.sender.title}
                    onChange={(e) => setBrand(prev => ({ ...prev, sender: { ...prev.sender, title: e.target.value } }))}
                    placeholder="VP of Sales"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Your Email</label>
                  <input
                    type="email"
                    value={brand.sender.email}
                    onChange={(e) => setBrand(prev => ({ ...prev, sender: { ...prev.sender, email: e.target.value } }))}
                    placeholder="jane@company.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Credentials (one per line)</label>
                <textarea
                  value={brand.credentials || ''}
                  onChange={(e) => setBrand(prev => ({ ...prev, credentials: e.target.value }))}
                  placeholder="- 10+ years in sales&#10;- Closed $5M in deals last year&#10;- Former [Company] employee"
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  These will be used sparingly in email generation
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setBrand(DEFAULT_BRAND)}
                  style={{ ...secondaryButtonStyle, padding: '8px 14px', fontSize: '12px' }}
                >
                  Reset to Default
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  Auto-saved
                </div>
              </div>
            </div>
          )}

          {/* Step Indicator */}
          <div style={{
            ...cardStyle,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            animation: 'fadeInUp 0.5s ease-out'
          }}>
            {['Prospect Info', 'Generate', 'Review & Copy'].map((label, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: currentStep > idx + 1 ? '#10b981' : currentStep === idx + 1 ? COLORS.yellow : '#e5e7eb',
                  color: currentStep >= idx + 1 ? '#000' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.3s'
                }}>
                  {currentStep > idx + 1 ? '✓' : idx + 1}
                </div>
                <span style={{
                  marginLeft: '10px',
                  fontSize: '13px',
                  fontWeight: currentStep === idx + 1 ? '600' : '400',
                  color: currentStep === idx + 1 ? '#000' : '#6b7280'
                }}>
                  {label}
                </span>
                {idx < 2 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: currentStep > idx + 1 ? '#10b981' : '#e5e7eb',
                    margin: '0 16px',
                    transition: 'background-color 0.3s'
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Prospect Info */}
          {currentStep === 1 && (
            <div style={{ ...cardStyle, animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>
                Prospect Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Company *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Acme Corp"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Industry</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    style={inputStyle}
                  >
                    <option value="B2B SaaS">B2B SaaS</option>
                    <option value="Fintech">Fintech</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Agency">Agency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Jane"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Smith"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="jane@acme.com"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="VP Marketing"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Trigger Type</label>
                <select
                  name="trigger"
                  value={formData.trigger}
                  onChange={handleInputChange}
                  style={inputStyle}
                >
                  <option value="">Select a trigger...</option>
                  {triggerOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {formData.trigger && formData.trigger !== 'none' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Trigger Details</label>
                  <textarea
                    name="triggerDetails"
                    value={formData.triggerDetails}
                    onChange={handleInputChange}
                    placeholder="e.g., Series B funding announced last week, hiring for RevOps Director..."
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.company || !formData.firstName || !formData.email}
                  style={{
                    ...primaryButtonStyle,
                    opacity: (!formData.company || !formData.firstName || !formData.email) ? 0.5 : 1,
                    cursor: (!formData.company || !formData.firstName || !formData.email) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Generate */}
          {currentStep === 2 && (
            <div style={{ ...cardStyle, animation: 'fadeInUp 0.5s ease-out' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
                Ready to Generate
              </h2>

              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                  Prospect Summary
                </h3>
                <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.8' }}>
                  <div><strong>Company:</strong> {formData.company}</div>
                  <div><strong>Contact:</strong> {formData.firstName} {formData.lastName}</div>
                  <div><strong>Email:</strong> {formData.email}</div>
                  {formData.title && <div><strong>Title:</strong> {formData.title}</div>}
                  <div><strong>Industry:</strong> {formData.industry}</div>
                  {formData.trigger && <div><strong>Trigger:</strong> {triggerOptions.find(t => t.value === formData.trigger)?.label}</div>}
                  {formData.triggerDetails && <div><strong>Details:</strong> {formData.triggerDetails}</div>}
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(238, 207, 0, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                border: '1px solid rgba(238, 207, 0, 0.3)'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  What will be generated:
                </h3>
                <ul style={{ fontSize: '14px', color: '#4b5563', margin: 0, paddingLeft: '20px' }}>
                  <li>Initial cold email (Day 0)</li>
                  <li>Follow-up #1 (Day 3)</li>
                  <li>Follow-up #2 (Day 10)</li>
                </ul>
              </div>

              {error && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#dc2626',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setCurrentStep(1)} style={secondaryButtonStyle}>
                  ← Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !apiKey}
                  style={{
                    ...primaryButtonStyle,
                    opacity: (isGenerating || !apiKey) ? 0.7 : 1,
                    cursor: (isGenerating || !apiKey) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isGenerating ? (
                    <>
                      <span style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid #000',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Generating...
                    </>
                  ) : (
                    'Generate Emails ✨'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Copy */}
          {currentStep === 3 && generatedEmails && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              {/* Action Bar */}
              <div style={{
                ...cardStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <button onClick={() => { setCurrentStep(1); setGeneratedEmails(null); }} style={secondaryButtonStyle}>
                  ← New Prospect
                </button>
                <button onClick={downloadAsJson} style={primaryButtonStyle}>
                  Download JSON ↓
                </button>
              </div>

              {/* Email Cards */}
              {[
                { key: 'initial', label: 'Initial Email', day: 'Day 0' },
                { key: 'followup1', label: 'Follow-up #1', day: 'Day 3' },
                { key: 'followup2', label: 'Follow-up #2', day: 'Day 10' }
              ].map((stage, idx) => (
                <div key={stage.key} style={{ ...cardStyle, animation: `fadeInUp 0.5s ease-out ${0.1 * idx}s both` }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {stage.label}
                      </h3>
                      <span style={{
                        fontSize: '12px',
                        backgroundColor: COLORS.yellow,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '500'
                      }}>
                        {stage.day}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(
                        `Subject: ${generatedEmails[stage.key].subject}\n\n${generatedEmails[stage.key].body}`,
                        idx
                      )}
                      style={{
                        ...secondaryButtonStyle,
                        padding: '8px 16px',
                        fontSize: '13px'
                      }}
                    >
                      {copiedIndex === idx ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ ...labelStyle, marginBottom: '8px' }}>Subject</label>
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#111827'
                    }}>
                      {generatedEmails[stage.key].subject}
                    </div>
                  </div>

                  <div>
                    <label style={{ ...labelStyle, marginBottom: '8px' }}>Body</label>
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      lineHeight: '1.7',
                      color: '#374151',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {generatedEmails[stage.key].body}
                    </div>
                  </div>
                </div>
              ))}

              {/* Footer */}
              <div style={{ height: '100px' }} />
            </div>
          )}

          {/* Initial spacer */}
          {currentStep < 3 && <div style={{ height: '100px' }} />}
        </div>
      </div>
    </Layout>
  );
}

export default OutreachGeneratorPage;
