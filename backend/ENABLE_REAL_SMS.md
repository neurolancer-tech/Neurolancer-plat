# Enable Real SMS Delivery

## Current Status: TEST MODE ❌
The backend is generating mock codes instead of sending real SMS.

## To Enable Real SMS: ✅

### 1. Firebase Setup
```bash
# Go to Firebase Console: https://console.firebase.google.com
# Create project or use existing: neurolancer-app
# Enable Authentication > Phone sign-in method
```

### 2. Get Firebase Credentials
```bash
# In Firebase Console:
# Project Settings > Service Accounts > Generate new private key
# Download the JSON file
```

### 3. Set Environment Variables
```bash
# Add to your .env file or environment:
FIREBASE_CREDENTIALS_JSON='{"type":"service_account","project_id":"your-project",...}'
# OR
FIREBASE_CREDENTIALS_PATH='/path/to/firebase-credentials.json'
FIREBASE_PROJECT_ID='your-project-id'
FIREBASE_WEB_API_KEY='your-web-api-key'
```

### 4. Update Firebase Service (Production Mode)
Replace the mock implementation in firebase_service.py with real Firebase SMS.

## Quick Test
```bash
# Current: Returns mock code in response
# After setup: Sends real SMS, no code in response
```