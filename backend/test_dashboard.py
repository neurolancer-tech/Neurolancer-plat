#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import RequestFactory
from rest_framework.authtoken.models import Token
from api.views import dashboard_stats

# Test dashboard API for kekkomorfkb
try:
    user = User.objects.get(username='kekkomorfkb')
    token, created = Token.objects.get_or_create(user=user)
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.get('/api/dashboard/stats/')
    request.user = user
    
    # Call the dashboard_stats function
    response = dashboard_stats(request)
    
    print(f"Dashboard API Response for {user.username}:")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        print(f"User Type: {data.get('user_type')}")
        print(f"Total Earnings: ${data.get('total_earnings', 0)}")
        print(f"Available Balance: ${data.get('available_balance', 0)}")
        print(f"Completed Orders: {data.get('completed_orders', 0)}")
        print(f"Total Gigs: {data.get('total_gigs', 0)}")
        
        if 'debug_info' in data:
            debug = data['debug_info']
            print(f"\nDebug Info:")
            print(f"  Calculated Earnings: ${debug.get('calculated_earnings', 0)}")
            print(f"  Profile Earnings: ${debug.get('profile_earnings', 0)}")
            print(f"  Orders Found: {debug.get('orders_found', 0)}")
    else:
        print(f"Error: {response.data}")

except User.DoesNotExist:
    print("User 'kekkomorfkb' not found")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()