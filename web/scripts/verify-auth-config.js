#!/usr/bin/env node

/**
 * Authentication Configuration Verification Script
 * This script verifies that both frontend and backend auth systems are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Authentication Configuration...\n');

// Check frontend configuration
console.log('📱 Frontend Configuration:');

// Check .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('NEXT_PUBLIC_API_URL')) {
    console.log('✅ API URL configured');
  } else {
    console.log('❌ API URL not configured');
  }
  
  if (envContent.includes('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY')) {
    console.log('✅ Paystack public key configured');
  } else {
    console.log('❌ Paystack public key not configured');
  }
} else {
  console.log('❌ .env.local file missing');
}

// Check auth lib files
const authLibPath = path.join(__dirname, '..', 'lib', 'auth.ts');
if (fs.existsSync(authLibPath)) {
  console.log('✅ Auth library exists');
} else {
  console.log('❌ Auth library missing');
}

const profileLibPath = path.join(__dirname, '..', 'lib', 'profile.ts');
if (fs.existsSync(profileLibPath)) {
  console.log('✅ Profile library exists');
} else {
  console.log('❌ Profile library missing');
}

// Check types
const typesPath = path.join(__dirname, '..', 'types', 'index.ts');
if (fs.existsSync(typesPath)) {
  console.log('✅ Type definitions exist');
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  if (typesContent.includes('phone_verified')) {
    console.log('✅ Enhanced auth types configured');
  } else {
    console.log('❌ Enhanced auth types missing');
  }
} else {
  console.log('❌ Type definitions missing');
}

console.log('\n🔧 Backend Configuration:');

// Check if backend directory exists
const backendPath = 'F:\\progsAndStuff\\neurolancer\\webapp\\backend';
if (fs.existsSync(backendPath)) {
  console.log('✅ Backend directory found');
  
  // Check models
  const modelsPath = path.join(backendPath, 'api', 'models.py');
  if (fs.existsSync(modelsPath)) {
    console.log('✅ Backend models exist');
    const modelsContent = fs.readFileSync(modelsPath, 'utf8');
    
    if (modelsContent.includes('phone_verified')) {
      console.log('✅ Enhanced auth fields in models');
    } else {
      console.log('❌ Enhanced auth fields missing in models');
    }
  } else {
    console.log('❌ Backend models missing');
  }
  
  // Check views
  const viewsPath = path.join(backendPath, 'api', 'views.py');
  if (fs.existsSync(viewsPath)) {
    console.log('✅ Backend views exist');
    const viewsContent = fs.readFileSync(viewsPath, 'utf8');
    
    if (viewsContent.includes('complete_profile')) {
      console.log('✅ Enhanced auth endpoints available');
    } else {
      console.log('❌ Enhanced auth endpoints missing');
    }
  } else {
    console.log('❌ Backend views missing');
  }
  
  // Check URLs
  const urlsPath = path.join(backendPath, 'api', 'urls.py');
  if (fs.existsSync(urlsPath)) {
    console.log('✅ Backend URLs configured');
    const urlsContent = fs.readFileSync(urlsPath, 'utf8');
    
    if (urlsContent.includes('complete-profile')) {
      console.log('✅ Enhanced auth URLs configured');
    } else {
      console.log('❌ Enhanced auth URLs missing');
    }
  } else {
    console.log('❌ Backend URLs missing');
  }
} else {
  console.log('❌ Backend directory not found at expected path');
}

console.log('\n📋 Configuration Summary:');
console.log('Frontend: F:\\neurolancercode\\Neurolancer-plat\\web');
console.log('Backend: F:\\progsAndStuff\\neurolancer\\webapp\\backend');
console.log('\n🔗 Expected API Endpoints:');
console.log('- POST /api/auth/register/');
console.log('- POST /api/auth/login/');
console.log('- POST /api/auth/google/');
console.log('- POST /api/auth/complete-profile/');
console.log('- POST /api/auth/send-phone-verification/');
console.log('- POST /api/auth/verify-phone/');
console.log('- GET /api/auth/profile/');

console.log('\n✨ Next Steps:');
console.log(`1. Backend is running on ${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://neurolancer-plat.onrender.com'}`);
console.log('2. Test API endpoints with curl or Postman');
console.log('3. Verify CORS settings allow frontend domain');
console.log('4. Check database migrations are applied');
console.log('5. Test authentication flow end-to-end');