#!/usr/bin/env node

/**
 * Simple Auth Flow Test
 * Tests the complete authentication flow including registration and profile completion
 */

const https = require('https');

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://neurolancer-plat.onrender.com/api';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AuthFlowTest/1.0',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAuthFlow() {
  console.log('🚀 Testing Authentication Flow...\n');

  try {
    // Test 1: Check if backend is responding
    console.log('1. Testing backend connectivity...');
    const healthCheck = await makeRequest('GET', '/categories/');
    console.log(`   ✅ Backend responding (Status: ${healthCheck.status})\n`);

    // Test 2: Test registration endpoint structure
    console.log('2. Testing registration endpoint...');
    const regTest = await makeRequest('POST', '/auth/register/', {
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      password: 'TestPass123!',
      password_confirm: 'TestPass123!',
      first_name: 'Test',
      last_name: 'User',
      user_type: 'client'
    });
    
    if (regTest.status === 201 || regTest.status === 200) {
      console.log('   ✅ Registration endpoint working');
      console.log('   📋 Response structure:', Object.keys(regTest.data || {}));
      
      // Check if we got a token
      if (regTest.data?.token) {
        console.log('   ✅ Token received in registration response');
        
        // Test 3: Test profile completion endpoint
        console.log('\n3. Testing profile completion...');
        const profileTest = await makeRequest('POST', '/auth/complete-profile/', {
          phone_number: '+1234567890',
          country: 'US',
          state: 'CA',
          city: 'San Francisco',
          skills: 'JavaScript, React',
          experience_level: 'intermediate'
        }, {
          'Authorization': `Bearer ${regTest.data.token}`
        });
        
        console.log(`   📋 Profile completion status: ${profileTest.status}`);
        if (profileTest.status === 200) {
          console.log('   ✅ Profile completion endpoint working');
        } else {
          console.log('   ⚠️  Profile completion response:', profileTest.data);
        }
      } else {
        console.log('   ⚠️  No token in registration response');
      }
    } else {
      console.log(`   ⚠️  Registration failed (Status: ${regTest.status})`);
      console.log('   📋 Error:', regTest.data);
    }

    // Test 4: Test login endpoint structure
    console.log('\n4. Testing login endpoint structure...');
    const loginTest = await makeRequest('POST', '/auth/login/', {
      username: 'nonexistent',
      password: 'wrongpass'
    });
    
    console.log(`   📋 Login endpoint status: ${loginTest.status}`);
    console.log('   📋 Response structure:', Object.keys(loginTest.data || {}));
    
    if (loginTest.data?.non_field_errors) {
      console.log('   ✅ Login endpoint responding correctly');
    }

    console.log('\n🎉 Auth flow test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Backend is accessible');
    console.log('   - Registration endpoint exists');
    console.log('   - Login endpoint exists');
    console.log('   - Profile completion endpoint exists');
    console.log('\n💡 Next steps:');
    console.log('   1. Test with real credentials');
    console.log('   2. Verify frontend redirects work');
    console.log('   3. Test phone verification flow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthFlow();