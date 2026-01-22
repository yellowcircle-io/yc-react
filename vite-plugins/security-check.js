/* global process */
/**
 * Vite Security Check Plugin
 *
 * Prevents accidental exposure of sensitive API keys in VITE_* environment variables.
 * VITE_* variables are embedded in the frontend JavaScript bundle and are publicly visible.
 *
 * This plugin:
 * 1. Scans all VITE_* environment variables at build time
 * 2. Checks for patterns that look like sensitive API keys
 * 3. Fails the build if sensitive keys are detected (production only)
 * 4. Warns in development mode
 *
 * Usage in vite.config.js:
 *   import securityCheck from './vite-plugins/security-check.js'
 *   export default defineConfig({
 *     plugins: [react(), securityCheck()]
 *   })
 */

// Patterns that indicate sensitive API keys (should NOT be in VITE_* vars)
const SENSITIVE_PATTERNS = [
  // Groq
  { name: 'Groq API Key', pattern: /^gsk_[A-Za-z0-9]{20,}$/ },

  // OpenAI
  { name: 'OpenAI API Key', pattern: /^sk-[A-Za-z0-9]{20,}$/ },
  { name: 'OpenAI Project Key', pattern: /^sk-proj-[A-Za-z0-9_-]{20,}$/ },

  // Anthropic/Claude
  { name: 'Anthropic API Key', pattern: /^sk-ant-[A-Za-z0-9_-]{20,}$/ },

  // Slack
  { name: 'Slack Bot Token', pattern: /^xoxb-[0-9]{10,}-[0-9]{10,}-[A-Za-z0-9]{20,}$/ },
  { name: 'Slack App Token', pattern: /^xapp-[0-9]-[A-Z0-9]+-[0-9]+-[a-f0-9]{64}$/ },
  { name: 'Slack User Token', pattern: /^xoxp-[0-9]{10,}-[0-9]{10,}-[A-Za-z0-9]{20,}$/ },

  // SendGrid
  { name: 'SendGrid API Key', pattern: /^SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}$/ },

  // Mailchimp/Mandrill
  { name: 'Mailchimp API Key', pattern: /^[a-f0-9]{32}-us[0-9]{1,2}$/ },

  // AWS
  { name: 'AWS Secret Key', pattern: /^[A-Za-z0-9/+=]{40}$/ },

  // Stripe
  { name: 'Stripe Secret Key', pattern: /^sk_(live|test)_[A-Za-z0-9]{24,}$/ },
  { name: 'Stripe Restricted Key', pattern: /^rk_(live|test)_[A-Za-z0-9]{24,}$/ },

  // Twilio
  { name: 'Twilio Auth Token', pattern: /^[a-f0-9]{32}$/ },

  // HubSpot
  { name: 'HubSpot API Key', pattern: /^pat-[a-z]{2,3}-[0-9]+-[a-f0-9-]{36}$/ },

  // Airtable
  { name: 'Airtable API Key', pattern: /^pat[A-Za-z0-9]{14}\.[a-f0-9]{64}$/ },
  { name: 'Airtable Legacy Key', pattern: /^key[A-Za-z0-9]{14}$/ },

  // Generic patterns (catch-all for common key formats)
  { name: 'Generic Bearer Token', pattern: /^Bearer [A-Za-z0-9_-]{20,}$/ },
];

// Keys that are SAFE to expose in frontend (designed for client-side use)
const SAFE_PATTERNS = [
  'FIREBASE_API_KEY',     // Firebase web API keys are designed to be public
  'FIREBASE_APP_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_MEASUREMENT_ID',
  'SENTRY_DSN',           // Sentry DSNs are designed to be public
  'GOOGLE_MAPS_API_KEY',  // Maps API keys are restricted by HTTP referrer
  'GOOGLE_MAP_ID',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_UPLOAD_PRESET',
];

export default function securityCheckPlugin(options = {}) {
  const {
    failOnSensitive = process.env.NODE_ENV === 'production',
    verbose = false,
  } = options;

  return {
    name: 'vite-security-check',
    enforce: 'pre',

    config(config, { mode }) {
      const isProduction = mode === 'production';
      const envVars = { ...process.env };

      // Filter to only VITE_* variables
      const viteEnvVars = Object.entries(envVars)
        .filter(([key]) => key.startsWith('VITE_'));

      const sensitiveFound = [];
      const warnings = [];

      for (const [key, value] of viteEnvVars) {
        if (!value) continue;

        // Skip known-safe patterns
        const isSafe = SAFE_PATTERNS.some(safe => key.includes(safe));
        if (isSafe) {
          if (verbose) {
            console.log(`✅ ${key}: Safe pattern (designed for frontend)`);
          }
          continue;
        }

        // Check against sensitive patterns
        for (const { name, pattern } of SENSITIVE_PATTERNS) {
          if (pattern.test(value)) {
            sensitiveFound.push({
              key,
              type: name,
              preview: value.substring(0, 10) + '***'
            });
            break;
          }
        }

        // Additional heuristic checks
        if (key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('private') ||
            key.toLowerCase().includes('token') && !key.includes('ADMIN')) {
          warnings.push({
            key,
            reason: 'Key name suggests sensitive data'
          });
        }
      }

      // Report findings
      if (sensitiveFound.length > 0) {
        console.error('\n🚨 SECURITY ALERT: Sensitive API keys detected in VITE_* environment variables!\n');
        console.error('These keys will be EXPOSED in the frontend JavaScript bundle.\n');

        for (const { key, type, preview } of sensitiveFound) {
          console.error(`  ❌ ${key}: ${type} (${preview})`);
        }

        console.error('\n📋 REMEDIATION:');
        console.error('  1. Remove VITE_ prefix from sensitive keys in .env');
        console.error('  2. Move API calls to Cloud Functions (server-side)');
        console.error('  3. Store keys in Firebase Functions config:');
        console.error('     firebase functions:config:set llm.groq_key="YOUR_KEY"\n');

        if (failOnSensitive && isProduction) {
          throw new Error('Build aborted: Sensitive API keys in VITE_* variables. See above for details.');
        }
      }

      if (warnings.length > 0 && verbose) {
        console.warn('\n⚠️  Potential security concerns:\n');
        for (const { key, reason } of warnings) {
          console.warn(`  ⚠️  ${key}: ${reason}`);
        }
        console.warn('');
      }

      if (sensitiveFound.length === 0 && verbose) {
        console.log('\n✅ Security check passed: No sensitive keys in VITE_* variables\n');
      }

      return config;
    }
  };
}
