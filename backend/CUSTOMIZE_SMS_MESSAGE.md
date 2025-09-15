# Customize SMS Message Template

## 🔧 Current Issue
SMS sends as: "your(sample test ) verification code is: XXXXXX"

## ✅ Solution: Update Twilio Verify Service Template

### 1. Go to Twilio Console
1. Login to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Verify** → **Services**
3. Click on your service: `VAff7eb489cf64e2df684b828bc8a1a2e3`

### 2. Customize Message Template
1. Go to **Messaging** tab
2. Find **SMS Template** section
3. Replace the default template with:

```
Your Neurolancer verification code is: {{code}}
```

Or use this professional template:
```
{{code}} is your Neurolancer verification code. Valid for 10 minutes. Don't share this code.
```

### 3. Remove "(SAMPLE TEST)" Text
In the **General** tab:
- Update **Service Friendly Name** from `Sample Test` to: `Neurolancer`
- This removes the "(SAMPLE TEST)" from messages

### 4. Alternative: Custom Brand Name
In the **General** tab:
- Update **Service Name** to: `Neurolancer`
- This will show as: "Your Neurolancer verification code is: XXXXXX"

## 🚀 Result
After updating, SMS will send as:
```
Your Neurolancer verification code is: 123456
```

## ⚠️ Note
- Changes take effect immediately
- No code changes needed
- Template supports {{code}} placeholder only