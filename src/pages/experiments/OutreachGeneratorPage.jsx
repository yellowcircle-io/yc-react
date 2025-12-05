import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Layout from '../../components/global/Layout';
import LeadGate from '../../components/shared/LeadGate';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../../styles/constants';
import { navigationItems } from '../../config/navigationItems';

// Adapter imports - hot-swappable LLM, ESP, and storage
import { getLLMAdapter, getESPAdapter, getStorageAdapter } from '../../adapters';

// Backend proxy for free generation (no API key required)
import { generateViaProxy, shouldUseProxy } from '../../utils/generateProxy';

// Send mode types
const SEND_MODES = {
  PROSPECT: 'prospect',  // Cold outreach to prospects
  MARCOM: 'marcom',      // Marketing communications (warmer, brand-focused)
};

// Pathway types - what to do after generation
const PATHWAYS = {
  ONE_OFF: 'one-off',       // Generate + Send NOW via Resend
  THREE_EMAIL: 'three-email', // Generate 3-part sequence, copy/download
  JOURNEY: 'journey',        // Deploy to UnityMAP for campaign orchestration
};

// Default brand configuration with yellowCircle test data
const DEFAULT_BRAND = {
  name: 'yellowCircle',
  sender: {
    name: 'Chris Cooper',
    title: 'Founder & GTM Strategist',
    email: 'chris@yellowcircle.io'
  },
  credentials: '- 15+ years in marketing operations\n- Former Estée Lauder, Reddit, Rho Technologies\n- Specialist in GTM infrastructure',
  links: {
    calendar: 'https://calendly.com/christophercooper',
    article: 'https://yellowcircle.io/thoughts/why-your-gtm-sucks',
    website: 'https://yellowcircle.io'
  },
  colors: {
    primary: '#EECF00',     // Brand primary color
    secondary: '#1a1a1a',   // Dark background
    text: '#333333',        // Body text
    accent: '#000000'       // Accent/heading color
  }
};

// Default prospect data for quick testing
const DEFAULT_PROSPECT = {
  company: 'Acme Corp',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@acme.com',
  title: 'VP Marketing',
  industry: 'B2B SaaS',
  trigger: 'funding',
  triggerDetails: 'Series B funding announced last week, expanding GTM team'
};

// Generate system prompt based on user's brand config and send mode
const generateSystemPrompt = (brand, sendMode = SEND_MODES.PROSPECT) => {
  const isProspect = sendMode === SEND_MODES.PROSPECT;

  const voiceGuidelines = isProspect
    ? `**VOICE (Cold Outreach):**
- Direct, no fluff
- Peer-to-peer (not salesy)
- Specific and credible
- Under 150 words for initial, under 100 for follow-ups`
    : `**VOICE (Marketing Communications):**
- Professional but warm
- Brand-aligned and polished
- Educational and value-focused
- Clear call-to-action without being pushy`;

  const structureGuidelines = isProspect
    ? `**STRUCTURE:**
1. Who you are (1 sentence)
2. Why reaching out (specific trigger)
3. Why they should care (value prop + easy ask)`
    : `**STRUCTURE:**
1. Engaging hook relevant to recipient
2. Value proposition or educational content
3. Clear next step or CTA`;

  return `You are writing ${isProspect ? 'cold outreach' : 'marketing'} emails${brand.sender.name ? ` for ${brand.sender.name}` : ''}${brand.sender.title ? `, ${brand.sender.title}` : ''}${brand.name ? ` at ${brand.name}` : ''}.

${voiceGuidelines}

**CREDENTIALS (use sparingly):**
${brand.credentials || '- Experienced professional in their field'}

${structureGuidelines}

**RULES:**
- Never use "I hope this finds you well" or similar
- No corporate jargon
- One clear CTA
- Reference specific trigger when provided
${brand.sender.name ? `- Sign off as "— ${brand.sender.name.split(' ')[0]}"` : '- Sign off with a simple closing'}`;
};

function OutreachGeneratorPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const [formError, setFormError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [resendApiKey, setResendApiKey] = useState('');
  const [showResendKeyInput, setShowResendKeyInput] = useState(false);
  const [showBrandSettings, setShowBrandSettings] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewEmail, setPreviewEmail] = useState(null);

  // Send mode: prospect (cold) vs marcom (marketing communications)
  const [sendMode, setSendMode] = useState(SEND_MODES.PROSPECT);

  // Pathway: what to do after generation
  const [pathway, setPathway] = useState(PATHWAYS.THREE_EMAIL);

  // Tiered credits system: 3 free, 10 with API key, unlimited for clients
  const FREE_CREDITS = 3;
  const API_KEY_CREDITS = 10;
  const [freeCreditsRemaining, setFreeCreditsRemaining] = useState(FREE_CREDITS);
  const [apiKeyCreditsRemaining, setApiKeyCreditsRemaining] = useState(API_KEY_CREDITS);
  const [isClient, setIsClient] = useState(false);

  // Backwards compatibility alias
  const creditsRemaining = apiKey ? apiKeyCreditsRemaining : freeCreditsRemaining;

  // Email validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Brand customization state
  const [brand, setBrand] = useState(DEFAULT_BRAND);

  // Load API key, brand, and credits from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }

    // Load Resend API key for sending
    const savedResendKey = localStorage.getItem('resend_api_key');
    if (savedResendKey) {
      setResendApiKey(savedResendKey);
    }

    // Load credits
    const savedFreeCredits = localStorage.getItem('outreach_free_credits');
    if (savedFreeCredits !== null) {
      setFreeCreditsRemaining(parseInt(savedFreeCredits, 10));
    }

    // Load API key credits
    const savedApiKeyCredits = localStorage.getItem('outreach_apikey_credits');
    if (savedApiKeyCredits !== null) {
      setApiKeyCreditsRemaining(parseInt(savedApiKeyCredits, 10));
    }

    // Check client status (elevated access)
    const clientStatus = localStorage.getItem('yc_client_access');
    if (clientStatus) {
      setIsClient(true);
    }

    const savedBrand = localStorage.getItem('outreach_brand_config');
    if (savedBrand) {
      try {
        setBrand(JSON.parse(savedBrand));
      } catch (e) {
        console.error('Failed to parse saved brand config');
      }
    }

    // Show API key input only if no free credits AND no API key
    if (!savedKey && savedFreeCredits !== null && parseInt(savedFreeCredits, 10) <= 0) {
      setShowApiKeyInput(true);
    }

    // Check if coming from UnityMAP with edit context
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'unity-map' && urlParams.get('edit') === 'true') {
      const editContext = localStorage.getItem('outreach-edit-context');
      if (editContext) {
        try {
          const context = JSON.parse(editContext);
          if (context.prospectInfo) {
            setFormData(prev => ({
              ...prev,
              ...context.prospectInfo
            }));
          }
          // Clear the edit context after loading
          localStorage.removeItem('outreach-edit-context');
          // Show a brief notification
          setTimeout(() => {
            setFormError('');
          }, 100);
        } catch (e) {
          console.error('Failed to parse edit context');
        }
      }
    }
  }, []);

  // Check if user can generate (tiered: clients unlimited, API key 10, free 3)
  const canGenerate = isClient || (apiKey && apiKeyCreditsRemaining > 0) || freeCreditsRemaining > 0;

  // Use a credit (tiered system)
  const useCredit = () => {
    if (isClient) return; // Clients don't use credits

    if (apiKey) {
      // API key users have limited credits
      const newCredits = Math.max(0, apiKeyCreditsRemaining - 1);
      setApiKeyCreditsRemaining(newCredits);
      localStorage.setItem('outreach_apikey_credits', newCredits.toString());
    } else {
      // Free users
      const newCredits = Math.max(0, freeCreditsRemaining - 1);
      setFreeCreditsRemaining(newCredits);
      localStorage.setItem('outreach_free_credits', newCredits.toString());
    }
  };

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
    // Clear form error when user starts typing
    if (formError) setFormError('');
  };

  // Load test data for quick testing
  const loadTestData = () => {
    setFormData(DEFAULT_PROSPECT);
    setBrand(DEFAULT_BRAND);
    setFormError('');
  };

  // Reset/restart the entire flow
  const handleRestart = () => {
    setFormData({
      company: '',
      firstName: '',
      lastName: '',
      email: '',
      title: '',
      industry: 'B2B SaaS',
      trigger: '',
      triggerDetails: ''
    });
    setCurrentStep(1);
    setGeneratedEmails(null);
    setError(null);
    setFormError('');
    setSendSuccess(null);
    setShowPreview(false);
    setPreviewEmail(null);
  };

  const handleContinueToStep2 = () => {
    setFormError('');
    if (!formData.company.trim()) {
      setFormError('Company name is required');
      return;
    }
    if (!formData.firstName.trim()) {
      setFormError('First name is required');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email address is required');
      return;
    }
    if (!validateEmail(formData.email)) {
      setFormError('Please enter a valid email address');
      return;
    }
    setCurrentStep(2);
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('groq_api_key', apiKey.trim());
      setShowApiKeyInput(false);
    }
  };

  const saveResendApiKey = () => {
    if (resendApiKey.trim()) {
      localStorage.setItem('resend_api_key', resendApiKey.trim());
      setShowResendKeyInput(false);
    }
  };

  const triggerOptions = [
    { value: 'funding', label: 'Recent Funding' },
    { value: 'hiring', label: 'Hiring for Marketing/Ops Role' },
    { value: 'content', label: 'LinkedIn Post/Content' },
    { value: 'news', label: 'Company News/Announcement' },
    { value: 'none', label: 'No Specific Trigger' }
  ];

  // Generate email content using adapter (hot-swappable LLM)
  const generateEmailContent = useCallback(async (stage, prospect, mode = sendMode) => {
    const isProspect = mode === SEND_MODES.PROSPECT;

    const stagePrompts = {
      initial: isProspect
        ? `Write an initial cold email (Day 0) for this prospect. Keep it under 150 words.`
        : `Write an engaging marketing email introducing our solution. Professional but warm. Under 150 words.`,
      followup1: isProspect
        ? `Write follow-up #1 (Day 3). Reference the previous email without repeating it. Add value with a diagnostic question. Under 100 words.`
        : `Write a follow-up marketing email (Day 3) with educational content. Reference value proposition. Under 100 words.`,
      followup2: isProspect
        ? `Write final follow-up (Day 10). Acknowledge this is the last touch, offer resources, leave door open. Under 80 words.`
        : `Write a final nurture email (Day 10) with a clear CTA. Leave door open. Under 80 words.`,
      single: isProspect
        ? `Write a single, compelling cold outreach email. Get straight to the point. Include a clear CTA. Under 150 words.`
        : `Write a single marketing email that provides value and includes a clear call-to-action. Under 150 words.`
    };

    const prompt = `RECIPIENT:
- Company: ${prospect.company}
- Name: ${prospect.firstName}${prospect.lastName ? ' ' + prospect.lastName : ''}
- Title: ${prospect.title || 'Unknown'}
- Industry: ${prospect.industry}
- Trigger: ${prospect.trigger || 'None'}
- Trigger Details: ${prospect.triggerDetails || 'None'}

TASK: ${stagePrompts[stage]}

Return ONLY a JSON object with this exact format:
{"subject": "subject line here", "body": "email body here"}`;

    let response;

    // Check if we should use the backend proxy (no user API key + free credits)
    if (shouldUseProxy(apiKey, freeCreditsRemaining)) {
      // Use backend proxy for free generation
      const proxyResult = await generateViaProxy(
        `${generateSystemPrompt(brand, mode)}\n\n${prompt}`,
        stage,
        { prospect, mode }
      );

      if (!proxyResult.success) {
        // Handle proxy errors
        if (proxyResult.rateLimited) {
          setFreeCreditsRemaining(0);
          localStorage.setItem('outreach_free_credits', '0');
          setShowApiKeyInput(true);
        }
        throw new Error(proxyResult.error || 'Generation failed');
      }

      response = proxyResult.content;

      // Update credits from proxy response
      if (typeof proxyResult.creditsRemaining === 'number') {
        setFreeCreditsRemaining(proxyResult.creditsRemaining);
        localStorage.setItem('outreach_free_credits', String(proxyResult.creditsRemaining));
      }
    } else {
      // Use direct LLM adapter with user's API key
      const llm = await getLLMAdapter();
      response = await llm.generate(prompt, {
        apiKey: apiKey || undefined,
        systemPrompt: generateSystemPrompt(brand, mode),
        temperature: 0.7,
        maxTokens: 500,
      });
    }

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');

    return JSON.parse(jsonMatch[0]);
  }, [apiKey, brand, sendMode, freeCreditsRemaining]);

  // Send email via ESP adapter (Resend)
  const sendEmailNow = useCallback(async (emailData, recipientEmail) => {
    setIsSending(true);
    setSendSuccess(null);
    setError(null);

    try {
      const esp = await getESPAdapter();

      // Check if ESP is configured (user's key OR .env key)
      const hasResendKey = resendApiKey || esp.isConfigured();
      if (!hasResendKey) {
        setShowResendKeyInput(true);
        throw new Error('Email sending requires a Resend API key. Enter your key below or get one free at resend.com/api-keys');
      }

      // Convert plain text body to HTML (simple paragraphs)
      const htmlBody = emailData.body
        .split('\n\n')
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');

      const result = await esp.sendEmail({
        to: recipientEmail,
        subject: emailData.subject,
        html: htmlBody,
        text: emailData.body,
        replyTo: brand.sender.email || undefined,
        apiKey: resendApiKey || undefined, // Use user's key if provided
        tags: [
          { name: 'source', value: 'outreach-generator' },
          { name: 'mode', value: sendMode },
        ],
      });

      if (result.status === 'sent') {
        setSendSuccess({
          id: result.id,
          to: recipientEmail,
          subject: emailData.subject,
        });

        // Save to storage for tracking
        try {
          const storage = await getStorageAdapter();
          await storage.contacts.update(recipientEmail, {
            lastEmailSent: new Date().toISOString(),
            emailsSent: 1, // This would be incremented in a real implementation
            stage: sendMode === SEND_MODES.PROSPECT ? 'contacted' : 'nurtured',
          });
        } catch (storageErr) {
          console.warn('Failed to update contact in storage:', storageErr.message);
        }

        return result;
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsSending(false);
    }
  }, [brand, sendMode, resendApiKey]);

  const handleGenerate = async () => {
    // Check if user can generate
    if (!canGenerate) {
      setShowApiKeyInput(true);
      setError('You\'ve used all free credits. Enter an API key to continue.');
      return;
    }

    // Check if LLM is configured (either user's key or .env key)
    const hasEnvKey = import.meta.env.VITE_GROQ_API_KEY ||
                      import.meta.env.VITE_OPENAI_API_KEY ||
                      import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey && !hasEnvKey && creditsRemaining > 0) {
      setShowApiKeyInput(true);
      setError('Please enter your API key to generate emails.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSendSuccess(null);

    try {
      let emails;

      // Generate based on pathway
      if (pathway === PATHWAYS.ONE_OFF) {
        // Single email only
        const single = await generateEmailContent('single', formData);
        emails = { single };
      } else {
        // Three-email sequence (for three-email and journey pathways)
        emails = {
          initial: await generateEmailContent('initial', formData),
          followup1: await generateEmailContent('followup1', formData),
          followup2: await generateEmailContent('followup2', formData)
        };
      }

      // Use a credit on successful generation
      useCredit();

      // Save prospect to storage (for closed-loop tracking)
      try {
        const storage = await getStorageAdapter();
        await storage.contacts.create({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName || '',
          company: formData.company,
          title: formData.title || '',
          industry: formData.industry,
          stage: 'prospect',
          source: 'outreach_generator',
          sendMode: sendMode,
          pathway: pathway,
          trigger: formData.trigger || '',
          triggerDetails: formData.triggerDetails || '',
          generatedEmails: emails,
        });
      } catch (storageErr) {
        // Don't fail the whole operation if storage fails
        console.warn('Failed to save prospect to storage:', storageErr.message);
      }

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

  // Generate branded email HTML template - Distinct for Prospect vs MarCom
  const generateBrandedEmailHTML = (emailData, recipientName, recipientEmail, mode = sendMode) => {
    const colors = brand.colors || DEFAULT_BRAND.colors;
    const isProspect = mode === SEND_MODES.PROSPECT;

    const bodyHTML = emailData.body
      .split('\n\n')
      .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    // PROSPECT TEMPLATE: Minimal, plain-text style (personal cold outreach)
    if (isProspect) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailData.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f9fafb;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Simple header line -->
          <tr>
            <td style="border-top: 3px solid ${colors.primary}; padding: 32px 40px 24px;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Subject</p>
              <h2 style="margin: 0; font-size: 16px; font-weight: 600; color: ${colors.accent};">${emailData.subject}</h2>
              <p style="margin: 8px 0 0; font-size: 13px; color: #6b7280;">To: ${recipientName} &lt;${recipientEmail}&gt;</p>
            </td>
          </tr>
          <!-- Email Body - Plain text style -->
          <tr>
            <td style="padding: 0 40px 32px; font-size: 14px; color: ${colors.text}; line-height: 1.7;">
              ${bodyHTML}
            </td>
          </tr>
          <!-- Simple signature -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 2px; font-size: 14px; font-weight: 600; color: ${colors.accent};">${brand.sender?.name || 'Your Name'}</p>
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">${brand.sender?.title || 'Title'} • ${brand.name || 'Company'}</p>
              ${brand.sender?.email ? `<p style="margin: 0; font-size: 13px; color: #6b7280;">${brand.sender.email}</p>` : ''}
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; font-size: 10px; color: #9ca3af;">Cold Outreach • ${brand.name || 'Outreach Generator'}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }

    // MARCOM TEMPLATE: Branded, designed (marketing communications)
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailData.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          <!-- Branded Header -->
          <tr>
            <td style="background-color: ${colors.primary}; padding: 24px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 900; color: ${colors.accent}; letter-spacing: -1px;">
                      ${brand.name || 'Your Brand'}
                    </h1>
                  </td>
                  <td align="right" style="font-size: 12px; color: rgba(0,0,0,0.6);">
                    ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Subject Line -->
          <tr>
            <td style="padding: 32px 40px 16px; border-bottom: 1px solid #eee;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.1em;">Subject</p>
              <h2 style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; color: #111;">
                ${emailData.subject}
              </h2>
              <p style="margin: 8px 0 0; font-size: 13px; color: #666;">To: ${recipientName} &lt;${recipientEmail}&gt;</p>
            </td>
          </tr>
          <!-- Email Body -->
          <tr>
            <td style="padding: 32px 40px; font-size: 15px; color: ${colors.text};">
              ${bodyHTML}
            </td>
          </tr>
          <!-- CTA Button -->
          ${brand.links?.calendar ? `
          <tr>
            <td style="padding: 0 40px 32px;" align="center">
              <a href="${brand.links.calendar}" style="display: inline-block; padding: 14px 32px; background-color: ${colors.primary}; color: ${colors.accent}; text-decoration: none; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; border-radius: 6px;">Schedule a Call</a>
            </td>
          </tr>
          ` : ''}
          <!-- Branded Footer -->
          <tr>
            <td style="background-color: ${colors.secondary}; padding: 24px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: ${colors.primary};">
                      ${brand.sender?.name || 'Your Name'}
                    </p>
                    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.7);">
                      ${brand.sender?.title || 'Title'} • ${brand.name || 'Company'}
                    </p>
                  </td>
                  <td align="right">
                    ${brand.links?.website ? `<a href="${brand.links.website}" style="display: inline-block; padding: 8px 16px; background-color: ${colors.primary}; color: ${colors.accent}; text-decoration: none; font-size: 12px; font-weight: 600; border-radius: 4px;">Visit Site</a>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin: 24px 0 0; font-size: 11px; color: #999; text-align: center;">Marketing Communication • ${brand.name || 'Brand'}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  // Open preview modal
  const openEmailPreview = (emailData, recipientName = formData.firstName, recipientEmail = formData.email) => {
    setPreviewEmail({
      html: generateBrandedEmailHTML(emailData, `${recipientName} ${formData.lastName || ''}`.trim(), recipientEmail),
      subject: emailData.subject
    });
    setShowPreview(true);
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

  const downloadAsMarkdown = () => {
    let md = `# Outreach Sequence for ${formData.company}\n\n`;
    md += `**Prospect:** ${formData.firstName} ${formData.lastName || ''} (${formData.email})\n`;
    md += `**Title:** ${formData.title || 'N/A'}\n`;
    md += `**Industry:** ${formData.industry}\n`;
    if (formData.trigger) md += `**Trigger:** ${triggerOptions.find(t => t.value === formData.trigger)?.label}\n`;
    md += `\n---\n\n`;

    const stages = [
      { key: 'initial', label: 'Initial Email (Day 0)' },
      { key: 'followup1', label: 'Follow-up #1 (Day 3)' },
      { key: 'followup2', label: 'Follow-up #2 (Day 10)' }
    ];

    stages.forEach(stage => {
      if (generatedEmails[stage.key]) {
        md += `## ${stage.label}\n\n`;
        md += `**Subject:** ${generatedEmails[stage.key].subject}\n\n`;
        md += `${generatedEmails[stage.key].body}\n\n`;
        md += `---\n\n`;
      }
    });

    md += `*Generated on ${new Date().toLocaleDateString()}*\n`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.company.toLowerCase().replace(/\s+/g, '-')}-outreach.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsDoc = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Outreach Sequence - ${formData.company}</title></head><body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px;">`;
    html += `<h1>Outreach Sequence for ${formData.company}</h1>`;
    html += `<p><strong>Prospect:</strong> ${formData.firstName} ${formData.lastName || ''} (${formData.email})</p>`;
    html += `<p><strong>Title:</strong> ${formData.title || 'N/A'}</p>`;
    html += `<p><strong>Industry:</strong> ${formData.industry}</p>`;
    if (formData.trigger) html += `<p><strong>Trigger:</strong> ${triggerOptions.find(t => t.value === formData.trigger)?.label}</p>`;
    html += `<hr>`;

    const stages = [
      { key: 'initial', label: 'Initial Email (Day 0)' },
      { key: 'followup1', label: 'Follow-up #1 (Day 3)' },
      { key: 'followup2', label: 'Follow-up #2 (Day 10)' }
    ];

    stages.forEach(stage => {
      if (generatedEmails[stage.key]) {
        html += `<h2>${stage.label}</h2>`;
        html += `<p><strong>Subject:</strong> ${generatedEmails[stage.key].subject}</p>`;
        html += `<div style="background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${generatedEmails[stage.key].body}</div>`;
        html += `<hr>`;
      }
    });

    html += `<p style="color: #888; font-size: 12px;"><em>Generated on ${new Date().toLocaleDateString()}</em></p>`;
    html += `</body></html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.company.toLowerCase().replace(/\s+/g, '-')}-outreach.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Deploy to UnityNotes - creates a journey/campaign
  const deployToUnityNotes = () => {
    if (!generatedEmails) return;

    const UNITY_STORAGE_KEY = 'unity-notes-data';
    const timestamp = Date.now();

    // Create nodes for the outreach campaign (using textNode type for editability)
    const campaignNodes = [
      // Campaign header node
      {
        id: `outreach-${timestamp}-header`,
        type: 'textNode',
        position: { x: 100, y: 50 },
        data: {
          title: `📧 ${formData.company} Outreach`,
          content: `**Prospect:** ${formData.firstName} ${formData.lastName || ''}\n**Email:** ${formData.email}\n**Title:** ${formData.title || 'N/A'}\n**Industry:** ${formData.industry}\n${formData.trigger ? `**Trigger:** ${triggerOptions.find(t => t.value === formData.trigger)?.label}` : ''}\n\n*Generated ${new Date().toLocaleDateString()}*`,
          color: '#EECF00',
          createdAt: timestamp
        }
      },
      // Day 0 - Initial Email
      {
        id: `outreach-${timestamp}-day0`,
        type: 'textNode',
        position: { x: 100, y: 250 },
        data: {
          title: '📬 Day 0: Initial Email',
          content: `**Subject:** ${generatedEmails.initial.subject}\n\n${generatedEmails.initial.body}`,
          color: '#10b981',
          createdAt: timestamp
        }
      },
      // Day 3 - Follow-up #1
      {
        id: `outreach-${timestamp}-day3`,
        type: 'textNode',
        position: { x: 100, y: 450 },
        data: {
          title: '📬 Day 3: Follow-up #1',
          content: `**Subject:** ${generatedEmails.followup1.subject}\n\n${generatedEmails.followup1.body}`,
          color: '#3b82f6',
          createdAt: timestamp
        }
      },
      // Day 10 - Follow-up #2
      {
        id: `outreach-${timestamp}-day10`,
        type: 'textNode',
        position: { x: 100, y: 650 },
        data: {
          title: '📬 Day 10: Follow-up #2',
          content: `**Subject:** ${generatedEmails.followup2.subject}\n\n${generatedEmails.followup2.body}`,
          color: '#8b5cf6',
          createdAt: timestamp
        }
      }
    ];

    // Create edges connecting the sequence
    const campaignEdges = [
      { id: `e-${timestamp}-0`, source: `outreach-${timestamp}-header`, target: `outreach-${timestamp}-day0` },
      { id: `e-${timestamp}-1`, source: `outreach-${timestamp}-day0`, target: `outreach-${timestamp}-day3` },
      { id: `e-${timestamp}-2`, source: `outreach-${timestamp}-day3`, target: `outreach-${timestamp}-day10` }
    ];

    // Get existing UnityNotes data or create new
    let existingData = { nodes: [], edges: [] };
    try {
      const saved = localStorage.getItem(UNITY_STORAGE_KEY);
      if (saved) {
        existingData = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse UnityNotes data');
    }

    // Offset new nodes if there are existing ones
    if (existingData.nodes.length > 0) {
      const offsetX = 400; // Place new campaign to the right
      campaignNodes.forEach(node => {
        node.position.x += offsetX;
      });
    }

    // Merge with existing data
    const mergedData = {
      nodes: [...existingData.nodes, ...campaignNodes],
      edges: [...existingData.edges, ...campaignEdges]
    };

    // Save to UnityNotes storage
    localStorage.setItem(UNITY_STORAGE_KEY, JSON.stringify(mergedData));

    // Set deployment timestamp for progressive disclosure in UnityModeSelector
    localStorage.setItem('unity-last-outreach-deployment', timestamp.toString());

    // Store context for slide-in panel in UnityMAP
    localStorage.setItem('unity-outreach-context', JSON.stringify({
      prospect: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        company: formData.company,
        title: formData.title,
        industry: formData.industry,
      },
      sendMode: sendMode,
      pathway: pathway,
      trigger: formData.trigger,
      triggerDetails: formData.triggerDetails,
      generatedAt: new Date().toISOString(),
    }));

    // Navigate to UnityNotes with mode=map and from=outreach
    navigate('/unity-notes?mode=map&from=outreach');
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
    <LeadGate
      toolName="Outreach Generator"
      toolDescription="Generate personalized cold outreach emails with AI. Enter your email to get instant access."
      storageKey="yc_outreach_lead"
    >
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
        bottom: footerOpen ? '320px' : '40px',
        left: sidebarOpen ? 'min(35vw, 472px)' : '80px',
        right: 0,
        padding: isMobile ? '0 20px' : '0 80px',
        zIndex: 61,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '20px', animation: 'fadeInUp 0.6s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
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
                  {pathway === PATHWAYS.ONE_OFF
                    ? 'Generate & send a single email'
                    : pathway === PATHWAYS.JOURNEY
                      ? 'Generate sequence for campaign orchestration'
                      : 'AI-powered email sequence generation'}
                </p>
              </div>
            </div>
          </div>

          {/* Mode & Pathway Selectors */}
          <div style={{
            ...cardStyle,
            marginBottom: '16px',
            animation: 'fadeInUp 0.5s ease-out 0.05s both'
          }}>
            {/* Send Mode Toggle */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>EMAIL TYPE</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setSendMode(SEND_MODES.PROSPECT)}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    padding: '12px 16px',
                    backgroundColor: sendMode === SEND_MODES.PROSPECT ? COLORS.yellow : 'transparent',
                    border: `2px solid ${sendMode === SEND_MODES.PROSPECT ? COLORS.yellow : '#e5e7eb'}`,
                    color: sendMode === SEND_MODES.PROSPECT ? '#000' : '#6b7280',
                    fontWeight: sendMode === SEND_MODES.PROSPECT ? '600' : '500',
                  }}
                >
                  <span style={{ marginRight: '6px' }}>🎯</span>
                  Prospect
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '400', marginTop: '2px', opacity: 0.8 }}>
                    Cold outreach
                  </span>
                </button>
                <button
                  onClick={() => setSendMode(SEND_MODES.MARCOM)}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    padding: '12px 16px',
                    backgroundColor: sendMode === SEND_MODES.MARCOM ? COLORS.yellow : 'transparent',
                    border: `2px solid ${sendMode === SEND_MODES.MARCOM ? COLORS.yellow : '#e5e7eb'}`,
                    color: sendMode === SEND_MODES.MARCOM ? '#000' : '#6b7280',
                    fontWeight: sendMode === SEND_MODES.MARCOM ? '600' : '500',
                  }}
                >
                  <span style={{ marginRight: '6px' }}>📣</span>
                  MarCom
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '400', marginTop: '2px', opacity: 0.8 }}>
                    Marketing comms
                  </span>
                </button>
              </div>
            </div>

            {/* Pathway Selector */}
            <div>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>PATHWAY</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <button
                  onClick={() => setPathway(PATHWAYS.ONE_OFF)}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    minWidth: isMobile ? '100%' : 'auto',
                    padding: '12px 14px',
                    backgroundColor: pathway === PATHWAYS.ONE_OFF ? COLORS.yellow : 'transparent',
                    border: `2px solid ${pathway === PATHWAYS.ONE_OFF ? COLORS.yellow : '#e5e7eb'}`,
                    color: pathway === PATHWAYS.ONE_OFF ? '#000' : '#6b7280',
                    fontWeight: pathway === PATHWAYS.ONE_OFF ? '600' : '500',
                  }}
                >
                  <span style={{ marginRight: '6px' }}>⚡</span>
                  One-Off
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: '400', marginTop: '2px', opacity: 0.8 }}>
                    Generate + Send NOW
                  </span>
                </button>
                <button
                  onClick={() => setPathway(PATHWAYS.THREE_EMAIL)}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    minWidth: isMobile ? '100%' : 'auto',
                    padding: '12px 14px',
                    backgroundColor: pathway === PATHWAYS.THREE_EMAIL ? COLORS.yellow : 'transparent',
                    border: `2px solid ${pathway === PATHWAYS.THREE_EMAIL ? COLORS.yellow : '#e5e7eb'}`,
                    color: pathway === PATHWAYS.THREE_EMAIL ? '#000' : '#6b7280',
                    fontWeight: pathway === PATHWAYS.THREE_EMAIL ? '600' : '500',
                  }}
                >
                  <span style={{ marginRight: '6px' }}>📨</span>
                  3-Email Set
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: '400', marginTop: '2px', opacity: 0.8 }}>
                    Sequence to copy
                  </span>
                </button>
                <button
                  onClick={() => setPathway(PATHWAYS.JOURNEY)}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    minWidth: isMobile ? '100%' : 'auto',
                    padding: '12px 14px',
                    backgroundColor: pathway === PATHWAYS.JOURNEY ? COLORS.yellow : 'transparent',
                    border: `2px solid ${pathway === PATHWAYS.JOURNEY ? COLORS.yellow : '#e5e7eb'}`,
                    color: pathway === PATHWAYS.JOURNEY ? '#000' : '#6b7280',
                    fontWeight: pathway === PATHWAYS.JOURNEY ? '600' : '500',
                  }}
                >
                  <span style={{ marginRight: '6px' }}>🗺️</span>
                  Journey Build
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: '400', marginTop: '2px', opacity: 0.8 }}>
                    Deploy to UnityMAP
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Credits & Settings Toggle */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Credits Badge - Always visible with tiered display */}
            {isClient ? (
              <div style={{
                padding: '8px 14px',
                backgroundColor: 'rgba(238, 207, 0, 0.15)',
                border: '1px solid rgba(238, 207, 0, 0.3)',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                color: COLORS.yellow
              }}>
                ⭐ Client Access — Unlimited
              </div>
            ) : apiKey ? (
              <div style={{
                padding: '8px 14px',
                backgroundColor: apiKeyCreditsRemaining > 0 ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${apiKeyCreditsRemaining > 0 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                color: apiKeyCreditsRemaining > 0 ? '#8b5cf6' : '#ef4444'
              }}>
                {apiKeyCreditsRemaining > 0 ? `🔑 ${apiKeyCreditsRemaining}/${API_KEY_CREDITS} API credits` : '🔒 API credits exhausted'}
              </div>
            ) : (
              <div style={{
                padding: '8px 14px',
                backgroundColor: freeCreditsRemaining > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${freeCreditsRemaining > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                color: freeCreditsRemaining > 0 ? '#10b981' : '#ef4444'
              }}>
                {freeCreditsRemaining > 0 ? `✨ ${freeCreditsRemaining}/${FREE_CREDITS} free` : '🔒 Add API key for more'}
              </div>
            )}
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}
            >
              🔑 LLM Key {showApiKeyInput ? '▲' : '▼'}
            </button>
            <button
              onClick={() => setShowResendKeyInput(!showResendKeyInput)}
              style={{
                ...secondaryButtonStyle,
                padding: '10px 16px',
                fontSize: '13px',
                borderColor: resendApiKey ? '#10b981' : undefined,
                color: resendApiKey ? '#10b981' : undefined
              }}
            >
              📧 Send Key {resendApiKey ? '✓' : ''} {showResendKeyInput ? '▲' : '▼'}
            </button>
            <button
              onClick={() => setShowBrandSettings(!showBrandSettings)}
              style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}
            >
              ⚙️ Brand Settings {showBrandSettings ? '▲' : '▼'}
            </button>
            <button
              onClick={loadTestData}
              style={{
                ...secondaryButtonStyle,
                padding: '10px 16px',
                fontSize: '13px'
              }}
              title="Load yellowCircle test data for quick testing"
            >
              🧪 Load Test Data
            </button>
            {/* Start Over - visible after step 1 or with generated emails */}
            {(currentStep > 1 || generatedEmails) && (
              <button
                onClick={handleRestart}
                style={{
                  ...secondaryButtonStyle,
                  padding: '10px 16px',
                  fontSize: '13px'
                }}
                title="Start over with a new prospect"
              >
                ↺ Start Over
              </button>
            )}
          </div>

          {/* API Key Input */}
          {showApiKeyInput && (
            <div style={{ ...cardStyle, borderColor: COLORS.yellow, animation: 'fadeInUp 0.4s ease-out' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                Enter API Key
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Get a free key from{' '}
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                  style={{ color: COLORS.yellow, textDecoration: 'underline' }}>Groq (free)</a>,{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
                  style={{ color: COLORS.yellow, textDecoration: 'underline' }}>OpenAI</a>, or{' '}
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                  style={{ color: COLORS.yellow, textDecoration: 'underline' }}>Claude</a>
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gsk_... or sk-..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={saveApiKey} style={primaryButtonStyle}>
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Resend API Key Input (for sending) */}
          {showResendKeyInput && (
            <div style={{ ...cardStyle, borderColor: '#10b981', animation: 'fadeInUp 0.4s ease-out' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                📧 Email Sending API Key
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                To send emails, you need a Resend API key.{' '}
                <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer"
                  style={{ color: '#10b981', textDecoration: 'underline' }}>Get one free</a>{' '}
                (100 emails/day, 3,000/month)
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="re_..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={saveResendApiKey} style={{ ...primaryButtonStyle, backgroundColor: '#10b981' }}>
                  Save
                </button>
              </div>
              {resendApiKey && (
                <p style={{ fontSize: '12px', color: '#10b981', marginTop: '8px' }}>
                  ✓ Resend API key configured
                </p>
              )}
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

              {/* Brand Colors Section */}
              <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                  Brand Colors
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Primary</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={brand.colors?.primary || '#EECF00'}
                        onChange={(e) => setBrand(prev => ({ ...prev, colors: { ...prev.colors, primary: e.target.value } }))}
                        style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={brand.colors?.primary || '#EECF00'}
                        onChange={(e) => setBrand(prev => ({ ...prev, colors: { ...prev.colors, primary: e.target.value } }))}
                        style={{ ...inputStyle, padding: '6px 8px', fontSize: '11px', width: '80px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Secondary</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={brand.colors?.secondary || '#1a1a1a'}
                        onChange={(e) => setBrand(prev => ({ ...prev, colors: { ...prev.colors, secondary: e.target.value } }))}
                        style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={brand.colors?.secondary || '#1a1a1a'}
                        onChange={(e) => setBrand(prev => ({ ...prev, colors: { ...prev.colors, secondary: e.target.value } }))}
                        style={{ ...inputStyle, padding: '6px 8px', fontSize: '11px', width: '80px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Text</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={brand.colors?.text || '#333333'}
                        onChange={(e) => setBrand(prev => ({ ...prev, colors: { ...prev.colors, text: e.target.value } }))}
                        style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={brand.colors?.text || '#333333'}
                        onChange={(e) => setBrand(prev => ({ ...prev, colors: { ...prev.colors, text: e.target.value } }))}
                        style={{ ...inputStyle, padding: '6px 8px', fontSize: '11px', width: '80px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '11px' }}>Accent</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={brand.colors?.accent || '#000000'}
                        onChange={(e) => setBrand(prev => ({ ...prev, colors: { ...prev.colors, accent: e.target.value } }))}
                        style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={brand.colors?.accent || '#000000'}
                        onChange={(e) => setBrand(prev => ({ ...prev, colors: { ...prev.colors, accent: e.target.value } }))}
                        style={{ ...inputStyle, padding: '6px 8px', fontSize: '11px', width: '80px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Links Section */}
              <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                  Brand Links
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Calendar Link</label>
                    <input
                      type="url"
                      value={brand.links?.calendar || ''}
                      onChange={(e) => setBrand(prev => ({ ...prev, links: { ...prev.links, calendar: e.target.value } }))}
                      placeholder="https://calendly.com/yourname"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Website</label>
                    <input
                      type="url"
                      value={brand.links?.website || ''}
                      onChange={(e) => setBrand(prev => ({ ...prev, links: { ...prev.links, website: e.target.value } }))}
                      placeholder="https://yourcompany.com"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <label style={labelStyle}>Featured Article/Resource</label>
                  <input
                    type="url"
                    value={brand.links?.article || ''}
                    onChange={(e) => setBrand(prev => ({ ...prev, links: { ...prev.links, article: e.target.value } }))}
                    placeholder="https://yourcompany.com/blog/article"
                    style={inputStyle}
                  />
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                    Used in follow-up emails as value-add content
                  </p>
                </div>
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
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0',
            animation: 'fadeInUp 0.5s ease-out'
          }}>
            {['Prospect Info', 'Generate', 'Review & Copy'].map((label, idx) => (
              <React.Fragment key={idx}>
                {/* Step Circle + Label */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flex: '0 0 auto'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    borderRadius: '50%',
                    backgroundColor: currentStep > idx + 1 ? COLORS.yellow : currentStep === idx + 1 ? COLORS.yellow : '#e5e7eb',
                    color: currentStep >= idx + 1 ? '#000' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                    boxShadow: currentStep === idx + 1 ? '0 0 0 3px rgba(238, 207, 0, 0.3)' : 'none'
                  }}>
                    {currentStep > idx + 1 ? '✓' : idx + 1}
                  </div>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: currentStep === idx + 1 ? '600' : '400',
                    color: currentStep === idx + 1 ? '#000' : currentStep > idx + 1 ? '#374151' : '#6b7280',
                    whiteSpace: 'nowrap'
                  }}>
                    {label}
                  </span>
                </div>
                {/* Connector Line */}
                {idx < 2 && (
                  <div style={{
                    flex: '1 1 auto',
                    height: '2px',
                    minWidth: '40px',
                    maxWidth: '120px',
                    backgroundColor: currentStep > idx + 1 ? COLORS.yellow : '#e5e7eb',
                    margin: '0 16px',
                    transition: 'background-color 0.3s'
                  }} />
                )}
              </React.Fragment>
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

              {/* Form Error */}
              {formError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#dc2626',
                  fontSize: '14px'
                }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  onClick={handleContinueToStep2}
                  style={primaryButtonStyle}
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
                backgroundColor: pathway === PATHWAYS.ONE_OFF
                  ? 'rgba(16, 185, 129, 0.1)'
                  : pathway === PATHWAYS.JOURNEY
                    ? 'rgba(139, 92, 246, 0.1)'
                    : 'rgba(238, 207, 0, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                border: `1px solid ${
                  pathway === PATHWAYS.ONE_OFF
                    ? 'rgba(16, 185, 129, 0.3)'
                    : pathway === PATHWAYS.JOURNEY
                      ? 'rgba(139, 92, 246, 0.3)'
                      : 'rgba(238, 207, 0, 0.3)'
                }`
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  {pathway === PATHWAYS.ONE_OFF ? '⚡ One-Off Email' : pathway === PATHWAYS.JOURNEY ? '🗺️ Journey Build' : '📨 3-Email Sequence'}
                </h3>
                {pathway === PATHWAYS.ONE_OFF ? (
                  <p style={{ fontSize: '14px', color: '#4b5563', margin: 0 }}>
                    Generate a single {sendMode === SEND_MODES.PROSPECT ? 'cold outreach' : 'marketing'} email and send it immediately via Resend.
                  </p>
                ) : (
                  <ul style={{ fontSize: '14px', color: '#4b5563', margin: 0, paddingLeft: '20px' }}>
                    <li>{sendMode === SEND_MODES.PROSPECT ? 'Initial cold email' : 'Welcome email'} (Day 0)</li>
                    <li>Follow-up {sendMode === SEND_MODES.PROSPECT ? 'with value add' : 'with content'} (Day 3)</li>
                    <li>Final {sendMode === SEND_MODES.PROSPECT ? 'breakup email' : 'nurture'} (Day 10)</li>
                    {pathway === PATHWAYS.JOURNEY && (
                      <li style={{ fontWeight: '500', marginTop: '8px' }}>→ Deploy to UnityMAP for orchestration</li>
                    )}
                  </ul>
                )}
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
                  disabled={isGenerating}
                  style={{
                    ...primaryButtonStyle,
                    opacity: isGenerating ? 0.7 : 1,
                    cursor: isGenerating ? 'not-allowed' : 'pointer'
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

          {/* Step 3: Review & Actions */}
          {currentStep === 3 && generatedEmails && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              {/* Success Message */}
              {sendSuccess && (
                <div style={{
                  ...cardStyle,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>✅</span>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#10b981', marginBottom: '4px' }}>
                        Email Sent Successfully!
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                        Sent to {sendSuccess.to} • Subject: "{sendSuccess.subject}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div style={{
                  ...cardStyle,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  marginBottom: '16px'
                }}>
                  <p style={{ color: '#dc2626', margin: 0, fontSize: '14px' }}>⚠️ {error}</p>
                </div>
              )}

              {/* ONE-OFF PATHWAY: Single email with Send Now */}
              {pathway === PATHWAYS.ONE_OFF && generatedEmails.single && (
                <>
                  {/* Action Bar */}
                  <div style={{
                    ...cardStyle,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <button onClick={() => { setCurrentStep(1); setGeneratedEmails(null); setSendSuccess(null); }} style={secondaryButtonStyle}>
                      ← New Email
                    </button>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => copyToClipboard(
                          `Subject: ${generatedEmails.single.subject}\n\n${generatedEmails.single.body}`,
                          0
                        )}
                        style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}
                      >
                        {copiedIndex === 0 ? '✓ Copied!' : '📋 Copy'}
                      </button>
                      <button
                        onClick={() => openEmailPreview(generatedEmails.single)}
                        style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}
                      >
                        👁️ Preview
                      </button>
                      <button
                        onClick={() => sendEmailNow(generatedEmails.single, formData.email)}
                        disabled={isSending || sendSuccess}
                        style={{
                          ...primaryButtonStyle,
                          padding: '10px 20px',
                          fontSize: '14px',
                          backgroundColor: sendSuccess ? '#10b981' : '#10b981',
                          opacity: (isSending || sendSuccess) ? 0.7 : 1,
                          cursor: (isSending || sendSuccess) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isSending ? (
                          <>
                            <span style={{
                              display: 'inline-block',
                              width: '14px',
                              height: '14px',
                              border: '2px solid #fff',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }} />
                            Sending...
                          </>
                        ) : sendSuccess ? (
                          '✓ Sent!'
                        ) : (
                          '⚡ Send Now'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Single Email Card */}
                  <div style={{ ...cardStyle }}>
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
                          {sendMode === SEND_MODES.PROSPECT ? 'Cold Outreach Email' : 'Marketing Email'}
                        </h3>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          To: {formData.firstName} {formData.lastName} &lt;{formData.email}&gt;
                        </span>
                      </div>
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
                        {generatedEmails.single.subject}
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
                        {generatedEmails.single.body}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* THREE-EMAIL & JOURNEY PATHWAYS: Sequence view */}
              {(pathway === PATHWAYS.THREE_EMAIL || pathway === PATHWAYS.JOURNEY) && generatedEmails.initial && (
                <>
                  {/* Action Bar */}
                  <div style={{
                    ...cardStyle,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <button onClick={() => { setCurrentStep(1); setGeneratedEmails(null); }} style={secondaryButtonStyle}>
                      ← New Prospect
                    </button>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {pathway === PATHWAYS.THREE_EMAIL && (
                        <>
                          <button onClick={downloadAsMarkdown} style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}>
                            ↓ .md
                          </button>
                          <button onClick={downloadAsDoc} style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}>
                            ↓ .doc
                          </button>
                          <button onClick={downloadAsJson} style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}>
                            ↓ .json
                          </button>
                        </>
                      )}
                      <button
                        onClick={deployToUnityNotes}
                        style={{
                          ...primaryButtonStyle,
                          padding: '10px 20px',
                          fontSize: '14px'
                        }}
                      >
                        🗺️ Deploy to UnityMAP
                      </button>
                    </div>
                  </div>

                  {/* Email Cards */}
                  {[
                    { key: 'initial', label: sendMode === SEND_MODES.PROSPECT ? 'Initial Cold Email' : 'Welcome Email', day: 'Day 0', color: '#10b981' },
                    { key: 'followup1', label: 'Follow-up #1', day: 'Day 3', color: '#3b82f6' },
                    { key: 'followup2', label: sendMode === SEND_MODES.PROSPECT ? 'Final Breakup' : 'Final Nurture', day: 'Day 10', color: '#8b5cf6' }
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
                            backgroundColor: stage.color,
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: '500'
                          }}>
                            {stage.day}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => openEmailPreview(generatedEmails[stage.key])}
                            style={{
                              ...secondaryButtonStyle,
                              padding: '8px 12px',
                              fontSize: '12px'
                            }}
                          >
                            👁️
                          </button>
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
                </>
              )}

              {/* Footer */}
              <div style={{ height: '100px' }} />
            </div>
          )}

          {/* Initial spacer */}
          {currentStep < 3 && <div style={{ height: '100px' }} />}
        </div>
      </div>

      {/* Email Preview Modal */}
      {showPreview && previewEmail && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setShowPreview(false)}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
          <div
            style={{
              backgroundColor: '#f5f5f5',
              borderRadius: '12px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111' }}>
                  Email Preview
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                  Branded template preview
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    // Copy HTML to clipboard
                    navigator.clipboard.writeText(previewEmail.html);
                    alert('✅ HTML template copied to clipboard!');
                  }}
                  style={{
                    ...secondaryButtonStyle,
                    padding: '8px 14px',
                    fontSize: '12px'
                  }}
                >
                  Copy HTML
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#f3f4f6',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#e5e5e5'
            }}>
              <iframe
                srcDoc={previewEmail.html}
                title="Email Preview"
                style={{
                  width: '100%',
                  height: '600px',
                  border: 'none',
                  backgroundColor: '#f5f5f5'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
    </LeadGate>
  );
}

export default OutreachGeneratorPage;
