#!/usr/bin/env node
/**
 * Seed Welcome Journey
 *
 * Creates a welcome email journey for new leads captured via
 * LeadGate, Footer, Assessment, or SSO.
 *
 * Usage:
 *   node scripts/seed-welcome-journey.cjs
 *
 * This creates a journey with:
 *   - Prospect entry node
 *   - Welcome email (immediate)
 *   - 3-day wait
 *   - Follow-up email
 *   - Exit node
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../functions/serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (err) {
  console.error('❌ Could not load service account key.');
  console.log('   Expected location:', serviceAccountPath);
  console.log('');
  console.log('   To fix: Download service account key from Firebase Console:');
  console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('   2. Click "Generate new private key"');
  console.log('   3. Save as functions/serviceAccountKey.json');
  process.exit(1);
}

const db = admin.firestore();

// Journey ID (fixed so trigger rule can reference it)
const WELCOME_JOURNEY_ID = 'welcome-new-leads';

// Welcome email content
const welcomeEmailContent = `Hi {{name}},

Thanks for checking out yellowCircle! I'm Christopher, and I help companies fix their growth operations.

You just accessed one of our tools, which means you're probably dealing with one of these challenges:
• There is uncertainty on how you "qualify" leads within your business
• Your tech stack is either expensive and underutilized, or you're unclear how to build it
• Attribution feels like a guessing game
• Your team is drowning in tactical busy-work instead of driving growth strategy

Sound familiar? You're not alone. I've spent a decade in marketing operations at companies like DoorDash, Reddit, and Thimble. I've seen these patterns everywhere.

**Here's what I'd suggest:**

1. **Take our GTM Health Assessment** (if you haven't already) — it takes 5 minutes: https://yellowcircle.io/assessment

2. **Read "Why Your GTM Sucks"** — my deep dive into why most go-to-market strategies fail: https://yellowcircle.io/thoughts/why-your-gtm-sucks

3. **Book a free discovery call** — if you want to talk through your specific situation: https://cal.com/yellowcircle

No pitch, just an honest conversation about what's actually broken and what might help.

Talk soon,
Christopher Cooper
Founder, yellowCircle

P.S. — Reply to this email anytime. I read every response.`;

const followUpEmailContent = `Hi {{name}},

Quick follow-up from my earlier email.

I wanted to share something that might be useful: most companies I talk to are spending $50K-$200K/year on marketing technology, but only using about 30% of what they've bought.

The problem isn't the tools. It's the organizational structure around them.

**Three questions to ask yourself:**

1. Do you or your marketing team spend more time doing repetitive tasks rather than building efficiently?
2. Is your lead scoring inconsistent or manual?
3. When attribution numbers don't match, are you unclear which source to believe?

If you answered "yes" to any of these, it's not a tool problem — it's an operations architecture problem.

I put together a free guide on how to diagnose these issues. Want me to send it over?

Just reply "yes" and I'll send it  your way.

Best,
Christopher

---
yellowCircle | Growth Infrastructure Solutions
https://yellowcircle.io`;

// Script version for sync tracking
const SCRIPT_VERSION = '1.2.0';
const SCRIPT_UPDATED_AT = '2025-12-11';

// Journey structure
const welcomeJourney = {
  id: WELCOME_JOURNEY_ID,
  title: 'Welcome - New Leads',
  description: 'Automated welcome sequence for new leads from website captures (LeadGate, Footer, Assessment, SSO)',
  status: 'active',

  // Sync metadata - marks this journey as script-managed
  _sync: {
    source: 'script',
    scriptPath: 'scripts/seed-welcome-journey.cjs',
    scriptVersion: SCRIPT_VERSION,
    lastSyncedAt: null, // Set on seed
    allowUIEdits: false, // UI should show warning if editing
    syncEndpoint: 'seedWelcomeJourney' // Cloud function to re-sync
  },

  nodes: [
    // Entry point - Prospect node
    {
      id: 'prospect-entry',
      type: 'prospectNode',
      position: { x: 250, y: 50 },
      data: {
        label: 'New Leads',
        count: 0,
        segment: 'website_captures',
        source: 'trigger_rule',
        tags: ['welcome-sequence'],
        prospects: []
      }
    },

    // Enrichment wait - allows time for data enrichment before sending
    // Future: This delay enables enrichment APIs to populate company/role data
    {
      id: 'enrichment-wait',
      type: 'waitNode',
      position: { x: 250, y: 150 },
      data: {
        label: 'Enrichment Wait',
        delay: 5,
        unit: 'minutes',
        description: 'Short delay for data enrichment (company, role, etc.)'
      }
    },

    // Welcome email (after enrichment)
    {
      id: 'welcome-email',
      type: 'emailNode',
      position: { x: 250, y: 280 },
      data: {
        label: 'Welcome Email',
        subject: 'Thanks for checking out yellowCircle',
        preview: welcomeEmailContent.substring(0, 200) + '...',
        fullBody: welcomeEmailContent,
        status: 'active'
      }
    },

    // Wait 3 days
    {
      id: 'wait-3-days',
      type: 'waitNode',
      position: { x: 250, y: 410 },
      data: {
        label: 'Wait 3 Days',
        delay: 3,
        unit: 'days'
      }
    },

    // Follow-up email
    {
      id: 'followup-email',
      type: 'emailNode',
      position: { x: 250, y: 540 },
      data: {
        label: 'Follow-up Email',
        subject: 'Quick question about your GTM operations',
        preview: followUpEmailContent.substring(0, 200) + '...',
        fullBody: followUpEmailContent,
        status: 'active'
      }
    },

    // Exit
    {
      id: 'exit-completed',
      type: 'exitNode',
      position: { x: 250, y: 670 },
      data: {
        label: 'Sequence Complete',
        exitType: 'completed'
      }
    }
  ],

  edges: [
    { id: 'e0', source: 'prospect-entry', target: 'enrichment-wait', type: 'default' },
    { id: 'e1', source: 'enrichment-wait', target: 'welcome-email', type: 'default' },
    { id: 'e2', source: 'welcome-email', target: 'wait-3-days', type: 'default' },
    { id: 'e3', source: 'wait-3-days', target: 'followup-email', type: 'default' },
    { id: 'e4', source: 'followup-email', target: 'exit-completed', type: 'default' }
  ],

  prospects: [],

  stats: {
    nodeCount: 6,
    mapNodeCount: 6,
    emailCount: 2,
    totalProspects: 0,
    sent: 0,
    opened: 0,
    clicked: 0,
    completed: 0
  },

  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) // 1 year
};

// Trigger rule for new leads
const welcomeTriggerRule = {
  name: 'Welcome Sequence - New Leads',
  description: 'Auto-enroll new leads from website captures into welcome journey',
  enabled: true,
  priority: 10,

  trigger: {
    type: 'lead_created',
    conditions: [
      {
        field: 'source',
        operator: 'in',
        value: ['lead_gate', 'footer', 'assessment', 'sso'],
        caseSensitive: false
      }
    ],
    matchMode: 'any'
  },

  actions: [
    {
      type: 'add_tag',
      config: {
        tags: ['welcome-sent', 'website-lead']
      }
    },
    {
      type: 'update_score',
      config: {
        scoreAdjustment: 10
      }
    },
    {
      type: 'notify_email',
      config: {
        to: 'christopher@yellowcircle.io',
        subject: 'New Lead: {{email}} from {{source}}'
      }
    },
    {
      type: 'enroll_journey',
      config: {
        journeyId: WELCOME_JOURNEY_ID
      }
    }
  ],

  dedup: {
    enabled: true,
    strategy: 'email_journey',
    windowSeconds: 86400 * 7 // 7 days
  },

  stats: {
    triggered: 0,
    actionsExecuted: 0,
    skippedDedupe: 0,
    errors: 0
  },

  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

// Assessment Results Trigger Rule - sends results to user who completed assessment
const assessmentResultsTriggerRule = {
  name: 'Assessment Results - Send to User',
  description: 'Send assessment results email to users who complete the Growth Health Check',
  enabled: true,
  priority: 5, // Higher priority than welcome (runs first)

  trigger: {
    type: 'lead_created',
    conditions: [
      {
        field: 'source',
        operator: 'eq',
        value: 'assessment',
        caseSensitive: false
      }
    ],
    matchMode: 'all'
  },

  actions: [
    {
      type: 'add_tag',
      config: {
        tags: ['assessment-completed']
      }
    },
    {
      type: 'send_assessment_results',
      config: {}
    }
  ],

  dedup: {
    enabled: true,
    strategy: 'email_journey',
    windowSeconds: 86400 * 1 // 1 day - allow re-assessment after a day
  },

  stats: {
    triggered: 0,
    actionsExecuted: 0,
    skippedDedupe: 0,
    errors: 0
  },

  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

async function seedWelcomeJourney() {
  console.log('🚀 Seeding Welcome Journey...\n');
  console.log(`📦 Script Version: ${SCRIPT_VERSION} (${SCRIPT_UPDATED_AT})\n`);

  try {
    // 1. Create/Update the journey with sync timestamp
    const journeyRef = db.collection('journeys').doc(WELCOME_JOURNEY_ID);
    const existingJourney = await journeyRef.get();

    // Add sync timestamp
    const journeyWithSync = {
      ...welcomeJourney,
      _sync: {
        ...welcomeJourney._sync,
        lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        scriptVersion: SCRIPT_VERSION
      }
    };

    if (existingJourney.exists) {
      console.log('📝 Journey already exists, updating...');
      // Preserve existing prospects when updating
      const existingData = existingJourney.data();
      await journeyRef.update({
        ...journeyWithSync,
        prospects: existingData.prospects || [],
        stats: {
          ...journeyWithSync.stats,
          totalProspects: existingData.stats?.totalProspects || 0,
          sent: existingData.stats?.sent || 0,
          opened: existingData.stats?.opened || 0,
          clicked: existingData.stats?.clicked || 0,
          completed: existingData.stats?.completed || 0
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      console.log('✨ Creating new journey...');
      await journeyRef.set(journeyWithSync);
    }

    console.log(`✅ Journey synced: ${WELCOME_JOURNEY_ID}`);
    console.log(`   Title: ${welcomeJourney.title}`);
    console.log(`   Nodes: ${welcomeJourney.stats.nodeCount} (includes enrichment wait)`);
    console.log(`   Emails: ${welcomeJourney.stats.emailCount}`);
    console.log(`   Status: ${welcomeJourney.status}`);
    console.log(`   Sync Source: script`);

    // 2. Create/Update trigger rule
    const triggerRuleId = 'welcome-new-leads-rule';
    const ruleRef = db.collection('triggerRules').doc(triggerRuleId);
    const existingRule = await ruleRef.get();

    if (existingRule.exists) {
      console.log('\n📝 Trigger rule already exists, updating...');
      await ruleRef.update({
        ...welcomeTriggerRule,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      console.log('\n✨ Creating trigger rule...');
      await ruleRef.set(welcomeTriggerRule);
    }

    console.log(`✅ Trigger rule synced: ${triggerRuleId}`);
    console.log(`   Name: ${welcomeTriggerRule.name}`);
    console.log(`   Triggers: ${welcomeTriggerRule.trigger.conditions[0].value.join(', ')}`);
    console.log(`   Actions: ${welcomeTriggerRule.actions.map(a => a.type).join(', ')}`);

    // 3. Create/Update assessment results trigger rule
    const assessmentRuleId = 'assessment-results-rule';
    const assessmentRuleRef = db.collection('triggerRules').doc(assessmentRuleId);
    const existingAssessmentRule = await assessmentRuleRef.get();

    if (existingAssessmentRule.exists) {
      console.log('\n📝 Assessment trigger rule already exists, updating...');
      await assessmentRuleRef.update({
        ...assessmentResultsTriggerRule,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      console.log('\n✨ Creating assessment trigger rule...');
      await assessmentRuleRef.set(assessmentResultsTriggerRule);
    }

    console.log(`✅ Assessment trigger rule synced: ${assessmentRuleId}`);
    console.log(`   Name: ${assessmentResultsTriggerRule.name}`);
    console.log(`   Triggers: source = assessment`);
    console.log(`   Actions: ${assessmentResultsTriggerRule.actions.map(a => a.type).join(', ')}`);

    console.log('\n🎉 Sync complete!\n');
    console.log('📋 Summary:');
    console.log(`   Journey ID: ${WELCOME_JOURNEY_ID}`);
    console.log(`   Welcome Trigger Rule: ${triggerRuleId}`);
    console.log(`   Assessment Trigger Rule: ${assessmentRuleId}`);
    console.log(`   Script Version: ${SCRIPT_VERSION}`);
    console.log('');
    console.log('📌 Updated Flows:');
    console.log('');
    console.log('   📧 All Leads (Footer/LeadGate/Assessment/SSO):');
    console.log('   1. Lead created → Welcome trigger rule matches');
    console.log('   2. Internal notification email sent to christopher@yellowcircle.io');
    console.log('   3. Enrolls in welcome journey → Immediate welcome email');
    console.log('   4. 3-day wait → Follow-up email sent');
    console.log('');
    console.log('   📊 Assessment Leads (additional):');
    console.log('   1. Lead created → Assessment trigger rule matches (priority 5)');
    console.log('   2. Assessment results email sent to user with score/recommendations');
    console.log('   3. Then welcome trigger rule also fires (priority 10)');
    console.log('');
    console.log('🔗 View journey: https://yellowcircle.io/outreach?mode=map');
    console.log('🔗 View trigger rules: https://yellowcircle.io/admin/trigger-rules');
    console.log('');
    console.log('⚠️  Note: These journeys/rules are script-managed. Edits in UI will be');
    console.log('    overwritten on next sync. Edit this script for changes.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run
seedWelcomeJourney();
