/**
 * Integration Configuration
 *
 * Webhook URLs for prospect/lead pipeline
 * Configure in .env or .env.local
 */

/**
 * Source value mapping (internal → Airtable display)
 * Airtable Single Select fields require exact Title Case values
 */
export const SOURCE_DISPLAY = {
  'lead_gate': 'Lead Gate',
  'lead_gate_sso': 'Lead Gate (SSO)',
  'contact_form': 'Contact Form',
  'assessment': 'Assessment',
  'footer': 'Footer',
  'outreach_tool': 'Outreach Tool',
};

// n8n Webhook for lead capture (Airtable + Slack + AI drafts)
export const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK || '';

// Slack Webhook (direct, bypass n8n if needed)
export const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK || '';

// Web3Forms (existing)
export const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || '960839cb-2448-4f82-b12a-82ca2eb7197f';

/**
 * Send lead data to n8n webhook for processing
 * Pipeline: n8n → Airtable + Slack + Optional AI Draft
 *
 * @param {Object} data - Lead data
 * @param {string} data.email - Required
 * @param {string} data.from_name - Contact name
 * @param {string} data.source - Lead source (contact_form, lead_gate, assessment, outreach_tool)
 * @param {string} data.lead_type - Type (Tool Access, Contact Request, Assessment Complete, Service Inquiry)
 * @param {string} data.message - Optional message
 * @param {string} data.service - Service interest
 * @param {string} data.tool - Tool name if from lead gate
 * @param {number} data.score - Assessment score if applicable
 */
export const sendToN8N = async (data) => {
  if (!N8N_WEBHOOK_URL) {
    console.log('[Integrations] n8n webhook not configured, skipping');
    return { success: false, reason: 'not_configured' };
  }

  try {
    // Extract UTM params
    const urlParams = new URLSearchParams(window.location.search);

    const payload = {
      ...data,
      page: window.location.href,
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status}`);
    }

    console.log('[Integrations] Lead sent to n8n successfully');
    return { success: true };
  } catch (error) {
    console.error('[Integrations] Failed to send to n8n:', error.message);
    return { success: false, reason: error.message };
  }
};

/**
 * Send directly to Slack (fallback if n8n is down)
 */
export const sendToSlack = async (data) => {
  if (!SLACK_WEBHOOK_URL) {
    return { success: false, reason: 'not_configured' };
  }

  try {
    const message = {
      text: `🟡 *New Lead from yellowCircle*\n\n*Email:* ${data.email}\n*Name:* ${data.from_name || 'Unknown'}\n*Source:* ${data.source || 'Unknown'}${data.service ? `\n*Service Interest:* ${data.service}` : ''}${data.message ? `\n*Message:* ${data.message}` : ''}`,
    };

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    return { success: response.ok };
  } catch (error) {
    console.error('[Integrations] Slack webhook failed:', error.message);
    return { success: false, reason: error.message };
  }
};

/**
 * Dual-send to both Web3Forms (for email backup) and n8n (for automation)
 * Use this in form submit handlers
 */
export const sendLeadCapture = async (formData, source, leadType) => {
  const cleanSource = (source || '').trim();
  const mappedSource = (SOURCE_DISPLAY[cleanSource] || cleanSource).trim();

  const leadData = {
    // Core fields (match n8n Airtable mapping)
    email: (formData.email || '').trim(),
    name: (formData.name || formData.from_name || '').trim(),
    company: (formData.company || '').trim(),
    source: mappedSource, // Map to Title Case for Airtable (trimmed)
    sourceInternal: cleanSource, // Keep internal value for programmatic use
    sourceTool: (formData.tool || leadType || '').trim(),

    // Legacy fields for backwards compatibility
    from_name: formData.name || formData.from_name,
    lead_type: leadType,
    message: formData.message || '',
    service: formData.service || formData.interest || '',
    tool: formData.tool || '',
    score: formData.score || null,
  };

  // Fire and forget to n8n (don't block form submission)
  sendToN8N(leadData).catch(() => {});

  return leadData;
};
