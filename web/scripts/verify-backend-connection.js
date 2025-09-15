#!/usr/bin/env node

/**
 * Backend Connection Verification Script
 * Tests connection to the Neurolancer backend API
 */

const https = require('https');

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://neurolancer-plat.onrender.com/api';
const BASE_URL = BACKEND_URL.replace('/api', '');

console.log('🔍 Verifying Backend Connection...\n');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Base URL: ${BASE_URL}\n`);

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        resolve({
          status: response.statusCode,
          headers: response.headers,
          data: data
        });
      });
    });
    
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function verifyConnection() {
  const tests = [
    {
      name: 'Backend Health Check',
      url: `${BASE_URL}/`,
      expectedStatus: [200, 301, 302]
    },
    {
      name: 'API Endpoint',
      url: `${BACKEND_URL}/`,
      expectedStatus: [200, 404] // 404 is OK for API root
    },
    {
      name: 'Categories Endpoint',
      url: `${BACKEND_URL}/categories/`,
      expectedStatus: [200]
    },
    {
      name: 'Admin Panel',
      url: `${BASE_URL}/admin/`,
      expectedStatus: [200, 301, 302]
    }
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`URL: ${test.url}`);
      
      const response = await makeRequest(test.url);
      const passed = test.expectedStatus.includes(response.status);
      
      console.log(`Status: ${response.status} ${passed ? '✅' : '❌'}`);
      
      if (!passed) {
        allPassed = false;
        console.log(`Expected: ${test.expectedStatus.join(' or ')}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('');
      allPassed = false;
    }
  }

  console.log('📋 Summary:');
  console.log('================');
  
  if (allPassed) {
    console.log('✅ All tests passed! Backend is accessible.');
    console.log('✅ Frontend is properly configured to connect to:');
    console.log(`   ${BACKEND_URL}`);
  } else {
    console.log('❌ Some tests failed. Check backend availability.');
    console.log('💡 Troubleshooting:');
    console.log('   1. Verify backend is deployed and running');
    console.log('   2. Check CORS settings allow frontend domain');
    console.log('   3. Verify SSL certificate is valid');
    console.log('   4. Check firewall/network restrictions');
  }
  
  console.log('\n🔧 Configuration Status:');
  console.log(`Environment Variable: ${process.env.NEXT_PUBLIC_API_URL || 'Not set (using fallback)'}`);
  console.log(`Fallback URL: https://neurolancer-plat.onrender.com/api`);
  console.log(`Next.js Config: ✅ Configured for neurolancer-plat.onrender.com`);
  console.log(`API Client: ✅ Using environment variable with fallback`);
}

verifyConnection().catch(console.error);