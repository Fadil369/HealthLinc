/**
 * Auth API Integration Test Suite for BrainSAIT Unified
 * 
 * Tests the actual auth API endpoints running on Cloudflare Workers
 * Identifies real failures in the implementation and validates fixes
 * 
 * Coverage:
 * - User registration API endpoint
 * - User login API endpoint
 * - Profile management endpoints
 * - OAuth integration endpoints
 * - JWT token validation in real requests
 * - Error handling and security validation
 * - Edge cases and malformed requests
 */

const { strict: assert } = require('assert');
const crypto = require('crypto');

class AuthAPIIntegrationTests {
  constructor(baseUrl = 'http://localhost:8787') {
    this.baseUrl = baseUrl;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.userTokens = new Map(); // Store tokens for cleanup
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`🧪 Testing: ${testName}`);
      await testFunction();
      console.log(`✅ PASSED: ${testName}`);
      this.testResults.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      this.testResults.failed++;
      this.testResults.errors.push({ test: testName, error: error.message });
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BrainSAIT-Auth-Test/1.0'
      }
    };

    const requestOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, requestOptions);
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.response = { status: response.status, data };
        throw error;
      }

      return { status: response.status, data, headers: response.headers };
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  // Test user registration endpoint
  async testUserRegistration() {
    const userData = {
      firstName: 'Integration',
      lastName: 'Test',
      email: `integration.test.${Date.now()}@example.com`,
      password: 'TestP@ssw0rd#2024',
      role: 'user'
    };

    const response = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    assert(response.status === 201, `Expected 201, got ${response.status}`);
    assert(response.data.access_token, 'Should return access token');
    assert(response.data.token_type === 'bearer', 'Should return bearer token type');
    assert(response.data.user, 'Should return user object');
    assert(response.data.user.email === userData.email, 'Email should match');
    assert(response.data.user.firstName === userData.firstName, 'First name should match');
    assert(!response.data.user.passwordHash, 'Should not return password hash');

    // Store token for cleanup
    this.userTokens.set(userData.email, response.data.access_token);
  }

  async testUserRegistrationValidation() {
    // Test missing required fields
    const invalidRequests = [
      { /* empty object */ },
      { firstName: 'Test' }, // Missing other fields
      { firstName: 'Test', lastName: 'User' }, // Missing email and password
      { firstName: 'Test', lastName: 'User', email: 'invalid-email' }, // Invalid email format
      { firstName: 'Test', lastName: 'User', email: 'test@example.com', password: '123' } // Weak password
    ];

    for (const invalidData of invalidRequests) {
      try {
        await this.makeRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(invalidData)
        });
        throw new Error('Should have failed validation');
      } catch (error) {
        assert(error.response && error.response.status === 400, 'Should return 400 for validation errors');
      }
    }
  }

  async testDuplicateRegistration() {
    const userData = {
      firstName: 'Duplicate',
      lastName: 'Test',
      email: `duplicate.test.${Date.now()}@example.com`,
      password: 'TestP@ssw0rd#2024',
      role: 'user'
    };

    // Register user first time
    const firstResponse = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    assert(firstResponse.status === 201, 'First registration should succeed');

    // Try to register same user again
    try {
      await this.makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      throw new Error('Duplicate registration should fail');
    } catch (error) {
      assert(error.response && error.response.status === 409, 'Should return 409 for duplicate email');
    }
  }

  async testUserLogin() {
    // First register a user
    const userData = {
      firstName: 'Login',
      lastName: 'Test',
      email: `login.test.${Date.now()}@example.com`,
      password: 'L0gin#P@ssw0rd',
      role: 'user'
    };

    await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    // Now test login
    const loginResponse = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password
      })
    });

    assert(loginResponse.status === 200, `Expected 200, got ${loginResponse.status}`);
    assert(loginResponse.data.access_token, 'Should return access token');
    assert(loginResponse.data.token_type === 'bearer', 'Should return bearer token type');
    assert(loginResponse.data.user, 'Should return user object');
    assert(loginResponse.data.user.email === userData.email, 'Email should match');

    this.userTokens.set(userData.email, loginResponse.data.access_token);
  }

  async testInvalidLogin() {
    const invalidLogins = [
      { email: 'nonexistent@example.com', password: 'any-password' },
      { email: 'admin@brainsait.com', password: 'wrong-password' },
      { email: '', password: 'password' },
      { email: 'valid@example.com', password: '' },
      { /* empty object */ }
    ];

    for (const invalidLogin of invalidLogins) {
      try {
        await this.makeRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(invalidLogin)
        });
        throw new Error('Invalid login should fail');
      } catch (error) {
        assert(error.response && error.response.status === 401, 'Should return 401 for invalid credentials');
      }
    }
  }

  async testMockAdminLogin() {
    // Test the mock admin login that should work
    const loginResponse = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@brainsait.com',
        password: 'Admin123!'
      })
    });

    assert(loginResponse.status === 200, `Expected 200, got ${loginResponse.status}`);
    assert(loginResponse.data.access_token, 'Should return access token');
    assert(loginResponse.data.user.email === 'admin@brainsait.com', 'Should return admin email');
    assert(loginResponse.data.user.role === 'admin', 'Should return admin role');
  }

  async testProfileEndpoint() {
    // First register and login a user
    const userData = {
      firstName: 'Profile',
      lastName: 'Test',
      email: `profile.test.${Date.now()}@example.com`,
      password: 'Pr0file#P@ssw0rd',
      role: 'user'
    };

    const registerResponse = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    const token = registerResponse.data.access_token;

    // Test getting profile with valid token
    const profileResponse = await this.makeRequest('/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    assert(profileResponse.status === 200, `Expected 200, got ${profileResponse.status}`);
    assert(profileResponse.data.user, 'Should return user object');
    assert(profileResponse.data.user.email === userData.email, 'Email should match');
    assert(!profileResponse.data.user.passwordHash, 'Should not return password hash');
  }

  async testProfileEndpointUnauthorized() {
    // Test profile endpoint without token
    try {
      await this.makeRequest('/api/auth/profile', {
        method: 'GET'
      });
      throw new Error('Should require authorization');
    } catch (error) {
      assert(error.response && error.response.status === 401, 'Should return 401 without token');
    }

    // Test profile endpoint with invalid token
    try {
      await this.makeRequest('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      throw new Error('Should reject invalid token');
    } catch (error) {
      assert(error.response && error.response.status === 401, 'Should return 401 with invalid token');
    }
  }

  async testProfileUpdate() {
    // First register a user
    const userData = {
      firstName: 'UpdateProfile',
      lastName: 'Test',
      email: `update.profile.test.${Date.now()}@example.com`,
      password: 'Upd@teP@ssw0rd#',
      role: 'user'
    };

    const registerResponse = await this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    const token = registerResponse.data.access_token;

    // Update profile
    const updateData = {
      firstName: 'UpdatedFirstName',
      lastName: 'UpdatedLastName'
    };

    const updateResponse = await this.makeRequest('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    assert(updateResponse.status === 200, `Expected 200, got ${updateResponse.status}`);
    assert(updateResponse.data.user.firstName === updateData.firstName, 'First name should be updated');
    assert(updateResponse.data.user.lastName === updateData.lastName, 'Last name should be updated');
    assert(updateResponse.data.user.email === userData.email, 'Email should remain unchanged');
  }

  async testJWTTokenValidation() {
    // Test with malformed tokens
    const malformedTokens = [
      'not-a-jwt',
      'only.two.parts',
      'too.many.parts.here.invalid',
      '',
      'Bearer',
      'Bearer ',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..', // Missing payload
    ];

    for (const malformedToken of malformedTokens) {
      try {
        await this.makeRequest('/api/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${malformedToken}`
          }
        });
        throw new Error(`Malformed token should be rejected: ${malformedToken}`);
      } catch (error) {
        assert(error.response && error.response.status === 401, 'Should return 401 for malformed tokens');
      }
    }
  }

  async testSecurityHeaders() {
    const response = await this.makeRequest('/api/auth/login', {
      method: 'OPTIONS'
    });

    // Check for basic security headers (if implemented)
    const headers = response.headers;
    console.log(`   Checking security headers...`);
    
    // Note: These may not be implemented yet, so we'll just log what we find
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy'
    ];

    securityHeaders.forEach(header => {
      if (headers.get(header)) {
        console.log(`   ✓ Found ${header}: ${headers.get(header)}`);
      } else {
        console.log(`   ⚠ Missing ${header}`);
      }
    });
  }

  async testRateLimiting() {
    // Simulate rapid login attempts
    const rapidAttempts = [];
    const email = 'ratelimit@example.com';
    
    console.log(`   Testing rate limiting with rapid requests...`);
    
    for (let i = 0; i < 10; i++) {
      rapidAttempts.push(
        this.makeRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: email,
            password: 'wrong-password'
          })
        }).catch(error => error)
      );
    }

    const results = await Promise.all(rapidAttempts);
    
    // Check if any requests were rate limited (429 status)
    const rateLimited = results.some(result => 
      result.response && result.response.status === 429
    );

    if (rateLimited) {
      console.log(`   ✓ Rate limiting is working`);
    } else {
      console.log(`   ⚠ Rate limiting may not be implemented`);
    }

    // All requests should at least return 401 for invalid credentials
    results.forEach(result => {
      if (result.response) {
        assert(
          result.response.status === 401 || result.response.status === 429,
          'Should return 401 or 429 for invalid/rate-limited requests'
        );
      }
    });
  }

  async testCORSConfiguration() {
    const response = await this.makeRequest('/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });

    console.log(`   Checking CORS configuration...`);
    
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];

    corsHeaders.forEach(header => {
      if (response.headers.get(header)) {
        console.log(`   ✓ Found ${header}: ${response.headers.get(header)}`);
      } else {
        console.log(`   ⚠ Missing ${header}`);
      }
    });
  }

  async testOAuthEndpoints() {
    // Test OAuth callback endpoint
    try {
      const response = await this.makeRequest('/api/auth/oauth/callback', {
        method: 'GET'
      });
      
      // Should return some kind of response (probably an error without proper OAuth flow)
      console.log(`   OAuth callback endpoint responded with status: ${response.status}`);
    } catch (error) {
      // This is expected without proper OAuth setup
      console.log(`   OAuth callback endpoint: ${error.message}`);
    }

    // Test OAuth provider endpoints (these should fail without proper setup)
    const providers = ['google', 'github', 'linkedin', 'microsoft', 'gravatar'];
    
    for (const provider of providers) {
      try {
        await this.makeRequest(`/api/auth/oauth/${provider}`, {
          method: 'POST',
          body: JSON.stringify({ code: 'invalid-code' })
        });
        console.log(`   ⚠ ${provider} OAuth endpoint unexpectedly succeeded`);
      } catch (error) {
        // Expected to fail with invalid code
        assert(
          error.response && error.response.status >= 400,
          `${provider} OAuth should return error status for invalid code`
        );
        console.log(`   ✓ ${provider} OAuth endpoint properly rejects invalid code`);
      }
    }
  }

  async testErrorHandling() {
    // Test various malformed requests
    const malformedRequests = [
      { endpoint: '/api/auth/register', method: 'POST', body: 'invalid-json' },
      { endpoint: '/api/auth/login', method: 'POST', body: null },
      { endpoint: '/api/auth/profile', method: 'PUT', body: 'not-json' },
    ];

    for (const request of malformedRequests) {
      try {
        await this.makeRequest(request.endpoint, {
          method: request.method,
          body: request.body
        });
        throw new Error('Malformed request should fail');
      } catch (error) {
        assert(
          error.response && error.response.status >= 400,
          'Malformed requests should return error status'
        );
      }
    }
  }

  async testNonExistentEndpoints() {
    const nonExistentEndpoints = [
      '/api/auth/invalid',
      '/api/auth/admin/secret',
      '/api/auth/../../../etc/passwd',
      '/api/auth/users/1/delete'
    ];

    for (const endpoint of nonExistentEndpoints) {
      try {
        await this.makeRequest(endpoint, { method: 'GET' });
        throw new Error(`Non-existent endpoint should return 404: ${endpoint}`);
      } catch (error) {
        assert(
          error.response && error.response.status === 404,
          `Should return 404 for non-existent endpoint: ${endpoint}`
        );
      }
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    // In a real implementation, we might want to delete test users
    // For now, just clear our token map
    this.userTokens.clear();
    
    console.log('✅ Cleanup completed');
  }

  async runAllTests() {
    console.log('🚀 Starting BrainSAIT Auth API Integration Test Suite');
    console.log(`📍 Testing against: ${this.baseUrl}\n`);

    // Basic functionality tests
    await this.runTest('User Registration API', () => this.testUserRegistration());
    await this.runTest('User Registration Validation', () => this.testUserRegistrationValidation());
    await this.runTest('Duplicate Registration Prevention', () => this.testDuplicateRegistration());
    
    await this.runTest('User Login API', () => this.testUserLogin());
    await this.runTest('Invalid Login Handling', () => this.testInvalidLogin());
    await this.runTest('Mock Admin Login', () => this.testMockAdminLogin());
    
    await this.runTest('User Profile Retrieval', () => this.testProfileEndpoint());
    await this.runTest('Profile Unauthorized Access', () => this.testProfileEndpointUnauthorized());
    await this.runTest('Profile Update', () => this.testProfileUpdate());
    
    // Security tests
    await this.runTest('JWT Token Validation', () => this.testJWTTokenValidation());
    await this.runTest('Security Headers Check', () => this.testSecurityHeaders());
    await this.runTest('Rate Limiting Test', () => this.testRateLimiting());
    await this.runTest('CORS Configuration', () => this.testCORSConfiguration());
    
    // OAuth and advanced tests
    await this.runTest('OAuth Endpoints', () => this.testOAuthEndpoints());
    await this.runTest('Error Handling', () => this.testErrorHandling());
    await this.runTest('Non-Existent Endpoints', () => this.testNonExistentEndpoints());

    // Cleanup
    await this.cleanup();

    // Report results
    console.log('\n📊 Integration Test Results Summary:');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Total: ${this.testResults.passed + this.testResults.failed}`);

    if (this.testResults.failed > 0) {
      console.log('\n🔍 Failed Tests:');
      this.testResults.errors.forEach(error => {
        console.log(`   • ${error.test}: ${error.error}`);
      });
      console.log('\n❌ Some integration tests failed. Review the auth API implementation.');
      return false;
    } else {
      console.log('\n🎉 All integration tests passed! Auth API is working correctly.');
      return true;
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const baseUrl = process.env.TEST_URL || 'http://localhost:8787';
  const testSuite = new AuthAPIIntegrationTests(baseUrl);
  
  testSuite.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Integration test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { AuthAPIIntegrationTests };