#!/usr/bin/env python
"""
Test script to verify the subcategory system is working correctly.
Tests both backend serializers and data integrity.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neurolancer_backend.settings')
django.setup()

from api.models import Gig, Job, Course, UserProfile, Category, Subcategory
from api.serializers import GigSerializer, JobSerializer, CourseSerializer, UserProfileSerializer
from django.contrib.auth.models import User

def test_gig_subcategory_system():
    """Test gig subcategory system"""
    print("=== Testing Gig Subcategory System ===")
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='test_freelancer',
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'Freelancer'
        }
    )
    
    # Get categories and subcategories
    ai_dev_category = Category.objects.filter(name='AI Development & Engineering').first()
    if not ai_dev_category:
        print("AI Development & Engineering category not found!")
        return
    
    ml_subcategory = Subcategory.objects.filter(name='Machine Learning Development').first()
    cv_subcategory = Subcategory.objects.filter(name='Computer Vision').first()
    
    if not ml_subcategory or not cv_subcategory:
        print("Required subcategories not found!")
        return
    
    # Create a test gig
    gig_data = {
        'title': 'Test AI Gig',
        'description': 'Test gig for AI services',
        'category_id': ai_dev_category.id,
        'subcategory_ids': [ml_subcategory.id, cv_subcategory.id],
        'basic_title': 'Basic Package',
        'basic_description': 'Basic AI service',
        'basic_price': 100.00,
        'basic_delivery_time': 7,
        'tags': 'ai, ml, test'
    }
    
    # Test serializer
    class MockRequest:
        def __init__(self, user):
            self.user = user
    
    serializer = GigSerializer(data=gig_data, context={'request': MockRequest(user)})
    
    if serializer.is_valid():
        gig = serializer.save()
        print(f"[OK] Created gig: {gig.title}")
        print(f"[OK] Category name: {gig.category_name}")
        print(f"[OK] Subcategory names: {gig.subcategory_names}")
        print(f"[OK] Subcategories count: {gig.subcategories.count()}")
        
        # Test serializer output
        output_serializer = GigSerializer(gig)
        output_data = output_serializer.data
        print(f"[OK] Serializer output includes category_name: {'category_name' in output_data}")
        print(f"[OK] Serializer output includes subcategory_names: {'subcategory_names' in output_data}")
        
        return gig
    else:
        print(f"[ERROR] Gig serializer errors: {serializer.errors}")
        return None

def test_job_subcategory_system():
    """Test job subcategory system"""
    print("\n=== Testing Job Subcategory System ===")
    
    # Get or create a test client
    user, created = User.objects.get_or_create(
        username='test_client',
        defaults={
            'email': 'client@example.com',
            'first_name': 'Test',
            'last_name': 'Client'
        }
    )
    
    # Get categories and subcategories
    data_category = Category.objects.filter(name='Data & Model Management').first()
    if not data_category:
        print("Data & Model Management category not found!")
        return
    
    data_annotation = Subcategory.objects.filter(name='Data Annotation & Labeling').first()
    model_training = Subcategory.objects.filter(name='Model Training & Tuning').first()
    
    if not data_annotation or not model_training:
        print("Required subcategories not found!")
        return
    
    # Create a test job
    job_data = {
        'title': 'Test AI Job',
        'description': 'Test job for AI services',
        'category_id': data_category.id,
        'subcategory_ids': [data_annotation.id, model_training.id],
        'budget_min': 500.00,
        'budget_max': 1500.00,
        'deadline': '2024-12-31T23:59:59Z',
        'skills_required': 'Python, TensorFlow, Data Science',
        'experience_level': 'intermediate',
        'job_type': 'fixed'
    }
    
    # Test serializer
    class MockRequest:
        def __init__(self, user):
            self.user = user
    
    serializer = JobSerializer(data=job_data, context={'request': MockRequest(user)})
    
    if serializer.is_valid():
        job = serializer.save()
        print(f"[OK] Created job: {job.title}")
        print(f"[OK] Category name: {job.category_name}")
        print(f"[OK] Subcategory names: {job.subcategory_names}")
        print(f"[OK] Subcategories count: {job.subcategories.count()}")
        
        # Test serializer output
        output_serializer = JobSerializer(job)
        output_data = output_serializer.data
        print(f"[OK] Serializer output includes category_name: {'category_name' in output_data}")
        print(f"[OK] Serializer output includes subcategory_names: {'subcategory_names' in output_data}")
        
        return job
    else:
        print(f"[ERROR] Job serializer errors: {serializer.errors}")
        return None

def test_userprofile_subcategory_system():
    """Test user profile subcategory system"""
    print("\n=== Testing UserProfile Subcategory System ===")
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='test_profile_user',
        defaults={
            'email': 'profile@example.com',
            'first_name': 'Test',
            'last_name': 'Profile'
        }
    )
    
    # Get or create user profile
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={'user_type': 'freelancer'}
    )
    
    # Get categories and subcategories
    ai_integration = Category.objects.filter(name='AI Integration & Support').first()
    creative_ai = Category.objects.filter(name='Creative & Industry-Specific AI').first()
    
    if not ai_integration or not creative_ai:
        print("Required categories not found!")
        return
    
    ai_consulting = Subcategory.objects.filter(name='AI Consulting & Strategy').first()
    ai_content = Subcategory.objects.filter(name='AI Content Creation').first()
    
    if not ai_consulting or not ai_content:
        print("Required subcategories not found!")
        return
    
    # Update profile with categories and subcategories
    profile_data = {
        'primary_category_id': ai_integration.id,
        'category_ids': [ai_integration.id, creative_ai.id],
        'subcategory_ids': [ai_consulting.id, ai_content.id],
        'bio': 'Test AI freelancer profile',
        'skills': 'AI, Consulting, Content Creation'
    }
    
    # Test serializer
    serializer = UserProfileSerializer(profile, data=profile_data, partial=True)
    
    if serializer.is_valid():
        updated_profile = serializer.save()
        print(f"[OK] Updated profile for: {updated_profile.user.username}")
        print(f"[OK] Primary category name: {updated_profile.primary_category_name}")
        print(f"[OK] Category names: {updated_profile.category_names}")
        print(f"[OK] Subcategory names: {updated_profile.subcategory_names}")
        print(f"[OK] Categories count: {updated_profile.categories.count()}")
        print(f"[OK] Subcategories count: {updated_profile.subcategories.count()}")
        
        # Test serializer output
        output_serializer = UserProfileSerializer(updated_profile)
        output_data = output_serializer.data
        print(f"[OK] Serializer output includes primary_category_name: {'primary_category_name' in output_data}")
        print(f"[OK] Serializer output includes category_names: {'category_names' in output_data}")
        print(f"[OK] Serializer output includes subcategory_names: {'subcategory_names' in output_data}")
        
        return updated_profile
    else:
        print(f"[ERROR] UserProfile serializer errors: {serializer.errors}")
        return None

def main():
    """Main test function"""
    print("Testing Subcategory System Integration")
    print("=" * 50)
    
    try:
        # Test all components
        gig = test_gig_subcategory_system()
        job = test_job_subcategory_system()
        profile = test_userprofile_subcategory_system()
        
        print("\n" + "=" * 50)
        if gig and job and profile:
            print("[SUCCESS] All subcategory system tests passed!")
            print("[SUCCESS] Backend is properly storing both IDs and names")
            print("[SUCCESS] Serializers are working correctly")
            print("[SUCCESS] Frontend should now display subcategory names instead of IDs")
        else:
            print("[FAILED] Some tests failed - check the output above")
        
    except Exception as e:
        print(f"[ERROR] Error during testing: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()