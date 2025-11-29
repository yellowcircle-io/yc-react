import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import Layout from '../../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../../styles/constants';
import { API_KEYS as LOCAL_KEYS } from '../../config/api-keys.local.js';

// Password for access (simple client-side protection)
const ACCESS_PASSWORD = 'yc2025outreach';

// API keys - loaded from local config file (gitignored via *.local pattern)
// If deploying without local keys, create api-keys.local.js with empty values
const DEFAULT_KEYS = {
  groq: LOCAL_KEYS?.groq || '',
  resend: LOCAL_KEYS?.resend || '',
  perplexity: LOCAL_KEYS?.perplexity || ''
};

// ============================================================================
// ENCRYPTION UTILITIES - AES-GCM encryption for localStorage
// ============================================================================
const ENCRYPTION_SALT = 'yellowcircle-outreach-2025';

async function deriveEncryptionKey(password) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(ENCRYPTION_SALT),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptSettings(data, password) {
  try {
    const key = await deriveEncryptionKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(data))
    );
    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
      encrypted: true
    };
  } catch (e) {
    console.error('Encryption failed:', e);
    return null;
  }
}

async function decryptSettings(encryptedObj, password) {
  try {
    if (!encryptedObj?.encrypted) return encryptedObj; // Not encrypted, return as-is
    const key = await deriveEncryptionKey(password);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedObj.iv) },
      key,
      new Uint8Array(encryptedObj.data)
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (e) {
    console.error('Decryption failed:', e);
    return null;
  }
}

// Available models for generation
const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Recommended)', description: 'Best quality, fast' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Faster, lighter' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Good alternative' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Google model' }
];

// Refinement LLM options
const REFINEMENT_LLMS = [
  { id: 'perplexity', name: 'Perplexity', description: 'Research-backed refinement', available: true },
  { id: 'claude', name: 'Claude', description: 'Coming soon', available: false },
  { id: 'chatgpt', name: 'ChatGPT', description: 'Coming soon', available: false }
];

// Send providers
const SEND_PROVIDERS = [
  { id: 'resend', name: 'Resend', description: 'Transactional email API', available: true },
  { id: 'sendgrid', name: 'SendGrid', description: 'Coming soon', available: false },
  { id: 'mailgun', name: 'Mailgun', description: 'Coming soon', available: false },
  { id: 'ses', name: 'Amazon SES', description: 'Coming soon', available: false }
];

// Send types
const SEND_TYPES = {
  manual: {
    id: 'manual',
    name: 'Manual / Single Send',
    description: 'Create and send individual outreach emails one at a time',
    icon: '✉️',
    available: true
  },
  batch: {
    id: 'batch',
    name: 'Batch Upload',
    description: 'Upload a CSV of recipients for bulk generation',
    icon: '📋',
    available: false,
    comingSoon: true
  },
  trigger: {
    id: 'trigger',
    name: 'Automated / Trigger-Based',
    description: 'Set up rules to automatically send based on events',
    icon: '⚡',
    available: false,
    comingSoon: true
  }
};

// Outreach motions with distinct templates and prompts
const OUTREACH_MOTIONS = {
  sales: {
    id: 'sales',
    name: 'DR / Sales / Prospecting',
    description: 'Direct response outreach for lead generation and sales conversations',
    icon: '🎯',
    replyTo: 'chris@yellowcircle.io',
    templateType: 'plaintext', // Plain text with signature
    systemPrompt: `You are writing cold outreach emails for Christopher Cooper, a GTM and Marketing Operations consultant at yellowCircle.

**MOTION:** Direct Response / Sales Prospecting
**GOAL:** Generate qualified leads and book discovery calls

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
- One clear CTA (book a call, reply, etc.)
- Reference specific trigger when provided
- Sign off as "— Chris"`,
    templates: {
      initial: {
        subjectOptions: [
          'quick question about {{company}}\'s GTM',
          '{{company}}\'s marketing ops',
          'noticed {{company}} is scaling'
        ]
      },
      followup1: { subjectPrefix: 'Re: ', dayOffset: 3 },
      followup2: { subjectPrefix: '', subject: 'last note on GTM', dayOffset: 10 }
    }
  },
  brand: {
    id: 'brand',
    name: 'Advertising / Brand / Marcom',
    description: 'Brand awareness, thought leadership distribution, and marketing communications',
    icon: '📣',
    replyTo: 'info@yellowcircle.io',
    templateType: 'designed', // HTML marketing template
    systemPrompt: `You are writing marketing communications for yellowCircle, a GTM and Marketing Operations consultancy led by Christopher Cooper.

**MOTION:** Brand / Advertising / Marketing Communications
**GOAL:** Build awareness, share thought leadership, nurture relationships

**VOICE:**
- Warm but professional
- Thought leadership focused
- Value-first (give before asking)
- Longer form acceptable (200-300 words)

**BRAND POSITIONING:**
- yellowCircle helps B2B companies fix broken GTM systems
- Focus on the human cost of operations theater
- Data-driven insights with empathy

**CONTENT TYPES:**
- Thought leadership distribution (articles, insights)
- Event invitations
- Newsletter-style updates
- Case study sharing
- Industry commentary

**FRAMEWORK:**
1. Hook with insight or question
2. Provide value (article, insight, resource)
3. Soft CTA (read more, share thoughts, connect)

**RULES:**
- Lead with value, not ask
- Reference specific content being shared
- Personalize based on recipient's interests/industry
- Sign off as "Chris Cooper, yellowCircle"`,
    templates: {
      initial: {
        subjectOptions: [
          'thought you\'d find this interesting',
          'new perspective on GTM operations',
          'sharing: {{contentTitle}}'
        ]
      },
      followup1: { subjectPrefix: 'Re: ', dayOffset: 7 },
      followup2: { subjectPrefix: '', subject: 'one more resource', dayOffset: 14 }
    }
  }
};

