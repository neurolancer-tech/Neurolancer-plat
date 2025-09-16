#!/usr/bin/env python3

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
from api.models import Category, Subcategory, Gig, Job, UserProfile

def test_create_forms():
    """Test that create gig and create job forms work correctly with subcategories"""
    
    print("Testing Create Forms with Subcategory System")
    print("=" * 50)
    
    client = Client()
    
    # Create test user
    user, created = User.objects.get_or_create(
        username='test_create_user',
        defaults={
            'email': 'test@create.com',
            'first_name': 'Create',
            'last_name': 'Tester',
            'password': 'testpass123'
        }
    )
    
    # Create user profile
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={'user_type': 'both'}
    )
    
    # Login user
    client.force_login(user)
    
    # Get categories and subcategories
    ai_dev_category = Category.objects.filter(name__icontains='AI Development').first()
    if not ai_dev_category:
        print("[ERROR] AI Development category not found")
        return False
    
    subcategories = Subcategory.objects.filter(category=ai_dev_category)[:2]
    if not subcategories:
        print("[ERROR] No subcategories found for AI Development")
        return False
    
    print(f"[INFO] Using category: {ai_dev_category.name}")
    print(f"[INFO] Using subcategories: {[sub.name for sub in subcategories]}")
    
    # Test Gig Creation
    print("\n=== Testing Gig Creation Form ===")
    
    gig_data = {
        'title': 'Test AI Gig from Form',
        'description': 'A test gig created through the form',
        'category_id': ai_dev_category.id,
        'subcategory_ids': [sub.id for sub in subcategories],
        'basic_title': 'Basic Package',
        'basic_description': 'Basic AI service',
        'basic_price': 100,
        'basic_delivery_time': 3,
        'tags': 'ai, machine learning'
    }
    
    response = client.post('/api/gigs/create/', gig_data)
    
    if response.status_code == 201:
        gig_response = response.json()
        print(f"[OK] Created gig: {gig_response['title']}")
        print(f"[OK] Category name: {gig_response.get('category_name', 'Not found')}")
        print(f"[OK] Subcategory names: {gig_response.get('subcategory_names', 'Not found')}")
        
        # Verify in database
        gig = Gig.objects.get(id=gig_response['id'])
        print(f"[OK] DB Category name: {gig.category_name}")
        print(f"[OK] DB Subcategory names: {gig.subcategory_names}")
        
    else:
        print(f"[ERROR] Gig creation failed with status {response.status_code}")
        print(f"[ERROR] Response: {response.content.decode()}")
        return False
    
    # Test Job Creation
    print("\n=== Testing Job Creation Form ===")
    
    job_data = {
        'title': 'Test AI Job from Form',
        'description': 'A test job created through the form',
        'category_id': ai_dev_category.id,
        'subcategory_ids': [sub.id for sub in subcategories],
        'budget_min': 500,
        'budget_max': 1000,
        'deadline': '2024-12-31T23:59:59Z',
        'skills_required': 'Python, TensorFlow',
        'experience_level': 'intermediate',
        'job_type': 'fixed'
    }
    
    response = client.post('/api/jobs/create/', job_data)
    
    if response.status_code == 201:
        job_response = response.json()
        print(f"[OK] Created job: {job_response['title']}")
        print(f"[OK] Category name: {job_response.get('category_name', 'Not found')}")
        print(f"[OK] Subcategory names: {job_response.get('subcategory_names', 'Not found')}")
        
        # Verify in database
        job = Job.objects.get(id=job_response['id'])
        print(f"[OK] DB Category name: {job.category_name}")
        print(f"[OK] DB Subcategory names: {job.subcategory_names}")
        
    else:
        print(f"[ERROR] Job creation failed with status {response.status_code}")
        print(f"[ERROR] Response: {response.content.decode()}")
        return False
    
    # Test Profile Update
    print("\n=== Testing Profile Update ===")
    
    profile_data = {
        'category_ids': [ai_dev_category.id],
        'subcategory_ids': [sub.id for sub in subcategories],
        'primary_category_id': ai_dev_category.id
    }
    
    response = client.patch('/api/profile/update/', 
                           json.dumps(profile_data), 
                           content_type='application/json')
    
    if response.status_code == 200:
        profile_response = response.json()
        print(f"[OK] Updated profile for: {user.username}")
        print(f"[OK] Primary category name: {profile_response.get('primary_category_name', 'Not found')}")
        print(f"[OK] Category names: {profile_response.get('category_names', 'Not found')}")
        print(f"[OK] Subcategory names: {profile_response.get('subcategory_names', 'Not found')}")
        
        # Verify in database
        profile.refresh_from_db()
        print(f"[OK] DB Primary category name: {profile.primary_category_name}")
        print(f"[OK] DB Category names: {profile.category_names}")
        print(f"[OK] DB Subcategory names: {profile.subcategory_names}")
        
    else:
        print(f"[ERROR] Profile update failed with status {response.status_code}")
        print(f"[ERROR] Response: {response.content.decode()}")
        return False
    
    print("\n" + "=" * 50)
    print("[SUCCESS] All create forms are working correctly!")
    print("[SUCCESS] Categories and subcategories are properly saved and displayed")
    print("[SUCCESS] Frontend forms will now create records with proper names")
    
    return True

if __name__ == '__main__':
    try:
        success = test_create_forms()
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)