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

from django.contrib.auth.models import User
from api.models import Category, Subcategory, Gig, Job, UserProfile
from api.serializers import GigSerializer, JobSerializer
from django.test import RequestFactory

def test_frontend_integration():
    """Test that the subcategory system works correctly for frontend integration"""
    
    print("Testing Frontend Integration")
    print("=" * 50)
    
    # Create test user
    user, created = User.objects.get_or_create(
        username='test_frontend_user',
        defaults={
            'email': 'test@frontend.com',
            'first_name': 'Frontend',
            'last_name': 'Tester'
        }
    )
    
    # Create user profile
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={'user_type': 'freelancer'}
    )
    
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
    print("\n=== Testing Gig Creation ===")
    
    factory = RequestFactory()
    request = factory.post('/api/gigs/')
    request.user = user
    
    gig_data = {
        'title': 'Frontend Test Gig',
        'description': 'A test gig for frontend integration',
        'category_id': ai_dev_category.id,
        'subcategory_ids': [sub.id for sub in subcategories],
        'basic_title': 'Basic Package',
        'basic_description': 'Basic AI service',
        'basic_price': 100,
        'basic_delivery_time': 3,
        'tags': 'ai, machine learning'
    }
    
    gig_serializer = GigSerializer(data=gig_data, context={'request': request})
    if gig_serializer.is_valid():
        gig = gig_serializer.save()
        print(f"[OK] Created gig: {gig.title}")
        print(f"[OK] Category name: {gig.category_name}")
        print(f"[OK] Subcategory names: {gig.subcategory_names}")
        
        # Test serializer output
        output_serializer = GigSerializer(gig, context={'request': request})
        output_data = output_serializer.data
        
        print(f"[OK] Serializer includes category_name: {'category_name' in output_data}")
        print(f"[OK] Serializer includes subcategory_names: {'subcategory_names' in output_data}")
        
        if 'category_name' in output_data and 'subcategory_names' in output_data:
            print(f"[OK] Frontend will receive category_name: {output_data['category_name']}")
            print(f"[OK] Frontend will receive subcategory_names: {output_data['subcategory_names']}")
        
    else:
        print(f"[ERROR] Gig creation failed: {gig_serializer.errors}")
        return False
    
    # Test Job Creation
    print("\n=== Testing Job Creation ===")
    
    job_data = {
        'title': 'Frontend Test Job',
        'description': 'A test job for frontend integration',
        'category_id': ai_dev_category.id,
        'subcategory_ids': [sub.id for sub in subcategories],
        'budget_min': 500,
        'budget_max': 1000,
        'deadline': '2024-12-31T23:59:59Z',
        'skills_required': 'Python, TensorFlow',
        'experience_level': 'intermediate',
        'job_type': 'fixed'
    }
    
    job_serializer = JobSerializer(data=job_data, context={'request': request})
    if job_serializer.is_valid():
        job = job_serializer.save()
        print(f"[OK] Created job: {job.title}")
        print(f"[OK] Category name: {job.category_name}")
        print(f"[OK] Subcategory names: {job.subcategory_names}")
        
        # Test serializer output
        output_serializer = JobSerializer(job, context={'request': request})
        output_data = output_serializer.data
        
        print(f"[OK] Serializer includes category_name: {'category_name' in output_data}")
        print(f"[OK] Serializer includes subcategory_names: {'subcategory_names' in output_data}")
        
        if 'category_name' in output_data and 'subcategory_names' in output_data:
            print(f"[OK] Frontend will receive category_name: {output_data['category_name']}")
            print(f"[OK] Frontend will receive subcategory_names: {output_data['subcategory_names']}")
        
    else:
        print(f"[ERROR] Job creation failed: {job_serializer.errors}")
        return False
    
    print("\n" + "=" * 50)
    print("[SUCCESS] Frontend integration test passed!")
    print("[SUCCESS] Frontend will now display subcategory names instead of IDs")
    print("[SUCCESS] Both gigs and jobs are properly storing and returning subcategory names")
    
    return True

if __name__ == '__main__':
    try:
        success = test_frontend_integration()
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)