// Brand configuration
const BRAND = {
  name: 'yellowCircle',
  logo: 'https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png',
  sender: {
    name: 'Chris Cooper',
    title: 'GTM & Marketing Operations Consultant',
    email: 'christopher@yellowcircle.io',
    phone: '914/241-5524'
  },
  colors: {
    yellow: '#EECF00',
    black: '#000000',
    white: '#FFFFFF'
  },
  links: {
    calendar: 'https://calendly.com/christophercooper',
    article: 'https://yellowcircle-app.web.app/thoughts/why-your-gtm-sucks',
    website: 'https://yellowcircle.io'
  }
};

// Plain text signature for sales emails
const SALES_SIGNATURE = `
—
Christopher Cooper
yellowCircle.io
Email: christopher@yellowcircle.io
Phone: 914/241-5524`;

// Generate HTML email template for brand/marcom
const generateBrandEmailHTML = (subject, body, preheader = '') => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#f4f4f4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f4f4f4;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:30px 40px;background-color:#ffffff;">
              <a href="${BRAND.links.website}" target="_blank" style="text-decoration:none;">
                <img src="${BRAND.logo}" alt="yellowCircle" style="display:block;max-height:100px;width:auto;">
              </a>
            </td>
          </tr>
          <!-- Hero -->
          <tr>
            <td style="padding:40px;background-color:${BRAND.colors.yellow};">
              <h1 style="margin:0;font-size:32px;font-weight:700;line-height:1.2;color:${BRAND.colors.black};">${subject}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;background-color:#ffffff;">
              <div style="font-size:16px;line-height:1.7;color:#333333;white-space:pre-wrap;">${body}</div>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 40px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:${BRAND.colors.yellow};border-radius:4px;">
                    <a href="${BRAND.links.article}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:${BRAND.colors.black};text-decoration:none;">Read More</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:30px 40px;background-color:${BRAND.colors.black};">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <a href="${BRAND.links.website}/works" style="color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.1em;margin:0 15px;">BROWSE</a>
                    <a href="${BRAND.links.website}/experiments" style="color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.1em;margin:0 15px;">LABS</a>
                    <a href="${BRAND.links.website}/about" style="color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.1em;margin:0 15px;">CONTACT</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:20px;border-top:1px solid #333;">
                    <p style="margin:0;font-size:11px;color:#999999;">© ${new Date().getFullYear()} yellowCircle. All rights reserved.</p>
                    <p style="margin:8px 0 0;font-size:11px;color:#999999;">
                      <a href="#" style="color:#999999;text-decoration:underline;">Unsubscribe</a> | <a href="#" style="color:#999999;text-decoration:underline;">View in browser</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

