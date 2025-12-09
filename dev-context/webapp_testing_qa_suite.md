# yellowCircle WebApp Testing & QA Suite
## Comprehensive Testing Framework for Launch

**Document Purpose**: Structured QA approach to stress-test platform before production scaling  
**Timeline**: 4 weeks parallel with launch activities  
**Objective**: Identify critical bugs, performance bottlenecks, security vulnerabilities before users discover them

---

## Part 1: Critical Path User Journeys (E2E Testing)

### Journey 1: Prospect Discovery → Consulting Inquiry
**User Story**: New prospect lands on homepage, takes assessment, receives recommendations, books call

**Test Steps** (Manual + Automated):
```
1. Load homepage (measure time-to-interactive)
2. Scroll to "Start Assessment" CTA
3. Click "Growth Health Check"
4. Answer 8 questions (select various score levels: 1, 3, 5)
5. Submit form
6. Receive score + diagnostic summary
7. Email should arrive within 60 seconds
8. Click email link → leads to audit recommendation page
9. Click "Book a Call" → Cal.com calendar popup
10. Select time slot
11. Confirm booking
12. Verify confirmation email received within 2 minutes
```

**Success Criteria**:
- ✓ Full journey completes in <90 seconds
- ✓ No console errors
- ✓ Email arrives within 60 seconds
- ✓ PDF report generates correctly
- ✓ Cal.com booking persists to database

**Tools**:
- Cypress automated test (with visual regression)
- Lighthouse performance audit (target: >90 on mobile)
- Email delivery tracking (Mailgun or similar)

---

### Journey 2: Tool User → Premium Conversion
**User Story**: Free user generates cold emails, sees value, upgrades to API key tier

**Test Steps**:
```
1. Load /experiments/outreach-generator
2. Enter prospect info (company, person, context)
3. Generate 1 email sequence (should use free credit #1)
4. View result
5. Copy email
6. Generate 2 more sequences (credits #2, #3)
7. Attempt 4th generation → should show "Add API key to continue"
8. Click "Add API Key" → opens API key flow
9. Authenticate with Google
10. Navigate to /settings/api-keys
11. Create new API key
12. Copy key
13. Return to generator
14. Paste API key → should unlock unlimited generation
15. Verify key persists across sessions
```

**Success Criteria**:
- ✓ Rate limiting enforces 3 free + unlimited with key
- ✓ API key securely stored in Firestore
- ✓ Session persistence across page reloads
- ✓ Clear upgrade messaging (not dark patterns)
- ✓ Analytics track conversion event

**Tools**:
- Chrome DevTools Network tab (verify API key not exposed)
- Firebase console (check Firestore rules applied correctly)
- Manual testing on incognito windows (session isolation)

---

### Journey 3: Authenticated Client → Full Platform Access
**User Story**: Consulting client logs in, accesses premium tools (UnityNOTES, UnityMAP)

**Test Steps**:
```
1. Navigate to /outreach (requires authentication)
2. If not logged in → redirect to login
3. Click "Sign in with Google" → OAuth flow
4. Complete OAuth consent
5. Redirect back to /outreach
6. UnityMAP interface loads with no journeys
7. Create new journey (click "New Journey")
8. Add 5 nodes (Prospect → Email → Wait → Condition → Exit)
9. Configure each node with sample data
10. Save journey
11. Verify journey persists to Firestore
12. Close and reopen browser → journey still visible
13. Deploy journey
14. Check job queue (should send test email via Resend)
15. Verify email delivered to test inbox
```

**Success Criteria**:
- ✓ OAuth flow completes without errors
- ✓ Client access control enforced (wrong user can't see other client's data)
- ✓ Journey state persists across sessions
- ✓ Email deployment via Resend works end-to-end
- ✓ Rate limiting doesn't block legitimate usage

**Tools**:
- Firebase Authentication logs (check for failed auth attempts)
- Resend dashboard (verify emails sent)
- Browser DevTools Storage tab (check localStorage vs Firestore sync)

---

## Part 2: Stress Testing & Load Testing

### Scenario 1: Assessment Spike (Black Friday / Launch Day)
**Assumption**: 500 users take assessment simultaneously

```bash
# Using k6 (lightweight load testing tool)
# Expected behavior: All requests complete within 5 seconds
# Success: <1% error rate

import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 500,  // 500 virtual users
  duration: '5m',
};

export default function() {
  // Simulate assessment submission
  let response = http.post('https://yellowcircle.io/api/assessment', {
    email: `user${__VU}@test.com`,
    scores: [4, 3, 5, 2, 4, 3, 5, 4],
  });
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'returns recommendations': (r) => r.body.includes('recommendation'),
  });
  
  sleep(1);
}
```

**Success Criteria**:
- ✓ <1% error rate under 500 concurrent users
- ✓ P95 response time <2 seconds
- ✓ No database connection timeouts
- ✓ Email queue doesn't overflow (Resend rate limits honored)

---

### Scenario 2: Generator Rate Limiting Verification
**Assumption**: Malicious actor tries to generate 1000 emails in 1 hour

