# Firebase Phone Authentication Setup

## 1. Firebase Console Configuration

### Enable Phone Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `neurolancer-9aee7`
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Phone** provider
5. Add your domain to authorized domains:
   - `neurolancer-9omq.vercel.app`
   - `localhost` (for development)

### Configure reCAPTCHA (Required for Web)
1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your production domain: `neurolancer-9omq.vercel.app`
3. reCAPTCHA will be automatically configured

## 2. Frontend Implementation

### Install Dependencies
```bash
cd web
npm install firebase
```

### Usage Example
```tsx
import PhoneVerificationModal from '@/components/PhoneVerificationModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = () => {
    console.log('Phone verified successfully!');
    // Update UI or redirect
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Verify Phone Number
      </button>
      
      <PhoneVerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
```

## 3. Backend Configuration

### Environment Variables (Already Set)
- `FIREBASE_CREDENTIALS_JSON`: Your service account JSON (already in Render)

### API Endpoints
- `POST /api/auth/send-phone-verification/`: Prepare for verification
- `POST /api/auth/verify-phone-number/`: Verify with Firebase token

## 4. How It Works

### Client-Side Flow
1. User enters phone number
2. reCAPTCHA verification appears
3. User solves reCAPTCHA
4. Firebase sends SMS to phone
5. User enters verification code
6. Firebase verifies code and creates ID token
7. Frontend sends ID token to backend

### Backend Flow
1. Receives Firebase ID token
2. Verifies token with Firebase Admin SDK
3. Extracts phone number from verified token
4. Updates user profile with verified phone number

## 5. Security Features

- **reCAPTCHA**: Prevents automated abuse
- **Firebase Security**: Google's robust phone verification
- **Token Verification**: Backend verifies Firebase tokens
- **Rate Limiting**: Firebase handles rate limiting automatically

## 6. Testing

### Development Testing
- Use test phone numbers in Firebase Console
- Add test numbers: `+1 650-555-3434` (code: `123456`)

### Production
- Real SMS will be sent to actual phone numbers
- Monitor usage in Firebase Console

## 7. Troubleshooting

### Common Issues
1. **reCAPTCHA not showing**: Check authorized domains
2. **SMS not received**: Verify phone number format (+country code)
3. **Token verification fails**: Check Firebase service account setup

### Debug Steps
1. Check browser console for Firebase errors
2. Verify Firebase project configuration
3. Check backend logs for token verification errors

## 8. Cost Considerations

- **Free Tier**: 10,000 phone verifications/month
- **Paid**: $0.05 per verification after free tier
- Monitor usage in Firebase Console > Usage tab