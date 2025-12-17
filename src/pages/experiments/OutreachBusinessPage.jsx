import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/global/Layout';
import { COLORS, TYPOGRAPHY, EFFECTS } from '../../styles/constants';
import { navigationItems } from '../../config/navigationItems';
import UserMenu from '../../components/auth/UserMenu';

// Encryption key for settings (deterministic, per-user encryption)
// Note: Access control is now handled via SSO (isAdmin check)
// Prefix is configurable via env var for flexibility; default matches existing encrypted data
const ENCRYPTION_KEY_PREFIX = import.meta.env.VITE_ENCRYPTION_PREFIX || 'yc-outreach';

// API keys - users must enter their own keys via the settings panel
// Keys are encrypted and stored in localStorage
const DEFAULT_KEYS = {
  groq: '',
  resend: '',
  perplexity: ''
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
    available: true
  },
  trigger: {
    id: 'trigger',
    name: 'Automated / Trigger-Based',
    description: 'Set up rules to automatically send based on events',
    icon: '⚡',
    available: true
  }
};

// Sample prospect data for testing
const SAMPLE_PROSPECTS = [
  {
    id: 'sample-1',
    company: 'TechFlow Inc',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@techflow.io',
    title: 'VP of Marketing',
    industry: 'B2B SaaS',
    trigger: 'funding',
    triggerDetails: 'Series B funding of $25M announced last week, expanding GTM team'
  },
  {
    id: 'sample-2',
    company: 'DataScale',
    firstName: 'Marcus',
    lastName: 'Johnson',
    email: 'marcus@datascale.com',
    title: 'Head of Revenue Operations',
    industry: 'Fintech',
    trigger: 'hiring',
    triggerDetails: 'Posted 3 new marketing ops roles on LinkedIn this month'
  },
  {
    id: 'sample-3',
    company: 'CloudNine Solutions',
    firstName: 'Emily',
    lastName: 'Park',
    email: 'emily.park@cloudnine.io',
    title: 'Director of Demand Gen',
    industry: 'B2B SaaS',
    trigger: 'content',
    triggerDetails: 'Recent LinkedIn post about struggling with attribution and GTM alignment'
  }
];

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

Best,

Christopher Cooper
GTM & Marketing Operations Consultant
yellowCircle

