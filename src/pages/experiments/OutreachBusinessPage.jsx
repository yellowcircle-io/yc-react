import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Layout from '../../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../../styles/constants';

// Password for access (simple client-side protection)
const ACCESS_PASSWORD = 'yc2025outreach';

// Available models
const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Recommended)', description: 'Best quality, fast' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Faster, lighter' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Good alternative' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Google model' }
];

// Brand configuration
const BRAND = {
  name: 'yellowCircle',
  sender: {
    name: 'Chris Cooper',
    title: 'GTM & Marketing Operations Consultant',
    email: 'chris@yellowcircle.co'
  },
  links: {
    calendar: 'https://calendly.com/christophercooper',
    article: 'https://yellowcircle-app.web.app/thoughts/why-your-gtm-sucks',
    website: 'https://yellowcircle-app.web.app'
  },
  systemPrompt: `You are writing cold outreach emails for Christopher Cooper, a GTM and Marketing Operations consultant at yellowCircle.

**VOICE:**
- Direct, no fluff
- Peer-to-peer (not salesy)
- Specific and credible
- Under 150 words for initial, under 100 for follow-ups

**CREDENTIALS (use sparingly):**
- 10+ years in marketing operations across B2B SaaS, fintech, and agencies
- Identified $2.5M/year in hidden operational costs at previous organization
- Reduced attribution setup time by 60%
- Built GTM alignment frameworks adopted by multiple teams

**FRAMEWORK (NextPlay.so 3-part structure):**
1. Who you are (1 sentence)
2. Why reaching out (specific trigger)
3. Why they should care (value prop + easy ask)

**RULES:**
- Never use "I hope this finds you well" or similar
- No corporate jargon
- One clear CTA
- Reference specific trigger when provided
- Sign off as "— Chris"`
};

function OutreachBusinessPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Settings state
  const [settings, setSettings] = useState({
    groqApiKey: '',
    resendApiKey: '',
    selectedModel: 'llama-3.3-70b-versatile',
    enableSending: false,
    fromEmail: 'chris@yellowcircle.co',
    fromName: 'Chris Cooper'
  });
  const [showSettings, setShowSettings] = useState(false);

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
  const [isSending, setIsSending] = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedEmailsToSend, setSelectedEmailsToSend] = useState([]);

  // Load settings and auth from localStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem('outreach_business_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }

    const savedSettings = localStorage.getItem('outreach_business_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse saved settings');
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('outreach_business_settings', JSON.stringify(settings));
    }
  }, [settings, isAuthenticated]);

  // Inject animations
  useEffect(() => {
    const styleId = 'outreach-business-animations';
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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ACCESS_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('outreach_business_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Invalid password');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('outreach_business_auth');
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

    const prompt = `${BRAND.systemPrompt}

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
        'Authorization': `Bearer ${settings.groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.selectedModel,
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

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');

    return JSON.parse(jsonMatch[0]);
  };

  const handleGenerate = async () => {
    if (!settings.groqApiKey) {
      setShowSettings(true);
      setError('Please configure your Groq API key first');
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

  const sendEmail = async (stage, emailData) => {
    if (!settings.resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${settings.fromName} <${settings.fromEmail}>`,
        to: [formData.email],
        subject: emailData.subject,
        text: emailData.body
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'Failed to send email');
    }

    return await response.json();
  };

  const handleSendSelected = async () => {
    if (selectedEmailsToSend.length === 0) {
      setError('Please select at least one email to send');
      return;
    }

    if (!settings.resendApiKey) {
      setShowSettings(true);
      setError('Please configure your Resend API key first');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      for (const stage of selectedEmailsToSend) {
        await sendEmail(stage, generatedEmails[stage]);
      }
      setSuccessMessage(`Successfully sent ${selectedEmailsToSend.length} email(s) to ${formData.email}`);
      setSelectedEmailsToSend([]);
    } catch (err) {
      setError(`Failed to send: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const toggleEmailSelection = (stage) => {
    setSelectedEmailsToSend(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
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
      model: settings.selectedModel,
      brand: BRAND.name
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.company.toLowerCase().replace(/\s+/g, '-')}-outreach-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navigationItems = [];

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

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
    color: '#fff'
  };

  // Password Screen
  if (!isAuthenticated) {
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
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100
        }}>
          <div style={{
            ...cardStyle,
            width: '400px',
            maxWidth: '90vw',
            textAlign: 'center',
            animation: 'fadeInUp 0.5s ease-out'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: COLORS.yellow,
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🔐
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
              Business Access
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              Enter password to access the outreach generator
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Password"
                style={{
                  ...inputStyle,
                  textAlign: 'center',
                  marginBottom: '16px',
                  animation: authError ? 'shake 0.5s ease-out' : 'none'
                }}
                autoFocus
              />
              {authError && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
                  {authError}
                </p>
              )}
              <button type="submit" style={{ ...primaryButtonStyle, width: '100%', justifyContent: 'center' }}>
                Access
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

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
        top: '80px',
        bottom: footerOpen ? '400px' : '40px',
        left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(80px, 6vw)',
        right: '80px',
        zIndex: 61,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out',
        paddingRight: '20px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Header with Settings Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '30px',
            animation: 'fadeInUp 0.6s ease-out'
          }}>
            <div>
              <h1 style={{
                ...TYPOGRAPHY.h1Scaled,
                color: COLORS.yellow,
                ...EFFECTS.blurLight,
                display: 'inline-block',
                marginBottom: '12px'
              }}>
                OUTREACH PRO
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                Business version with sending capabilities
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  ...secondaryButtonStyle,
                  padding: '10px 16px',
                  fontSize: '13px'
                }}
              >
                ⚙️ Settings
              </button>
              <button
                onClick={handleLogout}
                style={{
                  ...buttonStyle,
                  padding: '10px 16px',
                  fontSize: '13px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280'
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div style={{
              ...cardStyle,
              borderColor: COLORS.yellow,
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  Configuration
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#9ca3af'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* AI Settings */}
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    AI Generation (Groq)
                  </h3>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>API Key</label>
                    <input
                      type="password"
                      name="groqApiKey"
                      value={settings.groqApiKey}
                      onChange={handleSettingsChange}
                      placeholder="gsk_..."
                      style={inputStyle}
                    />
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.yellow }}>
                        Get free key →
                      </a>
                    </p>
                  </div>

                  <div>
                    <label style={labelStyle}>Model</label>
                    <select
                      name="selectedModel"
                      value={settings.selectedModel}
                      onChange={handleSettingsChange}
                      style={inputStyle}
                    >
                      {GROQ_MODELS.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                      {GROQ_MODELS.find(m => m.id === settings.selectedModel)?.description}
                    </p>
                  </div>
                </div>

                {/* Email Settings */}
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Email Sending (Resend)
                  </h3>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        name="enableSending"
                        checked={settings.enableSending}
                        onChange={handleSettingsChange}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable Email Sending
                    </label>
                  </div>

                  {settings.enableSending && (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Resend API Key</label>
                        <input
                          type="password"
                          name="resendApiKey"
                          value={settings.resendApiKey}
                          onChange={handleSettingsChange}
                          placeholder="re_..."
                          style={inputStyle}
                        />
                        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                          <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.yellow }}>
                            Get API key →
                          </a>
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={labelStyle}>From Name</label>
                          <input
                            type="text"
                            name="fromName"
                            value={settings.fromName}
                            onChange={handleSettingsChange}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>From Email</label>
                          <input
                            type="email"
                            name="fromEmail"
                            value={settings.fromEmail}
                            onChange={handleSettingsChange}
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Status indicators */}
              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: settings.groqApiKey ? '#10b981' : '#9ca3af'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: settings.groqApiKey ? '#10b981' : '#e5e7eb'
                  }} />
                  Groq {settings.groqApiKey ? 'configured' : 'not configured'}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: settings.enableSending && settings.resendApiKey ? '#10b981' : '#9ca3af'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: settings.enableSending && settings.resendApiKey ? '#10b981' : '#e5e7eb'
                  }} />
                  Resend {settings.enableSending && settings.resendApiKey ? 'configured' : 'disabled'}
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
            {['Prospect Info', 'Generate', 'Review & Send'].map((label, idx) => (
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

          {/* Error/Success Messages */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: '#dc2626',
              fontSize: '14px',
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: '#16a34a',
              fontSize: '14px',
              animation: 'fadeInUp 0.3s ease-out'
            }}>
              {successMessage}
            </div>
          )}

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
                marginBottom: '16px',
                border: '1px solid rgba(238, 207, 0, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                      Model: {GROQ_MODELS.find(m => m.id === settings.selectedModel)?.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                      Will generate: Initial + 2 follow-ups
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSettings(true)}
                    style={{ fontSize: '12px', color: COLORS.yellow, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Change →
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setCurrentStep(1)} style={secondaryButtonStyle}>
                  ← Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !settings.groqApiKey}
                  style={{
                    ...primaryButtonStyle,
                    opacity: (isGenerating || !settings.groqApiKey) ? 0.7 : 1,
                    cursor: (isGenerating || !settings.groqApiKey) ? 'not-allowed' : 'pointer'
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

          {/* Step 3: Review & Send */}
          {currentStep === 3 && generatedEmails && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              {/* Action Bar */}
              <div style={{
                ...cardStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <button onClick={() => { setCurrentStep(1); setGeneratedEmails(null); setSelectedEmailsToSend([]); }} style={secondaryButtonStyle}>
                  ← New Prospect
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={downloadAsJson} style={secondaryButtonStyle}>
                    Download JSON
                  </button>
                  {settings.enableSending && settings.resendApiKey && (
                    <button
                      onClick={handleSendSelected}
                      disabled={isSending || selectedEmailsToSend.length === 0}
                      style={{
                        ...dangerButtonStyle,
                        opacity: (isSending || selectedEmailsToSend.length === 0) ? 0.5 : 1,
                        cursor: (isSending || selectedEmailsToSend.length === 0) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSending ? 'Sending...' : `Send Selected (${selectedEmailsToSend.length})`}
                    </button>
                  )}
                </div>
              </div>

              {/* Email Cards */}
              {[
                { key: 'initial', label: 'Initial Email', day: 'Day 0' },
                { key: 'followup1', label: 'Follow-up #1', day: 'Day 3' },
                { key: 'followup2', label: 'Follow-up #2', day: 'Day 10' }
              ].map((stage, idx) => (
                <div key={stage.key} style={{
                  ...cardStyle,
                  animation: `fadeInUp 0.5s ease-out ${0.1 * idx}s both`,
                  borderColor: selectedEmailsToSend.includes(stage.key) ? '#ef4444' : 'rgba(238, 207, 0, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {settings.enableSending && settings.resendApiKey && (
                        <input
                          type="checkbox"
                          checked={selectedEmailsToSend.includes(stage.key)}
                          onChange={() => toggleEmailSelection(stage.key)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      )}
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

              <div style={{ height: '100px' }} />
            </div>
          )}

          {currentStep < 3 && <div style={{ height: '100px' }} />}
        </div>
      </div>
    </Layout>
  );
}

export default OutreachBusinessPage;
