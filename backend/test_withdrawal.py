#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile

# Test the withdrawal function
def test_withdrawal():
    try:
        # Get or create a test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com'}
        )
        
        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        print(f"User: {user.username}")
        print(f"Profile available_balance: {profile.available_balance}")
        print(f"Profile fields: {[field.name for field in UserProfile._meta.fields]}")
        
        # Test the conversion functions
        from api.payments import convert_kes_to_usd, convert_usd_to_kes
        
        test_amount = 1000  # 1000 KES
        usd_amount = convert_kes_to_usd(test_amount)
        print(f"1000 KES = ${usd_amount} USD")
        
        # Test if we can access the withdrawal function
        from api.payments import initiate_withdrawal
        print("Withdrawal function imported successfully")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_withdrawal()