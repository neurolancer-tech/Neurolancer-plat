#!/usr/bin/env node

/**
 * Check Login Response Structure
 * This script helps understand what the backend returns on successful login
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
        'User-Agent': 'LoginTest/1.0',
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

async function checkLoginResponse() {
  console.log('🔍 Checking Login Response Structure...\n');

  try {
    // Test with various common test credentials
    const testCredentials = [
      { username: 'admin', password: 'admin' },
      { username: 'test', password: 'test' },
      { username: 'demo', password: 'demo' },
      { username: 'user', password: 'password' }
    ];

    for (const creds of testCredentials) {
      console.log(`Testing: ${creds.username}/${creds.password}`);
      
      const response = await makeRequest('POST', '/auth/login/', creds);
      
      console.log(`Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('✅ SUCCESS! Login response structure:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Check what fields are available
        if (response.data) {
          console.log('\n📋 Available fields:');
          Object.keys(response.data).forEach(key => {
            console.log(`   - ${key}: ${typeof response.data[key]}`);
          });
          
          // Check if profile_completed field exists
          if (response.data.profile && response.data.profile.profile_completed !== undefined) {
            console.log(`\n✅ profile_completed field found: ${response.data.profile.profile_completed}`);
          } else {
            console.log('\n⚠️  profile_completed field not found in response');
          }
          
          // Check if requires_completion field exists
          if (response.data.requires_completion !== undefined) {
            console.log(`✅ requires_completion field found: ${response.data.requires_completion}`);
          } else {
            console.log('⚠️  requires_completion field not found in response');
          }
        }
        break;
      } else if (response.status === 400) {
        console.log(`❌ Invalid credentials`);
      } else {
        console.log(`❌ Error: ${response.status}`);
        if (response.data) {
          console.log(`   ${JSON.stringify(response.data)}`);
        }
      }
      console.log('');
    }

    // Also check the user profile endpoint structure
    console.log('\n🔍 Checking profile endpoint...');
    const profileResponse = await makeRequest('GET', '/auth/profile/');
    console.log(`Profile endpoint status: ${profileResponse.status}`);
    
    if (profileResponse.status === 401) {
      console.log('✅ Profile endpoint requires authentication (as expected)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

checkLoginResponse();