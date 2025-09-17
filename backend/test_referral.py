#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from api.referral_service import ReferralService
from api.referral_models import ReferralSettings, ReferralCode
from django.contrib.auth.models import User

def test_referral_system():
    print("=== Referral System Test ===")
    
    # Test 1: Check referral settings
    print("\n1. Testing Referral Settings:")
    try:
        settings = ReferralSettings.get_settings()
        print(f"   [OK] Referral system active: {settings.is_active}")
        print(f"   [OK] Signup bonus: ${settings.signup_bonus_amount}")
        print(f"   [OK] Earnings percentage: {settings.earnings_percentage}%")
        print(f"   [OK] Min payout: ${settings.min_payout_amount}")
    except Exception as e:
        print(f"   [ERROR] Error: {e}")
    
    # Test 2: Create referral code
    print("\n2. Testing Referral Code Creation:")
    try:
        user = User.objects.first()
        if user:
            referral_code = ReferralService.create_referral_code(user)
            if referral_code:
                print(f"   [OK] Created referral code for {user.username}: {referral_code.code}")
                print(f"   [OK] Referral URL: {referral_code.referral_url}")
                print(f"   [OK] Total signups: {referral_code.total_signups}")
                print(f"   [OK] Total earnings: ${referral_code.total_earnings}")
            else:
                print("   [ERROR] Failed to create referral code")
        else:
            print("   [ERROR] No users found in database")
    except Exception as e:
        print(f"   [ERROR] Error: {e}")
    
    # Test 3: Check existing referral codes
    print("\n3. Testing Existing Referral Codes:")
    try:
        codes = ReferralCode.objects.all()[:5]
        print(f"   [OK] Found {codes.count()} referral codes")
        for code in codes:
            print(f"   - {code.user.username}: {code.code} ({code.total_signups} signups)")
    except Exception as e:
        print(f"   [ERROR] Error: {e}")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_referral_system()