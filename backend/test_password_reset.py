#!/usr/bin/env python
"""
Quick test script to verify password reset functionality
Run this from the Django project directory: python test_password_reset.py
"""

import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from api.models import UserProfile

def test_password_reset():
    # Get a test user (replace with your username)
    username = input("Enter username to test: ").strip()
    
    try:
        user = User.objects.get(username=username)
        print(f"Found user: {user.username}")
        print(f"User is active: {user.is_active}")
        
        # Test current password
        current_password = input("Enter current password: ").strip()
        
        # Test authentication
        auth_result = authenticate(username=username, password=current_password)
        print(f"Authentication result: {auth_result}")
        
        # Test direct password check
        password_check = user.check_password(current_password)
        print(f"Direct password check: {password_check}")
        
        if auth_result or password_check:
            print("✅ Password authentication is working correctly")
        else:
            print("❌ Password authentication failed")
            
            # Try to set a new password
            new_password = input("Enter new password to set: ").strip()
            user.set_password(new_password)
            user.save()
            user.refresh_from_db()
            
            print("Password updated. Testing new password...")
            
            # Test new password
            new_auth = authenticate(username=username, password=new_password)
            new_check = user.check_password(new_password)
            
            print(f"New password authentication: {new_auth}")
            print(f"New password direct check: {new_check}")
            
    except User.DoesNotExist:
        print(f"User '{username}' not found")

if __name__ == "__main__":
    test_password_reset()