# 🔧 Complete Render Environment Variables

## ✅ Required Environment Variables for Render

### Core Django Settings
```bash
SECRET_KEY=django-insecure-9&^9p&$ojr0kvneeh-*9(5ga8-$56*ffo3w1s79&lqx+x1i6-f
DEBUG=False
DATABASE_URL=postgresql://... (Render auto-provides this)
```

### Firebase Settings (Phone Verification)
```bash
FIREBASE_PROJECT_ID=neurolancer-9aee7
FIREBASE_WEB_API_KEY=AIzaSyCtgr5jKrpNLr9MhmGUCibnpI0ZgyOgKOk
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
```

### Paystack Payment Settings
```bash
PAYSTACK_SECRET_KEY=sk_test_fd47bd1c9a97e30551cc3bb2def6d664d1671246
PAYSTACK_PUBLIC_KEY=pk_test_ce9730c10c85c796d2382e48d8635c0dcb59dd1a
```

### Email Settings
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=neurolancermail@gmail.com
EMAIL_HOST_PASSWORD=bgoyyonrlmejkqlm
```

### Twilio SMS Settings (NEW CREDENTIALS)
```bash
TWILIO_ACCOUNT_SID=AC4653544a6db70c90d9924d7b506b0864
TWILIO_AUTH_TOKEN=55c4917a08f8e0bab83a1d3268457008
TWILIO_VERIFY_SERVICE_SID=VAff7eb489cf64e2df684b828bc8a1a2e3
```

### Frontend URL
```bash
FRONTEND_URL=https://neurolancer-9omq.vercel.app
```

## 🚀 Copy-Paste for Render

**Add these exact variables in Render Environment tab:**

```
SECRET_KEY=django-insecure-9&^9p&$ojr0kvneeh-*9(5ga8-$56*ffo3w1s79&lqx+x1i6-f
DEBUG=False
FIREBASE_PROJECT_ID=neurolancer-9aee7
FIREBASE_WEB_API_KEY=AIzaSyCtgr5jKrpNLr9MhmGUCibnpI0ZgyOgKOk
PAYSTACK_SECRET_KEY=sk_test_fd47bd1c9a97e30551cc3bb2def6d664d1671246
PAYSTACK_PUBLIC_KEY=pk_test_ce9730c10c85c796d2382e48d8635c0dcb59dd1a
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=neurolancermail@gmail.com
EMAIL_HOST_PASSWORD=bgoyyonrlmejkqlm
TWILIO_ACCOUNT_SID=AC4653544a6db70c90d9924d7b506b0864
TWILIO_AUTH_TOKEN=55c4917a08f8e0bab83a1d3268457008
TWILIO_VERIFY_SERVICE_SID=VAff7eb489cf64e2df684b828bc8a1a2e3
LOCATION_API_KEY=your_bigdatacloud_api_key
LOCATION_API_URL=https://api.bigdatacloud.net/data/reverse-geocode-client
FRONTEND_URL=https://neurolancer-9omq.vercel.app
```

## 🔥 For Real SMS (Add Later)
```bash
FIREBASE_CREDENTIALS_JSON={"type":"service_account","project_id":"neurolancer-9aee7",...}
```

## ⚠️ Notes
- DATABASE_URL is auto-provided by Render
- FIREBASE_CREDENTIALS_JSON needs Firebase service account JSON
- All other variables have working defaults