```bash
# Verify rate limiting prevents abuse

for i in {1..100}; do
  curl -X POST https://yellowcircle.io/api/generate \
    -H "X-Client-IP: 192.168.1.1" \
    -d '{"prospect":"company","context":"outreach"}'
done

# Expected: Requests 4+ fail with 429 Too Many Requests
```

**Success Criteria**:
- ✓ Rate limit enforced at 3 free generations per IP per day
- ✓ 429 response returned with retry-after header
- ✓ Abuse logged for monitoring

---

### Scenario 3: Firebase Concurrent Operations
**Assumption**: 10 premium clients simultaneously editing journeys

**Test**:
```
User A: Update journey nodes in real-time
User B: Deploy journey
User C: Create new journey
...Users D-J: Same patterns concurrently

Monitor:
- Firestore write conflicts
- Read latency (should be <200ms)
- Authentication token refresh behavior
```

**Success Criteria**:
- ✓ No data corruption under concurrent writes
- ✓ Read latency <200ms at 10 concurrent users
- ✓ Optimistic updates reflect correctly

---

## Part 3: Mobile & Cross-Browser Testing

### Device Matrix

| Device | OS | Browser | Test | Priority |
|--------|----|---------|----|----------|
| iPhone 14 Pro | iOS 17 | Safari | All journeys | P0 |
| iPhone SE | iOS 15 | Safari | Older OS compatibility | P1 |
| iPad Pro 12.9" | iPadOS 17 | Safari | Landscape/portrait | P0 |
| Pixel 6 | Android 14 | Chrome | All journeys | P0 |
| Samsung Galaxy S10 | Android 12 | Chrome | Older OS compat | P1 |
| Chrome Desktop | Windows 11 | Chrome | Baseline | P0 |
| Firefox | macOS | Firefox | Cross-browser | P1 |
| Safari | macOS | Safari | Cross-browser | P1 |

**Test Cases per Device**:
1. Homepage load + scroll performance
2. Assessment form submission (touch targets, keyboard handling)
3. Tool functionality (Outreach Generator text input, Figma-like operations)
4. Email capture form (no broken form elements)
5. Calendar integration (Cal.com popup on mobile)

**Tools**:
- Browserstack (cloud device access)
- Chrome DevTools (device emulation for quick checks)
- Physical device testing (iPhone, iPad, Android phone)

---

## Part 4: Security & Data Integrity Testing

### SQL Injection / XSS Prevention

```javascript
// Test vectors for form fields
const maliciousInputs = [
  "<script>alert('xss')</script>",
  "'; DROP TABLE users; --",
  "${alert('xss')}",
  "javascript:alert('xss')",
  "<img src=x onerror=alert('xss')>",
];

// Submit each to:
// - Assessment form email field
// - Outreach Generator prospect name
// - UnityNOTES text nodes
// - Any user input field

// Expected: All sanitized, no alerts triggered
```

**Success Criteria**:
- ✓ All inputs sanitized before display
- ✓ No console errors
- ✓ Stored values in Firestore match expected safe format

### API Key Exposure Check

```bash
# Search codebase for hardcoded keys
grep -r "OPENAI_API_KEY=" src/
grep -r "GROQ_API_KEY=" src/
grep -r "firebase_config.*=" src/

# Check compiled bundle
strings dist/assets/*.js | grep -E "sk-|sk_test"

# Expected: No keys exposed
```

**Tools**:
- Semgrep (static analysis for secrets)
- git-secrets (pre-commit hook)
- OWASP ZAP (automated security scanning)

### Authentication Token Handling

```javascript
// Verify tokens aren't exposed in:
// 1. localStorage (check DevTools Storage)
// 2. URL parameters (check Network tab)
// 3. Unencrypted cookies (check cookies)
// 4. Response bodies logged to console

// Verify token rotation works
// 1. Login
// 2. Open DevTools → Application → Cookies
// 3. Wait 30 minutes (or force expiration)
// 4. Try API call → should auto-refresh or require re-login
// 5. Verify new token different from old
```

---

## Part 5: Email Delivery & Notification Testing

### Web3Forms Integration

```javascript
// Test all form submissions

// Assessment form
- Email delivered within 60 seconds
- PDF attachment includes correct scores/recommendations
- Unsubscribe link functional

// Contact form
- Message received
- Auto-reply sent to user
- Admin notification received

// Access request form
- Request logged in Firestore
- Admin approval email sent
- Client approval email functional
```

**Success Criteria**:
- ✓ 100% delivery rate to test inboxes
- ✓ No spam folder delivery (SPF/DKIM configured)
- ✓ All links clickable and functional

### Resend ESP Integration

```javascript
// Test email deployment from UnityMAP

// Scenario 1: Send test email
- Create journey with 1 email node
- Add test prospect
- Deploy journey
- Verify email arrives within 2 minutes
- Check email rendering (multiple email clients)

// Scenario 2: Journey with delays
- Email node → Wait 2 seconds → Email node
- Deploy → verify delays respected
- Check timestamps in Resend dashboard

// Scenario 3: Conditional routing
- Email node → Condition (if no reply) → Follow-up email
- Deploy → simulate no reply → verify follow-up sent

// Scenario 4: Rate limiting
- Create 100 prospect records
- Deploy journey to all
- Monitor Resend for rate limits (should send 100/100 successfully)
- Verify no bounces/hard failures
```

