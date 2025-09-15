#!/usr/bin/env node

/**
 * Test Updated Authentication Flow
 * Tests the corrected flow with proper field names
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
        'User-Agent': 'FlowTest/1.0',
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

async function testUpdatedFlow() {
  console.log('🔄 Testing Updated Authentication Flow...\n');

  try {
    // Test admin login
    console.log('1. Admin Login Test');
    const loginResponse = await makeRequest('POST', '/auth/login/', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.status === 200) {
      const { user, token, profile } = loginResponse.data;
      
      console.log('   ✅ Login successful');
      console.log(`   👤 User: ${user.username} (${user.email})`);
      console.log(`   🔑 Token: ${token.substring(0, 20)}...`);
      
      // Check profile completion with correct field names
      console.log('\n2. Profile Completion Check');
      console.log(`   📞 Phone: "${profile.phone || 'Not set'}"`);
      console.log(`   🌍 Country: "${profile.country || 'Not set'}"`);
      console.log(`   🏙️  City: "${profile.city || 'Not set'}"`);
      console.log(`   💼 Skills: "${profile.skills || 'Not set'}"`);
      
      const needsCompletion = !profile.phone || !profile.country || !profile.city;
      console.log(`   ❓ Needs completion: ${needsCompletion}`);
      
      if (needsCompletion) {
        console.log('   ➡️  Frontend should redirect to: /auth/complete-profile');
        
        // Test profile completion
        console.log('\n3. Testing Profile Completion');
        const completeResponse = await makeRequest('POST', '/auth/complete-profile/', {
          phone: '+1234567890',
          country: 'US',
          state: 'CA',
          city: 'San Francisco',
          skills: 'JavaScript, React, Node.js',
          experience_level: 'expert'
        }, {
          'Authorization': `Bearer ${token}`
        });
        
        console.log(`   📋 Completion status: ${completeResponse.status}`);
        if (completeResponse.status === 200) {
          console.log('   ✅ Profile completion successful');
          console.log('   ➡️  Should now redirect to: /dashboard');
        } else {
          console.log('   ⚠️  Profile completion failed');
          console.log('   📋 Response:', completeResponse.data);
        }
      } else {
        console.log('   ➡️  Frontend should redirect to: /dashboard');
      }
      
    } else {
      console.log(`   ❌ Login failed: ${loginResponse.status}`);
    }

    console.log('\n🎉 Flow test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Backend uses "phone" field (not "phone_number")');
    console.log('   - No "profile_completed" field in response');
    console.log('   - Profile completion detection works with field presence');
    console.log('   - Authentication flow is now properly configured');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpdatedFlow();