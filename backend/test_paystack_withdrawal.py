#!/usr/bin/env python
import os
import sys
import django
import json

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

def test_paystack_withdrawal():
    try:
        # Get test user
        user = User.objects.get(username='kekkomorfkb')
        token, created = Token.objects.get_or_create(user=user)
        
        # Create test client
        client = Client()
        
        # Test data with Kenyan bank details
        test_data = {
            'amount': '500',  # 500 KES
            'bank_code': '01',  # Standard Chartered Bank Kenya
            'account_number': '0100555000001',  # Test account number
            'account_name': 'Test User Account'
        }
        
        print("Testing Paystack withdrawal with test data:")
        print(json.dumps(test_data, indent=2))
        
        # Make request
        response = client.post(
            '/api/payments/withdraw/',
            data=json.dumps(test_data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}'
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {response.content.decode()}")
        
        if response.status_code == 200:
            print("\nPaystack withdrawal test successful!")
        else:
            print("\nPaystack withdrawal test failed!")
            
    except Exception as e:
        print(f"Test error: {e}")
        import traceback
        traceback.print_exc()

def test_banks_endpoint():
    try:
        client = Client()
        
        response = client.get('/api/payments/banks/')
        
        print(f"\nBanks endpoint - Status Code: {response.status_code}")
        if response.status_code == 200:
            data = json.loads(response.content.decode())
            if data.get('status') == 'success':
                banks = data.get('data', [])
                print(f"Found {len(banks)} banks")
                # Show first 5 banks
                for bank in banks[:5]:
                    print(f"  - {bank.get('name')} ({bank.get('code')})")
            else:
                print(f"Banks response: {response.content.decode()}")
        else:
            print(f"Banks error: {response.content.decode()}")
            
    except Exception as e:
        print(f"Banks test error: {e}")

if __name__ == '__main__':
    print("=== Testing Paystack Withdrawal System ===")
    test_banks_endpoint()
    test_paystack_withdrawal()