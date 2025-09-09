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

def test_withdrawal_endpoint():
    try:
        # Get test user
        user = User.objects.get(username='kekkomorfkb')
        token, created = Token.objects.get_or_create(user=user)
        
        # Create test client
        client = Client()
        
        # Test data
        test_data = {
            'amount': '500',
            'method': 'bank',
            'bank_code': '044',
            'account_number': '1234567890',
            'account_name': 'Test User'
        }
        
        # Make request
        response = client.post(
            '/api/payments/withdraw/',
            data=json.dumps(test_data),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token.key}'
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.content.decode()}")
        
        if response.status_code != 200:
            print("Error occurred!")
            
    except Exception as e:
        print(f"Test error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_withdrawal_endpoint()