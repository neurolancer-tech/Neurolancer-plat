#!/usr/bin/env python3
"""
Test the contact and feedback endpoints directly
"""

import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser
from api.views import submit_contact_form, submit_feedback_form
import json

def test_contact_endpoint():
    """Test contact form endpoint"""
    print("Testing contact form endpoint...")
    
    factory = RequestFactory()
    data = {
        'name': 'Test User',
        'email': 'test@example.com',
        'subject': 'general',
        'message': 'This is a test message.'
    }
    
    request = factory.post('/api/contact/submit/', 
                          data=json.dumps(data),
                          content_type='application/json')
    request.user = AnonymousUser()
    
    try:
        response = submit_contact_form(request)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.data}")
        
        if response.status_code == 200:
            print("[PASS] Contact endpoint test PASSED")
        else:
            print("[FAIL] Contact endpoint test FAILED")
            
    except Exception as e:
        print(f"[ERROR] Contact endpoint ERROR: {e}")
        import traceback
        traceback.print_exc()

def test_feedback_endpoint():
    """Test feedback form endpoint"""
    print("\nTesting feedback form endpoint...")
    
    factory = RequestFactory()
    data = {
        'name': 'Test User',
        'email': 'test@example.com',
        'feedback_type': 'suggestion',
        'rating': 4,
        'message': 'This is test feedback.'
    }
    
    request = factory.post('/api/feedback/submit/', 
                          data=json.dumps(data),
                          content_type='application/json')
    request.user = AnonymousUser()
    
    try:
        response = submit_feedback_form(request)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.data}")
        
        if response.status_code == 200:
            print("[PASS] Feedback endpoint test PASSED")
        else:
            print("[FAIL] Feedback endpoint test FAILED")
            
    except Exception as e:
        print(f"[ERROR] Feedback endpoint ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("Testing Contact and Feedback Endpoints")
    print("=" * 50)
    
    test_contact_endpoint()
    test_feedback_endpoint()
    
    print("\n" + "=" * 50)
    print("Testing completed!")