#!/usr/bin/env node

/**
 * Test Phone Verification Endpoints
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
        'User-Agent': 'PhoneTest/1.0',
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

async function testPhoneVerification() {
  console.log('📱 Testing Phone Verification Endpoints...\n');

  try {
    // First, login to get a token
    console.log('1. Getting authentication token...');
    const loginResponse = await makeRequest('POST', '/auth/login/', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Test phone verification endpoint
    console.log('\n2. Testing send phone verification...');
    const phoneResponse = await makeRequest('POST', '/auth/send-phone-verification/', {
      phone_number: '+254712345678'  // Kenyan number
    }, {
      'Authorization': `Token ${token}`
    });
    
    console.log(`📋 Phone verification status: ${phoneResponse.status}`);
    console.log('📋 Response:', phoneResponse.data);
    
    if (phoneResponse.status === 200 && phoneResponse.data.verification_code) {
      console.log('\n3. Testing phone verification with code...');
      const verifyResponse = await makeRequest('POST', '/auth/verify-phone/', {
        code: phoneResponse.data.verification_code,
        session_info: phoneResponse.data.session_info
      }, {
        'Authorization': `Token ${token}`
      });
      
      console.log(`📋 Verification status: ${verifyResponse.status}`);
      console.log('📋 Response:', verifyResponse.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPhoneVerification();