// Simple API test for BrainSAIT-Unified
const baseUrl = process.env.TEST_URL || 'http://localhost:8787';

async function runTests() {
  console.log('🧪 Running API tests...');
  console.log(`Base URL: ${baseUrl}`);
  
  const tests = [
    {
      name: 'Health Check',
      url: '/api/health',
      method: 'GET',
      expectedStatus: 200,
      expectedBody: { status: 'healthy' }
    },
    {
      name: 'API Documentation',
      url: '/api/docs',
      method: 'GET',
      expectedStatus: 200,
      expectedBody: { title: 'BrainSAIT Unified API' }
    },
    {
      name: 'Static File Serving',
      url: '/',
      method: 'GET',
      expectedStatus: 200,
      expectedHeaders: { 'content-type': 'text/html' }
    },
    {
      name: 'CORS Options',
      url: '/api/health',
      method: 'OPTIONS',
      expectedStatus: 200,
      expectedHeaders: { 'access-control-allow-origin': '*' }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      
      const response = await fetch(`${baseUrl}${test.url}`, {
        method: test.method,
        headers: {
          'User-Agent': 'BrainSAIT-API-Test/1.0'
        }
      });

      // Check status
      if (response.status !== test.expectedStatus) {
        console.log(`❌ Status mismatch: expected ${test.expectedStatus}, got ${response.status}`);
        failed++;
        continue;
      }

      // Check headers if specified
      if (test.expectedHeaders) {
        for (const [header, expectedValue] of Object.entries(test.expectedHeaders)) {
          const actualValue = response.headers.get(header);
          if (!actualValue || !actualValue.includes(expectedValue)) {
            console.log(`❌ Header mismatch for ${header}: expected to contain "${expectedValue}", got "${actualValue}"`);
            failed++;
            continue;
          }
        }
      }

      // Check body if specified
      if (test.expectedBody) {
        const body = await response.json();
        for (const [key, expectedValue] of Object.entries(test.expectedBody)) {
          if (body[key] !== expectedValue) {
            console.log(`❌ Body mismatch for ${key}: expected "${expectedValue}", got "${body[key]}"`);
            failed++;
            continue;
          }
        }
      }

      console.log(`✅ ${test.name} passed`);
      passed++;

    } catch (error) {
      console.log(`❌ ${test.name} failed: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${passed + failed}`);

  if (failed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
