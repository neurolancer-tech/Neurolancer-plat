# Render Environment Variables

Add these environment variables to your Render deployment:

## Twilio SMS Configuration

| Variable Name | Value |
|---------------|-------|
| `TWILIO_ACCOUNT_SID` | `<your_twilio_account_sid>` |
| `TWILIO_AUTH_TOKEN` | `<your_twilio_auth_token>` |
| `TWILIO_VERIFY_SERVICE_SID` | `<your_twilio_verify_service_sid>` |

## How to Add in Render:

1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable with its corresponding value
6. Deploy the changes

## Status:
- ✅ Credentials removed from code
- ✅ Environment variables configured
- ✅ Ready for secure deployment