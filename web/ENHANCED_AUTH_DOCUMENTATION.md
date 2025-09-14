# Enhanced Authentication System Documentation

## Overview
This document outlines the complete implementation of a two-step registration system with phone verification, location capture, and comprehensive profile completion for the Neurolancer platform.

## 1. Frontend Implementation

### 1.1 Enhanced Registration Flow
```
Step 1: Basic Registration (/auth)
├── Email/Password Registration
├── Google OAuth Registration
└── User Type Selection (Client/Freelancer/Both)

Step 2: Profile Completion (/auth/complete-profile)
├── Phone Verification (Firebase)
├── Location Information (Country/State/City)
├── Professional Information
└── Personal Details
```

### 1.2 New Components Created

#### A. Complete Profile Page
**File**: `web/app/auth/complete-profile/page.tsx`
- Phone number verification using Firebase Auth
- Country selection with phone codes
- US state selection (conditional)
- Professional information collection
- Form validation and error handling

#### B. Enhanced Auth Page (Existing)
**File**: `web/app/auth/page.tsx`
- Redirect to complete-profile after successful registration
- Google OAuth integration
- Basic user information collection

### 1.3 Firebase Integration

#### Phone Verification Setup
```typescript
// Firebase configuration for phone auth
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Initialize reCAPTCHA
const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
  size: 'invisible',
  callback: () => console.log('reCAPTCHA solved')
});

// Send verification code
const confirmationResult = await signInWithPhoneNumber(
  auth,
  fullPhoneNumber,
  recaptchaVerifier
);
```

## 2. Backend Requirements

### 2.1 Enhanced User Model

#### Required Database Schema Updates
```python
# backend/api/models.py

class User(AbstractUser):
    # Existing fields
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    
    # NEW REQUIRED FIELDS
    # Phone Information
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    phone_verified = models.BooleanField(default=False)
    phone_verification_code = models.CharField(max_length=10, blank=True, null=True)
    phone_verification_expires = models.DateTimeField(blank=True, null=True)
    
    # Location Information
    country = models.CharField(max_length=2, blank=True, null=True)  # ISO country code
    state = models.CharField(max_length=50, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    timezone = models.CharField(max_length=50, blank=True, null=True)
    
    # Professional Information
    skills = models.TextField(blank=True, null=True)  # Comma-separated or JSON
    experience_level = models.CharField(
        max_length=20, 
        choices=[
            ('entry', 'Entry Level'),
            ('intermediate', 'Intermediate'),
            ('expert', 'Expert')
        ],
        default='entry'
    )
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    availability = models.CharField(
        max_length=20,
        choices=[
            ('full-time', 'Full Time'),
            ('part-time', 'Part Time'),
            ('contract', 'Contract'),
            ('freelance', 'Freelance')
        ],
        default='full-time'
    )
    bio = models.TextField(blank=True, null=True)
    
    # Personal Information
    date_of_birth = models.DateField(blank=True, null=True)
    
    # Profile Status
    profile_completed = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    
    # OAuth Information
    google_id = models.CharField(max_length=100, blank=True, null=True)
    google_photo_url = models.URLField(blank=True, null=True)
    
    # Metadata
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    registration_ip = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'user_type']
```

### 2.2 Required API Endpoints

