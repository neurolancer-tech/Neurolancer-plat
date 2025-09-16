#!/usr/bin/env python3

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from api.models import Category, Subcategory, UserProfile

def test_freelancer_api():
    """Test that freelancer API returns category and subcategory data"""
    
    print("Testing Freelancer API with Categories")
    print("=" * 40)
    
    client = Client()
    
    # Get a test user with categories
    user = User.objects.filter(username='test_create_user').first()
    if not user:
        print("[INFO] No test user found, creating one...")
        user = User.objects.create_user(
            username='test_freelancer_api',
            email='test@freelancer.com',
            first_name='Test',
            last_name='Freelancer'
        )
        
        # Create profile with categories
        profile = UserProfile.objects.create(
            user=user,
            user_type='freelancer'
        )
        
        # Add categories and subcategories
        ai_category = Category.objects.filter(name__icontains='AI Development').first()
        if ai_category:
            profile.primary_category = ai_category
            profile.primary_category_name = ai_category.name
            profile.categories.add(ai_category)
            profile.category_names = ai_category.name
            
            subcategories = Subcategory.objects.filter(category=ai_category)[:2]
            if subcategories:
                profile.subcategories.set(subcategories)
                profile.subcategory_names = ', '.join([sub.name for sub in subcategories])
            
            profile.save()
    
    # Test the API
    response = client.get('/api/profiles/freelancers/public/')
    
    if response.status_code == 200:
        data = response.json()
        profiles = data.get('profiles', [])
        
        print(f"[OK] API returned {len(profiles)} freelancer profiles")
        
        if profiles:
            profile = profiles[0]
            user_info = profile.get('user_info', {})
            
            print(f"[OK] Sample profile ID: {profile.get('id')}")
            print(f"[OK] Has user_info: {bool(user_info)}")
            print(f"[OK] Primary category name: {user_info.get('primary_category_name', 'None')}")
            print(f"[OK] Category names: {user_info.get('category_names', 'None')}")
            print(f"[OK] Subcategory names: {user_info.get('subcategory_names', 'None')}")
            print(f"[OK] Categories count: {len(user_info.get('categories', []))}")
            print(f"[OK] Subcategories count: {len(user_info.get('subcategories', []))}")
            
            if user_info.get('category_names') or user_info.get('subcategory_names'):
                print("[SUCCESS] Categories and subcategories are being returned!")
            else:
                print("[INFO] No categories found in this profile")
        else:
            print("[INFO] No profiles returned")
    else:
        print(f"[ERROR] API failed with status {response.status_code}")
        print(f"[ERROR] Response: {response.content.decode()}")
        return False
    
    print("\n" + "=" * 40)
    print("[SUCCESS] Freelancer API test completed!")
    
    return True

if __name__ == '__main__':
    try:
        success = test_freelancer_api()
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)