christopher@yellowcircle.io
914-241-5524
yellowcircle.io`;

// Email section defaults for toggles
const DEFAULT_EMAIL_SECTIONS = {
  showLogo: true,
  showHeroImage: true,
  showHeadline: true,
  showBody: true,
  showCta: true,
  showInterstitial: true,
  showUpsellCards: true,
  showSocialBar: true,
  showFooter: true,
  showUnsubscribe: true
};

// Generate HTML email template for brand/marcom - Based on Tunecore-style template
const generateBrandEmailHTML = (subject, body, preheader = '', sections = DEFAULT_EMAIL_SECTIONS, customContent = {}) => {
  // Get random image from picsum (more reliable than Unsplash)
  const heroImageUrl = customContent.heroImage || 'https://picsum.photos/360/240?random=' + Date.now();
  const primaryColor = BRAND.colors.yellow;
  const secondaryColor = '#000000'; // Changed from blue to black
  const accentColor = '#666666'; // Changed from green to grey
  const ctaText = customContent.ctaText || 'GET IN TOUCH';
  const ctaUrl = customContent.ctaUrl || BRAND.links.calendar;
  const interstitialHeadline = customContent.interstitialHeadline || 'Here are some other<br><strong>Services</strong><br>that you may like';
  const upsellCards = customContent.upsellCards || [
    { title: 'GTM<br>Strategy', description: '[Placeholder: GTM strategy service description]', cta: 'LEARN MORE' },
    { title: 'Marketing<br>Ops', description: '[Placeholder: Marketing operations service description]', cta: 'LEARN MORE' },
    { title: 'Tech<br>Stack', description: '[Placeholder: Tech stack service description]', cta: 'LEARN MORE' }
  ];

  // Convert body text to proper HTML paragraphs - split on double newlines OR sentences ending with period followed by space
  const formattedBody = body
    .split(/\n\n|\. (?=[A-Z])/)
    .filter(p => p.trim())
    .map((p, i, arr) => {
      // Add period back if it was used as split point (except for last segment)
      const text = p.trim();
      const needsPeriod = i < arr.length - 1 && !text.endsWith('.') && !text.endsWith('?') && !text.endsWith('!');
      return `<p style="margin:0 0 16px 0;font-size:16px;font-weight:300;line-height:1.6;color:#0a0a0a;">${text}${needsPeriod ? '.' : ''}</p>`;
    })
    .join('');

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en" style="background:#fff!important">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>
    @media only screen and (max-width: 480px) {
      .mobile-hide { display: none !important; }
      .mobile-break { display: block !important; }
      .button { width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#fff!important;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;font-weight:100;line-height:1.3;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ''}

  <table style="width:100%;background:#fff;border-collapse:collapse;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:0;">
        <table style="width:100%;max-width:600px;margin:0 auto;background:#fff;border-collapse:collapse;">
          <tr>
            <td style="padding:0;">

              ${sections.showLogo ? `
              <!-- LOGO HEADER - yellowCircle wordmark left-aligned -->
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:24px 32px;">
                    <a href="${BRAND.links.website}" style="background-color:#000;padding:10px 20px;text-decoration:none;display:inline-block;">
                      <span style="font-size:16px;font-weight:600;letter-spacing:0.2em;margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                        <span style="color:#EECF00;font-style:italic;">yellow</span><span style="color:#fff;">CIRCLE</span>
                      </span>
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- MAIN CONTENT -->
              <table style="width:100%;border-collapse:collapse;background:#fff;">
                <tr>
                  <td style="padding:0 32px;">

                    ${sections.showHeadline ? `
                    <!-- CATEGORY LABEL -->
                    <p style="margin:0 0 10px 0;color:${accentColor};font-size:13px;font-weight:200;text-transform:uppercase;letter-spacing:0.05em;">
                      <span style="color:${primaryColor};font-weight:bold;" data-placeholder="categoryLabel">[CATEGORY LABEL]</span>
                      <br><span data-placeholder="subCategory">[SUBCATEGORY]</span>
                    </p>

                    ${sections.showHeroImage ? `
                    <!-- HERO IMAGE -->
                    <img src="${heroImageUrl}" alt="" width="360" style="max-width:360px;width:100%;height:auto;display:block;margin-bottom:20px;border:0;">
                    ` : ''}

                    <!-- HEADLINE -->
                    <h2 style="margin:0 0 20px 0;color:${secondaryColor};font-size:28px;font-weight:700;line-height:1.3;text-transform:uppercase;">
                      <span data-placeholder="headline">${subject}</span>
                    </h2>
                    ` : ''}

                    ${sections.showBody ? `
                    <!-- BODY COPY -->
                    <div data-placeholder="bodyText">${formattedBody}</div>
                    ` : ''}

                    ${sections.showCta ? `
                    <!-- CTA BUTTON -->
                    <table style="margin:20px 0 30px 0;border-collapse:collapse;">
                      <tr>
                        <td style="background:${primaryColor};border-radius:3px;">
                          <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:900;color:#000;text-decoration:none;letter-spacing:0.05em;" data-placeholder="ctaText">${ctaText}</a>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                  </td>
                </tr>
              </table>

              ${sections.showInterstitial ? `
              <!-- INTERSTITIAL BAR -->
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="background:${primaryColor};padding:30px 32px;" align="center">
                    <h3 style="margin:0;color:#000;font-size:24px;font-weight:lighter;line-height:1.3;text-align:center;" data-placeholder="interstitialText">${interstitialHeadline}</h3>
                  </td>
                  <td class="mobile-hide" style="background:${secondaryColor};background-image:url('https://picsum.photos/300/300?random=${Date.now() + 1}');background-size:cover;width:150px;"></td>
                </tr>
              </table>
              ` : ''}

              ${sections.showUpsellCards ? `
              <!-- UPSELL CARDS -->
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  ${upsellCards.map((card, i) => {
                    const cardColors = ['rgb(251, 191, 36)', 'rgb(217, 164, 32)', 'rgb(183, 138, 28)'];
                    return `
                  <td style="background:${cardColors[i % 3]};border-right:2px solid #fff;border-top:2px solid #fff;padding:20px;width:33.33%;vertical-align:top;">
                    <h3 style="margin:0 0 12px 0;padding-top:20px;color:#000;font-size:22px;font-weight:100;line-height:1.2;" data-placeholder="cardTitle${i+1}">${card.title}</h3>
                    <p style="margin:0 0 12px 0;color:#000;font-size:12px;font-weight:200;line-height:1.4;" data-placeholder="cardDesc${i+1}">${card.description}</p>
                    <table style="margin:0;border-collapse:collapse;">
                      <tr>
                        <td style="border:2px solid #000;border-radius:3px;padding:6px 12px;">
                          <a href="${BRAND.links.calendar}" style="color:#000;font-size:11px;font-weight:600;text-decoration:none;letter-spacing:0.05em;" data-placeholder="cardCta${i+1}">${card.cta}</a>
                        </td>
                      </tr>
                    </table>
                  </td>`;
                  }).join('')}
                </tr>
              </table>
              ` : ''}

              ${sections.showFooter ? `
              <!-- FOOTER - Website Style -->
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <!-- Left Column - Contact -->
                  <td style="background:#000;padding:30px 32px;width:50%;vertical-align:top;">
                    <h4 style="margin:0 0 16px 0;color:#fff;font-size:14px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;border-bottom:2px solid ${primaryColor};padding-bottom:12px;">CONTACT</h4>
                    <p style="margin:0 0 8px 0;color:#fff;font-size:13px;font-weight:300;">info@yellowcircle.io</p>
                    <p style="margin:0 0 8px 0;">
                      <a href="https://linkedin.com/company/yellowcircle-io" style="color:#fff;text-decoration:none;font-size:13px;font-weight:300;">
                        <span style="display:inline-block;width:16px;font-weight:bold;margin-right:6px;">in</span>LINKEDIN
                      </a>
                    </p>
                    <p style="margin:0 0 16px 0;">
                      <a href="https://instagram.com/yellowcircle.io" style="color:#fff;text-decoration:none;font-size:13px;font-weight:300;">
                        <span style="display:inline-block;width:16px;margin-right:6px;">📷</span>INSTAGRAM
                      </a>
                    </p>
                    <table style="margin:16px 0 0 0;border-collapse:collapse;">
                      <tr>
                        <td style="background:${primaryColor};border-radius:3px;">
                          <a href="${BRAND.links.calendar}" style="display:inline-block;padding:10px 20px;font-size:12px;font-weight:900;color:#000;text-decoration:none;letter-spacing:0.05em;">GET IN TOUCH</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Right Column - Projects -->
                  <td style="background:${primaryColor};padding:30px 32px;width:50%;vertical-align:top;">
                    <h4 style="margin:0 0 16px 0;color:#000;font-size:14px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;border-bottom:2px solid #000;padding-bottom:12px;">PROJECTS</h4>
                    <p style="margin:0 0 8px 0;"><a href="${BRAND.links.website}/experiments/golden-unknown" style="color:#000;text-decoration:none;font-size:13px;font-weight:400;letter-spacing:0.05em;">GOLDEN UNKNOWN</a></p>
                    <p style="margin:0 0 8px 0;"><a href="${BRAND.links.website}/experiments/being-rhyme" style="color:#000;text-decoration:none;font-size:13px;font-weight:400;letter-spacing:0.05em;">BEING + RHYME</a></p>
                    <p style="margin:0 0 8px 0;"><a href="${BRAND.links.website}/experiments/cath3dral" style="color:#000;text-decoration:none;font-size:13px;font-weight:400;letter-spacing:0.05em;">CATH3DRAL</a></p>
                    <p style="margin:0 0 8px 0;"><a href="${BRAND.links.website}/about" style="color:#000;text-decoration:none;font-size:13px;font-weight:400;letter-spacing:0.05em;">RHO CONSULTING</a></p>
                    <p style="margin:0 0 8px 0;"><a href="${BRAND.links.website}/uk-memories" style="color:#000;text-decoration:none;font-size:13px;font-weight:400;letter-spacing:0.05em;">TRAVEL MEMORIES</a></p>
                  </td>
                </tr>
              </table>
              <!-- Copyright & Unsubscribe -->
              <table style="width:100%;border-collapse:collapse;background:#fff;">
                <tr>
                  <td style="padding:20px 32px;">
                    <table style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td style="width:40px;vertical-align:middle;">
                          <img src="https://res.cloudinary.com/yellowcircle-io/image/upload/v1756494388/yc-logo_xbntno.png" alt="YC" width="32" height="32" style="display:block;border-radius:50%;">
                        </td>
                        <td style="vertical-align:middle;padding-left:12px;">
                          <p style="margin:0;color:#666;font-size:11px;line-height:1.5;">
                            © ${new Date().getFullYear()} yellowCircle. All rights reserved.
                          </p>
                        </td>
                        <td style="text-align:right;vertical-align:middle;">
                          ${sections.showUnsubscribe ? `
                          <p style="margin:0;color:#999;font-size:11px;">
                            <a href="#" style="color:#999;text-decoration:underline;">unsubscribe</a> |
                            <a href="#" style="color:#999;text-decoration:underline;">update preferences</a> |
                            <a href="#" style="color:#999;text-decoration:underline;">view in browser</a>
                          </p>
                          ` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

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
  const [searchParams] = useSearchParams();
  const { sidebarOpen, footerOpen, handleFooterToggle, handleMenuToggle } = useLayout();
  const { isAdmin, user, userProfile, signOut: _signOut } = useAuth();
  const previewRef = useRef(null);
  const fileInputRef = useRef(null); // For batch CSV upload

  // Access is controlled by SSO - premium/client users can access this page
  // No password gate needed - encryption uses user's UID as key
  const isPremium = userProfile?.subscription?.tier === 'premium';
  const hasAccess = isAdmin || isPremium;

  // Settings state
  const [settings, setSettings] = useState({
    groqApiKey: DEFAULT_KEYS.groq,
    resendApiKey: DEFAULT_KEYS.resend,
    perplexityApiKey: DEFAULT_KEYS.perplexity,
    selectedModel: 'llama-3.3-70b-versatile',
    sendProvider: 'resend',
    enableSending: true,
    fromEmail: 'christopher@yellowcircle.io',
    fromName: 'Chris Cooper',
    // API Toggles
    enableGeneration: true,
    enableRefinement: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);

  // Batch upload state
  const [batchRecipients, setBatchRecipients] = useState([]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, results: [] });

  // Trigger automation state
  const [triggerRules, _setTriggerRules] = useState([]);

  // Workflow state
  const [sendType, setSendType] = useState(null); // 'manual', 'batch', 'trigger'
  const [selectedMotion, setSelectedMotion] = useState('sales');
  const [currentStep, setCurrentStep] = useState(0); // 0: Select type, 1: Recipient, 2: Generate, 3: Review, 4: Refine, 5: Send

  // Track if editing an existing campaign (store timestamp for replacement)
  const [editingCampaignTimestamp, setEditingCampaignTimestamp] = useState(null);

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
  const [_generatedEmails, setGeneratedEmails] = useState(null);
  const [editedEmails, setEditedEmails] = useState(null);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState('text'); // 'text', 'html', or 'components'
  const [refinementFeedback, setRefinementFeedback] = useState('');
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);

  // Enhanced editor state
  const [subjectVariants, setSubjectVariants] = useState({}); // { initial: ['variant1', 'variant2'], ... }
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [selectedAbVariants, setSelectedAbVariants] = useState([]); // indices of selected A/B variants
  const [preheaderText, setPreheaderText] = useState(''); // Preview text / preheader
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [ctaConfig, setCtaConfig] = useState({ text: 'GET IN TOUCH', url: '', style: 'primary' });
  const [showSnippetLibrary, setShowSnippetLibrary] = useState(false);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Email section toggles
  const [emailSections, setEmailSections] = useState(DEFAULT_EMAIL_SECTIONS);
  const [showToggles, setShowToggles] = useState(false);

  // Encryption key derived from user's UID (deterministic per-user)
  const encryptionKey = user?.uid ? `${ENCRYPTION_KEY_PREFIX}-${user.uid}` : null;

  // Load saved motion from localStorage
  useEffect(() => {
    const savedMotion = localStorage.getItem('outreach_business_motion');
    if (savedMotion && OUTREACH_MOTIONS[savedMotion]) {
      setSelectedMotion(savedMotion);
    }
  }, []);

  // Load encrypted settings when admin user is authenticated
  useEffect(() => {
    if (hasAccess && encryptionKey) {
      const loadEncryptedSettings = async () => {
        // If DEFAULT_KEYS are available, clear old settings that have empty keys
        const hasDefaultKeys = DEFAULT_KEYS.groq || DEFAULT_KEYS.resend || DEFAULT_KEYS.perplexity;

        const savedSettings = localStorage.getItem('outreach_business_settings_v4');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            const decrypted = await decryptSettings(parsed, encryptionKey);
            if (decrypted) {
              // Check if saved settings have empty API keys while defaults have values
              const savedHasEmptyKeys = !decrypted.groqApiKey && !decrypted.resendApiKey && !decrypted.perplexityApiKey;

              if (hasDefaultKeys && savedHasEmptyKeys) {
                // Clear old settings and use defaults
                localStorage.removeItem('outreach_business_settings_v4');
                return; // Keep using initial state with DEFAULT_KEYS
              }

              // Merge but prefer DEFAULT_KEYS for API keys if localStorage has empty values
              setSettings(prev => ({
                ...prev,
                ...decrypted,
                // Use DEFAULT_KEYS if they have values and localStorage doesn't
                groqApiKey: decrypted.groqApiKey || DEFAULT_KEYS.groq || prev.groqApiKey,
                resendApiKey: decrypted.resendApiKey || DEFAULT_KEYS.resend || prev.resendApiKey,
                perplexityApiKey: decrypted.perplexityApiKey || DEFAULT_KEYS.perplexity || prev.perplexityApiKey
              }));
            }
          } catch (_e) {
            console.error('Failed to load encrypted settings');
            // If decryption fails and we have DEFAULT_KEYS, clear and use defaults
            if (hasDefaultKeys) {
              localStorage.removeItem('outreach_business_settings_v4');
            }
          }
        }
      };
      loadEncryptedSettings();
    }
  }, [isAdmin, encryptionKey]);

  // Save encrypted settings to localStorage
  useEffect(() => {
    if (hasAccess && encryptionKey) {
      const saveEncryptedSettings = async () => {
        const encrypted = await encryptSettings(settings, encryptionKey);
        if (encrypted) {
          localStorage.setItem('outreach_business_settings_v4', JSON.stringify(encrypted));
        }
        localStorage.setItem('outreach_business_motion', selectedMotion);
      };
      saveEncryptedSettings();
    }
  }, [settings, selectedMotion, isAdmin, encryptionKey]);

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

  // Handle bi-directional editing from UnityMAP
  useEffect(() => {
    const fromMap = searchParams.get('from') === 'unity-map';
    const isEdit = searchParams.get('edit') === 'true';

    if (fromMap && isEdit) {
      // Load edit context from localStorage
      try {
        const editContext = localStorage.getItem('unity-outreach-edit-context');
        if (editContext) {
          const context = JSON.parse(editContext);
          // Pre-populate form with existing data
          if (context.prospect) {
            setFormData(prev => ({
              ...prev,
              company: context.prospect.company || '',
              firstName: context.prospect.firstName || '',
              lastName: context.prospect.lastName || '',
              email: context.prospect.email || '',
              title: context.prospect.title || '',
              industry: context.prospect.industry || 'B2B SaaS',
              trigger: context.prospect.trigger || '',
              triggerDetails: context.prospect.triggerDetails || ''
            }));
          }
          // Pre-populate emails if available
          if (context.emails && context.emails.length > 0) {
            const emailData = {};
            const stages = ['initial', 'followup1', 'followup2'];
            context.emails.forEach((email, idx) => {
              if (idx < 3) {
                emailData[stages[idx]] = {
                  subject: email.subject || '',
                  body: email.body || email.fullBody || ''
                };
              }
            });
            setEditedEmails(emailData);
            setGeneratedEmails(emailData);
          }
          // Store campaign timestamp for replacing old nodes on deploy
          if (context.campaignTimestamp) {
            setEditingCampaignTimestamp(context.campaignTimestamp);
          }
          // Set workflow state
          setSendType('manual');
          setCurrentStep(context.emails && context.emails.length > 0 ? 3 : 1); // Go to Review if has emails, else Recipient
          // Clear the edit context
          localStorage.removeItem('unity-outreach-edit-context');
        }
      } catch (e) {
        console.error('Failed to load edit context:', e);
      }
    }
  }, [searchParams]);

  // CSV parsing function for batch upload
  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const headerMap = {
      company: headers.findIndex(h => h.includes('company') || h === 'organization'),
      firstName: headers.findIndex(h => h.includes('first') || h === 'firstname'),
      lastName: headers.findIndex(h => h.includes('last') || h === 'lastname'),
      email: headers.findIndex(h => h.includes('email') || h === 'mail'),
      title: headers.findIndex(h => h.includes('title') || h.includes('position') || h === 'role'),
      industry: headers.findIndex(h => h.includes('industry') || h === 'sector'),
      trigger: headers.findIndex(h => h.includes('trigger') || h === 'reason'),
      triggerDetails: headers.findIndex(h => h.includes('detail') || h.includes('context') || h === 'notes')
    };

    const recipients = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length < 3) continue; // Skip invalid rows

      recipients.push({
        id: `batch-${Date.now()}-${i}`,
        company: headerMap.company >= 0 ? values[headerMap.company] : '',
        firstName: headerMap.firstName >= 0 ? values[headerMap.firstName] : '',
        lastName: headerMap.lastName >= 0 ? values[headerMap.lastName] : '',
        email: headerMap.email >= 0 ? values[headerMap.email] : '',
        title: headerMap.title >= 0 ? values[headerMap.title] : '',
        industry: headerMap.industry >= 0 ? values[headerMap.industry] : 'B2B SaaS',
        trigger: headerMap.trigger >= 0 ? values[headerMap.trigger] : '',
        triggerDetails: headerMap.triggerDetails >= 0 ? values[headerMap.triggerDetails] : ''
      });
    }
    return recipients.filter(r => r.email && r.firstName); // Must have email and firstName
  };

  // Handle CSV file upload
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const recipients = parseCSV(text);
        setBatchRecipients(recipients);
        if (recipients.length > 0) {
          setSuccessMessage(`Loaded ${recipients.length} recipients from CSV`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError('No valid recipients found in CSV. Required columns: email, firstName');
        }
      }
    };
    reader.readAsText(file);
  };

  // Process batch recipients
  const processBatchGeneration = async () => {
    if (batchRecipients.length === 0) return;

    setBatchProgress({ current: 0, total: batchRecipients.length, results: [] });
    setIsGenerating(true);

    const results = [];
    for (let i = 0; i < batchRecipients.length; i++) {
      const recipient = batchRecipients[i];
      setBatchProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        // Generate email for this recipient
        const recipientFormData = {
          ...recipient,
          industry: recipient.industry || 'B2B SaaS'
        };

        // Use existing generation logic (generateEmail function)
        const motion = OUTREACH_MOTIONS[selectedMotion];
        const promptContent = selectedMotion === 'sales' ? `
RECIPIENT:
- Company: ${recipientFormData.company}
- Name: ${recipientFormData.firstName} ${recipientFormData.lastName || ''}
- Title: ${recipientFormData.title || 'Unknown'}
- Industry: ${recipientFormData.industry}
- Trigger: ${recipientFormData.trigger || 'None'}
- Trigger Details: ${recipientFormData.triggerDetails || 'None'}` : `
RECIPIENT:
- Company: ${recipientFormData.company}
- Name: ${recipientFormData.firstName}
- Title: ${recipientFormData.title || 'Unknown'}
- Industry: ${recipientFormData.industry}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: settings.selectedModel,
            messages: [
              { role: 'system', content: motion.systemPrompt },
              { role: 'user', content: `${promptContent}\n\nGenerate a personalized initial email.` }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
          const bodyMatch = content.match(/(?:Body:|Email:)\s*([\s\S]+)/i);

          results.push({
            recipient,
            success: true,
            email: {
              subject: subjectMatch ? subjectMatch[1].trim() : `Quick note for ${recipientFormData.company}`,
              body: bodyMatch ? bodyMatch[1].trim() : content
            }
          });
        } else {
          results.push({ recipient, success: false, error: 'API call failed' });
        }
      } catch (err) {
        results.push({ recipient, success: false, error: err.message });
      }

      // Small delay between requests to avoid rate limiting
      if (i < batchRecipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setBatchProgress(prev => ({ ...prev, results }));
    setIsGenerating(false);

    const successCount = results.filter(r => r.success).length;
    setSuccessMessage(`Generated ${successCount}/${batchRecipients.length} emails successfully`);
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
          model: 'sonar',
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

  // Generate subject line variants with AI
  const generateSubjectVariants = async () => {
    if (!settings.groqApiKey) {
      setError('Please configure your Groq API key first');
      return;
    }

    setIsGeneratingVariants(true);
    setError(null);

    try {
      const stages = ['initial', 'followup1', 'followup2'];
      const stage = stages[selectedEmailIndex];
      const currentSubject = editedEmails[stage].subject;
      const currentBody = editedEmails[stage].body;
      const _motion = OUTREACH_MOTIONS[selectedMotion];

      const prompt = `You are an expert email marketer. Generate 3 alternative subject lines for this ${selectedMotion === 'sales' ? 'cold outreach' : 'marketing'} email.

CURRENT SUBJECT: ${currentSubject}
EMAIL BODY PREVIEW: ${currentBody.substring(0, 300)}...
RECIPIENT: ${formData.firstName} at ${formData.company} (${formData.industry})

REQUIREMENTS:
- Keep under 50 characters each
- Vary the approach: curiosity, value prop, personalization
- ${selectedMotion === 'sales' ? 'No clickbait, be direct and professional' : 'Can be more creative and engaging'}
- Consider A/B testing angles

Return ONLY a JSON array with exactly 3 strings:
["Subject variant 1", "Subject variant 2", "Subject variant 3"]`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: settings.selectedModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'API request failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const variants = JSON.parse(jsonMatch[0]);
        setSubjectVariants(prev => ({
          ...prev,
          [stage]: variants
        }));
        setSuccessMessage('Generated 3 subject variants!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(`Failed to generate variants: ${err.message}`);
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  // Apply subject variant
  const applySubjectVariant = (variant) => {
    const stages = ['initial', 'followup1', 'followup2'];
    const _stage = stages[selectedEmailIndex];
    handleEmailEdit('subject', variant);
  };

  // Toggle A/B variant selection
  const toggleAbVariant = (index) => {
    setSelectedAbVariants(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else if (prev.length < 2) {
        return [...prev, index];
      }
      return prev; // Max 2 variants
    });
  };

  // Available merge variables
  const MERGE_VARIABLES = [
    { key: '{{firstName}}', label: 'First Name', example: formData.firstName || 'Jane' },
    { key: '{{lastName}}', label: 'Last Name', example: formData.lastName || 'Smith' },
    { key: '{{company}}', label: 'Company', example: formData.company || 'Acme Corp' },
    { key: '{{title}}', label: 'Title', example: formData.title || 'VP Marketing' },
    { key: '{{industry}}', label: 'Industry', example: formData.industry || 'B2B SaaS' },
    { key: '{{senderName}}', label: 'Sender Name', example: settings.fromName },
    { key: '{{calendarLink}}', label: 'Calendar Link', example: BRAND.links.calendar }
  ];

  // Insert variable at cursor position
  const insertVariable = (variable) => {
    const stages = ['initial', 'followup1', 'followup2'];
    const stage = stages[selectedEmailIndex];
    const currentBody = editedEmails[stage].body;
    handleEmailEdit('body', currentBody + variable);
    setShowVariablePicker(false);
  };

  // Snippet library content
  const SNIPPETS = [
    {
      name: 'Social Proof',
      content: 'Companies like [Company A] and [Company B] have seen [X%] improvement in their GTM efficiency.'
    },
    {
      name: 'Quick Stat',
      content: 'Did you know that 73% of B2B companies struggle with GTM alignment?'
    },
    {
      name: 'Soft CTA',
      content: 'Would love to hear your thoughts on this. Feel free to reply or grab 15 minutes here: {{calendarLink}}'
    },
    {
      name: 'Value Prop',
      content: 'I help companies like {{company}} streamline their marketing operations and reduce wasted spend.'
    },
    {
      name: 'Breakup Line',
      content: 'I know you\'re busy, so I\'ll keep this brief. If this isn\'t relevant, just let me know and I\'ll stop reaching out.'
    },
    {
      name: 'Trigger Reference',
      content: 'I noticed {{company}} recently [trigger event]. That usually signals [pain point].'
    }
  ];

  // Insert snippet
  const insertSnippet = (content) => {
    const stages = ['initial', 'followup1', 'followup2'];
    const stage = stages[selectedEmailIndex];
    const currentBody = editedEmails[stage].body;
    handleEmailEdit('body', currentBody + '\n\n' + content);
    setShowSnippetLibrary(false);
  };

  // Deploy to UnityMAP
  const deployToUnityMap = () => {
    // Save email sequence to localStorage for UnityMAP to pick up
    const deployment = {
      id: `outreach-${Date.now()}`,
      timestamp: Date.now(),
      motion: selectedMotion,
      prospect: formData,
      emails: editedEmails,
      originPath: '/outreach', // Track where campaign originated for bi-directional editing
      // Include editing timestamp for replacing old nodes when editing
      editingTimestamp: editingCampaignTimestamp || null,
      abTest: abTestEnabled ? {
        enabled: true,
        variants: selectedAbVariants.map(i => {
          const stages = ['initial', 'followup1', 'followup2'];
          return subjectVariants[stages[selectedEmailIndex]]?.[i];
        })
      } : null
    };

    localStorage.setItem(`unity-outreach-deployment-${deployment.id}`, JSON.stringify(deployment));
    localStorage.setItem('unity-last-outreach-deployment', Date.now().toString());
    // Store origin for quick lookup
    localStorage.setItem('unity-outreach-origin', '/outreach');

    // Clear editing state after deploy
    if (editingCampaignTimestamp) {
      setEditingCampaignTimestamp(null);
    }

    setSuccessMessage('Deploying to UnityMAP...');
    setTimeout(() => {
      navigate('/unity-notes?from=outreach&mode=map');
    }, 1000);
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
      emailPayload.html = generateBrandEmailHTML(emailData.subject, emailData.body, '', emailSections);
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
  const _handleCopyCLI = async (isTest = false) => {
    const stages = ['initial', 'followup1', 'followup2'];
    const stage = stages[selectedEmailIndex];
    const command = generateCLICommand(editedEmails[stage], isTest);

    try {
      await navigator.clipboard.writeText(command);
      setSuccessMessage(`CLI command copied! Paste in terminal to ${isTest ? 'send test' : 'send live'}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (_err) {
      setError('Failed to copy to clipboard');
    }
  };

  // Copy HTML to clipboard
  const handleCopyHTML = async () => {
    const stages = ['initial', 'followup1', 'followup2'];
    const stage = stages[selectedEmailIndex];
    const html = generateBrandEmailHTML(editedEmails[stage].subject, editedEmails[stage].body, '', emailSections);

    try {
      await navigator.clipboard.writeText(html);
      setSuccessMessage('HTML copied to clipboard!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (_err) {
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
      payload.html = generateBrandEmailHTML(emailData.subject, emailData.body, '', emailSections);
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
  const _dangerButtonStyle = { ...buttonStyle, backgroundColor: '#ef4444', color: '#fff' };
  const successButtonStyle = { ...buttonStyle, backgroundColor: COLORS.yellow, color: '#000', fontWeight: '700' };

  const disabledStyle = (isDisabled) => ({
    opacity: isDisabled ? 0.5 : 1,
    cursor: isDisabled ? 'not-allowed' : 'pointer'
  });

  // SSO-based access gate - premium/client users
  if (!hasAccess) {
    return (
      <Layout onHomeClick={handleHomeClick} onFooterToggle={handleFooterToggle} onMenuToggle={handleMenuToggle} navigationItems={navigationItems} pageLabel="OUTREACH" hideParallaxCircle>
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100 }}>
          <div style={{ ...cardStyle, width: '400px', maxWidth: '90vw', textAlign: 'center', animation: 'fadeInUp 0.5s ease-out' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#ef4444', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>Premium Access Required</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              This tool is restricted to yellowCircle clients.
            </p>
            {!user ? (
              <UserMenu />
            ) : (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                Signed in as {user.email}
              </p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Step labels for progress indicator
  const stepLabels = ['Send Type', 'Recipient', 'Generate', 'Review & Edit', 'Refine', 'Send'];

  return (
    <Layout onHomeClick={handleHomeClick} onFooterToggle={handleFooterToggle} onMenuToggle={handleMenuToggle} navigationItems={navigationItems} pageLabel="OUTREACH" hideParallaxCircle>
      <div className="outreach-scroll" style={{
        position: 'fixed',
        top: '100px',
        bottom: footerOpen ? '400px' : '40px',
        left: sidebarOpen ? 'max(calc(min(35vw, 472px) + 20px), 12vw)' : 'max(100px, 8vw)',
        right: '100px',
        zIndex: 61,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'left 0.5s ease-out, bottom 0.5s ease-out',
        paddingRight: '20px',
        // Custom scrollbar styling - 10px yellow
        scrollbarWidth: 'thin',
        scrollbarColor: `${COLORS.yellow} #e5e7eb`
      }}>
        <style>{`
          .outreach-scroll::-webkit-scrollbar {
            width: 10px;
          }
          .outreach-scroll::-webkit-scrollbar-track {
            background: #e5e7eb;
            border-radius: 5px;
          }
          .outreach-scroll::-webkit-scrollbar-thumb {
            background: ${COLORS.yellow};
            border-radius: 5px;
          }
          .outreach-scroll::-webkit-scrollbar-thumb:hover {
            background: #d4b800;
          }
          @media (max-width: 768px) {
            .outreach-scroll {
              left: max(100px, 8vw) !important;
              right: 20px !important;
            }
          }
          .email-preview-frame::-webkit-scrollbar {
            display: none;
          }
          .email-preview-frame {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '20px', animation: 'fadeInUp 0.6s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h1 style={{ ...TYPOGRAPHY.h1Scaled, color: COLORS.yellow, ...EFFECTS.blurLight, display: 'inline-block', margin: 0 }}>UNITY HUB</h1>
              <UserMenu />
            </div>
            <p style={{ fontSize: '14px', color: '#4b5563', backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'inline-block', padding: '4px 8px', borderRadius: '4px', marginBottom: '12px' }}>
              Internal outreach platform with AI generation, refinement, and direct sending
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setShowSettings(!showSettings)} style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}>
                ⚙️ Settings {showSettings ? '▲' : '▼'}
              </button>
              <button onClick={() => setShowSampleData(!showSampleData)} style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px', backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
                📊 Sample Data {showSampleData ? '▲' : '▼'}
              </button>
              {currentStep > 0 && (
                <button onClick={resetWorkflow} style={{ ...secondaryButtonStyle, padding: '10px 16px', fontSize: '13px' }}>
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

              {/* API Toggles */}
              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#065f46', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  API Toggles
                </h3>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="enableGeneration"
                      checked={settings.enableGeneration}
                      onChange={handleSettingsChange}
                      style={{ width: '16px', height: '16px', accentColor: COLORS.yellow }}
                    />
                    <span style={{ fontSize: '13px', color: '#374151' }}>Generation (Groq)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="enableRefinement"
                      checked={settings.enableRefinement}
                      onChange={handleSettingsChange}
                      style={{ width: '16px', height: '16px', accentColor: COLORS.yellow }}
                    />
                    <span style={{ fontSize: '13px', color: '#374151' }}>Refinement (Perplexity)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="enableSending"
                      checked={settings.enableSending}
                      onChange={handleSettingsChange}
                      style={{ width: '16px', height: '16px', accentColor: COLORS.yellow }}
                    />
                    <span style={{ fontSize: '13px', color: '#374151' }}>Sending (Resend)</span>
                  </label>
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
                  { label: 'Generation', configured: settings.enableGeneration && !!settings.groqApiKey },
                  { label: 'Refinement', configured: settings.enableRefinement && !!settings.perplexityApiKey },
                  { label: 'Sending', configured: settings.enableSending && !!settings.resendApiKey }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: item.configured ? 'rgb(251, 191, 36)' : '#9ca3af' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.configured ? 'rgb(251, 191, 36)' : '#e5e7eb' }} />
                    {item.label} {item.configured ? 'active' : 'inactive'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sample Data Panel */}
          {showSampleData && (
            <div style={{ ...cardStyle, borderColor: COLORS.yellow, animation: 'fadeInUp 0.3s ease-out', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Sample Prospect Data</h2>
                <button onClick={() => setShowSampleData(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Click on a sample prospect to load their data into the form. Useful for testing the workflow.
              </p>
              <div style={{ display: 'grid', gap: '12px' }}>
                {SAMPLE_PROSPECTS.map((prospect) => (
                  <div
                    key={prospect.id}
                    onClick={() => {
                      setFormData({
                        company: prospect.company,
                        firstName: prospect.firstName,
                        lastName: prospect.lastName,
                        email: prospect.email,
                        title: prospect.title,
                        industry: prospect.industry,
                        trigger: prospect.trigger,
                        triggerDetails: prospect.triggerDetails,
                        contentTitle: '',
                        contentUrl: ''
                      });
                      setShowSampleData(false);
                      if (currentStep === 0 && sendType) setCurrentStep(1);
                      setSuccessMessage(`Loaded sample data for ${prospect.firstName} at ${prospect.company}`);
                      setTimeout(() => setSuccessMessage(null), 3000);
                    }}
                    style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = COLORS.yellow;
                      e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                          {prospect.firstName} {prospect.lastName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {prospect.title} at {prospect.company}
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', backgroundColor: COLORS.yellow, padding: '2px 8px', borderRadius: '12px', color: '#000', fontWeight: '500' }}>
                        {prospect.industry}
                      </span>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af' }}>
                      <strong>Trigger:</strong> {prospect.triggerDetails.substring(0, 80)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vertical Progress Indicator with Yellow Bar - Responsive to sidebar */}
          {currentStep > 0 && window.innerWidth > 900 && (
            <div style={{
              position: 'fixed',
              left: sidebarOpen ? 'calc(min(35vw, 472px) + 20px)' : '100px',
              top: '100px',
              bottom: footerOpen ? '420px' : '60px',
              width: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              zIndex: 62,
              transition: 'left 0.5s ease-out, bottom 0.5s ease-out',
              overflow: 'hidden'
            }}>
              {/* Yellow progress fill */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: `${((currentStep) / (stepLabels.length - 1)) * 100}%`,
                backgroundColor: COLORS.yellow,
                borderRadius: '2px',
                transition: 'height 0.5s ease-out'
              }} />
              {/* Step markers */}
              {stepLabels.map((label, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: `${(idx / (stepLabels.length - 1)) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: currentStep > idx ? COLORS.yellow : currentStep === idx ? COLORS.yellow : '#fff',
                    border: `2px solid ${currentStep >= idx ? COLORS.yellow : '#e5e7eb'}`,
                    cursor: 'pointer',
                    zIndex: 1,
                    transition: 'all 0.3s'
                  }}
                  title={label}
                />
              ))}
            </div>
          )}
          {/* Vertical step labels - Responsive to sidebar */}
          {currentStep > 0 && window.innerWidth > 900 && (
            <div style={{
              position: 'fixed',
              left: sidebarOpen ? 'calc(min(35vw, 472px) + 32px)' : '112px',
              top: '100px',
              bottom: footerOpen ? '420px' : '60px',
              width: '60px',
              zIndex: 62,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'left 0.5s ease-out, bottom 0.5s ease-out'
            }}>
              {stepLabels.map((label, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '8px',
                    fontWeight: currentStep === idx ? '700' : '400',
                    color: currentStep >= idx ? '#000' : '#9ca3af',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    transform: 'translateY(-50%)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'color 0.3s'
                  }}
                >
                  {currentStep > idx ? '✓ ' : ''}{label}
                </span>
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

          {/* Step 1: Recipient Information (varies by send type) */}
          {currentStep === 1 && (
            <div style={{ ...cardStyle, animation: 'fadeInUp 0.5s ease-out' }}>
              {/* MANUAL: Single recipient form */}
              {sendType === 'manual' && (
                <>
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
                </>
              )}

              {/* BATCH: CSV Upload + Recipient List */}
              {sendType === 'batch' && (
                <>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>
                    Batch Upload Recipients
                  </h2>

                  {/* CSV Upload Area */}
                  <div style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '12px',
                    padding: '32px',
                    textAlign: 'center',
                    marginBottom: '24px',
                    backgroundColor: '#f9fafb',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = COLORS.yellow; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#d1d5db';
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.name.endsWith('.csv')) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const text = evt.target?.result;
                          if (typeof text === 'string') {
                            const recipients = parseCSV(text);
                            setBatchRecipients(recipients);
                            if (recipients.length > 0) {
                              setSuccessMessage(`Loaded ${recipients.length} recipients from CSV`);
                              setTimeout(() => setSuccessMessage(null), 3000);
                            }
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={handleCSVUpload}
                    />
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Drop CSV file here or click to upload
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                      Required columns: email, firstName • Optional: company, lastName, title, industry, trigger, triggerDetails
                    </p>
                  </div>

                  {/* Recipient List */}
                  {batchRecipients.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                          Recipients ({batchRecipients.length})
                        </h3>
                        <button
                          onClick={() => setBatchRecipients([])}
                          style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Clear All
                        </button>
                      </div>
                      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Company</th>
                              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Title</th>
                              <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', width: '40px' }}>×</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchRecipients.map((r, idx) => (
                              <tr key={r.id || idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '10px' }}>{r.firstName} {r.lastName}</td>
                                <td style={{ padding: '10px', color: '#6b7280' }}>{r.email}</td>
                                <td style={{ padding: '10px' }}>{r.company}</td>
                                <td style={{ padding: '10px', color: '#6b7280' }}>{r.title}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                  <button
                                    onClick={() => setBatchRecipients(prev => prev.filter((_, i) => i !== idx))}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}
                                  >×</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Batch Progress */}
                  {batchProgress.total > 0 && (
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a' }}>
                          Processing: {batchProgress.current} / {batchProgress.total}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {batchProgress.results.filter(r => r.success).length} successful
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#d1fae5', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                          height: '100%',
                          backgroundColor: '#16a34a',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                    <button onClick={() => setCurrentStep(0)} style={secondaryButtonStyle}>← Back</button>
                    <button
                      onClick={processBatchGeneration}
                      disabled={batchRecipients.length === 0 || isGenerating}
                      style={{ ...primaryButtonStyle, ...disabledStyle(batchRecipients.length === 0 || isGenerating) }}
                    >
                      {isGenerating ? `Generating (${batchProgress.current}/${batchProgress.total})...` : `Generate ${batchRecipients.length} Emails →`}
                    </button>
                  </div>
                </>
              )}

              {/* TRIGGER: Automation Rules */}
              {sendType === 'trigger' && (
                <>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>
                    Trigger-Based Automation
                  </h2>

                  <div style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                    <p style={{ fontSize: '14px', color: '#854d0e', margin: 0 }}>
                      <strong>Coming Soon:</strong> Configure rules to automatically generate and send emails based on triggers like:
                    </p>
                    <ul style={{ fontSize: '13px', color: '#a16207', marginTop: '12px', marginBottom: 0, paddingLeft: '20px' }}>
                      <li>New lead added to CRM</li>
                      <li>Website form submission</li>
                      <li>Webhook from external service</li>
                      <li>Scheduled campaign launch</li>
                    </ul>
                  </div>

                  {/* Trigger Rule Builder */}
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                      Create Trigger Rule
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={labelStyle}>Trigger Type</label>
                        <select style={inputStyle} defaultValue="">
                          <option value="">Select trigger...</option>
                          <option value="webhook">Webhook Received</option>
                          <option value="form">Form Submission</option>
                          <option value="crm">CRM Lead Created</option>
                          <option value="schedule">Scheduled Time</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Action</label>
                        <select style={inputStyle} defaultValue="generate">
                          <option value="generate">Generate Email Only</option>
                          <option value="generate_send">Generate & Send</option>
                          <option value="queue">Add to Queue</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Email Template</label>
                      <select style={inputStyle} defaultValue="">
                        <option value="">Use motion defaults</option>
                        <option value="sales_cold">Sales - Cold Outreach</option>
                        <option value="brand_newsletter">Brand - Newsletter</option>
                      </select>
                    </div>

                    <button
                      style={{ ...secondaryButtonStyle, width: '100%' }}
                      onClick={() => {
                        setSuccessMessage('Trigger rules will be available in a future update');
                        setTimeout(() => setSuccessMessage(null), 3000);
                      }}
                    >
                      + Add Trigger Rule
                    </button>
                  </div>

                  {/* Existing Rules */}
                  {triggerRules.length > 0 ? (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                        Active Rules ({triggerRules.length})
                      </h3>
                      {/* Rule list would go here */}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '14px' }}>
                      No trigger rules configured yet
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                    <button onClick={() => setCurrentStep(0)} style={secondaryButtonStyle}>← Back</button>
                    <button
                      style={{ ...primaryButtonStyle, opacity: 0.5, cursor: 'not-allowed' }}
                      disabled
                    >
                      Save & Activate Rules
                    </button>
                  </div>
                </>
              )}
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
                      flex: 1, padding: '16px', border: 'none',
                      background: selectedEmailIndex === idx ? COLORS.yellow : '#f9fafb',
                      color: '#111827',
                      fontWeight: selectedEmailIndex === idx ? '700' : '500',
                      fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                      borderBottom: selectedEmailIndex === idx ? 'none' : '2px solid #e5e7eb',
                      borderRight: idx < 2 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    {label}
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '400', color: selectedEmailIndex === idx ? '#000' : '#6b7280', marginTop: '2px' }}>
                      Day {selectedMotion === 'sales' ? [0, 3, 10][idx] : [0, 7, 14][idx]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Email Editor */}
              <div style={{ ...cardStyle }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Edit Email</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <button onClick={() => setPreviewMode('text')} style={{ ...buttonStyle, padding: '5px 10px', fontSize: '10px', backgroundColor: previewMode === 'text' ? COLORS.yellow : '#f3f4f6', color: '#111827' }}>Edit</button>
                    {OUTREACH_MOTIONS[selectedMotion].templateType === 'designed' && (
                      <>
                        <button onClick={() => setPreviewMode('html')} style={{ ...buttonStyle, padding: '5px 10px', fontSize: '10px', backgroundColor: previewMode === 'html' ? COLORS.yellow : '#f3f4f6', color: '#111827' }}>Preview</button>
                        <button onClick={() => setShowComponentLibrary(true)} style={{ ...buttonStyle, padding: '5px 10px', fontSize: '10px', backgroundColor: '#f3f4f6', color: '#111827' }}>📚</button>
                      </>
                    )}
                    <button onClick={() => copyToClipboard(`Subject: ${editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].subject}\n\n${editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].body}`, 0)} style={{ ...secondaryButtonStyle, padding: '5px 10px', fontSize: '10px' }}>
                      {copiedIndex === 0 ? '✓' : 'Copy'}
                    </button>
                    {OUTREACH_MOTIONS[selectedMotion].templateType === 'designed' && (
                      <button onClick={handleCopyHTML} style={{ ...secondaryButtonStyle, padding: '5px 10px', fontSize: '10px' }}>HTML</button>
                    )}
                  </div>
                </div>

                {previewMode === 'text' ? (
                  <>
                    {/* Enhanced Subject Line Section */}
                    <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ ...labelStyle, margin: 0 }}>Subject Line</label>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={generateSubjectVariants}
                            disabled={isGeneratingVariants}
                            style={{
                              padding: '4px 10px',
                              fontSize: '10px',
                              fontWeight: '600',
                              backgroundColor: COLORS.yellow,
                              color: '#000',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: isGeneratingVariants ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {isGeneratingVariants ? (
                              <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            ) : '✨'} AI Variants
                          </button>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#6b7280', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={abTestEnabled}
                              onChange={(e) => {
                                setAbTestEnabled(e.target.checked);
                                if (!e.target.checked) setSelectedAbVariants([]);
                              }}
                              style={{ width: '14px', height: '14px', accentColor: COLORS.yellow }}
                            />
                            A/B Test
                          </label>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].subject}
                        onChange={(e) => handleEmailEdit('subject', e.target.value)}
                        style={{ ...inputStyle, marginBottom: '8px' }}
                        placeholder="Enter subject line..."
                      />
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        {editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].subject.length} characters
                        {editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].subject.length > 50 && (
                          <span style={{ color: '#f59e0b', marginLeft: '8px' }}>(consider shortening for mobile)</span>
                        )}
                      </div>

                      {/* Subject Variants */}
                      {subjectVariants[['initial', 'followup1', 'followup2'][selectedEmailIndex]]?.length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e5e7eb' }}>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            AI Generated Variants {abTestEnabled && '(select 2 for A/B test)'}
                          </div>
                          {subjectVariants[['initial', 'followup1', 'followup2'][selectedEmailIndex]].map((variant, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                marginBottom: '4px',
                                backgroundColor: selectedAbVariants.includes(i) ? 'rgba(251, 191, 36, 0.2)' : '#fff',
                                border: `1px solid ${selectedAbVariants.includes(i) ? COLORS.yellow : '#e5e7eb'}`,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onClick={() => abTestEnabled ? toggleAbVariant(i) : applySubjectVariant(variant)}
                            >
                              {abTestEnabled && (
                                <input
                                  type="checkbox"
                                  checked={selectedAbVariants.includes(i)}
                                  onChange={() => toggleAbVariant(i)}
                                  style={{ width: '14px', height: '14px', accentColor: COLORS.yellow }}
                                />
                              )}
                              <span style={{ flex: 1, fontSize: '13px', color: '#111827' }}>{variant}</span>
                              <span style={{ fontSize: '10px', color: '#9ca3af' }}>{variant.length} chars</span>
                              {!abTestEnabled && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); applySubjectVariant(variant); }}
                                  style={{
                                    padding: '2px 8px',
                                    fontSize: '9px',
                                    backgroundColor: '#f3f4f6',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Use
                                </button>
                              )}
                            </div>
                          ))}
                          {abTestEnabled && selectedAbVariants.length === 2 && (
                            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: '6px', fontSize: '11px', color: '#92400e' }}>
                              A/B test configured: {selectedAbVariants.length}/2 variants selected
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Preview Text / Preheader */}
                    {OUTREACH_MOTIONS[selectedMotion].templateType === 'designed' && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Preview Text (Preheader)</label>
                        <input
                          type="text"
                          value={preheaderText}
                          onChange={(e) => setPreheaderText(e.target.value)}
                          placeholder="Text shown after subject in inbox preview..."
                          style={inputStyle}
                        />
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                          {preheaderText.length}/100 characters (aim for 40-100 for best results)
                        </div>
                      </div>
                    )}

                    {/* Body Editor with Tools */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ ...labelStyle, margin: 0 }}>Body</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setShowVariablePicker(!showVariablePicker)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '10px',
                              fontWeight: '500',
                              backgroundColor: showVariablePicker ? COLORS.yellow : '#f3f4f6',
                              color: '#111827',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            {'{{x}}'} Variables
                          </button>
                          <button
                            onClick={() => setShowSnippetLibrary(true)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '10px',
                              fontWeight: '500',
                              backgroundColor: '#f3f4f6',
                              color: '#111827',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            📝 Snippets
                          </button>
                        </div>
                      </div>

                      {/* Variable Picker Dropdown */}
                      {showVariablePicker && (
                        <div style={{
                          marginBottom: '8px',
                          padding: '12px',
                          backgroundColor: '#fefce8',
                          border: '1px solid #fef08a',
                          borderRadius: '8px'
                        }}>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#713f12', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Click to insert merge variable
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {MERGE_VARIABLES.map((v, i) => (
                              <button
                                key={i}
                                onClick={() => insertVariable(v.key)}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  backgroundColor: '#fff',
                                  border: '1px solid #fcd34d',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start'
                                }}
                                title={`Example: ${v.example}`}
                              >
                                <span style={{ fontWeight: '600', color: '#111827' }}>{v.key}</span>
                                <span style={{ fontSize: '9px', color: '#6b7280' }}>{v.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <textarea
                        value={editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].body}
                        onChange={(e) => handleEmailEdit('body', e.target.value)}
                        style={{ ...inputStyle, minHeight: '250px', resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}
                      />
                    </div>

                    {/* CTA Builder for Brand Emails */}
                    {OUTREACH_MOTIONS[selectedMotion].templateType === 'designed' && (
                      <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          CTA Button
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                          <div>
                            <label style={{ ...labelStyle, fontSize: '10px' }}>Button Text</label>
                            <input
                              type="text"
                              value={ctaConfig.text}
                              onChange={(e) => setCtaConfig(prev => ({ ...prev, text: e.target.value }))}
                              style={{ ...inputStyle, fontSize: '13px' }}
                            />
                          </div>
                          <div>
                            <label style={{ ...labelStyle, fontSize: '10px' }}>Button URL</label>
                            <input
                              type="url"
                              value={ctaConfig.url}
                              onChange={(e) => setCtaConfig(prev => ({ ...prev, url: e.target.value }))}
                              placeholder={BRAND.links.calendar}
                              style={{ ...inputStyle, fontSize: '13px' }}
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          <label style={{ ...labelStyle, fontSize: '10px' }}>Button Style</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                              { id: 'primary', label: 'Primary', bg: COLORS.yellow, color: '#000' },
                              { id: 'secondary', label: 'Secondary', bg: 'transparent', color: '#000', border: true },
                              { id: 'dark', label: 'Dark', bg: '#000', color: '#fff' }
                            ].map(style => (
                              <button
                                key={style.id}
                                onClick={() => setCtaConfig(prev => ({ ...prev, style: style.id }))}
                                style={{
                                  padding: '8px 16px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  backgroundColor: style.bg,
                                  color: style.color,
                                  border: ctaConfig.style === style.id ? `2px solid ${COLORS.yellow}` : style.border ? '2px solid #000' : '2px solid transparent',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Collapsible Section Toggles Panel */}
                    <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <button
                        onClick={() => setShowToggles(!showToggles)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em'
                        }}
                      >
                        <span>⚙️ Section Toggles</span>
                        <span>{showToggles ? '▲' : '▼'}</span>
                      </button>
                      {showToggles && (
                        <div style={{ padding: '0 14px 14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {[
                            { key: 'showLogo', label: 'Logo' },
                            { key: 'showHeroImage', label: 'Hero' },
                            { key: 'showHeadline', label: 'Headline' },
                            { key: 'showBody', label: 'Body' },
                            { key: 'showCta', label: 'CTA' },
                            { key: 'showInterstitial', label: 'Interstitial' },
                            { key: 'showUpsellCards', label: 'Upsell' },
                            { key: 'showFooter', label: 'Footer' },
                            { key: 'showUnsubscribe', label: 'Unsub' }
                          ].map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={() => setEmailSections(prev => ({ ...prev, [key]: !prev[key] }))}
                              style={{
                                padding: '4px 10px',
                                fontSize: '10px',
                                fontWeight: emailSections[key] ? '600' : '400',
                                backgroundColor: emailSections[key] ? COLORS.yellow : '#fff',
                                color: emailSections[key] ? '#000' : '#9ca3af',
                                border: `1px solid ${emailSections[key] ? COLORS.yellow : '#e5e7eb'}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {emailSections[key] ? '✓ ' : ''}{label}
                            </button>
                          ))}
                          <button
                            onClick={() => setEmailSections(DEFAULT_EMAIL_SECTIONS)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '10px',
                              backgroundColor: '#fff',
                              color: '#6b7280',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Email Preview - Scrollable but hidden scrollbar with yellow circle background */}
                    <div style={{ flex: 1, position: 'relative' }}>
                      {/* Yellow circle background */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '400px',
                        height: '400px',
                        backgroundColor: 'rgb(251, 191, 36)',
                        borderRadius: '50%',
                        opacity: 0.15,
                        pointerEvents: 'none',
                        zIndex: 0
                      }} />
                      <div style={{ position: 'relative', zIndex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                        <iframe
                          ref={previewRef}
                          className="email-preview-frame"
                          srcDoc={generateBrandEmailHTML(
                            editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].subject,
                            editedEmails[['initial', 'followup1', 'followup2'][selectedEmailIndex]].body,
                            '',
                            emailSections
                          )}
                          style={{ width: '100%', height: '700px', border: 'none' }}
                          title="Email Preview"
                        />
                      </div>
                    </div>
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
            <div style={{ ...cardStyle, backgroundColor: 'rgba(251, 191, 36, 0.15)', border: `2px solid ${COLORS.yellow}`, animation: 'fadeInUp 0.5s ease-out' }}>
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Initial', 'Follow-up #1', 'Follow-up #2'].map((label, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEmailIndex(idx)}
                      style={{
                        flex: '1 1 auto', minWidth: '100px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                        border: `2px solid ${selectedEmailIndex === idx ? COLORS.yellow : '#e5e7eb'}`,
                        backgroundColor: selectedEmailIndex === idx ? 'rgba(238, 207, 0, 0.1)' : 'white',
                        fontWeight: '600', fontSize: '12px', color: '#111827'
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button onClick={() => setCurrentStep(4)} style={{ ...secondaryButtonStyle, padding: '8px 12px', fontSize: '12px' }}>← Back</button>
                  <button onClick={downloadAsJson} style={{ ...secondaryButtonStyle, padding: '8px 12px', fontSize: '12px' }}>📥 JSON</button>
                  {OUTREACH_MOTIONS[selectedMotion].templateType === 'designed' && (
                    <button onClick={handleCopyHTML} style={{ ...secondaryButtonStyle, padding: '8px 12px', fontSize: '12px' }}>📋 HTML</button>
                  )}
                  <button
                    onClick={deployToUnityMap}
                    style={{
                      ...secondaryButtonStyle,
                      padding: '8px 12px',
                      fontSize: '12px',
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      borderColor: COLORS.yellow
                    }}
                    title="Deploy this email sequence to UnityMAP for journey building"
                  >
                    🗺️ Deploy to MAP
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button onClick={handleSendTest} disabled={isSending || !settings.resendApiKey} style={{ ...secondaryButtonStyle, padding: '8px 12px', fontSize: '12px', ...disabledStyle(isSending || !settings.resendApiKey) }}>
                    {isSending ? '...' : '🧪 Send Test'}
                  </button>
                  <button onClick={handleSendLive} disabled={isSending || !settings.resendApiKey} style={{ ...successButtonStyle, padding: '8px 12px', fontSize: '12px', ...disabledStyle(isSending || !settings.resendApiKey) }}>
                    {isSending ? '...' : '🚀 Send Live'}
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

      {/* Snippet Library Slide Panel */}
      {showSnippetLibrary && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setShowSnippetLibrary(false)}
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
            width: '400px',
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
                📝 Snippet Library
              </h2>
              <button
                onClick={() => setShowSnippetLibrary(false)}
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
                Click any snippet to insert it at the end of your email body. Variables like {'{{company}}'} will be replaced with recipient data.
              </p>

              {/* Snippet List */}
              {SNIPPETS.map((snippet, idx) => (
                <div
                  key={idx}
                  onClick={() => insertSnippet(snippet.content)}
                  style={{
                    marginBottom: '12px',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = COLORS.yellow;
                    e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: COLORS.yellow }}>
                    {snippet.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.5' }}>
                    {snippet.content}
                  </p>
                </div>
              ))}

              {/* Custom Snippet Section */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#ecfdf5',
                borderRadius: '8px',
                border: '1px solid #a7f3d0'
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#065f46' }}>
                  Pro Tip
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#047857', lineHeight: '1.5' }}>
                  Use merge variables like {'{{firstName}}'}, {'{{company}}'}, or {'{{calendarLink}}'} in your snippets for automatic personalization.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

export default OutreachBusinessPage;