#### A. Profile Completion Endpoint
```python
# backend/api/views.py

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_profile(request):
    """
    Complete user profile with additional information
    """
    user = request.user
    serializer = ProfileCompletionSerializer(user, data=request.data, partial=True)
    
    if serializer.is_valid():
        # Validate phone number format
        phone_number = serializer.validated_data.get('phone_number')
        if phone_number and not is_valid_phone_number(phone_number):
            return Response({'error': 'Invalid phone number format'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Mark profile as completed
        serializer.validated_data['profile_completed'] = True
        serializer.save()
        
        return Response({
            'message': 'Profile completed successfully',
            'user': UserSerializer(user).data
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

#### B. Phone Verification Endpoints
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_phone_verification(request):
    """
    Send phone verification code
    """
    phone_number = request.data.get('phone_number')
    
    if not phone_number:
        return Response({'error': 'Phone number required'}, 
                      status=status.HTTP_400_BAD_REQUEST)
    
    # Generate verification code
    verification_code = generate_verification_code()
    
    # Store code with expiration
    user = request.user
    user.phone_verification_code = verification_code
    user.phone_verification_expires = timezone.now() + timedelta(minutes=10)
    user.save()
    
    # Send SMS (integrate with Twilio/AWS SNS)
    send_sms_verification(phone_number, verification_code)
    
    return Response({'message': 'Verification code sent'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_phone_number(request):
    """
    Verify phone number with code
    """
    code = request.data.get('code')
    user = request.user
    
    if not code:
        return Response({'error': 'Verification code required'}, 
                      status=status.HTTP_400_BAD_REQUEST)
    
    # Check code validity
    if (user.phone_verification_code != code or 
        user.phone_verification_expires < timezone.now()):
        return Response({'error': 'Invalid or expired code'}, 
                      status=status.HTTP_400_BAD_REQUEST)
    
    # Mark phone as verified
    user.phone_verified = True
    user.phone_verification_code = None
    user.phone_verification_expires = None
    user.save()
    
    return Response({'message': 'Phone number verified successfully'})
```

#### C. Google OAuth Enhancement
```python
@api_view(['POST'])
def google_oauth_callback(request):
    """
    Enhanced Google OAuth with profile data extraction
    """
    google_token = request.data.get('token')
    
    # Verify Google token
    google_user_info = verify_google_token(google_token)
    
    if not google_user_info:
        return Response({'error': 'Invalid Google token'}, 
                      status=status.HTTP_400_BAD_REQUEST)
    
    # Extract user information
    email = google_user_info.get('email')
    first_name = google_user_info.get('given_name', '')
    last_name = google_user_info.get('family_name', '')
    google_id = google_user_info.get('sub')
    google_photo_url = google_user_info.get('picture')
    
    # Create or update user
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': first_name,
            'last_name': last_name,
            'google_id': google_id,
            'google_photo_url': google_photo_url,
            'email_verified': True,
            'registration_ip': get_client_ip(request)
        }
    )
    
    # Generate JWT token
    token = generate_jwt_token(user)
    
    return Response({
        'token': token,
        'user': UserSerializer(user).data,
        'requires_completion': not user.profile_completed
    })
```

### 2.3 Required Serializers

#### A. Profile Completion Serializer
```python
# backend/api/serializers.py

class ProfileCompletionSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'phone_number', 'country', 'state', 'city', 'address',
            'skills', 'experience_level', 'hourly_rate', 'availability',
            'bio', 'date_of_birth'
        ]
    
    def validate_phone_number(self, value):
        if value and not is_valid_phone_number(value):
            raise serializers.ValidationError("Invalid phone number format")
        return value
    
    def validate_country(self, value):
        valid_countries = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IN', 'NG', 'ZA', 'BR']
        if value and value not in valid_countries:
            raise serializers.ValidationError("Invalid country code")
        return value

class EnhancedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'user_type',
            'phone_number', 'phone_verified', 'country', 'state', 'city',
            'skills', 'experience_level', 'hourly_rate', 'availability',
            'bio', 'profile_completed', 'email_verified', 'google_photo_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'phone_verified', 'email_verified', 'created_at', 'updated_at']
```

### 2.4 Database Migration

#### Required Migration Commands
```bash
# Create migration for new user fields
python manage.py makemigrations --name add_enhanced_user_fields

# Apply migration
python manage.py migrate
```

#### Migration File Structure
```python
# backend/api/migrations/XXXX_add_enhanced_user_fields.py

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('api', 'XXXX_previous_migration'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='phone_number',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='phone_verified',
            field=models.BooleanField(default=False),
        ),
        # ... add all other fields
    ]
```