function OutreachBusinessPage() {
  const navigate = useNavigate();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();
  const previewRef = useRef(null);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Settings state
  // NOTE: Using Resend test domain until yellowcircle.io is verified at https://resend.com/domains
  const [settings, setSettings] = useState({
    groqApiKey: DEFAULT_KEYS.groq,
    resendApiKey: DEFAULT_KEYS.resend,
    perplexityApiKey: DEFAULT_KEYS.perplexity,
    selectedModel: 'llama-3.3-70b-versatile',
    sendProvider: 'resend',
    enableSending: true,
    fromEmail: 'onboarding@resend.dev',
    fromName: 'Chris Cooper'
  });
  const [showSettings, setShowSettings] = useState(false);

  // Workflow state
  const [sendType, setSendType] = useState(null); // 'manual', 'batch', 'trigger'
  const [selectedMotion, setSelectedMotion] = useState('sales');
  const [currentStep, setCurrentStep] = useState(0); // 0: Select type, 1: Recipient, 2: Generate, 3: Review, 4: Refine, 5: Send

  // Form state
  const [formData, setFormData] = useState({
    company: '',
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    industry: 'B2B SaaS',
    trigger: '',
    triggerDetails: '',
    contentTitle: '',
    contentUrl: ''
  });

  // Email state
  const [generatedEmails, setGeneratedEmails] = useState(null);
  const [editedEmails, setEditedEmails] = useState(null);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState('text'); // 'text', 'html', or 'components'
  const [refinementFeedback, setRefinementFeedback] = useState('');
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Track password for encryption/decryption
  const [sessionPassword, setSessionPassword] = useState('');

  // Load settings and auth from localStorage
  useEffect(() => {
    const savedAuth = localStorage.getItem('outreach_business_auth');
    if (savedAuth === 'true') setIsAuthenticated(true);

    const savedMotion = localStorage.getItem('outreach_business_motion');
    if (savedMotion && OUTREACH_MOTIONS[savedMotion]) {
      setSelectedMotion(savedMotion);
    }
  }, []);

  // Load encrypted settings after authentication
  useEffect(() => {
    if (isAuthenticated && sessionPassword) {
      const loadEncryptedSettings = async () => {
        const savedSettings = localStorage.getItem('outreach_business_settings_v4');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            const decrypted = await decryptSettings(parsed, sessionPassword);
            if (decrypted) {
              setSettings(prev => ({ ...prev, ...decrypted }));
            }
          } catch (e) {
            console.error('Failed to load encrypted settings');
          }
        }
      };
      loadEncryptedSettings();
    }
  }, [isAuthenticated, sessionPassword]);

  // Save encrypted settings to localStorage
  useEffect(() => {
    if (isAuthenticated && sessionPassword) {
      const saveEncryptedSettings = async () => {
        const encrypted = await encryptSettings(settings, sessionPassword);
        if (encrypted) {
          localStorage.setItem('outreach_business_settings_v4', JSON.stringify(encrypted));
        }
        localStorage.setItem('outreach_business_motion', selectedMotion);
      };
      saveEncryptedSettings();
    }
  }, [settings, selectedMotion, isAuthenticated, sessionPassword]);

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

  // Auth handlers
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ACCESS_PASSWORD) {
      setSessionPassword(passwordInput); // Store for encryption/decryption
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

  // Form handlers
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

  const handleEmailEdit = (field, value) => {
    setEditedEmails(prev => {
      const emails = { ...prev };
      const stages = ['initial', 'followup1', 'followup2'];
      const stage = stages[selectedEmailIndex];
      emails[stage] = { ...emails[stage], [field]: value };
      return emails;
    });
  };

  // Trigger options based on motion
  const triggerOptions = selectedMotion === 'sales' ? [
    { value: 'funding', label: 'Recent Funding' },
    { value: 'hiring', label: 'Hiring for Marketing/Ops Role' },
    { value: 'content', label: 'LinkedIn Post/Content' },
    { value: 'news', label: 'Company News/Announcement' },
    { value: 'none', label: 'No Specific Trigger' }
  ] : [
    { value: 'article', label: 'Sharing Article/Thought Leadership' },
    { value: 'event', label: 'Event Invitation' },
    { value: 'case_study', label: 'Case Study/Success Story' },
    { value: 'industry_news', label: 'Industry Commentary' },
    { value: 'newsletter', label: 'Newsletter/Update' }
  ];

  // Email generation
  const generateEmailContent = async (stage, prospect) => {
    const motion = OUTREACH_MOTIONS[selectedMotion];

    const stagePrompts = selectedMotion === 'sales' ? {
      initial: `Write an initial cold email (Day 0) for this prospect. Keep it under 150 words. Do NOT include signature - it will be added automatically.`,
      followup1: `Write follow-up #1 (Day 3). Reference the previous email without repeating it. Add value with a diagnostic question. Under 100 words. Do NOT include signature.`,
      followup2: `Write final follow-up (Day 10). Acknowledge this is the last touch, offer resources, leave door open. Under 80 words. Do NOT include signature.`
    } : {
      initial: `Write a brand/thought leadership email sharing valuable content. Lead with insight, provide value. 200-300 words acceptable. Sign off as "Chris Cooper, yellowCircle".`,
      followup1: `Write follow-up #1 (Day 7). Add another perspective or related resource. Don't be pushy. Under 150 words.`,
      followup2: `Write final touch (Day 14). Share one more resource, leave door open for future connection. Under 100 words.`
    };

    const prospectContext = selectedMotion === 'sales' ? `
PROSPECT:
- Company: ${prospect.company}
- Name: ${prospect.firstName}${prospect.lastName ? ' ' + prospect.lastName : ''}
- Title: ${prospect.title || 'Unknown'}
- Industry: ${prospect.industry}
- Trigger: ${prospect.trigger || 'None'}
- Trigger Details: ${prospect.triggerDetails || 'None'}` : `
RECIPIENT:
- Company: ${prospect.company}
- Name: ${prospect.firstName}${prospect.lastName ? ' ' + prospect.lastName : ''}
- Title: ${prospect.title || 'Unknown'}
- Industry: ${prospect.industry}
- Content Type: ${prospect.trigger || 'General'}
- Content Title: ${prospect.contentTitle || 'N/A'}
- Content URL: ${prospect.contentUrl || BRAND.links.article}
- Context: ${prospect.triggerDetails || 'None'}`;

    const prompt = `${motion.systemPrompt}

${prospectContext}

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
        max_tokens: 800
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

      // Add signature for sales emails
      if (selectedMotion === 'sales') {
        Object.keys(emails).forEach(stage => {
          emails[stage].body = emails[stage].body + SALES_SIGNATURE;
        });
      }

      setGeneratedEmails(emails);
      setEditedEmails(JSON.parse(JSON.stringify(emails))); // Deep clone for editing
      setCurrentStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Refinement with external LLM
  const handleRefine = async () => {
    if (!settings.perplexityApiKey) {
      setError('Please configure your Perplexity API key in settings');
      setShowSettings(true);
      return;
    }

    setIsRefining(true);
    setError(null);

    try {
      const stages = ['initial', 'followup1', 'followup2'];
      const stage = stages[selectedEmailIndex];
      const currentEmail = editedEmails[stage];

      const prompt = `Review and improve this cold outreach email. Keep the same structure and intent, but make it more compelling and natural.

CURRENT EMAIL:
Subject: ${currentEmail.subject}
Body: ${currentEmail.body}

${refinementFeedback ? `SPECIFIC FEEDBACK: ${refinementFeedback}` : ''}

Provide an improved version. Return ONLY a JSON object:
{"subject": "improved subject", "body": "improved body"}`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Perplexity API request failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const refined = JSON.parse(jsonMatch[0]);
        setEditedEmails(prev => ({
          ...prev,
          [stage]: refined
        }));
        setSuccessMessage('Email refined successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Refinement failed: ${err.message}`);
    } finally {
      setIsRefining(false);
      setRefinementFeedback('');
    }
  };

  // Generate Resend API payload (for CLI use)
  const generateResendPayload = (emailData, isTest = false) => {
    const motion = OUTREACH_MOTIONS[selectedMotion];
    const recipient = isTest ? settings.fromEmail : formData.email;

    const emailPayload = {
      from: `${settings.fromName} <${settings.fromEmail}>`,
      to: [recipient],
      reply_to: motion.replyTo,
      subject: isTest ? `[TEST] ${emailData.subject}` : emailData.subject,
      headers: {
        'X-YC-Motion': selectedMotion,
        'X-YC-Recipient': formData.email,
        'X-YC-Company': formData.company
      }
    };

    if (motion.templateType === 'designed') {
      emailPayload.html = generateBrandEmailHTML(emailData.subject, emailData.body);
      emailPayload.text = emailData.body;
    } else {
      emailPayload.text = emailData.body;
    }

    return emailPayload;
  };

  // Generate CLI command for sending
  const generateCLICommand = (emailData, isTest = false) => {
    const payload = generateResendPayload(emailData, isTest);
    return `curl -X POST 'https://api.resend.com/emails' \\
  -H 'Authorization: Bearer ${settings.resendApiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(payload, null, 2).replace(/'/g, "'\\''")}'`;
  };

  // Copy CLI command to clipboard
  const handleCopyCLI = async (isTest = false) => {
    const stages = ['initial', 'followup1', 'followup2'];
    const stage = stages[selectedEmailIndex];
    const command = generateCLICommand(editedEmails[stage], isTest);

    try {
      await navigator.clipboard.writeText(command);
      setSuccessMessage(`CLI command copied! Paste in terminal to ${isTest ? 'send test' : 'send live'}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  // Copy HTML to clipboard
  const handleCopyHTML = async () => {
    const stages = ['initial', 'followup1', 'followup2'];
    const stage = stages[selectedEmailIndex];
    const html = generateBrandEmailHTML(editedEmails[stage].subject, editedEmails[stage].body);

    try {
      await navigator.clipboard.writeText(html);
      setSuccessMessage('HTML copied to clipboard!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  // Send email via Firebase Function proxy
  const sendEmailViaFunction = async (emailData, isTest = false) => {
    const motion = OUTREACH_MOTIONS[selectedMotion];
    const recipient = isTest ? settings.fromEmail : formData.email;

    const payload = {
      apiKey: settings.resendApiKey,
      from: `${settings.fromName} <${settings.fromEmail}>`,
      to: recipient,
      reply_to: motion.replyTo,
      subject: isTest ? `[TEST] ${emailData.subject}` : emailData.subject,
      headers: {
        'X-YC-Motion': selectedMotion,
        'X-YC-Recipient': formData.email,
        'X-YC-Company': formData.company
      }
    };

    // Use HTML template for brand, plain text for sales
    if (motion.templateType === 'designed') {
      payload.html = generateBrandEmailHTML(emailData.subject, emailData.body);
      payload.text = emailData.body;
    } else {
      payload.text = emailData.body;
    }

    const response = await fetch('https://us-central1-yellowcircle-app.cloudfunctions.net/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email');
    }

    return result;
  };

  const handleSendTest = async () => {
    setIsSending(true);
    setError(null);

    try {
      const stages = ['initial', 'followup1', 'followup2'];
      const stage = stages[selectedEmailIndex];
      await sendEmailViaFunction(editedEmails[stage], true);
      setSuccessMessage(`Test email sent to ${settings.fromEmail}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(`Failed to send test: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendLive = async () => {
    setIsSending(true);
    setError(null);

    try {
      const stages = ['initial', 'followup1', 'followup2'];
      const stage = stages[selectedEmailIndex];
      await sendEmailViaFunction(editedEmails[stage], false);
      setSuccessMessage(`Email sent to ${formData.email}!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(`Failed to send: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Utility functions
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
      emails: editedEmails,
      motion: selectedMotion,
      generatedAt: new Date().toISOString(),
      model: settings.selectedModel,
      brand: BRAND.name
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.company.toLowerCase().replace(/\s+/g, '-')}-${selectedMotion}-outreach-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetWorkflow = () => {
    setSendType(null);
    setCurrentStep(0);
    setGeneratedEmails(null);
    setEditedEmails(null);
    setSelectedEmailIndex(0);
    setFormData({
      company: '', firstName: '', lastName: '', email: '', title: '',
      industry: 'B2B SaaS', trigger: '', triggerDetails: '', contentTitle: '', contentUrl: ''
    });
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

  const primaryButtonStyle = { ...buttonStyle, backgroundColor: COLORS.yellow, color: '#000' };
  const secondaryButtonStyle = { ...buttonStyle, backgroundColor: 'transparent', border: `2px solid ${COLORS.yellow}`, color: '#000' };
  const dangerButtonStyle = { ...buttonStyle, backgroundColor: '#ef4444', color: '#fff' };
  const successButtonStyle = { ...buttonStyle, backgroundColor: '#10b981', color: '#fff' };

  const disabledStyle = (isDisabled) => ({
    opacity: isDisabled ? 0.5 : 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer'
  });

  // Password Screen (initial auth or re-auth for encryption)
  if (!isAuthenticated || (isAuthenticated && !sessionPassword)) {
    const isReauth = isAuthenticated && !sessionPassword;

    const handleReauthSubmit = (e) => {
      e.preventDefault();
      if (passwordInput === ACCESS_PASSWORD) {
        setSessionPassword(passwordInput);
        setAuthError('');
      } else {
        setAuthError('Invalid password');
        setPasswordInput('');
      }
    };

    return (
      <Layout onHomeClick={handleHomeClick} onFooterToggle={handleFooterToggle} onMenuToggle={handleMenuToggle} navigationItems={navigationItems} pageLabel="OUTREACH">
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100 }}>
          <div style={{ ...cardStyle, width: '400px', maxWidth: '90vw', textAlign: 'center', animation: 'fadeInUp 0.5s ease-out' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: COLORS.yellow, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{isReauth ? '🔓' : '🔐'}</div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>{isReauth ? 'Unlock Settings' : 'Business Access'}</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>{isReauth ? 'Re-enter password to decrypt your saved settings' : 'Enter password to access the outreach generator'}</p>
            <form onSubmit={isReauth ? handleReauthSubmit : handlePasswordSubmit}>
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Password" style={{ ...inputStyle, textAlign: 'center', marginBottom: '16px', animation: authError ? 'shake 0.5s ease-out' : 'none' }} autoFocus />
              {authError && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{authError}</p>}
              <button type="submit" style={{ ...primaryButtonStyle, width: '100%', justifyContent: 'center' }}>{isReauth ? 'Unlock' : 'Access'}</button>
            </form>
            {isReauth && (
              <button onClick={handleLogout} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                Logout instead
              </button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Step labels for progress indicator
  const stepLabels = ['Send Type', 'Recipient', 'Generate', 'Review & Edit', 'Refine', 'Send'];

  return (
    <Layout onHomeClick={handleHomeClick} onFooterToggle={handleFooterToggle} onMenuToggle={handleMenuToggle} navigationItems={navigationItems} pageLabel="OUTREACH">
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
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '20px', animation: 'fadeInUp 0.6s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h1 style={{ ...TYPOGRAPHY.h1Scaled, color: COLORS.yellow, ...EFFECTS.blurLight, display: 'inline-block', margin: 0 }}>OUTREACH PRO</h1>
              <button onClick={handleLogout} style={{ ...buttonStyle, padding: '8px 14px', fontSize: '12px', backgroundColor: '#f3f4f6', color: '#6b7280' }}>Logout</button>
            </div>
            <p style={{ fontSize: '14px', color: '#4b5563', backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'inline-block', padding: '4px 8px', borderRadius: '4px', marginBottom: '12px' }}>
              AI-powered outreach with templates and direct sending
            </p>
            <div>
              <button onClick={() => setShowSettings(!showSettings)} style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}>
                ⚙️ Settings {showSettings ? '▲' : '▼'}
              </button>
              {currentStep > 0 && (
                <button onClick={resetWorkflow} style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px', marginLeft: '12px' }}>
                  ↺ Start Over
                </button>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div style={{ ...cardStyle, borderColor: COLORS.yellow, animation: 'fadeInUp 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Configuration</h2>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                {/* AI Generation */}
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Generation (Groq)</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>API Key</label>
                    <input type="password" name="groqApiKey" value={settings.groqApiKey} onChange={handleSettingsChange} placeholder="gsk_..." style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Model</label>
                    <select name="selectedModel" value={settings.selectedModel} onChange={handleSettingsChange} style={inputStyle}>
                      {GROQ_MODELS.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Refinement */}
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Refinement (Perplexity)</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>API Key</label>
                    <input type="password" name="perplexityApiKey" value={settings.perplexityApiKey} onChange={handleSettingsChange} placeholder="pplx-..." style={inputStyle} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>Used for proofing and refining generated emails</p>
                </div>

                {/* Email Sending */}
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email Sending</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Resend API Key</label>
                    <input type="password" name="resendApiKey" value={settings.resendApiKey} onChange={handleSettingsChange} placeholder="re_..." style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={labelStyle}>From Name</label>
                      <input type="text" name="fromName" value={settings.fromName} onChange={handleSettingsChange} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>From Email</label>
                      <input type="email" name="fromEmail" value={settings.fromEmail} onChange={handleSettingsChange} style={inputStyle} />
                    </div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                    Using test domain. <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.yellow }}>Verify yellowcircle.io</a> to send from custom domain.
                  </p>
                </div>
              </div>

              {/* Security Notice */}
              <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#92400e' }}>
                  🔐 <strong>Secure Storage:</strong> API keys are encrypted with AES-256 using your access password. Keys are never stored in plain text or source code.
                </p>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                {[
                  { label: 'Groq', configured: !!settings.groqApiKey },
                  { label: 'Perplexity', configured: !!settings.perplexityApiKey },
                  { label: 'Resend', configured: !!settings.resendApiKey }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: item.configured ? '#10b981' : '#9ca3af' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.configured ? '#10b981' : '#e5e7eb' }} />
                    {item.label} {item.configured ? 'ready' : 'not configured'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {currentStep > 0 && (
            <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', animation: 'fadeInUp 0.5s ease-out' }}>
              {stepLabels.map((label, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', flex: idx < stepLabels.length - 1 ? 1 : 'none' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: currentStep > idx ? '#10b981' : currentStep === idx ? COLORS.yellow : '#e5e7eb',
                    color: currentStep >= idx ? '#000' : '#9ca3af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '600', fontSize: '12px', transition: 'all 0.3s'
                  }}>
                    {currentStep > idx ? '✓' : idx + 1}
                  </div>
                  <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: currentStep === idx ? '600' : '400', color: currentStep === idx ? '#000' : '#6b7280', display: idx > 2 && window.innerWidth < 900 ? 'none' : 'inline' }}>
                    {label}
                  </span>
                  {idx < stepLabels.length - 1 && (
                    <div style={{ flex: 1, height: '2px', backgroundColor: currentStep > idx ? '#10b981' : '#e5e7eb', margin: '0 12px', transition: 'background-color 0.3s' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px', animation: 'fadeInUp 0.3s ease-out' }}>
              {error}
              <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>×</button>
            </div>
          )}
          {successMessage && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#16a34a', fontSize: '14px', animation: 'fadeInUp 0.3s ease-out' }}>
              {successMessage}
            </div>
          )}

          {/* Step 0: Select Send Type */}
          {currentStep === 0 && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              {/* Motion Selector */}
              <div style={{ ...cardStyle }}>
                <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  1. Select Outreach Motion
                </h2>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {Object.values(OUTREACH_MOTIONS).map(motion => (
                    <div
                      key={motion.id}
                      onClick={() => setSelectedMotion(motion.id)}
                      style={{
                        flex: 1, padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                        border: `2px solid ${selectedMotion === motion.id ? COLORS.yellow : '#e5e7eb'}`,
                        backgroundColor: selectedMotion === motion.id ? 'rgba(238, 207, 0, 0.1)' : 'white'
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{motion.icon}</div>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>{motion.name}</h3>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{motion.description}</p>
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
                        Template: {motion.templateType === 'designed' ? '📧 HTML Marketing' : '📝 Plain Text'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        Reply-to: {motion.replyTo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Type Selector */}
              <div style={{ ...cardStyle }}>
                <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  2. Select Send Type
                </h2>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {Object.values(SEND_TYPES).map(type => (
                    <div
                      key={type.id}
                      onClick={() => type.available && setSendType(type.id)}
                      style={{
                        flex: 1, padding: '16px', borderRadius: '8px', transition: 'all 0.2s',
                        cursor: type.available ? 'pointer' : 'not-allowed',
                        border: `2px solid ${sendType === type.id ? COLORS.yellow : '#e5e7eb'}`,
                        backgroundColor: sendType === type.id ? 'rgba(238, 207, 0, 0.1)' : type.available ? 'white' : '#f9fafb',
                        opacity: type.available ? 1 : 0.6
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{type.icon}</div>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#111827' }}>{type.name}</h3>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{type.description}</p>
                      {type.comingSoon && (
                        <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '10px', fontWeight: '600', backgroundColor: '#e5e7eb', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          Coming Soon
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setCurrentStep(1)}
                  disabled={!sendType}
                  style={{ ...primaryButtonStyle, ...disabledStyle(!sendType) }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Recipient Information */}
          {currentStep === 1 && (
            <div style={{ ...cardStyle, animation: 'fadeInUp 0.5s ease-out' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>
                {selectedMotion === 'sales' ? 'Prospect' : 'Recipient'} Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Company *</label>
                  <input type="text" name="company" value={formData.company} onChange={handleInputChange} placeholder="Acme Corp" style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Industry</label>
                  <select name="industry" value={formData.industry} onChange={handleInputChange} style={inputStyle}>
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
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Jane" style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Smith" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="jane@acme.com" style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="VP Marketing" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{selectedMotion === 'sales' ? 'Trigger Type' : 'Content Type'}</label>
                <select name="trigger" value={formData.trigger} onChange={handleInputChange} style={inputStyle}>
                  <option value="">Select...</option>
                  {triggerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {selectedMotion === 'brand' && formData.trigger && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Content Title</label>
                    <input type="text" name="contentTitle" value={formData.contentTitle} onChange={handleInputChange} placeholder="Why Your GTM Sucks" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Content URL</label>
                    <input type="url" name="contentUrl" value={formData.contentUrl} onChange={handleInputChange} placeholder={BRAND.links.article} style={inputStyle} />
                  </div>
                </div>
              )}

              {formData.trigger && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>{selectedMotion === 'sales' ? 'Trigger Details' : 'Additional Context'}</label>
                  <textarea name="triggerDetails" value={formData.triggerDetails} onChange={handleInputChange} placeholder={selectedMotion === 'sales' ? "e.g., Series B funding announced last week..." : "e.g., They recently posted about GTM challenges..."} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                <button onClick={() => setCurrentStep(0)} style={secondaryButtonStyle}>← Back</button>
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.company || !formData.firstName || !formData.email}
                  style={{ ...primaryButtonStyle, ...disabledStyle(!formData.company || !formData.firstName || !formData.email) }}
                >
                  Generate →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Generate */}
          {currentStep === 2 && (
            <div style={{ ...cardStyle, animation: 'fadeInUp 0.5s ease-out' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Ready to Generate</h2>

              <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Summary</h3>
                  <span style={{ fontSize: '12px', backgroundColor: COLORS.yellow, padding: '4px 8px', borderRadius: '12px', fontWeight: '500' }}>
                    {OUTREACH_MOTIONS[selectedMotion].icon} {OUTREACH_MOTIONS[selectedMotion].name}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.8' }}>
                  <div><strong>Company:</strong> {formData.company}</div>
                  <div><strong>Contact:</strong> {formData.firstName} {formData.lastName} ({formData.email})</div>
                  {formData.title && <div><strong>Title:</strong> {formData.title}</div>}
                  <div><strong>Template:</strong> {OUTREACH_MOTIONS[selectedMotion].templateType === 'designed' ? 'HTML Marketing Email' : 'Plain Text with Signature'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setCurrentStep(1)} style={secondaryButtonStyle}>← Back</button>
                <button onClick={handleGenerate} disabled={isGenerating} style={{ ...primaryButtonStyle, ...disabledStyle(isGenerating) }}>
                  {isGenerating ? (
                    <>
                      <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Generating...
                    </>
                  ) : 'Generate Emails ✨'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Edit */}
          {currentStep === 3 && editedEmails && (
            <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              {/* Email Selector Tabs */}
              <div style={{ ...cardStyle, padding: '0', display: 'flex', overflow: 'hidden' }}>
                {['Initial Email', 'Follow-up #1', 'Follow-up #2'].map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedEmailIndex(idx)}
                    style={{
                      flex: 1, padding: '16px', border: 'none', background: selectedEmailIndex === idx ? COLORS.yellow : 'white',
                      fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                      borderBottom: selectedEmailIndex === idx ? 'none' : '2px solid #e5e7eb'
                    }}
                  >
                    {label}
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '400', color: '#6b7280', marginTop: '2px' }}>
                      Day {selectedMotion === 'sales' ? [0, 3, 10][idx] : [0, 7, 14][idx]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Email Editor */}
              <div style={{ ...cardStyle }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Edit Email</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setPreviewMode('text')} style={{ ...buttonStyle, padding: '6px 12px', fontSize: '11px', backgroundColor: previewMode === 'text' ? COLORS.yellow : '#f3f4f6', color: '#111827' }}>Edit</button>
                    {OUTREACH_MOTIONS[selectedMotion].templateType === 'designed' && (
                      <>
                        <button onClick={() => setPreviewMode('html')} style={{ ...buttonStyle, padding: '6px 12px', fontSize: '11px', backgroundColor: previewMode === 'html' ? COLORS.yellow : '#f3f4f6', color: '#111827' }}>Preview</button>
                        <button onClick={() => setShowComponentLibrary(true)} style={{ ...buttonStyle, padding: '6px 12px', fontSize: '11px', backgroundColor: '#f3f4f6', color: '#111827' }}>📚 Components</button>
                      </>
                    )}
                    <button onClick={() => copyToClipboard(`Subject: ${editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].subject}\n\n${editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].body}`, 0)} style={{ ...secondaryButtonStyle, padding: '6px 12px', fontSize: '11px' }}>
                      {copiedIndex === 0 ? '✓ Copied' : 'Copy'}
                    </button>
                    {OUTREACH_MOTIONS[selectedMotion].templateType === 'designed' && (
                      <button onClick={handleCopyHTML} style={{ ...secondaryButtonStyle, padding: '6px 12px', fontSize: '11px' }}>Copy HTML</button>
                    )}
                  </div>
                </div>

                {previewMode === 'text' ? (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Subject</label>
                      <input
                        type="text"
                        value={editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].subject}
                        onChange={(e) => handleEmailEdit('subject', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Body</label>
                      <textarea
                        value={editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].body}
                        onChange={(e) => handleEmailEdit('body', e.target.value)}
                        style={{ ...inputStyle, minHeight: '300px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    <iframe
                      ref={previewRef}
                      srcDoc={generateBrandEmailHTML(
                        editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].subject,
                        editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].body
                      )}
                      style={{ width: '100%', height: '600px', border: 'none' }}
                      title="Email Preview"
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button onClick={() => setCurrentStep(2)} style={secondaryButtonStyle}>← Back</button>
                  <button onClick={() => setCurrentStep(4)} style={primaryButtonStyle}>Refine →</button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Refine */}
          {currentStep === 4 && editedEmails && (
            <div style={{ ...cardStyle, animation: 'fadeInUp 0.5s ease-out' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Refine with AI</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                Use Perplexity to review and improve your email copy. Add specific feedback below or leave blank for general refinement.
              </p>

              {/* Current Email Preview */}
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Current: {['Initial Email', 'Follow-up #1', 'Follow-up #2'][selectedEmailIndex]}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                  {editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].subject}
                </div>
                <div style={{ fontSize: '13px', color: '#4b5563', whiteSpace: 'pre-wrap', maxHeight: '150px', overflow: 'auto' }}>
                  {editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].body}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Refinement Feedback (Optional)</label>
                <textarea
                  value={refinementFeedback}
                  onChange={(e) => setRefinementFeedback(e.target.value)}
                  placeholder="e.g., Make it more casual, add a specific stat, shorten the intro..."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                {REFINEMENT_LLMS.map(llm => (
                  <button
                    key={llm.id}
                    onClick={llm.available ? handleRefine : undefined}
                    disabled={!llm.available || isRefining}
                    style={{
                      ...secondaryButtonStyle,
                      flex: 1,
                      ...disabledStyle(!llm.available || isRefining),
                      backgroundColor: llm.available ? 'white' : '#f9fafb'
                    }}
                  >
                    {isRefining && llm.id === 'perplexity' ? (
                      <>
                        <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        Refining...
                      </>
                    ) : (
                      <>
                        {llm.name}
                        {!llm.available && <span style={{ fontSize: '10px', marginLeft: '4px' }}>(Soon)</span>}
                      </>
                    )}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setCurrentStep(3)} style={secondaryButtonStyle}>← Back to Edit</button>
                <button onClick={() => setCurrentStep(5)} style={primaryButtonStyle}>Proof & Send →</button>
              </div>
            </div>
          )}

          {/* Step 5: Send */}
          {currentStep === 5 && editedEmails && (
            <div style={{ ...cardStyle, animation: 'fadeInUp 0.5s ease-out' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Test & Send</h2>

              {/* Email Summary */}
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px', color: '#111827' }}>
                  <div>
                    <strong>To:</strong> {formData.firstName} {formData.lastName} &lt;{formData.email}&gt;
                  </div>
                  <div>
                    <strong>From:</strong> {settings.fromName} &lt;{settings.fromEmail}&gt;
                  </div>
                  <div>
                    <strong>Reply-To:</strong> {OUTREACH_MOTIONS[selectedMotion].replyTo}
                  </div>
                  <div>
                    <strong>Template:</strong> {OUTREACH_MOTIONS[selectedMotion].templateType === 'designed' ? 'HTML' : 'Plain Text'}
                  </div>
                </div>
              </div>

              {/* Email Selector */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Select Email to Send</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['Initial', 'Follow-up #1', 'Follow-up #2'].map((label, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEmailIndex(idx)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer',
                        border: `2px solid ${selectedEmailIndex === idx ? COLORS.yellow : '#e5e7eb'}`,
                        backgroundColor: selectedEmailIndex === idx ? 'rgba(238, 207, 0, 0.1)' : 'white',
                        fontWeight: '600', fontSize: '13px', color: '#111827'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Email Preview */}
              <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                  Subject: {editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].subject}
                </div>
                <div style={{ fontSize: '13px', color: '#4b5563', whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>
                  {editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].body}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setCurrentStep(4)} style={secondaryButtonStyle}>← Back</button>
                  <button onClick={downloadAsJson} style={secondaryButtonStyle}>📥 JSON</button>
                  {OUTREACH_MOTIONS[selectedMotion].templateType === 'designed' && (
                    <button onClick={handleCopyHTML} style={secondaryButtonStyle}>📋 HTML</button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleSendTest} disabled={isSending || !settings.resendApiKey} style={{ ...secondaryButtonStyle, ...disabledStyle(isSending || !settings.resendApiKey) }}>
                    {isSending ? 'Sending...' : '🧪 Send Test'}
                  </button>
                  <button onClick={handleSendLive} disabled={isSending || !settings.resendApiKey} style={{ ...successButtonStyle, ...disabledStyle(isSending || !settings.resendApiKey) }}>
                    {isSending ? 'Sending...' : '🚀 Send Live'}
                  </button>
                </div>
              </div>

              {!settings.resendApiKey && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '12px', textAlign: 'right' }}>
                  Configure Resend API key in settings to enable sending
                </p>
              )}
            </div>
          )}

          <div style={{ height: '100px' }} />
        </div>
      </div>

      {/* Component Library Slide Panel */}
      {showComponentLibrary && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setShowComponentLibrary(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 200,
              animation: 'fadeIn 0.2s ease-out'
            }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '500px',
            maxWidth: '90vw',
            height: '100vh',
            backgroundColor: '#ffffff',
            boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
            zIndex: 201,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out'
          }}>
            {/* Panel Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                📚 Email Component Library
              </h2>
              <button
                onClick={() => setShowComponentLibrary(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                These components are used to build yellowCircle branded emails. Each component uses table-based layouts for maximum email client compatibility.
              </p>

              {/* Component List */}
              {[
                {
                  name: 'EmailWrapper',
                  description: 'Main container with background and preheader support',
                  props: ['children', 'backgroundColor', 'width', 'preheader'],
                  code: `<EmailWrapper preheader="Preview text here">\n  {/* email content */}\n</EmailWrapper>`
                },
                {
                  name: 'Header',
                  description: 'Logo header with optional link',
                  props: ['logoUrl', 'logoAlt', 'logoWidth', 'linkUrl'],
                  code: `<Header\n  logoUrl="https://..."\n  linkUrl="https://yellowcircle.io"\n/>`
                },
                {
                  name: 'Hero',
                  description: 'Two-column hero with headline and image',
                  props: ['headline', 'subheadline', 'imageUrl', 'backgroundColor', 'reversed'],
                  code: `<Hero\n  headline="OWN YOUR STORY"\n  subheadline="Build your brand"\n  imageUrl="https://..."\n/>`
                },
                {
                  name: 'HeroFullWidth',
                  description: 'Single column centered hero',
                  props: ['headline', 'subheadline', 'backgroundColor', 'align'],
                  code: `<HeroFullWidth\n  headline="Big Announcement"\n  backgroundColor="#EECF00"\n/>`
                },
                {
                  name: 'Button',
                  description: 'Bulletproof CTA button',
                  props: ['text', 'href', 'variant (primary/secondary/dark)', 'align', 'fullWidth'],
                  code: `<Button\n  text="Learn More"\n  href="https://..."\n  variant="primary"\n/>`
                },
                {
                  name: 'IconRow',
                  description: 'Horizontal icons with labels (SCALE, SHIP, GROW)',
                  props: ['items: [{icon, label, description}]', 'iconSize'],
                  code: `<IconRow\n  items={[\n    { icon: "url", label: "SCALE" },\n    { icon: "url", label: "SHIP" },\n  ]}\n/>`
                },
                {
                  name: 'Footer',
                  description: 'Nav links, social icons, copyright',
                  props: ['navLinks', 'showSocial', 'companyName', 'unsubscribeUrl'],
                  code: `<Footer\n  showSocial={true}\n  companyName="yellowCircle"\n/>`
                },
                {
                  name: 'Divider / Spacer',
                  description: 'Horizontal line and vertical spacing',
                  props: ['color', 'height', 'padding'],
                  code: `<Divider color="#e5e7eb" />\n<Spacer height={30} />`
                },
                {
                  name: 'Text Components',
                  description: 'Heading, Paragraph, Label, Quote, List',
                  props: ['level (1-3)', 'color', 'align', 'size'],
                  code: `<Heading level={1}>Title</Heading>\n<Paragraph>Body text...</Paragraph>\n<List items={["Item 1", "Item 2"]} />`
                }
              ].map((component, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '600', color: COLORS.yellow }}>
                    {component.name}
                  </h3>
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#4b5563' }}>
                    {component.description}
                  </p>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>
                    <strong>Props:</strong> {component.props.join(', ')}
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '10px',
                    backgroundColor: '#1f2937',
                    color: '#e5e7eb',
                    borderRadius: '6px',
                    fontSize: '11px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {component.code}
                  </pre>
                </div>
              ))}

              {/* Import Example */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#ecfdf5',
                borderRadius: '8px',
                border: '1px solid #a7f3d0'
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#065f46' }}>
                  Import in your project:
                </h4>
                <pre style={{
                  margin: 0,
                  padding: '10px',
                  backgroundColor: '#1f2937',
                  color: '#e5e7eb',
                  borderRadius: '6px',
                  fontSize: '11px',
                  overflow: 'auto'
                }}>
{`import {
  EmailWrapper,
  Header,
  Hero,
  Button,
  Footer,
  BRAND_CONFIG
} from '../components/email';`}
                </pre>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}
    </Layout>
  );
}

export default OutreachBusinessPage;
