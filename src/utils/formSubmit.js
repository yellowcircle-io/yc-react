/**
 * Centralized Form Submission Utility
 *
 * All form submissions go through here so webhooks only need
 * to be configured in one place.
 *
 * Sends to:
 * 1. Web3Forms (email notification)
 * 2. Zapier webhook (database + Slack) - when configured
 */

const WEB3FORMS_ACCESS_KEY = '960839cb-2448-4f82-b12a-82ca2eb7197f';

// TODO: Add Zapier webhook URL when ready
// const ZAPIER_WEBHOOK_URL = '';
const ZAPIER_WEBHOOK_URL = '';

/**
 * Get UTM parameters from current URL
 */
const getUTMParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_campaign: urlParams.get('utm_campaign') || '',
    utm_content: urlParams.get('utm_content') || '',
    utm_term: urlParams.get('utm_term') || ''
  };
};

/**
 * Submit form data to Web3Forms and optionally Zapier
 *
 * @param {Object} data - Form data
 * @param {string} data.email - Email address (required)
 * @param {string} data.name - Name
 * @param {string} data.company - Company name
 * @param {string} data.phone - Phone number
 * @param {string} data.message - Message content
 * @param {string} data.source - Source identifier (e.g., 'contact_form', 'assessment', 'lead_gate')
 * @param {string} data.leadType - Type of lead (e.g., 'contact_request', 'tool_access', 'assessment_complete')
 * @param {string} data.tool - Tool name (for lead gates)
 * @param {string} data.service - Service of interest
 * @param {string} data.subject - Email subject line
 * @param {Object} data.extra - Any additional data to include
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function submitForm(data) {
  const utmParams = getUTMParams();
  const timestamp = new Date().toISOString();
  const pageUrl = window.location.pathname;

  // Prepare payload
  const payload = {
    email: data.email,
    name: data.name || '',
    company: data.company || '',
    phone: data.phone || '',
    message: data.message || '',
    source: data.source || 'website',
    lead_type: data.leadType || 'general',
    tool: data.tool || '',
    service: data.service || '',
    page_url: pageUrl,
    timestamp,
    ...utmParams,
    ...(data.extra || {})
  };

  const results = { web3forms: false, zapier: false };

  // 1. Send to Web3Forms
  try {
    const web3Response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        from_name: payload.name || 'Website Visitor',
        email: payload.email,
        subject: data.subject || `New Lead: ${payload.source}`,
        ...payload
      })
    });

    const web3Result = await web3Response.json();
    results.web3forms = web3Result.success;
  } catch (err) {
    console.error('Web3Forms error:', err);
  }

  // 2. Send to Zapier (if configured)
  if (ZAPIER_WEBHOOK_URL) {
    try {
      await fetch(ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      results.zapier = true;
    } catch (err) {
      console.error('Zapier webhook error:', err);
    }
  }

  return {
    success: results.web3forms || results.zapier,
    results
  };
}

/**
 * Submit lead gate access request
 */
export async function submitLeadGate(email, name, toolName) {
  return submitForm({
    email,
    name,
    source: 'lead_gate',
    leadType: 'tool_access',
    tool: toolName,
    subject: `Lead Capture: ${toolName} Access`
  });
}

/**
 * Submit contact form
 */
export async function submitContactForm({ email, name, phone, service, message }) {
  return submitForm({
    email,
    name,
    phone,
    service,
    message,
    source: 'contact_form',
    leadType: 'contact_request',
    subject: `New Contact: ${name || email}${service ? ` - ${service}` : ''}`
  });
}

/**
 * Submit assessment results
 */
export async function submitAssessment({ email, name, company, score, level, categoryScores, recommendations }) {
  const categoryBreakdown = Object.entries(categoryScores)
    .map(([cat, data]) => `${cat}: ${data.total}/${data.count * 5}`)
    .join(', ');

  return submitForm({
    email,
    name,
    company,
    source: 'assessment',
    leadType: 'assessment_complete',
    subject: `GTM Assessment: ${level} (Score: ${score}/40)`,
    extra: {
      assessment_score: `${score}/40`,
      assessment_level: level,
      category_breakdown: categoryBreakdown,
      recommended_services: recommendations?.join(', ') || '',
      message: `GTM Health Assessment completed.\n\nScore: ${score}/40 (${level})\n\nCategory Breakdown:\n${
        Object.entries(categoryScores)
          .map(([cat, data]) => `- ${cat}: ${data.total}/${data.count * 5}`)
          .join('\n')
      }${recommendations?.length ? `\n\nRecommended Services:\n- ${recommendations.join('\n- ')}` : ''}`
    }
  });
}

export default {
  submitForm,
  submitLeadGate,
  submitContactForm,
  submitAssessment
};
