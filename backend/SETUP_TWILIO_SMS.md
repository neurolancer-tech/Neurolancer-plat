# Setup Real SMS with Twilio

## Current Status: ✅ READY FOR TWILIO INTEGRATION

The backend now supports real SMS sending via Twilio. Follow these steps to enable it:

## 1. Get Twilio Credentials

1. Sign up at [Twilio Console](https://console.twilio.com/)
2. Get your Account SID and Auth Token from the dashboard
3. Purchase a Twilio phone number

## 2. Install Twilio Library

```bash
cd backend
pip install twilio
```

## 3. Set Environment Variables

Add these to your environment (Render, Railway, etc.):

```bash
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Or add to your `.env` file for local development:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

## 4. Test SMS Functionality

### Test Endpoint
```bash
curl -X POST https://neurolancer-plat.onrender.com/api/auth/send-phone-verification/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+1234567890"}'
```

### Expected Response (with Twilio):
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "session_info": "twilio_session_+1234567890_123456",
  "phone_number": "+1234567890",
  "provider": "twilio",
  "message_sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

### Expected Response (without Twilio - Mock):
```json
{
  "success": true,
  "message": "SMS sent successfully (MOCK)",
  "verification_code": "123456",
  "session_info": "mock_session_+1234567890_123456",
  "phone_number": "+1234567890",
  "provider": "mock",
  "mock": true
}
```

## 5. Verify Code

```bash
curl -X POST https://neurolancer-plat.onrender.com/api/auth/verify-phone/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456",
    "session_info": "twilio_session_+1234567890_123456"
  }'
```

## 6. How It Works

### With Twilio Credentials:
1. Real SMS is sent via Twilio API
2. User receives actual SMS on their phone
3. Verification code is NOT returned in API response (security)
4. User enters the code they received via SMS

### Without Twilio Credentials (Development):
1. Mock SMS is logged to console
2. Verification code IS returned in API response for testing
3. No actual SMS is sent
4. Perfect for development and testing

## 7. Production Deployment

### On Render:
1. Go to your service dashboard
2. Click "Environment"
3. Add the three Twilio environment variables
4. Redeploy your service

### On Railway:
1. Go to your project
2. Click "Variables"
3. Add the three Twilio environment variables
4. Railway will auto-redeploy

### On Heroku:
```bash
heroku config:set TWILIO_ACCOUNT_SID=ACxxxxxxxx
heroku config:set TWILIO_AUTH_TOKEN=your_token
heroku config:set TWILIO_PHONE_NUMBER=+15551234567
```

## 8. Security Features

- ✅ Verification codes expire after 10 minutes
- ✅ Codes are 6 digits long and randomly generated
- ✅ Session info prevents code reuse
- ✅ Phone numbers are validated before sending
- ✅ Rate limiting can be added (recommended for production)

## 9. Cost Considerations

- Twilio SMS costs approximately $0.0075 per message in the US
- International rates vary by country
- Consider implementing rate limiting to prevent abuse
- Monitor usage in Twilio console

## 10. Troubleshooting

### SMS Not Received:
1. Check phone number format (must include country code)
2. Verify Twilio credentials are correct
3. Check Twilio console for delivery status
4. Ensure phone number is not blocked

### Mock Mode Still Active:
1. Verify environment variables are set correctly
2. Check server logs for Twilio initialization
3. Restart your application after setting variables

### Error Messages:
- "Twilio library not installed" → Run `pip install twilio`
- "Invalid phone number" → Use E.164 format (+1234567890)
- "Authentication failed" → Check Twilio credentials

## 11. Testing Checklist

- [ ] Environment variables set
- [ ] Twilio library installed
- [ ] Phone number in correct format
- [ ] SMS received on actual phone
- [ ] Verification works with received code
- [ ] Mock mode works without credentials
- [ ] Error handling works for invalid codes

## Ready to Go! 🚀

Your SMS system is now ready. Just add the Twilio credentials and you'll have real SMS verification working immediately!