---

## Part 6: Performance Metrics

### Key Metrics to Monitor

| Metric | Target | Tool |
|--------|--------|------|
| Time to First Byte (TTFB) | <200ms | Lighthouse |
| Largest Contentful Paint (LCP) | <2.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | <0.1 | Lighthouse |
| First Input Delay (FID) | <100ms | Chrome DevTools |
| Core Web Vitals Score | ≥90 | PageSpeed Insights |
| Mobile Speed | ≥80 | PageSpeed Insights |
| JavaScript Bundle Size | <250KB (gzipped) | Webpack-bundle-analyzer |
| API Response Time (p95) | <500ms | Google Analytics |

### Performance Testing Script

```bash
# Run Lighthouse audit
lighthouse https://yellowcircle.io --output=json --output-path=./lighthouse-report.json

# Parse and alert on regressions
jq '.categories[] | {category: .title, score: .score}' lighthouse-report.json

# Compare to baseline (e.g., performance score should stay ≥85)
```

---

## Part 7: Monitoring & Observability

### Post-Launch Monitoring Setup

```javascript
// Sentry (error tracking)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://key@sentry.io/project",
  environment: "production",
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

// Google Analytics (user behavior)
gtag('event', 'assessment_submitted', {
  email_valid: true,
  score: score,
  timestamp: new Date().toISOString(),
});

// Firebase Performance Monitoring
firebase.performance().trace('journey_save').start();
// ... save logic ...
firebase.performance().trace('journey_save').stop();
```

**Alerts to Configure**:
- Error rate >1% in last 5 minutes → page/slack notification
- Assessment submission success rate <95% → alert
- API response time p95 >1s → alert
- Resend email delivery failures >5 → alert

---

## Part 8: Test User Data (Non-Destructive)

### Staging Environment Test Accounts

```
Admin (Full Access):
- Email: christopher@yellowcircle.io
- Role: Admin
- Firestore: config/admin_whitelist

Client (Premium Tier):
- Email: founding-client@test.com
- Role: Premium Client
- Access: UnityNOTES, UnityMAP, UnitySTUDIO

Free User (Generator Only):
- Email: free-user@test.com
- Access: Public tools only (Outreach Generator, Assessment)

Test Data:
- 10 fake prospects in test journey
- 5 test email templates
- 3 complete journeys (draft, deployed, archived states)
```

**Rules**:
- ✓ Never delete test data (use soft deletes for audit trail)
- ✓ Don't mix staging/prod data (separate Firebase projects)
- ✓ Reset test data weekly (keep consistent state)

---

## Part 9: Launch Readiness Checklist

- [ ] All E2E journeys pass automated tests
- [ ] Load testing shows <1% error rate at 500 concurrent users
- [ ] Security audit: zero XSS/injection vulnerabilities
- [ ] Mobile testing: all critical journeys work on iOS + Android
- [ ] Email delivery: 100% success rate to test inboxes
- [ ] Performance: Lighthouse score ≥85 on mobile
- [ ] Error monitoring: Sentry configured + test error captured
- [ ] Analytics: Conversion funnel events firing correctly
- [ ] Documentation: Runbook created for post-launch incidents
- [ ] Rollback plan: How to revert if critical issues found
- [ ] On-call schedule: Who handles 24-hour post-launch issues
- [ ] Client communication: Founding clients notified of launch
- [ ] Backup verification: Firebase backups configured + tested

---

## Part 10: Regression Test Suite (Post-Launch)

**Run weekly** to catch breaking changes:

```bash
#!/bin/bash

# Test critical paths
npm run test:e2e -- --spec "cypress/e2e/assessment.cy.js"
npm run test:e2e -- --spec "cypress/e2e/generator.cy.js"
npm run test:e2e -- --spec "cypress/e2e/authentication.cy.js"
npm run test:e2e -- --spec "cypress/e2e/journey-editor.cy.js"

# Run accessibility audit (Axe)
npm run test:a11y

# Run performance audit
npm run test:performance

# Report results
echo "All tests passed on $(date)" >> test-log.txt
```

---

## Success Criteria for Launch

**LAUNCH APPROVED when**:
1. ✅ 100% of critical path E2E tests passing
2. ✅ Load test: 500 concurrent users, <1% error rate
3. ✅ Security: Zero critical/high vulnerabilities
4. ✅ Mobile: All devices showing green on performance audit
5. ✅ Email: 100% delivery to test inboxes
6. ✅ Monitoring: Sentry + Analytics actively capturing data
7. ✅ Documentation: Team can respond to production incidents
8. ✅ Rollback: Plan documented and tested

**If ANY criterion fails**: Resolve before launch, re-test, confirm fix

---

**Document Owner**: Christopher Cooper  
**Last Updated**: December 8, 2025  
**Next Review**: Post-launch (within 24 hours)
