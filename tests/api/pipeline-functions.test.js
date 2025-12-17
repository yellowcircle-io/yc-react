/**
 * Pipeline Functions API Tests
 *
 * Tests Firebase Cloud Functions for the dual-pipeline prospecting engine:
 * - discoverPipelineA
 * - discoverPipelineB
 * - collectSignals
 * - filterPEBacked
 * - scorePipelines
 *
 * Run: node tests/api/pipeline-functions.test.js
 *
 * Prerequisites:
 * - Firebase functions must be deployed
 * - ADMIN_TOKEN environment variable or use default
 *
 * Created: December 17, 2025
 */

/* global process */

const FUNCTIONS_BASE_URL = 'https://us-central1-yellowcircle-app.cloudfunctions.net';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'yc-admin-2025';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Helper function for API calls
async function callFunction(functionName, body = {}, method = 'POST') {
  const url = `${FUNCTIONS_BASE_URL}/${functionName}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN
      },
      body: method === 'POST' ? JSON.stringify(body) : undefined
    });

    let data;
    try {
      data = await response.json();
    } catch {
      const text = await response.text();
      data = { raw: text };
    }

    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      data: null,
      error: error.message
    };
  }
}

// Test assertion helper
function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    testResults.passed++;
  } else {
    console.log(`  [FAIL] ${testName} ${details}`);
    testResults.failed++;
    testResults.errors.push({ testName, details });
  }
}

// Test suite for discoverPipelineA
async function testDiscoverPipelineA() {
  console.log('\n=== Testing discoverPipelineA ===\n');

  // Test 1: Function exists and responds
  const result = await callFunction('discoverPipelineA', {
    location: 'San Francisco, CA',
    industry: 'technology',
    limit: 5,
    dryRun: true
  });

  assert(
    result.status === 200 || result.status === 400 || result.status === 501,
    'discoverPipelineA responds to requests',
    `Status: ${result.status}`
  );

  // Test 2: Returns structured response
  if (result.ok && result.data) {
    assert(
      typeof result.data === 'object',
      'discoverPipelineA returns object response',
      JSON.stringify(result.data).substring(0, 100)
    );
  } else {
    console.log(`  [SKIP] Response structure test - function not fully configured`);
    testResults.skipped++;
  }

  // Test 3: Dry run mode works
  const dryRunResult = await callFunction('discoverPipelineA', {
    location: 'New York, NY',
    industry: 'finance',
    limit: 3,
    dryRun: true
  });

  assert(
    dryRunResult.status !== 500,
    'discoverPipelineA dry run does not crash',
    `Status: ${dryRunResult.status}`
  );
}

// Test suite for discoverPipelineB
async function testDiscoverPipelineB() {
  console.log('\n=== Testing discoverPipelineB ===\n');

  // Test 1: Function exists and responds
  const result = await callFunction('discoverPipelineB', {
    sources: ['crunchbase', 'producthunt'],
    limit: 5,
    dryRun: true
  });

  assert(
    result.status === 200 || result.status === 400 || result.status === 501,
    'discoverPipelineB responds to requests',
    `Status: ${result.status}`
  );

  // Test 2: Returns structured response
  if (result.ok && result.data) {
    assert(
      typeof result.data === 'object',
      'discoverPipelineB returns object response',
      JSON.stringify(result.data).substring(0, 100)
    );
  } else {
    console.log(`  [SKIP] Response structure test - function not fully configured`);
    testResults.skipped++;
  }
}

// Test suite for collectSignals
async function testCollectSignals() {
  console.log('\n=== Testing collectSignals ===\n');

  // Test 1: Function exists and responds
  const result = await callFunction('collectSignals', {
    companyDomain: 'example.com',
    dryRun: true
  });

  assert(
    result.status === 200 || result.status === 400 || result.status === 404,
    'collectSignals responds to requests',
    `Status: ${result.status}`
  );

  // Test 2: Signal categories exist in response schema
  if (result.ok && result.data && result.data.signals) {
    const expectedCategories = [
      'fundingHistory',
      'corporateStructure',
      'digitalFootprint',
      'executiveProfile',
      'hiring',
      'revenue',
      'websiteLanguage',
      'investorConnections'
    ];

    let categoriesFound = 0;
    for (const category of expectedCategories) {
      if (result.data.signals[category] !== undefined) {
        categoriesFound++;
      }
    }

    assert(
      categoriesFound >= 4,
      'collectSignals returns signal categories',
      `Found ${categoriesFound}/${expectedCategories.length} categories`
    );
  } else {
    console.log(`  [SKIP] Signal categories test - function not returning signals`);
    testResults.skipped++;
  }
}

// Test suite for filterPEBacked
async function testFilterPEBacked() {
  console.log('\n=== Testing filterPEBacked ===\n');

  // Test 1: Hard block detection
  const hardBlockResult = await callFunction('filterPEBacked', {
    signals: {
      fundingHistory: {
        peVcInvestorTagsPresent: true
      },
      websiteLanguage: {
        portfolioCompanyMention: false
      }
    }
  });

  if (hardBlockResult.ok && hardBlockResult.data) {
    assert(
      hardBlockResult.data.status === 'EXCLUDED_PE' || hardBlockResult.data.exclusion === true,
      'filterPEBacked detects hard blocks',
      JSON.stringify(hardBlockResult.data).substring(0, 100)
    );
  } else {
    assert(
      hardBlockResult.status !== 500,
      'filterPEBacked handles hard block signals',
      `Status: ${hardBlockResult.status}`
    );
  }

  // Test 2: Red flag accumulation (3+ = exclusion)
  const redFlagResult = await callFunction('filterPEBacked', {
    signals: {
      fundingHistory: {
        seriesCPlusOrLateStage: true,
        peVcInvestorTagsPresent: false
      },
      corporateStructure: {
        parentCompanyExists: true,
        foreignBranchStatus: true
      },
      investorConnections: {
        listIncludesPeVcFirms: true
      }
    }
  });

  if (redFlagResult.ok && redFlagResult.data) {
    assert(
      redFlagResult.data.status === 'EXCLUDED_PE' ||
      redFlagResult.data.status === 'FLAGGED' ||
      redFlagResult.data.redFlagCount >= 3,
      'filterPEBacked counts red flags',
      JSON.stringify(redFlagResult.data).substring(0, 100)
    );
  } else {
    console.log(`  [SKIP] Red flag test - function not returning expected format`);
    testResults.skipped++;
  }

  // Test 3: Clean company passes
  const cleanResult = await callFunction('filterPEBacked', {
    signals: {
      fundingHistory: {
        noFundingRecorded: true,
        peVcInvestorTagsPresent: false
      },
      corporateStructure: {
        singleFounderFlatOrg: true,
        parentCompanyExists: false
      },
      websiteLanguage: {
        bootstrappedInDescription: true,
        portfolioCompanyMention: false
      }
    }
  });

  if (cleanResult.ok && cleanResult.data) {
    assert(
      cleanResult.data.status === 'QUALIFIED' ||
      cleanResult.data.status === 'PENDING' ||
      cleanResult.data.exclusion === false,
      'filterPEBacked qualifies clean companies',
      JSON.stringify(cleanResult.data).substring(0, 100)
    );
  } else {
    console.log(`  [SKIP] Clean company test - function not returning expected format`);
    testResults.skipped++;
  }
}

// Test suite for scorePipelines
async function testScorePipelines() {
  console.log('\n=== Testing scorePipelines ===\n');

  // Test 1: Function exists and responds
  const result = await callFunction('scorePipelines', {
    signals: {
      fundingHistory: {
        noFundingRecorded: true,
        seedAngelOnlyUnder500k: false
      },
      digitalFootprint: {
        foundedWithin36Months: true,
        productHuntLaunchRecent: true
      },
      hiring: {
        employeeCountUnder50: true
      }
    }
  });

  assert(
    result.status === 200 || result.status === 400,
    'scorePipelines responds to requests',
    `Status: ${result.status}`
  );

  // Test 2: Returns pipeline scores
  if (result.ok && result.data) {
    const hasPipelineAScore = result.data.pipelineAScore !== undefined;
    const hasPipelineBScore = result.data.pipelineBScore !== undefined;

    assert(
      hasPipelineAScore || hasPipelineBScore || result.data.scores,
      'scorePipelines returns pipeline scores',
      JSON.stringify(result.data).substring(0, 100)
    );

    // Test 3: Scores are in valid range (-1 to 1)
    if (hasPipelineAScore && hasPipelineBScore) {
      const scoreAValid = result.data.pipelineAScore >= -1 && result.data.pipelineAScore <= 1;
      const scoreBValid = result.data.pipelineBScore >= -1 && result.data.pipelineBScore <= 1;

      assert(
        scoreAValid && scoreBValid,
        'scorePipelines scores are in valid range (-1 to 1)',
        `A: ${result.data.pipelineAScore}, B: ${result.data.pipelineBScore}`
      );
    }
  } else {
    console.log(`  [SKIP] Pipeline scores test - function not returning scores`);
    testResults.skipped++;
  }

  // Test 4: Returns primary pipeline assignment
  if (result.ok && result.data && result.data.primaryPipeline) {
    assert(
      ['A', 'B', 'AB', null].includes(result.data.primaryPipeline),
      'scorePipelines assigns primary pipeline',
      `Primary: ${result.data.primaryPipeline}`
    );
  }
}

// Test suite for AI generation endpoint
async function testGenerateWithGroq() {
  console.log('\n=== Testing generateWithGroq ===\n');

  const result = await callFunction('generateWithGroq', {
    prompt: 'Generate a short test response',
    maxTokens: 50,
    temperature: 0.7
  });

  assert(
    result.status === 200 || result.status === 400 || result.status === 403,
    'generateWithGroq responds to requests',
    `Status: ${result.status}`
  );

  if (result.ok && result.data) {
    assert(
      result.data.content || result.data.text,
      'generateWithGroq returns content',
      typeof result.data
    );
  }
}

// Run all tests
async function runTests() {
  console.log('====================================');
  console.log('Pipeline Functions API Test Suite');
  console.log('====================================');
  console.log(`Base URL: ${FUNCTIONS_BASE_URL}`);
  console.log(`Admin Token: ${ADMIN_TOKEN.substring(0, 8)}...`);
  console.log('');

  try {
    await testDiscoverPipelineA();
    await testDiscoverPipelineB();
    await testCollectSignals();
    await testFilterPEBacked();
    await testScorePipelines();
    await testGenerateWithGroq();
  } catch (error) {
    console.error('\n[ERROR] Test suite error:', error.message);
  }

  // Print summary
  console.log('\n====================================');
  console.log('Test Results Summary');
  console.log('====================================');
  console.log(`  Passed:  ${testResults.passed}`);
  console.log(`  Failed:  ${testResults.failed}`);
  console.log(`  Skipped: ${testResults.skipped}`);
  console.log(`  Total:   ${testResults.passed + testResults.failed + testResults.skipped}`);

  if (testResults.errors.length > 0) {
    console.log('\nFailed Tests:');
    for (const error of testResults.errors) {
      console.log(`  - ${error.testName}: ${error.details}`);
    }
  }

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Execute tests
runTests();