## 3. Third-Party Integrations

### 3.1 Firebase Configuration

#### Required Firebase Services
- **Authentication**: Phone number verification
- **reCAPTCHA**: Bot protection for phone verification

#### Firebase Setup
```javascript
// web/lib/firebase.ts - Enhanced configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 3.2 SMS Service Integration (Backend)

#### Option 1: Twilio Integration
```python
# backend/utils/sms.py
from twilio.rest import Client

def send_sms_verification(phone_number, code):
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    
    message = client.messages.create(
        body=f'Your Neurolancer verification code is: {code}',
        from_=settings.TWILIO_PHONE_NUMBER,
        to=phone_number
    )
    
    return message.sid
```

#### Option 2: AWS SNS Integration
```python
# backend/utils/sms.py
import boto3

def send_sms_verification(phone_number, code):
    sns = boto3.client('sns', region_name=settings.AWS_REGION)
    
    response = sns.publish(
        PhoneNumber=phone_number,
        Message=f'Your Neurolancer verification code is: {code}'
    )
    
    return response['MessageId']
```

## 4. Environment Variables

### 4.1 Frontend Environment Variables
```bash
# web/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_API_URL=https://neurolancer.onrender.com/api
```

### 4.2 Backend Environment Variables
```bash
# backend/.env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# AWS Configuration (Alternative to Twilio)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
```

## 5. URL Routing

### 5.1 Frontend Routes
```typescript
// Enhanced routing structure
/auth                    # Basic registration/login
/auth/complete-profile   # Profile completion (new)
/dashboard              # Redirect after completion
```

### 5.2 Backend API Routes
```python
# backend/api/urls.py
urlpatterns = [
    # Existing routes
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/google/', views.google_oauth_callback, name='google_oauth'),
    
    # NEW ROUTES
    path('auth/complete-profile/', views.complete_profile, name='complete_profile'),
    path('auth/send-phone-verification/', views.send_phone_verification, name='send_phone_verification'),
    path('auth/verify-phone/', views.verify_phone_number, name='verify_phone'),
    path('auth/profile/', views.get_user_profile, name='get_profile'),
]
```

## 6. Security Considerations

### 6.1 Phone Verification Security
- Verification codes expire after 10 minutes
- Rate limiting on SMS sending (max 3 attempts per hour)
- reCAPTCHA protection against bots
- Phone number format validation

### 6.2 Data Protection
- PII encryption for sensitive fields
- GDPR compliance for EU users
- Data retention policies
- Secure token storage

## 7. Testing Requirements

### 7.1 Frontend Testing
```typescript
// Test phone verification flow
// Test form validation
// Test Google OAuth integration
// Test responsive design
```

### 7.2 Backend Testing
```python
# Test API endpoints
# Test phone verification logic
# Test data validation
# Test security measures
```

## 8. Deployment Checklist

### 8.1 Frontend Deployment
- [ ] Firebase configuration
- [ ] Environment variables set
- [ ] Build and deploy to Vercel
- [ ] Test phone verification in production

### 8.2 Backend Deployment
- [ ] Database migration applied
- [ ] SMS service configured (Twilio/AWS SNS)
- [ ] Environment variables set
- [ ] API endpoints tested
- [ ] Deploy to Render

## 9. Implementation Priority

### Phase 1: Core Implementation
1. Enhanced User model and migration
2. Profile completion API endpoints
3. Frontend profile completion page
4. Basic phone verification (without SMS)

### Phase 2: Phone Verification
1. Firebase phone auth integration
2. SMS service setup (Twilio/AWS SNS)
3. Phone verification API endpoints
4. Frontend phone verification flow

### Phase 3: Enhancements
1. Google OAuth profile data extraction
2. Advanced form validation
3. Location-based features
4. Professional profile enhancements

This documentation provides a complete roadmap for implementing the enhanced authentication system with phone verification and comprehensive profile completion.