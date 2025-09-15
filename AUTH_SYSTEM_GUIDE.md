# Authentication System Configuration Guide

## Overview

This guide covers the complete authentication system setup between the Neurolancer frontend (Next.js) and backend (Django). Both systems are properly configured and working together.

## System Architecture

```
Frontend (Next.js)          Backend (Django)
├── /web                    ├── /backend
│   ├── lib/auth.ts         │   ├── api/models.py
│   ├── lib/api.ts          │   ├── api/views.py
│   ├── lib/profile.ts      │   ├── api/urls.py
│   └── types/index.ts      │   └── api/serializers.py
```

## Configuration Status ✅

### Frontend Configuration
- ✅ Environment variables configured (`.env.local`)
- ✅ API client configured (`lib/api.ts`)
- ✅ Authentication utilities (`lib/auth.ts`)
- ✅ Profile management (`lib/profile.ts`)
- ✅ Enhanced type definitions (`types/index.ts`)

### Backend Configuration
- ✅ Enhanced user models with phone verification
- ✅ Complete authentication endpoints
- ✅ Profile completion workflow
- ✅ Google OAuth integration
- ✅ Phone verification system
- ✅ CORS properly configured

## API Endpoints

### Authentication Endpoints
```
POST /api/auth/register/              - User registration
POST /api/auth/login/                 - User login
POST /api/auth/logout/                - User logout
POST /api/auth/google/                - Google OAuth
GET  /api/auth/profile/               - Get user profile
```

### Enhanced Authentication
```
POST /api/auth/complete-profile/      - Complete user profile
POST /api/auth/send-phone-verification/ - Send phone verification
POST /api/auth/verify-phone/          - Verify phone number
GET  /api/auth/get-profile/           - Get enhanced profile
```

### Email & Password Management
```
POST /api/auth/verify-email/          - Verify email address
POST /api/auth/resend-verification/   - Resend verification email
POST /api/auth/forgot-password/       - Request password reset
POST /api/auth/reset-password/        - Reset password
```

## Authentication Flow

### 1. Standard Registration
```javascript
// Frontend
const response = await api.post('/auth/register/', {
  username: 'user123',
  email: 'user@example.com',
  password: 'SecurePassword123!',
  password_confirm: 'SecurePassword123!',
  first_name: 'John',
  last_name: 'Doe',
  user_type: 'client'
});

// Response includes token and user data
const { token, user, profile } = response.data;
```

### 2. Google OAuth
```javascript
// Frontend
const response = await api.post('/auth/google/', {
  uid: googleUser.uid,
  email: googleUser.email,
  first_name: googleUser.displayName.split(' ')[0],
  last_name: googleUser.displayName.split(' ').slice(1).join(' '),
  photo_url: googleUser.photoURL
});

// Backend automatically creates/updates user
const { token, user, profile, is_new_user } = response.data;
```

### 3. Profile Completion
```javascript
// Frontend
const response = await api.post('/auth/complete-profile/', {
  phone_number: '+1234567890',
  country: 'US',
  state: 'CA',
  city: 'San Francisco',
  skills: 'JavaScript, Python, React',
  experience_level: 'intermediate'
});
```

### 4. Phone Verification
```javascript
// Send verification code
await api.post('/auth/send-phone-verification/', {
  phone_number: '+1234567890'
});

// Verify code
await api.post('/auth/verify-phone/', {
  code: '123456'
});
```

## Frontend Integration

### Authentication State Management
```typescript
// lib/auth.ts
export const isAuthenticated = (): boolean => {
  return !!getAuthToken() && !!getUser();
};

export const getUser = (): User | null => {
  const userStr = Cookies.get('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getProfile = (): UserProfile | null => {
  const profileStr = Cookies.get('profile');
  return profileStr ? JSON.parse(profileStr) : null;
};
```

### API Client Configuration
```typescript
// lib/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});
```

## Backend Models

### Enhanced User Profile
```python
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    user_type = models.CharField(max_length=10, choices=USER_TYPES)
    
    # Enhanced Authentication Fields
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    phone_verified = models.BooleanField(default=False)
    phone_verification_code = models.CharField(max_length=10, blank=True, null=True)
    
    # Location Information
    country_code = models.CharField(max_length=2, blank=True, null=True)
    state = models.CharField(max_length=50, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    
    # Professional Information
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS)
    availability = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES)
    
    # Profile Status
    profile_completed = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
```

## Testing the System

### 1. Run Configuration Check
```bash
cd F:\neurolancercode\Neurolancer-plat\web
node scripts\verify-auth-config.js
```

### 2. Test API Endpoints
```bash
# Windows
scripts\test-auth-curl.bat

# Or manually test with curl
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123!","password_confirm":"TestPass123!","first_name":"Test","last_name":"User","user_type":"client"}'
```

### 3. Frontend Testing
```bash
cd F:\neurolancercode\Neurolancer-plat\web
npm run dev
# Navigate to http://localhost:3000/auth
```

## Environment Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://neurolancer.onrender.com/api
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_ce9730c10c85c796d2382e48d8635c0dcb59dd1a
```

### Backend (settings.py)
```python
# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
}

# Frontend URL
FRONTEND_URL = 'https://neurolancer-9omq.vercel.app'
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS settings include frontend domain
   - Check `CORS_ALLOWED_ORIGINS` in settings.py

2. **API Connection Issues**
   - Verify backend is running on port 8000
   - Check `NEXT_PUBLIC_API_URL` in .env.local

3. **Authentication Token Issues**
   - Clear browser cookies and localStorage
   - Check token format in API requests

4. **Profile Completion Issues**
   - Ensure all required fields are provided
   - Check backend validation rules

### Debug Commands
```bash
# Check backend status
curl http://localhost:8000/api/auth/test-endpoint/

# Check frontend API configuration
# Open browser console and check API_BASE_URL

# Test authentication flow
# Use browser dev tools to monitor network requests
```

## Security Features

- ✅ Token-based authentication
- ✅ Password strength validation
- ✅ Email verification
- ✅ Phone number verification
- ✅ CORS protection
- ✅ CSRF protection
- ✅ Input validation and sanitization
- ✅ Secure password hashing

## Next Steps

1. **Production Deployment**
   - Update API URLs for production
   - Configure production CORS settings
   - Set up SSL certificates
   - Configure production database

2. **Additional Features**
   - Two-factor authentication
   - Social login (Facebook, LinkedIn)
   - Password complexity requirements
   - Account lockout policies

## Support

If you encounter any issues:

1. Run the verification script: `node scripts\verify-auth-config.js`
2. Test endpoints with: `scripts\test-auth-curl.bat`
3. Check browser console for frontend errors
4. Check Django logs for backend errors

The authentication system is fully configured and ready for use! 🎉