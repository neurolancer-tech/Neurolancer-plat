#!/usr/bin/env python
"""
Test SMS functionality
Run this script to test SMS sending without going through the full API
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.sms_service import SMSService

def test_sms_service():
    """Test the SMS service with a phone number"""
    
    print("🧪 Testing SMS Service")
    print("=" * 50)
    
    # Test phone number (replace with your actual number for testing)
    test_phone = input("Enter phone number to test (with country code, e.g., +1234567890): ").strip()
    
    if not test_phone:
        test_phone = "+1234567890"  # Default test number
        print(f"Using default test number: {test_phone}")
    
    print(f"\n📱 Sending SMS to: {test_phone}")
    
    # Send verification code
    result = SMSService.send_verification_code(test_phone)
    
    print("\n📤 Send Result:")
    print("-" * 30)
    for key, value in result.items():
        print(f"{key}: {value}")
    
    if result['success']:
        print(f"\n✅ SMS sent successfully via {result.get('provider', 'unknown')} provider!")
        
        # Get the verification code for testing
        if 'verification_code' in result:
            verification_code = result['verification_code']
            session_info = result['session_info']
            
            print(f"\n🔢 Verification Code: {verification_code}")
            print(f"🔗 Session Info: {session_info}")
            
            # Test verification
            print(f"\n🔍 Testing verification...")
            verify_result = SMSService.verify_code(session_info, verification_code)
            
            print("\n📥 Verify Result:")
            print("-" * 30)
            for key, value in verify_result.items():
                print(f"{key}: {value}")
            
            if verify_result['success'] and verify_result['verified']:
                print("\n✅ Verification successful!")
            else:
                print("\n❌ Verification failed!")
        else:
            print("\n📱 Real SMS sent! Check your phone for the verification code.")
            print("💡 To test verification, use the code you received via SMS.")
    else:
        print(f"\n❌ SMS sending failed: {result.get('message', 'Unknown error')}")

def test_verification_only():
    """Test verification with manual input"""
    print("\n🔍 Manual Verification Test")
    print("=" * 50)
    
    session_info = input("Enter session info: ").strip()
    code = input("Enter verification code: ").strip()
    
    if session_info and code:
        result = SMSService.verify_code(session_info, code)
        
        print("\n📥 Verify Result:")
        print("-" * 30)
        for key, value in result.items():
            print(f"{key}: {value}")
        
        if result['success'] and result['verified']:
            print("\n✅ Verification successful!")
        else:
            print("\n❌ Verification failed!")
    else:
        print("❌ Session info and code are required!")

if __name__ == "__main__":
    print("🚀 Neurolancer SMS Service Test")
    print("=" * 50)
    
    # Check if Twilio is configured
    from django.conf import settings
    
    twilio_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
    twilio_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
    twilio_phone = getattr(settings, 'TWILIO_PHONE_NUMBER', None)
    
    if twilio_sid and twilio_token and twilio_phone:
        print("✅ Twilio credentials found - Real SMS will be sent!")
        print(f"📞 From number: {twilio_phone}")
    else:
        print("⚠️  Twilio credentials not found - Mock SMS will be used")
        print("💡 Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable real SMS")
    
    print("\nChoose test option:")
    print("1. Send SMS and test verification")
    print("2. Test verification only (manual)")
    print("3. Exit")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        test_sms_service()
    elif choice == "2":
        test_verification_only()
    elif choice == "3":
        print("👋 Goodbye!")
    else:
        print("❌ Invalid choice!")