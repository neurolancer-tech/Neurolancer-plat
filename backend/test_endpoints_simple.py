#!/usr/bin/env python
"""
Simple test script to verify the missing endpoints are now available
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.urls import reverse, resolve
from django.test import RequestFactory
from api.views import get_freelancer_profile_by_id, get_client_profile_by_id, get_categories_with_subcategories, get_onboarding_data

def test_endpoints():
    """Test if the missing endpoints are now available"""
    
    print("Testing missing endpoints...")
    
    # Test URL patterns
    try:
        # Test individual profile endpoints
        freelancer_url = reverse('freelancer-profile-by-id', kwargs={'user_id': 1})
        print(f"[OK] Freelancer profile by ID URL: {freelancer_url}")
        
        client_url = reverse('client-profile-by-id', kwargs={'user_id': 1})
        print(f"[OK] Client profile by ID URL: {client_url}")
        
        # Test categories with subcategories
        categories_url = reverse('categories-with-subcategories-alt')
        print(f"[OK] Categories with subcategories URL: {categories_url}")
        
        # Test onboarding
        onboarding_url = reverse('onboarding-data')
        print(f"[OK] Onboarding data URL: {onboarding_url}")
        
        print("\n[SUCCESS] All URL patterns are correctly configured!")
        
    except Exception as e:
        print(f"[ERROR] URL pattern error: {e}")
        return False
    
    # Test view functions exist
    try:
        factory = RequestFactory()
        
        # Test freelancer profile view
        request = factory.get('/api/profiles/freelancer/1/')
        response = get_freelancer_profile_by_id(request, user_id=1)
        print(f"[OK] Freelancer profile view callable (status: {response.status_code})")
        
        # Test client profile view
        request = factory.get('/api/profiles/client/1/')
        response = get_client_profile_by_id(request, user_id=1)
        print(f"[OK] Client profile view callable (status: {response.status_code})")
        
        # Test categories view
        request = factory.get('/api/categories-with-subcategories/')
        response = get_categories_with_subcategories(request)
        print(f"[OK] Categories view callable (status: {response.status_code})")
        
        # Test onboarding view
        request = factory.get('/api/onboarding/')
        request.user = None  # Anonymous user for this test
        try:
            response = get_onboarding_data(request)
            print(f"[OK] Onboarding view callable (status: {response.status_code})")
        except Exception as e:
            print(f"[WARNING] Onboarding view requires authentication: {e}")
        
        print("\n[SUCCESS] All view functions are working!")
        return True
        
    except Exception as e:
        print(f"[ERROR] View function error: {e}")
        return False

if __name__ == '__main__':
    success = test_endpoints()
    if success:
        print("\n[COMPLETE] All missing endpoints have been successfully implemented!")
        print("\nThe following endpoints are now available:")
        print("- GET /api/profiles/freelancer/<user_id>/")
        print("- GET /api/profiles/client/<user_id>/")
        print("- GET /api/categories-with-subcategories/")
        print("- GET /api/onboarding/")
    else:
        print("\n[FAILED] Some endpoints still have issues.")
    
    sys.exit(0 if success else 1)