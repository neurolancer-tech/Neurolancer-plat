# 🚀 Backend Deployment Guide

## ✅ Backend Replaced Successfully
- Complete backend copied from working directory
- Firebase phone verification included
- All latest features included

## 🔧 Deploy to Render

### 1. Connect Repository
```bash
# Go to: https://render.com
# New > Web Service
# Connect GitHub repository: Neurolancer-plat
# Root Directory: backend
```

### 2. Build Settings
```bash
Build Command: ./build.sh
Start Command: gunicorn neurolancer_backend.wsgi:application
```

### 3. Environment Variables (Add in Render)
```bash
# Required
SECRET_KEY=your-secret-key
DEBUG=False
DATABASE_URL=postgresql://... (Render provides this)

# Firebase (for SMS)
FIREBASE_PROJECT_ID=neurolancer-9aee7
FIREBASE_WEB_API_KEY=AIzaSyCtgr5jKrpNLr9MhmGUCibnpI0ZgyOgKOk
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}

# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Email
EMAIL_HOST_USER=neurolancermail@gmail.com
EMAIL_HOST_PASSWORD=bgoyyonrlmejkqlm
```

### 4. Deploy Steps
1. **Create Service** → Select repository
2. **Set Root Directory** → `backend`
3. **Add Environment Variables** → Copy from above
4. **Deploy** → Render will build automatically

### 5. After Deployment
```bash
# Your backend will be at:
https://your-app-name.onrender.com

# Test endpoints:
https://your-app-name.onrender.com/api/
https://your-app-name.onrender.com/admin/
```

## 🔥 Firebase Setup for Real SMS

### 1. Firebase Console
- Go to: https://console.firebase.google.com/project/neurolancer-9aee7
- Authentication → Sign-in method → Enable Phone

### 2. Service Account
- Project Settings → Service Accounts
- Generate new private key → Download JSON
- Copy JSON content to FIREBASE_CREDENTIALS_JSON

### 3. Test Real SMS
- After deployment with Firebase credentials
- Phone verification will send real SMS
- No more mock codes

## ⚡ Quick Deploy Commands
```bash
# If using Render CLI
render services create
render env set SECRET_KEY=your-key
render deploy
```