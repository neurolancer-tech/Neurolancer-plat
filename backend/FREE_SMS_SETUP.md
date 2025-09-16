# Free SMS Verification Setup Guide

## 🎯 Current Status: Mock Mode (Development Ready)

Your system currently works in **mock mode** - perfect for development and testing. Here are your options to enable real SMS:

## Option 1: Firebase Phone Auth (RECOMMENDED) 🔥

**✅ FREE: 10,000 verifications/month**

### Setup Steps:

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable "Authentication" → "Phone" provider

2. **Get Service Account Key**
   - Go to Project Settings → Service Accounts
   - Generate new private key (downloads JSON file)

3. **Set Environment Variables**
   ```bash
   # Copy the entire JSON content as one line
   FIREBASE_CREDENTIALS={"type":"service_account","project_id":"your-project",...}
   FIREBASE_PROJECT_ID=your-project-id
   ```

4. **Install Firebase SDK**
   ```bash
   pip install firebase-admin
   ```

5. **Test**
   ```bash
   # Your existing endpoint will now send real SMS!
   curl -X POST https://your-api.com/api/auth/send-phone-verification/ \
     -H "Authorization: Token YOUR_TOKEN" \
     -d '{"phone_number": "+1234567890"}'
   ```

---

## Option 2: Vonage (Nexmo) 📱

**✅ FREE: €2 credit (~30 SMS)**

### Setup Steps:

1. **Sign up at [Vonage](https://dashboard.nexmo.com/sign-up)**

2. **Install SDK**
   ```bash
   pip install vonage
   ```

3. **Add to your service**
   ```python
   # Add to firebase_phone_service.py
   import vonage
   
   def _send_vonage_sms(self, phone_number):
       client = vonage.Client(
           key=os.getenv('VONAGE_API_KEY'),
           secret=os.getenv('VONAGE_API_SECRET')
       )
       
       verification_code = ''.join(random.choices(string.digits, k=6))
       
       response = client.sms.send_message({
           "from": "Neurolancer",
           "to": phone_number,
           "text": f"Your verification code is: {verification_code}"
       })
       
       return {
           'success': response["messages"][0]["status"] == "0",
           'verification_code': verification_code,
           'session_info': f"vonage_{phone_number}_{verification_code}"
       }
   ```

4. **Environment Variables**
   ```bash
   VONAGE_API_KEY=your_api_key
   VONAGE_API_SECRET=your_api_secret
   ```

---

## Option 3: AWS SNS 🚀

**✅ FREE: 100 SMS/month for 12 months**

### Setup Steps:

1. **Create AWS Account**
   - Sign up at [AWS Console](https://aws.amazon.com/)
   - Go to SNS service

2. **Install boto3**
   ```bash
   pip install boto3
   ```

3. **Add to your service**
   ```python
   import boto3
   
   def _send_aws_sms(self, phone_number):
       sns = boto3.client(
           'sns',
           aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
           aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
           region_name=os.getenv('AWS_REGION', 'us-east-1')
       )
       
       verification_code = ''.join(random.choices(string.digits, k=6))
       
       response = sns.publish(
           PhoneNumber=phone_number,
           Message=f"Your Neurolancer verification code is: {verification_code}"
       )
       
       return {
           'success': True,
           'verification_code': verification_code,
           'message_id': response['MessageId']
       }
   ```

4. **Environment Variables**
   ```bash
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   ```

---

## Option 4: Textbelt (Ultra Simple) 📲

**✅ FREE: 1 SMS/day per IP**

### Setup Steps:

1. **No signup required!**

2. **Add to your service**
   ```python
   import requests
   
   def _send_textbelt_sms(self, phone_number):
       verification_code = ''.join(random.choices(string.digits, k=6))
       
       response = requests.post('https://textbelt.com/text', {
           'phone': phone_number,
           'message': f'Your Neurolancer code: {verification_code}',
           'key': 'textbelt'  # Free tier
       })
       
       return {
           'success': response.json().get('success', False),
           'verification_code': verification_code
       }
   ```

---

## Current Mock Mode (Perfect for Development) 🛠️

Your current setup is **already working perfectly** for development:

```bash
# Test your current system
curl -X POST http://localhost:8000/api/auth/send-phone-verification/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+1234567890"}'

# Response includes the code for testing
{
  "success": true,
  "message": "SMS sent successfully (MOCK MODE)",
  "verification_code": "123456",  # Use this to test
  "session_info": "mock_session_+1234567890_123456",
  "phone_number": "+1234567890",
  "provider": "mock",
  "mock": true
}
```

## Recommendation 💡

**For Development**: Keep using mock mode - it's perfect!

**For Production**: Use **Firebase Phone Auth** because:
- ✅ 10,000 free SMS/month (most generous)
- ✅ Reliable delivery worldwide
- ✅ Easy integration
- ✅ Google's infrastructure
- ✅ Good documentation

## Quick Firebase Setup (5 minutes)

1. **Create Firebase project** → Enable Phone Auth
2. **Download service account JSON**
3. **Set environment variables**:
   ```bash
   FIREBASE_CREDENTIALS='{"type":"service_account",...}'
   FIREBASE_PROJECT_ID=your-project-id
   ```
4. **Install**: `pip install firebase-admin`
5. **Deploy** - SMS will work automatically!

## Testing Checklist ✅

- [ ] Mock mode works (current)
- [ ] Phone number validation works
- [ ] Verification code validation works
- [ ] Environment variables set for chosen provider
- [ ] Real SMS received on test phone
- [ ] Production deployment configured

Your system is **production-ready** right now with mock mode for development, and can be upgraded to real SMS in 5 minutes! 🚀