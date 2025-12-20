#!/usr/bin/env node
/**
 * Setup Client ESP Keys in Firestore
 * Usage: node scripts/setup-client-esp.cjs <clientEmail> <provider> <apiKey>
 *
 * Example:
 *   node scripts/setup-client-esp.cjs dash@dashkolos.com brevo "xkeysib-xxx"
 *
 * This stores the key in Firestore config/client_esp_keys, NOT in source code.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'yellowcircle-app'
  });
}

const db = admin.firestore();

async function setupClientESP(clientEmail, provider, apiKey, options = {}) {
  const {
    dailyLimit = 300,
    monthlyLimit = 9000,
    fromEmail = null,
    fromName = null
  } = options;

  if (!clientEmail || !provider || !apiKey) {
    console.error('Usage: node setup-client-esp.cjs <clientEmail> <provider> <apiKey>');
    console.error('');
    console.error('Providers: brevo, mailersend, resend, sendgrid');
    console.error('');
    console.error('Example:');
    console.error('  node setup-client-esp.cjs dash@dashkolos.com brevo "xkeysib-xxx"');
    process.exit(1);
  }

  const validProviders = ['brevo', 'mailersend', 'resend', 'sendgrid'];
  if (!validProviders.includes(provider)) {
    console.error(`Invalid provider: ${provider}`);
    console.error(`Valid providers: ${validProviders.join(', ')}`);
    process.exit(1);
  }

  console.log(`Setting up ESP for client: ${clientEmail}`);
  console.log(`Provider: ${provider}`);
  console.log(`Daily limit: ${dailyLimit}`);
  console.log(`Monthly limit: ${monthlyLimit}`);

  try {
    const docRef = db.collection('config').doc('client_esp_keys');

    // Check if document exists
    const doc = await docRef.get();
    let existingData = doc.exists ? doc.data() : {};

    // Update with new client
    existingData[clientEmail] = {
      provider,
      api_key: apiKey,
      daily_limit: dailyLimit,
      monthly_limit: monthlyLimit,
      from_email: fromEmail,
      from_name: fromName,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(existingData);

    console.log('');
    console.log(`✅ Client ESP configured successfully for ${clientEmail}`);
    console.log('');
    console.log('Client can now send emails via their own ESP using:');
    console.log(`  curl -X POST ".../sendEmail" -d '{"clientEmail": "${clientEmail}", ...}'`);
    console.log(`  curl -X POST ".../sendBulkEmail" -d '{"clientEmail": "${clientEmail}", ...}'`);

  } catch (error) {
    console.error('Error setting up client ESP:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const clientEmail = args[0];
const provider = args[1];
const apiKey = args[2];

// Optional arguments
const dailyLimit = args[3] ? parseInt(args[3]) : 300;
const monthlyLimit = args[4] ? parseInt(args[4]) : 9000;

setupClientESP(clientEmail, provider, apiKey, { dailyLimit, monthlyLimit })
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
