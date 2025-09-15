#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.sms_service import SMSService

def test_sms():
    print("🧪 Testing SMS Service...")
    
    # Test phone number (replace with your actual number)
    phone_number = input("Enter phone number (with country code, e.g., +1234567890): ").strip()
    
    if not phone_number.startswith('+'):
        print("❌ Phone number must include country code (e.g., +1234567890)")
        return
    
    print(f"📱 Sending SMS to {phone_number}...")
    
    # Send SMS
    result = SMSService.send_verification_code(phone_number)
    
    print("\n📋 SMS Result:")
    print(f"Success: {result.get('success')}")
    print(f"Message: {result.get('message')}")
    print(f"Provider: {result.get('provider')}")
    
    if result.get('success'):
        if result.get('provider') == 'twilio_verify':
            print("✅ Real SMS sent via Twilio!")
            print(f"Verification SID: {result.get('verification_sid')}")
        else:
            print("⚠️ Mock SMS (development mode)")
            print(f"Verification Code: {result.get('verification_code')}")
    else:
        print(f"❌ Failed: {result.get('error')}")

if __name__ == "__main__":
    test_sms()