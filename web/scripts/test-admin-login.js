#!/usr/bin/env node

/**
 * Test Admin Login Flow
 * Tests the authentication flow with admin credentials
 */

const https = require('https');

const API_BASE = 'https://neurolancer.onrender.com/api';

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
        'User-Agent': 'AdminTest/1.0',
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

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login Flow...\n');

  try {
    // Test admin login
    console.log('1. Testing admin login...');
    const loginResponse = await makeRequest('POST', '/auth/login/', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log(`   Status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      console.log('   ✅ Login successful!');
      console.log('\n   📋 Response structure:');
      console.log(JSON.stringify(loginResponse.data, null, 4));
      
      const { user, token, profile } = loginResponse.data;
      
      // Check profile completion status
      console.log('\n2. Analyzing profile completion...');
      
      const needsCompletion = !profile?.profile_completed || 
                             !profile?.phone_number || 
                             !profile?.country || 
                             !profile?.city;
      
      console.log(`   Profile completed: ${profile?.profile_completed || false}`);
      console.log(`   Phone number: ${profile?.phone_number || 'Not set'}`);
      console.log(`   Country: ${profile?.country || 'Not set'}`);
      console.log(`   City: ${profile?.city || 'Not set'}`);
      console.log(`   Needs completion: ${needsCompletion}`);
      
      if (needsCompletion) {
        console.log('\n   ➡️  Should redirect to: /auth/complete-profile');
      } else {
        console.log('\n   ➡️  Should redirect to: /dashboard');
      }
      
      // Test profile completion endpoint if token available
      if (token) {
        console.log('\n3. Testing profile completion endpoint...');
        const profileTest = await makeRequest('POST', '/auth/complete-profile/', {
          phone_number: '+1234567890',
          country: 'US',
          state: 'CA',
          city: 'San Francisco',
          skills: 'JavaScript, React, Node.js',
          experience_level: 'expert'
        }, {
          'Authorization': `Bearer ${token}`
        });
        
        console.log(`   Profile completion status: ${profileTest.status}`);
        if (profileTest.status === 200) {
          console.log('   ✅ Profile completion endpoint working');
          console.log('   📋 Response:', profileTest.data);
        } else {
          console.log('   ⚠️  Profile completion response:', profileTest.data);
        }
      }
      
    } else if (loginResponse.status === 400) {
      console.log('   ❌ Invalid credentials');
      console.log('   📋 Error:', loginResponse.data);
    } else {
      console.log(`   ❌ Login failed with status: ${loginResponse.status}`);
      console.log('   📋 Response:', loginResponse.data);
    }

    console.log('\n🎉 Admin login test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminLogin();